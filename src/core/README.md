# src/core — Orchestration Layer

> **Status: planned (Phase 2). This directory is empty.** The audio engines
> exist and are driven directly by the Patch Studio (`src/ui/creator/`) through
> the `IAudioEngine` interface. This layer is what will eventually own the
> clock, the scheduler, and the multi-engine session lifecycle.

The design lives in one place —
[`../../docs/technical/AUDIO_ENGINE_ARCHITECTURE.md`](../../docs/technical/AUDIO_ENGINE_ARCHITECTURE.md)
§2 (three clocks) and §4 (scheduler, orchestrator, protocol runner) — rather
than being restated here, where it drifted from both the code and the spec.

Planned files, and the one rule each carries:

| File | Rule |
|---|---|
| `MasterClock.js` | Exposes `AudioContext.currentTime` to systems that must not hold an engine reference. `MasterClock.now()` becomes the only permitted time source for AV sync outside the engines. |
| `StimulationOrchestrator.js` | Single entry point for a session. Calls interface methods only — never engine-specific APIs. |
| `SessionScheduler.worker.js` | Loaded with `new Worker(new URL(...), { type: 'module' })`. Owns the event queue and the 25 ms / 100 ms lookahead dispatch. |
| `ProtocolRunner.js` | Stateless preset → `VoiceSpec` translation and timeline computation. Session values (`userMp0`, `userMp1`, `userMd`) override preset values when non-null. |
| `SessionRecorder.js` | Session instance lifecycle and IndexedDB persistence. Reads presets by reference and never writes to the preset store. |

`SessionRecorder` completion status follows
[`../../docs/technical/SESSION_MODEL.md`](../../docs/technical/SESSION_MODEL.md):
`completed` at full duration, `interrupted` past 30%, `abandoned` before it.
Instances are append-only — once finalized, corrections are attached records,
never edits.
