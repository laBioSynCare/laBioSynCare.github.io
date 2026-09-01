# BioPortal release integrity

`bioportal-release-integrity.json` freezes the exact bytes, canonical RDF graph,
and manifest-selected source closure served from the stable BioPortal pull URL.
Existing release records are append-only: CI anchors each version to its first
valid appearance in the default branch's first-parent history and rejects a
modification or deletion, because either would authorize another submission
under the same ontology version. Treat a ledger-bearing commit as publication
approval: review the candidate before committing it, and amend or squash drafts
before they reach the default branch.

After a new ontology snapshot has been cut and selected by `void.ttl`, use the
explicit candidate target. The production target has no proposal-mode override:

```bash
make bioportal-bundle-candidate BIOPORTAL_OUT=/tmp/sstim-full.owl
```

The target first resolves a stable direct-child snapshot, verifies every Full
semantic module against its manifest hash, builds from those frozen files,
normalizes only root identity metadata, and runs an OWL-aware source/bundle diff.
It prints a proposal only after that diff confirms that no semantic axiom was
lost or added outside the documented ontology-header transform.

Review the release, ordered source-closure SHA-256, artifact SHA-256, canonical
graph SHA-256, byte count, and triple count, then append that new version under
`releases`. Never replace an existing entry. Finally run the append-only and
strict generation gates:

```bash
make bioportal-ledger-check
make bioportal-bundle BIOPORTAL_OUT=/tmp/sstim-full.owl
make bioportal-bundle-verify BIOPORTAL_OUT=/tmp/sstim-full.owl
make bioportal-reproducible
make validate
```

Both fresh generation and cache-hit installation enforce the ledger. The Pages
cache key includes the recorded byte SHA-256, so changing build tools cannot
silently redefine a frozen artifact; a cache miss that produces different bytes
fails before deployment. Pages verifies cache data before RDF parsing and use,
rebuilds from frozen sources when a hit is invalid, and saves a verified miss
immediately. Because exact cache keys are immutable, delete a corrupt occupied
entry (or advance the documented cache-schema prefix) to restore cache efficiency;
correctness does not depend on that cleanup.
