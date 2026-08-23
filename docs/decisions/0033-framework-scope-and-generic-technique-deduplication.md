# ADR 0033 — BSC framework scope and generic-technique deduplication

**Status:** Accepted — 2026-07-19

Refines [ADR 0007](0007-framework-protocol-implementation.md) (which remains
Accepted: BSC is still a framework, not an implementation) and supplies the
`SensoryStimulationFramework` usage precedent that
[ADR 0030](0030-named-methods-and-schools.md) needs before external schools can
be added. Touches the protected term files
([ADR 0004](0004-protected-ontology-files.md); `CLAUDE.md` §3.4) with explicit
maintainer approval given in session on 2026-07-19.

## Context

`static/ontology/instances/frameworks/bsc.ttl` declared **seven** techniques
under `https://w3id.org/sstim/framework/bsc/technique/`, all linked by
`sstim:definesTechnique`. Four of them were framework-scoped restatements of
concepts that **already existed, vendor-neutral and dual-typed, in
`sstim-vocab.ttl`** — three of the four even pointed at their own twin via
`skos:relatedMatch`:

| Framework-scoped IRI | Pre-existing vocabulary concept |
|---|---|
| `bsc-fw-tech:binaural-beat-stimulation` | `sstim-v:techBinauralBeats` |
| `bsc-fw-tech:photic-rhythm-stimulation` | `sstim-v:techPhoticDriving` |
| `bsc-fw-tech:audiovisual-rhythm-coordination` | `sstim-v:techAudiovisualEntrainment` |
| `bsc-fw-tech:vibrotactile-rhythm-stimulation` | `sstim-v:techVibrotactileEntrainment` |

This was wrong in two directions. It **overclaimed** — asserting via
`definesTechnique` that BSC "defines or governs" binaural beats, a technique
documented since Dove (1839) and plainly not BSC's to define. And it
**fragmented** the graph: a consumer querying for binaural-beat work had two
IRIs to reconcile, one of them inside a vendor path, which is precisely the
failure mode the W3C CG and the HED/BIDS crosswalk
([ADR 0025](0025-hed-bids-interoperability-crosswalk.md)) exist to avoid.

The remaining three techniques are genuinely BSC-originated and have no
vendor-neutral twin: they point at BSC's own `sstim-v:voice*` concepts, and each
has a defensive-publication record in `docs/technical/`.

## Decision

**1. BSC remains a `sstim:SensoryStimulationFramework`.** Its scope is stated
explicitly: audio — Martigli respiratory waves, binaural beats, Symmetry
permutations, soundscapes and colored noises — plus visual cues matched to the
Martigli oscillation.

**2. `sstim:definesTechnique` is reserved for originated techniques.** BSC now
defines exactly three:

- `bsc-fw-tech:martigli-breathing-oscillation`
- `bsc-fw-tech:martigli-binaural-hybrid`
- `bsc-fw-tech:symmetry-permutation-entrainment`

**3. New property `sstim:incorporatesTechnique`** (added to `sstim-core.ttl`;
domain `SensoryStimulationFramework`, range `SensoryStimulationTechnique`)
records a framework applying a pre-existing technique it did not originate. BSC
incorporates `sstim-v:techBinauralBeats`, `techIsochronicTones`,
`techBroadbandNoise`, `techPhoticDriving`, `techAudiovisualEntrainment`, and
`techVibrotactileEntrainment`.

The property is **additive**. Widening the domain of the existing
`sstim:usesTechnique` (currently `SensoryStimulationProtocol`) was rejected:
that mutates the semantics of a term already published in 0.1.0–0.7.0, whereas a
new property leaves every released entailment intact — and "incorporates" states
something `usesTechnique` does not, namely *non-origination*.

**4. The four duplicate IRIs are retired**, with the mapping recorded as a
comment block in `bsc.ttl` rather than deleted silently.

## Consequences

- `sstim-sh:FrameworkShape` still requires `definesTechnique` `minCount 1`; BSC
  satisfies it with its three originals. **Shapes needed no change.**
- `bsclab-protocol:auditory-observation-reference` now uses
  `sstim-v:techBinauralBeats`. It was the **only** in-repo reference to a
  retired IRI. Evidence claims in `technique-evidence.ttl` reference only
  `martigli-breathing-oscillation`, which is unaffected.
- `BSC_TECHNIQUE_NS` in `src/rdf/graph.js` still resolves — the three originals
  keep that namespace — so the Graph browser continues to classify them as
  `catalogTechnique`. The incorporated concepts render as vocabulary nodes,
  which is the correct depiction.
- **Breaking for external consumers** of the four retired IRIs, who can only
  have obtained them by reading the Turtle: verified 2026-07-19, no
  `framework/bsc/technique/*` path has ever resolved on w3id — the audited
  catalog routes from
  [perma-id/w3id.org#6378](https://github.com/perma-id/w3id.org/pull/6378) match
  `^framework/bsc/?$` exactly, so every technique IRI under it (retired *and*
  surviving) returns 404. Released snapshots under `static/ontology/0.x.x/` are
  immutable and keep the retired terms.
- **Follow-up** (deliberately not bundled into this change):
  1. a version bump + `0.8.0` snapshot, since core gained a term;
  2. a w3id PR that both closes the pre-existing 404 gap for the three
     surviving BSC technique IRIs and points the four retired paths at their
     vocabulary replacements — using the upstream PR template
     ([per dgarijo on #6378](https://github.com/perma-id/w3id.org/pull/6378)).

## The BioSynCare organization record

Raised in the same session and **explicitly out of scope for this ADR**, because
it is not a repository change. `https://w3id.org/sstim/organization/biosyncare`
lives in the mutable external ecosystem projection
(`https://biosyncare-lab.web.app/current.ttl`), which
[ADR 0031](0031-qualified-ecosystem-records.md) keeps out of citable releases. It
is a **sourced** record — `dct:source <https://biosyncare.com/>`,
`<https://www.junto.space/en>` — describing a startup identity publicly listed by
Junto, and `record:junto-supports-biosyncare` targets it. The maintainer's
position is that Æterni Anima is the responsible organization and the BioSynCare
organization identity should not stand as a peer. Reconciling the two must go
through the ecosystem admission/retraction runbook, not a commit, and must
decide what happens to the dependent Junto relationship record.

## Alternatives considered

- **Delete the BSC framework entirely**, folding its techniques into SSTIM and
  treating BSC Lab/BioSynCare as bare implementations. Rejected by the
  maintainer on 2026-07-19: BSC is a real framework with three originated
  techniques and a coherent audio+visual doctrine. It would also have orphaned
  `definedByFramework` across ten experiment files, both reference protocols,
  and `void.ttl`, broken live w3id redirects, and erased the only static-RDF
  appearance of Æterni Anima (`dct:contributor` on `bsc.ttl`).
- **Rehome the generic techniques to `https://w3id.org/sstim/technique/{id}`**,
  the path ADR 0007 reserves. Rejected as redundant: the vendor-neutral concepts
  already exist in `sstim-vocab.ttl` under `sstim-v:tech*`, are dual-typed as
  both `skos:Concept` and OWL technique individuals, and are already in
  `sstim-v:TechniqueScheme`. Minting a second neutral IRI space would have
  recreated the duplication this ADR removes.
