import { expect, test } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Parser } from 'n3'

import { expandRule } from './check-w3id-route-targets.mjs'
import { loadRules, resolveRoute } from './w3id-negotiation.mjs'
// The deep-link targets are graph-browser hashes, so the prefixes they use have
// to be the ones the browser resolves against — assert against the real table
// rather than restating it.
import { PREFIXES, toCurie } from '../src/rdf/namespaces.js'
import { buildGraphElements } from '../src/rdf/graph.js'
import { logicalApplicationPath } from '../src/config/applicationUrls.js'
import {
  INSTANCE_URLS,
  mergeStores,
  navigatorSources,
  parseIntoStore,
} from '../src/rdf/loader.js'

const rules = loadRules()
const ONTOLOGY = 'https://w3c-cg.github.io/sstim/ontology/'
// The application entrance, where a namespace catalog sends HTML.
const APPLICATION = 'https://w3c-cg.github.io/sstim/'
const BROWSER = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
const SSTIM = 'https://w3id.org/sstim#'

function go(path, accept) {
  const { status, location } = resolveRoute(path, accept, rules)
  return { status, doc: location?.replace(ONTOLOGY, '') ?? null }
}

function typedSubjects(sourceUrls, typeIri) {
  const records = []
  for (const sourceUrl of sourceUrls) {
    const sourcePath = join(
      repoRoot,
      'static',
      logicalApplicationPath(sourceUrl).replace(/^\//, ''),
    )
    const quads = new Parser().parse(readFileSync(sourcePath, 'utf8'))
    const subjects = new Set(quads
      .filter((quad) => quad.predicate.value === RDF_TYPE && quad.object.value === typeIri)
      .map((quad) => quad.subject.value))
    for (const iri of subjects) records.push({ iri, sourceUrl })
  }
  return records.sort((a, b) => a.iri.localeCompare(b.iri))
}

function sstimPath(iri) {
  const base = 'https://w3id.org/sstim/'
  expect(iri.startsWith(base), `${iri} is outside the SSTIM route base`).toBe(true)
  return iri.slice(base.length)
}

function graphEntityIri(target) {
  const curie = decodeURIComponent(new URL(target).hash.slice(1))
  const colon = curie.indexOf(':')
  if (colon < 1) throw new Error(`Graph entity target is not a CURIE: ${target}`)
  const prefix = curie.slice(0, colon)
  const base = PREFIXES[prefix]
  if (!base) throw new Error(`Graph entity target uses an unknown prefix: ${target}`)
  return base + curie.slice(colon + 1)
}

function routedCatalogEntityIris() {
  return rules
    .filter(({ target }) => /\/graph\/#(?:bsclab-preset|sstim-ref):/.test(target))
    .flatMap(({ pattern, target }) => expandRule(pattern, target))
    .map(graphEntityIri)
    .sort()
}

async function buildLocalCatalogGraph(sourceUrls) {
  const wanted = new Set(sourceUrls)
  const sources = navigatorSources({ includeLive: false })
    .filter(({ url }) => wanted.has(url))

  // This equality is intentional: loading whichever subset happens to remain
  // would let a dropped navigator source turn the projection assertion into a
  // partial check. The route contract and the Graph source boundary must move
  // together.
  expect(sources.map(({ url }) => url).sort()).toEqual([...wanted].sort())

  const stores = await Promise.all(sources.map((source) => {
    const sourcePath = join(
      repoRoot,
      'static',
      logicalApplicationPath(source.url).replace(/^\//, ''),
    )
    return parseIntoStore(
      readFileSync(sourcePath, 'utf8'),
      source.format ?? 'text/turtle',
      source.graph,
    )
  }))
  return buildGraphElements(mergeStores(...stores))
}

test('each namespace and module route serves the document it advertises', () => {
  expect(go('', 'text/turtle').doc).toBe('latest/sstim-namespace.ttl')
  expect(go('', 'application/ld+json').doc).toBe('latest/sstim-namespace.jsonld')
  expect(go('', 'application/rdf+xml').doc).toBe('latest/sstim-namespace.rdf')

  // The two endpoints whose namespace IRI is occupied by a multi-module
  // catalogue. Confusing these is the mistake the split makes easy.
  expect(go('kernel', 'text/turtle').doc).toBe('sstim-core.ttl')
  expect(go('exposure', 'text/turtle').doc).toBe('sstim-exposure-namespace.ttl')
  expect(go('module/exposure', 'text/turtle').doc).toBe('sstim-exposure.ttl')

  expect(go('stimulus', 'text/turtle').doc).toBe('sstim-stimulus.ttl')
  expect(go('profile/core', 'text/turtle').doc).toBe('sstim-core-profile.ttl')
  expect(go('profile/full', 'application/rdf+xml').doc).toBe('sstim-full-profile.rdf')
  expect(go('manifest', 'application/json').doc).toBe('manifest.json')
  expect(go('manifest-schema/1', '*/*').doc).toBe('manifest.schema.json')
})

test('Turtle is the default, including for an absent or wildcard Accept', () => {
  expect(go('', '').doc).toBe('latest/sstim-namespace.ttl')
  expect(go('', '*/*').doc).toBe('latest/sstim-namespace.ttl')
})

test('q=0 makes a type unacceptable without poisoning the others', () => {
  // Only type offered is refused by the client, so nothing is acceptable.
  expect(go('', 'application/ld+json;q=0').status).toBe(406)
  expect(go('', 'application/n-triples').status).toBe(406)

  // q=0 on a different type must not suppress the one actually requested.
  expect(go('', 'application/ld+json, text/html;q=0').doc).toBe('latest/sstim-namespace.jsonld')
})

test('a namespace catalog sends HTML to the application, so a term fragment resolves', () => {
  // A server never sees the fragment, so /sstim/exposure and
  // /sstim/exposure#StimulusChannelRole arrive identically and one destination
  // has to serve both. The generated index cannot serve the second: measured
  // 2026-08-23, WIDOCO anchors by full IRI while the browser carries the bare
  // local name, so nothing matched and the reader landed at the top of the page.
  // Both namespace catalogs therefore point at a surface that reads the fragment
  // client-side: /sstim/exposure at the application directly, and /sstim at the
  // namespace page, which forwards any fragment to the same knowledge browser
  // (ADR 0055). What matters to this test is that neither sends a term IRI to a
  // generated index that cannot anchor it.
  expect(go('', BROWSER).doc).toBe(`${APPLICATION}namespace/`)
  expect(go('exposure', BROWSER).doc).toBe(APPLICATION)
  expect(go('exposure', 'text/html').doc).toBe(APPLICATION)
  // Only HTML changes. Every RDF representation still serves the catalog.
  expect(go('exposure', 'text/turtle').doc).toBe('sstim-exposure-namespace.ttl')
  expect(go('exposure', 'application/ld+json').doc).toBe('sstim-exposure-namespace.jsonld')
  // A module id is not a namespace catalog: no fragment arrives, so the
  // reference index stays the right answer.
  expect(go('module/exposure', BROWSER).doc).toBe('docs/')
  expect(go('stimulus', BROWSER).doc).toBe('docs/')
})

test('a multi-module hash namespace resolves HTML to the application', () => {
  // sstim-v: is defined across vocab, alignments and technique-exposure, and
  // sstim-eco: across ecosystem, shapes and the private shapes module, so a
  // term fragment reaches these routes exactly as it reaches /sstim and
  // /sstim/exposure.
  expect(go('vocab', BROWSER).doc).toBe(APPLICATION)
  expect(go('ecosystem', BROWSER).doc).toBe(APPLICATION)
  // RDF representations are untouched.
  expect(go('vocab', 'text/turtle').doc).toBe('sstim-vocab.ttl')
  expect(go('ecosystem', 'application/ld+json').doc).toBe('sstim-ecosystem.jsonld')
})

test('shape namespaces stay on the reference index', () => {
  // Measured 2026-08-23: /graph/#AudioTrackShape selects nothing, because SHACL
  // shapes are not drawable nodes. Routing a shape IRI to the application would
  // land the reader on a graph with no selection, which is worse than a page
  // that at least documents the shape. Revisit if shapes become drawable.
  expect(go('shapes', BROWSER).doc).toBe('docs/')
  expect(go('core-shapes', BROWSER).doc).toBe('docs/')
})

test('a browser reaches human documentation, not RDF', () => {
  // The root is the one HTML target outside /ontology/. It used to be the
  // application entrance, a four-door product page that never told a visitor
  // they had followed a namespace IRI; ADR 0055 gave it a page that says what
  // this identifier is and which IRIs belong to it, and that hands any fragment
  // to the knowledge browser the way the entrance did.
  expect(go('', BROWSER).doc).toBe('https://w3c-cg.github.io/sstim/namespace/')
  expect(go('', 'text/html').doc).toBe('https://w3c-cg.github.io/sstim/namespace/')
  expect(go('kernel', BROWSER).doc).toBe('docs/')
  expect(go('profile/core', BROWSER).doc).toBe('docs/')
})

test('the bare ontology IRI serves a release, never the working tree', () => {
  // The defect ADR 0055 closed, pinned so it cannot come back: /sstim answered
  // RDF clients from the deployment's top-level build, which declared
  // owl:versionInfo "0.17.0-dev", mod:status "under development" and no
  // owl:versionIRI at all. An ontology IRI returning a graph nobody can pin or
  // cite is what LOV and Archivo would have harvested as SSTIM.
  //
  // `latest/` rather than a version-shaped path is deliberate: a versioned
  // target would cost a pull request against perma-id/w3id.org on every release,
  // which is exactly what ADR 0053 removed at the maintainer's request.
  for (const accept of ['text/turtle', 'application/ld+json', 'application/rdf+xml', '*/*', '']) {
    const doc = go('', accept).doc
    expect(doc.startsWith('latest/')).toBe(true)
    expect(doc).not.toMatch(/^sstim-namespace\./)
  }
})

test('the SKOS vocabulary keeps its own documentation page, one link away', () => {
  // This test used to require /sstim/vocab to resolve to pyLODE's page, on the
  // reasoning that sending a vocabulary reader to the OWL reference index is a
  // wrong answer rather than a worse one. That reasoning held for a reader
  // asking about the vocabulary and overlooked the reader following a term IRI,
  // who is the more common case and was being served worst of all: pyLODE
  // anchors by label (id="Alpha"), the browser carries the local name
  // (#alpha), and nothing matched.
  //
  // The page did not move. It keeps its address, it keeps its generator, and
  // every vocabulary term in the knowledge browser links to its entry there.
  // What changed is which of the two readers the ambiguous URL serves first.
  expect(go('vocab', 'text/html').doc).toBe(APPLICATION)
  expect(go('vocab', 'application/ld+json').doc).toBe('sstim-vocab.jsonld')
  expect(go('shapes', 'text/html').doc).toBe('docs/')
})

test('an entity IRI deep-links to that entity, never to the entrance', () => {
  // This is the test whose absence cost the work twice. perma-id/w3id.org#6393
  // replaced these targets with per-entity graph deep links; #6480 rewrote the
  // file from an older base and reverted every one of them, unnoticed, because
  // nothing here described the intent. An entity IRI answering a browser with a
  // landing page is the classic linked-data failure: the reader learns that the
  // project exists and nothing about the thing they asked for.
  const APP = 'https://w3c-cg.github.io/sstim/'
  const graph = (path) => go(path, BROWSER).doc?.replace(APP + 'graph/', '')

  expect(graph('ecosystem/biosyncare')).toBe('#sstim-ecosystem:biosyncare')
  expect(graph('framework/bsc')).toBe('#bsc-fw:')
  expect(graph('implementation/bsclab')).toBe('#bsclab:')
  expect(graph('implementation/biosyncare')).toBe('#biosyncare:')
  expect(graph('implementation/bsclab/component/patch-studio'))
    .toBe('#bsclab:component/patch-studio')

  // Originated techniques → their framework node.
  expect(graph('framework/bsc/technique/martigli-breathing-oscillation'))
    .toBe('#bsc-fw-tech:martigli-breathing-oscillation')
  expect(graph('framework/bsc/technique/symmetry-permutation-entrainment'))
    .toBe('#bsc-fw-tech:symmetry-permutation-entrainment')
  // Retired in ADR 0033 → the vendor-neutral concept that replaced each.
  expect(graph('framework/bsc/technique/binaural-beat-stimulation')).toBe('#techBinauralBeats')
  expect(graph('framework/bsc/technique/vibrotactile-rhythm-stimulation'))
    .toBe('#techVibrotactileEntrainment')

  // Both capture groups reach the hash: kind and local name.
  expect(graph('specialist/renato-fabbri')).toBe('#sstim-specialist:renato-fabbri')
  expect(graph('organization/ifsc-usp')).toBe('#sstim-organization:ifsc-usp')
  expect(graph('ecosystem-record/role/curator-2026'))
    .toBe('#sstim-ecosystem-record:role/curator-2026')

  // Every hash prefix above must be one the browser can actually resolve.
  for (const prefix of ['bsc-fw', 'bsc-fw-tech', 'bsclab', 'biosyncare',
    'sstim-specialist', 'sstim-organization', 'sstim-ecosystem-record',
    'sstim-ecosystem']) {
    expect(PREFIXES, `${prefix}: is not a registered prefix`).toHaveProperty(prefix)
  }

  // The programme instance path and the OWL module that shares its first
  // segment are different resources; `ecosystem` is matched exactly, so the
  // module rule must never swallow /ecosystem/{id}.
  expect(go('ecosystem', 'text/turtle').doc).toBe('sstim-ecosystem.ttl')
  expect(go('ecosystem/biosyncare', 'text/turtle').doc)
    .toBe('instances/programmes/biosyncare-ecosystem.ttl')

  // RDF representations are untouched by the deep links.
  expect(go('framework/bsc', 'text/turtle').doc).toBe('instances/frameworks/bsc.ttl')
  expect(go('specialist/renato-fabbri', '*/*').doc)
    .toBe('https://biosyncare-lab.web.app/current.ttl')

  // The reserved fixture prefix stays outside the live routes, in both
  // representations — a synthetic record must not resolve at all.
  expect(go('specialist/synthetic-someone', BROWSER).status).toBe(404)
  expect(go('specialist/synthetic-someone', 'text/turtle').status).toBe(404)
})

test('every committed public preset and reference has an exact entity route', () => {
  // Derive the inventory from the same committed source map the app loads.
  // Adding a public Preset or PublicSafeReference without adding an audited
  // w3id route therefore fails here instead of shipping a copied IRI that 404s.
  const presets = typedSubjects(INSTANCE_URLS.presets, SSTIM + 'Preset')
  const references = typedSubjects(INSTANCE_URLS.references, SSTIM + 'PublicSafeReference')

  expect(presets).toHaveLength(2)
  // 7 + the four neural-oscillation references ADR 0049 added, each verified
  // through Crossref before being written and each given an exact route below.
  expect(references).toHaveLength(11)

  for (const { iri, sourceUrl } of [...presets, ...references]) {
    const path = sstimPath(iri)
    const sourceDoc = logicalApplicationPath(sourceUrl).replace(/^\/ontology\//, '')
    const html = go(path, BROWSER)

    expect(html.status, `${iri} has no browser route`).toBe(303)
    expect(html.doc, `${iri} does not deep-link to its graph node`)
      .toBe(`https://w3c-cg.github.io/sstim/graph/#${toCurie(iri)}`)
    expect(go(path, 'text/turtle').doc, `${iri} does not return its owning Turtle`)
      .toBe(sourceDoc)
    expect(go(path, '').doc, `${iri} does not default to its owning Turtle`)
      .toBe(sourceDoc)
    expect(go(path, 'application/ld+json').status).toBe(406)
  }

  // These static namespaces are deliberately fail-closed. An aggregate Turtle
  // file must never make an uncommitted identifier appear to be a public record.
  for (const path of [
    'implementation/bsclab/preset/not-a-public-preset',
    'implementation/bsclab/preset/heal-theta-breathing-seed/voice',
    'ref/NOT_A_COMMITTED_REFERENCE',
    'ref/ingendoh_2023',
  ]) {
    expect(go(path, BROWSER).status, `${path} acquired a broad HTML route`).toBe(404)
    expect(go(path, 'text/turtle').status, `${path} acquired a broad RDF route`).toBe(404)
  }

  expect(PREFIXES).toHaveProperty('bsclab-preset')
  expect(PREFIXES).toHaveProperty('sstim-ref')

  const entityHashRules = rules.filter(({ target }) =>
    target.includes('/graph/#bsclab-preset:') || target.includes('/graph/#sstim-ref:'),
  )
  expect(entityHashRules).toHaveLength(2)
  for (const rule of entityHashRules) {
    expect(rule.flags, `${rule.pattern} must preserve its literal # fragment`).toContain('NE')
  }
})

test('every routed public preset and reference is materialized as a Graph node', async () => {
  // Start from the actual browser-route targets, expand their audited
  // alternations, and resolve the same CURIEs the Graph receives. Starting
  // from the RDF inventory alone would miss a stale extra route and could pass
  // vacuously if the route block disappeared.
  const routedIris = routedCatalogEntityIris()
  const presets = typedSubjects(INSTANCE_URLS.presets, SSTIM + 'Preset')
  const references = typedSubjects(INSTANCE_URLS.references, SSTIM + 'PublicSafeReference')
  const committed = [...presets, ...references].map(({ iri }) => iri).sort()

  expect(routedIris).not.toEqual([])
  expect(routedIris).toEqual(committed)

  const elements = await buildLocalCatalogGraph([
    ...INSTANCE_URLS.presets,
    ...INSTANCE_URLS.references,
  ])
  const nodes = new Map(
    elements
      .filter(({ data }) => !data.source && data.iri)
      .map(({ data }) => [data.iri, data]),
  )

  const missing = routedIris.filter((iri) => !nodes.has(iri))
  expect(missing, `routed Graph entities without nodes: ${missing.join(', ')}`).toEqual([])
  for (const { iri } of presets) expect(nodes.get(iri)?.kind).toBe('catalogPreset')
  for (const { iri } of references) expect(nodes.get(iri)?.kind).toBe('catalogReference')
}, 30_000)

test('snapshot routes are patterns, bounded to version-shaped paths (ADR 0053)', () => {
  // What must not change: a real snapshot resolves to its own files, and a
  // pre-modular version IRI still answers with the Kernel file that was the
  // whole ontology when it was frozen.
  expect(go('0.12.0', 'text/turtle').doc).toBe('0.12.0/sstim-core.ttl')
  expect(go('0.12.0/sstim-core.ttl', '*/*').doc).toBe('0.12.0/sstim-core.ttl')
  expect(go('0.15.0', 'text/turtle').doc).toBe('0.15.0/sstim-namespace.ttl')

  // What ADR 0053 knowingly gave up: these used to 404 here. They now redirect
  // to a Pages URL that 404s, which is the price of not sending the w3id
  // maintainer a pull request for every release.
  expect(go('0.99.0', 'text/turtle').status).toBe(302)
  expect(go('0.12.0/sstim-nonexistent.ttl', '*/*').status).toBe(302)

  // What stays bounded, and is the reason this test still exists: the wildcard
  // matches version-shaped paths only. Anything else must still 404 here.
  expect(go('nonexistent', 'text/turtle').status).toBe(404)
  expect(go('0.15/sstim-core.ttl', '*/*').status).toBe(404)
  expect(go('v0.15.0/sstim-core.ttl', '*/*').status).toBe(404)
  expect(go('0.15.0.0/sstim-core.ttl', '*/*').status).toBe(404)
  expect(go('0.15.0/subdir/sstim-core.ttl', '*/*').status).toBe(404)
  expect(go('0.15.0/SSTIM-Core.ttl', '*/*').status).toBe(404)
  expect(go('0.15.0/sstim-core.json', '*/*').status).toBe(404)
})

test('no rule is shadowed by an earlier one', () => {
  // Every rule must be reachable: if an earlier unconditional rule already
  // matches its pattern, the later rule is dead configuration.
  const unconditional = []
  for (const rule of rules) {
    const shadow = unconditional.find((earlier) => new RegExp(earlier).test(
      // A pattern is only comparable if it is a literal path; skip capture groups.
      rule.pattern.replace(/[$^]/g, ''),
    ))
    expect(shadow, `${rule.pattern} is unreachable behind ${shadow}`).toBeUndefined()
    if (rule.conds.length === 0 && rule.target !== '-') unconditional.push(rule.pattern)
  }
})
