#!/usr/bin/env python3
"""Verify Full compatibility with 0.12 outside explicitly recorded migrations.

Compatibility, not identity. Until ADR 0048 this asserted isomorphism, because
the only change it had to police was the modular redistribution (ADR 0043),
which moved terms between files and was required to add nothing. That made
"identical" and "compatible" the same test, and identical was the stricter one.

They stop being the same test the moment the ontology grows. A consumer pinned
to 0.12 is broken by a term that disappears or changes meaning, and is not
broken by a term that appears — so the guarantee is that the baseline *survives*
in the live union, not that the live union is exhausted by the baseline.

The strictness that mattered is kept: every removal and every altered triple
still fails, and a deliberate change must be written into the exception lists
below to pass. Additions are counted and reported rather than accepted silently,
so growth stays visible in CI output.
"""

import json
from pathlib import Path
import sys

from rdflib import BNode, Graph, Literal, Namespace, RDF, RDFS, OWL
from rdflib.compare import to_canonical_graph


ROOT = Path(__file__).resolve().parents[1]
ONTOLOGY = ROOT / "static" / "ontology"
BASELINE = ONTOLOGY / "0.12.0"
MANIFEST = ONTOLOGY / "manifest.json"

BASELINE_FILES = (
    "sstim-core.ttl",
    "sstim-vocab.ttl",
    "sstim-shapes.ttl",
    "sstim-alignments.ttl",
    "sstim-patch-studio.ttl",
    "sstim-stimulus.ttl",
    "sstim-exposure.ttl",
    "sstim-ecosystem.ttl",
)

SSTIM = Namespace("https://w3id.org/sstim#")
SSTIM_V = Namespace("https://w3id.org/sstim/vocab#")
SKOS = Namespace("http://www.w3.org/2004/02/skos/core#")
SSTIM_EX = Namespace("https://w3id.org/sstim/exposure#")
WD = Namespace("http://www.wikidata.org/entity/")
OLD_CHANNEL_DEFINITION = Literal(
    "A channel within an exposure profile, such as an audio, visual, haptic, "
    "respiratory, olfactory, gustatory, or electromagnetic exposure path.",
    lang="en",
)
NEW_CHANNEL_DEFINITION = Literal(
    "A channel within a stimulus specification or exposure profile, such as an "
    "audio, visual, haptic, respiratory, olfactory, gustatory, or electromagnetic "
    "exposure path.",
    lang="en",
)
OLD_TRACK_SCOPE_NOTE = Literal(
    "Currently parallel to sstim:Voice rather than above it. A voice is the audio "
    "layer of a BSC catalog preset, constrained to four technique types; whether "
    "sstim:Voice should be asserted as a subclass of sstim:AudioTrack is an open "
    "question deferred by ADR 0041 — it becomes clean once Patch Studio control "
    "tracks are renamed to LFO and Permutation, which removes the case where one "
    "name covers both an audible layer and a silent one.",
    lang="en",
)
NEW_TRACK_SCOPE_NOTE = Literal(
    "The generic superclass for audio, visual, haptic, and control layers. The "
    "optional Patch Studio profile specializes sstim:Voice under sstim:AudioTrack; "
    "other configuration schemas may define their own Track subclasses. ADR 0041 "
    "renamed the former Patch Studio control voices to LFO and Permutation before "
    "adding that Voice subsumption, removing the earlier audible-versus-control "
    "ambiguity.",
    lang="en",
)
VALIDATION_HARDENING_NODES = {
    Namespace("https://w3id.org/sstim/shapes#").StimulusSpecificationChannelLinkShape,
    Namespace("https://w3id.org/sstim/shapes#").StimulusSpecificationTargetLinkShape,
}
DOCUMENTED_ALIGNMENT_MIGRATION_TRIPLES = {
    (SSTIM_V.techBinauralBeats, SKOS.exactMatch, WD.Q863539),
    (SSTIM_V.techBinauralBeats, SKOS.relatedMatch, WD.Q863539),
    (SSTIM_V.techMonauralBeats, SKOS.closeMatch, WD.Q6898437),
}

SH = Namespace("http://www.w3.org/ns/shacl#")
SSTIM_SH = Namespace("https://w3id.org/sstim/shapes#")

# ADR 0048 rewrote two SelfReport statements rather than adding beside them.
#
# The definition named five fixed values as the report's content and promised
# optional free text that no property supported; the shape message named "report
# value" when a report may now carry qualified observations instead. Both are
# replacements of a baseline triple, so both are recorded here — an unrecorded
# rewrite still fails.
DOCUMENTED_SELF_REPORT_MIGRATION_TRIPLES = {
    (
        SSTIM.SelfReport,
        SKOS.definition,
        Literal(
            "A consent-governed, session-associated self-assessment capturing "
            "subjective affect, focus, sleepiness, quality, and optional free text "
            "at an explicitly identified collection phase.",
            lang="en",
        ),
    ),
    (
        SSTIM_SH.SelfReportShape,
        SH.message,
        Literal("SelfReport must contain at least one report value.", lang="en"),
    ),
    (
        SSTIM_SH.SelfReportShape,
        SH.message,
        Literal(
            "SelfReport must contain at least one observation or report value.",
            lang="en",
        ),
    ),
}

# ADR 0048 added sstim:hasObservation to SelfReportShape's sh:or alternatives, so
# every blank node in that RDF list is restructured. The list is excluded from
# both graphs by reachability rather than by hand, since its members are
# anonymous and their canonical labels move when any one of them changes. The
# alternatives themselves stay covered by the SHACL suites, which execute the
# shape against real data instead of comparing its serialisation.
SELF_REPORT_OR_LIST_ROOTS = ((SSTIM_SH.SelfReportShape, SH["or"]),)


def bnode_closure(graph: Graph, roots: tuple[tuple, ...]) -> set:
    """Blank nodes reachable from the given (subject, predicate) starting points."""
    reachable: set[BNode] = set()
    frontier = [
        obj
        for subject, predicate in roots
        for obj in graph.objects(subject, predicate)
        if isinstance(obj, BNode)
    ]
    while frontier:
        node = frontier.pop()
        if node in reachable:
            continue
        reachable.add(node)
        for _, obj in graph.predicate_objects(node):
            if isinstance(obj, BNode) and obj not in reachable:
                frontier.append(obj)
    return reachable


def load(directory: Path, filenames: tuple[str, ...]) -> Graph:
    graph = Graph()
    for filename in filenames:
        path = directory / filename
        if not path.is_file():
            raise FileNotFoundError(path)
        graph.parse(path, format="turtle")
    return graph


def live_files_from_manifest() -> tuple[str, ...]:
    """Resolve the authoritative Full semantic and SHACL source inventory."""
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    full_profiles = [profile for profile in manifest["profiles"] if profile["id"] == "full"]
    if len(full_profiles) != 1:
        raise ValueError(f"manifest must declare exactly one Full profile, found {len(full_profiles)}")

    modules = {module["id"]: module for module in manifest["modules"]}
    full = full_profiles[0]
    module_ids = [*full["modules"], *full["shapeModules"]]
    if len(module_ids) != len(set(module_ids)):
        raise ValueError("Full semantic and shape closures contain duplicate module ids")

    filenames: list[str] = []
    for module_id in module_ids:
        module = modules.get(module_id)
        if module is None:
            raise ValueError(f"Full profile references unknown module {module_id!r}")
        source = (ROOT / module["source"]["path"]).resolve()
        try:
            filename = source.relative_to(ONTOLOGY.resolve())
        except ValueError as exc:
            raise ValueError(
                f"Full module {module_id!r} source is outside static/ontology: {source}"
            ) from exc
        filenames.append(filename.as_posix())
    return tuple(filenames)


def normalized(
    graph: Graph,
    channel_definition: Literal,
    track_scope_note: Literal,
) -> Graph:
    result = Graph()
    ontology_subjects = set(graph.subjects(RDF.type, OWL.Ontology))
    excluded_bnodes = bnode_closure(graph, SELF_REPORT_OR_LIST_ROOTS)
    for triple in graph:
        subject, predicate, obj = triple
        if subject in ontology_subjects or predicate == RDFS.isDefinedBy:
            continue
        if subject in VALIDATION_HARDENING_NODES or obj in VALIDATION_HARDENING_NODES:
            continue
        if subject in excluded_bnodes or obj in excluded_bnodes:
            continue
        if triple in DOCUMENTED_ALIGNMENT_MIGRATION_TRIPLES:
            continue
        if triple in DOCUMENTED_SELF_REPORT_MIGRATION_TRIPLES:
            continue
        if triple == (SSTIM_EX.StimulusChannel, SKOS.definition, channel_definition):
            continue
        if triple == (SSTIM.Track, SKOS.scopeNote, track_scope_note):
            continue
        result.add(triple)
    return result


def main() -> int:
    live_files = live_files_from_manifest()
    old = normalized(
        load(BASELINE, BASELINE_FILES),
        OLD_CHANNEL_DEFINITION,
        OLD_TRACK_SCOPE_NOTE,
    )
    new = normalized(
        load(ONTOLOGY, live_files),
        NEW_CHANNEL_DEFINITION,
        NEW_TRACK_SCOPE_NOTE,
    )
    old_canonical = set(to_canonical_graph(old))
    new_canonical = set(to_canonical_graph(new))
    lost = sorted(old_canonical - new_canonical, key=str)
    added = len(new_canonical) - len(old_canonical & new_canonical)

    if not lost:
        print(
            "Full-union compatibility: PASS "
            f"({len(old)} baseline triples all survive; {added} added since 0.12; "
            "ownership, ontology metadata, and the documented ADR 0043/0044/0048 "
            "annotation, definition, and SHACL exceptions plus the named 0.14 "
            "alignment migration excluded)"
        )
        return 0

    print("Full-union compatibility: FAIL", file=sys.stderr)
    print(f"  normalized baseline triples: {len(old)}", file=sys.stderr)
    print(f"  normalized modular triples:  {len(new)}", file=sys.stderr)
    print(
        f"  lost or altered since 0.12: {len(lost)} — a consumer pinned to the "
        "baseline would break. Record the change in this script's exception "
        "lists if it is deliberate.",
        file=sys.stderr,
    )
    for triple in lost[:20]:
        print(f"    {triple!r}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
