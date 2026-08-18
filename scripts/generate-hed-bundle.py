#!/usr/bin/env python3
"""Generate the synthetic native+HED conformance bundle of ADR 0025 decision 5.

HED is a *generated* event-semantic profile over SSTIM's native session record,
not a second source of truth. This script is that generator, and the bundle it
writes is the demonstrator the ADR asks for: coordinated, versioned artifacts
that a reviewer can validate rather than a prose claim that a bridge exists.

It reads an SSTIM session graph, walks the event timeline on the session clock,
and emits a BIDS-style tab-separated events table with a `HED` column, beside a
manifest recording every artifact hash, every pinned version, the clock
assumption, and — the part that matters most — what the HED column cannot carry.

**Loss is a first-class output.** Six of the ten event mappings lose information,
and the manifest names each one. `eventSessionComplete` and
`eventSessionInterrupt` emit identical HED because HED 8.4.0 has no Incomplete,
Abort or Terminate tag, so a consumer reading the events table alone cannot tell
a finished session from an abandoned one. That is a real limitation of the
crosswalk, and publishing it beside the bundle is the difference between an
interoperability profile and an interoperability claim.

Run with --check to verify the committed bundle is current, which is how CI uses
it: the bundle is regenerated into a temporary directory and compared, so a
mapping edit that is not reflected in the artifacts fails rather than drifting.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from rdflib import Graph, URIRef
from rdflib.namespace import RDF

ROOT = Path(__file__).resolve().parents[1]
MAP_PATH = ROOT / "static" / "schemas" / "sstim-hed-event-map.json"
SESSION = ROOT / "test" / "fixtures" / "rdf" / "full-profile" / "positive-recorded-session.ttl"
OUT_DIR = ROOT / "test" / "fixtures" / "hed-bundle"

SSTIM = "https://w3id.org/sstim#"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def build(out: Path) -> None:
    spec = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    graph = Graph()
    graph.parse(SESSION, format="turtle")

    ev_class = URIRef(SSTIM + "SessionEvent")
    p_type = URIRef(SSTIM + "hasEventType")
    p_offset = URIRef(SSTIM + "sessionClockOffsetSeconds")

    rows = []
    for event in graph.subjects(RDF.type, ev_class):
        etype = next(graph.objects(event, p_type), None)
        offset = next(graph.objects(event, p_offset), None)
        if etype is None or offset is None:
            raise SystemExit(f"hed-bundle: {event} lacks an event type or clock offset")
        local = str(etype).split("#")[-1]
        entry = spec["events"].get(local)
        if entry is None:
            raise SystemExit(f"hed-bundle: no HED mapping for {local}")
        rows.append((float(offset), local, entry["hed"], str(event)))
    rows.sort()

    out.mkdir(parents=True, exist_ok=True)
    lines = ["onset\tduration\tevent_type\tHED"]
    # duration is n/a: SSTIM records instantaneous timeline events, and inventing
    # a duration would assert a span the native record does not contain.
    lines += [f"{o:.3f}\tn/a\t{t}\t{h}" for o, t, h, _ in rows]
    (out / "events.tsv").write_text("\n".join(lines) + "\n", encoding="utf-8")

    (out / "events.json").write_text(
        json.dumps(
            {
                "onset": {"Description": "Seconds from the session clock origin.", "Units": "s"},
                "duration": {"Description": "Always n/a — SSTIM session events are instantaneous timeline marks."},
                "event_type": {
                    "Description": "SSTIM session event type, the authoritative value.",
                    "TermURL": spec["sstimEventScheme"],
                    "Levels": {t: spec["events"][t]["label"] for _, t, _, _ in rows},
                },
                "HED": {"Description": f"Generated from event_type by the crosswalk, HED {spec['hedSchema']['version']}."},
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    used = sorted({t for _, t, _, _ in rows})
    manifest = {
        "$comment": "Bundle manifest for the ADR 0025 demonstrator. Synthetic data only.",
        "generatedBy": "scripts/generate-hed-bundle.py",
        "synthetic": True,
        "containsPersonalData": False,
        "versions": {
            "hedSchema": spec["hedSchema"]["version"],
            "mapping": spec["mappingVersion"],
            "sstimEventScheme": spec["sstimEventScheme"],
        },
        "clock": {
            "basis": "sstim:sessionClockOffsetSeconds",
            "origin": "The session clock origin declared by the session record; not wall-clock time.",
            "note": "SSTIM's authority for timing is the engine timing context, so offsets are engine-clock seconds rather than derived from a host clock.",
        },
        "source": {
            "file": str(SESSION.relative_to(ROOT)),
            "sha256": sha256(SESSION),
            "eventCount": len(rows),
        },
        "artifacts": [
            {"file": "events.tsv", "sha256": sha256(out / "events.tsv")},
            {"file": "events.json", "sha256": sha256(out / "events.json")},
        ],
        "declaredLoss": {
            t: spec["events"][t]["lossyBecause"]
            for t in used
            if "lossyBecause" in spec["events"][t]
        },
        "notValidated": [
            "HED syntax is not validated here. Tag existence against the pinned schema is checked by `make hed-crosswalk`; full validation requires hedtools, which is not in the flake.",
            "No BIDS dataset is emitted. BIDS Behavioral is an optional binding under ADR 0025 decision 3 and is not part of the minimum semantic authority chain.",
            "Round-trip from HED back to SSTIM is not attempted and is not possible for the lossy mappings above, by construction.",
        ],
    }
    (out / "bundle-manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    if not args.check:
        build(OUT_DIR)
        n = len((OUT_DIR / "events.tsv").read_text().splitlines()) - 1
        print(f"hed-bundle: wrote {OUT_DIR.relative_to(ROOT)} ({n} events)")
        return 0

    import shutil, tempfile

    tmp = Path(tempfile.mkdtemp())
    try:
        build(tmp)
        stale = [
            f.name
            for f in sorted(tmp.iterdir())
            if not (OUT_DIR / f.name).exists()
            or (OUT_DIR / f.name).read_bytes() != f.read_bytes()
        ]
        if stale:
            print(f"hed-bundle: STALE ({', '.join(stale)}) — run `make hed-bundle`")
            return 1
        n = len((OUT_DIR / "events.tsv").read_text().splitlines()) - 1
        loss = json.loads((OUT_DIR / "bundle-manifest.json").read_text())["declaredLoss"]
        print(
            f"hed-bundle: current ({n} events, {len(loss)} of them emitting HED that "
            f"declares information loss)"
        )
        return 0
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    raise SystemExit(main())
