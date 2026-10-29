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

It also tells a definition from a use from a mention. Counting every match as
"defined" made the opposite mistake: `sstim:Stimulus`, which is not a term, was
reported defined because the word appears in comments, labels and history
notes. A file defines a term only when the term is the subject of a statement
there; a comment or a string literal only mentions it.

Usage:
    scripts/locate-iri.py sstim:composedOfTrack
    scripts/locate-iri.py https://w3id.org/sstim/organization/aeterni-anima
    scripts/locate-iri.py aeterni-anima --offline   # skip the network check
"""

import argparse
import json
import re
import shutil
import ssl
import subprocess
import sys
import urllib.error
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


def code_only(text):
    """Blank out Turtle comments and string literals, keeping every line.

    What remains is the statements themselves, where a term can be defined or
    used; a name inside a comment or a definition's text is only mentioned.
    """
    out = list(text)
    i, n = 0, len(text)

    def blank(start, end):
        for k in range(start, end):
            if out[k] != "\n":
                out[k] = " "

    while i < n:
        c = text[i]
        if c == "<":
            # An IRI holds no whitespace; a '<' that does not close first is not one.
            close = re.compile(r"[>\s]").search(text, i + 1)
            if close and text[close.start()] == ">":
                i = close.start() + 1
                continue
        elif c == "#":
            end = text.find("\n", i)
            end = n if end == -1 else end
            blank(i, end)
            i = end
            continue
        elif c in "\"'":
            quote = text[i:i + 3] if text[i:i + 3] in ('"""', "'''") else c
            j = i + len(quote)
            while j < n and not text.startswith(quote, j):
                if text[j] == "\\":
                    j += 1
                elif len(quote) == 1 and text[j] == "\n":
                    break
                j += 1
            end = min(n, j + len(quote))
            blank(i + len(quote), j)
            i = end
            continue
        i += 1
    return "".join(out)


def prefixes(code):
    """The prefix declarations a Turtle document makes, as {prefix: namespace}."""
    found = re.findall(r"(?im)^\s*@?prefix\s+([\w.-]*):\s*<([^>]*)>", code)
    return dict(found)


def defines(code, iri, local):
    """Whether the document makes the term the subject of a statement.

    Subjects start a line in every Turtle file here. A CURIE counts only when its
    prefix expands to the namespace asked about; a bare name asked about matches
    under any prefix, as the loose matcher does.
    """
    namespaces = prefixes(code)
    subject = re.compile(
        r"^(?:<(?P<iri>[^>\s]+)>|(?P<prefix>[\w.-]*):(?P<local>[\w.-]+))(?![\w:-])", re.MULTILINE
    )
    loose = not iri.startswith("http")
    for match in subject.finditer(code):
        if match.group("iri"):
            if match.group("iri") == iri:
                return True
        elif match.group("local") == local:
            namespace = namespaces.get(match.group("prefix"))
            if loose or (namespace is not None and namespace + local == iri):
                return True
    return False


def classify(text, pattern, iri, local):
    """'defined', 'used' (in a statement, not as its subject), 'mentioned' or None."""
    if not pattern.search(text):
        return None
    code = code_only(text)
    if defines(code, iri, local):
        return "defined"
    return "used" if pattern.search(code) else "mentioned"


def search(paths, pattern, iri, local):
    """Return (path, kind, sample line) for every file that matches at all."""
    hits = []
    for path in paths:
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        kind = classify(text, pattern, iri, local)
        if kind is None:
            continue
        sample = next(
            (line.strip() for line in text.splitlines() if pattern.search(line)), ""
        )
        hits.append((path.relative_to(ROOT), kind, sample[:100]))
    return hits


def tally(hits):
    counts = {kind: sum(1 for _, k, _ in hits if k == kind) for kind in KINDS}
    return ", ".join(f"{counts[kind]} {KINDS[kind]}" for kind in KINDS if counts[kind]) or "0 files"


KINDS = {
    "defined": "define it",
    "used": "only use it",
    "mentioned": "only mention it in comments or text",
}


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
    seen = set()
    complete = True

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
    mentioned_in = []
    for title, paths, note in sections:
        hits = search(paths, pattern, iri, local)
        seen.update(kind for _, kind, _ in hits)
        mentioned_in += [path for path, kind, _ in hits if kind == "mentioned"]
        print(f"{title}: {tally(hits)} — {note}")
        # Definitions first: they are the answer; mentions are the noise.
        ranked = sorted(hits, key=lambda hit: list(KINDS).index(hit[1]))
        for path, kind, sample in ranked[:6]:
            print(f"    [{kind}] {path}")
            if sample:
                print(f"        {sample}")
        if len(hits) > 6:
            print(f"    … and {len(hits) - 6} more")

    snapshot_hits = search(snapshots, pattern, iri, local)
    seen.update(kind for _, kind, _ in snapshot_hits)
    versions = sorted({path.parts[2] for path, kind, _ in snapshot_hits if kind == "defined"})
    print(f"frozen snapshots: defined in {len(versions)} version(s) — immutable, never edit")
    if versions:
        print(f"    {', '.join(versions)}")

    # The place a repository grep structurally cannot see.
    if args.offline:
        print("live ecosystem store: skipped (--offline)")
        complete = False
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
            try:
                with urllib.request.urlopen(LIVE_ECOSYSTEM, timeout=30, context=context) as response:
                    aggregate = response.read().decode("utf-8")
            except urllib.error.URLError:
                # python.org's macOS builds ship without CA certificates until
                # their certificate script is run; curl uses the system's.
                if not shutil.which("curl"):
                    raise
                aggregate = subprocess.run(
                    ["curl", "-sSf", "--max-time", "30", LIVE_ECOSYSTEM],
                    capture_output=True, text=True, check=True,
                ).stdout
            kind = classify(aggregate, pattern, iri, local)
            if kind:
                seen.add(kind)
                print(f"{kind} here — REAL ecosystem records live here, not in git")
                for line in aggregate.splitlines():
                    if pattern.search(line) and " a " in line:
                        print(f"    {line.strip()[:100]}")
                        break
            else:
                print("absent")
        except Exception as error:  # network, DNS, TLS — never fail the answer
            print(f"unreachable ({type(error).__name__}) — answer is INCOMPLETE")
            print("    Re-run with network access before concluding the IRI is undefined.")
            complete = False

    print()
    if "defined" in seen:
        print("VERDICT: defined. Note *where* — the layers mean different things.")
    elif "used" in seen:
        print("VERDICT: used in statements but defined in none of the five places.")
        print("It may be an external term, or a reference to something that does not exist.")
    else:
        if "mentioned" in seen:
            print("VERDICT: not defined. It is only mentioned in comments or text:")
            for path in mentioned_in[:3]:
                print(f"    {path}")
        else:
            print("VERDICT: not found in any of the five places.")
        print("Before reporting it missing, check the generated term index too:")
        print("    grep -i <name> docs/ontology/TERM_INDEX.md")
    if "defined" not in seen and not complete:
        print("INCOMPLETE: the live ecosystem store was not read, and real ecosystem")
        print("records are defined only there. This is not evidence of absence.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
