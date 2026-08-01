#!/usr/bin/env python3
"""Verify that the modular SSTIM Full union preserves the 0.12 semantics."""

import json
from pathlib import Path
import sys

from rdflib import Graph, Literal, Namespace, RDF, RDFS, OWL
from rdflib.compare import isomorphic, to_canonical_graph


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
SKOS = Namespace("http://www.w3.org/2004/02/skos/core#")
SSTIM_EX = Namespace("https://w3id.org/sstim/exposure#")
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
    for triple in graph:
        subject, predicate, obj = triple
        if subject in ontology_subjects or predicate == RDFS.isDefinedBy:
            continue
        if subject in VALIDATION_HARDENING_NODES or obj in VALIDATION_HARDENING_NODES:
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
    if isomorphic(old, new):
        print(
            "Full-union equivalence: PASS "
            f"({len(old)} normalized triples; ownership, ontology metadata, and "
            "the documented ADR 0043/0044 annotation, definition, and SHACL "
            "exceptions excluded)"
        )
        return 0

    old_canonical = set(to_canonical_graph(old))
    new_canonical = set(to_canonical_graph(new))
    print("Full-union equivalence: FAIL", file=sys.stderr)
    print(f"  normalized baseline triples: {len(old)}", file=sys.stderr)
    print(f"  normalized modular triples:  {len(new)}", file=sys.stderr)
    for label, triples in (
        ("missing from modular union", sorted(old_canonical - new_canonical, key=str)),
        ("unexpected in modular union", sorted(new_canonical - old_canonical, key=str)),
    ):
        print(f"  {label}: {len(triples)}", file=sys.stderr)
        for triple in triples[:20]:
            print(f"    {triple!r}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
