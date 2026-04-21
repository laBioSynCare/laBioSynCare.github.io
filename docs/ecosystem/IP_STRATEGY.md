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

**BSC Lab open-source software.** The application codebase is MIT licensed.
Any researcher can fork it, run it, and build on it.

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
