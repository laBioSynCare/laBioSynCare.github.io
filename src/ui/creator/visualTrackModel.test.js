import { describe, expect, it } from 'vitest'
import {
  CONFIGURED_VISUAL_TRACK_TYPES,
  SPATIAL_VISUAL_TRACK_TYPES,
  createAbstractSceneConfig,
  createColorFieldConfig,
  createDepthMarkersConfig,
  createLandscapeSceneConfig,
  createTreeSceneConfig,
  createVisualStagePresentation,
  createVisualTrackConfig,
  firstEnabledVisualStageTrackId,
  normalizeAbstractSceneConfig,
  normalizeColorFieldConfig,
  normalizeDepthMarkersConfig,
  normalizeLandscapeSceneConfig,
  normalizeTreeSceneConfig,
  normalizeVisualStagePresentation,
  normalizeVisualTrackConfig,
  visualStageLayerPlan,
} from './visualTrackModel.js'

describe('shared visual-stage presentation', () => {
  it('defaults to one mono stage with an explicit background authority', () => {
    expect(createVisualStagePresentation()).toEqual({
      presentationMode: 'mono',
      viewingMode: 'parallel',
      backgroundColor: '#07090c',
      depthScalePx: 60,
      zoom: 1,
      strokeWidth: 1,
      depthColor: {
        enabled: false,
        near: '#ffe7a8',
        far: '#274b73',
        strength: 0.75,
      },
      camera: {
        yawDeg: 20,
        autoRotate: false,
        autoRotateSec: 24,
      },
    })
  })

  it('normalizes the stage without retaining unknown projector state', () => {
    const stage = normalizeVisualStagePresentation({
      presentationMode: 'anaglyph',
      viewingMode: 'cross',
      backgroundColor: '#ABCDEF',
      depthScalePx: 900,
      zoom: 0,
      strokeWidth: -2,
      depthColor: { enabled: true, near: '#123456', far: 'bad', strength: 9 },
      camera: { yawDeg: -10, autoRotate: true, autoRotateSec: 2 },
      perTrackProjector: true,
    })

    expect(stage).toEqual({
      presentationMode: 'anaglyph',
      viewingMode: 'cross',
      backgroundColor: '#abcdef',
      depthScalePx: 160,
      zoom: 0.4,
      strokeWidth: 0.5,
      depthColor: {
        enabled: true,
        near: '#123456',
        far: '#274b73',
        strength: 1,
      },
      camera: {
        yawDeg: 0,
        autoRotate: true,
        autoRotateSec: 6,
      },
    })
    expect(stage).not.toHaveProperty('perTrackProjector')
  })

  it('accepts every presentation mode while keeping viewing mode as stage data', () => {
    for (const presentationMode of ['mono', 'stereo-pair', 'anaglyph', 'autostereogram']) {
      expect(createVisualStagePresentation({ presentationMode, viewingMode: 'cross' }))
        .toMatchObject({ presentationMode, viewingMode: 'cross' })
    }
  })
})

describe('content-specific visual configs', () => {
  it('places one shared spatial stage at the first spatial source', () => {
    const before = { id: 'before', trackType: 'ColorField', enabled: true }
    const first = { id: 'tree', trackType: 'TreeScene', enabled: true }
    const middle = { id: 'middle', trackType: 'ColorField', enabled: true }
    const second = { id: 'land', trackType: 'LandscapeScene', enabled: true }
    const disabled = { id: 'off', trackType: 'DepthMarkers', enabled: false }

    expect(visualStageLayerPlan([before, first, middle, second, disabled])).toEqual([
      { kind: 'color', track: before },
      { kind: 'spatial' },
      { kind: 'color', track: middle },
    ])
  })

  it('inserts the shared stage at the first enabled stage-capable track', () => {
    expect(firstEnabledVisualStageTrackId([
      { id: 'disabled', trackType: 'TreeScene', enabled: false },
      { id: 'flat', trackType: 'Geometry', enabled: true },
      { id: 'enabled', trackType: 'ColorField', enabled: true },
    ])).toBe('enabled')
  })

  it('creates a color field with exact on/off colours and a discrete blink switch', () => {
    expect(createColorFieldConfig({ color: '#AABBCC', blinkEnabled: true })).toEqual({
      color: '#aabbcc',
      offColor: '#000000',
      blinkEnabled: true,
    })
    expect(normalizeColorFieldConfig({ color: 'blue', offColor: '#FFFFFF' })).toEqual({
      color: '#3355ff',
      offColor: '#ffffff',
      blinkEnabled: false,
    })
  })

  it('normalizes only deterministic marker recipe fields', () => {
    expect(normalizeDepthMarkersConfig({
      dotSizePx: 100,
      showCartesianPlane: false,
      gridSize: 20,
      gridDepthAxis: 'diagonal',
      gridDepthRange: -1,
      gridDotScaleX: 0,
      gridDotScaleY: 20,
      trajectoryEnabled: true,
      trajectorySteps: 2,
      motionSource: 'beat',
    })).toEqual({
      dotSizePx: 40,
      showCartesianPlane: false,
      gridSize: 7,
      gridDepthAxis: 'none',
      gridDepthRange: 0,
      gridDotScaleX: 0.25,
      gridDotScaleY: 4,
      trajectoryEnabled: true,
      trajectorySteps: 3,
    })
  })

  it('normalizes the tree generator and appearance recipe', () => {
    expect(normalizeTreeSceneConfig({
      seed: 42.4,
      levels: 99,
      branchAngleDeg: 2,
      spread: 9,
      leafDensity: -1,
      rootLevels: 4.8,
      showLeaves: false,
      showRoots: false,
      branchColor: '#ABCDEF',
      rootColor: 'bad',
      leafColor: '#123456',
      presentationMode: 'stereo-pair',
    })).toEqual({
      generatorVersion: 1,
      seed: 42,
      levels: 11,
      branchAngleDeg: 10,
      spread: 1,
      leafDensity: 0,
      rootLevels: 5,
      showLeaves: false,
      showRoots: false,
      branchColor: '#abcdef',
      rootColor: '#9c8161',
      leafColor: '#123456',
    })
  })

  it('normalizes abstract and landscape recipes independently', () => {
    expect(normalizeAbstractSceneConfig({
      seed: -3,
      style: 'klee',
      objectCount: 999,
      sizeScale: 0,
      spread: 0.25,
      lineDensity: 2,
    })).toEqual({
      generatorVersion: 1,
      seed: -3,
      style: 'klee',
      objectCount: 140,
      sizeScale: 0.4,
      spread: 0.25,
      lineDensity: 1,
    })

    expect(normalizeLandscapeSceneConfig({
      seed: 8,
      palette: 'night',
      houses: -2,
      trees: 99,
      flowers: 12.8,
      hillAmplitude: 2,
      riverWidth: 2,
      spread: -1,
    })).toEqual({
      generatorVersion: 1,
      seed: 8,
      palette: 'night',
      houses: 0,
      trees: 30,
      flowers: 13,
      hillAmplitude: 1,
      riverWidth: 0.4,
      spread: 0,
    })
  })

  it('routes every configured type to its own factory and normalizer', () => {
    const expected = {
      ColorField: createColorFieldConfig(),
      DepthMarkers: createDepthMarkersConfig(),
      TreeScene: createTreeSceneConfig(),
      AbstractScene: createAbstractSceneConfig(),
      LandscapeScene: createLandscapeSceneConfig(),
    }

    expect(CONFIGURED_VISUAL_TRACK_TYPES).toEqual(Object.keys(expected))
    expect(SPATIAL_VISUAL_TRACK_TYPES).toEqual(Object.keys(expected).slice(1))
    for (const [trackType, config] of Object.entries(expected)) {
      expect(createVisualTrackConfig(trackType)).toEqual(config)
      expect(normalizeVisualTrackConfig(trackType, config)).toEqual(config)
      expect(config).not.toHaveProperty('presentationMode')
      expect(config).not.toHaveProperty('viewingMode')
      expect(config).not.toHaveProperty('backgroundColor')
      expect(config).not.toHaveProperty('camera')
    }
    expect(createVisualTrackConfig('Geometry')).toBeUndefined()
    expect(normalizeVisualTrackConfig('Geometry', { arbitrary: true })).toBeUndefined()
  })
})
