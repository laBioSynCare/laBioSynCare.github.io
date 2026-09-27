"""Write an SSTIM session record from what a tool already knows.

Every exporter needs the same thing: take a stated clock, the stimulus that was
delivered and the moments things happened, and produce a graph the Full profile
accepts. None of that is specific to PsychoPy, jsPsych or Lab Streaming Layer,
so it lives here once, and a tool adapter shrinks to reading its own clock
(ADR 0058).

    session = sstim.Session(
        "https://example.org/lab/run-001/",
        label="10 Hz flicker block", duration=60, master_volume=0.0,
        timing="monotonic-substitute", clock=core.getTime(),
    )
    flicker = session.signal(hz=10.0, shape="square")
    session.channel("2 degree disc, screen", modality="visual",
                    medium="visual-light", placement="eyes", signal=flicker,
                    parameter="luminance", mechanism="direct-presentation")
    session.event("playback-start", at=core.getTime())
    session.close(at=core.getTime(), completed=True)
    session.write("run-001.ttl")

Two rules shape it.

**It refuses at the call that breaks the model**, not at validation time. A
planned duration of 30 s, a carrier on a directly presented flicker, or a
parameter change with no new value raises SstimError where it is written, with
the reason. Several of those rules are SHACL-SPARQL constraints, which the
JavaScript client cannot evaluate, so enforcing them here is what lets the two
clients emit the same graph and trust it equally.

**It writes nothing about a participant.** No identifier, no observation, no
free text. ADR 0048 leaves whether an identifiable observation belongs in a
published graph to a governance decision this builder must not pre-empt.

Controlled values are the `skos:notation` strings SSTIM publishes, for example
"playback-start" or "amplitude-modulation", never field names from any one
application.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import ROUND_CEILING, Decimal
from pathlib import Path
import math

from rdflib import Graph, Literal, Namespace, URIRef
from rdflib.namespace import DCTERMS, PROV, RDF, RDFS, XSD

from ._resolve import SstimError, TERM_NAMESPACE

SSTIM = Namespace("https://w3id.org/sstim#")
SSTIM_V = Namespace("https://w3id.org/sstim/vocab#")
SSTIM_EX = Namespace("https://w3id.org/sstim/exposure#")

# notation -> local name, per category. Checked against the frozen vocabulary
# by the test suite, entry by entry and for completeness, so a table that
# drifts from SSTIM fails there and not here. The last three categories live in
# the exposure namespace, the rest in the vocabulary namespace.
CONTROLLED: dict[str, dict[str, str]] = {
    "timing": {
        "audio-hardware": "timingAudioHardwareClock",
        "monotonic-substitute": "timingMonotonicSubstitute",
    },
    "reproducibility": {
        "identical-rendering": "reproIdenticalRendering",
        "equivalent-signal": "reproEquivalentSignal",
        "equivalent-presentation": "reproEquivalentPresentation",
    },
    "event": {
        "session-open": "eventSessionOpen",
        "playback-start": "eventPlaybackStart",
        "playback-pause": "eventPlaybackPause",
        "playback-resume": "eventPlaybackResume",
        "playback-stop": "eventPlaybackStop",
        "session-complete": "eventSessionComplete",
        "session-interrupt": "eventSessionInterrupt",
        "engine-fallback": "eventEngineFallback",
        "safety-limit-applied": "eventSafetyLimitApplied",
        "observation-collected": "eventObservationCollected",
        "parameter-changed": "eventParameterChanged",
    },
    "change": {
        "level": "paramLevel",
        "carrier-frequency": "paramCarrierFrequency",
        "modulation-frequency": "paramModulationFrequency",
        "duty-cycle": "paramDutyCycle",
        "phase-offset": "paramPhaseOffset",
    },
    "shape": {
        "sine": "shapeSine",
        "square": "shapeSquare",
        "triangle": "shapeTriangle",
        "sawtooth": "shapeSawtooth",
        "noise": "shapeNoise",
        "envelope": "shapeEnvelope",
        "sampled": "shapeSampled",
    },
    "parameter": {
        "amplitude": "paramAmplitude",
        "frequency": "paramFrequency",
        "luminance": "paramLuminance",
        "size": "paramSize",
        "spatial-position": "paramSpatialPosition",
        "vibration-intensity": "paramVibrationIntensity",
    },
    "mechanism": {
        "amplitude-modulation": "mechanismAmplitudeModulation",
        "frequency-modulation": "mechanismFrequencyModulation",
        "monaural-beat": "mechanismMonauralBeat",
        "binaural-beat": "mechanismBinauralBeat",
        "direct-presentation": "mechanismDirectPresentation",
    },
    "modality": {
        "auditory": "modalityAuditory",
        "visual": "modalityVisual",
        "somatosensory": "modalitySomatosensory",
        "vestibular": "modalityVestibular",
        "olfactory": "modalityOlfactory",
        "interoceptive": "modalityInteroceptive",
    },
    "perceived": {
        "auditory": "modalityAuditory",
        "visual": "modalityVisual",
        "tactile": "modalityTactile",
        "somatosensory": "modalitySomatosensory",
        "proprioceptive": "modalityProprioceptive",
        "vestibular": "modalityVestibular",
        "olfactory": "modalityOlfactory",
        "gustatory": "modalityGustatory",
        "interoceptive": "modalityInteroceptive",
        "social-perceptual": "modalitySocialPerceptual",
        "multimodal": "modalityMultimodal",
        "not-directly-perceived": "modalityNotDirectlyPerceived",
    },
    "medium": {
        "acoustic-energy": "mediumAcousticEnergy",
        "air-conducted-sound": "mediumAirConductedSound",
        "contact-acoustic-vibration": "mediumContactAcousticVibration",
        "focused-ultrasound": "mediumFocusedUltrasound",
        "airflow": "mediumAirflow",
        "applied-electric-current": "mediumAppliedElectricCurrent",
        "applied-electric-field": "mediumAppliedElectricField",
        "applied-magnetic-field": "mediumAppliedMagneticField",
        "chemical-agent": "mediumChemicalAgent",
        "gustatory-chemical-exposure": "mediumGustatoryChemicalExposure",
        "olfactory-chemical-exposure": "mediumOlfactoryChemicalExposure",
        "pharmacological-agent": "mediumPharmacologicalAgent",
        "electromagnetic-field": "mediumElectromagneticField",
        "electromagnetic-radiation": "mediumElectromagneticRadiation",
        "infrared-radiation": "mediumInfraredRadiation",
        "ultraviolet-radiation": "mediumUltravioletRadiation",
        "visual-light": "mediumVisualLight",
        "fluid-motion": "mediumFluidMotion",
        "liquid-gel-immersion": "mediumLiquidGelImmersion",
        "mechanical-force": "mediumMechanicalForce",
        "mechanical-vibration": "mediumMechanicalVibration",
        "respiratory-cue": "mediumRespiratoryCue",
        "rigid-surface-contact": "mediumRigidSurfaceContact",
        "stereoscopic-visual-presentation": "mediumStereoscopicVisualPresentation",
        "textile-clothing-contact": "mediumTextileClothingContact",
        "thermal-contact": "mediumThermalContact",
        "thermal-energy": "mediumThermalEnergy",
    },
    "placement": {
        "ears": "placementEars",
        "ear-left": "placementEarLeft",
        "ear-right": "placementEarRight",
        "eyes": "placementEyes",
        "eye-left": "placementEyeLeft",
        "eye-right": "placementEyeRight",
        "feet": "placementFeet",
        "hands": "placementHands",
        "joints": "placementJoints",
        "mouth": "placementMouth",
        "nose": "placementNose",
        "top-of-head": "placementTopOfHead",
        "torso": "placementTorso",
        "whole-body": "placementWholeBody",
        "nearby-environment": "placementNearbyEnvironment",
    },
}
EXPOSURE_CATEGORIES = {"perceived", "medium", "placement"}

# A channel delivering these must declare the optical-radiation comfort
# boundary. That follows from the medium, so it is written rather than asked.
OPTICAL_RADIATION = {"infrared-radiation", "ultraviolet-radiation"}

# Presence follows from the mechanism (sstim:impliesPresence), so it is read
# from here rather than asked for: a caller cannot state a binaural beat as
# physically present, which is the contradiction the shape exists to catch.
PERCEPTUAL_MECHANISMS = {"binaural-beat"}

# The builder emits these itself, from the constructor and from close(). An
# observation-collected event points at a participant observation, and this
# builder records none.
RESERVED_EVENTS = {"session-open", "session-complete", "session-interrupt", "observation-collected"}
CHANGE_EVENTS = {"parameter-changed", "safety-limit-applied"}
REGIMES = ("determinate", "stochastic", "adaptive")

# SessionSpecification bounds, from sstim-shapes.ttl.
PLANNED_MIN, PLANNED_MAX = 60, 7200


def _controlled(category: str, value: str, what: str) -> URIRef:
    table = CONTROLLED[category]
    if value not in table:
        raise SstimError(f"{what} {value!r} is not one of: {', '.join(table)}")
    namespace = SSTIM_EX if category in EXPOSURE_CATEGORIES else SSTIM_V
    return namespace[table[value]]


def _several(category: str, value, what: str) -> tuple[str, ...]:
    values = (value,) if isinstance(value, str) else tuple(value or ())
    if not values:
        raise SstimError(f"a channel needs at least one {what}")
    for item in values:
        _controlled(category, item, what)
    return values


def _number(value, what: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        try:
            number = float(value)  # numpy scalars, Decimal
        except (TypeError, ValueError):
            raise SstimError(f"{what} must be a number, got {value!r}") from None
    else:
        number = float(value)
    if not math.isfinite(number) or abs(number) >= 1e15:
        raise SstimError(f"{what} must be a finite number below 1e15, got {value!r}")
    return number


def _lexical(number: float) -> str:
    # Nine fractional digits (nanoseconds, for offsets), trailing zeros
    # dropped, one kept. The JavaScript client applies the same rule, so the
    # two emit byte-identical literals.
    text = f"{number:.9f}".rstrip("0")
    if text.endswith("."):
        text += "0"
    return "0.0" if text == "-0.0" else text


def _decimal(number: float) -> Literal:
    return Literal(_lexical(number), datatype=XSD.decimal, normalize=False)


def _integer(number: int) -> Literal:
    return Literal(str(int(number)), datatype=XSD.integer)


def _instant(value, what: str) -> datetime:
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            raise SstimError(f"{what} is not an ISO 8601 date-time: {value!r}") from None
    if not isinstance(value, datetime):
        raise SstimError(f"{what} must be a datetime, got {value!r}")
    if value.tzinfo is None or value.utcoffset() is None:
        raise SstimError(
            f"{what} has no time zone. A naive time cannot be placed in the "
            "calendar; pass datetime.now(timezone.utc) or an aware value."
        )
    return value.astimezone(timezone.utc)


def _milliseconds(value: datetime) -> datetime:
    # What is written is milliseconds, as JavaScript's Date holds, so that is
    # the precision comparisons are made at.
    return value.replace(microsecond=value.microsecond // 1000 * 1000)


def _date_time(value: datetime) -> Literal:
    text = value.strftime("%Y-%m-%dT%H:%M:%S") + f".{value.microsecond // 1000:03d}Z"
    return Literal(text, datatype=XSD.dateTime, normalize=False)


def _label(number: float) -> str:
    return str(int(number)) if number.is_integer() else repr(number)


@dataclass(frozen=True)
class Signal:
    """A modality-free signal. Pass it to `Session.channel` to render it."""

    index: int
    hz_min: float
    hz_max: float
    shape: str
    label: str


class Session:
    """One execution of a stimulus, with its plan and what happened during it.

    `base` is your namespace for this one record; every node is minted under
    it. `clock` is your timing context's reading when the session opened, and
    every later `at=` is a reading of the same clock: offsets are computed
    here, so you never subtract anything yourself.

    `timing` says which clock that is. "audio-hardware" when the readings come
    from the device that rendered the audio (an AudioContext), and
    "monotonic-substitute" for any other monotonic clock, such as PsychoPy's or
    Lab Streaming Layer's.
    """

    def __init__(
        self,
        base: str,
        *,
        label: str,
        duration: int,
        master_volume: float,
        timing: str,
        clock: float,
        started_at: datetime | str | None = None,
        created: datetime | str | None = None,
        master_brightness: float | None = None,
        reproducibility: str = "equivalent-presentation",
        digest: str | None = None,
        digest_algorithm: str | None = None,
        stimulus_label: str | None = None,
        regime: str = "determinate",
    ) -> None:
        if not isinstance(base, str) or not base.startswith(("http://", "https://")):
            raise SstimError(f"base must be an http(s) IRI in your own namespace, got {base!r}")
        if base.startswith(TERM_NAMESPACE):
            raise SstimError(
                f"base {base!r} is under {TERM_NAMESPACE}, which only SSTIM mints in. "
                "Use your own namespace for your records."
            )
        if not base.endswith(("/", "#")):
            raise SstimError(f"base must end with '/' or '#' so records can be minted under it, got {base!r}")
        if not isinstance(label, str) or not label.strip():
            raise SstimError("label must be a non-empty string")
        if isinstance(duration, bool) or not isinstance(duration, int) or not PLANNED_MIN <= duration <= PLANNED_MAX:
            raise SstimError(
                f"duration is the planned length in whole seconds, {PLANNED_MIN} to "
                f"{PLANNED_MAX} in SSTIM's session model; got {duration!r}"
            )
        self._volume = _number(master_volume, "master_volume")
        if not 0 <= self._volume <= 1:
            raise SstimError("master_volume is a normalized gain in [0, 1]; a silent session states 0")
        self._brightness = None
        if master_brightness is not None:
            self._brightness = _number(master_brightness, "master_brightness")
            if not 0 <= self._brightness <= 1:
                raise SstimError("master_brightness is a normalized level in [0, 1]")
        self._timing = _controlled("timing", timing, "timing")
        self._reproducibility = _controlled("reproducibility", reproducibility, "reproducibility")
        if digest is not None:
            if digest_algorithm is None:
                raise SstimError("a digest without its algorithm cannot be recomputed; pass digest_algorithm")
            if not isinstance(digest, str) or not (32 <= len(digest) <= 128) or any(c not in "0123456789abcdef" for c in digest):
                raise SstimError("digest must be 32 to 128 lowercase hexadecimal characters")
        elif digest_algorithm is not None:
            raise SstimError("digest_algorithm was given without a digest")
        if regime not in REGIMES:
            raise SstimError(f"regime {regime!r} is not one of: {', '.join(REGIMES)}")
        self._origin = _number(clock, "clock")
        if self._origin < 0:
            raise SstimError("clock must be a non-negative reading of your timing context")

        self._base = base
        self._label = label
        self._duration = duration
        self._digest = digest
        self._digest_algorithm = digest_algorithm
        self._stimulus_label = stimulus_label or f"Stimulus delivered in {label}"
        self._regime = regime
        self._started = _instant(started_at, "started_at") if started_at is not None else datetime.now(timezone.utc)
        self._created = _instant(created, "created") if created is not None else self._started

        self._signals: list[Signal] = []
        self._channels: list[dict] = []
        self._events: list[dict] = [{"kind": "session-open", "offset": 0.0}]
        self._last = 0.0
        self._state = "idle"
        self._segment = 0.0
        self._delivered = 0.0
        self._played = False
        self._closed: dict | None = None

    # ── describing the stimulus ─────────────────────────────────────────────

    def signal(
        self,
        *,
        shape: str,
        hz: float | None = None,
        hz_min: float | None = None,
        hz_max: float | None = None,
        label: str | None = None,
    ) -> Signal:
        """Declare a signal: a point rate with `hz`, or a range with both bounds."""
        self._open("signal")
        _controlled("shape", shape, "shape")
        if shape == "sampled":
            raise SstimError(
                "a sampled signal must name the material it was sampled from, "
                "which this builder cannot yet record"
            )
        if hz is not None:
            if hz_min is not None or hz_max is not None:
                raise SstimError("pass hz for a point signal, or hz_min and hz_max for a range, not both")
            low = high = _number(hz, "hz")
        elif hz_min is not None and hz_max is not None:
            low, high = _number(hz_min, "hz_min"), _number(hz_max, "hz_max")
        else:
            raise SstimError("a signal needs its frequency: hz, or hz_min and hz_max")
        if low < 0 or low > high:
            raise SstimError(f"frequency extent must satisfy 0 <= hz_min <= hz_max, got {low} and {high}")
        rate = f"{_label(low)} Hz" if low == high else f"{_label(low)} to {_label(high)} Hz"
        signal = Signal(len(self._signals) + 1, low, high, shape, label or f"{rate} {shape}")
        self._signals.append(signal)
        return signal

    def channel(
        self,
        label: str,
        *,
        modality: str,
        medium: str | list[str],
        placement: str | list[str],
        signal: Signal,
        parameter: str,
        mechanism: str,
        carrier_hz: float | None = None,
    ) -> None:
        """Declare a channel that renders `signal` onto one parameter.

        `modality` is what is perceived ("visual"), `medium` what physically
        carries it ("visual-light"), and `placement` where it meets the body
        ("eyes"). The Full profile requires all three, and they are three
        different facts: a vibration can be felt, heard, or both.
        """
        self._open("channel")
        if not isinstance(label, str) or not label.strip():
            raise SstimError("a channel needs a non-empty label")
        if not isinstance(signal, Signal) or signal not in self._signals:
            raise SstimError("signal must be one returned by this session's signal()")
        _controlled("perceived", modality, "modality")
        media = _several("medium", medium, "medium")
        placements = _several("placement", placement, "placement")
        _controlled("parameter", parameter, "parameter")
        _controlled("mechanism", mechanism, "mechanism")
        carrier = None
        if carrier_hz is not None:
            if mechanism == "direct-presentation":
                raise SstimError(
                    "a directly presented rendering has no carrier: the signal "
                    "reaches the subject as itself"
                )
            carrier = _number(carrier_hz, "carrier_hz")
            if carrier <= 0:
                raise SstimError("carrier_hz must be positive")
        self._channels.append({
            "label": label, "modality": modality, "media": media,
            "placements": placements, "signal": signal, "parameter": parameter,
            "mechanism": mechanism, "carrier": carrier,
        })

    # ── what happened ───────────────────────────────────────────────────────

    def event(
        self,
        kind: str,
        *,
        at: float,
        parameter: str | None = None,
        before: float | None = None,
        after: float | None = None,
    ) -> None:
        """Record an occurrence at clock reading `at`, in the order it happened."""
        self._open("event")
        _controlled("event", kind, "event")
        if kind in RESERVED_EVENTS:
            raise SstimError(
                f"{kind!r} is not recorded by hand: session-open comes from the "
                "constructor, session-complete and session-interrupt from close(), "
                "and observation-collected needs an observation, which this "
                "builder does not record"
            )
        offset = self._offset(at)
        entry: dict = {"kind": kind, "offset": offset}
        if kind in CHANGE_EVENTS:
            if parameter is not None:
                _controlled("change", parameter, "parameter")
                entry["parameter"] = parameter
            if after is not None:
                entry["after"] = _number(after, "after")
            if before is not None:
                entry["before"] = _number(before, "before")
            if kind == "parameter-changed" and ("parameter" not in entry or "after" not in entry):
                raise SstimError(
                    "a parameter-changed event must say which parameter and its new "
                    "value (parameter=, after=): a mark with no content cannot be "
                    "replayed"
                )
        elif parameter is not None or before is not None or after is not None:
            raise SstimError(
                "parameter, before and after belong to parameter-changed and "
                f"safety-limit-applied events, not to {kind!r}"
            )

        state = self._state
        if kind == "playback-start":
            if state in ("delivering", "paused"):
                raise SstimError(f"playback-start while playback is {state}")
            self._state, self._segment = "delivering", offset
        elif kind == "playback-pause":
            if state != "delivering":
                raise SstimError(f"playback-pause while playback is {state}")
            self._delivered += offset - self._segment
            self._state = "paused"
        elif kind == "playback-resume":
            if state != "paused":
                raise SstimError(f"playback-resume while playback is {state}")
            self._state, self._segment = "delivering", offset
        elif kind == "playback-stop":
            if state not in ("delivering", "paused"):
                raise SstimError(f"playback-stop while playback is {state}")
            if state == "delivering":
                self._delivered += offset - self._segment
            self._state = "stopped"
        if kind.startswith("playback-"):
            self._played = True
        self._events.append(entry)

    def close(
        self,
        *,
        at: float,
        completed: bool,
        ended_at: datetime | str | None = None,
        delivered: float | None = None,
    ) -> None:
        """End the session at clock reading `at`.

        `completed` is the one thing only you know: whether the run delivered
        what it planned. Elapsed time comes from the clock, rounded up to whole
        seconds as the model requires; delivered time is summed from the
        playback events, unless you pass `delivered=` yourself.
        """
        self._open("close")
        if not isinstance(completed, bool):
            raise SstimError("completed must be True or False")
        offset = self._offset(at)
        if self._state == "delivering":
            self._delivered += offset - self._segment
        # Elapsed is whole seconds and rounded UP from the lexical offset, so
        # delivered (decimal) can never exceed it by rounding alone.
        elapsed = int(Decimal(_lexical(offset)).to_integral_value(rounding=ROUND_CEILING))
        if delivered is not None:
            value = _number(delivered, "delivered")
            if value < 0 or value > elapsed:
                raise SstimError(
                    f"delivered must be between 0 and the elapsed {elapsed} s: a "
                    "session cannot deliver more stimulus than it ran"
                )
        elif self._played:
            value = min(self._delivered, float(_lexical(offset)))
        else:
            value = None
        if completed:
            status = "completed"
        else:
            played = value if value is not None else offset
            status = "interrupted" if played / self._duration > 0.3 else "abandoned"
        ended = _instant(ended_at, "ended_at") if ended_at is not None else datetime.now(timezone.utc)
        if _milliseconds(ended) <= _milliseconds(self._started):
            raise SstimError("ended_at must be later than started_at, at millisecond precision")
        self._events.append({"kind": "session-complete" if completed else "session-interrupt", "offset": offset})
        self._closed = {"elapsed": elapsed, "delivered": value, "status": status, "ended": ended}

    # ── output ──────────────────────────────────────────────────────────────

    def graph(self) -> Graph:
        """The record as an rdflib Graph. Structurally checked, not SHACL-validated."""
        if self._closed is None:
            raise SstimError("close() the session first: a record without its end is incomplete")
        closed = self._closed
        g = Graph()
        for prefix, namespace in (
            ("", self._base), ("sstim", SSTIM), ("sstim-v", SSTIM_V),
            ("sstim-ex", SSTIM_EX), ("prov", PROV), ("dct", DCTERMS),
        ):
            g.bind(prefix, namespace)

        def node(name: str) -> URIRef:
            return URIRef(self._base + name)

        preset, plan, session, stimulus = node("preset"), node("plan"), node("session"), node("stimulus")

        g.add((preset, RDF.type, SSTIM.Preset))
        g.add((preset, RDFS.label, Literal(f"Configuration used for {self._label}")))

        g.add((plan, RDF.type, SSTIM.SessionSpecification))
        g.add((plan, RDF.type, PROV.Plan))
        g.add((plan, RDFS.label, Literal(f"Plan for {self._label}")))
        g.add((plan, DCTERMS.created, _date_time(self._created)))
        g.add((plan, SSTIM.referencesPreset, preset))
        g.add((plan, SSTIM.durationSeconds, _integer(self._duration)))
        g.add((plan, SSTIM.masterVolume, _decimal(self._volume)))
        if self._brightness is not None:
            g.add((plan, SSTIM.masterBrightness, _decimal(self._brightness)))
        g.add((plan, SSTIM.hasReproducibilityLevel, self._reproducibility))
        if self._digest is not None:
            g.add((plan, SSTIM.configurationDigest, Literal(self._digest)))
            g.add((plan, SSTIM.digestAlgorithm, Literal(self._digest_algorithm)))

        g.add((session, RDF.type, SSTIM.SessionInstance))
        g.add((session, RDFS.label, Literal(self._label)))
        g.add((session, SSTIM.usesSpecification, plan))
        g.add((session, SSTIM.actualDurationSeconds, _integer(closed["elapsed"])))
        g.add((session, SSTIM.completionStatus, Literal(closed["status"])))
        g.add((session, PROV.startedAtTime, _date_time(self._started)))
        g.add((session, PROV.endedAtTime, _date_time(closed["ended"])))
        g.add((session, SSTIM.clockOriginSeconds, _decimal(self._origin)))
        g.add((session, SSTIM.hasTimingAuthority, self._timing))
        if closed["delivered"] is not None:
            g.add((session, SSTIM.deliveredDurationSeconds, _decimal(closed["delivered"])))
        # The session-level modality scheme is coarser than the channel's
        # perceived modality, and only shared notations are carried across:
        # "tactile" is not silently promoted to "somatosensory".
        for channel in self._channels:
            if channel["modality"] in CONTROLLED["modality"]:
                g.add((session, SSTIM.hasDeliveryModality, _controlled("modality", channel["modality"], "modality")))

        for index, entry in enumerate(self._events, start=1):
            event = node(f"event-{index}")
            g.add((session, SSTIM.hasSessionEvent, event))
            g.add((event, RDF.type, SSTIM.SessionEvent))
            g.add((event, SSTIM.hasEventType, _controlled("event", entry["kind"], "event")))
            g.add((event, SSTIM.sessionClockOffsetSeconds, _decimal(entry["offset"])))
            if "parameter" in entry:
                g.add((event, SSTIM.hasChangedParameter, _controlled("change", entry["parameter"], "parameter")))
            if "before" in entry:
                g.add((event, SSTIM.parameterValueBefore, _decimal(entry["before"])))
            if "after" in entry:
                g.add((event, SSTIM.parameterValueAfter, _decimal(entry["after"])))

        # A record with no channel says nothing about the stimulus, so it
        # carries no stimulus specification rather than an empty one.
        if self._channels:
            g.add((preset, SSTIM.specifiedBy, stimulus))
            g.add((stimulus, RDF.type, SSTIM.StimulusSpecification))
            g.add((stimulus, RDFS.label, Literal(self._stimulus_label)))
            g.add((stimulus, SSTIM.stimulusRegime, Literal(self._regime)))
            for signal in self._signals:
                sig = node(f"signal-{signal.index}")
                g.add((stimulus, SSTIM.hasSignal, sig))
                g.add((sig, RDF.type, SSTIM.StimulationSignal))
                g.add((sig, RDFS.label, Literal(signal.label)))
                g.add((sig, SSTIM.hasSignalShape, _controlled("shape", signal.shape, "shape")))
                g.add((sig, SSTIM.hzMin, _decimal(signal.hz_min)))
                g.add((sig, SSTIM.hzMax, _decimal(signal.hz_max)))
            for index, channel in enumerate(self._channels, start=1):
                chan, rendering = node(f"channel-{index}"), node(f"rendering-{index}")
                mechanism = channel["mechanism"]
                g.add((stimulus, SSTIM.hasStimulusChannel, chan))
                g.add((chan, RDF.type, SSTIM_EX.StimulusChannel))
                g.add((chan, RDFS.label, Literal(channel["label"])))
                g.add((chan, SSTIM_EX.perceivedModality, _controlled("perceived", channel["modality"], "modality")))
                for medium in channel["media"]:
                    g.add((chan, SSTIM_EX.deliveryMedium, _controlled("medium", medium, "medium")))
                for placement in channel["placements"]:
                    g.add((chan, SSTIM_EX.hasBodyPlacement, _controlled("placement", placement, "placement")))
                if OPTICAL_RADIATION.intersection(channel["media"]):
                    g.add((chan, SSTIM_EX.hasComfortBoundary, SSTIM_EX.boundaryOpticalRadiation))
                g.add((chan, SSTIM.hasSignalRendering, rendering))
                g.add((rendering, RDF.type, SSTIM.SignalRendering))
                g.add((rendering, RDFS.label, Literal(
                    f"{channel['label']}: {mechanism} onto {channel['parameter']}"
                )))
                g.add((rendering, SSTIM.rendersSignal, node(f"signal-{channel['signal'].index}")))
                g.add((rendering, SSTIM.rendersOntoParameter, _controlled("parameter", channel["parameter"], "parameter")))
                g.add((rendering, SSTIM.hasRenderingMechanism, _controlled("mechanism", mechanism, "mechanism")))
                g.add((rendering, SSTIM.hasRenderingPresence, SSTIM_V[
                    "presencePerceptual" if mechanism in PERCEPTUAL_MECHANISMS else "presencePhysical"
                ]))
                if channel["carrier"] is not None:
                    g.add((rendering, SSTIM.renderingCarrierHz, _decimal(channel["carrier"])))
        return g

    def to_turtle(self) -> str:
        """The record as Turtle. Structurally checked, not SHACL-validated:
        use `write`, or `validate` yourself, before publishing it."""
        return self.graph().serialize(format="turtle")

    def validate(self, *, profile: str = "full", **resolve):
        """Validate the record; `resolve` is passed on to `sstim.validate`."""
        from ._validate import validate

        return validate(self.graph(), profile=profile, **resolve)

    def write(self, path: str | Path, *, profile: str = "full", **resolve):
        """Validate, then write Turtle to `path`. Writes nothing if it fails."""
        report = self.validate(profile=profile, **resolve)
        if not report.ok:
            raise SstimError(f"not written: the record does not validate\n{report}")
        Path(path).write_text(self.to_turtle(), encoding="utf-8")
        return report

    # ── internals ───────────────────────────────────────────────────────────

    def _open(self, call: str) -> None:
        if self._closed is not None:
            raise SstimError(f"{call}() after close(): the record is already complete")

    def _offset(self, at) -> float:
        offset = _number(at, "at") - self._origin
        if offset < 0:
            raise SstimError(f"at={at} is before the clock origin {self._origin}")
        if offset < self._last:
            raise SstimError(f"at={at} is earlier than the previous event: record events in order")
        self._last = offset
        return offset
