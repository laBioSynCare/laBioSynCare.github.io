# SSTIM Registry Submissions

Status: active tracker

Owner: Renato Fabbri

Created: 2026-07-11

Last audited: 2026-09-01 (W3C Community Group migration pass)

This file operationalizes the **Registry Strategy** of
[PUBLICATION_AND_INTERLINKING_PLAN.md](PUBLICATION_AND_INTERLINKING_PLAN.md).
It holds (1) a reusable metadata kit every registry asks for, filled once, and
(2) a per-registry record: what it needs, whether it can go today, the
pre-filled values, and a status slot to complete after submitting.

> **Verify the intake mechanism at submission time.** Registry submission forms,
> endpoints, and account requirements change. The entry points below are the
> known ones; confirm each is current before submitting rather than trusting
> this file. Record a genuine submission as submitted, but never mark it
> accepted or live until the public record proves that state (the plan's rule
> against claiming a registration early).

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
| Publisher declared by the submitted 0.16.0 RDF | `https://github.com/laBioSynCare` — preserve until the publisher/steward governance question is resolved; a repository move is not authority to rewrite ontology provenance |
| First released | 2026-04-12 |
| Source repository | `https://github.com/w3c-cg/sstim` |
| Issue tracker | `https://github.com/w3c-cg/sstim/issues` |
| Project / browser | `https://w3c-cg.github.io/sstim/` |
| HTML documentation | `https://w3c-cg.github.io/sstim/ontology/docs/` |
| Frozen whole-set entry point | `https://w3id.org/sstim/<version>` (namespace catalogue) |
| Frozen Kernel Turtle | `https://w3id.org/sstim/<version>/sstim-core.ttl` |
| JSON-LD (content negotiated) | `https://w3id.org/sstim` with `Accept: application/ld+json` |
| RDF/XML (content negotiated) | `https://w3id.org/sstim` with `Accept: application/rdf+xml` |
| VoID/DCAT | `https://w3c-cg.github.io/sstim/ontology/void.ttl` |

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
and the WIDOCO HTML is live. Perma-id PRs #6337 (pre-modular, 2026-07-11),
#6480 (modular, 2026-08-04), and the W3C-CG target cutover
[#6609](https://github.com/perma-id/w3id.org/pull/6609) (merged 2026-08-27)
are complete. Existing registry identities remain valid because the canonical
ontology URI, namespace, prefix, concept DOI, and version IRIs did not change.
**Never present a mutable `-dev` line as a release**:
its generated namespace catalogues, Kernel/module endpoints, profiles, manifest,
and schema must be deployed and the perma-id matrix verified first.

### External-presence review — 2026-09-02

Four rows changed state without a submission. Three closed (OpenAIRE, OntoBee,
re3data/OpenDOAR) and one opened (Software Heritage), each recorded in section 3
below. The three closures matter as much as an acceptance: a deferred row with
no next step resurfaces in every audit and reads as outstanding work forever,
which is what "⛔ after gateway record" had been doing while OpenAIRE already
carried the record.

Raised by a review from the agent working the BioSynCare repository, read
against commit `c457ff1`. Its measurements were re-taken here before anything
was recorded; its one open question, whether OpenAIRE was already satisfied
through Zenodo harvesting, it could not answer because `zenodo.org` answers 403
to that host. It is answered above.

### W3C-CG registry migration pass — 2026-09-01

The mutable location fields were audited only after W3ID, W3C Pages, and the
frozen artifacts were live. The W3C and preserved legacy publications of the
0.16.0 whole-set Turtle and BioPortal RDF/XML bundle were measured byte-identical.
Stable record identities were preserved; no registry was resubmitted under a
new identity.

| Registry | Action | Outcome |
|---|---|---|
| W3ID | Retarget stable routes to the W3C-CG publication | **Live.** HTML and RDF negotiation now resolve under `w3c-cg.github.io/sstim`; canonical SSTIM IRIs are unchanged. |
| prefix.cc | Check whether repository migration changes the prefix record | **No change required.** It records `https://w3id.org/sstim#`, not a Pages host. |
| DBpedia Archivo | Check the indexed record and updater | **No resubmission.** The record is keyed only by `https://w3id.org/sstim`, so W3ID carries the host migration. Archivo exposes no mutable source-location field and its updater remains stale. |
| LOV | Check accepted record and intake state | **No record to edit.** SSTIM remains absent after the 2026-07-10 suggestion; the submitted namespace is still correct. A second suggestion would duplicate the untracked intake request rather than migrate a host field. |
| BARTOC | Request changes to mutable URL/repository fields and stale extent | **Applied by the curator 2026-09-02** and [issue #319](https://github.com/gbv/bartoc.org/issues/319) closed as completed. Every field verified in the JSKOS; node `21154`, the SSTIM identifier, DOI, and publisher preserved. `make registry-verify` now checks the record's namespace, repository link and extent rather than only that the page answers 200. |
| BioPortal | Patch the current ontology submission metadata | **Applied and verified through the authenticated API.** Submission `28` now pulls the W3C deterministic bundle and carries the W3C homepage, repository, source, documentation, and issue tracker. Await the two-night stability observation before correcting its successor's display date. |
| FAIRsharing | Audit record `8494` and prepare the mutable-link edit | **Signed-in edit still required.** The public record still exposes the legacy homepage. The browser runtime available to this audit could not start, and FAIRsharing's write API requires authentication; exact replacement values are recorded below. |
| OLS4 | Update the open submission rather than creating another | **Applied.** PR [#1351](https://github.com/EBISPOT/ols4/pull/1351) commit `258c2a51` now uses the W3C homepage and frozen 0.16.0 Turtle; the reviewer was notified. |
| DBpedia KG Catalog | Refresh the live record and automate later releases | **Merged and live.** PR [#53](https://github.com/dbpedia/kg-catalog/pull/53) merged by @m1ci on 2026-09-03; the catalog bot promoted the W3C-CG 0.16.0 distribution to `active` 23 seconds later, and the first daily updater run after the merge left `metadata.yaml` untouched. |

The read-only `make registry-verify` probe on 2026-09-01 reached all five public
surfaces it covers: prefix.cc mapping, BARTOC node, FAIRsharing record, Archivo
record, and LOV absence with a positive control. It reported **5 verified, 0
unreachable, 0 wrong**. This proves reachability/identity, not that the pending
BARTOC or FAIRsharing field edits have already landed.

> **Measured 2026-08-18** with `make registry-verify` and `gh`, not inherited.
> Three states, because two would lie: **verified**, **wrong**, and
> **INCOMPLETE** — an unreachable service is an unreachable instrument and never
> evidence of absence (CLAUDE.md §3.6).
>
> | Registry | Result that day |
> |---|---|
> | prefix.cc | **was wrong** — slash where the ontology has a hash; corrected the same day, see below |
> | BARTOC · FAIRsharing | verified 200; re-verified by content 2026-09-02 — BARTOC fully migrated, FAIRsharing's embedded JSON-LD still gives `labiosyncare.github.io/ontology/docs/` as the identifier and never names the W3C-CG host |
> | LOV | absent, confirmed against a `skos` control that answered 200 |
> | OLS4 #1351 · KG Catalog #46 | both still **open**, no maintainer response yet (both answered since: OLS4 on 2026-08-20, KG Catalog listed 2026-08-24) |
> | DBpedia Archivo | **verified 2026-09-02** — the info page needs an explicit `Accept: text/html` (it answers 406 without one). The record resolves; its download and Databus artifact do not, which is a finding about their infrastructure and is now recorded in the row below |
> | BioPortal | **verified 2026-09-02** — the web UI does answer 403 to a plain client (Cloudflare) and the REST API 401 unauthenticated, but the key in the gitignored `docs/credentials/bioportal.md` resolves both: submission `29` at 0.16.0 with the W3C-CG homepage, and 181 classes indexed and answering queries. Reach for that key rather than recording INCOMPLETE |

| Registry | Current state | Account? | Follow-up |
|---|---|---|---|
| prefix.cc | ✅ **corrected 2026-08-18** — now serves `sstim` → `https://w3id.org/sstim#` in all four serialisations (`txt`, `json`, `ttl`, `sparql`), verified by `make registry-verify`. It had served the slash form since before 2026-07-11; the hash entry was added and voted above it, and the slash form remains listed but outranked. Its TLS certificate expired 2025-12-31, so `https://` still fails certificate validation and plain `http://` is the only way to read it | yes | — |
| DBpedia Archivo | ⚠️ **listed, not retrievable — measured 2026-09-02** — the record is real: `https://archivo.dbpedia.org/list` carries "Sensory Stimulation Ontology (SSTIM)" among its 94,736 entries, keyed by the stable W3ID URI, so the W3C host migration requires no record change. But nothing behind the listing can be fetched. `/download?o=https%3A//w3id.org/sstim&f=owl` answers **500** ("There seems to be an error with the DBpedia Databus") and the Databus artifact the record itself links to, `https://databus.dbpedia.org/ontologies/w3id.org/sstim`, answers **404**. This is the same Databus deployment step that failed at submission time, still failing. The ★☆☆☆ rating recorded here on 2026-08-17 could not be re-measured: the info page renders no star markup a fetch can read | no | report the download/Databus failure upstream alongside the stale updater; do not duplicate the record |
| LOV | 🕓 **suggested 2026-07-10, still absent** — `/vocabs/sstim` is 404 while a control record resolves. LOV ingests the unchanged W3ID namespace and auto-extracts locations, so there is no host field to migrate and no accepted record to edit | no | follow up with curators; do not duplicate the suggestion |
| BARTOC | ✅ **migrated 2026-09-02** — the curator applied every requested change and closed [issue #319](https://github.com/gbv/bartoc.org/issues/319) as completed. JSKOS verified field by field at `https://bartoc.org/api/data?uri=http://bartoc.org/en/node/21154` (`modified` 2026-09-02T06:15:49Z): `url` → `https://w3c-cg.github.io/sstim/ontology/docs/`, `subjectOf` → `https://github.com/w3c-cg/sstim` (legacy repository gone; concept DOI and the frozen 0.16.0 namespace document retained), `extent` → "164 classes, 304 properties, 551 concepts, 68 concept schemes (SSTIM 0.16.0, 2026-08)", which matches `TERM_INDEX.md` and a `skos:ConceptScheme` count of the frozen document exactly. Preserved as asked: node URI, `identifier` `https://w3id.org/sstim`, `namespace` `https://w3id.org/sstim#`, and the publisher field | yes (GitHub) | — |
| BioPortal | ⚠️ **live; W3C metadata patched and deterministic bundle deployed 2026-09-01** — authenticated API verification shows submission `28` with W3C pull/home/repository/source/docs/issues and version IRI `https://w3id.org/sstim/0.16.0`. The W3C and legacy bundle URLs serve the ledger bytes (1,239,332 bytes; SHA-256 `7a2133692b6adcca6e411c79c91868954d37112545ea2c2c427e27fb6f73bb11`) | account ✓ (@rfabbri) | observe transition pull, then one unchanged pull; patch current date |
| FAIRsharing | ✅ **migrated, enriched and unblocked 2026-09-04.** Homepage, six support links and the cross-reference DOI are on W3C-CG/w3id, the DOI now naming the concept record `10.5281/zenodo.21286974` rather than the 0.6.0 version it had been pinned to since July; the description lists all nine modalities; `sleep` added to domains; seven relations (IAO, BFO, OBI, PROV-O as `extends`; SKOS, OWL, HED as `related_to`); and the three required `read` data processes were added in the edit form, `updated_at` 2026-09-04T09:46:36Z. Publications and citations stay empty until a paper exists. DOI [10.25504/FAIRsharing.660ff4](https://doi.org/10.25504/FAIRsharing.660ff4) is assigned and must be preserved | yes | await curator review; add hearing/vision domains if the controlled list has them |
| OLS4 | 🕓 **PR open, updated for W3C-CG and 0.16.0** — [EBISPOT/ols4#1351](https://github.com/EBISPOT/ols4/pull/1351), commit `258c2a51`; reviewer notified 2026-09-01 | yes (GitHub) | watch review/merge |
| OpenAIRE | ✅ **closed 2026-09-02 — no submission needed** — `api.openaire.eu/search/software?doi=10.5281/zenodo.22003777` returns `total=1`: Zenodo is an OpenAIRE-compliant repository and the record is already harvested and indexed as software. OpenAIRE Provide is an intake for repository and aggregator *operators*, which SSTIM is not | n/a | — |
| Software Heritage | ✅ **archived 2026-09-03** — both origins, save requests `2462747` and `2462748`, each `succeeded` with a `full` visit. Snapshot SWHIDs `swh:1:snp:4fc9710a…673115` (W3C-CG) and `swh:1:snp:39ba6c81…d45e0b` (legacy origin), both now on the Zenodo record. Superseded row text: 🕓 not submitted — `/api/1/origin/<url>/get/` answers `NotFoundExc` for both origins while a control repository comes back archived, so the absence is measured, not assumed. Save Code Now takes `POST /api/1/origin/save/git/url/<repository-url>/`, anonymously, and yields a snapshot SWHID for the source to sit beside the Zenodo DOI for the release | no | **archival is permanent and public**; secret sweep first, then submit both origins |
| OBO Foundry (membership) | ⛔ **declined, reaffirmed 2026-09-03 on measurement** — [ADR 0016](../decisions/0016-publication-obo-posture-and-registries.md) §2 and [ADR 0056](../decisions/0056-readable-iris-accepted-costs-and-the-obo-idspace-prerequisite.md). Membership costs the readable IRIs; the biomedical discovery it would buy is already delivered by BioPortal without it. Full reasoning and the reopening trigger in section 3 | n/a | reopen only on the named trigger |
| OntoBee | ✅ **closed 2026-09-02 — not applicable** — OntoBee serves the OBO Foundry library, and [ADR 0016](../decisions/0016-publication-obo-posture-and-registries.md) §2 rejects OBO Foundry membership on identifier grounds. A non-member ontology has no intake here | n/a | revisit only if a future ADR reopens OBO membership |
| re3data · OpenDOAR | ✅ **closed 2026-09-02 — not applicable, superseded by FAIRsharing** — re3data indexes research *data repositories* and OpenDOAR open-access *repositories*. SSTIM is a vocabulary, and ADR 0016 §7 names them as alternatives to FAIRsharing, whose record `8494` is live and DOI-assigned | n/a | — |
| DBpedia KG Catalog | ✅ **0.16.0 live and self-updating since 2026-09-03** — [catalog record](https://kg-catalog.dbpedia.org/kg.html?id=sstim), [Databus group](https://databus.dbpedia.org/knowledge-graph-catalog/sstim), merged PR [dbpedia/kg-catalog#53](https://github.com/dbpedia/kg-catalog/pull/53). Historical 0.15.0 bytes preserved; the Databus version `2026.08.18` carries the W3C-CG file at the exact 788555 bytes and `522abc80…037b1` hash from the PR | yes (GitHub) | none; the daily updater owns future releases |
| Wikidata | ⛔ Phase 4 (after registries stable) | yes | deferred |

---

**The other direction has its own file.** This one records SSTIM's submissions to
registries. [INBOUND_REFERENCES.md](INBOUND_REFERENCES.md) records what outside
SSTIM references an SSTIM IRI, which surfaces are writable with a credential we
hold, and which need a request. The registries below are the largest group of
inbound references that already exist, so the two files are read together.

## 3. Per-registry records

### prefix.cc — was wrong, corrected 2026-08-18

**Fixed.** All four serialisations now serve the hash form:

```text
$ curl http://prefix.cc/sstim.file.sparql
PREFIX sstim: <https://w3id.org/sstim#>
```

The correct URI was added as an alternative and voted above the old one; prefix.cc
serves the top-ranked URI, and the slash form remains listed but outranked. Confirmed
by `make registry-verify`, which reads the mapping and compares it against the
namespace parsed out of `sstim-core.ttl`.

**What was wrong, kept because it is the reason the gate exists.** Measured 2026-08-18 over plain
HTTP, before the correction, in all four serialisations prefix.cc offers:

```text
$ curl http://prefix.cc/sstim.file.txt
sstim	https://w3id.org/sstim/
```

SSTIM's namespace is `https://w3id.org/sstim#`. The registration has a **slash
where the ontology has a hash**, and this file asserted the hash form and marked
the entry DONE.

**Why it matters more than a typo.** Resolving a prefix is the entire purpose of
prefix.cc, and SPARQL editors, reconciliation tools and RDF libraries do it
automatically. A consumer who takes the registered mapping builds
`sstim:Preset` as `https://w3id.org/sstim/Preset`, which returns **404** —
verified — as does every other term. Nothing they write about SSTIM uses an IRI
that exists.

**Why nobody caught it.** No instrument ever fetched it. prefix.cc's TLS
certificate expired **2025-12-31** (`CN=prefix.cc`, Starfield G2), so an ordinary
`https://` check fails on the certificate before it can return an answer, and the
failure looks like a network problem rather than a wrong record. `make
registry-verify` now reads it over `http://` — it is a public prefix mapping with
no secret in it — and compares against the namespace parsed out of
`sstim-core.ttl`, so it cannot drift from the ontology the way this prose did.

**How it was fixed, 2026-08-18:** "Add alternative URI" on <http://prefix.cc/sstim>
with `https://w3id.org/sstim#`, then voted so it outranks the slash form.
prefix.cc serves the top-ranked URI, so both may coexist as long as the hash form
wins — `make registry-verify` is what says whether it still does.

*Historical record of what was believed, kept because the rest of this entry
was written against it:*

```text
Service:            prefix.cc
Submitted URL:      https://prefix.cc/sstim
Submitted version:  n/a (prefix→namespace mapping)
Date:               (registered prior to 2026-07-11)
Status:             LIVE
Required follow-up: none
```

### DBpedia Archivo — INDEXED (2026-08-17)

Submit the ontology URI; Archivo dereferences it, archives every version it can
resolve, and returns an automated quality-star rating. No account.

**W3C-CG migration disposition (2026-09-01): no registry mutation.** Archivo's
record identity and crawl source are the single stable URI
`https://w3id.org/sstim`; it has no separate mutable repository or Pages-host
field. W3ID now resolves that URI to the W3C publication. Resubmitting would
create pressure for a duplicate/stale crawl while Archivo's updater and Databus
remain impaired, so preserve the existing record and report only the upstream
updater defects below.

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
- **After:** record the Archivo IRI and star rating, and file any actionable
  findings against `IMPROVEMENT_PLAN.md` (compare with the 87.5% FOOPS result
  already on file). **Do not expect an automatic re-crawl.** This bullet used to
  promise one "every 8 h"; that figure has no source and the updater has not run
  since 2026-02-23 — see the status block below.

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

**Attempt 3 (2026-08-17) — ACCEPTED AND INDEXED.** The canonical host recovered:
`archivo.dbpedia.org` answers 200 (it was dead nginx on 2026-07-11), as does
`databus.dbpedia.org`. Submitted there rather than to `.tools.` — **the two hosts
are separate indexes**, which this file did not record: canonical carries 1462
`w3id.org` entries against `.tools.`'s 1245, and their listings differ by ~300 KB.
Neither held SSTIM beforehand, so July's attempts left nothing behind.

**Do not submit to `archivo.tools.dbpedia.org`. Its crawler is dead.** Measured
2026-08-17: across 3798 crawl timestamps in its listing the newest is
**2025-02-03**, eighteen months stale, while canonical's newest is the same day
it was read. Canonical indexes 2010 ontologies to `.tools.`'s 1899, and the two
have genuinely diverged rather than one mirroring the other — 13 ontologies
appear only in `.tools.`, 124 only in canonical. It is an abandoned parallel
deployment that took traffic while canonical was down in July, not a mirror.

    python3 - <<'EOF'
    import re, urllib.request
    for n, u in [("canonical","https://archivo.dbpedia.org/list"),
                 ("tools","https://archivo.tools.dbpedia.org/list")]:
        h = urllib.request.urlopen(u).read().decode("utf8", "replace")
        print(n, "newest crawl:", max(re.findall(r"\b20\d\d\.\d\d\.\d\d-\d{6}\b", h)))
    EOF

SSTIM's absence from `.tools.` is the recorded July failure, not an oversight to
correct: that attempt passed the RDF checks there and died at Databus
deployment, so it never entered the index. Adding it now would be worse than
leaving it — nothing would ever recrawl the entry, so whatever rating it landed
on would stand permanently, and with the Databus still 503ing that could be
★☆☆☆ forever in a public index nobody maintains.

Preconditions re-verified first, because the ontology is no longer what it was
when they were last checked in July (707 triples, a single `owl:Ontology`
subject): now **10,436 triples and 16 subjects** (the ADR 0043 modules — the profile
closure serves them all). `<https://w3id.org/sstim>` is still declared
`a owl:Ontology`, which is the condition Archivo tests, and both `text/turtle`
(728 KB) and `application/rdf+xml` (1.1 MB) parse. `application/n-triples` still
406s, and still does not matter — Archivo generated the `nt` artifact itself.

**Client timeout is not failure.** A 300 s POST returned zero bytes; a second
attempt was still hanging when the record appeared in the index. Archivo crawls
synchronously and the payload is now 15× its July size. Confirm by polling
`/list` for the ontology, never by the POST's exit status.

```text
Service:            DBpedia Archivo (archivo.dbpedia.org — canonical host)
Submitted URL:      https://w3id.org/sstim
Submitted version:  0.16.0-dev line (10441 triples as counted by Archivo)
Concept DOI:        10.5281/zenodo.21286974
Date:               2026-08-17 (attempts 1 and 2: 2026-07-11)
Account/maintainer: — (anonymous suggestion; source recorded "user-suggestion")
External record ID or URL:  https://archivo.dbpedia.org/info?o=https://w3id.org/sstim
                            https://databus.dbpedia.org/ontologies/w3id.org/sstim
Status:             INDEXED 2026-08-17 (snapshot 2026.08.17-195305). Archived in
                    owl, ttl and nt. Parsing ✔, Crawling Status ✔. Rated
                    ★☆☆☆ (1/4): Min. License ✘, Good License ✘, Consistency ✘,
                    LODE Conformity ✘.
Required follow-up: **Two of the three lost stars are ours to fix, and the cause
                    is confirmed — not a Databus artifact.** Archivo's tests are
                    SHACL shapes in its own repo, and they were run locally
                    against the served document (`shacl-library/license-I.ttl`,
                    `license-II.ttl`, `LODE.ttl` from `dbpedia/archivo`):

                      nix develop -c pyshacl -s license-I.ttl -df turtle \
                        -f human <(curl -sL -H 'Accept: text/turtle' \
                        https://w3id.org/sstim)

                    **Min. License ✘ and Good License ✘ — 67 violations each,
                    every one a `skos:ConceptScheme`, none an ontology.** Both
                    shapes declare `sh:targetClass owl:Ontology,
                    skos:ConceptScheme`, so every scheme must carry a license of
                    its own. All 16 ontologies have `dct:license`; all 67 schemes
                    have none. Fix: give each scheme
                    `dct:license <https://creativecommons.org/licenses/by/4.0/>`
                    — an IRI, since license-IIb also requires `sh:nodeKind
                    sh:IRI`. That is worth exactly two stars, and it is defensible
                    beyond the rating: a scheme extracted on its own currently
                    travels with no licence at all.

                    **Consistency ✘ — measured, and NOT ours.** Do not spend
                    ontology work on this star.

                    Archivo runs Pellet, not HermiT. Reproduced with Openllet
                    2.6.5, the maintained Pellet fork, using Archivo's exact
                    invocation — resolve `com.github.galigator.openllet:
                    openllet-cli:2.6.5` with maven, then:

                      java -cp "$(cat cp.txt)" openllet.Openllet consistency \
                        -v --loader Jena https://w3id.org/sstim

                    Answer: **Consistent: Yes**, expressivity ALCHIF(D),
                    consistency check 134–167 ms. It says Yes on the current
                    graph *and* on the pre-2026-08-17 OWL Full graph fetched
                    live. So being outside OWL 2 DL was never the cause, and the
                    profile fix — worth doing on its own merits — will not move
                    this star. An earlier note here, and the commit message of
                    ee68977, claimed otherwise; this is the measurement that
                    corrects them.

                    The actual cause is in Archivo, and it is visible in its
                    source. `archivo/crawling/discovery.py` line ~191 hands
                    Pellet **Archivo's own stored artifact URL**, not the
                    ontology IRI:

                      url = content_access.get_location_url(file_metadata)
                      consistency, output = self.test_suite.get_consistency(
                          ontology_url=url, ignore_imports=False)

                    That storage is the Databus, which is degraded — Archivo's
                    own download endpoint answers `500 … There seems to be an
                    error with the DBpedia Databus … HTTP Error 503`. Pellet
                    cannot fetch what it is pointed at, `get_consistency`
                    returns "Error - Exit N" rather than "Yes", and the star is
                    lost to infrastructure. This also explains why the licence
                    findings were genuine while this one is not: the SHACL
                    checks run against the parsed in-memory graph and never
                    touch the Databus.

                    Note an upstream bug while reading that code. The loop is
                    `for ignore_imports in [True, False]` but the call hardcodes
                    `ignore_imports=False`, so the ignore-imports variant never
                    ignores imports. `check_if_consistent` passes if either run
                    says Yes, so the intended safety net is one check executed
                    twice. Worth reporting to dbpedia/archivo; it does not
                    change our situation, since our single check already passes.

                    **There will be no recrawl, so expect nothing to change.**
                    See the entry below: Archivo's updater has not run since
                    2026-02-23. The ★☆☆☆ is frozen against the graph as it was at
                    submission, before the licences were deployed.

                    **LODE Conformity ✘ — 192 results, but only 3 of the shapes
                    carry `sh:Violation` severity** (the other 12 are Warning or
                    Info, "will not be displayed"). The three that count, each
                    failing on all 16 ontologies:
                      - `rdfs:label` missing or not a Literal
                      - `rdfs:comment` missing or not a Literal
                      - `dc:title` missing — **Dublin Core elements 1.1**
                        (`http://purl.org/dc/elements/1.1/title`), of which the
                        graph contains zero triples. SSTIM uses `dcterms:`
                        throughout; LODE reads the older `dc:`.
                    Also flagged at warning severity: `owl:versionIRI` absent on
                    all 16. Note this file's earlier claim that the root carries
                    `owl:versionIRI` was wrong for the mutable line.

                    **Archivo's automated updater is not running, so none of
                    this will lift the rating on its own.** Measured 2026-08-18,
                    12.4 h after our crawl and with no re-crawl: across all 4020
                    crawl timestamps in the public listing, the newest day is
                    2026-08-17 and it carries exactly two — both of them SSTIM's
                    own two columns, written by the synchronous crawl our `/add`
                    triggered. Before that, nothing since **2026-02-23**. Nearly
                    six months.

                      curl -sL https://archivo.dbpedia.org/list |
                        grep -oE '\b20[0-9]{2}\.[0-9]{2}\.[0-9]{2}-[0-9]{6}\b' |
                        cut -d- -f1 | sort | uniq -c | tail -6

                    **The "every 8 h" figure is documented, and this file was
                    wrong to call it sourceless on 2026-08-18.** It is on
                    <https://archivo.dbpedia.org/rating>: "All these ontologies
                    get updated regularily three times a day (currently 02:00 am,
                    10:00 am and 06:00 pm)." I checked /about, the README and the
                    source, missed /rating, and concluded absence from three
                    negative searches — the exact error 3.6 exists to prevent,
                    committed while writing about 3.6.

                    This makes the finding **stronger**, not weaker. Archivo does
                    not merely fail to meet an assumed cadence; it publishes a
                    three-times-daily schedule and has missed it by roughly six
                    months while continuing to display timestamps that look
                    current. A documented SLA silently unmet is a better bug
                    report than a disappointed expectation.

                    There is no user-facing way to force one: `/add`
                    short-circuits on an already-listed URI with "The Ontology is
                    already part of Archivo!", and `routes.py` exposes no
                    re-crawl endpoint. Do **not** work around this by submitting
                    a variant IRI — that mints a duplicate entry for one
                    ontology in a public index.

                    **Upstream state, checked 2026-08-18 before writing
                    anything.** This is a known, long-running infrastructure
                    problem, so calibrate expectations rather than expecting a
                    fix. `dbpedia/archivo` issue **#55**, "Frontend/ web service
                    down", has been open since 2025-05-07 and was last touched
                    2026-06-22. On 2025-09-12 the maintainer JJ-Author replied:

                      > I think we need to change the hosting provider. The proxy
                      > and the server are hosted by 2 different departments of
                      > our university, and it is an up and down

                    The exact error we see — "There seems to be an error with the
                    DBpedia Databus" — was reported on that issue in September
                    2025 and is still happening eleven months later.

                    **Removal and resubmission is not an option, so do not plan
                    around it.** Archivo exposes fifteen routes and none deletes;
                    only someone with database access could remove the entry, and
                    a fresh `/add` would meet the same Databus failure anyway.

                    Three distinct things could be reported, and two are new —
                    a search of the tracker finds no issue mentioning "updater"
                    or "stale":

                    1. **The updater has not run since 2026-02-23.** Measurable
                       from Archivo's own public listing with the command above.
                       Nobody has said this.
                    2. **The code bug in `discovery.py`**: the loop is
                       `for ignore_imports in [True, False]` while the call
                       hardcodes `ignore_imports=False`, so the ignore-imports
                       variant never ignores imports and
                       `check_if_consistent`'s either-passes fallback is one
                       check executed twice. Small and PR-able. Not reported.
                    3. The download 500, which is a "me too" on #55 — though
                       with one sharper detail than that thread has:
                       `databus.dbpedia.org` itself answers **200** while
                       Archivo's download path returns 500 citing a Databus 503,
                       so it is a specific API path rather than the whole
                       Databus being down.

                    **Reported upstream 2026-08-18**, as @ttm:

                    - [dbpedia/archivo#58](https://github.com/dbpedia/archivo/issues/58)
                      — the updater has not crawled since 2026-02-23, with the
                      one-line reproduction against their own listing.
                    - [dbpedia/archivo#59](https://github.com/dbpedia/archivo/issues/59)
                      — the `ignore_imports` bug, offering a PR.
                    - A comment on
                      [#55](https://github.com/dbpedia/archivo/issues/55#issuecomment-5325726361)
                      recording that `list` and `databus.dbpedia.org` both answer
                      200 while the download path returns 500, so it looks like
                      one API path rather than the whole service.

                    **Upstream response, 2026-08-20 to 2026-08-23.** A
                    maintainer (@Vehnem) answered on #59, and the answer bears
                    on all three reports above. He revived the official
                    `archivo.dbpedia.org` deployment "about two weeks ago" but
                    the Databus backend is still broken; the server had been
                    running with a full disk for some time and he is still
                    cleaning up and restoring. The deployed Archivo is also, in
                    his words, quite old. His estimate for the official
                    deployment is "the next days or weeks", and the project is
                    short of manpower. So the frozen rating stands, but for a
                    reason that is now upstream-confirmed and time-bounded
                    rather than inferred from a silent listing. **Re-measure the
                    updater date and the download 500 once he reports the
                    Databus fixed**; do not assume this document's numbers still
                    hold after that.

                    **Re-measured 2026-08-24, and the revival did not restart the
                    updater.** `archivo.dbpedia.org/list` answers and serves 2010
                    ontologies, but exactly one of them has any activity later
                    than 2026-02-23, and it is our own row, which the listing
                    flags `user-suggestion` (`2026.08.17-195305`). The gap
                    between 2026-02-23 and that date is empty. Consistent with
                    @Vehnem's own diagnosis rather than a new fault: a revived
                    frontend over a broken Databus backend looks exactly like
                    this. Note the trap, since the naive reading is the wrong
                    one: the newest stamp on the listing is 2026-08-17, which
                    looks like a resumed crawl, but it is our manual submission
                    and a row carries two date columns, so a stamp count reports
                    it twice.

                    **A second regression the revival introduced, found by
                    `make registry-verify` on 2026-08-24.** The record page
                    `archivo.dbpedia.org/info?o=https://w3id.org/sstim` now
                    negotiates like this:

                      Accept: text/html    ->  200
                      Accept: text/turtle  ->  307
                      Accept: */*          ->  406
                      (no Accept header)   ->  406

                    Under RFC 9110 both `*/*` and an absent Accept header mean
                    any media type is acceptable, so 406 is wrong for both, and
                    it breaks every plain client: `curl` with no header, most
                    scripts, and this repository's own registry gate, which is
                    how it surfaced. The gate now sends `Accept: text/html`,
                    which is what the check means anyway, with the reason
                    recorded at the call site. Remove that header once upstream
                    stops 406-ing `*/*`. Not yet reported to dbpedia/archivo.

                    #59 also drew a first-time contributor, @Vansh1419, who
                    opened
                    [dbpedia/archivo#60](https://github.com/dbpedia/archivo/pull/60)
                    with exactly the one-line fix the issue proposed. Reviewed
                    2026-08-23 and it is correct and complete for
                    `__run_consistency_checks`.

                    **A second instance of the same bug, found in that review
                    and not covered by #60.** `__run_pellet_info`, further down
                    the same file, has the identical hardcode: it loops
                    `for ignore_imports in [True, False]`, uses the loop variable
                    for the `imports_cv` content variant, and then calls
                    `get_pellet_info(ontology_url=url, ignore_imports=False)`.
                    `get_pellet_info` appends `--ignore-imports` exactly as
                    `get_consistency` does, so both iterations run Pellet with
                    imports. This one cannot produce a false inconsistency,
                    because `check_if_consistent` never reads `pelletInfo`, but
                    it publishes a Databus artifact labelled `imports=NONE` whose
                    content is the `FULL` run, and it spends a second Pellet run
                    on identical input. Raised on #60 on 2026-08-23, leaving the
                    choice of folding it in or taking it separately to the
                    contributor and the maintainer.

                    Plan on the rating staying frozen regardless. Do not hold a
                    release for it, and do not cite the Archivo stars anywhere
                    until they reflect a crawl of the current graph.
```

### LOV (Linked Open Vocabularies) — SUGGESTED; NO HOST MIGRATION

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
External record ID or URL:  none — the suggest form issues no ticket or record id
Status:             SUBMITTED (attested by acknowledgement mail), CURRENTLY
                    ABSENT FROM THE PUBLIC CATALOG. Two separate facts were
                    previously collapsed into "slow":

                    (1) **We cannot prove the submission from outside.** LOV's
                    suggest form returns no tracking identifier, opens no public
                    issue, and exposes no submitter-visible queue. The only
                    artifact anywhere is the acknowledgement email of 2026-07-10
                    and 2026-07-11 in renato.fabbri@gmail.com. That mail *is* the
                    evidence; nothing in this repository or on LOV corroborates
                    it. Treat "we submitted to LOV" as attested by mail only.

                    (2) **LOV is slow, NOT dormant — corrected 2026-08-18.**
                    An earlier version of this entry said LOV had ingested
                    nothing since 2025-11-22 and advised treating it as dead.
                    That was wrong, and wrong in an instructive way.

                    LOV's own homepage carries a "Latest insertion" list showing
                    **gist on 2026-07-05, rml-lv on 2026-06-12 and oso on
                    2026-05-07**. It was still curating. Our submission of
                    2026-07-10 arrived five days after the most recent insertion,
                    but no public queue makes its position or review state
                    knowable. Curator follow-up is reasonable rather than futile.

                    **What the earlier measurement actually measured.** The
                    SPARQL endpoint at `/dataset/lov/sparql` serves a stale dump.
                    Queried for the prefixes of the three vocabularies inserted
                    in 2026 — `rml-lv`, `gist`, `oso` — it returns **0** for each.
                    So its "1782 distributions, newest 2025-11-22" describes when
                    that dump was frozen, not when LOV last worked.

                    The methodological point is worth more than the fact. That
                    measurement *had* a control: a SKOS query returned rows, so
                    the endpoint demonstrably saw its own contents. But a stale
                    dump answers control queries perfectly. **A control proves an
                    instrument is connected, not that it is current** — and to
                    test currency the control must be something recent, which is
                    exactly what querying for a 2026 insertion does.

                    (3) **SSTIM is genuinely absent from LOV**, but the earlier
                    proof was unsound and had to be redone. The stale endpoint
                    predates our submission entirely, so it could not have
                    answered the question either way. Re-verified against the
                    live site with a working control:
                    `/dataset/lov/vocabs/sstim` → **404**, while
                    `/dataset/lov/vocabs/skos` → **200**. Right answer, wrong
                    reasoning, which is luck rather than method:

                      curl -sL -G https://lov.linkeddata.es/dataset/lov/sparql \
                        --data-urlencode 'query=PREFIX dcat:<http://www.w3.org/ns/dcat#>
                          PREFIX dct:<http://purl.org/dc/terms/>
                          SELECT (COUNT(*) AS ?n) WHERE {
                            ?v dcat:distribution ?d . ?d dct:issued ?iss
                            FILTER(STR(?iss) > "2025-11-22") }' \
                        -H 'Accept: application/sparql-results+json'

                    2026-08-17: 1782 snapshots in that endpoint's stale dump,
                    **0** after 2025-11-22. Our submission arrived 7.5 months
                    into the dump's gap; the public intake exposes no queue, so
                    SSTIM's absence says nothing about its quality or position.

                    Catalog absence separately confirmed the same day: 944
                    vocabularies indexed, zero sstim hits, with a SKOS control
                    query returning rows so the endpoint demonstrably sees its
                    own contents. Note the `api/v2/vocabulary/*` endpoints this
                    file used to cite now 404 for *every* query — they are gone,
                    not empty, so a 404 there is no longer evidence of anything.
Required follow-up: **Do not silently wait, and do not resubmit** — the form
                    only re-acknowledges and exposes no queue/ticket with which
                    a duplicate can be reconciled. A curator email is the only
                    remaining path and may
                    go unanswered; send it to `mpoveda@fi.upm.es` first, the
                    institutional address at the group that hosts LOV. The other
                    two contacts on file (py.vandenbussche@gmail.com,
                    ghislain.atemezing@gmail.com) are personal addresses of
                    long-standing project figures and may no longer be current.

                    **Do not present LOV as "pending review" in funding or
                    outreach prose.** The supported wording is: submission
                    acknowledged but untracked; SSTIM absent; LOV has shown
                    recent curation activity; queue position and review status
                    unknown. On integration, record the LOV vocab URL.
```

### BARTOC — LIVE; W3C-CG update requested 2026-09-01

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
| Size | `164 classes, 304 properties, 551 concepts, 68 concept schemes (SSTIM 0.17.0, 2026-09)` |

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
| URL | `https://w3c-cg.github.io/sstim/ontology/docs/` (WIDOCO docs landing) |
| Additional links | `https://github.com/w3c-cg/sstim` ; `https://w3id.org/sstim` |
| Formats | search + add **SKOS**, **RDF/XML**, **Turtle**, **JSON-LD**, **OWL** (whatever BARTOC lists) |
| Access | **freely available** |
| Publisher — Name | BSC Lab (Æterni Anima) — exact live value; preserve pending the separate governance decision |
| Publisher — URI | `https://github.com/laBioSynCare` |
| Address | optional — City: Modena, Country: Italy (or leave blank) |
| Contact | `renato.fabbri@gmail.com` |
| Listed In | optionally add **prefix.cc**; skip LOV until it is integrated (suggestion acknowledged but untracked) |
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
External record ID or URL:  https://bartoc.org/en/node/21154 (LIVE)
                            submission trail: https://github.com/gbv/bartoc.org/issues/319
Status:             LIVE since 2026-07-27T16:14:06Z (modified 16:16:58Z), created
                    by BARTOC editor Jakob Voß — the editor acted on the issue
                    rather than whitelisting @ttm, so the record is curator-made,
                    not self-served. Verified public 2026-08-17 by three
                    instruments: anonymous `GET /en/node/21154` → 200; the JSKOS
                    API `GET /api/data?uri=...` returns the full record; and it is
                    the top hit for `sstim` in public vocabulary search.

                    **Do not read issue #319's open state as pending submission.**
                    That issue is titled "Error 403 when saving" — it tracks the
                    whitelist *bug*, not this vocabulary. It stayed open behind a
                    record that had already gone live, and this file asserted
                    "pending editor" for three weeks because the two were
                    conflated. Instrument for the real question is the node URL,
                    never the issue.
Required follow-up: **Refresh the stale `extent`.** The live record reads
                    "56 classes, 124 properties, 295 concepts, 30 concept schemes
                    (2026-07)"; TERM_INDEX.md is at 164 / 304 / 551 with 68 schemes
                    as of 0.16.0, so the public record understates SSTIM roughly
                    threefold and its scheme count by more than twice. Metadata is
                    community-editable (PDDL). On 2026-09-01 the exact extent,
                    W3C documentation URL, and W3C repository replacement were
                    requested from the curator in issue #319 comment
                    5497720588. Verify the JSKOS record after it is applied.
                    The request deliberately preserves the node URI, stable
                    SSTIM identifier, concept DOI, and publisher field.
```

### BioPortal — LIVE; W3C-CG fields updated 2026-09-01

Biomedical browsing, APIs, and candidate-mapping discovery. **Account created
2026-07-12** (username `rfabbri`; API key in the gitignored
`docs/credentials/bioportal.md`, never committed).

**Ingest artifact — merged bundle.** BioPortal ingests one root file and does
**not** follow `dct:isPartOf`, so pointing it at `sstim-core` would miss most of
the vocabulary and semantic modules. A merged OWL file is generated in CI
(`make bioportal-bundle`; ADR-style: artifact only, never committed) from the
manifest-defined **Full semantic profile: 16 modules, excluding SHACL shapes**.
The ledger-matching artifact submitted for 0.16.0 has one ontology IRI
`https://w3id.org/sstim`, 11,389 triples, 234 `owl:Class` declarations, and 551
SKOS concepts; the validated source profile is HermiT-consistent. Its publication
target is
**`https://w3c-cg.github.io/sstim/ontology/sstim-full.owl`** (RDF/XML).

- **Entry point:** `https://bioportal.bioontology.org/ontologies/new` (log in).
- **Pull location (auto-updates):** `https://w3c-cg.github.io/sstim/ontology/sstim-full.owl` — **serves the latest frozen release**, not the working line. Submission `28` was patched to this URL through the authenticated BioPortal API on 2026-09-01. The preserved legacy URL serves the same bytes but is no longer the registry source. Before 2026-08-19 the URL had served whatever was on `main`, and CI then regenerated it on every push, so BioPortal's nightly pull ingested a development snapshot each night: its submission history reads 0.15.0-dev, 0.16.0-dev, 0.17.0-dev, all parsed and indexed, with "Version information" naming a mutable line nobody can cite and the Version IRI stuck at 0.14.0 — a `-dev` bundle correctly carries none, so BioPortal kept the last one it had seen. `make bioportal-bundle` now builds from `static/ontology/<release>/` and refuses to emit a `-dev` line at all.

  **Deterministic source fix deployed 2026-09-01; nightly observation pending:** one
  fail-closed resolver requires the selected direct snapshot, released Kernel
  and Full profile, and every manifest source hash. The collapse edits ROBOT's
  XML deterministically; an OWL-aware diff then permits only the documented
  header transformation. `make bioportal-reproducible` requires two independent
  builds to match the baseline-protected integrity ledger, including source
  closure, bytes, canonical graph, and counts. Pages uses an exact release/SHA
  cache with no fallback key, verifies hits before parsing/use, rebuilds an
  invalid hit or miss once, and saves verified misses immediately. The cache is
  an optimization, not the stability mechanism.

**Form fields:**

| Field | Value |
|---|---|
| Acronym | `SSTIM` |
| Name | Sensory Stimulation Ontology |
| Location | **Load from URL** (NOT upload) → `https://w3c-cg.github.io/sstim/ontology/sstim-full.owl` — "loaded nightly", so Pages deploys flow in |
| Representation language | **OWL** (RDF/XML) |
| Status | **`beta`** while pre-1.0. BioPortal's vocabulary is `alpha` / `beta` / `production` / `retired` / `under development` — there is no `released`, so this is *not* the same field as the ontology's own `mod:status`, which says `under development` on the working line and `released` on a frozen one and describes which line you are on rather than how mature it is. Do not copy one into the other. `under development` understates 16 releases with DOIs, SHACL and OWL 2 DL conformance; `production` overstates an ontology that is pre-1.0, has never had an independent review ([ADR 0022](../decisions/0022-0.6-release-review-posture.md)) and carries 282 labels no native speaker has read. Revisit at 1.0. |
| Version IRI | Extracted from the bundle; leave it alone once the pull is correct. It read `https://w3id.org/sstim/0.14.0` until 2026-08-19 — the last submission that carried one, since every bundle after it was a `-dev` line and correctly carried none. Authenticated API read-back confirmed `https://w3id.org/sstim/0.16.0` on current submission `28` after the 2026-09-01 patch. Confirm the successor created by the transition pull retains it; correct only that current row if it does not. |
| Contact | Renato Fabbri — `renato.fabbri@gmail.com` |
| Homepage | `https://w3c-cg.github.io/sstim/ontology/docs/` |
| Documentation | `https://w3id.org/sstim/manifest` |
| Repository | `https://github.com/w3c-cg/sstim` |
| Source | `https://github.com/w3c-cg/sstim/blob/main/docs/concept/SENSORY_STIMULATION.md` |
| Bug database | `https://github.com/w3c-cg/sstim/issues` |
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
Pull location:      https://w3c-cg.github.io/sstim/ontology/sstim-full.owl (Load from URL, nightly)
Submitted version:  0.6.0
Date:               2026-07-12
Account/maintainer: @rfabbri (bioportal.bioontology.org)
External record ID or URL:  https://bioportal.bioontology.org/ontologies/SSTIM
Current submission: 28 — 0.16.0; Version IRI https://w3id.org/sstim/0.16.0
Status:             LIVE. On 2026-09-01 submission 28 was PATCHed and read back
                    through the authenticated API with the W3C pull location,
                    homepage, documentation, repository, source, and issue
                    tracker above. The deterministic 0.16.0 bundle is deployed
                    at both origins and matches the integrity ledger exactly.
Required follow-up: Its transition from the previously served bytes is expected
                    to create one final 0.16.0 row.
                    Confirm the following unchanged nightly pull creates none,
                    then PATCH the latest/current row's Released field to
                    2026-08-18. Historical archived duplicates remain.
```

**Post-deploy stability and date procedure (was written for 0.16.0; applies to every release):**

1. Before deployment, record BioPortal's latest/current submission ID and row
   count. **Captured at the 2026-09-01 cutover: current ID `28`, 28 rows.**
2. Deploy, then verify that the bytes served at the pull URL have the exact
   ledger SHA-256.
3. Let the first nightly pull finish. Capture the new latest/current submission
   ID and row count, and require that the row parses. For the first deterministic
   deployment, one final `0.16.0` transition row is expected because its pinned
   bytes differ from the artifact previously served.
4. Without another deployment, wait through one more nightly pull. Require that
   the ID captured in step 3 and the row count remain unchanged; this observation
   proves byte stability.
5. PATCH **the ID captured in step 3**, not an older archived duplicate, to the
   release's truthful `dct:issued` date. Reload the API and UI and verify the
   displayed **Released** value.
6. Preserve the older archived rows as history. Repeat steps 1–5 only for a
   genuinely new release/artifact, not for unrelated site deployments.

**Submission 14 (0.14.0) failed to parse — `ERROR_RDF`, 2026-08-14 01:14 UTC.**
The first parse failure in fourteen submissions; 13 (2026-08-08) completed the
full pipeline. Diagnosed the same day and **the artifact was cleared**: the
served `sstim-full.owl` returns 200 with a matching `content-length`, is
byte-identical to a locally regenerated bundle, parses under rdflib *and* under
the OWL API (ROBOT 4.5.29, exit 0), declares exactly one `owl:Ontology`, and has
no entity punning, no invalid typed literals, no malformed IRIs or language
tags. Its two OWL 2 DL violations (`xsd:duration` in exposure) are identical to
the submission that parsed successfully. BioPortal recorded `errorMessage: null`
and `parsingLog: null`, which a genuine syntax rejection normally populates, so
the evidence points at their pipeline rather than at our RDF. The ontology stayed
browsable throughout on submission 13's metrics.

One real defect surfaced while diagnosing, unrelated to the failure: **the bundle
carried no `owl:versionIRI`**, because `robot annotate --ontology-iri` does not
carry the Kernel's version IRI through the merge. Every submission since the
first was therefore an unversioned upload at the same ontology IRI, with no
immutable version for a registry to cite. Fixed in `make bioportal-bundle`, which
initially passed `--version-iri` on a released line, omitted it on a `-dev` line
(ADR 0020: a version IRI names an immutable version, and a development line is
not one), and failed if either invariant was broken. The same pass added a guard
for an empty module list, which previously produced a valid, empty bundle rather
than an error. The current resolver is stricter: it rejects a development
selector before ROBOT runs, and every emitted bundle must carry the stable
frozen release's exact version IRI.

**Release dates — BioPortal currently prefers `dct:created`.** Re-measured from
the public submission list on 2026-08-31 and checked against the
[current NCBO mapping source](https://github.com/ncbo/ontologies_linked_data/blob/59f630f4bca589031244fde3995079c674e51aee/config/schemes/ontology_submission.yml#L451-L468):
BioPortal's metadata schema maps its `released` field from
`dct:created`, then `dct:date`, then `dct:issued`; the
[extractor stops after the first populated mapping](https://github.com/ncbo/ontologies_linked_data/blob/59f630f4bca589031244fde3995079c674e51aee/lib/ontologies_linked_data/services/submission_process/operations/submission_extract_metadata.rb#L104-L123).
The UI labels that field **Released**, but a normal SSTIM bundle therefore
supplies the ontology's original creation date, not the version's formal issue
date. The post-collapse `0.16.0` rows show 2026-04-12 while their graph declares
`dct:issued 2026-08-18`, confirming the precedence.

The older 0.6.0–0.11.0 rows were corrected manually on 2026-07-27. The
byte-reproducibility fix was deployed to both publication origins on 2026-09-01,
and the W3C URL serves 1,239,332 bytes with SHA-256
`7a2133692b6adcca6e411c79c91868954d37112545ea2c2c427e27fb6f73bb11`.
BioPortal has not yet made its first nightly pull from that deployment. It is
expected to create one final transition row because the pinned bytes differ
from those previously served. Follow the numbered procedure above: capture the transition row after
the first pull, prove its ID and row count remain unchanged after a second pull,
then PATCH that captured 0.16.0 submission to 2026-08-18:

```bash
curl -X PATCH "https://data.bioontology.org/ontologies/SSTIM/submissions/<id>" \
  -H "Authorization: apikey token=$BIOPORTAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"released":"2026-08-18T00:00:00+00:00"}'      # HTTP 204 on success
```

| Submission | Version | Released |
|---|---|---|
| 8 | 0.11.0 | 2026-07-24 |
| 7 | 0.9.0 | 2026-07-22 |
| 6 | 0.8.0 | 2026-07-20 |
| 5, 4 | 0.7.0 | 2026-07-15 |
| 3, 2 | 0.7.0-dev | 2026-07-14, 2026-07-13 |
| 1 | 0.6.0 | 2026-07-11 |

Patched submissions keep their corrected date, but every genuinely changed pull
creates a new submission whose extracted `released` value again prefers
`dct:created`. SSTIM must still bump `dct:issued` at release time because that is
the correct formal version provenance; BioPortal needs an explicit post-release
correction unless its mapping changes. Keep
`dct:created 2026-04-12` in SSTIM rather than falsifying the ontology's own
provenance to accommodate one registry field.

Two further observations from the same historical submission list: 0.10.0 has
**no** submission (it and 0.11.0 both deployed on 2026-07-24 and the daily pull
sampled once); and repeated version labels mean the pulled bytes changed, not
that BioPortal blindly submitted the same file again. Its
[cron compares the raw download MD5 with the previous upload](https://github.com/ncbo/ncbo_cron/blob/d85ca28664e4a263fd82ae79d5aa3d1c4450cb63/lib/ncbo_cron/ontology_helper.rb#L165-L179)
and creates a submission only when they differ. That makes byte-reproducible
serialization a publication invariant:
whitespace, statement order, or fresh blank-node identifiers are enough to
produce another row even when the RDF graphs are isomorphic.

#### BioPortal already generates inbound mappings, and two of them are wrong

Measured 2026-09-06 while looking for inbound references. BioPortal computes LOOM
mappings by label and displays them on both sides, so MeSH and UBERON class pages
already carry links to SSTIM: six mappings against each. That is inbound linkage
nobody asked for, and it needs reading before it is celebrated.

| MeSH class | SSTIM side | verdict |
|---|---|---|
| `D057566` Self Report | `sstim#SelfReport` | correct |
| `D014831` Voice | `sstim#Voice` | **wrong**. Ours is a synthesis voice, a parameter bundle; theirs is the human vocal apparatus |
| `T052` Activity | `prov#Activity` | not an SSTIM term |
| `D020471` Collection | `core#Collection` | not an SSTIM term |
| `T071` Entity | `prov#Entity` | not an SSTIM term |
| `D014825` Vocabulary | `voaf#Vocabulary` | not an SSTIM term |

Four of the six match on terms the bundle merely **declares**. ADR 0054 added 57
declaration axioms for reused SKOS, PROV, VOAF and Dublin Core terms to put every
profile closure in OWL 2 DL; a merged bundle therefore contains those IRIs, and a
label matcher cannot tell a declaration from a definition. The fix is not to undo
the declarations, which are what keep the artifact in OWL 2 DL.

LOOM output is computed, not curated, so it cannot be deleted from our side. What
can be done is to publish curated mappings that sit beside it, which is the
class-level BioPortal mapping route already described above. Worth knowing that
`sstim#Voice` currently sits on the MeSH Voice page claiming a similarity that is
not there.

#### Metadata gaps on the current submission, found 2026-09-06

Read back from `latest_submission`: `homepage` is the WIDOCO docs URL,
`documentation` is the manifest PID, and `hasLicense` is empty. Since ADR 0055 the
namespace IRI has a landing page of its own, so the truthful arrangement is
`homepage: https://w3id.org/sstim`, `documentation:` the docs URL, and
`hasLicense: CC BY 4.0`. Do not fold this into a PATCH until the release-date work
above has had its unchanged nightly pull, since both touch the same current
submission.

#### BioPortal project SSTIMWB — created 2026-09-06

Projects are BioPortal's record of who uses which ontologies, and they appear on
each declared ontology's page. `SSTIMWB` ("SSTIM Workbench") was created through
`POST /projects` with the stored API key, declaring `SSTIM`, `MESH`, `UBERON` and
`SNOMEDCT`, contact `renato@junto.space`, homepage
`https://w3c-cg.github.io/sstim/`, institution the W3C Community Group.

`creator` is required and is not inferred from the API key: the first POST failed
`422` with "`` value cannot be nil" until
`https://data.bioontology.org/users/rfabbri` was passed explicitly.

**Verify with `/ontologies/<acronym>/projects`.** MESH returns 16 records and
UBERON returns 7, both including SSTIMWB, which is the inbound half of this: their
pages now carry a record naming SSTIM. Do **not** verify with
`/projects?ontology=<acronym>` — that parameter is ignored, all 379 projects come
back, and every ontology appears to list us.

#### BioPortal indexes the classes and not the concepts — measured 2026-09-05

Found while checking whether the new external mappings could be pushed to
BioPortal as class-to-class mappings, which would make the MeSH and UBERON pages
there reference SSTIM. They cannot, and the reason is worth recording because it
affects discovery, not just mappings.

The submission is `hasOntologyLanguage: OWL`, and its metrics read **181 classes,
301 properties, 637 individuals**. SSTIM's SKOS concepts are dual-typed
(`skos:Concept` and the relevant OWL class, the Pattern 2 decision in
`static/ontology/README.md`), so an OWL ingest lands all 551 of them among the
individuals. BioPortal's class endpoints and its search index do not see them:

| Request | Result |
|---|---|
| `search?q=Frequency Band&ontologies=SSTIM` | 2 hits, both `sstim#` classes |
| `search?q=Preset&ontologies=SSTIM` | 2 hits, both classes |
| `search?q=Alpha&ontologies=SSTIM` | **0** |
| `search?q=Transcranial Direct Current&ontologies=SSTIM` | **0** |
| `GET /ontologies/SSTIM/classes/<techTDCS IRI>` | **404**, "not found in ontology SSTIM submission 29" |

So the whole technique, band, phenomenon and modality vocabulary is unfindable by
label in the registry chosen for biomedical browsing and candidate-mapping
discovery, and `POST /mappings`, which is class to class, has nothing on our side
to attach to for any concept-level row. Only the two class-level SNOMED mappings
could be expressed there, and SNOMED in BioPortal is licence-gated.

**Not yet established:** whether declaring the vocabulary as a SKOS-format
submission would index the concepts as browsable terms. BioPortal's submission
form offers a format choice, but no open SKOS record was found to confirm the
behaviour in this pass, and AGROVOC, the obvious example, answers 403. Do not
act on this until it is checked against a working SKOS record. If it holds, the
question is whether to add a second BioPortal record for `sstim-vocab` beside the
OWL bundle, which has its own cost: two records for one artifact is exactly the
kind of duplication this tracker exists to keep honest.

### FAIRsharing — MIGRATED AND ENRICHED 2026-09-04

Done over the REST API with a browser-issued JWT. **API access is gated on the
user profile having a linked organisation**: without one every call returns 401
with `Please link your user account with an organisation`, which reads like an
auth failure and is not one. Linking an organisation on
`fairsharing.org/profiles/edit` is the prerequisite for any future API work here.

**Corrected.**

| Field | Was | Now |
|---|---|---|
| Homepage | `labiosyncare.github.io/ontology/docs/` | `w3c-cg.github.io/sstim/ontology/docs/` |
| `cross_references` | superseded: the **0.6.0** version DOI `10.5281/zenodo.21302910`, titled "BSC Lab — …" | `10.5281/zenodo.21286974`, the concept DOI, which always resolves to the newest version |
| `support_links` | 2: the legacy repository, the CG page | 6: W3C-CG repository, issue tracker, CG page, persistent namespace, knowledge browser, and the preserved origin kept as a historical mirror |
| `description` | claimed "auditory, visual, and tactile modalities" | lists the modalities actually published, adds the four languages, the profiles, the alignment targets, and the CG non-endorsement notice |
| `domains` | 8 | 9, adding `sleep` |

The cross-reference is the one that mattered most: the record had been pinned to
the 0.6.0 archive since 2026-07-12 and stayed there through ten releases, so
anyone following it reached a DOI two months stale under the old project name.
The concept DOI cannot go stale.

**Deliberately not done, with reasons.**

- **Hearing and vision domains.** FAIRsharing's domain vocabulary holds 571
  terms and its only two sensory-perception entries are smell (`GO_0007608`) and
  taste (`GO_0050909`). There is nothing to add for the modalities SSTIM is built
  around. The existing smell and taste tags are correct and are supported by
  `sstim-v:modalityOlfactory` and the exposure module's `modalityGustatory`.
- **`electroencephalography` domain.** Rejected on the term index: SSTIM names no
  EEG term. The frequency bands are named after EEG rhythms, but the ontology
  targets them with stimulation rather than measuring them, and a domain tag
  asserting EEG would overclaim.
- **Extra user-defined tags.** `user_defined_tags` are a **global** FAIRsharing
  vocabulary, not per-record, so a new label must be created there and a
  duplicate raises `PG::UniqueViolation`. `/user_defined_tags` ignores its `q`
  parameter and returns a truncated first 1000 of at least 1476, so "this tag
  does not exist yet" cannot be established from it. `fair data` was attached by
  id; the rest were abandoned rather than guessed at against a partial list.
- **Record-to-record relations.** The obvious additions have records: HED
  `4718`, SKOS `1068`, OWL 2 `409`, PROV-O `1271`. The relation vocabulary is not
  exposed by any API endpoint tried (`/record_associations/relations` and
  `/maintenance/record_associations` both 404), and the existing three links all
  use `extends`, which is right for IAO, BFO and OBI and wrong for SKOS and OWL.
  Adding a link with the wrong relation is worse than not adding it, so this is
  left for the edit form's **RELATIONS TO OTHER RECORDS** tab, where the
  relations are a dropdown.
- **`publications` and `citations`.** Both empty, and both are what FAIRsharing's
  own "missing recommended field" banner is asking for. They are waiting on the
  Semantic Web Journal submission rather than on effort.

### FAIRsharing — original submission record

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
| Homepage * | `https://w3c-cg.github.io/sstim/ontology/docs/` |
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
| Data processes & conditions | Each entry: url, name, type, access_method. Rule: ≥1 with **type=read** and name containing **Browse/Download/Search**. Keep three: (1) **Browse SSTIM** — `https://w3c-cg.github.io/sstim/`, read, access_method **User interface**, doc_url `https://w3c-cg.github.io/sstim/ontology/docs/`; (2) **Download citable SSTIM `<version>` (Turtle)** — `https://w3id.org/sstim/<version>/sstim-namespace.ttl`, read, **Other machine-accessible method**; (3) **Download latest released SSTIM via w3id (content-negotiated RDF)** — `https://w3id.org/sstim`, read, **Other machine-accessible method**. The versioned `sstim-namespace.ttl` is the frozen whole set; `sstim-core.ttl` is Kernel only. Do NOT pick SPARQL access_method — SSTIM's SPARQL is client-side, no hosted endpoint. |

**RECOMMENDED (add for a strong, approvable record):**

| Field | Value |
|---|---|
| Licences | CC BY 4.0 |
| Organisation links | Intended **maintaining** org = BSC Lab (laBioSynCare), `https://github.com/laBioSynCare`; verify whether it saved and add it if absent without changing publisher identity. Funding org: none (independent project) — leave if none |
| Domains (DRAO) | **sensory perception** (+ auditory/visual perception if offered) |
| Support links | docs `https://w3c-cg.github.io/sstim/ontology/docs/`; repo `https://github.com/w3c-cg/sstim`; issues `https://github.com/w3c-cg/sstim/issues`; namespace `https://w3id.org/sstim` |
| Record associations | **Done 2026-07-12:** added **BFO, IAO, OBI** with relationship **extends**. **COB is not registered in FAIRsharing** (small/newer OBO layer) — skipped, no gap. |
| Citation / Publications | **Skip** — recommended-only, and only for a journal paper describing the resource (none exists). The DOI-import hangs on Zenodo DOIs (FAIRsharing import is CrossRef/PubMed; Zenodo is DataCite) — reload to clear the spinner. If a citation is wanted, use "CREATE NEW PUBLICATION" manually. Re-listed as missing by the automated completeness mail on 2026-08-07; decision unchanged until a paper exists. |
| Cross references / identifiers | Additional Information tab. Preserve the Zenodo concept DOI under **portal = Other**. Add the live **BioPortal** record `SSTIM`; add OLS only after PR #1351 is merged and the OLS record resolves. Optional. |
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
External record ID or URL:  https://fairsharing.org/8494 — PUBLIC, and findable
                            by searching "sstim" from a logged-out session
                            (checked in a second browser, 2026-08-17)
Status:             PUBLIC; FAIRsharing DOI assigned 2026-08-24:
                    https://doi.org/10.25504/FAIRsharing.660ff4.
History:            2026-07-12: taxonomies set to "Not Applicable" → record left
                    "incomplete" and read "awaiting review by FAIRsharing
                    curators". All required fields done; rich metadata (object
                    types, subjects, domains incl. sensory-perception terms, 3
                    data processes, CC BY 4.0, BSC Lab maintainer, IAO/BFO/OBI
                    extends, Zenodo cross-ref). Recommended-missing (funding org,
                    publications, citations) intentionally skipped — do not block
                    review/DOI. FAIRsharing curator Lea.Girard (10801) modified
                    and reviewed the record on 2026-08-06 16:50 (the record's own
                    "Last Edited"/"Last Reviewed" is the authority; this file
                    previously said 08-07, the notification's date), so review has
                    begun. The DOI is a record identifier, not an SSTIM release
                    DOI, so it does not belong in `CITATION.cff` or `void.ttl`.
Required follow-up: In a signed-in record edit, change the homepage, Browse
                    SSTIM URL/documentation URL, and support repository/docs/
                    issues to the W3C-CG values above; change any versioned
                    whole-set download from `sstim-core.ttl` to
                    `sstim-namespace.ttl`; preserve record 8494, both DOI
                    families, and the stable W3ID namespace. Verify whether the
                    intended BSC Lab maintaining-organisation link exists; if
                    absent, add it without changing publisher identity. Add the
                    live BioPortal cross-reference.

                    **Public visibility is NOT scriptable from here — check it in
                    a logged-out browser.** Do not try to be clever about this.
                    Two proxies have now been tried and both are invalid:

                      - `api.fairsharing.org/fairsharing_records/8494` → 401, and
                        the search endpoints 404. No anonymous API to ask.
                      - The server-rendered `<title>`. Public records *sometimes*
                        carry a record-specific title and sometimes serve the bare
                        "FAIRsharing" shell — 8480 and 8500 render titles while
                        8490, 8494, 8505, 8510 and 8520 do not, with the same
                        result under a real browser User-Agent. It is a prerender
                        cache artifact, uncorrelated with visibility.

                    On 2026-08-17 the second proxy was used to conclude the record
                    was not yet public. **That was wrong** — a logged-out session
                    in a second browser reaches the record and finds it by
                    searching "sstim". The error is the §3.6 one exactly: the
                    instrument was checked for one direction only (public records
                    can render titles) and the converse was assumed. When no
                    instrument can see the place, the answer is INCOMPLETE, not
                    "absent".

                    The 2026-09-01 public server-rendered record data still
                    exposed the legacy homepage. The write API requires
                    authentication, and the available signed-in browser runtime
                    failed to start, so no edit was claimed. Two things still
                    need that signed-in session: (1) diff the curator's
                    2026-08-06 edits at `https://fairsharing.org/8494?history=show`
                    against the intended values above; (2) the record was
                    submitted at 0.6.0 and the current release is 0.16.0 —
                    confirm no data-process URL pins a stale version. Also note
                    the same-day automated completeness mail listed
                    "Organisation links" as not yet present, which contradicts
                    the BSC Lab maintaining-org entry recorded here; it is more
                    likely counting the deliberately absent funder/collaborator
                    roles, but verify the maintainer link actually saved.
```

### LovPortal (LIRMM) — READY TO SUBMIT, blocked on an account

Measured 2026-09-06. `https://lovportal.lirmm.fr/` describes itself as "a gateway
to reusable semantic vocabularies on the Web": an **OntoPortal instance** run by
LIRMM, the same software and the same API as BioPortal, at
`data.lovportal.lirmm.fr`. That makes it the closest fit of any registry left on
the list, because SSTIM is a reusable vocabulary rather than a biomedical
terminology, and because the submission procedure is one we have already run.

- **755 vocabularies**, SSTIM absent (`/ontologies` with their published UI key).
- **754 of the 755 are administered by `admin`** and one by `jonquet`, so the
  corpus is a bulk import rather than a queue of user submissions. That is a
  reason to expect an inclusive bar, not an exclusive one.
- Submission needs an account: `/ontologies/new` redirects to the welcome page
  when logged out. Their `latest_submission` and `/submissions` endpoints answer
  500 to the public UI key, so some reads need a real user key too.

**Blocked on their side, reported 2026-09-06.** Account registration cannot be
completed at all: the reCAPTCHA widget on `/accounts/new` renders "ERROR for site
owner: invalid domain for site key", so there is no challenge to solve and the
form always answers "Please fill in the proper text from the supplied image".
The same submission also rejects a valid ORCID, `0000-0002-9699-629X`, whose
MOD 11-2 check digit verifies and which resolves 200. Both are filed as
[lovportal/project-management#3](https://github.com/lovportal/project-management/issues/3),
with the vocabulary offered in the same issue in case they would rather ingest it
directly than fix registration first. Their feedback form carries a "Vocabulary
submissions request" tag, and `lovportal-support@lirmm.fr` is the email route if
the issue goes unanswered.

**Prepared, so submission is three commands once a key exists**, at
`~/sstim-drafts/lovportal-ontology.json`, `lovportal-submission.json` and
`lovportal-submit.sh`. Save the key to `docs/credentials/lovportal.md`, which is
gitignored like the BioPortal one, and set `administeredBy` to the account.

**One decision before submitting: OWL or SKOS.** The prepared payload pulls the
Full OWL bundle, matching the BioPortal record, so both registries describe the
same artifact. The cost is the one measured on BioPortal: an OWL submission
ingests the 551 SKOS concepts as individuals, where search and the class
endpoints cannot see them. A vocabulary gateway is arguably the place where that
matters most, and it is also the low-risk place to try a SKOS submission, since
nothing here disturbs the established BioPortal identity.

### Bioregistry — REQUESTED 2026-09-06, issue #2055, labelled and in the queue

A community registry of prefixes and identifier namespaces that exports its
records as RDF, so an accepted entry is itself an inbound reference to the SSTIM
namespace. `https://bioregistry.io/api/registry/sstim` answered 404 on
2026-09-05, so SSTIM was absent when this was filed.

```text
Service:            Bioregistry (biopragmatics/bioregistry)
Submitted URL:      https://github.com/biopragmatics/bioregistry/issues/2055
Submitted version:  namespace-level, not release-pinned
Release DOI:        10.5281/zenodo.21286974 (concept)
Date:               2026-09-06
Account/maintainer: ttm (Renato Fabbri), ORCID 0000-0002-9699-629X
External record ID: issue #2055 (labels: New, Prefix) -> PR #2056
Status:             bot PR open, awaiting a curator's merge
Required follow-up: watch PR #2056; then /api/registry/sstim should answer 200
```

**Their bot did the rest, within a minute.** The workflow runs on `issues:
[opened]`, waits ten seconds for labels, and exits early without them, which is
visible in their run history: the run for #2054 at 12:57 succeeded and did
nothing, and the run for #2055 at 13:06 produced
[PR #2056](https://github.com/biopragmatics/bioregistry/pull/2056), "Add prefix:
sstim", on branch `create-pull-request/patch-2055`. Nothing is filed by hand;
there is no PR for us to open.

The record it generated carries every field as submitted, plus
`github_request_issue: 2055`. One rough edge: the whole Additional Comments text
landed in the record's `comment` field, including the sentences addressed to the
curators, where neighbouring records use one short line. A trimmed value and the
sibling-namespace question were offered on the PR
([comment](https://github.com/biopragmatics/bioregistry/pull/2056#issuecomment-5559452796)),
for them to take or leave. Do not edit their data file unprompted.

**Editing the issue would not have fixed it, and that is the general lesson.**
Their workflow triggers on `issues: [opened]`, so the parse happens once. After
the PR exists the record lives there, an issue edit changes nothing without a
manual re-run, and it would leave the issue and the PR disagreeing about what was
submitted. Correct a bot-generated record on the pull request, not on the issue
behind it.

**What was requested.** Prefix `sstim`, URI format `https://w3id.org/sstim#$1`,
pattern `^[A-Za-z][A-Za-z0-9]*$`, example `SensoryStimulation`, licence
`CC-BY-4.0`, publication `doi:10.5281/zenodo.21286974`. The pattern is measured
rather than inferred: it matches all 1,099 local names across the four term
namespaces.

**The one judgement call put to the curators.** Bioregistry mints one prefix per
URI format and SSTIM has four term namespaces, so the comments name the siblings
with their sizes (`vocab#` 405, `exposure#` 268, `ecosystem#` 82, core 344) and
offer either separate prefixes (`sstim.vocab` and so on) or a different primary.
The core namespace was requested because it is what prefix.cc already serves.

**Why there are two issues, and what to do next time.** Their automation
(`.github/workflows/new_prefix_pr.yml` running `src/bioregistry/gh/new_prefix.py`)
selects issues by the `New` and `Prefix` labels, which the issue **template**
applies automatically. The first attempt, #2054, was filed with `gh issue create`,
which bypasses the template: no labels, and `gh issue edit --add-label` is refused
because setting labels needs triage permission on their repository. The body
parsed fine, since their reader wants the same `### heading` blocks the form
produces, but an unlabelled issue is invisible to the bot.

#2055 was therefore re-filed through the prefilled template URL (kept at
`~/sstim-drafts/bioregistry-prefilled-url.txt`, generated with the same values),
which applies the labels itself, and #2054 was closed as a duplicate pointing at
it, with the reason stated in the comment.

**The rule this leaves behind: file a labelled-workflow issue through its
template URL, not through `gh issue create`.** A registry whose curation runs off
labels cannot see a submission that carries none, and the failure is silent: the
issue looks filed and simply never gets picked up.

### DBpedia KG Catalog — LIVE at 0.16.0; automated updater merged

A new, actively developed DBpedia catalogue (<https://kg-catalog.dbpedia.org/>),
announced on the DBpedia Slack by Milan Dojchinovski (@m1ci) inviting beta
testers. Its canonical GitHub repository is now `dbpedia/kg-catalog` (the old
`m1ci/lod-next-gen` links redirect). Worth being early
in: the maintainer is present and asking for feedback, unlike Archivo's stalled
updater and LOV's untracked manual intake.

**Ontologies are in scope**, checked before submitting rather than assumed:
domain 8, "Linguistics, Social & Digital Knowledge Systems", reads "Includes
linguistics, **ontologies**, social networks…", and the Computer Science
Ontology is already catalogued as `cso`.

**Two submission routes.** Option 1 is a guided GitHub issue form, recommended
by the guide and validated automatically. Option 2 is a YAML pull request
against `knowledge-graphs/<id>/metadata.yaml`. The initial 0.15.0 record used
option 1; the W3C-CG migration and automated refresh used option 2 in
[PR #53](https://github.com/dbpedia/kg-catalog/pull/53), merged 2026-09-03.

**No Databus publishing is required.** `cso` sets both `moss-publish` and
`databus-publish` to `false` and points its distributions at self-hosted files,
which is what we mirrored — so this submission does not depend on the Databus
that is currently failing for Archivo.

```text
Service:            DBpedia KG Catalog (dbpedia/kg-catalog)
Initial submission: https://github.com/dbpedia/kg-catalog/issues/46
Migration/update:   https://github.com/dbpedia/kg-catalog/pull/53
Live versions:      0.15.0 (artifact version id 2026.08.17) and
                    0.16.0 (artifact version id 2026.08.18), both `active`
0.15.0 distribution: https://labiosyncare.github.io/ontology/0.15.0/sstim-namespace.ttl
                    ttl, 727857 bytes, sha256
                    838b09a862af283d8a3ace16872f05cb43eb69ee061f3217077e94bc66cc2dfc
0.16.0 distribution: https://w3c-cg.github.io/sstim/ontology/0.16.0/sstim-namespace.ttl
                    ttl, 788555 bytes, sha256
                    522abc802f2366356899ddedc5b2e548d5918368185fd84b178c6004398037b1
Date:               2026-08-18 initial; 2026-09-01 migration PR;
                    2026-09-03 merged
Account/maintainer: @ttm
Status:             LIVE since 2026-08-24 at kg.html?id=sstim and the Databus
                    group. PR #53 was merged by @m1ci on 2026-09-03T07:06:20Z
                    (merge commit 4a345a03). It preserved the historical 0.15.0
                    URL/hash, updated record-level facts to 0.16.0, added the
                    verified W3C 0.16.0 distribution, and set
                    `check-new-release: sstim_release_auto_update.py`.
                    The updater reads stable W3C-CG tags, then fails closed
                    unless the frozen manifest, `owl:versionInfo`, and one
                    `dct:issued` date agree before calculating bytes and SHA-256.
Post-merge checks:  Both were run on 2026-09-04 and both passed.
                    (1) Promotion: the LOD Cloud Bot commit 630e960b, 23 seconds
                    after the merge, flipped the 0.16.0 distribution from
                    `pending` to `active`; the Databus version 2026.08.18 now
                    publishes the W3C-CG file with dcat:byteSize 788555 and the
                    PR's sha256, issued 2026-09-03T07:06:41Z.
                    (2) Idempotence: the first scheduled `Daily KG Release Check`
                    after the merge (run 33841539799, 2026-09-04T05:43:26Z)
                    logged "SSTIM KG metadata is current at 0.16.0" and produced
                    no commit; `metadata.yaml` on main is still at 630e960b.
Required follow-up: None while releases stay routine. Future stable tags should
                    append exactly one release at a time; do not manually rewrite
                    historical distributions. If a release ever fails to appear,
                    read the updater's log line in that day's workflow run before
                    assuming the record is stale.

                    **Domain is Life Sciences & Health**, changed by the
                    maintainer's decision on 2026-08-18 and verified live on the
                    issue. It was first submitted under "Linguistics, Social &
                    Digital Knowledge Systems", on the reasoning that the README
                    lists ontologies there and that a health domain might imply
                    the clinical reading SCOPE.md avoids. Renato chose the
                    subject-matter domain instead, which is what the README
                    actually asks for — "the main domain reflecting the content
                    of the KG" — and is what `cso` did. The no-clinical-efficacy
                    sentence sits in the abstract, so the disclaimer travels with
                    the record rather than depending on the classification.
```

### ShowVoc (EU Publications Office) — EVALUATED, NOT SUBMITTED

<https://showvoc.op.europa.eu/> — an EU Publications Office instance of ShowVoc,
the Semantic Turkey / VocBench browser. Raised 2026-08-18; researched rather than
submitted, and the reasoning is here so it is not re-researched.

**What it holds**, from `st-core-services/Projects/listProjects` on 2026-08-18:
255 datasets, of which 143 are `data.europa.eu`, 83 `publications.europa.eu` and
14 `inspire.ec.europa.eu`. Only about seven are third-party, and every one is a
major international reference vocabulary — three OBO ontologies, GeoNames, the
NCI Thesaurus, OMG, EFSA. By model: 233 SKOS, 20 OWL, 2 RDFS.

**A public contribution workflow exists in the software.** The Angular bundle
carries `/contribution` and `/contributions` routes, `contributorName` /
`contributorLastName` / `contributorEmail` fields, and token-based
`load/stable/:token` and `load/dev/:format/:token` flows — the standard ShowVoc
model where a request is approved by an administrator who then sends a load link.

**Whether that workflow is open on the EU instance could not be verified from
outside**, and the entry says so rather than guessing: system settings return
"Access denied. You need to be logged in", and the bundle exposes no contact
address. Note also that Semantic Turkey answers **HTTP 200 with an error body**
— a probe for a non-existent service returned 200 carrying
`NoResourceFoundException`. A status code is not an answer here.

**Recommendation: ask before submitting.** The contrast with the DBpedia KG
Catalog is the whole argument. There, the maintainer solicited beta submissions
in a channel we are in, ontologies were explicitly in scope, and an ontology was
already catalogued. Here there is no invitation, no confirmed public route, and
a peer group of long-established reference vocabularies. An unsolicited
submission from a four-month-old ontology risks reading as noise in an
institutional context where that is expensive and hard to undo.

**The support channel, found on the project's own site rather than guessed.**
<https://showvoc.uniroma2.it/support> says support is hosted on VocBench's
discussion groups and asks for a `[ShowVoc]` subject prefix:

  Users:      https://groups.google.com/g/vocbench-user   (reachable, HTTP 200)
  Developers: https://groups.google.com/g/vocbench-developer

That is a Google Group, so it cannot be posted from a script the way the GitHub
submissions were — it needs a human with a Google account, which is why the
message is drafted rather than sent.

**Enquiry drafted 2026-08-18:**
[`outreach/2026-08-18-showvoc-enquiry.md`](outreach/2026-08-18-showvoc-enquiry.md).
It asks three things: whether the Publications Office instance accepts datasets
from outside the EU institutions, whether the in-app contribution workflow is
the right route or the request should go to the Publications Office directly,
and whether a community instance would be a better home. Note the division of
responsibility behind that framing — ART builds ShowVoc, but the Publications
Office decides what goes on *their* instance, so the answer may be a redirect.

Status: **drafted, not sent.** Send it, then record the reply here before doing
anything else with this registry.

### OLS4 (EBI Ontology Lookup Service) — PR OPEN, UPDATED 2026-09-01

OBO-adjacent browsing without changing SSTIM identifiers. The old note here said
"confirm the current repository and format" and rated this low priority behind
Archivo and LOV. Archivo's updater is stalled; LOV shows recent curation but its
SSTIM suggestion is untracked; OLS is actively reviewed. The priority was
therefore backwards. Confirmed 2026-08-18:

**Absence measured, not assumed.** `GET /ols4/api/ontologies/sstim` and `/SSTIM`
both return 404 against 282 indexed ontologies.

**Non-OBO ontologies are accepted.** 207 of the 282 come from
`purl.obolibrary.org`, but **13 are served from `w3id.org`** — our own namespace
host — including AIO, Biolink, CPONT, CRediT, MIXS, METPO, ROR and Value Sets.
Several are scholarly infrastructure rather than biomedical, so the profile is
broader than "OBO Foundry only".

**The repository is alive**, unlike Archivo's: `EBISPOT/ols4`, last pushed
2026-08-14, 98 stars, and a steady stream of merged "Add X ontology" pull
requests — #1349 Value Sets and #1350 CMPO on 11 and 14 August, #1348 REHABO,
#1337 UOGTO, #1332 AIO. 41 issues and PRs match that pattern.

**The exact mechanism**, taken from merged PR #1349 rather than guessed: a single
entry appended to **`ebi_ontologies.json`** at the repository root, on the
**`dev`** branch. `dataload/configs/*.json` is a separate, older mechanism and
`foundry.json` is the auto-pulled OBO set; neither is the route. Fields used by
recent entries:

    id, creator[], is_foundary (their spelling), preferredPrefix, title, uri,
    description, homepage, mailing_list, label_property[],
    definition_property[], synonym_property[], hierarchical_property[],
    base_uri, reasoner, oboSlims, ontology_purl

**The submitted entry pins a frozen release artifact.** PR #1351 now uses
the submitted `https://w3c-cg.github.io/sstim/ontology/0.16.0/sstim-namespace.ttl` and the W3C
documentation homepage. It does not consume BioPortal's generated
`sstim-full.owl`. The ontology IRI and all base namespaces are unchanged.

Note SSTIM's SKOS layer is a good fit for the `definition_property` and
`synonym_property` fields, which recent entries point at `skos:definition` and
`skos:altLabel`. Our `skos:altLabel` coverage is thin — 15 labels on 8 of the
551 concepts, all English — so the synonym field would be declared and mostly,
not entirely, empty. See `make language-coverage` and the alias note in
`CURRENT_STATE.md`.

```text
Service:            OLS4 (EBI Ontology Lookup Service)
Submitted URL:      https://github.com/EBISPOT/ols4/pull/1351
Submitted version:  0.16.0 (updated from 0.15.0 on 2026-09-01)
Date:               2026-08-18
Account/maintainer: @ttm (fork ttm/ols4, branch add-sstim-ontology)
External record ID or URL:  https://www.ebi.ac.uk/ols4/ontologies/sstim (on merge)
Status:             PR OPEN, UNDER REVIEW — one entry appended to
                    ebi_ontologies.json against the dev branch. Migration commit
                    258c2a51 changes its homepage and ontology_purl to W3C-CG /
                    frozen 0.16.0; reviewer notification posted 2026-09-01.

                    2026-08-20: collaborator @haideriqbal asked three questions —
                    the biomedical use case, which group or institute developed
                    it, and the long-term maintenance and update plan. Answered
                    2026-08-21 in the PR thread. The reply's substance, so a
                    later enquiry from another registry stays consistent with
                    it: the ontology describes and contextualizes sensory
                    stimulation for research and applied practice, and does not
                    prescribe or certify; invasiveness is a modelled axis rather
                    than a scope limit, with interventional techniques defined
                    and placed but the parameter-level depth on sensory-route
                    stimulation; the project is independent rather than an
                    institutional deliverable, with the W3C CG as its
                    vendor-neutral home; and maintenance rests on frozen
                    per-release snapshots with version DOIs, the CI gate, and
                    stable IRIs with deprecation over deletion.
Required follow-up: Watch #1351. On merge, confirm the ontology resolves at
                    /ols4/ontologies/sstim and record the URL above.

                    **Bump ontology_purl at every release.** It pins the frozen
                    0.16.0 snapshot deliberately: the unversioned path
                    /ontology/sstim-namespace.ttl serves the mutable -dev line,
                    and this file's own rule is never to present that as a
                    release. The cost is a one-line PR per release, and the PR
                    description offers them a rolling URL instead if they would
                    rather have fewer. Added to the release checklist below.

                    Config choices, recorded so a reviewer's question has an
                    answer: `reasoner` omitted (as in most entries) because the
                    hierarchy is asserted, not inferred, so load-time reasoning
                    buys nothing even though the ontology is OWL 2 DL and
                    consistent under HermiT, JFact and Openllet; `base_uri`
                    lists four namespaces because SSTIM is modular;
                    `label_property` carries both rdfs:label and skos:prefLabel
                    since classes use one and concepts the other; and
                    `synonym_property` is declared as skos:altLabel despite its
                    sparse current coverage (15 labels on eight concepts in
                    0.16.0).

                    Verified before pushing the update: the ontology_purl
                    returns 200 as Turtle, 788555 bytes, parsing to 11506
                    triples, SHA-256
                    522abc802f2366356899ddedc5b2e548d5918368185fd84b178c6004398037b1.
```

### OpenAIRE — CLOSED 2026-09-02, satisfied without a submission

This row said "submit only after an eligible gateway/aggregator record exists".
Nobody had measured whether a submission was needed at all. It is not:

```text
$ curl "https://api.openaire.eu/search/software?doi=10.5281/zenodo.22003777"
<total>1</total>          # the 0.16.0 version DOI
   SSTIM Workbench: Open Sensory Stimulation Platform and SSTIM Ontology
   https://zenodo.org/records/22003777
$ ... ?doi=10.5281/zenodo.21286974
<total>1</total>          # the concept DOI, indexed too
$ ... ?doi=<a Zenodo DOI that does not exist>
<total>0</total>          # negative control: the endpoint discriminates
```

The control is the point. A search API that answered `1` to everything would
produce exactly the reading above and mean nothing. The control DOI is written
out rather than quoted here because `truth-audit` reads every DOI in this file
and cannot tell a deliberate fake from a stale one, which is the correct
behaviour for that gate.

Zenodo is an OpenAIRE-compliant repository, so depositing there *is* the
OpenAIRE route: the record is harvested and indexed as software, with no action
taken here and none available. [OpenAIRE
Provide](https://provide.openaire.eu) is an intake for the operators of
repositories and aggregators, which SSTIM is not.

**Closed rather than deferred**, because deferred work resurfaces in every audit
and this has no next step. Re-measure with the command above if the question
comes back.

### Software Heritage — ARCHIVED 2026-09-03

The reference archive for *source code*. It complements Zenodo rather than
duplicating it: Zenodo archives a release, Software Heritage archives the
repository, and returns a persistent SWHID (`swh:1:snp:…`) for it. Nothing in
this tracker covered it, and the string "Software Heritage" appeared exactly
once in the repository, in a comment in `scripts/gen-codemeta.mjs`, which is
also the file that emits the CodeMeta such harvesters read.

**Measured, with a control, so the absence is a finding and not a timeout:**

```text
$ curl .../api/1/origin/https://github.com/w3c-cg/sstim/get/
{"exception":"NotFoundExc","reason":"Origin with url ... not found!"}
$ curl .../api/1/origin/https://github.com/laBioSynCare/laBioSynCare.github.io/get/
{"exception":"NotFoundExc","reason":"Origin with url ... not found!"}
$ curl .../api/1/origin/https://github.com/torvalds/linux/get/     # control
ARCHIVED
```

- **Intake:** `POST https://archive.softwareheritage.org/api/1/origin/save/git/url/<repository-url>/`.
  Anonymous requests are accepted; origins on known forges are scheduled
  promptly. Poll the same path with `GET`, then read the snapshot SWHID from
  `/api/1/origin/<url>/visit/latest/`.
- **Both origins:** `https://github.com/w3c-cg/sstim` and
  `https://github.com/laBioSynCare/laBioSynCare.github.io`.

**The sweep, run before submitting, because archival is permanent and public
and copies whatever is committed at visit time. There is no un-archive.**
Verified 2026-09-03: `docs/credentials/`, `docs/funding/` and `.env` have zero
tracked files each; the only tracked file whose name suggests a secret is
`.env.example`, whose every value is empty; and the only token-shaped string in
the tree is a deliberately fake Google key at
`src/portability/sessionPackage.test.js:240`, a negative fixture for the
detector that stops real ones being exported. This sweep is a precondition of
every future submission here, not a one-time clearance.

**Submitted and archived 2026-09-03.**

```text
POST /api/1/origin/save/git/url/https://github.com/w3c-cg/sstim/
  request 2462747 -> accepted -> succeeded, visit full
  swh:1:snp:4fc9710a79530047911ef7cbb872f73d79673115

POST /api/1/origin/save/git/url/https://github.com/laBioSynCare/laBioSynCare.github.io/
  request 2462748 -> accepted -> succeeded, visit full
  swh:1:snp:39ba6c8174f2e4b9636c8d44114ab2de92d45e0b
```

Both are on the Zenodo record as `isVariantFormOf`, not `isIdenticalTo`: the
record archives one tag, the snapshot archives the whole history, so they are
two packagings of the same source rather than the same object.

**Zenodo rejects the `swh` identifier scheme.** Sending the bare SWHID fails the
publish with `metadata.related_identifiers.N.scheme: Invalid scheme`, so each
SWHID travels as the resolver URL `https://archive.softwareheritage.org/<swhid>`
with scheme `url`, both verified 200. Do not "fix" these back to bare SWHIDs.

Re-archival is not automatic. Software Heritage revisits origins on its own
schedule; a fresh snapshot after a release is the same POST again.

### OBO Foundry membership — DECLINED, reaffirmed 2026-09-03 on measurement

[ADR 0016](../decisions/0016-publication-obo-posture-and-registries.md) §2
declined membership in June on identifier grounds.
[ADR 0056](../decisions/0056-readable-iris-accepted-costs-and-the-obo-idspace-prerequisite.md)
recorded what that costs. This entry records the question being asked directly,
"are we losing a lot by not joining", and answered with numbers rather than
posture. **The answer is no, and the recommendation is not to join.**

**What the biomedical channel is actually delivering, measured 2026-09-03:**

```text
BioPortal SSTIM   306 visits since listing   (2026-07: 167, 2026-08: 135, 2026-09: 4)
                  indexed 181 classes, 637 individuals, 301 properties
Zenodo, all 12    116 views, 25 downloads
```

BioPortal, entered **without** OBO membership, is the busiest surface SSTIM has,
by roughly 2.6 times the DOI archive. Two caveats keep that honest: BioPortal's
analytics do not visibly exclude crawlers, and the July and August figures
coincide with our own submission and metadata-patching work, so some of that
traffic is us. The September run rate of about 1.3 visits per day is the sober
estimate of organic interest, and it is small. The claim being made here is only
that the channel is open and used, not that it is busy.

**What declining actually costs, ranked honestly:**

1. **Independent ontology review.** The real loss. The OBO Operations Committee
   reviews against roughly twenty principles, and SSTIM claims no independent
   human ontology review today. This is a genuine gap and membership would close
   it.
2. **Default reuse by biomedical data curators**, who reach for OBO first. Not
   hypothetical given the HED/BIDS work aims at neuroimaging datasets, but the
   demand is unmeasured: nobody has yet asked to annotate a dataset with SSTIM
   terms.
3. **An OntoBee listing.** Trivial, and covered by BioPortal and OLS4.

**What declining does not cost:** biomedical discovery (BioPortal, live and
busiest), OLS presence (PR #1351; OLS indexes non-OBO ontologies), OBO
upper-layer interoperability (BFO, IAO, OBI and COB alignments already carry
it), and quality assurance (`make validate` runs SHACL, HermiT and competency
queries, which is heavier than the OBO Dashboard).

**The cheaper substitute for the one real loss.** A Semantic Web Journal
ontologies-track submission buys independent review more cheaply and more
relevantly than membership: open review with named reviewers, public reviews,
and it assesses the whole artifact including the SKOS and SHACL layers rather
than conformance to twenty identifier and process principles. It also costs no
identifiers.

**The trigger that reopens this**, and the only one: a dataset, consortium or
collaborator that wants to annotate with SSTIM terms and requires OBO PURLs to
do it. That converts an abstract loss into a concrete one. ADR 0056 then governs
the order of operations, and an IDSPACE request comes before any generation
step.

**One argument that has grown stronger since June, recorded so the reaffirmation
is not read as settled forever.** SCOPE.md was corrected on 2026-09-02 to state
that SSTIM covers clinical use, which it always modelled. That makes the
biomedical data-curation audience more relevant than ADR 0016 assumed, so loss 2
above carries more weight now than it did. It does not touch the identifier
objection, which is what decides this, but it is the direction a real trigger
would arrive from.

### FAIRsharing data processes — ADDED 2026-09-04; form-only, and unverifiable from outside

FAIRsharing's curation email of 2026-09-04 lists exactly one **required** field
still missing, and it is the only thing stopping curators from reviewing the
record:

> Data processes and conditions … You must provide at least one 'read' data
> process that has either 'Search', 'Browse', or 'Download' in the name to
> ensure findability of the resource.

**It cannot be added over the API.** Measured 2026-09-04 with a maintainer
token: no data-process resource is exposed on any record, on any path tried
(`/fairsharing_records/<id>/data_processes`, `/data_processes`,
`/record_data_processes`, `/data_accesses`, `/fairsharing_records/<id>/record_associations`
— all 404), and the record payload for UniProt (`2077`), which certainly has
data processes, contains none either. Its metadata carries
`data_access_condition` and `data_deposition_condition`, which are a different
thing: conditions, not the named read processes the requirement asks for. So
this section is edit-form only.

**Added 2026-09-04**, all three, exactly as below. The record's `updated_at`
moved to `2026-09-04T09:46:36Z` on submission.

**Neither instrument can confirm them, and that is worth knowing before someone
re-measures.** The API payload still shows no data-process key after they were
added, which is the same result it gives for UniProt, so the field is simply
absent from that representation rather than empty. The public record page is a
JS shell embedding only a schema.org summary: a control search for five things
the API proves are on the record (the issues support link, the PROV-O and HED
relations, the concept DOI, the `sleep` domain) found none of them either. So
the only outside evidence is `updated_at`, and the real confirmation will be
FAIRsharing's own curation mail no longer reporting a missing required field.

**The three entries**, all type `read`:

| Name | URL | Access method |
|---|---|---|
| Browse SSTIM | `https://w3c-cg.github.io/sstim/` | User interface, doc_url `https://w3c-cg.github.io/sstim/ontology/docs/` |
| Download citable SSTIM (Turtle), as submitted at 0.16.0 | `https://w3id.org/sstim/0.16.0/sstim-namespace.ttl` | Other machine-accessible method |
| Download latest released SSTIM via w3id | `https://w3id.org/sstim` | Other machine-accessible method |

The word Browse or Download in each *name* is what satisfies the rule; the URL
alone does not. Do not select SPARQL as an access method: SSTIM's SPARQL runs
client-side against a loaded graph and there is no hosted endpoint to claim.

**Still open after that**, and not blocking: the domain list carries `sensory
perception of smell` and `sensory perception of taste` but no hearing or vision
term, while the description names auditory and visual first. Both tags are
legitimate, since SSTIM publishes `sstim-v:modalityOlfactory` and
`sstim-ex:modalityGustatory`, but the two central modalities are absent from the
tags a curator filters on. Check whether FAIRsharing's controlled domain list
offers hearing and vision equivalents and add them if so.

**Organisation link** still reads `BSC Lab (maintains)`, and `countries` still
reads Italy. Both are identity questions rather than migration defects, and both
wait on the publisher/steward governance decision this file already flags.

### OntoBee — CLOSED 2026-09-02, not applicable

[ADR 0016](../decisions/0016-publication-obo-posture-and-registries.md) §7 lists
OntoBee among the registries to work through, and §2 of the same ADR rejects OBO
Foundry *membership* on identifier grounds while keeping OBO
*interoperability*. Those two cannot both be acted on: OntoBee serves the OBO
Foundry library, so an ontology that is deliberately not a member has no intake
there.

Closed as not applicable. If a future ADR reopens OBO membership, this reopens
with it and not before.

### re3data and OpenDOAR — CLOSED 2026-09-02, superseded by FAIRsharing

ADR 0016 §7 names these as alternatives to FAIRsharing, not additions to it
("FAIRsharing (or OpenDOAR / Re3data)"). FAIRsharing record
[`8494`](https://fairsharing.org/8494) is live with DOI
`10.25504/FAIRsharing.660ff4` assigned, so the alternative was taken.

They would not fit in any case: re3data indexes research *data repositories* and
OpenDOAR open-access *repositories*. SSTIM is a vocabulary, published through a
repository it does not operate.

### Wikidata — PUBLISHED 2026-09-06 (item + 29 term links)

One ontology item first, then conservative term-level links, only after the HTML
landing page and registry metadata are stable. Both gates were met, and both
steps ran on 2026-09-06: item [`Q141325360`](https://www.wikidata.org/wiki/Q141325360),
then 29 `P2888` statements on the mapped items. `make wikidata-inbound` reads 29
of 32, the remaining three being `relatedMatch` rows held back by design.
Governed by the External Mapping Policy in the publication plan.

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
