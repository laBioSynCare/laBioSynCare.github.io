#!/usr/bin/env node
// Turn the development line into the release the snapshot will freeze.
//
// Steps 3–5 of the procedure in static/ontology/README.md, which were a
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
// `dct:created` is deliberately untouched. `dct:issued` is the version's formal
// release date, so it moves with every release while the creation date does not.
// BioPortal's current mapping checks `dct:created` before `dct:issued`; its
// misleading Released field is corrected on the stable submission rather than
// by falsifying SSTIM's creation provenance.
//
// Beyond the ontology itself it carries the release into the four places that
// describe it: the changelog section, CITATION.cff, the entrance metadata, and
// void.ttl's version and counts. It also regenerates the ADR 0025 HED bundles,
// which embed the suite version and therefore go stale on every release. Each
// was previously a hand edit, and each mistake was caught by a later gate rather
// than prevented — which works, but costs a full validation cycle and leaves the
// release half-cut in between.
//
// Usage:  node scripts/release-prepare.mjs X.Y.Z [--date YYYY-MM-DD]

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prepareReleaseManifest } from './release-dryrun.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ONTOLOGY = join(ROOT, 'static/ontology')
const MANIFEST_PATH = join(ONTOLOGY, 'manifest.json')

const version = process.argv[2]
if (!version || !/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/.test(version)) {
  console.error('usage: node scripts/release-prepare.mjs X.Y.Z [--date YYYY-MM-DD]')
  process.exit(2)
}
const dateFlag = process.argv.indexOf('--date')
const releaseDate = dateFlag > -1 ? process.argv[dateFlag + 1] : new Date().toISOString().slice(0, 10)
if (!/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)) {
  console.error(`release-prepare: --date must be YYYY-MM-DD, got ${releaseDate}`)
  process.exit(2)
}

// Only for the placeholder sentence in the fresh Unreleased section; the actual
// reopening is release-open-dev's job and may legitimately choose otherwise.
const [major, minor] = version.split('.')
const nextDevLine = `${major}.${Number(minor) + 1}.0-dev`

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
  // The banner's Date must move with its Version. It did not until 0.16.0: the
  // line was stamped 2026-08-04 across every module by the ADR 0043 split and
  // never touched again, while the Version directly above it advanced with each
  // release. By 0.16.0 the pair read "Version: 0.16.0 / Date: 2026-08-04", and
  // the date matched nothing — not dct:issued, and not dct:created, which is per
  // module (2026-04-12 for vocab, 2026-06-18 for exposure, 2026-08-01 for
  // session). A banner restating what the RDF already carries is the drift this
  // repository keeps finding; here it is made to agree instead of removed,
  // because the banner is what a human opening the file reads first.
  let out = replaceOnce(text, new RegExp(`#  Version:( +)${escape(current)}\\b`), `#  Version:$1${version}`, 'header version comment', file)
  out = replaceOnce(out, /#(  +)Date:( +)\d{4}-\d{2}-\d{2}/, `#$1Date:$2${releaseDate}`, 'header date comment', file)
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

// ── The four documents that describe the release ─────────────────────────────

function editFile(file, edits) {
  const path = join(ROOT, file)
  let text = readFileSync(path, 'utf8')
  for (const [pattern, replacement, what] of edits) {
    text = replaceOnce(text, pattern, replacement, what, file)
  }
  writeFileSync(path, text, 'utf8')
  changes.push(file)
}

// The changelog's Unreleased section becomes this release's section. Its
// content is the release notes, so an empty one means the release has nothing
// written about it — worth stopping for, not worth guessing at.
const changelog = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8')
const unreleased = changelog.match(/## \[Unreleased\]\n([\s\S]*?)(?=\n## \[)/)
if (!unreleased) {
  console.error('release-prepare: CHANGELOG.md has no [Unreleased] section to cut.')
  process.exit(1)
}
if (unreleased[1].trim().length < 40) {
  console.error('release-prepare: CHANGELOG.md\'s [Unreleased] section is empty; write the release notes first.')
  process.exit(1)
}
// Renaming the heading is not enough, and stopping there is what left eleven of
// fifteen sections rendering as literal `[0.15.0]` with no link. Keep A Changelog
// resolves `## [X.Y.Z]` against a definition at the foot of the file, and nothing
// regenerated that block, so every release silently left its own heading
// unlinked and `[Unreleased]` comparing from wherever it last did — v0.8.0 by the
// time anyone looked, seven releases stale. A broken *reference* degrades to
// plain text rather than to a dead link, which is why no link checker saw it.
//
// So: rename the heading, open a fresh empty Unreleased above it, add this
// version's definition, and repoint the Unreleased comparison at this version.
// `truth-audit` checks all of it afterwards.
editFile('CHANGELOG.md', [
  [/## \[Unreleased\]/, `## [Unreleased]\n\nNothing yet on the ${nextDevLine} line.\n\n## [${version}] - ${releaseDate}`, '[Unreleased] heading'],
  [
    /^\[Unreleased\]: (\S+)\/compare\/v[\d.]+\.\.\.HEAD$/m,
    `[Unreleased]: $1/compare/v${version}...HEAD\n[${version}]: $1/releases/tag/v${version}`,
    '[Unreleased] link definition',
  ],
])

editFile('CITATION.cff', [
  [/^version: .+$/m, `version: ${version}`, 'version'],
  [/^date-released: .+$/m, `date-released: ${releaseDate}`, 'date-released'],
])

editFile('src/ui/entrance/releaseMetadata.js', [
  [/export const RELEASE_VERSION = '[^']*'/, `export const RELEASE_VERSION = '${version}'`, 'RELEASE_VERSION'],
  [/export const RELEASE_DATE = '[^']*'/, `export const RELEASE_DATE = '${releaseDate}'`, 'RELEASE_DATE'],
])

// void.ttl describes the release being cut. The counts come from the same
// rdflib the quality audit uses, over the live modules — byte-identical to what
// the snapshot will freeze — so the audit cannot reject numbers this wrote.
let counts
try {
  counts = JSON.parse(execFileSync('python3', [join(ROOT, 'scripts/void-counts.py')], { cwd: ROOT }).toString())
} catch (error) {
  console.error(`release-prepare: could not compute VoID counts (${error.message.split('\n')[0]}).`)
  console.error('  Run inside the dev shell: rdflib is required, as it is for the audit that checks them.')
  process.exit(1)
}
// Scoped to the root dataset's own block. void.ttl declares void:triples three
// times — once for the term space and once for each of the instance and
// ecosystem subsets — so an unscoped edit would rewrite whichever came first.
// replaceOnce caught that rather than letting it through, which is the whole
// reason it refuses ambiguity instead of taking the first match.
const VOID_PATH = 'static/ontology/void.ttl'
const voidText = readFileSync(join(ROOT, VOID_PATH), 'utf8')
const rootStart = voidText.indexOf('<https://w3id.org/sstim/void>')
if (rootStart < 0) throw new Error(`${VOID_PATH}: no root dataset block`)
const rootEnd = voidText.indexOf('\n\n<', rootStart)
const rootBlock = voidText.slice(rootStart, rootEnd < 0 ? undefined : rootEnd)

let updatedRoot = rootBlock
for (const [pattern, replacement, what] of [
  [/dcat:version "[^"]*" ;/, `dcat:version "${version}" ;`, 'dcat:version'],
  [/void:triples \d+ ;/, `void:triples ${counts.triples} ;`, 'void:triples'],
  [/void:classes \d+ ;/, `void:classes ${counts.classes} ;`, 'void:classes'],
  [/void:properties \d+ ;/, `void:properties ${counts.properties} ;`, 'void:properties'],
]) {
  updatedRoot = replaceOnce(updatedRoot, pattern, replacement, what, `${VOID_PATH} root dataset`)
}
writeFileSync(join(ROOT, VOID_PATH), voidText.replace(rootBlock, updatedRoot), 'utf8')
changes.push(VOID_PATH)

console.log(`release-prepare: ${current} → ${version}, issued ${releaseDate}`)
console.log(`  ${manifest.modules.length} modules, ${manifest.profiles.length} profile entry points, 1 manifest`)
// The ADR 0025 demonstrator bundles record the SSTIM suite version they were
// generated against, so bumping the line makes every one of them stale and
// `make hed-bundle-check` fails on the release commit. Regenerate here rather
// than leaving a gate red for the person cutting it to rediscover — which is
// what happened on 0.16.0.
execFileSync('python3', [join(ROOT, 'scripts/generate-hed-bundle.py')], { cwd: ROOT, stdio: 'pipe' })

console.log(`  changelog, CITATION.cff, entrance metadata, void.ttl (${counts.triples} triples, ${counts.classes} classes, ${counts.properties} properties)`)
console.log('  HED demonstrator bundles regenerated for the release version')
console.log(`  ${changes.length} files changed`)
console.log('  next: `node scripts/sstim-manifest.mjs sync-checksums`,')
console.log('        `make validate-release-source`, then commit the release-prepared sources.')
console.log(`        Run \`make snapshot VERSION=${version} RELEASE_DATE=${releaseDate}\`; it defaults`)
console.log('        to today and refuses a module set dated otherwise. Build the explicit')
console.log('        `make bioportal-bundle-candidate`, append its reviewed new ledger record,')
console.log('        then run `make bioportal-ledger-check`, `make bioportal-reproducible`,')
console.log('        and the final `make validate`. Commit snapshot + ledger before tagging.')
// Zenodo no longer archives a tag by itself: the webhook is disconnected from
// both repositories so the move cannot mint two DOI series. Naming the command
// here matters because "after the tag and DOI" used to stand in for a step that
// happened without anyone doing it.
console.log(`        Then tag, and deposit: \`make zenodo-deposit VERSION=${version}\` to see the`)
console.log('        plan, then again with PUBLISH=1 and ZENODO_TOKEN set. Carry the DOI it')
console.log('        prints into void.ttl, CITATION.cff and releaseMetadata.js, `make truth-audit`,')
console.log(`        and finally \`node scripts/release-open-dev.mjs\` to reopen the mutable line.`)
