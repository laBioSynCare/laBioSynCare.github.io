// verify-snapshot-checksums.mjs — detect drift in frozen ontology snapshots.
//
//   node scripts/verify-snapshot-checksums.mjs            # verify (CI mode)
//   node scripts/verify-snapshot-checksums.mjs record <version>  # add a new
//                                                                  version's
//                                                                  checksums
//
// RDF-12 (2026-07-24 audit): "the snapshot tool refuses an existing directory
// by default... but has no CI check that historical directories still match
// release-tag checksums." static/ontology/<version>/ directories are supposed
// to be byte-identical, immutable copies of what was tagged and (for released
// versions) archived under a Zenodo DOI. Nothing previously caught silent
// drift in an already-published snapshot.
//
// static/ontology/snapshot-checksums.json is the ledger: one entry per
// version, each file mapped to its sha256. `record <version>` appends a new
// version's checksums (refusing to silently overwrite an already-recorded
// version — that would defeat the point). The default (no subcommand) mode
// re-hashes every recorded version's on-disk files and fails loudly on any
// mismatch or missing file, so CI catches drift in already-published
// snapshots, not just new ones.
//
// This script does not modify any snapshot's Turtle content — it only reads
// it and writes to the separate checksums ledger file.

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, readdirSync, existsSync, realpathSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const ontologyDir = resolve(here, '../static/ontology')
const ledgerPath = join(ontologyDir, 'snapshot-checksums.json')
const VERSION_RE = /^\d+\.\d+\.\d+$/

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

export function readLedger(path = ledgerPath) {
  if (!existsSync(path)) return {}
  return JSON.parse(readFileSync(path, 'utf8'))
}

function writeLedger(ledger) {
  const ordered = Object.fromEntries(
    Object.entries(ledger).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  )
  writeFileSync(ledgerPath, `${JSON.stringify(ordered, null, 2)}\n`)
}

export function hashVersionDir(version, directory = ontologyDir) {
  const dir = join(directory, version)
  if (!existsSync(dir)) {
    throw new Error(`static/ontology/${version}/ does not exist`)
  }
  // Historical snapshots contain different module sets. Hash what the frozen
  // directory actually publishes instead of comparing every release with a
  // hard-coded current inventory. This also makes an unrecorded module visible
  // as drift (0.12.0's stimulus file exposed the old list's blind spot).
  const present = readdirSync(dir)
    .filter((file) => file.endsWith('.ttl') || file === 'manifest.json' || file === 'manifest.schema.json')
    .sort()
  const hashes = {}
  for (const file of present) {
    hashes[file] = sha256(join(dir, file))
  }
  return hashes
}

export function snapshotDirectoryVersions(directory = ontologyDir) {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && VERSION_RE.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

// The ledger is the publication registry, not merely a list of directories to
// sample. Every semver-shaped snapshot directory must have one ledger entry,
// and every entry must have a directory. Otherwise an unregistered directory
// could evade this check and still acquire generated persistent routes.
export function snapshotVerificationProblems({
  directory = ontologyDir,
  ledger = readLedger(join(directory, 'snapshot-checksums.json')),
} = {}) {
  const problems = []
  if (!ledger || typeof ledger !== 'object' || Array.isArray(ledger)) {
    return ['snapshot checksum ledger root must be a JSON object']
  }

  const directoryVersions = snapshotDirectoryVersions(directory)
  const ledgerVersions = Object.keys(ledger)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  const directorySet = new Set(directoryVersions)
  const ledgerSet = new Set(ledgerVersions)

  for (const version of directoryVersions) {
    if (!ledgerSet.has(version)) {
      problems.push(`${version}: semver snapshot directory is present but unregistered in snapshot-checksums.json`)
    }
  }
  for (const version of ledgerVersions) {
    if (!VERSION_RE.test(version)) {
      problems.push(`${version}: checksum-ledger key is not a plain semantic version`)
    }
    if (!directorySet.has(version)) {
      problems.push(`${version}: checksum-ledger entry has no matching snapshot directory`)
    }
  }

  for (const version of ledgerVersions) {
    if (!VERSION_RE.test(version) || !directorySet.has(version)) continue
    const recorded = ledger[version]
    if (!recorded || typeof recorded !== 'object' || Array.isArray(recorded)) {
      problems.push(`${version}: checksum-ledger entry must be a file-to-sha256 object`)
      continue
    }

    let current
    try {
      current = hashVersionDir(version, directory)
    } catch (error) {
      problems.push(`${version}: ${error.message}`)
      continue
    }
    const files = new Set([...Object.keys(recorded), ...Object.keys(current)])
    for (const file of files) {
      if (!(file in current)) {
        problems.push(`${version}/${file}: recorded but now missing`)
      } else if (!(file in recorded)) {
        problems.push(`${version}/${file}: present on disk but not recorded`)
      } else if (current[file] !== recorded[file]) {
        problems.push(`${version}/${file}: sha256 no longer matches the recorded checksum`)
      }
    }
  }

  return problems
}

export function assertSnapshotLedger(options = {}) {
  const problems = snapshotVerificationProblems(options)
  if (problems.length) {
    throw new Error(`snapshot checksum ledger rejected the publication inventory:\n- ${problems.join('\n- ')}`)
  }
  return options.ledger ?? readLedger(join(options.directory ?? ontologyDir, 'snapshot-checksums.json'))
}

function record(version) {
  const ledger = readLedger()
  if (ledger[version]) {
    console.error(`verify-snapshot-checksums: ${version} is already recorded in ${ledgerPath}.`)
    console.error('Refusing to overwrite a recorded version\'s checksums — that would defeat the drift check.')
    console.error('If this snapshot was never published, remove its ledger entry by hand first.')
    process.exit(1)
  }
  ledger[version] = hashVersionDir(version)
  writeLedger(ledger)
  console.log(`verify-snapshot-checksums: recorded ${version} (${Object.keys(ledger[version]).length} files)`)
}

function verify() {
  const ledger = readLedger()
  const versions = Object.keys(ledger)
  if (!versions.length) {
    console.error('verify-snapshot-checksums: no recorded versions in the ledger; nothing to verify.')
    process.exit(1)
  }

  const problems = snapshotVerificationProblems({ directory: ontologyDir, ledger })

  if (problems.length) {
    for (const problem of problems) {
      console.error(`verify-snapshot-checksums: DRIFT ${problem}`)
    }
    console.error(`verify-snapshot-checksums: ${problems.length} drift issue(s) across ${versions.length} recorded version(s)`)
    process.exit(1)
  }
  console.log(`verify-snapshot-checksums: passed (${versions.length} recorded versions match their frozen files)`)
}

function main() {
  const [command, arg] = process.argv.slice(2)
  if (command === 'record') {
    if (!arg) {
      console.error('Usage: node scripts/verify-snapshot-checksums.mjs record <version>')
      process.exit(1)
    }
    record(arg)
  } else if (!command) {
    verify()
  } else {
    console.error(`Unknown command "${command}". Usage:
    node scripts/verify-snapshot-checksums.mjs            # verify recorded versions
    node scripts/verify-snapshot-checksums.mjs record <version>  # record a new version`)
    process.exit(1)
  }
}

if (
  process.argv[1] &&
  realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))
) {
  main()
}
