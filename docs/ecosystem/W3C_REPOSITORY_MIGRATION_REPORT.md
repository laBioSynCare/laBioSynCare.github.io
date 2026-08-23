# W3C repository migration report

- **Report date:** 2026-08-23
- **Migration source:** `laBioSynCare/laBioSynCare.github.io`
- **Migration target:** `w3c-cg/sstim`
- **Candidate site:** `https://w3c-cg.github.io/sstim/`
- **Status:** integration candidate complete locally; public import and target
  deployment blocked at Gate G0
- **Production W3ID cutover:** not performed
- **Old repository archival:** not performed

## Executive result

Migration to `w3c-cg/sstim` remains the recommended course. A complete-tree,
dual-default-history integration candidate has been built and validated. It
keeps the W3C repository's initial history, imports the current complete source
tree and source-main history, makes the application work at `/sstim/`,
establishes SSTIM Workbench branding, and stages the W3ID resolution contract
without changing production rules. The separately named preservation refs for
nine pull-request-only commits remain a post-G0 publication step.

The candidate is not yet published to a source-bearing target branch. That is
deliberate. The target's W3C contribution terms and the imported repository's
Apache-2.0, CC BY 4.0, and pre-Community-Group history need a written
classification and acceptance from the appropriate W3C/Community Group
authority. Publishing the imported history under `w3c-cg` before that decision
would be a governance and licensing action, even if the branch were not merged.

The following remote-safe work is complete:

- The migration decision and runbook were committed to source `main` as
  `6cf49c9edec2af6e626477ef8bd4095ce76c8e17` and pushed to
  `laBioSynCare/laBioSynCare.github.io`.
- The exact pre-migration W3C scaffold was pushed to
  `pages/pre-migration-scaffold` at
  `7d4a4a76a9d6eb8b6a49c7d5525bce5223c7b433`. This branch contains no imported
  source and is a recovery point, not a Pages source.
- Target `main` and its live scaffold Pages deployment remain unchanged.

## What was migrated in the local integration candidate

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
| Source tags | all 14 annotated tag objects and peeled commits retained locally |
| Object integrity | source mirror, target mirror and integration `git fsck` passed |
| Protected ontology tree | source and candidate both `02bb35531085bd0708441e6a43ef190a82f87666` |
| Production W3ID rules blob | source and candidate both `73617016e5139e98fb90cdc8fd86cdaf33c8f3d2` |

Nine additional source commits are reachable only through historical pull
request refs, not source `main` or the surviving branch heads. They are retained
in the audited source mirror. After G0, preserve them on the target under
explicit archival names such as `archive/source-pr-*`; GitHub's reserved
`refs/pull/*` must not be pushed. This is the one remaining Git-history
publication step.

The migration commits after the two-parent import are small, coherent stages:

1. `33622c7` — import complete SSTIM baseline with both histories;
2. `032edc1` — central project-page base-path support;
3. `04ac29d` — staged W3ID targets without production cutover;
4. `0e22efd` — SSTIM/SSTIM Workbench public identity; and
5. `c01cc9a` — direct-Node compatibility for the central URL resolver; and
6. `d9d2873` — deployment-aware audio resource test expectations.

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

All local checks below use the composed target-plus-source history. The live
target entries remain pending because publishing the source-bearing branch is
blocked at G0.

| Requirement | Status | Evidence |
|---|---|---|
| Git history preserved | **PASS for both default histories; archival publication pending** | two-parent merge, both roots/ancestry and `git fsck` pass; nine PR-only commits remain safe in the offline mirror until namespaced refs can be published after G0 |
| Existing W3C repository history preserved | **PASS locally** | all five original target commits remain ancestors |
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

## Failures, warnings and blockers

| Finding | Cause | Severity | Blocks cutover? | Recommended action |
|---|---|---:|---|---|
| Gate G0 unresolved | Target W3C contribution/report terms and imported Apache-2.0, CC BY 4.0 and pre-CG contributions need an authoritative disposition | **High** | **Yes; blocks source-bearing target push** | Record written W3C/CG classification, continued license treatment, attribution and future contribution pathway |
| Target Pages is still legacy `main`/root | The scaffold is already published directly from target `main` | **High** | **Yes** | Preserve recovery branch, switch Pages to Actions, configure the `github-pages` environment, and validate the draft branch before any merge to `main` |
| Target `main` lacks protection | No protection/ruleset was visible; Maintain cannot configure it | **High** | **Yes for safe stewardship** | Admin establishes required reviews/status checks, blocks force pushes/deletion, and requires merge commits for the import |
| Target integration inventory incomplete | Maintain cannot inspect Actions policy, hooks, deploy keys, installed Apps or all environment/org settings | **High for releases** | **Yes for tag/Release operations** | Admin/organization owner audits integrations, especially any release webhook/Zenodo app, before tags or Releases are recreated |
| Shared GitHub Pages origin | Browser storage and same-origin script access are origin-scoped, not path-scoped | **High for private/authenticated Workbench state** | **Yes for promises of private/stateful hosting; no for public spec/Graph deployment** | Obtain explicit threat-model acceptance or use a dedicated origin for stateful/authenticated Workbench features; keep target build credential-free meanwhile |
| Nine PR-only commits not yet published on target | GitHub pull-request refs cannot be mirrored to reserved target refs and G0 prevents source publication | **Medium** | **Yes for declaring complete remote history** | After G0, push audited commits under namespaced archival branches and record their mapping |
| Live target acceptance unavailable | Imported branch was intentionally not pushed/deployed | **High** | **Yes** | After G0/Admin preparation, push a draft integration branch and run CI plus live staged W3ID/browser acceptance |
| WIDOCO changelog uses the network | WIDOCO downloads immutable v0.16.0 from production when creating its changelog; its Nix package also warns about a missing default config file | **Medium** | No for current artifact; should be fixed for fully offline reproducibility | Vendor or explicitly supply the prior release input and remove the implicit network dependency in follow-up work |
| Optional `runtime-config.json` returns 404 in a credential-free build | Runtime configuration is deliberately optional and the target build contains no Firebase variables | **Informational** | No | Keep documented optional behavior; add a public config only after the shared-origin/security decision |
| Large JavaScript chunk warning | Current application graph produces bundles above Vite's warning threshold | **Low** | No | Track performance/code splitting separately; do not mix it into migration |
| Initial final root test run failed three audio URL assertions | The tests retained a hard-coded `/sstim` expectation after the URL resolver became matrix-aware; runtime behavior was correct | **Resolved** | No | Test expectations now derive from the validated deployment base; both 858-test matrices pass |

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
  steward only after G0 records the governance transfer.
- **Other registries:** preserve the `sstim` prefix, BioPortal ontology
  identity/acronym, FAIRsharing record `8494`, DOI identities, immutable release
  URLs/hashes and canonical SSTIM IRIs. Update only mutable location/contact
  fields whose new targets have passed acceptance.
- **W3ID:** remains a separate, explicitly approved final cutover. No registry
  update authorizes a production W3ID rule change implicitly.

No registry was modified during this checkpoint.

## Exact remaining sequence before W3ID cutover

1. Obtain written Gate G0 disposition for the pre-CG history, existing license
   split, W3C CG contribution pathway and non-normative Workbench classification.
2. Have a target Admin/organization owner protect `main`, configure Actions and
   the `github-pages` environment, and audit hooks, Apps, deploy keys and Zenodo.
3. Decide whether stateful/authenticated Workbench features are acceptable on
   the shared `w3c-cg.github.io` origin. Keep the public deployment local-only
   and credential-free unless/until that decision says otherwise.
4. Push the integration candidate as a non-main branch, plus audited namespaced
   archival refs and tags. Do not recreate Releases yet.
5. Open a draft pull request and require the full CI/build/validation matrix.
6. Deploy the branch through Actions at `/sstim/`, without changing production
   W3ID or the old repository.
7. Run the live acceptance matrix: routes/assets, Graph term links, Patch Studio,
   worklet/WASM, PWA scope/cache containment, SPARQL, generated docs, all RDF
   representations, contexts/profiles/schemas, immutable releases and staged
   W3ID rules.
8. Compare target artifacts and behavior with the old production deployment;
   resolve every cutover-blocking difference.
9. Merge with a merge commit only after review. Confirm the target Pages build
   identifies the accepted commit.
10. Update mutable repository/home/documentation links in external registries.
    Move machine-ingest URLs only after their frozen artifacts are accepted.
11. Obtain a separate explicit authorization for production W3ID cutover; open
    the `perma-id/w3id.org` pull request and require its authoritative tests.
12. Monitor HTML and RDF content negotiation after merge. Keep old production
    operational as rollback/fallback. Archive or redirect it only through a
    later explicit decision.

## Questions for Pierre-Antoine Champin / W3C staff

1. How should the complete pre-Community-Group Git history be recorded under
   `w3c-cg/sstim` while preserving its existing Apache-2.0/CC BY 4.0 licensing
   and attribution alongside future W3C CG contributions?
2. Is the complete non-normative SSTIM Workbench—including audiovisual engines,
   Graph Navigator and Patch Studio—accepted in the CG repository's `cg-report`
   scope, or should any W3C repository classification metadata distinguish it?
3. Who should be listed as publisher/steward in BARTOC, BioPortal and related
   registries after the governance move, without implying Recommendation status?
4. Which target administrator or organization owner can configure repository
   rules, Actions policy, the Pages environment and the required GitHub App/
   webhook audit?
5. Is a stateful/authenticated application considered acceptable on the shared
   `w3c-cg.github.io` origin, or should the Workbench use a dedicated origin
   while the specification and Graph Navigator remain on W3C Pages?
6. Should the historical Zenodo concept/version DOI relationship remain managed
   through the existing repository integration, be reconnected to
   `w3c-cg/sstim`, or be left frozen until a future CG release policy is agreed?

## Safe stopping point

The migration can stop here without affecting production. The source has the
reviewed decision/runbook, both repositories have backups, the W3C scaffold has
a recovery branch, the integration candidate is committed locally, target
`main` still serves its original scaffold, old production is healthy, and
production W3ID continues to resolve through the old deployment.
