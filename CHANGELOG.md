# Changelog

All notable changes to the **SSTIM ontology** — the versioned, citable artifact at
`https://w3id.org/sstim` — are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to
[Semantic Versioning](https://semver.org/). Release tags are `vX.Y.Z`; each tagged
version is frozen byte-identical under `static/ontology/X.Y.Z/`.

**Scope.** This tracks the reusable ontology term-space — every module listed in
[`static/ontology/manifest.json`](static/ontology/manifest.json), which is the
authoritative bill of materials, together with the profile entry points that
name their closures.
BSC Lab application and infrastructure work is tracked in [ROADMAP.md](ROADMAP.md)
and [TODO.md](TODO.md). The rationale for each change lives in the
[ADRs](docs/decisions/) and the `skos:historyNote`s on the ontology nodes; this
file is the human-readable summary.

## [Unreleased]

### Added

- **57 external mappings, taking the alignment module from two external
  vocabularies to four.** SSTIM had 13 mapping triples on 12 of its 551 concepts,
  reaching Wikidata and SNOMED CT: 3 of 39 techniques and none of the neural
  systems, target sites or phenomena. Tranche 1 adds MeSH descriptors, UBERON
  anatomical classes and Wikidata items across all four groups, each dereferenced
  at the authority that mints it. The evidence per row, the predicate reasoning
  and the rejected candidates are in
  [`docs/ontology/ALIGNMENT_CANDIDATES.md`](docs/ontology/ALIGNMENT_CANDIDATES.md).

  Three rules decided the predicates. A therapy or indication framing on the
  external side, which several MeSH descriptors carry and this vocabulary
  deliberately does not, is an intension difference, so those rows are
  `closeMatch`. Demonstrable containment is written as `broadMatch` or
  `narrowMatch` rather than flattened: MeSH Transcranial Magnetic Stimulation
  contains the repetitive protocol, and Wikidata's frequency-following response
  is auditory where SSTIM's is modality-neutral. And for neural systems and
  target sites, ADR 0021 holds a controlled value to be an information category
  rather than the entity it classifies, so no row there is `exactMatch` however
  well the labels agree.

  Two label-alike candidates were rejected rather than mapped. MeSH Ultrasonic
  Therapy and Wikidata's high-intensity focused ultrasound are both ablative,
  and low-intensity focused ultrasound neuromodulation is a different technique
  wearing the same words. UBERON's "cortex" is the outer layer of any organ and
  subsumes adrenal cortex, so `sstim-v:targetCortex` stays unmapped until its own
  definition says whether it means cerebral cortex.

- **`make alignment-verify`.** Dereferences every external mapping at Wikidata,
  the NLM MeSH endpoints, EBI OLS4 and tx.fhir.org. Three published mappings
  here have been wrong (band QIDs resolving to a Van Halen album and a stock
  exchange, MeSH D012910 recorded as sensory stimulation when it is Snake Venoms,
  SNOMED 229070002 when it denotes stretching exercises) and every gate passed
  all three, because an external identifier is opaque to Turtle parsing, SHACL
  and HermiT alike. Fails on a target that does not exist, is obsolete, or is a
  scholarly article or clinical trial rather than the subject; flags for review a
  strong mapping whose target label shares no word with SSTIM's, which is what
  sees the D012910 case. All 70 mappings pass.

- **`make wikidata-statements` and `make wikidata-inbound`.** Every mapping SSTIM
  publishes points outward, and measured on 2026-09-05, 0 of the 32 Wikidata
  items SSTIM maps carried a statement back. On 2026-09-06 the generated batches
  were published under the maintainer's account: Wikidata item `Q141325360` for
  the ontology, then 29 `P2888` statements naming SSTIM term IRIs, and the same
  measurement now reads 29 of 32. The three exceptions are the `relatedMatch`
  rows held back by design. The first target derives the
  QuickStatements batch that fixes that, inverting broad and narrow because
  containment reads the other way round when written on the Wikidata side; the
  second measures how many items link back, by reading those items' claims rather
  than searching for a string. Neither edits Wikidata: the batch is pasted by a
  signed-in human under the named account and its conflict-of-interest
  disclosure.

### Fixed

- **Ten prose totals still said 545 concepts** after ADR 0025's six terms took the
  vocabulary to 551 — in the release changelog, the public README's call for
  translators, `CURRENT_STATE.md`, `IMPROVEMENT_PLAN.md`, `TODO.md`, the OLS4
  notes, and an unsent ShowVoc enquiry that would have quoted a stale figure to a
  registry. The count is generated into `TERM_INDEX.md` and CI-checked there, so
  the number was never in doubt; nothing compared the prose to it. `truth-audit`
  now does, matching only present-tense totals — "all N", "of the N" — so a
  historical measurement like "269 of 545 carried all four" stays true and
  unflagged.
- **The registry bundle asserted nineteen titles, sixteen descriptions and six
  creation dates about one ontology.** `robot merge` unions every module header
  onto a single ontology node, so a registry got the whole module set's metadata
  as claims about SSTIM itself and picked from it arbitrarily. BioPortal chose
  **August 1, 2026** as the creation date — the day ADR 0043's split created eight
  module files — over the 2026-04-12 the Kernel states and Zenodo, `CITATION.cff`
  and the registry tracker all use, and rendered the description as every module
  blurb joined by commas.

  `make bioportal-bundle` now collapses those three to the Kernel's own values,
  the Kernel being the file that carries `https://w3id.org/sstim` itself. Its
  *set*, not a single value: the title is legitimately four, one per published
  language — what it is not is nineteen. `dct:requires`, `rdfs:seeAlso`,
  `dct:hasPart` and `skos:historyNote` stay many-valued, because they are.
  Verified the result still loads under the OWL API and is still OWL 2 DL.
- **The registry pull URL served the development line, so BioPortal had been
  ingesting `-dev` snapshots nightly.**
  `https://labiosyncare.github.io/ontology/sstim-full.owl` is BioPortal's
  "load from URL" target. At the time, CI regenerated it on every push to
  `main` and built it from the working sources. BioPortal's submission history
  is the result: 0.15.0-dev, 0.16.0-dev, 0.17.0-dev, each parsed and indexed,
  its "Version information" naming a mutable line nobody can cite, and its
  Version IRI stuck at 0.14.0 because a `-dev` bundle correctly carries none and
  the portal kept the last one it had seen.

  A stable URL a registry polls is a promise about the current *release*.
  `make bioportal-bundle` now reads the released version from `void.ttl` and
  builds from that version's frozen directory, always carries its
  `owl:versionIRI`, and fails outright if a `-dev` line ever reaches it.

  **Correction begun 2026-08-31:** selecting frozen modules did not by itself
  make the artifact byte-stable. The metadata collapse reparsed and reserialized
  the RDF/XML with fresh blank-node identifiers and ordering, so BioPortal saw
  many byte-distinct 0.16.0 submissions for isomorphic graphs. The collapse now
  receives the frozen Kernel and preserves ROBOT's XML structure.

  **Strengthened 2026-09-01:** one fail-closed resolver now requires the direct
  frozen snapshot, released Kernel and Full profile, and every manifest source
  hash. An OWL-aware diff admits only the documented header transform. Two
  independent builds must match, and a first-parent-history-anchored integrity
  ledger pins the source closure, exact artifact SHA-256, canonical graph, byte
  count, and triple count. The Actions cache is keyed by that identity; hits are
  fully verified and misses must reproduce it, so caching is an optimization,
  not the invariant.

## [0.16.0] - 2026-08-18

### Added

- **SSTIM is in the OWL 2 DL profile**
  ([ADR 0054](docs/decisions/0054-owl-dl-conformance-and-the-duration-datatype.md)).
  Every profile closure was OWL Full: 5935 violations, from 57 external terms —
  SKOS, Dublin Core, PROV, ORG, VOAF, VoID, VANN, FOAF, BIBO, MOD, Creative
  Commons and the OBO uppers — used without the declaration axiom OWL 2 DL
  requires. `skos:prefLabel` alone accounted for 1443. All 57 are now declared in
  `sstim-core.ttl`, the one module present in every closure. They state the role
  each term was already used in and change no entailment.
- `make validate-profile` asserts all four closures against OWL 2 DL directly,
  and is part of `make validate`. `make reason` could not have caught this and
  never will: ROBOT loads non-strictly, so an undeclared annotation property is
  silently coerced into one and HermiT is handed a well-formed DL ontology.
- `sstim-ex:limitAveragingTimeSeconds`, an `xsd:decimal` count of seconds,
  replacing a duration literal.
- Every `skos:ConceptScheme` now carries `dct:license` (CC BY 4.0) — 67 of them,
  across the vocabulary, exposure and ecosystem modules. A scheme extracted on
  its own previously travelled with no licence at all.
- `make language-coverage` measures multilingual coverage per scheme and refuses
  to let it drift. A scheme must be complete or wholly untranslated, a new scheme
  must ship translated or be recorded as debt, and a translated scheme must leave
  the ledger. Closes the metric KR-16 lacked. It also reports — without gating —
  `skos:altLabel` coverage, which is 15 aliases on 8 of the 551 concepts. Four
  documents had called that coverage zero; the aliases had been in the graph
  since [ADR 0049](docs/decisions/0049-neural-oscillations-and-frequency-ambits.md)
  landed on 2026-08-15, and nothing measured them, so the claim went unchallenged.
- **The SKOS vocabulary is fully multilingual.** All 551 concepts now carry
  English, Italian, Portuguese and Spanish `skos:prefLabel` values, across all 67
  concept schemes. The gate found 269 of 545 complete; the remaining 276 labels
  were added the same day, so `make language-coverage` reports 100% and its
  ledger of untranslated schemes is empty.

  Two honest qualifications travel with this. The 276 new labels were written by
  the maintainers and have had **no native review** — a review request is open,
  and several known soft spots are named in it rather than left to be found. And
  `skos:definition` remains English-only for all 551 concepts: translating
  definitions is a substantially larger job and a separate decision, not an
  oversight.
- `make definition-coverage` gained a bar against definitions that restate their
  label, implementing the second-pass review's finding that a length check
  cannot catch them.
- **`make registry-verify`** measures what the public registries actually serve,
  deriving the expected namespace from `sstim-core.ttl` rather than restating it.
  Network, opt-in, and deliberately outside `make validate`; it reports three
  states, because an unreachable registry is INCOMPLETE and never absence.

  It exists because it immediately found the worst defect in the tracker:
  **prefix.cc served `sstim` → `https://w3id.org/sstim/`** — a slash where the
  ontology has a hash — while `REGISTRY_SUBMISSIONS.md` asserted the hash form
  and marked the entry DONE. Anything resolving the prefix built every term IRI
  wrong, and `https://w3id.org/sstim/Preset` is a 404. Nobody had fetched it,
  partly because prefix.cc's TLS certificate expired 2025-12-31 and an ordinary
  `https://` check dies before it can answer.

  **Corrected the same day** — all four serialisations now serve the hash form,
  confirmed by re-running the gate. The slash form is still listed but outranked,
  which is why the check compares what is *served* rather than what exists.
- **Four translation defects, found by gating a property rather than by review.**
  A translation must not collapse a distinction English makes, and three did:
  "Session interrupted" and "Stopped the session" shared a label in Italian and
  Portuguese, and "Relatedness unknown" and "Unknown relationship" shared one in
  Portuguese and Spanish. In every case a sibling language already distinguished
  them. A fourth, flagged in the 2026-08-18 translation pass and left open:
  `actionDeclined` read "Ação recusada" — the action was refused — for a concept
  defined as the participant choosing not to say what they did.

  The 276 labels written that day still have had **no native review**. This gate
  is not a substitute for one; it catches a class of error that does not need a
  native speaker to see.
- **The HED bundles' sidecars were not BIDS-conformant, and now are.** They had
  been called "BIDS-style" without ever being handed to a BIDS tool. Measured
  2026-08-18 with `bids-validator` 1.15.0: the first run returned `INTERNAL
  ERROR. SOME VALIDATION STEPS MAY NOT HAVE OCCURRED`, which is no validation
  rather than a failed one. The cause was ours — a sidecar entry named `HED`
  holding a `Description` and a `Definitions` array, where BIDS reserves `HED`
  for a column's annotations and hands the entry's values to the HED parser.
  Definitions moved to their own `sstim_hed_definitions` entry, and **all three
  bundles now validate with zero errors**. The one remaining warning,
  `CUSTOM_COLUMN_WITHOUT_DESCRIPTION` for the `HED` column, cannot be fixed
  without reintroducing the crash and is raised with the HED Working Group.
- **A session event can say what changed and to what** — `sstim-v:eventParameterChanged`
  (an eleventh session event type), `sstim:StimulationParameterKind` with
  `sstim-v:StimulationParameterKindScheme` (level, carrier frequency, modulation
  frequency, duty cycle, phase offset), and `sstim:hasChangedParameter`,
  `sstim:parameterValueBefore`, `sstim:parameterValueAfter`. Until now a
  `sstim:SessionEvent` could carry exactly two things, its type and its clock
  offset, so a stepped stimulus was unrecordable and a safety clamp could not say
  which value it clamped.

  The parameter kinds are modality-neutral quantities rather than field names, so
  they hold for an auditory, visual or haptic channel alike and SSTIM does not
  inherit one application's parameter list. SHACL requires a parameter-changed
  event to carry both the kind and the new value, and forbids those properties on
  events that change nothing; both constraints were checked against violations.
  All four profile closures remain in OWL 2 DL.
- **Two `lossyBecause` statements in the HED crosswalk were false.**
  `eventSafetyLimitApplied` told consumers the requested and delivered values
  "must be read from the session record" when the session record could not hold
  them; `eventEngineFallback` called the engine pair "SSTIM-only" when SSTIM has
  no engine-identity term at all. Both erred toward "our model is richer than the
  profile", which is the direction nothing audited. The first is now true; the
  second is withdrawn rather than reworded.
- **Crosswalk 0.3.0 adds `detailTemplate`**, so HED carries per-event values it
  was always able to express: a safety clamp emits
  `(Experiment-control, Constrained, Parameter-label/Level, Parameter-value/0.3)`
  rather than a bare `(Experiment-control, Constrained)`. `hed` remains the part
  the event type alone determines, and `make hed-roundtrip` strips detail tags
  before reversing.
- **Crosswalk 0.4.0 moves the parameter-kind labels into the contract.** They
  had been a `PARAM_LABELS` dict inside `generate-hed-bundle.py` — the wrong
  place twice over: they are part of the SSTIM-to-HED mapping, not of one
  generator, and nothing checked they still covered
  `sstim-v:StimulationParameterKindScheme`. A sixth kind would have produced
  annotations with no `Parameter-label` until some fixture happened to use it,
  which is the same silent-undercoverage hole `make hed-crosswalk` has always
  closed for event types — rebuilt one level down, hours after describing it.
  The gate now checks both schemes, in both directions, and validates each event
  template filled with every real kind rather than one invented sample.
- **A third demonstrator bundle, `test/fixtures/hed-bundle-segmented/`**, covering
  the "explicitly segmented" stimulus of decision 5 with piecewise events. There
  is now one bundle per shape the decision names — fixed, segmented, continuous —
  and each manifest declares its own `modulation.shape`.
- **The time-varying half of ADR 0025 decision 5 is built and enforced.** A
  second demonstrator bundle, `test/fixtures/hed-bundle-modulated/`, carries a
  Martigli breathing period gliding 4 s → 10 s over 300 s as a linked BIDS-style
  trace (`stimulus.tsv` + `stimulus.json`) rather than flattening it into the
  events table, which decision 5 forbids. The trace advances on *delivered* time,
  so the pause at 190 s freezes the arc and displaces the rest of the sweep;
  samples inside the pause are `n/a` rather than interpolated, because nothing
  was being delivered there.

  The requirement had been stated since July with no instrument able to tell
  whether it held. `make hed-bundle` now refuses to write a bundle whose source
  declares a sweep without a trace, and `make hed-bundle-check` fails if a
  committed bundle flattened one.

  Piecewise events were the other representation decision 5 allows and were not
  available: SSTIM has no parameter-change event type. HED can carry that form —
  `(Definition/Sstim-breath-period/#, (Time-interval/# s))` validates against
  8.4.0 — so the gap is SSTIM's, and it is recorded as an ontology decision to
  take rather than made in passing.
- **Cross-artifact identifiers, which decision 6 requires and the bundles
  lacked.** `events.tsv` carries an `event_id` column and each manifest a
  `crossArtifactIds` map; `make hed-bundle-check` resolves every one against a
  `sstim:SessionEvent` in the source graph. A file hash proves the bytes did not
  change, not that the identifiers mean anything. The manifests also carry the
  SSTIM suite and application versions, which decision 6 lists, and both sources
  are now validated against the Full-profile SHACL shapes — for the modulated
  source, this gate is the only place that happens.
- `make hed-crosswalk` gained a fourth check: the prose that restates its counts
  must still match them. Crosswalk 0.2.0 defined the two temporal scopes and
  `eventPlaybackResume` stopped being lossy, taking the count from six to five —
  the gate printed five the same day while the ADR and the generator's docstring
  went on saying six. A pattern matching nothing fails too, so rewording the
  prose cannot silently retire the check. Its reported tag count is also derived
  from `hedtools` now rather than a regex, which had counted `Def` and the two
  definition names as tags and missed the six tags inside the definitions.

### Changed

- **`sstim-ex:limitAveragingTime` is deprecated** in favour of
  `sstim-ex:limitAveragingTimeSeconds`, with `owl:deprecated` and
  `dct:isReplacedBy`, and its range axiom withdrawn. Both public values were
  `"PT8H"` and are now `28800`.

  `xsd:duration` had to leave rather than be declared: declaring it changes the
  violation from "undeclared datatype" to "defined datatype in datatype
  restriction", because OWL 2 DL rejects a defined datatype in that position
  however it arrives. It is only partially ordered — `P1M` and `P30D` do not
  compare — which is why OWL 2 excludes it. `xsd:date` went the other way and is
  declared, because `xsd:dateTime` would mean inventing a time of day that is not
  known.

  **This breaks a consumer pinned to the 0.12 baseline.** Four published triples
  are gone; they are recorded in `check-sstim-full-equivalence.py`'s exception
  list rather than the gate being loosened. The deprecation triples point at the
  replacement, so the migration is discoverable from the graph.
- `sstim-ex:limitAveragingTime` deprecation (already recorded above) is joined by
  two smaller corrections. `sstim:durationSeconds` now says it is whole seconds
  and why: it is an *intended* duration, chosen by a person or shipped as a
  preset default, and intent is not authored at sub-second precision, while what
  actually happened stays decimal in `sstim:deliveredDurationSeconds`. The
  second-pass review found two integer durations among nine decimals with
  nothing recording whether the coarseness was meaningful; the sibling was
  answered on 2026-08-17 and this one was missed.
- **Each axiom is now asserted exactly once.** `sstim-alignments.ttl` restated
  five upper-ontology `rdfs:subClassOf` axioms that `sstim-common`, `-technique`,
  `-session` and `-evidence` already carried, so every Full serialization held
  10575 raw triples against 10570 distinct — the reason DBpedia Archivo counts
  five more than rdflib. The axiom belongs to the module that defines the class,
  which reaches profiles alignments does not: `sstim-common` is in Core Plus
  while alignments is Full-only. The rationale prose stays in place as comments,
  following the convention the file already used for
  `sstim:SessionInstance → prov:Activity`.

  Consequently `sstim-alignments.ttl` no longer references `common`, `session`
  or `technique`, and its `dct:requires` — and its manifest entry — narrow to
  `evidence` and `vocab`. Both had over-declared.

- **Immutable snapshot routes are patterns, not an enumeration**
  ([ADR 0053](docs/decisions/0053-wildcard-snapshot-routes.md)). Four rules now
  cover every version, including releases not yet cut, replacing 30 enumerated
  ones — so a release no longer needs a pull request against
  `perma-id/w3id.org`. The w3id maintainer asked for this while merging the
  0.14.0 routes. One rule stays an enumeration and cannot grow: the pre-modular
  snapshots `0.1.0`–`0.12.0`, whose version IRI resolves to `sstim-core.ttl`
  because that file was the whole ontology before ADR 0043 split it.

  No published identifier changed meaning: every frozen artifact resolves to the
  same URL as before, checked by executing the committed rules against every file
  in every snapshot. What is given up is fail-closed routing — a version-shaped
  path that was never released now redirects to a Pages URL that answers 404,
  rather than 404ing at w3id.
- The public preset and reference identity routes are live at last. They had been
  prepared but never submitted, so `https://w3id.org/sstim/ref/{id}` and the two
  `implementation/bsclab/preset/{id}` IRIs answered 404 despite being published
  identifiers.

## [0.15.0] - 2026-08-17

### Added

- **Neural oscillations as their own terms**
  ([ADR 0049](docs/decisions/0049-neural-oscillations-and-frequency-ambits.md),
  closes KR-08): `sstim:NeuralOscillationType` and six named rhythms, each
  carrying its conventional ambit via `sstim:hasTypicalFrequencyBand`, the wider
  range it actually occupies (`sstim:extendedHzMin`/`Max`), the topography that
  identifies it alongside frequency, and the state it is observed in. Rhythm,
  wave and oscillation are recorded as near-synonyms with their divergences
  named, rather than as bare alternate labels.
- Four neural-oscillation references, every DOI resolved through Crossref before
  being written.
- `make band-scope-notes` — fails if a frequency band claims an outcome, or if
  an association ADR 0049 moved off the band scope notes stopped being recorded.
- `make shacl-public-claim-gate` — 16 adversarial fixtures across the 10 clauses
  of the public-claim contract, plus 2 positive controls. The gate never fires on
  committed data (nothing claims above C1), so without adversarial fixtures a
  deleted clause would be invisible to every other check. The harness is itself
  mutation-tested: removing the direction clause fails exactly two cases.
- **SSTIM's own preset contract**
  ([ADR 0051](docs/decisions/0051-sstim-preset-contract.md), closes KR-07):
  `static/schemas/preset.schema.json`, model tag `sstim-preset-1`. A preset is
  composed of modality-declaring **components**, not audio voices, so a visual
  or haptic component needs no new structure — and projects to RDF today through
  the generic `sstim:composedOfTrack`, which already ranges over
  `sstim:Track`. There is no component ceiling: the six-layer limit is the BSC
  catalog profile's engine constraint, and belongs on that profile's shape. Parameters carry their
  units in their names; one optional `breathReference` replaces a header flag
  and a per-voice flag that had to agree; there is no application product
  envelope. It takes the numeric parameter ranges from the BioSynCare catalog
  format documented in `PRESET_FORMAT.md` and nothing else — that format is one
  audio-only application's incremental history, and a standard does not ratify
  one vendor's catalog taxonomy.
- `make preset-contract` — the parameter matrix, executed rather than tabulated.
  It reads every bound out of the schema, the SHACL shapes and the format
  document and compares them (12 parameters against SHACL, 11 against the
  documented ranges), so a bound changed in one place fails until the others
  follow. It also carries the cross-field rules no JSON Schema can express —
  beat frequency, pulse rate, breath-reference resolution, unique component ids,
  the level rationale — with 25 adversarial cases and 8 positive controls.
- **One signal, several sensory renderings**
  ([ADR 0052](docs/decisions/0052-abstract-signals-and-sensory-renderings.md)):
  `sstim:StimulationSignal` is a time-varying function with a frequency extent
  and a shape, and no modality. `sstim:SignalRendering` binds it to one channel's
  parameter by a named mechanism and states whether the result is physically
  present or perceptually constructed. Two channels naming one signal are two
  renderings of one design — asserted, where before a consumer had to infer it
  from two decimals that happened to match. 6 classes, 12 properties and 20
  concepts across four schemes (`sstim-v:SignalShapeScheme`,
  `RenderingMechanismScheme`, `RenderingPresenceScheme`,
  `RenderableParameterScheme`). Signal shapes carry noise and sampled beside the
  four periodic forms, which is the waveform vocabulary Directions §1 wanted seen
  from the other side: one vocabulary for the shape a signal has and the waveform
  a rendering presents.

  Carrier and modulator are a rendering rather than the universal structure, so
  `sstim:renderingCarrierHz` lives on the rendering. A carrier exists because
  10 Hz falls below the audible range; a 10 Hz flicker or vibration is presented
  directly and has none.
- `make signal-layer` — four SHACL constraints that make the layer refuse abuse
  rather than merely describe it: an inverted extent, a sampled signal with no
  source, a binaural beat claimed as physically present, and a direct
  presentation carrying a carrier. 12 adversarial fixtures against 3 positive
  controls, one of them a genuine partial overlap (10–20 Hz straddling the alpha
  edge) so the constraints cannot pass by rejecting everything.
- **The first real data in the signal layer.** The sensory-field reference
  profile now states two ear channels at 200 and 204 Hz and a visual channel
  flickering at 3 Hz, and says two things it could not say before. The ear pair
  renders *one* signal: the 4 Hz beat is in neither ear's waveform, so both
  renderings name the same `StimulationSignal` and both declare perceptual
  presence, checked against `sstim:impliesPresence` rather than taken on trust.
  The visual channel renders a *different* signal — 3 Hz, not 4 — so this profile
  is not one signal delivered two ways, and now says so instead of leaving a
  reader to compare two decimals and guess, which is precisely the inference the
  signal layer exists to replace. Both signals also exercise the band-interval
  relations against real bounds: 4 Hz within theta, 3 Hz within delta. The layer
  had been exercised only by synthetic fixtures, which is what let three
  soundness faults sit in it for four days.
- **Every published term now defines itself**, enforced by
  `make definition-coverage` over 1,004 terms: a definition may neither restate
  its label nor be too short to distinguish a sibling. All 17 frequency bands —
  the most-referenced vocabulary in SSTIM — carried a scope note and no
  `skos:definition`, and ADR 0049 rewrote every one of those scope notes six
  weeks earlier without noticing, because nothing checked. Each band's definition
  is generated from its own `hzMin`/`hzMax` rather than retyped, so the interval
  and the definition cannot disagree, and each says what the reviews kept having
  to repeat: a band is a conventional ambit and a Hz range, not the rhythm
  delimited by it. 26 definitions added, including three sensory modalities and
  the six noise colours; three existing ones — "Perceived taste.", "Perceived
  smell.", "Delivered across intact skin." — were rewritten rather than waived.
- **The named-graph invariant has a test.**
  `src/rdf/annotations/annotationRdf.js` emits eight quads and had no test file
  of any kind beside it, so dropping the graph argument from a `quad()` call
  would have passed `make test`, `make check` and `make validate` while silently
  merging user annotations into the authoritative graph — the failure CLAUDE.md
  §5.5 and §8 exist to prevent. Six tests assert the property directly rather
  than through a snapshot, because a snapshot would be regenerated by whoever
  broke it; mutation-tested, removing one graph argument fails three of the six
  from three angles. They cover the neighbouring silent failure too: only an
  exact `"public"` reaches the shared graph (checked against ten plausible
  near-misses including `"Public"`, `" public"` and `true`), two users land in
  two graphs, and no raw Firebase user id appears in any subject, object or graph
  name.

### Changed

- **The public-claim gate now requires an applicability contract, not just a
  tier** ([ADR 0050](docs/decisions/0050-public-claim-applicability-contract.md),
  closes KR-04). It asked one question — does *some* claim linked by the
  deprecated `sstim:supportsRelation` reach the required tier — so a rigorous
  study *refuting* a preset authorized the public claim it disproved. So did an
  assessment of a different subject, evidence from a modality the preset does not
  deliver, an unreviewed or withdrawn claim, and a claim citing literature no
  basis of it ever used. Authorization now requires one assessment satisfying all
  of: supporting direction, sufficient tier, the preset as both proposition
  subject and scope intervention, a declared population, a modality the preset
  actually delivers (derived through `followsProtocol` → `usesTechnique` →
  `techniqueModality`), a public-safe citation that is also one of its own
  evidence bases, a confirming review decision with no contradicting decision
  against the same revision, and no deprecation or supersession.

  **Consequence, and it is intended:** no `sstim:EvidenceReviewDecision` exists
  anywhere in SSTIM, so no claim can currently authorize C3 or C5. No evidence
  review has been run, so the honest count of presets entitled to a public
  structure/function claim is zero. Nothing breaks today — both presets sit at
  C1. This hardens the existing C0–C5 ladder and neither adopts nor pre-empts the
  facet-based redesign proposed in ADRs 0028–0029.

- **The five band-to-Wikidata mappings moved to the rhythms**, where the items
  point: Q2469782 describes "a neural oscillation", not a Hz interval. Four
  became `skos:exactMatch`. Beta stayed `closeMatch` — Q831014 spans 12.5–30 Hz
  while SSTIM holds the sensorimotor rhythm apart at 12–15, so the item subsumes
  an entity SSTIM keeps separate. Each band carries a `skos:historyNote` naming
  where its mapping went.
- **Outcome prose left the six primary band scope notes.** Nothing was deleted:
  three associations became evidence assessments with a tier and a citation,
  seven became dated `noKnownEvidenceInSSTIM` knowledge-status assertions. That a
  widely repeated association is unevidenced is itself recorded.
- `AssessmentProposition` and `EvidenceAssessmentClaim` accept a
  `NeuralOscillationType` subject. The evidence model assessed only what BSC
  delivers, and an assessment about an endogenous rhythm is neither a preset nor
  a technique.
- The frequency-band scheme description no longer calls these "neural oscillation
  frequency bands", and its editorial note records the resolution instead of
  deferring it.
- **The four preset validation gaps KR-07 named are closed** in SHACL: a preset
  is capped at six voices; the binaural beat `|fl - fr|` may not exceed 35 Hz
  unless it is exactly 40 Hz in a preset declaring `gamma-40` (a preset-level
  constraint, since the voice cannot see the target band); the Symmetry pulse
  rate `nnotes / d` may not exceed 50 Hz; and a voice louder than 0.30 must
  record why in an `rdfs:comment` — a rationale requirement rather than a hard
  ceiling, which is what the specification actually says. Two ranges the shapes
  had drifted from now match the specification: carriers are `[80, 1000]` Hz
  rather than anything above 0, and the Symmetry base note is >= 80 Hz rather
  than 50. No committed instance was affected.
- `PRESET_FORMAT.md` stated `iniVolume` as "0-1" in its per-type tables while
  its global limits section says 1.0 is invalid. It now reads `0 <= v < 1`.
- **The public-claim gate could be switched off by omitting one triple.** It
  opens with `?level requiresEvidenceTierRank ?req`, and nothing made that
  property mandatory: a claim level without it matched nothing, so the whole
  constraint passed vacuously for every preset declaring that level. All six
  committed levels carry it, which is why correct data hid a fail-open contract.
  `sstim-sh:PublicClaimLevelShape` and `sstim-sh:EvidenceTierValueShape` now
  require the ranks the gate reads, with fixtures for both.
- **The preset schema's modality claim was wider than its parameters.**
  `breathing-oscillation` and `symmetry-sequence` accepted any modality while
  carrying audio-frequency parameters — the shipped fixture asserted a 180 Hz
  *visual* breathing guide and validated. All four defined kinds are now
  explicitly auditory. The structure stays modality-neutral; what is missing is
  the separation of an oscillation from the parameter it modulates, which is the
  same thing spatialization needs.
- The schema's `modality` enum listed nine values where SSTIM declares six.
  `make preset-contract` now resolves all 45 controlled values across five
  schemes to declared `skos:notation`s and fails on invention (KR-17 pattern),
  and compares `permutationFunction`'s ceiling against the named permutations.
- **Editorial notes on `sstim:ControlTrack`, `sstim:StimulusSpecification` and
  `sstim-ex:StimulusChannel`** recording the abstract-signal/rendering question
  on the terms themselves: that `ControlTrack`'s modulation is prose no property
  expresses, that most of the rendering layer already exists on a channel
  (delivery medium and perceived modality held apart, plus carrier, flicker and
  beat rates) while the shared signal tying several channels to one target does
  not, and that SSTIM carries two modality vocabularies —
  `sstim-ex:PerceivedModality` with twelve concepts including proprioceptive,
  and `sstim:SensoryModality` with six, a strict subset.
- **`sstim-ex:hasFrequencyHz` becomes the generic parent of a frequency family**
  rather than being deprecated: `hasCarrierFrequencyHz` (bears a signal the sense
  cannot receive directly), `hasToneFrequencyHz` (is itself the stimulus), and
  `hasModulationFrequencyHz` (the rate something varies at), which
  `hasFlickerRateHz` and `hasBeatFrequencyHz` now specialise. It meant "carrier
  or tone frequency" — two things under one name. No migration: every existing
  assertion stays valid and now answers the generic question by entailment,
  which a deprecation would have broken.

  The parent drops `owl:FunctionalProperty`, and had to: a channel presenting a
  200 Hz carrier modulated at 10 Hz has two frequencies, and a functional parent
  would have entailed 200 = 10. Each child keeps functionality, which is where
  it belongs.
- **`sstim:hzMin` and `sstim:hzMax` accept a signal as well as a band.** The
  bound means the same thing on both — the edge of a frequency extent — and a
  signal needs one because noise spans a range rather than sitting at a point. A
  domain widening, so every existing band assertion is unaffected.
- `make band-scope-notes` also checks frequency arithmetic: every oscillation's
  extended range must contain its typical ambit, and no band's interval may run
  backwards.
- **Perceptual presence now follows from the rendering mechanism.**
  `sstim:impliesPresence` states on each `RenderingMechanism` what it necessarily
  produces — direct presentation, amplitude and frequency modulation and a
  monaural beat are physically present; a binaural beat is perceptually
  constructed, because the signal is absent from each ear's waveform. A rendering
  names its mechanism and the presence follows; SHACL rejects any rendering whose
  stated presence contradicts it. The rule it replaces named binaural-beat and
  physical explicitly, so it covered one mechanism of five: a monaural beat
  declared perceptual passed, and so did amplitude modulation. Reading the
  implied value from the mechanism covers all five and any added later, and
  cannot fall out of step with the vocabulary. This is the pattern
  `requiresEvidenceTierRank` already uses on claim levels — the fact lives on the
  concept, and the gate reads it there.
- **The two carrier properties stay, and must now agree.**
  `sstim-ex:hasCarrierFrequencyHz` describes emission and belongs to the
  `hasFrequencyHz` family, so a consumer can ask what a channel presents without
  knowing how it was specified; `sstim:renderingCarrierHz` describes a binding,
  and is the finer of the two since a channel may carry several renderings. They
  sit either side of the layer split [ADR 0041](docs/decisions/0041-stimulus-description-layers-and-the-canonical-schema-gap.md)
  draws. Each now says this about the other in a scope note, and a SHACL
  constraint requires them to agree wherever both are asserted — which is what
  makes two names for one quantity defensible rather than merely tolerated.
- **The band-interval relations are constrained.** A signal spanning 4–8 Hz could
  claim `sstim:signalWithinBand` alpha (8–13 Hz) and conform, though every
  ingredient for the check was present and ADR 0049 had added exactly this
  containment check for oscillations six weeks earlier. Three SHACL-SPARQL
  constraints compare the signal's extent against the band's, one per relation,
  including the overlap case that must reject both containment and disjointness.
- **The `skos:notation` uniqueness rule is stated and enforced.** It holds within
  a category, not globally: `eye-strain` names a comfort boundary, an effect and
  a reported experience, and those are three different things sharing a word.
  Checking properly showed zero collisions within a category across all 77
  categories, so the 17 cross-category repeats follow the established pattern
  rather than breaking it. The rule matters because `preset-contract.py` resolves
  45 controlled values by (category, notation) exactly, and it had never been
  written down or checked.
- `sstim:signalSourceAsset` has the `rdfs:range` it lacked (`iao:0000030`). A
  SHACL rule required a sampled signal to identify its source without saying what
  a source may be.
- `sstim:citesReference` has the `rdfs:domain` it lacked, and a property shape,
  so the constraint the public-claim gate depends on lives in the model rather
  than only inside that gate's SPARQL.
- **The two fixture gates share one pySHACL run.** pySHACL costs ~7s over the
  13,020-triple closure no matter how few fixture triples ride along, and
  `signal-layer` ran it 15 times while `shacl-public-claim-gate` ran it 20 — ~250
  seconds spent re-validating an ontology that was identical and conformant on
  every pass, to check about 300 fixture triples. Each fixture is now rewritten
  into its own IRI namespace so subjects cannot collide, and is judged only on
  the results whose focus node is its own. That is strictly more precise than
  what it replaced: matching a message anywhere in a per-fixture report proved
  *something* failed with that text, where matching it on the fixture's own focus
  node proves *this* fixture failed for *this* reason. `make signal-layer`
  115s → 10.7s; `make shacl-public-claim-gate` 149s → 11.7s.

## [0.14.0] - 2026-08-13

Published under version DOI `10.5281/zenodo.21923315`, with
`10.5281/zenodo.21286974` retained as the all-versions concept DOI.

The session-record release. SSTIM can now say what happened during a session,
in what order, on which clock — and what a participant said about it, including
what they were never asked. Closes audit findings KR-02 and KR-03.

### Added

- **Session events and the clock that orders them**
  ([ADR 0048](docs/decisions/0048-session-events-and-qualified-observations.md)):
  `sstim:SessionEvent` with a ten-member type scheme,
  `sstim:clockOriginSeconds` and `sstim:hasTimingAuthority`, placed by
  `sstim:sessionClockOffsetSeconds` — which a during-session self-report also
  carries, since it is the same measurement against the same clock. Ordering
  lives in the offset, never in statement order. This is the term set the HED event
  profile needs — before it, SSTIM could not say that anything occurred during a
  session.
- **Delivered versus elapsed duration**: `sstim:deliveredDurationSeconds`, with
  a SHACL-SPARQL constraint holding delivered ≤ elapsed. A session paused for ten
  minutes and one that ran ten minutes shorter are no longer indistinguishable.
- **Reproducibility and integrity metadata**:
  `sstim:hasReproducibilityLevel` over identical-rendering /
  equivalent-signal / equivalent-presentation, plus
  `sstim:configurationDigest` and `sstim:digestAlgorithm`, which SHACL-SPARQL
  requires together.
- **Qualified participant observations** (closes KR-03):
  `sstim:ParticipantObservation` with a required six-value response state, so
  "none reported", "not asked" and "declined" stop collapsing into one silence;
  `sstim:UnwantedExperienceObservation` with category, participant-reported
  severity, onset, persistence, action, resolution and participant-perceived
  relatedness; `sstim:ObservationInstrument` with `sstim:instrumentVersion`;
  scale bounds, anchor labels, prompt identity and reported confidence. Nine new
  controlled schemes, 57 concepts, all four languages.
- `sstim-v:reportDuringSession` — the fourth self-report phase. A during-session
  report previously had no phase and could not be represented at all.
- A second Full competency question and its positive fixture, covering the
  execution timeline: *what happened, in what order, on which clock, and did it
  run to completion?* A term set with no executable demonstration is a claim
  rather than a contract, and `make core-profile-contract` now runs this one
  against its own fixture.

### Changed

- `sstim:SelfReport`'s definition and `sstim-sh:SelfReportShape`'s message: a
  report is a collection event whose content is qualified observations, and the
  shape now accepts either those or the five legacy scalars. The scalars remain
  valid as documented simple projections, so no existing report became
  non-conformant.
- `make full-equivalence` now asserts 0.12 **compatibility** rather than
  isomorphism: every baseline triple must survive, deliberate changes must be
  recorded as exceptions, and additions are counted rather than rejected. The
  old test conflated "identical" with "compatible", which held only while the
  ontology was forbidden to grow.
- Re-audited the live Wikidata technique mappings: added a conservative
  `skos:closeMatch` from `sstim-v:techMonauralBeats` to Q6898437 and weakened
  `sstim-v:techBinauralBeats` from `skos:exactMatch` to `skos:relatedMatch`
  because Q863539 also represents a perceptual phenomenon and music genre.
- Corrected the VoID sidecar's modification date and its description of the
  primary Turtle distribution. No released `0.13.0` artifact was changed.

### Fixed

- The session projection rounded elapsed time to nearest, which could place
  `sstim:actualDurationSeconds` below `sstim:deliveredDurationSeconds` and
  violate the delivered ≤ elapsed constraint on correct data. Elapsed is now
  rounded up.
- A `supplied` stated goal whose free text was withheld projected as an
  observation carrying no value — an answer claiming the participant said
  nothing. It is now withheld whole.
- The projection refuses to resolve a controlled value the vocabulary does not
  declare, instead of minting `sstim-v:undefined` from an unguarded lookup.
- Event wall clocks use `prov:startedAtTime` rather than `prov:atTime`, whose
  domain is `prov:InstantaneousEvent` and not `prov:Activity`.
- `make shacl-session-projection` validates the RDF the projection actually
  emits, with SHACL-SPARQL active — the blind spot the first two defects hid in,
  since `rdf-validate-shacl` strips `sh:sparql` and `shacl-instances` only
  covers committed files.
- The recorder no longer invents a `playback-resume` when a session is closed
  while paused. It settled the accounting by emitting an event that never
  happened, into a timeline whose purpose is recording what did.
- The closing event is placed at the duration `close()` records, rather than at
  a clock re-read a moment later, which left a timeline running past its own
  session.
- The projection refuses a bundle whose records share an identifier. RDF has no
  duplicate subjects: two records sharing an id merge into one node holding both
  records' facts, which SHACL then reports as a cardinality violation pointing
  nowhere near the cause.
- A report's engine-clock offset is required for during-session reports and
  refused for the others, so a report collected before or after the session
  cannot carry a fabricated placement on a clock it never ran on.

## [0.13.0] - 2026-08-04

Published under version DOI `10.5281/zenodo.21792692`, with
`10.5281/zenodo.21286974` retained as the all-versions concept DOI.

The modular release. Everything below was previously listed as unreleased; the
architecture is now frozen, citable, and served from the persistent namespace.

### Changed

- **The ontology is now a set of modules behind named profiles, not one root
  file.** `sstim-core.ttl` was a catch-all mixing stimulation, techniques,
  protocols, neuromodulation, evidence, configuration, sessions, caution
  metadata, and BSC voice terms. Its 385 declared terms are redistributed across
  18 manifest-owned modules, each with one authoritative source, one ontology
  IRI, and a declared direct dependency set. **No term was added, removed, or
  renamed** — 385 declared terms before and after — and the Full union preserves
  0.12.0 semantics at 9,977 normalized triples, verified by
  `make full-equivalence`. `sstim-core.ttl` is now the dependency-free Kernel:
  `sstim:Stimulation` and `sstim:SensoryStimulation`, and nothing else. See
  [ADR 0043](docs/decisions/0043-sstim-core-profile-and-module-boundaries.md)
  and the [module architecture guide](docs/ontology/MODULE_ARCHITECTURE.md).
- **`sstim-ex:StimulusChannel` keeps its IRI but changes owner and definition.**
  Its authoritative declaration moves from Exposure to Stimulus so the Core
  Profile does not depend on the optional Exposure concern, and its definition
  broadens from "a channel within an exposure profile" to cover a stimulus
  specification as well. Existing exposure channels retain their meaning; the
  public IRI is unchanged, and `https://w3id.org/sstim/exposure` now serves a
  Stimulus + Exposure namespace catalogue so the IRI still dereferences to its
  declaration. See [ADR 0044](docs/decisions/0044-stimulus-channel-core-ownership.md).
- **`sstim:hasStimulationTarget` declares no domain in Core.** Its
  `StimulusSpecification`/`SessionSpecification` union domain moves intact to
  the Session module, so Core does not depend on Session. Session and Full
  restore exactly the 0.12.0 inference. The union stays one RDF list: several
  `rdfs:domain` statements would intersect rather than union.

### Added

- **Four profile entry points** — Kernel, Core, Core Plus, and Full — each a
  W3C Profiles Vocabulary `prof:Profile` with an exact semantic closure, an
  explicitly associated SHACL closure, and a declared inference mode. A
  consumer can now implement a bounded contract instead of the whole graph.
- **`manifest.json` and `manifest.schema.json`** as the authoritative bill of
  materials. The Makefile, loader, exporter, snapshotter, and release checks
  derive their inventories from it rather than repeating hand-maintained lists.
- **Distinct retrieval endpoints** where a namespace IRI is not a single
  module: `https://w3id.org/sstim/kernel` for the Kernel and
  `https://w3id.org/sstim/module/exposure` for Exposure. `/sstim` and
  `/sstim/exposure` serve generated namespace catalogues for hash-term
  dereference and are not import endpoints.
- **A reusable weak Core SHACL package** (`sstim-core-shapes.ttl`) alongside the
  retained Full aggregate, with a positive fixture and an executable contract
  proving Core accepts a determinate stimulus without Full delivery, placement,
  modality, or safety policy leaking into its validation.
- Two Full property shapes, `sstim-sh:StimulusSpecificationChannelLinkShape` and
  `sstim-sh:StimulusSpecificationTargetLinkShape`, hardening the optional
  channel and target links under inference mode `none` (ADR 0044).

### Release engineering

- **The version IRI resolves to the whole release, not to one file.** `make
  snapshot` now freezes a namespace catalogue beside the modules, because
  `sstim-core.ttl` stopped being the whole ontology when it became the Kernel.
  The route generator refuses to emit a bare-version route for a modular
  snapshot that lacks one.
- **Every profile carries an executed conformance contract** — a positive
  fixture and a SPARQL competency query, plus out-of-scope and adversarial
  fixtures wherever a SHACL closure exists to give those categories meaning
  ([ADR 0045](docs/decisions/0045-shapeless-profiles-are-discovery-entry-points.md)).
- **`void.ttl` describes the release it names.** The quality audit now derives
  its module set from the frozen manifest, so a catalogue is never counted as a
  module, and every frozen module must have a subset that distributes it.
- **New guards** for divided `rdfs:domain`/`rdfs:range` axioms, unpublishable
  w3id redirect targets, and Turtle prose being parsed as an axiom.

### Fixed

- **Release dates are now part of the release gate.** `make snapshot` refuses a
  snapshot unless every module header declares `dct:issued` = `dct:modified` =
  the release date (today, or `RELEASE_DATE=YYYY-MM-DD`), with `dct:created`
  no later. `dct:issued` had never been bumped past the ontology's first issue
  date, so registries that read it as the version release date reported every
  version as released on 2026-04-12 — visible as BioPortal's **Released** column
  across all eight SSTIM submissions, corrected there by hand on 2026-07-27.
  Metadata and tooling only; no term changed. See
  [`static/ontology/README.md`](static/ontology/README.md#versioning-and-publication).

  **Correction recorded 2026-08-31:** the display and manual corrections above
  are historical facts, but attributing BioPortal's value to `dct:issued` was
  not justified. Those submissions carried the same 2026-04-12 value for
  `dct:created` and `dct:issued`, so they could not reveal which predicate won.
  The current NCBO mapping and later 0.16.0 submissions establish that BioPortal
  prefers `dct:created`. The release gate remains necessary because
  `dct:issued` is still SSTIM's formal version date.

## [0.12.0] - 2026-07-31

Published under version DOI `10.5281/zenodo.21717988`, with
`10.5281/zenodo.21286974` retained as the all-versions concept DOI.

Description-layer release ([ADR 0041](docs/decisions/0041-stimulus-description-layers-and-the-canonical-schema-gap.md),
[ADR 0042](docs/decisions/0042-stimulus-specification.md)).

### Added

- Added `sstim-stimulus.ttl`, the eighth release module, with
  `sstim:StimulusSpecification`, the determinate/stochastic/adaptive regime,
  engine-independent channel quantities, and the optional stimulation-target
  axis.
- Added session-level track disabling, master brightness, and scheduled-start
  properties pending the broader core/module extraction.

### Changed

- Redefined `sstim:Preset` as an engine-dependent configuration rather than the
  stimulation itself; stimulus specifications are the cross-engine comparison
  layer.
- Retained generic `Track` and its four subtypes, asserted `Voice` below
  `AudioTrack`, and renamed Patch Studio's control concepts to LFO and
  Permutation in its persisted model.

### Removed

- Withdrew the three-day-old `sstim:Patch` class before downstream adoption;
  `Preset` covers the generic engine-configuration role.

## [0.11.0] - 2026-07-24

Published under version DOI `10.5281/zenodo.21536124`, with
`10.5281/zenodo.21286974` retained as the all-versions concept DOI.

Gate A (release integrity) + Gate B (semantic stabilization) of the
[2026-07-24 RDF structure and publication audit](docs/ontology/reviews/2026-07-24-rdf-structure-and-publication-audit.md).
Additive and backward-compatible: no term removed; the only narrowing
(`sstim:SelfDirectedNeuromodulation`, see below) had zero instance-level blast
radius. Targets `0.11.0` — bumped from a MINOR, not a patch, because Gate B
adds real new classes and properties on top of Gate A's metadata-only fixes.

### Fixed (Gate A — release integrity)
- The frozen `0.8.0`-`0.10.0` snapshots each self-cite the `v0.7.0` Zenodo DOI
  (`10.5281/zenodo.21380171`) and citation string instead of their own version
  DOI (RDF-01). Removed the stale `dct:hasVersion` / `dct:bibliographicCitation`
  from `sstim-core.ttl` and `void.ttl` pending this version's Zenodo DOI
  reservation (the `0.5.0` release shipped under the same
  no-version-DOI-at-freeze-time precedent).
- Fixed the `v0.10.0` history entry's leftover "under development" qualifier
  against its own `mod:status "released"`.
- Synchronized every module's `owl:versionInfo` and header `# Version:` /
  `# Date:` comments (six modules still said `0.7.0`).
- Fixed `void.ttl`'s stale `dct:modified` date and `void:triples`/`void:classes`/
  `void:properties` counts (updated again after Gate B's new terms).
- Fixed the repository-root `README.md`'s stale ontology-graph counts
  (105/14/214/369/43 → 134/18/231/445/50) and protocol count (12 → 9).
- Removed the `"@type": "@id"` coercion on `dcat:distribution` in
  `context.jsonld` (RDF-02): it silently dropped all 96 triples describing
  `void.ttl`'s blank-node distributions when compacted with RDFLib.

### Fixed (Gate B — semantic stabilization, [ADR 0037](docs/decisions/0037-self-regulation-genus-and-sensory-neurostimulation-branch.md))
- `sstim:SelfDirectedNeuromodulation` contradicted its own inherited genus
  (`sstim:Stimulation` requires an applied input; the class's own definition
  included practices with none) (RDF-04). Added `sstim:DeliberateSelfRegulation`
  as the neutral genus above no-applied-stimulus practices (unguided
  meditation, volitional breathwork); narrowed `SelfDirectedNeuromodulation`
  to stimulus-mediated cases only (neurofeedback, biofeedback,
  paced-breathing guidance).
- The sensory branch of `sstim:Neurostimulation` was named in prose but never
  asserted in the class hierarchy, so neurostimulation-hierarchy queries
  silently excluded sensory examples (RDF-05). Added
  `sstim:SensoryNeurostimulation` / `sstim:SensoryNeurostimulationTechnique`
  as the intersection of `Neurostimulation` and `SensoryRouteNeuromodulation`
  (not a blanket subclass axiom, so self-directed sensory-route cases like
  sonification biofeedback correctly stay excluded); retyped
  `sstim-v:techGamma40Auditory` accordingly.
- Documented (not restructured) the decision to keep `sstim-v:techBiofeedback`
  a broad, neutral technique rather than split it into narrower
  neural/peripheral variants, since the neural-modulation objective is not
  equally definitional across its autonomic/muscular/electrodermal forms.
- Three `sstim-exposure.ttl` properties (`hasBodyPlacement`,
  `hasPerceptualGain`, `hasPerceptualLoss`, `hasExposureLimit`) had an RDFS
  domain narrower than their own definitions documented; widened to accurate
  union domains (RDF-09).
- Removed two duplicate scheme definitions (`StimulusTemporalStructureScheme`,
  `TechniqueScheme` — the latter's second definition was stale and
  sensory-only) and fixed the stale Sensory Field SHACL test preamble comment
  that still described the export as non-conformant (RDF-15).
- Completed the `EvidenceModalityScheme`/`EvidenceModalityTag` deprecation:
  the scheme and its nine concept values stayed active while the class and
  property were already deprecated (RDF-13); all now carry `owl:deprecated
  true` and point to the replacement basis-axis properties.
- `sstim:targetsFrequencyBand`'s "first entry is primary" claim doesn't hold —
  RDF property values are unordered (RDF-08, concrete sub-bug only). Added
  `sstim:primaryFrequencyBand`, a functional sub-property, with a SHACL-SPARQL
  constraint requiring it to be one of the preset's own `targetsFrequencyBand`
  values. The larger RDF-08 finding (oscillation-band vs. stimulus-target vs.
  outcome-hypothesis conflation) is deferred — see `FrequencyBandScheme`'s
  `skos:editorialNote`.
- Re-audited the five frequency-band-to-Wikidata `skos:exactMatch` mappings
  (RDF-17): downgraded to `skos:closeMatch`, since each Wikidata item is the
  observed-EEG-oscillation sense while SSTIM's bands are also used, unsplit,
  as stimulus-frequency targets — extensional identity can't be claimed at
  `exactMatch`'s confidence until RDF-08's split lands.
- Added the missing `bfo:0000016` ("disposition") display-label stub, used by
  `sstim:Neuroplasticity` (RDF-17).

### Added
- `sstim:DeliberateSelfRegulation`, `sstim:SensoryNeurostimulation`,
  `sstim:SensoryNeurostimulationTechnique`, `sstim:primaryFrequencyBand`.
- `scripts/context-roundtrip-check.py` + `make context-roundtrip`: round-trips
  every top-level and instance document through the *published*
  `context.jsonld` (not RDFLib's auto-generated one), wired into
  `make validate`.
- `scripts/verify-snapshot-checksums.mjs` + `make verify-snapshots`:
  checksums every recorded `static/ontology/<version>/` snapshot against
  `static/ontology/snapshot-checksums.json` and fails on drift; every future
  `make snapshot` records its own checksums automatically. Wired into
  `make validate`.
- The GitHub Pages workflow now runs `make test` (the full Vitest suite)
  before publishing, not only `make validate` (RDF-11): the runtime SHACL
  goldens and ecosystem-contract tests previously ran only in the independent
  lint workflow, so Pages could publish while one of them failed.

### Still open (this pass does not do this)
- An erratum still needs to be published against the already-archived
  `0.8.0`-`0.10.0` Zenodo records noting their self-citation defect; that
  content cannot be corrected in place.
- The whole-set version-manifest/checksums for a *dereferenceable* frozen
  closure (RDF-03, beyond the checksum ledger) and RDF-06/07/08 (full
  split)/10/14/16/18/19 are separate, larger gates and are not part of this
  pass.

## [0.10.0] - 2026-07-24

Published under version DOI `10.5281/zenodo.21528717`, with
`10.5281/zenodo.21286974` retained as the all-versions concept DOI.

Participant engagement and neurostimulation release
([ADR 0035](docs/decisions/0035-participant-engagement-mode-and-endogenous-self-regulation.md),
[ADR 0036](docs/decisions/0036-neurostimulation-neuromodulation-senses-and-self-directed-split.md)),
from the 2026-07-22 Dr. Theo Marins (University of Graz) interview on
neuromodulation. Additive; no term removed or renamed. Frozen `0.3.0`–`0.9.0`
snapshots are untouched.

### Added
- Participant-engagement-mode facet: `sstim:ParticipantEngagementMode` class,
  `sstim:participantEngagementMode` property, and a three-concept scheme
  (passive-receptive / guided-following / active-self-regulatory) — a sixth axis
  orthogonal to the five ADR 0034 facets.
- `sstim:Neurostimulation` (the stimulation-based branch of interventional
  neuromodulation) and the browsable `sstim:NeurostimulationTechnique`, with the
  seven energy techniques (rTMS, tDCS, tACS, DBS, VNS, ECT, focused-ultrasound)
  typed under it; the self-directed / interventional split
  (`sstim:SelfDirectedNeuromodulation`, `sstim:InterventionalNeuromodulation`);
  and `sstim:Neuroplasticity` as a `bfo:disposition` stub.
- `sstim-v:techElectroconvulsiveTherapy` in the non-sensory contrast set;
  `sstim-v:techNeurofeedback` and `sstim-v:techBiofeedback` as self-directed
  neuromodulation techniques.
- `sstim-v:NeuromodulatoryEffectCollection` naming the effect sense of
  neuromodulation over the outcome-phenomenon facet; invasive /
  minimally-invasive / non-invasive SKOS collections over the delivery-approach
  values.

### Changed
- `sstim:Neuromodulation` scope refined: pinned to the intervention sense
  (distinct from the physiological effect sense), excluding spontaneous
  physiological neurotransmitter-level modulation but admitting deliberate
  self-directed neuromodulation. `skos:note`s on `sstim:Neuromodulation` and
  `sstim:Neurostimulation` spell out the intervention-vs-effect and
  with-vs-without-participant-engagement axes.
- `sstim-v:techNeurofeedback` and `sstim-v:techBiofeedback` re-typed from the
  neutral `sstim:StimulationTechnique` layer to `sstim:NeuromodulationTechnique`.

## [0.9.0] - 2026-07-22

Published under version DOI `10.5281/zenodo.21493918`, with
`10.5281/zenodo.21286974` retained as the all-versions concept DOI.

Stimulation and neuromodulation release ([ADR 0034](docs/decisions/0034-neuromodulation-relation-and-neural-target-axis.md)).
SSTIM gains a neutral stimulation layer and formalizes how sensory stimulation
relates to neuromodulation: the two **overlap**, and neither subsumes the other.
Subsuming sensory stimulation under neuromodulation would assert neural
modulation for every delivery instance, smuggling a mechanism claim into a class
defined as delivery-only and bypassing the evidence layer.

**Breaking on mutable latest**, for consumers of the retyped focused-ultrasound
technique and the five deprecated response-as-mechanism IRIs. Frozen `0.3.0`–
`0.8.0` snapshots are untouched and retain their published entailments.

### Added
- Neutral `sstim:Stimulation` umbrella and `sstim:Neuromodulation` sibling at the
  process, intervention, technique, and protocol layers, with the overlap named
  at each layer as a defined `owl:intersectionOf` class requiring an intended
  canonical sensory-transduction route.
- Five orthogonal facet axes — neural access route, delivery approach, neural
  target site, neural system, and neural phenomenon — as 56 new multilingual SKOS
  concepts across five schemes, plus 13 facet properties. Kept separate because a
  route, a dynamic, a system, and an outcome domain are not values on one scale;
  one value set is reused across intended, proposed-mechanism, and
  observed-outcome roles by distinct properties.
- Six non-sensory neuromodulation techniques — rTMS, tDCS, tACS, DBS, vagus nerve
  stimulation, and targeted intrathecal delivery — populating three distinct
  routes so the route axis is exercised rather than single-valued. None is
  referenced by any BSC preset, framework, protocol, or implementation; inclusion
  asserts neither BSC Lab capability, nor efficacy, nor safety.
- `sstim-ex:characteristicDeliveryMedium`, a delivery-medium hierarchy including
  applied electric current, electric field, magnetic field, focused ultrasound,
  and chemical/pharmacological agents, and a stimulus channel-role facet that
  separates an intended causal channel from a concomitant one.
- Six stimulus temporal structures for continuous, single-event, pulse-train,
  scheduled, bolus, and infusion timing.
- "Stimulation" and "Neuromodulation" graph perspectives, driven by a general
  facet matcher in the navigator rather than by a `skos:Collection` minted in the
  vocabulary: a UI view is not a citable domain category.

### Changed
- `techUltrasoundNeuromod` is retyped onto `sstim:NeuromodulationTechnique`, off
  the sensory hierarchy, and defined by its intended focused neural target rather
  than by the categorical absence of an audible percept.
- `techGamma40Auditory` is narrowed so gamma-oscillation modulation is
  definitional, then dual-typed into the sensory-route overlap. Broad techniques
  such as `techPhoticDriving` deliberately stay sensory-only: a use-level
  intention is not promoted into a universal property.
- `TechniqueScheme` is relabelled "SSTIM Stimulation Technique Vocabulary". Its
  IRI was never sensory-scoped, so only the label had been narrower than its own
  identifier.
- Shared domains and ranges widen to the neutral parents so a non-sensory
  technique can be the subject of a conformant evidence assessment.
  `definedByFramework` moves to the general OBI protocol class so a
  capability-boundary or baseline protocol can be framework-authored without
  becoming stimulation.
- `sstim-ex:ExploratoryProtocol` no longer inherits a stimulation type. Seven
  exploratory protocols now declare `SensoryStimulationProtocol` explicitly;
  three — a silence/darkness baseline, a mere-exposure field hypothesis, and a
  capability-boundary document — deliberately do not.
- `make shacl-vocab` validates the core+vocabulary+exposure closure, since
  technique identity is vocabulary-owned while characteristic media are
  exposure-owned and a cycle would otherwise be required.

### Removed
- The SHACL escape hatch in which any `skos:editorialNote` suppressed a
  technique's mechanism, temporal-structure, and modality requirements. Free text
  must not control structural conformance. The five notes remain as annotations.
  `TechniqueShape` keeps its published IRI, retargeted to the neutral technique
  class and composed with six disjointly-targeted shapes.

### Deprecated
- `mechFFR`, `mechASSR`, `mechSSVEP`, `mechSSSEP`, and `mechStartle` denoted
  evoked responses and a reflex, not causal mechanisms. Each keeps its IRI as a
  tombstone with `dct:isReplacedBy` and is stripped of its
  `StimulationMechanism`/`skos:Concept` typing and scheme topology — deprecation
  alone would have preserved the false entailment. Seven replacement neural
  phenomenon concepts are minted.

## [0.8.0] - 2026-07-20

Framework-scope release. `sstim:definesTechnique` on the BSC framework is now
reserved for the three techniques BSC actually originated; four framework-scoped
duplicates of vendor-neutral vocabulary concepts are retired in favor of the
new `sstim:incorporatesTechnique` relation (ADR 0033). No previously released
term was removed from `sstim-core.ttl`, `sstim-vocab.ttl`, or `sstim-shapes.ttl`;
the retirements are confined to the `framework/bsc/technique/` instance IRIs,
which never resolved through w3id in any prior release.

### Added
- Published SSTIM `v0.8.0` under version DOI `10.5281/zenodo.21462727`, retaining
  `10.5281/zenodo.21286974` as the all-versions concept DOI.
- `sstim:incorporatesTechnique` (ADR 0033): links a `SensoryStimulationFramework`
  to a pre-existing, vendor-neutral technique it applies without redefining.
  Additive — does not narrow or replace `sstim:definesTechnique`.
- w3id routes for all seven BSC framework technique IRIs (three originated, four
  retired), each an exact rule rather than a prefix wildcard, audited fail-closed
  by the quality-audit route checker. Previously no technique IRI under
  `framework/bsc/technique/` resolved at all.

### Changed
- `bsc-fw-tech:binaural-beat-stimulation`, `photic-rhythm-stimulation`,
  `audiovisual-rhythm-coordination`, and `vibrotactile-rhythm-stimulation` are
  retired from `sstim:definesTechnique` on the BSC framework and re-expressed as
  `sstim:incorporatesTechnique` over their existing vocabulary counterparts
  (`sstim-v:techBinauralBeats`, `techPhoticDriving`, `techAudiovisualEntrainment`,
  `techVibrotactileEntrainment`) — each already `skos:relatedMatch`-linked from
  the retired term, so no relation is newly asserted, only relocated onto the
  released IRI. `bsc-reference-protocols.ttl` follows the same substitution.

## [0.7.0] - 2026-07-15

Evidence- and ecosystem-governance release. No public term IRI was removed, but
legacy flattened evidence and ecosystem properties are deprecated and rejected
for newly authored conforming data. Consumers should follow the ADR 0027 and
ADR 0031 migration notes. All committed ecosystem agent records are synthetic;
the mutable external store required for real live-only records remains a
post-release F3 gate.

### Added
- Published SSTIM `v0.7.0` under version DOI `10.5281/zenodo.21380171`, retaining
  `10.5281/zenodo.21286974` as the all-versions concept DOI.
- `rdfs:seeAlso` from the core ontology node to the generated WIDOCO reference
  documentation (`https://labiosyncare.github.io/ontology/docs/`), so
  harvesters that read ontology metadata (e.g. LOV) discover the documentation
  (ADR 0023).
- Evidence-assessment contract (ADR 0027): immutable assessment revisions,
  atomic bounded propositions, explicit scope axes, qualified evidence bases,
  source/search governance, PROV assessment and review activities, conflict and
  independence records, and orthogonal controlled values for modality, study
  design/model, synthesis type, outcomes, and scope missingness.
- `sstim-ecosystem` module (ADRs 0024 and 0031): neutral ecosystem agents,
  qualified agent-target relationships, ORG memberships, implementation
  responsibility, purpose-scoped engagement activities, and controlled
  relationship/purpose/outcome vocabularies.
- Closed SHACL publication profiles for evidence and ecosystem records,
  including the separate reusable private-audit shape file, public/private
  predicate boundaries, lifecycle ordering, terminal deletion, and
  current-state projection rules.
- Synthetic ecosystem fixtures demonstrating one person with multiple
  memberships and implementation relationships without cross-association,
  together with an executable admission harness, JSON-LD round-trip checks,
  46 adversarial SHACL fixtures, and 11 runtime loader/graph tests.
- Ecosystem named-graph, VoID, loader/context, quality-audit, Pages validation,
  and staged w3id plumbing. Real live-only records are expressly excluded from
  the Zenodo-tracked release repository.

### Changed
- Deprecated the overloaded `EvidenceModalityTag`, mutable review/status fields,
  directionally misleading `supportsRelation`, and other flattened evidence
  properties. A non-authoritative 0.7 compatibility export remains available;
  authorization and validation use only the new contract.
- Migrated the public evidence fixtures and runtime exporter to qualified bases,
  explicit propositions/scopes, immutable provenance, identified agents, and
  review decisions. Universal evidence-absence claims are forbidden; scoped
  search findings require a reproducible search record.
- Replaced the initial flat ecosystem surface with qualified relationship,
  membership, implementation-responsibility, and engagement records. Public
  data is an approved retractable current-state projection; negative,
  disputed, amended, removed, and consent-evidence history belongs to an
  access-controlled external ledger.
- Made runtime Web Annotation serialization valid and private by default, and
  tightened JSON-LD coercion, namespace parity, per-artifact validation,
  release-version consistency, and snapshot refusal checks.
- Clarified that `make snapshot` freezes only the seven ontology modules while
  a GitHub–Zenodo release archives the complete repository state at its tag.
  Real mutable ecosystem records must therefore be served outside this
  release repository.

### Fixed
- Prevented public/private RDF leakage through nested or untyped auxiliary
  nodes, ambiguous parallel consent/relationship values, orphan terminal
  records, and mismatched public/private activity mirrors.
- Removed unqualified universal-absence language and separated source-observed
  results from SSTIM's assessment direction and public wording decisions.

## [0.6.0] - 2026-07-11

Semantic-quality and FAIR-metadata release. No SSTIM term IRI was removed or
renamed, but corrected superclass axioms change some inferred types; consumers
that depend on the pre-0.6 upper model should review ADR 0021. The release was
accepted through maintainer-guided review and automated external validation;
independent human ontology review is explicitly deferred by ADR 0022.

### Added
- Complete module-level ontology metadata for all six editable SSTIM modules,
  including titles, descriptions, creators, licenses, dependencies, development
  version identifiers, and change-history notes.
- Structured caution governance: an ordered severity vocabulary plus trigger
  condition, affected population, recommended action, and display priority for
  every public caution tag.
- Self-report phases and an explicitly synthetic reference session with
  pre-session and immediate post-session observations; no personal data is
  included.
- Two non-clinical BSC Lab reference protocols, three additional framework
  technique records, and protocol/safety/public-claim links for both public
  reference presets.
- Reviewed evidence records and public-safe references for paced breathing,
  SSVEP, SSSEP, and multisensory integration, with claim-level PROV attribution
  and review dates.
- Repository-wide RDF quality and competency checks
  (`scripts/sstim-quality-audit.py` and the expanded
  `scripts/sstim-exposure-sanity.mjs`) covering metadata, SKOS integrity,
  functional-value collisions, evidence provenance, cautions, protocol/preset
  paths, sessions, loader coverage, dangling IRIs, and VoID counts.
- Graph-isomorphic export verification for every generated JSON-LD and RDF/XML
  module serialization, included in `make validate` and CI.
- SHACL contracts for module metadata, evidence provenance, protocols,
  implementations, caution severity, self-report phases, exposure profiles,
  unique SKOS notation, hierarchy inverses, and cycle prevention.
- VoID + DCAT dataset description (`static/ontology/void.ttl`) for FAIR
  publication: one `void:Dataset` with per-module subsets and Turtle/JSON-LD/
  RDF-XML distributions, checked whole-set counts, a public-instance subset,
  `void:uriSpace`, vocabularies used, and example resources. Added a
  `void:inDataset` back-link on the ontology node so registries discover it.
  Staged the `/sstim/void` w3id route. (PUBLICATION plan B3)
- Staged JSON-LD / RDF-XML content-negotiation for core and every module in the
  w3id `.htaccess` (`Accept: application/ld+json` → `.jsonld`, `application/rdf+xml`
  → `.rdf`, else Turtle). Goes live via the next `main` deploy plus a
  perma-id/w3id.org PR. (PUBLICATION plan B2)
- Expanded `static/ontology/context.jsonld` for the post-0.5.0/P6 public surface:
  evidence and public-claim governance terms, Patch Studio voice/session
  parameters, exposure-module predicates, implementation-data prefixes, and
  VoID/DCAT metadata aliases. (PUBLICATION plan B4)
- Added ROBOT/HermiT OWL DL consistency validation (`make reason`) over the
  merged ontology term-space modules, wired into `make validate` and the RDF CI
  workflow. (PUBLICATION plan B3)
- Enabled GitHub↔Zenodo release archiving and published SSTIM `v0.5.0` under
  version DOI `10.5281/zenodo.21286975` and all-versions concept DOI
  `10.5281/zenodo.21286974`. Added the DOI links to the ontology and VoID/DCAT
  metadata, citation guidance, and JSON-LD context. (PUBLICATION plan B5)
- Published SSTIM `v0.6.0` under version DOI `10.5281/zenodo.21302910`, retaining
  `10.5281/zenodo.21286974` as the all-versions concept DOI.
- Reassessed the deployed canonical URI with FOOPS at 87.5%; all minimum
  metadata and version-IRI checks pass, leaving only registry-dependent checks.
- Added the 2026-07-10 external automated review disposition, covering OOPS,
  FOOPS, OLS/OBO identifier checks, and authoritative safety-source checks.
- Recorded the `0.6.0` review posture in
  [ADR 0022](docs/decisions/0022-0.6-release-review-posture.md): maintainer
  acceptance is sufficient for this release, with independent human review
  deferred and no claim of independent sign-off.

### Changed
- Finalized all six ontology modules as `0.6.0`; the core identifies the
  immutable whole-set release as `https://w3id.org/sstim/0.6.0`, while the
  other modules carry synchronized `owl:versionInfo` under ADR 0020.
- Reclassified sensory modality, stimulation mechanism, and intended effect as
  information-content categories rather than biological processes, roles, or
  dispositions. Session specifications are PROV plans, session executions are
  PROV activities, and implementations are PROV entities.
  ([ADR 0021](docs/decisions/0021-controlled-value-semantics.md))
- Added operational definitions to all previously undocumented public
  properties, concept schemes, and exposure concepts, including explicit
  measurement-dimension wording for exposure effects.
- Materialized SKOS `hasTopConcept`/`topConceptOf` and
  `broader`/`narrower` inverse navigation throughout the live vocabulary.
- Strengthened every evidence record with modality, direction, review status,
  review date, modification date, subject, and responsible-agent provenance;
  exploratory exposure claims are explicitly speculative, inconclusive, and
  provisional.
- Narrowed external alignment scope: whole-domain brainwave-entrainment and
  therapy mappings were removed, the binaural voice relation was weakened to
  `skos:relatedMatch`, and multisensory integration gained a verified related
  mapping.
- Expanded the RDF loader and JSON-LD context to cover protocols, both public
  presets, synthetic sessions, safety terms, and PROV metadata.
- Restricted the OBI protocol alignment to `SensoryStimulationProtocol`;
  `SensoryStimulationTechnique` is now an IAO information-content category.
- Clarified `derivedFrom` as an asymmetric, irreflexive immediate-predecessor
  relation rather than a symmetric or transitive preset relation.
- Completed publisher/issued metadata for every module and added citation,
  DOI, status, source, and logo metadata to the core ontology.

### Fixed
- Removed the stale MeSH `D012910` candidate mapping after authoritative NLM
  verification showed that the identifier denotes *Snake Venoms*, not sensory
  stimulation.
- Removed an unverified Music Ontology association and corrected overly broad
  upper-ontology assertions on controlled-value classes.
- Included the previously omitted theta breathing preset in the runtime RDF
  loader.
- Replaced hand-maintained/omitted VoID metrics with counts checked by the
  repository quality audit.
- Fixed the ROBOT reasoning Make target so a missing executable or failed
  reasoner command exits nonzero instead of printing a false success message.
- Removed obsolete `OBI_0000011` from live planned-process axioms; retained
  active `COB_0000082` for sensory stimulation interventions.
- Added the missing `dct:Standard` range on `conformsToStandard`, updated the
  WCAG and NIOSH references, and attributed the 30 J/m2 ultraviolet limit to
  ICNIRP while retaining IEC 62471 for lamp risk classification.
- Rewrote the core domain description and `SensoryStimulation` definition so
  delivery, proposed mechanisms, observed responses, and outcomes are not
  conflated.

## [0.5.0] — 2026-07-09

Domain-content coverage (IMPROVEMENT_PLAN P5) and evidence-integrity governance
(P7). Additive and backward-compatible — no terms removed or renamed. The exposure
module is released at 0.4.1 within this whole-set snapshot.

### Added
- Visual, tactile, and cross-modal technique concepts (photic/flicker driving,
  audiovisual entrainment, colour-field stimulation, vibrotactile and
  audio-tactile entrainment) and the steady-state evoked-potential mechanism
  family — SSVEP, SSSEP, and multisensory integration. ([ADR 0015](docs/decisions/0015-visual-and-cross-modal-techniques.md))
- Reference-pitch retuning (432 Hz etc.) as a `NonEntrainmentTechnique`, with
  carrier-pitch exposure properties and a carrier-vs-modulation evidence firewall.
  ([ADR 0017](docs/decisions/0017-reference-pitch-retuning.md))
- `VIS`, `TACTILE`, and `MULTISENSORY` evidence-modality tags (P5.6).
- `sstim:PublicClaimLevel` and the C0–C5 public-claim-level vocabulary, with a
  SHACL claim-legality constraint and a conditional-citation constraint
  (evidence tier ≥ 3 must cite a `PublicSafeReference`).
  ([ADR 0018](docs/decisions/0018-evidence-integrity-and-public-claim-governance.md))
- `owl:priorVersion` links on the core and exposure ontology nodes.
- First populated technique `EvidenceClaim` instances — ASSR and FFR as measurable
  responses, the mixed binaural-beat outcome, and the explicit chromotherapy /
  Solfeggio / 432 Hz negative assertions — plus two Crossref-audited references
  (`PICTON_2003`, `SKOE_KRAUS_2010`). (P5.4; instance data under
  `static/ontology/instances/`, not part of the versioned term-space.)

### Changed
- Modality nomenclature cleanup: narrowed the `modalitySomatosensory` label to
  "Somatosensory", adopted the convention **haptic = device / tactile = percept /
  somatosensory = superordinate channel / vibrotactile = mechanism**, and
  completed the `skos:closeMatch` bridge between the `sstim-v:` sensory-channel
  and `sstim-ex:` perceived-modality vocabularies for all six shared channels.
  ([ADR 0019](docs/decisions/0019-modality-nomenclature-cleanup.md))
- Corrected the `EvidenceModalityTag` definition string (it listed six values; the
  scheme has carried nine since the P5.6 additions).
- Exposure module 0.4.0 → 0.4.1 (additive: the closeMatch bridge and convention
  scope notes).
- Module versioning ([ADR 0020](docs/decisions/0020-whole-set-snapshot-versioning.md)):
  the whole-set snapshot (`static/ontology/<version>/`, identified by core
  `owl:versionIRI`) is the single citable unit. Removed the exposure module's
  independent `owl:versionIRI` / `owl:priorVersion` (they never dereferenced);
  modules now carry `owl:versionInfo` only, as a module-level change counter.

## [0.4.0] — 2026-06-18

The exposure & experiment module (`sstim-exposure.ttl`), separately versioned.

### Added
- Reusable exposure module separating physical delivery medium, perceived
  modality, device capability, body placement, comfort boundary, experiment
  context, effect claims, and knowledge status.
  ([ADR 0010](docs/decisions/0010-exposure-delivery-modality.md))
- Sensory Field quantitative stimulus properties (frequency, flicker rate, beat
  frequency, duty cycle, gain, phase), left/right laterality body placements, and
  the `ExposureLimit` class with optical/flicker/hearing safety boundaries citing
  external standards. ([ADR 0011](docs/decisions/0011-sensory-field-and-flash-safety.md))

## [0.3.0] — 2026-06

### Added
- `sstim-v:TechniqueScheme` — a vendor-neutral controlled vocabulary of auditory
  and cross-modal sensory-stimulation techniques — with seven new
  `StimulationMechanism` concepts (ASSR, auditory-motor coupling, closed-loop
  phase reinforcement, masking, vibrotactile mechanoreception, acoustic startle,
  ultrasonic neuromodulation) and the `sstim:techniqueModality` property. Two
  non-evidence-bearing folk techniques catalogued with explicit editorial notes.

## [0.2.0] — 2026-06

### Added
- `sstim:CautionTag`, `sstim:VoiceType`, and `sstim:PermutationFunction`
  classification classes and the `sstim:hasCautionTag` property; the
  `StimulusTemporalStructure` concept scheme; dual-typed caution, voice-type,
  permutation, and temporal-structure concepts; full it/pt/es `prefLabel`
  coverage; and external upper-ontology label stubs.

### Fixed
- **0.2.0 erratum:** corrected external alignment IRIs wrong since 0.1.0 — every
  Wikidata QID (all resolved to unrelated entities), the `EvidenceClaim` parent
  (`iao:0000001` → `iao:0000030`), the obsolete OBI planned-process parent (added
  `cob:0000082`), a non-existent ORCID (→ the verified `0000-0002-9699-629X`), and
  a dead repository link. No vocabulary terms changed.

## [0.1.0] — 2026-04

### Added
- Initial public release: OWL 2 DL class hierarchy, SKOS vocabulary, SHACL shapes,
  and external alignments. Vocabulary seeded from the BSC preset catalog v0.9.1.
  "Sensory Stimulation" adopted as the umbrella term over the coined
  "Sensory Harnessing".

[Unreleased]: https://github.com/laBioSynCare/laBioSynCare.github.io/compare/v0.16.0...HEAD
[0.16.0]: https://github.com/laBioSynCare/laBioSynCare.github.io/releases/tag/v0.16.0
[0.15.0]: https://github.com/laBioSynCare/laBioSynCare.github.io/releases/tag/v0.15.0
[0.14.0]: https://github.com/laBioSynCare/laBioSynCare.github.io/releases/tag/v0.14.0
[0.13.0]: https://github.com/laBioSynCare/laBioSynCare.github.io/releases/tag/v0.13.0
[0.12.0]: https://github.com/laBioSynCare/laBioSynCare.github.io/releases/tag/v0.12.0
[0.11.0]: https://github.com/laBioSynCare/laBioSynCare.github.io/releases/tag/v0.11.0
[0.10.0]: https://github.com/laBioSynCare/laBioSynCare.github.io/releases/tag/v0.10.0
[0.9.0]: https://github.com/laBioSynCare/laBioSynCare.github.io/releases/tag/v0.9.0
[0.8.0]: https://github.com/laBioSynCare/laBioSynCare.github.io/releases/tag/v0.8.0
[0.7.0]: https://github.com/laBioSynCare/laBioSynCare.github.io/releases/tag/v0.7.0
[0.6.0]: https://github.com/laBioSynCare/laBioSynCare.github.io/releases/tag/v0.6.0
[0.5.0]: https://github.com/laBioSynCare/laBioSynCare.github.io/releases/tag/v0.5.0
[0.3.0]: https://github.com/laBioSynCare/laBioSynCare.github.io/releases/tag/v0.3.0
[0.2.0]: https://github.com/laBioSynCare/laBioSynCare.github.io/releases/tag/v0.2.0
