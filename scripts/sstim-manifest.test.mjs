import { expect, test } from 'vitest'
import { resolve } from 'node:path'

import {
  DEFAULT_MANIFEST_PATH,
  REPOSITORY_ROOT,
  loadManifest,
  profileResourceArtifactProblems,
  readOntologyMetadata,
  resolveProfileClosure,
  sameSet,
  stripTurtleComments,
  syncChecksums,
  validateManifest,
} from './sstim-manifest.mjs'

test('the live SSTIM manifest is complete and internally consistent', () => {
  const manifest = loadManifest(DEFAULT_MANIFEST_PATH)
  expect(validateManifest(manifest)).toEqual([])
  expect(manifest.suite.version).toBe('0.13.0-dev')
  expect(manifest.suite.status).toBe('development')
  expect(manifest.schemaVersion).toBe('1.2.0')
  expect(manifest.modules).toHaveLength(18)
  expect(manifest.$schema).toBe('https://w3id.org/sstim/manifest-schema/1')
  expect(manifest.namespaceDocuments.map((document) => document.id)).toEqual([
    'sstim',
    'exposure',
  ])
  expect(
    manifest.profiles.map((profile) => profile.id),
  ).toEqual(['kernel', 'core', 'core-plus', 'full'])
})

test('released manifests require immutable artifacts and complete profile contracts', () => {
  const manifest = structuredClone(loadManifest(DEFAULT_MANIFEST_PATH))
  const version = '0.13.0'
  manifest.suite.version = version
  manifest.suite.status = 'released'
  manifest.$schema = `https://w3id.org/sstim/${version}/manifest.schema.json`
  manifest.immutableRelease = {
    baseUrl: `https://w3id.org/sstim/${version}/`,
    manifestUrl: `https://w3id.org/sstim/${version}/manifest`,
    schemaUrl: `https://w3id.org/sstim/${version}/manifest.schema.json`,
  }
  for (const module of manifest.modules) {
    module.version = version
    module.publication.versionedUrl =
      `https://w3id.org/sstim/${version}/${module.source.path.split('/').pop()}`
  }
  for (const profile of manifest.profiles) {
    profile.version = version
    profile.status = 'released'
    profile.publication.versionedUrl =
      `https://w3id.org/sstim/${version}/${profile.source.path.split('/').pop()}`
    profile.fixtures.positive = [
      'test/fixtures/rdf/core-profile/positive-minimal-stimulus.ttl',
    ]
    profile.fixtures.outOfScope = [
      'test/fixtures/rdf/ecosystem-positive/self-publication.ttl',
    ]
    profile.fixtures.adversarial = [
      'test/fixtures/rdf/ecosystem/flattened-relationship.ttl',
    ]
    profile.competencyQueries = ['scripts/sstim-core-profile-contract.py']
  }

  expect(validateManifest(manifest, { verifyFiles: false })).toEqual([])

  delete manifest.profiles[0].publication.versionedUrl
  manifest.profiles[1].fixtures.adversarial = []
  const errors = validateManifest(manifest, { verifyFiles: false })
  expect(errors.some((error) => error.includes('publication.versionedUrl'))).toBe(true)
  expect(errors.some((error) => error.includes('fixtures.adversarial'))).toBe(true)
})

test('Turtle prose is never read as an axiom, and # survives in IRIs and literals', () => {
  const source = [
    '@prefix sstim: <https://w3id.org/sstim#> .',
    '# release preparation adds owl:versionIRI <https://w3id.org/decoy/version> here ;',
    '<https://w3id.org/sstim> a owl:Ontology ;',
    '    owl:versionInfo "0.13.0-dev" ; # owl:imports <https://w3id.org/decoy/import> ;',
    '    dct:title "A # hash inside a literal" ;',
    '    dct:description "an escaped \\" quote and # another hash" ;',
    '    owl:imports <https://w3id.org/sstim/kernel> .',
    '',
  ].join('\n')

  const stripped = stripTurtleComments(source)

  expect(stripped).toContain('<https://w3id.org/sstim#>')
  expect(stripped).toContain('"A # hash inside a literal"')
  expect(stripped).toContain('# another hash')
  expect(stripped).toContain('<https://w3id.org/sstim/kernel>')
  expect(stripped).not.toContain('decoy')
})

test('no module claims a version IRI while the suite is under development (ADR 0020)', () => {
  const manifest = loadManifest(DEFAULT_MANIFEST_PATH)
  expect(manifest.suite.status).toBe('development')

  for (const module of manifest.modules) {
    const metadata = readOntologyMetadata(resolve(REPOSITORY_ROOT, module.source.path))
    expect(
      metadata.versionIris,
      `module ${module.id} must carry owl:versionInfo only; the whole-set release adds the single core version IRI`,
    ).toEqual([])
  }
})

test('profiles import module retrieval endpoints, which need not be ontology IRIs', () => {
  const manifest = loadManifest(DEFAULT_MANIFEST_PATH)
  const moduleById = new Map(manifest.modules.map((module) => [module.id, module]))

  // /sstim and /sstim/exposure serve multi-module namespace catalogues, so the
  // Kernel and Exposure modules publish separate exact retrieval endpoints.
  expect(moduleById.get('core').publication.persistentUrl).toBe('https://w3id.org/sstim/kernel')
  expect(moduleById.get('exposure').publication.persistentUrl)
    .toBe('https://w3id.org/sstim/module/exposure')

  for (const profile of manifest.profiles) {
    const metadata = readOntologyMetadata(resolve(REPOSITORY_ROOT, profile.source.path))
    const expectedImports = profile.modules.map((id) => moduleById.get(id).publication.persistentUrl)
    const expectedRequires = profile.modules.map((id) => moduleById.get(id).ontologyIri)

    expect(sameSet(metadata.imports, expectedImports)).toBe(true)
    expect(sameSet(metadata.requires, expectedRequires)).toBe(true)
  }
})

test('metadata set comparison rejects duplicate-for-missing declarations', () => {
  expect(sameSet(['https://example.test/a', 'https://example.test/a'], [
    'https://example.test/a',
    'https://example.test/b',
  ])).toBe(false)
})

test('profile resource descriptors point at mutable artifacts during development', () => {
  const manifest = loadManifest(DEFAULT_MANIFEST_PATH)
  for (const profile of manifest.profiles) {
    const metadata = readOntologyMetadata(resolve(REPOSITORY_ROOT, profile.source.path))
    expect(metadata.resourceArtifacts.get(`${profile.iri}#entrypoint`)).toEqual([
      profile.iri,
    ])
    expect(metadata.resourceArtifacts.get(`${profile.iri}#manifest`)).toEqual([
      manifest.manifestIri,
    ])
  }

  const released = structuredClone(manifest)
  released.suite.status = 'released'
  released.immutableRelease = {
    manifestUrl: 'https://w3id.org/sstim/0.13.0/manifest',
  }
  for (const module of released.modules) {
    module.publication.versionedUrl =
      `https://w3id.org/sstim/0.13.0/${module.source.path.split('/').pop()}`
  }
  const core = released.profiles.find((profile) => profile.id === 'core')
  core.publication.versionedUrl =
    'https://w3id.org/sstim/0.13.0/sstim-core-profile.ttl'
  const metadata = readOntologyMetadata(resolve(REPOSITORY_ROOT, core.source.path))
  const problems = profileResourceArtifactProblems({
    manifest: released,
    profile: core,
    resourceArtifacts: metadata.resourceArtifacts,
  })
  expect(problems).toHaveLength(3)
  expect(problems.every((problem) => problem.includes('immutable release'))).toBe(true)
})

test('unknown manifest fields and nonexistent contract files are rejected', () => {
  const manifest = structuredClone(loadManifest(DEFAULT_MANIFEST_PATH))
  manifest.unreviewedExtension = true
  manifest.profiles[0].fixtures.positive = ['test/fixtures/rdf/does-not-exist.ttl']

  const errors = validateManifest(manifest)
  expect(errors.some((error) => error.includes('unsupported property'))).toBe(true)
  expect(errors.some((error) => error.includes('missing contract file'))).toBe(true)
})

test('profile closure keeps shape graphs explicit and dependency ordered', () => {
  const manifest = loadManifest(DEFAULT_MANIFEST_PATH)

  expect(resolveProfileClosure(manifest, 'kernel')).toEqual(['core'])
  expect(resolveProfileClosure(manifest, 'core')).toEqual(['core', 'stimulus'])
  expect(
    resolveProfileClosure(manifest, 'core', { withShapes: true }),
  ).toEqual(['core', 'stimulus', 'core-shapes'])
  expect(
    resolveProfileClosure(manifest, 'core-plus', { withShapes: true }),
  ).toEqual(['core', 'stimulus', 'common', 'core-shapes'])

  const fullWithoutShapes = resolveProfileClosure(manifest, 'full')
  const fullWithShapes = resolveProfileClosure(manifest, 'full', { withShapes: true })
  expect(fullWithoutShapes).toHaveLength(16)
  expect(fullWithShapes).toHaveLength(17)
  expect(fullWithShapes.at(-1)).toBe('shapes')
  expect(fullWithoutShapes).not.toContain('core-shapes')
})

test('dependency cycles are rejected', () => {
  const manifest = structuredClone(loadManifest(DEFAULT_MANIFEST_PATH))
  const common = manifest.modules.find((module) => module.id === 'common')
  common.requires.push('technique')

  const errors = validateManifest(manifest, { verifyFiles: false })
  expect(errors.some((error) => error.includes('Module dependency cycle'))).toBe(true)
})

test('checksum synchronization repairs module, entrypoint, and profile digests', () => {
  const manifest = structuredClone(loadManifest(DEFAULT_MANIFEST_PATH))
  delete manifest.modules[0].source.sha256
  delete manifest.profiles[0].source.sha256
  for (const profile of manifest.profiles) delete profile.sha256

  syncChecksums(manifest, { rootDir: REPOSITORY_ROOT })

  expect(validateManifest(manifest)).toEqual([])
  expect(manifest.modules[0].source.sha256).not.toBe('0'.repeat(64))
  expect(manifest.profiles[0].source.sha256).not.toBe('0'.repeat(64))
  expect(manifest.profiles.every((profile) => profile.sha256 !== '0'.repeat(64))).toBe(true)
})
