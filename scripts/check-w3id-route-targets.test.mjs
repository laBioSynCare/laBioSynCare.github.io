import { expect, test } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { expandRule, routeTargets, unpublishableTargets } from './check-w3id-route-targets.mjs'

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

test('a renamed namespace document is caught', () => {
  // The exposure catalogue, because it is the one still served from the working
  // tree. Its route names a generated artifact that exists only after
  // `make export`, so a rename here is exactly the silent 404 this file exists
  // to prevent.
  const renamed = structuredClone(manifest)
  const exposure = renamed.namespaceDocuments.find((document) => document.id === 'exposure')
  exposure.runtime.turtleUrl = '/ontology/sstim-exposure-catalogue.ttl'

  const problems = unpublishableTargets({ htaccess, manifest: renamed })

  expect(problems.some((problem) => problem.includes('sstim-exposure-namespace.ttl'))).toBe(true)
})

test('renaming the sstim catalogue cannot break the bare ontology IRI', () => {
  // Not an oversight, and worth pinning so it is not "fixed" back: since ADR
  // 0055 the `^$` rules resolve through latest/, which is a copy of a frozen
  // release. Its files are that snapshot's committed bytes, so a rename in the
  // working manifest genuinely does not reach them. The route is still checked,
  // against the release it will actually be built from.
  const renamed = structuredClone(manifest)
  const sstim = renamed.namespaceDocuments.find((document) => document.id === 'sstim')
  sstim.runtime.turtleUrl = '/ontology/sstim-catalogue.ttl'

  const problems = unpublishableTargets({ htaccess, manifest: renamed })

  expect(problems.some((problem) => problem.includes('latest/'))).toBe(false)
})
