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

MODULES = {
    ONTOLOGY_DIR / "sstim-core.ttl": URIRef("https://w3id.org/sstim"),
    ONTOLOGY_DIR / "sstim-vocab.ttl": URIRef("https://w3id.org/sstim/vocab"),
    ONTOLOGY_DIR / "sstim-shapes.ttl": URIRef("https://w3id.org/sstim/shapes"),
    ONTOLOGY_DIR / "sstim-alignments.ttl": URIRef("https://w3id.org/sstim/alignments"),
    ONTOLOGY_DIR / "sstim-patch-studio.ttl": URIRef("https://w3id.org/sstim/patch-studio"),
    ONTOLOGY_DIR / "sstim-exposure.ttl": URIRef("https://w3id.org/sstim/exposure"),
    ONTOLOGY_DIR / "sstim-ecosystem.ttl": URIRef("https://w3id.org/sstim/ecosystem"),
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
ECOSYSTEM_AGENTS_GRAPH = URIRef("https://w3id.org/sstim/graph/ecosystem-agents")
ECOSYSTEM_FIXTURE_GRAPH = URIRef("https://w3id.org/sstim/graph/ecosystem-fixture")
ECOSYSTEM_PUBLIC_DUMP = URIRef(
    "https://biosyncare-lab.web.app/current.ttl"
)
ECOSYSTEM_PUBLIC_ROUTES = {
    "specialist/renato-fabbri": str(ECOSYSTEM_PUBLIC_DUMP),
    "ecosystem-record/relationship/renato-develops-bsclab": str(ECOSYSTEM_PUBLIC_DUMP),
    "ecosystem-record/activity/renato-bsclab-self-publication": str(ECOSYSTEM_PUBLIC_DUMP),
}

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
if declared_module_triples != [Literal(len(modules))]:
    fail(f"void.ttl: void:triples must be {len(modules)} for the term-module graph")
if declared_module_classes != [Literal(len(named_classes))]:
    fail(f"void.ttl: void:classes must be {len(named_classes)} named OWL classes")
if declared_module_properties != [Literal(len(declared_properties))]:
    fail(f"void.ttl: void:properties must be {len(declared_properties)} OWL properties")
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
dataset_versions = list(void_graph.objects(dataset_iri, DCAT.version))
if len(core_versions) == 1 and dataset_versions != core_versions:
    fail("void.ttl: dcat:version must match the live core owl:versionInfo")


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

# Every synthetic identity/relationship/activity has an exact staged w3id rule
# to the fixture dump. The delimited block is audited as a set: a missing route,
# a stale route, or an accidental broad route fails publication validation.
w3id_prefix = "https://w3id.org/sstim/"
expected_fixture_routes = {
    str(subject).removeprefix(w3id_prefix)
    for subject in ecosystem_fixture_instances.subjects()
    if isinstance(subject, URIRef)
    and (
        str(subject).startswith(f"{w3id_prefix}specialist/")
        or str(subject).startswith(f"{w3id_prefix}organization/")
        or str(subject).startswith(f"{w3id_prefix}ecosystem-record/relationship/")
        or str(subject).startswith(f"{w3id_prefix}ecosystem-record/activity/")
    )
}
w3id_text = W3ID_STAGING_FILE.read_text(encoding="utf-8")
w3id_start = "# BEGIN audited synthetic ecosystem fixture routes"
w3id_end = "# END audited synthetic ecosystem fixture routes"
if w3id_text.count(w3id_start) != 1 or w3id_text.count(w3id_end) != 1:
    fail("w3id staging: expected one delimited synthetic ecosystem fixture route block")
else:
    route_block = w3id_text.split(w3id_start, 1)[1].split(w3id_end, 1)[0]
    fixture_target = (
        "https://labiosyncare.github.io/ontology/instances/"
        "ecosystem/fixtures/synthetic-ecosystem.ttl"
    )

    def staged_routes_for(target: str) -> set[str]:
        patterns = re.findall(
            rf"RewriteRule \^\(([^)\n]+)\)/\?\$ {re.escape(target)} \[R=303,L\]",
            route_block,
        )
        return {route for pattern in patterns for route in pattern.split("|")}

    rdf_routes = staged_routes_for(fixture_target)
    html_routes = staged_routes_for("https://labiosyncare.github.io/")
    if rdf_routes != expected_fixture_routes:
        fail("w3id staging: Turtle fixture routes do not exactly cover synthetic agents/relationships/activities")
    if html_routes != expected_fixture_routes:
        fail("w3id staging: HTML routes do not exactly cover synthetic agents/relationships/activities")

# Real records are fail-closed: every external aggregate subject must have one
# exact staged HTML rule and one exact RDF rule to the mutable public dump.
real_w3id_start = "# BEGIN audited real ecosystem routes"
real_w3id_end = "# END audited real ecosystem routes"
if w3id_text.count(real_w3id_start) != 1 or w3id_text.count(real_w3id_end) != 1:
    fail("w3id staging: expected one delimited real ecosystem route block")
else:
    real_route_block = w3id_text.split(real_w3id_start, 1)[1].split(real_w3id_end, 1)[0]
    expected_real_targets = ECOSYSTEM_PUBLIC_ROUTES

    exact_rule = re.compile(
        r"RewriteRule \^\(([^)\n]+)\)/\?\$ "
        rf"(https://labiosyncare\.github\.io/|{re.escape(str(ECOSYSTEM_PUBLIC_DUMP))}) "
        r"\[R=303,L\]"
    )
    parsed_rules: list[tuple[list[str], str]] = []
    for line in real_route_block.splitlines():
        stripped = line.strip()
        if not stripped.startswith("RewriteRule"):
            continue
        match = exact_rule.fullmatch(stripped)
        if match is None:
            fail("w3id staging: real ecosystem block contains a broad or malformed RewriteRule")
            continue
        parsed_rules.append((match.group(1).split("|"), match.group(2)))

    real_html_routes: set[str] = set()
    real_rdf_targets: dict[str, str] = {}
    for routes, target in parsed_rules:
        for route in routes:
            if target == "https://labiosyncare.github.io/":
                real_html_routes.add(route)
            elif route in real_rdf_targets:
                fail(f"w3id staging: duplicate real RDF route {route}")
            else:
                real_rdf_targets[route] = target

    if real_html_routes != set(expected_real_targets):
        fail("w3id staging: HTML routes do not exactly cover real ecosystem subjects")
    if real_rdf_targets != expected_real_targets:
        fail("w3id staging: RDF routes do not exactly map real ecosystem subjects to owning dumps")

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
    if must_resolve and obj not in declared_subjects:
        fail(f"dangling local IRI reference: {obj}")


# Executable competency thresholds prevent a superficially valid but empty graph.
counts = {
    "classes": len(named_classes),
    "anonymous class expressions": len(anonymous_classes),
    "properties": len(declared_properties),
    "concepts": len(concepts),
    "schemes": len(schemes),
    "framework techniques": len(objects(URIRef("https://w3id.org/sstim/framework/bsc"), SSTIM.definesTechnique)),
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
    "protocols": 12,
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
