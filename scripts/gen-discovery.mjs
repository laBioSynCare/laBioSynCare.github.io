#!/usr/bin/env node
// Publish the discovery surfaces alongside the built site: robots.txt,
// sitemap.xml, llms.txt and llms-full.txt.
//
// None of these could be committed as static files, which is why they did not
// exist. All four need the *absolute* origin the artifact is served from, and
// this build is published to two of them in parallel — `labiosyncare.github.io`
// at the origin root and `w3c-cg.github.io/sstim/` under a mount
// (docs/ecosystem/W3C_REPOSITORY_MIGRATION.md). A hand-written sitemap would be
// wrong on one of them by construction.
//
// So the origin is resolved the same way `pages.yml` resolves the base path,
// from the owner of the repository being built, and the page list is read out of
// the build itself rather than restated. A route that stops being prerendered
// leaves the sitemap on its own.
//
// One caveat is worth stating in the file it affects: robots.txt is honoured
// only at an origin root. On the project-site mount it is written for
// completeness and for anyone serving the same artifact at a root, but the
// crawler directives that apply to `w3c-cg.github.io/sstim/` are whatever
// `w3c-cg.github.io/robots.txt` says, which this repository does not own.
//
// Usage:  node scripts/gen-discovery.mjs [distDir]

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(resolve(ROOT, p), 'utf8')

/**
 * Where this artifact will be served from, as scheme + host, with no trailing
 * slash. `SSTIM_SITE_ORIGIN` wins so a self-hosted deployment
 * (docs/technical/PORTABLE_DEPLOYMENT.md) can state its own; otherwise it is
 * derived from the GitHub owner, which is exactly how the workflow derives the
 * mount. Returns null when neither is available — a local `make build` should
 * not bake one deployment's hostname into another's artifact.
 */
export function resolveOrigin(env = process.env) {
  const explicit = env.SSTIM_SITE_ORIGIN?.trim()
  if (explicit) return explicit.replace(/\/+$/, '')
  const owner = env.GITHUB_REPOSITORY_OWNER?.trim()
  if (owner) return `https://${owner.toLowerCase()}.github.io`
  return null
}

/** Every prerendered page in the build, as mount-relative paths, `/` first. */
export function collectPages(distDir) {
  const pages = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir).sort()) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (entry === 'index.html') {
        const rel = relative(distDir, dir).split('\\').join('/')
        pages.push(rel === '' ? '/' : `/${rel}/`)
      }
    }
  }
  walk(distDir)
  return pages.sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)))
}

export function buildRobots({ siteRoot, base }) {
  const mountNote =
    base === ''
      ? ''
      : `#\n# This build is mounted at ${base}. A crawler reads robots.txt only from the\n` +
        `# origin root, so the directives that actually govern ${siteRoot}/\n` +
        `# live in the origin owner's own robots.txt, not here.\n`
  return (
    `# SSTIM: Sensory Stimulation Vocabulary.\n` +
    `# Open ontology, SKOS vocabulary, SHACL shapes and reference tooling for\n` +
    `# describing sensory-stimulation protocols, stimuli, parameters and events.\n` +
    mountNote +
    `\n` +
    `User-agent: *\n` +
    `Allow: /\n` +
    `\n` +
    `Sitemap: ${siteRoot}/sitemap.xml\n`
  )
}

export function buildSitemap({ siteRoot, pages }) {
  const urls = pages
    .map((page) => `  <url>\n    <loc>${siteRoot}${page === '/' ? '/' : page}</loc>\n  </url>`)
    .join('\n')
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  )
}

/**
 * The curated link table behind llms.txt.
 *
 * `site` paths are resolved against the deployed mount and must exist in the
 * build; `repo` paths are resolved against the source repository and must exist
 * in the working tree. `gen-discovery.test.mjs` checks both, so a moved file
 * fails a test instead of publishing a dead link to a machine reader.
 */
export const LLMS_SECTIONS = [
  {
    title: 'Start here',
    links: [
      ['SSTIM overview and status', { repo: 'README.md' }, 'what SSTIM is, what exists now, and where every version fact is derived from'],
      ['Scope', { repo: 'docs/concept/SCOPE.md' }, 'what SSTIM claims'],
      ['Non-scope', { repo: 'docs/concept/NON_SCOPE.md' }, 'what SSTIM explicitly does not claim; read before inferring capability'],
      ['Sensory stimulation, the domain', { repo: 'docs/concept/SENSORY_STIMULATION.md' }, 'the field being modelled: rhythmic sensory stimulation, entrainment paradigms, modalities'],
      ['Current state of the ontology', { repo: 'docs/ontology/CURRENT_STATE.md' }, 'what the model holds today, as opposed to where it is going'],
    ],
  },
  {
    title: 'Vocabulary and ontology',
    links: [
      ['Term index', { repo: 'docs/ontology/TERM_INDEX.md' }, 'every class, property and SKOS concept with its module and definition, generated and CI-checked; the fastest answer to "does SSTIM have a term for X"'],
      ['Module manifest', { site: '/ontology/manifest.json' }, 'machine-readable inventory of the modules and the four profile entry points; authoritative'],
      ['JSON-LD context', { site: '/ontology/context.jsonld' }, 'for JSON-LD serialisations of SSTIM data'],
      ['OWL core module', { site: '/ontology/sstim-core.ttl' }, 'Turtle'],
      ['SKOS vocabulary module', { site: '/ontology/sstim-vocab.ttl' }, 'Turtle; concepts are dual-typed as skos:Concept and their OWL class'],
      ['External alignments', { site: '/ontology/sstim-alignments.ttl' }, 'mappings to adjacent vocabularies, with match strength stated per mapping'],
      ['VoID/DCAT description', { site: '/ontology/void.ttl' }, 'the citable release, its version DOI and the graph counts'],
      ['Ontology design notes', { repo: 'static/ontology/README.md' }, 'why the model is shaped the way it is'],
      ['Module architecture', { repo: 'docs/ontology/MODULE_ARCHITECTURE.md' }, 'how the modules depend on one another'],
      ['OWL reference documentation', { site: '/ontology/docs/' }, 'generated HTML (WIDOCO)'],
      ['SKOS reference documentation', { site: '/ontology/docs/vocab/' }, 'generated HTML (pyLODE)'],
    ],
  },
  {
    title: 'Profiles and validation',
    links: [
      ['Kernel profile', { site: '/ontology/sstim-kernel-profile.ttl' }, 'shapeless discovery profile'],
      ['Core profile', { site: '/ontology/sstim-core-profile.ttl' }, 'conformance target'],
      ['Core Plus profile', { site: '/ontology/sstim-core-plus-profile.ttl' }, 'conformance target'],
      ['Full profile', { site: '/ontology/sstim-full-profile.ttl' }, 'conformance target'],
      ['SHACL shapes', { site: '/ontology/sstim-shapes.ttl' }, 'the shape package validated against the profile closures'],
      ['Preset JSON Schema', { site: '/schemas/preset.schema.json' }, 'checked against the SHACL shapes and the documented ranges by `make preset-contract`'],
      ['Session JSON Schema', { site: '/schemas/session.schema.json' }, 'the native session contract; `make session-contract`'],
    ],
  },
  {
    title: 'Data model',
    links: [
      ['Preset format', { repo: 'docs/technical/PRESET_FORMAT.md' }, 'the catalog preset specification'],
      ['Session model', { repo: 'docs/technical/SESSION_MODEL.md' }, 'executions, events and observations'],
      ['Evidence framework', { repo: 'docs/concept/EVIDENCE_FRAMEWORK.md' }, 'how evidence claims are represented; evidence metadata is not evidence'],
      ['Where the model is going', { repo: 'docs/ontology/SSTIM_DIRECTIONS.md' }, 'read before adding terms'],
    ],
  },
  {
    title: 'Interoperability',
    links: [
      ['HED and BIDS event profile', { repo: 'docs/ecosystem/HED_BIDS_INTEROP.md' }, 'the layered contract, the current event-model limitation and the minimum bridge that would close it'],
      ['HED event map', { site: '/schemas/sstim-hed-event-map.json' }, 'the versioned crosswalk used to generate HED annotations'],
    ],
  },
  {
    title: 'SSTIM Workbench',
    links: [
      ['Workbench entrance', { site: '/' }, 'the non-normative executable reference environment; previously developed as BSC Lab'],
      ['Graph Navigator', { site: '/graph/' }, 'browse the OWL/SKOS graph'],
      ['SPARQL interface', { site: '/sparql/' }, 'query the ontology in the browser'],
      ['Patch Studio', { site: '/creator/' }, 'author stimulation patches; its authoring model is a Workbench model, not the catalog preset format'],
      ['Reference presets', { site: '/presets/' }, 'public example data'],
      ['Ecosystem directory', { site: '/ecosystem/' }, 'applications and initiatives, and how ecosystem membership is defined'],
      ['Patch Studio conformance and neutrality', { repo: 'docs/ecosystem/PATCH_STUDIO_CONFORMANCE_AND_NEUTRALITY.md' }, 'which Workbench behaviour is SSTIM and which is not'],
    ],
  },
  {
    title: 'Governance and citation',
    links: [
      ['Community Group charter', { repo: 'CHARTER.md' }, 'draft; the group is launched and the charter is not yet ratified'],
      ['Decision records', { repo: 'docs/decisions/README.md' }, 'the architectural and ontology decisions, with their reasoning'],
      ['Licensing', { repo: 'LICENSING.md' }, 'Apache-2.0 for the software, CC BY 4.0 for the ontology and documentation'],
      ['Contributing', { repo: 'CONTRIBUTING.md' }, ''],
      ['How to cite', { repo: 'CITATION.cff' }, ''],
      ['CodeMeta record', { repo: 'codemeta.json' }, ''],
      ['Changelog', { repo: 'CHANGELOG.md' }, ''],
    ],
  },
]

/** The documents llms-full.txt inlines, in reading order. */
export const LLMS_FULL_DOCUMENTS = [
  'README.md',
  'docs/concept/SCOPE.md',
  'docs/concept/NON_SCOPE.md',
  'docs/ontology/CURRENT_STATE.md',
  'docs/ontology/TERM_INDEX.md',
  'CHARTER.md',
  'CITATION.cff',
]

export function buildLlmsIndex({ siteRoot, repository, facts }) {
  const target = ({ site, repo }) =>
    site ? `${siteRoot}${site}` : `${repository}/blob/main/${repo}`

  const sections = LLMS_SECTIONS.map((section) => {
    const links = section.links
      .map(([label, ref, note]) => `- [${label}](${target(ref)})${note ? `: ${note}` : ''}`)
      .join('\n')
    return `## ${section.title}\n\n${links}\n`
  }).join('\n')

  return (
    `# SSTIM: Sensory Stimulation Vocabulary\n` +
    `\n` +
    `> An open ontology, SKOS vocabulary and SHACL validation suite for describing ` +
    `sensory-stimulation protocols, stimuli, modalities, parameters, exposure boundaries, ` +
    `evidence claims, executions and session events. Developed through the W3C Sensory ` +
    `Stimulation Vocabulary Community Group. Community Group work is not a W3C ` +
    `Recommendation and is not W3C-endorsed technology.\n` +
    `\n` +
    `Persistent namespace: https://w3id.org/sstim (registered and live). ` +
    `Development line ${facts.developmentVersion}; latest citable release ${facts.releaseVersion}, ` +
    `DOI ${facts.versionDoi}; all-version concept DOI ${facts.conceptDoi}. ` +
    `${facts.moduleCount} manifest-owned Turtle modules behind ${facts.profileCount} profile entry points.\n` +
    `\n` +
    `The work is non-clinical. SSTIM represents evidence claims; it does not create, ` +
    `certify or evaluate evidence, and modelling a technique is not a statement that it works.\n` +
    `\n` +
    `${sections}\n` +
    `## Consolidated\n` +
    `\n` +
    `- [llms-full.txt](${siteRoot}/llms-full.txt): the canonical explanatory documents inlined in one file\n`
  )
}

export function buildLlmsFull({ documents }) {
  const header =
    `# SSTIM: Sensory Stimulation Vocabulary (consolidated documentation)\n` +
    `\n` +
    `Generated from the repository's canonical sources by scripts/gen-discovery.mjs.\n` +
    `Each section below is one file, reproduced verbatim. Do not edit this file;\n` +
    `edit the source it names.\n`

  const body = documents
    .map(({ path, text }) => `\n\n---\n\n# File: ${path}\n\n${text.trimEnd()}\n`)
    .join('')

  return `${header}${body}`
}

/** The release facts, derived rather than restated (see truth-audit.mjs). */
export function deriveFacts({ manifest, voidTtl }) {
  return {
    developmentVersion: manifest.suite.version,
    moduleCount: manifest.modules.length,
    profileCount: manifest.profiles.length,
    releaseVersion: voidTtl.match(/dcat:version\s+"([^"]+)"/)?.[1],
    versionDoi: voidTtl.match(/dct:hasVersion\s+<https:\/\/doi\.org\/([^>]+)>/)?.[1],
    conceptDoi: voidTtl.match(/dct:identifier\s+"([^"]+)"/)?.[1],
  }
}

function main() {
  const distDir = resolve(ROOT, process.argv[2] ?? 'dist')
  const base = process.env.SSTIM_BASE_PATH ?? ''
  const origin = resolveOrigin()
  const facts = deriveFacts({
    manifest: JSON.parse(read('static/ontology/manifest.json')),
    voidTtl: read('static/ontology/void.ttl'),
  })
  const repository = read('src/ui/externalLinks.js').match(
    /^export const GITHUB_URL = '([^']+)'/m,
  )?.[1]

  if (!origin) {
    console.log(
      'discovery: no SSTIM_SITE_ORIGIN and no GITHUB_REPOSITORY_OWNER, skipped ' +
        '(these files need the absolute origin they will be served from)',
    )
    return
  }

  const siteRoot = `${origin}${base}`
  const pages = collectPages(distDir)
  const documents = LLMS_FULL_DOCUMENTS.map((path) => ({ path, text: read(path) }))

  const written = {
    'robots.txt': buildRobots({ siteRoot, base }),
    'sitemap.xml': buildSitemap({ siteRoot, pages }),
    'llms.txt': buildLlmsIndex({ siteRoot, repository, facts }),
    'llms-full.txt': buildLlmsFull({ documents }),
  }
  for (const [name, content] of Object.entries(written)) {
    writeFileSync(join(distDir, name), content)
  }
  console.log(
    `discovery: ${siteRoot}, sitemap ${pages.length} pages, ` +
      `llms-full ${LLMS_FULL_DOCUMENTS.length} documents`,
  )
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main()
}
