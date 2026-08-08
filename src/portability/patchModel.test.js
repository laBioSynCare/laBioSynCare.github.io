import { describe, expect, it } from 'vitest'
import {
  PATCH_STUDIO_MODEL,
  PATCH_STUDIO_MODEL_V1,
  PATCH_STUDIO_MODEL_V2,
  SUPPORTED_PATCH_STUDIO_MODELS,
  assertPatchStudioPatch,
  isSupportedPatchStudioModel,
  patchUsesModel2Features,
} from './patchModel.js'

const v1Patch = (extra = {}) => ({
  model: PATCH_STUDIO_MODEL_V1,
  patchName: 'Legacy patch',
  controlTracks: [],
  audioTracks: [],
  visualTracks: [],
  hapticTracks: [],
  ...extra,
})

describe('Patch Studio model boundary', () => {
  it('makes model 2 current while retaining explicit model-1 support', () => {
    expect(PATCH_STUDIO_MODEL).toBe(PATCH_STUDIO_MODEL_V2)
    expect(PATCH_STUDIO_MODEL_V2).toBe('patch-studio-model-2')
    expect(SUPPORTED_PATCH_STUDIO_MODELS).toEqual([
      PATCH_STUDIO_MODEL_V1,
      PATCH_STUDIO_MODEL_V2,
    ])
    expect(isSupportedPatchStudioModel(PATCH_STUDIO_MODEL_V1)).toBe(true)
    expect(isSupportedPatchStudioModel(PATCH_STUDIO_MODEL_V2)).toBe(true)
    expect(isSupportedPatchStudioModel('patch-studio-model-99')).toBe(false)
  })

  it('accepts genuine v1 and v2 documents and rejects foreign models', () => {
    expect(assertPatchStudioPatch(v1Patch())).toBe(PATCH_STUDIO_MODEL_V1)
    expect(assertPatchStudioPatch({ ...v1Patch(), model: PATCH_STUDIO_MODEL_V2 }))
      .toBe(PATCH_STUDIO_MODEL_V2)
    expect(() => assertPatchStudioPatch({ model: 'other' })).toThrow(/supported Patch Studio/)
  })

  it.each([
    ['shared visual stage', { visualStage: { presentationMode: 'mono' } }],
    ['Sinusoid control', { controlTracks: [{ id: 'ctl-1', type: 'Sinusoid' }] }],
    ['configured visual source', { visualTracks: [{ id: 'v-1', trackType: 'ColorField' }] }],
    ['visual configuration', { visualTracks: [{ id: 'v-1', trackType: 'Geometry', config: {} }] }],
    ['visual enabled state', { visualTracks: [{ id: 'v-1', trackType: 'Geometry', enabled: false }] }],
  ])('refuses to label the model-2 %s as model 1', (_label, feature) => {
    const patch = v1Patch(feature)
    expect(patchUsesModel2Features(patch)).toBe(true)
    expect(() => assertPatchStudioPatch(patch)).toThrow(/model-2 features.*model-1/)
  })
})
