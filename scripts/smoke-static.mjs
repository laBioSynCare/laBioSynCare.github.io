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
import { readFile, readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'
import { normalizeDeploymentBase } from '../deployment.config.js'

const DIST = resolve(process.argv[2] ?? 'dist')
const MOUNT = normalizeDeploymentBase(process.argv[3] ?? '')
const COMPLETE_ARTIFACT = process.argv.includes('--complete')

// The manifest states its runtime references relative to itself, so they are
// resolved here the way any consumer must: against the directory the manifest
// was fetched from, which is /ontology/.
const ontologyRef = (reference) => `/ontology/${reference}`

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.ttl': 'text/turtle', '.svg': 'image/svg+xml',
  '.jsonld': 'application/ld+json', '.rdf': 'application/rdf+xml',
  '.owl': 'application/rdf+xml',
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
      if (MOUNT && path !== MOUNT && !path.startsWith(`${MOUNT}/`)) {
        response.writeHead(404).end('outside deployment mount')
        return
      }
      if (MOUNT) path = path.slice(MOUNT.length) || '/'
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

  // A random port avoids collisions when runs overlap, but `fetch` refuses to
  // connect to any port on the WHATWG bad-port list — it fails with "bad port"
  // before a request is made, no matter that the server is listening. 4190
  // (ManageSieve) is the only such port in this range, and drawing it failed a
  // CI run once in roughly two hundred. Skip it rather than widen the range,
  // which would only move the problem.
  const BAD_PORTS = new Set([4190])
  let port = 4179 + Math.floor(Math.random() * 200)
  while (BAD_PORTS.has(port)) port = 4179 + Math.floor(Math.random() * 200)
  const server = await serve(port)
  const origin = `http://127.0.0.1:${port}`
  const base = `${origin}${MOUNT}`
  console.log(`smoke-static: serving ${DIST} at ${base || origin}\n`)

  try {
    // 1. Every primary route serves its own prerendered HTML.
    const routes = [
      ['/', 'SSTIM'],
      ['/graph/', 'Graph'],
      ['/creator/', 'Patch Studio'],
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

    // Former Field screens are compatibility aliases, not primary application
    // surfaces. Each prerendered page exposes its exact fallback/replace target;
    // browser acceptance separately proves the hydrated replace-navigation.
    const compatibilityRoutes = [
      ['/field/', '/creator/?starter=field'],
      ['/field/tree/', '/creator/?starter=tree'],
      ['/field/abstract/', '/creator/?starter=abstract'],
      ['/field/landscape/', '/creator/?starter=landscape'],
    ]
    for (const [route, target] of compatibilityRoutes) {
      const r = await fetch(base + route)
      const body = r.ok ? await r.text() : ''
      const mountedTarget = `${MOUNT}${target}`
      if (!r.ok) bad(`GET ${route}`, `status ${r.status}`)
      else if (!body.includes(mountedTarget)) bad(`GET ${route}`, `missing redirect target "${mountedTarget}"`)
      else ok(`GET ${route}`, `compatibility redirect to ${mountedTarget}`)
    }

    // 2. The server is honest: an unknown path must not return 200. Without this
    //    a fallback-everything host would make every assertion above vacuous.
    const missing = await fetch(`${base}/definitely-not-a-route-${Date.now()}/`)
    missing.status === 404
      ? ok('GET unknown route 404s', 'server is not blanket-200')
      : bad('GET unknown route', `expected 404, got ${missing.status}`)

    // 3. The manifest and every public ontology/profile distribution are served
    // same-origin. A single core sentinel missed the 0.12 stimulus-loader gap.
    const manifestResponse = await fetch(`${base}/ontology/manifest.json`)
    let ontologyManifest = null
    try {
      ontologyManifest = manifestResponse.ok ? await manifestResponse.json() : null
    } catch {
      ontologyManifest = null
    }
    ontologyManifest
      ? ok('GET /ontology/manifest.json', `${ontologyManifest.modules.length} modules`)
      : bad('GET /ontology/manifest.json', `status ${manifestResponse.status} or invalid JSON`)

    const publicSources = ontologyManifest
      ? [
          ...ontologyManifest.modules.map(module => [module.id, ontologyRef(module.runtime.url)]),
          ...ontologyManifest.profiles
            .filter(profile => profile.runtime?.url)
            .map(profile => [`profile:${profile.id}`, ontologyRef(profile.runtime.url)]),
        ]
      : []
    for (const [id, url] of publicSources) {
      const response = await fetch(base + url)
      const body = response.ok ? await response.text() : ''
      const looksLikeOntology = body.includes('owl:Ontology')
      response.ok && looksLikeOntology
        ? ok(`GET ${url}`, `${id}, ${body.length} bytes`)
        : bad(`GET ${url}`, response.ok ? 'body is not an ontology document' : `status ${response.status}`)
    }

    for (const asset of [
      '/build-info.json',
      '/ontology/manifest.schema.json',
      '/ontology/context.jsonld',
      '/ontology/void.ttl',
      '/schemas/preset.schema.json',
      '/schemas/session.schema.json',
      '/schemas/sstim-hed-event-map.json',
    ]) {
      const response = await fetch(base + asset)
      response.ok
        ? ok(`GET ${asset}`, response.headers.get('content-type') ?? '')
        : bad(`GET ${asset}`, `status ${response.status}`)
    }

    const instanceRoot = join(DIST, 'ontology', 'instances')
    const instanceFiles = existsSync(instanceRoot)
      ? (await readdir(instanceRoot, { recursive: true })).filter(path => path.endsWith('.ttl'))
      : []
    for (const instance of instanceFiles) {
      const url = `/ontology/instances/${instance.replaceAll('\\', '/')}`
      const response = await fetch(base + url)
      response.ok
        ? ok(`GET ${url}`, response.headers.get('content-type') ?? '')
        : bad(`GET ${url}`, `status ${response.status}`)
    }

    // 4. PWA assets present.
    for (const asset of ['/service-worker.js', '/manifest.webmanifest']) {
      const r = await fetch(base + asset)
      r.ok ? ok(`GET ${asset}`, `${r.status}`) : bad(`GET ${asset}`, `status ${r.status}`)
    }

    const pwaResponse = await fetch(`${base}/manifest.webmanifest`)
    const pwa = pwaResponse.ok ? await pwaResponse.json() : null
    const pwaUrl = new URL(`${base}/manifest.webmanifest`)
    const expectedScope = `${MOUNT}/`
    if (!pwa) {
      bad('PWA manifest parses', `status ${pwaResponse.status}`)
    } else {
      for (const field of ['id', 'start_url', 'scope']) {
        const resolved = new URL(pwa[field], pwaUrl).pathname
        resolved === expectedScope
          ? ok(`PWA ${field} stays in mount`, resolved)
          : bad(`PWA ${field} escaped mount`, `${resolved}, expected ${expectedScope}`)
      }
      for (const icon of pwa.icons ?? []) {
        const resolved = new URL(icon.src, pwaUrl).pathname
        resolved.startsWith(expectedScope)
          ? ok('PWA icon stays in mount', resolved)
          : bad('PWA icon escaped mount', resolved)
      }
    }

    // Worklets stay unbundled and must be served from the project mount with
    // the MIME types required by AudioWorklet and WebAssembly.
    for (const [asset, contentType] of [
      ['/worklets/bsc-voice.worklet.js', 'text/javascript'],
      ['/worklets/bsc-osc.wasm', 'application/wasm'],
      ['/audio/ocean.wav', 'audio/wav'],
    ]) {
      const response = await fetch(base + asset)
      const actual = response.headers.get('content-type') ?? ''
      response.ok && actual.startsWith(contentType)
        ? ok(`GET ${asset}`, actual)
        : bad(`GET ${asset}`, `status ${response.status}, content-type ${actual}`)
    }

    if (MOUNT) {
      for (const escaped of ['/', '/graph/', '/ontology/manifest.json', '/service-worker.js']) {
        const response = await fetch(origin + escaped)
        response.status === 404
          ? ok(`origin-root ${escaped} is not required`, '404')
          : bad(`origin-root ${escaped} unexpectedly served`, `status ${response.status}`)
      }
    }

    if (COMPLETE_ARTIFACT) {
      const generated = [
        '/ontology/sstim-full.owl',
        '/ontology/docs/',
        '/ontology/docs/vocab/',
        ...(ontologyManifest?.namespaceDocuments ?? []).flatMap(document =>
          Object.values(document.runtime).map(ontologyRef),
        ),
      ]
      for (const asset of generated) {
        const response = await fetch(base + asset)
        response.ok
          ? ok(`GET generated ${asset}`, response.headers.get('content-type') ?? '')
          : bad(`GET generated ${asset}`, `status ${response.status}`)
      }

      // WIDOCO's generated page has a directory tree of relative resources,
      // provenance pages, downloads, and the pyLODE cross-link. Crawl every
      // local href/src and prove it resolves inside this deployment mount.
      const docsUrl = new URL(`${base}/ontology/docs/`)
      const docsResponse = await fetch(docsUrl)
      const docsHtml = docsResponse.ok ? await docsResponse.text() : ''
      const uncommentedDocsHtml = docsHtml.replace(/<!--[\s\S]*?-->/g, '')
      const localReferences = [...uncommentedDocsHtml.matchAll(/(?:href|src)=["']([^"']+)["']/g)]
        .map(match => match[1])
        .filter(value => value && !value.startsWith('#'))
        .map(value => new URL(value, docsUrl))
        .filter(url => url.origin === origin)

      for (const url of new Map(localReferences.map(url => [url.href, url])).values()) {
        if (MOUNT && !url.pathname.startsWith(`${MOUNT}/`)) {
          bad('WIDOCO local link escaped mount', url.pathname)
          continue
        }
        const response = await fetch(url)
        response.ok
          ? ok('WIDOCO local link', url.pathname)
          : bad('WIDOCO local link missing', `${url.pathname}, status ${response.status}`)
      }
    }

    // 5. Firebase configuration matches what this deployment was given.
    //
    //    Two deployments publish this commit. The production owner site is
    //    configured with Firebase and its bundle is *supposed* to carry the web
    //    API key, which is a public client identifier, not a secret: access
    //    control lives in Firestore rules. The W3C project site is deliberately
    //    credential-free and must carry no key at all.
    //
    //    So the assertion is conditional, and it fails in both directions. An
    //    unconfigured build that ships a key means Vite picked up a stray .env,
    //    which is exactly how an apparently "unset" build leaks one. A
    //    configured build that ships none means the variables did not reach the
    //    build and sign-in would be broken on a site that offers it.
    const expectFirebase = process.env.SSTIM_EXPECT_FIREBASE === 'true'
    const bundle = await import('node:fs/promises')
      .then(fs => fs.readdir(join(DIST, '_app/immutable'), { recursive: true }))
      .then(names => names.filter(n => n.endsWith('.js')))
    let carrying = []
    for (const name of bundle) {
      const text = await readFile(join(DIST, '_app/immutable', name), 'utf8')
      if (/AIza[0-9A-Za-z_-]{20,}/.test(text)) carrying.push(name)
    }
    if (expectFirebase) {
      carrying.length > 0
        ? ok('Firebase config present, as this deployment is configured', carrying.join(', '))
        : bad('Firebase configured but no key reached the bundle', `${bundle.length} bundle files scanned`)
    } else {
      carrying.length === 0
        ? ok('no Firebase API key inlined', `${bundle.length} bundle files scanned`)
        : bad('Firebase API key inlined', carrying.join(', '))
    }

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
