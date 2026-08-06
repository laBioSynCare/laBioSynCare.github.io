# ADR 0035 — Participant engagement mode, ECT, and endogenous self-regulation

**Status:** Accepted — 2026-07-23 · released in SSTIM 0.10.0

Adds a sixth facet axis — how much active participation a method demands of the
individual — catalogues electroconvulsive therapy and the closed-loop
self-regulation techniques (neurofeedback, biofeedback), and expresses an
invasive/non-invasive rollup over the delivery-approach axis. It also records,
and deliberately does **not** yet act on, two proposals that conflict with the
frozen [ADR 0034](0034-neuromodulation-relation-and-neural-target-axis.md)
architecture.

The implementation touches protected term files
([ADR 0004](0004-protected-ontology-files.md); `CLAUDE.md` §3.4). Maintainer
approval to edit them was given in session on 2026-07-23 ("You have my
permission to edit the ttl files").

---

## Context

On 2026-07-22 the maintainer interviewed **Dr. Theo Marins**
(<https://homepage.uni-graz.at/de/theo.marins/>, University of Graz) about
neuromodulation. The notes, in the original Brazilian Portuguese:

1. *em geral a neuromodulação se divide em: técnicas invasivas e não-invasivas*
   — neuromodulation divides, in general, into invasive and non-invasive
   techniques;
2. *adicionar Eletroconvulsoterapia (ECT)* — add electroconvulsive therapy;
3. *Neurofeedback e Biofeedback: mais como neuromodulação do que
   neuroestimulação* — neurofeedback and biofeedback are more neuromodulation
   than neurostimulation;
4. *Neuroestimulação é um tipo de neuromodulação que não requer engajamento
   ativo do indivíduo* — neurostimulation is a kind of neuromodulation that does
   not require the individual's active engagement;
5. *Meditação, respiração, é neuromodulação* — meditation and breathing are
   neuromodulation.

SSTIM 0.9.0 (ADR 0034) had just shipped a deliberate architecture: `Stimulation`
and `Neuromodulation` are **siblings that overlap**, "neither family subsumes
the other," with five orthogonal facets (neural access route, delivery approach,
neural target site, neural system, neural phenomenon). `sstim:Neuromodulation`'s
scope note **explicitly excludes** "endogenous physiological neuromodulation."
Two of Theo's five notes therefore land on ground the ontology had just, on
purpose, decided differently — and the value of the interview is precisely in
separating the additive contributions from the genuine architectural
disagreement, rather than importing a domain expert's vocabulary wholesale over
a one-week-old decision.

## Decision

**Adopted (additive, backward-compatible):**

1. **A sixth facet — participant engagement mode.** A new
   `sstim:ParticipantEngagementMode` class and a domainless
   `sstim:participantEngagementMode` property (subject-constrained in SHACL like
   the ADR 0034 facet properties), with a three-value scheme:
   `engagementPassiveReceptive`, `engagementGuidedFollowing`,
   `engagementActiveSelfRegulatory`. None of the five ADR 0034 axes captured
   *how much the individual must participate*; that is exactly what sets
   meditation, breathwork, neurofeedback, and biofeedback apart from receptive
   exposure, and it is orthogonal to route/approach/target/system/phenomenon.
   This is the interview's most valuable structural contribution — it is the
   axis hiding behind notes 3, 4, and 5. The axis is exercised across families:
   binaural beats and closed-loop auditory stimulation are tagged passive
   (a *closed-loop system* is not the same as *active self-regulation*),
   sonification and the two new techniques active.

2. **Electroconvulsive therapy** (`techElectroconvulsiveTherapy`) joins the
   ADR 0034 non-sensory contrast set as a `NeuromodulationTechnique`, completing
   its coverage of the established convulsive branch of brain-stimulation
   therapy and exercising the passive extreme of the engagement axis. Same
   posture as the rest of the set: catalogued so the ontology can *describe* it,
   asserting neither capability, efficacy, nor safety, referenced by no BSC
   preset.

3. **Neurofeedback and biofeedback** (`techNeurofeedback`, `techBiofeedback`)
   are catalogued at the **neutral `sstim:StimulationTechnique` layer** — not as
   `NeuromodulationTechnique`, not as `SensoryStimulationTechnique`. Their
   feedback enters through canonical sensory transduction (recorded on the route
   facet), yet the modulation is produced by the individual's own endogenous
   self-regulation. Neutral typing states what they are without prejudging the
   scope question in the next section.

4. **An invasive/non-invasive rollup** over the delivery-approach values,
   expressed as SKOS collections (`NonInvasiveApproachCollection`,
   `MinimallyInvasiveApproachCollection`, `InvasiveApproachCollection`) rather
   than a new primitive axis. ADR 0034 chose to keep delivery approach coarse
   and non-exclusive; invasive vs. non-invasive is a grouping *of* it, not an
   independent facet, so collections (which add no OWL entailment and leave the
   top-concept structure intact) are the right SKOS tool. Note 1 was thus
   already largely modeled by the delivery-approach invasiveness gradient; this
   only names the rollup.

## Alternatives considered / deferred

- **Note 4 — make neurostimulation a subclass of neuromodulation.** Deferred to
  ADR 0036, not rejected. (Correction to an earlier draft of this ADR: Theo's
  argument is *not* restricted to electrical/magnetic stimulation — he means
  neurostimulation broadly, sensory included, is a kind of neuromodulation. That
  is a coherent, mainstream clinical framing, neuromodulation-as-umbrella with
  neurostimulation as its stimulation-based branch.) The reason to defer is not a
  terminology mismatch but that it sits differently from ADR 0034's deliberate
  choice to make `Stimulation` the neutral umbrella and `Neuromodulation` a
  non-subsuming sibling of `SensoryStimulation`. Reconciling the two — e.g. a
  *defined* `Neurostimulation` class (neuromodulation delivered via a stimulation
  route), with medium (electric/magnetic/sensory) staying on the facet rather
  than becoming a primitive subclass tree, and "sensory neurostimulation" being
  the `SensoryRouteNeuromodulation` overlap ADR 0034 already names — is the work
  of ADR 0036.

- **Note 5 — treat meditation and breathing (and, per note 3, neurofeedback and
  biofeedback) as `Neuromodulation`.** Deferred to ADR 0036. This requires
  refining `sstim:Neuromodulation`'s exclusion of "endogenous physiological
  neuromodulation" — a frozen 0.9.0 decision — to separate *spontaneous
  physiological* neurotransmitter-level modulation (which should stay excluded)
  from *deliberate self-directed* neuromodulation (which the proposal brings in).
  The tension is real and legitimately argued (there is a self-neuromodulation
  literature); SSTIM currently takes the narrower intervention-side reading on
  purpose. Neutral typing of neurofeedback and biofeedback keeps the question
  open and honest until ADR 0036 decides it. This is the open question ADR 0035
  hands forward.

## Consequences

- Additive and backward-compatible on mutable latest; no term removed or
  renamed. Cutting the 0.10.0 snapshot, tag, and DOI is the separate release
  step (`make snapshot`), not part of this change.
- Every technique may now be queried by participant engagement mode, and the
  contrast set spans the convulsive branch. The active/passive axis makes it
  queryable why a "closed-loop" system (passive) differs from "self-regulation"
  (active).
- **Attribution.** These additions originate from Dr. Theo Marins's 2026-07-22
  interview. Provenance is recorded at term level via `skos:editorialNote` on
  the affected terms and in this ADR. As an ecosystem contributor, Theo is
  recorded through the ADR 0031/0032 qualified-relationship pipeline; because he
  has not yet been notified and real ecosystem records live outside the release
  repository (ADR 0031), his `contributor` record and University of Graz
  affiliation are staged privately pending notification and consent, not
  published in this repo.
