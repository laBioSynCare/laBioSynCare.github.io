#!/usr/bin/env python3
"""Test that the declared loss in the HED bundles is real, and exactly as declared.

ADR 0025 decision 7 requires "round-trip or declared-loss tests". Documenting
loss in a manifest is not a test: a manifest can claim loss that does not exist,
or miss loss that does, and either way a consumer trusts a sentence rather than a
property. This asserts the property.

The round trip is HED back to SSTIM. Each HED string is first assembled from the
categorical `event_id` and native parameter columns through the sidecar, then has
its detail tags stripped — `Parameter-label` and `Parameter-value` carry an
event's values, not its identity. The remainder is looked up in a reverse index
of the crosswalk, giving the set of SSTIM event types that could have produced
it. Four things then have to hold, and the third is what makes this a test of the
declaration rather than of the mapping:

1. **Soundness.** The originating event type is always among the candidates.
   A reverse lookup that cannot recover the truth at all is a broken mapping, not
   a lossy one.

2. **Ambiguity is declared.** Any row whose HED could have come from more than
   one SSTIM event type must have `lossyBecause` on every candidate. This is the
   session completion pair, the pause/stop pair, and the resume/start pair:
   all emit identical HED within their pair, so a HED-only consumer cannot
   recover the native distinction.

3. **Declared loss is not overclaimed.** An event type whose HED is unique, and
   whose `lossyBecause` asserts that it collides with another, is lying in the
   safe-looking direction. Overclaiming loss is the failure mode nobody checks
   for, because it reads as caution.

4. **Each bundle's manifest declares the loss its own rows incur** — checked per
   bundle rather than against the pooled set, so a bundle cannot inherit a
   declaration it never earned.

Detail loss — such as protective intent, observation structure, or a parameter's
previous value and unit — is not ambiguity and is asserted separately: those
mappings must be unique *and* declare loss, which is the signature of information
dropped rather than confused.

Every bundle listed in `BUNDLES` is reversed: fixed, segmented, and continuously
modulated. A bundle that nobody round-tripped would be precisely the unexercised
artifact this gate exists to prevent.
"""

from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

# Detail tags carry per-event values, not event identity, so they are removed
# before the reverse lookup. Crosswalk 0.3.0 introduced them precisely so that
# HED could carry a parameter and its value; leaving them in would make every
# parameterised row look like an unmapped string, which is how this gate first
# reported them.
DETAIL_TAG = re.compile(r",\s*Parameter-(?:label|value)/[^,)]+")

ROOT = Path(__file__).resolve().parents[1]
MAP_PATH = ROOT / "static" / "schemas" / "sstim-hed-event-map.json"
# Every bundle is round-tripped, not just the first. A second bundle that nobody
# reversed would be exactly the untested artifact this gate exists to prevent.
BUNDLES = (
    ROOT / "test" / "fixtures" / "hed-bundle",
    ROOT / "test" / "fixtures" / "hed-bundle-segmented",
    ROOT / "test" / "fixtures" / "hed-bundle-modulated",
)


def read_rows(bundle: Path, spec: dict) -> list[tuple[str, str, str]]:
    """(onset, event_type, assembled HED) from one generated bundle.

    event_id carries the event type's SKOS notation; sstim_event_id is the
    occurrence join. HED is assembled from the sidecar rather than materialised
    in the TSV, which is the shape reviewed with Kay Robbins.
    """
    from hed.models import Sidecar, TabularInput

    lines = (bundle / "events.tsv").read_text(encoding="utf-8").splitlines()
    header = lines[0].split("\t")
    index = {name: position for position, name in enumerate(header)}
    for required in ("onset", "event_id", "sstim_event_id"):
        if required not in index:
            raise SystemExit(f"hed-roundtrip: {bundle.name}/events.tsv has no {required} column")

    notation_to_type = {
        entry["notation"]: name for name, entry in spec["events"].items()
    }
    sidecar = Sidecar([str(bundle / "events.json")])
    table = TabularInput(str(bundle / "events.tsv"), sidecar=sidecar)
    assembled = table.assemble()
    if "event_id" not in assembled.columns or len(assembled) != len(lines) - 1:
        raise SystemExit(
            f"hed-roundtrip: {bundle.name} sidecar did not assemble one event_id "
            "annotation per row"
        )

    rows = []
    for row_index, line in enumerate(lines[1:]):
        cells = line.split("\t")
        level = cells[index["event_id"]]
        event_type = notation_to_type.get(level)
        if event_type is None:
            raise SystemExit(
                f"hed-roundtrip: {bundle.name} event_id {level!r} is not a mapped notation"
            )
        rows.append(
            (
                cells[index["onset"]],
                event_type,
                DETAIL_TAG.sub("", str(assembled.iloc[row_index]["event_id"])),
            )
        )
    return rows


def main() -> int:
    spec = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    events = spec["events"]

    reverse: dict[str, list[str]] = defaultdict(list)
    for name, entry in events.items():
        reverse[entry["hed"]].append(name)

    failures: list[str] = []

    rows = []
    manifests = []
    for bundle in BUNDLES:
        manifests.append(
            (bundle, json.loads((bundle / "bundle-manifest.json").read_text(encoding="utf-8")))
        )
        rows += read_rows(bundle, spec)

    # 1. soundness — the truth is always among the candidates
    ambiguous_rows = 0
    for onset, event_type, hed in rows:
        candidates = reverse.get(hed, [])
        if event_type not in candidates:
            failures.append(
                f"t={onset} {event_type}: its own HED does not reverse to it "
                f"(candidates: {candidates or 'none'}) — the mapping is broken, not lossy"
            )
            continue
        if len(candidates) > 1:
            ambiguous_rows += 1
            silent = [c for c in candidates if "lossyBecause" not in events[c]]
            if silent:
                failures.append(
                    f"t={onset} {event_type}: HED reverses ambiguously to "
                    f"{sorted(candidates)} and {sorted(silent)} do not declare it"
                )

    # 2. every ambiguous mapping in the crosswalk declares loss, bundle or not
    for hed, names in sorted(reverse.items()):
        if len(names) > 1:
            for name in names:
                if "lossyBecause" not in events[name]:
                    failures.append(
                        f"{name}: shares HED with {sorted(set(names) - {name})} "
                        f"without lossyBecause"
                    )

    # 3. no overclaiming — a unique mapping must not claim collision
    collision_words = ("identical", "shares", "same hed", "cannot tell")
    for name, entry in sorted(events.items()):
        reason = entry.get("lossyBecause", "")
        unique = len(reverse[entry["hed"]]) == 1
        if unique and any(w in reason.lower() for w in collision_words):
            failures.append(
                f"{name}: lossyBecause claims a collision but its HED is unique — "
                f"overclaimed loss reads as caution and is still wrong"
            )

    # 4. each manifest's declaredLoss matches the mappings that bundle uses.
    # Checked per bundle, not against the union: declaredLoss is a statement
    # about one set of artifacts, and pooling them would let a bundle inherit a
    # declaration it never earned.
    for bundle, manifest in manifests:
        used = {event_type for _, event_type, _ in read_rows(bundle, spec)}
        expected = {n for n in used if "lossyBecause" in events[n]}
        declared = set(manifest.get("declaredLoss", {}))
        for missing in sorted(expected - declared):
            failures.append(
                f"{bundle.name}: {missing} is lossy and used but absent from declaredLoss"
            )
        for extra in sorted(declared - expected):
            failures.append(
                f"{bundle.name}: {extra} is in declaredLoss but is not a lossy mapping it uses"
            )

    if failures:
        print(f"hed-roundtrip: FAILED ({len(failures)} issue(s))")
        for failure in failures:
            print(f"  - {failure}")
        return 1

    detail_only = sum(
        1 for n, e in events.items()
        if "lossyBecause" in e and len(reverse[e["hed"]]) == 1
    )
    collisions = sum(1 for names in reverse.values() if len(names) > 1)
    print(
        f"hed-roundtrip: passed ({len(rows)} rows across {len(BUNDLES)} bundles all "
        f"reverse to their own "
        f"event type; {ambiguous_rows} ambiguous, from {collisions} HED collision(s), "
        f"every one declared; {detail_only} mappings drop detail without ambiguity; "
        f"no loss overclaimed)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
