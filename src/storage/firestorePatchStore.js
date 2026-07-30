// Firestore patch storage — the same contract as the local store, so the two
// are interchangeable and the conformance suite runs against both.
//
// The Firestore-specific logic that used to live in src/firebase/patches.js
// moves here unchanged in behaviour: same collection, same document shape, same
// ordering. Existing saved patches keep working.

import { cleanPatchExport, sortNewestFirst } from './PatchStore.js'

export const PATCH_STUDIO_COLLECTION = 'patchStudioPatches'

/** Firestore timestamps arrive in several shapes depending on write path. */
function timestampToIso(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value.toDate === 'function') return value.toDate().toISOString()
  if (Number.isFinite(value.seconds)) return new Date(value.seconds * 1000).toISOString()
  return ''
}

function patchFromSnapshot(snapshot) {
  const data = snapshot.data()
  const patch = data.patch ?? {}
  return {
    id: snapshot.id,
    patchName: data.patchName ?? patch.patchName ?? 'Untitled Patch',
    model: data.model ?? patch.model ?? '',
    patch,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  }
}

/**
 * @param {string} uid
 * @param {() => Promise<{ db: unknown }>} requireClient injected so tests and
 *   the conformance suite can supply a fake without importing Firebase
 * @returns {import('./PatchStore.js').PatchStore}
 */
export function createFirestorePatchStore(uid, requireClient) {
  if (!uid) throw new Error('Firestore patch storage needs a signed-in account.')

  return {
    id: 'firestore',
    label: 'Your account',

    async list() {
      const { db } = await requireClient()
      const { collection, getDocs, query, where } = await import('firebase/firestore')
      const snapshot = await getDocs(query(
        collection(db, PATCH_STUDIO_COLLECTION),
        where('userId', '==', uid),
      ))
      return sortNewestFirst(snapshot.docs.map(patchFromSnapshot))
    },

    async save(patchExport, patchId = null) {
      const { db } = await requireClient()
      const patch = cleanPatchExport(patchExport)
      const payload = { userId: uid, patchName: patch.patchName, model: patch.model, patch }
      const { addDoc, collection, doc, serverTimestamp, updateDoc } = await import('firebase/firestore')

      if (patchId) {
        await updateDoc(doc(db, PATCH_STUDIO_COLLECTION, patchId), {
          ...payload,
          updatedAt: serverTimestamp(),
        })
        return patchId
      }

      const docRef = await addDoc(collection(db, PATCH_STUDIO_COLLECTION), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return docRef.id
    },

    async remove(patchId) {
      if (!patchId) throw new Error('Choose a patch to delete.')
      const { db } = await requireClient()
      const { deleteDoc, doc } = await import('firebase/firestore')
      await deleteDoc(doc(db, PATCH_STUDIO_COLLECTION, patchId))
    },
  }
}
