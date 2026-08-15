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

DCTERMS_NS = Namespace("http://purl.org/dc/terms/")

# ADR 0049 rewrote thirteen baseline triples, all of them deliberate narrowings
# recorded in that ADR's Consequences:
#
#   - the five band-to-Wikidata closeMatch assertions, which moved to the named
#     oscillations, where the items actually point (Q2469782 describes "a neural
#     oscillation", not a Hz interval);
#   - the six primary-band scope notes, whose outcome prose became evidence
#     claims on the oscillations or dated knowledge-status assertions recording
#     that no evidence was found;
#   - the scheme description, which called these "neural oscillation frequency
#     bands" when they are frequency ambits; and
#   - the scheme editorial note, which declared the conflation deferred and now
#     records its resolution.
#
# Matched by subject and predicate rather than by exact literal: the ADR
# rewrote these fields wholesale, so pinning the old strings here would only
# have to be updated again the next time the wording is improved.
OSCILLATION_MIGRATION_FIELDS = {
    # alpha10 joined the list when the ADR 0049 lint caught "calming and
    # meditation target" in its scope note — an outcome claim on a delivery
    # target, missed by hand and found by the check.
    (SSTIM_V.alpha10, SKOS.scopeNote),
    (SSTIM_V.delta, SKOS.scopeNote), (SSTIM_V.theta, SKOS.scopeNote),
    (SSTIM_V.alpha, SKOS.scopeNote), (SSTIM_V.smr, SKOS.scopeNote),
    (SSTIM_V.beta, SKOS.scopeNote), (SSTIM_V.gamma, SKOS.scopeNote),
    (SSTIM_V.delta, SKOS.closeMatch), (SSTIM_V.theta, SKOS.closeMatch),
    (SSTIM_V.alpha, SKOS.closeMatch), (SSTIM_V.beta, SKOS.closeMatch),
    (SSTIM_V.gamma, SKOS.closeMatch),
    (SSTIM_V.FrequencyBandScheme, DCTERMS_NS.description),
    (SSTIM_V.FrequencyBandScheme, SKOS.editorialNote),
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
SELF_REPORT_OR_LIST_ROOTS = (
    (SSTIM_SH.SelfReportShape, SH["or"]),
    # ADR 0049 widened two sh:or alternative lists to admit
    # sstim:NeuralOscillationType as an assessment subject, so an evidence
    # assessment can be made about an endogenous rhythm rather than only about
    # something BSC delivers. Adding a third alternative rebuilds the RDF list,
    # which changes the canonical identity of every blank node in it.
    #
    # These two entries exclude the whole sh:property closure of the affected
    # shapes rather than the lists alone, because the lists are nested inside
    # anonymous property blocks and cannot be addressed by name. The cost is
    # that other property changes on these two shapes would also stop being
    # caught here; the benefit is that the shapes remain executed against real
    # data by the SHACL suites, which is a stronger check than comparing their
    # serialisation.
    (SSTIM_SH.AssessmentPropositionShape, SH.property),
    (SSTIM_SH.EvidenceAssessmentClaimShape, SH.property),
)


# ADR 0050 rewrote the public-claim gate on sstim-sh:BscCatalogPresetShape from a
# single tier test into an eight-clause applicability contract (KR-04). The
# constraint is an anonymous sh:SPARQLConstraint, so every triple in it is
# replaced and its canonical blank-node label moves with it.
#
# It is excluded by what it is rather than by where it sits: the one SPARQL
# constraint on that shape whose query consults requiresEvidenceTierRank. The
# shape's other two SPARQL constraints — the breath-guide count and the
# primary-band containment — stay fully policed, which excluding the shape's
# whole sh:sparql closure would not achieve.
#
# The replacement is not compared here. It is executed against sixteen
# adversarial fixtures by scripts/public-claim-gate-negative.py, which is a
# stronger check than comparing its serialisation.
PUBLIC_CLAIM_GATE_MARKER = "requiresEvidenceTierRank"


def public_claim_gate_nodes(graph: Graph) -> set:
    """The anonymous SPARQL constraint implementing the public-claim gate."""
    matched = [
        node
        for node in graph.objects(SSTIM_SH.BscCatalogPresetShape, SH.sparql)
        if isinstance(node, BNode)
        and any(PUBLIC_CLAIM_GATE_MARKER in str(query) for query in graph.objects(node, SH.select))
    ]
    if len(matched) != 1:
        raise ValueError(
            f"expected exactly one public-claim gate constraint on "
            f"sstim-sh:BscCatalogPresetShape, found {len(matched)} — the gate was "
            f"renamed, duplicated or deleted, and this exception no longer describes it"
        )
    reachable: set[BNode] = set()
    frontier = list(matched)
    while frontier:
        node = frontier.pop()
        if node in reachable:
            continue
        reachable.add(node)
        for _, obj in graph.predicate_objects(node):
            if isinstance(obj, BNode) and obj not in reachable:
                frontier.append(obj)
    return reachable


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
    excluded_bnodes |= public_claim_gate_nodes(graph)
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
        if (subject, predicate) in OSCILLATION_MIGRATION_FIELDS:
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
            "ownership, ontology metadata, and the documented ADR 0043/0044/0048/0050 "
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
