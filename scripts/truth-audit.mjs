#!/usr/bin/env node
// Assert that what the repository *says* matches what it *is*.
//
// This exists because the documentation drifted badly in a single day of work:
// the README advertised an ontology version two releases old and a module count
// that was wrong, PORTABLE_DEPLOYMENT listed as open two gaps that had been
// closed hours earlier, and SECURITY described as missing three things that
// shipped. None of it was caught, because prose has no test.
//
// The design rule here is the one that made `build-info.json` useful: **derive
// the facts, do not restate them.** A checker that hard-codes "the version is
// 0.12.0" is one more place to forget. The live suite and module inventory now
// come from manifest.json; the latest citable release and DOI come from
// void.ttl. Development and immutable release identity are intentionally
// distinct facts.
//
// Usage:  node scripts/truth-audit.mjs [--verbose]

import { readFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'

const VERBOSE = process.argv.includes('--verbose')
const problems = []
const checks = []

const fail = (where, msg) => problems.push(`${where}: ${msg}`)
const ok = (what) => checks.push(what)
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null)

// ── the canonical facts, derived ─────────────────────────────────────────────

const core = read('static/ontology/sstim-core.ttl')
const voidTtl = read('static/ontology/void.ttl')
const citation = read('CITATION.cff')
const pkg = JSON.parse(read('package.json'))
const manifest = JSON.parse(read('static/ontology/manifest.json'))

const VERSION = manifest.suite.version
const RELEASE_VERSION = voidTtl?.match(/dcat:version\s+"([^"]+)"/)?.[1]
const VERSION_IRI = core?.match(/owl:versionIRI\s+<[^>]*\/([\d.]+)>/)?.[1]
const DOI = voidTtl?.match(/dct:hasVersion\s+<https:\/\/doi\.org\/([^>]+)>/)?.[1]
const MODULE_COUNT = manifest.modules.length
const APP_VERSION = pkg.version

if (!VERSION) fail('sstim-core.ttl', 'no owl:versionInfo found — cannot audit anything else')

// ── 1. the release identity agrees with itself ───────────────────────────────

if (VERSION && VERSION_IRI && VERSION !== VERSION_IRI) {
  fail('sstim-core.ttl', `owl:versionIRI says ${VERSION_IRI} but owl:versionInfo says ${VERSION}`)
} else if (VERSION?.includes('-') && VERSION_IRI) {
  fail('sstim-core.ttl', `development version ${VERSION} must not claim owl:versionIRI`)
} else ok(`core version identity (${VERSION})`)

const citationVersion = citation?.match(/^version:\s*(.+)$/m)?.[1]?.trim()
if (citationVersion && citationVersion !== RELEASE_VERSION) {
  fail('CITATION.cff', `version ${citationVersion} does not match the latest immutable release ${RELEASE_VERSION}`)
} else ok('CITATION.cff version')

const citationDoi = citation?.match(/^doi:\s*(.+)$/m)?.[1]?.trim()
if (DOI && citationDoi && citationDoi !== DOI) {
  fail('CITATION.cff', `doi ${citationDoi} does not match void.ttl's ${DOI}`)
} else ok('CITATION.cff DOI')

if (!RELEASE_VERSION || !existsSync(`static/ontology/${RELEASE_VERSION}`)) {
  fail('void.ttl', `dcat:version ${RELEASE_VERSION ?? '(missing)'} has no immutable snapshot`)
} else ok(`void.ttl immutable release (${RELEASE_VERSION})`)

// The entrance and the citation modal do not read CITATION.cff at runtime —
// they read `releaseMetadata.js`, which is where the numbers moved after the
// footer and the modal drifted apart. The prose scan below never saw them
// again, because it scans `+page.svelte` and the module is not prose: the file
// written to stop the drift went two releases stale, unguarded, and handed
// visitors a citation for a superseded version. Compare it to the derived
// facts rather than adding it to a regex sweep.
const releaseMeta = read('src/ui/entrance/releaseMetadata.js')
if (releaseMeta) {
  const field = (name) => releaseMeta.match(new RegExp(`^export const ${name} = '([^']+)'`, 'm'))?.[1]
  const conceptDoi = core?.match(/dct:identifier\s+"([^"]+)"/)?.[1]
  const citationDate = citation?.match(/^date-released:\s*(.+)$/m)?.[1]?.trim()
  const expected = [
    ['RELEASE_VERSION', field('RELEASE_VERSION'), RELEASE_VERSION, 'void.ttl'],
    ['VERSION_DOI', field('VERSION_DOI'), DOI, 'void.ttl'],
    ['CONCEPT_DOI', field('CONCEPT_DOI'), conceptDoi, 'sstim-core.ttl'],
    ['RELEASE_DATE', field('RELEASE_DATE'), citationDate, 'CITATION.cff'],
  ]
  for (const [name, actual, want, source] of expected) {
    if (!want) continue
    if (actual !== want) {
      fail('src/ui/entrance/releaseMetadata.js', `${name} is ${actual ?? '(missing)'}; ${source} says ${want}`)
    }
  }
  ok('entrance release metadata matches the citable release')
} else {
  fail('truth-audit', 'src/ui/entrance/releaseMetadata.js is missing — the entrance citation check is stale, not the docs')
}

// Every module must carry the release version.
for (const module of manifest.modules) {
  const file = module.source.path
  const text = read(file)
  if (!text) { fail(file, 'listed in manifest but missing'); continue }
  const moduleVersion = text.match(/owl:versionInfo\s+"([^"]+)"/)?.[1]
  if (module.version !== VERSION || moduleVersion !== VERSION) {
    fail(file, `owl:versionInfo ${moduleVersion} diverges from the set's ${VERSION}`)
  }
}
ok(`all ${MODULE_COUNT} modules at ${VERSION}`)

// ── 2. prose does not advertise a superseded release ─────────────────────────

const PROSE = ['README.md', 'SECURITY.md', 'docs/technical/PORTABLE_DEPLOYMENT.md',
  'ROADMAP.md', 'TODO.md', 'src/routes/+page.svelte',
  // The entrance's copy source of record. It described the citation modal by
  // naming the version DOI and release inline, and was two releases stale —
  // unwatched, because the scan covered the page it specifies but not the
  // specification. Those identifiers now live only in releaseMetadata.js.
  'docs/technical/PUBLIC_ENTRANCE.md',
  // The ontology docs restate release facts more than anything else in the
  // repository, and were the last place still advertising a superseded line.
  'static/ontology/README.md', 'docs/ontology/README.md',
  'docs/ontology/MODULE_ARCHITECTURE.md',
  'docs/ontology/PUBLICATION_AND_INTERLINKING_PLAN.md',
  'docs/ontology/REGISTRY_SUBMISSIONS.md', 'docs/ecosystem/w3id/README.md',
  'docs/ecosystem/w3id/sstim/README.md']

// Any SSTIM x.y.z that is not the current one, outside a changelog/history line.
const olderVersion = /\bv?(\d+\.\d+\.\d+)\b/g

// Text that legitimately names an old version: history, changelogs, ranges
// ("v0.2.0 through v0.12.0"), and struck-through gap rows recording what a gap
// *used to say*. Without this the audit flags its own evidence of progress.
const IS_HISTORY = /histor|changelog|superseded|previous|prior|until 0\.|was |formerly|earlier|released in|through|snapshot|no longer|submitted|~~/i

// A table row carrying an ISO date is a log entry — a record of what was true
// on that date — not a claim about now. Registry submission logs and release
// tables are full of them, and flagging those would make the audit demand that
// history be rewritten every release.
const IS_DATED_LOG_ROW = (line) => line.trimStart().startsWith('|') && /\d{4}-\d{2}-\d{2}/.test(line)

for (const file of PROSE) {
  const text = read(file)
  if (!text) continue
  text.split('\n').forEach((line, i) => {
    // History, changelogs and superseded-ADR notes legitimately name old versions.
    if (IS_HISTORY.test(line) || IS_DATED_LOG_ROW(line)) return
    if (!/sstim|ontology|release/i.test(line)) return
    for (const m of line.matchAll(olderVersion)) {
      const found = m[1]
      if (found === VERSION.split('-', 1)[0] || found === RELEASE_VERSION || found === APP_VERSION) continue
      // Only complain about things shaped like an SSTIM release.
      if (!/^0\.\d+\.\d+$/.test(found)) continue
      fail(`${file}:${i + 1}`, `names SSTIM ${found} as if current; the release is ${VERSION}`)
    }
  })
}

ok('no superseded live/citable version in prose')

// A superseded *development* line is the error the check above cannot see:
// "0.13.0-dev" contains "0.13.0", which was a legitimate release number, so it
// read as current for a whole release cycle while naming a line that had moved
// on. Any `-dev` string that is not the live one is stale by construction.
const devPattern = /\b\d+\.\d+\.\d+-dev\b/g
for (const file of PROSE) {
  const text = read(file)
  if (!text) continue
  text.split('\n').forEach((line, i) => {
    if (IS_HISTORY.test(line) || IS_DATED_LOG_ROW(line)) return
    for (const m of line.matchAll(devPattern)) {
      if (m[0] === VERSION) continue
      fail(`${file}:${i + 1}`, `names ${m[0]} as the development line; it is ${VERSION}`)
    }
  })
}
ok('no superseded development line in prose')

// A superseded DOI in prose is the same class of error as a superseded version,
// and the first pass checked DOIs only among the machine-readable files.
if (DOI) {
  const doiPattern = /10\.5281\/zenodo\.\d+/g
  const conceptDoi = core?.match(/dct:identifier\s+"([^"]+)"/)?.[1]
  for (const file of PROSE) {
    const text = read(file)
    if (!text) continue
    text.split('\n').forEach((line, i) => {
      if (IS_HISTORY.test(line) || IS_DATED_LOG_ROW(line)) return
      for (const m of line.matchAll(doiPattern)) {
        // The concept DOI names every version and is correct anywhere.
        if (m[0] === DOI || m[0] === conceptDoi) continue
        fail(`${file}:${i + 1}`, `cites DOI ${m[0]}; the current version DOI is ${DOI}`)
      }
    })
  }
  ok('no superseded DOI in prose')
}

// ── 3. claims that a shipped capability is future work ───────────────────────
//
// Each entry pairs a claim with the evidence that refutes it. The evidence is
// checked too: if the file or target disappears, the claim becomes true again
// and this table must be revisited rather than silently protecting a lie.

const SHIPPED = [
  { capability: 'Reproducible package', evidence: ['flake.nix'], command: 'nix build --rebuild',
    stale: [/no bit-reproducible/i, /reproducib\w+ package (is )?(still )?(absent|missing|planned)/i] },
  { capability: 'NixOS deployment', evidence: ['nix/modules/bsc-lab.nix', 'nix/tests/bsc-lab.nix'],
    command: 'nix flake check', stale: [/no NixOS module/i, /NixOS module.{0,24}(planned|future|absent)/i] },
  { capability: 'OCI deployment', evidence: ['nix/oci.nix'], command: 'nix build .#oci',
    stale: [/no container image/i, /container image.{0,24}(planned|future|absent)/i] },
  { capability: 'Runtime configuration', evidence: ['src/config/runtimeConfig.js'],
    command: 'NixOS VM two-config subtest',
    stale: [/Firebase config(uration)? is build-time only/i, /no runtime configuration/i,
            /must rebuild to change backends/i] },
  { capability: 'Instance backup and migration', evidence: ['src/portability/instanceExport.js',
      'scripts/migration-two-origin.mjs'], command: 'make migrate-test',
    stale: [/backup,? restore and (instance |cross-instance )?migration are (the )?(next|not)/i,
            /[Cc]omplete instance backup, restore and cross-instance migration (is|are) not/i,
            /no complete backup or cross-instance migration/i] },
  { capability: 'Session interoperability', evidence: ['src/portability/sessionPackage.js',
      'scripts/session-conformance.mjs'], command: 'make session-conformance',
    stale: [/[Pp]atch export is a dead end/i, /no bridge to catalogue JSON or SSTIM RDF/i,
            /studio is a design surface wired to nothing downstream/i] },
  { capability: 'Deployment identity', evidence: ['scripts/gen-build-info.mjs', 'scripts/verify-deploy.mjs'],
    command: 'make verify-deploy', stale: [/no way to tell which commit is deployed/i] },
  { capability: 'Boundary enforcement', evidence: ['src/portability/sessionPackage.js'],
    command: 'session-conformance privacy assertions',
    stale: [/[Nn]o automated public\/private boundary tests/i] },
  // Both seams of ADR 0038 exist. What is missing is a second real identity
  // *provider*, which is a different claim — "the seam is untouched" was still
  // being asserted in PORTABLE_DEPLOYMENT after nine consumers had migrated to
  // it, and in the ADR's own status line while its successor described it as done.
  { capability: 'Identity seam', evidence: ['src/identity/IdentityProvider.js',
      'src/identity/identityProvider.conformance.test.js', 'src/storage/PatchStore.js'],
    command: 'identityProvider.conformance.test.js',
    stale: [/identity seam is untouched/i, /no implementation exists yet/i,
            /gated on the identity seam/i, /identity seam.{0,20}(is )?(still )?(planned|absent|missing)/i] },
]

// PATCH_STUDIO carried the exact sentence this table already listed as stale
// ("the studio is a design surface wired to nothing downstream") for as long as
// the table existed, because the scan never looked at it. A claim table is only
// as good as the set of files it reads.
const auditable = PROSE.concat(['docs/technical/SESSION_PACKAGE.md',
  'docs/technical/PATCH_STUDIO.md', 'docs/technical/PRIVATE_SYNC.md',
  'src/README.md', 'src/engines/README.md', 'CONTRIBUTING.md'])
for (const { capability, evidence, stale } of SHIPPED) {
  const missing = evidence.filter((f) => !existsSync(f))
  if (missing.length) {
    fail('truth-audit', `${capability}: evidence missing (${missing.join(', ')}) — the claim table is stale, not the docs`)
    continue
  }
  for (const file of auditable) {
    const text = read(file)
    if (!text) continue
    text.split('\n').forEach((line, i) => {
      if (IS_HISTORY.test(line)) return
      // Strike-through marks text the document is explicitly retracting, which
      // is the opposite of a stale claim.
      if (line.includes('~~')) return
      for (const pattern of stale) {
        if (pattern.test(line)) {
          fail(`${file}:${i + 1}`, `describes "${capability}" as missing, but it shipped`)
        }
      }
    })
  }
}
ok(`${SHIPPED.length} shipped capabilities have evidence and no stale denial`)

// ── 4. every relative link in the docs resolves ──────────────────────────────
//
// A dead link is the one documentation defect with no judgement call attached:
// it is always wrong, and it is invisible until someone clicks. Three had been
// sitting in the tree — a file deleted by a refactor, and a review that moved a
// directory deeper without updating its own ADR links. Reorganising docs is
// exactly when these appear, which is exactly when nobody is checking.

const MD_LINK = /\[[^\]]*\]\(([^)\s]+)\)/g
const tracked = execSync('git ls-files "*.md"', { encoding: 'utf8' }).trim().split('\n')
let links = 0

for (const file of tracked) {
  const text = read(file)
  if (!text) continue
  text.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(MD_LINK)) {
      const [target] = m[1].split('#')
      if (!target || /^(https?:|mailto:|\/\/)/.test(target)) continue
      links++
      if (!existsSync(resolve(dirname(file), target))) {
        fail(`${file}:${i + 1}`, `link target does not exist: ${target}`)
      }
    }
  })
}
ok(`${links} relative doc links resolve`)

// ── report ───────────────────────────────────────────────────────────────────

if (VERBOSE || problems.length === 0) {
  console.log('truth-audit: derived facts')
  console.log(`  SSTIM version   ${VERSION}`)
  console.log(`  citable release ${RELEASE_VERSION}`)
  console.log(`  version DOI     ${DOI ?? '(none recorded)'}`)
  console.log(`  ontology modules ${MODULE_COUNT}`)
  console.log(`  app version     ${APP_VERSION}`)
  console.log()
}

if (problems.length > 0) {
  console.error(`truth-audit: FAILED (${problems.length} issue(s))`)
  for (const p of problems) console.error(`  - ${p}`)
  process.exit(1)
}

console.log(`truth-audit: passed (${checks.length} checks)`)
for (const c of checks) console.log(`  ok  ${c}`)
