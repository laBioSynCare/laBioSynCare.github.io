#!/usr/bin/env node
// Serve a built dist/ over plain HTTP and assert the application actually works
// as a static, credential-free deployment.
//
// The claim this defends is in docs/technical/PORTABLE_DEPLOYMENT.md: BSC Lab's
// core runs with no Firebase configuration and no application server. That was
// previously an argument from reading the code. This makes it a tested property.
//
// Deliberately dependency-free: Node's own http/fs only, so it runs anywhere the
// pinned toolchain runs and adds nothing to the supply chain.

import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'

const DIST = resolve(process.argv[2] ?? 'dist')

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.ttl': 'text/turtle', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.wav': 'audio/wav', '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json',
}

let failures = 0
const ok = (msg, detail = '') => console.log(`  ok   ${msg}${detail ? ` — ${detail}` : ''}`)
const bad = (msg, detail = '') => { failures++; console.log(`  FAIL ${msg}${detail ? ` — ${detail}` : ''}`) }

// A deliberately plain static host: no SPA rewrite, no fallback. If a route only
// works because everything returns index.html, that is not a static deployment.
function serve(port) {
  return new Promise((res) => {
    const server = createServer(async (req, response) => {
      const url = new URL(req.url, 'http://localhost')
      let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '')
      let file = join(DIST, path)
      try {
        if ((await stat(file)).isDirectory()) file = join(file, 'index.html')
      } catch {
        response.writeHead(404).end('not found')
        return
      }
      try {
        const body = await readFile(file)
        response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
        response.end(body)
      } catch {
        response.writeHead(404).end('not found')
      }
    })
    server.listen(port, '127.0.0.1', () => res(server))
  })
}

async function main() {
  if (!existsSync(DIST)) {
    console.error(`smoke-static: ${DIST} does not exist — run a build first.`)
    process.exit(1)
  }

  const port = 4179 + Math.floor(Math.random() * 200)
  const server = await serve(port)
  const base = `http://127.0.0.1:${port}`
  console.log(`smoke-static: serving ${DIST} at ${base}\n`)

  try {
    // 1. Every primary route serves its own prerendered HTML.
    const routes = [
      ['/', 'BSC Lab'],
      ['/graph/', 'Graph'],
      ['/creator/', 'Patch Studio'],
      ['/field/', 'Field'],
      ['/sparql/', 'SPARQL'],
      ['/presets/', 'Presets'],
      ['/logbook/', 'Logbook'],
      ['/about/', 'About'],
      ['/settings/', 'Settings'],
    ]
    for (const [route, marker] of routes) {
      const r = await fetch(base + route)
      const body = r.ok ? await r.text() : ''
      if (!r.ok) bad(`GET ${route}`, `status ${r.status}`)
      else if (!body.includes(marker)) bad(`GET ${route}`, `missing marker "${marker}"`)
      else ok(`GET ${route}`, `${r.status}, ${body.length} bytes`)
    }

    // 2. The server is honest: an unknown path must not return 200. Without this
    //    a fallback-everything host would make every assertion above vacuous.
    const missing = await fetch(`${base}/definitely-not-a-route-${Date.now()}/`)
    missing.status === 404
      ? ok('GET unknown route 404s', 'server is not blanket-200')
      : bad('GET unknown route', `expected 404, got ${missing.status}`)

    // 3. Ontology is served same-origin as static Turtle (COEP requirement).
    const ttl = await fetch(`${base}/ontology/sstim-core.ttl`)
    const ttlBody = ttl.ok ? await ttl.text() : ''
    // The file opens with a banner comment, so look for the prefix declarations
    // and a known class rather than requiring @prefix on line one.
    const looksLikeOntology = /^@prefix\s+sstim:/m.test(ttlBody) && ttlBody.includes('owl:Ontology')
    ttl.ok && looksLikeOntology
      ? ok('GET /ontology/sstim-core.ttl', `${ttlBody.length} bytes, prefixes + owl:Ontology present`)
      : bad('GET /ontology/sstim-core.ttl', ttl.ok ? 'body is not the SSTIM core ontology' : `status ${ttl.status}`)

    // 4. PWA assets present.
    for (const asset of ['/service-worker.js', '/manifest.webmanifest']) {
      const r = await fetch(base + asset)
      r.ok ? ok(`GET ${asset}`, `${r.status}`) : bad(`GET ${asset}`, `status ${r.status}`)
    }

    // 5. No credentials inlined. Vite loads .env from the project root in every
    //    mode, so this fails loudly if the build picked one up — which is exactly
    //    how an apparently "unset" build can still ship a key.
    const bundle = await import('node:fs/promises')
      .then(fs => fs.readdir(join(DIST, '_app/immutable'), { recursive: true }))
      .then(names => names.filter(n => n.endsWith('.js')))
    let leaked = []
    for (const name of bundle) {
      const text = await readFile(join(DIST, '_app/immutable', name), 'utf8')
      if (/AIza[0-9A-Za-z_-]{20,}/.test(text)) leaked.push(name)
    }
    leaked.length === 0
      ? ok('no Firebase API key inlined', `${bundle.length} bundle files scanned`)
      : bad('Firebase API key inlined', leaked.join(', '))

    // 6. The unconfigured path shipped: the app has a defined behaviour with no
    //    Firebase rather than crashing on a missing global.
    const hasGuard = (await Promise.all(
      bundle.map(n => readFile(join(DIST, '_app/immutable', n), 'utf8')),
    )).some(t => t.includes('Firebase is not configured'))
    hasGuard
      ? ok('unconfigured-Firebase guard present in bundle')
      : bad('unconfigured-Firebase guard missing from bundle')
  } finally {
    server.close()
  }

  console.log(`\nsmoke-static: ${failures === 0 ? 'PASS' : `FAIL (${failures})`}`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => { console.error(e); process.exit(1) })
