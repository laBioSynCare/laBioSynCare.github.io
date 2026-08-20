#!/usr/bin/env python3
"""Generate the synthetic native+HED conformance bundles of ADR 0025 decision 5.

HED is a *generated* event-semantic profile over SSTIM's native session record,
not a second source of truth. This script is that generator, and the bundles it
writes are the demonstrator the ADR asks for: coordinated, versioned artifacts a
reviewer can validate rather than a prose claim that a bridge exists.

It reads an SSTIM session graph, walks the event timeline on the session clock,
and emits a BIDS-style tab-separated events table with a `HED` column, beside a
manifest recording every artifact hash, every pinned version, the clock
assumption, the cross-artifact identifiers, and — the part that matters most —
what the HED column cannot carry.

**Loss is a first-class output.** Five of the eleven event mappings lose
information, and each manifest names every one that its own events actually use;
`declaredLoss` is keyed on the rows emitted, not on the whole crosswalk, so it
stays a statement about those artifacts. `eventSessionComplete` and
`eventSessionInterrupt` emit identical HED because HED 8.4.0 has no Incomplete,
Abort or Terminate tag, so a consumer reading the events table alone cannot tell
a finished session from an abandoned one. That is a real limitation of the
crosswalk, and publishing it beside the bundle is the difference between an
interoperability profile and an interoperability claim.

**Two bundles, because one of them cannot test the harder half of decision 5.**

    fixed       a constant stimulus. Events are the whole story.
    modulated   a Martigli voice whose breathing period glides from mp0 to mp1.

Decision 5 says a time-varying stimulus "requires either piecewise events or a
linked trace; it must not be flattened into a misleading single row". SSTIM has
no event type for a parameter change — `sstim-v:SessionEventTypeScheme` holds ten
lifecycle, safety and observation types and none of them is one — so piecewise
events are not available without minting terms, and the linked trace is the
representation this generator produces. `emit_trace` below is therefore not a
feature of the modulated bundle; it is the condition on which that bundle is
allowed to exist at all, enforced in `build`.

**The trace runs on delivered time, not session time.** The breathing arc
advances only while audio is playing, so a pause displaces every later sample on
the session clock. Samples inside a pause are `n/a` rather than interpolated:
the stimulus was not being delivered, and writing a value there would assert an
exposure that did not happen. `--check` verifies that those `n/a` spans line up
with the pause/resume rows in `events.tsv`, which is the cross-artifact
consistency decision 7 asks for.

Run with --check to verify the committed bundles are current *and* correct,
which is how CI uses it: each bundle is regenerated into a temporary directory
and compared, the emitted HED is revalidated, identifiers are resolved against
the source graph, and the traces are checked against the events. Pass
--no-shacl to skip the SSTIM SHACL pass when iterating locally.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from pathlib import Path

from rdflib import Graph, URIRef
from rdflib.namespace import RDF

ROOT = Path(__file__).resolve().parents[1]
MAP_PATH = ROOT / "static" / "schemas" / "sstim-hed-event-map.json"
MANIFEST_PATH = ROOT / "static" / "ontology" / "manifest.json"
PACKAGE_PATH = ROOT / "package.json"

SSTIM = "https://w3id.org/sstim#"
S = lambda name: URIRef(SSTIM + name)  # noqa: E731

TRACE_HZ = 1.0

# The bundles, and what each is for. Keeping the fixed one at the original path
# means every link written to it still resolves.
BUNDLES = (
    {
        "id": "fixed",
        "source": "test/fixtures/rdf/full-profile/positive-recorded-session.ttl",
        "out": "test/fixtures/hed-bundle",
        "purpose": "A constant stimulus, where the event timeline is the whole story.",
    },
    {
        "id": "segmented",
        "source": "test/fixtures/rdf/hed-bundle/segmented-session.ttl",
        "out": "test/fixtures/hed-bundle-segmented",
        "purpose": (
            "An explicitly segmented stimulus, carried as the piecewise events ADR 0025 "
            "decision 5 names first. Each boundary is an event with its parameter and value."
        ),
    },
    {
        "id": "modulated",
        "source": "test/fixtures/rdf/hed-bundle/modulated-session.ttl",
        "out": "test/fixtures/hed-bundle-modulated",
        "purpose": (
            "A time-varying stimulus, which ADR 0025 decision 5 forbids flattening "
            "into a single row. Carries a linked trace."
        ),
    },
)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def local(term) -> str:
    text = str(term)
    return text.rsplit("#", 1)[-1] if "#" in text else text.rsplit("/", 1)[-1]


def fill_detail(spec: dict, entry: dict, row: dict) -> str:
    """Append the filled detailTemplate to an event's base HED string.

    The parameter kind's HED label comes from the mapping contract's
    `parameterKinds`, not from a table in here. It was a dict in this file until
    crosswalk 0.4.0, which put it in the wrong place twice: it is part of the
    SSTIM-to-HED contract rather than of one generator, and nothing checked it
    still covered `sstim-v:StimulationParameterKindScheme`. `make hed-crosswalk`
    now checks exactly that, the same way it has always checked the event map.
    """
    label = spec.get("parameterKinds", {}).get(row["kind"])
    if label is None:
        raise SystemExit(
            f"hed-bundle: no HED Parameter-label for {row['kind']} — add it to "
            f"parameterKinds in the crosswalk (make hed-crosswalk enforces coverage)"
        )
    detail = entry["detailTemplate"].format(
        parameterKind=label, valueAfter=row["after"], valueBefore=row["before"]
    )
    return f"{entry['hed'][:-1]}, {detail})"


# ── reading the session ──────────────────────────────────────────────────────


def read_events(graph: Graph, spec: dict) -> list[dict]:
    """Every sstim:SessionEvent, ordered by its offset on the session clock."""
    rows = []
    for event in graph.subjects(RDF.type, S("SessionEvent")):
        etype = next(graph.objects(event, S("hasEventType")), None)
        offset = next(graph.objects(event, S("sessionClockOffsetSeconds")), None)
        if etype is None or offset is None:
            raise SystemExit(f"hed-bundle: {event} lacks an event type or clock offset")
        name = local(etype)
        entry = spec["events"].get(name)
        if entry is None:
            raise SystemExit(f"hed-bundle: no HED mapping for {name}")
        kind = next(graph.objects(event, S("hasChangedParameter")), None)
        before = next(graph.objects(event, S("parameterValueBefore")), None)
        after = next(graph.objects(event, S("parameterValueAfter")), None)
        row = {
            "onset": float(offset),
            "event_id": local(event),
            "iri": str(event),
            "type": name,
            "kind": local(kind) if kind is not None else None,
            "before": f"{float(before):g}" if before is not None else None,
            "after": f"{float(after):g}" if after is not None else None,
        }
        # HED carries the values when the event has them. The base string stays
        # the part the event type alone determines, so a reverse lookup still
        # recovers the type after the detail tags are stripped.
        if "detailTemplate" in entry and row["kind"] and row["after"] is not None:
            row["hed"] = fill_detail(spec, entry, row)
        else:
            row["hed"] = entry["hed"]
        rows.append(row)
    rows.sort(key=lambda r: (r["onset"], r["event_id"]))
    return rows


def read_sweep(graph: Graph) -> dict | None:
    """The one declarative modulation in SSTIM that a single row cannot express.

    A steady periodic modulation — a flicker rate, a beat frequency — is fully
    described by its rate, so one row carrying that rate is honest. A *parameter
    that itself changes across the session* is not: a Martigli breathing period
    gliding from mp0 to mp1 over md seconds has no single value to put in a
    column. That distinction, not "is anything oscillating", is what decision 5
    is about, so only the sweep is detected here.

    Returns None when the configuration is fixed.
    """
    for track in graph.subjects(S("martigliPeriodInitial"), None):
        mp0 = next(graph.objects(track, S("martigliPeriodInitial")), None)
        mp1 = next(graph.objects(track, S("martigliPeriodFinal")), None)
        md = next(graph.objects(track, S("martigliTransitionDuration")), None)
        if mp0 is None or mp1 is None or md is None:
            continue
        if float(mp0) == float(mp1):
            continue  # declared, but not actually sweeping
        return {
            "track": local(track),
            "mp0": float(mp0),
            "mp1": float(mp1),
            "md": float(md),
        }
    return None


def delivery_spans(events: list[dict]) -> list[tuple[float, float]]:
    """The [start, end) spans during which audio was actually being delivered."""
    opens = {"eventPlaybackStart", "eventPlaybackResume"}
    closes = {
        "eventPlaybackStop",
        "eventPlaybackPause",
        "eventSessionInterrupt",
        "eventSessionComplete",
    }
    spans, open_at = [], None
    for row in events:
        if row["type"] in opens and open_at is None:
            open_at = row["onset"]
        elif row["type"] in closes and open_at is not None:
            spans.append((open_at, row["onset"]))
            open_at = None
    if open_at is not None:
        spans.append((open_at, events[-1]["onset"]))
    return spans


def build_trace(sweep: dict, events: list[dict]) -> list[tuple[float, str, str]]:
    """Sample the breathing arc on the session clock.

    P(d) = mp0 + (mp1 - mp0) * min(d / md, 1), where d is *delivered* time —
    BREATHING_MODEL.md. Delivered time is what the engine advances, so it stops
    during a pause and the remainder of the arc slides later on the session
    clock. Samples outside a delivery span are n/a: nothing was being delivered,
    and a number there would assert an exposure that did not occur.
    """
    spans = delivery_spans(events)
    end = events[-1]["onset"]
    step = 1.0 / TRACE_HZ
    out = []
    t = 0.0
    while t <= end + 1e-9:
        delivered = sum(max(0.0, min(t, b) - a) for a, b in spans)
        inside = any(a <= t < b for a, b in spans)
        if inside:
            period = sweep["mp0"] + (sweep["mp1"] - sweep["mp0"]) * min(
                delivered / sweep["md"], 1.0
            )
            out.append((t, f"{period:.4f}", f"{1.0 / period:.6f}"))
        else:
            out.append((t, "n/a", "n/a"))
        t = round(t + step, 6)
    return out


# ── writing the bundle ───────────────────────────────────────────────────────


def write_events(out: Path, rows: list[dict], spec: dict) -> bool:
    """Write events.tsv and its sidecar. Returns whether parameter columns were
    emitted — they appear only when some event in this bundle changes one, so a
    fixed-stimulus table is not padded with three columns of n/a."""
    parametric = any(r["kind"] for r in rows)
    columns = ["onset", "duration", "event_id", "event_type"]
    if parametric:
        columns += ["parameter_kind", "value_before", "value_after"]
    columns.append("HED")

    lines = ["\t".join(columns)]
    # duration is n/a: SSTIM records instantaneous timeline events, and inventing
    # a duration would assert a span the native record does not contain.
    for r in rows:
        cells = [f"{r['onset']:.3f}", "n/a", r["event_id"], r["type"]]
        if parametric:
            cells += [r["kind"] or "n/a", r["before"] or "n/a", r["after"] or "n/a"]
        cells.append(r["hed"])
        lines.append("\t".join(cells))
    (out / "events.tsv").write_text("\n".join(lines) + "\n", encoding="utf-8")

    sidecar = {
        "onset": {"Description": "Seconds from the session clock origin.", "Units": "s"},
        # NOT a "duration" entry. onset and duration are BIDS-required columns
        # with defined types, and describing duration in the sidecar is a
        # redefinition: bids-validator 3.0.1 raises TSV_COLUMN_TYPE_REDEFINED
        # ("Format \"string\" must be number") and ignores it. Measured
        # 2026-08-20: dropping this entry clears the warning and changes nothing
        # else. The convention it documented now lives in SstimDurationConvention
        # below, which is not a column and so is not a redefinition.
        "event_id": {
            "Description": (
                "Local name of the sstim:SessionEvent this row was generated from. "
                "Joins the row to the source graph and to the manifest's "
                "crossArtifactIds; ADR 0025 decision 6."
            )
        },
        "event_type": {
            "Description": "SSTIM session event type, the authoritative value.",
            "TermURL": spec["sstimEventScheme"],
            "Levels": {r["type"]: spec["events"][r["type"]]["label"] for r in rows},
        },
        # NOT a key named "HED". In a BIDS sidecar, `HED` inside an entry is
        # reserved for that column's HED annotations, so a `"HED": {...}` entry
        # holding prose and a Definitions array is read as HED and is not.
        # bids-validator 1.15.0 crashes on it in BidsSidecar._filterHedStrings and
        # reports "INTERNAL ERROR. SOME VALIDATION STEPS MAY NOT HAVE OCCURRED" —
        # which is not a failed validation, it is no validation at all. Measured
        # 2026-08-18: with this entry shaped as it was, that error; with the
        # definitions moved below, the dataset validates with zero errors.
        #
        # Re-measured 2026-08-20 on bids-validator 3.0.1, which answers the
        # question and does not change the layout. The crash is gone: a top-level
        # "HED" key now reports SIDECAR_INVALID, "The string 'HED' or 'n/a' was
        # illegally used as a top-level sidecar key" — so this entry is not
        # merely awkward, it is illegal, and CUSTOM_COLUMN_WITHOUT_DESCRIPTION no
        # longer exists in 3.x. But 3.0.1 only reports it when another entry also
        # carries an HED sub-key; a lone top-level "HED" key is silently ignored
        # and the events column then goes unvalidated, which a deliberately bogus
        # tag confirmed. Reported as hed-standard/hed-javascript#836.
        #
        # Note the distribution split before pinning a version anywhere: npm's
        # `bids-validator` is still latest 1.15.0 with no 2.x/3.x published; 3.0.1
        # ships only via Deno/JSR (deno run -A jsr:@bids/validator@3.0.1).
        #
        # A column literally named HED in events.tsv needs no sidecar entry; BIDS
        # assembles it directly. So the column is described here for a human and
        # the definitions live in their own non-column entry, which is where
        # BIDS-HED expects definitions to be declared.
        "sstim_hed_definitions": {
            "Description": (
                "HED definitions the HED column references. Not a column of events.tsv. "
                "Onset, Offset, Pause and Inset are scope tags requiring exactly one "
                "paired Def/, so the events do not validate without these in scope."
            ),
            "HED": {
                name: value
                for name, value in spec.get("definitions", {}).items()
                if not name.startswith("$")
            },
        },
        "SstimDurationConvention": {
            "Description": (
                "duration is always n/a in this bundle. SSTIM session events are "
                "instantaneous timeline marks, and inventing a duration would assert a "
                "span the native record does not contain. This is a note, not a "
                "redefinition of the BIDS-required duration column."
            )
        },
        "GeneratedHedColumn": {
            "Description": (
                f"The events.tsv column named HED is generated from the native columns by "
                f"the crosswalk, HED {spec['hedSchema']['version']}. Where an event changes "
                f"a parameter, its Parameter-label and Parameter-value tags come from "
                f"parameter_kind and value_after. SSTIM is canonical and HED is derived, so "
                f"the native columns are the ones to read."
            )
        },
    }
    if parametric:
        sidecar["parameter_kind"] = {
            "Description": (
                "Local name of the sstim:StimulationParameterKind this event changed, or "
                "n/a. Modality-neutral by design: the kind names the quantity, not one "
                "application's field."
            ),
            "TermURL": "https://w3id.org/sstim/vocab#StimulationParameterKindScheme",
            "Levels": {
                r["kind"]: r["kind"] for r in rows if r["kind"]
            },
        }
        sidecar["value_before"] = {
            "Description": (
                "The value the parameter held immediately before the event, or n/a. On a "
                "safety-limit event this is the value that was requested."
            )
        }
        sidecar["value_after"] = {
            "Description": (
                "The value the parameter held immediately after the event, or n/a. On a "
                "safety-limit event this is the value actually delivered. The unit follows "
                "from the parameter kind and is deliberately not repeated per row."
            )
        }
    (out / "events.json").write_text(
        json.dumps(sidecar, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    return parametric


def write_trace(out: Path, trace: list[tuple[float, str, str]], sweep: dict) -> None:
    # BIDS continuous recordings carry no header row; the columns are named in
    # the sidecar. Followed here because the point of the exercise is to be
    # BIDS-shaped, and noted in the manifest because it makes the file less
    # readable on its own than events.tsv is.
    (out / "stimulus.tsv").write_text(
        "\n".join(f"{p}\t{r}" for _, p, r in trace) + "\n", encoding="utf-8"
    )
    (out / "stimulus.json").write_text(
        json.dumps(
            {
                "SamplingFrequency": TRACE_HZ,
                "StartTime": 0.0,
                "Columns": ["breathing_period_s", "breathing_rate_hz"],
                "breathing_period_s": {
                    "Description": (
                        "Instantaneous breathing-cycle period of the Martigli control "
                        f"track '{sweep['track']}', from "
                        "P(d) = mp0 + (mp1 - mp0) * min(d / md, 1) with "
                        f"mp0={sweep['mp0']}, mp1={sweep['mp1']}, md={sweep['md']}. "
                        "d is delivered time, not session time."
                    ),
                    "Units": "s",
                },
                "breathing_rate_hz": {
                    "Description": "1 / breathing_period_s, for consumers that prefer a rate.",
                    "Units": "Hz",
                },
                "$comment": (
                    "This is the linked trace ADR 0025 decision 5 requires for a "
                    "time-varying stimulus. n/a marks samples outside a delivery "
                    "span — the session was paused and nothing was being delivered, "
                    "so no value is asserted. Those spans correspond exactly to the "
                    "playback-pause and playback-resume rows in events.tsv."
                ),
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )


def build(bundle: dict, out: Path) -> dict:
    spec = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    source = ROOT / bundle["source"]
    graph = Graph()
    graph.parse(source, format="turtle")

    events = read_events(graph, spec)
    if not events:
        raise SystemExit(f"hed-bundle[{bundle['id']}]: {bundle['source']} has no events")
    sweep = read_sweep(graph)

    out.mkdir(parents=True, exist_ok=True)
    parametric = write_events(out, events, spec)

    artifacts = ["events.tsv", "events.json"]
    # Three shapes, and the manifest says which one this is rather than leaving a
    # reader to infer it from whether a trace happens to be present. ADR 0025
    # decision 5 treats them differently, so conflating them in the record would
    # make the bundle unable to state which clause it is demonstrating.
    steps = [r for r in events if r["type"] == "eventParameterChanged"]
    if steps:
        modulation = {
            "timeVarying": False,
            "shape": "segmented",
            "representation": "piecewise events",
            "stepCount": len(steps),
            "note": (
                "An explicitly segmented stimulus. Each boundary is a "
                "sstim-v:eventParameterChanged event carrying its parameter kind and the "
                "value it took, so the segmentation is recoverable from the events table "
                "alone. This is the first of the two representations ADR 0025 decision 5 "
                "allows; it became expressible on 2026-08-18, when a sstim:SessionEvent "
                "could still carry only its type and its clock offset."
            ),
        }
    else:
        modulation = {
            "timeVarying": False,
            "shape": "fixed",
            "representation": "events alone",
            "note": "Fixed stimulus; the events are complete.",
        }

    if sweep is not None:
        # The guard, not a feature. ADR 0025 decision 5 forbids flattening a
        # time-varying stimulus into a misleading single row, and this is the
        # only place that can tell the difference between complying and not.
        trace = build_trace(sweep, events)
        if len({p for _, p, _ in trace if p != "n/a"}) < 2:
            raise SystemExit(
                f"hed-bundle[{bundle['id']}]: the source declares a sweep "
                f"({sweep['mp0']}s -> {sweep['mp1']}s over {sweep['md']}s) but the "
                f"trace is constant. Emitting it would flatten a time-varying "
                f"stimulus, which ADR 0025 decision 5 forbids."
            )
        write_trace(out, trace, sweep)
        artifacts += ["stimulus.tsv", "stimulus.json"]
        modulation = {
            "timeVarying": True,
            "shape": "continuous",
            "parameter": "breathing-cycle period (Martigli)",
            "law": "P(d) = mp0 + (mp1 - mp0) * min(d / md, 1)",
            "mp0": sweep["mp0"],
            "mp1": sweep["mp1"],
            "md": sweep["md"],
            "track": sweep["track"],
            "representation": "linked trace",
            "why": (
                "ADR 0025 decision 5 allows piecewise events or a linked trace. The "
                "trace is used because sstim-v:SessionEventTypeScheme has no "
                "parameter-change event type to attach breakpoints to, and minting "
                "one is an ontology decision under ADR 0004. The constraint is "
                "SSTIM's, not HED's: a placeholder definition such as "
                "(Definition/Sstim-breath-period/#, (Time-interval/# s)) used as "
                "(Def/Sstim-breath-period/7.774, Inset) validates against 8.4.0."
            ),
            "timeBase": (
                "delivered time — the arc advances only inside a delivery span, so "
                "the pause displaces every later sample on the session clock"
            ),
        }

    suite = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))["suite"]["version"]
    app = json.loads(PACKAGE_PATH.read_text(encoding="utf-8"))["version"]

    manifest = {
        "$comment": (
            f"Bundle manifest for the ADR 0025 demonstrator ({bundle['id']}). "
            f"{bundle['purpose']} Synthetic data only."
        ),
        "bundleId": bundle["id"],
        "generatedBy": "scripts/generate-hed-bundle.py",
        "synthetic": True,
        "containsPersonalData": False,
        "versions": {
            "sstim": suite,
            "application": app,
            "hedSchema": spec["hedSchema"]["version"],
            "mapping": spec["mappingVersion"],
            "sstimEventScheme": spec["sstimEventScheme"],
            "binding": "none — BIDS-style artifacts, not a BIDS dataset (decision 3)",
        },
        "clock": {
            "basis": "sstim:sessionClockOffsetSeconds",
            "origin": "The session clock origin declared by the session record; not wall-clock time.",
            "note": (
                "SSTIM's authority for timing is the engine timing context, so offsets "
                "are engine-clock seconds rather than derived from a host clock."
            ),
        },
        "source": {
            "file": bundle["source"],
            "sha256": sha256(source),
            "eventCount": len(events),
        },
        "crossArtifactIds": {
            "column": "event_id",
            "resolvesTo": "the local name of a sstim:SessionEvent in source.file",
            "ids": {r["event_id"]: r["iri"] for r in events},
        },
        "modulation": modulation,
        "artifacts": [
            {"file": name, "sha256": sha256(out / name)} for name in artifacts
        ],
        "declaredLoss": {
            r["type"]: spec["events"][r["type"]]["lossyBecause"]
            for r in events
            if "lossyBecause" in spec["events"][r["type"]]
        },
        "validated": [
            "Every HED string in events.tsv validates against the pinned schema via hedtools, with the sidecar Definitions in scope. Checked by `make hed-bundle-check`.",
            "The crosswalk itself validates, covers the SSTIM event scheme exactly, and declares loss wherever two event types collide. Checked by `make hed-crosswalk`.",
            "The artifacts are regenerated and compared, so a crosswalk edit that does not reach them fails.",
            "Declared loss is tested, not merely documented, by `make hed-roundtrip` — in both directions, so loss that is claimed but does not exist fails too.",
            "Every event_id resolves to a sstim:SessionEvent in source.file, and the source graph conforms to the SSTIM Full profile shapes.",
        ],
        "notValidated": [
            "No BIDS dataset is emitted. BIDS Behavioral is an optional binding under ADR 0025 decision 3 and is not part of the minimum semantic authority chain. These files are BIDS-*style*: a real BIDS continuous recording would be gzipped, named by entity, and sit inside a validator-clean dataset.",
            "Full recovery of SSTIM from HED is impossible by construction wherever declaredLoss is non-empty, and is not claimed. `make hed-roundtrip` asserts the weaker property that actually matters: every emitted string reverses to a candidate set containing its own event type, every ambiguous set is declared, and no unique mapping claims a collision.",
        ],
    }
    if sweep is not None:
        manifest["validated"].append(
            "The trace is non-constant, and its n/a spans coincide with the "
            "playback-pause and playback-resume rows in events.tsv."
        )
        manifest["notValidated"].append(
            "The trace carries the breathing period, which is fully determined by "
            "mp0/mp1/md. It does not carry the instantaneous carrier frequency, "
            "which would require integrating the oscillator phase and is a "
            "rendering concern rather than a semantic one."
        )
    (out / "bundle-manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    return manifest


# ── checking ─────────────────────────────────────────────────────────────────


def check_bundle(bundle: dict) -> list[str]:
    import shutil
    import tempfile

    out = ROOT / bundle["out"]
    tag = bundle["id"]
    problems: list[str] = []

    # Regenerate into a temporary directory, then check *that* — not the
    # committed bytes. Checking the committed copy meant every semantic guard
    # below sat behind the staleness comparison and could only run once the
    # bundle already matched, so a generator that stopped emitting traces
    # reported "bundle-manifest.json is stale" and never said what was wrong.
    # Staleness and correctness are separate questions and both answers are
    # useful, so both are always produced.
    tmp = Path(tempfile.mkdtemp())
    try:
        build(bundle, tmp)
        for f in sorted(tmp.iterdir()):
            committed = out / f.name
            if not committed.exists() or committed.read_bytes() != f.read_bytes():
                problems.append(f"{tag}: {f.name} is stale — run `make hed-bundle`")
        for f in sorted(out.iterdir()) if out.exists() else []:
            if not (tmp / f.name).exists():
                problems.append(f"{tag}: {f.name} is no longer generated — delete it")
        problems += inspect_bundle(bundle, tmp, tag)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    return problems


def inspect_bundle(bundle: dict, out: Path, tag: str) -> list[str]:
    """Everything that must hold of a bundle's content, staleness aside."""
    problems: list[str] = []
    manifest = json.loads((out / "bundle-manifest.json").read_text(encoding="utf-8"))
    spec = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    # By header, not by position. The table has grown a column twice now — the
    # event_id of decision 6, then the parameter columns — and a positional
    # unpack broke on each.
    lines = (out / "events.tsv").read_text(encoding="utf-8").splitlines()
    header = lines[0].split("\t")
    rows = [dict(zip(header, line.split("\t"))) for line in lines[1:]]

    # Emitted HED must validate. Decision 7 makes validation a publication gate,
    # and a bundle can be perfectly current and still wrong — this runs on the
    # freshly generated copy, so it is checking the generator, not the commit.
    from hed import load_schema_version
    from hed.models import DefinitionDict, HedString

    schema = load_schema_version(spec["hedSchema"]["version"])
    defs = DefinitionDict(
        [v for k, v in spec.get("definitions", {}).items() if not k.startswith("$")],
        schema,
    )
    for row in rows:
        if HedString(row["HED"], schema, def_dict=defs).validate(schema):
            problems.append(
                f"{tag}: invalid HED at t={row['onset']} ({row['event_type']}): {row['HED']}"
            )

    # Identifier consistency (decision 7). The manifest's id map and the table's
    # event_id column must both resolve in the source graph — a hash proves the
    # bytes did not change, not that the identifiers mean anything.
    graph = Graph()
    graph.parse(ROOT / bundle["source"], format="turtle")
    subjects = {local(s) for s in graph.subjects(RDF.type, S("SessionEvent"))}
    for row in rows:
        if row["event_id"] not in subjects:
            problems.append(
                f"{tag}: event_id '{row['event_id']}' resolves to no sstim:SessionEvent"
            )
    if set(manifest["crossArtifactIds"]["ids"]) != {r["event_id"] for r in rows}:
        problems.append(f"{tag}: manifest crossArtifactIds do not match the events table")

    # The trace, and the property the ADR actually cares about.
    sweep = read_sweep(graph)
    if sweep is None:
        if manifest["modulation"]["timeVarying"]:
            problems.append(f"{tag}: manifest claims time-varying, the source is fixed")
        if (out / "stimulus.tsv").exists():
            problems.append(f"{tag}: a trace exists for a fixed stimulus")
    else:
        if not (out / "stimulus.tsv").exists():
            problems.append(
                f"{tag}: the source declares a sweep and no trace was emitted — "
                f"ADR 0025 decision 5 forbids flattening it into the events table"
            )
        else:
            trace = [
                line.split("\t")
                for line in (out / "stimulus.tsv").read_text(encoding="utf-8").splitlines()
            ]
            values = {p for p, _ in trace if p != "n/a"}
            if len(values) < 2:
                problems.append(f"{tag}: the trace is constant for a swept parameter")
            # The n/a spans must be the pauses a *consumer* would read out of
            # events.tsv, so the spans are recomputed from the emitted table
            # rather than from the graph. Deriving both sides from
            # delivery_spans() would only prove the function agrees with itself;
            # this proves the two published artifacts tell one story, which is
            # the property someone reading the bundle actually depends on.
            #
            # It does not, and cannot, catch a delivery_spans() that is wrong in
            # the same way on both sides — that is what the committed fixture and
            # its reviewed values are for.
            published = [
                {"onset": float(r["onset"]), "type": r["event_type"]} for r in rows
            ]
            spans = delivery_spans(published)
            for index, (period, _rate) in enumerate(trace):
                at = index / TRACE_HZ
                inside = any(a <= at < b for a, b in spans)
                if inside and period == "n/a":
                    problems.append(
                        f"{tag}: trace is n/a at t={at} but events.tsv says delivery "
                        f"was open — the two artifacts disagree"
                    )
                    break
                if not inside and period != "n/a":
                    problems.append(
                        f"{tag}: trace carries {period} at t={at} but events.tsv says "
                        f"delivery was closed — that asserts an exposure that did not happen"
                    )
                    break

    return problems


def shacl_check(bundles: tuple) -> list[str]:
    """Decision 7 requires the bundles to pass SSTIM SHACL.

    The fixed bundle's source is a manifest-declared Full-profile fixture and is
    already validated by `make shacl-modules`; the segmented and modulated
    sources are owned by this gate, so this is the only place they get checked.
    All are validated rather than only the ones that need it, because a check
    covering half its inputs invites the reader to assume it covers all of them.

    Takes every bundle at once because the closure is the expensive part. Parsing
    the sixteen Full modules and the shapes per bundle cost about eight seconds
    each, and this gate runs in `make validate` on every CI push. The sources use
    disjoint `example:` namespaces and cannot interact, so one pass over their
    union answers the same question; if it fails, each source is re-validated
    alone to say which one, since a pooled report cannot.
    """
    from pyshacl import validate as shacl_validate

    files = subprocess.run(
        ["node", "scripts/sstim-manifest.mjs", "files", "full"],
        cwd=ROOT, capture_output=True, text=True, check=True,
    ).stdout.split()
    closure = Graph()
    for path in files:
        closure.parse(ROOT / path, format="turtle")
    shapes = Graph()
    shapes.parse(ROOT / "static" / "ontology" / "sstim-shapes.ttl", format="turtle")

    pooled = Graph()
    for triple in closure:
        pooled.add(triple)
    for bundle in bundles:
        pooled.parse(ROOT / bundle["source"], format="turtle")
    conforms, _graph, _text = shacl_validate(pooled, shacl_graph=shapes, advanced=True)
    if conforms:
        return []

    problems = []
    for bundle in bundles:
        single = Graph()
        for triple in closure:
            single.add(triple)
        single.parse(ROOT / bundle["source"], format="turtle")
        ok, _g, text = shacl_validate(single, shacl_graph=shapes, advanced=True)
        if not ok:
            head = "\n".join(text.strip().splitlines()[:12])
            problems.append(f"{bundle['id']}: source fails SSTIM Full shapes\n{head}")
    # The union failed but no source fails alone: that is a real finding, not a
    # flake, and hiding it behind a clean pass would be the worst outcome.
    return problems or [
        "the union of all bundle sources fails SSTIM Full shapes while each "
        "source passes alone — a cross-source interaction the disjoint-namespace "
        "assumption says cannot happen"
    ]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--no-shacl", action="store_true", help="skip the SSTIM SHACL pass")
    args = ap.parse_args()

    if not args.check:
        for bundle in BUNDLES:
            manifest = build(bundle, ROOT / bundle["out"])
            print(
                f"hed-bundle: wrote {bundle['out']} "
                f"({manifest['source']['eventCount']} events, "
                f"{manifest['modulation']['shape']}, "
                f"{len(manifest['artifacts'])} artifacts)"
            )
        return 0

    problems: list[str] = []
    for bundle in BUNDLES:
        problems += check_bundle(bundle)
    if not args.no_shacl:
        problems += shacl_check(BUNDLES)
    if problems:
        print(f"hed-bundle: FAILED ({len(problems)} issue(s))")
        for problem in problems:
            print(f"  - {problem}")
        return 1

    total_events = total_loss = 0
    shapes = []
    for bundle in BUNDLES:
        manifest = json.loads(
            (ROOT / bundle["out"] / "bundle-manifest.json").read_text(encoding="utf-8")
        )
        total_events += manifest["source"]["eventCount"]
        total_loss += len(manifest["declaredLoss"])
        shapes.append(manifest["modulation"]["shape"])
    print(
        f"hed-bundle: {len(BUNDLES)} bundles current and valid "
        f"({total_events} events validate as HED, every event_id resolves, "
        f"{total_loss} declaring information loss; "
        f"shapes: {', '.join(sorted(shapes))})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
