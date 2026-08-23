import { describe, expect, it } from 'vitest'
import { normalizeDeploymentBase } from './deployment.config.js'

describe('normalizeDeploymentBase', () => {
  it.each(['', '/sstim', '/nested/project', '/name-with.dots_and~marks'])(
    'accepts %j',
    (value) => expect(normalizeDeploymentBase(value)).toBe(value),
  )

  it.each([
    '/',
    'sstim',
    '/sstim/',
    '//sstim',
    '/sstim//nested',
    '/.',
    '/..',
    '/sstim/./nested',
    '/sstim/../nested',
    '/sstim?mode=test',
    '/sstim#term',
  ])('rejects %j', (value) => {
    expect(() => normalizeDeploymentBase(value)).toThrow(/SSTIM_BASE_PATH/)
  })
})
