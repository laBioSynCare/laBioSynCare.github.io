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

REQUIRED_CLASSES = [
    "StimulationSignal", "SignalRendering",
    "SignalShape", "RenderingMechanism", "RenderingPresence", "RenderableParameter",
]
REQUIRED_PROPERTIES = [
    "hasSignal", "hasSignalShape", "signalSourceAsset",
    "signalWithinBand", "signalCoversBand", "signalOverlapsBand",
    "hasSignalRendering", "rendersSignal", "rendersOntoParameter",
    "hasRenderingMechanism", "hasRenderingPresence", "renderingCarrierHz",
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

CASES = [
    ("a frequency extent running backwards",
     BASELINE.replace("sstim:hzMin 10.0 ; sstim:hzMax 10.0", "sstim:hzMin 40.0 ; sstim:hzMax 10.0"),
     "must not run backwards"),
    ("a sampled signal with no source",
     BASELINE.replace("sstim-v:shapeSquare", "sstim-v:shapeSampled"),
     "sampled signal must identify"),
    ("a binaural beat claimed as physically present",
     BASELINE.replace("sstim-v:mechanismAmplitudeModulation", "sstim-v:mechanismBinauralBeat"),
     "perceptually constructed"),
    ("a directly presented rendering carrying a carrier",
     BASELINE.replace(
         """    sstim:hasRenderingMechanism sstim-v:mechanismDirectPresentation ;
    sstim:hasRenderingPresence sstim-v:presencePhysical .""",
         """    sstim:hasRenderingMechanism sstim-v:mechanismDirectPresentation ;
    sstim:hasRenderingPresence sstim-v:presencePhysical ;
    sstim:renderingCarrierHz 250.0 ."""),
     "has no carrier"),
    ("a signal with no shape",
     BASELINE.replace("    sstim:hasSignalShape sstim-v:shapeSquare ;\n", ""),
     "must state its shape"),
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

    # ── Constraints, adversarially ──────────────────────────────────────────
    shapes = Graph().parse(SHAPES, format="turtle")

    def report(fixture: str) -> str:
        data = Graph()
        for triple in graph:
            data.add(triple)
        data.parse(data=PREAMBLE + fixture, format="turtle")
        _, _, text = shacl_validate(data, shacl_graph=shapes, advanced=True)
        return text

    for label, fixture in (("one signal rendered two ways", BASELINE),
                           ("band-limited noise covering a band", NOISE)):
        text = report(fixture)
        if "Conforms: False" in text:
            failures.append(f"the positive fixture '{label}' was rejected\n{text}")

    for label, fixture, fragment in CASES:
        text = report(fixture)
        if "Conforms: False" not in text:
            failures.append(f"{label}: accepted, but must be rejected")
        elif fragment not in text:
            failures.append(
                f"{label}: rejected, but not by its own constraint "
                f"(expected a message containing {fragment!r})"
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
        f"{len(CASES)} adversarial cases rejected, 2 positive controls accepted)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
