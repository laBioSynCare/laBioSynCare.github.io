#!/usr/bin/env python3
"""Answer "does SSTIM define this IRI, and where?" by looking everywhere it could live.

This exists because the question was answered wrongly twice by grepping one
place and reading silence as absence:

  * `sstim:composedOfTrack` was reported missing and reached an accepted ADR
    before anyone noticed it had existed all along (2026-08-14).
  * `w3id.org/sstim/organization/aeterni-anima` was reported as a dangling
    identifier — twice, once in a review and once in a release audit — because
    committed `static/ontology/**` does not define it. It never did: ADR 0031
    keeps *real* ecosystem agents in the external live-only projection and only
    synthetic fixtures in the repository, so the absence was the design working.
    The IRI resolves, and has since 2026-07-17.

An SSTIM identifier can legitimately live in five different places, and no
single grep sees more than two of them. This checks all five and says which,
so "it is not defined" stops being a judgement call.

Usage:
    scripts/locate-iri.py sstim:composedOfTrack
    scripts/locate-iri.py https://w3id.org/sstim/organization/aeterni-anima
    scripts/locate-iri.py aeterni-anima --offline   # skip the network check
"""

import argparse
import json
import re
import ssl
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ONTOLOGY = ROOT / "static" / "ontology"
LIVE_ECOSYSTEM = "https://biosyncare-lab.web.app/current.ttl"

PREFIXES = {
    "sstim:": "https://w3id.org/sstim#",
    "sstim-v:": "https://w3id.org/sstim/vocab#",
    "sstim-sh:": "https://w3id.org/sstim/shapes#",
    "sstim-ex:": "https://w3id.org/sstim/exposure#",
    "sstim-eco:": "https://w3id.org/sstim/ecosystem#",
}


def expand(term):
    for prefix, namespace in PREFIXES.items():
        if term.startswith(prefix):
            return namespace + term[len(prefix):]
    return term


def matcher(iri, local):
    """Match the term however it is written.

    The first version of this searched for the expanded IRI only, and so
    reported `sstim:composedOfTrack` — the very term whose false absence
    prompted the script — as not found, because Turtle writes the CURIE. A tool
    for catching blind spots is worth nothing with one of its own, so it now
    matches the full IRI *and* the local name after any of the separators a
    CURIE, an IRI or a hash fragment can use.
    """
    parts = [re.escape(local) + r"(?![\w-])"]
    if iri.startswith("http"):
        parts.append(re.escape(iri))
    return re.compile(r"(?:(?<=[:#/])|(?<=\s)|^)(?:" + "|".join(parts) + ")", re.MULTILINE)


def search(paths, pattern):
    """Return files whose text matches, with a sample line."""
    hits = []
    for path in paths:
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        if not pattern.search(text):
            continue
        sample = next(
            (line.strip() for line in text.splitlines() if pattern.search(line)), ""
        )
        hits.append((path.relative_to(ROOT), sample[:100]))
    return hits


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("term", help="a CURIE, a full IRI, or a bare local name")
    parser.add_argument("--offline", action="store_true", help="skip the live store")
    args = parser.parse_args()

    iri = expand(args.term)
    local = re.split(r"[#/]", iri)[-1]
    # Bare local names are matched loosely on purpose: the caller often does not
    # know which of the five SSTIM namespaces the term belongs to, and guessing
    # wrong is how the term index came to exist.
    pattern = matcher(iri, local)

    print(f"looking for: {iri}  (also matching the bare name {local!r})\n")
    found_anywhere = False

    live_modules = sorted(ONTOLOGY.glob("sstim-*.ttl"))
    instances = sorted((ONTOLOGY / "instances").rglob("*.ttl"))
    snapshots = sorted(
        path
        for directory in ONTOLOGY.iterdir()
        if directory.is_dir() and re.fullmatch(r"\d+\.\d+\.\d+", directory.name)
        for path in directory.glob("*.ttl")
    )

    sections = [
        ("term space (live modules)", live_modules, "an ontology term you may reuse"),
        ("committed instance data", instances, "public reference data, not term space"),
    ]
    for title, paths, note in sections:
        hits = search(paths, pattern)
        found_anywhere = found_anywhere or bool(hits)
        print(f"{title}: {len(hits)} file(s) — {note}")
        for path, sample in hits[:6]:
            print(f"    {path}")
            if sample:
                print(f"        {sample}")
        if len(hits) > 6:
            print(f"    … and {len(hits) - 6} more")

    snapshot_hits = search(snapshots, pattern)
    versions = sorted({path.parts[2] for path, _ in snapshot_hits})
    found_anywhere = found_anywhere or bool(snapshot_hits)
    print(f"frozen snapshots: {len(versions)} version(s) — immutable, never edit")
    if versions:
        print(f"    {', '.join(versions)}")

    # The place a repository grep structurally cannot see.
    if args.offline:
        print("live ecosystem store: skipped (--offline)")
    else:
        print("live ecosystem store: ", end="", flush=True)
        try:
            # Framework Python builds may lack OS CA certificates, and a
            # corporate/proxy chain shows up as a self-signed root. Prefer
            # certifi's bundle, as ~/.sstim/fetch-active-ledger.py already does.
            try:
                import certifi
                context = ssl.create_default_context(cafile=certifi.where())
            except ImportError:
                context = ssl.create_default_context()
            with urllib.request.urlopen(LIVE_ECOSYSTEM, timeout=30, context=context) as response:
                aggregate = response.read().decode("utf-8")
            count = len(pattern.findall(aggregate))
            found_anywhere = found_anywhere or bool(count)
            if count:
                print(f"{count} mention(s) — REAL ecosystem records live here, not in git")
                for line in aggregate.splitlines():
                    if pattern.search(line) and " a " in line:
                        print(f"    {line.strip()[:100]}")
                        break
            else:
                print("absent")
        except Exception as error:  # network, DNS, TLS — never fail the answer
            print(f"unreachable ({type(error).__name__}) — answer is INCOMPLETE")
            print("    Re-run with network access before concluding the IRI is undefined.")

    print()
    if found_anywhere:
        print("VERDICT: defined. Note *where* — the layers mean different things.")
    else:
        print("VERDICT: not found in any of the five places.")
        print("Before reporting it missing, check the generated term index too:")
        print("    grep -i <name> docs/ontology/TERM_INDEX.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
