#!/usr/bin/env node
// Exercise the production SSTIM w3id.org rules against a candidate deployment
// without writing a second .htaccess or changing the live registry.
//
// The committed docs/ecosystem/w3id/sstim/.htaccess remains the sole routing
// authority. This module clones its parsed rules in memory and substitutes only
// the publication locations owned by this repository. Conditions, patterns,
// status codes, flags, capture-group references and external projection targets
// remain byte-for-byte unchanged.

import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadRules, resolveRoute } from './w3id-negotiation.mjs'

// The roles swapped at the W3ID cutover. Production is the Community Group
// project site; the origin-root deployment is what a rollback rehearsal
// retargets to, which is the remaining half of the rollback proof the migration
// report leaves open under its Pages-rollback step.
export const PRODUCTION_APPLICATION_BASE = 'https://w3c-cg.github.io/sstim/'
export const STAGED_APPLICATION_BASE = 'https://labiosyncare.github.io/'
export const LIVE_ECOSYSTEM_TARGET = 'https://biosyncare-lab.web.app/current.ttl'

// Four frozen manifests state root-absolute paths and therefore keep a route to
// the origin-root deployment whatever the live line does (ledger M-01). They are
// pinned, not merely un-migrated: a rehearsal must leave them where they are in
// both directions, or it would prove the wrong thing.
export const PINNED_ROOT_ONTOLOGY = 'https://labiosyncare.github.io/ontology/'

// A deliberate tripwire. Adding a W3ID rule is a public-contract change, so a
// changed category count should require someone to inspect and update this
// inventory rather than letting an unfamiliar target pass through silently.
// 2026-08-23: every hash namespace whose terms span more than one module now
// resolves HTML to the application, so a term fragment can select its term.
// exposure, vocab and ecosystem joined the bare namespace, which already
// pointed there. The rule count is unchanged: vocab's existing rule widened to
// cover ecosystem rather than a new one being added, so ontology 39 -> 37 and
// application 2 -> 4 on the same total of 75.
// shapes and core-shapes stay on the reference index: their terms are not
// drawable in the knowledge browser, so sending them there would select
// nothing.
// 2026-08-27, the W3ID cutover: every location moved from the origin-root
// deployment to the Community Group project site, and one rule was added to keep
// the four root-absolute frozen manifests resolvable where they are. Total
// 75 -> 76, with the new rule counted separately so that a second one could not
// appear unnoticed.
//
// 2026-08-27, the JSON Schema contracts: two application routes added for
// static/schemas/{preset,session}.schema.json, which carry those schemas' `$id`.
// A `$id` is an identity with no concrete counterpart (unlike a
// dcat:downloadURL, which pairs with an accessURL PURL beside it), so it is the
// one place a persistent URI replaces rather than duplicates. Total 76 -> 78,
// application 4 -> 6.
export const EXPECTED_RULE_COUNTS = Object.freeze({
  total: 78,
  ontology: 37,
  pinnedOntology: 1,
  graph: 16,
  application: 6,
  external: 2,
  statusOnly: 16,
})

export const BROWSER_ACCEPT =
  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'

/** Requests spanning every route family and the significant Accept edges. */
export const STAGED_REQUEST_MATRIX = Object.freeze([
  { label: 'namespace Turtle', path: '', accept: 'text/turtle', status: 303 },
  { label: 'namespace absent Accept', path: '', accept: '', status: 303 },
  { label: 'namespace wildcard', path: '', accept: '*/*', status: 303 },
  { label: 'namespace JSON-LD', path: '', accept: 'application/ld+json', status: 303 },
  { label: 'namespace RDF/XML', path: '', accept: 'application/rdf+xml', status: 303 },
  { label: 'namespace HTML', path: '', accept: BROWSER_ACCEPT, status: 303 },
  { label: 'namespace refused JSON-LD', path: '', accept: 'application/ld+json;q=0', status: 406 },
  { label: 'namespace unsupported', path: '', accept: 'application/n-triples', status: 406 },
  {
    label: 'q=0 does not poison JSON-LD',
    path: '',
    accept: 'application/ld+json, text/html;q=0',
    status: 303,
  },
  { label: 'Kernel Turtle', path: 'kernel', accept: 'text/turtle', status: 303 },
  { label: 'Kernel JSON-LD', path: 'kernel', accept: 'application/ld+json', status: 303 },
  { label: 'Kernel RDF/XML', path: 'kernel', accept: 'application/rdf+xml', status: 303 },
  { label: 'Kernel docs', path: 'kernel', accept: BROWSER_ACCEPT, status: 303 },
  { label: 'Exposure namespace', path: 'exposure', accept: 'text/turtle', status: 303 },
  { label: 'Exposure module', path: 'module/exposure', accept: 'text/turtle', status: 303 },
  { label: 'Stimulus module', path: 'stimulus', accept: 'application/ld+json', status: 303 },
  { label: 'Vocabulary docs', path: 'vocab', accept: BROWSER_ACCEPT, status: 303 },
  { label: 'Vocabulary Turtle', path: 'vocab', accept: 'text/turtle', status: 303 },
  { label: 'Shapes RDF/XML', path: 'shapes', accept: 'application/rdf+xml', status: 303 },
  { label: 'Core profile', path: 'profile/core', accept: 'text/turtle', status: 303 },
  { label: 'Full profile RDF/XML', path: 'profile/full', accept: 'application/rdf+xml', status: 303 },
  { label: 'Profile trailing slash stays closed', path: 'profile/core/', accept: BROWSER_ACCEPT, status: 404 },
  { label: 'Manifest', path: 'manifest', accept: 'application/json', status: 303 },
  { label: 'Manifest schema', path: 'manifest-schema/1', accept: '*/*', status: 303 },
  { label: 'VoID Turtle', path: 'void', accept: 'text/turtle', status: 303 },
  { label: 'VoID HTML', path: 'void', accept: BROWSER_ACCEPT, status: 303 },
  { label: 'VoID unsupported', path: 'void', accept: 'application/ld+json', status: 406 },
  {
    label: 'programme Graph deep link',
    path: 'ecosystem/biosyncare',
    accept: BROWSER_ACCEPT,
    status: 303,
  },
  {
    label: 'programme Turtle',
    path: 'ecosystem/biosyncare',
    accept: 'text/turtle',
    status: 303,
  },
  { label: 'framework Graph deep link', path: 'framework/bsc', accept: BROWSER_ACCEPT, status: 303 },
  { label: 'framework Turtle', path: 'framework/bsc', accept: 'text/turtle', status: 303 },
  {
    label: 'Patch Studio implementation deep link',
    path: 'implementation/bsclab/component/patch-studio',
    accept: BROWSER_ACCEPT,
    status: 303,
  },
  {
    label: 'preset Graph deep link',
    path: 'implementation/bsclab/preset/heal-theta-breathing-seed',
    accept: BROWSER_ACCEPT,
    status: 303,
  },
  {
    label: 'preset Turtle',
    path: 'implementation/bsclab/preset/heal-theta-breathing-seed',
    accept: 'text/turtle',
    status: 303,
  },
  {
    label: 'preset unsupported',
    path: 'implementation/bsclab/preset/heal-theta-breathing-seed',
    accept: 'application/ld+json',
    status: 406,
  },
  { label: 'reference Graph deep link', path: 'ref/INGENDOH_2023', accept: BROWSER_ACCEPT, status: 303 },
  { label: 'reference Turtle', path: 'ref/INGENDOH_2023', accept: '', status: 303 },
  {
    label: 'originated technique deep link',
    path: 'framework/bsc/technique/martigli-binaural-hybrid',
    accept: BROWSER_ACCEPT,
    status: 303,
  },
  {
    label: 'retired technique replacement deep link',
    path: 'framework/bsc/technique/binaural-beat-stimulation',
    accept: BROWSER_ACCEPT,
    status: 303,
  },
  {
    label: 'retired technique vocabulary',
    path: 'framework/bsc/technique/binaural-beat-stimulation',
    accept: 'text/turtle',
    status: 303,
  },
  {
    label: 'specialist two-capture Graph deep link',
    path: 'specialist/renato-fabbri',
    accept: BROWSER_ACCEPT,
    status: 303,
  },
  {
    label: 'specialist external Turtle projection',
    path: 'specialist/renato-fabbri',
    accept: 'text/turtle',
    status: 303,
  },
  {
    label: 'ecosystem record two-capture Graph deep link',
    path: 'ecosystem-record/role/curator-2026',
    accept: BROWSER_ACCEPT,
    status: 303,
  },
  {
    label: 'synthetic record excluded from HTML',
    path: 'specialist/synthetic-someone',
    accept: BROWSER_ACCEPT,
    status: 404,
  },
  {
    label: 'synthetic record excluded from RDF',
    path: 'specialist/synthetic-someone',
    accept: 'text/turtle',
    status: 404,
  },
  { label: 'legacy version IRI', path: '0.12.0', accept: 'text/turtle', status: 302 },
  { label: 'legacy frozen file', path: '0.12.0/sstim-core.ttl', accept: '*/*', status: 302 },
  { label: 'modular version IRI', path: '0.15.0/', accept: 'text/turtle', status: 302 },
  { label: 'version manifest', path: '0.16.0/manifest', accept: '*/*', status: 302 },
  {
    label: 'version manifest schema',
    path: '0.16.0/manifest.schema.json',
    accept: '*/*',
    status: 302,
  },
  {
    label: 'unknown version-shaped artifact delegates 404 to Pages',
    path: '0.99.0/sstim-nonexistent.ttl',
    accept: '*/*',
    status: 302,
    targetStatus: 404,
  },
  { label: 'non-version path stays closed', path: 'nonexistent', accept: 'text/turtle', status: 404 },
  { label: 'short version stays closed', path: '0.15/sstim-core.ttl', accept: '*/*', status: 404 },
  { label: 'v-prefixed version stays closed', path: 'v0.15.0/sstim-core.ttl', accept: '*/*', status: 404 },
  { label: 'nested snapshot path stays closed', path: '0.15.0/subdir/sstim-core.ttl', accept: '*/*', status: 404 },
  { label: 'case-mismatched snapshot stays closed', path: '0.15.0/SSTIM-Core.ttl', accept: '*/*', status: 404 },
])

function fail(message) {
  throw new Error(message)
}

/** Normalize an HTTP(S) deployment directory without accepting URL state. */
export function normalizeApplicationBase(value) {
  let url
  try {
    url = new URL(value)
  } catch {
    fail(`candidate application base is not an absolute URL: ${value}`)
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    fail(`candidate application base must use HTTP(S): ${value}`)
  }
  if (url.username || url.password || url.search || url.hash) {
    fail(`candidate application base must not contain credentials, query or fragment: ${value}`)
  }
  if (!url.pathname.endsWith('/')) url.pathname += '/'
  return url.href
}

/** One application mount and the two public subtrees targeted by W3ID. */
export function targetProfile(applicationBase) {
  const application = normalizeApplicationBase(applicationBase)
  return Object.freeze({
    application,
    ontology: new URL('ontology/', application).href,
    graph: new URL('graph/', application).href,
  })
}

export const PRODUCTION_TARGETS = targetProfile(PRODUCTION_APPLICATION_BASE)
export const STAGED_TARGETS = targetProfile(STAGED_APPLICATION_BASE)

/** Identify every target class; unfamiliar external locations fail closed. */
export function classifyTarget(target) {
  if (target === '-') return 'statusOnly'
  if (target.startsWith(PINNED_ROOT_ONTOLOGY)) return 'pinnedOntology'
  if (target.startsWith(PRODUCTION_TARGETS.ontology)) return 'ontology'
  if (target.startsWith(PRODUCTION_TARGETS.graph)) return 'graph'
  if (target.startsWith(PRODUCTION_TARGETS.application)) return 'application'
  if (target === LIVE_ECOSYSTEM_TARGET) return 'external'
  fail(`unclassified W3ID redirect target: ${target}`)
}

/** Retarget one production location without parsing or reserializing its suffix. */
export function retargetTarget(target, candidateBase = STAGED_APPLICATION_BASE) {
  const kind = classifyTarget(target)
  if (kind === 'statusOnly' || kind === 'external' || kind === 'pinnedOntology') return target

  const staged = targetProfile(candidateBase)
  const sourcePrefix = PRODUCTION_TARGETS[kind]
  return staged[kind] + target.slice(sourcePrefix.length)
}

/** Clone the authoritative rules and replace only their deployment locations. */
export function retargetRules(rules, candidateBase = STAGED_APPLICATION_BASE) {
  return rules.map((rule) => ({
    ...rule,
    conds: rule.conds.map((condition) => ({ ...condition })),
    target: retargetTarget(rule.target, candidateBase),
  }))
}

export function ruleCounts(rules) {
  const counts = { total: rules.length, ontology: 0, pinnedOntology: 0, graph: 0, application: 0, external: 0, statusOnly: 0 }
  for (const rule of rules) counts[classifyTarget(rule.target)] += 1
  return counts
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

/**
 * Prove the overlay is location-only and differential resolution is unchanged.
 * Returns the cloned staged rules for callers that need to exercise targets.
 */
export function validateStagedRules({
  productionRules = loadRules(),
  candidateBase = STAGED_APPLICATION_BASE,
  expectedCounts = EXPECTED_RULE_COUNTS,
  requests = STAGED_REQUEST_MATRIX,
} = {}) {
  const candidate = targetProfile(candidateBase)
  if (candidate.application === PRODUCTION_TARGETS.application) {
    fail('candidate application base must differ from the production deployment')
  }

  const counts = ruleCounts(productionRules)
  if (!sameJson(counts, expectedCounts)) {
    fail(`production rule inventory changed: ${JSON.stringify(counts)} (expected ${JSON.stringify(expectedCounts)})`)
  }

  const stagedRules = retargetRules(productionRules, candidate.application)
  if (stagedRules.length !== productionRules.length) fail('staged overlay changed the rule count')

  for (let index = 0; index < productionRules.length; index += 1) {
    const production = productionRules[index]
    const staged = stagedRules[index]
    if (staged.pattern !== production.pattern || staged.flags !== production.flags ||
        !sameJson(staged.conds, production.conds)) {
      fail(`staged overlay changed routing semantics at rule ${index + 1}`)
    }
    const expected = retargetTarget(production.target, candidate.application)
    if (staged.target !== expected) fail(`staged overlay misrouted rule ${index + 1}`)
    const kind = classifyTarget(production.target)
    if (['ontology', 'graph', 'application'].includes(kind) &&
        !staged.target.startsWith(candidate[kind])) {
      fail(`staged ${kind} target escaped the candidate mount: ${staged.target}`)
    }
  }

  for (const request of requests) {
    const production = resolveRoute(request.path, request.accept, productionRules)
    const staged = resolveRoute(request.path, request.accept, stagedRules)
    if (production.status !== request.status) {
      fail(`${request.label}: production status ${production.status}, expected ${request.status}`)
    }
    if (staged.status !== production.status) {
      fail(`${request.label}: staged status ${staged.status}, production status ${production.status}`)
    }
    const expectedLocation = production.location
      ? retargetTarget(production.location, candidate.application)
      : null
    if (staged.location !== expectedLocation) {
      fail(`${request.label}: staged location ${staged.location}, expected ${expectedLocation}`)
    }
  }

  return { productionRules, stagedRules, counts, candidate }
}

export function loadStagedRules(candidateBase = STAGED_APPLICATION_BASE) {
  return validateStagedRules({ candidateBase }).stagedRules
}

function main() {
  const args = process.argv.slice(2)
  const checkForm = args[0] === '--check'
  if (args[0] === '--write' || (checkForm ? args.length > 2 : args.length > 1) ||
      (args[0]?.startsWith('--') && !checkForm)) {
    fail('usage: node scripts/w3id-staged-routes.mjs [--check] [candidate-application-base]')
  }
  const candidateBase = args[0] === '--check' ? args[1] : args[0]
  const result = validateStagedRules({ candidateBase: candidateBase ?? STAGED_APPLICATION_BASE })
  console.log(
    `w3id-staged-routes: PASS (${result.counts.total} production rules; ` +
    `${result.counts.ontology + result.counts.graph + result.counts.application} ` +
    `locations staged at ${result.candidate.application}; production file untouched)`,
  )
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    main()
  } catch (error) {
    console.error(`w3id-staged-routes: FAIL — ${error.message}`)
    process.exit(1)
  }
}
