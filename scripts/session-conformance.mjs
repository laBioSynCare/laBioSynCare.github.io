#!/usr/bin/env node
// Session-interchange conformance: package a patch on one instance, open it on
// another, and prove what survived.
//
// The companion to migration-two-origin.mjs. That script moves a *person's whole
// instance* between origins; this one moves a single *scientific object* and
// checks it at two declared levels:
//
//   Level 1 — semantic equivalence
//     The SSTIM projection is identical: same properties, same values, same
//     mapping report. This is what a third party querying the RDF would see.
//
//   Level 2 — execution-parameter equivalence
//     Every track, every parameter, every control link is bit-identical after
//     reconstruction through the editor's own draft model. This is what the
//     audio engine would actually play.
//
// Level 3 (comparing rendered signals within numerical tolerance) is deliberately
// not attempted. It needs deterministic offline rendering per engine, which does
// not exist yet, and claiming it on the strength of parameter equality would be
// dishonest. The report says so rather than leaving the omission to be noticed.
//
// Two ports, because browsers key storage by origin: 4183 and 4184 are genuinely
// separate instances, each with its own browser profile.
//
// Usage:  node scripts/session-conformance.mjs [dist-dir]

import { createServer } from 'node:http'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { extname, join, normalize, resolve } from 'node:path'

const DIST = resolve(process.argv[2] ?? 'dist')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT_A = 4183
const PORT_B = 4184

// Served to the harness so both origins run the *shipped* modules, not a copy.
// This must be the whole import closure: presetDraft.js pulls in tempo.js, and a
// missing entry surfaces only as a silent 404 and a harness that never reports.
const MODULES = {
  '/sessionPackage.js': resolve('src/portability/sessionPackage.js'),
  '/patchProjection.js': resolve('src/portability/patchProjection.js'),
  '/presetDraft.js': resolve('src/ui/creator/presetDraft.js'),
  '/tempo.js': resolve('src/ui/creator/tempo.js'),
}

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.ttl': 'text/turtle', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json', '.wav': 'audio/wav',
}

const PACKAGE_OPTIONS = {
  sessionIri: 'https://w3id.org/sstim/implementation/bsclab/session/conformance-1',
  created: '2026-07-31T00:00:00Z',
  bscLabCommit: 'conformance-harness',
  sstimRelease: '0.11.0',
}

// An identifier that exists on instance A and must never reach instance B.
const ACCOUNT_UID = 'firebase-uid-must-not-travel'

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
      if (MODULES[url.pathname]) {
        // Rewrite the relative import so the module graph resolves under the
        // flat paths this server exposes.
        const source = (await readFile(MODULES[url.pathname], 'utf8'))
          .replace(/from '\.\.\/ui\/creator\/presetDraft\.js'/g, "from '/presetDraft.js'")
          .replace(/from '\.\/patchProjection\.js'/g, "from '/patchProjection.js'")
        return send(200, 'text/javascript', source)
      }
      if (url.pathname === '/payload.json') {
        return send(200, 'application/json', payloadRef.value ?? 'null')
      }

      const file = join(DIST, normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, ''))
      try {
        send(200, TYPES[extname(file)] ?? 'application/octet-stream', await readFile(file))
      } catch {
        send(404, 'text/plain', 'not found')
      }
    })
    server.listen(port, '127.0.0.1', () => res(server))
  })
}

function launch(url, profileDir) {
  // Deliberately *no* --dump-dom here, unlike migration-two-origin.mjs.
  // --dump-dom makes Chrome print the DOM at load and exit, which kills the page
  // while this harness is still working: instance B does dynamic imports and
  // several SubtleCrypto digests after load, and its POST never fires. Instance A
  // is short enough to win that race, which is what made the failure look like a
  // timeout on B alone. Results arrive over the POST, and the process is killed
  // in the `finally` below, so nothing needs Chrome to exit on its own.
  return spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${profileDir}`, url,
  ], { stdio: ['ignore', process.env.BSC_DEBUG ? 'inherit' : 'ignore', process.env.BSC_DEBUG ? 'inherit' : 'ignore'] })
}

async function waitForReport(ref, index, seconds = 40) {
  for (let i = 0; i < seconds * 4; i++) {
    if (ref.reports.length > index) return ref.reports[index]
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error('the harness did not report within the time limit')
}

const OPTIONS_JSON = JSON.stringify(PACKAGE_OPTIONS)

// ── instance A: author a patch and package it ───────────────────────────────

const harnessA = `<!doctype html><meta charset="utf-8"><title>A</title><body>
<pre id="status"></pre>
<script type="module">
  import { serialiseSessionPackage } from '/sessionPackage.js'
  import { buildPatchExport, createDraft, createAudioTrack, createVisualTrack,
           createControlTrack, createHapticTrack, createMod } from '/presetDraft.js'

  // A deliberately non-trivial patch: every track family, plus modulation, so
  // the comparison on B is not vacuous.
  const draft = createDraft()
  draft.patchName = 'Conformance Reference Session'
  const control = createControlTrack('Martigli')
  draft.controlTracks = [control, createControlTrack('Symmetry')]
  draft.audioTracks = [
    ...draft.audioTracks,
    createAudioTrack('BinauralBeat'),
    createAudioTrack('Noise'),
    createAudioTrack('Drone'),
  ]
  draft.visualTracks = [createVisualTrack('Geometry'), createVisualTrack('Particles')]
  draft.hapticTracks = [createHapticTrack('Vibration')]
  // Link a modulation so control-track wiring is part of what must survive.
  const target = draft.audioTracks[0].params.gain
  if (target) target.mods = [createMod(control.id, 0.4)]

  // Something account-scoped exists on this origin; it must not enter the package.
  localStorage.setItem('bsclab.profile.v1', JSON.stringify({ uid: ${JSON.stringify(ACCOUNT_UID)} }))

  const patch = buildPatchExport(draft)
  const pkg = await serialiseSessionPackage(patch, ${OPTIONS_JSON})

  document.getElementById('status').textContent = 'packaged'
  await fetch('/report', { method: 'POST', body: JSON.stringify({
    origin: location.origin, pkg, patch,
  }) })
</script></body>`

// ── instance B: open it and compare ─────────────────────────────────────────

const harnessB = `<!doctype html><meta charset="utf-8"><title>B</title><body>
<pre id="result"></pre>
<script type="module">
  // Dynamic imports inside the try below, not static ones at the top: a static
  // import that 404s aborts the module before any handler exists, and the
  // harness simply never reports — which reads as a timeout and says nothing
  // about the cause. This turns that into a reported failure.
  const lines = []
  const check = (level, name, cond, detail = '') =>
    lines.push((cond ? 'PASS ' : 'FAIL ') + '[' + level + '] ' + name + (detail ? ' — ' + detail : ''))

  const canonical = (v) => {
    if (v === null || typeof v !== 'object') return JSON.stringify(v) ?? 'null'
    if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']'
    return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}'
  }

  try {
    const { parseSessionPackage, serialiseSessionPackage, findForbiddenIdentifiers } =
      await import('/sessionPackage.js')
    const { projectPatch } = await import('/patchProjection.js')
    const { buildPatchExport, draftFromPatchExport } = await import('/presetDraft.js')

    localStorage.clear()
    check('setup', 'instance B starts with no patches',
      localStorage.getItem('bsclab.patchStudio.patches.v1') === null, location.origin)

    const text = await (await fetch('/payload.json')).text()
    const { pkg, patch: original } = JSON.parse(text)

    // ── integrity ──
    const opened = await parseSessionPackage(pkg)
    check('integrity', 'package checksum verifies on a different origin', true,
      opened.manifest.checksums['session.patch.json'].slice(0, 12) + '…')
    check('integrity', 'manifest records the producing build and SSTIM release',
      opened.manifest.bscLabCommit === 'conformance-harness' &&
      opened.manifest.sstimRelease === '0.11.0',
      opened.manifest.bscLabCommit + ' / SSTIM ' + opened.manifest.sstimRelease)

    // ── privacy boundary ──
    const leaked = findForbiddenIdentifiers(pkg)
    check('privacy', 'package carries no forbidden identifier', leaked.length === 0,
      leaked.length ? leaked.join(', ') : 'none of ' + 4 + ' patterns matched')
    check('privacy', 'the exporting account id did not travel',
      !pkg.includes(${JSON.stringify(ACCOUNT_UID)}))
    check('privacy', 'instance B storage was not written by opening the package',
      localStorage.getItem('bsclab.profile.v1') === null)

    // ── Level 2: execution-parameter equivalence ──
    check('L2', 'patch is byte-identical after transfer',
      canonical(opened.patch) === canonical(original))

    const rebuilt = buildPatchExport(draftFromPatchExport(opened.patch))
    check('L2', 'patch survives reconstruction through the editor draft model',
      canonical(rebuilt) === canonical(original))

    const countOf = (p) => [p.audioTracks, p.visualTracks, p.hapticTracks, p.controlTracks]
      .map((t) => (t ?? []).length).join('/')
    check('L2', 'track counts match', countOf(rebuilt) === countOf(original),
      countOf(rebuilt) + ' (audio/visual/haptic/control)')

    const modsOf = (p) => (p.audioTracks ?? [])
      .flatMap((t) => Object.values(t.params ?? {}))
      .flatMap((param) => param?.mods ?? []).length
    check('L2', 'modulation links survive', modsOf(rebuilt) === modsOf(original),
      modsOf(rebuilt) + ' links')

    // Every numeric parameter, compared individually rather than in bulk.
    let drifted = 0, compared = 0
    for (const group of ['audioTracks', 'visualTracks', 'hapticTracks']) {
      for (const [i, track] of (original[group] ?? []).entries()) {
        for (const [name, param] of Object.entries(track.params ?? {})) {
          const a = typeof param === 'object' ? param.value : param
          const other = rebuilt[group]?.[i]?.params?.[name]
          const b = typeof other === 'object' ? other?.value : other
          compared += 1
          if (Number(a) !== Number(b)) drifted += 1
        }
      }
    }
    check('L2', 'no parameter drift', drifted === 0, compared + ' parameters compared')

    // ── Level 1: semantic equivalence ──
    const projA = projectPatch(original, ${OPTIONS_JSON})
    const projB = projectPatch(opened.patch, ${OPTIONS_JSON})
    check('L1', 'SSTIM projection is identical', projA.turtle === projB.turtle,
      projB.turtle.length + ' bytes of Turtle')
    check('L1', 'projection shipped in the package matches a fresh projection',
      opened.turtle === projB.turtle)
    check('L1', 'mapping report is identical',
      canonical(projA.report) === canonical(projB.report),
      projB.report.mappedCount + ' mapped, ' + projB.report.unmappedCount + ' unmapped')
    check('L1', 'the package states what did not travel',
      opened.report.unmapped.length === projB.report.unmapped.length &&
      opened.report.structuralFindings.length > 0,
      opened.report.structuralFindings.map((f) => f.id).join(', '))
    check('L1', 'the package does not claim catalog conformance',
      /not catalog-conformant/.test(opened.report.conformance))

    // ── re-package: the fixed point ──
    const repacked = await serialiseSessionPackage(opened.patch, ${OPTIONS_JSON})
    check('L2', 're-package on B is byte-identical to A', repacked === pkg,
      repacked.length + ' vs ' + pkg.length + ' bytes')

    // ── Level 3, declared not attempted ──
    lines.push('SKIP [L3] rendered-signal comparison — needs deterministic offline ' +
      'rendering per engine; parameter equality is not a substitute')
  } catch (e) {
    check('error', 'unexpected error', false, e.message)
  }

  document.getElementById('result').textContent = lines.join('\\n')
  await fetch('/report', { method: 'POST', body: JSON.stringify({ origin: location.origin, lines }) })
</script></body>`

async function main() {
  if (!existsSync(DIST)) {
    console.error(`session-conformance: ${DIST} does not exist — run a build first.`)
    process.exit(1)
  }

  const payload = { value: null, reports: [] }
  const serverA = await serve(PORT_A, harnessA, payload)
  const serverB = await serve(PORT_B, harnessB, payload)
  const profileA = await mkdtemp(join(tmpdir(), 'bsc-sc-a-'))
  const profileB = await mkdtemp(join(tmpdir(), 'bsc-sc-b-'))
  let chromeA, chromeB

  try {
    console.log(`session-conformance: instance A on :${PORT_A}, instance B on :${PORT_B}\n`)

    chromeA = launch(`http://127.0.0.1:${PORT_A}/harness.html`, profileA)
    const reportA = JSON.parse(await waitForReport(payload, 0))
    payload.value = JSON.stringify({ pkg: reportA.pkg, patch: reportA.patch })
    console.log(`  ok   instance A (${reportA.origin}) packaged ${reportA.pkg.length} bytes`)

    if (reportA.pkg.includes(ACCOUNT_UID)) {
      console.log('  FAIL the account identifier appeared in the package')
      process.exit(1)
    }
    console.log('  ok   no account identifier in the package')

    chromeB = launch(`http://127.0.0.1:${PORT_B}/harness.html`, profileB)
    const reportB = JSON.parse(await waitForReport(payload, 1))

    if (reportB.origin === reportA.origin) {
      console.log('  FAIL both harnesses ran on the same origin — not an interchange')
      process.exit(1)
    }
    console.log(`  ok   instance B is a separate origin (${reportB.origin})\n`)

    for (const line of reportB.lines) {
      console.log('  ' + line.replace(/^PASS /, 'ok   ').replace(/^SKIP /, 'skip '))
    }

    const failed = reportB.lines.filter((l) => l.startsWith('FAIL')).length
    console.log(`\nsession-conformance: ${failed === 0 ? 'PASS' : `FAIL (${failed})`}`)
    process.exitCode = failed === 0 ? 0 : 1
  } finally {
    try { chromeA?.kill() } catch { /* already gone */ }
    try { chromeB?.kill() } catch { /* already gone */ }
    serverA.close(); serverB.close()
    for (const dir of [profileA, profileB]) {
      try { await rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) }
      catch { /* temp dir; the OS will reap it */ }
    }
  }
}

main().catch((e) => { console.error('session-conformance:', e.message); process.exit(1) })
