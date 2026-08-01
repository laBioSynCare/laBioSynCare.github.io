#!/usr/bin/env python3
"""context-roundtrip-check.py — verify the published context.jsonld round-trips
every top-level and instance Turtle document without triple loss.

    python3 scripts/context-roundtrip-check.py

RDF-02 (2026-07-24 RDF structure and publication audit): compacting a graph
with static/ontology/context.jsonld and parsing the result back must be
isomorphic to the source graph. export-ontology.py does not catch this because
it exports the manifest-selected release sources using RDFLib's own generated
compact context, not the context.jsonld consumers actually fetch, and it never
touches void.ttl or the instance documents. This script closes that gap by
using the published context against every top-level document and every
committed instance file.

Requires rdflib (provided by the Nix devShell's Python).
"""

import glob
import json
import sys
from pathlib import Path

try:
    from rdflib import Graph
    from rdflib.compare import isomorphic
except ImportError:
    sys.exit(
        "context-roundtrip-check: rdflib is required. In the repo devShell run "
        "`nix develop`, or `pip install rdflib`."
    )

REPO_ROOT = Path(__file__).resolve().parent.parent
ONTOLOGY_DIR = REPO_ROOT / "static" / "ontology"
CONTEXT_PATH = ONTOLOGY_DIR / "context.jsonld"


def discover_files() -> list[Path]:
    top_level = sorted(ONTOLOGY_DIR.glob("*.ttl"))
    instances = sorted(ONTOLOGY_DIR.glob("instances/**/*.ttl"))
    return top_level + instances


def main() -> int:
    with open(CONTEXT_PATH) as f:
        raw = json.load(f)
    context = raw.get("@context", raw)

    files = discover_files()
    if not files:
        print("context-roundtrip-check: ERROR no Turtle documents found", file=sys.stderr)
        return 1

    failed = []
    for path in files:
        rel = path.relative_to(REPO_ROOT)
        src = Graph()
        src.parse(path, format="turtle")
        compacted = src.serialize(format="json-ld", context=context)
        rt = Graph()
        rt.parse(data=compacted, format="json-ld")
        if isomorphic(src, rt):
            print(f"context-roundtrip-check: OK {rel} ({len(src)} triples)")
        else:
            failed.append((rel, len(src), len(rt)))
            print(
                f"context-roundtrip-check: LOSS {rel} "
                f"(source {len(src)} triples, round-tripped {len(rt)} triples)",
                file=sys.stderr,
            )

    if failed:
        print(
            f"context-roundtrip-check: {len(failed)} of {len(files)} document(s) "
            "did not round-trip isomorphically through context.jsonld",
            file=sys.stderr,
        )
        return 1

    print(f"context-roundtrip-check: passed ({len(files)} documents, published context.jsonld)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
