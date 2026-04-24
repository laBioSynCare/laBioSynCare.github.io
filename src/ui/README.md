# src/ui — User Interface Layer

> **Status: Phase 1 partial.** `graph/OntologyGraph.svelte` exists and the
> SPARQL route currently renders inline. Player, creator, preset browser,
> annotation, and dedicated SPARQL components are still planned.

All UI components use Svelte 5 with runes syntax exclusively. See `CLAUDE.md`
section 2 for the runes syntax mandate and the list of prohibited Svelte 4
patterns.

---

## Directory structure

```
ui/
├── player/       Session player — canvas, controls, engine switcher
├── creator/      Real-time preset/session designer
├── browser/      SPARQL-driven preset browser + recommendation
├── graph/        RDF ontology/evidence graph (Cytoscape.js)
├── annotation/   Annotation editor (CodeMirror + named graphs)
└── sparql/       Power user SPARQL query interface
```

---

## `player/`

The session player is the primary user-facing interface. It renders the PixiJS
canvas, provides transport controls (play, pause, stop), shows the breathing
guide and session progress, and optionally exposes the engine switcher for
research use.

**Entry component:** `player/SessionPlayer.svelte`

**Key responsibilities:**
- `AudioContext.resume()` must be called inside the button `onclick` handler
  — never in `$effect()` or on component mount
- Reads `breathingPhase` from the audio engine's `onTimingState` callback;
  passes it to the visual engine; never computes phase from wall clock
- Engine switcher calls `orchestrator.switchAudioEngine()` /
  `orchestrator.switchVisualEngine()` — no preset reload required

```svelte
<!-- Svelte 5 runes — correct pattern -->
<script>
  import { onMount } from 'svelte'
  let isPlaying = $state(false)
  let breathingPhase = $state(NaN)

  async function handlePlay() {
    // AudioContext.resume() MUST be inside this gesture handler
    await audioEngine.resume()
    await orchestrator.startSession(sessionSpec, preset)
    isPlaying = true
  }
</script>

<button onclick={handlePlay}>Play</button>
```

**Visual canvas:** The PixiJS canvas is mounted into a container `div` by
the `PixiJSEngine.initialize()` call. The Svelte component holds the container
reference; it does not manage the canvas element directly.

---

## `creator/`

Real-time preset designer. Allows users to adjust voice parameters and hear
the result immediately. Changes feed into the audio engine via
`setVoiceParameter()` — no session restart needed for most parameter changes.

**Entry component:** `creator/PresetCreator.svelte`

Parameters that can change without a restart (via AudioParam automation):
- `iniVolume` (GainNode value)
- `panOscPeriod`, `panOscTrans` (scheduled as parameter ramps)

Parameters that require stopping and restarting the voice:
- `fl`, `fr`, `f0`, `nnotes`, `noctaves`, `d`, `permfunc`
- `mf0`, `ma`, `mp0`, `mp1`, `md`, `isOn`

The creator stores the working preset in a Svelte `$state` object. On save,
it validates against `schemas/preset.schema.json` before persisting to
`src/data/presets/`.

---

## `browser/`

SPARQL-driven preset browser. Queries the N3.Store to render the preset
catalog with filtering by group, frequency band, evidence tier, and headphone
mode. Also powers the Seraphony preset recommendation surface.

**Entry component:** `browser/PresetBrowser.svelte`

Comunica is lazy-loaded when this panel is first opened. The initial load may
take 1–2 seconds on slow connections; show a loading indicator.

Standard SPARQL queries are in `src/rdf/query.js`. The browser constructs
parameterized queries from the user's filter selections.

**SKOS hierarchy filtering** uses `skos:narrower*` property paths:
```sparql
PREFIX sstim-v: <https://w3id.org/sstim/vocab#>
SELECT DISTINCT ?preset WHERE {
  sstim-v:alpha skos:narrower* ?band .
  ?preset sstim:targetsFrequencyBand ?band .
}
```
This returns presets targeting `alpha`, `low-alpha`, `high-alpha`, or
`alpha-10` with a single query.

---

## `graph/`

RDF graph visualization using Cytoscape.js. Renders the ontology class
hierarchy, evidence claim chains, and preset-to-band relationships as an
interactive node-edge graph.

**Entry component:** `graph/OntologyGraph.svelte`

Cytoscape.js (~300 KB) is lazy-loaded when this panel is first opened.

The graph has two modes:
- **Ontology mode:** shows the SSTIM class hierarchy with BFO/OBI/IAO
  parent alignments
- **Evidence mode:** shows a specific preset's evidence chain — the
  claim nodes, tier values, modality tags, and reference nodes

Clicking a node in the graph opens the annotation panel for that node.

---

## `annotation/`

Annotation editor for any ontology node. Uses CodeMirror with a simple
Turtle syntax highlighter for the annotation body. Calls `AnnotationStore.js`
for persistence.

**Entry component:** `annotation/AnnotationEditor.svelte`

Annotation types:
- `comment` — general note
- `question` — open question for the maintainer
- `disputesTierAssignment` — challenge to an evidence tier
- `proposesNewConcept` — suggestion for a new vocabulary term
- `evidenceCitation` — link to an additional reference

Annotations are shown in the graph view as badge counts on their target
nodes. The annotation editor panel opens from a node click in the graph.

---

## `sparql/`

Power user SPARQL interface with a CodeMirror editor, result table, and
CONSTRUCT result graph view. Intended for researchers and ontology contributors.

**Entry component:** `sparql/SparqlInterface.svelte`

The interface provides:
- Auto-completing prefix declarations (all `namespaces.js` prefixes)
- Query history (stored in IndexedDB, not the default RDF graph)
- Result export as CSV (SELECT) or Turtle (CONSTRUCT)
- Link to the WIDOCO-generated ontology documentation

---

## Shared UI conventions

**No inline styles.** All styling uses Pico.css semantic classes plus
component-scoped Svelte `<style>` blocks. No Tailwind, no CSS-in-JS.

**Error boundaries.** Every panel that makes async calls (SPARQL, RDF loading)
wraps its async logic in try/catch and shows a human-readable error state.
Never let a SPARQL error or an N3.js parse error reach the user as a raw
exception.

**Accessibility.** Breathing guide animations respect `prefers-reduced-motion`
by delegating to `CSSEngine`. Interactive controls have `aria-label` attributes.
Color is never the sole information carrier.

**Loading indicators.** Comunica (SPARQL) and Cytoscape (graph) are heavy.
Show a loading indicator the first time each panel opens. Subsequent opens
can use the already-initialized library.
