#!/usr/bin/env python3
"""Verify the SSTIM to HED crosswalk against the pinned HED schema and SSTIM.

ADR 0025 makes HED a *generated* event-semantic profile: SSTIM event types are
the source of truth and HED annotations are produced from them by a versioned,
one-way, loss-declaring adapter. This checks the adapter's mapping table, which
is the part that silently rots — a HED tag that never existed, or that a schema
release removed, produces annotations that look fine and validate nowhere.

Four things are checked, and the first is the one that motivated the script.

1. **Every mapped string is valid HED against the pinned schema**, which
   subsumes the weaker property that each tag exists. Writing this map by hand
   the first time produced `Pulse`, `Modulation` and `Intensity`, none of which
   are HED 8.4.0 tags; all three were caught before they reached an artifact,
   back when this check was tag-existence only. It no longer is — see below for
   why that mattered.

2. **The mapping covers `sstim-v:SessionEventTypeScheme` exactly.** A new event
   type with no HED mapping would silently produce an incomplete profile, and a
   mapping for a retired event type is dead weight that reads as coverage.

3. **Loss is declared where the mapping is not injective.** Two SSTIM event
   types that emit identical HED must both say why, because that is precisely
   the information a consumer reading HED alone cannot recover.
   `eventSessionComplete` and `eventSessionInterrupt` are the live example: HED
   8.4.0 has no Incomplete, Abort or Terminate tag, so completion status is
   SSTIM-only and the map has to admit it.

4. **Prose that restates these counts still agrees with them.** Crosswalk 0.2.0
   defined the two scopes and `eventPlaybackResume` stopped being lossy, taking
   the count from six to five. The gate printed five the same day; three
   sentences went on saying six, in the ADR, in the generator's docstring and by
   implication in the flake. `truth-audit.mjs` exists for exactly this class of
   drift and reaches versions, DOIs and links — not a number only this script
   derives. A docstring cannot be generated, so the next best thing is to fail
   when a restatement stops matching.

Validation is by `hedtools`, the HED Working Group's reference implementation,
which ADR 0025 decision 7 requires. It replaced a regex that only checked whether
each tag name appeared in the schema XML, and the replacement immediately earned
itself: every scope mapping in version 0.1.0 of the map was **invalid HED**.
`Onset`, `Offset`, `Pause` and `Inset` are temporal-scope tags that HED requires
to be paired with exactly one `Def/` tag, and the map wrote them bare, as
`(Experiment-structure, Time-block, Onset)`. Every tag in that string exists, so
tag-existence checking passed it; it would never have validated anywhere.

The validation is **offline**. `hedtools` ships the standard schemas inside the
package, so `load_schema_version("8.4.0")` reads `schema_data/HED8.4.0.xml` from
the installed tree rather than fetching it. Verified by running the validator
with `socket` disabled. This matters more than it looks: a gate that silently
depends on a third-party host is a gate that fails when that host does, and this
repository has spent enough time on registries that were down. The HED schema
version is pinned in the crosswalk and the flake pins `hedtools`, so the whole
check is reproducible from the lockfile.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from rdflib import Graph, URIRef
from rdflib.namespace import SKOS

ROOT = Path(__file__).resolve().parents[1]
MAP_PATH = ROOT / "static" / "schemas" / "sstim-hed-event-map.json"
SCHEME = URIRef("https://w3id.org/sstim/vocab#SessionEventTypeScheme")

# Representative values for validating a detailTemplate. A template is not a HED
# string until it is filled, so validating the template text would check nothing;
# these stand in for a real event's values.
SAMPLE = {"parameterKind": "Level", "valueAfter": "0.15", "valueBefore": "0.30"}


def fill_template(entry: dict, values: dict) -> str:
    """Append a filled detailTemplate to the base HED string.

    The base `hed` stays the part determined by the event type alone, so a
    reverse lookup can recover it by stripping detail tags. The template adds
    what HED can express and the type alone cannot.
    """
    detail = entry["detailTemplate"].format(**values)
    return f"{entry['hed'][:-1]}, {detail})"


NUMBER_WORDS = {
    1: "one", 2: "two", 3: "three", 4: "four", 5: "five",
    6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten",
    11: "eleven", 12: "twelve", 13: "thirteen", 14: "fourteen", 15: "fifteen",
    16: "sixteen", 17: "seventeen", 18: "eighteen", 19: "nineteen", 20: "twenty",
}

# Prose that restates a count this script derives, and the count it must equal.
# `key` names the derived counts, `+`-joined, one per capture group in the
# pattern — so a sentence quoting both the lossy count and the total is checked
# on both. Add a row when new prose starts quoting these numbers, and prefer not
# writing the number at all: the only prose that cannot go stale is prose that
# does not restate a fact.
PROSE_CLAIMS = (
    (
        "docs/decisions/0025-hed-bids-interoperability-crosswalk.md",
        r"`lossyBecause` on the (\w+) mappings that lose",
        "lossy",
    ),
    (
        "docs/decisions/0025-hed-bids-interoperability-crosswalk.md",
        r"maps all (\w+) `sstim-v:SessionEventTypeScheme` types",
        "events",
    ),
    (
        "scripts/generate-hed-bundle.py",
        r"\*\*Loss is a first-class output\.\*\* (\w+) of the (\w+) event mappings",
        "lossy+events",
    ),
)


def check_prose(counts: dict) -> list[str]:
    """Fail when prose restating a derived count stops matching it."""
    problems: list[str] = []
    for relative, pattern, key in PROSE_CLAIMS:
        path = ROOT / relative
        if not path.exists():
            problems.append(f"{relative}: named by PROSE_CLAIMS but does not exist")
            continue
        match = re.search(pattern, path.read_text(encoding="utf-8"))
        if match is None:
            # A pattern that matches nothing is a blind check, not a passing one.
            problems.append(
                f"{relative}: no sentence matches /{pattern}/ — the prose was "
                f"reworded, so this check stopped looking at anything. Update the "
                f"pattern or drop the row."
            )
            continue
        keys = key.split("+")
        if len(keys) != len(match.groups()):
            problems.append(
                f"{relative}: /{pattern}/ has {len(match.groups())} capture "
                f"group(s) but key '{key}' names {len(keys)} count(s)"
            )
            continue
        # Past ten there is no word, so fall back to the digits rather than
        # raising — a gate that crashes on the eleventh event type is a gate
        # that has to be repaired before anyone can see what it was reporting.
        expected = [NUMBER_WORDS.get(counts[k], str(counts[k])) for k in keys]
        found = [g.lower() for g in match.groups()]
        if found != expected:
            problems.append(
                f"{relative}: prose says {' / '.join(found)} where the crosswalk "
                f"derives {' / '.join(expected)} — {match.group(0).strip()}"
            )
    return problems


def validate_strings(spec: dict) -> tuple[list[str], int]:
    """Validate every mapped HED string against the pinned schema, with the
    definitions in scope. Returns (failures, distinct tag count)."""
    from hed import load_schema_version
    from hed.models import HedString, DefinitionDict
    from hed.errors import get_printable_issue_string

    version = spec["hedSchema"]["version"]
    schema = load_schema_version(version)
    if schema.version != version:
        raise SystemExit(
            f"hed-crosswalk: hedtools loaded {schema.version}, map pins {version}"
        )

    defs = [v for k, v in spec.get("definitions", {}).items() if not k.startswith("$")]
    definitions = DefinitionDict(defs, schema)
    failures: list[str] = []
    for issue in definitions.issues:
        failures.append(f"definition: {issue}")

    # Count schema tags, not words. A regex over the mapping strings counted
    # `Def` and the definition *names* (`Sstim-session`, `Sstim-delivery`) as
    # tags, and never saw the tags inside the definitions at all — so the
    # headline number was wrong in both directions. `short_base_tag` is the
    # schema term hedtools resolved, with any `Def/<name>` extension stripped,
    # which is the thing worth counting.
    tags: set[str] = set()
    for event, entry in sorted(spec["events"].items()):
        # Both the base string and, where one exists, the string a filled
        # detailTemplate produces. Validating only the base would leave the
        # emitted annotation unchecked, which is the shape of the 0.1.0 defect:
        # every part inspected, the actual output never.
        variants = [("", entry["hed"])]
        if "detailTemplate" in entry:
            variants.append((" + detail", fill_template(entry, SAMPLE)))
        for suffix, string in variants:
            hed_string = HedString(string, schema, def_dict=definitions)
            issues = hed_string.validate(schema)
            if issues:
                detail = get_printable_issue_string(issues).strip().splitlines()
                failures.append(f"{event}{suffix}: {string} — {detail[-1].strip()}")
            tags.update(tag.short_base_tag for tag in hed_string.get_all_tags())

    # The definitions are validated above by DefinitionDict, which is the only
    # correct way: a `Definition/` tag is illegal in event position, so running
    # them through the event validator reports DEFINITION_INVALID on a perfectly
    # good definition. They are parsed here for their tags alone.
    for string in defs:
        tags.update(tag.short_base_tag for tag in HedString(string, schema).get_all_tags())
    return failures, len(tags)


def main() -> int:
    spec = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    version = spec["hedSchema"]["version"]

    # 1. every mapped string is valid HED against the pinned schema
    try:
        failures, tag_count = validate_strings(spec)
    except Exception as exc:  # no network for the schema, or hedtools missing
        print(f"hed-crosswalk: INCOMPLETE — could not validate ({exc})")
        print("  This is not a pass. An unreachable validator confirms nothing.")
        return 1

    # 2. the map covers the SSTIM scheme exactly
    graph = Graph()
    manifest = json.loads((ROOT / "static" / "ontology" / "manifest.json").read_text())
    for module in manifest["modules"]:
        graph.parse(ROOT / module["source"]["path"], format="turtle")
    concepts = {
        str(c).split("#")[-1] for c in graph.subjects(SKOS.inScheme, SCHEME)
    }
    mapped = set(spec["events"])
    for missing in sorted(concepts - mapped):
        failures.append(f"{missing} is in the scheme with no HED mapping")
    for extra in sorted(mapped - concepts):
        failures.append(f"{extra} is mapped but is not in the scheme")

    # 3. collisions must declare their loss
    by_hed: dict[str, list[str]] = {}
    for event, entry in spec["events"].items():
        by_hed.setdefault(entry["hed"], []).append(event)
    for hed, events in sorted(by_hed.items()):
        if len(events) > 1:
            silent = [e for e in events if not spec["events"][e].get("lossyBecause")]
            if silent:
                failures.append(
                    f"{', '.join(sorted(silent))} emit HED identical to "
                    f"{', '.join(sorted(set(events) - set(silent)))} without declaring "
                    f"lossyBecause — a consumer reading HED alone cannot tell them apart"
                )

    # 4. prose restating these counts still agrees with them
    lossy = sum(1 for e in spec["events"].values() if "lossyBecause" in e)
    failures += check_prose({"events": len(spec["events"]), "lossy": lossy})

    if failures:
        print(f"hed-crosswalk: FAILED ({len(failures)} issue(s))")
        for failure in failures:
            print(f"  - {failure}")
        return 1

    ndefs = len([k for k in spec.get("definitions", {}) if not k.startswith("$")])
    print(
        f"hed-crosswalk: passed ({len(mapped)} event types and {ndefs} definitions "
        f"validate as HED {version} via hedtools, {tag_count} distinct tags, "
        f"{lossy} mappings declare information loss, "
        f"{len(PROSE_CLAIMS)} prose restatements agree)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
