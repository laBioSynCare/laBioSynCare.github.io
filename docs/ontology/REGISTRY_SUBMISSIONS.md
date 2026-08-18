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
| Frozen whole-set entry point | `https://w3id.org/sstim/<version>` (namespace catalogue) |
| Frozen Kernel Turtle | `https://w3id.org/sstim/<version>/sstim-core.ttl` |
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

> **Measured 2026-08-18** with `make registry-verify` and `gh`, not inherited.
> Three states, because two would lie: **verified**, **wrong**, and
> **INCOMPLETE** — an unreachable service is an unreachable instrument and never
> evidence of absence (CLAUDE.md §3.6).
>
> | Registry | Result that day |
> |---|---|
> | prefix.cc | **was wrong** — slash where the ontology has a hash; corrected the same day, see below |
> | BARTOC · FAIRsharing | verified 200 |
> | LOV | absent, confirmed against a `skos` control that answered 200 |
> | OLS4 #1351 · KG Catalog #46 | both still **open**, no maintainer response yet |
> | DBpedia Archivo | **INCOMPLETE** — timed out; `dbpedia.org` itself also failed to answer, so this is their infrastructure and says nothing about our record |
> | BioPortal | **INCOMPLETE** — the web UI answers 403 to a plain client and the REST API 401 without an API key, so neither confirms nor denies the entry below |

| Registry | Can submit now? | Account? | Priority |
|---|---|---|---|
| prefix.cc | ✅ **corrected 2026-08-18** — now serves `sstim` → `https://w3id.org/sstim#` in all four serialisations (`txt`, `json`, `ttl`, `sparql`), verified by `make registry-verify`. It had served the slash form since before 2026-07-11; the hash entry was added and voted above it, and the slash form remains listed but outranked. Its TLS certificate expired 2025-12-31, so `https://` still fails certificate validation and plain `http://` is the only way to read it | yes | — |
| DBpedia Archivo | ✅ **indexed 2026-08-17** (not re-confirmable 2026-08-18 — the host timed out, and so did `dbpedia.org`) — [record](https://archivo.dbpedia.org/info?o=https://w3id.org/sstim), 10441 triples, owl/ttl/nt. Rated ★☆☆☆ and **frozen**: the rating reflects the graph at submission, and Archivo's updater has not run since 2026-02-23, so the deployed licence fix will not be seen | no | report upstream |
| LOV | 🕓 **submitted 2026-07-10; slow queue, not dormant** — LOV inserted `gist` 2026-07-05, `rml-lv` 2026-06-12; absence re-verified 2026-08-18 against the live site (`/vocabs/sstim` 404 vs `/vocabs/skos` 200), since the SPARQL endpoint serves a stale pre-submission dump | no | escalate |
| BARTOC | ✅ **live** — [node 21154](https://bartoc.org/en/node/21154), created 2026-07-27 by editor Jakob Voß; anonymous 200 + JSKOS API + top public search hit (verified 2026-08-17) | yes (GitHub) | — |
| BioPortal | ✅ **parsed & live** (ontologies/SSTIM) — *unverified 2026-08-18: web 403 to a plain client, REST API 401 without a key* — browsable on **submission 13's** metrics, 67 classes and 334 concepts as *BioPortal* counted them on 2026-08-08. Not SSTIM's current size: submission 14 failed to parse (see below) and nothing has been ingested since, so the portal is several releases behind the 164 classes and 551 concepts the repository now holds | account ✓ (@rfabbri) | re-submit |
| FAIRsharing | ✅ **record [8494](https://fairsharing.org/8494) public and searchable** (verified logged-out 2026-08-17); curated 2026-08-06, DOI still pending | yes | — |
| OLS4 | 🕓 **PR open** — [EBISPOT/ols4#1351](https://github.com/EBISPOT/ols4/pull/1351), one entry in `ebi_ontologies.json` against `dev`, +35/-0. Re-checked 2026-08-18 via `gh`: still open, not draft, **no comments** | yes (GitHub) | watch |
| OpenAIRE | ⛔ after gateway record | yes | deferred |
| DBpedia KG Catalog | 🕓 **submitted** — [issue #46](https://github.com/m1ci/lod-next-gen/issues/46); awaiting the `new-kg` label, which a non-collaborator cannot set, so their validation has not run. Re-checked 2026-08-18 via `gh`: open, **still no labels**, one comment and it is ours | yes (GitHub) | watch |
| Wikidata | ⛔ Phase 4 (after registries stable) | yes | deferred |

---

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

                    Plan on the rating staying frozen regardless. Do not hold a
                    release for it, and do not cite the Archivo stars anywhere
                    until they reflect a crawl of the current graph.
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
External record ID or URL:  none — the suggest form issues no ticket or record id
Status:             SUBMITTED (unverifiable), AND THE QUEUE IS DORMANT.
                    Two separate facts, previously collapsed into "slow":

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
                    2026-05-07**. It is still curating. Our submission of
                    2026-07-10 arrived five days after the most recent insertion,
                    so it is in a moving queue, not an abandoned one, and
                    escalating to the curators is reasonable rather than futile.

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

                    2026-08-17: 1782 snapshots in total, **0** after 2025-11-22.
                    Our submission arrived 7.5 months into that dormancy, so our
                    absence says nothing about our vocabulary's quality and the
                    wait is not a queue position.

                    Catalog absence separately confirmed the same day: 944
                    vocabularies indexed, zero sstim hits, with a SKOS control
                    query returning rows so the endpoint demonstrably sees its
                    own contents. Note the `api/v2/vocabulary/*` endpoints this
                    file used to cite now 404 for *every* query — they are gone,
                    not empty, so a 404 there is no longer evidence of anything.
Required follow-up: **Do not wait, and do not resubmit** — the form only
                    re-acknowledges, and there is no pipeline behind it to
                    re-enter. A curator email is the only remaining path and may
                    go unanswered; send it to `mpoveda@fi.upm.es` first, the
                    institutional address at the group that hosts LOV. The other
                    two contacts on file (py.vandenbussche@gmail.com,
                    ghislain.atemezing@gmail.com) are personal addresses of
                    long-standing project figures and may no longer be current.

                    **Do not present LOV as "pending review" in funding or
                    outreach prose.** Pending implies a queue that is moving.
                    Say submitted, and note the catalog's dormancy if the claim
                    carries any weight. On integration, record the LOV vocab URL.
```

### BARTOC — LIVE (node 21154, since 2026-07-27)

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
                    (2026-07)"; TERM_INDEX.md is at 157 / 284 / 525, so the public
                    record understates SSTIM roughly threefold. Metadata is
                    community-editable (PDDL), so this is a login-and-edit fix.
                    Nothing else on the record is version-pinned: `identifier` is
                    https://w3id.org/sstim, the link is the concept DOI, and the
                    homepage 200s — all age correctly.
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
now passes `--version-iri` on a released line, omits it on a `-dev` line (ADR
0020: a version IRI names an immutable version, and a development line is not
one), and fails if either invariant is broken. The same pass added a guard for an
empty module list, which previously produced a valid, empty bundle rather than an
error.

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
[`static/ontology/README.md`](../../static/ontology/README.md#versioning-and-publication)).

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
External record ID or URL:  https://fairsharing.org/8494 — PUBLIC, and findable
                            by searching "sstim" from a logged-out session
                            (checked in a second browser, 2026-08-17)
Status:             PUBLIC, AWAITING DOI (curator edit 2026-08-06). Completed
                    2026-07-12: taxonomies set to "Not Applicable" → record left
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
                    begun; it asserted neither approval nor a DOI, and the edits
                    themselves are unread (see the two checks below).
Required follow-up: The record is already public; what is still outstanding is
                    only the DOI. Record it when it lands.

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

                    Two things still needing a login: (1) diff the curator's
                    2026-08-06 edits at `https://fairsharing.org/8494?history=show`
                    against the intended values above; (2) the record was
                    submitted at 0.6.0 and the current release is 0.15.0 —
                    confirm no data-process URL pins a stale version. Also note
                    the same-day automated completeness mail listed
                    "Organisation links" as not yet present, which contradicts
                    the BSC Lab maintaining-org entry recorded here; it is more
                    likely counting the deliberately absent funder/collaborator
                    roles, but verify the maintainer link actually saved.
```

### DBpedia KG Catalog — SUBMITTED (2026-08-18)

A new, actively developed DBpedia catalogue (<https://kg-catalog.dbpedia.org/>),
announced on the DBpedia Slack by Milan Dojchinovski (@m1ci) inviting beta
testers. Backed by the GitHub repository `m1ci/lod-next-gen`. Worth being early
in: the maintainer is present and asking for feedback, which is the opposite of
the two dormant catalogues above.

**Ontologies are in scope**, checked before submitting rather than assumed:
domain 8, "Linguistics, Social & Digital Knowledge Systems", reads "Includes
linguistics, **ontologies**, social networks…", and the Computer Science
Ontology is already catalogued as `cso`.

**Two submission routes.** Option 1 is a guided GitHub issue form, recommended
by the guide and validated automatically. Option 2 is a YAML pull request
against `knowledge-graphs/<id>/metadata.yaml`. We used Option 1.

**No Databus publishing is required.** `cso` sets both `moss-publish` and
`databus-publish` to `false` and points its distributions at self-hosted files,
which is what we mirrored — so this submission does not depend on the Databus
that is currently failing for Archivo.

```text
Service:            DBpedia KG Catalog (m1ci/lod-next-gen)
Submitted URL:      https://github.com/m1ci/lod-next-gen/issues/46
Submitted version:  0.15.0 (artifact version id 2026.08.17)
Distribution:       https://labiosyncare.github.io/ontology/0.15.0/sstim-namespace.ttl
                    ttl, 727857 bytes,
                    sha256 838b09a862af283d8a3ace16872f05cb43eb69ee061f3217077e94bc66cc2dfc
                    Verified live and hashed from the served bytes before posting.
Date:               2026-08-18
Account/maintainer: @ttm
Status:             SUBMITTED — **not yet validated.** The issue form declares a
                    `new-kg` label and `validate-new-kg.yml` gates on it, but a
                    non-collaborator cannot set labels through the API, so `gh
                    issue create --label new-kg` silently dropped it. Recorded as
                    a comment on the issue, with an offer to re-submit via the
                    web form or as a PR instead. Submitting through the browser
                    form would have applied the label automatically.
Required follow-up: Watch for the label, the automated validation comment, and
                    the PR their workflow opens. Update the entry to 0.16.0 once
                    that release is cut — the catalogue models versions, so it is
                    a metadata addition rather than a resubmission.

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

### OLS4 (EBI Ontology Lookup Service) — ACTIONABLE NOW

OBO-adjacent browsing without changing SSTIM identifiers. The old note here said
"confirm the current repository and format" and rated this low priority behind
Archivo and LOV. Both of those turned out to be dormant, and this one is not, so
the priority was backwards. Confirmed 2026-08-18:

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

**We already publish the artifact it needs.** OLS ingests one file;
`https://labiosyncare.github.io/ontology/sstim-full.owl` is live, 1160658 bytes,
`application/rdf+xml` — the merged OWL bundle CI generates for BioPortal, which
serves this purpose too. No new build step is required.

Note SSTIM's SKOS layer is a good fit for the `definition_property` and
`synonym_property` fields, which recent entries point at `skos:definition` and
`skos:altLabel`. Our `skos:altLabel` coverage is thin — 15 labels on 8 of the
545 concepts, all English — so the synonym field would be declared and mostly,
not entirely, empty. See `make language-coverage` and the alias note in
`CURRENT_STATE.md`.

```text
Service:            OLS4 (EBI Ontology Lookup Service)
Submitted URL:      https://github.com/EBISPOT/ols4/pull/1351
Submitted version:  0.15.0
Date:               2026-08-18
Account/maintainer: @ttm (fork ttm/ols4, branch add-sstim-ontology)
External record ID or URL:  https://www.ebi.ac.uk/ols4/ontologies/sstim (on merge)
Status:             PR OPEN — one entry appended to ebi_ontologies.json against
                    the dev branch. 35 insertions, 0 deletions, mergeable. Their
                    recent "Add X ontology" PRs merged within days.
Required follow-up: Watch #1351. On merge, confirm the ontology resolves at
                    /ols4/ontologies/sstim and record the URL above.

                    **Bump ontology_purl at every release.** It pins the frozen
                    0.15.0 snapshot deliberately: the unversioned path
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
                    `synonym_property` is declared as skos:altLabel for future
                    use, stated plainly in the PR as currently empty.

                    Verified before opening: the ontology_purl returns 200 as
                    text/turtle, 727857 bytes, parsing to 10437 triples.
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
