// snapshot-ontology.mjs — freeze the current ontology files as an immutable,
// citable version snapshot.
//
//   node scripts/snapshot-ontology.mjs [version] [--force]
//
// Copies the live ontology Turtle files from static/ontology/*.ttl verbatim
// (byte-identical) into static/ontology/<version>/, so the URL promised by
// `owl:versionIRI <https://w3id.org/sstim/<version>>` resolves to a frozen copy
// that never changes even as the top-level files keep evolving.
//
// `version` defaults to the `owl:versionInfo` string declared in sstim-core.ttl.
// The static adapter copies static/ → dist/ verbatim, so the snapshot is served
// at https://labiosyncare.github.io/ontology/<version>/sstim-core.ttl and, once
// the w3id rules are live, at https://w3id.org/sstim/<version>/sstim-core.ttl.
//
// Existing snapshots are protected by default. Use --force only to correct a
// snapshot that was never published. Cutting a real new release means bumping
// owl:versionInfo / owl:versionIRI first, then snapshotting the new number.
//
// Release-readiness checks (improvement plan 0.3, audit KR-14): a snapshot is
// refused unless the version is a plain release (no -dev/prerelease suffix),
// every module declares that same owl:versionInfo, and sstim-core.ttl carries
// the matching owl:versionIRI and mod:status "released".

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..')
const ontologyDir = resolve(here, '../static/ontology')

// The reusable ontology artifact = the term-space files only. Instances under
// static/ontology/instances/ are implementation data, not part of the versioned
// ontology, so they are intentionally not snapshotted here.
const ONTOLOGY_FILES = [
  'sstim-core.ttl',
  'sstim-vocab.ttl',
  'sstim-shapes.ttl',
  'sstim-alignments.ttl',
  'sstim-patch-studio.ttl',
  'sstim-exposure.ttl',
  'sstim-ecosystem.ttl',
]

function declaredVersion() {
  const core = readFileSync(join(ontologyDir, 'sstim-core.ttl'), 'utf8')
  const match = core.match(/owl:versionInfo\s+"([^"]+)"/)
  if (!match) {
    throw new Error('Could not read owl:versionInfo from sstim-core.ttl')
  }
  return match[1]
}

// Pure release-readiness check, exported for unit tests. `files` maps module
// file names to their Turtle text; returns a list of human-readable problems
// (empty when the set is ready to snapshot as `version`).
export function releaseProblems({ version, files }) {
  const problems = []
  if (version.includes('-')) {
    problems.push(`"${version}" is a development/prerelease version; snapshots are cut only from plain release versions`)
  }
  for (const file of ONTOLOGY_FILES) {
    const text = files.get(file)
    if (typeof text !== 'string') {
      problems.push(`${file}: module file is missing`)
      continue
    }
    const match = text.match(/owl:versionInfo\s+"([^"]+)"/)
    if (!match) {
      problems.push(`${file}: missing owl:versionInfo`)
    } else if (match[1] !== version) {
      problems.push(`${file}: owl:versionInfo "${match[1]}" does not match snapshot version "${version}"`)
    }
  }
  const core = files.get('sstim-core.ttl') ?? ''
  if (!core.includes(`owl:versionIRI <https://w3id.org/sstim/${version}>`)) {
    problems.push(`sstim-core.ttl: missing owl:versionIRI <https://w3id.org/sstim/${version}>`)
  }
  if (!/mod:status\s+"released"/.test(core)) {
    problems.push('sstim-core.ttl: mod:status must be "released" at snapshot time')
  }
  return problems
}

function liveModuleFiles() {
  const files = new Map()
  for (const file of ONTOLOGY_FILES) {
    files.set(file, readFileSync(join(ontologyDir, file), 'utf8'))
  }
  return files
}

function sourceCommit() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot }).toString().trim()
  } catch {
    return 'uncommitted'
  }
}

function usage() {
  console.log(`Usage: node scripts/snapshot-ontology.mjs [version] [--force]

Copies static/ontology/*.ttl into static/ontology/<version>/.

Options:
  --force   Overwrite an existing snapshot directory. Use only before publish.
  -h, --help
            Show this help.
`)
}

function parseArgs(argv) {
  let version = null
  let force = false

  for (const arg of argv) {
    if (arg === '--force') {
      force = true
    } else if (arg === '-h' || arg === '--help') {
      usage()
      process.exit(0)
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option "${arg}"`)
    } else if (!version) {
      version = arg
    } else {
      throw new Error(`Unexpected extra argument "${arg}"`)
    }
  }

  return { version: version ?? declaredVersion(), force }
}

function dirtyOntologyFiles() {
  try {
    const sourcePaths = ONTOLOGY_FILES.map((file) => join('static/ontology', file))
    const out = execFileSync('git', ['status', '--porcelain', '--', ...sourcePaths], { cwd: repoRoot })
      .toString()
      .trim()
    return out ? out.split(/\r?\n/) : []
  } catch {
    return []
  }
}

function main() {
  let options
  try {
    options = parseArgs(process.argv.slice(2))
  } catch (error) {
    console.error(error.message)
    usage()
    process.exit(1)
  }

  const { version, force } = options
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) {
    console.error(`Refusing to snapshot non-semver version "${version}".`)
    process.exit(1)
  }

  const problems = releaseProblems({ version, files: liveModuleFiles() })
  if (problems.length) {
    console.error(`Refusing to snapshot: the module set is not release-ready as "${version}":`)
    for (const problem of problems) console.error(`  - ${problem}`)
    console.error('Bump owl:versionInfo across all modules, set owl:versionIRI and')
    console.error('mod:status "released" in sstim-core.ttl, then snapshot.')
    process.exit(1)
  }

  const outDir = join(ontologyDir, version)
  const existingFiles = existsSync(outDir) ? readdirSync(outDir).filter((f) => f !== '.DS_Store') : []
  if (existingFiles.length && !force) {
    console.error(`Refusing to overwrite existing snapshot static/ontology/${version}/.`)
    console.error('Use --force only if this snapshot has not been published.')
    process.exit(1)
  }

  const dirty = dirtyOntologyFiles()
  if (dirty.length) {
    console.error('Refusing to snapshot while source ontology files have uncommitted changes:')
    for (const line of dirty) console.error(`  ${line}`)
    console.error('Commit or discard those source changes before snapshotting.')
    process.exit(1)
  }

  mkdirSync(outDir, { recursive: true })

  for (const file of ONTOLOGY_FILES) {
    copyFileSync(join(ontologyDir, file), join(outDir, file))
  }

  const commit = sourceCommit()
  const readme = `# SSTIM ontology — frozen snapshot ${version}

These files are a **byte-identical, immutable copy** of the SSTIM ontology as of
version \`${version}\`. They exist so that
\`owl:versionIRI <https://w3id.org/sstim/${version}>\` resolves to a frozen
artifact that can be cited without ambiguity, even after the top-level
\`/ontology/*.ttl\` files continue to evolve toward the next version.

- Source commit: \`${commit}\`
- Generated by: \`scripts/snapshot-ontology.mjs\`
- Do not hand-edit. To correct an unpublished snapshot, re-run the script with
  \`--force\`. To cut a new version, bump \`owl:versionInfo\` /
  \`owl:versionIRI\` in \`sstim-core.ttl\` first, then snapshot the new number.

Files: ${ONTOLOGY_FILES.map((f) => `\`${f}\``).join(', ')}.
`
  writeFileSync(join(outDir, 'README.md'), readme)

  const written = readdirSync(outDir).sort()
  console.log(`snapshot: wrote static/ontology/${version}/ (${written.length} files)`)
  for (const f of written) console.log(`  ${f}`)
}

// Guarded so unit tests can import releaseProblems without side effects.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
