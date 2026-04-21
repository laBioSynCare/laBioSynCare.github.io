# Audio Engine Architecture

> **For AI agents:** This document is the authoritative design
> specification for the BSC Lab audio subsystem. Before writing any
> code touching audio scheduling, AudioWorklet processors, the
> orchestrator, or anything that calls `AudioContext`, read this
> document. The hard constraints in `CLAUDE.md` sections 3.1–3.3 and
> 6.1–6.4 summarize the invariants; this document provides the full
> rationale and complete interface contracts.

---

## 1. Design Goals

The audio engine must satisfy four requirements that are in partial
tension:

**Temporal precision.** Sensory entrainment depends on delivering
stimuli at target frequencies. A binaural beat targeted at 10 Hz
must be a 10 Hz beat, not a 9.8 Hz beat that drifts. A Symmetry
voice at 14 Hz requires that note onsets land within a few
milliseconds of their scheduled times. Timing errors above ~5 ms
at fast entrainment frequencies are acoustically noticeable.

**Jank immunity.** A BSC session runs for 15–60 minutes alongside
a browser, a visual rendering loop, and potentially other active
tabs. JavaScript garbage collection, style recalculation, and
background tab throttling all introduce main-thread latency spikes
of 10–200 ms. The audio scheduling path must be immune to these.

**Swappability (for research use).** One of BSC Lab's key research
features is the ability to switch audio engine implementations
mid-session for comparison. Researchers may want to compare the
vanilla Web Audio implementation against a Tone.js-based
implementation or a future WASM implementation while listening to
the same preset. This requires that the orchestrator never calls
engine-specific methods.

**Reproducibility.** A session specification (see
`docs/technical/SESSION_MODEL.md`) is a reproducible execution
contract. Given the same specification and a conforming engine
implementation, the acoustic output must be perceptually identical
regardless of which engine produced it.

---

## 2. Three-Clock Architecture

The most important architectural decision is that the system uses
three distinct clocks with different roles. These clocks must never
be collapsed into one. Each exists because it has properties the
others do not.

```
┌──────────────────────────────────────────────────────────────┐
│                        MAIN THREAD                           │
│                                                              │
│  StimulationOrchestrator                                     │
│  IAudioEngine implementations                                │
│  AudioContext  ←──── CLOCK 1: master, sub-ms precision       │
│  rAF visual loop  ←─ CLOCK 3: reads Clock 1 each frame       │
│                                                              │
│  ↑ postMessage: 'schedule voice X at audio time T'           │
│  ↓ postMessage: 'currentAudioTime = T, sessionElapsed = S'   │
└──────────────────────────┬───────────────────────────────────┘
                           │ SharedArrayBuffer or postMessage
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                    SESSION SCHEDULER                         │
│                   (Web Worker thread)                        │
│                                                              │
│  setInterval(25 ms)                                          │
│  Maintains session event queue                               │
│  Lookahead window: 100 ms                                    │
│  CLOCK 2: performance.now() + audio time correlation         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                           │ AudioContext.audioWorklet.addModule
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                  AUDIO RENDERING THREAD                      │
│                (AudioWorkletProcessor)                       │
│                                                              │
│  binaural.worklet.js                                         │
│  martigli.worklet.js                                         │
│  symmetry.worklet.js                                         │
│  Budget per block: 2.67 ms (128 samples at 48 kHz)           │
│  Reads AudioContext.currentTime via sampleFrame counter      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Clock 1: `AudioContext.currentTime` (master)

The hardware audio clock, maintained by the browser's audio
rendering engine independently of the JavaScript main thread. It
runs continuously without interruption from garbage collection,
layout, or tab throttling. Precision is typically ~0.02 ms at
48 kHz (one sample period). This is the sole authoritative time
reference for all audio-visual synchronization.

**Rule:** Every time-indexed event in the system is expressed as
a value of `AudioContext.currentTime`. Never convert to wall-clock
time. Never use `Date.now()`, `performance.now()`, or `setTimeout()`
as scheduling authorities.

### Clock 2: Web Worker `setInterval` (scheduler)

A `setInterval(25)` call inside a dedicated Web Worker thread.
The Worker is immune to main-thread jank because it runs on a
separate OS thread. When the audio context is actively producing
sound, browsers maintain the Worker at its requested interval even
in background tabs.

The Worker cannot directly access `AudioContext.currentTime`
(the AudioContext lives on the main thread). Instead, the main
thread posts the current audio time to the Worker on each tick,
and the Worker correlates it with its own `performance.now()`:

```javascript
// In main thread (sent to Worker on each tick)
worker.postMessage({
  type: 'audioClockSync',
  audioTime: audioContext.currentTime,     // audio clock reading
  wallTime: performance.now()              // wall clock at same instant
})

// In Worker: estimate current audio time between syncs
function estimateAudioTime(lastSync) {
  const elapsed = performance.now() - lastSync.wallTime
  return lastSync.audioTime + elapsed / 1000
}
```

The Worker maintains a session event queue — primarily Symmetry
note onsets — and on each 25 ms tick posts events that fall within
the next 100 ms of audio time back to the main thread for scheduling.

### Clock 3: `requestAnimationFrame` (visual renderer)

The display refresh clock, driven by the browser's compositor at
the monitor's refresh rate (typically 60–120 Hz). Used exclusively
for visual rendering updates. Each rAF callback reads
`AudioContext.currentTime` at its start and uses that value to
compute visual element positions for the current frame.

**Critical:** rAF callbacks may be delayed or dropped during heavy
main-thread load. Visual stutters are acceptable; audio glitches
are not. The audio layer is completely independent of rAF — a
dropped rAF frame causes a visual stutter, not an audio gap.

---

## 3. `IAudioEngine` Interface

All audio engine implementations expose this interface. The
`StimulationOrchestrator` calls only these methods — never
engine-specific APIs.

```javascript
/**
 * @typedef {Object} AudioEngineCapabilities
 * @property {boolean} supportsAudioWorklet
 * @property {boolean} supportsWasm
 * @property {boolean} supportsSharedArrayBuffer
 * @property {number}  sampleRate
 * @property {number}  outputLatency  — seconds, AudioContext.outputLatency
 * @property {string}  implementationName  — e.g. 'VanillaWebAudio'
 */

/**
 * @typedef {Object} VoiceHandle
 * @property {string}  id           — unique voice instance identifier
 * @property {string}  type         — 'Binaural' | 'Martigli' | 'Martigli-Binaural' | 'Symmetry'
 * @property {boolean} isScheduled  — false until startTime has been set
 * @property {boolean} isActive     — true after start, false after stop
 */

/**
 * @typedef {Object} VoiceSpec
 * Flat representation of a preset voice for engine consumption.
 * ProtocolRunner translates from preset JSON to VoiceSpec.
 * All numeric fields are in SI units (Hz, seconds).
 * @property {string}  type
 * @property {number}  volume      — 0–1 initial scalar
 * @property {Object}  params      — voice-type-specific parameters
 */

/**
 * @interface IAudioEngine
 *
 * A BSC audio engine implementation. Manages an AudioContext,
 * creates and schedules voice instances, and exposes a timing
 * state callback for the visual engine.
 *
 * Implementations: VanillaWebAudioEngine, ToneJsEngine.
 * Future: WasmAudioEngine (Phase 3).
 *
 * Invariant: the AudioContext created by this engine is the
 * MasterClock for all timing. Visual and haptic engines must
 * read timing state from this engine's onTimingState callback,
 * not from any other clock source.
 */
class IAudioEngine {

  /**
   * Initialize the engine. Creates the AudioContext (suspended;
   * must be resumed on user gesture) and loads AudioWorklet
   * modules. Must be called before any other method.
   * @returns {Promise<void>}
   */
  async initialize() { throw new Error('not implemented') }

  /**
   * Resume the AudioContext. MUST be called inside a user gesture
   * handler (click, touch). Browsers block audio until gesture.
   * @returns {Promise<void>}
   */
  async resume() { throw new Error('not implemented') }

  /**
   * Suspend the AudioContext (pauses audio, preserves state).
   * @returns {Promise<void>}
   */
  async suspend() { throw new Error('not implemented') }

  /**
   * Return current capabilities. Called by Orchestrator before
   * selecting DSP paths.
   * @returns {AudioEngineCapabilities}
   */
  getCapabilities() { throw new Error('not implemented') }

  /**
   * Return the AudioContext. Used by MasterClock to expose
   * currentTime to the rest of the system.
   * ONLY MasterClock should call this. Orchestrator must not.
   * @returns {AudioContext}
   */
  getAudioContext() { throw new Error('not implemented') }

  /**
   * Schedule a voice to start at the given audio time.
   * Returns a handle for subsequent parameter changes and stop.
   * The voice is loaded immediately; audio output begins at startTime.
   * @param {VoiceSpec} spec
   * @param {number}    startTime  — AudioContext.currentTime value
   * @returns {VoiceHandle}
   */
  scheduleVoice(spec, startTime) { throw new Error('not implemented') }

  /**
   * Stop a voice at the given audio time with a short release ramp
   * to avoid clicks. After stopTime + releaseSeconds, the voice
   * is fully deallocated.
   * @param {VoiceHandle} handle
   * @param {number}      stopTime       — AudioContext.currentTime value
   * @param {number}      [releaseSeconds=0.05]
   */
  stopVoice(handle, stopTime, releaseSeconds = 0.05) {
    throw new Error('not implemented')
  }

  /**
   * Schedule a parameter automation event on an active voice.
   * Used for: breathing period updates, mid-session volume changes.
   * MUST use AudioParam.setValueAtTime / linearRampToValueAtTime,
   * never synchronous assignment.
   * @param {VoiceHandle} handle
   * @param {string}      paramName  — engine-internal param key
   * @param {number}      value
   * @param {number}      atTime     — AudioContext.currentTime value
   * @param {'step'|'linear'|'exponential'} [curve='step']
   */
  setVoiceParameter(handle, paramName, value, atTime, curve = 'step') {
    throw new Error('not implemented')
  }

  /**
   * Set master output volume with a short ramp (10 ms linear).
   * @param {number} volume  — 0–1
   * @param {number} atTime  — AudioContext.currentTime value
   */
  setMasterVolume(volume, atTime) { throw new Error('not implemented') }

  /**
   * Register a callback to receive timing state on each audio block.
   * The callback is called approximately every 2.67 ms (128 samples
   * at 48 kHz) from the AudioWorklet thread via MessagePort.
   * The timing state is consumed by the visual engine's rAF loop.
   *
   * @param {function({
   *   audioTime: number,
   *   sessionElapsed: number,
   *   breathingPhase: number,  — 0–1, from the active isOn voice; NaN if none
   *   breathingPeriod: number  — seconds; NaN if no breathing guide
   * }): void} callback
   */
  onTimingState(callback) { throw new Error('not implemented') }

  /**
   * Cancel all scheduled events and release all audio resources.
   * AudioContext is closed; engine is unusable after this call.
   * @returns {Promise<void>}
   */
  async dispose() { throw new Error('not implemented') }
}
```

---

## 4. `VanillaWebAudioEngine` — Primary Implementation

The primary implementation for production use. Uses native Web Audio
API exclusively with AudioWorklet processors. No third-party audio
library dependency.

**File:** `src/engines/audio/VanillaWebAudioEngine.js`

### 4.1 Node graph

```
AudioContext destination
        │
    GainNode (masterGain, 0–1)
        │
    ┌───┴───────────────────────────────┐
    │                                   │
ChannelMerger              ChannelMerger
(for stereo voices)        (for mono voices)
    │                           │
AudioWorkletNode           AudioWorkletNode
  (binaural-processor)      (martigli-processor)
  (martigli-binaural-proc)  (symmetry-processor)
  ...N voices               ...N voices
```

Each active voice is one `AudioWorkletNode` connected to the
`masterGain`. Stereo voices (Binaural, Martigli-Binaural) produce
two output channels; mono voices (Martigli, Symmetry) produce one.
All voices feed through the `masterGain` node; a single
`setValueAtTime` on the master gain applies to all active voices.

### 4.2 Voice lifecycle

```javascript
// Schedule a voice (called from main thread after Worker posts event)
scheduleVoice(spec, startTime) {
  const workletName = WORKLET_NAMES[spec.type]  // 'binaural-processor' etc.
  const node = new AudioWorkletNode(this._ctx, workletName, {
    processorOptions: spec.params,
    numberOfOutputs: spec.type === 'Symmetry' || spec.type === 'Martigli' ? 1 : 2,
    channelCount: spec.type === 'Symmetry' || spec.type === 'Martigli' ? 1 : 2
  })

  // Connect to master gain
  node.connect(this._masterGain)

  // Schedule start: ramp volume from 0 to iniVolume over 50ms
  const gainParam = node.parameters.get('volume')
  gainParam.setValueAtTime(0, startTime)
  gainParam.linearRampToValueAtTime(spec.volume, startTime + 0.05)

  // Schedule the AudioWorklet to begin processing at startTime
  // (AudioWorkletNodes begin processing immediately on connection;
  //  volume automation handles the fade-in)

  const handle = {
    id: crypto.randomUUID(),
    type: spec.type,
    node,
    isScheduled: true,
    isActive: false
  }

  // Mark active after startTime
  this._ctx.resume().then(() => {
    const delay = (startTime - this._ctx.currentTime) * 1000
    setTimeout(() => { handle.isActive = true }, Math.max(0, delay))
  })

  this._voices.set(handle.id, handle)
  return handle
}
```

### 4.3 AudioWorklet module loading

AudioWorklet files are loaded from `public/worklets/`. This is the
only correct path — see `CLAUDE.md` section 3.2. The engine loads
all three worklet modules during `initialize()`:

```javascript
async initialize() {
  this._ctx = new AudioContext({ sampleRate: 48000 })
  this._masterGain = this._ctx.createGain()
  this._masterGain.connect(this._ctx.destination)

  // Load worklet modules — paths must be relative to app root
  // NEVER import these files; they must remain un-bundled
  await this._ctx.audioWorklet.addModule('/worklets/binaural.worklet.js')
  await this._ctx.audioWorklet.addModule('/worklets/martigli.worklet.js')
  await this._ctx.audioWorklet.addModule('/worklets/symmetry.worklet.js')

  // Set up timing state relay from worklets to main thread
  this._setupTimingRelay()
}
```

### 4.4 Timing state relay

The active breathing-reference worklet (the one with `isOn: true`)
emits its current breathing phase and period on every audio block
via a `MessagePort`. The engine collects this and fires the
`onTimingState` callback:

```javascript
_setupTimingRelay() {
  // Called when a voice is scheduled; connects its port
  // The worklet sends: { audioTime, phi, period }
  // once per 128-sample block (~every 2.67ms at 48kHz)
}
```

The visual engine's rAF loop reads the latest breathing phase
from this relay at the start of each frame.

---

## 5. AudioWorklet Processors

Three processors live in `public/worklets/`. They are never
imported or bundled by Vite. They are loaded at runtime via
`audioWorklet.addModule()`.

### 5.1 Constraints applying to all worklets

These are absolute requirements for glitch-free audio (see
`CLAUDE.md` section 3.3):

- **No allocation in `process()`.** No `new Array()`, `new Float32Array()`,
  object literals, closures, or string operations. All state is
  pre-allocated in the `constructor`.
- **No dynamic imports, no module syntax.** AudioWorklets run in
  an `AudioWorkletGlobalScope` with no `import` or `require`.
  All code must be plain ES5-compatible.
- **Return `true` from `process()`.** Returning `false` or
  throwing causes the node to be permanently disconnected.
- **No synchronous communication with main thread.** `postMessage`
  is asynchronous and is used only for non-critical state relay
  (timing phase). Never block in `process()` waiting for a message.

### 5.2 `binaural.worklet.js`

Produces stereo sine tones at `fl` and `fr`. Static carrier
frequencies (no sweep). Handles all four panning modes via
pre-scheduled parameter automation.

**AudioParams exposed to main thread:**
```
volume         — master gain for this voice, 0–1
panPosition    — stereo pan, −1 to +1; driven by panning automation
```

**Panning mode implementation:**
- `panOsc = 0`: `panPosition` held at 0 (center)
- `panOsc = 1`: main thread schedules alternating `setValueAtTime`
  calls for the crossfade pattern, using AudioContext.currentTime
- `panOsc = 2`: main thread schedules `linearRampToValueAtTime`
  sequence approximating sinusoidal pan; or worklet implements
  internally via phase accumulation
- `panOsc = 3`: only valid on `Martigli-Binaural`; not applicable here

### 5.3 `martigli.worklet.js`

Implements both the standalone `Martigli` voice and provides the
audio generation core used by `martigli-binaural.worklet.js`.

For the standalone `Martigli` type:
- Single mono output channel
- Breathing phase φ and period P(t) computed per-sample
- Emits timing state {audioTime, phi, period} via `port.postMessage`
  approximately every 128 samples (guarded by a counter to avoid
  posting every single block):

```javascript
// In process() — timing relay, max 1 post per ~2.67ms block
// No allocation: uses pre-set fields on a pre-allocated object
if (this._isOn && this._blockCount % 1 === 0) {
  this._timingMsg.audioTime = currentTime
  this._timingMsg.phi = this._phi
  this._timingMsg.period = this._P
  this.port.postMessage(this._timingMsg)
}
this._blockCount = (this._blockCount + 1) % 256
```

**Pre-allocated timing message object** (in constructor):
```javascript
this._timingMsg = { audioTime: 0.0, phi: 0.0, period: 0.0 }
```

`Object.assign` or spread would allocate — instead, mutate the
pre-allocated object's fields in place. The recipient on the main
thread must not hold a reference to this object across ticks (it
will be mutated); it should copy the fields immediately.

### 5.4 `martigli-binaural.worklet.js` (MB)

Stereo output (left and right channels in `outputs[0][0]` and
`outputs[0][1]`). Shares the Martigli phase computation with
`martigli.worklet.js` but applies it to two offset carriers.

The shared oscillation term invariant (see
`docs/technical/MARTIGLI_BINAURAL.md` Section 5) is maintained
by computing `sin(2π·φ)` exactly once per sample and assigning to
both channels. The compiler must not optimize this into separate
computations (this is guaranteed in JavaScript since there is no
auto-vectorization at the language level).

When `panOsc = 3` (Martigli-synced panning):
```javascript
// In process() — no allocation
const pan = Math.sin(2 * Math.PI * this._phi)  // −1 to +1
const gainL = (1 - pan) * 0.5
const gainR = (1 + pan) * 0.5
chL[i] = this._vol * gainL * Math.sin(this._thetaL)
chR[i] = this._vol * gainR * Math.sin(this._thetaR)
```

### 5.5 `symmetry.worklet.js`

Implements the Sonic Symmetry system (see
`docs/technical/SYMMETRY_SYSTEM.md`). Most complex of the three
worklets.

**Pre-allocated state (constructor only, never in process()):**
```javascript
this._pitches = new Float32Array(maxNotes)    // frequency table
this._pi      = new Int32Array(maxNotes)      // permutation index
this._theta   = 0.0                           // audio phase
this._envPhase = 0.0                          // envelope phase
this._noteIdx = 0                             // current note in cycle
this._cycleStart = 0.0                        // audio time of cycle start
```

The Fisher-Yates shuffle for `permfunc = 0` uses `Math.random()`,
which is allocation-free. The `_pi` array is shuffled in place.
The temporary swap variable is a pre-allocated local (JavaScript
optimizes local numeric variables as registers when hot; avoid
object properties in tight loops).

---

## 6. `ToneJsEngine` — Research Comparison Implementation

**File:** `src/engines/audio/ToneJsEngine.js`

Wraps [Tone.js](https://tonejs.github.io/) v15.x to implement the
same `IAudioEngine` interface. Used for research comparisons — a
session run with `VanillaWebAudioEngine` can be immediately re-run
with `ToneJsEngine` to compare perceived differences attributable
to implementation choices.

Tone.js provides its own Transport, Oscillator, and Envelope
abstractions. The `ToneJsEngine` maps these to the `VoiceHandle`
lifecycle without exposing Tone-specific types to the Orchestrator.

**Key differences from VanillaWebAudioEngine:**
- Tone.js wraps `AudioContext.currentTime` in its own clock
  (`Tone.getContext().currentTime`). The `ToneJsEngine` must
  ensure that `getAudioContext()` returns the underlying
  `AudioContext` (not a Tone wrapper) so that `MasterClock`
  gets the real hardware clock.
- Tone.js oscillators use ScriptProcessorNode on some older
  browsers. `getCapabilities()` must report this.
- The timing relay (breathing phase) is implemented by a Tone.js
  `Loop` running at 128-sample intervals, posting to the same
  callback as the vanilla implementation.

**Constraint:** `ToneJsEngine` must pass the same engine compliance
test suite as `VanillaWebAudioEngine`. If it cannot produce
perceptually identical output for a given preset, it must report
this via `getCapabilities().conformance = 'partial'` rather than
silently degrading.

---

## 7. `WasmAudioEngine` — Future Phase 3 Implementation

Not built in Phase 1 or 2. Designed here to ensure Phase 1–2
code does not foreclose the option.

The WasmAudioEngine uses Rust-compiled WASM modules for the
Martigli and Symmetry processors, loaded as AudioWorklet processors.
WASM in AudioWorklets provides:
- Deterministic arithmetic (no JIT variability)
- Potential SIMD acceleration for multi-voice mixing
- Easier ring buffer implementation via `SharedArrayBuffer`

**`SharedArrayBuffer` requirement:** WASM ring buffers require
`SharedArrayBuffer`, which requires `Cross-Origin-Opener-Policy:
same-origin` and `Cross-Origin-Embedder-Policy: require-corp`
HTTP headers. These must be set in `firebase.json` hosting
configuration before Phase 3 begins.

**Capability gate:** `VanillaWebAudioEngine.initialize()` must
detect whether `typeof SharedArrayBuffer !== 'undefined'` and
report it in `getCapabilities().supportsSharedArrayBuffer`. The
Orchestrator uses this capability flag to decide whether to offer
the WasmAudioEngine option in the engine selector UI.

---

## 8. `SessionScheduler` (Web Worker)

**File:** `src/core/SessionScheduler.worker.js`

A dedicated Web Worker that maintains the session event queue and
drives scheduling. Loaded with `new Worker(...)` — not bundled as
an ES module import.

### 8.1 Startup and teardown

```javascript
// Main thread — initializing the scheduler
const scheduler = new Worker(
  new URL('../core/SessionScheduler.worker.js', import.meta.url),
  { type: 'module' }
)

// Start session
scheduler.postMessage({
  type: 'START_SESSION',
  spec: sessionSpec,
  preset: presetData,
  audioTime: audioContext.currentTime
})

// Sync audio clock every 25ms tick (main thread drives)
setInterval(() => {
  scheduler.postMessage({
    type: 'CLOCK_SYNC',
    audioTime: audioContext.currentTime,
    wallTime: performance.now()
  })
}, 25)
```

### 8.2 Session event queue

The scheduler pre-computes the full session timeline on receipt
of `START_SESSION`. For Symmetry voices, this means computing
every note onset time for the session duration. For Martigli and
Binaural voices, the computation is trivial (one start event,
one stop event).

For a 30-minute session with 3 Symmetry voices averaging 2 Hz,
the total event count is approximately:
```
30 min × 60 s × (2 + 2 + 2) Hz = 10,800 events
```

Each event is a small object: `{ voiceId, type, audioTime, params }`.
A Float64Array of 10,800 × 4 fields = ~346 KB, well within Worker
memory budget.

### 8.3 Lookahead dispatch

On each 25 ms tick:
1. Estimate current audio time from last clock sync
2. Scan event queue for events in `[now, now + 0.100]` (100 ms lookahead)
3. Post each qualifying event to the main thread:

```javascript
// Worker → main thread
{ type: 'SCHEDULE_VOICE', voiceId, voiceSpec, audioTime }
{ type: 'STOP_VOICE', voiceId, audioTime }
{ type: 'SET_PARAMETER', voiceId, paramName, value, audioTime }
```

The main thread receives these messages and calls the appropriate
`IAudioEngine` method. The total latency from Worker dispatch to
AudioContext scheduling is one message-passing round trip, typically
< 1 ms. With a 100 ms lookahead, the system tolerates up to 75 ms
of message latency before a timing error reaches 25 ms — a
conservative safety margin.

### 8.4 Session pause and resume

On pause (`audioContext.suspend()`), the scheduler is notified and
suspends dispatching. The event queue is preserved. On resume, the
scheduler recalibrates using the resumed audio clock time and
continues dispatching. Events that were scheduled but not yet
played (in the lookahead buffer) are rescheduled at their original
relative position in the session.

---

## 9. `StimulationOrchestrator`

**File:** `src/core/StimulationOrchestrator.js`

Connects the scheduler, audio engine, visual engine, and haptic
engine. Never calls engine-specific methods — only interface methods.

```javascript
class StimulationOrchestrator {
  /**
   * @param {IAudioEngine}  audioEngine
   * @param {IVisualEngine} visualEngine
   * @param {IHapticEngine} hapticEngine
   */
  constructor(audioEngine, visualEngine, hapticEngine) {
    this._audio   = audioEngine
    this._visual  = visualEngine
    this._haptic  = hapticEngine
    this._handles = new Map()  // voiceId → VoiceHandle
  }

  async startSession(spec, preset) {
    // 1. Validate engines are initialized
    // 2. Resume AudioContext (must be called in gesture handler
    //    BEFORE this method — see Section 11)
    // 3. Initialize SessionScheduler with spec + preset
    // 4. Register timing state callback for visual engine
    this._audio.onTimingState(state => {
      this._visual.updateBreathingPhase(state.breathingPhase, state.breathingPeriod)
      this._haptic.updateBreathingPhase(state.breathingPhase, state.breathingPeriod)
    })
    // 5. Start scheduler; it will post SCHEDULE_VOICE events
    // 6. Main thread message handler calls scheduleVoice() per event
  }

  _onSchedulerMessage(msg) {
    switch (msg.type) {
      case 'SCHEDULE_VOICE': {
        const handle = this._audio.scheduleVoice(msg.voiceSpec, msg.audioTime)
        this._handles.set(msg.voiceId, handle)
        break
      }
      case 'STOP_VOICE': {
        const handle = this._handles.get(msg.voiceId)
        if (handle) this._audio.stopVoice(handle, msg.audioTime)
        break
      }
      case 'SET_PARAMETER': {
        const handle = this._handles.get(msg.voiceId)
        if (handle) {
          this._audio.setVoiceParameter(
            handle, msg.paramName, msg.value, msg.audioTime
          )
        }
        break
      }
    }
  }

  switchAudioEngine(newEngine) {
    // For research comparison: stop current voices, swap engine,
    // restart from current session position
    // The session spec is immutable — restart uses same spec
  }
}
```

---

## 10. `ProtocolRunner`

**File:** `src/core/ProtocolRunner.js`

Translates between preset JSON format (as defined in
`docs/technical/PRESET_FORMAT.md`) and the `VoiceSpec` objects
that the `SessionScheduler` consumes.

```javascript
class ProtocolRunner {
  /**
   * Convert a preset voice object to a VoiceSpec.
   * @param {Object} voice — from preset.voices[]
   * @param {SessionSpec} sessionSpec — for breathing param override
   * @returns {VoiceSpec}
   */
  static voiceToSpec(voice, sessionSpec) {
    const baseSpec = {
      type: voice.type,
      volume: voice.iniVolume ?? DEFAULTS[voice.type],
      params: {}
    }

    switch (voice.type) {
      case 'Binaural':
        baseSpec.params = {
          fl: voice.fl, fr: voice.fr,
          panOsc: voice.panOsc,
          panOscPeriod: voice.panOscPeriod,
          panOscTrans: voice.panOscTrans
        }
        break
      case 'Martigli':
        baseSpec.params = {
          mf0: voice.mf0, ma: voice.ma,
          // Apply session overrides for breathing params
          mp0: sessionSpec.userMp0 ?? voice.mp0,
          mp1: sessionSpec.userMp1 ?? voice.mp1,
          md:  sessionSpec.userMd  ?? voice.md,
          isOn: voice.isOn
        }
        break
      // ... Martigli-Binaural, Symmetry analogously
    }
    return baseSpec
  }

  /**
   * Compute the complete event timeline for a preset + session spec.
   * @param {Object}      preset
   * @param {SessionSpec} spec
   * @param {number}      sessionStartAudioTime
   * @returns {ScheduledEvent[]}
   */
  static computeTimeline(preset, spec, sessionStartAudioTime) {
    const events = []
    const endTime = sessionStartAudioTime + spec.durationSeconds

    for (const voice of preset.voices) {
      const voiceSpec = this.voiceToSpec(voice, spec)
      const voiceId = crypto.randomUUID()

      // All voice types: start at session start
      events.push({
        type: 'SCHEDULE_VOICE',
        voiceId,
        voiceSpec,
        audioTime: sessionStartAudioTime
      })

      // Symmetry voices: pre-compute all note onset events
      if (voice.type === 'Symmetry') {
        const noteEvents = this._computeSymmetryEvents(
          voice, voiceId, sessionStartAudioTime, endTime
        )
        events.push(...noteEvents)
      }

      // All voices: stop at session end
      events.push({
        type: 'STOP_VOICE',
        voiceId,
        audioTime: endTime
      })
    }

    return events.sort((a, b) => a.audioTime - b.audioTime)
  }
}
```

---

## 11. Autoplay Policy and AudioContext Lifecycle

Browsers enforce an autoplay policy: `AudioContext` starts in a
`'suspended'` state and cannot be resumed until a user gesture
(click, touch, keyboard event) has occurred in the current
browsing context.

**The rule:** Call `audioContext.resume()` inside the event handler
for the user's play button press, before any audio scheduling.

```javascript
// Session player component — Svelte 5 runes syntax
let audioEngineReady = $state(false)

async function onPlayButtonClick() {
  // 1. Resume audio context — MUST be here, in the gesture handler
  await audioEngine.resume()
  audioEngineReady = true

  // 2. Only now: start session
  const startTime = audioEngine.getAudioContext().currentTime + 0.1
  await orchestrator.startSession(sessionSpec, preset, startTime)
}
```

**Do not** call `audioContext.resume()` in `onMount`, in a
`setTimeout`, or in response to any non-user event. The browser
will silently fail the resume or throw a `DOMException`.

**iOS Safari specifics:** iOS Safari requires that `AudioContext`
be created inside the gesture handler itself (not just resumed).
The `initialize()` method should defer `AudioContext` construction
until the first user gesture if the initial creation attempt fails
or if `audioContext.state === 'suspended'` immediately after
construction.

---

## 12. Capability Detection

The Orchestrator checks capabilities before each session to select
the appropriate engine and audio path:

```javascript
const caps = audioEngine.getCapabilities()

// SharedArrayBuffer: required for WASM ring buffers
if (!caps.supportsSharedArrayBuffer) {
  console.warn('SharedArrayBuffer unavailable — WASM engine disabled')
  // Ensure COOP/COEP headers are set in firebase.json
}

// AudioWorklet: required for VanillaWebAudioEngine
if (!caps.supportsAudioWorklet) {
  throw new Error('AudioWorklet not supported — session cannot proceed')
  // AudioWorklet is available in all modern browsers (2019+)
  // If this throws, the user has a very old browser
}

// Output latency: used for haptic timing offset
const hapticOffsetMs = caps.outputLatency * 1000
hapticEngine.setLatencyOffset(hapticOffsetMs)
```

**Fallback policy:** BSC Lab requires AudioWorklet support (available
in Chrome 66+, Firefox 76+, Safari 14.5+). There is no
`ScriptProcessorNode` fallback — it is deprecated, runs on the main
thread, and cannot provide the timing precision required. If
AudioWorklet is unavailable, the session player UI shows a
compatibility error message with a link to a supported browser.

---

## 13. Platform-Specific Considerations

### 13.1 iOS Safari

- `AudioContext` must be created in a user gesture handler (see Section 11)
- `typeof navigator.vibrate === 'function'` is always `false` — haptic
  is silently disabled via `NullHapticEngine`
- `audioContext.outputLatency` may return `undefined`; guard with
  `outputLatency ?? 0`
- Sample rate is always 48000 on modern iOS; do not request a different
  sample rate

### 13.2 Background tab behavior

Chrome throttles `setInterval` to 1 Hz in background tabs when no
audio is playing. Once the `AudioContext` is in `'running'` state and
producing audio, the Web Worker's `setInterval` is maintained at its
requested 25 ms interval. The key is: resume the AudioContext before
the session actually starts playing (not when the user opens the tab).

### 13.3 Chromium audio process crash recovery

Chromium isolates the audio process; if it crashes, `audioContext.state`
changes to `'interrupted'`. The engine must listen for the `'statechange'`
event and attempt to recreate the AudioContext and reconnect nodes:

```javascript
audioContext.addEventListener('statechange', () => {
  if (audioContext.state === 'interrupted') {
    // Notify user; offer to restart session
  }
})
```

### 13.4 Sample rate normalization

All timing computations in the AudioWorklets use `sampleRate` (the
AudioWorkletGlobalScope global, not passed as a parameter). If the
AudioContext is created without specifying `sampleRate`, the actual
rate may be 44100, 48000, or 96000 depending on the hardware. All
worklet code uses `sampleRate` dynamically; no hardcoded 48000.

---

## 14. Testing Strategy

**Unit tests** (in `tests/engines/`):
- `IAudioEngineCompliance.test.js` — runs against both
  VanillaWebAudioEngine and ToneJsEngine:
  - `scheduleVoice()` returns a valid VoiceHandle
  - `stopVoice()` does not throw; voice handle `isActive` becomes false
  - `setVoiceParameter()` with a past `atTime` does not throw
  - `getCapabilities()` returns required fields
  - `dispose()` closes the AudioContext

**Integration tests:**
- `BinauralFrequencyAccuracy.test.js` — record 1s of binaural output,
  FFT analysis confirms beat frequency within ±0.1 Hz of target
- `MartigliPhaseAccuracy.test.js` — verify breathing phase advances at
  correct rate; compute expected vs. actual phase at t=30s
- `SymmetryOnsetTiming.test.js` — verify note onsets are within ±2 ms
  of scheduled times

**Manual testing checklist (before each phase release):**
- [ ] Session plays without audible glitches after 30 minutes
- [ ] Switching from VanillaWebAudio to ToneJs mid-session is seamless
- [ ] Session pause / resume preserves breathing phase continuity
- [ ] Background tab for 5 minutes: session resumes in sync on foreground
- [ ] iOS Safari: session starts after user tap; haptic silently absent
- [ ] Slow device (throttled 4x CPU): session starts; no timing errors > 5ms

---

*Document version: April 2026*
*Maintained by: Renato Fabbri*
*Review required when: Web Audio API changes (e.g. new AudioWorklet APIs),
new engine implementation is added, platform-specific issues discovered,
or WASM engine work begins in Phase 3.*
