#!/usr/bin/env python3
"""Give every frozen release its JSON-LD, RDF/XML and page at deploy (GB-09).

    python3 scripts/publish-release-serializations.py [dist-ontology-dir]

A frozen release is published as Turtle only: the build copies
static/ontology/<version>/ into the site, and until 2026-10-06 nothing derived
anything else for it. Only `latest/` had the other serializations (ADR 0055), so
a release cited by its version IRI, which CURRENT_STATE advises for published
work, could be fetched in Turtle and nothing else, and a browser following the
citation was handed a Turtle file.

For every frozen release this writes, beside the Turtle in the deployed site:

- the JSON-LD and RDF/XML of the document its version IRI denotes, each parsed
  back and required to be isomorphic with the Turtle, as `export-ontology.py`
  does for the live modules. That document is the namespace catalogue for a
  modular release, and the Kernel file for the twelve before 0.13.0, which
  predate the manifest and whose version IRI the w3id rules resolve to it;
- `index.html`, the release's page, which the version IRI sends a browser to:
  the snapshot's own frozen README rendered, after links to the version document
  in all three formats and to every file the release froze.

Only the version document is serialized, not every file in the release.
Deriving all 428 files took 51 minutes on 2026-10-06, nearly all of it rdflib
proving isomorphism for the shapes files (535 blank nodes, 21 s per format for
0.18.0 alone, longer for older releases), on every deploy, for bytes that never
change. The version IRI is what a citation names; a single module of a frozen
release stays Turtle, while `latest/` keeps every module in every format.

It writes into the deployed copy only, never into static/. The decision of
2026-08-29 (TODO.md) not to commit derived exports stands: freezing them would
triple every snapshot with bytes that can be derived. And it finishes by
proving it left every frozen file byte-identical to its committed original,
since a release that changed under its own version IRI would be worse than one
that answered in one format only.
"""

from __future__ import annotations

import html
import re
import sys
from pathlib import Path

try:
    import markdown
    from rdflib import Graph
    from rdflib.compare import isomorphic
except ImportError:
    sys.exit("publish-release-serializations: rdflib and markdown are required; run inside `nix develop`.")

REPO_ROOT = Path(__file__).resolve().parent.parent
STATIC_ONTOLOGY = REPO_ROOT / "static" / "ontology"
KERNEL = STATIC_ONTOLOGY / "sstim-core.ttl"
RELEASE_DIR = re.compile(r"^\d+\.\d+\.\d+$")
# The flat "xml" writer round-trips RDF collections, as export-ontology.py notes.
FORMATS = {"json-ld": "jsonld", "xml": "rdf"}
NAMESPACE = "https://w3id.org/sstim"


def frozen_releases(ontology_dir: Path = STATIC_ONTOLOGY) -> list[str]:
    return sorted(
        (entry.name for entry in ontology_dir.iterdir() if entry.is_dir() and RELEASE_DIR.match(entry.name)),
        key=lambda name: tuple(int(part) for part in name.split(".")),
    )


def version_document(release_dir: Path) -> Path:
    """The Turtle a release's version IRI resolves to (scripts/sstim-w3id-snapshot-routes.mjs)."""
    if (release_dir / "manifest.json").is_file():
        return release_dir / "sstim-namespace.ttl"
    return release_dir / "sstim-core.ttl"


def concept_doi(kernel: Path = KERNEL) -> str:
    """The all-versions DOI, as the Kernel states it, so the page cannot disagree with it."""
    match = re.search(r'dct:identifier\s+"(10\.\d+/[^"]+)"', kernel.read_text(encoding="utf-8"))
    if not match:
        raise SystemExit(f"publish-release-serializations: no concept DOI (dct:identifier) in {kernel}")
    return match.group(1)


PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SSTIM {version}</title>
<meta name="description" content="SSTIM {version}, a frozen release of the Sensory Stimulation Vocabulary.">
<link rel="alternate" type="text/turtle" href="{stem}.ttl">
<link rel="alternate" type="application/ld+json" href="{stem}.jsonld">
<link rel="alternate" type="application/rdf+xml" href="{stem}.rdf">
<style>
:root {{ color-scheme: light dark; --ink: #1d1d1f; --muted: #5f6368; --rule: #d6d6d6; --bg: #ffffff; --link: #0b57d0; }}
@media (prefers-color-scheme: dark) {{
  :root {{ --ink: #e8e8ea; --muted: #a8abb0; --rule: #3a3b3e; --bg: #151618; --link: #8ab4f8; }}
}}
body {{ margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; }}
main {{ max-width: 46rem; margin: 0 auto; padding: 2.5rem 1rem 4rem; }}
a {{ color: var(--link); }}
code {{ font: 0.9em ui-monospace, SFMono-Regular, Menlo, monospace; overflow-wrap: anywhere; }}
.eyebrow {{ color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.8rem; margin: 0; }}
h1 {{ margin: 0.2rem 0 1rem; font-size: 2rem; line-height: 1.2; }}
.facts {{ border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule); padding: 0.5rem 0; margin: 1.5rem 0; }}
.facts p {{ margin: 0.5rem 0; }}
ul.files {{ columns: 2 16rem; padding-left: 1.2rem; }}
.readme {{ border-top: 1px solid var(--rule); margin-top: 2rem; padding-top: 0.5rem; }}
</style>
</head>
<body>
<main>
<p class="eyebrow">Frozen release</p>
<h1>SSTIM {version}</h1>
<p>A frozen release of the Sensory Stimulation Vocabulary. Its files never change.
The latest release is at <a href="{namespace}">{namespace}</a>.</p>
<div class="facts">
<p>Version IRI: <code>{namespace}/{version}</code></p>
<p>The release as one document: <a href="{stem}.ttl">Turtle</a>,
<a href="{stem}.jsonld">JSON-LD</a>, <a href="{stem}.rdf">RDF/XML</a>.</p>
<p>Every version is archived on Zenodo under the concept DOI
<a href="https://doi.org/{doi}">{doi}</a>.</p>
</div>
<h2>Files in this release</h2>
<ul class="files">
{files}
</ul>
<div class="readme">
{readme}
</div>
</main>
</body>
</html>
"""


def release_page(release_dir: Path, doi: str) -> str:
    version = release_dir.name
    frozen = sorted(
        path.name for path in release_dir.iterdir()
        if path.is_file() and path.suffix in {".ttl", ".json"}
    )
    readme_path = release_dir / "README.md"
    readme = markdown.markdown(readme_path.read_text(encoding="utf-8")) if readme_path.is_file() else ""
    # The page has its own h1, so the README's headings move down a level.
    readme = re.sub(r"<(/?)h([1-5])\b", lambda m: f"<{m.group(1)}h{int(m.group(2)) + 1}", readme)
    return PAGE.format(
        version=html.escape(version),
        stem=html.escape(version_document(release_dir).stem),
        namespace=NAMESPACE,
        doi=html.escape(doi),
        files="\n".join(f'<li><a href="{html.escape(name)}">{html.escape(name)}</a></li>' for name in frozen),
        readme=readme,
    )


def publish(dist_ontology: Path) -> tuple[int, int]:
    """Write and verify each release's serializations and page; return (releases, files written)."""
    releases = frozen_releases()
    if not releases:
        raise SystemExit(f"publish-release-serializations: no frozen release under {STATIC_ONTOLOGY}")
    doi = concept_doi()
    written = 0
    for version in releases:
        target = dist_ontology / version
        if not target.is_dir():
            raise SystemExit(
                f"publish-release-serializations: {target} is missing; the build copies "
                f"static/ontology/{version}/ there, so run this after the build"
            )
        turtle = version_document(target)
        if not turtle.is_file():
            raise SystemExit(f"publish-release-serializations: {turtle} is missing; nothing for {version}'s IRI to serve")
        graph = Graph().parse(turtle, format="turtle")
        for rdf_format, extension in FORMATS.items():
            dest = turtle.with_suffix(f".{extension}")
            graph.serialize(destination=str(dest), format=rdf_format, auto_compact=True)
            if not isomorphic(graph, Graph().parse(dest, format=rdf_format)):
                raise SystemExit(f"publish-release-serializations: {dest} does not round-trip isomorphically")
            written += 1
        (target / "index.html").write_text(release_page(STATIC_ONTOLOGY / version, doi), encoding="utf-8")
        written += 1
    return len(releases), written


def verify_frozen_files(dist_ontology: Path) -> int:
    """Every frozen file in the site is byte-identical to the committed one."""
    checked = 0
    for version in frozen_releases():
        for original in sorted(path for path in (STATIC_ONTOLOGY / version).iterdir() if path.is_file()):
            published = dist_ontology / version / original.name
            if not published.is_file() or published.read_bytes() != original.read_bytes():
                raise SystemExit(
                    f"publish-release-serializations: {published} differs from the frozen "
                    f"{version} release; a version IRI must keep serving the bytes it was cut with"
                )
            checked += 1
    return checked


def main() -> int:
    dist_ontology = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else REPO_ROOT / "dist" / "ontology"
    releases, written = publish(dist_ontology)
    checked = verify_frozen_files(dist_ontology)
    print(
        f"publish-release-serializations: {written} files for {releases} frozen releases (each "
        f"version document in JSON-LD and RDF/XML, isomorphic with its Turtle, and the release's "
        f"page); {checked} frozen files unchanged"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
