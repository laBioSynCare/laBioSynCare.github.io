# CLAUDE.md — BSC Lab AI Agent Directive

> **Read this file completely before touching any other file in this repository.**
> This directive applies to Claude Code, GitHub Copilot, Cursor, and all AI coding agents.
> Last updated: 2026-04-12. Maintained by Renato Fabbri.

---

## 1. What This Project Is

**BSC Lab** is an open-source sensory stimulation platform with two integrated layers:

1. **Stimulation layer** — a precision multi-engine audiovisual stimulation application
   (Web Audio API, PixiJS, haptics) that delivers sensory entrainment sessions
   via configurable preset protocols.

2. **Knowledge layer** — an RDF knowledge graph browser, annotator, and SPARQL
   query interface for the BSC ontology: OWL class hierarchy, SKOS vocabulary,
   SHACL validation shapes, and linked evidence chains.

BSC Lab is the open scientific and technical infrastructure. The related commercial
application is **BioSynCare** (separate repository, React Native, closed source).
BSC Lab feeds BioSynCare's preset catalog via a JSON export pipeline but is not
BioSynCare. Do not conflate them.

**Maintained by:** Renato Fabbri (PhD physics, musical composition, creator of the
`music` Python package on PyPI). Scientific advisor: Juliana Braga de Salles Andrade
(PhD neuroscience, neuroimaging).

**Key documents** — read these before working on any specific layer:
- `docs/concept/SENSORY_STIMULATION.md` — what the domain is
- `docs/concept/SCOPE.md` — what we claim and explicitly do not claim
- `docs/technical/PRESET_FORMAT.md` — the preset data format specification
- `ontology/README.md` — OWL/SKOS design decisions
- `src/README.md` — full software architecture

---

## 2. Technology Stack

These decisions are final unless `src/README.md` documents a change. Do not
substitute alternatives without explicit instruction.

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Build | Vite | 8.x (Rolldown) | ESM-native dev, fast HMR, Rolldown prod builds |
| UI framework | Svelte 5 | 5.x | Compiler-based, near-vanilla bundle, reactive stores fit SPARQL result rendering |
| RDF parsing/store | N3.js | 1.17+ | Parses Turtle/TriG/N-Quads, in-memory triple store |
| SPARQL engine | Comunica | `@comunica/query-sparql-rdfjs` 3.x | SPARQL 1.1 in browser against N3 store |
| RDF validation | rdf-validate-shacl | 0.5+ | SHACL in browser, Zazuko-maintained |
| Graph visualization | Cytoscape.js | 3.28+ | RDF ontology/evidence graph navigation |
| Visual engine (default) | PixiJS | v8.x | Auto WebGPU/WebGL, unified renderer API |
| Audio engine (default) | Vanilla Web Audio API | browser native | Direct AudioContext control, no abstraction overhead |
| Haptic engine (default) | Web Vibration API | browser native | NullHapticEngine fallback for unsupported platforms |
| Hosting | Firebase | current | Static hosting + content negotiation headers |
| Ontology docs | WIDOCO | current | HTML documentation from OWL, deployed to GitHub Pages |
| CSS | Pico.css | current | Semantic HTML-first, no utility class noise |

### Svelte 5 AI tooling setup

Svelte 5 uses **runes syntax** (`$props()`, `$state()`, `$derived()`, `$effect()`,
`onclick`, `{@render children()}`). AI models default to Svelte 4 syntax without
configuration. Always use:

```bash
# Add to MCP configuration
npx @sveltejs/mcp
```

And ensure `.cursor/rules/rdf.mdc` and `.cursor/rules/audio-engine.mdc` are loaded.
If an AI agent generates Svelte 4 syntax (`export let`, `$:`, `on:click`, `<slot />`),
reject it and regenerate with explicit runes instruction.

---

## 3. Absolute Invariants

**These rules are never violated under any circumstances. No exception, no workaround.**

### 3.1 AudioContext is the only clock

`AudioContext.currentTime` is the sole timing authority for all audio-visual
synchronization. It runs on the audio hardware thread and provides sub-millisecond
precision (~0.02ms at 48kHz).

```javascript
// CORRECT — always
const t = audioContext.currentTime;
oscillatorNode.frequency.setValueAtTime(value, t + 0.1);

// WRONG — never use for AV sync
Date.now()
performance.now()
setTimeout()
setInterval()
new Date()
```

Visual engine frames must read `audioContext.currentTime` at the start of each
`requestAnimationFrame` callback and compute all positions from it. Never accumulate
deltas. Always compute absolute position from the audio clock.

### 3.2 AudioWorklet files are never bundled

Files in `public/worklets/` are loaded by `AudioWorkletNode` at runtime via URL.
They run in an isolated audio rendering thread with no access to the main thread
DOM or module system.

```javascript
// CORRECT
await audioContext.audioWorklet.addModule('/worklets/binaural.worklet.js');

// WRONG — Vite must never process these
import BinauralWorklet from './worklets/binaural.worklet.js';
```

Never import worklet files. Never add them to Vite's module graph. They must remain
plain ES5-compatible scripts in `public/worklets/`.

### 3.3 No allocation inside AudioWorkletProcessor.process()

The `process()` callback runs on the audio rendering thread with a ~2.67ms budget
(128 samples at 48kHz). Any allocation (new arrays, closures, object creation) that
triggers garbage collection will cause audio glitches.

```javascript
// CORRECT — pre-allocate outside process()
class BinauralProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._phase = new Float32Array(2);  // pre-allocated
    this._buf = new Float32Array(128);  // pre-allocated
  }

  process(inputs, outputs) {
    // Use only pre-allocated buffers. No `new`. No spread. No closures.
    const out = outputs[0];
    // ... operate on this._phase, this._buf
    return true;
  }
}
```

### 3.4 Ontology files are not auto-modified

The files below encode scientific decisions, vocabulary definitions, and legal
prior art records. They are never modified by AI agents without an explicit
human instruction in the current session that says "modify [filename]":

```
ontology/sstim-core.ttl
ontology/sstim-vocab.ttl
ontology/sstim-shapes.ttl
ontology/sstim-alignments.ttl
docs/technical/BREATHING_MODEL.md
docs/technical/SYMMETRY_SYSTEM.md
docs/technical/MARTIGLI_BINAURAL.md
```

The three `docs/technical/` files above are defensive publications — timestamped
prior art records. Modifying them after their first commit date undermines their
legal function.

### 3.5 No health or medical claims in any user-facing copy

All user-facing text (UI strings, descriptions, metadata, web copy) must use
conservative wellness framing. This is a regulatory requirement, not a style
preference.

**Permitted verbs:** support, promote, facilitate, encourage, help, guide, invite.

**Prohibited verbs and constructions:** treat, cure, fix, eliminate, rewire,
correct pathology, restore diseased function, proven to, clinically proven,
scientifically proven, guaranteed to, eliminates [condition].

If you are generating any string that will appear in the UI or in a preset's
`descEng`/`descIta`/`descPrt`/`descEsp` fields, re-read `docs/concept/SCOPE.md`
before writing it.

---

## 4. Preset Format — Critical Rules

Presets are the core data objects. The canonical specification is
`docs/technical/PRESET_FORMAT.md`. These rules apply to any code that
reads, writes, validates, or generates presets.

### 4.1 Voice type names

Always written exactly as shown. Case-sensitive. Never abbreviated.

| Correct | Wrong |
|---|---|
| `"Binaural"` | `"binaural"`, `"BINAURAL"`, `"bin"` |
| `"Martigli"` | `"martigli"`, `"breathing"`, `"breath"` |
| `"Martigli-Binaural"` | `"MartigliB"`, `"MB"`, `"martigli-binaural"` |
| `"Symmetry"` | `"symmetry"`, `"sym"`, `"isochronic"` |

### 4.2 Waveform fields are always numeric zero

```json
// CORRECT
"waveformL": 0,
"waveformR": 0,
"waveformM": 0,
"waveform": 0

// WRONG — strings are invalid
"waveformL": "sine",
"waveform": "0"
```

### 4.3 Frequency band values (SKOS concept local names)

Always lowercase. These are the only valid values for `header.targetBand`:

```
Primary:   delta, theta, alpha, smr, beta, gamma
Sub-bands: low-delta, high-delta, low-theta, high-theta,
           low-alpha, high-alpha, low-beta, mid-beta, high-beta
Singles:   alpha-10, gamma-40
```

### 4.4 Group names

Always capitalized. Exactly one of: `Heal`, `Support`, `Perform`, `Indulge`, `Transcend`.

### 4.5 Breathing constraint

At most **one** voice per preset may have `isOn: true`. If `isOn: true`, `mp0`
must be ≥ 3 (values below 3s are tremolo, not breathing guidance). `hasBreathGuide`
in the header must be `true` if and only if exactly one voice has `isOn: true`.

### 4.6 Volume defaults and limits

```javascript
// Defaults by voice type
Martigli / Martigli-Binaural: 0.25
Binaural:                      0.18
Symmetry:                      0.13

// Hard limits
iniVolume > 0.30  →  requires explicit rationale in code comment
iniVolume = 1.0   →  invalid; do not generate
```

### 4.7 Symmetry timing — use engine model, not deprecated abstraction

The note/pulse rate is `nnotes / d` Hz. The onset interval is `noteSep = d / nnotes`.
The maximum supported rate is 50 Hz (`noteSep` ≥ 20ms). When `noctaves = 0`, the
voice is a traditional isochronic pulse train — validate by pulse rate target, not
by melodic note duration rules.

```javascript
// CORRECT: 10 Hz isochronic
{ noctaves: 0, nnotes: 10, d: 1.0 }    // 10/1.0 = 10 Hz ✓
{ noctaves: 0, nnotes: 20, d: 2.0 }    // 20/2.0 = 10 Hz ✓

// CORRECT: 40 Hz isochronic
{ noctaves: 0, nnotes: 8,  d: 0.2 }    // 8/0.2 = 40 Hz ✓
{ noctaves: 0, nnotes: 20, d: 0.5 }    // 20/0.5 = 40 Hz ✓

// WRONG: exceeds 50 Hz limit
{ noctaves: 0, nnotes: 3,  d: 0.05 }   // 3/0.05 = 60 Hz ✗
```

---

## 5. RDF/Ontology — Critical Rules

### 5.1 Namespace declarations

All RDF work uses namespaces defined in `src/rdf/namespaces.js`. Never hardcode
namespace strings inline. Import from that file.

```javascript
// CORRECT
import { SSTIM, SSTIM_V, OWL, SKOS, RDF, RDFS, XSD } from '../rdf/namespaces.js';

// WRONG — hardcoded strings
const band = 'https://w3id.org/sstim#FrequencyBand';
```

The canonical BSC namespace prefixes:

```turtle
@prefix sstim:    <https://w3id.org/sstim#> .
@prefix sstim-v:  <https://w3id.org/sstim/vocab#> .
@prefix sstim-sh:   <https://w3id.org/sstim/shapes#> .
```

**Namespace convention — two IRI roots, one rule each.**

- `https://w3id.org/sstim` (`/sstim#`, `/sstim/vocab#`, `/sstim/shapes#`) — the
  **ontology**: OWL classes and properties, SKOS vocabulary concepts, SHACL
  shapes. This is the reusable, citable scientific artifact. Every `.ttl` file
  in `ontology/` declares its prefixes here.
- `https://w3id.org/bsc/{preset,session,annotation,evidence}/...` — **BSC
  product instances**: preset IRIs, session records, user annotations, evidence
  chain nodes specific to the BSC/BioSynCare catalog. These live under a
  product-scoped namespace so the ontology stays reusable by other projects.

Never publish a BSC preset or session under `w3id.org/sstim`; never declare an
OWL class or SKOS concept under `w3id.org/bsc`. If you are unsure which root
applies to something new, ask — do not guess.

### 5.2 Dual-typing pattern for vocabulary concepts

SKOS concepts in `sstim-vocab.ttl` are dual-typed: they are both `skos:Concept` and
instances of the relevant OWL class. This is intentional (Pattern 2 design decision
documented in `ontology/README.md`). Do not "fix" this by removing either type.

```turtle
# CORRECT — dual-typed individual
sstim-v:alpha a skos:Concept, sstim:FrequencyBand ;
    skos:prefLabel "Alpha"@en, "Alfa"@it, "Alfa"@pt, "Alfa"@es .

# WRONG — removing the OWL class membership breaks SHACL validation
sstim-v:alpha a skos:Concept ;
    skos:prefLabel "Alpha"@en .
```

### 5.3 SPARQL query patterns

Always use `src/rdf/query.js` for SPARQL execution. Standard patterns:

```javascript
// Get all presets with evidence tier and target bands
const PRESET_QUERY = `
PREFIX sstim: <https://w3id.org/sstim#>
PREFIX sstim-v: <https://w3id.org/sstim/vocab#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?preset ?label ?evidenceTier ?band ?bandLabel WHERE {
  ?preset a sstim:Preset ;
          rdfs:label ?label ;
          sstim:evidenceTier ?evidenceTier ;
          sstim:targetsFrequencyBand ?band .
  ?band skos:prefLabel ?bandLabel .
  FILTER(LANG(?label) = "en")
  FILTER(LANG(?bandLabel) = "en")
}
ORDER BY ?evidenceTier`;

// SKOS hierarchy traversal — all sub-bands of alpha
const SUBBANDS_QUERY = `
PREFIX sstim-v: <https://w3id.org/sstim/vocab#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT ?band WHERE {
  sstim-v:alpha skos:narrower* ?band .
}`;
```

### 5.4 SHACL validation before any preset export

Before exporting any preset from the RDF store to JSON, run SHACL validation:

```javascript
import { validate } from '../rdf/validate.js';

const report = await validate(dataStore, shapesStore);
if (!report.conforms) {
  // Log violations. Do not export.
  report.results.forEach(r => console.error(r.message, r.focusNode));
  return null;
}
```

### 5.5 Annotations use named graphs

Annotation data is stored in named graphs, never in the default graph. The default
graph contains only authoritative ontology data. This separation is enforced in
`src/rdf/annotations/AnnotationStore.js`.

```javascript
// CORRECT — annotation in named graph
const annotationGraph = namedNode(`https://w3id.org/bsc/annotations/${userId}`);
store.addQuad(subject, predicate, object, annotationGraph);

// WRONG — annotation in default graph pollutes authoritative data
store.addTriple(subject, predicate, object);
```

---

## 6. Stimulation Engine Architecture

The full architecture is in `src/README.md` and `src/core/README.md`. Critical
points for any code touching the engine:

### 6.1 Three-clock architecture — never collapse it

The system uses three synchronized clocks with distinct roles:

```
Audio hardware clock    AudioContext.currentTime  — master authority, sub-ms precision
Scheduling clock        Web Worker + setInterval  — 25ms ticks, immune to main-thread jank
Rendering clock         requestAnimationFrame     — visual updates, reads audio clock
```

The Worker scheduler reads `AudioContext.currentTime`, schedules events 100ms ahead,
and posts timing state to the main thread. The rAF loop reads current audio time and
renders. Never merge these clocks. Never schedule audio events from rAF.

### 6.2 Engine interface contract

All audio, visual, and haptic engines implement the interfaces in:
- `src/engines/audio/IAudioEngine.js`
- `src/engines/visual/IVisualEngine.js`
- `src/engines/haptic/IHapticEngine.js`

When adding a new engine implementation, implement the full interface. Never call
engine-specific methods from the orchestrator — only interface methods.

### 6.3 Engine capability detection

```javascript
// CORRECT — always check capabilities before using features
const caps = audioEngine.getCapabilities();
if (caps.supportsWasm) {
  // use WASM DSP path
} else {
  // fall back to vanilla Web Audio
}

// WRONG — assuming capability
audioEngine.loadWasmModule(url); // may throw on unsupported engine
```

### 6.4 Haptic timing offset

The Vibration API and Web Audio API use different clocks with no shared reference.
Always offset haptic events by `audioContext.outputLatency`:

```javascript
const hapticDelay = audioContext.outputLatency * 1000; // convert to ms
setTimeout(() => hapticEngine.vibrate(pattern), hapticDelay);
```

iOS Safari does not support `navigator.vibrate()`. `NullHapticEngine` handles this
silently. Never let a missing haptic engine throw or log errors to the user.

---

## 7. Project Structure Quick Reference

```
CLAUDE.md                     ← you are here
README.md                     ← GitHub landing page
ROADMAP.md                    ← strategic phases
TODO.md                       ← all tracked work (dev + ecosystem)
CONTRIBUTING.md               ← governance and contribution guide

docs/
  concept/                    ← SENSORY_HARNESSING, SCOPE, EVIDENCE_FRAMEWORK,
  │                             FACILITATING_DEDICATION
  technical/                  ← PRESET_FORMAT, SESSION_MODEL, BREATHING_MODEL,
  │                             SYMMETRY_SYSTEM, MARTIGLI_BINAURAL,
  │                             AUDIO_ENGINE_ARCHITECTURE, VISUAL_ENGINE_ARCHITECTURE
  ecosystem/                  ← IP_STRATEGY, W3C_CG_CHARTER, ADVISORY_BOARD,
                                PARTNERS, CONSORTIUM_INVITATION

ontology/
  sstim-core.ttl                ← OWL ontology
  sstim-vocab.ttl               ← SKOS vocabulary (multilingual)
  sstim-shapes.ttl              ← SHACL validation shapes
  sstim-alignments.ttl          ← external links (Wikidata, DBpedia, OBO)
  instances/                  ← preset and reference instances as RDF

schemas/
  preset.schema.json          ← JSON Schema for preset validation
  session.schema.json         ← JSON Schema for session instance records

src/
  engines/audio/              ← IAudioEngine + implementations
  engines/visual/             ← IVisualEngine + implementations
  engines/haptic/             ← IHapticEngine + implementations
  core/                       ← MasterClock, Orchestrator, Scheduler, Recorder
  rdf/                        ← loader, store, query, validate, export, namespaces
  ui/player/                  ← session player + engine switcher
  ui/creator/                 ← real-time preset/session creation
  ui/browser/                 ← SPARQL-driven preset browser
  ui/graph/                   ← RDF graph visualization (Cytoscape.js)
  ui/annotation/              ← annotation editor (CodeMirror + named graphs)
  ui/sparql/                  ← power user SPARQL interface
  data/presets/               ← JSON preset files (source until RDF pipeline complete)

public/
  worklets/                   ← AudioWorklet processors (never bundled)
    binaural.worklet.js
    martigli.worklet.js
    symmetry.worklet.js

tests/
  rdf/                        ← ontology consistency, SHACL validation
  engines/                    ← engine interface compliance
  schemas/                    ← preset JSON schema validation
```

---

## 8. What You Must Not Do

These are not style preferences. They are constraints derived from scientific,
legal, regulatory, or architectural requirements.

| Action | Reason |
|---|---|
| Modify `ontology/bsc-*.ttl` without explicit instruction | Vocabulary changes require scientific review |
| Modify the three defensive publication files | They are timestamped prior art records |
| Use `Date.now()` or `setTimeout()` for AV sync | Only `AudioContext.currentTime` is authoritative |
| Bundle files in `public/worklets/` | AudioWorklets must load as plain static scripts |
| Allocate inside `AudioWorkletProcessor.process()` | GC in the audio thread causes glitches |
| Write health, medical, or treatment claims | Regulatory compliance; see `docs/concept/SCOPE.md` |
| Use Svelte 4 syntax (`export let`, `$:`, `on:click`) | This project uses Svelte 5 runes only |
| Add ontology IRIs as hardcoded strings | Use `src/rdf/namespaces.js` exclusively |
| Write preset group names in lowercase | `Heal`, `Support`, `Perform`, `Indulge`, `Transcend` — always capitalized |
| Write voice type names as anything other than the exact enum | `"Binaural"`, `"Martigli"`, `"Martigli-Binaural"`, `"Symmetry"` |
| Merge annotation data into the default RDF graph | Annotations live in named graphs only |
| Call engine-specific methods from `StimulationOrchestrator` | Only interface methods; use capability detection |
| Set `iniVolume: 1.0` in any preset | Hard upper limit; use ≤ 0.30 by default |
| Set `isOn: true` on more than one voice per preset | Exactly one voice carries the breathing reference |

---

## 9. Known Pitfalls

**Svelte 5 runes syntax confusion.** AI models default to Svelte 4 without the MCP
server configured. Check every generated Svelte component for `export let` or `$:`
— both are Svelte 4 and will cause compilation errors in Svelte 5.

**PixiJS v8 breaking changes from v7.** PixiJS v8 is a full rewrite. v7 examples
and tutorials produce broken code in v8. The import path changed; the renderer init
changed; `PIXI.Application` async init changed. Always verify against v8
documentation at `pixijs.com/8.x/`.

**SharedArrayBuffer requires COOP/COEP headers.** WASM audio with threading and
ring buffers requires `Cross-Origin-Opener-Policy: same-origin` and
`Cross-Origin-Embedder-Policy: require-corp`. These must be set in `firebase.json`
hosting headers. Without them, `SharedArrayBuffer` is undefined.

**Comunica bundle size.** `@comunica/query-sparql` is ~500KB+ gzipped. Use dynamic
import to lazy-load it only when the SPARQL interface is opened, not at app startup.

**iOS Safari vibration.** `navigator.vibrate` returns `undefined` on iOS Safari,
not `false`. The capability check must use `typeof navigator.vibrate === 'function'`,
not a truthy check.

**Firebase and AudioContext autoplay policy.** Browsers block `AudioContext.resume()`
until a user gesture. The session player must call `audioContext.resume()` inside
a click/touch event handler, not at module load time.

**Cytoscape.js and Comunica sequential loading.** Both libraries are heavy.
Do not load them at startup. Load Cytoscape when the graph view is first opened;
load Comunica when the SPARQL interface is first opened.

**Turtle serialization in N3.js.** `N3.Writer` requires explicit prefix registration
before writing. Prefixes not registered in the writer produce full IRIs in output.
Always initialize the writer with the full prefix map from `src/rdf/namespaces.js`.

**Vite and AudioWorklet static paths.** In development, Vite serves `public/`
at the root. In production builds, the same path applies. Use a relative path from
the app root: `/worklets/binaural.worklet.js`. Never use `new URL(..., import.meta.url)`
for worklet files — that triggers Vite's module bundling.

---

## 10. Testing Requirements

> **Phase 0 note.** The pyshacl command below is live and runnable today. The
> remaining items in this section — `schemas/preset.schema.json`, the `tests/`
> subtree, and `hooks/pre-commit` — are **planned (Phase 1)** and do not yet
> exist in the repo.

Before any PR or commit that modifies `ontology/`, run:
```bash
python -m pyshacl -s ontology/sstim-shapes.ttl -d ontology/sstim-core.ttl
python -m pyshacl -s ontology/sstim-shapes.ttl -d ontology/instances/presets/
```

Before any PR or commit that modifies `src/data/presets/`, run:
```bash
npx ajv validate -s schemas/preset.schema.json -d 'src/data/presets/*.json'
```

The pre-commit hook (`hooks/pre-commit`) runs both automatically. If it fails,
fix the violations before committing. Do not use `--no-verify` to bypass it.

---

## 11. Relationship to BioSynCare

BioSynCare is the commercial application (React Native, separate repository).
BSC Lab is the open-source research and development platform.

The shared interface between them is the preset JSON format. BSC Lab's RDF pipeline
exports `dist/presets.json` which BioSynCare consumes. Changes to the preset schema
must be coordinated with the BioSynCare repository.

BSC Lab code does not import from BioSynCare. BioSynCare code does not import from
BSC Lab. The only data exchange is the exported `dist/presets.json` file.

Do not add BioSynCare-specific logic to BSC Lab. Do not add BSC Lab RDF dependencies
to BioSynCare.

---

## 12. Updating This File

This file is maintained by Renato Fabbri. If a project decision changes (new
library version, new architectural constraint, new invariant), update this file
in the same commit that implements the change. AI agents should propose updates
to this file when they identify missing context that would have prevented a mistake.
