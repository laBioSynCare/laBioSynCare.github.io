#!/usr/bin/env python3
"""Give every frozen release its JSON-LD and RDF/XML at deploy (GB-09).

    python3 scripts/publish-release-serializations.py [dist-ontology-dir]

A frozen release is published as Turtle only: the build copies
static/ontology/<version>/ into the site, and until 2026-10-06 nothing derived
the other two serializations for it. Only `latest/` had them (ADR 0055), so a
release cited by its version IRI, which CURRENT_STATE advises for published
work, could be fetched in Turtle and nothing else.

For every frozen release this writes the JSON-LD and RDF/XML of the document
its version IRI denotes, beside the Turtle in the deployed site, parses each
back and requires it to be isomorphic with the Turtle, as `export-ontology.py`
does for the live modules. That document is the namespace catalogue for a
modular release and the Kernel file for the twelve before 0.13.0, which predate
the manifest and whose version IRI the w3id rules resolve to that file.

Only that document, not every file in the release. Deriving all 428 files took
51 minutes on 2026-10-06, nearly all of it rdflib proving isomorphism for the
shapes files (535 blank nodes, 21 s per format for 0.18.0 alone, longer for
older releases), on every deploy, for bytes that never change. The version IRI
is what a citation names, and it now answers in all three formats; a single
module of a frozen release stays Turtle, while `latest/` keeps every module in
every format.

It writes into the deployed copy only, never into static/. The decision of
2026-08-29 (TODO.md) not to commit derived exports stands: freezing them would
triple every snapshot with bytes that can be derived. And it finishes by
proving it left every frozen Turtle file byte-identical to its committed
original, since a release that changed under its own version IRI would be
worse than one that answered in one format only.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

try:
    from rdflib import Graph
    from rdflib.compare import isomorphic
except ImportError:
    sys.exit("publish-release-serializations: rdflib is required; run inside `nix develop`.")

REPO_ROOT = Path(__file__).resolve().parent.parent
STATIC_ONTOLOGY = REPO_ROOT / "static" / "ontology"
RELEASE_DIR = re.compile(r"^\d+\.\d+\.\d+$")
# The flat "xml" writer round-trips RDF collections, as export-ontology.py notes.
FORMATS = {"json-ld": "jsonld", "xml": "rdf"}


def frozen_releases(ontology_dir: Path = STATIC_ONTOLOGY) -> list[str]:
    return sorted(
        (entry.name for entry in ontology_dir.iterdir() if entry.is_dir() and RELEASE_DIR.match(entry.name)),
        key=lambda name: tuple(int(part) for part in name.split(".")),
    )


def version_document(release_dir: Path) -> Path:
    """The Turtle a release's version IRI resolves to (scripts/sstim-w3id-snapshot-routes.mjs)."""
    if (release_dir / "manifest.json").is_file():
        return release_dir / "sstim-namespace.ttl"
    return release_dir / "sstim-core.ttl"


def publish(dist_ontology: Path) -> tuple[int, int]:
    """Write and verify the serializations; return (releases, files written)."""
    releases = frozen_releases()
    if not releases:
        raise SystemExit(f"publish-release-serializations: no frozen release under {STATIC_ONTOLOGY}")
    written = 0
    for version in releases:
        target = dist_ontology / version
        if not target.is_dir():
            raise SystemExit(
                f"publish-release-serializations: {target} is missing; the build copies "
                f"static/ontology/{version}/ there, so run this after the build"
            )
        turtle = version_document(target)
        if not turtle.is_file():
            raise SystemExit(f"publish-release-serializations: {turtle} is missing; nothing for {version}'s IRI to serve")
        graph = Graph().parse(turtle, format="turtle")
        for rdf_format, extension in FORMATS.items():
            dest = turtle.with_suffix(f".{extension}")
            graph.serialize(destination=str(dest), format=rdf_format, auto_compact=True)
            if not isomorphic(graph, Graph().parse(dest, format=rdf_format)):
                raise SystemExit(f"publish-release-serializations: {dest} does not round-trip isomorphically")
            written += 1
    return len(releases), written


def verify_frozen_turtle(dist_ontology: Path) -> int:
    """Every frozen Turtle file in the site is byte-identical to the committed one."""
    checked = 0
    for version in frozen_releases():
        for original in sorted((STATIC_ONTOLOGY / version).glob("*.ttl")):
            published = dist_ontology / version / original.name
            if not published.is_file() or published.read_bytes() != original.read_bytes():
                raise SystemExit(
                    f"publish-release-serializations: {published} differs from the frozen "
                    f"{version} release; a version IRI must keep serving the bytes it was cut with"
                )
            checked += 1
    return checked


def main() -> int:
    dist_ontology = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else REPO_ROOT / "dist" / "ontology"
    releases, written = publish(dist_ontology)
    checked = verify_frozen_turtle(dist_ontology)
    print(
        f"publish-release-serializations: {written} JSON-LD and RDF/XML files, one pair per version "
        f"IRI of {releases} frozen releases, each isomorphic with its Turtle; {checked} frozen "
        "Turtle files unchanged"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
