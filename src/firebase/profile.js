// Profile storage, local-first.
//
// A profile without an account is not meaningless: it is the display name
// attached to annotations written on this device. So rather than the profile
// page being unusable without Firebase, it edits a local record and an account
// simply moves that record to Firestore where it can follow you between
// devices. Same seam as patches and annotations (ADR 0038).

import { isFirebaseConfigured, requireFirebaseClient } from './client.js'

export const PROFILE_COLLECTION = 'users'
export const LOCAL_PROFILE_KEY = 'bsclab.profile.v1'

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

/** Shared normalisation, so local and Firestore accept exactly the same input. */
export function normalizeProfile({ displayName, bio, affiliation, email }) {
  return {
    displayName: clean(displayName, MAX.displayName),
    bio: clean(bio, MAX.bio),
    affiliation: clean(affiliation, MAX.affiliation),
    email: clean(email, MAX.email),
  }
}

const EMPTY_PROFILE = { displayName: '', bio: '', affiliation: '', email: '', updatedAt: '' }

export function readLocalProfile(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(LOCAL_PROFILE_KEY) ?? 'null')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ...EMPTY_PROFILE }
    return { ...EMPTY_PROFILE, ...normalizeProfile(parsed), updatedAt: parsed.updatedAt ?? '' }
  } catch {
    return { ...EMPTY_PROFILE }
  }
}

export function writeLocalProfile(storage, fields) {
  const payload = { ...normalizeProfile(fields), updatedAt: new Date().toISOString() }
  storage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(payload))
  return payload
}

export async function loadProfile(uid) {
  if (uid && isFirebaseConfigured()) {
    const { db } = await requireFirebaseClient()
    const { doc, getDoc } = await import('firebase/firestore')
    const snap = await getDoc(doc(db, PROFILE_COLLECTION, uid))
    return profileFromSnapshot(snap)
  }
  if (typeof localStorage === 'undefined') return null
  return readLocalProfile(localStorage)
}

export async function saveProfile(uid, fields) {
  if (uid && isFirebaseConfigured()) {
    const { db } = await requireFirebaseClient()
    const { doc, serverTimestamp, setDoc } = await import('firebase/firestore')
    const payload = { ...normalizeProfile(fields), updatedAt: serverTimestamp() }
    await setDoc(doc(db, PROFILE_COLLECTION, uid), payload, { merge: true })
    return normalizeProfile(fields)
  }
  if (typeof localStorage === 'undefined') {
    throw new Error('No profile storage is available in this browser.')
  }
  const saved = writeLocalProfile(localStorage, fields)
  return normalizeProfile(saved)
}
