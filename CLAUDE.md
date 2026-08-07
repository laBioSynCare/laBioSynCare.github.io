# CLAUDE.md — BSC Lab AI Agent Directive

> **Read this file completely before touching any other file in this repository.**
> It is the directive for every AI coding agent working here. Only Claude Code
> loads it automatically — `AGENTS.md`, `GEMINI.md` and
> `.github/copilot-instructions.md` are planned (`TODO.md` §1) and do not exist,
> so an agent on another tool must be pointed here explicitly.
> Maintained by Renato Fabbri; update it in the same commit that changes what it
> describes (§12).

---

## 1. What This Project Is

**BSC Lab** is an open-source sensory stimulation platform with two integrated layers:

1. **Stimulation layer** — a precision multi-engine audiovisual stimulation application
   (Web Audio API, PixiJS, haptics) that delivers sensory entrainment sessions
   via configurable preset parameter sets.

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
- `static/ontology/README.md` — OWL/SKOS design decisions
- `src/README.md` — full software architecture

---

## 2. Technology Stack

These decisions are final unless `src/README.md` documents a change. Do not
substitute alternatives without explicit instruction. Rows marked **(planned)**
are chosen but not yet installed — do not describe them as how the app works.

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Build | Vite | 6.x | ESM-native dev, fast HMR, SvelteKit static build |
| UI framework | Svelte 5 | 5.x | Compiler-based, near-vanilla bundle, reactive stores fit SPARQL result rendering |
| RDF parsing/store | N3.js | 1.17+ | Parses Turtle/TriG/N-Quads, in-memory triple store |
| SPARQL engine | Comunica | `@comunica/query-sparql-rdfjs` 3.x | SPARQL 1.1 in browser against N3 store |
| RDF validation | rdf-validate-shacl | 0.5+ | Installed, but used only by tests today (`*.shacl.test.js`, `adr-0027-negative-fixtures.test.mjs`). Browser-side validation is **(planned)** — see §5.4. `make validate` uses pySHACL |
| Graph visualization | Cytoscape.js | 3.28+ | RDF ontology/evidence graph navigation |
| Visual engine (default) | PixiJS | v8.x | **(planned — not installed.)** Auto WebGPU/WebGL, unified renderer API. Visuals today are CSS/DOM in the Patch Studio |
| Audio engine (default) | Vanilla Web Audio API | browser native | Direct AudioContext control, no abstraction overhead |
| Haptic engine (default) | Web Vibration API | browser native | **(planned.)** NullHapticEngine fallback for unsupported platforms; the studio shows a haptic preview only |
| App hosting | GitHub Pages | current | Client-only static app and `/ontology/*.ttl` artifacts; custom hosting deferred until headers or backend services are needed |
| Ontology artifacts | GitHub Pages | current | Stable citable URLs for `.ttl` files; w3id.org redirects point here |
| Ontology docs | WIDOCO + pyLODE | 1.4.25 / 2.13.2 (flake-pinned) | HTML reference docs generated in `pages.yml`, artifact only, never committed (ADR 0023): WIDOCO (`make ontology-docs` → `/ontology/docs/`) for the OWL core; pyLODE `vocpub` (`make vocab-docs` → `/ontology/docs/vocab/`) for the SKOS vocabulary. Browser target at w3id stays the knowledge browser |
| CSS | Pico.css | current | Semantic HTML-first, no utility class noise |
| PWA / offline | SvelteKit native service worker | built-in | Installable, offline-capable from the same static `dist/`. No `vite-plugin-pwa`. Three binding constraints — see ADR 0009 + `docs/technical/PWA_SERVICE_WORKER.md` |
| Dev toolchain | Nix flake | flakes | First-class: `flake.nix` pins Node, Python+pySHACL, WABT; CI runs inside it. `flake.lock` is the source of truth — regenerate via `nix flake update` |

### Svelte 5 AI tooling setup

Svelte 5 uses **runes syntax** (`$props()`, `$state()`, `$derived()`, `$effect()`,
`onclick`, `{@render children()}`). AI models default to Svelte 4 syntax without
configuration. Always use:

```bash
# Add to MCP configuration
npx @sveltejs/mcp
```

If an AI agent generates Svelte 4 syntax (`export let`, `$:`, `on:click`,
`<slot />`), reject it and regenerate with an explicit runes instruction. The
`.cursor/rules/*.mdc` files this section used to require are planned and do not
exist (`TODO.md` §1); this file is the rule source until they do.

### Local dev server

The toolchain is pinned by `flake.nix` and is first-class: CI (build, check,
validate, Pages deploy) runs every command inside `nix develop`. When working in
an environment that has Nix, enter the shell first so your Node/Python/WABT match
CI exactly:

```bash
nix develop            # or `direnv allow` once, then it auto-loads
```

When an AI agent needs to inspect routes, reproduce a UI bug, or run browser
automation, start the Vite dev server from the repository root:

```bash
npm install
make dev
```

`make dev` is the canonical entrypoint. The underlying package script is
`npm run dev`; if custom flags are required, run:

```bash
npm run dev -- --host 127.0.0.1 --port 4173
```

Use `http://127.0.0.1:4173/` as the local app URL unless the human explicitly
requests a different host or port. Reuse an existing Vite process if one is
already running; do not start duplicate dev servers. For production-build
inspection, use `make preview` on `http://127.0.0.1:4174/`. For documentation-only
or ontology-only edits, a dev server is not required.

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

Files in `static/worklets/` are loaded by `AudioWorkletNode` at runtime via URL.
They run in an isolated audio rendering thread with no access to the main thread
DOM or module system.

```javascript
// CORRECT
await audioContext.audioWorklet.addModule('/worklets/bsc-voice.worklet.js');

// WRONG — Vite must never process these
import BscVoiceWorklet from './worklets/bsc-voice.worklet.js';
```

Never import worklet files. Never add them to Vite's module graph. They must remain
plain ES-compatible scripts in `static/worklets/`. The current processors are
`bsc-voice.worklet.js` (JS DSP) and `bsc-voice-wasm.worklet.js` (which loads the
`bsc-osc.wasm` kernel); the ambient `Sample` clips in `static/audio/*.wav` are
likewise plain static assets.

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

These encode scientific decisions, vocabulary definitions, and legal prior-art
records. They are never modified by an AI agent without an explicit human
instruction in the current session naming the file: "modify [filename]".

```
static/ontology/*.ttl              every manifest-owned module, its shapes,
                                   and its profile entry points
static/ontology/instances/**/*.ttl public reference data
static/ontology/<version>/**       frozen releases — immutable, never edited
docs/technical/BREATHING_MODEL.md
docs/technical/SYMMETRY_SYSTEM.md
docs/technical/MARTIGLI_BINAURAL.md
```

The pattern is deliberate: the modular split (ADR 0043) turned one root file into
many, and a hand-maintained list would have silently unprotected every module
added after it was written. `static/ontology/manifest.json` is the authoritative
inventory. See [ADR 0004](docs/decisions/0004-protected-ontology-files.md).

The three `docs/technical/` files are defensive publications — timestamped prior
art records. Modifying them after their first commit date undermines their legal
function.

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

Presets are the core catalog data objects. The canonical specification is
`docs/technical/PRESET_FORMAT.md`. These rules apply to any code that
reads, writes, validates, or generates presets.

> **Do not confuse two distinct models.** This section governs the **preset
> catalog JSON** (`header` + `voices`, voice types `Binaural` / `Martigli` /
> `Martigli-Binaural` / `Symmetry`) shared with BioSynCare. The **Patch Studio**
> (`src/ui/creator/`) is a separate, live authoring model tagged
> `model: "patch-studio-model-1"` with its own track types (`IsochronicTone`,
> `BinauralBeat`, `Carrier`, `Noise`, `Drone`, `Sample`, …) — see
> `docs/technical/PATCH_STUDIO.md`. The rules in §4 do not apply to patch drafts.

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
@prefix bsc-fw:   <https://w3id.org/sstim/framework/bsc/> .
@prefix bsclab:   <https://w3id.org/sstim/implementation/bsclab/> .
@prefix biosyncare: <https://w3id.org/sstim/implementation/biosyncare/> .
```

**Namespace convention — one registered SSTIM namespace, scoped by role.**

- `https://w3id.org/sstim` (`/sstim#`, `/sstim/vocab#`, `/sstim/shapes#`) — the
  **ontology**: OWL classes and properties, SKOS vocabulary concepts, SHACL
  shapes. This is the reusable, citable scientific artifact. Every `.ttl` file
  in `static/ontology/` declares its prefixes here.
- `https://w3id.org/sstim/framework/bsc` — the **BSC framework**: techniques,
  composition rules, evidence rules, grouping logic, and design principles.
- `https://w3id.org/sstim/implementation/biosyncare` — the commercial
  **BioSynCare** implementation and catalog.
- `https://w3id.org/sstim/implementation/bsclab` — the open **BSC Lab**
  reference implementation, public seeds, and knowledge-browser data.

Implementation data uses implementation-scoped subpaths:
`/preset/{id}`, `/session/{id}`, `/annotation/{id}`, and `/evidence/{id}`.

Never publish a BSC preset or session in the reusable ontology term space
(`sstim#`, `sstim/vocab#`, `sstim/shapes#`); never declare an OWL class or
SKOS concept under an implementation path. BSC itself is a framework, not a
protocol, preset, or software app. See
`docs/decisions/0007-framework-protocol-implementation.md`.

### 5.2 Dual-typing pattern for vocabulary concepts

SKOS concepts in `sstim-vocab.ttl` are dual-typed: they are both `skos:Concept` and
instances of the relevant OWL class. This is intentional (Pattern 2 design decision
documented in `static/ontology/README.md`). Do not "fix" this by removing either type.

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
// Get all presets with their target bands and any evidence tier.
// Evidence tiers live on sstim:EvidenceAssessmentClaim (ADR 0027; the concrete
// evidence-bearing subtype of sstim:EvidenceClaim), linked to its subject via
// sstim:evaluatesSubject — the neutral relation that replaced the directionally
// misleading sstim:supportsRelation (kept as a deprecated 0.7.x alias). Tiers
// are not on the preset; preset rdfs:labels carry no language tag.
const PRESET_QUERY = `
PREFIX sstim: <https://w3id.org/sstim#>
PREFIX sstim-v: <https://w3id.org/sstim/vocab#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?preset ?label ?tier ?band ?bandLabel WHERE {
  ?preset a sstim:Preset ;
          rdfs:label ?label ;
          sstim:targetsFrequencyBand ?band .
  ?band skos:prefLabel ?bandLabel .
  OPTIONAL {
    ?claim a sstim:EvidenceAssessmentClaim ;
           sstim:evaluatesSubject ?preset ;
           sstim:hasEvidenceTier ?tier .
  }
  FILTER(LANG(?bandLabel) = "en")
}
ORDER BY ?tier`;

// SKOS hierarchy traversal — all sub-bands of alpha
const SUBBANDS_QUERY = `
PREFIX sstim-v: <https://w3id.org/sstim/vocab#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT ?band WHERE {
  sstim-v:alpha skos:narrower* ?band .
}`;
```

### 5.4 SHACL validation before any preset export

Never export RDF that has not been validated against the applicable shape
package. Log the violations and return nothing rather than emitting a
non-conformant graph.

A browser-side `src/rdf/validate.js` (rdf-validate-shacl) is **planned and does
not exist yet** — do not import it. Today validation runs under `make validate`
via pySHACL, and the tests that assert conformance of generated graphs live
beside their producers (for example `src/ui/field/exposureProfile.shacl.test.js`
and `src/portability/sessionPackage.test.js`). Follow that pattern for any new
RDF-emitting surface.

### 5.5 Annotations use named graphs

Annotation data is stored in named graphs, never in the default graph. The default
graph contains only authoritative ontology data. This separation is enforced in
`src/rdf/annotations/AnnotationStore.js`.

```javascript
// CORRECT — annotation in named graph
const annotationGraph = namedNode(`https://w3id.org/sstim/implementation/bsclab/annotation/${userId}`);
store.addQuad(subject, predicate, object, annotationGraph);

// WRONG — annotation in default graph pollutes authoritative data
store.addTriple(subject, predicate, object);
```

---

## 6. Stimulation Engine Architecture

The target architecture is in `docs/technical/AUDIO_ENGINE_ARCHITECTURE.md` and
`src/core/README.md`. **As built today:** four selectable `IAudioEngine`
implementations (Vanilla Web Audio, AudioWorklet, AudioWorklet+WASM, Null) chosen
in Settings and applied on next playback — see `src/engines/README.md` and
`docs/technical/PATCH_STUDIO.md`. The `core/` orchestrator + Worker scheduler and
the `visual/`/`haptic/` engines are still planned. Critical points for any code
touching the engine:

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

All audio engines implement `src/engines/audio/IAudioEngine.js`. New audio
engines are added via the registry/factory in
`src/engines/audio/audioEngines.js` (so they appear in Settings and inherit
capability-based fallback). The visual and haptic interfaces
(`engines/visual/IVisualEngine.js`, `engines/haptic/IHapticEngine.js`) are
planned. When adding an implementation, implement the full interface and call
only interface methods from callers — never engine-specific methods.

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

Directory listings drift; these indexes do not, because each is maintained where
the thing lives:

| For | Read |
|---|---|
| Documentation map | [`docs/README.md`](docs/README.md) |
| Architecture decisions | [`docs/decisions/README.md`](docs/decisions/README.md) |
| Application architecture | [`src/README.md`](src/README.md) |
| Ontology sources and design | [`static/ontology/README.md`](static/ontology/README.md) |
| Live ontology module inventory | `static/ontology/manifest.json` (machine-readable, authoritative) |
| Tracked work | [`TODO.md`](TODO.md), [`ROADMAP.md`](ROADMAP.md) |

The paths that carry invariants, and are therefore worth naming here:

```
static/worklets/       AudioWorklet processors — NEVER bundled by Vite (§3.2)
  bsc-voice.worklet.js       unified voice processor (JS DSP)
  bsc-voice-wasm.worklet.js  unified voice processor (WASM oscillator)
  bsc-osc.wat / .wasm        hand-written sine-LUT kernel + source
static/audio/          ambient Sample clips (CC0) — runtime-cached, never precached (§9)
static/ontology/       Turtle served same-origin (copied to dist/); §3.4 protects it
static/_headers        COOP/COEP/CORP for a future custom host; GitHub Pages ignores it
src/rdf/namespaces.js  the only place an ontology IRI may be written (§5.1)
src/service-worker.js  three binding constraints — see §9 and ADR 0009
schemas/               (planned) preset.schema.json, session.schema.json
```

---

## 8. What You Must Not Do

These are not style preferences. They are constraints derived from scientific,
legal, regulatory, or architectural requirements.

| Action | Reason |
|---|---|
| Modify BSC instance TTL under `static/ontology/instances/` without explicit instruction | Vocabulary changes require scientific review |
| Modify the three defensive publication files | They are timestamped prior art records |
| Use `Date.now()` or `setTimeout()` for AV sync | Only `AudioContext.currentTime` is authoritative |
| Bundle files in `static/worklets/` | AudioWorklets must load as plain static scripts |
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
| Auto-reload the page from the service worker on update | Would kill an in-progress session; reload only on explicit user click (ADR 0009, Trap 1) |
| Let the service worker intercept cross-origin requests | Breaks Firebase auth / Google sign-in; same-origin only (ADR 0009, Trap 2) |

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
`Cross-Origin-Embedder-Policy: require-corp`. GitHub Pages cannot serve these
headers. That is acceptable while BSC Lab is a client-only knowledge browser;
move runtime hosting to Netlify or another custom-header host before shipping
threaded WASM audio or any feature that depends on `SharedArrayBuffer`.

**COEP blocks cross-origin RDF fetches.** `Cross-Origin-Embedder-Policy: require-corp`
means every resource the app loads must be same-origin or carry
`Cross-Origin-Resource-Policy: cross-origin`. The ontology `.ttl` files are
therefore bundled as static assets in `static/ontology/` and served from the same
origin as the app. If runtime hosting moves away from GitHub Pages, keep the
same-source-file pattern: the app origin serves runtime copies, and GitHub Pages
continues to serve the citable/stable copies used by w3id redirects.

**Comunica bundle size.** `@comunica/query-sparql` is ~500KB+ gzipped. Use dynamic
import to lazy-load it only when the SPARQL interface is opened, not at app startup.

**Service worker — three binding constraints.** The PWA service worker
(`src/service-worker.js`, spec in `docs/technical/PWA_SERVICE_WORKER.md`, ADR
0009) is networking/caching only and never touches the audio clock, but three
rules are non-negotiable: (1) **never auto-reload** — the worker must not call
`skipWaiting()` on its own; updates wait and reload only on an explicit user
click, or an in-progress stimulation session is killed mid-stream; (2) **never
intercept cross-origin** — the `fetch` handler returns early for any
`url.origin !== self.location.origin`, which is what keeps Firebase auth/Firestore
and Google sign-in working; (3) **never eagerly precache the heavy assets** — the
ambient `static/audio/*.wav` (~2.8 MB) and ontology `.ttl` are runtime-cached on
first use, not precached. Do not "simplify" any of these away.

**Service worker is production-only.** `kit.serviceWorker.register = false`; the
worker is registered manually in `src/ui/pwa/ServiceWorkerUpdate.svelte` under
`!dev`. Never enable it in `make dev` — a precaching worker serves stale assets
and fights HMR. If you see stale output during development, check that no worker
is registered (DevTools → Application → Service Workers → Unregister).

**iOS Safari vibration.** `navigator.vibrate` returns `undefined` on iOS Safari,
not `false`. The capability check must use `typeof navigator.vibrate === 'function'`,
not a truthy check.

**AudioContext autoplay policy.** Browsers block `AudioContext.resume()`
until a user gesture. The session player must call `audioContext.resume()` inside
a click/touch event handler, not at module load time.

**Cytoscape.js and Comunica sequential loading.** Both libraries are heavy.
Do not load them at startup. Load Cytoscape when the graph view is first opened;
load Comunica when the SPARQL interface is first opened.

**Turtle serialization in N3.js.** `N3.Writer` requires explicit prefix registration
before writing. Prefixes not registered in the writer produce full IRIs in output.
Always initialize the writer with the full prefix map from `src/rdf/namespaces.js`.

**Vite and AudioWorklet static paths.** In development, Vite serves `static/`
at the root. In production builds, the same path applies. Use a relative path from
the app root: `/worklets/bsc-voice.worklet.js`. Never use `new URL(..., import.meta.url)`
for worklet files — that triggers Vite's module bundling.

---

## 10. Testing Requirements

Before any PR or commit touching `static/ontology/`, run `make validate`. It is
the same gate CI runs, and it covers far more than syntax: SHACL over the
applicable profile closures and every public instance, the manifest contract,
the quality audit, HermiT via ROBOT, SPARQL competency queries, export round
trips, the w3id route contract, `make truth-audit`, and `make release-dryrun`.

For application changes, `make test` (Vitest, beside the source) and `make check`
(SvelteKit sync + svelte-check).

**Planned and not yet present:** `schemas/preset.schema.json` with an `ajv` gate
over catalog presets, a dedicated `tests/` subtree, and `hooks/pre-commit`. When
the hook lands it should run the local validation mirror automatically — fix
violations rather than passing `--no-verify`.

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
