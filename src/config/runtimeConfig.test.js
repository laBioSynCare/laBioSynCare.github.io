import { describe, it, expect, beforeEach } from 'vitest'
import {
  RUNTIME_CONFIG_MODEL,
  defaultRuntimeConfig,
  normalizeRuntimeConfig,
  applyRuntimeConfig,
  getRuntimeConfig,
  getRuntimeConfigProblems,
  isRuntimeConfigLoaded,
  resetRuntimeConfig,
  loadRuntimeConfig,
} from './runtimeConfig.js'

const FIREBASE = {
  apiKey: 'key',
  authDomain: 'example.firebaseapp.com',
  projectId: 'example',
  appId: '1:2:web:3',
}

const valid = (overrides = {}) => ({
  model: RUNTIME_CONFIG_MODEL,
  instance: { id: 'https://lab.example.org/', name: 'Example Lab' },
  identity: { provider: 'anonymous' },
  storage: { provider: 'local' },
  ...overrides,
})

/** A fetch stub returning one response. */
const stubFetch = (response) => async () => response
const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
})

beforeEach(() => resetRuntimeConfig())

describe('absence is normal', () => {
  it('treats a missing document as local-only defaults, with no problems', () => {
    const { config, problems } = normalizeRuntimeConfig(null)
    expect(config).toEqual(defaultRuntimeConfig())
    expect(problems).toEqual([])
  })

  it('treats HTTP 404 as unconfigured rather than broken', async () => {
    await loadRuntimeConfig({ fetch: stubFetch(jsonResponse(null, 404)) })
    expect(getRuntimeConfig().storage.provider).toBe('local')
    expect(getRuntimeConfigProblems()).toEqual([])
    expect(isRuntimeConfigLoaded()).toBe(true)
  })

  it('serves defaults before any load has happened', () => {
    expect(getRuntimeConfig()).toEqual(defaultRuntimeConfig())
    expect(isRuntimeConfigLoaded()).toBe(false)
  })

  // Regression guard. An earlier draft made absence mean "local-only", which
  // would have switched Firebase off on every existing deployment the moment
  // this file shipped — the live site has credentials compiled in and no
  // runtime-config.json. Absence must preserve the historical behaviour.
  it('keeps compiled-in Firebase working when no document exists', () => {
    const { config, problems } = normalizeRuntimeConfig(null, { buildTimeFirebase: FIREBASE })
    expect(config.identity.provider).toBe('firebase')
    expect(config.storage.provider).toBe('firestore')
    expect(config.firebase).toEqual(FIREBASE)
    expect(problems).toEqual([])
  })

  it('keeps compiled-in Firebase working on a 404, too', async () => {
    await loadRuntimeConfig({
      fetch: stubFetch(jsonResponse(null, 404)),
      buildTimeFirebase: FIREBASE,
    })
    expect(getRuntimeConfig().storage.provider).toBe('firestore')
  })

  it('does not resurrect Firebase from an incomplete compiled-in config', () => {
    const { config } = normalizeRuntimeConfig(null, {
      buildTimeFirebase: { apiKey: 'key', projectId: 'example' },
    })
    expect(config.storage.provider).toBe('local')
    expect(config.firebase).toBeNull()
  })

  // A document written against a future contract must not be a downgrade
  // either — it is refused, and refusal means "as if absent".
  it('falls back to compiled-in behaviour when the model is unrecognised', () => {
    const { config } = normalizeRuntimeConfig(
      valid({ model: 'bsc-lab-runtime-config-99' }),
      { buildTimeFirebase: FIREBASE },
    )
    expect(config.storage.provider).toBe('firestore')
  })
})

describe('a valid document is applied', () => {
  it('reads instance identity and provider selection', () => {
    const { config, problems } = normalizeRuntimeConfig(valid())
    expect(problems).toEqual([])
    expect(config.instance).toEqual({ id: 'https://lab.example.org/', name: 'Example Lab' })
    expect(config.identity.provider).toBe('anonymous')
    expect(config.storage.provider).toBe('local')
  })

  it('lets an operator supply their own Firebase project', () => {
    const { config, problems } = normalizeRuntimeConfig(
      valid({
        identity: { provider: 'firebase' },
        storage: { provider: 'firestore' },
        firebase: FIREBASE,
      }),
    )
    expect(problems).toEqual([])
    expect(config.firebase.projectId).toBe('example')
    expect(config.identity.provider).toBe('firebase')
    expect(config.storage.provider).toBe('firestore')
  })

  it('overrides build-time Firebase, so a package can be repointed', () => {
    const buildTimeFirebase = { ...FIREBASE, projectId: 'baked-in' }
    const { config } = normalizeRuntimeConfig(valid({ firebase: FIREBASE }), { buildTimeFirebase })
    expect(config.firebase.projectId).toBe('example')
  })

  it('falls back to build-time Firebase when the document supplies none', () => {
    const buildTimeFirebase = { ...FIREBASE, projectId: 'baked-in' }
    const { config } = normalizeRuntimeConfig(
      valid({ storage: { provider: 'firestore' } }),
      { buildTimeFirebase },
    )
    expect(config.firebase.projectId).toBe('baked-in')
    expect(config.storage.provider).toBe('firestore')
  })
})

describe('invalid configuration degrades to local-only', () => {
  it('rejects an unrecognised model wholesale', () => {
    const { config, problems } = normalizeRuntimeConfig(
      valid({ model: 'bsc-lab-runtime-config-99', instance: { name: 'Should Not Apply' } }),
    )
    expect(config).toEqual(defaultRuntimeConfig())
    expect(problems[0]).toMatch(/unsupported model/)
  })

  it('rejects a non-object document', () => {
    expect(normalizeRuntimeConfig('nonsense').config).toEqual(defaultRuntimeConfig())
    expect(normalizeRuntimeConfig([1, 2]).config).toEqual(defaultRuntimeConfig())
  })

  it('falls back on an unknown provider name instead of failing', () => {
    const { config, problems } = normalizeRuntimeConfig(
      valid({ identity: { provider: 'mastodon' }, storage: { provider: 'postgres' } }),
    )
    expect(config.identity.provider).toBe('anonymous')
    expect(config.storage.provider).toBe('local')
    expect(problems).toHaveLength(2)
  })

  it('never half-enables an account system without credentials', () => {
    const { config, problems } = normalizeRuntimeConfig(
      valid({ identity: { provider: 'firebase' }, storage: { provider: 'firestore' } }),
    )
    expect(config.identity.provider).toBe('anonymous')
    expect(config.storage.provider).toBe('local')
    expect(problems).toHaveLength(2)
    expect(problems.join(' ')).toMatch(/needs firebase credentials/)
  })

  it('ignores incomplete Firebase credentials rather than initialising with them', () => {
    const { config, problems } = normalizeRuntimeConfig(
      valid({ firebase: { apiKey: 'key', projectId: 'example' } }),
    )
    expect(config.firebase).toBeNull()
    expect(problems[0]).toMatch(/missing authDomain, appId/)
  })

  it('ignores an instance id that is not an http(s) URL', () => {
    const { config, problems } = normalizeRuntimeConfig(
      valid({ instance: { id: 'javascript:alert(1)', name: 'Example Lab' } }),
    )
    expect(config.instance.id).toBeNull()
    expect(config.instance.name).toBe('Example Lab')
    expect(problems[0]).toMatch(/not an http\(s\) URL/)
  })

  it('survives malformed JSON on the wire', async () => {
    await loadRuntimeConfig({
      fetch: async () => ({ ok: true, status: 200, json: async () => { throw new Error('bad json') } }),
    })
    expect(getRuntimeConfig()).toEqual(defaultRuntimeConfig())
    expect(getRuntimeConfigProblems()[0]).toMatch(/bad json/)
  })

  it('survives the fetch itself failing', async () => {
    await loadRuntimeConfig({ fetch: async () => { throw new Error('offline') } })
    expect(getRuntimeConfig()).toEqual(defaultRuntimeConfig())
    expect(getRuntimeConfigProblems()[0]).toMatch(/offline/)
  })

  it('records a non-404 error status as a problem', async () => {
    await loadRuntimeConfig({ fetch: stubFetch(jsonResponse(null, 500)) })
    expect(getRuntimeConfig()).toEqual(defaultRuntimeConfig())
    expect(getRuntimeConfigProblems()[0]).toMatch(/HTTP 500/)
  })
})

describe('one package, two deployments', () => {
  // The acceptance criterion from docs/technical/PORTABLE_DEPLOYMENT.md §4:
  // the same build, given two configurations, must yield two instances that
  // differ only as configured.
  it('produces distinct instances from one build', () => {
    const a = normalizeRuntimeConfig(
      valid({ instance: { id: 'https://a.example.org/', name: 'Lab A' } }),
    ).config
    const b = normalizeRuntimeConfig(
      valid({
        instance: { id: 'https://b.example.org/', name: 'Lab B' },
        identity: { provider: 'firebase' },
        storage: { provider: 'firestore' },
        firebase: FIREBASE,
      }),
    ).config

    expect(a.instance.name).toBe('Lab A')
    expect(b.instance.name).toBe('Lab B')
    expect(a.storage.provider).toBe('local')
    expect(b.storage.provider).toBe('firestore')
    expect(a.firebase).toBeNull()
    expect(b.firebase).not.toBeNull()
  })

  it('lets an operator switch Firebase off even when it was compiled in', () => {
    const { config } = normalizeRuntimeConfig(
      valid({ identity: { provider: 'anonymous' }, storage: { provider: 'local' } }),
      { buildTimeFirebase: FIREBASE },
    )
    // Credentials remain available to the bundle, but nothing selects them.
    expect(config.identity.provider).toBe('anonymous')
    expect(config.storage.provider).toBe('local')
  })
})

describe('applyRuntimeConfig', () => {
  it('replaces the active configuration and marks it loaded', () => {
    applyRuntimeConfig(valid({ instance: { id: null, name: 'Applied' } }))
    expect(getRuntimeConfig().instance.name).toBe('Applied')
    expect(isRuntimeConfigLoaded()).toBe(true)
  })

  it('is undone by reset', () => {
    applyRuntimeConfig(valid())
    resetRuntimeConfig()
    expect(getRuntimeConfig()).toEqual(defaultRuntimeConfig())
    expect(isRuntimeConfigLoaded()).toBe(false)
  })
})
