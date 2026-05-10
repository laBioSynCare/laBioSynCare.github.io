export const CONTROL_KINDS = ['LFO', 'Sequence']

export const LFO_WAVEFORMS = ['sine', 'triangle', 'square', 'saw', 'sample-hold']

export const STIM_TYPES = ['audio', 'visual']

export const AUDIO_WAVEFORMS = ['sine', 'triangle', 'square', 'saw', 'noise']

export const VISUAL_SHAPES = ['circle', 'square', 'ring', 'line', 'spiral']

export const VISUAL_MOTION = ['pulse', 'orbit', 'flicker', 'drift']

export const AUDIO_PARAMETER_OPTIONS = ['frequency', 'amplitude', 'pan', 'phase']

export const VISUAL_PARAMETER_OPTIONS = ['hue', 'size', 'opacity', 'rotation', 'x', 'y']

let nextControlId = 1
let nextStimulationId = 1
let nextRouteId = 1

export function createControlTrack(kind = 'LFO', overrides = {}) {
  const base = kind === 'Sequence'
    ? {
        id: `ctl-${nextControlId++}`,
        name: 'Pitch Sequence',
        kind: 'Sequence',
        valuesText: '0, 4, 7, 12',
        stepSec: 0.5,
        interpolation: 'hold',
        amount: 1,
      }
    : {
        id: `ctl-${nextControlId++}`,
        name: 'Primary LFO',
        kind: 'LFO',
        waveform: 'sine',
        rateHz: 0.1,
        depth: 1,
        offset: 0,
        phaseDeg: 0,
      }

  return { ...base, ...overrides }
}

export function createStimulationTrack(type = 'audio', overrides = {}) {
  const base = type === 'visual'
    ? {
        id: `stim-${nextStimulationId++}`,
        name: 'Visual Pulse',
        type: 'visual',
        shape: 'circle',
        color: '#7ad8c2',
        motion: 'pulse',
        size: 52,
        speed: 1,
        opacity: 0.75,
        rotation: 0,
        x: 0,
        y: 0,
      }
    : {
        id: `stim-${nextStimulationId++}`,
        name: 'Carrier A',
        type: 'audio',
        waveform: 'sine',
        baseFrequency: 400,
        amplitude: 0.2,
        pan: 0,
        phase: 0,
      }

  return { ...base, ...overrides }
}

export function createRoute(controlId = '', stimulationId = '', parameter = 'frequency', amount = 1, overrides = {}) {
  return {
    id: `route-${nextRouteId++}`,
    controlId,
    stimulationId,
    parameter,
    amount,
    enabled: true,
    ...overrides,
  }
}

export function createDraft() {
  const controlTracks = [
    createControlTrack('LFO', {
      name: 'Slow Pitch LFO',
      waveform: 'sine',
      rateHz: 0.08,
      depth: 1,
      offset: 0,
      phaseDeg: 0,
    }),
    createControlTrack('Sequence', {
      name: 'Step Sequence',
      valuesText: '0, 2, 5, 7, 12',
      stepSec: 0.35,
      interpolation: 'hold',
      amount: 1,
    }),
  ]

  const stimulationTracks = [
    createStimulationTrack('audio', {
      name: 'Carrier 400',
      waveform: 'sine',
      baseFrequency: 400,
      amplitude: 0.2,
      pan: 0,
      phase: 0,
    }),
    createStimulationTrack('visual', {
      name: 'Pulse Circle',
      shape: 'circle',
      color: '#88c9ff',
      motion: 'pulse',
      size: 48,
      speed: 1,
      opacity: 0.7,
      rotation: 0,
      x: 0,
      y: 0,
    }),
  ]

  return {
    patchName: 'Model 1 Patch',
    bpm: 60,
    lengthSec: 900,
    notes: 'Control tracks modulate stimulation tracks. Wellness support only; not a treatment claim.',
    controlTracks,
    stimulationTracks,
    routes: [
      createRoute(controlTracks[0].id, stimulationTracks[0].id, 'frequency', 100),
      createRoute(controlTracks[0].id, stimulationTracks[1].id, 'size', 16),
    ],
  }
}

export function modulationParametersFor(stimulationType) {
  return stimulationType === 'visual' ? VISUAL_PARAMETER_OPTIONS : AUDIO_PARAMETER_OPTIONS
}

export function patchSummary(draft) {
  const audioCount = draft.stimulationTracks.filter(track => track.type === 'audio').length
  const visualCount = draft.stimulationTracks.filter(track => track.type === 'visual').length
  const lfoCount = draft.controlTracks.filter(track => track.kind === 'LFO').length
  const sequenceCount = draft.controlTracks.filter(track => track.kind === 'Sequence').length
  const enabledRouteCount = draft.routes.filter(route => route.enabled !== false).length

  return {
    controlCount: draft.controlTracks.length,
    stimulationCount: draft.stimulationTracks.length,
    lfoCount,
    sequenceCount,
    audioCount,
    visualCount,
    routeCount: draft.routes.length,
    enabledRouteCount,
  }
}

export function buildPatchExport(draft) {
  const routes = draft.routes
    .map(route => {
      const control = draft.controlTracks.find(track => track.id === route.controlId)
      const stimulation = draft.stimulationTracks.find(track => track.id === route.stimulationId)
      if (!control || !stimulation) return null

      return {
        id: route.id,
        source: {
          controlTrackId: control.id,
          controlTrackName: control.name,
          kind: control.kind,
        },
        target: {
          stimulationTrackId: stimulation.id,
          stimulationTrackName: stimulation.name,
          type: stimulation.type,
          parameter: route.parameter,
        },
        amount: route.amount,
        enabled: route.enabled !== false,
      }
    })
    .filter(Boolean)

  return {
    model: 'patch-studio-model-1',
    patchName: draft.patchName,
    timing: {
      bpm: draft.bpm,
      lengthSec: draft.lengthSec,
    },
    notes: draft.notes,
    controlTracks: draft.controlTracks.map(track => ({ ...track })),
    stimulationTracks: draft.stimulationTracks.map(track => ({ ...track })),
    routes,
    analysis: analyzePatch(draft),
  }
}

export function analyzePatch(draft) {
  const lines = []

  for (const route of draft.routes) {
    if (route.enabled === false) continue

    const control = draft.controlTracks.find(track => track.id === route.controlId)
    const stimulation = draft.stimulationTracks.find(track => track.id === route.stimulationId)
    if (!control || !stimulation) continue

    if (stimulation.type === 'audio' && route.parameter === 'frequency') {
      const base = stimulation.baseFrequency ?? 0
      const range = estimateFrequencyRange(control, route.amount, base)
      lines.push({
        routeId: route.id,
        label: `${control.name} -> ${stimulation.name}.frequency`,
        details: range,
      })
      continue
    }

    if (control.kind === 'LFO') {
      lines.push({
        routeId: route.id,
        label: `${control.name} -> ${stimulation.name}.${route.parameter}`,
        details: {
          type: 'lfo-depth',
          amount: round(route.amount),
          controlDepth: round(control.depth ?? 0),
          effectiveDepth: round((route.amount ?? 0) * (control.depth ?? 0)),
        },
      })
    } else {
      const values = parseSequence(control.valuesText)
      lines.push({
        routeId: route.id,
        label: `${control.name} -> ${stimulation.name}.${route.parameter}`,
        details: {
          type: 'sequence-values',
          values,
          scaledValues: values.map(value => round(value * (route.amount ?? 0))),
          stepSec: round(control.stepSec ?? 0),
        },
      })
    }
  }

  return lines
}

export function validateDraft(draft) {
  const issues = []

  if (!draft.patchName?.trim()) {
    issues.push(errorIssue('Set a patch name.'))
  }

  if ((draft.bpm ?? 0) <= 0) {
    issues.push(errorIssue('BPM must be greater than zero.'))
  }

  if ((draft.lengthSec ?? 0) <= 0) {
    issues.push(errorIssue('Length must be greater than zero seconds.'))
  }

  if (draft.controlTracks.length === 0) {
    issues.push(errorIssue('Add at least one control track.'))
  }

  if (draft.stimulationTracks.length === 0) {
    issues.push(errorIssue('Add at least one stimulation track.'))
  }

  const controlIds = new Set(draft.controlTracks.map(track => track.id))
  const stimulationIds = new Set(draft.stimulationTracks.map(track => track.id))

  for (let index = 0; index < draft.controlTracks.length; index += 1) {
    const track = draft.controlTracks[index]
    const label = `Control track ${index + 1}`

    if (!track.name?.trim()) {
      issues.push(errorIssue(`${label}: add a name.`))
    }

    if (!CONTROL_KINDS.includes(track.kind)) {
      issues.push(errorIssue(`${label}: invalid control kind.`))
    }

    if (track.kind === 'LFO') {
      if (!LFO_WAVEFORMS.includes(track.waveform)) {
        issues.push(errorIssue(`${label}: invalid LFO waveform.`))
      }

      if ((track.rateHz ?? 0) <= 0) {
        issues.push(errorIssue(`${label}: LFO rate must be > 0.`))
      }

      if (Math.abs(track.depth ?? 0) > 20000) {
        issues.push(warnIssue(`${label}: depth is very high.`))
      }
    }

    if (track.kind === 'Sequence') {
      const values = parseSequence(track.valuesText)
      if (values.length === 0) {
        issues.push(errorIssue(`${label}: sequence needs at least one numeric step.`))
      }

      if ((track.stepSec ?? 0) <= 0) {
        issues.push(errorIssue(`${label}: sequence step must be > 0 sec.`))
      }
    }
  }

  for (let index = 0; index < draft.stimulationTracks.length; index += 1) {
    const track = draft.stimulationTracks[index]
    const label = `Stimulation track ${index + 1}`

    if (!track.name?.trim()) {
      issues.push(errorIssue(`${label}: add a name.`))
    }

    if (!STIM_TYPES.includes(track.type)) {
      issues.push(errorIssue(`${label}: invalid stimulation type.`))
      continue
    }

    if (track.type === 'audio') {
      if (!AUDIO_WAVEFORMS.includes(track.waveform)) {
        issues.push(errorIssue(`${label}: invalid waveform.`))
      }

      if ((track.baseFrequency ?? 0) <= 0) {
        issues.push(errorIssue(`${label}: base frequency must be > 0.`))
      }

      if ((track.amplitude ?? 0) < 0 || (track.amplitude ?? 0) > 1) {
        issues.push(errorIssue(`${label}: amplitude must stay between 0 and 1.`))
      }

      if ((track.baseFrequency ?? 0) > 20000) {
        issues.push(warnIssue(`${label}: base frequency is above the standard audible range.`))
      }
    }

    if (track.type === 'visual') {
      if (!VISUAL_SHAPES.includes(track.shape)) {
        issues.push(errorIssue(`${label}: invalid shape.`))
      }

      if (!VISUAL_MOTION.includes(track.motion)) {
        issues.push(errorIssue(`${label}: invalid motion type.`))
      }

      if ((track.opacity ?? 0) < 0 || (track.opacity ?? 0) > 1) {
        issues.push(errorIssue(`${label}: opacity must stay between 0 and 1.`))
      }
    }
  }

  for (let index = 0; index < draft.routes.length; index += 1) {
    const route = draft.routes[index]
    const label = `Route ${index + 1}`
    const control = draft.controlTracks.find(track => track.id === route.controlId)
    const stimulation = draft.stimulationTracks.find(track => track.id === route.stimulationId)

    if (!controlIds.has(route.controlId)) {
      issues.push(errorIssue(`${label}: source control track is missing.`))
    }

    if (!stimulationIds.has(route.stimulationId)) {
      issues.push(errorIssue(`${label}: target stimulation track is missing.`))
    }

    if (stimulation) {
      const allowed = modulationParametersFor(stimulation.type)
      if (!allowed.includes(route.parameter)) {
        issues.push(errorIssue(`${label}: parameter ${route.parameter} is not valid for ${stimulation.type}.`))
      }
    }

    if (!Number.isFinite(route.amount)) {
      issues.push(errorIssue(`${label}: amount must be numeric.`))
    }

    if (control?.kind === 'Sequence' && Math.abs(route.amount ?? 0) > 5000) {
      issues.push(warnIssue(`${label}: sequence modulation amount is very high.`))
    }
  }

  if (draft.routes.length === 0) {
    issues.push(warnIssue('No routes are defined yet. The patch has tracks but no modulation.'))
  } else if (draft.routes.every(route => route.enabled === false)) {
    issues.push(warnIssue('All routes are disabled. The patch has tracks but no active modulation.'))
  }

  return issues
}

export function estimateFrequencyRange(control, amount, baseFrequency) {
  const base = baseFrequency ?? 0

  if (control.kind === 'LFO') {
    const center = base + ((control.offset ?? 0) * (amount ?? 0))
    const span = Math.abs((control.depth ?? 0) * (amount ?? 0))
    return {
      type: 'frequency-range',
      minHz: round(center - span),
      maxHz: round(center + span),
      centerHz: round(center),
      source: 'lfo',
    }
  }

  const sequence = parseSequence(control.valuesText)
  if (sequence.length === 0) {
    return {
      type: 'frequency-range',
      minHz: round(base),
      maxHz: round(base),
      centerHz: round(base),
      source: 'sequence-empty',
    }
  }

  const scaled = sequence.map(value => value * (amount ?? 0))
  const min = Math.min(...scaled)
  const max = Math.max(...scaled)
  return {
    type: 'frequency-range',
    minHz: round(base + min),
    maxHz: round(base + max),
    centerHz: round(base + ((min + max) / 2)),
    source: 'sequence',
  }
}

export function parseSequence(valuesText) {
  return `${valuesText ?? ''}`
    .split(/\r?\n|,|\s+/)
    .map(value => Number(value.trim()))
    .filter(value => Number.isFinite(value))
}

function round(value, digits = 3) {
  const scale = 10 ** digits
  return Math.round(value * scale) / scale
}

function errorIssue(message) {
  return { level: 'error', message }
}

function warnIssue(message) {
  return { level: 'warning', message }
}
