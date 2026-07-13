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

Signed-in users can also save this same export object to Firestore via
`src/firebase/patches.js`. Patch documents live in `patchStudioPatches`, are
owner-scoped by `firestore.rules`, and load through `draftFromPatchExport()`,
which normalizes older or partial JSON back into the live draft shape.

---

## 9. Validation

`validateDraft(draft)` returns `{ level: 'error' | 'warning', message }[]`,
surfaced in the studio footer. It checks: a patch name is set; BPM / beats-per-bar
are in range when enabled; session length > 0; at least one control and one
sensory track exist; Martigli period ≥ 3 s (breathing minimum); Symmetry rate in
`(0, 50]` Hz; every `mod.controlId` and tempo-sync target still resolves.

Unit tests: [`presetDraft.test.js`](../../src/ui/creator/presetDraft.test.js),
[`tempo.test.js`](../../src/ui/creator/tempo.test.js).

---

## 10. Known gaps and planned improvements

> **Forward-looking, not as-built.** §1–§9 mirror the code. This section records
> the gaps identified for the planned Patch Studio improvement work and is the
> shared reference for that effort. Each item is grounded in the current code so
> the work can proceed against repo truth. Tracked as checkboxes in
> [`../../TODO.md`](../../TODO.md) ("Software — Phase 2 → UI — Patch Studio").

### 10.1 The export is a dead-end (highest priority)

`buildPatchExport()` produces a `patch-studio-model-1` object (§8) that only
`draftFromPatchExport()` and Firestore (`src/firebase/patches.js`) consume. There
is **no bridge to the preset catalog JSON** ([`PRESET_FORMAT.md`](PRESET_FORMAT.md),
`header` + `voices`) or to an RDF instance under
`static/ontology/instances/presets/`. So a patch can be designed, played, and
cloud-saved, but it cannot become a catalog preset — which is the artifact the
BSC Lab → BioSynCare pipeline (`CLAUDE.md` §11) and the knowledge browser
(`src/rdf/presets.js`) actually consume. The studio is a design surface wired to
nothing downstream.

The two models are **structurally divergent**, so this is a lossy, partial
mapping — not a re-serialisation:

| | Patch Studio (`patch-studio-model-1`) | Catalog preset (`PRESET_FORMAT.md`) |
|---|---|---|
| Shape | control tracks *modulate* sensory-track params (`{value, mods, tempoSync}`) | static `header` + parametric `voices[]` |
| Audio types | `IsochronicTone`, `BinauralBeat`, `Carrier`, `Noise`, `Drone`, `Sample` | `Binaural`, `Martigli`, `Martigli-Binaural`, `Symmetry` only |
| Non-audio | visual + haptic tracks | none (audio only) |
| Metadata | `patchName` only | `group`, `targetBand`, `evidenceTier`, `cautionTags`, multilingual `desc*`/`med2*`/`uses*`/`techDesc*`, `headphonesMode`, … |
| Breathing | Martigli **control track** modulating other tracks | Martigli / Martigli-Binaural **audible voice** |

Consequences that must be decided before implementing (see
[ADR 0026](../decisions/0026-patch-studio-catalog-bridge.md)):

- Only a **mappable subset** round-trips: `BinauralBeat → Binaural`; a `Symmetry`
  control + `IsochronicTone` → `Symmetry` voice (isochronic, `noctaves: 0`); a
  `Martigli` control modulating a carrier/binaural → `Martigli` /
  `Martigli-Binaural`. `Carrier`/`Noise`/`Drone`/`Sample`, all visual, and all
  haptic tracks have **no catalog voice** and are dropped or blocked.
- The catalog `header` carries scientific/human metadata that **cannot be derived**
  from a patch. A conversion needs a **metadata-authoring step** (the panel the
  stale TODO called "set group/targetBand/evidence tier").
- The public target is a **BSC Lab reference preset** (bsclab IRI +
  `static/ontology/instances/presets/`), SHACL-validated per §5.4 before it is
  emitted. The private BioSynCare/BSC catalog stays out of this repo.

### 10.2 `PresetCreator.svelte` is a monolith

The component is **~4,365 lines** (`<script>` 1–1282, markup ~985, `<style>`
~2,100) with **~91 functions** in one file, mixing transport, engine lifecycle,
modulation math, tempo sync, Firestore CRUD, keyboard + fullscreen handling, SVG
waveform-path generation, validation display, and the help overlay. It works and
respects the invariants, but the size is a growing maintenance and test liability.
Decomposition (extract, do not rewrite behaviour):

- ✅ **`modulation.js` (pure) — done.** `evalParamValue` (the live-value
  evaluation `clamp(base + Σ amountᵢ·controlValueᵢ)`), `effectiveTempoValue`,
  `clampRange`, `modAmountRange`, `sumMods`, and `resolveBinauralLR` (the
  BinauralBeat `centerFreq`/`beatFreq` → `leftFreq`/`rightFreq` split). The
  component keeps `applyMods` / `controlTrackForTempo` as thin wrappers that own
  the `liveValues` cache, the change-detected `writeAudio`, and the reactive
  `bpmEnabled()` read.
- ✅ **`waveformPaths.js` (pure) — done.** `isoEnvSpec`, `rectanglePath`,
  `sineWavePath`, `isoEnvelopeOutlinePath`, `isoWavePath`, `binauralSumPath`,
  `binauralBeatEnvelopePath`, `noisePath`, `polygonPoints`, `adaptiveSamples`,
  `binauralRowWindow` — SVG scope-preview geometry.
- **`patchTransport.js` (controller):** `createEngine`, `togglePlay`,
  `trackToVoiceSpec`, `startVoiceFor`, `stopVoiceFor`, `stopAllVoices`,
  `restartVoice`, `restartSystem`, and the `rafTick` loop. Keeps the
  `AudioContext.currentTime` clock authority (`CLAUDE.md` §3.1) in one place.
- **Cloud store:** the `refreshCloudPatches`/`saveCloudPatch`/`loadCloudPatch`/
  `renameCloudPatch`/`removeCloudPatch` glue over `src/firebase/patches.js`.
- **Subcomponents:** cloud-patches menu, help overlay, semantic-info panel,
  mix/fullscreen stage, per-track card.

### 10.3 The hard logic is untested

✅ **Addressed for the §10.2 extractions.** The modulation formula, tempo-sync
resolution, binaural center/beat split, and scope geometry now have unit
coverage in `src/ui/creator/modulation.test.js` and `waveformPaths.test.js`
(creator suite 12 → 44 cases): base + Σ amount·control, clamp, mute→gain 0,
tempo-sync duration/rate, the L/R carrier split, and path-string invariants.
Remaining untested logic still lives in the component `<script>` (transport,
`rafTick` orchestration, cloud CRUD) and becomes testable as §10.2 continues.

### 10.4 Visual and haptic are previews, not engines

Per §5 and §6, visual tracks render as CSS/DOM previews (target: the PixiJS
engine in [`VISUAL_ENGINE_ARCHITECTURE.md`](VISUAL_ENGINE_ARCHITECTURE.md)) and
haptics are preview-only. This is honest, roadmapped Phase-2 work
([`ROADMAP.md`](../../ROADMAP.md)), not a defect — listed here so the improvement
plan sees the whole surface. Lower priority than §10.1–§10.3.

### 10.5 Minor

`rafTick` allocates a `new Map()` per frame for control values. Harmless on the
main thread (this is the rAF loop, **not** the worklet `process()` — `CLAUDE.md`
§3.3 does not apply), but trivially hoistable if that loop is touched during
§10.2.
