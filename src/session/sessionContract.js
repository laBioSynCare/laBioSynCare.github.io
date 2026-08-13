// The native session contract: one schema, one set of controlled values, one
// way to identify and hash a session record.
//
// KR-02 found three incompatible session contracts — the live ontology, the
// prose in SESSION_MODEL.md, and a JSON-LD coercion that disagreed with the
// SHACL shape — and no committed schema or recorder to say which was
// authoritative. This module is that answer. `static/schemas/session.schema.json`
// is the contract; everything here is derived from it rather than restated
// beside it, because a second copy of an enum is a second thing to forget.
//
// Where the SHACL shapes are stricter than the JSON would need to be (duration
// bounds, a required master volume, a required preset reference), the shape
// wins and the schema says so. That is the whole point of the repair: the two
// contracts are one contract, and it is checkable in both directions by
// `make session-contract`.

import schema from '../../static/schemas/session.schema.json' with { type: 'json' }

export const SESSION_BUNDLE_MODEL = 'bsc-lab-session-bundle-1'

/** The schema document itself, for validators and for the gate. */
export const SESSION_SCHEMA = schema

const defs = schema.$defs

/** Controlled values, read out of the schema so they cannot drift from it. */
export const EVENT_TYPES = defs.event.properties.type.enum
export const RESPONSE_STATES = defs.responseState.enum
export const REPORT_PHASES = defs.report.properties.phase.enum
export const OBSERVATION_ROLES = defs.observationItem.properties.role.enum
export const UNWANTED_CATEGORIES = defs.unwantedExperience.properties.category.enum
export const COMPLETION_STATUSES = defs.instance.properties.completionStatus.enum
export const OUTPUT_GUARANTEES = defs.specification.properties.outputGuarantee.enum
export const PRIVACY_CLASSIFICATIONS = defs.privacy.properties.classification.enum
export const DELIVERY_MODALITIES = defs.instance.properties.deliveryModalities.items.enum

/**
 * Classifications a public repository may hold.
 *
 * Improvement plan 2.2 asks for a lint that permits only machine-marked
 * synthetic or explicitly public-safe fixtures. Making it a constant here, and
 * a gate check there, is what turns "the committed fixtures are synthetic" from
 * a comment into something CI can fail on.
 */
export const COMMITTABLE_CLASSIFICATIONS = ['synthetic', 'public-safe']

/** Fraction of the intended duration below which a session is abandoned. */
export const ABANDONED_FRACTION = 0.3

/** Tolerance for calling a session complete, absorbing engine-clock jitter. */
const COMPLETION_TOLERANCE = 0.995

/**
 * Derive completion status from what was actually delivered.
 *
 * Delivered time, not elapsed time: a session paused for ten minutes and then
 * finished is completed, and treating the pause as playback would call it
 * complete when it was not.
 */
export function deriveCompletionStatus(deliveredSeconds, intendedSeconds) {
  if (!(intendedSeconds > 0)) throw new Error('An intended duration is required to classify a session.')
  if (deliveredSeconds >= intendedSeconds * COMPLETION_TOLERANCE) return 'completed'
  if (deliveredSeconds > intendedSeconds * ABANDONED_FRACTION) return 'interrupted'
  return 'abandoned'
}

/** Stable stringify, so a hash depends on content and not on key order. */
export function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  const keys = Object.keys(value).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(',')}}`
}

/** SHA-256 of a canonical JSON document, the algorithm `contentHash` names. */
export async function contentHash(value) {
  const bytes = new TextEncoder().encode(canonicalJson(value))
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const ID_PATTERN = new RegExp(defs.id.pattern)

/** Assert an identifier is safe to place in an IRI path and stable enough to keep. */
export function assertId(id, what) {
  if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
    throw new Error(`${what} needs a stable lower-case identifier matching ${defs.id.pattern}; got ${JSON.stringify(id)}.`)
  }
  return id
}

/**
 * Derive the identifiers of a session's parts from the instance id.
 *
 * Every part of a session gets a stable id at creation, not at export: an
 * identifier minted during serialisation cannot be referred to afterwards,
 * which is exactly what made the old model unable to link a report to the
 * answer inside it.
 */
export function sessionIds(instanceId) {
  assertId(instanceId, 'A session instance')
  return {
    instance: instanceId,
    specification: `${instanceId}-spec`,
    event: (index) => `${instanceId}-event-${String(index).padStart(4, '0')}`,
    report: (phase) => `${instanceId}-report-${phase}`,
    item: (reportId, role) => `${reportId}-item-${role}`,
    experience: (reportId, index) => `${reportId}-ue-${String(index).padStart(2, '0')}`,
  }
}

/**
 * Every leaf path present in a document, as JSON Pointers.
 *
 * The loss report is only trustworthy if it is exhaustive, and it is only
 * exhaustive if something enumerates the document independently of the code
 * that projects it. This is that enumeration: the projection classifies these
 * pointers, and the gate fails if any is left unclassified. A field added to
 * the schema and forgotten in the projection therefore breaks the build instead
 * of vanishing quietly.
 */
export function leafPointers(value, base = '') {
  if (value === null || typeof value !== 'object') return [base]
  if (Array.isArray(value)) {
    if (value.length === 0) return [base]
    return value.flatMap((v, i) => leafPointers(v, `${base}/${i}`))
  }
  const keys = Object.keys(value)
  if (keys.length === 0) return [base]
  return keys.flatMap((k) => leafPointers(value[k], `${base}/${escapePointer(k)}`))
}

function escapePointer(key) {
  return key.replace(/~/g, '~0').replace(/\//g, '~1')
}
