#!/usr/bin/env python3
"""Every published term must define itself and be addressable by notation.

Directed by the maintainer after the first-pass review found that all 17
`sstim:FrequencyBand` concepts — the most-referenced vocabulary in SSTIM —
carried a `skos:scopeNote` and no `skos:definition`. ADR 0049 rewrote every one
of those scope notes six weeks earlier without noticing, because nothing
checked.

Concepts are the point. The existing gates cover OWL classes and properties well
and SKOS concepts hardly at all, and all 26 gaps were concepts. `pyLODE` and
WIDOCO render `skos:definition` preferentially, so an undefined concept is
published as a blank entry in the reference documentation.

A definition is also held to a floor: it must not merely restate the label, and
it must be long enough to distinguish the term from a sibling. Both bars are low
on purpose — this catches absence and near-absence, not style.

The second half checks `skos:notation` uniqueness, and the rule it enforces is
**per category, not global**. A review first read the 17 cross-category repeats
as defects; they are not. `eye-strain` names a comfort boundary, an effect and a
reported experience, and those are three different things that share a word.
What must never repeat is one notation twice inside one category, because that
is what a consumer resolves against — `preset-contract.py` resolves 45
controlled values by (category, notation) exactly.

So the rule was always per-category and was simply never written down or
checked. It holds today across 77 categories with zero collisions; this keeps it
holding.
"""

from __future__ import annotations

import json
from pathlib import Path
import sys

from rdflib import Graph, RDF, URIRef
from rdflib.namespace import SKOS, RDFS, OWL

ROOT = Path(__file__).resolve().parents[1]
ONTOLOGY = ROOT / "static" / "ontology"
BASE = "https://w3id.org/sstim"

# Short definitions that genuinely need no more words. Each is here because a
# longer one would pad rather than clarify; an entry is a decision, not a waiver.
BREVITY_ALLOWED = {
    "eventPlaybackStart", "eventPlaybackEnd", "eventPause", "eventResume",
    "modelInVitro", "modelInVivo",
}
MIN_DEFINITION = 30


def main() -> int:
    manifest = json.loads((ONTOLOGY / "manifest.json").read_text(encoding="utf-8"))
    modules = manifest["modules"]
    if not modules:
        raise SystemExit("definition-coverage: the manifest listed no modules")

    graph = Graph()
    for module in modules:
        graph.parse(ROOT / module["source"]["path"], format="turtle")

    def ours(term) -> bool:
        return isinstance(term, URIRef) and str(term).startswith(BASE)

    def local(term) -> str:
        text = str(term)
        return text.split("#")[-1] if "#" in text else text.rsplit("/", 1)[-1]

    subjects = {
        "concept": {c for c in graph.subjects(RDF.type, SKOS.Concept) if ours(c)},
        "class": {c for c in graph.subjects(RDF.type, OWL.Class) if ours(c)},
        "property": {
            p
            for t in (OWL.ObjectProperty, OWL.DatatypeProperty)
            for p in graph.subjects(RDF.type, t)
            if ours(p)
        },
    }
    if not subjects["concept"] or not subjects["class"]:
        raise SystemExit(
            "definition-coverage: found no concepts or no classes — the check would "
            "pass vacuously"
        )

    failures: list[str] = []
    checked = 0
    for kind, terms in subjects.items():
        for term in sorted(terms, key=str):
            name = local(term)
            definitions = [str(d).strip() for d in graph.objects(term, SKOS.definition)]
            if not definitions:
                failures.append(
                    f"{kind} {name}: no skos:definition. A scope note is not a "
                    f"definition, and pyLODE publishes this term blank."
                )
                continue
            checked += 1
            best = max(definitions, key=len)
            labels = [
                str(l)
                for predicate in (SKOS.prefLabel, RDFS.label)
                for l in graph.objects(term, predicate)
            ]
            if any(best.rstrip(".").casefold() == l.casefold() for l in labels):
                failures.append(f"{kind} {name}: the definition only restates the label")
            elif len(best) < MIN_DEFINITION and name not in BREVITY_ALLOWED:
                failures.append(
                    f"{kind} {name}: definition is {len(best)} characters "
                    f"({best!r}) — too short to distinguish it from a sibling. Add "
                    f"it to BREVITY_ALLOWED if the brevity is deliberate."
                )

    # ── notation uniqueness, per category ───────────────────────────────────
    from collections import defaultdict

    by_category: dict[URIRef, dict[str, list[str]]] = defaultdict(lambda: defaultdict(list))
    for concept in subjects["concept"]:
        categories = [
            t for t in graph.objects(concept, RDF.type)
            if ours(t) and t != SKOS.Concept
        ]
        for notation in graph.objects(concept, SKOS.notation):
            for category in categories:
                by_category[category][str(notation)].append(local(concept))

    if not by_category:
        raise SystemExit(
            "definition-coverage: no concept carries both a category and a notation — "
            "the uniqueness check would pass vacuously"
        )

    collisions = 0
    for category, notations in by_category.items():
        for notation, names in notations.items():
            if len(names) > 1:
                collisions += 1
                failures.append(
                    f"notation {notation!r} is used by {names} within one category "
                    f"({local(category)}) — a consumer resolving by (category, "
                    f"notation) cannot tell them apart"
                )

    if failures:
        print(f"definition-coverage: FAILED ({len(failures)})", file=sys.stderr)
        for failure in failures:
            print(f"  - {failure}", file=sys.stderr)
        return 1

    print(
        f"definition-coverage: passed ({checked} terms defined, "
        f"{len(by_category)} categories with unique notations — "
        + ", ".join(
            f"{len(v)} " + {"class": "classes", "property": "properties"}.get(k, k + "s")
            for k, v in subjects.items()
        )
        + ")"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
