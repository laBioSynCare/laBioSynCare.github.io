#!/usr/bin/env python3
"""Repository-wide semantic quality and competency audit for SSTIM."""

from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

from rdflib import BNode, Graph, Literal, Namespace, RDF, RDFS, SKOS, URIRef
from rdflib.namespace import DCTERMS, OWL, PROV, XSD


ROOT = Path(__file__).resolve().parent.parent
ONTOLOGY_DIR = ROOT / "static" / "ontology"
INSTANCE_DIR = ONTOLOGY_DIR / "instances"
ECOSYSTEM_INSTANCE_DIR = INSTANCE_DIR / "ecosystem"
ECOSYSTEM_REAL_DIR = ECOSYSTEM_INSTANCE_DIR / "agents"
ECOSYSTEM_FIXTURE_DIR = ECOSYSTEM_INSTANCE_DIR / "fixtures"
W3ID_STAGING_FILE = ROOT / "docs" / "ecosystem" / "w3id" / "sstim" / ".htaccess"
MANIFEST_PATH = ONTOLOGY_DIR / "manifest.json"
MANIFEST = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
MANIFEST_MODULES = {module["id"]: module for module in MANIFEST["modules"]}
FULL_PROFILE = next(profile for profile in MANIFEST["profiles"] if profile["id"] == "full")
FULL_MODULE_IDS = FULL_PROFILE["modules"] + FULL_PROFILE["shapeModules"]
MODULES = {
    ROOT / MANIFEST_MODULES[module_id]["source"]["path"]: URIRef(
        MANIFEST_MODULES[module_id]["ontologyIri"]
    )
    for module_id in FULL_MODULE_IDS
}

SSTIM = Namespace("https://w3id.org/sstim#")
VOCAB = Namespace("https://w3id.org/sstim/vocab#")
EXPOSURE = Namespace("https://w3id.org/sstim/exposure#")
ECOSYSTEM = Namespace("https://w3id.org/sstim/ecosystem#")
SCHEMA = Namespace("https://schema.org/")
ORG = Namespace("http://www.w3.org/ns/org#")
VOID = Namespace("http://rdfs.org/ns/void#")
DCAT = Namespace("http://www.w3.org/ns/dcat#")

TERM_NAMESPACES = (str(SSTIM), str(VOCAB), str(EXPOSURE), str(ECOSYSTEM))
INSTANCE_PREFIXES = (
    "https://w3id.org/sstim/framework/",
    "https://w3id.org/sstim/implementation/",
    "https://w3id.org/sstim/ref/",
    "https://w3id.org/sstim/organization/",
    "https://w3id.org/sstim/specialist/",
    "https://w3id.org/sstim/ecosystem-record/",
)
ECOSYSTEM_INSTANCE_PREFIXES = (
    "https://w3id.org/sstim/organization/",
    "https://w3id.org/sstim/specialist/",
    "https://w3id.org/sstim/ecosystem-record/",
)
# Live-projection subjects the static catalog may reference by IRI. Each entry
# is a reviewed self-publication whose owning record lives in the mutable
# aggregate, dereferenceable through the live namespace routes; keeping the
# list exact preserves the dangling-reference check for everything else.
LIVE_PROJECTION_REFERENCES = {
    "https://w3id.org/sstim/organization/aeterni-anima",
}
ECOSYSTEM_AGENTS_GRAPH = URIRef("https://w3id.org/sstim/graph/ecosystem-agents")
ECOSYSTEM_FIXTURE_GRAPH = URIRef("https://w3id.org/sstim/graph/ecosystem-fixture")
ECOSYSTEM_PUBLIC_DUMP = URIRef(
    "https://biosyncare-lab.web.app/current.ttl"
)
CATALOG_PUBLIC_ROUTES = {
    "framework/bsc": (
        "https://labiosyncare.github.io/ontology/instances/frameworks/bsc.ttl"
    ),
    "implementation/bsclab": (
        "https://labiosyncare.github.io/ontology/instances/implementations/implementations.ttl"
    ),
    "implementation/biosyncare": (
        "https://labiosyncare.github.io/ontology/instances/implementations/implementations.ttl"
    ),
    "implementation/bsclab/component/patch-studio": (
        "https://labiosyncare.github.io/ontology/instances/implementations/implementations.ttl"
    ),
}
# BSC framework technique identities (ADR 0033). The three BSC originated
# resolve to the framework document that defines them; the four retired ones
# resolve to the SKOS vocabulary now carrying their replacements. Audited
# fail-closed and exactly, like the catalog block, so a retired slug can never
# silently start resolving to the framework file as if it were still current.
BSC_FRAMEWORK_DUMP = (
    "https://labiosyncare.github.io/ontology/instances/frameworks/bsc.ttl"
)
VOCAB_DUMP = "https://labiosyncare.github.io/ontology/sstim-vocab.ttl"
TECHNIQUE_PUBLIC_ROUTES = {
    "framework/bsc/technique/martigli-breathing-oscillation": BSC_FRAMEWORK_DUMP,
    "framework/bsc/technique/martigli-binaural-hybrid": BSC_FRAMEWORK_DUMP,
    "framework/bsc/technique/symmetry-permutation-entrainment": BSC_FRAMEWORK_DUMP,
    "framework/bsc/technique/binaural-beat-stimulation": VOCAB_DUMP,
    "framework/bsc/technique/photic-rhythm-stimulation": VOCAB_DUMP,
    "framework/bsc/technique/audiovisual-rhythm-coordination": VOCAB_DUMP,
    "framework/bsc/technique/vibrotactile-rhythm-stimulation": VOCAB_DUMP,
}

# Canonical Accept matching for every staged content-negotiated route. Explicit
# RDF types win in JSON-LD, RDF/XML order, then HTML, then Turtle/wildcard.
# Full media ranges are matched case-insensitively and q=0 is never acceptable.
_Q_ZERO_GUARD = (
    r"(?![^,]*;\s*q\s*=\s*0(?:\.0*)?\s*(?:;|,|$))"
)
_JSON_LD_ACCEPT_RE = (
    r"(?:^|,)\s*application/ld\+json\s*(?=;|,|$)" + _Q_ZERO_GUARD
)
_RDF_XML_ACCEPT_RE = (
    r"(?:^|,)\s*application/rdf\+xml\s*(?=;|,|$)" + _Q_ZERO_GUARD
)
_HTML_ACCEPT_RE = (
    r"(?:^|,)\s*(?:text/html|application/xhtml\+xml)\s*(?=;|,|$)"
    + _Q_ZERO_GUARD
)
_TURTLE_ACCEPT_RE = (
    r"(?:^|,)\s*(?:text/turtle|application/x-turtle|\*/\*)\s*(?=;|,|$)"
    + _Q_ZERO_GUARD
)
JSON_LD_ACCEPT = rf"RewriteCond %{{HTTP_ACCEPT}} {_JSON_LD_ACCEPT_RE} [NC]"
RDF_XML_ACCEPT = rf"RewriteCond %{{HTTP_ACCEPT}} {_RDF_XML_ACCEPT_RE} [NC]"
HTML_ACCEPT = rf"RewriteCond %{{HTTP_ACCEPT}} {_HTML_ACCEPT_RE} [NC]"
EMPTY_ACCEPT = r"RewriteCond %{HTTP_ACCEPT} ^$ [OR]"
TURTLE_ACCEPT = rf"RewriteCond %{{HTTP_ACCEPT}} {_TURTLE_ACCEPT_RE} [NC]"

errors: list[str] = []


def fail(message: str) -> None:
    errors.append(message)


def parse_graph(paths: list[Path]) -> Graph:
    graph = Graph()
    for path in paths:
        try:
            graph.parse(path, format="turtle")
        except Exception as exc:  # pragma: no cover - validator error path
            fail(f"cannot parse {path.relative_to(ROOT)}: {exc}")
    return graph


module_paths = list(MODULES)
instance_paths = sorted(INSTANCE_DIR.rglob("*.ttl"))
ecosystem_real_paths = sorted(ECOSYSTEM_REAL_DIR.glob("*.ttl"))
ecosystem_fixture_paths = sorted(ECOSYSTEM_FIXTURE_DIR.glob("*.ttl"))
ecosystem_instance_paths = ecosystem_real_paths + ecosystem_fixture_paths
if ecosystem_real_paths:
    fail(
        "real ecosystem records must remain in the external mutable store, not "
        "the Zenodo-tracked repository"
    )
unexpected_ecosystem_paths = sorted(
    set(ECOSYSTEM_INSTANCE_DIR.rglob("*.ttl")) - set(ecosystem_instance_paths)
)
for path in unexpected_ecosystem_paths:
    fail(
        f"{path.relative_to(ROOT)}: ecosystem Turtle files must be direct files "
        "under ecosystem/agents/ or ecosystem/fixtures/"
    )
modules = parse_graph(module_paths)
instances = parse_graph(instance_paths)
ecosystem_real_instances = parse_graph(ecosystem_real_paths)
ecosystem_fixture_instances = parse_graph(ecosystem_fixture_paths)
ecosystem_instances = parse_graph(ecosystem_instance_paths)
all_graph = modules + instances


# All live modules must carry one identical whole-set version (ADR 0020), and
# a development line must not present itself as released (audit KR-14).
MOD = Namespace("https://w3id.org/mod#")
module_versions: dict[str, str] = {}
for path, module_iri in MODULES.items():
    values = list(modules.objects(module_iri, OWL.versionInfo))
    if len(values) != 1:
        fail(f"{path.name}: expected exactly one owl:versionInfo, found {len(values)}")
        continue
    module_versions[path.name] = str(values[0])

distinct_versions = set(module_versions.values())
if len(distinct_versions) > 1:
    fail(f"module owl:versionInfo values diverge: {sorted(module_versions.items())}")

whole_set_version = next(iter(distinct_versions), "")
if "-" in whole_set_version:
    for path, module_iri in MODULES.items():
        for status in modules.objects(module_iri, MOD.status):
            if str(status).strip().lower() == "released":
                fail(
                    f"{path.name}: development version {whole_set_version} "
                    'must not declare mod:status "released"'
                )

named_classes = {
    subject
    for subject in modules.subjects(RDF.type, OWL.Class)
    if isinstance(subject, URIRef)
}
anonymous_classes = {
    subject
    for subject in modules.subjects(RDF.type, OWL.Class)
    if isinstance(subject, BNode)
}
object_properties = set(modules.subjects(RDF.type, OWL.ObjectProperty))
datatype_properties = set(modules.subjects(RDF.type, OWL.DatatypeProperty))
annotation_properties = set(modules.subjects(RDF.type, OWL.AnnotationProperty))
declared_properties = object_properties | datatype_properties | annotation_properties

# VoID/DCAT counts are publication metadata and must not drift silently.
void_graph = parse_graph([ONTOLOGY_DIR / "void.ttl"])
dataset_iri = URIRef("https://w3id.org/sstim/void")
instance_dataset_iri = URIRef("https://w3id.org/sstim/void#instances")
declared_module_triples = list(void_graph.objects(dataset_iri, VOID.triples))
declared_module_classes = list(void_graph.objects(dataset_iri, VOID.classes))
declared_module_properties = list(void_graph.objects(dataset_iri, VOID.properties))
declared_instance_triples = list(void_graph.objects(instance_dataset_iri, VOID.triples))
declared_ecosystem_triples = list(void_graph.objects(ECOSYSTEM_AGENTS_GRAPH, VOID.triples))
declared_fixture_triples = list(void_graph.objects(ECOSYSTEM_FIXTURE_GRAPH, VOID.triples))
dataset_versions = list(void_graph.objects(dataset_iri, DCAT.version))

# VoID describes the latest immutable release, while the top-level sources may
# be a prerelease development line. Count the frozen distribution named by
# dcat:version instead of making release metadata drift with live development.
published_modules = Graph()
published_named_classes: set[URIRef] = set()
published_declared_properties: set[URIRef] = set()
if len(dataset_versions) != 1:
    fail("void.ttl: expected exactly one dcat:version")
else:
    published_dir = ONTOLOGY_DIR / str(dataset_versions[0])
    published_paths = sorted(published_dir.glob("sstim-*.ttl"))
    if not published_paths:
        fail(f"void.ttl: dcat:version {dataset_versions[0]} has no frozen module set")
    else:
        published_modules = parse_graph(published_paths)
        published_named_classes = {
            subject
            for subject in published_modules.subjects(RDF.type, OWL.Class)
            if isinstance(subject, URIRef)
        }
        published_declared_properties = {
            subject
            for property_type in (OWL.ObjectProperty, OWL.DatatypeProperty, OWL.AnnotationProperty)
            for subject in published_modules.subjects(RDF.type, property_type)
            if isinstance(subject, URIRef)
        }

        # The subset inventory must describe the release dcat:version names, the
        # same frozen set the counts above are taken from. void.ttl is
        # hand-written and was not updated when ADR 0043 grew the suite from 8
        # modules to 18, so without this the FAIR description silently stops
        # covering most of the ontology. Bumping dcat:version to a modular
        # release now forces the subsets to be completed. `#instances` is the
        # public-instance dataset, not a module.
        NON_MODULE_SUBSETS = {"instances"}
        VOID_BASE = "https://w3id.org/sstim/void#"
        frozen_module_ids = {path.stem.removeprefix("sstim-") for path in published_paths}
        declared_subsets = {
            str(subset)[len(VOID_BASE):]
            for subset in void_graph.objects(dataset_iri, VOID.subset)
            if str(subset).startswith(VOID_BASE)
        }
        for missing in sorted(frozen_module_ids - declared_subsets):
            fail(
                f"void.ttl: frozen {dataset_versions[0]} module sstim-{missing}.ttl has no "
                f"void:subset <{VOID_BASE}{missing}>"
            )
        for extra in sorted(declared_subsets - frozen_module_ids - NON_MODULE_SUBSETS):
            fail(
                f"void.ttl: void:subset <{VOID_BASE}{extra}> describes no module in the "
                f"frozen {dataset_versions[0]} release"
            )
        # A subset must distribute the module it is named for; a copied block
        # that still points at its neighbour is otherwise invisible.
        for module_id in sorted(frozen_module_ids & declared_subsets):
            expected = f"/ontology/sstim-{module_id}.ttl"
            subset_iri = URIRef(f"{VOID_BASE}{module_id}")
            # Distributions hang off the subset as blank nodes; void:dataDump is
            # asserted directly.
            downloads = {
                str(url)
                for distribution in void_graph.objects(subset_iri, DCAT.distribution)
                for url in void_graph.objects(distribution, DCAT.downloadURL)
            } | {str(url) for url in void_graph.objects(subset_iri, VOID.dataDump)}
            if not any(url.endswith(expected) for url in downloads):
                fail(
                    f"void.ttl: subset <{VOID_BASE}{module_id}> has no dcat:downloadURL "
                    f"ending in {expected}"
                )


def published_instance_url(path: Path) -> URIRef:
    relative = path.relative_to(ONTOLOGY_DIR).as_posix()
    return URIRef(f"https://labiosyncare.github.io/ontology/{relative}")


expected_ecosystem_dumps = {ECOSYSTEM_PUBLIC_DUMP}
expected_fixture_dumps = {published_instance_url(path) for path in ecosystem_fixture_paths}
expected_ecosystem_uri_spaces = {
    Literal("https://w3id.org/sstim/organization/"),
    Literal("https://w3id.org/sstim/specialist/"),
    Literal("https://w3id.org/sstim/ecosystem-record/"),
}
expected_fixture_uri_spaces = {
    *expected_ecosystem_uri_spaces,
    Literal("https://w3id.org/sstim/implementation/bsclab/"),
}
if declared_module_triples != [Literal(len(published_modules))]:
    fail(
        "void.ttl: void:triples must be "
        f"{len(published_modules)} for the frozen {dataset_versions[0] if dataset_versions else '?'} graph"
    )
if declared_module_classes != [Literal(len(published_named_classes))]:
    fail(f"void.ttl: void:classes must be {len(published_named_classes)} named OWL classes")
if declared_module_properties != [Literal(len(published_declared_properties))]:
    fail(f"void.ttl: void:properties must be {len(published_declared_properties)} OWL properties")
if declared_instance_triples != [Literal(len(instances))]:
    fail(f"void.ttl: instance void:triples must be {len(instances)}")
if declared_ecosystem_triples:
    fail(
        "void.ttl: mutable ecosystem-agent graph must omit volatile void:triples counts"
    )
if declared_fixture_triples != [Literal(len(ecosystem_fixture_instances))]:
    fail(
        "void.ttl: ecosystem-fixture graph void:triples must be "
        f"{len(ecosystem_fixture_instances)}"
    )
if set(void_graph.objects(ECOSYSTEM_AGENTS_GRAPH, VOID.dataDump)) != expected_ecosystem_dumps:
    fail("void.ttl: ecosystem-agent data dumps must cover every real ecosystem file exactly")
if set(void_graph.objects(ECOSYSTEM_FIXTURE_GRAPH, VOID.dataDump)) != expected_fixture_dumps:
    fail("void.ttl: ecosystem-fixture data dumps must cover every fixture file exactly")
if set(void_graph.objects(ECOSYSTEM_AGENTS_GRAPH, VOID.uriSpace)) != expected_ecosystem_uri_spaces:
    fail("void.ttl: ecosystem-agent graph uriSpace inventory is incomplete or has drifted")
if set(void_graph.objects(ECOSYSTEM_FIXTURE_GRAPH, VOID.uriSpace)) != expected_fixture_uri_spaces:
    fail("void.ttl: ecosystem-fixture graph uriSpace inventory is incomplete or has drifted")
if (instance_dataset_iri, VOID.subset, ECOSYSTEM_AGENTS_GRAPH) not in void_graph:
    fail("void.ttl: public instance dataset must include the ecosystem-agent graph as a subset")
if (instance_dataset_iri, VOID.subset, ECOSYSTEM_FIXTURE_GRAPH) not in void_graph:
    fail("void.ttl: public instance dataset must include the ecosystem-fixture graph as a subset")

core_versions = list(modules.objects(URIRef("https://w3id.org/sstim"), OWL.versionInfo))
if len(core_versions) == 1:
    live_version = str(core_versions[0])
    if "-" not in live_version and dataset_versions != core_versions:
        fail("void.ttl: a released live core must match dcat:version")
    if "-" in live_version and dataset_versions and str(dataset_versions[0]) == live_version:
        fail("void.ttl: dcat:version must identify an immutable release, not a prerelease")


def objects(subject: URIRef, predicate: URIRef) -> list:
    return list(all_graph.objects(subject, predicate))


def subclasses(class_iri: URIRef) -> set[URIRef]:
    result = {class_iri}
    changed = True
    while changed:
        changed = False
        for child, parent in modules.subject_objects(RDFS.subClassOf):
            if isinstance(child, URIRef) and parent in result and child not in result:
                result.add(child)
                changed = True
    return result


def instances_of(class_iri: URIRef) -> set[URIRef]:
    accepted_types = subclasses(class_iri)
    return {
        subject
        for subject, type_iri in all_graph.subject_objects(RDF.type)
        if isinstance(subject, URIRef) and type_iri in accepted_types
    }


def instances_of_in(graph: Graph, class_iri: URIRef) -> set[URIRef]:
    accepted_types = subclasses(class_iri)
    return {
        subject
        for subject, type_iri in graph.subject_objects(RDF.type)
        if isinstance(subject, URIRef) and type_iri in accepted_types
    }


# Module identity, metadata, and whole-set version policy.
for path, ontology_iri in MODULES.items():
    graph = Graph().parse(path, format="turtle")
    rel = path.relative_to(ROOT)
    if (ontology_iri, RDF.type, OWL.Ontology) not in graph:
        fail(f"{rel}: missing owl:Ontology declaration for {ontology_iri}")
    required = (
        OWL.versionInfo,
        DCTERMS.title,
        DCTERMS.description,
        DCTERMS.creator,
        DCTERMS.publisher,
        DCTERMS.created,
        DCTERMS.issued,
        DCTERMS.modified,
        DCTERMS.license,
    )
    for predicate in required:
        if not list(graph.objects(ontology_iri, predicate)):
            fail(f"{rel}: missing {predicate.n3()} on module ontology")
    versions = list(graph.objects(ontology_iri, OWL.versionInfo))
    if len(versions) != 1:
        fail(f"{rel}: expected exactly one owl:versionInfo, found {len(versions)}")
    version_iris = list(graph.objects(ontology_iri, OWL.versionIRI))
    if ontology_iri != URIRef("https://w3id.org/sstim") and version_iris:
        fail(f"{rel}: modules must not declare owl:versionIRI (ADR 0020)")
    if versions and "-dev" in str(versions[0]) and version_iris:
        fail(f"{rel}: development sources must not claim an immutable owl:versionIRI")
    if versions and "-dev" not in str(versions[0]) and ontology_iri == URIRef("https://w3id.org/sstim") and not version_iris:
        fail(f"{rel}: release core must declare an immutable owl:versionIRI")

# External upper-model alignments are live logical axioms, not display-only
# links. Keep obsolete terms out and preserve the reviewed technique/protocol
# distinction from the 2026-07-10 external audit.
obsolete_planned_process = URIRef("http://purl.obolibrary.org/obo/OBI_0000011")
if any(obsolete_planned_process in triple for triple in modules):
    fail("live modules must not use obsolete OBI_0000011")

technique = SSTIM.SensoryStimulationTechnique
protocol = SSTIM.SensoryStimulationProtocol
iao_information_content_entity = URIRef("http://purl.obolibrary.org/obo/IAO_0000030")
obi_protocol = URIRef("http://purl.obolibrary.org/obo/OBI_0000272")
if (technique, RDFS.subClassOf, iao_information_content_entity) not in modules:
    fail("SensoryStimulationTechnique must remain an IAO information content entity")
if (technique, RDFS.subClassOf, obi_protocol) in modules:
    fail("SensoryStimulationTechnique must not be aligned to the more specific OBI protocol class")
if (protocol, RDFS.subClassOf, obi_protocol) not in modules:
    fail("SensoryStimulationProtocol must retain its OBI protocol alignment")


# Every local OWL term is readable without dereferencing another document.
term_types = (OWL.Class, OWL.ObjectProperty, OWL.DatatypeProperty, OWL.AnnotationProperty)
local_terms: set[URIRef] = set()
for term_type in term_types:
    for term in modules.subjects(RDF.type, term_type):
        if isinstance(term, URIRef) and str(term).startswith(TERM_NAMESPACES):
            local_terms.add(term)
            if not list(modules.objects(term, RDFS.label)):
                fail(f"{term}: missing rdfs:label")
            if not list(modules.objects(term, SKOS.definition)) and not list(modules.objects(term, RDFS.comment)):
                fail(f"{term}: missing skos:definition or rdfs:comment")

class_property_overlap = named_classes & declared_properties
for term in sorted(class_property_overlap, key=str):
    fail(f"{term}: declared as both an OWL class and property")

for _, predicate, _ in all_graph:
    if str(predicate).startswith(TERM_NAMESPACES) and predicate not in declared_properties:
        fail(f"undeclared local predicate in use: {predicate}")

for predicate in object_properties:
    for subject, value in all_graph.subject_objects(predicate):
        if not isinstance(value, (URIRef, BNode)):
            fail(f"{subject}: object property {predicate} has literal value {value.n3()}")

for predicate in datatype_properties:
    for subject, value in all_graph.subject_objects(predicate):
        if not isinstance(value, Literal):
            fail(f"{subject}: datatype property {predicate} has non-literal value {value}")


# SKOS integrity, navigability, documentation, and materialized inverses.
concepts = {
    concept for concept in modules.subjects(RDF.type, SKOS.Concept) if isinstance(concept, URIRef)
}
schemes = {
    scheme for scheme in modules.subjects(RDF.type, SKOS.ConceptScheme) if isinstance(scheme, URIRef)
}
notations: dict[tuple[URIRef, str], set[URIRef]] = defaultdict(set)

for concept in concepts:
    concept_schemes = list(modules.objects(concept, SKOS.inScheme))
    concept_notations = list(modules.objects(concept, SKOS.notation))
    labels = list(modules.objects(concept, SKOS.prefLabel))
    alternate_labels = set(modules.objects(concept, SKOS.altLabel))
    hidden_labels = set(modules.objects(concept, SKOS.hiddenLabel))
    english = [label for label in labels if isinstance(label, Literal) and label.language == "en"]
    if not concept_schemes:
        fail(f"{concept}: missing skos:inScheme")
    if len(concept_notations) != 1:
        fail(f"{concept}: expected one skos:notation, found {len(concept_notations)}")
    if len(english) != 1:
        fail(f"{concept}: expected one English skos:prefLabel, found {len(english)}")
    by_language: dict[str | None, int] = defaultdict(int)
    for label in labels:
        if isinstance(label, Literal):
            by_language[label.language] += 1
    for language, count in by_language.items():
        if count > 1:
            fail(f"{concept}: {count} skos:prefLabel values for language {language!r}")
    preferred_labels = set(labels)
    if preferred_labels & alternate_labels:
        fail(f"{concept}: the same literal is used as skos:prefLabel and skos:altLabel")
    if preferred_labels & hidden_labels:
        fail(f"{concept}: the same literal is used as skos:prefLabel and skos:hiddenLabel")
    if alternate_labels & hidden_labels:
        fail(f"{concept}: the same literal is used as skos:altLabel and skos:hiddenLabel")
    category_types = {
        type_iri
        for type_iri in modules.objects(concept, RDF.type)
        if isinstance(type_iri, URIRef) and str(type_iri).startswith(TERM_NAMESPACES)
    }
    if not category_types:
        fail(f"{concept}: missing a local OWL controlled-value type")
    if not any(
        list(modules.objects(concept, predicate))
        for predicate in (SKOS.definition, SKOS.scopeNote, SKOS.editorialNote)
    ):
        fail(f"{concept}: missing definition, scope note, or editorial note")
    if len(concept_notations) == 1:
        for scheme in concept_schemes:
            notations[(scheme, str(concept_notations[0]))].add(concept)
    for scheme in modules.objects(concept, SKOS.topConceptOf):
        if (scheme, SKOS.hasTopConcept, concept) not in modules:
            fail(f"{concept}: topConceptOf inverse is not materialized on {scheme}")
    for broader in modules.objects(concept, SKOS.broader):
        if broader not in concepts:
            fail(f"{concept}: broader target {broader} is not a declared skos:Concept")
        if not set(concept_schemes) & set(modules.objects(broader, SKOS.inScheme)):
            fail(f"{concept}: broader target {broader} shares no concept scheme")
        if (broader, SKOS.narrower, concept) not in modules:
            fail(f"{concept}: broader/narrower inverse is not materialized on {broader}")

for (scheme, notation), members in notations.items():
    if len(members) > 1:
        fail(f"{scheme}: duplicate notation {notation!r} on {sorted(map(str, members))}")

for scheme in schemes:
    if not list(modules.objects(scheme, SKOS.prefLabel)):
        fail(f"{scheme}: missing skos:prefLabel")
    if not list(modules.objects(scheme, SKOS.definition)) and not list(modules.objects(scheme, DCTERMS.description)):
        fail(f"{scheme}: missing scheme definition or description")
    tops = list(modules.objects(scheme, SKOS.hasTopConcept))
    if not tops:
        fail(f"{scheme}: missing skos:hasTopConcept")
    for concept in tops:
        if (concept, SKOS.topConceptOf, scheme) not in modules:
            fail(f"{scheme}: hasTopConcept inverse is not materialized on {concept}")
        if (concept, SKOS.inScheme, scheme) not in modules:
            fail(f"{scheme}: top concept {concept} does not belong to the scheme")
        for broader in modules.objects(concept, SKOS.broader):
            if (broader, SKOS.inScheme, scheme) in modules:
                fail(f"{scheme}: top concept {concept} has an in-scheme broader concept {broader}")

for concept in concepts:
    for scheme in modules.objects(concept, SKOS.inScheme):
        frontier = [concept]
        visited: set = set()
        reaches_top = False
        while frontier:
            current = frontier.pop()
            if (scheme, SKOS.hasTopConcept, current) in modules:
                reaches_top = True
                break
            if current in visited:
                continue
            visited.add(current)
            frontier.extend(
                broader
                for broader in modules.objects(current, SKOS.broader)
                if (broader, SKOS.inScheme, scheme) in modules
            )
        if not reaches_top:
            fail(f"{concept}: does not reach a top concept in scheme {scheme}")

for concept in concepts:
    frontier = list(modules.objects(concept, SKOS.broader))
    visited: set = set()
    while frontier:
        current = frontier.pop()
        if current == concept:
            fail(f"{concept}: participates in a skos:broader cycle")
            break
        if current not in visited:
            visited.add(current)
            frontier.extend(modules.objects(current, SKOS.broader))

mapping_predicates = (
    SKOS.exactMatch,
    SKOS.closeMatch,
    SKOS.broadMatch,
    SKOS.narrowMatch,
    SKOS.relatedMatch,
)
mapping_pairs: dict[tuple[URIRef, URIRef], set[URIRef]] = defaultdict(set)
for predicate in mapping_predicates:
    for subject, target in modules.subject_objects(predicate):
        if subject == target:
            fail(f"{subject}: self-mapping via {predicate}")
        if isinstance(subject, URIRef) and isinstance(target, URIRef):
            mapping_pairs[(subject, target)].add(predicate)
for pair, predicates in mapping_pairs.items():
    if len(predicates) > 1:
        fail(f"{pair[0]} -> {pair[1]}: conflicting SKOS mapping predicates {sorted(map(str, predicates))}")


# JSON-LD context must compact every published local class and property.
context_path = ONTOLOGY_DIR / "context.jsonld"
try:
    context = json.loads(context_path.read_text(encoding="utf-8"))["@context"]
except Exception as exc:  # pragma: no cover - validator error path
    fail(f"cannot parse {context_path.relative_to(ROOT)}: {exc}")
    context = {}

prefixes = {
    key: value
    for key, value in context.items()
    if isinstance(value, str) and (value.endswith("#") or value.endswith("/"))
}


def expand_context_id(value: str) -> str:
    if ":" not in value:
        return value
    prefix, local = value.split(":", 1)
    return prefixes.get(prefix, prefix + ":") + local


mapped_context_iris: set[str] = set()
for value in context.values():
    context_id = value if isinstance(value, str) else value.get("@id") if isinstance(value, dict) else None
    if isinstance(context_id, str):
        mapped_context_iris.add(expand_context_id(context_id))

for term in local_terms:
    if str(term) not in mapped_context_iris:
        fail(f"context.jsonld: no compact term for {term}")


# Context @type coercions must be compatible with every value the repository
# graph actually holds (audit KR-14): an @id coercion tolerates only IRI or
# blank-node objects, and a datatype coercion tolerates only literals of
# exactly that datatype. Properties whose values legitimately vary must stay
# uncoerced so explicit @value/@type objects survive compaction.
for compact_term, spec in context.items():
    if not isinstance(spec, dict) or "@type" not in spec or "@container" in spec:
        continue
    coerced_property = URIRef(expand_context_id(spec["@id"]))
    coercion = spec["@type"]
    for subject, obj in all_graph.subject_objects(coerced_property):
        if coercion == "@id":
            if isinstance(obj, Literal):
                fail(
                    f"context.jsonld: '{compact_term}' coerces {coerced_property} to @id "
                    f"but {subject} holds the literal {obj!r}"
                )
        elif isinstance(obj, Literal):
            expected = URIRef(expand_context_id(coercion))
            actual = obj.datatype or XSD.string
            if actual != expected:
                fail(
                    f"context.jsonld: '{compact_term}' coerces {coerced_property} to {coercion} "
                    f"but {subject} holds a {actual} literal {obj!r}"
                )
        else:
            fail(
                f"context.jsonld: '{compact_term}' coerces {coerced_property} to {coercion} "
                f"but {subject} holds the IRI {obj}"
            )


# The browser's explicit loader manifest must include every committed instance.
loader_text = (ROOT / "src" / "rdf" / "loader.js").read_text(encoding="utf-8")
manifest_paths = {
    INSTANCE_DIR / match
    for match in re.findall(r"'/ontology/instances/([^']+\.ttl)'", loader_text)
}
for path in sorted(set(instance_paths) - manifest_paths):
    fail(f"src/rdf/loader.js: missing instance manifest entry for {path.relative_to(ROOT)}")
for path in sorted(manifest_paths - set(instance_paths)):
    fail(f"src/rdf/loader.js: manifest references missing file {path.relative_to(ROOT)}")

# Real ecosystem records and synthetic contract fixtures have separate loader
# families and runtime graphs. A newly committed file must appear in exactly the
# family implied by its path, preventing fixtures from silently entering the
# future public graph (or real records from hiding in fixture metadata).
def loader_family_paths(family: str) -> set[Path]:
    matches = re.findall(
        rf"^  {re.escape(family)}:\s*\[(.*?)\],\s*$",
        loader_text,
        flags=re.MULTILINE | re.DOTALL,
    )
    if len(matches) != 1:
        fail(f"src/rdf/loader.js: expected one INSTANCE_URLS.{family} array")
        return set()
    return {
        INSTANCE_DIR / match
        for match in re.findall(r"'/ontology/instances/([^']+\.ttl)'", matches[0])
    }


if loader_family_paths("ecosystem") != set(ecosystem_real_paths):
    fail("src/rdf/loader.js: INSTANCE_URLS.ecosystem must contain every real ecosystem file and no fixtures")
if loader_family_paths("ecosystemFixtures") != set(ecosystem_fixture_paths):
    fail("src/rdf/loader.js: INSTANCE_URLS.ecosystemFixtures must contain every ecosystem fixture and no real files")

namespaces_text = (ROOT / "src" / "rdf" / "namespaces.js").read_text(encoding="utf-8")
expected_graph_declarations = {
    "ECOSYSTEM_AGENTS_GRAPH_IRI": ECOSYSTEM_AGENTS_GRAPH,
    "ECOSYSTEM_FIXTURE_GRAPH_IRI": ECOSYSTEM_FIXTURE_GRAPH,
}
for constant, graph_iri in expected_graph_declarations.items():
    declaration = f"export const {constant} = namedNode('{graph_iri}')"
    if declaration not in namespaces_text:
        fail(f"src/rdf/namespaces.js: {constant} must identify {graph_iri}")
    if constant not in loader_text or f"graph: {constant}.value" not in loader_text:
        fail(f"src/rdf/loader.js: loader family must use shared {constant}")

if "ecosystem: INSTANCE_URLS.ecosystem.map" not in loader_text:
    fail("src/rdf/loader.js: real ecosystem instances need a dedicated INSTANCE_SOURCES family")
if "ecosystemFixtures: INSTANCE_URLS.ecosystemFixtures.map" not in loader_text:
    fail("src/rdf/loader.js: ecosystem fixtures need a dedicated INSTANCE_SOURCES family")

ecosystem_url_blocks = re.findall(
    r"^  ecosystem:\s*\[(.*?)\],\s*$",
    loader_text,
    flags=re.MULTILINE | re.DOTALL,
)
ecosystem_loader_urls = (
    set(re.findall(r"'(https://[^']+\.ttl)'", ecosystem_url_blocks[0]))
    if len(ecosystem_url_blocks) == 1
    else set()
)
if len(ecosystem_url_blocks) != 1:
    fail("src/rdf/loader.js: expected one external INSTANCE_URLS.ecosystem array")
if ecosystem_loader_urls != {str(ECOSYSTEM_PUBLIC_DUMP)}:
    fail("src/rdf/loader.js: real ecosystem family must load exactly the external mutable dump")
ecosystem_source_block = re.search(
    r"ecosystem: INSTANCE_URLS\.ecosystem\.map\(url => \(\{(.*?)\}\)\),",
    loader_text,
    flags=re.DOTALL,
)
if ecosystem_source_block is None or not all(
    marker in ecosystem_source_block.group(1)
    for marker in ("external: true", "optional: true")
):
    fail("src/rdf/loader.js: external ecosystem source must be marked external and optional")


# /organization/, /specialist/, and /ecosystem-record/ are owned exclusively by
# the ecosystem instance family. This is both a namespace-boundary check and a
# guard against accidentally placing named people in reusable ontology modules.
instance_subject_owners: dict[URIRef, set[Path]] = defaultdict(set)
for path in instance_paths:
    graph = Graph()
    try:
        graph.parse(path, format="turtle")
    except Exception:
        # parse_graph() already emitted the actionable parse error above.
        continue
    for subject in graph.subjects():
        if isinstance(subject, URIRef):
            instance_subject_owners[subject].add(path)


def ecosystem_owner_family(path: Path) -> str | None:
    if path.parent == ECOSYSTEM_REAL_DIR:
        return "real"
    if path.parent == ECOSYSTEM_FIXTURE_DIR:
        return "fixture"
    return None


for subject, owners in instance_subject_owners.items():
    if not str(subject).startswith(ECOSYSTEM_INSTANCE_PREFIXES):
        continue
    families = {ecosystem_owner_family(owner) for owner in owners}
    if None in families:
        outside = sorted(
            str(owner.relative_to(ROOT))
            for owner in owners
            if ecosystem_owner_family(owner) is None
        )
        fail(f"{subject}: reserved ecosystem instance IRI is declared outside its family in {outside}")
    if len(families) > 1:
        fail(f"{subject}: reserved ecosystem instance IRI is mixed across real and fixture files")
    slug = str(subject).rsplit("/", 1)[-1]
    if families == {"fixture"} and not slug.startswith("synthetic-"):
        fail(f"{subject}: fixture ecosystem subjects must reserve the synthetic-* slug")
    if families == {"real"} and slug.startswith("synthetic-"):
        fail(f"{subject}: live ecosystem subjects must not use the synthetic-* slug")


# Functional properties are treated as operational single-value contracts.
functional_properties = set(modules.subjects(RDF.type, OWL.FunctionalProperty))
for predicate in functional_properties:
    for subject in set(all_graph.subjects(predicate, None)):
        values = set(all_graph.objects(subject, predicate))
        if len(values) > 1:
            fail(f"{subject}: functional property {predicate} has {len(values)} values")


# Evidence assessments must be scoped, attributable, basis-backed, and never
# bare EvidenceClaims (ADR 0027).
EVASSESS = SSTIM.EvidenceAssessmentClaim
claims = instances_of(SSTIM.EvidenceClaim)
assessments = instances_of(EVASSESS)
for claim in claims:
    if claim not in assessments:
        fail(f"{claim}: bare sstim:EvidenceClaim without the EvidenceAssessmentClaim subtype (ADR 0027)")
for claim in assessments:
    requirements = (
        (RDFS.label, "rdfs:label"),
        (DCTERMS.description, "dct:description"),
        (SSTIM.hasEvidenceTier, "sstim:hasEvidenceTier"),
        (SSTIM.hasClaimDirection, "sstim:hasClaimDirection"),
        (SSTIM.evaluatesSubject, "sstim:evaluatesSubject"),
        (SSTIM.assessesProposition, "sstim:assessesProposition"),
        (SSTIM.hasEvidenceBasis, "sstim:hasEvidenceBasis"),
        (DCTERMS.modified, "dct:modified"),
        (PROV.wasAttributedTo, "prov:wasAttributedTo"),
    )
    for predicate, name in requirements:
        if not objects(claim, predicate):
            fail(f"{claim}: missing {name}")
    # Deprecated evidence-only metadata must not remain on authoritative assessments.
    for predicate, name in ((SSTIM.hasModalityTag, "sstim:hasModalityTag"),
                            (SSTIM.hasReviewStatus, "sstim:hasReviewStatus"),
                            (SSTIM.evidenceDate, "sstim:evidenceDate")):
        if objects(claim, predicate):
            fail(f"{claim}: deprecated {name} must not appear on an authoritative EvidenceAssessmentClaim (ADR 0027)")
    # Every bibliographic basis source must be mirrored by a citesReference.
    for basis in objects(claim, SSTIM.hasEvidenceBasis):
        for source in objects(basis, SSTIM.basisSource):
            if source in instances_of(SSTIM.BibliographicReference) and source not in objects(claim, SSTIM.citesReference):
                fail(f"{claim}: bibliographic basis {source} lacks a matching citesReference")
    for reference in objects(claim, SSTIM.citesReference):
        if reference not in instances_of(SSTIM.BibliographicReference):
            fail(f"{claim}: cites undeclared BibliographicReference {reference}")


# Bibliographic identifiers must resolve to the same DOI recorded as source.
references = instances_of(SSTIM.PublicSafeReference)
reference_keys: dict[str, set[URIRef]] = defaultdict(set)
for reference in references:
    keys = objects(reference, SSTIM.referenceKey)
    if len(keys) == 1:
        reference_keys[str(keys[0])].add(reference)
    doi_identifiers = [
        str(value)[4:]
        for value in objects(reference, DCTERMS.identifier)
        if str(value).lower().startswith("doi:")
    ]
    if not doi_identifiers:
        fail(f"{reference}: missing DOI-form dct:identifier")
    sources = set(objects(reference, DCTERMS.source))
    for doi in doi_identifiers:
        expected_source = URIRef(f"https://doi.org/{doi}")
        if expected_source not in sources:
            fail(f"{reference}: DOI identifier doi:{doi} lacks matching dct:source {expected_source}")
for key, members in reference_keys.items():
    if len(members) > 1:
        fail(f"duplicate referenceKey {key!r} on {sorted(map(str, members))}")


# Protocol, preset, caution, and session competency contracts.
protocols = instances_of(SSTIM.SensoryStimulationProtocol)
for protocol in protocols:
    if not objects(protocol, SSTIM.definedByFramework):
        fail(f"{protocol}: protocol is not linked to a defining framework")
    if not objects(protocol, SSTIM.usesTechnique) and not objects(protocol, SKOS.editorialNote):
        fail(f"{protocol}: protocol has neither a technique nor a baseline/boundary explanation")

presets = instances_of(SSTIM.Preset)
for preset in presets:
    for predicate, name in (
        (SSTIM.forImplementation, "forImplementation"),
        (SSTIM.followsProtocol, "followsProtocol"),
        (SSTIM.hasPublicClaimLevel, "hasPublicClaimLevel"),
    ):
        if not objects(preset, predicate):
            fail(f"{preset}: missing {name}")

caution_tags = instances_of(SSTIM.CautionTag)
caution_order: dict[tuple[URIRef, int], set[URIRef]] = defaultdict(set)
for caution in caution_tags:
    for predicate, name in (
        (SSTIM.hasCautionSeverity, "hasCautionSeverity"),
        (SSTIM.triggerCondition, "triggerCondition"),
        (SSTIM.affectedPopulation, "affectedPopulation"),
        (SSTIM.recommendedAction, "recommendedAction"),
        (SSTIM.displayPriority, "displayPriority"),
    ):
        if not objects(caution, predicate):
            fail(f"{caution}: missing {name}")
    severities = objects(caution, SSTIM.hasCautionSeverity)
    priorities = objects(caution, SSTIM.displayPriority)
    if len(severities) == 1 and len(priorities) == 1:
        caution_order[(severities[0], int(priorities[0]))].add(caution)
for order_key, members in caution_order.items():
    if len(members) > 1:
        fail(
            f"duplicate caution displayPriority {order_key[1]} in severity {order_key[0]} "
            f"on {sorted(map(str, members))}"
        )

sessions = instances_of(SSTIM.SessionInstance)
self_reports = instances_of(SSTIM.SelfReport)


# Session timing makes phase-qualified observations operationally interpretable.
for session in sessions:
    starts = objects(session, PROV.startedAtTime)
    ends = objects(session, PROV.endedAtTime)
    durations = objects(session, SSTIM.actualDurationSeconds)
    if len(starts) == 1 and len(ends) == 1:
        start = starts[0].toPython() if isinstance(starts[0], Literal) else None
        end = ends[0].toPython() if isinstance(ends[0], Literal) else None
        if isinstance(start, datetime) and isinstance(end, datetime) and start >= end:
            fail(f"{session}: start timestamp must precede end timestamp")
        if (
            len(durations) == 1
            and isinstance(start, datetime)
            and isinstance(end, datetime)
            and int(durations[0]) > (end - start).total_seconds() + 1
        ):
            fail(f"{session}: actualDurationSeconds exceeds elapsed wall-clock duration")

for report in self_reports:
    linked_sessions = set(all_graph.subjects(SSTIM.hasSelfReport, report))
    if len(linked_sessions) != 1:
        fail(f"{report}: expected association with exactly one session, found {len(linked_sessions)}")
        continue
    phases = objects(report, SSTIM.hasReportPhase)
    generated_values = objects(report, PROV.generatedAtTime)
    if len(phases) != 1 or len(generated_values) != 1:
        continue
    generated = generated_values[0].toPython() if isinstance(generated_values[0], Literal) else None
    if not isinstance(generated, datetime):
        continue
    session = next(iter(linked_sessions))
    starts = objects(session, PROV.startedAtTime)
    ends = objects(session, PROV.endedAtTime)
    start = starts[0].toPython() if len(starts) == 1 and isinstance(starts[0], Literal) else None
    end = ends[0].toPython() if len(ends) == 1 and isinstance(ends[0], Literal) else None
    if phases[0] == VOCAB.reportPreSession and isinstance(start, datetime) and generated > start:
        fail(f"{report}: pre-session report timestamp is after session start")
    if phases[0] == VOCAB.reportImmediatePost and isinstance(end, datetime) and generated < end:
        fail(f"{report}: immediate-post report timestamp is before session end")
    if phases[0] == VOCAB.reportFollowUp and isinstance(end, datetime) and generated <= end:
        fail(f"{report}: follow-up report timestamp must be after session end")


# Ecosystem namespace and ownership contracts complement SHACL with repository-
# level checks that know which file family owns each public IRI.
ecosystem_agents = instances_of(ECOSYSTEM.EcosystemAgent)
ecosystem_relationships = instances_of(ECOSYSTEM.EcosystemRelationship)
organization_memberships = instances_of(ECOSYSTEM.OrganizationMembership)
implementation_responsibilities = instances_of(ECOSYSTEM.ImplementationResponsibility)
engagement_activities = instances_of(ECOSYSTEM.EngagementActivity)
organization_roles = {
    subject
    for subject in ecosystem_instances.subjects(RDF.type, ORG.Role)
    if isinstance(subject, URIRef)
}

# VoID partitions are checked for the repository-owned fixture graph. The live
# external graph is mutable, so volatile entity counts must not be frozen here.
def ecosystem_partition_counts(graph: Graph) -> dict[URIRef, int]:
    return {
        ECOSYSTEM.EcosystemAgent: len(instances_of_in(graph, ECOSYSTEM.EcosystemAgent)),
        ECOSYSTEM.EcosystemRelationship: len(instances_of_in(graph, ECOSYSTEM.EcosystemRelationship)),
        ECOSYSTEM.OrganizationMembership: len(instances_of_in(graph, ECOSYSTEM.OrganizationMembership)),
        ECOSYSTEM.ImplementationResponsibility: len(instances_of_in(graph, ECOSYSTEM.ImplementationResponsibility)),
        ECOSYSTEM.EngagementActivity: len(instances_of_in(graph, ECOSYSTEM.EngagementActivity)),
        ORG.Role: len({
            subject
            for subject in graph.subjects(RDF.type, ORG.Role)
            if isinstance(subject, URIRef)
        }),
    }


def check_void_partitions(dataset: URIRef, graph: Graph, label: str) -> None:
    expected = ecosystem_partition_counts(graph)
    declared: dict[URIRef, list[Literal]] = defaultdict(list)
    for partition in void_graph.objects(dataset, VOID.classPartition):
        partition_classes = list(void_graph.objects(partition, VOID["class"]))
        partition_counts = list(void_graph.objects(partition, VOID.entities))
        if len(partition_classes) != 1:
            fail(f"void.ttl: each {label} void:classPartition must declare exactly one void:class")
            continue
        declared[partition_classes[0]].extend(partition_counts)
    if set(declared) != set(expected):
        fail(f"void.ttl: {label} classPartition inventory is incomplete or has drifted")
    for class_iri, expected_count in expected.items():
        values = declared.get(class_iri, [])
        if values != [Literal(expected_count)]:
            fail(f"void.ttl: {label} partition {class_iri} void:entities must be {expected_count}")


if list(void_graph.objects(ECOSYSTEM_AGENTS_GRAPH, VOID.classPartition)):
    fail("void.ttl: mutable ecosystem-agent graph must omit volatile class partitions")
check_void_partitions(ECOSYSTEM_FIXTURE_GRAPH, ecosystem_fixture_instances, "ecosystem-fixture")

# The stable framework/implementation catalog is fail-closed as well: every
# catalog identity has one exact HTML rule and one exact RDF rule to its owning
# static instance file. This keeps similarly named resources (especially the
# Patch Studio tool and ontology module) from being conflated by broad routes.
w3id_text = W3ID_STAGING_FILE.read_text(encoding="utf-8")

# Persistent module/profile routes must cover the manifest exactly. Validate
# the complete directive matrix, not just route-slug counts: every supported
# representation must map to its exact artifact, q=0/unsupported requests must
# reach 406, and no shadow copy may occur elsewhere in the file.
manifest_route_start = "# BEGIN audited SSTIM manifest routes"
manifest_route_end = "# END audited SSTIM manifest routes"


def directive_lines(block: str) -> tuple[str, ...]:
    return tuple(
        line.strip()
        for line in block.splitlines()
        if line.strip().startswith(("RewriteCond", "RewriteRule"))
    )


if w3id_text.count(manifest_route_start) != 1 or w3id_text.count(manifest_route_end) != 1:
    fail("w3id staging: expected one delimited SSTIM manifest route block")
else:
    manifest_route_block = w3id_text.split(manifest_route_start, 1)[1].split(
        manifest_route_end, 1
    )[0]

    def negotiated_directives(
        pattern: str,
        *,
        json_ld: str,
        rdf_xml: str,
        html: str,
        turtle: str,
    ) -> tuple[str, ...]:
        return (
            JSON_LD_ACCEPT,
            f"RewriteRule {pattern} {json_ld} [R=303,L]",
            RDF_XML_ACCEPT,
            f"RewriteRule {pattern} {rdf_xml} [R=303,L]",
            HTML_ACCEPT,
            f"RewriteRule {pattern} {html} [R=303,L]",
            EMPTY_ACCEPT,
            TURTLE_ACCEPT,
            f"RewriteRule {pattern} {turtle} [R=303,L]",
            f"RewriteRule {pattern} - [R=406,L]",
        )

    module_slugs = [
        module["publication"]["persistentUrl"].removeprefix(
            "https://w3id.org/sstim/"
        )
        for module in MANIFEST["modules"]
    ]
    profile_slugs = [profile["id"] for profile in MANIFEST["profiles"]]
    ordinary_module_slugs = [
        slug for slug in module_slugs if slug not in {"kernel", "module/exposure"}
    ]
    profile_pattern = rf"^profile/({'|'.join(profile_slugs)})$"
    module_pattern = rf"^({'|'.join(ordinary_module_slugs)})$"
    expected_manifest_directives = (
        "RewriteRule ^manifest$ https://labiosyncare.github.io/ontology/manifest.json [R=303,L]",
        "RewriteRule ^manifest-schema/1$ https://labiosyncare.github.io/ontology/manifest.schema.json [R=303,L]",
        *negotiated_directives(
            profile_pattern,
            json_ld="https://labiosyncare.github.io/ontology/sstim-$1-profile.jsonld",
            rdf_xml="https://labiosyncare.github.io/ontology/sstim-$1-profile.rdf",
            html="https://labiosyncare.github.io/ontology/docs/",
            turtle="https://labiosyncare.github.io/ontology/sstim-$1-profile.ttl",
        ),
        *negotiated_directives(
            "^kernel$",
            json_ld="https://labiosyncare.github.io/ontology/sstim-core.jsonld",
            rdf_xml="https://labiosyncare.github.io/ontology/sstim-core.rdf",
            html="https://labiosyncare.github.io/ontology/docs/",
            turtle="https://labiosyncare.github.io/ontology/sstim-core.ttl",
        ),
        *negotiated_directives(
            "^exposure$",
            json_ld="https://labiosyncare.github.io/ontology/sstim-exposure-namespace.jsonld",
            rdf_xml="https://labiosyncare.github.io/ontology/sstim-exposure-namespace.rdf",
            html="https://labiosyncare.github.io/ontology/docs/",
            turtle="https://labiosyncare.github.io/ontology/sstim-exposure-namespace.ttl",
        ),
        *negotiated_directives(
            "^module/exposure$",
            json_ld="https://labiosyncare.github.io/ontology/sstim-exposure.jsonld",
            rdf_xml="https://labiosyncare.github.io/ontology/sstim-exposure.rdf",
            html="https://labiosyncare.github.io/ontology/docs/",
            turtle="https://labiosyncare.github.io/ontology/sstim-exposure.ttl",
        ),
        *negotiated_directives(
            module_pattern,
            json_ld="https://labiosyncare.github.io/ontology/sstim-$1.jsonld",
            rdf_xml="https://labiosyncare.github.io/ontology/sstim-$1.rdf",
            html="https://labiosyncare.github.io/ontology/docs/",
            turtle="https://labiosyncare.github.io/ontology/sstim-$1.ttl",
        ),
        *negotiated_directives(
            "^$",
            json_ld="https://labiosyncare.github.io/ontology/sstim-namespace.jsonld",
            rdf_xml="https://labiosyncare.github.io/ontology/sstim-namespace.rdf",
            html="https://labiosyncare.github.io/",
            turtle="https://labiosyncare.github.io/ontology/sstim-namespace.ttl",
        ),
    )
    if directive_lines(manifest_route_block) != expected_manifest_directives:
        fail(
            "w3id staging: manifest-owned route/media matrix does not exactly "
            "match module, profile, namespace, and artifact targets"
        )

    # A second rule for any managed path can shadow or silently diverge from the
    # audited block even when the block itself remains internally complete.
    outside_manifest_block = w3id_text.split(manifest_route_start, 1)[0] + w3id_text.split(
        manifest_route_end, 1
    )[1]
    managed_paths = {
        "",
        "exposure",
        "manifest",
        "manifest-schema/1",
        *module_slugs,
        *(f"profile/{slug}" for slug in profile_slugs),
    }
    for directive in directive_lines(outside_manifest_block):
        if not directive.startswith("RewriteRule "):
            continue
        source_pattern = directive.split(maxsplit=2)[1]
        try:
            source_re = re.compile(source_pattern)
        except re.error:
            continue
        if any(source_re.fullmatch(path) for path in managed_paths):
            fail(
                "w3id staging: manifest-owned route is duplicated outside its "
                f"audited block: {source_pattern}"
            )


# Prove that the canonical Accept expressions are case-insensitive, reject
# explicit q=0, return 406 for unsupported-only requests, and retain a stable
# precedence when a client lists more than one supported representation.
def negotiated_kind(header: str) -> str | None:
    for kind, pattern in (
        ("jsonld", _JSON_LD_ACCEPT_RE),
        ("rdfxml", _RDF_XML_ACCEPT_RE),
        ("html", _HTML_ACCEPT_RE),
    ):
        if re.search(pattern, header, flags=re.IGNORECASE):
            return kind
    if not header or re.search(_TURTLE_ACCEPT_RE, header, flags=re.IGNORECASE):
        return "turtle"
    return None


accept_contract = {
    "": "turtle",
    "*/*": "turtle",
    "TEXT/TURTLE": "turtle",
    "APPLICATION/LD+JSON": "jsonld",
    "application/rdf+xml": "rdfxml",
    "text/html": "html",
    "text/html;q=0, application/ld+json": "jsonld",
    "application/rdf+xml;q=0, text/html": "html",
    "application/ld+json;q=0.01": "jsonld",
    "application/ld+json;q=0": None,
    "application/ld+json;q=0.000": None,
    "*/*;q=0": None,
    "application/json": None,
    "text/html, application/ld+json": "jsonld",
}
for accept_header, expected_kind in accept_contract.items():
    if negotiated_kind(accept_header) != expected_kind:
        fail(
            "w3id staging: canonical Accept matcher failed for "
            f"{accept_header!r}; expected {expected_kind!r}"
        )

if w3id_text.count('Header always set Vary "Accept"') != 1:
    fail("w3id staging: expected exactly one always-on Vary: Accept directive")


# The immutable snapshot route region is generated from actual frozen files.
# Unknown versions/files must remain 404 instead of receiving a redirect to a
# missing Pages target. Modular snapshots gain manifest and frozen-schema routes
# only when the corresponding sidecars are present in that exact directory.
snapshot_route_start = "# BEGIN generated exact SSTIM snapshot routes"
snapshot_route_end = "# END generated exact SSTIM snapshot routes"
if w3id_text.count(snapshot_route_start) != 1 or w3id_text.count(snapshot_route_end) != 1:
    fail("w3id staging: expected one generated exact SSTIM snapshot route region")
else:
    snapshot_route_block = w3id_text.split(snapshot_route_start, 1)[1].split(
        snapshot_route_end, 1
    )[0]
    expected_snapshot_directives: list[str] = []
    snapshot_directories = sorted(
        (
            path
            for path in ONTOLOGY_DIR.iterdir()
            if path.is_dir() and re.fullmatch(r"\d+\.\d+\.\d+", path.name)
        ),
        key=lambda path: tuple(int(part) for part in path.name.split(".")),
    )
    for directory in snapshot_directories:
        version = directory.name
        version_pattern = version.replace(".", r"\.")
        files = sorted(path.name for path in directory.iterdir() if path.is_file())
        turtle_files = [file for file in files if file.endswith(".ttl")]
        if "sstim-core.ttl" not in turtle_files:
            fail(f"w3id staging: {version} snapshot lacks sstim-core.ttl")
            continue
        turtle_pattern = "|".join(file.replace(".", r"\.") for file in turtle_files)
        expected_snapshot_directives.append(
            f"RewriteRule ^{version_pattern}/({turtle_pattern})$ "
            f"https://labiosyncare.github.io/ontology/{version}/$1 [R=302,L]"
        )
        if "manifest.json" in files:
            expected_snapshot_directives.append(
                f"RewriteRule ^{version_pattern}/manifest$ "
                f"https://labiosyncare.github.io/ontology/{version}/manifest.json [R=302,L]"
            )
        if "manifest.schema.json" in files:
            expected_snapshot_directives.append(
                f"RewriteRule ^{version_pattern}/manifest\\.schema\\.json$ "
                f"https://labiosyncare.github.io/ontology/{version}/manifest.schema.json [R=302,L]"
            )
        expected_snapshot_directives.append(
            f"RewriteRule ^{version_pattern}/?$ "
            f"https://labiosyncare.github.io/ontology/{version}/sstim-core.ttl [R=302,L]"
        )
    if directive_lines(snapshot_route_block) != tuple(expected_snapshot_directives):
        fail(
            "w3id staging: frozen snapshot routes do not exactly match the "
            "repository snapshot artifact inventory"
        )

void_route_start = "# BEGIN audited SSTIM void routes"
void_route_end = "# END audited SSTIM void routes"
if w3id_text.count(void_route_start) != 1 or w3id_text.count(void_route_end) != 1:
    fail("w3id staging: expected one audited SSTIM void route block")
else:
    void_route_block = w3id_text.split(void_route_start, 1)[1].split(
        void_route_end, 1
    )[0]
    expected_void_directives = (
        HTML_ACCEPT,
        "RewriteRule ^void$ https://labiosyncare.github.io/ [R=303,L]",
        EMPTY_ACCEPT,
        TURTLE_ACCEPT,
        "RewriteRule ^void$ https://labiosyncare.github.io/ontology/void.ttl [R=303,L]",
        "RewriteRule ^void$ - [R=406,L]",
    )
    if directive_lines(void_route_block) != expected_void_directives:
        fail("w3id staging: VoID HTML/Turtle/406 route matrix has drifted")


def check_exact_w3id_route_block(
    block_name: str, expected_routes: dict[str, str]
) -> None:
    """Assert exact HTML/Turtle/406 directives for a delimited route block."""
    start = f"# BEGIN audited {block_name} routes"
    end = f"# END audited {block_name} routes"
    if w3id_text.count(start) != 1 or w3id_text.count(end) != 1:
        fail(f"w3id staging: expected one delimited {block_name} route block")
        return

    block = w3id_text.split(start, 1)[1].split(end, 1)[0]
    all_routes = "|".join(expected_routes)
    expected_directives: list[str] = [
        HTML_ACCEPT,
        f"RewriteRule ^({all_routes})/?$ https://labiosyncare.github.io/ [R=303,L]",
    ]
    routes_by_target: dict[str, list[str]] = {}
    for route, target in expected_routes.items():
        routes_by_target.setdefault(target, []).append(route)
    for target, routes in routes_by_target.items():
        pattern = f"^({'|'.join(routes)})/?$"
        expected_directives.extend(
            (
                EMPTY_ACCEPT,
                TURTLE_ACCEPT,
                f"RewriteRule {pattern} {target} [R=303,L]",
                f"RewriteRule {pattern} - [R=406,L]",
            )
        )
    if directive_lines(block) != tuple(expected_directives):
        fail(
            f"w3id staging: {block_name} block must exactly map every HTML and "
            "Turtle request and reject unsupported/q=0 requests"
        )


check_exact_w3id_route_block("BSC catalog", CATALOG_PUBLIC_ROUTES)
check_exact_w3id_route_block("BSC technique", TECHNIQUE_PUBLIC_ROUTES)

# Fixture identities deliberately use the production IRI grammar required by
# the released SHACL contract, but synthetic-* is a reserved, non-routed slug.
fixture_route_markers = (
    "# BEGIN audited synthetic ecosystem fixture routes",
    "# END audited synthetic ecosystem fixture routes",
    "synthetic-alex-rivera",
    "synthetic-aurora-lab",
    "synthetic-resonance-coop",
    "ontology/instances/ecosystem/fixtures/synthetic-ecosystem.ttl",
)
if any(marker in w3id_text for marker in fixture_route_markers):
    fail("w3id staging: synthetic fixture identifiers must not have registry routes")

# Live records use stable namespace-level rules. Membership belongs to the
# mutable aggregate, so adding or retracting a subject must not require a
# person-specific registry change.
real_w3id_start = "# BEGIN audited live ecosystem namespace routes"
real_w3id_end = "# END audited live ecosystem namespace routes"
if w3id_text.count(real_w3id_start) != 1 or w3id_text.count(real_w3id_end) != 1:
    fail("w3id staging: expected one delimited live ecosystem namespace block")
else:
    real_route_block = w3id_text.split(real_w3id_start, 1)[1].split(real_w3id_end, 1)[0]
    live_directives = tuple(
        line.strip()
        for line in real_route_block.splitlines()
        if line.strip().startswith(("RewriteCond", "RewriteRule"))
    )
    expected_live_directives = (
        HTML_ACCEPT,
        r"RewriteRule ^(specialist|organization)/(?!synthetic-)[A-Za-z0-9._~-]+/?$ "
        "https://labiosyncare.github.io/ [R=303,L]",
        HTML_ACCEPT,
        r"RewriteRule ^ecosystem-record/(relationship|activity|role)/"
        r"(?!synthetic-)[A-Za-z0-9._~-]+/?$ https://labiosyncare.github.io/ [R=303,L]",
        EMPTY_ACCEPT,
        TURTLE_ACCEPT,
        r"RewriteRule ^(specialist|organization)/(?!synthetic-)[A-Za-z0-9._~-]+/?$ "
        f"{ECOSYSTEM_PUBLIC_DUMP} [R=303,L]",
        r"RewriteRule ^(specialist|organization)/(?!synthetic-)[A-Za-z0-9._~-]+/?$ "
        "- [R=406,L]",
        EMPTY_ACCEPT,
        TURTLE_ACCEPT,
        r"RewriteRule ^ecosystem-record/(relationship|activity|role)/"
        rf"(?!synthetic-)[A-Za-z0-9._~-]+/?$ {ECOSYSTEM_PUBLIC_DUMP} [R=303,L]",
        r"RewriteRule ^ecosystem-record/(relationship|activity|role)/"
        r"(?!synthetic-)[A-Za-z0-9._~-]+/?$ - [R=406,L]",
    )
    if live_directives != expected_live_directives:
        fail(
            "w3id staging: live ecosystem block must contain only the canonical "
            "namespace-level HTML, Turtle, and 406 routes"
        )

for agent in ecosystem_agents:
    owners = instance_subject_owners.get(agent, set())
    if not owners:
        fail(f"{agent}: ecosystem agent has no owning instance file")
    elif any(ecosystem_owner_family(owner) is None for owner in owners):
        fail(f"{agent}: ecosystem agent must be owned by a real or fixture ecosystem file")

    is_person = (agent, RDF.type, SCHEMA.Person) in all_graph
    is_organization = (agent, RDF.type, SCHEMA.Organization) in all_graph
    if is_person == is_organization:
        fail(f"{agent}: expected exactly one explicit schema:Person/schema:Organization type")
    elif is_person and not str(agent).startswith("https://w3id.org/sstim/specialist/"):
        fail(f"{agent}: schema:Person must use the /specialist/ namespace")
    elif is_organization and not str(agent).startswith("https://w3id.org/sstim/organization/"):
        fail(f"{agent}: schema:Organization must use the /organization/ namespace")

for record in ecosystem_relationships | engagement_activities:
    if not str(record).startswith("https://w3id.org/sstim/ecosystem-record/"):
        fail(f"{record}: qualified ecosystem records must use /ecosystem-record/ IRIs")
    owners = instance_subject_owners.get(record, set())
    if not owners:
        fail(f"{record}: qualified ecosystem record has no owning instance file")
    elif any(ecosystem_owner_family(owner) is None for owner in owners):
        fail(f"{record}: qualified ecosystem record must be owned by a real or fixture ecosystem file")


# Local object IRIs should resolve to a declared resource in the graph set.
declared_subjects = {subject for subject in all_graph.subjects() if isinstance(subject, URIRef)}
for _, _, obj in all_graph:
    if not isinstance(obj, URIRef):
        continue
    obj_text = str(obj)
    must_resolve = obj_text.startswith(TERM_NAMESPACES) or obj_text.startswith(INSTANCE_PREFIXES)
    if must_resolve and obj not in declared_subjects and obj_text not in LIVE_PROJECTION_REFERENCES:
        fail(f"dangling local IRI reference: {obj}")


# Executable competency thresholds prevent a superficially valid but empty graph.
counts = {
    "classes": len(named_classes),
    "anonymous class expressions": len(anonymous_classes),
    "properties": len(declared_properties),
    "concepts": len(concepts),
    "schemes": len(schemes),
    # Techniques the BSC framework covers, across both relations: the ones it
    # originated (definesTechnique) and the vendor-neutral ones it applies but
    # did not originate (incorporatesTechnique). Counting only the former would
    # under-report coverage after the ADR 0033 deduplication.
    "framework techniques": len(
        set(objects(URIRef("https://w3id.org/sstim/framework/bsc"), SSTIM.definesTechnique))
        | set(objects(URIRef("https://w3id.org/sstim/framework/bsc"), SSTIM.incorporatesTechnique))
    ),
    "protocols": len(protocols),
    "presets": len(presets),
    "evidence assessments": len(assessments),
    "knowledge-status assertions": len(instances_of(EXPOSURE.KnowledgeStatusAssertion)),
    "exposure hypotheses": len(instances_of(EXPOSURE.ExposureHypothesis)),
    "references": len(references),
    "exposure profiles": len(instances_of(EXPOSURE.ExposureProfile)),
    "sessions": len(sessions),
    "self reports": len(self_reports),
    "ecosystem agents": len(ecosystem_agents),
    "ecosystem relationships": len(ecosystem_relationships),
    "organization memberships": len(organization_memberships),
    "implementation responsibilities": len(implementation_responsibilities),
    "engagement activities": len(engagement_activities),
    "organization roles": len(organization_roles),
}
minimums = {
    "classes": 55,
    "properties": 120,
    "concepts": 295,
    "schemes": 30,
    "framework techniques": 7,
    # ADR 0034 reparented sstim-ex:ExploratoryProtocol off SensoryStimulationProtocol
    # so that a baseline defined by the absence of stimulation, a mere-exposure
    # ambient-field hypothesis, and a capability-boundary document stop being
    # typed as sensory stimulation by inheritance. Seven of the ten exploratory
    # protocols now declare the sensory type explicitly; three deliberately do
    # not. The floor drops from 12 to 9 to record that intended loss rather than
    # to accommodate drift — a further drop still fails.
    "protocols": 9,
    "presets": 2,
    "evidence assessments": 8,
    "knowledge-status assertions": 3,
    "exposure hypotheses": 7,
    "references": 7,
    "exposure profiles": 10,
    "sessions": 1,
    "self reports": 2,
    # F2's synthetic contract fixture must remain rich enough to exercise two
    # memberships without cross-associating their organizations, roles, sources,
    # or lifecycle activities, plus a distinct implementation responsibility.
    "ecosystem agents": 3,
    "ecosystem relationships": 6,
    "organization memberships": 2,
    "implementation responsibilities": 2,
    "engagement activities": 14,
    "organization roles": 2,
}
for name, minimum in minimums.items():
    if counts[name] < minimum:
        fail(f"competency threshold: {name}={counts[name]}, expected at least {minimum}")

if errors:
    print(f"quality-audit: FAILED ({len(errors)} issue(s))", file=sys.stderr)
    for error in errors:
        print(f"  - {error}", file=sys.stderr)
    raise SystemExit(1)

summary = ", ".join(f"{name}={value}" for name, value in counts.items())
print(f"quality-audit: passed ({summary})")
