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
//
// Release dates (2026-07-27): every module header must also carry
// `dct:issued` = `dct:modified` = the release date (today, or --release-date).
// `dct:issued` is what registries read as the version's release date —
// BioPortal's "Released" column, DBpedia Archivo, OLS — so a stale value makes
// every published version look like it shipped on the ontology's first issue
// date. `dct:created` stays the module's original creation date and only has
// to be no later than the release.
//
// Every successful snapshot also records its files' checksums into
// static/ontology/snapshot-checksums.json (RDF-03/RDF-12, 2026-07-24 audit),
// so `make verify-snapshots` can catch silent drift in an already-published
// snapshot for the rest of its life.

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
export const ONTOLOGY_FILES = [
  'sstim-core.ttl',
  'sstim-vocab.ttl',
  'sstim-shapes.ttl',
  'sstim-alignments.ttl',
  'sstim-patch-studio.ttl',
  'sstim-exposure.ttl',
  'sstim-stimulus.ttl',
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

// Returns the module's `<iri> a owl:Ontology ; ... .` header statement, or ''
// when there is none. Scans for the statement-terminating "." while tracking
// Turtle string literals, so a "." inside a historyNote — or a dct:issued on a
// bibliographic reference further down the file — is never mistaken for the
// header. sstim-shapes.ttl in particular carries several unrelated dct:issued
// occurrences inside SHACL property shapes.
export function ontologyHeader(text) {
  const start = text.search(/^\s*<[^>]+>\s+a\s+owl:Ontology\b/m)
  if (start === -1) return ''
  let quote = null // '"""' or '"' while inside a literal
  for (let i = start; i < text.length; i += 1) {
    if (quote) {
      if (text[i] === '\\') { i += 1; continue }
      if (text.startsWith(quote, i)) { i += quote.length - 1; quote = null }
      continue
    }
    if (text.startsWith('"""', i)) { quote = '"""'; i += 2; continue }
    if (text[i] === '"') { quote = '"'; continue }
    if (text[i] === '#') { // comment to end of line
      const nl = text.indexOf('\n', i)
      if (nl === -1) break
      i = nl
      continue
    }
    if (text[i] === '.' && /[\s\r\n]|^$/.test(text[i + 1] ?? '\n')) {
      return text.slice(start, i + 1)
    }
  }
  return text.slice(start)
}

function headerDate(header, property) {
  const match = header.match(new RegExp(`${property}\\s+"(\\d{4}-\\d{2}-\\d{2})"\\s*\\^\\^xsd:date`))
  return match ? match[1] : null
}

// Local calendar date as YYYY-MM-DD (not toISOString(), which is UTC and would
// report yesterday/tomorrow for maintainers outside UTC).
export function todayIso(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// Pure release-readiness check, exported for unit tests. `files` maps module
// file names to their Turtle text; `releaseDate` is the YYYY-MM-DD date the
// release is issued on (defaults to today). Returns a list of human-readable
// problems (empty when the set is ready to snapshot as `version`).
export function releaseProblems({ version, files, releaseDate = todayIso() }) {
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

    // Release dates. The whole set is re-issued together (ADR 0020), so every
    // module carries the same dct:issued / dct:modified = the release date.
    const header = ontologyHeader(text)
    const issued = headerDate(header, 'dct:issued')
    const modified = headerDate(header, 'dct:modified')
    const created = headerDate(header, 'dct:created')
    if (!issued) {
      problems.push(`${file}: missing dct:issued "${releaseDate}"^^xsd:date in the ontology header`)
    } else if (issued !== releaseDate) {
      problems.push(`${file}: dct:issued "${issued}" is not the release date "${releaseDate}" — bump it in every module when cutting a release (registries read it as the version's release date)`)
    }
    if (!modified) {
      problems.push(`${file}: missing dct:modified "${releaseDate}"^^xsd:date in the ontology header`)
    } else if (modified !== releaseDate) {
      problems.push(`${file}: dct:modified "${modified}" is not the release date "${releaseDate}"`)
    }
    if (created && created > releaseDate) {
      problems.push(`${file}: dct:created "${created}" is later than the release date "${releaseDate}"`)
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
  console.log(`Usage: node scripts/snapshot-ontology.mjs [version] [--force] [--release-date=YYYY-MM-DD]

Copies static/ontology/*.ttl into static/ontology/<version>/.

Options:
  --force   Overwrite an existing snapshot directory. Use only before publish.
  --release-date=YYYY-MM-DD
            The date this version is issued; every module header must declare
            it as dct:issued and dct:modified. Defaults to today.
  -h, --help
            Show this help.
`)
}

function parseArgs(argv) {
  let version = null
  let force = false
  let releaseDate = todayIso()

  for (const arg of argv) {
    if (arg === '--force') {
      force = true
    } else if (arg.startsWith('--release-date=')) {
      releaseDate = arg.slice('--release-date='.length)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)) {
        throw new Error(`--release-date must be YYYY-MM-DD, got "${releaseDate}"`)
      }
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

  return { version: version ?? declaredVersion(), force, releaseDate }
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

  const { version, force, releaseDate } = options
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) {
    console.error(`Refusing to snapshot non-semver version "${version}".`)
    process.exit(1)
  }

  const problems = releaseProblems({ version, files: liveModuleFiles(), releaseDate })
  if (problems.length) {
    console.error(`Refusing to snapshot: the module set is not release-ready as "${version}" (release date ${releaseDate}):`)
    for (const problem of problems) console.error(`  - ${problem}`)
    console.error('Bump owl:versionInfo and dct:issued / dct:modified across all modules,')
    console.error('set owl:versionIRI and mod:status "released" in sstim-core.ttl, then snapshot.')
    console.error('Pass --release-date=YYYY-MM-DD if the release is dated other than today.')
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

  // RDF-03/RDF-12 (2026-07-24 audit): every new snapshot gets its checksums
  // recorded immediately, so `make verify-snapshots` can catch drift in it for
  // the rest of its life. Skipped under --force re-cuts of an unpublished
  // snapshot whose checksums are already recorded — record() itself refuses
  // to silently overwrite a recorded version.
  try {
    execFileSync('node', [join(here, 'verify-snapshot-checksums.mjs'), 'record', version], { stdio: 'inherit' })
  } catch {
    console.error(`snapshot: wrote the files but could not record checksums for ${version}.`)
    console.error(`Run \`node scripts/verify-snapshot-checksums.mjs record ${version}\` by hand once resolved.`)
  }
}

// Guarded so unit tests can import releaseProblems without side effects.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
