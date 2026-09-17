"""Check a file three ways against the profile it claims to fit.

SHACL conformance alone is not enough to tell an adopter their file is right,
for a reason that surprises people: **SHACL is silent about a term it has never
heard of.** Misspell a property, or use one that belongs to a module your
profile does not contain, and the shapes have nothing to say. The file
validates. A consumer loading that profile then sees a predicate it cannot
interpret, and the mistake surfaces in somebody else's pipeline instead of
yours.

So conformance is one of three checks here, and the other two are the ones that
catch what conformance cannot.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from pyshacl import validate as shacl_validate
from rdflib import Graph, URIRef

from ._resolve import Closure, SstimError, TERM_NAMESPACE, resolve_profile


@dataclass
class Report:
    """What the three checks found. Falsy unless all three passed."""

    source: str
    profile: str
    version: str
    version_iri: str
    conforms: bool = True
    violations: list[str] = field(default_factory=list)
    undefined: list[str] = field(default_factory=list)
    minted: list[str] = field(default_factory=list)
    development_line: bool = False

    @property
    def ok(self) -> bool:
        return self.conforms and not self.undefined and not self.minted

    def __bool__(self) -> bool:
        return self.ok

    def __str__(self) -> str:
        lines = [
            f"{self.source}",
            f"  profile {self.profile} at {self.version_iri}",
        ]
        if self.development_line:
            lines.append(
                "  WARNING  this is a development line, not a release. Anything "
                "you publish against it cannot be re-validated later."
            )
        lines.append(
            f"  {'ok    ' if self.conforms else 'FAILED'} SHACL conformance"
        )
        for violation in self.violations:
            lines.append(f"           {violation}")
        lines.append(
            f"  {'ok    ' if not self.undefined else 'FAILED'} every SSTIM term "
            f"is defined in the {self.profile} closure"
        )
        for term in self.undefined:
            lines.append(f"           not in this profile: {term}")
        lines.append(
            f"  {'ok    ' if not self.minted else 'FAILED'} nothing minted under "
            f"{TERM_NAMESPACE}"
        )
        for term in self.minted:
            lines.append(f"           minted: {term}")
        return "\n".join(lines)


def _as_graph(data: str | Path | Graph) -> tuple[Graph, str]:
    if isinstance(data, Graph):
        return data, "<graph>"
    text = str(data)
    if "\n" in text or text.lstrip().startswith("@prefix"):
        graph = Graph()
        graph.parse(data=text, format="turtle")
        return graph, "<string>"
    path = Path(text)
    if not path.is_file():
        raise SstimError(f"no such file: {path}")
    graph = Graph()
    graph.parse(path, format="turtle")
    return graph, str(path)


def validate(
    data: str | Path | Graph,
    *,
    profile: str = "core",
    version: str | None = None,
    manifest: str | Path | None = None,
    closure: Closure | None = None,
    offline: bool = False,
) -> Report:
    """Validate Turtle against one SSTIM profile.

    `data` is a path, a Turtle string, or an rdflib Graph. With no `version`,
    the newest frozen release is resolved, never the development line.
    """
    if closure is None:
        closure = resolve_profile(profile, version=version, manifest=manifest)

    graph, source = _as_graph(data)
    bodies = closure.read(offline=offline)

    semantic = Graph()
    for module in closure.semantic_modules:
        semantic.parse(data=bodies[module.id].decode("utf-8"), format="turtle")

    report = Report(
        source=source,
        profile=closure.profile,
        version=closure.version,
        version_iri=closure.version_iri,
        development_line=closure.is_development,
    )

    # Namespace discipline first. A minted SSTIM term is also, trivially, a term
    # the file itself defines, so it would slip past the containment check.
    subjects = {s for s in graph.subjects() if isinstance(s, URIRef)}
    report.minted = sorted(
        str(s) for s in subjects if str(s).startswith(TERM_NAMESPACE)
    )

    # Containment: an SSTIM term this profile does not contain.
    defined = set(semantic.subjects())
    used = {
        term
        for triple in graph
        for term in triple
        if isinstance(term, URIRef) and str(term).startswith(TERM_NAMESPACE)
    }
    report.undefined = sorted(str(t) for t in used - defined - subjects)

    # Conformance. Kernel publishes no shapes (it is a discovery entry point,
    # not a validation contract), so there is nothing to validate against and
    # saying so beats inventing a contract it does not have.
    shapes = closure.shape_modules
    if shapes:
        shape_graph = Graph()
        for module in shapes:
            shape_graph.parse(data=bodies[module.id].decode("utf-8"), format="turtle")
        conforms, _, text = shacl_validate(
            semantic + graph, shacl_graph=shape_graph, advanced=True, debug=False
        )
        report.conforms = conforms
        if not conforms:
            report.violations = [
                line.strip()
                for line in text.splitlines()
                if "Message:" in line or "Focus Node:" in line
            ]
    return report
