#!/usr/bin/env python3
"""Regression test for deterministic BioPortal bundle metadata collapse."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

from rdflib import Graph, URIRef
from rdflib.compare import isomorphic
from rdflib.namespace import DCTERMS, RDF


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
NORMALIZER = REPOSITORY_ROOT / "scripts" / "collapse-bundle-metadata.py"
ROOT_IRI = URIRef("https://w3id.org/sstim")
SOURCE_CLOSURE_SHA256 = hashlib.sha256(b"synthetic frozen closure").hexdigest()
COLLAPSED_PREDICATES = (
    DCTERMS.created,
    DCTERMS.description,
    DCTERMS.title,
)

KERNEL_TTL = """\
@prefix dct: <http://purl.org/dc/terms/> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<https://w3id.org/sstim> a owl:Ontology ;
    owl:versionIRI <https://w3id.org/sstim/0.16.0> ;
    owl:versionInfo "0.16.0" ;
    dct:created "2026-04-12"^^xsd:date ;
    dct:description "Authoritative frozen description"@en ;
    dct:title "Ontologia sintetica"@it,
        "Synthetic SSTIM ontology"@en .
"""

BUNDLE_XML = b"""\
<?xml version="1.0"?>
<rdf:RDF xmlns="https://w3id.org/sstim#"
    xml:base="https://w3id.org/sstim"
    xmlns:dct="http://purl.org/dc/terms/"
    xmlns:owl="http://www.w3.org/2002/07/owl#"
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
    xmlns:sstim="https://w3id.org/sstim#"
    xmlns:xsd="http://www.w3.org/2001/XMLSchema#">
  <owl:Ontology rdf:about="https://w3id.org/sstim">
    <owl:versionIRI rdf:resource="https://w3id.org/sstim/0.16.0" />
    <owl:versionInfo>0.16.0</owl:versionInfo>
    <dct:created rdf:datatype="http://www.w3.org/2001/XMLSchema#date">2026-04-12</dct:created>
    <dct:created rdf:datatype="http://www.w3.org/2001/XMLSchema#date">2026-08-01</dct:created>
    <dct:description xml:lang="en">Authoritative frozen description</dct:description>
    <dct:description xml:lang="en">Promoted module description</dct:description>
    <dct:title xml:lang="en">Promoted module title</dct:title>
    <dct:title xml:lang="it">Ontologia sintetica</dct:title>
    <dct:title xml:lang="en">Synthetic SSTIM ontology</dct:title>
    <dct:requires rdf:resource="https://w3id.org/sstim/example-module" />
  </owl:Ontology>
  <owl:Class rdf:about="https://w3id.org/sstim#SyntheticClass">
    <dct:title xml:lang="en">A non-root title that must remain</dct:title>
    <rdfs:subClassOf rdf:nodeID="restriction-1" />
  </owl:Class>
  <owl:Restriction rdf:nodeID="restriction-1">
    <owl:onProperty rdf:resource="https://w3id.org/sstim#syntheticProperty" />
    <owl:someValuesFrom rdf:resource="https://w3id.org/sstim#SyntheticValue" />
  </owl:Restriction>
</rdf:RDF>
"""


def _copy_graph(source: Graph) -> Graph:
    result = Graph()
    for triple in source:
        result.add(triple)
    return result


class CollapseBundleMetadataTest(unittest.TestCase):
    def _run_normalizer(
        self,
        bundle: Path,
        kernel: Path,
        *arguments: str,
        succeeds: bool = True,
    ) -> subprocess.CompletedProcess[str]:
        completed = subprocess.run(
            [
                sys.executable,
                str(NORMALIZER),
                str(bundle),
                str(kernel),
                "--source-closure-sha256",
                SOURCE_CLOSURE_SHA256,
                *arguments,
            ],
            cwd=REPOSITORY_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        message = (
            f"normalizer {'failed' if succeeds else 'passed'} unexpectedly for "
            f"{bundle}\nstdout:\n{completed.stdout}\nstderr:\n{completed.stderr}"
        )
        if succeeds:
            self.assertEqual(completed.returncode, 0, msg=message)
        else:
            self.assertNotEqual(completed.returncode, 0, msg=message)
        return completed

    @staticmethod
    def _write_ledger(
        path: Path, record: dict[str, str | int] | None = None
    ) -> None:
        path.write_text(
            json.dumps(
                {
                    "schemaVersion": 1,
                    "releases": {} if record is None else {"0.16.0": record},
                },
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )

    def test_normalization_is_reproducible_idempotent_and_semantic(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            temporary = Path(temporary_directory)
            frozen_directory = temporary / "0.16.0"
            frozen_directory.mkdir()
            kernel = frozen_directory / "sstim-core.ttl"
            kernel.write_text(KERNEL_TTL, encoding="utf-8", newline="\n")
            kernel_before = kernel.read_bytes()

            first = temporary / "first.owl"
            second = temporary / "second.owl"
            first.write_bytes(BUNDLE_XML)
            second.write_bytes(BUNDLE_XML)
            ledger = temporary / "bioportal-release-integrity.json"
            self._write_ledger(ledger)

            original = Graph().parse(data=BUNDLE_XML.decode("utf-8"), format="xml")
            authoritative = Graph().parse(data=KERNEL_TTL, format="turtle")
            expected = _copy_graph(original)
            for predicate in COLLAPSED_PREDICATES:
                expected.remove((ROOT_IRI, predicate, None))
                for value in authoritative.objects(ROOT_IRI, predicate):
                    expected.add((ROOT_IRI, predicate, value))

            proposal = self._run_normalizer(
                first,
                kernel,
                "--ledger",
                str(ledger),
                "--propose-ledger-entry",
            )
            proposed_records = json.loads(proposal.stdout)
            record = proposed_records["0.16.0"]
            self._write_ledger(ledger, record)

            self._run_normalizer(second, kernel, "--ledger", str(ledger))
            normalized = first.read_bytes()
            self.assertEqual(
                normalized,
                second.read_bytes(),
                "identical inputs did not normalize to identical bytes",
            )

            self._run_normalizer(first, kernel, "--ledger", str(ledger))
            self.assertEqual(
                normalized,
                first.read_bytes(),
                "normalizing an already-normalized bundle changed its bytes",
            )
            self.assertEqual(
                kernel_before,
                kernel.read_bytes(),
                "normalization modified the frozen Kernel",
            )

            xml_root = ET.parse(first).getroot()
            node_id = f"{{{RDF}}}nodeID"
            node_ids = [
                element.get(node_id)
                for element in xml_root.iter()
                if element.get(node_id) is not None
            ]
            self.assertEqual(
                node_ids.count("restriction-1"),
                2,
                "the explicit rdf:nodeID did not survive intact",
            )

            actual = Graph().parse(first, format="xml")
            self.assertTrue(
                isomorphic(actual, expected),
                "normalized graph differs from replacing only root identity metadata",
            )

            # A semantically identical serialization is still a new BioPortal
            # submission. The immutable byte digest must reject it.
            byte_changed = temporary / "byte-changed.owl"
            byte_changed.write_bytes(normalized.replace(b"    <", b"\t   <", 1))
            byte_changed_graph = Graph().parse(byte_changed, format="xml")
            self.assertTrue(isomorphic(actual, byte_changed_graph))
            byte_failure = self._run_normalizer(
                byte_changed,
                kernel,
                "--check-only",
                "--ledger",
                str(ledger),
                succeeds=False,
            )
            self.assertIn("byte SHA-256", byte_failure.stderr)

            # Even if somebody mistakenly records the truncated file's byte
            # digest, the independently recorded canonical graph and triple
            # count still prevent a root-only cache from reaching Pages.
            truncated = temporary / "truncated.owl"
            truncated_graph = Graph()
            for triple in actual.triples((ROOT_IRI, None, None)):
                truncated_graph.add(triple)
            truncated_graph.serialize(destination=truncated, format="xml")
            forged_record = dict(record)
            truncated_bytes = truncated.read_bytes()
            forged_record["sha256"] = hashlib.sha256(truncated_bytes).hexdigest()
            forged_record["bytes"] = len(truncated_bytes)
            forged_ledger = temporary / "forged-byte-only-ledger.json"
            self._write_ledger(forged_ledger, forged_record)
            truncated_failure = self._run_normalizer(
                truncated,
                kernel,
                "--check-only",
                "--ledger",
                str(forged_ledger),
                succeeds=False,
            )
            self.assertIn("canonical graph SHA-256", truncated_failure.stderr)
            self.assertIn("triple count", truncated_failure.stderr)

            # Proposal mode is only for a genuinely new release. It must not
            # produce replacement numbers for an existing immutable record.
            replacement = self._run_normalizer(
                first,
                kernel,
                "--check-only",
                "--ledger",
                str(ledger),
                "--propose-ledger-entry",
                succeeds=False,
            )
            self.assertIn("already has an immutable record", replacement.stderr)

            # The original incident was a multi-valued root date. Refuse to
            # recreate that ambiguity even when the selected Kernel is frozen.
            ambiguous_kernel = temporary / "ambiguous-core.ttl"
            ambiguous_kernel.write_text(
                KERNEL_TTL.replace(
                    'dct:created "2026-04-12"^^xsd:date ;',
                    'dct:created "2026-04-12"^^xsd:date, '
                    '"2026-04-13"^^xsd:date ;',
                ),
                encoding="utf-8",
            )
            ambiguous = self._run_normalizer(
                first,
                ambiguous_kernel,
                "--check-only",
                "--ledger",
                str(ledger),
                succeeds=False,
            )
            self.assertIn("exactly one xsd:date", ambiguous.stderr)

            invalid_date_kernel = temporary / "invalid-date-core.ttl"
            invalid_date_kernel.write_text(
                KERNEL_TTL.replace("2026-04-12", "2026-02-30"),
                encoding="utf-8",
            )
            invalid_date = self._run_normalizer(
                first,
                invalid_date_kernel,
                "--check-only",
                "--ledger",
                str(ledger),
                succeeds=False,
            )
            self.assertIn("exactly one xsd:date", invalid_date.stderr)

            # Strict JSON parsing rejects duplicate keys rather than silently
            # trusting the last value supplied by a malformed ledger.
            duplicate_ledger = temporary / "duplicate-ledger.json"
            duplicate_ledger.write_text(
                '{"schemaVersion":1,"schemaVersion":1,"releases":{}}\n',
                encoding="utf-8",
            )
            duplicate = self._run_normalizer(
                first,
                kernel,
                "--check-only",
                "--ledger",
                str(duplicate_ledger),
                succeeds=False,
            )
            self.assertIn("duplicate JSON key", duplicate.stderr)

            # Parser failures are concise contract errors, never uncaught
            # RDFLib/XML tracebacks. Forge only the byte fields so parsing is
            # reached; graph fields remain irrelevant because parsing fails.
            malformed = temporary / "malformed.owl"
            malformed.write_bytes(b"<rdf:RDF")
            malformed_record = dict(record)
            malformed_record["sha256"] = hashlib.sha256(malformed.read_bytes()).hexdigest()
            malformed_record["bytes"] = malformed.stat().st_size
            malformed_ledger = temporary / "malformed-ledger.json"
            self._write_ledger(malformed_ledger, malformed_record)
            malformed_failure = self._run_normalizer(
                malformed,
                kernel,
                "--check-only",
                "--ledger",
                str(malformed_ledger),
                succeeds=False,
            )
            self.assertIn("cannot parse xml", malformed_failure.stderr)
            self.assertNotIn("Traceback", malformed_failure.stderr)


if __name__ == "__main__":
    unittest.main()
