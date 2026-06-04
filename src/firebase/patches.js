import { requireFirebaseClient } from './client.js'

export const PATCH_STUDIO_COLLECTION = 'patchStudioPatches'
export const PATCH_STUDIO_MODEL = 'patch-studio-model-1'

function timestampToIso(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value.toDate === 'function') return value.toDate().toISOString()
  if (Number.isFinite(value.seconds)) return new Date(value.seconds * 1000).toISOString()
  return ''
}

function cleanPatchExport(patchExport) {
  const patch = JSON.parse(JSON.stringify(patchExport ?? {}))
  if (patch.model !== PATCH_STUDIO_MODEL) {
    throw new Error('Only Patch Studio patches can be saved.')
  }
  patch.patchName = (patch.patchName ?? '').toString().trim().slice(0, 200) || 'Untitled Patch'
  return patch
}

function patchFromSnapshot(snapshot) {
  const data = snapshot.data()
  const patch = data.patch ?? {}
  return {
    id: snapshot.id,
    userId: data.userId,
    patchName: data.patchName ?? patch.patchName ?? 'Untitled Patch',
    model: data.model ?? patch.model ?? '',
    patch,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  }
}

export async function listPatchStudioPatches(uid) {
  if (!uid) throw new Error('Sign in to load cloud patches.')
  const { db } = await requireFirebaseClient()
  const { collection, getDocs, query, where } = await import('firebase/firestore')
  const snapshot = await getDocs(query(
    collection(db, PATCH_STUDIO_COLLECTION),
    where('userId', '==', uid),
  ))
  return snapshot.docs
    .map(patchFromSnapshot)
    .sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''))
}

export async function savePatchStudioPatch(uid, patchExport, patchId = null) {
  if (!uid) throw new Error('Sign in to save cloud patches.')
  const { db } = await requireFirebaseClient()
  const patch = cleanPatchExport(patchExport)
  const payload = {
    userId: uid,
    patchName: patch.patchName,
    model: patch.model,
    patch,
  }

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
}

export async function deletePatchStudioPatch(uid, patchId) {
  if (!uid) throw new Error('Sign in to delete cloud patches.')
  if (!patchId) throw new Error('Choose a patch to delete.')
  const { db } = await requireFirebaseClient()
  const { deleteDoc, doc } = await import('firebase/firestore')
  await deleteDoc(doc(db, PATCH_STUDIO_COLLECTION, patchId))
}
