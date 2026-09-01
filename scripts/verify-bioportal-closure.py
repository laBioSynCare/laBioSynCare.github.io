#!/usr/bin/env python3
"""Accept only the documented OWL delta from frozen modules to BioPortal.

ROBOT's OWL-aware ``diff`` normalizes RDF list order and symmetric OWL axioms,
which a raw RDF graph comparison cannot do.  The merged registry distribution
may differ from its manifest-selected source closure only by:

* replacing module ``title``, ``description``, and ``created`` annotations with
  the frozen Kernel's values;
* replacing the merge-selected ontology ID with SSTIM's released ontology ID;
* OWLAPI materializing otherwise redundant NamedIndividual and
  AnnotationProperty declarations during RDF/XML output.

Any other removed or added axiom means the proposed distribution is incomplete
or contains content outside the frozen Full semantic profile.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from rdflib import Graph, URIRef


HEADER = re.compile(
    r"^(?P<count>[0-9]+) axioms in (?P<side>left|right) ontology "
    r"but not in (?P<other>left|right) ontology:$"
)
VERSION = re.compile(
    r"^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)$"
)
COLLAPSED_ANNOTATION = re.compile(
    r"^- Annotation\(<http://purl\.org/dc/terms/"
    r"(?:created|description|title)> .+\)$"
)
SERIALIZER_DECLARATION = re.compile(
    r"^\+ Declaration\((?:AnnotationProperty|NamedIndividual)\(<([^<>\s]+)>\)\)$"
)


class ClosureDiffError(RuntimeError):
    """The OWL diff contains more than the publication transform permits."""


def _sections(text: str) -> tuple[list[str], list[str]]:
    sections: dict[str, list[str]] = {"left": [], "right": []}
    expected: dict[str, int] = {}
    current: str | None = None
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        header = HEADER.fullmatch(line)
        if header:
            side = header.group("side")
            other = header.group("other")
            if side == other or side in expected:
                raise ClosureDiffError(f"malformed or duplicate diff header: {line}")
            current = side
            expected[side] = int(header.group("count"))
            continue
        if current is None:
            raise ClosureDiffError(f"axiom appears before a diff header: {line}")
        marker = "- " if current == "left" else "+ "
        if not line.startswith(marker):
            raise ClosureDiffError(f"unexpected {current}-diff line: {line}")
        sections[current].append(line)

    if set(expected) != {"left", "right"}:
        raise ClosureDiffError("ROBOT diff did not report both left and right sections")
    for side in ("left", "right"):
        if len(sections[side]) != expected[side]:
            raise ClosureDiffError(
                f"ROBOT reported {expected[side]} {side}-only axioms but emitted "
                f"{len(sections[side])}"
            )
    return sections["left"], sections["right"]


def _source_iris(source_path: Path) -> set[str]:
    source = Graph()
    try:
        source.parse(source_path, format="turtle")
    except Exception as error:
        raise ClosureDiffError(
            f"{source_path}: cannot parse frozen Turtle source: "
            f"{type(error).__name__}: {error}"
        ) from error
    return {
        str(term)
        for triple in source
        for term in triple
        if isinstance(term, URIRef)
    }


def verify_diff(path: Path, version: str, source_path: Path) -> tuple[int, int]:
    if VERSION.fullmatch(version) is None:
        raise ClosureDiffError(f"release {version!r} is not stable X.Y.Z SemVer")
    try:
        left, right = _sections(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError) as error:
        raise ClosureDiffError(f"{path}: cannot read ROBOT diff: {error}") from error
    allowed_iris = _source_iris(source_path)

    left_ontology_ids = 0
    for axiom in left:
        if COLLAPSED_ANNOTATION.fullmatch(axiom):
            continue
        if axiom.startswith("- OntologyID("):
            left_ontology_ids += 1
            continue
        raise ClosureDiffError(f"frozen source axiom missing from bundle: {axiom}")
    if left_ontology_ids != 1:
        raise ClosureDiffError(
            f"ROBOT diff must replace exactly one source ontology ID, found "
            f"{left_ontology_ids}"
        )

    expected_id = (
        "+ OntologyID(OntologyIRI(<https://w3id.org/sstim>) "
        f"VersionIRI(<https://w3id.org/sstim/{version}>))"
    )
    right_ontology_ids = 0
    for axiom in right:
        declaration = SERIALIZER_DECLARATION.fullmatch(axiom)
        if declaration:
            iri = declaration.group(1)
            if iri not in allowed_iris:
                raise ClosureDiffError(
                    f"serializer declaration names an IRI absent from frozen source: {iri}"
                )
            continue
        if axiom.startswith("+ OntologyID("):
            right_ontology_ids += 1
            if axiom != expected_id:
                raise ClosureDiffError(f"unexpected bundle ontology ID: {axiom}")
            continue
        raise ClosureDiffError(f"bundle adds an axiom outside the frozen source: {axiom}")
    if right_ontology_ids != 1:
        raise ClosureDiffError(
            f"ROBOT diff must add exactly one released ontology ID, found "
            f"{right_ontology_ids}"
        )

    return len(left), len(right)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("diff", type=Path, help="plain ROBOT diff output")
    parser.add_argument("version", help="expected stable release version")
    parser.add_argument(
        "source",
        type=Path,
        help="manifest-verified concatenated frozen Full-profile Turtle source",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        removed, added = verify_diff(args.diff, args.version, args.source)
    except ClosureDiffError as error:
        print(f"verify-bioportal-closure: {error}", file=sys.stderr)
        return 1
    print(
        "verify-bioportal-closure: Full semantic closure preserved; "
        f"accepted {removed} header removals and {added} serializer additions"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
