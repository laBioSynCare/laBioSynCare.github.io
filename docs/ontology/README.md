# Ontology Planning and Review

Design reviews and forward plans for the Sensory Stimulation Ontology (SSTIM).

The ontology itself — sources, status, namespaces, modeling patterns, validation,
named graphs, release procedure, and extension checklist — is documented at
[`static/ontology/README.md`](../../static/ontology/README.md). Version facts
come from [`manifest.json`](../../static/ontology/manifest.json) and
[`void.ttl`](../../static/ontology/void.ttl); `make truth-audit` fails when prose
disagrees with them. Architecture decisions are in
[`docs/decisions/`](../decisions/README.md).

SSTIM is an OWL/SKOS model for sensory-stimulation techniques, delivery and
perception, protocols, presets, evidence assessments, cautions, sessions,
consent-dependent self-reports, and qualified ecosystem relationships. Its scope
is research, education, interoperability, and conservative non-clinical use.
Describing a protocol or claim does not establish efficacy.

## Plans

- [Current state and next steps](CURRENT_STATE.md) — maintained starting point:
  released versus development state, implemented profiles and semantic scope,
  validation evidence, known limits, and the recommended work sequence.
- [Term index](TERM_INDEX.md) — generated and CI-checked: every class,
  property and concept with its module and definition. The place to look
  before concluding SSTIM lacks a term.
- [Review, 2026-08-17](reviews/2026-08-17-ontology-vocabulary-and-data-review.md)
  — findings only, nothing fixed: 65% of properties and 75% of classes have no
  instance data, the 17 frequency bands carry no `skos:definition`, 17 notation
  collisions (three days old), `citesReference` is load-bearing and
  unconstrained, and one dangling IRI in published data.
- [Second pass, 2026-08-17](reviews/2026-08-17-second-pass.md) — incoherence
  rather than absence: 15 classes have committed data and no SHACL shape, 34 of
  63 schemes have zero non-English labels, duration datatypes disagree. Also
  records what came back clean.
- [Third pass, 2026-08-17](reviews/2026-08-17-third-pass.md) — soundness and
  duplication, mostly in the four-day-old signal layer: rendering presence is
  derivable from mechanism and only 2 of 5 cases are constrained, two unrelated
  carrier properties, band-interval relations with no constraints at all.
- [Fourth pass, 2026-08-17](reviews/2026-08-17-fourth-pass.md) — what produces
  and what verifies the ontology: the CLAUDE.md §5.5 named-graph invariant has
  no test at all, four of six runtime RDF emitters are unverified, and phase 0.1
  carries a finding recorded as closed on partial evidence.
- [Design directions](SSTIM_DIRECTIONS.md) — standing directions rather than
  decisions: waveforms as a vocabulary including sampled sources; panning
  modelled as spatial position plus an explicit modulation relation; Martigli
  and Symmetry moved to protocol-scoped namespaces; coverage of all known
  senses; abstract signals separated from their sensory renderings, with
  carrier/modulator kept as one audio rendering rather than the universal
  structure; and the recommendation on how a stimulation specification should
  compose — components for descriptions, events for occurrences, not one
  relation across both.
- [Module architecture](MODULE_ARCHITECTURE.md) — the consumer guide to the
  modular line: dependency table, profile and SHACL selection, Full-union
  compatibility contract, named-graph ownership, deferred gaps. Accepted in
  [ADR 0043](../decisions/0043-sstim-core-profile-and-module-boundaries.md) and
  [ADR 0044](../decisions/0044-stimulus-channel-core-ownership.md).
- [Improvement plan](IMPROVEMENT_PLAN.md) — internal maturity: ordered change
  sets, session/observation work, interoperability dependencies, release gates,
  and deliberate boundaries.
- [Publication and interlinking plan](PUBLICATION_AND_INTERLINKING_PLAN.md) —
  outward-facing work: identifier and version policy, content negotiation,
  documentation, and the conservative external-mapping policy.
- [Registry submissions](REGISTRY_SUBMISSIONS.md) — the per-registry record and
  reusable metadata kit. [Wikidata contribution](WIKIDATA_CONTRIBUTION.md) covers
  that one separately, since it is contribution rather than submission.
- [Inbound references](INBOUND_REFERENCES.md) — the other direction: records and
  items **outside** SSTIM that reference an SSTIM IRI. What already does, where
  we can write, where we can request, and what each claim was measured with.
- [Alignment candidates, tranche 1](ALIGNMENT_CANDIDATES.md) — proposed external
  mappings to MeSH, UBERON and Wikidata with the authority's own intension for
  each, plus the candidates rejected and why. A proposal awaiting review, not a
  record of what is asserted; `make alignment-verify` reports the latter.

## Reviews

Dated, point-in-time records. They are evidence for the plans above, not current
guidance — read the current-state summary, plan, or ADR that cites one before
acting on its findings.

- [Core and module boundary audit, 2026-08-01](reviews/2026-08-01-sstim-core-and-module-boundary-audit.md)
  — growth, dependency topology, candidate Core Profile, extraction gates.
- [RDF knowledge-representation audit, 2026-07-13](reviews/2026-07-13-rdf-knowledge-representation-audit.md)
  — OWL/SKOS/SHACL/context/instance/serializer/provenance findings driving the
  improvement plan.
- [RDF structure and publication audit, 2026-07-24](reviews/2026-07-24-rdf-structure-and-publication-audit.md)
  — the RDF-nn finding series and its disposition.
- [External automated review, 2026-07-10](reviews/2026-07-10-external-automated-review.md)
  — OOPS/FOOPS results and finding dispositions. Independent human ontology
  review remains desirable and is not claimed.
- [DBpedia Archivo submission, 2026-07-11](reviews/2026-07-11-dbpedia-archivo-submission.md)
  — validation passed; blocked on a Databus outage.
- [Sensory taxonomy review](SENSORY_TAXONOMY_REVIEW.md) — an external
  expanded-senses proposal assessed against SSTIM's modeling boundaries.
- [Sensory stimulation sense review](SENSORY_STIMULATION_SENSE_REVIEW.md) — the
  core term's own lexical account: the relation taxonomy that keeps a
  disciplinary sense from being recorded as a synonym, a sense-inventory schema,
  the three scope stress tests (animal enrichment, sensory marketing, plants)
  that the current definition admits or excludes, a SNOMED CT identifier found wrong and
  corrected, and the evidence order that puts
  terminological and corpus work ahead of interviews.
- [Raw maintainer notes](raw-notes/) — provenance for design questions. Inputs to
  review, never normative.

Two migration annexes are normative for the ADRs that own them:
[ADR 0027 ledger](ADR_0027_MIGRATION_LEDGER.md) (also cited from
`instances/evidence/technique-evidence.ttl`) and
[ADR 0031 notes](ADR_0031_MIGRATION_NOTES.md).
