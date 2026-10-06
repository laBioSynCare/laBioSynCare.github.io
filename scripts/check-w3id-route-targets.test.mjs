import { expect, test } from 'vitest'
import { cpSync, mkdtempSync, readFileSync, renameSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { releaseDirectories } from './publish-latest-ontology.mjs'

import {
  developmentLineTargets,
  expandRule,
  isDerivedReleaseArtifact,
  routeTargets,
  unpublishableTargets,
} from './check-w3id-route-targets.mjs'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const htaccess = readFileSync(
  join(repoRoot, 'docs', 'ecosystem', 'w3id', 'sstim', '.htaccess'),
  'utf8',
)
const manifest = JSON.parse(
  readFileSync(join(repoRoot, 'static', 'ontology', 'manifest.json'), 'utf8'),
)

test('every committed w3id ontology redirect target is publishable', () => {
  expect(unpublishableTargets({ htaccess, manifest })).toEqual([])
})

test('no committed route serves the development line (ADR 0060)', () => {
  expect(developmentLineTargets(htaccess)).toEqual([])
})

test('a route to a top-level ontology artifact is caught, and nothing else is', () => {
  const site = 'https://w3c-cg.github.io/sstim/ontology/'
  const rule = (pattern, target) => `RewriteRule ^${pattern}$ ${target} [R=303,L]\n`
  const rules = [
    rule('vocab', `${site}sstim-vocab.ttl`),
    rule('profile/(core|full)', `${site}sstim-$1-profile.jsonld`),
    rule('manifest', `${site}manifest.json`),
    rule('legacy', 'https://labiosyncare.github.io/ontology/sstim-core.rdf'),
    rule('released', `${site}latest/sstim-vocab.ttl`),
    rule('pinned', `${site}0.18.0/sstim-vocab.ttl`),
    rule('void', `${site}void.ttl`),
    rule('catalog', `${site}instances/frameworks/bsc.ttl`),
    rule('docs', `${site}docs/`),
  ].join('')

  expect(developmentLineTargets(rules)).toEqual([
    'https://labiosyncare.github.io/ontology/sstim-core.rdf',
    `${site}manifest.json`,
    `${site}sstim-core-profile.jsonld`,
    `${site}sstim-full-profile.jsonld`,
    `${site}sstim-vocab.ttl`,
  ])
})

test('audited public preset and reference routes target their owning Turtle files', () => {
  const targets = new Set(routeTargets(htaccess))

  expect(targets).toContain(
    'https://w3c-cg.github.io/sstim/ontology/instances/presets/heal-theta-breathing-seed.ttl',
  )
  expect(targets).toContain(
    'https://w3c-cg.github.io/sstim/ontology/instances/presets/perform-alpha-10-seed.ttl',
  )
  expect(targets).toContain(
    'https://w3c-cg.github.io/sstim/ontology/instances/references/references.ttl',
  )
})

test('a rule target expands against its own alternation, unescaping the pattern', () => {
  expect(
    expandRule('(kernel|core|core-plus|full)', 'https://example.test/sstim-$1-profile.ttl'),
  ).toEqual([
    'https://example.test/sstim-kernel-profile.ttl',
    'https://example.test/sstim-core-profile.ttl',
    'https://example.test/sstim-core-plus-profile.ttl',
    'https://example.test/sstim-full-profile.ttl',
  ])

  expect(
    expandRule('0\\.12\\.0/(sstim-core\\.ttl|sstim-vocab\\.ttl)', 'https://example.test/0.12.0/$1'),
  ).toEqual([
    'https://example.test/0.12.0/sstim-core.ttl',
    'https://example.test/0.12.0/sstim-vocab.ttl',
  ])
})

test('the 406 fallthrough is a status rule, not a document target', () => {
  const targets = routeTargets('RewriteRule ^exposure$ - [R=406,L]\n')
  expect(targets).toEqual([])
})

test('a serialization stops being publishable when its module drops the export flag', () => {
  const withoutExport = structuredClone(manifest)
  const vocab = withoutExport.modules.find((module) => module.id === 'vocab')
  vocab.release.export = false

  const problems = unpublishableTargets({ htaccess, manifest: withoutExport })

  expect(problems.some((problem) => problem.includes('sstim-vocab.jsonld'))).toBe(true)
  expect(problems.some((problem) => problem.includes('sstim-vocab.rdf'))).toBe(true)
  // The Turtle master is committed, so it stays publishable either way.
  expect(problems.some((problem) => problem.endsWith('sstim-vocab.ttl'))).toBe(false)
})

test('a release that renames a namespace catalogue is caught when it becomes latest/', () => {
  // Since ADR 0060 no route reads the working tree, so a rename in the working
  // manifest alone reaches nothing (the next test pins that for /sstim). The
  // rename bites when a release carrying it becomes the newest snapshot, since
  // latest/ is then a copy of that snapshot: the silent 404 this file exists to
  // prevent. Modelled with a scratch ontology root whose newest release first
  // has the exposure catalogue and then does not, so the assertion cannot pass
  // for an unrelated reason.
  const root = mkdtempSync(join(tmpdir(), 'sstim-routes-'))
  try {
    const release = join(root, '9.9.9')
    cpSync(join(repoRoot, 'static', 'ontology', releaseDirectories()[0]), release, {
      recursive: true,
    })
    const exposureCaught = (problems) =>
      problems.some((problem) => problem.includes('latest/sstim-exposure-namespace.ttl'))

    expect(exposureCaught(unpublishableTargets({ htaccess, manifest, ontologyRoot: root })))
      .toBe(false)

    renameSync(
      join(release, 'sstim-exposure-namespace.ttl'),
      join(release, 'sstim-exposure-catalogue.ttl'),
    )
    const renamed = structuredClone(manifest)
    const exposure = renamed.namespaceDocuments.find((document) => document.id === 'exposure')
    exposure.runtime.turtleUrl = '/ontology/sstim-exposure-catalogue.ttl'

    expect(exposureCaught(unpublishableTargets({ htaccess, manifest: renamed, ontologyRoot: root })))
      .toBe(true)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('renaming the sstim catalogue cannot break the bare ontology IRI', () => {
  // Not an oversight, and worth pinning so it is not "fixed" back: since ADR
  // 0055 the `^$` rules resolve through latest/, which is a copy of a frozen
  // release, and since ADR 0060 every other unversioned route does too. Its
  // files are that snapshot's committed bytes, so a rename in the working
  // manifest genuinely does not reach them. The route is still checked,
  // against the release it will actually be built from.
  const renamed = structuredClone(manifest)
  const sstim = renamed.namespaceDocuments.find((document) => document.id === 'sstim')
  sstim.runtime.turtleUrl = '/ontology/sstim-catalogue.ttl'

  const problems = unpublishableTargets({ htaccess, manifest: renamed })

  expect(problems.some((problem) => problem.includes('latest/'))).toBe(false)
})

test('a frozen release\'s page and version document formats count as published, and nothing else does', () => {
  // GB-09: publish-release-serializations.py derives these at deploy, so they
  // are never committed. The rule is the script's: the namespace catalogue for a
  // release with a manifest, the Kernel file before that, and only for a
  // release that exists.
  expect(isDerivedReleaseArtifact('0.18.0/')).toBe(true)
  expect(isDerivedReleaseArtifact('0.18.0/sstim-namespace.jsonld')).toBe(true)
  expect(isDerivedReleaseArtifact('0.18.0/sstim-namespace.rdf')).toBe(true)
  expect(isDerivedReleaseArtifact('0.1.0/sstim-core.jsonld')).toBe(true)
  // Not the Kernel of a modular release, which is two classes, not the release.
  expect(isDerivedReleaseArtifact('0.18.0/sstim-core.jsonld')).toBe(false)
  // Not a module, which stays Turtle in a frozen release.
  expect(isDerivedReleaseArtifact('0.18.0/sstim-vocab.jsonld')).toBe(false)
  // Not a release that was never cut.
  expect(isDerivedReleaseArtifact('9.9.9/sstim-namespace.jsonld')).toBe(false)
  expect(isDerivedReleaseArtifact('9.9.9/')).toBe(false)
})
