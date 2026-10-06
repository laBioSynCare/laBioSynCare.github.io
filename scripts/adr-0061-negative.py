#!/usr/bin/env python3
"""Assert that the rules ADR 0061 added are load-bearing.

ADR 0061 moved the BSC framework's structure out of SSTIM's universal
namespaces, and put generic rules where catalog rules used to be. Conforming
data conforms whether or not a rule exists, so, like the public-claim gate
suite, this builds fixtures that each break exactly one rule and requires that
rule, by its own message on the fixture's own focus node, to reject it.

    SSTIM  a delivery status outside a scoped assertion       DeliveryStatusScopeShape
    SSTIM  a delivery status scoped only by a note             DeliveryStatusScopeShape
    SSTIM  a breath guide that is not one of the preset's tracks  PresetShape
    SSTIM  a breath guide whose breathing period is under 3 s  PresetShape
    BSC    a catalog voice in no grouped preset                bsc-sh:VoiceShape

Two positive controls bracket them, because a rule that rejected everything
would pass every negative here. The BSC catalog's own breath-guide rules and
its voice bounds are exercised by `make preset-contract`.
"""

from __future__ import annotations

import json
from pathlib import Path
import re
import sys

from pyshacl import validate
from rdflib import Graph, Namespace, RDF

ROOT = Path(__file__).resolve().parents[1]
ONTOLOGY = ROOT / "static" / "ontology"
SHAPES = ONTOLOGY / "sstim-shapes.ttl"
BSC_VOCAB = ONTOLOGY / "frameworks" / "bsc" / "bsc-vocab.ttl"
BSC_SHAPES = ONTOLOGY / "frameworks" / "bsc" / "bsc-shapes.ttl"
SH = Namespace("http://www.w3.org/ns/shacl#")

PREAMBLE = """
@prefix ex:       <https://example.org/adr-0061-fixture/> .
@prefix sstim:    <https://w3id.org/sstim#> .
@prefix sstim-ex: <https://w3id.org/sstim/exposure#> .
@prefix bsc-v:    <https://w3id.org/sstim/framework/bsc/vocab#> .
@prefix rdfs:     <http://www.w3.org/2000/01/rdf-schema#> .
@prefix dct:      <http://purl.org/dc/terms/> .
@prefix prov:     <http://www.w3.org/ns/prov#> .
@prefix xsd:      <http://www.w3.org/2001/XMLSchema#> .
"""

# A delivery status the way ADR 0061 requires it: inside an assertion whose
# scope is the implementation's IRI.
SCOPED_STATUS = """
ex:protocol a sstim-ex:ExploratoryProtocol ;
    rdfs:label "ADR 0061 fixture protocol"@en ;
    dct:description "A protocol whose delivery status the fixture scopes."@en ;
    sstim-ex:hasKnowledgeStatusAssertion ex:status .
ex:status a sstim-ex:KnowledgeStatusAssertion ;
    rdfs:label "ADR 0061 fixture status"@en ;
    sstim-ex:hasKnowledgeStatus sstim-ex:notCurrentlyDeliverable ;
    sstim-ex:knowledgeAsOfDate "2026-10-06"^^xsd:date ;
    sstim-ex:knowledgeScope ex:implementation ;
    prov:wasGeneratedBy ex:activity .
ex:activity a sstim-ex:KnowledgeStatusActivity ;
    prov:used ex:method ;
    prov:endedAtTime "2026-10-06T12:00:00Z"^^xsd:dateTime ;
    prov:qualifiedAssociation [ a prov:Association ; prov:agent ex:curator ; prov:hadRole ex:editor ] .
"""

# A preset whose breath guide is one of its own tracks, at a breathing period.
GUIDED_PRESET = """
ex:preset a sstim:Preset ;
    rdfs:label "ADR 0061 fixture preset" ;
    sstim:composedOfTrack ex:track ;
    sstim:breathGuideTrack ex:track .
ex:track a sstim:ControlTrack ;
    rdfs:label "ADR 0061 fixture breathing control" ;
    sstim:breathingPeriodInitial 4.0 .
"""

POSITIVES = [
    ("a delivery status in a scoped assertion", SCOPED_STATUS),
    ("a breath guide that is one of the preset's tracks", GUIDED_PRESET),
]

DELIVERY_SCOPE = "must be asserted by a KnowledgeStatusAssertion whose knowledgeScope is the IRI"
NEGATIVES = [
    (
        "a delivery status stated directly on a protocol",
        """
ex:protocol a sstim-ex:ExploratoryProtocol ;
    rdfs:label "ADR 0061 fixture protocol"@en ;
    dct:description "A protocol that states a delivery status directly."@en ;
    sstim-ex:hasKnowledgeStatus sstim-ex:notCurrentlyDeliverable .
""",
        DELIVERY_SCOPE,
    ),
    (
        "a delivery status scoped only by a note",
        SCOPED_STATUS.replace(
            "sstim-ex:knowledgeScope ex:implementation ;",
            'sstim-ex:knowledgeScopeNote "the reference implementation"@en ;',
        ),
        DELIVERY_SCOPE,
    ),
    (
        "a breath guide that is not one of the preset's tracks",
        GUIDED_PRESET.replace("sstim:breathGuideTrack ex:track .", "sstim:breathGuideTrack ex:other .")
        + """
ex:other a sstim:ControlTrack ;
    rdfs:label "ADR 0061 fixture stray control" ;
    sstim:breathingPeriodInitial 4.0 .
""",
        "breath guide must be one of its own tracks",
    ),
    (
        "a breath guide whose breathing period is under 3 s",
        # An audio track, so the control-track floor cannot be what fires.
        GUIDED_PRESET.replace("ex:track a sstim:ControlTrack ;", "ex:track a sstim:AudioTrack ;")
        .replace("sstim:breathingPeriodInitial 4.0 .", "sstim:breathingPeriodInitial 2.0 ."),
        "initial breathing period must be at least 3 s",
    ),
    (
        "a catalog voice in no grouped preset",
        """
ex:voice a sstim:AudioTrack, bsc-v:Voice, bsc-v:BinauralVoice ;
    rdfs:label "ADR 0061 fixture stray voice" ;
    sstim:carrierFreqLeft 200.0 ;
    sstim:carrierFreqRight 210.0 .
""",
        "must belong to a catalog preset",
    ),
]


def module_paths() -> list[Path]:
    manifest = json.loads((ONTOLOGY / "manifest.json").read_text(encoding="utf-8"))
    return [ROOT / module["source"]["path"] for module in manifest["modules"]]


def namespaced(fixture: str, tag: str) -> str:
    # Not `\bex:`, which the gate suite uses: a word boundary also falls inside
    # `sstim-ex:`, so its predicates would be renamed with the fixture and every
    # exposure rule would silently stop applying to it.
    return re.sub(r"(?<![\w-])ex:", f"ex:{tag}-", fixture)


def main() -> int:
    shapes = Graph().parse(SHAPES, format="turtle")
    shapes.parse(BSC_SHAPES, format="turtle")

    data = Graph()
    for path in module_paths():
        data.parse(path, format="turtle")
    data.parse(BSC_VOCAB, format="turtle")
    for index, (_, fixture) in enumerate(POSITIVES):
        data.parse(data=PREAMBLE + namespaced(fixture, f"p{index}"), format="turtle")
    for index, (_, fixture, _) in enumerate(NEGATIVES):
        data.parse(data=PREAMBLE + namespaced(fixture, f"n{index}"), format="turtle")

    _, results, _ = validate(data, shacl_graph=shapes, advanced=True)
    reported: dict[str, list[str]] = {}
    for result in results.subjects(RDF.type, SH.ValidationResult):
        for focus in results.objects(result, SH.focusNode):
            for message in results.objects(result, SH.resultMessage):
                reported.setdefault(str(focus), []).append(str(message))

    def messages_for(tag: str) -> list[str]:
        prefix = f"https://example.org/adr-0061-fixture/{tag}-"
        return [m for node, ms in reported.items() if node.startswith(prefix) for m in ms]

    failures: list[str] = []
    for index, (label, _) in enumerate(POSITIVES):
        hits = messages_for(f"p{index}")
        if hits:
            failures.append(f"{label}: rejected, but it satisfies the rules: {hits[:2]}")
    for index, (label, _, clause) in enumerate(NEGATIVES):
        hits = messages_for(f"n{index}")
        if not any(clause in message for message in hits):
            failures.append(f"{label}: not rejected for its own reason ({clause!r}); got {hits[:2]}")

    if failures:
        print(f"adr-0061-negative: FAILED ({len(failures)})", file=sys.stderr)
        for failure in failures:
            print(f"  - {failure}", file=sys.stderr)
        return 1
    print(
        f"adr-0061-negative: passed ({len(NEGATIVES)} adversarial cases rejected for "
        f"their own reason; {len(POSITIVES)} positive controls accepted)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
