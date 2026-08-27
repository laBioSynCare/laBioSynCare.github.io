#!/usr/bin/env node
// Prove that every w3id.org redirect target under /ontology/ is an artifact this
// repository actually publishes.
//
// The persistent routes are the public contract, but they live in a file that
// Apache never validates against the build. Modularization multiplied them from
// a handful to ~50 and introduced generated artifacts (per-module JSON-LD and
// RDF/XML serializations, namespace catalogues) that exist only after
// `make export`. A renamed module, a dropped export flag, or a hand-edited rule
// therefore turns a persistent identifier into a 404 with nothing to catch it.
//
// A target is publishable when it is a committed file under static/ontology/, a
// manifest-declared export serialization, a manifest-declared namespace
// document, or generated reference documentation.

import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..')
const ontologyDir = join(repoRoot, 'static', 'ontology')
const htaccessPath = join(repoRoot, 'docs', 'ecosystem', 'w3id', 'sstim', '.htaccess')
const manifestPath = join(ontologyDir, 'manifest.json')

// Two, not one: the live line moved to the Community Group project site, while
// four frozen manifests keep a route to the origin-root deployment because their
// own contents state root-absolute paths (ledger M-01). Both publish the same
// static/ontology tree, so a target under either prefix is checked identically.
const SITE_PREFIXES = [
  'https://w3c-cg.github.io/sstim/ontology/',
  'https://labiosyncare.github.io/ontology/',
]

const sitePrefixOf = (target) => SITE_PREFIXES.find((prefix) => target.startsWith(prefix))
// Directory indexes produced by WIDOCO and pyLODE in the Pages workflow.
const GENERATED_DIRECTORIES = new Set(['', 'docs/', 'docs/vocab/'])
const EXPORT_EXTENSIONS = ['.jsonld', '.rdf']

function unescapeRegex(value) {
  return value.replace(/\\(.)/g, '$1')
}

// Expand `$1` in a redirect target against the alternation captured by its rule.
export function expandRule(pattern, target) {
  if (!target.includes('$1')) return [target]
  const group = pattern.match(/\(([^)]*)\)/)
  if (!group) {
    throw new Error(`rule target uses $1 but its pattern has no capture group: ${pattern}`)
  }
  return group[1]
    .split('|')
    .map((alternative) => target.replace('$1', unescapeRegex(alternative)))
}

// A rule whose version is a wildcard cannot be expanded into a file list: it
// deliberately routes releases that do not exist yet (ADR 0053). Those rules are
// proved instead by `sstim-w3id-snapshot-routes.mjs --check`, which executes
// them against every file in every frozen snapshot. The token is matched
// exactly, so this skips the version wildcard and nothing else — a hand-written
// rule with a different loose pattern still has to name a publishable target.
const VERSION_WILDCARD = '(\\d+\\.\\d+\\.\\d+)'

export function routeTargets(htaccess) {
  const targets = []
  const ruleRe = /^RewriteRule\s+\^(\S*)\$\s+(\S+)\s+\[/gm
  let match
  while ((match = ruleRe.exec(htaccess)) !== null) {
    const [, pattern, target] = match
    // `- [R=406,L]` is the deliberate not-acceptable fallthrough, not a document.
    if (target === '-') continue
    if (pattern.startsWith(VERSION_WILDCARD)) continue
    targets.push(...expandRule(pattern, target))
  }
  return targets
}

function publishableArtifacts(manifest) {
  const artifacts = new Set(['manifest.json', 'manifest.schema.json'])
  const exportable = [
    ...manifest.modules.filter((module) => module.release?.export),
    ...manifest.profiles.filter((profile) => profile.release?.export),
  ]
  for (const entry of exportable) {
    const base = entry.source.path.split('/').pop().replace(/\.ttl$/, '')
    for (const extension of EXPORT_EXTENSIONS) artifacts.add(`${base}${extension}`)
  }
  for (const document of manifest.namespaceDocuments ?? []) {
    for (const url of Object.values(document.runtime ?? {})) {
      artifacts.add(url.split('/').pop())
    }
  }
  return artifacts
}

export function unpublishableTargets({ htaccess, manifest, ontologyRoot = ontologyDir }) {
  const generated = publishableArtifacts(manifest)
  const problems = []
  for (const target of new Set(routeTargets(htaccess))) {
    const prefix = sitePrefixOf(target)
    if (!prefix) continue
    const relative = target.slice(prefix.length)
    if (GENERATED_DIRECTORIES.has(relative)) continue
    if (generated.has(relative)) continue
    const committed = join(ontologyRoot, relative)
    if (existsSync(committed) && statSync(committed).isFile()) continue
    problems.push(
      `${target} is neither a committed static/ontology file nor a ` +
      'manifest-declared export or namespace document',
    )
  }
  return problems.sort()
}

function main() {
  const htaccess = readFileSync(htaccessPath, 'utf8')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const problems = unpublishableTargets({ htaccess, manifest })
  if (problems.length) {
    console.error(`check-w3id-route-targets: FAIL (${problems.length} unpublishable target(s))`)
    for (const problem of problems) console.error(`  - ${problem}`)
    process.exit(1)
  }
  const total = new Set(routeTargets(htaccess).filter(sitePrefixOf)).size
  console.log(`check-w3id-route-targets: PASS (${total} distinct /ontology/ targets publishable)`)
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))
) {
  try {
    main()
  } catch (error) {
    console.error(`check-w3id-route-targets: FAIL — ${error.message}`)
    process.exit(1)
  }
}
