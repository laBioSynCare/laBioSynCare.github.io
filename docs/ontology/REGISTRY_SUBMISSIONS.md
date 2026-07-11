# SSTIM Registry Submissions

Status: active tracker

Owner: Renato Fabbri

Created: 2026-07-11

This file operationalizes the **Registry Strategy** of
[PUBLICATION_AND_INTERLINKING_PLAN.md](PUBLICATION_AND_INTERLINKING_PLAN.md).
It holds (1) a reusable metadata kit every registry asks for, filled once, and
(2) a per-registry record: what it needs, whether it can go today, the
pre-filled values, and a status slot to complete after submitting.

> **Verify the intake mechanism at submission time.** Registry submission forms,
> endpoints, and account requirements change. The entry points below are the
> known ones; confirm each is current before submitting rather than trusting
> this file. Do not record a registry as submitted here until it is actually
> accepted and live (the plan's rule against claiming a registration early).

---

## 1. Reusable metadata kit

Every field below is copy-paste ready and verified against the released
ontology (`static/ontology/sstim-core.ttl`, `void.ttl`) on 2026-07-11.

| Field | Value |
|---|---|
| Title | Sensory Stimulation Ontology (SSTIM) |
| Stable ontology URI | `https://w3id.org/sstim` |
| Namespace URI | `https://w3id.org/sstim#` |
| Preferred prefix | `sstim` |
| Current version | `0.6.0` |
| Version IRI | `https://w3id.org/sstim/0.6.0` |
| Concept DOI (all versions) | `10.5281/zenodo.21286974` |
| Version DOI (0.6.0) | `10.5281/zenodo.21302910` |
| License | CC BY 4.0 — `https://creativecommons.org/licenses/by/4.0/` |
| Creator | Renato Fabbri — ORCID `0000-0002-9699-629X` |
| Publisher | `https://github.com/laBioSynCare` |
| First released | 2026-04-12 |
| Current release date | 2026-07-11 |
| Source repository | `https://github.com/laBioSynCare/laBioSynCare.github.io` |
| HTML documentation | `https://labiosyncare.github.io/ontology/docs/` |
| Turtle (core) | `https://labiosyncare.github.io/ontology/sstim-core.ttl` |
| JSON-LD (core) | `https://labiosyncare.github.io/ontology/sstim-core.jsonld` |
| RDF/XML (core) | `https://labiosyncare.github.io/ontology/sstim-core.rdf` |
| VoID/DCAT | `https://labiosyncare.github.io/ontology/void.ttl` |

**Short description (≤ 300 chars).**
> SSTIM is an OWL 2 ontology with a multilingual SKOS vocabulary and SHACL
> shapes for describing sensory stimulation techniques, protocols, presets,
> exposure conditions, safety metadata, and evidence-qualified claims across
> auditory, visual, and tactile modalities.

**Keywords.** sensory stimulation, brainwave entrainment, binaural beats,
isochronic tones, audio-visual entrainment, vibrotactile stimulation, paced
breathing, multisensory integration, SKOS vocabulary, SHACL, evidence tiers.

**One-line no-clinical-claims note (for reviewers who ask about scope).**
> SSTIM models parameters, provenance, and evidence status; it asserts no
> clinical efficacy. See `docs/concept/SCOPE.md`.

---

## 2. Readiness at a glance

The core ontology URI (`https://w3id.org/sstim`) already dereferences through
w3id to Turtle/JSON-LD/RDF-XML, and the WIDOCO HTML is live — so registries
that target the core URI can go **now**. The pending perma-id PR #6337 only adds
the `/sstim/exposure` and `/sstim/void` routes; it does **not** block core-URI
registration.

| Registry | Can submit now? | Account? | Priority |
|---|---|---|---|
| prefix.cc | ✅ **done** | no | — |
| DBpedia Archivo | ✅ yes | no | high (zero-effort quality feedback) |
| LOV | ✅ yes | no (form/issue) | high |
| BARTOC | ✅ yes | no | medium |
| BioPortal | ✅ yes | yes | medium |
| FAIRsharing | ✅ yes | yes | medium |
| OLS | ⚠️ if accepted | yes | low |
| OpenAIRE | ⛔ after gateway record | yes | deferred |
| Wikidata | ⛔ Phase 4 (after registries stable) | yes | deferred |

---

## 3. Per-registry records

### prefix.cc — DONE

Prefix `sstim` → `https://w3id.org/sstim#` is registered.

```text
Service:            prefix.cc
Submitted URL:      https://prefix.cc/sstim
Submitted version:  n/a (prefix→namespace mapping)
Date:               (registered prior to 2026-07-11)
Status:             LIVE
Required follow-up: none
```

### DBpedia Archivo — ready now

Submit the ontology URI at the Archivo "add" endpoint; Archivo dereferences it,
archives every version it can resolve, and returns an automated quality-star
rating. No account.

- **Entry point:** `https://archivo.dbpedia.org/add`
- **Provide:** ontology URI `https://w3id.org/sstim`
- **After:** record the Archivo IRI + star rating; address any actionable
  findings (compare against the 87.5% FOOPS result already on file).

```text
Service:            DBpedia Archivo
Submitted URL:
Submitted version:  0.6.0
Release DOI:        10.5281/zenodo.21302910
Date:
Account/maintainer: —
External record ID or URL:
Status:
Required follow-up:
```

### LOV (Linked Open Vocabularies) — ready now

LOV values complete metadata and stable dereferencing; SSTIM already carries
`vann:preferredNamespacePrefix`/`Uri`, title, description, creator, and license,
and the namespace resolves. Submit via the LOV suggestion form or a GitHub issue
on the LOV repository — **confirm the current mechanism** before submitting.

- **Provide:** vocabulary URI `https://w3id.org/sstim`, prefix `sstim`,
  the short description, license, and creator.
- **Note:** LOV catalogues vocabularies (OWL/RDFS/SKOS terms), not instance
  data — point it at the term namespace, not the BSC Lab instance graphs.

```text
Service:            LOV
Submitted URL:
Submitted version:  0.6.0
Release DOI:        10.5281/zenodo.21302910
Date:
Account/maintainer: —
External record ID or URL:
Status:
Required follow-up:
```

### BARTOC — ready now

Discovery for the SKOS terminology layer (frequency bands, modalities,
mechanisms, techniques, evidence/caution vocabularies). Submit via the BARTOC
suggestion form — **confirm the current mechanism**.

- **Provide:** title, `https://w3id.org/sstim` (and the vocab namespace
  `https://w3id.org/sstim/vocab#`), description, license, language coverage
  (en, it, pt, es), and the HTML documentation URL.

```text
Service:            BARTOC
Submitted URL:
Submitted version:  0.6.0
Date:
Account/maintainer: —
External record ID or URL:
Status:
Required follow-up:
```

### BioPortal — ready now (account required)

Biomedical browsing, APIs, and candidate-mapping discovery. Create/submit a new
ontology; provide the URL and set metadata. **Licensing note:** SSTIM is CC BY
4.0, which BioPortal supports; do not import any mapping target whose license
forbids redistribution.

- **Entry point:** `https://bioportal.bioontology.org/ontologies/new`
- **Provide:** acronym (proposed: `SSTIM`), name, `https://w3id.org/sstim`,
  a pull location for the Turtle
  (`https://labiosyncare.github.io/ontology/sstim-core.ttl`), CC BY 4.0,
  contact, description, homepage, documentation URL.
- **Decide before submitting:** whether to register the core module only or
  the whole merged set. Recommend core + vocab first.

```text
Service:            BioPortal
Submitted URL:
Submitted acronym:  SSTIM
Submitted version:  0.6.0
Date:
Account/maintainer:
External record ID or URL:
Status:
Required follow-up:
```

### FAIRsharing — ready now (account required)

FAIR standard/resource registration linked to the DOI. Register SSTIM as a
terminology-artifact standard.

- **Entry point:** `https://fairsharing.org/` → register a new record.
- **Provide:** name, description, `https://w3id.org/sstim`, concept DOI
  `10.5281/zenodo.21286974`, CC BY 4.0, creator ORCID, repository, subject
  area, and the documentation URL.

```text
Service:            FAIRsharing
Submitted URL:
Submitted version:  0.6.0
Concept DOI:        10.5281/zenodo.21286974
Date:
Account/maintainer:
External record ID or URL:
Status:
Required follow-up:
```

### OLS (Ontology Lookup Service) — only if accepted

OBO-adjacent browsing without changing SSTIM identifiers. OLS ingests via a
config entry (a PR to the EBI OLS config repository) — **confirm the current
repository and format**. Lower priority; pursue after Archivo/LOV land.

```text
Service:            OLS (EBI)
Submitted URL:
Submitted version:  0.6.0
Date:
Account/maintainer:
External record ID or URL:
Status:
Required follow-up:
```

### OpenAIRE — deferred

Submit only after an eligible gateway/aggregator record exists (per the plan).
Not actionable yet.

### Wikidata — deferred (Phase 4)

One ontology item first, then conservative term-level links, only after the
HTML landing page and registry metadata are stable. Governed by the External
Mapping Policy in the publication plan; not part of this round.

---

## 4. After each acceptance

1. Fill the record block above with the live URL, external ID, and date.
2. Flip the readiness table row to reflect the accepted state.
3. If a registry exposes a quality report (Archivo stars, OOPS), file
   actionable findings against `IMPROVEMENT_PLAN.md`.
4. Registry acceptances that add discoverability should raise the remaining
   registry-dependent FOOPS failures noted in the publication plan.
