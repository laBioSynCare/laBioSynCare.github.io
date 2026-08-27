import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

import { routeTargets } from './check-w3id-route-targets.mjs'
import { snapshotInventory } from './sstim-w3id-snapshot-routes.mjs'
import { loadRules, resolveRoute } from './w3id-negotiation.mjs'
import { smokeStagedTargets } from './w3id-staged-smoke.mjs'
import {
  EXPECTED_RULE_COUNTS,
  LIVE_ECOSYSTEM_TARGET,
  PRODUCTION_TARGETS,
  STAGED_APPLICATION_BASE,
  STAGED_REQUEST_MATRIX,
  STAGED_TARGETS,
  classifyTarget,
  normalizeApplicationBase,
  retargetRules,
  retargetTarget,
  ruleCounts,
  validateStagedRules,
} from './w3id-staged-routes.mjs'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const htaccess = readFileSync(
  join(repoRoot, 'docs', 'ecosystem', 'w3id', 'sstim', '.htaccess'),
  'utf8',
)
const productionRules = loadRules()

test('the staged profile is an in-memory overlay over the production rules', () => {
  const { stagedRules, counts, candidate } = validateStagedRules({ productionRules })

  expect(counts).toEqual(EXPECTED_RULE_COUNTS)
  expect(candidate).toEqual(STAGED_TARGETS)
  expect(stagedRules).toHaveLength(productionRules.length)
  // The proposed location must never be copied into the production registry
  // source merely to make a staging test possible. Since the cutover the
  // rollback base does appear, but only as the deliberate pin for the four
  // frozen manifests that state root-absolute paths — so assert the count, not
  // its absence, or the guard would have to be deleted to accommodate them.
  const rollbackOccurrences = htaccess.split(STAGED_APPLICATION_BASE).length - 1
  expect(rollbackOccurrences).toBe(1)
  expect(htaccess).toContain(`${STAGED_APPLICATION_BASE}ontology/$1/manifest.json`)

  for (let index = 0; index < productionRules.length; index += 1) {
    const production = productionRules[index]
    const staged = stagedRules[index]
    expect(staged.pattern).toBe(production.pattern)
    expect(staged.conds).toEqual(production.conds)
    expect(staged.conds).not.toBe(production.conds)
    expect(staged.flags).toBe(production.flags)
    expect(staged.target).toBe(retargetTarget(production.target))
  }
})

test('every production target belongs to an explicit reviewed category', () => {
  expect(ruleCounts(productionRules)).toEqual({
    total: 76,
    ontology: 37,
    graph: 16,
    application: 4,
    external: 2,
    pinnedOntology: 1,
    statusOnly: 16,
  })
  expect(productionRules.filter(({ target }) => classifyTarget(target) === 'external'))
    .toHaveLength(2)
  expect(productionRules.filter(({ target }) => target === LIVE_ECOSYSTEM_TARGET))
    .toHaveLength(2)
  expect(() => classifyTarget('https://unreviewed.example.test/resource'))
    .toThrow(/unclassified W3ID redirect target/)
})

test('publication, graph and project targets keep their exact suffix', () => {
  expect(retargetTarget('https://w3c-cg.github.io/sstim/'))
    .toBe('https://labiosyncare.github.io/')
  expect(retargetTarget('https://w3c-cg.github.io/sstim/ontology/sstim-$1-profile.rdf'))
    .toBe('https://labiosyncare.github.io/ontology/sstim-$1-profile.rdf')
  expect(retargetTarget('https://w3c-cg.github.io/sstim/graph/#sstim-$1:$2'))
    .toBe('https://labiosyncare.github.io/graph/#sstim-$1:$2')
  expect(retargetTarget(LIVE_ECOSYSTEM_TARGET)).toBe(LIVE_ECOSYSTEM_TARGET)
  expect(retargetTarget('-')).toBe('-')
})

test('the candidate base is normalized once and unsafe URL state is rejected', () => {
  expect(normalizeApplicationBase('https://labiosyncare.github.io'))
    .toBe(STAGED_APPLICATION_BASE)
  expect(retargetTarget(
    'https://w3c-cg.github.io/sstim/ontology/sstim-core.ttl',
    'http://127.0.0.1:4173/sstim',
  )).toBe('http://127.0.0.1:4173/sstim/ontology/sstim-core.ttl')
  expect(() => normalizeApplicationBase('/sstim/')).toThrow(/absolute URL/)
  expect(() => normalizeApplicationBase('file:///tmp/sstim/')).toThrow(/HTTP\(S\)/)
  expect(() => normalizeApplicationBase('https://example.test/sstim/?preview=1'))
    .toThrow(/query or fragment/)
  expect(() => validateStagedRules({ productionRules, candidateBase: PRODUCTION_TARGETS.application }))
    .toThrow(/must differ/)
})

test('all expanded ontology targets preserve their publication-relative path', () => {
  const production = [...new Set(routeTargets(htaccess)
    .filter((target) => target.startsWith(PRODUCTION_TARGETS.ontology)))]
  const staged = production.map((target) => retargetTarget(target))

  // 93 since 2026-08-23: /ontology/docs/vocab/ was this set's only sole-owner
  // target, and vocab's HTML moved to the application.
  expect(production).toHaveLength(93)
  expect(staged.map((target) => target.slice(STAGED_TARGETS.ontology.length)))
    .toEqual(production.map((target) => target.slice(PRODUCTION_TARGETS.ontology.length)))
  expect(staged.every((target) => target.startsWith(STAGED_TARGETS.ontology))).toBe(true)
})

test('the full staged request matrix is resolution-equivalent to production', () => {
  const stagedRules = retargetRules(productionRules)

  for (const request of STAGED_REQUEST_MATRIX) {
    const production = resolveRoute(request.path, request.accept, productionRules)
    const staged = resolveRoute(request.path, request.accept, stagedRules)
    expect(production.status, request.label).toBe(request.status)
    expect(staged.status, request.label).toBe(production.status)
    expect(staged.location, request.label).toBe(
      production.location ? retargetTarget(production.location) : null,
    )
  }

  expect(resolveRoute('specialist/renato-fabbri', 'text/html', stagedRules).location)
    .toBe('https://labiosyncare.github.io/graph/#sstim-specialist:renato-fabbri')
  expect(resolveRoute('ecosystem-record/role/curator-2026', 'text/html', stagedRules).location)
    .toBe('https://labiosyncare.github.io/graph/#sstim-ecosystem-record:role/curator-2026')
})

test('every frozen release path is retargeted without changing snapshot semantics', () => {
  const inventory = snapshotInventory()
  const stagedRules = retargetRules(productionRules)
  let checked = 0

  for (const snapshot of inventory) {
    const root = snapshot.manifest ? 'sstim-namespace.ttl' : 'sstim-core.ttl'
    const paths = snapshot.turtle.map((file) => `${snapshot.version}/${file}`)
    if (snapshot.manifest) paths.push(`${snapshot.version}/manifest`)
    if (snapshot.schema) paths.push(`${snapshot.version}/manifest.schema.json`)
    paths.push(snapshot.version, `${snapshot.version}/`)

    for (const path of paths) {
      const production = resolveRoute(path, '*/*', productionRules)
      const staged = resolveRoute(path, '*/*', stagedRules)
      expect(production.status, path).toBe(302)
      expect(staged.status, path).toBe(302)
      expect(staged.location, path).toBe(retargetTarget(production.location))
      checked += 1
    }

    expect(resolveRoute(snapshot.version, '*/*', stagedRules).location)
      .toBe(`${STAGED_TARGETS.ontology}${snapshot.version}/${root}`)
  }

  expect(inventory).toHaveLength(15)
  expect(checked).toBe(204)
})

test('the live smoke checks candidate targets while skipping the external projection', async () => {
  const requests = [
    { label: 'project HTML', path: '', accept: 'text/html', status: 303 },
    {
      label: 'Graph fragment',
      path: 'framework/bsc',
      accept: 'text/html',
      status: 303,
    },
    {
      label: 'unknown snapshot delegates its 404',
      path: '0.99.0/sstim-nonexistent.ttl',
      accept: '*/*',
      status: 302,
      targetStatus: 404,
    },
    {
      label: 'live projection remains external',
      path: 'specialist/renato-fabbri',
      accept: 'text/turtle',
      status: 303,
    },
  ]
  const fetched = []
  const fetchImpl = async (input) => {
    const url = new URL(input)
    fetched.push(url)
    if (url.pathname.endsWith('/ontology/0.99.0/sstim-nonexistent.ttl')) {
      return {
        status: 404,
        url: url.href,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: async () => 'not found',
      }
    }
    return {
      status: 200,
      url: url.href,
      headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
      text: async () => '<!doctype html><html><title>SSTIM</title></html>',
    }
  }

  const result = await smokeStagedTargets(STAGED_APPLICATION_BASE, { fetchImpl, requests })

  expect(result.failures).toEqual([])
  expect(result.checked).toBe(3)
  expect(result.externalSkipped).toBe(1)
  expect(result.fragments).toBe(1)
  // The candidate is now the origin-root rollback deployment, so the assertion
  // is on the host rather than on a mount prefix the rollback does not have.
  expect(fetched.every((url) => `${url.origin}/` === STAGED_APPLICATION_BASE)).toBe(true)
  expect(fetched.every((url) => url.searchParams.has('w3id-stage-check'))).toBe(true)
})
