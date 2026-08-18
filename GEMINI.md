# GEMINI.md — BSC Lab

> **Read [`CLAUDE.md`](CLAUDE.md) completely before changing anything in this
> repository.** It is the full directive: architecture, invariants, preset and
> RDF rules, and the reasoning behind each. This file exists because your tool
> does not load it automatically, and it is a pointer, not a replacement.
>
> Where this file and `CLAUDE.md` disagree, `CLAUDE.md` wins. It is maintained
> in the same commit as the change it describes; this file is deliberately short
> so it has little room to drift.

## What this project is

**BSC Lab** is an open-source sensory stimulation platform with two layers: a
precision multi-engine audiovisual stimulation application, and an RDF knowledge
graph browser, annotator and SPARQL interface over the SSTIM ontology (OWL
classes, SKOS vocabulary, SHACL shapes, linked evidence).

SSTIM is a universal standard; **BioSynCare** is a separate closed-source
commercial application, and BSC Lab does not feed it today. Do not conflate
them, and do not add BioSynCare-specific logic to SSTIM or the native model.

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
5. **No health, medical or treatment claims in user-facing copy.** Wellness
   framing only. Regulatory, not stylistic. See `docs/concept/SCOPE.md`.
6. **Name your instrument before claiming something is missing.** Before writing
   that anything is absent, untested or undone, say what you checked with and
   confirm it could see where the thing lives. Use
   `python3 scripts/locate-iri.py <iri>` for SSTIM identifiers, and
   `docs/ontology/TERM_INDEX.md` before saying a term does not exist. An
   unreachable instrument is INCOMPLETE, never absence.
7. **Svelte 5 runes only.** `$props()`, `$state()`, `$derived()`, `onclick`,
   `{@render children()}`. Not `export let`, `$:`, `on:click`, `<slot />`.

## Before you commit

`make validate` for anything under `static/ontology/` — it is the same gate CI
runs. `make test` and `make check` for application changes. Both take a while;
`make -j4 -Otarget validate` is faster and equivalent.

## Note for Gemini

This repository uses Svelte 5 runes and a modular OWL/SKOS/SHACL ontology.
If you are unsure whether SSTIM already defines a term, grep
`docs/ontology/TERM_INDEX.md` — it is generated from the 18 modules and
CI-checked. Eighteen modules is more than anyone searches reliably by hand.
