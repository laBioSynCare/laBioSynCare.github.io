#!/usr/bin/env node
// Generate `codemeta.json` from the metadata the repository already maintains.
//
// CodeMeta is what software registries and harvesters read — Software Heritage,
// re3data-style catalogues, and the growing set of research-software indexes
// that will not parse CITATION.cff. Without it, a repository that carries a DOI,
// an ORCID, a license matrix and a release train is invisible to them.
//
// It is *generated*, not written, for the reason `truth-audit.mjs` states: a
// second hand-maintained copy of the release identity is a second place to
// forget. Every fact here is derived from CITATION.cff (citation identity),
// void.ttl (the citable release and its DOIs) and src/ui/externalLinks.js (the
// canonical off-repository URLs).
// `make codemeta-check` fails when the committed file no longer matches.
//
// Usage:  node scripts/gen-codemeta.mjs [--check]

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TARGET = resolve(ROOT, 'codemeta.json')

const read = (p) => readFileSync(resolve(ROOT, p), 'utf8')

/**
 * Pull one scalar out of CITATION.cff.
 *
 * A YAML parser is not a dependency here and adding one for six fields is not
 * worth it — `truth-audit.mjs` reads the same file the same way. Folded block
 * scalars (`>-`) are joined back into one line, which is what they mean.
 */
function cffField(cff, name) {
  const folded = cff.match(new RegExp(`^${name}:\\s*>-?\\s*\\n((?:\\s{2,}.*\\n)+)`, 'm'))
  if (folded) return folded[1].trim().split('\n').map((l) => l.trim()).join(' ')
  const plain = cff.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))
  return plain ? plain[1].trim().replace(/^["']|["']$/g, '') : undefined
}

/** The `keywords:` list — one `- value` per line until the block ends. */
function cffKeywords(cff) {
  const block = cff.match(/^keywords:\s*\n((?:\s+-\s.*\n?)+)/m)
  if (!block) return []
  return block[1]
    .split('\n')
    .map((line) => line.match(/^\s+-\s+(.*)$/)?.[1]?.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean)
}

/** The `authors:` list. Only the fields CodeMeta has a home for. */
function cffAuthors(cff) {
  const block = cff.match(/^authors:\s*\n((?:\s+[-\s].*\n?)+?)(?=^\S|\Z)/m)
  if (!block) return []
  return block[1]
    .split(/^\s+-\s/m)
    .slice(1)
    .map((entry) => {
      const field = (name) =>
        entry.match(new RegExp(`${name}:\\s*(.+)`))?.[1]?.trim().replace(/^["']|["']$/g, '')
      const person = { '@type': 'Person' }
      const orcid = field('orcid')
      if (orcid) person['@id'] = orcid
      const given = field('given-names')
      const family = field('family-names')
      if (given) person.givenName = given
      if (family) person.familyName = family
      const email = field('email')
      if (email) person.email = email
      return person
    })
}

/** Read a canonical URL out of the UI's single source for off-app destinations. */
function externalLink(source, name) {
  return source.match(new RegExp(`^export const ${name} = '([^']+)'`, 'm'))?.[1]
}

export function buildCodemeta({ cff, voidTtl, links }) {
  const conceptDoi = voidTtl.match(/dct:identifier\s+"([^"]+)"/)?.[1]
  const versionDoi = voidTtl.match(/dct:hasVersion\s+<(https:\/\/doi\.org\/[^>]+)>/)?.[1]
  const releaseVersion = voidTtl.match(/dcat:version\s+"([^"]+)"/)?.[1]
  const repository = externalLink(links, 'GITHUB_URL')
  const group = externalLink(links, 'W3C_GROUP_URL')

  const missing = Object.entries({ conceptDoi, versionDoi, releaseVersion, repository, group })
    .filter(([, value]) => !value)
    .map(([name]) => name)
  if (missing.length > 0) {
    throw new Error(`gen-codemeta: could not derive ${missing.join(', ')}`)
  }

  return {
    '@context': 'https://doi.org/10.5063/schema/codemeta-2.0',
    '@type': 'SoftwareSourceCode',
    // The all-versions concept DOI. It names the line, not one release, which
    // is what a repository-root record describes.
    identifier: `https://doi.org/${conceptDoi}`,
    name: cffField(cff, 'title'),
    description: cffField(cff, 'abstract'),
    // The citable release, not package.json's application version. They are
    // deliberately different facts (truth-audit.mjs); this file describes the
    // one that has a DOI.
    version: releaseVersion,
    softwareVersion: releaseVersion,
    datePublished: cffField(cff, 'date-released'),
    // Two grants, per LICENSING.md: Apache-2.0 for `src/` and `scripts/`,
    // CC BY 4.0 for `static/ontology/` and `docs/`. One SPDX identifier would
    // be a false simplification of a repository that publishes both.
    license: [
      'https://spdx.org/licenses/Apache-2.0',
      'https://spdx.org/licenses/CC-BY-4.0',
    ],
    codeRepository: cffField(cff, 'repository-code'),
    url: cffField(cff, 'url'),
    issueTracker: `${repository}/issues`,
    readme: `${repository}/blob/main/README.md`,
    author: cffAuthors(cff),
    maintainer: cffAuthors(cff),
    // The Community Group produces the specification. `producer` records that
    // without asserting W3C endorsement, which `publisher` would imply.
    producer: {
      '@type': 'Organization',
      name: 'W3C Sensory Stimulation Vocabulary Community Group',
      url: group,
    },
    keywords: cffKeywords(cff),
    programmingLanguage: ['JavaScript', 'Svelte', 'Python'],
    runtimePlatform: ['Node.js', 'Web browser'],
    applicationCategory: 'Semantic Web',
    developmentStatus: 'active',
    relatedLink: ['https://w3id.org/sstim', group, versionDoi],
  }
}

export function generate() {
  return `${JSON.stringify(
    buildCodemeta({
      cff: read('CITATION.cff'),
      voidTtl: read('static/ontology/void.ttl'),
      links: read('src/ui/externalLinks.js'),
    }),
    null,
    2,
  )}\n`
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const generated = generate()
  if (process.argv.includes('--check')) {
    let current = null
    try {
      current = readFileSync(TARGET, 'utf8')
    } catch {
      console.error('codemeta-check: codemeta.json is missing — run `make codemeta`')
      process.exit(1)
    }
    if (current !== generated) {
      console.error('codemeta-check: codemeta.json is stale — run `make codemeta`')
      process.exit(1)
    }
    console.log('codemeta-check: passed')
  } else {
    writeFileSync(TARGET, generated)
    console.log(`codemeta: wrote ${TARGET}`)
  }
}
