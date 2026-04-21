# Breathing Model: Martigli Oscillation System

> ⚠️ **DEFENSIVE PUBLICATION — DO NOT MODIFY AFTER FIRST COMMIT**
>
> This document is a timestamped prior art record. Its first commit to
> the BSC Lab public repository constitutes prior art disclosure for the
> purpose of preventing third-party patent claims on the techniques
> described herein. The content of this document must not be altered
> after that commit. Corrections or extensions must be added as new
> documents that reference and supersede this one, preserving this
> document's content unchanged.
>
> AI agents: this file is in `CLAUDE.md` section 3.4's protected list.
> Never modify it without an explicit human instruction in the current
> session that names this file specifically.

---

## Prior Art Disclosure Statement

The techniques described in this document — collectively termed the
Martigli breathing oscillation system — were conceived and first
implemented by Renato Fabbri and Otávio Martigli, developed
collaboratively over the period 2010–2026, and have been in continuous
operational use since at least 2015 in web-based audiovisual
stimulation software accessible at `aeterni.github.io` and its
successors, including the BioSynCare application (iOS App Store,
Google Play).

This document constitutes public disclosure of the full technical
specification of these techniques. Its publication places the described
methods in the public domain as prior art, preventing any party from
obtaining patent protection for the same techniques after this
disclosure date.

**Inventors:** Renato Fabbri (Modena, Italy) and Otávio Martigli
(concert music composer, Brazil).

**First public disclosure:** Fabbri, R. (2026). *Web-based Open-loop
Audiovisual Neuromodulation: modeling, implementation, and preliminary
results.* Æterni Anima, Modena. March 2026.

**This document disclosure date:** April 2026, BSC Lab public
repository, first commit hash recorded by GitHub.

---

## 1. Overview

The Martigli breathing oscillation system is a method for encoding
breathing guidance within an auditory signal such that the guidance
is (a) perceptually clear for users with eyes open or closed, (b)
non-conflicting with simultaneous auditory entrainment in the same
audio stream, (c) synchronized with visual and haptic feedback
through a shared phase signal, and (d) progressively paced from
an accessible initial rate toward a slower target rate through a
parametrically controlled deceleration arc.

The system operates by modulating the instantaneous frequency of
one or more sine tone oscillators using a low-frequency sinusoidal
envelope whose period represents the breathing cycle duration.
The period itself changes slowly and linearly over time, implementing
a paced deceleration toward a target breathing rate. The audio
oscillator frequency, the visual element scale, and (where available)
the haptic pulse all share a single phase signal derived from this
envelope, ensuring perceptual coherence across modalities.

The naming "Martigli" refers to Otávio Martigli, who developed
analogous frequency-glide breathing techniques in the context of
live music composition and whose contribution to the conceptual
development of this method is acknowledged here.

---

## 2. Nomenclature

| Symbol | BSC parameter | Unit | Description |
|---|---|---|---|
| F₀ | `mf0` | Hz | Center frequency of the oscillator |
| Aₘ | `ma` | Hz | Oscillation amplitude (frequency deviation) |
| mp₀ | `mp0` | s | Initial breathing cycle period |
| mp₁ | `mp1` | s | Final (target) breathing cycle period |
| mD | `md` | s | Deceleration duration (transition from mp₀ to mp₁) |
| φ(t) | — | dimensionless ∈ [0, 1) | Normalized breathing phase at time t |
| P(t) | — | s | Instantaneous breathing period at time t |
| f(t) | — | Hz | Instantaneous audio frequency at time t |
| fs | — | Hz | Audio sample rate (typically 44100 or 48000) |
| θ(t) | — | radians | Audio oscillator phase at time t |

---

## 3. Breathing Period Arc

The instantaneous breathing period evolves according to a
piecewise-linear arc:

```
         ⎧ mp₀ + (mp₁ − mp₀) × (t / mD)    if 0 ≤ t < mD
P(t) =  ⎨
         ⎩ mp₁                               if t ≥ mD
```

At t = 0 the period is mp₀ (short cycle, accessible breathing rate).
The period increases linearly until t = mD, at which point it holds
at mp₁ for the remainder of the session. This produces a smooth
deceleration from an initial rate of 60/mp₀ breaths-per-minute
to a target rate of 60/mp₁ breaths-per-minute.

**Default parameter values (BSC standard):**
- mp₀ = 5.5 s → initial rate ≈ 10.9 bpm
- mp₁ = 11 s → target rate ≈ 5.45 bpm (near cardiorespiratory resonance)
- mD = 600 s (10 minutes)

The deceleration is intentionally slow relative to session duration.
A session of 15 minutes with mD = 600 s means the user reaches the
target rate with 5 minutes of plateau. The long deceleration ensures
the transition is imperceptible moment-to-moment.

---

## 4. Breathing Phase Accumulation

The breathing phase φ(t) is computed by integrating the instantaneous
phase rate 1/P(t):

```
dφ/dt = 1 / P(t)
```

Discretized for real-time computation at audio sample granularity:

```
// Per-sample update (executed in AudioWorkletProcessor.process())
// t_s = current time in samples since session start
t = t_s / fs
P = mp0 + (mp1 - mp0) * min(t / mD, 1.0)
Δφ = 1.0 / (P * fs)                   // phase increment per sample
φ = frac(φ + Δφ)                      // frac() = fractional part; keeps φ ∈ [0, 1)
```

The phase φ ∈ [0, 1) indexes position within the current breath
cycle. The mapping to inhale and exhale phases is:

```
φ ∈ [0.0, 0.5)  →  inhale phase
φ ∈ [0.5, 1.0)  →  exhale phase
```

The sinusoidal shape means the transition between inhale and exhale
is smooth and has no abrupt discontinuity at the half-period boundary.

---

## 5. Instantaneous Audio Frequency

The instantaneous audio frequency is a sinusoidal function of the
breathing phase:

```
f(t) = F₀ + Aₘ × sin(2π × φ(t))
```

The frequency at φ = 0 is F₀ (center, the start of a new breath cycle,
at the inhale onset). It rises to F₀ + Aₘ at φ = 0.25 (peak of inhale,
lungs maximally expanded), falls back to F₀ at φ = 0.5 (exhale onset),
continues falling to F₀ − Aₘ at φ = 0.75 (trough of exhale, lungs
minimally expanded), then returns to F₀ at φ = 1.0 (start of next cycle).

The frequency is always positive. The constraint F₀ > Aₘ must hold
(ensured by the parameter bounds in PRESET_FORMAT.md: F₀ − Aₘ ≥ 50 Hz).

**Design rationale for sinusoidal shape:** A sinusoidal frequency
contour produces a smooth, natural-feeling breathing cue. The
instantaneous rate of change is zero at the frequency extremes
(top of inhale, bottom of exhale), corresponding to the natural
physiological pause at full inhalation and full exhalation.
Linear or trapezoidal contours produce abrupt inflection points
perceptible as rhythmic clicks or lurches in the frequency glide.

---

## 6. Audio Phase Accumulation

To produce a glitch-free audio signal at the time-varying frequency
f(t), the audio oscillator phase θ(t) is accumulated continuously
rather than recomputed from the instantaneous frequency alone.
This is the standard FM-synthesis phase accumulation technique and
is essential to prevent discontinuities at the audio sample level
when f(t) changes:

```
// Per-sample audio oscillator update
Δθ = 2π × f(t) / fs                   // phase increment in radians per sample
θ = θ + Δθ                             // not wrapped; let it accumulate
sample = sin(θ)
```

The output sample is sin(θ), where θ grows monotonically and
wraps implicitly through the periodicity of the sine function.
Explicit wrapping of θ is unnecessary and can introduce clicks.

The full per-sample computation combining breathing phase and
audio oscillator:

```
// AudioWorkletProcessor per-sample code (no allocation, no closures)
function processSample(state) {
    // state: { t_s, phi, theta, mp0, mp1, mD, F0, Am, fs }

    // Breathing period
    t = state.t_s / state.fs
    P = state.mp0 + (state.mp1 - state.mp0) * Math.min(t / state.mD, 1.0)

    // Breathing phase
    d_phi = 1.0 / (P * state.fs)
    state.phi = (state.phi + d_phi) % 1.0

    // Instantaneous frequency
    f_inst = state.F0 + state.Am * Math.sin(2 * Math.PI * state.phi)

    // Audio phase accumulation
    state.theta += 2 * Math.PI * f_inst / state.fs

    // Sample output
    return Math.sin(state.theta)
}
```

Note: `state.theta` is not reduced modulo 2π. Floating-point precision
loss from accumulated large values of θ becomes significant after
approximately 12–14 hours of continuous operation (at 48 kHz, θ reaches
2π × 200 × 48000 × 43200 ≈ 2.6 × 10¹² after 12 hours of 200 Hz tone).
For sessions bounded to practical lengths (≤ 2 hours), this is not
a concern. For future long-session or looping implementations, θ
should be reduced modulo 2π whenever its value exceeds a threshold
(e.g. 2π × 10⁶) and the reduction is scheduled during a zero-crossing
to avoid artifacts.

---

## 7. Visual Phase Mapping

The same breathing phase φ(t) that governs the audio frequency is
transmitted to the visual rendering engine. This is the core
synchronization mechanism: a single phase signal drives audio,
visual, and haptic feedback simultaneously.

The visual element (typically a breathing guide sphere or similar
shape) maps φ to the following visual properties:

**Scale:** `scale(φ) = S_min + (S_max − S_min) × (1 + sin(2π × φ)) / 2`

This maps φ=0 (inhale onset, f=F₀) to the rest scale S_min (or a
midpoint). The element reaches maximum scale S_max at φ=0.25 (full
inhalation, f=F₀+Aₘ) and minimum scale S_min at φ=0.75 (full
exhalation, f=F₀−Aₘ). The scale formula uses the same sinusoidal
function as the frequency oscillation, ensuring perceptual consistency
between the auditory and visual cues.

**Color shift (optional):** The phase φ may additionally modulate
a color parameter (e.g., hue or luminance) to provide a secondary
perceptual cue. The color modulation uses the same formula as scale
with appropriate parameter substitution.

**Position (optional):** For layouts where the visual guide has
spatial freedom, vertical or radial position may map φ to a
displacement, providing a motion cue that reinforces the scale cue.

**Rationale for multi-cue visual encoding:** Early users of the
system with eyes open benefited from scale + color + position
together. As users gained experience, the auditory cue alone
became sufficient for eyes-closed sessions. Providing multiple
redundant visual cues shortens the learning period for new users.

---

## 8. Haptic Phase Mapping

Where haptic output is available (Android via Vibration API,
future hardware via Web MIDI or Bluetooth), the breathing phase
drives a vibration envelope. The preferred mapping:

- Inhale onset (φ = 0): short pulse (100–150 ms)
- Exhale onset (φ = 0.5): short pulse (100–150 ms, lower intensity)

This provides proprioceptive anchors at the two most functionally
significant moments in the breath cycle (the transitions). A
continuous vibrotactile envelope is an alternative but is not
practical with the Web Vibration API's binary on/off interface.

The timing of haptic pulses is derived from zero-crossings of
`sin(2π × φ)` relative to the previous sample, detected in the
rendering loop and communicated to the haptic subsystem with
a latency offset equal to `AudioContext.outputLatency`.

---

## 9. The Martigli-Binaural Variant

A fundamental extension of the standalone Martigli oscillation is
the Martigli-Binaural (MB) voice, in which the identical breathing
oscillation is applied simultaneously to two frequency-offset
oscillators presented dichotically (one per ear). The two carriers
sweep in exact parallel, maintaining a constant inter-ear frequency
difference throughout.

**Left-channel frequency:**
```
f_L(t) = f_L0 + Aₘ × sin(2π × φ(t))
```

**Right-channel frequency:**
```
f_R(t) = f_R0 + Aₘ × sin(2π × φ(t))
```

where f_L0 and f_R0 are the rest-position carriers (corresponding to
`fl` and `fr` in the preset format), and the identical oscillation
amplitude Aₘ and phase φ(t) are applied to both.

**Constant beat frequency property:**
```
f_R(t) − f_L(t) = f_R0 − f_L0 = Δf   (constant)
```

The perceived binaural beat frequency Δf = |f_L0 − f_R0| is invariant
over time. The oscillation moves the stereo field through different
frequency registers with each breath cycle, but the entrainment
frequency remains stable.

This is the key design property of the MB voice: **brainwave
entrainment frequency is decoupled from the breathing oscillation
register.** The timbre and spectral character of the sound change
with breathing while the auditory entrainment target is held constant.

The audio implementations for both channels follow the identical
phase accumulation procedure from Section 6, applied independently
to f_L(t) and f_R(t) with the same phase-accumulated θ but
separately-accumulated audio phases:

```
// Per-sample, MB voice
f_L_inst = fl + Am * sin(2π * phi)
f_R_inst = fr + Am * sin(2π * phi)   // fr = fl + Δf

theta_L += 2π * f_L_inst / fs
theta_R += 2π * f_R_inst / fs

sample_L = sin(theta_L)
sample_R = sin(theta_R)
```

The breathing-phase and breathing-period computation are shared
between both channels (same φ, same P(t)).

---

## 10. Martigli-Synced Spatial Panning

A third variant applies the breathing phase to the spatial position
of the stereo field. This is `panOsc = 3` in the BSC preset format.

The pan law chosen is a sinusoidal pan applied in anti-phase to the
two channels of a binaural or Martigli-Binaural voice:

```
pan(φ) = sin(2π × φ)             // −1 = full left, +1 = full right
```

The left channel amplitude is attenuated by `(1 − pan(φ)) / 2` and
the right channel by `(1 + pan(φ)) / 2`. The spatial position
sweeps continuously with each breath cycle: at inhale onset (φ=0)
the image is centered, reaches full right at φ=0.25, returns to
center at φ=0.5, reaches full left at φ=0.75, and returns to center
at φ=1.

**Important caveat:** Martigli-synced panning partially collapses
the stereo binaural field during the extremes of the spatial sweep
(φ ≈ 0.25 and φ ≈ 0.75). At these points, the signal is fully
lateralized to one ear, rendering the binaural beat effectively
monaural. This is a known tradeoff: the spatially enhanced breathing
cue is perceptually powerful but reduces binaural entrainment
efficacy for approximately 25% of each breath cycle around each
lateral extreme. This mode should be used when the spatial/embodied
quality of the breathing cue is prioritized over maximum entrainment
precision.

---

## 11. Non-Breathing Martigli (Textural Mode)

When `isOn = false`, the Martigli oscillation operates without
breathing guidance function. In this mode, the same frequency
oscillation formula applies but the period is typically set to
values inappropriate for breathing guidance:

**Fast tremolo mode:** mp₀ = 0.1–2 s, mp₁ = 0.3–3 s
Produces a rapid frequency vibrato perceived as timbre modulation
or tonal motion rather than a breathing cue.

**Ultra-slow ambient sweep mode:** mp₀ = 60–180 s, mp₁ = 120–360 s
Produces very slow tonal drift perceived as ambient movement or
register evolution over the course of a session.

In non-breathing mode, the phase φ(t) is not transmitted to the
visual rendering engine — the visual breathing animation is
suppressed. The audio generation is otherwise identical.

---

## 12. Multi-Voice Interaction and Bloom

A session may include multiple simultaneous Martigli or MB voices,
at most one of which has `isOn = true`. Secondary voices may use
any period values but must have sufficiently different periods from
the primary to avoid perceptual confusion about which voice carries
the breathing reference.

**Bloom** is the auditory phenomenon that occurs when a Symmetry
or Binaural voice operates in the same frequency register as the
sweep range of an active Martigli or MB voice. As the Martigli
carrier sweeps, it intermittently passes through the carrier
frequencies of the other voices, creating constructive and
destructive interference patterns. This produces a rhythmic
modulation of the composite timbre synchronized to the breath cycle.

Bloom may be deliberately exploited (e.g., in Indulge and
Transcend group sessions where immersive timbral evolution is
desired) or avoided (e.g., in Perform group sessions where a
clean, steady field supports sustained work). The bloom policy
is recorded in the preset as `bloomPolicy: "avoided"`,
`"intentional-soft"`, or `"intentional-strong"`.

To avoid bloom: place Symmetry and Binaural voice carrier
frequencies outside the sweep range `[F₀ − Aₘ, F₀ + Aₘ]` of
every Martigli and MB voice.

To induce bloom: place at least one voice carrier within the
sweep range.

---

## 13. Physiological Design Rationale

The parameter choices for standard BSC sessions are informed by
the literature on cardiorespiratory resonance frequency, defined
as the breathing rate at which respiratory sinus arrhythmia (RSA)
is maximized through coupling between the respiratory and
cardiovascular systems. Individual resonance frequencies vary
from approximately 4.5 to 7.0 bpm (Lehrer et al., 2000;
Lehrer & Gevirtz, 2014), with a population median near 6 bpm
(cycle duration ≈ 10 s).

The Martigli deceleration arc is designed to approach this range
from a faster starting pace (mp₀ ≈ 5–6 s, approximately 10 bpm)
through a 10-minute transition to a final rate of approximately
5.5–6 bpm (mp₁ ≈ 10–11 s). The final rate is intentionally
at the upper end of the resonance range rather than its center,
as individual resonance frequency varies and a slightly fast
target is more comfortable for non-resonance users than a
slightly slow one.

The choice of a sinusoidal period interpolation rather than a
step change ensures that users are never confronted with an
abrupt shift in breathing rate, which would require conscious
resynchronization. The gradient of the deceleration (typically
less than 0.5 s/min increase in cycle duration) is well below
the threshold of perceptible rate change in moment-to-moment
experience.

The 50/50 inhale/exhale ratio is a deliberate simplification.
Yogic and clinical breathing literature documents that longer
exhale ratios (e.g., 1:2 inhale:exhale) may provide stronger
parasympathetic activation. BSC uses a 1:1 ratio for user
accessibility: unequal ratios require conscious effort to
track, whereas equal sinusoidal breathing can be followed
passively once the rate is comfortable. This choice prioritizes
ease of use and session compliance over maximal physiological
optimization. Future versions may offer configurable inhale/
exhale ratio (see Section 15).

---

## 14. Temporal Relationship to AudioContext

All timing computations use `AudioContext.currentTime` as the
sole temporal authority. The variable t in all equations above
is defined as:

```
t = AudioContext.currentTime − sessionStartTime
```

where `sessionStartTime` is the value of `AudioContext.currentTime`
at the moment the session begins (the audio context is resumed and
the oscillator starts). Temporal consistency between audio and
visual rendering is maintained by reading `AudioContext.currentTime`
at the beginning of each `requestAnimationFrame` callback and
using that value to compute the current breathing phase for visual
update.

**Audio time cannot be derived from wall-clock time.** The audio
clock (`AudioContext.currentTime`) runs on the hardware audio
thread with sub-millisecond precision and may diverge from
`Date.now()` or `performance.now()` due to tab throttling,
background execution limits, and clock drift. Using wall-clock
time for breathing phase computation would produce phase drift
between audio and visual cues, perceptible as the visual
breathing guide falling out of sync with the auditory cue.

---

## 15. Known Limitations and Future Extensions

**Fixed inhale/exhale ratio:** The current system uses a 1:1
sinusoidal ratio. A configurable ratio (e.g., 1:2 for
parasympathetic protocols) requires modifying the phase-to-
frequency mapping to use a non-symmetric sinusoidal waveform or
a piecewise function that allocates different fractions of the
cycle to inhale and exhale. This change would be a schema-breaking
extension requiring a new parameter in the voice specification.

**Fixed sinusoidal envelope shape:** The frequency contour is
always sinusoidal. Alternative shapes (raised cosine, half-sine
for a more square-wave breathing contour, or a custom envelope
specified by control points) could be added as an `envelopeShape`
parameter. Such extensions would require that the phase-to-
frequency mapping function be selectable and would not affect the
fundamental breathing phase accumulation mechanism.

**Fixed deceleration shape:** The period arc is piecewise linear.
An exponential or ease-in/ease-out deceleration might provide a
more natural approach to the target rate. This is a minor variation
with no fundamental impact on the disclosed technique.

**Multiple breathing arcs within one session:** The current model
uses a single deceleration arc per session. A session-arc segmentation
feature (e.g., decelerate to 6 bpm in the first 10 minutes, hold,
then further decelerate in the final 5 minutes) could be implemented
as an array of `(mp_i, mD_i)` pairs. This would be a schema extension
but does not constitute a novel technique beyond what is disclosed here.

---

## 16. Reference Implementation

A minimal, self-contained reference implementation in Web Audio API:

```javascript
// Reference implementation of Martigli oscillation
// For a standalone voice (non-binaural variant)
// This code runs inside an AudioWorkletProcessor

class MartigliProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options)
    const p = options.processorOptions
    this.F0   = p.mf0         // center frequency (Hz)
    this.Am   = p.ma          // amplitude (Hz)
    this.mp0  = p.mp0         // initial period (s)
    this.mp1  = p.mp1         // final period (s)
    this.mD   = p.md          // deceleration duration (s)
    this.vol  = p.iniVolume   // initial volume scalar

    // Pre-allocated state (no allocation in process())
    this._t_s   = 0      // sample counter
    this._phi   = 0.0    // breathing phase
    this._theta = 0.0    // audio phase (radians)
  }

  process(inputs, outputs) {
    const channel = outputs[0][0]
    const fs      = sampleRate   // AudioWorkletGlobalScope.sampleRate

    for (let i = 0; i < channel.length; i++) {
      const t = this._t_s / fs

      // Breathing period (linear arc)
      const ratio = Math.min(t / this.mD, 1.0)
      const P = this.mp0 + (this.mp1 - this.mp0) * ratio

      // Breathing phase accumulation
      this._phi = (this._phi + 1.0 / (P * fs)) % 1.0

      // Instantaneous audio frequency
      const f_inst = this.F0 + this.Am * Math.sin(2 * Math.PI * this._phi)

      // Audio phase accumulation (no modulo — let it grow)
      this._theta += 2 * Math.PI * f_inst / fs

      // Output sample
      channel[i] = this.vol * Math.sin(this._theta)

      this._t_s++
    }
    return true
  }
}

registerProcessor('martigli-processor', MartigliProcessor)
```

The Martigli-Binaural variant requires two separate `_theta`
accumulators (one per channel) but shares `_phi` and the
period computation. See `public/worklets/martigli.worklet.js`
in the BSC Lab repository for the full implementation.

---

## 17. Summary of Novel Contributions

For clarity of prior art scope, the novel technical elements
disclosed herein are:

1. **Progressive deceleration breathing arc:** Encoding a
   breathing guidance cue in the frequency oscillation of an
   audio tone, where the oscillation period changes continuously
   and linearly from an initial value to a final value over a
   configurable transition duration, after which the period
   holds constant.

2. **Sinusoidal frequency-glide breathing cue:** The specific
   choice of a sinusoidal frequency contour for the breathing
   cue, providing smooth transitions at the inhale/exhale
   boundaries and natural pauses at physiologically natural
   moments (full inspiration, full expiration).

3. **Multi-modal phase synchronization:** Deriving visual
   scale, color, and position cues from the same phase signal
   that generates the audio frequency oscillation, ensuring
   temporal coherence across sensory modalities from a single
   computation.

4. **Martigli-Binaural constant-beat-rate variant:** Applying
   the identical frequency oscillation to two dichotically
   presented carriers with a fixed inter-channel offset, such
   that the binaural beat frequency remains invariant while
   the timbral register oscillates with breathing.

5. **Martigli-synced spatial panning:** Synchronizing the
   stereo pan position of a binaural voice to the breathing
   phase, creating a spatially embodied breathing guide.

6. **Breathing-synchronized bloom control:** The design
   principle of positioning or avoiding voice carrier
   frequencies relative to the Martigli sweep range to
   intentionally produce or suppress timbral interaction
   patterns synchronized to the breath cycle.

7. **Integration within a multi-voice sensory stimulation
   session:** The combination of one or more Martigli or
   Martigli-Binaural voices with simultaneous Binaural beat
   and Symmetry permutation voices in a single session,
   where each voice type operates in a non-conflicting
   frequency register and the breathing guidance does not
   interfere with auditory frequency-following responses
   from the other voices.

---

*First disclosed: April 2026, BSC Lab public repository*
*Authors: Renato Fabbri, Otávio Martigli*
*License: CC BY 4.0 — free to use, implement, and extend*
*with attribution*
