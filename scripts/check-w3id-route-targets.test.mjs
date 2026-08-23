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
    'https://labiosyncare.github.io/ontology/instances/presets/heal-theta-breathing-seed.ttl',
  )
  expect(targets).toContain(
    'https://labiosyncare.github.io/ontology/instances/presets/perform-alpha-10-seed.ttl',
  )
  expect(targets).toContain(
    'https://labiosyncare.github.io/ontology/instances/references/references.ttl',
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
  const renamed = structuredClone(manifest)
  renamed.namespaceDocuments[0].runtime.turtleUrl = '/ontology/sstim-catalogue.ttl'

  const problems = unpublishableTargets({ htaccess, manifest: renamed })

  expect(problems.some((problem) => problem.includes('sstim-namespace.ttl'))).toBe(true)
})
