# TODO

> **For AI agents:** This file tracks all open work at task granularity.
> Read `ROADMAP.md` first for strategic context and phase-gating rules.
> The symbol key is below. Update this file in the same commit that
> completes or starts a task. Do not modify tasks marked `[x]` — they
> are historical record. Do not add tasks to "Not yet" phases without
> explicit instruction from Renato.
>
> **Current phase: Phase 1 public foundation.** Phase 0 is complete. Focus is on
> hardening the published ontology and the knowledge browser, which is deployed
> and well past scaffold stage.
>
> Several Phase-2 artifacts shipped ahead of schedule — the Patch Studio, four
> selectable audio engines, the Sensory Field and the PWA layer. What remains
> deferred is not "the stimulation player" as a whole but three specific pieces:
> the `core/` orchestration layer (three-clock scheduler, `StimulationOrchestrator`),
> a player that takes a **catalogue preset** and plays it, and the
> `SessionRecorder`. See `ROADMAP.md` for per-item status and
> [`docs/technical/PORTABLE_DEPLOYMENT.md`](docs/technical/PORTABLE_DEPLOYMENT.md)
> for the deployment and portability baseline.

---

**Completed items are archived**, not kept here: see
[`docs/DELIVERED.md`](docs/DELIVERED.md). This file tracks what is left to do,
and stays readable by not also being a record of what is finished.

## Symbol Key

```
[x]  Complete
[~]  In progress
[ ]  Not started
[!]  Blocked — see note
[?]  Decision pending — see note
[–]  Abandoned or superseded — kept with the reason, so it is not re-proposed
```

Phase tags:
- `P0` Bootstrap (complete)
- `P1` Public Foundation (May–Jul 2026)
- `P2` Stimulation Platform (Jul–Nov 2026)
- `P3` Evidence Infrastructure (Nov 2026–Apr 2027)

---


**Who owns what.** Four documents carry forward-looking work, and they do not
overlap: this one for operational tasks, [`ROADMAP.md`](ROADMAP.md) for strategy and phase
sequencing, [`TODO.md`](TODO.md) for operational tasks, and
[`docs/ontology/IMPROVEMENT_PLAN.md`](docs/ontology/IMPROVEMENT_PLAN.md) for the
audit-driven ontology sequence and its release gates. What exists *now* is
[`docs/ontology/CURRENT_STATE.md`](docs/ontology/CURRENT_STATE.md); where the
model is going is
[`docs/ontology/SSTIM_DIRECTIONS.md`](docs/ontology/SSTIM_DIRECTIONS.md). A fact
stated in one of them is not restated in another.

---

## Current Focus (update when focus shifts)

Phase 0 is complete; the repository is in Phase 1 with substantial Phase-2 work
already shipped. Release facts are derived from
[`void.ttl`](static/ontology/void.ttl) and
[`manifest.json`](static/ontology/manifest.json); what each release changed is in
[`CHANGELOG.md`](CHANGELOG.md). Cite the concept DOI
`10.5281/zenodo.21286974` across releases.

**Immediate:** outreach — Brain Innovation Days application by **15 Sept 2026** (extended from 1 Sept; extension reported by the maintainer 2026-09-03, not independently confirmed on the organiser's site).
Registry curation and independent human ontology review continue in parallel.

**Standing state.** The modular ontology architecture shipped, with namespace
catalogues, profile and schema routes, conformance contracts for Core, Core Plus,
and Full, and a separate Kernel discovery contract (ADR 0045); the registry
rules are merged and verified against the deployment. The
external live-only ecosystem store, loader, and private admission ledger are
operational, and the live aggregate carries the W3C CG and Æterni Anima records,
so persistent identifiers may be promoted in human-facing discovery. The unified
Graph navigator exposes the interlinked versioned catalog, live ecosystem, and
SSTIM terms. The public entrance shipped 2026-07-18 (four doors on `/`, browser
at `/graph`). Public BSC Lab data remains separate from the private
BioSynCare/BSC catalog.

**Ahead of schedule, from Phase 2.** The **Patch Studio** (real-time audiovisual
designer, four selectable audio engines, six audio voice types plus universal
tremolo, and 14 visual track types composed through one shared presentation
stage) now contains the **Sensory Field** starter family; `/field/*` remains only
as redirect compatibility for old bookmarks. Field-derived colour, depth, tree,
abstraction, and landscape tracks use the canonical patch model; pure adapters
offer non-destructive conversion with complete reports shown in Studio and
review acknowledgement when needed. Disabled sources remain inactive tracks,
and Add appends live with explicit keep/apply-stage choices. The legacy Field
implementation and its per-configuration `ExposureProfile` exporter remain in
source during the deprecation window. Canonical delivery sits behind the
photosensitivity safety layer. See
[`PATCH_STUDIO.md`](docs/technical/PATCH_STUDIO.md),
[`SENSORY_FIELD.md`](docs/technical/SENSORY_FIELD.md), and
[`PHOTOSENSITIVITY_SAFETY.md`](docs/technical/PHOTOSENSITIVITY_SAFETY.md).

**Integration status 2026-08-08.** First-class colour-field and spatial visual
tracks, the shared composition stage, Field starters, report-producing adapters,
recursive projection-loss accounting, `/field/*` history-replacing redirects, and the
removal of Field from global navigation are shipped. Inactive-source retention,
in-place Add/playback behavior, report
acknowledgement, explicit stage choice, vector spatial blend/topology, and static
versus dynamic SIRDS cadence are also shipped. Runtime/controller extraction,
exact trajectory/clamp fidelity and lifecycle proof, unified delivered-state
exposure export with producer-adjacent SHACL, the
full acceptance matrix, and legacy deprecation/removal remain open; see
[`PATCH_STUDIO_FIELD_INTEGRATION.md`](docs/technical/PATCH_STUDIO_FIELD_INTEGRATION.md)
and [ADR 0046](docs/decisions/0046-one-studio-two-authoring-modes.md). Headset/VR
and independent per-eye flicker remain future work.

**Still Phase 2, not to be built during Phase 1:** the `core/` orchestration
layer and the GPU visual/haptic engines. Phase 3 infrastructure likewise waits.

---

## 1. Reference Documents

Historical Phase-0 bootstrap inventory: these 31 reference files were planned
before software construction and are retained here as the original checklist.

### Already complete

### Reference documents (Phase 0 — committed)

### Generated artifacts (still to produce)

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
      `docs/ecosystem/DEFENSIVE_PUBLICATIONS.md` `P1`
      *Tracker file exists; receipts remain pending until the external
      submissions are actually filed.*

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
- [ ] Register the private BioSynCare/BSC preset catalog v0.9.1 as a corpus
      with INPI-BR `P1`
      *Note: ~R$150–200. Establishes timestamped authorship record.
      Important before catalog grows further. This is a BioSynCare legal/IP
      task, not a BSC Lab RDF publication task.*
- [ ] Contributor agreement with Riccardo Berti clarifying IP ownership
      of BioSynCare React Native codebase `P0`
      *Note: urgent — do before further BioSynCare commits. Simple
      work-for-hire clause or joint ownership declaration.*

### Registries
- [~] **Correct BioPortal's displayed release date after bundle stability lands** `P1`
      *The public submission list shows `0.16.0` as Released 2026-04-12 even
      though the frozen release declares `dct:issued 2026-08-18`. BioPortal's
      current metadata schema maps its `released` field from `dct:created` before
      `dct:issued`, and its extractor stops at the first populated mapping, so the
      column is showing SSTIM's truthful ontology creation date rather than the
      version's issue date. **The deterministic bytes were deployed and
      submission 28's pull/home/repository/source/docs/issues fields were moved
      to W3C-CG on 2026-09-01; the captured baseline is current ID 28 and 28
      rows.** The first nightly pull is expected to create one final transition
      row. Capture that new latest/current submission
      ID, wait through the following unchanged nightly pull, and confirm its ID
      and the row count do not change. Historical archived duplicates will
      remain. Then PATCH that captured `0.16.0` submission to 2026-08-18 and
      verify the displayed value;
      repeat the numbered post-deploy procedure in `REGISTRY_SUBMISSIONS.md` for
      each genuine release while preserving `dct:created` in SSTIM's metadata.*

- [~] **Confirm and, if necessary, correct BioPortal's current Version IRI** `P1`
      *The portal historically retained `https://w3id.org/sstim/0.14.0` after
      development bundles correctly omitted a version IRI. The deterministic
      frozen `0.16.0` artifact carries exactly
      `https://w3id.org/sstim/0.16.0`. **Authenticated API read-back confirmed
      that value on current submission 28 on 2026-09-01.** After the transition
      pull and subsequent
      unchanged-pull stability check, inspect the latest/current submission in
      the API and UI. If the field remains stale, correct that current row only,
      verify the displayed/resolved value, and preserve archived submissions as
      history. Repeat this check for each genuine release.*

- [x] **Automate the DBpedia KG Catalog release refresh** `P3`
      *[dbpedia/kg-catalog#53](https://github.com/dbpedia/kg-catalog/pull/53)
      was merged by @m1ci on 2026-09-03 (merge commit `4a345a03`), and both exit
      conditions have since been measured. The catalog bot promoted the W3C-CG
      0.16.0 distribution from `pending` to `active` 23 seconds after the merge
      (commit `630e960b`), and the Databus version `2026.08.18` now carries that
      file at 788555 bytes with the PR's sha256. The first scheduled daily run
      after the merge (`Daily KG Release Check` 33841539799, 2026-09-04) logged
      "SSTIM KG metadata is current at 0.16.0" and wrote nothing, so the updater
      is idempotent in production and not only in the pre-merge rehearsal. The
      catalog now tracks stable tags without a submission; see
      [REGISTRY_SUBMISSIONS.md](docs/ontology/REGISTRY_SUBMISSIONS.md).*

- [~] **Migrate BARTOC node 21154's mutable links and extent** `P2`
      *The live JSKOS record still carries the legacy docs/repository and July
      counts. The exact W3C-CG replacements and 0.16.0 extent were requested in
      [gbv/bartoc.org#319](https://github.com/gbv/bartoc.org/issues/319#issuecomment-5497720588)
      on 2026-09-01. The request preserves the node URI, W3ID identifier,
      concept DOI, and publisher field. Complete after a curator applies it and
      the public JSKOS API returns the new values.*

- [ ] **Migrate FAIRsharing record 8494's mutable links to W3C-CG** `P2`
      *The public record still exposes the legacy homepage. FAIRsharing edits
      require its signed-in SPA/API, and the available in-app browser runtime
      failed to start on 2026-09-01. In one authenticated edit, replace the
      homepage, Browse SSTIM URL/doc URL, and support docs/repository/issues;
      ensure the versioned whole-set download uses `sstim-namespace.ttl`, add
      the live BioPortal cross-reference, and preserve record 8494, its
      FAIRsharing DOI, the Zenodo DOI, and W3ID identity. Verify whether the
      intended BSC Lab maintaining-organisation link exists; if absent, add it
      without changing publisher identity. Exact values are in
      `REGISTRY_SUBMISSIONS.md`.*

- [x] **Correct the prefix.cc registration** — **done 2026-08-18**, hours after it
      was found. All four serialisations now serve `https://w3id.org/sstim#`,
      verified by `make registry-verify`. The hash URI was added as an
      alternative and voted above the slash one, which remains listed but
      outranked; prefix.cc serves the top-ranked URI, so the gate is what says
      whether it still wins. `P0`
      *Found 2026-08-18 by `make registry-verify`, the first time anything
      fetched it. Every term IRI a consumer builds from the registered prefix is
      wrong and 404s: `https://w3id.org/sstim/Preset` does not resolve. The
      tracker asserted the hash form and marked the entry DONE, so this had been
      wrong and unnoticed since before 2026-07-11.*

      *It needed a signed-in account, so Renato did it: "Add alternative URI" with
      `https://w3id.org/sstim#`, then voted it above the slash form.*

      *Note the site's TLS certificate expired 2025-12-31, so `https://prefix.cc`
      fails certificate validation and plain `http://` is the only way to read
      it. That is probably why nobody checked.*

- [ ] Get native review of the Italian, Portuguese and Spanish labels `P2`
      *All 551 concepts carry four languages, but the 276 labels written on
      2026-08-18 and the 6 written on 2026-08-19 were written by the maintainers
      and no native speaker has read any of them.*

      *`make language-coverage` now gates one mechanical property — a
      translation must not give two concepts the same label where English
      distinguishes them — and that found four real defects with no native
      speaker involved: `actionStoppedSession` colliding with
      `eventSessionInterrupt` in it/pt, `relatednessUnknown` with
      `reviewerUnknownRelationship` in pt/es, and `actionDeclined` reading
      "refused" in Portuguese for a concept about declining to answer. All are
      corrected. **This is not review.** It cannot see register, idiom, or a
      label that is simply wrong without colliding with anything.*

### Session model
- [ ] Add the minimum event bridge that lets a session timeline name what was
      presented `P2`
      *Measured 2026-08-22 and recorded in
      [`docs/ecosystem/HED_BIDS_INTEROP.md`](docs/ecosystem/HED_BIDS_INTEROP.md):
      every concept in `sstim-v:SessionEventTypeScheme` is a system, transport or
      session-lifecycle event, and `sstim:SessionEvent` carries four properties
      (`hasEventType`, `hasChangedParameter`, `parameterValueBefore`,
      `parameterValueAfter`), none of which can reference a stimulus, a channel
      or a specification. Of the four event families a HED projection needs,
      SSTIM has one: device and system. Stimulus-presentation,
      participant-response and contextual events are absent.
      `eventPlaybackStart` is transport control, not stimulus onset, and HED
      annotates occurrences of stimuli. This, not the timeline or the clock, is
      what blocks the **complete** event bridge. Mapping 0.5.0 now projects the
      eleven existing native event types and gates three synthetic bundles; it
      deliberately does not pretend this prerequisite is closed.*

      *The fix is deliberately **not** an event vocabulary. HED owns "what kind of
      occurrence was this", and duplicating the standard SSTIM chose in order to
      avoid duplicating it is the failure mode ADR 0025 names. The minimum is a
      relation from a `SessionEvent` to the thing presented, plus enough event
      types to discriminate a presentation from a participant response from a
      system occurrence. SSTIM supplies that something was presented, at time t,
      per this specification; HED supplies what kind of thing it was. Roughly two
      relations and a handful of types.*

      *Write the ADR before the terms. This changes published session semantics
      in a module that already ships with SHACL and a JSON-LD context, and three
      open questions below sit downstream of the same decision: the safety-event
      exposure boundary (module coupling), engine identity, and the shape of
      generated HED definition bodies, which is with the HED Working Group. Do
      not mint terms while that thread is open. Protected files under
      CLAUDE.md §3.4.*

- [x] Decide whether SSTIM needs a parameter-change session event type — **yes,
      shipped 2026-08-18**, the same day it was raised `P2`
      *`sstim-v:eventParameterChanged`, `sstim:StimulationParameterKind` with its
      five modality-neutral kinds, and the before/after value properties now
      exist, constrained by SHACL and exercised by the segmented demonstrator
      bundle. The design question below resolved to* both *rather than either:
      a discrete change the plan does not contain is an event; a modulation the
      specification already declares in full stays declarative and is rendered as
      a trace. That line lives in `sstim:hasChangedParameter`'s scope note so it
      binds future records, not just this ADR. Original reasoning kept below.*

      *Raised 2026-08-18 while building the modulated HED demonstrator. ADR 0025
      decision 5 allows a time-varying stimulus to be carried as **either**
      piecewise events **or** a linked trace. Only the trace was available:
      `sstim-v:SessionEventTypeScheme` has ten types — session and playback
      lifecycle, safety, observation — and none of them means "a parameter
      changed", so there is nothing to hang a breakpoint on.*

      *The constraint is ours, not HED's. A HED placeholder definition carries
      the piecewise form fine, verified with `hedtools` against 8.4.0 rather than
      assumed:* `(Definition/Sstim-breath-period/#, (Time-interval/# s))` *used as*
      `(Def/Sstim-breath-period/7.774, Inset)` *— both valid.*

      *So this is a genuine ontology question and deliberately not answered as a
      side effect of a demonstrator: does a session timeline want to record
      parameter changes as events, or is a declarative sweep plus a generated
      trace the right model? The trace has one clear advantage — it is derived,
      so it cannot disagree with the configuration — and one clear cost: a
      consumer reading only the events table sees nothing of the modulation.
      Protected file (CLAUDE.md §3.4). Worth carrying into the HED Working Group
      thread (question 5) before minting anything.*

- [ ] Decide whether an exposure boundary should be nameable on a safety event `P3`
      *Left open on 2026-08-18 while closing the one above. A
      `sstim-v:eventSafetyLimitApplied` event now carries the parameter kind and
      the requested and delivered values, which is most of what the crosswalk
      wrongly claimed it already held. What it still cannot say is **which**
      boundary applied — `sstim-ex:ExposureLimit` individuals exist, but linking
      to one means the session module depending on exposure, which today it does
      not (`dct:requires` names core, stimulus, common, configuration). That is a
      module-coupling decision, not a term, and it is recorded honestly in the
      crosswalk meanwhile: the boundary identity is held by neither side.*

      *Half of this is now settled upstream (2026-08-20). @yarikoptic's answer on
      hed-schemas#416 is that HED should carry the factual delivered value and
      not the protective intent, so the HED side of the question is closed: the
      boundary identity is correctly absent there and the crosswalk's declared
      loss is deliberate, not a gap. What stays open is only the SSTIM side, the
      module-coupling decision above.*

- [ ] Emit the BIDS Behavioral binding of ADR 0025 decision 3 `P3`
      *Historical measurement, 2026-08-18: wrapped in
      a minimal behavioral dataset, all three demonstrator bundles validate with*
      **zero errors** *under `bids-validator` 1.15.0. One warning is unfixable —
      `CUSTOM_COLUMN_WITHOUT_DESCRIPTION` for the `HED` column, because any
      sidecar entry named `HED` crashes the validator's HED parser; that is
      question 6 to the HED Working Group. Mapping 0.5.0 later removed the
      materialised `HED` column under the reviewed sidecar design, so this is not
      the layout currently generated.*

      ***Question 6 is answered and this warning no longer exists.** Retested on
      `bids-validator` 3.0.1 (2026-08-20): a top-level `HED` sidecar key is
      illegal rather than awkward, and `CUSTOM_COLUMN_WITHOUT_DESCRIPTION` is
      gone from 3.x, so the layout then under test validated with zero errors and no
      warnings. The sentence above is kept because it is what the decision was
      taken on, but do not requote it as current. The residue was a silent
      no-validation path in the validator, fixed upstream in
      [bids-standard/bids-validator#442](https://github.com/bids-standard/bids-validator/pull/442),
      merged 2026-08-27 and re-tested on merged `main` 2026-08-28.*

      *Two of the four warnings are the wrapper's, not ours, and go away with a
      real dataset: set `HEDVersion` in `dataset_description.json` — BIDS warns
      `HED_VERSION_NOT_DEFINED` without it, and our HED version lives only in
      `bundle-manifest.json`, which a BIDS consumer does not read — and write a
      README longer than a line. Re-measured 2026-08-18 with both in place:
      zero errors, and only `CUSTOM_COLUMN_WITHOUT_DESCRIPTION` left.*

      *Not emitted, for two stated reasons. Decision 3 gates the dataset on "a
      consented research use case" and there is none. And decision 7 requires a
      published binding to pass its validator, which means on every change:
      `bids-validator` 1.15.0 is 578 packages and 672 MB, too heavy for a
      `make validate` that runs in CI on every push. The modern Deno validator is
      the likelier route — `deno run -A jsr:@bids/validator` — and would mean
      adding Deno to `flake.nix`. Start there, not from scratch.*

- [ ] Decide whether SSTIM should name software engine identity `P3`
      *Raised 2026-08-18. `sstim-v:eventEngineFallback` records that delivery
      moved between engine implementations and nothing names which. The
      crosswalk claimed the engine pair was "SSTIM-only", which was false, and
      that claim is now withdrawn rather than made true — enumerating software
      engines looks like an implementation concern that a universal standard
      should not carry, but the reproducibility argument for recording it is
      real, since two engines are not sample-identical. HED question 4 remains
      open after the 2026-08-25 review; no ontology term was added merely to make
      the projection richer. Decide deliberately.*

- [!] Decide the shape of generated HED definition bodies `P3`
      *Blocked on the HED Working Group, asked 2026-08-21 on
      [hed-schemas#416](https://github.com/hed-standard/hed-schemas/issues/416),
      and still unanswered after the 2026-08-25 meeting. That meeting settled
      pause/resume and the sidecar shape but recorded no ruling on definition
      bodies. The 11-event follow-up was sent on 2026-08-28, but it did not ask
      the definition-body question, which remains open on the existing thread.*

      *@VisLab's critique, which we accept: the definitions we generate are event
      codes wearing a definition's clothes.*
      `(Definition/Sstim-delivery, (Sensory-event, Experimental-stimulus, Sensory-presentation))`
      *says little the event type did not. The ontology already holds modality,
      technique, frequencies and level, so a descriptive body is generatable and
      validates against 8.4.0:*
      `(Definition/Sstim-delivery-binaural, (Sensory-event, Experimental-stimulus, Auditory-presentation, Tone, Frequency/440 Hz, Repetitive, Temporal-rate/10 Hz))`

      *The decision is which HED intends: definitions that describe the actual
      stimulus, making each dataset self describing at the cost of
      `Def/Sstim-delivery` denoting something different in every one, or
      definitions that stay stable across datasets with the varying description
      carried on the events. Our instinct is the first for whatever is constant
      within a session and the second for whatever changes during it, but that is
      a guess, and it runs into the comparability point VisLab raised. Do not
      regenerate the definitions until this is answered. Recorded in
      [ADR 0025](docs/decisions/0025-hed-bids-interoperability-crosswalk.md).*

### Ontology namespace
- [~] **Make `https://w3id.org/sstim` resolve to a release, and legible to a person** `P1`
      *[ADR 0055](docs/decisions/0055-namespace-iri-resolves-to-a-release.md),
      accepted 2026-08-29. Six items. The order below is normative: the w3id
      change comes last because it is the only production-visible step and it
      depends on both the namespace page and `latest/` already being deployed.*

      *Measured 2026-08-29 against the live routes, after the `w3c-cg` cutover.
      `Accept: text/turtle` on `/sstim` serves `sstim-namespace.ttl` built from
      the working tree: `owl:versionInfo "0.17.0-dev"`, `mod:status "under
      development"`, and no `owl:versionIRI` at all, where frozen `/sstim/0.16.0`
      has one. `Accept: text/html` serves the four-door entrance, which never
      says the visitor followed a namespace IRI. Both WIDOCO (`/ontology/docs/`)
      and pyLODE (`/ontology/docs/vocab/`) answer 200 and neither is linked from
      the landing.*

      - [x] 1. Add an "About this graph" section to the graph `?` dialog
            (`src/ui/navigation/AppTopBar.svelte`, currently eight keyboard
            shortcuts and nothing else): what the graph is, that node IRIs are
            dereferenceable persistent identifiers, the namespace, how to fetch
            Turtle or JSON-LD, links to WIDOCO, pyLODE and SPARQL.
      - [x] 2. In the graph node panel, relabel the Docs row so it names its
            source ("Reference entry (WIDOCO)", "Vocabulary entry (pyLODE)") and
            add a sibling link to the Turtle module that defines the term.
            `docsUrlForIri` and the panel are
            `src/ui/graph/OntologyGraph.svelte:1532` and `:2419`. An RDF browser
            that offers HTML documentation and no RDF is the gap being closed.
      - [x] 3. Add the arrival banner, in two stages, the first rendering
            **beside the loading panel** rather than after it (Renato,
            2026-08-29: building the graph is several seconds of uninterruptible
            force layout, so the loader is exactly when the visitor needs the
            explanation). Stage one is a pure `PREFIXES` lookup and is available
            on arrival; stage two waits for the graph, because
            `resolveHashToNodeId` returns null until `allElements` is populated
            (`OntologyGraph.svelte:1440`). If the fragment does not resolve, say
            so rather than hiding the banner.
      - [x] 4. Add the `/namespace/` route: namespace and current release, the
            content negotiation table with real URLs, the IRI families that
            belong to SSTIM, links to WIDOCO, pyLODE, snapshots and the browser,
            and the same non-door fragment forward to `/graph/` that
            `src/routes/+page.svelte:111-113` already does. Not `/ontology/`,
            which collides with the static Turtle directory and WIDOCO.
      - [x] 5. Publish the newest snapshot at `latest/` and export its JSON-LD
            and RDF/XML there. `make publish-latest`, run from `pages.yml` after
            `make export`: `scripts/publish-latest-ontology.mjs` copies,
            `scripts/export-ontology.py --source-dir` exports, and a `--verify`
            pass checks the Turtle came through byte-identical.
            *Built into `dist/` only, not `static/`, which is a change from what
            the ADR first said. A committed copy can drift from the snapshot it
            claims to mirror; deriving it every build removes that failure mode
            instead of adding a `truth-audit` gate to catch it. The ADR was
            updated to match. Two guards remain because both failures are silent:
            the publish refuses if the newest snapshot and `releaseMetadata.js`
            name different versions, and the verify pass catches the export's
            catalogue concatenation drifting from `make snapshot`'s (measured
            2026-08-29: byte-identical today).*
            *Exports stay generated, never committed: `make export-check` already
            proves them isomorphic to the Turtle, so freezing them would triple
            every snapshot forever for derivable bytes. Verified 2026-08-29 that
            snapshots are Turtle only (`/ontology/0.16.0/sstim-namespace.jsonld`
            answers 404).*
      - [x] 6. Repoint the four `^$` rules in
            `docs/ecosystem/w3id/sstim/.htaccess` at `latest/` for Turtle,
            JSON-LD and RDF/XML and at `/namespace/` for HTML, update
            `scripts/w3id-negotiation.test.mjs`, run `make w3id-routes`, then one
            upstream pull request using the w3id template. A stable `latest/`
            path rather than a versioned one, so this stays a one-off and a
            release still costs no w3id PR (ADR 0053).
            ***The repository mirror, its three gates and the negotiation test are
            done. The upstream PR against `perma-id/w3id.org` is the one step
            left, and must not go up until the deploy carrying `/namespace/` and
            `latest/` is live: the rules point at both.***
- [?] Decide whether the `implementation/bsclab/` IRI family stays as it is `P2`
      ***Disposition 2026-08-27: leave it as is for now.*** *Renato decided this
      after the measurements below. Nothing changes: no IRI moves, no route is
      retargeted, no prefix is retired. What stays open is only the narrow
      question at the end, whether records minted later should use a
      Workbench-scoped path, and it does not need answering until something is
      actually minted under a new family.*

      *Raised 2026-08-25, when the citation title was renamed from BSC Lab to
      SSTIM Workbench. That rename was scoped to the public application name and
      deliberately touched no identifier, which leaves a question rather than a
      decision: the published data sits under
      `https://w3id.org/sstim/implementation/bsclab/{preset,experiment,evidence,session,annotation,component}/...`
      while the software that produces it is now presented as SSTIM Workbench.*

      *Measured 2026-08-25 with `make locate` rather than one grep, because this
      family lives in five places and no single search sees more than two of
      them:*
      - *committed instance data under `static/ontology/instances/**`, roughly
        300 `evidence` local names, 20 `experiment`, 6 `preset`, 5 `protocol`,
        4 `component`, 2 `session`;*
      - *`src/rdf/namespaces.js`, which exports seven `BSCLAB*` namespaces and
        the `bsclab`, `bsclab-preset` and `bsclab-evidence` prefixes;*
      - *live w3id routes for `/sstim/implementation/bsclab`,
        `.../component/patch-studio` and the two seed presets, live since
        2026-08-17 (PR #6561);*
      - *the live ecosystem store, which answers for these IRIs too, so this is
        published data and not merely a repository fact;*
      - ***eleven frozen snapshots**, 0.6.0 through 0.16.0, which carry
        `bsclab-evidence:...` CURIEs inside `skos:editorialNote` prose. Those
        releases are immutable. Renaming without keeping the old routes
        resolvable would strand pointers inside eleven citable releases.*

      *The default answer is **keep**, and the burden is on any argument to
      change it. CLAUDE.md §1 and the migration decision both say existing
      BSC/BSC Lab RDF identities are not mechanically renamed, and persistence
      beats prettiness: `bsclab` names the implementation that produced the
      records, which stays true after the application is presented under a new
      name. The only part genuinely worth deciding is whether records minted
      **from here on** should go under a Workbench-scoped path, which buys
      cosmetic consistency and costs two families to route, explain and keep
      resolvable forever.*

      *Do not settle this inside the origin cutover below. That change moves
      where the routes point; this one would change what the IRIs are. Doing
      both at once makes a failed redirect impossible to attribute.*

- [x] Cut the production w3id routes over from `labiosyncare.github.io` to
      `w3c-cg.github.io/sstim` — **done 2026-08-27** `P1`
      *[w3id PR #6609](https://github.com/perma-id/w3id.org/pull/6609) merged as
      `e7416b7`. Live HTML and RDF negotiation now target the W3C-CG project
      publication; the stable ontology URI, namespace, and version IRIs did not
      change. All route gates passed, the new-origin target families answered,
      and frozen manifests whose root-absolute paths require the legacy
      origin-root publication retained their explicit exceptions. The checked-in
      `.htaccess` remains the repository mirror of the upstream rules, and the
      reverse staged harness preserves the rollback proof. User origin-transition
      instructions shipped before the cutover.*

- [~] Extend the existing `https://w3id.org/sstim` namespace rules for the BSC
      framework and implementation instances under `/framework/bsc`,
      `/implementation/bsclab/{preset,session,annotation,evidence}/...`, and
      public-safe `/implementation/biosyncare/...` identity/metadata paths if
      they are ever published `P1`
      *Exact audited rules are live for the BSC framework, BSC Lab, the public
      BioSynCare application identity, and the Patch Studio component. The
      **preset and reference** routes went live 2026-08-17 in w3id PR #6561,
      after sitting prepared-but-unsubmitted through two earlier PRs — both IRI
      families answered 404 in the meantime. **Session, annotation and evidence
      routes remain**, and each needs its subject to be publicly resolvable
      before it is worth routing. Versioned snapshot routes are no longer part
      of this task at all: [ADR 0053](docs/decisions/0053-wildcard-snapshot-routes.md)
      made them four patterns covering every release, cut or not.*
      *No second top-level w3id namespace. Keep room for future
      `/technique/{id}/`, `/protocol/{id}/`, `/framework/{id}/`,
      `/implementation/{id}/`, `/organization/{id}/`, and `/specialist/{id}/`
      data under SSTIM. Do not publish or route the private BioSynCare/BSC
      catalog from BSC Lab.*
- [x] Publish user transition instructions for the two published origins —
      **shipped 2026-08-27** at `/transition/` `P1`
      *`src/routes/transition/+page.svelte`, linked from Settings beside the
      export buttons and from the About page's link list. It names both
      addresses, gives the export/restore steps, separates what travels from
      what does not, and says plainly that an installed app belongs to the
      address it was installed from and no export can include it. The
      appearance-preference uncertainty below is handled without exposing it:
      the page says to set it again if it does not come across.*

      *Original note kept below. Do this before any redirect or
      archival of the old origin. Browser-stored data is keyed to the origin, so
      `labiosyncare.github.io` and `w3c-cg.github.io` hold separate copies of
      every logbook, annotation, patch, profile and preference. Nothing moves on
      its own.*
      *The data path already works and was browser-tested across both origins on
      2026-08-23: Settings exports a `bsc-lab-instance-export-1` envelope
      covering logbooks, annotations, patches, profile and preferences, and
      Settings on the other origin restores it. What is missing is a page that
      tells people to do it, and a link to that page from both sites.*
      *The installed app is a separate matter and cannot be exported. A PWA
      installation is per-origin state owned by the browser and the operating
      system: there is no web API to read it, move it, or recreate it, and
      `getInstalledRelatedApps` only reports whether one exists. So the
      instruction is to install again from the new origin and then export and
      import the data, which does carry across. Say that plainly rather than
      implying the installation follows.*
      *~~One field is not yet proven to survive: the `skin` preference.~~
      **Resolved 2026-08-27 by reading both ends rather than re-running the
      browser test.** `applyInstanceExport` writes `bsclab.skin` into the target
      storage, proven by the cross-instance round trip in
      `src/portability/instanceExport.test.js`; `initSkin` reads that key and
      `normalizeSkinId` keeps any id the build knows
      (`src/ui/theme/skins.js`). So a restored known skin is applied on the next
      load. What the 2026-08-23 browser test could not isolate was the read, not
      the write, and the read is unconditional. The one case that does normalise
      away is an id this build does not have, which is correct rather than a
      defect: the import validates that `skin` is a non-empty string, not that it
      names a skin that exists here.*
- [ ] Generate namespace catalogs for `vocab#` and `ecosystem#`, and point their
      RDF representations at them `P1`
      *A namespace that spans modules needs a generated catalog; that is why
      `sstim` and `exposure` have one. Measured 2026-08-23: `vocab#` is defined
      across vocab, alignments and technique-exposure, and `ecosystem#` across
      ecosystem, shapes and ecosystem-private-shapes, yet `/sstim/vocab` returns
      `sstim-vocab.ttl` alone. The terms defined elsewhere are absent from the
      document that claims to describe the namespace, and nothing marks the
      answer partial. Generate both the way `sstim-exposure-namespace.ttl` is
      generated. See the two-defects section in
      [`docs/ontology/PUBLICATION_AND_INTERLINKING_PLAN.md`](docs/ontology/PUBLICATION_AND_INTERLINKING_PLAN.md).*
- [ ] Add local-name anchors to the generated documentation `P1`
      *WIDOCO anchors by full IRI, pyLODE by label, so no term IRI has ever
      landed on its own entry in the documentation, in any namespace. The
      browser route added on 2026-08-23 fixes this for the four namespaces that
      can use it; `shapes#` and `core-shapes#` cannot, because SHACL shapes are
      not drawable nodes. `scripts/fix-widoco-links.mjs` already post-processes
      WIDOCO output and is where the `id` aliases belong; pyLODE needs the
      equivalent. This is the real fix for the shape namespaces.*
- [~] Register `sstim:` and scoped prefixes such as `bsc-fw:`,
      `bsclab-preset:`, and public-safe implementation prefixes at
      https://prefix.cc `P1`
      *`sstim:` → `https://w3id.org/sstim#` is registered. Remaining registry
      submissions are tracked in `docs/ontology/REGISTRY_SUBMISSIONS.md`.*

---

## 3. Ontology and Vocabulary

### Phase 0 (done above in documents section)
Turtle files are listed in section 1. After they exist:

### Phase 1 validation and publication
- [~] Derive the VoID/DCAT record from the manifest `P1`
      *The release-critical half shipped in the modular release and holds in
      every release since: `void.ttl` carries one
      subset per frozen module, uses the correct Kernel and Exposure access
      endpoints, and the quality audit checks it against the frozen manifest.
      The **counts** are now generated rather than hand-edited —
      `scripts/void-counts.py` computes triples/classes/properties from the live
      modules the manifest names, and `release-prepare` writes what it returns,
      so the audit's authority and the release's numbers have one implementation
      between them. What remains hand-maintained is the **subset block**: a new
      module still needs its `void:subset` and distribution written by hand, and
      the audit catches its absence rather than the manifest supplying it.*

- [~] `robot --strict` cannot load the closure — **diagnosed; upstream OWL API
      bug, not an SSTIM defect** `P3`
      *Investigated 2026-08-18 with a direct OWL API probe
      (`OWLOntologyLoaderConfiguration.setStrict(true)`) plus greedy subject
      minimisation, after ROBOT proved unable to surface a usable message —
      both Turtle parsers report empty error text, and the `error#ErrorN`
      counter is a parser-attempt index, not an entity count.*

      **Three independent triggers, each minimised to one subject and then
      reproduced in a six-line file containing no SSTIM content:**

      | Construct | Strict parser |
      |---|---|
      | Two or more `owl:Ontology` headers in one document | rejected — *"Expected one ontology declaration, found multiple ones"* |
      | `rdfs:domain [ owl:unionOf (…) ]`, any property type, typed bnode or not | rejected |
      | `rdfs:range [ a owl:Class ; owl:unionOf (…) ]` | rejected |
      | `rdfs:range [ owl:unionOf (…) ]` — same, without the redundant type | **accepted** |
      | plain named-class domain or range | accepted |

      *The first is an artifact of assembling the closure with `cat`; `robot
      merge` produces a single header and removes it. The other two are ordinary
      OWL: a union domain is **valid OWL 2 DL**, and ROBOT's own
      `validate-profile` — the same OWL API — confirms every closure is in the
      DL profile. **OWL API's strict parser therefore rejects what OWL API's
      profile validator accepts**, which is where the bug lives.*

      **Decision: do not contort the ontology to satisfy it.** The union domains
      on `sstim:hzMin`/`hzMax` were introduced deliberately by ADR 0052 and are
      the correct model; the union range on `sstim:hasStimulationTarget` is the
      point of that property. Dropping the redundant `a owl:Class` from the 53
      anonymous class expressions would fix one trigger of three and is not
      worth the churn on its own.

      *Practical risk is low and was over-stated when this item was filed.
      Strict mode is opt-in and rare; every default path works. Pellet/Openllet
      loads the live graph through Jena and answers `Consistent: Yes`, ROBOT's
      default parsing is non-strict, and rdflib, pySHACL and Comunica are
      unaffected. Nothing we run or publish depends on it.*

      **Remaining work is upstream, not here:** report to `owlcs/owlapi` with the
      six-line reproduction. Optionally assemble the published closure with
      `robot merge` rather than `cat`, which is defensible independently — one
      ontology header is better hygiene for any OWL consumer.

      *Probe harness kept in the ADR 0054 discussion rather than committed: a
      `pom.xml` depending on `net.sourceforge.owlapi:owlapi-distribution:4.5.29`
      and a 25-line `StrictProbe.java` that prints the Turtle parser's real
      exception. Two seconds per run versus ROBOT's eight, which is what made
      minimisation affordable.*

- [~] Watch OLS4 PR #1351, then bump `ontology_purl` at every release `P2`
      *[EBISPOT/ols4#1351](https://github.com/EBISPOT/ols4/pull/1351) adds SSTIM
      to `ebi_ontologies.json` on `dev`. Commit `258c2a51`, pushed 2026-09-01,
      moves its homepage to W3C-CG and bumps the frozen ontology from historical 0.15.0 to
      0.16.0; the reviewer was notified in the PR. On merge,
      confirm <https://www.ebi.ac.uk/ols4/ontologies/sstim> resolves and record
      it in `REGISTRY_SUBMISSIONS.md`.*

      ***Then it becomes a per-release chore.*** *The entry pins the frozen
      snapshot — `…/ontology/0.16.0/sstim-namespace.ttl` — on purpose, because
      the unversioned path serves the mutable `-dev` line and this project does
      not advertise that as a release. So each release needs a one-line follow-up
      PR bumping the version in that URL, or OLS keeps serving the previous one.
      The PR description offers EBI a rolling URL instead if they would rather
      have fewer PRs; if they accept, this item disappears.*

- [~] Post the ShowVoc enquiry once admitted to the VocBench group `P2`
      *Drafted and committed at
      [`docs/ontology/outreach/2026-08-18-showvoc-enquiry.md`](docs/ontology/outreach/2026-08-18-showvoc-enquiry.md).
      Membership requested 2026-08-18; awaiting moderation. Must be posted by a
      human — the documented support channel is
      [`groups.google.com/g/vocbench-user`](https://groups.google.com/g/vocbench-user)
      with a `[ShowVoc]` subject prefix, and a Google Group cannot be posted to
      from tooling, unlike every other registry contact so far.*

      *It asks whether the EU Publications Office instance accepts datasets from
      outside the EU institutions, whether the in-app contribution flow is the
      route, and whether a community instance would suit better. Record the
      reply in `REGISTRY_SUBMISSIONS.md` under the ShowVoc entry — and do not
      submit anything there before the reply arrives, which is the point of
      asking.*

### Phase 1 instances
- [~] Convert cleared public references to RDF in
      `static/ontology/instances/references/` `P1`
      *Seven records are present; expand only with source and venue review.*

### Phase 2 ontology extensions
- [ ] Record recognized **named methods / schools** (Snoezelen / MSE, Tomatis,
      Bérard AIT, Ayres Sensory Integration, vibroacoustic therapy, sound baths,
      …) as a neutral, evidence-scoped catalogue `P2`
      *Gap identified 2026-07-14: SSTIM records mechanistic techniques but no
      externally-named methods/schools. Modeling options + recommendation
      (Option C: a `NamedStimulationMethod` catalogue) and a seed inventory are
      in [ADR 0030](docs/decisions/0030-named-methods-and-schools.md) (Proposed).
      Touches protected term files → needs approval; effect claims stay
      evidence-scoped per [ADR 0027](docs/decisions/0027-evidence-claim-family-and-public-claim-gate.md).*
- [~] Ecosystem agents (specialists, orgs, labs, research groups) `P2`
      *Design + governance decided in ADR 0024: neutral umbrella
      `sstim-eco:EcosystemAgent` (⊑ `prov:Agent`); reuse schema.org/ORG/FOAF +
      ROR/ORCID/Wikidata; "stakeholder"/"contributor" are relationshipType
      values, not the class; organization notify-and-honor plus
      relationship-scoped self-publication/consent for named people; instance
      IRIs at `/organization/{id}` & `/specialist/{id}`, never in the term
      space; live-only by default with a consent-gated archival tier. Real
      live-only records must be served from a mutable store outside this
      Zenodo-tracked release repository; committed fixtures remain synthetic.
      ADR 0031 and change-set F stages F1–F2 are released in
      `0.7.0`: qualified relationship/engagement, ORG membership,
      implementation responsibility, a retractable approved public projection,
      separate private-ledger validation policy, closed artifact profile, executable
      admission state, and synthetic/adversarial fixtures. F3's mutable external
      projection, optional browser loader, VoID declaration, private Firestore
      ledger, retention/removal runbook, and private-first publisher are now
      operational. The enriched F4 aggregate is live-only and atomic, with
      separate sourced or explicitly self-attested, approved person/organization
      relationships. The exact real w3id
      routes are staged locally but still need their
      upstream merge and live verification. Human-readable discovery is now
      implemented in the unified Graph navigator; dedicated profile pages and
      canned competency queries remain optional. Replace the temporary
      leadership self-attestation exception with a canonical official-page or
      immutable-profile source when one is published. New organization records
      are not admitted without a verified
      curator in the same aggregate; later memberships and
      responsibilities are separately self-approved or scoped-consent. Neither
      the public aggregate nor its private history is committed here. The
      canonical sequence is Workstream 5
      of [`ECOSYSTEM_INTEGRATION.md`](docs/ecosystem/ECOSYSTEM_INTEGRATION.md#workstream-5--stakeholder-ecosystem-rdf-module-adr-0024-implementation). Session v2 is not a dependency.*
- [?] Extend external alignments only when an authoritative target is verified
      and the mapping answers an interoperability need `P2`
      *An unverified Music Ontology association and the incorrect MeSH D012910
      candidate were removed in the 0.6 development pass.*

### Wikidata contribution

*Staged plan with per-stage gates:
[`docs/ontology/WIKIDATA_CONTRIBUTION.md`](docs/ontology/WIKIDATA_CONTRIBUTION.md).
Stage 0 — multilingual labels and references on existing items — has no gate and
is unblocked today; the Phase 4 deferral in `REGISTRY_SUBMISSIONS.md` governs
publishing SSTIM into Wikidata, not contributing to it.*

- [ ] Create one Wikidata item for the released SSTIM ontology after WIDOCO and
      stable landing-page publication `P1`
      *Gate met: WIDOCO output ships from CI and `w3id.org/sstim` resolves in
      four formats. Needs a decision, not more work.*
- [ ] Add reciprocal Wikidata mappings only for released terms whose identifiers
      and equivalence have been checked against the live authoritative record
      `P1`
- [ ] Extend `skos:altLabel` coverage — **15 labels on 8 of the 551 concepts**, all
      English `P2`
      *Raised 2026-08-01 while checking how Wikidata's term fields map to RDF.
      Wikidata emits a label as `rdfs:label` + `skos:prefLabel` + `schema:name`,
      and an alias as `skos:altLabel`. SSTIM and Wikidata therefore agree exactly
      on `skos:prefLabel`, which makes them directly comparable. Reconciliation
      and entity-linking tools (OpenRefine, Wikidata search, generic matchers)
      resolve strings against prefLabel *and* altLabel, so for all but eight
      concepts a match succeeds only on the exact prefLabel in one of the four
      languages.
      Nothing resolves "isochronic tones" to `techIsochronicTones` ("Isochronic
      Tone Stimulation"), "monaural beats" to `techMonauralBeats`, or "gated
      pulse train" to either. This is a usability gap for other people's tooling,
      and it is the cheap half of interoperability. Protected file (CLAUDE.md
      §3.4): needs explicit instruction and per-term review.*

      *Restated 2026-08-18 after measuring it. This said "currently **zero**" and
      "**no `skos:altLabel` at all**" from 2026-08-01 until then, and by then it
      was false in this repository's own accepted record:
      [ADR 0049](docs/decisions/0049-neural-oscillations-and-frequency-ambits.md)
      added the oscillation aliases on 2026-08-15 and says in its own text that
      it "begins closing the `skos:altLabel` gap". Six oscillation concepts carry
      "alpha rhythm" / "alpha waves" and their siblings, and `audioNoiseBrownRed`
      and `audioNoiseVioletPurple` carry noise-colour aliases. So "alpha rhythm"
      does now resolve, which is why that example left the list above. A
      sixteenth alias, "Patch" on `sstim:Preset`, is on an OWL class rather than
      a concept, which is why `make language-coverage` reports fifteen: it counts
      concepts in schemes. Both numbers are right about different questions —
      name which one you mean. The claim had propagated into
      `CURRENT_STATE.md`, `IMPROVEMENT_PLAN.md` and `REGISTRY_SUBMISSIONS.md`,
      the last of which was about to declare an empty synonym field to a
      registry — and all three of those sentences were written on 2026-08-18,
      three days after the aliases landed and in the same days' work as §3.6
      itself. `make language-coverage` now reports the count, so the number has a
      command behind it rather than a memory.*
- [?] Create items for project-specific techniques only after independent
      published sources establish notability `P2`
- [?] Edit related Wikipedia articles only after independent sources support
      the contribution; do not use Wikipedia to establish SSTIM notability `P2`

---

## 4. Software — Phase 1 (BSC Lab v0.1 Knowledge Browser)

Do not start these until all Phase 0 documents are committed.

### Project scaffold
- [ ] Configure Svelte 5 MCP server for AI tooling `P1`
      `npx @sveltejs/mcp` — add to `.cursor/mcp.json`
- [~] Configure Vite/SvelteKit runtime headers and future PWA/WASM plugins `P1`
      *Done: COOP/COEP in `vite.config.js` and `static/_headers`. Pending:
      WASM/PWA plugin additions when those features land.*
- [ ] Add pre-commit hook: Turtle syntax check + JSON preset schema
      validation `P1`

### RDF layer
- [–] `src/rdf/store.js` — **absorbed into `loader.js`**, which already exports
      `parseIntoStore`, `loadMerged` and `mergeStores`. A separate module would
      add an indirection with no second caller.
- [ ] `src/rdf/validate.js` — rdf-validate-shacl in browser `P1`
- [ ] `src/rdf/export.js` — serialize public BSC Lab preset instances to JSON
      for BSC Lab runtime use, serialize annotations as Turtle `P1`
- [~] `src/rdf/annotations/AnnotationStore.js` — named graph per node,
      Firebase Auth/Firestore persistence `P1`
      *Initial env-gated Firebase backend exists. Local IndexedDB fallback and
      bulk annotation export UI are still pending.*

### UI — Preset browser
- [~] `src/routes/presets/+page.svelte` — SPARQL query for all presets,
      filter by group / frequency band / evidence tier `P1`
      *Initial table over committed RDF seed instances exists. Dedicated
      reusable browser component can follow as public reference presets grow.*
- [ ] `src/ui/browser/ProtocolCard.js` — display preset metadata,
      voice architecture summary, evidence tier badge `P1`
- [ ] `src/ui/browser/EvidencePanel.js` — show evidence chain:
      preset → claims → references → public-safe flag `P1`

### UI — Ontology graph
- [ ] `src/ui/graph/EvidenceChainView.js` — force-directed graph of
      a single preset's evidence chain `P1`

### UI — Annotation
- [ ] Install CodeMirror 6 with Turtle syntax support `P1`
      `npm install @codemirror/view @codemirror/state codemirror-lang-turtle`
- [~] `src/ui/annotation/AnnotationPanel.svelte` — text editor in ontology
      detail panel, target node selector, save to AnnotationStore `P1`
      *Basic textarea UI exists. CodeMirror Turtle editor remains pending.*

### UI — SPARQL interface
- [~] SPARQL route — textarea editor, lazy-loads Comunica, executes SELECT query `P1`
      *Dedicated CodeMirror component still pending.*
- [ ] `src/ui/sparql/ResultsView.js` — render bindings as table,
      CONSTRUCT results as graph `P1`

### Deployment
- [ ] Optional Netlify/custom-domain deployment: `lab.biosyncare.com`
      (CNAME at Keliweb) `P2`
      *Deferred until BSC Lab needs COOP/COEP headers for WASM threading,
      server-side APIs, or custom-domain product positioning.*

---

## 5. Software — Phase 2 (BSC Lab v0.2 Stimulation Player)

**Do not start until Phase 1 is complete and deployed.**

### UI — Public entrance (`/` + `/graph`)
**Shipped 2026-07-18.** Spec: [`docs/technical/PUBLIC_ENTRANCE.md`](docs/technical/PUBLIC_ENTRANCE.md).
- [ ] Optional follow-up: create the `protocol-proposal` GitHub label
      referenced in the new issue template's frontmatter `P3`

### Engine interfaces and implementations
- [–] `src/engines/audio/ToneJsEngine.js` — **abandoned.** Four engines already
      exercise the interface; a Tone.js wrapper adds a dependency without
      proving anything the WASM engine does not.
- [ ] `src/engines/visual/IVisualEngine.js` `P2`
- [ ] `src/engines/visual/PixiJSEngine.js` — PixiJS v8, WebGPU/WebGL `P2`
- [ ] `src/engines/visual/CSSEngine.js` — CSS animations fallback `P2`
- [ ] `src/engines/haptic/IHapticEngine.js` `P2`
- [ ] `src/engines/haptic/VibrationApiEngine.js` `P2`
- [ ] `src/engines/haptic/NullHapticEngine.js` — silent fallback `P2`

### AudioWorklet processors (in static/worklets/, never bundled)

### Core orchestration
- [ ] `src/core/MasterClock.js` — wraps AudioContext.currentTime,
      provides `now()`, `scheduleAt(t, fn)` `P2`
- [ ] `src/core/SessionScheduler.js` — Web Worker, 25ms lookahead,
      posts timing state to main thread `P2`
- [ ] `src/core/StimulationOrchestrator.js` — wires audio + visual +
      haptic engines via interfaces only `P2`
- [ ] `src/core/ProtocolRunner.js` — maps preset JSON to engine calls `P2`
- [~] Session recording — the **contract and recorder shipped 2026-08-13** as
      `src/session/` (schema, `openSession()`, RDF projection with generated loss
      accounting, four golden cases, `make session-contract`). It records against
      the engine timing context and produces a validated bundle. What is still
      missing is the *caller*: nothing in the app opens a session yet, because
      that needs the preset player below. Not `src/core/SessionRecorder.js` — the
      recorder holds no storage and is not part of the orchestrator. `P2`

### UI — Player
- [ ] `src/ui/player/SessionPlayer.js` — play/pause/stop/seek,
      duration display, live parameter readout `P2`
- [ ] `src/ui/player/EngineSelector.js` — switch audio/visual engine
      live during session (key research feature) `P2`
- [ ] `src/ui/player/ParameterDisplay.js` — real-time frequency,
      breathing period, entrainment target display `P2`

### UI — Patch Studio (`src/ui/creator/`)
The real-time audiovisual designer shipped ahead of schedule (see Current Focus,
May 2026). Spec: [`docs/technical/PATCH_STUDIO.md`](docs/technical/PATCH_STUDIO.md).
The improvement backlog below is grounded in that spec's §10 and gated by
[ADR 0026](docs/decisions/0026-patch-studio-catalog-bridge.md).


**Mandatory Sensory Field integration (highest priority — ADR 0046)**
- [ ] Extract the Studio runtime/controller lifecycle from `PresetCreator.svelte`
      without creating a second clock, transport, store, or safety authority `P2`
- [ ] Prove exact legacy behavior and saved-state lifecycle parity across all four
      adapters, especially marker trajectory and one-sided depth clamping,
      offline/static routing, and repeated import/acknowledge/accept/decline flows `P2`
- [ ] Derive configuration and one unified delivered-state `ExposureProfile`
      from canonical tracks, then run real producer-adjacent SHACL validation;
      do not treat loss reporting as conformance `P2`
- [ ] Pass the integration acceptance matrix (build/check/tests, focused model,
      adapter and projection suites, keyboard/accessibility, safety, visual/audio
      fidelity, direct-route/static-host, persistence and lifecycle gates) `P2`
- [ ] Deprecate and remove the duplicate Field runtime/persistence only after the
      compatibility window and the preceding fidelity/lifecycle gates pass `P2`

**Optional catalog compatibility (after the merge and neutrality decision gate —
PATCH_STUDIO.md §11.1, ADR 0026)**
- [ ] Define the generic export-adapter result and reconcile a version-pinned BSC
      catalog contract; proceed only under
      [`PATCH_STUDIO_CONFORMANCE_AND_NEUTRALITY.md`](docs/ecosystem/PATCH_STUDIO_CONFORMANCE_AND_NEUTRALITY.md)
      `P2`
- [ ] `src/ui/creator/patchToBscCatalogPreset.js` — convert the declared mappable
      subset of a patch (`BinauralBeat→Binaural`,
      `Permutation`+`IsochronicTone→Symmetry`, breathing `LFO`-modulated
      carrier→`Martigli`/`Martigli-Binaural`) to catalog `header`+`voices`;
      report blocked/transformed/unsupported tracks, never silently drop `P2`
- [ ] Metadata-authoring panel for the required `header` fields
      (`group`, `targetBand`, `evidenceTier`, `cautionTags`, multilingual
      `desc*`/`med2*`/`techDesc*`, `headphonesMode`, …); no auto-derived
      evidence/claims (`CLAUDE.md` §3.5) `P2`
- [ ] Add the currently missing `schemas/preset.schema.json`, validate locally,
      obtain version-pinned BioSynCare consumer-contract acceptance, then—under
      separate public-data approval—emit any BSC Lab reference preset/RDF
      instance; private catalog data stays outside this repository `P2`

**Decompose the monolith (PATCH_STUDIO.md §11.2)**
- [ ] Extract `src/ui/creator/patchTransport.js` (engine lifecycle + `rafTick`,
      preserving the `AudioContext.currentTime` clock authority); required by
      integration Milestone 1 `P2`
- [~] Shared visual composition and the reusable `SceneStage` path now render the
      Field-derived track types with vector blend, first-spatial-position
      topology, and clock-gated/8-fps SIRDS behavior; a renderer registry and the
      remaining runtime extraction are still open `P2`
- [ ] Split out Patch Studio subcomponents (cloud menu, help overlay,
      semantic-info panel, mix stage, track card) `P2`

**Tests (PATCH_STUDIO.md §11.3)**

### RDF pipeline
- [ ] `src/rdf/export.js` — optionally generate a public BSC Lab preset JSON
      bundle for the local player `P2`
- [ ] CI pipeline step: validate all public ontology instances → export BSC Lab
      runtime JSON if enabled `P2`

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
      backend technology TBD in Phase 3. Firebase Auth is the leading
      candidate for login if private/cross-device state becomes necessary;
      evaluate Firestore or another sync backend at that point. `P3`

---

## 7. Community and Ecosystem

### Immediate — before any public launch
- [ ] Contributor agreement / IP clarification with Riccardo Berti `P0`
      *This is the most time-sensitive legal task — do before next
      BioSynCare commit*
- [ ] Role confirmation with Eva Castilho (Æterni Anima member; Head of
      Communication and Marketing, BioSynCare) `P0`
      *Notified 2026-07-18 with a request to review the knowledge graph
      entry before it is marked approved.*

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
- [ ] Ratify the charter with participants `P1`
- [ ] Announce CG on relevant mailing lists and forums `P1`
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

### Ecosystem integration & events
> Targets, asks, consent status, the 90-day sequence, and KPIs live in
> [`docs/ecosystem/OUTREACH_TARGETS.md`](docs/ecosystem/OUTREACH_TARGETS.md) and
> [`docs/ecosystem/ECOSYSTEM_INTEGRATION.md`](docs/ecosystem/ECOSYSTEM_INTEGRATION.md).
- [ ] ⏰ **Brain Innovation Days 2026 (Brussels, 18–19 Nov) — apply to the
      Innovation Hall before 15 September 2026** `P1`
      Extended from 1 September. The extension is the maintainer's report
      (2026-09-03); the organiser's site does not state a deadline in the pages
      fetched that day, so **confirm the date on the application form before
      relying on it**. The original 1 September date passed with this item still
      open and still labelled Immediate, which is the failure the new date should
      not repeat.
      *Hard external deadline (~7 weeks out as of 2026-07-12). Verify exhibition
      costs before committing. Present SSTIM/BSC Lab, not health claims (§3.5).*

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
- [ ] Branch protection: require PR for main, CI must pass `P1`
- [ ] Dependabot configured for npm dependency updates `P1`
- [ ] Secret scanning enabled `P1`
- [ ] `hooks/pre-commit` — local validation mirror of CI `P1`

---

## 10. Decisions Pending

These require human judgment before tasks can proceed. Flagged here
to prevent AI agents from making the decision implicitly by building
something that assumes an answer.


- [?] **UI framework final confirmation**: Svelte 5 is the stated
  choice. Riccardo works in React Native (BioSynCare). If he
  contributes to BSC Lab frontend, React may be more natural.
  Confirm with Riccardo before Phase 1 scaffold is built.


- [?] **Juliana's advisory role**: does she want a named public role
  on `biosyncare.com` and `BSC Lab`? Her boundary is no joint work
  that could stress the relationship. A named advisory role with no
  deliverables may be acceptable. Confirm directly.


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
- [ ] Record trademark filing progress in `TODO.md` §2 and `IP_STRATEGY.md` `recurring`

**Per release:** follow the eleven-step procedure in
[`static/ontology/README.md`](static/ontology/README.md#versioning-and-publication),
which is authoritative and enforced by `make snapshot` and `make release-dryrun`.
Not duplicated here — a second copy of a release checklist is a second thing to
forget. The one item outside it: regenerate the public BSC Lab preset JSON bundle
if the player uses it `recurring`.

**Per new public BSC Lab reference preset added:**
- [ ] Validate JSON against `schemas/preset.schema.json` `recurring`
- [ ] Create RDF instance in `static/ontology/instances/presets/` `recurring`
- [ ] Run SHACL validation on new instance `recurring`
- [ ] Verify `techDesc` cites only PUBLIC-SAFE references `recurring`

---

*This file tracks work. Dated status belongs in [`CHANGELOG.md`](CHANGELOG.md);
current state is derived by `make truth-audit`.*
