import { describe, expect, it } from 'vitest'
import {
  PATCH_FILE_MAX_BYTES,
  buildPatchExport,
  createAudioTrack,
  createDraft,
  createEmptyDraft,
  createMod,
  createTempoSyncConfig,
  createVisualTrack,
  draftFromPatchExport,
  draftFromPatchFileText,
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
    const huge = `{"model":"patch-studio-model-1","pad":"${'x'.repeat(PATCH_FILE_MAX_BYTES)}"}`
    expect(() => draftFromPatchFileText(huge)).toThrow(/too large/i)
  })

  it('survives a truncated file', () => {
    const full = JSON.stringify(buildPatchExport(createDraft()))
    expect(() => draftFromPatchFileText(full.slice(0, full.length / 2)))
      .toThrow(/not valid JSON/i)
  })

  it('tolerates missing track arrays without inventing tracks', () => {
    const sparse = JSON.stringify({
      model: 'patch-studio-model-1',
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
