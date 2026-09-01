#!/usr/bin/env python3
"""Hash the test-visible Git working tree, including non-ignored untracked files."""

from __future__ import annotations

import argparse
import hashlib
import os
import stat
import subprocess
import sys
from pathlib import Path


def _frame(digest: "hashlib._Hash", label: bytes, payload: bytes) -> None:
    digest.update(label)
    digest.update(len(payload).to_bytes(8, "big"))
    digest.update(payload)


def working_tree_hash(root: Path) -> str:
    root_bytes = os.fsencode(root.resolve())
    listed = subprocess.run(
        [
            "git",
            "-C",
            os.fsdecode(root_bytes),
            "ls-files",
            "-z",
            "--cached",
            "--others",
            "--exclude-standard",
        ],
        check=True,
        capture_output=True,
    ).stdout
    paths = sorted(path for path in listed.split(b"\0") if path)
    digest = hashlib.sha256()
    for relative in paths:
        _frame(digest, b"path\0", relative)
        absolute = os.path.join(root_bytes, relative)
        try:
            metadata = os.lstat(absolute)
        except FileNotFoundError:
            _frame(digest, b"kind\0", b"missing")
            continue
        if stat.S_ISLNK(metadata.st_mode):
            _frame(digest, b"kind\0", b"symlink")
            target = os.readlink(absolute)
            _frame(
                digest,
                b"target\0",
                target if isinstance(target, bytes) else os.fsencode(target),
            )
        elif stat.S_ISREG(metadata.st_mode):
            _frame(digest, b"kind\0", b"file")
            _frame(
                digest,
                b"mode\0",
                b"executable" if metadata.st_mode & 0o111 else b"regular",
            )
            content_digest = hashlib.sha256()
            with open(absolute, "rb") as source:
                while chunk := source.read(1024 * 1024):
                    content_digest.update(chunk)
            _frame(digest, b"content-sha256\0", content_digest.digest())
        else:
            _frame(digest, b"kind\0", f"mode:{metadata.st_mode:o}".encode("ascii"))
    return digest.hexdigest()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="Git working tree to hash (default: this script's repository)",
    )
    args = parser.parse_args(sys.argv[1:] if argv is None else argv)
    try:
        print(working_tree_hash(args.root))
    except (OSError, subprocess.SubprocessError) as error:
        print(f"working-tree-hash: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
