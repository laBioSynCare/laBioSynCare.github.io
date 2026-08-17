#!/usr/bin/env python3
"""Assert the ADR 0052 signal layer exists, means what it says, and rejects abuse.

Three checks, in the three directions a term set can be wrong.

**Adds.** Every term and concept the ADR promised is present. A layer half-added
is worse than one not added: a consumer that finds `StimulationSignal` reasonably
assumes the renderings exist too.

**Changes.** The one modification to a live property — widening `hzMin`/`hzMax`
from `FrequencyBand` to a union with `StimulationSignal` — did what it claimed
and nothing more. Every band that stated a bound before still states it.

**Removes.** Nothing. The layer is purely additive, which the full-equivalence
baseline also polices; this states the intent locally so a later edit that starts
removing has to argue with something.

Then the constraints, adversarially. The signal layer earns its place through
four rules that data can violate — an inverted extent, a sampled signal with no
source, a binaural beat claimed as physically present, and a directly presented
rendering with a carrier. Each is a rule the model would be decorative without,
so each is broken here and required to fail.
"""

from __future__ import annotations

import json
from pathlib import Path
import re
import sys

from pyshacl import validate as shacl_validate
from rdflib import Graph, Namespace, RDF, URIRef
from rdflib.namespace import SKOS

ROOT = Path(__file__).resolve().parents[1]
ONTOLOGY = ROOT / "static" / "ontology"
SHAPES = ONTOLOGY / "sstim-shapes.ttl"

SSTIM = Namespace("https://w3id.org/sstim#")
SSTIM_V = Namespace("https://w3id.org/sstim/vocab#")
OWL = Namespace("http://www.w3.org/2002/07/owl#")
SH = Namespace("http://www.w3.org/ns/shacl#")

REQUIRED_CLASSES = [
    "StimulationSignal", "SignalRendering",
    "SignalShape", "RenderingMechanism", "RenderingPresence", "RenderableParameter",
]
REQUIRED_PROPERTIES = [
    "hasSignal", "hasSignalShape", "signalSourceAsset",
    "signalWithinBand", "signalCoversBand", "signalOverlapsBand",
    "hasSignalRendering", "rendersSignal", "rendersOntoParameter",
    "hasRenderingMechanism", "hasRenderingPresence", "renderingCarrierHz",
    "impliesPresence",
]
REQUIRED_CONCEPTS = {
    "SignalShape": ["shapeSine", "shapeSquare", "shapeSawtooth", "shapeTriangle",
                    "shapeEnvelope", "shapeNoise", "shapeSampled"],
    "RenderingMechanism": ["mechanismDirectPresentation", "mechanismAmplitudeModulation",
                           "mechanismFrequencyModulation", "mechanismBinauralBeat",
                           "mechanismMonauralBeat"],
    "RenderingPresence": ["presencePhysical", "presencePerceptual"],
    "RenderableParameter": ["paramAmplitude", "paramFrequency", "paramLuminance",
                            "paramSize", "paramSpatialPosition", "paramVibrationIntensity"],
}

PREAMBLE = """
@prefix ex:      <https://example.org/adr52-fixture/> .
@prefix rdfs:    <http://www.w3.org/2000/01/rdf-schema#> .
@prefix sstim:   <https://w3id.org/sstim#> .
@prefix sstim-v: <https://w3id.org/sstim/vocab#> .
@prefix xsd:     <http://www.w3.org/2001/XMLSchema#> .
"""

# One 10 Hz signal delivered two ways — the thing SSTIM could not say before.
BASELINE = """
ex:alpha-signal a sstim:StimulationSignal ;
    rdfs:label "10 Hz square"@en ;
    sstim:hasSignalShape sstim-v:shapeSquare ;
    sstim:hzMin 10.0 ; sstim:hzMax 10.0 ;
    sstim:signalWithinBand sstim-v:alpha .

ex:audio-rendering a sstim:SignalRendering ;
    rdfs:label "as an amplitude-modulated tone"@en ;
    sstim:rendersSignal ex:alpha-signal ;
    sstim:rendersOntoParameter sstim-v:paramAmplitude ;
    sstim:hasRenderingMechanism sstim-v:mechanismAmplitudeModulation ;
    sstim:hasRenderingPresence sstim-v:presencePhysical ;
    sstim:renderingCarrierHz 250.0 .

ex:visual-rendering a sstim:SignalRendering ;
    rdfs:label "as a flickering light"@en ;
    sstim:rendersSignal ex:alpha-signal ;
    sstim:rendersOntoParameter sstim-v:paramLuminance ;
    sstim:hasRenderingMechanism sstim-v:mechanismDirectPresentation ;
    sstim:hasRenderingPresence sstim-v:presencePhysical .
"""

# Band-limited noise: the case that made the relation an interval one.
NOISE = """
ex:theta-noise a sstim:StimulationSignal ;
    rdfs:label "theta-band noise"@en ;
    sstim:hasSignalShape sstim-v:shapeNoise ;
    sstim:hzMin 4.0 ; sstim:hzMax 8.0 ;
    sstim:signalCoversBand sstim-v:theta .
"""

# Noise straddling a band edge: neither contained nor containing, the case the
# overlap relation exists for.
OVERLAP = """
ex:wide-noise a sstim:StimulationSignal ;
    rdfs:label "noise straddling the alpha/beta boundary"@en ;
    sstim:hasSignalShape sstim-v:shapeNoise ;
    sstim:hzMin 10.0 ; sstim:hzMax 20.0 ;
    sstim:signalOverlapsBand sstim-v:alpha .
"""

CASES = [
    ("a frequency extent running backwards",
     BASELINE.replace("sstim:hzMin 10.0 ; sstim:hzMax 10.0", "sstim:hzMin 40.0 ; sstim:hzMax 10.0"),
     "must not run backwards"),
    ("a sampled signal with no source",
     BASELINE.replace("sstim-v:shapeSquare", "sstim-v:shapeSampled"),
     "sampled signal must identify"),
    ("a directly presented rendering carrying a carrier",
     BASELINE.replace(
         """    sstim:hasRenderingMechanism sstim-v:mechanismDirectPresentation ;
    sstim:hasRenderingPresence sstim-v:presencePhysical .""",
         """    sstim:hasRenderingMechanism sstim-v:mechanismDirectPresentation ;
    sstim:hasRenderingPresence sstim-v:presencePhysical ;
    sstim:renderingCarrierHz 250.0 ."""),
     "has no carrier"),
    # The old rule named binaural and physical explicitly, so it covered one of
    # five mechanisms. These are the four that used to pass.
    ("a monaural beat claimed as perceptually constructed",
     BASELINE.replace("sstim-v:mechanismAmplitudeModulation", "sstim-v:mechanismMonauralBeat")
             .replace("sstim:hasRenderingPresence sstim-v:presencePhysical ;\n    sstim:renderingCarrierHz 250.0 .",
                      "sstim:hasRenderingPresence sstim-v:presencePerceptual ;\n    sstim:renderingCarrierHz 250.0 ."),
     "contradicts its mechanism"),
    ("amplitude modulation claimed as perceptually constructed",
     BASELINE.replace("sstim:hasRenderingPresence sstim-v:presencePhysical ;\n    sstim:renderingCarrierHz 250.0 .",
                      "sstim:hasRenderingPresence sstim-v:presencePerceptual ;\n    sstim:renderingCarrierHz 250.0 ."),
     "contradicts its mechanism"),
    ("a binaural beat claimed as physically present",
     BASELINE.replace("sstim-v:mechanismAmplitudeModulation", "sstim-v:mechanismBinauralBeat"),
     "contradicts its mechanism"),
    ("a signal with no shape",
     BASELINE.replace("    sstim:hasSignalShape sstim-v:shapeSquare ;\n", ""),
     "must state its shape"),
    # The band-interval relations are derivable from the two extents, so the
    # failure they catch is an aim that disagrees with its own arithmetic.
    ("a signal claiming to sit within a band it does not fit in",
     BASELINE.replace("sstim:signalWithinBand sstim-v:alpha",
                      "sstim:signalWithinBand sstim-v:theta"),
     "lie inside the band"),
    ("noise claiming to cover a band wider than itself",
     NOISE.replace("sstim:signalCoversBand sstim-v:theta",
                   "sstim:signalCoversBand sstim-v:beta"),
     "contain the whole band"),
    ("a signal claiming to overlap a band it is wholly inside",
     BASELINE.replace("sstim:signalWithinBand sstim-v:alpha",
                      "sstim:signalOverlapsBand sstim-v:alpha"),
     "neither containing the other"),
    ("a signal claiming to overlap a band it is disjoint from",
     BASELINE.replace("sstim:signalWithinBand sstim-v:alpha",
                      "sstim:signalOverlapsBand sstim-v:delta"),
     "neither containing the other"),
    ("a rendering that names no presence",
     BASELINE.replace("    sstim:hasRenderingPresence sstim-v:presencePhysical ;\n    sstim:renderingCarrierHz 250.0 .",
                      "    sstim:renderingCarrierHz 250.0 ."),
     "physically present or perceptually constructed"),
]


def module_paths() -> list[Path]:
    manifest = json.loads((ONTOLOGY / "manifest.json").read_text(encoding="utf-8"))
    paths = [ROOT / m["source"]["path"] for m in manifest["modules"]]
    if not paths:
        raise SystemExit("signal-layer: the manifest listed no modules")
    return paths


def main() -> int:
    failures: list[str] = []
    graph = Graph()
    for path in module_paths():
        graph.parse(path, format="turtle")

    # ── Adds ────────────────────────────────────────────────────────────────
    for name in REQUIRED_CLASSES:
        if (SSTIM[name], RDF.type, OWL.Class) not in graph:
            failures.append(f"ADR 0052 promised sstim:{name}; it is not declared")
    for name in REQUIRED_PROPERTIES:
        types = set(graph.objects(SSTIM[name], RDF.type))
        if not types & {OWL.ObjectProperty, OWL.DatatypeProperty}:
            failures.append(f"ADR 0052 promised sstim:{name}; it is not declared")

    concepts = 0
    for category, names in REQUIRED_CONCEPTS.items():
        declared = {
            str(c)[len(str(SSTIM_V)):]
            for c in graph.subjects(RDF.type, SSTIM[category])
            if isinstance(c, URIRef) and str(c).startswith(str(SSTIM_V))
        }
        missing = sorted(set(names) - declared)
        if missing:
            failures.append(f"sstim:{category} is missing {missing}")
        concepts += len(names) - len(missing)
        for name in names:
            if not list(graph.objects(SSTIM_V[name], SKOS.notation)):
                failures.append(f"sstim-v:{name} carries no skos:notation, so no schema can reference it")

    # ── Changes ─────────────────────────────────────────────────────────────
    # The union domain must admit signals without having dropped bands.
    for bound in ("hzMin", "hzMax"):
        domains = list(graph.objects(SSTIM[bound], Namespace("http://www.w3.org/2000/01/rdf-schema#").domain))
        members = [m for d in domains for u in graph.objects(d, OWL.unionOf) for m in graph.items(u)]
        if SSTIM.FrequencyBand not in members:
            failures.append(f"sstim:{bound} no longer admits sstim:FrequencyBand — the widening dropped its original domain")
        if SSTIM.StimulationSignal not in members:
            failures.append(f"sstim:{bound} does not admit sstim:StimulationSignal, so a signal cannot state its extent")

    bands_with_bounds = sum(
        1 for b in graph.subjects(RDF.type, SSTIM.FrequencyBand)
        if list(graph.objects(b, SSTIM.hzMin)) and list(graph.objects(b, SSTIM.hzMax))
    )
    if bands_with_bounds < 17:
        failures.append(
            f"only {bands_with_bounds} frequency bands still state both bounds; the "
            f"domain widening was supposed to change nothing about bands"
        )

    # ── Constraints, adversarially, in one pySHACL run ──────────────────────
    #
    # Each fixture used to be validated against the whole 13,020-triple closure
    # on its own. pySHACL takes ~7s over that graph regardless of how many
    # fixture triples ride along, so 15 fixtures cost ~105 seconds to check
    # about 150 triples — and 13,020 of the 13,170 were identical every time
    # and passed every time.
    #
    # They now share one run. Every fixture is rewritten into its own IRI
    # namespace (ex:f3-alpha-signal rather than ex:alpha-signal) so the subjects
    # cannot collide, and each is judged on the results whose focus node is its
    # own. That is also strictly more precise than what it replaced: matching a
    # message anywhere in a per-fixture report proved "something failed with
    # this text", where matching it on the fixture's own focus node proves this
    # fixture failed for this reason.
    shapes = Graph().parse(SHAPES, format="turtle")

    def namespaced(fixture: str, tag: str) -> str:
        return re.sub(r"\bex:", f"ex:{tag}-", fixture)

    combined = Graph()
    for triple in graph:
        combined.add(triple)

    positives = [("one signal rendered two ways", BASELINE),
                 ("band-limited noise covering a band", NOISE),
                 ("noise genuinely straddling a band edge", OVERLAP)]
    for index, (_, fixture) in enumerate(positives):
        combined.parse(data=PREAMBLE + namespaced(fixture, f"p{index}"), format="turtle")
    for index, (_, fixture, _) in enumerate(CASES):
        combined.parse(data=PREAMBLE + namespaced(fixture, f"n{index}"), format="turtle")

    _, results, _ = shacl_validate(combined, shacl_graph=shapes, advanced=True)

    # focus node -> the messages reported against it
    reported: dict[str, list[str]] = {}
    for result in results.subjects(RDF.type, SH.ValidationResult):
        for focus in results.objects(result, SH.focusNode):
            for message in results.objects(result, SH.resultMessage):
                reported.setdefault(str(focus), []).append(str(message))

    def messages_for(tag: str) -> list[str]:
        prefix = f"https://example.org/adr52-fixture/{tag}-"
        return [m for node, ms in reported.items() if node.startswith(prefix) for m in ms]

    for index, (label, _) in enumerate(positives):
        hits = messages_for(f"p{index}")
        if hits:
            failures.append(f"the positive fixture '{label}' was rejected: {hits[:3]}")

    for index, (label, _, fragment) in enumerate(CASES):
        hits = messages_for(f"n{index}")
        if not hits:
            failures.append(f"{label}: accepted, but must be rejected")
        elif not any(fragment in m for m in hits):
            failures.append(
                f"{label}: rejected, but not by its own constraint — expected a "
                f"message containing {fragment!r}, got {hits[:2]}"
            )

    if failures:
        print(f"signal-layer: FAILED ({len(failures)})", file=sys.stderr)
        for failure in failures:
            print(f"  - {failure}", file=sys.stderr)
        return 1

    print(
        f"signal-layer: passed ({len(REQUIRED_CLASSES)} classes, "
        f"{len(REQUIRED_PROPERTIES)} properties and {concepts} concepts present; "
        f"{bands_with_bounds} bands unaffected by the domain widening; "
        f"{len(CASES)} adversarial cases rejected, 3 positive controls accepted)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
