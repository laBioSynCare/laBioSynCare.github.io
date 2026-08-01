#!/usr/bin/env python3
"""Validate the SSTIM manifest with its published Draft 2020-12 schema."""

from __future__ import annotations

import json
from pathlib import Path
import sys

try:
    from jsonschema import Draft202012Validator, FormatChecker
    from jsonschema.exceptions import SchemaError
except ImportError:
    sys.exit(
        "manifest-schema: jsonschema is required. Run inside `nix develop`, "
        "or install the Python jsonschema package."
    )


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "static" / "ontology" / "manifest.json"
SCHEMA_PATH = ROOT / "static" / "ontology" / "manifest.schema.json"


def location(error) -> str:
    parts = [str(part) for part in error.absolute_path]
    return ".".join(parts) if parts else "manifest"


def main() -> int:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))

    try:
        Draft202012Validator.check_schema(schema)
    except SchemaError as exc:
        print(f"manifest-schema: invalid schema: {exc.message}", file=sys.stderr)
        return 1

    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    errors = sorted(
        validator.iter_errors(manifest),
        key=lambda error: (tuple(map(str, error.absolute_path)), error.message),
    )
    if errors:
        print(f"manifest-schema: FAIL ({len(errors)} issue(s))", file=sys.stderr)
        for error in errors:
            print(f"  - {location(error)}: {error.message}", file=sys.stderr)
        return 1

    print("manifest-schema: PASS (Draft 2020-12)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
