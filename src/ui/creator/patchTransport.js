// Patch Studio transport: engine lifecycle and the voices it schedules.
//
// Extracted from PresetCreator.svelte per PATCH_STUDIO.md §11.2, which asks for
// extraction rather than rewriting: every function here is the component's own
// code with its state reached through the host seam below instead of through
// closure over component `$state`.
//
// The point of the move is CLAUDE.md §3.1. The sole timing authority is
// `engine.getAudioContext().currentTime`, and it was threaded through a
// five-thousand-line component that also does Firestore CRUD, fullscreen
// handling and SVG path generation. Every read of that clock for scheduling now
// lives in this file, so there is one place to check that no second clock has
// appeared. No `Date.now()`, no `performance.now()`, no `setTimeout` for
// scheduling: voices are scheduled at `ctx.currentTime + lead` and stopped at
// `ctx.currentTime`.
//
// What is deliberately NOT here yet: `rafTick`. §11.2 lists it alongside these,
// but it is ~170 lines that read and write nine pieces of component reactive
// state (liveValues, controlStates, liveTempo, visualPhase, lastVisualTick,
// controllerTime, rafId, flashAccepted, and draft throughout), and most of its
// body is modulation application rather than transport. Routing all of that
// through an accessor seam in the same pass would be a large mechanical change
// with a silent failure mode, so it stays in the component and is tracked as
// the remaining half of the item. The rAF loop reads the clock too, and reads
// it the same way this file does.

import { createAudioEngine, audioEngines, getActiveAudioEngineId } from '../../engines/audio/audioEngines.js'
import { isoEnvSpec } from './waveformPaths.js'

// How far ahead of the clock a new voice is scheduled. Named because it is a
// timing constant on the authoritative clock, not an arbitrary delay.
export const VOICE_START_LEAD_SEC = 0.05

/**
 * Build the transport over a host that owns the component's reactive state.
 *
 * The host is an object of accessors rather than plain values: `draft`,
 * `engine` and the rest are Svelte 5 runes in the component, and reading a rune
 * through a getter at call time is what preserves reactivity across the module
 * boundary. Passing them by value would snapshot them once and silently detach
 * the transport from the UI.
 *
 * Required host members:
 *   get draft()                       the live patch draft
 *   get engine() / set engine(v)      the IAudioEngine, or null
 *   get voiceHandles()                Map<trackId, handle>, stable reference
 *   get sessionStartTime() / set      clock reading when playback began
 *   clearLiveValues()                 drop the modulation cache
 *   readParam(track, name, fallback)  live-or-base parameter read, coerced
 *   tip(message)                      the status line
 *   syncSession()                     persist component state to creatorSession
 */
export function createPatchTransport(host) {
  // Build and initialise the audio engine chosen in Settings, resolving to the
  // compatible default or the capability-free Silent engine when necessary.
  async function createEngine() {
    const { engine: created, id, fellBack } = createAudioEngine()
    if (fellBack) {
      const wanted = audioEngines.find((e) => e.id === getActiveAudioEngineId())
      const resolved = audioEngines.find((e) => e.id === id)
      host.tip(`${wanted?.name ?? 'Selected engine'} unavailable here — using ${resolved?.name ?? id}.`)
    } else {
      const desc = audioEngines.find((e) => e.id === id)
      if (desc && desc.id !== 'vanilla') host.tip(`Audio engine: ${desc.name}.`)
    }
    await created.initialize()
    return created
  }

  function trackToVoiceSpec(track) {
    const read = (name, fallback) => host.readParam(track, name, fallback)
    const gain = track.muted ? 0 : read('gain', track.params.gain?.value ?? 0.5)
    const spec = {
      type: track.trackType,
      volume: gain,
      params: { gain },
      tremolo: track.tremolo ? { ...track.tremolo } : null,
    }
    if (track.trackType === 'BinauralBeat') {
      spec.params.leftFreq = read('leftFreq', track.params.leftFreq.value)
      spec.params.rightFreq = read('rightFreq', track.params.rightFreq.value)
    } else if (track.trackType === 'Noise') {
      spec.params.pan = read('pan', track.params.pan?.value ?? 0)
      spec.params.cutoff = read('cutoff', track.params.cutoff?.value ?? 6000)
      spec.params.resonance = read('resonance', track.params.resonance?.value ?? 0.707)
      spec.noiseColor = track.noiseColor ?? 'pink'
      spec.noiseFilter = track.noiseFilter ?? 'lowpass'
    } else if (track.trackType === 'Drone') {
      spec.params.pan = read('pan', track.params.pan?.value ?? 0)
      spec.params.frequency = read('frequency', track.params.frequency?.value ?? 110)
      spec.params.detune = read('detune', track.params.detune?.value ?? 12)
      spec.droneVoices = track.droneVoices ?? 5
    } else if (track.trackType === 'Sample') {
      spec.params.pan = read('pan', track.params.pan?.value ?? 0)
      spec.sampleId = track.sampleId ?? 'rain'
    } else {
      spec.params.pan = read('pan', track.params.pan?.value ?? 0)
      spec.params.frequency = read('frequency', track.params.frequency?.value ?? 200)
      spec.params.pulseRate = read('pulseRate', track.params.pulseRate?.value ?? 10)
    }
    if (track.trackType === 'IsochronicTone') spec.envelope = isoEnvSpec(track)
    return spec
  }

  function startVoiceFor(track) {
    const engine = host.engine
    if (!engine) return
    const ctx = engine.getAudioContext()
    const handle = engine.scheduleVoice(trackToVoiceSpec(track), ctx.currentTime + VOICE_START_LEAD_SEC)
    host.voiceHandles.set(track.id, handle)
  }

  function stopVoiceFor(trackId) {
    const engine = host.engine
    if (!engine) return
    const handle = host.voiceHandles.get(trackId)
    if (!handle) return
    engine.stopVoice(handle, engine.getAudioContext().currentTime)
    host.voiceHandles.delete(trackId)
  }

  function stopAllVoices() {
    const engine = host.engine
    if (!engine) return
    const t = engine.getAudioContext().currentTime
    for (const handle of host.voiceHandles.values()) engine.stopVoice(handle, t)
    host.voiceHandles.clear()
  }

  // Rebuild a live voice from scratch — used when a structural choice (e.g. the
  // noise colour) changes, which can't be applied as a smooth AudioParam ramp.
  function restartVoice(track) {
    if (!host.draft.playing || !host.engine) return
    stopVoiceFor(track.id)
    startVoiceFor(track)
  }

  // Live rate/depth/mode update for an enabled tremolo (no voice restart).
  function applyTremolo(track) {
    const engine = host.engine
    if (!engine) return
    const handle = host.voiceHandles.get(track.id)
    if (handle) engine.setTremolo(handle, track.tremolo)
  }

  function stopPlayback() {
    stopAllVoices()
    host.draft.playing = false
    host.sessionStartTime = null
    host.clearLiveValues()
    host.syncSession()
  }

  function beginPlayback() {
    host.draft.playing = true
    host.sessionStartTime = host.engine.getAudioContext().currentTime
    host.syncSession()
    for (const track of host.draft.audioTracks) startVoiceFor(track)
  }

  async function togglePlay() {
    if (host.draft.playing) {
      stopPlayback()
      host.tip('Stopped.')
      return
    }
    try {
      if (!host.engine) host.engine = await createEngine()
      await host.engine.resume()
    } catch (e) {
      host.tip(`Audio unavailable: ${e.message ?? e}`)
      return
    }
    beginPlayback()
    host.tip('Playing…')
  }

  async function restartSystem() {
    stopPlayback()
    if (host.engine) {
      try { await host.engine.dispose() } catch (_) { /* disposing a dead engine is not an error */ }
      host.engine = null
      host.voiceHandles.clear()
      host.syncSession()
    }
    try {
      host.engine = await createEngine()
      await host.engine.resume()
    } catch (e) {
      host.tip(`Restart failed: ${e.message ?? e}`)
      return
    }
    beginPlayback()
    host.tip('Restarted.')
  }

  return {
    createEngine,
    trackToVoiceSpec,
    startVoiceFor,
    stopVoiceFor,
    stopAllVoices,
    restartVoice,
    applyTremolo,
    togglePlay,
    restartSystem,
  }
}
