# ADR 0024 — Modeling the sensory-stimulation ecosystem (agents)

**Status:** Accepted — 2026-07-12

> **Amended by [ADR 0031](0031-qualified-ecosystem-records.md), 2026-07-15.**
> The identity and placement rules remain in force. Notify-and-honor applies to
> organizations; a named person requires self-publication or scoped
> consent under ADR 0031. The flat relationship and lifecycle properties in §§4–5 are superseded for new
> data by qualified relationship records. ADR 0031 also separates the
> retractable, approved public current-state projection from the append-only
> private operational audit. **Archive-boundary clarification, 2026-07-15:**
> `make snapshot` copies only ontology term modules, but the GitHub–Zenodo
> integration archives the repository state at a release tag. Exclusion from
> the ontology snapshot therefore does not by itself exclude a file from the
> DOI deposit. The live-only placement rules below are corrected accordingly.

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

Instances use `https://w3id.org/sstim/organization/{id}` and
`.../specialist/{id}` and are **never** placed in the reusable term space
(§5.1). Archival is **tiered by consent**:

- **Default: live-only, outside the release repository.** Approved current
  records are served from a mutable publication store that is not included in
  this Zenodo-tracked repository and is not automatically deposited in a DOI
  archive. The store must support prompt correction/removal and have a
  documented retention policy. Synthetic contract fixtures may remain under
  `static/ontology/instances/ecosystem/`; real live-only records may not. The
  `make snapshot` term-only exclusion is useful but is not the privacy boundary,
  because a GitHub release deposit archives the repository state at its tag.
  Third-party caches and copies of already served public facts can still exist;
  that limitation must be disclosed before publishing a person.
- **Opt-in: archival, on `archivalConsent`.** An agent who has given specific,
  informed consent that the entry is *permanent, citable, and not fully
  erasable* becomes eligible for a separate archival deposit or an explicitly
  release-included archival subset —
  for **individuals only** with that explicit permanent-credit consent (e.g., a
  named advisor who wants durable attribution). Organization archival also
  remains disabled until a curator-authorization and notice policy is accepted;
  organization status does not itself authorize permanent publication.

This resolves the erasure-vs-immutability tension: personal data enters an
immutable, citable archive **only** when the individual has knowingly chosen it.

## Governance

1. **Inclusion criteria.** Public organizations relevant to sensory stimulation;
   individuals with a **public professional profile**. Prefer Wikidata / ORCID /
   Wikipedia / ROR for verifiable identity, but a public professional presence
   elsewhere suffices. **Only public, professional information** — no private
   data, no non-professional contact details, no special-category data.
2. **Consent posture — notify-and-honor, tightened for people.**
   Public organization facts may use notify-and-honor. A named person in this
   public dataset must instead self-publish or give scoped consent before final
   approval. Notification alone is insufficient. Objections, changes, and
   removals are honored promptly in the active public graph. Public delivery
   cannot promise erasure from third-party caches; permanent DOI archival is a
   still higher, explicit-consent decision and is not yet implemented.
3. **Provenance & verification.** Every new factual claim carries IRI-valued
   `dct:source` on its qualified relationship; legacy `recordSource` is
   deprecated. External identity IDs are verified against the authoritative
   record.
4. **No endorsement, no false affiliation.** Recording an agent's relationship to
   sensory stimulation does not imply it endorses SSTIM, BSC Lab, or BioSynCare,
   nor any affiliation unless stated with a source.
5. **Non-clinical (CLAUDE.md §3.5).** No agent record implies clinical efficacy,
   medical endorsement, or that a named clinician certifies a protocol.
6. **Data minimization.** Store the least that serves discovery and attribution.
7. **Removal.** Record the terminal event in the access-controlled private
   ledger, then remove the relationship, its public activities, backlinks, and
   any orphaned agent from the active public graph. The controlled live store
   must not retain the removed public version beyond its disclosed retention
   policy. Third-party copies cannot be recalled; no identifying withdrawal
   tombstone is retained publicly.
8. **Review cadence.** Re-verify external IDs and refresh from public sources
   periodically; reconcile with `docs/ecosystem/PARTNERS.md` and
   `ADVISORY_BOARD.md`, whose consent caveats are authoritative for named people.

## Consequences

- Adds a neutral ecosystem-agent layer, discoverable in the graph browser (an
  "Ecosystem / agents" scope) and queryable ("who works on binaural beats?").
- Introduces the project's first modeling of real named individuals, with a
  minimal approved public state and a separate private consent/engagement audit
  rather than ad-hoc listing.
- The consent-gated archival tier preserves the erasure safety-valve by default
  while allowing durable credit for those who explicitly want it.
- A mutable external publication store and loader/dereferencing path are now a
  prerequisite for real live-only records. Until they exist, the repository
  admits synthetic fixtures only.
- Implementation follow-ups: the `sstim-ecosystem` module, its SHACL shape, a
  graph-browser scope, loader entries, and an atomic first admitted aggregate:
  the accountable curator, initial organizations, and at least one approved
  relationship for every included agent. Components may be drafted separately
  but are not admitted as detached public identities.

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
- **Prose only (`PARTNERS.md`/`ADVISORY_BOARD.md`).** Kept as a possible
  consent-of-record for named people; an entry may mirror into RDF only when
  its confirmation covers the specific relationship and purpose and every ADR
  0031 admission gate passes.
