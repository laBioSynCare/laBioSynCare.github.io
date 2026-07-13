# ADR 0025 — SSTIM ↔ HED event semantics with optional BIDS research bindings

**Status:** Proposed — 2026-07-12; revised twice on 2026-07-13 after session-use-case review and the RDF audit

## Context

SSTIM needs a concrete interoperability path into experimental and behavioral
research without making an adjacent standard its native data model.

Despite its name, the [Brain Imaging Data Structure (BIDS)](https://bids-specification.readthedocs.io/en/stable/)
is no longer limited to MRI. It supports several neuroscience modalities and
[behavioral experiments without neural recordings](https://bids-specification.readthedocs.io/en/stable/modality-specific-files/behavioral-experiments.html).
Its tabular files are therefore useful for a consented research export of an
ordinary BSC Lab session: what happened, when it happened, what the participant
reported, and which stimulus metadata accompanies the record. BIDS is less
suitable as BSC Lab's canonical personal-history format because it is a dataset
exchange convention, not a complete model of executable stimuli, personal
session management, evidence, or cautions.

[Hierarchical Event Descriptors (HED)](https://www.hedtags.org/) provide the
complementary event semantics: what a stimulus, action, or experimental event
means. HED is usable with BIDS, but is not dependent on it; HED annotations can
also accompany other containers such as NWB. SSTIM adds the domain-specific
layer that neither standard deeply represents: technique, signal construction,
modulation, device and delivery context, exposure boundaries, evidence claims,
cautions, protocols, and the relationship between a specification and an
executed session.

The repository already has `sstim:SessionInstance`, phase-qualified
`sstim:SelfReport`, and Sensory Field exposure concepts. It does not yet have a
structured representation for a user's perceived helpfulness or unwanted
experience. Treating such input merely as free text would lose useful structure;
treating it as proof of benefit or a causally attributed medical "side effect"
would overstate what a self-report establishes.

This ADR therefore separates three decisions that the original proposal
combined: the canonical SSTIM session model, HED event-semantic alignment, and
optional dataset bindings such as BIDS.

## Decision

1. **SSTIM remains canonical for BSC Lab sessions.** The authoritative native
   bundle contains an immutable session specification, append-only
   `sstim:SessionInstance`, normalized event log, exposure/execution provenance,
   zero or more phase-qualified reports, and the exact executable configuration
   or a content-addressed reference to it. Stable specification, session, event,
   report, and observation IDs join the representations. App-native storage may
   serialize this contract as versioned JSON; its RDF/JSON-LD projection must
   preserve the meaning. BIDS, NWB, and HED strings are not primary storage.

2. **HED is required in the interoperability event profile, but is generated—not
   a runtime dependency.** SSTIM describes stimulus construction, execution, and
   domain context; HED describes what events mean on a timeline. A versioned
   adapter maps stable native event types to a pinned released HED schema
   (initial review target: HED 8.4.0). Native storage does not embed ad hoc HED
   strings as its source of truth. A partnered HED library remains a later
   option, gated by repeated external gaps and HED Working Group review.

3. **BIDS Behavioral is the first optional research-container binding.** When a
   consented research use case requests it, emit a complete validator-clean
   behavioral dataset—not a bare `events.tsv` labelled as BIDS. Pin BIDS and HED
   versions, include the corresponding behavioral data file, document all
   SSTIM-specific columns in sidecars, and use pseudonymous subject labels. A
   BSC Lab user needs no BIDS machinery to retain ordinary history. NWB is a
   later optional binding for synchronized neurophysiology, continuous behavior,
   or stimulus streams; neither binding changes the SSTIM or HED layers.

4. **Represent reports as observations, not conclusions.** Preserve the report
   phase and time, the question/instrument and scale version, the answer, and
   provenance. Distinguish at least:

   - perceived outcome or helpfulness relative to the user's stated goal; and
   - zero or more unwanted experiences, including category/description, timing,
     reported severity, persistence/resolution, action taken, and the user's
     perceived relatedness to the session.

   Represent `none reported`, `not asked`, `declined`, `unknown`, and an actual
   value distinctly. These records mean "the participant reported X
   after/during the session." They do not assert efficacy, diagnosis, injury,
   clinical adverse-event status, or causal attribution to the stimulus. They
   never become `sstim:EvidenceClaim` merely through export or aggregation. The
   RDF work needed for this structure is specified in the ontology improvement
   plan and remains subject to the protected-source review policy.

5. **The required demonstrator is a synthetic native+HED conformance bundle, not
   a claim that current exporters already provide one.** It contains coordinated,
   versioned artifacts:

   | Function | Representation | Authority |
   |---|---|---|
   | Event timing, IDs, and execution state | Native session/event table | BSC/SSTIM session contract |
   | Meaning of experimental events | Valid HED annotations | HED schema |
   | Stimulus, exposure, session, reports, provenance | SSTIM RDF/JSON-LD | SSTIM |
   | Reproducible generator configuration | BSC Lab patch/protocol artifact | BSC Lab |

   A complete BIDS Behavioral dataset is the first optional binding of this same
   fixture. It is valuable evidence that the adapter works, but BIDS is not part
   of the minimum semantic authority chain. NWB is added only with an actual
   synchronized-data use case.

   The fixture must use a fixed or explicitly segmented stimulus within the
   repository's conservative defaults. Time-varying modulation requires either
   piecewise events or a linked trace; it must not be flattened into a misleading
   single row.

6. **Make adapters one-way, versioned, and explicit about loss.** The bundle
   manifest records cross-artifact IDs, file hashes, SSTIM/HED/application and
   binding versions, clock and time-base assumptions, generation provenance,
   privacy/de-identification status, and known information loss. Mapping rules
   are directional and tested. Use SKOS mapping properties only for genuine
   concept-to-concept correspondences. Field transforms, HED annotation recipes,
   row construction, and instance/provenance joins belong in the profile mapping,
   not in `skos:exactMatch` statements.

7. **Validation is a publication gate.** The core bundle must pass native JSON
   Schema, HED validation against the pinned schema, RDF parsing, SSTIM SHACL,
   identifier/hash consistency checks, and round-trip or declared-loss tests.
   Any published optional binding must also pass its validator (BIDS Validator;
   or NWB Inspector plus its HED checks). Fixtures contain synthetic or explicitly
   consented/de-identified data and no therapeutic claim.

8. **Governance remains independent and accurately described.** The SSTIM
   namespace and editorial process stay independent. The W3C Community Group is
   the intended community-governance venue, but the repository's
   [`CHARTER.md`](../../CHARTER.md) governs the actual transfer conditions;
   [ADR 0007](0007-framework-protocol-implementation.md) defines modeling layers,
   not governance. HED/BIDS/INCF are interoperability and adoption partners, not
   SSTIM's governing home.

9. **The external ask is "encode and reproduce," never "endorse."** Invite
   collaborators to contribute one protocol or session pattern to encode across
   the profile and review the mapping. Do not ask them to validate BSC Lab or
   endorse a health claim.

## Alternatives considered

- **Use BIDS for every BSC Lab session.** Rejected. It would impose research
  dataset machinery on private, everyday history and still would not represent
  the full stimulus/evidence/exposure model.
- **Ignore BIDS because SSTIM is not about MRI.** Rejected. BIDS behavioral
  support makes it valuable as a recognized research-package binding even when
  no imaging is present.
- **Replace HED with SSTIM.** Rejected. HED is mature and models a different,
  complementary concern.
- **Make SSTIM a HED library immediately.** Deferred. A library may become a
  useful projection, but only with repeated use cases and joint design; it must
  not collapse SSTIM's protocol, exposure, evidence, or session layers.
- **Store helpfulness and unwanted experiences only as notes.** Rejected. Notes
  are useful, but alone cannot support comparison, filtering, validation, or
  instrument-aware research export.
- **Treat self-reported unwanted experiences as adverse-event causality.**
  Rejected. Temporal association and participant attribution must remain
  distinguishable from a clinician's assessment or a causal conclusion.

## Consequences

- The immediate interoperability target becomes smaller and more credible: one
  validated synthetic native+HED bundle plus its mapping contract; BIDS is the
  first optional adapter rather than the source of timing truth.
- Ordinary BSC Lab history becomes more useful without making BIDS mandatory.
  The same structured self-reports can later be projected into an appropriate
  BIDS behavioral or phenotype table when consent and a research purpose exist.
- The session/report model needs a privacy review, retention/export controls,
  an instrument/version pattern, and structured perceived-outcome and unwanted-
  experience semantics before collecting real participant data.
- Patch Studio and Sensory Field exports cannot be described as a completed
  bridge until the native recorder, provenance-complete RDF export, HED mapping,
  and conformance tests exist. The RDF audit already shows that the live Sensory
  Field export does not meet the current SHACL contract.
- Any RDF vocabulary, SHACL, context, alignment, or instance-data change remains
  a separately reviewed implementation step under
  [ADR 0004](0004-protected-ontology-files.md) and `CLAUDE.md`.

## Acceptance gates

ADR 0025 should move from **Proposed** to **Accepted** only when reviewers:

1. agree that SSTIM is canonical, HED is the generated event-semantic profile,
   and BIDS/NWB are optional container bindings;
2. approve the observational, non-causal helpfulness/unwanted-experience model
   and its consent/privacy posture;
3. accept the phased RDF plan and the requirement for stable event/report IDs,
   clocks, versions, and hashes; and
4. agree that interoperability may be claimed only after native JSON/RDF/SHACL,
   generated HED, representative synthetic fixtures, and any published optional
   binding pass their respective validators.

The demonstrator is an implementation consequence, not a prerequisite for
accepting the direction.

## See also

- [`../ecosystem/HED_BIDS_INTEROP.md`](../ecosystem/HED_BIDS_INTEROP.md) — profile and field-map design.
- [`../technical/SESSION_MODEL.md`](../technical/SESSION_MODEL.md) — current session and self-report model.
- [`../ontology/IMPROVEMENT_PLAN.md`](../ontology/IMPROVEMENT_PLAN.md) — staged RDF remediation and enhancement work.
- [`../ontology/reviews/2026-07-13-rdf-knowledge-representation-audit.md`](../ontology/reviews/2026-07-13-rdf-knowledge-representation-audit.md) — evidence for the second revision.
- [ADR 0016](0016-publication-obo-posture-and-registries.md) — interoperate first, membership later.
- [ADR 0018](0018-evidence-integrity-and-public-claim-governance.md) — evidence and claim posture.
- [ADR 0024](0024-stakeholder-ecosystem-modeling.md) — stakeholder engagement records.
