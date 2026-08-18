#!/usr/bin/env python3
"""Verify the SSTIM to HED crosswalk against the pinned HED schema and SSTIM.

ADR 0025 makes HED a *generated* event-semantic profile: SSTIM event types are
the source of truth and HED annotations are produced from them by a versioned,
one-way, loss-declaring adapter. This checks the adapter's mapping table, which
is the part that silently rots — a HED tag that never existed, or that a schema
release removed, produces annotations that look fine and validate nowhere.

Three things are checked, and the first is the one that motivated the script.

1. **Every HED tag in the mapping exists in the pinned schema.** Tags are read
   out of `HED8.4.0.xml` itself rather than trusted. Writing this map by hand
   the first time produced `Pulse`, `Modulation` and `Intensity`, none of which
   are HED 8.4.0 tags; all three were caught this way before they reached an
   artifact.

2. **The mapping covers `sstim-v:SessionEventTypeScheme` exactly.** A new event
   type with no HED mapping would silently produce an incomplete profile, and a
   mapping for a retired event type is dead weight that reads as coverage.

3. **Loss is declared where the mapping is not injective.** Two SSTIM event
   types that emit identical HED must both say why, because that is precisely
   the information a consumer reading HED alone cannot recover.
   `eventSessionComplete` and `eventSessionInterrupt` are the live example: HED
   8.4.0 has no Incomplete, Abort or Terminate tag, so completion status is
   SSTIM-only and the map has to admit it.

Validation is by `hedtools`, the HED Working Group's reference implementation,
which ADR 0025 decision 7 requires. It replaced a regex that only checked whether
each tag name appeared in the schema XML, and the replacement immediately earned
itself: every scope mapping in version 0.1.0 of the map was **invalid HED**.
`Onset`, `Offset`, `Pause` and `Inset` are temporal-scope tags that HED requires
to be paired with exactly one `Def/` tag, and the map wrote them bare, as
`(Experiment-structure, Time-block, Onset)`. Every tag in that string exists, so
tag-existence checking passed it; it would never have validated anywhere.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from rdflib import Graph, URIRef
from rdflib.namespace import SKOS

ROOT = Path(__file__).resolve().parents[1]
MAP_PATH = ROOT / "static" / "schemas" / "sstim-hed-event-map.json"
SCHEME = URIRef("https://w3id.org/sstim/vocab#SessionEventTypeScheme")


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

    tags: set[str] = set()
    for event, entry in sorted(spec["events"].items()):
        hed_string = HedString(entry["hed"], schema, def_dict=definitions)
        issues = hed_string.validate(schema)
        if issues:
            detail = get_printable_issue_string(issues).strip().splitlines()
            failures.append(f"{event}: {entry['hed']} — {detail[-1].strip()}")
        tags.update(re.findall(r"[A-Za-z][A-Za-z0-9-]*", entry["hed"]))
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

    if failures:
        print(f"hed-crosswalk: FAILED ({len(failures)} issue(s))")
        for failure in failures:
            print(f"  - {failure}")
        return 1

    lossy = sum(1 for e in spec["events"].values() if "lossyBecause" in e)
    ndefs = len([k for k in spec.get("definitions", {}) if not k.startswith("$")])
    print(
        f"hed-crosswalk: passed ({len(mapped)} event types and {ndefs} definitions "
        f"validate as HED {version} via hedtools, {tag_count} distinct tags, "
        f"{lossy} mappings declare information loss)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
