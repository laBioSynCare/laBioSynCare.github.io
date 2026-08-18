# ADR 0054 — OWL 2 DL conformance, and why one datatype was declared and the other removed

**Status:** Accepted — 2026-08-18 · implemented 2026-08-18

## Context

SSTIM described itself as an OWL 2 ontology and was not in the OWL 2 DL profile.
`robot validate-profile --profile DL` over the Full closure returned 5935
violations:

| Violation | Count | Distinct IRIs |
|---|---|---|
| Use of undeclared annotation property | 5167 | 40 |
| Use of undeclared class | 752 | 17 |
| Use of undeclared datatype (`xsd:date`) | 13 | 1 |
| `xsd:duration` in a datatype restriction | 2 | 1 |

OWL 2 DL requires a declaration axiom for every annotation property, class and
datatype an ontology uses. SSTIM reused 57 terms from SKOS, Dublin Core, PROV,
ORG, VOAF, VoID, VANN, FOAF, BIBO, MOD, Creative Commons and the OBO upper
ontologies and declared none of them. `skos:prefLabel` alone accounted for 1443
violations.

**No gate could see this, and one gate actively hid it.** `make reason` runs
HermiT through ROBOT, whose default loading is non-strict: an undeclared
annotation property is silently coerced into one, so the reasoner was handed a
well-formed DL ontology and passed for months while the published artifact was
OWL Full. A consumer's reasoner sees the profile, not our loader's repairs.

The trigger for looking was DBpedia Archivo rating SSTIM one star of four, and
it is worth recording that the star was **not** the reason to act, because the
star turned out to be unrelated — see *Consequences*.

## Decision

**1. Declare every external term, in `sstim-core.ttl`.** 40 annotation
properties, 17 classes. That module is the only one present in every profile
closure (kernel ⊂ core ⊂ core-plus ⊂ full), so one home suffices and none of the
declarations is duplicated across modules. They state the role each term is
already used in, assert no subsumption, and change no entailment.

**2. Declare `xsd:date`.** It is outside the OWL 2 datatype map, so it needs an
`rdfs:Datatype` declaration to be legal.

**3. Remove `xsd:duration` rather than declare it.** `sstim-ex:limitAveragingTime`
is deprecated with `owl:deprecated` and `dct:isReplacedBy`, its range axiom
withdrawn, in favour of `sstim-ex:limitAveragingTimeSeconds` — an `xsd:decimal`
count of seconds. Both public values were `"PT8H"`; both are now `28800`.

**4. Add `make validate-profile`** to the `validate` chain, asserting all four
closures against OWL 2 DL directly.

### Why the two datatypes get opposite treatment

This is the part worth keeping, because the asymmetry looks arbitrary and is not.

**`xsd:date` is declared because the alternative lies.** The 13 affected ranges
carry calendar dates — `evidenceDate`, `validFrom`, `reviewedOn`,
`searchCoverageStart`. `xsd:dateTime` is in the OWL 2 datatype map and would
have needed no declaration, but adopting it means writing `T00:00:00Z` onto
dates whose time of day is unknown and unknowable. That is inventing precision,
and it would additionally invalidate every existing date literal in the public
instance data and in the live ecosystem store, which is outside git by ADR 0031.
The cost of declaring is that a reasoner treats the values as opaque and cannot
order them; SSTIM orders dates in SPARQL, which handles `xsd:date` natively, so
nothing we do is lost.

**`xsd:duration` is removed because declaring it does not work.** This was
tested rather than assumed: adding `xsd:duration a rdfs:Datatype` did not clear
the violation, it changed its shape, from *"Use of undeclared datatype"* to
*"Use of defined datatype in datatype restriction"*. OWL 2 DL rejects a defined
datatype in that position however it was introduced. The underlying reason is
that `xsd:duration` is only **partially** ordered — `P1M` and `P30D` cannot be
compared, because months have no fixed length — which is precisely why OWL 2
excludes it from the datatype map. No declaration could rescue it.

Seconds as `xsd:decimal` is also simply the better model: totally ordered,
directly comparable, and carrying its unit in the property name per the SSTIM
parameter convention.

## Consequences

**This breaks a consumer pinned to the 0.12 baseline**, and `make
full-equivalence` was right to refuse it. Four published triples are gone: the
range axiom, the old definition, and the two `"PT8H"` assertions. They are
recorded in that script's exception list with the reasoning rather than the gate
being loosened. The deprecation triples point at the replacement, so the
migration is discoverable from the graph itself, and `limitAveragingTime`
survives as a deprecated term rather than disappearing.

**The profile fix buys no Archivo star, and we should not pretend otherwise.**
The fourth star is a Pellet consistency check. Openllet 2.6.5 — the maintained
Pellet fork, run with Archivo's exact invocation — answers `Consistent: Yes` in
134 ms, expressivity `ALCHIF(D)`, and answers the same against the pre-fix OWL
Full graph fetched live. Archivo's `discovery.py` hands Pellet
`content_access.get_location_url(file_metadata)`, its own stored artifact on the
Databus, and that endpoint returns 503. The star is lost to their
infrastructure. This ADR's work stands on correctness, not on the rating that
prompted it.

**SSTIM was never deeply OWL Full.** Expressivity is `ALCHIF(D)`, comfortably
inside DL, and 5919 of the 5935 violations were missing declarations rather than
genuine expressivity breaches. The practical benefit is therefore narrower than
the violation count suggests: no reasoner we tested was failing before. What is
gained is that the claim is now true and mechanically checked, and that any
conformant DL reasoner is guaranteed sound, complete and terminating — a
guarantee OWL Full does not offer even when HermiT and Pellet happen to cope.

**`robot --strict` still cannot load the closure.** It failed identically before
and after this work, so it is a separate pre-existing defect, tracked in
`TODO.md` with five refuted hypotheses recorded. Do not read this ADR as having
fixed it.

**New gate cost.** `make validate-profile` adds about 5 s locally across four
closures. It earned that immediately: on its first run it caught an earlier
"conformant" result that had validated a 0-byte file, because `manifest files
full` refuses to emit while a checksum is stale and the closure came out empty.

## Alternatives considered

**Adopt `xsd:dateTime` for the 13 date ranges.** Rejected: it fabricates a time
of day, and invalidates existing literals in data we do not fully control.

**Declare `xsd:duration` and keep `limitAveragingTime` as it was.** Rejected on
measurement — it does not clear the violation.

**Convert the duration to an `xsd:decimal` under the *existing* property name.**
Rejected: it silently changes the meaning of a published property's values from
a duration literal to a bare number, which is worse for a consumer than a
rename, because nothing signals the change.

**Spread the declarations across the modules that use each term.** Rejected: it
duplicates declarations across closures and adds triples that must then be
deduplicated, and the kernel-to-full nesting means `sstim-core.ttl` already
reaches every consumer.

**Leave the ontology OWL Full and note it in the documentation.** Rejected: the
ontology's own description claims OWL 2, registries record profile, and an
unenforced claim decays. The gate is what makes the claim durable.
