#!/usr/bin/env node
// Generate or check the w3id.org routes for immutable SSTIM snapshots.
//
// Until 0.15.0 this region enumerated every frozen file by name: 35 rules,
// four more per release, each needing its own pull request against
// perma-id/w3id.org. The w3id maintainer asked us to stop — davidlehn, on
// PR #6548: "If you have an ongoing pattern, you might want to consider using
// wildcard replacement patterns to avoid continuous updates here." ADR 0053
// records the decision and what it costs.
//
// What it costs is fail-closed routing. The enumerated region redirected only
// artifacts that existed, so w3id itself answered 404 for anything else; the
// wildcards redirect any version-shaped path and let GitHub Pages answer 404
// instead. The reader sees a 404 either way. What is genuinely lost is that
// w3id no longer proves the artifact exists, and the repository now owns that
// proof alone.
//
// So the guarantee is unchanged and the mechanism is stronger: every artifact
// this repository has ever frozen must resolve to the right URL, and that is
// now checked by *executing* the emitted rules against every frozen file
// rather than by regenerating their text and diffing it. Text equality only
// ever proved the generator agreed with itself.

import { existsSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..')
const ontologyDir = join(repoRoot, 'static', 'ontology')
const htaccessPath = join(repoRoot, 'docs', 'ecosystem', 'w3id', 'sstim', '.htaccess')

export const START = '# BEGIN generated SSTIM snapshot routes'
export const END = '# END generated SSTIM snapshot routes'

export const SITE = 'https://labiosyncare.github.io/ontology/'

const VERSION_RE = /^\d+\.\d+\.\d+$/

function semverParts(version) {
  return version.split('.').map(Number)
}

function compareSemver(a, b) {
  const left = semverParts(a)
  const right = semverParts(b)
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index]
  }
  return 0
}

function regexLiteral(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function snapshotInventory(directory = ontologyDir) {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && VERSION_RE.test(entry.name))
    .map((entry) => {
      const snapshotDirectory = join(directory, entry.name)
      const files = readdirSync(snapshotDirectory, { withFileTypes: true })
        .filter((file) => file.isFile())
        .map((file) => file.name)
        .sort()
      return {
        version: entry.name,
        turtle: files.filter((file) => file.endsWith('.ttl')),
        manifest: files.includes('manifest.json'),
        schema: files.includes('manifest.schema.json'),
      }
    })
    .sort((a, b) => compareSemver(a.version, b.version))
}

// The bare version route resolves `owl:versionIRI <https://w3id.org/sstim/x.y.z>`,
// so it must serve the whole released ontology. Before the manifest era
// sstim-core.ttl *was* that ontology. After ADR 0043 it is the two-class Kernel,
// and pointing a version IRI at it would answer a FAIR/registry client with a
// fraction of the release — worse than not resolving at all, which is the very
// failure ADR 0020 set out to avoid. A modular snapshot must therefore freeze a
// whole-ontology namespace catalogue for its version IRI to resolve to.
const MODULAR_ROOT_ARTIFACT = 'sstim-namespace.ttl'
const LEGACY_ROOT_ARTIFACT = 'sstim-core.ttl'

/**
 * The pre-modular snapshots, whose version IRI resolves to the Kernel file
 * because it was the whole ontology when they were frozen.
 *
 * This set is closed by construction: those directories are immutable and no
 * future release can be pre-modular, since `make snapshot` refuses a module set
 * without a manifest. It is derived from the inventory rather than hardcoded so
 * that there is one source of truth, not because it is expected to grow.
 */
export function legacyVersions(inventory = snapshotInventory()) {
  return inventory.filter((snapshot) => !snapshot.manifest).map((snapshot) => snapshot.version)
}

/** Assert the invariants the enumerated region used to enforce by construction. */
function assertSnapshotShape(snapshot) {
  if (!snapshot.turtle.includes(LEGACY_ROOT_ARTIFACT)) {
    throw new Error(`${snapshot.version}: frozen snapshot lacks ${LEGACY_ROOT_ARTIFACT}`)
  }
  const rootArtifact = snapshot.manifest ? MODULAR_ROOT_ARTIFACT : LEGACY_ROOT_ARTIFACT
  if (!snapshot.turtle.includes(rootArtifact)) {
    throw new Error(
      `${snapshot.version}: modular snapshot lacks ${MODULAR_ROOT_ARTIFACT}, so the ` +
      'version IRI would resolve to the Kernel module instead of the released ' +
      'ontology. Freeze the generated namespace catalogue into the snapshot, or ' +
      'decide and record a different whole-ontology release artifact.',
    )
  }
  return rootArtifact
}

export function generatedRegion(inventory = snapshotInventory()) {
  for (const snapshot of inventory) assertSnapshotShape(snapshot)

  const legacy = legacyVersions(inventory).map(regexLiteral).join('|')
  const lines = [START]

  if (legacy) {
    lines.push(
      '# Pre-modular snapshots, a closed set: their version IRI resolves to the',
      '# Kernel file, which was the whole ontology before ADR 0043 split it.',
      `RewriteRule ^(${legacy})/?$ ${SITE}$1/${LEGACY_ROOT_ARTIFACT} [R=302,L]`,
    )
  }
  lines.push(
    '# Every snapshot, including releases not yet cut. Four patterns rather than',
    '# four rules per release (ADR 0053).',
    `RewriteRule ^(\\d+\\.\\d+\\.\\d+)/(sstim-[a-z0-9-]+\\.ttl)$ ${SITE}$1/$2 [R=302,L]`,
    `RewriteRule ^(\\d+\\.\\d+\\.\\d+)/manifest$ ${SITE}$1/manifest.json [R=302,L]`,
    `RewriteRule ^(\\d+\\.\\d+\\.\\d+)/manifest\\.schema\\.json$ ${SITE}$1/manifest.schema.json [R=302,L]`,
    `RewriteRule ^(\\d+\\.\\d+\\.\\d+)/?$ ${SITE}$1/${MODULAR_ROOT_ARTIFACT} [R=302,L]`,
  )
  lines.push(END)
  return lines.join('\n')
}

/**
 * Parse `RewriteRule <pattern> <target> [flags]` lines out of a region.
 *
 * The simulation runs the rules that ship, not a second model of them. A
 * parallel reimplementation would drift from the file and pass while the file
 * was wrong, which is the failure this check exists to prevent.
 */
export function parseRules(region) {
  return region
    .split('\n')
    .filter((line) => line.startsWith('RewriteRule '))
    .map((line) => {
      const [, pattern, target] = line.split(/\s+/)
      return { pattern: new RegExp(pattern), target, source: line }
    })
}

/** Apply the rules in order, first match wins, as Apache does with [L]. */
export function resolvePath(path, rules) {
  for (const rule of rules) {
    const match = path.match(rule.pattern)
    if (!match) continue
    return rule.target.replace(/\$(\d)/g, (_, index) => match[Number(index)] ?? '')
  }
  return null
}

/**
 * Every file in every frozen snapshot must resolve to its own URL, and every
 * bare version IRI to the whole-ontology artifact for its era.
 */
export function simulate(inventory = snapshotInventory(), region = generatedRegion(inventory)) {
  const rules = parseRules(region)
  if (rules.length < 4) throw new Error(`parsed only ${rules.length} rules from the region`)
  const failures = []
  let checked = 0

  for (const snapshot of inventory) {
    const rootArtifact = assertSnapshotShape(snapshot)
    const expectations = snapshot.turtle.map((file) => [`${snapshot.version}/${file}`, `${SITE}${snapshot.version}/${file}`])
    if (snapshot.manifest) {
      expectations.push([`${snapshot.version}/manifest`, `${SITE}${snapshot.version}/manifest.json`])
    }
    if (snapshot.schema) {
      expectations.push([
        `${snapshot.version}/manifest.schema.json`,
        `${SITE}${snapshot.version}/manifest.schema.json`,
      ])
    }
    // Both spellings of the version IRI, with and without the trailing slash.
    for (const bare of [snapshot.version, `${snapshot.version}/`]) {
      expectations.push([bare, `${SITE}${snapshot.version}/${rootArtifact}`])
    }
    for (const [path, expected] of expectations) {
      checked += 1
      const actual = resolvePath(path, rules)
      if (actual !== expected) failures.push(`${path} → ${actual ?? 'no rule matched'} (expected ${expected})`)
    }
  }
  return { checked, failures, snapshots: inventory.length }
}

function replaceRegion(text, region) {
  if (text.split(START).length !== 2 || text.split(END).length !== 2) {
    throw new Error(`expected exactly one ${START} / ${END} region in ${htaccessPath}`)
  }
  const before = text.split(START, 1)[0]
  const after = text.split(END, 2)[1]
  return `${before}${region}${after}`
}

function main() {
  const option = process.argv[2] ?? '--check'
  const inventory = snapshotInventory()
  const generated = generatedRegion(inventory)
  if (option === '--print') {
    console.log(generated)
    return
  }
  if (!existsSync(htaccessPath)) throw new Error(`missing ${htaccessPath}`)
  const current = readFileSync(htaccessPath, 'utf8')
  const expected = replaceRegion(current, generated)
  if (option === '--write') {
    writeFileSync(htaccessPath, expected)
    console.log(`sstim-w3id-snapshot-routes: updated ${htaccessPath}`)
    return
  }
  if (option !== '--check') {
    throw new Error('usage: node scripts/sstim-w3id-snapshot-routes.mjs [--check|--print|--write]')
  }
  if (current !== expected) {
    console.error('sstim-w3id-snapshot-routes: FAIL — the snapshot route region is not what this script emits')
    console.error('Run `node scripts/sstim-w3id-snapshot-routes.mjs --write`.')
    process.exit(1)
  }
  // The region is checked against the rules actually committed in the file, so
  // a hand edit that survives the text comparison above still has to route
  // every frozen artifact correctly.
  const committedRegion = current.slice(current.indexOf(START), current.indexOf(END) + END.length)
  const { checked, failures, snapshots } = simulate(inventory, committedRegion)
  if (failures.length) {
    console.error(`sstim-w3id-snapshot-routes: FAIL — ${failures.length} frozen artifact(s) misroute`)
    for (const failure of failures.slice(0, 10)) console.error(`  ${failure}`)
    process.exit(1)
  }
  console.log(
    `sstim-w3id-snapshot-routes: PASS (${snapshots} frozen snapshots, ` +
    `${checked} paths routed by ${parseRules(committedRegion).length} rules)`,
  )
}

if (
  process.argv[1] &&
  realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))
) {
  try {
    main()
  } catch (error) {
    console.error(`sstim-w3id-snapshot-routes: FAIL — ${error.message}`)
    process.exit(1)
  }
}
