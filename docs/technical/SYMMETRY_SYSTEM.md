# Symmetry System: Sonic Symmetry Permutation Entrainment

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
Sonic Symmetry permutation entrainment system — were conceived and
first implemented by Renato Fabbri, building upon prior work on
group-theoretical applications to granular synthesis (Fabbri & Maia
Jr., 2007, SBCM) and have been in continuous operational use since
at least 2010 in web-based audiovisual stimulation software.

This document constitutes public disclosure of the full technical
specification of these techniques. Its publication places the described
methods in the public domain as prior art, preventing any party from
obtaining patent protection for the same techniques after this
disclosure date.

**Inventor:** Renato Fabbri (Modena, Italy; PhD physics, musical
composition degree, creator of the `music` Python package).

**Prior art chain:**
- Fabbri, R. & Maia Jr., A. (2007). *Applications of group theory
  on granular synthesis.* SBCM (Brazilian Computer Music Symposium).
  [First published application of algebraic group permutations to
  sonic sequences for perceptual effect.]
- Fabbri, R. (2026). *Web-based Open-loop Audiovisual Neuromodulation:
  modeling, implementation, and preliminary results.* Æterni Anima,
  Modena. March 2026. [First formal description of the sonic symmetry
  system in the context of sensory stimulation.]

**This document disclosure date:** April 2026, BSC Lab public
repository, first commit hash recorded by GitHub.

---

## 1. Overview

The Sonic Symmetry system is a method for generating structured
polyphonic auditory patterns whose perceptual character lies on a
controlled continuum between complete predictability (pure repetition)
and complete unpredictability (random noise), through the application
of algebraic group permutations to a finite pitch sequence. The
technique unifies traditional isochronic (isochronous) tone
stimulation as a degenerate special case, generalizes it to
multi-pitch sequences with log-uniform pitch distribution, and
extends it through systematic permutation of the pitch order at
each repetition cycle.

The system is designed for integration within multi-voice sensory stimulation sessions alongside binaural beat and Martigli breathing
oscillation voices. Within that context it provides a complementary
cortical-attentional entrainment layer operating through prediction
and pattern-tracking mechanisms, distinct from the subcortical
frequency-following pathway driven by binaural beats.

---

## 2. Nomenclature

| Symbol | BSC parameter | Type | Description |
|---|---|---|---|
| N | `nnotes` | ℕ₊ | Number of notes per sequence cycle |
| I | `noctaves` | ℝ₊ ∪ {0} | Pitch span in octaves |
| f₀ | `f0` | Hz | Frequency of the lowest-pitch note |
| D | `d` | s | Duration of one complete sequence cycle |
| σ | `permfunc` | {0,1,2,3,4} | Permutation function selector |
| Sₚ | — | ℝᴺ | Pitch sequence vector (frequencies, Hz) |
| Sₜ | — | ℝᴺ | Time sequence vector (onset times, s) |
| S | — | (Sₚ, Sₜ) | Complete sequence specification |
| τ_k | — | s | Onset time of note k in the current cycle |
| f_k | — | Hz | Frequency of note k in the current cycle |
| Δτ | `noteSep` | s | Inter-onset interval (= D/N) |
| r_p | — | Hz | Note/pulse rate (= N/D) |
| t₀ | — | s | Session-relative time at cycle start |
| σ⁽ᵐ⁾ | — | permutation | Permutation applied at cycle m |
| π | — | index array | Current permuted note ordering |

---

## 3. Pitch Sequence Construction

The pitch sequence Sₚ consists of N frequencies distributed
uniformly on a logarithmic (musical) scale over an interval
of I octaves, beginning at base frequency f₀:

```
Sₚ = { f₀ · 2^(i·I/N) }  for i = 0, 1, …, N−1       (1)
```

The highest-pitch note approaches but never reaches f₀ · 2^I.
Concretely:

```
S_p[0] = f₀
S_p[1] = f₀ · 2^(I/N)
S_p[2] = f₀ · 2^(2I/N)
  ⋮
S_p[N-1] = f₀ · 2^((N-1)·I/N)
```

The interval between adjacent notes in log-frequency is constant:
log₂(S_p[i+1] / S_p[i]) = I/N octaves for all i. This equal
log-frequency spacing is the "spatial symmetry" component of the
system — the pitch distribution has discrete translational
symmetry in log-frequency space.

**Special case I = 0 (isochronic mode):**
When I = 0, equation (1) gives S_p[i] = f₀ for all i. All N
notes share the same frequency f₀, collapsing the polyphonic
sequence to a traditional isochronic (isochronous) pulse train
at frequency f₀ with pulse rate N/D Hz. This establishes
isochronic tones as a degenerate special case of the general
system (see Section 7).

**Non-integer I:** The formula supports any real I ≥ 0. Non-integer
values produce frequency intervals that do not correspond to
standard musical intervals, which may be used deliberately for
microtonal or textural effects. The equal log-spacing property
holds for all I.

---

## 4. Time Sequence Construction

Within a single cycle beginning at session-relative time t₀,
the N note onset times are distributed uniformly:

```
Sₜ = { i·D/N + t₀ }  for i = 0, 1, …, N−1              (2)
```

The inter-onset interval (onset separation) is:

```
Δτ = D / N                                                (3)
```

The note/pulse rate is:

```
r_p = N / D  (Hz)                                         (4)
```

The "temporal symmetry" component: the onset distribution has
discrete translational symmetry in time with period Δτ.

**Maximum rate constraint:**
The audio engine supports a minimum inter-onset interval of 20 ms,
corresponding to a maximum rate of 50 Hz. Specifications with
D/N < 0.020 s are invalid.

```
Δτ ≥ 0.020 s  ⟺  N/D ≤ 50 Hz                           (5)
```

---

## 5. Sequence Representation as Pair

The complete sequence is the ordered pair:

```
S = (Sₚ, Sₜ)                                             (6)
```

Both sequences have length N. Sequence execution: at time τ_k = Sₜ[k],
emit a tone at frequency f_k = Sₚ[π[k]], where π is the current
permuted note ordering (see Section 6). At cycle boundary (all N
notes played), π is updated according to the permutation function,
and the next cycle begins at t₀ ← t₀ + D.

The "symmetry" in the name refers to the mathematical sense:
the pair (Sₚ, Sₜ) is symmetric in both the spatial (log-frequency)
and temporal dimensions, with the discrete symmetry group of the
N-element sequence acting on both. The permutation functions
exploit elements of this symmetry group.

---

## 6. Permutation Functions

At the end of each N-note cycle, a permutation is applied to the
pitch ordering vector π. Five permutation functions are defined
by the parameter σ ∈ {0, 1, 2, 3, 4}:

### σ = 0: Shuffle (random permutation)

At each cycle boundary, π is replaced by a uniformly random
permutation of {0, 1, …, N−1}:

```
π⁽ᵐ⁺¹⁾ ← Uniform({all permutations of {0,…,N−1}})
```

The Fisher-Yates (Knuth) shuffle algorithm is used for
unbiased uniform sampling in O(N) time.

**Perceptual character:** Maximum sequence-to-sequence unpredictability.
Within a cycle, a listener who has heard the first k notes has
1/(N−k) probability of correctly predicting the next note. This
creates a micro-arc of rising predictability from 1/N to certainty
at the final note, followed by a reset. For large N, the arc is
long; for N=2, each cycle is a binary alternation or repetition
chosen randomly, producing perpetual uncertainty.

### σ = 1: Forward rotation (cyclic left shift)

At each cycle boundary, π is replaced by a left cyclic shift
of the previous permutation:

```
π⁽ᵐ⁺¹⁾[i] ← π⁽ᵐ⁾[(i+1) mod N]   for i = 0,…,N−1
```

Starting from π⁽⁰⁾ = [0, 1, 2, …, N−1]:
```
Cycle 0: [0, 1, 2, …, N−1]
Cycle 1: [1, 2, 3, …, 0]
Cycle 2: [2, 3, 4, …, 1]
  ⋮
Cycle N: [0, 1, 2, …, N−1]  (period = N cycles)
```

**Perceptual character:** Systematic upward drift in pitch ordering.
Each cycle begins one step higher in the sequence than the last.
The full period of the rotation is N cycles. For small N (2–4),
the pattern is highly regular; for large N, the rotation creates
a slow melodic drift that completes over many cycles.

### σ = 2: Backward rotation (cyclic right shift)

At each cycle boundary, π is replaced by a right cyclic shift:

```
π⁽ᵐ⁺¹⁾[i] ← π⁽ᵐ⁾[(i−1+N) mod N]   for i = 0,…,N−1
```

Starting from π⁽⁰⁾ = [0, 1, 2, …, N−1]:
```
Cycle 0: [0, 1, 2, …, N−1]
Cycle 1: [N−1, 0, 1, …, N−2]
Cycle 2: [N−2, N−1, 0, …, N−3]
```

**Perceptual character:** Systematic downward drift, mirror image
of σ=1. Period = N cycles.

### σ = 3: Reversal with alternating mirror

At each cycle boundary, π is replaced by its reversal:

```
π⁽ᵐ⁺¹⁾[i] ← π⁽ᵐ⁾[N−1−i]   for i = 0,…,N−1
```

Starting from π⁽⁰⁾ = [0, 1, 2, …, N−1]:
```
Cycle 0: [0, 1, 2, …, N−1]    (ascending)
Cycle 1: [N−1, N−2, …, 0]     (descending)
Cycle 2: [0, 1, 2, …, N−1]    (ascending again)
```

**Perceptual character:** Alternating ascending and descending
pitch order. Period = 2 cycles. The alternation creates a
pendulum-like melodic motion, particularly perceptible at
moderate note rates (0.5–4 Hz) with I > 0.

### σ = 4: Identity (no permutation)

π is held constant at all cycle boundaries:

```
π⁽ᵐ⁺¹⁾ ← π⁽ᵐ⁾   for all m ≥ 0
```

The sequence repeats identically on every cycle:
```
All cycles: [0, 1, 2, …, N−1]
```

**Perceptual character:** Pure repetition. Maximum predictability
within cycles; no cycle-to-cycle variation. Lowest cognitive
engagement. Susceptible to rapid habituation for long sessions,
but useful for fast isochronic designs where cycle-to-cycle
variation would be perceptually incoherent at the relevant
timescale.

---

## 7. Isochronic Special Case (I = 0)

When `noctaves` = 0, equation (1) gives Sₚ[i] = f₀ for all i.
The pitch sequence is constant; permutation has no auditory effect
since all notes sound identical regardless of ordering. The system
reduces to a periodic tone at frequency f₀ pulsed at rate r_p = N/D Hz.

This is precisely the definition of an isochronic (isochronous)
tone: a sustained or gated tone alternating at a specified rate.
The isochronic tone tradition in brainwave entrainment predates
the general Symmetry system; by deriving it as a special case,
the Symmetry system subsumes isochronic tones as a limiting case
rather than treating them as a separate technique.

The formulation also shows that isochronic targeting is
straightforwardly parametric:

```
Target frequency f_t Hz using isochronic mode:
  Set I = 0
  Choose any N ≥ 2 and D such that N/D = f_t
  Example: f_t = 10 Hz → N=10, D=1.0 or N=20, D=2.0
  Example: f_t = 40 Hz → N=8,  D=0.2 or N=20, D=0.5
```

The choice of N and D is otherwise free, subject to Δτ = D/N ≥ 20 ms.
Larger N with the same target rate produces a sequence that occupies
more audio buffer space but has more fine-grained temporal control
of the pulse shape. For fast targets (>25 Hz), N should be chosen
to keep D short enough that the note envelopes remain distinct
(see Section 8).

---

## 8. Audio Rendering Model

### 8.1 Note envelope

Each note is a windowed sine tone. The envelope shape adapts to
the available note duration (onset separation Δτ). The intended
envelope is an ADSR shape; the attack, sustain, and release
durations are constrained by Δτ.

At low rates (Δτ > 240 ms, r_p < ~4.17 Hz), the note envelope
occupies approximately 50% of Δτ, with equal attack and release
ramps and a brief sustain period. A silence gap occupies the
remaining 50%. This is the "equal duty" regime.

As rate increases, the envelope expands to fill more of Δτ.
Above Δτ ≈ 170 ms (r_p ≈ 5.88 Hz), the silence gap is eliminated
and notes become continuous — the tail of one note butts against
the onset of the next. Above this point, the system operates in
a "continuous envelope" regime where the texture is a smoothly
evolving spectral mixture rather than discrete notes.

At high rates (Δτ ≤ 40 ms, r_p ≥ 25 Hz), attack and release
ramps scale toward 10 ms each. The duty cycle is 100%; at
Δτ = 20 ms (50 Hz maximum), the notes are 20 ms sine bursts
with ~10 ms attack and ~10 ms release and no sustain.

**Regime summary:**

| Δτ range | r_p range | Behavior |
|---|---|---|
| > 240 ms | < 4.17 Hz | ~50% duty; silence gap present; distinct notes |
| 170–240 ms | 4.17–5.88 Hz | Duty expanding; gap shrinking |
| < 170 ms | > 5.88 Hz | 100% duty; no silence; continuous texture |
| ≤ 40 ms | ≥ 25 Hz | Short burst; pitch secondary; isochronic/entrainment regime |
| ≤ 20 ms | ≥ 50 Hz | Minimum; 10 ms attack + 10 ms release; HARD LIMIT |

### 8.2 Note frequency rendering

Each note is a sine oscillator phase-accumulated at the specified
frequency. The note at position k in the current cycle plays at
frequency Sₚ[π[k]].

```javascript
// Per-note initialization (called at note onset time τ_k)
// No allocation here; uses pre-allocated oscillator state
function startNote(osc, frequency, volume, envelopeDuration) {
    osc.frequency = frequency
    osc.targetVolume = volume
    osc.envelopePhase = 0.0    // 0 = attack start
    osc.duration = envelopeDuration
    // osc.theta accumulates continuously; no reset to avoid click
}
```

The oscillator phase θ accumulates continuously across notes —
it is never reset between notes within a session. This prevents
the click that would occur if the oscillator phase were reset
to zero at each note onset, which would produce a phase discontinuity
audible as a click or pop at the note boundary.

### 8.3 Pitch-switching phase continuity

When the oscillator switches from frequency fₐ at note k to
frequency fᵦ at note k+1, the instantaneous phase of the
oscillator is at angle θ. The new note begins with the same
θ, so:

```
sample_new = sin(θ) = sample_old  at the boundary instant
```

This guarantees sample-level continuity at the note boundary.
The frequency change manifests only as a change in the rate of
phase accumulation (dθ/dt = 2π · f), not as a discontinuity
in the sample value. At audio rates (>= 44100 Hz), the
perceptual transition between pitches is smooth.

### 8.4 Cycle boundary sequencing

At the end of each N-note cycle:

1. The permutation π is updated according to σ.
2. The note index resets to 0.
3. The cycle start time t₀ advances by D.
4. The next note onset is scheduled at τ_0 = t₀.

This sequencing is performed in the `SessionScheduler` Web Worker,
which operates with a 25 ms lookahead using `AudioContext.currentTime`.
Note onsets are scheduled as `AudioWorkletProcessor` parameter
automation events, maintaining timing precision independent of
main-thread jank.

---

## 9. Multi-Voice Interaction

When multiple Symmetry voices are present in a session,
their interactions produce a range of temporal and spectral
effects that are exploitable for session design:

### 9.1 Polyrhythm (different N/D values)

Two Symmetry voices with different note/pulse rates r₁ = N₁/D₁
and r₂ = N₂/D₂ produce polyrhythmic patterns. The pattern repeats
with period LCM(D₁, D₂) when D₁/D₂ is rational, or is aperiodic
when D₁/D₂ is irrational. Simple integer ratios (D₁:D₂ = 2:1,
3:2, 4:3) produce structured polyrhythm perceptible as complex
but orderly rhythmic patterns.

### 9.2 Phasing (similar but non-identical D values)

Two Symmetry voices with D values that differ by a small fraction
produce a slow phase drift between their onset patterns. If D₁ = D
and D₂ = D + ε for small ε, the two voices are initially
synchronized but drift apart over time, with the slower voice
falling behind by one onset interval approximately every D²/ε
seconds. This is the Steve Reich phasing principle applied to
logarithmic pitch sequences. The drift produces a slowly evolving
polyrhythmic texture that is characteristic of many BSC presets.

### 9.3 Spectral beating (shared or nearby f₀ values)

When two Symmetry voices have overlapping pitch ranges
(their S_p sequences contain nearby frequencies), coincident
or near-coincident note onsets produce amplitude interference:

- **Coincident pitch, coincident onset:** constructive or destructive
  interference depending on oscillator phase relationship at the
  shared onset time. Since oscillator phases accumulate continuously
  from session start, the phase relationship at any coincident onset
  depends on the history of frequency differences. This produces
  complex amplitude modulation patterns with no simple period.

- **Near-coincident pitch, coincident onset:** beating at the
  frequency difference, audible as a slow wobble in the combined
  amplitude during the overlapping note durations.

These interactions are not predictable from the parameters alone
without tracking oscillator phase histories. They contribute to
the complex "living" quality of multi-voice Symmetry sessions
and are part of the intended design space, not artifacts to be
corrected.

### 9.4 Frequency and time independence

A fundamental design property of multi-voice Symmetry sessions:
the frequency parameters (f₀, I) and the time parameters (N, D, σ)
of each voice are fully independent. This means any combination
of pitch structures and rhythmic structures can be combined
freely within the constraint that the note/pulse rates of all
voices respect the 50 Hz maximum (Δτ ≥ 20 ms per voice).

In particular, a voice intended as an isochronic entrainment
driver (I = 0, r_p = target Hz) may coexist with a voice
intended as a melodic ambient background (I > 0, low r_p) with
no coupling between their parametric specifications.

---

## 10. Cognitive Mechanism: Partial Predictability Cycles

The Symmetry system was designed with a specific cognitive
mechanism in mind: the attentional engagement produced by
sequences that are neither fully predictable nor fully random,
but occupy a structured intermediate region.

Consider a single N-note cycle under random permutation (σ = 0).
Immediately before the first note, the listener has no
information about the pitch ordering: the predictability of
the first note is 1/N. After hearing the first note (pitch
at index π[0]), the listener knows it will not repeat, so the
predictability of the second note rises to 1/(N-1). After k
notes, the predictability of the (k+1)-th note is 1/(N-k).
At k = N−1, the predictability is 1 — the final note is certain.

This creates a micro-arc of steadily rising predictability within
each cycle, culminating in certainty at the final note, followed
by a complete reset when the next cycle begins with a fresh
random permutation. The cognitive experience is a repeating
cycle of rising confidence followed by resolution and reset —
a micro-reward structure embedded in the auditory stream.

The period of this arc is the sequence cycle duration D. For
ambient Symmetry voices (D = 30–120 s), the arc period is
perceptible as a slowly building sense of pattern approaching
completion. For fast voices (D = 0.2–2 s), the arc period
is sub-attentional but may still influence neural processing
through prediction error signals.

For the non-random permutations (σ = 1–3), the predictability
structure is different: since the permutation is deterministic,
a listener who has experienced several cycles can predict the
entire ordering from the first note. This produces a different
cognitive engagement mode — more learned and habit-based,
less moment-to-moment uncertainty — which some users prefer
for sustained work sessions.

The σ = 4 (identity) case collapses the predictability arc:
after a single cycle, the entire sequence is known and all notes
are fully predictable. This mode is best suited for isochronic
designs where predictability is not the target — the pitch
content either does not vary (I = 0) or is secondary to
the rhythmic pulse rate.

**Design implication:** The selection of permfunc is a control
over the cognitive engagement character, independent of the
acoustic frequency target. For sustained focus sessions,
lower-uncertainty permutations (σ = 1, 2, 4) may be preferred.
For meditative or exploratory sessions, higher-uncertainty
permutations (σ = 0, 3) maintain engagement without demanding
active processing.

---

## 11. Relationship to Algebraic Group Theory

The five permutation functions correspond to specific group
elements or group operations on the symmetric group Sₙ:

- **σ = 0 (shuffle):** Samples uniformly from all N! elements
  of Sₙ at each cycle. The permutation applied is a random
  element of the full symmetric group.

- **σ = 1 (forward rotation):** Generates the cyclic subgroup
  C_N ⊂ Sₙ by repeated application of the generator
  c = (0 1 2 … N−1), the N-cycle permutation. Orbit size = N.

- **σ = 2 (backward rotation):** Generates C_N using the
  inverse generator c⁻¹ = (N−1 N−2 … 0). Same subgroup as σ=1,
  traversed in reverse order.

- **σ = 3 (reversal):** Applies the permutation
  r = (i ↦ N−1−i), an involution (r² = identity). The sequence
  {σ⁽⁰⁾, σ⁽¹⁾, σ⁽²⁾, …} alternates between identity and r,
  generating the group ℤ₂ acting on the orbit {original, reversed}.

- **σ = 4 (identity):** Applies the identity element of Sₙ
  at every cycle. The sequence of permutations is constant
  at the identity.

The musical application of these group elements produces
perceptually distinct characters because the orbit structures
of the corresponding group actions determine the degree of
long-range predictability in the sequence. C_N orbits (σ=1,2)
have period N; ℤ₂ orbits (σ=3) have period 2; identity (σ=4)
has period 1; Sₙ acting randomly (σ=0) has no periodicity.

The foundational connection to group theory motivates the
name "Symmetry": the system exploits the mathematical
symmetries of the N-element sequence (invariance under the
group action) to produce perceptual effects linked to
structural regularity and predictability.

This theoretical grounding does not constitute a claim that
the cognitive effects of the system are driven by the
listener's conscious apprehension of group structure. The
effects are perceptual and pre-cognitive. The group theory
provides a rigorous classification of the permutation
space and a principled way to select permutation functions
with known structural properties.

---

## 12. Integration with Binaural Beat Voices

In a multi-voice BSC session, Symmetry voices and Binaural
beat voices are proposed to operate on distinct entrainment
pathways:

**Binaural beats (subcortical pathway):** The perceived beat
at the inter-aural frequency difference drives frequency-following
responses in the inferior colliculus and projects to the
auditory cortex. This pathway is largely automatic and does
not require active attention. It is the primary mechanism
for frequency-specific neural entrainment at the target band.

**Symmetry sequences (cortical-attentional pathway):** The
structured pitch and rhythm patterns engage cortical
prediction mechanisms. Pattern recognition, error prediction,
and temporal attention circuits are engaged, particularly
in prefrontal and parietal regions associated with
sequential processing and voluntary attention. The engagement
is maintained by the partial predictability structure.

These two pathways are proposed to be non-competing: the
binaural beat operates in the continuous-tone spectral domain
(the carrier frequencies f_L and f_R and their beat), while
the Symmetry voice operates in a distinct spectral region
(f₀ to f₀ · 2^((N-1)·I/N)) with no continuous tone content
overlapping with typical binaural carriers.

**This dual-pathway model is a design rationale and theoretical
framework, not an established clinical claim.** The specific
mechanisms of how permuted pitch sequences engage cortical
prediction circuits has not been studied in the peer-reviewed
literature as of the date of this disclosure. This document
discloses the technique and the motivating theory; experimental
verification remains future work.

---

## 13. Reference Implementation

A minimal, self-contained reference implementation in Web Audio API,
suitable for deployment as an `AudioWorkletProcessor`:

```javascript
// Reference implementation of Sonic Symmetry voice
// This code runs inside an AudioWorkletProcessor

class SymmetryProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options)
    const p = options.processorOptions
    this.f0       = p.f0         // base frequency (Hz)
    this.N        = p.nnotes     // number of notes
    this.I        = p.noctaves   // pitch span (octaves)
    this.D        = p.d          // cycle duration (s)
    this.sigma    = p.permfunc   // permutation function
    this.vol      = p.iniVolume  // volume scalar

    // Pre-allocated pitch array
    this._pitches = new Float32Array(this.N)
    for (let i = 0; i < this.N; i++) {
      this._pitches[i] = this.f0 * Math.pow(2, i * this.I / this.N)
    }

    // Pre-allocated permutation index array
    this._pi = new Int32Array(this.N)
    for (let i = 0; i < this.N; i++) this._pi[i] = i

    // Oscillator state (no allocation in process())
    this._theta     = 0.0    // audio phase (radians)
    this._noteIndex = 0      // current note position in cycle
    this._cycleStart = 0.0   // session time of current cycle start (s)
    this._cycleCount = 0     // number of completed cycles
    this._envPhase  = 0.0    // envelope phase within current note [0,1)
  }

  // Fisher-Yates shuffle (in-place, pre-allocated array)
  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp
    }
  }

  _applyPermutation() {
    const N = this.N
    switch (this.sigma) {
      case 0: // shuffle
        this._shuffle(this._pi)
        break
      case 1: // forward rotation
        const last = this._pi[0]
        for (let i = 0; i < N - 1; i++) this._pi[i] = this._pi[i + 1]
        this._pi[N - 1] = last
        break
      case 2: // backward rotation
        const first = this._pi[N - 1]
        for (let i = N - 1; i > 0; i--) this._pi[i] = this._pi[i - 1]
        this._pi[0] = first
        break
      case 3: // reversal
        for (let i = 0; i < Math.floor(N / 2); i++) {
          const tmp = this._pi[i]
          this._pi[i] = this._pi[N - 1 - i]
          this._pi[N - 1 - i] = tmp
        }
        break
      case 4: // identity — no change
        break
    }
  }

  process(inputs, outputs) {
    const channel = outputs[0][0]
    const fs      = sampleRate
    const noteSep = this.D / this.N    // onset interval (s)

    for (let s = 0; s < channel.length; s++) {
      const t = currentTime + s / fs

      // Current note position within cycle
      const cycleTime = t - this._cycleStart
      const noteIndex = Math.floor(cycleTime / noteSep)

      // Advance note / cycle
      if (noteIndex > this._noteIndex) {
        this._noteIndex = noteIndex
        this._envPhase = 0.0
        if (this._noteIndex >= this.N) {
          // Cycle complete — apply permutation, advance cycle
          this._applyPermutation()
          this._cycleCount++
          this._cycleStart += this.D
          this._noteIndex = 0
        }
      }

      // Current note frequency
      const noteInCycle = this._noteIndex % this.N
      const freq = this._pitches[this._pi[noteInCycle]]

      // Envelope (simplified: linear attack/release filling noteSep)
      const tInNote = (t - this._cycleStart - noteInCycle * noteSep)
      const envDur = noteSep
      const halfEnv = envDur * 0.5
      const env = tInNote < halfEnv
        ? tInNote / halfEnv                     // attack
        : (envDur - tInNote) / halfEnv          // release
      const clampedEnv = Math.max(0.0, Math.min(1.0, env))

      // Audio phase accumulation
      this._theta += 2 * Math.PI * freq / fs

      // Sample output
      channel[s] = this.vol * clampedEnv * Math.sin(this._theta)
    }
    return true
  }
}

registerProcessor('symmetry-processor', SymmetryProcessor)
```

**Note on the simplified envelope:** The above uses a symmetric
triangular envelope for clarity. The production implementation
in `public/worklets/symmetry.worklet.js` uses the adaptive
multi-regime envelope described in Section 8, with ADSR
parameters that scale with the available note duration.

---

## 14. Summary of Novel Contributions

For clarity of prior art scope, the novel technical elements
disclosed herein are:

1. **Logarithmically distributed pitch sequence for entrainment:**
   The construction of a pitch sequence Sₚ with N elements
   uniformly distributed on a logarithmic (musical) frequency
   scale over I octaves, used as the pitch content of a repeating
   cyclic auditory sequence within a sensory stimulation context.

2. **Algebraic group permutation of pitch ordering for perceptual
   engagement:** The application of elements of the symmetric
   group Sₙ — specifically shuffle, forward rotation, backward
   rotation, reversal, and identity — to the note ordering at
   each cycle boundary, with the specific purpose of controlling
   the degree of cross-cycle predictability in the sequence.

3. **Partial predictability micro-arcs:** The specific perceptual
   mechanism arising from the combination of (a) fixed note count
   N, (b) non-repeating within-cycle ordering, and (c) cycle-
   boundary permutation: the rising predictability from 1/N to
   certainty within each cycle, creating micro-reward cycles that
   sustain cortical engagement across session duration.

4. **Isochronic tones as degenerate special case:** The formal
   identification of traditional isochronic tone stimulation
   as the case I = 0 of the general Symmetry system, unifying
   the two techniques within a single parametric framework.

5. **Adaptive envelope scaling:** The envelope model in which
   note duration adapts to the onset interval Δτ across multiple
   regimes (equal duty at low rates through 100% duty at high
   rates), maintaining perceptual coherence across the full
   range from sparse ambient sequences to fast isochronic drives.

6. **Multi-voice temporal and spectral interaction:** The use
   of multiple simultaneously-playing Symmetry voices with
   different (N/D, f₀, I, σ) parameters to produce polyrhythm,
   phasing drift, and spectral beating effects, all arising
   from the independent parametric specifications of each voice.

7. **Integration with binaural beat voices in a dual-pathway
   session architecture:** The combination of Symmetry voices
   with Binaural beat voices in a single audio stream, where
   the Symmetry voice operates in a distinct spectral region
   to avoid interference with binaural beat perception, and
   the two voice types are proposed to engage distinct neural
   pathways (cortical-attentional vs. subcortical frequency-
   following) simultaneously.

---

*First disclosed: April 2026, BSC Lab public repository*
*Author: Renato Fabbri*
*License: CC BY 4.0 — free to use, implement, and extend*
*with attribution*
