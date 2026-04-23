# ADR 0005 — Binaural beat parameterized as carrier pair only

**Status:** Accepted — 2026-04

## Context

A binaural beat can be specified in two mathematically related ways:

- **Carrier pair:** `(carrierLeft, carrierRight)` — e.g. 195 Hz in the left
  ear, 205 Hz in the right ear.
- **Center + beat:** `(carrierCenter, beatFrequency)` — e.g. center 200 Hz,
  beat 10 Hz.

These are not information-equivalent. The carrier pair encodes **four**
pieces of information:

1. Beat frequency ( `|L − R|` )
2. Carrier center ( `(L + R) / 2` )
3. Which ear receives the higher tone (the sign of `L − R`)
4. (Optionally, authorial intent: whether carrier values or beat value was
   the primary input — this is provenance, not ontology.)

Center + beat encodes only (1) and (2). Lateralization — whether the higher
tone is presented left or right — is lost.

Whether lateralization matters perceptually is debated. Classical binaural
beat literature treats `|L − R|` as the entrainment driver via interaural
phase difference, with lateralization irrelevant. Some research on
asymmetric cortical responses and some practitioner traditions treat
"higher tone in the dominant ear" as meaningful. An ontology aiming to
outlast current debates should preserve the information, not discard it.

## Decision

`sstim:BinauralBeat` is parameterized by `sstim:carrierLeft` and
`sstim:carrierRight` only. Authoring tools and ingestion pipelines may
accept center+beat as input but must normalize to the pair form before
writing to the store.

`beatFrequency` and `carrierCenter`, if present as assertions in the
store, are derived (optional, cacheable for query performance). The
authoritative fields are the carrier pair.

## Alternatives considered

- **`sh:or` over both forms.** Allows either `(carrierLeft, carrierRight)`
  or `(carrierCenter, beatFrequency)`. Rejected: presets written in
  center+beat form silently drop lateralization, and the loss is
  unrecoverable at read time.

- **Two subclasses (`LateralizedBinauralBeat` vs
  `SymmetricBinauralBeat`).** Rejected: introduces a type-level distinction
  for what is actually a data-completeness concern. A "symmetric" binaural
  beat is just a binaural beat whose lateralization the author did not
  care to specify — that is a prov/authoring question, not a class
  distinction.

- **Carrier pair plus an optional `higherTone` property.** Rejected:
  lateralization would be expressible two ways (derived from carriers, or
  explicit property) that can disagree. A consistency constraint would
  be needed, duplicating what the canonical form provides for free.

- **Center+beat as canonical, with optional lateralization tag.** Rejected
  for the same reason — forces an extra property to recover information
  that the pair form already carries.

## General principle derived

When two parameterizations of the same concept carry different amounts of
information, normalize to the more informative form rather than allowing
both via `sh:or`. Reserve `sh:or` for genuine alternatives where no single
form dominates.

This principle applies to other track types as they are added:

- **Monaural beats** parameterized by `(carrierFreq, modulationMin,
  modulationMax)` — normalize to the most informative form if alternative
  parameterizations are proposed (e.g., modulation depth + modulation
  center).
- **Martigli oscillations** parameterized by `(mp0, mp1, md)` — single
  canonical form already; no `sh:or` needed.
- **Symmetry voices** parameterized by `(noctaves, nnotes, d, perm)` — the
  isochronic special case (`noctaves = 0`) is a value of the parameter,
  not a different parameterization, so no alternative forms arise.

## Consequences

- Every `sstim:BinauralBeat` instance in the store has `carrierLeft` and
  `carrierRight` populated. SHACL enforces both with `sh:minCount 1`.
- Queries for beat frequency use a computed binding: `BIND(ABS(?cL - ?cR)
  AS ?beatFreq)`. If `beatFrequency` is also asserted as a cached value,
  SHACL can validate consistency.
- Queries for lateralization are direct: `FILTER(?carrierRight >
  ?carrierLeft)` — no optional-property unwinding.
- The BSC preset JSON format already uses `(fl, fr)` as the canonical
  form. Alignment between the JSON preset format and the RDF
  representation is preserved.

## See also

- [ADR 0002](0002-dual-typing-owl-skos.md) — SKOS concepts like
  `sstim-v:binauralBeat` are typed by `sstim:BinauralBeat`; this ADR
  defines how the OWL class is parameterized.
- [`docs/technical/PRESET_FORMAT.md`](../technical/PRESET_FORMAT.md) — the
  preset JSON format, which uses the same carrier-pair convention.
