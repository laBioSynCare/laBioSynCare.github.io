#!/usr/bin/env python3
"""Tests for the session builder, and for the tool examples that use it.

Offline by design, like test_sstim.py: validation resolves the frozen 0.18.0
manifest in this repository. The tool examples run against small stand-ins for
PsychoPy and pyxdf, because what is under test is the record they write, not
the tools.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path
from types import ModuleType, SimpleNamespace
from unittest import mock
import importlib.util
import json
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "packages" / "sstim" / "src"))

from rdflib import Graph, Namespace, RDF  # noqa: E402
from rdflib.namespace import SKOS  # noqa: E402

import sstim  # noqa: E402
from sstim._session import CONTROLLED, EXPOSURE_CATEGORIES, PERCEPTUAL_MECHANISMS  # noqa: E402

FROZEN = ROOT / "static" / "ontology" / "0.18.0"
MANIFEST = FROZEN / "manifest.json"
FIXTURES = ROOT / "packages" / "fixtures"
TOOLS = ROOT / "examples" / "tools"
BASE = "https://example.org/lab/test/"
START = datetime(2026, 9, 17, 9, 0, tzinfo=timezone.utc)

SSTIM = Namespace("https://w3id.org/sstim#")
SSTIM_EX = Namespace("https://w3id.org/sstim/exposure#")
CLASSES = {
    "timing": SSTIM.TimingAuthority, "reproducibility": SSTIM.ReproducibilityLevel,
    "event": SSTIM.SessionEventType, "change": SSTIM.StimulationParameterKind,
    "shape": SSTIM.SignalShape, "parameter": SSTIM.RenderableParameter,
    "mechanism": SSTIM.RenderingMechanism, "modality": SSTIM.SensoryModality,
    "perceived": SSTIM_EX.PerceivedModality, "medium": SSTIM_EX.PhysicalDeliveryMedium,
    "placement": SSTIM_EX.BodyPlacement,
}


def snake(record: dict) -> dict:
    return {"".join("_" + c.lower() if c.isupper() else c for c in k): v for k, v in record.items()}


def fixture_session() -> sstim.Session:
    spec = json.loads((FIXTURES / "session-parity.json").read_text(encoding="utf-8"))
    session = sstim.Session(spec["base"], **snake(spec["session"]))
    signals = [session.signal(**snake(s)) for s in spec["signals"]]
    for channel in spec["channels"]:
        fields = snake(channel)
        label = fields.pop("label")
        fields["signal"] = signals[fields["signal"]]
        session.channel(label, **fields)
    for event in spec["events"]:
        fields = snake(event)
        session.event(fields.pop("kind"), **fields)
    session.close(**snake(spec["close"]))
    return session


def minimal(**overrides) -> sstim.Session:
    fields = dict(label="t", duration=60, master_volume=0.0,
                  timing="monotonic-substitute", clock=10.0, started_at=START)
    fields.update(overrides)
    return sstim.Session(BASE, **fields)


def with_channel(session: sstim.Session, **overrides) -> sstim.Session:
    signal = session.signal(hz=10.0, shape="square")
    fields = dict(modality="visual", medium="visual-light", placement="eyes",
                  signal=signal, parameter="luminance", mechanism="direct-presentation")
    fields.update(overrides)
    session.channel("disc", **fields)
    return session


def load_example(name: str):
    spec = importlib.util.spec_from_file_location(f"example_{Path(name).stem}", TOOLS / name)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class _Ticking(datetime):
    """A wall clock that moves a minute per reading. A stubbed PsychoPy loop
    finishes inside one millisecond, and a block that starts and ends in the
    same millisecond is refused; a real one never does."""

    readings = 0

    @classmethod
    def now(cls, tz=None):
        cls.readings += 1
        return START + timedelta(minutes=cls.readings)


def ntriples(graph: Graph) -> str:
    lines = sorted(line for line in graph.serialize(format="nt").splitlines() if line.strip())
    return "\n".join(lines) + "\n"


class ParityTest(unittest.TestCase):
    def test_matches_the_golden_file_shared_with_the_javascript_client(self):
        golden = (FIXTURES / "session-parity.nt").read_text(encoding="utf-8")
        self.assertEqual(ntriples(fixture_session().graph()), golden)

    def test_the_golden_graph_conforms_to_full_with_sparql_active(self):
        """The JavaScript runtime cannot evaluate SHACL-SPARQL. This run can,
        and the JavaScript builder emits these same triples, so this is the
        check that covers both."""
        report = fixture_session().validate(manifest=MANIFEST)
        self.assertTrue(report.ok, str(report))
        self.assertEqual(report.version, "0.18.0")


class VocabularyTableTest(unittest.TestCase):
    """The builder resolves notations from a table rather than a network call.
    These keep the table honest against the frozen release."""

    @classmethod
    def setUpClass(cls):
        cls.graph = Graph()
        for module in ("sstim-vocab.ttl", "sstim-stimulus.ttl", "sstim-exposure.ttl"):
            cls.graph.parse(FROZEN / module)

    def test_every_entry_is_a_concept_of_its_class_with_that_notation(self):
        for category, table in CONTROLLED.items():
            namespace = SSTIM_EX if category in EXPOSURE_CATEGORIES else Namespace("https://w3id.org/sstim/vocab#")
            for notation, local in table.items():
                with self.subTest(category=category, notation=notation):
                    concept = namespace[local]
                    self.assertIn((concept, RDF.type, CLASSES[category]), self.graph)
                    self.assertEqual(str(self.graph.value(concept, SKOS.notation)), notation)

    def test_every_concept_of_each_class_is_in_the_table(self):
        for category, cls in CLASSES.items():
            with self.subTest(category=category):
                published = {str(self.graph.value(c, SKOS.notation)) for c in self.graph.subjects(RDF.type, cls)}
                self.assertEqual(published, set(CONTROLLED[category]))

    def test_presence_follows_the_published_mechanism(self):
        perceptual = Namespace("https://w3id.org/sstim/vocab#").presencePerceptual
        for notation, local in CONTROLLED["mechanism"].items():
            implied = self.graph.value(Namespace("https://w3id.org/sstim/vocab#")[local], SSTIM.impliesPresence)
            with self.subTest(mechanism=notation):
                self.assertEqual(implied == perceptual, notation in PERCEPTUAL_MECHANISMS)


class RefusalTest(unittest.TestCase):
    """Each rule the Full shapes would reject is refused at the call."""

    def refused(self, build, fragment):
        with self.assertRaises(sstim.SstimError) as caught:
            build()
        self.assertIn(fragment, str(caught.exception))

    def test_refusals(self):
        cases = [
            (lambda: minimal(duration=30), "60 to 7200"),
            (lambda: minimal(master_volume=1.5), "[0, 1]"),
            (lambda: minimal(timing="wall-clock"), "is not one of"),
            (lambda: minimal(clock=-1.0), "non-negative"),
            (lambda: minimal(started_at=datetime(2026, 9, 17, 9, 0)), "time zone"),
            (lambda: minimal(digest="ab" * 16), "algorithm"),
            (lambda: sstim.Session("https://w3id.org/sstim/mine/", label="t", duration=60,
                                   master_volume=0.0, timing="audio-hardware", clock=0.0), "only SSTIM mints"),
            (lambda: sstim.Session("https://example.org/no-slash", label="t", duration=60,
                                   master_volume=0.0, timing="audio-hardware", clock=0.0), "must end with"),
            (lambda: minimal().signal(hz=10.0, shape="sampled"), "sampled from"),
            (lambda: minimal().signal(hz_min=12.0, hz_max=8.0, shape="noise"), "hz_min <= hz_max"),
            (lambda: with_channel(minimal(), carrier_hz=200.0), "no carrier"),
            (lambda: with_channel(minimal(), medium=[]), "at least one medium"),
            (lambda: with_channel(minimal(), placement="elbow"), "is not one of"),
            (lambda: with_channel(minimal(), placement=3), "notation or a list"),
            (lambda: minimal().event("playback-pause", at=11.0), "while playback is idle"),
            (lambda: minimal().event("session-open", at=11.0), "not recorded by hand"),
            (lambda: minimal().event("parameter-changed", at=11.0, parameter="level"), "new value"),
            (lambda: minimal().event("playback-start", at=11.0, after=0.5), "belong to"),
            (lambda: minimal().event("playback-start", at=9.0), "before the clock origin"),
            (lambda: minimal().graph(), "close() the session first"),
            (lambda: minimal().close(at=80.0, completed=True, delivered=90.0), "cannot deliver more"),
            (lambda: minimal().close(at=80.0, completed=True, ended_at=START), "later than"),
        ]
        for build, fragment in cases:
            with self.subTest(fragment=fragment):
                self.refused(build, fragment)

    def test_events_must_be_in_order(self):
        session = minimal()
        session.event("playback-start", at=20.0)
        self.refused(lambda: session.event("engine-fallback", at=15.0), "in order")

    def test_a_signal_from_another_session_is_refused(self):
        """It would compare equal to this session's own signal-1 and point the
        rendering at a node that says something else, or nothing."""
        foreign = minimal().signal(hz=10.0, shape="square")
        session = minimal()
        session.signal(hz=10.0, shape="square")
        self.refused(lambda: session.channel(
            "disc", modality="visual", medium="visual-light", placement="eyes", signal=foreign,
            parameter="luminance", mechanism="direct-presentation"), "returned by this session")

    def test_nothing_after_close(self):
        session = minimal()
        session.close(at=80.0, completed=True, ended_at=START + timedelta(minutes=2))
        self.refused(lambda: session.event("playback-start", at=90.0), "after close()")


class RecordTest(unittest.TestCase):
    def closed(self, *, completed, pause=None, close_at=40.0, **overrides):
        session = with_channel(minimal(**overrides))
        session.event("playback-start", at=10.0)
        if pause:
            session.event("playback-pause", at=pause[0])
            session.event("playback-resume", at=pause[1])
        session.close(at=close_at, completed=completed, ended_at=START + timedelta(minutes=5))
        return session.graph()

    def value(self, graph, predicate):
        return graph.value(next(graph.subjects(RDF.type, SSTIM.SessionInstance)), predicate)

    def test_elapsed_rounds_up_from_the_written_offset_not_the_float(self):
        """72.1 - 12.1 is 60.00000000000001 in binary floating point. Rounding
        that up would claim 61 s; rounding the written offset up claims 60."""
        session = minimal(clock=12.1)
        session.close(at=72.1, completed=True, ended_at=START + timedelta(minutes=2))
        self.assertEqual(int(self.value(session.graph(), SSTIM.actualDurationSeconds)), 60)

    def test_delivered_excludes_pauses(self):
        graph = self.closed(completed=True, pause=(20.0, 25.0), close_at=70.0)
        self.assertEqual(str(self.value(graph, SSTIM.deliveredDurationSeconds)), "55.0")
        self.assertEqual(int(self.value(graph, SSTIM.actualDurationSeconds)), 60)

    def test_status_follows_the_thirty_percent_rule_when_not_completed(self):
        self.assertEqual(str(self.value(self.closed(completed=False, close_at=40.0), SSTIM.completionStatus)), "interrupted")
        self.assertEqual(str(self.value(self.closed(completed=False, close_at=20.0), SSTIM.completionStatus)), "abandoned")

    def test_optical_radiation_declares_its_comfort_boundary(self):
        session = with_channel(minimal(), medium=["visual-light", "infrared-radiation"])
        session.close(at=80.0, completed=True, ended_at=START + timedelta(minutes=2))
        graph = session.graph()
        self.assertIn((None, SSTIM_EX.hasComfortBoundary, SSTIM_EX.boundaryOpticalRadiation), graph)
        self.assertTrue(session.validate(manifest=MANIFEST).ok)

    def test_tactile_is_not_promoted_to_a_session_modality(self):
        session = with_channel(minimal(), modality="tactile", medium="mechanical-vibration",
                               placement="hands", parameter="vibration-intensity")
        session.close(at=80.0, completed=True, ended_at=START + timedelta(minutes=2))
        self.assertIsNone(self.value(session.graph(), SSTIM.hasDeliveryModality))
        self.assertTrue(session.validate(manifest=MANIFEST).ok)

    def test_a_whole_float_duration_is_the_same_plan(self):
        session = minimal(duration=60.0)
        session.close(at=80.0, completed=True, ended_at=START + timedelta(minutes=2))
        graph = session.graph()
        self.assertEqual(str(graph.value(next(graph.subjects(RDF.type, SSTIM.SessionSpecification)),
                                         SSTIM.durationSeconds)), "60")

    def test_write_refuses_and_writes_nothing_when_validation_fails(self):
        """Session terms are not in the Core closure, so containment fails:
        a real failure the builder cannot prevent, because it is the caller's
        choice of profile."""
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "run.ttl"
            with self.assertRaises(sstim.SstimError) as caught:
                fixture_session().write(target, profile="core", manifest=MANIFEST)
            self.assertIn("not written", str(caught.exception))
            self.assertFalse(target.exists())

    def test_write_validates_then_writes(self):
        session = fixture_session()
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "run.ttl"
            report = session.write(target, manifest=MANIFEST)
            self.assertTrue(report.ok)
            # Exactly the Turtle it validated. Not compared by re-parsing:
            # rdflib normalizes xsd:dateTime lexical forms on the way in.
            self.assertEqual(target.read_text(encoding="utf-8"), session.to_turtle())


class ToolExampleTest(unittest.TestCase):
    def tearDown(self):
        for name in ("psychopy", "pyxdf"):
            sys.modules.pop(name, None)

    def install_psychopy(self, escape_after=None):
        clock = {"t": 5.0, "polls": 0}

        class Window:
            def __init__(self, **_):
                pass

            def getActualFrameRate(self):
                return 60.0

            def flip(self):
                clock["t"] += 1 / 60
                return clock["t"]

            def close(self):
                pass

        class Circle:
            def __init__(self, win, **_):
                pass

            def draw(self):
                pass

        def get_keys(keys):
            clock["polls"] += 1
            return ["escape"] if escape_after and clock["polls"] >= escape_after else []

        psychopy = ModuleType("psychopy")
        psychopy.core = SimpleNamespace(getTime=lambda: clock["t"])
        psychopy.visual = SimpleNamespace(Window=Window, Circle=Circle)
        psychopy.event = SimpleNamespace(getKeys=get_keys)
        sys.modules["psychopy"] = psychopy

    def test_psychopy_flicker_writes_a_valid_record(self):
        self.install_psychopy()
        with mock.patch("sstim._session.datetime", _Ticking):
            session = load_example("psychopy_flicker.py").run()
        report = session.validate(manifest=MANIFEST)
        self.assertTrue(report.ok, str(report))
        graph = session.graph()
        self.assertEqual(str(graph.value(next(graph.subjects(RDF.type, SSTIM.SessionInstance)),
                                         SSTIM.completionStatus)), "completed")

    def test_psychopy_escape_is_recorded_as_an_early_end(self):
        self.install_psychopy(escape_after=600)
        with mock.patch("sstim._session.datetime", _Ticking):
            session = load_example("psychopy_flicker.py").run()
        self.assertTrue(session.validate(manifest=MANIFEST).ok)
        graph = session.graph()
        instance = next(graph.subjects(RDF.type, SSTIM.SessionInstance))
        self.assertEqual(str(graph.value(instance, SSTIM.completionStatus)), "abandoned")

    def test_lsl_markers_convert_to_a_valid_record(self):
        pyxdf = ModuleType("pyxdf")
        pyxdf.load_xdf = lambda path: (
            [
                {"info": {"name": ["EEG"]}, "time_stamps": [95.0, 96.0], "time_series": [[0.0], [0.0]]},
                {"info": {"name": ["StimMarkers"]},
                 "time_stamps": [98.0, 100.0, 400.0, 410.0, 710.0, 712.0],
                 "time_series": [["calibration"], ["stim-start"], ["stim-pause"], ["stim-resume"],
                                 ["stim-end"], ["recording-stop"]]},
            ],
            {"info": {"datetime": ["2026-09-17T09:01:00+0200"]}},
        )
        sys.modules["pyxdf"] = pyxdf
        session = load_example("lsl_markers.py").convert("goggles-001.xdf")
        self.assertTrue(session.validate(manifest=MANIFEST).ok)
        graph = session.graph()
        instance = next(graph.subjects(RDF.type, SSTIM.SessionInstance))
        self.assertEqual(str(graph.value(instance, SSTIM.deliveredDurationSeconds)), "600.0")
        self.assertEqual(int(graph.value(instance, SSTIM.actualDurationSeconds)), 610)
        # Foreign markers on either side are ignored: the block still reads as
        # completed, and the session opens at stim-start, not at calibration.
        self.assertEqual(str(graph.value(instance, SSTIM.completionStatus)), "completed")
        # Recording began at 09:01:00+02:00, five LSL seconds before stim-start.
        self.assertEqual(str(graph.value(instance, Namespace("http://www.w3.org/ns/prov#").startedAtTime)),
                         "2026-09-17T07:01:05.000Z")


if __name__ == "__main__":
    unittest.main(verbosity=1)
