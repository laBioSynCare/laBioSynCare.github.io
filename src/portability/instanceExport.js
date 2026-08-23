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
//   3. Integrity is checkable. Generated exports carry a SHA-256 over the
//      canonical payload, so truncation or editing is detected before apply.
//      Checksum-less hand-written files remain an explicit compatibility path;
//      they are structurally validated and clearly reported as unverified.

import { PRIVATE_IDENTITY_FIELDS } from '../identity/IdentityProvider.js'

export const INSTANCE_EXPORT_MODEL = 'bsc-lab-instance-export-1'

/** Largest export we will parse. Logbooks are text; this guards a mis-picked file. */
export const INSTANCE_EXPORT_MAX_BYTES = 16 * 1024 * 1024

const LOGBOOK_PREFIX = 'bsclab_logbook_v2'
const LOGBOOK_LEGACY = 'bsclab_logbook_v1'
const SKIN_KEY = 'bsclab.skin'
// Local annotations, written by src/rdf/annotations/localAnnotationStore.js.
// Referenced by key rather than importing the store implementation, so this
// module remains usable with any Storage-like object.
const ANNOTATION_KEY = 'bsclab.annotations.v1'
const PROFILE_KEY = 'bsclab.profile.v1'
// Locally saved Patch Studio patches, written by
// src/storage/localPatchStore.js. Referenced by key rather than imported
// so this module stays dependency-free.
const PATCH_KEY = 'bsclab.patchStudio.patches.v1'
const UNSAFE_OBJECT_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
const PAYLOAD_KEYS = new Set([
  'logbooks',
  'patches',
  'legacyLogbookEntries',
  'annotations',
  'profile',
  'preferences',
])
const MAX_JSON_DEPTH = 64
const MAX_JSON_VALUES = 250_000
const ISO_TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function own(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key)
}

function invalidExport(message) {
  throw new Error(`That export ${message}.`)
}

/**
 * Refuse values which are unsafe to copy into application state, even when a
 * caller invokes `applyInstanceExport` directly instead of going through JSON.
 * JSON itself cannot carry functions or cycles, but this boundary can.
 */
function assertSafeJson(value, label) {
  const stack = [{ value, depth: 0 }]
  const seen = new Set()
  let visited = 0

  while (stack.length > 0) {
    const current = stack.pop()
    const item = current.value
    visited++
    if (visited > MAX_JSON_VALUES) invalidExport(`${label} contains too many values`)
    if (current.depth > MAX_JSON_DEPTH) invalidExport(`${label} is nested too deeply`)

    if (
      item === null
      || typeof item === 'string'
      || typeof item === 'boolean'
      || (typeof item === 'number' && Number.isFinite(item))
    ) continue

    if (typeof item !== 'object') invalidExport(`${label} contains a value JSON cannot safely store`)
    if (seen.has(item)) invalidExport(`${label} contains a circular reference`)
    seen.add(item)

    if (!Array.isArray(item) && !isPlainObject(item)) {
      invalidExport(`${label} contains a non-plain object`)
    }
    for (const [key, child] of Object.entries(item)) {
      if (UNSAFE_OBJECT_KEYS.has(key)) invalidExport(`${label} contains the unsafe key "${key}"`)
      stack.push({ value: child, depth: current.depth + 1 })
    }
  }
}

function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') invalidExport(`${label} must be a non-empty string`)
}

function isValidIsoTimestamp(value) {
  if (typeof value !== 'string') return false
  const match = ISO_TIMESTAMP.exec(value)
  if (!match || !Number.isFinite(Date.parse(value))) return false

  // Date.parse normalises impossible calendar dates such as February 30. The
  // record contract says ISO timestamps, so reject those even though Date can
  // turn them into a different, technically formattable day.
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const calendarDate = new Date(0)
  calendarDate.setUTCFullYear(year, month - 1, day)
  calendarDate.setUTCHours(0, 0, 0, 0)
  return calendarDate.getUTCFullYear() === year
    && calendarDate.getUTCMonth() === month - 1
    && calendarDate.getUTCDate() === day
}

function assertOptionalIsoTimestamp(record, field, label) {
  if (!own(record, field) || record[field] === '') return
  if (!isValidIsoTimestamp(record[field])) {
    invalidExport(`${label} has an invalid ${field} value`)
  }
}

function privateIdentityKeyIn(value) {
  const stack = [value]
  const privateKeys = new Set([...PRIVATE_IDENTITY_FIELDS, 'uid'])
  while (stack.length > 0) {
    const item = stack.pop()
    if (!item || typeof item !== 'object') continue
    for (const [key, child] of Object.entries(item)) {
      if (privateKeys.has(key)) return key
      if (child && typeof child === 'object') stack.push(child)
    }
  }
  return null
}

function validateV2LogbookState(data, sectionIndex) {
  const label = `logbook section ${sectionIndex + 1}`
  if (!isPlainObject(data) || data.version !== 2) {
    invalidExport(`${label} is not version 2 logbook data`)
  }
  if (!Array.isArray(data.logbooks) || !Array.isArray(data.entries)) {
    invalidExport(`${label} must contain logbooks and entries arrays`)
  }

  const bookIds = new Set()
  for (const [index, book] of data.logbooks.entries()) {
    if (!isPlainObject(book)) invalidExport(`${label}, logbook ${index + 1} is not an object`)
    assertNonEmptyString(book.id, `${label}, logbook ${index + 1} ID`)
    assertNonEmptyString(book.name, `${label}, logbook ${index + 1} name`)
    if (bookIds.has(book.id)) invalidExport(`${label} repeats logbook ID "${book.id}"`)
    if (own(book, 'createdAt') && typeof book.createdAt !== 'string') {
      invalidExport(`${label}, logbook ${index + 1} has an invalid createdAt value`)
    }
    bookIds.add(book.id)
  }

  const entryIds = new Set()
  for (const [index, entry] of data.entries.entries()) {
    if (!isPlainObject(entry)) invalidExport(`${label}, entry ${index + 1} is not an object`)
    assertNonEmptyString(entry.id, `${label}, entry ${index + 1} ID`)
    assertNonEmptyString(entry.logbookId, `${label}, entry ${index + 1} logbook reference`)
    if (!bookIds.has(entry.logbookId)) {
      invalidExport(`${label}, entry ${index + 1} refers to an unknown logbook`)
    }
    if (entryIds.has(entry.id)) invalidExport(`${label} repeats entry ID "${entry.id}"`)
    if (own(entry, 'tags') && (
      !Array.isArray(entry.tags) || entry.tags.some((tag) => typeof tag !== 'string')
    )) {
      invalidExport(`${label}, entry ${index + 1} has invalid tags`)
    }
    if (own(entry, 'data') && !isPlainObject(entry.data)) {
      invalidExport(`${label}, entry ${index + 1} has invalid data`)
    }
    for (const field of ['type', 'date', 'createdAt']) {
      if (own(entry, field) && typeof entry[field] !== 'string') {
        invalidExport(`${label}, entry ${index + 1} has an invalid ${field} value`)
      }
    }
    entryIds.add(entry.id)
  }

  if (data.activeBook !== null && typeof data.activeBook !== 'string') {
    invalidExport(`${label} has an invalid active logbook reference`)
  }
  if (typeof data.activeBook === 'string' && !bookIds.has(data.activeBook)) {
    invalidExport(`${label} refers to an unknown active logbook`)
  }
  if (data.logbooks.length > 0 && !own(data, 'activeBook')) {
    invalidExport(`${label} is missing its active logbook reference`)
  }
}

/**
 * Validate the documented v1 portable payload without pretending this is a
 * full schema for the nested Patch Studio or annotation domain models. The
 * checks cover every value this module uses as a storage boundary.
 */
export function validateInstancePayload(payload) {
  if (!isPlainObject(payload)) invalidExport('has no payload object')
  assertSafeJson(payload, 'payload')

  const unknownSection = Object.keys(payload).find((key) => !PAYLOAD_KEYS.has(key))
  if (unknownSection) invalidExport(`contains an unsupported payload section: ${unknownSection}`)
  if (!Array.isArray(payload.logbooks)) invalidExport('is missing its logbook section')

  for (const [index, section] of payload.logbooks.entries()) {
    if (!isPlainObject(section)) invalidExport(`has an invalid logbook section at position ${index + 1}`)
    if (section.scope !== SCOPE_ANONYMOUS && section.scope !== SCOPE_ACCOUNT) {
      invalidExport(`uses an unknown logbook scope at position ${index + 1}`)
    }
    validateV2LogbookState(section.data, index)
  }

  for (const sectionName of ['annotations', 'patches', 'legacyLogbookEntries']) {
    if (!own(payload, sectionName)) continue
    if (!Array.isArray(payload[sectionName])) invalidExport(`has an invalid ${sectionName} section`)
    for (const [index, record] of payload[sectionName].entries()) {
      if (!isPlainObject(record)) {
        invalidExport(`has a non-object record in ${sectionName} at position ${index + 1}`)
      }
    }
  }

  const annotationIds = new Set()
  for (const [index, annotation] of (payload.annotations ?? []).entries()) {
    assertNonEmptyString(annotation.id, `annotation ${index + 1} ID`)
    if (annotationIds.has(annotation.id)) invalidExport(`repeats annotation ID "${annotation.id}"`)
    assertNonEmptyString(annotation.targetIri, `annotation ${index + 1} target`)
    if (typeof annotation.annotationText !== 'string') {
      invalidExport(`annotation ${index + 1} has invalid text`)
    }
    for (const field of ['createdAt', 'updatedAt']) {
      assertOptionalIsoTimestamp(annotation, field, `annotation ${index + 1}`)
    }
    annotationIds.add(annotation.id)
  }

  const patchIds = new Set()
  for (const [index, patch] of (payload.patches ?? []).entries()) {
    assertNonEmptyString(patch.id, `patch ${index + 1} ID`)
    if (patchIds.has(patch.id)) invalidExport(`repeats patch ID "${patch.id}"`)
    if (!isPlainObject(patch.patch)) invalidExport(`patch ${index + 1} has no patch object`)
    for (const field of ['createdAt', 'updatedAt']) {
      assertOptionalIsoTimestamp(patch, field, `patch ${index + 1}`)
    }
    patchIds.add(patch.id)
  }

  if (own(payload, 'profile') && !isPlainObject(payload.profile)) {
    invalidExport('has an invalid profile section')
  }
  if (own(payload, 'profile')) {
    const privateKey = privateIdentityKeyIn(payload.profile)
    if (privateKey) {
      invalidExport(`contains the private identity field "${privateKey}" in its profile`)
    }
  }

  if (own(payload, 'preferences')) {
    if (!isPlainObject(payload.preferences)) invalidExport('has an invalid preferences section')
    const preferenceKeys = Object.keys(payload.preferences)
    if (preferenceKeys.some((key) => key !== 'skin')) {
      invalidExport('contains an unsupported preference')
    }
    if (own(payload.preferences, 'skin')) {
      assertNonEmptyString(payload.preferences.skin, 'skin preference')
    }
  }

  return payload
}

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
    if (PRIVATE_IDENTITY_FIELDS.includes(key) || key === 'uid' || UNSAFE_OBJECT_KEYS.has(key)) continue
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
  validateInstancePayload(payload)
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
 * Parse and validate export file text. A checksum is verified when present;
 * intentional checksum-less, hand-written imports report `checksumVerified:
 * false`. Validation is separate from application so a caller can show an
 * accurate integrity status and summary before overwriting.
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
  const payload = validateInstancePayload(parsed.payload)
  let checksumVerified = false
  if (Object.prototype.hasOwnProperty.call(parsed, 'checksum')) {
    if (typeof parsed.checksum !== 'string' || !/^[0-9a-f]{64}$/i.test(parsed.checksum)) {
      throw new Error('That export has an invalid checksum field.')
    }
    const actual = await payloadChecksum(payload)
    if (actual !== parsed.checksum.toLowerCase()) {
      throw new Error('That export failed its integrity check — the file looks damaged or edited.')
    }
    checksumVerified = true
  }
  // A checksum-less envelope remains an intentional compatibility path for
  // hand-written imports. Callers must be able to distinguish that structural
  // acceptance from a checksum match, so they never describe it as verified.
  return { ...parsed, checksumVerified }
}

function uniqueMergedId(id, used, scope) {
  if (!used.has(id)) {
    used.add(id)
    return id
  }

  const label = scope === SCOPE_ACCOUNT ? SCOPE_ACCOUNT : SCOPE_ANONYMOUS
  const stem = `${id}--${label}`
  let candidate = stem
  let collision = 2
  while (used.has(candidate)) {
    candidate = `${stem}-${collision}`
    collision++
  }
  used.add(candidate)
  return candidate
}

/**
 * Combine v2 logbook states which have to share one destination storage key.
 *
 * The import order determines display order. IDs are retained when possible;
 * collisions are renamed predictably and every entry's logbook reference is
 * updated with the corresponding book ID. We reject states we cannot merge
 * without guessing, before any storage write takes place.
 */
function mergeV2LogbookStates(sources) {
  const merged = { version: 2, logbooks: [], entries: [], activeBook: null }
  const usedBookIds = new Set()
  const usedEntryIds = new Set()

  for (const source of sources) {
    const data = source.data
    if (
      data?.version !== 2
      || !Array.isArray(data.logbooks)
      || !Array.isArray(data.entries)
    ) {
      throw new Error(
        'Multiple logbook sections map to the same browser scope, but they are not compatible v2 logbook data. Nothing was restored.',
      )
    }

    const sourceBookIds = new Set()
    const bookIdMap = new Map()
    for (const book of data.logbooks) {
      if (!book || typeof book !== 'object' || typeof book.id !== 'string' || !book.id) {
        throw new Error('A logbook section cannot be merged safely because it has an invalid logbook ID. Nothing was restored.')
      }
      if (sourceBookIds.has(book.id)) {
        throw new Error('A logbook section cannot be merged safely because it repeats a logbook ID. Nothing was restored.')
      }
      sourceBookIds.add(book.id)
      const nextId = uniqueMergedId(book.id, usedBookIds, source.scope)
      bookIdMap.set(book.id, nextId)
      merged.logbooks.push({ ...book, id: nextId })
    }

    const sourceEntryIds = new Set()
    for (const entry of data.entries) {
      if (
        !entry
        || typeof entry !== 'object'
        || typeof entry.id !== 'string'
        || !entry.id
        || typeof entry.logbookId !== 'string'
        || !bookIdMap.has(entry.logbookId)
      ) {
        throw new Error('A logbook section cannot be merged safely because an entry has invalid references. Nothing was restored.')
      }
      if (sourceEntryIds.has(entry.id)) {
        throw new Error('A logbook section cannot be merged safely because it repeats an entry ID. Nothing was restored.')
      }
      sourceEntryIds.add(entry.id)
      const nextId = uniqueMergedId(entry.id, usedEntryIds, source.scope)
      merged.entries.push({
        ...entry,
        id: nextId,
        logbookId: bookIdMap.get(entry.logbookId),
      })
    }

    if (merged.activeBook === null && bookIdMap.has(data.activeBook)) {
      merged.activeBook = bookIdMap.get(data.activeBook)
    }
  }

  if (merged.activeBook === null && merged.logbooks.length > 0) {
    merged.activeBook = merged.logbooks[0].id
  }
  return merged
}

/**
 * Apply an accepted export to storage. `parseInstanceExport` reports separately
 * whether the file carried a matching checksum.
 *
 * Account-scoped data is re-keyed to whoever is importing, so an export taken
 * while signed in as one account restores correctly under another — or under
 * none. That is what makes this portable between instances rather than merely
 * a backup of one browser.
 *
 * @returns {{ restoredLogbooks: number, combinedLogbookSections: number, restoredLegacyEntries: number, replacedLegacyEntries: boolean, restoredAnnotations: number, replacedAnnotations: boolean, restoredPatches: number, replacedPatches: boolean, restoredProfile: number, restoredPreferences: number, clearedPreferences: number }}
 */
export function applyInstanceExport(storage, parsed, { uid = null } = {}) {
  let payload
  try {
    payload = validateInstancePayload(parsed?.payload)
  } catch (error) {
    throw new Error(`${error.message} Nothing was restored.`)
  }
  const logbookPlan = new Map()
  for (const book of payload.logbooks) {
    if (!book?.data || typeof book.data !== 'object') continue
    const key = book.scope === SCOPE_ACCOUNT ? logbookStorageKey(uid) : LOGBOOK_PREFIX
    const sources = logbookPlan.get(key) ?? []
    sources.push(book)
    logbookPlan.set(key, sources)
  }

  // Resolve every collision before the first write. In particular, importing
  // anonymous + account data while signed out maps both to the anonymous key;
  // sequential writes used to discard the first while reporting two restores.
  const plannedWrites = new Map()
  let combinedLogbookSections = 0
  for (const [key, sources] of logbookPlan) {
    const data = sources.length === 1 ? sources[0].data : mergeV2LogbookStates(sources)
    if (sources.length > 1) combinedLogbookSections += sources.length
    plannedWrites.set(key, JSON.stringify(data))
  }

  const restoredLogbooks = plannedWrites.size
  let restoredLegacyEntries = 0
  if (own(payload, 'legacyLogbookEntries')) {
    plannedWrites.set(LOGBOOK_LEGACY, JSON.stringify(payload.legacyLogbookEntries))
    restoredLegacyEntries = payload.legacyLogbookEntries.length
  }

  let restoredAnnotations = 0
  if (own(payload, 'annotations')) {
    plannedWrites.set(ANNOTATION_KEY, JSON.stringify(payload.annotations))
    restoredAnnotations = payload.annotations.length
  }

  let restoredPatches = 0
  if (own(payload, 'patches')) {
    plannedWrites.set(PATCH_KEY, JSON.stringify(payload.patches))
    restoredPatches = payload.patches.length
  }

  let restoredProfile = 0
  if (own(payload, 'profile')) {
    plannedWrites.set(PROFILE_KEY, JSON.stringify(payload.profile))
    restoredProfile = 1
  }

  let restoredPreferences = 0
  let clearedPreferences = 0
  const plannedRemovals = new Set()
  if (own(payload, 'preferences')) {
    if (own(payload.preferences, 'skin')) {
      plannedWrites.set(SKIN_KEY, payload.preferences.skin)
      restoredPreferences = 1
    } else {
      // An explicitly present empty preferences section means "no saved skin".
      // Missing preferences (accepted for compatibility) remains non-destructive.
      plannedRemovals.add(SKIN_KEY)
      clearedPreferences = 1
    }
  }

  // Snapshot every affected key before the first mutation. This also catches a
  // read-denied Storage object before an import can become partially visible.
  const keys = [...new Set([...plannedWrites.keys(), ...plannedRemovals])]
  const previous = new Map()
  try {
    for (const key of keys) previous.set(key, storage.getItem(key))
  } catch (error) {
    throw new Error(`Restore could not prepare browser storage: ${error.message}. Nothing was restored.`)
  }

  const attempted = []
  try {
    for (const [key, value] of plannedWrites) {
      attempted.push(key)
      storage.setItem(key, value)
    }
    for (const key of plannedRemovals) {
      attempted.push(key)
      storage.removeItem(key)
    }
  } catch (writeError) {
    const rollbackErrors = []
    for (const key of [...attempted].reverse()) {
      try {
        const oldValue = previous.get(key)
        if (oldValue === null) storage.removeItem(key)
        else storage.setItem(key, oldValue)
      } catch (rollbackError) {
        rollbackErrors.push(`${key}: ${rollbackError.message}`)
      }
    }
    if (rollbackErrors.length > 0) {
      throw new Error(
        `Restore failed (${writeError.message}), and browser storage also refused a complete rollback. `
        + `Some prior data may have changed: ${rollbackErrors.join('; ')}`,
      )
    }
    throw new Error(`Restore failed (${writeError.message}). Prior browser data was restored; nothing from the file was kept.`)
  }

  return {
    restoredLogbooks,
    combinedLogbookSections,
    restoredLegacyEntries,
    replacedLegacyEntries: own(payload, 'legacyLogbookEntries'),
    restoredAnnotations,
    replacedAnnotations: own(payload, 'annotations'),
    restoredPatches,
    replacedPatches: own(payload, 'patches'),
    restoredProfile,
    restoredPreferences,
    clearedPreferences,
  }
}

/** Filename for a download, dated so successive exports do not collide. */
export function instanceExportFilename(date = new Date()) {
  return `bsc-lab-export-${date.toISOString().slice(0, 10)}.json`
}
