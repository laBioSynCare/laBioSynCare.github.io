import { Parser, Store } from 'n3'

/**
 * Parse a Turtle/TriG/N-Quads string into an N3 Store.
 * @param {string} text  Raw RDF serialization.
 * @param {string} [format='text/turtle']  Content type hint for the parser.
 * @returns {Promise<Store>}
 */
export function parseIntoStore(text, format = 'text/turtle') {
  return new Promise((resolve, reject) => {
    const store = new Store()
    const parser = new Parser({ format })
    parser.parse(text, (err, quad, prefixes) => {
      if (err) return reject(err)
      if (quad) {
        store.addQuad(quad)
      } else {
        resolve(store)
      }
    })
  })
}

/**
 * Fetch a Turtle file from `url` and parse it into a new Store.
 *
 * In production the app is served from Netlify and all .ttl files are
 * co-located in dist/ (same origin), so fetch works without CORS issues.
 * In dev mode Vite serves public/ at the root, same behaviour.
 *
 * For predecessor-namespace files during development you can pass a file://
 * URL via a Vite plugin or a relative path under public/.
 *
 * @param {string} url  Absolute or root-relative URL.
 * @returns {Promise<Store>}
 */
export async function loadTurtle(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status} ${res.statusText}`)
  const text = await res.text()
  return parseIntoStore(text)
}

/**
 * Load and merge multiple Turtle files into a single Store.
 * Files are fetched in parallel; quads are merged into one store.
 *
 * @param {string[]} urls
 * @returns {Promise<Store>}
 */
export async function loadMerged(urls) {
  const stores = await Promise.all(urls.map(loadTurtle))
  const merged = new Store()
  for (const s of stores) {
    for (const quad of s) {
      merged.addQuad(quad)
    }
  }
  return merged
}

/**
 * Standard BSC Lab ontology URLs served from the same Netlify origin.
 * These constants mirror the files copied from public/ into dist/ at build time.
 */
export const ONTOLOGY_URLS = {
  core:       '/ontology/sstim-core.ttl',
  vocab:      '/ontology/sstim-vocab.ttl',
  shapes:     '/ontology/sstim-shapes.ttl',
  alignments: '/ontology/sstim-alignments.ttl',
}

/**
 * Load the four canonical sstim ontology files into one merged store.
 * SHACL shapes are included so the store can be used for both querying
 * and validation without a second fetch.
 *
 * @returns {Promise<Store>}
 */
export function loadOntology() {
  return loadMerged(Object.values(ONTOLOGY_URLS))
}
