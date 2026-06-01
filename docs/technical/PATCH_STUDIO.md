# Patch Studio

> **For AI agents:** This document describes the **as-built** real-time
> authoring model used by the Patch Studio (`src/ui/creator/`). It is the
> source of truth for the track/parameter model the running app actually uses.
> It is distinct from two adjacent specifications:
>
> - [`PRESET_FORMAT.md`](PRESET_FORMAT.md) — the canonical preset **JSON
>   catalog** format (`header` + `voices`), shared with BioSynCare. The Patch
>   Studio does **not** read or write that format directly.
> - [`SESSION_MODEL.md`](SESSION_MODEL.md) — the preset-vs-session distinction
>   for reproducible execution records.
>
> The Patch Studio is an interactive *design surface*: it builds an in-memory
> **patch draft** and renders it live through the selected audio engine (see
> [`../../src/engines/README.md`](../../src/engines/README.md)). Its export
> object is tagged `model: "patch-studio-model-1"` and is its own thing — a
> bridge to the catalog/ontology formats is future work.

The canonical implementation is [`src/ui/creator/presetDraft.js`](../../src/ui/creator/presetDraft.js)
(data model) and [`src/ui/creator/PresetCreator.svelte`](../../src/ui/creator/PresetCreator.svelte)
(UI + transport). This document mirrors that code; if they disagree, the code wins
and this document should be corrected.

---

## 1. The draft

A patch draft is a plain object held in Svelte `$state`:

```js
{
  patchName: string,
  timing: { lengthSec, bpmEnabled, beatsPerBar, bpm: { value, mods } },
  playing: boolean,
  controlTracks: [ ... ],   // Martigli / Symmetry — modulation sources
  audioTracks:   [ ... ],   // the audible voices
  visualTracks:  [ ... ],   // visual stimuli (CSS/DOM previews today)
  hapticTracks:  [ ... ],   // Vibration
}
```

Four track families. Control tracks are **modulation sources**; the other three
are **sensory tracks** whose parameters can be modulated by control tracks.

`buildPatchExport(draft)` serialises a draft to a portable object tagged
`model: "patch-studio-model-1"`.

---

## 2. Parameters, modulation, and tempo sync

Every modulatable parameter is an object `{ value, mods, tempoSync? }`:

- `value` — the knob's base value.
- `mods` — an array of modulation links `{ id, controlId, amount, enabled }`.
  The live value is `clamp(base + Σ amountᵢ · controlValueᵢ)`, evaluated every
  animation frame.
- `tempoSync` — optional; when the patch's BPM is enabled, the parameter can be
  derived from musical divisions instead of its raw value. The set of
  tempo-syncable params per track type is `TEMPO_SYNC_TARGETS`.

Parameter knob ranges are `[min, max, step]` tables: `AUDIO_PARAM_RANGE`,
`VISUAL_PARAM_RANGE`, `HAPTIC_PARAM_RANGE`, `MARTIGLI_PARAM_RANGE`,
`SYMMETRY_PARAM_RANGE`, `TREMOLO_PARAM_RANGE`.

The live evaluation runs in `PresetCreator`'s `requestAnimationFrame` loop, which
reads `engine.getAudioContext().currentTime` as its clock (per `CLAUDE.md` §3.1)
and writes changes to live voices via `engine.setVoiceParameter()`.

---

## 3. Control tracks (modulation sources)

`CONTROL_TYPES = ['Martigli', 'Symmetry']`

- **Martigli** — a breathing-shaped oscillation that ramps its period from
  `periodSec` toward `targetPeriodSec` across the session. Params: `periodSec`,
  `targetPeriodSec`, `inhaleRatio`, `amplitude`; `waveform ∈ {sine, triangle,
  square}`. Full model: [`BREATHING_MODEL.md`](BREATHING_MODEL.md).
- **Symmetry** — a change-ringing-style stepped LFO (plain-hunt permutations).
  Params: `nnotes`, `rateHz`, `amplitude`; `family = 'plain-hunt'`. Full model:
  [`SYMMETRY_SYSTEM.md`](SYMMETRY_SYSTEM.md).

A control track's live value is what every linked sensory-parameter `mod`
multiplies by its `amount`.

---

## 4. Audio tracks

`AUDIO_TRACK_TYPES = ['IsochronicTone', 'BinauralBeat', 'Carrier', 'Noise', 'Drone', 'Sample']`

`VOICE_PARAMS` lists the modulatable parameters per type:

| Type | Modulatable params | Discrete options |
|---|---|---|
| `Carrier` | `gain`, `pan`, `frequency` | — |
| `IsochronicTone` | `gain`, `pan`, `frequency`, `pulseRate`, `noteDurationFrac` | `envelope ∈ {square, AR, AD, ADSR}` |
| `BinauralBeat` | `gain`, `leftFreq`, `rightFreq` (virtual `centerFreq`/`beatFreq`) | `binauralMode ∈ {center-beat, left-right}` |
| `Noise` | `gain`, `pan`, `cutoff`, `resonance` | `noiseColor ∈ {white, pink, brown}`, `noiseFilter ∈ {lowpass, bandpass, highpass}` |
| `Drone` | `gain`, `pan`, `frequency`, `detune` | `droneVoices ∈ {3, 5, 7}` |
| `Sample` | `gain`, `pan` | `sampleId ∈ {rain, ocean, wind}` |

Notes:

- **No pan on `BinauralBeat`** — the two carriers are hard-panned L/R by
  definition; a user pan stage defeats the effect (see
  [ADR 0005](../decisions/0005-binaural-carrier-pair-only.md)). `center-beat`
  mode exposes derived `centerFreq`/`beatFreq` knobs that drive the underlying
  `leftFreq`/`rightFreq`.
- **`Noise`** is a broadband source (`noiseColor`) shaped by a state-variable
  filter (`noiseFilter`, `cutoff`, `resonance`). A modulated `cutoff` produces
  breathing filter sweeps.
- **`Drone`** is a stack of `droneVoices` detuned sine oscillators (`detune` in
  cents) — a lush, slowly beating pad.
- **`Sample`** loops a built-in ambient clip from `static/audio/{id}.wav`. The
  clips are synthetic CC0 loops generated by
  [`scripts/gen-ambiences.mjs`](../../scripts/gen-ambiences.mjs).

### 4.1 Tremolo / amplitude modulation (any audio track)

Every audio track carries an optional `tremolo` effect (not a track type):

```js
tremolo: { enabled, rate, depth, mode }   // mode ∈ {'exponential', 'linear'}
```

- `linear` — modulation is linear in **amplitude**.
- `exponential` — modulation is linear in **perceived loudness** (dB).

The tremolo runs at the engine output stage and works on all six voice types
across all four audio engines.

---

## 5. Visual tracks

`VISUAL_TRACK_TYPES = ['Geometry', 'Particles', 'Gradient', 'Blink', 'Oscillate', 'Pacer', 'Ripple', 'Spiral', 'Mandala']`

`VISUAL_VOICE_PARAMS` lists the modulatable params per type (shared registry:
`opacity`, `scale`, `rotationSpeed`, `sides`, `hue`, `blinkRate`, `duty`,
`oscRate`):

| Type | Params | Character |
|---|---|---|
| `Geometry` / `Particles` / `Gradient` | `opacity`, `scale`, `rotationSpeed`, `sides`, `hue` | structured geometry / particles / gradient field |
| `Blink` | `opacity`, `blinkRate`, `duty`, `hue` | photic flicker (rate + duty) |
| `Oscillate` | `opacity`, `scale`, `oscRate`, `hue` | smooth sinusoidal pulsing |
| `Pacer` | `opacity`, `scale`, `oscRate`, `hue` | breathing-pacer orb (slow expand/contract) |
| `Ripple` | `opacity`, `scale`, `oscRate`, `hue` | concentric expanding rings |
| `Spiral` | `opacity`, `scale`, `rotationSpeed`, `hue` | rotating radial sweep |
| `Mandala` | `opacity`, `scale`, `rotationSpeed`, `sides`, `hue` | symmetric rotating polygons |

> **Implementation note.** Visual tracks currently render as live **CSS/DOM
> previews** inside the studio cards and in the mix stage. The GPU visual
> engine (PixiJS) in [`VISUAL_ENGINE_ARCHITECTURE.md`](VISUAL_ENGINE_ARCHITECTURE.md)
> is the target renderer; the track types and parameters defined here are the
> contract it will consume.

### 5.1 Mixing and fullscreen

Each visual track has a `blend` mode (`BLEND_MODES = ['screen', 'lighten',
'normal', 'multiply', 'overlay', 'difference']`). The **Mix** control composites
every visual track into one full-viewport stage (CSS `mix-blend-mode`) and
requests true fullscreen via the Fullscreen API (Esc closes).

### 5.2 Photosensitivity gating

Flickering/moving visuals are gated by the global visual-stimulation setting.
When it is off, previews and the mix stage are suppressed. See
[`PHOTOSENSITIVITY_SAFETY.md`](PHOTOSENSITIVITY_SAFETY.md).

---

## 6. Haptic tracks

`HAPTIC_TRACK_TYPES = ['Vibration']` with params `intensity`, `frequency`,
`pulseRate`, `pattern`. Rendered through the Web Vibration API where available;
silently inert elsewhere (iOS Safari). Today the studio shows a haptic
*preview*; delivery follows the haptic engine interface described in
[`../../src/engines/README.md`](../../src/engines/README.md).

---

## 7. Timing and tempo

`timing = { lengthSec, bpmEnabled, beatsPerBar, bpm: { value, mods } }`.

When `bpmEnabled` is true, tempo-syncable parameters derive their value from
musical divisions of the BPM (`TEMPO_DIVISIONS`, `TEMPO_MODIFIERS` in
[`tempo.js`](../../src/ui/creator/tempo.js)) instead of their raw `value`. BPM
itself is modulatable. `tempoSyncKindForTrackParam(track, param)` resolves which
params on a track are tempo-syncable and as what kind (`duration`, `rate`,
`signedRate`).

---

## 8. Export

`buildPatchExport(draft)` produces:

```js
{
  model: 'patch-studio-model-1',
  patchName,
  timing: { bpmEnabled, bpm, bpmMods, beatsPerBar, lengthSec },
  controlTracks, audioTracks, visualTracks, hapticTracks,
}
```

This is **not** the preset catalog JSON in [`PRESET_FORMAT.md`](PRESET_FORMAT.md)
and **not** a session instance in [`SESSION_MODEL.md`](SESSION_MODEL.md). It is
the studio's own portable representation. Converting a patch into a catalog
preset or an RDF instance is intentionally deferred — when added, the mapping
belongs alongside the preset-format change checklist in
[`../../src/README.md`](../../src/README.md).

---

## 9. Validation

`validateDraft(draft)` returns `{ level: 'error' | 'warning', message }[]`,
surfaced in the studio footer. It checks: a patch name is set; BPM / beats-per-bar
are in range when enabled; session length > 0; at least one control and one
sensory track exist; Martigli period ≥ 3 s (breathing minimum); Symmetry rate in
`(0, 50]` Hz; every `mod.controlId` and tempo-sync target still resolves.

Unit tests: [`presetDraft.test.js`](../../src/ui/creator/presetDraft.test.js),
[`tempo.test.js`](../../src/ui/creator/tempo.test.js).
