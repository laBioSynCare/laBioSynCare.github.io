# ADR 0025 — SSTIM ↔ HED event semantics with optional BIDS research bindings

**Status:** Accepted — 2026-08-18 · proposed 2026-07-12, revised twice on
2026-07-13 after session-use-case review and the RDF audit, and revised again on
acceptance against what shipped in between

> **Gate 2 is provisionally accepted, pending a scientific read.** The
> acceptance gates below require agreement on four points. Three are
> architectural or self-restraining and are the maintainer's to decide, as with
> every other ADR here. The second — the observational, non-causal
> helpfulness/unwanted-experience model and its consent/privacy posture — turns
> on human-participant data, where the cost of being wrong is not a refactor.
> It is accepted provisionally and marked for review by the project's scientific
> advisor before any real participant data is collected, which the Consequences
> already make a precondition. Accepting the direction does not depend on that
> read; collecting data does.

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
`sstim:SelfReport`, and Sensory Field exposure concepts.

> **Superseded by events, and left visible rather than rewritten.** When this
> was proposed it continued: "It does not yet have a structured representation
> for a user's perceived helpfulness or unwanted experience." That gap was
> closed on 2026-08-13 by
> [ADR 0048](0048-session-events-and-qualified-observations.md), which added
> `sstim:ParticipantObservation` with a required six-value response state,
> `sstim:UnwantedExperienceObservation` and `sstim:ObservationInstrument`, along
> with a session event timeline on the engine clock, clock origin and timing
> authority, delivered versus elapsed duration, a declared reproducibility level
> and a configuration digest. Verified present on acceptance. Decision 4 below
> is therefore largely *implemented* rather than pending, which is the single
> biggest change to this ADR's standing since July.

Treating such input merely as free text would lose useful structure; treating it
as proof of benefit or a causally attributed medical "side effect" would
overstate what a self-report establishes.

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
   (initial review target: HED 8.4.0 — rechecked on acceptance 2026-08-18 and
   still the latest standard schema in `hed-standard/hed-schemas`, so the pin
   needs no bump). Native storage does not embed ad hoc HED
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
   never become `sstim:EvidenceClaim` merely through export or aggregation.

   *Built 2026-08-13 by [ADR 0048](0048-session-events-and-qualified-observations.md).*
   `sstim:ParticipantObservation`, `sstim:UnwantedExperienceObservation` and
   `sstim:ObservationInstrument` exist, the six-value response state is
   required, and missing, declined and unknown are distinctly representable.
   What 0048 deliberately did **not** mint is consent terminology: that is
   entangled with [ADR 0031](0031-qualified-ecosystem-records.md)'s
   public/private split and needs its own decision. So the structure is in place
   and the consent layer is not, which is exactly why gate 2 here is
   provisional. Further RDF work remains subject to the protected-source review
   policy.

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
  and conformance tests exist.

  *Corrected on acceptance.* This previously ended "The RDF audit already shows
  that the live Sensory Field export does not meet the current SHACL contract."
  That was true in July and is no longer the whole picture:
  `src/ui/field/exposureProfile.shacl.test.js` now exists and passes with ten
  tests, so the exporter has a conformance gate beside it. Verified by running
  it on acceptance. What remains missing is the rest of the chain — the native
  recorder, the HED mapping and the cross-artifact conformance bundle — not
  SHACL conformance of that one exporter. Note also that the Sensory Field was
  folded into Patch Studio on 2026-08-09 ([ADR 0046](0046-one-studio-two-authoring-modes.md)),
  so "Sensory Field export" now names a starter family inside the Studio rather
  than a separate surface.
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

**How the gates were met, 2026-08-18.**

| Gate | Disposition |
|---|---|
| 1 — SSTIM canonical, HED generated, BIDS/NWB optional | **Accepted.** Architectural, and the layering has held through ADRs 0046, 0048 and 0051 without pressure to invert it. |
| 2 — observational model, consent and privacy posture | **Provisionally accepted.** The observational half is built and verified (ADR 0048). The consent half is deliberately unbuilt and belongs with ADR 0031. Marked for the scientific advisor's read before any real participant data is collected — which the Consequences already require independently. |
| 3 — phased RDF plan, stable IDs, clocks, versions, hashes | **Accepted, and substantially delivered.** ADR 0048 shipped the event timeline on the engine clock, clock origin, timing authority, delivered versus elapsed duration, declared reproducibility level and configuration digest. |
| 4 — interoperability claimed only after validators pass | **Accepted**, and it is the reason accepting is low-risk: this gate is a restraint on claims, not a promise of capability. Nothing here licenses an interoperability claim today. |

Accepting is therefore a commitment to a direction and to that restraint. It is
not a claim that the bridge exists, and the repository should keep saying so
until the bundle in decision 5 validates.

## Next steps, now that this is accepted

Accepting a direction is worth little without the next concrete move, and this
ADR's own logic names it: the demonstrator is not a prerequisite for acceptance,
but it is the prerequisite for everything after.

1. **Build the minimal synthetic native+HED bundle** of decision 5 — one fixed
   or explicitly segmented stimulus, coordinated IDs, and the manifest of
   decision 6. Small on purpose. It is what turns 199 lines of prose into
   something a reviewer can react to.

   *Started 2026-08-18: the mapping contract exists.*
   [`static/schemas/sstim-hed-event-map.json`](../../static/schemas/sstim-hed-event-map.json)
   maps all eleven `sstim-v:SessionEventTypeScheme` types to HED 8.4.0 annotations,
   one-way and versioned, with `lossyBecause` on the five mappings that lose
   information — including the pair `eventSessionComplete` and
   `eventSessionInterrupt`, which emit identical HED because 8.4.0 has no
   Incomplete, Abort or Terminate tag, so completion status is SSTIM-only.
   `make hed-crosswalk` validates every mapped string against the pinned schema
   with `hedtools`, which subsumes checking that each tag exists; the first
   hand-written draft contained `Pulse`, `Modulation` and `Intensity`, none of
   which are HED 8.4.0 tags. It also fails if the map drifts from the scheme, or
   if two event types collide without declaring it.

   *The generated table and manifest exist too.* `make hed-bundle` reads the
   recorded-session fixture, walks its event timeline on the session clock, and
   writes [`test/fixtures/hed-bundle/`](../../test/fixtures/hed-bundle/): a
   BIDS-style `events.tsv` with a `HED` column, its `events.json` sidecar, and
   `bundle-manifest.json` carrying artifact hashes, the pinned HED and mapping
   versions, the clock assumption, and a `declaredLoss` map. `make
   hed-bundle-check` regenerates and compares, so a crosswalk edit not reflected
   in the artifacts fails rather than drifting.

   `duration` is `n/a` throughout, deliberately: SSTIM records instantaneous
   timeline marks, and inventing a span would assert something the native record
   does not contain.

   *Decision 7's publication gate is met as of 2026-08-18.* `hedtools` is
   vendored into the flake, and `make hed-crosswalk` validates every mapping and
   definition against the pinned schema with it. `make hed-bundle-check`
   regenerates the artifacts, compares them, and validates the emitted table's
   own HED — a bundle can be current and still wrong. `make hed-roundtrip`
   reverses every emitted string through the crosswalk and asserts that declared
   loss is real, complete, and not overclaimed.

   **The validator earned its place immediately, and the way it did is the
   argument for decision 7.** Every temporal mapping in crosswalk 0.1.0 was
   invalid HED: `Onset`, `Offset`, `Pause` and `Inset` are scope tags that
   require exactly one paired `Def/`, and the map wrote them bare, as
   `(Experiment-structure, Time-block, Onset)`. Every tag in that string exists
   in the schema, so the tag-existence check that stood in for a validator passed
   it, and it would never have validated anywhere. Crosswalk 0.2.0 defines
   `Sstim-session` and `Sstim-delivery` and references them. One mapping stopped
   being lossy in the process: `Inset` expresses "resume inside an open scope"
   exactly, so `eventPlaybackResume` no longer declares loss.

   **The time-varying half of decision 5 is built, 2026-08-18.** The paragraph
   above described one bundle, and one bundle could not test the sentence in
   decision 5 that does the most work: *"Time-varying modulation requires either
   piecewise events or a linked trace; it must not be flattened into a misleading
   single row."* The fixed fixture has no modulation, so the requirement was
   satisfied vacuously and nothing would have noticed if it stopped being.

   Decision 5 names three stimulus shapes, and there is now one bundle for each:

   | Bundle | Source | Shape | Representation |
   |---|---|---|---|
   | [`test/fixtures/hed-bundle/`](../../test/fixtures/hed-bundle/) | the recorded-session fixture | fixed | events alone |
   | [`test/fixtures/hed-bundle-segmented/`](../../test/fixtures/hed-bundle-segmented/) | [`segmented-session.ttl`](../../test/fixtures/rdf/hed-bundle/segmented-session.ttl) | explicitly segmented | **piecewise events** |
   | [`test/fixtures/hed-bundle-modulated/`](../../test/fixtures/hed-bundle-modulated/) | [`modulated-session.ttl`](../../test/fixtures/rdf/hed-bundle/modulated-session.ttl) | continuously modulated | **linked trace** |

   Each manifest declares its own `modulation.shape`, so a bundle states which
   clause it demonstrates rather than leaving a reader to infer it from whether a
   trace happens to be present.

   **Piecewise events needed a term SSTIM did not have, and now does.** A
   `sstim:SessionEvent` could carry exactly two things — its type and its clock
   offset — so nothing could say *what* changed at a boundary or *to what*. Added
   2026-08-18, in the session module and the vocabulary:

   - `sstim-v:eventParameterChanged`, an eleventh session event type;
   - `sstim:StimulationParameterKind` with
     `sstim-v:StimulationParameterKindScheme` — five modality-neutral kinds
     (level, carrier frequency, modulation frequency, duty cycle, phase offset),
     deliberately quantities rather than one application's field names;
   - `sstim:hasChangedParameter`, `sstim:parameterValueBefore` and
     `sstim:parameterValueAfter`.

   SHACL requires a parameter-changed event to carry both the kind and the new
   value — a boundary mark with no content is the flattening this decision
   forbids, wearing a different hat — and forbids those properties on events that
   change nothing. Both constraints were checked by feeding them violations.

   **The line between segmented and continuous is deliberate.** A discrete change
   the plan does not contain is an event. A modulation the specification already
   declares in full — a breathing period gliding from `mp0` to `mp1` over `md` —
   stays declarative and is rendered as a trace, because restating it as events
   would create a second source able to disagree with the first. That rule is
   written into `sstim:hasChangedParameter`'s scope note, not just here.

   The modulated bundle's trace is `stimulus.tsv` + `stimulus.json`, in the shape
   of a BIDS continuous recording: no header row, columns named in the sidecar,
   `SamplingFrequency` and `StartTime` declared. Whether a continuous parameter is
   better carried as a trace or as placeholder-`Def/` marks is
   [question 5 to the working group](../ontology/outreach/2026-08-18-hed-working-group-questions.md);
   HED can express either, and a placeholder definition validates against 8.4.0:

   ```
   (Definition/Sstim-breath-period/#, (Time-interval/# s))
   (Def/Sstim-breath-period/7.774, Inset)
   ```

   **The trace advances on delivered time, and that is the interesting part.**
   The breathing arc `P(d) = mp0 + (mp1 − mp0) · min(d/md, 1)` moves only while
   audio is playing. The session pauses at 190 s and resumes at 250 s, so the arc
   freezes: the period reads 7.774 s at t=189 and 7.794 s at t=250, and the whole
   remainder of the sweep lands 60 s later on the session clock than a naive
   reading would put it. Samples inside the pause are `n/a`, not interpolated —
   nothing was being delivered, and a number there would assert an exposure that
   did not happen.

   **The requirement is now enforced rather than merely met.** `make hed-bundle`
   refuses to write a bundle whose source declares a sweep without emitting a
   trace, and `make hed-bundle-check` fails if a committed bundle has flattened
   one. That guard was the actual gap: the ADR had stated the rule since July and
   no instrument could tell whether it held.

   **Two `lossyBecause` statements were false, and in the flattering
   direction.** Decision 6 requires the adapter to be explicit about loss, and
   `make hed-roundtrip` already tested that declared loss is real and not
   overclaimed *as ambiguity*. Neither it nor anything else could check the other
   half of such a sentence — the assertion that SSTIM holds what HED drops.

   - `eventSafetyLimitApplied` said "Which boundary applied, and the requested
     versus delivered values, are SSTIM-only and must be read from the session
     record." There was nowhere in the session record to read them from.
   - `eventEngineFallback` said "The engine pair is SSTIM-only." SSTIM has no
     engine-identity term at all; `eventEngineFallback` is the only occurrence of
     the word in the ontology.

   Both pointed a consumer at data that did not exist, and both erred toward "our
   model is richer than the profile" — which is the direction nobody audits. The
   first is now true: the safety event carries its parameter kind, the requested
   value and the delivered one. The second is withdrawn rather than reworded,
   because nothing is lost relative to a record that never held it; naming
   software engines is an implementation concern and a separate decision, not
   something to assert so a loss statement reads well.

   **HED turned out to be able to carry more than the crosswalk was asking of
   it.** `Parameter-label/#` and `Parameter-value/#` exist in 8.4.0, so mapping
   0.3.0 adds an optional `detailTemplate` per event type: `hed` stays the part
   the event type alone determines and is what a reverse lookup matches after
   detail tags are stripped, while the template carries per-event values. A
   safety clamp now emits
   `(Experiment-control, Constrained, Parameter-label/Level, Parameter-value/0.3)`
   instead of a bare `(Experiment-control, Constrained)`. The declared loss that
   remains is precise: HED has no Safety or Threshold tag, so a HED-only consumer
   sees a constrained parameter without learning the constraint was protective.

   **Decision 6 and 7 gaps closed with it.** Decision 6 asks for cross-artifact
   IDs, which were absent: `events.tsv` now carries an `event_id` column and the
   manifest a `crossArtifactIds` map, and `--check` resolves every one against a
   `sstim:SessionEvent` in the source graph — decision 7's "identifier
   consistency", which a file hash does not provide. The manifests also carry the
   SSTIM suite and application versions, which decision 6 lists and they did not.
   Decision 7's "SSTIM SHACL" is now run over both sources against the
   Full-profile shapes; the modulated source is not a manifest-declared profile
   fixture, so this gate is the only place it is validated.

   **The sidecar was not BIDS-conformant, and running the real validator is how
   that was found.** The bundles have been described as "BIDS-style" throughout,
   which was doing a lot of work: nothing had ever handed one to a BIDS tool. On
   2026-08-18 that was measured, with `bids-validator` 1.15.0 on a minimal
   behavioral dataset wrapped around each bundle's `events.tsv` and sidecar.

   The first run returned `INTERNAL ERROR. SOME VALIDATION STEPS MAY NOT HAVE
   OCCURRED` — which is not a failed validation but no validation, the same class
   of answer as an unreachable instrument under `CLAUDE.md` §3.6. The cause was
   ours: the sidecar carried a `"HED"` entry holding a `Description` and a
   `Definitions` array, and in a BIDS sidecar `HED` is reserved for a column's
   HED annotations. The validator maps over that entry's values and hands each to
   the HED parser, which throws on prose.

   Definitions now live in their own non-column entry, `sstim_hed_definitions`,
   with the definitions under its `HED` key — where BIDS-HED expects them. With
   that change **all three bundles validate with zero errors.** One warning
   remains and is unfixable: `CUSTOM_COLUMN_WITHOUT_DESCRIPTION` for the `HED`
   column itself, because every way of describing it reintroduces the crash. That
   is [question 6 to the working group](../ontology/outreach/2026-08-18-hed-working-group-questions.md),
   with the reproduction table.

   **The full BIDS Behavioral binding of decision 3 is still not emitted, and the
   reason is now evidence rather than inertia.** It is achievable — the hard part,
   the events table and its HED, validates clean. What is not achievable cheaply
   is decision 7's requirement that a *published* binding pass its validator on
   every change: `bids-validator` 1.15.0 is 578 packages and 672 MB, which is not
   a dependency to add to a `make validate` that already runs in CI on every
   push. Decision 3 also gates the dataset on "a consented research use case",
   and there is none. So the position is: the binding is demonstrably reachable,
   it is not published, and the repository does not claim it. Recorded in
   `TODO.md` with the measurement so the next person starts from the evidence.

   **What remains is optional under this ADR, not required.** A BIDS Behavioral
   dataset is decision 3's first optional binding and is explicitly not part of
   the minimum semantic authority chain; NWB is later still. These files are
   BIDS-*style* and the manifests say so: a real continuous recording would be
   gzipped, entity-named, and inside a validator-clean dataset. Two synthetic
   sessions are still not a family of them, the trace carries the breathing
   period rather than the instantaneous carrier frequency, and the
   trace-versus-events check cannot catch a `delivery_spans()` that is wrong the
   same way on both sides. None of this blocks decision 7, and none of it
   licenses describing the bridge as finished — what exists is a validated
   crosswalk and two validated demonstrators.
2. **Take it to the HED Working Group** with the ask of decision 9: encode and
   reproduce, never endorse. This is also the most credible inbound-link path
   SSTIM has — HED annotations live in real published EEG datasets, and a
   validated crosswalk puts SSTIM identifiers next to them.
3. **Get gate 2 read** by the scientific advisor before any real participant
   data, and mint the consent terminology deliberately with ADR 0031 rather than
   as a side effect of this work.
4. **Do not describe the bridge as existing** until the bundle passes the
   validators in decision 7. Gate 4 is a standing restraint, not a milestone
   that acceptance retires.

## See also

- [`../ecosystem/HED_BIDS_INTEROP.md`](../ecosystem/HED_BIDS_INTEROP.md) — profile and field-map design.
- [`../technical/SESSION_MODEL.md`](../technical/SESSION_MODEL.md) — current session and self-report model.
- [`../ontology/IMPROVEMENT_PLAN.md`](../ontology/IMPROVEMENT_PLAN.md) — staged RDF remediation and enhancement work.
- [`../ontology/reviews/2026-07-13-rdf-knowledge-representation-audit.md`](../ontology/reviews/2026-07-13-rdf-knowledge-representation-audit.md) — evidence for the second revision.
- [ADR 0016](0016-publication-obo-posture-and-registries.md) — interoperate first, membership later.
- [ADR 0018](0018-evidence-integrity-and-public-claim-governance.md) — evidence and claim posture.
- [ADR 0024](0024-stakeholder-ecosystem-modeling.md) — stakeholder engagement records.
