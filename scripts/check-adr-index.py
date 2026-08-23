#!/usr/bin/env python3
"""Keep the ADR index honest about what each decision's status actually is.

There are 51 ADRs and 25 of them are cited by filename from the frozen,
DOI-citable ontology snapshots — 1,139 `rdfs:seeAlso` links that can never be
edited to follow a rename. So the files stay, individually and immutably, and
the way to make 51 of them tractable is an index good enough that you rarely
open one.

The index turned out to be in good order — the two problems this was written to
fix were both artifacts of the patterns used to look for them, which is its own
lesson. So this guards the future rather than repairing the past: every file has
a row, every row has a file, and every row's leading status word matches the
status the file declares. The summaries are hand-written and worth keeping, so
it verifies rather than regenerates.

Supersession is the part that makes 51 tractable. An ADR that says it was
superseded must say so in the index too, or the index quietly recommends a
decision that no longer holds.
"""

from __future__ import annotations

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
DECISIONS = ROOT / "docs" / "decisions"
INDEX = DECISIONS / "README.md"

# Dots occur in ADR slugs (0022-0.6-release-review-posture.md), and excluding
# them made this report a dangling index row that was not dangling.
ADR_FILE = re.compile(r"^(\d{4})-[a-z0-9.-]+\.md$")
INDEX_ROW = re.compile(r"^\|\s*\[(\d{4})\]\(([^)]+)\)\s*\|(.*)\|\s*([^|]+?)\s*\|\s*$")
STATUS_LINE = re.compile(r"^\*\*Status:\*\*\s*(.+)$", re.MULTILINE)
# "Superseded by ADR 0043", "superseded by 0043", "Superseded by [0043](...)"
SUPERSEDED_BY = re.compile(r"supersed(?:ed)\s+by\s+(?:ADR\s+)?\[?(\d{4})", re.IGNORECASE)


def declared_status(text: str) -> tuple[str, str]:
    """The status word an ADR declares, and the full status line."""
    match = STATUS_LINE.search(text)
    if not match:
        return "", ""
    line = match.group(1).strip()
    word = re.split(r"[\s—·,;(]", line.lstrip("*"), 1)[0].strip("* ")
    return word, line


def main() -> int:
    failures: list[str] = []

    files = {
        m.group(1): path
        for path in sorted(DECISIONS.glob("*.md"))
        if (m := ADR_FILE.match(path.name))
    }
    if not files:
        raise SystemExit("adr-index: no ADR files found — the glob is wrong, not the index")

    index_text = INDEX.read_text(encoding="utf-8")
    rows: dict[str, tuple[str, str]] = {}
    for line in index_text.splitlines():
        match = INDEX_ROW.match(line)
        if match:
            rows[match.group(1)] = (match.group(2), match.group(4).strip())

    for number in sorted(set(files) - set(rows)):
        failures.append(f"ADR {number} ({files[number].name}) has no row in the index")
    for number in sorted(set(rows) - set(files)):
        failures.append(f"the index has a row for ADR {number}, which is not a file here")

    superseded_elsewhere: dict[str, str] = {}
    for number, path in files.items():
        text = path.read_text(encoding="utf-8")
        word, line = declared_status(text)
        if not word:
            failures.append(f"ADR {number} ({path.name}) declares no **Status:** line")
            continue
        if number in rows:
            target, claimed = rows[number]
            if Path(target).name != path.name:
                failures.append(
                    f"ADR {number}: the index links to {target}, the file is {path.name}"
                )
            # The index legitimately carries more than the file's bare status —
            # "Accepted · amended by 0027" is useful and is not drift. Only the
            # leading status word has to agree.
            claimed_word = re.split(r"[\s—·,;(]", claimed.strip("* "), 1)[0].strip("* []")
            if claimed_word.lower() != word.lower():
                failures.append(
                    f"ADR {number}: the index says {claimed_word!r}, the file declares "
                    f"{word!r} ({line[:60]})"
                )
        # Only the status line and the first paragraphs are authoritative about
        # supersession; a passing mention deep in prose is discussion, not state.
        head = text[: text.find("## Decision")] if "## Decision" in text else text[:2000]
        for match in SUPERSEDED_BY.finditer(head):
            superseded_elsewhere[number] = match.group(1)

    for number, by in sorted(superseded_elsewhere.items()):
        claimed = rows.get(number, ("", ""))[1]
        if claimed.lower().startswith("superseded"):
            continue
        failures.append(
            f"ADR {number} says it was superseded by {by}, but the index lists it as "
            f"{claimed!r} — a reader would take a retired decision as current"
        )

    if failures:
        print(f"adr-index: FAILED ({len(failures)})", file=sys.stderr)
        for failure in failures:
            print(f"  - {failure}", file=sys.stderr)
        return 1

    tally: dict[str, int] = {}
    for number in files:
        word, _ = declared_status(files[number].read_text(encoding="utf-8"))
        tally[word] = tally.get(word, 0) + 1
    summary = ", ".join(f"{count} {word.lower()}" for word, count in sorted(tally.items()))
    print(f"adr-index: passed ({len(files)} ADRs indexed — {summary})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
