# W3C repository migration report

- **Report date:** 2026-08-23
- **Migration source:** `laBioSynCare/laBioSynCare.github.io`
- **Migration target:** `w3c-cg/sstim`
- **Candidate site:** `https://w3c-cg.github.io/sstim/`
- **Status:** **executed 2026-08-23.** PR #1 merged into target `main` as
  `773d64cd5fc6b79487334eb011a92ba46ee6eec3`; Pages deployed and accepted;
  target refs protected
- **Production W3ID cutover:** not performed
- **Old repository archival:** not performed

## Executive result

Migration to `w3c-cg/sstim` remains the recommended course. A complete-tree,
dual-default-history integration candidate has been built and validated. It
keeps the W3C repository's initial history, imports the current complete source
tree and source-main history, makes the application work at `/sstim/`,
establishes SSTIM Workbench branding, and stages the W3ID resolution contract
without changing production rules. On 2026-08-23, the repository
rights-holder/maintainer confirmed that Community Group migration approval
covers the complete history, the existing Apache-2.0/CC BY 4.0 license split,
SSTIM, and the complete non-normative Workbench. Gate G0 is therefore passed;
the implemented scope and future-contribution boundary are recorded in
[`LICENSING.md`](../../LICENSING.md).

The candidate is published at target branch
`migration/import-complete-source`, with all 14 annotated historical tags,
namespaced copies of every surviving source branch tip, and archival refs for
all 12 observed pull-request heads. Draft
[`w3c-cg/sstim#1`](https://github.com/w3c-cg/sstim/pull/1) is open against
`main`; target CI is evaluating the real import. GitHub Releases, Zenodo/DOI
actions, production W3ID, external registries, target `main`, and the old
deployment remain unchanged.

The following remote-safe work is complete:

- The migration decision and runbook were committed to source `main` as
  `6cf49c9edec2af6e626477ef8bd4095ce76c8e17` and pushed to
  `laBioSynCare/laBioSynCare.github.io`.
- The exact pre-migration W3C scaffold was pushed to
  `pages/pre-migration-scaffold` at
  `7d4a4a76a9d6eb8b6a49c7d5525bce5223c7b433`. This branch contains no imported
  source and is a recovery point, not a Pages source.
- The committed integration candidate is durably preserved on the old
  repository's non-production `migration/w3c-integration` branch. This does not
  change source `main` or its Pages deployment.
- The source-bearing candidate is published on target branch
  `migration/import-complete-source`; source branch tips are under
  `legacy/labiosyncare/*`, and source pull-request heads are under
  `archive/labiosyncare/*`.
- All 14 signedness-preserving annotated tag objects and peeled commits match
  the source. The target still has no GitHub Releases, so tag publication did
  not create a release or Zenodo deposit.
- Draft pull request `w3c-cg/sstim#1` is open and mergeable. Its IPR status
  check passed and its repository CI started successfully.
- Target `main` and its live scaffold Pages deployment remain unchanged.

## Post-merge outcome, 2026-08-23

PR #1 was merged into target `main` with a normal merge commit
(`773d64cd5fc6b79487334eb011a92ba46ee6eec3`, two parents, neither squashed nor
rebased) after all five checks passed on head `32bd987`. The Pages workflow then
built under `/sstim`, deployed, and verified itself:
`verify-deploy: OK — https://w3c-cg.github.io/sstim serves 773d64cd`.

Gate G1 was closed before the merge by the repository rights-holder and
maintainer choosing option 3, accepting the shared-origin threat model for the
public Workbench. That decision and the distinction it rests on (cache and fetch
isolation fixed in code; Web Storage and IndexedDB accepted as origin-scoped)
are recorded in the plan's Gate G1 section.

One correction to an inherited number, made by measurement rather than by
repeating the plan: the plan says 28 manifest runtime values. Extracting `"url"`
from the live `static/ontology/manifest.json` gives **22**, and all 22 return 200
from the project path. 22 is the measurement.

### Fresh-clone preservation proof

Run against a new clone of the target rather than the integration checkout, as
the plan requires.

| Proof | Result |
|---|---|
| `git fsck --full --strict` | clean |
| Frozen source tip `6cf49c9` is an ancestor of `main` | yes |
| Frozen target tip `7d4a4a7` is an ancestor of `main` | yes |
| Live source tip `e6b3948` is an ancestor of `main` | yes, so the target did not start out behind the source |
| Import merge `33622c7` parents | exactly two: `7d4a4a7` and `6cf49c9` |
| Target `main` tip is a merge commit | yes |
| Tags | 14 of 14, annotated-object IDs and peeled-commit IDs both match the frozen source |
| Source branch heads | 3 of 3 reachable or namespaced under `legacy/labiosyncare/` |
| Archived pull-request heads | 12 of 12 present |
| Protected `static/ontology` tree | `84528db5`, identical to the live source tip |
| `CITATION.cff`, `.zenodo.json` | unchanged from the live source |
| GitHub Releases on target | 0, so no webhook, deposit or DOI event fired |
| Commits reachable from `main` | 507 |

### Repository protection applied

The migration owner now holds Admin on `w3c-cg/sstim` and used it after the
merge, closing the first safe-stop blocker:

- `main`: pull request required (zero approvals, so a solo maintainer is not
  deadlocked), all five checks required, force pushes and deletion prohibited.
- Ruleset "Preserve imported history": deletion and non-fast-forward blocked on
  `archive/labiosyncare/**`, `legacy/labiosyncare/**` and
  `pages/pre-migration-scaffold`.
- Ruleset "Protect imported release tags": deletion, non-fast-forward and update
  blocked on every tag.

Applying that protection immediately exposed a deadlock worth recording, because
it would recur in any repository that copies this setup. `RDF validation (Nix)`
was a required check on a workflow filtered by path, and GitHub blocks a pull
request whose required check never reports. A documentation-only change matches
none of the filtered paths, so the first such pull request after protection
could never merge. The filter moved inside the job: a relevance step resolves the
merge base, applies the same path list to the diff, and gates the expensive
steps on the result, failing open when the base cannot be resolved. The check now
always reports, a docs pull request costs seconds, and an ontology pull request
runs the full validation exactly as before.

### User state transition, old origin to new

Driven through the real Settings UI on both sites with synthetic data. A logbook
book and entry and an annotation were created on
`https://labiosyncare.github.io/`, exported by the export button (envelope model
`bsc-lab-instance-export-1`, 1147 bytes), and restored on
`https://w3c-cg.github.io/sstim/`. Both arrived. The `skin` preference travels in
the envelope, but the application normalises the stored value on load, so this
test does not isolate whether the import wrote it: treat that one field as
untested rather than passed. Installed-PWA state does not transfer between
origins and cannot be imported; re-installation instructions must be published
before any redirect or archival.

## What was migrated in the integration candidate

The complete source repository was merged into the target history, including:

- SSTIM ontology modules and SKOS vocabulary;
- profiles, SHACL, mappings, contexts, schemas, manifests and conformance
  machinery;
- immutable releases and release-generation tooling;
- WIDOCO and pyLODE generation;
- Graph Navigator and the SPARQL interface;
- SSTIM Workbench, including Patch Studio;
- audiovisual engines, AudioWorklet and WASM resources;
- synthetic fixtures, demonstrators and interoperability material;
- validation, reasoning, registry and release QA;
- documentation, PWA and portable-deployment infrastructure; and
- existing public-safe reference implementation material.

No repository split or broad directory reorganization was performed. The
specification/reference-software authority boundary is expressed through
documentation and public information architecture.

## Git history preservation

The import uses a true two-parent merge rather than a force push, squash,
rebase, archive copy, or replacement history.

| Item | Evidence |
|---|---|
| Target scaffold tip | `7d4a4a76a9d6eb8b6a49c7d5525bce5223c7b433` |
| Imported source tip | `6cf49c9edec2af6e626477ef8bd4095ce76c8e17` |
| Integration merge | `33622c7f233d8f1a7bd5fe9ea0adce5d98afaae9` |
| Merge parents, in order | target `7d4a4a7`, source `6cf49c9` |
| Target root retained | `ce802d5433e57f1fc1e743fe746d847848052873` |
| Source root retained | `012b08ae64e7b5c577015035acef3fa21056870a` |
| Source main history | 486 commits reachable from the imported source tip |
| Target history | all 5 original commits remain reachable |
| Source tags | all 14 annotated tag objects and peeled commits match on the target; no `v0.4.0` existed or was manufactured |
| Complete source ref union | 495 source commits preserved: 486 reachable from source heads/tags plus 9 reachable only from historical PR refs |
| Current candidate history | 502 commits before this report update; 511 in the union with archived PR-only history |
| Object integrity | source mirror, target mirror and integration `git fsck` passed |
| Protected ontology tree | source and candidate both `02bb35531085bd0708441e6a43ef190a82f87666` |
| Production W3ID rules blob | source and candidate both `73617016e5139e98fb90cdc8fd86cdaf33c8f3d2` |

Nine additional source commits are reachable only through historical pull
request refs, not source `main` or the surviving branch heads. All nine are now
reachable on the target through `archive/labiosyncare/source-pr-2-head` through
`source-pr-9-head`. Aliases for PRs 10–13 preserve the complete observed ref
inventory even though those tips add no unique commits. GitHub's reserved
`refs/pull/*` were not modified.

The migration commits after the two-parent import are small, coherent stages:

1. `33622c7` — import complete SSTIM baseline with both histories;
2. `032edc1` — central project-page base-path support;
3. `04ac29d` — staged W3ID targets without production cutover;
4. `0e22efd` — SSTIM/SSTIM Workbench public identity;
5. `c01cc9a` — direct-Node compatibility for the central URL resolver;
6. `d9d2873` — deployment-aware audio resource test expectations;
7. `4ec4857` and `87a04c5` — acceptance and remote-staging reports; and
8. `cd97b53`, `c9f15fe`, and `5a753cf` — approved licensing and media-scope
   records.

## Changes made

### Central project-page routing

`SSTIM_BASE_PATH` is the single validated deployment mount. SvelteKit, Vite,
runtime route and asset resolution, ontology loading, worklet/WASM/sample
loading, generated-document links, CI and static smoke tests derive from it.
The default remains the empty base so root deployments continue to work; the
W3C Pages workflow sets `/sstim`.

This removes origin-root assumptions without scattering hard-coded `/sstim`
prefixes through the application. Logical RDF/static paths remain logical in
direct Node validation and are mounted only at browser/network boundaries.

### PWA and shared-origin containment

The manifest's `id`, `start_url`, `scope` and icons are base-aware. The service
worker is registered at `/sstim/service-worker.js`, owns a mount-specific cache
namespace, intercepts only requests inside `/sstim/`, and no longer deletes
unrelated caches on the shared `w3c-cg.github.io` origin.

This contains HTTP/cache behavior, but path scope does not isolate
`localStorage`, IndexedDB, credentials or same-origin script access. Stateful or
authenticated Workbench deployment therefore remains subject to the security
decision recorded under blockers.

### W3ID staging

The checked-in production `.htaccess` mirror is unchanged. A separate in-memory
staging transformer parses its 75 rules and retargets only the 57 application,
Graph Navigator and ontology publication rules to the W3C project site. It
preserves rule order, conditions, backreferences, fragments, flags, external
targets and status-only rules.

The staged suite checks namespace roots, hash terms, slash entities, ontology
modules, profiles, contexts, schemas, manifests and immutable releases. A live
staged smoke job is wired to run only after a target Pages deployment exists.

### Public identity

Current project/application branding now uses:

- **SSTIM** for the overall open specification, vocabulary, semantic
  infrastructure, reference tooling and Community Group project;
- **SSTIM Workbench** for the non-normative executable environment;
- **Graph Navigator** for semantic exploration; and
- **Patch Studio** for interactive authoring/reference work.

The public About material states that the Workbench and its components are
non-normative and does not describe Community Group work as a W3C Recommendation
or endorsed standard. It also records:

> SSTIM and its accompanying open reference tooling were contributed as the
> initial technical baseline of the W3C Sensory Stimulation Vocabulary
> Community Group. Historical development provenance is preserved in the
> repository history.

BioSynCare remains a separate commercial implementation/ecosystem participant.
The current UI no longer uses BSC Lab as the repository-wide public identity.

## What intentionally did not change

- No `https://w3id.org/sstim...` canonical IRI or namespace changed.
- No ontology module, vocabulary term, profile closure, SHACL contract,
  mapping, scientific/evidence assertion or semantic release content changed.
- No immutable `static/ontology/<version>/` snapshot changed.
- The production W3ID `.htaccess` mirror and upstream `perma-id/w3id.org` rules
  did not change.
- Existing DOI records, `.zenodo.json`, `CITATION.cff`, external registries and
  released citation titles did not change.
- BSC-specific framework, implementation, component, protocol, provenance,
  model-tag, schema and RDF identities did not change.
- Compatibility identifiers such as `bsclab.*`, `bsc-lab-*`, package/service
  names and storage keys did not change merely for branding.
- Historical documents and the defensive prior-art publications were not
  rewritten. One immutable historical ecosystem PDF contains old URLs; it was
  removed from current navigation rather than altered.
- The old repository and production Pages deployment remain operational and
  were not archived or redirected.
- Patch Studio received no unrelated UX redesign.

## Acceptance evidence

The table below was written before the merge and is retained for its local
evidence. Every row that said PENDING or PASS-locally has now been re-measured
against the live deployment; those live results follow the table. Exact
revisions: `Lint and Build` run 32651866756, `Validate RDF` run 32651866699 and
`Deploy GitHub Pages` run 32651866687, all on `773d64c`, all success.

| Requirement | Status | Evidence |
|---|---|---|
| Git history preserved | **PASS on target** | two-parent merge, both roots/ancestry and `git fsck` pass; every source head, annotated tag and observed PR head is represented by an explicit target ref |
| Existing W3C repository history preserved | **PASS on target branch** | all five original target commits remain ancestors; recovery branch preserves the exact original tip |
| Target draft PR CI | **IN PROGRESS** | PR #1 is mergeable; IPR check passed and SvelteKit/NixOS VM/OCI/RDF workflows started on the target |
| New GitHub Pages deployment healthy | **PENDING / cutover blocker** | target still intentionally serves its scaffold; local complete Pages artifact passes |
| `/sstim/` routing works | **PASS locally** | mounted build and complete HTTP smoke pass; origin-root routes are not required |
| Graph Navigator works | **PASS locally** | browser loaded 181 OWL resources, 551 SKOS concepts and 18 modules |
| Term deep-linking works | **PASS locally** | `#StimulationMechanism` resolved to `/sstim/graph/?zoom=1#StimulationMechanism` and selected the term |
| Patch Studio works | **PASS locally** | `/sstim/creator/?starter=field` loaded its controls and conversion flow; legacy starter routes redirect correctly |
| SSTIM Workbench branding coherent | **PASS locally** | current UI/docs use the defined identity boundary; historical/semantic BSC names retained |
| PWA/service worker project scope | **PASS locally** | registration scope `/sstim/`, mounted controller and cache name verified; sibling paths excluded |
| AudioWorklet and WASM | **PASS locally** | worklet module loaded; WASM fetched with `application/wasm` and compiled; no audible output generated during acceptance |
| SSTIM ontology validation | **PASS** | pinned full `make validate` passed |
| SHACL | **PASS** | module, instance, profile and negative/golden suites conform or reject as specified |
| OWL/reasoning | **PASS** | HermiT/ROBOT consistency passed for all 16 semantic modules; full-union compatibility retained 9,153 baseline triples |
| WIDOCO | **PASS with warning** | generated and mounted links/assets passed; generator downloads the prior immutable ontology for changelog creation |
| pyLODE | **PASS** | vocabulary documentation generated and served at `/sstim/ontology/docs/vocab/` |
| SPARQL interface | **PASS locally** | browser query returned 100 rows; direct Node competency scripts pass |
| Context/profile/schema endpoints | **PASS locally** | complete mounted smoke and 45-document JSON-LD context round trip pass |
| Immutable/versioned artifacts unchanged | **PASS** | all 15 snapshot checksum ledgers pass; no protected files appear in the migration diff |
| Existing DOI metadata consistent | **PASS / unchanged** | truth and release audits pass; no DOI-bearing source was modified |
| Staged W3ID resolution matrix | **PASS locally** | 75 rules classified, 57 retargeted in memory, 94 targets publishable, 15 snapshots/204 paths pass |
| No canonical SSTIM IRI changed | **PASS** | protected ontology diff is empty and namespace/manifest/route checks pass |
| No semantic release content changed | **PASS** | immutable hashes and full-equivalence checks pass |
| No important functionality regressed | **PASS locally** | root and `/sstim` suites each pass 61 files/858 tests; browser and complete artifact matrices pass |
| Old production remains operational | **PASS live** | source entrance returned HTTP 200 on 2026-08-23; production W3ID Turtle still resolves through the old deployment |

Additional final results:

- `svelte-check`: zero errors and zero warnings in root and `/sstim` modes;
- root static build and HTTP smoke: pass;
- `/sstim` build and complete mounted HTTP smoke: pass;
- export generator: 50 RDF/XML/JSON-LD/namespace files generated and verified;
- BioPortal bundle: generated from 16 frozen v0.16.0 modules with
  `owl:versionIRI https://w3id.org/sstim/0.16.0`;
- release dry run and release-truth audit: pass;
- full-history `gitleaks` scan: approximately 20.6 MB scanned with no findings;
  and
- no Firebase API key was inlined into the credential-free target artifact.

### Live target results, measured after deployment

| Surface | Instrument | Result |
|---|---|---|
| Deployed commit identity | `verify-deploy.mjs` in the deploy job | **PASS**: serves `773d64cd`, app 0.1.0, SSTIM 0.17.0-dev |
| Prerendered routes at `/sstim/` | `curl` on each route | **PASS**: 13 of 13 return 200 on direct hit |
| Manifest runtime endpoints | `curl` over `"url"` values extracted from the live manifest | **PASS**: 22 of 22 |
| Local instance endpoints | `curl` over `INSTANCE_URLS` | **PASS**: 21 of 21 |
| External ecosystem store | `curl` | **PASS**: 200, unchanged |
| Generated documentation | `curl` on WIDOCO and pyLODE indexes plus their local assets | **PASS** with two pre-existing broken links, M-02 and M-03 |
| Staged W3ID matrix | `w3id-staged-smoke.mjs` in the deploy job | **PASS**: 29 candidate targets, 9 Graph fragments, production file untouched |
| Immutable artifacts | sha256 of 7 artifacts fetched from both origins | **PASS**: 7 of 7 byte-identical, including `manifest.json` and snapshots back to 0.1.0 |
| DOI records | `curl -L` on both DOIs, release counts by API | **PASS**: both resolve to record 22003777; 14 Releases on source, 0 on target |
| Entrance | headless Chrome over CDP | **PASS**: renders as SSTIM Workbench with full navigation |
| Graph Navigator | headless Chrome over CDP | **PASS**: 15100 quads, 23 named graphs, 749 nodes, 879 edges, 181 OWL classes, 551 SKOS concepts, live ecosystem source available |
| SSTIM term deep link | headless Chrome over CDP | **PASS**: `#sstim:StimulationMechanism` selects the term, focuses the node and renders IRI, docs link, alignment and 16 connections |
| BSC entity deep links | headless Chrome over CDP | **PASS**: framework, component, preset and programme fragments each select their node |
| SPARQL | headless Chrome over CDP | **PASS**: store reaches ready, an example query runs, 100 rows render |
| Patch Studio | headless Chrome over CDP | **PASS**: loads with transport and track controls |
| AudioWorklet and WASM | `OfflineAudioContext` render in the deployed page | **PASS**: JS BinauralBeat 199.5 Hz, JS IsochronicTone, WASM Carrier and WASM BinauralBeat all non-silent from `/sstim/worklets/` |
| Pages WASM posture | `WebAssembly.compileStreaming` against the deployed `.wasm` | **PASS**, which is also the `application/wasm` MIME proof |
| Service worker scope | live registration | **PASS**: `https://w3c-cg.github.io/sstim/`, not the organization root |
| Cache isolation | `caches.keys()` on the live origin | **PASS**: `sstim-workbench:/sstim:<version>` |
| Fetch isolation | sibling same-origin request, then cache match | **PASS**: fetched normally, present in no SSTIM cache |
| Web app manifest | live fetch | **PASS**: `scope`, `start_url` and `id` are `./`, resolving under `/sstim/` |
| External registries | `verify-registries.py` | 3 verified, 1 unreachable (M-05), 1 wrong (M-04) |
| Old production | `curl` on sampled routes and `build-info.json` | **PASS**: serving `e6b3948`, all sampled routes 200 |

The one measurement that reads worse than the pre-merge table is deliberate: the
audio row previously said "no audible output generated during acceptance", and
an initial `OfflineAudioContext` run reported the WASM voice silent. That run was
wrong, not the deployment. The WASM processor takes a compiled
`WebAssembly.Module` through `processorOptions`, which the test had not supplied.
Compiling it from `/sstim/worklets/bsc-osc.wasm` first makes all four voices
render.

## Failures, warnings and blockers

| Finding | Cause | Severity | Blocks cutover? | Recommended action |
|---|---|---:|---|---|
| Gate G0 | Community Group migration approval was confirmed for the complete history, existing licenses, SSTIM and complete Workbench; the path/contribution scope is recorded in `LICENSING.md` | **Resolved** | No | Preserve the recorded scope; do not infer retroactive CLA assent or relicensing |
| Target Pages is still legacy `main`/root | The scaffold is already published directly from target `main` | **Resolved 2026-08-23** | No | Pages now builds from the Actions workflow; the recovery branch `pages/pre-migration-scaffold` is retained and protected |
| Target `main` lacks protection | No protection/ruleset was visible; Maintain cannot configure it | **Resolved 2026-08-23** | No | Admin obtained; branch protection plus two rulesets applied, covering `main`, archival branches and every tag |
| Target integration inventory incomplete | Maintain cannot inspect Actions policy, hooks, deploy keys, installed Apps or all environment/org settings | **High for releases** | **No for historical tag/archive publication; yes for GitHub Release recreation** | Admin/organization owner audits integrations, especially any release webhook/Zenodo app, before Releases are recreated |
| Shared GitHub Pages origin | Browser storage and same-origin script access are origin-scoped, not path-scoped | **Accepted 2026-08-23 (Gate G1 option 3)** | No | Threat model explicitly accepted by the rights-holder. Cache and fetch isolation are fixed in code and verified live; Web Storage and IndexedDB remain origin-scoped by the platform. The build stays credential-free, and enabling authentication reopens the gate |
| Historical PR-only commits | GitHub pull-request refs cannot be mirrored to reserved target refs | **Resolved** | No | All observed heads are preserved under `archive/labiosyncare/*`; retain the mapping in this report |
| Live target acceptance unavailable | The current Pages environment permits only `main`, so the draft branch cannot deploy before review | **Resolved 2026-08-23** | No | The reviewed PR was merge-committed and the Actions deployment was validated immediately, which is the second option the row anticipated |
| Combined citation/deposit license field | Existing `CITATION.cff` and `.zenodo.json` model v0.16 with a single CC BY 4.0 field despite the artifact-level Apache/CC BY/CC0 scope | **Medium for a future Release** | No for import; yes before a new target Release | Preserve historical metadata now; agree and validate a multi-license presentation before any future Release/Zenodo event |
| Historical ecosystem PDF has no detected file-level license marker | `static/docs/BioSynCare_Ecosystem_Brief_EN.pdf` is outside the paths expressly covered by `LICENSE-ontology` | **Low for migration; material for reuse** | No for an unchanged history import | Preserve unchanged and do not present, adapt, or republish it as a new CG deliverable until the rightsholder records a specific disposition |
| WIDOCO changelog uses the network | WIDOCO downloads immutable v0.16.0 from production when creating its changelog; its Nix package also warns about a missing default config file | **Medium** | No for current artifact; should be fixed for fully offline reproducibility | Vendor or explicitly supply the prior release input and remove the implicit network dependency in follow-up work |
| Optional `runtime-config.json` returns 404 in a credential-free build | Runtime configuration is deliberately optional and the target build contains no Firebase variables | **Informational** | No | Keep documented optional behavior; add a public config only after the shared-origin/security decision |
| Large JavaScript chunk warning | Current application graph produces bundles above Vite's warning threshold | **Low** | No | Track performance/code splitting separately; do not mix it into migration |
| Initial final root test run failed three audio URL assertions | The tests retained a hard-coded `/sstim` expectation after the URL resolver became matrix-aware; runtime behavior was correct | **Resolved** | No | Test expectations now derive from the validated deployment base; both 858-test matrices pass |

### Post-deployment failure ledger

| ID | Surface and reproduction | Cause | Severity | Cutover impact | Recommended fix | Regression status | Verification |
|---|---|---|---|---|---|---|---|
| M-01 | `GET /sstim/ontology/manifest.json` returns runtime values starting `/ontology/...`. An external consumer resolving them against the manifest's own URL escapes to `https://w3c-cg.github.io/ontology/...` | The manifest states application-root paths; first-party loading works because `applicationAsset()` resolves them against the deployment base | High for third-party reuse, none for the application | **Blocks W3ID cutover of the manifest routes.** Does not block the repository move or the site | Decide the path semantics in the plan's manifest portability section, then keep manifest routes on a root-hosted origin or change the live manifest under the full ontology gate | Pre-existing shape, newly consequential under a project path | Re-run the 22-endpoint sweep plus an external-resolver test after the decision |
| M-02 | `GET /ontology/docs/OOPSevaluation/oopsEval.html` returns 404, linked from the WIDOCO index | WIDOCO emits the link without generating the page | Low | None | Post-process the generated index, or generate the evaluation | **Pre-existing**: identical 404 on old production | Compare both origins after the fix |
| M-03 | `GET /ontology/docs/vocab/sstim-vocab.ttl` returns 404, linked from the pyLODE vocabulary index | pyLODE links a sibling copy of the source that is not published beside the document | Low | None | Publish the sibling copy or rewrite the link | **Pre-existing**: identical 404 on old production | Compare both origins after the fix |
| M-04 | DBpedia Archivo record answers HTTP 406 where 200 is expected (`scripts/verify-registries.py`) | Not determined | Medium | None for this migration | Investigate Archivo's negotiation against the unchanged production W3ID target | Independent of the migration: production W3ID rules and the old site were not changed | Re-run `verify-registries.py` |
| M-05 | LOV control query did not answer 200, so the registry audit cannot distinguish absence from an outage | LOV timed out | Informational | None | Re-run when LOV responds | Unrelated to the migration | `verify-registries.py` reports `3 verified, 1 unreachable, 1 wrong` |

No migration-introduced failure was found.

## Maintain versus Admin access

GitHub's current
[repository-role matrix](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization)
confirms that `Maintain` is sufficient for ordinary migration implementation:
push branches and tags subject to rules, open and merge pull requests, edit
workflows, manage repository Actions variables/secrets, run Actions, create
Releases, and configure the
[Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
Creating Releases remains deliberately frozen until the integration audit and
Zenodo decision are complete.

Admin access is not needed only for Zenodo. It is also needed for:

- branch protection and repository rulesets;
- `github-pages` environment protection, reviewers and environment secrets
  ([GitHub requires Admin to configure an organization-repository environment](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments));
- repository Actions policy and default `GITHUB_TOKEN` permissions;
- webhook, deploy-key and installed-App audit/management;
- team/collaborator access and sensitive repository settings; and
- integrations that request repository-administration permission.

An organization owner may additionally be required for organization-wide
Actions/Pages policy, organization secrets/rulesets, OAuth/GitHub App approval,
and a Zenodo authorization constrained by the `w3c-cg` organization. Zenodo's
[current connection procedure](https://help.zenodo.org/docs/github/enable-repository/)
uses the linked user's GitHub authorization; the organization may still require
an owner to approve that application. Do not grant broad Admin solely on the
assumption that Zenodo needs it when an owner can perform the integration step.

The minimum administrator checkpoint is therefore: protect `main`; configure
Actions and the Pages environment; inspect hooks, deploy keys and installed
Apps; and record the Zenodo disposition. Zenodo is one item, not the only one.

## Registry update policy

Yes: mutable registry repository, homepage, documentation, issue and browser
links can be changed from the old GitHub organization to the W3C repository/site
after the target deployment is accepted. The registry record itself and its
persistent identifiers must be preserved.

Apply these distinctions:

- **BioPortal/OLS machine ingest:** change only after
  `https://w3c-cg.github.io/sstim/ontology/sstim-full.owl` is live, has the
  expected media type and hash, and is proven to contain the intended frozen
  release rather than a development build. This is a publication action, not a
  cosmetic link edit.
- **BARTOC:** update mutable URL/repository fields after target acceptance;
  preserve BARTOC node `21154` and `https://w3id.org/sstim`. Change publisher or
  steward only after the governance transfer is reflected in an accepted target
  deployment and the record owner confirms the intended publisher label.
- **Other registries:** preserve the `sstim` prefix, BioPortal ontology
  identity/acronym, FAIRsharing record `8494`, DOI identities, immutable release
  URLs/hashes and canonical SSTIM IRIs. Update only mutable location/contact
  fields whose new targets have passed acceptance.
- **W3ID:** remains a separate, explicitly approved final cutover. No registry
  update authorizes a production W3ID rule change implicitly.

No registry was modified during this checkpoint.

## Exact remaining sequence before W3ID cutover

Steps 1 to 7 of the original sequence are complete: protection is applied, Gate
G1 is decided, PR #1 passed the full matrix and was merge-committed, Actions
deployed at `/sstim/`, the live acceptance matrix was run, the old and new
deployments were compared, and the Pages build identifies the accepted commit.
What remains:

1. **Choose the parallel publication authority.** The two repositories are now
   deliberately divergent: target `main` carries the source history plus the
   migration commits, and source `main` does not. Either freeze structural and
   release changes on the source until cutover, or adopt a documented
   dual-publication process that deploys the same reviewed artifact to both
   hosts. Independent ontology or release changes must not be accepted in both
   repositories.
2. **Resolve ledger entry M-01**, the manifest path semantics. It decides
   whether the manifest routes can point at the project site at all.
3. **Rehearse rollback**: repoint target Pages to `pages/pre-migration-scaffold`
   and back, and prove the reverse staged W3ID rules pass.
4. **Obtain W3C status wording approval** for the site.
5. **Decide the GitHub Release and Zenodo relationship** for the target before
   any first tag operation there. Nothing has been minted or moved, and the
   organization integration audit (hooks, Apps, deploy keys) is still owed.
6. **Publish user transition instructions**, including PWA re-installation, and
   keep the old site reachable through the transition window.
7. **Update mutable repository, home and documentation links** in external
   registries. Move machine-ingest URLs only after their frozen artifacts are
   accepted. Ledger entry M-04 (Archivo 406) is worth resolving in the same
   pass, though it is independent of this migration.
8. **Obtain a separate explicit authorization for production W3ID cutover**,
   then open the `perma-id/w3id.org` pull request and require its authoritative
   tests.
9. **Monitor HTML and RDF content negotiation** after cutover. Keep old
   production operational as rollback and fallback. Archive or redirect it only
   through a later explicit decision.

## Questions for Pierre-Antoine Champin / W3C staff

1. Does W3C want any additional machine-readable classification beyond
   `LICENSING.md` for the Apache-2.0 Workbench and any future formally
   designated W3C Test Suite?
2. Who should be listed as publisher/steward in BARTOC, BioPortal and related
   registries after the governance move, without implying Recommendation status?
3. Which target administrator or organization owner can configure repository
   rules, Actions policy, the Pages environment and the required GitHub App/
   webhook audit?
4. Is a stateful/authenticated application considered acceptable on the shared
   `w3c-cg.github.io` origin, or should the Workbench use a dedicated origin
   while the specification and Graph Navigator remain on W3C Pages?
5. Should the historical Zenodo concept/version DOI relationship remain managed
   through the existing repository integration, be reconnected to
   `w3c-cg/sstim`, or be left frozen until a future CG release policy is agreed?

## Safe stopping point

The migration can stop here without affecting production. `w3c-cg/sstim` is the
history-complete source and an independent reviewer can reproduce that from a
fresh clone. The Pages artifact serves the SSTIM publication and reference
environment below `/sstim/`, with its refs protected and its scaffold preserved
on `pages/pre-migration-scaffold` for rollback.

What is deliberately **not** true, and is not claimed: production W3ID still
resolves through the old deployment, the manifest portability question (M-01) is
open, the parallel publication authority is unchosen, and the old repository is
neither archived nor redirected. Old production is healthy and serving
`e6b3948`.
