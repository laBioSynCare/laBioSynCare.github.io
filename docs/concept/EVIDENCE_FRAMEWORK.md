# Evidence Framework

> **For AI agents:** This document governs every claim about what BSC
> sessions do or might do. Before writing any `techDesc`, preset
> description, web copy, or documentation about session effects, read
> this document. The language rules in `CLAUDE.md` section 3.5 and
> `docs/concept/SCOPE.md` implement these constraints. Evidence tiers
> are formally encoded in `static/ontology/sstim-vocab.ttl`.

---

## What this is and why it exists

The BSC evidence framework is a structured system for grading the
scientific support behind claims about what Sensory Stimulation
interventions do. Every BSC protocol — every preset in the catalog,
every session type in the platform — carries an evidence grade, and
that grade governs the language used to describe it to users.

This framework exists for three reasons that reinforce each other.

The first is scientific integrity. The Sensory Stimulation domain has
a long history of overclaiming — commercial entrainment products have
cited animal studies, audiovisual evidence, and preclinical findings
to justify auditory-only wellness claims in ways that misrepresent
the state of evidence. BSC's credibility with researchers and clinical
partners depends on being more honest about the evidence than the
commercial average, not less. A tiered system that makes distinctions
visible is more credible than a binary claim/no-claim approach.

The second is regulatory compliance. As documented in
`docs/concept/SCOPE.md`, BSC and BSC Lab are wellness tools. The
language permitted under a wellness positioning is more conservative
than clinical language. The evidence tier system operationalizes
exactly how conservative: higher tiers permit more specific language;
lower tiers require hedging and framing.

The third is scientific infrastructure. The evidence tier framework
is a contribution to the field, not just an internal policy. No
analogous formal system exists for Sensory Stimulation. By publishing
this framework as part of the BSC ontology, linking it to ECO (Evidence
and Conclusion Ontology) and to OCEBM levels, and making it available
for annotation and critique, BSC Lab creates a shared reference point
for evidence discussions that the field currently lacks.

---

## Two dimensions: strength and type

The framework has two orthogonal dimensions that must both be
considered when assigning an evidence grade. Conflating them is
the most common source of error.

**Evidence strength** is the quality and quantity of the empirical
support: how many studies, how well-controlled, how consistent,
whether they have been replicated independently. This is what most
people mean by "level of evidence." It maps to the six tiers described
below and to OCEBM levels.

**Evidence type** is the modality and population of the evidence:
whether it comes from auditory-only human studies, audiovisual
human studies, animal studies, or theoretical mechanisms; and whether
the population studied matches the population making the claim
(healthy adults in wellness contexts vs. clinical populations).

These two dimensions are orthogonal in theory but constrained in
practice: **no amount of preclinical evidence qualifies a human
wellness claim above the Preliminary tier, regardless of how many
preclinical studies exist.** Similarly, no amount of audiovisual
evidence directly validates an auditory-only claim, though it may
provide contextual support with explicit caveats.

The formal type tags, used in evidence records and `techDesc` fields:

| Tag | Meaning | Applies when |
|---|---|---|
| `[AUD]` | Auditory-only human evidence | Study used audio stimulus only, in humans |
| `[AV]` | Audio-visual / multisensory human | Study combined audio + visual, or other senses |
| `[BREATH]` | Breathing / HRV / respiratory | Study concerned breathing patterns or heart rate variability |
| `[GENERAL]` | Mixed-modality or modality-ambiguous | Review or study where modality is unclear or mixed |
| `[PRECLINICAL]` | Animal models or mechanistic | In vitro, rodent, or purely computational |
| `[REVIEW]` | Systematic review or meta-analysis | Aggregates primary studies |

A single reference may carry multiple tags. A `[AV][REVIEW]` citation
is a systematic review of audiovisual studies — the strongest available
evidence for an audiovisual claim, but only indirect support for an
auditory-only claim.

---

## The six evidence strength tiers

The tiers form an ordered scale. Each tier has a precise definition,
qualifying criteria, and language implications. The scale runs from
Tier 1 (Speculative) to Tier 6 (Established).

### Tier 1 — Speculative

**Definition:** Design intent is based on theoretical reasoning,
mechanistic plausibility, or design analogy. No empirical data
exists for this specific claim or closely related claims, even
in non-matching modalities.

**Qualifying criteria:** A proposed mechanism exists and governs
the design. The design choices are internally coherent. But no
published study — not even preclinical, not even in a different
modality — has examined the specific claim.

**Language permitted:** "designed to explore," "designed for
[experiential quality]," "based on [mechanistic principle],"
"experimental." No claim of effect. No citation.

**Examples from the BSC catalog:** Indulge group presets exploring
novel sensory combinations; Transcend group presets targeting
specific contemplative states; any preset using the Symmetry
permutation architecture in ways not yet studied (the dual-layer
entrainment model is a design rationale, not a clinical claim).

---

### Tier 2 — Anecdotal

**Definition:** Consistent informal reports from practitioners or
users suggest an effect, but no controlled or systematically
collected data exists.

**Qualifying criteria:** Multiple independent practitioner accounts
or self-reports point in the same direction. Reports are internally
coherent with the proposed mechanism. No published study, but the
observation is documented, attributed, and consistent.

**Language permitted:** "users report," "practitioner observations
suggest," "experientially associated with," "may support." Never
cite anecdotes as evidence in `techDesc`. Note that the BSC internal
experience (Renato Fabbri and Juliana Braga de Salles Andrade's
documented use for facilitating dedicated work) is Tier 2 evidence,
described accurately as a documented personal case series with
a plausible mechanism, not as a clinical claim.

**Examples:** The "facilitating dedication" use case (see
`docs/concept/FACILITATING_DEDICATION.md`). Many user reports
of sleep onset facilitation before the auditory sleep literature
was examined.

---

### Tier 3 — Preliminary

**Definition:** At least one published study exists, but the study
has significant methodological limitations: no control group, very
small sample (N < 20), single-site, possible confounds, or the
evidence is from a non-matching modality (e.g., AV evidence for
an auditory claim, or preclinical evidence for a human claim).

**Qualifying criteria:** At least one peer-reviewed publication
addresses the specific claim or a closely related claim. The study
design has identified limitations. Effect direction may be unclear
or inconsistent across available studies. Preclinical evidence
qualifies at most Tier 3 for human wellness claims.

**Language permitted:** "preliminary evidence suggests," "early
research indicates," "based on emerging research," "one study
found." Must acknowledge limitations explicitly in `techDesc`.
Modality mismatch must be stated.

**Examples:** Gamma-40 effects in humans based on animal model
data (preclinical → human discount). Most individual pilot studies
without control groups.

---

### Tier 4 — Moderate

**Definition:** Multiple published studies exist with consistent
effect direction, at least one using a controlled design; OR a
single well-designed RCT exists in a closely related but not
perfectly matching context.

**Qualifying criteria:** At least two studies, or one controlled
study. Evidence direction is consistent (not mixed). The studies
are in a matching or closely adjacent modality and population.
Some methodological limitations remain (small samples, single
research group, possible publication bias).

**Language permitted:** "research suggests," "evidence supports,"
"studies indicate," "designed to support [effect] based on [type]
evidence." Can cite 1–2 references. Must note any modality mismatch.
Most BSC "moderate" tier presets fall here.

**Examples:** Binaural beats for stress and anxiety (multiple
auditory RCTs with modest effects; Platt & Hammond 2025 systematic
review). Sleep onset support (auditory + AV evidence, mixed quality).
Alpha-target presets for relaxation.

---

### Tier 5 — Strong

**Definition:** Multiple well-designed controlled studies from
independent research groups, OR a systematic review of several
controlled studies, showing consistent effects in a well-matched
population and modality.

**Qualifying criteria:** At least one systematic review OR multiple
independent RCTs. Consistent effect direction. Modality and population
match the claim well (auditory evidence for auditory claim, healthy
adults for wellness claim). Sample sizes are meaningful (N > 30
combined). Effect sizes are reported.

**Language permitted:** "well-supported by evidence," "consistent
research findings suggest," "multiple studies demonstrate." More
specific language about the proposed mechanism is appropriate. Can
cite up to 3 references.

**Examples:** Slow guided breathing for stress reduction and HRV
improvement. This is the strongest single mechanism in the BSC
repertoire — multiple systematic reviews (Zaccaro 2018, Hopper 2019,
Laborde 2021) converge on consistent autonomic effects of slow
rhythmic breathing in healthy adults, directly matching the Martigli
breathing component.

---

### Tier 6 — Established

**Definition:** Multiple high-quality systematic reviews or
meta-analyses with consistent findings, across independent
research groups, with modality and population matching the claim,
and no substantial contradicting evidence from equivalent-quality
studies.

**Qualifying criteria:** This tier requires the full combination:
systematic reviews (not just individual studies), independent
replication, direct modality and population match, and absence
of major contradicting high-quality evidence. Very few BSC claims
reach this tier in their auditory-only form.

**Language permitted:** Specific, confident language about the
mechanism and expected effect direction is appropriate. Still
within wellness framing (never treatment language). Can describe
the evidence directly.

**Examples:** In the BSC context, Tier 6 applies to the breathing
component of breathing-enabled presets for general stress
reduction in healthy adults — the combination of Zaccaro et al.
(2018, systematic review), Hopper et al. (2019, systematic review),
and Lehrer et al. (multiple studies across decades) constitutes
an established evidence base for the specific claim "slow rhythmic
breathing at approximately 6 breaths/minute supports parasympathetic
activation and reduces subjective stress in healthy adults." This
is arguably the only Tier 6 claim currently in the BSC repertoire.

---

## The modality-matching principle

This is the principle most frequently violated in the broader
Sensory Stimulation field, and it is where BSC's evidence grading
most diverges from commercial practice.

**Evidence from one stimulation modality does not directly support
claims about a different modality, even when both target the same
neural frequency.**

The specific cases that arise most often in the BSC catalog:

**AV (audio-visual) evidence and auditory-only claims.** The most
thoroughly studied brainwave entrainment paradigm is audiovisual
entrainment (AVE): simultaneous auditory and visual periodic
stimulation. BSC's current presets are auditory-only (with visual
animations that do not itself carry entrainment frequencies). A
study showing that 10 Hz AVE reduces anxiety does not demonstrate
that 10 Hz auditory-only stimulation reduces anxiety. The visual
component may be contributing significantly. AV evidence can be
cited as contextual background for an auditory claim only if the
indirectness is explicitly stated. It does not raise the tier of
an auditory-only claim above what the auditory-only studies alone
would justify.

**Preclinical (animal) evidence and human claims.** The 40 Hz
GENUS work — Iaccarino et al. (2016) in Nature, Martorell et al.
(2019) in Cell — demonstrates remarkable effects of multisensory
gamma stimulation on amyloid load and microglial function in
Alzheimer's disease mouse models. This is genuinely exciting
science. It does not establish that auditory 40 Hz stimulation
in BSC reduces amyloid or modulates microglia in humans. Preclinical
evidence can support a "neuroprotection-adjacent" framing only
with explicit "emerging research, animal models" language, and
the group assignment must be Support, never Heal.

**Clinical population evidence and healthy adult claims.** A study
showing that 10 Hz binaural beats reduced anxiety in hospitalized
surgical patients does not establish that the same protocol
reduces stress in healthy adults during daily work. Clinical
populations differ from wellness populations in arousal baseline,
motivation, expectation, and neurophysiology. Downward extrapolation
(clinical → healthy) is usually conservative and permitted;
upward extrapolation (healthy → clinical) is treatment language
and never appropriate.

**Modality discount in practice.** When the best available
evidence for a claim is AV rather than auditory, the effective
tier is reduced by one level when assigning the auditory-only
preset's tier. AV Tier 4 → auditory-only Tier 3 (Preliminary
with explicit indirectness statement). AV Tier 5 → auditory-only
Tier 4 (Moderate with explicit caveat). Preclinical evidence,
regardless of strength within the preclinical literature, maps
to at most Tier 3 for human wellness claims.

---

## The population-matching principle

Similar to modality-matching but distinct. The population in
which evidence was collected must be considered when applying
the tier to a BSC claim.

**Target population for BSC claims:** Healthy adults using BSC
for general wellness, performance support, or experiential enrichment.

**Populations that do not directly transfer:** Clinical populations
(anxiety disorder diagnosis, insomnia disorder diagnosis, diagnosed
ADHD), older adults with specific conditions, children, athletes
in specific training contexts. Evidence from these populations
is contextually relevant but does not directly establish
efficacy in the BSC target population, and may suggest different
parameter requirements.

**Conservative direction only.** Evidence in the target population
may be cautiously extrapolated toward broader wellness language.
Evidence in clinical populations may never be used to make
treatment claims in the BSC platform, even if the clinical
evidence is strong.

---

## Evidence is claim-level, not preset-level

A single preset can contain multiple simultaneous claims, each
with its own evidence tier. The canonical example: a Heal-group
preset combining Martigli breathing and alpha binaural beats.

The breathing component's claim — "supports parasympathetic
activation through slow rhythmic respiratory cueing" — is
supported by Tier 5–6 evidence (Zaccaro, Hopper, Lehrer).

The auditory entrainment component's claim — "supports relaxation
through alpha frequency targeting" — is supported by Tier 3–4
evidence (binaural beat literature, mixed but positive direction,
some modality mismatch with AVE studies).

When assigning a single `evidenceTier` value to the preset as
a whole, the convention is: **use the lowest (most conservative)
tier across all active claims.** This is conservative by design
— the preset is not better than its weakest claim.

The ontology supports more granular representation: each
`sstim:EvidenceClaim` instance attached to a protocol can carry
its own tier, reference list, modality tags, and notes. For
research purposes, this granularity is available. For user-facing
content, the single preset-level tier is what governs the
language.

---

## Relationship to OCEBM levels

The Oxford Centre for Evidence-Based Medicine levels of evidence
provide a useful reference point for mapping BSC tiers to
clinical research standards:

| OCEBM Level | Description | Approximate BSC tier |
|---|---|---|
| 1 | Systematic review of RCTs | Tier 6 (Established) |
| 2 | Individual RCT with narrow CI | Tier 5 (Strong) |
| 3 | Cohort study | Tier 4 (Moderate) |
| 4 | Case series, poor quality cohort | Tier 3 (Preliminary) |
| 5 | Expert opinion | Tier 2 (Anecdotal) |
| — | Mechanism only, no data | Tier 1 (Speculative) |

The mapping is approximate because OCEBM is designed for clinical
intervention evidence, and the Sensory Stimulation field has few
RCTs even at its best. More importantly, OCEBM does not address
the modality-matching issue — it treats "the study existed" as
sufficient, regardless of whether the stimulus in the study matches
the stimulus being claimed. BSC's modality discount is an addition
to OCEBM, not a replacement.

---

## Relationship to ECO (Evidence and Conclusion Ontology)

ECO classifies evidence by *type of reasoning or experimental
approach*, not by strength: experimental evidence, computational
evidence, author statement, curator inference, and so on.
The BSC tier system is orthogonal to ECO.

In the BSC ontology:
- `sstim:EvidenceTier` captures strength (the six tiers above)
- `eco:ECO_0000000` (ECO terms) capture type
- A single `sstim:EvidenceClaim` instance carries both

For example, a claim supported by two RCTs would carry
`sstim:evidenceTier sstim-v:moderate` AND
`eco:ECO_0001384` (randomized controlled trial evidence
used in manual assertion). A claim supported only by mechanism-
based reasoning would carry `sstim:evidenceTier sstim-v:speculative`
AND `eco:ECO_0000007` (author inference).

---

## Current state of the BSC catalog (v0.9.1)

The current preset catalog uses a simplified three-value system:
`speculative`, `moderate`, `established`. This was the working
system during initial catalog development. The six-tier system
described in this document is the target formalization.

Approximate mapping from the catalog's current values:

| Current catalog value | Maps to six-tier |
|---|---|
| `speculative` | Tier 1 (Speculative) |
| `moderate` | Tier 3–4 (Preliminary–Moderate) |
| `established` | Tier 5 (Strong) |

No current BSC preset is genuinely Tier 6 (Established) for its
*auditory-only* claims in totality, though the breathing component
of breathing-enabled presets reaches Tier 6 for the specific
autonomic claim.

Migration from the three-value to the six-value system will occur
when the ontology instances are created for the preset catalog
in Phase 1. Each preset's tier assignment will be reviewed against
the criteria above, using the `evidenceBasis` and `evidenceRefs`
fields already in the catalog as input.

---

## Assigning and challenging tier assignments

**Who assigns tiers:** Currently, Renato Fabbri as primary
ontology author, with input from Juliana Braga de Salles Andrade
(scientific advisory). Tier assignments are documented in the
ontology with a `prov:wasAttributedTo` link to the assigning
contributor and a `dct:modified` timestamp.

**How to propose a correction:** Via GitHub Issues labeling
the issue "evidence-tier" and citing the relevant studies, OR
via the BSC Lab annotation interface (annotate the specific
ontology node with a `bsc-ann:disputesTierAssignment` property
and a justification). Proposed changes require: (1) a specific
alternative tier, (2) at least one citation supporting the
proposed tier, and (3) explanation of why the current tier
is incorrect.

**Grounds for upward revision (higher tier):**
Publication of a new well-designed controlled study or systematic
review in a directly matching modality and population that
substantially strengthens the existing evidence base.

**Grounds for downward revision (lower tier):**
Publication of a high-quality study contradicting existing
evidence, a systematic review revealing publication bias in
the prior literature, or identification of population/modality
mismatch in previously accepted citations.

**What cannot change a tier:** User testimonials, press coverage,
practitioner assertions, or commercial popularity. Only published
peer-reviewed evidence or documented methodological critique.

---

## Formal ontology seed

The following declarations implement the six-tier vocabulary.
Full class definitions and property assignments are in
`static/ontology/sstim-core.ttl` and `static/ontology/sstim-vocab.ttl`.

```turtle
@prefix sstim:   <https://w3id.org/sstim#> .
@prefix sstim-v: <https://w3id.org/sstim/vocab#> .
@prefix skos:     <http://www.w3.org/2004/02/skos/core#> .
@prefix owl:      <http://www.w3.org/2002/07/owl#> .
@prefix rdfs:     <http://www.w3.org/2000/01/rdf-schema#> .
@prefix eco:      <http://purl.obolibrary.org/obo/ECO_> .

# ── Evidence tier class ─────────────────────────────────────────────────

sstim:EvidenceTierValue a owl:Class ;
    rdfs:label "Evidence Tier Value"@en ;
    skos:definition
        """A classification of the strength and quality of empirical
        support for a specific Sensory Stimulation claim, taking into
        account study quality, consistency, modality match, and
        population match."""@en .

# ── Tier concept scheme ──────────────────────────────────────────────────

sstim-v:EvidenceTierScheme a skos:ConceptScheme ;
    skos:prefLabel "BSC Evidence Tier Vocabulary"@en ;
    skos:hasTopConcept sstim-v:speculative,
                       sstim-v:anecdotal,
                       sstim-v:preliminary,
                       sstim-v:moderate,
                       sstim-v:strong,
                       sstim-v:established .

# ── Individual tier concepts (dual-typed as OWL individuals) ─────────────

sstim-v:speculative a skos:Concept, sstim:EvidenceTierValue ;
    skos:inScheme sstim-v:EvidenceTierScheme ;
    skos:prefLabel "Speculative"@en, "Speculativo"@it,
                   "Especulativo"@pt, "Especulativo"@es ;
    skos:definition
        """Design intent is based on theoretical reasoning or mechanistic
        plausibility. No empirical data exists for this specific claim
        or closely related claims in any modality."""@en ;
    sstim:tierRank 1 .

sstim-v:anecdotal a skos:Concept, sstim:EvidenceTierValue ;
    skos:inScheme sstim-v:EvidenceTierScheme ;
    skos:prefLabel "Anecdotal"@en, "Aneddotico"@it,
                   "Anedótico"@pt, "Anecdótico"@es ;
    skos:definition
        """Consistent informal reports from practitioners or users suggest
        an effect, but no controlled or systematically collected data
        exists. Reports are internally coherent with the proposed
        mechanism."""@en ;
    sstim:tierRank 2 .

sstim-v:preliminary a skos:Concept, sstim:EvidenceTierValue ;
    skos:inScheme sstim-v:EvidenceTierScheme ;
    skos:prefLabel "Preliminary"@en, "Preliminare"@it,
                   "Preliminar"@pt, "Preliminar"@es ;
    skos:definition
        """At least one published study exists, but with significant
        limitations: no control group, very small sample, single site,
        or evidence from a non-matching modality or population.
        Preclinical evidence qualifies at most this tier for human
        wellness claims."""@en ;
    sstim:tierRank 3 .

sstim-v:moderate a skos:Concept, sstim:EvidenceTierValue ;
    skos:inScheme sstim-v:EvidenceTierScheme ;
    skos:prefLabel "Moderate"@en, "Moderato"@it,
                   "Moderado"@pt, "Moderado"@es ;
    skos:definition
        """Multiple published studies with consistent effect direction,
        at least one using a controlled design; or a single well-designed
        RCT in a closely related context. Some methodological limitations
        remain. Modality and population are reasonably matched."""@en ;
    sstim:tierRank 4 .

sstim-v:strong a skos:Concept, sstim:EvidenceTierValue ;
    skos:inScheme sstim-v:EvidenceTierScheme ;
    skos:prefLabel "Strong"@en, "Robusto"@it,
                   "Robusto"@pt, "Robusto"@es ;
    skos:definition
        """Multiple well-designed controlled studies from independent
        research groups, or a systematic review of several controlled
        studies, showing consistent effects in a well-matched population
        and modality."""@en ;
    sstim:tierRank 5 .

sstim-v:established a skos:Concept, sstim:EvidenceTierValue ;
    skos:inScheme sstim-v:EvidenceTierScheme ;
    skos:prefLabel "Established"@en, "Consolidato"@it,
                   "Consolidado"@pt, "Consolidado"@es ;
    skos:definition
        """Multiple high-quality systematic reviews or meta-analyses
        with consistent findings, independent replication, direct modality
        and population match, and no substantial contradicting evidence
        from equivalent-quality studies."""@en ;
    sstim:tierRank 6 .

# ── Evidence claim class ─────────────────────────────────────────────────

sstim:EvidenceClaim a owl:Class ;
    rdfs:label "Evidence Claim"@en ;
    skos:definition
        """A specific assertion about the effect of a Sensory Stimulation
        intervention, together with its supporting evidence, tier
        assignment, modality tags, and citation list."""@en .

# ── Evidence modality tag class ──────────────────────────────────────────

sstim:EvidenceModalityTag a owl:Class ;
    rdfs:label "Evidence Modality Tag"@en ;
    skos:definition
        """A classification of the stimulus modality and population
        in which supporting evidence was gathered, used to apply the
        modality-matching discount when assigning evidence tiers."""@en .

sstim-v:evidenceAuditory a skos:Concept, sstim:EvidenceModalityTag ;
    skos:prefLabel "Auditory-Only Human Evidence"@en ;
    skos:notation "AUD" .

sstim-v:evidenceAudiovisual a skos:Concept, sstim:EvidenceModalityTag ;
    skos:prefLabel "Audio-Visual / Multisensory Human Evidence"@en ;
    skos:notation "AV" .

sstim-v:evidenceBreath a skos:Concept, sstim:EvidenceModalityTag ;
    skos:prefLabel "Breathing / HRV / Respiratory Evidence"@en ;
    skos:notation "BREATH" .

sstim-v:evidenceGeneral a skos:Concept, sstim:EvidenceModalityTag ;
    skos:prefLabel "Mixed-Modality or Modality-Ambiguous Evidence"@en ;
    skos:notation "GENERAL" .

sstim-v:evidencePreclinical a skos:Concept, sstim:EvidenceModalityTag ;
    skos:prefLabel "Preclinical / Animal / Mechanistic Evidence"@en ;
    skos:notation "PRECLINICAL" .

sstim-v:evidenceReview a skos:Concept, sstim:EvidenceModalityTag ;
    skos:prefLabel "Systematic Review or Meta-Analysis"@en ;
    skos:notation "REVIEW" .

# ── Key property ─────────────────────────────────────────────────────────

sstim:evidenceTier a owl:ObjectProperty ;
    rdfs:domain sstim:EvidenceClaim ;
    rdfs:range  sstim:EvidenceTierValue ;
    rdfs:label  "evidence tier"@en ;
    skos:definition
        """Links an evidence claim to its strength classification.
        Assignment must account for both study quality (OCEBM-style)
        and modality/population match (BSC modality-matching
        principle)."""@en .

sstim:hasModalityTag a owl:ObjectProperty ;
    rdfs:domain sstim:EvidenceClaim ;
    rdfs:range  sstim:EvidenceModalityTag ;
    rdfs:label  "has modality tag"@en .
```

---

## Quick reference for content and AI

This table summarizes the language permitted and required at each tier.
Memorize the "never" column — violations of those rules are not style
errors but regulatory and scientific integrity failures.

| Tier | Label | Permitted | Required caveat | Never |
|---|---|---|---|---|
| 1 | Speculative | "designed to explore," "based on [mechanism]," "experimental" | State it is experimental | Any claim of effect |
| 2 | Anecdotal | "users report," "practitioners observe," "experientially associated" | Note anecdotal basis | Citation of user reports as evidence |
| 3 | Preliminary | "preliminary evidence," "early research," "one study found" | State limitations and modality mismatch | Omit the limitation statement |
| 4 | Moderate | "research suggests," "evidence supports," "studies indicate" | Note any modality mismatch | "proven," "demonstrates," "established" |
| 5 | Strong | "well-supported," "consistent evidence," "multiple studies show" | Still no treatment language | Treatment, cure, prevention language |
| 6 | Established | Specific mechanism description; confident wellness framing | None required for mechanism; still no treatment language | Clinical treatment claims |

The tier governs the language ceiling. Every tier also permits everything
below it — a Tier 5 claim may use "preliminary evidence suggests" language;
it does not have to use the strongest permitted phrasing.

When in doubt: use a lower tier. Understating evidence is a recoverable
error (the tier can be revised upward when better studies appear).
Overstating evidence damages credibility and may create regulatory
exposure that cannot be easily undone.

---

*Document version: April 2026*
*Maintained by: Renato Fabbri (BSC Lab)*
*Scientific advisory: Juliana Braga de Salles Andrade, PhD*
*Review required when: new systematic reviews appear in any core
BSC use-case area; tier assignments are challenged via annotation
or GitHub Issues; regulatory guidance updates.*
