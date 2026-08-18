#!/usr/bin/env python3
"""Measure multilingual coverage per scheme, and stop it regressing.

SSTIM advertises four languages. BARTOC records `en | it | es | pt`, FAIRsharing
lists the same four, and every module title is translated. Measured against the
concepts on 2026-08-18, that claim was half true: 269 of 545 concepts carried all
four languages and 276 carried English alone. 33 of the 67 schemes were complete
and 34 were untranslated.

The vocabulary was completed the same day — all 545 concepts now carry all four
languages — so this gate changed job. It no longer tracks debt down; it stops the
claim drifting back out of truth as new schemes are added.

The second-pass review of 2026-08-17 found the shape that made completion
tractable: no scheme was *partially* translated. Translation had been an
all-or-nothing act per scheme that simply stopped being performed as new modules
landed, so the vocabulary divided cleanly into schemes with four languages and
schemes with one.

Three rules, and the second is the one that matters:

1. A scheme is *complete* when every concept in it carries a prefLabel in all
   four languages, and *untranslated* when every concept carries English alone.
   Untranslated means English and nothing else: a scheme carrying en+it+pt but no
   Spanish is partial, not untranslated, because being three-quarters done is a
   different state from not being started.
2. A scheme that is neither — partially translated — fails. That property is
   what makes a per-scheme report meaningful rather than a vague percentage, and
   it held by accident before this gate existed. Now it holds on purpose.
3. UNTRANSLATED is empty, and every scheme must therefore be complete. A new
   scheme ships translated or is added to that set deliberately, which makes the
   set a ledger of debt rather than a waiver — and the gate fails if a listed
   scheme has since been translated, so it cannot overstate the debt either.

A concept in no scheme would be invisible to all of the above, so that is checked
too. Every concept is in exactly one scheme today.

Only `skos:prefLabel` is *gated*. `skos:altLabel` is **reported and not gated**,
because how many aliases a concept should carry is an ontology decision and not
this script's to make. It is reported at all because the alternative was worse:
with nothing measuring aliases, four documents stated that alias coverage was
zero, and by the time they said it the graph already carried fifteen. A number
nothing prints is a number that gets remembered wrongly — CLAUDE.md §3.6.

All 545 `skos:definition` values are English only, and translating them is a
larger job and a separate decision.
"""

from __future__ import annotations

import json
from pathlib import Path

from rdflib import Graph
from rdflib.namespace import RDF, SKOS

ROOT = Path(__file__).resolve().parents[1]
ONTOLOGY = ROOT / "static" / "ontology"

REQUIRED = ("en", "it", "pt", "es")

# Schemes that are English-only as of 2026-08-18. Each is translation debt, not
# a decision that it should stay English. Remove a name when its scheme is
# translated; the gate fails if a name here has become complete, so the ledger
# cannot silently overstate the debt either.
UNTRANSLATED: set[str] = set()


def local(term) -> str:
    text = str(term)
    return text.split("#")[-1] if "#" in text else text.rsplit("/", 1)[-1]


def main() -> int:
    manifest = json.loads((ONTOLOGY / "manifest.json").read_text(encoding="utf-8"))
    graph = Graph()
    for module in manifest["modules"]:
        graph.parse(ROOT / module["source"]["path"], format="turtle")

    complete, untranslated, partial = [], [], []
    # Counted as sets, not by summing per scheme: skos:inScheme is multi-valued,
    # and a concept in two schemes would otherwise be counted twice and could
    # push the reported total past the number of concepts that exist.
    concepts_seen: set = set()
    concepts_complete: set = set()

    for scheme in graph.subjects(RDF.type, SKOS.ConceptScheme):
        members = [c for c in graph.subjects(SKOS.inScheme, scheme)]
        if not members:
            continue
        full = 0
        english_only = 0
        seen_languages: set[str] = set()
        for concept in members:
            langs = {
                label.language
                for label in graph.objects(concept, SKOS.prefLabel)
                if label.language
            }
            seen_languages |= langs
            concepts_seen.add(concept)
            if all(code in langs for code in REQUIRED):
                full += 1
                concepts_complete.add(concept)
            elif langs == {"en"}:
                english_only += 1
        name = local(scheme)
        if full == len(members):
            complete.append(name)
        elif english_only == len(members):
            # Untranslated means English and nothing else. A scheme carrying,
            # say, en+it+pt but no Spanish is *partial*, not untranslated, and
            # must not be excusable by the ledger below — being three-quarters
            # done is a different state from not being started, and only the
            # second is debt someone can pick up in one pass.
            untranslated.append(name)
        else:
            missing = sorted(set(REQUIRED) - seen_languages) or ["mixed per concept"]
            partial.append((name, full, len(members), ", ".join(missing)))

    # A concept in no scheme is invisible to every check above, which is the
    # failure mode this repository keeps rediscovering: a gate that silently
    # stops covering something reads exactly like a gate that passes. Every
    # concept is in exactly one scheme today; this keeps it that way.
    orphans = sorted(
        local(c)
        for c in graph.subjects(RDF.type, SKOS.Concept)
        if c not in concepts_seen
    )

    issues = []
    for name in orphans:
        issues.append(
            f"{name} is a skos:Concept in no scheme, so no language check can "
            "see it — give it a skos:inScheme"
        )
    for name, full, total, missing in sorted(partial):
        issues.append(
            f"{name} is partially translated ({full}/{total} concepts complete, "
            f"missing: {missing}) — finish it; per-scheme all-or-nothing is what "
            "makes this report meaningful rather than a vague percentage"
        )
    for name in sorted(set(untranslated) - UNTRANSLATED):
        issues.append(
            f"{name} is English-only and is not recorded as known debt — "
            "translate it, or add it to UNTRANSLATED in this script deliberately"
        )
    for name in sorted(UNTRANSLATED - set(untranslated) - {row[0] for row in partial}):
        if name in complete:
            issues.append(
                f"{name} is now fully translated — remove it from UNTRANSLATED "
                "so the recorded debt matches the ontology"
            )

    # Alias coverage: reported, never gated. See the module docstring for why
    # this is measured at all — an unmeasured number is one that gets restated
    # from memory, and this one was restated as zero in four documents while the
    # aliases sat in the graph.
    #
    # Scoped to concepts in schemes, like every count above it, so the one
    # skos:altLabel on the class sstim:Preset is out of scope and the graph holds
    # one more alias than this reports. Say which question you are answering.
    alias_labels = [
        (c, label)
        for c in concepts_seen
        for label in graph.objects(c, SKOS.altLabel)
    ]
    alias_concepts = {c for c, _ in alias_labels}
    alias_langs = sorted({label.language for _, label in alias_labels if label.language})

    total_schemes = len(complete) + len(untranslated) + len(partial)
    concepts_total = len(concepts_seen)
    concepts_full = len(concepts_complete)
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
    print(
        f"language-coverage: aliases (not gated) — {len(alias_labels)} "
        f"skos:altLabel on {len(alias_concepts)}/{concepts_total} concepts, "
        f"{'/'.join(alias_langs) if alias_langs else 'none'}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
