#!/usr/bin/env python3
"""Resolve every external mapping SSTIM asserts, against the source that owns it.

**Not part of `make validate`, for the same reason `verify-registries.py` is not:**
it talks to four third-party services and would fail on their outages rather than
on our defects. Opt in with `make alignment-verify`.

Why it exists. Every external mapping in this ontology is a claim about somebody
else's identifier, and this repository has published three wrong ones:

    wd:Q...        earlier band QIDs resolved to a Van Halen album and a stock
                   exchange (corrected 2026-06)
    mesh:D012910   recorded as Sensory Stimulation; the NLM record is Snake
                   Venoms (rejected 2026-07-10)
    snomed:229070002  recorded as sensory stimulation; it denotes stretching
                   exercises (corrected 2026-08-22, and 226056003 is the term)

All three passed every gate in the repository, because no gate ever dereferenced
a mapping target. Turtle parses, SHACL validates and HermiT reasons over a wrong
QID exactly as happily as over a right one. The identifier is opaque to all of
them and meaningful only to the service that mints it, so the only instrument
that can see this class of defect is the service itself (CLAUDE.md §3.6).

What it checks, per mapping:

  exists        the target resolves at its authority and is not a 404
  live          not obsolete, not deprecated, not a retired descriptor
  kind          the Wikidata item is a concept, not a paper about the concept.
                Searching "transcranial direct current stimulation" returns the
                technique, a 2017 journal article and a clinical trial, in that
                order, and label similarity cannot tell them apart
  provenance    the mapping carries an owl:Axiom with dct:date, so a reader can
                see when it was last checked and against what
  subject       for exactMatch and closeMatch, whether the authority's label and
                SSTIM's share any word at all. This is the check that catches the
                two historical errors above: both D012910 and 229070002 exist and
                are active, so existence alone passes them, while "Snake Venoms"
                and "Stretching exercises" share nothing with "Sensory
                Stimulation". Reported as REVIEW, not as failure: a human decides

Labels are printed side by side for human reading and are never asserted as
agreement: a matching label is not evidence of a matching extension, which is
the KR-09 rule this file exists to serve rather than replace.

SNOMED CT is looked up through tx.fhir.org, which is the working instrument
recorded in `sstim-alignments.ttl` (the IHTSDO browser, BioPortal and Athena all
answer 403). Its display strings are printed to the terminal and written to no
file, because SNOMED content may not be redistributed in a CC BY 4.0 artifact.

INCOMPLETE is not a pass and not a failure. An unreachable authority is an
unreachable instrument, and reporting it as absence is the error this repository
keeps finding.

Usage:
  python3 scripts/verify-alignments.py [--timeout SECONDS] [--offline]
  python3 scripts/verify-alignments.py candidates [--scheme NAME ...] [--json OUT]

`candidates` is a research aid, not a gate: it searches the same four
authorities for concepts that carry no mapping yet and prints what it found, with
the authority's own description, for a human to judge. It asserts nothing and
writes no RDF. Nothing it prints may enter the ontology without the
extension/intension review in PUBLICATION_AND_INTERLINKING_PLAN.md, and
`static/ontology/sstim-alignments.ttl` is protected under CLAUDE.md §3.4.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from urllib.parse import quote
from collections import defaultdict
from pathlib import Path

from rdflib import Graph, URIRef
from rdflib.namespace import DCTERMS, OWL, RDF, SKOS

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "static" / "ontology" / "manifest.json"

SSTIM = "https://w3id.org/sstim"
UA = "sstim-alignment-verify/1.0 (+https://w3id.org/sstim)"

MAPPING_PREDICATES = [
    SKOS.exactMatch,
    SKOS.closeMatch,
    SKOS.broadMatch,
    SKOS.narrowMatch,
    SKOS.relatedMatch,
    OWL.equivalentClass,
    OWL.equivalentProperty,
    OWL.sameAs,
]

# Wikidata items that are *about* a subject rather than being it. A mapping to
# one of these is always wrong, whatever its label says.
WRONG_KIND = {
    "Q13442814": "scholarly article",
    "Q30612": "clinical trial",
    "Q191067": "article",
    "Q482994": "album",
    "Q134556": "single",
    "Q11424": "film",
    "Q571": "book",
    "Q7725634": "literary work",
    "Q3331189": "version, edition or translation",
    "Q4830453": "business",
    "Q891723": "public company",
}

CURL_NOTES = {
    6: "could not resolve host",
    7: "could not connect",
    28: "timed out",
    35: "TLS handshake failed",
    60: "TLS certificate problem (expired or untrusted)",
}


def fetch(url: str, timeout: int, accept: str | None = None) -> tuple[int | None, str, str]:
    """(status, body, note). status None means the instrument could not reach it."""
    if shutil.which("curl") is None:
        return None, "", "curl not installed"
    headers = ["-H", f"User-Agent: {UA}"]
    if accept:
        headers += ["-H", f"Accept: {accept}"]
    result = subprocess.run(
        ["curl", "-sSL", "--max-time", str(timeout), "-w", "\n%{http_code}", *headers, url],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return None, "", CURL_NOTES.get(result.returncode, f"curl exit {result.returncode}")
    body, _, code = result.stdout.rpartition("\n")
    try:
        return int(code.strip()), body, ""
    except ValueError:
        return None, "", "no status from curl"


def fetch_json(url: str, timeout: int, accept: str = "application/json"):
    """(payload, note). payload None means unreachable or unparseable."""
    status, body, note = fetch(url, timeout, accept)
    if status is None:
        return None, note
    if status != 200:
        return None, f"HTTP {status}"
    try:
        return json.loads(body), ""
    except ValueError:
        return None, "response did not parse as JSON"


# ── the graph ───────────────────────────────────────────────────────────────


def load_modules() -> Graph:
    """Every manifest-owned module, because a mapping can be asserted in any of
    them. The manifest is the authoritative inventory (CLAUDE.md §3.4); a
    hand-written file list would silently stop seeing modules added after it."""
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    graph = Graph()
    for module in manifest["modules"]:
        graph.parse(ROOT / module["source"]["path"], format="turtle")
    return graph


def label_of(graph: Graph, subject: URIRef) -> str:
    for predicate in (SKOS.prefLabel, URIRef("http://www.w3.org/2000/01/rdf-schema#label")):
        for value in graph.objects(subject, predicate):
            if getattr(value, "language", None) in (None, "en"):
                return str(value)
    return ""


def collect_mappings(graph: Graph):
    """[(subject, predicate, target)] for every SSTIM term mapped outside SSTIM."""
    mappings = []
    for predicate in MAPPING_PREDICATES:
        for subject, target in graph.subject_objects(predicate):
            if not str(subject).startswith(SSTIM):
                continue
            if not isinstance(target, URIRef) or str(target).startswith(SSTIM):
                continue
            mappings.append((subject, predicate, target))
    return sorted(mappings, key=lambda triple: (str(triple[0]), str(triple[2])))


def collect_provenance(graph: Graph) -> dict[tuple[str, str, str], dict]:
    """The owl:Axiom annotations, keyed by the assertion they are about."""
    provenance = {}
    for axiom in graph.subjects(RDF.type, OWL.Axiom):
        source = graph.value(axiom, OWL.annotatedSource)
        predicate = graph.value(axiom, OWL.annotatedProperty)
        target = graph.value(axiom, OWL.annotatedTarget)
        if source is None or predicate is None or target is None:
            continue
        provenance[(str(source), str(predicate), str(target))] = {
            "date": graph.value(axiom, DCTERMS.date),
            "note": graph.value(axiom, SKOS.editorialNote),
            "by": graph.value(axiom, URIRef("http://www.w3.org/ns/prov#wasAttributedTo")),
        }
    return provenance


# ── the authorities ─────────────────────────────────────────────────────────

WIKIDATA = re.compile(r"^https?://www\.wikidata\.org/entity/(Q\d+)$")
MESH = re.compile(r"^https?://id\.nlm\.nih\.gov/mesh/([A-Z]\d+)$")
OBO = re.compile(r"^https?://purl\.obolibrary\.org/obo/([A-Za-z]+)_(\d+)$")
SNOMED = re.compile(r"^https?://snomed\.info/id/(\d+)$")


def resolve_wikidata(qid: str, timeout: int):
    """(verdict, label, detail). verdict is ok, WRONG, or None for unreachable."""
    url = (
        "https://www.wikidata.org/w/api.php?action=wbgetentities&ids=" + qid +
        "&props=labels|descriptions|claims&languages=en&format=json"
    )
    payload, note = fetch_json(url, timeout)
    if payload is None:
        return None, "", note
    entities = payload.get("entities", {})
    entity = entities.get(qid)
    if entity is None or "missing" in (entity or {}):
        return "WRONG", "", "no such item on Wikidata"
    label = entity.get("labels", {}).get("en", {}).get("value", "")
    description = entity.get("descriptions", {}).get("en", {}).get("value", "")
    kinds = []
    for claim in entity.get("claims", {}).get("P31", []):
        value = claim.get("mainsnak", {}).get("datavalue", {}).get("value", {})
        if isinstance(value, dict) and value.get("id"):
            kinds.append(value["id"])
    for kind in kinds:
        if kind in WRONG_KIND:
            return "WRONG", label, f"is a {WRONG_KIND[kind]} ({kind}), not the subject itself"
    if entity.get("id") != qid:
        return "ok", label, f"redirects to {entity.get('id')}: {description}"
    return "ok", label, description


def resolve_mesh(identifier: str, timeout: int):
    payload, note = fetch_json(
        f"https://id.nlm.nih.gov/mesh/{identifier}.json", timeout
    )
    if payload is None:
        if note.startswith("HTTP 404"):
            return "WRONG", "", "no such descriptor at the NLM"
        return None, "", note
    label = payload.get("label", {})
    label = label.get("@value", "") if isinstance(label, dict) else str(label)
    active = payload.get("http://id.nlm.nih.gov/mesh/vocab#active")
    if active is False:
        return "WRONG", label, "descriptor is not active"
    return "ok", label, str(payload.get("@type", "")).split("#")[-1]


def resolve_obo(prefix: str, number: str, timeout: int):
    iri = f"http://purl.obolibrary.org/obo/{prefix}_{number}"
    payload, note = fetch_json(
        "https://www.ebi.ac.uk/ols4/api/terms?iri=" + iri + "&size=200", timeout
    )
    if payload is None:
        return None, "", note
    terms = payload.get("_embedded", {}).get("terms", [])
    defining = [t for t in terms if (t.get("ontology_prefix") or "").upper() == prefix.upper()]
    if not defining and not terms:
        return "WRONG", "", "no ontology in OLS defines this IRI"
    term = (defining or terms)[0]
    label = term.get("label", "")
    if term.get("is_obsolete"):
        return "WRONG", label, f"obsolete in {term.get('ontology_prefix')}"
    description = (term.get("description") or [""])[0]
    return "ok", label, f"{term.get('ontology_prefix')}: {description}"


def resolve_snomed(code: str, timeout: int):
    """Existence only. Display strings print; they are never written to a file."""
    payload, note = fetch_json(
        "https://tx.fhir.org/r4/CodeSystem/$lookup?system=http://snomed.info/sct&code=" + code,
        timeout,
        "application/fhir+json",
    )
    if payload is None:
        return None, "", note
    if payload.get("resourceType") == "OperationOutcome":
        return "WRONG", "", "not a known SNOMED CT concept on the terminology server"
    display = ""
    inactive = False
    for parameter in payload.get("parameter", []):
        if parameter.get("name") == "display":
            display = parameter.get("valueString", "")
        if parameter.get("name") == "property":
            parts = {p.get("name"): p for p in parameter.get("part", [])}
            if parts.get("code", {}).get("valueCode") == "inactive":
                inactive = bool(parts.get("value", {}).get("valueBoolean"))
    if inactive:
        return "WRONG", display, "concept is inactive in SNOMED CT"
    return "ok", display, "licence: identifier referenced, no content stored"


# The one thing existence checking cannot do. MeSH D012910 exists, is active and
# is a topical descriptor; it is also Snake Venoms, and it sat in this file as
# the mapping for sensory stimulation. So for the two predicates that claim the
# concepts are the same or nearly so, compare the two labels and ask a human to
# look when they share no word at all. Deliberately not applied to related,
# broad and narrow matches: `voiceSymmetry relatedMatch isochronic tones` shares
# no token and is correct, which is what those predicates are for.
STRONG = {str(SKOS.exactMatch), str(SKOS.closeMatch)}
LABEL_NOISE = {"the", "a", "of", "and", "or", "in", "to", "stimulation", "system"}


def label_tokens(text: str) -> set[str]:
    words = re.findall(r"[a-z0-9]+", text.lower())
    return {word.rstrip("s") for word in words if word not in LABEL_NOISE}


def resolve(target: str, timeout: int):
    match = WIKIDATA.match(target)
    if match:
        return ("Wikidata",) + resolve_wikidata(match.group(1), timeout)
    match = MESH.match(target)
    if match:
        return ("MeSH",) + resolve_mesh(match.group(1), timeout)
    match = OBO.match(target)
    if match:
        return ("OBO",) + resolve_obo(match.group(1), match.group(2), timeout)
    match = SNOMED.match(target)
    if match:
        return ("SNOMED CT",) + resolve_snomed(match.group(1), timeout)
    return "unresolvable", None, "", "no authority resolver for this namespace"


# ── verify ──────────────────────────────────────────────────────────────────


def verify(args) -> int:
    graph = load_modules()
    mappings = collect_mappings(graph)
    provenance = collect_provenance(graph)

    passed: list[str] = []
    review: list[str] = []
    incomplete: list[str] = []
    failures: list[str] = []
    resolved: dict[str, tuple] = {}

    for subject, predicate, target in mappings:
        term = str(subject).replace(SSTIM, "sstim").replace("/vocab#", "-v:").replace("#", ":")
        relation = str(predicate).split("#")[-1]
        key = (str(subject), str(predicate), str(target))
        record = provenance.get(key)

        if record is None:
            failures.append(f"{term} {relation} {target} carries no owl:Axiom provenance")
        elif record["date"] is None:
            failures.append(f"{term} {relation} {target} has provenance but no dct:date")

        if args.offline:
            continue

        if str(target) not in resolved:
            resolved[str(target)] = resolve(str(target), args.timeout)
        authority, verdict, label, detail = resolved[str(target)]

        ours = label_of(graph, subject)
        if verdict is None:
            incomplete.append(f"{term} -> {target} unresolved ({authority}: {detail})")
        elif verdict == "WRONG":
            failures.append(f"{term} {relation} {target}: {authority} says {detail}")
        else:
            checked = f", checked {record['date']}" if record and record["date"] else ""
            passed.append(f"{term} {relation} {authority} {label!r} (ours: {ours!r}{checked})")
            if detail:
                passed.append(f"{'':13s}{detail[:100]}")
            if str(predicate) in STRONG and label and ours:
                if not (label_tokens(label) & label_tokens(ours)):
                    review.append(
                        f"{term} {relation} {target}: {authority} calls it {label!r} "
                        f"and SSTIM calls it {ours!r}, sharing no word. Check that "
                        f"the identifier denotes the intended subject"
                    )

    for line in passed:
        print(f"  ok         {line}" if not line.startswith(" ") else f"             {line.strip()}")
    for line in review:
        print(f"  REVIEW     {line}")
    for line in incomplete:
        print(f"  INCOMPLETE {line}")
    for line in failures:
        print(f"  FAILED     {line}")

    print(
        f"\nalignment-verify: {len(mappings)} mappings, {len(failures)} wrong, "
        f"{len(review)} to review, {len(incomplete)} unreachable"
    )
    if incomplete and not failures:
        print("  Unreachable is not absence and does not fail this run (CLAUDE.md §3.6).")
    return 1 if failures else 0


# ── candidates ──────────────────────────────────────────────────────────────


def search_wikidata(text: str, timeout: int):
    payload, _note = fetch_json(
        "https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en"
        "&limit=5&search=" + quote(text),
        timeout,
    )
    if payload is None:
        return []
    return [
        (item["id"], item.get("label", ""), item.get("description", ""))
        for item in payload.get("search", [])
    ]


def search_mesh(text: str, timeout: int):
    payload, _note = fetch_json(
        "https://id.nlm.nih.gov/mesh/lookup/descriptor"
        f"?label={quote(text)}&match=contains&limit=5",
        timeout,
    )
    if payload is None:
        return []
    return [
        (entry["resource"].rsplit("/", 1)[-1], entry.get("label", ""), "")
        for entry in payload
    ]


def search_ols(text: str, ontology: str, timeout: int):
    payload, _note = fetch_json(
        f"https://www.ebi.ac.uk/ols4/api/search?q={quote(text)}&ontology={ontology}&rows=4",
        timeout,
    )
    if payload is None:
        return []
    return [
        (doc.get("obo_id", ""), doc.get("label", ""), (doc.get("description") or [""])[0])
        for doc in payload.get("response", {}).get("docs", [])
    ]


def candidates(args) -> int:
    graph = load_modules()
    mapped = {str(subject) for subject, _p, _t in collect_mappings(graph)}
    vocab = "https://w3id.org/sstim/vocab#"

    report = []
    for scheme_name in args.scheme:
        scheme = URIRef(vocab + scheme_name)
        concepts = sorted(graph.subjects(SKOS.inScheme, scheme), key=str)
        if not concepts:
            print(f"# {scheme_name}: no concepts found in the manifest modules", file=sys.stderr)
            continue
        print(f"\n## {scheme_name} ({len(concepts)} concepts)\n")
        for concept in concepts:
            if str(concept) in mapped and not args.all:
                continue
            name = str(concept).split("#")[-1]
            ours = label_of(graph, concept)
            definition = ""
            for value in graph.objects(concept, SKOS.definition):
                if getattr(value, "language", None) in (None, "en"):
                    definition = str(value)
                    break
            print(f"### {name} — {ours}")
            if definition:
                print(f"    def: {definition[:220]}")
            found = {
                "wikidata": search_wikidata(ours, args.timeout),
                "mesh": search_mesh(ours, args.timeout),
            }
            for ontology in args.ols:
                found[ontology] = search_ols(ours, ontology, args.timeout)
            for source, hits in found.items():
                for identifier, label, description in hits:
                    print(f"    {source:9s} {identifier:16s} {label} | {description[:90]}")
            if not any(found.values()):
                print("    (no candidate found by label search)")
            report.append(
                {"concept": name, "label": ours, "definition": definition, "candidates": found}
            )

    if args.json:
        Path(args.json).write_text(json.dumps(report, indent=2), encoding="utf-8")
        print(f"\nwrote {args.json}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--timeout", type=int, default=30)
    parser.add_argument(
        "--offline", action="store_true",
        help="structural checks only: provenance axioms, no network",
    )
    subparsers = parser.add_subparsers(dest="command")

    verify_parser = subparsers.add_parser("verify", help="check the asserted mappings")
    # SUPPRESS so that a flag given before the subcommand survives: argparse
    # applies subparser defaults over the namespace the top level already filled.
    verify_parser.add_argument("--timeout", type=int, default=argparse.SUPPRESS)
    verify_parser.add_argument(
        "--offline", action="store_true", default=argparse.SUPPRESS,
        help="structural checks only: provenance axioms, no network",
    )

    candidates_parser = subparsers.add_parser(
        "candidates", help="search the authorities for unmapped concepts"
    )
    candidates_parser.add_argument("--timeout", type=int, default=argparse.SUPPRESS)
    candidates_parser.add_argument("--scheme", action="append", default=[])
    candidates_parser.add_argument("--ols", action="append", default=[])
    candidates_parser.add_argument("--json", default="")
    candidates_parser.add_argument(
        "--all", action="store_true", help="include concepts that already carry a mapping"
    )

    args = parser.parse_args()
    if args.command == "candidates":
        if not args.scheme:
            candidates_parser.error("--scheme is required, e.g. --scheme TechniqueScheme")
        return candidates(args)
    return verify(args)


if __name__ == "__main__":
    raise SystemExit(main())
