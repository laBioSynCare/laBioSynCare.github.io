#!/usr/bin/env python3
"""Check SSTIM profile entrypoints and the minimal Core competency contract."""

from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    from pyshacl import validate as shacl_validate
    from rdflib import DCTERMS, Graph, Literal, Namespace, OWL, RDF, URIRef, XSD
except ImportError as exc:  # pragma: no cover - environment guidance
    raise SystemExit(
        "sstim-core-profile-contract: rdflib and pyshacl are required; "
        "run inside the repository dev shell."
    ) from exc


ROOT = Path(__file__).resolve().parents[1]
ONTOLOGY_DIR = ROOT / "static" / "ontology"
MANIFEST_PATH = ONTOLOGY_DIR / "manifest.json"

SSTIM = Namespace("https://w3id.org/sstim#")
SSTIM_EX = Namespace("https://w3id.org/sstim/exposure#")
EXAMPLE = Namespace("https://example.org/sstim/core-fixture/")
PROF = Namespace("http://www.w3.org/ns/dx/prof/")

MANIFEST = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
MODULES_BY_ID = {module["id"]: module for module in MANIFEST["modules"]}
PROFILES_BY_ID = {profile["id"]: profile for profile in MANIFEST["profiles"]}
RELEASED = MANIFEST["suite"]["status"] == "released"


def module_retrieval_iri(module: dict) -> URIRef:
    publication = module["publication"]
    key = "versionedUrl" if RELEASED else "persistentUrl"
    return URIRef(publication[key])


MODULE_ONTOLOGY_IRIS = {
    module_id: URIRef(module["ontologyIri"])
    for module_id, module in MODULES_BY_ID.items()
}
MODULE_SOURCE_PATHS = {
    module_id: ROOT / module["source"]["path"]
    for module_id, module in MODULES_BY_ID.items()
}
MODULE_RETRIEVAL_IRIS = {
    module_id: module_retrieval_iri(module)
    for module_id, module in MODULES_BY_ID.items()
}
RETRIEVAL_MODULE_IDS = {
    retrieval_iri: module_id
    for module_id, retrieval_iri in MODULE_RETRIEVAL_IRIS.items()
}

CORE_PROFILE = PROFILES_BY_ID["core"]
FULL_PROFILE = PROFILES_BY_ID["full"]
CORE = {MODULE_ONTOLOGY_IRIS[module_id] for module_id in CORE_PROFILE["modules"]}
FULL = {MODULE_ONTOLOGY_IRIS[module_id] for module_id in FULL_PROFILE["modules"]}


def parse(path: Path) -> Graph:
    return Graph().parse(path, format="turtle")


def check_profiles(errors: list[str]) -> None:
    shape_module_ids = {
        module_id
        for module_id, module in MODULES_BY_ID.items()
        if "validation" in module.get("roles", [])
    }
    shape_retrieval_iris = {
        MODULE_RETRIEVAL_IRIS[module_id] for module_id in shape_module_ids
    }
    expected_manifest_artifact = URIRef(
        MANIFEST["immutableRelease"]["manifestUrl"]
        if RELEASED
        else MANIFEST["manifestIri"]
    )
    for profile in MANIFEST["profiles"]:
        path = ROOT / profile["source"]["path"]
        filename = path.name
        profile_iri = URIRef(profile["iri"])
        expected_ids = profile["modules"]
        expected = {MODULE_ONTOLOGY_IRIS[module_id] for module_id in expected_ids}
        expected_shape_artifacts = {
            MODULE_RETRIEVAL_IRIS[module_id]
            for module_id in profile["shapeModules"]
        }
        graph = parse(path)
        if (profile_iri, RDF.type, OWL.Ontology) not in graph:
            errors.append(f"{filename}: missing owl:Ontology declaration for {profile_iri}")
        if (profile_iri, RDF.type, PROF.Profile) not in graph:
            errors.append(f"{filename}: missing prof:Profile declaration for {profile_iri}")
        if (profile_iri, PROF.isProfileOf, URIRef("https://w3id.org/sstim")) not in graph:
            errors.append(f"{filename}: missing prof:isProfileOf SSTIM")
        artifacts = {
            artifact
            for descriptor in graph.objects(profile_iri, PROF.hasResource)
            for artifact in graph.objects(descriptor, PROF.hasArtifact)
        }
        if expected_manifest_artifact not in artifacts:
            errors.append(
                f"{filename}: PROF resources do not expose the expected manifest "
                f"artifact {expected_manifest_artifact}"
            )
        actual_shape_artifacts = artifacts & shape_retrieval_iris
        if actual_shape_artifacts != expected_shape_artifacts:
            errors.append(
                f"{filename}: PROF shape artifacts mismatch; "
                f"expected={sorted(map(str, expected_shape_artifacts))}, "
                f"actual={sorted(map(str, actual_shape_artifacts))}"
            )

        imports = set(graph.objects(profile_iri, OWL.imports))
        requires = set(graph.objects(profile_iri, DCTERMS.requires))
        expected_imports = {
            MODULE_RETRIEVAL_IRIS[module_id] for module_id in expected_ids
        }
        if imports != expected_imports:
            errors.append(
                f"{filename}: owl:imports mismatch; expected={sorted(map(str, expected_imports))}, "
                f"actual={sorted(map(str, imports))}"
            )
        if requires != expected:
            errors.append(
                f"{filename}: dct:requires mismatch; expected={sorted(map(str, expected))}, "
                f"actual={sorted(map(str, requires))}"
            )
        if imports & shape_retrieval_iris:
            errors.append(f"{filename}: shape graphs must not be in an OWL import closure")

        # Resolve every import locally and verify that the imported resource is
        # the ontology actually declared by the mapped distribution.
        for imported in sorted(imports, key=str):
            module_id = RETRIEVAL_MODULE_IDS.get(imported)
            if module_id is None:
                errors.append(f"{filename}: no local distribution for import {imported}")
                continue
            module_path = MODULE_SOURCE_PATHS[module_id]
            module_graph = parse(module_path)
            declared_ontology = MODULE_ONTOLOGY_IRIS[module_id]
            if (declared_ontology, RDF.type, OWL.Ontology) not in module_graph:
                errors.append(
                    f"{filename}: {module_path.name} does not declare its logical "
                    f"ontology {declared_ontology}"
                )
            module_requires = set(module_graph.objects(declared_ontology, DCTERMS.requires))
            missing_from_closure = module_requires - expected
            if missing_from_closure:
                errors.append(
                    f"{filename}: {module_path.name} requires modules outside the profile: "
                    + ", ".join(sorted(map(str, missing_from_closure)))
                )


def core_ontology_graph() -> Graph:
    graph = Graph()
    for module_id in CORE_PROFILE["modules"]:
        graph.parse(MODULE_SOURCE_PATHS[module_id], format="turtle")
    return graph


def check_core_fixture(errors: list[str]) -> None:
    positive_fixtures = CORE_PROFILE["fixtures"]["positive"]
    if not positive_fixtures:
        errors.append("Core profile manifest contract has no positive fixture")
        return
    fixture = parse(ROOT / positive_fixtures[0])
    shapes = Graph()
    for module_id in CORE_PROFILE["shapeModules"]:
        shapes.parse(MODULE_SOURCE_PATHS[module_id], format="turtle")
    ontology = core_ontology_graph()
    if not CORE_PROFILE["shapeModules"]:
        errors.append("Core profile manifest contract has no SHACL module")
        return
    for module_id in CORE_PROFILE["shapeModules"]:
        module = MODULES_BY_ID[module_id]
        shapes_iri = MODULE_ONTOLOGY_IRIS[module_id]
        shape_requires = set(shapes.objects(shapes_iri, DCTERMS.requires))
        expected_shape_requires = {
            MODULE_ONTOLOGY_IRIS[required_id] for required_id in module["requires"]
        }
        if shape_requires != expected_shape_requires:
            errors.append(
                f"{MODULE_SOURCE_PATHS[module_id].name}: dct:requires differs from "
                "the manifest; "
                f"expected={sorted(map(str, expected_shape_requires))}, "
                f"actual={sorted(map(str, shape_requires))}"
            )

    conforms, _, report = shacl_validate(
        data_graph=fixture,
        shacl_graph=shapes,
        ont_graph=ontology,
        inference="none",
        advanced=False,
        meta_shacl=True,
    )
    if not conforms:
        errors.append(f"positive Core fixture failed SHACL validation:\n{report}")

    query = """
        PREFIX sstim: <https://w3id.org/sstim#>
        SELECT ?specification ?process ?channel ?regime ?duration ?target WHERE {
          ?specification a sstim:StimulusSpecification ;
              sstim:describesStimulation ?process ;
              sstim:stimulusRegime ?regime ;
              sstim:hasStimulusChannel ?channel ;
              sstim:hasStimulationTarget ?target .
          ?channel sstim:channelDurationSeconds ?duration .
        }
    """
    rows = list(fixture.query(query))
    if len(rows) != 1:
        errors.append(f"Core competency query expected one result, found {len(rows)}")
    elif (
        rows[0].specification != EXAMPLE.specification
        or rows[0].process != EXAMPLE.process
        or rows[0].channel != EXAMPLE.channel
        or rows[0].target != EXAMPLE.target
    ):
        errors.append(f"Core competency query returned unexpected resources: {tuple(rows[0])}")
    elif str(rows[0].regime) != "determinate" or float(rows[0].duration) != 300.0:
        errors.append(f"Core competency query returned unexpected values: {tuple(rows[0])}")

    # This is the critical weak-profile regression: the fixture deliberately
    # lacks Full-profile delivery, placement, perceived-modality, and safety
    # assertions. Adding those predicates to Core shapes would make this test
    # fail without any extension module having been selected.
    forbidden_core_shape_paths = {
        URIRef("https://w3id.org/sstim/exposure#deliveryMedium"),
        URIRef("https://w3id.org/sstim/exposure#perceivedModality"),
        URIRef("https://w3id.org/sstim/exposure#hasBodyPlacement"),
        URIRef("https://w3id.org/sstim/exposure#hasComfortBoundary"),
        URIRef("https://w3id.org/sstim#hasCautionTag"),
        URIRef("https://w3id.org/sstim#hasEvidenceTier"),
    }
    SH = Namespace("http://www.w3.org/ns/shacl#")
    paths = set(shapes.objects(None, SH.path))
    leaked = paths & forbidden_core_shape_paths
    if leaked:
        errors.append(
            "Core shapes leaked Full-profile policy paths: "
            + ", ".join(sorted(map(str, leaked)))
        )

    # Sanity-check that the positive result is meaningful by breaking or
    # corrupting each required/conditional Core field in memory.
    mutations = (
        (
            "missing specification label",
            EXAMPLE.specification,
            URIRef("http://www.w3.org/2000/01/rdf-schema#label"),
            None,
        ),
        (
            "missing channel label",
            EXAMPLE.channel,
            URIRef("http://www.w3.org/2000/01/rdf-schema#label"),
            None,
        ),
        ("missing regime", EXAMPLE.specification, SSTIM.stimulusRegime, None),
        (
            "invalid regime",
            EXAMPLE.specification,
            SSTIM.stimulusRegime,
            Literal("periodic"),
        ),
        (
            "zero duration",
            EXAMPLE.channel,
            SSTIM.channelDurationSeconds,
            Literal("0.0", datatype=XSD.decimal),
        ),
        (
            "untyped linked channel",
            EXAMPLE.channel,
            RDF.type,
            None,
        ),
        (
            "literal channel link",
            EXAMPLE.specification,
            SSTIM.hasStimulusChannel,
            Literal("not a channel"),
        ),
        (
            "wrong-class channel link",
            EXAMPLE.specification,
            SSTIM.hasStimulusChannel,
            EXAMPLE.author,
        ),
        (
            "literal target link",
            EXAMPLE.specification,
            SSTIM.hasStimulationTarget,
            Literal("not a target resource"),
        ),
    )
    for label, subject, predicate, replacement in mutations:
        candidate = Graph()
        candidate += fixture
        candidate.remove((subject, predicate, None))
        if replacement is not None:
            candidate.add((subject, predicate, replacement))
        mutation_conforms, _, _ = shacl_validate(
            data_graph=candidate,
            shacl_graph=shapes,
            ont_graph=ontology,
            inference="none",
            advanced=False,
        )
        if mutation_conforms:
            errors.append(f"Core shapes accepted negative mutation: {label}")

    optional_fields = {
        "process reference": (EXAMPLE.specification, SSTIM.describesStimulation),
        "channel": (EXAMPLE.specification, SSTIM.hasStimulusChannel),
        "channel duration": (EXAMPLE.channel, SSTIM.channelDurationSeconds),
        "target": (EXAMPLE.specification, SSTIM.hasStimulationTarget),
    }
    for label, (subject, predicate) in optional_fields.items():
        candidate = Graph()
        candidate += fixture
        candidate.remove((subject, predicate, None))
        optional_conforms, _, optional_report = shacl_validate(
            data_graph=candidate,
            shacl_graph=shapes,
            ont_graph=ontology,
            inference="none",
            advanced=False,
        )
        if not optional_conforms:
            errors.append(
                f"Core shapes incorrectly require optional {label}:\n{optional_report}"
            )


def check_declared_fixture_sets(errors: list[str]) -> None:
    """Execute every fixture the manifest registers for Core, by category.

    The in-memory mutations above prove the shapes react to a broken field. They
    cannot prove what the manifest promises a *consumer*, which is that these
    committed files behave as their category says: out-of-scope data validates,
    adversarial data does not. A fixture listed but never run is a release
    contract that nobody checks.
    """
    shapes = Graph()
    for module_id in CORE_PROFILE["shapeModules"]:
        shapes.parse(MODULE_SOURCE_PATHS[module_id], format="turtle")
    ontology = core_ontology_graph()

    def validates(path: Path) -> tuple[bool, str]:
        conforms, _, report = shacl_validate(
            data_graph=parse(path),
            shacl_graph=shapes,
            ont_graph=ontology,
            inference="none",
            advanced=False,
        )
        return conforms, report

    fixtures = CORE_PROFILE["fixtures"]
    for category in ("positive", "outOfScope"):
        for relative in fixtures[category]:
            conforms, report = validates(ROOT / relative)
            if not conforms:
                errors.append(
                    f"{category} Core fixture {relative} must validate under the "
                    f"Core closure but did not:\n{report}"
                )
    if not fixtures["outOfScope"]:
        errors.append(
            "Core profile declares no out-of-scope fixture; ADR 0043 §7 requires one "
            "per profile to prove omitted concern policy does not leak into validation"
        )
    if not fixtures["adversarial"]:
        errors.append("Core profile declares no adversarial fixture")
    for relative in fixtures["adversarial"]:
        conforms, _ = validates(ROOT / relative)
        if conforms:
            errors.append(
                f"adversarial Core fixture {relative} was accepted; it must be "
                "rejected by the Core closure or it is not adversarial"
            )


def main() -> int:
    errors: list[str] = []
    try:
        check_profiles(errors)
        check_core_fixture(errors)
        check_declared_fixture_sets(errors)
    except Exception as exc:  # report parse/query/tool failures uniformly
        errors.append(f"unexpected contract-check failure: {type(exc).__name__}: {exc}")

    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1

    fixtures = CORE_PROFILE["fixtures"]
    print(
        f"SSTIM Core profile contract OK: {len(MANIFEST['profiles'])} profile entrypoints, "
        f"{len(FULL)} Full modules, weak Core SHACL, competency query, "
        "9 negative mutations, 4 optional-field cases, and declared fixtures "
        f"({len(fixtures['positive'])} positive, {len(fixtures['outOfScope'])} out-of-scope, "
        f"{len(fixtures['adversarial'])} adversarial)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
