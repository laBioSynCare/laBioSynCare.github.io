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
│   ├── NullAudioEngine.js           Silent: real clock, no sound (fallback)
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
> Patch Studio (see `docs/technical/PATCH_STUDIO.md` §5), and the audio engines
> are verified with `OfflineAudioContext` harnesses rather than a committed
> `tests/engines/` compliance suite.

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
- `AudioContext.currentTime` is the only timing authority — engines drive all
  parameters through timed `AudioParam` automation, never a wall clock
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

### `AudioWorkletEngine` (`worklet`)

Each voice is one `AudioWorkletNode` running `bsc-voice.worklet.js` on the audio
render thread — sample-by-sample JS DSP isolated from main-thread jank. Params
are a-rate `AudioParam`s set from the main thread.

### `WasmAudioWorkletEngine` (`worklet-wasm`)

Same audio-thread voice model, but the per-sample sine oscillator runs as a
hand-written WebAssembly kernel (`bsc-osc.wat` → `bsc-osc.wasm`, a 4096-point
sine LUT with linear interpolation). The host fetches the `.wasm` on the main
thread and posts the bytes into each node, which compiles + instantiates them
against memory it owns; envelope/gain/pan/mix stay in JS.

### `NullAudioEngine` (`silent`)

Implements the full contract but emits no sound, while still owning a real
`AudioContext` so the clock, control modulation and visual previews run exactly
as a sounding engine would. For quiet/shared environments, accessibility, and
timing/visual debugging. Mirrors the `NullHapticEngine` pattern.

It is a deliberate choice, not the fallback: when a selected engine's `requires`
capabilities are missing, `createAudioEngine()` returns the default `vanilla`
engine with `fellBack: true`. `vanilla` requires no capabilities, so it is the
floor.

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
