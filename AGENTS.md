# AGENTS.md — SSTIM

> **Read [`CLAUDE.md`](CLAUDE.md) completely before changing anything in this
> repository.** It is the full directive: architecture, invariants, preset and
> RDF rules, and the reasoning behind each. This file exists because your tool
> does not load it automatically, and it is a pointer, not a replacement.
>
> Where this file and `CLAUDE.md` disagree, `CLAUDE.md` wins. It is maintained
> in the same commit as the change it describes; this file is deliberately short
> so it has little room to drift.

## What this project is

**SSTIM** is the open formalized knowledge standard: specification, RDF
vocabulary, semantic infrastructure, documentation, interoperability work, and
shared identifiers. The broader **SSTIM ecosystem** adds its reference tooling
and community, plus sensory-stimulation applications and initiatives related by
adoption, contribution, support, or documented domain relevance. **SSTIM
Workbench** is SSTIM's non-normative executable reference environment, with a
precision multi-engine audiovisual application plus Graph Navigator, annotation,
and a SPARQL interface over the SSTIM ontology.

Existing BSC/BSC Lab semantic identities and compatibility formats are preserved
provenance, not the public project brand. **BioSynCare** is a separate
closed-source commercial application that adopts and contributes to SSTIM; SSTIM
Workbench does not feed it today. Do not conflate them or add BioSynCare-specific
logic to SSTIM.

## The invariants, in short

These are the rules where a mistake is expensive or irreversible. They are
summarised, not restated in full — [`CLAUDE.md`](CLAUDE.md) §3 is authoritative
and includes the reasoning, which matters more than the rule.

1. **The engine timing context is the only clock.** `engine.getAudioContext().currentTime`
   is the sole authority for audio-visual sync. Never `Date.now()`,
   `performance.now()`, `setTimeout` or `setInterval` for timing.
2. **Never bundle `static/worklets/`.** AudioWorklet processors load by URL at
   runtime. Importing one puts it in Vite's module graph and breaks it.
3. **Never allocate inside `AudioWorkletProcessor.process()`.** ~2.67 ms budget
   on the audio thread; garbage collection there is audible.
4. **Never modify ontology files without an explicit instruction naming the
   file.** Everything under `static/ontology/` — `manifest.json` is the
   authoritative inventory — plus the three defensive publications in
   `docs/technical/`, which are timestamped prior-art records.
5. **Product copy is wellness-framed; scientific description is not.** A claim
   about what the software does for its user stays wellness-framed, which is
   regulatory and not stylistic. A definition of a technique, an evidence
   assessment or anything in `docs/` is held to accuracy instead: sensory
   stimulation is used clinically, and SSTIM publishes terms for it, including
   `sstim-v:techElectroconvulsiveTherapy`. See `docs/concept/SCOPE.md`.
6. **Name your instrument before claiming something is missing.** Before writing
   that anything is absent, untested or undone, say what you checked with and
   confirm it could see where the thing lives. Use
   `python3 scripts/locate-iri.py <iri>` for SSTIM identifiers, and
   `docs/ontology/TERM_INDEX.md` before saying a term does not exist. An
   unreachable instrument is INCOMPLETE, never absence.
7. **Svelte 5 runes only.** `$props()`, `$state()`, `$derived()`, `onclick`,
   `{@render children()}`. Not `export let`, `$:`, `on:click`, `<slot />`.

## Where to look, by what you are touching

| Touching | Read first |
|---|---|
| Presets, voices, bands, groups | `CLAUDE.md` §4 — the enums are **case-sensitive** and wrong case fails silently: `Binaural`, `Martigli`, `Martigli-Binaural`, `Symmetry`; groups `Heal`, `Support`, `Perform`, `Indulge`, `Transcend`; waveform fields are numeric `0`, never `"sine"` |
| RDF, OWL, SKOS, SHACL | `CLAUDE.md` §5 and `static/ontology/README.md` |
| Audio engines, worklets, timing | `CLAUDE.md` §3.1–3.3 and §6, `src/engines/README.md` |
| Service worker / PWA | `CLAUDE.md` §9 and ADR 0009 — never auto-reload, never intercept cross-origin, never precache the heavy assets |
| Svelte components | `CLAUDE.md` §2 — runes only |
| Product copy (UI, presets, store) | `docs/concept/SCOPE.md` — wellness framing, no treatment claims |
| Term definitions, evidence, docs | `docs/concept/SCOPE.md` — describe clinical use accurately |

## Before you commit

`make validate` for anything under `static/ontology/` — it is the same gate CI
runs. `make test` and `make check` for application changes. Both take a while;
`make -j4 -Otarget validate` is faster and equivalent.
