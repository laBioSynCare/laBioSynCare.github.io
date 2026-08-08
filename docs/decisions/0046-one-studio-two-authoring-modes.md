# ADR 0046 — One Studio, first-class spatial visual tracks, and separate semantic products

**Status:** Accepted — 2026-08-08 · revised before implementation 2026-08-08 · implementation pending

> **Revision — 2026-08-08, before implementation.** The initially accepted
> design described “Guided Field” and “Advanced Studio” as two views over a
> managed Field track group. Before implementation began, that choice was
> replaced by ordinary first-class spatial visual tracks, Field starter
> templates, and one shared visual projection stage. No runtime, schema,
> ontology release, or external conformance claim implemented the former
> choice. Git commit `52c98d6` preserves it. The filename is retained so
> published links stay stable.

## Context

BSC Lab currently has two stimulation surfaces:

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
- A descriptor-driven visual registry, normalized spatial contract, and shared
  scene compositor/projector must precede route cutover.
- Multiple spatial tracks may coexist. Composition rules must distinguish
  transparent geometry, flat overlays, and opaque full-frame techniques.
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
