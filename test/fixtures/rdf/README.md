# RDF contract fixtures

These files exercise the SSTIM qualified-ecosystem publication and audit
contracts. Every identity and event in this tree is synthetic. Never put a real
person, contact channel, consent record, authentication identifier, or private
operational message here.

The word `private` in a directory name describes private-ledger semantics and
validation rules; it does not mean that a committed fixture is access
controlled. Everything tracked here is included in tagged GitHub and Zenodo
repository source archives. Files below `test/` are not deployed by Pages,
listed in VoID, or loaded by the browser as public ontology instance data.

## Fixture families

| Directory | Expected result | Role |
|---|---|---|
| `ecosystem/` | Reject | One public SHACL or SHACL-SPARQL violation per adversarial overlay. |
| `ecosystem-profile/` | Reject | One whole-file subject, IRI, type, or predicate-profile violation per overlay. These checks supplement node-focused SHACL. |
| `ecosystem-positive/` | Conform | Additional valid public-policy scenarios composed with the canonical fixture. |
| `ecosystem-private/` | Conform | Synthetic complete-history baselines for the separate private-audit profile. |
| `ecosystem-private-negative/` | Reject | Standalone invalid withdrawal, amendment, invalidation, or replacement histories. |

The canonical positive public graph is
[`static/ontology/instances/ecosystem/fixtures/synthetic-ecosystem.ttl`](../../../static/ontology/instances/ecosystem/fixtures/synthetic-ecosystem.ttl).
Public adversarial and positive files are generally small overlays composed
with that graph and the reusable term modules; they are not duplicate complete
datasets. Private-history cases are standalone where isolation is necessary to
test terminal-state and revision rules.

## Why one file per case

[`scripts/sstim-ecosystem-contract.py`](../../../scripts/sstim-ecosystem-contract.py)
maps every adversarial filename to the diagnostic it must produce. The gate
fails if a file lacks an expectation, an expectation lacks a file, a negative
case unexpectedly conforms, or it is rejected for the wrong reason. Keeping
cases separate prevents one violation from hiding another and makes each RDF
counterexample independently reviewable.

Run the complete contract with:

```sh
make ecosystem-contract
```

When pySHACL is importable, isolated SHACL cases run in a bounded worker pool
of up to four processes. This changes scheduling only: every file still gets a
separate validation and intended-diagnostic assertion. Use
`make ecosystem-contract SHACL_WORKERS=1` for serial debugging. An explicit
`PYSHACL=...` override retains the compatible CLI path.

When real public ecosystem data exists, its complete operational history must
remain outside this repository and be supplied explicitly:

```sh
make ecosystem-contract PRIVATE_LEDGER=/secure/path/ecosystem-audit.ttl
```

To add a case, create the smallest RDF graph or overlay that demonstrates one
invariant, then add its filename and intended diagnostic to the corresponding
expectation set in `scripts/sstim-ecosystem-contract.py`.
