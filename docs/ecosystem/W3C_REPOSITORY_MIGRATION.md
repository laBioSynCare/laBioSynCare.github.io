# Decision and staged migration plan: SSTIM to `w3c-cg/sstim`

- **Status:** approved migration; executed 2026-08-23. See the
  [final migration report](W3C_REPOSITORY_MIGRATION_REPORT.md)
- **Proposal/document date:** 2026-08-23
- **Decision authority and approval date:** Community Group migration approval,
  including the complete history, existing licenses, SSTIM, and the complete
  Workbench, confirmed by the repository rights-holder/maintainer on 2026-08-23
- **Gate G0 disposition:** passed on 2026-08-23; see
  [the licensing and contribution scope](../../LICENSING.md)
- **Gate G1 disposition:** passed on 2026-08-23; the shared-origin threat model
  is accepted for the public Workbench deployment (option 3), recorded in the
  Gate G1 section below
- **Scope:** repository stewardship and publication-host migration
- **Not authorized by this document:** production W3ID cutover, ontology
  redesign, relicensing, DOI changes, or archival of the existing repository

## Decision

Migrate the complete open repository to
[`w3c-cg/sstim`](https://github.com/w3c-cg/sstim), preserving both repositories'
Git histories, and make
[`https://w3c-cg.github.io/sstim/`](https://w3c-cg.github.io/sstim/) the parallel
publication site. Do so only through the gates and checkpoints in this document.

This is a **conditional recommendation in favour** of migration:

| Decision | Recommendation |
|---|---|
| Make `w3c-cg/sstim` the long-term repository home | Yes; the licensing and contribution-history disposition was recorded on 2026-08-23 |
| Import the complete specification, vocabulary, documentation, and open reference tooling | Yes; keep one repository and distinguish specification/conformance material, informative material, and reference software. Normative status exists only where CG governance explicitly designates it |
| Publish a working project site at `/sstim/` | Yes, after base-path, service-worker, and shared-origin data risks pass acceptance |
| Rename the public application from BSC Lab to SSTIM Workbench | Yes, narrowly at the project/UI layer and after the imported build works |
| Rename BSC framework, implementation, protocol, provenance, storage-format, or historical identities | No |
| Change any canonical `https://w3id.org/sstim...` IRI | No |
| Change production W3ID targets as part of the repository import | No; that requires a later, explicit cutover decision |
| Archive or redirect `laBioSynCare/laBioSynCare.github.io` now | No |

The distinction matters. Moving Git stewardship is desirable now. Moving the
publication site is technically feasible after remediation. Redirecting a
persistent identifier service is an independent production change and must come
last.

There is one material qualification: `w3c-cg.github.io` is a shared origin.
The public specification, generated documentation, Graph Navigator, SPARQL
interface, and reference authoring tools can live at `/sstim/`. A stateful
Workbench that promises private browser storage or enables authentication must
not be declared production-ready there until the Community Group has accepted a
shared-origin threat model or selected a dedicated application origin. This
does not argue against moving the repository; it is a deployment gate for the
stateful part of the Workbench.

## Why migration is the better course

### 1. It fulfils the repository's recorded governance direction

The current [Community Group charter](../../CHARTER.md) already says that the
public repository should move to a community-neutral GitHub organization once
the group is approved. The W3C Community Group repository now exists, its
initial history is small and preservable, and the inspecting maintainer has
`MAINTAIN` permission. This creates the technical path for the anticipated
transition. Gate G0 now records that approval for the complete history, existing
license split, SSTIM, and the complete non-normative Workbench. Operational
administration and production cutover remain separate later gates.

The [official group page](https://www.w3.org/groups/cg/sstim/) describes the
same vendor-neutral vocabulary/ontology scope. W3C's
[Community Group FAQ](https://www.w3.org/community/about/faq/) also makes the
status boundary explicit: Community Group work is not W3C-endorsed and does not
have W3C Recommendation status.

Neutral stewardship also makes the project's existing architecture easier to
understand:

- **SSTIM** is the open specification, vocabulary, semantic infrastructure,
  documentation, interoperability work, and community project.
- **SSTIM Workbench** is non-normative open reference software.
- **Graph Navigator** is the Workbench's semantic exploration interface.
- **Patch Studio** is its sensory-stimulation authoring and reference tool.
- **BioSynCare** remains a separate commercial implementation and ecosystem
  participant.

This is consistent with [ADR 0001](../decisions/0001-namespace-split.md),
[ADR 0007](../decisions/0007-framework-protocol-implementation.md), and the
current [public entrance architecture](../technical/PUBLIC_ENTRANCE.md).

### 2. SSTIM's identifiers are already decoupled from its publication host

SSTIM uses `https://w3id.org/sstim...` for persistent identifiers. GitHub Pages
is a retrieval and user-interface location, not the RDF namespace. The host can
therefore change without changing the ontology's identity, provided the
content-negotiation contract is preserved and production W3ID rules are changed
only after parallel validation. This follows
[ADR 0016](../decisions/0016-publication-obo-posture-and-registries.md).

### 3. Co-locating the specification and reference environment is valuable

The repository's strongest characteristic is the tested relationship between
formalized knowledge and executable authoring/exploration. Splitting the move
across repositories would add release coordination and version-skew risk without
solving a present technical problem. A single repository can still make the
authority boundary explicit: co-location does not make software normative.

### 4. The deployment model is portable

The application uses a static SvelteKit build, generated ontology documentation,
and static RDF distributions. None requires the old GitHub organization or a
user-site root in principle. The current implementation has many root-path
assumptions, but they can be resolved centrally without changing ontology
semantics or restructuring the repository.

### The strongest arguments against migration

The counter-case is substantive:

1. the source and target currently describe different licensing/contribution
   regimes;
2. a project site at `/sstim/` breaks current root-relative routing, PWA, audio
   worklet, WASM, and data-loading assumptions;
3. W3C organization hosting could cause readers to mistake Community Group work
   for a W3C Recommendation or endorsed technology;
4. a shared GitHub Pages origin is weaker isolation for browser-resident private
   data than the current dedicated origin; and
5. a careless string replacement could alter persistent publication contracts,
   provenance, or immutable releases.

These are reasons to gate and stage the migration, not reasons to retain
vendor-adjacent stewardship indefinitely. The conditions below directly address
them. If the licensing/history disposition or shared-origin data decision cannot
be resolved, the fallback is to move repository governance while retaining an
isolated runtime host for the stateful Workbench.

## Evidence base and measured impact inventory

This inventory was made before migration changes. It is a dated baseline, not a
claim that the repository will remain numerically identical.

The instruments were:

- complete review of `CLAUDE.md`, `ROADMAP.md`, `TODO.md`, the ontology current
  state and module architecture, the publication/profile/snapshot/PWA ADRs, the
  W3ID mirror and tests, portable-deployment and Patch Studio documents, public
  entrance documentation, contribution files, notices, and licenses;
- local Git inspection (`git status`, `git log`, `git rev-list`, tags and
  remotes);
- GitHub CLI/API inspection of both repositories, Pages configuration,
  workflows, releases, issues, pull requests, variables, and visible secret
  names;
- source searches with `rg` and route/static-tree inspection;
- direct HTTP checks against both Pages sites and the production W3ID service;
  and
- identifier checks with `scripts/locate-iri.py` and the ontology term index
  before classifying BSC identities.

### Repository and hosting snapshot

At 2026-08-23:

- Source `main` is `c4d966a590214a60cd84f2c8c0f639239bef9f14` and has
  485 reachable commits, 14 annotated tags, 14 GitHub Releases, two open issues,
  and twelve historical pull requests. Nine further commits are reachable only
  from eight historical source branches; importing `main` alone would not
  preserve the complete referenced history.
- All 14 source Releases are published, non-draft, non-prerelease records and
  have zero explicitly uploaded assets. GitHub's generated source ZIP/tar links
  are not Release assets and will have different repository URLs on the target.
- Target `main` ends at `7d4a4a76a9d6eb8b6a49c7d5525bce5223c7b433`
  and has five commits and five scaffold files: `README.md`, `CONTRIBUTING.md`,
  `LICENSE.md`, `CODE_OF_CONDUCT.md`, and `w3c.json`.
- No Git LFS objects, submodules, or Git notes were found in the source audit.
- The target Pages site is live using the legacy `main`/root source and currently
  serves only that scaffold. It does not yet serve the application, ontology,
  manifest, or worklets.
- The inspecting account has `MAINTAIN`, not `ADMIN`, permission on the target.
  The target Actions-policy API returned 403, so W3C organization allowlists,
  default token policy, and Pages administration require an organization
  administrator. Target `main` was unprotected and no repository rulesets were
  present at audit time.
- The source Pages deployment is workflow-built. At the audited commit, its
  latest Lint and Build (`32602348324`), Validate RDF (`32602348316`), and Deploy
  GitHub Pages (`32602348309`) runs were green. The old entrance, Graph
  Navigator, Patch Studio and SPARQL routes, manifest/context, WIDOCO, pyLODE,
  service worker, AudioWorklet JavaScript, and WASM answered the sampled checks
  successfully.
- Production `https://w3id.org/sstim` still redirects RDF retrieval to
  `https://labiosyncare.github.io/ontology/...`. This is the desired baseline
  during parallel validation. The checked-in `.htaccess` blob exactly matched
  the upstream `perma-id/w3id.org` SSTIM rules at audit time; sampled live HTML,
  Turtle, JSON-LD, RDF/XML, namespace, module, profile, immutable-release, and
  Graph Navigator routes passed. Unsupported N-Triples correctly returned 406.
- The source repository exposes seven `VITE_FIREBASE_*` values as GitHub Actions
  **variables**; the target exposes none. The visible repository-level Actions
  secret lists were empty. This cannot establish the absence of organization,
  environment, or locally held credentials. Firebase web configuration is not
  itself a cryptographic secret, but actual service credentials must never be
  copied into repository variables or files.
- Read-only baseline audits passed immutable checksums across 15 release
  directories, the 204-path/five-rule snapshot route audit, the 94-target W3ID
  inventory, and the manifest inventory of 18 modules and four profiles. A
  local release dry run was **INCOMPLETE**, not failed, because the host Python
  lacked `jsonschema`; the same commit passed pinned full CI. External registry
  verification was also **INCOMPLETE** because the audit environment could not
  reach the registries.
- The source has one active repository webhook subscribed to Release events;
  its endpoint is intentionally not recorded here and must not be assumed to be
  Zenodo without owner confirmation. The target hook/installed-App inventory was
  **INCOMPLETE** because `MAINTAIN` permission cannot inspect it. An administrator
  must audit those integrations before target tags or Releases are operated.

Git carries commits, trees, authorship, and tags. It does **not** carry GitHub
Release records, IDs, URLs, timestamps or assets; generated archive URLs; issues,
pull requests, reviews, discussions; Actions history/artifacts; deployment
history; webhooks/installed Apps; Pages settings; Actions variables, secrets or
environments; branch rules; repository permissions; topics/homepage; wiki or
discussion content; or stars/watchers/forks. Those are separate migration
inventory items, and some cannot be transferred. The old repository must remain
readable for historical review metadata even after its Git history is imported.

### Impact by area

| Area | Measured current state | Migration treatment | Gate |
|---|---|---|---|
| Git history | Source and target have unrelated, non-empty histories; nine source commits live only on eight non-main branches | Merge default histories with two parents and preserve every source branch under namespaced target refs; never force-push or squash the import | Import |
| Git tags/releases | 14 source tags/releases; no target tags/releases | Preserve tag object IDs; treat Release metadata and assets separately; do not trigger a new DOI accidentally | Release stewardship |
| Pages | Source uses Actions; target uses legacy Pages and serves its scaffold | Make build/upload/mounted-preview gates green, decouple the scaffold from `main`, then switch to Actions and deploy | Target deployment |
| SvelteKit | `adapter-static`, `trailingSlash: 'always'`, no `kit.paths.base` | Add one environment-driven base; root remains the default | Build |
| Runtime paths | Audit found 64 root-path assumptions across 23 source files | Replace through central route/asset resolution, not scattered `/sstim` literals | Build |
| Ontology loader | 28/28 manifest runtime URLs and 21/22 instance source URLs are root-relative | Resolve same-application URLs at runtime; do not reinterpret external or canonical IRIs | Graph/authoring |
| Worklet/WASM/audio | Worklet modules, WASM, and samples use origin-root URLs | Resolve URLs before loading while keeping `static/worklets/` outside Vite's module graph | Patch Studio |
| PWA manifest | `id`, `start_url`, `scope`, and icons use `/` | Use deployment-relative values or generated base-aware values | PWA |
| Service worker | Registered at `/service-worker.js`; offline fallback is `/` | Register below the base, use `$service-worker` base for fallback/scope | PWA |
| Cache cleanup | Activation deletes every other CacheStorage cache on the origin | Delete only caches with an SSTIM-owner plus normalized-deployment-base prefix | **Target Workbench deployment blocker** |
| Fetch interception | Current guard excludes other origins but not sibling paths on `w3c-cg.github.io` | Intercept/cache only same-origin requests whose pathname is inside the SSTIM deployment base | **Target Workbench deployment blocker** |
| Browser storage | Local storage/IndexedDB are origin-wide, not path-isolated | Decide whether stateful/private features need a dedicated origin; namespacing prevents collisions, not access | **Security decision** |
| Graph deep links | A namespace hash term requests only the W3ID root; the browser retains the fragment and the home page forwards it. Slash-entity rules directly target Graph Navigator CURIE fragments | Stage the root HTML target as `/sstim/`, make the home forwarder base-aware, and separately stage slash-entity targets as `/sstim/graph/#...` | Graph/W3ID |
| Generated docs | WIDOCO and pyLODE are deployed under `/ontology/docs/` | Make asset/cross-link output work under `/sstim/ontology/docs/`; keep ontology namespace links canonical | Documentation |
| Publication URLs | Live generators/tests and current manifest name the old Pages host | Classify every occurrence as canonical, production route, live distribution, test fixture, historical record, or public link before changing it | Publication |
| Immutable releases | Frozen snapshots contain historically correct bytes and URLs | Hash before/after; never rewrite | **Release blocker** |
| W3ID | Checked-in `.htaccess` is a mirror of upstream production rules | Keep it unchanged during staging; test a separately parameterized migration ruleset | Cutover |
| DOI/registries | Concept DOI `10.5281/zenodo.21286974`, current v0.16.0 DOI `10.5281/zenodo.22003777`, and external records refer to current publication/history | Verify ownership and integration behavior; do not update or mint during technical migration | Release cutover |
| Branding | Public UI says BSC Lab; RDF contains real BSC framework/implementation identities | Rename only project/UI uses; maintain a semantic-review ledger | Branding |
| Licensing | Source is Apache-2.0 plus CC BY 4.0; target scaffold describes W3C contribution/report/test terms | Obtain written treatment of the pre-CG import and future contributions; preserve existing license/provenance files | **Import blocker** |
| W3C status | Checked-in charter still says not ratified | Verify current status; use “W3C Community Group work,” never “W3C standard” or “endorsed” | Governance |

### URL and identifier disposition

Build a line-level ledger from source search before editing URLs. Use these
defaults:

| Occurrence class | Example | Default disposition |
|---|---|---|
| Canonical SSTIM IRI | `https://w3id.org/sstim#...`, `/vocab#...`, `/exposure#...` | Preserve exactly |
| Historical or frozen publication value | Old Pages URL inside an immutable release, prior-art record, release note, or provenance statement | Preserve exactly |
| Current production W3ID target/rule test | Old Pages targets in the `.htaccess` mirror and its authoritative tests | Preserve during staging; change only in the separately authorized cutover |
| Staged W3ID target | Temporary mapping to `https://w3c-cg.github.io/sstim/...` | Parameterize in a separate test configuration; do not commit it as production truth |
| Mutable live distribution metadata | Current manifest, VoID/DCAT, generator, or generated live document | Review meaning and downstream contract; update only after target acceptance and explicit authorization for each governed file |
| Schema/context identifier | A schema `$id` or context URL that happens to use the old Pages host | Treat as a possible data-contract identifier; semantic review before any change |
| Same-application route/asset | `/graph/`, `/creator/`, `/ontology/...`, `/worklets/...` | Resolve through the central deployment-base layer |
| Current repository/public UI link | Source GitHub URL in navigation, current README, issue template, or contribution instructions | Change after the target becomes authoritative |
| DOI or external registry record | Zenodo, BioPortal, FAIRsharing, KG Catalog, OLS | Leave unchanged until its own reviewed post-cutover step |
| BSC identity/provenance | `.../framework/bsc`, `.../implementation/bsclab` | Preserve; repository branding is irrelevant to what the RDF entity denotes |

An old URL is not necessarily stale, and a root-relative URL is not necessarily
an ontology identifier. Classification precedes replacement.

### Artifact and authority boundary

| Repository material | Role after migration | Normative status |
|---|---|---|
| Ontology modules, SKOS vocabulary, profiles, SHACL, contexts, mappings, conformance requirements, and specification text | SSTIM technical deliverables | Whatever the CG explicitly designates; proximity alone confers no status |
| Generated WIDOCO/pyLODE documentation | Publication views of SSTIM artifacts | Informative unless a governing document says otherwise |
| SSTIM Workbench, Graph Navigator, SPARQL interface, Patch Studio, engines, demonstrators, fixtures, adapters, and developer tooling | Open reference implementation and conformance support | Non-normative |
| BSC Framework, BSC Lab implementation, Patch Studio component records, protocols, provenance, and historical releases | Preserved modeled entities and records | Their existing semantic status; names do not change with UI branding |
| BioSynCare records and optional integration adapters | Separate ecosystem participant/integration | Not the identity or governing implementation of SSTIM |

## Non-negotiable invariants

The migration must preserve all of the following:

1. Every canonical `https://w3id.org/sstim...` namespace and IRI.
   Do not mint a replacement namespace, including under `w3.org/ns`.
2. The exact bytes of every immutable release snapshot and historical artifact.
   The three defensive publications named by `CLAUDE.md` remain untouched.
3. Existing ontology semantics, mappings, evidence claims, profile closures,
   SHACL contracts, and released contexts unless a separately authorized
   semantic change names the affected files.
4. Real BSC/BSC Lab framework, implementation, component, protocol, model-tag,
   provenance, and instance identities.
5. Both Git histories and the exact source tag targets.
6. Existing author attribution, `NOTICE`, licenses, and historical contribution
   provenance unless authorized parties explicitly agree otherwise.
7. The old production Pages deployment and production W3ID routes throughout
   parallel validation.
8. Audio invariants: the engine audio context remains the sole timing clock,
   worklets remain runtime-loaded static files, and worklet processing allocates
   nothing.
9. PWA safety: no automatic session reload; no interception outside both the
   application origin **and** deployment path; and no eager precaching of heavy
   ontology/audio assets.
10. Wellness-only public claims and the distinction between SSTIM and
    BioSynCare.

No global URL or branding replacement is permitted. Each occurrence must be
classified before it changes.

## Decision gates

### Gate G0 — repository-import governance, license, and contribution history

**Disposition: PASSED, 2026-08-23.** The repository rights-holder/maintainer
confirmed that Community Group approval covers:

- importing the complete source history while retaining the target scaffold
  history;
- retaining Apache-2.0 for software and CC BY 4.0 for the ontology,
  vocabulary, documentation, and other already designated material;
- importing SSTIM and the complete Workbench into the same repository; and
- presenting the Workbench, Graph Navigator, and Patch Studio as
  non-normative reference software rather than automatically making them CG
  Reports or normative specification components.

The implemented path/artifact matrix and contribution boundary are recorded in
[LICENSING.md](../../LICENSING.md). It preserves the imported grants and
attribution, does not claim retroactive CLA assent, and explains how future W3C
CG contributions coexist with the historical baseline. The target's
`LICENSE.md` remains as governance/category guidance, not a blanket relicensing
of imported work.

Also review `CITATION.cff` and `.zenodo.json`: both currently classify the
combined artifact as software while naming only CC BY 4.0, and `.zenodo.json`
names the old repository as `isSupplementTo`. Record the intended
citation/license/repository presentation rather than mechanically changing
either file during the import.

`CITATION.cff` and `.zenodo.json` remain byte-for-byte unchanged during import.
Their combined-artifact presentation and the existing Zenodo relationship need
review before a future target Release, but do not block a source branch, tags,
or history-only archival refs. No GitHub Release or DOI event is part of this
gate.

**Gate classification:** passed for publishing the source-bearing integration
branch, annotated historical tags, and namespaced archival refs. It does not
authorize production W3ID changes, registry edits, GitHub Release recreation,
DOI changes, or archival of the old repository.

### Gate G1 — public Workbench shared-origin deployment decision

Record one of these decisions:

1. the W3C Pages deployment is public/reference-only and stores no data that is
   represented as private;
2. the Workbench's stateful/private surface runs on a dedicated origin while the
   source remains in the same repository; or
3. the CG explicitly accepts the shared-origin threat model after security and
   privacy review.

Choosing the public/reference-only option requires a feature-and-copy matrix.
The current UI describes annotations and logbooks as private and author-owned;
omitting Firebase variables does not remove local persistence or those promises.
Either disable the affected persistence/authentication surfaces and revise the
claims, use a dedicated origin, or explicitly accept the shared-origin trust
boundary.

At minimum, fix origin-wide cache deletion and sibling-path fetch interception
before replacing the target scaffold with the Workbench/application artifact. A
cache name prefix prevents accidental deletion but does not isolate localStorage
or IndexedDB from other pages on `w3c-cg.github.io`.

Treat every publisher and root-scoped service worker on that origin as part of
one trust boundary. Path/key prefixes are collision controls, not isolation for
DOM/window relationships, cookies, Web Storage, IndexedDB, CacheStorage, or
Firebase browser tokens.

**Gate classification:** this does not block Git-history import. It blocks
publishing the stateful Workbench at the shared origin. Its exit evidence is the
approved option, the implemented feature/copy matrix, and browser tests of the
resulting storage/authentication posture.

**Disposition, recorded 2026-08-23.** Option 3: the shared-origin threat model
is accepted for the public Workbench at `https://w3c-cg.github.io/sstim/`,
confirmed by the repository rights-holder and maintainer. What the acceptance
does and does not cover, stated here so nobody has to reconstruct it later:

- The two isolation defects this gate named are **fixed in code, not waived**.
  `src/service-worker.js` derives its cache names from a prefix carrying the
  deployment mount and retires only caches under that exact prefix, and its
  `fetch` handler returns early for any same-origin path outside the deployment.
  A request from an SSTIM client to a sibling project path is therefore neither
  handled nor cached by the SSTIM worker.
- What is **accepted rather than fixed** is Web Storage and IndexedDB. The
  platform scopes both to the origin, so annotations, logbooks and Settings
  written by the Workbench are readable by any other page published under
  `w3c-cg.github.io`. The "private" visibility chip in the annotation panel
  means "not published to the ecosystem graph", never "isolated from other pages
  on this origin".
- The deployed build carries **no Firebase configuration and no authentication
  surface**, so no credential or browser token is exposed by this acceptance.
  Enabling authentication later reopens this gate; it does not inherit this
  answer.
- If the posture is later rejected, the remedy is a dedicated application origin
  (option 2). That changes the deployment target, not the repository layout, and
  the central base strategy from Checkpoint 3 is what keeps it a configuration
  change.

### Gate G2 — checkpoint owners and operational authority

Name:

- the source maintainer;
- the target repository maintainer who will merge the unrelated-history pull
  request;
- the Pages/Actions administrator;
- the W3ID pull-request owner;
- the release/DOI owner; and
- the person who signs the acceptance report.

Each operator must be named before the state-changing checkpoint they own. The
release/DOI owner must be active before the first target tag operation, because
Checkpoint 2 must resolve webhook/App and deposit side effects. Only the W3ID
and archival roles may remain dormant until cutover.

## Checkpointed execution runbook

Every checkpoint ends in a usable, reviewable state. Do not begin the next one
until its exit criteria are recorded.

### Checkpoint 1 — freeze and record the baseline

1. Announce a short migration window for structural/deployment changes. Normal
   work may continue until the window begins.
2. Record source and target default-branch commit IDs, complete ref lists, tag
   object IDs, GitHub Release inventory/assets, open issues, Pages settings,
   workflow/variable/environment names, and repository permissions.
3. Create independent mirror clones or bundles of both repositories. Validate
   them with `git fsck --full` and retain them outside either working tree.
4. Run an approved, non-disclosing credential/secret scan across every imported
   ref and the complete object history, not only the current tree. If it finds a
   credible credential, stop before the first W3C push, revoke/rotate it, record
   only the finding class and remediation, and obtain explicit security/legal
   direction before considering any history rewrite.
5. Export a file-hash inventory for every immutable ontology release directory.
6. Capture production HTTP status, `Location`, `Content-Type`, `Vary`, CORS, and
   body hashes for the existing W3ID negotiation matrix.
7. Capture browser evidence for the current entrance, Graph Navigator term deep
   links, SPARQL interface, Patch Studio starters/import/export/audio, PWA
   installation/update, offline navigation, and local/private sync behavior.
8. Record current failures; a pre-existing failure is baseline evidence, not a
   reason to weaken a later gate.

**Exit evidence:** two restorable Git backups, two ref inventories, immutable
hash manifest, a non-disclosing full-history scan report, W3ID response capture,
application baseline report, and a clean source worktree.

**Safe stop:** no remote state has changed.

### Checkpoint 2 — combine both Git histories on an integration branch

Work in a fresh clone of the target, not the everyday source checkout. A typical
sequence is:

```bash
git clone https://github.com/w3c-cg/sstim.git sstim-integration
cd sstim-integration
git remote add legacy https://github.com/laBioSynCare/laBioSynCare.github.io.git
git ls-remote --tags origin
git ls-remote --tags legacy
git fetch legacy \
  'refs/heads/*:refs/remotes/legacy/*' \
  'refs/tags/*:refs/tags/*'
git switch -c migration/import-complete-source origin/main
git merge --no-ff --no-commit --allow-unrelated-histories legacy/main
```

Run the tag fetch only after the two `ls-remote` inventories show no name
collision. The target had no tags at the audit date, but the operator must
recheck rather than rely on that dated observation.

Resolve scaffold overlaps deliberately:

- preserve `w3c.json`, the W3C code of conduct, and the target's contribution
  and license-policy information;
- preserve source `LICENSE`, `LICENSE-ontology`, `NOTICE`, attribution, and
  contribution history, placed and explained according to the approved G0
  path/scope matrix rather than left in ambiguous coexistence;
- compose the README/contribution entry points so they distinguish CG technical
  deliverables from non-normative reference software; and
- do not let either side of a conflict disappear merely because Git chose an
  “ours” or “theirs” version.

Inspect `git status --short` and stage each reviewed conflict resolution with an
explicit `git add path` command. Then create the two-parent import commit:

```bash
git status --short
git commit -m "chore: import SSTIM technical baseline with preserved history"
git show --no-patch --format='%H %P' HEAD
git rev-list --max-parents=0 HEAD
```

Compare the two parent IDs printed by `git show`, in order, with the frozen
target and source tips, and confirm the final command retains both repositories'
original roots. Unexpected parents or roots stop the import.

Create a real merge commit with both tips as parents. First push the integration
branch and open a **draft** pull request. Do not merge it at this checkpoint:
continue Checkpoints 3–6 on this branch (or reviewed branches stacked on it),
and coordinate the final merge with the Pages switch in Checkpoint 4. For this
import, the final target merge must use GitHub's **merge commit** method. A
squash or rebase merge would make the source history unreachable from target
`main` and fails the migration.

Before merging, prove both original tips are ancestors of the proposed result:

```bash
git merge-base --is-ancestor origin/main HEAD
git merge-base --is-ancestor legacy/main HEAD
git fsck --full
```

The merge makes source `main` reachable, but it does not preserve commits held
only by other source branches. Create and push non-force, namespaced target
branches for every audited source branch:

```text
legacy/labiosyncare/main
legacy/labiosyncare/feat/ontology-exposure-conditional
legacy/labiosyncare/feat/ontology-p2-skos-structure
legacy/labiosyncare/feat/ontology-p0-semantics
legacy/labiosyncare/feat/ontology-breathing-invariant-shacl
legacy/labiosyncare/feat/ontology-martigli-voice-shapes
legacy/labiosyncare/docs/adr-0012-martigli-voice-parameters
legacy/labiosyncare/feat/ontology-shacl-p1-shapes
legacy/labiosyncare/fix/ontology-shacl-quickwins
```

Generate this mapping from the recorded ref inventory rather than treating the
list above as timeless; add any branch created before the freeze. Push legacy
branches through explicit source-ref/destination-ref pairs; never use a mirror
push. For example, the main compatibility ref is:

```bash
git push origin \
  refs/remotes/legacy/main:refs/heads/legacy/labiosyncare/main
```

Repeat that explicit mapping for every frozen branch above. Then dry-run the
tag push, inventory target webhooks/GitHub Apps and release integrations, confirm
that neither tag pushes nor later Release creation can invoke Zenodo or another
publisher unexpectedly, and push the exact tag refs:

```bash
git push --dry-run origin 'refs/tags/*:refs/tags/*'
git push origin 'refs/tags/*:refs/tags/*'
```

Preserve annotated tag objects and verify exact name-to-tag-object-ID and
peeled-commit-ID maps. Do not create target GitHub Releases yet: that can invoke
DOI/release automation and is governed separately.

Create a Release ledger for all 14 source records: tag, title, body hash, author,
source URL, created/published timestamps, draft/prerelease state, and explicit
asset count. A recreated target Release necessarily receives new GitHub IDs,
URLs, and timestamps, so recreation is not metadata preservation. Defer it or
record explicit approval and linkage to the historical record; never present a
recreated timestamp as the original publication date.

GitHub issues, pull requests, reviews, and Release records do not migrate with
Git. Link to the old repository as the historical tracker. Port only still-open
issues through a documented process that preserves authorship links and does not
misrepresent the importer as the original author.

**Suggested commit:** `chore: import complete SSTIM and BSC Lab history`

**Exit evidence:** both default-branch tips are ancestors of the draft branch,
target scaffold history is intact, every frozen source branch tip is reachable
through its namespaced target branch, source tags resolve to the same object
and peeled commit IDs, `git fsck` passes, the approved
path/license/contribution matrix is
implemented in repository notices, and the draft PR is configured for a later
non-squashing merge.

**Safe stop:** before the first push, discard the local clone. After pushing,
close the integration PR; both original default branches and the target scaffold
remain unchanged, but the namespaced branches/tags are now target repository
state. Retain them as a quarantined, documented import unless a separately
approved destructive cleanup says otherwise.

### Checkpoint 3 — make one build work at both `/` and `/sstim/`

Do this before broad branding changes so functional regressions are attributable
to migration infrastructure.

#### Central path strategy

1. Add a single environment-driven `kit.paths.base` in `svelte.config.js`.
   Default to the empty base for the existing root deployment; target CI sets
   `/sstim` (without a trailing slash).
2. Add one application URL module built on SvelteKit's `$app/paths` `resolve()`
   for routes and `asset()` for static resources. Route links,
   generated-document/publication links, runtime fetches, samples, and worklet
   module URLs use that layer.
3. Teach the RDF loader to prepend the application base only to same-application
   root paths. Absolute `http(s)` URLs, `https://w3id.org/sstim...` IRIs, named
   graph IRIs, and other logical identifiers pass through unchanged.
4. Compute active navigation from logical route identity rather than comparing a
   base-prefixed pathname with root literals. Resolve query strings and Graph
   fragments without losing either.
5. Make the Vite development middleware strip and validate the configured base
   before it maps generated/static paths. Separately exercise the built artifact
   through an exact mounted-base preview; the two checks cover different code
   paths.
6. Never hard-code `/sstim` in runtime components, engines, or ontology data.
   Tests receive the configured expected base from one fixture/environment;
   end-to-end acceptance specifications may of course assert the literal target
   URL.

#### Audio, worklet, and WASM requirements

- Resolve the worklet module and sample/WASM asset URLs in the main application
  before loading.
- Keep every processor in `static/worklets/` and load it by URL. Never import a
  processor into Vite's module graph.
- Resolve WASM relative to the deployed worklet URL or pass an already resolved
  URL from the main thread.
- Run actual-browser audio start/stop and output tests; a successful build does
  not prove an AudioWorklet loaded.
- GitHub Pages ignores the repository's `static/_headers`; do not claim
  COOP/COEP, `SharedArrayBuffer`, or threaded-WASM support there. This does not
  block the current non-threaded WASM path. Test the real Pages response MIME
  type, `WebAssembly.compile`, and AudioWorklet+WASM mode explicitly.

#### PWA requirements

- Make manifest `id`, `start_url`, `scope`, and icon sources relative to the
  manifest or generate them from the deployment base.
- Register the service worker under the application base and verify its scope is
  `/sstim/`, not `/`.
- Use `$service-worker`'s base for the offline shell fallback.
- Prefix cache names with the application owner **and normalized deployment
  base**, followed by the version. Delete only prior caches with that exact
  owner/base prefix, so root, `/sstim`, and preview deployments cannot delete one
  another's caches. Never delete every non-current cache on the origin.
- Seed a non-SSTIM CacheStorage entry before activation and prove it survives an
  SSTIM install/update.
- Intercept/cache only same-origin requests whose pathname is inside the SSTIM
  base. A worker scoped to `/sstim/` can still see a controlled page's fetch to
  `/another-project/...`; that request must pass through without caching.
- Preserve explicit user-controlled update/reload and lazy caching of heavy
  assets.
- Test update from version N to N+1 with an active Patch Studio session.

The offline acceptance contract is specific: home and prerendered shells reload
after install; Graph works after its ontology was first fetched/cached; Patch
Studio synthesis works with its precached worklet/WASM; sample audio works only
after first-use caching; an unavailable external live ecosystem degrades
explicitly; unvisited heavy ontology/audio assets are not promised offline; and
an N→N+1 update never reloads an active session before the user's action.

#### Static and generated material

- Ensure every prerendered route has a project-site `index.html` and direct URL
  navigation succeeds.
- Serve ontology, schemas, contexts, profiles, manifests, samples, worklets,
  WASM, icons, generated WIDOCO, and generated pyLODE output below `/sstim/`.
- Keep canonical metadata IRIs on `w3id.org`.
- Treat the live ontology manifest as governed publication material. Prefer a
  runtime resolver for its root-relative retrieval paths; do not edit frozen
  manifests. Any later update to mutable distribution metadata must name the
  affected live files explicitly and run the full ontology gate.

#### Public manifest portability decision

An application-side resolver fixes first-party Graph/Workbench loading but does
not by itself make the public manifest portable. All 28 current runtime values
start at `/ontology/...`; an ordinary external consumer resolving those values
against `https://w3c-cg.github.io/sstim/ontology/manifest.json` can escape to the
organization root.

Before accepting the target manifest endpoint, define whether those values are:

- logical application-root paths that require an explicit deployment-base
  contract/resolver;
- ordinary URI references that the mutable live manifest/schema must make
  portable; or
- inputs to a clearly distinguished deployment-specific manifest view.

If portability requires a live manifest or schema change, obtain explicit
authorization naming those governed files and run the full ontology/publication
gate. Never change frozen manifest bytes, persistent route shapes/IRIs, or
semantics. A separately authorized W3ID cutover may change only their retrieval
target after proving the returned bytes are identical.

If `/ontology/...` is judged to be an ordinary URI reference whose portability
would require a byte change, frozen manifests cannot be repaired. Their W3ID
manifest targets must remain on a compatible root-hosted origin, or the affected
routes block cutover to the project site. Acceptance must exercise all 28
manifest runtime values, all 21 local `INSTANCE_URLS` through the chosen base
contract, and the one external instance URL unchanged.

Update the as-built documentation in the same change.
`docs/technical/PWA_SERVICE_WORKER.md` and
`docs/technical/PORTABLE_DEPLOYMENT.md` must describe the project-base build,
shared-origin boundary, and retained empty-base Nix/OCI behavior. Add dated
migration notes to ADR 0009 and ADR 0023 rather than erasing their original
root-hosted rationale.

Build and test at least these two modes from the same commit:

| Mode | Base | Purpose |
|---|---|---|
| Legacy/root | empty | Prove the existing deployment is not broken |
| W3C project site | `/sstim` | Prove the target layout |

Serve the project-site artifact behind `/sstim/` locally or in an isolated
preview; serving `dist/` at `/` is not a valid project-base test.

The minimum mounted-base browser matrix directly loads and navigates among:

- `/sstim/`, `/sstim/graph/`, `/sstim/creator/`, `/sstim/sparql/`,
  `/sstim/presets/`, `/sstim/logbook/`, `/sstim/profile/`, `/sstim/settings/`,
  and `/sstim/about/`;
- the four `/sstim/field/...` compatibility routes and their Patch Studio
  destinations;
- `/sstim/creator/?starter=field`, `tree`, `abstract`, and `landscape` variants;
- `/sstim/#StimulationMechanism` and
  `/sstim/graph/#StimulationMechanism`; and
- a deliberately unknown route, which must remain a real 404.

Crawl the network log as part of that test. No same-application request may
escape to organization-root `/ontology/`, `/worklets/`, `/audio/`, `/icons/`,
or another root-relative route. Exercise Vanilla, AudioWorklet,
AudioWorklet+WASM, and Null engine modes where the current engine matrix supports
them, and verify the worklet, WASM MIME type/compilation, samples, and existing
safety behavior—not only HTTP 200 responses.

**Suggested commits:**

- `fix: centralize base-aware routes and static assets`
- `fix: scope SSTIM PWA and caches to the project deployment`
- `docs: document root and project-base deployment contracts`
- `test: exercise root and project-site builds`

**Exit evidence:** both builds pass; `/sstim/` browser tests cover navigation,
RDF loading, worklets/WASM, and offline/update behavior; no literal `/sstim`
prefixes are scattered through runtime code.

**Safe stop:** the old deployment continues to build from the empty-base mode.

### Checkpoint 4 — adapt CI and target repository configuration

1. Preserve the current validation gates. Parameterize deployment location;
   never skip a failing ontology, reasoning, W3ID, documentation, or application
   job to obtain a green Pages deployment.
2. Run root and `/sstim` application builds in CI. Run the authoritative
   ontology suite once against the same source commit unless a gate is itself
   deployment-path-specific. Supply the application base before the Svelte/Vite
   build starts; a later `configure-pages` step cannot repair already emitted
   routes or asset URLs.
3. Prepare target deployment verification for
   `https://w3c-cg.github.io/sstim/` and ensure `build-info.json` will be checked
   below that base. Before the merge, apply the same verifier to the exactly
   mounted preview/artifact rather than pretending it is already live.
4. Give the Pages job the minimum required `contents: read`, `pages: write`, and
   `id-token: write` permissions. Review/update the existing `github-pages`
   environment and its custom branch policy, which currently permits `main`.
5. Preserve the target's original scaffold tip on a named, non-force-updated
   recovery branch such as `pages/pre-migration-scaffold`. Have an administrator
   point legacy Pages at that branch and verify the public scaffold is unchanged.
   This decouples Pages from target `main` before the import merge.
6. Add a target `main` ruleset/branch protection that requires pull requests and
   the authoritative checks and prohibits force pushes and branch deletion.
   Protect the `legacy/labiosyncare/**` archival branch namespace from force
   update/deletion as well, because it is the only target ref for nine audited
   non-main commits, and protect imported version tags from update/deletion.
   Target settings currently enable merge, squash, and rebase; temporarily
   disable squash/rebase for the import or use a controlled explicit merge
   operation, then repeat ancestry verification so a UI misclick cannot lose
   history.
7. Confirm with a W3C organization administrator that required third-party
   Actions, Pages OIDC, default token permissions, and Nix jobs are permitted.
   Obtain a non-secret settings record covering the Actions allowlist,
   organization SHA-pinning policy, default `GITHUB_TOKEN` permissions, fork-PR
   policy, and environment policy. Current workflows use mutable major action
   tags; if W3C policy requires immutable SHAs, pin reviewed SHAs rather than
   weakening the organization policy. Keep Pages on the preserved scaffold
   branch until Checkpoint 7.
8. Recreate required GitHub Actions **variables** in the target through its
   settings/API, not commits. Inventory environment/organization settings that
   the repository API cannot reveal.
9. If Firebase-backed functions are retained, add the target host to authorized
   domains and test sign-in, Firestore rules, network-offline behavior, and
   logout. Do not enable these features before Gate G1.
10. If W3C organization policy blocks Pages, Actions, packages, or the required
   permissions, record the exact setting/administrator action. Do not weaken
   tests or embed credentials as a workaround.

**Suggested commit:** `ci: build and deploy SSTIM at the project-site base`

**Exit evidence:** draft-PR validation is green; the complete generated artifact
has the expected tree and passes an exact `/sstim/` mounted preview; target rules
and required Actions permissions are confirmed; and the recovery branch still
serves the original scaffold.

**Safe stop:** leave legacy Pages on the preserved scaffold branch and keep the
integration branch/CI artifact for review. Target `main` has not been merged.

### Checkpoint 5 — preserve publication contracts and stage W3ID resolution

Separate four values in code and tests:

1. canonical IRI base: always `https://w3id.org/sstim`;
2. production publication target: remains the old Pages host during staging;
3. staged publication target: `https://w3c-cg.github.io/sstim/`; and
4. application path base: `/sstim` on the target, empty on the legacy site.

Do not obtain staging by editing the production `.htaccess` mirror. Generate or
maintain an explicit temporary ruleset/test configuration whose only difference
is the publication target. Exercise it against the built target artifact.

The staged matrix must cover:

- namespace root and hash terms;
- Turtle, RDF/XML, JSON-LD, HTML, absent/`*/*`, unacceptable, and weighted
  `Accept` headers as supported by the current contract;
- exact module endpoints and the Exposure namespace/module distinction;
- profiles;
- vocabulary and generated documentation;
- manifest, manifest schema, JSON-LD contexts, schemas, VoID, and DCAT;
- every immutable/versioned artifact;
- BSC programme/framework/implementation/component records without renaming;
- ecosystem and reference-record routes;
- Graph Navigator fragments for both SSTIM terms and BSC instance identities;
  and
- deliberately unknown version-shaped paths, including the wildcard-routing
  behavior adopted by ADR 0053.

For each request, compare status chain, `Location`, media type, CORS/`Vary`, body
hash, and final target. The staged target must serve the same RDF bytes where the
production contract serves a frozen or generated distribution.

A fragment is never sent in the HTTP request. For
`https://w3id.org/sstim#StimulationMechanism`, the staged rules test therefore
verifies a namespace-root HTML `Location` at target `/sstim/`. Before production
cutover, prove client behavior by navigating a real browser directly to
`https://w3c-cg.github.io/sstim/#StimulationMechanism`; the base-aware home page
must forward the preserved fragment and select the term in Graph Navigator.
Separately prove that the canonical W3ID browser path still works on old
production. `curl` cannot establish client-side selection, and an end-to-end
canonical-W3ID-to-new-site browser test is reserved for the authorized cutover.
Test slash-entity rules separately: they intentionally emit direct
`/sstim/graph/#CURIE` targets and must preserve the fragment without
percent-encoding.

Give documentation generators one deployment/public URL parameter (for example,
`APP_PUBLIC_URL`) that is separate from both canonical IRI configuration and
`kit.paths.base`. Generate WIDOCO from a configured/temporary properties input
rather than baking the old or new Pages host into the shared ontology identity;
this allows root and target outputs to coexist.

Run WIDOCO and pyLODE from clean, pinned CI inputs and crawl their **actual
generated output**. The normal Svelte build only copies documentation
placeholders; it does not prove the later Pages generation step. Verify internal
assets, term links, cross-links to Graph Navigator, version metadata, and output
directories under `/sstim/ontology/docs/`. A canonical ontology link must still
use W3ID; only a publication/navigation link uses the Pages host.

**Suggested commit:** `test: validate staged W3ID targets without changing production`

**Exit evidence:** the staged negotiation matrix and documentation link checker
pass, while a diff proves the production mirror/upstream W3ID rules are
unchanged.

**Safe stop:** discard the temporary staging rules/configuration; production
resolution was never changed.

### Checkpoint 6 — establish SSTIM information architecture and branding

Make the imported repository build first. Then change only current public
project/application surfaces.

Preferred public structure:

```text
SSTIM
├── Specification
├── Vocabulary
├── Documentation
├── Graph Navigator
├── Workbench
│   └── Patch Studio
├── Interoperability
├── Implement
└── Community
```

Prefer navigation and documentation separation over moving source directories.
Every specification-facing page should say whether it is a CG technical
deliverable, generated view, draft, or informative material. Every software
surface should say that it is non-normative reference tooling.

Use this public naming rule:

| Existing use | Treatment |
|---|---|
| Repository/application as a whole called “BSC Lab” | Change to “SSTIM” or “SSTIM Workbench,” according to scope |
| Knowledge browser | “Graph Navigator” |
| Authoring surface | Keep “Patch Studio” |
| `bsclab:` RDF implementation or component | Preserve |
| BSC Framework/protocol/catalog compatibility | Preserve and describe accurately |
| Export model tags, storage keys, cache/database names, package/service IDs | Preserve unless a versioned compatibility migration is separately designed |
| Historical screenshots, releases, prior-art records, citations, and provenance | Preserve |
| BioSynCare | Keep separate from SSTIM and the Workbench |

For every ambiguous “BSC Lab” occurrence, record file, line/context, what it
denotes, disposition, and reviewer. “Unclear” means semantic review, not rename.
The identifier instruments are `scripts/locate-iri.py` and
`docs/ontology/TERM_INDEX.md`; external stores that cannot be reached produce an
**INCOMPLETE** result, never a claim of absence.

After the import and governance confirmation, use a prominent provenance/status
statement such as:

> SSTIM and its accompanying open reference tooling provide the initial
> technical baseline for work happening in the W3C Sensory Stimulation
> Vocabulary Community Group. Historical development provenance, attribution,
> and applicable licenses are preserved in the repository history. This does
> not imply retroactive CLA assent, W3C endorsement, or W3C Recommendation
> status.

Confirm this wording with the CG/W3C contact before publication. Restore “were
contributed” only if Gate G0 resolves its legal/governance meaning. Do not infer
a right to use a W3C logo or a new SSTIM visual identity from repository hosting.

**Suggested commits:**

- `docs: distinguish SSTIM deliverables from reference tooling`
- `refactor: present BSC Lab as SSTIM Workbench`
- `docs: record migration provenance and preserved identities`

**Exit evidence:** terminology review passes, semantic-review ledger has no
unresolved mass-renames, UI claims remain within scope, and an RDF/release hash
comparison shows no semantic or historical artifact change.

**Safe stop:** revert only the branding commits; the base-aware imported build
remains usable.

### Checkpoint 7 — parallel deployment and acceptance

Deploy the target while the old site and its workflow remain operational. Do not
route production W3ID traffic to it yet.

Avoid a split-brain mutable publication during this interval. Either hold a
short semantic/release freeze through the W3ID decision, or document a
dual-publication process that deploys the same reviewed semantic artifact to
both hosts. Do not accept independent ontology/release changes in both
repositories, and do not force target history back onto the old repository.

1. Confirm G0 is implemented, all history/build/draft-branch gates are green,
   and the target scaffold recovery branch is still serving correctly.
2. Review the complete import PR and merge it into target `main` using a normal
   **merge commit**, never squash/rebase. Re-run the ancestry, ref, tag, license
   boundary, immutable-hash, and full-history credential-scan checks on the
   reachable target result.
   Perform the Git proof again from a fresh clone of the target, not the
   integration checkout: `git fsck --full`; both frozen-tip ancestry checks
   against `origin/main`; the recorded import merge's parent inspection; and a
   `git show-ref --tags` comparison. Compare every namespaced branch tip plus
   each annotated-tag object ID and peeled commit ID with the frozen inventory.
3. Before replacing the scaffold with a stateful Workbench artifact, confirm G1
   has an approved and implemented disposition. If G1 remains open, the complete
   repository may stay on target `main` while Pages continues to serve the
   scaffold.
4. Have the W3C administrator change Pages from legacy branch publication to
   GitHub Actions and dispatch the audited workflow at the merged commit.
5. Verify the deployed `build-info.json` identifies exactly that commit before
   continuing with browser acceptance.
6. If deployment fails, point Pages back to the preserved scaffold branch while
   correcting the failure. The old production site remains untouched.
7. Document that browser storage and installed-PWA state do not move between the
   old and new origins automatically. Keep the automated two-origin
   format/isolation harness green, and separately browser-test actual Settings
   export on the old site plus import on the new site using synthetic data.
   Installed PWA state is not importable; document re-installation separately.
   Publish user-facing transition instructions before any redirect or archival,
   and keep the old site reachable for that transition window.

Use at least Chromium, Firefox, and WebKit where the current browser matrix
supports them, with a real secure Pages origin for service-worker, install, auth,
and AudioWorklet tests. Record desktop/mobile viewport evidence where navigation
changes at breakpoints.

#### Acceptance matrix

| Requirement | Evidence required before target acceptance | Audit status on 2026-08-23 |
|---|---|---|
| Source history preserved | Fresh target clone proves original source tip is ancestor of target `main`; commit count/ref report retained | **PASS**: `6cf49c9` ancestor of `773d64c`; 507 commits |
| Non-main source history preserved | Every frozen source branch tip is reachable through a namespaced target branch; nine non-main commits accounted for | **PASS**: 3 heads, 12 archived PR heads |
| Target history preserved | Fresh target clone proves original target tip is ancestor of target `main` | **PASS**: `7d4a4a7` ancestor of `773d64c` |
| Complete source tree imported | File/mode/symlink parity against frozen source, with only scaffold reconciliation and reviewed migration commits in the exception ledger | **PASS**: protected ontology tree `84528db5` identical to the live source tip |
| Tags preserved | Fresh clone exact tag name, annotated-object-ID, and peeled-commit-ID comparison | **PASS**: 14 of 14, object and peeled IDs |
| GitHub Release/Zenodo disposition | All 14 Release records have the complete ledger; target recreation is deferred or explicitly approved; no webhook/deposit/DOI event fired | **PASS**: 14 on source, 0 on target, no event fired |
| Governance/license boundary | G0 authority recorded and approved path/license/contribution notices implemented without retroactive-CLA claims | **Passed; decision recorded in `LICENSING.md`** |
| Full-history credential scan | Every imported ref/object scanned without disclosing values; any finding rotated/remediated before push | **PASS**: gitleaks over source, target and all refs, no findings |
| Target ref security | Force update/deletion prohibited on `main`, archival branches, and imported tags; merge-commit method available | **PASS** for force update and deletion, on all three ref classes. Required checks and the pull-request requirement were deliberately **not** kept: the maintainer pushes to `main` directly and watches CI there (see the report) |
| W3C status wording | CG/W3C contact approves accurate non-endorsement/status and provenance text | Pending: W3C staff question 2 |
| Target Pages healthy | HTTPS 200, expected commit, no missing build assets | **PASS**: `verify-deploy` confirms `773d64cd` |
| `/sstim/` routing | Direct and in-app navigation for every prerendered route | **PASS**: 13 of 13 prerendered routes 200 |
| Root deployment retained | Empty-base build and old-site smoke tests | **PASS**: NixOS VM and OCI gates green on `773d64c`; old site serving `e6b3948` |
| Graph Navigator | Full manifest load, filters, relationships, external data failure behavior | **PASS**: 15100 quads, 749 nodes, 879 edges, live source available |
| SSTIM term deep link | Staged rules emit target `/sstim/`; direct target `.../sstim/#StimulationMechanism` selects the term in a browser; canonical W3ID still selects it on old production | **PASS** for the target client path; canonical-to-new still waits for cutover |
| BSC entity deep link | Preserved implementation/framework/component IRIs select the correct nodes | **PASS**: framework, component, preset and programme fragments each select |
| SPARQL interface | Verified examples and bounded SELECT rendering work; unsupported UI forms retain their guidance; shared API tests separately cover ASK/CONSTRUCT | **PASS**: example query runs, 100 rows render |
| Patch Studio | Load, starters, import/export, safety gates, engine start/stop, samples | **PASS** for load and controls; engine start/stop covered by the worklet render tests |
| Worklet/WASM | Network 200 from `/sstim/`, processor registration, audible/rendered session behavior | **PASS**: 4 voices render non-silent from `/sstim/worklets/` |
| Pages WASM posture | Real Pages MIME/compile test passes for current non-threaded WASM; site does not claim COOP/COEP or threaded-WASM support | **PASS**: `WebAssembly.compileStreaming` succeeds against `application/wasm` |
| PWA install/scope | Manifest valid; scope `/sstim/`; install/offline/update passes | **PASS** for manifest and scope; offline and update not separately re-tested on target |
| Cache isolation | Only SSTIM-owned caches deleted across an update | Implemented: mount-scoped cache prefix, only owned caches retired |
| Fetch isolation | A request from an SSTIM client to a sibling project path is neither handled nor cached by the SSTIM worker | Implemented: `fetch` returns early outside the deployment mount |
| Browser-data posture | Gate G1 option and its feature/copy matrix are implemented and browser-verified | **Resolved: option 3 accepted 2026-08-23** |
| User state transition | Automated two-origin gate plus old Settings export/new Settings import with synthetic data; PWA reinstall instructions | **PASS** for logbook and annotation across origins; `skin` untested; reinstall instructions still to publish |
| Build/unit checks | `make test` and `make check` (plus project-base browser tests) | **PASS** on `773d64c` |
| Reproducible/self-hosted deployment | Existing NixOS VM, non-root OCI, static smoke, and two-origin migration gates remain green | **PASS** on `773d64c` |
| Ontology validation | Authoritative `make validate`/CI suite | **PASS**: `Validate RDF` green on `773d64c` |
| SHACL/reasoning/quality | Existing profile, reasoning, competency, quality, release-truth gates | **PASS**: inside the same run |
| Interoperability | Existing HED/BIDS/crosswalk and session-conformance gates remain green | **PASS**: inside the same run |
| WIDOCO | Clean generation and `/sstim/` link/assets check | **PASS** with ledger entry M-02 (pre-existing OOPS link 404) |
| pyLODE | Clean generation and `/sstim/` link/assets check | **PASS** with ledger entry M-03 (pre-existing sibling `.ttl` 404) |
| Context/profile/schema/manifest | Every live endpoint/media type works; manifest path semantics approved; all 28 runtime, 21 local instance, and one external values pass | **PASS**: 28 of 28 runtime, 21 of 21 local, 1 external. Path semantics **resolved 2026-08-23**: references are manifest-relative (M-01). Frozen manifests keep the absolute form and are immutable |
| Immutable releases | Before/after hash manifests identical; target returns identical bodies | **PASS**: 7 of 7 sampled artifacts byte-identical across origins |
| DOI/VoID/DCAT | Concept DOI `10.5281/zenodo.21286974` and v0.16.0 DOI `10.5281/zenodo.22003777` resolve to the same records; no deposit/concept DOI was created; frozen DOI-bearing metadata is identical | **PASS**: both resolve to record 22003777; `CITATION.cff` and `.zenodo.json` unchanged |
| External registries | Network-capable verification records each registry result without changing records | 3 verified, 1 unreachable (LOV, M-05), 1 wrong (Archivo 406, M-04, independent of this migration) |
| Staged W3ID matrix | All current contracts pass against target-specific test rules | **PASS**: 29 candidate targets, 9 Graph fragments, production file untouched |
| Canonical IRIs | Generated-RDF IRI-set comparison has no migration-induced change | **PASS**: identical ontology tree and identical served bytes |
| No semantic release change | RDF canonicalization/diff and immutable hashes | **PASS**: snapshot checksum ledger green in CI; served bytes identical |
| Firebase/auth, if enabled | Authorized domain, sign-in/out, rules, network isolation | Not applicable: the target build carries no Firebase configuration |
| SSTIM Workbench branding | Public terminology is coherent; semantic-review ledger is closed; BSC identities and historical material remain unchanged | **PASS** by inspection of the deployed site; BSC identities unchanged |
| Production parity | Old/new route-and-behavior comparison has no unexplained high-value regression | **PASS**: no migration-introduced failure; M-02 and M-03 reproduce identically on old production |
| Parallel publication authority | Release freeze or identical-artifact dual-publish process prevents source/target semantic drift | **Chosen 2026-08-23: dual publication.** Both repositories carry the identical commit; one workflow derives its mount from the repository. Semantic artifacts are byte-identical across origins; application bundles differ only by Firebase configuration |
| Rollback rehearsal | Target Pages is repointed to/from the preserved scaffold successfully; reverse staged W3ID rules pass before production cutover | **Not run**: required before W3ID cutover |
| Old production operational | Scheduled HTTP/browser smoke tests remain green through acceptance window | **PASS**: serving `e6b3948`, all sampled routes 200 |

Do not turn “not yet tested” into “pass” based on the old deployment or a local
root build.

#### Failure ledger

For every failure or changed behavior, record:

| Field | Required content |
|---|---|
| ID and observed date/commit | Stable reference and exact tested revision |
| Surface and reproduction | URL, browser/command, inputs, expected and actual result |
| Cause | Evidence-backed root cause or explicitly “unknown” |
| Severity | Critical, high, medium, or low, with user/publication impact |
| Cutover impact | Blocks repository import, target deployment, W3ID cutover, release stewardship, or none |
| Recommended fix | Narrow remedy and owner |
| Regression status | Pre-existing, migration-introduced, or indeterminate |
| Verification | Test/evidence that closes it |

**Exit evidence:** completed acceptance matrix, failure ledger, old/new comparison,
security decision, and named approver.

**Safe stop:** point target Pages at the last accepted target artifact or its
scaffold; the old production and W3ID service remain unchanged.

## Production W3ID cutover is a later decision

This document deliberately does not authorize the cutover. After every target
acceptance gate passes, prepare a separate cutover proposal containing:

1. the exact accepted target commit and artifact hash;
2. the completed old/new content-negotiation comparison;
3. approved live-publication metadata changes, if any;
4. the diff from the production W3ID rules to targets such as
   `/sstim/ontology/...`, `/sstim/ontology/docs/...`, the namespace-root HTML
   target `/sstim/`, and direct slash-entity targets `/sstim/graph/#...`;
5. evidence that no canonical IRI, immutable byte, profile closure, media-type
   contract, or deep-link fragment changes;
6. a rollback diff to the old targets;
7. monitoring owners and a rollback threshold; and
8. explicit authorization from the namespace maintainers/CG governance.

Only after that authorization:

1. run the complete ruleset locally against the target artifact;
2. open a normal pull request to `perma-id/w3id.org`;
3. verify the upstream diff contains only reviewed target changes;
4. after merge, test every production route and `Accept` variant from outside
   GitHub Actions;
5. retain the old site and files for the rollback/observation window; and
6. publish the cutover report.

Updating DOI records, registry entries, external documentation, or archiving the
old repository remains another explicit checkpoint after W3ID stability. GitHub
Release/Zenodo ownership must be settled before the first release from the new
repository; do not create a duplicate concept DOI accidentally.

## Rollback model

Before the import merge, close the draft PR to protect target `main`. Pushed
namespaced branches, tags, and Git objects remain remote state; closing a PR does
not erase them. Retain them in quarantine or obtain a separate, explicitly
approved cleanup decision.

After the import merge, never reset or force-push target `main`. Use a reviewed
corrective/revert PR for tree changes, or halt and obtain governance/security
direction if the problem concerns material that remains in reachable history.
This is why the G0 disposition and full-history credential scan occur before the
first push/merge. If reverting the complete imported PR tree is explicitly
approved, use `git revert -m 1` against the recorded final PR merge SHA in a
normal reviewed PR; this restores a tree state but deliberately does not erase
the imported history.

Publication rollback remains deliberately simple before W3ID cutover:

- Base-path regression: continue publishing the last known-good old-site commit.
- Target Pages regression: redeploy the last accepted target artifact or point
  Pages back to its preserved scaffold branch.
- Branding problem: revert the narrow branding commits without reverting the
  history import or base-path work.
- Firebase/auth problem: leave target cloud features disabled.
- Documentation generator problem: block target acceptance; keep old generated
  documentation online.

After W3ID cutover, rollback means reverting the reviewed upstream W3ID target
diff and verifying every negotiation route. That higher operational cost is why
cutover must not be bundled with the repository move.

## Questions for Pierre-Antoine Champin or W3C staff

1. Does W3C want an additional machine-readable or directory-level marker for
   Apache-2.0 Workbench software and any future formally designated W3C Test
   Suite beyond the scope already recorded in `LICENSING.md`?
2. What status sentence and W3C/CG visual attribution are approved for the site?
3. Which W3C organization Pages, Actions, environment, branch-protection, and
   release permissions will be available to maintainers?
4. Is a dedicated origin recommended or available for a Workbench with private
   browser storage and optional Firebase authentication, while keeping the
   public CG site at `/sstim/`?
5. How should the existing GitHub Releases and Zenodo/concept-DOI relationship
   move without minting or changing identifiers unintentionally?
6. What review/authorization is expected before the production W3ID target PR?

## Required final migration report

The migration owner should finish with one report containing:

1. what was migrated, including Git refs and non-GitHub metadata;
2. what changed, grouped by base-path/PWA, CI/publication, documentation, and
   public branding;
3. what intentionally did not change, including IRIs, semantics, frozen bytes,
   licenses, DOI records, production W3ID rules, and old production;
4. the completed acceptance matrix and exact test/CI revisions;
5. every outstanding blocker and its failure-ledger entry;
6. the exact remaining steps and approvals before W3ID cutover; and
7. answers received—or still required—from Pierre-Antoine Champin/W3C staff.

The report must demonstrate, rather than merely assert, preservation of both
histories, target health, `/sstim/` routing, Graph Navigator/deep links, Patch
Studio/audio, PWA scope and isolation, SSTIM validation/reasoning/SHACL,
WIDOCO/pyLODE, SPARQL, live endpoints, immutable artifacts, DOI consistency,
staged W3ID negotiation, canonical IRIs, semantics, and old-production health.

## Definition of success

Migration succeeds when `w3c-cg/sstim` is the community-governed, history-complete
source; the target Pages artifact faithfully serves the SSTIM publication and
non-normative reference environment below `/sstim/`; the old production remains
available throughout validation; and an independent reviewer can reproduce the
claim that no canonical identity, historical release, semantic contract, license,
or provenance was silently changed.

It does **not** succeed merely because the repository was copied or the landing
page returned HTTP 200.
