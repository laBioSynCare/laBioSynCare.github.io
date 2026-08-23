import { DataFactory, Parser, Store } from 'n3'
import ontologyManifest from '../../static/ontology/manifest.json' with { type: 'json' }
import { applicationAsset } from '../config/applicationUrls.js'

/**
 * Resolve a manifest runtime reference to a fetchable application URL.
 *
 * The manifest states its runtime references relative to itself
 * (`sstim-core.ttl`, not `/ontology/sstim-core.ttl`), so that a consumer who
 * fetches the manifest from any deployment resolves them against the manifest's
 * own location rather than against an origin root the deployment may not own.
 * The manifest lives at `/ontology/manifest.json`, so its neighbours are under
 * `/ontology/`; this restores that one piece of context the reference omits.
 */
const ontologyRuntimeAsset = (reference) => applicationAsset(`/ontology/${reference}`)
import {
  ECOSYSTEM_AGENTS_GRAPH_IRI,
  ECOSYSTEM_FIXTURE_GRAPH_IRI,
} from './namespaces.js'

const { namedNode, quad: makeQuad } = DataFactory

/**
 * Parse a Turtle/TriG/N-Quads string into an N3 Store.
 * @param {string} text  Raw RDF serialization.
 * @param {string} [format='text/turtle']  Content type hint for the parser.
 * @param {string} [graphIri]  Optional named graph IRI for flat Turtle input.
 * @returns {Promise<Store>}
 */
export function parseIntoStore(text, format = 'text/turtle', graphIri) {
  return new Promise((resolve, reject) => {
    const store = new Store()
    const parser = new Parser({ format })
    const graph = graphIri ? namedNode(graphIri) : null
    parser.parse(text, (err, parsedQuad) => {
      if (err) return reject(err)
      if (parsedQuad) {
        if (graph && parsedQuad.graph.termType === 'DefaultGraph') {
          store.addQuad(makeQuad(
            parsedQuad.subject,
            parsedQuad.predicate,
            parsedQuad.object,
            graph,
          ))
        } else {
          store.addQuad(parsedQuad)
        }
      } else {
        resolve(store)
      }
    })
  })
}

/**
 * Fetch a Turtle file from `url` and parse it into a new Store.
 *
 * In production the app is served as a static site and all .ttl files are
 * co-located in dist/ (same origin), so fetch works without CORS issues.
 * In dev mode Vite serves static/ at the root, same behaviour.
 *
 * For predecessor-namespace files during development you can pass a file://
 * URL via a Vite plugin or a relative path under static/.
 *
 * @param {string} url  Absolute or root-relative URL.
 * @param {{ format?: string, graph?: string, fetchOptions?: RequestInit }} [options]
 * @returns {Promise<Store>}
 */
export async function loadTurtle(url, options = {}) {
  const res = await fetch(url, options.fetchOptions)
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status} ${res.statusText}`)
  const text = await res.text()
  return parseIntoStore(text, options.format ?? 'text/turtle', options.graph)
}

/**
 * Load one source descriptor into a new Store.
 *
 * An optional external source degrades to an empty graph when it is unavailable;
 * the static ontology remains usable while live ecosystem discovery is offline.
 *
 * @param {string | { url: string, graph?: string, format?: string, optional?: boolean }} source
 * @returns {Promise<Store>}
 */
export async function loadSource(source) {
  if (typeof source === 'string') return loadTurtle(source)
  try {
    return await loadTurtle(source.url, {
      graph: source.graph,
      format: source.format,
      fetchOptions: source.fetchOptions,
    })
  } catch (error) {
    if (!source.optional) throw error
    console.warn(`Optional RDF source unavailable: ${source.url}`, error)
    return new Store()
  }
}

/**
 * Load and merge multiple Turtle files into a single Store.
 * Files are fetched in parallel; quads are merged into one store.
 *
 * @param {(string | { url: string, graph?: string, format?: string })[]} sources
 * @returns {Promise<Store>}
 */
export async function loadMerged(sources) {
  const stores = await Promise.all(sources.map(loadSource))
  return mergeStores(...stores)
}

/** Merge one or more RDFJS stores without changing the inputs. */
export function mergeStores(...stores) {
  const merged = new Store()
  for (const s of stores) {
    for (const quad of s) {
      merged.addQuad(quad)
    }
  }
  return merged
}

/** Convert a manifest kebab-case module id to the loader's public camelCase key. */
function ontologySourceKey(id) {
  return id.replace(/-([a-z0-9])/g, (_, character) => character.toUpperCase())
}

const fullProfile = ontologyManifest.profiles.find(
  profile => profile.id === ontologyManifest.suite.defaultProfile,
)
if (!fullProfile || fullProfile.id !== 'full') {
  throw new Error('SSTIM manifest must identify the Full profile as its default profile')
}

const moduleById = new Map(ontologyManifest.modules.map(module => [module.id, module]))
const fullProfileModuleIds = [...fullProfile.modules, ...fullProfile.shapeModules]
const fullProfileModules = fullProfileModuleIds.map((id) => {
  const module = moduleById.get(id)
  if (!module?.runtime?.url || !module.runtime.graphIri) {
    throw new Error(`SSTIM Full profile module ${id} has no complete runtime descriptor`)
  }
  return module
})

/**
 * SSTIM Full-profile URLs served from the same runtime origin.
 *
 * The manifest uses stable kebab-case ids; this browser API retains camelCase
 * keys (`patchStudio`, `evidenceExposure`, and so on) for JavaScript callers.
 */
export const ONTOLOGY_URLS = Object.freeze(Object.fromEntries(
  fullProfileModules.map(module => [
    ontologySourceKey(module.id),
    ontologyRuntimeAsset(module.runtime.url),
  ]),
))

/**
 * Named-graph source descriptors for every Full-profile module and its
 * associated Full-profile SHACL shapes. Metadata is retained for runtime UIs.
 */
export const ONTOLOGY_SOURCES = Object.freeze(Object.fromEntries(
  fullProfileModules.map(module => [
    ontologySourceKey(module.id),
    Object.freeze({
      id: module.id,
      title: module.title,
      roles: Object.freeze([...module.roles]),
      url: ontologyRuntimeAsset(module.runtime.url),
      graph: module.runtime.graphIri,
      persistentUrl: module.publication.persistentUrl,
    }),
  ]),
))

/**
 * Module identity for every Full-profile module, in manifest order.
 *
 * `requires` carries the ADR 0043 §3 direct dependency edges so a consumer can
 * expand a module selection to its declared closure. The navigator's module
 * filter is built from this rather than from a hand-kept list: ADR 0043 §5
 * makes the manifest the one bill of materials, and a second inventory is the
 * thing that drifts.
 */
export const ONTOLOGY_MODULES = Object.freeze(fullProfileModules.map(module => Object.freeze({
  id: module.id,
  title: module.title,
  roles: Object.freeze([...module.roles]),
  graph: module.runtime.graphIri,
  requires: Object.freeze([...module.requires]),
})))

/**
 * Named-graph IRI → manifest module id, for attributing a term to its owning
 * module. Every SSTIM term is declared in exactly one module, so the named
 * graph of its declaring quad is an unambiguous owner.
 */
export const MODULE_ID_BY_GRAPH_IRI = Object.freeze(Object.fromEntries(
  fullProfileModules.map(module => [module.runtime.graphIri, module.id]),
))

/**
 * The published conformance profiles and their exact closures.
 *
 * `modules` is the manifest closure verbatim, including modules the navigator
 * never loads (Core's `core-shapes`, for one). Consumers that need drawable
 * modules intersect with ONTOLOGY_MODULES rather than expecting this list to
 * have been pre-filtered — the profile closure is a release contract and is
 * not the navigator's to narrow.
 */
export const ONTOLOGY_PROFILES = Object.freeze(ontologyManifest.profiles.map(profile => Object.freeze({
  id: profile.id,
  title: profile.title,
  modules: Object.freeze([...profile.modules, ...profile.shapeModules]),
})))

/**
 * RDF instance sources. Browser builds cannot list directories, so this
 * manifest is the source of truth. Real ecosystem data is deliberately served
 * from a mutable external store and never copied into the citable repository.
 */
export const INSTANCE_URLS = {
  // Programme identity. Committed and citable, unlike the `ecosystem` group
  // below, which is the mutable live relationship projection.
  programmes: [
    applicationAsset('/ontology/instances/programmes/biosyncare-ecosystem.ttl'),
  ],
  frameworks: [
    applicationAsset('/ontology/instances/frameworks/bsc.ttl'),
  ],
  implementations: [
    applicationAsset('/ontology/instances/implementations/implementations.ttl'),
  ],
  presets: [
    applicationAsset('/ontology/instances/presets/perform-alpha-10-seed.ttl'),
    applicationAsset('/ontology/instances/presets/heal-theta-breathing-seed.ttl'),
  ],
  protocols: [
    applicationAsset('/ontology/instances/protocols/bsc-reference-protocols.ttl'),
  ],
  evidence: [
    applicationAsset('/ontology/instances/evidence/technique-evidence.ttl'),
    applicationAsset('/ontology/instances/evidence/oscillation-associations.ttl'),
  ],
  experiments: [
    applicationAsset('/ontology/instances/experiments/free-view-stereo-headphones.ttl'),
    applicationAsset('/ontology/instances/experiments/multi-headphone-haptic.ttl'),
    applicationAsset('/ontology/instances/experiments/color-field-blink.ttl'),
    applicationAsset('/ontology/instances/experiments/colored-audio-noise.ttl'),
    applicationAsset('/ontology/instances/experiments/silence-darkness-baseline.ttl'),
    applicationAsset('/ontology/instances/experiments/social-graph-sensory-protocol.ttl'),
    applicationAsset('/ontology/instances/experiments/wifi-em-field-hypothesis.ttl'),
    applicationAsset('/ontology/instances/experiments/smell-taste-device-boundary.ttl'),
    applicationAsset('/ontology/instances/experiments/ideal-tactile-immersion.ttl'),
    applicationAsset('/ontology/instances/experiments/sensory-field-example.ttl'),
  ],
  references: [
    applicationAsset('/ontology/instances/references/references.ttl'),
  ],
  sessions: [
    applicationAsset('/ontology/instances/sessions/synthetic-reference-session.ttl'),
  ],
  ecosystem: [
    'https://biosyncare-lab.web.app/current.ttl',
  ],
  ecosystemFixtures: [
    applicationAsset('/ontology/instances/ecosystem/fixtures/synthetic-ecosystem.ttl'),
  ],
}

export const INSTANCE_SOURCES = {
  programmes: INSTANCE_URLS.programmes.map(url => ({
    url,
    graph: 'https://w3id.org/sstim/graph/programmes',
  })),
  frameworks: INSTANCE_URLS.frameworks.map(url => ({
    url,
    graph: 'https://w3id.org/sstim/graph/frameworks',
  })),
  implementations: INSTANCE_URLS.implementations.map(url => ({
    url,
    graph: 'https://w3id.org/sstim/graph/implementations',
  })),
  presets: INSTANCE_URLS.presets.map(url => ({
    url,
    graph: 'https://w3id.org/sstim/implementation/bsclab/preset/',
  })),
  protocols: INSTANCE_URLS.protocols.map(url => ({
    url,
    graph: 'https://w3id.org/sstim/implementation/bsclab/protocol/',
  })),
  evidence: INSTANCE_URLS.evidence.map(url => ({
    url,
    graph: 'https://w3id.org/sstim/implementation/bsclab/evidence/',
  })),
  experiments: INSTANCE_URLS.experiments.map(url => ({
    url,
    graph: 'https://w3id.org/sstim/implementation/bsclab/experiment/',
  })),
  references: INSTANCE_URLS.references.map(url => ({
    url,
    graph: 'https://w3id.org/sstim/ref/',
  })),
  sessions: INSTANCE_URLS.sessions.map(url => ({
    url,
    graph: 'https://w3id.org/sstim/implementation/bsclab/session/',
  })),
  ecosystem: INSTANCE_URLS.ecosystem.map(url => ({
    url,
    graph: ECOSYSTEM_AGENTS_GRAPH_IRI.value,
    external: true,
    optional: true,
  })),
  ecosystemFixtures: INSTANCE_URLS.ecosystemFixtures.map(url => ({
    url,
    graph: ECOSYSTEM_FIXTURE_GRAPH_IRI.value,
  })),
}

export function instanceUrls() {
  return Object.values(INSTANCE_URLS).flat()
}

export function instanceSources() {
  return Object.values(INSTANCE_SOURCES).flat()
}

/**
 * Committed instance data suitable for general in-browser queries.
 *
 * The mutable ecosystem projection and its synthetic contract fixture are
 * intentionally opt-in. This prevents unrelated routes (notably Presets) from
 * fetching named people and keeps test data out of user-facing query results.
 */
export function staticInstanceSources() {
  return Object.entries(INSTANCE_SOURCES)
    .filter(([group]) => group !== 'ecosystem' && group !== 'ecosystemFixtures')
    .flatMap(([, sources]) => sources)
}

/**
 * The deliberately small manifest used by the unified Graph navigator.
 * It contains the citable term set, versioned catalog records (including the
 * exact public presets and references reached by w3id browser routes), and
 * optionally the mutable public ecosystem projection. Sessions, experiments,
 * standalone evidence sources, and synthetic fixtures are outside this view.
 */
export function navigatorSources(options = {}) {
  const sources = [
    ...Object.values(ONTOLOGY_SOURCES),
    ...INSTANCE_SOURCES.programmes,
    ...INSTANCE_SOURCES.frameworks,
    ...INSTANCE_SOURCES.implementations,
    ...INSTANCE_SOURCES.presets,
    ...INSTANCE_SOURCES.references,
  ]
  if (options.includeLive !== false) sources.push(...INSTANCE_SOURCES.ecosystem)
  return sources
}

export const LIVE_ECOSYSTEM_FETCH_OPTIONS = Object.freeze({
  cache: 'no-store',
  credentials: 'omit',
  referrerPolicy: 'no-referrer',
})

/**
 * Load the approved, current-state public ecosystem projection.
 *
 * Unlike the generic optional-source loader, this function preserves the
 * difference between a valid empty publication and an unavailable endpoint so
 * the UI can state what happened and offer a retry.
 */
export async function loadLiveEcosystem() {
  const source = INSTANCE_SOURCES.ecosystem[0]
  const fetchedAt = new Date().toISOString()
  try {
    const store = await loadTurtle(source.url, {
      graph: source.graph,
      format: source.format,
      fetchOptions: LIVE_ECOSYSTEM_FETCH_OPTIONS,
    })
    return {
      store,
      status: {
        state: store.size ? 'available' : 'empty',
        source: source.url,
        quadCount: store.size,
        fetchedAt,
        message: store.size
          ? 'Current public ecosystem projection loaded.'
          : 'The public ecosystem projection is valid but empty.',
      },
    }
  } catch (error) {
    console.warn(`Live ecosystem source unavailable: ${source.url}`, error)
    return {
      store: new Store(),
      status: {
        state: 'unavailable',
        source: source.url,
        quadCount: 0,
        fetchedAt,
        message: error instanceof Error ? error.message : String(error),
      },
    }
  }
}

/** Load the selective, interlinked ontology + catalog + live navigator view. */
export async function loadNavigatorGraph(options = {}) {
  const includeLive = options.includeLive !== false
  const staticSources = navigatorSources({ includeLive: false })
  const [staticStore, live] = await Promise.all([
    loadMerged(staticSources),
    includeLive
      ? loadLiveEcosystem()
      : Promise.resolve({
          store: new Store(),
          status: {
            state: 'disabled',
            source: INSTANCE_URLS.ecosystem[0],
            quadCount: 0,
            fetchedAt: null,
            message: 'Live ecosystem loading is disabled.',
          },
        }),
  ])
  return {
    store: mergeStores(staticStore, live.store),
    liveStatus: live.status,
  }
}

/**
 * Load the canonical sstim ontology files into one merged store.
 * SHACL shapes are included so the store can be used for both querying
 * and validation without a second fetch.
 *
 * @param {{ includeInstances?: boolean }} [options]
 * @returns {Promise<Store>}
 */
export function loadOntology(options = {}) {
  const sources = Object.values(ONTOLOGY_SOURCES)
  if (options.includeInstances) sources.push(...staticInstanceSources())
  return loadMerged(sources)
}

/**
 * Backward-compatible name for the static, non-fixture knowledge graph.
 *
 * @returns {Promise<Store>}
 */
export function loadKnowledgeGraph() {
  return loadStaticKnowledgeGraph()
}


/** Load the ontology and committed non-fixture instances, without live people. */
export function loadStaticKnowledgeGraph() {
  return loadMerged([
    ...Object.values(ONTOLOGY_SOURCES),
    ...staticInstanceSources(),
  ])
}
