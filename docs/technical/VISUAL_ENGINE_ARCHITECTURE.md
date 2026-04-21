# Visual Engine Architecture

> **For AI agents:** This document is the authoritative design
> specification for the BSC Lab visual subsystem. Before writing any
> code that renders session visuals, reads `AudioContext.currentTime`
> for visual purposes, or touches `PixiJS`, read this document.
> The `IVisualEngine` interface and audio clock coupling rules are
> absolute — see also `CLAUDE.md` section 3.1 for the clock invariant.

---

## 1. Design Goals

The visual engine has four distinct purposes, ordered here by
importance:

**1. Breathing guidance.** The primary visual function is providing
a clear, multi-cue representation of the current breathing phase to
users who have their eyes open, especially in the first few sessions
before the auditory cue alone is sufficient. The visual breathing
guide is synchronized to the audio breathing cue (Martigli/MB voice)
through a shared phase signal derived from `AudioContext.currentTime`.

**2. Attentional anchoring.** The session visuals occupy peripheral
attentional channels, providing a structured, slowly evolving
sensory stream that the default mode network can process without
competing for executive attention. Movement, pattern, and slow
environmental change are the design targets — not cognitive
engagement. Users should be able to work with the visuals present
or close their eyes entirely without the session losing its function.

**3. Session state communication.** The visual layer communicates
non-critical session metadata to the user in real time: elapsed
time, breathing rate, session phase, and any state transitions
(approaching end of session, breathing arc now at target rate, etc.).
This information should be peripherally perceptible without requiring
focused attention.

**4. Aesthetic character.** Different preset groups have different
visual characters: Heal sessions are warm and organic; Perform
sessions are clean and minimal; Transcend sessions may use slowly
dissolving geometry; Indulge sessions use richer, more intense
palettes. The visual engine renders the appropriate character for
the active preset group.

---

## 2. What BSC Visuals Are Not

This distinction is architecturally important and governs all
visual parameter choices.

**BSC visual stimulation is not photic driving (photostimulation).**
Photic driving — the use of rhythmic, high-contrast visual flicker
at a target frequency to drive visual cortex at that frequency — is
a valid Sensory Stimulation modality that belongs in scope conceptually
(see `docs/concept/SENSORY_STIMULATION.md`). However, BSC's current
visual elements are not designed to drive photic frequency-following
responses.

This is a deliberate design choice with safety and practical
motivations:

**Safety:** Rhythmic high-contrast visual flicker is the primary
trigger for photosensitive epilepsy seizures. The international
safe messaging standards (Harding 2005; W3C WCAG 2.1 criterion
2.3.1) define dangerous flicker as > 3 flashes per second with
contrast > 10%. BSC's breathing animations operate at
0.05–0.33 Hz (3–20 second cycles) with smooth, low-contrast
transitions — far outside the danger zone. This character must
be preserved in all implementations.

**Practical:** As noted in the AVE++ technical paper
(Fabbri, 2026), standard display hardware has significant
limitations for photic entrainment: monitor refresh rates
(60 Hz, 75 Hz) do not match common entrainment targets
(e.g., 32 Hz, 40 Hz), and refresh rate uniformity is not
guaranteed across devices. Using the visual channel for
breathing guidance exploits the visual system where it
can be reliably delivered; using it for frequency entrainment
would require hardware that standard consumer devices cannot
reliably provide.

**Visual elements must never:**
- Flash at rates above 3 Hz with high contrast
- Use on/off strobing at any frequency
- Produce luminance changes exceeding ~10% per frame at rates > 3 Hz

---

## 3. `IVisualEngine` Interface

All visual engine implementations expose this interface. The
`StimulationOrchestrator` calls only these methods.

```javascript
/**
 * @typedef {Object} VisualEngineCapabilities
 * @property {string}  implementationName  — 'PixiJSEngine' | 'CSSEngine'
 * @property {boolean} supportsWebGPU
 * @property {boolean} supportsWebGL2
 * @property {boolean} supportsWebGL1     — minimum; always true on modern browsers
 * @property {number}  estimatedFPS       — device's target frame rate
 * @property {boolean} reducedMotion      — true if prefers-reduced-motion is set
 */

/**
 * @typedef {Object} VisualState
 * Snapshot of the current visual session state, passed to updateBreathingPhase
 * and derived from AudioEngine timing state.
 * @property {number} breathingPhase   — [0,1), NaN if no breathing guide active
 * @property {number} breathingPeriod  — current cycle duration (s), NaN if none
 * @property {number} sessionElapsed   — seconds since session start
 * @property {number} sessionDuration  — total session duration (s)
 * @property {string} presetGroup      — 'Heal' | 'Support' | 'Perform' | 'Indulge' | 'Transcend'
 */

/**
 * @interface IVisualEngine
 *
 * A BSC visual engine implementation. Manages a rendering canvas,
 * responds to breathing phase updates from the audio engine's
 * timing state callback, and maintains its own rAF rendering loop.
 *
 * Clock invariant: the visual engine NEVER drives its own timing.
 * All animation positions are computed from the breathingPhase and
 * sessionElapsed values received from the audio engine. The visual
 * engine does not accumulate deltas or maintain its own elapsed time.
 */
class IVisualEngine {

  /**
   * Initialize the renderer. Creates the canvas and attaches it to
   * the provided container element. Must be called before any other
   * method.
   * @param {HTMLElement} container  — element to receive the canvas
   * @param {Object}      config     — engine-specific config (see implementations)
   * @returns {Promise<void>}
   */
  async initialize(container, config) { throw new Error('not implemented') }

  /**
   * Return current capabilities.
   * @returns {VisualEngineCapabilities}
   */
  getCapabilities() { throw new Error('not implemented') }

  /**
   * Configure the visual theme for a preset.
   * Called before each session starts. Engine loads color palettes,
   * particle system configs, and layout parameters for the group.
   * @param {string} presetGroup   — 'Heal' | 'Support' | 'Perform' | 'Indulge' | 'Transcend'
   * @param {Object} [themeConfig] — optional overrides
   * @returns {Promise<void>}
   */
  async setTheme(presetGroup, themeConfig) { throw new Error('not implemented') }

  /**
   * Start the rendering loop. Begins rAF updates; session visuals
   * appear. Must be called after initialize() and setTheme().
   */
  startRendering() { throw new Error('not implemented') }

  /**
   * Stop the rendering loop and reset to idle state.
   */
  stopRendering() { throw new Error('not implemented') }

  /**
   * Receive a timing state update from the audio engine.
   * Called approximately every 2.67 ms from the AudioWorklet
   * timing relay. The engine caches this state; the rAF loop
   * reads it at frame start.
   *
   * This method must be synchronous and very fast — it is called
   * from the onTimingState callback which runs on every audio block.
   * Do not perform any rendering here; only update cached state.
   *
   * @param {number} breathingPhase   — [0, 1), NaN if no breathing guide
   * @param {number} breathingPeriod  — current cycle duration (s)
   */
  updateBreathingPhase(breathingPhase, breathingPeriod) {
    throw new Error('not implemented')
  }

  /**
   * Notify the engine of overall session progress.
   * Called on each scheduler tick (~25 ms). Used for session arc
   * indicators (elapsed time display, breathing arc progress).
   * @param {number} sessionElapsed   — seconds elapsed
   * @param {number} sessionDuration  — total session duration (s)
   */
  updateSessionProgress(sessionElapsed, sessionDuration) {
    throw new Error('not implemented')
  }

  /**
   * Resize the canvas to match the container. Call after any
   * container dimension change.
   * @param {number} width
   * @param {number} height
   */
  resize(width, height) { throw new Error('not implemented') }

  /**
   * Pause rendering (e.g., when audio is paused). Canvas freezes
   * at current frame; rAF loop stops.
   */
  pause() { throw new Error('not implemented') }

  /**
   * Resume rendering after pause.
   */
  resume() { throw new Error('not implemented') }

  /**
   * Release all resources: destroy renderer, remove canvas from DOM.
   * @returns {Promise<void>}
   */
  async dispose() { throw new Error('not implemented') }
}
```

---

## 4. Audio Clock Coupling — The Critical Rule

The visual engine is a consumer of the audio clock, never a producer.
This is the invariant from `CLAUDE.md` section 3.1, stated here
in the visual context.

**The rAF loop pattern:**

```javascript
// In PixiJSEngine — the ONLY correct pattern
startRendering() {
  // PixiJS Ticker is the rAF wrapper; ticker.add() is called
  // on each frame at requestAnimationFrame rate
  this._app.ticker.add(() => {
    // 1. Read cached audio time state (written by updateBreathingPhase)
    const phi    = this._cachedBreathingPhase   // NaN if no guide
    const period = this._cachedBreathingPeriod  // NaN if no guide
    const elapsed = this._cachedSessionElapsed

    // 2. Compute ALL visual positions from phi and elapsed
    //    Never accumulate. Never use ticker.deltaTime as a time source.
    if (!isNaN(phi)) {
      this._renderBreathingGuide(phi, period)
    }
    this._renderAmbient(elapsed)
    this._renderProgressIndicator(elapsed, this._sessionDuration)

    // 3. PixiJS renders the scene graph
  })
}
```

**Why `ticker.deltaTime` is wrong for most BSC visuals:**
PixiJS's `ticker.deltaTime` is the elapsed time since the last
frame, normalized to 60 fps. Using it to accumulate position would
cause visual drift from audio if any frames are dropped — and frames
are routinely dropped during GC pauses. The correct approach computes
absolute position from `phi` and `elapsed`, which are authoritative
values derived from `AudioContext.currentTime`.

**Exception:** Particle system physics (velocity, gravity, dispersion)
are time-based effects where accumulated delta is appropriate and
slight drift from the audio clock is acceptable. Particle motion is
ambient texture, not a synchronized breathing cue. Use `ticker.deltaTime`
for particle physics; never for breathing guide geometry.

---

## 5. `PixiJSEngine` — Primary Implementation

**File:** `src/engines/visual/PixiJSEngine.js`

Uses [PixiJS v8](https://pixijs.com/8.x/) with automatic WebGPU/WebGL
renderer selection.

### 5.1 PixiJS v8 initialization

PixiJS v8 is a full architectural rewrite from v7. `Application`
initialization is asynchronous; all post-init code belongs in the
`await app.init()` promise chain, not the constructor.

```javascript
async initialize(container, config = {}) {
  const { Application } = await import('pixi.js')  // lazy: ~200KB gzipped

  this._app = new Application()

  await this._app.init({
    // WebGPU preferred; falls back to WebGL 2 then WebGL 1
    // 'auto' is the v8 default but stated explicitly for clarity
    preference: 'webgpu',
    background: config.backgroundColor ?? 0x0a0a0f,
    resizeTo: container,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio, 2),  // cap at 2× for perf
    autoDensity: true,
  })

  container.appendChild(this._app.canvas)
  this._buildSceneGraph()
  this._configureTheme('Heal')  // default theme until setTheme() is called
}
```

**PixiJS v8 breaking changes from v7 that implementers must know:**
- `PIXI.Application` → `Application` (namespace removed)
- `app.view` → `app.canvas` (the canvas element)
- `app.stage` → `app.stage` (unchanged)
- `new PIXI.Graphics()` → `new Graphics()` (namespace removed)
- `graphics.beginFill(color)` / `graphics.endFill()` → `graphics.fill(color)`
- `graphics.drawCircle()` → `graphics.circle()`
- `PIXI.Ticker.shared` → `app.ticker` (preferred for app-scoped use)
- `new PIXI.ParticleContainer()` → `new ParticleContainer()` with changed API
- `PIXI.Application.init()` is now async — the old synchronous constructor no longer exists
- `CapsuleGeometry` does not exist in v8 — use `RoundedRectangle` or circles

All examples from v7 tutorials are broken in v8. Always verify against
the v8 documentation at `pixijs.com/8.x/`.

### 5.2 Scene graph

```
app.stage
├── backgroundLayer     (Graphics, z=0)  — group-themed background gradient
├── particleLayer       (ParticleContainer, z=1)  — ambient particles
├── breathingGuideLayer (Container, z=2)  — breathing guide elements
│   ├── guideOrb        (Graphics circle)  — primary breathing indicator
│   ├── innerGlow       (Graphics, lower alpha)  — soft glow ring
│   └── phaseRing       (Graphics arc)  — phase progress indicator
├── ambientLayer        (Container, z=3)  — slow evolving geometry
└── hudLayer            (Container, z=4)  — session progress, minimal UI
    ├── progressArc     (Graphics arc)  — thin arc showing session elapsed
    └── breathRateLabel (Text, small, low opacity)  — current bpm display
```

All containers and their children are created once in `_buildSceneGraph()`
and reused across frames. Object pooling is used for particles. No new
PixiJS objects are created during the rendering loop.

### 5.3 Breathing guide renderer

The breathing guide is the most precisely synchronized visual element.
Its geometry is computed from the breathing phase `phi ∈ [0, 1)`:

```javascript
_renderBreathingGuide(phi, period) {
  // Scale: sinusoidal mapping matching BREATHING_MODEL.md Section 7
  // phi=0.0: center (inhale onset)  → medium scale
  // phi=0.25: full inhalation        → maximum scale
  // phi=0.5:  center (exhale onset) → medium scale
  // phi=0.75: full exhalation        → minimum scale
  const scaleFactor = 1.0 + Math.sin(2 * Math.PI * phi) * 0.35

  // Apply to orb (centered in canvas)
  const cx = this._app.screen.width  / 2
  const cy = this._app.screen.height / 2
  const baseRadius = Math.min(cx, cy) * 0.22  // 22% of min dimension
  const radius = baseRadius * scaleFactor

  // Hue shift: warm (exhale) → cool (inhale)
  // phi=0.25 (full inhale) → cooler hue; phi=0.75 (full exhale) → warmer
  const hueShift = Math.sin(2 * Math.PI * phi) * 0.15  // ±15% hue
  const color = this._computeBreathColor(phi, hueShift)

  // Redraw orb (Graphics clear + fill in v8)
  this._guideOrb.clear()
  this._guideOrb.circle(cx, cy, radius)
  this._guideOrb.fill({ color, alpha: 0.72 })

  // Inner glow (same phi, smaller radius, higher alpha on inhale)
  const glowAlpha = 0.15 + Math.sin(2 * Math.PI * phi) * 0.12
  this._innerGlow.clear()
  this._innerGlow.circle(cx, cy, radius * 0.6)
  this._innerGlow.fill({ color, alpha: glowAlpha })

  // Phase ring: thin arc showing progress through current breath
  this._renderPhaseRing(phi, cx, cy, baseRadius * 1.45)
}

_renderPhaseRing(phi, cx, cy, radius) {
  // Arc from 0 to phi × 2π (clockwise from top)
  const startAngle = -Math.PI / 2                // top of circle
  const endAngle   = startAngle + phi * 2 * Math.PI
  this._phaseRing.clear()
  this._phaseRing.arc(cx, cy, radius, startAngle, endAngle)
  this._phaseRing.stroke({ color: 0xffffff, alpha: 0.25, width: 1.5 })
}
```

The phase ring gives users a visual proxy for where they are in
the breath cycle independent of the orb scale — useful during
the learning period before the auditory cue is sufficient alone.

### 5.4 Group-themed color palettes

Each preset group has a primary color palette. These are applied
in `setTheme()` and referenced throughout the rendering loop via
`this._palette`:

```javascript
// Approximate hex values — exact palette tuned by Renato Fabbri
const PALETTES = {
  Heal:      { bg: 0x04101a, orb: 0x2a9fa8, glow: 0x85dce0, particle: 0x48bfcc },
  Support:   { bg: 0x0a0d14, orb: 0x3a5ecc, glow: 0x8baaf0, particle: 0x6688dd },
  Perform:   { bg: 0x0a0a0e, orb: 0x1a7a3a, glow: 0x4dcc7a, particle: 0x2fa84d },
  Indulge:   { bg: 0x120812, orb: 0x8c2fa8, glow: 0xcc80e0, particle: 0xaa55cc },
  Transcend: { bg: 0x06060f, orb: 0xc8a030, glow: 0xf0d070, particle: 0xe8c055 },
}
```

The `Heal` palette (aqua/teal) is warm and organic. `Perform`
(green) is clean and activating. `Transcend` (gold) is contemplative.
`Indulge` (purple) is experiential. `Support` (blue) is steady
and grounded.

Color hue shifts during the breath cycle stay within the same
color family — never jumping to a contrasting hue, which would
be visually jarring.

### 5.5 Ambient particle system

The particle layer provides slow-moving ambient texture. Particles
are independent of the breathing phase — they use `ticker.deltaTime`
for physics since precise audio sync is not needed:

```javascript
// Particle pool: pre-allocated, never re-created during session
// Each particle: { x, y, vx, vy, alpha, scale, texIdx }
_tickParticles(deltaSec) {
  for (let i = 0; i < this._particleCount; i++) {
    const p = this._particles[i]

    // Slow drift (no breathing sync)
    p.x += p.vx * deltaSec
    p.y += p.vy * deltaSec

    // Soft fade near edges and on age
    p.alpha *= (1 - deltaSec * 0.08)

    // Recycle when faded out
    if (p.alpha < 0.005) {
      this._resetParticle(p)
    }
  }
  this._particleContainer.update()
}
```

Particle count is capped based on device capability, derived from
`getCapabilities().estimatedFPS`:

```javascript
const particleCount = caps.estimatedFPS >= 60
  ? (caps.supportsWebGPU ? 600 : 300)
  : 150
```

### 5.6 Session progress HUD

A thin arc on the outer edge of the canvas fills clockwise as the
session progresses, reaching full circle at session end. This gives
users a peripheral awareness of session progress without a distracting
timer:

```javascript
_renderProgressIndicator(elapsed, duration) {
  const progress = Math.min(elapsed / duration, 1.0)
  const cx = this._app.screen.width  / 2
  const cy = this._app.screen.height / 2
  const r  = Math.min(cx, cy) * 0.92  // outer ring

  this._progressArc.clear()
  if (progress > 0.001) {
    const endAngle = -Math.PI / 2 + progress * 2 * Math.PI
    this._progressArc.arc(cx, cy, r, -Math.PI / 2, endAngle)
    this._progressArc.stroke({ color: 0xffffff, alpha: 0.12, width: 1 })
  }
}
```

The breathing rate label (current bpm = 60 / breathingPeriod)
is shown in the lower-right corner in a small, low-contrast font.
It is updated on each `updateSessionProgress()` call, not on every
frame (a once-per-second update is sufficient for a slowly changing
value).

### 5.7 Session end fade

At `sessionElapsed >= sessionDuration - 5`, the visual engine begins
a 5-second fade-out to a neutral state. The breathing guide fades
smoothly; the particle system stops emitting new particles. This
visual fade is complementary to the audio engine's volume ramp-down.

---

## 6. `CSSEngine` — Lightweight Fallback

**File:** `src/engines/visual/CSSEngine.js`

A CSS-animation-based fallback for devices where PixiJS performs
poorly or where the user has enabled `prefers-reduced-motion`.
Implements the same `IVisualEngine` interface with reduced visual
fidelity.

```javascript
// CSSEngine uses a single div with CSS custom properties driven
// from updateBreathingPhase()
updateBreathingPhase(phi, period) {
  this._cachedPhi = phi

  if (!isNaN(phi)) {
    // CSS custom properties update — efficient because no layout recalc
    const scale = 1.0 + Math.sin(2 * Math.PI * phi) * 0.35
    const alpha = 0.55 + Math.sin(2 * Math.PI * phi) * 0.17

    this._orbElement.style.setProperty('--orb-scale', scale)
    this._orbElement.style.setProperty('--orb-alpha', alpha)
    // CSS transition: 'transform 0.05s linear, opacity 0.05s linear'
    // handles interpolation between updates
  }
}
```

The CSS engine uses a single centered `div` element with a
`border-radius: 50%` circle, scaled and opacity-shifted via
`transform: scale(var(--orb-scale))` and `opacity: var(--orb-alpha)`.
CSS transitions smooth between updates even when the JavaScript
update rate is lower than the display frame rate.

**Capability trigger for CSSEngine:**
```javascript
const caps = pixiEngine.getCapabilities()
if (caps.reducedMotion || !caps.supportsWebGL1) {
  // Switch to CSSEngine
  await cssEngine.initialize(container, { group: presetGroup })
}
```

`prefers-reduced-motion` check via CSS media query:
```javascript
get reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
```

---

## 7. Phase-to-Visual Mapping Functions

The mathematical mapping between breathing phase `phi` and visual
properties must match `BREATHING_MODEL.md` Section 7 precisely:
`phi = 0` is inhale onset, `phi = 0.25` is full inhalation, `phi = 0.5`
is exhale onset, `phi = 0.75` is full exhalation. Both the audio
oscillator and the visual guide share this convention. Implementations
that reverse the mapping (showing contraction at phi=0.25) produce
a mismatched audio-visual experience that undermines the breathing
guidance function.

```javascript
// Canonical phase-to-scale mapping
// Returns scale factor ∈ [1-A, 1+A]
function phiToScale(phi, amplitude = 0.35) {
  return 1.0 + amplitude * Math.sin(2 * Math.PI * phi)
}

// Canonical phase-to-opacity mapping
// Returns opacity ∈ [base-A, base+A]
function phiToOpacity(phi, base = 0.65, amplitude = 0.15) {
  return base + amplitude * Math.sin(2 * Math.PI * phi)
}

// Canonical phase-to-vertical-position mapping (for layouts with space)
// Returns normalized displacement ∈ [-1, 1], positive = up
function phiToVertical(phi) {
  return Math.sin(2 * Math.PI * phi)
}

// Canonical phase-to-hue-rotation mapping
// Returns rotation in degrees: positive (inhale) → cooler, negative (exhale) → warmer
function phiToHueRotation(phi, amplitude = 15) {
  return amplitude * Math.sin(2 * Math.PI * phi)
}
```

All visual engines (PixiJSEngine, CSSEngine, and any future
implementations) must use these functions for breathing-synchronized
properties. The functions are exported from `src/engines/visual/phaseMapping.js`.

---

## 8. Engine Swapping (Research Feature)

Like the audio engine, the visual engine can be swapped mid-session
for research comparison. The `StimulationOrchestrator` handles this:

```javascript
async switchVisualEngine(newEngine) {
  const container = this._visualContainer

  // Pause current engine (freezes on current frame)
  this._visual.pause()

  // Initialize new engine with same container and theme
  await newEngine.initialize(container, {})
  await newEngine.setTheme(this._currentGroup)
  newEngine.startRendering()

  // Re-register timing state callback to new engine
  this._audio.onTimingState(state => {
    newEngine.updateBreathingPhase(state.breathingPhase, state.breathingPeriod)
  })

  // Dispose old engine (removes its canvas from container)
  await this._visual.dispose()
  this._visual = newEngine
}
```

Both engines briefly co-exist during the transition. The new engine's
canvas is added to the container; the old engine's canvas is still
present but frozen. After the new engine's `startRendering()` produces
its first frame, the old engine is disposed and its canvas removed.
The transition takes one frame — imperceptible.

---

## 9. Platform Constraints

### 9.1 PixiJS v8 WebGPU availability

WebGPU (as of April 2026) is available in Chrome 113+, Edge 113+,
and (behind a flag) Firefox 119+. Safari 18+ supports WebGPU on
macOS and iOS. PixiJS v8 automatically selects the best available
renderer:

```javascript
// PixiJS v8 renderer preference waterfall (automatic):
// 1. WebGPU         — best performance, lowest draw call overhead
// 2. WebGL 2        — good performance, widely supported
// 3. WebGL 1        — fallback for older devices (limited features)
```

The `getCapabilities()` method reports which was selected:
```javascript
getCapabilities() {
  return {
    supportsWebGPU:  this._app.renderer.type === RENDERER_TYPE.WEBGPU,
    supportsWebGL2:  this._app.renderer.type === RENDERER_TYPE.WEBGL
                     && this._gl instanceof WebGL2RenderingContext,
    supportsWebGL1:  this._app.renderer.type === RENDERER_TYPE.WEBGL,
    estimatedFPS:    this._app.ticker.maxFPS ?? 60,
    reducedMotion:   window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    implementationName: 'PixiJSEngine'
  }
}
```

### 9.2 Canvas performance budgets

The PixiJS scene graph must remain within render time budgets to
preserve the audio clock invariant (a visual engine that blocks the
main thread delays `onTimingState` callbacks):

- **Breathing guide redraw:** < 0.5 ms per frame. The guide uses
  `Graphics.clear() + circle() + fill()` — primitive operations
  with no texture loading.
- **Particle system update:** < 2 ms per frame. The entire pool
  is pre-allocated; no allocation per particle.
- **Full frame budget:** < 8 ms for all visual work at 60 fps
  (16.7 ms budget; audio callbacks and Svelte reactivity consume
  the rest).

If a frame exceeds 8 ms on two consecutive frames, the engine
logs a performance warning and considers reducing particle count.
It never reduces breathing guide fidelity.

### 9.3 Device pixel ratio handling

High-DPI displays (Retina, OLED phones) report `devicePixelRatio > 1`.
Rendering at full pixel ratio is expensive; for BSC's abstract
circular graphics, 2× resolution is visually indistinguishable
from 3× or 4×. The engine caps resolution at 2×:

```javascript
resolution: Math.min(window.devicePixelRatio, 2)
```

### 9.4 iOS Safari specifics

- WebGPU is supported on iOS 18+ Safari. PixiJS v8 should detect
  and use it.
- The canvas must be added to the DOM before `app.init()` resolves
  on some iOS versions. The `container.appendChild(this._app.canvas)`
  call is placed after `await app.init()` in the standard flow;
  if initialization fails, try adding the canvas to the DOM first.
- iOS throttles `requestAnimationFrame` in background tabs to ~1 fps.
  When the visual engine detects `document.hidden === true`, it
  pauses rendering (`stopRendering()`) to conserve battery. It
  resumes when `visibilitychange` fires with `document.hidden === false`.

```javascript
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    this.pause()
  } else {
    this.resume()
  }
})
```

### 9.5 `prefers-reduced-motion`

Users who have enabled reduced motion in their OS accessibility
settings expect minimal animation. The `CSSEngine` is selected
automatically (see Section 6). Even in `CSSEngine` mode, the
breathing guide must still animate — the visual breathing cue
is a functional element, not decoration. A static breathing guide
provides no guidance. Instead, the animation is made extremely
minimal: a slight opacity pulse rather than scale change.

---

## 10. Relationship to Audio Engine

The visual engine is strictly a consumer of the audio engine's
timing state. It never reads `AudioContext.currentTime` directly.
The `onTimingState` callback (registered by the Orchestrator)
delivers `breathingPhase` and `breathingPeriod` derived from
the audio clock. The visual engine caches these values and reads
them at the start of each rAF frame.

```
Audio thread (every 128 samples, ~2.67ms):
  AudioWorklet → postMessage({ phi, period }) → main thread

Main thread (onTimingState callback, ~2.67ms):
  Orchestrator.onTimingState → visualEngine.updateBreathingPhase(phi, period)
    → caches: this._cachedPhi = phi, this._cachedPeriod = period

Main thread (rAF callback, ~16.7ms at 60fps):
  PixiJS ticker.add → reads this._cachedPhi → renders frame
```

The audio delivers timing state at ~2.67 ms intervals; the visual
reads it at ~16.7 ms intervals. This means 6–7 timing state updates
arrive between each rendered frame. The visual engine uses the most
recently cached value — it does not average or interpolate. Since
breathing phase changes by at most `Δφ = 1/(P·f_audio) ≈ 0.00007`
per 2.67 ms at a 10s breath period, the error from using a slightly
stale phi value is < 0.0004 radians of phase — completely imperceptible.

---

## 11. Testing Strategy

**Visual regression tests** (in `tests/engines/visual/`):
- `BreathingGuideSync.test.js` — Given a mock timing state with phi=0.25,
  confirm orb scale is `1.0 + 0.35 * sin(π/2) = 1.35` (± 0.01)
- `PhiToScaleMapping.test.js` — Verify canonical `phiToScale` function
  matches the formula in Section 7 at phi=0, 0.25, 0.5, 0.75
- `NoHighContrastFlash.test.js` — Record 5 seconds of luminance values;
  confirm no transitions > 10% contrast occurring > 3 times/second

**Manual testing checklist:**
- [ ] Breathing guide scale visibly increases on "inhale" and decreases
      on "exhale" (matching audio sweep direction)
- [ ] Switching between PixiJSEngine and CSSEngine mid-session is seamless
- [ ] Canvas resizes correctly when browser window is resized
- [ ] `prefers-reduced-motion` selects CSSEngine automatically
- [ ] Background tab: visual freezes; audio continues; visual resumes
      in sync when tab is foregrounded
- [ ] iOS Safari: canvas initializes; session renders; haptic absent silently

---

*Document version: April 2026*
*Maintained by: Renato Fabbri*
*Review required when: PixiJS v8 receives breaking changes, new group
themes are added, SafeVision (future: reduced-motion visual presets)
is designed, or visual stimulation research changes the parameter
envelope for safe visual design.*
