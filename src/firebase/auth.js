import { browser } from '$app/environment'
import { writable } from 'svelte/store'
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

export function defaultDisplayNameFromEmail(email) {
  if (!email || typeof email !== 'string') return ''
  const local = email.split('@')[0]
  return local || ''
}

const configured = isFirebaseConfigured()
const initialState = { ready: !browser || !configured, configured, user: null, error: null }

const authStateStore = writable(initialState, (set) => {
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

export const authState = { subscribe: authStateStore.subscribe }

export function syncAuthDisplayName(displayName) {
  authStateStore.update((state) => {
    if (!state.user) return state
    return { ...state, user: { ...state.user, displayName } }
  })
}

export async function signInWithEmail(email, password) {
  const { auth } = await requireFirebaseClient()
  const { signInWithEmailAndPassword } = await import('firebase/auth')
  return signInWithEmailAndPassword(auth, email, password)
}

export async function createEmailAccount(email, password, displayName = '') {
  const { auth } = await requireFirebaseClient()
  const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth')
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const finalName = (displayName?.trim()) || defaultDisplayNameFromEmail(email)
  if (finalName) {
    await updateProfile(credential.user, { displayName: finalName })
    syncAuthDisplayName(finalName)
  }
  return credential
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

export async function updateAuthProfile({ displayName }) {
  const { auth } = await requireFirebaseClient()
  if (!auth.currentUser) throw new Error('No signed-in user.')
  const { updateProfile } = await import('firebase/auth')
  const cleaned = displayName?.trim() ?? ''
  await updateProfile(auth.currentUser, { displayName: cleaned })
  syncAuthDisplayName(cleaned)
}
