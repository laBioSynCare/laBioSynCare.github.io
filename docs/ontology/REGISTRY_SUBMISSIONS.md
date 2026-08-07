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

The constant fields are copy-paste ready. **The four version-dependent fields
are deliberately not written down** — a registry record filled from a stale
number is worse than one not filled at all. Read them at submission time:

```bash
node scripts/truth-audit.mjs      # prints citable release, version DOI, module count
```

| Version-dependent field | Where to read it |
|---|---|
| Current version | `void.ttl` → `dcat:version` |
| Version IRI | `https://w3id.org/sstim/<that version>` |
| Version DOI | `void.ttl` → `dct:hasVersion` |
| Current release date | that release's `dct:issued` |

| Constant field | Value |
|---|---|
| Title | Sensory Stimulation Ontology (SSTIM) |
| Stable ontology URI | `https://w3id.org/sstim` |
| Namespace URI | `https://w3id.org/sstim#` |
| Preferred prefix | `sstim` |
| Concept DOI (all versions) | `10.5281/zenodo.21286974` |
| License | CC BY 4.0 — `https://creativecommons.org/licenses/by/4.0/` |
| Creator | Renato Fabbri — ORCID `0000-0002-9699-629X` |
| Publisher | `https://github.com/laBioSynCare` |
| First released | 2026-04-12 |
| Source repository | `https://github.com/laBioSynCare/laBioSynCare.github.io` |
| HTML documentation | `https://labiosyncare.github.io/ontology/docs/` |
| Frozen Turtle entry point | `https://w3id.org/sstim/<version>/sstim-core.ttl` |
| JSON-LD (content negotiated) | `https://w3id.org/sstim` with `Accept: application/ld+json` |
| RDF/XML (content negotiated) | `https://w3id.org/sstim` with `Accept: application/rdf+xml` |
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

The released ontology URI dereferences through w3id to Turtle/JSON-LD/RDF-XML,
and the WIDOCO HTML is live. Perma-id PRs #6337 (pre-modular, 2026-07-11) and
#6480 (modular, 2026-08-04) are both merged. Existing registry records for the
released line remain valid. **Never present a mutable `-dev` line as a release**:
its generated namespace catalogues, Kernel/module endpoints, profiles, manifest,
and schema must be deployed and the perma-id matrix verified first.

| Registry | Can submit now? | Account? | Priority |
|---|---|---|---|
| prefix.cc | ✅ **done** | no | — |
| DBpedia Archivo | ⚠️ validated, blocked by DBpedia Databus outage | no | retry later |
| LOV | 🕓 **submitted 2026-07-10, pending curator review** | no | — |
| BARTOC | 🕓 **submitted via issue #319, pending editor** | yes (GitHub) | — |
| BioPortal | ✅ **parsed & live** (ontologies/SSTIM — 67 classes, 334 concepts) | account ✓ (@rfabbri) | — |
| FAIRsharing | 🕓 **record 8494 under curator review** — curator edited it 2026-08-07 (DOI pending) | yes | — |
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

Submit the ontology URI; Archivo dereferences it, archives every version it can
resolve, and returns an automated quality-star rating. No account.

- **Entry point:** `https://archivo.tools.dbpedia.org/add`
  — the old `https://archivo.dbpedia.org/add` host is dead (404, bare nginx) as
  of 2026-07-11; Archivo moved to the `archivo.tools.dbpedia.org` host.
- **Provide:** ontology URI `https://w3id.org/sstim`
- **HTTP POST alternative:**
  `curl -X POST https://archivo.tools.dbpedia.org/add --data-urlencode "suggestUrl=https://w3id.org/sstim"`
- **Acceptance prerequisites — verified met on 2026-07-11:**
  (1) the URI content-negotiates to Turtle and RDF/XML ✅ (w3id → Pages;
  N-Triples remains an optional unsupported representation);
  (2) the `owl:Ontology` IRI in the returned document equals the submitted URL —
  SSTIM's ontology subject is `<https://w3id.org/sstim>`, matching exactly ✅.
- **After:** Archivo crawls every 8 h once accepted; record the Archivo IRI +
  star rating and file any actionable findings against `IMPROVEMENT_PLAN.md`
  (compare with the 87.5% FOOPS result already on file).

**Rejection diagnosis (2026-07-11) — was transient; retry.** A first submission
was rejected with "No RDF content accessible or parseable." Root-caused by
reading Archivo's source (`archivo/crawling/best_effort_crawling.py`,
`utils/parsing.py`): Archivo fetches the URI three times (rdf+xml, turtle,
n-triples) and parses each response with **rapper (Raptor)** keyed to the
**requested** format, not the response Content-Type; it accepts if any format
yields >0 triples. Before PR #6337, the then-live w3id rules ignored `Accept`
and always returned Turtle, so only the Turtle branch could parse. Reproducing
Archivo's exact pipeline
(`requests` fetch → `rapper -i <fmt>`) on 2026-07-11 gave: rdf+xml → 0, **turtle
→ 707**, n-triples → 0 — i.e. one parseable format, which is an **accept**. The
rejection therefore required the Turtle fetch itself to have transiently failed
(all three branches 0). **Action: resubmit**; no repo change is needed for
acceptance.

**Update 2026-07-11 — PR #6337 merged; content negotiation live.** Retried
after the merge: the `application/rdf+xml` branch is now **green** (707 triples;
Archivo receives real RDF/XML), Turtle is green (707), N-Triples stays orange
(no `.nt` serialization/route — non-critical). Archivo reported "RDF content is
accessible in 2 formats" and resolved the ontology ID — **full validation
success**. The submission still ends "rejected" only at the final **Deployment
to Databus** step, which fails server-side ("Could not deploy dataset to
databus. Reason: Not found") on DBpedia's degraded `.tools.` host. Nothing to
fix on our side; retry when Archivo infra is healthy. Full write-up, retry
recipe, and a draft DBpedia bug report:
[`reviews/2026-07-11-dbpedia-archivo-submission.md`](reviews/2026-07-11-dbpedia-archivo-submission.md).

**Submission mechanism (verified 2026-07-11).** The `archivo.tools.dbpedia.org`
form is CSRF-protected (Flask-WTF); a bare `curl --data-urlencode
"suggestUrl=…"` returns HTTP 500. A working submission must GET `/add` first to
capture the session cookie + `csrf_token`, then POST `csrf_token` + `suggestUrl`
+ `submit=Suggest` with that cookie. The plain-curl example printed on the page
still points at the dead `archivo.dbpedia.org` host and does not work.

**Attempt 2 result (2026-07-11): SSTIM passed all RDF checks; blocked by a
DBpedia-side failure.** The crawl reported "Robot allowance check: OK" and
**"RDF content is accessible in 2 formats"** (707 triples parsed) — so the
transient "No RDF content accessible or parseable" rejection is resolved and the
ontology is valid for Archivo. The submission still ended "rejected" at the final
step: **"Deployment to Databus — Failed… Could not deploy dataset to databus.
Reason: Not found."** That is a server-side failure of DBpedia's Databus backend
on the `.tools.` host (the canonical `archivo.dbpedia.org` is down), not an
ontology problem. Nothing to fix on our side — retry when DBpedia's Databus
deployment / canonical host is healthy again.

```text
Service:            DBpedia Archivo (archivo.tools.dbpedia.org)
Submitted URL:      https://w3id.org/sstim
Submitted version:  0.6.0
Release DOI submitted: 10.5281/zenodo.21302910
Date:               2026-07-11
Account/maintainer: — (anonymous suggestion)
External record ID or URL:
Status:             Passed RDF validation ("accessible in 2 formats", 707
                    triples). NOT indexed — DBpedia Databus deployment failed
                    server-side ("Not found"). Retry when Archivo infra healthy.
Required follow-up: Re-submit later; if it persists, report the Databus
                    deployment failure on the DBpedia forum / archivo GitHub.
```

### LOV (Linked Open Vocabularies) — ready now

**Submission mechanism (confirmed 2026-07-11).** Web form at
`https://lov.linkeddata.es/dataset/suggest` — no account. LOV's model is: you
submit the **namespace URI**, LOV dereferences it and **auto-extracts the
metadata from the vocabulary itself**, then a curator reviews it. So acceptance
depends on the vocabulary carrying LOV-recommended metadata, which SSTIM does.
Fallback if the form misbehaves: email the curators
(py.vandenbussche@gmail.com; ghislain.atemezing@gmail.com; mpoveda@fi.upm.es).
Note: LOV curation is manual and can be slow; the front-end is old but the
service and catalog are live.

- **Enter in the form:** namespace URI **`https://w3id.org/sstim#`** (LOV strips
  the `#` and dereferences `https://w3id.org/sstim` → 200 Turtle). Add submitter
  name/email if asked; everything else is auto-extracted.
- **Point it at the term namespace, not instance data** — LOV catalogues
  vocabularies (OWL/SKOS terms), not the BSC Lab instance graphs.

**Metadata readiness — verified present in `sstim-core.ttl` (2026-07-11):**
`a owl:Ontology, voaf:Vocabulary`; `vann:preferredNamespacePrefix "sstim"` +
`vann:preferredNamespaceUri`; `dct:title`, `dct:description`, `dct:creator`
(ORCID), `dct:publisher` (GitHub org), `dct:issued`, `dct:modified`,
`dct:license`/`cc:license` (CC BY 4.0), `owl:versionInfo "0.6.0"` +
`owl:versionIRI`; namespace dereferences to Turtle/RDF-XML/JSON-LD; WIDOCO HTML
docs live. This satisfies LOV's quality bar (URI stability, standard formats,
quality metadata, identifiable publisher, versioning policy).

- **Optional polish (not required):** the creator/publisher are bare
  ORCID/GitHub URIs with no inline `foaf:name`. LOV can resolve the ORCID, but
  inlining `foaf:Person`/`foaf:Organization` names would render the Agents
  section more cleanly. Skip unless a curator asks.

```text
Service:            LOV (Linked Open Vocabularies)
Submitted URL:      https://lov.linkeddata.es/dataset/suggest
Submitted namespace: https://w3id.org/sstim
Submitted version:  0.6.0
Release DOI submitted: 10.5281/zenodo.21302910
Date:               2026-07-10 (resubmitted 2026-07-11; both acknowledged)
Account/maintainer: — (form; confirmation emailed to renato.fabbri@gmail.com)
External record ID or URL:  (assigned on integration)
Status:             SUBMITTED — pending manual curator review. Not yet in the
                    catalog (vocab API returns 404 as of 2026-07-11). This is
                    the expected queued state; LOV curation is manual and slow.
Required follow-up: Wait for the curator email. Do NOT keep resubmitting — the
                    form just re-acknowledges and it doesn't speed the queue. If
                    no response in several weeks, email the curators
                    (py.vandenbussche@gmail.com; ghislain.atemezing@gmail.com;
                    mpoveda@fi.upm.es). On integration, record the LOV vocab URL.
```

### BARTOC — ready now (GitHub login required)

**Submission mechanism (confirmed 2026-07-11).** Web form at
`https://bartoc.org/edit` — **requires login**; BARTOC's login server supports
**GitHub** (which the maintainer has). Log in, then fill the "Add vocabulary"
form. BARTOC stores entries as JSKOS (`gbv/bartoc.org`); the fields below map
SSTIM to that model. Alternative: open an issue on
`https://github.com/gbv/bartoc.org` if the form blocks.

**Complete form guide (`bartoc.org/edit`, in field order).** SSTIM has no
dedicated "URI" field — the vocabulary's own URI goes in **Identifier**; BARTOC
assigns its own node URI on save.

*Basic information:*

| Field | Value |
|---|---|
| Title (English) | Sensory Stimulation Ontology (SSTIM) |
| Title (Italian) | Ontologia della Stimolazione Sensoriale (SSTIM) |
| Title (Portuguese) | Ontologia de Estimulação Sensorial (SSTIM) |
| Title (Spanish) | Ontología de Estimulación Sensorial (SSTIM) |
| Abbreviation | `sstim` |
| Identifier (row 1) | `https://w3id.org/sstim` ← the vocabulary URI; add this |
| Identifier (row 2) | `https://doi.org/10.5281/zenodo.21286974` |
| Abstract (English, required) | An OWL 2 ontology for describing parameter-specified delivery of structured sensory input — techniques, protocols, implementations, exposure conditions, observations, safety metadata, and evidence-qualified claims — with a multilingual SKOS vocabulary (frequency bands, modalities, mechanisms, techniques, evidence tiers) and SHACL validation shapes. |
| Languages | en, it, pt, es |
| Size | `56 classes, 124 properties, 295 concepts, 30 concept schemes (2026-07)` |

*Structure:*

| Field | Value |
|---|---|
| KOS Types | **Ontology** (primary) + **Terminology** (has a controlled SKOS vocabulary) |
| Subjects (DDC) | search **152.1** (Sensory perception); alt **612.8** (neurophysiology & sensory reception). Avoid a therapy/medicine class (no clinical claims) |
| Version of | *(leave empty)* |
| Based on | *(leave empty)* |

*Availability:*

| Field | Value |
|---|---|
| Created | `2026` |
| License | search "CC BY 4.0" → Creative Commons Attribution 4.0 International |
| URL | `https://labiosyncare.github.io/ontology/docs/` (WIDOCO docs landing) |
| Additional links | `https://github.com/laBioSynCare/laBioSynCare.github.io` ; `https://w3id.org/sstim` |
| Formats | search + add **SKOS**, **RDF/XML**, **Turtle**, **JSON-LD**, **OWL** (whatever BARTOC lists) |
| Access | **freely available** |
| Publisher — Name | BSC Lab (laBioSynCare) |
| Publisher — URI | `https://github.com/laBioSynCare` |
| Address | optional — City: Modena, Country: Italy (or leave blank) |
| Contact | `renato.fabbri@gmail.com` |
| Listed In | optionally add **prefix.cc**; skip LOV until it's integrated (still queued) |
| Vocabulary services (URL + API type) | *(leave empty — SSTIM's SPARQL is client-side Comunica, no hosted endpoint)* |

*Display + concept mapping:*

| Field | Value |
|---|---|
| hide notation | unchecked |
| numerical notation | unchecked |
| namespace / notation pattern / URI pattern / example notations | *(leave empty — SSTIM concepts are URI-identified, not notation-coded)* |

Then **Save** (metadata is published PDDL/public-domain and community-editable —
fine for public ontology metadata).

**Submitted 2026-07-11 via the whitelist fallback.** Saving returned
`403: A whitelist is in place, but authenticated user is not on the whitelist`
— expected for a first-time contributor. BARTOC's form auto-created GitHub issue
**[gbv/bartoc.org#319](https://github.com/gbv/bartoc.org/issues/319)** carrying
the full JSKOS record; that issue **is** the submission (a BARTOC editor adds it
or whitelists @ttm). BARTOC pre-assigned node `http://bartoc.org/en/node/21154`.
Record used DDC 152, KOS types ontology+terminology, all four title languages,
CC BY 4.0, formats SKOS/RDF/XML/JSON-LD/OWL. Two fixes noted on the issue: a
`ttps://` → `https://` typo in an additional link, and confirm the publisher
name ("BSC Lab (Æterni Anima)").

```text
Service:            BARTOC
Submitted URL:      https://bartoc.org/edit
Submitted URI:      https://w3id.org/sstim
Submitted version:  0.6.0
Concept DOI:        10.5281/zenodo.21286974
Date:               2026-07-11
Account/maintainer: @ttm (GitHub login; not on editor whitelist)
External record ID or URL:  https://github.com/gbv/bartoc.org/issues/319
                            (pre-assigned node http://bartoc.org/en/node/21154)
Status:             SUBMITTED via issue #319 — clarifying comment posted and the
                    ttps:// typo corrected (2026-07-11). Cleanly pending a BARTOC
                    editor to add the vocabulary or whitelist @ttm.
Required follow-up: Wait for editor action. On integration, record the live node
                    URL (reserved node 21154). Metadata is community-editable, so
                    any field can be corrected after it goes live.
```

### BioPortal — ready now (account created @rfabbri)

Biomedical browsing, APIs, and candidate-mapping discovery. **Account created
2026-07-12** (username `rfabbri`; API key in the gitignored
`docs/credentials/bioportal.md`, never committed).

**Ingest artifact — merged bundle.** BioPortal ingests one root file and does
**not** follow `dct:isPartOf`, so pointing it at `sstim-core` would miss the
295-concept SKOS vocabulary. A merged OWL file is generated in CI
(`make bioportal-bundle`; ADR-style: artifact only, never committed):
**core + vocab + alignments + exposure + patch-studio**, excluding SHACL shapes.
One clean ontology IRI `https://w3id.org/sstim`; 73 classes + 329 SKOS concepts;
HermiT-consistent. Served at
**`https://labiosyncare.github.io/ontology/sstim-full.owl`** (RDF/XML).

- **Entry point:** `https://bioportal.bioontology.org/ontologies/new` (log in).
- **Pull location (auto-updates):** `https://labiosyncare.github.io/ontology/sstim-full.owl`

**Form fields:**

| Field | Value |
|---|---|
| Acronym | `SSTIM` |
| Name | Sensory Stimulation Ontology |
| Location | **Load from URL** (NOT upload) → `https://labiosyncare.github.io/ontology/sstim-full.owl` — "loaded nightly", so Pages deploys flow in |
| Representation language | **OWL** (RDF/XML) |
| Status | production (or beta for pre-1.0) |
| Contact | Renato Fabbri — `renato.fabbri@gmail.com` |
| Homepage | `https://labiosyncare.github.io/ontology/docs/` |
| Documentation | `https://labiosyncare.github.io/ontology/docs/` |
| Publications / DOI | `10.5281/zenodo.21286974` |
| Licence | CC BY 4.0 (`https://creativecommons.org/licenses/by/4.0/`) |
| Description | *(short description from §1)* |
| Categories | **Vocabularies** (best fit — SKOS terminology) + **Health**; optional **Experimental Conditions** / **Biomedical Resources**. Avoid Neurologic Disease / Neurological Disorder (off non-clinical scope). "Phenotype" is a weak fit. |
| View of another ontology? | **No** (off — SSTIM is not a view/slice) |
| Groups | none required |
| Natural language | English |
| Vocabulary/hierarchy | SKOS + OWL (BioPortal auto-detects) |

- **Licensing note:** SSTIM is CC BY 4.0 (BioPortal supports it); do not import
  any mapping target whose licence forbids redistribution.
- **Visibility:** public.

```text
Service:            BioPortal
Submitted URL:      https://bioportal.bioontology.org/ontologies/new
Submitted acronym:  SSTIM
Pull location:      https://labiosyncare.github.io/ontology/sstim-full.owl (Load from URL, nightly)
Submitted version:  0.6.0
Date:               2026-07-12
Account/maintainer: @rfabbri (bioportal.bioontology.org)
External record ID or URL:  https://bioportal.bioontology.org/ontologies/SSTIM
Status:             PARSED OK 2026-07-12 — live at ontologies/SSTIM. Metrics:
                    67 classes, 334 individuals (= the SKOS concepts, dual-typed),
                    121 properties. Full class hierarchy + vocabulary ingested
                    (merged bundle worked; core-only would show ~0 individuals).
Required follow-up: Optional polish via the ontology Edit form — add documentation
                    URL + Zenodo DOI (as publication) if not auto-extracted.
                    Nightly re-pull means Pages deploys flow in automatically.
```

**Release dates — BioPortal reads `dct:issued`.** The submission list's
**Released** column is populated from the root ontology's `dct:issued`, not from
the upload date. Because `dct:issued` had never been bumped past the ontology's
first issue date, all eight submissions (0.6.0 → 0.11.0) reported
`Released 2026-04-12`. Corrected 2026-07-27 by patching each submission:

```bash
curl -X PATCH "https://data.bioontology.org/ontologies/SSTIM/submissions/<id>" \
  -H "Authorization: apikey token=$BIOPORTAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"released":"2026-07-24T00:00:00+00:00"}'      # HTTP 204 on success
```

| Submission | Version | Released |
|---|---|---|
| 8 | 0.11.0 | 2026-07-24 |
| 7 | 0.9.0 | 2026-07-22 |
| 6 | 0.8.0 | 2026-07-20 |
| 5, 4 | 0.7.0 | 2026-07-15 |
| 3, 2 | 0.7.0-dev | 2026-07-14, 2026-07-13 |
| 1 | 0.6.0 | 2026-07-11 |

Patched submissions keep their corrected date, but **each new nightly pull
creates a submission carrying whatever `dct:issued` the deployed file declares**
— so the durable fix is bumping `dct:issued` at release time, now enforced by
the `make snapshot` release gate (see
[`README.md`](README.md#release-gate-make-snapshot)).

Two further observations from the same historical submission list, neither
harmful: 0.10.0 has **no** submission (it and 0.11.0 both deployed on 2026-07-24
and the daily pull sampled once); and 0.7.0 and the dev line prior to it each
produced **two** submissions, because the pull creates one whenever the deployed
bytes change even if `owl:versionInfo` did not move.

### FAIRsharing — ready now (account required)

**Submission mechanism (confirmed by screenshots 2026-07-11).** Requires a
FAIRsharing account (email or ORCID). Flow:
1. `https://fairsharing.org/new/` is an **informational "What to add" landing** —
   the four cards (Databases / Standards / Policies / Collections) are
   descriptions, **not clickable**.
2. Click **"ADD NEW RECORD"** (in the "Get Started!" box at the bottom) → opens
   **`https://fairsharing.org/create`**, the actual record-creation form.
3. On `/create`, select record type **Standard** → **terminology artifact**, then
   fill the fields below.

**Gotchas:** (a) the SPA is auth-gated — visiting `/new/` **while logged out
renders a blank white page**; log in first. (b) FAIRsharing announced a **power
outage 13–14 July 2026** (likely offline those days) — submit before/after.
(c) If record creation is blocked, email `contact@fairsharing.org`.
FAIRsharing mints its own record DOI on curator approval; you keep the Zenodo DOI
as an identifier. Several fields are **controlled-vocabulary pickers** (subjects
= SRAO, domains = DRAO, licence, organisations, related records) — pick from the
autocomplete; the values below are the intended targets.

**Two-stage flow (confirmed by screenshots 2026-07-11).**

*Stage 1 — the `/create` skeleton form (fields shown, `*` = required):*

| Field | Value |
|---|---|
| Logo | *(skip, optional)* |
| Record Name * | Sensory Stimulation Ontology |
| Abbreviation | SSTIM |
| Homepage * | `https://labiosyncare.github.io/ontology/docs/` |
| Year of creation | 2026 |
| Countries | Italy |
| **Registry and type *** | **Standard → terminology artifact** |
| Status | Ready |
| Description * | An OWL 2 ontology with a multilingual SKOS vocabulary and SHACL shapes for parameter-specified delivery of structured sensory input — techniques, protocols, implementations, exposure conditions, observations, safety metadata, and evidence-qualified claims across auditory, visual, and tactile modalities. |

Then **CREATE RECORD** → opens the fuller edit view.

*Stage 2 — the edit view (record `8494`). The record is hidden and **not
reviewed until all REQUIRED curation is done** (per the creation email).*

**REQUIRED (must complete before curators look):**

| Field | Value |
|---|---|
| Contacts | Renato Fabbri — `renato.fabbri@gmail.com` |
| Object types | controlled picker — pick the closest to what SSTIM describes (e.g. **protocol**, **study/experimental process**); ≥1 required. If nothing fits, ask curators |
| Subjects (SRAO) | **psychology**, **neuroscience** (≥1 required) |
| Taxonomies | **Not applicable** (species irrelevant) |
| Data processes & conditions | Each entry: url, name, type, access_method. Rule: ≥1 with **type=read** and name containing **Browse/Download/Search**. Add three: (1) **Browse SSTIM** — `https://labiosyncare.github.io/`, read, access_method **User interface**, doc_url `…/ontology/docs/`; (2) **Download citable SSTIM `<version>` (Turtle)** — `https://w3id.org/sstim/<version>/sstim-core.ttl`, read, **Other machine-accessible method**; (3) **Download latest released SSTIM via w3id (content-negotiated RDF)** — `https://w3id.org/sstim`, read, **Other machine-accessible method**. After the modular release, keep the versioned download and treat top-level `sstim-core.ttl` as Kernel only. Do NOT pick SPARQL access_method — SSTIM's SPARQL is client-side, no hosted endpoint. |

**RECOMMENDED (add for a strong, approvable record):**

| Field | Value |
|---|---|
| Licences | CC BY 4.0 |
| Organisation links | **maintaining** org = BSC Lab (laBioSynCare), `https://github.com/laBioSynCare`. Funding org: none (independent project) — leave if none |
| Domains (DRAO) | **sensory perception** (+ auditory/visual perception if offered) |
| Support links | docs `…/ontology/docs/`; repo `…/laBioSynCare.github.io`; namespace `https://w3id.org/sstim` |
| Record associations | **Done 2026-07-12:** added **BFO, IAO, OBI** with relationship **extends**. **COB is not registered in FAIRsharing** (small/newer OBO layer) — skipped, no gap. |
| Citation / Publications | **Skip** — recommended-only, and only for a journal paper describing the resource (none exists). The DOI-import hangs on Zenodo DOIs (FAIRsharing import is CrossRef/PubMed; Zenodo is DataCite) — reload to clear the spinner. If a citation is wanted, use "CREATE NEW PUBLICATION" manually. Re-listed as missing by the automated completeness mail on 2026-08-07; decision unchanged until a paper exists. |
| Cross references / identifiers | Additional Information tab. Portal dropdown lists BioPortal/OLS/OBO Foundry/AgroPortal/re3data/SciCrunch/Other — for a Zenodo DOI use **portal = Other**. Real value: add **BioPortal**/**OLS**/**OBO Foundry** cross-refs once SSTIM is listed there. Optional. |
| Associated tools | **Skip** (optional). The interactive browser is an integrated site feature → belongs under **Data processes** as "Browse", not as a standalone tool — which is exactly the distinction the 2026-08-07 completeness mail draws when it re-lists this field. Decision unchanged. |

```text
Service:            FAIRsharing
Record:             https://fairsharing.org/8494 (Sensory Stimulation Ontology)
Record type:        Standard / terminology artifact
Name:               Sensory Stimulation Ontology
Submitted version:  0.6.0
Concept DOI:        10.5281/zenodo.21286974
Date:               2026-07-12 (skeleton record created)
Account/maintainer: @renato.fabbri (FAIRsharing account)
External record ID or URL:  https://fairsharing.org/8494 (hidden until approved)
Status:             UNDER CURATOR REVIEW (curator edit 2026-08-07). Completed
                    2026-07-12: taxonomies set to "Not Applicable" → record left
                    "incomplete" and read "awaiting review by FAIRsharing
                    curators". All required fields done; rich metadata (object
                    types, subjects, domains incl. sensory-perception terms, 3
                    data processes, CC BY 4.0, BSC Lab maintainer, IAO/BFO/OBI
                    extends, Zenodo cross-ref). Recommended-missing (funding org,
                    publications, citations) intentionally skipped — do not block
                    review/DOI. On 2026-08-07 FAIRsharing curator Lea.Girard
                    (10801) modified the record, so review has begun; the
                    notification asserted neither approval nor a DOI, and the
                    edits themselves are unread (see the two checks below).
Required follow-up: Wait for curator approval → FAIRsharing DOI issued (currently
                    "Awaiting DOI"). Record the DOI when it lands. Two things to
                    check at the next login — neither is scriptable, because
                    `/8494` serves an empty app shell while logged out and
                    api.fairsharing.org needs a JWT: (1) diff the curator's
                    2026-08-07 edits at `https://fairsharing.org/8494?history=show`
                    against the intended values above; (2) the record was
                    submitted at 0.6.0 and the current release is 0.13.0 —
                    confirm no data-process URL pins a stale version. Also note
                    the same-day automated completeness mail listed
                    "Organisation links" as not yet present, which contradicts
                    the BSC Lab maintaining-org entry recorded here; it is more
                    likely counting the deliberately absent funder/collaborator
                    roles, but verify the maintainer link actually saved.
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

### Wikidata — deferred (Phase 4) for *publishing*; contribution is open now

One ontology item first, then conservative term-level links, only after the
HTML landing page and registry metadata are stable. Governed by the External
Mapping Policy in the publication plan; not part of this round.

**This deferral covers publishing SSTIM *into* Wikidata — the ontology item,
term-level equivalences, identifiers, a property proposal. It does not cover
contributing *to* Wikidata**, which asserts nothing on SSTIM's behalf and is
unblocked today. Conflating the two left the second undone. The staged plan,
with the gate that applies at each step, is in
[`WIKIDATA_CONTRIBUTION.md`](WIKIDATA_CONTRIBUTION.md).

---

## 4. After each acceptance

1. Fill the record block above with the live URL, external ID, and date.
2. Flip the readiness table row to reflect the accepted state.
3. If a registry exposes a quality report (Archivo stars, OOPS), file
   actionable findings against `IMPROVEMENT_PLAN.md`.
4. Registry acceptances that add discoverability should raise the remaining
   registry-dependent FOOPS failures noted in the publication plan.
