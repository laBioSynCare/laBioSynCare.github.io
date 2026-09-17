# Adoption: what has to exist before anyone can use SSTIM

**Status:** working plan, created 2026-09-17. Maintainer: Renato Fabbri.

This file owns one question, which nothing else here owns: **what must exist
before an outside party can adopt SSTIM, and what counts as having adopted it.**
It is the supply side.

It does not own who to contact or what to ask them
([OUTREACH_TARGETS.md](OUTREACH_TARGETS.md)), the interview programme
([INTERVIEW_TARGETS.md](INTERVIEW_TARGETS.md),
[INTERVIEW_PROTOCOL.md](INTERVIEW_PROTOCOL.md)), per-registry submission records
([REGISTRY_SUBMISSIONS.md](../ontology/REGISTRY_SUBMISSIONS.md)), external
records that point back at SSTIM
([INBOUND_REFERENCES.md](../ontology/INBOUND_REFERENCES.md)), or the master
five-workstream tracker ([ECOSYSTEM_INTEGRATION.md](ECOSYSTEM_INTEGRATION.md)),
which holds the positioning and the "one outside lab, one real published
protocol" milestone this file serves. A fact recorded in one of those is linked
from here, not restated.

---

## 1. Three different things get called adoption

**Citation.** An external record points at an SSTIM IRI, DOI or namespace.
Owned by [INBOUND_REFERENCES.md](../ontology/INBOUND_REFERENCES.md). Largely
achieved.

**Tooling.** Someone installs or runs something that speaks SSTIM. Nothing to
install today (§3).

**Data.** Someone publishes a protocol, session or assessment in SSTIM, under
their own namespace. **Only this one is adoption.** The other two exist to
produce it.

The distinction matters because the public record currently reads strongest
exactly where the project is weakest. A registry listing proves that SSTIM is
findable and well formed. It proves nothing about use, and it is easy to read a
row of green registry entries as evidence of something they were never
measuring.

---

## 2. The measurement

Per `CLAUDE.md` §3.6, every reading below names the instrument that produced it.

| Question | Instrument | Reading |
|---|---|---|
| Does any external record point at SSTIM? | `make wikidata-inbound`, `make registry-verify`, [INBOUND_REFERENCES.md](../ontology/INBOUND_REFERENCES.md) §1 | Yes, across registries, the scholarly graph, w3.org and Wikidata |
| Is there anything to install? | `curl` against `registry.npmjs.org/sstim`, `registry.npmjs.org/sstim-js`, `pypi.org/pypi/sstim/json`, 2026-09-17 | 404 on all three. The names are unclaimed |
| Has anyone outside encoded anything in SSTIM? | every instance file under `static/ontology/instances/` is single-author, as [USE_CASES_AND_REQUIREMENTS.md](USE_CASES_AND_REQUIREMENTS.md) states of its own source material; [PARTNERS.md](PARTNERS.md) records no formally active partner | No |
| Has the outreach been sent? | [OUTREACH_TARGETS.md](OUTREACH_TARGETS.md) target table and log | One target engaged (HED). Every other row reads `not-contacted`, and the log still reads "Pending first outreach" |

**One instrument is missing and should be built.** Nothing here reads whether
the artifacts are being *fetched*. The GitHub traffic snapshots cover repository
pages only, not Pages requests, w3id resolutions or BioPortal pulls. Zenodo's
REST record does carry view and download counters (`stats` on the record), and
they are readable today without credentials. Until something samples them, both
"nobody is using this" and "people are using this quietly" are guesses.

**A caveat that adoption pitches lean on.** The survey in
[ADR 0041](../decisions/0041-stimulus-description-layers-and-the-canonical-schema-gap.md)
that finds no existing engine-independent, multimodal, generative stimulus
standard carries its own warning: it is working knowledge, not a systematic
review. Do not put "no standard exists" in front of a standards audience without
doing that review first.

---

## 3. The on-ramp gap

Five artifacts. Three of them are only worth building once somebody is waiting,
which is what §6 sequences.

### A. An adopter on-ramp page

The closest thing that exists is the "How to use it" section of
[CURRENT_STATE.md](../ontology/CURRENT_STATE.md). It is correct, and it is
written for a reader who has already decided to adopt, inside a long status
document they have no reason to open.

*Done when:* a reader who has never heard of SSTIM can, in well under an hour,
choose a profile, fetch it, validate one file of their own, and know which IRIs
they may mint and which they may not.

### B. A starter set

The repository is not short of encoded data: two dozen instance files, ten
exploratory protocols, reference protocols, a synthetic reference session and
five preset seeds. What is missing is different in kind, a **minimal**
outsider-facing trio sized for copying rather than for covering the model.

*Done when:* three files exist (one protocol, one session, one preset), each
short enough to read at a glance, each passing `make validate`, each naming in a
comment the profile it targets and the namespace rule it obeys.

### C. A package to install

Namespace constants, manifest-driven profile loading, SHACL validation and term
lookup all exist here, as `src/rdf/` and as scripts under `scripts/`. None of it
is reachable by anyone else.

*Done when:* one install command followed by one validate command checks a
user's own file against a named profile at a pinned version IRI.

*Constraint:* the package must read modules, dependencies, graph IRIs and shape
modules from `static/ontology/manifest.json`, never from a directory listing.
Anything else teaches adopters the failure mode that
[CURRENT_STATE.md](../ontology/CURRENT_STATE.md) warns against.

*Secondary reason to do it early:* the names are unclaimed (§2), and a package
name is cheap to hold and expensive to lose.

### D. An exporter for a tool researchers already run

[ADR 0041](../decisions/0041-stimulus-description-layers-and-the-canonical-schema-gap.md)
classes PsychoPy and Psychtoolbox as de-facto experiment vocabularies,
implementations rather than standards. That is precisely what makes them an
adoption channel and not a competitor: an implementation is somewhere SSTIM can
be emitted *from*. Candidates: PsychoPy, jsPsych, OpenSesame, Lab Streaming
Layer.

*Done when:* a user of that tool produces a valid SSTIM session file without
having read any SSTIM documentation.

This is the highest-leverage item in the list, because it is the only one that
yields data adoption as a side effect of work somebody was doing anyway.

### E. An externalisable conformance claim

Profiles with SHACL contracts exist, and `make session-conformance` already
defines three levels with the third honestly skipped. Both can only be run from
inside this repository, by its maintainer.
[PATCH_STUDIO_CONFORMANCE_AND_NEUTRALITY.md](PATCH_STUDIO_CONFORMANCE_AND_NEUTRALITY.md)
holds the separation this must respect: public SSTIM conformance is not BSC
catalog compatibility.

*Done when:* a third party can run a check against their own file, obtain a
result naming a profile and a version IRI, and cite it; and there is a place to
record claims, with the rule stated that recording a claim is not endorsing it.

---

## 4. Segment map

"Unit of adoption" is the thing that, once it exists, makes the answer to §2
row 3 stop being "no".

| Segment | Unit of adoption | On-ramp it needs | Where the ask lives |
|---|---|---|---|
| **Adjacent standards** (HED, BIDS, NWB, W3C Audio CG) | An acknowledged crosswalk | None. Already works | [OUTREACH_TARGETS.md](OUTREACH_TARGETS.md), [HED_BIDS_INTEROP.md](HED_BIDS_INTEROP.md) |
| **Experiment-software toolchains** | A plugin that writes an SSTIM session | D | New, see §5 |
| **Scientists and labs** | One protocol encoded and cited | A, B | [OUTREACH_TARGETS.md](OUTREACH_TARGETS.md), [INTERVIEW_TARGETS.md](INTERVIEW_TARGETS.md) |
| **Ontology and knowledge engineers** | An alignment, a LOV record, a survey mention | Repair first (§6.1) | [REGISTRY_SUBMISSIONS.md](../ontology/REGISTRY_SUBMISSIONS.md) |
| **Applications** (meditation, sleep, XR, game audio, entrainment) | Import or export of a patch in SSTIM form | B, C, E | [PATCH_STUDIO_CONFORMANCE_AND_NEUTRALITY.md](PATCH_STUDIO_CONFORMANCE_AND_NEUTRALITY.md) |
| **Companies and device makers** (haptics, light and sound, transcranial stimulation, wellness hardware) | A conformance claim in their own documentation | E | [PARTNERS.md](PARTNERS.md) Tier C |
| **Websites and Wikidata** | Backlinks | Mostly done | [INBOUND_REFERENCES.md](../ontology/INBOUND_REFERENCES.md) |

Every one of these lands, if it succeeds, in a [PARTNERS.md](PARTNERS.md) tier.
Tier B (ontology contribution, lightweight, no data sharing, contributor
credited) is the natural destination for a first adopter and the one to lead
with.

---

## 5. Segments not previously tracked

Each with the reason it belongs and the reason it might not work.

- **Multi-sensory environments.** Snoezelen rooms, special education, dementia
  care. A large sector that delivers structured sensory input daily and has no
  shared vocabulary for it. *Risk:* the closest sector to a care setting, so
  `CLAUDE.md` §3.5 and [SCOPE.md](../concept/SCOPE.md) bind hardest here.
- **Accessibility and photosensitivity safety.** WCAG 2.3.1 and ITU-R BT.1702
  are the existing instruments; the flash-rate work in
  [PHOTOSENSITIVITY_SAFETY.md](../technical/PHOTOSENSITIVITY_SAFETY.md) is a
  genuine contribution and a citation hook that needs no clinical framing at
  all. *Risk:* narrow, and adjacent to a safety claim we must not make.
- **Educators and students.** A thesis that encodes protocols is cheap external
  adoption, and it is where an independent co-maintainer plausibly comes from,
  which is already a KPI in [OUTREACH_TARGETS.md](OUTREACH_TARGETS.md). *Risk:*
  slow, and student work rarely outlives the student.
- **AI agents and LLM tooling.** A tool-callable term lookup or an agent-facing
  server would make SSTIM the grounding layer for agents that design or describe
  stimulation. [SSTIM_LLM_COMPLEMENTARITY.md](../concept/SSTIM_LLM_COMPLEMENTARITY.md)
  already stakes the position and nothing implements it. *Risk:* see
  [AGENT_AUTOMATION_BOUNDARY.md](../technical/AGENT_AUTOMATION_BOUNDARY.md),
  which records what such a layer would have to respect.
- **Artists, composers and audiovisual performers.** Existing network, no
  regulatory exposure, produces public patches quickly. *Risk:* produces very
  little of what a standards or research audience counts as evidence.
- **Data repositories and archives.** OpenNeuro, EBRAINS, Zenodo communities.
  Adoption here is one deposited dataset carrying SSTIM. *Risk:* depends on a
  lab existing first, so it is downstream of the researcher segment.
- **Journals and reproducibility checklists.** "State your stimulation
  parameters" is a policy hook that creates demand rather than answering it.
  *Risk:* the slowest lever available, and it needs prior adoption to argue from.

**Consent.** The projects and organizations named in §4 and §5 are public
software projects and institutions, listed as candidate channels rather than as
records. The moment any of them is published as a stakeholder record, the
notify-and-honor and self-publication rules in
[ADR 0024](../decisions/0024-stakeholder-ecosystem-modeling.md) and
[ADR 0031](../decisions/0031-qualified-ecosystem-records.md) apply. No
individual is named in this file.

---

## 6. Sequence

1. **Repair before recruiting.** LOV is still absent and the DBpedia Archivo
   download fails, both measured and recorded in
   [REGISTRY_SUBMISSIONS.md](../ontology/REGISTRY_SUBMISSIONS.md). Sending an
   ontology-engineering audience to a record that returns a server error costs
   more than the record was ever going to earn.
2. **Build A and B.** Cheap, self-contained, dependent on nobody, and they make
   every later conversation shorter.
3. **Send the outreach that is already written.** The one data point available
   is that the HED approach produced three maintainer replies within two days, a
   meeting and a merged upstream fix. That is evidence the artifacts are good
   enough and the messages are not being sent.
4. **Build C.**
5. **Build D against whichever tool the first engaged lab actually uses.**
   Choosing before then is a guess with a large build attached.
6. **Build E when there is a claimant.**

**The demand-side lever outranks all five.** Nobody adopts a vocabulary; they
adopt something that gets their work cited. The cheapest first adoption is a
protocol we encode, they check, and we publish with their name on it. The
milestone in [ECOSYSTEM_INTEGRATION.md](ECOSYSTEM_INTEGRATION.md) already says
this. What this file adds is that the encoding labour should be ours: "nominate
a protocol and we will encode it" is a far smaller ask than "learn our
ontology", and it is the same outcome.

---

## 7. The weakest point in the pitch

BioSynCare does not consume SSTIM. `CLAUDE.md` §1 and §11 are explicit that no
converter or export pipeline exists, and that any future adapter is optional and
version-pinned. A careful reader will notice that the project's own application
does not use the interchange, and they will be right to.

Two honest positions are available, and only these two. Either build the
bounded adapter, within the constraints in
[PATCH_STUDIO_CONFORMANCE_AND_NEUTRALITY.md](PATCH_STUDIO_CONFORMANCE_AND_NEUTRALITY.md),
or do not present BioSynCare as a reference adopter. What must not happen is the
third thing, implying an integration that the documentation correctly says is
not there.

Note also that this is a product decision rather than an adoption decision, and
it stays subject to the separation in
[ADR 0007](../decisions/0007-framework-protocol-implementation.md): SSTIM
vendor-neutral, the reference environment open, BioSynCare closed.

---

## 8. What this file deliberately does not carry

- **No per-target status column.** Status lives beside the target in
  [OUTREACH_TARGETS.md](OUTREACH_TARGETS.md). Two status tables disagree within
  a month.
- **No live figures.** Counts of concepts, triples, presets and downloads drift;
  §2 names the instruments instead, which do not.
- **No outreach copy.** Templates are [INVITATION_TEMPLATE.md](INVITATION_TEMPLATE.md)
  and [CONSORTIUM_INVITATION.md](CONSORTIUM_INVITATION.md).
