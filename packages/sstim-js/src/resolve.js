// Resolve an SSTIM profile closure from a manifest, never from a directory
// listing.
//
// The manifest is the authoritative answer to "which files make up this
// profile". A directory listing is not: it cannot tell a semantic module from a
// shape module, it says nothing about dependency order, and it happily includes
// files the profile does not contain.
//
// Two traps are handled here on the caller's behalf.
//
// The stable manifest route serves the *development* line.
// https://w3id.org/sstim/manifest answers with a mutable `-dev` version, while
// the RDF at https://w3id.org/sstim answers with the newest frozen release.
// Code that fetches the first believing it pinned something has pinned nothing,
// so an unpinned call here resolves the release: read owl:versionIRI from the
// stable IRI, then fetch that version's manifest.
//
// And a fetch is not a guarantee. Every module the manifest lists carries a
// sha256, and the served bytes are checked against it before anything is
// parsed, so a truncated download cannot quietly become a conformance result.

export const STABLE_IRI = 'https://w3id.org/sstim'
export const TERM_NAMESPACE = 'https://w3id.org/sstim'

const VERSION_IRI = /owl:versionIRI\s+<https:\/\/w3id\.org\/sstim\/(\d+\.\d+\.\d+)>/
const USER_AGENT = 'sstim-js (+https://w3id.org/sstim)'

export class SstimError extends Error {
  constructor (message) {
    super(message)
    this.name = 'SstimError'
  }
}

async function fetchBytes (url) {
  let response
  try {
    response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  } catch (cause) {
    throw new SstimError(`could not fetch ${url}: ${cause.message}`)
  }
  if (!response.ok) {
    throw new SstimError(`could not fetch ${url}: HTTP ${response.status}`)
  }
  return new Uint8Array(await response.arrayBuffer())
}

async function sha256 (bytes) {
  // Web Crypto is available in Node 18+ and in every browser, so this one
  // implementation covers both runtimes.
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}

// Caching is a Node convenience, not a requirement. In a browser there is no
// filesystem, and the module must still work, so every step here is optional.
async function nodeFs () {
  try {
    const [fs, path, os] = await Promise.all([
      import('node:fs/promises'), import('node:path'), import('node:os')
    ])
    return { fs, path, os }
  } catch {
    return null
  }
}

export async function cacheDir () {
  const node = await nodeFs()
  if (!node) return null
  const base = process.env.XDG_CACHE_HOME || node.path.join(node.os.homedir(), '.cache')
  return node.path.join(base, 'sstim')
}

async function cached (url, expected, { offline = false } = {}) {
  const node = await nodeFs()
  const dir = await cacheDir()
  const file = dir && node ? node.path.join(dir, expected.slice(0, 2), expected) : null

  // The cache is keyed by checksum, so an entry can never be stale: different
  // bytes are a different key.
  if (file) {
    try {
      const body = await node.fs.readFile(file)
      if (await sha256(body) === expected) return new Uint8Array(body)
    } catch { /* not cached */ }
  }
  if (offline) throw new SstimError(`offline, and ${url} is not cached`)

  const body = await fetchBytes(url)
  const actual = await sha256(body)
  if (actual !== expected) {
    throw new SstimError(
      `${url} served bytes the manifest does not describe.\n` +
      `  manifest sha256: ${expected}\n` +
      `  served sha256:   ${actual}\n` +
      'Refusing to continue: validating against an unverified graph would ' +
      'report conformance to something that is not SSTIM.'
    )
  }
  if (file) {
    try {
      await node.fs.mkdir(node.path.dirname(file), { recursive: true })
      await node.fs.writeFile(file, body)
    } catch { /* an unwritable cache is a slow run, not a failure */ }
  }
  return body
}

/** The newest frozen release, read from the stable IRI rather than assumed. */
export async function latestRelease () {
  const document = new TextDecoder().decode(await fetchBytes(STABLE_IRI))
  const match = VERSION_IRI.exec(document)
  if (!match) {
    throw new SstimError(
      `${STABLE_IRI} served a document declaring no owl:versionIRI, so the ` +
      'current release could not be determined. Pass an explicit version.'
    )
  }
  return match[1]
}

export class Closure {
  constructor ({ profile, version, status, modules, source, localRoot = null }) {
    Object.assign(this, { profile, version, status, modules, source, localRoot })
  }

  get shapeModules () { return this.modules.filter(m => m.isShapes) }
  get semanticModules () { return this.modules.filter(m => !m.isShapes) }
  get versionIri () { return `${STABLE_IRI}/${this.version}` }
  get isDevelopment () { return this.status !== 'released' || this.version.endsWith('-dev') }

  /** Fetch every module, checksum-verified, keyed by module id. */
  async read ({ offline = false } = {}) {
    const entries = await Promise.all(this.modules.map(async (module) => {
      if (this.localRoot) {
        const node = await nodeFs()
        if (!node) throw new SstimError('local manifests need a filesystem')
        return [module.id, await node.fs.readFile(node.path.join(this.localRoot, module.url))]
      }
      return [module.id, await cached(module.url, module.sha256, { offline })]
    }))
    return Object.fromEntries(entries.map(([id, bytes]) => [id, new TextDecoder().decode(bytes)]))
  }
}

async function loadManifest (version, manifestPath) {
  if (manifestPath) {
    const node = await nodeFs()
    if (!node) throw new SstimError('local manifests need a filesystem')
    const text = await node.fs.readFile(manifestPath, 'utf8')
    return { document: JSON.parse(text), source: String(manifestPath), root: node.path.dirname(manifestPath) }
  }
  const resolved = version || await latestRelease()
  const url = `${STABLE_IRI}/${resolved}/manifest`
  return { document: JSON.parse(new TextDecoder().decode(await fetchBytes(url))), source: url, root: null }
}

/**
 * Resolve one profile's closure.
 *
 * With no version, the newest frozen release is used, never the development
 * line. Pass `manifest` to resolve against a local checkout or a frozen release
 * directory, which needs no network at all.
 */
export async function resolveProfile (profile = 'core', { version = null, manifest = null } = {}) {
  const { document, source, root } = await loadManifest(version, manifest)
  const suite = document.suite ?? {}
  const profiles = new Map((document.profiles ?? []).map(p => [p.id, p]))
  if (!profiles.has(profile)) {
    throw new SstimError(
      `no profile '${profile}' in ${source}. ` +
      `Available: ${[...profiles.keys()].sort().join(', ')}`
    )
  }

  const entry = profiles.get(profile)
  const modules = new Map((document.modules ?? []).map(m => [m.id, m]))
  const shapeIds = new Set(entry.shapeModules ?? [])
  const resolved = [...(entry.modules ?? []), ...(entry.shapeModules ?? [])].map((id) => {
    const record = modules.get(id)
    if (!record) throw new SstimError(`manifest lists module '${id}' it does not define`)
    return {
      id,
      url: root ? record.runtime?.url : record.publication?.versionedUrl,
      sha256: record.source?.sha256 ?? '',
      graphIri: record.runtime?.graphIri ?? null,
      isShapes: shapeIds.has(id)
    }
  })

  return new Closure({
    profile,
    version: suite.version ?? 'unknown',
    status: suite.status ?? 'unknown',
    modules: resolved,
    source,
    localRoot: root
  })
}
