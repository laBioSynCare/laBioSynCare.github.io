/**
 * SPARQL execution wrapper using Comunica.
 *
 * Comunica (~500 KB gzipped) is loaded lazily on first call so the app
 * startup bundle stays small. See CLAUDE.md §9 "Comunica bundle size".
 */

let _engine = null

async function getEngine() {
  if (_engine) return _engine
  const { QueryEngine } = await import('@comunica/query-sparql-rdfjs')
  _engine = new QueryEngine()
  return _engine
}

/**
 * Run a SELECT query against an N3 Store.
 *
 * @param {import('n3').Store} store
 * @param {string} sparql  SPARQL 1.1 SELECT query string.
 * @returns {Promise<Record<string, import('@rdfjs/types').Term>[]>}
 *   Array of plain objects mapping variable names to RDF Terms.
 */
export async function select(store, sparql) {
  const engine = await getEngine()
  const bindings = await engine.queryBindings(sparql, { sources: [store] })
  const rows = await bindings.toArray()
  return rows.map(b => Object.fromEntries(
    [...b].map(([k, v]) => [k.value, v])
  ))
}

/**
 * Run an ASK query. Returns true/false.
 *
 * @param {import('n3').Store} store
 * @param {string} sparql
 * @returns {Promise<boolean>}
 */
export async function ask(store, sparql) {
  const engine = await getEngine()
  return engine.queryBoolean(sparql, { sources: [store] })
}

/**
 * Run a CONSTRUCT query. Returns an array of RDF Quads.
 *
 * @param {import('n3').Store} store
 * @param {string} sparql
 * @returns {Promise<import('@rdfjs/types').Quad[]>}
 */
export async function construct(store, sparql) {
  const engine = await getEngine()
  const quads = await engine.queryQuads(sparql, { sources: [store] })
  return quads.toArray()
}
