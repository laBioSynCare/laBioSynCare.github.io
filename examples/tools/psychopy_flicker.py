"""A 10 Hz flicker block in PsychoPy, recorded as an SSTIM session.

Everything SSTIM-specific is the `session` calls; the rest is an ordinary
PsychoPy frame loop. The readings come from PsychoPy's monotonic clock, which
is not the clock of any audio device, and the record says so.

Flicker above 3 Hz exceeds the WCAG 2.3.1 general flash threshold. Screen
participants for photosensitive epilepsy before running this; see
docs/technical/PHOTOSENSITIVITY_SAFETY.md.

    pip install psychopy sstim
    python psychopy_flicker.py        # writes flicker-001.ttl if it validates
"""

from pathlib import Path

from psychopy import core, event, visual

import sstim

DURATION = 60        # seconds; an SSTIM session plans 60 to 7200
TARGET_HZ = 10.0


def run():
    win = visual.Window(units="deg", monitor="testMonitor", color="black")
    disc = visual.Circle(win, radius=1.0, fillColor="white", lineColor=None)
    refresh = win.getActualFrameRate()
    if refresh is None:  # an assumed 60 Hz would be recorded as a delivered rate
        win.close()
        raise SystemExit("could not measure the display's refresh rate")
    frames = max(2, round(refresh / TARGET_HZ))  # frames per flicker cycle

    session = sstim.Session(
        "https://example.org/lab/flicker-001/",  # your namespace, one per run
        label="10 Hz flicker block", duration=DURATION, master_volume=0.0,
        timing="monotonic-substitute", clock=core.getTime(),
    )
    # Record the rate the display can produce, not the one that was asked for.
    flicker = session.signal(hz=refresh / frames, shape="square")
    session.channel("2 degree disc, screen", modality="visual",
                    medium="visual-light", placement="eyes", signal=flicker,
                    parameter="luminance", mechanism="direct-presentation")

    completed = True
    for frame in range(int(DURATION * refresh)):
        if frame % frames < frames // 2:
            disc.draw()
        win.flip()
        if frame == 0:
            session.event("playback-start", at=core.getTime())
        if event.getKeys(["escape"]):
            completed = False
            break
    session.close(at=core.getTime(), completed=completed)
    win.close()
    return session


if __name__ == "__main__":
    session = run()
    try:
        print(session.write("flicker-001.ttl"))
    except sstim.SstimError as error:  # offline on first use, or a real violation
        # A run is not free to repeat: keep it, marked, rather than lose it.
        Path("flicker-001.unvalidated.ttl").write_text(session.to_turtle(), encoding="utf-8")
        raise SystemExit(f"kept as flicker-001.unvalidated.ttl: {error}")
