import { createDraft } from './presetDraft.js'
import { tempoContextFromTiming } from './tempo.js'

export const creatorSession = {
  draft: createDraft(),
  statusMsg: '',
  expandedMod: null,
  engine: null,
  voiceHandles: new Map(),
  liveValues: {},
  liveTempo: tempoContextFromTiming({ bpm: { value: 60 }, beatsPerBar: 4 }),
  controlStates: {},
  sessionStartTime: null,
}

export async function disposeCreatorSession() {
  if (creatorSession.engine) {
    try { await creatorSession.engine.dispose() } catch (_) {}
  }
  creatorSession.engine = null
  creatorSession.voiceHandles.clear()
  creatorSession.sessionStartTime = null
  creatorSession.draft.playing = false
}
