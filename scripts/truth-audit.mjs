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
// 0.12.0" is one more place to forget. So the canonical version comes from
// sstim-core.ttl, the module list from the snapshot script's own export, and
// the DOI from void.ttl — and every document is checked against those.
//
// Usage:  node scripts/truth-audit.mjs [--verbose]

import { readFileSync, existsSync } from 'node:fs'
import { ONTOLOGY_FILES } from './snapshot-ontology.mjs'

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

const VERSION = core?.match(/owl:versionInfo\s+"([^"]+)"/)?.[1]
const VERSION_IRI = core?.match(/owl:versionIRI\s+<[^>]*\/([\d.]+)>/)?.[1]
const DOI = voidTtl?.match(/dct:hasVersion\s+<https:\/\/doi\.org\/([^>]+)>/)?.[1]
const MODULE_COUNT = ONTOLOGY_FILES.length
const APP_VERSION = pkg.version

if (!VERSION) fail('sstim-core.ttl', 'no owl:versionInfo found — cannot audit anything else')

const NUMBER_WORDS = {
  5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten', 11: 'eleven', 12: 'twelve',
}

// ── 1. the release identity agrees with itself ───────────────────────────────

if (VERSION && VERSION_IRI && VERSION !== VERSION_IRI) {
  fail('sstim-core.ttl', `owl:versionIRI says ${VERSION_IRI} but owl:versionInfo says ${VERSION}`)
} else ok(`core version identity (${VERSION})`)

const citationVersion = citation?.match(/^version:\s*(.+)$/m)?.[1]?.trim()
if (citationVersion && citationVersion !== VERSION) {
  fail('CITATION.cff', `version ${citationVersion} does not match the ontology's ${VERSION}`)
} else ok('CITATION.cff version')

const citationDoi = citation?.match(/^doi:\s*(.+)$/m)?.[1]?.trim()
if (DOI && citationDoi && citationDoi !== DOI) {
  fail('CITATION.cff', `doi ${citationDoi} does not match void.ttl's ${DOI}`)
} else ok('CITATION.cff DOI')

const voidVersion = voidTtl?.match(/dcat:version\s+"([^"]+)"/)?.[1]
if (voidVersion && voidVersion !== VERSION) {
  fail('void.ttl', `dcat:version ${voidVersion} does not match the ontology's ${VERSION}`)
} else ok('void.ttl version')

// Every module must carry the release version.
for (const file of ONTOLOGY_FILES) {
  const text = read(`static/ontology/${file}`)
  if (!text) { fail(file, 'listed in ONTOLOGY_FILES but missing from static/ontology/'); continue }
  const moduleVersion = text.match(/owl:versionInfo\s+"([^"]+)"/)?.[1]
  if (moduleVersion !== VERSION) {
    fail(file, `owl:versionInfo ${moduleVersion} diverges from the set's ${VERSION}`)
  }
}
ok(`all ${MODULE_COUNT} modules at ${VERSION}`)

// ── 2. prose does not advertise a superseded release ─────────────────────────

const PROSE = ['README.md', 'SECURITY.md', 'docs/technical/PORTABLE_DEPLOYMENT.md',
  'ROADMAP.md', 'TODO.md', 'src/routes/+page.svelte']

// Any SSTIM x.y.z that is not the current one, outside a changelog/history line.
const olderVersion = /\bv?(\d+\.\d+\.\d+)\b/g

// Text that legitimately names an old version: history, changelogs, ranges
// ("v0.2.0 through v0.12.0"), and struck-through gap rows recording what a gap
// *used to say*. Without this the audit flags its own evidence of progress.
const IS_HISTORY = /histor|changelog|superseded|previous|prior|until 0\.|was |formerly|earlier|released in|through|snapshot|no longer|~~/i

for (const file of PROSE) {
  const text = read(file)
  if (!text) continue
  text.split('\n').forEach((line, i) => {
    // History, changelogs and superseded-ADR notes legitimately name old versions.
    if (IS_HISTORY.test(line)) return
    if (!/sstim|ontology|release/i.test(line)) return
    for (const m of line.matchAll(olderVersion)) {
      const found = m[1]
      if (found === VERSION || found === APP_VERSION) continue
      // Only complain about things shaped like an SSTIM release.
      if (!/^0\.\d+\.\d+$/.test(found)) continue
      fail(`${file}:${i + 1}`, `names SSTIM ${found} as if current; the release is ${VERSION}`)
    }
  })
}

// Module counts written as words go stale silently.
for (const file of PROSE) {
  const text = read(file)
  if (!text) continue
  for (const [n, word] of Object.entries(NUMBER_WORDS)) {
    if (Number(n) === MODULE_COUNT) continue
    // Allow an intervening adjective: "seven release modules" slipped past a
    // pattern that only knew "seven modules" and "seven ontology modules".
    const re = new RegExp(`\\b${word}\\s+(\\w+\\s+)?modules\\b`, 'i')
    const line = text.split('\n').findIndex((l) => re.test(l))
    if (line >= 0) fail(`${file}:${line + 1}`, `says "${word} modules"; there are ${MODULE_COUNT}`)
  }
}
ok('no superseded version or module count in prose')

// A superseded DOI in prose is the same class of error as a superseded version,
// and the first pass checked DOIs only among the machine-readable files.
if (DOI) {
  const doiPattern = /10\.5281\/zenodo\.\d+/g
  const conceptDoi = core?.match(/dct:identifier\s+"([^"]+)"/)?.[1]
  for (const file of PROSE) {
    const text = read(file)
    if (!text) continue
    text.split('\n').forEach((line, i) => {
      if (IS_HISTORY.test(line)) return
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
]

const auditable = PROSE.concat(['docs/technical/SESSION_PACKAGE.md'])
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

// ── report ───────────────────────────────────────────────────────────────────

if (VERBOSE || problems.length === 0) {
  console.log('truth-audit: derived facts')
  console.log(`  SSTIM version   ${VERSION}`)
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
