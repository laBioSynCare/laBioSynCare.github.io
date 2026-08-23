# src/engines — Stimulation Engine Layer

> **Status.** The **audio** layer is built: four `IAudioEngine` implementations
> plus the `bsc-voice` / `bsc-voice-wasm` AudioWorklets and the `bsc-osc.wasm`
> kernel in `static/worklets/`. The **visual** and **haptic** engines are still
> **planned** — the sections below marked *(planned)* describe their target
> design. Today the Patch Studio (`src/ui/creator/`) calls the audio engine
> directly through the `IAudioEngine` interface; the `StimulationOrchestrator`
> in `src/core/` (which would own multi-engine coordination) is also planned.

The engines layer provides pluggable implementations of audio, visual, and
haptic stimulation delivery. Each engine type exposes an interface contract so
callers depend only on the interface, never implementation-specific APIs.

See `docs/technical/AUDIO_ENGINE_ARCHITECTURE.md` and
`docs/technical/VISUAL_ENGINE_ARCHITECTURE.md` for the full **target**
architecture and `docs/technical/PATCH_STUDIO.md` for the as-built playback
model. This README is an index and quick reference.

---

## Directory structure

```
engines/
├── audio/
│   ├── IAudioEngine.js              Interface contract + JSDoc types
│   ├── VanillaWebAudioEngine.js     Default: native Web Audio nodes (main thread)
│   ├── WorkletVoiceEngine.js        Shared base for the AudioWorklet engines
│   ├── AudioWorkletEngine.js        Audio-thread DSP in JS (bsc-voice processor)
│   ├── WasmAudioWorkletEngine.js    Audio-thread DSP in WASM (bsc-voice-wasm)
│   ├── NullAudioEngine.js           Silent: monotonic clock, no Web Audio
│   └── audioEngines.js              Registry + persisted selection + factory
│
├── visual/   (planned — none of these files exist yet)
│   ├── IVisualEngine.js             Interface contract + JSDoc types
│   ├── PixiJSEngine.js              Primary implementation (PixiJS v8)
│   ├── CSSEngine.js                 Reduced-motion / low-power fallback
│   └── phaseMapping.js              Canonical φ→visual mapping functions
│
└── haptic/   (planned — none of these files exist yet)
    ├── IHapticEngine.js             Interface contract
    ├── VibrationHapticEngine.js     Web Vibration API implementation
    └── NullHapticEngine.js          Silent fallback (iOS Safari, desktops)
```

> Today, visual stimuli are authored and previewed as CSS/DOM elements in the
> Patch Studio (see `docs/technical/PATCH_STUDIO.md` §5). The audio engines have
> a committed browser compliance suite — `make audio-verify`, in
> [`scripts/audio-verify/`](../../scripts/audio-verify/README.md) — alongside the
> Vitest units beside each source file.

---

## Audio engines

Four interchangeable implementations of `IAudioEngine`, all rendering the same
Phase-1 voice model (`Carrier`, `IsochronicTone`, `BinauralBeat`, `Noise`,
`Drone`, `Sample`, plus a universal per-voice tremolo/AM effect). The user
picks one in **Settings → Audio engine**; the choice is persisted to
`localStorage` (`bsclab.audioEngine`) and read by `createAudioEngine()` when the
Patch Studio next starts playback. `audioEngines.js` holds the registry,
capability detection, the Svelte store, and the factory (which falls back to the
default when a selected engine's capabilities are unavailable).

**Key constraints from `CLAUDE.md` (apply to every engine):**
- The engine timing context's `currentTime` is the only timing authority. For
  sounding engines that is `AudioContext.currentTime`; Silent supplies the same
  monotonic timing surface without constructing Web Audio.
- AudioWorklet files in `static/worklets/` are never bundled
- No allocation inside `AudioWorkletProcessor.process()`
- `AudioContext.resume()` must be called inside a user gesture handler

```javascript
import { createAudioEngine } from './audioEngines.js'
const { engine, fellBack } = createAudioEngine()   // reads the saved preference
await engine.initialize()                           // loads worklets/WASM if needed
await engine.resume()                               // inside a gesture handler
```

### `VanillaWebAudioEngine` (default — `vanilla`)

Signal built from native Web Audio nodes (oscillators, gains, stereo panners,
a `PeriodicWave` envelope for `IsochronicTone`). Broadest compatibility; no
worklet required.

> **Measuring these claims.** `make audio-verify` drives the engines in a real
> browser and asserts frequency accuracy, spectral purity, onset, binaural
> channel isolation, pulse jitter, headroom and the glide behaviour described
> below. See [`scripts/audio-verify/README.md`](../../scripts/audio-verify/README.md)
> for the method and the recorded results — including the finding that the two
> worklet engines measure identically across browsers while `vanilla` varies by
> 64 dB, because it delegates to the browser's own oscillator.

### `AudioWorkletEngine` (`worklet`)

Each voice is one `AudioWorkletNode` running `bsc-voice.worklet.js` on the audio
render thread — sample-by-sample JS DSP isolated from main-thread jank. Params
are a-rate `AudioParam`s set from the main thread.

### `WasmAudioWorkletEngine` (`worklet-wasm`)

Same audio-thread voice model, but the per-sample sine oscillator runs as a
hand-written WebAssembly kernel (`bsc-osc.wat` → `bsc-osc.wasm`, a 4096-point
sine LUT with linear interpolation). The host fetches and compiles the `.wasm`
once during `initialize()`, then hands the finished `WebAssembly.Module` to each
voice through `processorOptions`; the processor instantiates it synchronously in
its constructor against memory it owns, so it is ready before its first render
quantum. Envelope/gain/pan/mix stay in JS, as do the Noise, Drone and Sample
voices — the kernel renders only the tonal sine oscillator, so this engine
differs from `worklet` for `Carrier` / `IsochronicTone` / `BinauralBeat` only.

Two consequences worth knowing when comparing it to `worklet`:

- Oscillator frequency is read once per 128-sample block, where the JS processor
  reads it a-rate per sample. Worst-case pitch error is slew × 2.67 ms —
  measured at ~0.9 Hz on a 660 Hz/s sweep, and ~0.03 Hz for Martigli-rate
  modulation. It only matters for fast sweeps.
- Browsers that refuse to structured-clone a `WebAssembly.Module` into the
  worklet agent fall back permanently to posting the raw bytes over the node
  port. That path compiles on the audio thread, so those voices render silence
  for the first render quanta (measured 0 or 2 quanta, ≤5.35 ms).

### Cross-engine parity

Settings offers these as interchangeable implementations of one voice model, so
a stimulus that depends on which one is selected is a defect in that promise.
`make audio-verify` asserts parity directly. Measured: `Carrier` pan law, noise
colour slopes, drone level, tremolo depth and rate, pulse rate, headroom and
onset all agree across the three engines, in both Chrome and Firefox.

One divergence is open, and it is the `Sample` voice's pan law:

| pan | vanilla L / R | worklet L / R |
|---|---|---|
| −1 | 0.1189 / 0 | 0.0780 / 0 |
| 0 | 0.0781 / 0.0562 | 0.0780 / 0.0560 |
| +1 | 0 / 0.1189 | 0 / 0.0560 |

`Sample` is a *stereo* source. The vanilla engine routes it through
`StereoPannerNode`, whose stereo law folds the far channel into the near one and
so preserves energy; the worklet processors attenuate the far channel linearly
and lose it. The two agree at centre and diverge with |pan|, reaching ~3.7 dB at
hard pan. Reproduced identically in Chrome and Firefox, so it is ours, not the
browser's.

Which law is correct is a product decision — matching `StereoPannerNode` would
change how existing patches sound — so `make audio-verify` reports it as a known
divergence rather than failing. Settle it and delete the entry from
`KNOWN_DIVERGENCES` in `scripts/audio-verify/run.mjs`.

### `NullAudioEngine` (`silent`)

Implements the full contract but emits no sound. Its internal monotonic clock
has the `currentTime`, `state`, `resume()`, `suspend()`, and `close()` surface
used by the studio, so control modulation and visual previews keep running
without constructing an `AudioContext`. It works without browser Web Audio and
pauses its time while suspended. For quiet/shared environments, accessibility,
and timing/visual debugging. Mirrors the `NullHapticEngine` pattern.

It is both a deliberate choice and the capability-free floor. When a selected
engine is unavailable, `createAudioEngine()` first uses `vanilla` if Web Audio
exists; when Web Audio itself is absent, it resolves to `silent` and reports
`fellBack: true`.

**Regenerating the WASM kernel** (after editing `static/worklets/bsc-osc.wat`):
```bash
wat2wasm static/worklets/bsc-osc.wat -o static/worklets/bsc-osc.wasm
```

**Ambient sample clips** for the `Sample` voice are synthetic CC0 loops in
`static/audio/` (no third-party licensing). Regenerate with:
```bash
node scripts/gen-ambiences.mjs
```
They are decoded on the main thread and, for the worklet engines, the PCM is
transferred into the processor which loops it; the Vanilla engine uses a native
looping `AudioBufferSourceNode`.

---

## Visual engines (planned)

*None of the visual engines below exist yet.* The as-built visual layer is the
CSS/DOM preview model in `docs/technical/PATCH_STUDIO.md` §5, gated by the
photosensitivity policy in `docs/technical/PHOTOSENSITIVITY_SAFETY.md`. The
design below is the target the preview layer will graduate into.

### `PixiJSEngine` (primary)

Uses PixiJS v8 with automatic WebGPU → WebGL 2 → WebGL 1 fallback.

**PixiJS v8 initialization is async:**
```javascript
const engine = new PixiJSEngine()
await engine.initialize(containerElement, { backgroundColor: 0x0a0a0f })
await engine.setTheme('Heal')
engine.startRendering()
```

**Clock invariant:** the rAF rendering loop reads `cachedBreathingPhase`
set by `updateBreathingPhase()`, never accumulates its own time.
`ticker.deltaTime` is used only for particle physics, never for
breathing-synchronized elements.

**PixiJS v8 API notes** (breaking from v7 — see `CLAUDE.md` section 9):
- `app.canvas` not `app.view`
- `graphics.circle()` not `graphics.drawCircle()`
- `graphics.fill()` not `beginFill()/endFill()`
- `await app.init()` not synchronous constructor
- No `CapsuleGeometry` — use circles or `RoundedRectangle`

### `CSSEngine` (fallback)

Selected automatically when `prefers-reduced-motion` is set or WebGL
is unavailable. Uses a single CSS-animated `div` driven by custom properties
set in `updateBreathingPhase()`.

### `phaseMapping.js` — shared canonical functions

All visual engines must use these for breathing-synchronized properties:

```javascript
import {
  phiToScale,      // phi → scale factor ∈ [1-A, 1+A]
  phiToOpacity,    // phi → opacity ∈ [base-A, base+A]
  phiToVertical,   // phi → normalized vertical displacement ∈ [-1, 1]
  phiToHueRotation // phi → hue rotation in degrees
} from './phaseMapping.js'
```

Phase convention (must match `BREATHING_MODEL.md` Section 7):
- `φ = 0.00` — inhale onset, center frequency
- `φ = 0.25` — full inhalation, frequency peak, maximum scale
- `φ = 0.50` — exhale onset, center frequency
- `φ = 0.75` — full exhalation, frequency trough, minimum scale

---

## Haptic engines (planned)

*None of the haptic engines below exist yet.* The Patch Studio currently shows a
haptic *preview* only. The design below is the target.

### `VibrationHapticEngine`

Uses the Web Vibration API (`navigator.vibrate()`). Not available on iOS Safari
(returns `undefined`, not `false` — check with `typeof navigator.vibrate === 'function'`).

Fires pulses at `φ = 0` (inhale onset) and `φ = 0.5` (exhale onset), derived
from zero-crossings detected in the timing relay. Pulses are offset by
`audioContext.outputLatency` to align with audio.

### `NullHapticEngine`

Silent fallback. All interface methods are no-ops. Used on iOS Safari and
desktops. Never throws. Never logs errors to the user.

**Always use `NullHapticEngine` as the default** and upgrade to
`VibrationHapticEngine` only after capability detection:

```javascript
const haptic = typeof navigator.vibrate === 'function'
  ? new VibrationHapticEngine()
  : new NullHapticEngine()
```

---

## Engine selection (as built) and swapping (planned)

**Today:** the audio engine is chosen in **Settings → Audio engine**, persisted
to `localStorage`, and instantiated by `createAudioEngine()` (in
`audioEngines.js`) when the Patch Studio *next* starts playback. The factory
falls back to the default (`vanilla`) when a selected engine's capabilities are
unavailable. There is no mid-session hot-swap yet.

**Target:** once `StimulationOrchestrator` (`src/core/`) exists, all three engine
types will be swappable mid-session for research comparison via
`switchAudioEngine()` / `switchVisualEngine()` — pause, init the new engine with
the same parameters, re-register the `onTimingState` callback, start, dispose
the old engine — keeping the immutable session specification.

---

## Verification

**As built:** the audio engines are validated with deterministic
`OfflineAudioContext` harnesses (sine accuracy, binaural L/R separation, noise
spectral tilt + filter modes, drone beating, tremolo depth/rate, sample
playback) plus the `src/ui/creator/*.test.js` unit tests run by `make test`.

**Planned:** a committed `tests/engines/` compliance suite asserting that every
implementation presents all interface methods, returns the required
`getCapabilities()` fields, never throws on valid input, and `dispose()`s
cleanly.
