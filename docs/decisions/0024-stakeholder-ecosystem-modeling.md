# ADR 0024 — Modeling the sensory-stimulation ecosystem (agents)

**Status:** Accepted — 2026-07-12

## Context

SSTIM describes techniques, protocols, evidence, and safety, but not the
**people and organizations** in the sensory-stimulation field — specialists,
research groups, laboratories, companies, standards bodies, peer projects, cited
authors. The w3id namespace already reserves `/organization/{id}` and
`/specialist/{id}` paths for exactly this (CLAUDE.md §5.1), but no classes,
properties, or instances exist yet.

Recording a real ecosystem in a **public, versioned** dataset raises concerns
the rest of SSTIM's data does not:

- People are personal data. Even public professional facts carry obligations
  under GDPR/LGPD (rights to be informed, to object, to erasure).
- "X works in sensory stimulation" is a **claim**, subject to the project's
  evidence/public-claim discipline (ADR 0018) and its external-identifier
  verification norms.
- The maintainer's position is to include public organizations and public
  figures (favouring, but not requiring, entities already in Wikidata / ORCID /
  Wikipedia / ROR), while explicitly **tracking notification, response, consent,
  contribution, and relationship** so inclusion is transparent and revocable.

Two naming/scope questions shaped this decision. First, the umbrella term:
"stakeholder" over-claims (a 1995 cited author is not a current stakeholder) and
"contributor" both collides with `dcterms:contributor` (contributor *to a
resource*) and is laudatory rather than neutral. Second, whether consent can
change what may be archived.

## Decision

Model the ecosystem in a new term module, with instances as curated
implementation data, a neutral agent umbrella, and a **consent-gated** archival
posture.

### 1. New module `sstim-ecosystem`

A new term module `static/ontology/sstim-ecosystem.ttl`, namespace
`https://w3id.org/sstim/ecosystem#` (prefix `sstim-eco:`), following the
exposure-module pattern (`owl:versionInfo` only, `dct:isPartOf
<https://w3id.org/sstim>`, ADR 0020). It defines the umbrella class, the
engagement/relationship properties, and the controlled-value schemes below, and
carries **no personal data** — only reusable terms.

### 2. Umbrella — a neutral agent, reusing standards

- Instances are **dual-typed** with external vocabularies (mirroring the SKOS
  dual-typing pattern): people as `schema:Person` (`foaf:Person`); organizations
  as `schema:Organization` (+ `org:` / `schema:ResearchOrganization`,
  `schema:Corporation`, `schema:CollegeOrUniversity`, `org:OrganizationalUnit`).
- Umbrella class **`sstim-eco:EcosystemAgent`** — a person or organization
  active in or relevant to sensory stimulation — declared
  `rdfs:subClassOf prov:Agent`. So `?a a sstim-eco:EcosystemAgent` enumerates the
  ecosystem, while the class stays evaluatively neutral (not "stakeholder" or
  "contributor" — those are relationship values, §4).

### 3. Identity — verified external IDs

Link to authoritative identity records with `owl:sameAs` / `schema:sameAs`:
ORCID (`https://orcid.org/…`) for people, ROR (`https://ror.org/…`) for
organizations, Wikidata (`http://www.wikidata.org/entity/Q…`), and `schema:url`
for the public homepage. Every external ID is checked against the live
authoritative record before use — the discipline already applied to the
BFO/OBI/Wikidata alignments.

### 4. Relationship to sensory stimulation

- `sstim-eco:relationshipType` → a SKOS scheme `EcosystemRelationScheme`.
  Values: **contributor, stakeholder,** research-collaborator, scientific-advisor,
  cited-author, tool-vendor, standards-body, funder, institutional-host,
  peer-project, referenced-source (extensible). Each is applied where accurate,
  so "contributor"/"stakeholder" label a *kind of involvement*, not every agent.
- `sstim-eco:relatesTo` → the specific SSTIM resource (a technique, the
  framework, the W3C CG, a reference, the platform), when applicable.
- `sstim-eco:expertiseArea` → SSTIM SKOS concepts (modalities, mechanisms,
  techniques) the agent works on — a sourced claim, not an assertion of rank.

### 5. Engagement lifecycle — the transparency/consent record

These operationalize the maintainer's requested flags. They record **our
process**, factually, distinct from claims about the agent:

- `sstim-eco:recordSource` (**required**) → provenance of the facts: a Wikipedia
  URL, ORCID, ROR, public website, or "personal communication".
- `sstim-eco:consentStatus` (listing tier) → `implicit-public` · `notified` ·
  `consent-requested` · `consent-granted` · `consent-declined` ·
  `removal-requested` · `withdrawn`.
- `sstim-eco:archivalConsent` (**archival tier**, §6) → whether the agent has
  given *specific, informed* consent to permanent, citable archival. Absent by
  default.
- `sstim-eco:notifiedOn` (date), `sstim-eco:notificationChannel`,
  `sstim-eco:notificationStatus` (`not-notified` · `notified` · `failed`).
- `sstim-eco:respondedOn` (date), `sstim-eco:responseStatus` (`no-response` ·
  `acknowledged` · `consented` · `objected` · `requested-removal` ·
  `requested-changes`), `sstim-eco:responseNote` (free text — what they replied).
- `sstim-eco:contributionStatus` (`none` · `potential` · `active` · `past`),
  `sstim-eco:hasContributedTo` / `sstim-eco:couldContributeTo` → SSTIM areas.
- `sstim-eco:addedOn` (date), `sstim-eco:curatedBy` (BSC Lab).

Exact names/cardinalities are finalized at implementation with a SHACL shape in
`sstim-shapes.ttl`; this ADR fixes the model and governance.

### 6. Placement — curated instances, consent-gated archival

Instances live at `https://w3id.org/sstim/organization/{id}` and
`.../specialist/{id}` under `static/ontology/instances/ecosystem/`, **never** in
the reusable term space (§5.1). Archival is **tiered by consent**:

- **Default: live-only, not snapshotted.** Most agents (public facts, listing
  consent or implicit-public) are served live and are freely editable and
  erasable. They are excluded from the versioned Zenodo snapshots (the snapshot
  script freezes only the term modules, ADR 0020), so a removal request touches
  live data and git history only — **no DOI archive contains them.**
- **Opt-in: archival, on `archivalConsent`.** An agent who has given specific,
  informed consent that the entry is *permanent, citable, and not fully
  erasable* becomes eligible for a snapshotted `ecosystem/archival/` subset —
  used **freely for organizations** (legal entities, minimal personal-data risk)
  and for **individuals only** with that explicit permanent-credit consent
  (e.g., a named advisor who wants durable attribution).

This resolves the erasure-vs-immutability tension: personal data enters an
immutable, citable archive **only** when the individual has knowingly chosen it.

## Governance

1. **Inclusion criteria.** Public organizations relevant to sensory stimulation;
   individuals with a **public professional profile**. Prefer Wikidata / ORCID /
   Wikipedia / ROR for verifiable identity, but a public professional presence
   elsewhere suffices. **Only public, professional information** — no private
   data, no non-professional contact details, no special-category data.
2. **Consent posture — notify-and-honor.** Recording public professional facts
   (live) does not require prior consent, but every agent is notified
   (best-effort), the response is recorded (§5), and objections, changes, and
   removals are **honored promptly**. Inclusion in the **citable archive** is a
   higher bar: explicit `archivalConsent` (§6).
3. **Provenance & verification.** Every factual claim carries `recordSource`;
   external identity IDs are verified against the authoritative record.
4. **No endorsement, no false affiliation.** Recording an agent's relationship to
   sensory stimulation does not imply it endorses SSTIM, BSC Lab, or BioSynCare,
   nor any affiliation unless stated with a source.
5. **Non-clinical (CLAUDE.md §3.5).** No agent record implies clinical efficacy,
   medical endorsement, or that a named clinician certifies a protocol.
6. **Data minimization.** Store the least that serves discovery and attribution.
7. **Removal.** For live-only agents, delete from live data (git history retains
   prior states, stated transparently; no snapshot includes them). For
   archival-consented agents, honor removal going forward; prior DOI snapshots
   persist, which the agent knowingly accepted.
8. **Review cadence.** Re-verify external IDs and refresh from public sources
   periodically; reconcile with `docs/ecosystem/PARTNERS.md` and
   `ADVISORY_BOARD.md`, whose consent caveats are authoritative for named people.

## Consequences

- Adds a neutral ecosystem-agent layer, discoverable in the graph browser (an
  "Ecosystem / agents" scope) and queryable ("who works on binaural beats?").
- Introduces the project's first modeling of real named individuals, with an
  auditable consent/engagement trail rather than ad-hoc listing.
- The consent-gated archival tier preserves the erasure safety-valve by default
  while allowing durable credit for those who explicitly want it.
- Implementation follow-ups: the `sstim-ecosystem` module, its SHACL shape, a
  graph-browser scope, loader entries, and the first seed (organizations first,
  then consented public figures).

## Alternatives considered

- **Umbrella `Stakeholder`.** Over-claims a current stake; kept as a
  relationship *value* for agents genuinely invested in the field.
- **Umbrella `Contributor`.** Inclusive under a broad reading, but collides with
  `dcterms:contributor` (contributor *to a resource*) and is laudatory; kept as a
  relationship value.
- **Umbrella `Participant`.** Rejected — collides with study *participants* in
  the session model.
- **Mint SSTIM person/org classes.** Rejected — reuse schema.org/ORG/FOAF/PROV
  for interoperability; SSTIM adds only the agent umbrella and the
  engagement/relationship layer.
- **Blanket "never snapshot personal data."** Softened to the consent-gated tier
  (§6): erasable by default, archivable only on explicit informed consent.
- **Prose only (`PARTNERS.md`/`ADVISORY_BOARD.md`).** Kept as the consent-of-record
  for named people; confirmed entries are mirrored into RDF.
