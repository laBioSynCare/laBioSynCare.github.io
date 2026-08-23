#!/usr/bin/env python3
"""Print the VoID dataset counts for a module set, as JSON.

`void.ttl` declares void:triples, void:classes and void:properties, and the
quality audit recomputes them from the frozen release and fails on a mismatch.
Release preparation has to write those numbers *before* that release exists, so
it computes them from the live modules — which are byte-identical to what the
snapshot will freeze.

This exists so there is one implementation rather than two. N3.js and rdflib do
agree on these counts today — checked against the frozen 0.14.0 release, where
both report 12212 / 156 / 279 — so the reason is not a present discrepancy but
that the audit is the authority and the release should be writing numbers the
authority computed. A near-miss here fails late, on a file that looks
hand-checked, which is the expensive way to find out.

Usage:
  scripts/void-counts.py                 # live modules named by the manifest
  scripts/void-counts.py 0.14.0          # a frozen release directory
"""

import json
from pathlib import Path
import sys

from rdflib import Graph, RDF, OWL, URIRef

ROOT = Path(__file__).resolve().parents[1]
ONTOLOGY = ROOT / "static" / "ontology"


def module_paths(version: str | None) -> list[Path]:
    if version:
        frozen = ONTOLOGY / version
        manifest = json.loads((frozen / "manifest.json").read_text(encoding="utf-8"))
        return [frozen / Path(m["source"]["path"]).name for m in manifest["modules"]]
    manifest = json.loads((ONTOLOGY / "manifest.json").read_text(encoding="utf-8"))
    return [ROOT / m["source"]["path"] for m in manifest["modules"]]


def main() -> int:
    paths = module_paths(sys.argv[1] if len(sys.argv) > 1 else None)
    graph = Graph()
    for path in paths:
        graph.parse(path, format="turtle")

    classes = {s for s in graph.subjects(RDF.type, OWL.Class) if isinstance(s, URIRef)}
    properties = {
        s
        for kind in (OWL.ObjectProperty, OWL.DatatypeProperty, OWL.AnnotationProperty)
        for s in graph.subjects(RDF.type, kind)
        if isinstance(s, URIRef)
    }

    print(json.dumps({
        "modules": len(paths),
        "triples": len(graph),
        "classes": len(classes),
        "properties": len(properties),
    }))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
