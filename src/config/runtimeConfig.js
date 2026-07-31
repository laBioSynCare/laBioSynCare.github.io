// Configuration an operator supplies at deployment time, not build time.
//
// The Nix package is immutable and bit-reproducible, which is the point of it —
// but until now everything that distinguishes one deployment from another lived
// in `import.meta.env.VITE_*`, read when the bundle was compiled. An operator who
// wanted their own Firebase project, or no Firebase at all, had to rebuild. That
// makes "reproducible package" and "deployable by someone else" pull against each
// other, and it is gap G6 in docs/technical/PORTABLE_DEPLOYMENT.md.
//
// So: one artifact, and a single JSON file beside it that the running application
// fetches. The NixOS module generates that file declaratively; the container
// takes it as a read-only mount; a plain static host just drops it next to
// index.html.
//
// Two rules govern everything below.
//
// 1. **Absence is normal, and changes nothing.** No file is not an error: a
//    package served straight out of `result/share/bsc-lab` must work, and a
//    bundle that was built with credentials must keep using them. The document
//    is purely additive — see `unconfigured` below.
// 2. **Invalid configuration degrades, never escalates.** Every failure path
//    lands on local-only, which needs no credentials and no network. Config that
//    asks for a provider it cannot support is downgraded and the reason is
//    recorded — a deployment must not silently half-enable an account system.

export const RUNTIME_CONFIG_MODEL = 'bsc-lab-runtime-config-1'
export const RUNTIME_CONFIG_FILE = 'runtime-config.json'

/** Identity providers this build knows how to construct. */
export const IDENTITY_PROVIDERS = ['anonymous', 'firebase']

/** Storage providers this build knows how to construct. */
export const STORAGE_PROVIDERS = ['local', 'firestore']

/** Firebase keys without which the SDK cannot initialise. */
const REQUIRED_FIREBASE_KEYS = ['apiKey', 'authDomain', 'projectId', 'appId']

const OPTIONAL_FIREBASE_KEYS = ['storageBucket', 'messagingSenderId', 'measurementId']

/** What the application does when nobody has configured anything. */
export function defaultRuntimeConfig() {
  return {
    model: RUNTIME_CONFIG_MODEL,
    instance: { id: null, name: 'BSC Lab' },
    identity: { provider: 'anonymous' },
    storage: { provider: 'local' },
    firebase: null,
  }
}

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const hasCompleteFirebase = (config) =>
  isPlainObject(config) && REQUIRED_FIREBASE_KEYS.every((key) => config[key])

/**
 * What a deployment does when no configuration document exists.
 *
 * Not simply the local-only defaults: a bundle built with Firebase credentials
 * has always used them, and a package that quietly stopped doing so the moment
 * this file was introduced would take accounts away from a working deployment.
 * So absence preserves the historical behaviour, and the runtime document is
 * purely additive — it can repoint Firebase, or switch it off, but it is never
 * required to keep an existing instance working.
 */
function unconfigured(buildTimeFirebase) {
  const config = defaultRuntimeConfig()
  if (hasCompleteFirebase(buildTimeFirebase)) {
    config.firebase = buildTimeFirebase
    config.identity.provider = 'firebase'
    config.storage.provider = 'firestore'
  }
  return config
}

function readInstanceId(raw, problems) {
  if (raw === undefined || raw === null || raw === '') return null
  if (typeof raw !== 'string') {
    problems.push('instance.id is not a string; ignored')
    return null
  }
  try {
    const url = new URL(raw)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      problems.push(`instance.id "${raw}" is not an http(s) URL; ignored`)
      return null
    }
    return raw
  } catch {
    problems.push(`instance.id "${raw}" is not a valid URL; ignored`)
    return null
  }
}

function readFirebase(raw, problems) {
  if (raw === undefined || raw === null) return null
  if (!isPlainObject(raw)) {
    problems.push('firebase is not an object; ignored')
    return null
  }

  const missing = REQUIRED_FIREBASE_KEYS.filter((key) => !raw[key])
  if (missing.length > 0) {
    problems.push(`firebase is missing ${missing.join(', ')}; ignored`)
    return null
  }

  const config = {}
  for (const key of [...REQUIRED_FIREBASE_KEYS, ...OPTIONAL_FIREBASE_KEYS]) {
    if (raw[key]) config[key] = String(raw[key])
  }
  return config
}

function readEnum(raw, allowed, fallback, label, problems) {
  if (raw === undefined || raw === null) return fallback
  if (typeof raw !== 'string' || !allowed.includes(raw)) {
    problems.push(`${label} "${raw}" is not one of ${allowed.join(', ')}; using "${fallback}"`)
    return fallback
  }
  return raw
}

/**
 * Turn whatever an operator wrote into a configuration this build can act on.
 *
 * Never throws and never returns a half-applied result: the returned config is
 * always internally consistent and always safe to run. `problems` is advisory —
 * it exists so a misconfigured instance can say so in Settings instead of
 * behaving mysteriously.
 *
 * @param {unknown} raw parsed JSON, or null/undefined when no file was found
 * @param {{ buildTimeFirebase?: object|null }} [options]
 *        Firebase configuration compiled into the bundle. Runtime config wins
 *        when both are present, so an operator can repoint a package that was
 *        built with someone else's project.
 * @returns {{ config: ReturnType<typeof defaultRuntimeConfig>, problems: string[] }}
 */
export function normalizeRuntimeConfig(raw, { buildTimeFirebase = null } = {}) {
  const problems = []

  if (raw === undefined || raw === null) {
    return { config: unconfigured(buildTimeFirebase), problems }
  }

  if (!isPlainObject(raw)) {
    problems.push('runtime config is not a JSON object; using defaults')
    return { config: unconfigured(buildTimeFirebase), problems }
  }

  const config = defaultRuntimeConfig()

  // An unrecognised model means the file was written for a different contract.
  // Refusing it wholesale is safer than applying the fields whose names happen
  // to match, because the ones that do not match are the ones that would
  // surprise the operator.
  if (raw.model !== RUNTIME_CONFIG_MODEL) {
    problems.push(
      `unsupported model "${raw.model}"; expected "${RUNTIME_CONFIG_MODEL}". Using defaults`,
    )
    return { config: unconfigured(buildTimeFirebase), problems }
  }

  const instance = isPlainObject(raw.instance) ? raw.instance : {}
  config.instance.id = readInstanceId(instance.id, problems)
  if (typeof instance.name === 'string' && instance.name.trim()) {
    config.instance.name = instance.name.trim()
  } else if (instance.name !== undefined) {
    problems.push('instance.name is empty or not a string; using the default')
  }

  const identity = isPlainObject(raw.identity) ? raw.identity : {}
  const storage = isPlainObject(raw.storage) ? raw.storage : {}

  config.identity.provider = readEnum(
    identity.provider, IDENTITY_PROVIDERS, 'anonymous', 'identity.provider', problems,
  )
  config.storage.provider = readEnum(
    storage.provider, STORAGE_PROVIDERS, 'local', 'storage.provider', problems,
  )

  const runtimeFirebase = readFirebase(raw.firebase, problems)
  config.firebase = runtimeFirebase ?? buildTimeFirebase ?? null

  // The consistency rule. Asking for Firebase without credentials to reach it is
  // the single most likely operator mistake, and the one where guessing would be
  // worst: an instance that appears to offer accounts but cannot keep anything.
  if (!config.firebase) {
    if (config.identity.provider === 'firebase') {
      problems.push('identity.provider "firebase" needs firebase credentials; using "anonymous"')
      config.identity.provider = 'anonymous'
    }
    if (config.storage.provider === 'firestore') {
      problems.push('storage.provider "firestore" needs firebase credentials; using "local"')
      config.storage.provider = 'local'
    }
  }

  return { config, problems }
}

let current = defaultRuntimeConfig()
let currentProblems = []
let loaded = false

/**
 * The active configuration. Synchronous, because the Firebase client and the
 * storage factories are synchronous and rippling `await` through them would
 * change far more than this gap requires. Returns safe defaults until
 * `loadRuntimeConfig` has resolved, which is why loading happens in the root
 * layout before any provider is constructed.
 */
export function getRuntimeConfig() {
  return current
}

/** Problems recorded while normalising the active configuration. */
export function getRuntimeConfigProblems() {
  return currentProblems
}

/** Whether a load has been attempted (successfully or not). */
export function isRuntimeConfigLoaded() {
  return loaded
}

/** Apply an already-parsed document. Exported for tests and for the loader. */
export function applyRuntimeConfig(raw, options = {}) {
  const { config, problems } = normalizeRuntimeConfig(raw, options)
  current = config
  currentProblems = problems
  loaded = true
  return config
}

/** Restore the pre-load state. Tests only. */
export function resetRuntimeConfig() {
  current = defaultRuntimeConfig()
  currentProblems = []
  loaded = false
}

/**
 * Fetch and apply `runtime-config.json` from the deployed site.
 *
 * A 404 is the expected result for a package nobody has configured, so it is
 * not an error and not a problem entry. A malformed file *is* worth recording,
 * because someone wrote it intending it to work.
 *
 * @param {{ fetch?: typeof globalThis.fetch, base?: string, buildTimeFirebase?: object|null }} [options]
 */
export async function loadRuntimeConfig({
  fetch: fetchImpl = undefined,
  base = '',
  buildTimeFirebase = null,
} = {}) {
  const doFetch = fetchImpl ?? (typeof fetch === 'function' ? fetch : null)
  if (!doFetch) return applyRuntimeConfig(null, { buildTimeFirebase })

  const url = `${base}/${RUNTIME_CONFIG_FILE}`.replace(/([^:])\/\/+/g, '$1/')

  try {
    const response = await doFetch(url, { cache: 'no-cache' })
    if (response.status === 404) return applyRuntimeConfig(null, { buildTimeFirebase })
    if (!response.ok) {
      const config = applyRuntimeConfig(null, { buildTimeFirebase })
      currentProblems = [`could not read ${RUNTIME_CONFIG_FILE}: HTTP ${response.status}`]
      return config
    }
    return applyRuntimeConfig(await response.json(), { buildTimeFirebase })
  } catch (error) {
    const config = applyRuntimeConfig(null, { buildTimeFirebase })
    currentProblems = [`could not read ${RUNTIME_CONFIG_FILE}: ${error.message}`]
    return config
  }
}
