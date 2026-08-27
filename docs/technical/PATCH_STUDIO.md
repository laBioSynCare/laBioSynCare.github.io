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
> object is tagged `model: "patch-studio-model-3"` and is its own thing. Genuine
> model-1 and model-2 files remain importable through explicit migration, but
> new exports are always model 3 so older readers cannot silently downgrade the
> optional depth-to-size state. Model 2 remains the historical first spatial
> schema. The lossless session package and partial SSTIM RDF projection are
> implemented;
> the one-way catalog JSON adapter is still future work. The link into the
> knowledge layer (the semantic panel and its deep link into the Graph
> Navigator) is implemented and specified in §10, including what it
> deliberately does not do. The adopted plan to
> absorb Sensory Field is partially implemented: ordinary first-class
> colour-field and spatial visual tracks, Field starters/routes, and one shared
> visual projection stage have shipped. Disabled sources remain inactive tracks,
> Add appends live with an explicit stage choice, and conversion reports are
> visible and acknowledgement-gated when needed. Runtime extraction, unified
> exposure export, browser acceptance gates, and legacy removal remain open. See
> [`PATCH_STUDIO_FIELD_INTEGRATION.md`](PATCH_STUDIO_FIELD_INTEGRATION.md).

The canonical draft/runtime implementation is
[`src/ui/creator/presetDraft.js`](../../src/ui/creator/presetDraft.js) (data model)
and [`src/ui/creator/PresetCreator.svelte`](../../src/ui/creator/PresetCreator.svelte)
(UI + transport). Spatial contracts, conversion, and rendering are split across
[`visualTrackModel.js`](../../src/ui/creator/visualTrackModel.js),
[`fieldTrackAdapter.js`](../../src/ui/creator/fieldTrackAdapter.js),
[`fieldStarters.js`](../../src/ui/creator/fieldStarters.js),
[`spatialScene.js`](../../src/ui/creator/spatialScene.js), the ontology bridge
in [`semantic.js`](../../src/ui/creator/semantic.js) (§10), and the
[`StudioVisualStage.svelte`](../../src/ui/creator/StudioVisualStage.svelte),
[`VisualStageControls.svelte`](../../src/ui/creator/VisualStageControls.svelte),
and [`SpatialTrackInspector.svelte`](../../src/ui/creator/SpatialTrackInspector.svelte)
components. This document mirrors that code; if they disagree, the code wins and
this document should be corrected.

---

## 1. The draft

A patch draft is a plain object held in Svelte `$state`:

```js
{
  patchName: string,
  timing: { lengthSec, bpmEnabled, beatsPerBar, bpm: { value, mods } },
  visualStage: { presentationMode, viewingMode, backgroundColor, depthScalePx,
                 zoom, strokeWidth, depthColor, camera },
  playing: boolean,
  controlTracks: [ ... ],   // LFO / Permutation / Sinusoid — modulation sources
  audioTracks:   [ ... ],   // the audible voices
  visualTracks:  [ ... ],   // flat, colour-field, and spatial visual stimuli
  hapticTracks:  [ ... ],   // Vibration
}
```

Four track families. Control tracks are **modulation sources**; the other three
are **sensory tracks** whose parameters can be modulated by control tracks.

`buildPatchExport(draft)` serialises a draft to a portable object tagged
`model: "patch-studio-model-3"`. `draftFromPatchExport()` also accepts genuine
`patch-studio-model-1` and `patch-studio-model-2` documents and rebuilds them
into the current draft shape. Model 1 receives the shared-stage default; model-2
spatial tracks receive `depthAffectsScale: false`. Their next export is model 3.

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
`SYMMETRY_PARAM_RANGE`, `SINUSOID_PARAM_RANGE`, `TREMOLO_PARAM_RANGE`. The two
legacy constant names remain in code after the control-type rename described
below.

The live evaluation runs in `PresetCreator`'s `requestAnimationFrame` loop, which
reads `engine.getAudioContext().currentTime` as its clock (per `CLAUDE.md` §3.1)
and writes changes to live voices via `engine.setVoiceParameter()`.

---

## 3. Control tracks (modulation sources)

`CONTROL_TYPES = ['LFO', 'Permutation', 'Sinusoid']`

- **LFO** — a breathing-shaped oscillator that ramps its period from
  `periodSec` toward `targetPeriodSec` across the session. Params: `periodSec`,
  `targetPeriodSec`, `inhaleRatio`, `amplitude`; `waveform ∈ {sine, triangle,
  square}`. Full mechanism: [`BREATHING_MODEL.md`](BREATHING_MODEL.md).
- **Permutation** — a change-ringing-style stepped control (plain-hunt
  permutations).
  Params: `nnotes`, `rateHz`, `amplitude`; `family = 'plain-hunt'`. Full model:
  [`SYMMETRY_SYSTEM.md`](SYMMETRY_SYSTEM.md).
- **Sinusoid** — a fixed-rate, phase-addressable periodic control for general
  modulation, including Field depth and phase-locked x/y motion. Params:
  `rateHz` (0–40 Hz), `phaseRad` (0–2π), and `amplitude`; `rateHz` can be tempo
  synced. Unlike the breathing LFO, its frequency does not ramp across a session.

Before [ADR 0041](../decisions/0041-stimulus-description-layers-and-the-canonical-schema-gap.md),
these controls were named `Martigli` and `Symmetry`. `LEGACY_CONTROL_TYPES`
migrates stored patches; those technique names remain appropriate for catalog
voices, not for generic control mechanisms.

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

`muted` is the ordinary inactive state for audio tracks: voice construction keeps
the authored frequency, gain, channel, colour/filter, and tremolo but delivers
zero gain. Field conversion therefore emits both `Carrier` and `Noise` tracks for
each effective ear even when a legacy source or global audio switch is off; the
result can be re-enabled without reconstructing discarded settings.

---

## 5. Visual tracks

`VISUAL_TRACK_TYPES = ['Geometry', 'Particles', 'Gradient', 'Blink', 'Oscillate',
'Pacer', 'Ripple', 'Spiral', 'Mandala', 'ColorField', 'DepthMarkers',
'TreeScene', 'AbstractScene', 'LandscapeScene']`

`VISUAL_VOICE_PARAMS` lists the modulatable params per type (full registry:
`opacity`, `scale`, `rotationSpeed`, `sides`, `hue`, `blinkRate`, `duty`,
`oscRate`, `x`, `y`, `z`, `spatialScale`):

| Type | Params | Character |
|---|---|---|
| `Geometry` / `Particles` / `Gradient` | `opacity`, `scale`, `rotationSpeed`, `sides`, `hue` | structured geometry / particles / gradient field |
| `Blink` | `opacity`, `blinkRate`, `duty`, `hue` | photic flicker (rate + duty) |
| `Oscillate` | `opacity`, `scale`, `oscRate`, `hue` | smooth sinusoidal pulsing |
| `Pacer` | `opacity`, `scale`, `oscRate`, `hue` | breathing-pacer orb (slow expand/contract) |
| `Ripple` | `opacity`, `scale`, `oscRate`, `hue` | concentric expanding rings |
| `Spiral` | `opacity`, `scale`, `rotationSpeed`, `hue` | rotating radial sweep |
| `Mandala` | `opacity`, `scale`, `rotationSpeed`, `sides`, `hue` | symmetric rotating polygons |
| `ColorField` | `opacity`, `blinkRate`, `duty` | full-stage authored on/off colours; optional safety-clamped blink |
| `DepthMarkers` | `opacity`, `x`, `y`, `z`, `spatialScale`, `rotationSpeed` | marker/grid recipe in neutral 3D scene space |
| `TreeScene` / `AbstractScene` / `LandscapeScene` | `opacity`, `x`, `y`, `z`, `spatialScale`, `rotationSpeed` | content-specific deterministic recipe feeding the shared scene contract |

`ColorField` owns `{ color, offColor, blinkEnabled }`. Each spatial type owns a
normalized, content-specific `config`; it does not share one optional-field bag.
Spatial transforms live in `params`, and each spatial track has the discrete
`depthAffectsScale` flag. Presentation lives once in `visualStage`:
mono/stereo-pair/anaglyph/autostereogram, parallel/cross viewing, background,
depth scale/colour, zoom, stroke width, and camera yaw/auto-rotation.

### 5.1 Spatial coordinates and the optional perspective cue

The track controls are three distinct camera-space translations applied after
stage camera yaw:

- **X** moves the source horizontally on the view plane.
- **Y** moves it vertically on the view plane.
- **Z** changes depth relative to the focal plane. Positive values are nearer;
  negative values are farther. Z feeds binocular horizontal disparity in a
  stereo pair or anaglyph, and the depth buffer in an autostereogram. It does
  not reuse X or move the source's common, pre-disparity screen position.

The shared stage's `depthScalePx` controls how much disparity a given Z produces.
The projection is orthographic by default, so changing Z does not otherwise
change apparent size. A track may opt into the explicit
`depthAffectsScale: true` perspective cue: positive Z then enlarges the complete
source and negative Z shrinks it. The multiplier is `2^(z/2)`, bounded to
`0.5..2`; it composes with the independent `spatialScale` control. Model-1 and
model-2 imports default this flag to `false`, preserving constant-size behavior.

> **Implementation note.** The original nine flat types still render as live
> **CSS/DOM previews** and mix-stage overlays. `ColorField` and the four spatial
> types render through `StudioVisualStage`: deterministic source geometry is
> cached, enabled spatial tracks are transformed and merged into one neutral
> scene at the first enabled spatial track position, and one `SceneStage` applies
> the selected presentation. Static sources do not subscribe to controller-time
> invalidation. Dynamic autostereogram/SIRDS output is quantized to at most eight
> full-frame refreshes per second. This is a
> shipped shared-stage path, not the still-planned PixiJS engine in
> [`VISUAL_ENGINE_ARCHITECTURE.md`](VISUAL_ENGINE_ARCHITECTURE.md).

### 5.2 Mixing, resizing, and fullscreen

Each visual track has a `blend` mode (`BLEND_MODES = ['screen', 'lighten',
'normal', 'multiply', 'overlay', 'difference']`). The **Mix** control composites
every visual track in a resizable modal whose default width keeps each stereo
pane practical for cross-eyed viewing. **Full screen** is a separate, explicit
action. Esc leaves true fullscreen and returns to the same modal; Esc again (or
**Close**) closes it. CSS blend applies to the nine flat overlays and to
individual `ColorField` layers. Spatial sources compose as primitives before the
single projection. Their opacity and blend execute in vector mono,
stereo-pair, and anaglyph output. Autostereogram is generated from one depth
buffer, so per-primitive blend is not applicable; the spatial inspector states
that and hides the irrelevant selector in that mode.

All enabled spatial sources must compose before projection. The layer plan
therefore represents them as one group at the first enabled spatial position in
the visual-track array, preserving spatial source order inside the group;
`ColorField` layers retain their authored order around that topology boundary.

### 5.3 Photosensitivity gating

Flickering/moving visuals are gated by the global visual-stimulation setting.
When it is off, previews and the mix stage are suppressed. See
[`PHOTOSENSITIVITY_SAFETY.md`](PHOTOSENSITIVITY_SAFETY.md).

### 5.4 Field starters and legacy conversion

The four `/field/*` compatibility intents open a Studio dialog, never another
runtime. Its expanded report displays mapped, dormant, warning, behavior
correction, unsupported, and ignored entries. A warning, correction, or
unsupported entry requires explicit review acknowledgement before Add or
Replace.

**Add + keep stage** and **Add + apply suggested stage** append ordinary tracks
directly to the live arrays; they do not reset transport/controller state or
infer stage ownership from an “empty” patch. During playback, newly appended
audio tracks receive the same live voice-handle treatment as manually added
tracks. **Replace patch** and **Cancel** are separate choices. Conversion retains
switched-off tone/noise as `muted` audio tracks and switched-off depth as an
`enabled=false` `DepthMarkers` recipe.

---

## 6. Haptic tracks

`HAPTIC_TRACK_TYPES = ['Vibration']` with params `intensity`, `frequency`,
`pulseRate`, `pattern`. Today the studio shows a haptic *preview* but does not
call `navigator.vibrate`; delivery through the Web Vibration API remains target
work behind the haptic engine interface described in
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
  model: 'patch-studio-model-3',
  patchName,
  timing: { bpmEnabled, bpm, bpmMods, beatsPerBar, lengthSec },
  visualStage,
  controlTracks, audioTracks, visualTracks, hapticTracks,
}
```

This is **not** the preset catalog JSON in [`PRESET_FORMAT.md`](PRESET_FORMAT.md)
and **not** a session instance in [`SESSION_MODEL.md`](SESSION_MODEL.md). It is
the studio's own portable representation. A partial SSTIM `Preset` projection
and lossless session package now exist in
[`../../src/portability/`](../../src/portability/) and are documented in
[`SESSION_PACKAGE.md`](SESSION_PACKAGE.md). The catalog JSON converter remains
open under [ADR 0026](../decisions/0026-patch-studio-catalog-bridge.md).

Patches are saved through the storage seam in
[`../../src/storage/`](../../src/storage/): `PatchStore` has a local and a
Firestore implementation behind one contract, both exercised by the same
conformance suite, so saving works with or without an account. Firestore
documents live in `patchStudioPatches`, are owner-scoped by `firestore.rules`,
and load through `draftFromPatchExport()`, which explicitly migrates model 1 and
model 2 and normalizes older or partial JSON back into the live draft shape.
Storage, links, packages, and projection accept all three supported identifiers.
They reject model-2 spatial fields mislabeled as model 1, and reject the
model-3-only `depthAffectsScale` field under either older tag.

The native-model history is deliberately small:

| Model | Meaning | Import behavior |
|---|---|---|
| `patch-studio-model-1` | Pre-spatial Studio schema | Supplies the shared-stage and later track defaults, then re-exports as model 3 |
| `patch-studio-model-2` | Historical first spatial schema: shared stage, `Sinusoid`, `ColorField`, and spatial scene tracks | Supplies `depthAffectsScale: false`, then re-exports as model 3 |
| `patch-studio-model-3` | Current schema; makes optional depth-to-size coupling explicit per spatial track | Normalizes and round-trips as the current model |

---

## 9. Validation

`validateDraft(draft)` returns `{ level: 'error' | 'warning', message }[]`,
surfaced in the studio footer. It checks: a patch name is set; BPM / beats-per-bar
are in range when enabled; session length > 0; at least one control and one
sensory track exist; and every `mod.controlId` still resolves. It enforces the
breathing LFO's ≥ 3 s period, the Permutation control's `(0, 50]` Hz rate, the
Sinusoid control's `[0, 40]` Hz rate, and valid tempo-sync targets.

Unit tests: [`presetDraft.test.js`](../../src/ui/creator/presetDraft.test.js),
[`tempo.test.js`](../../src/ui/creator/tempo.test.js),
[`controlSignals.test.js`](../../src/ui/creator/controlSignals.test.js), and
[`visualTrackModel.test.js`](../../src/ui/creator/visualTrackModel.test.js). The
control-rename defect formerly described here is fixed: tempo sync, validation,
and the no-control warning use `LFO`, `Permutation`, and `Sinusoid`. Current
model-3 export, genuine model-1/model-2 migration, and older-tag rejection are
covered across the draft, portability, storage, package, link, and projection
boundaries.

---

## 10. The knowledge-graph bridge

Every knob caption and every track header in the studio is a link into the SSTIM
ontology. Clicking a knob's caption, or a track card's ⌇ button, opens the
semantic panel: the term's human label, its kind, a prose description, its CURIE
and full IRI, and an **Open in graph** link that deep-links the Graph Navigator
straight to that node. This is the only place the authoring surface and the
knowledge layer meet in the UI.

### 10.1 Where the mapping lives

[`src/ui/creator/semantic.js`](../../src/ui/creator/semantic.js) holds two closed
registries, and [`src/ui/field/fieldSemantic.js`](../../src/ui/field/fieldSemantic.js)
holds the matching one for Sensory Field exposure terms:

| Registry | Entries | Keyed by | Resolves to |
|---|---|---|---|
| `TRACK_SEMANTICS` | 23 | track type (plus `LFO`, `Permutation`, `Vibration`) | an OWL class or a `sstim-v:` modality concept |
| `PARAM_SEMANTICS` | 35, of which 29 carry an IRI | parameter name | an SSTIM property or renderable-parameter concept |
| `FIELD_SEMANTICS` | Sensory Field exposure terms | field concept | an `sstim-ex:` term |

Counts drift; `KNOWN_TRACK_TYPES` and `KNOWN_PARAMETERS` are exported from
`semantic.js` for exactly this reason, and the test below recomputes them.

### 10.2 The rules the bridge is held to (KR-17)

`semantic.test.js` parses every module in the manifest's `full` profile and
enforces all of this:

- **Never derive an IRI from a name.** An unmapped parameter returns
  `uri: null`; the panel says *"Not yet mapped to an SSTIM ontology term"* and
  renders no link. Minting `sstim:mysteryKnob` from a knob called `mysteryKnob`
  is the failure this rule exists to prevent.
- **Every non-null IRI must be declared** in the live ontology modules.
- **Every track type the studio can add must be mapped explicitly**, and a
  visual track must never resolve to an audio class. The generic fallback
  (`sstim:Voice`) exists only for a type that does not exist yet; it is not a
  resting place. The five ADR 0046 colour and spatial types
  (`ColorField`, `DepthMarkers`, `TreeScene`, `AbstractScene`, `LandscapeScene`)
  did rest there and reported `sstim:Voice` in the panel and in the graph link
  until they were mapped to `sstim-v:modalityVisual`. The older test proved the
  fallback *was declared*, which is not the same claim as its being *right*.
- **Control tracks point at `sstim:ControlTrack`**, never at `sstim:MartigliVoice`
  or `sstim:SymmetryVoice`. A control track is silent and modulates other tracks;
  those two are audible catalog voices. See ADR 0041.

### 10.3 The link itself

```js
semanticGraphHref(info) === `${applicationRoute('/graph/')}#${localName}`
```

`fieldGraphHref()` builds the same shape. Two properties matter and both are
pinned by tests:

- **It names `/graph/` directly.** The earlier `/#term` form worked only because
  the entrance page forwards a stray hash to the browser, which costs a redirect
  hop and a flash of the wrong page.
- **It goes through `applicationRoute()`.** Under a project-page mount
  (`SSTIM_BASE_PATH=/sstim`, which is what the w3id production cutover deploys),
  a root-relative `/#term` leaves the deployment entirely and lands on the
  owner site. See [`PORTABLE_DEPLOYMENT.md`](PORTABLE_DEPLOYMENT.md).

On arrival `OntologyGraph.resolveHashToNodeId` accepts either a CURIE
(`sstim:BinauralVoice`, and a bare `prefix:` addresses the namespace root) or a
bare local name, widens the visible scope to contain the node, selects it, and
pulses it so the reader can see where the link landed.

### 10.4 What the bridge deliberately does not do

Three limits, so nobody reads more into it than is there:

- **It is one-directional.** Nothing in the Graph Navigator links back into the
  Patch Studio: there is no "patches using this term" affordance, and no
  reference to the studio anywhere in `OntologyGraph.svelte`. A reader can go
  from a knob to a term, never from a term to a knob.
- **It is type-level, not instance-level.** The panel names the class or
  property a track or parameter *is an instance of*. It does not publish the
  patch, and clicking through does not put the patch in the graph. Projecting a
  patch into RDF is a separate path, `src/portability/patchProjection.js` (§8).
- **Coverage is partial, and honestly so.** Of the 31 knob parameters reachable
  in the UI, 25 resolve to an ontology term, and all 20 addable track types do.
  The remaining six carry an explicit registry entry with a null IRI, which is
  how this codebase says *no term yet*: `cutoff`, `resonance`, `detune` and
  `oscRate` have no counterpart in the modules, `opacity` is deliberately not
  equated with `sstim-v:paramLuminance` (an opaque dark layer is opaque and dim
  at once, so the two are different things), and `hue` has no colour category in
  `sstim-v:RenderableParameterScheme`. **Absence from the registry is not a way
  to say "unmapped"**: it yields the raw key as a label and a placeholder
  description, which is how the eight spatial and colour parameters stayed
  invisible to the panel. A test now requires an entry for every knob
  parameter.

---

## 11. Known gaps and planned improvements

> **Forward-looking, not as-built.** §1–§10 mirror the code. This section records
> the gaps identified for the planned Patch Studio improvement work and is the
> shared reference for that effort. Each item is grounded in the current code so
> the work can proceed against repo truth. Tracked as checkboxes in
> [`../../TODO.md`](../../TODO.md) ("Software — Phase 2 → UI — Patch Studio").

### 11.1 The export reaches RDF, but not the catalog

`buildPatchExport()` produces a `patch-studio-model-3` object (§8). The lossless
native/package path exists, the semantic projection is partial, and the catalog
delivery path remains open:

- **SSTIM RDF — partial mapping built; producer validation still open.**
  `src/portability/patchProjection.js` projects a patch into a `sstim:Preset`
  over the declared mappable subset and emits a machine-readable report of every
  recursively visited unmapped leaf in stage state, track configuration,
  modulation/tempo state, and discrete control/track fields. The report clearly
  says that the producer does not invoke SHACL and does not claim that an
  individual export was validated;
  `src/portability/sessionPackage.js` wraps that as a checksummed portable
  package, and `make session-conformance` proves Level 1 and Level 2 equivalence
  across two origins ([SESSION_PACKAGE.md](SESSION_PACKAGE.md)).
- **Catalog preset JSON — still open.** There is no converter to
  [`PRESET_FORMAT.md`](PRESET_FORMAT.md)'s `header` + `voices`. That would be the
  optional version-pinned BSC catalog-adapter output; the knowledge browser
  instead reads separately approved public RDF instances through
  `src/rdf/presets.js`. This is the remaining half of
  [ADR 0026](../decisions/0026-patch-studio-catalog-bridge.md).

The two models are **structurally divergent**, so any catalog conversion is a
lossy, partial mapping — not a re-serialisation:

| | Patch Studio (`patch-studio-model-3`; models 1 and 2 remain importable) | Catalog preset (`PRESET_FORMAT.md`) |
|---|---|---|
| Shape | control tracks *modulate* sensory-track params (`{value, mods, tempoSync}`) | static `header` + parametric `voices[]` |
| Audio types | `IsochronicTone`, `BinauralBeat`, `Carrier`, `Noise`, `Drone`, `Sample` | `Binaural`, `Martigli`, `Martigli-Binaural`, `Symmetry` only |
| Non-audio | visual + haptic tracks | none (audio only) |
| Metadata | `patchName` only | `group`, `targetBand`, `evidenceTier`, `cautionTags`, multilingual `desc*`/`med2*`/`uses*`/`techDesc*`, `headphonesMode`, … |
| Breathing | breathing-shaped `LFO` **control track** modulating other tracks | Martigli / Martigli-Binaural **audible voice** |

Consequences that must be decided before implementing the catalog half:

- Only a **mappable subset** round-trips: `BinauralBeat → Binaural`; a
  `Permutation` control (legacy `Symmetry`) + `IsochronicTone` → `Symmetry`
  voice (isochronic, `noctaves: 0`); a breathing-shaped `LFO` (legacy
  `Martigli`) modulating a carrier/binaural → `Martigli` /
  `Martigli-Binaural`. `Carrier`/`Noise`/`Drone`/`Sample`, all visual, and all
  haptic tracks have **no catalog voice** and are dropped or blocked.
- The catalog `header` carries scientific/human metadata that **cannot be derived**
  from a patch. A conversion needs a **metadata-authoring step**.
- The public target is a **BSC Lab reference preset** (bsclab IRI +
  `static/ontology/instances/presets/`), SHACL-validated per `CLAUDE.md` §5.4
  before it is emitted. The private BioSynCare/BSC catalog stays out of this repo.

### 11.2 `PresetCreator.svelte` is a monolith

The component is **well over four thousand lines** — check with `wc -l`, since a
number written here drifts with every commit — mixing transport, engine lifecycle,
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
- **Cloud store:** ✅ **done** — extracted to
  [`../../src/storage/`](../../src/storage/) as the `PatchStore` seam.
- **Subcomponents:** `StudioVisualStage`, `VisualStageControls`, and
  `SpatialTrackInspector` are extracted. The fullscreen lifecycle, flat visual
  overlays, cloud-patches menu, help overlay, semantic-info panel, and general
  per-track cards remain in `PresetCreator.svelte`.

### 11.3 Hard-logic coverage is partial

✅ **Addressed for the §11.2 extractions.** The modulation formula, tempo-sync
resolution, binaural center/beat split, and scope geometry now have unit
coverage in `src/ui/creator/modulation.test.js` and `waveformPaths.test.js`
(creator suite): base + Σ amount·control, clamp, mute→gain 0, tempo-sync
duration/rate, the L/R carrier split, and path-string invariants. The additive
Field work also has pure coverage in `controlSignals.test.js`,
`visualTrackModel.test.js`, `fieldTrackAdapter.test.js`, `fieldStarters.test.js`,
and `spatialScene.test.js`, including deterministic cache/composition and patch
export/import fixed points, disabled-source retention, stage policies, vector
spatial blend, static clock gating, and the 8-fps SIRDS cadence. Remaining
untested orchestration still lives in the component `<script>`: transport,
`rafTick`, full starter/report lifecycle, fullscreen, and cloud UI behavior.
Production browser/offline route coverage is also still open.

### 11.4 Visual rendering is split; haptic remains a preview

Per §5 and §6, the nine flat visual types still render as CSS/DOM previews,
while `ColorField` and the four spatial types now use the shared
`StudioVisualStage`/`SceneStage` path. This is real mono and stereoscopic
rendering, but it is not an `IVisualEngine` implementation and does not use the
planned PixiJS backend in
[`VISUAL_ENGINE_ARCHITECTURE.md`](VISUAL_ENGINE_ARCHITECTURE.md). Haptics remain
preview-only. Vector spatial blend is implemented; blend is deliberately not
applicable to SIRDS depth-buffer output. Descriptor-driven renderer registration,
production-browser regression, and the general visual engine boundary are still
roadmapped Phase-2 work
([`ROADMAP.md`](../../ROADMAP.md)).

### 11.5 Usability and discoverability

The studio is dense by design: it is an authoring surface, not a player. Two
defects of that density were fixed rather than documented, and both left a
standing trap behind:

- **Knob captions are abbreviated on purpose.** `Knob.svelte`'s `.knob-label`
  is a 56px column showing roughly eight lowercase characters before the
  ellipsis takes over. Raw parameter keys overflowed it into misreadings
  (`inhaleRatio` rendered as "inhaler"). `PARAM_SHORT_LABELS` in
  `PresetCreator.svelte` now supplies a fitting caption and `labelTitle` carries
  the full ontology label on hover. **The trap:** a new parameter longer than
  about eight characters truncates silently unless it is added to that map.
  Nothing fails a build over it.
- **Add-button rows wrap; they used to scroll.** `.col-adds` was
  `overflow-x: auto` with the scrollbar hidden, so on a 1440px window the
  Visual column's fourteen buttons overflowed and the `Mix` button (a primary
  action) was both off-screen and unhinted. The row wraps now.

Open, and not yet decided:

- The header meta (`1c · 1a · 0v · 0h · 0m`, the per-column track counts) is
  unexplained anywhere in the UI.
- The top toolbar presents eleven controls at one visual weight, with transport,
  export, persistence, and destructive actions (`Clear`, `Reset`) undifferentiated.
- The semantic panel is reachable only by clicking a knob caption. The affordance
  is `cursor: help` plus a hover underline, so at rest there is nothing to
  suggest the captions are interactive, and the whole graph bridge (§10) is
  correspondingly easy to miss.
- Unused Visual and Haptic columns still occupy half the viewport.
- None of this is covered by an automated check. Per §11.3, production
  browser/offline route coverage is still open, so every claim about how the
  studio *looks and behaves* rests on manual inspection.

### 11.6 Minor

`rafTick` allocates a `new Map()` per frame for control values. Harmless on the
main thread (this is the rAF loop, **not** the worklet `process()` — `CLAUDE.md`
§3.3 does not apply), but trivially hoistable if that loop is touched during
§11.2.
