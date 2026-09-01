#!/usr/bin/env python3
"""Validate the BioPortal ledger and enforce append-only release records."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path


LEDGER_RELATIVE = Path("scripts/bioportal-release-integrity.json")
STABLE_VERSION = re.compile(
    r"^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)$"
)
SHA256 = re.compile(r"^[0-9a-f]{64}$")
RECORD_FIELDS = {
    "sha256",
    "canonicalGraphSha256",
    "sourceClosureSha256",
    "bytes",
    "triples",
}


class LedgerError(RuntimeError):
    """The ledger is malformed or rewrites a previously recorded release."""


def _strict_object(pairs: list[tuple[str, object]]) -> dict[str, object]:
    result: dict[str, object] = {}
    for key, value in pairs:
        if key in result:
            raise LedgerError(f"duplicate JSON key {key!r}")
        result[key] = value
    return result


def _parse_json(text: str, source: str) -> dict[str, object]:
    try:
        value = json.loads(text, object_pairs_hook=_strict_object)
    except (UnicodeError, json.JSONDecodeError) as error:
        raise LedgerError(f"{source}: invalid strict JSON: {error}") from error
    if not isinstance(value, dict):
        raise LedgerError(f"{source}: expected a JSON object")
    return value


def _validated_releases(
    document: dict[str, object], source: str
) -> dict[str, dict[str, object]]:
    schema_version = document.get("schemaVersion")
    if type(schema_version) is not int or schema_version != 1:
        raise LedgerError(f"{source}: schemaVersion must be the integer 1")
    if not isinstance(document.get("description"), str) or not document["description"]:
        raise LedgerError(f"{source}: description must be a nonempty string")
    releases = document.get("releases")
    if not isinstance(releases, dict) or not releases:
        raise LedgerError(f"{source}: releases must be a nonempty object")

    versions = list(releases)
    if any(STABLE_VERSION.fullmatch(version) is None for version in versions):
        raise LedgerError(f"{source}: every release key must be stable X.Y.Z SemVer")
    semantic_order = sorted(versions, key=lambda value: tuple(map(int, value.split("."))))
    if versions != semantic_order:
        raise LedgerError(f"{source}: release records must be in ascending SemVer order")

    checked: dict[str, dict[str, object]] = {}
    for version, record in releases.items():
        if not isinstance(record, dict):
            raise LedgerError(f"{source}: release {version} record must be an object")
        actual_fields = set(record)
        if actual_fields != RECORD_FIELDS:
            missing = sorted(RECORD_FIELDS - actual_fields)
            extra = sorted(actual_fields - RECORD_FIELDS)
            raise LedgerError(
                f"{source}: release {version} fields differ; missing={missing}, extra={extra}"
            )
        for field in ("sha256", "canonicalGraphSha256", "sourceClosureSha256"):
            value = record[field]
            if not isinstance(value, str) or SHA256.fullmatch(value) is None:
                raise LedgerError(
                    f"{source}: release {version} {field} must be 64 lowercase hex digits"
                )
        for field in ("bytes", "triples"):
            value = record[field]
            if type(value) is not int or value <= 0:
                raise LedgerError(
                    f"{source}: release {version} {field} must be a positive integer"
                )
        checked[version] = record
    return checked


def _git(root: Path, *arguments: str) -> subprocess.CompletedProcess[bytes]:
    return subprocess.run(
        ["git", "-C", str(root), *arguments],
        check=False,
        capture_output=True,
    )


def check_ledger(root: Path, baseline_ref: str | None) -> tuple[int, bool]:
    root = root.resolve()
    ledger_path = root / LEDGER_RELATIVE
    try:
        current_document = _parse_json(
            ledger_path.read_text(encoding="utf-8"), str(ledger_path)
        )
    except (OSError, UnicodeError) as error:
        raise LedgerError(f"{ledger_path}: cannot read ledger: {error}") from error
    current = _validated_releases(current_document, str(ledger_path))

    if baseline_ref is None:
        return len(current), False
    if not baseline_ref or baseline_ref == "0" * 40:
        raise LedgerError("baseline ref is empty or the all-zero push sentinel")
    commit = _git(root, "cat-file", "-e", f"{baseline_ref}^{{commit}}")
    if commit.returncode != 0:
        detail = commit.stderr.decode("utf-8", errors="replace").strip()
        raise LedgerError(f"cannot resolve baseline ref {baseline_ref!r}: {detail}")

    history = _git(
        root,
        "log",
        "--reverse",
        "--first-parent",
        "--format=%H",
        baseline_ref,
        "--",
        LEDGER_RELATIVE.as_posix(),
    )
    if history.returncode != 0:
        detail = history.stderr.decode("utf-8", errors="replace").strip()
        raise LedgerError(f"cannot inspect ledger history at {baseline_ref!r}: {detail}")

    anchors: dict[str, tuple[dict[str, object], str]] = {}
    commits = [line for line in history.stdout.decode("ascii").splitlines() if line]
    for historical_commit in commits:
        object_name = f"{historical_commit}:{LEDGER_RELATIVE.as_posix()}"
        previous_result = _git(root, "show", object_name)
        if previous_result.returncode != 0:
            # A path-history commit can be the deletion itself. Continue to the
            # earlier version so delete/reintroduce cannot erase the invariant.
            continue
        try:
            previous_text = previous_result.stdout.decode("utf-8")
        except UnicodeError:
            # A rejected intermediate default-branch state must not make a
            # later restoration impossible. Only valid historical ledgers can
            # establish an immutable release anchor.
            continue
        try:
            previous_document = _parse_json(previous_text, object_name)
            previous = _validated_releases(previous_document, object_name)
        except LedgerError:
            continue
        for version, record in previous.items():
            anchors.setdefault(version, (record, historical_commit))

    for version, (record, historical_commit) in anchors.items():
        if version not in current:
            raise LedgerError(
                f"release {version} anchored at {historical_commit[:12]} was "
                "removed from the append-only ledger"
            )
        if current[version] != record:
            raise LedgerError(
                f"release {version} immutable integrity record differs from its "
                f"first-parent history anchor at {historical_commit[:12]}"
            )
    return len(current), bool(anchors)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="repository root (default: inferred from this script)",
    )
    baseline = parser.add_mutually_exclusive_group()
    baseline.add_argument(
        "--baseline-ref",
        default="HEAD",
        help="Git commit whose existing records must remain byte-identical",
    )
    baseline.add_argument(
        "--no-baseline",
        action="store_true",
        help="validate structure only (intended for isolated tests)",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        count, compared = check_ledger(
            args.root, None if args.no_baseline else args.baseline_ref
        )
    except LedgerError as error:
        print(f"bioportal-ledger-check: {error}", file=sys.stderr)
        return 1
    comparison = f"; append-only against {args.baseline_ref}" if compared else ""
    print(f"bioportal-ledger-check: {count} valid release record(s){comparison}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
