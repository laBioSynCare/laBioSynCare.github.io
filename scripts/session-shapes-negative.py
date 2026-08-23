#!/usr/bin/env python3
"""Assert the session SHACL-SPARQL constraints actually reject what they claim to.

Three constraints added by ADR 0048 relate one value to another, which no
property shape can express:

    - an observation carries a value if and only if its state is 'supplied'
    - delivered duration never exceeds elapsed duration
    - a configuration digest names the algorithm that produced it

They are the only guards for the contradictions the model exists to prevent, and
they are invisible to every other check in the suite. `rdf-validate-shacl`, which
runs the projection conformance tests beside their producer, has no
SPARQLConstraintComponent validator and strips sh:sparql before validating; the
positive suites only prove that conforming data conforms, which a constraint that
never fires would also allow.

So this asserts the negative: each fixture below must be rejected, with that
constraint's own message. A constraint deleted, misspelled, or broken by a
prefix change fails here instead of silently passing everything.

Fixtures are inline rather than committed under static/ontology/: they are
deliberately invalid, and nothing invalid belongs in the published term space.
"""

from pathlib import Path
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SHAPES = ROOT / "static" / "ontology" / "sstim-shapes.ttl"

PREAMBLE = """
@prefix sstim:   <https://w3id.org/sstim#> .
@prefix sstim-v: <https://w3id.org/sstim/vocab#> .
@prefix ex:      <https://w3id.org/sstim/implementation/bsclab/session/> .
@prefix xsd:     <http://www.w3.org/2001/XMLSchema#> .
"""

CASES = [
    (
        "declined answer that carries a value",
        """
        ex:negative-1 a sstim:ParticipantObservation ;
            sstim:hasObservationRole sstim-v:roleFocus ;
            sstim:hasResponseState sstim-v:responseDeclined ;
            sstim:observedOrdinalValue 4 .
        """,
        "response state is 'supplied'",
    ),
    (
        "supplied answer that carries nothing",
        """
        ex:negative-2 a sstim:ParticipantObservation ;
            sstim:hasObservationRole sstim-v:roleFocus ;
            sstim:hasResponseState sstim-v:responseSupplied .
        """,
        "response state is 'supplied'",
    ),
    (
        "not-asked unwanted-experience block that still reports one",
        """
        ex:negative-3 a sstim:ParticipantObservation ;
            sstim:hasObservationRole sstim-v:roleUnwantedExperienceReport ;
            sstim:hasResponseState sstim-v:responseNotAsked ;
            sstim:reportsUnwantedExperience ex:negative-3-ue .

        ex:negative-3-ue a sstim:UnwantedExperienceObservation ;
            sstim:hasExperienceCategory sstim-v:experienceEyeStrain ;
            sstim:hasReportedSeverity sstim-v:severityMild ;
            sstim:hasOnsetPhase sstim-v:onsetDuringSession ;
            sstim:hasPerceivedRelatedness sstim-v:relatednessUnknown .
        """,
        "response state is 'supplied'",
    ),
    (
        "session delivering more stimulus than it ran",
        """
        ex:negative-4 a sstim:SessionInstance ;
            sstim:actualDurationSeconds 100 ;
            sstim:deliveredDurationSeconds 500.0 .
        """,
        "cannot deliver more stimulus than it ran",
    ),
    (
        "digest with no algorithm to recompute it",
        """
        ex:negative-5 a sstim:SessionSpecification ;
            sstim:configurationDigest "32e114684d8a8e9d03a2a45d85b004d0aa9ddf21bfcc19b35bdf49b0e62ab79e" .
        """,
        "name the algorithm that produced it",
    ),
    (
        "experience with no participant-perceived relatedness",
        """
        ex:negative-6 a sstim:UnwantedExperienceObservation ;
            sstim:hasExperienceCategory sstim-v:experienceNausea ;
            sstim:hasReportedSeverity sstim-v:severityModerate ;
            sstim:hasOnsetPhase sstim-v:onsetDuringSession .
        """,
        "participant-perceived relatedness",
    ),
]


def validate(turtle: str) -> str:
    """Run pySHACL over one fixture and return its report."""
    with tempfile.NamedTemporaryFile("w", suffix=".ttl", delete=False) as handle:
        handle.write(PREAMBLE + turtle)
        data_path = handle.name
    try:
        result = subprocess.run(
            [sys.executable, "-m", "pyshacl", "-s", str(SHAPES), data_path],
            capture_output=True,
            text=True,
        )
        return result.stdout + result.stderr
    finally:
        Path(data_path).unlink(missing_ok=True)


def main() -> int:
    failures = []
    for label, turtle, expected in CASES:
        report = validate(turtle)
        if "Conforms: False" not in report:
            failures.append(f"{label}: accepted, but must be rejected")
        elif expected not in report:
            failures.append(
                f"{label}: rejected, but not by its own constraint "
                f"(expected a message containing {expected!r})"
            )

    if failures:
        print(f"session-shapes-negative: FAILED ({len(failures)})")
        for failure in failures:
            print(f"  - {failure}")
        return 1

    print(f"session-shapes-negative: passed ({len(CASES)} contradictions rejected)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
