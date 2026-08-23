// Firebase Auth behind the identity contract.
//
// This is a thin adapter, deliberately. src/firebase/auth.js keeps the SDK
// details; what changes is that the application no longer imports it. The
// translation that matters happens in `toIdentity`: a Firebase user becomes an
// Identity whose `subject` is the uid — usable as a storage key — while
// `agentIri` stays null, because a Firebase uid is not a public, dereferenceable
// name for anyone and must never be published or exported.

import { derived } from 'svelte/store'
import {
  authState,
  signInWithEmail,
  createEmailAccount,
  signInWithGoogle,
  signOutCurrentUser,
  updateAuthProfile,
  defaultDisplayNameFromEmail,
} from '../firebase/auth.js'
import { anonymousIdentity, normalizeIdentity } from './IdentityProvider.js'

function toIdentity(user) {
  if (!user) return anonymousIdentity()
  return normalizeIdentity({
    subject: user.uid,
    // Deliberately null. A uid is a private key into one vendor's database, not
    // an identifier anyone else can resolve, and treating it as public is the
    // leak this whole seam exists to make structurally impossible.
    agentIri: null,
    displayName: user.displayName || defaultDisplayNameFromEmail(user.email),
    email: user.email ?? null,
  }, { provider: 'firebase' })
}

export function createFirebaseIdentityProvider() {
  const store = derived(authState, ($auth) => ({
    ready: $auth.ready,
    identity: toIdentity($auth.user),
    error: $auth.error ?? null,
  }))

  return {
    id: 'firebase',
    subscribe: store.subscribe,
    getCapabilities: () => ({
      canSignIn: true,
      canEditProfile: true,
      providesAgentIri: false,
    }),
    async signIn(credentials = {}) {
      const { method = 'email', email, password, displayName } = credentials
      if (method === 'google') return void (await signInWithGoogle())
      if (method === 'create') return void (await createEmailAccount(email, password, displayName))
      await signInWithEmail(email, password)
    },
    signOut: () => signOutCurrentUser(),
    updateProfile: (patch) => updateAuthProfile(patch),
  }
}
