#!/usr/bin/env python3
"""Assert no frequency band claims an outcome, and every moved association survived.

ADR 0049, acceptance conditions 1 and 2. Two checks, opposite in direction.

The first is a lint. A `sstim:FrequencyBand` is a Hz interval; it does not
relax anyone, improve anyone's sleep, or support anyone's pain. For years each
band's scope note said otherwise — "Deep sleep, heavy down-regulation",
"Relaxation, stress reduction, calm alertness" — unsourced, undated, and
attached to a number range. That is KR-08, and prose regresses easily, so the
vocabulary is checked rather than trusted.

The lint is deliberately blunt. It matches outcome and state words anywhere in a
band's scope note, which will occasionally flag a sentence that is really about
frequency. That costs one rewording. The failure it prevents cost an audit
finding and two years of a claim nobody had sourced.

The second check is the opposite worry: that the repair became a deletion. Every
association named in ADR 0049's table must still be reachable from its
oscillation, as an evidence assessment or as a dated knowledge-status assertion.
An association that simply vanished would pass the lint and lose the knowledge,
which the ADR explicitly refused.
"""

import json
from pathlib import Path
import re
import sys

from rdflib import Graph, Namespace, RDF, URIRef
from rdflib.namespace import SKOS

ROOT = Path(__file__).resolve().parents[1]
ONTOLOGY = ROOT / "static" / "ontology"

SSTIM = Namespace("https://w3id.org/sstim#")
SSTIM_V = Namespace("https://w3id.org/sstim/vocab#")
SSTIM_EX = Namespace("https://w3id.org/sstim/exposure#")

# Outcome and state vocabulary. A band may not carry these; an oscillation may,
# because an oscillation is a phenomenon that occurs in states.
OUTCOME_WORDS = re.compile(
    r"\b("
    r"sleep|sleepiness|drowsy|drowsiness|insomnia|"
    r"relax\w*|calm\w*|stress|anxiet\w*|mood|depress\w*|"
    r"pain|analges\w*|"
    r"attention|focus\w*|concentrat\w*|alert\w*|vigilan\w*|"
    r"cognit\w*|memory|creativ\w*|meditat\w*|"
    r"heal\w*|therap\w*|treat\w*|symptom\w*|"
    r"down-regulation|up-regulation"
    r")\b",
    re.IGNORECASE,
)

# The associations ADR 0049 moved off the band scope notes. Each must remain
# reachable from its oscillation in one of the two recorded forms.
MOVED_ASSOCIATIONS = {
    "deltaOscillation": 1,
    "thetaOscillation": 4,
    "alphaOscillation": 2,
    "smrOscillation": 1,
    "betaOscillation": 1,
    "gammaOscillation": 1,
}


def module_paths() -> list[Path]:
    manifest = json.loads((ONTOLOGY / "manifest.json").read_text(encoding="utf-8"))
    return [ROOT / m["source"]["path"] for m in manifest["modules"]]


def instance_paths() -> list[Path]:
    return sorted((ONTOLOGY / "instances").rglob("*.ttl"))


def main() -> int:
    failures: list[str] = []

    graph = Graph()
    for path in module_paths():
        graph.parse(path, format="turtle")

    # ── 1. No band asserts an outcome ────────────────────────────────────────
    bands = [b for b in graph.subjects(RDF.type, SSTIM.FrequencyBand) if isinstance(b, URIRef)]
    if not bands:
        failures.append("no sstim:FrequencyBand concepts found — the lint would pass vacuously")

    checked = 0
    for band in bands:
        for predicate in (SKOS.scopeNote, SKOS.definition, SKOS.prefLabel, SKOS.altLabel):
            for value in graph.objects(band, predicate):
                checked += 1
                hit = OUTCOME_WORDS.search(str(value))
                if hit:
                    failures.append(
                        f"{band.split('#')[-1]}: {predicate.split('#')[-1]} claims an outcome "
                        f"({hit.group(0)!r}) — a frequency band is a Hz interval. "
                        f"Move it to the oscillation as an evidence claim or a knowledge-status "
                        f"assertion (ADR 0049)."
                    )

    # ── 2. No moved association was silently dropped ─────────────────────────
    for path in instance_paths():
        graph.parse(path, format="turtle")

    for name, expected in MOVED_ASSOCIATIONS.items():
        oscillation = SSTIM_V[name]
        assessed = set(graph.subjects(SSTIM.evaluatesSubject, oscillation))
        statuses = set(graph.objects(oscillation, SSTIM_EX.hasKnowledgeStatusAssertion))
        found = len(assessed) + len(statuses)
        if found < expected:
            failures.append(
                f"{name}: {found} recorded association(s), expected at least {expected}. "
                f"ADR 0049 moved these off the band scope notes; deleting one loses the "
                f"knowledge that it was claimed."
            )

    if failures:
        print(f"band-scope-notes: FAILED ({len(failures)})", file=sys.stderr)
        for failure in failures:
            print(f"  - {failure}", file=sys.stderr)
        return 1

    total = sum(MOVED_ASSOCIATIONS.values())
    print(
        f"band-scope-notes: passed ({len(bands)} bands, {checked} labels and notes free of "
        f"outcome claims; {total} moved associations still recorded)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
