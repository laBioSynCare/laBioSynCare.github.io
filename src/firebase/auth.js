import { browser } from '$app/environment'
import { readable } from 'svelte/store'
import { getFirebaseClient, isFirebaseConfigured, requireFirebaseClient } from './client.js'

function publicUser(user) {
  if (!user) return null
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    isAnonymous: user.isAnonymous,
    photoURL: user.photoURL,
  }
}

const configured = isFirebaseConfigured()

export const authState = readable({
  ready: !browser || !configured,
  configured,
  user: null,
  error: null,
}, (set) => {
  if (!browser || !configured) {
    set({ ready: true, configured, user: null, error: null })
    return () => {}
  }

  let unsubscribe = () => {}
  let stopped = false

  getFirebaseClient()
    .then(async (client) => {
      if (stopped || !client) return
      const { onAuthStateChanged } = await import('firebase/auth')
      unsubscribe = onAuthStateChanged(
        client.auth,
        (user) => set({ ready: true, configured, user: publicUser(user), error: null }),
        (error) => set({ ready: true, configured, user: null, error }),
      )
    })
    .catch((error) => {
      if (!stopped) set({ ready: true, configured, user: null, error })
    })

  return () => {
    stopped = true
    unsubscribe()
  }
})

export async function signInWithEmail(email, password) {
  const { auth } = await requireFirebaseClient()
  const { signInWithEmailAndPassword } = await import('firebase/auth')
  return signInWithEmailAndPassword(auth, email, password)
}

export async function createEmailAccount(email, password) {
  const { auth } = await requireFirebaseClient()
  const { createUserWithEmailAndPassword } = await import('firebase/auth')
  return createUserWithEmailAndPassword(auth, email, password)
}

export async function signInForAnnotations() {
  const { auth } = await requireFirebaseClient()
  const { signInAnonymously } = await import('firebase/auth')
  return signInAnonymously(auth)
}

export async function signInWithGoogle() {
  const { auth } = await requireFirebaseClient()
  const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth')
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return signInWithPopup(auth, provider)
}

export async function signOutCurrentUser() {
  const { auth } = await requireFirebaseClient()
  const { signOut } = await import('firebase/auth')
  return signOut(auth)
}
