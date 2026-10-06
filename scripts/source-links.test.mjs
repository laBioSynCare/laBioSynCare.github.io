import { describe, expect, it } from 'vitest'

import {
  LEGACY_REPOSITORY,
  REPOSITORY,
  checkSourceLinks,
  comingTag,
  migrateLinks,
  pinSourceLinks,
} from './source-links.mjs'

// The repository as these tests see it, so the rule is exercised without a
// clone that has tags (the Lint and Build checkout has none).
const SHA = '6421fe84843f8b506201ef5df65ead31a4e803a8'
const held = new Map([
  ['v0.18.0', new Set(['docs/decisions/0027-evidence.md', 'static/ontology/instances'])],
  [SHA, new Set(['docs/decisions/0061-neutral.md'])],
])
const tree = new Set(['docs/decisions/0027-evidence.md', 'docs/decisions/0061-neutral.md', 'static/ontology/instances'])
const options = {
  file: 'sstim-fixture.ttl',
  upcomingTag: 'v0.19.0',
  hasPathAt: (ref, path) => held.get(ref)?.has(path) ?? false,
  existsInTree: (path) => tree.has(path),
}
const seeAlso = (url) => `sstim:X rdfs:seeAlso <${url}> .\n`

describe('checkSourceLinks', () => {
  it('accepts a citation pinned to a release tag or a commit that holds it, and the bare root', () => {
    const text = seeAlso(`${REPOSITORY}/blob/v0.18.0/docs/decisions/0027-evidence.md`)
      + seeAlso(`${REPOSITORY}/blob/${SHA}/docs/decisions/0061-neutral.md`)
      + seeAlso(REPOSITORY)
    expect(checkSourceLinks(text, options)).toEqual([])
  })

  it('accepts the coming tag only for a path the working tree holds', () => {
    expect(checkSourceLinks(seeAlso(`${REPOSITORY}/blob/v0.19.0/docs/decisions/0061-neutral.md`), options))
      .toEqual([])
    expect(checkSourceLinks(seeAlso(`${REPOSITORY}/blob/v0.19.0/docs/missing.md`), options)[0])
      .toMatch(/the coming v0\.19\.0 will not hold/)
  })

  it('rejects a branch, however the link is written', () => {
    for (const url of [
      `${REPOSITORY}/blob/main/docs/decisions/0027-evidence.md`,
      `${REPOSITORY}/tree/develop/static/ontology/instances`,
    ]) {
      expect(checkSourceLinks(seeAlso(url), options)[0], url).toMatch(/moving ref/)
    }
  })

  it('rejects a pin whose ref does not hold the path', () => {
    expect(checkSourceLinks(seeAlso(`${REPOSITORY}/blob/v0.18.0/docs/decisions/0061-neutral.md`), options)[0])
      .toMatch(/v0\.18\.0 does not hold/)
  })

  it('rejects the legacy repository in every form, inside a literal too', () => {
    const text = seeAlso(`${LEGACY_REPOSITORY}/blob/v0.18.0/docs/decisions/0027-evidence.md`)
      + seeAlso(LEGACY_REPOSITORY)
      + `sstim:X skos:historyNote "See ${LEGACY_REPOSITORY}/blob/main/README.md for more."@en .\n`
    expect(checkSourceLinks(text, options)).toHaveLength(3)
  })

  it('lets a mutable dataset landing page name a branch, but never the legacy repository', () => {
    const landing = { ...options, branchesAllowed: true }
    expect(checkSourceLinks(seeAlso(`${REPOSITORY}/tree/main/static/ontology/instances`), landing)).toEqual([])
    expect(checkSourceLinks(seeAlso(`${LEGACY_REPOSITORY}/tree/main/static/ontology/instances`), landing))
      .toHaveLength(1)
  })
})

describe('pinSourceLinks', () => {
  it('pins every citation to the release being cut and leaves the root alone', () => {
    const text = seeAlso(`${REPOSITORY}/blob/v0.18.0/docs/decisions/0027-evidence.md`)
      + seeAlso(`${REPOSITORY}/blob/${SHA}/docs/decisions/0061-neutral.md`)
      + seeAlso(REPOSITORY)
    const { text: pinned, pinned: count } = pinSourceLinks(text, 'v0.19.0', options)
    expect(count).toBe(2)
    expect(pinned).toBe(
      seeAlso(`${REPOSITORY}/blob/v0.19.0/docs/decisions/0027-evidence.md`)
      + seeAlso(`${REPOSITORY}/blob/v0.19.0/docs/decisions/0061-neutral.md`)
      + seeAlso(REPOSITORY),
    )
  })

  it('refuses to freeze a citation of a file the release will not contain', () => {
    expect(() => pinSourceLinks(seeAlso(`${REPOSITORY}/blob/v0.18.0/docs/gone.md`), 'v0.19.0', options))
      .toThrow(/v0\.19\.0 will not hold/)
  })
})

describe('migrateLinks', () => {
  const refFor = (path) => (held.get('v0.18.0').has(path) ? 'v0.18.0' : SHA)

  it('moves legacy links to the repository and pins branch links there', () => {
    const text = seeAlso(`${LEGACY_REPOSITORY}/blob/main/docs/decisions/0027-evidence.md`)
      + seeAlso(LEGACY_REPOSITORY)
      + seeAlso(`${REPOSITORY}/blob/main/docs/decisions/0061-neutral.md`)
    expect(migrateLinks(text, refFor)).toBe(
      seeAlso(`${REPOSITORY}/blob/v0.18.0/docs/decisions/0027-evidence.md`)
      + seeAlso(REPOSITORY)
      + seeAlso(`${REPOSITORY}/blob/${SHA}/docs/decisions/0061-neutral.md`),
    )
  })

  it('keeps a landing page on its branch when branches are allowed', () => {
    const text = seeAlso(`${LEGACY_REPOSITORY}/tree/main/static/ontology/instances`)
    expect(migrateLinks(text, () => 'main', { branchesAllowed: true }))
      .toBe(seeAlso(`${REPOSITORY}/tree/main/static/ontology/instances`))
  })
})

it('names the tag a development line becomes', () => {
  expect(comingTag('0.19.0-dev')).toBe('v0.19.0')
  expect(comingTag('0.19.0')).toBe('v0.19.0')
})
