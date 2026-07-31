# Security Policy

BSC Lab is a client-side research workbench. It has no application server of its
own, and a default deployment requires no accounts and no cloud services. That
shape removes whole classes of risk, but it does not remove all of them — and the
project handles two things that deserve care: **personal reflective records** and
**rhythmic audiovisual stimulation**.

---

## Reporting a vulnerability

Email **renato.fabbri@gmail.com** with `SECURITY` in the subject. Please include
what you found, how to reproduce it, and the affected version or commit.

Please do **not** open a public issue for anything that exposes user data or
enables a safety bypass.

Expect an acknowledgement within seven days. There is no bug bounty; this is an
unfunded open project maintained by one person with collaborators.

## Supported versions

| Version | Supported |
|---|---|
| `main` | Yes |
| Latest tagged SSTIM release | Yes, for ontology and data-integrity issues |
| Older tagged releases | No — snapshots are immutable by design (ADR 0020) |

Released ontology snapshots are **never** modified after publication. A defect in a
released snapshot is corrected in a subsequent release, not retroactively.

---

## Data boundaries

The distinction the project treats as security-relevant, not merely architectural:

| Class | Where it lives | Leaves the browser? |
|---|---|---|
| Authoritative ontology and public reference data | Static assets, default RDF graph | Already public |
| Annotations | Per-user **named graphs**, never the default graph (ADR 0003) | Only to Firestore when Firebase is configured |
| Logbook entries and personal notes | Local, or the user's own cloud records | Never syndicated or federated by default (ADR 0008) |
| Patch drafts | Local; Firestore for signed-in users | Only with the user's account |

Annotations are separated from authoritative data at the triple level. This is
enforced in `src/rdf/annotations/AnnotationStore.js` and must not be "simplified"
away — merging user contributions into the default graph would silently destroy the
boundary.

## Authentication identifiers

**RDF exports never carry the Firebase authentication ID.** `AnnotationStore`
substitutes a pseudonymous agent identifier, so exported graphs are attributable
across exports without being linkable to an authentication account.

If you add a new export path, preserve this. An export that leaks an auth ID is a
privacy defect, not a formatting bug.

## Secrets and configuration

- Firebase configuration comes from build-time `VITE_FIREBASE_*` environment
  variables, or from the deployment-time `runtime-config.json` beside the
  artifact, which takes precedence and lets one immutable package be repointed
  or run local-only without a rebuild. Never commit either.
- **Absence of `runtime-config.json` changes nothing**: a package built with
  credentials keeps using them. Invalid configuration degrades to local-only and
  reports why, rather than half-enabling an account system.
- A build with no `VITE_FIREBASE_*` values is valid and supported: the application
  runs with no embedded credentials and cloud features are unavailable.
- Firebase web configuration values are not secrets in the cryptographic sense, but
  Firestore security rules are the actual access control. Treat rule changes as
  security changes.
- No analytics, no third-party trackers, no IP or country lookup.

## Cross-origin and the service worker

The service worker returns early for any request whose origin differs from the
application's, and never calls `skipWaiting()` on its own (ADR 0009). Both
constraints are security-relevant: the first prevents the worker interposing on
authentication flows, the second prevents an update terminating a session in
progress.

## Safety-critical parameters

Photosensitivity is a genuine hazard in this domain, not a compliance checkbox.
Flash-rate caps and sweep limits are enforced in code and documented in
[`docs/technical/PHOTOSENSITIVITY_SAFETY.md`](docs/technical/PHOTOSENSITIVITY_SAFETY.md)
and [ADR 0011](docs/decisions/0011-sensory-field-and-flash-safety.md).

**A change that raises or bypasses a safety cap is a security-relevant change**, and
should be reported through this policy rather than opened as an ordinary pull
request. Do not weaken a cap to make a validator pass.

## Self-hosting expectations

For operators running their own instance:

- Serve over HTTPS. The service worker and several browser APIs require a secure
  context.
- The core application needs no inbound network access beyond static file serving.
- If Firebase is enabled, Firestore security rules are your access control — review
  them before exposing an instance to users.
- Back up before upgrading. `Settings → Your data` exports everything held
  locally as one versioned, checksummed file and imports it back on any instance,
  with no account; `make migrate-test` proves the round trip across two genuinely
  separate origins. Scheduling and encryption of those backups are still the
  operator's problem — see
  [`docs/technical/PORTABLE_DEPLOYMENT.md`](docs/technical/PORTABLE_DEPLOYMENT.md).

## Known gaps

Stated openly, because an operator deserves to know what has not been done:

- **No formal threat model** yet — this policy is the current substitute.
- **Boundary tests exist but are not comprehensive.** Session packages are scanned
  for Firebase API keys, the `local-device` pseudonym and uid fields on build *and*
  on parse, and `make session-conformance` re-checks the boundary cross-origin with
  a real account identifier present on the sending instance. Feeds, published
  objects and the identity seam are not yet covered.
- **No backup encryption specification.** Export produces plaintext JSON holding
  personal notes; protecting it at rest is currently the operator's responsibility.
- **No independent security audit** has been performed.
- **No isolated staging environment** for the published instance.

Progress against these is tracked in
[`docs/technical/PORTABLE_DEPLOYMENT.md`](docs/technical/PORTABLE_DEPLOYMENT.md) §4.

## Scope

In scope: data-boundary violations, authentication-identifier leaks, safety-cap
bypasses, service-worker origin handling, dependency vulnerabilities that affect a
deployed instance, and defects in released ontology artefacts.

Out of scope: the separate commercial BioSynCare application, which is a different
repository with its own reporting path; and issues requiring physical access to a
user's device.
