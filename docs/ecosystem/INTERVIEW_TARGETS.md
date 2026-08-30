# Interview Targets

> **Status: working registry (not as-built).** Who to interview, why, what each
> interview is expected to produce, and how it is prioritized. The consent,
> attribution and withdrawal rules are in
> [`INTERVIEW_PROTOCOL.md`](INTERVIEW_PROTOCOL.md) and are binding on every
> interview listed here. Institutional and event outreach lives in
> [`OUTREACH_TARGETS.md`](OUTREACH_TARGETS.md); confirmed partners graduate to
> [`PARTNERS.md`](PARTNERS.md); named people recorded in RDF follow
> [ADR 0024](../decisions/0024-stakeholder-ecosystem-modeling.md) and
> [ADR 0031](../decisions/0031-qualified-ecosystem-records.md).

The pipeline this registry feeds ran once already: the 2026-07-22 Theo Marins
interview produced [ADR 0035](../decisions/0035-participant-engagement-mode-and-endogenous-self-regulation.md),
[ADR 0036](../decisions/0036-neurostimulation-neuromodulation-senses-and-self-directed-split.md),
the neuromodulation module terms, and release 0.10.0. It also left an
attribution gap that is still open, which is why the protocol document exists
and why it precedes the next substantive external interview.

---

## Two tracks, kept apart

| | Track A: SSTIM contribution | Track B: product discovery |
|---|---|---|
| Purpose | Terms, ADRs, encoded protocols, evidence review, CG participants | BioSynCare positioning, pricing, adoption |
| The ask | "Encode, reproduce, or review a protocol" | "Would you use or buy this" |
| Output | ADR, terms, instance TTL, evidence claims, review notes | Internal product notes |
| Consent regime | ADR 0024 / 0031 per [`INTERVIEW_PROTOCOL.md`](INTERVIEW_PROTOCOL.md) | Ordinary commercial confidentiality |
| Enters the public ecosystem graph | Yes, on granted consent | **Never** |
| Belongs to | The W3C CG and SSTIM | BioSynCare |

Merging the tracks is the failure mode the neutrality posture exists to prevent:
it makes the Community Group look like a BioSynCare promotional wrapper. B2B
buyers, HR and corporate-welfare managers, insurers and end users are legitimate
Track B interviews. They are not CG activation and are not listed here.

**The boundary is load-bearing in the priority columns too.** "Strategic" below
means strategic to SSTIM's scientific credibility and to the claims BSC Lab
publishes openly. It does not mean useful for product positioning. If a
candidate's value is that they would help sell something, they belong in Track B,
whatever their scientific standing.

---

## Three interview types

Type determines the expected output and the governance weight. It does **not**
determine value: an expert review that demolishes a modelling decision is worth
more than a contribution interview that adds a synonym.

| Type | Expected output | Governance | Moves the attribution metric |
|---|---|---|---|
| **Contribution** | An ADR, terms, and/or an encoded protocol instance | Full: consent for quotation, attribution, and RDF representation | Yes |
| **Expert review** | Validation or refutation of existing modelling, evidence tiers, scope notes | Consent for quotation and for attribution on the review artifact | Only if the reviewer accepts attribution |
| **Exploratory** | Private notes, a map of the field, unknown unknowns, candidate leads | Light: consent to take notes; nothing public, nothing in RDF | No |

**CG membership is a separate, optional outcome of any type.** It is never an
eligibility condition. Making it one would bias selection toward cooperative
contributors and away from the people most capable of finding our errors, which
is the opposite of what an ontology under review needs.

**But keep the metric visible.** Every public protocol, experiment and preset in
SSTIM currently carries one `dct:creator`. Expert review and exploratory
interviews do not change that, and a programme made only of those would leave
the single-author problem exactly where it is. Maintain a floor: at least half
of Track A interviews in any quarter should be contribution type.

## Selection rule

Every Track A interview must satisfy (1). Type is then chosen by what else is
true.

1. **It closes a named slot, or tests one.** An empty or thin part of the graph,
   an open modelling question in a Proposed ADR, or an evidence claim that has
   never been challenged by someone qualified to challenge it.
2. **They have a protocol to hand over.** If yes, prefer contribution type.
3. **They are positioned to find errors.** If yes, prefer expert review, and do
   not let a "no" on (2) or on CG membership disqualify them.

Exploratory interviews are exempt from (1) when the objective is explicitly
discovery: mapping a subfield, finding out what the field thinks it needs, or
identifying who the real candidates are. Record the objective before the call so
"exploratory" does not become a label applied afterwards to an unfocused one.

---

## Recruiting vocabulary

"Brainwave entrainment" is a consumer label and a poor search term. Most
relevant researchers would not use it about themselves. Search instead for:

```text
auditory steady-state response (ASSR)   steady-state visually evoked potential (SSVEP)
neural entrainment                      neural oscillations
rhythmic sensory stimulation            photic driving
frequency tagging                       phase locking / phase entrainment
closed-loop auditory stimulation        40 Hz sensory stimulation / GENUS
```

For the practice side, the productive terms are "multisensory environment",
"Snoezelen", "sensory integration", "sensory room", "sensory modulation".

---

## Measured coverage baseline

Measured 2026-08-22 over the manifest-owned modules. Regenerate before quoting:
the counts move with every release, and a stale figure here is exactly the kind
of inherited claim `CLAUDE.md` §3.6 exists to stop.

| Modality in `SensoryModalityScheme` | Techniques asserting it |
|---|---|
| Auditory | 26 |
| Visual | 3 |
| Somatosensory | 3 |
| **Vestibular** | **0** |
| **Olfactory** | **0** |
| **Interoceptive** | **0** |

39 technique concepts in `TechniqueScheme`. Ten assert no modality (DBS, ECT,
rTMS, tACS, tDCS, ultrasound, VNS, intrathecal, biofeedback, neurofeedback):
correct by design, since they do not enter by a sensory route, and not a gap.

**Read this table narrowly.** It counts `sstim:techniqueModality` on technique
concepts, nothing else. SSTIM has a second, larger modality list on the exposure
side (`sstim-ex:PerceivedModality`, 12 concepts including gustatory,
proprioceptive and multimodal), and olfactory and gustatory exposure *is*
modeled, in
[`smell-taste-device-boundary.ttl`](../../static/ontology/instances/experiments/smell-taste-device-boundary.ttl).
The two divergent modality lists are the known open problem P5.5 in
[`SENSORY_TAXONOMY_REVIEW.md`](../ontology/SENSORY_TAXONOMY_REVIEW.md). So a zero
here means "no technique enters by this route", not "SSTIM cannot describe this".

`capabilityScentDelivery`, `capabilityThermalActuation`, `capabilityWearableLightArray`,
`mediumOlfactoryChemicalExposure` and `mediumThermalContact` exist with zero
techniques using them: sockets with nothing plugged in.

```bash
python3 - <<'PY'
import glob
from rdflib import Graph, Namespace
from rdflib.namespace import SKOS
from collections import Counter
g = Graph()
for f in glob.glob('static/ontology/sstim-*.ttl'): g.parse(f, format='turtle')
S = Namespace("https://w3id.org/sstim#"); V = Namespace("https://w3id.org/sstim/vocab#")
c = Counter()
for t in g.subjects(SKOS.inScheme, V.TechniqueScheme):
    ms = [str(o).split('#')[-1] for o in g.objects(t, S.techniqueModality)]
    for m in ms or ['(none)']: c[m] += 1
print(c.most_common())
PY
```

---

## Track A: the interview matrix

Two independent priority scores, because graph sparsity alone is a bad ranking
function. A modality at zero is a completeness fact, not automatically a
strategic one.

- **Gap (G1 to G3):** how empty or contested the slot is. G1 is a zero or an
  open Proposed ADR.
- **Strategic (S1 to S3):** how much SSTIM's scientific credibility and BSC Lab's
  published claims depend on getting this right. S1 means a wrong answer here
  damages something we already assert in public.

Work the union of G1 and S1 first. Where they disagree, S1 wins on scheduling
and G1 wins on scope: a strategically urgent interview happens sooner, a
gap-closing interview produces more terms.

Status: `not-contacted` / `contacted` / `scheduled` / `interviewed` / `encoded`
(ADR and terms landed) / `attributed` (contributor recorded, consent granted) /
`declined`.

| G | S | Type | Axis | Slot it closes or tests | Ideal interviewee | Candidate / institution | Status |
|---|---|---|---|---|---|---|---|
| G1 | S1 | Contribution | Non-invasive neuromodulation | Done: ADR 0035/0036. Attribution outstanding | (complete) | Theo Marins | interviewed, attribution pending |
| G1 | S1 | Contribution | Interoceptive and respiratory | `modalityInteroceptive` = 0, yet `cautionUltraSlowBreathing` exists and guided breathing is a published BSC component. The emptiest slot under the most-asserted claim | Respiratory psychophysiology or HRV biofeedback | *(to identify; Juliana's network is the cheapest route)* | not-contacted |
| G1 | S1 | Expert review | Photosensitivity and flash safety | `ExposureLimit`, `ComfortBoundary`, the photosensitivity gate. Tests thresholds we already ship | Epileptologist or standards-side flash-safety specialist | *(to identify)* | not-contacted |
| G1 | S2 | Contribution | Named methods and schools | [ADR 0030](../decisions/0030-named-methods-and-schools.md) is Proposed and undecided. Largest deployed practice, zero coverage | Snoezelen / MSE practitioner, or occupational therapist in Ayres SI | *(to identify)* | not-contacted |
| G1 | S2 | Contribution | Olfactory and gustatory | `modalityOlfactory` = 0 on the technique side; `capabilityScentDelivery` unused. Also probes the P5.5 two-list problem | Multisensory HCI, scent delivery, or olfactory-training clinician | UCL Multi-Sensory Devices Group (Marianna Obrist), already in `OUTREACH_TARGETS.md` | not-contacted |
| G1 | S3 | Contribution | Vestibular | `modalityVestibular` = 0. Cheapest zero to close: GVS parameters are unambiguous | Vestibular neuroscience or vestibular rehabilitation | *(to identify)* | not-contacted |
| G3 | S1 | Expert review | Auditory entrainment and ASSR | Not term expansion. Tests `EvidenceAssessmentClaim` tiers and the scope notes on `techBinauralBeats`, `techMonauralBeats`, `techIsochronicTones` | ASSR, frequency-tagging or auditory-entrainment researcher; ideally a published skeptic | *(to identify)* | not-contacted |
| G2 | S1 | Expert review | Semantic web and ontology review | KPI "≥1 external institutional reviewer or co-maintainer" is at zero | Biomedical ontology engineer | *(to identify)* | not-contacted |
| G2 | S2 | Contribution | Sleep | `techClosedLoopAuditory` is a term with no protocol behind it, and closed-loop slow-oscillation stimulation is its defining paradigm | Sleep neuroscience, closed-loop auditory stimulation | *(to identify)* | not-contacted |
| G2 | S2 | Contribution | Aging, dementia, gamma | `techGamma40Auditory`; bridges to the ADR 0030 practice gap through MSE in dementia care | GENUS-lineage researcher, or dementia-care MSE lead | *(to identify)* | not-contacted |
| G2 | S2 | Contribution | Pain, migraine, sensory hypersensitivity | Inverts the frame into `ComfortBoundary` and exposure limits: what must be recorded for a protocol to be declared unsuitable for a cohort | Migraine or chronic pain researcher; sensory sensitivity specialist | *(to identify)* | not-contacted |
| G2 | S2 | Contribution | Visual and rhythmic visual stimulation | Visual at 3 of 39. SSVEP and flicker parameters, display limits | Visual neuroscience, SSVEP or frequency tagging | *(to identify)* | not-contacted |
| G2 | S3 | Contribution | Haptics | Somatosensory at 3 of 39. Actuator capability vocabulary, body placement | Haptics researcher or wearable haptics maker | *(to identify)* | not-contacted |
| G2 | S3 | Contribution | Thermal and chemesthesis | `mediumThermalContact` unused; flagged in `SENSORY_TAXONOMY_REVIEW.md` | Thermal haptics or chemesthesis researcher | *(to identify)* | not-contacted |
| G2 | S3 | Contribution | Music therapy and rhythm | `techMusicStructural`, `techRhythmicAuditoryCueing` are stubs. RAC in gait rehabilitation is a real encodable protocol | Music therapist, or rhythm and gait researcher | *(to identify)* | not-contacted |
| G3 | S1 | Expert review | Attention and cognitive control | Tests `mechAttentional` and the attentional claims in the Symmetry scope notes | Attention researcher or psychophysicist | *(to identify)* | not-contacted |
| G2 | S2 | Expert review | Event annotation standards | ADR 0025 HED mapping: review one SSTIM to HED worked example | HED Working Group | in `OUTREACH_TARGETS.md` | engaged — public replies from three maintainers, 2026-08-25 meeting with Kay Robbins, and 11-event follow-up sent 2026-08-28 |
| G3 | S2 | Expert review | Neurotechnology ethics | Non-scope boundary: where a wellness vocabulary must refuse to go | Responsible neurotechnology researcher | European Brain Council orbit | not-contacted |
| G2 | S3 | Contribution | Contemplative practice | A named-methods case under ADR 0030, not a neuroscience case | Meditation or breathwork teacher | *(to identify)* | not-contacted |
| G3 | S2 | Expert review | Web audio and timing | Patch Studio and the three-clock architecture, not SSTIM terms | W3C Audio CG | in `OUTREACH_TARGETS.md` | not-contacted |
| n/a | n/a | Exploratory | Field mapping, Italy | Objective: identify real candidates for the rows above | Any | UNIMORE, UNIPR, IIT, UERJ/IPRJ orbits | not-contacted |

## Track A block: the core concept itself

Separate from the matrix above, because these interviews answer a different kind
of question and carry a different evidence order. The instrument, the relation
taxonomy and the sense-inventory schema are in
[`SENSORY_STIMULATION_SENSE_REVIEW.md`](../ontology/SENSORY_STIMULATION_SENSE_REVIEW.md).

**Interviews are the third evidence stream here, not the first.** Terminological
analysis (MeSH, SNOMED CT, UMLS, Wikidata, OBI/EFO) needs no informants and
starts immediately; corpus and literature analysis supplies the attested
meanings with citations. Only then are the questions specific enough to be worth
an expert's time. Asking eight specialists what a phrase means, before that
work, yields eight personal definitions and no inventory.

Most of these are therefore **expert review** type: short, confirmatory, booked
against the sense inventory rather than against new terms.

**Two informants for the central senses**, one embedded practitioner or
researcher and one with review or terminology breadth. A single idiosyncratic
expert would otherwise define the vocabulary by default. Peripheral stress-test
senses can start with one.

| Tier | What it establishes | Sense or skill | Overlaps an existing row? |
|---|---|---|---|
| 1 | The dominant scientific baseline | Basic sensory neuroscience, psychophysics | Partly, the ASSR row |
| 1 | An established clinical use of the exact phrase | Disorders of consciousness, coma stimulation programmes | New |
| 1 | The densest terminology in the field: stimulation, integration, modulation, processing, diet | Occupational therapy, Ayres SI | **Yes**, the ADR 0030 row |
| 1 | An established practice family | Multisensory environments, Snoezelen | **Yes**, the ADR 0030 row |
| 1 | What counts as "sensory" at all, given interoception | Respiratory and interoceptive | **Yes**, the G1/S1 row |
| 2 | The recipient axis at its youngest edge | Neonatal, NICU developmental care | New |
| 2 | The largest non-clinical deployed practice | Special education, PMLD sensory rooms | New |
| 2 | Whether a non-human recipient is in scope | Animal sensory enrichment | New |
| 2 | Whether a persuasive purpose is in scope | Sensory marketing, experience design | New |
| 2 | Whether "sensory" means neural sensation or biological detection. The clause that decides it may be an accident of ADR 0034 | Plant sensory biology, plant stimulus perception and response | New |
| 3 | How to structure a sense inventory properly | Terminology and lexicography (ISO TC 37 orbit) | New |
| 3 | Correct SKOS for senses, variants and mappings | Knowledge organization, ISKO orbit | Partly, the ontology review row |
| 3 | Whether our mappings would be accepted upstream | Biomedical terminology curator (MeSH, UMLS, SNOMED) | New |
| 4 | Cultural and historical semantics of the senses | Sensory studies (the Concordia school is the obvious entry point, to verify before any RDF) | New |
| 4 | The record of overclaiming in this exact space | Historian of sensory therapies, and of AVE / mind machines | New |

**Where a row overlaps, it is one interview with two objectives, not two
approaches to the same person.** The Snoezelen and OT conversations already
scheduled for ADR 0030 should carry the sense questions as well; splitting them
would waste the informant's goodwill and produce two partial records.

**A caution on tier 4:** historians of sensory therapy will supply a long record
of overclaiming in this space. That is useful before the CG kickoff, not after.

**A caution on the plant row:** approach it knowing that "plant neurobiology"
drew a signed objection from roughly three dozen plant biologists in 2007. A
plant scientist hearing "sensory stimulation for plants" will hear that
argument, not ours. Lead with the modelling question, which is genuinely open,
rather than with a proposal to extend the term.

## Notes on ranking

**Auditory entrainment is deprioritized for vocabulary expansion and retained
for scientific review.** Auditory holds 26 of 39 techniques and
`EntrainmentBasedTechnique` has 13 concepts, so the marginal term yield is
genuinely low. But the evidence is heterogeneous, the `techBinauralBeats` scope
note already concedes that effects are "mixed across studies", and BSC Lab
publishes on this mechanism. That makes it G3 and S1: the yield lands in the
evidence module (`EvidenceAssessmentClaim`, tiers, scope notes), not in
`TechniqueScheme`. Interview several first-rate researchers, ideally including a
published skeptic, and book the output against evidence claims rather than terms.

**Tomatis and Bérard AIT proponents stay out.** ADR 0030 wants a neutral home
for contested methods. Interview a researcher who has studied them, not an
advocate, or the transcript becomes a `CLAUDE.md` §3.5 problem rather than a
contribution.

**Digital therapeutics methodology, HR and corporate welfare, insurers, end
users:** Track B. Real and necessary, but not this registry.

## Interview log

Governed by [`INTERVIEW_PROTOCOL.md`](INTERVIEW_PROTOCOL.md). Consent state here
is a convenience summary; the authoritative record is the private admission
ledger and the live ecosystem graph.

| Date | Person | Type | Axis | Output | Attribution | Status |
|---|---|---|---|---|---|---|
| 2026-07-22 | Theo Marins | Contribution | Non-invasive neuromodulation | ADR 0035, ADR 0036, neuromodulation module, release 0.10.0 | Not yet recorded as `contributor` | attribution pending |
