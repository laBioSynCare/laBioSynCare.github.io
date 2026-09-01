#!/usr/bin/env python3
"""Collapse merged BioPortal metadata without reserializing the RDF graph.

ROBOT's merge is deterministic, but it promotes every module ontology header
onto the one root ontology node. BioPortal then sees many titles, descriptions,
and creation dates for SSTIM and chooses among them arbitrarily. The first
implementation fixed the metadata by parsing the whole bundle into an RDFLib
Graph and serializing it again. RDFLib assigns fresh blank-node identifiers and
does not promise statement order, so two builds of the same frozen release had
different bytes. BioPortal compares raw-file MD5 values and archived every such
build as another submission.

This implementation uses RDFLib only to read and verify RDF. It edits ROBOT's
generated XML tree structurally, preserving existing node identifiers and
element order, and inserts a sorted metadata set from the selected *frozen*
Kernel. Identical ROBOT input is therefore byte-identical after this pass too.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import tempfile
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path

from rdflib import Graph, Literal, URIRef
from rdflib.compare import to_canonical_graph
from rdflib.namespace import DCTERMS, OWL, RDF, XSD


ROOT_IRI = URIRef("https://w3id.org/sstim")
RDF_NS = str(RDF)
OWL_NS = str(OWL)
DCTERMS_NS = str(DCTERMS)
XML_NS = "http://www.w3.org/XML/1998/namespace"
SHA256_PATTERN = re.compile(r"^[0-9a-f]{64}$")
STABLE_VERSION_PATTERN = re.compile(
    r"^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)$"
)
LEDGER_RECORD_FIELDS = {
    "sha256",
    "canonicalGraphSha256",
    "sourceClosureSha256",
    "bytes",
    "triples",
}

# These identify the ontology as a whole. Other merged annotations such as
# dct:requires, dct:hasPart, rdfs:seeAlso, and skos:historyNote are legitimately
# many-valued and must remain untouched.
COLLAPSE = (DCTERMS.created, DCTERMS.description, DCTERMS.title)
ELEMENT_FOR = {
    predicate: f"{{{DCTERMS_NS}}}{str(predicate).rsplit('/', 1)[-1]}"
    for predicate in COLLAPSE
}


class BundleMetadataError(RuntimeError):
    """The generated bundle or selected Kernel violates the publication contract."""


@dataclass(frozen=True)
class BundleIntegrity:
    """Byte and graph identity for one immutable registry artifact."""

    version: str
    sha256: str
    canonical_graph_sha256: str
    source_closure_sha256: str
    byte_count: int
    triple_count: int

    def ledger_record(self) -> dict[str, str | int]:
        return {
            "sha256": self.sha256,
            "canonicalGraphSha256": self.canonical_graph_sha256,
            "sourceClosureSha256": self.source_closure_sha256,
            "bytes": self.byte_count,
            "triples": self.triple_count,
        }


def _literal_sort_key(value: Literal) -> tuple[str, str, str]:
    return (value.language or "", str(value.datatype or ""), str(value))


def _canonical_graph_sha256(graph: Graph) -> str:
    """Hash sorted canonical N-Triples, independent of RDF/XML presentation."""

    canonical = to_canonical_graph(graph)
    lines = sorted(
        f"{subject.n3()} {predicate.n3()} {object_.n3()} .\n"
        for subject, predicate, object_ in canonical
    )
    digest = hashlib.sha256()
    for line in lines:
        digest.update(line.encode("utf-8"))
    return digest.hexdigest()


def _strict_object(pairs: list[tuple[str, object]]) -> dict[str, object]:
    result: dict[str, object] = {}
    for key, value in pairs:
        if key in result:
            raise BundleMetadataError(f"duplicate JSON key {key!r}")
        result[key] = value
    return result


def _ledger_releases(ledger_path: Path) -> dict[str, object]:
    try:
        ledger = json.loads(
            ledger_path.read_text(encoding="utf-8"), object_pairs_hook=_strict_object
        )
    except (json.JSONDecodeError, UnicodeError) as error:
        raise BundleMetadataError(f"{ledger_path}: invalid strict JSON: {error}") from error

    if not isinstance(ledger, dict):
        raise BundleMetadataError(f"{ledger_path}: expected a JSON object")
    if type(ledger.get("schemaVersion")) is not int or ledger["schemaVersion"] != 1:
        raise BundleMetadataError(
            f"{ledger_path}: expected integer integrity-ledger schemaVersion 1"
        )
    releases = ledger.get("releases")
    if not isinstance(releases, dict):
        raise BundleMetadataError(f"{ledger_path}: releases must be an object")
    return releases


def _ledger_record(ledger_path: Path, version: str) -> dict[str, str | int]:
    """Load and validate one immutable release record from the integrity ledger."""

    releases = _ledger_releases(ledger_path)
    if version not in releases:
        raise BundleMetadataError(
            f"{ledger_path}: no immutable BioPortal artifact record for release "
            f"{version}; generate and review a --propose-ledger-entry result"
        )
    record = releases[version]
    if not isinstance(record, dict):
        raise BundleMetadataError(
            f"{ledger_path}: release {version} integrity record must be an object"
        )
    if set(record) != LEDGER_RECORD_FIELDS:
        raise BundleMetadataError(
            f"{ledger_path}: release {version} must contain exactly "
            f"{sorted(LEDGER_RECORD_FIELDS)}"
        )

    for field in ("sha256", "canonicalGraphSha256", "sourceClosureSha256"):
        value = record.get(field)
        if not isinstance(value, str) or SHA256_PATTERN.fullmatch(value) is None:
            raise BundleMetadataError(
                f"{ledger_path}: release {version} {field} must be 64 lowercase "
                "hexadecimal characters"
            )
    for field in ("bytes", "triples"):
        value = record.get(field)
        if type(value) is not int or value <= 0:
            raise BundleMetadataError(
                f"{ledger_path}: release {version} {field} must be a positive integer"
            )
    return record


def _assert_release_is_new(ledger_path: Path, version: str) -> None:
    if version in _ledger_releases(ledger_path):
        raise BundleMetadataError(
            f"{ledger_path}: release {version} already has an immutable record; "
            "refusing to propose a replacement"
        )


def _verify_integrity(
    integrity: BundleIntegrity,
    ledger_path: Path,
) -> None:
    expected = _ledger_record(ledger_path, integrity.version)
    mismatches = []
    if integrity.sha256 != expected["sha256"]:
        mismatches.append(
            f"byte SHA-256 {integrity.sha256} != {expected['sha256']}"
        )
    if integrity.canonical_graph_sha256 != expected["canonicalGraphSha256"]:
        mismatches.append(
            "canonical graph SHA-256 "
            f"{integrity.canonical_graph_sha256} != "
            f"{expected['canonicalGraphSha256']}"
        )
    if integrity.source_closure_sha256 != expected["sourceClosureSha256"]:
        mismatches.append(
            "source closure SHA-256 "
            f"{integrity.source_closure_sha256} != "
            f"{expected['sourceClosureSha256']}"
        )
    if integrity.byte_count != expected["bytes"]:
        mismatches.append(
            f"byte count {integrity.byte_count} != {expected['bytes']}"
        )
    if integrity.triple_count != expected["triples"]:
        mismatches.append(
            f"triple count {integrity.triple_count} != {expected['triples']}"
        )
    if mismatches:
        raise BundleMetadataError(
            f"release {integrity.version} differs from immutable BioPortal ledger "
            f"{ledger_path}: " + "; ".join(mismatches)
        )


def _parse_graph(path: Path, *, format: str) -> Graph:
    graph = Graph()
    try:
        graph.parse(path, format=format)
    except Exception as error:
        raise BundleMetadataError(
            f"{path}: cannot parse {format}: {type(error).__name__}: {error}"
        ) from error
    return graph


def authoritative_metadata(kernel_path: Path) -> dict[URIRef, tuple[Literal, ...]]:
    """Return the frozen Kernel's deterministic metadata set."""

    kernel = _parse_graph(kernel_path, format="turtle")
    if (ROOT_IRI, RDF.type, OWL.Ontology) not in kernel:
        raise BundleMetadataError(
            f"{kernel_path}: {ROOT_IRI} is not declared as owl:Ontology"
        )

    result: dict[URIRef, tuple[Literal, ...]] = {}
    for predicate in COLLAPSE:
        values = tuple(kernel.objects(ROOT_IRI, predicate))
        if not values:
            raise BundleMetadataError(
                f"{kernel_path}: the frozen Kernel asserts no {predicate} on {ROOT_IRI}"
            )
        if any(not isinstance(value, Literal) for value in values):
            raise BundleMetadataError(
                f"{kernel_path}: {predicate} must contain literals only"
            )
        unique = tuple(sorted(set(values), key=_literal_sort_key))
        if any(not str(value).strip() for value in unique):
            raise BundleMetadataError(
                f"{kernel_path}: {predicate} must not contain empty literals"
            )
        result[predicate] = unique

    created = result[DCTERMS.created]
    if (
        len(created) != 1
        or created[0].datatype != XSD.date
        or created[0].language is not None
        or created[0].ill_typed is True
    ):
        raise BundleMetadataError(
            f"{kernel_path}: dct:created must contain exactly one xsd:date literal"
        )
    for predicate in (DCTERMS.description, DCTERMS.title):
        slots = [(value.language or "", str(value.datatype or "")) for value in result[predicate]]
        if len(slots) != len(set(slots)):
            raise BundleMetadataError(
                f"{kernel_path}: {predicate} repeats a language/datatype slot"
            )
    return result


def _register_input_namespaces(bundle_path: Path) -> None:
    """Retain ROBOT's readable prefixes when ElementTree writes the document."""

    seen: dict[str, str] = {}
    for _, (prefix, namespace) in ET.iterparse(bundle_path, events=("start-ns",)):
        # ElementTree reserves xml and already knows its normative binding.
        if prefix == "xml":
            continue
        previous = seen.get(prefix)
        if previous is not None and previous != namespace:
            raise BundleMetadataError(
                f"{bundle_path}: namespace prefix {prefix!r} has conflicting bindings"
            )
        if previous is None:
            ET.register_namespace(prefix, namespace)
            seen[prefix] = namespace


def _root_ontology(xml_root: ET.Element, bundle_path: Path) -> ET.Element:
    about = f"{{{RDF_NS}}}about"
    matches = [
        element
        for element in xml_root.findall(f"{{{OWL_NS}}}Ontology")
        if element.get(about) == str(ROOT_IRI)
    ]
    if len(matches) != 1:
        raise BundleMetadataError(
            f"{bundle_path}: expected exactly one root owl:Ontology element for "
            f"{ROOT_IRI}, found {len(matches)}"
        )
    return matches[0]


def collapse_metadata(
    bundle_path: Path,
    metadata: dict[URIRef, tuple[Literal, ...]],
) -> list[str]:
    """Replace only root identity annotations, then atomically rewrite the XML."""

    _register_input_namespaces(bundle_path)
    parser = ET.XMLParser(target=ET.TreeBuilder(insert_comments=True))
    tree = ET.parse(bundle_path, parser=parser)
    ontology = _root_ontology(tree.getroot(), bundle_path)

    target_tags = set(ELEMENT_FOR.values())
    children = list(ontology)
    target_indices = [
        index for index, element in enumerate(children) if element.tag in target_tags
    ]
    if not target_indices:
        raise BundleMetadataError(
            f"{bundle_path}: root ontology carries none of the metadata to collapse"
        )

    before = {
        predicate: sum(element.tag == ELEMENT_FOR[predicate] for element in children)
        for predicate in COLLAPSE
    }
    first_index = min(target_indices)
    child_tail = children[first_index].tail or "\n        "

    for element in children:
        if element.tag in target_tags:
            ontology.remove(element)

    insertion_index = first_index
    for predicate in COLLAPSE:
        for value in metadata[predicate]:
            element = ET.Element(ELEMENT_FOR[predicate])
            if value.language:
                element.set(f"{{{XML_NS}}}lang", value.language)
            if value.datatype:
                element.set(f"{{{RDF_NS}}}datatype", str(value.datatype))
            element.text = str(value)
            element.tail = child_tail
            ontology.insert(insertion_index, element)
            insertion_index += 1

    output = (
        ET.tostring(
            tree.getroot(),
            encoding="utf-8",
            xml_declaration=True,
            short_empty_elements=True,
        )
        + b"\n"
    )

    original_mode = bundle_path.stat().st_mode & 0o777
    temporary_name: str | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="wb",
            dir=bundle_path.parent,
            prefix=f".{bundle_path.name}.",
            delete=False,
        ) as temporary:
            temporary.write(output)
            temporary.flush()
            os.fchmod(temporary.fileno(), original_mode)
            os.fsync(temporary.fileno())
            temporary_name = temporary.name
        os.replace(temporary_name, bundle_path)
        temporary_name = None
    finally:
        if temporary_name is not None:
            Path(temporary_name).unlink(missing_ok=True)

    collapsed = []
    for predicate in COLLAPSE:
        after = len(metadata[predicate])
        if before[predicate] != after:
            collapsed.append(
                f"{str(predicate).rsplit('/', 1)[-1]} {before[predicate]}->{after}"
            )
    return collapsed


def verify_bundle(
    bundle_path: Path,
    kernel_path: Path,
    source_closure_sha256: str,
    metadata: dict[URIRef, tuple[Literal, ...]] | None = None,
    ledger_path: Path | None = None,
) -> BundleIntegrity:
    """Verify metadata and immutable byte/graph identity for a registry bundle."""

    if SHA256_PATTERN.fullmatch(source_closure_sha256) is None:
        raise BundleMetadataError(
            "source closure SHA-256 must be 64 lowercase hexadecimal characters"
        )
    expected = metadata or authoritative_metadata(kernel_path)
    kernel = _parse_graph(kernel_path, format="turtle")

    kernel_versions = set(kernel.objects(ROOT_IRI, OWL.versionInfo))
    if len(kernel_versions) != 1:
        raise BundleMetadataError(
            f"{kernel_path}: expected exactly one owl:versionInfo, found "
            f"{len(kernel_versions)}"
        )
    version_value = next(iter(kernel_versions))
    if (
        not isinstance(version_value, Literal)
        or version_value.language is not None
        or version_value.datatype is not None
        or STABLE_VERSION_PATTERN.fullmatch(str(version_value)) is None
    ):
        raise BundleMetadataError(
            f"{kernel_path}: owl:versionInfo must be one plain stable X.Y.Z literal"
        )
    version = str(version_value)
    expected_version_iri = URIRef(f"{ROOT_IRI}/{version}")
    kernel_version_iris = set(kernel.objects(ROOT_IRI, OWL.versionIRI))
    if kernel_version_iris != {expected_version_iri}:
        raise BundleMetadataError(
            f"{kernel_path}: owl:versionIRI must be exactly {expected_version_iri}"
        )

    # A restored Actions cache is untrusted input.  Reject the wrong size and
    # byte digest before RDFLib spends work parsing it (or follows a malformed
    # document into an expensive failure path).
    expected_record = _ledger_record(ledger_path, version) if ledger_path else None
    byte_count = bundle_path.stat().st_size
    if expected_record is not None and byte_count != expected_record["bytes"]:
        raise BundleMetadataError(
            f"release {version} byte count {byte_count} != "
            f"{expected_record['bytes']} in immutable BioPortal ledger {ledger_path}"
        )
    bundle_bytes = bundle_path.read_bytes()
    byte_sha256 = hashlib.sha256(bundle_bytes).hexdigest()
    if expected_record is not None and byte_sha256 != expected_record["sha256"]:
        raise BundleMetadataError(
            f"release {version} byte SHA-256 {byte_sha256} != "
            f"{expected_record['sha256']} in immutable BioPortal ledger {ledger_path}"
        )

    bundle = _parse_graph(bundle_path, format="xml")

    ontology_subjects = set(bundle.subjects(RDF.type, OWL.Ontology))
    if ontology_subjects != {ROOT_IRI}:
        rendered = ", ".join(sorted(map(str, ontology_subjects))) or "none"
        raise BundleMetadataError(
            f"{bundle_path}: expected {ROOT_IRI} as the only owl:Ontology, found {rendered}"
        )

    for predicate, values in expected.items():
        actual = set(bundle.objects(ROOT_IRI, predicate))
        if actual != set(values):
            raise BundleMetadataError(
                f"{bundle_path}: root {predicate} values differ from frozen Kernel "
                f"{kernel_path}"
            )

    for predicate in (OWL.versionInfo, OWL.versionIRI):
        expected_values = set(kernel.objects(ROOT_IRI, predicate))
        actual_values = set(bundle.objects(ROOT_IRI, predicate))
        if actual_values != expected_values:
            raise BundleMetadataError(
                f"{bundle_path}: root {predicate} does not match frozen Kernel "
                f"{kernel_path}"
            )

    if any(str(value).endswith("-dev") for value in bundle.objects(None, OWL.versionInfo)):
        raise BundleMetadataError(
            f"{bundle_path}: a development version reached the registry bundle"
        )
    integrity = BundleIntegrity(
        version=version,
        sha256=byte_sha256,
        canonical_graph_sha256=_canonical_graph_sha256(bundle),
        source_closure_sha256=source_closure_sha256,
        byte_count=byte_count,
        triple_count=len(bundle),
    )
    if ledger_path is not None:
        _verify_integrity(integrity, ledger_path)
    return integrity


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Collapse and verify deterministic BioPortal bundle metadata."
    )
    parser.add_argument("bundle", type=Path, help="generated RDF/XML bundle")
    parser.add_argument(
        "kernel",
        type=Path,
        help="frozen sstim-core.ttl supplying authoritative root metadata",
    )
    parser.add_argument(
        "--check-only",
        action="store_true",
        help="verify an existing generated/cached bundle without rewriting it",
    )
    parser.add_argument(
        "--ledger",
        type=Path,
        required=True,
        help="immutable per-release byte and graph integrity ledger",
    )
    parser.add_argument(
        "--propose-ledger-entry",
        action="store_true",
        help="print a new-release candidate instead of accepting an existing record",
    )
    parser.add_argument(
        "--source-closure-sha256",
        required=True,
        help="digest of the ordered, manifest-verified Full semantic module closure",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        metadata = authoritative_metadata(args.kernel)
        if args.check_only:
            collapsed: list[str] = []
        else:
            collapsed = collapse_metadata(args.bundle, metadata)
        integrity = verify_bundle(
            args.bundle,
            args.kernel,
            args.source_closure_sha256,
            metadata,
            ledger_path=None if args.propose_ledger_entry else args.ledger,
        )
        if args.propose_ledger_entry:
            _assert_release_is_new(args.ledger, integrity.version)
    except (BundleMetadataError, ET.ParseError, OSError, ValueError) as error:
        print(f"collapse-bundle-metadata: {error}", file=sys.stderr)
        return 1

    if args.propose_ledger_entry:
        print(json.dumps({integrity.version: integrity.ledger_record()}, indent=2))
    elif args.check_only:
        print(
            f"collapse-bundle-metadata: verified {args.bundle} against frozen "
            f"{args.kernel} and immutable ledger {args.ledger} "
            f"({integrity.triple_count} triples, {integrity.byte_count} bytes)"
        )
    else:
        summary = ", ".join(collapsed) if collapsed else "metadata already collapsed"
        print(
            f"collapse-bundle-metadata: {summary}; verified "
            f"{integrity.triple_count} triples and {integrity.byte_count} bytes "
            f"against frozen {args.kernel} and immutable ledger {args.ledger}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
