// What the application is allowed to know about who someone is.
//
// Until now every route and component imported `firebase/auth.js` directly, so
// "is there a user" and "is Firebase configured" were the same question in seven
// files. That makes Firebase not a choice but a structural assumption: adding a
// second provider would mean editing every consumer, and running without one
// meant threading `configured` through the UI.
//
// This is the seam. A provider answers three things — who is signed in, how to
// sign in or out, and what the provider can do — and the application asks
// nothing else. `runtime-config.json` selects which provider is active
// (ADR 0041 §2), so the same immutable package runs with accounts or without.
//
// **The normalized identity deliberately does not expose a provider's own user
// id to the application.** `subject` exists because storage needs a key, but
// `agentIri` is what may be attributed or published — the rule
// `AnnotationStore` and the instance export already follow, made structural
// instead of remembered.

/**
 * @typedef {object} Identity
 * @property {'anonymous'|'firebase'} provider Which provider produced this.
 * @property {string|null} subject
 *   The provider's own identifier for this person. Storage may key on it.
 *   **Never publish it**: it is provider-specific, not portable, and in
 *   Firebase's case it is the uid that must never reach an export.
 * @property {string|null} agentIri
 *   A dereferenceable identifier safe to attribute or publish, or null when the
 *   identity cannot be named publicly.
 * @property {string} displayName Human-readable, possibly empty. Never an id.
 * @property {string|null} email
 *   Contact address where the provider supplies one, null otherwise. A standard
 *   claim rather than an identifier — but still personal, so it is excluded from
 *   public attribution and from every export.
 * @property {boolean} authenticated Whether someone actually signed in.
 * @property {string[]} grantedScopes
 *   Permissions the person granted. Empty for identity-only sign-in; a future
 *   Fediverse provider would add publishing scopes here, and the UI can ask for
 *   them separately rather than bundling them into login (ADR 0039 §3).
 */

/**
 * @typedef {object} IdentityCapabilities
 * @property {boolean} canSignIn        Whether sign-in is offered at all.
 * @property {boolean} canEditProfile   Whether displayName can be changed here.
 * @property {boolean} providesAgentIri Whether identities carry a public IRI.
 */

/**
 * @typedef {object} IdentityProvider
 * @property {string} id
 * @property {(run: (state: IdentityState) => void) => (() => void)} subscribe
 *   Svelte store contract: call immediately with current state, then on change,
 *   and return an unsubscribe.
 * @property {() => IdentityCapabilities} getCapabilities
 * @property {(credentials?: object) => Promise<void>} [signIn]
 * @property {() => Promise<void>} [signOut]
 * @property {(patch: { displayName?: string }) => Promise<void>} [updateProfile]
 */

/**
 * @typedef {object} IdentityState
 * @property {boolean} ready    False only while an async provider is resolving.
 * @property {Identity} identity
 * @property {Error|null} error
 */

/** The identity of someone who has not signed in. Never null — see below. */
export function anonymousIdentity() {
  return {
    provider: 'anonymous',
    subject: null,
    agentIri: null,
    displayName: '',
    email: null,
    authenticated: false,
    grantedScopes: [],
  }
}

/**
 * Normalise whatever a provider produced.
 *
 * Returns an anonymous identity rather than null for an absent user, so callers
 * never branch on nullness to decide whether the app works. That branch is what
 * made "no Firebase" feel like a degraded mode instead of a supported one.
 */
export function normalizeIdentity(raw, { provider }) {
  if (!raw) return { ...anonymousIdentity(), provider }

  const displayName = typeof raw.displayName === 'string' ? raw.displayName : ''
  return {
    provider,
    subject: raw.subject ?? null,
    agentIri: typeof raw.agentIri === 'string' && raw.agentIri ? raw.agentIri : null,
    displayName,
    email: typeof raw.email === 'string' && raw.email ? raw.email : null,
    authenticated: Boolean(raw.subject),
    grantedScopes: Array.isArray(raw.grantedScopes) ? [...raw.grantedScopes] : [],
  }
}

/** The state a provider reports before it has resolved anything. */
export function pendingState(provider) {
  return { ready: false, identity: { ...anonymousIdentity(), provider }, error: null }
}

/**
 * Fields that must never leave the instance inside published or exported data.
 *
 * Exported so the boundary checks in `sessionPackage.js` and the conformance
 * harness test the same rule this module states, rather than each keeping its
 * own list that can drift.
 */
export const PRIVATE_IDENTITY_FIELDS = ['subject', 'email']

/** A copy safe to attribute publicly: no provider-specific identifier. */
export function publicAttribution(identity) {
  return {
    agentIri: identity.agentIri,
    displayName: identity.displayName,
    provider: identity.provider,
  }
}
