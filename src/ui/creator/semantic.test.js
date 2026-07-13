import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'
import { Parser } from 'n3'
import {
  KNOWN_PARAMETERS,
  KNOWN_TRACK_TYPES,
  localSemanticName,
  semanticForParameter,
  semanticForTrackType,
  semanticGraphHref,
} from './semantic.js'
import { FIELD_SEMANTICS } from '../field/fieldSemantic.js'

// Mapping-registry golden test (improvement plan phase 0.3; audit finding
// KR-17): every ontology IRI the semantic bridges can emit must be declared
// in the live ontology modules, and unknown inputs must be explicitly
// unmapped instead of minting an sstim IRI.

const ONTOLOGY_DIR = new URL('../../../static/ontology/', import.meta.url)
const MODULES = [
  'sstim-core.ttl', 'sstim-vocab.ttl', 'sstim-exposure.ttl',
  'sstim-patch-studio.ttl', 'sstim-ecosystem.ttl',
]

let declared

beforeAll(() => {
  declared = new Set()
  for (const file of MODULES) {
    for (const q of new Parser().parse(readFileSync(new URL(file, ONTOLOGY_DIR), 'utf8'))) {
      if (q.subject.termType === 'NamedNode') declared.add(q.subject.value)
    }
  }
})

describe('semantic mapping registries (KR-17)', () => {
  it('every Patch Studio track-type mapping targets a declared IRI', () => {
    for (const type of KNOWN_TRACK_TYPES) {
      const { uri } = semanticForTrackType(type)
      expect(declared.has(uri), `${type} -> ${uri}`).toBe(true)
    }
  })

  it('every mapped Patch Studio parameter targets a declared IRI', () => {
    for (const param of KNOWN_PARAMETERS) {
      const { uri } = semanticForParameter(null, param)
      if (uri !== null) {
        expect(declared.has(uri), `${param} -> ${uri}`).toBe(true)
      }
    }
  })

  it('every Sensory Field mapping targets a declared IRI', () => {
    for (const [key, info] of Object.entries(FIELD_SEMANTICS)) {
      expect(declared.has(info.uri), `${key} -> ${info.uri}`).toBe(true)
    }
  })

  it('an unknown parameter is explicitly unmapped, never a minted IRI', () => {
    const info = semanticForParameter(null, 'mysteryKnob')
    expect(info.uri).toBeNull()
    expect(info.label).toBe('mysteryKnob')
    expect(localSemanticName(info.uri)).toBe('')
    expect(semanticGraphHref(info)).toBe('/')
  })

  it('an unknown track type falls back to the declared generic Voice class', () => {
    const { uri } = semanticForTrackType('MysteryTrack')
    expect(declared.has(uri)).toBe(true)
  })
})
