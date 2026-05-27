import { describe, expect, it } from 'vitest'
import {
  buildPatchExport,
  createDraft,
  createMod,
  createTempoSyncConfig,
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
})
