# ADR 0046 — One Studio, two authoring modes, and separate semantic products

**Status:** Accepted — 2026-08-08 · implementation pending

## Context

BSC Lab currently has two stimulation surfaces:

- Patch Studio (`/creator/`) is the advanced, multi-track authoring surface. It
  owns a `patch-studio-model-1` draft, a `PatchStore`, an audio engine, a
  transport, and an animation-frame loop.
- Sensory Field (`/field/` and its scene routes) is the guided on-ramp. It owns a
  separate `sensory-field-model-1` state, four local-storage families, another
  audio engine, another transport/loop, and an `ExposureProfile` exporter.

[ADR 0011](0011-sensory-field-and-flash-safety.md) deliberately introduced the
Field separately because embedding a beginner experience in the then-complex
Studio would have compromised that on-ramp. The Field has since grown from a
single colour-and-sound instrument into stereoscopic marker, tree, abstraction,
and landscape scenes. Maintaining two execution stacks is now the larger risk:
an apparent merge made only from tabs or component embedding would still leave
two clocks, two stores, two safety acknowledgements, and divergent exports.

The product decision is now to merge them. The requirement is architectural,
not merely navigational, while the Field's approachable interaction remains
valuable.

## Decision

1. **Patch Studio becomes the one canonical product and execution boundary.**
   It owns the live document, persistence seam, engine, transport, audio-clock
   authority, frame evaluation, and session-only safety acknowledgement.

2. **Sensory Field remains a named guided authoring mode.** “Guided Field” and
   “Advanced Studio” edit the same live document. The guided mode manages a
   recognizable group of tracks and exposes only the controls needed for its
   instrument. Switching views must not copy, restart, or reinterpret the
   stimulus.

3. **Execution data lives in the canonical track graph.** Field colour, blink,
   source/channel enabled state, stereo scenes, view technique, and modulation
   need explicit track contracts; they must not be hidden in a parallel `field`
   object. Optional
   view metadata may remember conveniences such as linked-ear controls and the
   IDs managed by Guided Field, but it must not change what plays. If an
   Advanced edit breaks a guided invariant, Guided Field reports a partial or
   detached state rather than coercing it silently.

4. **Migration is explicit and recoverable.** Existing Patch Studio files keep
   importing. Existing Field local-storage records are offered for one-time
   conversion, never uploaded or deleted automatically, and never overwrite an
   open patch. A photosensitivity acknowledgement is not migrated or persisted.
   The `/field/*` URLs remain compatibility entry points into the corresponding
   guided modes for at least one deprecation window; `/creator/` is canonical.

5. **The semantic products remain distinct.** The lossless patch/session
   package is executable truth. SSTIM `Preset` RDF describes engine
   configuration. An `ExposureProfile` describes the delivered Field-oriented
   exposure summary. A `StimulusSpecification` is used only when calibrated,
   engine-independent output is actually known. The merge must not collapse
   these layers into one misleading document.

6. **BioSynCare compatibility is not part of the native model.** A later,
   optional, one-way catalog adapter may target a version-pinned supported
   subset. It is governed by
   [`PATCH_STUDIO_CONFORMANCE_AND_NEUTRALITY.md`](../ecosystem/PATCH_STUDIO_CONFORMANCE_AND_NEUTRALITY.md)
   and may not make BioSynCare fields or concepts requirements of Patch Studio
   or SSTIM.

The implementation sequence and acceptance gates are in
[`PATCH_STUDIO_FIELD_INTEGRATION.md`](../technical/PATCH_STUDIO_FIELD_INTEGRATION.md).

## Alternatives considered

- **Keep two products and only share visual components.** Rejected. It leaves
  duplicate state, transport, persistence, and safety ownership, so it does not
  satisfy the mandatory merge.
- **Embed the current Field component inside Patch Studio.** Rejected. Both
  components would instantiate an engine and animation loop; one visible shell
  would conceal two runtimes.
- **Delete the Field and expose only advanced tracks.** Rejected. The guided,
  low-commitment on-ramp serves a different user task and can remain simple
  without remaining a separate application.
- **Make Field state the canonical model.** Rejected. It cannot express the
  Studio's arbitrary track graph, modulation, tempo sync, visual mixing, or
  haptic authoring.
- **Shape the unified model around the BioSynCare catalog.** Rejected. That
  audio-only delivery contract cannot represent the multimodal Studio and would
  couple an open reference implementation to one closed product.

## Consequences

- The merge is larger than route consolidation: shared runtime extraction and a
  visual-track extension precede the final UI cutover.
- Patch Studio keeps one advanced surface while gaining a reusable guided-mode
  pattern for future instruments.
- Field bookmarks and familiar branding can survive even after the standalone
  runtime is removed.
- New nested or discrete scene data expands portability tests: every serialized
  field must be mapped to RDF, reported as unmapped, or classified explicitly as
  non-semantic view metadata.
- [ADR 0011](0011-sensory-field-and-flash-safety.md) is superseded only in its
  decision to keep a separate interface/runtime. Its flash-rate gate, per-session
  acknowledgement, exposure semantics, and conservative framing remain binding.

## See also

- [`../technical/PATCH_STUDIO.md`](../technical/PATCH_STUDIO.md) — current
  Studio implementation.
- [`../technical/SENSORY_FIELD.md`](../technical/SENSORY_FIELD.md) — current
  Field and scene implementation.
- [ADR 0026](0026-patch-studio-catalog-bridge.md) — partial, gated catalog/RDF
  conversion.
- [ADR 0041](0041-stimulus-description-layers-and-the-canonical-schema-gap.md)
  and [ADR 0042](0042-stimulus-specification.md) — semantic-layer boundaries.
