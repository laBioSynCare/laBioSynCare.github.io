// The single place the application asks who someone is.
//
// Which provider backs this is a deployment decision, not an application one:
// `runtime-config.json` selects it (ADR 0038; the runtime-config mechanism is
// gap G6 in PORTABLE_DEPLOYMENT), so one immutable package runs
// with accounts or without. Consumers import `identity` and never learn which.

import { derived, readable } from 'svelte/store'
import { getRuntimeConfig } from '../config/runtimeConfig.js'
import { isFirebaseConfigured } from '../firebase/client.js'
import { createAnonymousIdentityProvider } from './anonymousIdentityProvider.js'
import { createFirebaseIdentityProvider } from './firebaseIdentityProvider.js'
import { anonymousIdentity } from './IdentityProvider.js'

let provider = null

/**
 * The provider this deployment selected.
 *
 * Strictly: the deployment must have chosen Firebase for *identity*, and
 * credentials must exist. An earlier version read
 * `(wantsFirebase || isFirebaseConfigured()) && isFirebaseConfigured()`, which
 * reduces to `isFirebaseConfigured()` — the choice was dead code. Because that
 * helper is true when *either* seam selects Firebase, a deployment configured
 * `identity: anonymous` with `storage: firestore` silently got Firebase
 * identity, defeating the two-seam split (ADR 0038).
 */
export function identityProvider() {
  if (!provider) {
    const wantsFirebase = getRuntimeConfig().identity.provider === 'firebase'
    provider = wantsFirebase && isFirebaseConfigured()
      ? createFirebaseIdentityProvider()
      : createAnonymousIdentityProvider()
  }
  return provider
}

/** Test seam: force a provider, or clear it so selection runs again. */
export function setIdentityProvider(next) {
  provider = next ?? null
}

/** `$identity` — the current IdentityState. */
export const identityState = readable(
  { ready: false, identity: anonymousIdentity(), error: null },
  (set) => identityProvider().subscribe(set),
)

/** `$identity` — just the Identity, which is what most callers want. */
export const identity = derived(identityState, ($state) => $state.identity)

/** `$identityReady` — false only while an async provider is resolving. */
export const identityReady = derived(identityState, ($state) => $state.ready)

/** What this deployment's provider can do, for conditioning UI. */
export function identityCapabilities() {
  return identityProvider().getCapabilities()
}

export async function signIn(credentials) {
  const p = identityProvider()
  if (!p.signIn) throw new Error('This instance does not offer sign-in.')
  return p.signIn(credentials)
}

export async function signOut() {
  const p = identityProvider()
  if (!p.signOut) return
  return p.signOut()
}

export async function updateIdentityProfile(patch) {
  const p = identityProvider()
  if (!p.updateProfile) throw new Error('This instance cannot edit the profile.')
  return p.updateProfile(patch)
}
