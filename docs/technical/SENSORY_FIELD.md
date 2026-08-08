# Sensory Field

> **For AI agents:** The Sensory Field is currently a guided stimulation
> *instrument family* with a runtime separate from Patch Studio. It began as the
> first deliverable rung of the
> sensory-stimulation interface and the reference consumer of the `sstim-ex:`
> exposure ontology. Decision record: [ADR 0011](../decisions/0011-sensory-field-and-flash-safety.md).
> It is bound by the same invariants as the rest of the app — `AudioContext.currentTime`
> is the only AV-sync clock (CLAUDE.md §3.1), conservative wellness framing only
> (CLAUDE.md §3.5), and the photosensitivity layer in
> [PHOTOSENSITIVITY_SAFETY.md](PHOTOSENSITIVITY_SAFETY.md). That is the as-built
> state, not the target: [ADR 0046](../decisions/0046-one-studio-two-authoring-modes.md)
> adopts its capabilities as ordinary first-class Studio tracks over one
> model/runtime and shared visual projection stage; `/field/*` becomes a family
> of template and compatibility entry points. The phased migration is in
> [PATCH_STUDIO_FIELD_INTEGRATION.md](PATCH_STUDIO_FIELD_INTEGRATION.md).

Route: `/field/` ([src/routes/field/+page.svelte](../../src/routes/field/+page.svelte)).
Module: [src/ui/field/](../../src/ui/field/).

---

## 1. What it is

A user picks a full-screen colour and an independent per-ear sound, and presses
Play. That alone is sensory stimulation — the resting, zero-frequency (DC) case.
Turning on **blink** (visual) or a **beat** (audio) adds the time dimension. The
distinctive power is the *contrast across channels*: a static field in one ear
while the other entrains, a binaural beat, a gently blinking colour.

## 2. The channel model

The conceptual target is a per-channel × time matrix — left eye, right eye, left
ear, right ear, tactile — each cell either static (0 Hz) or modulated at a
frequency. Steps 1–3a deliver the **physically honest subset** on commodity
hardware:

| Channel | Delivered now | Laterality |
|---|---|---|
| Visual field | one full-screen field (both eyes) | No — single field |
| Free-view depth pair | two side-by-side eye images for parallel or cross-eye viewing | **Yes**, via free-view stereoscopy |
| Left ear / Right ear | true independent L/R (panned Carrier voices) | **Yes** |
| Tactile | (planned) Web Vibration pulse | No (single actuator) |

Eye-laterality is now delivered only through the free-view depth pair. It is not
yet delivered through VR, AR glasses, eye-tracked displays, or independent
per-eye flicker.

## 3. Steps

- **Step 1 — static field.** Colour + intensity; per-ear tone (frequency, level)
  and/or noise (white/pink/brown). No time variation. Trivially safe.
- **Step 2 — modulation.** Visual **blink** (colour ↔ black at a chosen rate and
  duty) and audio **beat**: *monaural* (one tone, amplitude-modulated, via the
  engine's tremolo) or *binaural* (a small frequency difference between the ears).
  This is where the flash-rate and sound-level safety becomes load-bearing.
- **Step 3a — free-view depth.** Stereoscopic depth from two simple point/stick
  markers whose separation is static or driven by the beat or breath wave. The
  renderer is CSS/SVG-like DOM, not PixiJS. It supports **parallel** and
  **cross-eye** viewing by swapping the left/right image order.
  - **Free-view parallel (wall-eyed)** assigns left image → left eye, the same as
    a **VR headset**. **Cross-eyed** free-viewing assigns left image → right eye —
    the *mirror* of parallel. A cross-eye pair fed to VR/parallel without swapping
    L/R produces **inverted (pseudoscopic) depth**.
  - The stereo *content* transfers across cross-eye, parallel, and future VR, but
    the **L/R ordering is method-specific**. BSC Lab stores one canonical pair
    and swaps for cross-eye viewing. VR remains future work and additionally
    needs lens pre-distortion, IPD, and FOV.
  - Per-eye flicker asymmetry (dichoptic frequency tagging) is a known paradigm
    but compounds photosensitivity risk. It is not implemented in Step 3a and
    must be gated at least as strictly as Step 2 if added later.
- **Step 3b — richer depth scenes.** The **Stereoscopic Tree** (`/field/tree/`,
  [src/ui/field/tree/](../../src/ui/field/tree/)) is the first delivered Step 3b
  scene: a procedural tree whose leaves, branches, and roots each carry an
  (x, y, z) position, so the scene has real depth rather than two markers. One
  shared 3D model is viewed through three user-selectable stereoscopic techniques
  (see §8). More shapes, colour distributions, and future headset/VR paths remain
  planned.

## 4. Audio

Built on the existing `IAudioEngine` ([audioEngines.js](../../src/engines/audio/audioEngines.js)).
Per-ear delivery uses two `Carrier` voices hard-panned −1 / +1 (and `Noise`
voices likewise); a binaural beat is just a frequency difference between them; a
monaural beat is the engine's `tremolo` on equal-frequency tones. The clock is
`AudioContext.currentTime`; `engine.resume()` is called inside the Play gesture
(autoplay policy). Sound level is **advisory only** — BSC Lab cannot measure
delivered SPL — with conservative defaults and a NIOSH 85 dBA / 8 h note.

## 5. Safety

- **Global gate.** The field renders only when `isVisualStimulationOn()` is true
  (see [PHOTOSENSITIVITY_SAFETY.md](PHOTOSENSITIVITY_SAFETY.md)); otherwise a
  placeholder shows.
- **Flash-rate cap.** [flashSafety.js](../../src/ui/safety/flashSafety.js) caps the
  blink rate at the general-safe **3 Hz** (WCAG 2.3.1; Harding / ITU-R BT.1702)
  unless the user makes an explicit **per-session** acknowledgement. Rates in the
  ≈ 15–25 Hz peak band are flagged highest-risk. The acknowledgement is never
  persisted — it is re-confirmed each session by design (ADR 0011).
- **Depth safety.** Step 3a does not add independent per-eye flicker. It can add
  eye strain through free-view convergence/divergence, so exported profiles add
  `boundaryEyeStrain` and `lossHorizontalField`.
- The same 3 Hz threshold is modelled as `sstim-ex:limitFlickerWcag`, so the gate
  and the ontology cannot silently diverge.

## 6. Exposure-profile emission

Every configuration serialises to an `sstim-ex:ExposureProfile`
([exposureProfile.js](../../src/ui/field/exposureProfile.js)), modelled on the
committed reference instance
[`sensory-field-example.ttl`](../../static/ontology/instances/experiments/sensory-field-example.ttl).

The runtime export is **SHACL-conformant** (ADR 0027 closed audit finding
KR-01). It carries a defining framework, a technique or editorial-note baseline,
and — instead of manufactured evidence claims — role-specific statements:
`sstim-ex:ExposureHypothesis` (stereo depth), `sstim-ex:ResearchQuestion`
(calm/arousal self-observation), and `sstim-ex:BoundaryApplicabilityStatement`
(photosensitivity). A delivery description asserts no efficacy. The golden
conformance suite
[exposureProfile.shacl.test.js](../../src/ui/field/exposureProfile.shacl.test.js)
validates every field state against the SSTIM shapes and fails on any drift.
Some visual detail (colours, depth grid) is still summarised rather than fully
captured.

Mapping:

| UI concept | Exposure terms |
|---|---|
| Colour field | `mediumVisualLight`, `modalityVisual`, `patternFixedColor`, `placementEyes`, `capabilityDisplayLightOutput`, `hasGainLevel` |
| Blink | `patternBlinking`, `capabilityDisplayFlicker`, `hasFlickerRateHz`, `hasDutyCycle`, `boundaryPhotosensitivity` |
| Free-view depth | two `mediumStereoscopicVisualPresentation` visual channels, `placementEyeLeft` / `placementEyeRight`, `capabilityFreeViewStereoscopy`, `gainStereoDepth`, `lossHorizontalField`, `boundaryEyeStrain` |
| Per-ear tone | `mediumAirConductedSound`, `modalityAuditory`, `placementEarLeft` / `placementEarRight`, `capabilityHeadphones` + `capabilityStereoSeparation`, `patternContinuous`, `hasFrequencyHz`, `hasGainLevel`, `boundaryHearingRisk` |
| Noise | `patternNoise` + an `audioNoise…` colour concept |
| Beat | `hasBeatFrequencyHz` |

The exported flash rate is the **delivered** (clamped) rate, not the raw slider
value, so the profile reflects what actually played. The "In the ontology" panel
links each active concept to the graph view via
[fieldSemantic.js](../../src/ui/field/fieldSemantic.js).

## 7. File map

```
src/routes/field/+page.svelte               route (thin)
src/routes/field/{tree,abstract,landscape}/+page.svelte   scene routes (thin)
src/ui/field/SensoryField.svelte            main UI: session, clock loop, controls, export
src/ui/field/FieldStage.svelte              render surface (colour fill / fullscreen)
src/ui/field/fieldState.js                  channel state model + persistence (bsclab.field)
src/ui/field/exposureProfile.js             state → sstim-ex:ExposureProfile (N3 Writer)
src/ui/field/fieldSemantic.js               UI concept → ontology IRI (graph links)

src/ui/field/scene/sceneGeom.js             shared: projection, disparity, depth tint, autostereogram
src/ui/field/scene/sceneView.js             shared technique/rotation/depth state + resolveYaw
src/ui/field/scene/SceneStage.svelte        shared renderer (segments/dots/polys × 3 techniques)
src/ui/field/scene/SceneStereo.svelte       shared shell (selector, clock, fullscreen, gate, controls slot)

src/ui/field/tree/treeModel.js              3D tree generator (re-exports shared geom)
src/ui/field/tree/treeState.js              tree state model + persistence (bsclab.field.tree)
src/ui/field/tree/TreeStereo.svelte         tree UI (own stage, predates the shared framework)
src/ui/field/tree/TreeStage.svelte          tree render surface
src/ui/field/abstract/abstractScene.js      Miró/Kandinsky/Klee scene generator
src/ui/field/abstract/abstractState.js      abstract state (bsclab.field.abstract)
src/ui/field/abstract/AbstractField.svelte  abstract page (uses SceneStereo)
src/ui/field/landscape/landscapeScene.js    hills/river/houses/trees/flowers generator
src/ui/field/landscape/landscapeState.js    landscape state (bsclab.field.landscape)
src/ui/field/landscape/LandscapeField.svelte landscape page (uses SceneStereo)
src/ui/safety/flashSafety.js                flash-rate cap + risk classification
```

## 8. Stereoscopic scenes (`/field/tree`, `/field/abstract`, `/field/landscape`)

Step 3b instruments that extend the field's free-view depth from two markers to
full 3D scenes. Three scenes share one renderer and differ only in their
generator:

- **Stereoscopic Tree** (`/field/tree/`) — a procedural tree; leaves, branches,
  and roots each have an (x, y, z) position.
- **Abstraction** (`/field/abstract/`) — shapes scattered in 3D in the spirit of
  a **Miró / Kandinsky / Paul Klee** composition (selectable style).
- **3D Landscape** (`/field/landscape/`) — receding hills, a winding river,
  houses, trees, and flowers, each at its own depth (day / dusk / night).

### Shared scene framework (`src/ui/field/scene/`)

A scene is a flat bag of primitives in normalized 3D space (+y up, +z toward the
viewer), each carrying its own colour:

```
{ background, segments:[{a,b,width,color}], dots:[{x,y,z,r,fill,stroke?}],
  polys:[{pts:[{x,y,z}…], fill, stroke?, closed}] }
```

[sceneGeom.js](../../src/ui/field/scene/sceneGeom.js) holds the scene-agnostic
math (projection, disparity, `depthTint`, the SIRDS kernel);
[SceneStage.svelte](../../src/ui/field/scene/SceneStage.svelte) is the one
renderer (segments → lines, dots → circles, polys → paths, depth-sorted);
[SceneStereo.svelte](../../src/ui/field/scene/SceneStereo.svelte) is the shared
shell (technique selector, depth + rotation controls, the `performance.now()` yaw
clock, fullscreen, the global visual gate, and the ontology panel) with a snippet
slot for each scene's own controls. Each scene generator
(`abstractScene.js`, `landscapeScene.js`, `treeModel.js`) is pure and
deterministic per seed. `spread` is the common depth knob — at `spread = 0` a
scene is planar (z = 0), toward `spread = 1` it is fully three-dimensional. Yaw is
driven by the free-running visual clock (no audio on these pages, so the
AudioContext-only clock rule, CLAUDE.md §3.1, does not apply). The tree predates
the framework and keeps its own `TreeStage`/`TreeStereo`; `treeModel.js`
re-exports the shared geometry and `treeToScene()` can adapt it to `SceneStage`.

One model, three projections (orthographic, so disparity is a pure function of z
with the focal plane at z = 0 — matching the field's `--offset` cue):

| Technique | Term | How it renders |
|---|---|---|
| **Free-view stereo pair** | the codebase's free-view stereoscopy | two SVG panels; each vertex shifted ± `disparity(z)/2`; parallel or cross-eye (panels swap); depth-cued colour optional |
| **Autostereogram** | single-image random-dot stereogram | the scene is rasterised to a per-pixel depth buffer (depth-sorted), then the classic constraint-propagation SIRDS algorithm builds one dot image |
| **Anaglyph** | red/cyan | one SVG, the scene drawn twice (left eye red, right eye cyan) with `mix-blend-mode: screen`; dots filled, everything else outlined; needs red/cyan glasses |

"Stereogram" is ambiguous — the autostereogram is what the word usually means
(a single "Magic Eye" image), whereas the stereo pair is two images. Both are
supported; the codebase term for the two-panel method is **free-view
stereoscopy** (`capabilityFreeViewStereoscopy`).

Safety and framing match the rest of the field: the scene renders only when the
global visual-stimulation gate is on (placeholder otherwise), the auto-rotate
default honours `prefers-reduced-motion`, the motion is gentle and non-flashing
(so the flash-rate cap is not engaged), and all copy is conservative wellness
framing (CLAUDE.md §3.5). The instrument reuses existing stereoscopy exposure
terms for its "In the ontology" panel and does not introduce new ontology IRIs.
