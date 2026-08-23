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

function bindingToRow(binding) {
  return Object.fromEntries([...binding].map(([key, value]) => [key.value, value]))
}

function queryStopError(kind, timeoutMs) {
  const error = new Error(kind === 'timeout'
    ? `Query stopped after ${timeoutMs} ms.`
    : 'Query cancelled by the user.')
  error.name = kind === 'timeout' ? 'QueryTimeoutError' : 'AbortError'
  return error
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
  return rows.map(bindingToRow)
}

/**
 * Run a SELECT query while collecting at most `limit` rows. The bindings stream
 * is closed as soon as one additional row proves that the result is truncated.
 * This protects interactive callers from retaining an unbounded result table.
 *
 * @param {import('n3').Store} store
 * @param {string} sparql
 * @param {number} limit
 * @param {{ timeoutMs?: number, signal?: AbortSignal }} [options]
 * @returns {Promise<{
 *   rows: Record<string, import('@rdfjs/types').Term>[],
 *   columns: string[],
 *   truncated: boolean,
 * }>}
 */
export async function selectLimited(store, sparql, limit, options = {}) {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new TypeError('SELECT result limit must be a positive integer')
  }
  const timeoutMs = options.timeoutMs ?? 0
  if (!Number.isFinite(timeoutMs) || timeoutMs < 0) {
    throw new TypeError('SELECT timeout must be a non-negative number')
  }
  if (options.signal?.aborted) throw queryStopError('abort', timeoutMs)

  const engine = await getEngine()
  if (options.signal?.aborted) throw queryStopError('abort', timeoutMs)

  let bindings
  let stopError = null
  let timeoutId
  let resolveStopped
  const stoppedMarker = Symbol('query stopped')
  // Resolve (rather than reject) this control promise so a late timer or abort
  // can never create an unhandled rejection after another race has settled.
  const stopped = new Promise((resolve) => {
    resolveStopped = error => resolve({ [stoppedMarker]: error })
  })
  const untilStopped = async (promise) => {
    const outcome = await Promise.race([promise, stopped])
    if (outcome?.[stoppedMarker]) throw outcome[stoppedMarker]
    return outcome
  }

  const stop = (kind) => {
    if (stopError) return
    stopError = queryStopError(kind, timeoutMs)
    bindings?.close()
    resolveStopped(stopError)
  }
  const abort = () => stop('abort')
  options.signal?.addEventListener('abort', abort, { once: true })
  if (timeoutMs > 0) timeoutId = setTimeout(() => stop('timeout'), timeoutMs)

  const queryResultPromise = engine.query(sparql, { sources: [store] })

  const rows = []

  try {
    const queryResult = await untilStopped(queryResultPromise)
    if (queryResult.resultType !== 'bindings') {
      throw new Error(`Query result type 'bindings' was expected, while '${queryResult.resultType}' was found.`)
    }
    const metadata = await untilStopped(queryResult.metadata())
    const columns = [...new Set((metadata.variables ?? []).map(variable => variable.value))]
    const bindingsPromise = queryResult.execute()
    // If cancellation wins while the result stream is being created, close the
    // eventual stream immediately instead of leaving a detached pipeline.
    void bindingsPromise.then((stream) => {
      if (stopError) stream.close()
    }, () => {})
    bindings = await untilStopped(bindingsPromise)

    for await (const binding of bindings) {
      if (stopError) throw stopError
      if (rows.length === limit) {
        bindings.close()
        return { rows, columns, truncated: true }
      }
      rows.push(bindingToRow(binding))
    }

    if (stopError) throw stopError
    return { rows, columns, truncated: false }
  } catch (error) {
    throw stopError ?? error
  } finally {
    clearTimeout(timeoutId)
    options.signal?.removeEventListener('abort', abort)
  }
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
