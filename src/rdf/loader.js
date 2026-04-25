import { DataFactory, Parser, Store } from 'n3'

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
 * @param {{ format?: string, graph?: string }} [options]
 * @returns {Promise<Store>}
 */
export async function loadTurtle(url, options = {}) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status} ${res.statusText}`)
  const text = await res.text()
  return parseIntoStore(text, options.format ?? 'text/turtle', options.graph)
}

/**
 * Load one source descriptor into a new Store.
 *
 * @param {string | { url: string, graph?: string, format?: string }} source
 * @returns {Promise<Store>}
 */
export function loadSource(source) {
  if (typeof source === 'string') return loadTurtle(source)
  return loadTurtle(source.url, {
    graph: source.graph,
    format: source.format,
  })
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
  const merged = new Store()
  for (const s of stores) {
    for (const quad of s) {
      merged.addQuad(quad)
    }
  }
  return merged
}

/**
 * Standard BSC Lab ontology URLs served from the same runtime origin.
 * These constants mirror the files copied from static/ into dist/ at build time.
 */
export const ONTOLOGY_URLS = {
  core:       '/ontology/sstim-core.ttl',
  vocab:      '/ontology/sstim-vocab.ttl',
  shapes:     '/ontology/sstim-shapes.ttl',
  alignments: '/ontology/sstim-alignments.ttl',
}

export const ONTOLOGY_SOURCES = {
  core: {
    url: ONTOLOGY_URLS.core,
    graph: 'https://w3id.org/sstim/graph/core',
  },
  vocab: {
    url: ONTOLOGY_URLS.vocab,
    graph: 'https://w3id.org/sstim/graph/vocab',
  },
  shapes: {
    url: ONTOLOGY_URLS.shapes,
    graph: 'https://w3id.org/sstim/graph/shapes',
  },
  alignments: {
    url: ONTOLOGY_URLS.alignments,
    graph: 'https://w3id.org/sstim/graph/alignments',
  },
}

/**
 * Committed RDF instance files. Browser builds cannot list directories, so this
 * manifest is the source of truth until a generated instance manifest exists.
 */
export const INSTANCE_URLS = {
  frameworks: [
    '/ontology/instances/frameworks/bsc.ttl',
  ],
  implementations: [
    '/ontology/instances/implementations/implementations.ttl',
  ],
  presets: [
    '/ontology/instances/presets/perform-alpha-10-seed.ttl',
  ],
  references: [
    '/ontology/instances/references/references.ttl',
  ],
}

export const INSTANCE_SOURCES = {
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
  references: INSTANCE_URLS.references.map(url => ({
    url,
    graph: 'https://w3id.org/sstim/ref/',
  })),
}

export function instanceUrls() {
  return Object.values(INSTANCE_URLS).flat()
}

export function instanceSources() {
  return Object.values(INSTANCE_SOURCES).flat()
}

/**
 * Load the four canonical sstim ontology files into one merged store.
 * SHACL shapes are included so the store can be used for both querying
 * and validation without a second fetch.
 *
 * @param {{ includeInstances?: boolean }} [options]
 * @returns {Promise<Store>}
 */
export function loadOntology(options = {}) {
  const sources = Object.values(ONTOLOGY_SOURCES)
  if (options.includeInstances) sources.push(...instanceSources())
  return loadMerged(sources)
}

/**
 * Load the ontology plus committed BSC Lab RDF instances.
 *
 * @returns {Promise<Store>}
 */
export function loadKnowledgeGraph() {
  return loadOntology({ includeInstances: true })
}
