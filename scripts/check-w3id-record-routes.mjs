#!/usr/bin/env node
// Prove that every committed public record resolves at w3id.org (ADR 0065).
//
// The record routes are patterns, so check-w3id-route-targets.mjs cannot expand
// them into a list of targets the way it expands an alternation. This executes
// them instead, as sstim-w3id-snapshot-routes.mjs executes the snapshot
// patterns (ADR 0053), against every committed record:
//
//   - a browser is sent to that record's node in the knowledge browser;
//   - an RDF client is sent to a document that exists and describes the record,
//     its own committed file or its generated record document, and a format
//     the route does not serve is refused with 406;
//   - a name that is no committed record ends at a target nothing publishes,
//     so a route never lands on a file that seems to describe it, and a path
//     outside a family's grammar stays a 404 here;
//   - every w3id.org/sstim identifier the committed RDF mentions resolves, or
//     is listed below with the reason it does not. A family nobody routed
//     therefore fails here, not in a reader's browser, which is how 176
//     identifiers went unresolved for months without anything noticing.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Parser } from 'n3'

import { RECORD_PATTERNS } from './check-w3id-route-targets.mjs'
import { buildRecordDocuments, committedInstanceSources } from './gen-record-documents.mjs'
import { loadRules, resolveRoute } from './w3id-negotiation.mjs'
import { PRODUCTION_TARGETS, BROWSER_ACCEPT } from './w3id-staged-routes.mjs'
import { PREFIXES, SSTIM_IDENTIFIER_ROOT } from '../src/rdf/namespaces.js'
import {
  RECORD_FAMILIES,
  matchesRecordGrammar,
  recordDocumentPath,
  recordFamilyOf,
  recordIdentifier,
  recordLocalPath,
} from '../src/rdf/recordFamilies.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ONTOLOGY = join(ROOT, 'static', 'ontology')
const RDF_ACCEPTS = ['text/turtle', '', '*/*']

// Identifiers the committed RDF mentions that deliberately resolve nowhere.
// Each entry is a decision; an identifier that matches none of them fails.
export const UNROUTED_IDENTIFIERS = Object.freeze([
  {
    pattern: /(?:^|\/)synthetic-/,
    reason: 'synthetic fixture identifiers are reserved and never routed (ADR 0031)',
  },
  {
    pattern: /^graph\//,
    reason: 'named graphs: the loader fills them and VoID describes them as subsets of /sstim/void',
  },
  {
    pattern: /^private-shapes\//,
    reason: 'the access-controlled audit shapes, outside the public release by the manifest (ADR 0031)',
  },
])

// A name in each family that no committed record has. Each must end at a
// target nothing publishes, never at a document that exists.
export const ABSENT_RECORDS = Object.freeze({
  preset: 'implementation/bsclab/preset/not-a-committed-record',
  protocol: 'implementation/bsclab/protocol/not-a-committed-record',
  experiment: 'implementation/bsclab/experiment/not-a-committed-record',
  evidence: 'implementation/bsclab/evidence/not-a-committed-record/revision/1',
  reference: 'ref/NOT_A_COMMITTED_RECORD',
})

// Paths outside every family's grammar. These stay 404 at w3id.org itself.
export const CLOSED_PATHS = Object.freeze([
  'implementation/bsclab/preset/heal-theta-breathing-seed/voice',
  'implementation/bsclab/preset/Heal-Theta-Breathing-Seed',
  'implementation/bsclab/protocol/',
  'implementation/bsclab/evidence/',
  'implementation/bsclab/evidence/Alpha-Attention-Memory',
  'implementation/bsclab/session/synthetic-reference-001',
  'ref/ingendoh_2023',
  'ref/',
])

const identifierPath = identifier => identifier.slice(SSTIM_IDENTIFIER_ROOT.length)
const NAMESPACE = SSTIM_IDENTIFIER_ROOT.slice(0, -1)

/** The path w3id.org is asked for when an IRI is dereferenced: no fragment. */
export function requestPath(iri) {
  const document = iri.split('#')[0]
  if (document === NAMESPACE) return ''
  return document.startsWith(SSTIM_IDENTIFIER_ROOT) ? identifierPath(document) : null
}

function parse(path) {
  return new Parser().parse(readFileSync(path, 'utf8'))
}

/** Every committed record identifier, with the sources that describe it. */
export function recordInventory({ root = ROOT, sources = committedInstanceSources() } = {}) {
  const records = new Map()
  for (const source of sources) {
    for (const quad of parse(join(root, 'static', source))) {
      if (quad.subject.termType !== 'NamedNode' || !recordFamilyOf(quad.subject.value)) continue
      const identifier = recordIdentifier(quad.subject.value)
      const entry = records.get(identifier) ?? { identifier, sources: new Set() }
      entry.sources.add(source)
      records.set(identifier, entry)
    }
  }
  return [...records.values()].sort((a, b) => a.identifier.localeCompare(b.identifier))
}

/** Is `target` something the build publishes? A committed file or a record document. */
function isPublished(target, { root, documents }) {
  if (!target?.startsWith(PRODUCTION_TARGETS.ontology)) return false
  const path = target.slice(PRODUCTION_TARGETS.ontology.length)
  if (documents.has(path)) return true
  const committed = join(root, 'static', 'ontology', path)
  return existsSync(committed) && statSync(committed).isFile()
}

/** What is wrong with one committed record's routes, if anything. */
export function recordProblems(identifier, { rules, documents, root = ROOT }) {
  const problems = []
  const family = recordFamilyOf(identifier)
  const path = identifierPath(identifier)
  if (!matchesRecordGrammar(identifier)) {
    return [`${identifier} falls outside the ${family.id} grammar ${family.path}, so no route can match it`]
  }

  const browser = resolveRoute(path, BROWSER_ACCEPT, rules)
  const node = `${PRODUCTION_TARGETS.graph}#${family.prefix}:${recordLocalPath(identifier)}`
  if (browser.status !== 303 || browser.location !== node) {
    problems.push(`${identifier}: a browser gets ${browser.status} ${browser.location ?? ''}, not its graph node ${node}`)
  }

  const document = `${PRODUCTION_TARGETS.ontology}${recordDocumentPath(identifier)}`
  for (const accept of RDF_ACCEPTS) {
    const rdf = resolveRoute(path, accept, rules)
    if (rdf.status !== 303 || rdf.location !== document) {
      problems.push(`${identifier}: Accept "${accept}" gets ${rdf.status} ${rdf.location ?? ''}, not ${document}`)
    }
  }
  const refused = resolveRoute(path, 'application/ld+json', rules)
  if (refused.status !== 406) {
    problems.push(`${identifier}: an unserved format gets ${refused.status}, not 406`)
  }

  const relativePath = recordDocumentPath(identifier)
  const described = family.recordDocuments
    ? documents.get(relativePath)?.quads
    : existsSync(join(root, 'static', 'ontology', relativePath))
      ? parse(join(root, 'static', 'ontology', relativePath))
      : null
  if (!described) {
    problems.push(`${identifier}: ${relativePath} is not published`)
  } else if (!described.some(quad => quad.subject.value === identifier)) {
    problems.push(`${identifier}: ${relativePath} does not describe it`)
  }
  return problems
}

/** Every Turtle file the repository publishes from its working line. */
function committedRdfFiles(root) {
  const files = []
  const walk = directory => {
    for (const name of readdirSync(directory)) {
      const path = join(directory, name)
      if (statSync(path).isDirectory()) {
        // Frozen releases are immutable and proved by their own routes.
        if (!/^\d+\.\d+\.\d+$|^latest$/.test(name)) walk(path)
      } else if (name.endsWith('.ttl')) {
        files.push(path)
      }
    }
  }
  walk(join(root, 'static', 'ontology'))
  return files.sort()
}

/** Every w3id.org/sstim identifier the committed RDF mentions that resolves nowhere. */
export function unresolvedIdentifiers({ rules, root = ROOT }) {
  const mentioned = new Map()
  for (const file of committedRdfFiles(root)) {
    for (const quad of parse(file)) {
      for (const term of [quad.subject, quad.predicate, quad.object]) {
        const path = term.termType === 'NamedNode' ? requestPath(term.value) : null
        if (path !== null && !mentioned.has(path)) mentioned.set(path, relative(root, file))
      }
    }
  }
  const unresolved = []
  for (const [path, file] of mentioned) {
    if (resolveRoute(path, 'text/turtle', rules).status < 400) continue
    if (UNROUTED_IDENTIFIERS.some(({ pattern }) => pattern.test(path))) continue
    unresolved.push(`${SSTIM_IDENTIFIER_ROOT}${path} (first mentioned in ${file}) resolves nowhere`)
  }
  return { checked: mentioned.size, unresolved: unresolved.sort() }
}

/** Run every check; return the problems found and what was proved. */
export function checkRecordRoutes({ rules = loadRules(), root = ROOT } = {}) {
  const problems = []
  for (const family of RECORD_FAMILIES) {
    if (PREFIXES[family.prefix] !== family.base) {
      problems.push(`${family.prefix}: the graph cannot expand it back to ${family.base}`)
    }
  }

  // The target checker excuses exactly these patterns from expansion, on the
  // strength of this proof, so they must be the rules the proof executes.
  const patterns = new Set(rules.map(rule => rule.pattern.replace(/^\^/, '').replace(/\$$/, '')))
  for (const pattern of RECORD_PATTERNS) {
    if (!patterns.has(pattern)) problems.push(`no rule uses the exempted record pattern ${pattern}`)
  }
  for (const rule of rules) {
    const recordTarget = rule.target.startsWith(`${PRODUCTION_TARGETS.ontology}records/`) ||
      rule.target.startsWith(`${PRODUCTION_TARGETS.ontology}instances/$`)
    if (recordTarget && !RECORD_PATTERNS.has(rule.pattern.replace(/^\^/, '').replace(/\$$/, ''))) {
      problems.push(`${rule.pattern} routes to record documents but is not an exempted record pattern`)
    }
  }

  const documents = new Map(buildRecordDocuments({ root }).map(document => [document.path, document]))
  const records = recordInventory({ root })
  for (const { identifier } of records) problems.push(...recordProblems(identifier, { rules, documents, root }))

  for (const [family, path] of Object.entries(ABSENT_RECORDS)) {
    for (const accept of [...RDF_ACCEPTS, BROWSER_ACCEPT]) {
      const { status, location } = resolveRoute(path, accept, rules)
      if (status < 400 && isPublished(location, { root, documents })) {
        problems.push(`${family}: ${path} names no record but reaches the published ${location}`)
      }
    }
  }
  for (const path of CLOSED_PATHS) {
    for (const accept of [...RDF_ACCEPTS, BROWSER_ACCEPT]) {
      const { status } = resolveRoute(path, accept, rules)
      if (status !== 404) problems.push(`${path} is outside every record grammar but answers ${status}`)
    }
  }

  const { checked, unresolved } = unresolvedIdentifiers({ rules, root })
  problems.push(...unresolved)

  const byFamily = Object.groupBy(records, ({ identifier }) => recordFamilyOf(identifier).id)
  return { problems, records: records.length, byFamily, documents: documents.size, checked }
}

function main() {
  const { problems, records, byFamily, documents, checked } = checkRecordRoutes()
  if (problems.length) {
    console.error(`check-w3id-record-routes: FAIL (${problems.length} problem(s))`)
    for (const problem of problems) console.error(`  - ${problem}`)
    process.exit(1)
  }
  const families = RECORD_FAMILIES.map(family => `${byFamily[family.id]?.length ?? 0} ${family.id}`).join(', ')
  console.log(
    `check-w3id-record-routes: PASS (${records} committed records resolve: ${families}; ` +
    `${documents} generated record documents; ${checked} identifiers in committed RDF resolve or are ` +
    'unrouted on purpose)',
  )
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    main()
  } catch (error) {
    console.error(`check-w3id-record-routes: FAIL: ${error.message}`)
    process.exit(1)
  }
}
