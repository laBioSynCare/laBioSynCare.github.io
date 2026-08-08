# Patch Studio × Sensory Field integration plan

> **Status:** Accepted target design — adopted 2026-08-08; partially implemented
> 2026-08-08. Public route cutover, the additive track/stage model, pure
> Field-to-track adapters, inactive-source retention, live starter append with
> explicit stage choice, visible conversion reports/acknowledgement, and shared
> visual composition have shipped.
> Runtime extraction, complete conversion fidelity and lifecycle behavior,
> unified exposure export and producer-adjacent SHACL, browser/offline gates, and legacy
> removal remain open. [ADR 0046](../decisions/0046-one-studio-two-authoring-modes.md)
> makes the completed integration mandatory; [PATCH_STUDIO.md](PATCH_STUDIO.md)
> and [SENSORY_FIELD.md](SENSORY_FIELD.md) describe the current checkpoint.

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

## 2. Decision-time baseline and current checkpoint

The first two columns record the baseline that motivated ADR 0046. The current
column is the as-built state on 2026-08-08; it does not imply that the completion
gate in the final column has passed.

| Concern | Patch Studio at decision time | Sensory Field at decision time | Current checkpoint | Required completion |
|---|---|---|---|---|
| Routes | `/creator/` | `/field/`, `/field/tree/`, `/field/abstract/`, `/field/landscape/` | Every `/field/*` page is a thin redirect to `/creator/?starter=…`; visible navigation uses those canonical starter URLs | Static/offline and browser acceptance for every alias |
| State | `patch-studio-model-1`, arbitrary control/audio/visual/haptic tracks | `sensory-field-model-1` plus three scene-state formats | Current `patch-studio-model-3` owns the model-2 spatial foundation plus an explicit optional depth-to-size cue; genuine models 1 and 2 import, and pure adapters retain disabled tone/noise/depth as inactive ordinary tracks | Close the remaining fidelity and lifecycle gaps |
| Persistence | Local or Firestore `PatchStore` | Four `bsclab.field*` local-storage keys | `PatchStore` remains canonical; Studio reads all four legacy keys in memory and leaves them untouched | Complete the deprecation window before removing legacy readers/data |
| Playback | Engine, voice handles, transport, rAF loop in `PresetCreator.svelte` | Separate engine, handles, transport, and rAF loop in `SensoryField.svelte` | Public entry points use Studio's one routed runtime; the old standalone runtime code remains, and Studio lifecycle/frame evaluation is still monolithic | One extracted controller, audio-clock authority, and delivered-state snapshot; remove duplicate legacy ownership |
| Visuals | Nine composited CSS/DOM track types | Fixed colour, marker depth, and three stereoscopic scenes | Fourteen ordinary types exist. Spatial sources group at the first spatial position and compose before one projection; vector blend executes, while autostereogram blend is explicitly not applicable. Static SIRDS is clock-gated and dynamic refresh is capped at 8 fps | Descriptor registry plus lifecycle/browser gates |
| Safety | Shared flash helpers; session-only Studio acknowledgement | Shared helpers; acknowledgement in live state but excluded from persistence | Studio applies the shared visual gate and session-only flash acknowledgement to the new tracks | Derive and test one delivered-state snapshot without serializing consent |
| Export | Lossless patch and package; partial SSTIM `Preset` projection | SHACL-tested SSTIM `ExposureProfile` | Patch projection recursively reports unmapped nested/discrete leaves and no longer claims validation; the Field exporter remains a legacy golden mapper | Unified Studio exposure derivation plus real producer-adjacent SHACL |

The two decision-time correctness defects are fixed: tempo sync, validation, and
warning copy now use `LFO`, `Permutation`, and the new `Sinusoid` type; the Patch
RDF report now states that its producer does **not** run SHACL. Recursive
unmapped-leaf accounting also covers nested and discrete stage, track, config,
modulation, and control state. This is loss reporting, not conformance: actual
producer-side SHACL validation remains open.

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

**Current checkpoint.** The starter dialog shows the full structured conversion
report. Warnings, behavior corrections, or unsupported items require an explicit
review acknowledgement before mutation. **Add + keep stage** and **Add + apply
suggested stage** both append directly to the live draft; neither rebuilds the
draft nor infers stage ownership from whether visual tracks happen to exist. If
playback is active, newly added audio tracks receive ordinary live voice handles.
**Replace patch** remains a separate destructive choice, and **Cancel** changes
nothing. Rename, enable, modulation, and removal use ordinary Studio cards;
duplicate and reorder operations are not yet available in the Studio UI.

### 3.2 One runtime

Extract engine lifecycle, voice handles, play/stop, frame evaluation,
and delivered-state calculation from the Studio monolith before importing Field
features. Renderers receive time from that controller. `performance.now()` may
remain a non-playing preview clock, but sounding or session playback uses
`AudioContext.currentTime`.

**Current checkpoint.** The first route/UI cutover reused the sole publicly
routed Studio runtime before this extraction. `PresetCreator.svelte` still owns
engine lifecycle, voice handles, play/stop, and the rAF loop. Its controller time
comes from `AudioContext.currentTime` when an engine exists and otherwise from
`performance.now()`, and the shared stage consumes that value. No extracted
`patchTransport` or independently mountable controller harness exists yet.

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

**Current checkpoint.** The legacy exporter and its SHACL matrix remain in the
repository as the golden mapper. The canonical Studio route does not yet derive
or offer an `ExposureProfile` from ordinary tracks, and no unified delivered
snapshot exists.

### 3.4 A delivered configuration, not an animation-frame sample

The delivered-state snapshot is a deterministic description of the delivered
configuration and control laws: resolved channel roles, enabled sources,
authored values, safety-clamped limits, and active modulation definitions. It is
not the instantaneous opacity, disparity, or oscillator value on the rAF frame
when Export is clicked. Given the same patch, delivery policy/consent, and fixed
identifier/timestamp inputs, semantic export must be byte-equivalent regardless
of current animation phase.

This remains a completion contract. Current Patch export serializes authored
state and the current RDF projector operates on that export; neither is the
delivered-state snapshot described here.

## 4. Field-to-patch mapping contract

The adapter is directional and pure: a normalized legacy Field state becomes a
canonical patch plus a structured mapping report. After conversion, the result
is ordinary Studio content; there is no reverse synchronization with the legacy
Field object or an assumption that every arbitrary patch can be squeezed into a
Field template.

| Field concept | Canonical representation | Important rule |
|---|---|---|
| Fixed colour and intensity | New first-class colour-field visual track | Preserve the actual on-colour; do not approximate with hue alone |
| Legacy `offColor` | `ColorField.config.offColor` | The adapter deliberately activates the authored value and reports this as a behavior correction because the standalone Field persisted it but blinked to hard-coded black |
| Blink and duty cycle | Colour-field/Blink parameters using the shared safety clamp | Consent remains runtime-only; expose authored and delivered values separately |
| Field/source switches | First-class track/channel enabled or inactive state | Switched-off tone/noise sources remain authored `muted` tracks; switched-off depth remains an `enabled=false` `DepthMarkers` recipe. Global switches preserve delivered silence/inactivity without discarding settings |
| Left/right tone | Two hard-panned `Carrier` tracks | Preserve unequal ear gains; do not always collapse to one `BinauralBeat` |
| Left/right noise | Two hard-panned `Noise` tracks | Preserve noise colour, filter, gain, and channel role |
| Monaural beat | Existing tremolo contract on every enabled tone **and noise** voice | Preserve rate, depth, and mode; rate changes must update every tremolo-bearing voice |
| Binaural beat | Frequencies on the two delivered ear tracks | A derived center/beat UI is allowed; left/right remain executable truth |
| Marker depth | First-class spatial visual track plus shared-stage presentation settings | Store camera-space X/Y placement and independent Z depth/disparity on the track. Store the optional per-track depth-to-size cue explicitly; store technique, canonical eye order, and disparity scale once on the stage |
| Tree, abstraction, landscape | Content-specific spatial sources behind the common spatial-track contract | Convert Tree to the shared scene representation first; compose sources before the shared stage projects them |
| Beat-driven depth | Explicit link to a general-rate sinusoidal control covering the Field's 0–40 Hz range | Existing breathing LFO (3–60 s) and stepped Permutation cannot reproduce it |
| Breath-driven depth | Explicit fixed-rate `Sinusoid` at `1 / breathPeriodSec` | The legacy “breath” signal is sinusoidal; do not substitute the session-ramping breathing LFO or hide a renderer-owned loop |
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

For a spatial track, X and Y are camera-space view-plane offsets applied after
camera yaw, while Z is a separate depth offset used for binocular disparity or
the autostereogram depth buffer. The orthographic default keeps size independent
of Z. Model 3's optional `depthAffectsScale` flag adds a bounded perspective cue
when requested—nearer sources grow and farther sources shrink—without conflating
X movement, Z disparity, and the independent authored `spatialScale`.

Multiple spatial tracks may coexist and share one camera, eye order, and output
topology. They cannot occupy independently projected layers: the track-array
topology groups every enabled spatial source into one composition boundary at
the first enabled spatial position, retaining source order inside the group,
because composition must precede projection. Colour fields retain their authored
order around that boundary.

**Current checkpoint.** Primitive/track opacity and each spatial track's blend
execute in the vector mono, stereo-pair, and anaglyph renderers. Autostereogram is
a SIRDS depth-buffer output, so primitive blend is explicitly not applicable and
the inspector says so rather than presenting an inert control. Static spatial
sources stay off the controller-clock invalidation path; time-varying
autostereogram/camera output is quantized to at most 8 full-frame updates per
second. Production-browser regression coverage remains open.

Every nested or discrete field introduced by the spatial contract must be
handled by portable-package accounting: mapped to SSTIM, listed as unmapped with
a reason, or classified as non-semantic authoring metadata. Numeric-only
scanning is insufficient.

This recursive accounting now ships in the Patch projector for stage, nested
configuration, modulation/tempo state, and discrete track/control leaves. It
does not make the resulting RDF SHACL-validated.

## 5. Implementation sequence

### Milestone 0 — pin the contracts and fixtures

**Status: partial.** ADR 0046 is pinned and the model-version decision is now
explicit: genuine `patch-studio-model-1` and `patch-studio-model-2` documents
import, while all new exports use `patch-studio-model-3`. Model 2 remains the
historical first spatial schema; model 3 records the optional depth-to-size cue.
The stale control-name validation, tempo-sync keys, and warning are fixed;
the new adapter gives monaural tremolo to both tone and noise and reports the
legacy live-update correction. Version import/rejection coverage and pure model,
adapter, starter stage-policy, control, scene, and round-trip cases exist.
Disabled tone/noise retention is covered across linked/unlinked and global-audio
states. The full beat-mode, persisted-state, delivered-voice, and browser fixture
matrix and old standalone runtime correction are not complete.

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
- Keep the shipped model boundary pinned: model-2 features are rejected under a
  model-1 tag, and model-3 `depthAffectsScale` state is rejected under either
  older tag. Genuine model-1 and model-2 files, links, stored records, packages,
  and projections remain readable through explicit migration.

Exit gate: fixtures describe the current delivered behavior, not merely UI
defaults, and the intended model-version rule is recorded.

### Milestone 1 — extract shared runtime and rendering primitives

**Status: partial.** Neutral scene generation/composition, `treeToScene`, marker
generation, a mono-capable shared `SceneStage`, `StudioVisualStage`, and
controller-time input for the new stage have shipped. Deterministic source scenes
are cached by normalized type/configuration. `patchTransport`, an independently
mountable controller harness, and a descriptor-driven renderer registry have not
shipped; legacy Tree/Field shells remain in the repository.

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

**Status: partial.** `ColorField`, `DepthMarkers`, `TreeScene`, `AbstractScene`,
`LandscapeScene`, shared `visualStage`, spatial transforms, and the fixed-rate
phase-addressable `Sinusoid` originated in `patch-studio-model-2`, the historical
first spatial schema. Current `patch-studio-model-3` adds the explicit per-track
`depthAffectsScale` flag. Genuine model-1 and model-2 documents remain readable
through explicit migration, with the new flag defaulted off. Pure
adapters, normalizers, deterministic cache/composition tests, export/import
fixed-point cases, disabled-source retention, vector blend, explicit SIRDS blend
non-applicability, clock-gated static rendering, 8-fps dynamic SIRDS cadence, and
recursive nested/discrete loss accounting have shipped. Exact legacy trajectory
and one-sided clamp fidelity, ordinary duplicate/reorder UI, and complete
equivalence/cross-origin and browser gates remain open.

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

**Status: partial.** All four starters are available in Studio and through
compatibility URLs. Add appends to the live draft and offers explicit keep/apply
stage choices; the full report is visible and requires acknowledgement when it
contains review-sensitive entries. Starter output uses ordinary track cards,
modulation, enable, rename, inspect, remove, save, and shared-stage paths; no
Field engine or store is mounted. Duplicate/reorder UI, complete lifecycle/
component tests, and browser acceptance with mixed manual and Field-derived
tracks remain open.

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

**Status: partial.** Patch RDF now recursively accounts for nested/discrete
unmapped state and explicitly disclaims producer validation. Unified delivered
state, ordinary-track `ExposureProfile` derivation, producer-adjacent SHACL, and
any reviewed rich-scene exposure mappings have not shipped. The legacy Field
exposure exporter and its SHACL suite remain only as golden behavior.

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

**Status: partial.** Studio detects all four legacy keys, converts records only
in memory, leaves originals intact, exposes the complete conversion report, and
gates review-sensitive Add/Replace actions on acknowledgement. Add has explicit
keep/apply-stage variants and appends live; Replace and Cancel remain distinct.
`/field/*` routes and visible navigation now select the corresponding Studio
starter. Production/static/offline browser coverage, all open-draft and
accessibility cases, About/offline-cache review, and a deprecation announcement
remain open.

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

**Status: not started.** The standalone Field engine, transport, state/persistence
models, shells, and scene pages remain in source as legacy code. No deprecation
window or removal gate has completed.

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

The intended dependency spine was **M0 → M1 → M2 → M3 → M4/M5 → M6**.
The first implementation slice advanced model, renderer, starter, and route work
in parallel and cut public routes over before extracting the controller/registry.
Those skipped prerequisites remain open work, not waived requirements. Within
the remaining work:

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

These are completion gates. The partial implementation described above has not
yet passed the matrix as a whole.

- **Runtime:** one engine, transport, audio clock, frame loop, and live draft;
  loading a starter or compatibility intent creates no autonomous runtime.
- **Audio:** migrated voice specs match type, pan, frequency, gain, noise
  colour/filter, enabled state, and tremolo across the full tone/noise and beat
  matrix. Add deterministic offline-render comparison when an engine supports
  it, without claiming cross-hardware bit identity.
- **Visual:** colour, blink, duty, eye ordering, technique, depth, motion, and
  every spatial source survive export/import; sounding visuals use the audio
  clock. Verify the first-spatial-position composition boundary, vector blend,
  explicit blend non-applicability for autostereogram, static SIRDS clock gating,
  and the 8-fps cap for time-varying full-frame output in production browsers.
  Spatial tracks still must pass normal lifecycle and layering tests.
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
  never writes Firestore without a later explicit Save; the complete report and
  required acknowledgement remain accessible by keyboard and assistive technology.
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
