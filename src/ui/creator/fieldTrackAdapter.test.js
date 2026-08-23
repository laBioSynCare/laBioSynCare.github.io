import { describe, expect, it } from 'vitest'
import { createFieldState } from '../field/fieldState.js'
import { createTreeState } from '../field/tree/treeState.js'
import { createAbstractState } from '../field/abstract/abstractState.js'
import { createLandscapeState } from '../field/landscape/landscapeState.js'
import {
  AUDIO_PARAM_RANGE,
  buildPatchExport,
  createEmptyDraft,
  draftFromPatchExport,
} from './presetDraft.js'
import { evalParamValue } from './modulation.js'
import {
  FIELD_TRACK_BUNDLE_MODEL,
  adaptAbstractState,
  adaptFieldSceneState,
  adaptLandscapeState,
  adaptSensoryFieldState,
  adaptTreeState,
} from './fieldTrackAdapter.js'

const ids = (prefix = 'field') => (role) => `${prefix}-${role}`

function effectiveVoiceGain(track) {
  return evalParamValue(track.params.gain, {
    name: 'gain',
    ranges: AUDIO_PARAM_RANGE,
    controlValues: new Map(),
    muted: track.muted,
  })
}

describe('legacy Sensory Field track adapter', () => {
  it('deterministically expands the default field without retaining consent', () => {
    const source = createFieldState()
    source.flashRiskAccepted = true
    const before = JSON.parse(JSON.stringify(source))

    const first = adaptSensoryFieldState(source, { idFor: ids() })
    const second = adaptSensoryFieldState(source, { idFor: ids() })

    expect(first).toEqual(second)
    expect(source).toEqual(before)
    expect(first.model).toBe(FIELD_TRACK_BUNDLE_MODEL)
    expect(first.controlTracks).toEqual([])
    expect(first.hapticTracks).toEqual([])
    expect(first.visualTracks).toHaveLength(2)
    expect(first.visualTracks[0]).toMatchObject({
      id: 'field-color-field',
      trackType: 'ColorField',
      enabled: true,
      blend: 'normal',
      config: {
        color: '#3355ff',
        offColor: '#000000',
        blinkEnabled: false,
      },
    })
    expect(first.visualTracks[0].params.opacity.value).toBe(0.6)
    expect(first.visualTracks[1]).toMatchObject({
      id: 'field-depth-markers',
      trackType: 'DepthMarkers',
      enabled: false,
    })
    expect(first.audioTracks).toHaveLength(4)
    expect(first.audioTracks.map(track => track.trackType)).toEqual([
      'Carrier', 'Noise', 'Carrier', 'Noise',
    ])
    expect(first.audioTracks.map(track => track.params.pan.value)).toEqual([-1, -1, 1, 1])
    expect(first.audioTracks.filter(track => track.trackType === 'Carrier')
      .map(track => track.params.frequency.value)).toEqual([200, 200])
    expect(first.audioTracks.map(track => track.muted)).toEqual([false, true, false, true])
    expect(first.audioTracks.map(effectiveVoiceGain)).toEqual([0.18, 0, 0.18, 0])
    expect(first.report.status).toBe('complete')
    expect(first.report.ignored).toHaveLength(1)
    expect(JSON.stringify(first)).not.toContain('flashRiskAccepted')
  })

  it.each([
    { sourceKind: 'tone', linkEars: true, audioEnabled: true },
    { sourceKind: 'tone', linkEars: true, audioEnabled: false },
    { sourceKind: 'tone', linkEars: false, audioEnabled: true },
    { sourceKind: 'tone', linkEars: false, audioEnabled: false },
    { sourceKind: 'noise', linkEars: true, audioEnabled: true },
    { sourceKind: 'noise', linkEars: true, audioEnabled: false },
    { sourceKind: 'noise', linkEars: false, audioEnabled: true },
    { sourceKind: 'noise', linkEars: false, audioEnabled: false },
  ])('retains a switched-off $sourceKind source (linked=$linkEars, global=$audioEnabled)', ({
    sourceKind,
    linkEars,
    audioEnabled,
  }) => {
    const source = createFieldState()
    source.audio.enabled = audioEnabled
    source.audio.linkEars = linkEars
    Object.assign(source.audio.left, {
      tone: true,
      freqHz: 240,
      noise: true,
      noiseColor: 'brown',
      gain: 0.22,
    })
    Object.assign(source.audio.right, {
      tone: true,
      freqHz: 360,
      noise: true,
      noiseColor: 'white',
      gain: 0.47,
    })
    source.audio.left[sourceKind] = false

    const result = adaptSensoryFieldState(source, { idFor: ids('retained') })
    const trackType = sourceKind === 'tone' ? 'Carrier' : 'Noise'
    const left = result.audioTracks.find(track => (
      track.id === `retained-left-${sourceKind}`
    ))
    const right = result.audioTracks.find(track => (
      track.id === `retained-right-${sourceKind}`
    ))
    const otherType = sourceKind === 'tone' ? 'Noise' : 'Carrier'
    const otherTracks = result.audioTracks.filter(track => track.trackType === otherType)

    expect(result.audioTracks).toHaveLength(4)
    expect(left).toMatchObject({ trackType, muted: true })
    expect(left.params.gain.value).toBe(0.22)
    expect(effectiveVoiceGain(left)).toBe(0)
    if (sourceKind === 'tone') {
      expect(left.params.frequency.value).toBe(240)
    } else {
      expect(left.noiseColor).toBe('brown')
    }

    expect(right.muted).toBe(!audioEnabled || linkEars)
    expect(right.params.gain.value).toBe(linkEars ? 0.22 : 0.47)
    expect(effectiveVoiceGain(right)).toBe(right.muted ? 0 : right.params.gain.value)
    if (sourceKind === 'tone') {
      expect(right.params.frequency.value).toBe(linkEars ? 240 : 360)
    } else {
      expect(right.noiseColor).toBe(linkEars ? 'brown' : 'white')
    }
    expect(otherTracks.map(track => track.muted)).toEqual([
      !audioEnabled,
      !audioEnabled,
    ])
    expect(otherTracks.map(effectiveVoiceGain)).toEqual(
      audioEnabled
        ? [0.22, linkEars ? 0.22 : 0.47]
        : [0, 0],
    )
    expect(result.report.dormant.some(item => (
      item.source === `audio.left.${sourceKind}`
      && item.reason.includes('retained with muted=true')
    ))).toBe(true)

    const draft = {
      ...createEmptyDraft(),
      visualStage: result.stageSuggestion,
      controlTracks: result.controlTracks,
      audioTracks: result.audioTracks,
      visualTracks: result.visualTracks,
    }
    const imported = draftFromPatchExport(buildPatchExport(draft))
    expect(imported.audioTracks).toEqual(result.audioTracks)
  })

  it('retains disabled depth as an inactive fixed-point visual recipe', () => {
    const source = createFieldState()
    source.depth.enabled = false
    source.depth.viewingMode = 'cross'
    source.depth.baseSeparationPx = 72
    source.depth.dotSizePx = 24
    source.depth.gridSize = 5
    source.depth.gridDepthAxis = 'x'
    source.depth.gridDepthRangePx = 32
    source.depth.gridDotScaleX = 1.5
    source.depth.gridDotScaleY = 0.75
    source.depth.markerTrajectoryEnabled = true
    source.depth.markerTrajectorySteps = 18

    const result = adaptSensoryFieldState(source, { idFor: ids('depth-off') })
    const depth = result.visualTracks.find(track => track.trackType === 'DepthMarkers')

    expect(result.stageSuggestion).toMatchObject({
      presentationMode: 'mono',
      viewingMode: 'cross',
    })
    expect(result.controlTracks).toEqual([])
    expect(depth).toMatchObject({
      id: 'depth-off-depth-markers',
      enabled: false,
      params: { z: { value: 72 / 160 } },
      config: {
        dotSizePx: 24,
        gridSize: 5,
        gridDepthAxis: 'x',
        gridDepthRange: 32 / 160,
        gridDotScaleX: 1.5,
        gridDotScaleY: 0.75,
        trajectoryEnabled: true,
        trajectorySteps: 18,
      },
    })
    expect(result.report.dormant).toContainEqual(expect.objectContaining({
      source: 'depth.enabled',
      reason: expect.stringContaining('enabled=false DepthMarkers'),
    }))

    const draft = {
      ...createEmptyDraft(),
      visualStage: result.stageSuggestion,
      controlTracks: result.controlTracks,
      audioTracks: result.audioTracks,
      visualTracks: result.visualTracks,
    }
    const imported = draftFromPatchExport(buildPatchExport(draft))
    expect(imported.visualTracks).toEqual(result.visualTracks)
    expect(imported.visualStage).toEqual(result.stageSuggestion)
  })

  it('maps static depth, independent ears, and monaural tremolo to ordinary tracks', () => {
    const source = createFieldState()
    source.visual.enabled = false
    source.depth.enabled = true
    source.depth.viewingMode = 'cross'
    source.depth.baseSeparationPx = 80
    source.depth.gridDepthRangePx = 40
    source.depth.gridDepthAxis = 'both'
    source.depth.markerTrajectoryEnabled = true
    source.audio.enabled = false
    source.audio.linkEars = false
    source.audio.beatMode = 'monaural'
    source.audio.beatRateHz = 8
    source.audio.left.noise = true
    source.audio.right.freqHz = 260
    source.audio.right.gain = 0.25
    source.audio.right.noise = true
    source.audio.right.noiseColor = 'brown'

    const result = adaptSensoryFieldState(source, { idFor: ids('mixed') })
    const depth = result.visualTracks.find(track => track.trackType === 'DepthMarkers')

    expect(result.stageSuggestion).toMatchObject({
      presentationMode: 'stereo-pair',
      viewingMode: 'cross',
      depthScalePx: 160,
    })
    expect(depth).toMatchObject({
      enabled: false,
      config: {
        gridDepthAxis: 'both',
        gridDepthRange: 0.25,
        trajectoryEnabled: true,
      },
    })
    expect(depth.params.z.value).toBe(0.5)
    expect(result.audioTracks).toHaveLength(4)
    expect(result.audioTracks.every(track => track.muted)).toBe(true)
    expect(result.audioTracks.every(track => (
      track.tremolo.enabled
      && track.tremolo.rate === 8
      && track.tremolo.depth === 0.8
      && track.tremolo.mode === 'linear'
    ))).toBe(true)
    expect(result.audioTracks.find(track => track.id === 'mixed-right-tone').params.frequency.value).toBe(260)
    expect(result.audioTracks.find(track => track.id === 'mixed-right-noise').noiseColor).toBe('brown')
    expect(result.report.status).toBe('partial')
    expect(result.report.unsupported.map(item => item.code)).toEqual([
      'legacy-trajectory-shape-not-representable',
    ])
  })

  it('maps beat, breath, and circular motion to deduplicated Sinusoid controls', () => {
    const source = createFieldState()
    source.depth.enabled = true
    source.depth.source = 'beat'
    source.depth.markerMotionXSource = 'breath'
    source.depth.markerMotionCircleSource = 'beat'

    const result = adaptSensoryFieldState(source, { idFor: ids('dynamic') })

    expect(result.controlTracks).toHaveLength(3)
    expect(result.controlTracks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'dynamic-beat-sin-control',
        type: 'Sinusoid',
        rateHz: 4,
        phaseRad: 0,
      }),
      expect.objectContaining({
        id: 'dynamic-breath-sin-control',
        type: 'Sinusoid',
        rateHz: 0.1,
        phaseRad: 0,
      }),
      expect.objectContaining({
        id: 'dynamic-beat-cos-control',
        type: 'Sinusoid',
        rateHz: 4,
        phaseRad: Math.PI / 2,
      }),
    ]))
    expect(result.report.status).toBe('complete')
    expect(result.report.unsupported).toEqual([])
    expect(result.report.warnings.map(item => item.code)).toEqual(['pixel-motion-normalized'])
    const depth = result.visualTracks.find(track => track.trackType === 'DepthMarkers')
    expect(depth.params.x.mods).toEqual([
      expect.objectContaining({ controlId: 'dynamic-breath-sin-control', amount: 30 / 160 }),
      expect.objectContaining({ controlId: 'dynamic-beat-sin-control', amount: 30 / 160 }),
    ])
    expect(depth.params.y.mods).toEqual([
      expect.objectContaining({ controlId: 'dynamic-beat-cos-control', amount: 30 / 160 }),
    ])
    expect(depth.params.z.mods).toEqual([
      expect.objectContaining({ controlId: 'dynamic-beat-sin-control', amount: 18 / 160 }),
    ])
    expect(depth.params.z.value).toBeCloseTo(48 / 160)
  })

  it('reports canonical rate caps rather than silently producing invalid track values', () => {
    const source = createFieldState()
    source.visual.blinkRateHz = 55
    source.audio.beatMode = 'monaural'
    source.audio.beatRateHz = 40

    const result = adaptSensoryFieldState(source, { idFor: ids('rates') })

    expect(result.visualTracks[0].params.blinkRate.value).toBe(40)
    expect(result.audioTracks.every(track => track.tremolo.rate === 30)).toBe(true)
    expect(result.report.unsupported.map(item => item.code)).toEqual([
      'blink-rate-outside-patch-range',
      'monaural-rate-outside-patch-range',
    ])
  })

  it('reports intentional fixes to dormant colour and noise-tremolo behavior', () => {
    const source = createFieldState()
    source.visual.blinkEnabled = true
    source.visual.offColor = '#112233'
    source.audio.beatMode = 'monaural'
    source.audio.left.noise = true

    const result = adaptSensoryFieldState(source, { idFor: ids('corrections') })

    expect(result.report.behaviorCorrections.map(item => item.code)).toEqual([
      'off-color-activated',
      'monaural-noise-live-update-fixed',
    ])
    expect(result.report.counts.behaviorCorrections).toBe(2)
  })

  it('reports legacy one-sided depth clipping when a Sinusoid would cross its bounds', () => {
    const source = createFieldState()
    source.depth.enabled = true
    source.depth.source = 'breath'
    source.depth.baseSeparationPx = 5
    source.depth.modulationPx = 20

    const result = adaptSensoryFieldState(source, { idFor: ids('clipped') })

    expect(result.report.status).toBe('partial')
    expect(result.report.unsupported.map(item => item.code)).toContain(
      'legacy-depth-clamp-not-representable',
    )
  })

  it('resolves linked binaural carriers before creating hard-panned tracks', () => {
    const source = createFieldState()
    source.audio.left.freqHz = 200
    source.audio.beatMode = 'binaural'
    source.audio.beatRateHz = 4

    const result = adaptSensoryFieldState(source, { idFor: ids('beat') })
    const carriers = result.audioTracks.filter(track => track.trackType === 'Carrier')

    expect(carriers.map(track => track.params.frequency.value)).toEqual([198, 202])
    expect(carriers.map(track => track.params.pan.value)).toEqual([-1, 1])
    expect(result.audioTracks.every(track => track.tremolo.enabled === false)).toBe(true)
  })

  it('requires injected, unique IDs', () => {
    expect(() => adaptSensoryFieldState(createFieldState())).toThrow(/idFor/)
    expect(() => adaptSensoryFieldState(createFieldState(), { idFor: () => 'same' }))
      .toThrow(/duplicate id/)
  })

  it('produces canonical tracks that survive Patch Studio export/import', () => {
    const source = createFieldState()
    source.depth.enabled = true
    source.depth.source = 'beat'
    source.depth.markerMotionCircleSource = 'breath'
    const bundle = adaptSensoryFieldState(source, { idFor: ids('roundtrip') })
    const draft = {
      ...createEmptyDraft(),
      patchName: 'Adapted Field',
      visualStage: bundle.stageSuggestion,
      controlTracks: bundle.controlTracks,
      audioTracks: bundle.audioTracks,
      visualTracks: bundle.visualTracks,
      hapticTracks: bundle.hapticTracks,
    }

    const imported = draftFromPatchExport(buildPatchExport(draft))

    expect(imported.controlTracks).toEqual(bundle.controlTracks)
    expect(imported.audioTracks).toEqual(bundle.audioTracks)
    expect(imported.visualTracks).toEqual(bundle.visualTracks)
    expect(imported.visualStage).toEqual(bundle.stageSuggestion)
  })
})

describe('legacy rich-scene adapters', () => {
  it('maps the tree recipe and route view into a track plus shared stage', () => {
    const source = createTreeState()
    source.renderMode = 'anaglyph'
    source.viewingMode = 'cross'
    source.tree.seed = 42
    source.tree.branchAngleDeg = 31
    source.showLeaves = false
    source.rotation.autoRotate = true

    const result = adaptTreeState(source, { idFor: ids('tree') })
    const track = result.visualTracks[0]

    expect(track).toMatchObject({
      id: 'tree-scene',
      trackType: 'TreeScene',
      config: {
        generatorVersion: 1,
        seed: 42,
        branchAngleDeg: 31,
        showLeaves: false,
      },
    })
    expect(track.config).not.toHaveProperty('background')
    expect(track.config).not.toHaveProperty('presentationMode')
    expect(result.stageSuggestion).toMatchObject({
      presentationMode: 'anaglyph',
      viewingMode: 'cross',
      backgroundColor: '#07090c',
      camera: { autoRotate: true },
    })
    expect(result.report.status).toBe('complete')
  })

  it('moves generated abstract and landscape backgrounds to the shared stage', () => {
    const abstraction = createAbstractState()
    abstraction.params.style = 'klee'
    const abstractResult = adaptAbstractState(abstraction, { idFor: ids('abstract') })

    expect(abstractResult.visualTracks[0]).toMatchObject({
      trackType: 'AbstractScene',
      config: { generatorVersion: 1, style: 'klee' },
    })
    expect(abstractResult.visualTracks[0].config).not.toHaveProperty('background')
    expect(abstractResult.stageSuggestion.backgroundColor).toBe('#e7dab9')

    const landscape = createLandscapeState()
    landscape.params.palette = 'night'
    const landscapeResult = adaptLandscapeState(landscape, { idFor: ids('landscape') })

    expect(landscapeResult.visualTracks[0]).toMatchObject({
      trackType: 'LandscapeScene',
      config: { generatorVersion: 1, palette: 'night' },
    })
    expect(landscapeResult.visualTracks[0].config).not.toHaveProperty('background')
    expect(landscapeResult.stageSuggestion.backgroundColor).toBe('#141d33')
  })

  it('dispatches named scene adapters and rejects unknown kinds', () => {
    const direct = adaptLandscapeState(createLandscapeState(), { idFor: ids('scene') })
    const dispatched = adaptFieldSceneState('landscape', createLandscapeState(), { idFor: ids('scene') })

    expect(dispatched).toEqual(direct)
    expect(() => adaptFieldSceneState('ocean', {}, { idFor: ids() })).toThrow(/Unknown/)
  })
})
