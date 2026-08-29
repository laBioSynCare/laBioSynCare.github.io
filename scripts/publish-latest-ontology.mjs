// publish-latest-ontology.mjs: put the newest frozen release at a stable path.
//
//   node scripts/publish-latest-ontology.mjs [dist-ontology-dir]
//
// `https://w3id.org/sstim` is the ontology IRI, so what it returns to an RDF
// client has to be a citable release rather than whatever the working tree
// happens to hold. Before ADR 0055 it returned the working tree: the served
// namespace document declared `owl:versionInfo "0.17.0-dev"`, `mod:status
// "under development"`, and no `owl:versionIRI` at all, which is a graph a
// consumer can neither pin nor cite, and which LOV and Archivo would have
// archived as SSTIM.
//
// Pointing the w3id rules at a *versioned* path would fix that and cost a pull
// request against a repository we do not own on every single release, which is
// exactly what ADR 0053 removed at the w3id maintainer's request. So the rules
// point at `latest/`, and this script is what makes `latest/` true.
//
// It writes into `dist/` only, never into `static/`. That is not tidiness: a
// committed copy could drift from the snapshot it claims to mirror, and then the
// ontology IRI would quietly serve the wrong release. Deriving it on every build
// removes the failure mode instead of adding a gate to catch it. Same posture as
// the generated reference documentation (ADR 0023) and the RDF exports beside it.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const STATIC_ONTOLOGY = join(REPO_ROOT, 'static', 'ontology')
const RELEASE_METADATA = join(REPO_ROOT, 'src', 'ui', 'entrance', 'releaseMetadata.js')

const RELEASE_DIR = /^(\d+)\.(\d+)\.(\d+)$/

/** Every frozen release directory, newest first. */
export function releaseDirectories(ontologyDir = STATIC_ONTOLOGY) {
  return readdirSync(ontologyDir)
    .map((name) => ({ name, match: RELEASE_DIR.exec(name) }))
    .filter(({ name, match }) => match && statSync(join(ontologyDir, name)).isDirectory())
    .map(({ name, match }) => ({ name, parts: match.slice(1, 4).map(Number) }))
    .sort((a, b) =>
      b.parts[0] - a.parts[0] || b.parts[1] - a.parts[1] || b.parts[2] - a.parts[2])
    .map(({ name }) => name)
}

/**
 * The release the application tells the world it is on.
 *
 * `releaseMetadata.js` is already the single source for that number and is
 * cross-checked against void.ttl and CITATION.cff by `make truth-audit`. Reading
 * it here means a release that snapshots 0.17.0 but forgets to update the module
 * fails the build rather than silently publishing 0.16.0 from the ontology IRI.
 */
export function declaredRelease(metadataPath = RELEASE_METADATA) {
  const text = readFileSync(metadataPath, 'utf8')
  const match = /export const RELEASE_VERSION = '([^']+)'/.exec(text)
  if (!match) throw new Error('publish-latest-ontology: RELEASE_VERSION not found in releaseMetadata.js')
  return match[1]
}

export function publishLatest({
  ontologyDir = STATIC_ONTOLOGY,
  distOntologyDir,
  metadataPath = RELEASE_METADATA,
} = {}) {
  const releases = releaseDirectories(ontologyDir)
  if (!releases.length) throw new Error(`publish-latest-ontology: no frozen release under ${ontologyDir}`)

  const newest = releases[0]
  const declared = declaredRelease(metadataPath)
  if (newest !== declared) {
    throw new Error(
      `publish-latest-ontology: the newest snapshot is ${newest} but the application ` +
      `declares ${declared}. One of the two was not updated by the release; publishing ` +
      'either would make https://w3id.org/sstim disagree with the site about what SSTIM is.',
    )
  }

  const source = join(ontologyDir, newest)
  // Pre-modular snapshots (0.1.0 through 0.12.0) predate the manifest and their
  // w3id rules resolve a bare version IRI to the Kernel file instead. They can
  // never become `latest/` in practice (releases only move forward), but the
  // check is cheap and the failure would be silent.
  if (!existsSync(join(source, 'manifest.json'))) {
    throw new Error(
      `publish-latest-ontology: snapshot ${newest} has no manifest.json, so it predates ` +
      'the modular split and cannot be published as latest/',
    )
  }

  const target = join(distOntologyDir, 'latest')
  rmSync(target, { recursive: true, force: true })
  mkdirSync(dirname(target), { recursive: true })
  cpSync(source, target, { recursive: true })

  const files = readdirSync(target).length
  return { version: newest, source, target, files }
}

/**
 * Confirm the export step left the frozen Turtle alone.
 *
 * `export-ontology.py` regenerates the namespace catalogues on its way past, and
 * it builds them by concatenating module masters exactly as `make snapshot`
 * does. Measured 2026-08-29 the two agree byte for byte. They agree because two
 * implementations were deliberately kept in step, which is the kind of agreement
 * that stops being true without anyone noticing, and the result would be a
 * `latest/` that differs from the snapshot it claims to be while both call
 * themselves the same release. So check rather than assume.
 */
export function verifyLatest({
  ontologyDir = STATIC_ONTOLOGY,
  distOntologyDir,
  metadataPath = RELEASE_METADATA,
} = {}) {
  const target = join(distOntologyDir, 'latest')
  if (!existsSync(target)) throw new Error(`publish-latest-ontology: ${target} does not exist`)

  const version = declaredRelease(metadataPath)
  const source = join(ontologyDir, version)
  const drifted = readdirSync(source)
    .filter((name) => name.endsWith('.ttl') || name === 'manifest.json')
    .filter((name) => {
      const published = join(target, name)
      if (!existsSync(published)) return true
      return !readFileSync(published).equals(readFileSync(join(source, name)))
    })

  if (drifted.length) {
    throw new Error(
      `publish-latest-ontology: ${drifted.length} published file(s) differ from the frozen ` +
      `${version} snapshot: ${drifted.join(', ')}. latest/ must be that release byte for byte.`,
    )
  }
  return { version, checked: readdirSync(source).filter((n) => n.endsWith('.ttl')).length }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  const verify = args.includes('--verify')
  const positional = args.filter((arg) => !arg.startsWith('--'))
  const distOntologyDir = resolve(positional[0] ?? join(REPO_ROOT, 'dist', 'ontology'))
  try {
    if (verify) {
      const { version, checked } = verifyLatest({ distOntologyDir })
      console.log(`publish-latest-ontology: latest/ is ${version}, ${checked} Turtle file(s) unchanged`)
    } else {
      const { version, target, files } = publishLatest({ distOntologyDir })
      console.log(`publish-latest-ontology: ${version} published as ${target} (${files} files)`)
    }
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}
