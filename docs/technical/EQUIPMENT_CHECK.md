# Equipment check — design

Status: **design, not implemented.** No route, store or component exists yet.

BSC Lab's output depends on hardware it cannot see. A reversed headphone cable
silently destroys every binaural preset; a phone speaker rolls off below ~300 Hz
and simply omits a 100 Hz carrier; a 60 Hz display cannot render a 40 Hz flicker
at all. The engines are verified end to end (`make audio-verify`) — the delivery
path past `AudioContext.destination` is not.

This document specifies a user-facing check suite that measures what can be
measured, asks what cannot, and records the outcome as RDF the rest of the
system can act on.

## Principles

**1. Equipment, never people.** Every result is a statement about the
reproduction chain, never about the user. The result vocabulary is
`reproduced` / `not reproduced` / `not tested` — never "you can/cannot hear".
This is the §3.5 regulatory boundary, and it is structural rather than a copy
guideline: there is no field in which a sensory finding about a person could be
stored. A check a user "fails" means *this equipment did not reproduce this
stimulus here*, which is also the only conclusion the data supports.

**2. The suite never gates the app.** A check that must be passed to continue
would exclude Deaf and hard-of-hearing users from the visual layer, and blind
users from the audio layer, on the basis of tests about neither. Every modality
is independently skippable; skipping yields `not tested`, which is a first-class
result, not a failure; and nothing in the app is withheld because of it. What a
skip costs is advice, not access — the app simply cannot warn you that your
headphones are reversed if you did not run the check.

**3. Every test states what it does not tell you.** A user who cannot hear a
10 Hz beat has learnt something about their headphones and nothing about their
brain. The UI says so, per test.

**4. Subjective results need catch trials.** A sequence of "did you hear it?"
prompts that a user clicks through produces confident, worthless capability
assertions. Each subjective block includes at least one **silent trial**, where
the correct answer is "nothing", and the channel-identity block includes a
repeated pair. A failed catch trial does not accuse the user of anything — it
invalidates the block, which is re-offered once and otherwise recorded as
`not tested`. Without this the RDF is worse than absent, because downstream
consumers would trust it.

**5. Results are recorded, not just displayed.** A check that produces a
transient green tick is a gadget. `sstim-exposure.ttl` already defines
`sstim-ex:DeviceCapability` with 30 individuals — `capabilityHeadphones`,
`capabilityStereoSeparation`, `capabilityHrtfSpatialAudio`,
`capabilityDisplayFlicker`, `capabilityDisplayLightOutput`,
`capabilityHapticActuator`, `capabilityPhoneVibration` — and
`sstim-ex:requiresDeviceCapability` to link a profile or channel to them.

**6. Capability assertions go stale, so they carry a scope.** Headphones get
swapped, users move from a desk to a phone, a browser updates. An assertion that
outlives its equipment is worse than none. Each recorded set carries the
timestamp, the user agent, `sampleRate` and `outputLatency`, and the selected
audio engine. When the automatic pass detects any of those changed, the
subjective results are marked stale and the user is asked whether the equipment
is the same — one question, not a re-run.

**7. Safety gates bind.** Anything flickering goes through
[`flashSafety.js`](../../src/ui/safety/flashSafety.js) (`FLASH_SAFE_MAX_HZ = 3`,
peak provocation band 15–25 Hz) behind the existing `PhotosensitivityAdvisory`.
A test probing the maximum renderable flicker rate must not itself sweep through
15–25 Hz unless the user has explicitly accepted that band.

## What happens when a check fails

A capability that is absent or `not tested` never blocks playback. It changes
what the app *says*, in one of three ways:

| Outcome | Behaviour |
|---|---|
| A patch requires a capability recorded as `not reproduced` | Warn before playback, name the specific mismatch ("this patch is built on a binaural beat and this output was reported as speakers"), offer to continue |
| Required capability is `not tested` | Silent; offer the relevant check as a one-line prompt, never a modal |
| An automatic check fails (no output, underruns) | Surface in Settings with the concrete remedy — switch engine, close other tabs |

Refusing to play would be both paternalistic and wrong: the user may have
reasons the app cannot see, and the check itself may be mistaken.

## Automatic checks

No user judgement. One pass, and cheap enough to re-run silently before a
session to detect equipment change (principle 6).

| Check | Method | Asserts |
|---|---|---|
| Engine capability | `detectAudioCapabilities()` | Web Audio / AudioWorklet / WASM — already shown in Settings §02 |
| Output path integrity | Render a coherent tone, capture through a recorder worklet, verify frequency and level | The chain from engine to graph output works at all |
| Channel independence | Capture a `BinauralBeat`, measure each ear's tone in the opposite channel | Catches an engine-side or graph-side mix. `make audio-verify` measures better than −189 dB, so anything near it is a real fault |
| Render-thread health | `AudioContext.renderCapacity` — `averageLoad`, `peakLoad`, `underrunRatio` over 10 s | Whether this machine can hold the selected engine. Chromium only; degrade honestly elsewhere |
| Output latency | `ctx.outputLatency`, `ctx.baseLatency` | Reported as-is, and used as a wireless-output heuristic (below) |
| Display refresh | rAF interval histogram over ~2 s | Refresh rate and its stability |
| Renderable flicker set | Derived from refresh (below) | Which target bands the visual layer can honestly produce |
| Vibration presence | `typeof navigator.vibrate === 'function'` | Never a truthy check — iOS Safari returns `undefined`, not `false` |

The first three are a direct port of `scripts/audio-verify/harness.html`, which
already does all of it against the real engines.

### Renderable flicker rates

A flicker rate `F` is exactly renderable on a display of refresh `R` only when
`R / F` is an integer. Duty cycle may be uneven; the *rate* cannot be.

On a 60 Hz display: 10 Hz (`alpha-10`) gives 6 frames per cycle and is exact.
20 Hz gives 3 frames — exact rate, 67/33 duty. **40 Hz (`gamma-40`) gives 1.5
frames and is not renderable at all**; attempting it produces beating at a
subharmonic, not a 40 Hz stimulus. It needs a 120 Hz display.

`gamma-40` is one of the platform's named bands (CLAUDE.md §4.3), so this is not
hypothetical. The visual layer must not offer a rate the display cannot produce,
and this check is what tells it which those are.

### Wireless output heuristic

Bluetooth adds 100–300 ms of latency, and some codecs apply joint-stereo coding
that partially collapses the channel independence binaural beats depend on. The
app cannot query the transport, but a high `ctx.outputLatency` is a good proxy.
Report it as a caution, not a verdict.

## Checks that need the user

Ordered by how much they protect.

### 1. Channel identity and polarity

Four assertions in one short sequence, because a single "left or right?" prompt
is weaker than it looks:

1. Tone in left only → expect "left"
2. Tone in right only → expect "right"
3. Both channels in phase → expect "centred, one sound"
4. Both channels, one inverted → expect "wide, hollow, or hard to locate"

Steps 1–2 catch reversed wiring, a dead channel, and an OS mono downmix; 3–4
catch inverted polarity and confirm real separation rather than two speakers
sitting close together. Include one repeat trial as the catch (principle 4).
Assert `capabilityStereoSeparation`.

*Does not tell you:* anything about hearing in either ear. A user who reports
both tones on one side has a wiring or downmix problem, which is the only claim
made.

**Build this first.** It protects every binaural preset in the catalog, and it
is the failure the system is most blind to.

### 2. Headphones or speakers

Cannot be detected; must be asked. Over speakers the two ear signals sum
acoustically and a binaural beat is physically a different stimulus. Assert or
withhold `capabilityHeadphones`.

### 3. Level calibration

Play a reference tone at the level a session will actually use and ask the user
to set system volume so it is *clearly audible and comfortable*. Pair it with the
measured digital peak so the app can state the headroom it works with — six
voices at studio-typical gains measure −2.4 dBFS.

*Does not tell you:* a sound pressure level. Without a calibrated microphone the
app knows its own digital level and nothing about what reaches the ear. Say so
plainly; this is the test most likely to be over-read.

### 4. Low-frequency reproduction

**Discrete tones, not a sweep.** Present 40, 60, 80, 100, 150, 200 and 300 Hz in
shuffled order, each "audible / not audible", with one silent catch trial. A
descending sweep with "mark where it stops" conflates transducer rolloff with
reaction time and attention, and yields a single soft number instead of a clean
per-frequency result.

The outcome is a lowest reliably reproduced frequency, which decides whether a
preset's carrier is valid here: a 100 Hz carrier on a phone speaker is not quiet,
it is absent.

*Does not tell you:* the user's low-frequency hearing threshold. The result is a
property of the transducer, confounded with the room and the volume setting.

### 5. Beat and pulse perception

A 10 Hz binaural beat and a 10 Hz isochronic train; is the pulsation perceptible,
and does it sound steady? Machine-side jitter measures 0.000 ms, so an unsteady
report points at Bluetooth buffering or system load — both invisible to the app
and both real.

### 6. Audio-visual synchrony

The platform is audiovisual and the three-clock architecture exists to keep those
aligned, yet nothing detects a mismatch at the device. Present a simultaneous
click and flash, ask whether they coincide, offer a coarse adjustment. Wireless
audio is the usual cause and the one the user can act on.

### 7. Colour and luminance

Colour patches and a contrast ramp confirm the display is not in a night-shift,
greyscale, or aggressive power-saving mode silently altering visual stimuli.
Assert `capabilityDisplayLightOutput`.

## Storage and scope

Capability sets are **local-first**, in the same store as other client state, and
are attached to a session only when a session is recorded. They describe hardware
and a browser, not a person, but they are still a device fingerprint of moderate
specificity — so they follow the existing private-sync boundary rather than
becoming public session metadata by default, and the Settings data section must
be able to clear them like anything else.

## Where it goes

Settings already has five numbered sections (`appearance`, `audio`, `visual`,
`data`, `instance`). The automatic pass belongs as a sixth, "Equipment check".
The user-judgement sequence wants its own route — it is a guided flow with audio
playing and catch trials, not a settings panel.

RDF emission should follow the precedent in
[`exposureProfile.js`](../../src/ui/field/exposureProfile.js): a pure
`equipmentCheckToQuads(state, opts)` building `sstim-ex:DeviceCapability`
assertions, with a `.shacl.test.js` beside it validating against the exposure
shapes — the pattern CLAUDE.md §5.4 requires of any new RDF-emitting surface.

## Suggested order

1. Automatic pass (output integrity, channel independence, latency, refresh and
   renderable flicker set, render capacity) — mostly a port of the existing
   harness, and the prerequisite for staleness detection.
2. Channel identity and polarity, with catch trials.
3. Headphones or speakers.
4. Level calibration.
5. Audio-visual synchrony.
6. Low-frequency tones, beat perception, colour — under the flash-safety gate.
