import { describe, expect, it } from 'vitest'
import { normalizeCanonicalBase, normalizeDeploymentBase } from './deployment.config.js'

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

describe('normalizeCanonicalBase', () => {
  it.each(['', 'https://w3c-cg.github.io/sstim/', 'https://labiosyncare.github.io/'])(
    'accepts %j',
    (value) => expect(normalizeCanonicalBase(value)).toBe(value),
  )

  it.each([
    'https://w3c-cg.github.io/sstim',
    'http://w3c-cg.github.io/sstim/',
    'https://W3C-CG.github.io/sstim/',
    'https://w3c-cg.github.io:443/sstim/',
    'https://w3c-cg.github.io/sstim/../other/',
    'https://w3c-cg.github.io/sstim/?page=1',
    'https://w3c-cg.github.io/sstim/#top',
    'https://user@w3c-cg.github.io/sstim/',
    '/sstim/',
    'w3c-cg.github.io/sstim/',
  ])('rejects %j', (value) => {
    expect(() => normalizeCanonicalBase(value)).toThrow(/SSTIM_CANONICAL_BASE/)
  })
})
