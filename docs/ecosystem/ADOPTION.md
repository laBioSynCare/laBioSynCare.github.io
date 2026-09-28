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

### A. An adopter on-ramp page · **delivered 2026-09-17**

[ADOPTING_SSTIM.md](../ADOPTING_SSTIM.md). Seven steps from "should I bother"
to a validated file, none of them requiring a checkout of this repository. Its
curl commands and its `pyshacl` invocation were run against the live w3id
routes at a pinned release before it was written, not composed from the route
contract.

It also carries a "what is not here yet" section naming the four gaps below, on
the reasoning that a stranger finding them out by trying is worse than being
told.

Before it, the closest thing was the "How to use it" section of
[CURRENT_STATE.md](../ontology/CURRENT_STATE.md), which is correct but written
for a reader who has already decided to adopt, inside a long status document
they have no reason to open.

### B. A starter set · **delivered 2026-09-17**

[`examples/`](../../examples/), four files, gated by `make examples-check`.

The repository was never short of encoded data: two dozen instance files, ten
exploratory protocols, reference protocols, a synthetic reference session and
five preset seeds. What was missing was different in kind, a **minimal**
outsider-facing set sized for copying rather than for covering the model.

The set that shipped is a profile ladder rather than the protocol/session/preset
trio planned here, which was chosen before the module boundaries were read: a
Core stimulus description, the same file one profile step up, a protocol, and a
session. A preset is the least useful thing to hand an outsider, being
engine-dependent by definition, and it appears inside the session example where
it is actually load-bearing.

The gate is the part worth keeping. Each file is validated against the shapes of
the profile its own header declares, checked to use nothing outside that
profile's closure, and refused if it mints an IRI under `https://w3id.org/sstim`.
Containment is the check no existing gate made: SHACL says nothing about a
predicate it has never heard of, so an example can conform perfectly while using
terms the profile a consumer loaded does not contain. Three negative fixtures
inside the checker prove all three checks still reject.

Two rough edges surfaced by walking the adopter path are recorded in
[`examples/README.md`](../../examples/README.md): Core states a rendering's
carrier but not the signal's frequency extent, and a session specification
cannot exist without a preset.

### C. A package to install · **published 2026-09-18**

Two clients, one API. [`packages/sstim`](../../packages/sstim/) is the Python
one, gated by `make sstim-package` and published on PyPI.
[`packages/sstim-js`](../../packages/sstim-js/) is the JavaScript one, gated by
`make test` and published on npm as
[`@sstim/core`](https://www.npmjs.com/package/@sstim/core).

**It is scoped because npm refused the bare name.** `sstim` is blocked by npm's
anti-typosquatting filter as too similar to `ssri`, a very widely used package;
the name is not taken, it is refused. There is no appeal: npm's disputes policy
covers trademark claims only and explicitly does not resolve similarity blocks,
and the rule itself is undocumented and cannot be tested before publishing. A
scope bypasses the filter, so the `@sstim` npm organization was created and the
package lives there. That is the better identity anyway: it mirrors `sstim` on
PyPI and leaves room for further packages under one name.

Python came first because the researcher segment is the primary target of §6 and
`pyshacl` is the validator the on-ramp documents. JavaScript came second because
the applications segment is the one that can adopt without anyone's permission,
and because it lets the Workbench eventually consume its own published client,
which is the nearest available answer to §7.

**They are not equivalent, and the difference is reported rather than hidden.**
`rdf-validate-shacl` has no SPARQL constraint component, so `sh:sparql`
constraints cannot be evaluated in JavaScript. The Kernel, Core and Core Plus
shape graphs contain none, so those results match pySHACL exactly. The Full
shape graph contains 69 at 0.17.0, and the JavaScript client removes them,
counts them, and marks the result `PARTIAL` with that number rather than
reporting a conformance it did not establish.

*Done when* was one install command and one validate command against a named
profile at a pinned version IRI. Met, and verified the only way it can honestly
be: the wheel was built, unpacked somewhere with no knowledge of this
repository, and used to resolve, fetch and validate over the live network.

It reads profile closures from the manifest, never a directory listing, as the
constraint required. Two things emerged while building it that the constraint
did not anticipate.

**The stable manifest route serves the development line.**
`https://w3id.org/sstim/manifest` answers with the mutable `-dev` line, while
the RDF at `https://w3id.org/sstim` answers with the newest frozen release. An
adopter who fetches the first believing they pinned something has pinned
nothing. The client resolves the release instead, by reading `owl:versionIRI`
from the stable IRI, so no version constant is hardcoded and the default is
never the dev line. Worth deciding separately whether the two routes should
disagree in kind at all.

**The manifest's checksums make the fetch verifiable.** Every module carries a
sha256, and the served bytes match it (measured across three modules at 0.17.0).
The client verifies before parsing and refuses on mismatch, so a truncated
download cannot quietly become a conformance result. The cache is keyed by
checksum, which makes a stale cache entry impossible and repeat runs offline.

**Published as [`sstim`](https://pypi.org/project/sstim/) 0.1.0 on
2026-09-18**, on Renato's instruction. The claim was verified the only way that
means anything: the wheel was downloaded back from files.pythonhosted.org,
unpacked somewhere knowing nothing of this repository, and used to resolve,
fetch and validate over the live network.

Two operational notes for the next release. PyPI's JSON API answered 404 for
several minutes after the upload while the project page and the simple index
both served the release immediately, so read the simple index, never the JSON
API, when confirming a publish. And the package's `Project-URL` fields point at
the legacy origin rather than `w3c-cg/sstim`, because the documentation and
examples they link to resolve there and 404 on the W3C CG mirror, which sat at
the commit before this work. **Unblocked 2026-09-20:** the mirror was pushed
current and both targets answer 200, measured with `curl` against
`raw.githubusercontent.com/w3c-cg/sstim/main/docs/ADOPTING_SSTIM.md` and the
same path for `examples/README.md`. Repoint the fields at the next release.
`make push` keeps the mirror current from now on (`CLAUDE.md` §3.7).

**`sstim` 0.2.0 published to PyPI 2026-09-28**, on Renato's instruction, with
the session builder of [ADR 0058](../decisions/0058-session-builder-in-the-clients.md),
offline validation for a pinned release, and the `Project-URL` fields repointed
at `w3c-cg/sstim` as deferred above. Verified the same way: the published
wheel's sha256 matched the local build, and installed from
`files.pythonhosted.org` into an empty directory with an empty cache it
resolved 0.18.0 over the live network, validated and wrote a session in Full,
then validated it again offline from the cache, from Python and the command
line. PyPI was in a maintenance window: the plain HTML simple index and pip's
view lagged for over 15 minutes while the JSON simple index was current.

**Measured again at 20:17 UTC the same day, and pip still resolves 0.1.0.**
PyPI's CDN caches the simple index per content encoding. The uncompressed
copy lists 0.1.0 and 0.2.0; the gzip copy, which is the one pip requests,
still lists only 0.1.0 about ten hours after the upload, with PyPI's status
back to operational. So `pip install sstim` installs 0.1.0 until that copy
refreshes, while installing the wheel by URL works. Recheck with
`pip download --no-deps sstim==0.2.0`, which uses pip's own request, not
with `curl`, which does not ask for gzip.

**`@sstim/core` 0.2.0 published to npm 2026-09-28**, after two things were
fixed on the way. The token that published 0.1.x (granular, created
2026-09-18) had expired, and a fresh `npm login` cannot publish because the
account has no two-factor authentication; a new granular token did. And npm
11.20 drops a bin written `./src/cli.js` at publish time, so the first attempt
would have shipped without its command had the 403 not stopped it; it is now
`src/cli.js`, guarded by a test (`caf77a5`). Verified from the registry into
an empty directory with an empty cache: the installed `sstim` command runs
through npm's symlink, both `@sstim/core` and `@sstim/core/session` import,
a session validates in Full over the live network (reported `PARTIAL`, 69
SPARQL constraints unevaluated, as designed) and again offline from the cache.
The esm.sh address the jsPsych example's import map names loads in headless
Chrome and builds a session.

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

**The tool-neutral half is built, 2026-09-27.** Every exporter needs the same
core: a stated clock, the stimulus, the events, and a graph Full accepts. That
is not a guess about which tool, so it shipped ahead of the gate as a session
builder in both clients
([ADR 0058](../decisions/0058-session-builder-in-the-clients.md)), with three
short tested examples in [`examples/tools/`](../../examples/tools/): a PsychoPy
flicker block, a jsPsych auditory steady-state block, and an LSL marker
converter. What stays gated is the packaged plugin. A generic toolkit knows
*when* a stimulus appeared, not *what* it was, because the 40 Hz lives in the
user's code; meeting the *done when* above therefore means a stimulus component
that both presents and describes, which is the large build, and for flicker
one that carries photosensitivity obligations.

**Candidate tools, ranked by fit rather than popularity.** Fit means where
SSTIM's domain (rhythmic and steady-state stimulation, entrainment,
neuromodulation) meets its event-and-clock session model. Kept here so the list
is not re-derived each time a lab names one.

| Rank | Tool | Why | Cost and risk | Status |
|---|---|---|---|---|
| 1 | **Lab Streaming Layer** (XDF) | Tool-agnostic: PsychoPy, OpenSesame, Unity and some stimulation hardware already send marker streams, and EEG labs record XDF anyway, so one converter reaches every tool that sends markers. LSL's clock synchronisation fits the stated-clock model | Python, on the Python client. A marker cannot say what the stimulus was, so that is declared once per protocol | example: [`lsl_markers.py`](../../examples/tools/lsl_markers.py) |
| 2 | **PsychoPy** (and PsychoJS) | The most used open experiment toolkit; steady-state visual and auditory paradigms are routine in it | Python, on the Python client. Its clock is monotonic, not the audio device's, which exposes a timing-authority gap (ADR 0058) | example: [`psychopy_flicker.py`](../../examples/tools/psychopy_flicker.py) |
| 3 | **jsPsych** | Browser experiments, the same runtime as the Workbench and `@sstim/core`; its AudioContext gives an audio-hardware clock | JavaScript, on the JavaScript client | example: [`jspsych-assr.js`](../../examples/tools/jspsych-assr.js) |
| 4 | **MNE-Python**, as a reader | Loading an SSTIM session as MNE annotations gives analysts a reason to ask for SSTIM files from whoever collects the data | Cheap on the Python client. An importer, not an exporter | not started |
| 5 | **OpenSesame** | Python, runs on PsychoPy or its own backends | Covered largely by the PsychoPy and LSL routes | not started |
| 6 | **Psychtoolbox** | Large in vision and steady-state flicker research | MATLAB, and there is no MATLAB client | not started |
| 7 | **Audio environments** (SuperCollider, Pure Data, Max) and **Unity** | The applications and artists segments of §4 | Low evidentiary weight for a research audience | not started |
| n/a | **Device makers** (tES, TMS, light and sound hardware) | Better served by a conformance claim in their own documentation | See E below | n/a |

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
2. **Build A and B.** ✅ Done 2026-09-17. Cheap, self-contained, dependent on
   nobody, and they make every later conversation shorter.
3. **Send the outreach that is already written.** The one data point available
   is that the HED approach produced three maintainer replies within two days, a
   meeting and a merged upstream fix. That is evidence the artifacts are good
   enough and the messages are not being sent.
4. **Build C.** ✅ Both clients published 2026-09-18: `sstim` on PyPI, `@sstim/core` on npm.
5. **Build D against whichever tool the first engaged lab actually uses.**
   Choosing before then is a guess with a large build attached. The
   tool-neutral half was not a guess and shipped 2026-09-27 (ADR 0058, three
   examples); only the packaged plugin waits.
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
