# Scope

> **For AI agents:** This is the claims and regulatory boundary document.
> Before generating any user-facing text, preset descriptions, web copy,
> or documentation about what BSC or BSC Lab does, read this document.
> The language rules in `CLAUDE.md` section 3.5 implement these constraints.
> This document is the authoritative source for what the platform claims
> and what it explicitly does not claim.

---

## What BSC Lab is

BSC Lab is an open-source research and development platform for Sensory Stimulation — the intentional design and delivery of sensory stimulation to
facilitate changes in physiological, psychological, or cognitive state.

It consists of two integrated layers: a precision multi-engine stimulation
application that delivers designed auditory, visual, and haptic sessions;
and a knowledge graph browser and annotation tool built on an OWL ontology
and SKOS vocabulary that formally describes stimulation protocols, evidence,
and technique taxonomy.

BSC Lab is infrastructure. It is the software and knowledge layer that
makes Sensory Stimulation sessions reproducible, parameter-defined,
evidence-graded, and comparable. It does not, by existing, validate the
efficacy of any specific protocol.

The related commercial application is **BioSynCare**, which delivers the
same core protocols to general users. BioSynCare and BSC Lab share a
preset catalog exported from the same RDF knowledge base. They have
different audiences, different interfaces, and different licensing
arrangements, but identical content standards.

---

## What BSC and BSC Lab do not claim

These exclusions are not hedges or legal boilerplate. They are substantive
statements about what the platform does and does not do.

**BSC Lab does not diagnose.**
No session, protocol, or ontology class constitutes a diagnostic instrument.
The frequency band taxonomy (delta, theta, alpha, SMR, beta, gamma) describes
operational BSC design categories — how sessions target neural frequency
ranges. It is not a medical diagnostic taxonomy, not a DSM classification
system, and not a brain assessment tool. A user who reports that a session
helped with anxiety has not been assessed, screened, or diagnosed.

**BSC Lab does not treat, cure, or prevent any condition.**
No protocol in the BSC catalog — regardless of its evidence tier — is
represented as a treatment for any diagnosed or diagnosable condition.
The group system (Heal, Support, Perform, Indulge, Transcend) organizes
sessions by design character and wellness orientation, not by clinical
indication. A session in the "Heal" group for stress is not treatment for
an anxiety disorder. A session in the "Support" group for migraine comfort
is not a treatment for migraine disease.

**BSC Lab does not replace professional care.**
Users seeking help with clinical conditions — diagnosed anxiety disorders,
depression, insomnia, chronic pain, ADHD, or any other clinical presentation
— should consult qualified healthcare professionals. BSC sessions may
complement other wellness practices. They are not a substitute for
clinical assessment or treatment.

**BSC Lab does not guarantee outcomes.**
Session effects vary across individuals and sessions. Factors including
baseline arousal state, listening environment, headphone quality,
attentional engagement, expectation, and individual neurophysiology all
affect what any given user experiences. The evidence framework documents
what is known about average effects across populations under specific
conditions; it does not predict what a specific user will experience.

**BSC Lab's evidence framework is not peer review.**
The six-tier evidence system (speculative → established) in the BSC
ontology represents an internal assessment of the relevant scientific
literature by the BSC team, informed by published systematic reviews
and meta-analyses. It is not equivalent to peer review, regulatory
approval, or endorsement by any clinical body. Researchers are encouraged
to engage critically with the tier assignments and propose corrections
via the annotation layer.

**BSC Lab does not endorse the efficacy of all Sensory Stimulation.**
The fact that BSC Lab provides a platform for many different protocols —
from well-evidenced alpha breathing combinations to speculative gamma
experiential designs — does not imply that BSC endorses all of them
equally. The evidence tier attached to each protocol is the explicit
statement of what the evidence supports. Speculative protocols are
published because they are design-valid and safety-appropriate; their
experimental status is disclosed, not hidden.

---

## What wellness means here

"Wellness" is used deliberately but not carelessly. In this context,
wellness means supporting the general functioning of a healthy person —
reducing subjective stress, facilitating calm focus, supporting sleep
onset, or improving experiential quality — in ways that do not require
clinical oversight, do not depend on a therapeutic relationship, and
do not carry clinical efficacy claims.

The wellness positioning is not a strategic retreat from stronger claims
that the evidence would support. It is the accurate description of the
current evidence base and of the platform's appropriate use. When
stronger clinical evidence accumulates for specific protocols —
particularly through the evidence-gathering infrastructure that BSC
Lab aims to build — the tier assignments will be updated accordingly,
and the language may become more specific.

The distinction between a wellness tool and a medical device is not
purely about humility. It has direct regulatory implications, which
are addressed below.

---

## Technical scope

**Delivery modalities currently implemented:**
auditory (binaural beats, isochronous tones, Martigli oscillations,
Symmetry permutation sequences, drones, and their combinations),
visual (breathing animations, entrainment-synchronized visual elements),
haptic (vibrotactile pulsing where platform capabilities permit).

**Delivery modalities in conceptual scope but not yet implemented:**
vestibular (sub-bass frequencies), olfactory (requires dedicated hardware),
adaptive/closed-loop (requires EEG integration).

**Session format:** Open-loop, predetermined stimulus protocols with
fixed duration (default 15 minutes, commonly extended to 30–60 minutes
for sustained work use cases). No biofeedback, no brain-state measurement,
no real-time parameter adjustment in response to user physiological state.
These capabilities are possible extensions but are not part of the current
platform.

**Population scope:** Healthy adults without contraindications (see Safety
section below). BSC Lab does not produce content designed for clinical
populations, children under 18, or users with the conditions listed in
the safety section. Content directed at these populations falls outside
scope even where anecdotal evidence may suggest benefit.

**Use contexts:** Personal wellness (stress, sleep, focus, experiential
enrichment), research (protocol replication, parameter comparison,
informal self-case series), and development (building on the open-source
stimulation engine or the RDF knowledge base). Not designed for clinical
administration, clinical trials, or any context requiring regulatory
approval of the stimulation tool.

---

## Safety context and contraindications

Sensory Stimulation at the parameters used in BSC — auditory carriers
below 1000 Hz, visual stimulation at non-flash frequencies, haptic
pulsing at phone-deliverable intensities — has a strong safety profile
for healthy adults. The relevant risks are modest but real and are
disclosed here in full.

**Photosensitive epilepsy.** Rhythmic visual stimulation (photic driving)
is a known seizure trigger in individuals with photosensitive epilepsy.
BSC's current visual animations use smooth, low-contrast breathing
cues rather than high-contrast strobe-like flicker, which substantially
reduces this risk. Nevertheless, any person with a history of seizures
or known photosensitivity should consult a physician before using visual
stimulation features and should discontinue immediately if they experience
visual disturbances, headache, or sensory discomfort. The audio-only mode
of BSC presents no photosensitive epilepsy risk.

**Conditions requiring clinical oversight.** Sessions involving strong
emotional or psychological effects — particularly Transcend group sessions
targeting deep delta states, or any session used during a mental health
episode — should not replace professional support. The following conditions
are not contraindications to all BSC use, but represent areas where a
qualified clinician should be involved before using BSC as a complementary
practice: bipolar disorder (hypomanic episodes may be precipitated by
arousing stimulation), active psychosis or schizophrenia, PTSD (grounding
should be prioritized; dissociative sessions are not appropriate), and
current suicidal ideation (human support is primary; BSC is not crisis
intervention).

**Driving and operating machinery.** Sessions targeting theta and delta
frequencies (deep relaxation, sleep onset, deep meditation) significantly
reduce alertness. Do not use these sessions while driving or operating
machinery, or within 30 minutes of doing so. Perform group sessions
are generally safe for use during stationary computer work.

**Volume levels.** Sustained listening at high volumes causes hearing
damage independent of the stimulation type. BSC sessions should be used
at comfortable volumes — sufficient to hear the session clearly, not at
maximum device volume. The BSC audio engine enforces reasonable default
volume limits (`iniVolume ≤ 0.30` for most voices).

**Children.** BSC sessions are designed for adults. There is no evidence
base for the use of these specific protocols in children, and the
regulatory and ethical requirements for pediatric wellness tools differ
from adult tools. BSC Lab does not produce content for users under 18.

**Pregnancy.** No specific evidence supports or contradicts the use of
auditory BSC sessions during pregnancy. The conservative position is
to consult a healthcare provider before use, particularly for breathing-
intensive or high-intensity sessions.

---

## Regulatory positioning

**BSC and BSC Lab are wellness tools, not medical devices.** This
classification is a deliberate and considered regulatory position, not
a default assumption.

In the European Union, the Medical Device Regulation (MDR 2017/745)
and its companion regulation for in vitro diagnostics define the
boundary between software as a medical device (SaMD) and general
wellness software. The key criterion is intended purpose: software
"intended for human beings for one or more of the specific medical
purposes" of diagnosis, prevention, monitoring, prediction, prognosis,
treatment, or alleviation of disease falls within MDR scope. Software
intended for general wellness purposes — improving health, wellbeing,
or lifestyle in individuals without disease — does not. BSC and BSC
Lab are positioned in the second category: general wellness software
with no diagnostic or treatment claims.

This positioning is maintained through consistent, audited language
across all user-facing materials. The language rules in `CLAUDE.md`
implement this technically. The key rule is: preferred verbs are
*support*, *promote*, *facilitate*, *encourage*, *help*, *guide*,
*invite*. Prohibited constructions include: treat, cure, fix, eliminate,
rewire, correct pathology, restore diseased function, clinically proven
to, scientifically proven to, prevents [condition], or any statement
that implies a diagnostic or therapeutic claim.

**Brazil (LGPD and ANVISA).** BioSynCare and BSC Lab are also subject
to Brazilian data protection law (LGPD, Lei 13.709/2018) given significant
Brazilian user base and Renato Fabbri's Brazilian operations. The wellness
positioning aligns with ANVISA's classification system for health apps
as well. Session feedback data collected for research purposes requires
LGPD-compliant consent, explicit purpose statement, and user data
rights implementation (see `TODO.md` Phase 3 for the consent flow design).

**App Store and Google Play health policies.** Apple and Google both
require that health-related apps not make medical claims and comply
with applicable health regulations in the markets they operate in.
BioSynCare's wellness positioning is consistent with these policies.
Any change to session descriptions, app store copy, or in-app text
must be reviewed against these policies and against the language rules
in `CLAUDE.md` before submission.

**What regulatory change would require.** If future clinical evidence
for a specific protocol reaches the level where a treatment claim is
appropriate — for example, if a well-powered RCT demonstrates that
a specific BSC breathing protocol is effective for a specific clinical
outcome — that protocol could, after legal review, be positioned as a
medical device intervention in jurisdictions that recognize it. This
would require a separate regulatory submission, CE marking in the EU
and equivalent registrations elsewhere, and a clearly demarcated
product separate from the general wellness application. This is a
possible future path for specific protocols with strong evidence. It
is not the current situation.

---

## What this means for researchers

Researchers using BSC Lab to study Sensory Stimulation should understand
the following:

The BSC preset catalog represents a set of designed interventions with
specified parameters, not a validated set of treatments. Evidence tiers
in the ontology represent the BSC team's synthesis of published literature,
not a systematic review. Researchers should conduct their own evidence
assessment.

BSC Lab's reproducibility architecture — in which a session instance
records both the preset and all user-defined parameters, enabling exact
reproduction — is designed specifically to support research use. Session
records generated by BSC Lab are suitable as reproducibility records or
session specifications for replication studies.

The ontology (`static/ontology/sstim-core.ttl`, `static/ontology/sstim-vocab.ttl`) can
be used freely under CC BY 4.0. Researchers who wish to propose
modifications to the frequency band taxonomy, evidence tier definitions,
or technique classifications should do so via GitHub Issues or via the
annotation layer in BSC Lab, not by forking the ontology and creating
divergent definitions.

BSC Lab welcomes and invites critical engagement. If a researcher
believes that a specific evidence tier assignment is incorrect — too
generous or too conservative — the correct response is an annotated
disagreement in the knowledge graph, which is exactly what the
annotation layer is designed for.

---

## Language reference

This is a quick reference for anyone writing about BSC or BSC Lab.

**Use:**
support, promote, facilitate, help, encourage, guide, invite,
designed to, intended to, may support, associated with, in
sessions where users report, the research suggests.

**Do not use:**
treat, cure, fix, eliminate, rewire, heal (as a verb applied
to a condition), correct, restore diseased function, proven to,
clinically proven, scientifically proven, guaranteed to, always,
prevents, reduces [clinical condition].

**Specific constructions:**

Instead of: "Reduces anxiety"
Write: "Designed to support calm in moments of heightened stress"

Instead of: "Treats insomnia"
Write: "Supports sleep onset through guided breathing and low-frequency targeting"

Instead of: "Proven to improve focus"
Write: "Designed to support sustained attention during work; evidence is mixed and task-dependent"

Instead of: "Cures depression"
Write: Never. If mood-oriented framing is necessary: "Designed to support mood and mental clarity during low-motivation periods"

---

*Document version: April 2026*
*Maintained by: Renato Fabbri (BSC Lab)*
*Review required when: App Store policies change, EU MDR guidance updates,
new clinical evidence changes tier assignments for any core preset, or
any partner uses BSC Lab content in a clinical context.*
