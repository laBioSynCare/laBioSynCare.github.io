#!/usr/bin/env node
// Measure the audio engines in a real browser and print the report.
//
// Unit tests cannot see DSP. `make test` proves the registry and the fallback
// logic; only a browser with a running AudioContext shows what the engines
// actually emit. This runner boots a Vite dev server so the harness imports the
// shipping engine sources (not a re-implementation), drives one or more
// headless browsers at it, and collects the JSON they POST back.
//
// Usage:
//   node scripts/audio-verify/run.mjs [--browser chrome|firefox|all] [--json out.json]
//
// Chrome additionally reports AudioContext.renderCapacity (render-thread load
// and underrun ratio); Firefox does not implement it and reports null.

import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')

const argv = process.argv.slice(2)
const flag = (name, fallback) => { const i = argv.indexOf(name); return i === -1 ? fallback : argv[i + 1] }
const which = flag('--browser', 'chrome')
const jsonOut = flag('--json', null)

const BROWSERS = {
  chrome: {
    label: 'Chrome',
    candidates: [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/usr/bin/google-chrome', '/usr/bin/chromium'],
    args: (url, profile) => ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
      '--no-default-browser-check', '--disable-background-timer-throttling', '--mute-audio',
      // Without this the AudioContext never leaves "suspended" and every case
      // times out; the flag is why this runner cannot reuse dom-after-hydration.
      '--autoplay-policy=no-user-gesture-required',
      `--user-data-dir=${profile}`, url],
  },
  firefox: {
    label: 'Firefox',
    candidates: [process.env.FIREFOX_PATH, '/Applications/Firefox.app/Contents/MacOS/firefox',
      '/usr/bin/firefox'],
    args: (url, profile) => ['--headless', '--profile', profile, url],
    // Firefox blocks audio until a gesture unless the pref is set in the profile.
    prepareProfile: (profile) => writeFileSync(join(profile, 'user.js'),
      ['user_pref("media.autoplay.default", 0);',
        'user_pref("media.autoplay.blocking_policy", 0);',
        'user_pref("browser.shell.checkDefaultBrowser", false);'].join('\n')),
  },
}

async function findBinary(candidates) {
  const { access } = await import('node:fs/promises')
  for (const c of candidates.filter(Boolean)) {
    try { await access(c); return c } catch { /* next */ }
  }
  return null
}

const collected = new Map()
let resolveResult = null

const server = await createServer({
  root,
  configFile: join(root, 'vite.config.js'),
  logLevel: 'error',
  server: { host: '127.0.0.1', port: 0, strictPort: false },
  plugins: [{
    name: 'bsc-audio-verify',
    configureServer(s) {
      s.middlewares.use('/__audio-verify/harness', (_req, res) => {
        res.setHeader('content-type', 'text/html')
        res.end(readFileSync(join(here, 'harness.html'), 'utf8'))
      })
      s.middlewares.use('/__audio-verify/results', (req, res) => {
        let body = ''
        req.on('data', (c) => { body += c })
        req.on('end', () => {
          res.statusCode = 204; res.end()
          try { resolveResult?.(JSON.parse(body)) } catch (e) { resolveResult?.({ error: String(e) }) }
        })
      })
    },
  }],
})
await server.listen()
const { port } = server.httpServer.address()
const url = `http://127.0.0.1:${port}/__audio-verify/harness`

async function runBrowser(key) {
  const def = BROWSERS[key]
  const bin = await findBinary(def.candidates)
  if (!bin) { console.error(`skip ${def.label}: not installed`); return null }
  const profile = mkdtempSync(join(tmpdir(), `bsc-av-${key}-`))
  def.prepareProfile?.(profile)
  const done = new Promise((res, rej) => {
    resolveResult = res
    setTimeout(() => rej(new Error(`${def.label} produced no results within 300s`)), 300_000)
  })
  const proc = spawn(bin, def.args(url, profile), { stdio: 'ignore' })
  try { return await done } finally {
    try { proc.kill('SIGKILL') } catch { /* gone */ }
    try { rmSync(profile, { recursive: true, force: true }) } catch { /* best effort */ }
  }
}

const targets = which === 'all' ? Object.keys(BROWSERS) : [which]
for (const key of targets) {
  if (!BROWSERS[key]) { console.error(`unknown browser "${key}"`); process.exitCode = 2; continue }
  try { collected.set(key, await runBrowser(key)) }
  catch (e) { console.error(`${key}: ${e.message}`); process.exitCode = 1 }
}
await server.close()

// ---- report ---------------------------------------------------------------
const pad = (v, w) => String(v).padEnd(w)
function table(rows, columns) {
  if (!rows || rows.error) { console.log(`  ${rows?.error ?? 'no data'}`); return }
  const widths = columns.map((c) => Math.max(c.length, ...rows.map((r) => String(r[c] ?? '').length)))
  console.log('  ' + columns.map((c, i) => pad(c, widths[i])).join('  '))
  for (const r of rows) console.log('  ' + columns.map((c, i) => pad(r[c] ?? '', widths[i])).join('  '))
}

// Divergences that are real, measured, and awaiting a product decision rather
// than a fix. They are reported every run so they stay visible, but they do not
// fail the gate — a permanently red suite stops being read. Remove an entry the
// moment the underlying question is settled.
const KNOWN_DIVERGENCES = [
  {
    match: /^engines agree on Sample pan /,
    note: 'vanilla routes Sample through StereoPannerNode (stereo law: the far '
      + 'channel folds into the near one); the worklets attenuate it linearly. '
      + 'Hard-panned samples are ~3.7 dB quieter on the worklet engines. '
      + 'See docs/technical/EQUIPMENT_CHECK.md and src/engines/README.md.',
  },
]

let failures = 0
let known = 0
const check = (label, ok, detail) => {
  if (ok) { console.log(`  ok    ${label}`); return }
  const divergence = KNOWN_DIVERGENCES.find((d) => d.match.test(label))
  if (divergence) { known++; console.log(`  KNOWN ${label} — ${detail}`); return }
  failures++
  console.log(`  FAIL  ${label} — ${detail}`)
}

for (const [key, res] of collected) {
  if (!res) continue
  console.log(`\n=== ${BROWSERS[key].label} ===`)
  console.log(res.ua)
  const c = res.cases

  console.log('\n-- spectral purity (coherent sampling, rectangular window) --')
  table(c.purity, ['engine', 'sampleRate', 'freq', 'cyclesMeasured', 'cyclesExpected', 'sfdr', 'thd',
    'peak', 'rms', 'clipped', 'renderLoadPeak', 'underrunRatio'])
  console.log('\n-- voice onset after scheduled start (ms) --')
  table(c.onset, ['engine', 'trialsMs', 'maxMs'])
  console.log('\n-- binaural: channel identity and isolation --')
  table(c.binaural, ['engine', 'leftHz', 'rightHz', 'beatHz', 'cyclesLeft', 'cyclesLeftExpected',
    'cyclesRight', 'cyclesRightExpected', 'isolationLdB', 'isolationRdB'])
  console.log('\n-- isochronic pulse rate --')
  table(c.isochronic, ['engine', 'pulses', 'rateHz', 'jitterMs'])
  console.log('\n-- sample playback --')
  table(c.sample, ['engine', 'peak', 'rms', 'clipped'])
  console.log('\n-- headroom, 6 voices at gain 0.25 --')
  table(c.headroom, ['engine', 'peakL', 'peakR', 'rmsL', 'dbfs', 'clipped', 'renderLoadPeak', 'underrunRatio'])
  console.log('\n-- frequency glide: cycle deficit over a 100->4900 Hz / 1 s sweep (block-hold vs a-rate) --')
  table(c.glide, ['engine', 'idealCycles', 'measuredCycles', 'deficitCycles', 'predictedDeficit',
    'equivalentHzOffset'])
  console.log('\n-- pan law (channel RMS at pan -1 .. +1) --')
  table(c.panLaw, ['voice', 'engine', 'L-1', 'R-1', 'L-0.5', 'R-0.5', 'L0', 'R0', 'L0.5', 'R0.5', 'L1', 'R1'])
  console.log('\n-- noise colour (spectral slope, 250 Hz - 4 kHz) --')
  table(c.noiseColour, ['colour', 'engine', 'slopeDbPerOct', 'expected', 'rms', 'peak', 'clipped'])
  console.log('\n-- drone --')
  table(c.drone, ['engine', 'rms', 'peak', 'clipped'])
  console.log('\n-- tremolo (4 Hz, depth 0.6, exp) --')
  table(c.tremolo, ['engine', 'depthRatio', 'rateHz'])
  console.log('\n-- continuity: step size at start / gain change / stop, relative to steady state --')
  table(c.continuity, ['engine', 'preStartRms', 'steadyStep', 'startRatio', 'changeRatio', 'stopRatio', 'tailRms'])

  console.log('\n-- assertions --')
  for (const r of c.purity ?? []) {
    check(`${r.engine} carrier cycle count exact`, r.cyclesMeasured === r.cyclesExpected,
      `${r.cyclesMeasured} != ${r.cyclesExpected}`)
    check(`${r.engine} no clipping`, r.clipped === 0, `${r.clipped} clipped samples`)
    // -60 dBc is a "something is structurally wrong" gate, not a quality bar:
    // a broken oscillator reads -20 to -40 dB. The measured value is printed
    // above because it varies by browser — Firefox's native OscillatorNode is
    // markedly less pure than Chrome's, while both worklet engines are not.
    check(`${r.engine} SFDR below -60 dBc`, r.sfdr < -60, `${r.sfdr} dB`)
  }
  for (const r of c.onset ?? []) {
    check(`${r.engine} starts within 1 ms of schedule`, r.maxMs < 1.0, `max ${r.maxMs} ms`)
  }
  for (const r of c.binaural ?? []) {
    check(`${r.engine} binaural channels independent`,
      r.isolationLdB < -60 && r.isolationRdB < -60, `${r.isolationLdB} / ${r.isolationRdB} dB`)
    check(`${r.engine} binaural cycle counts exact`,
      r.cyclesLeft === r.cyclesLeftExpected && r.cyclesRight === r.cyclesRightExpected,
      `${r.cyclesLeft}/${r.cyclesLeftExpected} ${r.cyclesRight}/${r.cyclesRightExpected}`)
  }
  for (const r of c.isochronic ?? []) {
    check(`${r.engine} pulse rate within 0.05 Hz`, Math.abs(r.rateHz - 10) < 0.05, `${r.rateHz} Hz`)
    check(`${r.engine} pulse jitter under 1.2 ms`, r.jitterMs < 1.2, `${r.jitterMs} ms`)
  }
  for (const r of c.sample ?? []) {
    check(`${r.engine} sample renders`, r.rms > 0.001, `rms ${r.rms}`)
  }
  for (const r of c.headroom ?? []) {
    check(`${r.engine} 6 voices do not clip`, r.clipped === 0, `${r.clipped} clipped samples`)
    if (typeof r.underrunRatio === 'number') {
      check(`${r.engine} no render-thread underruns`, r.underrunRatio === 0, `ratio ${r.underrunRatio}`)
    }
  }
  // The deficit is a known, quantified consequence of the WASM processor reading
  // frequency once per block. It must stay at the predicted magnitude: a larger
  // one would mean phase is being lost somewhere else.
  // Cross-engine parity. Settings offers these as interchangeable
  // implementations of one voice model, so a level or image that depends on the
  // choice is a defect in that promise, not a preference.
  const parity = (rows, key, label, tol) => {
    if (!rows || rows.error || rows.length < 2) return
    const groups = new Map()
    for (const r of rows) {
      const g = label(r); if (!groups.has(g)) groups.set(g, []); groups.get(g).push(r)
    }
    for (const [g, rs] of groups) {
      const vals = rs.map((r) => r[key]).filter((v) => typeof v === 'number')
      if (vals.length < 2) continue
      const spread = Math.max(...vals) - Math.min(...vals)
      check(`engines agree on ${g} ${key}`, spread <= tol,
        `spread ${spread.toFixed(4)} > ${tol} (${rs.map((r) => `${r.engine}=${r[key]}`).join(', ')})`)
    }
  }
  parity(c.noiseColour, 'slopeDbPerOct', (r) => `${r.colour} noise slope`, 1.0)
  parity(c.drone, 'rms', () => 'drone', 0.02)
  parity(c.tremolo, 'depthRatio', () => 'tremolo depth', 0.02)
  for (const pan of ['-1', '-0.5', '0', '0.5', '1']) {
    parity(c.panLaw, `L${pan}`, (r) => `${r.voice} pan ${pan} left`, 0.02)
    parity(c.panLaw, `R${pan}`, (r) => `${r.voice} pan ${pan} right`, 0.02)
  }
  for (const r of c.noiseColour ?? []) {
    check(`${r.engine} ${r.colour} noise slope near ${r.expected} dB/oct`,
      Math.abs(r.slopeDbPerOct - r.expected) < 1.5, `${r.slopeDbPerOct} dB/oct`)
    check(`${r.engine} ${r.colour} noise does not clip`, r.clipped === 0, `${r.clipped} samples`)
  }
  for (const r of c.continuity ?? []) {
    check(`${r.engine} silent before the scheduled start`, r.preStartRms < 0.0005,
      `rms ${r.preStartRms} in the lookahead window`)
    check(`${r.engine} no click at voice start`, r.startRatio < 3, `${r.startRatio}x steady step`)
    check(`${r.engine} no click on gain change`, r.changeRatio < 3, `${r.changeRatio}x steady step`)
    check(`${r.engine} no click at release`, r.stopRatio < 3, `${r.stopRatio}x steady step`)
    check(`${r.engine} release reaches silence`, r.tailRms < 0.001, `tail rms ${r.tailRms}`)
  }
  for (const r of c.glide ?? []) {
    check(`${r.engine} glide deficit matches prediction`,
      Math.abs(r.deficitCycles - r.predictedDeficit) <= 1,
      `${r.deficitCycles} cycles vs predicted ${r.predictedDeficit}`)
  }
  for (const [name, v] of Object.entries(c)) {
    if (v && v.error) { failures++; console.log(`  FAIL  case "${name}" — ${v.error}`) }
  }
}

if (jsonOut) {
  writeFileSync(jsonOut, JSON.stringify(Object.fromEntries(collected), null, 2))
  console.log(`\nwrote ${jsonOut}`)
}
if (known) {
  console.log('\nKnown divergences (reported, not gating):')
  for (const d of KNOWN_DIVERGENCES) console.log(`  - ${d.note}`)
}
console.log(`\n${failures === 0 ? 'PASS' : `FAIL (${failures})`}${known ? ` — ${known} known divergence(s)` : ''}`)
process.exit(failures === 0 ? (process.exitCode ?? 0) : 1)
