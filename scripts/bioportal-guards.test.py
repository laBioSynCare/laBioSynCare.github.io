#!/usr/bin/env python3
"""Focused regressions for BioPortal publication and validation-state guards."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RESOLVER = ROOT / "scripts/bioportal-release.py"
LEDGER_CHECK = ROOT / "scripts/check-bioportal-release-integrity.py"
CLOSURE_CHECK = ROOT / "scripts/verify-bioportal-closure.py"
WORKING_TREE_HASH = ROOT / "scripts/working-tree-hash.py"


def _record(seed: str) -> dict[str, str | int]:
    return {
        "sha256": hashlib.sha256(f"bytes:{seed}".encode()).hexdigest(),
        "canonicalGraphSha256": hashlib.sha256(f"graph:{seed}".encode()).hexdigest(),
        "sourceClosureSha256": hashlib.sha256(f"source:{seed}".encode()).hexdigest(),
        "bytes": 100,
        "triples": 10,
    }


def _ledger(releases: dict[str, dict[str, str | int]]) -> str:
    return json.dumps(
        {
            "schemaVersion": 1,
            "description": "Synthetic append-only BioPortal test ledger.",
            "releases": releases,
        },
        indent=2,
    ) + "\n"


class BioPortalGuardTest(unittest.TestCase):
    def _run(
        self, program: Path, *arguments: str, succeeds: bool
    ) -> subprocess.CompletedProcess[str]:
        result = subprocess.run(
            [sys.executable, str(program), *arguments],
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
        )
        if succeeds:
            self.assertEqual(result.returncode, 0, result.stderr)
        else:
            self.assertNotEqual(result.returncode, 0, result.stdout)
        return result

    def test_release_resolver_never_falls_back_when_snapshot_is_missing(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            ontology = root / "static/ontology"
            ontology.mkdir(parents=True)
            (ontology / "void.ttl").write_text(
                "@prefix void: <http://rdfs.org/ns/void#> .\n"
                "@prefix dcat: <http://www.w3.org/ns/dcat#> .\n"
                "<https://w3id.org/sstim/void> a void:Dataset, dcat:Dataset ;\n"
                "  dcat:version \"9.99.0\" .\n",
                encoding="utf-8",
            )
            result = self._run(
                RESOLVER, "--root", str(root), "--field", "release", succeeds=False
            )
            self.assertIn("no direct frozen snapshot", result.stderr)

    def test_release_resolver_requires_canonical_dataset_and_direct_manifest(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            ontology = root / "static/ontology"
            snapshot = ontology / "9.99.0"
            snapshot.mkdir(parents=True)
            (ontology / "void.ttl").write_text(
                "@prefix void: <http://rdfs.org/ns/void#> .\n"
                "@prefix dcat: <http://www.w3.org/ns/dcat#> .\n"
                "<https://example.test/not-sstim> a void:Dataset, dcat:Dataset ;\n"
                "  dcat:version \"9.99.0\" .\n",
                encoding="utf-8",
            )
            result = self._run(
                RESOLVER, "--root", str(root), "--field", "release", succeeds=False
            )
            self.assertIn("must be both void:Dataset and dcat:Dataset", result.stderr)

            (ontology / "void.ttl").write_text(
                "@prefix void: <http://rdfs.org/ns/void#> .\n"
                "@prefix dcat: <http://www.w3.org/ns/dcat#> .\n"
                "<https://w3id.org/sstim/void> a void:Dataset, dcat:Dataset ;\n"
                "  dcat:version \"9.99.0\" .\n",
                encoding="utf-8",
            )
            (ontology / "manifest.json").write_text("{}\n", encoding="utf-8")
            (snapshot / "manifest.json").symlink_to("../manifest.json")
            result = self._run(
                RESOLVER, "--root", str(root), "--field", "release", succeeds=False
            )
            self.assertIn("manifest must not be a symlink", result.stderr)

    def test_ledger_allows_append_but_rejects_existing_record_mutation(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            scripts = root / "scripts"
            scripts.mkdir()
            ledger = scripts / "bioportal-release-integrity.json"
            ledger.write_text(_ledger({"0.16.0": _record("0.16.0")}), encoding="utf-8")
            subprocess.run(["git", "init", "-q", str(root)], check=True)
            subprocess.run(
                ["git", "-C", str(root), "add", "scripts/bioportal-release-integrity.json"],
                check=True,
            )
            subprocess.run(
                [
                    "git",
                    "-C",
                    str(root),
                    "-c",
                    "user.name=BioPortal Test",
                    "-c",
                    "user.email=bioportal-test@example.invalid",
                    "commit",
                    "-q",
                    "-m",
                    "baseline",
                ],
                check=True,
            )

            ledger.write_text(
                _ledger({"0.16.0": _record("0.16.0"), "0.17.0": _record("0.17.0")}),
                encoding="utf-8",
            )
            self._run(
                LEDGER_CHECK,
                "--root",
                str(root),
                "--baseline-ref",
                "HEAD",
                succeeds=True,
            )

            ledger.write_text(
                _ledger({"0.16.0": _record("changed"), "0.17.0": _record("0.17.0")}),
                encoding="utf-8",
            )
            result = self._run(
                LEDGER_CHECK,
                "--root",
                str(root),
                "--baseline-ref",
                "HEAD",
                succeeds=False,
            )
            self.assertIn("differs from its first-parent history anchor", result.stderr)

    def test_ledger_rejects_a_mutation_already_present_at_the_baseline_tip(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            scripts = root / "scripts"
            scripts.mkdir()
            ledger = scripts / "bioportal-release-integrity.json"
            ledger.write_text(_ledger({"0.16.0": _record("original")}), encoding="utf-8")
            subprocess.run(["git", "init", "-q", str(root)], check=True)
            subprocess.run(["git", "-C", str(root), "add", "."], check=True)
            commit = [
                "git",
                "-C",
                str(root),
                "-c",
                "user.name=BioPortal Test",
                "-c",
                "user.email=bioportal-test@example.invalid",
                "commit",
                "-q",
            ]
            subprocess.run([*commit, "-m", "original record"], check=True)

            ledger.write_text(_ledger({"0.16.0": _record("mutated")}), encoding="utf-8")
            subprocess.run(["git", "-C", str(root), "add", "."], check=True)
            subprocess.run([*commit, "-m", "bad historical mutation"], check=True)

            result = self._run(
                LEDGER_CHECK,
                "--root",
                str(root),
                "--baseline-ref",
                "HEAD",
                succeeds=False,
            )
            self.assertIn("differs from its first-parent history anchor", result.stderr)

    def test_noncanonical_semver_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            scripts = root / "scripts"
            scripts.mkdir()
            (scripts / "bioportal-release-integrity.json").write_text(
                _ledger({"01.2.3": _record("invalid-version")}), encoding="utf-8"
            )
            result = self._run(
                LEDGER_CHECK, "--root", str(root), "--no-baseline", succeeds=False
            )
            self.assertIn("stable X.Y.Z SemVer", result.stderr)

    def test_owl_diff_allows_only_publication_transform(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            diff = Path(directory) / "closure.diff"
            source = Path(directory) / "source.ttl"
            source.write_text(
                "<https://w3id.org/sstim#Example> "
                "<https://w3id.org/sstim#observedBy> \"source\" .\n",
                encoding="utf-8",
            )
            diff.write_text(
                "2 axioms in left ontology but not in right ontology:\n"
                '- Annotation(<http://purl.org/dc/terms/title> "Module"@en)\n\n'
                "- OntologyID(OntologyIRI(<https://w3id.org/sstim/module>) "
                "VersionIRI(<null>))\n\n"
                "2 axioms in right ontology but not in left ontology:\n"
                "+ Declaration(NamedIndividual(<https://w3id.org/sstim#Example>))\n"
                "+ OntologyID(OntologyIRI(<https://w3id.org/sstim>) "
                "VersionIRI(<https://w3id.org/sstim/0.16.0>))\n",
                encoding="utf-8",
            )
            self._run(CLOSURE_CHECK, str(diff), "0.16.0", str(source), succeeds=True)

            diff.write_text(
                "1 axioms in left ontology but not in right ontology:\n"
                "- OntologyID(OntologyIRI(<https://w3id.org/sstim/module>) "
                "VersionIRI(<null>))\n\n"
                "2 axioms in right ontology but not in left ontology:\n"
                "+ Declaration(NamedIndividual(<https://example.test/Outside>))\n"
                "+ OntologyID(OntologyIRI(<https://w3id.org/sstim>) "
                "VersionIRI(<https://w3id.org/sstim/0.16.0>))\n",
                encoding="utf-8",
            )
            result = self._run(
                CLOSURE_CHECK, str(diff), "0.16.0", str(source), succeeds=False
            )
            self.assertIn("IRI absent from frozen source", result.stderr)

            diff.write_text(
                "2 axioms in left ontology but not in right ontology:\n"
                '- Annotation(<http://purl.org/dc/terms/title> "Module"@en)\n'
                "- SubClassOf(<https://w3id.org/sstim#A> <https://w3id.org/sstim#B>)\n\n"
                "0 axioms in right ontology but not in left ontology:\n",
                encoding="utf-8",
            )
            result = self._run(
                CLOSURE_CHECK, str(diff), "0.16.0", str(source), succeeds=False
            )
            self.assertIn("frozen source axiom missing", result.stderr)

            result = self._run(
                CLOSURE_CHECK, str(diff), "01.16.0", str(source), succeeds=False
            )
            self.assertIn("not stable X.Y.Z SemVer", result.stderr)

    def test_working_tree_hash_frames_file_content(self) -> None:
        def frame(label: bytes, payload: bytes) -> bytes:
            return label + len(payload).to_bytes(8, "big") + payload

        def old_hash(entries: dict[bytes, bytes]) -> str:
            digest = hashlib.sha256()
            for path, content in sorted(entries.items()):
                digest.update(frame(b"path\0", path))
                digest.update(frame(b"kind\0", b"file"))
                digest.update(frame(b"mode\0", b"regular"))
                digest.update(content)
                digest.update(b"\0end-file\0")
            return digest.hexdigest()

        first = b"first"
        second = b"second"
        forged_single = (
            first
            + b"\0end-file\0"
            + frame(b"path\0", b"b")
            + frame(b"kind\0", b"file")
            + frame(b"mode\0", b"regular")
            + second
        )
        one_file = {b"a": forged_single}
        two_files = {b"a": first, b"b": second}
        self.assertEqual(old_hash(one_file), old_hash(two_files))

        with tempfile.TemporaryDirectory() as directory:
            roots = [Path(directory) / "one", Path(directory) / "two"]
            for root in roots:
                subprocess.run(["git", "init", "-q", str(root)], check=True)
            (roots[0] / "a").write_bytes(forged_single)
            (roots[1] / "a").write_bytes(first)
            (roots[1] / "b").write_bytes(second)
            actual = []
            for root in roots:
                result = self._run(
                    WORKING_TREE_HASH, "--root", str(root), succeeds=True
                )
                actual.append(result.stdout.strip())
            self.assertNotEqual(actual[0], actual[1])


if __name__ == "__main__":
    unittest.main()
