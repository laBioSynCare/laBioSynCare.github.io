#!/usr/bin/env python3
"""Make the SSTIM preset schema, the SHACL shapes, and the parameter ranges agree.

Audit finding KR-07: "patch and preset validation is weaker than the
reproducibility claim". The disposition is to derive a parameter matrix from the
executable schema and then make JSON Schema, SHACL, application validation and
documentation agree.

Three artifacts, and the relationship between them is not symmetric:

    static/schemas/preset.schema.json   SSTIM's own preset contract
    static/ontology/sstim-shapes.ttl    the RDF contract for the same parameters
    docs/technical/PRESET_FORMAT.md     the BioSynCare catalog format

The third is an *input*, not an authority. That format is one application's,
audio-only, grown incrementally around delivery problems it had to solve. SSTIM
takes its numeric parameter ranges — those are DSP and comfort facts, and they
were dearly won — and takes nothing else: not its field names, not its envelope,
not its product taxonomy. Where SSTIM's schema names a parameter differently or
structures a preset differently, that is the design, not drift, and the mapping
below records the correspondence explicitly so the ranges can still be checked.

The matrix itself is not written down as a fourth copy of the numbers, because a
hand-maintained table of bounds drifts silently. Only the *correspondence*
between an SSTIM parameter, an SSTIM property and a catalog field is written
here, since no artifact states it. Every number is read from an artifact, so a
bound can be changed in one place and this fails until the others follow.

Four checks:

    1. every mapped parameter's bounds agree across all three artifacts
    2. positive SSTIM presets validate, and adversarial ones are rejected by the
       schema, one rule at a time
    3. the cross-field rules JSON Schema cannot express — beat frequency, pulse
       rate, breath reference, level rationale, unique ids — are enforced by
       validate_preset() here, the application-validation leg, and each has an
       adversarial fixture
    4. adversarial RDF presets are rejected by SHACL, one rule at a time,
       including the three cross-field rules KR-07 named as missing
"""

from __future__ import annotations

import json
from pathlib import Path
import re
import sys

from jsonschema import Draft202012Validator
from pyshacl import validate as shacl_validate
from rdflib import Graph, Namespace, BNode, RDF
from rdflib.namespace import SKOS

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = ROOT / "static" / "schemas" / "preset.schema.json"
SHAPES = ROOT / "static" / "ontology" / "sstim-shapes.ttl"
FORMAT_DOC = ROOT / "docs" / "technical" / "PRESET_FORMAT.md"
ONTOLOGY = ROOT / "static" / "ontology"

SH = Namespace("http://www.w3.org/ns/shacl#")
SSTIM = Namespace("https://w3id.org/sstim#")
SSTIM_SH = Namespace("https://w3id.org/sstim/shapes#")
SH = Namespace("http://www.w3.org/ns/shacl#")

# SSTIM parameter -> (SSTIM property, catalog field it was derived from).
# The one hand-written fact: no artifact records the correspondence, because the
# names deliberately differ. A catalog field of None means SSTIM introduced the
# parameter rather than inheriting it.
PARAMETER_MAP = {
    "carrierLeftHz": ("carrierFreqLeft", "fl"),
    "carrierRightHz": ("carrierFreqRight", "fr"),
    "centerHz": ("martigliCenterFreq", "mf0"),
    "amplitudeHz": ("martigliAmplitude", "ma"),
    "initialPeriodSeconds": ("martigliPeriodInitial", "mp0"),
    "finalPeriodSeconds": ("martigliPeriodFinal", "mp1"),
    "transitionSeconds": ("martigliTransitionDuration", "md"),
    "baseHz": ("baseFrequency", "f0"),
    "noteCount": ("noteCount", "nnotes"),
    "octaveSpan": ("octaveSpan", "noctaves"),
    "cycleSeconds": ("cycleDuration", "d"),
    # The catalog states the volume bound in prose rather than in a range
    # column, and states it twice inconsistently: the per-type tables said
    # "0-1" while the global limits section says 1.0 is invalid. The prose
    # is now corrected there, but there is still no range cell to read, so
    # only the SHACL half of this one is compared.
    "level": ("initialVolume", None),
}

# Schema enum -> the SSTIM class whose concepts' skos:notation it must draw from.
# Without this the schema could invent controlled values that resolve to nothing,
# which is the KR-17 failure the session projection was built to avoid — and did
# invent three sensory modalities before this check existed.
ENUM_SCHEMES = {
    ("$defs", "frequencyBand"): "FrequencyBand",
    ("$defs", "caution"): "CautionTag",
    ("$defs", "modality"): "SensoryModality",
    ("properties", "group"): "PresetGroup",
    ("properties", "publicClaimLevel"): "PublicClaimLevel",
}

# The ordinal encoding RDF needs, in the order the schema lists the names.
PERMUTATIONS = ["shuffle", "rotate-forward", "rotate-backward", "reverse", "identity"]

MAX_BEAT_HZ = 35
GAMMA40_BEAT_HZ = 40
MAX_PULSE_RATE_HZ = 50
LEVEL_NEEDING_RATIONALE = 0.30

DOC_RANGE_PATTERNS = (
    (re.compile(r"^([\d.]+)\s*[–-]\s*([\d.]+)"), "closed"),
    (re.compile(r"^≥\s*([\d.]+)"), "min-inclusive"),
    (re.compile(r"^>\s*([\d.]+)"), "min-exclusive"),
)


def number(value):
    return float(value) if value is not None else None


def normalized(entry: dict) -> dict:
    return {key: value for key, value in entry.items() if value is not None}


# ── Bound extraction ────────────────────────────────────────────────────────


def schema_bounds(schema: dict) -> tuple[dict[str, dict], list[str]]:
    """Bounds each parameter carries in the JSON Schema, wherever it appears.

    A parameter appearing in two parameter sets — carrierLeftHz in both
    carrier-pair kinds — must be bounded identically in both.
    """
    defs = schema["$defs"]

    def resolve(node: dict) -> dict:
        seen = 0
        while "$ref" in node and seen < 8:
            node = defs[node["$ref"].rsplit("/", 1)[-1]]
            seen += 1
        return node

    collected: dict[str, list[dict]] = {}

    def walk(node):
        if isinstance(node, list):
            for item in node:
                walk(item)
            return
        if not isinstance(node, dict):
            return
        for name, child in (node.get("properties") or {}).items():
            if name in PARAMETER_MAP:
                target = resolve(child)
                entry = {
                    "min": number(target.get("minimum")),
                    "minExclusive": number(target.get("exclusiveMinimum")),
                    "max": number(target.get("maximum")),
                    "maxExclusive": number(target.get("exclusiveMaximum")),
                }
                if any(v is not None for v in entry.values()):
                    collected.setdefault(name, []).append(entry)
        for key, child in node.items():
            if key != "properties":
                walk(child)

    walk(schema)

    problems: list[str] = []
    bounds: dict[str, dict] = {}
    for name, entries in collected.items():
        first = entries[0]
        if any(entry != first for entry in entries[1:]):
            problems.append(
                f"{name}: bounded differently in different parameter sets ({entries})"
            )
        bounds[name] = first
    return bounds, problems


def shacl_bounds(graph: Graph) -> tuple[dict[str, dict], list[str]]:
    """Bounds each SSTIM property carries across the four voice shapes.

    Two things are deliberately out of scope. The Patch Studio Track shapes
    reuse several of these properties under a different model (CLAUDE.md §4:
    the catalog preset and the live authoring patch are not the same object),
    and their bounds are theirs. Conditional constraints nested in sh:or — the
    breathing-reference rule that lifts the initial period to 3 s — hold under a
    condition rather than always, so reading them as bounds would report a
    contradiction that is not one.
    """
    voice_shapes = [
        SSTIM_SH.BinauralVoiceShape,
        SSTIM_SH.MartigliVoiceShape,
        SSTIM_SH.MartigliBinauralVoiceShape,
        SSTIM_SH.SymmetryVoiceShape,
    ]
    # permutationFunction is not in PARAMETER_MAP — it is a named enum in JSON
    # and an ordinal in RDF — but its ceiling is compared against the number
    # of names, so it must still be collected.
    wanted = {prop for prop, _ in PARAMETER_MAP.values()} | {"permutationFunction"}
    collected: dict[str, list[dict]] = {}
    for node_shape in voice_shapes:
        if (node_shape, None, None) not in graph:
            raise SystemExit(
                f"preset-contract: {node_shape} is missing — the voice shape "
                f"inventory here is stale and the comparison would silently "
                f"check less than it claims"
            )
        for shape in graph.objects(node_shape, SH.property):
            if not isinstance(shape, BNode):
                continue
            for path in graph.objects(shape, SH.path):
                local = str(path)[len(str(SSTIM)):] if str(path).startswith(str(SSTIM)) else None
                if local not in wanted:
                    continue
                entry = {
                    "min": number(graph.value(shape, SH.minInclusive)),
                    "minExclusive": number(graph.value(shape, SH.minExclusive)),
                    "max": number(graph.value(shape, SH.maxInclusive)),
                    "maxExclusive": number(graph.value(shape, SH.maxExclusive)),
                }
                if any(v is not None for v in entry.values()):
                    collected.setdefault(local, []).append(entry)

    problems: list[str] = []
    bounds: dict[str, dict] = {}
    for local, entries in collected.items():
        first = entries[0]
        if any(entry != first for entry in entries[1:]):
            problems.append(
                f"sstim:{local}: constrained differently in different voice shapes "
                f"({entries}) — the same parameter must mean the same thing in "
                f"every subtype that carries it"
            )
        bounds[local] = first
    return bounds, problems


def doc_bounds() -> dict[str, dict]:
    """Ranges the catalog format states in its per-voice-type tables."""
    text = FORMAT_DOC.read_text(encoding="utf-8")
    fields = {field for _, field in PARAMETER_MAP.values() if field}
    bounds: dict[str, dict] = {}
    row = re.compile(r"^\|\s*`([A-Za-z0-9]+)`\s*\|\s*[^|]*\|\s*([^|]*?)\s*\|")
    for line in text.splitlines():
        match = row.match(line.strip())
        if not match:
            continue
        field, rangetext = match.group(1), match.group(2).strip()
        if field not in fields:
            continue
        for pattern, kind in DOC_RANGE_PATTERNS:
            hit = pattern.match(rangetext)
            if not hit:
                continue
            if kind == "closed":
                parsed = {"min": float(hit.group(1)), "max": float(hit.group(2))}
            elif kind == "min-inclusive":
                parsed = {"min": float(hit.group(1))}
            else:
                parsed = {"minExclusive": float(hit.group(1))}
            if field in bounds and bounds[field] != parsed:
                bounds[field] = {"__conflict__": (bounds[field], parsed)}
            elif field not in bounds:
                bounds[field] = parsed
            break
    return bounds


# ── Application validation: the rules JSON Schema cannot express ────────────


def validate_preset(document: dict) -> list[str]:
    """Cross-field rules. Arithmetic and cross-references, so not schema work."""
    errors: list[str] = []
    components = document.get("components") or []
    bands = set(document.get("targetBands") or [])

    ids = [component.get("id") for component in components]
    if len(ids) != len(set(ids)):
        errors.append("component ids must be unique within a preset")

    reference = document.get("breathReference")
    if reference is not None and reference not in set(ids):
        errors.append(
            f"breathReference {reference!r} names no component in this preset"
        )

    for component in components:
        kind = component.get("kind")
        parameters = component.get("parameters") or {}
        name = component.get("id", "?")

        level = component.get("level")
        if level is not None and level > LEVEL_NEEDING_RATIONALE and not component.get("notes"):
            errors.append(
                f"{name}: level {level} exceeds {LEVEL_NEEDING_RATIONALE} and must "
                f"record why in notes"
            )

        if kind in ("binaural-beat", "breathing-binaural"):
            left = parameters.get("carrierLeftHz")
            right = parameters.get("carrierRightHz")
            if left is not None and right is not None:
                beat = abs(left - right)
                permitted = beat <= MAX_BEAT_HZ or (
                    beat == GAMMA40_BEAT_HZ and "gamma-40" in bands
                )
                if not permitted:
                    errors.append(
                        f"{name}: beat frequency {beat} Hz exceeds {MAX_BEAT_HZ} Hz "
                        f"and is not an explicit gamma-40 design"
                    )

        if kind == "symmetry-sequence":
            count = parameters.get("noteCount")
            cycle = parameters.get("cycleSeconds")
            if count is not None and cycle:
                rate = count / cycle
                if rate > MAX_PULSE_RATE_HZ:
                    errors.append(
                        f"{name}: pulse rate {rate:.4g} Hz exceeds "
                        f"{MAX_PULSE_RATE_HZ} Hz (onset interval below 20 ms)"
                    )

        if component.get("id") == document.get("breathReference"):
            initial = parameters.get("initialPeriodSeconds")
            if initial is not None and initial < 3:
                errors.append(
                    f"{name}: a breath reference must have an initial period of at "
                    f"least 3 s; below that it is tremolo, not breathing guidance"
                )
    return errors


# ── Fixtures ────────────────────────────────────────────────────────────────


def valid_preset() -> dict:
    return {
        "model": "sstim-preset-1",
        "id": "contract-fixture",
        "name": "Contract fixture",
        "version": "1.0.0",
        "targetBands": ["alpha-10"],
        "components": [
            {
                "id": "beat",
                "modality": "auditory",
                "kind": "binaural-beat",
                "level": 0.16,
                "parameters": {"carrierLeftHz": 200, "carrierRightHz": 210},
            }
        ],
    }


def breathing_preset() -> dict:
    return {
        "model": "sstim-preset-1",
        "id": "breathing-fixture",
        "name": "Breathing fixture",
        "version": "1.0.0",
        "targetBands": ["theta"],
        "breathReference": "breath",
        "components": [
            {
                "id": "breath",
                "modality": "auditory",
                "kind": "breathing-oscillation",
                "level": 0.25,
                "parameters": {
                    "centerHz": 180, "amplitudeHz": 60,
                    "initialPeriodSeconds": 4, "finalPeriodSeconds": 8,
                    "transitionSeconds": 600,
                },
            },
            {
                "id": "pulse",
                "modality": "auditory",
                "kind": "breathing-oscillation",
                "level": 0.2,
                "parameters": {
                    "centerHz": 180, "amplitudeHz": 60,
                    "initialPeriodSeconds": 4, "finalPeriodSeconds": 8,
                    "transitionSeconds": 600,
                },
            },
        ],
    }


def mutate(preset: dict, path: tuple, value) -> dict:
    clone = json.loads(json.dumps(preset))
    node = clone
    for key in path[:-1]:
        node = node[key]
    if value is None:
        node.pop(path[-1], None)
    else:
        node[path[-1]] = value
    return clone


def schema_cases(base: dict) -> list[tuple[str, dict, str]]:
    empty = json.loads(json.dumps(base))
    empty["components"] = []
    stray = json.loads(json.dumps(base))
    stray["components"][0]["parameters"]["fl"] = 200
    return [
        ("an older model tag on a newer document", mutate(base, ("model",), "sstim-preset-0"), "model tag"),
        ("a non-slug id", mutate(base, ("id",), "Contract Fixture"), "id pattern"),
        ("a preset delivering nothing", empty, "at least one component"),
        ("three target bands", mutate(base, ("targetBands",), ["alpha", "smr", "beta"]), "targetBands length"),
        ("an uppercase band", mutate(base, ("targetBands",), ["ALPHA"]), "band enum"),
        ("level at 1.0", mutate(base, ("components", 0, "level"), 1.0), "level < 1"),
        ("a carrier below 80 Hz", mutate(base, ("components", 0, "parameters", "carrierLeftHz"), 60), "carrier range"),
        ("a visual binaural beat", mutate(base, ("components", 0, "modality"), "visual"), "binaural implies auditory"),
        ("a visual breathing oscillation carrying an audio carrier",
         mutate(breathing_preset(), ("components", 1, "modality"), "visual"),
         "audio-parameterised kinds are auditory"),
        ("a component with no modality", mutate(base, ("components", 0, "modality"), None), "modality required"),
        ("a catalog abbreviation smuggled in", stray, "closed parameter set"),
        ("a permutation as an integer", mutate(
            {**base, "components": [{
                "id": "seq", "modality": "auditory", "kind": "symmetry-sequence",
                "parameters": {"baseHz": 200, "noteCount": 10, "octaveSpan": 0,
                               "cycleSeconds": 1.0, "permutation": "identity"},
            }]}, ("components", 0, "parameters", "permutation"), 4), "permutation enum"),
    ]


def cross_field_cases(base: dict, breathing: dict) -> list[tuple[str, dict, str]]:
    duplicate = json.loads(json.dumps(breathing))
    duplicate["components"][1]["id"] = "breath"
    tremolo = json.loads(json.dumps(breathing))
    tremolo["components"][0]["parameters"]["initialPeriodSeconds"] = 1.5
    symmetry = {
        **base,
        "components": [{
            "id": "seq", "modality": "auditory", "kind": "symmetry-sequence",
            "parameters": {"baseHz": 200, "noteCount": 3, "octaveSpan": 0,
                           "cycleSeconds": 0.05, "permutation": "identity"},
        }],
    }
    return [
        ("a 36 Hz beat", mutate(base, ("components", 0, "parameters", "carrierRightHz"), 236), "beat frequency"),
        ("a 40 Hz beat without the gamma-40 target",
         mutate(base, ("components", 0, "parameters", "carrierRightHz"), 240), "beat frequency"),
        ("a 60 Hz pulse rate", symmetry, "pulse rate"),
        ("a louder component with no rationale", mutate(base, ("components", 0, "level"), 0.35), "rationale"),
        ("a breath reference naming nothing", mutate(breathing, ("breathReference",), "absent"), "breathReference"),
        ("duplicate component ids", duplicate, "unique ids"),
        ("a breath reference below 3 s", tremolo, "breathing guidance"),
    ]


# ── RDF fixtures ────────────────────────────────────────────────────────────

PREAMBLE = """
@prefix dct:     <http://purl.org/dc/terms/> .
@prefix ex:      <https://example.org/kr07-fixture/> .
@prefix rdfs:    <http://www.w3.org/2000/01/rdf-schema#> .
@prefix sstim:   <https://w3id.org/sstim#> .
@prefix sstim-v: <https://w3id.org/sstim/vocab#> .
@prefix xsd:     <http://www.w3.org/2001/XMLSchema#> .
"""

RDF_PRESET = """
ex:preset a sstim:Preset ;
    rdfs:label "KR-07 fixture preset" ;
    dct:description "Synthetic preset used only to test the parameter contract." ;
    dct:created "2026-08-15"^^xsd:date ;
    dct:modified "2026-08-15"^^xsd:date ;
    sstim:targetsFrequencyBand sstim-v:alpha10 ;
    sstim:primaryFrequencyBand sstim-v:alpha10 ;
    sstim:inGroup sstim-v:groupPerform ;
    sstim:hasBreathGuide false ;
    sstim:presetVersion "1.0.0" ;
    sstim:hasPublicClaimLevel sstim-v:claimC1Experiential ;
    sstim:forImplementation ex:implementation ;
    sstim:followsProtocol ex:protocol ;
    sstim:composedOf VOICES .

ex:framework a sstim:SensoryStimulationFramework ;
    rdfs:label "KR-07 fixture framework"@en ;
    dct:description "Synthetic framework used only to test the parameter contract." ;
    sstim:definesTechnique sstim-v:techBinauralBeats .

ex:implementation a sstim:SensoryStimulationImplementation ;
    rdfs:label "KR-07 fixture implementation"@en ;
    dct:description "Synthetic implementation used only to test the parameter contract." ;
    sstim:implementsFramework ex:framework .

ex:protocol a sstim:SensoryStimulationProtocol ;
    rdfs:label "KR-07 fixture protocol"@en ;
    dct:description "Synthetic protocol used only to test the parameter contract." ;
    sstim:definedByFramework ex:framework ;
    sstim:usesTechnique sstim-v:techBinauralBeats .
"""

GAMMA40_TARGET = "\nex:preset sstim:targetsFrequencyBand sstim-v:gamma40 .\n"


def rdf_preset(voices: str, blocks: str, extra: str = "") -> str:
    return PREAMBLE + RDF_PRESET.replace("VOICES", voices) + blocks + extra


def binaural_voice(left: float, right: float, volume: float = 0.16, comment: str = "") -> str:
    note = f'    rdfs:comment "{comment}"@en ;\n' if comment else ""
    return f"""
ex:voice a sstim:Voice, sstim:BinauralVoice ;
    rdfs:label "KR-07 fixture binaural voice"@en ;
{note}    sstim:carrierFreqLeft {left} ;
    sstim:carrierFreqRight {right} ;
    sstim:initialVolume {volume} .
"""


def symmetry_voice(count: int, cycle: float, base: float = 200.0) -> str:
    return f"""
ex:voice a sstim:Voice, sstim:SymmetryVoice ;
    rdfs:label "KR-07 fixture symmetry voice"@en ;
    sstim:baseFrequency {base} ;
    sstim:noteCount {count} ;
    sstim:octaveSpan 0.0 ;
    sstim:cycleDuration {cycle} ;
    sstim:permutationFunction 4 ;
    sstim:initialVolume 0.13 .
"""


def many_voices(count: int) -> tuple[str, str]:
    names = ", ".join(f"ex:voice-{i}" for i in range(count))
    blocks = "".join(
        f"""
ex:voice-{i} a sstim:Voice, sstim:BinauralVoice ;
    rdfs:label "KR-07 fixture voice {i}"@en ;
    sstim:carrierFreqLeft 200.0 ;
    sstim:carrierFreqRight 210.0 ;
    sstim:initialVolume 0.16 .
"""
        for i in range(count)
    )
    return names, blocks


def module_paths() -> list[Path]:
    manifest = json.loads((ONTOLOGY / "manifest.json").read_text(encoding="utf-8"))
    paths = [ROOT / m["source"]["path"] for m in manifest["modules"]]
    if not paths:
        raise SystemExit("preset-contract: manifest listed no modules")
    return paths


def main() -> int:
    failures: list[str] = []
    schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
    Draft202012Validator.check_schema(schema)
    validator = Draft202012Validator(schema)

    listed = schema["$defs"]["symmetryParameters"]["properties"]["permutation"]["enum"]
    if listed != PERMUTATIONS:
        failures.append(
            f"the permutation ordinal encoding here {PERMUTATIONS} no longer "
            f"matches the schema's order {listed}"
        )

    # ── 0. Controlled values must resolve to declared concepts ───────────────
    vocabulary = Graph()
    for path in module_paths():
        vocabulary.parse(path, format="turtle")

    checked_values = 0
    for pointer, class_name in ENUM_SCHEMES.items():
        node = schema
        for step in pointer:
            node = node[step]
        declared = {
            str(notation)
            for concept in vocabulary.subjects(RDF.type, SSTIM[class_name])
            for notation in vocabulary.objects(concept, SKOS.notation)
        }
        if not declared:
            failures.append(
                f"{'/'.join(pointer)}: no sstim:{class_name} concept carries a "
                f"skos:notation — the check would pass vacuously"
            )
            continue
        offered = set(node["enum"])
        invented = sorted(offered - declared)
        if invented:
            failures.append(
                f"{'/'.join(pointer)}: {invented} are not notations of any declared "
                f"sstim:{class_name} — the schema is minting controlled values (KR-17)"
            )
        checked_values += len(offered)
        missing = sorted(declared - offered)
        if missing:
            print(
                f"preset-contract: sstim:{class_name} declares {len(missing)} concept(s) "
                f"the schema does not offer — {', '.join(missing)}",
                file=sys.stderr,
            )

    # ── 1. Three-way bound agreement ─────────────────────────────────────────
    shapes = Graph().parse(SHAPES, format="turtle")
    from_schema, schema_problems = schema_bounds(schema)
    from_shacl, shacl_problems = shacl_bounds(shapes)
    from_doc = doc_bounds()
    failures.extend(schema_problems)
    failures.extend(shacl_problems)

    ceiling = normalized(from_shacl.get("permutationFunction", {})).get("max")
    if ceiling is None:
        failures.append(
            "sstim:permutationFunction carries no upper bound, so the named "
            "permutations here cannot be checked against the ordinal encoding"
        )
    elif int(ceiling) != len(PERMUTATIONS) - 1:
        failures.append(
            f"the schema offers {len(PERMUTATIONS)} named permutations but "
            f"sstim:permutationFunction admits ordinals 0..{int(ceiling)} — one "
            f"of them accepts a value the other rejects"
        )

    compared_shacl = 0
    compared_doc = 0
    for parameter, (prop, field) in PARAMETER_MAP.items():
        schema_entry = normalized(from_schema.get(parameter, {}))
        if not schema_entry:
            failures.append(f"{parameter}: the JSON Schema places no bound on it")
            continue

        shacl_entry = normalized(from_shacl.get(prop, {}))
        if not shacl_entry:
            failures.append(
                f"{parameter} (sstim:{prop}): bounded {schema_entry} in the schema "
                f"but no SHACL property shape constrains it"
            )
        elif schema_entry != shacl_entry:
            failures.append(
                f"{parameter} (sstim:{prop}): schema says {schema_entry}, "
                f"SHACL says {shacl_entry}"
            )
        else:
            compared_shacl += 1

        doc_entry = normalized(from_doc.get(field, {})) if field else {}
        if "__conflict__" in doc_entry:
            failures.append(
                f"{field}: PRESET_FORMAT.md states two ranges for one field "
                f"({doc_entry['__conflict__']})"
            )
        elif field and not doc_entry:
            failures.append(
                f"{parameter}: no range for `{field}` found in PRESET_FORMAT.md — "
                f"the correspondence recorded here is stale"
            )
        elif doc_entry and doc_entry != schema_entry:
            failures.append(
                f"{parameter}: PRESET_FORMAT.md says `{field}` is {doc_entry}, "
                f"schema says {schema_entry}"
            )
        elif doc_entry:
            compared_doc += 1

    # ── 2. Schema fixtures ───────────────────────────────────────────────────
    base = valid_preset()
    breathing = breathing_preset()
    for label, document in (("binaural", base), ("multi-modal breathing", breathing)):
        errors = sorted(validator.iter_errors(document), key=str)
        if errors:
            failures.append(
                f"the positive {label} fixture does not validate — every negative "
                f"would then pass for the wrong reason:\n    "
                + "\n    ".join(f"{list(e.path)}: {e.message}" for e in errors[:5])
            )
        cross = validate_preset(document)
        if cross:
            failures.append(f"the positive {label} fixture fails cross-field validation: {cross}")

    schema_negative = schema_cases(base)
    for label, document, clause in schema_negative:
        if not list(validator.iter_errors(document)):
            failures.append(f"schema: {label} accepted — the {clause} rule is not load-bearing")

    # ── 3. Cross-field fixtures ──────────────────────────────────────────────
    cross_negative = cross_field_cases(base, breathing)
    for label, document, clause in cross_negative:
        if not validate_preset(document):
            failures.append(
                f"cross-field: {label} accepted — the {clause} rule is not load-bearing"
            )

    gamma = mutate(base, ("components", 0, "parameters", "carrierRightHz"), 240)
    gamma["targetBands"] = ["gamma-40"]
    if validate_preset(gamma):
        failures.append(
            "cross-field: a 40 Hz beat in a declared gamma-40 preset was rejected, "
            "but that is the documented exception"
        )

    # ── 4. RDF fixtures ──────────────────────────────────────────────────────
    ontology = Graph()
    for path in module_paths():
        ontology.parse(path, format="turtle")

    # One pySHACL run for all of them. It costs ~7s over the 13,020-triple
    # closure no matter how few fixture triples ride along, so a run per fixture
    # spent most of a minute re-checking an ontology that passes every time.
    # Fixtures share a run by being rewritten into their own IRI namespaces, and
    # each is judged on the results whose focus node is its own — which also
    # turns "something failed with this text" into "this fixture failed for this
    # reason".
    def namespaced(fixture: str, tag: str) -> str:
        return re.sub(r"\bex:", f"ex:{tag}-", fixture)

    seven_names, seven_blocks = many_voices(7)
    six_names, six_blocks = many_voices(6)

    rdf_positive = [
        ("a one-voice preset", rdf_preset("ex:voice", binaural_voice(200.0, 210.0))),
        ("six voices", rdf_preset(six_names, six_blocks)),
        ("a 40 Hz beat in a declared gamma-40 preset",
         rdf_preset("ex:voice", binaural_voice(200.0, 240.0)) + GAMMA40_TARGET),
        ("a louder voice that records why",
         rdf_preset("ex:voice", binaural_voice(200.0, 210.0, 0.35, "Quiet ambient bed at -18 LUFS."))),
        ("a Symmetry voice at exactly 50 Hz", rdf_preset("ex:voice", symmetry_voice(10, 0.2))),
    ]
    rdf_negative = [
        ("seven voices", rdf_preset(seven_names, seven_blocks), "1-6 Voices"),
        ("a 36 Hz beat", rdf_preset("ex:voice", binaural_voice(200.0, 236.0)), "35 Hz"),
        ("a 40 Hz beat without the gamma-40 target",
         rdf_preset("ex:voice", binaural_voice(200.0, 240.0)), "35 Hz"),
        ("a louder voice with no rationale",
         rdf_preset("ex:voice", binaural_voice(200.0, 210.0, 0.35)), "rdfs:comment"),
        ("a Symmetry voice at 60 Hz", rdf_preset("ex:voice", symmetry_voice(3, 0.05)), "50 Hz"),
        ("a carrier below 80 Hz", rdf_preset("ex:voice", binaural_voice(60.0, 70.0)), "[80, 1000]"),
        ("a Symmetry base note below 80 Hz", rdf_preset("ex:voice", symmetry_voice(4, 1.0, 60.0)), ">= 80 Hz"),
    ]

    combined = Graph()
    for triple in ontology:
        combined.add(triple)
    for index, (_, fixture) in enumerate(rdf_positive):
        combined.parse(data=namespaced(fixture, f"p{index}"), format="turtle")
    for index, (_, fixture, _) in enumerate(rdf_negative):
        combined.parse(data=namespaced(fixture, f"n{index}"), format="turtle")

    _, results, _ = shacl_validate(combined, shacl_graph=shapes, advanced=True)
    reported: dict[str, list[str]] = {}
    for result in results.subjects(RDF.type, SH.ValidationResult):
        for focus in results.objects(result, SH.focusNode):
            for message in results.objects(result, SH.resultMessage):
                reported.setdefault(str(focus), []).append(str(message))

    def messages_for(tag: str) -> list[str]:
        prefix = f"https://example.org/kr07-fixture/{tag}-"
        return [m for node, ms in reported.items() if node.startswith(prefix) for m in ms]

    for index, (label, _) in enumerate(rdf_positive):
        hits = messages_for(f"p{index}")
        if hits:
            failures.append(f"RDF: {label} rejected, but it is valid: {hits[:2]}")

    for index, (label, _, fragment) in enumerate(rdf_negative):
        hits = messages_for(f"n{index}")
        if not hits:
            failures.append(f"RDF: {label} accepted, but must be rejected")
        elif not any(fragment in m for m in hits):
            failures.append(
                f"RDF: {label} rejected, but not by its own constraint "
                f"(expected a message containing {fragment!r}, got {hits[:2]})"
            )

    if failures:
        print(f"preset-contract: FAILED ({len(failures)})", file=sys.stderr)
        for failure in failures:
            print(f"  - {failure}", file=sys.stderr)
        return 1

    print(
        f"preset-contract: passed ({checked_values} controlled values resolve to "
        f"declared concepts; {compared_shacl} parameters agree with SHACL, "
        f"{compared_doc} with the ranges PRESET_FORMAT.md records; "
        f"{len(schema_negative)} schema, {len(cross_negative)} cross-field and "
        f"{len(rdf_negative)} RDF adversarial cases rejected; "
        f"{len(rdf_positive) + 3} positive controls accepted)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
