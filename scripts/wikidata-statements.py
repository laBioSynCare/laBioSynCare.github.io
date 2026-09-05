#!/usr/bin/env python3
"""Emit and measure the statements that make Wikidata point back at SSTIM.

Every external mapping this repository publishes points outward. Nothing on
Wikidata references an SSTIM IRI, so a reader who arrives at `alpha wave` or
`vagus nerve stimulation` has no path to the vocabulary that maps to it, and no
reconciliation tool can find SSTIM from the identifier it already holds. The
inbound direction is the half that makes the outbound half discoverable.

Three modes:

  item        the QuickStatements block that creates the Wikidata item for the
              ontology, with every value read from sstim-core.ttl, void.ttl and
              the manifest rather than typed here
  statements  the reciprocal P2888 statements, one per Wikidata target this
              ontology maps, derived from sstim-alignments.ttl
  inbound     ask Wikidata which of those statements exist today. This is the
              measurement, and it is what says whether a batch actually landed

Nothing here edits Wikidata. The output is pasted into
https://quickstatements.toolforge.org by a signed-in human, because
`WIKIDATA_CONTRIBUTION.md` requires edits to run under the named account with
its conflict-of-interest disclosure, and because an unattributed bot-shaped
batch is how a well-meant contribution gets reverted.

**Direction is inverted on purpose.** `sstim-v:techRepetitiveTMS skos:broadMatch
wd:Q263962` says the Wikidata concept is the broader one. Written on the
Wikidata item, the same fact reads the other way round: the SSTIM concept is
narrower, so the qualifier is `narrow match`. Getting this backwards would
publish a false claim in a place SSTIM does not control.

Usage:
  python3 scripts/wikidata-statements.py item
  python3 scripts/wikidata-statements.py statements [--stated-in Q...] [--include-related]
  python3 scripts/wikidata-statements.py inbound [--timeout SECONDS]
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
from datetime import date
from pathlib import Path

from rdflib import Graph, URIRef
from rdflib.namespace import DCTERMS, SKOS

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "static" / "ontology" / "manifest.json"
CORE = ROOT / "static" / "ontology" / "sstim-core.ttl"
VOID = ROOT / "static" / "ontology" / "void.ttl"

UA = "sstim-wikidata-statements/1.0 (+https://w3id.org/sstim)"
WIKIDATA_ENTITY = re.compile(r"^https?://www\.wikidata\.org/entity/(Q\d+)$")

# P4390 mapping relation types, verified against live Wikidata 2026-09-05.
RELATION = {
    "exactMatch": "Q39893449",
    "closeMatch": "Q39893184",
    "broadMatch": "Q39894595",
    "narrowMatch": "Q39893967",
    "relatedMatch": "Q39894604",
}

# Read from the SSTIM side, written on the Wikidata side, so containment flips.
INVERT = {"broadMatch": "narrowMatch", "narrowMatch": "broadMatch"}

MAPPING_PREDICATES = [
    SKOS.exactMatch,
    SKOS.closeMatch,
    SKOS.broadMatch,
    SKOS.narrowMatch,
    SKOS.relatedMatch,
]


def load_modules() -> Graph:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    graph = Graph()
    for module in manifest["modules"]:
        graph.parse(ROOT / module["source"]["path"], format="turtle")
    return graph


def wikidata_mappings(graph: Graph, include_related: bool):
    """[(qid, relation-as-seen-from-Wikidata, sstim iri)], sorted and deduped."""
    rows = []
    for predicate in MAPPING_PREDICATES:
        name = str(predicate).split("#")[-1]
        if name == "relatedMatch" and not include_related:
            continue
        for subject, target in graph.subject_objects(predicate):
            match = WIKIDATA_ENTITY.match(str(target))
            if not match or not str(subject).startswith("https://w3id.org/sstim"):
                continue
            rows.append((match.group(1), INVERT.get(name, name), str(subject)))
    return sorted(set(rows))


def fetch(url: str, timeout: int, accept: str = "application/json"):
    if shutil.which("curl") is None:
        return None
    result = subprocess.run(
        ["curl", "-sSL", "--max-time", str(timeout), "-H", f"User-Agent: {UA}",
         "-H", f"Accept: {accept}", url],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        return None
    try:
        return json.loads(result.stdout)
    except ValueError:
        return None


# ── mode: item ──────────────────────────────────────────────────────────────


def ontology_metadata() -> dict:
    """Title, dates, licence and DOIs, read from the ontology, never typed here."""
    core = Graph().parse(CORE, format="turtle")
    void = Graph().parse(VOID, format="turtle")
    subject = URIRef("https://w3id.org/sstim")
    title = next(
        (str(value) for value in core.objects(subject, DCTERMS.title)
         if getattr(value, "language", None) == "en"), "",
    )
    created = next((str(value) for value in core.objects(subject, DCTERMS.created)), "")
    dataset = URIRef("https://w3id.org/sstim/void")
    version_doi = next(
        (str(value) for value in void.objects(dataset, DCTERMS.hasVersion)), "",
    )
    return {"title": title, "created": created, "version_doi": version_doi}


CONCEPT_DOI = "10.5281/zenodo.21286974"


def emit_item(_args) -> int:
    meta = ontology_metadata()
    created = meta["created"] or "2026-04-12"
    print("# QuickStatements v1. Paste into https://quickstatements.toolforge.org")
    print("# Signed in as the named account, with the conflict-of-interest")
    print("# disclosure already on the user page (WIKIDATA_CONTRIBUTION.md stage 1).")
    print("# Every URL below was resolved before this block was written.")
    print("CREATE")
    print('LAST\tLen\t"SSTIM"')
    print('LAST\tDen\t"ontology for describing sensory stimulation"')
    print(f'LAST\tAen\t"{meta["title"]}"')
    print('LAST\tAen\t"Sensory Stimulation Ontology"')
    print("LAST\tP31\tQ324254")                                   # instance of: ontology
    print('LAST\tP856\t"https://w3id.org/sstim"')                 # official website
    print('LAST\tP1324\t"https://github.com/w3c-cg/sstim"')       # source code repository
    print('LAST\tP973\t"https://w3c-cg.github.io/sstim/ontology/docs/"')  # described at URL
    print("LAST\tP275\tQ20007257")                                # licence: CC BY 4.0
    print("LAST\tP407\tQ1860")                                    # language: English
    print(f'LAST\tP356\t"{CONCEPT_DOI.upper()}"')                 # DOI: the concept DOI
    print(f"LAST\tP571\t+{created}T00:00:00Z/11")                 # inception
    print()
    print("# Not asserted here, and why:")
    print("#   P170 creator needs an item for the person; an ORCID alone is not one.")
    print(f"#   The version DOI ({meta['version_doi'] or 'unknown'}) identifies one release;")
    print("#   the concept DOI above identifies the continuing project, which is what")
    print("#   an item about the ontology should carry.")
    return 0


# ── mode: statements ────────────────────────────────────────────────────────


def emit_statements(args) -> int:
    graph = load_modules()
    rows = wikidata_mappings(graph, args.include_related)
    today = date.today().isoformat()
    print("# QuickStatements v1. Paste into https://quickstatements.toolforge.org")
    print(f"# {len(rows)} reciprocal statements, derived from sstim-alignments.ttl.")
    print("# P2888 is the mapping property; P4390 says which SKOS relation it is,")
    print("# read from the Wikidata side, so broad and narrow are inverted.")
    if not args.stated_in:
        print("# No --stated-in given, so the reference is the resolving SSTIM IRI alone.")
        print("# Re-run with --stated-in Q... once the ontology item exists.")
    for qid, relation, iri in rows:
        line = f'{qid}\tP2888\t"{iri}"\tP4390\t{RELATION[relation]}'
        if args.stated_in:
            line += f"\tS248\t{args.stated_in}"
        # The reference is the namespace document the term is defined in, not the
        # term IRI again: a claim whose only support is its own value is no support.
        line += f'\tS854\t"{iri.split("#")[0]}"\tS813\t+{today}T00:00:00Z/11'
        print(line)
    if not args.include_related:
        related = [
            row for row in wikidata_mappings(graph, True)
            if row not in set(rows)
        ]
        print()
        print(f"# {len(related)} relatedMatch rows are held back by default. P2888 is")
        print("# named 'exact match', and qualifying it as a related match is the")
        print("# weakest reading the community accepts. Add --include-related to emit")
        print("# them once that call is made:")
        for qid, _relation, iri in related:
            print(f"#   {qid} <- {iri}")
    return 0


# ── mode: inbound ───────────────────────────────────────────────────────────


def measure_inbound(args) -> int:
    """Which of the reciprocal statements exist on Wikidata right now.

    Absence here is a real absence only because the instrument is precise: it
    reads the claims of the exact items SSTIM maps, rather than searching for a
    string across Wikidata. An unreachable API is reported as unreachable.
    """
    graph = load_modules()
    rows = wikidata_mappings(graph, include_related=True)
    qids = sorted({qid for qid, _relation, _iri in rows})
    found: dict[str, list[str]] = {}
    unreachable = []
    for chunk_start in range(0, len(qids), 40):
        chunk = qids[chunk_start:chunk_start + 40]
        payload = fetch(
            "https://www.wikidata.org/w/api.php?action=wbgetentities&format=json"
            "&props=claims&ids=" + "|".join(chunk),
            args.timeout,
        )
        if payload is None:
            unreachable.extend(chunk)
            continue
        for qid, entity in payload.get("entities", {}).items():
            values = []
            for prop in ("P2888", "P1709", "P1628"):
                for claim in entity.get("claims", {}).get(prop, []):
                    value = claim.get("mainsnak", {}).get("datavalue", {}).get("value")
                    if isinstance(value, str) and "w3id.org/sstim" in value:
                        values.append(f"{prop} {value}")
            found[qid] = values

    linked = [qid for qid, values in found.items() if values]
    for qid, _relation, iri in rows:
        state = "linked back" if found.get(qid) else "no SSTIM statement"
        print(f"  {qid:12s} {state:20s} {iri}")
    for qid in unreachable:
        print(f"  {qid:12s} INCOMPLETE           Wikidata unreachable")
    print(
        f"\nwikidata-inbound: {len(linked)} of {len(qids)} mapped items reference an "
        f"SSTIM IRI, {len(unreachable)} unreachable"
    )
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("item", help="QuickStatements block creating the ontology item")
    statements = subparsers.add_parser("statements", help="reciprocal P2888 statements")
    statements.add_argument("--stated-in", default="", help="QID of the SSTIM item, once it exists")
    statements.add_argument("--include-related", action="store_true")
    inbound = subparsers.add_parser("inbound", help="measure what Wikidata references today")
    inbound.add_argument("--timeout", type=int, default=30)
    args = parser.parse_args()
    return {"item": emit_item, "statements": emit_statements, "inbound": measure_inbound}[
        args.command
    ](args)


if __name__ == "__main__":
    raise SystemExit(main())
