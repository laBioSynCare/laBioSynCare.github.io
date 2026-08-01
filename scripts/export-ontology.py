#!/usr/bin/env python3
"""export-ontology.py — generate JSON-LD and RDF/XML serializations of the
SSTIM ontology modules from their Turtle masters.

    python3 scripts/export-ontology.py [output_dir]

For each manifest-owned module and profile entrypoint, this writes a
graph-faithful re-serialization to `<output_dir>/<module>.jsonld` and
`<output_dir>/<module>.rdf` (RDF/XML), parses it back, and verifies graph
isomorphism with the Turtle source. Turtle stays the editable master
(README: "JSON-LD is never the master — never edit exported JSON-LD and import
it back"); these exports exist only so published resources can content-
negotiate `application/ld+json` and `application/rdf+xml` (PUBLICATION plan B2).

The manifest's exceptional hash-namespace documents are generated as Turtle,
JSON-LD, and RDF/XML aggregates. In particular, `/sstim` describes every
`https://w3id.org/sstim#` term even though ownership is split across modules,
and `/sstim/exposure` still describes the moved `exposure#StimulusChannel`.
These are dereferencing catalogs, not additional term-owning source modules.

`output_dir` defaults to `dist/ontology`, where the GitHub Pages build already
copies the Turtle files, so the exports sit beside them in the deployed site.
Instances under static/ontology/instances/ are implementation data, not part of
the versioned ontology, so — like `make snapshot` — they are not exported here.

Requires rdflib (provided by the Nix devShell's Python; `pip install rdflib`
otherwise). Turtle remains the source of truth; rerun after any ontology edit.
"""

import json
import sys
from pathlib import Path

try:
    from rdflib import Graph
    from rdflib.compare import isomorphic
except ImportError:
    sys.exit(
        "export-ontology: rdflib is required. In the repo devShell run "
        "`nix develop`, or `pip install rdflib`."
    )

REPO_ROOT = Path(__file__).resolve().parent.parent
ONTOLOGY_DIR = REPO_ROOT / "static" / "ontology"

MANIFEST_PATH = ONTOLOGY_DIR / "manifest.json"


def export_sources() -> list[Path]:
    """Return every manifest-declared export source, in manifest order."""
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    sources = [
        REPO_ROOT / module["source"]["path"]
        for module in manifest["modules"]
        if module["release"]["export"]
    ]
    for profile in manifest["profiles"]:
        source = profile.get("source")
        release = profile.get("release", {})
        if source and release.get("export"):
            sources.append(REPO_ROOT / source["path"])
    return sources


def load_manifest() -> dict:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

# rdflib serializer name -> output extension. The flat "xml" writer (not
# "pretty-xml") round-trips RDF collections — owl:unionOf, owl:AllDisjointClasses
# members, skos:hasTopConcept lists — without the pretty serializer's
# list-flattening warnings. These are machine-consumed, so readability is moot.
FORMATS = {"json-ld": "jsonld", "xml": "rdf"}


def serialize_and_verify(
    graph: Graph,
    dest: Path,
    rdf_format: str,
    *,
    source_text: str | None = None,
) -> bool:
    if source_text is None:
        graph.serialize(destination=str(dest), format=rdf_format, auto_compact=True)
    else:
        # RDFLib's Turtle serializer canonicalizes integer-looking xsd:decimal
        # lexical forms ("20" -> "20.0"). Concatenating the valid Turtle
        # masters preserves exact RDF terms while still producing one graph.
        dest.write_text(source_text, encoding="utf-8")
    round_trip = Graph()
    round_trip.parse(dest, format=rdf_format)
    if not isomorphic(graph, round_trip):
        print(
            f"export-ontology: ERROR {dest} does not round-trip isomorphically",
            file=sys.stderr,
        )
        return False
    print(f"export-ontology: wrote and verified {dest}")
    return True


def main() -> int:
    out_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else REPO_ROOT / "dist" / "ontology"
    out_dir.mkdir(parents=True, exist_ok=True)

    written = 0
    for src in export_sources():
        if not src.exists():
            print(
                f"export-ontology: ERROR missing manifest source {src.relative_to(REPO_ROOT)}",
                file=sys.stderr,
            )
            return 1
        graph = Graph()
        graph.parse(src, format="turtle")
        stem = src.stem
        for fmt, ext in FORMATS.items():
            dest = out_dir / f"{stem}.{ext}"
            if not serialize_and_verify(graph, dest, fmt):
                print(
                    f"export-ontology: source was {src.relative_to(REPO_ROOT)}",
                    file=sys.stderr,
                )
                return 1
            written += 1

    manifest = load_manifest()
    module_by_id = {module["id"]: module for module in manifest["modules"]}
    for namespace_document in manifest["namespaceDocuments"]:
        graph = Graph()
        source_paths: list[Path] = []
        for module_id in namespace_document["modules"]:
            module = module_by_id.get(module_id)
            if module is None:
                print(
                    f"export-ontology: ERROR namespace document "
                    f"{namespace_document['id']} names unknown module {module_id}",
                    file=sys.stderr,
                )
                return 1
            source_path = REPO_ROOT / module["source"]["path"]
            source_paths.append(source_path)
            graph.parse(source_path, format="turtle")

        runtime = namespace_document["runtime"]
        outputs = (
            (runtime["turtleUrl"], "turtle"),
            (runtime["jsonLdUrl"], "json-ld"),
            (runtime["rdfXmlUrl"], "xml"),
        )
        for runtime_url, rdf_format in outputs:
            dest = out_dir / Path(runtime_url).name
            source_text = None
            if rdf_format == "turtle":
                source_text = "\n".join(
                    path.read_text(encoding="utf-8") for path in source_paths
                )
            if not serialize_and_verify(
                graph,
                dest,
                rdf_format,
                source_text=source_text,
            ):
                print(
                    f"export-ontology: generated namespace document was "
                    f"{namespace_document['id']}",
                    file=sys.stderr,
                )
                return 1
            written += 1
    print(f"export-ontology: {written} file(s) written to {out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
