#!/usr/bin/env python3
"""Measure multilingual coverage per scheme, and stop it drifting further.

SSTIM advertises four languages. BARTOC records `en | it | es | pt`, FAIRsharing
lists the same four, and every module title is translated. Measured against the
concepts, that claim was half true on 2026-08-18: 269 of 545 concepts carried
all four languages and 276 carried English alone.

The second-pass review of 2026-08-17 found the useful part of the shape — no
scheme is *partially* translated. Translation has been an all-or-nothing act per
scheme that simply stopped being performed as new modules landed, so the
vocabulary divides cleanly into schemes with four languages and schemes with
one. Its disposition was that a per-scheme count would give KR-16 the metric it
lacks. This is that count, made executable.

Three rules, and the second is the one that matters:

1. A scheme is *complete* when every concept in it carries a prefLabel in all
   four languages, and *untranslated* when every concept carries English only.
2. A scheme that is neither — partially translated — fails. That property is
   what makes a per-scheme report meaningful rather than a vague percentage, and
   it holds today by accident. This makes it hold on purpose.
3. A scheme absent from UNTRANSLATED below must be complete. A new scheme is
   therefore translated before it ships, or it is added here deliberately and
   the count in this docstring stops matching, which is the point: the list is a
   ledger of debt, not a waiver, and it should only ever get shorter.

Nothing here translates anything. It measures, and it refuses to let the
measurement quietly get worse.
"""

from __future__ import annotations

import json
from pathlib import Path

from rdflib import Graph, URIRef
from rdflib.namespace import RDF, SKOS

ROOT = Path(__file__).resolve().parents[1]
ONTOLOGY = ROOT / "static" / "ontology"

REQUIRED = ("en", "it", "pt", "es")

# Schemes that are English-only as of 2026-08-18. Each is translation debt, not
# a decision that it should stay English. Remove a name when its scheme is
# translated; the gate fails if a name here has become complete, so the ledger
# cannot silently overstate the debt either.
UNTRANSLATED = {
    "AudioNoiseColorScheme", "BodyPlacementScheme", "ClaimDirectionScheme",
    "ComfortBoundaryScheme", "ConflictDisclosureScheme",
    "DeliveryMediumScheme", "DeviceCapabilityScheme",
    "EcosystemPurposeScheme", "EcosystemRelationScheme",
    "EffectDimensionScheme", "EffectDirectionScheme",
    "EngagementOutcomeScheme", "EvidencePropositionFormScheme",
    "EvidenceSynthesisTypeScheme", "ExperimentContextScheme",
    "IndependenceDeterminationScheme", "KnowledgeStatusScheme",
    "ModalityApplicabilityScheme", "PerceivedModalityScheme",
    "PerceptualGainScheme", "PerceptualLossScheme",
    "RenderableParameterScheme", "RenderingMechanismScheme",
    "RenderingPresenceScheme", "ReviewDecisionScheme", "ReviewStatusScheme",
    "ReviewerRelationshipScheme", "ScopeMarkerScheme", "SignalShapeScheme",
    "StimulusChannelRoleScheme", "StimulusPatternScheme",
    "StudyDesignScheme", "StudyModelScheme", "VisualNoiseScheme",
}


def local(term) -> str:
    text = str(term)
    return text.split("#")[-1] if "#" in text else text.rsplit("/", 1)[-1]


def main() -> int:
    manifest = json.loads((ONTOLOGY / "manifest.json").read_text(encoding="utf-8"))
    graph = Graph()
    for module in manifest["modules"]:
        graph.parse(ROOT / module["source"]["path"], format="turtle")

    complete, untranslated, partial = [], [], []
    concepts_total = concepts_full = 0

    for scheme in graph.subjects(RDF.type, SKOS.ConceptScheme):
        members = [c for c in graph.subjects(SKOS.inScheme, scheme)]
        if not members:
            continue
        full = 0
        for concept in members:
            langs = {
                label.language
                for label in graph.objects(concept, SKOS.prefLabel)
                if label.language
            }
            if all(code in langs for code in REQUIRED):
                full += 1
        concepts_total += len(members)
        concepts_full += full
        name = local(scheme)
        if full == len(members):
            complete.append(name)
        elif full == 0:
            untranslated.append(name)
        else:
            partial.append((name, full, len(members)))

    issues = []
    for name, full, total in sorted(partial):
        issues.append(
            f"{name} is partially translated ({full}/{total} concepts complete) — "
            "translate the remainder; per-scheme all-or-nothing is what makes "
            "this report meaningful"
        )
    for name in sorted(set(untranslated) - UNTRANSLATED):
        issues.append(
            f"{name} is English-only and is not recorded as known debt — "
            "translate it, or add it to UNTRANSLATED in this script deliberately"
        )
    for name in sorted(UNTRANSLATED - set(untranslated) - {n for n, _, _ in partial}):
        if name in complete:
            issues.append(
                f"{name} is now fully translated — remove it from UNTRANSLATED "
                "so the recorded debt matches the ontology"
            )

    total_schemes = len(complete) + len(untranslated) + len(partial)
    if issues:
        print(f"language-coverage: FAILED ({len(issues)} issue(s))")
        for issue in issues:
            print(f"  - {issue}")
        return 1

    pct_s = 100 * len(complete) / total_schemes if total_schemes else 0
    pct_c = 100 * concepts_full / concepts_total if concepts_total else 0
    print(
        f"language-coverage: passed ("
        f"{len(complete)}/{total_schemes} schemes complete in {'/'.join(REQUIRED)}, "
        f"{pct_s:.0f}%; {concepts_full}/{concepts_total} concepts, {pct_c:.0f}%; "
        f"{len(untranslated)} schemes are recorded translation debt)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
