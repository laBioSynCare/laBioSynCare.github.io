// Pure modulation + tempo-sync math for the Patch Studio, extracted from
// PresetCreator.svelte. No component / reactive / engine state: every input is
// passed in, so these functions are unit-testable. The component keeps thin
// wrappers that own the liveValues cache, the writeAudio side effect, and the
// reactive bpmEnabled() read, and delegate the arithmetic here.
// See docs/technical/PATCH_STUDIO.md §11.2–§11.3.
import { clamp, tempoValueFromSync } from './tempo.js'

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

// Clamp `value` into the [min, max] of ranges[name]; pass through unchanged when
// the param has no declared range.
export function clampRange(value, ranges, name) {
  const r = ranges?.[name]
  if (!r) return value
  return clamp(value, r[0], r[1])
}

// Symmetric knob range for a modulation amount: ±span of the target param, with
// a sane minimum step. Used by the mod-amount slider.
export function modAmountRange(paramMin, paramMax, paramStep) {
  const span = Math.max(0.01, Math.abs(num(paramMax) - num(paramMin)))
  const stepValue = Math.max(0.0001, Math.abs(num(paramStep, span / 100)))
  return [-span, span, stepValue]
}

// A tempo-synced param derives its value from musical divisions of the BPM when
// BPM is enabled; otherwise it uses its raw fallback (the knob value).
export function effectiveTempoValue(param, fallbackValue, tempoKind, tempoContext, bpmEnabled) {
  if (!bpmEnabled) return fallbackValue
  return tempoValueFromSync(param?.tempoSync, tempoKind, tempoContext, fallbackValue)
}

// Sum of enabled modulation contributions: Σ amountᵢ · controlValueᵢ.
// `controlValues` is a Map<controlId, number>. Disabled mods and control ids
// that no longer resolve contribute nothing.
export function sumMods(mods, controlValues) {
  let delta = 0
  for (const mod of mods ?? []) {
    if (mod.enabled === false) continue
    const cv = controlValues.get(mod.controlId)
    if (cv == null) continue
    delta += (Number(mod.amount) || 0) * cv
  }
  return delta
}

// Live value of one sensory parameter: clamp(base + Σ amount·control), where
// `base` is the tempo-effective value when the param is tempo-synced, else the
// knob value. `gain` collapses to 0 when the track is muted.
export function evalParamValue(param, {
  name,
  ranges,
  controlValues,
  tempoKind = null,
  tempoContext = null,
  bpmEnabled = false,
  muted = false,
} = {}) {
  let v = tempoKind
    ? effectiveTempoValue(param, param.value, tempoKind, tempoContext, bpmEnabled)
    : param.value
  v += sumMods(param.mods, controlValues)
  v = clampRange(v, ranges, name)
  if (muted && name === 'gain') v = 0
  return v
}

// BinauralBeat virtual-param resolution: the user modulates centerFreq / beatFreq
// but the engine consumes leftFreq / rightFreq. Apply the center and beat
// modulations, then split back into a clamped carrier pair — no pan, the pair is
// hard-panned L/R by definition (ADR 0005). `beatBase` is the already
// tempo-effective base beat (right − left at rest); `range` is [min, max] Hz.
export function resolveBinauralLR({
  baseLeft,
  baseRight,
  beatBase,
  centerMods,
  beatMods,
  controlValues,
  range,
}) {
  const center = (baseLeft + baseRight) / 2 + sumMods(centerMods, controlValues)
  const beat = beatBase + sumMods(beatMods, controlValues)
  const [fmin, fmax] = range
  return {
    leftFreq: clamp(center - beat / 2, fmin, fmax),
    rightFreq: clamp(center + beat / 2, fmin, fmax),
  }
}
