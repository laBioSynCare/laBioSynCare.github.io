# ADR 0062: One relationship type for anyone in the field, and a public directory of it

**Status:** Accepted · 2026-10-08 · requested by the maintainer, who instructed the
change to `static/ontology/sstim-ecosystem.ttl` and chose to commit the directory

## Context

SSTIM is to add companies, laboratories and researchers and tell them, inviting
each to review how it, its products and its knowledge are represented. That
review is how the people SSTIM describes validate it, and how it gets adopted.
Two things were missing.

**A first record.** Every type in the relationship scheme names a specific role:
tool vendor, scientific advisor, organization member, implementation developer.
`stakeholder` asserts "an active stake or investment", which is false of anyone
who has not engaged yet. `contributor` is used for a contribution to a named
target (SSTIM, a framework, an application). Nothing said simply that an agent
belongs to the field, and nothing could say it of an agent whose contribution is
over, such as a historical author, or announced but not begun.

**A view of the field.** The `/ecosystem/` directory held one entry. The live
graph held nine agents. Neither showed the landscape that candidates come from.

## Decision

### 1. `sstim-eco:ecosystemContributor`

A new top concept of `sstim-eco:EcosystemRelationScheme`, "Sensory stimulation
ecosystem contributor": an agent of any kind that contributes, has contributed,
or has publicly declared that it will contribute to the sensory-stimulation
ecosystem, in any capacity. Its target is `sstim:SensoryStimulation`, or a
narrower technique or resource when the source names one.

- **Time is on the record, not in the type.** A past contribution carries
  `sstim-eco:validUntil`; a declared future one carries `sstim-eco:validFrom` at
  the declared start.
- **A future contribution needs the agent's own public declaration as its
  source.** This keeps the line ADR 0031 drew when it deprecated
  `couldContributeTo`: a curator's guess about what someone could do is still
  not published.
- **It is the entry record, not a summary of the others.** ADR 0031 gives each
  record one type, so a specific role is a separate record beside it.
- **No SKOS hierarchy under it.** The quality audit forbids a top concept with an
  in-scheme broader concept, so hanging the seventeen existing types under the
  new one would demote every one of them in a released scheme. An agent's
  records together say what it does; "everyone in the field" is a query over
  agents, not a hierarchy.
- `contributor` gains a scope note: it records a contribution to its named target.

### 2. A public stakeholder directory, committed to the repository

`/ecosystem/directory/` lists companies, laboratories, people, societies,
standards and projects of the field, each from one public source, faceted by
modality, domain-review status and era. The data is
`src/ui/ecosystem/stakeholderDirectory.js`.

- **A listing is not a record.** It claims relevance to the field from a public
  source. It claims nothing about contact, consent, endorsement, conformance,
  safety or efficacy. Records keep the rules of ADR 0031 and ADR 0032.
- **It is archived.** Every Zenodo release contains the whole repository. The
  maintainer chose this over a live-only listing, knowing that a removal applies
  only to later releases. So an entry holds public professional facts only and
  no contact details, a removal request is honored in the next commit, and
  `.zenodo.json` says so.
- **The listing never asserts graph membership.** An entry names the path its
  agent would have (`agent`), and the page asks the live store at runtime.
  Agents in the store with no entry are shown from the store, so they stay as
  retractable as their records.
- **Individuals may be listed.** That does not lower the bar for a person's
  record, which still requires a real notification first.

### 3. The sequence for a new stakeholder

1. **List** it in the directory, from a public source.
2. **Record** it. An organization goes live on the curator's publication
   decision (notify and honor, ADR 0031). A person goes live only after a real
   notification, at the visible pending status (ADR 0032).
3. **Notify** it, inviting review of the record in its graph context and of how
   SSTIM represents its field. Replies become engagement activities;
   corrections become amendments; an objection removes the record.
4. **Enrich** it, one at a time: technique targets and specific roles in the
   live store. A product becomes an implementation only after the company has
   reviewed its record, because implementations are committed, released
   instance data.

`scripts/sstim-ecosystem-stage.py` stages a batch for `make ecosystem-publish`.
It refuses a person approved by the curator alone, the reuse of a relationship
IRI the ledger holds, an agent once removed from the live graph, and any claim
without a source.

## Alternatives considered

- **Use `stakeholder`.** It asserts a stake that has not been established.
- **Widen `contributor`.** That changes the meaning of a released term that live
  records already use for named targets.
- **An OWL property on agents.** A direct property bypasses the qualified record,
  its sources and its engagement history, which is what ADR 0031 exists for.
- **A live-only directory.** Fully retractable, but it needs a second hosted file
  and a publish path of its own. The maintainer chose to commit it.

## Consequences

- 0.19.0 adds one concept and deprecates nothing.
- The first batch, five companies and three laboratories, went live on
  2026-10-08 with this type, each targeting `sstim:SensoryStimulation`.
- The directory's sources decay. `DIRECTORY_REVIEWED` dates the last check;
  re-measure before relying on an entry (CLAUDE.md §3.6).
