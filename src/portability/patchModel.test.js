import { describe, expect, it } from 'vitest'
import {
  PATCH_STUDIO_MODEL,
  PATCH_STUDIO_MODEL_V1,
  PATCH_STUDIO_MODEL_V2,
  PATCH_STUDIO_MODEL_V3,
  SUPPORTED_PATCH_STUDIO_MODELS,
  assertPatchStudioPatch,
  isSupportedPatchStudioModel,
  patchUsesModel2Features,
  patchUsesModel3Features,
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
  it('makes model 3 current while retaining explicit model-1 and model-2 support', () => {
    expect(PATCH_STUDIO_MODEL).toBe(PATCH_STUDIO_MODEL_V3)
    expect(PATCH_STUDIO_MODEL_V2).toBe('patch-studio-model-2')
    expect(PATCH_STUDIO_MODEL_V3).toBe('patch-studio-model-3')
    expect(SUPPORTED_PATCH_STUDIO_MODELS).toEqual([
      PATCH_STUDIO_MODEL_V1,
      PATCH_STUDIO_MODEL_V2,
      PATCH_STUDIO_MODEL_V3,
    ])
    expect(isSupportedPatchStudioModel(PATCH_STUDIO_MODEL_V1)).toBe(true)
    expect(isSupportedPatchStudioModel(PATCH_STUDIO_MODEL_V2)).toBe(true)
    expect(isSupportedPatchStudioModel(PATCH_STUDIO_MODEL_V3)).toBe(true)
    expect(isSupportedPatchStudioModel('patch-studio-model-99')).toBe(false)
  })

  it('accepts genuine v1, v2, and v3 documents and rejects foreign models', () => {
    expect(assertPatchStudioPatch(v1Patch())).toBe(PATCH_STUDIO_MODEL_V1)
    expect(assertPatchStudioPatch({ ...v1Patch(), model: PATCH_STUDIO_MODEL_V2 }))
      .toBe(PATCH_STUDIO_MODEL_V2)
    expect(assertPatchStudioPatch({ ...v1Patch(), model: PATCH_STUDIO_MODEL_V3 }))
      .toBe(PATCH_STUDIO_MODEL_V3)
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

  it.each([PATCH_STUDIO_MODEL_V1, PATCH_STUDIO_MODEL_V2])(
    'refuses a model-3 perspective flag under %s',
    (model) => {
      const patch = v1Patch({
        model,
        visualTracks: [{
          id: 'v-1',
          trackType: 'Geometry',
          depthAffectsScale: false,
        }],
      })
      expect(patchUsesModel3Features(patch)).toBe(true)
      expect(() => assertPatchStudioPatch(patch)).toThrow(/model-3 features.*patch-studio-model-[12]/)
    },
  )

  it('accepts the perspective flag under model 3', () => {
    const patch = v1Patch({
      model: PATCH_STUDIO_MODEL_V3,
      visualTracks: [{
        id: 'v-1',
        trackType: 'TreeScene',
        depthAffectsScale: true,
      }],
    })
    expect(assertPatchStudioPatch(patch)).toBe(PATCH_STUDIO_MODEL_V3)
  })
})
