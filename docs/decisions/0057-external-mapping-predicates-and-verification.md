# ADR 0057: How SSTIM chooses an external mapping predicate, and how it proves the target

**Status:** Accepted — 2026-09-07 · implemented across the three alignment
tranches of 2026-09-05 to 2026-09-07 and enforced mechanically by
`make alignment-verify`

## Context

Between 2026-09-05 and 2026-09-07 the alignment module went from 13 mappings
over two external vocabularies to 110 over four. Release 0.17.0 will freeze them,
and a frozen mapping is a citable commitment: it propagates into other datasets,
it is republished by registries that harvest the namespace, and it is hard to
withdraw.

The rules that produced those 110 rows existed only in a working document called
`ALIGNMENT_CANDIDATES.md` and in Turtle comments. That is the wrong home for a
decision that binds every future row, and it is why the same questions were
re-argued in each tranche.

Three published mappings have been wrong, and each was wrong in the same way:
label similarity was treated as evidence. Band QIDs resolved to a Van Halen album
and a stock exchange; MeSH `D012910` was recorded as sensory stimulation when the
NLM record is Snake Venoms; SNOMED `229070002` was recorded as sensory stimulation
when it denotes stretching exercises. Every gate in this repository passed all
three, because an external identifier is opaque to Turtle parsing, to SHACL and to
HermiT alike. Only the service that mints it can say what it denotes.

The candidate searches during these tranches produced the same hazard at volume.
An exact-label search for "brain" returns a journal, a family name, a French
commune and a rapper; for "cortex", an oil tanker and a video game; for
"Vestibular", a Brazilian university entrance examination; for airflow, a
measurement rather than moving air. Two candidates matched the label perfectly and
the subject not at all: MeSH Ultrasonic Therapy and Wikidata's high-intensity
focused ultrasound are ablative, while SSTIM's focused-ultrasound medium is not.

## Decision

**1. The predicate is decided by extension and intension, never by label.**

- `skos:exactMatch` only where identity is defensible in both directions.
- A therapy, indication or publication framing on the external side that this
  vocabulary deliberately does not carry is an **intension difference**, so those
  rows are `closeMatch`. MeSH Deep Brain Stimulation is scoped to movement
  disorders; MeSH `D016449` is a publication type describing an article rather
  than the design of the study it reports.
- Demonstrable containment is written as `skos:broadMatch` or `skos:narrowMatch`
  rather than flattened into `closeMatch`. MeSH Light spans visible, ultraviolet
  and infrared and is therefore broader than a visible-light medium; MeSH Sound is
  the audible band and is therefore contained by an acoustic-energy medium.
- `skos:relatedMatch` where the two are different kinds of thing: a technique
  against the phenomenon it evokes, an exposure against the substances that
  constitute it.
- A controlled value never takes `exactMatch` to the entity it classifies.
  [ADR 0021](0021-controlled-value-semantics.md) holds such a value to be an
  information category, so the neural systems, target sites and signal shapes are
  `closeMatch` however exactly the labels agree.

**2. A mapping is not asserted until its target is dereferenced at the authority
that mints it**, and the check is repeatable: `make alignment-verify` resolves
every target at Wikidata, the NLM MeSH endpoints, EBI OLS4 and tx.fhir.org. It
fails on a target that does not exist, is obsolete, or is a scholarly article or
clinical trial rather than the subject; and it reports REVIEW when a strong
mapping's target label shares no word with ours, which is the check that sees the
`D012910` class of error.

**3. Every mapping carries an `owl:Axiom` annotation** naming `dct:source`,
`dct:date`, `prov:wasAttributedTo` and a `skos:editorialNote` giving the reason
for the predicate. A mapping without dated provenance fails the gate.

**4. A rejected candidate is recorded with its reason**, in the editorial note of
a neighbouring row or in the module comment. The traps are the expensive part of
this work and rediscovering them is the failure mode.

**5. Licence-constrained sources are referenced by identifier only.** SNOMED CT
IRIs appear with no SNOMED description text, hierarchy or attribute content,
independently of any affiliate licence.

**6. Where a mapping predicate would misdescribe the relation, no mapping is
made.** A body placement is a delivery-position category and not the organ, so
that scheme takes a property to an anatomical class and an ADR of its own, rather
than fifteen easy and slightly false `closeMatch` rows.

## Alternatives considered

**Assert `exactMatch` liberally and let consumers downgrade.** Rejected: a wrong
`exactMatch` propagates into other datasets and cannot be recalled from them, and
the whole point of the mapping is that a consumer trusts it without re-deriving it.

**Use `closeMatch` for everything and avoid the containment judgement.**
Rejected: it is less work and it erases the distinctions the schemes exist to
draw. `mediumVisualLight` against MeSH Light and `techRepetitiveTMS` against MeSH
Transcranial Magnetic Stimulation are both containments, and flattening them
would tell a consumer the concepts are interchangeable when one subsumes the
other.

**Accept BioPortal or OLS mapping suggestions as evidence.** Rejected, and the
reason is now measured rather than assumed: BioPortal's own LOOM matcher publishes
six SSTIM mappings on MeSH class pages, four of which match terms the bundle
merely declares and one of which pairs our synthesis `Voice` with the human vocal
apparatus. Suggestions are a review queue.

**Leave the rules in the candidates document.** Rejected: that document is a
working record of one pass, its title says "candidates", and a release makes the
rows binding.

## Consequences

Mapping work is slower per row and the rows are defensible. Three tranches
produced 110 mappings, none of which the verification gate rejects, and the two
REVIEW lines it does print are correct and documented as expected.

The alignment module now reaches four external vocabularies and, since tranche 2,
the exposure namespace, so it declares `https://w3id.org/sstim/exposure` as a
dependency and the manifest was extended to match.

`make alignment-verify` is network-dependent and therefore opt-in, like
`make registry-verify`. It is not part of `make validate`, so a release must run
it deliberately. An unreachable authority is INCOMPLETE and never absence.

The reciprocal statements published to Wikidata inherit these predicates, inverted
where containment reverses direction, and carry a `P4390` qualifier naming the
SKOS relation. A consumer reading Wikidata therefore sees whether a link is exact,
close, broad, narrow or merely related, rather than inferring it from a property
named "exact match".
