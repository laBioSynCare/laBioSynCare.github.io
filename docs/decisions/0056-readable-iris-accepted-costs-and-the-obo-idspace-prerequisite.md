# ADR 0056 — What readable IRIs cost, and why the OBO bridge cannot be built yet

**Status:** Accepted — 2026-09-03 · amends [0016](0016-publication-obo-posture-and-registries.md)

## Context

[ADR 0016](0016-publication-obo-posture-and-registries.md) is right in its
conclusions and incomplete in its reasoning, in two ways that only surfaced when
someone asked why OBO Foundry membership stays closed.

**Decision 1 records a benefit and no cost.** It keeps human-readable w3id IRIs
canonical, "a usability value for the intended W3C-Community-Group / web
audience", and that is a real value and the right call. But an identifier that
carries a name makes a claim, and this repository has already paid for one:
ADR 0027 renamed `sstim:supportsRelation` to `sstim:evaluatesSubject` because
the original name was directionally misleading. The meaning never changed. The
name was wrong about it, and the correction left a deprecated alias in the graph
permanently. `dct:isReplacedBy` appears seven times in the vocabulary module
alone. A reader of 0016 would not learn that this failure mode exists, let alone
that it has already occurred.

**Decision 3 reserves an option that cannot legally be built.** It proposes, if
a biomedical-grade home ever becomes necessary, a dual edition keeping w3id
canonical and generating an OBO-ID layer, with the example
`sstim:FrequencyBand owl:equivalentClass obo:SSTIM_0000001`.

Measured 2026-09-03:

```text
obofoundry.org/registry/ontologies.jsonld   267 ontologies registered, none is sstim
http://purl.obolibrary.org/obo/SSTIM_0000001   404
```

The `SSTIM` IDSPACE is not allocated to this project. Minting those IRIs would
be fabricating identifiers in a namespace it does not control, which the
consequences section of 0016 itself forbids: "Every external identifier (QID,
PURL, MeSH/SNOMED code) is verified live before being written into RDF — never
fabricated." The escape hatch contradicts the record containing it.

The OBO identifier policy, read the same day, also settles a claim 0016 asserts
without support. Term identifiers are `"http://purl.obolibrary.org/obo/"
IDSPACE "_" LOCALID`, and the policy's own URI-to-CURIE mapping is
`([A-Za-z_]*)_(\d+)`, so `LOCALID` must be digits. 0016 said "opaque numeric
IDs" and was correct; it is now checkable.

## Decision

1. **Record the costs of readable IRIs as accepted, not absent.** Decision 1 of
   0016 stands. These are what it buys the usability with:

   - **A name is a claim, and claims get revised.** Already paid once, in
     ADR 0027. An opaque identifier would have taken a relabel; the readable one
     took a rename, a deprecation and a permanent alias.
   - **English sits in the identity layer.** `make language-coverage` is a
     gate, and it passes at 100%: all 551 concepts and all 68 schemes carry
     labels in en, it, pt and es. Every IRI is English. The four label sets are
     equal by policy and enforced as equal, while the identifier layer beneath
     them is monolingual, so the other three read as translations of the
     identifier rather than peers of it. This is the cost that sits least
     comfortably with what SSTIM advertises in BARTOC and FAIRsharing, and it is
     accepted knowingly.
   - **Readable names invite inference instead of lookup.** `sstim:Neurostimulation`
     reads as though its scope were obvious; the definition is narrower than the
     common guess, which is why ADRs 0035 and 0036 were needed to draw the
     neuromodulation boundary.
   - **Local names carry classification.** `techElectroconvulsiveTherapy`,
     `tierStrong`, `designRandomizedControlledTrial`,
     `contextExploratoryNonClinical` encode a type in the identifier. A
     reclassification cannot remove it.

   None of these reverses decision 1. They are the price of it, and a future
   reader deciding whether to keep it deserves to see both sides.

2. **An allocated IDSPACE is a hard prerequisite for any OBO-ID artifact.** No
   `obo:SSTIM_*` IRI may be written into SSTIM RDF, generated, documented as an
   example, or published in a mapping file until the IDSPACE is allocated by the
   OBO Foundry and resolves. Decision 3 of 0016 is amended to carry this
   prerequisite. Its illustrative `SSTIM_0000001` is an illustration only and
   must not be treated as a mintable identifier.

3. **Distinguish the three OBO postures, which 0016 blurred into one.**

   | Posture | What it needs | Available today |
   |---|---|---|
   | Alignment to existing OBO terms | nothing; BFO, IAO, OBI and COB are already referenced by stable PURL | **yes**, and in use |
   | An OBO-ID bridge for SSTIM's own terms | an allocated IDSPACE | no |
   | OBO Foundry membership | numeric PURLs as the actual term IRIs, plus the principles and committee review | no, and not sought |

   Only the first is interoperability. The other two are identity decisions, and
   0016's rejection of the third stands unchanged.

## Consequences

- `make validate` gains nothing; this constrains what may be authored, not what
  is checked. The existing rule that external identifiers are verified live
  before entering RDF already covers the failure, and this ADR names the case it
  did not visibly cover.
- If a concrete collaborator ever requires OBO PURLs, the first action is an
  IDSPACE request to the OBO Foundry, not a generation step. The bridge is
  buildable only after that returns.
- Deepening alignment to existing OBO terms remains open and needs no
  permission from anyone. It is the only one of the three postures that delivers
  interoperability without an identity change.
- Decision 1's costs being written down does not schedule a revisit. It means a
  future revisit starts from the real trade rather than from a one-sided record.

## Alternatives considered

- **Edit 0016 in place.** Rejected: 0016 is implemented, released across twelve
  versions and externally cited, including by `REGISTRY_SUBMISSIONS.md`. The
  revision policy in [`README.md`](README.md) puts a substantive change in a new
  ADR, and the decision-3 prerequisite is substantive: it changes what may be
  generated.
- **Strike decision 3 entirely.** Rejected: the dual edition is a coherent shape
  and worth keeping reserved. What was wrong was presenting it as something the
  project could execute unilaterally.
- **Request the IDSPACE now, to unblock the option.** Rejected: an IDSPACE is
  requested for an ontology intended to join the OBO family, and 0016 decision 2
  declines membership. Requesting one with no intent to use it would be asking
  the Foundry to allocate against a decision already taken.

## See also

- [ADR 0016](0016-publication-obo-posture-and-registries.md) — the amended record.
- [ADR 0027](0027-evidence-claim-family-and-public-claim-gate.md) — the rename that demonstrates the first accepted cost.
- [ADR 0001](0001-namespace-split.md) — the namespace design decision 1 rests on.
- [`docs/ontology/REGISTRY_SUBMISSIONS.md`](../ontology/REGISTRY_SUBMISSIONS.md) — OntoBee closed as not applicable on the same grounds.
