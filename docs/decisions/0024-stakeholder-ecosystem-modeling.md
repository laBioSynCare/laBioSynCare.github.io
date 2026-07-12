# ADR 0024 — Modeling the sensory-stimulation stakeholder ecosystem

**Status:** Accepted — 2026-07-12

## Context

SSTIM describes techniques, protocols, evidence, and safety, but not the
**people and organizations** working in sensory stimulation — specialists,
research groups, laboratories, companies, standards bodies, peer projects. The
w3id namespace already reserves `/organization/{id}` and `/specialist/{id}`
paths for exactly this (CLAUDE.md §5.1), but no classes, properties, or
instances exist yet.

Recording a real ecosystem in a **public, versioned** dataset raises concerns
the rest of SSTIM's data does not:

- People are personal data. Even public professional facts carry obligations
  under GDPR/LGPD (rights to be informed, to object, to erasure).
- "X works on sensory stimulation" is a **claim**, subject to the project's
  evidence/public-claim discipline (ADR 0018) and its external-identifier
  verification norms.
- The maintainer's position is to include public organizations and public
  figures (favouring, but not requiring, entities already in Wikidata / ORCID /
  Wikipedia / ROR), while explicitly **tracking notification, response, consent,
  contribution, and relationship** so inclusion is transparent and revocable.

## Decision

Model the ecosystem in a new term module, with instances as curated
implementation data, and a governance posture of **notify-and-honor**.

### 1. New module `sstim-ecosystem`

A new term module `static/ontology/sstim-ecosystem.ttl`, namespace
`https://w3id.org/sstim/ecosystem#` (prefix `sstim-eco:`), following the same
module pattern as `exposure` (`owl:versionInfo` only, `dct:isPartOf
<https://w3id.org/sstim>`, ADR 0020). It defines the umbrella class, the
engagement/relationship properties, and the controlled-value schemes below. It
carries **no personal data** — only reusable terms.

### 2. Types — reuse standards, don't mint

Instances are typed with external vocabularies, dual-typed with a thin SSTIM
umbrella (mirroring the SKOS dual-typing pattern, `static/ontology/README.md`):

- Organizations: `schema:Organization` (+ `org:Organization` / subtypes
  `schema:ResearchOrganization`, `schema:Corporation`, `schema:CollegeOrUniversity`,
  `org:OrganizationalUnit` for research groups).
- People: `schema:Person` (`foaf:Person`).
- Umbrella: `sstim-eco:Stakeholder` (a person or organization recorded in the
  SSTIM ecosystem), so `?s a sstim-eco:Stakeholder` enumerates them.

### 3. Identity — verified external IDs

Link to authoritative identity records with `owl:sameAs` / `schema:sameAs`:
ORCID (`https://orcid.org/…`) for people, ROR (`https://ror.org/…`) for
organizations, Wikidata (`http://www.wikidata.org/entity/Q…`), and
`schema:url` for the public homepage. Every external ID is checked against the
live authoritative record before use — the same discipline applied to the
existing BFO/OBI/Wikidata alignments.

### 4. Relationship to SSTIM

- `sstim-eco:relationshipType` → a SKOS scheme `RelationshipTypeScheme`
  (peer-project, research-collaborator, scientific-advisor, cited-author,
  tool-vendor, standards-body, funder, institutional-host, community-member,
  referenced-source, …).
- `sstim-eco:relatesTo` → the specific SSTIM resource (a technique, the
  framework, the W3C CG, a reference, the platform).
- `sstim-eco:expertiseArea` → SSTIM SKOS concepts (modalities, mechanisms,
  techniques) the entity works on — a sourced claim, not an assertion of rank.

### 5. Engagement lifecycle — the transparency/consent record

These operationalize the maintainer's requested flags. They record **our
process**, factually, and are distinct from claims about the entity:

- `sstim-eco:recordSource` (**required**) → provenance of the facts: a Wikipedia
  URL, ORCID, ROR, public website, or "personal communication".
- `sstim-eco:consentStatus` → `implicit-public` · `notified` · `consent-requested`
  · `consent-granted` · `consent-declined` · `removal-requested` · `withdrawn`.
- `sstim-eco:notifiedOn` (date), `sstim-eco:notificationChannel`,
  `sstim-eco:notificationStatus` (`not-notified` · `notified` · `failed`).
- `sstim-eco:respondedOn` (date), `sstim-eco:responseStatus` (`no-response` ·
  `acknowledged` · `consented` · `objected` · `requested-removal` ·
  `requested-changes`), `sstim-eco:responseNote` (free text — what they replied).
- `sstim-eco:contributionStatus` (`none` · `potential` · `active` · `past`),
  `sstim-eco:hasContributedTo` / `sstim-eco:couldContributeTo` → SSTIM areas
  (techniques, modules, the W3C CG).
- `sstim-eco:addedOn` (date), `sstim-eco:curatedBy` (BSC Lab).

Exact property names/cardinalities are finalized at implementation with a SHACL
shape in `sstim-shapes.ttl`; this ADR fixes the model and the governance.

### 6. Placement — curated implementation data, not term space, not snapshotted

Instances live at `https://w3id.org/sstim/organization/{id}` and
`https://w3id.org/sstim/specialist/{id}` under
`static/ontology/instances/ecosystem/`. They are **never** in the reusable term
space (§5.1) and are **not** frozen into the versioned Zenodo snapshots (the
snapshot script freezes only the term modules, ADR 0020). This is deliberate:
it means a removal request affects live data and git history only — **no
DOI-archived snapshot ever contains a person's data.**

## Governance

1. **Inclusion criteria.** Public organizations relevant to sensory stimulation;
   individuals with a **public professional profile**. Prefer entities in
   Wikidata / ORCID / Wikipedia / ROR for verifiable identity, but a public
   professional presence elsewhere suffices. **Only public, professional
   information** — no private data, no non-professional contact details, no
   special-category data.
2. **Consent posture — notify-and-honor.** Recording public professional facts
   does not require prior consent, but every entity is notified (best-effort),
   the notification and any response are recorded (§5), and objections, change
   requests, and removals are **honored promptly**. This satisfies the
   GDPR/LGPD rights to be informed, to object, and to erasure.
3. **Provenance & verification.** Every factual claim carries `recordSource`;
   external identity IDs are verified against the authoritative record.
4. **No endorsement, no false affiliation.** Recording an entity's relationship
   to sensory stimulation does not imply it endorses SSTIM, BSC Lab, or
   BioSynCare, nor any affiliation unless stated with a source.
5. **Non-clinical (CLAUDE.md §3.5).** No stakeholder record implies clinical
   efficacy, medical endorsement, or that a named clinician certifies a protocol.
6. **Data minimization.** Store the least that serves discovery and attribution.
7. **Removal.** On request, delete the instance from live data. Git history
   retains prior states (stated transparently); no Zenodo snapshot includes it.
8. **Review cadence.** Re-verify external IDs and refresh from public sources
   periodically; reconcile with `docs/ecosystem/PARTNERS.md` and
   `ADVISORY_BOARD.md`, whose consent caveats are authoritative for named people.

## Consequences

- Adds a social/ecosystem layer, discoverable in the graph browser (a
  "Stakeholders" scope) and queryable ("who works on binaural beats?").
- Introduces the project's first modeling of real named individuals, with an
  auditable consent/engagement trail rather than ad-hoc listing.
- Keeping instances out of the snapshots preserves the immutability/erasure
  balance and keeps the citable term-space free of personal data.
- Implementation follow-ups: the `sstim-ecosystem` module, its SHACL shape, a
  graph-browser scope, loader entries, and the first seed (organizations first,
  then consented public figures).

## Alternatives considered

- **Prose only (`PARTNERS.md`/`ADVISORY_BOARD.md`).** Already exists, but not
  queryable, linkable, or identity-verified; keep it as the consent-of-record
  for named people and mirror confirmed entries into RDF.
- **Mint SSTIM person/org classes.** Rejected — reuse schema.org/ORG/FOAF for
  interoperability; SSTIM adds only the engagement/relationship layer.
- **Put stakeholders in the term space / snapshots.** Rejected — personal data
  must not enter the citable, DOI-frozen artifact; it stays curated
  implementation data (§6).
- **Require prior opt-in consent for every entry.** Rejected as impractical for
  public organizations and public figures; notify-and-honor with prompt erasure
  is the proportionate posture.
