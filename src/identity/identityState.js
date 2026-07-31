// The single place the application asks who someone is.
//
// Which provider backs this is a deployment decision, not an application one:
// `runtime-config.json` selects it (ADR 0041 §2), so one immutable package runs
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
 * Firebase requires both that credentials exist *and* that the deployment chose
 * it — `isFirebaseConfigured()` already encodes both — so an operator can hand
 * out a package built with credentials and still run it without accounts.
 */
export function identityProvider() {
  if (!provider) {
    const wantsFirebase = getRuntimeConfig().identity.provider === 'firebase'
    provider = (wantsFirebase || isFirebaseConfigured()) && isFirebaseConfigured()
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
