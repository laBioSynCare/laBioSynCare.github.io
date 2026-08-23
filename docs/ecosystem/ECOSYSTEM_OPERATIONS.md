# SSTIM ecosystem publication operations

This runbook keeps real named ecosystem record triples outside the versioned,
Zenodo-tracked source repository. The repository contains the ontology,
validation contract, loader declaration, and exact redirect configuration—but
not the live RDF aggregate or its private audit history. Exact redirect paths
are identifying configuration metadata and remain visible in Git history; they
are not retractable instance data.

## Storage contract

- Public live projection: `https://biosyncare-lab.web.app/current.ttl`, served
  by the existing Firebase Hosting site as read-only Turtle with wildcard CORS
  and `Cache-Control: no-store`. Each activation creates one new version and,
  after byte-for-byte endpoint verification, deletes older Hosting versions so
  their content is not intentionally retained as a public history. This
  otherwise-unused default Hosting site is reserved for the SSTIM live
  projection; do not deploy the BSC Lab application or unrelated files to it.
- Access-controlled ledger: Firestore collection `sstimEcosystemAudit` in
  project `biosyncare-lab`. Each admitted aggregate creates a hash-addressed
  immutable audit document before public activation. Firestore Security Rules
  explicitly deny every client read and write; only project IAM administrators
  can operate the ledger.
- Access owner: the maintainers of Google Cloud project `biosyncare-lab`, with
  Renato Fabbri as the initial accountable operator. No public or
  all-authenticated-users principal has client access to the audit collection.
- Public records are live-only under the current contract. This storage path is
  not an archival-consent mechanism and does not place the record in a citable
  ontology release.

The active audit document is retained while its public aggregate remains
active. After a terminal removal, the final audit state is retained privately
for 365 days and then deleted during the annual access/retention review. This
live-only retention rule is not archival consent.

## Current reviewed seed

The complete enriched replacement is active at the mutable
[`current.ttl`](https://biosyncare-lab.web.app/current.ttl) endpoint. To preserve
the live-only boundary, this versioned runbook does not duplicate its current
person names, professional titles, or complete relationship claims. Each public
relationship remains separately approved and sourced. One current leadership
claim uses an approved temporary self-attestation exception: the cited public
pages establish the organization identity rather than the titles, and the
authenticated authorization stays only in the access-controlled ledger until a
canonical official-page or immutable-profile source exists. Unknown role-start
dates are not invented; they mean only “known to apply from the reviewed source
package.”

The static catalog and mutable ecosystem projection remain separate. SSTIM is
the ontology, BSC is the framework, BSC Lab and the BioSynCare application are
implementations, and the Patch Studio software component is part of BSC Lab.
An organization agent is distinct from its application implementation, and the
Patch Studio ontology module is distinct from the software component. Exact w3id routes for
the catalog and current live subjects are staged and audited; they must still be
merged upstream and verified before the persistent identifiers are promoted in
human-facing discovery.

## Admission basis: approved status vs. pending status

[ADR 0032](../decisions/0032-visible-pending-status-ecosystem-records.md) adds a
second, explicit admission basis alongside the original ADR 0031 approved-only
path. A public `EcosystemRelationship` is admitted by exactly one of:

- **Legacy / approved basis.** The relationship ends in a uniquely latest
  `PublicationDecisionActivity` with `outcomePublicationApproved`, and (for a
  named person) either self-publication or an earlier scoped
  `outcomeConsentGranted`. This is the only basis on which a relationship is
  presented as *confirmed*.
- **`publicationStatus` / pending basis.** The relationship carries an explicit
  `sstim-eco:publicationStatus` equal to the outcome of its chronologically
  latest engagement activity — typically `outcomeNotificationSent` or
  `outcomeAcknowledged` while a real person has not yet confirmed. No consent
  is required to publish at this basis, because it makes no confirmation
  claim; it only makes visible what the maintainer has done (notified this
  person of this proposed record) and lets the subject review the record, in
  full graph context, before deciding. The graph browser renders this as a
  visible status chip and edge-label suffix, never silently.

Use the pending basis when a record needs to exist publicly for the subject to
review before they consent — the whole point is that they can only evaluate a
proposed relationship if they can see it, including how it connects to the
rest of SSTIM. Advance a relationship from pending to approved by appending a
new engagement activity (acknowledgement, then consent grant, then a
`PublicationDecisionActivity`/`outcomePublicationApproved`) to both the
private ledger and the public aggregate, updating `publicationStatus` to
match at each step, and republishing. Never invent an engagement activity
that did not really happen at either basis — if a person has not actually
responded, the record stays at `outcomeNotificationSent`, not further along.

## Admission and publication sequence

1. Author one self-contained public aggregate and a complete private ledger in
   access-limited paths outside this repository. The standing staging area on
   the operator workstation is `~/.sstim/` (mode `700`); its
   `fetch-active-ledger.py` helper recovers the active ledger from its
   hash-addressed audit document (document id passed as the argument). Only
   tooling persists there: private artifacts are deleted from the directory
   once the publish is verified.
2. Run the full admission contract, including public SHACL, JSON-LD round trip,
   identity/local-IRI checks, private SHACL, and exact public/private mirroring.
3. Confirm the Firestore audit collection remains denied to every client SDK
   user, including authenticated users.
4. Write the complete private ledger to its hash-addressed audit document.
5. Only after that succeeds, create, finalize, and release the Hosting version
   containing public `current.ttl`.
6. Verify public Turtle, CORS, named-graph loading, and exact w3id routes. Do not
   announce a persistent identifier until the corresponding w3id redirect is
   merged and verified.

The executable form is:

```sh
python3 scripts/sstim-ecosystem-publish.py \
  --public-candidate ~/.sstim/public-aggregate.ttl \
  --private-ledger ~/.sstim/private-ledger.ttl
```

Use `--dry-run` to run admission without changing cloud state. The publisher
never prints private ledger contents and fails before public activation when
validation or the private-boundary check fails.

## Correction or removal

Prepare a complete replacement public aggregate plus a private amendment or
terminal event, validate both together, and publish in the same private-first
order. A terminal removal must omit the affected relationship, its public
activities and backlink, and any now-orphaned agent. If no public records
remain, release an empty Hosting version only after the terminal ledger state
has been written. Delete older Hosting versions after verifying the replacement.
Keep the final private terminal audit for 365 days, then delete it at the
scheduled retention review. Remove the affected paths from both audited route
manifests, submit the corresponding upstream w3id rule removal, and verify that
the active identifier no longer redirects to the mutable dump. Historical Git
commits, w3id registry review history, third-party caches, and previously
downloaded copies cannot be recalled. This limitation must be disclosed before
admitting a semantic person/relationship slug; use opaque identifiers instead
when even historical route metadata would be too identifying.

Run the synthetic terminal-deletion guard before each operational change:

```sh
make ecosystem-contract
```
