#!/usr/bin/env node
// Reopen the mutable development line after a release.
//
// The inverse of release-prepare.mjs, and the step most easily forgotten,
// because everything looks finished once the tag is pushed. It is not: the live
// sources are left claiming `mod:status "released"` at the version just frozen,
// so the next ontology edit silently makes a "released" line differ from the
// snapshot that carries its name. That is the 0.8.0–0.10.0 defect the
// 2026-07-24 audit found — releases self-citing artifacts they were no longer
// identical to — and nothing else in the suite detects it, because every gate
// happily validates a line that is internally consistent and mislabelled.
//
// It was done by hand for 0.14.0-dev (bd15b36) and then forgotten entirely for
// 0.15.0-dev. A script is the fix for a step that is invisible when skipped.
//
//   every module      header comment and owl:versionInfo → the new -dev version
//   the Kernel        drops owl:versionIRI, moves owl:priorVersion to the
//                     release just cut, returns to "under development"
//   every profile     drops owl:versionIRI, imports and artifacts back to the
//                     mutable retrieval IRIs
//   manifest.json     development status, no immutable release URLs, mutable
//                     $schema and versionedUrls removed
//
// void.ttl, CITATION.cff and the entrance metadata are deliberately untouched:
// they describe the latest *immutable release*, which is exactly the version
// just frozen, and must not follow the development line.
//
// Usage:  node scripts/release-open-dev.mjs 0.15.0-dev

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const MANIFEST_PATH = join(ROOT, 'static/ontology/manifest.json')

const next = process.argv[2]
if (!next || !/^\d+\.\d+\.\d+-dev$/.test(next)) {
  console.error('usage: node scripts/release-open-dev.mjs X.Y.Z-dev')
  process.exit(2)
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'))
const released = manifest.suite.version
if (manifest.suite.status !== 'released' || released.includes('-')) {
  console.error(
    `release-open-dev: the line is already ${released} (${manifest.suite.status}); ` +
    'there is no release to reopen from.',
  )
  process.exit(1)
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const base = `${manifest.suite.ontologyIri}/${released}/`

function replaceOnce(text, pattern, replacement, what, file) {
  const occurrences = [...text.matchAll(new RegExp(pattern.source, `${pattern.flags}g`))]
  if (occurrences.length !== 1) {
    throw new Error(`${file}: expected exactly one ${what}, found ${occurrences.length}`)
  }
  return text.replace(pattern, replacement)
}

function bumpVersion(text, file) {
  let out = replaceOnce(text, new RegExp(`#  Version:( +)${escape(released)}\\b`), `#  Version:$1${next}`, 'header version comment', file)
  return replaceOnce(out, new RegExp(`owl:versionInfo "${escape(released)}"`), `owl:versionInfo "${next}"`, 'owl:versionInfo', file)
}

/** Drop the version IRI line the release added. */
function dropVersionIri(text, file) {
  return replaceOnce(text, /^ +owl:versionIRI <[^>]+> ;\n/m, '', 'owl:versionIRI line', file)
}

const kernelPath = manifest.modules.find((m) => m.id === 'core').source.path

for (const module of manifest.modules) {
  const file = module.source.path
  const path = join(ROOT, file)
  let text = bumpVersion(readFileSync(path, 'utf8'), file)

  if (file === kernelPath) {
    text = dropVersionIri(text, file)
    text = replaceOnce(text, /owl:priorVersion <[^>]+> ;/, `owl:priorVersion <${manifest.suite.ontologyIri}/${released}> ;`, 'owl:priorVersion', file)
    text = replaceOnce(text, /mod:status "released"@en/, 'mod:status "under development"@en', 'mod:status', file)
  }

  writeFileSync(path, text, 'utf8')
}

// Profiles: imports and artifacts return to the mutable retrieval IRIs, which
// is where the manifest says each module actually answers.
const frozenToMutable = new Map([
  ...manifest.modules.map((m) => [`${base}${m.source.path.split('/').pop()}`, m.publication.persistentUrl]),
  ...manifest.profiles.map((p) => [`${base}${p.source.path.split('/').pop()}`, p.publication.persistentUrl]),
  [`${base}manifest`, `${manifest.suite.ontologyIri}/manifest`],
])

for (const profile of manifest.profiles) {
  const file = profile.source.path
  const path = join(ROOT, file)
  let text = dropVersionIri(bumpVersion(readFileSync(path, 'utf8'), file), file)

  let rewritten = 0
  text = text.replace(/<https:\/\/w3id\.org\/sstim\/[^>]+>/g, (iri) => {
    const mutable = frozenToMutable.get(iri.slice(1, -1))
    if (!mutable) return iri
    rewritten += 1
    return `<${mutable}>`
  })
  if (rewritten === 0) throw new Error(`${file}: no frozen IRI to return to the mutable line`)

  writeFileSync(path, text, 'utf8')
}

manifest.$schema = 'https://w3id.org/sstim/manifest-schema/1'
manifest.suite.version = next
manifest.suite.status = 'development'
delete manifest.immutableRelease
for (const entry of [...manifest.modules, ...manifest.profiles]) {
  entry.version = next
  if (entry.status) entry.status = 'development'
  delete entry.publication.versionedUrl
}
writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

console.log(`release-open-dev: ${released} → ${next}`)
console.log(`  ${manifest.modules.length} modules, ${manifest.profiles.length} profile entry points, 1 manifest`)
console.log('  void.ttl, CITATION.cff and the entrance metadata still describe ' + released + ', by design')
console.log('  next: node scripts/sstim-manifest.mjs sync-checksums, then `make validate`')
