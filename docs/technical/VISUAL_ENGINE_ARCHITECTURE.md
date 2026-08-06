# Visual Engine Architecture

> **Target design.** No PixiJS visual engine exists yet. Visual stimuli are
> authored and previewed today as live CSS/DOM elements in the Patch Studio —
> see [`PATCH_STUDIO.md` §5](PATCH_STUDIO.md) for the implemented track types
> (`Geometry`, `Particles`, `Gradient`, `Blink`, `Oscillate`, `Pacer`, `Ripple`,
> `Spiral`, `Mandala`), their parameters, blend modes, and the mixed stage — and
> [`SENSORY_FIELD.md`](SENSORY_FIELD.md) for the bounded exposure instrument.
> All output is gated by [`PHOTOSENSITIVITY_SAFETY.md`](PHOTOSENSITIVITY_SAFETY.md).
> The contracts below are what that preview layer graduates into.
>
> The clock invariant in `CLAUDE.md` §3.1 is absolute regardless of build state.

## 1. Design goals

Four purposes, in priority order:

1. **Breathing guidance.** A clear, multi-cue rendering of current breathing
   phase for users with their eyes open — most valuable in early sessions,
   before the auditory cue alone suffices. Synchronized to the Martigli/MB voice
   through a phase signal derived from `AudioContext.currentTime`.
2. **Attentional anchoring.** A slowly evolving peripheral stream that can be
   processed without competing for executive attention. Movement, pattern, and
   slow change are the targets — not cognitive engagement. A session must lose
   nothing if the user closes their eyes.
3. **Session state.** Elapsed time, breathing rate, phase, and transitions,
   peripherally perceptible without focused attention.
4. **Aesthetic character** per preset group: Heal warm and organic, Perform
   clean and minimal, Transcend slowly dissolving, Indulge richer and more
   intense.

## 2. What BSC visuals are not

Architecturally important, and it governs every visual parameter choice.

**BSC visual stimulation is not photic driving.** Rhythmic high-contrast flicker
that drives visual cortex at a target frequency is in conceptual scope
([`../concept/SENSORY_STIMULATION.md`](../concept/SENSORY_STIMULATION.md)) but is
deliberately not what BSC's visual elements do, for two reasons:

- **Safety.** High-contrast rhythmic flicker is the primary photosensitive-
  epilepsy trigger; Harding 2005 and WCAG 2.1 §2.3.1 put the danger zone above
  3 flashes/second at over 10% contrast. Breathing animations run at
  0.05–0.33 Hz (3–20 s cycles) with smooth low-contrast transitions, far
  outside it. Every implementation must preserve that character.
- **Hardware.** Display refresh rates (60, 75 Hz) do not divide common
  entrainment targets such as 32 or 40 Hz, and uniformity is not guaranteed
  across devices. The visual channel is used where it is reliable.

**Visual elements must never** flash above 3 Hz at high contrast, strobe on/off
at any frequency, or change luminance more than ~10% per frame above 3 Hz. The
runtime enforcement of this is
[`PHOTOSENSITIVITY_SAFETY.md`](PHOTOSENSITIVITY_SAFETY.md).

## 3. `IVisualEngine` interface

Implementations expose `initialize(container, config)`, `getCapabilities()`,
`setTheme(presetGroup, themeConfig)`, `startRendering()`, `stopRendering()`,
`updateBreathingPhase(phase, period)`, `updateSessionProgress(elapsed,
duration)`, `resize(width, height)`, `pause()`, `resume()`, and `dispose()`.
Capabilities report the selected renderer (WebGPU / WebGL 2 / WebGL 1),
`estimatedFPS`, and `reducedMotion`.

`updateBreathingPhase` is called from the audio timing relay on every audio
block (~2.67 ms). **It must be synchronous, fast, and render nothing** — it only
updates cached state, which the rAF loop reads at frame start. `breathingPhase`
is `NaN` when no breathing guide is active.

## 4. Audio clock coupling — the critical rule

The visual engine consumes the audio clock and never produces one. It does not
read `AudioContext.currentTime` itself: the orchestrator registers
`onTimingState` and forwards phase and period to it.

Each frame computes **absolute** positions from the cached `phi` and `elapsed`.
Never accumulate, and never use a frame delta (`ticker.deltaTime`) as a time
source — dropped frames during GC would drift the visuals away from the audio.

**The one exception** is particle physics — velocity, gravity, dispersion —
where accumulated delta is appropriate and slight drift is acceptable, because
particles are ambient texture rather than a synchronized cue. Never use a delta
for breathing-guide geometry.

Timing state arrives ~6–7 times per rendered frame (2.67 ms vs 16.7 ms). The
engine uses the most recent cached value without averaging or interpolating: at
a 10 s breath period, phase advances ~0.00007 per audio block, so a slightly
stale value costs under 0.0004 radians — imperceptible.

## 5. Implementations

**`PixiJSEngine` (primary).** [PixiJS v8](https://pixijs.com/8.x/) with
automatic WebGPU → WebGL 2 → WebGL 1 selection. v8 is a full rewrite of v7 and
v7 examples produce broken code; the traps are `await app.init()` rather than a
synchronous constructor, `app.canvas` not `app.view`, `graphics.circle()` not
`drawCircle()`, `graphics.fill()` not `beginFill()/endFill()`, and no
`CapsuleGeometry`. Import it lazily (~200 KB gzipped). Cap resolution at
`Math.min(devicePixelRatio, 2)` — beyond 2× is indistinguishable for abstract
circular graphics and costs real frame time.

**`CSSEngine` (fallback).** Selected automatically when `prefers-reduced-motion`
is set or WebGL is unavailable: a single CSS-animated element driven by custom
properties written in `updateBreathingPhase`. Even here the breathing guide must
keep animating — it is a functional cue, not decoration, and a static guide
guides nothing. Reduce it to a slight opacity pulse rather than a scale change.

**Swapping** is orchestrator-owned and takes one frame: pause the old engine,
initialize and theme the new one into the same container, start it, re-register
the timing callback, then dispose the old engine and remove its canvas. Both
canvases briefly co-exist, the old one frozen.

## 6. Phase-to-visual mapping

Every implementation uses these canonical functions for breathing-synchronized
properties, exported from `src/engines/visual/phaseMapping.js` (planned):

```javascript
phiToScale(phi, amplitude = 0.35)         // 1.0 + A·sin(2πφ)     → [1-A, 1+A]
phiToOpacity(phi, base = 0.65, amp = 0.15) // base + A·sin(2πφ)
phiToVertical(phi)                         // sin(2πφ)             → [-1, 1], + is up
phiToHueRotation(phi, amplitude = 15)      // A·sin(2πφ), degrees; + inhale = cooler
```

The phase convention must match [`BREATHING_MODEL.md`](BREATHING_MODEL.md) §7
exactly: `φ=0` inhale onset, `φ=0.25` full inhalation, `φ=0.5` exhale onset,
`φ=0.75` full exhalation. Reversing it (contraction at `φ=0.25`) produces an
audio-visual mismatch that defeats the guidance function.

## 7. Platform constraints

**Frame budget.** A visual engine that blocks the main thread delays
`onTimingState`, so the scene graph stays inside: breathing guide redraw
< 0.5 ms (primitive `clear`/`circle`/`fill`, no texture loads), particle update
< 2 ms against a pre-allocated pool, and < 8 ms total visual work per frame at
60 Hz — audio callbacks and Svelte reactivity need the rest of the 16.7 ms. On
two consecutive overruns, reduce particle count. Never reduce breathing-guide
fidelity.

**iOS Safari.** WebGPU on iOS 18+. On some versions the canvas must be in the
DOM before `app.init()` resolves — if initialization fails, append first and
retry. iOS throttles rAF to ~1 fps in background tabs, so pause on
`visibilitychange` when `document.hidden` and resume when it clears.

**Reduced motion** selects `CSSEngine`, subject to the guidance caveat in §5.

## 8. Verification

Planned tests: `phiToScale` matching §6 at `φ = 0, 0.25, 0.5, 0.75`; a mock
timing state at `φ=0.25` producing orb scale 1.35 ± 0.01; and a luminance
recording confirming no >10% contrast transition occurs more than 3 times per
second.

By hand: guide expands on inhale and contracts on exhale, matching the audio
sweep; engine switch mid-session is seamless; canvas resizes with the window;
`prefers-reduced-motion` selects `CSSEngine`; a backgrounded tab freezes the
visuals, keeps the audio, and resumes in sync; iOS Safari renders with haptics
silently absent.
