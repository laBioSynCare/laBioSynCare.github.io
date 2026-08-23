// The provider for an instance that has no accounts, and the reason the rest of
// the application never has to ask whether it does.
//
// It is not a null object standing in for a real provider: running without
// accounts is a supported deployment mode selected by `runtime-config.json`, and
// on such an instance this *is* the identity system. Everything local-first
// keeps working; nothing is attributed to anyone.

import { readable } from 'svelte/store'
import { anonymousIdentity } from './IdentityProvider.js'

export function createAnonymousIdentityProvider() {
  // Ready immediately and never changes: there is nothing to resolve.
  const store = readable({ ready: true, identity: anonymousIdentity(), error: null })

  return {
    id: 'anonymous',
    subscribe: store.subscribe,
    getCapabilities: () => ({
      canSignIn: false,
      canEditProfile: false,
      providesAgentIri: false,
    }),
  }
}
