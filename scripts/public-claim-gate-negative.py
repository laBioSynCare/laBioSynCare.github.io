#!/usr/bin/env python3
"""Assert every clause of the public-claim applicability contract is load-bearing.

Audit finding KR-04. The public-claim gate on `sstim-sh:BscCatalogPresetShape` used to ask
one question — does some claim linked by the deprecated `sstim:supportsRelation`
reach the required tier — and so it accepted a well-evidenced *refutation*, a
claim about a different subject, a claim in a modality the preset does not
deliver, an unreviewed or withdrawn claim, and a claim citing literature it
never read. ADR 0050 replaced it with a conjunction of eight clauses.

A conjunction is only as good as its weakest untested clause. A positive suite
cannot tell a working clause from one deleted by a careless edit, because
conforming data conforms either way. So this works the other way round: it
builds one baseline that satisfies the whole contract, then breaks exactly one
thing at a time and requires the gate — by its own message, not merely some
message — to reject each result.

Two positive controls bracket the negatives: the baseline must conform, and a
C1 preset with no evidence at all must conform, because a gate that rejects
everything would pass every negative case here while making the ontology
unusable.

The fixtures are inline and namespaced to example.org. They are deliberately
invalid, and nothing invalid belongs in the published term space.
"""

import json
from pathlib import Path
import sys

from pyshacl import validate
from rdflib import Graph

ROOT = Path(__file__).resolve().parents[1]
ONTOLOGY = ROOT / "static" / "ontology"
SHAPES = ONTOLOGY / "sstim-shapes.ttl"

# The gate identifies itself. Matching the whole message would break on every
# wording change; matching this phrase breaks only if the gate stops firing.
GATE = "public-claim applicability contract"

PREAMBLE = """
@prefix dct:     <http://purl.org/dc/terms/> .
@prefix ex:      <https://example.org/kr04-fixture/> .
@prefix owl:     <http://www.w3.org/2002/07/owl#> .
@prefix prov:    <http://www.w3.org/ns/prov#> .
@prefix rdfs:    <http://www.w3.org/2000/01/rdf-schema#> .
@prefix sstim:   <https://w3id.org/sstim#> .
@prefix sstim-v: <https://w3id.org/sstim/vocab#> .
@prefix xsd:     <http://www.w3.org/2001/XMLSchema#> .
"""

# A preset at C3 (requiresEvidenceTierRank 4) authorized by an assessment that
# satisfies every clause of the contract. This is also the worked example of
# what an authorized public claim looks like; nothing in SSTIM currently is one.
BASELINE = """
ex:preset a sstim:Preset ;
    rdfs:label "KR-04 fixture preset" ;
    dct:description "Synthetic preset used only to test the public-claim gate." ;
    dct:created "2026-08-15"^^xsd:date ;
    dct:modified "2026-08-15"^^xsd:date ;
    sstim:targetsFrequencyBand sstim-v:alpha ;
    sstim:primaryFrequencyBand sstim-v:alpha ;
    sstim:inGroup sstim-v:groupPerform ;
    sstim:hasBreathGuide false ;
    sstim:presetVersion "1.0.0" ;
    sstim:hasPublicClaimLevel sstim-v:claimC3StructureFunction ;
    sstim:forImplementation ex:implementation ;
    sstim:followsProtocol ex:protocol ;
    sstim:composedOf ex:voice .

ex:framework a sstim:SensoryStimulationFramework ;
    rdfs:label "KR-04 fixture framework"@en ;
    dct:description "Synthetic framework used only to test the public-claim gate." ;
    sstim:definesTechnique sstim-v:techBinauralBeats .

ex:implementation a sstim:SensoryStimulationImplementation ;
    rdfs:label "KR-04 fixture implementation"@en ;
    dct:description "Synthetic implementation used only to test the public-claim gate." ;
    sstim:implementsFramework ex:framework .

ex:protocol a sstim:SensoryStimulationProtocol ;
    rdfs:label "KR-04 fixture protocol"@en ;
    dct:description "Synthetic protocol used only to test the public-claim gate." ;
    sstim:definedByFramework ex:framework ;
    sstim:usesTechnique sstim-v:techBinauralBeats .

ex:voice a sstim:Voice, sstim:BinauralVoice ;
    rdfs:label "KR-04 fixture binaural voice"@en ;
    sstim:carrierFreqLeft 200.0 ;
    sstim:carrierFreqRight 210.0 ;
    sstim:initialVolume 0.16 .

ex:claim a sstim:EvidenceAssessmentClaim, sstim:EvidenceClaim ;
    rdfs:label "KR-04 fixture assessment"@en ;
    dct:description "Synthetic assessment used only to test the public-claim gate." ;
    sstim:evaluatesSubject ex:preset ;
    sstim:supportsRelation ex:preset ;
    sstim:hasEvidenceTier sstim-v:tierModerate ;
    sstim:hasClaimDirection sstim-v:claimSupports ;
    sstim:assessesProposition ex:proposition ;
    sstim:hasEvidenceBasis ex:basis ;
    sstim:citesReference ex:reference ;
    dct:modified "2026-08-15"^^xsd:date ;
    prov:wasAttributedTo <https://orcid.org/0000-0002-9699-629X> .

ex:proposition a sstim:AssessmentProposition ;
    sstim:propositionSubject ex:preset ;
    sstim:propositionOutcome ex:outcome ;
    sstim:hasAssessmentScope ex:scope ;
    sstim:hasPropositionForm sstim-v:formBoundedRelation ;
    sstim:propositionText "Synthetic bounded proposition."@en .

ex:outcome a sstim:EvidenceOutcomeConcept ;
    rdfs:label "KR-04 fixture outcome"@en .

ex:scope a sstim:AssessmentScope ;
    sstim:scopeSensoryModality sstim-v:modalityAuditory ;
    sstim:scopePopulationOrModel ex:population ;
    sstim:scopeInterventionOrContext ex:preset ;
    sstim:scopeComparator ex:comparator .

ex:basis a sstim:EvidenceBasis ;
    sstim:basisSource ex:reference ;
    sstim:basisSensoryModality sstim-v:modalityAuditory .

ex:reference a sstim:PublicSafeReference ;
    sstim:referenceKey "FIXTURE_2024" ;
    dct:title "Synthetic reference for the KR-04 public-claim gate fixture" ;
    dct:creator "Fabbri, Renato" ;
    dct:issued "2024-01-01"^^xsd:date ;
    dct:identifier "doi:10.5281/zenodo.0000000" .

ex:review a sstim:EvidenceReviewDecision ;
    rdfs:label "KR-04 fixture review decision"@en ;
    sstim:reviewsAssessment ex:claim ;
    sstim:hasReviewerRelationship sstim-v:reviewerExternal ;
    sstim:hasIndependenceDetermination ex:independence ;
    sstim:hasReviewDecision sstim-v:reviewConfirm .

ex:independence a sstim:IndependenceDetermination ;
    rdfs:label "KR-04 fixture independence determination"@en .
"""

# A C1 preset (requiresEvidenceTierRank 0) with no evidence whatsoever. The gate
# must stay silent: C0/C1/C2 are assertable without evidence, and a gate that
# forgot the `?req >= 1` guard would quietly make the whole catalog invalid.
UNGATED = """
ex:c1-preset a sstim:Preset ;
    rdfs:label "KR-04 fixture C1 preset" ;
    dct:description "Synthetic preset below the evidence threshold." ;
    dct:created "2026-08-15"^^xsd:date ;
    dct:modified "2026-08-15"^^xsd:date ;
    sstim:targetsFrequencyBand sstim-v:alpha ;
    sstim:primaryFrequencyBand sstim-v:alpha ;
    sstim:inGroup sstim-v:groupPerform ;
    sstim:hasBreathGuide false ;
    sstim:presetVersion "1.0.0" ;
    sstim:hasPublicClaimLevel sstim-v:claimC1Experiential ;
    sstim:forImplementation ex:implementation ;
    sstim:followsProtocol ex:protocol ;
    sstim:composedOf ex:voice .

ex:framework a sstim:SensoryStimulationFramework ;
    rdfs:label "KR-04 fixture framework"@en ;
    dct:description "Synthetic framework used only to test the public-claim gate." ;
    sstim:definesTechnique sstim-v:techBinauralBeats .

ex:implementation a sstim:SensoryStimulationImplementation ;
    rdfs:label "KR-04 fixture implementation"@en ;
    dct:description "Synthetic implementation used only to test the public-claim gate." ;
    sstim:implementsFramework ex:framework .

ex:protocol a sstim:SensoryStimulationProtocol ;
    rdfs:label "KR-04 fixture protocol"@en ;
    dct:description "Synthetic protocol used only to test the public-claim gate." ;
    sstim:definedByFramework ex:framework ;
    sstim:usesTechnique sstim-v:techBinauralBeats .

ex:voice a sstim:Voice, sstim:BinauralVoice ;
    rdfs:label "KR-04 fixture binaural voice"@en ;
    sstim:carrierFreqLeft 200.0 ;
    sstim:carrierFreqRight 210.0 ;
    sstim:initialVolume 0.16 .
"""

# (label, old, new, clause). `old = None` appends `new` instead of replacing.
# Each replacement must match exactly once — a mutation that silently applied
# nowhere would "pass" by testing the baseline twice.
CASES = [
    (
        "a well-evidenced refutation",
        "sstim:hasClaimDirection sstim-v:claimSupports",
        "sstim:hasClaimDirection sstim-v:claimRefutes",
        "direction",
    ),
    (
        "an inconclusive assessment at a sufficient tier",
        "sstim:hasClaimDirection sstim-v:claimSupports",
        "sstim:hasClaimDirection sstim-v:claimInconclusive",
        "direction",
    ),
    (
        "supporting evidence one tier below the requirement",
        "sstim:hasEvidenceTier sstim-v:tierModerate",
        "sstim:hasEvidenceTier sstim-v:tierPreliminary",
        "tier rank",
    ),
    (
        "a proposition about something other than the preset",
        "sstim:propositionSubject ex:preset",
        "sstim:propositionSubject sstim-v:alphaOscillation",
        "subject",
    ),
    (
        "a scope established under a different intervention",
        "sstim:scopeInterventionOrContext ex:preset",
        "sstim:scopeInterventionOrContext ex:some-other-intervention",
        "context",
    ),
    (
        "a scope that names no population or model",
        "    sstim:scopePopulationOrModel ex:population ;\n",
        "",
        "population",
    ),
    (
        "evidence in a modality the preset does not deliver",
        "sstim:scopeSensoryModality sstim-v:modalityAuditory",
        "sstim:scopeSensoryModality sstim-v:modalityVisual",
        "modality",
    ),
    (
        "a citation the assessment never used as a basis",
        "sstim:citesReference ex:reference ;",
        "sstim:citesReference ex:borrowed-reference ;",
        "citation integrity",
    ),
    (
        "a cited reference that is not public-safe",
        "ex:reference a sstim:PublicSafeReference ;",
        "ex:reference a sstim:BibliographicReference ;",
        "citation integrity",
    ),
    (
        "an assessment nobody reviewed",
        "ex:review a sstim:EvidenceReviewDecision ;",
        "ex:review a owl:Thing ;",
        "review state",
    ),
    (
        "a rejected assessment",
        "sstim:hasReviewDecision sstim-v:reviewConfirm",
        "sstim:hasReviewDecision sstim-v:reviewReject",
        "review state",
    ),
    (
        "an assessment confirmed once and sent back for revision once",
        None,
        """
        ex:second-review a sstim:EvidenceReviewDecision ;
            rdfs:label "KR-04 fixture contradicting review"@en ;
            sstim:reviewsAssessment ex:claim ;
            sstim:hasReviewerRelationship sstim-v:reviewerExternal ;
            sstim:hasIndependenceDetermination ex:independence ;
            sstim:hasReviewDecision sstim-v:reviewRequestRevision .
        """,
        "review state",
    ),
    (
        "a withdrawn assessment",
        None,
        "ex:claim owl:deprecated true .",
        "currency",
    ),
    (
        "an assessment superseded by its successor",
        None,
        "ex:claim dct:isReplacedBy ex:claim-revision-2 .",
        "currency",
    ),
    (
        "an assessment its successor declares it replaces",
        None,
        "ex:claim-revision-2 dct:replaces ex:claim .",
        "currency",
    ),
    (
        # Not a mutation of the assessment but of the *vocabulary*: a claim level
        # that forgot to state what evidence it requires. Before ADR 0051 added
        # PublicClaimLevelShape this made the gate pass vacuously for every
        # preset using that level — the one failure mode a safety gate must not
        # have. It is rejected by that shape rather than by the gate, which is
        # the point: the gate can no longer be switched off by an omission.
        "a claim level that states no evidence requirement",
        None,
        """
        ex:invented-level a owl:NamedIndividual, sstim:PublicClaimLevel ;
            rdfs:label "KR-04 fixture level with no requirement"@en ;
            sstim:claimLevelRank 3 .
        """,
        "vocabulary integrity",
    ),
    (
        "an evidence tier that states no rank",
        None,
        """
        ex:invented-tier a owl:NamedIndividual, sstim:EvidenceTierValue ;
            rdfs:label "KR-04 fixture tier with no rank"@en .
        """,
        "vocabulary integrity",
    ),
    (
        "a medical claim backed by the strongest possible evidence",
        "sstim:hasPublicClaimLevel sstim-v:claimC3StructureFunction",
        "sstim:hasPublicClaimLevel sstim-v:claimC4Medical",
        "C4 sentinel",
    ),
]

# The borrowed reference is complete and public-safe; the only thing wrong with
# it is that no basis of the assessment names it. Kept out of the baseline so
# the citation-integrity case is the sole difference.
BORROWED = """
ex:borrowed-reference a sstim:PublicSafeReference ;
    sstim:referenceKey "BORROWED_2024" ;
    dct:title "Synthetic reference the fixture assessment never read" ;
    dct:creator "Fabbri, Renato" ;
    dct:issued "2024-01-01"^^xsd:date ;
    dct:identifier "doi:10.5281/zenodo.0000001" .
"""


def module_paths() -> list[Path]:
    manifest = json.loads((ONTOLOGY / "manifest.json").read_text(encoding="utf-8"))
    paths = [ROOT / m["source"]["path"] for m in manifest["modules"]]
    if not paths:
        raise SystemExit("public-claim-gate-negative: manifest listed no modules")
    return paths


def report_for(base: Graph, shapes: Graph, fixture: str) -> str:
    graph = Graph()
    for triple in base:
        graph.add(triple)
    graph.parse(data=PREAMBLE + fixture, format="turtle")
    _, _, text = validate(graph, shacl_graph=shapes, advanced=True)
    return text


def main() -> int:
    shapes = Graph().parse(SHAPES, format="turtle")

    # Every module, so the gate can resolve tier ranks, claim-level
    # requirements and technique modalities, and so sh:class sees the
    # subclass axioms.
    base = Graph()
    for path in module_paths():
        base.parse(path, format="turtle")

    failures: list[str] = []

    # ── Positive controls ────────────────────────────────────────────────────
    for label, fixture in (
        ("baseline satisfying the whole contract", BASELINE),
        ("C1 preset with no evidence", UNGATED),
    ):
        text = report_for(base, shapes, fixture)
        if GATE in text:
            failures.append(f"{label}: the gate fired on data that satisfies it")
        elif "Conforms: False" in text:
            failures.append(
                f"{label}: rejected by some other shape, so the gate is untested here\n"
                f"{text}"
            )

    # ── Adversarial negatives ────────────────────────────────────────────────
    for label, old, new, clause in CASES:
        if old is None:
            fixture = BASELINE + "\n" + new
        else:
            found = BASELINE.count(old)
            if found != 1:
                failures.append(
                    f"{label}: mutation matched the baseline {found} times, expected 1 — "
                    f"the fixture is stale, not the gate"
                )
                continue
            fixture = BASELINE.replace(old, new)
        if "ex:borrowed-reference" in fixture:
            fixture += BORROWED

        text = report_for(base, shapes, fixture)
        if clause == "vocabulary integrity":
            # Rejected by PublicClaimLevelShape / EvidenceTierValueShape rather
            # than by the gate: the gate never sees a level it cannot read, which
            # is precisely why the omission had to be made invalid.
            if "must state" not in text:
                failures.append(
                    f"{label}: not rejected by the vocabulary shape — the gate "
                    f"can still be disabled by omitting a triple (ADR 0050)"
                )
        elif GATE not in text:
            failures.append(
                f"{label}: accepted — the {clause} clause of the contract is not "
                f"load-bearing (ADR 0050)"
            )

    if failures:
        print(f"public-claim-gate-negative: FAILED ({len(failures)})", file=sys.stderr)
        for failure in failures:
            print(f"  - {failure}", file=sys.stderr)
        return 1

    clauses = sorted({clause for _, _, _, clause in CASES})
    print(
        f"public-claim-gate-negative: passed ({len(CASES)} adversarial cases rejected "
        f"across {len(clauses)} clauses; 2 positive controls accepted)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
