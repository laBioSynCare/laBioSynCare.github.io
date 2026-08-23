# Patch Studio conformance and coalition-neutrality strategy

> **Status:** Target and decision framework — 2026-08-08. Artifact-level SSTIM
> conformance is recommended as part of the merged Studio's public,
> vendor-neutral foundation.
> A BioSynCare catalog adapter remains optional and must pass the decision gates
> below. This document does not claim that either target is implemented.

## 1. Recommendation

Use artifact-specific claims and never one application-wide badge:

1. **SSTIM-conformant Patch Studio artifacts** means each named native
   configuration or RDF artifact satisfies its own named, versioned public
   profile. It does not certify the whole application.
2. **BSC catalog-compatible export** means an optional one-way adapter converts
   an eligible subset into a pinned catalog JSON version and the actual consumer
   accepts it.

Do **not** make the native Patch Studio model “BioSynCare compliant.” The
BioSynCare/BSC v0.9.1 catalog is an audio-only delivery contract with curated
commercial/editorial metadata; the Studio is a multimodal live-modulation
authoring model. Making one native to the other would lose capability, couple
releases, and make the coalition concern credible.

The recommended architecture is a vendor-neutral Studio and SSTIM layer with a
generic export-adapter interface. A BSC catalog adapter may be one optional
implementation, off by default and held to the same disclosure and loss-report
rules that another vendor adapter would receive.

## 2. Why the coalition concern is real

A sensory-stimulation company could reasonably read “SSTIM compliance requires
BioSynCare compatibility” as an invitation to improve a competitor's private
pipeline. The perception becomes stronger if BioSynCare terms enter SSTIM Core,
if one product controls the badge and tests, if only one commercial exporter is
promoted, or if public contributions map directly into closed catalog policy.

That would conflict with this repository's own
[charter](../../CHARTER.md): SSTIM is vendor-neutral; BSC Lab may demonstrate it,
but the Community Group is not a BioSynCare product effort. It would also be a
poor fit with W3C Community Group posture. Community Groups are open,
community-run venues, and their reports are not W3C Standards or W3C-endorsed
specifications ([W3C Community Groups](https://www.w3.org/community/),
[W3C specification types](https://www.w3.org/standards/types/)). W3C's FAQ also
explains that a group primarily serving a commercial purpose can be rejected
([Community Group FAQ](https://www.w3.org/community/about/faq/)).

The risk is manageable because a neutral interoperability contract can benefit
every participant while leaving product-specific acceptance downstream. The
answer is structural separation and shared governance, not pretending the
founder's commercial interest does not exist.

## 3. Current baseline: precise, not promotional

Patch Studio is **partly SSTIM-integrated**, but does not yet produce the full
set of validated and loss-accounted artifacts defined below:

- current `patch-studio-model-3` exports reconstruct losslessly, while genuine
  model-1 and model-2 documents remain readable through explicit migration;
- session packages carry Patch JSON, Turtle, JSON-LD, checksums, and a mapping
  report, and cross-origin tests establish semantic and parameter equivalence;
- the RDF projection creates an SSTIM `Preset` composed of typed tracks;
- the projection still cannot express all modulation, tempo-sync, envelope,
  synthesis, and visual semantics;
- its report explicitly says that the producer path does not invoke SHACL.
  Parsing and ontology-term accounting are useful but are not a substitute for
  validating the emitted graph;
- the mapping report recursively accounts for nested, discrete, modulation,
  tempo-sync, configuration, and visual-stage leaves as mapped, unmapped with a
  reason, or non-semantic authoring metadata;
- no JSON Schema currently validates the native patch format.

Sensory Field is stronger on one narrower claim: its `ExposureProfile` emitter
has a producer-adjacent SHACL regression matrix. The merge must preserve that
gate without pretending an exposure summary and a patch configuration are the
same RDF product.

Patch Studio is **not BioSynCare-compatible end to end**:

- there is no Patch→`header`+`voices` converter;
- the documented `schemas/preset.schema.json` validation gate is still absent;
- many Patch audio types and every visual/haptic track have no catalog voice;
- evidence tier, cautions, intended-use copy, translations, grouping, and
  publication metadata require human judgment and cannot be inferred from a
  signal;
- consumer acceptance can only be proven in coordination with the separate
  BioSynCare application/backend.

## 4. Artifact-specific assurance levels

Publish machine-readable results per level. A single “compliant” label hides
which artifact, profile, version, and consumer were tested.

| Level | Claim and pass condition |
|---|---|
| **P1 — Patch profile-valid** | Patch JSON validates against a versioned public Patch Studio configuration profile/schema |
| **R1 — RDF conformant** | A named RDF artifact validates against the exact declared SSTIM release, profile, and shape package before download/export |
| **R2 — Mapping accounted** | Every source path is mapped, explicitly unmapped with a reason, or classified as non-semantic transport/view metadata |
| **X1 — Package portable** | The BSC Lab package passes cross-instance semantic and execution-parameter equivalence without identifier leakage |
| **X2 — Rendered comparison** | Rendered output matches within declared engine-specific tolerances; not currently available and not implied by X1 |
| **B1 — Eligible** | A patch is wholly within the adapter's declared catalog subset and all transformations are reported |
| **B2 — Schema-valid** | Output passes a frozen, versioned BSC catalog JSON Schema and adversarial fixtures |
| **B3 — Human-reviewed** | Required metadata, evidence, cautions, translations, and copy are reviewed by a role named in a versioned downstream BioSynCare catalog policy; that policy and role do not yet exist and are prerequisites |
| **B4 — Consumer-accepted** | A version-pinned BioSynCare consumer contract accepts the artifact |

These levels deliberately do not roll up into “the application is SSTIM
compliant.” P1 is a configuration-profile result, R1 is RDF conformance, R2 is
mapping completeness, and X1/X2 are BSC Lab portability/reproducibility results.
A release can report all of them, but must preserve those labels. “BSC
catalog-compatible” should require B1–B4 **for an eligible patch**; it must never
imply that all multimodal patches translate.

SHACL conformance says that an RDF graph has the required form. It does not
certify effectiveness, safety for an individual, scientific evidence, clinical
validity, or product approval.

## 5. Work required for profile-valid and SSTIM-conformant artifacts

This is public, vendor-neutral work and should proceed alongside the mandatory
merge wherever the merged model emits the affected artifact. It is not a reason
to block the unified runtime on unrelated vocabulary expansion:

1. Add and version a JSON Schema for the canonical Patch Studio model, including
   migration fixtures and unknown-version refusal.
2. Fix current `LFO`/`Permutation` validation and tempo-sync defects before
   deriving new Field tracks.
3. Make semantic mapping one tested registry shared by the UI links, RDF
   projection, and loss report; use the repository namespace registry rather
   than local namespace literals.
4. Account for every serialized path, including mute, tremolo, envelopes,
   binaural/noise/drone/sample modes, visual blend, modulation, tempo sync, and
   the new colour/stereo scene configuration.
5. Add producer-adjacent SHACL tests comparable to the Field exposure matrix and
   run validation before downloadable RDF. Until then, remove the
   “SHACL-validated” claim from generated reports.
6. Point `dct:conformsTo` at an exact versioned data profile, not merely an
   ontology module, and include the profile/release in the package manifest.
7. Keep configuration, exposure, and calibrated stimulus-output semantics
   separate. Do not force engine-specific knobs into SSTIM Core merely to make
   an unmapped counter reach zero. They normally remain in the versioned Patch
   Studio JSON/profile layer. If an RDF extension is justified, it must follow
   the existing SSTIM namespace, ADR, profile, and review rules; do not mint
   ontology terms under `bsclab:` merely for application convenience.
8. Extend cross-origin tests to nested scene state, visual modulation, and all
   mappings introduced by the Field merge. Add rendered-signal testing only
   where deterministic offline engines and tolerances make the claim meaningful.

Ontology changes, if genuinely required, go through the normal ADR, protected
file authorization, profile/versioning, negative-fixture, and review process.
Application convenience is not by itself a reason to add a shared SSTIM term.

## 6. Optional BSC catalog adapter

If the decision gate passes, implement the commercial compatibility path as an
adapter—not a Studio mode, not part of SSTIM Core or native Studio conformance,
and never a requirement for generic SSTIM use. Consistent with
[ADR 0041](../decisions/0041-stimulus-description-layers-and-the-canonical-schema-gap.md),
the BSC catalog schema may still be published as an optional implementation
conformance profile:

1. Reconcile and freeze the public BSC catalog contract for a named version,
   including the present `voices` cardinality contradiction.
2. Generate `schemas/preset.schema.json`; add positive, negative, boundary, and
   adversarial fixtures.
3. Define a generic adapter result shape: `eligible`, `blocking`,
   `transformed`, `unsupported`, `requiredHumanFields`, target schema version,
   and source model version.
4. Implement pure `patchToBscCatalogPreset()` conversion for the declared
   subset. Block out-of-range or unsupported data; never silently normalize,
   discard a track, or fabricate a default that changes meaning.
5. Define a versioned downstream BioSynCare catalog-review policy and reviewer
   role, then add its mandatory human step for evidence, cautions, claims,
   descriptions, translations, grouping, and other editorial metadata.
6. Validate locally, then run a consumer-driven contract in the BioSynCare
   repository/backend. Keep backend-injected fields, publication policy,
   private fixtures, and private catalog data downstream.
7. Present the output as **BSC catalog-compatible export, vX**, not
   “BioSynCare certified,” “SSTIM approved,” or “fully compliant.”

The adapter must remain one-way. The lossless patch remains the editable source;
catalog JSON is a delivery artifact for eligible subsets.

## 7. Options and trade-offs

| Option | Benefits | Costs / coalition risk | Recommendation |
|---|---|---|---|
| **A. Native BioSynCare-shaped Studio** | Shortest path for one private catalog; fewer internal transforms | Loses multimodal semantics, couples releases, makes SSTIM look captured, asks partners to improve a competitor | Reject |
| **B. Neutral core + optional adapters** | Real production proof, reusable conformance harness, auditable boundaries, room for other vendors | More up-front interface and governance work; capture perception still needs active mitigation | **Preferred** |
| **C. SSTIM only; defer BSC adapter** | Strongest immediate neutrality signal; simplest merge | Duplicate BioSynCare authoring remains; no production-consumer proof | Valid fallback if partner review or consumer contract is unavailable |

### Benefits of Option B

- demonstrates that SSTIM can support a real production consumer;
- removes duplicate authoring for the genuinely mappable subset;
- strengthens validation, mapping transparency, and reproducibility;
- gives BioSynCare an auditable upstream design tool without making it the core;
- creates an adapter contract other companies can implement on equal terms.

### Costs and risks of Option B

- companies may still perceive self-dealing or competitive capture;
- an audio-only private contract can exert design pressure on a multimodal tool;
- open and closed release schedules can become informally coupled;
- private catalog data, commercial policy, or IP could leak into public fixtures;
- users may confuse technical shape validation with evidence or endorsement;
- one exporter can look preferential unless equivalent extension points are real.

## 8. Coalition safeguards

These controls are part of the architecture, not optional communications work:

- **Neutral naming:** call it “BSC catalog export adapter,” never “BioSynCare
  mode” or “BioSynCare compliance.”
- **Equal interface:** document a generic adapter API and accept third-party
  adapters under the same rules. Do not special-case BioSynCare in the native
  patch model, SSTIM profile, or shared UI state.
- **Open test assets:** publish the schema, mappings, synthetic fixtures, loss
  reports, and public conformance harness. Keep private catalog examples out.
- **Independent vocabulary review:** disclose the BioSynCare relationship on
  proposals that affect SSTIM. For a product-motivated shared term, obtain and
  publish advisory review from at least one person who is unaffiliated with
  BioSynCare and has no direct financial interest in that adapter; record the
  review and the maintainer's response in a public issue or Community Group
  minutes. Until the charter is ratified, this adds scrutiny without inventing a
  veto or approval body that does not yet exist.
- **Separate authority and branding:** semantic conformance is determined
  mechanically by the named versioned schema/shape package. As the
  [charter](../../CHARTER.md) records, editorial authority currently remains
  with the maintainer and may later transfer under an adopted Community Group
  process. Individual consumers separately decide catalog acceptance; neither
  result awards the other's badge.
- **Reciprocal invitation:** invite at least one non-BSC company or open project
  to review the adapter interface and, ideally, prove it with another adapter.
- **Version and release independence:** Studio remains usable and releasable
  without the BSC adapter; adapter failure cannot block generic Patch save,
  package export, or SSTIM validation.
- **No scientific shortcut:** no adapter infers evidence, benefit, safety, or
  intended use from signal parameters.

The W3C Community Contributor License Agreement governs contributions to
Community Group deliverables ([W3C CLA](https://www.w3.org/community/about/process/cla/));
it does not make private BioSynCare product logic a community deliverable.

## 9. Decision gate for the optional adapter

Proceed to implementation only when all are true:

- the merged canonical patch contract is stable enough to version;
- P1, R1, R2, and X1 pass on the merged model, and the generic adapter result
  contract exists; X2 rendered comparison is not a prerequisite;
- the catalog specification and schema are reconciled and version-pinned;
- BioSynCare provides a maintainable consumer contract outside this repository;
- at least one independent coalition participant has reviewed the boundary and
  no BioSynCare-only requirement has entered SSTIM Core or the native model;
- ownership is explicit for schema updates, security disclosure, private test
  data, and cross-repository release failures.

If these conditions are not met, choose Option C. Deferring the adapter does not
block the Field merge or artifact-level SSTIM conformance.

## 10. Sequence with the mandatory merge

1. **Define the boundary first:** implement the ADR 0046 boundary, name the
   three semantic products, define the generic adapter result, and capture
   fixtures.
2. **Stabilize the current Studio:** fix control validation/tempo sync, extract
   the runtime, and add real projection validation/loss accounting.
3. **Merge Field into the neutral core:** one document/runtime with ordinary
   first-class colour-field and spatial visual tracks, Field templates/routes,
   and a shared visual projection stage; preserve Field's exposure SHACL gate.
4. **Finish P1, R1, R2, and X1 on the merged model:** schemas, exhaustive
   mapping, exact profile validation, and cross-instance tests.
5. **Run the coalition/consumer decision gate.** Gather concrete review rather
   than relying only on internal reassurance.
6. **If it passes, build the optional BSC adapter.** If it does not, leave the
   adapter deferred while the merged Studio ships its separately named,
   conformant artifacts.

Thus the tasks are partly intertwined: semantic boundaries and conformance
fixtures must shape the merge, while BioSynCare conversion must follow it. The
commercial adapter must not become a prerequisite for the mandatory product
integration.

## 11. Labels that may be used after the gates pass

- “Patch Studio configuration vX conforms to profile/schema P.”
- “RDF artifact X conforms to SSTIM profile Y, release Z, using shape package
  Q.”
- “BSC Lab package portability Level X1 passed.”
- “BSC catalog-compatible export vX for eligible patches.”

Avoid:

- “W3C standard compliant” for a Community Group report;
- “BioSynCare certified” unless a separate, explicit certification program
  actually exists;
- “all Patch Studio patches are BioSynCare compatible”;
- “SHACL validated” when validation did not run;
- any suggestion that format conformance establishes efficacy or clinical
  validity.

## 12. Related documents

- [`../technical/PATCH_STUDIO_FIELD_INTEGRATION.md`](../technical/PATCH_STUDIO_FIELD_INTEGRATION.md)
  — mandatory product integration plan.
- [`../decisions/0026-patch-studio-catalog-bridge.md`](../decisions/0026-patch-studio-catalog-bridge.md)
  — existing one-way subset decision.
- [`../technical/PRESET_FORMAT.md`](../technical/PRESET_FORMAT.md) — documented
  private catalog v0.9.1 contract.
- [`../technical/SESSION_PACKAGE.md`](../technical/SESSION_PACKAGE.md) — current
  portability and equivalence levels.
- [`ECOSYSTEM_INTEGRATION.md`](ECOSYSTEM_INTEGRATION.md) — vendor-neutral SSTIM,
  open BSC Lab, and closed BioSynCare boundary.
