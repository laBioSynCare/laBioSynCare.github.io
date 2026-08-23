// Pure compatibility adapters from the four legacy Sensory Field state models
// to ordinary Patch Studio tracks. These functions deliberately do not read
// storage, clocks, browser policy, or the session-only flash acknowledgement.

import {
  SENSORY_FIELD_MODEL,
  normalizeFieldState,
  resolveEarFrequencies,
} from '../field/fieldState.js'
import {
  TREE_MODEL,
  normalizeTreeState,
} from '../field/tree/treeState.js'
import {
  ABSTRACT_MODEL,
  normalizeAbstractState,
} from '../field/abstract/abstractState.js'
import { generateAbstract } from '../field/abstract/abstractScene.js'
import {
  LANDSCAPE_MODEL,
  normalizeLandscapeState,
} from '../field/landscape/landscapeState.js'
import { generateLandscape } from '../field/landscape/landscapeScene.js'
import {
  PATCH_STUDIO_MODEL,
  TREMOLO_PARAM_RANGE,
  VISUAL_PARAM_RANGE,
  createTempoSyncConfig,
} from './presetDraft.js'
import {
  createVisualStagePresentation,
  createVisualTrackConfig,
  isSpatialVisualTrackType,
} from './visualTrackModel.js'

export const FIELD_TRACK_BUNDLE_MODEL = 'patch-studio-track-bundle-1'
export const FIELD_ADAPTER_REPORT_MODEL = 'legacy-field-adapter-report-1'

const MAIN_FIELD_DEPTH_SCALE_PX = 160
const DEFAULT_TREE_BACKGROUND = '#07090c'

function valueParam(value, { tempoSync = false } = {}) {
  const param = { value, mods: [] }
  if (tempoSync) param.tempoSync = createTempoSyncConfig()
  return param
}

function modulation(id, controlId, amount) {
  return { id, controlId, amount, enabled: true }
}

function sinusoidTrack(id, name, rateHz, phaseRad) {
  return {
    id,
    type: 'Sinusoid',
    name,
    rateHz,
    phaseRad,
    amplitude: 1,
    tempoSync: { rateHz: createTempoSyncConfig() },
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function idResolver(idFor) {
  if (typeof idFor !== 'function') {
    throw new TypeError('Field adapters require an idFor(role) function.')
  }
  const ids = new Set()
  return (role) => {
    const id = idFor(role)
    if (typeof id !== 'string' || !id.trim()) {
      throw new TypeError(`idFor("${role}") must return a non-empty string.`)
    }
    const normalized = id.trim().slice(0, 120)
    if (ids.has(normalized)) {
      throw new Error(`idFor returned the duplicate id "${normalized}".`)
    }
    ids.add(normalized)
    return normalized
  }
}

function reportFor(sourceModel, { dropsSessionConsent = false } = {}) {
  return {
    model: FIELD_ADAPTER_REPORT_MODEL,
    sourceModel,
    targetModel: PATCH_STUDIO_MODEL,
    status: 'complete',
    mapped: [],
    dormant: [],
    behaviorCorrections: [],
    unsupported: [],
    ignored: dropsSessionConsent
      ? [{
          source: 'session-only safety acknowledgement',
          reason: 'Consent is deliberately neither persisted nor transferred.',
        }]
      : [],
    warnings: [],
  }
}

function mapped(report, source, target, detail) {
  report.mapped.push({ source, target, ...(detail ? { detail } : {}) })
}

function dormant(report, source, reason) {
  report.dormant.push({ source, reason })
}

function behaviorCorrection(report, code, source, detail) {
  report.behaviorCorrections.push({ code, source, detail })
}

function unsupported(report, code, source, reason) {
  report.unsupported.push({ code, source, reason })
}

function warning(report, code, source, detail) {
  report.warnings.push({ code, source, detail })
}

function finishReport(report) {
  report.status = report.unsupported.length ? 'partial' : 'complete'
  report.counts = {
    mapped: report.mapped.length,
    dormant: report.dormant.length,
    behaviorCorrections: report.behaviorCorrections.length,
    unsupported: report.unsupported.length,
    ignored: report.ignored.length,
    warnings: report.warnings.length,
  }
  return report
}

function bundle(sourceModel, tracks, stageSuggestion, report) {
  return {
    model: FIELD_TRACK_BUNDLE_MODEL,
    sourceModel,
    targetModel: PATCH_STUDIO_MODEL,
    controlTracks: tracks.controlTracks ?? [],
    audioTracks: tracks.audioTracks ?? [],
    visualTracks: tracks.visualTracks ?? [],
    hapticTracks: tracks.hapticTracks ?? [],
    stageSuggestion,
    report: finishReport(report),
  }
}

function visualTrack(id, trackType, {
  name = trackType,
  enabled = true,
  blend = 'screen',
  params,
  config,
} = {}) {
  const track = {
    id,
    trackType,
    name,
    enabled,
    blend,
    params,
    config: createVisualTrackConfig(trackType, config),
  }
  if (isSpatialVisualTrackType(trackType)) track.depthAffectsScale = false
  return track
}

function spatialParams(overrides = {}) {
  return {
    opacity: valueParam(overrides.opacity ?? 1),
    x: valueParam(overrides.x ?? 0),
    y: valueParam(overrides.y ?? 0),
    z: valueParam(overrides.z ?? 0),
    spatialScale: valueParam(overrides.spatialScale ?? 1),
    rotationSpeed: valueParam(overrides.rotationSpeed ?? 0, { tempoSync: true }),
  }
}

function audioTrack(id, trackType, {
  name,
  muted,
  gain,
  pan,
  frequency,
  tremolo,
  noiseColor,
} = {}) {
  const params = {
    gain: valueParam(gain),
    pan: valueParam(pan),
  }
  if (trackType === 'Carrier') params.frequency = valueParam(frequency)
  if (trackType === 'Noise') {
    params.cutoff = valueParam(6000)
    params.resonance = valueParam(0.707)
  }
  return {
    id,
    trackType,
    name,
    muted,
    windowSec: 1,
    tremolo,
    params,
    ...(trackType === 'Noise'
      ? { noiseColor, noiseFilter: 'lowpass' }
      : {}),
  }
}

function mainFieldTremolo(state, report) {
  if (state.audio.beatMode !== 'monaural') {
    return { enabled: false, rate: 4, depth: 0.5, mode: 'exponential' }
  }

  const [min, max] = TREMOLO_PARAM_RANGE.rate
  const rate = clamp(state.audio.beatRateHz, min, max)
  if (rate !== state.audio.beatRateHz) {
    unsupported(
      report,
      'monaural-rate-outside-patch-range',
      'audio.beatRateHz',
      `Patch Studio tremolo supports ${min}–${max} Hz; the adapted value is ${rate} Hz.`,
    )
  }
  return { enabled: true, rate, depth: 0.8, mode: 'linear' }
}

function adaptEarTracks(state, makeId, report) {
  const tracks = []
  const frequencies = resolveEarFrequencies(state)
  const tremolo = mainFieldTremolo(state, report)
  const ears = [
    {
      side: 'left',
      sourcePath: 'audio.left',
      pan: -1,
      source: state.audio.left,
      frequency: frequencies.left,
    },
    {
      side: 'right',
      sourcePath: state.audio.linkEars ? 'audio.left (expanded to right)' : 'audio.right',
      pan: 1,
      source: state.audio.linkEars ? state.audio.left : state.audio.right,
      frequency: frequencies.right,
    },
  ]

  if (state.audio.linkEars) {
    mapped(report, 'audio.linkEars', 'right-ear track expansion')
    dormant(report, 'audio.right', 'Linked ears use the effective left-ear source state.')
  }

  for (const ear of ears) {
    const prefix = ear.sourcePath
    tracks.push(audioTrack(makeId(`${ear.side}-tone`), 'Carrier', {
      name: `${ear.side === 'left' ? 'Left' : 'Right'}-ear tone`,
      muted: !state.audio.enabled || !ear.source.tone,
      gain: ear.source.gain,
      pan: ear.pan,
      frequency: ear.frequency,
      tremolo: { ...tremolo },
    }))
    mapped(
      report,
      `${prefix}.tone/freqHz/gain`,
      `audioTracks[${tracks.length - 1}]`,
      ear.source.tone
        ? undefined
        : 'The switched-off source is retained as a muted Carrier track.',
    )
    if (!ear.source.tone) {
      dormant(
        report,
        `${prefix}.tone`,
        'The source is switched off; its authored settings are retained with muted=true.',
      )
    }

    tracks.push(audioTrack(makeId(`${ear.side}-noise`), 'Noise', {
      name: `${ear.side === 'left' ? 'Left' : 'Right'}-ear noise`,
      muted: !state.audio.enabled || !ear.source.noise,
      gain: ear.source.gain,
      pan: ear.pan,
      noiseColor: ear.source.noiseColor,
      tremolo: { ...tremolo },
    }))
    mapped(
      report,
      `${prefix}.noise/noiseColor/gain`,
      `audioTracks[${tracks.length - 1}]`,
      ear.source.noise
        ? undefined
        : 'The switched-off source is retained as a muted Noise track.',
    )
    if (!ear.source.noise) {
      dormant(
        report,
        `${prefix}.noise`,
        'The source is switched off; its authored settings are retained with muted=true.',
      )
    }
  }

  mapped(report, 'audio.enabled + per-source switches', 'audioTracks[*].muted')
  if (!state.audio.enabled) {
    dormant(
      report,
      'audio.enabled',
      'Global audio is switched off; all authored source tracks are retained with muted=true.',
    )
  }

  const activeCarrierCount = ears.filter(ear => ear.source.tone).length
  const activeNoiseCount = ears.filter(ear => ear.source.noise).length
  const activeSourceCount = activeCarrierCount + activeNoiseCount
  if (state.audio.beatMode === 'monaural') {
    mapped(report, 'audio.beatMode + audio.beatRateHz', 'audioTracks[*].tremolo')
    if (!activeSourceCount) {
      dormant(
        report,
        'audio.beatMode + audio.beatRateHz',
        'Monaural tremolo is retained on muted tracks, but no source switch is on.',
      )
    }
    if (activeNoiseCount) {
      behaviorCorrection(
        report,
        'monaural-noise-live-update-fixed',
        'audio beat-rate updates on Noise sources',
        'The merged runtime applies monaural tremolo updates to both tone and noise; the standalone Field updated tone only after construction.',
      )
    }
  } else if (state.audio.beatMode === 'binaural' && activeCarrierCount) {
    mapped(report, 'audio.beatMode + audio.beatRateHz', 'resolved Carrier frequencies')
  } else if (state.audio.beatMode === 'binaural') {
    mapped(
      report,
      'audio.beatMode + audio.beatRateHz',
      'muted Carrier frequencies',
      'Resolved binaural frequencies are retained for later unmuting.',
    )
    dormant(
      report,
      'audio.beatMode + audio.beatRateHz',
      'No tone source switch is on; resolved binaural frequencies are retained on muted Carrier tracks.',
    )
  } else if (state.audio.beatMode === 'none') {
    dormant(report, 'audio.beatRateHz', 'No audio beat mode consumes the stored beat rate.')
  }
  return tracks
}

function applyDepthControls(state, depthTrack, makeId, report) {
  const controls = []
  const bySignal = new Map()

  function controlFor(source, phase) {
    const phaseName = phase === 0 ? 'sin' : 'cos'
    const key = `${source}:${phaseName}`
    if (bySignal.has(key)) return bySignal.get(key)
    const rateHz = source === 'beat'
      ? state.audio.beatRateHz
      : 1 / state.depth.breathPeriodSec
    const control = sinusoidTrack(
      makeId(`${source}-${phaseName}-control`),
      `${source === 'beat' ? 'Beat' : 'Breath'} ${phaseName === 'sin' ? 'sine' : 'cosine'}`,
      rateHz,
      phase,
    )
    controls.push(control)
    bySignal.set(key, control)
    return control
  }

  function link(paramName, source, amount, role, phase = 0) {
    if (!source || source === 'none') return
    const control = controlFor(source, phase)
    depthTrack.params[paramName].mods.push(modulation(
      makeId(`${role}-mod`),
      control.id,
      amount,
    ))
  }

  if (state.depth.source === 'static') {
    dormant(report, 'depth.modulationPx/breathPeriodSec', 'Static depth does not consume modulation settings.')
  } else {
    link(
      'z',
      state.depth.source,
      state.depth.modulationPx / MAIN_FIELD_DEPTH_SCALE_PX,
      'depth',
    )
    mapped(report, 'depth.source/modulationPx/breathPeriodSec', 'controlTracks[Sinusoid] → DepthMarkers.z')
    const low = state.depth.baseSeparationPx - state.depth.modulationPx
    const high = state.depth.baseSeparationPx + state.depth.modulationPx
    if (low < 0 || high > MAIN_FIELD_DEPTH_SCALE_PX) {
      unsupported(
        report,
        'legacy-depth-clamp-not-representable',
        'depth.baseSeparationPx + depth.modulationPx',
        'The legacy renderer clips animated separation to 0–160 px; the canonical signed Z transform has no equivalent one-sided clip.',
      )
    }
  }

  link(
    'x',
    state.depth.markerMotionXSource,
    state.depth.markerMotionXAmplitudePx / MAIN_FIELD_DEPTH_SCALE_PX,
    'marker-x',
  )
  link(
    'y',
    state.depth.markerMotionYSource,
    state.depth.markerMotionYAmplitudePx / MAIN_FIELD_DEPTH_SCALE_PX,
    'marker-y',
  )
  link(
    'x',
    state.depth.markerMotionCircleSource,
    state.depth.markerMotionCircleAmplitudePx / MAIN_FIELD_DEPTH_SCALE_PX,
    'marker-circle-x',
  )
  link(
    'y',
    state.depth.markerMotionCircleSource,
    state.depth.markerMotionCircleAmplitudePx / MAIN_FIELD_DEPTH_SCALE_PX,
    'marker-circle-y',
    Math.PI / 2,
  )

  for (const axis of ['X', 'Y', 'Circle']) {
    const source = state.depth[`markerMotion${axis}Source`]
    if (source !== 'none') {
      mapped(
        report,
        `depth.markerMotion${axis}Source/AmplitudePx`,
        axis === 'Circle'
          ? 'phase-locked Sinusoid controls → DepthMarkers.x/y'
          : `controlTracks[Sinusoid] → DepthMarkers.${axis.toLowerCase()}`,
      )
    }
  }

  if ([
    state.depth.markerMotionXSource,
    state.depth.markerMotionYSource,
    state.depth.markerMotionCircleSource,
  ].some(source => source !== 'none')) {
    warning(
      report,
      'pixel-motion-normalized',
      'depth.markerMotion*AmplitudePx',
      'Legacy CSS-pixel excursions are normalized against the 160 px compatibility stage; their final screen distance also depends on shared-stage fit and viewport size.',
    )
  }

  const xRange = state.depth.markerMotionXSource === 'none' ? 0 : state.depth.markerMotionXAmplitudePx
  const yRange = state.depth.markerMotionYSource === 'none' ? 0 : state.depth.markerMotionYAmplitudePx
  const circleRange = state.depth.markerMotionCircleSource === 'none'
    ? 0
    : state.depth.markerMotionCircleAmplitudePx
  if ((xRange + circleRange) / MAIN_FIELD_DEPTH_SCALE_PX > VISUAL_PARAM_RANGE.x[1]) {
    unsupported(
      report,
      'combined-x-motion-outside-patch-range',
      'depth.markerMotionXAmplitudePx + depth.markerMotionCircleAmplitudePx',
      'The combined authored X excursion can exceed the canonical normalized transform range.',
    )
  }
  if ((yRange + circleRange) / MAIN_FIELD_DEPTH_SCALE_PX > VISUAL_PARAM_RANGE.y[1]) {
    unsupported(
      report,
      'combined-y-motion-outside-patch-range',
      'depth.markerMotionYAmplitudePx + depth.markerMotionCircleAmplitudePx',
      'The combined authored Y excursion can exceed the canonical normalized transform range.',
    )
  }
  if (state.depth.markerTrajectoryEnabled) {
    unsupported(
      report,
      'legacy-trajectory-shape-not-representable',
      'depth.markerTrajectoryEnabled',
      'The canonical static reference trail is not identical to the legacy renderer-owned trajectory recipe.',
    )
  }

  return controls
}

/**
 * Expand a normalized snapshot of the main Sensory Field into ordinary tracks.
 * Dynamic spatial controls become explicit phase-addressable Sinusoid tracks;
 * they are never hidden in a renderer or approximated with the breathing LFO.
 */
export function adaptSensoryFieldState(input, { idFor } = {}) {
  const state = normalizeFieldState(input)
  const makeId = idResolver(idFor)
  const report = reportFor(SENSORY_FIELD_MODEL, { dropsSessionConsent: true })
  const [, blinkRateMax] = VISUAL_PARAM_RANGE.blinkRate
  const blinkRate = Math.min(state.visual.blinkRateHz, blinkRateMax)
  if (blinkRate !== state.visual.blinkRateHz) {
    unsupported(
      report,
      'blink-rate-outside-patch-range',
      'visual.blinkRateHz',
      `Patch Studio ColorField supports up to ${blinkRateMax} Hz; the adapted value is ${blinkRate} Hz.`,
    )
  }

  const colorTrack = visualTrack(makeId('color-field'), 'ColorField', {
    name: 'Sensory color field',
    enabled: state.visual.enabled,
    blend: 'normal',
    params: {
      opacity: valueParam(state.visual.intensity),
      blinkRate: valueParam(blinkRate, { tempoSync: true }),
      duty: valueParam(state.visual.blinkDuty),
    },
    config: {
      color: state.visual.color,
      offColor: state.visual.offColor,
      blinkEnabled: state.visual.blinkEnabled,
    },
  })
  mapped(report, 'visual', 'visualTracks[ColorField]')
  if (state.visual.blinkEnabled && state.visual.offColor !== '#000000') {
    behaviorCorrection(
      report,
      'off-color-activated',
      'visual.offColor',
      'The standalone Field persisted this value but blinked to a hard-coded black background. ColorField now delivers the authored off colour.',
    )
  }

  const visualTracks = [colorTrack]
  const controlTracks = []
  const stageSuggestion = createVisualStagePresentation({
    presentationMode: state.depth.enabled ? 'stereo-pair' : 'mono',
    viewingMode: state.depth.viewingMode,
    backgroundColor: '#000000',
    depthScalePx: state.depth.enabled ? MAIN_FIELD_DEPTH_SCALE_PX : 60,
    camera: { yawDeg: 0, autoRotate: false, autoRotateSec: 24 },
  })

  const depthTrack = visualTrack(makeId('depth-markers'), 'DepthMarkers', {
    name: 'Stereoscopic depth markers',
    enabled: state.visual.enabled && state.depth.enabled,
    blend: 'screen',
    params: spatialParams({ z: state.depth.baseSeparationPx / MAIN_FIELD_DEPTH_SCALE_PX }),
    config: {
      dotSizePx: state.depth.dotSizePx,
      showCartesianPlane: state.depth.showCartesianPlane,
      gridSize: state.depth.gridSize,
      gridDepthAxis: state.depth.gridDepthAxis,
      gridDepthRange: state.depth.gridDepthRangePx / MAIN_FIELD_DEPTH_SCALE_PX,
      gridDotScaleX: state.depth.gridDotScaleX,
      gridDotScaleY: state.depth.gridDotScaleY,
      trajectoryEnabled: state.depth.markerTrajectoryEnabled,
      trajectorySteps: state.depth.markerTrajectorySteps,
    },
  })
  visualTracks.push(depthTrack)
  mapped(report, 'depth.baseSeparationPx + depth marker recipe', 'visualTracks[DepthMarkers]')
  mapped(report, 'depth.enabled + visual.enabled', 'visualTracks[DepthMarkers].enabled')
  mapped(report, 'depth.viewingMode', 'stageSuggestion.viewingMode')
  if (state.depth.enabled) {
    controlTracks.push(...applyDepthControls(state, depthTrack, makeId, report))
  } else {
    dormant(
      report,
      'depth.enabled',
      'Depth is switched off; its authored marker recipe is retained on an enabled=false DepthMarkers track without creating live controls.',
    )
  }

  const audioTracks = adaptEarTracks(state, makeId, report)
  return bundle(
    SENSORY_FIELD_MODEL,
    { controlTracks, visualTracks, audioTracks },
    stageSuggestion,
    report,
  )
}

function stageFromView(view, backgroundColor) {
  return createVisualStagePresentation({
    presentationMode: view.renderMode,
    viewingMode: view.viewingMode,
    backgroundColor,
    depthScalePx: view.depthScalePx,
    zoom: view.zoom,
    strokeWidth: view.strokeWidth,
    depthColor: view.depthColor,
    camera: view.rotation,
  })
}

function sceneBundle({ sourceModel, trackType, config, view, backgroundColor, idFor, sourcePath }) {
  const makeId = idResolver(idFor)
  const report = reportFor(sourceModel)
  const track = visualTrack(makeId('scene'), trackType, {
    name: trackType.replace(/Scene$/, ' scene'),
    blend: 'normal',
    params: spatialParams(),
    config,
  })
  mapped(report, sourcePath, `visualTracks[${trackType}].config`)
  mapped(report, 'view', 'stageSuggestion')
  mapped(report, 'generated scene background', 'stageSuggestion.backgroundColor')
  return bundle(
    sourceModel,
    { visualTracks: [track] },
    stageFromView(view, backgroundColor),
    report,
  )
}

export function adaptTreeState(input, { idFor } = {}) {
  const state = normalizeTreeState(input)
  const view = {
    renderMode: state.renderMode,
    viewingMode: state.viewingMode,
    depthScalePx: state.depthScalePx,
    zoom: state.zoom,
    strokeWidth: state.strokeWidth,
    depthColor: state.depthColor,
    rotation: state.rotation,
  }
  return sceneBundle({
    sourceModel: TREE_MODEL,
    trackType: 'TreeScene',
    idFor,
    view,
    backgroundColor: DEFAULT_TREE_BACKGROUND,
    sourcePath: 'tree + showLeaves + showRoots',
    config: {
      ...state.tree,
      showLeaves: state.showLeaves,
      showRoots: state.showRoots,
    },
  })
}

export function adaptAbstractState(input, { idFor } = {}) {
  const state = normalizeAbstractState(input)
  return sceneBundle({
    sourceModel: ABSTRACT_MODEL,
    trackType: 'AbstractScene',
    idFor,
    view: state.view,
    backgroundColor: generateAbstract(state.params).background,
    sourcePath: 'params',
    config: state.params,
  })
}

export function adaptLandscapeState(input, { idFor } = {}) {
  const state = normalizeLandscapeState(input)
  return sceneBundle({
    sourceModel: LANDSCAPE_MODEL,
    trackType: 'LandscapeScene',
    idFor,
    view: state.view,
    backgroundColor: generateLandscape(state.params).background,
    sourcePath: 'params',
    config: state.params,
  })
}

export const FIELD_SCENE_ADAPTERS = Object.freeze({
  tree: adaptTreeState,
  abstract: adaptAbstractState,
  landscape: adaptLandscapeState,
})

export function adaptFieldSceneState(kind, input, options = {}) {
  const adapter = FIELD_SCENE_ADAPTERS[kind]
  if (!adapter) throw new Error(`Unknown Sensory Field scene kind: ${kind}`)
  return adapter(input, options)
}
