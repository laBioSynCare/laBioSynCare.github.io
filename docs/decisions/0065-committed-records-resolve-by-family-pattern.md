# ADR 0065: Committed records resolve by family pattern

**Status:** Accepted · 2026-10-14 · decided under the maintainer's delegation
in session ("ok, do it all"), with permission to edit any file in the
repository. The rules take effect when the maintainer's pull request against
`perma-id/w3id.org` merges.

## Context

Published protocols got identifiers on 2026-10-13
([ADR 0064](0064-published-protocols-schedules-arms-and-control-laws.md)), and
none of them resolved. Measuring why found a much larger gap. Every
`https://w3id.org/sstim/...` identifier in the committed RDF was run through
`scripts/w3id-negotiation.mjs`, the repository's model of the w3id.org rules,
and samples were confirmed against the live w3id.org with `curl`. 176
identifiers resolved nowhere:

| Family | Identifiers | Resolved |
|---|---|---|
| evidence (`implementation/bsclab/evidence/...`) | 116 | 0 |
| protocols, BSC Lab's own two included | 11 | 0 |
| experiments | 10 | 0 |
| references | 19 | 11 |
| presets | 5 | 5 |

The rest were synthetic fixtures, named graphs and the private audit shapes,
which are unrouted on purpose.

Presets and references resolved because the w3id.org rules named each one. The
mirror's own documentation stated the rule behind that: an exact inventory,
not a namespace wildcard, so that an unknown identifier stays a 404 "instead of
making an aggregate file appear to describe a record it does not contain."
That rule is right, but its price was a pull request against a repository we do
not own for every new record, which the w3id.org maintainer asked us to stop
paying for releases ([ADR 0053](0053-wildcard-snapshot-routes.md)). Protocols,
experiments and evidence were never routed at all, and nothing in this
repository checked that a committed identifier resolves, so for months the gap
was visible only to a reader who followed one.

## Decision

**1. One pattern per family of committed records.** Adding a record to a
family needs no registry change.

| Family | Identifier | Browser | RDF client |
|---|---|---|---|
| presets, protocols, experiments | `implementation/bsclab/{family}/{name}` | `/graph/#bsclab-{family}:{name}` | `ontology/instances/{family}s/{name}.ttl` |
| evidence | `implementation/bsclab/evidence/{path}`, nested | `/graph/#bsclab-evidence:{path}` | `ontology/records/implementation/bsclab/evidence/{path}.ttl` |
| references | `ref/{KEY}` | `/graph/#sstim-ref:{KEY}` | `ontology/records/ref/{KEY}.ttl` |

Each family accepts a grammar (`[a-z0-9-]+` for names, nested segments for
evidence, `[A-Z][A-Z0-9_]*` for reference keys), and anything else stays a 404
at w3id.org.

**2. An RDF client gets a document describing that record alone.** Presets and
experiments already had one committed file per record, named after it.
Protocols now do too: the two combined protocol files became eleven, each
holding one protocol and its `#` parts. References and evidence records share
files, so the build generates a record document for each committed one
(`scripts/gen-record-documents.mjs`): the record's own triples, its `#` parts
and the blank nodes they reach, sorted so that every build writes the same
bytes. Like the reference documentation
([ADR 0023](0023-ontology-docs-publication-path.md)), they are
build output and never committed.

**3. A browser lands on the record's node.** The knowledge browser now loads
protocols, experiments and evidence, and makes a catalog node of every routed
record, so following an identifier never ends at a "not found" banner.

**4. The proof is executed here.** `scripts/check-w3id-record-routes.mjs`,
part of `make w3id-routes`, runs the rules against every committed record and
fails unless a browser reaches its node and an RDF client a published document
that describes it. It also fails if a name that is no record reaches a
published file, if a path outside every grammar answers anything but 404, or if
any SSTIM identifier in the committed RDF resolves nowhere without a reason in
its short list of deliberate exceptions. `src/rdf/recordFamilies.js` is the one
definition of the families that the rules' proof, the generator and the graph
share.

## Consequences

**What is given up.** A name that is no record is now redirected by w3id.org,
because a pattern matches it, and ends at a 404 from GitHub Pages instead of a
404 from w3id.org. A redirect is no longer evidence that a record exists, as
ADR 0053 accepted for versions. What the exact inventory protected is kept: no
redirect reaches a file that does not describe the record asked for.

**What is gained.** A new preset, protocol, experiment, evidence record or
reference resolves the moment it is published. A new family still needs a
rule, and the identifier scan fails until it has one, which is the check whose
absence let 176 identifiers go unresolved.

**Changed answers.** The eleven public-safe references used to resolve to
`references.ttl`; they now resolve to a document of their own with the same
statements about them. `published-protocols.ttl` and
`bsc-reference-protocols.ttl` are gone. Neither was a route target, so no
identifier that resolved before changes, and every protocol keeps its
identifier.

**Order of work.** The rules live in `perma-id/w3id.org`, mirrored in
`docs/ecosystem/w3id/sstim/.htaccess`. The targets are deployed first, so the
pull request merges onto documents that exist. Until it merges these
identifiers still answer 404, exactly as measured above.

## Alternatives considered

**Keep enumerating and add the missing names.** One pull request per record,
against the maintainer's request, and an enumeration of 116 nested evidence
identifiers.

**Patterns that send a family to its shared file.** The simplest rules, and the
failure the exact inventory existed to prevent: a misspelled reference key would
answer with `references.ttl` and appear to resolve.

**Give the records new identifiers that existing rules already match.** Breaks
every link made so far and gains nothing.

**A generic record page for browsers.** It would serve every family without
touching the graph, but the established convention sends an entity identifier
to its node in the knowledge browser (upstream #6393, restored in #6517), so
the families were loaded into the browser instead.

**Commit the record documents.** A second copy of every reference and evidence
record in git, to drift from the first. The build writes them identically every
time, so there is nothing to keep.
