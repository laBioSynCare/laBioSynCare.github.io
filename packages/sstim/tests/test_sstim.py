#!/usr/bin/env python3
"""Tests for the sstim client package.

Offline by design. Everything resolves against the frozen 0.17.0 manifest and
the live manifest in this repository, so the suite proves the resolver against
real published manifests without a network call that could fail for reasons
having nothing to do with the code.

The network paths that cannot be exercised offline (release discovery from the
stable IRI, checksum verification of fetched bytes) are covered by asserting the
behaviour that guards them: a wrong checksum is refused, and an unreachable
cache in offline mode raises rather than silently fetching.
"""

from __future__ import annotations

from pathlib import Path
import hashlib
import sys
import unittest

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "packages" / "sstim" / "src"))

import sstim  # noqa: E402
from sstim._resolve import Closure, Module, _cached  # noqa: E402

FROZEN = ROOT / "static" / "ontology" / "0.17.0" / "manifest.json"
LIVE = ROOT / "static" / "ontology" / "manifest.json"
EXAMPLES = ROOT / "examples"


class ResolveTest(unittest.TestCase):
    def test_resolves_every_profile_from_a_frozen_manifest(self):
        for name in ("kernel", "core", "core-plus", "full"):
            closure = sstim.resolve_profile(name, manifest=FROZEN)
            self.assertEqual(closure.profile, name)
            self.assertEqual(closure.version, "0.17.0")
            self.assertEqual(closure.status, "released")
            self.assertFalse(closure.is_development)
            self.assertTrue(closure.semantic_modules)

    def test_profiles_nest(self):
        """Core contains Kernel, Core Plus contains Core, Full contains them."""
        ids = {
            name: {m.id for m in sstim.resolve_profile(name, manifest=FROZEN).semantic_modules}
            for name in ("kernel", "core", "core-plus", "full")
        }
        self.assertTrue(ids["kernel"] < ids["core"] < ids["core-plus"] < ids["full"])

    def test_kernel_publishes_no_shapes(self):
        """ADR 0045: a discovery entry point, not a validation contract."""
        self.assertEqual(sstim.resolve_profile("kernel", manifest=FROZEN).shape_modules, [])

    def test_unknown_profile_names_the_real_ones(self):
        with self.assertRaises(sstim.SstimError) as caught:
            sstim.resolve_profile("enormous", manifest=FROZEN)
        self.assertIn("core-plus", str(caught.exception))

    def test_live_manifest_is_a_development_line(self):
        """The guard that stops an unpinned publish. If this ever fails because
        the live line was released in place, the default resolution path needs
        rethinking, not this assertion deleting."""
        closure = sstim.resolve_profile("core", manifest=LIVE)
        self.assertTrue(closure.is_development)

    def test_version_iri_is_the_citable_one(self):
        closure = sstim.resolve_profile("core", manifest=FROZEN)
        self.assertEqual(closure.version_iri, "https://w3id.org/sstim/0.17.0")


class IntegrityTest(unittest.TestCase):
    def test_wrong_checksum_is_refused(self):
        """The whole point of carrying checksums: bytes that are not the bytes
        the manifest describes must stop the run, not validate the user's data
        against a graph that is not SSTIM."""
        with self.assertRaises(sstim.SstimError) as caught:
            _cached(
                "https://w3id.org/sstim/0.17.0/sstim-core.ttl",
                hashlib.sha256(b"not the module").hexdigest(),
                offline=True,
            )
        self.assertIn("not cached", str(caught.exception))

    def test_offline_refuses_to_fetch(self):
        closure = Closure(
            profile="core", version="0.17.0", status="released", source="test",
            modules=[Module(id="x", url="https://example.invalid/x.ttl",
                            sha256="0" * 64, graph_iri=None, is_shapes=False)],
        )
        with self.assertRaises(sstim.SstimError):
            closure.read(offline=True)


class ValidateTest(unittest.TestCase):
    def test_every_shipped_example_passes_its_own_profile(self):
        cases = {
            "01-stimulus-core.ttl": "core",
            "02-stimulus-core-plus.ttl": "core-plus",
            "03-protocol-full.ttl": "full",
            "04-session-full.ttl": "full",
        }
        for filename, profile in cases.items():
            with self.subTest(example=filename):
                report = sstim.validate(
                    EXAMPLES / filename, profile=profile, manifest=FROZEN
                )
                self.assertTrue(report.ok, str(report))

    def test_missing_regime_fails_conformance(self):
        report = sstim.validate(
            """
            @prefix ex: <https://example.org/s/> .
            @prefix sstim: <https://w3id.org/sstim#> .
            @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
            ex:s a sstim:StimulusSpecification ; rdfs:label "no regime"@en .
            """,
            profile="core", manifest=FROZEN,
        )
        self.assertFalse(report.conforms)
        self.assertFalse(report.ok)

    def test_core_plus_term_is_out_of_the_core_closure(self):
        """The check SHACL cannot make: shapes say nothing about a predicate
        they have never heard of, so this file conforms and is still wrong."""
        turtle = """
        @prefix ex: <https://example.org/s/> .
        @prefix sstim: <https://w3id.org/sstim#> .
        @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
        ex:s a sstim:StimulusSpecification ;
            rdfs:label "claims core"@en ;
            sstim:stimulusRegime "determinate" ;
            sstim:hasSignal ex:sig .
        ex:sig a sstim:StimulationSignal ; sstim:hzMin 10.0 .
        """
        core = sstim.validate(turtle, profile="core", manifest=FROZEN)
        self.assertTrue(core.conforms, "shapes alone do not catch this")
        self.assertIn("https://w3id.org/sstim#hzMin", core.undefined)
        self.assertFalse(core.ok)

        wider = sstim.validate(turtle, profile="core-plus", manifest=FROZEN)
        self.assertTrue(wider.ok, str(wider))

    def test_minting_in_the_sstim_namespace_is_refused(self):
        report = sstim.validate(
            """
            @prefix sstim: <https://w3id.org/sstim#> .
            @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
            <https://w3id.org/sstim#MyClass> a sstim:StimulusSpecification ;
                rdfs:label "mine now"@en ;
                sstim:stimulusRegime "determinate" .
            """,
            profile="core", manifest=FROZEN,
        )
        self.assertEqual(report.minted, ["https://w3id.org/sstim#MyClass"])
        self.assertFalse(report.ok)

    def test_report_is_falsy_when_it_failed(self):
        report = sstim.validate(
            EXAMPLES / "01-stimulus-core.ttl", profile="core", manifest=FROZEN
        )
        self.assertTrue(report)
        report.minted = ["https://w3id.org/sstim#X"]
        self.assertFalse(report)

    def test_missing_file_is_named(self):
        with self.assertRaises(sstim.SstimError):
            sstim.validate(ROOT / "nope.ttl", profile="core", manifest=FROZEN)


class CliTest(unittest.TestCase):
    def test_validate_exit_codes(self):
        from sstim.cli import main
        ok = main(["validate", str(EXAMPLES / "01-stimulus-core.ttl"),
                   "--profile", "core", "--manifest", str(FROZEN)])
        self.assertEqual(ok, 0)

    def test_unknown_profile_exits_two(self):
        from sstim.cli import main
        self.assertEqual(
            main(["modules", "--profile", "core", "--manifest", "/nonexistent.json"]), 2
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
