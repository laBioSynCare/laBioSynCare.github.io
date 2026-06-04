import { describe, expect, it } from 'vitest'
import {
  buildPatchExport,
  createAudioTrack,
  createDraft,
  createEmptyDraft,
  createMod,
  createTempoSyncConfig,
  draftFromPatchExport,
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
      model: 'patch-studio-model-1',
      patchName: 'Stored',
      timing: { bpmEnabled: false, bpm: 60, beatsPerBar: 4, lengthSec: 900 },
      controlTracks: [{ id: 'ctl-900', type: 'Martigli', name: 'Ctl' }],
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
