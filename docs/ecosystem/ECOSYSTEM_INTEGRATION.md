# Ecosystem Integration — Working Plan & Tracker

> **Status: living working document (not as-built).** This is the master tracker
> for turning BSC Lab / SSTIM from founder-driven infrastructure into a populated
> ecosystem. It holds five workstreams so none is lost. Update the status lines
> in place; graduate finished content into the canonical docs it points to.
>
> **Provenance.** Seeded by an external strategy conversation, *"SSTIM BSC
> Ecosystem Integration"* (2026-07-12). The conversation's claims were verified
> against this repo before anything here was written; verified findings and
> re-derived (already-known) points are separated below. Do not treat the source
> conversation as authoritative — it is an outside read, useful mainly for the
> **HED/BIDS/INCF** angle and the named outreach targets.

---

## The one-line reframing

We are **not looking for a circle to join — we have started building one.** The
three-layer model (knowledge / platform / community) already exists in
[`ROADMAP.md`](../../ROADMAP.md); the W3C group is launched; the ontology, engines,
and Patch Studio with its Field-derived tracks are live. The bottleneck is therefore **social
conversion, not more construction:**

> The room exists, but it is not yet populated enough.

Everything below serves one milestone:

> **One outside lab, one real published protocol encoded in SSTIM, one
> validated interoperability artifact, and one independent named review.**

---

## What is genuinely new vs. already ours

**New (no prior coverage in the repo — verified by search):**

- **HED / BIDS / INCF interoperability.** Zero mentions of HED, BIDS, or INCF
  existed anywhere in the codebase or docs. → Workstream 2.
- **Named outreach targets** (IMRF, IIT U-VIP / Monica Gori, ANTARES, UCL
  Multi-Sensory Devices / Marianna Obrist, Web Audio CG, NeuroTechX, Clust-ER,
  European Brain Council, Brain Innovation Days 2026). None appear in
  [`PARTNERS.md`](PARTNERS.md) or [`ADVISORY_BOARD.md`](ADVISORY_BOARD.md). → Workstream 3.
- **A deeper public-entrance / audience model** than the current homepage. → Workstream 4.
- **Stakeholder-ecosystem modeling** — formalized in parallel as [ADR 0024](../decisions/0024-stakeholder-ecosystem-modeling.md)
  (Accepted 2026-07-12, amended by ADR 0031): a new `sstim-ecosystem` RDF
  module, organization notify-and-honor, and relationship-scoped
  self-publication/consent for named people. → Workstream 5.

**Already ours (the source re-derived it; adds nothing):** the three-layer model
([`ROADMAP.md`](../../ROADMAP.md) Vision), and the vendor-neutral-SSTIM /
open-BSC-Lab / closed-BioSynCare separation ([ADR 0007](../decisions/0007-framework-protocol-implementation.md),
`CLAUDE.md` §5.1). Keep these as the frame; they are settled.

**Guardrails / caveats (carry forward, do not lose):**

- **Version discipline.** The citable release is **SSTIM 0.11.0**, identified by
  `https://w3id.org/sstim/0.11.0` and archived under release DOI
  `10.5281/zenodo.21536124` (per [`TODO.md`](../../TODO.md) current focus).
  This line moves with each release — check `TODO.md` before quoting it.
- **Do not hard-code live figures** (quad counts, concept counts, preset counts)
  from the source conversation into any doc — they drift; cite the live app instead.
- **`01-Audiovisual_Entrainment.pdf`** (external, *not* in this repo) reportedly
  makes remission / IQ-increase / near-absolute-safety claims. It must **not** lead
  academic outreach, and if it ever enters the repo it must first be reconciled
  with the no-medical-claims invariant (`CLAUDE.md` §3.5, [`SCOPE.md`](../concept/SCOPE.md)).

---

## Workstream 1 — Reconcile "proposed" vs. "launched" group status

**`[x] Done — 2026-07-12.`** The W3C Sensory Stimulation Community Group is
**launched**. All status and governance wording and the pre-submission artifacts
were reconciled to launched-group framing; the list of contradictions this
workstream existed to find has been removed now that none of them survive.

Chairs and the roster are deliberately **not** listed here. `CHARTER.md` names
the group's W3C page as the authoritative record and adds that named
participants are added only after explicit consent — so a second, in-repo roster
would be both redundant and a place to publish a name ahead of its consent.

The rule it leaves behind: `CHARTER.md` and
[`W3C_COMMUNITY_GROUP_PROPOSAL.md`](W3C_COMMUNITY_GROUP_PROPOSAL.md) describe a
launched group whose **charter is not yet ratified**. Those are two different
facts, and copy that collapses them is wrong in one direction or the other.

---

## Workstream 2 — SSTIM ↔ HED event profile and research bindings

**`[~] Revised 2026-08-13 — the native session/event/report contract is implemented and gated; the HED mapping, the worked example, and the BIDS binding remain.**

**Artifacts:** [`HED_BIDS_INTEROP.md`](HED_BIDS_INTEROP.md) (event profile and
binding contract), [ADR 0025](../decisions/0025-hed-bids-interoperability-crosswalk.md)
(Proposed), and the [RDF improvement plan](../ontology/IMPROVEMENT_PLAN.md).

**Posture:** SSTIM is canonical for native sessions; HED is the generated event-
semantic profile; BIDS Behavioral is the first optional research-container
binding; NWB is use-case-triggered. Do **not** replace HED or fork a HED library
without repeated reviewed gaps. These standards are partners, not SSTIM's
governing home.

**The core demonstrator (one synthetic ordinary session):**

| Function | Representation | Current state |
|---|---|---|
| IDs, onset/duration, execution state | Native session/event bundle | **Shipped 2026-08-13** — versioned schema, recorder, engine-clock event timeline, gated by `make session-contract` |
| Experimental event meaning | Generated HED annotations | Mapping/validator not implemented — but its input now exists, natively and in RDF |
| Stimulus, exposure, reports, provenance | SSTIM RDF/JSON-LD | Complete in both forms as of ADR 0048, except the privacy profile, which is native-only by choice |
| Executable stimulus | BSC Lab patch/configuration + hashes | Patch export exists; the session bundle now records the configuration IRI and its content hash, so provenance closes from the session side |
| Optional research packaging | Complete BIDS Behavioral binding | Not implemented |

The [2026-07-13 RDF audit](../ontology/reviews/2026-07-13-rdf-knowledge-representation-audit.md)
required a native recorder/schema, report/privacy semantics, and runtime RDF
conformance before the HED and BIDS adapters. **The first of those is done.**
HED describes what occurred and when; until 2026-08-13 SSTIM could not say that
anything occurred at all, and now the native bundle carries an ordered,
engine-clock event timeline. **Revised 2026-08-22:** an earlier version of this
paragraph said a HED mapping could be generated from it, which was premature. The
clock and the ordering are there; the event *vocabulary* covers device and system
occurrences only, and `sstim:SessionEvent` cannot reference a stimulus. Stimulus
presentation, participant response, and contextual events are all absent. See the
measurement in [`HED_BIDS_INTEROP.md`](HED_BIDS_INTEROP.md). The
mapping itself is the next piece of work, and it does not need the ontology
terms — HED annotations are generated from the native bundle, not from the RDF
projection.

**Next actions:**
- [x] Revise the event/binding profile and Proposed ADR.
- [x] Audit the RDF and write the ordered remediation plan.
- [x] Implement and validate the native session/event/report contract.
      *2026-08-13. `static/schemas/session.schema.json`, `src/session/`,
      `make session-contract`. Its SSTIM terms landed the same day under
      [ADR 0048](../decisions/0048-session-events-and-qualified-observations.md),
      so the event timeline exists in RDF as well as natively — which is what the
      HED mapping needs. The projection still reports what it withholds.*
- [ ] Generate a version-pinned HED mapping and synthetic core bundle.
- [ ] Add and validate the optional complete BIDS Behavioral binding.
- [x] Request HED Working Group review. Sent 2026-08-20 as six questions split by owning repository: [hed-schemas#416](https://github.com/hed-standard/hed-schemas/issues/416) and [hed-javascript#836](https://github.com/hed-standard/hed-javascript/issues/836). Awaiting reply.

**Reference (for §"what are these", so we don't re-look-up):**
- **HED** — Hierarchical Event Descriptors: controlled vocabulary for *what occurred*
  in an experiment (a flash, a tone, a button press). Complements SSTIM, which
  describes the *stimulation technique/parameters/protocol/exposure/evidence*.
- **BIDS** — Brain Imaging Data Structure: folder + metadata standard for
  neuroscience datasets (MRI/EEG/MEG/PET/behavioral).
- **INCF** — International Neuroinformatics Coordinating Facility: standards-review /
  adoption body; endorses HED and BIDS. A visibility channel, not a governing home.

---

## Workstream 3 — Outreach targets, 90-day sequence, KPIs

**`[~] Captured 2026-07-12 — targets doc created + hard deadline filed; actual outreach is Renato's to trigger.**

> **Consent & provenance ([ADR 0024](../decisions/0024-stakeholder-ecosystem-modeling.md)).**
> The rows below are *outreach intentions*, not stakeholder records. The moment any
> named person/org is published as a record — in `PARTNERS.md` / `ADVISORY_BOARD.md`
> or in the Workstream 5 RDF module — organizations use the **notify-and-honor**
> posture: notify best-effort, record the source, and honor objections/removals
> promptly. Because Git history and clones cannot be made fully erasable, a named
> person enters the RDF dataset only by self-publication or earlier scoped consent;
> notification alone is insufficient. `PARTNERS.md` / `ADVISORY_BOARD.md` are the
> *consent-of-record* for named people only when confirmation covers the exact
> relationship and purpose; confirmed entries may mirror into RDF after
> the remaining F3/release gates. The ask stays *"encode/reproduce a protocol,"*
> never *"endorse BSC"* — consistent with the ADR's no-endorsement / no-false-affiliation
> rule. **Note:** this tracker itself names public professional figures in a public
> repo; ADR 0024 permits that (public professional info only), but the best-effort
> notification obligation still attaches to them.

### Named targets (new — capture into `PARTNERS.md` / `ADVISORY_BOARD.md` or a new `OUTREACH_TARGETS.md`)

| Circle | Target | Ask (note: encode/reproduce — **not** "endorse BSC") |
|---|---|---|
| Standards | HED Working Group (INCF-endorsed) | Review one SSTIM–HED/BIDS example |
| Research | IIT U-VIP (Monica Gori), UniGe–San Martino–IIT **ANTARES** | Nominate one protocol each to encode |
| Research | **IMRF** (multisensory research forum; 2026 meeting) | Present the interoperability/reproducibility result |
| Research | UCL **Multi-Sensory Devices Group** (Marianna Obrist) — "sensory-driven microinterventions" | Nominate one protocol to encode |
| Implementation | **Web Audio Conference** + **W3C Audio Community Group** | Home for Patch Studio / timing / browser synthesis |
| Policy | **European Brain Council** + Charter for Responsible Development of Neurotechnologies | BioSynCare *may* endorse Charter (ethical, not scientific/product validation) |
| Entrepreneurial | **Clust-ER Health & Wellness** (Emilia-Romagna) | Regional BSC pilot (~€500 + IVA, ≤50 people) |
| Community | **NeuroTechX** (30+ chapters) | Join + demonstrate BSC Lab (do not create a new community) |

**⏰ Time-sensitive:** **Brain Innovation Days 2026 Innovation Hall** (Brussels,
18–19 Nov) — applications open until **1 September 2026**. Today is 2026-07-12
(~7 weeks). Verify exhibition costs before committing.

### 90-day sequence (source-proposed; adapt into `TODO.md` P2/outreach)

1. **HED/BIDS bridge** — publish one end-to-end SSTIM–HED/BIDS example; request HED WG review. *(→ Workstream 2)*
2. **External research use case** — ask Gori/ANTARES and UCL to nominate one protocol each to encode.
3. **Brain Innovation Days** — apply before 1 Sept.
4. **W3C group growth** — recruit from ≥4 constituencies (experimental neuroscience, multisensory HCI, semantic standards, device/software devs).
5. **Regional commercialization** — Clust-ER Health 30-day BSC pilot; keep commercial-pilot evidence separate from research validation.
6. **Governance** — preserve SSTIM (vendor-neutral) / BSC Lab (open) / BioSynCare (closed) separation; publish conflicts of interest; seek an independent co-maintainer. *(overlaps Workstream 1)*

### Decision KPIs

- ≥2 non-BSC protocols represented in SSTIM.
- ≥1 external institutional reviewer or co-maintainer.
- ≥1 reviewed HED/BIDS interoperability artifact.
- W3C participation 4 → ≥12, representing ≥3 unaffiliated institutions.
- ≥1 research collaboration **and** ≥1 commercial pilot — reported separately.

**Done (2026-07-12):**
- [x] Targets home decided + created — [`OUTREACH_TARGETS.md`](OUTREACH_TARGETS.md)
      (a new doc, not `PARTNERS.md` — these are prospects; PARTNERS is for confirmed partners).
- [x] Brain Innovation Days deadline filed in `TODO.md` §7 (⏰ 1 Sept 2026, tagged P1 — needs action now).
- [x] 90-day sequence + KPIs captured in `OUTREACH_TARGETS.md` (kept out of the phase-gated `TODO.md`).

**Pending Renato (outward-facing — not mine to trigger):**
- [ ] Actual outreach to each target (organization notification attaches on
      first contact; publishing a person in RDF requires scoped consent or
      self-publication — [ADRs 0024–0031](../decisions/0031-qualified-ecosystem-records.md)).
- [ ] Decide the Charter-endorsement question for BioSynCare (ethical commitment only).

---

## Workstream 4 — The public entrance (audience model, deepened)

**`[x] Shipped 2026-07-18.`** Graduated, per this file's own rule, into
[`PUBLIC_ENTRANCE.md`](../technical/PUBLIC_ENTRANCE.md) — which is the source of
record for the persona catalog, the seven-personas-to-four-doors mapping, the
per-door copy and route map, the two conversion actions, the wireframe, and the
safety routing. The design notes that were duplicated here have been removed.

What this workstream contributed, and what still holds: seven flat doors is bad
IA, so group by *intent* into **① Experience · ② Understand & reproduce ·
③ Build on it · ④ Join & partner**, and surface the two social-conversion levers
— *Join the W3C group* and *Contribute a protocol* — from every door rather than
burying them in one. Entrance copy uses permitted wellness verbs only
(`CLAUDE.md` §3.5).

That architecture question is now resolved by
[ADR 0046](../decisions/0046-one-studio-two-authoring-modes.md): Sensory Field
becomes ordinary first-class colour-field and spatial visual tracks in Patch
Studio's canonical model/runtime and shared visual projection stage. Field
templates remain inside Studio, while `/field/*` survives only as redirect-only
bookmark compatibility rather than a separate navigation destination.
The additive 14-type visual model, shared composition stage, Field starters,
report-producing legacy adapters, recursive projection-loss accounting, and
public-route cutover are shipped. The integration remains partial under
[`PATCH_STUDIO_FIELD_INTEGRATION.md`](../technical/PATCH_STUDIO_FIELD_INTEGRATION.md):
runtime extraction, exact fidelity/lifecycle proof, unified delivered-state
`ExposureProfile` plus producer-adjacent SHACL, acceptance gates, and legacy
deprecation/removal are still architecture work, not entrance copy work.

---

## Workstream 5 — Stakeholder-ecosystem RDF module (ADR 0024 implementation)

**`[~] F1–F2 and the stable term release are complete in SSTIM 0.7.0 under [ADR 0031](../decisions/0031-qualified-ecosystem-records.md). F3's external mutable projection, optional loader, private ledger, retention/removal runbook, and private-first admission job are operational. The enriched F4 aggregate is live with separately approved person/organization relationships; one leadership relationship is an explicitly documented self-attestation pending a canonical public role source. The unified Graph navigator now renders the live ecosystem together with the versioned catalog and ontology/vocabulary, with focus filters and source/provenance disclosure. The w3id catalog + live namespace routes are merged and verified end-to-end (2026-07-17, perma-id/w3id.org#6378), and the live aggregate now carries the W3C CG and Æterni Anima records; dedicated human profile routes remain optional follow-up. On 2026-07-20 the aggregate was reconciled to the single-organization model: the separate BioSynCare startup-identity organization agent was retired (BioSynCare is a product of Æterni Anima), its tool-vendor record withdrawn, the Junto listing retargeted to the application implementation IRI, the pending BioSynCare communications-role proposal removed pending a corrected re-notification, and Æterni Anima responsibility records added for BioSynCare, BSC Lab, and Patch Studio.**

ADR 0024 established the initial direction for modeling real people and
organizations in sensory stimulation: a new `sstim-ecosystem` term module
(`sstim-eco:`), reuse of schema.org / ORG / FOAF, verified external IDs (ORCID /
ROR / Wikidata), an engagement/relationship layer, organization
**notify-and-honor**, and stricter relationship-scoped person admission.
[ADR 0031](../decisions/0031-qualified-ecosystem-records.md)
now resolves the KR-13 design blocker with named, sourced, purpose-specific
relationships, an approved public current-state projection, and a separate
append-only private audit; the original flat properties remain deprecated
compatibility terms and are rejected in new public data.
Instances are curated implementation data at `/organization/{id}` and
`/specialist/{id}` — **never** in the reusable term space. The default live-only
tier must be served from an external mutable store, outside this
Zenodo-tracked release repository. `make snapshot` copies only the ontology term
modules, but that alone is not a DOI-archive boundary: Zenodo ingests the
repository state associated with the GitHub release tag. The committed
ecosystem files therefore remain synthetic. ADR 0024 envisages a separate
explicit-consent archival tier, but that pipeline is not implemented and is not
part of the first seed.

This is the RDF counterpart to Workstreams 3–4: an outreach target (W3) becomes a
recorded agent here only after the applicable source, approval, and—when the
agent is a person—self-publication or scoped-consent gate is satisfied. The graph-browser
"Stakeholders" scope serves the Researcher / Standards-peer personas (W4).

### SSTIM-wide prerequisite decision (2026-07-15)

SSTIM is structurally healthy: the pinned validation suite passes SHACL,
repository quality checks, HermiT consistency, SPARQL sanity queries, and all
module serialization round trips. There is no repository-wide validity failure
and no need to redesign SSTIM before this workstream starts. The citable baseline
is now `0.8.0`; the audit is a dated finding list rather than a current
status ledger: KR-01, KR-06, the evidence-provenance portion of KR-11, runtime
KR-12/KR-17, and most KR-14 controls have since been repaired. Validation does
not, however, make every proposed use ready:

- **KR-13's structural blocker is resolved by ADR 0031/F1–F2.** Qualified
  records now keep each agent, target, type, purpose, source, curator, and
  admission decision together; negative and terminal history remains private.
- **KR-02/KR-03 block real session bundles, participant observations, and the
  HED/BIDS path, not ecosystem modeling.** Session change sets B/C are not
  prerequisites for ecosystem change set F.
- **KR-04 blocks automated public-claim authorization.** Do not treat evidence
  tiers as an automatic permission to publish wording until ADRs 0028–0029 are
  implemented.
- **Residual KR-05, KR-07–KR-10, KR-14, and KR-15/KR-16 work contains important
  semantic, reproducibility, validation-isolation, mapping, and coverage repairs
  for the post-0.7 roadmap, but it does not invalidate the bounded evidence and
  ecosystem contracts released in `0.7.0`.** Their limits and dependencies
  remain recorded in the [RDF improvement plan](../ontology/IMPROVEMENT_PLAN.md).

Therefore, the ecosystem contract is released independently of session work.
**Only synthetic instance triples and reusable contract code** may remain in
this release repository. Exact dereferencing configuration is the narrow
exception: it contains the public IRI paths of admitted live subjects, but no
agent descriptions or relationship triples. Those paths persist in Git and
possibly w3id registry history even after an active rule is removed, so the
live-only tier promises removal from the current RDF projection and active
routes—not erasure of historical identifier traces. Real named record data is
admitted only through the now-operational external mutable-store,
loader/dereferencing, and private-ledger gates below.

### Minimum ecosystem scope

The first useful ecosystem does require more than agents and implementations,
but it does not require another broad catalogue of entity classes:

1. **Agents:** people and organizations typed as `sstim-eco:EcosystemAgent` and
   also with the appropriate Schema.org/FOAF/ORG class. Laboratories, research
   groups, companies, and standards bodies are organization kinds, not new SSTIM
   top-level classes.
2. **Implementations:** existing `sstim:SensoryStimulationImplementation`
   resources for software, hardware, manual, or hybrid realizations. An
   implementation is not the company or person responsible for it.
3. **Qualified ecosystem relationships/engagements:** one record binds an agent,
   target resource, role/type, purpose, source, curator, validity interval, and
   applicable publication/consent decision without cross-association.
4. **Qualified organization memberships:** sourced, time-qualified person ↔
   organization links with only the roles required by real seed cases. A vague
   or unsourced “affiliation” is insufficient.
5. **Implementation responsibility:** factual links identifying who develops,
   publishes, maintains, provides, hosts, or funds an implementation, using a
   qualified relation where source, role, and dates matter.
6. **Provenance and engagement lifecycle:** notification, acknowledgement,
   scoped consent, and final publication approval are public only while the
   relationship remains admitted. The append-only private ledger holds failed,
   declined, disputed, amended, removed, and withdrawn states plus raw messages,
   contact channels, and consent evidence. It also retains the complete governed
   relationship snapshot and an exact mirror of every public activity's core
   fields; amendment replacements are complete revision-linked snapshots.

Frameworks, techniques, protocols, references, and implementations already
provide relationship targets. Projects, products beyond the existing
implementation model, job taxonomies, session data, observations, and new named
method/school classes are not prerequisites for the first ecosystem seed.

### BSC catalog bridge and first enrichment (2026-07-17)

The catalog is intentionally a typed relationship graph rather than a new
container hierarchy. SSTIM is the ontology; BSC is a framework; BSC Lab and the
BioSynCare application are distinct implementations of BSC. The Patch Studio
software component is part of BSC Lab and implements BSC, while the separately
identified Patch Studio ontology module is part of SSTIM and documents the
component's parameters. A BioSynCare organization agent remains distinct from
the BioSynCare application implementation.

The implementation sequence is now recorded as follows:

1. Add or revise stable non-personal framework, implementation, and component
   identities in the version-controlled static catalog.
2. Author the complete real-agent replacement aggregate and its complete
   access-controlled audit ledger outside this repository.
3. Validate isolated public SHACL, JSON-LD round trip, private mirroring,
   implementation/agent separation, local-IRI resolution, and exact routes.
4. Activate private-first: persist the audit ledger, publish the complete live
   replacement, verify bytes/MIME/CORS, and remove superseded Hosting content.
5. Deploy static catalog targets and the unified human-readable Graph discovery;
   merge and verify the exact upstream w3id routes before wider outreach.
6. Enrich incrementally through complete replacement aggregates; add another
   person only with relationship-and-purpose-scoped self-publication or consent.

The current enrichment applies this catalog to separately approved creator,
implementation-responsibility, organization-membership, portfolio, and
tool-vendor relationships. Unknown role-start dates use a conservative
known-to-apply date rather than an invented employment-start date. One
leadership claim is a temporary self-attestation exception: its cited pages
establish the organization identity, while authenticated self-publication
evidence stays private until a canonical public role source exists. To preserve
the live-only boundary, the names, titles, and complete current claims are not
duplicated in this versioned tracker; inspect the mutable
[`current.ttl`](https://biosyncare-lab.web.app/current.ttl) projection. No
organization-side record asserts endorsement, investment, ownership, or a
legal form not established by its cited public sources.

### Canonical readiness sequence

This is the operational sequence for change set F. The
[improvement plan §1.5](../ontology/IMPROVEMENT_PLAN.md#15-repair-privacy-sensitive-rdf-surfaces)
remains authoritative for the semantic requirements. The concrete storage,
publication, and removal procedure is recorded in
[`ECOSYSTEM_OPERATIONS.md`](ECOSYSTEM_OPERATIONS.md).

1. **`[x]` F1 — approve the model and governance amendment.** Write a short successor
   or amendment to ADR 0024 covering qualified relationships/engagements,
   organization memberships, implementation responsibility, the public/private
   split, correction/removal handling, and purpose-specific consent. Keep
   live-only/non-archival publication as the default.
2. **`[x]` F1 — synchronize the contract.** With explicit approval for protected
   files, update OWL, SHACL, JSON-LD context, JavaScript namespaces, migration
   notes, and application mappings together. Deprecate or narrowly retain the
   flat properties rather than silently changing their meaning.
3. **`[x]` F2 — prove the model with synthetic fixtures.** Add synthetic person and
   organization examples plus positive and negative tests. The main fixture
   must show one person with at least two memberships/roles and two engagements
   without mixing their targets, sources, purposes, or consent decisions. Test
   per-artifact/per-named-graph SHACL, JSON-LD graph isomorphism, local IRI
   resolution, lifecycle ordering, and public/private exclusions.
4. **`[~]` F3 — complete instance publication plumbing.** The repository now has
   a dedicated synthetic `instances/ecosystem/` family, named graph, explicit
   loader manifest entries, quality-audit coverage, Schema.org/ORG context
   support, VoID metadata, and a synthetic fixture graph. Committed instance
   data remains synthetic and reserves a `synthetic-*` subject slug; general
   live namespace rules reject that prefix while dereferencing externally
   stored real records without subject-specific paths here. The mutable public
   store is Firebase Hosting at
   `https://biosyncare-lab.web.app/current.ttl`; the browser loads it optionally
   into the real-agent graph, while CI never depends on the network. The
   access-controlled ledger is the client-denied Firestore
   `sstimEcosystemAudit` collection. Its access owner, active-plus-365-day
   terminal retention policy, correction/removal procedure, and private-first
   activation order are recorded in `ECOSYSTEM_OPERATIONS.md`. Run admission as
   `make ecosystem-contract PUBLIC_ECOSYSTEM=/secure/path/public.ttl PRIVATE_LEDGER=/secure/path/ecosystem-audit.ttl`:
   the supplied path must be outside the repository and its complete history
   must exactly mirror every admitted relationship claim and the core fields of
   every public activity. The current command validates repository fixtures and
   the external-ledger boundary and accepts one candidate from an external
   access-limited work path. `sstim-ecosystem-publish.py` validates both,
   writes the hash-addressed private audit first, releases the public projection,
   verifies bytes/MIME/CORS, and deletes superseded Hosting content versions.
   External-ledger diagnostics are redacted and must never print raw SHACL
   reports or private identifiers to public logs.
   F3 remains marked in progress only because the staged w3id namespace routes still
   need their upstream merge and live verification.
5. **`[x]` Release gate — stabilize the contract.** SSTIM `0.7.0` includes the
   ecosystem term contract and migration notes after the pinned validation,
   test, check, and build suites passed. Its Zenodo version DOI is
   `10.5281/zenodo.21380171`. This closes the term-release gate independently
   from the mutable live-data channel.
6. **`[~]` F4 — author each real RDF aggregate atomically, then activate it in
   the external mutable store.**
   The first aggregate was activated on 2026-07-16 UTC; the complete enriched
   replacement was activated later that day UTC (2026-07-17 Europe/Rome). It
   contains the scoped relationships recorded in the catalog-bridge section
   above. The verified person agent is both curator and final approval actor.
   Organization records cannot be admitted separately when that person is their
   accountable curator:
   every curator must already be a verified, related agent in that same
   aggregate. An agent cannot be published as a detached identity. Every
   later membership or responsibility involving a person is a separate
   relationship and needs its own self-approval or earlier
   scoped consent grant. Keep the current seed live-only and non-archival. Add
   other people only after explicit relationship-and-purpose-scoped consent and
   reconciliation with `PARTNERS.md` / `ADVISORY_BOARD.md`; notification alone
   does not admit a named person record. Stage exact per-resource w3id rules
   with the private/local draft. After publishing the validated aggregate makes
   the external target live, submit and verify those rules before announcing
   the identifiers or enabling discovery; w3id cannot approve a redirect to a
   target that is not yet served.
7. **`[~]` Discovery — unified Graph navigator implemented 2026-07-17.** The
   browser renders ordinary framework/implementation/agent instances and
   qualified relationships in one interlinked view, provides catalog/ecosystem/
   term focus scopes, searches labels and aliases, discloses versioned-vs-live
   provenance, and makes live SPARQL loading explicit. Dedicated profile routes
   and curated competency-query shortcuts remain optional follow-up.

### Readiness gate for real records

Real named records may enter the external public live dataset only when all of
these are true; they remain prohibited from this Zenodo-tracked release
repository unless the separate archival-consent pipeline is invoked:

- the qualified relationship, membership, implementation-responsibility, and
  lifecycle contracts are approved and synchronized across their representations;
- synthetic positive and adversarial negative fixtures pass in isolated graphs;
- public data cannot expose private correspondence, authentication identifiers,
  private contact channels, or raw consent evidence;
- every relationship target is an HTTPS public-web identifier (or canonical
  Wikidata entity IRI), never a contact, file, or private identifier scheme;
- every identity and public relationship has an authoritative source and review
  date, and every person/organization/implementation has a distinct IRI;
- loader, local-IRI, VoID, export, and dereferencing checks cover the new instance
  family; and
- every relationship ends in a final approval by its curator; a named
  person is self-published or has an earlier scoped consent grant; no negative
  or operational outcome appears publicly;
- synthetic and real data use distinct graphs/dumps; the term contract and
  fixture IRI grammar are deployed in a stable citable release, while current
  synthetic subjects reserve a `synthetic-*` slug and have no fixture-specific
  registry routes; general live
  namespace routes are staged and audited, then activated and verified immediately
  after their external live target deploys and before announcement/discovery;
  and
- an access-controlled private ledger has a named access owner and retention
  policy; the authenticated evidence for self-publication/consent is retained
  there; the executable admission gate has verified that every public activity
  is mirrored there, and the terminal-event retraction drill has removed the
  relationship, its public activities/backlinks, and any orphaned agent; and
- every real agent-record curator, relationship curator, and public activity
  actor is a verified EcosystemAgent in the reviewed aggregate; for the first
  seed Renato is the accountable curator, with self-publication authenticated by
  a verified maintainer-account review, signed commit/review, or separately
  authenticated private-ledger evidence; and
- archival publication remains disabled unless its separate higher consent and
  pipeline are actually implemented.

**Guardrail:** no record implies endorsement, affiliation, clinical efficacy, or
that an implementation is identical to the person or organization responsible
for it (ADR 0024 Governance; ADR 0007; `CLAUDE.md` §3.5).

---

## Cross-references

- Vision & three-layer model: [`ROADMAP.md`](../../ROADMAP.md)
- Framework / implementation separation: [ADR 0007](../decisions/0007-framework-protocol-implementation.md)
- Stakeholder-ecosystem modeling & consent posture: [ADR 0024](../decisions/0024-stakeholder-ecosystem-modeling.md)
- Scope & no-claims: [`SCOPE.md`](../concept/SCOPE.md), [`NON_SCOPE.md`](../concept/NON_SCOPE.md)
- Governance: [`CONTRIBUTING.md`](../../CONTRIBUTING.md), [`CHARTER.md`](../../CHARTER.md), [`W3C_COMMUNITY_GROUP_PROPOSAL.md`](W3C_COMMUNITY_GROUP_PROPOSAL.md)
- Outreach: [`PARTNERS.md`](PARTNERS.md), [`ADVISORY_BOARD.md`](ADVISORY_BOARD.md), [`INVITATION_TEMPLATE.md`](INVITATION_TEMPLATE.md), [`CONSORTIUM_INVITATION.md`](CONSORTIUM_INVITATION.md)
- Existing UX: [`KNOWLEDGE_BROWSER_UX.md`](../technical/KNOWLEDGE_BROWSER_UX.md)
- Buildable pieces: [`SENSORY_FIELD.md`](../technical/SENSORY_FIELD.md), [`PATCH_STUDIO.md`](../technical/PATCH_STUDIO.md)
