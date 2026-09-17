"""Resolve an SSTIM profile closure from a manifest, never from a directory listing.

The manifest is the authoritative answer to "which files make up this profile".
A directory listing is not: it cannot distinguish a semantic module from a shape
module, it says nothing about dependency order, and it happily includes files a
profile does not contain. Reconstructing a closure by listing is the documented
way to get this wrong, so this module has no code path that can.

Two traps are handled here on the adopter's behalf.

**The stable manifest route serves the development line.**
`https://w3id.org/sstim/manifest` answers with the mutable line (a `-dev`
version, status `development`), while the RDF at `https://w3id.org/sstim`
answers with the newest frozen release. Someone who fetches the first and
believes they pinned something has pinned nothing. So an unpinned call here
resolves the release: read `owl:versionIRI` from the stable IRI, then fetch that
version's manifest.

**A fetch is not a guarantee.** Every module the manifest lists carries a
sha256, and the bytes served are checked against it. A truncated download, a
proxy that helpfully rewrote something, or a substituted file fails loudly
instead of validating the user's data against a graph that is not SSTIM.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import hashlib
import json
import os
import re
import urllib.request

STABLE_IRI = "https://w3id.org/sstim"
TERM_NAMESPACE = "https://w3id.org/sstim"
VERSION_IRI = re.compile(r"owl:versionIRI\s+<https://w3id\.org/sstim/([0-9]+\.[0-9]+\.[0-9]+)>")
USER_AGENT = "sstim-python (+https://w3id.org/sstim)"
TIMEOUT = 60


class SstimError(RuntimeError):
    """Anything that should stop an adopter rather than be worked around."""


@dataclass(frozen=True)
class Module:
    """One module of a profile closure, with the bytes it is supposed to have."""

    id: str
    url: str
    sha256: str
    graph_iri: str | None
    is_shapes: bool


def _fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
            return response.read()
    except Exception as error:  # network, TLS, HTTP, DNS: all the same to a caller
        raise SstimError(f"could not fetch {url}: {error}") from error


def latest_release() -> str:
    """The newest frozen release, read from the stable IRI rather than assumed.

    Deliberately not a constant in this file. A pinned default would go stale
    the day after a release and would be wrong in the direction nobody checks.
    """
    document = _fetch(STABLE_IRI).decode("utf-8", errors="replace")
    match = VERSION_IRI.search(document)
    if not match:
        raise SstimError(
            f"{STABLE_IRI} served a document declaring no owl:versionIRI, so the "
            "current release could not be determined. Pass an explicit version."
        )
    return match.group(1)


def cache_dir() -> Path:
    base = os.environ.get("XDG_CACHE_HOME") or (Path.home() / ".cache")
    return Path(base) / "sstim"


def _cached(url: str, sha256: str, *, offline: bool = False) -> bytes:
    """Return the bytes for a module, from cache when they are already correct.

    The cache is keyed by checksum, so a cache entry cannot be stale: if the
    manifest asks for different bytes, it is a different key.
    """
    path = cache_dir() / sha256[:2] / sha256
    if path.is_file():
        body = path.read_bytes()
        if hashlib.sha256(body).hexdigest() == sha256:
            return body
    if offline:
        raise SstimError(f"offline, and {url} is not cached")

    body = _fetch(url)
    actual = hashlib.sha256(body).hexdigest()
    if actual != sha256:
        raise SstimError(
            f"{url} served bytes the manifest does not describe.\n"
            f"  manifest sha256: {sha256}\n"
            f"  served sha256:   {actual}\n"
            "Refusing to continue: validating against an unverified graph would "
            "report conformance to something that is not SSTIM."
        )
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(body)
    except OSError:
        pass  # an unwritable cache is a slow run, not a failure
    return body


@dataclass
class Closure:
    """A profile's modules, resolved and ready to load."""

    profile: str
    version: str
    status: str
    modules: list[Module]
    source: str
    local_root: Path | None = None

    @property
    def shape_modules(self) -> list[Module]:
        return [m for m in self.modules if m.is_shapes]

    @property
    def semantic_modules(self) -> list[Module]:
        return [m for m in self.modules if not m.is_shapes]

    @property
    def version_iri(self) -> str:
        return f"{STABLE_IRI}/{self.version}"

    @property
    def is_development(self) -> bool:
        return self.status != "released" or self.version.endswith("-dev")

    def read(self, *, offline: bool = False) -> dict[str, bytes]:
        """Fetch every module, checksum-verified, keyed by module id."""
        if self.local_root is not None:
            return {
                m.id: (self.local_root / m.url).read_bytes() for m in self.modules
            }
        return {m.id: _cached(m.url, m.sha256, offline=offline) for m in self.modules}


def _load_manifest(version: str | None, manifest: str | Path | None) -> tuple[dict, str, Path | None]:
    if manifest is not None:
        path = Path(manifest)
        if not path.is_file():
            raise SstimError(f"no manifest at {path}")
        return json.loads(path.read_text(encoding="utf-8")), str(path), path.parent

    resolved = version or latest_release()
    url = f"{STABLE_IRI}/{resolved}/manifest"
    return json.loads(_fetch(url).decode("utf-8")), url, None


def resolve_profile(
    profile: str = "core",
    *,
    version: str | None = None,
    manifest: str | Path | None = None,
) -> Closure:
    """Resolve one profile's closure.

    With no version, the newest frozen release is used, not the development
    line. Pass `manifest=` to resolve against a local checkout or a frozen
    release directory, which needs no network at all.
    """
    document, source, root = _load_manifest(version, manifest)
    suite = document.get("suite", {})
    profiles = {p["id"]: p for p in document.get("profiles", [])}
    if profile not in profiles:
        raise SstimError(
            f"no profile '{profile}' in {source}. "
            f"Available: {', '.join(sorted(profiles))}"
        )

    entry = profiles[profile]
    modules = {m["id"]: m for m in document.get("modules", [])}
    resolved: list[Module] = []
    for module_id in list(entry.get("modules", [])) + list(entry.get("shapeModules", [])):
        record = modules.get(module_id)
        if record is None:
            raise SstimError(f"manifest lists module '{module_id}' it does not define")
        publication = record.get("publication", {})
        runtime = record.get("runtime", {})
        resolved.append(
            Module(
                id=module_id,
                url=runtime.get("url") if root is not None else publication.get("versionedUrl"),
                sha256=record.get("source", {}).get("sha256", ""),
                graph_iri=runtime.get("graphIri"),
                is_shapes=module_id in entry.get("shapeModules", []),
            )
        )

    return Closure(
        profile=profile,
        version=suite.get("version", "unknown"),
        status=suite.get("status", "unknown"),
        modules=resolved,
        source=source,
        local_root=root,
    )
