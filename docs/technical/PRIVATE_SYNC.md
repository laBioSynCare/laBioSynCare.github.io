# `bsc-lab-private-sync-1` — private synchronisation protocol

**Status:** specified and conformance-tested 2026-07-31 · `src/sync/` ·
**no network service exists, deliberately**

A protocol for keeping *one person's own records* on a service they control,
with an executable reference implementation and a conformance suite that any
implementation must pass.

---

## 1. What this is not

[ADR 0039](../decisions/0039-sharing-model-and-the-shared-backend-question.md)
split two jobs that a hosted backend usually conflates:

| | Obligation |
|---|---|
| **Keeping my own data across my devices** | Bounded. Identity plus storage. No moderation, no abuse surface |
| **Hosting my content for others to read** | Permanent. Authorization, moderation queues, abuse handling, legal exposure |

This protocol is **only the first**. It has no concept of another reader, no
visibility flag, no feed and no share operation — and that absence is the design
rather than an omission to be filled in later. Sharing happens through
publication (ADR 0039 §2), which needs no service at all.

**There is no network service in `main`, and that is a decision.** A
specification plus a reference implementation plus a passing conformance suite is
an honest claim. An internet-facing server with an unreviewed authentication
boundary, merged to look complete, is not — and it would be the one component
here capable of leaking other people's private notes.

---

## 2. The five guarantees

A conforming implementation must hold all five. The suite in
`src/sync/privateSync.conformance.test.js` tries to violate each.

**1. Scope isolation.** Every operation runs against exactly one owner's scope.
Reading, listing or deleting across scopes is impossible.

Cross-scope reads answer **404, not 403** — telling a caller that a record exists
but belongs to someone else is itself a disclosure. The suite asserts that an
absent record and someone else's record produce *identical* answers.

**2. Conflicts are detected, never resolved.** A write carries the revision it
expects; a stale one fails with `409` **and returns the current record** so the
caller can merge. Last-writer-wins would lose someone's notes without telling
them.

Creating an id that already exists is also a conflict — two devices creating the
same record must not silently clobber one another.

**3. Deletion propagates.** Deletes leave a tombstone: id and type retained, body
dropped. A record that simply vanished is indistinguishable from one that never
synced, and the next device would resurrect it.

`deleteAll` is the exception: account deletion leaves *nothing*, because
tombstones would mean the account was not actually deleted.

**4. The account never becomes data.** A record may not carry a provider
`subject` or `email`, and a record id may not be derived from the scope. `${uid}:1`
is the obvious temptation and it makes every record unportable the moment the
account changes, besides leaking the identifier into every export.

Scope is a property of the *connection*, not of the data. That is what lets an
export restore under a different account — the same rule the instance export and
`AnnotationStore` already follow.

**5. Unknown versions fail closed.** A record written by a newer protocol is
refused with `400`, never partially interpreted.

---

## 3. Operations

```
list(scope, { type?, includeDeleted?, limit? })  → record[]
read(scope, id)                                  → record        404 if not yours
revisionOf(scope, id)                            → revision|null
write(scope, record, expectedRevision)           → record        409 on conflict
remove(scope, id, expectedRevision)              → tombstone     409 on conflict
exportAll(scope)                                 → envelope
deleteAll(scope)                                 → { deleted }
```

A **record**:

```json
{
  "model": "bsc-lab-private-sync-1",
  "id": "9f2c…",           // random, 128-bit, account-independent
  "type": "logbookEntry",  // logbookEntry | annotation | patch | profile | preference
  "body": { },             // ≤ 1 MiB, no subject, no email
  "deleted": false,
  "revision": "…",         // opaque; changes on every write
  "updatedAt": 0
}
```

`revision` is **opaque**. The reference implementation uses a counter; a
networked one would more likely use an ETag or a row version. Nothing outside the
implementation parses it — only equality matters.

Errors carry the HTTP status a transport binding must use, so every transport
agrees rather than each choosing: `409` conflict, `422` invalid, `400` unsupported
version, `404` out of scope.

---

## 4. What exists

| | |
|---|---|
| `src/sync/privateSync.js` | Protocol constants, validation, conflict semantics, error types |
| `src/sync/memoryPrivateSync.js` | Complete in-memory reference implementation |
| `src/sync/privateSync.conformance.test.js` | 32 assertions any implementation must pass |

The suite is written against the *interface*, not the in-memory store, so a
networked implementation inherits it unchanged. That is the point of specifying
the protocol before building the service.

---

## 5. What a networked implementation still needs

Named here so the gap is visible rather than implied:

- **an authentication boundary** establishing `scope` from a verified credential —
  the reference implementation takes it as an argument, which is exactly the part
  that cannot be hand-waved;
- no anonymous remote writes;
- same-origin or tightly configured CORS;
- bounded request sizes and rate limits;
- authorization tests running against the real transport;
- a documented threat model;
- storage encryption at rest, and a stated backup posture;
- a NixOS module and OCI composition, so it deploys the way the application does.

Until those exist, the honest claim is the one at the top of this document: the
protocol is specified and conformance-tested; the service is not built.
