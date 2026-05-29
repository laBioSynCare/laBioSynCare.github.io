# src/engines — Stimulation Engine Layer

> **Status: planned — Phase 1.** No engine source files or AudioWorklets in
> `static/worklets/` exist yet; the interfaces and test suites described below
> are targets for Phase 1.

The engines layer provides pluggable implementations of audio, visual, and
haptic stimulation delivery. All three engine types expose interface contracts;
the `StimulationOrchestrator` calls only interface methods, never
implementation-specific APIs. This makes engine swapping transparent to the
rest of the system.

See `docs/technical/AUDIO_ENGINE_ARCHITECTURE.md` and
`docs/technical/VISUAL_ENGINE_ARCHITECTURE.md` for full architectural
specifications. This README is an index and quick reference.

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
├── visual/
│   ├── IVisualEngine.js             Interface contract + JSDoc types
│   ├── PixiJSEngine.js              Primary implementation (PixiJS v8)
│   ├── CSSEngine.js                 Reduced-motion / low-power fallback
│   ├── phaseMapping.js              Canonical φ→visual mapping functions
│   └── __tests__/
│       └── IVisualEngineCompliance.test.js
│
└── haptic/
    ├── IHapticEngine.js             Interface contract
    ├── VibrationHapticEngine.js     Web Vibration API implementation
    ├── NullHapticEngine.js          Silent fallback (iOS Safari, desktops)
    └── __tests__/
        └── IHapticEngineCompliance.test.js
```

---

## Audio engines

Four interchangeable implementations of `IAudioEngine`, all rendering the same
Phase-1 voice model (`Carrier`, `IsochronicTone`, `BinauralBeat`, `Noise`). The user
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
timing/visual debugging — and the guaranteed fallback when AudioWorklet is
unavailable. Mirrors the `NullHapticEngine` pattern.

**Regenerating the WASM kernel** (after editing `static/worklets/bsc-osc.wat`):
```bash
wat2wasm static/worklets/bsc-osc.wat -o static/worklets/bsc-osc.wasm
```

---

## Visual engines

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

## Haptic engines

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

## Engine swapping

All three engine types can be swapped mid-session for research comparison
via `StimulationOrchestrator.switchAudioEngine()` and
`StimulationOrchestrator.switchVisualEngine()`.

The swap procedure:
1. Pause the current engine (audio: `suspend()`; visual: `pause()`)
2. Initialize the new engine with the same parameters
3. Re-register the `onTimingState` callback to the new audio engine
4. Start the new engine
5. Dispose the old engine

The session specification is immutable — a swapped session continues
from the same preset and parameters.

---

## Compliance tests

Every engine implementation must pass the compliance test for its type:

```bash
# Audio compliance
npx vitest tests/engines/audio/IAudioEngineCompliance.test.js

# Visual compliance
npx vitest tests/engines/visual/IVisualEngineCompliance.test.js

# Haptic compliance
npx vitest tests/engines/haptic/IHapticEngineCompliance.test.js
```

Tests verify: all interface methods are present, `getCapabilities()` returns
required fields, no exceptions on valid inputs, `dispose()` closes cleanly.
Acoustic accuracy tests (FFT, onset timing) are in separate integration tests.
