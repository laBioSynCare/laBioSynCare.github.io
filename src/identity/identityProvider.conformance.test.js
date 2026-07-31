import { describe, it, expect, beforeEach, vi } from 'vitest'
import { get, readable } from 'svelte/store'
import {
  PRIVATE_IDENTITY_FIELDS,
  anonymousIdentity,
  normalizeIdentity,
  pendingState,
  publicAttribution,
} from './IdentityProvider.js'
import { createAnonymousIdentityProvider } from './anonymousIdentityProvider.js'
import { setIdentityProvider, identity, identityCapabilities, signIn, signOut }
  from './identityState.js'

/**
 * A stand-in for a signed-in provider.
 *
 * Deliberately not the Firebase one: that would need the SDK, and the point of a
 * conformance suite is that it constrains *any* implementation. If a future
 * Mastodon provider is added, it gets tested here by construction.
 */
function createStubProvider({ subject = 'stub-subject-1', agentIri = null, scopes = [] } = {}) {
  const state = {
    ready: true,
    identity: normalizeIdentity(
      { subject, agentIri, displayName: 'Ada Lovelace', grantedScopes: scopes },
      { provider: 'firebase' },
    ),
    error: null,
  }
  return {
    id: 'stub',
    subscribe: readable(state).subscribe,
    getCapabilities: () => ({ canSignIn: true, canEditProfile: true, providesAgentIri: Boolean(agentIri) }),
    signIn: vi.fn(async () => {}),
    signOut: vi.fn(async () => {}),
    updateProfile: vi.fn(async () => {}),
  }
}

const PROVIDERS = [
  ['anonymous', () => createAnonymousIdentityProvider()],
  ['signed-in stub', () => createStubProvider()],
]

beforeEach(() => setIdentityProvider(null))

// ── the contract every provider satisfies ───────────────────────────────────

describe.each(PROVIDERS)('IdentityProvider contract: %s', (_name, make) => {
  it('has an id and reports capabilities', () => {
    const p = make()
    expect(typeof p.id).toBe('string')
    const caps = p.getCapabilities()
    for (const key of ['canSignIn', 'canEditProfile', 'providesAgentIri']) {
      expect(typeof caps[key]).toBe('boolean')
    }
  })

  it('follows the store contract: immediate value, then unsubscribe', () => {
    const p = make()
    const seen = []
    const stop = p.subscribe((s) => seen.push(s))
    expect(seen).toHaveLength(1)
    expect(typeof stop).toBe('function')
    stop()
  })

  it('always reports an identity — never null', () => {
    const p = make()
    let state
    p.subscribe((s) => { state = s })()
    expect(state.identity).not.toBeNull()
    expect(typeof state.identity.provider).toBe('string')
    expect(typeof state.identity.authenticated).toBe('boolean')
    expect(Array.isArray(state.identity.grantedScopes)).toBe(true)
  })

  it('never exposes a provider identifier through public attribution', () => {
    const p = make()
    let state
    p.subscribe((s) => { state = s })()
    const attribution = publicAttribution(state.identity)
    for (const field of PRIVATE_IDENTITY_FIELDS) {
      expect(attribution).not.toHaveProperty(field)
    }
    if (state.identity.subject) {
      expect(JSON.stringify(attribution)).not.toContain(state.identity.subject)
    }
  })

  it('offers sign-in only when it says it can', () => {
    const p = make()
    expect(Boolean(p.signIn)).toBe(p.getCapabilities().canSignIn)
    expect(Boolean(p.updateProfile)).toBe(p.getCapabilities().canEditProfile)
  })
})

// ── the anonymous provider is a supported mode, not a degraded one ──────────

describe('anonymous identity', () => {
  it('is ready immediately, with no error', () => {
    let state
    createAnonymousIdentityProvider().subscribe((s) => { state = s })()
    expect(state.ready).toBe(true)
    expect(state.error).toBeNull()
    expect(state.identity.authenticated).toBe(false)
  })

  it('carries no identifier of any kind', () => {
    const id = anonymousIdentity()
    expect(id.subject).toBeNull()
    expect(id.agentIri).toBeNull()
    expect(id.displayName).toBe('')
  })

  it('declines sign-in through the shared API rather than crashing', async () => {
    setIdentityProvider(createAnonymousIdentityProvider())
    await expect(signIn({ email: 'a@b.c' })).rejects.toThrow(/does not offer sign-in/)
    // Signing out of nothing is a no-op, not an error: UI should not have to
    // branch on whether an account system exists before offering a sign-out.
    await expect(signOut()).resolves.toBeUndefined()
  })
})

// ── normalisation ───────────────────────────────────────────────────────────

describe('normalizeIdentity', () => {
  it('treats an absent user as anonymous rather than null', () => {
    const id = normalizeIdentity(null, { provider: 'firebase' })
    expect(id.authenticated).toBe(false)
    expect(id.provider).toBe('firebase')
    expect(id.subject).toBeNull()
  })

  it('derives authenticated from the presence of a subject', () => {
    expect(normalizeIdentity({ subject: 'x' }, { provider: 'firebase' }).authenticated).toBe(true)
    expect(normalizeIdentity({ subject: null }, { provider: 'firebase' }).authenticated).toBe(false)
  })

  it('coerces missing or malformed fields instead of propagating them', () => {
    const id = normalizeIdentity(
      { subject: 'x', displayName: 42, agentIri: '', grantedScopes: 'not-an-array' },
      { provider: 'firebase' },
    )
    expect(id.displayName).toBe('')
    expect(id.agentIri).toBeNull()
    expect(id.grantedScopes).toEqual([])
  })

  it('copies scopes rather than aliasing the calleres array', () => {
    const scopes = ['read']
    const id = normalizeIdentity({ subject: 'x', grantedScopes: scopes }, { provider: 'firebase' })
    scopes.push('write:statuses')
    expect(id.grantedScopes).toEqual(['read'])
  })

  it('reports pending state before a provider resolves', () => {
    const s = pendingState('firebase')
    expect(s.ready).toBe(false)
    expect(s.identity.authenticated).toBe(false)
  })
})

// ── the shared surface the application actually uses ────────────────────────

describe('identityState', () => {
  it('exposes the selected provider through one store', () => {
    setIdentityProvider(createStubProvider())
    expect(get(identity).displayName).toBe('Ada Lovelace')
    expect(get(identity).authenticated).toBe(true)
  })

  it('reports the selected provider capabilities', () => {
    setIdentityProvider(createAnonymousIdentityProvider())
    expect(identityCapabilities().canSignIn).toBe(false)
    setIdentityProvider(createStubProvider())
    expect(identityCapabilities().canSignIn).toBe(true)
  })

  it('routes sign-in to the provider', async () => {
    const p = createStubProvider()
    setIdentityProvider(p)
    await signIn({ email: 'a@b.c', password: 'x' })
    expect(p.signIn).toHaveBeenCalledWith({ email: 'a@b.c', password: 'x' })
  })
})

// ── the invariant this seam exists to make structural ───────────────────────

describe('a provider identifier never becomes public', () => {
  it('is absent from attribution even when the identity has one', () => {
    const id = normalizeIdentity(
      { subject: 'firebase-uid-must-not-travel', agentIri: 'https://example.org/u/ada', displayName: 'Ada' },
      { provider: 'firebase' },
    )
    const serialized = JSON.stringify(publicAttribution(id))
    expect(serialized).not.toContain('firebase-uid-must-not-travel')
    expect(serialized).toContain('https://example.org/u/ada')
  })

  it('keeps agentIri null for providers that cannot name someone publicly', () => {
    // Firebase is one: a uid is a key into one vendor's database, not a name
    // anyone else can resolve.
    const id = normalizeIdentity({ subject: 'uid-1', displayName: 'Ada' }, { provider: 'firebase' })
    expect(id.agentIri).toBeNull()
    expect(publicAttribution(id).agentIri).toBeNull()
  })
})

// ── provider selection matrix ───────────────────────────────────────────────
//
// The two seams are independent (ADR 0038). An earlier version of
// identityProvider() read `(wantsFirebase || isFirebaseConfigured()) &&
// isFirebaseConfigured()`, which reduces to `isFirebaseConfigured()` — so the
// identity choice was dead code, and because that helper is true when *either*
// seam selects Firebase, `identity: anonymous` + `storage: firestore` silently
// activated Firebase identity. These cases pin every combination.

import { applyRuntimeConfig, resetRuntimeConfig, RUNTIME_CONFIG_MODEL } from '../config/runtimeConfig.js'
import { identityProvider } from './identityState.js'

const FIREBASE_CREDS = {
  apiKey: 'key', authDomain: 'x.firebaseapp.com', projectId: 'x', appId: '1:2:web:3',
}

const configure = (identity, storage, { credentials = true } = {}) => {
  resetRuntimeConfig()
  applyRuntimeConfig(
    {
      model: RUNTIME_CONFIG_MODEL,
      identity: { provider: identity },
      storage: { provider: storage },
      ...(credentials ? { firebase: FIREBASE_CREDS } : {}),
    },
    { buildTimeFirebase: null },
  )
  setIdentityProvider(null)
  return identityProvider().id
}

describe('identity provider selection matrix', () => {
  beforeEach(() => { resetRuntimeConfig(); setIdentityProvider(null) })

  it('anonymous + local → anonymous', () => {
    expect(configure('anonymous', 'local')).toBe('anonymous')
  })

  it('firebase + local → firebase', () => {
    expect(configure('firebase', 'local')).toBe('firebase')
  })

  it('firebase + firestore → firebase', () => {
    expect(configure('firebase', 'firestore')).toBe('firebase')
  })

  it('anonymous + firestore → anonymous, not firebase', () => {
    // The regression. Choosing Firestore for *storage* must never hand someone
    // a Firebase *identity* they did not ask for.
    expect(configure('anonymous', 'firestore')).toBe('anonymous')
  })

  it('firebase requested without credentials → anonymous', () => {
    // runtimeConfig downgrades the provider when credentials are absent, so the
    // request cannot half-succeed into an account system that cannot store.
    expect(configure('firebase', 'local', { credentials: false })).toBe('anonymous')
  })

  it('explicit anonymous overrides compiled-in credentials', () => {
    resetRuntimeConfig()
    applyRuntimeConfig(
      { model: RUNTIME_CONFIG_MODEL, identity: { provider: 'anonymous' }, storage: { provider: 'local' } },
      { buildTimeFirebase: FIREBASE_CREDS },
    )
    setIdentityProvider(null)
    expect(identityProvider().id).toBe('anonymous')
  })
})


// ── the real Firebase adapter, through the same contract ────────────────────
//
// The suite above runs against a stub, which constrains the *interface* but
// proves nothing about the adapter that ships. Mocking firebase/auth.js lets the
// actual createFirebaseIdentityProvider() take the same tests — otherwise
// "two implementations pass one conformance suite" would be an overstatement.

vi.mock('../firebase/auth.js', () => {
  const { readable } = require('svelte/store')
  return {
    authState: readable({
      ready: true,
      configured: true,
      user: { uid: 'firebase-uid-1', email: 'ada@example.org', displayName: 'Ada Lovelace' },
      error: null,
    }),
    signInWithEmail: vi.fn(async () => {}),
    createEmailAccount: vi.fn(async () => {}),
    signInWithGoogle: vi.fn(async () => {}),
    signOutCurrentUser: vi.fn(async () => {}),
    updateAuthProfile: vi.fn(async () => {}),
    defaultDisplayNameFromEmail: (e) => (e ? e.split('@')[0] : ''),
  }
})

describe('the Firebase adapter satisfies the contract', () => {
  let provider
  beforeEach(async () => {
    const { createFirebaseIdentityProvider } = await import('./firebaseIdentityProvider.js')
    provider = createFirebaseIdentityProvider()
  })

  it('reports capabilities and follows the store contract', () => {
    expect(provider.id).toBe('firebase')
    const caps = provider.getCapabilities()
    expect(caps.canSignIn).toBe(true)
    expect(caps.providesAgentIri).toBe(false)
    const seen = []
    const stop = provider.subscribe((s) => seen.push(s))
    expect(seen).toHaveLength(1)
    stop()
  })

  it('maps a Firebase user onto the normalized identity', () => {
    let state
    provider.subscribe((s) => { state = s })()
    expect(state.identity.provider).toBe('firebase')
    expect(state.identity.subject).toBe('firebase-uid-1')
    expect(state.identity.displayName).toBe('Ada Lovelace')
    expect(state.identity.email).toBe('ada@example.org')
    expect(state.identity.authenticated).toBe(true)
  })

  it('never publishes the uid or the email', () => {
    let state
    provider.subscribe((s) => { state = s })()
    // A uid is a key into one vendor's database, not a name anyone can resolve.
    expect(state.identity.agentIri).toBeNull()
    const serialized = JSON.stringify(publicAttribution(state.identity))
    expect(serialized).not.toContain('firebase-uid-1')
    expect(serialized).not.toContain('ada@example.org')
  })

  it('routes each sign-in method through the provider', async () => {
    const auth = await import('../firebase/auth.js')
    await provider.signIn({ method: 'google' })
    expect(auth.signInWithGoogle).toHaveBeenCalled()
    await provider.signIn({ method: 'create', email: 'a@b.c', password: 'p', displayName: 'N' })
    expect(auth.createEmailAccount).toHaveBeenCalledWith('a@b.c', 'p', 'N')
    await provider.signIn({ email: 'a@b.c', password: 'p' })
    expect(auth.signInWithEmail).toHaveBeenCalledWith('a@b.c', 'p')
  })
})
