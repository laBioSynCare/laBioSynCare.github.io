import { createHash } from 'node:crypto'

export const DEFAULT_API_BASE = 'https://w3c-cg.github.io/sstim/api/v1/'
const FEEDBACK_BASE = 'https://w3c-cg.github.io/sstim/contribute/'
const VERSION = /^\d+\.\d+\.\d+$/
const TERM_PATH = /^terms\/[a-f0-9]{64}\.json$/
const KINDS = new Set(['class', 'property', 'concept'])
const HASH = (value) => createHash('sha256').update(value).digest('hex')

export function resolveApiBase(value = DEFAULT_API_BASE) {
  const url = new URL(value)
  if (url.search || url.hash || url.username || url.password) {
    throw new Error('API base cannot contain credentials, query, or fragment')
  }
  if (url.protocol !== 'https:' &&
      !(url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname))) {
    throw new Error('API base must use HTTPS (HTTP allowed on loopback for tests)')
  }
  if (!url.pathname.endsWith('/api/v1/')) {
    throw new Error('API base must end in /api/v1/')
  }
  return url
}

function requiredText(value, field, max = 256) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    throw new Error(field + ' must be a nonempty string of up to ' + max + ' characters')
  }
  return value.trim()
}

/** Read-only consumer of generated, release-pinned JSON; no GitHub credentials. */
export function createConceptClient({
  apiBase = DEFAULT_API_BASE,
  fetchImpl = globalThis.fetch,
  timeoutMs = 10000,
} = {}) {
  const base = resolveApiBase(apiBase)
  if (typeof fetchImpl !== 'function') throw new TypeError('fetch implementation is required')
  const cache = new Map()

  async function read(relative, maxBytes = 6_000_000) {
    if (!relative || relative.startsWith('/') || relative.includes('\\')) {
      throw new Error('Invalid relative catalog path')
    }
    const target = new URL(relative, base)
    if (target.origin !== base.origin || !target.pathname.startsWith(base.pathname) ||
        target.search || target.hash) throw new Error('Catalog path outside API base')
    const key = target.href
    if (cache.has(key)) return cache.get(key)
    const work = (async () => {
      const response = await fetchImpl(target, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error('SSTIM API returned HTTP ' + response.status)
      const reader = response.body?.getReader()
      if (!reader) throw new Error('SSTIM API response has no body')
      const chunks = []
      let n = 0
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          n += value.byteLength
          if (n > maxBytes) throw new Error('SSTIM API response exceeds size limit')
          chunks.push(value)
        }
      } finally {
        reader.releaseLock()
      }
      const text = Buffer.concat(chunks, n).toString('utf8')
      return JSON.parse(text)
    })()
    cache.set(key, work)
    try { return await work } catch (error) {
      cache.delete(key)
      throw error
    }
  }

  async function discovery() {
    const data = await read('index.json', 200_000)
    if (data?.model !== 'sstim-concept-reference-discovery-v1' ||
        !VERSION.test(data.latestRelease) || !Array.isArray(data.releases)) {
      throw new Error('Invalid SSTIM Concept Reference discovery document')
    }
    return data
  }

  async function catalog(release = undefined) {
    const available = await discovery()
    const version = release === undefined ? available.latestRelease : requiredText(release, 'release', 30)
    if (!VERSION.test(version) || !available.releases.some(x => x.version === version)) {
      throw new Error('Unsupported SSTIM release: ' + version)
    }
    const path = 'releases/' + version + '/index.json'
    const data = await read(path)
    if (data?.model !== 'sstim-concept-reference-v1' ||
        data.release !== version || !Array.isArray(data.terms)) {
      throw new Error('Invalid SSTIM concept catalog')
    }
    return data
  }

  async function listReleases() {
    const d = await discovery()
    return { latestRelease: d.latestRelease, releases: d.releases, api: base.href }
  }

  async function searchConcepts({
    query, release, kind, limit = 10, includeDeprecated = false,
  } = {}) {
    const q = requiredText(query, 'query', 160).toLocaleLowerCase()
    if (q.length < 2) throw new Error('query must contain at least two characters')
    if (kind !== undefined && !KINDS.has(kind)) throw new Error('Invalid term kind')
    if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
      throw new Error('limit must be an integer between 1 and 20')
    }
    const data = await catalog(release)
    const hits = []
    for (const entry of data.terms) {
      if (kind && entry.kind !== kind) continue
      if (!includeDeprecated && entry.deprecated) continue
      const names = [entry.curie, entry.label, entry.iri,
        ...(entry.alternativeLabels ?? []).map(x => x.value)]
      const fields = [...names, entry.definition ?? ''].map(x => String(x).toLocaleLowerCase())
      let score = 0
      if (fields.some(x => x === q)) score = 4
      else if (fields.some(x => x.startsWith(q))) score = 3
      else if (names.some(x => String(x).toLocaleLowerCase().includes(q))) score = 2
      else if (fields.at(-1).includes(q)) score = 1
      if (score) hits.push({ score, entry })
    }
    hits.sort((a, b) => b.score - a.score ||
      a.entry.label.localeCompare(b.entry.label, 'en') ||
      a.entry.iri.localeCompare(b.entry.iri, 'en'))
    return {
      release: data.release, query: q, totalMatches: hits.length,
      results: hits.slice(0, limit).map(({ entry }) => ({
        iri: entry.iri, curie: entry.curie, label: entry.label,
        kind: entry.kind, module: entry.module, deprecated: entry.deprecated,
        ...(entry.definition ? { definition: entry.definition } : {}),
        detailUrl: new URL('releases/' + data.release + '/' + entry.path, base).href,
      })),
    }
  }

  async function getConcept({ identifier, release } = {}) {
    const wanted = requiredText(identifier, 'identifier', 1024)
    const data = await catalog(release)
    const matches = data.terms.filter(item => item.iri === wanted || item.curie === wanted)
    if (matches.length !== 1) throw new Error('Concept not found: use an exact IRI or CURIE from search results')
    const item = matches[0]
    if (!TERM_PATH.test(item.path) || item.path !== 'terms/' + HASH(item.iri) + '.json') {
      throw new Error('Invalid term path in concept catalog')
    }
    const path = 'releases/' + data.release + '/' + item.path
    const term = await read(path, 800_000)
    if (term?.iri !== item.iri || term.version !== data.release) {
      throw new Error('Term identity/version does not match its catalog')
    }
    return {
      release: data.release, term,
      detailUrl: new URL(path, base).href,
      license: 'https://creativecommons.org/licenses/by/4.0/',
    }
  }

  async function prepareFeedback({ identifier, release } = {}) {
    let term
    if (identifier !== undefined) {
      term = (await getConcept({ identifier, release })).term
    }
    const url = new URL(FEEDBACK_BASE)
    if (term) {
      url.searchParams.set('term', term.iri)
      url.searchParams.set('label', term.label)
    }
    return {
      url: url.href,
      ...(term ? { iri: term.iri, release: term.version } : {}),
      notice: 'Opens a user-reviewed public GitHub issue draft. No content is submitted automatically. Do not paste private conversations without permission.',
    }
  }

  return { listReleases, searchConcepts, getConcept, prepareFeedback }
}
