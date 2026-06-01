# src — Software Architecture

> **Status.** Two things run today: the **knowledge browser** (RDF loader,
> Cytoscape ontology graph, SPARQL route, preset browser, node annotations) and
> the **Patch Studio** (`ui/creator/`) — a real-time audiovisual designer with
> four selectable audio engines (see [`engines/README.md`](engines/README.md)
> and [`../docs/technical/PATCH_STUDIO.md`](../docs/technical/PATCH_STUDIO.md)).
> Still planned: the `core/` orchestration layer (clock, scheduler worker,
> orchestrator), the GPU `visual/`+`haptic/` engines, `rdf/export.js`, JSON
> Schemas, and the test subtree. Items below are marked **(planned)** where they
> do not yet exist. See `ROADMAP.md` for phase definitions.

This directory contains the BSC Lab application: a multi-engine audiovisual
stimulation platform with an integrated RDF knowledge graph browser, SPARQL
interface, and annotation system.

Read `CLAUDE.md` before working on any file here. The invariants in that
document — audio clock authority, worklet bundling prohibition, no allocation
in `process()`, namespace imports — govern the entire codebase.

---

## Directory map

```
src/
├── app.html                      HTML shell (pre-paint skin + a11y meta)
│
├── engines/
│   └── audio/                    IAudioEngine + four implementations + factory
│       ├── IAudioEngine.js        Interface contract
│       ├── audioEngines.js        Registry, capability detection, persisted
│       │                          selection, createAudioEngine() factory
│       ├── VanillaWebAudioEngine.js   Native Web Audio nodes (default)
│       ├── WorkletVoiceEngine.js  Shared base for the AudioWorklet engines
│       ├── AudioWorkletEngine.js  Audio-thread DSP in JS
│       ├── WasmAudioWorkletEngine.js  Audio-thread DSP in WASM
│       ├── NullAudioEngine.js     Silent (clock only) — fallback
│       └── sampleLoader.js        Decode/cache for the Sample voice
│   ├── visual/                  IVisualEngine + PixiJS/CSS engines (planned)
│   └── haptic/                  IHapticEngine + Vibration/Null engines (planned)
│
├── core/                        Orchestration layer (planned — README only):
│   │                            MasterClock, StimulationOrchestrator,
│   │                            SessionScheduler.worker, ProtocolRunner,
│   │                            SessionRecorder
│
├── firebase/                    Optional auth + Firestore profile/annotations
│   ├── client.js  auth.js  profile.js
│
├── rdf/
│   ├── namespaces.js     All IRI prefix declarations (single source of truth)
│   ├── loader.js         Turtle/TriG → N3.Store
│   ├── query.js          Comunica SPARQL execution wrapper
│   ├── graph.js          Ontology → Cytoscape graph model
│   ├── presets.js        SPARQL-driven preset listing
│   ├── annotations/AnnotationStore.js   Named-graph annotation CRUD
│   └── (planned) validate.js, export.js
│
├── ui/
│   ├── creator/          Patch Studio — real-time audiovisual designer
│   │                     (PresetCreator, presetDraft, controlSignals, tempo,
│   │                      semantic, Knob)  → docs/technical/PATCH_STUDIO.md
│   ├── graph/            RDF ontology graph (Cytoscape.js)
│   ├── annotation/       Annotation panel (named graphs)
│   ├── navigation/       Top bar, bottom dock, profile control
│   ├── theme/            Skin/palette system (skins.js)
│   ├── safety/           Photosensitivity advisory + visual-stim policy
│   ├── auth/             Sign-in form (Firebase)
│   └── (planned) player/, browser/, dedicated sparql/ component
│
├── routes/              SvelteKit pages: / (graph), /creator, /presets,
│   │                    /sparql, /logbook, /profile, /settings
│
└── data/presets/        Public BSC Lab runtime JSON presets (planned)
```

---

## Architecture overview

BSC Lab has two largely independent subsystems that share the preset data model:

### Stimulation subsystem

Delivers audiovisual sessions from preset specifications. Three threads, three
clocks. See `src/engines/README.md` for the full engine architecture and
`src/core/README.md` for the orchestration layer.

Target three-thread model (the Web Worker scheduler and orchestrator are
planned; today live updates run from the Patch Studio rAF loop):

```
Main thread          Web Worker (scheduler)      Audio render thread
──────────────       ──────────────────────       ──────────────────
StimulationOrch      SessionScheduler.worker      AudioWorkletProcessor
IAudioEngine         setInterval(25ms)            bsc-voice.worklet.js
rAF visual loop      event queue + lookahead      bsc-voice-wasm.worklet.js
                     postMessage → main           (+ bsc-osc.wasm kernel)
```

### Knowledge subsystem

Provides RDF-based browsing, querying, and annotation of the SSTIM ontology
and public BSC Lab reference presets. Operates entirely in the browser against an N3.Store
served from `static/ontology/` at the runtime `/ontology/` URL.

```
static/ontology/sstim-core.ttl
static/ontology/sstim-vocab.ttl       →   N3.Store (in-browser)
static/ontology/instances/presets/    →      ↓
                               Comunica SPARQL engine
                                      ↓
                               Cytoscape.js graph view
                               Preset browser
                               SPARQL power interface
                               Annotation editor
```

**Ontology files are bundled as static assets** (`static/ontology/`). SvelteKit
copies `static/ontology/**/*.ttl` into `dist/ontology/` so the runtime app and
citable artifacts are served from the same GitHub Pages origin today. If runtime
hosting later moves to Netlify or another custom-header host for WASM threading,
that host must serve the same source files from the app origin while GitHub
Pages remains the canonical citable copy.

---

## Shared data contract

The preset JSON format (`docs/technical/PRESET_FORMAT.md`) is the interface
between the two BSC Lab subsystems and is also coordinated with BioSynCare as a
format contract. It is not a shared catalog contract. The private BioSynCare/BSC
catalog stays outside this repository and is not converted to Turtle here. The
stimulation subsystem reads public BSC Lab presets from `src/data/presets/`
(JSON, if present) or from an optional BSC Lab RDF export. The knowledge
subsystem reads from the RDF ontology files and public BSC Lab reference
instances.

The Patch Studio authors its own live model (`model: "patch-studio-model-1"`,
see [`docs/technical/PATCH_STUDIO.md`](../docs/technical/PATCH_STUDIO.md)); a
bridge from a patch to the catalog preset / RDF instance is future work.

Changes to the **preset catalog format** must be coordinated across:
1. `docs/technical/PRESET_FORMAT.md` (specification)
2. `schemas/preset.schema.json` (JSON Schema validation) — *planned*
3. `static/ontology/sstim-shapes.ttl` (SHACL validation)
4. `src/core/ProtocolRunner.js` (preset → VoiceSpec translation) — *planned*
5. `src/rdf/export.js` (RDF → JSON export) — *planned*

---

## Build and run

```bash
npm install
make dev         # Preferred local entrypoint; wraps npm run dev on 127.0.0.1:4173
npm run dev      # Underlying Vite script when custom flags are needed
make build       # Production build (Vite/Rollup)
make preview     # Preview production build on 127.0.0.1:4174
make test        # Vitest unit + integration tests
make check       # SvelteKit sync + svelte-check
make validate    # SHACL validation (current ontology suite)
```

### AudioWorklet files

`static/worklets/` files are served as static assets. Vite must never
process them. They are loaded at runtime:

```javascript
await audioContext.audioWorklet.addModule('/worklets/bsc-voice.worklet.js')
```

Never `import` worklet files. Never add them to Vite config as entry points.
The WASM kernel (`static/worklets/bsc-osc.wasm`, source `bsc-osc.wat`) and the
ambient `Sample` clips (`static/audio/*.wav`, generated by
`scripts/gen-ambiences.mjs`) are likewise served as static assets.

### Lazy-loaded heavy libraries

Comunica (~500 KB gzipped) and Cytoscape.js (~300 KB) are loaded lazily
when their UI panels are first opened, not at app startup:

```javascript
// In the SPARQL panel component
const { QueryEngine } = await import('@comunica/query-sparql-rdfjs')
```

---

## Deployment

```
labiosyncare.github.io  GitHub Pages — static app and citable ontology .ttl files
lab.biosyncare.com      deferred custom host — only when headers/backend justify it
```

GitHub Pages deploy: `.github/workflows/pages.yml` runs `npm run build`, uploads
`dist/`, and publishes it as a Pages artifact. Netlify/custom hosting remains a
fallback for COOP/COEP, WASM threading, or server-side services.

## Environment variables

```
VITE_SSTIM_ONTOLOGY_URL     Override ontology base URL for local dev (default: /ontology/)
VITE_DEBUG_AUDIO            Enable audio timing debug overlay
```

---

*See `src/engines/README.md`, `src/core/README.md`, `src/rdf/README.md`,
and `src/ui/README.md` for layer-specific documentation.*
