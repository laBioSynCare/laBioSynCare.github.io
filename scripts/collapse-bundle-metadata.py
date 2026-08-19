#!/usr/bin/env python3
"""Collapse the merged registry bundle's identity metadata to the Kernel's.

`robot merge` unions sixteen module ontology headers onto a single ontology
node, so the bundle a registry ingests ends up asserting sixteen titles, sixteen
descriptions and six creation dates about one ontology. A registry then picks
one of each, arbitrarily, and it picked badly:

  BioPortal showed **Creation date: August 1, 2026** — the day ADR 0043's
  modular split created eight module files — when SSTIM was created 2026-04-12,
  which the Kernel says correctly and which is the date the registry tracker,
  Zenodo and CITATION.cff all use. It also rendered the Description as every
  module blurb joined by commas, which is unreadable and describes no one thing.

The Kernel is the root: `sstim-core.ttl` is the file carrying
`https://w3id.org/sstim` itself, so its title, description and creation date are
the ontology's, and the other fifteen are facts about *modules* that merging
promoted into claims about the whole.

Only these three are collapsed. `dct:requires`, `rdfs:seeAlso`, `dct:hasPart`
and `skos:historyNote` are legitimately many-valued — the release history is
supposed to accumulate — so they are left exactly as ROBOT produced them.
"""

from __future__ import annotations

import sys
from pathlib import Path

from rdflib import Graph, URIRef
from rdflib.namespace import DCTERMS

ROOT_IRI = URIRef("https://w3id.org/sstim")
KERNEL = Path(__file__).resolve().parents[1] / "static" / "ontology" / "sstim-core.ttl"

# Single-valued because they identify the ontology rather than describe a part.
COLLAPSE = (DCTERMS.title, DCTERMS.description, DCTERMS.created)


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: collapse-bundle-metadata.py <bundle.owl>", file=sys.stderr)
        return 2
    bundle = Path(sys.argv[1])

    kernel = Graph()
    kernel.parse(KERNEL, format="turtle")

    graph = Graph()
    graph.parse(bundle)

    collapsed = []
    for predicate in COLLAPSE:
        # The Kernel's *set*, not a single value: the title and description are
        # multilingual, so the ontology legitimately has four titles — one per
        # published language. What it does not have is sixteen, one per module.
        authoritative = list(kernel.objects(ROOT_IRI, predicate))
        if not authoritative:
            print(
                f"collapse-bundle-metadata: the Kernel asserts no {predicate} "
                f"on {ROOT_IRI} — nothing authoritative to collapse to",
                file=sys.stderr,
            )
            return 1
        before = len(list(graph.objects(ROOT_IRI, predicate)))
        graph.remove((ROOT_IRI, predicate, None))
        for value in authoritative:
            graph.add((ROOT_IRI, predicate, value))
        if before > len(authoritative):
            collapsed.append(
                f"{str(predicate).rsplit('/', 1)[-1]} {before}->{len(authoritative)}"
            )

    graph.serialize(destination=bundle, format="xml")
    print(
        "collapse-bundle-metadata: "
        + (", ".join(collapsed) if collapsed else "nothing to collapse")
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
