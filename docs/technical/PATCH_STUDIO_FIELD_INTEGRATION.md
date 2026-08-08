# Patch Studio × Sensory Field integration plan

> **Status:** Target design — adopted 2026-08-08; implementation has not begun.
> [ADR 0046](../decisions/0046-one-studio-two-authoring-modes.md) makes the
> integration mandatory. The current implementations remain described by
> [PATCH_STUDIO.md](PATCH_STUDIO.md) and [SENSORY_FIELD.md](SENSORY_FIELD.md)
> until each milestone below ships.

## 1. Outcome

Sensory Field becomes a **guided workspace inside Patch Studio**, not a deleted
experience and not a component embedded with its old runtime intact. Users keep
the simple “start gently” path and the named Field scenes; the application gains
one document, one persistence seam, one transport, one audio engine, one clock,
one safety gate, and one export boundary.

The completed architecture is:

```text
/creator/ ───────────────┐
/field/* compatibility ─┴─> Studio shell
                              ├─ Guided Field workspace
                              └─ Advanced track workspace
                                      │
                                one live patch graph
                                      │
                   one transport + one AudioContext clock
                                      │
                  audio + visual renderers; haptic preview
                                      │
                              delivered-state snapshot
                       ┌──────────────┼───────────────┐
                  lossless patch   SSTIM Preset   ExposureProfile
                  and package      projection     when applicable
```

This is a product merge only when Guided and Advanced views edit the same live
graph and playback through the same runtime. A shared navigation bar, iframe,
tab, or wrapper around two autonomous components does not meet the requirement.

## 2. As-built baseline

| Concern | Patch Studio today | Sensory Field today | Required convergence |
|---|---|---|---|
| Routes | `/creator/` | `/field/`, `/field/tree/`, `/field/abstract/`, `/field/landscape/` | `/creator/` canonical; old routes deep-link to guided workspaces |
| State | `patch-studio-model-1`, arbitrary control/audio/visual/haptic tracks | `sensory-field-model-1` plus three scene-state formats | One canonical patch graph; guided metadata cannot carry execution state |
| Persistence | Local or Firestore `PatchStore` | Four `bsclab.field*` local-storage keys | One `PatchStore`; explicit, recoverable legacy conversion |
| Playback | Engine, voice handles, transport, rAF loop in `PresetCreator.svelte` | Separate engine, handles, transport, and rAF loop in `SensoryField.svelte` | One extracted controller and one audio-clock authority |
| Visuals | Nine composited CSS/DOM track types | Fixed colour, marker depth, and three stereoscopic scenes | First-class colour/stereo scene tracks behind a renderer registry |
| Safety | Shared flash helpers; session-only Studio acknowledgement | Shared helpers; acknowledgement in live state but excluded from persistence | One session-only acknowledgement, never serialized or migrated |
| Export | Lossless patch and package; partial SSTIM `Preset` projection | SHACL-tested SSTIM `ExposureProfile` | Preserve both semantic views and derive them from one delivered snapshot |

Two current defects belong in the stabilization milestone, because adding an
adapter on top would make them harder to diagnose: the model renamed its control
types to `LFO` and `Permutation`, but tempo-sync and validation tables still
test the old `Martigli` and `Symmetry` names and one user warning still tells
people to add those old oscillator types; and the Patch RDF report says
“SHACL-validated” although the producer path does not run SHACL.

## 3. Boundary rules

### 3.1 One model, two views

Guided Field is a projection/editor of a managed track group. Advanced Studio
can display and edit those same tracks. All values that affect execution—voice
type, frequency, gain, visual colour, blink, stereo technique, depth, motion,
and modulation—belong to the tracks.

View-only metadata may contain:

- the IDs that constitute the guided group;
- conveniences such as “link ears”;
- the selected control panel or scene template.

It must not contain a second frequency, gain, colour, clock, or consent value.
If advanced edits can no longer be represented by the guided controls, the
guided view displays **partial/detached** and offers a deliberate repair action.
It never rewrites the patch merely because the view opened.

### 3.2 One runtime

Extract engine lifecycle, voice handles, play/stop, frame evaluation,
and delivered-state calculation from the Studio monolith before importing Field
features. Renderers receive time from that controller. `performance.now()` may
remain a non-playing preview clock, but sounding or session playback uses
`AudioContext.currentTime`.

Opening Guided Field must not call `createAudioEngine()`, create an autonomous
animation loop, or retain another set of voice handles. Switching between
Guided and Advanced while playing must not restart or audibly alter playback.

Haptic tracks remain authoring/preview-only until the separately roadmapped
`IHapticEngine` and delivery path ship. The Field merge does not silently add
haptic delivery.

### 3.3 Separate semantic layers

The merge produces several honest views of one activity; they are not synonyms:

| Artifact | What it says | Authority |
|---|---|---|
| Patch JSON / session package | Exact executable authoring state | Canonical, lossless payload |
| SSTIM `Preset` projection | Engine configuration that the public ontology can represent | Partial until every source path is mapped or reported |
| SSTIM `ExposureProfile` | Delivered Field-oriented media, channels, rates, capabilities, and boundaries | Derived from delivered/clamped runtime state |
| SSTIM `StimulusSpecification` | Engine-independent physical/perceptual output | Emit only with sufficient calibration; not implied by a gain slider |
| Catalog-compatible JSON | Optional delivery artifact for a declared adapter and subset | Never the canonical Studio model |

The existing Field exposure export is retained as a golden behavior. It must
continue exporting the **delivered** flash rate after the safety clamp, not the
raw authored value.

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
canonical patch plus a structured mapping report. Reverse editing is a guided
view over recognized tracks, not an assumption that every arbitrary patch can
be squeezed into Field controls.

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
| Marker depth | First-class stereoscopic scene track | Store view method, canonical eye pair, disparity/depth, grid, and motion |
| Tree, abstraction, landscape | The same scene-track contract with a typed scene kind | Reuse one renderer registry; convert Tree to the shared scene renderer first |
| Beat-driven depth | Explicit link to a general-rate sinusoidal control covering the Field's 0–40 Hz range | Existing breathing LFO (3–60 s) and stepped Permutation cannot reproduce it |
| Breath-driven depth | Explicit link to the breathing-shaped LFO | No Field-only time loop or hidden driver |
| “Link ears” and selected panel | Guided-view metadata | Convenience only; never changes output without an explicit edit |
| Flash acknowledgement | No serialized mapping | Must be renewed per session |

Every nested or discrete field introduced by the scene contract must be handled
by the portable-package accounting: mapped to SSTIM, listed as unmapped with a
reason, or classified as non-semantic authoring metadata. Numeric-only scanning
is insufficient.

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
- Pin partial/detached cases: missing managed track, unsupported track inside the
  group, broken role ID, an asymmetric edit while `linkEars` is true, and an
  advanced modulation the guided controls cannot express. Opening Guided Field
  must make zero mutations; repair is a separate confirmed action.
- Pin current voice specifications, exports, routes, local-storage keys, safety
  behavior, and Guided Field copy in tests before moving code.
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
- Give every playing visual renderer controller time; retain
  `performance.now()` only for explicitly non-playing previews.
- Add controller tests before binding the Field UI.

Exit gate: current Patch Studio behavior and exports are stable, and the runtime
can be mounted by a small harness without mounting the full editor.

### Milestone 2 — extend the canonical patch graph

- Add explicit colour-field and stereoscopic-scene track contracts, including
  all discrete renderer/view configuration and modulatable numeric parameters.
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

### Milestone 3 — put Guided Field inside Studio

- Componentize Field controls and scene renderers without bringing their engine
  or persistence ownership with them.
- Add a Studio workspace selector: **Guided Field** and **Advanced** edit the
  identical draft.
- Keep the low-commitment entrance, conservative defaults, fullscreen behavior,
  reduced-motion behavior, and photosensitivity explanation.
- Display partial/detached state when advanced edits leave the guided subset.
- Test every pinned partial/detached case: merely opening Guided Field is
  read-only, and repair requires an explicit confirmation.

Exit gate: one draft, engine, transport, audio clock, frame loop, and safety
acknowledgement exist regardless of the active view; switching views during
playback is behaviorally inert.

### Milestone 4 — preserve semantic truth at cutover

- Derive `ExposureProfile` from the managed Field track group and the delivered
  snapshot; keep the existing SHACL state matrix green.
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
  Guided Field template or migrated draft inside Studio.
- On navigation with an open/unsaved Studio draft, preview and confirm before a
  compatibility entry point loads a template or converted state. Direct cold
  loads may select the requested template immediately.
- Update the entrance, navigation, About copy, offline cache/routes, and docs;
  announce any later redirect-removal window before it starts.

Exit gate: all four historic URLs work in static/offline builds, bookmarks open
the intended guided mode, and migration is recoverable.

### Milestone 6 — remove duplicate ownership

- Remove standalone Field engine, transport, persistence, and shell code only
  after fixture, migration, and route gates pass.
- Keep pure geometry, scene generators, semantic mapping, and exposure export in
  neutral reusable modules.
- Run the deprecation window before removing any legacy-state reader.

The mandatory merge is complete only at this milestone—not when the workspace
first becomes visible in Studio.

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
- the migration UI and route wrappers can be developed against fixtures while
  Guided Field is being componentized;
- BioSynCare catalog conversion must wait for the canonical merged model, but a
  generic adapter interface and neutral naming can be agreed earlier.

Do not combine extraction, model migration, UI redesign, and route deletion in
one patch. Each milestone keeps a runnable fallback and a reviewable failure
surface.

## 8. Acceptance matrix

- **Runtime:** one engine, transport, audio clock, frame loop, and live draft;
  Guided↔Advanced switching does not restart or change output.
- **Audio:** migrated voice specs match type, pan, frequency, gain, noise
  colour/filter, enabled state, and tremolo across the full tone/noise and beat
  matrix. Add deterministic offline-render comparison when an engine supports
  it, without claiming cross-hardware bit identity.
- **Visual:** colour, blink, duty, eye ordering, technique, depth, motion, and
  every scene kind survive export/import; sounding visuals use the audio clock.
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
  fullscreen exit remain operable in both workspaces.

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
| Beginner experience is lost | Retain Guided Field name, defaults, controls, and route aliases |
| Scene data vanishes from packages | Exhaustive path accounting plus fixed-point fixtures |
| Advanced edits are silently coerced | Partial/detached guided state and deliberate repair |
| Audio/visual timing regresses | Controller-supplied audio time for every playing renderer |
| Consent becomes durable | Keep acknowledgement outside all serializable models |
| Monolith grows during merge | Extract controller and renderer registry before features |
| Optional commercial mapping distorts the core | Keep it behind the neutral adapter boundary in the companion strategy |
