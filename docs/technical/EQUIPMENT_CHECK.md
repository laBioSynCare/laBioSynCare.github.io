# Equipment check — design

Status: **design, not implemented.** No route, store or component exists yet.

BSC Lab's output depends on hardware it cannot see. A reversed headphone cable
silently destroys every binaural preset; a phone speaker rolls off below ~300 Hz
and simply omits a 100 Hz carrier; a 60 Hz display cannot render a 40 Hz
flicker at all. The engines are verified (`make audio-verify`) — the delivery
path is not.

This document specifies a user-facing check suite that measures what can be
measured, asks what cannot, and records the outcome as RDF the rest of the
system can act on.

## Principles

**1. Equipment, never people.** Every result is a statement about the
reproduction chain, never about the user. The result vocabulary is
`reproduced` / `not reproduced` / `not tested` — never "you can/cannot hear".
This is the §3.5 regulatory boundary, and it is structural, not a copy
guideline: there is no field in which a sensory finding about a person could be
stored. A check that a user fails means *this equipment did not reproduce this
stimulus here*, which is also the only conclusion the data supports.

**2. Every test states what it does not tell you.** A user who cannot hear a
10 Hz beat has learnt something about their headphones, and nothing about their
brain. The UI says so, per test.

**3. Results are recorded, not just displayed.** A check that produces a
transient green tick is a gadget. `sstim-exposure.ttl` already defines
`sstim-ex:DeviceCapability` with 30 individuals — `capabilityHeadphones`,
`capabilityStereoSeparation`, `capabilityHrtfSpatialAudio`,
`capabilityDisplayFlicker`, `capabilityDisplayLightOutput`,
`capabilityHapticActuator`, `capabilityPhoneVibration` — and
`sstim-ex:requiresDeviceCapability` to link a profile or channel to them. The
suite asserts a capability set; a patch declares what it requires; the Logbook
attaches the set to a session. "Did it work on your gear?" becomes session
metadata instead of a support question.

**4. Safety gates bind.** Anything flickering goes through
[`flashSafety.js`](../../src/ui/safety/flashSafety.js) (`FLASH_SAFE_MAX_HZ = 3`,
peak provocation band 15–25 Hz) behind the existing `PhotosensitivityAdvisory`.
A test that probes the maximum renderable flicker rate must not itself sweep
through 15–25 Hz unless the user has explicitly accepted that band.

## Automatic checks

No user judgement. These run in one pass and can also run silently before a
session.

| Check | Method | Asserts |
|---|---|---|
| Engine capability | `detectAudioCapabilities()` | Web Audio / AudioWorklet / WASM — already shown in Settings §02 |
| Output path integrity | Render a coherent tone, capture through a recorder worklet, verify frequency and level | The chain from engine to graph output works at all |
| Channel independence | Capture a `BinauralBeat`, measure each ear's tone in the opposite channel | Catches an engine-side or graph-side mix; the harness in `scripts/audio-verify/` measures better than −189 dB |
| Render-thread health | `AudioContext.renderCapacity` — `averageLoad`, `peakLoad`, `underrunRatio` over 10 s | Whether this machine can hold the selected engine. Chromium only; degrade honestly elsewhere |
| Output latency | `ctx.outputLatency`, `ctx.baseLatency` | Reported as-is, and used as a wireless-output heuristic (see below) |
| Display refresh | rAF interval histogram over ~2 s | Refresh rate and its stability |
| Renderable flicker set | Derived from refresh (below) | Which target bands the visual layer can honestly produce |
| Vibration presence | `typeof navigator.vibrate === 'function'` | Never a truthy check — iOS Safari returns `undefined`, not `false` |

### Renderable flicker rates

A flicker rate `F` is exactly renderable on a display of refresh `R` only when
`R / F` is an integer. Duty cycle may be uneven; the *rate* cannot be.

On a 60 Hz display: 10 Hz (`alpha-10`) gives 6 frames per cycle and is exact.
20 Hz gives 3 frames — exact rate, 67/33 duty. **40 Hz (`gamma-40`) gives 1.5
frames and is not renderable at all**; attempting it produces beating at a
subharmonic, not a 40 Hz stimulus. It needs a 120 Hz display.

`gamma-40` is one of the platform's named bands (CLAUDE.md §4.3), so this is not
hypothetical. The visual layer must not offer a rate the display cannot produce,
and the check is what tells it which those are. This is the strongest argument
for running the automatic pass before a session rather than only on demand.

### Wireless output heuristic

Bluetooth adds 100–300 ms of latency, and some codecs apply joint-stereo coding
that partially collapses the channel independence binaural beats depend on. The
app cannot query the transport, but a high `ctx.outputLatency` is a good proxy.
Report it as a caution, not a verdict.

## Checks that need the user

These are the ones no measurement can replace, ordered by how much they protect.

### 1. Channel identity and polarity

Four assertions in one short sequence, because a single "left or right?" prompt
is weaker than it looks:

1. Tone in left only → "left"
2. Tone in right only → "right"
3. Both channels in phase → "centred, one sound"
4. Both channels, one inverted → "wide, hollow, or hard to locate"

Steps 1–2 catch reversed wiring, a dead channel, and an OS mono downmix.
Step 3–4 catch inverted polarity and confirm real stereo separation rather than
two speakers close together. Assert `capabilityStereoSeparation`.

*Does not tell you:* anything about hearing in either ear. A user who reports
both tones on one side has a wiring or downmix problem, which is the only claim
made.

**Build this first.** It protects every binaural preset in the catalog and it is
the failure the system is most blind to.

### 2. Headphones or speakers

Cannot be detected; must be asked. Gates whether binaural presets are meaningful
at all — over speakers the two ear signals sum acoustically and the beat is
physically different. Assert or withhold `capabilityHeadphones`.

### 3. Level calibration

Play a reference tone at the level a session will actually use and ask the user
to set system volume so it is *clearly audible and comfortable*. Pair it with the
measured peak so the app can state the headroom it is working with — six voices
at studio-typical gains measure −2.3 dBFS.

*Does not tell you:* a sound pressure level. Without a calibrated microphone the
app knows its own digital level and nothing about what reaches the ear. Say so.

### 4. Low-frequency reproduction

A descending sweep, user marks where the tone stops being audible. Phone
speakers roll off around 300 Hz; laptop speakers not much lower. This determines
whether a preset's carrier choice is valid on this equipment — a 100 Hz carrier
on a phone speaker is not quiet, it is absent.

*Does not tell you:* the user's low-frequency hearing threshold. The result is a
property of the transducer.

### 5. Beat and pulse perception

Play a 10 Hz binaural beat and a 10 Hz isochronic train; ask whether the
pulsation is perceptible and whether it sounds steady. Machine-side jitter is
already 0.000 ms, so an unsteady report points at Bluetooth buffering or system
load — both invisible to the app and both real.

### 6. Audio-visual synchrony

The platform is audiovisual, and the three-clock architecture exists to keep
those aligned. Present a simultaneous audio click and visual flash, ask whether
they coincide, and offer a coarse adjustment. Wireless audio is the usual cause
of a mismatch and the one the user can act on (switch to wired).

This check is missing from any current plan and is the most likely source of a
degraded session that nothing else would detect.

### 7. Colour and luminance

Colour patches and a contrast ramp confirm the display is not in a night-shift,
greyscale, or aggressive power-saving mode silently altering visual stimuli.
Assert `capabilityDisplayLightOutput`.

## Where it goes

Settings already has five numbered sections (`appearance`, `audio`, `visual`,
`data`, `instance`). The automatic pass belongs as a sixth, "Equipment check";
the user-judgement sequence wants its own route — it is a guided flow with
audio playing, not a settings panel.

RDF emission should follow the precedent in
[`exposureProfile.js`](../../src/ui/field/exposureProfile.js): a pure
`equipmentCheckToQuads(state, opts)` building `sstim-ex:DeviceCapability`
assertions, with a `.shacl.test.js` beside it validating the output against the
exposure shapes — the pattern CLAUDE.md §5.4 requires for any new RDF-emitting
surface.

## Suggested order

1. Automatic pass (output integrity, channel independence, latency, refresh and
   renderable flicker set, render capacity). Mostly a port of
   `scripts/audio-verify/harness.html`.
2. Channel identity and polarity.
3. Headphones or speakers.
4. Level calibration.
5. Audio-visual synchrony.
6. Low-frequency sweep, beat perception, colour — under the flash-safety gate.
