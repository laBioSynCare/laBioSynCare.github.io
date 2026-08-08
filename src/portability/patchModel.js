// Patch Studio exchange-model identifiers.
//
// Version 1 is the pre-spatial authoring schema. Version 2 adds the shared
// visual stage, fixed-rate Sinusoid controls, ColorField, and first-class
// spatial visual tracks. Version 3 makes each spatial track's optional
// depth-to-size perspective coupling explicit. Keep these identifiers at the
// portability boundary so storage, links, packages, projection, and the editor
// cannot disagree about which documents they accept.

export const PATCH_STUDIO_MODEL_V1 = 'patch-studio-model-1'
export const PATCH_STUDIO_MODEL_V2 = 'patch-studio-model-2'
export const PATCH_STUDIO_MODEL_V3 = 'patch-studio-model-3'
export const PATCH_STUDIO_MODEL = PATCH_STUDIO_MODEL_V3

export const SUPPORTED_PATCH_STUDIO_MODELS = Object.freeze([
  PATCH_STUDIO_MODEL_V1,
  PATCH_STUDIO_MODEL_V2,
  PATCH_STUDIO_MODEL_V3,
])

const MODEL_2_VISUAL_TYPES = new Set([
  'ColorField',
  'DepthMarkers',
  'TreeScene',
  'AbstractScene',
  'LandscapeScene',
])

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value ?? {}, key)

export function isSupportedPatchStudioModel(model) {
  return SUPPORTED_PATCH_STUDIO_MODELS.includes(model)
}

export function assertSupportedPatchStudioModel(model, message = 'Unsupported Patch Studio patch model.') {
  if (!isSupportedPatchStudioModel(model)) throw new Error(message)
  return model
}

/**
 * Return true when a patch uses fields that a shipped model-1 reader would
 * silently discard or coerce. This guard is intentionally structural: every
 * outbound boundary can apply it without importing the editor normalizer.
 */
export function patchUsesModel2Features(patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return false
  if (hasOwn(patch, 'visualStage')) return true
  const controlTracks = Array.isArray(patch.controlTracks) ? patch.controlTracks : []
  const visualTracks = Array.isArray(patch.visualTracks) ? patch.visualTracks : []
  if (controlTracks.some((track) => track?.type === 'Sinusoid')) return true
  return visualTracks.some((track) => (
    MODEL_2_VISUAL_TYPES.has(track?.trackType)
    || hasOwn(track, 'config')
    || hasOwn(track, 'enabled')
  ))
}

/** Model-3 state that a model-2 normalizer would silently discard. */
export function patchUsesModel3Features(patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return false
  const visualTracks = Array.isArray(patch.visualTracks) ? patch.visualTracks : []
  return visualTracks.some((track) => hasOwn(track, 'depthAffectsScale'))
}

/**
 * Validate both the identifier and the identifier/schema pairing. In
 * particular, a newer feature may never be emitted under an older tag: old
 * readers accept those tags and would otherwise downgrade the feature silently.
 */
export function assertPatchStudioPatch(
  patch,
  message = 'Only supported Patch Studio patches are accepted.',
) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error(message)
  assertSupportedPatchStudioModel(patch.model, message)
  if (
    patch.model !== PATCH_STUDIO_MODEL_V3
    && patchUsesModel3Features(patch)
  ) {
    throw new Error(`A patch using model-3 features cannot declare ${patch.model}.`)
  }
  if (patch.model === PATCH_STUDIO_MODEL_V1 && patchUsesModel2Features(patch)) {
    throw new Error('A patch using model-2 features cannot declare patch-studio-model-1.')
  }
  return patch.model
}
