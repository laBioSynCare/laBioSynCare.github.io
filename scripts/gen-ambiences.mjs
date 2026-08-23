// gen-ambiences.mjs — synthesize CC0 ambient loops for the Sample audio track.
//
//   node scripts/gen-ambiences.mjs
//
// Writes seamless ~6 s stereo loops to static/audio/{rain,ocean,wind}.wav.
// These are fully synthetic (filtered noise + slow modulation), so they carry
// no third-party licensing. Regenerate if the set changes.

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SR = 44100
const DUR = 6
const N = SR * DUR
const XF = Math.floor(SR * 0.5) // crossfade length for seamless looping

function onePole(cut) { return 1 - Math.exp(-2 * Math.PI * cut / SR) }

// ── Generators: each returns a mono Float32Array in [-1,1]-ish ──────────────
function rain() {
  const out = new Float32Array(N)
  let hp = 0, last = 0
  for (let i = 0; i < N; i++) {
    const w = Math.random() * 2 - 1
    // high-passed hiss
    hp = 0.97 * (hp + w - last); last = w
    let s = hp * 0.5
    // sparse droplet transients
    if (Math.random() < 0.0008) s += (Math.random() * 2 - 1) * 0.6
    out[i] = s
  }
  return out
}

function ocean() {
  const out = new Float32Array(N)
  let brown = 0, lp = 0
  const a = onePole(900)
  for (let i = 0; i < N; i++) {
    const w = Math.random() * 2 - 1
    brown = (brown + 0.02 * w) / 1.02
    lp += a * (brown * 3.5 - lp)
    // slow swell (~0.12 Hz) — waves rolling in
    const swell = 0.55 + 0.45 * (0.5 - 0.5 * Math.cos(2 * Math.PI * 0.12 * i / SR))
    out[i] = lp * swell * 1.2
  }
  return out
}

function wind() {
  const out = new Float32Array(N)
  let b0 = 0, b1 = 0, b2 = 0, lp = 0, bp = 0
  for (let i = 0; i < N; i++) {
    const w = Math.random() * 2 - 1
    // cheap pink-ish
    b0 = 0.99 * b0 + w * 0.05
    b1 = 0.95 * b1 + w * 0.10
    b2 = 0.80 * b2 + w * 0.30
    const pink = (b0 + b1 + b2) * 0.4
    // gusting band-pass centre drifts slowly
    const cut = 500 + 350 * Math.sin(2 * Math.PI * 0.07 * i / SR)
    const a = onePole(cut)
    lp += a * (pink - lp)
    bp = pink - lp
    const gust = 0.5 + 0.5 * (0.5 - 0.5 * Math.cos(2 * Math.PI * 0.05 * i / SR))
    out[i] = bp * gust * 1.6
  }
  return out
}

// Make the loop seamless: crossfade the first XF samples over the last XF.
function seamless(d) {
  const out = Float32Array.from(d)
  for (let i = 0; i < XF; i++) {
    const t = i / XF
    const tail = out[N - XF + i]
    const head = d[i]
    out[N - XF + i] = tail * (1 - t) + head * t
  }
  // trim the duplicated head region so end joins start cleanly
  return out.subarray(0, N - XF)
}

// Normalise to a comfortable peak and add a tiny stereo width via decorrelation.
function stereoNormalize(mono, peak = 0.7) {
  let mx = 0
  for (let i = 0; i < mono.length; i++) mx = Math.max(mx, Math.abs(mono[i]))
  const g = mx > 0 ? peak / mx : 1
  const L = new Float32Array(mono.length)
  const R = new Float32Array(mono.length)
  for (let i = 0; i < mono.length; i++) {
    const s = mono[i] * g
    L[i] = s
    R[i] = mono[mono.length - 1 - i] * g * 0.6 + s * 0.4 // mild decorrelation
  }
  return { L, R }
}

function encodeWav(L, R) {
  const len = L.length
  const bytesPerSample = 2
  const blockAlign = 2 * bytesPerSample
  const dataLen = len * blockAlign
  const buf = Buffer.alloc(44 + dataLen)
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + dataLen, 4); buf.write('WAVE', 8)
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24)
  buf.writeUInt32LE(SR * blockAlign, 28); buf.writeUInt16LE(blockAlign, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36); buf.writeUInt32LE(dataLen, 40)
  let o = 44
  for (let i = 0; i < len; i++) {
    const l = Math.max(-1, Math.min(1, L[i])) * 32767
    const r = Math.max(-1, Math.min(1, R[i])) * 32767
    buf.writeInt16LE(l | 0, o); o += 2
    buf.writeInt16LE(r | 0, o); o += 2
  }
  return buf
}

const here = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(here, '..', 'static', 'audio')
mkdirSync(outDir, { recursive: true })

for (const [name, gen] of [['rain', rain], ['ocean', ocean], ['wind', wind]]) {
  const { L, R } = stereoNormalize(seamless(gen()))
  const wav = encodeWav(L, R)
  const path = resolve(outDir, `${name}.wav`)
  writeFileSync(path, wav)
  console.log(`${name}.wav  ${(wav.length / 1024).toFixed(0)} KB  ${(L.length / SR).toFixed(2)}s`)
}
