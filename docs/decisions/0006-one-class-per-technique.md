# ADR 0006 — One class per technique; voice classes named `*Voice`

**Status:** Accepted — 2026-04

## Context

When sketching how a preset using a binaural beat would be modeled, a
distinction was proposed between two kinds of class:

- **Technique class** — `sstim:BinauralBeat` as a *method*, subclass of
  `sstim:EntrainmentBasedTechnique`. Describes what kind of stimulation
  this is.
- **Parameter-bundle class** — `sstim:BinauralVoiceSpec` as a *component
  within a preset*, subclass of `sstim:VoiceSpecification`. Carries the
  specific parameter values (`carrierFreqLeft`, `carrierFreqRight`).

An individual preset voice would then be typed `sstim:BinauralVoiceSpec`
and linked to the technique class via `sstim:usesTechnique
sstim:BinauralBeat`. The split would allow queries like "all presets
using the binaural-beat technique" to be phrased independently of
specific parameter values.

The initial ontology in `sstim-core.ttl` did *not* carry this split. It
had `sstim:BinauralVoiceSpec` as a subclass of `sstim:VoiceSpecification`,
and that class alone carried both the type ("this is a binaural voice")
and (on future properties) the parameters.

A secondary naming concern: `*VoiceSpec` reads awkwardly for a class that
is simultaneously the technique and the parameter bundle. Dropping
`Spec` yields `BinauralVoice`, `MartigliVoice`, `MartigliBinauralVoice`,
`SymmetryVoice` — each of which reads as a natural name for the concept
on its own.

## Decision

**One class per technique**; no technique / parameter-bundle split.

The four classes name a technique *and* carry the datatype properties
that parameterize it. SKOS dual-typing (ADR 0002) provides the
"technique category" facet without needing a separate class.

**Class names drop the `Spec` suffix:**

| Before (v0.1.0) | After (v0.1.1) |
|---|---|
| `sstim:VoiceSpecification` | `sstim:Voice` |
| `sstim:BinauralVoiceSpec` | `sstim:BinauralVoice` |
| `sstim:MartigliVoiceSpec` | `sstim:MartigliVoice` |
| `sstim:MartigliBinauralVoiceSpec` | `sstim:MartigliBinauralVoice` |
| `sstim:SymmetryVoiceSpec` | `sstim:SymmetryVoice` |

Labels, shape names, and the definition of `sstim:Voice` were updated
in the same edit to match (commit directly modifying `sstim-core.ttl`
and `sstim-shapes.ttl` with explicit human authorization — see ADR
0004).

Queries that need "all presets using the binaural-voice technique"
use `rdf:type` directly:

```sparql
SELECT ?preset WHERE {
  ?preset a sstim:Preset ;
          sstim:composedOf ?voice .
  ?voice a sstim:BinauralVoice .
}
```

## Alternatives considered

- **Technique class + parameter-bundle class (the split).** Rejected
  because:
  - No query was articulated that the split would make possible and the
    single-class design could not.
  - The dual-typing pattern (ADR 0002) already lets a SKOS concept like
    `sstim-v:voiceBinaural` stand for "the binaural-voice technique
    category" without needing a separate class.
  - Every individual voice instance would need two type assertions plus
    a `usesTechnique` link, tripling the triples per voice for no
    query-time benefit.
  - The split invites drift: the technique class and the spec class can
    disagree on subclass hierarchy, and SHACL constraints duplicate
    across both.

- **Parameter-bundle class only, with technique identified via a
  property (`sstim:techniqueCategory sstim-v:binauralBeat`).**
  Rejected because it pushes type information out of the type system
  and into property values, weakening SHACL's ability to validate per
  technique and making the class hierarchy meaningless.

- **Keep `*VoiceSpec` names and document the dual role in
  `skos:definition`.** Rejected: the awkwardness would compound as
  more technique classes are added from the `biosyncarelab` migration
  (`MonauralVoice`, `IsochronicVoice`, etc. all read better without
  `Spec`). Fixing the naming now, while the ontology has no instance
  data, avoids a larger migration later.

## Consequences

- When migrating `bsc:BinauralBeat`, `bsc:MonauralBeat`,
  `bsc:IsochronicTone` from `biosyncarelab`, each maps to a single
  `sstim:*Voice` class. Where an existing class already covers the
  concept, the migration merges into it rather than duplicating.
- Queries for "all binaural voices in the store" are one-step:
  `?x a sstim:BinauralVoice`.
- SHACL shapes target one class and validate both type membership and
  parameter completeness in one shape.
- The `usesTechnique` object property proposed during design is not
  introduced. Technique identity is carried by `rdf:type` and class
  hierarchy.
- The rename is safe because the ontology has no published instance
  data yet. Future renames will require the version-bump +
  `owl:deprecated` + `dct:isReplacedBy` migration pattern.
- The runtime JS type called `VoiceSpec` in
  `docs/technical/AUDIO_ENGINE_ARCHITECTURE.md` is a **different
  concept** — it is the preset-to-engine translation object, not an
  RDF class. It keeps its current name.

## See also

- [ADR 0002](0002-dual-typing-owl-skos.md) — how SKOS concepts relate to
  OWL classes in this ontology.
- [ADR 0004](0004-protected-ontology-files.md) — authorization required
  for the direct edit of `sstim-core.ttl` and `sstim-shapes.ttl`.
- [ADR 0005](0005-binaural-carrier-pair-only.md) — the parameterization
  that lives on `sstim:BinauralVoice`.
