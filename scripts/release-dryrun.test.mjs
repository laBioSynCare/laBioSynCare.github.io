import { expect, test } from 'vitest'

import {
  DEFAULT_MANIFEST_PATH,
  loadManifest,
  validateManifest,
} from './sstim-manifest.mjs'
import { generatedRegion, parseRules, resolvePath } from './sstim-w3id-snapshot-routes.mjs'
import {
  modelSnapshotInventory,
  nextVersion,
  prepareReleaseManifest,
} from './release-dryrun.mjs'

const manifest = loadManifest(DEFAULT_MANIFEST_PATH)
const NEXT = '9.9.0'

test('release preparation produces a manifest that satisfies its own contract', () => {
  const prepared = prepareReleaseManifest(manifest, NEXT)

  expect(prepared.suite.status).toBe('released')
  expect(prepared.suite.version).toBe(NEXT)
  expect(prepared.immutableRelease.baseUrl).toBe(`https://w3id.org/sstim/${NEXT}/`)
  expect(prepared.$schema).toBe(`https://w3id.org/sstim/${NEXT}/manifest.schema.json`)
  for (const module of prepared.modules.filter((m) => m.release?.snapshot)) {
    expect(module.publication.versionedUrl).toContain(`/${NEXT}/`)
  }
  // verifyFiles is off: this manifest describes artifacts that do not exist
  // yet, which is the whole point of rehearsing.
  expect(validateManifest(prepared, { verifyFiles: false })).toEqual([])
})

test('the modelled snapshot freezes a whole-ontology artifact for the version IRI', () => {
  const inventory = modelSnapshotInventory(prepareReleaseManifest(manifest, NEXT), NEXT)

  // Every snapshotted module and profile, plus the generated catalogues, plus
  // the manifest sidecars.
  expect(inventory.turtle).toContain('sstim-core.ttl')
  expect(inventory.turtle).toContain('sstim-full-profile.ttl')
  expect(inventory.turtle).toContain('sstim-namespace.ttl')
  expect(inventory.turtle).toContain('sstim-exposure-namespace.ttl')
  expect(inventory.manifest).toBe(true)
  expect(inventory.schema).toBe(true)

  // Since ADR 0053 the region is patterns rather than per-version rules, so the
  // assertion runs them instead of reading them. Same guarantee, one layer
  // closer to what a client actually receives.
  const rules = parseRules(generatedRegion([inventory]))
  const site = 'https://labiosyncare.github.io/ontology/'
  // The bare version route resolves owl:versionIRI, so it must answer with the
  // release. sstim-core.ttl is the two-class Kernel and would be a wrong answer.
  expect(resolvePath(NEXT, rules)).toBe(`${site}${NEXT}/sstim-namespace.ttl`)
  expect(resolvePath(`${NEXT}/manifest`, rules)).toBe(`${site}${NEXT}/manifest.json`)
  expect(resolvePath(`${NEXT}/sstim-full-profile.ttl`, rules))
    .toBe(`${site}${NEXT}/sstim-full-profile.ttl`)
})

test('the rehearsal fails when the snapshot would freeze no whole-ontology artifact', () => {
  // The regression that made 0.13.0 possible to get wrong: a snapshot carrying
  // a manifest but no catalogue leaves the version IRI pointing at a module.
  const prepared = prepareReleaseManifest(manifest, NEXT)
  const inventory = modelSnapshotInventory(prepared, NEXT)
  inventory.turtle = inventory.turtle.filter((file) => !file.endsWith('-namespace.ttl'))

  expect(() => generatedRegion([inventory]))
    .toThrow('would resolve to the Kernel module instead of the released ontology')
})

test('a -dev line rehearses the release it is already numbered for', () => {
  // 0.14.0-dev becomes 0.14.0; rehearsing 0.15.0 would skip the release the
  // repository is actually working towards.
  expect(nextVersion('0.14.0-dev')).toBe('0.14.0')
  expect(nextVersion('0.13.0')).toBe('0.14.0')
})
