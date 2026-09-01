#!/usr/bin/env python3
"""Resolve the frozen BioPortal release context, or fail closed.

The stable registry artifact must never fall back to the mutable top-level
ontology tree.  This resolver is the single boundary used by Make and Pages:
it accepts only a stable SemVer selected by ``void.ttl``, an existing direct
snapshot child, and a released Full profile whose files still match the
snapshot manifest.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path, PurePosixPath

from rdflib import Graph, Literal, URIRef
from rdflib.namespace import OWL, RDF


ROOT_IRI = URIRef("https://w3id.org/sstim")
VOID_DATASET = URIRef("https://w3id.org/sstim/void")
VOID_DATASET_CLASS = URIRef("http://rdfs.org/ns/void#Dataset")
DCAT_DATASET_CLASS = URIRef("http://www.w3.org/ns/dcat#Dataset")
DCAT_VERSION = URIRef("http://www.w3.org/ns/dcat#version")
MOD_STATUS = URIRef("https://w3id.org/mod#status")
STABLE_VERSION = re.compile(
    r"^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)$"
)
MODULE_ID = re.compile(r"^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$")
SHA256 = re.compile(r"^[0-9a-f]{64}$")
LEDGER_RELATIVE = Path("scripts/bioportal-release-integrity.json")


class ReleaseContextError(RuntimeError):
    """The selected release cannot safely produce the registry artifact."""


def _strict_object(pairs: list[tuple[str, object]]) -> dict[str, object]:
    result: dict[str, object] = {}
    for key, value in pairs:
        if key in result:
            raise ReleaseContextError(f"duplicate JSON key {key!r}")
        result[key] = value
    return result


def _load_json(path: Path) -> dict[str, object]:
    try:
        value = json.loads(
            path.read_text(encoding="utf-8"), object_pairs_hook=_strict_object
        )
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise ReleaseContextError(f"{path}: cannot read strict JSON: {error}") from error
    if not isinstance(value, dict):
        raise ReleaseContextError(f"{path}: expected a JSON object")
    return value


def _parse_graph(path: Path, *, format: str) -> Graph:
    graph = Graph()
    try:
        graph.parse(path, format=format)
    except Exception as error:
        raise ReleaseContextError(
            f"{path}: cannot parse {format}: {type(error).__name__}: {error}"
        ) from error
    return graph


def _digest_frame(digest: object, label: bytes, payload: bytes) -> None:
    """Add an unambiguous labelled field to a hashlib-compatible digest."""

    digest.update(len(label).to_bytes(8, "big"))
    digest.update(label)
    digest.update(len(payload).to_bytes(8, "big"))
    digest.update(payload)


def _one_literal(
    graph: Graph,
    subject: URIRef | None,
    predicate: URIRef,
    *,
    label: str,
) -> Literal:
    values = set(graph.objects(subject, predicate))
    if len(values) != 1:
        raise ReleaseContextError(f"expected exactly one {label}, found {len(values)}")
    value = next(iter(values))
    if not isinstance(value, Literal):
        raise ReleaseContextError(f"{label} must be a literal")
    return value


@dataclass(frozen=True)
class ReleaseContext:
    root: Path
    version: str
    snapshot: Path
    manifest: Path
    modules: tuple[Path, ...]
    module_ids: tuple[str, ...]
    kernel: Path
    source_closure_sha256: str

    def relative(self, path: Path) -> str:
        return path.relative_to(self.root).as_posix()


def resolve_context(root: Path) -> ReleaseContext:
    root = root.resolve()
    ontology_root = (root / "static/ontology").resolve()
    void_path = ontology_root / "void.ttl"
    void_graph = _parse_graph(void_path, format="turtle")
    if (
        (VOID_DATASET, RDF.type, VOID_DATASET_CLASS) not in void_graph
        or (VOID_DATASET, RDF.type, DCAT_DATASET_CLASS) not in void_graph
    ):
        raise ReleaseContextError(
            f"{void_path}: {VOID_DATASET} must be both void:Dataset and dcat:Dataset"
        )
    version_literal = _one_literal(
        void_graph,
        VOID_DATASET,
        DCAT_VERSION,
        label=f"{VOID_DATASET} dcat:version",
    )
    if version_literal.language or version_literal.datatype:
        raise ReleaseContextError("void.ttl dcat:version must be a plain literal")
    version = str(version_literal)
    if STABLE_VERSION.fullmatch(version) is None:
        raise ReleaseContextError(
            f"void.ttl dcat:version {version!r} is not a stable X.Y.Z release"
        )

    unresolved_snapshot = ontology_root / version
    if unresolved_snapshot.is_symlink():
        raise ReleaseContextError(
            f"selected release {version} snapshot must not be a symlink"
        )
    snapshot = unresolved_snapshot.resolve()
    if (
        snapshot.parent != ontology_root
        or snapshot.name != version
        or not snapshot.is_dir()
    ):
        raise ReleaseContextError(
            f"selected release {version} has no direct frozen snapshot at {snapshot}"
        )
    unresolved_manifest = snapshot / "manifest.json"
    if unresolved_manifest.is_symlink():
        raise ReleaseContextError(
            f"{unresolved_manifest}: frozen snapshot manifest must not be a symlink"
        )
    manifest_path = unresolved_manifest.resolve()
    if manifest_path.parent != snapshot or not manifest_path.is_file():
        raise ReleaseContextError(
            f"selected release {version} has no direct frozen manifest at "
            f"{unresolved_manifest}"
        )
    manifest = _load_json(manifest_path)

    suite = manifest.get("suite")
    if not isinstance(suite, dict):
        raise ReleaseContextError(f"{manifest_path}: missing suite object")
    if suite.get("version") != version or suite.get("status") != "released":
        raise ReleaseContextError(
            f"{manifest_path}: suite must be released version {version}"
        )

    modules_value = manifest.get("modules")
    profiles_value = manifest.get("profiles")
    if not isinstance(modules_value, list) or not isinstance(profiles_value, list):
        raise ReleaseContextError(f"{manifest_path}: modules/profiles must be arrays")
    modules_by_id: dict[str, dict[str, object]] = {}
    for module in modules_value:
        if not isinstance(module, dict) or not isinstance(module.get("id"), str):
            raise ReleaseContextError(f"{manifest_path}: every module needs a string id")
        module_id = module["id"]
        if MODULE_ID.fullmatch(module_id) is None:
            raise ReleaseContextError(
                f"{manifest_path}: module id {module_id!r} is not canonical"
            )
        if module_id in modules_by_id:
            raise ReleaseContextError(f"{manifest_path}: duplicate module id {module_id}")
        modules_by_id[module_id] = module

    full_profiles = [
        profile
        for profile in profiles_value
        if isinstance(profile, dict) and profile.get("id") == "full"
    ]
    if len(full_profiles) != 1:
        raise ReleaseContextError(
            f"{manifest_path}: expected exactly one Full profile, found {len(full_profiles)}"
        )
    full = full_profiles[0]
    if full.get("version") != version or full.get("status") != "released":
        raise ReleaseContextError(
            f"{manifest_path}: Full profile must be released version {version}"
        )
    module_ids_value = full.get("modules")
    if (
        not isinstance(module_ids_value, list)
        or not module_ids_value
        or any(not isinstance(item, str) for item in module_ids_value)
        or len(set(module_ids_value)) != len(module_ids_value)
    ):
        raise ReleaseContextError(
            f"{manifest_path}: Full profile needs a nonempty unique module-id list"
        )
    module_ids = tuple(module_ids_value)
    if "core" not in module_ids:
        raise ReleaseContextError(f"{manifest_path}: Full profile omits the core module")

    paths: list[Path] = []
    seen_paths: set[Path] = set()
    closure = hashlib.sha256()
    kernel: Path | None = None
    for module_id in module_ids:
        module = modules_by_id.get(module_id)
        if module is None:
            raise ReleaseContextError(
                f"{manifest_path}: Full profile names unknown module {module_id}"
            )
        if module.get("version") != version:
            raise ReleaseContextError(
                f"{manifest_path}: module {module_id} is not version {version}"
            )
        release = module.get("release")
        if not isinstance(release, dict) or release.get("snapshot") is not True:
            raise ReleaseContextError(
                f"{manifest_path}: module {module_id} is not marked for snapshots"
            )
        source = module.get("source")
        if not isinstance(source, dict):
            raise ReleaseContextError(f"{manifest_path}: module {module_id} has no source")
        source_path = source.get("path")
        source_sha256 = source.get("sha256")
        if not isinstance(source_path, str) or not isinstance(source_sha256, str):
            raise ReleaseContextError(
                f"{manifest_path}: module {module_id} source path/hash is invalid"
            )
        relative = PurePosixPath(source_path)
        if relative.parent != PurePosixPath("static/ontology"):
            raise ReleaseContextError(
                f"{manifest_path}: module {module_id} source escapes the ontology root"
            )
        if SHA256.fullmatch(source_sha256) is None:
            raise ReleaseContextError(
                f"{manifest_path}: module {module_id} source SHA-256 is invalid"
            )
        frozen_path = (snapshot / relative.name).resolve()
        if frozen_path.parent != snapshot or not frozen_path.is_file():
            raise ReleaseContextError(
                f"{manifest_path}: frozen module {module_id} is missing at {frozen_path}"
            )
        if frozen_path in seen_paths:
            raise ReleaseContextError(
                f"{manifest_path}: more than one module resolves to {frozen_path}"
            )
        seen_paths.add(frozen_path)
        actual_sha256 = hashlib.sha256(frozen_path.read_bytes()).hexdigest()
        if actual_sha256 != source_sha256:
            raise ReleaseContextError(
                f"{frozen_path}: SHA-256 {actual_sha256} != manifest {source_sha256}"
            )
        paths.append(frozen_path)
        _digest_frame(closure, b"module-id", module_id.encode("utf-8"))
        _digest_frame(closure, b"source-sha256", source_sha256.encode("ascii"))
        if module_id == "core":
            kernel = frozen_path

    assert kernel is not None
    kernel_graph = _parse_graph(kernel, format="turtle")
    if (ROOT_IRI, RDF.type, OWL.Ontology) not in kernel_graph:
        raise ReleaseContextError(f"{kernel}: missing root owl:Ontology declaration")
    kernel_version = _one_literal(
        kernel_graph, ROOT_IRI, OWL.versionInfo, label="Kernel owl:versionInfo"
    )
    if kernel_version.language or kernel_version.datatype or str(kernel_version) != version:
        raise ReleaseContextError(
            f"{kernel}: owl:versionInfo must be the plain literal {version!r}"
        )
    version_iris = set(kernel_graph.objects(ROOT_IRI, OWL.versionIRI))
    expected_version_iri = URIRef(f"{ROOT_IRI}/{version}")
    if version_iris != {expected_version_iri}:
        raise ReleaseContextError(
            f"{kernel}: owl:versionIRI must be {expected_version_iri}"
        )
    statuses = set(kernel_graph.objects(ROOT_IRI, MOD_STATUS))
    status = next(iter(statuses)) if len(statuses) == 1 else None
    if not isinstance(status, Literal) or str(status) != "released":
        raise ReleaseContextError(f"{kernel}: mod:status must be the literal released")

    return ReleaseContext(
        root=root,
        version=version,
        snapshot=snapshot,
        manifest=manifest_path,
        modules=tuple(paths),
        module_ids=module_ids,
        kernel=kernel,
        source_closure_sha256=closure.hexdigest(),
    )


def _ledger_sha256(root: Path, version: str) -> str:
    ledger_path = root / LEDGER_RELATIVE
    ledger = _load_json(ledger_path)
    if type(ledger.get("schemaVersion")) is not int or ledger["schemaVersion"] != 1:
        raise ReleaseContextError(f"{ledger_path}: expected integer schemaVersion 1")
    releases = ledger.get("releases")
    if not isinstance(releases, dict) or not isinstance(releases.get(version), dict):
        raise ReleaseContextError(f"{ledger_path}: no integrity record for {version}")
    sha256 = releases[version].get("sha256")
    if not isinstance(sha256, str) or SHA256.fullmatch(sha256) is None:
        raise ReleaseContextError(f"{ledger_path}: invalid byte SHA-256 for {version}")
    return sha256


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="repository root (default: inferred from this script)",
    )
    parser.add_argument(
        "--field",
        choices=(
            "release",
            "snapshot",
            "manifest",
            "modules",
            "module-count",
            "kernel",
            "source-closure-sha256",
            "sha256",
        ),
        help="print one validated context field",
    )
    parser.add_argument(
        "--write-source",
        type=Path,
        help="concatenate the validated frozen Full semantic modules to this file",
    )
    parser.add_argument(
        "--github-output",
        type=Path,
        help="append validated release and ledger SHA-256 outputs for GitHub Actions",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        context = resolve_context(args.root)
        if args.write_source is not None:
            args.write_source.parent.mkdir(parents=True, exist_ok=True)
            args.write_source.write_bytes(
                b"".join(module.read_bytes() for module in context.modules)
            )
        if args.github_output is not None:
            sha256 = _ledger_sha256(context.root, context.version)
            with args.github_output.open("a", encoding="utf-8", newline="\n") as output:
                output.write(f"release={context.version}\n")
                output.write(f"sha256={sha256}\n")
        if args.field is not None:
            values = {
                "release": context.version,
                "snapshot": context.relative(context.snapshot),
                "manifest": context.relative(context.manifest),
                "modules": " ".join(context.relative(path) for path in context.modules),
                "module-count": str(len(context.modules)),
                "kernel": context.relative(context.kernel),
                "source-closure-sha256": context.source_closure_sha256,
            }
            if args.field == "sha256":
                print(_ledger_sha256(context.root, context.version))
            else:
                print(values[args.field])
        elif args.write_source is None and args.github_output is None:
            print(
                f"bioportal-release: frozen {context.version}, "
                f"{len(context.modules)} Full-profile modules, "
                f"closure {context.source_closure_sha256}"
            )
    except (ReleaseContextError, OSError, ValueError) as error:
        print(f"bioportal-release: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
