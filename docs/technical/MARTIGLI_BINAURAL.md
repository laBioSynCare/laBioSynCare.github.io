# Martigli-Binaural: Breathing-Synchronized Binaural Beat with Constant Entrainment Frequency

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

The technique described in this document — the Martigli-Binaural voice
type, a method for combining binaural beat stimulation with Martigli
breathing oscillation such that the binaural beat frequency is held
invariant while the carrier frequencies sweep continuously with the
breathing arc — was conceived and first implemented by Renato Fabbri
and has been in continuous operational use since at least 2015 in
web-based audiovisual stimulation software.

This document builds on two parent techniques, both of which are
themselves prior art:

1. **The binaural beat** (Dove, H.W., 1839; widely documented throughout
   the twentieth century). Two tones at slightly different frequencies
   presented dichotically to produce a perceived oscillation at the
   frequency difference. This technique predates any possible claim by
   the authors by more than 180 years.

2. **The Martigli oscillation system** (Fabbri & Martigli, 2010–2026;
   disclosed in full in `docs/technical/BREATHING_MODEL.md`). A method
   for encoding breathing guidance in the sinusoidal frequency modulation
   of a tone carrier, with progressive deceleration of the modulation period.

The novel combination disclosed here — applying identical Martigli
oscillation to two frequency-offset dichotic carriers to create a
binaural beat whose frequency is invariant despite continuous carrier
movement — is the subject of this defensive publication.

**Inventor:** Renato Fabbri (Modena, Italy).

**First public disclosure:** Fabbri, R. (2026). *Web-based Open-loop
Audiovisual Neuromodulation: modeling, implementation, and preliminary
results.* Æterni Anima, Modena. March 2026.

**This document disclosure date:** April 2026, BSC Lab public
repository, first commit hash recorded by GitHub.

---

## 1. Overview

The Martigli-Binaural (MB) voice type is a two-channel audio signal
that simultaneously:

1. Provides **binaural beat entrainment** at a precisely controlled
   frequency (the frequency difference between the two carriers), which
   is held constant throughout the session regardless of carrier
   movement.

2. Provides **breathing guidance** through sinusoidal modulation of
   both carriers in exact parallel, creating a continuously evolving
   tonal register that the listener can follow as an auditory breathing
   cue.

3. Provides **visual and haptic breathing synchronization** through
   a shared phase signal (see Section 7 and `docs/technical/BREATHING_MODEL.md`).

The key innovation is the mathematical invariant: applying identical
frequency oscillation to both carriers maintains their difference
constant, decoupling the entrainment frequency from the timbral
evolution of the sound. The result is a "living binaural beat" —
one whose acoustics change naturally and continuously with breathing
while its neurophysiological target remains fixed.

---

## 2. Nomenclature

All symbols from `docs/technical/BREATHING_MODEL.md` apply and are
not redefined here. The following symbols are specific to MB:

| Symbol | BSC parameter | Unit | Description |
|---|---|---|---|
| f_L0 | `fl` | Hz | Left-channel carrier at rest position |
| f_R0 | `fr` | Hz | Right-channel carrier at rest position |
| Δf | — | Hz | Beat frequency: Δf = \|f_R0 − f_L0\| |
| C₀ | — | Hz | Center frequency: C₀ = (f_L0 + f_R0) / 2 |
| Aₘ | `ma` | Hz | Oscillation amplitude (shared by both channels) |
| f_L(t) | — | Hz | Instantaneous left-channel frequency at time t |
| f_R(t) | — | Hz | Instantaneous right-channel frequency at time t |
| C(t) | — | Hz | Instantaneous center frequency at time t |
| θ_L(t) | — | radians | Left audio oscillator phase |
| θ_R(t) | — | radians | Right audio oscillator phase |
| φ(t) | — | [0,1) | Breathing phase (from BREATHING_MODEL.md) |

---

## 3. The Constant-Beat-Frequency Invariant

The core mathematical property of the Martigli-Binaural technique
is that the instantaneous beat frequency is constant throughout the
session, equal to the rest-position frequency difference.

**Left-channel instantaneous frequency:**
```
f_L(t) = f_L0 + Aₘ · sin(2π · φ(t))                         (1)
```

**Right-channel instantaneous frequency:**
```
f_R(t) = f_R0 + Aₘ · sin(2π · φ(t))                         (2)
```

**Instantaneous beat frequency:**
```
Δf(t) = |f_R(t) − f_L(t)|
       = |(f_R0 + Aₘ · sin(2π · φ(t))) − (f_L0 + Aₘ · sin(2π · φ(t)))|
       = |f_R0 − f_L0 + Aₘ · sin(2π · φ(t)) − Aₘ · sin(2π · φ(t))|
       = |f_R0 − f_L0|
       = Δf                                                   (3)
```

The oscillation terms cancel exactly, leaving only the rest-position
difference. The beat frequency is time-invariant.

**Instantaneous center frequency:**
```
C(t) = (f_L(t) + f_R(t)) / 2
     = (f_L0 + f_R0) / 2 + Aₘ · sin(2π · φ(t))
     = C₀ + Aₘ · sin(2π · φ(t))                              (4)
```

The center frequency oscillates between C₀ − Aₘ and C₀ + Aₘ with
the breathing period P(t). The timbral register of the sound —
its perceived brightness and warmth — changes continuously with
breathing, while the binaural beat frequency that drives neural
frequency-following remains constant.

---

## 4. Frequency Parameter Constraints

The carrier frequencies at rest (f_L0, f_R0) and the oscillation
amplitude Aₘ must satisfy constraints that keep both instantaneous
carrier frequencies in the audible range appropriate for binaural
beat perception throughout the entire breathing arc:

**Lower bound on instantaneous frequency (at oscillation trough, φ=0.75):**
```
C₀ − Aₘ ≥ 50 Hz                                               (5)
⟺ (f_L0 + f_R0) / 2 − Aₘ ≥ 50 Hz
```

**Upper bound on instantaneous frequency (at oscillation peak, φ=0.25):**
```
C₀ + Aₘ ≤ 450 Hz                                              (6)
⟺ (f_L0 + f_R0) / 2 + Aₘ ≤ 450 Hz
```

The lower bound of 50 Hz ensures carriers do not fall below the
reliable binaural beat perception range (roughly 50–1500 Hz, with
optimal range 100–400 Hz). The upper bound of 450 Hz is a practical
design limit; binaural beats at higher carrier frequencies are
perceptible but often reported as less pleasant and more fatiguing.

**Beat frequency constraint:**
```
Δf = |f_R0 − f_L0| ≤ 35 Hz   (general)
Δf = 40 Hz                    (permitted only for intentional gamma-40 designs)
```

Beat frequencies above approximately 35 Hz are at the perceptual
boundary of binaural beat fusion and enter the range where the
beat is perceived as roughness or two distinct pitches rather than
a single oscillation. The 40 Hz exception recognizes the specific
research context of gamma-40 sensory entrainment.

**Convention:** f_L0 ≤ f_R0, so Δf = f_R0 − f_L0 ≥ 0. This ensures
the beat frequency assignment is unambiguous and consistent with
standard binaural beat notation.

---

## 5. Audio Rendering

Both channels follow the continuous phase-accumulation model
established for the Martigli oscillation (see Section 6 of
`docs/technical/BREATHING_MODEL.md`). Each channel maintains
an independent phase accumulator.

**Per-sample computation:**

```
// Shared breathing state (one instance per MB voice)
// Computed once per sample, shared by both channels
t = t_s / fs
P = mp0 + (mp1 - mp0) · min(t / mD, 1.0)
Δφ = 1.0 / (P · fs)
φ = frac(φ + Δφ)                      // frac() keeps φ ∈ [0,1)

// Instantaneous frequencies
sin_term = sin(2π · φ)
f_L_inst = f_L0 + Am · sin_term
f_R_inst = f_R0 + Am · sin_term        // sin_term is IDENTICAL for both

// Independent phase accumulation (no modulo)
θ_L += 2π · f_L_inst / fs
θ_R += 2π · f_R_inst / fs

// Output samples
sample_L = volume · sin(θ_L)
sample_R = volume · sin(θ_R)
```

**Critical implementation requirement:** The `sin_term` (= sin(2π·φ))
must be computed once and used identically for both channels. Any
per-channel variation in the oscillation term — even floating-point
rounding differences from separate computations — would cause the
instantaneous beat frequency to deviate from its nominal value Δf.
At audio frequencies, even small beat frequency deviations produce
perceptible AM artifacts on the binaural percept.

**Phase accumulators θ_L and θ_R are initialized independently** at
session start with θ_L = 0 and θ_R = 0. They diverge immediately
because f_R0 ≠ f_L0. The relative phase between the two channels
at any time t is:

```
θ_R(t) − θ_L(t) = 2π · ∫₀ᵗ [f_R(τ) − f_L(τ)] dτ
                 = 2π · Δf · t                                (7)
```

The relative phase grows linearly at rate 2π · Δf radians per second,
which is the expected behavior for a binaural beat at frequency Δf Hz.
The Martigli oscillation adds no relative phase term because it is
identical in both channels — confirmation of the invariant from a
phase accumulation perspective.

---

## 6. Monaural vs. Binaural Presentation

The Martigli-Binaural voice type is designed for dichotic presentation
(left channel to left ear, right channel to right ear via headphones).
In this mode, the perceived beat is a **binaural beat**: a central
auditory phenomenon arising from neural processing of the phase
difference between the two ears, not present in either channel alone.

If the same signal is presented diotically (both channels mixed to
both ears, i.e., through speakers or mono output), the beat becomes
a **monaural beat**: an acoustic amplitude modulation present in
the mixed signal at frequency Δf Hz. Monaural beats are stronger and
more immediately audible than binaural beats but engage different
neural pathways. The entrainment evidence base is predominantly for
binaural presentation.

The implementation must route left channel exclusively to the left
output and right channel exclusively to the right output. Mixing
or routing errors that produce cross-channel bleed convert the
binaural beat to a partial monaural beat with degraded binaural
entrainment properties.

---

## 7. Multi-Modal Synchronization

The MB voice participates in the same multi-modal synchronization
architecture as the standalone Martigli voice. The breathing phase
φ(t) drives:

- **Auditory:** the sinusoidal carrier sweep (this document)
- **Visual:** breathing guide element scale and position
  (see `docs/technical/BREATHING_MODEL.md` Section 7)
- **Haptic:** onset pulses at φ = 0 (inhale) and φ = 0.5 (exhale)
  (see `docs/technical/BREATHING_MODEL.md` Section 8)

All three modalities derive their timing from the identical φ(t)
computation, ensuring that the sound "inhales" exactly when the
visual guide expands and the haptic pulse fires. This cross-modal
consistency is the mechanism by which the MB voice functions as
a multi-modal breathing guide without requiring separate timing
signals for each modality.

The synchronization is exact because all three derivations are
computationally downstream of a single φ accumulation. Any latency
compensation needed between modalities (e.g., audio output latency
vs. visual frame timing) is addressed by offsetting the visual read
of φ by the audio output latency expressed in sample units, not by
maintaining separate phase accumulators.

---

## 8. Sweep Geometry and Bloom Interaction

### 8.1 Sweep geometry

The MB carrier sweep traces a symmetric range around the center
frequency C₀. Defining the sweep interval as the set of all
frequencies instantaneously produced by either channel:

```
Sweep(MB) = [C₀ − Aₘ − Δf/2,  C₀ + Aₘ + Δf/2]               (8)
```

Since f_L(t) = C(t) − Δf/2 and f_R(t) = C(t) + Δf/2 (by convention
f_R0 ≥ f_L0), the left channel sweeps from C₀ − Aₘ − Δf/2 to
C₀ + Aₘ − Δf/2, and the right channel sweeps from C₀ − Aₘ + Δf/2
to C₀ + Aₘ + Δf/2. The union is the interval in equation (8).

For typical Δf values (2–15 Hz) and typical Aₘ values (70–120 Hz),
the Δf/2 contribution to the sweep boundary is negligible compared
to Aₘ. The sweep is well-approximated as [C₀ − Aₘ, C₀ + Aₘ].

### 8.2 Bloom interaction with other voices

A **bloom** occurs when a fixed-frequency voice (Binaural static,
Symmetry note, or standalone Martigli) produces a tone that falls
within the instantaneous frequency range of the MB sweep during
some portion of the breath cycle. As the MB carrier passes through
the fixed-frequency voice's spectral region, the two signals
interfere acoustically, producing amplitude modulation at the
instantaneous frequency difference — which varies continuously
as the MB carrier sweeps.

The perceptual effect is a rhythmic timbral modulation synchronized
to the breath: a brief period of acoustic interference at each
sweep passage, recurring once (for a one-directional crossing)
or twice (for a full sweep excursion that both ascends through
and descends through the other voice's frequency) per breath cycle.

**Bloom classification by spectral position of fixed voice at frequency f_v:**

| Condition | Bloom character |
|---|---|
| f_v < C₀ − Aₘ − Δf/2 | No bloom: f_v is below the entire sweep range |
| f_v > C₀ + Aₘ + Δf/2 | No bloom: f_v is above the entire sweep range |
| f_v ≈ C₀ − Aₘ or f_v ≈ C₀ + Aₘ | Edge bloom: brief crossing at one turning point of the sweep per breath cycle |
| C₀ − Aₘ + ε < f_v < C₀ + Aₘ − ε | Full bloom: two crossings per breath cycle (ascending pass and descending pass) |

The timing of full bloom within the breath cycle depends on the
specific position of f_v relative to C₀:

```
Bloom timing (ascending pass, full bloom case):
φ_bloom_up = arcsin((f_v − C₀) / Aₘ) / (2π)    ∈ [0, 0.25]  (9)

Bloom timing (descending pass):
φ_bloom_down = 0.5 − φ_bloom_up                  ∈ [0.25, 0.5] (10)
```

Voices positioned near C₀ bloom near φ = 0 (inhale onset) on one
pass and near φ = 0.5 (exhale onset) on the other — synchronized
to the breath transition moments. Voices at the top of the sweep
(f_v ≈ C₀ + Aₘ) bloom near φ = 0.25 (full inhalation). Voices
at the bottom (f_v ≈ C₀ − Aₘ) bloom near φ = 0.75 (full exhalation).

### 8.3 Bloom as design parameter

Bloom is a predictable consequence of spectral proximity, not a
defect. It is exploitable as a rhythmic timbral modulation
synchronized to breathing:

**Avoiding bloom** (for clean, steady-field presets, e.g., Perform
background sessions): place all Binaural and Symmetry voice
carriers outside the MB sweep range. For Symmetry voices with
noctaves > 0, the entire pitch range of the Symmetry voice
(from f₀ to f₀ · 2^((N-1)·I/N)) must fall outside the sweep range.

**Inducing bloom** (for warm, immersive, or experiential presets,
e.g., Heal, Indulge, Transcend): intentionally place one or more
Symmetry or Binaural voices within the sweep range. The bloom
policy is recorded in the preset as `bloomPolicy: "intentional-soft"`
or `"intentional-strong"` (see `docs/technical/PRESET_FORMAT.md`).

---

## 9. Panning Modes

The MB voice supports the same four panning modes as the static
Binaural voice (see `docs/technical/PRESET_FORMAT.md` Section,
Voice type: Binaural, Panning modes). The third mode, panOsc = 3
(Martigli-synced), has particular relevance for MB voices because
the spatial panning and the frequency sweep share the same phase φ(t).

**panOsc = 3 with Martigli-Binaural:** The spatial position of the
sound in the stereo field sweeps with the breathing. At φ = 0
(inhale onset, center frequency), the image is centered. At
φ = 0.25 (full inhalation, frequency peak), the image is fully
right-lateralized. At φ = 0.5 (exhale onset, center frequency
again), the image returns to center. At φ = 0.75 (full exhalation,
frequency trough), the image is fully left-lateralized.

This produces a three-dimensional breathing cue: simultaneously,
the frequency rises and the sound moves right (inhale), then the
frequency falls and the sound moves left (exhale). The spatial
motion and tonal motion share the same sinusoidal driver.

**Effect on binaural beat perception:** During periods of full
lateral pan (φ ≈ 0.25 and φ ≈ 0.75), the sound is entirely
in one ear. At these moments, the binaural beat effect is minimal
or absent — there is no dichotic separation to generate the
inter-aural phase difference needed for binaural perception.
The binaural beat is thus pulsed at the breath rate, with full
binaural beat quality near φ = 0 and φ = 0.5 and degraded beat
quality at the panning extremes.

The combined effect is rich and immersive: the session has a
spatially embodied quality while still delivering binaural
entrainment during the centering phases. This mode is used
in BSC for Heal and Transcend group sessions where embodied
quality is prioritized over maximum entrainment precision.

---

## 10. Multiple MB Voices in a Single Preset

A preset may include more than one Martigli-Binaural voice.
Design constraints and interaction properties:

### 10.1 Breathing reference

At most one MB voice (or any voice type) in a preset may have
`isOn = true`. The breathing-reference voice drives the visual
and haptic feedback. Multiple MB voices generate multiple
simultaneous frequency sweeps, each with its own φ accumulation
(because each may have different mp0/mp1/mD parameters), but
only one drives the breathing guide display.

### 10.2 Independent sweep ranges

Each MB voice has independent (f_L0, f_R0, Aₘ, mp0, mp1, mD)
parameters and computes its own φ_i(t) independently. Two MB
voices that are not the breathing reference may have different
breathing periods — one fast, one slow — providing layered
breathing structures in the acoustic field.

**Constraint on secondary MB voices:** If a secondary MB voice
has `isOn = false`, it functions as a textural sweeping binaural
layer with no breathing guidance function. Its sweep range
may overlap with the primary MB voice's sweep range, producing
complex multi-sweep interactions. This is a valid design choice
but should be used intentionally — the overlapping sweeps produce
continuously varying amplitude modulation patterns that some users
may find disorienting.

### 10.3 Beat frequency interaction between two MB voices

Two MB voices with beat frequencies Δf₁ and Δf₂ produce two
simultaneous binaural beats. These are not additive in a simple
spectral sense; the brain processes each dichotically-separated
pair independently through the binaural beat pathway. The
perceptual result is two coexisting oscillatory percepts at
Δf₁ and Δf₂ Hz.

If Δf₁ and Δf₂ are close (within ~2 Hz of each other), the
two binaural beats interact perceptually, producing a slow
modulation of the combined binaural percept at the difference
frequency |Δf₁ − Δf₂|. This is a second-order binaural beat —
a beat between two binaural beats — and is a novel auditory
phenomenon with no well-studied neural correlate. It should
be used only intentionally, not as an accidental consequence
of similar beat frequency assignments.

---

## 11. Relationship to Prior Binaural Beat Implementations

Standard binaural beat implementations in the literature and in
commercial audio use static carrier frequencies. The carriers f_L
and f_R are constant throughout the session; only the amplitude
(volume envelope or fade-in/fade-out) may vary. The perceptual
experience of static binaural beats tends toward habituation over
extended sessions — the initial novelty of the binaural percept
fades as the auditory system adapts to the fixed carrier frequencies.

The Martigli-Binaural technique produces continuously varying
carrier frequencies with the breathing arc. The instantaneous
tonal character changes on the timescale of the breath cycle
(5–20 seconds), providing continuous renewal of timbral content
that partially counteracts habituation. The binaural beat target
frequency remains constant throughout this timbral variation,
so the entrainment signal is maintained while the acoustic
character evolves.

This approach differs from frequency-chirped binaural beats, in
which the carrier frequency changes monotonically (sweeps from
low to high or high to low) over the session duration. In chirped
binaural beats, the beat frequency itself may change along with
the carrier. The Martigli-Binaural invariant — constant beat
despite continuously varying carriers — is the specific novel
property that distinguishes this technique from both static
and chirped binaural beat implementations.

---

## 12. Reference Implementation

A minimal self-contained implementation for an `AudioWorkletProcessor`:

```javascript
// Reference implementation of Martigli-Binaural voice
// This code runs inside an AudioWorkletProcessor

class MartigliBinauralProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options)
    const p = options.processorOptions
    this.fl   = p.fl          // left carrier rest frequency (Hz)
    this.fr   = p.fr          // right carrier rest frequency (Hz)
    this.Am   = p.ma          // oscillation amplitude (Hz)
    this.mp0  = p.mp0         // initial breathing period (s)
    this.mp1  = p.mp1         // final breathing period (s)
    this.mD   = p.md          // deceleration duration (s)
    this.vol  = p.iniVolume   // volume scalar

    // Pre-allocated state (no allocation in process())
    this._t_s   = 0      // sample counter
    this._phi   = 0.0    // breathing phase ∈ [0,1)
    this._thetaL = 0.0   // left audio phase (radians, unbounded)
    this._thetaR = 0.0   // right audio phase (radians, unbounded)
  }

  process(inputs, outputs) {
    // Requires stereo output: outputs[0] has 2 channels
    const chL = outputs[0][0]
    const chR = outputs[0][1]
    const fs  = sampleRate

    for (let i = 0; i < chL.length; i++) {
      const t = this._t_s / fs

      // Breathing period (piecewise-linear arc)
      const ratio = Math.min(t / this.mD, 1.0)
      const P = this.mp0 + (this.mp1 - this.mp0) * ratio

      // Breathing phase accumulation
      this._phi = (this._phi + 1.0 / (P * fs)) % 1.0

      // Shared oscillation term — compute ONCE for both channels
      // Any per-channel variation would corrupt the beat invariant
      const osc = Math.sin(2 * Math.PI * this._phi)

      // Instantaneous carrier frequencies
      const fL_inst = this.fl + this.Am * osc
      const fR_inst = this.fr + this.Am * osc  // SAME osc term

      // Independent phase accumulation for each channel
      // theta is unbounded (no modulo) to avoid phase discontinuities
      this._thetaL += 2 * Math.PI * fL_inst / fs
      this._thetaR += 2 * Math.PI * fR_inst / fs

      // Output: left and right channels independently
      chL[i] = this.vol * Math.sin(this._thetaL)
      chR[i] = this.vol * Math.sin(this._thetaR)

      this._t_s++
    }
    return true
  }
}

registerProcessor('martigli-binaural-processor', MartigliBinauralProcessor)
```

**Verification of the invariant:** In this implementation, both
`fL_inst` and `fR_inst` use the identical `osc` value. Therefore:

```
fR_inst − fL_inst = (this.fr + this.Am * osc) − (this.fl + this.Am * osc)
                  = this.fr − this.fl
                  = Δf   (constant)
```

The beat frequency is mathematically invariant at every sample.

**Floating-point precision:** The `osc` term is computed as a
single-precision float. Used identically for both channels, any
rounding in `osc` is applied symmetrically and cancels in the
difference. The beat frequency deviation from nominal is zero
to the precision of single-precision arithmetic (approximately
10⁻⁷ Hz for typical carrier frequencies, far below perception
threshold).

---

## 13. Summary of Novel Contributions

For clarity of prior art scope, the novel technical elements
disclosed herein are:

1. **Constant-beat-frequency carrier sweep:** The specific construction
   of a binaural beat signal in which both carriers undergo identical
   time-varying frequency modulation (the Martigli sinusoidal oscillation)
   such that the instantaneous beat frequency is exactly invariant at
   all times, while the timbral register of both carriers evolves
   continuously in synchrony with a breathing arc.

2. **Shared oscillation term as implementation invariant:** The
   computational principle that the sinusoidal oscillation term
   must be computed once and applied identically to both channels'
   frequency computations, as the necessary and sufficient condition
   for exact beat frequency invariance.

3. **Beat frequency / timbral register decoupling:** The design property
   that the entrainment frequency (beat) and the acoustic character
   (carrier register) are independently specifiable via the parameters
   Δf = |f_R0 − f_L0| and (C₀ = (f_L0+f_R0)/2, Aₘ), enabling
   the session designer to control both dimensions without constraint.

4. **Breathing-synchronized bloom control:** The design technique of
   placing fixed-frequency coexistent voices at specific positions
   relative to the MB carrier sweep range, to produce bloom effects
   whose timing within the breath cycle is predictable from the
   frequency positioning geometry (equations 9 and 10).

5. **Martigli-synced spatial panning with binaural beat:** The
   combination of Martigli-synced stereo panning (panOsc = 3) with
   a Martigli-Binaural carrier, where the spatial sweep and the
   frequency sweep are driven by the same phase φ(t), creating a
   correlated multi-dimensional breathing cue in which spatial
   position and tonal register change together.

6. **Multi-modal three-way synchronization through a single phase
   signal:** The architecture in which the breathing phase φ(t)
   simultaneously drives the MB carrier modulation (auditory),
   the visual breathing guide (visual), and the haptic pulse
   timing (somatosensory), all from a single accumulated value
   derived from `AudioContext.currentTime`.

7. **Second-order binaural beat interaction:** The theoretical
   interaction property of two simultaneous MB voices with
   similar but non-identical beat frequencies, producing a
   beat-between-binaural-beats at the difference frequency
   |Δf₁ − Δf₂|.

---

*First disclosed: April 2026, BSC Lab public repository*
*Author: Renato Fabbri*
*License: CC BY 4.0 — free to use, implement, and extend*
*with attribution*
