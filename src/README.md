# src — Software Architecture

> **Status: planned — Phase 1.** This document describes the target architecture
> for the BSC Lab application. None of the source files (`.js`, `.svelte`) or
> companion directories (`public/worklets/`, `schemas/`, `tests/`, `dist/`)
> referenced below exist yet. The repo is in Phase 0 (docs + ontology). See
> `ROADMAP.md` for phase definitions.

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
├── engines/
│   ├── audio/          IAudioEngine interface + implementations
│   ├── visual/         IVisualEngine interface + implementations
│   └── haptic/         IHapticEngine interface + implementations
│
├── core/
│   ├── MasterClock.js           AudioContext clock exposure
│   ├── StimulationOrchestrator.js  Engine coordination
│   ├── SessionScheduler.worker.js  Web Worker: event queue + lookahead
│   ├── ProtocolRunner.js        Preset → VoiceSpec translation + timeline
│   └── SessionRecorder.js       Session instance lifecycle
│
├── rdf/
│   ├── namespaces.js     All IRI prefix declarations (single source of truth)
│   ├── loader.js         Turtle/TriG → N3.Store
│   ├── store.js          N3.Store wrappers and helpers
│   ├── query.js          Comunica SPARQL execution wrapper
│   ├── validate.js       SHACL validation via rdf-validate-shacl
│   ├── export.js         N3.Store → JSON preset export (dist/presets.json)
│   └── annotations/
│       └── AnnotationStore.js   Named-graph annotation CRUD
│
├── ui/
│   ├── player/           Session player (canvas + controls + engine switcher)
│   ├── creator/          Real-time preset/session designer
│   ├── browser/          SPARQL-driven preset browser
│   ├── graph/            RDF graph visualization (Cytoscape.js)
│   ├── annotation/       Annotation editor (CodeMirror + named graphs)
│   └── sparql/           Power user SPARQL query interface
│
└── data/
    └── presets/          JSON preset files (source until RDF pipeline complete)
```

---

## Architecture overview

BSC Lab has two largely independent subsystems that share the preset data model:

### Stimulation subsystem

Delivers audiovisual sessions from preset specifications. Three threads, three
clocks. See `src/engines/README.md` for the full engine architecture and
`src/core/README.md` for the orchestration layer.

```
Main thread          Web Worker (scheduler)      Audio render thread
──────────────       ──────────────────────       ──────────────────
StimulationOrch      SessionScheduler.worker      AudioWorkletProcessor
IAudioEngine         setInterval(25ms)            binaural.worklet.js
IVisualEngine        event queue + lookahead      martigli.worklet.js
IHapticEngine        postMessage → main           symmetry.worklet.js
rAF visual loop      ← clock sync
```

### Knowledge subsystem

Provides RDF-based browsing, querying, and annotation of the SSTIM ontology
and BSC preset catalog. Operates entirely in the browser against an N3.Store
loaded from the `ontology/` directory.

```
ontology/sstim-core.ttl
ontology/sstim-vocab.ttl       →   N3.Store (in-browser)
ontology/instances/presets/    →      ↓
                               Comunica SPARQL engine
                                      ↓
                               Cytoscape.js graph view
                               Preset browser
                               SPARQL power interface
                               Annotation editor
```

---

## Shared data contract

The preset JSON format (`docs/technical/PRESET_FORMAT.md`) is the interface
between the two subsystems. The stimulation subsystem reads presets from
`src/data/presets/` (JSON, Phase 1–2) or from the RDF export pipeline
(`dist/presets.json`, Phase 3). The knowledge subsystem reads from the
RDF ontology files.

Changes to the preset format must be coordinated across:
1. `docs/technical/PRESET_FORMAT.md` (specification)
2. `schemas/preset.schema.json` (JSON Schema validation)
3. `ontology/sstim-shapes.ttl` (SHACL validation)
4. `src/core/ProtocolRunner.js` (preset → VoiceSpec translation)
5. `src/rdf/export.js` (RDF → JSON export)

---

## Build and run

```bash
npm install
npm run dev      # Vite 8 dev server with HMR
npm run build    # Production build (Rolldown)
npm run preview  # Preview production build
npm test         # Vitest unit + integration tests
npm run validate # SHACL + JSON Schema validation
```

### AudioWorklet files

`public/worklets/` files are served as static assets. Vite must never
process them. They are loaded at runtime:

```javascript
await audioContext.audioWorklet.addModule('/worklets/binaural.worklet.js')
```

Never `import` worklet files. Never add them to Vite config as entry points.

### Lazy-loaded heavy libraries

Comunica (~500 KB gzipped) and Cytoscape.js (~300 KB) are loaded lazily
when their UI panels are first opened, not at app startup:

```javascript
// In the SPARQL panel component
const { QueryEngine } = await import('@comunica/query-sparql-rdfjs')
```

---

## Environment variables

```
VITE_FIREBASE_API_KEY       Firebase hosting config
VITE_FIREBASE_PROJECT_ID    Firebase project ID
VITE_SSTIM_ONTOLOGY_URL     Override ontology URL for local dev
VITE_DEBUG_AUDIO            Enable audio timing debug overlay
```

---

*See `src/engines/README.md`, `src/core/README.md`, `src/rdf/README.md`,
and `src/ui/README.md` for layer-specific documentation.*
