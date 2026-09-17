#!/usr/bin/env python3
"""Prove the adopter examples are what they say they are.

`examples/` exists to be copied by somebody who has not read the specification.
That makes its header comments load-bearing in a way ordinary documentation is
not: a file that announces "sstim-profile: core" and then uses a Full-profile
term teaches the reader that the profile boundary is decorative, and they will
find out otherwise from a consumer that loaded only Core.

So each example is checked three ways against the profile it declares.

**Conformance.** The example plus that profile's module closure must satisfy
that profile's shape graph. Core is validated against the Core shapes, not the
Full ones, because validating everything against Full would hide exactly the
question a profile claim raises.

**Containment.** Every SSTIM IRI the example uses must be defined inside the
declared closure. This is the check that a comment cannot fake and that
`shacl-instances` does not make: SHACL is silent about a term it has never
heard of, so an undefined predicate validates perfectly.

**Namespace discipline.** No example may mint an IRI under https://w3id.org/sstim.
Reuse the terms, mint your records under your own namespace. It is the first
rule an adopter can break and the most expensive one to undo, so the starter
set is held to it mechanically.
"""

from __future__ import annotations

from pathlib import Path
import json
import re
import subprocess
import sys

from pyshacl import validate as shacl_validate
from rdflib import Graph, URIRef

ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = ROOT / "examples"
MANIFEST_CLI = ["node", str(ROOT / "scripts" / "sstim-manifest.mjs")]

PROFILES = ("kernel", "core", "core-plus", "full")
TERM_NAMESPACE = "https://w3id.org/sstim"
PROFILE_HEADER = re.compile(r"^#\s*sstim-profile:\s*([a-z-]+)\s*$", re.MULTILINE)


def declared_profile(name: str, text: str) -> str:
    """Read the profile the example claims, from its own header comment."""
    match = PROFILE_HEADER.search("\n".join(text.splitlines()[:25]))
    if not match:
        raise SystemExit(
            f"examples-check: {name} declares no profile. "
            f"Add '# sstim-profile: <{'|'.join(PROFILES)}>' to its header."
        )
    profile = match.group(1)
    if profile not in PROFILES:
        raise SystemExit(f"examples-check: {name} declares unknown profile '{profile}'.")
    return profile


def profile_files(profile: str) -> list[Path]:
    out = subprocess.run(
        MANIFEST_CLI + ["files", profile, "--with-shapes", "--json"],
        capture_output=True, text=True, check=True, cwd=ROOT,
    )
    return [ROOT / rel for rel in json.loads(out.stdout)]


def load(paths: list[Path]) -> Graph:
    graph = Graph()
    for path in paths:
        graph.parse(path, format="turtle")
    return graph


def check(name: str, text: str) -> list[str]:
    """Return this example's failures; an empty list is a pass."""
    profile = declared_profile(name, text)
    files = profile_files(profile)
    shapes = [f for f in files if f.name.endswith("-shapes.ttl")]
    modules = [f for f in files if f not in shapes]

    example = Graph()
    example.parse(data=text, format="turtle")
    closure = load(modules)
    failures = []

    # 1. Namespace discipline, before anything else: a minted SSTIM term would
    #    also pass containment, because the example itself defines it.
    minted = sorted(
        str(s) for s in set(example.subjects())
        if isinstance(s, URIRef) and str(s).startswith(TERM_NAMESPACE)
    )
    if minted:
        failures.append(
            f"{name}: mints {len(minted)} IRI(s) under {TERM_NAMESPACE}: "
            + ", ".join(minted[:5])
        )

    # 2. Containment. SHACL never complains about a predicate it does not know,
    #    so an example can conform perfectly while using terms the profile a
    #    consumer loaded does not contain.
    defined = set(closure.subjects())
    used = {
        term for triple in example for term in triple
        if isinstance(term, URIRef) and str(term).startswith(TERM_NAMESPACE)
    }
    undefined = sorted(str(t) for t in used - defined - set(example.subjects()))
    if undefined:
        failures.append(
            f"{name}: uses {len(undefined)} term(s) outside the '{profile}' "
            f"closure: " + ", ".join(undefined)
        )

    # 3. Conformance against that profile's own shapes. Kernel publishes none
    #    (ADR 0045: it is a discovery entry point, not a validation contract),
    #    so there is nothing to validate against and saying so beats inventing
    #    a contract it does not have. The two checks above still applied.
    if shapes:
        conforms, _, report = shacl_validate(
            closure + example, shacl_graph=load(shapes), advanced=True, debug=False,
        )
        if not conforms:
            detail = "\n".join(
                line for line in report.splitlines()
                if "Message:" in line or "Focus Node:" in line
            )
            failures.append(f"{name}: does not conform to '{profile}' shapes\n{detail}")

    return failures


# Each fixture must fail, and must fail for its own reason. Without these, a
# gate that silently stopped checking would keep printing "passed" over a
# starter set that had quietly rotted, and the starter set is the one artifact
# here that strangers copy without reading anything else first.
NEGATIVE_FIXTURES = (
    (
        "mints a term in the SSTIM namespace",
        """# sstim-profile: core
@prefix sstim: <https://w3id.org/sstim#> .
@prefix rdfs:  <http://www.w3.org/2000/01/rdf-schema#> .
<https://w3id.org/sstim#MyOwnClass> a sstim:StimulusSpecification ;
    rdfs:label "Minted in someone else's namespace"@en ;
    sstim:stimulusRegime "determinate" .
""",
        "mints",
    ),
    (
        "declares core, uses a Core Plus term",
        """# sstim-profile: core
@prefix ex:    <https://example.org/stimuli/> .
@prefix sstim: <https://w3id.org/sstim#> .
@prefix rdfs:  <http://www.w3.org/2000/01/rdf-schema#> .
ex:spec a sstim:StimulusSpecification ;
    rdfs:label "Claims Core, reaches into Common"@en ;
    sstim:stimulusRegime "determinate" ;
    sstim:hasSignal ex:signal .
ex:signal a sstim:StimulationSignal ;
    sstim:hzMin 10.0 .
""",
        "outside the 'core' closure",
    ),
    (
        "violates the shape it claims to satisfy",
        """# sstim-profile: core
@prefix ex:    <https://example.org/stimuli/> .
@prefix sstim: <https://w3id.org/sstim#> .
@prefix rdfs:  <http://www.w3.org/2000/01/rdf-schema#> .
ex:spec a sstim:StimulusSpecification ;
    rdfs:label "No regime, and no regime means no reading of the rest"@en .
""",
        "does not conform",
    ),
)


def self_test() -> list[str]:
    """Prove the three checks reject what they claim to."""
    failures = []
    for name, text, expected in NEGATIVE_FIXTURES:
        found = check(name, text)
        blob = " ".join(found)
        if not found:
            failures.append(f"negative fixture passed but must fail: {name}")
        elif expected not in blob:
            failures.append(
                f"negative fixture '{name}' failed for the wrong reason: "
                f"expected {expected!r}, got {blob!r}"
            )
    return failures


def main() -> int:
    examples = sorted(EXAMPLES.glob("*.ttl"))
    if not examples:
        print(
            "examples-check: FAILED. No examples found, and an empty starter set "
            "passes every check and helps nobody.", file=sys.stderr,
        )
        return 1

    failures = []
    for path in examples:
        text = path.read_text(encoding="utf-8")
        found = check(path.name, text)
        profile = declared_profile(path.name, text)
        note = "" if profile != "kernel" else ", shapeless profile: not validated"
        print(f"  {'FAILED' if found else 'ok':6} {path.name} ({profile}{note})")
        failures.extend(found)

    negative = self_test()
    print(f"  {'FAILED' if negative else 'ok':6} "
          f"{len(NEGATIVE_FIXTURES)} negative fixtures rejected")
    failures.extend(negative)

    if failures:
        print("\nexamples-check: FAILED", file=sys.stderr)
        for failure in failures:
            print(f"  {failure}", file=sys.stderr)
        return 1

    print(f"examples-check: passed ({len(examples)} examples conform, are "
          f"contained by their declared profile, and mint nothing under SSTIM; "
          f"{len(NEGATIVE_FIXTURES)} negative fixtures rejected)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
