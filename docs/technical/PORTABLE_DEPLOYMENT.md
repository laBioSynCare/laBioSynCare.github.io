# Portable Deployment and Migration

**Status:** current baseline and proposed architecture · last verified 2026-07-30

BSC Lab is intended to be runnable by any institution or community, not only by its
maintainers. This document records exactly how far that is true today, where it
stops, and what the remaining work is — with an acceptance criterion for each item
so progress is testable rather than asserted.

It is deliberately unglamorous about the gaps. A deployment document that overstates
what works is worse than none, because someone will try to follow it.

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
application with no embedded credentials.** Annotations, saved patches, sign-in and
profile become unavailable; everything else works.

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

### 1.3 The Nix flake reproduces the *toolchain*, not a deployment

`flake.nix` exposes **`devShells` and `formatter` only**. It pins Node, Python with
pySHACL, ROBOT/HermiT, WIDOCO, pyLODE, WABT and Firebase tooling across Linux and
macOS, and CI runs every command inside it, so contributor and CI environments match
exactly.

It does **not** expose `packages`, `nixosModules`, `nixosConfigurations` or `apps`.

> **This distinction is the point of the whole document.** BSC Lab has a
> reproducible **development, build and validation** environment. It does not have
> reproducible **production deployment**. Conflating the two is easy and misleading.

### 1.4 Data surfaces that already serialise

| Surface | What it produces | Boundary |
|---|---|---|
| `make export` | JSON-LD and RDF/XML of the ontology modules | **Ontology only.** Not an application backup, not user data |
| `AnnotationStore` | RDF via the N3 Writer, in per-user named graphs | Firebase authentication IDs are **excluded** and replaced with pseudonymous agent identifiers |
| Patch Studio | A portable `patch-studio-model-1` object | Serialises and reloads faithfully, but converts to **neither** the catalogue preset format **nor** SSTIM RDF — documented as a dead end (ADR 0026) |
| Release snapshots | Immutable per-version trees under `static/ontology/<version>/` | Integrity enforced by `make verify-snapshots` checksums (ADR 0020) |

### 1.5 Public/private separation exists in the data model

Annotations live in per-user named graphs, never the default graph
(`AnnotationStore`, ADR 0003). Authoritative ontology data and user contributions
are therefore distinguishable at the triple level, and exports carry no
authentication identifiers.

### 1.6 Offline and integrity properties

The PWA service worker (ADR 0009) caches for offline use, returns early for any
cross-origin request, and never auto-reloads a running session. Ontology IRIs
resolve through `w3id.org/sstim` in Turtle, JSON-LD, RDF/XML and HTML.

---

## 2. Known portability gaps

Stated plainly, with no partial credit.

| # | Gap | Current state |
|---|---|---|
| G1 | No production package | The flake builds a dev shell, not the application |
| G2 | No NixOS module or service definition | An operator has no declarative way to run an instance |
| G3 | No container image | No OCI alternative for non-Nix operators |
| G4 | No backend adapter interface | Firebase is imported directly at nine sites; there is no seam to substitute an implementation |
| G5 | No self-hosted alternative to Firebase | Cloud features require Firebase or are simply absent |
| G6 | Firebase config is build-time only | An operator must rebuild to change backends; no runtime configuration |
| G7 | No complete export package | Ontology and annotations serialise separately; there is no single versioned instance export |
| G8 | No backup or restore | — |
| G9 | No cross-instance migration | Nothing verifies that instance A's data loads into instance B |
| G10 | Patch export is a dead end | No bridge to catalogue JSON or SSTIM RDF (ADR 0026) |
| G11 | No threat model, no `SECURITY.md` | Public/private boundaries are implemented but not documented as a security contract |
| G12 | No deployment conformance tests | Nothing asserts that a fresh deployment is correct |

---

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
- **Self-hosted**: an open protocol over an operator-run endpoint

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
| Reproducible toolchain | Pinned Nix dev/CI environment (§1.3) | Production package and NixOS module | A fresh machine deploys a working instance from one documented command |
| Core application | Static SvelteKit build (§1.1) | Independent institutional deployment | An instance runs with no BioSynCare and no Firebase credentials |
| Identity | Firebase Auth only, nine import sites (§1.2) | Identity-provider interface: anonymous, Firebase, Fediverse/Mastodon OAuth, IndieAuth | Signing in through any provider yields an attributable agent identifier; signing in through none leaves the app fully usable |
| Storage | Firestore when configured (§1.2) | Storage-provider interface: local-first, Firestore, self-hosted | The same conformance suite passes against every storage implementation |
| Patch data | Portable `patch-studio-model-1` (§1.4) | File import/export and version migration | A patch exported from instance A imports identically into instance B |
| RDF data | Ontology and annotation serialisation (§1.4) | Versioned complete export package | An export validates against its schema and its checksums verify |
| Migration | Not implemented (G8, G9) | Automated backup/restore and cross-instance migration | Two independently deployed instances pass a migration test in CI |
| Security | Public/private boundaries in the data model (§1.5) | Threat model and safe deployment defaults | `SECURITY.md` published and automated boundary tests pass |

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
