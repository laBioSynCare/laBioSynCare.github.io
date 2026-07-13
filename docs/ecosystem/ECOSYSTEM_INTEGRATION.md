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
Patch Studio, and Sensory Field are live. The bottleneck is therefore **social
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
  (Accepted 2026-07-12): a new `sstim-ecosystem` RDF module + a notify-and-honor
  consent posture for recording real people/organizations. → Workstream 5.

**Already ours (the source re-derived it; adds nothing):** the three-layer model
([`ROADMAP.md`](../../ROADMAP.md) Vision), and the vendor-neutral-SSTIM /
open-BSC-Lab / closed-BioSynCare separation ([ADR 0007](../decisions/0007-framework-protocol-implementation.md),
`CLAUDE.md` §5.1). Keep these as the frame; they are settled.

**Guardrails / caveats (carry forward, do not lose):**

- **Version discipline.** The citable release is **SSTIM 0.6.0** (frozen, Zenodo);
  **0.7.0-dev is the live development line** (per [`TODO.md`](../../TODO.md)
  current focus). External copy must distinguish development sources from the
  immutable 0.6.0 release.
- **Do not hard-code live figures** (quad counts, concept counts, preset counts)
  from the source conversation into any doc — they drift; cite the live app instead.
- **`01-Audiovisual_Entrainment.pdf`** (external, *not* in this repo) reportedly
  makes remission / IQ-increase / near-absolute-safety claims. It must **not** lead
  academic outreach, and if it ever enters the repo it must first be reconciled
  with the no-medical-claims invariant (`CLAUDE.md` §3.5, [`SCOPE.md`](../concept/SCOPE.md)).

---

## Workstream 1 — Reconcile "proposed" vs. "launched" group status

**`[x] Done — 2026-07-12. Status confirmed; all status/governance wording and the pre-submission artifacts reconciled to launched-group framing.**

The docs contradict each other and reality on whether the W3C Sensory Stimulation
Community Group is *proposed* or *launched*. The source conversation says it is
launched with four participants and Juliana Andrade + Renato Fabbri as chairs.

**Verified contradictions:**

| File / line | Current wording | Problem |
|---|---|---|
| [`ROADMAP.md`](../../ROADMAP.md) :257 | "The W3C Community Group is launched." | Present-tense claim (Phase 2 goal framing) |
| [`CONTRIBUTING.md`](../../CONTRIBUTING.md) :324 | "W3C CG charter \| CG chair + CG participants" | Assumes chair/participants **exist** |
| [`CONTRIBUTING.md`](../../CONTRIBUTING.md) :325 | "SSTIM namespace governance \| W3C CG (when constituted)" | Assumes **not yet** constituted — self-contradiction |
| [`CONTRIBUTING.md`](../../CONTRIBUTING.md) :330 | "governed … once constituted … Until the CG is constituted, Renato Fabbri maintains editorial control." | Treats group as future |
| [`SCOPE.md`](../concept/SCOPE.md) :36, :149 | "the proposed group" | Treats group as proposed |
| [`NON_SCOPE.md`](../concept/NON_SCOPE.md) | "the proposed W3C Community Group" | Treats group as proposed |
| [`INVITATION_TEMPLATE.md`](INVITATION_TEMPLATE.md) :11, :17 | "the proposed group" | Treats group as proposed |
| [`CHARTER.md`](../../CHARTER.md) | "draft charter for the proposed …" | Treats charter as draft |
| [`W3C_COMMUNITY_GROUP_PROPOSAL.md`](W3C_COMMUNITY_GROUP_PROPOSAL.md) | framed as a proposal | May need a status banner |

**Resolved status (2026-07-12, confirmed by Renato):** option (b). The **W3C
Sensory Stimulation Vocabulary Community Group is launched** (chairs: Juliana
Braga de Salles Andrade + Renato Fabbri; four participants), but its **charter is
not yet ratified**. Until ratification, **Renato Fabbri retains editorial control**
of the SSTIM namespace; governance transfers to the CG on ratification.

**Canonical phrasing to reuse:** *"The W3C Sensory Stimulation Vocabulary
Community Group is launched; its charter is not yet ratified, and editorial
control of the SSTIM namespace remains with Renato Fabbri until ratification."*

**Done — clean status/governance fixes (2026-07-12):**
- [x] `CONTRIBUTING.md` — namespace governance now tied to charter ratification
      (fixes the self-contradiction); editorial control stated as Renato's until then.
- [x] `SCOPE.md` (×4) + `NON_SCOPE.md` — dropped the "proposed" qualifier; the
      group's scope is unchanged by launch.
- [x] `docs/README.md` (×2) — dropped "proposed"; CHARTER described as
      "launched; charter not yet ratified".

**Done — pre-submission artifacts converted to launched-group framing (Renato approved 2026-07-12):**
- [x] `CHARTER.md` — status line → "launched; charter not yet ratified"; "Proposers
      and Initial Contacts" → "Chairs and Participants" (roster deferred to the W3C
      page); "Next Steps Before W3C Submission" → post-launch next steps (submission
      marked done, charter ratification pending).
- [x] `INVITATION_TEMPLATE.md` — "support the *proposal*" → "join the launched group".
- [x] `CONSORTIUM_INVITATION.md` — "*proposed* … *founding* participation" → launched-group participation.
- [x] `TODO.md` W3C section — submission/account/launch tasks marked done; charter-ratification task added.
- [x] `ROADMAP.md`, `PARTNERS.md`, `TODO.md` (CG-name decision) — the residual
      "≥5 founding members" launch gate reconciled to launched + the growth KPI.
- [x] **Tension resolved:** the "don't launch below 5" gate is overtaken; participant
      growth folds into the W3C-growth KPI (4 → ≥12) in Workstream 3.

**Note on names:** the charter now defers the chair/participant roster to the
group's W3C page (the authoritative record) rather than hardcoding individuals,
consistent with the [ADR 0024](../decisions/0024-stakeholder-ecosystem-modeling.md)
consent posture.

---

## Workstream 2 — SSTIM ↔ HED event profile and research bindings

**`[~] Revised 2026-07-13 — Proposed ADR + RDF plan written; implementation prerequisites and worked example remain.**

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
| IDs, onset/duration, execution state | Native session/event bundle | Recorder/schema not implemented |
| Experimental event meaning | Generated HED annotations | Mapping/validator not implemented |
| Stimulus, exposure, reports, provenance | SSTIM RDF/JSON-LD | Model exists but audit repairs are required |
| Executable stimulus | BSC Lab patch/configuration + hashes | Patch export exists; bridge/provenance incomplete |
| Optional research packaging | Complete BIDS Behavioral binding | Not implemented |

The [2026-07-13 RDF audit](../ontology/reviews/2026-07-13-rdf-knowledge-representation-audit.md)
shows that this requires a native recorder/schema, report/privacy semantics, and
runtime RDF conformance before the HED and BIDS adapters. Existing Sensory Field
and Patch Studio exports are inputs, not a finished bridge.

**Next actions:**
- [x] Revise the event/binding profile and Proposed ADR.
- [x] Audit the RDF and write the ordered remediation plan.
- [ ] Implement and validate the native session/event/report contract.
- [ ] Generate a version-pinned HED mapping and synthetic core bundle.
- [ ] Add and validate the optional complete BIDS Behavioral binding.
- [ ] Request HED Working Group review.

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
> or in the Workstream 5 RDF module — the **notify-and-honor** posture applies:
> notify best-effort, record `recordSource`, honor objections/removals promptly.
> `PARTNERS.md` / `ADVISORY_BOARD.md` are the *consent-of-record* for named people;
> confirmed entries mirror into RDF. The ask stays *"encode/reproduce a protocol,"*
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
- [ ] Actual outreach to each target (notify-and-honor attaches on first contact — [ADR 0024](../decisions/0024-stakeholder-ecosystem-modeling.md)).
- [ ] Decide the Charter-endorsement question for BioSynCare (ethical commitment only).

---

## Workstream 4 — The public entrance (audience model, deepened)

**`[~] Spec written 2026-07-12 — [`PUBLIC_ENTRANCE.md`](../technical/PUBLIC_ENTRANCE.md)
(IA + per-door copy + route map). Implementation is Phase 2 UX (`src/routes/`);
awaits Renato's confirmation of door order + hero copy.**

**Problem the source named:** the live root drops an unfamiliar visitor straight
into an ontology graph + a photosensitivity notice. It signals technical
seriousness but does not say *"here is the shared problem; here is the community;
bring us one protocol."* The starting idea was a three-door entrance
(Researcher / Implementer / Institution). That is too narrow — it ignores the
people who arrive **before** they are any of those.

> **Personas ≠ stakeholders.** These personas are *anonymous audience archetypes*
> for entrance UX. They are distinct from the *real, named* people/organizations
> modeled per [ADR 0024](../decisions/0024-stakeholder-ecosystem-modeling.md)
> (Workstream 5). The two connect: the ADR's `relationshipType` scheme
> (research-collaborator, scientific-advisor, standards-body, funder,
> institutional-host, community-member, …) is the formal RDF vocabulary that
> parallels these roles, and the graph-browser "Stakeholders" scope is content that
> serves the Researcher and Standards-peer personas (3, 5). Keep persona labels and
> `relationshipType` values aligned where they overlap.

### Persona catalog (expanded)

| # | Persona | Mindset | Wants | Primary action(s) |
|---|---|---|---|---|
| 1 | **Curious newcomer / general public** | "What even is this?" | Plain-language orientation + a safe taste | *See what this is* → 60-sec explainer; *Try a safe demo* |
| 2 | **Appreciator / user / self-experimenter** | "Let me feel/use it" | Sessions, presets, instruments | *Start a session* / *Browse presets* / *Open the studio* |
| 3 | **Researcher** (sensory / neuro / psychophysics) | "Can I reproduce or encode a protocol?" | Ontology, evidence tiers, SPARQL, citation | *Encode a protocol* / *Explore the ontology* / *Cite SSTIM* |
| 4 | **Implementer / developer** | "Can I build on this?" | Architecture, run-local, engines, license | *Read the architecture* / *Run it locally* / *Build an engine* |
| 5 | **Standards / ontology peer** (W3C, HED/BIDS, OBO) | "Is the vocabulary sound? Can I align terms?" | The TTL, alignments, review path, crosswalk | *Join the W3C group* / *Review the ontology* / *Propose a crosswalk* |
| 6 | **Institution / partner / funder / policy** | "Is this credible and safe to associate with?" | Governance, IP, responsible-neurotech alignment | *Partner with us* / *Read governance* / *Join the consortium* |
| 7 | **Contributor / community member** | "How do I help?" | Translation, annotation, docs, protocols, issues | *Contribute a protocol* / *See open work* / *Join the group* |

### From 7 personas to 4 doors (seven flat doors is bad IA)

Group by *intent*; each door fans out. Personas can appear under more than one door.

- **① Experience it** — personas 1, 2 → *"See what this is"* · *"Try a safe session"*
- **② Understand & reproduce** — personas 3, 5 → *"Explore the ontology"* · *"Encode / reproduce a protocol"* · *"Query with SPARQL"*
- **③ Build on it** — persona 4 → *"Run it locally"* · *"Read the architecture"* · *"Extend an engine"*
- **④ Join & partner** — personas 5, 6, 7 → *"Join the W3C group"* · *"Contribute a protocol"* · *"Partner / consortium"*

### The two conversion actions (surface everywhere)

Regardless of door, the two actions that turn a visitor into a participant are:

- **"Join the W3C group"**
- **"Contribute a protocol"**

These are the social-conversion levers the ecosystem needs; they should be
reachable from every door, not buried in one.

### Constraints on entrance copy

- **No medical claims.** All entrance strings use the permitted wellness verbs
  (support, facilitate, encourage, guide, invite) — `CLAUDE.md` §3.5,
  [`SCOPE.md`](../concept/SCOPE.md). No "treat/cure/proven."
- **Safety without a wall.** Personas 1–2 must pass through the photosensitivity
  safety layer ([`PHOTOSENSITIVITY_SAFETY.md`](../technical/PHOTOSENSITIVITY_SAFETY.md)),
  but it should route them into a *safe* demo, not block the front door with a warning.
- **One-liner (positioning):** *"Open standards and reference infrastructure for
  responsible sensory stimulation and sensory neurotechnology, with BioSynCare as
  one separate commercial implementation."* — candidate for README / landing;
  refine before shipping.

**Next actions:**
- [x] Draft entrance copy per door (§3.5-compliant) — done in [`PUBLIC_ENTRANCE.md`](../technical/PUBLIC_ENTRANCE.md).
- [~] Door order decided (**Understand leads**, 2026-07-13); hero copy still to confirm.
- [ ] Wireframe the four-door grid + conversion bar; decide the graph browser's new home (`/graph` vs. section).
- [ ] Fold into [`KNOWLEDGE_BROWSER_UX.md`](../technical/KNOWLEDGE_BROWSER_UX.md) and open a `src/routes/` build task (Phase 2).

---

## Workstream 5 — Stakeholder-ecosystem RDF module (ADR 0024 implementation)

**`[~] In progress. Decision Accepted ([ADR 0024](../decisions/0024-stakeholder-ecosystem-modeling.md), 2026-07-12); term module and validation plumbing implemented on `0.7.0-dev`, browser scope and curated instances remain.**

ADR 0024 decides *how* real people and organizations in sensory stimulation get
modeled: a new `sstim-ecosystem` term module (`sstim-eco:`), reusing
schema.org / ORG / FOAF, verified external IDs (ORCID / ROR / Wikidata), an
engagement/relationship layer, and a **notify-and-honor** consent lifecycle.
Instances are curated implementation data at `/organization/{id}` and
`/specialist/{id}` — **never** in the reusable term space, **never** in the Zenodo
snapshots, so a removal request affects live data + git history only and no
DOI-archived snapshot ever contains a person's data.

This is the RDF counterpart to Workstreams 3–4: an outreach target (W3) becomes a
recorded stakeholder here once notified/confirmed, and the graph-browser
"Stakeholders" scope serves the Researcher / Standards-peer personas (W4).

**Implementation follow-ups (from the ADR):**
- [x] `static/ontology/sstim-ecosystem.ttl` — neutral umbrella
      `sstim-eco:EcosystemAgent`, relationship/engagement properties, and the
      controlled relationship vocabulary.
- [x] SHACL shape in `sstim-shapes.ttl` for the engagement/consent fields.
- [x] Loader, export/snapshot, quality-audit, JSON-LD-context, VoID, and
      publication-route plumbing.
- [ ] Graph-browser "Stakeholders" scope + loader entries.
- [ ] First seed: organizations first, then consented public figures — each with
      `recordSource` and a notification record.
- [ ] Reconcile with `PARTNERS.md` / `ADVISORY_BOARD.md` (consent-of-record for named people).

**Guardrail:** every named individual requires `recordSource` + notify-and-honor;
no record implies endorsement, affiliation, or clinical efficacy (ADR 0024
Governance; `CLAUDE.md` §3.5).

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
