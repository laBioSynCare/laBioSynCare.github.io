// Starter-template registry for expanding the legacy Sensory Field routes into
// ordinary Patch Studio tracks. Starters share the same pure adapters used by
// compatibility entry points; they do not create a second Field workspace.

import { createFieldState } from '../field/fieldState.js'
import { createTreeState } from '../field/tree/treeState.js'
import { createAbstractState } from '../field/abstract/abstractState.js'
import { createLandscapeState } from '../field/landscape/landscapeState.js'
import { createEmptyDraft } from './presetDraft.js'
import {
  FIELD_TRACK_BUNDLE_MODEL,
  adaptAbstractState,
  adaptLandscapeState,
  adaptSensoryFieldState,
  adaptTreeState,
} from './fieldTrackAdapter.js'

const DEFINITIONS = [
  {
    id: 'sensory-field',
    label: 'Sensory Field',
    patchName: 'Sensory Field starter',
    description: 'Color field with independent left/right audio sources.',
    createState: createFieldState,
    adapt: adaptSensoryFieldState,
  },
  {
    id: 'stereoscopic-tree',
    label: 'Stereoscopic Tree',
    patchName: 'Stereoscopic Tree starter',
    description: 'Procedural tree as an ordinary spatial visual track.',
    createState: createTreeState,
    adapt: adaptTreeState,
  },
  {
    id: 'stereoscopic-abstraction',
    label: 'Stereoscopic Abstraction',
    patchName: 'Stereoscopic Abstraction starter',
    description: 'Seeded abstract scene as an ordinary spatial visual track.',
    createState: createAbstractState,
    adapt: adaptAbstractState,
  },
  {
    id: 'stereoscopic-landscape',
    label: 'Stereoscopic Landscape',
    patchName: 'Stereoscopic Landscape starter',
    description: 'Seeded landscape scene as an ordinary spatial visual track.',
    createState: createLandscapeState,
    adapt: adaptLandscapeState,
  },
]

export const FIELD_STARTERS = Object.freeze(DEFINITIONS.map(({ createState, adapt, ...metadata }) => (
  Object.freeze(metadata)
)))

export const FIELD_REPORT_SECTIONS = Object.freeze([
  Object.freeze({ key: 'mapped', label: 'Mapped' }),
  Object.freeze({ key: 'dormant', label: 'Dormant' }),
  Object.freeze({ key: 'warnings', label: 'Warnings', requiresAcknowledgement: true }),
  Object.freeze({ key: 'behaviorCorrections', label: 'Behavior corrections', requiresAcknowledgement: true }),
  Object.freeze({ key: 'unsupported', label: 'Unsupported', requiresAcknowledgement: true }),
  Object.freeze({ key: 'ignored', label: 'Ignored' }),
])

const FIELD_STAGE_POLICIES = Object.freeze(['preserve', 'replace'])

function definitionFor(starterId) {
  const definition = DEFINITIONS.find(({ id }) => id === starterId)
  if (!definition) throw new Error(`Unknown Field starter: ${starterId}`)
  return definition
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function getFieldStarter(starterId) {
  const definition = definitionFor(starterId)
  return FIELD_STARTERS.find(({ id }) => id === definition.id)
}

export function createFieldStarterBundle(starterId, { idFor } = {}) {
  const definition = definitionFor(starterId)
  const bundle = definition.adapt(definition.createState(), { idFor })
  return {
    ...bundle,
    starter: getFieldStarter(starterId),
  }
}

export function createFieldStarterDraft(starterId, { idFor } = {}) {
  const definition = definitionFor(starterId)
  const bundle = createFieldStarterBundle(starterId, { idFor })
  const draft = createEmptyDraft()
  return {
    draft: {
      ...draft,
      patchName: definition.patchName,
      visualStage: clone(bundle.stageSuggestion),
      controlTracks: clone(bundle.controlTracks),
      audioTracks: clone(bundle.audioTracks),
      visualTracks: clone(bundle.visualTracks),
      hapticTracks: clone(bundle.hapticTracks),
    },
    report: clone(bundle.report),
    starter: bundle.starter,
  }
}

export function fieldReportRequiresAcknowledgement(report) {
  return FIELD_REPORT_SECTIONS.some(({ key, requiresAcknowledgement }) => (
    requiresAcknowledgement && Array.isArray(report?.[key]) && report[key].length > 0
  ))
}

function validateInsertion(draft, trackBundle, stagePolicy) {
  if (!draft || typeof draft !== 'object') throw new TypeError('A Patch Studio draft is required.')
  if (trackBundle?.model !== FIELD_TRACK_BUNDLE_MODEL) {
    throw new TypeError('A Field track bundle is required.')
  }
  if (!FIELD_STAGE_POLICIES.includes(stagePolicy)) {
    throw new Error(`Unknown Field stage policy: ${stagePolicy}`)
  }
}

function addedTracksFromBundle(trackBundle) {
  return {
    controlTracks: clone(trackBundle.controlTracks ?? []),
    audioTracks: clone(trackBundle.audioTracks ?? []),
    visualTracks: clone(trackBundle.visualTracks ?? []),
    hapticTracks: clone(trackBundle.hapticTracks ?? []),
  }
}

/**
 * Append a bundle to the live draft without replacing the draft or its existing
 * track arrays. This is the UI seam used while playback is active; transport and
 * live/controller state deliberately remain outside this helper.
 */
export function appendFieldTrackBundleInPlace(
  draft,
  trackBundle,
  { stagePolicy = 'preserve' } = {},
) {
  validateInsertion(draft, trackBundle, stagePolicy)
  const addedTracks = addedTracksFromBundle(trackBundle)
  for (const key of ['controlTracks', 'audioTracks', 'visualTracks', 'hapticTracks']) {
    if (!Array.isArray(draft[key])) draft[key] = []
    draft[key].push(...addedTracks[key])
  }

  const stageApplied = stagePolicy === 'replace'
  if (stageApplied) draft.visualStage = clone(trackBundle.stageSuggestion)

  return {
    draft,
    addedTracks,
    report: clone(trackBundle.report),
    stage: {
      policy: stagePolicy,
      applied: stageApplied,
      reason: stageApplied
        ? 'The bundle stage suggestion was applied.'
        : 'The receiving patch retained its shared visual stage.',
    },
  }
}

/**
 * Insert a track bundle without mutating either argument.
 *
 * `preserve` keeps the receiving patch's shared projector. `replace` is an
 * explicit projector replacement. There is intentionally no inferred
 * "empty" policy: an audio-only patch may still have an authored stage.
 */
export function insertFieldTrackBundle(
  draft,
  trackBundle,
  { stagePolicy = 'preserve' } = {},
) {
  validateInsertion(draft, trackBundle, stagePolicy)
  const next = clone(draft)
  return appendFieldTrackBundleInPlace(next, trackBundle, { stagePolicy })
}
