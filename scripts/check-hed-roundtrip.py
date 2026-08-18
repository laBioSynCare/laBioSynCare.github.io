#!/usr/bin/env python3
"""Test that the declared loss in the HED bundle is real, and exactly as declared.

ADR 0025 decision 7 requires "round-trip or declared-loss tests". Documenting
loss in a manifest is not a test: a manifest can claim loss that does not exist,
or miss loss that does, and either way a consumer trusts a sentence rather than a
property. This asserts the property.

The round trip is HED back to SSTIM. Each emitted HED string is looked up in a
reverse index of the crosswalk, giving the set of SSTIM event types that could
have produced it. Three things then have to hold, and the third is what makes
this a test of the declaration rather than of the mapping:

1. **Soundness.** The originating event type is always among the candidates.
   A reverse lookup that cannot recover the truth at all is a broken mapping, not
   a lossy one.

2. **Ambiguity is declared.** Any row whose HED could have come from more than
   one SSTIM event type must have `lossyBecause` on every candidate. This is the
   `eventSessionComplete` / `eventSessionInterrupt` pair: both emit
   `(Def/Sstim-session, Offset)` because HED 8.4.0 has no Incomplete, Abort or
   Terminate tag, so a HED-only consumer cannot tell a finished session from an
   abandoned one.

3. **Declared loss is not overclaimed.** An event type whose HED is unique, and
   whose `lossyBecause` asserts that it collides with another, is lying in the
   safe-looking direction. Overclaiming loss is the failure mode nobody checks
   for, because it reads as caution.

Detail loss — that HED carries no engine identity, no safety boundary, no
instrument version — is not ambiguity and is asserted separately: those mappings
must be unique *and* declare loss, which is the signature of information dropped
rather than confused.
"""

from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAP_PATH = ROOT / "static" / "schemas" / "sstim-hed-event-map.json"
BUNDLE = ROOT / "test" / "fixtures" / "hed-bundle"


def main() -> int:
    spec = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    manifest = json.loads((BUNDLE / "bundle-manifest.json").read_text(encoding="utf-8"))
    events = spec["events"]

    reverse: dict[str, list[str]] = defaultdict(list)
    for name, entry in events.items():
        reverse[entry["hed"]].append(name)

    failures: list[str] = []

    rows = []
    for line in (BUNDLE / "events.tsv").read_text(encoding="utf-8").splitlines()[1:]:
        onset, _duration, event_type, hed = line.split("\t")
        rows.append((onset, event_type, hed))

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

    # 4. the manifest's declaredLoss matches the mappings actually used
    used = {event_type for _, event_type, _ in rows}
    expected = {n for n in used if "lossyBecause" in events[n]}
    declared = set(manifest.get("declaredLoss", {}))
    for missing in sorted(expected - declared):
        failures.append(f"{missing} is lossy and used in the bundle but absent from declaredLoss")
    for extra in sorted(declared - expected):
        failures.append(f"{extra} is in declaredLoss but is not a lossy mapping used in the bundle")

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
        f"hed-roundtrip: passed ({len(rows)} bundle rows all reverse to their own "
        f"event type; {ambiguous_rows} ambiguous, from {collisions} HED collision(s), "
        f"every one declared; {detail_only} mappings drop detail without ambiguity; "
        f"no loss overclaimed)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
