import { describe, expect, it } from 'vitest'

import { EXAMPLE_PATCHES, buildExampleDraft, getExamplePatch } from './examplePatches.js'
import { buildPatchExport, draftFromPatchExport, patchSummary, validateDraft } from './presetDraft.js'
import { PATCH_STUDIO_MODEL } from '../../portability/patchModel.js'

describe('the bundled example patches', () => {
  it('have unique ids and presentable copy', () => {
    const ids = EXAMPLE_PATCHES.map((example) => example.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const example of EXAMPLE_PATCHES) {
      expect(example.label).toBeTruthy()
      expect(example.blurb.length).toBeGreaterThan(40)
    }
  })

  // The point of an example is that it opens clean. One that loads with a
  // validation error teaches the reader that errors are normal.
  it.each(EXAMPLE_PATCHES.map((example) => [example.id, example]))(
    '%s builds a draft that validates with no errors',
    (_id, example) => {
      const built = example.build()
      const errors = validateDraft(built).filter((issue) => issue.level === 'error')
      expect(errors).toEqual([])
    },
  )

  it.each(EXAMPLE_PATCHES.map((example) => [example.id, example]))(
    '%s survives the real export and import path',
    (_id, example) => {
      const built = example.build()
      const exported = buildPatchExport(built)
      expect(exported.model).toBe(PATCH_STUDIO_MODEL)

      // draftFromPatchExport is what Import and the share link both go
      // through, so this is the round trip a reader actually performs.
      const reloaded = draftFromPatchExport(exported)
      expect(reloaded.patchName).toBe(built.patchName)
      expect(patchSummary(reloaded)).toEqual(patchSummary(built))
    },
  )

  it('every example makes a sound', () => {
    for (const example of EXAMPLE_PATCHES) {
      expect(example.build().audioTracks.length, example.id).toBeGreaterThan(0)
    }
  })

  it('keeps every level gentle', () => {
    // These open on a click, so nothing may open loud. The catalog's 0.30
    // ceiling (CLAUDE.md §4.6) does not bind patch drafts, but it is the right
    // number for something that starts playing on a stranger's headphones.
    //
    // This bounds the base level only. Modulation adds on top of it, so a
    // linked gain can still exceed this: the breathing pacer's base sits at
    // 0.08 for exactly that reason, and the real output was measured in a
    // browser rather than inferred from these numbers.
    for (const example of EXAMPLE_PATCHES) {
      for (const track of example.build().audioTracks) {
        expect(track.params.gain.value, `${example.id}/${track.name}`).toBeLessThanOrEqual(0.3)
        expect(track.params.gain.value, `${example.id}/${track.name}`).toBeGreaterThan(0)
      }
    }
  })

  it('demonstrates a control link at least once', () => {
    const linked = EXAMPLE_PATCHES.filter((example) =>
      example.build().audioTracks.some((track) =>
        Object.values(track.params).some((param) => (param.mods?.length ?? 0) > 0)))
    expect(linked.length).toBeGreaterThan(0)
  })

  it('covers more than one audio track type', () => {
    const types = new Set(
      EXAMPLE_PATCHES.flatMap((example) => example.build().audioTracks.map((track) => track.trackType)))
    expect(types.size).toBeGreaterThanOrEqual(4)
  })

  it('names a headphone requirement where the patch depends on it', () => {
    // A binaural beat heard on a speaker is not a binaural beat.
    const binaural = getExamplePatch('binaural-alpha')
    expect(binaural.needs).toMatch(/headphone/i)
  })
})

describe('buildExampleDraft', () => {
  it('builds the named example', () => {
    expect(buildExampleDraft('alpha-10-isochronic').patchName).toBe('Alpha 10 Hz isochronic')
  })

  it('falls back to the default patch rather than throwing on an unknown id', () => {
    // Reached from a URL, so it takes whatever a stranger typed.
    expect(buildExampleDraft('no-such-example').patchName).toBe('New Patch')
    expect(getExamplePatch('no-such-example')).toBeNull()
  })
})
