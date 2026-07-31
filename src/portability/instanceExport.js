// Versioned instance export/import — the portable form of everything BSC Lab
// keeps about a person on this device.
//
// Why this exists (docs/technical/PORTABLE_DEPLOYMENT.md, gap G7): a workbench
// people are asked to self-host has to let them leave. Individual patches are
// already portable as files; this is the whole-instance equivalent, so a
// logbook written on the public instance can be carried to an institutional
// deployment and back.
//
// Three properties are deliberate:
//
//   1. No cloud dependency. Everything here reads and writes localStorage, so
//      export and import work in a build with no Firebase configuration at all.
//   2. No authentication identifiers. Logbook data is keyed per account as
//      `bsclab_logbook_v2:<uid>`, and that uid must not travel in an export —
//      the same rule AnnotationStore follows for RDF. Entries are exported
//      under a *scope* ("account" / "anonymous") and re-keyed on import to
//      whoever is importing.
//   3. Integrity is checkable. A SHA-256 over the canonical payload is carried
//      in the envelope, so a truncated or edited file is refused rather than
//      half-applied.

import { PRIVATE_IDENTITY_FIELDS } from '../identity/IdentityProvider.js'

export const INSTANCE_EXPORT_MODEL = 'bsc-lab-instance-export-1'

/** Largest export we will parse. Logbooks are text; this guards a mis-picked file. */
export const INSTANCE_EXPORT_MAX_BYTES = 16 * 1024 * 1024

const LOGBOOK_PREFIX = 'bsclab_logbook_v2'
const LOGBOOK_LEGACY = 'bsclab_logbook_v1'
const SKIN_KEY = 'bsclab.skin'
// Local annotations, written by src/rdf/annotations/localAnnotationStore.js.
// Referenced by key rather than imported so this module stays dependency-free
// and usable wherever a Storage-like object is available.
const ANNOTATION_KEY = 'bsclab.annotations.v1'
const PROFILE_KEY = 'bsclab.profile.v1'
// Locally saved Patch Studio patches, written by
// src/storage/localPatchStore.js. Referenced by key rather than imported
// so this module stays dependency-free.
const PATCH_KEY = 'bsclab.patchStudio.patches.v1'

/**
 * Identity fields that must never travel in a portable export.
 *
 * Kept in step with the identity seam's own PRIVATE_IDENTITY_FIELDS rather than
 * restated, so one policy governs exports, session packages and private sync.
 */
export function stripPrivateIdentity(value) {
  if (!value || typeof value !== 'object') return value
  const out = Array.isArray(value) ? [] : {}
  for (const [key, v] of Object.entries(value)) {
    if (PRIVATE_IDENTITY_FIELDS.includes(key) || key === 'uid') continue
    out[key] = v && typeof v === 'object' ? stripPrivateIdentity(v) : v
  }
  return out
}

/** Scope names used in the file. Deliberately not the storage keys. */
const SCOPE_ANONYMOUS = 'anonymous'
const SCOPE_ACCOUNT = 'account'

/**
 * Storage key for a logbook scope, given the account currently in use.
 * Mirrors the scheme in routes/logbook: anonymous data lives at the bare key,
 * account data at `<key>:<uid>`.
 */
export function logbookStorageKey(uid) {
  return uid ? `${LOGBOOK_PREFIX}:${encodeURIComponent(uid)}` : LOGBOOK_PREFIX
}

/** Stable stringify so the checksum does not depend on key insertion order. */
function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  const keys = Object.keys(value).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`
}

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Checksum of the payload, exposed so callers can verify without importing. */
export function payloadChecksum(payload) {
  return sha256Hex(canonical(payload))
}

function parseStoredArray(raw) {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((r) => r && typeof r === 'object') : []
  } catch {
    return []
  }
}

function parseStored(raw) {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Collect everything portable from a Storage-like object.
 *
 * @param {Storage} storage
 * @param {{ uid?: string|null }} [options]
 */
export function collectInstanceData(storage, { uid = null } = {}) {
  const logbooks = []

  const anonymous = parseStored(storage.getItem(LOGBOOK_PREFIX))
  if (anonymous) logbooks.push({ scope: SCOPE_ANONYMOUS, data: anonymous })

  if (uid) {
    const account = parseStored(storage.getItem(logbookStorageKey(uid)))
    if (account) logbooks.push({ scope: SCOPE_ACCOUNT, data: account })
  }

  // v1 data that never got migrated, so an export from a long-idle browser is
  // not silently lossy.
  const legacyRaw = storage.getItem(LOGBOOK_LEGACY)
  let legacy = null
  if (legacyRaw) {
    try {
      const parsed = JSON.parse(legacyRaw)
      if (Array.isArray(parsed) && parsed.length > 0) legacy = parsed
    } catch { /* ignore malformed legacy data */ }
  }

  const skin = storage.getItem(SKIN_KEY)

  // Local annotations carry no account identifier — the local store attributes
  // them to a device constant, and RDF export pseudonymises before publishing.
  const annotations = parseStoredArray(storage.getItem(ANNOTATION_KEY))

  // The profile is stored with whatever the identity provider supplied,
  // including an email. An email names a person as directly as a uid does, and
  // the export travels — to another instance, another account, a file someone
  // shares. So it is stripped here rather than trusted not to be there: the
  // identity provider still has it for account UI, and nothing downstream needs
  // it. Same rule as the uid, applied to the field that was quietly exempt.
  const profile = stripPrivateIdentity(parseStored(storage.getItem(PROFILE_KEY)))
  const patches = parseStoredArray(storage.getItem(PATCH_KEY))

  return {
    logbooks,
    ...(patches.length > 0 ? { patches } : {}),
    ...(legacy ? { legacyLogbookEntries: legacy } : {}),
    ...(annotations.length > 0 ? { annotations } : {}),
    ...(profile ? { profile } : {}),
    preferences: skin ? { skin } : {},
  }
}

/**
 * Build the export envelope. `appVersion` is informational only — an export
 * from a newer build still imports, because the payload is versioned by model.
 */
export async function buildInstanceExport(storage, { uid = null, appVersion = 'unknown' } = {}) {
  const payload = collectInstanceData(storage, { uid })
  return {
    model: INSTANCE_EXPORT_MODEL,
    exportedAt: new Date().toISOString(),
    appVersion,
    checksum: await payloadChecksum(payload),
    payload,
  }
}

/** Human-readable counts, for confirming before overwriting anything. */
export function summarizeInstanceExport(payload) {
  const entries = payload.logbooks.reduce(
    (n, book) => n + (Array.isArray(book.data?.entries) ? book.data.entries.length : 0),
    0,
  )
  const books = payload.logbooks.reduce(
    (n, book) => n + (Array.isArray(book.data?.logbooks) ? book.data.logbooks.length : 0),
    0,
  )
  return {
    logbooks: books,
    entries,
    annotations: payload.annotations?.length ?? 0,
    patches: payload.patches?.length ?? 0,
    hasProfile: Boolean(payload.profile),
    legacyEntries: payload.legacyLogbookEntries?.length ?? 0,
    hasPreferences: Object.keys(payload.preferences ?? {}).length > 0,
  }
}

/**
 * Parse and verify export file text. Throws with a message a user can act on.
 * Verification is separate from application so a caller can show a summary and
 * ask before overwriting.
 */
export async function parseInstanceExport(text) {
  if (typeof text !== 'string' || text.trim() === '') {
    throw new Error('The file is empty.')
  }
  if (text.length > INSTANCE_EXPORT_MAX_BYTES) {
    throw new Error('That file is too large to be a BSC Lab export.')
  }

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('That file does not contain an export object.')
  }
  if (parsed.model !== INSTANCE_EXPORT_MODEL) {
    throw new Error(
      parsed.model
        ? `Unsupported export model: ${parsed.model}`
        : 'That file is missing a "model" field — it is not a BSC Lab export.',
    )
  }
  const payload = parsed.payload
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('That export has no payload.')
  }
  if (!Array.isArray(payload.logbooks)) {
    throw new Error('That export is missing its logbook section.')
  }
  if (typeof parsed.checksum === 'string') {
    const actual = await payloadChecksum(payload)
    if (actual !== parsed.checksum) {
      throw new Error('That export failed its integrity check — the file looks damaged or edited.')
    }
  }
  return parsed
}

/**
 * Apply a verified export to storage.
 *
 * Account-scoped data is re-keyed to whoever is importing, so an export taken
 * while signed in as one account restores correctly under another — or under
 * none. That is what makes this portable between instances rather than merely
 * a backup of one browser.
 *
 * @returns {{ restoredLogbooks: number, restoredAnnotations: number, restoredPatches: number, restoredPreferences: number }}
 */
export function applyInstanceExport(storage, parsed, { uid = null } = {}) {
  const payload = parsed.payload
  let restoredLogbooks = 0

  for (const book of payload.logbooks) {
    if (!book?.data || typeof book.data !== 'object') continue
    const key = book.scope === SCOPE_ACCOUNT ? logbookStorageKey(uid) : LOGBOOK_PREFIX
    storage.setItem(key, JSON.stringify(book.data))
    restoredLogbooks++
  }

  if (Array.isArray(payload.legacyLogbookEntries) && payload.legacyLogbookEntries.length > 0) {
    storage.setItem(LOGBOOK_LEGACY, JSON.stringify(payload.legacyLogbookEntries))
  }

  let restoredAnnotations = 0
  if (Array.isArray(payload.annotations) && payload.annotations.length > 0) {
    storage.setItem(ANNOTATION_KEY, JSON.stringify(payload.annotations))
    restoredAnnotations = payload.annotations.length
  }

  let restoredPatches = 0
  if (Array.isArray(payload.patches) && payload.patches.length > 0) {
    storage.setItem(PATCH_KEY, JSON.stringify(payload.patches))
    restoredPatches = payload.patches.length
  }

  if (payload.profile && typeof payload.profile === 'object' && !Array.isArray(payload.profile)) {
    storage.setItem(PROFILE_KEY, JSON.stringify(payload.profile))
  }

  let restoredPreferences = 0
  const skin = payload.preferences?.skin
  if (typeof skin === 'string' && skin) {
    storage.setItem(SKIN_KEY, skin)
    restoredPreferences++
  }

  return { restoredLogbooks, restoredAnnotations, restoredPatches, restoredPreferences }
}

/** Filename for a download, dated so successive exports do not collide. */
export function instanceExportFilename(date = new Date()) {
  return `bsc-lab-export-${date.toISOString().slice(0, 10)}.json`
}
