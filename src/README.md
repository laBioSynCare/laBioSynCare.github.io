# src — Software Architecture

> **Status.** Running today: the **knowledge browser** (RDF loader, Cytoscape
> graph, SPARQL, preset browser, annotations), the **Patch Studio**
> (`ui/creator/`) with four selectable audio engines, 14 visual track types, and
> one shared visual composition stage. The only public authoring screen is
> Studio; `/field/*` replace-navigates to its starters, while legacy Field
> modules remain for adapters and deprecation. Still planned:
> the `core/`
> orchestration layer, the GPU `visual/` + `haptic/` engines, `rdf/export.js`,
> and the JSON Schemas. See `ROADMAP.md` for phase definitions and
> [`../docs/technical/PORTABLE_DEPLOYMENT.md`](../docs/technical/PORTABLE_DEPLOYMENT.md)
> for the deployment and portability baseline.

This directory contains SSTIM Workbench: a multi-engine audiovisual
stimulation platform with an integrated RDF knowledge graph browser, SPARQL
interface, and annotation system.

Read `CLAUDE.md` before working on any file here. The invariants in that
document — audio clock authority, worklet bundling prohibition, no allocation
in `process()`, namespace imports — govern the entire codebase.

---

## Directory map

`ls` gives the file listing; this table gives what each directory is *for* and
the rule it carries. Only non-obvious entries are listed.

| Directory | Role |
|---|---|
| `engines/audio/` | `IAudioEngine` + four implementations + `audioEngines.js` (registry, capability detection, persisted selection, factory). See [`engines/README.md`](engines/README.md). |
| `engines/visual/`, `engines/haptic/` | **Planned.** Empty; the target design is in `docs/technical/VISUAL_ENGINE_ARCHITECTURE.md`. |
| `core/` | **Planned.** Empty. Orchestration: clock, scheduler worker, orchestrator, protocol runner. |
| `session/` | The native session contract ([`SESSION_MODEL.md`](../docs/technical/SESSION_MODEL.md)): schema-derived controlled values, the recorder, and the RDF projection with its generated loss report. Records against the engine timing context only; holds no storage. Gated by `make session-contract`. |
| `rdf/` | `namespaces.js` is the single source of truth for every IRI prefix — never hardcode one. Plus loader (Turtle/TriG → N3.Store), Comunica query wrapper, Cytoscape graph model, preset listing, and `annotations/` (named-graph CRUD only). |
| `identity/` | The identity seam ([ADR 0038](../docs/decisions/0038-identity-providers-and-the-two-seam-adapter.md)): anonymous and Firebase providers behind `IdentityProvider`, with a conformance suite. |
| `storage/` | The storage seam: local and Firestore patch stores behind `PatchStore`, likewise conformance-tested. |
| `config/` | `runtimeConfig.js` — deployment-time `runtime-config.json`, so one built artifact serves many operators. |
| `portability/` | Instance export/import, patch projection and links, and the session package ([`SESSION_PACKAGE.md`](../docs/technical/SESSION_PACKAGE.md)). |
| `sync/` | `bsc-lab-private-sync-1` ([`PRIVATE_SYNC.md`](../docs/technical/PRIVATE_SYNC.md)) — reference and in-memory implementations; no networked one yet. |
| `firebase/` | Optional auth + Firestore. Everything works without it. |
| `ui/creator/` | Patch Studio — the real-time authoring surface, including Field starters/adapters and the shared 14-type visual stage. → [`PATCH_STUDIO.md`](../docs/technical/PATCH_STUDIO.md) |
| `ui/field/` | Legacy Sensory Field implementation and reusable scene generators retained during compatibility/deprecation; public `/field/*` aliases redirect to Studio. → [`SENSORY_FIELD.md`](../docs/technical/SENSORY_FIELD.md) |
| `ui/graph/`, `ui/sparql/`, `ui/annotation/` | Knowledge browser surfaces. |
| `ui/entrance/` | The public landing: doors, conversion bar, cite/contribute modals. |
| `ui/safety/` | Photosensitivity advisory + visual-stimulation policy. Gates all flashing output. |
| `ui/pwa/` | Service-worker registration and the session-safe update banner. |
| `ui/navigation/`, `ui/theme/`, `ui/auth/` | Chrome, skins, sign-in form. |
| `routes/` | `/` entrance, `/graph`, `/creator`, `/presets`, `/sparql`, `/logbook`, `/profile`, `/settings`, `/ecosystem`, `/about`, plus four `/field/*` compatibility redirects into Studio starters. |

Tests live beside the code they cover (`*.test.js`, `*.test.mjs`) and run under
`make test`.

---

## Architecture overview

SSTIM Workbench has two largely independent subsystems that share the preset data model:

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
between the two Workbench subsystems and is coordinated with BioSynCare as a
*format* contract, not a shared catalog. The private BioSynCare/BSC catalog stays
outside this repository and is not converted to Turtle here. The knowledge
subsystem reads the RDF ontology files and public BSC Lab reference instances.

The Patch Studio authors its own live model (`model: "patch-studio-model-3"`, see
[`PATCH_STUDIO.md`](../docs/technical/PATCH_STUDIO.md)); genuine model-1 and
model-2 documents remain readable through explicit migration. Model 2 is the
historical first spatial schema; model 3 adds the spatial track's explicit
optional depth-to-size cue. Its normalizer carries 14 visual track types and one
serialized stage-presentation contract;
Field starters and pure adapters produce the same canonical draft.
`portability/patchProjection.js` projects a patch into SSTIM RDF over the
declared mappable subset, recursively reporting nested and discrete state that
did not travel rather than overclaiming ([ADR 0026](../docs/decisions/0026-patch-studio-catalog-bridge.md),
[ADR 0041](../docs/decisions/0041-stimulus-description-layers-and-the-canonical-schema-gap.md));
`portability/sessionPackage.js` wraps that as a portable session package
([`SESSION_PACKAGE.md`](../docs/technical/SESSION_PACKAGE.md)).

**Two things are called "session" and they are not the same object.**
`portability/sessionPackage.js` packages a *patch* — a configuration, portable
between instances. `session/` records an *execution* — what actually ran, when,
on which clock, and what the participant said afterwards. The first is a
scientific object you can send someone; the second is a record of one event. The
session bundle references the configuration by IRI and content hash rather than
embedding it, which is what keeps them separable.

Public `/field/*` aliases now replace-navigate to starter intents in Studio,
where colour-field and four spatial scene families are ordinary first-class
tracks composed by the shared visual stage. Legacy local state is detected but
not silently rewritten:
pure adapters offer add/replace/keep choices and return structured mapping,
correction, unsupported-state, and warning reports. The old autonomous Field
components and per-configuration `ExposureProfile` exporter remain in source
during the deprecation window.

The merge is not complete merely because the route and model cutover shipped.
Runtime/controller extraction, exact legacy rendering/audio and saved-state
lifecycle proof, one unified delivered-state `ExposureProfile`, producer-adjacent
SHACL validation, the full acceptance matrix, and duplicate-runtime/persistence
removal remain open. Implementation order is in
[`PATCH_STUDIO_FIELD_INTEGRATION.md`](../docs/technical/PATCH_STUDIO_FIELD_INTEGRATION.md);
SSTIM conformance and optional BSC catalog compatibility are deliberately split
in
[`PATCH_STUDIO_CONFORMANCE_AND_NEUTRALITY.md`](../docs/ecosystem/PATCH_STUDIO_CONFORMANCE_AND_NEUTRALITY.md).

Changes to the **preset catalog format** must be coordinated across
`docs/technical/PRESET_FORMAT.md` (specification),
`static/ontology/sstim-shapes.ttl` (SHACL), and — once they exist —
`schemas/preset.schema.json`, `src/core/ProtocolRunner.js`, and
`src/rdf/export.js`.

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
w3c-cg.github.io/sstim  GitHub Pages project site — Workbench and publication artifacts
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
