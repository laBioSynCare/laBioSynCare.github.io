# DBpedia Archivo Submission — 2026-07-11

**Status:** SSTIM passes all of Archivo's ontology-validation steps. The
submission cannot complete because of a **server-side failure in DBpedia's own
Databus backend**, not any property of the ontology. Retry when Archivo's
infrastructure is healthy.

**Submitted URI:** `https://w3id.org/sstim` (version `0.6.0`)

**Archivo host used:** `https://archivo.tools.dbpedia.org` — the canonical
`https://archivo.dbpedia.org` host is down (HTTP 404 on every path, bare nginx),
so only this `.tools.` instance is reachable.

---

## Outcome

Archivo validated SSTIM successfully and then failed on its own deployment step:

| Step | Result |
|---|---|
| Robot allowance check | ✅ OK |
| Loading + parsing, `application/rdf+xml` | ✅ 707 triples, 0 errors |
| Loading + parsing, `text/turtle` | ✅ 707 triples, 0 errors |
| Loading + parsing, `application/ntriples` | ⚠️ 0 triples, 679 errors (non-critical) |
| Accessing RDF content | ✅ "accessible in 2 formats" |
| Determine non-information resource (ontology ID) | ✅ OK |
| **Deployment to Databus** | ❌ **Failed — "Could not deploy dataset to databus. Reason: Not found"** |

The headline verdict reads "The Ontology has been rejected!", but the rejection
is entirely at the final **Deployment to Databus** step. Every check that
concerns the ontology itself passed.

---

## How Archivo evaluates an ontology (verified from source)

Reading `dbpedia/archivo` (`archivo/crawling/best_effort_crawling.py`,
`archivo/utils/parsing.py`, `archivo/models/content_negotiation.py`):

- Archivo fetches the submitted URI three times with `Accept:`
  `application/rdf+xml`, `text/turtle`, and `application/ntriples`
  (`requests.get(..., allow_redirects=True)`).
- Each response is parsed with **rapper (Raptor)** — `rapper -I <uri> -i <fmt>`
  — keyed to the **requested** format, *not* the response `Content-Type`.
- The ontology is accepted for indexing if **at least one** format yields
  `> 0` triples; otherwise it logs "No RDF content accessible or parseable".

This explains every panel colour and both of our attempts.

### Attempt 1 (before perma-id PR #6337): transient failure

Rejected with "No RDF content accessible or parseable" — meaning *all three*
branches yielded 0 triples, including Turtle. Because the Turtle document is
valid (rapper parses it to 707 triples locally), the only way all three go to
zero is a transient failure to fetch the Turtle at that moment. Not
reproducible; not an ontology defect.

### Attempt 2 (after PR #6337 merged): validation passes

PR #6337 brought real content negotiation live at `w3id.org`
(`Accept: application/rdf+xml` → `sstim-core.rdf`, `application/ld+json` →
`sstim-core.jsonld`, Turtle default). Consequences in the log above:

- **`application/rdf+xml` now green (707 triples):** Archivo receives genuine
  RDF/XML and rapper parses it. Before the merge, this branch got Turtle and
  failed.
- **`text/turtle` green (707 triples):** unchanged; Turtle was always served.
- **`application/ntriples` orange (0 triples, 679 errors):** SSTIM publishes no
  N-Triples serialization and w3id has no N-Triples negotiation rule, so the
  N-Triples request falls through to Turtle, which `rapper -i ntriples` cannot
  parse (`Saw '@', expected subject term` on the `@prefix` lines). This panel is
  explicitly **non-critical** — Archivo needs only one parseable format and it
  has two. Adding N-Triples support is optional (see below).

Archivo therefore reported "RDF content is accessible in 2 formats" and resolved
the ontology ID — full validation success.

---

## The actual blocker: DBpedia Databus deployment

The final step failed server-side:

```
Deployment to Databus
Failed to deploy to the Databus. Reason: Could not deploy dataset to databus.
Reason: 'Not found' …
```

This is a failure inside DBpedia's own storage/deployment backend (the Databus)
on the `.tools.` instance, returning an internal "Not found". It is unrelated to
SSTIM, which had already passed every ontology check. Corroborating evidence
that this host is a degraded stand-in:

- the canonical `archivo.dbpedia.org` host is entirely down (404);
- an anonymous HTTP `POST /add` returns HTTP 500 (the form now requires a
  Flask-WTF CSRF token + session cookie; the plain-curl example printed on the
  page still targets the dead canonical host).

There is nothing to fix on the SSTIM side.

---

## Submission mechanism (for the retry)

The `.tools.` form is CSRF-protected. A working submission:

1. `GET https://archivo.tools.dbpedia.org/add` — keep the session cookie and
   read the `csrf_token` hidden field.
2. `POST` the same URL with that cookie and
   `csrf_token` + `suggestUrl=https://w3id.org/sstim` + `submit=Suggest`.

A bare `curl --data-urlencode "suggestUrl=…"` (no cookie/token) returns HTTP 500.

---

## Actions

1. **Retry** the submission when DBpedia's canonical `archivo.dbpedia.org` host
   returns or the Databus backend recovers. SSTIM already passes validation, so
   a healthy Databus should index it without further change.
2. **If the Databus failure persists,** report it to DBpedia — forum
   (`https://forum.dbpedia.org/`) or a `dbpedia/archivo` GitHub issue — using the
   draft below.
3. **Optional, low priority — N-Triples support.** To turn the one orange panel
   green, publish an `.nt` serialization (extend `make export`) and add an
   `application/ntriples` / `application/n-triples` negotiation rule to the w3id
   `.htaccess` (another perma-id PR). Not required for Archivo acceptance; only
   cosmetic. Weigh against the cost of a second registry PR.

### Draft bug report for DBpedia

> **Subject:** Archivo (`archivo.tools.dbpedia.org`) — validation passes but
> "Deployment to Databus" fails with "Not found"
>
> Submitting `https://w3id.org/sstim` (a w3id-based OWL ontology, CC BY 4.0)
> via the `.tools.` host. All ontology checks pass: robot allowance OK, RDF
> content "accessible in 2 formats" (RDF/XML and Turtle, 707 triples each),
> non-information-resource ID resolved. The submission then fails at
> **Deployment to Databus**: "Could not deploy dataset to databus. Reason:
> 'Not found'". The canonical `archivo.dbpedia.org` host is returning 404 for
> all paths. Is the Databus deployment backend for the `.tools.` instance
> currently available, or should submissions wait for the canonical host to
> return?

---

## Post-merge w3id state (context)

PR #6337 is merged and live. Full route/representation matrix verified
2026-07-11 — every module resolves in Turtle, RDF/XML, JSON-LD, and HTML:

| Route | Turtle | RDF/XML | JSON-LD | HTML |
|---|---|---|---|---|
| `/sstim` | ✅ | ✅ | ✅ | ✅ |
| `/sstim/vocab` | ✅ | ✅ | ✅ | ✅ |
| `/sstim/shapes` | ✅ | ✅ | ✅ | ✅ |
| `/sstim/alignments` | ✅ | ✅ | ✅ | ✅ |
| `/sstim/patch-studio` | ✅ | ✅ | ✅ | ✅ |
| `/sstim/exposure` | ✅ | ✅ | ✅ | ✅ |
| `/sstim/void` | ✅ | ✅ | ✅ | — |

The earlier `/sstim/exposure` and `/sstim/void` 404s are resolved.
