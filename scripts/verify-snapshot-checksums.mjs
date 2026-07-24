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
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const ontologyDir = resolve(here, '../static/ontology')
const ledgerPath = join(ontologyDir, 'snapshot-checksums.json')

const ONTOLOGY_FILES = [
  'sstim-core.ttl',
  'sstim-vocab.ttl',
  'sstim-shapes.ttl',
  'sstim-alignments.ttl',
  'sstim-patch-studio.ttl',
  'sstim-exposure.ttl',
  'sstim-ecosystem.ttl',
]

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function readLedger() {
  if (!existsSync(ledgerPath)) return {}
  return JSON.parse(readFileSync(ledgerPath, 'utf8'))
}

function writeLedger(ledger) {
  const ordered = Object.fromEntries(
    Object.entries(ledger).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  )
  writeFileSync(ledgerPath, `${JSON.stringify(ordered, null, 2)}\n`)
}

function hashVersionDir(version) {
  const dir = join(ontologyDir, version)
  if (!existsSync(dir)) {
    throw new Error(`static/ontology/${version}/ does not exist`)
  }
  const present = new Set(readdirSync(dir))
  const hashes = {}
  for (const file of ONTOLOGY_FILES) {
    if (!present.has(file)) continue
    hashes[file] = sha256(join(dir, file))
  }
  return hashes
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

  let problems = 0
  for (const version of versions) {
    let current
    try {
      current = hashVersionDir(version)
    } catch (error) {
      console.error(`verify-snapshot-checksums: DRIFT ${version}: ${error.message}`)
      problems += 1
      continue
    }
    const recorded = ledger[version]
    const files = new Set([...Object.keys(recorded), ...Object.keys(current)])
    for (const file of files) {
      if (!(file in current)) {
        console.error(`verify-snapshot-checksums: DRIFT ${version}/${file}: recorded but now missing`)
        problems += 1
      } else if (!(file in recorded)) {
        console.error(`verify-snapshot-checksums: DRIFT ${version}/${file}: present on disk but not recorded (re-run \`record ${version}\`?)`)
        problems += 1
      } else if (current[file] !== recorded[file]) {
        console.error(`verify-snapshot-checksums: DRIFT ${version}/${file}: sha256 no longer matches the recorded checksum`)
        problems += 1
      }
    }
  }

  if (problems) {
    console.error(`verify-snapshot-checksums: ${problems} drift issue(s) across ${versions.length} recorded version(s)`)
    process.exit(1)
  }
  console.log(`verify-snapshot-checksums: passed (${versions.length} recorded versions match their frozen files)`)
}

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
