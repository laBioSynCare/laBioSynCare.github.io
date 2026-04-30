import { requireFirebaseClient } from './client.js'

export const PROFILE_COLLECTION = 'users'

const MAX = {
  displayName: 200,
  affiliation: 200,
  bio: 4000,
  email: 200,
}

function timestampToIso(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value.toDate === 'function') return value.toDate().toISOString()
  if (Number.isFinite(value.seconds)) return new Date(value.seconds * 1000).toISOString()
  return ''
}

function profileFromSnapshot(snapshot) {
  const data = snapshot.exists() ? snapshot.data() : {}
  return {
    displayName: data.displayName ?? '',
    bio: data.bio ?? '',
    affiliation: data.affiliation ?? '',
    email: data.email ?? '',
    updatedAt: timestampToIso(data.updatedAt),
  }
}

function clean(value, limit) {
  return (value ?? '').toString().trim().slice(0, limit)
}

export async function loadProfile(uid) {
  if (!uid) return null
  const { db } = await requireFirebaseClient()
  const { doc, getDoc } = await import('firebase/firestore')
  const snap = await getDoc(doc(db, PROFILE_COLLECTION, uid))
  return profileFromSnapshot(snap)
}

export async function saveProfile(uid, { displayName, bio, affiliation, email }) {
  if (!uid) throw new Error('Sign in to save your profile.')
  const { db } = await requireFirebaseClient()
  const { doc, serverTimestamp, setDoc } = await import('firebase/firestore')

  const payload = {
    displayName: clean(displayName, MAX.displayName),
    bio: clean(bio, MAX.bio),
    affiliation: clean(affiliation, MAX.affiliation),
    email: clean(email, MAX.email),
    updatedAt: serverTimestamp(),
  }

  await setDoc(doc(db, PROFILE_COLLECTION, uid), payload, { merge: true })

  return {
    displayName: payload.displayName,
    bio: payload.bio,
    affiliation: payload.affiliation,
    email: payload.email,
  }
}
