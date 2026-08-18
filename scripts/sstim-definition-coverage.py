#!/usr/bin/env python3
"""Every published term must define itself and be addressable by notation.

Directed by the maintainer after the first-pass review found that all 17
`sstim:FrequencyBand` concepts — the most-referenced vocabulary in SSTIM —
carried a `skos:scopeNote` and no `skos:definition`. ADR 0049 rewrote every one
of those scope notes six weeks earlier without noticing, because nothing
checked.

Concepts are the point. The existing gates cover OWL classes and properties well
and SKOS concepts hardly at all, and all 26 gaps were concepts. `pyLODE` and
WIDOCO render `skos:definition` preferentially, so an undefined concept is
published as a blank entry in the reference documentation.

A definition is also held to a floor: it must not merely restate the label, and
it must be long enough to distinguish the term from a sibling. Both bars are low
on purpose — this catches absence and near-absence, not style.

The second half checks `skos:notation` uniqueness, and the rule it enforces is
**per category, not global**. A review first read the 17 cross-category repeats
as defects; they are not. `eye-strain` names a comfort boundary, an effect and a
reported experience, and those are three different things that share a word.
What must never repeat is one notation twice inside one category, because that
is what a consumer resolves against — `preset-contract.py` resolves 45
controlled values by (category, notation) exactly.

So the rule was always per-category and was simply never written down or
checked. It holds today across 77 categories with zero collisions; this keeps it
holding.

The third part answers the second-pass review of 2026-08-17, which found
nineteen definitions "too thin to define" and concluded that a length check is
the wrong instrument: `paramLuminance: "The brightness of a visual stimulus."`
clears any length bar while saying nothing the label does not. Its disposition
was that the bar should be "a definition must distinguish the term from its
siblings".

The approximation used here is that a definition must contribute at least three
content words the label does not already have. It is crude, and it is the only
mechanical proxy for "says something new" that does not require judgement. 17 terms fail it today; they are listed in RESTATES_LABEL as debt rather than
waived, so a new concept cannot ship with a definition that restates its label,
and the existing eleven stay visible until someone who knows the domain rewrites
them. Writing neuroscience definitions is not a job for a mechanical gate.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
import sys

from rdflib import Graph, RDF, URIRef
from rdflib.namespace import SKOS, RDFS, OWL

ROOT = Path(__file__).resolve().parents[1]
ONTOLOGY = ROOT / "static" / "ontology"
BASE = "https://w3id.org/sstim"

# Short definitions that genuinely need no more words. Each is here because a
# longer one would pad rather than clarify; an entry is a decision, not a waiver.
BREVITY_ALLOWED = {
    "eventPlaybackStart", "eventPlaybackEnd", "eventPause", "eventResume",
    "modelInVitro", "modelInVivo",
}
MIN_DEFINITION = 30

# A definition must add at least this many content words the label does not have.
MIN_NOVEL_WORDS = 3

# Concepts whose definition restates their label, as of 2026-08-18. Debt, not a
# waiver: each needs a definition that distinguishes it from its siblings, and
# the gate fails if one is fixed and left listed, so the ledger stays honest.
RESTATES_LABEL = {
    "approachEpidural", "approachIntrathecal", "mediumRigidSurfaceContact",
    "modelHuman", "modelInVitro", "phenomenonAutonomicNeuralRegulation",
    "phenomenonConnectivityOrPlasticity", "phenomenonExcitabilityOrFiring",
    "phenomenonNeurochemicalSignaling", "phenomenonSynapticTransmission",
    "resolutionUnchanged", "searchEligibilityCriteria", "severityUnknown",
    "targetCranialNerve", "targetPeripheralNerve", "targetSpinalCord",
    "visualDensity",
}

# Words too common to count as contributed meaning.
_STOPWORDS = frozenset(
    "the a an of in to for and or is are was were be been being with by on at as"
    " that which it its this these those from into over under between within not"
    " no any all each per such other than then when where while about".split()
)


def _content_words(text: str) -> set[str]:
    """Lowercase alphabetic words carrying meaning, stopwords removed."""
    return {w for w in re.findall(r"[a-z]+", text.casefold())} - _STOPWORDS


def main() -> int:
    manifest = json.loads((ONTOLOGY / "manifest.json").read_text(encoding="utf-8"))
    modules = manifest["modules"]
    if not modules:
        raise SystemExit("definition-coverage: the manifest listed no modules")

    graph = Graph()
    for module in modules:
        graph.parse(ROOT / module["source"]["path"], format="turtle")

    def ours(term) -> bool:
        return isinstance(term, URIRef) and str(term).startswith(BASE)

    def local(term) -> str:
        text = str(term)
        return text.split("#")[-1] if "#" in text else text.rsplit("/", 1)[-1]

    subjects = {
        "concept": {c for c in graph.subjects(RDF.type, SKOS.Concept) if ours(c)},
        "class": {c for c in graph.subjects(RDF.type, OWL.Class) if ours(c)},
        "property": {
            p
            for t in (OWL.ObjectProperty, OWL.DatatypeProperty)
            for p in graph.subjects(RDF.type, t)
            if ours(p)
        },
    }
    if not subjects["concept"] or not subjects["class"]:
        raise SystemExit(
            "definition-coverage: found no concepts or no classes — the check would "
            "pass vacuously"
        )

    failures: list[str] = []
    checked = 0
    for kind, terms in subjects.items():
        for term in sorted(terms, key=str):
            name = local(term)
            definitions = [str(d).strip() for d in graph.objects(term, SKOS.definition)]
            if not definitions:
                failures.append(
                    f"{kind} {name}: no skos:definition. A scope note is not a "
                    f"definition, and pyLODE publishes this term blank."
                )
                continue
            checked += 1
            best = max(definitions, key=len)
            labels = [
                str(l)
                for predicate in (SKOS.prefLabel, RDFS.label)
                for l in graph.objects(term, predicate)
            ]
            if any(best.rstrip(".").casefold() == l.casefold() for l in labels):
                failures.append(f"{kind} {name}: the definition only restates the label")
            elif len(best) < MIN_DEFINITION and name not in BREVITY_ALLOWED:
                failures.append(
                    f"{kind} {name}: definition is {len(best)} characters "
                    f"({best!r}) — too short to distinguish it from a sibling. Add "
                    f"it to BREVITY_ALLOWED if the brevity is deliberate."
                )
            else:
                novel = _content_words(best) - set().union(
                    *(_content_words(l) for l in labels)
                ) if labels else _content_words(best)
                restates = len(novel) < MIN_NOVEL_WORDS
                if restates and name not in RESTATES_LABEL:
                    failures.append(
                        f"{kind} {name}: the definition adds {len(novel)} content "
                        f"word(s) the label does not have ({best!r}) — say what "
                        f"distinguishes it from its siblings, or record it in "
                        f"RESTATES_LABEL deliberately."
                    )
                elif not restates and name in RESTATES_LABEL:
                    failures.append(
                        f"{kind} {name}: no longer restates its label — remove it "
                        f"from RESTATES_LABEL so the recorded debt stays honest."
                    )

    # ── notation uniqueness, per category ───────────────────────────────────
    from collections import defaultdict

    by_category: dict[URIRef, dict[str, list[str]]] = defaultdict(lambda: defaultdict(list))
    for concept in subjects["concept"]:
        categories = [
            t for t in graph.objects(concept, RDF.type)
            if ours(t) and t != SKOS.Concept
        ]
        for notation in graph.objects(concept, SKOS.notation):
            for category in categories:
                by_category[category][str(notation)].append(local(concept))

    if not by_category:
        raise SystemExit(
            "definition-coverage: no concept carries both a category and a notation — "
            "the uniqueness check would pass vacuously"
        )

    collisions = 0
    for category, notations in by_category.items():
        for notation, names in notations.items():
            if len(names) > 1:
                collisions += 1
                failures.append(
                    f"notation {notation!r} is used by {names} within one category "
                    f"({local(category)}) — a consumer resolving by (category, "
                    f"notation) cannot tell them apart"
                )

    if failures:
        print(f"definition-coverage: FAILED ({len(failures)})", file=sys.stderr)
        for failure in failures:
            print(f"  - {failure}", file=sys.stderr)
        return 1

    print(
        f"definition-coverage: passed ({checked} terms defined, "
        f"{len(by_category)} categories with unique notations — "
        + ", ".join(
            f"{len(v)} " + {"class": "classes", "property": "properties"}.get(k, k + "s")
            for k, v in subjects.items()
        )
        + ")"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
