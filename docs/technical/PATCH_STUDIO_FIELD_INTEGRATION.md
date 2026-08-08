# Patch Studio × Sensory Field integration plan

> **Status:** Target design — adopted 2026-08-08; implementation has not begun.
> [ADR 0046](../decisions/0046-one-studio-two-authoring-modes.md) makes the
> integration mandatory. The current implementations remain described by
> [PATCH_STUDIO.md](PATCH_STUDIO.md) and [SENSORY_FIELD.md](SENSORY_FIELD.md)
> until each milestone below ships.

## 1. Outcome

Sensory Field becomes a **starter-template and compatibility-entry family inside
Patch Studio**, not a deleted experience and not a component embedded with its
old runtime intact. Users keep the simple “start gently” path and the named Field
scenes, but each chosen experience expands to ordinary Studio tracks. The
application gains one document, one persistence seam, one transport, one audio
engine, one clock, one safety gate, and one export boundary.

The completed architecture is:

```text
/creator/ ───────────────┐
/field/* compatibility ─┴─> Studio shell
                              │
                     template/import intent
                              │
                   ordinary live patch tracks
                              │
               one transport + one AudioContext clock
                              │
                  renderer/stage registry
                              │
       spatial sources -> shared composition/projection
                              │
                    delivered-state snapshot
             ┌────────────────┼─────────────────┐
        lossless patch     SSTIM Preset    ExposureProfile
        and package        projection      when applicable
```

This is a product merge only when Field templates and legacy imports create
normal tracks that play through the Studio runtime. A shared navigation bar,
iframe, tab, or wrapper around two autonomous components does not meet the
requirement.

## 2. As-built baseline

| Concern | Patch Studio today | Sensory Field today | Required convergence |
|---|---|---|---|
| Routes | `/creator/` | `/field/`, `/field/tree/`, `/field/abstract/`, `/field/landscape/` | `/creator/` canonical; old routes request the corresponding starter or legacy import |
| State | `patch-studio-model-1`, arbitrary control/audio/visual/haptic tracks | `sensory-field-model-1` plus three scene-state formats | One canonical patch graph; template metadata cannot carry execution state |
| Persistence | Local or Firestore `PatchStore` | Four `bsclab.field*` local-storage keys | One `PatchStore`; explicit, recoverable legacy conversion |
| Playback | Engine, voice handles, transport, rAF loop in `PresetCreator.svelte` | Separate engine, handles, transport, and rAF loop in `SensoryField.svelte` | One extracted controller and one audio-clock authority |
| Visuals | Nine composited CSS/DOM track types | Fixed colour, marker depth, and three stereoscopic scenes | First-class colour and spatial visual tracks; content-specific sources feed one shared Studio composition/projection stage behind a renderer registry |
| Safety | Shared flash helpers; session-only Studio acknowledgement | Shared helpers; acknowledgement in live state but excluded from persistence | One session-only acknowledgement, never serialized or migrated |
| Export | Lossless patch and package; partial SSTIM `Preset` projection | SHACL-tested SSTIM `ExposureProfile` | Preserve both semantic views and derive them from one delivered snapshot |

Two current defects belong in the stabilization milestone, because adding an
adapter on top would make them harder to diagnose: the model renamed its control
types to `LFO` and `Permutation`, but tempo-sync and validation tables still
test the old `Martigli` and `Symmetry` names and one user warning still tells
people to add those old oscillator types; and the Patch RDF report says
“SHACL-validated” although the producer path does not run SHACL.

## 3. Boundary rules

### 3.1 One model, ordinary tracks

A Field starter is a pure constructor for normal Studio tracks. The basic
starter creates a colour-field visual plus the applicable left/right audio and
control tracks; marker, tree, abstraction, and landscape starters create
ordinary spatial visual tracks. After insertion, there is no managed Field group
and no separate editing contract: tracks may be renamed, duplicated, reordered,
layered, modulated, or removed like any others.

Optional origin metadata may remember which starter created a track. It is
provenance only and must not determine playback, export eligibility, or validity.
Conveniences such as “link ears” are explicit edit operations or template
inputs, never a second stored frequency or gain. Merely opening a template menu
or compatibility route must not mutate an existing patch. A starter may request
a presentation technique, but if the current patch already has a different
stage setting the user must explicitly keep the current presentation or apply
the starter's setting; a track-local projector is not created as a workaround.

### 3.2 One runtime

Extract engine lifecycle, voice handles, play/stop, frame evaluation,
and delivered-state calculation from the Studio monolith before importing Field
features. Renderers receive time from that controller. `performance.now()` may
remain a non-playing preview clock, but sounding or session playback uses
`AudioContext.currentTime`.

Loading a Field starter or legacy import must not call `createAudioEngine()`,
create an autonomous animation loop, or retain another set of voice handles.
Adding ordinary Field-derived tracks follows the same lifecycle as adding any
other track; the completed merge has no special mode switch that can restart or
reinterpret playback.

Haptic tracks remain authoring/preview-only until the separately roadmapped
`IHapticEngine` and delivery path ship. The Field merge does not silently add
haptic delivery.

### 3.3 Separate semantic layers

The merge produces several honest views of one activity; they are not synonyms:

| Artifact | What it says | Authority |
|---|---|---|
| Patch JSON / session package | Exact executable authoring state | Canonical, lossless payload |
| SSTIM `Preset` projection | Engine configuration that the public ontology can represent | Partial until every source path is mapped or reported |
| SSTIM `ExposureProfile` | Delivered media, channels, rates, capabilities, and boundaries for the reviewed applicable track subset | Derived from delivered/clamped runtime state |
| SSTIM `StimulusSpecification` | Engine-independent physical/perceptual output | Emit only with sufficient calibration; not implied by a gain slider |
| Catalog-compatible JSON | Optional delivery artifact for a declared adapter and subset | Never the canonical Studio model |

The existing Field exposure export is retained as a golden behavior. It must
continue exporting the **delivered** flash rate after the safety clamp, not the
raw authored value. Eligibility is determined from track content and delivery
policy, never from Field-template provenance.

### 3.4 A delivered configuration, not an animation-frame sample

The delivered-state snapshot is a deterministic description of the delivered
configuration and control laws: resolved channel roles, enabled sources,
authored values, safety-clamped limits, and active modulation definitions. It is
not the instantaneous opacity, disparity, or oscillator value on the rAF frame
when Export is clicked. Given the same patch, delivery policy/consent, and fixed
identifier/timestamp inputs, semantic export must be byte-equivalent regardless
of current animation phase.

## 4. Field-to-patch mapping contract

The adapter is directional and pure: a normalized legacy Field state becomes a
canonical patch plus a structured mapping report. After conversion, the result
is ordinary Studio content; there is no reverse synchronization with the legacy
Field object or an assumption that every arbitrary patch can be squeezed into a
Field template.

| Field concept | Canonical representation | Important rule |
|---|---|---|
| Fixed colour and intensity | New first-class colour-field visual track | Preserve the actual on-colour; do not approximate with hue alone |
| Legacy `offColor` | Explicitly dormant migration data or a separately approved new behavior | Current Field always blinks to black; do not count `offColor` as delivered equivalence |
| Blink and duty cycle | Colour-field/Blink parameters using the shared safety clamp | Consent remains runtime-only; expose authored and delivered values separately |
| Field/source switches | First-class track/channel enabled or inactive state | Disabled sources retain settings for later re-enable; do not hide them in view metadata or drop them |
| Left/right tone | Two hard-panned `Carrier` tracks | Preserve unequal ear gains; do not always collapse to one `BinauralBeat` |
| Left/right noise | Two hard-panned `Noise` tracks | Preserve noise colour, filter, gain, and channel role |
| Monaural beat | Existing tremolo contract on every enabled tone **and noise** voice | Preserve rate, depth, and mode; rate changes must update every tremolo-bearing voice |
| Binaural beat | Frequencies on the two delivered ear tracks | A derived center/beat UI is allowed; left/right remain executable truth |
| Marker depth | First-class spatial visual track plus shared-stage presentation settings | Store disparity/depth, grid, and motion on the track; store technique, canonical eye order, and camera/view settings once on the stage |
| Tree, abstraction, landscape | Content-specific spatial sources behind the common spatial-track contract | Convert Tree to the shared scene representation first; compose sources before the shared stage projects them |
| Beat-driven depth | Explicit link to a general-rate sinusoidal control covering the Field's 0–40 Hz range | Existing breathing LFO (3–60 s) and stepped Permutation cannot reproduce it |
| Breath-driven depth | Explicit link to the breathing-shaped LFO | No Field-only time loop or hidden driver |
| “Link ears” | Template input or explicit multi-track edit operation | Convenience only; never becomes a second executable value |
| Selected starter | Optional origin/provenance metadata | Playback and semantic export must not depend on it |
| Flash acknowledgement | No serialized mapping | Must be renewed per session |

Spatial source configuration belongs to each track; presentation configuration
belongs once to the shared Studio visual stage. Sources produce the neutral
scene model, compatible layers are composed, and the stage then applies mono,
stereo pair, anaglyph, autostereogram, or another reviewed presentation. This is
a shared geometric projection, not the SSTIM RDF projection. It must not become
one untyped bag of every scene family's optional fields, and the merge does not
require artificial depth fields on the nine existing 2D track types.

Multiple spatial tracks may coexist and share one camera, eye order, and output
topology. Compatible geometry follows the normal track order, opacity, and
blend contracts before projection; inherently full-frame presentation such as
an autostereogram must declare and test its composition constraints rather than
silently hiding or excluding tracks.

Every nested or discrete field introduced by the spatial contract must be
handled by portable-package accounting: mapped to SSTIM, listed as unmapped with
a reason, or classified as non-semantic authoring metadata. Numeric-only
scanning is insufficient.

## 5. Implementation sequence

### Milestone 0 — pin the contracts and fixtures

- Apply ADR 0046 as the implementation boundary and pin this plan.
- Capture persisted/migration fixtures for default, visual-only, audio-only,
  marker depth, tree, abstraction, and landscape. Cover tone/noise ×
  linked/unlinked ears × none/monaural/binaural beat, including unequal gains
  and disabled sources whose settings must survive re-enable.
- Keep capped/acknowledged blink in runtime safety fixtures, not persisted
  migration fixtures: both produce the same patch, while session consent changes
  only the delivered configuration snapshot.
- Pin starter-expansion cases: insertion into an empty patch, addition to an
  existing patch, repeated insertion, independent removal/duplication/reordering
  of generated tracks, and asymmetric edits after a linked-ear starter. Template
  origin must have no effect on subsequent execution or export.
- Pin a starter whose requested presentation conflicts with the patch's current
  stage setting: Keep preserves the current stage, Apply changes it explicitly,
  and dismissing the prompt changes nothing.
- Pin compatibility-route behavior with an open draft: opening a route makes no
  mutation until the user chooses Add, Replace, or Keep current patch.
- Pin current voice specifications, exports, routes, local-storage keys, safety
  behavior, and Field starter copy in tests before moving code.
- Fix the `LFO`/`Permutation` validation/tempo-sync keys and stale oscillator
  warning copy.
- Fix and pin the current live-update inconsistency in which monaural tremolo is
  constructed on noise voices but later rate changes update tone voices only.
- Decide whether the additive scene-track shape is safely readable as
  `patch-studio-model-1`; otherwise introduce a new model tag with a v1 importer.

Exit gate: fixtures describe the current delivered behavior, not merely UI
defaults, and the intended model-version rule is recorded.

### Milestone 1 — extract shared runtime and rendering primitives

- Extract the planned `src/ui/creator/patchTransport.js` (or a neutral successor)
  from `PresetCreator.svelte`: engine lifecycle, voice creation, transport,
  frame evaluation, and delivered-state snapshot.
- Extract the Studio visual conditional into a renderer/stage registry.
- Move the Stereoscopic Tree onto the already shared `SceneStage` contract used
  by abstraction and landscape.
- Separate content-specific spatial source generation from the shared geometric
  view/projection stage, and give marker depth an adapter to that contract.
- Give every playing visual renderer controller time; retain
  `performance.now()` only for explicitly non-playing previews.
- Add controller tests before adding the Field starter flows.

Exit gate: current Patch Studio behavior and exports are stable, and the runtime
can be mounted by a small harness without mounting the full editor.

### Milestone 2 — extend the canonical patch graph

- Add explicit colour-field and first-class spatial visual-track contracts,
  including content-specific source configuration and modulatable numeric
  parameters, plus a separate shared stage-presentation contract.
- Register spatial source types through the normal visual-track descriptor path;
  they must support ordinary track creation, rename, enable, duplicate, removal,
  ordering, blend, persistence, package, and share operations.
- Define compatible-layer composition before projection and the constraints of
  full-frame stage techniques, including multiple spatial tracks and
  autostereogram output.
- Cache deterministic scene generation by normalized source configuration; only
  cheap view properties may be evaluated on every animation frame.
- Add a general-rate sinusoidal control contract covering 0–40 Hz, with phase,
  waveform, and Field-equivalence tests. Do not widen/redefine the existing
  breathing LFO silently; any such change needs explicit model migration.
- Add first-class enabled/inactive semantics so a disabled visual, depth, audio,
  tone, or noise source retains its authored settings without being delivered.
- Implement pure `fieldToPatch()` adapters for the main Field and all three
  scene families, returning mapping and warning reports.
- Add normalizer, export/import fixed-point, modulation-link, and voice-spec
  equivalence tests.
- Extend package comparison beyond numeric parameters and audio-only links to
  nested scene configuration and visual modulation.

Exit gate: every legacy fixture becomes a lossless executable patch for all
behavior the old implementation actually delivered.

### Milestone 3 — ship Field starters as ordinary Studio tracks

- Add Field starter actions to Studio's normal add flow. The basic starter
  inserts its colour, audio, and control tracks; marker, tree, abstraction, and
  landscape starters insert their corresponding spatial visual tracks.
- Reuse Field control components only where they edit the same canonical track
  fields as ordinary Studio controls; do not bring over Field engine,
  persistence, transport, or shadow state.
- Keep the low-commitment entrance, conservative defaults, fullscreen behavior,
  reduced-motion behavior, and photosensitivity explanation.
- Allow every inserted track to participate independently in ordinary Studio
  editing and mixing. Removing origin metadata or changing a source type must
  not detach, invalidate, or silently repair other tracks.
- Treat a starter's preferred stage presentation as an explicit suggested edit,
  never as a hidden per-track view or an automatic override of an open patch.
- Test starter expansion and normal lifecycle operations, including multiple
  spatial tracks and a mixture of Field-derived and manually created tracks.

Exit gate: starter output is indistinguishable in lifecycle and execution from
equivalent manually created tracks, and only one draft, engine, transport, audio
clock, frame loop, and safety acknowledgement exist.

### Milestone 4 — preserve semantic truth at cutover

- Derive `ExposureProfile` from the applicable ordinary tracks and the delivered
  snapshot; keep the existing SHACL state matrix green. Template provenance must
  neither grant nor remove export eligibility.
- Preserve the current scope honestly: the main Field has an exposure exporter;
  tree, abstraction, and landscape currently do not. The mandatory merge does
  not fabricate profiles for them. Either label those scenes non-exportable or
  add separately reviewed mappings plus SHACL-tested fixtures for each before
  offering scene exposure download.
- Make Patch projection accounting exhaustive, including mute, tremolo,
  envelopes, modes, blend, samples, scene data, modulation, and tempo sync.
- Add real producer-adjacent SHACL validation before describing or downloading
  Patch RDF as conformant. If that gate is not ready, block the affected
  semantic export and return its validation status rather than delaying the
  runtime merge behind a false claim; never emit unvalidated RDF.
- Expose lossless package import/download in Studio separately from simple patch
  JSON. Version the package before adding an exposure artifact to it.

Exit gate: no serialized source path disappears silently, and each RDF download
passes the exact profile it declares.

### Milestone 5 — migrate routes and local state

- Detect `bsclab.field`, `bsclab.field.tree`, `bsclab.field.abstract`, and
  `bsclab.field.landscape`, then offer a previewed one-time conversion.
- Preserve the original records until the user confirms the converted patch;
  never auto-upload, auto-delete, overwrite an open patch, or migrate consent.
- Make `/field/*` thin compatibility entry points that select the appropriate
  Field starter or migrated draft inside Studio.
- On navigation with an open/unsaved Studio draft, preview and confirm before a
  compatibility entry point loads a template or converted state. Direct cold
  loads may select the requested template immediately.
- Update the entrance, navigation, About copy, offline cache/routes, and docs;
  announce any later redirect-removal window before it starts.

Exit gate: all four historic URLs work in static/offline builds, bookmarks open
the intended starter/import intent, and migration is recoverable.

### Milestone 6 — remove duplicate ownership

- Remove standalone Field engine, transport, persistence, and shell code only
  after fixture, migration, and route gates pass.
- Keep pure geometry, scene generators, semantic mapping, and exposure export in
  neutral reusable modules.
- Run the deprecation window before removing any legacy-state reader.

The mandatory merge is complete only at this milestone—not when the first Field
starter becomes visible in Studio.

## 6. Mandatory merge versus companion conformance work

Point 1 does not require a BioSynCare adapter, rendered-signal equivalence,
new exposure profiles for the three rich scenes, or closing every SSTIM
vocabulary gap. It does require one honest source of execution truth, no safety
or migration regression, deterministic current-scope exposure export, and no
semantic artifact that silently loses new data or claims validation that did not
run.

The P1/R1/R2/X1 assurance targets in
[`PATCH_STUDIO_CONFORMANCE_AND_NEUTRALITY.md`](../ecosystem/PATCH_STUDIO_CONFORMANCE_AND_NEUTRALITY.md)
are the recommended neutral companion track. When the merged model emits a
given Patch/RDF/package artifact, its applicable profile and loss-accounting
gates must pass; otherwise that artifact stays unavailable while the unified
runtime can still ship. The optional BSC
adapter begins only after the merged model and all four assurance targets are
stable.

## 7. Ordering and parallel work

The dependency spine is **M0 → M1 → M2 → M3 → M4/M5 → M6**. Within it:

- fixture capture, current correctness fixes, and renderer extraction can run
  in parallel;
- semantic mapping design should review M2 while the track contract is still
  cheap to change;
- the migration UI, starter expansion, and route wrappers can be developed
  against fixtures while spatial track renderers are being integrated;
- BioSynCare catalog conversion must wait for the canonical merged model, but a
  generic adapter interface and neutral naming can be agreed earlier.

Do not combine extraction, model migration, UI redesign, and route deletion in
one patch. Each milestone keeps a runnable fallback and a reviewable failure
surface.

## 8. Acceptance matrix

- **Runtime:** one engine, transport, audio clock, frame loop, and live draft;
  loading a starter or compatibility intent creates no autonomous runtime.
- **Audio:** migrated voice specs match type, pan, frequency, gain, noise
  colour/filter, enabled state, and tremolo across the full tone/noise and beat
  matrix. Add deterministic offline-render comparison when an engine supports
  it, without claiming cross-hardware bit identity.
- **Visual:** colour, blink, duty, eye ordering, technique, depth, motion, and
  every spatial source survive export/import; sounding visuals use the audio
  clock. Spatial tracks pass normal lifecycle and layering tests, including
  multiple tracks, one shared stage authority, presentation-conflict prompts,
  and full-frame projection modes.
- **Safety:** the shared clamp and gate are exercised; above-threshold consent
  is per-session and absent from patch, package, migration, and cloud storage;
  consent changes the delivery snapshot, never the saved patch.
- **Semantics:** Field's SHACL matrix remains green; Patch RDF is actually
  validated; every new field is mapped or explicitly reported; repeated export
  with fixed metadata is byte-stable regardless of current rAF phase. Scenes
  without reviewed exposure mappings do not offer a misleading export.
- **Portability:** patch export→import is a fixed point, and cross-origin Level 1
  and Level 2 checks include visual modulation and nested/discrete scene state.
- **Migration:** conversion is previewed, opt-in, local, non-destructive, and
  never writes Firestore without a later explicit Save.
- **Compatibility:** `/field/*` works online, offline, and in a static build;
  entering from an open draft never replaces it without confirmation.
- **Accessibility:** keyboard controls, focus, reduced motion, visual gate, and
  fullscreen exit remain operable in Studio and every `/field/*` entry flow.

Relevant verification commands at completion are `make test`, `make check`,
`make session-conformance`, `make build`, `make smoke-static`, and—when
RDF/profile files or projections change—`make validate`. Add a production-build
browser smoke covering all four `/field/*` entry points, including offline
navigation and open-draft confirmation. A milestone is not complete because the
UI looks integrated.

## 9. Principal risks

| Risk | Control |
|---|---|
| Cosmetic merge leaves two runtimes | Definition of done requires one model/transport/store |
| Beginner experience is lost | Retain Field starters, names, conservative defaults, explanations, and route aliases |
| Scene data vanishes from packages | Exhaustive path accounting plus fixed-point fixtures |
| Template identity becomes hidden execution state | Expand once to ordinary tracks; treat origin only as optional provenance |
| Opaque spatial output hides other visual tracks | Specify and test composition for every projection mode |
| Audio/visual timing regresses | Controller-supplied audio time for every playing renderer |
| Consent becomes durable | Keep acknowledgement outside all serializable models |
| Monolith grows during merge | Extract controller and renderer registry before features |
| Optional commercial mapping distorts the core | Keep it behind the neutral adapter boundary in the companion strategy |
