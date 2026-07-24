# ADR 0036 — Neurostimulation, the two senses of neuromodulation, and the self-directed split

**Status:** Accepted — 2026-07-23 · targets SSTIM 0.10.0

Disambiguates the two senses of "neuromodulation" (intervention vs. effect),
adds `Neurostimulation` as the stimulation-based branch, splits neuromodulation
into self-directed vs. interventional, brings deliberate self-regulation
(neurofeedback, biofeedback) under neuromodulation while keeping spontaneous
physiological modulation out, and adds `Neuroplasticity` as a disposition. It
continues the 2026-07-22 Theo Marins interview thread that produced
[ADR 0035](0035-participant-engagement-mode-and-endogenous-self-regulation.md),
resolving the two questions ADR 0035 explicitly parked (its notes 4 and 5).

The implementation touches protected term files
([ADR 0004](0004-protected-ontology-files.md); `CLAUDE.md` §3.4). Maintainer
approval to edit them was given in session on 2026-07-23 ("You have my
permission to edit the ttl files").

---

## Context

Two questions were pressed after ADR 0035:

1. Is "neurostimulation ⊂ neuromodulation" (per Theo, and not restricted to
   electrical/magnetic — sensory included) the right relation, or are they
   *distinct things* — neurostimulation the **delivery**, neuromodulation the
   **effect**, neuroplasticity the enabling **property**?
2. Should self-directed practices (meditation, breathing, neurofeedback,
   biofeedback) come under neuromodulation, split from externally-applied?

### The literature: "neuromodulation" carries two referents

The word is genuinely polysemous, and the two communities that use it mean
different things:

- **Interventional / device sense** (International Neuromodulation Society):
  neuromodulation as the *targeted delivery of a stimulus to alter nerve
  activity*. Here it is an intervention umbrella, and **neurostimulation is its
  stimulation-based branch** alongside intrathecal drug delivery. Under this
  sense, "neurostim ⊂ neuromod" is true and standard.
- **Neurophysiological / effect sense** (Kaczmarek & Levitan 1987,
  *Neuromodulation: The Biochemical Control of Neuronal Excitability*):
  neuromodulation as the *alteration of neuronal properties* — the effect, an
  endogenous process (dopamine, ACh, noradrenaline changing gain), which a
  delivery *causes*. Under this sense, delivery and effect are a **cause→effect
  pair, not an is-a relation**.

The INS definition itself conflates delivery and effect in one slogan ("technology
that acts upon nerves … the alteration of nerve activity"). That is fine as a
field banner but cannot be copied into a BFO ontology, where a delivery process
is never identical to, or a subtype of, the effect process it causes.

**Conclusion.** The subsumption question is ill-posed as stated. The
delivery/effect distinction is the more *fundamental* backbone (BFO-forced,
sense-stable, and the older meaning); "neurostim ⊂ neuromod" survives as a
**theorem over the intervention sense**, not the foundation. Neuroplasticity is a
third, different category — a **disposition** — and its relation to neuromodulation
is bidirectional: plasticity enables *durable* neuromodulation, while
neuromodulators in turn *gate* plasticity (they set LTP/LTD thresholds), so it is
not modelled as a one-way precondition.

## Decision

Keep ADR 0034's neutral `Stimulation` backbone. Grant both of Theo's points on
top of it, as follows.

1. **Pin `sstim:Neuromodulation` to the intervention sense** (it already said
   "this intervention-side class") and refine its scope note to (a) mark it as
   distinct from the *effect* sense, and (b) replace the blanket exclusion of
   "endogenous physiological neuromodulation" with a precise one: **spontaneous
   physiological** (neurotransmitter-level) modulation stays *out*, but
   **deliberate self-directed** neuromodulation is *in*.

2. **The effect sense stays implicit**, named by a SKOS **collection**
   (`sstim-v:NeuromodulatoryEffectCollection`) grouping the state-change outcome
   phenomena, **not** a new class — see the Q2 analysis below.

3. **`sstim:Neurostimulation`** ⊑ `sstim:InterventionalNeuromodulation` — the
   stimulation-based (energy-applied) branch. Electric and magnetic are **facet
   views** on the delivery medium, not subclasses; the **sensory** branch is the
   `SensoryRouteNeuromodulation` overlap ADR 0034 already names. Pharmacological
   neuromodulation (intrathecal delivery) is *not* neurostimulation.

4. **Self-directed vs. interventional split.** Add
   `sstim:SelfDirectedNeuromodulation` and `sstim:InterventionalNeuromodulation`
   as subclasses of `Neuromodulation` (not disjoint — some cases blur). The split
   is *carried on techniques by the participant-engagement-mode facet* (ADR 0035),
   not by parallel technique shapes. **Neurofeedback and biofeedback** are
   re-typed from the neutral `StimulationTechnique` layer to
   `NeuromodulationTechnique` (they have a real delivery — the sensory feedback —
   and can carry route/approach/target), with engagement `active-self-regulatory`
   marking them self-directed.

5. **The delivery boundary.** Pure self-directed practices with *no applied
   stimulus* — unguided meditation, volitional breathwork — are self-directed
   neuromodulation **processes** but have no delivery medium, so they fall
   **outside** SSTIM's stimulation-**technique** catalogue (the `TechniqueShape`
   requires `characteristicDeliveryMedium`). Their feedback/cue-mediated cousins
   (neurofeedback, biofeedback, paced-breathing *guidance*) do have a delivery and
   are catalogued. This gives SSTIM's "Stimulation" scope a principled edge rather
   than forcing meditation into a stimulation model it does not fit.

6. **`sstim:Neuroplasticity`** ⊑ `bfo:0000016` (disposition) — a stub: the
   nervous system's capacity for lasting change that durable neuromodulation
   realizes, related bidirectionally (see Context).

## Q2 — why `NeuromodulatoryEffect` is a collection, not a class

The effect is **already reified**: "neuromodulation-as-effect" is a
`NeuralPhenomenon` asserted in the **outcome** role (`outcomeNeuralPhenomenon`) —
the exact use the tri-role property design was built for. Minting a class would
add a *label*, not a *partition* (the redundant-class smell ADR 0034 avoided for
route/target/system/phenomenon). The one distinction a class would draw —
*lasting modulation* vs. *transient driven response* — is already available as
the split between the state-change phenomena and `phenomenonEvokedResponse`. The
costs of a class are recurring: placement limbo between an IAO category and a BFO
process, double-modeling against the phenomenon facet, and re-litigating the
field's most contested word on a class one would have to defend. A class would
only earn its keep if SSTIM were an effects *registry*; it is a delivery-centric
stimulation ontology with a deliberately thin, evidence-gated effect side. So the
effect stays a facet, named via a collection for legibility.

## Alternatives considered

- **Rebuild the tree on "neuromodulation" as the umbrella** (the full clinical
  framing). Rejected: it hangs the top of the ontology on the most contested term,
  and mis-frames the sensory stimulation that has no neural-modulation objective.
- **Primitive medium subclasses** `Electric/Magnetic/SensoryNeurostimulation`.
  Rejected: reverses ADR 0034's property-views decision and forces "why only
  these media?" then multiplies by invasiveness × target.
- **Parallel self-directed / interventional technique shapes** (a SHACL refactor).
  Rejected as unnecessary: SHACL here runs without inference, and the engagement
  facet already carries the distinction, so re-typing neurofeedback/biofeedback
  into the existing `NeuromodulationTechnique` shape (which they satisfy) is
  enough.

## Consequences

- Additive except for one scope-note refinement on the frozen-0.9.0
  `sstim:Neuromodulation` class and the re-typing of two technique concepts;
  no term removed or renamed. Ships on the unreleased 0.10.0 latest.
- Theo's "neurostim ⊂ neuromod" is now true (intervention sense) *and* the
  delivery/effect distinction is explicit (effect on the outcome facet) — both,
  by disambiguation, rather than one at the other's expense.
- Meditation/unguided breathwork are documented as out-of-technique-scope, giving
  the `Stimulation` umbrella a defensible boundary.
- Neuroplasticity gains a home as a disposition, the natural anchor for future
  "durable effect" modelling.

### Follow-up refinements (2026-07-24)

- **Browsable neurostimulation.** A technique-layer class
  `sstim:NeurostimulationTechnique` ⊑ `sstim:NeuromodulationTechnique` was added so
  `Neurostimulation` is a populated, browsable category rather than a
  query-only concept. The seven energy techniques (rTMS, tDCS, tACS, DBS, VNS, ECT,
  focused-ultrasound) are typed under it; intrathecal delivery (pharmacological)
  and neurofeedback/biofeedback (self-directed) are correctly excluded. Membership
  is asserted explicitly, and each technique keeps its `sstim:NeuromodulationTechnique`
  type as well, because the SHACL gate runs without subclass inference and the
  neuromodulation-technique shape must still fire. This does not reintroduce medium
  subclasses — electric/magnetic/acoustic remain delivery-medium facet views under
  the one route-defined technique class.
- **Definitional comments on the concepts.** `sstim:Neuromodulation` and
  `sstim:Neurostimulation` each carry a `skos:note` spelling out the two axes a
  reader must keep apart: the intervention-vs-effect sense, and the
  with-vs-without participant-engagement (interventional vs self-directed) split.
