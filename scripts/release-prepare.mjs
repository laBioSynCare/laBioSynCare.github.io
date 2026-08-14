#!/usr/bin/env node
// Turn the development line into the release the snapshot will freeze.
//
// Steps 3 and 4 of the procedure in static/ontology/README.md, which were a
// hand edit across eighteen modules and four profile entry points. The README
// records that cutting 0.13.0 was blocked three times by gates that had been
// wrong for weeks; a hand edit at this scale is the other way a release goes
// wrong, and its mistakes are frozen forever rather than merely delaying you.
//
// Everything here is mechanical and reversible before `make snapshot` runs:
//
//   every module      header comment, owl:versionInfo, dct:issued/modified
//   the Kernel        adds owl:versionIRI, flips mod:status to released
//   every profile     adds owl:versionIRI, rewrites owl:imports and every
//                     prof:hasArtifact to the exact frozen sibling
//   manifest.json     via prepareReleaseManifest, the same function
//                     release-dryrun has been rehearsing against all along
//
// `dct:created` is deliberately untouched. `dct:issued` is what registries read
// as the version's release date — BioPortal's Released column, and the same in
// Archivo and OLS — so it moves with every release while the creation date does
// not. SSTIM submissions 1–8 all showed 2026-04-12 because that distinction was
// missed once already.
//
// Usage:  node scripts/release-prepare.mjs 0.14.0 [--date YYYY-MM-DD]

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prepareReleaseManifest } from './release-dryrun.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ONTOLOGY = join(ROOT, 'static/ontology')
const MANIFEST_PATH = join(ONTOLOGY, 'manifest.json')

const version = process.argv[2]
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('usage: node scripts/release-prepare.mjs X.Y.Z [--date YYYY-MM-DD]')
  process.exit(2)
}
const dateFlag = process.argv.indexOf('--date')
const releaseDate = dateFlag > -1 ? process.argv[dateFlag + 1] : new Date().toISOString().slice(0, 10)
if (!/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)) {
  console.error(`release-prepare: --date must be YYYY-MM-DD, got ${releaseDate}`)
  process.exit(2)
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'))
const current = manifest.suite.version
if (current !== `${version}-dev`) {
  console.error(
    `release-prepare: the development line is ${current}, which does not become ${version}. ` +
    'Renumber the line first, or pass the version it becomes.',
  )
  process.exit(1)
}

const base = `${manifest.suite.ontologyIri}/${version}/`
const kernelPath = manifest.modules.find((m) => m.id === 'core').source.path
const changes = []

// Every frozen snapshot through 0.12.0 carried its own release note, and
// CHANGELOG.md tells readers that per-change rationale lives in the ontology's
// skos:historyNote. Then 0.13.0 shipped without one and 0.14.0 repeated it,
// because nothing looks wrong when a note is missing — the release validates,
// the snapshot freezes, and the omission is only visible to someone counting.
// Refusing to prepare without it is the only thing that would have caught either.
if (!readFileSync(join(ROOT, kernelPath), 'utf8').includes(`"v${version} (`)) {
  console.error(
    `release-prepare: the Kernel has no skos:historyNote for v${version}.\n` +
    `  Add one to ${kernelPath}, in the form "v${version} (YYYY-MM-DD): …"@en, saying what\n` +
    '  changed and why. It is frozen with the snapshot, so it cannot be added afterwards.',
  )
  process.exit(1)
}

/**
 * Replace exactly once, or fail loudly: a silent no-op here ships a bad release.
 *
 * Counting uses a global clone of the pattern. `String.match` with a
 * non-global regex returns the match followed by its capture groups, so a
 * pattern with one group always reports two "matches" — which made this guard
 * reject every file it was meant to protect the first time it ran.
 */
function replaceOnce(text, pattern, replacement, what, file) {
  const occurrences = [...text.matchAll(new RegExp(pattern.source, `${pattern.flags}g`))]
  if (occurrences.length !== 1) {
    throw new Error(`${file}: expected exactly one ${what}, found ${occurrences.length}`)
  }
  return text.replace(pattern, replacement)
}

function bumpMetadata(text, file) {
  let out = replaceOnce(text, new RegExp(`#  Version:( +)${escape(current)}\\b`), `#  Version:$1${version}`, 'header version comment', file)
  out = replaceOnce(out, new RegExp(`owl:versionInfo "${escape(current)}"`), `owl:versionInfo "${version}"`, 'owl:versionInfo', file)
  out = replaceOnce(out, /dct:issued "\d{4}-\d{2}-\d{2}"\^\^xsd:date/, `dct:issued "${releaseDate}"^^xsd:date`, 'dct:issued', file)
  out = replaceOnce(out, /dct:modified "\d{4}-\d{2}-\d{2}"\^\^xsd:date/, `dct:modified "${releaseDate}"^^xsd:date`, 'dct:modified', file)
  return out
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// ── Modules ──────────────────────────────────────────────────────────────────
for (const module of manifest.modules) {
  const file = module.source.path
  const path = join(ROOT, file)
  let text = bumpMetadata(readFileSync(path, 'utf8'), file)

  if (file === kernelPath) {
    // ADR 0020: the Kernel is the only module carrying a version IRI for the
    // suite, and the only one whose status says whether the line is released.
    text = replaceOnce(
      text,
      new RegExp(`( +)owl:versionInfo "${escape(version)}" ;`),
      `$1owl:versionIRI <${manifest.suite.ontologyIri}/${version}> ;\n$1owl:versionInfo "${version}" ;`,
      'Kernel owl:versionInfo line to precede with a version IRI',
      file,
    )
    text = replaceOnce(text, /mod:status "under development"@en/, 'mod:status "released"@en', 'mod:status', file)
  }

  writeFileSync(path, text, 'utf8')
  changes.push(file)
}

// ── Profile entry points ─────────────────────────────────────────────────────
// Their imports and artifacts must name the exact frozen siblings. `make
// snapshot` copies files; it does not rewrite discovery metadata, so a profile
// left pointing at mutable URLs would freeze a release that resolves to
// whatever the development line becomes next.
const frozenSibling = (sourcePath) => `<${base}${sourcePath.split('/').pop()}>`

// Retrieval IRIs come from publication.persistentUrl, which is where the
// manifest actually declares them — the Kernel answers at /sstim/kernel and
// Exposure at /sstim/module/exposure, neither of which is derivable from a
// module id or a filename. Guessing produced an import list that silently left
// the Kernel pointing at a mutable URL.
const byPersistentUrl = new Map([
  ...manifest.modules.map((m) => [m.publication.persistentUrl, frozenSibling(m.source.path)]),
  ...manifest.profiles.map((p) => [p.publication.persistentUrl, frozenSibling(p.source.path)]),
  [`${manifest.suite.ontologyIri}/manifest`, `<${base}manifest>`],
])

/**
 * Rewrite IRIs inside one predicate's object list only.
 *
 * Scope matters more than it looks. `owl:imports` and `prof:hasArtifact` must
 * name the exact frozen files, while `dct:requires` and `prof:isProfileOf`
 * must keep naming the mutable ontology IRIs — a dependency is on the module,
 * not on one of its releases. A blanket rewrite over the file froze all four,
 * which is what the 0.13.0 snapshot shows is wrong.
 */
function rewritePredicateObjects(text, predicate, file) {
  // Up to the statement's `;`, non-greedily. Not "any character except a dot":
  // every IRI here contains dots in `w3id.org`, so that stopped the object list
  // at `<https://w3id` and rewrote nothing at all.
  const block = new RegExp(`(\\n +${predicate}\\s)([^;]*?)(?=\\s*;)`, 'g')
  let rewritten = 0
  const out = text.replace(block, (whole, lead, objects) => {
    const next = objects.replace(/<https:\/\/w3id\.org\/sstim[^>]*>/g, (iri) => {
      const frozen = byPersistentUrl.get(iri.slice(1, -1))
      if (frozen) rewritten += 1
      return frozen ?? iri
    })
    return lead + next
  })
  if (rewritten === 0) throw new Error(`${file}: ${predicate} rewrote nothing`)
  return out
}

for (const profile of manifest.profiles) {
  const file = profile.source.path
  const path = join(ROOT, file)
  let text = bumpMetadata(readFileSync(path, 'utf8'), file)

  text = replaceOnce(
    text,
    new RegExp(`( +)owl:versionInfo "${escape(version)}" ;`),
    `$1owl:versionIRI ${frozenSibling(file)} ;\n$1owl:versionInfo "${version}" ;`,
    'profile owl:versionInfo line to precede with a version IRI',
    file,
  )

  text = rewritePredicateObjects(text, 'owl:imports', file)
  text = rewritePredicateObjects(text, 'prof:hasArtifact', file)

  writeFileSync(path, text, 'utf8')
  changes.push(file)
}

// ── Manifest ─────────────────────────────────────────────────────────────────
const prepared = prepareReleaseManifest(manifest, version)
writeFileSync(MANIFEST_PATH, `${JSON.stringify(prepared, null, 2)}\n`, 'utf8')
changes.push('static/ontology/manifest.json')

console.log(`release-prepare: ${current} → ${version}, issued ${releaseDate}`)
console.log(`  ${manifest.modules.length} modules, ${manifest.profiles.length} profile entry points, 1 manifest`)
console.log('  next: update void.ttl, run `make validate`, commit, then `make snapshot VERSION=' + version + '`')
console.log('  checksums are stale until `node scripts/sstim-manifest.mjs sync-checksums`')
