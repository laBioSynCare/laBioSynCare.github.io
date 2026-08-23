#!/usr/bin/env python3
"""Generate the one place to answer "does SSTIM already have a term for this?".

Written after the same mistake three times in two days. Each time the claim was
that SSTIM lacked something it had — the generic `composedOfTrack` relation, the
`perceivedModality` property on a stimulus channel, the per-rendering rate
properties beside it — and each time the cause was the same: eighteen Turtle
modules and no single place to look, so "I did not find it" became "it does not
exist". Prose documentation cannot fix that, because prose goes stale precisely
where it matters and nobody notices.

So this is generated from the modules themselves and checked in CI. It cannot
drift from the ontology, because the ontology is its only input. Grep it before
concluding a term is missing.

    make term-index          regenerate
    make term-index-check    fail if the committed file is stale

Concepts are included alongside classes and properties, and deliberately: the
third mistake was asserting SSTIM had no proprioception concept when
`sstim-ex:modalityProprioceptive` was sitting in the exposure module.
"""

from __future__ import annotations

import json
from pathlib import Path
import sys

from rdflib import BNode, Graph, Namespace, RDF, RDFS, OWL, URIRef
from rdflib.namespace import SKOS

ROOT = Path(__file__).resolve().parents[1]
ONTOLOGY = ROOT / "static" / "ontology"
OUTPUT = ROOT / "docs" / "ontology" / "TERM_INDEX.md"

# Derived, not listed. A hand-written namespace list is the same trap as a
# hand-written term list: the first draft of this script hardcoded four and
# silently dropped the whole sstim/ecosystem module, producing exactly the
# confidently-incomplete index it exists to prevent. Any IRI under the SSTIM
# base is indexed, and its prefix is derived from its path.
SSTIM_BASE = "https://w3id.org/sstim"
KNOWN_PREFIXES = {
    "": "sstim",
    "vocab": "sstim-v",
    "shapes": "sstim-sh",
    "exposure": "sstim-ex",
    "ecosystem": "sstim-eco",
    "core-shapes": "sstim-core-sh",
}

PROPERTY_TYPES = {
    OWL.ObjectProperty: "object",
    OWL.DatatypeProperty: "data",
    OWL.AnnotationProperty: "annotation",
}


def shorten(iri) -> str | None:
    """`sstim:Preset` for any SSTIM IRI, None for anything else."""
    text = str(iri)
    if not text.startswith(SSTIM_BASE) or "#" not in text:
        return None
    namespace, _, local = text.partition("#")
    if not local:
        return None
    segment = namespace[len(SSTIM_BASE):].strip("/")
    prefix = KNOWN_PREFIXES.get(segment)
    if prefix is None:
        # A module minted a namespace nobody named here. Index it anyway, under
        # a derived prefix, rather than dropping its terms.
        prefix = f"sstim-{segment}" if segment else "sstim"
    return f"{prefix}:{local}"


def label_of(graph: Graph, node) -> str:
    """A readable name for a domain/range, including anonymous unions."""
    if isinstance(node, BNode):
        members = []
        for union in graph.objects(node, OWL.unionOf):
            members = [shorten(m) or str(m).rsplit("/", 1)[-1] for m in graph.items(union)]
        return " | ".join(m for m in members if m) if members else "expression"
    return shorten(node) or str(node).rsplit("/", 1)[-1].replace("#", ":")


def summarize(graph: Graph, node, limit: int = 150) -> str:
    for predicate in (SKOS.definition, RDFS.comment, SKOS.prefLabel, RDFS.label):
        for value in graph.objects(node, predicate):
            text = " ".join(str(value).split())
            if not text:
                continue
            if len(text) > limit:
                text = text[: limit - 1].rsplit(" ", 1)[0] + "…"
            return text.replace("|", "\\|")
    return ""


def main() -> int:
    check = "--check" in sys.argv
    manifest = json.loads((ONTOLOGY / "manifest.json").read_text(encoding="utf-8"))
    modules = manifest["modules"]
    if not modules:
        raise SystemExit("term-index: the manifest listed no modules")

    classes: list[tuple] = []
    properties: list[tuple] = []
    concepts: list[tuple] = []
    seen: set[str] = set()

    for module in modules:
        module_id = module["id"]
        graph = Graph().parse(ROOT / module["source"]["path"], format="turtle")

        for subject in set(graph.subjects(RDF.type, OWL.Class)):
            name = shorten(subject) if isinstance(subject, URIRef) else None
            if not name or name in seen:
                continue
            seen.add(name)
            parents = sorted(
                filter(None, (shorten(p) for p in graph.objects(subject, RDFS.subClassOf)))
            )
            classes.append((name, module_id, ", ".join(parents), summarize(graph, subject)))

        for owl_type, kind in PROPERTY_TYPES.items():
            for subject in set(graph.subjects(RDF.type, owl_type)):
                name = shorten(subject) if isinstance(subject, URIRef) else None
                if not name or name in seen:
                    continue
                seen.add(name)
                domain = next(graph.objects(subject, RDFS.domain), None)
                rng = next(graph.objects(subject, RDFS.range), None)
                signature = " → ".join(
                    label_of(graph, n) if n is not None else "—" for n in (domain, rng)
                )
                properties.append((name, kind, module_id, signature, summarize(graph, subject)))

        for subject in set(graph.subjects(RDF.type, SKOS.Concept)):
            name = shorten(subject) if isinstance(subject, URIRef) else None
            if not name or name in seen:
                continue
            seen.add(name)
            categories = sorted(
                filter(
                    None,
                    (
                        shorten(t)
                        for t in graph.objects(subject, RDF.type)
                        if t not in (SKOS.Concept, OWL.NamedIndividual)
                    ),
                )
            )
            notation = next(graph.objects(subject, SKOS.notation), "")
            concepts.append((name, ", ".join(categories), module_id, str(notation)))

    classes.sort()
    properties.sort()
    concepts.sort()

    lines: list[str] = [
        "# SSTIM term index",
        "",
        "**Generated — do not edit.** `make term-index` rebuilds it from the "
        "manifest-owned modules; `make term-index-check` fails if it is stale, and "
        "runs in `make validate`.",
        "",
        "This exists to be grepped before concluding that SSTIM lacks a term. It "
        "was added after three consecutive claims that a term was missing when it "
        "was not — the generic `sstim:composedOfTrack`, `sstim-ex:perceivedModality`, "
        "and the per-rendering rate properties on a stimulus channel. Eighteen "
        "modules is more than anyone reliably searches by hand.",
        "",
        f"{len(classes)} classes · {len(properties)} properties · {len(concepts)} concepts "
        f"· {len(modules)} modules",
        "",
        "## Classes",
        "",
        "| Term | Module | Subclass of | Definition |",
        "|---|---|---|---|",
    ]
    lines += [f"| `{n}` | {m} | {p} | {d} |" for n, m, p, d in classes]

    lines += [
        "",
        "## Properties",
        "",
        "| Term | Kind | Module | Domain → Range | Definition |",
        "|---|---|---|---|---|",
    ]
    lines += [f"| `{n}` | {k} | {m} | {s} | {d} |" for n, k, m, s, d in properties]

    lines += [
        "",
        "## Concepts",
        "",
        "Controlled values. A schema offering a controlled value that is not here "
        "is minting one (audit finding KR-17).",
        "",
        "| Concept | Category | Module | Notation |",
        "|---|---|---|---|",
    ]
    lines += [f"| `{n}` | {c} | {m} | {t} |" for n, c, m, t in concepts]

    rendered = "\n".join(lines) + "\n"

    if check:
        current = OUTPUT.read_text(encoding="utf-8") if OUTPUT.is_file() else ""
        if current != rendered:
            print(
                "term-index: STALE — the committed index no longer matches the "
                "modules. Run `make term-index`.",
                file=sys.stderr,
            )
            return 1
        print(
            f"term-index: current ({len(classes)} classes, {len(properties)} properties, "
            f"{len(concepts)} concepts)"
        )
        return 0

    OUTPUT.write_text(rendered, encoding="utf-8")
    print(
        f"term-index: wrote {OUTPUT.relative_to(ROOT)} "
        f"({len(classes)} classes, {len(properties)} properties, {len(concepts)} concepts)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
