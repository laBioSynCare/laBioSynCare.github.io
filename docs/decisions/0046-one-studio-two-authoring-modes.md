# ADR 0046 — One Studio, first-class spatial visual tracks, and separate semantic products

**Status:** Accepted — 2026-08-08 · revised before implementation 2026-08-08 · partially implemented 2026-08-08

> **Revision — 2026-08-08, before implementation.** The initially accepted
> design described “Guided Field” and “Advanced Studio” as two views over a
> managed Field track group. Before implementation began, that choice was
> replaced by ordinary first-class spatial visual tracks, Field starter
> templates, and one shared visual projection stage. No runtime, schema,
> ontology release, or external conformance claim implemented the former
> choice. Git commit `52c98d6` preserves it. The filename is retained so
> published links stay stable.

## Context

At the time of this decision, BSC Lab had two stimulation surfaces:

- Patch Studio (`/creator/`) owns a `patch-studio-model-1` draft, `PatchStore`,
  audio engine, transport, and animation loop.
- Sensory Field (`/field/` and its scene routes) owns a separate
  `sensory-field-model-1` state, four local-storage families, another runtime,
  and an `ExposureProfile` exporter.

[ADR 0011](0011-sensory-field-and-flash-safety.md) deliberately introduced the
Field separately to protect an approachable on-ramp. The Field has since grown
from a colour-and-sound instrument into stereoscopic marker, tree, abstraction,
and landscape scenes. Maintaining two stores, clocks, safety acknowledgements,
and export paths is now the larger risk.

The required merge is architectural, not merely navigational. Field defaults,
scene families, branding, and compatibility routes remain valuable, but its
stereoscopic content should behave like ordinary Studio visual tracks rather
than belonging to a privileged workspace.

## Decision

1. **Patch Studio is the one product and execution boundary.** It owns the live
   document, persistence, engine, transport, audio-clock authority, frame
   evaluation, visual stage, and session-only safety acknowledgement. A route,
   tab, or embedded component retaining a second runtime does not satisfy the
   merge.

2. **Sensory Field becomes a starter-template and compatibility-entry family,
   not an authoring mode.** A Field starter creates ordinary control, audio, and
   visual tracks. Those tracks then have the same lifecycle as tracks created
   directly in Studio. Template-origin metadata is optional provenance only and
   cannot affect playback, export, or validity. There is no Guided/Advanced
   switch, managed Field execution group, or partial/detached state.

3. **Spatial visuals are first-class visual tracks.** Colour fields, depth
   markers, trees, abstractions, and landscapes enter the ordinary registry as
   explicit, content-appropriate track types. A spatial track owns its source
   recipe and live horizontal, vertical, and depth state, including applicable
   transforms, enabled state, motion, modulation, and content configuration.
   Execution data may not hide in a parallel Field object or template record.

   Content-specific normalizers share a spatial-scene and rendering contract;
   they do not become one untyped union of every scene family's optional fields.
   Existing flat visuals may initially participate as overlays or zero-depth
   planes. Converting every current visual into native 3D geometry is not a
   prerequisite.

4. **Depth and stereoscopic presentation are separate concerns.** Tracks
   describe what exists and where. The shared Studio stage composes compatible
   layers and applies the selected presentation—such as mono, stereo pair,
   anaglyph, or autostereogram—once. Eye order, camera/view parameters, and
   output topology have one stage authority, not conflicting per-track
   projectors. One scene track normally generates both eye views; separate
   per-eye tracks are for genuinely independent dichoptic stimuli. Rendering
   backends are implementation details.

5. **Migration is explicit and recoverable.** Legacy Field records are offered
   for previewed, opt-in conversion to ordinary tracks. They are never uploaded,
   deleted, or used to replace an open patch automatically. Photosensitivity
   acknowledgement is neither serialized nor migrated. `/field/*` remains a
   template/import entry family for at least one deprecation window;
   `/creator/` is canonical.

6. **Semantic products remain distinct.** Patch JSON and session packages are
   lossless executable truth. SSTIM `Preset` RDF is an engine-configuration
   projection. `ExposureProfile` is derived only for reviewed delivered-exposure
   mappings, regardless of template provenance. `StimulusSpecification` is
   emitted only when calibrated, engine-independent output is known. Export
   describes deterministic delivered configuration and control laws, not the
   animation phase at click time.

7. **BioSynCare compatibility is not native-model conformance.** A later,
   optional, version-pinned one-way catalog adapter may support a declared
   subset under
   [`PATCH_STUDIO_CONFORMANCE_AND_NEUTRALITY.md`](../ecosystem/PATCH_STUDIO_CONFORMANCE_AND_NEUTRALITY.md).
   BioSynCare concepts do not become Patch Studio or SSTIM requirements, and an
   adapter must reject or report unsupported spatial content rather than
   discard it.

The implementation sequence and acceptance gates are in
[`PATCH_STUDIO_FIELD_INTEGRATION.md`](../technical/PATCH_STUDIO_FIELD_INTEGRATION.md).

## Implementation status — 2026-08-08

The first cutover is shipped:

- `patch-studio-model-2` has a shared `visualStage`, a fixed-rate phase-addressable
  `Sinusoid` control, `ColorField`, and four first-class spatial visual-track
  types. Genuine model-1 documents remain readable through an explicit importer;
  new exports and saved edits use model 2.
- Pure Field/scene adapters and starters create ordinary Studio tracks. Studio
  detects all four legacy local-storage records without deleting or uploading
  them. Disabled tone, noise, and depth sources survive as muted/disabled tracks
  with their authored settings. The open conversion report shows every mapped,
  dormant, corrected, unsupported, ignored, and warning entry; corrections,
  warnings, or unsupported items require acknowledgement before Add or Replace.
  Add appends to the live draft (and starts new zero-gain or audible voice handles
  during playback), with explicit keep-stage and apply-suggested-stage actions.
- `ColorField` and enabled spatial tracks render through one shared Studio stage.
  Spatial source generation is deterministic and cached, multiple scene sources
  compose at the first spatial track-array position before mono, stereo-pair,
  anaglyph, or autostereogram projection, and the stage receives Studio controller
  time. Vector modes execute each spatial track's blend; blend is explicitly not
  applicable to autostereogram depth-buffer output. Static SIRDS scenes stay off
  the clock invalidation path and dynamic full-frame refresh is capped at 8 fps.
- `/field/*` routes and visible navigation now enter the corresponding Studio
  starter. The old standalone shells no longer own a publicly routed runtime.
- The stale control-name validation and warning defects are fixed. Patch RDF
  projection now reports nested and discrete unmapped leaves and explicitly says
  that producer-side SHACL validation has not run.

The mandatory merge is not complete. Engine lifecycle, frame evaluation, and a
delivered-state snapshot still live in `PresetCreator.svelte`; no extracted
`patchTransport` or descriptor-driven renderer registry exists. Exact legacy
trajectory and one-sided clamp behavior are reported rather than reproduced.
Unified Studio `ExposureProfile` derivation, producer-adjacent SHACL,
production-browser/offline regression gates, and the deprecation/removal of
legacy Field runtime and persistence code remain open.

## Alternatives considered

- **Keep two products or embed the current Field component.** Rejected because
  one shell would still conceal duplicate state, runtime, persistence, safety,
  and export ownership.
- **Maintain Guided Field as a managed-group workspace.** Rejected because it
  adds special ownership, invariants, and repair states for ordinary tracks.
- **Use one monolithic `StereoScene` union.** Rejected because unrelated source
  schemas become a conditional data bag and kind changes risk data loss.
- **Give every track its own stereoscopic projector.** Rejected because tracks
  could disagree about eye order, camera, and depth scale, while full-frame
  techniques require composition before projection.
- **Retrofit every 2D track with complete 3D geometry first.** Rejected because
  the spatial capability can be adopted incrementally.
- **Make Field or the BioSynCare catalog the canonical model.** Rejected because
  neither represents Studio's arbitrary multimodal track graph without loss or
  inappropriate product coupling.

## Consequences

- Studio remains one authoring surface; Field remains recognizable through
  templates, defaults, names, and route aliases rather than execution ownership.
- A normalized spatial contract and shared scene compositor/projector shipped
  with the first route cutover. The descriptor-driven renderer registry and
  extracted runtime remain required completion work.
- Multiple spatial tracks may coexist. Because they must compose before a single
  projection, the track-array topology groups them at the first enabled spatial
  position while retaining source order inside that group. Vector blend executes;
  SIRDS is a depth-buffer technique to which primitive blend does not apply.
- Package and RDF mapping reports must account for every nested or discrete
  spatial field as mapped, explicitly unmapped, or non-semantic metadata.
- [ADR 0011](0011-sensory-field-and-flash-safety.md) is superseded only in its
  separate-interface/runtime choice. Its flash gate, per-session
  acknowledgement, exposure semantics, and conservative framing remain active.

## See also

- [`../technical/PATCH_STUDIO.md`](../technical/PATCH_STUDIO.md) — current
  Studio implementation.
- [`../technical/SENSORY_FIELD.md`](../technical/SENSORY_FIELD.md) — current
  Field and scene implementation.
- [ADR 0026](0026-patch-studio-catalog-bridge.md) — gated catalog/RDF conversion.
- [ADR 0041](0041-stimulus-description-layers-and-the-canonical-schema-gap.md)
  and [ADR 0042](0042-stimulus-specification.md) — semantic-layer boundaries.
