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

This validates *tag existence and coverage*, not HED syntax. Full validation
against a HED validator is the remaining step and needs `hedtools`, which is not
in the flake; ADR 0025 decision 7 requires it before any interoperability claim.
"""

from __future__ import annotations

import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

from rdflib import Graph, URIRef
from rdflib.namespace import SKOS

ROOT = Path(__file__).resolve().parents[1]
MAP_PATH = ROOT / "static" / "schemas" / "sstim-hed-event-map.json"
CACHE = ROOT / ".hed-schema-cache"
SCHEME = URIRef("https://w3id.org/sstim/vocab#SessionEventTypeScheme")


def hed_tags(url: str, version: str) -> set[str]:
    cache = CACHE / f"HED{version}.xml"
    if not cache.exists():
        CACHE.mkdir(exist_ok=True)
        urllib.request.urlretrieve(url, cache)
    root = ET.parse(cache).getroot()
    if root.get("version") != version:
        raise SystemExit(
            f"hed-crosswalk: cached schema is {root.get('version')}, map pins {version}"
        )
    tags: set[str] = set()

    def walk(node, path=""):
        for child in node.findall("node"):
            name = child.findtext("name")
            if not name:
                continue
            full = f"{path}/{name}" if path else name
            tags.add(name)
            tags.add(full)
            walk(child, full)

    schema = root.find("schema")
    walk(root if schema is None else schema)
    return tags


def main() -> int:
    spec = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    version = spec["hedSchema"]["version"]
    try:
        tags = hed_tags(spec["hedSchema"]["url"], version)
    except Exception as exc:  # offline, or the schema moved
        print(f"hed-crosswalk: INCOMPLETE — could not read the pinned schema ({exc})")
        print("  This is not a pass. An unreachable schema cannot confirm a tag exists.")
        return 1

    failures: list[str] = []

    # 1. every tag in the map is a real tag in the pinned schema
    used: dict[str, list[str]] = {}
    for event, entry in spec["events"].items():
        found = re.findall(r"[A-Za-z][A-Za-z0-9-]*(?:/[A-Za-z][A-Za-z0-9-]*)*", entry["hed"])
        for tag in found:
            used.setdefault(tag, []).append(event)
            if tag not in tags:
                failures.append(
                    f"{event}: '{tag}' is not a tag in HED {version} — "
                    f"check https://www.hedtags.org/display_hed.html?schema={version}"
                )

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
    print(
        f"hed-crosswalk: passed ({len(mapped)} event types mapped to HED {version}, "
        f"{len(used)} distinct tags all present in the pinned schema, "
        f"{lossy} mappings declare information loss)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
