# Portable Deployment and Migration

**Status:** current baseline and proposed architecture · last verified 2026-07-30

BSC Lab is intended to be runnable by any institution or community, not only by its
maintainers. This document records exactly how far that is true today, where it
stops, and what the remaining work is — with an acceptance criterion for each item
so progress is testable rather than asserted.

It is deliberately unglamorous about the gaps. A deployment document that overstates
what works is worse than none, because someone will try to follow it.

---

## 0. Evidence matrix

Every capability below is asserted by a command that fails if the capability
regresses. Nothing here is a claim about intent.

| Capability | Evidence | Verified by |
|---|---|---|
| Reproducible package | Identical output across builds of identical sources | `nix build --rebuild` |
| NixOS deployment | Clean VM boots, serves, and satisfies the deployment contract | `nix flake check` → `checks.nixos-vm` |
| OCI deployment | Same store path, run non-root, same contract | `nix build .#oci` + container job in CI |
| Runtime configuration | One artifact, two configurations, two instances | Two-machine VM subtest; two-container CI job |
| Deployment identity | The live site reports the commit it was built from | `make verify-deploy` |
| Credential-free build | No API key in any bundle file | `make smoke-static` |
| Instance migration | Export from A imports into B and re-exports byte-identically | `make migrate-test` |
| Session interoperability | Level 1 semantic + Level 2 execution-parameter equivalence across origins | `make session-conformance` |
| Privacy boundary | No provider identifier survives packaging, on build and on parse | `make session-conformance` (privacy assertions) |
| Ontology integrity | SHACL, OWL DL consistency, SPARQL competency, snapshot checksums | `make validate` |
| Documentation truth | Prose matches the repository's own facts | `make truth-audit` |

The deployment paths share **one** contract, `scripts/smoke-http.sh`, so "it
works as a container" and "it works as a NixOS service" are the same assertion
run twice rather than two hand-written approximations that drift.

---

## 1. Current verified baseline

Everything in this section was checked against the working tree on 2026-07-30.

### 1.1 The application is static and runs client-side

The build uses `@sveltejs/adapter-static`. The knowledge browser, SPARQL workbench,
Patch Studio, Sensory Field, preset browser and all reference data operate in the
browser. Ontology Turtle is served as same-origin static assets from
`static/ontology/`.

Consequence: **the core application is already hostable on any static file server**,
with no application server, database or runtime dependency.

### 1.2 Firebase is genuinely optional, and the boundary is explicit

Configuration comes entirely from build-time environment variables —
`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
`VITE_FIREBASE_APP_ID` and related. `src/firebase/client.js` fails loudly when they
are absent:

> `Firebase is not configured. Add VITE_FIREBASE_* values to enable Firebase-backed
> features.`

Consequence: **a build with no `VITE_FIREBASE_*` values produces a working
application with no embedded credentials.** Sign-in becomes unavailable, and
annotations, patches and profile are kept on the device instead of an account
(§1.6); everything else is unchanged.

**This is verified on every commit, not asserted.** `make smoke-static` rebuilds
with no configuration, serves `dist-smoke/` over plain HTTP from a dependency-free
Node server, and checks that all nine primary routes return their own prerendered
HTML, that an unknown path returns 404 (so a fallback-everything host cannot make
the other assertions vacuous), that the ontology Turtle is served same-origin, that
the service worker and manifest are present, that **no Firebase API key is inlined
in any bundle file**, and that the unconfigured-Firebase guard shipped. It runs in
CI after the build.

> **A trap worth knowing about.** Vite loads the project-root `.env` in *every*
> mode, so unsetting `VITE_FIREBASE_*` in the shell is **not** enough — a
> developer's local `.env` is still inlined, and a naive test passes while proving
> nothing. This was observed in practice: a build made with the variables
> explicitly unset still shipped a working API key. `make smoke-static` therefore
> points Vite at an empty `envDir` via `BSC_ENV_DIR`. The key-leak assertion is
> confirmed to fail against an ordinary configured build, so it is a real check
> rather than a decorative one.

The coupling surface is small and countable: **nine import sites across seven
files** — `src/ui/creator/PresetCreator.svelte`, `src/ui/auth/SignInForm.svelte`,
`src/ui/annotation/AnnotationPanel.svelte`, `src/ui/navigation/ProfileControl.svelte`,
`src/routes/logbook/+page.svelte`, `src/routes/profile/+page.svelte`, and
`src/rdf/annotations/AnnotationStore.js`.

### 1.3 The Nix flake: reproducible toolchain **and** a reproducible package

`flake.nix` pins Node, Python with pySHACL, ROBOT/HermiT, WIDOCO, pyLODE, WABT and
Firebase tooling across Linux and macOS, and CI runs every command inside it, so
contributor and CI environments match exactly.

**`nix build` (or `make package`) now produces the static site as an immutable
package** at `result/share/bsc-lab`, servable by any static web server. It is
**bit-reproducible**: `nix build --rebuild` yields an identical output, verified
2026-07-30. `nix flake check` builds it, so a broken build fails the same gate as a
broken evaluation. The derivation refuses to install an artifact missing
`index.html` or the ontology assets, or one containing an inlined Firebase key.

**Credential-free by construction.** The flake source is the git-tracked tree, so an
untracked, gitignored `.env` cannot enter the sandbox — the build cannot inline a
developer's key even by accident. That is the property `make smoke-static` asserts
for ordinary builds, obtained here structurally rather than by convention.

> **Reproducibility needed one fix, worth recording.** SvelteKit's version name
> defaults to a build timestamp, which is embedded as the `__sveltekit_<id>` global
> and therefore lands in every content hash — two builds of identical sources
> differed in every chunk filename. It could not simply be pinned to a constant,
> because the same value is the service worker's cache name
> (`bsc-lab-${version}`), and a frozen cache name means clients never receive an
> update (ADR 0009). It is now overridable through `BSC_BUILD_VERSION`, which the
> Nix package sets to the revision being built: stable for identical sources,
> changing whenever the source changes. Unset, the SvelteKit default applies and
> ordinary builds are unaffected.

> **What this closed, and what followed.** Written when only G1 was closed. G2
> (NixOS module), G3 (container image) and G6 (runtime configuration) closed on
> 2026-07-31 and are covered below; backup and migration are §1.5. A reproducible
> package is not self-hosting on its own — it was the first of the pieces.

### 1.4 Data surfaces that already serialise

| Surface | What it produces | Boundary |
|---|---|---|
| `make export` | JSON-LD and RDF/XML of the ontology modules | **Ontology only.** Not an application backup, not user data |
| `AnnotationStore` | RDF via the N3 Writer, in per-user named graphs | Firebase authentication IDs are **excluded** and replaced with pseudonymous agent identifiers |
| Patch Studio | A portable `patch-studio-model-1` object | Serialises and reloads faithfully, but converts to **neither** the catalogue preset format **nor** SSTIM RDF — documented as a dead end (ADR 0026) |
| Release snapshots | Immutable per-version trees under `static/ontology/<version>/` | Integrity enforced by `make verify-snapshots` checksums (ADR 0020) |

### 1.5 Instance export and import

`Settings → Your data` exports everything BSC Lab holds locally as one versioned,
checksummed file, and imports it back — on any instance, with **no account and no
Firebase**. Implementation in `src/portability/instanceExport.js`.

| Property | How |
|---|---|
| Versioned | `model: "bsc-lab-instance-export-1"`; unknown or absent models are refused |
| Integrity-checked | SHA-256 over a canonically-ordered payload, so key order cannot change the digest; a tampered or truncated file is refused rather than half-applied |
| Free of authentication identifiers | Logbooks are keyed `bsclab_logbook_v2:<uid>` in storage but exported by **scope** (`anonymous` / `account`), so the Firebase uid never enters the file — the rule `AnnotationStore` already follows for RDF |
| Portable across accounts | Account-scoped data is re-keyed to whoever imports, and restores anonymously when nobody is signed in |
| Lossless | Export → import → export is a fixed point, verified by checksum, so repeated migration cannot drift the data |
| Confirmed before overwriting | Import parses and verifies first, shows what would land, and asks |

**Covered today:** everything BSC Lab keeps on the device — logbooks and their
entries, local annotations, local profile, **locally saved patches**, unmigrated
v1 entries, and the appearance preference. **Not covered:** records held in
Firestore for a signed-in account. Individual patches remain separately portable
as files through Patch Studio's Download and Import.

### 1.6 The patch storage seam

`src/storage/` defines a `PatchStore` contract and two implementations:

| Implementation | Available when | Backing |
|---|---|---|
| `local` — "On this device" | **Always** | `localStorage`, exportable through §1.5 |
| `firestore` — "Your account" | Firebase configured **and** signed in | The collection and document shape unchanged from before |

**The same pattern now covers annotations and profile.** Annotating the knowledge
graph, and editing the display name attached to those annotations, both work with
no account and no Firebase — the browser is writable on a self-hosted instance
rather than read-only. Validation, pseudonymisation and RDF projection live in
`annotationRdf.js` shared by both implementations, because a disagreement about
visibility handling between them would be a privacy bug rather than a formatting
difference.

Two honest differences in the local annotation store, inherent rather than
unfinished: there is no *other* user, so every local annotation is your own and
"public" only decides which RDF graph it exports into; and subscriptions are
same-origin only, notified on local writes and the browser's `storage` event,
because `localStorage` has no cross-device channel.

Local is the default and always present; an account **adds** a second place to
keep patches rather than being the price of keeping any. Saving a patch no
longer requires sign-in or a configured Firebase project.

**One conformance suite runs against both** (`patchStore.conformance.test.js`),
so "works on device" and "works in the account" are the same assertions run
twice — the property that makes this an interface rather than a swap. A future
self-hosted implementation is finished when it passes that file unchanged.
Validation and ordering live in the shared contract module, so implementations
cannot drift on what they accept or how they sort.

The Firestore implementation is tested against an in-memory fake, which fixes
the contract but does **not** prove Firebase is reachable; that still needs the
real backend.

### 1.6b Deployment paths, and one conformance contract

Three ways to run BSC Lab, all from the same derivation — the application is
never rebuilt for a different path, so they cannot drift:

| Path | Command | Verified by |
|---|---|---|
| Static artifact | `nix build` / `make package` | `nix build --rebuild` (bit-reproducible) + `make smoke-static` |
| NixOS service | `services.bsc-lab.enable = true;` | A clean NixOS VM booted in CI |
| OCI container | `nix build .#packages.x86_64-linux.oci` | Loaded, run and asserted live in CI, as a non-root process |

**`scripts/smoke-http.sh` is the single definition of a correct deployment**, run
against both the VM and the container. Two hand-written approximations would
diverge, and the point of supporting more than one path is that they behave
identically. It asserts the application is served, all eight prerendered routes
return their own page, Turtle and JSON-LD carry the media types RDF clients
need, the manifest does too, COOP/COEP/CORP are applied, and an unknown path is a
real 404 rather than a soft homepage.

The script is confirmed to discriminate: run against the dev server it fails the
three cross-origin assertions, and passes only where the headers are genuinely
applied.

**Both self-hosted paths fix something the public instance gets wrong.**
`static/_headers` records the intended cross-origin isolation policy, but it is
Netlify syntax and GitHub Pages ignores it — so on the public deployment that
policy is aspirational. And `.ttl`/`.jsonld` are absent from nginx's default
`mime.types`, so an unconfigured server would publish the knowledge graph as
`application/octet-stream`. Both are handled explicitly and asserted.

### 1.6c Migration between instances is tested, not asserted

`make migrate-test` serves the build on **two ports — two origins, so genuinely
separate `localStorage`** — each with its own browser profile, and performs a
real migration:

1. instance A seeds a logbook, an annotation, a saved patch, a profile and a
   preference, in exactly the storage shape the application writes;
2. A exports;
3. the file is checked to contain **no account identifier**;
4. instance B starts empty, verifies the checksum, and imports **under a
   different account**;
5. every record is verified individually — including that the patch body still
   carries its control and audio tracks;
6. B re-exports, and its checksum must equal A's.

That last step is the one that matters: **export → migrate → re-export is a
fixed point**, so moving between instances repeatedly cannot drift the data.
A unit round-trip proves the format is symmetric in one process; this proves the
migration works between separately hosted instances.

### 1.6d One package, many operators: runtime configuration

An immutable, bit-reproducible package and a deployment someone else can shape
pull against each other, because everything that distinguished one instance from
another used to live in `import.meta.env.VITE_*` — read when the bundle was
compiled. An operator who wanted their own Firebase project, or none, had to
rebuild, at which point it was no longer the same artifact.

The resolution is a single document the running application fetches,
`runtime-config.json`, versioned as `bsc-lab-runtime-config-1`:

```json
{
  "model": "bsc-lab-runtime-config-1",
  "instance": { "id": "https://lab.example.org/", "name": "Example Research Lab" },
  "identity": { "provider": "anonymous" },
  "storage":  { "provider": "local" }
}
```

Each deployment path supplies it the way that path naturally does. The NixOS
module generates it from `services.bsc-lab.settings` and serves it from the
store; the container takes it as a read-only mount at
`/config/runtime-config.json`; a plain static host drops it beside `index.html`.
The package itself is untouched in every case.

Two rules make it safe to hand to someone else
([`src/config/runtimeConfig.js`](../../src/config/runtimeConfig.js)):

**Absence changes nothing.** No file is the normal case, not an error — and a
bundle built with credentials keeps using them. Adding this could not be allowed
to silently take accounts away from a running deployment, so the document is
purely additive.

**Invalid configuration degrades, never escalates.** Every failure path lands on
local-only, which needs no credentials and no network. An unrecognised `model`
is refused wholesale rather than partially applied; an unknown provider name
falls back; and asking for Firebase without credentials to reach it downgrades
rather than producing an instance that offers accounts it cannot honour. What
was rejected and why is reported in **Settings → This instance**, so a
misconfigured deployment says so instead of behaving mysteriously.

Both halves are tested end to end, not asserted. The NixOS VM test boots **two
machines from the same derivation** — one unconfigured, one with an operator's
settings — and checks that the first 404s the document, the second serves
exactly what was declared, and both return byte-identical application and
`build-info.json`. The container job does the same with one image and a mount.

### 1.6e The deployed instance names its own commit

Every build writes `build-info.json` — commit, provenance, app version, SSTIM
version, build time — and `scripts/verify-deploy.mjs` fetches it back from a
deployed URL and compares against the commit CI built. It runs in `pages.yml`
immediately after deployment, and as `make verify-deploy DEPLOY_URL=…` against
any instance.

This exists because of a specific failure. GitHub Pages was configured to
publish the `main` branch while CI uploaded an Actions artifact; the build output
is gitignored, so the repository root had no `index.html` and the live site
returned 404 — including the ontology Turtle that `w3id.org` redirects to. Every
workflow run reported success throughout, and two separate reviews then disagreed
about whether the site was merely serving stale content, neither able to check.
A green deploy step is not evidence that a deployment happened.

### 1.7 Public/private separation exists in the data model

Annotations live in per-user named graphs, never the default graph
(`AnnotationStore`, ADR 0003). Authoritative ontology data and user contributions
are therefore distinguishable at the triple level, and exports carry no
authentication identifiers.

### 1.8 Offline and integrity properties

The PWA service worker (ADR 0009) caches for offline use, returns early for any
cross-origin request, and never auto-reloads a running session. Ontology IRIs
resolve through `w3id.org/sstim` in Turtle, JSON-LD, RDF/XML and HTML.

---

## 2. Known portability gaps

Stated plainly, with no partial credit.

| # | Gap | Current state |
|---|---|---|
| ~~G1~~ | ~~No production package~~ | ✅ **Closed 2026-07-30.** `nix build` produces a bit-reproducible static package; `nix flake check` builds it |
| ~~G2~~ | ~~No NixOS module or service definition~~ | ✅ **Closed 2026-07-31.** `services.bsc-lab.enable = true;` — verified by booting a clean NixOS VM in CI |
| ~~G3~~ | ~~No container image~~ | ✅ **Closed 2026-07-31.** `packages.x86_64-linux.oci`, built from the same store path, run non-root, asserted live in CI |
| ~~G4~~ | ~~No backend adapter interface~~ | ✅ **Closed 2026-07-31 for storage.** Patches, annotations and profile each have local and Firestore implementations behind a shared contract. The **identity** seam is untouched — six of the original nine import sites are `authState` |
| ~~G5~~ | ~~No self-hosted alternative to Firebase~~ | ⚠️ **Largely closed 2026-07-31, and deliberately bounded.** Patches, annotations and profile all work with no account and no Firebase. Per [ADR 0039](../decisions/0039-sharing-model-and-the-shared-backend-question.md) the gap splits: *sync my own data across devices* stays open work, gated on the identity seam; *a multi-user backend hosting one person's content for others* is **declined**, and sharing is met by publication instead |
| ~~G6~~ | ~~Firebase config is build-time only~~ | ✅ **Closed 2026-07-31.** `runtime-config.json` beside the artifact selects instance identity and providers; the NixOS module generates it declaratively and the container mounts it read-only. One package, two configurations, verified in the VM test and against two containers (ADR 0041 §2) |
| ~~G7~~ | ~~No complete export package~~ | ✅ **Closed for local data 2026-07-31.** The versioned, checksummed export carries logbooks, annotations, profile, **saved patches**, unmigrated v1 entries and preferences — everything BSC Lab keeps on the device. Firestore-held records for a signed-in account remain outside |
| ~~G8~~ | ~~No backup or restore~~ | ⚠️ **Partly closed 2026-07-31.** Export is the backup and import is the restore for all local data; scheduling and retention orchestration are absent |
| ~~G9~~ | ~~No cross-instance migration~~ | ✅ **Closed for local data 2026-07-31.** `make migrate-test` moves everything between two genuinely separate origins and proves the re-export matches byte-for-byte |
| ~~G10~~ | ~~Patch export is a dead end~~ | ⚠️ **Largely closed 2026-07-31.** A checksummed session package carries the lossless patch plus a SHACL-validated SSTIM projection and a mapping report; `make session-conformance` proves Level 1 + Level 2 equivalence across two origins ([SESSION_PACKAGE.md](SESSION_PACKAGE.md)). The gated *catalog preset* conversion of ADR 0026 remains open |
| ~~G11~~ | ~~No threat model, no `SECURITY.md`~~ | ⚠️ **Partly closed.** `SECURITY.md` documents the data boundaries, the authentication-identifier exclusion and self-hosting expectations. A formal threat model and automated boundary tests are still open |
| ~~G12~~ | ~~No deployment conformance tests~~ | ✅ **Closed 2026-07-31.** `scripts/smoke-http.sh` is one contract run against **both** the NixOS VM and the container in CI |

---

## 2b. How sharing works without a backend

Recorded in full in
[ADR 0039](../decisions/0039-sharing-model-and-the-shared-backend-question.md).
Four tiers, none requiring a service:

| Tier | Mechanism | Status |
|---|---|---|
| **Link** | Patch compressed into a URL **fragment** (never sent to a server), under ~1 kB | Proposed |
| **File** | Patch download/import; whole-instance export | **Shipped** |
| **Publication** | Stable URL, fetched by "open from URL"; as SSTIM RDF once G10 lands. One-click targets: **Zenodo** (DOI, archival) and **Mastodon** (federated post from the user's own account) | Proposed |
| **Contribution** | Into the curated public graph via the existing consent-gated review (ADR 0031/0032) | Partly exists |

**WebRTC with QR signalling** is retained as a *synchronous* transfer channel for
people in the same room — the camera is the signalling channel, so no STUN, TURN
or server is involved, and it works with no internet at all. It is not a
substitute for publication: it cannot reach someone absent, offers no discovery,
and leaves no citable artifact.

## 3. Proposed architecture

The intent is that the outputs are **reusable beyond BSC Lab**. A static
single-page application with optional cloud services is a common shape; the
patterns below should serve any project with that shape.

### 3.1 Reproducible deployment

- A Nix **package** output building the static site deterministically
- A **NixOS module** exposing an instance as a declarative service: web root,
  optional service endpoints, backup hooks
- An **OCI image** built from the same derivation, for operators without Nix
- A pinned, tested production configuration example

### 3.2 Backend adapter contract — two seams, not one

Firebase currently does two separable jobs: it establishes **identity** and it
**stores data**. Collapsing them into a single adapter would reproduce the coupling
the adapter exists to remove, because most alternative identity providers store
nothing at all.

**Two interfaces:**

**Identity provider** — establishes who a user is, and nothing else.

- **Anonymous** (default): no identity, local data only
- **Fediverse / Mastodon OAuth** — *first implementation*. Viable from a static
  app: Mastodon supports **PKCE since 4.3.0** (S256 only) and **dynamic app
  registration** via `POST /api/v1/apps`, so no pre-registration and no server are
  required — the pattern used by client-side Mastodon clients such as Pinafore,
  Semaphore and Elk. A Mastodon **actor URI is a dereferenceable agent
  identifier** and additionally an ActivityPub actor, so it serves the named-graph
  annotation model directly. *Known compromise:* Mastodon provisions
  **confidential clients only** and always returns a `client_secret`, which a
  browser cannot keep secret. PKCE mitigates interception; the secret's presence
  remains a wart the ecosystem is addressing through Client ID Metadata Documents.
- **IndieAuth** ([W3C](https://www.w3.org/TR/indieauth/)) — *second
  implementation*. Identity is a URL the user controls, and the client is
  identified by *its own* URL, so DNS replaces client registration: **no
  registration step and no client secret at all**. Mechanically cleaner than
  Mastodon OAuth for a static deployment, though not semantically superior — an
  actor URI dereferences just as well. Mastodon does not implement IndieAuth, so
  the two are complementary rather than alternatives.
- **Firebase Auth**: the existing implementation, moved behind the interface

**Why two, and why Mastodon first** — see
[ADR 0038](../decisions/0038-identity-providers-and-the-two-seam-adapter.md).
Briefly: one provider is a swap, two are an interface; and Mastodon is the
reference Fediverse implementation, whereas IndieAuth belongs to the allied but
separate IndieWeb. Consuming a Mastodon instance as an OAuth provider needs no
ActivityPub server, no inbox and no moderation capacity, so it does not reopen
[ADR 0008](../decisions/0008-activitypub.md).

**Storage provider** — persists annotations, patches, logbook entries and profile.

- **Local-first** (default): IndexedDB, no account required
- **Firestore**: the existing implementation
- **Private sync** (future): an operator-run or user-controlled endpoint storing
  **only the authenticated user's own records**. It does not serve one user's
  content to another, and provides no public discovery, comments or collaborative
  editing — that boundary is the decision in
  [ADR 0039](../decisions/0039-sharing-model-and-the-shared-backend-question.md),
  which declines a multi-user content backend and meets sharing through
  publication instead

The nine current import sites are the refactor's scope. A shared conformance suite
runs against every implementation of each interface, so "works with Firebase" and
"works self-hosted" become the same assertion twice.

**Why local-first is the default rather than a fallback.** An identity provider
that stores nothing — which is true of Mastodon OAuth and IndieAuth alike — is only
useful once data has somewhere to live that does not depend on an account. Local
storage plus the export package (§3.3) is that somewhere. Identity then becomes
optional attribution rather than a gate on the user's own records.

### 3.3 Portable data

- A **versioned instance export package** — manifest, ontology release reference,
  annotations, patches, logbook entries, with checksums
- **Import** that validates the manifest and refuses partial or mismatched data
- **Schema-version migration** so an older export loads into a newer instance
- A **catalogue/RDF bridge for patches**, closing G10 and ADR 0026

### 3.4 Publication interoperability

Stable dereferenceable URLs for public objects, and an *implemented* open
syndication format — ActivityStreams 2.0 or RSS/Atom — for releases and public
protocol objects. Provenance-preserving metadata on published artefacts.

**Not** ActivityPub federation. ADR 0008 rejects it deliberately: inboxes,
signatures, delivery queues, moderation and abuse handling are a social-server
programme, not a publication format. Private logbooks and personal notes never
syndicate.

### 3.5 Security and safe defaults

A threat model, `SECURITY.md`, automated public/private boundary tests, safe log
defaults, documented secrets handling, and backup encryption expectations.

---

## 4. Testable completion criteria

The document's contract. Each row is done when its criterion passes, not when the
code exists.

| Area | Exists now | Proposed work | Acceptance criterion |
|---|---|---|---|
| Reproducible toolchain | Pinned Nix dev/CI environment, a bit-reproducible `nix build` package, **a NixOS module and an OCI image**, all three held to one conformance contract (§1.3) | — | ✅ A fresh machine deploys a working instance from one documented command |
| Core application | Static SvelteKit build (§1.1), verified credential-free by `make smoke-static` | Independent institutional deployment | ✅ An instance runs with no BioSynCare and no Firebase credentials |
| Runtime configuration | **`runtime-config.json`, generated declaratively by the NixOS module and mounted read-only into the container (§1.6d)** | Provider selection for identity seams beyond Firebase, once they exist | ✅ One package byte-for-byte, deployed twice with different configuration, yields two instances differing only as configured; absent or invalid config falls back to local-only |
| Identity | Firebase Auth only, nine import sites (§1.2) | Identity-provider interface: anonymous, Firebase, Fediverse/Mastodon OAuth, IndieAuth | Signing in through any provider yields an attributable agent identifier; signing in through none leaves the app fully usable |
| Storage | **Patches, annotations and profile are all local-first by default and Firestore when signed in, behind one shared conformance suite** (§1.6) | Private-sync implementation (see §3.2), gated on the identity seam | ✅ The same conformance suite passes against every storage implementation |
| Patch data | Portable `patch-studio-model-1` (§1.4), file import/export, URL-fragment sharing, **and a checksummed session package with a deterministic SSTIM projection** ([SESSION_PACKAGE.md](SESSION_PACKAGE.md)) | Patch-studio-native session class in SSTIM (findings S1/S2/V1) | ✅ A patch exported from instance A imports identically into instance B; `make session-conformance` proves Level 1 + Level 2 equivalence across two origins |
| Local user data | Versioned instance export with SHA-256 integrity, covering patches, annotations, logbook, profile and skin (§1.5) | — | ✅ An export validates and its checksum verifies; export→import→export is a fixed point |
| Migration | **Two-origin migration test** (`make migrate-test`), 15 assertions across two separate origins | Schema-version migration for future model revisions | ✅ Two independently deployed instances pass a migration test |
| Deployment truth | `build-info.json` published with every build; CI asserts the deployed commit equals the built commit | — | ✅ The live site reports the commit it was built from, and a mismatch fails CI |
| Security | Public/private boundaries in the data model (§1.5), **enforced on package build and parse and re-checked cross-origin** | Threat model and safe deployment defaults | Partial — boundary tests pass for session packages; `SECURITY.md` and a full threat model remain |

---

## 5. Non-goals

- **Becoming a general hosting platform.** BSC Lab is a research workbench. It is a
  demanding *workload* for these patterns, not a stack that hosts other things.
- **Mandatory accounts.** The default deployment requires no authentication and no
  cloud service, and that must remain true.
- **Federating private data.** Logbook entries and personal notes are private by
  default and never syndicate (ADR 0008).
- **Replacing the maintainers' instance.** The published instance stays one
  deployment among others, with no privileged capability.

---

## See also

- [ADR 0008 — ActivityPub](../decisions/0008-activitypub.md) — why federation is out of scope
- [ADR 0009 — PWA](../decisions/0009-pwa.md) — service-worker constraints
- [ADR 0020 — whole-set snapshot versioning](../decisions/0020-whole-set-snapshot-versioning.md)
- [ADR 0026 — Patch Studio catalogue bridge](../decisions/0026-patch-studio-catalog-bridge.md) — G10
- [`PWA_SERVICE_WORKER.md`](PWA_SERVICE_WORKER.md), [`PATCH_STUDIO.md`](PATCH_STUDIO.md)
- [`../../src/README.md`](../../src/README.md) — architecture and what is still planned
