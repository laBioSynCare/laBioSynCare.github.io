# Defensive Publications — Filing Tracker

This file tracks the external filing of BSC Lab's three defensive-publication
technical specs into indexed, examiner-searchable prior-art systems (IP.com,
arXiv / OSF). The repository commit already establishes the legal disclosure
date; these filings are belt-and-suspenders that put the disclosure into
databases a patent examiner actually searches.

> The three source documents are **immutable** (CLAUDE.md §3.4). Nothing in this
> filing process edits them. Submissions reproduce their content as-is and cite
> the establishing commit. This tracker is the staging/record file; fill in the
> **Receipts** section as each submission completes.

## Establishing prior-art fact

All three documents were first committed to the public repository in:

- **Commit `41ec3c3`** (`41ec3c3d52e2e2b05f81949a6a827d16ce111c8f`)
- **Date: 2026-04-21**
- Repository: `https://github.com/laBioSynCare/laBioSynCare.github.io`

Every submission abstract must cite this commit hash + date as the prior
disclosure date.

## Decisions needed before filing (human)

These are flagged in `TODO.md` and `IP_STRATEGY.md` and block the actual
submissions — they are Renato's calls, not Claude's:

- [ ] **arXiv category** — cs.SD (Sound) vs q-bio.NC (Neurons and Cognition).
      Recommendation below per document; cs.SD is the cleaner fit for all three
      (they are signal-processing method disclosures), with q-bio.NC as a
      cross-list if Juliana endorses.
- [ ] **arXiv endorsement** — needs an endorser for the chosen category. Paths:
      Renato's IPRJ/UERJ affiliation, or Juliana Braga de Salles Andrade (PhD,
      UERJ) for q-bio.NC. **If endorsement stalls, use OSF Preprints** — no
      endorsement requirement, still DOI-minted and indexed. Do not let the
      endorsement question delay the timestamped record.
- [ ] **Venue priority** — IP.com (purpose-built defensive-publication registry,
      paid) vs arXiv/OSF (free, academic citation graph). Recommendation: do the
      free arXiv/OSF route first (zero cost, fast), add IP.com if budget allows.

## License note for submissions

The defensive-publication docs sit in a CC BY 4.0 / Apache-licensed repo. arXiv
accepts CC BY. State CC BY 4.0 on the arXiv/OSF submission so the disclosure is
unambiguously open.

---

## Document 1 — Martigli Oscillation System

- **Source:** `docs/technical/BREATHING_MODEL.md` (do not modify)
- **Title:** *Breathing Model: Martigli Oscillation System*
- **Suggested category:** arXiv cs.SD (primary), q-bio.NC (cross-list)
- **Novel elements claimed as prior art** (per IP_STRATEGY.md): sinusoidal
  frequency-modulated breathing guidance; progressive deceleration arc;
  multi-modal phase synchronization; the Martigli-Binaural constant-beat-
  frequency variant.

**Abstract draft (~150 words):**

> We disclose the Martigli oscillation system, a method for guiding paced
> breathing through a continuously frequency-modulated audio (and optionally
> visual/haptic) carrier whose modulation period traces a sinusoidal arc rather
> than a fixed rate. The system defines a progressive deceleration arc that
> lengthens the breathing period over a session toward a target, and a
> multi-modal phase-synchronization scheme that locks auditory, visual, and
> haptic guidance to a single oscillation term. We describe the parameterization,
> the interpolation of the breathing arc, and a constant-beat-frequency binaural
> variant. Paced breathing, audiovisual entrainment, and binaural beats are
> long-standing prior art; this disclosure is positioned at the specific
> combination and parameterization above. Published as a defensive disclosure to
> establish prior art and keep these techniques in the public domain. First
> disclosed in public repository commit 41ec3c3, 2026-04-21.

---

## Document 2 — Sonic Symmetry Permutation Entrainment

- **Source:** `docs/technical/SYMMETRY_SYSTEM.md` (do not modify)
- **Title:** *Symmetry System: Sonic Symmetry Permutation Entrainment*
- **Suggested category:** arXiv cs.SD (primary), math.GR / q-bio.NC (cross-list)
- **Novel elements claimed as prior art:** log-distributed pitch sequences;
  algebraic group permutations of note order; the isochronic-pulse special case;
  the partial-predictability cognitive mechanism.

**Abstract draft (~150 words):**

> We disclose Sonic Symmetry permutation entrainment, a method for generating
> rhythmic-melodic stimulation sequences by applying algebraic group permutations
> to a log-distributed set of pitches. The note onset interval and rate are
> derived from a sequence length and duration, yielding an isochronic pulse train
> as the zero-octave special case and richer melodic permutations as octave span
> increases. We describe the permutation group structure, the mapping from group
> elements to playable sequences, and a partial-predictability mechanism by which
> the listener's sequence expectation is alternately confirmed and surprised. The
> disclosure covers the permutation-to-sequence construction and the isochronic
> limit, not isochronic tones per se, which are prior art. Published as a
> defensive disclosure to establish prior art. First disclosed in public
> repository commit 41ec3c3, 2026-04-21.

---

## Document 3 — Martigli-Binaural Hybrid

- **Source:** `docs/technical/MARTIGLI_BINAURAL.md` (do not modify)
- **Title:** *Martigli-Binaural: Breathing-Synchronized Binaural Beat with
  Constant Entrainment Frequency*
- **Suggested category:** arXiv cs.SD (primary), q-bio.NC (cross-list)
- **Novel elements claimed as prior art:** constant-beat-frequency invariant
  derivation under breathing modulation; shared-oscillation-term implementation;
  bloom interaction geometry; Martigli-synced spatial panning.

**Abstract draft (~150 words):**

> We disclose the Martigli-Binaural hybrid, a method that modulates the carrier
> frequency of a binaural pair in synchrony with a breathing oscillation while
> holding the binaural beat frequency constant. We derive the invariant: applying
> the same oscillation term to both ears preserves their difference, so the
> entrainment beat is unchanged while the absolute pitch breathes. We describe a
> shared-oscillation-term implementation that guarantees the invariant by
> construction, a "bloom" interaction geometry for combining breathing depth with
> beat frequency, and a Martigli-synchronized spatial panning scheme. Binaural
> beats and paced breathing are prior art; this disclosure is positioned at the
> constant-beat-frequency-under-breathing-modulation combination and its
> implementation. Published as a defensive disclosure to establish prior art.
> First disclosed in public repository commit 41ec3c3, 2026-04-21.

---

## Per-submission checklist (repeat for each document)

- [ ] Confirm category + secure endorsement (or switch to OSF)
- [ ] Convert the source `.md` to the venue's format (PDF/LaTeX for arXiv;
      Markdown/PDF for OSF) **without changing technical content**
- [ ] Put the commit-hash + date prior-disclosure line in the abstract
- [ ] State CC BY 4.0
- [ ] Submit; record the assigned identifier below
- [ ] (Optional) File the same content to IP.com Defensive Publications

## Receipts (fill in as filed)

| Document | Venue | Identifier / DOI | Date filed | Status |
|---|---|---|---|---|
| Martigli Oscillation System | — | — | — | not submitted |
| Sonic Symmetry Permutation | — | — | — | not submitted |
| Martigli-Binaural Hybrid | — | — | — | not submitted |

*Last updated: 2026-06-07.*
