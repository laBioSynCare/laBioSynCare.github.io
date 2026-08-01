// snapshot-ontology.mjs — freeze the current ontology files as an immutable,
// citable version snapshot.
//
//   node scripts/snapshot-ontology.mjs [version] [--force]
//
// Copies release-prepared ontology modules and profile entrypoints verbatim
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
// Released profile entrypoints must already import exact versioned sibling
// files, and the manifest must advertise those immutable artifact URLs. The
// snapshot step never rewrites imports after hashing.
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

import {
  namespaceCatalogueFilename,
  namespaceCatalogueTurtle,
  stripTurtleComments,
} from './sstim-manifest.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..')
const ontologyDir = resolve(here, '../static/ontology')
const manifestPath = join(ontologyDir, 'manifest.json')

function snapshotSourcePaths() {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  return [
    ...manifest.modules
      .filter((module) => module.release.snapshot)
      .map((module) => module.source.path),
    ...manifest.profiles
      .filter((profile) => profile.release.snapshot)
      .map((profile) => profile.source.path),
  ]
}

// Instances are implementation data, not part of the versioned ontology.
// Modules and profile entrypoints are the manifest-declared reusable artifact.
export const ONTOLOGY_FILES = snapshotSourcePaths().map((path) => path.split('/').pop())
export const SNAPSHOT_SIDECARS = ['manifest.json', 'manifest.schema.json']

// Frozen namespace catalogues. `sstim-core.ttl` stopped being the whole ontology
// when ADR 0043 reduced it to the Kernel, so the version IRI
// <https://w3id.org/sstim/{version}> needs a frozen document that still stands
// for the entire release. These are generated into the snapshot rather than
// copied, because the live catalogues are build artifacts under dist/.
export function snapshotNamespaceCatalogues(manifest) {
  return (manifest.namespaceDocuments ?? []).map((document) => ({
    id: document.id,
    filename: namespaceCatalogueFilename(document),
  }))
}

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
export function immutableImportProblems({ version, files, manifest }) {
  const problems = []
  if (!manifest || !Array.isArray(manifest.modules) || !Array.isArray(manifest.profiles)) {
    return ['manifest: cannot verify immutable profile imports']
  }
  const moduleById = new Map(manifest.modules.map((module) => [module.id, module]))
  const baseUrl = `https://w3id.org/sstim/${version}/`

  for (const profile of manifest.profiles.filter((candidate) => candidate.release?.snapshot)) {
    const filename = profile.source?.path?.split('/').pop()
    const text = files.get(filename) ?? ''
    const header = ontologyHeader(text)
    const importsObject = header.match(/\bowl:imports\s+([^;]+);/)?.[1] ?? ''
    const actual = [...importsObject.matchAll(/<([^>]+)>/g)]
      .map((match) => match[1])
      .sort()
    const expected = (profile.modules ?? [])
      .map((moduleId) => moduleById.get(moduleId)?.source?.path)
      .filter(Boolean)
      .map((sourcePath) => `${baseUrl}${sourcePath.split('/').pop()}`)
      .sort()
    if (actual.length !== expected.length || actual.some((iri, index) => iri !== expected[index])) {
      problems.push(
        `${filename}: owl:imports must be the exact immutable ${version} sibling closure; ` +
        `expected [${expected.join(', ')}], found [${actual.join(', ')}]`,
      )
    }
  }
  return problems
}

export function releaseProblems({
  version,
  files,
  releaseDate = todayIso(),
  manifest = null,
}) {
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
  if (manifest) problems.push(...immutableImportProblems({ version, files, manifest }))
  return problems
}

// Release readiness is decided by matching Turtle text, so comments are stripped
// first: prose about owl:versionIRI, dct:issued, or mod:status must not be read
// as an assertion. These strings are only ever inspected — the snapshot itself
// copies the untouched files from disk.
function liveModuleFiles() {
  const files = new Map()
  for (const file of ONTOLOGY_FILES) {
    files.set(file, stripTurtleComments(readFileSync(join(ontologyDir, file), 'utf8')))
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
  --force   Refresh an unpublished snapshot's owned files. Unexpected existing
            artifacts are rejected and never deleted automatically.
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

export function dirtyOntologyFiles({
  sourcePaths = null,
  rootDir = repoRoot,
  runCommand = execFileSync,
} = {}) {
  const checkedPaths = sourcePaths ?? [
    ...snapshotSourcePaths(),
    'static/ontology/manifest.json',
    'static/ontology/manifest.schema.json',
  ]
  const out = runCommand(
    'git',
    ['status', '--porcelain', '--', ...checkedPaths],
    { cwd: rootDir },
  ).toString().trim()
  return out ? out.split(/\r?\n/) : []
}

function snapshotReadme({ version, commit, ontologyFiles, sidecars, catalogueFiles = [] }) {
  const catalogueNote = catalogueFiles.length
    ? `

\`${catalogueFiles.join('`, `')}\` ${catalogueFiles.length === 1 ? 'is a' : 'are'}
**generated namespace ${catalogueFiles.length === 1 ? 'catalogue' : 'catalogues'}**:
the concatenation of the frozen modules sharing each hash namespace, in manifest
order. \`sstim-namespace.ttl\` is what
\`https://w3id.org/sstim/${version}\` resolves to, because \`sstim-core.ttl\` is
the two-class Kernel rather than the whole ontology (ADR 0043). Every other file
here is a byte-identical copy of its top-level source.`
    : ''
  return `# SSTIM ontology — frozen snapshot ${version}

These files are a **byte-identical, immutable copy** of the SSTIM ontology as of
version \`${version}\`. They exist so that
\`owl:versionIRI <https://w3id.org/sstim/${version}>\` resolves to a frozen
artifact that can be cited without ambiguity, even after the top-level
\`/ontology/*.ttl\` files continue to evolve toward the next version.${catalogueNote}

Profile entrypoints were release-prepared before this copy: every
\`owl:imports\` and PROF artifact target is an exact versioned URL.
\`manifest.json\` advertises the immutable URL of every snapshotted artifact,
and its \`$schema\` points at the frozen \`manifest.schema.json\` sibling.

- Source commit: \`${commit}\`
- Generated by: \`scripts/snapshot-ontology.mjs\`
- Do not hand-edit. To correct an unpublished snapshot, re-run the script with
  \`--force\`. To cut a new version, bump \`owl:versionInfo\` /
  \`owl:versionIRI\` in \`sstim-core.ttl\` first, then snapshot the new number.

Files: ${[...ontologyFiles, ...catalogueFiles, ...sidecars].map((file) => `\`${file}\``).join(', ')}.
`
}

export function snapshotVersionRegistered({
  ontologyDirectory = ontologyDir,
  version,
} = {}) {
  const ledgerPath = join(ontologyDirectory, 'snapshot-checksums.json')
  if (!existsSync(ledgerPath)) return false
  const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'))
  return Object.prototype.hasOwnProperty.call(ledger, version)
}

// Copy the already validated release set and make checksum registration part
// of the operation's success contract. `--force` may refresh only files that
// this version of the snapshotter owns; an unexpected file is rejected rather
// than silently retained or deleted.
export function writeSnapshotArtifacts({
  ontologyDirectory = ontologyDir,
  version,
  ontologyFiles = ONTOLOGY_FILES,
  sidecars = SNAPSHOT_SIDECARS,
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8')),
  force = false,
  commit = 'uncommitted',
  isVersionRegistered = (releaseVersion) => snapshotVersionRegistered({
    ontologyDirectory,
    version: releaseVersion,
  }),
  recordChecksums = (releaseVersion) => execFileSync(
    'node',
    [join(here, 'verify-snapshot-checksums.mjs'), 'record', releaseVersion],
    { stdio: 'inherit' },
  ),
}) {
  const outDir = join(ontologyDirectory, version)
  if (isVersionRegistered(version)) {
    throw new Error(
      `refusing to modify ${outDir}: version ${version} is already registered ` +
      'in the immutable snapshot checksum ledger',
    )
  }
  const catalogues = snapshotNamespaceCatalogues(manifest)
  const catalogueFiles = catalogues.map((catalogue) => catalogue.filename)
  const ownedFiles = new Set([
    ...ontologyFiles,
    ...catalogueFiles,
    ...sidecars,
    'README.md',
  ])
  const existingFiles = existsSync(outDir)
    ? readdirSync(outDir).filter((file) => file !== '.DS_Store')
    : []

  if (existingFiles.length && !force) {
    throw new Error(
      `refusing to overwrite existing snapshot ${outDir}; ` +
      'use --force only if this snapshot has not been published',
    )
  }
  const unexpectedFiles = existingFiles.filter((file) => !ownedFiles.has(file)).sort()
  if (force && unexpectedFiles.length) {
    throw new Error(
      `refusing --force because ${outDir} contains unexpected existing ` +
      `artifact(s): ${unexpectedFiles.join(', ')}`,
    )
  }

  mkdirSync(outDir, { recursive: true })
  for (const file of ontologyFiles) {
    copyFileSync(join(ontologyDirectory, file), join(outDir, file))
  }
  for (const file of sidecars) {
    copyFileSync(join(ontologyDirectory, file), join(outDir, file))
  }
  // Built from the files just copied, so the frozen catalogue is exactly the
  // concatenation of the frozen modules rather than of whatever the live
  // sources become next.
  for (const catalogue of catalogues) {
    writeFileSync(
      join(outDir, catalogue.filename),
      namespaceCatalogueTurtle(manifest, catalogue.id, {
        moduleSources: (module) => readFileSync(
          join(outDir, module.source.path.split('/').pop()),
          'utf8',
        ),
      }),
    )
  }
  writeFileSync(
    join(outDir, 'README.md'),
    snapshotReadme({ version, commit, ontologyFiles, sidecars, catalogueFiles }),
  )

  try {
    recordChecksums(version, outDir)
  } catch (error) {
    throw new Error(
      `checksum ledger recording failed for ${version}; the snapshot is ` +
      `incomplete and must not be published (${error.message})`,
      { cause: error },
    )
  }

  return {
    outDir,
    written: readdirSync(outDir).filter((file) => file !== '.DS_Store').sort(),
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

  try {
    execFileSync('python3', [join(here, 'validate-sstim-manifest-schema.py')], {
      cwd: repoRoot,
      stdio: 'inherit',
    })
    execFileSync('node', [join(here, 'sstim-manifest.mjs'), 'check'], {
      cwd: repoRoot,
      stdio: 'inherit',
    })
  } catch {
    console.error(
      'Refusing to snapshot: static/ontology/manifest.json does not satisfy ' +
      'its JSON Schema and synchronized semantic contract.',
    )
    process.exit(1)
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  if (manifest.suite.version !== version || manifest.suite.status !== 'released') {
    console.error(
      `Refusing to snapshot: manifest suite is ${manifest.suite.version} / ${manifest.suite.status}; ` +
      `expected ${version} / released.`,
    )
    process.exit(1)
  }

  const problems = releaseProblems({
    version,
    files: liveModuleFiles(),
    releaseDate,
    manifest,
  })
  if (problems.length) {
    console.error(`Refusing to snapshot: the module set is not release-ready as "${version}" (release date ${releaseDate}):`)
    for (const problem of problems) console.error(`  - ${problem}`)
    console.error('Bump owl:versionInfo and dct:issued / dct:modified across all modules,')
    console.error('set owl:versionIRI and mod:status "released" in sstim-core.ttl, then snapshot.')
    console.error('Pass --release-date=YYYY-MM-DD if the release is dated other than today.')
    process.exit(1)
  }

  let dirty
  try {
    dirty = dirtyOntologyFiles()
  } catch (error) {
    console.error('Refusing to snapshot: could not verify that ontology sources are clean.')
    console.error(`  ${error.message}`)
    process.exit(1)
  }
  if (dirty.length) {
    console.error('Refusing to snapshot while source ontology files have uncommitted changes:')
    for (const line of dirty) console.error(`  ${line}`)
    console.error('Commit or discard those source changes before snapshotting.')
    process.exit(1)
  }

  let result
  try {
    result = writeSnapshotArtifacts({
      version,
      force,
      commit: sourceCommit(),
    })
  } catch (error) {
    console.error(`snapshot: ERROR ${error.message}`)
    process.exit(1)
  }
  console.log(`snapshot: wrote static/ontology/${version}/ (${result.written.length} files)`)
  for (const file of result.written) console.log(`  ${file}`)
}

// Guarded so unit tests can import releaseProblems without side effects.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
