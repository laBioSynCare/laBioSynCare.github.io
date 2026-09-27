# SSTIM from the tools you already run

Three short examples that record a stimulation block as an SSTIM session, each
from a tool researchers already use. The tool does what it always did; the
`session` calls are the only SSTIM in them.

| File | Tool | Records | Clock |
|---|---|---|---|
| [`psychopy_flicker.py`](psychopy_flicker.py) | PsychoPy | 60 s of 10 Hz flicker on a small disc | PsychoPy's monotonic clock |
| [`jspsych-assr.js`](jspsych-assr.js) | jsPsych | 60 s of a 1 kHz tone amplitude-modulated at 40 Hz | jsPsych's AudioContext, the audio hardware |
| [`lsl_markers.py`](lsl_markers.py) | Lab Streaming Layer | 10 min of 40 Hz light from goggles, converted from an XDF recording's markers | LSL's clock |

All three use the session builder in the SSTIM clients:
`sstim.Session` in Python, `Session` from `@sstim/core/session` in JavaScript.
They are the same builder, call for call, and emit the same triples.

```python
session = sstim.Session("https://example.org/lab/run-001/",
                        label="10 Hz flicker block", duration=60, master_volume=0.0,
                        timing="monotonic-substitute", clock=core.getTime())
flicker = session.signal(hz=10.0, shape="square")
session.channel("2 degree disc, screen", modality="visual", medium="visual-light",
                placement="eyes", signal=flicker, parameter="luminance",
                mechanism="direct-presentation")
session.event("playback-start", at=core.getTime())
session.close(at=core.getTime(), completed=True)
session.write("run-001.ttl")          # validates against Full first; writes nothing if it fails
```

## What the builder does for you

- **Offsets.** Pass readings of your own clock; the builder subtracts the
  origin. Say which clock it is: `"audio-hardware"` for an AudioContext,
  `"monotonic-substitute"` for anything else.
- **Delivered and elapsed time.** Delivered time is summed from the playback
  events, so a paused block is not mistaken for a short one. Elapsed time is
  rounded up to whole seconds, as the model requires.
- **Refusals at the call.** A carrier on a directly presented flicker, a planned
  duration outside 60 to 7200 s, a parameter change with no new value: each
  fails where you wrote it, with the reason, not later in a validator.
- **Nothing about the participant.** No identifier, no observation, no free
  text.

## What these examples do not do

They are examples, not plugins. A packaged plugin that writes SSTIM without its
user reading any of this needs a stimulus component that both presents a
stimulus and describes it, and that waits for a lab to say which tool it runs
([ADOPTION.md](../../docs/ecosystem/ADOPTION.md) §3 D, which also ranks the
candidate tools).

The visual examples flicker above the WCAG 2.3.1 general flash threshold. That
is ordinary in steady-state research and still needs participant screening;
see [PHOTOSENSITIVITY_SAFETY.md](../../docs/technical/PHOTOSENSITIVITY_SAFETY.md).

## They are tested

`make sstim-package` runs the two Python examples and `make test` the jsPsych
one, each against a small stand-in for its tool, and validates what they write
against the frozen Full profile. The stand-ins mean what is tested is the
record, not PsychoPy, jsPsych or pyxdf themselves.

## Before 0.2.0 is published

The builder ships in `sstim` 0.2.0 and `@sstim/core` 0.2.0. Until those are on
PyPI and npm, run the examples from this repository with
`PYTHONPATH=packages/sstim/src`, and the jsPsych page's import map will not
resolve.

Why these three, what the builder refuses and why, and the five gaps in the
model it ran into: [ADR 0058](../../docs/decisions/0058-session-builder-in-the-clients.md).
