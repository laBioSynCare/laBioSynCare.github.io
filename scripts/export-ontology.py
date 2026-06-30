#!/usr/bin/env python3
"""export-ontology.py — generate JSON-LD and RDF/XML serializations of the
SSTIM ontology modules from their Turtle masters.

    python3 scripts/export-ontology.py [output_dir]

For each top-level term-space module in static/ontology/*.ttl, this writes a
byte-faithful re-serialization to `<output_dir>/<module>.jsonld` and
`<output_dir>/<module>.rdf` (RDF/XML). Turtle stays the editable master
(README: "JSON-LD is never the master — never edit exported JSON-LD and import
it back"); these exports exist only so the published namespace can content-
negotiate `application/ld+json` and `application/rdf+xml` (PUBLICATION plan B2).

`output_dir` defaults to `dist/ontology`, where the GitHub Pages build already
copies the Turtle files, so the exports sit beside them in the deployed site.
Instances under static/ontology/instances/ are implementation data, not part of
the versioned ontology, so — like `make snapshot` — they are not exported here.

Requires rdflib (provided by the Nix devShell's Python; `pip install rdflib`
otherwise). Turtle remains the source of truth; rerun after any ontology edit.
"""

import sys
from pathlib import Path

try:
    from rdflib import Graph
except ImportError:
    sys.exit(
        "export-ontology: rdflib is required. In the repo devShell run "
        "`nix develop`, or `pip install rdflib`."
    )

REPO_ROOT = Path(__file__).resolve().parent.parent
ONTOLOGY_DIR = REPO_ROOT / "static" / "ontology"

# The reusable ontology artifact = the term-space files only (same list as
# scripts/snapshot-ontology.mjs). Keep these two lists in sync.
ONTOLOGY_FILES = [
    "sstim-core.ttl",
    "sstim-vocab.ttl",
    "sstim-shapes.ttl",
    "sstim-alignments.ttl",
    "sstim-patch-studio.ttl",
    "sstim-exposure.ttl",
]

# rdflib serializer name -> output extension. The flat "xml" writer (not
# "pretty-xml") round-trips RDF collections — owl:unionOf, owl:AllDisjointClasses
# members, skos:hasTopConcept lists — without the pretty serializer's
# list-flattening warnings. These are machine-consumed, so readability is moot.
FORMATS = {"json-ld": "jsonld", "xml": "rdf"}


def main() -> int:
    out_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else REPO_ROOT / "dist" / "ontology"
    out_dir.mkdir(parents=True, exist_ok=True)

    written = 0
    for name in ONTOLOGY_FILES:
        src = ONTOLOGY_DIR / name
        if not src.exists():
            print(f"export-ontology: skip (missing) {src.relative_to(REPO_ROOT)}")
            continue
        graph = Graph()
        graph.parse(src, format="turtle")
        stem = src.stem
        for fmt, ext in FORMATS.items():
            dest = out_dir / f"{stem}.{ext}"
            graph.serialize(destination=str(dest), format=fmt, auto_compact=True)
            written += 1
            print(f"export-ontology: wrote {dest}")
    print(f"export-ontology: {written} file(s) written to {out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
