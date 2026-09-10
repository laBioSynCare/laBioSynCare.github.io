// Which entry point the Graph Navigator offers on arrival, and when to offer
// one at all.
//
// The navigator used to open on the whole term space: 749 nodes and 880 edges,
// about 7.5 seconds of layout, at a fit zoom where none of the labels resolve.
// "Explore the ontology" is the first button on the entrance, so that view was
// the project's answer to "what is SSTIM", and it answered with a hairball.
//
// Every concern scope loads in roughly 2.8 seconds regardless of its size, so
// the cost was never parsing the ontology: it was laying out 749 nodes. Below
// about 40 nodes the labels are legible and the shape reads; by 84 neither
// does. The six entry points here are the concerns that stay under that line
// and together describe what the standard covers: what a stimulus is, how it
// is described, and how it is justified.
//
// Choosing is deliberately left to the reader rather than resolved into a
// single default. SSTIM is a universal standard and BioSynCare is one
// audio-focused application of it (docs/ontology/SSTIM_DIRECTIONS.md), so
// opening every visit on Frequency bands, which is much the prettiest of these
// graphs, would tell a standards reviewer the opposite of what the project
// claims about its own scope.

import { GRAPH_CONCERNS } from './concerns.js'

// Ordered as a sentence about the domain, not by size.
export const ENTRY_POINT_VALUES = [
  'modality',
  'mechanism',
  'technique',
  'frequency',
  'evidence',
  'caution',
]

export const ENTRY_POINTS = ENTRY_POINT_VALUES.map((value) => {
  const concern = GRAPH_CONCERNS.find((candidate) => candidate.value === value)
  // A renamed or dropped concern must fail loudly here rather than silently
  // shrinking the chooser to five cards that nobody notices.
  if (!concern) throw new Error(`unknown graph concern in ENTRY_POINT_VALUES: ${value}`)
  return concern
})

// Every query parameter that already expresses a scope or a camera. A link
// carrying any of them has said where it wants to land, and w3id.org resolves
// into this page, so the chooser must never come between such a link and its
// target.
export const SCOPE_PARAMS = ['view', 'layer', 'module', 'hide', 'zoom', 'focus']

/**
 * Whether to offer the arrival chooser instead of building the graph directly.
 *
 * Pure so the deep-link contract can be tested without a browser: every legacy
 * `?view=` token, every node hash, and every saved in-app scope has to pass
 * straight through.
 */
export function shouldOfferEntryPoint({ search = '', hash = '', session = {} } = {}) {
  // Already chose one this session, including "show me everything": coming back
  // from About must not re-ask.
  if (session.entryChosen) return false

  // A node deep link (`/graph#highTheta`) names its own target.
  if (hash && hash !== '#') return false

  const params = new URLSearchParams(search)
  if (SCOPE_PARAMS.some((param) => params.has(param))) return false

  // An in-app return with a scope already applied. layerFilters is not tested:
  // it always carries a value ('terms' by default), so it can never
  // distinguish a fresh arrival from a returning one.
  if (session.concernFilters?.length) return false
  if (session.moduleFilters?.length) return false
  if (session.hiddenKinds?.length) return false

  return true
}
