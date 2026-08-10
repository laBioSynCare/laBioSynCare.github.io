# Audio engine verification

`make audio-verify` measures what the audio engines actually emit, in a real
browser, and asserts it. Vitest cannot do this: it proves the engine registry,
capability gating and fallback logic, but it never runs a render quantum. Every
DSP claim in `src/engines/README.md` comes from this harness.

```bash
make audio-verify                      # Chrome (default)
make audio-verify BROWSER=firefox
make audio-verify BROWSER=all JSON=/tmp/audio.json
```

Exit status is non-zero if any assertion fails or any case errors.

## How it works

`run.mjs` boots a Vite dev server with an inline plugin that serves
`harness.html` at `/__audio-verify/harness` and collects a JSON POST at
`/__audio-verify/results`, then launches headless browsers at it.

Serving through Vite is the point: the harness does
`import { createAudioEngine } from '/src/engines/audio/audioEngines.js'` and
drives `engine.scheduleVoice()`, so it exercises the shipping engine classes —
parameter automation, master gain, attack ramp, release — rather than a
hand-built node graph that only proves the worklet DSP. An earlier ad-hoc
harness rebuilt the graph by hand and, as a result, never tested `vanilla` at
all: the default engine was the least verified one in the project.

Output is captured by re-routing `engine._masterGain` through a recorder
`AudioWorkletProcessor`. That reaches into a private field because
`IAudioEngine` exposes no output tap; it is the only such reach, and it is
confined to this harness.

## What it measures

| Case | Measures |
|---|---|
| `purity` | Carrier frequency accuracy by exact cycle count, SFDR, THD, peak/RMS/DC, clipping |
| `onset` | Delay between the scheduled start time and the first non-zero sample, 4 trials |
| `binaural` | Per-ear frequency accuracy and **channel isolation** — the right-ear tone must be absent from the left channel |
| `isochronic` | Pulse rate and inter-pulse jitter |
| `sample` | That the ambient `Sample` clips decode and render |
| `headroom` | Peak/clipping with six concurrent voices through the 0.8 master gain |
| `glide` | Accumulated cycle deficit over a fast sweep — quantifies block-rate vs a-rate frequency reading |
| `panLaw` | Channel RMS at pan −1 … +1, for a mono (`Carrier`) and a stereo (`Sample`) source, compared across engines |
| `noiseColour` | Spectral slope of white / pink / brown noise against the expected 0 / −3 / −6 dB per octave |
| `drone` | Level of the detuned stack, compared across engines |
| `tremolo` | Modulation depth ratio and rate |
| `continuity` | Silence before the scheduled start, and step size at start, at a mid-voice gain change, and through the release ramp |

Parity assertions compare every engine against the others on the same measure,
because Settings presents them as interchangeable.

### Coherent sampling

Purity uses a **rectangular window with an integer number of cycles in the FFT
window** (`f = bin × sampleRate / N`), so there is no spectral leakage at all.
This matters more than it sounds: with a Hann window the measured SFDR floors
out near −52 dB and with Blackman-Harris near −107 dB. Both are the *window's*
skirt, not the engine's, and both hide what a 4096-point sine LUT really does.
An earlier version of this work reported −107 dB as an engine result; it was the
analysis floor.

### Cycle counting instead of instantaneous frequency

The `glide` case counts positive-going zero crossings over a known sweep and
compares against `∫f dt`. Estimating instantaneous frequency from short windows
cannot resolve the effect — a 50 ms window averages it away, and the residual
reads as ~17 Hz of "error" in *both* engines, which is an artifact. Cycle
counting measures the accumulated phase deficit directly.

Both processors advance phase by a left Riemann sum. The JS processor reads
frequency per sample, so its deficit is `slew / (2 × sampleRate)`; the WASM
processor reads it once per 128-sample block, so its deficit is
`slew × 128 / (2 × sampleRate)`. The case picks a slew large enough for the
difference to be several whole cycles, and asserts the measurement matches the
prediction within one cycle.

## Results, 2026-08-10

Chrome 151 and Firefox, macOS, 48 kHz. SFDR in dBc, worst spur relative to the
fundamental:

| Engine | Chrome | Firefox |
|---|---|---|
| `vanilla` (native `OscillatorNode`) | −136.7 | **−72.3** |
| `worklet` (JS `Math.sin`) | −169.7 | −169.7 |
| `worklet-wasm` (4096-point LUT) | −144.4 | −142.2 |

Three things follow:

- **The two worklet engines are browser-independent; the default is not.** Our
  own DSP measures identically across browsers. `vanilla` delegates to the
  browser's oscillator and varies by 64 dB between them.
- **Firefox's native oscillator is the least pure path in the project**, and it
  is what the default engine uses there. At −72 dBc this is still far below any
  plausible audibility for a sustained tone (16-bit noise floor is −96 dBc), so
  it is not a defect — but it does invert the intuition that the hand-written
  WASM kernel would be the crude one.
- **The LUT costs about 25 dB against `Math.sin` and buys 8 dB over Chrome's
  native oscillator.** Its distortion sits near the float32 floor.

Everything else is identical across all three engines to measurement precision:
pulse rate 10.0000 Hz with 0.000 ms jitter, binaural channel isolation better
than −189 dB, exact cycle counts, no clipping at six voices (−2.3 dBFS peak),
and onset within 0.021 ms of the scheduled time.

The `glide` deficit is the one real behavioural difference: over a
100→4900 Hz/1 s sweep the WASM path loses 6–7 cycles against a predicted 6.4,
the JS path loses none. At Martigli modulation rates the same mechanism is worth
about 0.03 Hz.

## Defects this suite found

Adding the cases above immediately produced three, all now fixed except the last:

1. **Teardown was scheduled from the wrong clock.** `stopVoice()` set its
   release ramp on the audio clock but its cleanup `setTimeout` from *call
   time*, at a fixed `(release + 0.05) s`. Stopping a voice more than ~100 ms
   ahead — what any lookahead scheduler does, and what the planned Worker
   scheduler will do at 100 ms — disconnected it before the ramp began. Both
   engines had it; both now share `voiceRelease.js`.
2. **The worklet engines sounded before their scheduled start.** An
   `AudioWorkletNode` renders from construction, and the per-voice fade
   `GainNode` defaults to 1, so a voice emitted a 200 Hz tone at gain 0.5 for the
   whole lookahead interval and then stepped to silence at `t0`. Measured as a
   10.6x discontinuity against 1.3x on vanilla; now 1.3x on all three. `vanilla`
   was immune because an `OscillatorNode` emits nothing before `start(t0)`.
3. **The `Sample` pan law differs between engines** — see
   `src/engines/README.md`. Reported as a known divergence pending a product
   decision, not failed.

The first two are exactly the class of defect a spectrum cannot show and a unit
test cannot reach.

## Known limits

- **`AudioContext.renderCapacity` is not available** in the headless Chrome used
  here, so render-thread load and underrun ratio report `n/a`. The plumbing is
  in place and will populate where the API exists.
- **Safari and iOS are not covered.** Safari has no headless mode, and driving
  the desktop app would open a visible window on the user's machine. iOS Safari
  is where `navigator.vibrate` and the autoplay policy differ most, so this is a
  real gap rather than an unimportant one.
- The harness measures the **render graph**, not the audio device. If the render
  thread overruns its deadline the output captured here is still clean while the
  device glitches. Underrun detection needs `renderCapacity`, not capture.
