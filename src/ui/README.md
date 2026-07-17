# src/ui — User Interface Layer

> **Status.** The shipped UI is the **knowledge browser** (graph, SPARQL,
> annotations, presets) and the **Patch Studio** (`creator/`), wrapped in shared
> navigation, theming, and the photosensitivity safety layer. The standalone
> session `player/` and preset `browser/` components in the target design are
> still planned.

All UI components use Svelte 5 with **runes** syntax exclusively (`$state`,
`$derived`, `$effect`, `$props`, `onclick`, `{@render ...}`). See `CLAUDE.md` §2
for the runes mandate and the prohibited Svelte 4 patterns.

---

## Directory structure (as built)

```
ui/
├── creator/       Patch Studio — real-time audiovisual designer
├── graph/         RDF ontology graph (Cytoscape.js)
├── annotation/    Annotation panel (named-graph CRUD)
├── navigation/    App top bar, bottom dock, profile control
├── theme/         Skin / palette system
├── safety/        Photosensitivity advisory + visual-stimulation policy
├── auth/          Firebase sign-in form
└── (planned) player/, browser/, dedicated sparql/ component
```

Routes that mount these live in `src/routes/`: `/` (graph), `/creator`,
`/presets`, `/sparql`, `/logbook`, `/profile`, `/settings`.

---

## `creator/` — Patch Studio

The primary authoring surface. A four-quadrant designer (controls, audio,
visual, haptic) that builds an in-memory **patch draft** and renders it live
through the selected audio engine. Knob/parameter changes are applied without a
restart via `engine.setVoiceParameter()`; structural changes (e.g. noise colour,
drone voice count, tremolo enable) rebuild the affected voice.

- `PresetCreator.svelte` — the studio shell, transport, rAF live-evaluation loop,
  scopes/previews, and the fullscreen visual **mix** stage.
- `presetDraft.js` — the data model (track types, parameter ranges, factories,
  validation). **Authoritative model spec:**
  [`../../docs/technical/PATCH_STUDIO.md`](../../docs/technical/PATCH_STUDIO.md).
- `controlSignals.js` — Martigli / Symmetry control-signal evaluation.
- `tempo.js` — BPM / tempo-sync math. `semantic.js` — track/param → SSTIM terms.
- `creatorSession.js` — cross-navigation session persistence.
- `Knob.svelte` — the reusable rotary control (base value + live/modulated dot).
- Tests: `presetDraft.test.js`, `tempo.test.js`.

`AudioContext.resume()` is called inside the play button's gesture handler, never
on mount (browser autoplay policy). The engine is built by
`createAudioEngine()` from [`../engines/audio/audioEngines.js`](../engines/audio/audioEngines.js).

---

## `graph/` — unified SSTIM graph navigator

`OntologyGraph.svelte` renders three interlinked source layers with Cytoscape.js
(lazy-loaded on first open): the versioned ontology/vocabulary, the versioned
public catalog (BSC framework, BSC Lab, Patch Studio component, BioSynCare
application), and the mutable approved public ecosystem. Qualified ecosystem
records are projected as agent→target edges without discarding their record IRI,
purpose, type, roles, sources, validity, or review date.

The top-bar scope selector can show the full graph, Catalog + ecosystem,
Ontology & vocabulary, Catalog focus, Ecosystem focus, or the existing thematic
term views. Focus views retain one-hop ontology/catalog context. Search covers
labels, aliases, and local names; colliding labels are visibly disambiguated
(for example, `BioSynCare — application` and `BioSynCare — organization`). The
left sidebar states which sources are versioned or live, shows live endpoint
health, and offers a no-cache refresh. Edge/node layers can be toggled; nodes are
searchable, centerable, and fit/relayout from the top bar. `graphSession.js`
persists view state across navigation. Clicking a node opens the annotation
panel; clicking a qualified relationship exposes its provenance.

---

## `annotation/` — annotation panel

`AnnotationPanel.svelte` lists and edits annotations for the selected ontology
node. Persistence goes through [`../rdf/annotations/AnnotationStore.js`](../rdf/annotations/AnnotationStore.js),
which writes to **named graphs only** (never the default graph — `CLAUDE.md`
§5.5). Public vs private visibility is per annotation; authorship comes from the
optional Firebase sign-in.

---

## `navigation/`, `theme/`, `safety/`, `auth/`

- **navigation/** — `AppTopBar.svelte` (graph scope/search/fit + keyboard help +
  the global `+` menu), `AppBottomDock.svelte` (Graph · Patch Studio · Presets ·
  SPARQL · Logbook · Settings), `ProfileControl.svelte`, `graphNavigation.js`.
- **theme/** — `skins.js`: five palettes (default `paper`) applied via a
  `data-skin` attribute, persisted to `localStorage`, pre-applied before first
  paint by an inline script in `app.html` to avoid a flash of the wrong theme.
- **safety/** — `visualSafety.js` (visual-stimulation policy store) and
  `PhotosensitivityAdvisory.svelte` (page-load advisory). Spec:
  [`../../docs/technical/PHOTOSENSITIVITY_SAFETY.md`](../../docs/technical/PHOTOSENSITIVITY_SAFETY.md).
- **auth/** — `SignInForm.svelte`, used by the profile control and the Logbook
  gate; backed by `src/firebase/`.

---

## Shared UI conventions

**Styling.** Pico.css for semantic defaults plus component-scoped Svelte
`<style>` blocks driven by skin CSS variables (`--app-*`). No Tailwind, no
CSS-in-JS. Component colours must resolve from skin variables so every palette
(including the light `paper`/`daylight` skins) stays legible — do not hard-code
dark-only `#fff`/white-alpha values.

**Error boundaries.** Every panel making async calls (SPARQL, RDF loading,
Firebase) wraps its logic in try/catch and shows a human-readable error state.
Never surface a raw N3.js parse error or SPARQL exception to the user.

**Accessibility & safety.** Visual stimulation honors the global policy and
`prefers-reduced-motion` via `safety/visualSafety.js` (not a `CSSEngine`).
Interactive controls carry `aria-label`s; colour is never the sole information
carrier; dialogs are dismissible with Esc.

**Loading indicators.** Comunica (SPARQL, ~500 KB) and Cytoscape (graph,
~300 KB) are lazy-loaded; show a loading indicator the first time each opens.
