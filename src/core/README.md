# src/core — Orchestration Layer

> **Status: planned — Phase 1.** No source files in this directory exist yet.
> This document describes the target design.

The core layer connects the engine interfaces to the preset data model.
It translates preset JSON into scheduled audio events, coordinates the
three-clock architecture, manages the session lifecycle, and records
session instances.

---

## Files

```
core/
├── MasterClock.js               AudioContext clock interface for other systems
├── StimulationOrchestrator.js   Engine coordination; single entry point for sessions
├── SessionScheduler.worker.js   Web Worker: event queue, lookahead dispatch
├── ProtocolRunner.js            Preset → VoiceSpec translation + timeline
└── SessionRecorder.js           Session instance creation, persistence, export
```

---

## `MasterClock.js`

Provides `AudioContext.currentTime` to systems that need the audio clock
but should not hold a direct reference to the audio engine.

```javascript
import { MasterClock } from './MasterClock.js'

// Initialized once by the Orchestrator with the audio engine
MasterClock.initialize(audioEngine)

// Used anywhere in the system
const t = MasterClock.now()  // → AudioContext.currentTime
```

`MasterClock.now()` is the only permitted source of time for audio-visual
synchronization outside of the engines themselves. Do not call
`audioEngine.getAudioContext().currentTime` from outside the core layer.

---

## `StimulationOrchestrator.js`

Single entry point for session management. Coordinates audio, visual, and
haptic engines with the session scheduler. Calls only interface methods.

```javascript
const orch = new StimulationOrchestrator(audioEngine, visualEngine, hapticEngine)

// Start a session — call INSIDE a user gesture handler
await audioEngine.resume()             // gesture handler required
await orch.startSession(spec, preset)  // begins scheduling + rendering

// Pause and resume
await orch.pauseSession()
await orch.resumeSession()

// Stop and record
const instance = await orch.stopSession()

// Engine swap (research feature)
await orch.switchAudioEngine(newAudioEngine)
await orch.switchVisualEngine(newVisualEngine)
```

The orchestrator registers the audio engine's `onTimingState` callback to
feed breathing phase to both the visual and haptic engines on every audio
block (~2.67 ms at 48 kHz).

---

## `SessionScheduler.worker.js`

A dedicated Web Worker running a 25 ms `setInterval` loop. Immune to
main-thread jank. Maintains the full session event timeline and dispatches
events to the main thread within a 100 ms lookahead window.

**Loaded as a Worker, never imported:**
```javascript
const scheduler = new Worker(
  new URL('./SessionScheduler.worker.js', import.meta.url),
  { type: 'module' }
)
```

**Message protocol (main thread → Worker):**
```javascript
{ type: 'START_SESSION', spec, preset, audioTime }
{ type: 'PAUSE_SESSION' }
{ type: 'RESUME_SESSION', audioTime }
{ type: 'STOP_SESSION' }
{ type: 'CLOCK_SYNC', audioTime, wallTime }   // sent every 25ms by main thread
```

**Message protocol (Worker → main thread):**
```javascript
{ type: 'SCHEDULE_VOICE', voiceId, voiceSpec, audioTime }
{ type: 'STOP_VOICE',     voiceId, audioTime }
{ type: 'SET_PARAMETER',  voiceId, paramName, value, audioTime }
```

**Clock correlation:** The Worker cannot access `AudioContext.currentTime`
directly. The main thread sends `{ audioTime, wallTime }` on every 25 ms
tick. The Worker tracks the drift between audio time and `performance.now()`
to estimate current audio time between syncs:

```javascript
function estimateAudioTime(lastSync) {
  const elapsed = (performance.now() - lastSync.wallTime) / 1000
  return lastSync.audioTime + elapsed
}
```

**Event queue:** Pre-computed on `START_SESSION`. For a 30-minute session with
3 Symmetry voices at 2 Hz average, ~10,800 events are stored as a typed array.
On each 25 ms tick, the Worker scans events in `[now, now + 0.100]` and posts
those to the main thread.

---

## `ProtocolRunner.js`

Stateless. Translates preset JSON to `VoiceSpec` objects (engine-consumable
format) and computes the full event timeline.

```javascript
// Translate a preset voice + session spec overrides → VoiceSpec
const spec = ProtocolRunner.voiceToSpec(presetVoice, sessionSpec)

// Compute complete event timeline for scheduling
const events = ProtocolRunner.computeTimeline(preset, sessionSpec, sessionStartTime)
```

**Session spec breathing override resolution** (from `SESSION_MODEL.md`):
```
1. If sessionSpec.userMp0 !== null  → use userMp0
2. Else                             → use voice.mp0 from preset
```

The same resolution applies to `userMp1` and `userMd`.

---

## `SessionRecorder.js`

Manages the session instance lifecycle: creation, pause event recording,
completion, self-report attachment, and persistence to IndexedDB.

```javascript
// Create specification before pressing play
const spec = SessionRecorder.createSpecification({
  presetId:       preset._id,
  presetVersion:  preset.header.version,
  durationSeconds: 1800,
  userMp0:  null,  // null = use preset default
  userMp1:  null,
  userMd:   null,
  masterVolume:  1.0,
  headphoneMode: 'headphones'
})

// Open instance when play begins
const instance = SessionRecorder.open(spec)

// Attach self-report (optional, requires research consent)
SessionRecorder.attachSelfReport(instance.uuid, {
  primaryAffect:    4,
  focusRating:      4,
  sleepiness:       2,
  subjectiveQuality: 4,
  goalAchieved:     true
})

// Finalize and persist to IndexedDB
await SessionRecorder.finalize(instance.uuid, 'completed')
// status: 'completed' | 'interrupted' | 'abandoned'
```

**Completion status thresholds:**
- `completed` — reached full `durationSeconds`
- `interrupted` — stopped after > 30% of `durationSeconds`
- `abandoned` — stopped before 30% of `durationSeconds`

**SessionRecorder never modifies the preset store.** It reads preset data
by reference only. Session instances are append-only; once finalized, a
session instance is never modified. Corrections are attached records.

**IndexedDB schema version** is tracked by `instanceVersion` (currently
`"1.0"`). Schema migrations run on `db.onupgradeneeded` and are tested
in `tests/core/SessionRecorder.migration.test.js`.

---

## Data flow summary

```
Preset JSON (src/data/presets/)
    ↓
ProtocolRunner.voiceToSpec()
    ↓
VoiceSpec objects
    ↓
ProtocolRunner.computeTimeline()
    ↓
Event timeline (SCHEDULE_VOICE, STOP_VOICE, SET_PARAMETER)
    ↓
SessionScheduler.worker.js (25ms lookahead dispatch)
    ↓
StimulationOrchestrator._onSchedulerMessage()
    ↓
IAudioEngine.scheduleVoice() / stopVoice() / setVoiceParameter()
    ↓
AudioContext (AudioWorklet processors)
    ↓
onTimingState({ audioTime, breathingPhase, breathingPeriod })
    ↓
IVisualEngine.updateBreathingPhase()  ←── rAF renders from cached phase
IHapticEngine.updateBreathingPhase()  ←── pulse at φ=0 and φ=0.5
```
