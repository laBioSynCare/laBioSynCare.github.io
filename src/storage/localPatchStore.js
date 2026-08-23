// Local-first patch storage — the default implementation.
//
// Saved patches used to require an account and a configured Firebase project.
// With this they require neither: a visitor to a self-hosted instance, or to
// the public one with no sign-in, can save and reload their work on the device
// they are using.
//
// localStorage rather than IndexedDB, deliberately: patches are small JSON
// documents, the access pattern is list-all-then-read-one, and localStorage is
// synchronous and already carries the logbook and preferences, so the whole
// local surface stays exportable through src/portability/instanceExport.js by
// one mechanism. IndexedDB would be the right answer if patches grew large or
// numerous enough to need indexed queries; they have not.

import { cleanPatchExport, sortNewestFirst } from './PatchStore.js'

export const LOCAL_PATCH_KEY = 'bsclab.patchStudio.patches.v1'

/** Ids are opaque to callers; this only has to be unique within one device. */
function newId() {
  const random = globalThis.crypto?.randomUUID?.()
  return random ? `local-${random}` : `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function readAll(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(LOCAL_PATCH_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((r) => r && typeof r === 'object' && r.id) : []
  } catch {
    // A corrupted key must not make the studio unusable. Losing local patches
    // is bad; refusing to open is worse, and the file export exists for backup.
    return []
  }
}

function writeAll(storage, records) {
  storage.setItem(LOCAL_PATCH_KEY, JSON.stringify(records))
}

/**
 * @param {Storage} storage
 * @returns {import('./PatchStore.js').PatchStore}
 */
export function createLocalPatchStore(storage) {
  return {
    id: 'local',
    label: 'On this device',

    async list() {
      return sortNewestFirst(readAll(storage))
    },

    async save(patchExport, patchId = null) {
      const patch = cleanPatchExport(patchExport)
      const records = readAll(storage)
      const now = new Date().toISOString()

      if (patchId) {
        const index = records.findIndex((r) => r.id === patchId)
        if (index === -1) throw new Error('That patch no longer exists.')
        records[index] = {
          ...records[index],
          patchName: patch.patchName,
          model: patch.model,
          patch,
          updatedAt: now,
        }
        writeAll(storage, records)
        return patchId
      }

      const id = newId()
      records.push({
        id,
        patchName: patch.patchName,
        model: patch.model,
        patch,
        createdAt: now,
        updatedAt: now,
      })
      writeAll(storage, records)
      return id
    },

    async remove(patchId) {
      if (!patchId) throw new Error('Choose a patch to delete.')
      const records = readAll(storage)
      const next = records.filter((r) => r.id !== patchId)
      if (next.length === records.length) throw new Error('That patch no longer exists.')
      writeAll(storage, next)
    },
  }
}
