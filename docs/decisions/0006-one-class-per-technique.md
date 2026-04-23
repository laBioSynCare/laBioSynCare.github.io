# ADR 0006 — One class per technique; no technique/parameter-bundle split

**Status:** Accepted — 2026-04

## Context

When sketching how a preset using a binaural beat would be modeled, a
distinction was proposed between two kinds of class:

- **Technique class** — `sstim:BinauralBeat` as a *method*, subclass of
  `sstim:EntrainmentBasedTechnique`. Describes what kind of stimulation
  this is.
- **Parameter-bundle class** — `sstim:BinauralVoiceSpec` as a *component
  within a preset*, subclass of `sstim:VoiceSpecification`. Carries the
  specific parameter values (`carrierLeft`, `carrierRight`).

An individual preset voice would then be typed `sstim:BinauralVoiceSpec`
and linked to the technique class via `sstim:usesTechnique
sstim:BinauralBeat`. The split would allow queries like "all presets
using the binaural-beat technique" to be phrased independently of
specific parameter values.

The current ontology in `sstim-core.ttl` does *not* carry this split. It
has `sstim:BinauralVoiceSpec` as a subclass of `sstim:VoiceSpecification`,
and that class alone carries both the type ("this is a binaural beat") and
the parameters (`carrierLeft`, `carrierRight` once added). The SKOS
vocabulary (`sstim-v:voiceBinaural a sstim:BinauralVoiceSpec,
skos:Concept`) dual-types the technique concept onto the same class.

## Decision

One class per technique. Do not introduce a separate technique /
parameter-bundle distinction.

The existing `sstim:BinauralVoiceSpec`, `sstim:MartigliVoiceSpec`,
`sstim:MartigliBinauralVoiceSpec`, `sstim:SymmetryVoiceSpec` remain as
they are: each class names a technique *and* carries the datatype
properties that parameterize it. Future additions
(`sstim:MonauralBeat`, `sstim:IsochronicTone`, `sstim:HemiSync`, etc.,
migrated from `biosyncarelab`) follow the same pattern: one class per
technique, parameters on that class, no separate "spec" wrapper.

Queries that need "all presets using the binaural-beat technique" use
`rdf:type` directly:

```sparql
SELECT ?preset WHERE {
  ?preset a sstim:Preset ;
          sstim:composedOf ?voice .
  ?voice a sstim:BinauralVoiceSpec .
}
```

## Alternatives considered

- **Technique class + parameter-bundle class (the split).** Rejected
  because:
  - No query was articulated that the split would make possible and the
    single-class design could not.
  - The dual-typing pattern (ADR 0002) already lets a SKOS concept like
    `sstim-v:voiceBinaural` stand for "the binaural-beat technique
    category" without needing a separate class.
  - Every individual voice instance would need two type assertions
    (`a sstim:BinauralVoiceSpec, sstim:BinauralBeat`) plus a
    `usesTechnique` link, tripling the triples per voice for no
    query-time benefit.
  - The split invites drift: the technique class and the spec class can
    disagree on subclass hierarchy (is the spec a subclass of
    `EntrainmentBasedTechnique` too? or only the technique class?), and
    SHACL constraints duplicate across both.

- **Parameter-bundle class only, with technique identified via a
  property (`sstim:techniqueCategory sstim-v:binauralBeat`).**
  Rejected because it pushes type information out of the type system and
  into property values, weakening SHACL's ability to validate per
  technique and making the class hierarchy meaningless.

## Consequences

- When migrating `bsc:BinauralBeat`, `bsc:MonauralBeat`,
  `bsc:IsochronicTone` from `biosyncarelab`, each maps to a single
  `sstim:*` class. Where an existing `sstim:*VoiceSpec` class already
  covers the concept, the migration merges into it rather than
  duplicating.
- Queries for "all binaural beats in the store" are one-step:
  `?x a sstim:BinauralVoiceSpec`.
- SHACL shapes target one class and validate both type membership and
  parameter completeness in one shape.
- The `usesTechnique` object property proposed during design is not
  introduced. Technique identity is carried by `rdf:type` and class
  hierarchy.

## Known issue (not resolved by this ADR)

The name `BinauralVoiceSpec` reads less naturally than `BinauralBeat` for
a class that is simultaneously the technique and the parameter bundle.
Renaming `sstim:BinauralVoiceSpec` → `sstim:BinauralBeat` (with parallel
renames for the other three) would modify a protected file
(`sstim-core.ttl`) and break any instance data already using the
current IRIs. This is a migration decision, deferred. Options when it
is taken up:

- Rename and version: bump ontology to v0.2.0, issue a migration script
  for instance data, mark old IRIs `owl:deprecated true` with
  `dct:isReplacedBy` pointing to the new IRIs.
- Keep current names; accept that `*VoiceSpec` is a term-of-art in this
  ontology and document the dual role explicitly in each class's
  `skos:definition`.

No ADR number is pre-allocated for the renaming decision; when the
migration is considered, the ADR at that time should cite this one.

## See also

- [ADR 0002](0002-dual-typing-owl-skos.md) — how SKOS concepts relate to
  OWL classes in this ontology; the dual-typing pattern already carries
  the "this is a binaural-beat category" information.
- [ADR 0004](0004-protected-ontology-files.md) — why renaming the
  existing classes is a migration, not a routine edit.
- [ADR 0005](0005-binaural-carrier-pair-only.md) — the parameterization
  that lives on the single class.
