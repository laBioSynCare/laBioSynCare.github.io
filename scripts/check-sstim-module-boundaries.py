#!/usr/bin/env python3
"""Check SSTIM term ownership and direct cross-module dependencies."""

from collections import defaultdict
import json
from pathlib import Path
import sys

from rdflib import BNode, Graph, Namespace, RDF, RDFS, SKOS, URIRef
from rdflib.namespace import OWL


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "static" / "ontology" / "manifest.json"
LOCAL_ROOT = "https://w3id.org/sstim"
TERM_TYPES = (OWL.Class, OWL.ObjectProperty, OWL.DatatypeProperty, OWL.AnnotationProperty)
SH = Namespace("http://www.w3.org/ns/shacl#")
PUBLIC_RESOURCE_TYPES = TERM_TYPES + (
    SKOS.Concept,
    SKOS.ConceptScheme,
    SKOS.Collection,
    SH.NodeShape,
    SH.PropertyShape,
)


def main() -> int:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    modules = {module["id"]: module for module in manifest["modules"]}
    iri_to_id = {module["ontologyIri"]: module_id for module_id, module in modules.items()}
    graphs: dict[str, Graph] = {}
    errors: list[str] = []

    for module_id, module in modules.items():
        path = ROOT / module["source"]["path"]
        graph = Graph()
        try:
            graph.parse(path, format="turtle")
        except Exception as exc:
            errors.append(f"{module_id}: cannot parse {path.relative_to(ROOT)}: {exc}")
        graphs[module_id] = graph

    declarations: dict[URIRef, list[str]] = defaultdict(list)
    resource_declarations: dict[URIRef, set[str]] = defaultdict(set)
    for module_id, graph in graphs.items():
        for term_type in TERM_TYPES:
            for term in graph.subjects(RDF.type, term_type):
                if isinstance(term, URIRef) and str(term).startswith(LOCAL_ROOT):
                    declarations[term].append(module_id)
        for resource_type in PUBLIC_RESOURCE_TYPES:
            for resource in graph.subjects(RDF.type, resource_type):
                if isinstance(resource, URIRef) and str(resource).startswith(LOCAL_ROOT):
                    resource_declarations[resource].add(module_id)

    for term, owners in declarations.items():
        if len(owners) != 1:
            errors.append(f"{term}: declared in {owners}; expected exactly one owner module")
            continue
        module_id = owners[0]
        expected_iri = URIRef(modules[module_id]["ontologyIri"])
        defined_by = set(graphs[module_id].objects(term, RDFS.isDefinedBy))
        if defined_by != {expected_iri}:
            errors.append(
                f"{term}: {module_id} declaration has rdfs:isDefinedBy "
                f"{sorted(map(str, defined_by))}, expected [{expected_iri}]"
            )

    for resource, source_modules in resource_declarations.items():
        if len(source_modules) != 1:
            errors.append(
                f"{resource}: typed as a public term/value/shape in "
                f"{sorted(source_modules)}; expected one authoritative source"
            )

    # ADR 0043 and ADR 0044: a cross-layer union domain or range is one intact
    # RDF list owned by one module. Several rdfs:domain (or rdfs:range)
    # statements intersect rather than union, so splitting one silently narrows
    # a property instead of widening it. Redistribution makes this easy to hit,
    # because a property's declaration and its domain now live in different
    # modules by design -- sstim:hasStimulationTarget is declared in Stimulus
    # and gets its StimulusSpecification/SessionSpecification domain in Session.
    axis_sources: dict[tuple[URIRef, URIRef], list[str]] = defaultdict(list)
    for module_id, graph in graphs.items():
        for predicate in (RDFS.domain, RDFS.range):
            for subject, _ in graph.subject_objects(predicate):
                if isinstance(subject, URIRef) and str(subject).startswith(LOCAL_ROOT):
                    axis_sources[(subject, predicate)].append(module_id)
    for (subject, predicate), sources in sorted(
        axis_sources.items(), key=lambda item: (str(item[0][0]), str(item[0][1]))
    ):
        if len(sources) > 1:
            axis = str(predicate).rsplit("#", 1)[-1]
            errors.append(
                f"{subject}: {len(sources)} rdfs:{axis} statements from {sorted(sources)}; "
                "several intersect rather than union — keep one intact owl:unionOf axiom "
                "in the most-specific dependent module"
            )

    # Typed public resources establish source ownership even when their
    # historical namespace names another concern (notably
    # sstim-ex:StimulusChannel, now stimulus-owned). This also lets a later
    # concern-specific vocabulary retain stable sstim-v: IRIs without making
    # dependency discovery guess ownership from the namespace.
    resource_owner = {
        resource: next(iter(source_modules))
        for resource, source_modules in resource_declarations.items()
        if len(source_modules) == 1
    }
    namespace_documents = {
        document["namespaceIri"]: set(document["modules"])
        for document in manifest.get("namespaceDocuments", [])
    }
    module_for_namespace = {
        f"{module['ontologyIri']}#": module_id
        for module_id, module in modules.items()
        if module["ontologyIri"] != LOCAL_ROOT
    }
    for resource, module_id in resource_owner.items():
        resource_iri = str(resource)
        if "#" not in resource_iri:
            continue
        namespace = resource_iri.split("#", 1)[0] + "#"
        if namespace in namespace_documents:
            if module_id not in namespace_documents[namespace]:
                errors.append(
                    f"{resource}: owner {module_id} is absent from namespace "
                    f"document {namespace}"
                )
        elif namespace in module_for_namespace:
            expected_owner = module_for_namespace[namespace]
            if module_id != expected_owner:
                errors.append(
                    f"{resource}: namespace document would resolve to "
                    f"{expected_owner}, but authoritative owner is {module_id}"
                )
        else:
            errors.append(f"{resource}: no dereferenceable namespace document is declared")
    namespace_owners = sorted(
        (
            (f"{module['ontologyIri']}#", module_id)
            for module_id, module in modules.items()
            if module["ontologyIri"] != LOCAL_ROOT
        ),
        key=lambda item: len(item[0]),
        reverse=True,
    )

    def owner(node: object) -> str | None:
        if not isinstance(node, URIRef):
            return None
        if node in resource_owner:
            return resource_owner[node]
        text = str(node)
        for namespace, module_id in namespace_owners:
            if text.startswith(namespace):
                return module_id
        return None

    for module_id, graph in graphs.items():
        ontology_iri = URIRef(modules[module_id]["ontologyIri"])
        ontology_subjects = set(graph.subjects(RDF.type, OWL.Ontology))
        actual: set[str] = set()
        for subject, predicate, obj in graph:
            if subject in ontology_subjects:
                continue
            for node in (subject, predicate, obj):
                dependency = owner(node)
                if dependency and dependency != module_id:
                    actual.add(dependency)
        declared = set(modules[module_id]["requires"])
        if actual != declared:
            missing = sorted(actual - declared)
            extra = sorted(declared - actual)
            errors.append(
                f"{module_id}: dependency mismatch; missing={missing}, extra={extra}"
            )

        # Every authored owner IRI must itself be a declared module IRI.
        for _, defined_by in graph.subject_objects(RDFS.isDefinedBy):
            if isinstance(defined_by, URIRef) and str(defined_by).startswith(LOCAL_ROOT):
                if str(defined_by) not in iri_to_id:
                    errors.append(
                        f"{module_id}: rdfs:isDefinedBy points to undeclared module {defined_by}"
                    )

    # No axiom may be asserted by two modules. Five upper-ontology alignments
    # were, on 2026-08-18: sstim-alignments.ttl repeated subClassOf axioms that
    # sstim-common, -technique, -session and -evidence already stated, so every
    # Full serialization carried them twice — 10575 raw triples against 10570
    # distinct, which is why DBpedia Archivo counted five more than rdflib did.
    #
    # The axiom belongs to the module that defines the class, because that
    # module reaches profiles alignments does not: sstim-common is in Core Plus
    # while alignments is Full-only, so asserting there as well adds a duplicate
    # without widening the profile that carries the parent. This file already
    # used exactly that convention for sstim:SessionInstance -> prov:Activity,
    # as a comment; the other five simply had not followed it.
    #
    # Blank-node triples are skipped: their identifiers differ per parse, so
    # equality across modules is not meaningful.
    asserted_in: dict[tuple, set[str]] = defaultdict(set)
    for module_id, graph in graphs.items():
        for triple in graph:
            if any(isinstance(term, BNode) for term in triple):
                continue
            asserted_in[triple].add(module_id)
    for triple, owners in sorted(asserted_in.items(), key=lambda kv: str(kv[0])):
        if len(owners) > 1:
            subject, predicate, obj = triple
            errors.append(
                f"duplicate axiom in {', '.join(sorted(owners))}: "
                f"<{subject}> <{predicate}> <{obj}> — assert it once, in the "
                "module that defines the subject, and cross-reference it as a "
                "comment elsewhere"
            )

    if errors:
        print(f"module-boundaries: FAIL ({len(errors)} issue(s))", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    print(
        "module-boundaries: PASS "
        f"({len(modules)} modules, {len(declarations)} uniquely owned OWL terms, "
        f"{len(resource_declarations)} named public resources with one source, "
        f"{len(axis_sources)} undivided domain/range axioms, "
        "no axiom asserted by two modules)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
