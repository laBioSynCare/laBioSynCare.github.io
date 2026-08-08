# Sensory Field

> **For AI agents:** Sensory Field is now a **starter-template and compatibility
> entry family inside Patch Studio**. `/field/*` uses prerendered compatibility
> pages that replace-navigate to ordinary Studio starters and no longer mounts the standalone Field runtime or
> appears as a global-navigation tab. The retained
> `src/ui/field/` components, state models, persistence keys, and exposure
> exporter are legacy conversion/golden-behavior code pending deprecation; they
> are not the canonical public authoring path. Sensory Field began as the first
> deliverable rung of the
> sensory-stimulation interface and the reference consumer of the `sstim-ex:`
> exposure ontology. Decision record: [ADR 0011](../decisions/0011-sensory-field-and-flash-safety.md).
> It is bound by the same invariants as the rest of the app — `AudioContext.currentTime`
> is the only AV-sync clock (CLAUDE.md §3.1), conservative wellness framing only
> (CLAUDE.md §3.5), and the photosensitivity layer in
> [PHOTOSENSITIVITY_SAFETY.md](PHOTOSENSITIVITY_SAFETY.md).
> [ADR 0046](../decisions/0046-one-studio-two-authoring-modes.md) adopts its
> capabilities as ordinary first-class Studio tracks over one model/runtime and
> shared visual projection stage. That cutover is partial: controller extraction,
> unified exposure export, acceptance gates, and legacy removal remain open. The
> phased status is in
> [PATCH_STUDIO_FIELD_INTEGRATION.md](PATCH_STUDIO_FIELD_INTEGRATION.md).

Compatibility route: `/field/` → `/creator/?starter=field`
([src/routes/field/+page.svelte](../../src/routes/field/+page.svelte)). Canonical
module: [src/ui/creator/](../../src/ui/creator/). Retained legacy module:
[src/ui/field/](../../src/ui/field/).

---

## 1. What the starter provides

A user starts with a full-screen colour and independent per-ear sound as ordinary
Studio tracks, then presses Play. That alone is sensory stimulation — the
resting, zero-frequency (DC) case.
Turning on **blink** (visual) or a **beat** (audio) adds the time dimension. The
distinctive power is the *contrast across channels*: a static field in one ear
while the other entrains, a binaural beat, a gently blinking colour.

## 2. The channel model

The conceptual target is a per-channel × time matrix — left eye, right eye, left
ear, right ear, tactile — each cell either static (0 Hz) or modulated at a
frequency. Steps 1–3a deliver the **physically honest subset** on commodity
hardware:

| Channel | Delivered through Studio now | Laterality |
|---|---|---|
| Visual field | one full-screen field (both eyes) | No — single field |
| Shared spatial stage | mono, two-panel stereo pair, anaglyph, or autostereogram | **Yes** in the stereoscopic presentation modes |
| Left ear / Right ear | true independent L/R (panned Carrier voices) | **Yes** |
| Tactile | (planned) Web Vibration pulse | No (single actuator) |

Eye-laterality is delivered through the shared stage's stereoscopic presentation
modes. It is not delivered through VR, AR glasses, eye-tracked displays, or
independent per-eye flicker.

## 3. Steps

- **Step 1 — static field.** Colour + intensity; per-ear tone (frequency, level)
  and/or noise (white/pink/brown). No time variation. Trivially safe.
- **Step 2 — modulation.** Visual **blink** (authored on/off colours, with black
  as the default off colour, at a chosen rate and
  duty) and audio **beat**: *monaural* (same-rate amplitude modulation on enabled
  tone/noise sources via engine tremolo) or *binaural* (a small tone-frequency
  difference between the ears).
  This is where the flash-rate and sound-level safety becomes load-bearing.
- **Step 3a — marker depth.** A first-class `DepthMarkers` track supplies simple
  point/stick/grid geometry whose depth and motion can be static or driven by
  explicit beat/breath `Sinusoid` controls. `SceneStage` renders SVG for mono,
  stereo-pair, and anaglyph output and canvas for autostereograms; it is not
  PixiJS. Stereo-pair output supports **parallel** and **cross-eye** viewing by
  swapping the left/right image order.
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
- **Step 3b — richer depth scenes.** **Stereoscopic Tree**, **Abstraction**, and
  **3D Landscape** are ordinary `TreeScene`, `AbstractScene`, and
  `LandscapeScene` tracks. Their historic `/field/*` URLs are compatibility
  aliases. The tree is procedural: its leaves, branches, and roots each carry an
  (x, y, z) position, so the scene has real depth rather than two markers. Each
  shared-stage 3D model is viewed through mono or three user-selectable
  stereoscopic techniques (see §8). More shapes, colour distributions, and
  future headset/VR paths remain planned.

## 4. Audio

Canonical delivery uses Patch Studio's existing `IAudioEngine`
([audioEngines.js](../../src/engines/audio/audioEngines.js)).
Per-ear delivery uses two `Carrier` voices hard-panned −1 / +1 (and `Noise`
voices likewise); a binaural beat is just a frequency difference between tones;
a monaural beat is the engine's `tremolo` on every enabled tone and noise voice.
The clock is
`AudioContext.currentTime`; `engine.resume()` is called inside the Play gesture
(autoplay policy). Sound level is **advisory only** — BSC Lab cannot measure
delivered SPL — with conservative defaults and a NIOSH 85 dBA / 8 h note.

The old `SensoryField.svelte` engine, handles, and rAF loop remain in source but
are no longer mounted by the public `/field/*` routes. Studio's lifecycle and
frame loop are still inside `PresetCreator.svelte`; extracting them into the
planned controller remains open.

## 5. Safety

- **Global gate.** The Studio stage renders only when `isVisualStimulationOn()` is true
  (see [PHOTOSENSITIVITY_SAFETY.md](PHOTOSENSITIVITY_SAFETY.md)); otherwise a
  placeholder shows.
- **Flash-rate cap.** [flashSafety.js](../../src/ui/safety/flashSafety.js) caps the
  blink rate at the general-safe **3 Hz** (WCAG 2.3.1; Harding / ITU-R BT.1702)
  unless the user makes an explicit **per-session** acknowledgement. Rates in the
  ≈ 15–25 Hz peak band are flagged highest-risk. The acknowledgement is never
  persisted — it is re-confirmed each session by design (ADR 0011).
- **Depth safety.** Step 3a does not add independent per-eye flicker. It can add
  eye strain through free-view convergence/divergence, so the legacy exposure
  profile adds `boundaryEyeStrain` and `lossHorizontalField`.
- The same 3 Hz threshold is modelled as `sstim-ex:limitFlickerWcag`, so the gate
  and the ontology cannot silently diverge.

## 6. Legacy exposure-profile emission

The retained standalone Field state serialises to an `sstim-ex:ExposureProfile`
through [exposureProfile.js](../../src/ui/field/exposureProfile.js), modelled on
the committed reference instance
[`sensory-field-example.ttl`](../../static/ontology/instances/experiments/sensory-field-example.ttl).

That legacy mapper is **SHACL-conformant** in its golden state matrix (ADR 0027
closed audit finding KR-01). It carries a defining framework, a technique or
editorial-note baseline, and — instead of manufactured evidence claims —
role-specific statements:
`sstim-ex:ExposureHypothesis` (stereo depth), `sstim-ex:ResearchQuestion`
(calm/arousal self-observation), and `sstim-ex:BoundaryApplicabilityStatement`
(photosensitivity). A delivery description asserts no efficacy. The golden
conformance suite
[exposureProfile.shacl.test.js](../../src/ui/field/exposureProfile.shacl.test.js)
validates every field state against the SSTIM shapes and fails on any drift.
Some visual detail (colours, depth grid) is still summarised rather than fully
captured.

The canonical Studio starter/track path does **not** yet derive or offer this
profile. A unified delivered-state snapshot, eligibility from ordinary track
content, and producer-adjacent SHACL must ship before Studio can claim equivalent
exposure export. The legacy mapper and tests are the behavior to preserve, not
evidence that the new route already exports an `ExposureProfile`.

Mapping:

| UI concept | Exposure terms |
|---|---|
| Colour field | `mediumVisualLight`, `modalityVisual`, `patternFixedColor`, `placementEyes`, `capabilityDisplayLightOutput`, `hasGainLevel` |
| Blink | `patternBlinking`, `capabilityDisplayFlicker`, `hasFlickerRateHz`, `hasDutyCycle`, `boundaryPhotosensitivity` |
| Free-view depth | two `mediumStereoscopicVisualPresentation` visual channels, `placementEyeLeft` / `placementEyeRight`, `capabilityFreeViewStereoscopy`, `gainStereoDepth`, `lossHorizontalField`, `boundaryEyeStrain` |
| Per-ear tone | `mediumAirConductedSound`, `modalityAuditory`, `placementEarLeft` / `placementEarRight`, `capabilityHeadphones` + `capabilityStereoSeparation`, `patternContinuous`, `hasFrequencyHz`, `hasGainLevel`, `boundaryHearingRisk` |
| Noise | `patternNoise` + an `audioNoise…` colour concept |
| Beat | `hasBeatFrequencyHz` |

The legacy exported flash rate is the **delivered** (clamped) rate, not the raw
slider value, so its profile reflects what actually played. The retained "In the
ontology" mapping links each active concept to the graph view via
[fieldSemantic.js](../../src/ui/field/fieldSemantic.js).

## 7. File map

```
src/routes/field*/+page.svelte              replace-state redirects + fallback links
src/ui/creator/PresetCreator.svelte         canonical Studio UI/runtime + starter flow
src/ui/creator/visualTrackModel.js          visual types, configs, shared-stage contract
src/ui/creator/fieldTrackAdapter.js         pure legacy state → ordinary track bundles
src/ui/creator/fieldStarters.js             four starter constructors/insertion policy
src/ui/creator/spatialScene.js              cached source conversion + scene composition
src/ui/creator/StudioVisualStage.svelte     ColorField layers + one spatial SceneStage
src/ui/creator/VisualStageControls.svelte   shared presentation controls
src/ui/creator/SpatialTrackInspector.svelte content-specific visual-track inspector

src/ui/field/scene/sceneGeom.js             shared: projection, disparity, depth tint, autostereogram
src/ui/field/scene/sceneView.js             shared technique/rotation/depth state + resolveYaw
src/ui/field/scene/SceneStage.svelte        reused renderer (primitives × mono + 3 depth modes)

src/ui/field/{...}                          retained standalone shells/state/persistence
src/ui/field/exposureProfile.js             legacy state → sstim-ex:ExposureProfile
src/ui/field/fieldSemantic.js               legacy UI concept → ontology IRI
src/ui/field/tree/treeModel.js              reused deterministic 3D tree generator
src/ui/field/abstract/abstractScene.js      Miró/Kandinsky/Klee scene generator
src/ui/field/landscape/landscapeScene.js    hills/river/houses/trees/flowers generator
src/ui/safety/flashSafety.js                flash-rate cap + risk classification
```

## 8. Spatial scenes (ordinary Studio tracks)

The Step 3b sources extend marker depth to full 3D scenes. They are now ordinary
Studio tracks that share one renderer and differ by deterministic generator;
the historic URLs below are compatibility aliases:

- **Stereoscopic Tree** (`/field/tree/`) — a procedural tree; leaves, branches,
  and roots each have an (x, y, z) position.
- **Abstraction** (`/field/abstract/`) — shapes scattered in 3D in the spirit of
  a **Miró / Kandinsky / Paul Klee** composition (selectable style).
- **3D Landscape** (`/field/landscape/`) — receding hills, a winding river,
  houses, trees, and flowers, each at its own depth (day / dusk / night).

### Shared scene framework (`src/ui/field/scene/`)

A scene is a flat bag of primitives in normalized 3D space (+y up, +z toward the
viewer), each carrying its own colour and optional opacity:

```
{ background, segments:[{a,b,width,color,opacity?}],
  dots:[{x,y,z,r,rx?,ry?,fill,stroke?,opacity?}],
  polys:[{pts:[{x,y,z}…],fill,stroke?,closed,opacity?}] }
```

[sceneGeom.js](../../src/ui/field/scene/sceneGeom.js) holds the scene-agnostic
math (projection, disparity, `depthTint`, the SIRDS kernel);
[SceneStage.svelte](../../src/ui/field/scene/SceneStage.svelte) is the one
renderer (segments → lines, dots → ellipses, polys → paths, depth-sorted).
[`spatialScene.js`](../../src/ui/creator/spatialScene.js) normalizes and caches
each marker/tree/abstract/landscape source, applies the track's x/y/z, scale,
rotation, and opacity without mutation, and composes all enabled sources before
projection. `StudioVisualStage` supplies controller time and the one shared stage
camera; global yaw and per-track rotation remain separate. `spread` is the common
generator depth knob — at `spread = 0` a scene is planar (z = 0), toward
`spread = 1` it is fully three-dimensional. The retained `SceneStereo`,
`TreeStereo`, and `TreeStage` own legacy clocks/shells only and are not mounted by
the canonical routes.

Canonical Studio track translation is camera-space and deliberately separates
the axes: X/Y move the source on the view plane after camera yaw, while Z changes
stereoscopic disparity/depth without changing that common screen position.
Current patch model 3 adds the explicit, default-off `depthAffectsScale` flag for
authors who also want positive/near Z to enlarge the source and negative/far Z
to shrink it. The independent `spatialScale` remains the authored base size.

One model, four presentations (orthographic, so disparity is a pure function of z
with the focal plane at z = 0 — matching the field's `--offset` cue):

| Technique | Term | How it renders |
|---|---|---|
| **Mono** | non-stereoscopic preview | one SVG with no eye disparity; depth tint remains optional |
| **Free-view stereo pair** | the codebase's free-view stereoscopy | two SVG panels; each vertex shifted ± `disparity(z)/2`; parallel or cross-eye (panels swap); depth-cued colour optional |
| **Autostereogram** | single-image random-dot stereogram | the scene is rasterised to a per-pixel depth buffer (depth-sorted), then the classic constraint-propagation SIRDS algorithm builds one dot image |
| **Anaglyph** | red/cyan | one SVG, the scene drawn twice (left eye red, right eye cyan) with `mix-blend-mode: screen`; dots filled, everything else outlined; needs red/cyan glasses |

"Stereogram" is ambiguous — the autostereogram is what the word usually means
(a single "Magic Eye" image), whereas the stereo pair is two images. Both are
supported; the codebase term for the two-panel method is **free-view
stereoscopy** (`capabilityFreeViewStereoscopy`).

Safety and framing match the rest of Studio: the scene renders only when the
global visual-stimulation gate is on (placeholder otherwise), auto-rotation
honours `prefers-reduced-motion`, motion is gentle and non-flashing (so the
flash-rate cap is not engaged), and copy uses conservative wellness framing
(CLAUDE.md §3.5). The legacy ontology panel reuses existing stereoscopy exposure
terms and introduces no new ontology IRIs; canonical Studio exposure emission is
still open as described in §6.
