# Sensory Stimulation

**Sensory Stimulation** is the delivery of structured input to one or more sensory
channels with the intent of producing a specific, characterizable change in
physiological, psychological, or cognitive state through an identified or proposed
neurobiological pathway.

This is BSC Lab's domain. Every preset, every session, every evidence claim, and
every ontology class is ultimately about some form of designed sensory stimulation
and its proposed or demonstrated effects.

---

## Scope of the term

The definition has three components that distinguish the domain from adjacent areas:

**Structured input.** The stimulus is not arbitrary background noise or incidental
sensory experience. It has defined parameters — frequency, amplitude, temporal
structure, modality, duration — that can be specified, reproduced, and varied
systematically. A binaural beat at 10 Hz is structured; a crowded coffee shop is
not.

**Intent and specificity.** The delivery is aimed at a target outcome, and that
outcome is specific enough to be evaluated against evidence. "Relaxation" is too
broad; "a shift in EEG alpha power toward 10 Hz" is specific. In practice, BSC
operates with wellness-framed outcomes that are somewhat broader than single
biomarkers, but the design rationale connects specific parameters to specific
proposed pathways.

**Identified or proposed pathway.** The claim is not merely "this sounds relaxing"
but "this stimulus is proposed to engage pathway P, which is associated with
outcome O." The pathway may be speculative (Tier 1–2) or well-established
(Tier 5–6). The evidence tier system (see `docs/concept/EVIDENCE_FRAMEWORK.md`)
exists precisely to make the pathway-claim relationship explicit and graded.

---

## What this definition includes

The following are all instances of Sensory Stimulation as BSC uses the term:

**Auditory entrainment.** Binaural beats, monaural beats, and isochronous
(isochronic) tones use periodic auditory stimuli to drive frequency-following
responses in the auditory brainstem and, potentially, cortical oscillatory
entrainment. The stimulus structure is precisely periodic; the proposed pathway
is the frequency-following response and downstream cortical coupling.

**Sonic Symmetry sequences.** Permuted pitch sequences with log-uniform
distribution, at rates from 0.01 Hz (ambient, sparse) to 50 Hz (isochronic
drive). The proposed pathway for the entrainment regime (isochronic) is
frequency-following. For the melodic and ambient regimes, the proposed pathway
is attentional — structured sensory content occupies default mode network
processing, reducing mind-wandering and sustaining attentional engagement.

**Martigli breathing oscillation.** A sinusoidally frequency-modulated tone
whose modulation period progressively decelerates toward a target breathing
rate. The primary proposed pathway is autonomic nervous system regulation:
paced breathing at resonance frequency (~6 bpm) modulates respiratory sinus
arrhythmia and heart rate variability through the baroreflex. This is not
neural entrainment — it is sensory stimulation targeting the autonomic system
through a respiratory pathway. The evidence base is largely separate from
the auditory entrainment literature and is comparatively stronger.

**Visual breathing guidance.** Synchronized visual animations driven by the
same phase signal as the Martigli oscillation. The visual component supports
the respiratory entrainment goal for users with eyes open, particularly during
the initial sessions before the auditory cue alone is sufficient. The visual
stimulus is slow, smooth, and low-contrast by design — not photic stimulation.

**Stochastic resonance stimulation.** Calibrated noise added to a
subthreshold signal to enhance its detection probability through threshold
dynamics. Not currently in the BSC preset catalog but within domain scope.
The proposed pathway is not entrainment; it is noise-assisted signal detection
at sensory threshold.

**Environmental arousal modulation.** The spectral and register properties of
a stimulus — carrier frequency, timbre, amplitude — modulate arousal through
ascending neuromodulatory systems independent of any periodic targeting. A
deep, low-register carrier feels different from a bright, high-register one
at the same beat frequency. This is a design parameter in BSC presets even
when it is not the primary mechanism.

---

## What this definition does not include

The following are excluded from BSC's scope, or are adjacent but distinct:

**Passive music listening.** Music may produce measurable physiological
responses, but unstructured listening lacks the parameter specificity and
reproducibility required for systematic study or evidence-based design. BSC
sessions are parameter-defined protocols, not music in the conventional sense.

**Neurofeedback (closed-loop brain-computer interface).** In neurofeedback, the
user's own neural activity drives the feedback signal through an EEG measurement
system. The mechanism is operant conditioning of neural states, not structured
sensory delivery. BSC is open-loop: the stimulus is specified in advance and
does not adapt to real-time measurement of the recipient's state.

**Medical or clinical intervention.** BSC operates in the wellness space. Even
where the techniques overlap with clinical research (e.g., binaural beats for
pain, paced breathing for anxiety), BSC does not make treatment or diagnostic
claims. The boundary is maintained by the evidence tier system and the
conservative language policy (see `docs/concept/SCOPE.md`).

**Invasive neuromodulation.** TMS, tDCS, DBS, cochlear implants, and other
implanted or contact-based neural interventions are not sensory stimulation in
BSC's sense — they do not work through the sensory channel but directly on
neural tissue.

---

## Taxonomic position

Sensory Stimulation, as used in BSC, sits within the broader landscape as follows:

```
All sensory experience
└── Designed sensory stimulation  (parameter-specified, reproducible)
    ├── Neural target
    │   ├── Sensory entrainment       ← binaural beats, isochronic tones,
    │   │                               Symmetry (isochronic mode)
    │   ├── Attentional anchoring     ← Symmetry (ambient/melodic modes)
    │   └── Arousal modulation        ← carrier register, spectral coloring
    └── Autonomic target
        └── Paced respiratory entrainment  ← Martigli breathing oscillation
```

The BSC preset catalog contains techniques from all four leaf categories,
often combined within a single session. This is the multi-pathway character
of BSC — a session may simultaneously drive frequency-following at a target
band (neural/entrainment), maintain attentional engagement (neural/attentional),
and guide respiration toward resonance frequency (autonomic).

---

## Why "Sensory Stimulation" and not a more specific term

The alternatives were considered carefully:

**Brainwave entrainment** — embeds a mechanism claim, excludes the respiratory
autonomic pathway, and carries associations that complicate scientific credibility.

**Audiovisual entrainment (AVE)** — correct for the lineage but locks to
audio+visual modalities. BSC is currently auditory, will expand to haptic.

**Sensory neuromodulation** — precise and correct but carries regulatory loading
("neuromodulation" is a medical device category term in FDA and EU MDR contexts)
that is inappropriate for a wellness platform at this stage.

**Sensory modulation** — the OT literature uses this specifically for a
capacity of the individual (self-regulation of sensory responses), which is
related but distinct from designed external stimulation delivery.

**Sensory Stimulation** is maximally established as a term (present across
neuroscience, rehabilitation, neonatology, animal research), carries no
mechanism overclaim, covers the full scope of BSC techniques including the
respiratory pathway, and imposes no regulatory burden. It is the correct
umbrella for both the BSC Lab ontology and the Sensory Stimulation Community
Group (W3C CG).

The term is broad — deliberately so at the domain level. The precision is
supplied at the class level: `sstim:SensoryEntrainment`,
`sstim:PacedRespiratoryEntrainment`, `sstim:AttentionalAnchoring`.

---

## The SSTIM ontology namespace

The formal vocabulary for the domain is published at
`https://w3id.org/sstim` with prefix `sstim:`. This namespace belongs to
the Sensory Stimulation community, not to BSC Lab specifically. BSC Lab
is the founding contributor. The BSC framework uses
`https://w3id.org/sstim/framework/bsc`. BSC Lab reference instances use
`https://w3id.org/sstim/implementation/bsclab/...`; BioSynCare commercial
catalog instances use `https://w3id.org/sstim/implementation/biosyncare/...`.

The separation of community vocabulary (`sstim:`) from product instances
(`bsclab-preset:` or `biosyncare-preset:`) is intentional: the ontology should
be useful to any researcher working in sensory stimulation, regardless of their
relationship to BioSynCare.

---

## Relationship to BioSynCare

BioSynCare is a commercial product that delivers designed sensory stimulation
sessions. It is the primary consumer of the BSC preset catalog and the primary
beneficiary of the BSC ontology infrastructure. But BioSynCare is not the
domain. The domain is Sensory Stimulation; BioSynCare is one application within it.

This distinction matters for two reasons. First, the W3C CG and ontology work
should be useful to the full community of sensory stimulation researchers and
practitioners, not just to BioSynCare users. Second, BSC Lab's open-source
infrastructure is more fundable, more citable, and more durable if it is
positioned as community infrastructure rather than as BioSynCare's open-source
backend.

---

*This document supersedes `docs/concept/SENSORY_HARNESSING.md` (the prior
term "Sensory Harnessing" was replaced with the established term "Sensory
Stimulation" in April 2026, before the first public repository commit).*

*Maintained by: Renato Fabbri*
*Document version: April 2026*
