#!/usr/bin/env node
// Generate or check the exact w3id.org routes for immutable SSTIM snapshots.
//
// The public redirect inventory is deliberately fail-closed: a syntactically
// plausible version or filename must not acquire a persistent redirect until
// that exact artifact exists in static/ontology/<version>/.  Future modular
// snapshots add `manifest` and `manifest.schema.json` only when their frozen
// manifest.json and manifest.schema.json siblings are present.

import { existsSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..')
const ontologyDir = join(repoRoot, 'static', 'ontology')
const htaccessPath = join(repoRoot, 'docs', 'ecosystem', 'w3id', 'sstim', '.htaccess')

export const START = '# BEGIN generated exact SSTIM snapshot routes'
export const END = '# END generated exact SSTIM snapshot routes'

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

export function generatedRegion(inventory = snapshotInventory()) {
  const lines = [START]
  for (const snapshot of inventory) {
    const versionPattern = regexLiteral(snapshot.version)
    const filePattern = snapshot.turtle.map(regexLiteral).join('|')
    if (!snapshot.turtle.includes('sstim-core.ttl')) {
      throw new Error(`${snapshot.version}: frozen snapshot lacks sstim-core.ttl`)
    }
    const rootArtifact = snapshot.manifest ? MODULAR_ROOT_ARTIFACT : 'sstim-core.ttl'
    if (!snapshot.turtle.includes(rootArtifact)) {
      throw new Error(
        `${snapshot.version}: modular snapshot lacks ${MODULAR_ROOT_ARTIFACT}, so the ` +
        'version IRI would resolve to the Kernel module instead of the released ' +
        'ontology. Freeze the generated namespace catalogue into the snapshot, or ' +
        'decide and record a different whole-ontology release artifact.',
      )
    }
    if (filePattern) {
      lines.push(
        `RewriteRule ^${versionPattern}/(${filePattern})$ ` +
        `https://labiosyncare.github.io/ontology/${snapshot.version}/$1 [R=302,L]`,
      )
    }
    if (snapshot.manifest) {
      lines.push(
        `RewriteRule ^${versionPattern}/manifest$ ` +
        `https://labiosyncare.github.io/ontology/${snapshot.version}/manifest.json [R=302,L]`,
      )
    }
    if (snapshot.schema) {
      lines.push(
        `RewriteRule ^${versionPattern}/manifest\\.schema\\.json$ ` +
        `https://labiosyncare.github.io/ontology/${snapshot.version}/manifest.schema.json [R=302,L]`,
      )
    }
    lines.push(
      `RewriteRule ^${versionPattern}/?$ ` +
      `https://labiosyncare.github.io/ontology/${snapshot.version}/${rootArtifact} [R=302,L]`,
    )
  }
  lines.push(END)
  return lines.join('\n')
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
  const generated = generatedRegion()
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
    console.error('sstim-w3id-snapshot-routes: FAIL — generated snapshot route region is stale')
    console.error('Run `node scripts/sstim-w3id-snapshot-routes.mjs --write` after adding a frozen snapshot.')
    process.exit(1)
  }
  console.log(`sstim-w3id-snapshot-routes: PASS (${snapshotInventory().length} frozen snapshots)`)
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
