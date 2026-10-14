import {
  BSCLAB_EVIDENCE,
  BSCLAB_EXPERIMENT,
  BSCLAB_PRESET,
  BSCLAB_PROTOCOL,
  SSTIM_IDENTIFIER_ROOT,
  SSTIM_REF,
} from './namespaces.js'

// Committed public records that w3id.org resolves by one pattern per family
// (ADR 0065). Adding a record to a family needs no registry change.
//
// A family whose records each have their own committed file resolves an
// identifier to that file, named after it. A family whose records share files
// resolves it to a generated record document holding that record alone. Either
// way the target exists only for a committed record, so an identifier that
// names nothing ends at a 404 and never at a file that seems to describe it.
//
// `path` is the grammar the w3id.org rules accept after the family's base. A
// record whose identifier falls outside it could never resolve, and
// scripts/check-w3id-record-routes.mjs fails on it.

function family(id, prefix, namespace, path, options) {
  return Object.freeze({ id, prefix, base: namespace('').value, path, ...options })
}

export const RECORD_FAMILIES = Object.freeze([
  family('preset', 'bsclab-preset', BSCLAB_PRESET, '[a-z0-9-]+', {
    directory: 'instances/presets/',
    graphKind: 'catalogPreset',
  }),
  family('protocol', 'bsclab-protocol', BSCLAB_PROTOCOL, '[a-z0-9-]+', {
    directory: 'instances/protocols/',
    graphKind: 'catalogProtocol',
  }),
  family('experiment', 'bsclab-experiment', BSCLAB_EXPERIMENT, '[a-z0-9-]+', {
    directory: 'instances/experiments/',
    graphKind: 'catalogExperiment',
  }),
  // Evidence identifiers nest: a claim's revision, and that revision's
  // proposition, scope and bases, are each a record of their own.
  family('evidence', 'bsclab-evidence', BSCLAB_EVIDENCE, '[a-z0-9-]+(?:/[a-z0-9-]+)*', {
    recordDocuments: true,
    graphKind: 'catalogEvidence',
  }),
  family('reference', 'sstim-ref', SSTIM_REF, '[A-Z][A-Z0-9_]*', {
    recordDocuments: true,
    graphKind: 'catalogReference',
  }),
])

/** Where generated record documents live, under the published /ontology/ tree. */
export const RECORD_DOCUMENT_DIRECTORY = 'records/'

/** The identifier a record is resolved by: its IRI without a `#` part. */
export function recordIdentifier(iri) {
  return String(iri).split('#')[0]
}

/** The family a record identifier belongs to, or null. */
export function recordFamilyOf(iri) {
  const identifier = recordIdentifier(iri)
  return RECORD_FAMILIES.find(candidate =>
    identifier.startsWith(candidate.base) && identifier.length > candidate.base.length) ?? null
}

/** The identifier after its family's base: `perform-alpha-10-seed`, `CHAN_2022`. */
export function recordLocalPath(iri) {
  const owner = recordFamilyOf(iri)
  return owner ? recordIdentifier(iri).slice(owner.base.length) : null
}

/** True when the identifier is one the family's w3id.org rule can match. */
export function matchesRecordGrammar(iri) {
  const owner = recordFamilyOf(iri)
  return Boolean(owner) && new RegExp(`^(?:${owner.path})$`).test(recordLocalPath(iri))
}

/**
 * The document a record identifier resolves to, relative to /ontology/: the
 * record's own committed file, or its generated record document.
 */
export function recordDocumentPath(iri) {
  const owner = recordFamilyOf(iri)
  if (!owner) return null
  const local = recordLocalPath(iri)
  if (owner.recordDocuments) {
    return `${RECORD_DOCUMENT_DIRECTORY}${recordIdentifier(iri).slice(SSTIM_IDENTIFIER_ROOT.length)}.ttl`
  }
  return `${owner.directory}${local}.ttl`
}
