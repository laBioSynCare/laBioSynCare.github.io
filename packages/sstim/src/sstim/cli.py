"""Command line entry point: `sstim`.

Deliberately small. The interesting work is in the library; this exists so that
the shortest path from "I have a Turtle file" to "I know whether it is right"
is two commands, one of which is `pip install`.
"""

from __future__ import annotations

import argparse
import sys

from . import __version__
from ._resolve import SstimError, cache_dir, resolve_profile
from ._validate import validate

PROFILES = ("kernel", "core", "core-plus", "full")


def _shared(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--profile", default="core", choices=PROFILES,
        help="which profile to resolve (default: core)",
    )
    parser.add_argument(
        "--version", dest="release", metavar="X.Y.Z",
        help="pin a release; default is the newest frozen release, never the "
             "development line",
    )
    parser.add_argument(
        "--manifest", metavar="PATH",
        help="resolve from a local manifest.json instead of the network",
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="sstim",
        description="Validate sensory-stimulation descriptions against a "
                    "published SSTIM profile.",
        epilog="SSTIM is at https://w3id.org/sstim. This is a client for it.",
    )
    parser.add_argument("-V", "--package-version", action="version",
                        version=f"sstim {__version__}")
    sub = parser.add_subparsers(dest="command", required=True)

    check = sub.add_parser(
        "validate",
        help="check a Turtle file against a profile",
        description="Three checks: SHACL conformance against that profile's own "
                    "shapes, every SSTIM term defined inside that profile's "
                    "closure, and nothing minted under the SSTIM namespace.",
    )
    check.add_argument("file", nargs="+", help="Turtle file(s) to check")
    check.add_argument("--offline", action="store_true",
                       help="fail rather than fetch anything not already cached")
    _shared(check)

    listing = sub.add_parser("profiles", help="list the profiles a release offers")
    listing.add_argument("--version", dest="release", metavar="X.Y.Z")
    listing.add_argument("--manifest", metavar="PATH")

    modules = sub.add_parser("modules", help="list what a profile pulls in")
    _shared(modules)

    sub.add_parser("cache", help="print the local cache directory")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)

    try:
        if args.command == "cache":
            print(cache_dir())
            return 0

        if args.command == "profiles":
            # Resolving any one profile parses the whole manifest, so this needs
            # a profile only as a way in.
            closure = resolve_profile(
                "core", version=args.release, manifest=args.manifest
            )
            print(f"SSTIM {closure.version} ({closure.status}) from {closure.source}")
            for name in PROFILES:
                try:
                    one = resolve_profile(
                        name, version=args.release, manifest=args.manifest
                    )
                except SstimError:
                    continue
                shapes = len(one.shape_modules) or "none"
                print(f"  {name:10} {len(one.semantic_modules):2} modules, "
                      f"shapes: {shapes}")
            return 0

        if args.command == "modules":
            closure = resolve_profile(
                args.profile, version=args.release, manifest=args.manifest
            )
            print(f"{closure.profile} at {closure.version_iri} "
                  f"({closure.status}), resolved from {closure.source}")
            for module in closure.modules:
                kind = "shapes" if module.is_shapes else "semantic"
                print(f"  {module.id:26} {kind:9} {module.url}")
            return 0

        # validate
        closure = resolve_profile(
            args.profile, version=args.release, manifest=args.manifest
        )
        failed = 0
        for path in args.file:
            report = validate(path, closure=closure, offline=args.offline)
            print(report)
            failed += 0 if report.ok else 1
        if failed:
            print(f"\n{failed} of {len(args.file)} file(s) failed", file=sys.stderr)
        return 1 if failed else 0

    except SstimError as error:
        print(f"sstim: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
