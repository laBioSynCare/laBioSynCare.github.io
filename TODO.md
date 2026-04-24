# TODO

> **For AI agents:** This file tracks all open work at task granularity.
> Read `ROADMAP.md` first for strategic context and phase-gating rules.
> The symbol key is below. Update this file in the same commit that
> completes or starts a task. Do not modify tasks marked `[x]` — they
> are historical record. Do not add tasks to "Not yet" phases without
> explicit instruction from Renato.
>
> **Current phase: 0 → 1 boundary.** Focus is on closing the public
> foundation pass and hardening the initial knowledge-browser scaffold.
> Do not build the Phase 2 stimulation player yet.

---

## Symbol Key

```
[x]  Complete
[~]  In progress
[ ]  Not started
[!]  Blocked — see note
[?]  Decision pending — see note
```

Phase tags:
- `P0` Bootstrap (now)
- `P1` Public Foundation (May–Jul 2026)
- `P2` Stimulation Platform (Jul–Nov 2026)
- `P3` Evidence Infrastructure (Nov 2026–Apr 2027)

---

## Current Focus (update when focus shifts)

**Week of April 21, 2026:**
Phase 0 Public Foundation Pass is closing. The 31 Phase 0 reference
documents, four ontology `.ttl` files, docs index, instance-layout index,
SvelteKit scaffold, RDF loader/query layer, ontology graph route, and basic
SPARQL route exist. Current focus: reality-sync `README.md`/`ROADMAP.md`/
`TODO.md`, keep namespace paths consistently under `static/ontology/`, and
add CI that mirrors local validation.

### Known issues (Phase 0)
- [x] ~~`static/ontology/sstim-vocab.ttl` SHACL non-conformance on
      `sstim-v:allFrequencyBands`~~ — resolved 2026-04-22. Introduced
      `sstim:FrequencyBandGroup` in `sstim-core.ttl`; retyped
      `allFrequencyBands` away from `sstim:FrequencyBand`. Both files
      now fully conform against `sstim-shapes.ttl`.

---

## 1. Reference Documents

All 31 files to be written by Claude (this conversation) before any
software is built. Written in the order specified in `ROADMAP.md`.

### Already complete
- [x] `CLAUDE.md` — AI agent directive `P0`
- [x] `ROADMAP.md` — strategic phases `P0`

### Reference documents (Phase 0 — committed)
- [x] `TODO.md` — this file `P0`
- [x] `docs/concept/SENSORY_STIMULATION.md` `P0`
- [x] `docs/concept/SCOPE.md` `P0`
- [x] `docs/concept/EVIDENCE_FRAMEWORK.md` `P0`
- [x] `docs/concept/FACILITATING_DEDICATION.md` `P0`
- [x] `docs/technical/PRESET_FORMAT.md` `P0`
- [x] `docs/technical/SESSION_MODEL.md` `P0`
- [x] `docs/technical/BREATHING_MODEL.md` — defensive publication `P0`
- [x] `docs/technical/SYMMETRY_SYSTEM.md` — defensive publication `P0`
- [x] `docs/technical/MARTIGLI_BINAURAL.md` — defensive publication `P0`
- [x] `docs/technical/AUDIO_ENGINE_ARCHITECTURE.md` `P0`
- [x] `docs/technical/VISUAL_ENGINE_ARCHITECTURE.md` `P0`
- [x] `static/ontology/README.md` `P0`
- [x] `static/ontology/sstim-core.ttl` `P0`
- [x] `static/ontology/sstim-vocab.ttl` `P0`
- [x] `static/ontology/sstim-shapes.ttl` `P0`
- [x] `static/ontology/sstim-alignments.ttl` `P0`
- [x] `src/README.md` `P0`
- [x] `src/engines/README.md` `P0`
- [x] `src/core/README.md` `P0`
- [x] `src/rdf/README.md` `P0`
- [x] `src/ui/README.md` `P0`
- [x] `README.md` — root landing page; rewritten in public foundation pass `P0`
- [x] `CONTRIBUTING.md` `P0`
- [x] `docs/ecosystem/IP_STRATEGY.md` `P0`
- [x] `docs/ecosystem/W3C_CG_CHARTER.md` `P0`
- [x] `docs/ecosystem/ADVISORY_BOARD.md` `P0`
- [x] `docs/ecosystem/PARTNERS.md` `P0`
- [x] `docs/ecosystem/CONSORTIUM_INVITATION.md` `P0`

### Generated artifacts (still to produce)
- [x] `docs/README.md` — index over `concept/` `technical/` `ecosystem/` `P0`
- [x] `static/ontology/instances/README.md` — layout + current emptiness note `P0`
- [ ] `AGENTS.md` — from `CLAUDE.md` `P1`
- [ ] `GEMINI.md` — from `CLAUDE.md` `P1`
- [ ] `.github/copilot-instructions.md` — from `CLAUDE.md` `P1`
- [ ] `.cursor/rules/rdf.mdc` — from `static/ontology/README.md` + `CLAUDE.md` `P1`
- [ ] `.cursor/rules/audio-engine.mdc` — from `src/core/README.md` `P1`
- [ ] `schemas/preset.schema.json` — from `docs/technical/PRESET_FORMAT.md` `P1`
- [ ] `schemas/session.schema.json` — from `docs/technical/SESSION_MODEL.md` `P1`
- [ ] `CHANGELOG.md` — start at first tagged release `P1`

---

## 2. IP and Legal

Tasks with time-sensitivity. Defensive publications in particular:
once `docs/technical/BREATHING_MODEL.md`, `SYMMETRY_SYSTEM.md`, and
`MARTIGLI_BINAURAL.md` are committed to the public repo, that commit
timestamp establishes prior art. The IP.com and arXiv submissions
below are belt-and-suspenders — not strictly required but create
indexed, examiner-searchable records.

### Defensive publications (do immediately after P0 documents exist)
- [ ] Submit `BREATHING_MODEL.md` to IP.com Defensive Publication `P1`
      *Note: use the technical spec content as-is; IP.com requires
      enabling disclosure — the level of detail in the doc is sufficient*
- [ ] Submit `SYMMETRY_SYSTEM.md` to IP.com Defensive Publication `P1`
- [ ] Submit `MARTIGLI_BINAURAL.md` to IP.com Defensive Publication `P1`
- [ ] Submit combined BSC techniques overview to arXiv (cs.SD section) `P1`
      *Note: arXiv submission requires institutional affiliation or
      endorsement. Renato has PhD credentials; check arXiv endorsement
      process for cs.SD. Alternative: IACR ePrint or OSF Preprints*
- [ ] Record IP.com submission receipts and arXiv IDs in
      `docs/ecosystem/DEFENSIVE_PUBLICATIONS.md` (Claude Code generates
      this file after submissions are complete) `P1`

### Trademark filings — Brazil (INPI) — do in P1
- [ ] File "BioSynCare" — Classes 9, 41, 44 — INPI-BR `P1`
      *Note: R$355–415 per class for small entity. File via e-INPI portal.
      24–36 month examination timeline. First-to-use jurisdiction.*
- [ ] File "Sensory Stimulation" / "Captação Sensorial" — Classes 9, 41 `P1`
      *Note: "Sensory Stimulation" is descriptive and likely not trademarkable; assess with counsel.
      File in Portuguese as "Captação Sensorial" as primary Brazilian mark.*
- [ ] File "BSC Lab" — Class 9 — INPI-BR `P1`
- [ ] File "Seraphony" — Class 9, 42 — INPI-BR `P1`
      *Note: Seraphony is the AI session generation feature name.
      Worth protecting separately as it may become a distinct product.*

### Trademark filings — EU (EUIPO) — do in P1-P2
- [ ] File "BioSynCare" — Class 9 minimum — EUIPO `P1`
      *Note: ~€850 for one class. Renato operates from Modena, Italy.
      Priority: do this. EU protection essential for commercial app.*
- [ ] File "Sensory Stimulation" — Classes 9, 41 — EUIPO `P2`
      *Note: lower urgency than BioSynCare; file once Brazilian
      application is confirmed accepted*

### Copyright registration
- [ ] Register preset catalog v0.9.1 as a corpus with INPI-BR `P1`
      *Note: ~R$150–200. Establishes timestamped authorship record.
      Important before catalog grows further.*
- [ ] Contributor agreement with Riccardo Berti clarifying IP ownership
      of BioSynCare React Native codebase `P0`
      *Note: urgent — do before further BioSynCare commits. Simple
      work-for-hire clause or joint ownership declaration.*

### Ontology namespace
- [ ] Register `https://w3id.org/sstim` persistent namespace for the
      ontology `P1`
      *Process: fork https://github.com/perma-id/w3id.org, create
      `sstim/` folder with `.htaccess` content negotiation rules,
      submit PR. Typically merges in 1–2 weeks.*
- [ ] Register `https://w3id.org/bsc` persistent namespace for BSC
      product instances (preset, session, annotation, evidence) `P1`
      *Same process: `bsc/` folder with routing for the sub-paths
      used by BSC preset/session/annotation IRIs.*
- [ ] Register `sstim:` and `bsc:` prefixes at https://prefix.cc `P1`
- [x] Add `static/_headers` with COOP/COEP for Netlify (required for
      SharedArrayBuffer and WASM threading) `P1`

---

## 3. Ontology and Vocabulary

### Phase 0 (done above in documents section)
Turtle files are listed in section 1. After they exist:

### Phase 1 validation and publication
- [x] Run pySHACL against `sstim-core.ttl` with `sstim-shapes.ttl` `P1`
      `python -m pyshacl -s static/ontology/sstim-shapes.ttl static/ontology/sstim-core.ttl`
- [x] Run pySHACL against `sstim-vocab.ttl` with `sstim-shapes.ttl` `P1`
- [x] Fix any SHACL violations before publishing `P1`
- [ ] Run HermiT or ELK OWL reasoner on `sstim-core.ttl` to check
      consistency (Protégé, command line, or robot verify) `P1`
- [ ] Generate WIDOCO HTML docs from `sstim-core.ttl` + `sstim-vocab.ttl` `P1`
      `java -jar widoco.jar -ontFile static/ontology/sstim-core.ttl -outFolder docs-site`
- [ ] Deploy WIDOCO output to GitHub Pages (`docs-site/` branch) `P1`
- [ ] Publish ontology at `https://w3id.org/sstim` with content
      negotiation (Turtle for `Accept: text/turtle`, HTML for browsers) `P1`
- [ ] Add `owl:versionIRI` pointing to immutable snapshot:
      `https://w3id.org/sstim/0.1.0/sstim-core.ttl` `P1`

### Phase 1 instances
- [ ] Convert preset catalog v0.9.1 to RDF instances in
      `static/ontology/instances/presets/` — one file per group or one
      combined file `P1`
      *Note: Claude Code generates this from `PRESET_FORMAT.md` +
      `sstim-core.ttl` + the JSON catalog. Verify each instance
      passes SHACL before committing.*
- [ ] Convert Appendix A references to RDF in
      `static/ontology/instances/references/` `P1`
- [ ] Add RDF individuals for Binaural, Martigli, Symmetry, and
      Martigli-Binaural voice types as technique instances `P1`

### Phase 2 ontology extensions
- [ ] Model session instance class: `sstim:SessionInstance` with
      `sstim:executedPreset`, `sstim:userRespirationDurationInitial`,
      `sstim:userRespirationDurationFinal`, `sstim:sessionTimestamp` `P2`
- [ ] Add `sstim:derivedFrom` property for preset lineage tracking `P2`
- [ ] Extend `sstim-alignments.ttl` with Music Ontology and NIFSTD
      alignments once ontology is stable `P2`

### Wikidata contribution
- [ ] Create Wikidata item for "Martigli oscillation" technique
      (does not exist) `P1`
- [ ] Create Wikidata item for "Sonic symmetry entrainment" /
      "Symmetry permutation entrainment" (does not exist) `P1`
- [ ] Add `skos:exactMatch` links from `sstim-alignments.ttl` to:
      - Brainwave entrainment: Q4957211 `P1`
      - Binaural beats: Q858775 `P1`
      - Alpha wave: Q398696 `P1`
      - Neuromodulation: Q1749498 `P1`
      - Meditation: Q45996 `P1`
      - Isochronic tones: Q16956430 `P1`
- [ ] Improve Wikipedia article on brainwave entrainment with
      BSC vocabulary and references (human task, not Claude Code) `P1`
- [ ] Improve Wikipedia article on binaural beats — add accurate
      evidence tier context (human task) `P1`

---

## 4. Software — Phase 1 (BSC Lab v0.1 Knowledge Browser)

Do not start these until all Phase 0 documents are committed.

### Project scaffold
- [x] SvelteKit 2 + Svelte 5 + Vite 6 project scaffold `P1`
- [ ] Configure Svelte 5 MCP server for AI tooling `P1`
      `npx @sveltejs/mcp` — add to `.cursor/mcp.json`
- [x] Install core dependencies: `n3`, `@comunica/query-sparql-rdfjs`,
      `rdf-validate-shacl`, `cytoscape`, `picocss` `P1`
- [~] Configure Vite/SvelteKit runtime headers and future PWA/WASM plugins `P1`
      *Done: COOP/COEP in `vite.config.js` and `static/_headers`. Pending:
      WASM/PWA plugin additions when those features land.*
- [ ] Add pre-commit hook: Turtle syntax check + JSON preset schema
      validation `P1`
- [~] Configure GitHub Actions: `validate-rdf.yml`, `widoco-docs.yml`,
      `lint.yml` `P1`
      *Done: `validate-rdf.yml`, `lint.yml`. Pending: WIDOCO docs workflow.*
- [x] `netlify.toml` and `static/_headers` configuration `P1`
- [x] SvelteKit `src/app.html`, layout, ontology route, and SPARQL route `P1`

### RDF layer
- [x] `src/rdf/namespaces.js` — all prefix declarations `P1`
- [~] `src/rdf/loader.js` — fetch + parse TTL files from URLs (N3.js) `P1`
      *Loads: sstim-core.ttl, sstim-vocab.ttl, sstim-alignments.ttl,
      sstim-shapes.ttl. Instance loading is pending until instance TTL exists.*
- [ ] `src/rdf/store.js` — N3.Store management, merge multiple graphs `P1`
- [x] `src/rdf/query.js` — Comunica SPARQL engine, lazy-loaded `P1`
      *Dynamic import: only load Comunica when SPARQL interface opens*
- [ ] `src/rdf/validate.js` — rdf-validate-shacl in browser `P1`
- [ ] `src/rdf/export.js` — serialize preset instances to JSON,
      serialize annotations as Turtle `P1`
- [ ] `src/rdf/annotations/AnnotationStore.js` — named graph per node,
      IndexedDB persistence `P1`

### UI — Preset browser
- [ ] `src/ui/browser/PresetBrowser.js` — SPARQL query for all presets,
      filter by group / frequency band / evidence tier `P1`
- [ ] `src/ui/browser/ProtocolCard.js` — display preset metadata,
      voice architecture summary, evidence tier badge `P1`
- [ ] `src/ui/browser/EvidencePanel.js` — show evidence chain:
      preset → claims → references → public-safe flag `P1`

### UI — Ontology graph
- [x] `src/ui/graph/OntologyGraph.svelte` — Cytoscape.js, lazy-loaded `P1`
      *Renders: OWL class hierarchy + SKOS broader/narrower relationships.
      Layout: cose. Only loads when graph route opens.*
- [ ] `src/ui/graph/EvidenceChainView.js` — force-directed graph of
      a single preset's evidence chain `P1`

### UI — Annotation
- [ ] Install CodeMirror 6 with Turtle syntax support `P1`
      `npm install @codemirror/view @codemirror/state codemirror-lang-turtle`
- [ ] `src/ui/annotation/AnnotationEditor.js` — CodeMirror editor,
      target node selector, save to AnnotationStore `P1`

### UI — SPARQL interface
- [~] SPARQL route — textarea editor, lazy-loads Comunica, executes SELECT query `P1`
      *Dedicated CodeMirror component still pending.*
- [ ] `src/ui/sparql/ResultsView.js` — render bindings as table,
      CONSTRUCT results as graph `P1`

### Deployment
- [ ] Deploy BSC Lab v0.1 to Netlify: `lab.biosyncare.com` (CNAME at Keliweb) `P1`
- [ ] Verify content negotiation at `w3id.org/sstim`: Turtle for API,
      HTML for browser `P1`
- [ ] Verify WIDOCO docs are live on GitHub Pages `P1`

---

## 5. Software — Phase 2 (BSC Lab v0.2 Stimulation Player)

**Do not start until Phase 1 is complete and deployed.**

### Engine interfaces and implementations
- [ ] `src/engines/audio/IAudioEngine.js` `P2`
- [ ] `src/engines/audio/VanillaWebAudioEngine.js` `P2`
- [ ] `src/engines/audio/ToneJsEngine.js` `P2`
- [ ] `src/engines/visual/IVisualEngine.js` `P2`
- [ ] `src/engines/visual/PixiJSEngine.js` — PixiJS v8, WebGPU/WebGL `P2`
- [ ] `src/engines/visual/CSSEngine.js` — CSS animations fallback `P2`
- [ ] `src/engines/haptic/IHapticEngine.js` `P2`
- [ ] `src/engines/haptic/VibrationApiEngine.js` `P2`
- [ ] `src/engines/haptic/NullHapticEngine.js` — silent fallback `P2`

### AudioWorklet processors (in static/worklets/, never bundled)
- [ ] `static/worklets/binaural.worklet.js` — stereo oscillators, beat
      frequency, panning modes `P2`
- [ ] `static/worklets/martigli.worklet.js` — sinusoidal frequency sweep,
      breathing arc interpolation `P2`
- [ ] `static/worklets/symmetry.worklet.js` — permuted note sequence
      scheduling, isochronic mode `P2`

### Core orchestration
- [ ] `src/core/MasterClock.js` — wraps AudioContext.currentTime,
      provides `now()`, `scheduleAt(t, fn)` `P2`
- [ ] `src/core/SessionScheduler.js` — Web Worker, 25ms lookahead,
      posts timing state to main thread `P2`
- [ ] `src/core/StimulationOrchestrator.js` — wires audio + visual +
      haptic engines via interfaces only `P2`
- [ ] `src/core/ProtocolRunner.js` — maps preset JSON to engine calls `P2`
- [ ] `src/core/SessionRecorder.js` — captures preset + user params +
      timestamps → complete reproducible session spec `P2`

### UI — Player
- [ ] `src/ui/player/SessionPlayer.js` — play/pause/stop/seek,
      duration display, live parameter readout `P2`
- [ ] `src/ui/player/EngineSelector.js` — switch audio/visual engine
      live during session (key research feature) `P2`
- [ ] `src/ui/player/ParameterDisplay.js` — real-time frequency,
      breathing period, entrainment target display `P2`

### UI — Creator (real-time preset design)
- [ ] `src/ui/creator/PresetCreator.js` — add/remove voices, set
      group/targetBand/evidence tier `P2`
- [ ] `src/ui/creator/VoiceEditor.js` — per-voice parameter sliders
      with bounds from `PRESET_FORMAT.md` `P2`
- [ ] `src/ui/creator/LivePreview.js` — plays current state in real
      time as parameters are adjusted `P2`

### RDF pipeline
- [ ] `src/rdf/export.js` — extend to generate `dist/presets.json`
      for BioSynCare consumption `P2`
- [ ] CI pipeline step: validate all ontology instances → export JSON
      → commit `dist/presets.json` `P2`

### PWA
- [ ] Service worker: cache preset JSONs, ontology TTL files,
      app assets for offline use `P2`
- [ ] Offline indicator in UI `P2`

---

## 6. Software — Phase 3 (Evidence Infrastructure)

**Do not start until Phase 2 is complete and W3C CG is active.**

- [ ] GDPR/LGPD-compliant user consent flow for session data
      collection `P3`
      *Note: must clearly state: what is collected, why, how stored,
      right to delete. Separate consent from app usage consent.*
- [ ] Post-session self-report: affect (1–5), focus (1–5), free-text
      note, stored with session record `P3`
- [ ] Session data download: user can export their own history as JSON
      and RDF `P3`
- [ ] Correlation view: SPARQL query across session history showing
      preset group vs. self-report patterns `P3`
- [ ] WASM audio engine: Rust → WASM Martigli and Symmetry processors
      *Note: requires wasm-pack, Rust toolchain, nightly for atomics.
      SharedArrayBuffer ring buffer pattern.* `P3`
- [ ] Expanded annotation: multi-user named graphs with server-side sync;
      backend technology TBD in Phase 3 (Firebase/Firestore ruled out
      as primary hosting; evaluate alternatives at that point) `P3`

---

## 7. Community and Ecosystem

### Immediate — before any public launch
- [ ] Contributor agreement / IP clarification with Riccardo Berti `P0`
      *This is the most time-sensitive legal task — do before next
      BioSynCare commit*

### Phase 1 community tasks
- [ ] Personal message to each named partner (not mass email) with
      the specific ask: advisory board + eventual W3C CG founding
      member. Partners to contact:
  - [ ] Marco Fracasso (MD, Italy) `P1`
  - [ ] Rafael Reinhart (MD, Brazil, endocrinologist) `P1`
  - [ ] Theo F. Marins (PhD, neuroscience, Austria) `P1`
  - [ ] Prof. Olimpia Pino (University of Parma) `P1`
  - [ ] IPRJ/UERJ institutional contact `P1`
  - [ ] Junto Innovation Hub institutional contact `P1`
- [ ] Ask Juliana Braga de Salles Andrade (PhD) formally about
      scientific advisory role — named on website `P1`
      *Also ask: her mechanism hypothesis for the facilitation of
      dedication effect (OCD/neuroimaging perspective)*
- [ ] Add scientific advisory board section to `biosyncare.com` `P1`
- [ ] Publish first web article: "How sensory stimulation facilitates
      dedicated work" on biosyncare.com — personal, specific, honest
      about mechanism uncertainty `P1`

### W3C Community Group
- [ ] Confirm 5 founding members (Renato + 4 from partner list) `P1`
      *Do not submit CG proposal until 5 are confirmed. An empty or
      low-activity CG closes and damages credibility.*
- [ ] Create W3C account if not already exists: `https://www.w3.org/accounts/request` `P1`
- [ ] Submit W3C Community Group proposal using `docs/ecosystem/W3C_CG_CHARTER.md` `P1`
      *URL: https://www.w3.org/community/groups/proposed/*
      *Name: "Sensory Stimulation Community Group" or "Rhythmic Sensory
      Stimulation Community Group" — confirm with founding members*
- [ ] Announce CG on relevant mailing lists and forums after creation `P1`
- [ ] First CG meeting: agree on scope, initial vocabulary items,
      contribution process `P2`
- [ ] First CG report: draft vocabulary specification for sensory
      stimulation modalities and protocol types `P2`
      *This becomes the seed content for a future W3C Working Group
      if traction develops*

### Phase 1-2 community
- [ ] GitHub Discussions enabled on BSC Lab repo: initial threads
      on frequency band taxonomy, evidence tier definitions `P1`
- [ ] Post introductory thread in r/neuroscience and r/meditation
      describing BSC Lab (not commercial — research focus) `P1`
- [ ] Post in relevant Facebook groups (mindfulness, neuroscience,
      binaural beats communities) `P1`
- [ ] LinkedIn post from Renato's profile about BSC Lab launch `P1`
- [ ] Email to ISNR (International Society for Neurotherapy and
      Research) about BSC ontology and open platform `P2`
- [ ] Reach out to University of Modena (UNIMORE) or University of
      Bologna neuroscience department about BSC Lab — local proximity `P2`
- [ ] Contact Mind & Life Institute about BSC Lab alignment with
      contemplative neuroscience `P3`

---

## 8. BioSynCare Commercial (parallel track)

These tasks run independently of BSC Lab development. Listed here
because financial sustainability constrains everything else.

### Immediate launch phase (April–May 2026)
- [ ] Friends and family activation: personal messages to ~20 people,
      ask to install, rate 5 stars, use daily for one week `P1`
- [ ] Ask partners (Fracasso, Reinhart, Pino, Marins) to share with
      their networks and research groups `P1`
- [ ] Set up structured feedback channel: WhatsApp group or email list
      for early users to report experiences `P1`

### Content and social
- [ ] LinkedIn: launch post about new BioSynCare version with
      Seraphony and Rooms features `P1`
- [ ] Instagram: 3–5 posts introducing the app's use cases
      (stress, focus, sleep, dedication) `P1`
- [ ] Reddit: threads in r/productivity, r/meditation,
      r/binaural, r/getdisciplined `P1`
- [ ] TikTok: short demo videos of Seraphony generating a session
      on demand (high shareability) `P1`
- [ ] Facebook: posts in mindfulness, binaural beats, productivity
      groups `P1`
- [ ] YouTube: consider "how Seraphony works" video if capacity exists `P2`

### Monetization
- [ ] Monitor conversion from free to paid tier in first 30 days `P1`
- [ ] Evaluate subscription price increase (€2 → €5–8/month) after
      first 100 paying subscribers `P2`
      *Note: grandfather existing subscribers. Be transparent about
      introductory pricing in app store listing.*
- [ ] Evaluate adding a "Researcher" tier: unlimited sessions, session
      export, lower price — designed for academic users of BSC Lab `P2`
- [ ] Meta ads: consider budget after reaching 100 organic subscribers `P2`

### Product
- [ ] Collect and categorize user feedback on Seraphony sessions:
      what requests produce good results, what fails `P1`
- [ ] Collect feedback on Rooms: who is using it and for what `P1`
- [ ] Identify top 3 user experience friction points from early users `P1`
- [ ] Evaluate whether session duration defaults (15 min) match actual
      user behavior vs. claimed behavior (30–60 min for dedication) `P2`

### Data and research alignment
- [ ] Design GDPR/LGPD-compliant opt-in for anonymous session data
      sharing — to feed future evidence layer `P2`
      *Coordinate with BSC Lab session data infrastructure (P3)*
- [ ] Add session export feature to BioSynCare for users who want
      their own data `P3`

---

## 9. Infrastructure and DevOps

- [ ] GitHub organization created: `bsc-lab` or `biosyncare-lab` `P0`
- [ ] Repository created with correct license files:
      `LICENSE` (Apache 2.0) and `LICENSE-ontology` (CC BY 4.0) `P0`
- [ ] Branch protection: require PR for main, CI must pass `P1`
- [ ] Dependabot configured for npm dependency updates `P1`
- [ ] Secret scanning enabled `P1`
- [x] `.github/workflows/validate-rdf.yml` — pySHACL on every PR
      touching `static/ontology/` `P1`
- [ ] `.github/workflows/widoco-docs.yml` — regenerate docs-site
      on TTL file change `P1`
- [x] `.github/workflows/lint.yml` — Svelte type check and static build `P1`
- [ ] `hooks/pre-commit` — local validation mirror of CI `P1`

---

## 10. Decisions Pending

These require human judgment before tasks can proceed. Flagged here
to prevent AI agents from making the decision implicitly by building
something that assumes an answer.

- [x] **Firebase role**: resolved 2026-04-22. Firebase is not used.
  App hosting moved to **Netlify** (`lab.biosyncare.com`) — already used
  for BioSynCare, free tier is generous (100 GB/month vs Firebase's 10 GB),
  and supports `static/_headers` for COOP/COEP without a configuration
  surface. Annotation and session persistence: IndexedDB locally; a
  server-side sync backend (if ever needed) is deferred to Phase 3 and
  will be evaluated then without Firebase assumed.

- [?] **UI framework final confirmation**: Svelte 5 is the stated
  choice. Riccardo works in React Native (BioSynCare). If he
  contributes to BSC Lab frontend, React may be more natural.
  Confirm with Riccardo before Phase 1 scaffold is built.

- [?] **Preset catalog as RDF master vs. JSON master**: the current
  catalog is JSON. Should the RDF become the source of truth (JSON
  exported from RDF) or should JSON remain master (RDF derived)?
  Affects Phase 2 export pipeline design. *Current recommendation:
  RDF as master from Phase 1 instance generation onward; JSON
  in `src/data/presets/` remains the BioSynCare bridge format.*

- [?] **Juliana's advisory role**: does she want a named public role
  on `biosyncare.com` and `BSC Lab`? Her boundary is no joint work
  that could stress the relationship. A named advisory role with no
  deliverables may be acceptable. Confirm directly.

- [?] **W3C CG name**: "Sensory Stimulation Community Group" uses the
  coined BSC term. "Rhythmic Sensory Stimulation Community Group"
  is more neutral but narrower. Confirm with founding members before
  submitting proposal.

- [?] **arXiv submission path**: Renato has a PhD in physics but may
  not have current institutional affiliation. arXiv cs.SD may require
  endorsement. Check: does the IPRJ/UERJ partnership provide
  institutional affiliation for submission? Alternatively, OSF
  Preprints has no endorsement requirement.

---

## 11. Recurring Maintenance Tasks

Not project-specific — run on a schedule.

**Monthly:**
- [ ] Review npm audit output and update dependencies `recurring`
- [ ] Check pySHACL for new releases; update CI if needed `recurring`
- [ ] Review BioSynCare user feedback and extract actionable items `recurring`
- [ ] Update `docs/ecosystem/TRADEMARK_STATUS.md` with filing progress `recurring`

**Per release:**
- [ ] Update `owl:versionIRI` in ontology header `recurring`
- [ ] Run WIDOCO to regenerate docs `recurring`
- [ ] Validate all preset instances pass SHACL `recurring`
- [ ] Export `dist/presets.json` for BioSynCare `recurring`
- [ ] Tag release in git with semver `recurring`

**Per new preset added:**
- [ ] Validate JSON against `schemas/preset.schema.json` `recurring`
- [ ] Create RDF instance in `static/ontology/instances/presets/` `recurring`
- [ ] Run SHACL validation on new instance `recurring`
- [ ] Verify `techDesc` cites only PUBLIC-SAFE references `recurring`

---

*Last updated: April 2026 — Renato Fabbri*
*Next update due: when CI is merged and Phase 1 focus is confirmed*
