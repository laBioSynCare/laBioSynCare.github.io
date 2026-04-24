# docs — BSC Lab Reference Documents

Narrative and technical specification documents. The ontology's machine-
readable form lives in [`../static/ontology/`](../static/ontology/); this directory holds
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

## `decisions/` — architecture decision records

Lightweight ADRs capturing non-obvious architectural choices with context,
alternatives, and consequences. See
[`decisions/README.md`](decisions/README.md) for the index and format.

- [0001](decisions/0001-namespace-split.md) — two-root namespace split
  (`sstim` vs `bsc`).
- [0002](decisions/0002-dual-typing-owl-skos.md) — dual-typing of SKOS
  concepts and OWL classes (Pattern 2).
- [0003](decisions/0003-named-graphs-for-modules.md) — named graphs for
  runtime module isolation.
- [0004](decisions/0004-protected-ontology-files.md) — protected ontology
  files policy.
- [0005](decisions/0005-binaural-carrier-pair-only.md) — binaural beat
  parameterized as carrier pair only.
- [0006](decisions/0006-one-class-per-technique.md) — one class per
  technique; voice classes named `*Voice` (not `*VoiceSpec`).

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
