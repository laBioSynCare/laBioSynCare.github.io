"""Turn the stimulation markers in an LSL recording into an SSTIM session.

Lab Streaming Layer is where many tools already meet: PsychoPy, OpenSesame,
Unity and stimulation hardware send marker streams, and EEG labs record them
to XDF anyway. One converter therefore reaches every tool that sends markers.
What a marker cannot say is what the stimulus was, so that is declared here,
once per protocol.

The markers this expects, from whatever drove the stimulation:

    stim-start, stim-pause, stim-resume, stim-stop (ended early), stim-end

A 40 Hz light flicker exceeds the WCAG 2.3.1 general flash threshold; see
docs/technical/PHOTOSENSITIVITY_SAFETY.md.

    pip install pyxdf sstim
    python lsl_markers.py recording.xdf     # writes recording.ttl if it validates
"""

from datetime import datetime, timedelta
from pathlib import Path
import sys

import pyxdf

import sstim

EVENTS = {
    "stim-start": "playback-start", "stim-pause": "playback-pause",
    "stim-resume": "playback-resume", "stim-stop": "playback-stop",
}


def convert(path, stream="StimMarkers"):
    streams, header = pyxdf.load_xdf(path)
    markers = next(s for s in streams if s["info"]["name"][0] == stream)
    # Only this protocol's markers: a stream often carries others, and one
    # after stim-end must not turn a completed block into an interrupted one.
    marks = [(stamp, sample[0]) for stamp, sample in zip(markers["time_stamps"], markers["time_series"])
             if sample[0] in EVENTS or sample[0] == "stim-end"]
    stamps = [stamp for stamp, _ in marks]
    labels = [label for _, label in marks]

    # The XDF header dates the recording, and LSL times are seconds on one
    # monotonic clock, so stim-start's wall-clock time is the recording start
    # plus the LSL interval between them. It places the session in the
    # calendar; the offsets, not this, order what happened.
    recorded = datetime.strptime(header["info"]["datetime"][0], "%Y-%m-%dT%H:%M:%S%z")
    first = min(s["time_stamps"][0] for s in streams if len(s["time_stamps"]))
    opened = recorded + timedelta(seconds=stamps[0] - first)

    session = sstim.Session(
        f"https://example.org/lab/{Path(path).stem}/",  # your namespace
        label="40 Hz light, LED goggles", duration=600, master_volume=0.0,
        timing="monotonic-substitute", clock=stamps[0], started_at=opened,
    )
    light = session.signal(hz=40.0, shape="square")
    session.channel("LED goggles, both eyes", modality="visual",
                    medium="visual-light", placement="eyes", signal=light,
                    parameter="luminance", mechanism="direct-presentation")
    for stamp, label in marks:
        if label in EVENTS:
            session.event(EVENTS[label], at=stamp)
    session.close(at=stamps[-1], completed=labels[-1] == "stim-end",
                  ended_at=opened + timedelta(seconds=stamps[-1] - stamps[0]))
    return session


if __name__ == "__main__":
    source = Path(sys.argv[1])
    print(convert(source).write(source.with_suffix(".ttl")))
