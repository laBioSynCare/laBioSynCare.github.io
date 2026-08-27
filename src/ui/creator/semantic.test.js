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
import { FIELD_SEMANTICS, fieldGraphHref } from '../field/fieldSemantic.js'
import { applicationRoute } from '../../config/applicationUrls.js'
import { AUDIO_TRACK_TYPES, VISUAL_TRACK_TYPES } from './presetDraft.js'
import { SSTIM } from '../../rdf/namespaces.js'

// Mapping-registry golden test (improvement plan phase 0.3; audit finding
// KR-17): every ontology IRI the semantic bridges can emit must be declared
// in the live ontology modules, and unknown inputs must be explicitly
// unmapped instead of minting an sstim IRI.

const REPOSITORY_ROOT = new URL('../../../', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('static/ontology/manifest.json', REPOSITORY_ROOT), 'utf8'))
const moduleById = new Map(manifest.modules.map(module => [module.id, module]))
const fullProfile = manifest.profiles.find(profile => profile.id === 'full')
const MODULES = fullProfile.modules.map(id => moduleById.get(id).source.path)

let declared

beforeAll(() => {
  declared = new Set()
  for (const file of MODULES) {
    for (const q of new Parser().parse(readFileSync(new URL(file, REPOSITORY_ROOT), 'utf8'))) {
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
    expect(semanticGraphHref(info)).toBe(applicationRoute('/graph/'))
  })

  // Regression: both bridges used to emit `/#Term`, which reached the browser
  // only because the entrance forwards a stray hash, and which escapes the
  // deployment entirely under a project-page mount. The link must name /graph/
  // itself and must carry the configured base.
  it('a mapped term deep-links into the graph route, not the origin root', () => {
    const info = semanticForParameter(null, 'beatFreq')
    const href = semanticGraphHref(info)
    expect(href).toBe(`${applicationRoute('/graph/')}#beatHz`)
    expect(href.startsWith(applicationRoute('/graph/'))).toBe(true)
  })

  it('the Sensory Field bridge builds the same graph href shape', () => {
    const [info] = Object.values(FIELD_SEMANTICS)
    expect(fieldGraphHref(info)).toBe(
      `${applicationRoute('/graph/')}#${encodeURIComponent(localSemanticName(info.uri))}`,
    )
  })

  // The fallback test below proves the *fallback* is declared, not that it is
  // right. Five ADR 0046 visual types reached it and reported sstim:Voice, an
  // audio class. Every type the studio can actually add needs its own entry.
  it('every track type the studio can add is explicitly mapped', () => {
    const addable = [...new Set([...AUDIO_TRACK_TYPES, ...VISUAL_TRACK_TYPES])]
    const missing = addable.filter(type => !KNOWN_TRACK_TYPES.includes(type))
    expect(missing, `unmapped track types: ${missing.join(', ')}`).toEqual([])
  })

  it('a visual track never reports an audio class', () => {
    for (const type of VISUAL_TRACK_TYPES) {
      const { kind, uri } = semanticForTrackType(type)
      expect(kind, type).toBe('Visual track type')
      expect(uri, type).not.toBe(SSTIM('Voice').value)
    }
  })

  it('an unknown track type falls back to the declared generic Voice class', () => {
    const { uri } = semanticForTrackType('MysteryTrack')
    expect(declared.has(uri)).toBe(true)
  })
})
