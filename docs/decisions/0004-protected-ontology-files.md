# ADR 0004 — Protected ontology files policy

**Status:** Accepted — 2026-04

## Context

Some files in the repository encode decisions that are not safely editable by
an AI agent acting on generic "cleanup" or "consistency" instructions:

- **The four core ontology files** (`sstim-core.ttl`, `sstim-vocab.ttl`,
  `sstim-shapes.ttl`, `sstim-alignments.ttl`). A well-meaning AI might
  "simplify" the dual-typing of SKOS concepts (ADR 0002), rename a class
  that downstream data depends on, or normalize whitespace in a way that
  churns diffs and destroys blame history.
- **The three `docs/technical/` defensive-publication documents**
  (`BREATHING_MODEL.md`, `SYMMETRY_SYSTEM.md`, `MARTIGLI_BINAURAL.md`).
  These are timestamped prior-art records. Modifying them after their
  first-commit date undermines their legal function as proof of prior
  public disclosure.

The default assumption of an AI coding agent is that files are freely
editable. Some files are not.

## Decision

Files listed in `CLAUDE.md` §3.4 are never modified by AI agents without an
explicit human instruction in the current session that names the file. The
protected list:

```
static/ontology/sstim-core.ttl
static/ontology/sstim-vocab.ttl
static/ontology/sstim-shapes.ttl
static/ontology/sstim-alignments.ttl
docs/technical/BREATHING_MODEL.md
docs/technical/SYMMETRY_SYSTEM.md
docs/technical/MARTIGLI_BINAURAL.md
```

"Explicit instruction" means a sentence in the current conversation
containing the verb *modify* (or a close synonym) and the file name.
General instructions like "fix all the SHACL failures" or "clean up the
vocabulary" do not authorize edits to protected files.

## Alternatives considered

- **No policy.** AI agents editing ontology during refactors silently
  alter vocabulary, rename classes that downstream data depends on, or
  "normalize" dual-typing away. All three occurred in testing before the
  policy was formalized.
- **OS-level read-only flag.** Breaks git workflows, does not distinguish
  human edits from AI edits, and the AI agent in practice has the
  authority to flip the flag.
- **Per-file front-matter marker (`# PROTECTED` comment).** AI agents
  tend to treat comments as editable content. A separate file (`CLAUDE.md`)
  with an explicit list is harder to accidentally remove or overlook.

## Consequences

- New vocabulary and classes enter the ontology via *new files* that
  cross-reference the protected core (e.g. `sstim-track.ttl` declares
  classes `subClassOf sstim:EntrainmentBasedTechnique` from the core
  without modifying the core itself).
- When a protected file genuinely needs to change (e.g. the
  `FrequencyBandGroup` class added to `sstim-core.ttl` in 2026-04), the
  session records show explicit human authorization naming the file.
- SHACL failures in protected files are documented as known issues rather
  than silently patched (precedent: `sstim-v:allFrequencyBands` was
  recorded in `TODO.md` for weeks before being authorized for fix).
- The policy is AI-agent-specific. Human maintainers edit these files
  normally. The policy exists because AI agents have weaker priors about
  which files are safe to touch; human maintainers have session context
  that makes the difference obvious.

## See also

- [`CLAUDE.md` §3.4](../../CLAUDE.md) — the enforcement rule itself.
- [ADR 0002](0002-dual-typing-owl-skos.md) — one of the patterns the
  policy protects.
