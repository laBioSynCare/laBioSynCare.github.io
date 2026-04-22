# docs — BSC Lab Reference Documents

Narrative and technical specification documents. The ontology's machine-
readable form lives in [`../ontology/`](../ontology/); this directory holds
the prose that justifies and explains it.

Every document here is a BSC Lab canonical reference: assume a future AI
agent or new contributor will read the document end-to-end before editing
anything adjacent to it. Keep them self-contained.

---

## `concept/` — what the domain is and what we claim

- [`SENSORY_STIMULATION.md`](concept/SENSORY_STIMULATION.md) — defines the
  "sensory stimulation" term and grounds the first ontology classes.
- [`SCOPE.md`](concept/SCOPE.md) — what BSC Lab claims and explicitly does
  not claim. Load-bearing for every user-facing string; see `CLAUDE.md` §3.5.
- [`EVIDENCE_FRAMEWORK.md`](concept/EVIDENCE_FRAMEWORK.md) — the six-tier
  evidence system used throughout the ontology.
- [`FACILITATING_DEDICATION.md`](concept/FACILITATING_DEDICATION.md) — the
  primary validated use case narrative.

## `technical/` — specifications

- [`PRESET_FORMAT.md`](technical/PRESET_FORMAT.md) — canonical preset JSON
  format. Source for `schemas/preset.schema.json` (planned — Phase 1).
- [`SESSION_MODEL.md`](technical/SESSION_MODEL.md) — preset vs. session
  instance distinction. Source for `schemas/session.schema.json` (planned).
- [`BREATHING_MODEL.md`](technical/BREATHING_MODEL.md) — Martigli breathing
  system specification. **Defensive publication — do not modify** after
  first commit (see `CLAUDE.md` §3.4).
- [`SYMMETRY_SYSTEM.md`](technical/SYMMETRY_SYSTEM.md) — Symmetry permutation
  system. **Defensive publication.**
- [`MARTIGLI_BINAURAL.md`](technical/MARTIGLI_BINAURAL.md) — hybrid voice
  type specification. **Defensive publication.**
- [`AUDIO_ENGINE_ARCHITECTURE.md`](technical/AUDIO_ENGINE_ARCHITECTURE.md) —
  pluggable audio engine design (Web Audio, AudioWorklet, three-clock model).
- [`VISUAL_ENGINE_ARCHITECTURE.md`](technical/VISUAL_ENGINE_ARCHITECTURE.md) —
  pluggable visual engine design (PixiJS v8 default, CSS fallback).

## `ecosystem/` — IP, governance, outreach

- [`IP_STRATEGY.md`](ecosystem/IP_STRATEGY.md) — defensive-publication-first
  approach over patents; trademark plan.
- [`W3C_CG_CHARTER.md`](ecosystem/W3C_CG_CHARTER.md) — draft charter for a
  Community Group around the sensory-stimulation ontology.
- [`ADVISORY_BOARD.md`](ecosystem/ADVISORY_BOARD.md) — named members and
  roles.
- [`PARTNERS.md`](ecosystem/PARTNERS.md) — named partners with interest
  letters.
- [`CONSORTIUM_INVITATION.md`](ecosystem/CONSORTIUM_INVITATION.md) — outreach
  template for academic and industry partners.
