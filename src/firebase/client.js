import { browser } from '$app/environment'

const CONFIG_FIELDS = [
  ['apiKey', 'VITE_FIREBASE_API_KEY'],
  ['authDomain', 'VITE_FIREBASE_AUTH_DOMAIN'],
  ['projectId', 'VITE_FIREBASE_PROJECT_ID'],
  ['appId', 'VITE_FIREBASE_APP_ID'],
]

let clientPromise = null

export function getFirebaseConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }
}

export function missingFirebaseConfigKeys() {
  const config = getFirebaseConfig()
  return CONFIG_FIELDS
    .filter(([field]) => !config[field])
    .map(([, envKey]) => envKey)
}

export function isFirebaseConfigured() {
  return missingFirebaseConfigKeys().length === 0
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
    throw new Error('Firebase is not configured. Add VITE_FIREBASE_* values to enable annotations.')
  }
  return client
}
