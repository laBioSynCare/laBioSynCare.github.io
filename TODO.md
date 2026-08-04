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

## Symbol Key

```
[x]  Complete
[~]  In progress
[ ]  Not started
[!]  Blocked — see note
[?]  Decision pending — see note
```

Phase tags:
- `P0` Bootstrap (complete)
- `P1` Public Foundation (May–Jul 2026)
- `P2` Stimulation Platform (Jul–Nov 2026)
- `P3` Evidence Infrastructure (Nov 2026–Apr 2027)

---

## Current Focus (update when focus shifts)

**Update (Jul 2026):** Phase 0 is complete and the repository is in Phase 1.
SSTIM `0.13.0` is the validated release line (tag `v0.13.0`, version IRI
`https://w3id.org/sstim/0.13.0`), the modular release accepted by ADR 0043.
The previous release `v0.12.0` remains archived under release DOI
`10.5281/zenodo.21717988`; cite the concept DOI `10.5281/zenodo.21286974`
across releases. The external live-only ecosystem store, loader, and
private admission ledger are operational, with Renato as the first admitted
agent. The unified Graph navigator now exposes the interlinked versioned catalog,
live ecosystem, and SSTIM terms. The w3id catalog + live ecosystem routes are
merged and verified (2026-07-17, perma-id/w3id.org#6378), and the live
aggregate carries the W3C CG and Æterni Anima records — persistent
identifiers may now be promoted in human-facing discovery. The Phase-2 public
entrance shipped 2026-07-18 (four doors on `/`, browser moved to `/graph` —
see §5 and [`PUBLIC_ENTRANCE.md`](docs/technical/PUBLIC_ENTRANCE.md)). The
immediate focus is outreach (Brain Innovation Days application by
1 Sept 2026); registry review and future independent human review continue.
One entrance decision stays open — whether Sensory Field remains a distinct
on-ramp or folds into Patch Studio — and is an architecture call, not copy.
Public BSC Lab data remains separate from the private BioSynCare/BSC catalog.
The manifest-driven modular architecture shipped as `0.13.0` on 2026-08-04:
namespace catalogues, profile and schema routes, and a complete conformance
contract for every profile, with the registry rules merged and verified live.

**Update (May 2026):** an early Phase-2 prototype — the **Patch Studio**
(real-time audiovisual designer, four selectable audio engines, six audio voice
types + universal tremolo, nine visual track types with blend/fullscreen mixing,
and a photosensitivity safety layer) — now exists ahead of schedule. It is
documented in [`docs/technical/PATCH_STUDIO.md`](docs/technical/PATCH_STUDIO.md)
and [`docs/technical/PHOTOSENSITIVITY_SAFETY.md`](docs/technical/PHOTOSENSITIVITY_SAFETY.md).

**Update (Jun 2026):** the **Sensory Field** (`/field/`) ships Steps 1–2 — a
static colour field + per-ear tone/noise, blink and monaural/binaural beat, a
runtime flash-rate cap ([`src/ui/safety/flashSafety.js`](src/ui/safety/flashSafety.js)),
and per-configuration `sstim-ex:ExposureProfile` export. Exposure ontology bumped
to 0.4.0 (laterality, quantitative properties, `ExposureLimit` safety boundaries).
See [`docs/technical/SENSORY_FIELD.md`](docs/technical/SENSORY_FIELD.md) and
[ADR 0011](docs/decisions/0011-sensory-field-and-flash-safety.md). Next: Step 3
(stereoscopic depth / dichoptic eye-laterality).
The `core/` orchestration layer and the GPU visual/haptic engines remain Phase 2
work; Phase 3 infrastructure still must not be built during Phase 1.

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
- [x] `CHARTER.md` (root) — W3C CG draft charter `P0`
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
- [x] `CHANGELOG.md` — started at the first tagged release (v0.5.0); Keep a Changelog format, 0.1.0–0.5.0 `P1`

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

### Ontology namespace
- [x] Register `https://w3id.org/sstim` persistent namespace for the
      ontology `P1`
      *Process: fork https://github.com/perma-id/w3id.org, create
      `sstim/` folder with `.htaccess` content negotiation rules,
      submit PR. PR #6184 was merged on 2026-06-11; root RDF, module,
      Patch Studio, and versioned `0.1.0/` redirects are live. Keep the
      mirrored copy in `docs/ecosystem/w3id/` synchronized with the registry.*
- [~] Deploy and register the manifest-driven `0.13` publication routes `P1`
      *The repository now generates a Full namespace catalog for machine RDF at
      `/sstim`, exposes the exact two-class Kernel at `/sstim/kernel`, and
      generates a Stimulus + Exposure namespace catalog at `/sstim/exposure`.
      The separate `/sstim/module/exposure` route returns only the Exposure
      semantic module and is the live Full profile's distribution/`owl:imports`
      endpoint; `/sstim/exposure` must never be used as that import target
      (although `dct:requires` may use it as the logical ontology identifier).
      It also defines PROF-enabled profile entry points, `/sstim/manifest`, and
      the schema PID `/sstim/manifest-schema/1`. The mirrored rules are staged;
      deploy their Pages targets first, submit the perma-id update, and verify
      every route × representation before marking this complete.*
- [~] Extend the existing `https://w3id.org/sstim` namespace rules for the BSC
      framework and implementation instances under `/framework/bsc`,
      `/implementation/bsclab/{preset,session,annotation,evidence}/...`, and
      public-safe `/implementation/biosyncare/...` identity/metadata paths if
      they are ever published `P1`
      *Exact audited rules are staged for the BSC framework, BSC Lab,
      the public BioSynCare application identity, and the Patch Studio component.
      Deeper preset/session/annotation/evidence/reference routes remain.*
      *No second top-level w3id namespace. Keep room for future
      `/technique/{id}/`, `/protocol/{id}/`, `/framework/{id}/`,
      `/implementation/{id}/`, `/organization/{id}/`, and `/specialist/{id}/`
      data under SSTIM. Do not publish or route the private BioSynCare/BSC
      catalog from BSC Lab.*
- [~] Register `sstim:` and scoped prefixes such as `bsc-fw:`,
      `bsclab-preset:`, and public-safe implementation prefixes at
      https://prefix.cc `P1`
      *`sstim:` → `https://w3id.org/sstim#` is registered. Remaining registry
      submissions are tracked in `docs/ontology/REGISTRY_SUBMISSIONS.md`.*
- [x] Add `static/_headers` with COOP/COEP for future Netlify/custom hosting
      (required for SharedArrayBuffer and WASM threading) `P1`
      *Kept for future Netlify/custom hosting; GitHub Pages remains the
      primary host while BSC Lab is client-only and does not need these
      headers.*

---

## 3. Ontology and Vocabulary

### Phase 0 (done above in documents section)
Turtle files are listed in section 1. After they exist:

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
      [ADR 0043](docs/decisions/0043-sstim-core-profile-and-module-boundaries.md)
      `P1`
      *Accepted 2026-08-01 and implemented on the live `0.13.0-dev` line as a
      small Kernel, Core, Core Plus, optional concern/bridge modules, and Full
      compatibility profile. `static/ontology/manifest.json` is the source of
      truth for modules and closures; the Core, Core Plus, and Full profile
      entry points select semantic imports while shapes remain explicit. Frozen
      `0.13.0` is the latest immutable release. Normalized Full-union parity
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
      [ADR 0045](docs/decisions/0045-shapeless-profiles-are-discovery-entry-points.md)
      it is a discovery entry point and must not declare the negative
      categories. All of it is executed against each profile's own closure by
      `make core-profile-contract`. Pages targets were deployed and verified on
      2026-08-02;
      [perma-id/w3id.org#6480](https://github.com/perma-id/w3id.org/pull/6480)
      merged 2026-08-03 and the deployed negotiation matrix was verified against
      w3id.org on 2026-08-04 — 19 route/`Accept` combinations, all as modelled.
      `Vary: Accept` is not emitted by any w3id `303` and cannot be set from the
      `.htaccess`; the responses are not cacheable, so the risk it guarded is
      moot. Every release blocker is now cleared; `0.13.0` awaits only the
      mechanical version/date bump, snapshot, and its own snapshot-route PR.*
- [ ] Give the version IRI a whole-ontology artifact to resolve to `P1`
      *Until 0.12 `sstim-core.ttl` was the whole ontology, so `/sstim/<version>`
      could serve it; it is now the two-class Kernel, and a frozen snapshot has
      no single document standing for the release. `sstim-w3id-snapshot-routes`
      now refuses a bare-version route for a manifest-carrying snapshot that
      does not freeze `sstim-namespace.ttl`, so this cannot ship silently, but
      the release path must still generate and freeze that catalogue (today
      `make export` writes it only to `dist/`) or record a different
      whole-ontology release artifact.*
- [ ] Derive the VoID/DCAT record from the manifest `P1`
      *ADR 0043 rollout step 5, still unmet. `void.ttl` is consistent today —
      the quality audit counts it against the frozen directory its `dcat:version`
      names — but it describes 0.12.0's 9 subsets. At 0.13.0 it must describe
      all 18 modules, and the Kernel and Exposure `dcat:accessURL` values must
      become `/sstim/kernel` and `/sstim/module/exposure`, since `/sstim` and
      `/sstim/exposure` now serve namespace catalogues rather than those
      modules. Nothing yet checks the subset inventory against the manifest.*
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
- [~] Convert cleared public references to RDF in
      `static/ontology/instances/references/` `P1`
      *Seven records are present; expand only with source and venue review.*
- [x] Add RDF individuals for Binaural, Martigli, Symmetry, and
      Martigli-Binaural voice types as technique instances `P1`
      *Done 2026-04-28 in `static/ontology/instances/frameworks/bsc.ttl`.*

### Phase 2 ontology extensions
- [x] Model session specifications, executed session activities, phased
      self-reports, and a non-personal synthetic example `P2`
- [ ] Add `sstim:derivedFrom` property for preset lineage tracking `P2`
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
- [ ] Reviewed `sstim-alignments.ttl` pass — findings from the 2026-08-01 live
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
      deletions. Protected file (CLAUDE.md §3.4): needs explicit instruction.*
- [ ] Consider `skos:altLabel` coverage in `sstim-vocab.ttl` — currently **zero**
      `P2`
      *Raised 2026-08-01 while checking how Wikidata's term fields map to RDF.
      Wikidata emits a label as `rdfs:label` + `skos:prefLabel` + `schema:name`,
      and an alias as `skos:altLabel`. SSTIM and Wikidata therefore agree exactly
      on `skos:prefLabel`, which makes them directly comparable — but
      `sstim-vocab.ttl` has 239 `skos:notation` values and **no `skos:altLabel`
      at all**. Reconciliation and entity-linking tools (OpenRefine, Wikidata
      search, generic matchers) resolve strings against prefLabel *and* altLabel,
      so today a match succeeds only on the exact prefLabel in one of the four
      languages. Nothing resolves "isochronic tones" to
      `techIsochronicTones` ("Isochronic Tone Stimulation"), "monaural beats" to
      `techMonauralBeats`, "gated pulse train" to either, or "alpha rhythm" /
      "ritmo alfa" to `sstim-v:alpha`. This is a usability gap for other people's
      tooling, and it is the cheap half of interoperability. Protected file
      (CLAUDE.md §3.4): needs explicit instruction and per-term review.*
- [?] Create items for project-specific techniques only after independent
      published sources establish notability `P2`
- [?] Edit related Wikipedia articles only after independent sources support
      the contribution; do not use Wikipedia to establish SSTIM notability `P2`

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
- [ ] `src/rdf/store.js` — N3.Store management, merge multiple graphs `P1`
- [x] `src/rdf/query.js` — Comunica SPARQL engine, lazy-loaded `P1`
      *Dynamic import: only load Comunica when SPARQL interface opens*
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
- [x] `src/ui/graph/OntologyGraph.svelte` — Cytoscape.js, lazy-loaded `P1`
      *Renders: OWL class hierarchy + SKOS broader/narrower relationships.
      Layout: cose. Only loads when graph route opens.*
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
- [ ] Optional Netlify/custom-domain deployment: `lab.biosyncare.com`
      (CNAME at Keliweb) `P2`
      *Deferred until BSC Lab needs COOP/COEP headers for WASM threading,
      server-side APIs, or custom-domain product positioning.*
- [x] Verify WIDOCO docs are live on GitHub Pages `P1`
      *Verified 2026-07-11: `https://labiosyncare.github.io/ontology/docs/`
      serves the generated documentation (title, term anchors, knowledge-
      browser cross-link) alongside the untouched app root and Turtle
      artifacts.*

---

## 5. Software — Phase 2 (BSC Lab v0.2 Stimulation Player)

**Do not start until Phase 1 is complete and deployed.**

### UI — Public entrance (`/` + `/graph`)
**Shipped 2026-07-18.** Spec: [`docs/technical/PUBLIC_ENTRANCE.md`](docs/technical/PUBLIC_ENTRANCE.md).
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
- [ ] Optional follow-up: create the `protocol-proposal` GitHub label
      referenced in the new issue template's frontmatter `P3`

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

### UI — Patch Studio (`src/ui/creator/`)
The real-time audiovisual designer shipped ahead of schedule (see Current Focus,
May 2026). Spec: [`docs/technical/PATCH_STUDIO.md`](docs/technical/PATCH_STUDIO.md).
The improvement backlog below is grounded in that spec's §10 and gated by
[ADR 0026](docs/decisions/0026-patch-studio-catalog-bridge.md).

- [x] ~~`PresetCreator.svelte` — add/remove control/audio/visual/haptic
      tracks, per-param knobs, modulation links, tempo sync, live engine
      preview, cloud save~~ — shipped (`patch-studio-model-1`).

**Bridge to the catalog / RDF (highest priority — PATCH_STUDIO.md §10.1, ADR 0026)**
- [ ] `src/ui/creator/patchToPreset.js` — convert the mappable subset of a patch
      (`BinauralBeat→Binaural`, `Symmetry`+`IsochronicTone→Symmetry`,
      `Martigli`-modulated carrier→`Martigli`/`Martigli-Binaural`) to catalog
      `header`+`voices`; report blocked/dropped tracks, never silently drop `P2`
- [ ] Metadata-authoring panel for the required `header` fields
      (`group`, `targetBand`, `evidenceTier`, `cautionTags`, multilingual
      `desc*`/`med2*`/`techDesc*`, `headphonesMode`, …); no auto-derived
      evidence/claims (`CLAUDE.md` §3.5) `P2`
- [ ] Validate output against `schemas/preset.schema.json`, then emit a BSC Lab
      reference preset + (second) its RDF instance under
      `static/ontology/instances/presets/`, SHACL-gated (`CLAUDE.md` §5.4).
      Pairs with the `src/rdf/export.js` RDF-pipeline task below `P2`

**Decompose the monolith (PATCH_STUDIO.md §10.2)**
- [x] ~~Extract pure `src/ui/creator/modulation.js`~~ — `evalParamValue`,
      `effectiveTempoValue`, `clampRange`, `modAmountRange`, `sumMods`, and the
      binaural center/beat→L/R `resolveBinauralLR`. `applyMods` /
      `controlTrackForTempo` stay in the component as thin cache/reactive
      wrappers (own `liveValues` + change-detected `writeAudio`).
- [x] ~~Extract pure `src/ui/creator/waveformPaths.js`~~ — SVG scope geometry
      + `isoEnvSpec`.
- [ ] Extract `src/ui/creator/patchTransport.js` (engine lifecycle + `rafTick`,
      preserving the `AudioContext.currentTime` clock authority) `P2`
- [ ] Extract a cloud-patches store over `src/firebase/patches.js`; split out
      subcomponents (cloud menu, help overlay, semantic-info panel, mix stage,
      track card) `P2`

**Tests (PATCH_STUDIO.md §10.3)**
- [x] ~~Unit tests for `modulation.js` + `waveformPaths.js`~~ —
      `src/ui/creator/{modulation,waveformPaths}.test.js` (base + Σ amount·control,
      clamp, mute→gain 0, tempo-sync resolution, binaural split, scope geometry);
      creator suite 12 → 44 cases.

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
- [x] Submit and launch the W3C Community Group — **done; launched, charter not
      yet ratified.** `P1`
      *Participant growth (currently 4 → target ≥12 across ≥3 institutions) is now
      an ongoing KPI — see `docs/ecosystem/ECOSYSTEM_INTEGRATION.md` Workstream 3.*
- [x] Create W3C account `P1`
- [x] Submit W3C Community Group proposal using `CHARTER.md` and `docs/ecosystem/W3C_COMMUNITY_GROUP_PROPOSAL.md` `P1`
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
      Innovation Hall before 1 September 2026** `P1`
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
- [x] Repository created with correct license files:
      `LICENSE` (Apache 2.0) and `LICENSE-ontology` (CC BY 4.0) `P0`
- [ ] Branch protection: require PR for main, CI must pass `P1`
- [ ] Dependabot configured for npm dependency updates `P1`
- [ ] Secret scanning enabled `P1`
- [x] `.github/workflows/validate-rdf.yml` — pySHACL on every PR
      touching `static/ontology/` `P1`
- [x] `.github/workflows/widoco-docs.yml` — regenerate docs-site
      on TTL file change `P1`
      *Superseded by ADR 0023: WIDOCO generation runs inside `pages.yml`
      (`make ontology-docs` → `dist/ontology/docs/`); no separate workflow.*
- [x] `.github/workflows/pages.yml` — build SvelteKit static output and deploy
      `dist/` to GitHub Pages `P1`
- [x] `.github/workflows/lint.yml` — Svelte type check and static build `P1`
- [ ] `hooks/pre-commit` — local validation mirror of CI `P1`

---

## 10. Decisions Pending

These require human judgment before tasks can proceed. Flagged here
to prevent AI agents from making the decision implicitly by building
something that assumes an answer.

- [x] **Firebase role**: updated 2026-04-28 by explicit maintainer direction.
  Phase 1 now includes optional Firebase Auth + Firestore for RDF node
  annotations. The integration is env-gated so GitHub Pages/static builds still
  work without credentials; the authoritative ontology and public instance
  graphs remain client-loaded static RDF.

- [?] **UI framework final confirmation**: Svelte 5 is the stated
  choice. Riccardo works in React Native (BioSynCare). If he
  contributes to BSC Lab frontend, React may be more natural.
  Confirm with Riccardo before Phase 1 scaffold is built.

- [x] **Private catalog boundary**: the BioSynCare/BSC catalog remains private
  JSON outside this repository. BSC Lab does not convert that catalog to Turtle
  and does not use it as app data. Public BSC Lab seed/reference presets may be
  authored as RDF under `static/ontology/instances/presets/`; any JSON export is
  for BSC Lab runtime use only.

- [?] **Juliana's advisory role**: does she want a named public role
  on `biosyncare.com` and `BSC Lab`? Her boundary is no joint work
  that could stress the relationship. A named advisory role with no
  deliverables may be acceptable. Confirm directly.

- [x] **W3C CG name**: settled as "Sensory Stimulation Vocabulary Community
  Group" (the launched group's name), emphasizing terminology and semantic
  interoperability.

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
- [ ] Update core `owl:versionIRI`, module `owl:versionInfo`, and all release
      metadata consistently `recurring`
- [ ] Prepare exact immutable sibling `owl:imports`, manifest
      `immutableRelease` (base, manifest, and schema), released `$schema`,
      immutable PROF artifacts, and every snapshotted artifact's versioned URL
      `recurring`
- [ ] Confirm every released profile has positive, out-of-scope, and
      adversarial fixtures plus an executable competency query `recurring`
- [ ] Run WIDOCO to regenerate docs `recurring`
- [ ] Run `make validate` and confirm all public instance graphs pass SHACL
      `recurring`
- [ ] Regenerate the public BSC Lab preset JSON bundle if the player uses it `recurring`
- [ ] Confirm all earlier frozen ontology snapshots are byte-unchanged `recurring`
- [ ] Tag release in git with semver `recurring`

**Per new public BSC Lab reference preset added:**
- [ ] Validate JSON against `schemas/preset.schema.json` `recurring`
- [ ] Create RDF instance in `static/ontology/instances/presets/` `recurring`
- [ ] Run SHACL validation on new instance `recurring`
- [ ] Verify `techDesc` cites only PUBLIC-SAFE references `recurring`

---

*Last updated: 2026-07-11 - WIDOCO publication path implemented (ADR 0023)*
*Next update due: after the WIDOCO Pages deploy is verified live or perma-id PR #6337 merges*
