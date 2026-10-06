#!/usr/bin/env python3
"""Assert that the rules GB-02 added are load-bearing.

Conforming data conforms whether or not a rule exists, so only a rejection
proves one is there. This makes one pySHACL run, in the mode `make
shacl-instances` uses (no inference, no SHACL-AF), over SSTIM's real public
data with two kinds of addition.

1. The review's reproduction (docs/ontology/reviews/
   2026-09-30-what-a-green-gate-does-not-see.md, GB-02), appended to the real
   records it names. Until 0.19.0 the data with these five triples gave
   `Conforms: True`. Now each must be rejected for its own reason, and the real
   data must give no other result at all:

       a frequency band as a preset's caution tag     HasCautionTagRangeShape
       a frequency band as a basis's study design     BasisStudyDesignRangeShape
       a literal as a basis's effect direction        BasisObservedEffectDirectionRangeShape
       a caution tag as a basis's study population    BasisStudyPopulationRangeShape
       a preset derived from itself                   DerivedFromRangeShape (irreflexive)

2. Synthetic records that each break one of the rules written for the
   instances no shape targeted, or the rule for a record-valued range, bracketed
   by positive controls, because a rule that rejected everything would pass
   every negative here. One control is a bare reference to a specification
   described in another graph, which a record-valued range must accept.
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
FIXTURE = "https://example.org/gb-02-fixture/"

PRESET = "https://w3id.org/sstim/implementation/bsclab/preset/perform-alpha-10-seed"
BASIS = (
    "https://w3id.org/sstim/implementation/bsclab/evidence/"
    "perform-alpha-10-seed-auditory-review/revision/1/basis-1"
)

# Verbatim from the review, prefixes included.
REPRODUCTION = """
@prefix sstim: <https://w3id.org/sstim#> .
@prefix sstim-v: <https://w3id.org/sstim/vocab#> .
@prefix bsclab-preset: <https://w3id.org/sstim/implementation/bsclab/preset/> .

# A frequency band where a safety caution belongs.
bsclab-preset:perform-alpha-10-seed sstim:hasCautionTag sstim-v:alpha .

# Evidence-basis metadata of the wrong kinds entirely.
<https://w3id.org/sstim/implementation/bsclab/evidence/perform-alpha-10-seed-auditory-review/revision/1/basis-1>
    sstim:basisStudyDesign sstim-v:alpha ;
    sstim:basisObservedEffectDirection "strongly positive" ;
    sstim:basisStudyPopulation sstim-v:cautionDrivingUnsafe .

# A preset derived from itself; derivedFrom is declared irreflexive.
bsclab-preset:perform-alpha-10-seed sstim:derivedFrom bsclab-preset:perform-alpha-10-seed .
"""

# (focus node, start of the message) for each triple: all five, and nothing else.
EXPECTED = {
    (PRESET, "sstim:hasCautionTag takes sstim:CautionTag values"),
    (BASIS, "sstim:basisStudyDesign takes sstim:StudyDesign values"),
    (BASIS, "sstim:basisObservedEffectDirection takes sstim:EffectDirection values"),
    (BASIS, "sstim:basisStudyPopulation takes sstim:PopulationDescriptor values"),
    (PRESET, "A preset cannot be derived from itself"),
}

PREAMBLE = f"""
@prefix ex:       <{FIXTURE}> .
@prefix sstim:    <https://w3id.org/sstim#> .
@prefix sstim-v:  <https://w3id.org/sstim/vocab#> .
@prefix sstim-ex: <https://w3id.org/sstim/exposure#> .
@prefix rdfs:     <http://www.w3.org/2000/01/rdf-schema#> .
@prefix dct:      <http://purl.org/dc/terms/> .
@prefix prov:     <http://www.w3.org/ns/prov#> .
@prefix xsd:      <http://www.w3.org/2001/XMLSchema#> .
"""

ASSESSMENT_ACTIVITY = """
ex:activity a sstim:EvidenceAssessmentActivity ;
    prov:used ex:method ;
    prov:endedAtTime "2026-10-06T12:00:00Z"^^xsd:dateTime ;
    prov:qualifiedAssociation [ a prov:Association ; prov:agent ex:curator ; prov:hadRole ex:editor ] .
ex:population a sstim:PopulationDescriptor ;
    rdfs:label "GB-02 fixture population"@en .
"""

STATUS_ACTIVITY = """
ex:activity a sstim-ex:KnowledgeStatusActivity ;
    prov:used ex:method ;
    prov:endedAtTime "2026-10-06T12:00:00Z"^^xsd:dateTime ;
    prov:qualifiedAssociation [ a prov:Association ; prov:agent ex:curator ; prov:hadRole ex:editor ] .
"""

EXPLORATION = """
ex:protocol a sstim-ex:ExploratoryProtocol ;
    rdfs:label "GB-02 fixture protocol"@en ;
    dct:description "A baseline protocol, for the fixture."@en ;
    sstim-ex:hasKnowledgeStatus sstim-ex:knownInSSTIM .
ex:hypothesis a sstim-ex:ExposureHypothesis ;
    rdfs:label "GB-02 fixture hypothesis"@en ;
    dct:description "An expected difference, for the fixture."@en ;
    sstim-ex:concernsEffectDimension sstim-ex:effectCalm ;
    sstim-ex:hasKnowledgeStatus sstim-ex:hypothesisInSSTIM .
"""

# A record-valued range accepts an IRI the graph does not type: a record
# described elsewhere, as example 04's preset is specified by example 01's.
REFERENCE = """
ex:configuration sstim:specifiedBy ex:specification-described-elsewhere .
"""

POSITIVES = [
    ("an assessment activity and a descriptor that say what they must", ASSESSMENT_ACTIVITY),
    ("a status activity that says what it must", STATUS_ACTIVITY),
    ("an exploratory protocol and a hypothesis that say what they must", EXPLORATION),
    ("a specification described in another graph", REFERENCE),
]

NEGATIVES = [
    (
        "a population descriptor with no label",
        ASSESSMENT_ACTIVITY.replace('    rdfs:label "GB-02 fixture population"@en .', '    dct:description "Unlabelled."@en .'),
        "is an identified description",
    ),
    (
        "an assessment activity with no time",
        ASSESSMENT_ACTIVITY.replace('    prov:endedAtTime "2026-10-06T12:00:00Z"^^xsd:dateTime ;\n', ""),
        "must record when the assessment was made",
    ),
    (
        "an assessment activity whose association names no role",
        ASSESSMENT_ACTIVITY.replace(" ; prov:hadRole ex:editor ]", " ]"),
        "must carry a qualified association naming the responsible agent and role",
    ),
    (
        "an assessment activity that did not use its assessment's basis",
        ASSESSMENT_ACTIVITY + "ex:assessment prov:wasGeneratedBy ex:activity ; sstim:hasEvidenceBasis ex:basis .\n",
        "must have used every evidence basis of the assessment it generated",
    ),
    (
        "a status activity that records no method",
        STATUS_ACTIVITY.replace("    prov:used ex:method ;\n", ""),
        "must record with prov:used the method or corpus revision",
    ),
    (
        "a hypothesis with an evidence tier",
        EXPLORATION.replace(
            "    sstim-ex:concernsEffectDimension sstim-ex:effectCalm ;",
            "    sstim-ex:concernsEffectDimension sstim-ex:effectCalm ;\n    sstim:hasEvidenceTier sstim-v:tierC1 ;",
        ),
        "it carries no evidence tier",
    ),
    (
        "a hypothesis that is also an evidence claim",
        EXPLORATION.replace("a sstim-ex:ExposureHypothesis ;", "a sstim-ex:ExposureHypothesis, sstim:EvidenceClaim ;"),
        "cannot also be an sstim:EvidenceClaim",
    ),
    (
        "a hypothesis that does not say what it states",
        EXPLORATION.replace('    dct:description "An expected difference, for the fixture."@en ;\n', ""),
        "must say what it states in a dct:description",
    ),
    (
        "an effect dimension stated by a protocol",
        EXPLORATION.replace(
            "    sstim-ex:hasKnowledgeStatus sstim-ex:knownInSSTIM .",
            "    sstim-ex:hasKnowledgeStatus sstim-ex:knownInSSTIM ;\n    sstim-ex:concernsEffectDimension sstim-ex:effectCalm .",
        ),
        "is stated by a hypothesis, research question, design objective or planned-outcome specification",
    ),
    (
        "a knowledge status on something no status describes",
        "ex:thing rdfs:label \"GB-02 fixture thing\"@en ;\n    sstim-ex:hasKnowledgeStatus sstim-ex:knownInSSTIM .\n",
        "sstim-ex:hasKnowledgeStatus describes a protocol",
    ),
    (
        "an exploratory protocol with no description",
        EXPLORATION.replace('    dct:description "A baseline protocol, for the fixture."@en ;\n', ""),
        "ExploratoryProtocol must have a scoped dct:description",
    ),
    (
        "a specification that this graph describes as something else",
        REFERENCE + "ex:specification-described-elsewhere a sstim:StimulationSignal .\n",
        "sstim:specifiedBy takes sstim:StimulusSpecification values",
    ),
    (
        "a preset derived from a literal",
        'ex:configuration sstim:derivedFrom "preset 12" .\n',
        "sstim:derivedFrom takes sstim:Preset values",
    ),
]


def module_paths() -> list[Path]:
    manifest = json.loads((ONTOLOGY / "manifest.json").read_text(encoding="utf-8"))
    return [ROOT / module["source"]["path"] for module in manifest["modules"]]


def namespaced(fixture: str, tag: str) -> str:
    # Not `\bex:`: a word boundary also falls inside `sstim-ex:`, which would
    # rename the exposure predicates with the fixture.
    return re.sub(r"(?<![\w-])ex:", f"ex:{tag}-", fixture)


def main() -> int:
    shapes = Graph().parse(SHAPES, format="turtle")
    shapes.parse(BSC_SHAPES, format="turtle")

    # What `make shacl-instances` validates, plus the reproduction and fixtures.
    data = Graph()
    for path in module_paths():
        data.parse(path, format="turtle")
    data.parse(BSC_VOCAB, format="turtle")
    instance_files = sorted((ONTOLOGY / "instances").glob("*/*.ttl")) + sorted((ONTOLOGY / "instances").glob("*/*/*.ttl"))
    for path in instance_files:
        data.parse(path, format="turtle")
    data.parse(data=REPRODUCTION, format="turtle")
    for index, (_, fixture) in enumerate(POSITIVES):
        data.parse(data=PREAMBLE + namespaced(fixture, f"p{index}"), format="turtle")
    for index, (_, fixture, _) in enumerate(NEGATIVES):
        data.parse(data=PREAMBLE + namespaced(fixture, f"n{index}"), format="turtle")

    _, results, _ = validate(data, shacl_graph=shapes, inference="none", advanced=False)
    # The report's own results only: a failed sh:node also nests the inner
    # result, on the inner node, as sh:detail.
    reported: list[tuple[str, str]] = []
    for report in results.subjects(RDF.type, SH.ValidationReport):
        for result in results.objects(report, SH.result):
            message = " ".join(str(m) for m in results.objects(result, SH.resultMessage))
            for focus in results.objects(result, SH.focusNode):
                reported.append((str(focus), message))

    def anchor(focus: str) -> str | None:
        """The fixture a focus node belongs to, or None for the real data."""
        match = re.match(re.escape(FIXTURE) + r"([pn]\d+)-", focus)
        return match.group(1) if match else None

    failures: list[str] = []
    # No shape targets the fixtures' blank nodes, so a result on any node
    # outside the fixture namespace is about the real data, and must be one of
    # the five.
    real = {(focus, message) for focus, message in reported if anchor(focus) is None}
    def explained(focus: str, message: str) -> bool:
        return any(focus == node and message.startswith(start) for node, start in EXPECTED)

    for node, start in sorted(EXPECTED):
        if not any(focus == node and message.startswith(start) for focus, message in real):
            failures.append(f"the review's reproduction was not rejected: {node.rsplit('/', 1)[-1]}: {start}")
    for focus, message in sorted(real):
        if not explained(focus, message):
            failures.append(f"unexpected result on the real data: {focus}: {message}")

    def messages_for(tag: str) -> list[str]:
        return [message for focus, message in reported if anchor(focus) == tag]

    for index, (label, _) in enumerate(POSITIVES):
        hits = messages_for(f"p{index}")
        if hits:
            failures.append(f"{label}: rejected, but it satisfies the rules: {hits[:2]}")
    for index, (label, _, clause) in enumerate(NEGATIVES):
        hits = messages_for(f"n{index}")
        if not any(clause in message for message in hits):
            failures.append(f"{label}: not rejected for its own reason ({clause!r}); got {hits[:2]}")

    if failures:
        print(f"gb-02-negative: FAILED ({len(failures)})", file=sys.stderr)
        for failure in failures:
            print(f"  - {failure}", file=sys.stderr)
        return 1
    print(
        f"gb-02-negative: passed (the review's {len(EXPECTED)} triples each rejected for their own reason "
        f"and the real data otherwise clean; {len(NEGATIVES)} synthetic cases rejected; "
        f"{len(POSITIVES)} positive controls accepted)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
