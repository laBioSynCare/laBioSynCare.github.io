# Delivered work

**Archive — not a working document.** 106 completed items moved out of
[`TODO.md`](../TODO.md) on 2026-08-15, with their notes and links intact.

It lives here rather than in [`CHANGELOG.md`](../CHANGELOG.md) because that file is
scoped to the SSTIM ontology — the versioned, citable artifact — and says so in its
own header; roughly half of what follows is application, infrastructure, legal and
community work that has no place in an ontology changelog. It is archived rather than
deleted because a record of delivered work is evidence, and this project has funding
applications that need it.

Nothing here is a task and nothing here needs maintaining. Its growing is the point:
an archive nobody reads while working can be as long as it likes, which is exactly
what a working task list cannot.

## 1. Reference Documents

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
- [x] `CHARTER.md` (root) — W3C CG draft charter `P0`
- [x] `docs/ecosystem/ADVISORY_BOARD.md` `P0`
- [x] `docs/ecosystem/PARTNERS.md` `P0`
- [x] `docs/ecosystem/CONSORTIUM_INVITATION.md` `P0`

### Preset schema (recorded delivered 2026-08-18)
- [x] `static/schemas/preset.schema.json` — from `docs/technical/PRESET_FORMAT.md` `P1`
      *Shipped with ADR 0051 and gated by `make preset-contract`, which holds the
      schema, `sstim-shapes.ttl` and the documented ranges to the same numbers.
      The task stayed open in `TODO.md`, and `CLAUDE.md` described it as planned
      in two places, because all three named the path `schemas/` while the file
      lives at `static/schemas/`. A false absence of exactly the kind §3.6 exists
      to catch, sitting inside the file that defines §3.6.*

### Agent instruction files (2026-08-18)
- [x] `AGENTS.md` — from `CLAUDE.md` `P1`
- [x] `GEMINI.md` — from `CLAUDE.md` `P1`
- [x] `.github/copilot-instructions.md` — from `CLAUDE.md` `P1`
- [x] `.cursor/rules/rdf.mdc` `P1`
- [x] `.cursor/rules/audio-engine.mdc` `P1`
      *Written as thin pointers rather than derived copies. `CLAUDE.md` is 769
      lines; three or five copies of it would drift out of agreement with it and
      with each other, which is the failure this repository spends most of its
      gates preventing. Each file carries a digest of the invariants where a
      mistake is expensive — the engine clock, worklet bundling, allocation in
      `process()`, ontology-file protection, health claims, naming your
      instrument, Svelte 5 runes — and says `CLAUDE.md` wins on any
      disagreement. The two `.mdc` files are glob-scoped so Cursor loads the RDF
      rules for ontology paths and the audio rules for engine paths.*

### Generated artifacts (still to produce)
- [x] `docs/README.md` — index over `concept/` `technical/` `ecosystem/` `P0`
- [x] `static/ontology/instances/README.md` — layout + current emptiness note `P0`
- [x] `static/schemas/session.schema.json` — the native session bundle contract `P1`
      *Shipped 2026-08-13. Under `static/` rather than a root `schemas/`, so the
      `$id` dereferences at `/schemas/session.schema.json` — the same treatment
      `manifest.schema.json` gets. It is the contract; `SESSION_MODEL.md` now
      documents it rather than defining it (KR-02). Gated by
      `make session-contract`. The preset schema above should follow the same
      placement when it lands.*
- [x] `CHANGELOG.md` — started at the first tagged release (v0.5.0); Keep a Changelog format, 0.1.0–0.5.0 `P1`

## 2. IP and Legal

### Ontology namespace
- [x] Register `https://w3id.org/sstim` persistent namespace for the
      ontology `P1`
      *Process: fork https://github.com/perma-id/w3id.org, create
      `sstim/` folder with `.htaccess` content negotiation rules,
      submit PR. PR #6184 was merged on 2026-06-11; root RDF, module,
      Patch Studio, and versioned `0.1.0/` redirects are live. Keep the
      mirrored copy in `docs/ecosystem/w3id/` synchronized with the registry.*
- [x] Deploy and register the manifest-driven `0.13` publication routes `P1`
      *The repository now generates a Full namespace catalog for machine RDF at
      `/sstim`, exposes the exact two-class Kernel at `/sstim/kernel`, and
      generates a Stimulus + Exposure namespace catalog at `/sstim/exposure`.
      The separate `/sstim/module/exposure` route returns only the Exposure
      semantic module and is the live Full profile's distribution/`owl:imports`
      endpoint; `/sstim/exposure` must never be used as that import target
      (although `dct:requires` may use it as the logical ontology identifier).
      It also defines PROF-enabled profile entry points, `/sstim/manifest`, and
      the schema PID `/sstim/manifest-schema/1`. Pages targets were deployed,
      perma-id PR #6480 merged on 2026-08-03, and the 19-case negotiation matrix
      was verified on 2026-08-04.*
- [x] Add `static/_headers` with COOP/COEP for future Netlify/custom hosting
      (required for SharedArrayBuffer and WASM threading) `P1`
      *Kept for future Netlify/custom hosting; GitHub Pages remains the
      primary host while BSC Lab is client-only and does not need these
      headers.*

## 3. Ontology and Vocabulary

### Phase 1 validation and publication
- [x] Run pySHACL against `sstim-core.ttl` with `sstim-shapes.ttl` `P1`
      `python -m pyshacl -s static/ontology/sstim-shapes.ttl static/ontology/sstim-core.ttl`
- [x] Run pySHACL against `sstim-vocab.ttl` with `sstim-shapes.ttl` `P1`
- [x] Fix any SHACL violations before publishing `P1`
- [x] Run HermiT or ELK OWL reasoner on the complete ontology term space to
      check consistency `P1`
      *ROBOT/HermiT is part of `make validate` and RDF CI.*
- [x] Add repository-wide RDF quality and competency-query audits `P1`
      *`scripts/sstim-quality-audit.py` and
      `scripts/sstim-exposure-sanity.mjs` cover metadata, SKOS, evidence,
      safety, protocols, sessions, VoID, loader coverage, and dangling IRIs.*
- [x] Accept and implement the SSTIM Core Profile and concern-module architecture in
      [ADR 0043](../docs/decisions/0043-sstim-core-profile-and-module-boundaries.md)
      `P1`
      *Accepted 2026-08-01 and implemented as a small Kernel, Core, Core Plus,
      optional concern/bridge modules, and a Full compatibility profile.* `static/ontology/manifest.json` is the source of
      truth for modules and closures; the Core, Core Plus, and Full profile
      entry points select semantic imports while shapes remain explicit. Frozen
      `0.14.0` is the latest immutable release. Normalized Full-union parity
      preserves its semantics subject only to ADR 0044's channel clarification
      and expected metadata/ownership changes. Deferred semantic and finer
      packaging work is listed in ADR 0043 and the module architecture guide.*
- [x] Harden optional links in the weak Core SHACL contract `P1`
      *`hasStimulusChannel` and `hasStimulationTarget` remain optional. When
      asserted, the channel must be typed `sstim-ex:StimulusChannel`, and the
      target must be an IRI or blank node rather than a literal. Both
      constraints remain no stronger than the Full contract.*
- [x] Add immutable modular-release guards `P1`
      *A released manifest must declare its versioned base, manifest, and schema
      URLs, use the frozen schema through `$schema`, and give every snapshotted
      artifact an immutable `publication.versionedUrl`. Released profile entry
      points must import exact versioned sibling files and expose immutable PROF
      artifacts. Contract paths must exist; Git and checksum-ledger failures are
      fail-closed; registered snapshots cannot be force-overwritten.*
- [x] Complete the release contract for every SSTIM profile `P1`
      *Done. Every profile declares a positive fixture and a SPARQL competency
      query; Core, Core Plus, and Full additionally declare out-of-scope and
      adversarial fixtures. Kernel has an empty shape closure, so per
      [ADR 0045](../docs/decisions/0045-shapeless-profiles-are-discovery-entry-points.md)
      it is a discovery entry point and must not declare the negative
      categories. All of it is executed against each profile's own closure by
      `make core-profile-contract`. Pages targets were deployed and verified on
      2026-08-02;
      [perma-id/w3id.org#6480](https://github.com/perma-id/w3id.org/pull/6480)
      merged 2026-08-03 and the deployed negotiation matrix was verified against
      w3id.org on 2026-08-04 — 19 route/`Accept` combinations, all as modelled.
      `Vary: Accept` is not emitted by any w3id `303` and cannot be set from the
      `.htaccess`; the responses are not cacheable, so the risk it guarded is
      moot. `0.13.0` was released on 2026-08-04.*
- [x] Give the version IRI a whole-ontology artifact to resolve to `P1`
      *Until 0.12 `sstim-core.ttl` was the whole ontology, so `/sstim/<version>`
      could serve it; it is now the two-class Kernel, and a frozen snapshot has
      no single document standing for the release. Since `0.13.0`, snapshotting
      freezes `sstim-namespace.ttl`, the route generator refuses an incomplete
      modular snapshot, and the version IRI resolves to that whole-set
      catalogue.*
- [x] Generate WIDOCO HTML docs from the manifest-defined Full OWL profile `P1`
      *`make ontology-docs` (WIDOCO 1.4.25, pinned in the flake beside ROBOT)
      unions the Full semantic closure before OWL translation and generates its
      reference docs; gap-filling metadata is in `docs/ontology/widoco.properties`.
      SKOS vocabulary docs are generated separately via pyLODE 2.13.2 `vocpub`
      (`make vocab-docs` → `/ontology/docs/vocab/`, ADRs 0023 and 0043).*
- [x] Deploy WIDOCO output to GitHub Pages `P1`
      *Publication path decided (ADR 0023): `pages.yml` generates into
      `dist/ontology/docs/` — deployed artifact only, never committed to
      `main`. First deploy verified live 2026-07-11.*
- [x] Publish ontology at `https://w3id.org/sstim` with content
      negotiation (Turtle for `Accept: text/turtle`, HTML for browsers) `P1`
      *Done 2026-07-11: perma-id PR #6337 merged. Full route × representation
      matrix (Turtle/RDF-XML/JSON-LD/HTML) live for all modules plus the new
      `/sstim/exposure` and `/sstim/void` routes — verified in
      `docs/ontology/reviews/2026-07-11-dbpedia-archivo-submission.md`. Browser
      HTML target is the knowledge browser (ADR 0023); WIDOCO docs at
      `/ontology/docs/` cross-link with the graph view. This was the
      pre-modular route matrix; the staged `0.13` contract redefines
      `/sstim/exposure` as the two-module namespace catalog and adds
      `/sstim/module/exposure` for exact module retrieval/import.*
- [x] Add `owl:versionIRI` pointing to immutable snapshot:
      `https://w3id.org/sstim/0.1.0` `P1`
      *`sstim-core.ttl` declares the version IRI, and
      `static/ontology/0.1.0/` contains the frozen Turtle snapshot.*

### Phase 1 instances
- [x] Do not convert the private BioSynCare/BSC preset catalog v0.9.1 to
      Turtle in BSC Lab `P1`
      *Decision recorded 2026-04-27: the catalog is private to BioSynCare/BSC
      and will not be used as BSC Lab data.*
- [x] Add initial public BSC Lab seed/reference preset instances in
      `static/ontology/instances/presets/` for browser, evidence, and SHACL
      examples `P1`
      *Both public presets are protocol-linked and included by the RDF loader.*
- [x] Add RDF individuals for Binaural, Martigli, Symmetry, and
      Martigli-Binaural voice types as technique instances `P1`
      *Done 2026-04-28 in `static/ontology/instances/frameworks/bsc.ttl`.*

### Phase 2 ontology extensions
- [x] Model session specifications, executed session activities, phased
      self-reports, and a non-personal synthetic example `P2`
- [x] Add `sstim:derivedFrom` property for preset lineage tracking `P2`
      *Implemented as an asymmetric, irreflexive immediate-predecessor relation
      in the Configuration module; longer histories use repeated links.*

### Wikidata contribution
- [x] Reviewed `sstim-alignments.ttl` pass — findings from the 2026-08-01 live
      Wikidata verification `P2`
      *(1) A candidate target now exists for one of the techniques the file lists
      as pending alignment (lines 97–99): **`Monaural beats` Q6898437**, verified
      to exist — 1 statement, no description, 2 sitelinks. `sstim-v:techMonauralBeats`
      has been defined since 0.3.0, so this closes a known pending item rather
      than a gap. Given how thin the Wikidata item is, `closeMatch` is the
      defensible predicate; consider improving Q6898437 first — it is as empty as
      Q98000061 was.
      (2) `sstim-v:techBinauralBeats skos:exactMatch wd:Q863539` asserts exact
      equivalence with an item typed `P31` music genre and `P279` electronic
      music. Sharper than it first appears: the comment seven lines above
      (lines 90–92) already states that `voiceBinaural` is "not identical to the
      perceptual phenomenon or musical genre represented by Wikidata Q863539" and
      uses `relatedMatch` accordingly — then the next line asserts `exactMatch`
      against that same item. The five bands were reasoned down from `exactMatch`
      to `closeMatch` on exactly this ground.
      All ten existing Q-ID targets re-verified valid — no redirects, merges or
      deletions. Resolved 2026-08-08 with explicit maintainer authorization:
      Q6898437 was added via `closeMatch` and Q863539 was weakened to
      `relatedMatch`; frozen release copies remain unchanged.*

## 4. Software — Phase 1 (BSC Lab v0.1 Knowledge Browser)

### Project scaffold
- [x] SvelteKit 2 + Svelte 5 + Vite 6 project scaffold `P1`
- [x] Install core dependencies: `n3`, `@comunica/query-sparql-rdfjs`,
      `rdf-validate-shacl`, `cytoscape`, `picocss` `P1`
- [x] Configure GitHub Actions: `validate-rdf.yml`, `pages.yml`,
      `widoco-docs.yml`, `lint.yml` `P1`
      *Done: `validate-rdf.yml`, `lint.yml`, `pages.yml`. A separate
      `widoco-docs.yml` was superseded by ADR 0023 — WIDOCO runs inside
      `pages.yml` (`make ontology-docs`).*
- [x] `netlify.toml` and `static/_headers` configuration `P1`
- [x] SvelteKit `src/app.html`, layout, ontology route, and SPARQL route `P1`

### RDF layer
- [x] `src/rdf/namespaces.js` — all prefix declarations `P1`
- [x] `src/rdf/loader.js` — fetch + parse TTL files from URLs (N3.js) `P1`
      *Loads: sstim-core.ttl, sstim-vocab.ttl, sstim-alignments.ttl,
      sstim-shapes.ttl, and committed preset/reference instance TTL files.*
- [x] `src/rdf/query.js` — Comunica SPARQL engine, lazy-loaded `P1`
      *Dynamic import: only load Comunica when SPARQL interface opens*

### UI — Ontology graph
- [x] `src/ui/graph/OntologyGraph.svelte` — Cytoscape.js, lazy-loaded `P1`
      *Renders: OWL class hierarchy + SKOS broader/narrower relationships.
      Layout: cose. Only loads when graph route opens.*

### Deployment
- [x] Deploy BSC Lab v0.1 static build to GitHub Pages via
      `.github/workflows/pages.yml` `P1`
      *Primary host while the app is client-only and does not require custom
      response headers.*
- [x] Verify GitHub Pages serves `https://labiosyncare.github.io/ontology/sstim-core.ttl`
      and `https://labiosyncare.github.io/ontology/sstim-vocab.ttl` after the
      Pages workflow runs `P1`
- [x] Verify content negotiation at `w3id.org/sstim` `P1`
      *Done 2026-07-11 (PR #6337 merged): Turtle/RDF-XML/JSON-LD negotiated per
      `Accept`, browser HTML → knowledge browser (ADR 0023), for every module
      plus `/sstim/exposure` and `/sstim/void`. Matrix in
      `docs/ontology/reviews/2026-07-11-dbpedia-archivo-submission.md`. This
      records the pre-modular deployment; the staged `0.13` verification must
      test the `/sstim/exposure` namespace catalog separately from the exact
      `/sstim/module/exposure` module endpoint.*
- [x] Verify WIDOCO docs are live on GitHub Pages `P1`
      *Verified 2026-07-11: `https://labiosyncare.github.io/ontology/docs/`
      serves the generated documentation (title, term anchors, knowledge-
      browser cross-link) alongside the untouched app root and Turtle
      artifacts.*

## 5. Software — Phase 2 (BSC Lab v0.2 Stimulation Player)

### UI — Public entrance (`/` + `/graph`)
- [x] Move the knowledge browser route `/` → `/graph` (route move only;
      hash-resolution logic and deep-link write-back unchanged) `P2`
- [x] Implement the `/` entrance: hero + four-door grid in display order
      ② ① ③ ④ — Svelte 5 runes, Pico.css semantic HTML, theme-aware, doors
      stack on mobile `P2`
- [x] Hash-forward shim on `/`: any non-entrance `location.hash` forwards to
      `/graph` + hash with `replaceState`, so published `/#term` links and
      w3id HTML targets keep resolving `P2`
- [x] `ConversionBar` (Join the W3C group / Contribute a protocol): lives
      inline in door ④ plus a mobile-only sticky bar — not duplicated in a
      hero/footer bar (three simultaneous copies read as clutter on review,
      cut same day) `P2`
- [x] "Contribute a protocol" opens `ContributeProtocolModal` (name +
      description + optional contact → prefilled GitHub issue draft) instead
      of linking straight to the 373-line `CONTRIBUTING.md`; parallel
      `.github/ISSUE_TEMPLATE/protocol-contribution.md` for the direct-to-GitHub
      path `P2`
- [x] Safety routing: photosensitivity advisory inline on the door-①
      demo path, never a gate on `/` (ADR 0011 flash cap stays default-on) `P2`
- [x] Update site nav (`AppTopBar`, `AppBottomDock`) + internal graph links
      for `/graph` `P2`

### Engine interfaces and implementations
- [x] ~~`src/engines/audio/IAudioEngine.js`~~ — shipped, with four
      implementations: Vanilla Web Audio, AudioWorklet, AudioWorklet+WASM, and
      Null. See [`src/engines/README.md`](../src/engines/README.md).
- [x] ~~`src/engines/audio/VanillaWebAudioEngine.js`~~ — shipped; the default.

### AudioWorklet processors (in static/worklets/, never bundled)
- [x] ~~Per-technique `binaural` / `martigli` / `symmetry` worklets~~ —
      **superseded by one unified processor.** `bsc-voice.worklet.js` covers
      every voice type, with `bsc-voice-wasm.worklet.js` + `bsc-osc.wasm` as the
      WASM oscillator variant. Recorded in
      [`AUDIO_ENGINE_ARCHITECTURE.md`](../docs/technical/AUDIO_ENGINE_ARCHITECTURE.md).

### UI — Patch Studio (`src/ui/creator/`)
- [x] ~~`PresetCreator.svelte` — add/remove control/audio/visual/haptic
      tracks, per-param knobs, modulation links, tempo sync, live engine
      preview, cloud save~~ — shipped (currently `patch-studio-model-3`; genuine
      model 1 and model 2 documents import).
- [x] Decide the product boundary: one canonical Studio model/runtime with
      ordinary first-class colour-field and spatial visual tracks, Field
      templates/routes, and a shared visual projection stage —
      [`PATCH_STUDIO_FIELD_INTEGRATION.md`](../docs/technical/PATCH_STUDIO_FIELD_INTEGRATION.md)
      `P2`
- [x] Add first-class colour-field and four spatial-scene track contracts in
      model 2, followed by the current `patch-studio-model-3` boundary for the
      explicit optional depth-to-size cue; retain explicit model-1 and model-2
      import,
      shared spatial parameters, a general-rate `Sinusoid` control, and
      fixed-point coverage `P2`
- [x] Add ordinary Studio inspectors, four Field starter bundles, and shared
      visual composition/presentation over the canonical draft and Studio
      transport/safety path `P2`
- [x] Implement pure, deterministic, report-producing adapters for the main
      Field and all three legacy scene storage families; offer non-destructive
      conversion without rewriting legacy records; retain disabled tone/noise as
      muted tracks and disabled depth as an inactive visual recipe `P2`
- [x] Show the complete adapter report in the starter flow and require explicit
      acknowledgement for warnings, behavior corrections, or unsupported items;
      append Add actions to the live draft/playback with explicit keep/apply-stage
      choices rather than resetting or inferring stage ownership `P2`
- [x] Apply spatial track blend in vector projection modes; state that blend is
      not applicable to autostereogram depth-buffer output; group all spatial
      sources at the first spatial array position before projection; keep static
      SIRDS off clock invalidation and cap dynamic full-frame refresh at 8 fps `P2`
- [x] Remove Field from global navigation; cut `/field/`, `/field/tree/`,
      `/field/abstract/`, and `/field/landscape/` over to prerendered
      compatibility pages that replace-navigate to their Studio starter intents `P2`
- [x] Recursively account for currently unmapped nested, discrete, modulation,
      tempo-sync, and visual-stage state in the partial SSTIM projection; keep
      the lossless session package as executable truth `P2`
- [x] ~~Extract pure `src/ui/creator/modulation.js`~~ — `evalParamValue`,
      `effectiveTempoValue`, `clampRange`, `modAmountRange`, `sumMods`, and the
      binaural center/beat→L/R `resolveBinauralLR`. `applyMods` /
      `controlTrackForTempo` stay in the component as thin cache/reactive
      wrappers (own `liveValues` + change-detected `writeAudio`).
- [x] ~~Extract pure `src/ui/creator/waveformPaths.js`~~ — SVG scope geometry
      + `isoEnvSpec`.
- [x] ~~Extract a cloud-patches store~~ — shipped as the storage seam
      ([ADR 0038](../docs/decisions/0038-identity-providers-and-the-two-seam-adapter.md)):
      `src/storage/` holds `PatchStore` with local and Firestore implementations
      and a conformance suite; `src/firebase/patches.js` is gone.
- [x] ~~Unit tests for `modulation.js` + `waveformPaths.js`~~ —
      `src/ui/creator/{modulation,waveformPaths}.test.js` (base + Σ amount·control,
      clamp, mute→gain 0, tempo-sync resolution, binaural split, scope geometry).
- [x] Model-2 current/import/rejection tests across drafts, links, stores,
      packages, projection, and conformance; focused adapter/starter/spatial tests
      cover disabled-source fixed points, stage policy, report acknowledgement
      predicates, vector blend/topology, and static/dynamic SIRDS timing `P2`

## 7. Community and Ecosystem

### W3C Community Group
- [x] Submit and launch the W3C Community Group — **done; launched, charter not
      yet ratified.** `P1`
      *Participant growth (currently 4 → target ≥12 across ≥3 institutions) is now
      an ongoing KPI — see `docs/ecosystem/ECOSYSTEM_INTEGRATION.md` Workstream 3.*
- [x] Create W3C account `P1`
- [x] Submit W3C Community Group proposal using `CHARTER.md` and `docs/ecosystem/W3C_COMMUNITY_GROUP_PROPOSAL.md` `P1`

## 9. Infrastructure and DevOps
- [x] Repository created with correct license files:
      `LICENSE` (Apache 2.0) and `LICENSE-ontology` (CC BY 4.0) `P0`
- [x] `.github/workflows/validate-rdf.yml` — pySHACL on every PR
      touching `static/ontology/` `P1`
- [x] `.github/workflows/widoco-docs.yml` — regenerate docs-site
      on TTL file change `P1`
      *Superseded by ADR 0023: WIDOCO generation runs inside `pages.yml`
      (`make ontology-docs` → `dist/ontology/docs/`); no separate workflow.*
- [x] `.github/workflows/pages.yml` — build SvelteKit static output and deploy
      `dist/` to GitHub Pages `P1`
- [x] `.github/workflows/lint.yml` — Svelte type check and static build `P1`

## 10. Decisions Pending
- [x] **Firebase role**: updated 2026-04-28 by explicit maintainer direction.
  Phase 1 now includes optional Firebase Auth + Firestore for RDF node
  annotations. The integration is env-gated so GitHub Pages/static builds still
  work without credentials; the authoritative ontology and public instance
  graphs remain client-loaded static RDF.
- [x] **Private catalog boundary**: the BioSynCare/BSC catalog remains private
  JSON outside this repository. BSC Lab does not convert that catalog to Turtle
  and does not use it as app data. Public BSC Lab seed/reference presets may be
  authored as RDF under `static/ontology/instances/presets/`; any JSON export is
  for BSC Lab runtime use only.
- [x] **W3C CG name**: settled as "Sensory Stimulation Vocabulary Community
  Group" (the launched group's name), emphasizing terminology and semantic
  interoperability.
