import { describe, expect, it } from 'vitest'
import {
  PATCH_FILE_MAX_BYTES,
  PATCH_STUDIO_MODEL,
  PATCH_STUDIO_MODEL_V1,
  PATCH_STUDIO_MODEL_V2,
  PATCH_STUDIO_MODEL_V3,
  SPATIAL_VISUAL_TRACK_TYPES,
  VISUAL_PARAM_RANGE,
  VISUAL_TRACK_TYPES,
  buildPatchExport,
  createAudioTrack,
  createDraft,
  createEmptyDraft,
  createMod,
  createTempoSyncConfig,
  createVisualStagePresentation,
  createVisualTrack,
  CONTROL_TYPES,
  LEGACY_CONTROL_TYPES,
  createControlTrack,
  draftFromPatchExport,
  draftFromPatchFileText,
  migratePatchExportToCurrent,
  validateDraft,
} from './presetDraft.js'

describe('preset draft tempo model', () => {
  it('exports compatible numeric BPM plus tempo metadata', () => {
    const draft = createDraft()
    const exported = buildPatchExport(draft)

    expect(exported.timing.bpmEnabled).toBe(false)
    expect(exported.timing.bpm).toBe(60)
    expect(exported.timing.beatsPerBar).toBe(4)
    expect(exported.timing.bpmMods).toEqual([])
    expect(exported.timing.lengthSec).toBe(900)
  })

  it('serializes tempo sync configs on eligible params', () => {
    const draft = createDraft()
    draft.audioTracks[0].params.pulseRate.tempoSync = createTempoSyncConfig({
      enabled: true,
      mode: 'division',
      division: '1/8',
      modifier: 'triplet',
    })

    const exported = buildPatchExport(draft)
    expect(exported.audioTracks[0].params.pulseRate.tempoSync).toMatchObject({
      enabled: true,
      mode: 'division',
      division: '1/8',
      modifier: 'triplet',
    })
    expect(exported.audioTracks[0].params.frequency.tempoSync).toBeUndefined()
  })

  it('validates timing and tempo sync errors', () => {
    const draft = createDraft()
    draft.timing.bpmEnabled = true
    draft.timing.bpm.value = 0
    draft.timing.beatsPerBar = 2.5
    draft.audioTracks[0].params.pulseRate.tempoSync = createTempoSyncConfig({
      enabled: true,
      mode: 'division',
      division: '1/64',
    })

    const messages = validateDraft(draft).map(issue => issue.message)
    expect(messages).toContain('BPM must be 1–500.')
    expect(messages).toContain('Beats/bar must be an integer 1–16.')
    expect(messages).toContain('Isochronic Tone.pulseRate: tempo sync division is invalid.')
  })

  it('validates stale BPM modulation links', () => {
    const draft = createDraft()
    draft.timing.bpmEnabled = true
    draft.timing.bpm.mods.push(createMod('missing-control', 10))

    expect(validateDraft(draft).map(issue => issue.message)).toContain('BPM: linked control no longer exists.')
  })

  it('keeps hidden BPM controls disabled when BPM is off', () => {
    const draft = createDraft()
    draft.timing.bpm.value = 0
    draft.timing.beatsPerBar = 2.5
    draft.timing.bpm.mods.push(createMod('missing-control', 10))
    draft.audioTracks[0].params.pulseRate.tempoSync = createTempoSyncConfig({
      enabled: true,
      mode: 'division',
      division: '1/64',
    })

    const messages = validateDraft(draft).map(issue => issue.message)
    expect(messages).not.toContain('BPM must be 1–500.')
    expect(messages).not.toContain('Beats/bar must be an integer 1–16.')
    expect(messages).not.toContain('BPM: linked control no longer exists.')
    expect(messages).not.toContain('Isochronic Tone.pulseRate: tempo sync division is invalid.')
    expect(buildPatchExport(draft).timing.bpmMods).toEqual([])
  })

  it('imports exported patch JSON back into the live draft shape', () => {
    const draft = createDraft()
    draft.patchName = 'Round Trip'
    draft.timing.bpmEnabled = true
    draft.timing.bpm.value = 72
    draft.timing.bpm.mods.push(createMod(draft.controlTracks[0].id, 4))
    draft.audioTracks[0].params.pulseRate.tempoSync = createTempoSyncConfig({
      enabled: true,
      mode: 'division',
      division: '1/8',
    })

    const imported = draftFromPatchExport(buildPatchExport(draft))

    expect(imported.patchName).toBe('Round Trip')
    expect(imported.playing).toBe(false)
    expect(imported.timing.bpm).toMatchObject({
      value: 72,
      mods: [expect.objectContaining({ controlId: draft.controlTracks[0].id, amount: 4 })],
    })
    expect(imported.audioTracks[0].params.pulseRate.tempoSync).toMatchObject({
      enabled: true,
      division: '1/8',
    })
    expect(validateDraft(imported).filter(issue => issue.level === 'error')).toEqual([])
  })

  it('advances generated IDs after loading saved patches', () => {
    draftFromPatchExport({
      model: PATCH_STUDIO_MODEL_V1,
      patchName: 'Stored',
      timing: { bpmEnabled: false, bpm: 60, beatsPerBar: 4, lengthSec: 900 },
      controlTracks: [{ id: 'ctl-900', type: 'LFO', name: 'Ctl' }],
      audioTracks: [{ id: 'audio-901', trackType: 'Carrier', name: 'Carrier' }],
      visualTracks: [],
      hapticTracks: [],
    })

    expect(Number(createAudioTrack('Carrier').id.split('-').pop())).toBeGreaterThan(901)
  })

  it('creates an empty draft for clearing the studio', () => {
    const draft = createEmptyDraft()

    expect(draft.patchName).toBe('Untitled Patch')
    expect(draft.playing).toBe(false)
    expect(draft.controlTracks).toEqual([])
    expect(draft.audioTracks).toEqual([])
    expect(draft.visualTracks).toEqual([])
    expect(draft.hapticTracks).toEqual([])
  })
})

describe('ADR 0046 visual model foundation', () => {
  it('serializes one shared visual-stage presentation on every draft', () => {
    const draft = createEmptyDraft()

    expect(draft.visualStage).toMatchObject({
      presentationMode: 'mono',
      viewingMode: 'parallel',
      backgroundColor: '#07090c',
      camera: { yawDeg: 20, autoRotate: false },
    })
    expect(buildPatchExport(draft).visualStage).toEqual(draft.visualStage)
  })

  it('registers ordinary color-field and content-specific spatial tracks', () => {
    expect(VISUAL_TRACK_TYPES).toEqual(expect.arrayContaining([
      'ColorField',
      'DepthMarkers',
      'TreeScene',
      'AbstractScene',
      'LandscapeScene',
    ]))

    const colorField = createVisualTrack('ColorField')
    expect(colorField.enabled).toBe(true)
    expect(Object.keys(colorField.params)).toEqual(['opacity', 'blinkRate', 'duty'])
    expect(colorField.config).toEqual({
      color: '#3355ff',
      offColor: '#000000',
      blinkEnabled: false,
    })

    for (const trackType of SPATIAL_VISUAL_TRACK_TYPES) {
      const track = createVisualTrack(trackType)
      expect(track.enabled).toBe(true)
      expect(Object.keys(track.params)).toEqual([
        'opacity',
        'x',
        'y',
        'z',
        'spatialScale',
        'rotationSpeed',
      ])
      expect(track.params.x).toMatchObject({ value: 0, mods: [] })
      expect(track.params.y).toMatchObject({ value: 0, mods: [] })
      expect(track.params.z).toMatchObject({ value: 0, mods: [] })
      expect(track.params.spatialScale).toMatchObject({ value: 1, mods: [] })
      expect(track.params.rotationSpeed.tempoSync).toBeDefined()
      expect(track.depthAffectsScale).toBe(false)
      expect(track.config).toBeDefined()
    }

    expect(VISUAL_PARAM_RANGE.x).toEqual([-2, 2, 0.01])
    expect(VISUAL_PARAM_RANGE.y).toEqual([-2, 2, 0.01])
    expect(VISUAL_PARAM_RANGE.z).toEqual([-2, 2, 0.01])
    expect(VISUAL_PARAM_RANGE.spatialScale).toEqual([0.1, 4, 0.01])
  })

  it('accepts deterministic IDs and keeps presentation out of track config', () => {
    const track = createVisualTrack('TreeScene', {
      id: 'visual-template-tree',
      enabled: false,
      config: {
        seed: 42,
        presentationMode: 'stereo-pair',
        backgroundColor: '#ffffff',
      },
    })

    expect(track.id).toBe('visual-template-tree')
    expect(track.enabled).toBe(false)
    expect(track.config.seed).toBe(42)
    expect(track.config).not.toHaveProperty('presentationMode')
    expect(track.config).not.toHaveProperty('backgroundColor')
  })

  it('migrates model 1 to model 3 without mutating the legacy patch', () => {
    const legacy = {
      model: PATCH_STUDIO_MODEL_V1,
      patchName: 'Legacy visual patch',
      timing: { bpmEnabled: false, bpm: 60, beatsPerBar: 4, lengthSec: 900 },
      controlTracks: [{ id: 'ctl-old', type: 'Permutation', name: 'Legacy control', nnotes: 5 }],
      audioTracks: [{ id: 'audio-old', trackType: 'Carrier', name: 'Legacy carrier' }],
      visualTracks: [{ id: 'visual-old', trackType: 'Geometry', name: 'Old geometry' }],
      hapticTracks: [],
    }
    const before = structuredClone(legacy)
    const migrated = migratePatchExportToCurrent(legacy)
    const imported = draftFromPatchExport(legacy)

    expect(legacy).toEqual(before)
    expect(migrated.model).toBe(PATCH_STUDIO_MODEL_V3)
    expect(migrated.visualStage).toEqual(createVisualStagePresentation())
    expect(imported.visualStage).toEqual(createVisualStagePresentation())
    expect(imported.controlTracks[0]).toMatchObject({ id: 'ctl-old', type: 'Permutation', nnotes: 5 })
    expect(imported.audioTracks[0]).toMatchObject({ id: 'audio-old', trackType: 'Carrier' })
    expect(imported.visualTracks[0].enabled).toBe(true)
    expect(imported.visualTracks[0]).not.toHaveProperty('config')
    expect(buildPatchExport(imported).model).toBe(PATCH_STUDIO_MODEL_V3)
  })

  it('imports model 2 with constant-size depth and re-exports model 3', () => {
    const legacy = {
      model: PATCH_STUDIO_MODEL_V2,
      patchName: 'Model 2 spatial patch',
      timing: { bpmEnabled: false, bpm: 60, beatsPerBar: 4, lengthSec: 900 },
      visualStage: createVisualStagePresentation({ presentationMode: 'stereo-pair' }),
      controlTracks: [],
      audioTracks: [],
      visualTracks: [{
        id: 'visual-tree-v2',
        trackType: 'TreeScene',
        name: 'Tree',
        enabled: true,
        blend: 'normal',
        params: {},
        config: { seed: 17 },
      }],
      hapticTracks: [],
    }
    const before = structuredClone(legacy)
    const imported = draftFromPatchExport(legacy)

    expect(legacy).toEqual(before)
    expect(imported.visualTracks[0].depthAffectsScale).toBe(false)
    expect(buildPatchExport(imported).model).toBe(PATCH_STUDIO_MODEL_V3)
  })

  it('never emits newer fields under an older identifier', () => {
    const draft = createEmptyDraft()
    draft.controlTracks = [createControlTrack('Sinusoid')]
    draft.visualTracks = [createVisualTrack('ColorField')]

    const exported = buildPatchExport(draft)

    expect(exported.model).toBe(PATCH_STUDIO_MODEL_V3)
    expect(exported.model).not.toBe(PATCH_STUDIO_MODEL_V1)
    expect(exported.model).not.toBe(PATCH_STUDIO_MODEL_V2)
    expect(exported.visualStage).toBeDefined()
  })

  it('is a fixed point with every new track type, disabled state, and stage config', () => {
    const draft = createEmptyDraft()
    draft.patchName = 'Spatial fixed point'
    draft.visualStage = createVisualStagePresentation({
      presentationMode: 'stereo-pair',
      viewingMode: 'cross',
      backgroundColor: '#102030',
      depthScalePx: 72,
      camera: { yawDeg: 45, autoRotate: true, autoRotateSec: 30 },
    })
    draft.visualTracks = [
      createVisualTrack('ColorField', {
        id: 'visual-color',
        enabled: false,
        config: { color: '#224466', offColor: '#010203', blinkEnabled: true },
      }),
      createVisualTrack('DepthMarkers', {
        id: 'visual-markers',
        depthAffectsScale: true,
        config: { gridSize: 5, gridDepthAxis: 'both', trajectoryEnabled: true },
      }),
      createVisualTrack('TreeScene', {
        id: 'visual-tree',
        config: { seed: 41, levels: 8, showRoots: false },
      }),
      createVisualTrack('AbstractScene', {
        id: 'visual-abstract',
        config: { seed: 42, style: 'kandinsky', objectCount: 72 },
      }),
      createVisualTrack('LandscapeScene', {
        id: 'visual-landscape',
        config: { seed: 43, palette: 'dusk', houses: 9 },
      }),
    ]
    draft.visualTracks[1].params.x.value = 0.25
    draft.visualTracks[1].params.y.value = -0.5
    draft.visualTracks[1].params.z.value = 0.8
    draft.controlTracks = [createControlTrack('LFO', { id: 'ctl-spatial' })]
    draft.visualTracks[1].params.z.mods.push(createMod('ctl-spatial', 0.3))

    const first = buildPatchExport(draft)
    const imported = draftFromPatchExport(first)
    const second = buildPatchExport(imported)

    expect(second).toEqual(first)
    expect(imported.visualTracks[0].enabled).toBe(false)
    expect(imported.visualTracks[1].params).toMatchObject({
      x: { value: 0.25 },
      y: { value: -0.5 },
      z: {
        value: 0.8,
        mods: [expect.objectContaining({ controlId: 'ctl-spatial', amount: 0.3 })],
      },
    })
    expect(imported.visualTracks[1].depthAffectsScale).toBe(true)
    expect(imported.visualStage.presentationMode).toBe('stereo-pair')
  })
})

describe('patch file import', () => {
  // The file path is the one that must work without Firebase: a patch exported
  // from any instance has to load into any other instance, including one built
  // with no VITE_FIREBASE_* configuration at all.

  it('round-trips a fully populated patch through downloaded file text', () => {
    const draft = createDraft()
    draft.patchName = 'File Round Trip'
    draft.timing.bpmEnabled = true
    draft.timing.bpm.value = 84
    draft.timing.lengthSec = 1200
    draft.timing.bpm.mods.push(createMod(draft.controlTracks[0].id, 3))
    draft.visualTracks.push(createVisualTrack('Mandala'))
    draft.audioTracks[0].params.pulseRate.tempoSync = createTempoSyncConfig({
      enabled: true,
      mode: 'division',
      division: '1/16',
    })

    // Exactly what download() writes to disk.
    const fileText = JSON.stringify(buildPatchExport(draft), null, 2)
    const imported = draftFromPatchFileText(fileText)

    expect(imported.patchName).toBe('File Round Trip')
    expect(imported.playing).toBe(false)
    expect(imported.timing.lengthSec).toBe(1200)
    expect(imported.timing.bpm).toMatchObject({ value: 84 })
    expect(imported.timing.bpm.mods).toHaveLength(1)
    expect(imported.controlTracks).toHaveLength(draft.controlTracks.length)
    expect(imported.audioTracks).toHaveLength(draft.audioTracks.length)
    expect(imported.visualTracks.map(t => t.trackType)).toContain('Mandala')
    expect(imported.audioTracks[0].params.pulseRate.tempoSync).toMatchObject({
      enabled: true,
      division: '1/16',
    })
    expect(validateDraft(imported).filter(issue => issue.level === 'error')).toEqual([])
  })

  it('produces a stable export when the imported draft is exported again', () => {
    const draft = createDraft()
    draft.patchName = 'Stability'
    draft.visualTracks.push(createVisualTrack('Ripple'))

    const first = JSON.stringify(buildPatchExport(draft), null, 2)
    const second = JSON.stringify(buildPatchExport(draftFromPatchFileText(first)), null, 2)

    // Import → export must be a fixed point, or migrating between instances
    // would drift the patch a little on every hop.
    expect(second).toEqual(first)
  })

  it('keeps an empty patch importable', () => {
    const fileText = JSON.stringify(buildPatchExport(createEmptyDraft()))
    const imported = draftFromPatchFileText(fileText)

    expect(imported.controlTracks).toEqual([])
    expect(imported.audioTracks).toEqual([])
    expect(imported.visualTracks).toEqual([])
    expect(imported.hapticTracks).toEqual([])
  })

  it('rejects an empty file', () => {
    expect(() => draftFromPatchFileText('')).toThrow(/empty/i)
    expect(() => draftFromPatchFileText('   ')).toThrow(/empty/i)
  })

  it('rejects a non-string argument', () => {
    expect(() => draftFromPatchFileText(null)).toThrow(/empty/i)
    expect(() => draftFromPatchFileText(undefined)).toThrow(/empty/i)
  })

  it('rejects malformed JSON with a readable message', () => {
    expect(() => draftFromPatchFileText('{ not json')).toThrow(/not valid JSON/i)
  })

  it('rejects JSON that is not an object', () => {
    expect(() => draftFromPatchFileText('[1,2,3]')).toThrow(/patch object/i)
    expect(() => draftFromPatchFileText('"a string"')).toThrow(/patch object/i)
    expect(() => draftFromPatchFileText('null')).toThrow(/patch object/i)
    expect(() => draftFromPatchFileText('42')).toThrow(/patch object/i)
  })

  it('rejects an object with no model field', () => {
    // draftFromPatchExport tolerates this for backward compatibility; a file
    // picked off disk must be explicit about what it is.
    expect(() => draftFromPatchFileText('{"patchName":"No Model"}'))
      .toThrow(/model/i)
  })

  it('rejects a foreign model', () => {
    const foreign = JSON.stringify({ model: 'some-other-model-2', patchName: 'Nope' })
    expect(() => draftFromPatchFileText(foreign)).toThrow(/Unsupported patch model/i)
  })

  it('rejects a file larger than the size ceiling', () => {
    const huge = `{"model":"${PATCH_STUDIO_MODEL_V1}","pad":"${'x'.repeat(PATCH_FILE_MAX_BYTES)}"}`
    expect(() => draftFromPatchFileText(huge)).toThrow(/too large/i)
  })

  it('survives a truncated file', () => {
    const full = JSON.stringify(buildPatchExport(createDraft()))
    expect(() => draftFromPatchFileText(full.slice(0, full.length / 2)))
      .toThrow(/not valid JSON/i)
  })

  it('tolerates missing track arrays without inventing tracks', () => {
    const sparse = JSON.stringify({
      model: PATCH_STUDIO_MODEL_V1,
      patchName: 'Sparse',
      timing: { bpmEnabled: false, bpm: 60, beatsPerBar: 4, lengthSec: 900 },
    })
    const imported = draftFromPatchFileText(sparse)

    expect(imported.patchName).toBe('Sparse')
    expect(imported.controlTracks).toEqual([])
    expect(imported.audioTracks).toEqual([])
    expect(imported.visualTracks).toEqual([])
    expect(imported.hapticTracks).toEqual([])
  })

  it('never imports a patch in the playing state', () => {
    const playing = createDraft()
    playing.playing = true
    const imported = draftFromPatchFileText(JSON.stringify(buildPatchExport(playing)))

    expect(imported.playing).toBe(false)
  })
})


describe('control-track rename migration (ADR 0041)', () => {
  // The rename is silent-corruption territory: `choice` falls back to the first
  // valid option, so without the migration map a saved Symmetry track reopens as
  // an LFO and quietly becomes a different kind of control signal.
  const patchWith = (controlTracks) => ({
    ...buildPatchExport(createDraft()),
    controlTracks,
  })

  it('carries a stored Martigli track across as an LFO', () => {
    const draft = draftFromPatchExport(patchWith([
      { id: 'ctl-1', type: 'Martigli', name: 'Breath', periodSec: 12, targetPeriodSec: 18, inhaleRatio: 0.4 },
    ]))
    const [control] = draft.controlTracks
    expect(control.type).toBe('LFO')
    expect(control.periodSec).toBe(12)
    expect(control.targetPeriodSec).toBe(18)
    expect(control.inhaleRatio).toBe(0.4)
  })

  it('carries a stored Symmetry track across as a Permutation, not an LFO', () => {
    const draft = draftFromPatchExport(patchWith([
      { id: 'ctl-2', type: 'Symmetry', name: 'Seq', nnotes: 6, rateHz: 3 },
    ]))
    const [control] = draft.controlTracks
    expect(control.type).toBe('Permutation')
    expect(control.nnotes).toBe(6)
    expect(control.rateHz).toBe(3)
  })

  it('leaves current names untouched', () => {
    for (const type of CONTROL_TYPES) {
      const draft = draftFromPatchExport(patchWith([{ id: 'c', type, name: type }]))
      expect(draft.controlTracks[0].type).toBe(type)
    }
  })

  it('still defaults a genuinely unknown type rather than throwing', () => {
    const draft = draftFromPatchExport(patchWith([{ id: 'c', type: 'NotAThing', name: 'x' }]))
    expect(CONTROL_TYPES).toContain(draft.controlTracks[0].type)
  })

  it('maps every legacy name to a current one', () => {
    for (const [legacy, current] of Object.entries(LEGACY_CONTROL_TYPES)) {
      expect(CONTROL_TYPES, `${legacy} maps to ${current}, which is not a valid type`).toContain(current)
    }
  })

  it('creates current types by default', () => {
    expect(createControlTrack().type).toBe('LFO')
    expect(createControlTrack('Permutation').type).toBe('Permutation')
    expect(createControlTrack('Sinusoid', { rateHz: 40, phaseRad: Math.PI / 2 })).toMatchObject({
      type: 'Sinusoid',
      rateHz: 40,
      phaseRad: Math.PI / 2,
    })
  })

  it('round-trips and clamps the general sinusoid control', () => {
    const patch = patchWith([{
      id: 'ctl-sine',
      type: 'Sinusoid',
      name: 'Depth rate',
      rateHz: 80,
      phaseRad: -2,
      amplitude: 4,
      tempoSync: { rateHz: { enabled: true, mode: 'division', division: '1/8' } },
    }])
    const first = draftFromPatchExport(patch)
    expect(first.controlTracks[0]).toMatchObject({
      type: 'Sinusoid',
      rateHz: 40,
      phaseRad: 0,
      amplitude: 2,
    })
    expect(buildPatchExport(draftFromPatchExport(buildPatchExport(first))))
      .toEqual(buildPatchExport(first))
  })
})
