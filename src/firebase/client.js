import { browser } from '$app/environment'
import { getRuntimeConfig, isRuntimeConfigLoaded } from '../config/runtimeConfig.js'

const CONFIG_FIELDS = [
  ['apiKey', 'VITE_FIREBASE_API_KEY'],
  ['authDomain', 'VITE_FIREBASE_AUTH_DOMAIN'],
  ['projectId', 'VITE_FIREBASE_PROJECT_ID'],
  ['appId', 'VITE_FIREBASE_APP_ID'],
]

let clientPromise = null

/** Firebase values compiled into this bundle, if any. */
export function buildTimeFirebaseConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  }
}

/**
 * The Firebase configuration actually in force.
 *
 * Runtime configuration wins over compiled-in values, so an operator can point
 * the immutable package at their own project — or, by selecting local
 * providers, decline to use Firebase at all — without rebuilding it (gap G6).
 */
export function getFirebaseConfig() {
  const runtime = getRuntimeConfig().firebase
  return runtime ?? buildTimeFirebaseConfig()
}

export function missingFirebaseConfigKeys() {
  const config = getFirebaseConfig()
  return CONFIG_FIELDS
    .filter(([field]) => !config[field])
    .map(([, envKey]) => envKey)
}

/**
 * Whether this deployment should use Firebase at all.
 *
 * Two conditions, and both matter. Credentials must exist, and the deployment
 * must have *selected* Firebase for identity or storage. The second is what
 * makes local-only a real deployment mode rather than an accident of missing
 * environment variables: an operator can hand out a package built with
 * credentials and still run it without accounts.
 *
 * Before the runtime config has loaded the selection is unknown, so this falls
 * back to the historical build-time behaviour and the root layout loads the
 * config before any provider is constructed.
 */
export function isFirebaseConfigured() {
  if (missingFirebaseConfigKeys().length > 0) return false
  if (!isRuntimeConfigLoaded()) return true

  const { identity, storage } = getRuntimeConfig()
  return identity.provider === 'firebase' || storage.provider === 'firestore'
}

export async function getFirebaseClient() {
  if (!browser || !isFirebaseConfigured()) return null

  if (!clientPromise) {
    clientPromise = Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore'),
    ]).then(([appModule, authModule, firestoreModule]) => {
      const app = appModule.getApps().length
        ? appModule.getApp()
        : appModule.initializeApp(getFirebaseConfig())

      return {
        app,
        auth: authModule.getAuth(app),
        db: firestoreModule.getFirestore(app),
      }
    })
  }

  return clientPromise
}

export async function requireFirebaseClient() {
  const client = await getFirebaseClient()
  if (!client) {
    throw new Error('Firebase is not configured. Add VITE_FIREBASE_* values to enable Firebase-backed features.')
  }
  return client
}
