import { expect, test } from 'vitest'

import { CURRENT_HOME, LEGACY_ORIGIN, isSupersededOrigin } from './publicationOrigins.js'

test('only the superseded origin is superseded', () => {
  expect(isSupersededOrigin(LEGACY_ORIGIN)).toBe(true)

  // Each of these would otherwise tell someone to leave a place they are not
  // on. The new site is the worst of them: a "we moved" notice on the site you
  // moved to is a loop.
  expect(isSupersededOrigin('https://w3c-cg.github.io')).toBe(false)
  expect(isSupersededOrigin('http://127.0.0.1:4173')).toBe(false)
  expect(isSupersededOrigin('https://sstim.institution.example')).toBe(false)
  expect(isSupersededOrigin('')).toBe(false)
  expect(isSupersededOrigin(undefined)).toBe(false)
})

test('the match is exact, not a prefix or a hostname test', () => {
  // A self-hosted deployment that happens to sit under a lookalike host, and
  // the scheme downgrade, both have to miss.
  expect(isSupersededOrigin('https://labiosyncare.github.io/')).toBe(false)
  expect(isSupersededOrigin('https://labiosyncare.github.io.example.test')).toBe(false)
  expect(isSupersededOrigin('http://labiosyncare.github.io')).toBe(false)
})

test('the new home is a mounted URL, so it must keep its trailing slash', () => {
  // Without it a relative link from the notice would resolve against
  // `w3c-cg.github.io/` rather than the project mount.
  expect(CURRENT_HOME.endsWith('/sstim/')).toBe(true)
})
