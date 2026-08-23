# IP Strategy

BSC Lab's intellectual property strategy has one overriding objective: keep the
core techniques and vocabulary in the public domain while protecting the specific
BSC and BioSynCare brand expressions and user experience.

---

## What we protect

**Trademarks.** BioSynCare (the product name) and BSC (the platform identifier)
are the primary brand assets. Filing priority: Brazil (INPI, Classes 9 and 41),
then EUIPO and USPTO. "Sensory Stimulation" is descriptive and not trademarkable;
no trademark filing for the domain term.

**Trade dress.** The BioSynCare UI, color palettes, preset grouping structure,
and the Seraphony AI persona are candidate trade dress elements. Document with
dated screenshots and design files.

**Database rights.** The BSC preset catalog as a curated collection may qualify
for database rights under the EU Database Directive (Directive 96/9/EC). This
applies to the BioSynCare catalog specifically, not to the open-source ontology.

---

## What we actively release into the public domain

**Defensive publications.** Three technical documents have been published as
timestamped prior art records. First commit to the public GitHub repository
establishes the disclosure date:

- `docs/technical/BREATHING_MODEL.md` — Martigli oscillation system: sinusoidal
  frequency-modulated breathing guidance, progressive deceleration arc, multi-modal
  phase synchronization, Martigli-Binaural constant-beat-frequency variant.
- `docs/technical/SYMMETRY_SYSTEM.md` — Sonic Symmetry permutation entrainment:
  log-distributed pitch sequences, algebraic group permutations, isochronic
  special case, partial predictability cognitive mechanism.
- `docs/technical/MARTIGLI_BINAURAL.md` — Martigli-Binaural hybrid: constant beat
  frequency invariant derivation, shared oscillation term implementation, bloom
  interaction geometry, Martigli-synced spatial panning.

These documents are immutable after first commit. Any party attempting to patent
these techniques after the disclosure date faces this prior art directly.

**SSTIM ontology and vocabulary.** The ontology files at `https://w3id.org/sstim`
are CC BY 4.0. The vocabulary, class hierarchy, and SPARQL patterns are free for
any researcher or developer to use, extend, and redistribute.

*CC BY 4.0 versus CC0 — a decision kept open deliberately, reviewed 2026-08-18.*
OBO Foundry accepts either. CC BY preserves an enforceable attribution right,
which is worth something to a single-maintainer project that needs citations for
funding. The argument for CC0 is adoption friction: a consumer embedding a
handful of SSTIM terms in a dataset has no clear answer to "must I attribute?" —
individual terms are unlikely to be copyrightable, a compilation may be, and
that ambiguity is a real tax on cautious institutional users, who are exactly
the adopters worth having.

The asymmetry decides it for now. Relicensing CC BY to CC0 later is available,
since copyright is held by one person; relicensing away from CC0 is not. So CC
BY keeps the option and CC0 spends it. **Revisit only when a concrete potential
adopter names the licence as a blocker** — not speculatively, and not because
CC0 is fashionable in vocabulary circles.

**BSC Lab open-source software.** The application codebase is **Apache License
2.0**. Any researcher can fork it, run it, and build on it, and a commercial
implementation may use it without copyleft obligations.

*This document said MIT until 2026-08-18. It was written on 2026-04-21, the
licence files landed on 2026-04-25 choosing Apache 2.0, and the plan was never
updated — a four-day gap that survived four months in the document that is
supposed to be authoritative about intellectual property.*

**Apache 2.0 rather than MIT is the right choice here, and specifically because
of the strategy above.** MIT grants copyright permission and says nothing about
patents. Apache 2.0 §3 grants an express patent licence from every contributor
and terminates it for anyone who initiates patent litigation over the work. For
a project whose entire IP posture is defensive publication against future patent
claims, a licence that is silent on patents undercuts the strategy: a
contributor could contribute an implementation and later assert a patent over
it. Apache 2.0 §5 also places inbound contributions under the same terms without
requiring a contributor licence agreement, which keeps the contribution path
light. Neither licence imposes copyleft, so the closed commercial implementation
is unaffected by the change.

---

## What we do not claim

Binaural beats, isochronic tones, brainwave entrainment, audiovisual entrainment,
and paced breathing are prior art stretching back decades. We make no claims over
these techniques. Our defensive publications are positioned specifically at the
novel combination elements and the specific implementation techniques that are new.

---

## arXiv submissions

The three defensive publications should be submitted to arXiv (cs.SD or q-bio.NC)
with the GitHub first-commit hash cited as the prior disclosure date. This extends
the prior art record into the academic citation system. arXiv endorsement path:
Renato Fabbri's IPRJ/UERJ affiliation or contact Juliana Braga de Salles Andrade
(PhD neuroscience, UERJ) for endorsement of the q-bio.NC submissions.

**Action items:**
- [ ] Confirm arXiv category: cs.SD (Sound) vs q-bio.NC (Neurons and Cognition)
- [ ] Prepare arXiv submissions for all three defensive publications
- [ ] Cite GitHub commit hash in each submission abstract
- [ ] Submit before any third-party filing risk materializes (monitor patent databases
      quarterly for binaural beat and "breathing entrainment audio" filings)

---

## Open questions

**BioSynCare trademark scope.** Should "BioSynCare" be filed in Class 42 (Software
as a service) in addition to Classes 9 and 41? Consult with IP counsel.

**Seraphony.** The AI system name "Seraphony" is a candidate for trademark. Assess
conflict risk before filing.

**W3C CG and IP.** The W3C Community Group patent policy (CLA or RF commitment)
will govern any contributions to the W3C Sensory Stimulation CG. BSC Lab should
ensure all contributors sign the W3C CLA before the CG produces any normative
specification. This is standard W3C process but needs explicit tracking.
