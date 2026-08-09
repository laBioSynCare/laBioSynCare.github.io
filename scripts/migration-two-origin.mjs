#!/usr/bin/env node
// Two-origin migration test: prove a person can leave one BSC Lab instance and
// arrive at another with everything intact.
//
// Why two ports rather than one: browsers key localStorage by *origin*, so
// http://127.0.0.1:4181 and http://127.0.0.1:4182 have genuinely separate
// storage. A unit round-trip in one process proves the format is symmetric;
// this proves an actual migration between separately hosted instances, which is
// the claim docs/technical/PORTABLE_DEPLOYMENT.md makes.
//
// Each origin also gets its own browser profile, so nothing can leak between
// them through a shared cache or profile directory.
//
// Usage:  node scripts/migration-two-origin.mjs [dist-dir]

import { createServer } from 'node:http'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { extname, join, normalize, resolve } from 'node:path'

const DIST = resolve(process.argv[2] ?? 'dist')
const EXPORT_MODULE = resolve('src/portability/instanceExport.js')
const IDENTITY_MODULE = resolve('src/identity/IdentityProvider.js')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT_A = 4181
const PORT_B = 4182

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.ttl': 'text/turtle',
  '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json',
}

// Records exactly as the application writes them, so the test migrates the real
// storage shape rather than an invention of its own.
const SEED = {
  'bsclab_logbook_v2': JSON.stringify({
    version: 2,
    logbooks: [{ id: 'lb-1', name: 'Field notes' }],
    entries: [
      { id: 'e-1', logbookId: 'lb-1', date: '2026-07-31', text: 'First session', tags: ['alpha'] },
      { id: 'e-2', logbookId: 'lb-1', date: '2026-07-31', text: 'Second session', tags: [] },
    ],
    activeBook: 'lb-1',
  }),
  'bsclab.annotations.v1': JSON.stringify([{
    id: 'local-annot-1', userId: 'local-device', userDisplayName: 'Ada',
    targetIri: 'https://w3id.org/sstim#Preset', annotationType: 'commenting',
    annotationText: 'Interesting band mapping', visibility: 'private',
    createdAt: '2026-07-31T09:00:00.000Z', updatedAt: '2026-07-31T09:00:00.000Z',
  }]),
  'bsclab.patchStudio.patches.v1': JSON.stringify([{
    id: 'local-patch-1', patchName: 'Migration Patch', model: 'patch-studio-model-1',
    patch: {
      model: 'patch-studio-model-1', patchName: 'Migration Patch',
      timing: { bpmEnabled: false, bpm: 60, beatsPerBar: 4, lengthSec: 900 },
      controlTracks: [{ id: 'ctl-1', type: 'Martigli', name: 'Primary' }],
      audioTracks: [{ id: 'audio-1', trackType: 'IsochronicTone', name: 'Tone' }],
      visualTracks: [], hapticTracks: [],
    },
    createdAt: '2026-07-31T09:00:00.000Z', updatedAt: '2026-07-31T09:00:00.000Z',
  }]),
  'bsclab.profile.v1': JSON.stringify({
    displayName: 'Ada Lovelace', bio: 'Sensory notes', affiliation: 'BSC Lab',
    email: '', updatedAt: '2026-07-31T09:00:00.000Z',
  }),
  'bsclab.skin': 'dusk',
}

// An account id that must never appear in the exported file. The logbook is
// keyed per account in storage; the export carries a scope instead.
const ACCOUNT_UID = 'firebase-uid-must-not-travel'
SEED[`bsclab_logbook_v2:${encodeURIComponent(ACCOUNT_UID)}`] = JSON.stringify({
  version: 2,
  logbooks: [{ id: 'lb-acc', name: 'Account book' }],
  entries: [{ id: 'e-acc', logbookId: 'lb-acc', date: '2026-07-31', text: 'Account entry', tags: [] }],
  activeBook: 'lb-acc',
})

/** Static server for one origin, plus the two injected harness routes. */
function serve(port, harnessHtml, payloadRef) {
  return new Promise((res) => {
    const server = createServer(async (req, response) => {
      const url = new URL(req.url, 'http://localhost')
      const send = (code, type, body) => {
        response.writeHead(code, { 'content-type': type })
        response.end(body)
      }

      if (req.method === 'POST' && url.pathname === '/report') {
        let body = ''
        req.on('data', (c) => { body += c })
        req.on('end', () => { payloadRef.reports.push(body); send(200, 'text/plain', 'ok') })
        return
      }
      if (url.pathname === '/harness.html') return send(200, 'text/html', harnessHtml)
      if (url.pathname === '/instanceExport.js') {
        return send(200, 'text/javascript', await readFile(EXPORT_MODULE))
      }
      // instanceExport shares the authoritative private-identity field list
      // with the application identity seam. Serve that source dependency too
      // so this browser harness exercises the real module graph rather than a
      // copied or rewritten export implementation.
      if (url.pathname === '/identity/IdentityProvider.js') {
        return send(200, 'text/javascript', await readFile(IDENTITY_MODULE))
      }
      if (url.pathname === '/payload.json') {
        return send(200, 'application/json', payloadRef.value ?? 'null')
      }

      let file = join(DIST, normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, ''))
      try {
        const body = await readFile(file)
        send(200, TYPES[extname(file)] ?? 'application/octet-stream', body)
      } catch {
        send(404, 'text/plain', 'not found')
      }
    })
    server.listen(port, '127.0.0.1', () => res(server))
  })
}

/** Run headless Chrome against a URL and return the rendered DOM. */
function launch(url, profileDir) {
  // Deliberately no --dump-dom. It makes Chrome print the DOM at load and exit,
  // which races the harness: instance B runs two SubtleCrypto digests *after*
  // load, and when Chrome wins, its POST never fires and this reads as a
  // timeout that says nothing about the cause. The race was silently being won
  // until it wasn't. Results arrive over the POST and Chrome is killed in the
  // `finally` below, so nothing needs it to exit on its own.
  return spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${profileDir}`, url,
  ], { stdio: ['ignore', 'ignore', 'ignore'] })
}

/** Wait for a harness to POST its result back, rather than guessing at timing. */
async function waitForReport(ref, index, seconds = 40) {
  for (let i = 0; i < seconds * 4; i++) {
    if (ref.reports.length > index) return ref.reports[index]
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error('the harness did not report within the time limit')
}

const harnessA = `<!doctype html><meta charset="utf-8"><title>A</title><body>
<pre id="payload"></pre><pre id="status"></pre>
<script type="module">
  import { buildInstanceExport } from '/instanceExport.js'
  const seed = ${JSON.stringify(SEED)}
  localStorage.clear()
  for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v)
  const envelope = await buildInstanceExport(localStorage, {
    uid: ${JSON.stringify(ACCOUNT_UID)}, appVersion: 'origin-a',
  })
  const body = JSON.stringify({ origin: location.origin, envelope })
  document.getElementById('payload').textContent = 'exported'
  await fetch('/report', { method: 'POST', body })
</script></body>`

const harnessB = `<!doctype html><meta charset="utf-8"><title>B</title><body>
<pre id="result"></pre>
<script type="module">
  import { applyInstanceExport, buildInstanceExport, parseInstanceExport }
    from '/instanceExport.js'
  const lines = []
  const check = (name, cond, detail = '') =>
    lines.push((cond ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''))
  try {
    localStorage.clear()
    check('instance B starts empty', localStorage.getItem('bsclab_logbook_v2') === null,
      'origin ' + location.origin)

    const text = await (await fetch('/payload.json')).text()
    const parsed = await parseInstanceExport(text)
    check('export from A verifies its checksum on B', true,
      parsed.checksum.slice(0, 12) + '…')

    // Import under a *different* account, as a real second instance would.
    const result = applyInstanceExport(localStorage, parsed, { uid: 'a-different-account' })

    const logbook = JSON.parse(localStorage.getItem('bsclab_logbook_v2'))
    check('logbook entries arrived', logbook.entries.length === 2,
      logbook.entries.length + ' entries')
    check('logbook text preserved',
      logbook.entries[0].text === 'First session', logbook.entries[0].text)

    const annots = JSON.parse(localStorage.getItem('bsclab.annotations.v1'))
    check('annotation arrived', annots.length === 1, annots[0].annotationText)

    const patches = JSON.parse(localStorage.getItem('bsclab.patchStudio.patches.v1'))
    check('patch arrived', patches.length === 1, patches[0].patchName)
    check('patch body intact',
      patches[0].patch.audioTracks.length === 1 &&
      patches[0].patch.controlTracks.length === 1,
      'audio + control tracks present')

    const profile = JSON.parse(localStorage.getItem('bsclab.profile.v1'))
    check('profile arrived', profile.displayName === 'Ada Lovelace', profile.displayName)
    check('preference arrived', localStorage.getItem('bsclab.skin') === 'dusk')
    check('restore counts reported', result.restoredLogbooks === 2 &&
      result.restoredAnnotations === 1 && result.restoredPatches === 1,
      JSON.stringify(result))

    // Account-scoped data follows the importing account, not the exporter's.
    check('account data re-keyed to the importer',
      localStorage.getItem('bsclab_logbook_v2:a-different-account') !== null &&
      localStorage.getItem('bsclab_logbook_v2:' + encodeURIComponent(${JSON.stringify(ACCOUNT_UID)})) === null)

    // Re-export from B must reproduce A's payload exactly.
    const back = await buildInstanceExport(localStorage, {
      uid: 'a-different-account', appVersion: 'origin-b',
    })
    check('re-export from B matches A byte-for-byte',
      back.checksum === parsed.checksum,
      back.checksum.slice(0, 12) + '… vs ' + parsed.checksum.slice(0, 12) + '…')
  } catch (e) {
    check('unexpected error', false, e.message)
  }
  document.getElementById('result').textContent = lines.join('\\n')
  await fetch('/report', { method: 'POST', body: JSON.stringify({ origin: location.origin, lines }) })
</script></body>`

async function main() {
  if (!existsSync(DIST)) {
    console.error(`migration: ${DIST} does not exist — run a build first.`)
    process.exit(1)
  }

  const payload = { value: null, reports: [] }
  const serverA = await serve(PORT_A, harnessA, payload)
  const serverB = await serve(PORT_B, harnessB, payload)
  const profileA = await mkdtemp(join(tmpdir(), 'bsc-a-'))
  const profileB = await mkdtemp(join(tmpdir(), 'bsc-b-'))
  let chromeA, chromeB

  try {
    console.log(`migration: instance A on :${PORT_A}, instance B on :${PORT_B}\n`)

    chromeA = launch(`http://127.0.0.1:${PORT_A}/harness.html`, profileA)
    const reportA = JSON.parse(await waitForReport(payload, 0))
    const envelopeText = JSON.stringify(reportA.envelope)
    payload.value = envelopeText
    console.log(`  ok   instance A (${reportA.origin}) exported ${envelopeText.length} bytes`)

    // The account identifier must not travel between instances.
    if (envelopeText.includes(ACCOUNT_UID)) {
      console.log('  FAIL the account identifier appeared in the exported file')
      process.exit(1)
    }
    console.log('  ok   no account identifier in the exported file')

    chromeB = launch(`http://127.0.0.1:${PORT_B}/harness.html`, profileB)
    const reportB = JSON.parse(await waitForReport(payload, 1))

    if (reportB.origin === reportA.origin) {
      console.log('  FAIL both harnesses ran on the same origin — not a migration')
      process.exit(1)
    }
    console.log(`  ok   instance B is a separate origin (${reportB.origin})`)

    for (const line of reportB.lines) {
      console.log('  ' + line.replace(/^PASS /, 'ok   '))
    }

    const failed = reportB.lines.filter((l) => l.startsWith('FAIL')).length
    console.log(`\nmigration: ${failed === 0 ? 'PASS' : `FAIL (${failed})`}`)
    process.exitCode = failed === 0 ? 0 : 1
  } finally {
    try { chromeA?.kill() } catch { /* already gone */ }
    try { chromeB?.kill() } catch { /* already gone */ }
    serverA.close(); serverB.close()
    // Chrome may still be flushing its profile directory as we exit; a cleanup
    // race must never turn a passing migration into a failure.
    for (const dir of [profileA, profileB]) {
      try { await rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) }
      catch { /* temp dir; the OS will reap it */ }
    }
  }
}

main().catch((e) => { console.error('migration:', e.message); process.exit(1) })
