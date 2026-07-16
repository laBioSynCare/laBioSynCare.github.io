# SSTIM ecosystem publication operations

This runbook keeps real named ecosystem records outside the versioned,
Zenodo-tracked source repository. The repository contains the ontology,
validation contract, loader declaration, and exact redirect configuration—but
not the live RDF aggregate or its private audit history.

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

## Admission and publication sequence

1. Author one self-contained public aggregate and a complete private ledger in
   access-limited paths outside this repository.
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
  --public-candidate /secure/work/public-aggregate.ttl \
  --private-ledger /secure/work/private-ledger.ttl
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
scheduled retention review. Third-party caches and previously downloaded copies
cannot be recalled.

Run the synthetic terminal-deletion guard before each operational change:

```sh
make ecosystem-contract
```
