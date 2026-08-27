import { expect, test } from 'vitest'

import {
  END,
  ROOT_SITE,
  SITE,
  START,
  generatedRegion,
  legacyVersions,
  parseRules,
  resolvePath,
  simulate,
  snapshotInventory,
} from './sstim-w3id-snapshot-routes.mjs'

// The predecessor of this suite asserted the region contained no `[0-9]+`,
// pinning the enumerated design ADR 0053 replaced. What replaces that assertion
// is not weaker: the enumeration was checked by regenerating its text, which
// only ever proved the generator agreed with itself, while these run the rules.

test('every frozen artifact routes to its own URL', () => {
  const { failures, checked, snapshots } = simulate()
  expect(failures).toEqual([])
  expect(snapshots).toBeGreaterThan(10)
  // Four artifacts plus two bare-IRI spellings for the smallest snapshot; the
  // guard is against a silently empty inventory, which is how a gate passes
  // while checking nothing.
  expect(checked).toBeGreaterThan(snapshots * 6)
})

test('the rule count does not grow with the number of releases', () => {
  // This is the property the w3id maintainer asked for on perma-id/w3id.org#6548:
  // a new release must not mean a new rule, and therefore not a new pull request.
  const real = snapshotInventory()
  const modular = { version: '0.13.0', turtle: ['sstim-core.ttl', 'sstim-namespace.ttl'], manifest: true, schema: true }
  const fifty = Array.from({ length: 50 }, (_, index) => ({
    ...modular,
    version: `1.${index}.0`,
  }))
  expect(parseRules(generatedRegion([...real, ...fifty])).length)
    .toBe(parseRules(generatedRegion(real)).length)
})

test('a modular version IRI resolves to the whole ontology, not the Kernel', () => {
  const rules = parseRules(generatedRegion())
  // ADR 0043 made sstim-core.ttl the two-class Kernel. Answering a version IRI
  // with it would hand a registry client a fraction of the release.
  expect(resolvePath('0.15.0', rules)).toBe(`${SITE}0.15.0/sstim-namespace.ttl`)
  expect(resolvePath('0.15.0/', rules)).toBe(`${SITE}0.15.0/sstim-namespace.ttl`)
  // Pre-modular snapshots keep the meaning they were frozen with.
  expect(resolvePath('0.1.0', rules)).toBe(`${SITE}0.1.0/sstim-core.ttl`)
})

test('a release not yet cut already has working routes', () => {
  const rules = parseRules(generatedRegion())
  expect(resolvePath('0.16.0/sstim-vocab.ttl', rules)).toBe(`${SITE}0.16.0/sstim-vocab.ttl`)
  // 0.16.0's frozen manifest states root-absolute paths, so its manifest route
  // stays on the origin-root deployment while its Turtle moves with everything
  // else. Verified against both live origins before the rule was written: the
  // paths inside it answer 404 under the project mount and 200 at the root.
  expect(resolvePath('0.16.0/manifest', rules)).toBe(`${ROOT_SITE}0.16.0/manifest.json`)
  expect(resolvePath('9.9.9', rules)).toBe(`${SITE}9.9.9/sstim-namespace.ttl`)
  // A release not yet cut has frozen no manifest, so nothing pins it and it
  // routes with the live line.
  expect(resolvePath('9.9.9/manifest', rules)).toBe(`${SITE}9.9.9/manifest.json`)
})

test('hyphenated module names route, which the character class must allow', () => {
  const rules = parseRules(generatedRegion())
  for (const file of ['sstim-core-plus-profile.ttl', 'sstim-neuromodulation-evidence.ttl']) {
    expect(resolvePath(`0.15.0/${file}`, rules)).toBe(`${SITE}0.15.0/${file}`)
  }
})

test('the simulation catches a generator that drops the legacy rule', () => {
  // Mutation: without it, a pre-modular version IRI falls through to the
  // modular rule and answers with a namespace catalogue that snapshot lacks.
  const region = generatedRegion()
  const broken = region.split('\n').filter((line) => !line.includes('0\\.1\\.0|')).join('\n')
  const { failures } = simulate(snapshotInventory(), broken)
  expect(failures.length).toBeGreaterThan(0)
  expect(failures.join('\n')).toContain('sstim-core.ttl')
})

test('the simulation catches a file pattern that excludes hyphens', () => {
  const region = generatedRegion().replace('sstim-[a-z0-9-]+', 'sstim-[a-z0-9]+')
  const { failures } = simulate(snapshotInventory(), region)
  expect(failures.length).toBeGreaterThan(0)
  expect(failures.join('\n')).toContain('no rule matched')
})

test('a modular snapshot missing its namespace catalogue is refused', () => {
  const inventory = [{ version: '0.13.0', turtle: ['sstim-core.ttl'], manifest: true, schema: true }]
  expect(() => generatedRegion(inventory)).toThrow(/lacks sstim-namespace\.ttl/)
})

test('a snapshot missing the Kernel file is refused', () => {
  const inventory = [{ version: '0.13.0', turtle: ['sstim-vocab.ttl'], manifest: true, schema: true }]
  expect(() => generatedRegion(inventory)).toThrow(/lacks sstim-core\.ttl/)
})

test('the legacy set is exactly the pre-manifest snapshots', () => {
  const inventory = snapshotInventory()
  expect(legacyVersions(inventory)).toEqual(
    inventory.filter((snapshot) => !snapshot.manifest).map((snapshot) => snapshot.version),
  )
  // It cannot grow: `make snapshot` refuses a module set without a manifest.
  expect(legacyVersions(inventory).every((version) => version.startsWith('0.'))).toBe(true)
})

test('the region is delimited by its markers', () => {
  const region = generatedRegion()
  expect(region.startsWith(START)).toBe(true)
  expect(region.endsWith(END)).toBe(true)
})
