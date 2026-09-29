# ADR 0059: The W3C Community Group publishes SSTIM

**Status:** Accepted · 2026-09-29 · on the 0.19.0-dev line, first released in
0.19.0

## Context

Every SSTIM release from 0.1.0 through 0.18.0 names
`https://github.com/laBioSynCare` as `dct:publisher`. The statement sits on
every ontology header, twenty-two files (sixteen modules, two shape modules and
the four profile entry points), and on the VoID description; 0.18.0 added its
name, "laBioSynCare".

Publication itself had moved. The source repository is `w3c-cg/sstim`, the
ontology and the Workbench are served from `w3c-cg.github.io/sstim` since the
w3id cutover of 2026-08-27, and the W3C Sensory Stimulation Vocabulary
Community Group published its Draft report on the vocabulary on 2026-09-07.

The surfaces had drifted apart as a result. The site's dataset JSON-LD already
named the group as publisher. `codemeta.json` named it only as producer, on the
reasoning that "publisher" would imply W3C endorsement. The registry tracker
told every registry to keep laBioSynCare "until the publisher/steward
governance question is resolved", and
[W3C_REPOSITORY_MIGRATION_REPORT.md](../ecosystem/W3C_REPOSITORY_MIGRATION_REPORT.md)
listed that question for W3C staff. Then, on 2026-09-29, LOV set the group as
publisher at Renato Fabbri's request, so its record disagreed with both files
it stores.

## Decision

1. **The publisher is the group.** Every ontology header and `void.ttl` state
   `dct:publisher <https://www.w3.org/community/sstim/>`. The Kernel describes
   that IRI once, as a `foaf:Organization` named "W3C Sensory Stimulation
   Vocabulary Community Group"; `void.ttl` repeats the description for
   catalogues, as it does for the creator.

2. **No disclaimer.** The group is a W3C Community Group and it publishes
   SSTIM, which is the whole claim. W3C's own template for Community Group
   reports reads "This report was published by the [Group Name]", so this is
   how W3C describes a group's publications. The endorsement reasoning in the
   codemeta generator is withdrawn, and `codemeta.json` names the group as
   publisher.

3. **The identifier is the group page,** `https://www.w3.org/community/sstim/`,
   the address LOV records and `.zenodo.json` names. W3C serves the same group
   at `https://www.w3.org/groups/cg/sstim/` too, which the Workbench links as
   `W3C_GROUP_URL`; both resolve, and the ontology uses one.

4. **Only the publisher changes.** The creator stays Renato Fabbri, by ORCID.
   This answers the publisher half of the tracker's question; nothing about
   maintenance or release authority is decided here.

5. **Frozen releases are not touched.** 0.1.0 through 0.18.0 keep
   laBioSynCare, which is what they were published with.

## Consequences

- The namespace catalogues regenerate from the modules, so all sixteen headers
  in the document `https://w3id.org/sstim` serves agree from 0.19.0 on.
- Registries that show a publisher can be updated once 0.19.0 is released:
  BARTOC's publisher field and FAIRsharing's organisation link among them.
  LOV already shows the group; the two versions it stores still say
  laBioSynCare until 0.19.0 is added.
- The group's place in the ecosystem model is unchanged. Publishing SSTIM does
  not make it a component of the BioSynCare programme
  ([ADR 0047](0047-programme-identity-path.md)), and its live relationship
  record keeps its type.
