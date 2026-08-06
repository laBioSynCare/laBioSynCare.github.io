# Audio Engine Architecture

> **Target design.** This document specifies the audio subsystem BSC Lab is
> growing toward: the three-clock model, the Web Worker scheduler, and the
> orchestrator that owns a session. The **as-built** audio layer is documented
> in [`../../src/engines/README.md`](../../src/engines/README.md) (four
> `IAudioEngine` implementations) and [`PATCH_STUDIO.md`](PATCH_STUDIO.md) (the
> live authoring/playback model). Where the two disagree, the code wins.
>
> The **invariants** below hold regardless of build state: `AudioContext` is the
> only clock, worklets are never bundled, nothing allocates in `process()`
> (`CLAUDE.md` §3.1–3.3).

## What already shipped, differently

Three parts of the original design were built another way. They are recorded
here so this document is not read as a description of the code:

- **One worklet, not four.** The per-technique `binaural` / `martigli` /
  `symmetry` processors became a single `static/worklets/bsc-voice.worklet.js`
  (plus a WASM variant `bsc-voice-wasm.worklet.js` + `bsc-osc.wasm`).
- **Engine choice, not engine swapping.** Four implementations exist (Vanilla
  Web Audio, AudioWorklet, AudioWorklet+WASM, Null) and are selected in
  Settings, applied on next playback. There is no mid-session hot swap, and the
  `ToneJsEngine` this document once specified was never built.
- **rAF drives live updates.** Parameter changes run from the Patch Studio's
  `requestAnimationFrame` loop reading `AudioContext.currentTime`. The Worker
  scheduler and orchestrator in §3–§4 remain unbuilt.

## 1. Design goals

Four requirements in partial tension:

- **Temporal precision.** A binaural beat targeted at 10 Hz must be a 10 Hz
  beat, not a drifting 9.8 Hz one. Symmetry note onsets must land within a few
  milliseconds. Errors above ~5 ms at fast entrainment rates are audible.
- **Jank immunity.** A session runs 15–60 minutes beside a visual render loop
  and other tabs. GC, layout, and background throttling introduce 10–200 ms
  main-thread spikes. The scheduling path must not care.
- **Swappability.** Engine implementations are comparable for research, which
  requires that callers never reach past the interface.
- **Reproducibility.** A session specification
  ([`SESSION_MODEL.md`](SESSION_MODEL.md)) is an execution contract: same spec
  plus any conforming engine must give perceptually identical output.

## 2. The three-clock architecture

The one decision that must never be undone. Three clocks, three roles, never
collapsed into one.

```
┌─ MAIN THREAD ────────────────────────────────────────────────┐
│  StimulationOrchestrator · IAudioEngine · rAF visual loop     │
│  AudioContext  ←── CLOCK 1: master, sub-ms precision          │
│  rAF loop      ←── CLOCK 3: reads Clock 1 at each frame start │
└───────────────────────────┬──────────────────────────────────┘
                            │ postMessage (both directions)
┌─ SESSION SCHEDULER (Web Worker) ─────────────────────────────┐
│  setInterval(25 ms) · event queue · 100 ms lookahead          │
│  CLOCK 2: performance.now() correlated against audio time     │
└───────────────────────────┬──────────────────────────────────┘
                            │ audioWorklet.addModule
┌─ AUDIO RENDERING THREAD ─────────────────────────────────────┐
│  bsc-voice.worklet.js / bsc-voice-wasm.worklet.js             │
│  Budget per block: 2.67 ms (128 samples at 48 kHz)            │
└──────────────────────────────────────────────────────────────┘
```

**Clock 1 — `AudioContext.currentTime` (master).** The hardware audio clock,
running independently of the JS main thread and uninterrupted by GC, layout, or
tab throttling. Precision ~0.02 ms at 48 kHz. Every time-indexed event in the
system is expressed as a value of this clock. Never convert to wall time; never
schedule from `Date.now()`, `performance.now()`, or `setTimeout()`.

**Clock 2 — Worker `setInterval(25)` (scheduler).** Runs on its own OS thread,
so main-thread jank cannot delay it; browsers maintain the requested interval in
background tabs as long as the context is producing sound. The Worker cannot
read `AudioContext.currentTime` directly, so the main thread posts
`{ audioTime, wallTime }` on each tick and the Worker interpolates between syncs
with its own `performance.now()`.

**Clock 3 — `requestAnimationFrame` (renderer).** Display refresh, 60–120 Hz.
Each callback reads Clock 1 at its start and computes frame state from that
absolute value — never from accumulated deltas. rAF frames may be dropped under
load; a visual stutter is acceptable, an audio gap is not.

## 3. The engine interface

`IAudioEngine` is defined and documented in
[`../../src/engines/audio/IAudioEngine.js`](../../src/engines/audio/IAudioEngine.js) —
that file is the contract, including the `AudioEngineCapabilities`,
`VoiceHandle`, and `VoiceSpec` shapes. It is not restated here, because a copy
would drift from it (and did).

Two rules bind every caller:

- Call only interface methods. Engine-specific APIs are invisible above the
  interface, which is what makes implementations comparable.
- Automate parameters with timed `AudioParam` calls (`setValueAtTime`,
  `linearRampToValueAtTime`), never synchronous assignment.

## 4. Scheduler and orchestrator (planned)

**`SessionScheduler.worker.js`** pre-computes the full session timeline on
`START_SESSION`. Symmetry voices dominate the count: a 30-minute session with
three voices averaging 2 Hz yields ~10,800 events at ~346 KB — comfortably
within a Worker's budget. Each 25 ms tick estimates current audio time, scans
for events in `[now, now + 0.100]`, and posts them out.

```
main → worker    START_SESSION · PAUSE_SESSION · RESUME_SESSION · STOP_SESSION
                 CLOCK_SYNC { audioTime, wallTime }        (every 25 ms tick)
worker → main    SCHEDULE_VOICE · STOP_VOICE · SET_PARAMETER   (+ audioTime)
```

A 100 ms lookahead against a sub-millisecond message round trip leaves ~75 ms of
latency headroom before timing error reaches 25 ms. On pause the queue is
preserved and dispatch stops; on resume the scheduler recalibrates against the
resumed clock and keeps each pending event at its original session-relative
position.

**`StimulationOrchestrator`** owns the session: it starts the scheduler,
translates its messages into `IAudioEngine` calls, and fans the engine's timing
state out to the visual and haptic engines. It is the single place that knows
about all three engine types, and it calls only interface methods.

**`ProtocolRunner`** is stateless and translates preset JSON
([`PRESET_FORMAT.md`](PRESET_FORMAT.md)) into `VoiceSpec` objects plus an event
timeline. Its one non-obvious rule is the breathing override resolution from
[`SESSION_MODEL.md`](SESSION_MODEL.md): use `sessionSpec.userMp0` when it is
non-null, otherwise the preset's `voice.mp0` — and likewise for `userMp1` and
`userMd`.

## 5. Autoplay policy and context lifecycle

An `AudioContext` starts `'suspended'` and cannot resume until a user gesture
has occurred. **Call `resume()` inside the play button's own event handler**,
before any scheduling — never in `onMount`, a `setTimeout`, or any non-user
event, or the resume silently fails or throws.

On iOS Safari the `AudioContext` must be *created* inside the gesture handler,
not merely resumed. `initialize()` therefore defers construction to the first
gesture when an early attempt fails or the context is immediately suspended.

## 6. Capability detection and fallback

`getCapabilities()` reports `supportsAudioWorklet`, `supportsWasm`,
`supportsSharedArrayBuffer`, `sampleRate`, `outputLatency`, and
`implementationName`. Check before selecting a DSP path; never assume.

`SharedArrayBuffer` gates threaded WASM paths and needs COOP/COEP headers, which
GitHub Pages cannot serve — see the hosting note in `CLAUDE.md` §9. Treat it as
unavailable until runtime hosting moves.

As built, `createAudioEngine()` in
[`../../src/engines/audio/audioEngines.js`](../../src/engines/audio/audioEngines.js)
owns this. Each engine declares the capability flags it `requires`; if the
selected one's are not all present, the factory returns the default `vanilla`
engine and reports `fellBack: true`. `vanilla` requires nothing, so a missing
AudioWorklet degrades the session to native Web Audio rather than blocking it.
There is no `ScriptProcessorNode` path — deprecated, main-thread, and not precise
enough.

`NullAudioEngine` (`silent`) also requires nothing, but it is a user choice
rather than a fallback: it implements the full contract with no sound while
owning a real `AudioContext`, so the clock, control modulation, and visual
previews behave exactly as with a sounding engine.

`outputLatency` is also the haptic offset: haptics and audio share no clock, so
haptic events are delayed by `outputLatency` to line up (`CLAUDE.md` §6.4).

## 7. Platform notes

**iOS Safari.** Create the context in a gesture handler. `navigator.vibrate` is
absent — test `typeof navigator.vibrate === 'function'`, since it returns
`undefined` rather than `false`. `outputLatency` may be `undefined`; guard with
`?? 0`. Sample rate is always 48000; do not request another.

**Background tabs.** Chrome throttles `setInterval` to 1 Hz when no audio plays,
but restores the requested interval once the context is `'running'` and
producing sound. Resume before the session starts, not when the tab opens.

**Chromium audio-process crashes.** The audio process is isolated; if it dies,
`audioContext.state` becomes `'interrupted'`. Listen for `'statechange'`, notify
the user, and offer to restart the session.

**Sample rate.** Worklets read the `sampleRate` global rather than assuming
48000 — hardware may give 44100 or 96000. No timing constant is hardcoded.

## 8. Verification

As built, the engines are checked with deterministic `OfflineAudioContext`
harnesses (sine accuracy, binaural L/R separation, noise spectral tilt, drone
beating, tremolo depth and rate, sample playback) plus the unit tests beside the
source, all run by `make test`.

Planned: a compliance suite run against every implementation (interface complete,
`getCapabilities()` fields present, no throw on valid input, clean `dispose()`),
and signal-level integration tests — beat frequency within ±0.1 Hz by FFT,
breathing phase correct at t=30 s, Symmetry onsets within ±2 ms.

Before a phase release, check by hand: 30 minutes without audible glitches;
pause/resume preserving breathing phase; five minutes backgrounded and still in
sync on return; iOS Safari starting after a tap with haptics silently absent; and
a 4× CPU-throttled device holding timing error under 5 ms.
