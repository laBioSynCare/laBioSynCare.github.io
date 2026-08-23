import { describe, expect, it } from 'vitest'
import {
  buildPatchExport,
  createAudioTrack,
  createEmptyDraft,
  createVisualTrack,
} from './presetDraft.js'
import {
  FIELD_STARTERS,
  appendFieldTrackBundleInPlace,
  createFieldStarterBundle,
  createFieldStarterDraft,
  fieldReportRequiresAcknowledgement,
  insertFieldTrackBundle,
} from './fieldStarters.js'

function ids(prefix = 'starter') {
  let index = 0
  return (role) => `${prefix}-${++index}-${role}`
}

describe('Sensory Field starter commands', () => {
  it('offers four ordinary-track starters with no workspace identity', () => {
    expect(FIELD_STARTERS.map((starter) => starter.id)).toEqual([
      'sensory-field',
      'stereoscopic-tree',
      'stereoscopic-abstraction',
      'stereoscopic-landscape',
    ])
    for (const starter of FIELD_STARTERS) {
      const { draft } = createFieldStarterDraft(starter.id, { idFor: ids(starter.id) })
      expect(draft.visualTracks.length).toBeGreaterThan(0)
      expect(draft).not.toHaveProperty('fieldState')
      expect(draft).not.toHaveProperty('workspace')
      expect(buildPatchExport(draft).visualTracks).toEqual(draft.visualTracks)
    }
  })

  it('adds a bundle without mutating the open draft or auto-adopting its stage', () => {
    const draft = createEmptyDraft()
    draft.visualTracks.push(createVisualTrack('Geometry', { id: 'existing-visual' }))
    draft.visualStage.backgroundColor = '#123456'
    const before = structuredClone(draft)
    const bundle = createFieldStarterBundle('stereoscopic-tree', { idFor: ids('tree') })

    const result = insertFieldTrackBundle(draft, bundle, { stagePolicy: 'preserve' })

    expect(draft).toEqual(before)
    expect(result.draft.visualTracks).toHaveLength(2)
    expect(result.draft.visualStage.backgroundColor).toBe('#123456')
    expect(result.stage.applied).toBe(false)
  })

  it('never infers stage ownership from visual-track emptiness', () => {
    const bundle = createFieldStarterBundle('stereoscopic-landscape', { idFor: ids('landscape') })
    const audioOnly = createEmptyDraft()
    audioOnly.audioTracks.push(createAudioTrack('Carrier', { id: 'existing-audio' }))
    audioOnly.visualStage.backgroundColor = '#123456'

    const preserved = insertFieldTrackBundle(audioOnly, bundle, { stagePolicy: 'preserve' })
    expect(preserved.stage.applied).toBe(false)
    expect(preserved.draft.visualStage.backgroundColor).toBe('#123456')

    const replaced = insertFieldTrackBundle(audioOnly, bundle, { stagePolicy: 'replace' })
    expect(replaced.stage.applied).toBe(true)
    expect(replaced.draft.visualStage).toEqual(bundle.stageSuggestion)
  })

  it('appends in place while preserving the live draft and existing track arrays', () => {
    const draft = createEmptyDraft()
    draft.playing = true
    draft.visualStage.backgroundColor = '#123456'
    const controlTracks = draft.controlTracks
    const audioTracks = draft.audioTracks
    const visualTracks = draft.visualTracks
    const hapticTracks = draft.hapticTracks
    const bundle = createFieldStarterBundle('sensory-field', { idFor: ids('field') })

    const result = appendFieldTrackBundleInPlace(draft, bundle, { stagePolicy: 'preserve' })

    expect(result.draft).toBe(draft)
    expect(draft.controlTracks).toBe(controlTracks)
    expect(draft.audioTracks).toBe(audioTracks)
    expect(draft.visualTracks).toBe(visualTracks)
    expect(draft.hapticTracks).toBe(hapticTracks)
    expect(draft.playing).toBe(true)
    expect(draft.visualStage.backgroundColor).toBe('#123456')
    expect(result.addedTracks.audioTracks).toHaveLength(bundle.audioTracks.length)
    expect(draft.audioTracks).toEqual(result.addedTracks.audioTracks)
  })

  it('requires review only for warnings, behavior corrections, or unsupported items', () => {
    const report = {
      mapped: [{ source: 'visual', target: 'visualTracks[0]' }],
      dormant: [{ source: 'depth', reason: 'disabled' }],
      ignored: [{ source: 'consent', reason: 'session-only' }],
      warnings: [],
      behaviorCorrections: [],
      unsupported: [],
    }
    expect(fieldReportRequiresAcknowledgement(report)).toBe(false)

    for (const key of ['warnings', 'behaviorCorrections', 'unsupported']) {
      const needsReview = structuredClone(report)
      needsReview[key].push({ code: key, source: 'test', detail: 'review this' })
      expect(fieldReportRequiresAcknowledgement(needsReview)).toBe(true)
    }
  })

  it('rejects unknown starter and stage policies fail-closed', () => {
    expect(() => createFieldStarterBundle('not-a-starter', { idFor: ids() })).toThrow(/Unknown Field starter/)
    const bundle = createFieldStarterBundle('sensory-field', { idFor: ids() })
    expect(() => insertFieldTrackBundle(null, bundle)).toThrow(/Patch Studio draft/)
    expect(() => insertFieldTrackBundle(createEmptyDraft(), bundle, { stagePolicy: 'magic' }))
      .toThrow(/Unknown Field stage policy/)
    expect(() => insertFieldTrackBundle(createEmptyDraft(), bundle, { stagePolicy: 'adopt-if-empty' }))
      .toThrow(/Unknown Field stage policy/)
  })
})
