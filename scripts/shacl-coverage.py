#!/usr/bin/env python3
"""Fail when a live SSTIM property, or an instance in SSTIM's data, escapes SHACL.

    python3 scripts/shacl-coverage.py

GB-02 of the 2026-09-30 review found that a green `make shacl-instances`
certified nothing about a third of SSTIM's properties: 83 of 273 appeared in no
shape, so a frequency band given as a safety caution validated, and nothing
measured coverage at all. This is that measurement, as a gate. It asks two
questions of the shapes SSTIM publishes, meaning every manifest module that
declares a shape (sstim-shapes.ttl and sstim-core-shapes.ttl today).

1. Properties. Every current object and datatype property a manifest module
   declares must be mentioned by a shape: in a property path, as a
   sh:targetSubjectsOf or sh:targetObjectsOf, or in a SHACL-SPARQL query.

2. Instances. Every node of SSTIM's public data (the manifest modules and
   static/ontology/instances/**) typed with a current SSTIM class must be the
   focus node of a shape about what it is: one that targets one of its classes
   (through rdfs:subClassOf, as pySHACL reaches it in this data) or names the
   node itself. A shape that targets the subjects or objects of a property
   checks that property's values, not the node, and every property has one
   now, so counting those would pass any node that uses one SSTIM property,
   whatever its class. The review counted six classes whose instances no
   shape targeted, by asking whether any shape names the class; that reads
   `sh:not [ sh:class X ]` as a constraint on X, when it constrains other
   nodes. Asked of the instances themselves, the answer was thirteen.

A property or class escapes only by an entry in EXCUSED, with its reason. An
entry that no longer excuses anything fails as well, so the list cannot rot.
"""

from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

from rdflib import Graph, OWL, RDF, RDFS, URIRef
from rdflib.collection import Collection
from rdflib.namespace import SH

ROOT = Path(__file__).resolve().parents[1]
ONTOLOGY = ROOT / "static" / "ontology"
INSTANCES = ONTOLOGY / "instances"
SSTIM = "https://w3id.org/sstim"

# term IRI -> why no shape needs to mention it (properties) or reach its
# instances (classes). Empty since 0.19.0; keep a reason a reviewer can check.
EXCUSED: dict[str, str] = {}

PATH_OPERATORS = (
    SH.inversePath, SH.alternativePath, SH.zeroOrMorePath,
    SH.oneOrMorePath, SH.zeroOrOnePath,
)


def manifest_modules() -> list[Path]:
    manifest = json.loads((ONTOLOGY / "manifest.json").read_text(encoding="utf-8"))
    return [ROOT / module["source"]["path"] for module in manifest["modules"]]


def is_sstim(term) -> bool:
    return isinstance(term, URIRef) and str(term).startswith(SSTIM)


def path_terms(shapes: Graph, path) -> set:
    """Every predicate IRI in a SHACL property path, however it is built."""
    if isinstance(path, URIRef):
        return {path}
    found = set()
    if (path, RDF.first, None) in shapes:  # a sequence path
        for item in Collection(shapes, path):
            found |= path_terms(shapes, item)
    for operator in PATH_OPERATORS:
        for inner in shapes.objects(path, operator):
            found |= path_terms(shapes, inner)
    return found


def sparql_terms(shapes: Graph) -> set:
    """IRIs a SHACL-SPARQL query names, in full or through a prefix it declares."""
    declared = {
        str(prefix): str(namespace)
        for declaration in shapes.objects(None, SH.declare)
        for prefix in shapes.objects(declaration, SH.prefix)
        for namespace in shapes.objects(declaration, SH.namespace)
    }
    found = set()
    for predicate in (SH.select, SH.ask, SH.construct):
        for query in shapes.objects(None, predicate):
            text = str(query)
            prefixes = dict(declared)
            prefixes.update(re.findall(r"PREFIX\s+([\w-]*):\s*<([^>]+)>", text, re.IGNORECASE))
            found |= {URIRef(iri) for iri in re.findall(r"<([^>\s]+)>", text)}
            for prefix, local in re.findall(r"(?<![\w<#/-])([A-Za-z][\w-]*):([A-Za-z_][\w-]*)", text):
                if prefix in prefixes:
                    found.add(URIRef(prefixes[prefix] + local))
    return found


def mentioned_properties(shapes: Graph) -> set:
    mentioned = set()
    for path in shapes.objects(None, SH.path):
        mentioned |= path_terms(shapes, path)
    for target in (SH.targetSubjectsOf, SH.targetObjectsOf):
        mentioned |= set(shapes.objects(None, target))
    return mentioned | sparql_terms(shapes)


def focus_nodes(shapes: Graph, data: Graph) -> set:
    """Every data node a shape targets by its class, or names."""
    if any(shapes.subject_objects(SH.target)):
        # A SPARQL-based target would need a query engine to evaluate, and an
        # instrument that cannot see a target must not report what it misses.
        raise SystemExit("shacl-coverage: a shape uses sh:target, which this check cannot evaluate; extend it first")
    subclasses = defaultdict(set)
    for sub, sup in data.subject_objects(RDFS.subClassOf):
        subclasses[sup].add(sub)

    def with_subclasses(cls) -> set:
        seen, todo = {cls}, [cls]
        while todo:
            for sub in subclasses[todo.pop()]:
                if sub not in seen:
                    seen.add(sub)
                    todo.append(sub)
        return seen

    target_classes = set(shapes.objects(None, SH.targetClass))
    # Implicit class targets: a shape that is itself a class targets its instances.
    for shape in set(shapes.subjects(RDF.type, SH.NodeShape)):
        if (shape, RDF.type, RDFS.Class) in shapes or (shape, RDF.type, OWL.Class) in shapes:
            target_classes.add(shape)
    focus = set(shapes.objects(None, SH.targetNode))
    for target in target_classes:
        for cls in with_subclasses(target):
            focus |= set(data.subjects(RDF.type, cls))
    return focus


def main() -> int:
    modules = manifest_modules()
    terms, shapes = Graph(), Graph()
    shape_files = []
    for path in modules:
        graph = Graph().parse(path, format="turtle")
        terms += graph
        if any(graph.subjects(RDF.type, SH.NodeShape)) or any(graph.subjects(RDF.type, SH.PropertyShape)):
            shapes += graph
            shape_files.append(path.name)
    if not shape_files:
        raise SystemExit("shacl-coverage: no manifest module declares a shape; nothing to measure against")
    data = Graph()
    data += terms
    instance_files = sorted(INSTANCES.rglob("*.ttl"))
    for path in instance_files:
        data.parse(path, format="turtle")

    deprecated = {s for s, o in terms.subject_objects(OWL.deprecated) if str(o).lower() == "true"}
    properties = {
        p for kind in (OWL.ObjectProperty, OWL.DatatypeProperty)
        for p in terms.subjects(RDF.type, kind) if is_sstim(p) and p not in deprecated
    }
    classes = {c for c in terms.subjects(RDF.type, OWL.Class) if is_sstim(c) and c not in deprecated}

    unmentioned = properties - mentioned_properties(shapes)

    focus = focus_nodes(shapes, data)
    unreached = defaultdict(list)
    instance_count = 0
    instantiated = set()
    for node, cls in data.subject_objects(RDF.type):
        if cls not in classes:
            continue
        instantiated.add(cls)
        instance_count += 1
        if node not in focus:
            unreached[cls].append(node)

    failures = []
    for prop in sorted(unmentioned, key=str):
        if str(prop) not in EXCUSED:
            failures.append(f"property {prop} is mentioned by no shape: constrain it, or excuse it with a reason")
    for cls in sorted(unreached, key=str):
        if str(cls) not in EXCUSED:
            nodes = unreached[cls]
            failures.append(
                f"class {cls}: {len(nodes)} instance(s) no shape reaches, e.g. {nodes[0]}; "
                "target them, or excuse the class with a reason"
            )
    for term, reason in EXCUSED.items():
        if not reason.strip():
            failures.append(f"excused term {term} gives no reason")
        if URIRef(term) not in unmentioned and URIRef(term) not in unreached:
            failures.append(f"excused term {term} is covered, or no longer current: remove it from EXCUSED")

    if failures:
        print(f"shacl-coverage: FAILED ({len(failures)})", file=sys.stderr)
        for failure in failures:
            print(f"  - {failure}", file=sys.stderr)
        return 1
    print(
        f"shacl-coverage: {len(properties)} current properties, each mentioned by a shape; "
        f"{instance_count} typed instances of {len(instantiated)} current classes, each targeted by its class "
        f"({len(EXCUSED)} excused; shapes from {', '.join(shape_files)}; data from {len(modules)} modules "
        f"and {len(instance_files)} instance files)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
