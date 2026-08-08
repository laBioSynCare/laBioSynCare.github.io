import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { PATCH_STUDIO_MODEL_V1, PATCH_STUDIO_MODEL_V2 } from './PatchStore.js'

const rules = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8')

describe('Firestore Patch Studio model boundary', () => {
  it('allows both readable patch models at the cloud write boundary', () => {
    expect(rules).toContain(`'${PATCH_STUDIO_MODEL_V1}'`)
    expect(rules).toContain(`'${PATCH_STUDIO_MODEL_V2}'`)
  })

  it('requires the record model and nested patch model to agree', () => {
    expect(rules).toContain('request.resource.data.patch.model == request.resource.data.model')
  })
})
