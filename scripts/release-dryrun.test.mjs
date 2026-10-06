import { expect, test } from 'vitest'

import {
  DEFAULT_MANIFEST_PATH,
  loadManifest,
  validateManifest,
} from './sstim-manifest.mjs'
import { SITE, generatedRegion, parseRules, resolvePath } from './sstim-w3id-snapshot-routes.mjs'
import {
  modelSnapshotInventory,
  nextVersion,
  prepareReleaseManifest,
  prepareZenodoMetadata,
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
  // Imported rather than restated: this line was the one place the cutover had
  // to be typed a second time, and it is the reason this test broke instead of
  // the routing.
  const site = SITE
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

test('release preparation moves the deposit metadata to the release, and only that', () => {
  const zenodo = {
    title: 'SSTIM Workbench',
    description: '<p>This release freezes SSTIM 1.2.3: 18 modules holding 100 OWL classes and 200 properties ' +
      'labelled in English, and 300 SKOS concepts. The version IRI https://w3id.org/sstim/1.2.3 resolves to it. ' +
      'Licensed CC BY 4.0.</p>',
    related_identifiers: [
      { identifier: 'https://w3id.org/sstim/1.2.3', relation: 'hasPart' },
      { identifier: 'https://github.com/w3c-cg/sstim', relation: 'isSupplementTo' },
    ],
  }
  const next = prepareZenodoMetadata(zenodo, {
    previous: '1.2.3',
    version: '1.3.0',
    totals: { modules: 19, classes: 101, properties: 202, concepts: 303 },
  })
  expect(next.description).toBe('<p>This release freezes SSTIM 1.3.0: 19 modules holding 101 OWL classes and 202 ' +
    'properties labelled in English, and 303 SKOS concepts. The version IRI https://w3id.org/sstim/1.3.0 resolves ' +
    'to it. Licensed CC BY 4.0.</p>')
  expect(next.related_identifiers.map((r) => r.identifier))
    .toEqual(['https://w3id.org/sstim/1.3.0', 'https://github.com/w3c-cg/sstim'])
  expect(next.title).toBe(zenodo.title)
})

test('the deposit metadata refuses to move from a release it does not describe', () => {
  const zenodo = { description: '<p>SSTIM 1.2.3 with 1 modules, 2 classes, 3 properties and 4 concepts.</p>' }
  const totals = { modules: 1, classes: 2, properties: 3, concepts: 4 }
  expect(() => prepareZenodoMetadata(zenodo, { previous: '1.2.2', version: '1.3.0', totals }))
    .toThrow(/never names 1\.2\.2/)
  // A total stated twice cannot be updated without guessing which one is meant.
  const doubled = { description: `${zenodo.description} Also 9 classes.` }
  expect(() => prepareZenodoMetadata(doubled, { previous: '1.2.3', version: '1.3.0', totals }))
    .toThrow(/expected one "<n> classes" total/)
})
