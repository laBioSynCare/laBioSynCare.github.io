#!/usr/bin/env python3
"""Measure what the public registries actually say about SSTIM.

**Not part of `make validate`, and never will be.** Every other gate here is
offline and deterministic; this one talks to eight third-party services and would
fail on their outages rather than on our defects. It is opt-in — `make
registry-verify` — and CI does not run it.

It exists because `docs/ontology/REGISTRY_SUBMISSIONS.md` is a tracker of
*external* state, which is the kind that rots without anything noticing, and one
entry had been wrong since before 2026-07-11:

    prefix.cc served  sstim -> https://w3id.org/sstim/
    SSTIM's namespace is      https://w3id.org/sstim#

The tracker said the hash form was registered and marked it **DONE**. Anything
resolving the `sstim` prefix through prefix.cc — which is what prefix.cc is for,
and what SPARQL editors and reconciliation tools do — built every term IRI with a
slash, and `https://w3id.org/sstim/Preset` is a 404. Nobody had fetched it,
partly because prefix.cc's TLS certificate expired on 2025-12-31 and the ordinary
`https://` check fails before it can answer.

The design rule is the one `truth-audit.mjs` uses: **derive the expected value,
do not restate it.** The namespace comes out of `sstim-core.ttl`, so this cannot
drift from the ontology the way the prose did.

**INCOMPLETE is not a pass and not a failure.** An unreachable registry is an
unreachable instrument (CLAUDE.md §3.6); reporting it as absence is exactly the
error this repository keeps finding. Unreachable services are listed separately
and do not set the exit status, so an outage cannot fail the run — but neither
can it be mistaken for a clean one.

Usage:  python3 scripts/verify-registries.py [--timeout SECONDS]
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / "static" / "ontology" / "sstim-core.ttl"
TERM_INDEX = ROOT / "docs" / "ontology" / "TERM_INDEX.md"

UA = {"User-Agent": "sstim-registry-verify/1.0 (+https://w3id.org/sstim)"}


def canonical_namespace() -> str:
    """The `sstim:` namespace, read from the ontology rather than typed here."""
    text = CORE.read_text(encoding="utf-8")
    match = re.search(r"^@prefix\s+sstim:\s+<([^>]+)>", text, re.M)
    if not match:
        raise SystemExit("verify-registries: no sstim: prefix in sstim-core.ttl")
    return match.group(1)


def ontology_header() -> tuple[str, str]:
    """The ontology IRI and its English description, read from sstim-core.ttl.

    LOV displays both, and on 2026-09-28 it displayed two modules' instead.
    """
    text = CORE.read_text(encoding="utf-8")
    header = re.search(r"^<([^>]+)>\s*\n\s*a owl:Ontology\b", text, re.M)
    if not header:
        raise SystemExit("verify-registries: no owl:Ontology header in sstim-core.ttl")
    description = re.search(r'dct:description "([^"]+)"@en', text[header.end():])
    if not description:
        raise SystemExit("verify-registries: the sstim-core.ttl header has no English description")
    return header.group(1), description.group(1)


def term_totals() -> dict[str, str]:
    """Classes, properties and concepts, read from the generated term index.

    Same rule as the namespace above: derive, do not restate. BARTOC publishes
    these counts as its `extent`, and an extent is exactly the field that goes
    quietly stale — it was seven weeks out of date when the 2026-09-01 migration
    request was raised.
    """
    match = re.search(
        r"(\d+) classes · (\d+) properties · (\d+) concepts",
        TERM_INDEX.read_text(encoding="utf-8"),
    )
    if not match:
        raise SystemExit("verify-registries: no totals line in TERM_INDEX.md")
    return dict(zip(("classes", "properties", "concepts"), match.groups()))


# curl rather than urllib, and the reason is this script's own subject matter.
# The first version used urllib and reported every registry INCOMPLETE, because
# the Python here has no CA bundle configured — an instrument blind for its own
# reasons, announcing that the world was unreachable. curl carries the system
# trust store and answered all of them. A checker that cannot tell its own
# breakage from the thing it checks is worse than none.
CURL_NOTES = {
    6: "could not resolve host",
    7: "could not connect",
    28: "timed out",
    35: "TLS handshake failed",
    60: "TLS certificate problem (expired or untrusted)",
}


def fetch(url: str, timeout: int, accept: str | None = None) -> tuple[int | None, str, str]:
    """(status, body, note). status None means the instrument could not reach it."""
    if shutil.which("curl") is None:
        return None, "", "curl not installed"
    headers = ["-H", UA["User-Agent"] and f"User-Agent: {UA['User-Agent']}"]
    if accept:
        headers += ["-H", f"Accept: {accept}"]
    result = subprocess.run(
        ["curl", "-sSL", "--max-time", str(timeout), "-w", "\n%{http_code}",
         *headers, url],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        note = CURL_NOTES.get(result.returncode, f"curl exit {result.returncode}")
        return None, "", note
    body, _, code = result.stdout.rpartition("\n")
    try:
        return int(code.strip()), body, ""
    except ValueError:
        return None, "", "no status from curl"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--timeout", type=int, default=30)
    args = ap.parse_args()

    namespace = canonical_namespace()
    failures: list[str] = []
    incomplete: list[str] = []
    passed: list[str] = []

    # ── prefix.cc: the one that was wrong ────────────────────────────────────
    # Plain http on purpose. The certificate expired 2025-12-31, so https fails
    # closed and answers nothing; this is a public prefix mapping with no secret
    # in it, and reading it over http is how you get an answer at all. If the
    # certificate is ever renewed, prefer https here.
    status, body, note = fetch("http://prefix.cc/sstim.file.txt", args.timeout)
    if status is None:
        incomplete.append(f"prefix.cc unreachable ({note})")
    elif status != 200:
        incomplete.append(f"prefix.cc returned HTTP {status}")
    else:
        served = body.strip().split("\t")[-1].strip()
        if served == namespace:
            passed.append(f"prefix.cc maps sstim to {served}")
        else:
            failures.append(
                f"prefix.cc maps sstim to {served!r}, the ontology declares "
                f"{namespace!r} — every term IRI a consumer builds from this "
                f"prefix is wrong, and does not resolve"
            )

    # ── presence checks: a URL that must answer 200 ──────────────────────────
    # The Accept column is not decoration. Archivo's revived `/info` endpoint
    # answers 200 to `Accept: text/html`, 307 to `text/turtle`, and **406 to
    # `*/*` and to a request with no Accept header at all** (measured
    # 2026-08-24). Both of those mean "any media type is acceptable" under
    # RFC 9110, so 406 is wrong and it breaks every plain client, this checker
    # included. Asking for HTML is also what this check actually means: the
    # human-readable record page answers. Drop the header only once upstream
    # stops 406-ing `*/*`; see docs/ontology/REGISTRY_SUBMISSIONS.md.
    presence = [
        ("BARTOC node 21154", "https://bartoc.org/en/node/21154", None),
        ("FAIRsharing 8494", "https://fairsharing.org/8494", None),
        ("Archivo record", "https://archivo.dbpedia.org/info?o=https://w3id.org/sstim", "text/html"),
    ]
    for name, url, accept in presence:
        status, _body, note = fetch(url, args.timeout, accept)
        if status is None:
            incomplete.append(f"{name} unreachable ({note})")
        elif status == 200:
            passed.append(f"{name} answers 200")
        else:
            failures.append(f"{name} answers HTTP {status}, expected 200")

    # ── BARTOC: the fields, not just the page ───────────────────────────────
    # A 200 said nothing about whether the record still pointed at the legacy
    # host. The curator migrated it on 2026-09-02 (gbv/bartoc.org#319); this is
    # what would notice if it drifted back, or if a later edit re-staled the
    # extent. Only the fields the migration request actually covered are
    # checked: the publisher deliberately still reads `github.com/laBioSynCare`,
    # a governance question and not a location, so it is left alone here.
    status, body, note = fetch(
        "https://bartoc.org/api/data?uri=http://bartoc.org/en/node/21154",
        args.timeout,
        "application/json",
    )
    if status is None:
        incomplete.append(f"BARTOC JSKOS unreachable ({note})")
    elif status != 200:
        incomplete.append(f"BARTOC JSKOS returned HTTP {status}")
    else:
        try:
            record = json.loads(body)
            record = record[0] if isinstance(record, list) else record
        except (ValueError, IndexError, KeyError):
            incomplete.append("BARTOC JSKOS did not parse as a record")
            record = None

        if record is not None:
            served_ns = record.get("namespace", "")
            if served_ns != namespace:
                failures.append(
                    f"BARTOC publishes namespace {served_ns!r}, the ontology "
                    f"declares {namespace!r}"
                )
            links = " ".join(entry.get("url", "") for entry in record.get("subjectOf", []))
            if "github.com/w3c-cg/sstim" not in links:
                failures.append("BARTOC subjectOf no longer names the W3C-CG repository")
            elif "laBioSynCare.github.io" in links:
                failures.append(
                    "BARTOC subjectOf names the legacy repository again; the "
                    "2026-09-02 migration has been undone"
                )
            else:
                passed.append("BARTOC points at the W3C-CG repository and the sstim# namespace")

            extent = record.get("extent", "")
            stale = [
                f"{count} {noun}"
                for noun, count in term_totals().items()
                if not re.search(rf"\b{count}\s+{noun}\b", extent)
            ]
            if stale:
                failures.append(
                    f"BARTOC extent {extent!r} disagrees with the term index on "
                    + ", ".join(stale)
                )
            else:
                passed.append("BARTOC extent matches the term index")

    # ── LOV: the listing, and the fields it holds ────────────────────────────
    # Listed 2026-09-28 by María Poveda-Villalón with /technique as its uri and
    # the stimulus module's description: LOV's loader offered her many candidate
    # descriptions, which the namespace document's sixteen headers supply.
    # Corrected 2026-09-29; both are checked so any later drift registers. The
    # API moved with the pages (/dataset/lov/api/v2 now 404s even for skos), and
    # an unknown prefix answers 404 here, so a 404 still needs the control
    # before it may say "delisted": without one an outage reads as our record
    # gone.
    api = "https://lov.linkeddata.es/dataset/api/v2/vocabulary/info?vocab="
    iri, description = ontology_header()
    ours, body, note_a = fetch(api + "sstim", args.timeout, "application/json")
    if ours is None:
        incomplete.append(f"LOV unreachable ({note_a})")
    elif ours == 404:
        control, _c, note_b = fetch(api + "skos", args.timeout, "application/json")
        if control == 200:
            failures.append("LOV no longer serves sstim, control present: the 2026-09-28 listing is gone")
        else:
            incomplete.append(
                f"LOV sstim 404 and control (skos) did not answer 200, so it cannot "
                f"distinguish delisting from an outage ({note_b or control})"
            )
    elif ours != 200:
        incomplete.append(f"LOV sstim answered HTTP {ours}, neither 200 nor 404")
    else:
        try:
            record = json.loads(body)
        except ValueError:
            incomplete.append("LOV sstim record did not parse as JSON")
            record = None

        if record is not None:
            english = [d.get("value") for d in record.get("descriptions", []) if d.get("lang") == "en"]
            wrong = [
                f"{field} {got!s:.60}, expected {want:.60}"
                for field, got, want in (
                    ("uri", record.get("uri"), iri),
                    ("nsp", record.get("nsp"), namespace),
                    ("description", english[0] if english else None, description),
                )
                if got != want
            ]
            if wrong:
                failures.append("LOV lists sstim but holds " + "; ".join(wrong))
            else:
                passed.append(f"LOV lists sstim as {iri}, with the namespace and description of sstim-core.ttl")

    # ── report ───────────────────────────────────────────────────────────────
    for line in passed:
        print(f"  ok         {line}")
    for line in incomplete:
        print(f"  INCOMPLETE {line}")
    for line in failures:
        print(f"  FAILED     {line}")

    print(
        f"\nregistry-verify: {len(passed)} verified, {len(incomplete)} unreachable, "
        f"{len(failures)} wrong"
    )
    if incomplete and not failures:
        print("  Unreachable is not absence and does not fail this run (CLAUDE.md §3.6).")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
