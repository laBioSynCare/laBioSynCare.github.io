<script>
  import { onDestroy, onMount, tick } from 'svelte'
  import { afterNavigate, replaceState } from '$app/navigation'
  import Knob from './Knob.svelte'
  import SpatialTrackInspector from './SpatialTrackInspector.svelte'
  import StudioVisualStage from './StudioVisualStage.svelte'
  import VisualStageControls from './VisualStageControls.svelte'
  import { createAudioEngine, audioEngines, getActiveAudioEngineId } from '../../engines/audio/audioEngines.js'
  import { identityState } from '../../identity/identityState.js'
  import { pendingState } from '../../identity/IdentityProvider.js'
  // Patches go through the storage seam rather than straight to Firestore, so
  // saving works with no account and no Firebase at all — see ADR 0038 and
  // docs/technical/PORTABLE_DEPLOYMENT.md §3.2.
  import { requireFirebaseClient } from '../../firebase/client.js'
  import { defaultPatchStore } from '../../storage/patchStores.js'
  import { visualStimulationOn } from '../../ui/safety/visualSafety.js'
  import {
    FLASH_SAFE_MAX_HZ, clampFlashRate, flashRiskLevel, flashRiskMessage,
    requiresFlashAcknowledgement,
  } from '../../ui/safety/flashSafety.js'
  import { creatorSession } from './creatorSession.js'
  import {
    FIELD_REPORT_SECTIONS,
    FIELD_STARTERS,
    appendFieldTrackBundleInPlace,
    createFieldStarterBundle,
    fieldReportRequiresAcknowledgement,
    getFieldStarter,
    insertFieldTrackBundle,
  } from './fieldStarters.js'
  import {
    adaptAbstractState,
    adaptLandscapeState,
    adaptSensoryFieldState,
    adaptTreeState,
  } from './fieldTrackAdapter.js'
  import { FIELD_STORAGE_KEY } from '../field/fieldState.js'
  import { TREE_STORAGE_KEY } from '../field/tree/treeState.js'
  import { ABSTRACT_STORAGE_KEY } from '../field/abstract/abstractState.js'
  import { LANDSCAPE_STORAGE_KEY } from '../field/landscape/landscapeState.js'
  import {
    computeMartigliState,
    computeMartigliStateFree,
    computeSinusoidState,
    computeSymmetryState,
    martigliPathD,
  } from './controlSignals.js'
  import {
    AUDIO_PARAM_RANGE,
    AUDIO_PARAMS,
    AUDIO_TRACK_TYPES,
    BINAURAL_MODES,
    BLEND_MODES,
    CONTROL_TYPES,
    HAPTIC_PARAM_RANGE,
    HAPTIC_PARAMS,
    HAPTIC_TRACK_TYPES,
    ISO_ENVELOPES,
    ISO_ENVELOPE_DEFAULTS,
    MARTIGLI_PARAM_RANGE,
    MARTIGLI_PARAMS,
    DRONE_VOICES,
    MARTIGLI_WAVEFORMS,
    NOISE_COLORS,
    NOISE_FILTERS,
    SAMPLE_CLIPS,
    SINUSOID_PARAM_RANGE,
    SINUSOID_PARAMS,
    SYMMETRY_PARAM_RANGE,
    TREMOLO_MODES,
    TREMOLO_PARAM_RANGE,
    createTremolo,
    SYMMETRY_PARAMS,
    TEMPO_DIVISIONS,
    TEMPO_MODIFIERS,
    VISUAL_PARAM_RANGE,
    VISUAL_PARAMS,
    VISUAL_TRACK_TYPES,
    SPATIAL_VISUAL_TRACK_TYPES,
    PATCH_FILE_MAX_BYTES,
    TIMING_PARAM_RANGE,
    buildPatchExport,
    createAudioTrack,
    createControlTrack,
    createDraft,
    createEmptyDraft,
    createHapticTrack,
    createMod,
    createVisualTrack,
    draftFromPatchExport,
    draftFromPatchFileText,
    patchSummary,
    tempoSyncKindForTrackParam,
    validateDraft,
    visualParamNames,
    voiceParamNames,
  } from './presetDraft.js'
  import { firstEnabledVisualStageTrackId } from './visualTrackModel.js'
  import {
    buildPatchLink,
    decodePatchLink,
    readPatchLinkFrom,
  } from '../../portability/patchLink.js'
  import {
    localSemanticName,
    semanticForParameter,
    semanticForTrackType,
    semanticGraphHref,
  } from './semantic.js'
  import {
    clampBeatsPerBar,
    clampBpm,
    evaluateModulatedBpm,
    formatTempoSyncReadout,
    isTempoSyncEnabled,
    tempoContextFromTiming,
  } from './tempo.js'
  import {
    clampRange,
    evalParamValue,
    modAmountRange,
    resolveBinauralLR,
    effectiveTempoValue as tempoEffectiveValue,
  } from './modulation.js'
  import {
    binauralBeatEnvelopePath,
    binauralRowWindow,
    binauralSumPath,
    isoEnvSpec,
    isoEnvelopeOutlinePath,
    isoWavePath,
    noisePath,
    polygonPoints,
    rectanglePath,
    sineWavePath,
  } from './waveformPaths.js'

  let draft = $state(creatorSession.draft)
  let statusMsg = $state(creatorSession.statusMsg)
  let expandedMod = $state(creatorSession.expandedMod) // "trackId:paramName"
  let helpOpen = $state(false)
  let semanticInfo = $state(null)
  let auth = $state(pendingState('anonymous'))
  let saveMenuOpen = $state(false)
  let savedPatches = $state([])
  let storeLoading = $state(false)
  let storeSaving = $state(false)
  let storeError = $state(null)
  let currentPatchId = $state(null)
  let currentPatchName = $state(null)
  let busyPatchId = $state(null)
  let lastPatchUid = null
  let starterOffer = $state(null)
  let starterSequence = 0

  const STARTER_REQUESTS = {
    field: {
      starterId: 'sensory-field',
      storageKey: FIELD_STORAGE_KEY,
      adapt: adaptSensoryFieldState,
    },
    tree: {
      starterId: 'stereoscopic-tree',
      storageKey: TREE_STORAGE_KEY,
      adapt: adaptTreeState,
    },
    abstract: {
      starterId: 'stereoscopic-abstraction',
      storageKey: ABSTRACT_STORAGE_KEY,
      adapt: adaptAbstractState,
    },
    landscape: {
      starterId: 'stereoscopic-landscape',
      storageKey: LANDSCAPE_STORAGE_KEY,
      adapt: adaptLandscapeState,
    },
  }

  // Local storage when signed out or unconfigured; the account when both are
  // available, so a signed-in user's patches follow them between devices.
  const patchStore = $derived(defaultPatchStore({
    uid: auth.identity.subject,
    // A Firestore patch store needs a Firebase subject, which only the Firebase
    // identity provider yields — so provider identity, not a global config flag.
    firebaseConfigured: auth.identity.provider === 'firebase',
    requireClient: requireFirebaseClient,
  }))

  const unsubscribeAuth = identityState.subscribe((value) => {
    auth = value
  })

  let engine = creatorSession.engine
  const voiceHandles = creatorSession.voiceHandles

  // Modulated parameter values per track, updated each animation frame while playing.
  // Previews read these via getLive(); base track.params[name].value stays the knob source.
  let liveValues = $state(creatorSession.liveValues)
  let liveTempo = $state(creatorSession.liveTempo)
  // Live per-control widget state ({ phase, value, currentPeriod, progress, ... }).
  // Updated every frame whether or not playing, so the control previews stay alive.
  let controlStates = $state(creatorSession.controlStates)
  let sessionStartTime = creatorSession.sessionStartTime
  let rafId = null

  // Free-running phase accumulators (cycles, [0,1)) for Blink/Oscillate visual
  // previews, advanced each frame by the track's live rate so previews animate
  // continuously and reflect modulation. Not reactive state — read via liveValues.
  const visualPhase = {}
  // Per-session consent to author Blink flicker above the 3 Hz general-safe
  // ceiling (flashSafety.js). Never persisted and never saved into the patch —
  // re-confirmed each authoring session so a shared patch can't flash a
  // recipient who never consented (ADR 0011).
  let flashAccepted = $state(false)
  let lastVisualTick = null
  let controllerTime = $state(0)

  // Visual mix window. It opens at a cross-eye-friendly size and only enters
  // true fullscreen after an explicit action inside the window.
  let mixOpen = $state(false)
  let mixFullscreen = $state(false)
  let mixDialogEl = $state(null)
  let mixTriggerEl = $state(null)
  let stageEl = $state(null)

  async function openMix() {
    mixOpen = true
    await tick()
    try {
      if (mixDialogEl?.showModal && !mixDialogEl.open) mixDialogEl.showModal()
      else if (mixDialogEl && !mixDialogEl.open) mixDialogEl.setAttribute('open', '')
    } catch (_) {
      mixDialogEl?.setAttribute('open', '')
    }
    mixDialogEl?.focus()
  }

  function closeMix() {
    try {
      if (document.fullscreenElement === stageEl) document.exitFullscreen?.()
      if (mixDialogEl?.open) mixDialogEl.close()
    } catch (_) {}
    mixFullscreen = false
    mixOpen = false
    queueMicrotask(() => mixTriggerEl?.focus())
  }

  async function toggleMixFullscreen() {
    try {
      if (document.fullscreenElement === stageEl) await document.exitFullscreen?.()
      else await stageEl?.requestFullscreen?.()
    } catch (_) {}
  }

  function handleMixCancel(event) {
    event.preventDefault()
    if (document.fullscreenElement === stageEl) {
      try { document.exitFullscreen?.() } catch (_) {}
      return
    }
    closeMix()
  }

  function handleMixBackdropClick(event) {
    if (event.target !== event.currentTarget) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const insideDialog = event.clientX >= bounds.left
      && event.clientX <= bounds.right
      && event.clientY >= bounds.top
      && event.clientY <= bounds.bottom
    if (!insideDialog) closeMix()
  }

  const summary = $derived(patchSummary(draft))
  const issues = $derived(validateDraft(draft))
  const hasErrors = $derived(issues.some(i => i.level === 'error'))
  const jsonExport = $derived(JSON.stringify(buildPatchExport(draft), null, 2))

  $effect(() => {
    if (!auth.ready) return
    const uid = auth.identity.subject
    if (uid === lastPatchUid) return
    lastPatchUid = uid
    currentPatchId = null
    currentPatchName = null
    savedPatches = []
    storeError = null
    // Refresh regardless of sign-in: signing out reveals the local store
    // rather than leaving the panel empty.
    refreshSavedPatches({ silent: true })
  })

  const STUDIO_HELP = [
    ['Add', 'Use the column + buttons to add control, audio, visual, and haptic tracks.'],
    ['Tune', 'Adjust each card directly; linked modulation appears under the M controls.'],
    ['Export', 'Copy or download JSON, or save signed-in patches to Firebase.'],
    ['Space', 'Start / stop playback.'],
    ['R', 'Stop playback and restart the audio engine.'],
    ['? / H', 'Toggle this help panel.'],
  ]

  const [BPM_MIN, BPM_MAX, BPM_STEP] = TIMING_PARAM_RANGE.bpm
  const [BPM_MOD_MIN, BPM_MOD_MAX, BPM_MOD_STEP] = [-(BPM_MAX - BPM_MIN), BPM_MAX - BPM_MIN, BPM_STEP]

  function syncCreatorSession() {
    creatorSession.draft = draft
    creatorSession.statusMsg = statusMsg
    creatorSession.expandedMod = expandedMod
    creatorSession.engine = engine
    creatorSession.liveValues = liveValues
    creatorSession.liveTempo = liveTempo
    creatorSession.controlStates = controlStates
    creatorSession.sessionStartTime = sessionStartTime
  }

  function showSemanticInfo(info) {
    semanticInfo = info
  }

  function showTrackTypeInfo(track) {
    showSemanticInfo(semanticForTrackType(track.trackType ?? track.type))
  }

  function showParamInfo(track, pname) {
    showSemanticInfo(semanticForParameter(track, pname))
  }

  function closeSemanticInfo() {
    semanticInfo = null
  }

  // ── Controls ──────────────────────────────────────────────────────────────────

  function addControl(type) { draft.controlTracks.push(createControlTrack(type)) }

  function removeControl(id) {
    if (draft.timing?.bpm?.mods) draft.timing.bpm.mods = draft.timing.bpm.mods.filter(m => m.controlId !== id)
    for (const col of [draft.audioTracks, draft.visualTracks, draft.hapticTracks])
      for (const track of col)
        for (const p of Object.values(track.params))
          p.mods = p.mods.filter(m => m.controlId !== id)
    tip('Control removed.')
  }

  // ── Sensory tracks ────────────────────────────────────────────────────────────

  function addAudio(t) {
    const track = createAudioTrack(t)
    draft.audioTracks.push(track)
    if (draft.playing && engine) startVoiceFor(track)
    tip(`${t} added.`)
  }
  function addVisual(t) { draft.visualTracks.push(createVisualTrack(t)); tip(`${t} added.`) }
  function addHaptic(t) { draft.hapticTracks.push(createHapticTrack(t)); tip(`${t} added.`) }

  function removeAudio(id) {
    stopVoiceFor(id)
    draft.audioTracks = draft.audioTracks.filter(t => t.id !== id)
    tip('Removed.')
  }
  function removeVisual(id) { draft.visualTracks = draft.visualTracks.filter(t => t.id !== id); tip('Removed.') }
  function updateVisualTrack(next) {
    draft.visualTracks = draft.visualTracks.map((track) => track.id === next.id ? next : track)
  }
  function isStudioStageTrack(track) {
    return track?.trackType === 'ColorField' || SPATIAL_VISUAL_TRACK_TYPES.includes(track?.trackType)
  }
  const studioStageTracks = $derived(draft.visualTracks.filter(isStudioStageTrack))
  const firstStudioStageTrackId = $derived(firstEnabledVisualStageTrackId(draft.visualTracks))

  function starterIdFactory(starterId) {
    const batch = ++starterSequence
    const used = new Set([
      ...draft.controlTracks,
      ...draft.audioTracks,
      ...draft.visualTracks,
      ...draft.hapticTracks,
    ].map((track) => track.id))
    let ordinal = 0
    return (role) => {
      let candidate
      do {
        ordinal += 1
        candidate = `starter-${starterId}-${batch}-${ordinal}-${role}`.slice(0, 120)
      } while (used.has(candidate))
      used.add(candidate)
      return candidate
    }
  }

  function readLegacyStarter(request, idFor) {
    const raw = localStorage.getItem(request.storageKey)
    if (!raw) return null
    return request.adapt(JSON.parse(raw), { idFor })
  }

  function offerStarter(token) {
    const request = STARTER_REQUESTS[token]
    if (!request) {
      tip(`Unknown Field starter: ${token}.`)
      clearStarterQuery()
      return
    }
    const starter = getFieldStarter(request.starterId)
    const idFor = starterIdFactory(request.starterId)
    let bundle
    let legacy = false
    try {
      bundle = readLegacyStarter(request, idFor)
      legacy = !!bundle
    } catch (error) {
      tip(`Stored ${starter.label} settings could not be converted; offering defaults instead.`)
    }
    bundle ??= createFieldStarterBundle(request.starterId, { idFor })
    starterOffer = {
      token,
      starter,
      bundle,
      legacy,
      requiresAcknowledgement: fieldReportRequiresAcknowledgement(bundle.report),
      acknowledged: false,
    }
  }

  function tokenForStarter(starterId) {
    return Object.entries(STARTER_REQUESTS)
      .find(([, request]) => request.starterId === starterId)?.[0]
  }

  function clearStarterQuery() {
    const url = new URL(window.location.href)
    url.searchParams.delete('starter')
    replaceState(`${url.pathname}${url.search}${url.hash}`, {})
  }

  function starterActionAllowed() {
    if (!starterOffer?.requiresAcknowledgement || starterOffer.acknowledged) return true
    tip('Review and acknowledge the conversion notes before applying this starter.')
    return false
  }

  function reportItemText(item) {
    const code = item?.code ? `[${item.code}] ` : ''
    const source = item?.source ?? 'Unspecified source'
    const target = item?.target ? ` → ${item.target}` : ''
    const detail = item?.detail ?? item?.reason
    return `${code}${source}${target}${detail ? ` — ${detail}` : ''}`
  }

  function addStarter(stagePolicy) {
    if (!starterActionAllowed()) return
    const offer = starterOffer
    const result = appendFieldTrackBundleInPlace(draft, offer.bundle, { stagePolicy })
    if (draft.playing && engine) {
      // Match normal Play: muted tracks still need a zero-gain handle so they
      // can be unmuted without restarting the transport.
      for (const track of result.addedTracks.audioTracks) startVoiceFor(track)
    }
    syncCreatorSession()
    const withNotes = offer.requiresAcknowledgement
    const stageNote = result.stage.applied ? ' and applied its suggested stage' : ' and kept the current stage'
    tip(`${offer.starter.label} tracks added${stageNote}${withNotes ? ' after review' : ''}.`)
    starterOffer = null
    clearStarterQuery()
  }

  function replaceWithStarter() {
    if (!starterActionAllowed()) return
    const offer = starterOffer
    const base = createEmptyDraft()
    base.patchName = `${offer.starter.label} starter`
    const result = insertFieldTrackBundle(base, offer.bundle, { stagePolicy: 'replace' })
    resetLiveDraftState({ ...result.draft, playing: false })
    currentPatchId = null
    currentPatchName = null
    tip(`Opened ${offer.starter.label} starter.`)
    starterOffer = null
    clearStarterQuery()
  }

  function keepCurrentDraft() {
    starterOffer = null
    clearStarterQuery()
    tip('Kept the current patch unchanged.')
  }

  afterNavigate(({ to }) => {
    const token = to?.url.searchParams.get('starter')
    if (token && starterOffer?.token !== token) offerStarter(token)
  })
  function removeHaptic(id) { draft.hapticTracks = draft.hapticTracks.filter(t => t.id !== id); tip('Removed.') }

  // ── Mod slots ─────────────────────────────────────────────────────────────────

  function modKey(trackId, paramName) {
    return `${trackId}:${paramName}`
  }

  function toggleModKey(rowKey) {
    expandedMod = expandedMod === rowKey ? null : rowKey
    creatorSession.expandedMod = expandedMod
  }

  function modForControl(param, controlId) {
    return param.mods.find(m => m.controlId === controlId)
  }

  function setModAmount(param, controlId, amount) {
    const next = Number(amount)
    const mod = modForControl(param, controlId)
    if (!Number.isFinite(next)) return
    if (Math.abs(next) < 1e-9) {
      if (mod) removeMod(param, mod.id)
      return
    }
    if (mod) {
      mod.amount = next
    } else {
      param.mods.push(createMod(controlId, next))
      tip('Mod linked.')
    }
  }

  function removeMod(param, modId) {
    param.mods = param.mods.filter(m => m.id !== modId)
    tip('Mod removed.')
  }

  // ── Transport / IO ────────────────────────────────────────────────────────────

  // Build and initialise the audio engine chosen in Settings, falling back to
  // Vanilla Web Audio when the selected engine isn't supported here.
  async function createEngine() {
    const { engine: created, id, fellBack } = createAudioEngine()
    if (fellBack) {
      const wanted = audioEngines.find((e) => e.id === getActiveAudioEngineId())
      tip(`${wanted?.name ?? 'Selected engine'} unavailable here — using Vanilla Web Audio.`)
    } else {
      const desc = audioEngines.find((e) => e.id === id)
      if (desc && desc.id !== 'vanilla') tip(`Audio engine: ${desc.name}.`)
    }
    await created.initialize()
    return created
  }

  async function togglePlay() {
    if (draft.playing) {
      stopAllVoices()
      draft.playing = false
      sessionStartTime = null
      liveValues = {}
      syncCreatorSession()
      tip('Stopped.')
      return
    }
    try {
      if (!engine) {
        engine = await createEngine()
        creatorSession.engine = engine
      }
      await engine.resume()
    } catch (e) {
      tip(`Audio unavailable: ${e.message ?? e}`)
      return
    }
    draft.playing = true
    sessionStartTime = engine.getAudioContext().currentTime
    syncCreatorSession()
    for (const track of draft.audioTracks) startVoiceFor(track)
    tip('Playing…')
  }

  function trackToVoiceSpec(track) {
    const gain = track.muted ? 0 : num(getLive(track, 'gain'), track.params.gain?.value ?? 0.5)
    const spec = {
      type: track.trackType,
      volume: gain,
      params: { gain },
      tremolo: track.tremolo ? { ...track.tremolo } : null,
    }
    if (track.trackType === 'BinauralBeat') {
      spec.params.leftFreq = num(getLive(track, 'leftFreq'), track.params.leftFreq.value)
      spec.params.rightFreq = num(getLive(track, 'rightFreq'), track.params.rightFreq.value)
    } else if (track.trackType === 'Noise') {
      spec.params.pan = num(getLive(track, 'pan'), track.params.pan?.value ?? 0)
      spec.params.cutoff = num(getLive(track, 'cutoff'), track.params.cutoff?.value ?? 6000)
      spec.params.resonance = num(getLive(track, 'resonance'), track.params.resonance?.value ?? 0.707)
      spec.noiseColor = track.noiseColor ?? 'pink'
      spec.noiseFilter = track.noiseFilter ?? 'lowpass'
    } else if (track.trackType === 'Drone') {
      spec.params.pan = num(getLive(track, 'pan'), track.params.pan?.value ?? 0)
      spec.params.frequency = num(getLive(track, 'frequency'), track.params.frequency?.value ?? 110)
      spec.params.detune = num(getLive(track, 'detune'), track.params.detune?.value ?? 12)
      spec.droneVoices = track.droneVoices ?? 5
    } else if (track.trackType === 'Sample') {
      spec.params.pan = num(getLive(track, 'pan'), track.params.pan?.value ?? 0)
      spec.sampleId = track.sampleId ?? 'rain'
    } else {
      spec.params.pan = num(getLive(track, 'pan'), track.params.pan?.value ?? 0)
      spec.params.frequency = num(getLive(track, 'frequency'), track.params.frequency?.value ?? 200)
      spec.params.pulseRate = num(getLive(track, 'pulseRate'), track.params.pulseRate?.value ?? 10)
    }
    if (track.trackType === 'IsochronicTone') spec.envelope = isoEnvSpec(track)
    return spec
  }

  function startVoiceFor(track) {
    if (!engine) return
    const ctx = engine.getAudioContext()
    const handle = engine.scheduleVoice(trackToVoiceSpec(track), ctx.currentTime + 0.05)
    voiceHandles.set(track.id, handle)
  }

  function stopVoiceFor(trackId) {
    if (!engine) return
    const handle = voiceHandles.get(trackId)
    if (!handle) return
    engine.stopVoice(handle, engine.getAudioContext().currentTime)
    voiceHandles.delete(trackId)
  }

  function stopAllVoices() {
    if (!engine) return
    const t = engine.getAudioContext().currentTime
    for (const handle of voiceHandles.values()) engine.stopVoice(handle, t)
    voiceHandles.clear()
  }

  // Rebuild a live voice from scratch — used when a structural choice (e.g. the
  // noise colour) changes, which can't be applied as a smooth AudioParam ramp.
  function restartVoice(track) {
    if (!draft.playing || !engine) return
    stopVoiceFor(track.id)
    startVoiceFor(track)
  }

  // ── Tremolo (per-track AM, any audio track) ─────────────────────────────────
  function toggleTremolo(track) {
    if (!track.tremolo) track.tremolo = createTremolo()
    track.tremolo.enabled = !track.tremolo.enabled
    restartVoice(track) // enabling/disabling is structural in the Vanilla engine
  }

  // Live rate/depth/mode update for an enabled tremolo (no voice restart).
  function applyTremolo(track) {
    if (!engine) return
    const handle = voiceHandles.get(track.id)
    if (handle) engine.setTremolo(handle, track.tremolo)
  }

  // ── rAF loop ─────────────────────────────────────────────────────────────────
  // Runs while the component is mounted. Each frame: evaluate every control
  // (updating controlStates so previews stay alive), then — only while playing —
  // apply base + Σ(amount·controlValue) to every sensory param.

  function getLive(track, paramName) {
    return liveValues[track.id]?.[paramName] ?? track.params[paramName]?.value
  }

  function getTiming() {
    return draft.timing ?? { lengthSec: draft.lengthSec ?? 900, bpmEnabled: false, beatsPerBar: 4, bpm: { value: draft.bpm ?? 60, mods: [] } }
  }

  function getLengthSec() {
    return Math.max(0.001, num(getTiming().lengthSec, 900))
  }

  function bpmEnabled() {
    return !!getTiming().bpmEnabled
  }

  function setBpmEnabled(enabled) {
    if (!draft.timing) draft.timing = getTiming()
    draft.timing.bpmEnabled = enabled
    if (!enabled && expandedMod === 'timing:bpm') expandedMod = null
    syncCreatorSession()
  }

  function tempoSyncActive(param) {
    return bpmEnabled() && isTempoSyncEnabled(param?.tempoSync)
  }

  // Thin wrapper over the pure modulation.effectiveTempoValue: injects the
  // reactive bpmEnabled() read so all existing call sites keep their signature.
  function effectiveTempoValue(param, fallbackValue, tempoKind, tempoContext) {
    return tempoEffectiveValue(param, fallbackValue, tempoKind, tempoContext, bpmEnabled())
  }

  function controlTrackForTempo(track, tempoContext) {
    if (track.type === 'LFO') {
      return {
        ...track,
        periodSec: clampRange(
          effectiveTempoValue({ tempoSync: track.tempoSync?.periodSec }, num(track.periodSec, 10), 'duration', tempoContext),
          MARTIGLI_PARAM_RANGE,
          'periodSec'
        ),
        targetPeriodSec: clampRange(
          effectiveTempoValue({ tempoSync: track.tempoSync?.targetPeriodSec }, num(track.targetPeriodSec, 20), 'duration', tempoContext),
          MARTIGLI_PARAM_RANGE,
          'targetPeriodSec'
        ),
      }
    }
    if (track.type === 'Permutation') {
      return {
        ...track,
        rateHz: clampRange(
          effectiveTempoValue({ tempoSync: track.tempoSync?.rateHz }, num(track.rateHz, 2), 'rate', tempoContext),
          SYMMETRY_PARAM_RANGE,
          'rateHz'
        ),
      }
    }
    if (track.type === 'Sinusoid') {
      return {
        ...track,
        rateHz: clampRange(
          effectiveTempoValue({ tempoSync: track.tempoSync?.rateHz }, num(track.rateHz, 1), 'rate', tempoContext),
          SINUSOID_PARAM_RANGE,
          'rateHz'
        ),
      }
    }
    return track
  }

  // Thin cache/side-effect wrapper over the pure modulation.evalParamValue: owns
  // the per-track liveValues cache and the change-detected writeAudio call.
  function applyMods(track, controlValues, ranges, writeAudio, paramNames, tempoContext) {
    if (!liveValues[track.id]) liveValues[track.id] = {}
    const base = liveValues[track.id]
    for (const name of paramNames) {
      const param = track.params[name]
      if (!param) continue
      const prev = base[name]
      const v = evalParamValue(param, {
        name,
        ranges,
        controlValues,
        tempoKind: tempoSyncKindForTrackParam(track, name),
        tempoContext,
        bpmEnabled: bpmEnabled(),
        muted: track.muted,
      })
      const changed = prev == null || !Number.isFinite(prev) || Math.abs(prev - v) > 1e-6
      if (!changed) continue
      base[name] = v
      if (writeAudio) writeAudio(name, v)
    }
  }

  function rafTick() {
    const ctx = engine?.getAudioContext()
    const tNow = ctx ? ctx.currentTime : performance.now() / 1000
    controllerTime = tNow
    const playing = draft.playing
    const timing = getTiming()
    const sessionLength = getLengthSec()
    const sessionElapsed = (playing && sessionStartTime != null)
      ? Math.max(0, Math.min(sessionLength, tNow - sessionStartTime))
      : null

    function evaluateControls(tempoContext, writeStates = false) {
      const values = new Map()
      for (const c of draft.controlTracks) {
        const effectiveTrack = controlTrackForTempo(c, tempoContext)
        let st
        if (c.type === 'LFO') {
          st = (sessionElapsed != null)
            ? computeMartigliState(effectiveTrack, sessionElapsed, sessionLength)
            : computeMartigliStateFree(effectiveTrack, tNow)
        } else if (c.type === 'Permutation') {
          const ts = sessionElapsed != null ? sessionElapsed : tNow
          st = computeSymmetryState(effectiveTrack, ts)
        } else if (c.type === 'Sinusoid') {
          const ts = sessionElapsed != null ? sessionElapsed : tNow
          st = computeSinusoidState(effectiveTrack, ts)
        } else {
          st = { value: 0 }
        }
        if (writeStates) controlStates[c.id] = st
        values.set(c.id, st.value)
      }
      return values
    }

    const baseTempo = tempoContextFromTiming(timing)
    let controlValues
    if (bpmEnabled()) {
      const baseControlValues = evaluateControls(baseTempo, false)
      liveTempo = tempoContextFromTiming(timing, evaluateModulatedBpm(timing.bpm, baseControlValues))
      controlValues = evaluateControls(liveTempo, true)
    } else {
      liveTempo = baseTempo
      controlValues = evaluateControls(baseTempo, true)
    }

    for (const track of draft.audioTracks) {
      const handle = voiceHandles.get(track.id)
      const write = playing && handle && engine
        ? (name, v) => {
            if (name === 'noteDurationFrac' && track.trackType === 'IsochronicTone') {
              engine.setVoiceEnvelope(handle, isoEnvSpec(track, v))
              return
            }
            engine.setVoiceParameter(handle, name, v, tNow, 'step')
          }
        : null
      applyMods(track, controlValues, AUDIO_PARAM_RANGE, write, voiceParamNames(track.trackType), liveTempo)
    }

    // BinauralBeat virtual params: apply centerFreq/beatFreq mods on top of
    // the already-modulated leftFreq/rightFreq from the primary pass above.
    for (const track of draft.audioTracks) {
      if (track.trackType !== 'BinauralBeat') continue
      const cMods = track.params.centerFreq?.mods ?? []
      const bMods = track.params.beatFreq?.mods ?? []
      const beatSync = tempoSyncActive(track.params.beatFreq)
      if (!beatSync && !cMods.some(m => m.enabled !== false) && !bMods.some(m => m.enabled !== false)) continue

      const baseLeft  = liveValues[track.id]?.leftFreq  ?? track.params.leftFreq.value
      const baseRight = liveValues[track.id]?.rightFreq ?? track.params.rightFreq.value
      const { leftFreq: liveLeft, rightFreq: liveRight } = resolveBinauralLR({
        baseLeft,
        baseRight,
        beatBase: effectiveTempoValue(track.params.beatFreq, baseRight - baseLeft, 'rate', liveTempo),
        centerMods: cMods,
        beatMods: bMods,
        controlValues,
        range: AUDIO_PARAM_RANGE.leftFreq,
      })
      if (!liveValues[track.id]) liveValues[track.id] = {}
      liveValues[track.id].leftFreq  = liveLeft
      liveValues[track.id].rightFreq = liveRight

      const handle = voiceHandles.get(track.id)
      if (playing && handle && engine) {
        engine.setVoiceParameter(handle, 'leftFreq',  liveLeft,  tNow, 'step')
        engine.setVoiceParameter(handle, 'rightFreq', liveRight, tNow, 'step')
      }
    }

    for (const track of draft.visualTracks) applyMods(track, controlValues, VISUAL_PARAM_RANGE, null, VISUAL_PARAMS, liveTempo)
    for (const track of draft.hapticTracks) applyMods(track, controlValues, HAPTIC_PARAM_RANGE, null, HAPTIC_PARAMS, liveTempo)

    // Advance Blink/Oscillate preview phases from a free-running clock (so they
    // animate whether or not the session is playing) using the live, modulated
    // rate. Writes __blinkOn / __oscVal into liveValues for visualStyle().
    const vdt = lastVisualTick == null ? 0 : Math.max(0, Math.min(0.1, tNow - lastVisualTick))
    lastVisualTick = tNow
    for (const track of draft.visualTracks) {
      const tt = track.trackType
      const colorBlink = tt === 'ColorField' && track.config?.blinkEnabled === true
      if (tt !== 'Blink' && tt !== 'Oscillate' && tt !== 'Pacer' && !colorBlink) continue
      const lv = liveValues[track.id] ?? (liveValues[track.id] = {})
      if (tt === 'Blink' || colorBlink) {
        const rawRate = clamp(num(lv.blinkRate ?? track.params.blinkRate?.value, 10), 0.01, 40)
        // Photosensitivity gate: capped at the general-safe ceiling unless the
        // author has accepted the risk for this session.
        const rate = clampFlashRate(rawRate, { accepted: flashAccepted })
        const duty = clamp(num(lv.duty ?? track.params.duty?.value, 0.5), 0.01, 0.99)
        let ph = (visualPhase[track.id] ?? 0) + vdt * rate
        ph -= Math.floor(ph)
        visualPhase[track.id] = ph
        lv.__blinkOn = ph < duty ? 1 : 0
      } else {
        // Oscillate and Pacer both breathe on oscRate (0..1 cosine).
        const rate = clamp(num(lv.oscRate ?? track.params.oscRate?.value, 1), 0.01, 10)
        let ph = (visualPhase[track.id] ?? 0) + vdt * rate
        ph -= Math.floor(ph)
        visualPhase[track.id] = ph
        lv.__oscVal = 0.5 - 0.5 * Math.cos(2 * Math.PI * ph)
      }
    }

    // Keep direct control-track previews aligned with tempo-synced values.
    for (const track of draft.controlTracks) {
      if (!liveValues[track.id]) liveValues[track.id] = {}
      if (track.type === 'LFO') {
        for (const name of ['periodSec', 'targetPeriodSec']) {
          liveValues[track.id][name] = clampRange(
            effectiveTempoValue({ tempoSync: track.tempoSync?.[name] }, track[name], 'duration', liveTempo),
            MARTIGLI_PARAM_RANGE,
            name
          )
        }
      } else if (track.type === 'Permutation') {
        liveValues[track.id].rateHz = clampRange(
          effectiveTempoValue({ tempoSync: track.tempoSync?.rateHz }, track.rateHz, 'rate', liveTempo),
          SYMMETRY_PARAM_RANGE,
          'rateHz'
        )
      } else if (track.type === 'Sinusoid') {
        liveValues[track.id].rateHz = clampRange(
          effectiveTempoValue({ tempoSync: track.tempoSync?.rateHz }, track.rateHz, 'rate', liveTempo),
          SINUSOID_PARAM_RANGE,
          'rateHz'
        )
      }
    }

    if (!playing) {
      for (const track of draft.audioTracks) {
        if (track.muted && liveValues[track.id]) liveValues[track.id].gain = 0
      }
    }

    rafId = requestAnimationFrame(rafTick)
  }

  async function restartSystem() {
    stopAllVoices()
    draft.playing = false
    sessionStartTime = null
    liveValues = {}
    syncCreatorSession()
    if (engine) {
      try { await engine.dispose() } catch (_) {}
      engine = null
      voiceHandles.clear()
      syncCreatorSession()
    }
    try {
      engine = await createEngine()
      await engine.resume()
      creatorSession.engine = engine
    } catch (e) {
      tip(`Restart failed: ${e.message ?? e}`)
      return
    }
    draft.playing = true
    sessionStartTime = engine.getAudioContext().currentTime
    syncCreatorSession()
    for (const track of draft.audioTracks) startVoiceFor(track)
    tip('Restarted.')
  }

  function isTypingTarget(node) {
    if (!node) return false
    if (node.isContentEditable) return true
    return ['INPUT', 'TEXTAREA', 'SELECT'].includes(node.tagName)
  }

  function toggleHelp() {
    helpOpen = !helpOpen
  }

  function closeHelp() {
    helpOpen = false
  }

  function handleWindowKeydown(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return
    if (isTypingTarget(document.activeElement)) return

    if (event.key === 'Escape' && helpOpen) {
      event.preventDefault()
      helpOpen = false
      return
    }

    if (event.key === 'Escape' && saveMenuOpen) {
      event.preventDefault()
      saveMenuOpen = false
      return
    }

    if (event.key === 'Escape' && semanticInfo) {
      event.preventDefault()
      semanticInfo = null
      return
    }

    if (event.key === 'Escape' && mixOpen) {
      event.preventDefault()
      if (document.fullscreenElement === stageEl) {
        try { document.exitFullscreen?.() } catch (_) {}
      } else {
        closeMix()
      }
      return
    }

    if (event.key === ' ') {
      event.preventDefault()
      togglePlay()
      return
    }

    if (event.key === 'r' || event.key === 'R') {
      event.preventDefault()
      restartSystem()
      return
    }

    if (event.key === '?' || event.key === 'h' || event.key === 'H') {
      event.preventDefault()
      helpOpen = !helpOpen
    }
  }

  function handleFullscreenChange() {
    // Exiting fullscreen returns to the resizable mix window; it does not
    // discard the mix or close the dialog.
    mixFullscreen = document.fullscreenElement === stageEl
  }

  onMount(() => {
    syncCreatorSession()
    // A patch may have arrived in the URL fragment. Offered, never applied.
    readIncomingLink()
    rafId = requestAnimationFrame(rafTick)
    window.addEventListener('keydown', handleWindowKeydown)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      window.removeEventListener('keydown', handleWindowKeydown)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  })

  // Push Iso envelope shape to live voices whenever the user-set envelope
  // fields change. We read the envelope spec for every Iso track *before* the
  // engine null-check so Svelte registers the reactive deps even on the first
  // mount pass (when engine is null). Otherwise no subsequent change re-fires
  // the effect. Cost is bounded — depends only on knob base values, not the
  // modulated pulseRate.
  $effect(() => {
    const specs = []
    for (const track of draft.audioTracks) {
      if (track.trackType !== 'IsochronicTone') continue
      specs.push([track.id, isoEnvSpec(track)])
    }
    if (!engine) return
    for (const [tid, spec] of specs) {
      const handle = voiceHandles.get(tid)
      if (!handle) continue
      engine.setVoiceEnvelope(handle, spec)
    }
  })

  onDestroy(async () => {
    unsubscribeAuth()
    if (rafId != null) cancelAnimationFrame(rafId)
    rafId = null
    syncCreatorSession()
  })

  function fmtSec(v) {
    const n = Number(v)
    if (!Number.isFinite(n)) return '—'
    return n >= 10 ? `${n.toFixed(0)}s` : `${n.toFixed(1)}s`
  }

  function download() {
    const blob = new Blob([jsonExport], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug(draft.patchName)}.json`
    a.click()
    URL.revokeObjectURL(url)
    tip('Downloaded.')
  }

  async function copyJson() {
    try { await navigator.clipboard.writeText(jsonExport); tip('Copied.') }
    catch { tip('Clipboard unavailable.') }
  }

  // ── Share as a link (ADR 0039, Tier 1) ─────────────────────────────────────
  // A fragment never reaches a server, so this shares a working patch with no
  // infrastructure at all. Only the patch travels: patchLink.js reads no
  // storage, so a logbook or annotation cannot leak into a link.
  async function copyLink() {
    try {
      const result = await buildPatchLink(buildPatchExport(draft), window.location.href)
      if (!result.ok) {
        tip(`Too large to share as a link (${result.chars} of ${result.limit} characters). Use Download.`)
        return
      }
      await navigator.clipboard.writeText(result.url)
      tip(`Link copied — ${result.chars} characters.`)
    } catch (e) {
      tip(`Could not build a link: ${e.message}`)
    }
  }

  // patchSummary returns counts, not prose. Render them as a phrase so someone
  // deciding whether to accept a stranger's link can see what is in it.
  function describePatch(d) {
    const s = patchSummary(d)
    const parts = []
    if (s.audioCount) parts.push(`${s.audioCount} audio`)
    if (s.visualCount) parts.push(`${s.visualCount} visual`)
    if (s.hapticCount) parts.push(`${s.hapticCount} haptic`)
    if (s.controlCount) parts.push(`${s.controlCount} control`)

    const total = s.audioCount + s.visualCount + s.hapticCount + s.controlCount
    if (total === 0) return 'an empty patch'

    const tracks = `${parts.join(', ')} track${total === 1 ? '' : 's'}`
    if (!s.modLinks) return tracks
    return `${tracks} · ${s.modLinks} modulation link${s.modLinks === 1 ? '' : 's'}`
  }

  // An incoming link is offered, never applied: it would otherwise replace
  // whatever the person already had open, with no way back.
  let incomingLink = $state(null)

  async function readIncomingLink() {
    const encoded = readPatchLinkFrom(window.location.hash)
    if (!encoded) return
    try {
      const patch = await decodePatchLink(encoded)
      const nextDraft = draftFromPatchExport(patch)
      incomingLink = {
        draft: nextDraft,
        name: patch.patchName || 'Untitled Patch',
        summary: describePatch(nextDraft),
      }
    } catch (e) {
      tip(`That patch link could not be opened: ${e.message}`)
      clearLinkFragment()
    }
  }

  function clearLinkFragment() {
    // Drop the fragment so a reload does not re-offer a patch the person
    // already accepted or dismissed.
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }

  function acceptIncomingLink() {
    resetLiveDraftState(incomingLink.draft)
    currentPatchId = null
    currentPatchName = null
    tip(`Opened ${incomingLink.name}.`)
    incomingLink = null
    clearLinkFragment()
  }

  function declineIncomingLink() {
    incomingLink = null
    clearLinkFragment()
  }

  // Import is the other half of Download: a patch exported from any instance —
  // including one built without Firebase — loads here with no account involved.
  // Parsing and validation live in presetDraft.js so they stay testable.
  let importInput = $state(null)

  function pickImportFile() {
    importInput?.click()
  }

  async function importFile(event) {
    const input = event.currentTarget
    const file = input.files?.[0]
    // Clear immediately so re-picking the same file fires change again.
    input.value = ''
    if (!file) return

    if (file.size > PATCH_FILE_MAX_BYTES) {
      tip('That file is too large to be a patch.')
      return
    }

    try {
      const nextDraft = draftFromPatchFileText(await file.text())
      resetLiveDraftState(nextDraft)
      // An imported patch is not the cloud patch that was open: saving should
      // create a new record rather than silently overwrite the previous one.
      currentPatchId = null
      currentPatchName = null
      saveMenuOpen = false
      tip(`Imported ${nextDraft.patchName}.`)
    } catch (e) {
      tip(`Import failed: ${e.message}`)
    }
  }

  function resetLiveDraftState(nextDraft) {
    stopAllVoices()
    draft = nextDraft
    expandedMod = null
    liveValues = {}
    controlStates = {}
    sessionStartTime = null
    liveTempo = tempoContextFromTiming(draft.timing)
    for (const key of Object.keys(visualPhase)) delete visualPhase[key]
    lastVisualTick = null
    syncCreatorSession()
  }

  async function refreshSavedPatches({ silent = false } = {}) {
    const store = patchStore
    if (!store) {
      savedPatches = []
      return
    }
    // Guard against a slow list resolving after the account changed underneath.
    const uid = auth.identity.subject

    storeLoading = true
    storeError = null
    try {
      const patches = await store.list()
      if (auth.identity.subject === uid) {
        savedPatches = patches
        const active = currentPatchId ? patches.find(patch => patch.id === currentPatchId) : null
        if (active) {
          currentPatchName = active.patchName
        } else if (currentPatchId) {
          currentPatchId = null
          currentPatchName = null
        }
      }
      if (!silent) tip(patches.length ? `Loaded ${patches.length} patches.` : 'No saved patches yet.')
    } catch (e) {
      storeError = e.message
      if (!silent) tip(`Load failed: ${e.message}`)
    } finally {
      storeLoading = false
    }
  }

  async function saveCurrentPatch() {
    // No sign-in check: local storage is always available, and that is the
    // point of the seam. Only a genuinely broken patch blocks a save.
    if (!patchStore) {
      tip('No storage available in this browser.')
      return
    }
    if (hasErrors) {
      tip('Fix patch errors before saving.')
      return
    }

    storeSaving = true
    storeError = null
    try {
      const exported = buildPatchExport(draft)
      const currentName = normalizePatchName(exported.patchName)
      const loadedName = normalizePatchName(currentPatchName)
      const sameLoadedPatch = currentPatchId && currentName && currentName === loadedName
      const sameNamedPatch = savedPatches.find(patch => normalizePatchName(patch.patchName) === currentName)
      const targetPatchId = sameLoadedPatch ? currentPatchId : sameNamedPatch?.id ?? null

      currentPatchId = await patchStore.save(exported, targetPatchId)
      currentPatchName = exported.patchName
      await refreshSavedPatches({ silent: true })
      tip(`${targetPatchId ? 'Updated' : 'Saved'} — ${patchStore.label.toLowerCase()}.`)
    } catch (e) {
      storeError = e.message
      tip(`Save failed: ${e.message}`)
    } finally {
      storeSaving = false
    }
  }

  function loadSavedPatch(savedPatch) {
    try {
      const nextDraft = draftFromPatchExport(savedPatch.patch)
      resetLiveDraftState(nextDraft)
      currentPatchId = savedPatch.id
      currentPatchName = savedPatch.patchName
      saveMenuOpen = false
      tip(`Loaded ${nextDraft.patchName}.`)
    } catch (e) {
      storeError = e.message
      tip(`Could not load that patch: ${e.message}`)
    }
  }

  function reset() {
    resetLiveDraftState(createDraft())
    currentPatchId = null
    currentPatchName = null
    tip('Reset.')
  }

  function clearStudio() {
    if (!confirm('Clear the current patch studio? Unsaved changes will be lost.')) return
    resetLiveDraftState(createEmptyDraft())
    currentPatchId = null
    currentPatchName = null
    tip('Cleared.')
  }

  function slug(v) {
    return `${v ?? 'patch'}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'patch'
  }

  function normalizePatchName(value) {
    return `${value ?? ''}`.trim().toLocaleLowerCase()
  }

  async function renameSavedPatch(savedPatch) {
    if (!patchStore || storeSaving) return
    const nextName = prompt('Rename patch', savedPatch.patchName)?.trim()
    if (!nextName || nextName === savedPatch.patchName) return
    const normalized = normalizePatchName(nextName)
    if (savedPatches.some(patch => patch.id !== savedPatch.id && normalizePatchName(patch.patchName) === normalized)) {
      storeError = 'A patch with that name already exists.'
      tip(storeError)
      return
    }

    storeSaving = true
    busyPatchId = savedPatch.id
    storeError = null
    try {
      const patch = { ...savedPatch.patch, patchName: nextName }
      await patchStore.save(patch, savedPatch.id)
      if (currentPatchId === savedPatch.id) {
        currentPatchName = nextName
        draft.patchName = nextName
        syncCreatorSession()
      }
      await refreshSavedPatches({ silent: true })
      tip('Renamed in Firebase.')
    } catch (e) {
      storeError = e.message
      tip(`Rename failed: ${e.message}`)
    } finally {
      busyPatchId = null
      storeSaving = false
    }
  }

  async function removeSavedPatch(savedPatch) {
    if (!patchStore || storeSaving) return
    if (!confirm(`Delete "${savedPatch.patchName}" from ${patchStore.label.toLowerCase()}?`)) return

    storeSaving = true
    busyPatchId = savedPatch.id
    storeError = null
    try {
      await patchStore.remove(savedPatch.id)
      if (currentPatchId === savedPatch.id) {
        currentPatchId = null
        currentPatchName = null
      }
      await refreshSavedPatches({ silent: true })
      tip('Deleted.')
    } catch (e) {
      storeError = e.message
      tip(`Delete failed: ${e.message}`)
    } finally {
      busyPatchId = null
      storeSaving = false
    }
  }

  function shortDate(value) {
    if (!value) return 'unsynced'
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  }

  function tip(msg) {
    statusMsg = msg
    creatorSession.statusMsg = msg
  }

  function num(value, fallback = 0) {
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value))
  }

  function tempoStyle(bpm, beatsPerBar) {
    const beat = 60 / clampBpm(bpm)
    const beats = clampBeatsPerBar(beatsPerBar)
    return [
      `--beat-duration:${clamp(beat, 0.12, 6).toFixed(3)}s`,
      `--bar-duration:${clamp(beat * beats, 0.48, 48).toFixed(3)}s`,
      `--tempo-beats:${beats}`,
    ].join(';')
  }

  function tempoModeValue(sync) {
    if (!sync?.enabled) return 'free'
    return sync.mode === 'beats' ? 'beats' : 'division'
  }

  function setTempoMode(sync, mode) {
    if (!sync) return
    if (mode === 'free') {
      sync.enabled = false
      return
    }
    sync.enabled = true
    sync.mode = mode === 'beats' ? 'beats' : 'division'
  }

  function tempoSyncReadout(param, tempoKind) {
    return formatTempoSyncReadout(param?.tempoSync, tempoKind, liveTempo)
  }

  function controlParam(track, pname) {
    return {
      value: track[pname],
      mods: [],
      tempoSync: track.tempoSync?.[pname],
    }
  }

  function liveControlValue(track, pname) {
    return liveValues[track.id]?.[pname] ?? track[pname]
  }

  function bpmLiveValue() {
    return liveTempo.bpm
  }

  function fmtHz(v) {
    const n = Number(v)
    if (!Number.isFinite(n)) return '—'
    return n >= 10 ? `${n.toFixed(1)} Hz` : `${n.toFixed(2)} Hz`
  }

  // Above this many visible cycles, the wave is too dense for SVG to convey —
  // fall back to a constant-amplitude band. Below it we use adaptive sampling
  // (≥ 6 samples per cycle, capped) so a dense-but-still-resolved wave reads
  // as a wave, not a bar.
  const SCOPE_BAND_THRESHOLD = 600

  function fmtWin(s) {
    if (!Number.isFinite(s) || s <= 0) return '—'
    if (s >= 1) return `${s.toFixed(2)}s`
    if (s >= 0.01) return `${(s * 1000).toFixed(0)}ms`
    return `${(s * 1000).toFixed(1)}ms`
  }

  function visualStyle(track) {
    const rotation = num(getLive(track, 'rotationSpeed'), 0.1)
    const spin = Math.abs(rotation) < 0.01 ? 18 : clamp(1 / Math.abs(rotation), 0.5, 18)
    return [
      `--visual-hue:${clamp(num(getLive(track, 'hue'), 200), 0, 360).toFixed(1)}`,
      `--visual-opacity:${clamp(num(getLive(track, 'opacity'), 1), 0, 1).toFixed(3)}`,
      `--visual-scale:${clamp(num(getLive(track, 'scale'), 1), 0, 4).toFixed(3)}`,
      `--visual-spin:${spin.toFixed(3)}s`,
      `--visual-dir:${rotation < 0 ? 'reverse' : 'normal'}`,
      // Blink/Oscillate/Pacer live preview drivers (computed in the rAF loop).
      `--visual-blink:${(getLive(track, '__blinkOn') ?? 1)}`,
      `--visual-osc:${(num(getLive(track, '__oscVal'), 0)).toFixed(3)}`,
      // Ripple ring cadence (CSS-animated) from oscRate.
      `--visual-ripple-period:${(1 / clamp(num(getLive(track, 'oscRate'), 0.6), 0.05, 10)).toFixed(2)}s`,
    ].join(';')
  }

  function hapticStyle(track) {
    const intensity = clamp(num(getLive(track, 'intensity'), 0.5), 0, 1)
    const pulseRate = clamp(num(getLive(track, 'pulseRate'), 4), 0.25, 50)
    const pulse = clamp(1 / pulseRate, 0.05, 2)
    return [
      `--haptic-intensity:${intensity.toFixed(3)}`,
      `--haptic-alpha:${(0.25 + intensity * 0.65).toFixed(3)}`,
      `--haptic-scale:${(0.95 + intensity * 0.45).toFixed(3)}`,
      `--haptic-pulse:${pulse.toFixed(3)}s`,
      `--haptic-ripple:${(pulse * 4).toFixed(3)}s`,
      `--haptic-delay:${(-pulse * 2).toFixed(3)}s`,
      `--haptic-scan-duration:${(pulse * 8).toFixed(3)}s`,
      `--haptic-pattern:${clamp(num(getLive(track, 'pattern'), 0), 0, 10).toFixed(1)}`,
    ].join(';')
  }

  // Compute sum of absolute enabled mod amounts (used for range band width).
  function paramModDepth(param) {
    return param.mods.reduce(
      (s, m) => m.enabled !== false ? s + Math.abs(Number(m.amount) || 0) : s,
      0
    )
  }

  // Compute live modulated value for the parameter knob dot.
  // Reads controlStates (reactive), so it re-runs every frame automatically.
  function paramLiveValue(param, pmin, pmax, tempoKind = null) {
    const hasMods = param.mods.some(m => m.enabled !== false)
    const hasTempo = tempoKind && tempoSyncActive(param)
    if (!hasMods && !hasTempo) return null
    let sum = tempoKind
      ? effectiveTempoValue(param, param.value, tempoKind, liveTempo)
      : param.value
    for (const m of param.mods) {
      if (m.enabled === false) continue
      sum += (Number(m.amount) || 0) * (controlStates[m.controlId]?.value ?? 0)
    }
    return Math.max(pmin, Math.min(pmax, sum))
  }

  function paramLabel(name) {
    if (name === 'noteDurationFrac') return 'note%'
    if (name === 'blinkRate' || name === 'oscRate') return 'rate'
    return name
  }

  function audioSubtitleFor(track, aFreq, aPulse, leftF, rightF, centerF, beatF, isoEnv) {
    if (track.trackType === 'BinauralBeat') {
      return `L ${Math.round(leftF)} / R ${Math.round(rightF)} Hz · center ${Math.round(centerF)} · beat ${beatF >= 0 ? '+' : ''}${beatF.toFixed(1)} Hz`
    }
    if (track.trackType === 'IsochronicTone') {
      return `${Math.round(aFreq)} Hz · pulse ${aPulse.toFixed(1)} Hz · ${isoEnv?.type ?? track.envelope ?? 'AR'}`
    }
    if (track.trackType === 'Noise') {
      return `${track.noiseColor ?? 'pink'} · ${track.noiseFilter ?? 'lowpass'} ${Math.round(num(getLive(track, 'cutoff'), 6000))} Hz`
    }
    if (track.trackType === 'Drone') {
      return `${Math.round(aFreq)} Hz · ${track.droneVoices ?? 5} voices · ±${Math.round(num(getLive(track, 'detune'), 12))}c`
    }
    if (track.trackType === 'Sample') {
      return `${track.sampleId ?? 'rain'} · ambient loop`
    }
    return `${Math.round(aFreq)} Hz`
  }
</script>

<div class="studio" class:playing={draft.playing}>

  {#if incomingLink}
    <div class="link-offer" role="alertdialog" aria-labelledby="link-offer-heading">
      <div class="link-offer-body">
        <p id="link-offer-heading"><strong>Open the patch from this link?</strong></p>
        <p>
          <strong>{incomingLink.name}</strong> — {incomingLink.summary}
        </p>
        <p class="link-offer-note">
          It came from the link itself, not from a server, and nothing was uploaded to open it.
          Opening replaces what you have here, so download first if you want to keep it.
        </p>
        <div class="link-offer-actions">
          <button class="act-btn" onclick={acceptIncomingLink}>Open it</button>
          <button class="act-btn" onclick={declineIncomingLink}>Keep what I have</button>
        </div>
      </div>
    </div>
  {/if}

  {#if starterOffer}
    <div class="link-offer" role="alertdialog" aria-labelledby="starter-offer-heading">
      <div class="link-offer-body">
        <p id="starter-offer-heading"><strong>Use the {starterOffer.starter.label} starter?</strong></p>
        <p>{starterOffer.starter.description}</p>
        <p class="link-offer-note">
          {#if starterOffer.legacy}
            Your stored Field settings were converted in memory. The original browser data remains untouched.
          {:else}
            This creates ordinary Patch Studio tracks; it does not open another workspace or runtime.
          {/if}
          Nothing is saved or uploaded until you explicitly choose Save.
        </p>
        <details class="starter-report" open>
          <summary>Conversion report</summary>
          <div class="starter-report-sections">
            {#each FIELD_REPORT_SECTIONS as section (section.key)}
              {@const entries = starterOffer.bundle.report?.[section.key] ?? []}
              <section class:needs-review={section.requiresAcknowledgement && entries.length > 0}>
                <h3>{section.label} <span>({entries.length})</span></h3>
                {#if entries.length}
                  <ul>
                    {#each entries as item}
                      <li>{reportItemText(item)}</li>
                    {/each}
                  </ul>
                {:else}
                  <p>None.</p>
                {/if}
              </section>
            {/each}
          </div>
        </details>
        {#if starterOffer.requiresAcknowledgement}
          <label class="starter-ack">
            <input type="checkbox" bind:checked={starterOffer.acknowledged} />
            <span>I reviewed the warnings, behavior corrections, and unsupported items.</span>
          </label>
        {/if}
        <div class="link-offer-actions">
          <button
            class="act-btn"
            onclick={() => addStarter('preserve')}
            disabled={starterOffer.requiresAcknowledgement && !starterOffer.acknowledged}
          >Add + keep stage</button>
          <button
            class="act-btn"
            onclick={() => addStarter('replace')}
            disabled={starterOffer.requiresAcknowledgement && !starterOffer.acknowledged}
          >Add + apply suggested stage</button>
          <button
            class="act-btn"
            onclick={replaceWithStarter}
            disabled={starterOffer.requiresAcknowledgement && !starterOffer.acknowledged}
          >Replace patch</button>
          <button class="act-btn" onclick={keepCurrentDraft}>Cancel</button>
        </div>
      </div>
    </div>
  {/if}

  {#snippet paramRow(param, pname, pmin, pmax, pstep, rowKey, trackId, customOnchange, tempoKind, allowMods = true)}
    {@const isOpen = expandedMod === rowKey}
    {@const hasLinkedMods = allowMods && param.mods.length > 0}
    {@const hasTempoSync = bpmEnabled() && !!tempoKind && !!param.tempoSync}
    {@const isTempoActive = hasTempoSync && tempoSyncActive(param)}
    {@const showMods = allowMods && (isOpen || hasLinkedMods)}
    {@const showRow = showMods || hasTempoSync}
    {@const [mmin, mmax, mstep] = modAmountRange(pmin, pmax, pstep)}
    {@const pLiveVal = paramLiveValue(param, pmin, pmax, tempoKind)}
    {@const pDepth = paramModDepth(param)}
    {@const pRangeLow = pDepth > 0 ? Math.max(pmin, param.value - pDepth) : null}
    {@const pRangeHigh = pDepth > 0 ? Math.min(pmax, param.value + pDepth) : null}
    <div class="param-row" class:mod-open={showRow} class:mod-editing={isOpen} class:has-mod={hasLinkedMods || isTempoActive} class:has-tempo={hasTempoSync}>
      <div class="param-main">
        <Knob
          value={param.value}
          onchange={customOnchange ?? ((v) => { param.value = v })}
          min={pmin}
          max={pmax}
          step={pstep}
          label={paramLabel(pname)}
          onlabel={() => showParamInfo({ id: trackId }, pname)}
          labelTitle={`${paramLabel(pname)} semantic info`}
          modAvailable={allowMods}
          modActive={allowMods && (param.mods.length > 0 || isOpen)}
          onmod={() => toggleModKey(rowKey)}
          liveValue={pLiveVal}
          rangeLow={pRangeLow}
          rangeHigh={pRangeHigh}
        />
      </div>

      {#if hasTempoSync}
        <div class="tempo-sync-control" class:tempo-sync-on={isTempoActive}>
          <select
            aria-label={`${pname} tempo sync mode`}
            value={tempoModeValue(param.tempoSync)}
            onchange={(event) => setTempoMode(param.tempoSync, event.currentTarget.value)}
          >
            <option value="free">free</option>
            <option value="beats">beats</option>
            <option value="division">division</option>
          </select>
          {#if param.tempoSync.enabled && param.tempoSync.mode === 'beats'}
            <input
              aria-label={`${pname} tempo sync beats`}
              type="number"
              min="0.01"
              step="0.25"
              bind:value={param.tempoSync.beats}
            />
          {:else if param.tempoSync.enabled}
            <select aria-label={`${pname} tempo sync division`} bind:value={param.tempoSync.division}>
              {#each TEMPO_DIVISIONS as division}<option value={division}>{division}</option>{/each}
            </select>
            <select aria-label={`${pname} tempo sync modifier`} bind:value={param.tempoSync.modifier}>
              {#each TEMPO_MODIFIERS as modifier}<option value={modifier}>{modifier}</option>{/each}
            </select>
          {/if}
          <span>{tempoSyncReadout(param, tempoKind)}</span>
        </div>
      {/if}

      {#if showMods}
        <div class="param-mods" aria-label={`${pname} modulation controls`}>
          {#each draft.controlTracks as ctrl (ctrl.id)}
            {@const mod = modForControl(param, ctrl.id)}
            {#if isOpen || mod}
              {@const ctrlVal = controlStates[ctrl.id]?.value ?? 0}
              {@const ctrlAmp = controlStates[ctrl.id]?.amp ?? 1}
              {@const modAmt = Number(mod?.amount) || 0}
              {@const ctrlLiveVal = mod && mod.enabled !== false ? Math.max(mmin, Math.min(mmax, modAmt * ctrlVal)) : null}
              {@const ctrlBandLow = mod ? Math.max(mmin, -Math.abs(modAmt) * ctrlAmp) : null}
              {@const ctrlBandHigh = mod ? Math.min(mmax, Math.abs(modAmt) * ctrlAmp) : null}
              <div class="mod-control-cell" class:linked={!!mod} class:mod-disabled={mod && mod.enabled === false}>
                <Knob
                  value={num(mod?.amount, 0)}
                  onchange={(v) => setModAmount(param, ctrl.id, v)}
                  min={mmin}
                  max={mmax}
                  step={mstep}
                  label={ctrl.name}
                  liveValue={ctrlLiveVal}
                  liveValueRef={0}
                  rangeLow={ctrlBandLow}
                  rangeHigh={ctrlBandHigh}
                />
                {#if mod}
                  <label class="mod-enable" title={mod.enabled === false ? 'Enable modulation' : 'Disable modulation'}>
                    <input
                      type="checkbox"
                      checked={mod.enabled !== false}
                      onchange={() => { mod.enabled = mod.enabled === false ? true : false }}
                    />
                  </label>
                  <button
                    class="mod-clear"
                    type="button"
                    title="Remove modulation"
                    onclick={() => removeMod(param, mod.id)}
                  >×</button>
                {/if}
              </div>
            {/if}
          {/each}
          {#if isOpen && !draft.controlTracks.length}
            <span class="mod-empty">No control tracks</span>
          {/if}
        </div>
      {/if}
    </div>
  {/snippet}

  <!-- Per-type visual preview content (no outer box) — reused by track cards
       and the resizable mix stage. -->
  {#snippet visualLayer(track)}
    {#if track.trackType === 'Blink'}
      <span class="visual-aura"></span>
      <span class="blink-dot"></span>
    {:else if track.trackType === 'Oscillate'}
      <span class="visual-aura"></span>
      <span class="osc-dot"></span>
    {:else if track.trackType === 'Pacer'}
      <span class="pacer-ring"></span>
      <span class="pacer-core"></span>
    {:else if track.trackType === 'Ripple'}
      <span class="ripple-ring"></span>
      <span class="ripple-ring"></span>
      <span class="ripple-ring"></span>
    {:else if track.trackType === 'Spiral'}
      <span class="spiral-disc"></span>
    {:else if track.trackType === 'Mandala'}
      <svg class="mandala-shape" viewBox="0 0 80 50">
        <polygon points={polygonPoints(getLive(track, 'sides'))} />
        <polygon class="mandala-shape-2" points={polygonPoints(getLive(track, 'sides'))} />
      </svg>
    {:else if isStudioStageTrack(track)}
      <StudioVisualStage
        tracks={[track]}
        {liveValues}
        stage={draft.visualStage}
        {controllerTime}
        preview={true}
        active={$visualStimulationOn}
        label={`${track.name} preview`}
      />
    {:else}
      <span class="visual-aura"></span>
      <svg class="visual-shape" viewBox="0 0 80 50">
        <polygon points={polygonPoints(getLive(track, 'sides'))} />
      </svg>
      <span class="visual-particle visual-particle-a"></span>
      <span class="visual-particle visual-particle-b"></span>
      <span class="visual-particle visual-particle-c"></span>
    {/if}
  {/snippet}

  <!-- ── HEADER ── -->
  <header class="hdr">
    <div class="hdr-name">
      <input class="patch-name" bind:value={draft.patchName} placeholder="Patch name" />
      <span class="pill">{summary.controlCount}c · {summary.audioCount}a · {summary.visualCount}v · {summary.hapticCount}h · {summary.modLinks}m</span>
    </div>

    <div class="hdr-transport">
      <button class="play-btn" onclick={togglePlay} title={draft.playing ? 'Stop' : 'Play'}>
        {draft.playing ? '■' : '▶'}
      </button>
      <label class="bpm-toggle" class:on={bpmEnabled()} title="Enable BPM clock">
        <input
          type="checkbox"
          checked={bpmEnabled()}
          onchange={(event) => setBpmEnabled(event.currentTarget.checked)}
        />
        <span>BPM</span>
      </label>
      {#if bpmEnabled()}
        <div class="tempo-meter" style={tempoStyle(liveTempo.bpm, getTiming().beatsPerBar)} aria-hidden="true">
          <span class="tempo-sweep"></span>
          <span class="tempo-dot"></span>
          <span class="tempo-grid"></span>
        </div>
        <div class="tempo-bpm-wrap" class:has-mod={(draft.timing?.bpm?.mods?.length ?? 0) > 0}>
          <label class="mini-field">BPM<input type="number" min="1" max="500" step="1" bind:value={draft.timing.bpm.value} /></label>
          <button
            type="button"
            class="mini-mod-btn"
            class:on={expandedMod === 'timing:bpm' || (draft.timing?.bpm?.mods?.length ?? 0) > 0}
            title="Modulate BPM"
            onclick={() => toggleModKey('timing:bpm')}
          >M</button>
          <span class="tempo-live">{Math.round(bpmLiveValue())}</span>
          {#if expandedMod === 'timing:bpm' || (draft.timing?.bpm?.mods?.length ?? 0) > 0}
            <div class="tempo-bpm-mods" aria-label="BPM modulation controls">
              {#each draft.controlTracks as ctrl (ctrl.id)}
                {@const mod = modForControl(draft.timing.bpm, ctrl.id)}
                {#if expandedMod === 'timing:bpm' || mod}
                  {@const ctrlVal = controlStates[ctrl.id]?.value ?? 0}
                  {@const ctrlAmp = controlStates[ctrl.id]?.amp ?? 1}
                  {@const modAmt = Number(mod?.amount) || 0}
                  {@const ctrlLiveVal = mod && mod.enabled !== false ? Math.max(BPM_MOD_MIN, Math.min(BPM_MOD_MAX, modAmt * ctrlVal)) : null}
                  {@const ctrlBandLow = mod ? Math.max(BPM_MOD_MIN, -Math.abs(modAmt) * ctrlAmp) : null}
                  {@const ctrlBandHigh = mod ? Math.min(BPM_MOD_MAX, Math.abs(modAmt) * ctrlAmp) : null}
                  <div class="mod-control-cell" class:linked={!!mod} class:mod-disabled={mod && mod.enabled === false}>
                    <Knob
                      value={num(mod?.amount, 0)}
                      onchange={(v) => setModAmount(draft.timing.bpm, ctrl.id, v)}
                      min={BPM_MOD_MIN}
                      max={BPM_MOD_MAX}
                      step={BPM_MOD_STEP}
                      label={ctrl.name}
                      liveValue={ctrlLiveVal}
                      liveValueRef={0}
                      rangeLow={ctrlBandLow}
                      rangeHigh={ctrlBandHigh}
                    />
                    {#if mod}
                      <label class="mod-enable" title={mod.enabled === false ? 'Enable modulation' : 'Disable modulation'}>
                        <input
                          type="checkbox"
                          checked={mod.enabled !== false}
                          onchange={() => { mod.enabled = mod.enabled === false ? true : false }}
                        />
                      </label>
                      <button
                        class="mod-clear"
                        type="button"
                        title="Remove modulation"
                        onclick={() => removeMod(draft.timing.bpm, mod.id)}
                      >×</button>
                    {/if}
                  </div>
                {/if}
              {/each}
              {#if expandedMod === 'timing:bpm' && !draft.controlTracks.length}
                <span class="mod-empty">No control tracks</span>
              {/if}
            </div>
          {/if}
        </div>
        <label class="mini-field">beats/bar<input type="number" min="1" max="16" step="1" bind:value={draft.timing.beatsPerBar} /></label>
      {/if}
      <label class="mini-field">sec<input type="number" min="1" step="1" bind:value={draft.timing.lengthSec} /></label>
    </div>

    <div class="hdr-actions">
      {#if issues.length > 0}
        <span class="badge {hasErrors ? 'b-err' : 'b-warn'}">{issues.length} {hasErrors ? 'err' : 'warn'}</span>
      {:else}
        <span class="badge b-ok">OK</span>
      {/if}
      <button class="act-btn" onclick={copyJson}>Copy</button>
      <button class="act-btn" onclick={download} disabled={hasErrors}>Download</button>
      <button class="act-btn" onclick={copyLink} disabled={hasErrors} title="Copy a link that carries this patch. Nothing is uploaded — the patch travels inside the link itself.">Share link</button>
      <button class="act-btn" onclick={pickImportFile} title="Load a patch JSON file exported from any BSC Lab instance">Import</button>
      <input
        bind:this={importInput}
        type="file"
        accept="application/json,.json"
        onchange={importFile}
        hidden
      />
      <details
        class="cloud-menu"
        bind:open={saveMenuOpen}
        ontoggle={(event) => {
          saveMenuOpen = event.currentTarget.open
          if (saveMenuOpen) refreshSavedPatches({ silent: true })
        }}
      >
        <summary title="Save and load patches">Save / Load</summary>
        <div class="cloud-panel">
          {#if !patchStore}
            <p class="cloud-status">No storage available in this browser.</p>
          {:else}
            <p class="cloud-status store-target">
              Saving to <strong>{patchStore.label.toLowerCase()}</strong>.
              {#if patchStore.id === 'local'}Sign in to keep patches with your account instead.{/if}
            </p>
            <div class="cloud-actions">
              <button
                type="button"
                class="cloud-action"
                onclick={saveCurrentPatch}
                disabled={storeSaving || hasErrors}
              >
                {storeSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                class="cloud-action secondary"
                onclick={() => refreshSavedPatches()}
                disabled={storeLoading}
              >
                {storeLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            {#if storeError}
              <p class="cloud-error">{storeError}</p>
            {/if}
            {#if storeLoading && !savedPatches.length}
              <p class="cloud-status">Loading patches...</p>
            {:else if savedPatches.length}
              <ul class="cloud-list">
                {#each savedPatches as patch (patch.id)}
                  <li class:active={patch.id === currentPatchId}>
                    <div class="cloud-item-main">
                      <span>{patch.patchName}</span>
                      <small>{shortDate(patch.updatedAt || patch.createdAt)}</small>
                    </div>
                    <div class="cloud-item-actions">
                      <button
                        type="button"
                        class="cloud-row-action primary"
                        onclick={() => loadSavedPatch(patch)}
                        disabled={storeSaving}
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        class="cloud-row-action"
                        onclick={() => renameSavedPatch(patch)}
                        disabled={storeSaving}
                      >
                        {busyPatchId === patch.id && storeSaving ? '...' : 'Rename'}
                      </button>
                      <button
                        type="button"
                        class="cloud-row-action danger"
                        onclick={() => removeSavedPatch(patch)}
                        disabled={storeSaving}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                {/each}
              </ul>
            {:else}
              <p class="cloud-status">No saved patches yet.</p>
            {/if}
          {/if}
        </div>
      </details>
      <button class="act-btn" onclick={clearStudio}>Clear</button>
      <button class="act-btn" onclick={reset}>Reset</button>
      <button
        type="button"
        class="hdr-icon"
        aria-label="Show Patch Studio help"
        aria-expanded={helpOpen}
        title="Patch Studio help (?)"
        onclick={toggleHelp}
      >?</button>
      <details class="nav-menu">
        <summary title="Navigate">+</summary>
        <div class="nav-panel">
          <a href="/creator/">Patch Studio</a>
          <a href="/settings/">Settings</a>
          <a href="/presets/">Presets</a>
          <a href="/sparql/">SPARQL</a>
          <a href="/graph/">Graph</a>
        </div>
      </details>
    </div>
  </header>

  {#if helpOpen}
    <div
      class="studio-help-overlay"
      role="presentation"
      onclick={(event) => { if (event.target === event.currentTarget) closeHelp() }}
    >
      <div class="studio-help-card" role="dialog" aria-label="Patch Studio help" aria-modal="true">
        <header class="studio-help-head">
          <h3>Patch Studio</h3>
          <button type="button" class="studio-help-close" aria-label="Close help" onclick={closeHelp}>✕</button>
        </header>
        <dl>
          {#each STUDIO_HELP as item}
            <div>
              <dt>{item[0]}</dt>
              <dd>{item[1]}</dd>
            </div>
          {/each}
        </dl>
      </div>
    </div>
  {/if}

  {#if statusMsg}
    <div class="status-bar" aria-live="polite">{statusMsg}</div>
  {/if}

  <!-- ── COLUMNS ── -->
  <div class="cols">

    <!-- Controls -->
    <div class="col col-ctrl" class:is-empty={draft.controlTracks.length === 0}>
      <div class="col-head">
        <span class="col-title">Controls</span>
        <div class="col-adds">
          {#each CONTROL_TYPES as t}
            <button class="add-btn" onclick={() => addControl(t)}>+{t}</button>
          {/each}
        </div>
      </div>
      <div class="col-body">
        {#each draft.controlTracks as track (track.id)}
          <article class="card">
            <div class="card-head">
              <div class="card-title-line">
                <input class="card-name" bind:value={track.name} />
                <button class="type-info-btn" type="button" title={`${track.type} semantic type`} onclick={() => showTrackTypeInfo(track)}>∿</button>
              </div>
              <button class="x-btn" onclick={() => removeControl(track.id)} aria-label="Remove track" type="button">x</button>
            </div>
            <div class="card-body">
              {#if track.type === 'LFO'}
                <label class="wave-field">
                  <span>Waveform</span>
                  <select bind:value={track.waveform}>
                    {#each MARTIGLI_WAVEFORMS as w}<option value={w}>{w}</option>{/each}
                  </select>
                </label>
                {@const st = controlStates[track.id] ?? {}}
                {@const ampN = Math.max(0.0001, num(st.amp, num(track.amplitude, 1)))}
                {@const phaseN = clamp(num(st.phase, 0), 0, 1)}
                {@const ratioN = clamp(num(st.ratio, num(track.inhaleRatio, 0.5)), 0.01, 0.99)}
                {@const progressN = clamp(num(st.progress, 0), 0, 1)}
                {@const currentP = num(st.currentPeriod, num(track.periodSec, 10))}
                {@const ballX = (4 + 112 * phaseN).toFixed(2)}
                {@const ballY = (22 - clamp(num(st.value, 0) / ampN, -1, 1) * 14).toFixed(2)}
                {@const inhaleX = (4 + 112 * ratioN).toFixed(2)}
                {@const markerX = (4 + 112 * progressN).toFixed(2)}

                <div class="phase-widget" aria-hidden="true">
                  <svg viewBox="0 0 120 44" preserveAspectRatio="none">
                    <line class="phase-baseline" x1="4" y1="22" x2="116" y2="22" />
                    <line class="phase-inhale" x1={inhaleX} y1="4" x2={inhaleX} y2="40" />
                    <path class="phase-curve" d={martigliPathD(track, 4, 116, 22, 14)} />
                    <circle class="phase-ball" cx={ballX} cy={ballY} r="3.2" />
                  </svg>
                </div>

                <div class="duration-widget" aria-hidden="true">
                  <svg viewBox="0 0 120 14" preserveAspectRatio="none">
                    <line class="dur-track" x1="4" y1="7" x2="116" y2="7" />
                    <circle class="dur-end-cap" cx="4" cy="7" r="2.2" />
                    <circle class="dur-end-cap" cx="116" cy="7" r="2.2" />
                    <circle class="dur-marker" cx={markerX} cy="7" r="3.4" />
                  </svg>
                  <div class="dur-labels">
                    <span class="dur-label-l">{fmtSec(liveControlValue(track, 'periodSec'))}</span>
                    <span class="dur-label-c">{fmtSec(currentP)}</span>
                    <span class="dur-label-r">{fmtSec(liveControlValue(track, 'targetPeriodSec'))}</span>
                  </div>
                </div>

                <div class="knob-grid">
                  {#each MARTIGLI_PARAMS as pname}
                    {@const [pmin, pmax, pstep] = MARTIGLI_PARAM_RANGE[pname]}
                    {@const param = controlParam(track, pname)}
                    {@render paramRow(param, pname, pmin, pmax, pstep, modKey(track.id, pname), track.id,
                      (v) => { track[pname] = v },
                      tempoSyncKindForTrackParam(track, pname),
                      false)}
                  {/each}
                </div>
                <div class="card-meta">{Math.round(track.inhaleRatio * 100)}% inhale</div>
              {:else if track.type === 'Permutation'}
                {@const symSt = controlStates[track.id] ?? {}}
                {@const symN = clamp(Math.round(num(symSt.nnotes, num(track.nnotes, 4))), 2, 8)}
                {@const symRow = Array.isArray(symSt.row) ? symSt.row : Array.from({length: symN}, (_, i) => i + 1)}
                {@const symStep = clamp(num(symSt.stepInRow, 0), 0, symN - 1)}
                {@const symRowIdx = num(symSt.rowIdx, 0)}
                {@const symTotalRows = num(symSt.totalRows, 2 * symN)}
                {@const symProgress = clamp(num(symSt.progress, 0), 0, 1)}

                <div class="symmetry-widget" aria-hidden="true">
                  <svg viewBox="0 0 120 44" preserveAspectRatio="none">
                    <line class="sym-baseline" x1="4" y1="32" x2="116" y2="32" />
                    {#each symRow as value, i}
                      {@const cellWidth = 112 / symN}
                      {@const cellX = 4 + i * cellWidth}
                      {@const barH = (value / symN) * 26}
                      {@const barY = 32 - barH}
                      <rect
                        class="sym-cell"
                        class:sym-cell-active={i === symStep}
                        x={cellX + 1.2}
                        y={barY}
                        width={cellWidth - 2.4}
                        height={barH}
                        rx="1"
                      />
                      <text
                        class="sym-cell-num"
                        class:sym-cell-num-active={i === symStep}
                        x={cellX + cellWidth / 2}
                        y="40"
                        text-anchor="middle"
                      >{value}</text>
                    {/each}
                    <line class="sym-progress-track" x1="4" y1="42.5" x2="116" y2="42.5" />
                    <line class="sym-progress" x1="4" y1="42.5" x2={4 + 112 * symProgress} y2="42.5" />
                  </svg>
                </div>
                <div class="knob-grid">
                  {#each SYMMETRY_PARAMS as pname}
                    {@const [pmin, pmax, pstep] = SYMMETRY_PARAM_RANGE[pname]}
                    {@const param = controlParam(track, pname)}
                    {@render paramRow(param, pname, pmin, pmax, pstep, modKey(track.id, pname), track.id,
                      (v) => { track[pname] = v },
                      tempoSyncKindForTrackParam(track, pname),
                      false)}
                  {/each}
                </div>
                <div class="card-meta">{track.family ?? 'plain-hunt'} · row {symRowIdx + 1}/{symTotalRows} · step {symStep + 1}/{symN}</div>
              {:else}
                {@const sineState = controlStates[track.id] ?? {}}
                {@const sinePhase = clamp(num(sineState.phase, 0), 0, 1)}
                {@const sineAmp = Math.max(0.0001, num(sineState.amp, track.amplitude))}
                {@const sineX = (4 + 112 * sinePhase).toFixed(2)}
                {@const sineY = (22 - clamp(num(sineState.value, 0) / sineAmp, -1, 1) * 14).toFixed(2)}
                <div class="phase-widget" aria-hidden="true">
                  <svg viewBox="0 0 120 44" preserveAspectRatio="none">
                    <line class="phase-baseline" x1="4" y1="22" x2="116" y2="22" />
                    <path class="phase-curve" d="M4 22 C18 4 32 4 46 22 S74 40 88 22 S102 4 116 22" />
                    <circle class="phase-ball" cx={sineX} cy={sineY} r="3.2" />
                  </svg>
                </div>
                <div class="knob-grid">
                  {#each SINUSOID_PARAMS as pname}
                    {@const [pmin, pmax, pstep] = SINUSOID_PARAM_RANGE[pname]}
                    {@const param = controlParam(track, pname)}
                    {@render paramRow(param, pname, pmin, pmax, pstep, modKey(track.id, pname), track.id,
                      (v) => { track[pname] = v },
                      tempoSyncKindForTrackParam(track, pname),
                      false)}
                  {/each}
                </div>
                <div class="card-meta">{fmtHz(liveControlValue(track, 'rateHz'))} · phase {num(track.phaseRad, 0).toFixed(2)} rad</div>
              {/if}
            </div>
          </article>
        {/each}
        {#if draft.controlTracks.length === 0}
          <p class="empty">Add an LFO, Permutation, or Sinusoid control.</p>
        {/if}
      </div>
    </div>

    <!-- Sensory column macro — same structure for Audio / Visual / Haptic -->
    <!-- Audio -->
    <div class="col col-audio" class:is-empty={draft.audioTracks.length === 0}>
      <div class="col-head">
        <span class="col-title">Audio</span>
        <div class="col-adds">
          {#each AUDIO_TRACK_TYPES as t}
            <button class="add-btn" onclick={() => addAudio(t)}>+{t}</button>
          {/each}
        </div>
      </div>
      <div class="col-body">
        {#each draft.audioTracks as track (track.id)}
          {@const aGain = clamp(num(getLive(track, 'gain'), 0.5), 0, 1)}
          {@const aPan = clamp(num(getLive(track, 'pan'), 0), -1, 1)}
          {@const aFreq = num(getLive(track, 'frequency'), 200)}
          {@const aPulse = Math.max(0.001, num(getLive(track, 'pulseRate'), 10))}
          {@const winSec = Math.max(0.005, num(track.windowSec, 1))}
          {@const panX = ((aPan + 1) * 50).toFixed(2)}
          {@const leftF = track.trackType === 'BinauralBeat' ? num(getLive(track, 'leftFreq'), 200) : aFreq - aPulse / 2}
          {@const rightF = track.trackType === 'BinauralBeat' ? num(getLive(track, 'rightFreq'), 210) : aFreq + aPulse / 2}
          {@const centerF = (leftF + rightF) / 2}
          {@const beatF = rightF - leftF}
          {@const isoEnv = track.trackType === 'IsochronicTone' ? isoEnvSpec(track) : null}
          {@const audioSubtitle = audioSubtitleFor(track, aFreq, aPulse, leftF, rightF, centerF, beatF, isoEnv)}
          <article class="card" class:muted={track.muted}>
            <div class="card-head card-head-audio">
              <div class="card-head-main">
                <div class="card-title-line">
                  <input class="card-name" bind:value={track.name} />
                  <button class="type-info-btn" type="button" title={`${track.trackType} semantic type`} onclick={() => showTrackTypeInfo(track)}>∿</button>
                </div>
                <div class="card-subtitle">{audioSubtitle}</div>
              </div>
              <div class="card-head-actions">
                <button
                  class="mute-btn"
                  class:on={track.muted}
                  onclick={() => { track.muted = !track.muted }}
                  title={track.muted ? 'Unmute' : 'Mute'}
                  type="button"
                >mute</button>
                <button class="x-btn" onclick={() => removeAudio(track.id)} aria-label="Remove track" type="button">x</button>
              </div>
            </div>
            <div class="card-body">
              <div class="scope-shell">
                <label class="win-field win-field-floating">
                  <span>screen</span>
                  <input type="number" step="0.01" min="0.005" max="60" bind:value={track.windowSec} />
                  <span>s</span>
                </label>

                {#if track.trackType === 'BinauralBeat'}
                  {@const lrWin = binauralRowWindow(beatF, winSec)}
                  {@const leftCyc = leftF * lrWin}
                  {@const rightCyc = rightF * lrWin}
                  {@const sumLeftCyc = leftF * winSec}
                  {@const sumRightCyc = rightF * winSec}
                  {@const beatCyc = Math.abs(beatF) * winSec}
                  <div class="audio-scope a-binauralbeat" aria-hidden="true">
                    <div class="scope-row">
                      <span class="scope-side scope-side-l">L</span>
                      <svg viewBox="0 0 120 22" preserveAspectRatio="none">
                        <line class="scope-axis" x1="4" y1="11" x2="116" y2="11" />
                        {#if leftCyc < SCOPE_BAND_THRESHOLD}
                          <path class="scope-trace scope-trace-l" d={sineWavePath(4, 116, 11, 8 * aGain, leftCyc)} />
                        {:else}
                          <path class="scope-band scope-band-l" d={rectanglePath(4, 116, 11, 8 * aGain)} />
                        {/if}
                      </svg>
                      <span class="row-win">{leftCyc.toFixed(1)} cyc · {fmtWin(lrWin)}</span>
                    </div>
                    <div class="scope-row">
                      <span class="scope-side scope-side-r">R</span>
                      <svg viewBox="0 0 120 22" preserveAspectRatio="none">
                        <line class="scope-axis" x1="4" y1="11" x2="116" y2="11" />
                        {#if rightCyc < SCOPE_BAND_THRESHOLD}
                          <path class="scope-trace scope-trace-r" d={sineWavePath(4, 116, 11, 8 * aGain, rightCyc)} />
                        {:else}
                          <path class="scope-band scope-band-r" d={rectanglePath(4, 116, 11, 8 * aGain)} />
                        {/if}
                      </svg>
                      <span class="row-win">{rightCyc.toFixed(1)} cyc · {fmtWin(lrWin)}</span>
                    </div>
                    <div class="scope-row scope-row-sum">
                      <span class="scope-side scope-side-sum">Σ</span>
                      <svg viewBox="0 0 120 28" preserveAspectRatio="none">
                        <line class="scope-axis" x1="4" y1="14" x2="116" y2="14" />
                        <path class="scope-envelope" d={binauralBeatEnvelopePath(4, 116, 14, 11 * aGain, beatCyc)} />
                        {#if Math.max(sumLeftCyc, sumRightCyc) < SCOPE_BAND_THRESHOLD}
                          <path class="scope-trace scope-trace-sum" d={binauralSumPath(4, 116, 14, 11 * aGain, sumLeftCyc, sumRightCyc)} />
                        {/if}
                      </svg>
                      <span class="row-win">{fmtWin(winSec)}</span>
                    </div>
                  </div>
                {:else if track.trackType === 'IsochronicTone'}
                  {@const envCyc = aPulse * winSec}
                  {@const carrCyc = aFreq * winSec}
                  <div class="audio-scope a-isochronictone" aria-hidden="true">
                    <svg viewBox="0 0 120 40" preserveAspectRatio="none">
                      <line class="scope-axis" x1="4" y1="20" x2="116" y2="20" />
                      <path class="scope-envelope" d={isoEnvelopeOutlinePath(4, 116, 20, 16 * aGain, isoEnv, envCyc)} />
                      {#if carrCyc < SCOPE_BAND_THRESHOLD}
                        <path class="scope-trace" d={isoWavePath(4, 116, 20, 16 * aGain, carrCyc, isoEnv, envCyc)} />
                      {/if}
                    </svg>
                  </div>
                {:else if track.trackType === 'Noise'}
                  {@const aCutoff = clamp(num(getLive(track, 'cutoff'), 6000), 100, 12000)}
                  <div class="audio-scope a-noise" data-color={track.noiseColor ?? 'pink'} aria-hidden="true">
                    <svg viewBox="0 0 120 40" preserveAspectRatio="none">
                      <line class="scope-axis" x1="4" y1="20" x2="116" y2="20" />
                      <path class="scope-trace scope-trace-noise" d={noisePath(4, 116, 20, 15 * aGain, aCutoff / 12000)} />
                    </svg>
                  </div>
                {:else if track.trackType === 'Drone'}
                  {@const aDetune = num(getLive(track, 'detune'), 12)}
                  {@const droneCyc = aFreq * winSec}
                  {@const topCyc = aFreq * Math.pow(2, aDetune / 1200) * winSec}
                  <div class="audio-scope a-drone" aria-hidden="true">
                    <svg viewBox="0 0 120 40" preserveAspectRatio="none">
                      <line class="scope-axis" x1="4" y1="20" x2="116" y2="20" />
                      {#if Math.max(droneCyc, topCyc) < SCOPE_BAND_THRESHOLD}
                        <path class="scope-trace scope-trace-drone-2" d={sineWavePath(4, 116, 20, 12 * aGain, topCyc)} />
                        <path class="scope-trace" d={sineWavePath(4, 116, 20, 14 * aGain, droneCyc)} />
                      {:else}
                        <path class="scope-band" d={rectanglePath(4, 116, 20, 15 * aGain)} />
                      {/if}
                    </svg>
                  </div>
                {:else if track.trackType === 'Sample'}
                  <div class="audio-scope a-sample" aria-hidden="true">
                    <svg viewBox="0 0 120 40" preserveAspectRatio="none">
                      <line class="scope-axis" x1="4" y1="20" x2="116" y2="20" />
                      <path class="scope-trace scope-trace-sample" d={noisePath(4, 116, 20, 14 * aGain, 0.5)} />
                    </svg>
                  </div>
                {:else}
                  {@const carrCyc = aFreq * winSec}
                  <div class="audio-scope a-carrier" aria-hidden="true">
                    <svg viewBox="0 0 120 40" preserveAspectRatio="none">
                      <line class="scope-axis" x1="4" y1="20" x2="116" y2="20" />
                      {#if carrCyc < SCOPE_BAND_THRESHOLD}
                        <path class="scope-trace" d={sineWavePath(4, 116, 20, 16 * aGain, carrCyc)} />
                      {:else}
                        <path class="scope-band" d={rectanglePath(4, 116, 20, 16 * aGain)} />
                      {/if}
                    </svg>
                  </div>
                {/if}

                {#if track.trackType !== 'BinauralBeat'}
                  <div class="pan-ruler">
                    <span class="pan-track"></span>
                    <span class="pan-dot" style={`left:${panX}%`}></span>
                    <span class="pan-l">L</span>
                    <span class="pan-r">R</span>
                  </div>
                {/if}
              </div>

              {#if track.trackType === 'IsochronicTone'}
                <div class="voice-extras">
                  <label class="voice-select">
                    <span>env</span>
                    <select
                      bind:value={track.envelope}
                      onchange={() => Object.assign(track, ISO_ENVELOPE_DEFAULTS[track.envelope] ?? {})}
                    >
                      {#each ISO_ENVELOPES as e}<option value={e}>{e}</option>{/each}
                    </select>
                  </label>
                </div>
              {/if}
              {#if track.trackType === 'BinauralBeat'}
                <div class="voice-extras">
                  <label class="voice-select">
                    <span>mode</span>
                    <select bind:value={track.binauralMode}>
                      {#each BINAURAL_MODES as m}<option value={m}>{m}</option>{/each}
                    </select>
                  </label>
                </div>
              {/if}
              {#if track.trackType === 'Noise'}
                <div class="voice-extras">
                  <label class="voice-select">
                    <span>color</span>
                    <select bind:value={track.noiseColor} onchange={() => restartVoice(track)}>
                      {#each NOISE_COLORS as c}<option value={c}>{c}</option>{/each}
                    </select>
                  </label>
                  <label class="voice-select">
                    <span>filter</span>
                    <select bind:value={track.noiseFilter} onchange={() => restartVoice(track)}>
                      {#each NOISE_FILTERS as f}<option value={f}>{f}</option>{/each}
                    </select>
                  </label>
                </div>
              {/if}
              {#if track.trackType === 'Drone'}
                <div class="voice-extras">
                  <label class="voice-select">
                    <span>voices</span>
                    <select bind:value={track.droneVoices} onchange={() => restartVoice(track)}>
                      {#each DRONE_VOICES as v}<option value={v}>{v}</option>{/each}
                    </select>
                  </label>
                </div>
              {/if}
              {#if track.trackType === 'Sample'}
                <div class="voice-extras">
                  <label class="voice-select">
                    <span>clip</span>
                    <select bind:value={track.sampleId} onchange={() => restartVoice(track)}>
                      {#each SAMPLE_CLIPS as c}<option value={c}>{c}</option>{/each}
                    </select>
                  </label>
                </div>
              {/if}

              {#if track.tremolo}
                {@const tr = TREMOLO_PARAM_RANGE.rate}
                {@const td = TREMOLO_PARAM_RANGE.depth}
                <div class="trem-panel" class:on={track.tremolo.enabled}>
                  <div class="trem-head">
                    <button class="trem-toggle" type="button" class:on={track.tremolo.enabled} onclick={() => toggleTremolo(track)}>
                      tremolo {track.tremolo.enabled ? 'on' : 'off'}
                    </button>
                    {#if track.tremolo.enabled}
                      <label class="voice-select trem-mode">
                        <span>AM</span>
                        <select bind:value={track.tremolo.mode} onchange={() => applyTremolo(track)}>
                          {#each TREMOLO_MODES as m}<option value={m}>{m}</option>{/each}
                        </select>
                      </label>
                    {/if}
                  </div>
                  {#if track.tremolo.enabled}
                    <div class="trem-knobs">
                      <Knob
                        value={track.tremolo.rate} min={tr[0]} max={tr[1]} step={tr[2]} label="rate"
                        onchange={(v) => { track.tremolo.rate = v; applyTremolo(track) }}
                      />
                      <Knob
                        value={track.tremolo.depth} min={td[0]} max={td[1]} step={td[2]} label="depth"
                        onchange={(v) => { track.tremolo.depth = v; applyTremolo(track) }}
                      />
                    </div>
                  {/if}
                </div>
              {/if}

              <div class="knob-grid">
                {#if track.trackType === 'BinauralBeat' && track.binauralMode === 'center-beat'}
                  {@const lParam = track.params.leftFreq}
                  {@const rParam = track.params.rightFreq}
                  {@const gParam = track.params.gain}
                  {@const [gmin, gmax, gstep] = AUDIO_PARAM_RANGE.gain}
                  {@const [fmin, fmax, fstep] = AUDIO_PARAM_RANGE.leftFreq}
                  {@render paramRow(gParam, 'gain', gmin, gmax, gstep, modKey(track.id, 'gain'), track.id)}
                  {@const centerSynth = { value: (lParam.value + rParam.value) / 2, mods: track.params.centerFreq.mods }}
                  {@const beatSynth   = { value: rParam.value - lParam.value, mods: track.params.beatFreq.mods, tempoSync: track.params.beatFreq.tempoSync }}
                  {@const [cfmin, cfmax, cfstep] = AUDIO_PARAM_RANGE.centerFreq}
                  {@const [bfmin, bfmax, bfstep] = AUDIO_PARAM_RANGE.beatFreq}
                  {@render paramRow(centerSynth, 'centerFreq', cfmin, cfmax, cfstep, modKey(track.id, 'centerFreq'), track.id,
                    (v) => { const beat = rParam.value - lParam.value; lParam.value = clamp(v - beat / 2, fmin, fmax); rParam.value = clamp(v + beat / 2, fmin, fmax) })}
                  {@render paramRow(beatSynth, 'beatFreq', bfmin, bfmax, bfstep, modKey(track.id, 'beatFreq'), track.id,
                    (v) => { const c = (lParam.value + rParam.value) / 2; lParam.value = clamp(c - v / 2, fmin, fmax); rParam.value = clamp(c + v / 2, fmin, fmax) },
                    tempoSyncKindForTrackParam(track, 'beatFreq'))}
                {:else}
                  {#each voiceParamNames(track.trackType) as pname}
                    {@const param = track.params[pname]}
                    {@const [pmin, pmax, pstep] = AUDIO_PARAM_RANGE[pname]}
                    {@render paramRow(param, pname, pmin, pmax, pstep, modKey(track.id, pname), track.id,
                      pname === 'noteDurationFrac'
                        ? (v) => { param.value = v; track.noteDurationFrac = v }
                        : null,
                      tempoSyncKindForTrackParam(track, pname))}
                  {/each}
                {/if}
              </div>
            </div>
          </article>
        {/each}
        {#if !draft.audioTracks.length}
          <p class="empty">No audio tracks. Add one above.</p>
        {/if}
      </div>
    </div>

    <!-- Visual -->
    <div class="col col-visual" class:is-empty={draft.visualTracks.length === 0}>
      <div class="col-head">
        <span class="col-title">Visual</span>
        <div class="col-adds">
          {#each VISUAL_TRACK_TYPES as t}
            <button class="add-btn" onclick={() => addVisual(t)}>+{t}</button>
          {/each}
          <button
            class="add-btn mix-btn"
            bind:this={mixTriggerEl}
            onclick={openMix}
            disabled={!$visualStimulationOn || !draft.visualTracks.length}
            title="Open the resizable visual mix"
          >Mix</button>
        </div>
      </div>
      <div class="col-body">
        <details class="starter-menu">
          <summary>Sensory Field starters</summary>
          <p>Insert seamless ordinary audio, colour, and stereoscopic tracks.</p>
          <div class="col-adds">
            {#each FIELD_STARTERS as starter (starter.id)}
              <button class="add-btn" onclick={() => offerStarter(tokenForStarter(starter.id))}>
                +{starter.label}
              </button>
            {/each}
          </div>
        </details>
        {#if draft.visualTracks.some(isStudioStageTrack)}
          <details class="stage-settings">
            <summary>Shared visual stage</summary>
            <VisualStageControls
              stage={draft.visualStage}
              onchange={(next) => { draft.visualStage = next }}
            />
          </details>
        {/if}
        {#each draft.visualTracks as track (track.id)}
          <article class="card" class:muted={track.enabled === false}>
            <div class="card-head">
              <div class="card-title-line">
                <input class="card-name" bind:value={track.name} />
                <button class="type-info-btn" type="button" title={`${track.trackType} semantic type`} onclick={() => showTrackTypeInfo(track)}>∿</button>
              </div>
              <button class="x-btn" onclick={() => removeVisual(track.id)} aria-label="Remove track" type="button">x</button>
            </div>
            <div class="card-body">
              {#if isStudioStageTrack(track)}
                <label class="mod-enable track-enabled">
                  <input type="checkbox" bind:checked={track.enabled} />
                  <span>Enabled</span>
                </label>
              {/if}
              {#if !$visualStimulationOn}
                <div class="track-preview visual-off" aria-hidden="true">
                  <span>Visual stimulation is off (Settings)</span>
                </div>
              {:else}
                <div class="track-preview visual-preview" style={visualStyle(track)} aria-hidden="true">
                  {@render visualLayer(track)}
                </div>
              {/if}
              {#if $visualStimulationOn && (track.trackType === 'Blink' || (track.trackType === 'ColorField' && track.config?.blinkEnabled))}
                {@const br = num(track.params.blinkRate?.value, 10)}
                {#if requiresFlashAcknowledgement(br)}
                  <div class="flash-warn flash-{flashAccepted ? flashRiskLevel(br) : 'capped'}">
                    {#if flashAccepted}
                      <span>{br.toFixed(1)} Hz — {flashRiskMessage(flashRiskLevel(br))}</span>
                    {:else}
                      <span>Capped at {FLASH_SAFE_MAX_HZ} Hz for photosensitivity safety.</span>
                      <button type="button" class="flash-allow" onclick={() => (flashAccepted = true)}>
                        Allow flashing above {FLASH_SAFE_MAX_HZ} Hz (this session)
                      </button>
                    {/if}
                  </div>
                {/if}
              {/if}
              {#if isStudioStageTrack(track)}
                <SpatialTrackInspector
                  {track}
                  onchange={updateVisualTrack}
                />
              {/if}
              {#if $visualStimulationOn}
                {#if SPATIAL_VISUAL_TRACK_TYPES.includes(track.trackType) && draft.visualStage?.presentationMode === 'autostereogram'}
                  <p class="spatial-blend-note">Blend is not applicable to autostereogram depth-buffer output.</p>
                {:else}
                  <div class="voice-extras">
                    <label class="voice-select">
                      <span>blend</span>
                      <select bind:value={track.blend}>
                        {#each BLEND_MODES as b}<option value={b}>{b}</option>{/each}
                      </select>
                    </label>
                  </div>
                {/if}
              {/if}
              <div class="knob-grid">
                {#each visualParamNames(track.trackType) as pname}
                  {@const param = track.params[pname]}
                  {@const [pmin, pmax, pstep] = VISUAL_PARAM_RANGE[pname]}
                  {@render paramRow(param, pname, pmin, pmax, pstep, modKey(track.id, pname), track.id, null, tempoSyncKindForTrackParam(track, pname))}
                {/each}
              </div>
            </div>
          </article>
        {/each}
        {#if !draft.visualTracks.length}
          <p class="empty">No visual tracks. Add one above.</p>
        {/if}
      </div>
    </div>

    <!-- Haptic -->
    <div class="col col-haptic" class:is-empty={draft.hapticTracks.length === 0}>
      <div class="col-head">
        <span class="col-title">Haptic</span>
        <div class="col-adds">
          {#each HAPTIC_TRACK_TYPES as t}
            <button class="add-btn" onclick={() => addHaptic(t)}>+{t}</button>
          {/each}
        </div>
      </div>
      <div class="col-body">
        {#each draft.hapticTracks as track (track.id)}
          <article class="card">
            <div class="card-head">
              <div class="card-title-line">
                <input class="card-name" bind:value={track.name} />
                <button class="type-info-btn" type="button" title={`${track.trackType} semantic type`} onclick={() => showTrackTypeInfo(track)}>∿</button>
              </div>
              <button class="x-btn" onclick={() => removeHaptic(track.id)} aria-label="Remove track" type="button">x</button>
            </div>
            <div class="card-body">
              <div class="track-preview haptic-preview" style={hapticStyle(track)} aria-hidden="true">
                <span class="haptic-wave haptic-wave-a"></span>
                <span class="haptic-wave haptic-wave-b"></span>
                <span class="haptic-core"></span>
                <span class="haptic-scan"></span>
              </div>
              <div class="knob-grid">
                {#each HAPTIC_PARAMS as pname}
                  {@const param = track.params[pname]}
                  {@const [pmin, pmax, pstep] = HAPTIC_PARAM_RANGE[pname]}
                  {@render paramRow(param, pname, pmin, pmax, pstep, modKey(track.id, pname), track.id, null, tempoSyncKindForTrackParam(track, pname))}
                {/each}
              </div>
            </div>
          </article>
        {/each}
        {#if !draft.hapticTracks.length}
          <p class="empty">No haptic tracks. Add a Vibration track.</p>
        {/if}
      </div>
    </div>

  </div><!-- /cols -->

  <!-- ── ISSUES FOOTER ── -->
  {#if issues.length}
    <footer class="issues">
      {#each issues as iss}
        <span class="iss {iss.level}">{iss.message}</span>
      {/each}
    </footer>
  {/if}

  {#if semanticInfo}
    <div
      class="semantic-overlay"
      role="presentation"
      onclick={(event) => { if (event.target === event.currentTarget) closeSemanticInfo() }}
    >
      <div class="semantic-card" role="dialog" aria-label={`${semanticInfo.label} semantic info`} aria-modal="true">
        <header class="semantic-head">
          <div>
            <span class="semantic-kind">{semanticInfo.kind}</span>
            <h3>{semanticInfo.label}</h3>
          </div>
          <button type="button" class="semantic-close" aria-label="Close semantic info" onclick={closeSemanticInfo}>×</button>
        </header>
        <p>{semanticInfo.description}</p>
        {#if semanticInfo.uri}
          <dl>
            <div>
              <dt>CURIE</dt>
              <dd>{localSemanticName(semanticInfo.uri)}</dd>
            </div>
            <div>
              <dt>URI</dt>
              <dd><code>{semanticInfo.uri}</code></dd>
            </div>
          </dl>
          <a class="semantic-graph-link" href={semanticGraphHref(semanticInfo)}>Open in graph</a>
        {:else}
          <p class="semantic-unmapped"><small>Not yet mapped to an SSTIM ontology term.</small></p>
        {/if}
      </div>
    </div>
  {/if}

  {#if mixOpen}
    <dialog
      class="mix-dialog"
      bind:this={mixDialogEl}
      aria-label="Patch Studio visual mix"
      oncancel={handleMixCancel}
      onclick={handleMixBackdropClick}
      tabindex="-1"
    >
      <div
        class="visual-stage"
        bind:this={stageEl}
        style={`background:${draft.visualStage?.backgroundColor || '#04060a'}`}
      >
        {#each draft.visualTracks as track (track.id)}
          {#if track.id === firstStudioStageTrackId}
            <StudioVisualStage
              tracks={studioStageTracks}
              {liveValues}
              stage={draft.visualStage}
              {controllerTime}
              transparentBackground={true}
              active={$visualStimulationOn}
              label="Patch Studio visual mix"
            />
          {:else if !isStudioStageTrack(track) && track.enabled !== false}
            <div class="stage-layer" style={`${visualStyle(track)};mix-blend-mode:${track.blend || 'screen'}`}>
              <div class="stage-scale">{@render visualLayer(track)}</div>
            </div>
          {/if}
        {/each}
        {#if !draft.visualTracks.length}
          <p class="stage-empty">Add visual tracks to mix.</p>
        {/if}
        <div class="stage-actions" role="toolbar" aria-label="Visual mix actions">
          <span class="stage-resize-hint">Resize from the lower-right corner</span>
          <button type="button" class="stage-action" onclick={toggleMixFullscreen}>
            {mixFullscreen ? 'Exit full screen' : 'Full screen'}
          </button>
          <button type="button" class="stage-action" onclick={closeMix} aria-label="Close visual mix">✕ Close</button>
        </div>
      </div>
    </dialog>
  {/if}

</div>

<style>
  /* Incoming patch link (ADR 0039, Tier 1). Modal because accepting replaces
     the open draft — this must not be something you click past by accident. */
  .link-offer {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: color-mix(in srgb, #000 62%, transparent);
    backdrop-filter: blur(3px);
  }

  .link-offer-body {
    max-width: 34rem;
    max-height: min(48rem, calc(100vh - 2rem));
    overflow: auto;
    padding: 1.25rem 1.5rem;
    border-radius: 0.75rem;
    border: 1px solid var(--stroke, rgba(255, 255, 255, 0.16));
    background: var(--panel, #16181d);
    color: var(--text, #e8e8ea);
    box-shadow: 0 1.5rem 3rem rgba(0, 0, 0, 0.45);
  }

  .link-offer-body p {
    margin: 0 0 0.6rem;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .link-offer-note {
    opacity: 0.75;
    font-size: 0.82rem;
  }

  .link-offer-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .starter-report {
    margin-top: 0.8rem;
    border: 1px solid var(--stroke, rgba(255, 255, 255, 0.16));
    border-radius: 0.5rem;
    background: color-mix(in srgb, var(--panel, #16181d) 82%, #000 18%);
  }

  .starter-report > summary {
    padding: 0.65rem 0.75rem;
    cursor: pointer;
    font-size: 0.82rem;
    font-weight: 700;
  }

  .starter-report-sections {
    display: grid;
    gap: 0.55rem;
    padding: 0 0.75rem 0.75rem;
  }

  .starter-report section {
    padding: 0.55rem 0.65rem;
    border-radius: 0.35rem;
    background: color-mix(in srgb, var(--panel, #16181d) 90%, #fff 10%);
  }

  .starter-report section.needs-review {
    border-left: 3px solid var(--warn, #e67e22);
  }

  .starter-report h3 {
    margin: 0 0 0.35rem;
    font-size: 0.76rem;
  }

  .starter-report h3 span,
  .starter-report section > p {
    opacity: 0.7;
  }

  .starter-report ul {
    margin: 0;
    padding-left: 1.1rem;
  }

  .starter-report li,
  .starter-report section > p {
    margin: 0.2rem 0;
    font-size: 0.72rem;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  .starter-ack {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin-top: 0.8rem;
    font-size: 0.78rem;
    line-height: 1.4;
  }

  /* ── Design tokens ─────────────────────────────────────────────────────────── */
  .studio {
    --bg:     var(--app-bg, #0b0f14);
    --sur:    var(--app-surface, #111820);
    --sur2:   var(--app-surface-2, #161e28);
    --bdr:    var(--app-border, #1c2a38);
    --txt:    var(--app-text, #c0d0e0);
    --mut:    var(--app-muted-2, #445866);
    --acc:    var(--app-accent, #3b9eff);
    --acc-s:  var(--app-accent-soft, #0c2440);
    --ok:     var(--app-ok, #27ae60);
    --warn:   var(--app-warn, #e67e22);
    --err:    var(--app-error, #c0392b);
    --cc:     var(--app-control, #e67e22);   /* control colour */
    --ac:     var(--app-audio, #3b9eff);     /* audio colour   */
    --vc:     var(--app-visual, #8e44ad);    /* visual colour  */
    --hc:     var(--app-haptic, #16a085);    /* haptic colour  */
    --hdr-control: 34px;
    --knob-track: color-mix(in srgb, var(--txt) 28%, var(--sur2));
    --knob-center: var(--sur2);
    --knob-center-stroke: color-mix(in srgb, var(--acc) 32%, transparent);
    --knob-mod-bg: color-mix(in srgb, var(--sur) 88%, var(--txt) 12%);
    --knob-glow: color-mix(in srgb, var(--acc) 55%, transparent);
    --knob-glow-strong: color-mix(in srgb, var(--acc) 72%, transparent);
    --knob-value-hover-border: color-mix(in srgb, var(--acc) 56%, transparent);
    --knob-value-hover-bg: color-mix(in srgb, var(--acc) 14%, transparent);

    display: flex;
    flex-direction: column;
    height: calc(100vh - var(--app-bottom-dock-height, 48px));
    overflow: hidden;
    background: var(--bg);
    color: var(--txt);
    font-family: var(--app-font-mono, 'SF Mono', 'Fira Code', ui-monospace, monospace);
    font-size: 11px;
    line-height: 1;
  }

  /* ── Header — single fixed-height bar ──────────────────────────────────────── */
  .hdr {
    display: grid;
    /* name pill | transport | actions */
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 14px;
    height: var(--app-header-height, 56px);
    padding: 0 1rem;
    background: var(--sur);
    border-bottom: var(--app-border-width) solid var(--bdr);
    flex-shrink: 0;
  }

  .hdr *,
  .hdr *::before,
  .hdr *::after {
    box-sizing: border-box;
  }

  .hdr :is(input, button, summary) {
    margin: 0;
    min-height: 0;
  }

  .hdr-name {
    display: flex;
    align-items: center;
    gap: 8px;
    height: var(--hdr-control);
    min-width: 0;
    overflow: hidden;
  }

  .patch-name {
    display: block;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--bdr);
    color: var(--txt);
    font-size: 12px;
    font-weight: 700;
    font-family: inherit;
    width: 132px;
    height: var(--hdr-control);
    line-height: var(--hdr-control);
    padding: 0 2px;
    flex-shrink: 0;
    border-radius: 0;
  }
  .patch-name:focus { outline: none; border-bottom-color: var(--acc); }

  .pill {
    display: inline-flex;
    align-items: center;
    height: var(--hdr-control);
    color: var(--mut);
    font-size: 9px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hdr-transport {
    display: flex;
    align-items: center;
    height: var(--hdr-control);
    gap: 6px;
  }

  .play-btn {
    width: var(--hdr-control);
    height: var(--hdr-control);
    border-radius: 50%;
    border: 1.5px solid var(--acc);
    background: transparent;
    color: var(--acc);
    font-size: 0.8rem;
    cursor: pointer;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    padding: 0;
  }
  .play-btn:hover { background: var(--acc-s); }
  .studio.playing .play-btn {
    background: var(--acc-s);
    box-shadow: 0 0 12px #3b9eff44;
  }

  .bpm-toggle {
    height: var(--hdr-control);
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 0 8px;
    border: var(--app-border-width) solid var(--bdr);
    border-radius: var(--app-radius);
    background: var(--bg);
    color: var(--mut);
    font-size: 9px;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
    user-select: none;
  }
  .bpm-toggle input {
    width: 12px;
    height: 12px;
    margin: 0;
    accent-color: var(--acc);
  }
  .bpm-toggle.on {
    border-color: var(--acc);
    color: var(--acc);
    background: var(--acc-s);
  }

  .tempo-meter {
    position: relative;
    width: 64px;
    height: var(--hdr-control);
    border: var(--app-border-width) solid var(--bdr);
    border-radius: var(--app-radius);
    background:
      radial-gradient(circle at 20% 50%, #3b9eff22, transparent 46%),
      linear-gradient(180deg, #09131d, #050a0f);
    overflow: hidden;
    flex-shrink: 0;
  }

  .studio.playing .tempo-meter { border-color: #3b9eff88; }

  .tempo-grid {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, #243547 1px, transparent 1px) 0 0 / calc(100% / var(--tempo-beats, 4)) 100%;
    opacity: 0.65;
  }

  .tempo-sweep {
    position: absolute;
    top: 2px;
    bottom: 2px;
    left: -14px;
    width: 14px;
    border-radius: 3px;
    background: linear-gradient(90deg, transparent, #3b9eff88);
    animation: tempoSweep var(--bar-duration, 4s) linear infinite;
  }

  .tempo-dot {
    position: absolute;
    top: 7px;
    left: 6px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #9fd0ff;
    box-shadow: 0 0 8px #3b9eff;
    animation: tempoBeat var(--beat-duration, 1s) ease-in-out infinite;
  }

  .mini-field {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: var(--hdr-control);
    margin: 0;
    font-size: 9px;
    line-height: 1;
    color: var(--mut);
  }
  .mini-field input {
    width: 46px;
    height: var(--hdr-control);
    background: var(--bg);
    border: var(--app-border-width) solid var(--bdr);
    color: var(--txt);
    border-radius: var(--app-radius);
    padding: 0 6px;
    font-size: 9px;
    font-family: inherit;
    line-height: 1;
  }

  .tempo-bpm-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    height: var(--hdr-control);
  }

  .mini-mod-btn {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1px solid var(--bdr);
    background: var(--bg);
    color: var(--mut);
    font-size: 9px;
    font-weight: 700;
    font-family: inherit;
    line-height: 1;
    display: grid;
    place-items: center;
    cursor: pointer;
    padding: 0;
  }
  .mini-mod-btn:hover,
  .mini-mod-btn.on {
    border-color: var(--acc);
    color: var(--acc);
    background: var(--acc-s);
  }

  .tempo-live {
    min-width: 24px;
    color: var(--acc);
    font-size: 9px;
    font-variant-numeric: tabular-nums;
    text-align: right;
  }

  .tempo-bpm-mods {
    position: absolute;
    top: calc(100% + 7px);
    left: 0;
    z-index: 70;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    min-width: 220px;
    max-width: min(480px, 80vw);
    padding: 10px;
    border: 1px solid var(--acc);
    border-radius: 6px;
    background: var(--sur2);
    box-shadow: 0 10px 28px #00000088;
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .hdr-actions {
    display: flex;
    align-items: center;
    height: var(--hdr-control);
    gap: 4px;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    border-radius: 99px;
    height: 18px;
    padding: 0 6px;
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    white-space: nowrap;
  }
  .b-ok   { background: #0a2016; color: var(--ok); }
  .b-warn { background: #2a1a05; color: var(--warn); }
  .b-err  { background: #2a0805; color: var(--err); }

  .act-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: var(--app-border-width) solid var(--bdr);
    color: var(--mut);
    border-radius: var(--app-radius);
    padding: 0 8px;
    font-size: 9px;
    font-family: inherit;
    cursor: pointer;
    height: var(--hdr-control);
    line-height: 1;
    white-space: nowrap;
    transition: color .1s, border-color .1s;
  }
  .act-btn:hover { color: var(--txt); border-color: var(--acc); }
  .act-btn:disabled { opacity: .3; cursor: default; }

  .store-target {
    margin-bottom: 0.5rem;
    opacity: 0.85;
  }

  .cloud-menu {
    position: relative;
    display: inline-flex;
    align-items: center;
    height: var(--hdr-control);
    margin: 0;
  }

  .cloud-menu summary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: var(--hdr-control);
    min-width: 76px;
    padding: 0 8px;
    border: var(--app-border-width) solid var(--bdr);
    border-radius: var(--app-radius);
    background: transparent;
    color: var(--mut);
    font-size: 9px;
    font-family: inherit;
    line-height: 1;
    cursor: pointer;
    list-style: none;
    white-space: nowrap;
  }

  .cloud-menu summary::marker,
  .cloud-menu summary::after { display: none; content: ''; }
  .cloud-menu summary::-webkit-details-marker { display: none; }
  .cloud-menu summary:hover,
  .cloud-menu[open] summary {
    color: var(--txt);
    border-color: var(--acc);
    background: var(--acc-s);
  }

  .cloud-panel {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    z-index: 80;
    width: min(19rem, 82vw);
    max-height: min(28rem, calc(100vh - 6rem));
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
    border: 1px solid var(--bdr);
    border-radius: 6px;
    background: var(--sur2);
    box-shadow: 0 12px 28px #00000099;
    overflow: auto;
  }

  .cloud-actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 6px;
  }

  .cloud-action {
    height: 28px;
    margin: 0;
    padding: 0 8px;
    border: 1px solid var(--acc);
    border-radius: var(--app-radius);
    background: var(--acc-s);
    color: var(--acc);
    font-size: 10px;
    font-family: inherit;
    cursor: pointer;
    line-height: 1;
    white-space: nowrap;
  }

  .cloud-action.secondary {
    border-color: var(--bdr);
    background: transparent;
    color: var(--mut);
  }

  .cloud-action:hover { color: var(--txt); border-color: var(--acc); }
  .cloud-action:disabled { opacity: 0.35; cursor: default; }

  .cloud-status,
  .cloud-error {
    margin: 0;
    font-size: 10px;
    line-height: 1.4;
    color: var(--mut);
  }

  .cloud-error { color: var(--err); }

  .cloud-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .cloud-list li {
    margin: 0;
    padding: 7px;
    border: 1px solid var(--bdr);
    border-radius: 5px;
    background: color-mix(in srgb, var(--sur) 82%, var(--bg));
    display: grid;
    gap: 7px;
  }

  .cloud-list li.active {
    border-color: color-mix(in srgb, var(--acc) 62%, transparent);
    background: color-mix(in srgb, var(--acc-s) 64%, transparent);
  }

  .cloud-item-main {
    display: grid;
    gap: 3px;
    min-width: 0;
  }

  .cloud-item-main span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--txt);
    font-size: 10px;
    line-height: 1.2;
  }

  .cloud-item-main small {
    color: var(--mut);
    font-size: 8px;
    line-height: 1.2;
  }

  .cloud-item-actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 5px;
  }

  .cloud-row-action {
    height: 24px;
    margin: 0;
    padding: 0 7px;
    border: 1px solid var(--bdr);
    border-radius: var(--app-radius);
    background: transparent;
    color: var(--mut);
    font-size: 9px;
    font-family: inherit;
    cursor: pointer;
    line-height: 1;
    white-space: nowrap;
  }

  .cloud-row-action.primary {
    border-color: color-mix(in srgb, var(--acc) 62%, var(--bdr));
    color: var(--acc);
    background: var(--acc-s);
  }

  .cloud-row-action.danger:hover {
    border-color: var(--err);
    color: var(--err);
  }

  .cloud-row-action:hover {
    border-color: var(--acc);
    color: var(--txt);
  }

  .cloud-row-action:disabled {
    opacity: 0.35;
    cursor: default;
  }

  /* ── Nav menu ──────────────────────────────────────────────────────────────── */
  .hdr-icon,
  .nav-menu { position: relative; margin: 0; }
  .nav-menu {
    display: inline-flex;
    align-items: center;
    height: var(--hdr-control);
  }
  .hdr-icon,
  .nav-menu summary {
    display: grid;
    place-items: center;
    width: var(--hdr-control);
    height: var(--hdr-control);
    border: var(--app-border-width) solid var(--bdr);
    border-radius: var(--app-radius);
    background: transparent;
    color: var(--acc);
    font-size: 1.2rem;
    line-height: 1;
    cursor: pointer;
    list-style: none;
    transition: color .1s, border-color .1s;
    padding: 0;
    font-family: inherit;
  }
  .nav-menu summary::marker,
  .nav-menu summary::after { display: none; content: ''; }
  .nav-menu summary::-webkit-details-marker { display: none; }
  .hdr-icon:hover,
  .nav-menu summary:hover { color: var(--txt); border-color: var(--acc); background: var(--acc-s); }
  .nav-panel {
    position: absolute;
    right: 0;
    top: calc(100% + 4px);
    z-index: 60;
    min-width: 120px;
    background: var(--sur2);
    border: 1px solid var(--bdr);
    border-radius: 4px;
    padding: 3px 5px;
    box-shadow: 0 8px 20px #00000099;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .nav-panel a {
    display: block;
    padding: 4px 5px;
    color: var(--txt);
    text-decoration: none;
    font-size: 10px;
    border-radius: 3px;
  }
  .nav-panel a:hover { background: var(--acc-s); color: var(--acc); }

  .studio-help-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: grid;
    place-items: center;
    padding: 1.5rem;
    background: #00000088;
    backdrop-filter: blur(2px);
  }

  .studio-help-card {
    width: min(28rem, 100%);
    padding: 1rem 1.25rem 1.1rem;
    background: var(--sur);
    border: var(--app-border-width) solid var(--bdr);
    border-radius: calc(var(--app-radius) + 2px);
    box-shadow: 0 1.5rem 3rem #0008;
  }

  .studio-help-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.7rem;
  }

  .studio-help-head h3 {
    margin: 0;
    color: var(--txt);
    font-size: 0.95rem;
  }

  .studio-help-close {
    width: 1.7rem;
    height: 1.7rem;
    margin: 0;
    padding: 0;
    border: var(--app-border-width) solid var(--bdr);
    border-radius: var(--app-radius);
    background: transparent;
    color: var(--txt);
    cursor: pointer;
    display: grid;
    place-items: center;
    font-size: 0.85rem;
    line-height: 1;
  }
  .studio-help-close:hover { background: var(--acc-s); border-color: var(--acc); }

  .studio-help-card dl {
    display: grid;
    gap: 0.55rem;
    margin: 0;
  }

  .studio-help-card dl > div {
    display: grid;
    grid-template-columns: 5rem 1fr;
    gap: 0.65rem;
    align-items: baseline;
    font-size: 0.82rem;
    line-height: 1.45;
  }

  .studio-help-card dt {
    color: var(--acc);
    font-weight: 700;
  }

  .studio-help-card dd {
    margin: 0;
    color: var(--txt);
  }

  .semantic-overlay {
    position: fixed;
    inset: 0;
    z-index: 130;
    display: grid;
    place-items: center;
    padding: 1.5rem;
    background: #00000088;
    backdrop-filter: blur(2px);
  }

  .semantic-card {
    width: min(34rem, 100%);
    margin: 0;
    padding: 1rem 1.2rem 1.15rem;
    background: var(--sur);
    border: var(--app-border-width) solid var(--bdr);
    border-radius: calc(var(--app-radius) + 2px);
    box-shadow: 0 1.5rem 3rem #0009;
    color: var(--txt);
  }

  .semantic-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.8rem;
  }

  .semantic-kind {
    display: block;
    margin-bottom: 0.25rem;
    color: var(--acc);
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .semantic-card h3,
  .semantic-card p,
  .semantic-card dl {
    margin: 0;
  }

  .semantic-card h3 {
    font-size: 1rem;
    color: var(--txt);
  }

  .semantic-card p {
    margin-top: 0.65rem;
    color: color-mix(in srgb, var(--txt) 72%, var(--mut));
    font-size: 0.82rem;
    line-height: 1.45;
  }

  .semantic-card dl {
    display: grid;
    gap: 0.55rem;
    margin-top: 0.85rem;
  }

  .semantic-card dl > div {
    display: grid;
    grid-template-columns: 4rem minmax(0, 1fr);
    gap: 0.65rem;
    align-items: baseline;
    font-size: 0.76rem;
    line-height: 1.45;
  }

  .semantic-card dt {
    color: var(--acc);
    font-weight: 700;
  }

  .semantic-card dd {
    min-width: 0;
    margin: 0;
    color: var(--txt);
    word-break: break-word;
  }

  .semantic-card code {
    color: color-mix(in srgb, var(--txt) 82%, var(--acc));
    background: color-mix(in srgb, var(--sur2) 80%, transparent);
    border-radius: 3px;
    padding: 0.1rem 0.25rem;
    white-space: normal;
  }

  .semantic-close {
    width: 1.7rem;
    height: 1.7rem;
    margin: 0;
    padding: 0;
    border: var(--app-border-width) solid var(--bdr);
    border-radius: var(--app-radius);
    background: transparent;
    color: var(--txt);
    cursor: pointer;
    display: grid;
    place-items: center;
    font-size: 0.9rem;
    line-height: 1;
  }
  .semantic-close:hover { background: var(--acc-s); border-color: var(--acc); }

  .semantic-unmapped { margin: 0.5rem 0 0; color: var(--mut); }

  .semantic-graph-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 2rem;
    margin-top: 1rem;
    padding: 0 0.8rem;
    border: 1px solid var(--acc);
    border-radius: var(--app-radius);
    background: var(--acc-s);
    color: var(--acc);
    font-size: 0.78rem;
    font-weight: 700;
    text-decoration: none;
  }

  .semantic-graph-link:hover {
    background: color-mix(in srgb, var(--acc-s) 72%, var(--acc));
    color: var(--txt);
  }

  /* ── Status bar ────────────────────────────────────────────────────────────── */
  .status-bar {
    padding: 2px 10px;
    font-size: 9px;
    color: var(--mut);
    background: var(--sur);
    border-bottom: 1px solid var(--bdr);
    flex-shrink: 0;
    height: 18px;
    display: flex;
    align-items: center;
  }

  /* ── Four columns ──────────────────────────────────────────────────────────── */
  /* Content-aware widths: a lane with tracks grows; an empty lane shrinks to a
     slim rail so its add-buttons stay reachable without stealing half the board. */
  .cols {
    display: flex;
    gap: 12px;
    padding: 12px;
    flex: 1;
    overflow: auto;
    align-items: stretch;
  }

  .col {
    display: flex;
    flex-direction: column;
    /* Populated lanes share the space; empty lanes (.is-empty) get less below. */
    flex: 2.2 1 0;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    border: 1px solid var(--bdr);
    border-radius: 12px;
    background: color-mix(in srgb, var(--sur) 82%, var(--bg));
    box-shadow: inset 0 1px 0 #ffffff05, 0 10px 28px #00000012;
  }

  /* Empty lane: collapse toward a rail, but stay wide enough for the column
     title and the horizontally-scrollable add-button row. */
  .col.is-empty {
    flex: 1 1 0;
    min-width: 150px;
  }

  /* Column header: two rows, each exactly 26px, always the same across columns */
  .col-head {
    display: grid;
    grid-template-rows: 30px 32px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--bdr);
    background: color-mix(in srgb, var(--sur2) 82%, var(--bg));
  }

  .col-title {
    display: flex;
    align-items: center;
    padding: 0 12px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border-bottom: 1px solid var(--bdr);
  }
  .col-ctrl  .col-title { color: var(--cc); }
  .col-audio .col-title { color: var(--ac); }
  .col-visual .col-title { color: var(--vc); }
  .col-haptic .col-title { color: var(--hc); }

  .col-adds {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 10px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .col-adds::-webkit-scrollbar { display: none; }

  .add-btn {
    background: transparent;
    border: 1px solid var(--bdr);
    color: var(--mut);
    border-radius: 4px;
    padding: 0 8px;
    font-size: 10px;
    font-family: inherit;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    height: 22px;
    transition: color .1s, border-color .1s;
  }
  .add-btn:hover { color: var(--txt); border-color: var(--acc); }

  /* Column body — cards stack here with consistent spacing */
  .col-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px 10px 14px;
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  .empty {
    color: var(--mut);
    font-size: 10px;
    text-align: center;
    padding: 18px 10px;
    line-height: 1.5;
  }

  /* ── Track cards ───────────────────────────────────────────────────────────── */
  .card {
    background: var(--sur2);
    border: 1px solid var(--bdr);
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 6px 20px #0000000f;
  }

  /* Card title bar — single compact row */
  .card-head {
    display: flex;
    align-items: center;
    min-height: 34px;
    padding: 6px 10px 6px 12px;
    border-bottom: 1px solid var(--bdr);
    gap: 8px;
  }

  .card-head-audio {
    align-items: flex-start;
    padding-top: 8px;
    padding-bottom: 8px;
  }

  .card-head-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .card-head-audio .card-name {
    flex: 1 1 auto;
  }

  .card-title-line {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .card-head-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .card-name {
    background: transparent;
    border: none;
    color: var(--txt);
    font-weight: 600;
    font-size: 13px;
    font-family: inherit;
    flex: 1;
    min-width: 0;
    height: 24px;
    min-height: 0;
    margin: 0;
    padding: 0;
    line-height: 1.15;
    box-shadow: none;
  }
  .card-name:focus { outline: none; color: var(--acc); }

  .type-info-btn {
    flex: 0 0 auto;
    width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
    margin: 0;
    padding: 0;
    border-radius: 50%;
    border: 1px solid color-mix(in srgb, var(--txt) 22%, var(--bdr));
    background: transparent;
    color: var(--mut);
    font-family: inherit;
    font-size: 13px;
    line-height: 1;
    cursor: help;
  }

  .type-info-btn:hover {
    border-color: var(--acc);
    color: var(--acc);
    background: var(--acc-s);
  }

  .card-subtitle {
    font-size: 12px;
    line-height: 1.3;
    color: color-mix(in srgb, var(--txt) 48%, var(--mut));
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-body {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .card-meta {
    font-size: 11px;
    color: color-mix(in srgb, var(--txt) 42%, var(--mut));
    line-height: 1.4;
  }

  /* ── Waveform select (control cards) ──────────────────────────────────────── */
  .wave-field {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: color-mix(in srgb, var(--txt) 42%, var(--mut));
    line-height: 1.3;
  }

  .wave-field select {
    flex: 1;
    background: var(--bg);
    border: 1px solid var(--bdr);
    color: var(--txt);
    border-radius: 4px;
    padding: 0 8px;
    font-size: 11px;
    font-family: inherit;
    height: 26px;
  }

  .control-preview,
  .track-preview {
    position: relative;
    height: 48px;
    border: 1px solid #203245;
    border-radius: 6px;
    overflow: hidden;
    background: #071018;
    flex-shrink: 0;
    isolation: isolate;
  }

  .visual-off {
    display: grid;
    place-items: center;
    background: var(--app-surface-2);
    border: 1px dashed var(--app-border);
  }
  .visual-off span {
    color: var(--app-muted);
    font-size: 0.72rem;
    letter-spacing: 0.02em;
  }

  .flash-warn {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.35rem;
    padding: 0.3rem 0.45rem;
    font-size: 0.7rem;
    line-height: 1.3;
    border-radius: 6px;
    border: 1px solid;
  }
  .flash-warn.flash-capped { background: #c9920018; border-color: #c9920066; }
  .flash-warn.flash-safe { background: #2a7d4f18; border-color: #2a7d4f66; }
  .flash-warn.flash-caution { background: #c9920018; border-color: #c9920066; }
  .flash-warn.flash-high { background: #cc222218; border-color: #cc222288; }
  .flash-allow {
    margin: 0;
    padding: 0.2rem 0.5rem;
    width: auto;
    font-size: 0.68rem;
    font-weight: 600;
    border: 1px solid currentColor;
    border-radius: 5px;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }

  .control-preview::before,
  .track-preview::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, #ffffff06 1px, transparent 1px) 0 0 / 16px 100%,
      linear-gradient(180deg, #ffffff06 1px, transparent 1px) 0 0 / 100% 12px;
    pointer-events: none;
    z-index: -1;
  }

  .phase-widget {
    position: relative;
    height: 54px;
    border: 1px solid #203245;
    border-radius: 6px;
    overflow: hidden;
    flex-shrink: 0;
    background:
      radial-gradient(circle at 22% 35%, #e67e2222, transparent 42%),
      radial-gradient(circle at 78% 65%, #3b9eff1e, transparent 42%),
      #071018;
  }

  .phase-widget svg {
    width: 100%;
    height: 100%;
    display: block;
    overflow: visible;
  }

  .phase-baseline {
    stroke: #2b3c4c;
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .phase-inhale {
    stroke: #c0d0e055;
    stroke-width: 1;
    stroke-dasharray: 2 2;
    vector-effect: non-scaling-stroke;
  }

  .phase-curve {
    fill: none;
    stroke: var(--cc);
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
    filter: drop-shadow(0 0 3px #e67e2266);
  }

  .phase-ball {
    fill: #f4b36d;
    stroke: #fff;
    stroke-width: 0.6;
    vector-effect: non-scaling-stroke;
    filter: drop-shadow(0 0 4px #e67e22);
  }

  .duration-widget {
    position: relative;
    border: 1px solid #203245;
    border-radius: 6px;
    overflow: hidden;
    padding: 6px 6px 5px;
    background: #050b12;
    flex-shrink: 0;
  }

  .duration-widget svg {
    width: 100%;
    height: 14px;
    display: block;
    overflow: visible;
  }

  .dur-track {
    stroke: #2b3c4c;
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .dur-end-cap {
    fill: #1c2a38;
    stroke: var(--cc);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .dur-marker {
    fill: #f4b36d;
    stroke: #fff;
    stroke-width: 0.6;
    vector-effect: non-scaling-stroke;
    filter: drop-shadow(0 0 4px #e67e22);
  }

  .dur-labels {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-top: 4px;
    font-size: 10px;
    color: color-mix(in srgb, var(--txt) 42%, var(--mut));
    font-variant-numeric: tabular-nums;
  }

  .dur-label-c {
    color: var(--cc);
    font-weight: 700;
  }

  .symmetry-widget {
    position: relative;
    height: 58px;
    border: 1px solid #2a1b3a;
    border-radius: 6px;
    overflow: hidden;
    flex-shrink: 0;
    background:
      radial-gradient(circle at 50% 50%, #8e44ad22, transparent 60%),
      linear-gradient(90deg, #0a0612, #100b18);
  }

  .symmetry-widget svg {
    width: 100%;
    height: 100%;
    display: block;
    overflow: visible;
  }

  .sym-baseline {
    stroke: #2b1f3c;
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .sym-cell {
    fill: #8e44ad55;
    stroke: #8e44ad88;
    stroke-width: 0.6;
    vector-effect: non-scaling-stroke;
    transition: fill 0.12s, stroke 0.12s;
  }

  .sym-cell-active {
    fill: #c28ce0;
    stroke: #fff;
    filter: drop-shadow(0 0 4px #c28ce0);
  }

  .sym-cell-num {
    font-size: 8px;
    font-weight: 600;
    fill: var(--mut);
    font-family: inherit;
    font-variant-numeric: tabular-nums;
  }

  .sym-cell-num-active { fill: #fff; }

  .sym-progress-track {
    stroke: #1b1224;
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .sym-progress {
    stroke: #c28ce0;
    stroke-width: 1.5;
    vector-effect: non-scaling-stroke;
    filter: drop-shadow(0 0 2px #8e44adaa);
  }

  .audio-scope {
    position: relative;
    border: 1px solid #203245;
    border-radius: 6px;
    overflow: hidden;
    padding: 6px 8px 5px;
    flex-shrink: 0;
    background: linear-gradient(90deg, #07111c, #06131b);
  }

  .scope-shell {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .audio-scope svg {
    width: 100%;
    height: 52px;
    display: block;
    overflow: visible;
  }

  .a-binauralbeat .scope-row svg { height: 28px; }
  .a-binauralbeat .scope-row-sum svg { height: 34px; }

  .scope-row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .scope-row + .scope-row { margin-top: 5px; padding-top: 5px; border-top: 1px solid #11202e; }

  .scope-side {
    width: 14px;
    text-align: center;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: color-mix(in srgb, var(--txt) 38%, var(--mut));
    flex-shrink: 0;
  }
  .scope-side-l { color: #9fd0ff; }
  .scope-side-r { color: #c28ce0; }
  .scope-side-sum { color: var(--ac); }

  .row-win {
    flex-shrink: 0;
    font-size: 10px;
    color: color-mix(in srgb, var(--txt) 42%, var(--mut));
    font-variant-numeric: tabular-nums;
    line-height: 1.25;
    padding-left: 4px;
    min-width: 74px;
    text-align: right;
  }

  .scope-row svg { flex: 1; min-width: 0; }

  .scope-axis {
    stroke: #1b2738;
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .scope-trace {
    fill: none;
    stroke: var(--ac);
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
    filter: drop-shadow(0 0 3px #3b9eff66);
  }

  .scope-band {
    fill: #3b9eff33;
    stroke: var(--ac);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .scope-envelope {
    fill: #3b9eff1c;
    stroke: #3b9eff55;
    stroke-width: 1;
    stroke-dasharray: 2 2;
    vector-effect: non-scaling-stroke;
  }

  .scope-trace-l { stroke: #9fd0ff; filter: drop-shadow(0 0 3px #3b9eff66); }
  .scope-trace-r { stroke: #c28ce0; filter: drop-shadow(0 0 3px #8e44ad66); }
  .scope-band-l { fill: #9fd0ff33; stroke: #9fd0ff; }
  .scope-band-r { fill: #c28ce033; stroke: #c28ce0; }
  .scope-trace-sum { stroke: var(--ac); }

  /* Noise scope: tint the broadband trace by spectral colour. */
  .scope-trace-noise { stroke-width: 1; filter: none; }
  .a-noise[data-color='white'] .scope-trace-noise { stroke: #d7e1ec; }
  .a-noise[data-color='pink'] .scope-trace-noise { stroke: #e58fb0; filter: drop-shadow(0 0 2px #e58fb055); }
  .a-noise[data-color='brown'] .scope-trace-noise { stroke: #c79a5b; filter: drop-shadow(0 0 2px #c79a5b55); }

  .scope-trace-drone-2 { stroke: color-mix(in srgb, var(--ac) 55%, transparent); stroke-width: 1; filter: none; }
  .scope-trace-sample { stroke: #6fcf97; stroke-width: 1; filter: drop-shadow(0 0 2px #6fcf9755); }

  .pan-ruler {
    position: relative;
    height: 12px;
    margin: 0 10px;
  }

  .pan-track {
    position: absolute;
    left: 0; right: 0; top: 50%;
    height: 1px;
    background: linear-gradient(90deg, #1b2738, #2b3c4c 50%, #1b2738);
  }

  .pan-dot {
    position: absolute;
    top: 50%;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #9fd0ff;
    box-shadow: 0 0 4px #3b9effaa;
    transform: translate(-50%, -50%);
  }

  .pan-l, .pan-r {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-size: 10px;
    color: color-mix(in srgb, var(--txt) 38%, var(--mut));
    letter-spacing: 0.04em;
  }
  .pan-l { left: 0; }
  .pan-r { right: 0; }

  .scope-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 14px;
    margin-top: 2px;
    padding: 0 6px;
    font-size: 12px;
    line-height: 1.35;
    color: var(--txt);
    font-variant-numeric: tabular-nums;
  }
  .meta-pair { white-space: nowrap; }
  .meta-mut { color: var(--mut); }

  .win-field {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
    color: color-mix(in srgb, var(--txt) 42%, var(--mut));
    font-size: 11px;
    line-height: 1;
  }
  .win-field.win-field-floating {
    align-self: flex-end;
    margin-left: 0;
    background: transparent;
  }
  .win-field input {
    width: 50px;
    background: var(--bg);
    border: 1px solid var(--bdr);
    color: var(--txt);
    border-radius: 4px;
    padding: 0 6px;
    font-size: 11px;
    font-family: inherit;
    height: 28px;
    min-height: 0;
    margin: 0;
    box-shadow: none;
  }
  .win-field.win-field-floating input {
    width: 46px;
    height: 24px;
  }

  .voice-extras {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 16px;
    padding: 0 6px;
    font-size: 11px;
    color: color-mix(in srgb, var(--txt) 42%, var(--mut));
  }

  .spatial-blend-note {
    margin: 0;
    padding: 0 6px;
    color: color-mix(in srgb, var(--txt) 42%, var(--mut));
    font-size: 10px;
    line-height: 1.35;
  }

  .voice-select {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .voice-select select {
    background: var(--bg);
    border: 1px solid var(--bdr);
    color: var(--txt);
    border-radius: 4px;
    padding: 0 8px;
    font-size: 11px;
    font-family: inherit;
    height: 30px;
  }

  .trem-panel {
    margin: 6px 6px 0;
    padding: 8px;
    border: 1px dashed var(--bdr);
    border-radius: 6px;
  }
  .trem-panel.on { border-style: solid; border-color: color-mix(in srgb, var(--ac) 50%, var(--bdr)); }
  .trem-panel > .trem-head { font-size: 11px; }

  .trem-head {
    display: flex;
    align-items: center;
    gap: 10px 14px;
    flex-wrap: wrap;
  }

  .trem-toggle {
    margin: 0;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    background: var(--bg);
    border: 1px solid var(--bdr);
    color: var(--mut);
    border-radius: 4px;
    cursor: pointer;
    width: auto;
  }
  .trem-toggle.on { background: var(--acc-s); border-color: var(--ac); color: var(--ac); }

  .trem-knobs {
    display: flex;
    gap: 18px;
    margin-top: 8px;
    padding-left: 2px;
  }

  .visual-preview {
    background:
      radial-gradient(circle at 34% 42%, hsla(var(--visual-hue, 200), 88%, 58%, 0.34), transparent 46%),
      radial-gradient(circle at 74% 62%, #16a08533, transparent 38%),
      #090c13;
  }

  .visual-aura {
    position: absolute;
    inset: 5px 14px;
    border-radius: 50%;
    background: radial-gradient(circle, hsla(var(--visual-hue, 200), 90%, 56%, 0.52), transparent 68%);
    opacity: var(--visual-opacity, 1);
    animation: visualDrift 7s ease-in-out infinite;
  }

  .visual-shape {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 62px;
    height: 38px;
    transform: translate(-50%, -50%) scale(var(--visual-scale, 1));
    animation: visualSpin var(--visual-spin, 10s) linear infinite;
    animation-direction: var(--visual-dir, normal);
  }

  .visual-shape polygon {
    fill: hsla(var(--visual-hue, 200), 88%, 58%, 0.28);
    stroke: hsla(var(--visual-hue, 200), 95%, 70%, 0.9);
    stroke-width: 1.8;
    vector-effect: non-scaling-stroke;
  }

  .visual-particle {
    position: absolute;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #d9fff6;
    box-shadow: 0 0 8px hsla(var(--visual-hue, 200), 90%, 64%, 0.8);
    animation: particleFloat 3.8s ease-in-out infinite;
  }

  .visual-particle-a { left: 18%; top: 26%; }
  .visual-particle-b { left: 74%; top: 34%; animation-delay: -1.2s; }
  .visual-particle-c { left: 58%; top: 70%; animation-delay: -2.1s; }

  /* Blink / Oscillate previews are driven live by --visual-blink (0/1) and
     --visual-osc (0..1), updated each frame by the rAF loop. */
  .blink-dot {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, hsla(var(--visual-hue, 200), 95%, 66%, 1), hsla(var(--visual-hue, 200), 90%, 50%, 0.18) 70%);
    box-shadow: 0 0 18px hsla(var(--visual-hue, 200), 95%, 60%, 0.85);
    opacity: calc(var(--visual-opacity, 1) * var(--visual-blink, 1));
    transition: opacity 0.02s linear;
  }

  .osc-dot {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: radial-gradient(circle, hsla(var(--visual-hue, 200), 95%, 64%, 0.95), hsla(var(--visual-hue, 200), 90%, 48%, 0.14) 70%);
    box-shadow: 0 0 16px hsla(var(--visual-hue, 200), 95%, 60%, 0.7);
    transform: translate(-50%, -50%) scale(calc(0.55 + var(--visual-osc, 0) * var(--visual-scale, 1) * 0.6));
    opacity: calc(var(--visual-opacity, 1) * (0.45 + 0.55 * var(--visual-osc, 0)));
  }

  /* Pacer: breathing guide — orb + ring expand on inhale (high --visual-osc). */
  .pacer-core, .pacer-ring {
    position: absolute;
    left: 50%;
    top: 50%;
    border-radius: 50%;
    transform: translate(-50%, -50%) scale(calc(0.4 + var(--visual-osc, 0) * var(--visual-scale, 1.5) * 0.5));
  }
  .pacer-core {
    width: 26px;
    height: 26px;
    background: radial-gradient(circle, hsla(var(--visual-hue, 200), 95%, 66%, 0.95), hsla(var(--visual-hue, 200), 90%, 50%, 0.1) 72%);
    box-shadow: 0 0 18px hsla(var(--visual-hue, 200), 95%, 60%, 0.7);
    opacity: var(--visual-opacity, 1);
  }
  .pacer-ring {
    width: 40px;
    height: 40px;
    border: 2px solid hsla(var(--visual-hue, 200), 95%, 70%, 0.8);
    opacity: calc(var(--visual-opacity, 1) * (0.3 + 0.5 * var(--visual-osc, 0)));
  }

  /* Ripple: concentric rings expanding outward at the oscRate cadence. */
  .ripple-ring {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 56px;
    height: 56px;
    margin: -28px 0 0 -28px;
    border-radius: 50%;
    border: 2px solid hsla(var(--visual-hue, 200), 95%, 66%, 0.9);
    opacity: 0;
    animation: rippleExpand var(--visual-ripple-period, 1.6s) linear infinite;
  }
  .ripple-ring:nth-child(2) { animation-delay: calc(var(--visual-ripple-period, 1.6s) * -0.33); }
  .ripple-ring:nth-child(3) { animation-delay: calc(var(--visual-ripple-period, 1.6s) * -0.66); }
  @keyframes rippleExpand {
    0%   { transform: scale(0.15); opacity: calc(var(--visual-opacity, 1) * 0.85); }
    100% { transform: scale(1); opacity: 0; }
  }

  /* Spiral: rotating radial sweep. */
  .spiral-disc {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    transform: translate(-50%, -50%) scale(var(--visual-scale, 1));
    opacity: var(--visual-opacity, 1);
    background: repeating-conic-gradient(
      from 0deg,
      hsla(var(--visual-hue, 200), 95%, 64%, 0.95) 0deg 18deg,
      transparent 18deg 36deg);
    -webkit-mask: radial-gradient(circle, #000 62%, transparent 64%);
    mask: radial-gradient(circle, #000 62%, transparent 64%);
    animation: visualSpin var(--visual-spin, 10s) linear infinite;
    animation-direction: var(--visual-dir, normal);
  }

  /* Mandala: two overlaid symmetric polygons, counter-rotating. */
  .mandala-shape {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 64px;
    height: 40px;
    transform: translate(-50%, -50%) scale(var(--visual-scale, 1));
    opacity: var(--visual-opacity, 1);
    animation: visualSpin var(--visual-spin, 10s) linear infinite;
    animation-direction: var(--visual-dir, normal);
  }
  .mandala-shape polygon {
    fill: hsla(var(--visual-hue, 200), 88%, 58%, 0.22);
    stroke: hsla(var(--visual-hue, 200), 95%, 70%, 0.9);
    stroke-width: 1.5;
    vector-effect: non-scaling-stroke;
    transform-box: fill-box;
    transform-origin: center;
  }
  .mandala-shape-2 { transform: rotate(30deg); opacity: 0.7; }

  /* ── Resizable visual mix window / optional fullscreen stage ───────────── */
  .mix-btn { margin-left: auto; }
  .mix-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .mix-dialog {
    width: min(52rem, calc(100vw - 3rem));
    height: min(32rem, calc(100vh - 3rem));
    min-width: min(22rem, calc(100vw - 1rem));
    min-height: min(16rem, calc(100vh - 1rem));
    max-width: calc(100vw - 1.5rem);
    max-height: calc(100vh - 1.5rem);
    box-sizing: border-box;
    margin: auto;
    padding: 0;
    overflow: hidden;
    resize: both;
    color: #fff;
    background: #04060a;
    border: 1px solid #ffffff40;
    border-radius: 10px;
    box-shadow: 0 24px 80px #000c;
  }

  .mix-dialog::backdrop {
    background: #000a;
    backdrop-filter: blur(3px);
  }

  .visual-stage {
    position: relative;
    width: 100%;
    height: 100%;
    background: #04060a;
    overflow: hidden;
  }
  .visual-stage:fullscreen {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
  }

  .stage-layer {
    position: absolute;
    inset: 0;
  }

  /* Scale the small centered preview elements up to fill the stage. */
  .stage-scale {
    position: absolute;
    inset: 0;
    transform: scale(7);
    transform-origin: center;
  }

  .stage-empty {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: var(--mut);
    font-size: 1rem;
  }

  .stage-actions {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .stage-resize-hint {
    padding: 6px 8px;
    color: #ffffffb8;
    font-size: 11px;
    background: #0008;
    border-radius: 5px;
    backdrop-filter: blur(4px);
  }

  .stage-action {
    margin: 0;
    padding: 8px 14px;
    width: auto;
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    background: #ffffff1c;
    border: 1px solid #ffffff40;
    border-radius: 6px;
    cursor: pointer;
    backdrop-filter: blur(4px);
  }
  .stage-action:hover { background: #ffffff30; }
  .stage-action:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

  .visual-stage:fullscreen .stage-resize-hint { display: none; }

  .haptic-preview {
    background:
      radial-gradient(circle at 50% 50%, #16a08533, transparent 42%),
      repeating-linear-gradient(90deg, #0b1716 0 8px, #071211 8px 16px);
  }

  .haptic-core {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #16a085;
    opacity: var(--haptic-alpha, 0.55);
    box-shadow: 0 0 12px #16a08599;
    transform: translate(-50%, -50%);
    animation: hapticCore var(--haptic-pulse, 0.14s) ease-in-out infinite;
  }

  .haptic-wave {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 16px;
    height: 16px;
    border: 1px solid #16a085cc;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    animation: hapticRipple var(--haptic-ripple, 0.56s) ease-out infinite;
  }

  .haptic-wave-b { animation-delay: var(--haptic-delay, -0.28s); }

  .haptic-scan {
    position: absolute;
    top: 0;
    bottom: 0;
    left: -18px;
    width: 18px;
    background: linear-gradient(90deg, transparent, #16a08566, transparent);
    animation: hapticScan var(--haptic-scan-duration, 1.12s) linear infinite;
  }

  /* ── Knob grid ─────────────────────────────────────────────────────────────── */
  .knob-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 14px 18px;
    align-items: start;
  }

  .param-row {
    min-width: 0;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    flex: 0 0 auto;
    width: auto;
    padding: 3px 0 4px;
    border: 1px solid transparent;
    border-radius: 6px;
  }

  .param-row.has-mod:not(.mod-open) {
    background: color-mix(in srgb, var(--acc-s) 38%, transparent);
  }

  .param-main {
    flex: 0 0 58px;
    display: flex;
    justify-content: center;
    min-width: 0;
  }

  .param-row.mod-open {
    flex: 1 0 100%;
    width: 100%;
    justify-content: flex-start;
    gap: 12px;
    padding: 10px;
    background: color-mix(in srgb, var(--acc-s) 74%, transparent);
    border-color: var(--acc);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--acc) 24%, transparent);
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .tempo-sync-control {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    min-width: 138px;
    padding-left: 12px;
    border-left: 1px solid color-mix(in srgb, var(--acc) 22%, var(--bdr));
    color: color-mix(in srgb, var(--txt) 46%, var(--mut));
    font-size: 10px;
    line-height: 1.2;
  }

  .tempo-sync-control select,
  .tempo-sync-control input {
    height: 24px;
    min-height: 0;
    margin: 0;
    border: 1px solid var(--bdr);
    border-radius: 4px;
    background: var(--bg);
    color: var(--txt);
    font-size: 10px;
    font-family: inherit;
    padding: 0 6px;
  }

  .tempo-sync-control input {
    width: 56px;
  }

  .tempo-sync-control span {
    min-width: 54px;
    color: var(--mut);
    font-variant-numeric: tabular-nums;
  }

  .tempo-sync-control.tempo-sync-on {
    color: var(--acc);
  }

  .tempo-sync-control.tempo-sync-on span {
    color: var(--acc);
  }

  .param-mods {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    min-width: 0;
    flex: 1;
    padding-left: 12px;
    border-left: 1px solid color-mix(in srgb, var(--acc) 35%, var(--bdr));
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .mod-control-cell {
    position: relative;
    flex: 0 0 58px;
    display: grid;
    justify-items: center;
    padding-bottom: 15px;
    border-radius: 6px;
  }

  .mod-control-cell.linked {
    background: color-mix(in srgb, var(--acc-s) 58%, transparent);
  }

  .mod-control-cell.mod-disabled {
    opacity: 0.45;
  }

  .mod-enable {
    position: absolute;
    left: 50%;
    top: 37px; /* knob-label (14px + 1px margin) + half of knob-svg-wrap (22px) */
    transform: translate(-50%, -50%);
    display: grid;
    place-items: center;
    cursor: pointer;
    z-index: 1;
  }

  .mod-enable input[type='checkbox'] {
    margin: 0;
    width: 14px;
    height: 14px;
    cursor: pointer;
    accent-color: var(--acc);
  }

  .mod-empty {
    align-self: center;
    color: color-mix(in srgb, var(--txt) 42%, var(--mut));
    font-size: 10px;
    line-height: 1.4;
    white-space: nowrap;
  }

  .mod-clear {
    position: absolute;
    right: 3px;
    bottom: 0;
    width: 13px;
    height: 13px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--mut);
    font-size: 10px;
    line-height: 1;
    font-family: inherit;
    cursor: pointer;
    display: grid;
    place-items: center;
  }

  .mod-clear:hover {
    color: var(--err);
  }

  /* ── Mute button ───────────────────────────────────────────────────────────── */
  .mute-btn {
    background: transparent;
    border: 1px solid var(--bdr);
    color: var(--mut);
    border-radius: 4px;
    height: 24px;
    margin: 0;
    padding: 0 8px;
    font-size: 10px;
    font-weight: 700;
    font-family: inherit;
    text-transform: lowercase;
    letter-spacing: 0.04em;
    cursor: pointer;
    line-height: 1;
    display: grid;
    place-items: center;
    transition: color .1s, border-color .1s, background .1s;
  }
  .mute-btn:hover { color: var(--txt); border-color: var(--ac); }
  .mute-btn.on {
    color: var(--err);
    border-color: var(--err);
    background: #2a0805;
  }

  .card.muted .card-name { color: var(--mut); text-decoration: line-through; }
  .card.muted .audio-scope { opacity: 0.35; }
  .card.muted .pan-ruler { opacity: 0.5; }

  /* ── Buttons ───────────────────────────────────────────────────────────────── */
  .x-btn {
    background: transparent;
    border: none;
    color: var(--mut);
    cursor: pointer;
    font-size: 13px;
    font-weight: 700;
    width: 20px;
    margin: 0;
    padding: 0;
    border-radius: 4px;
    flex-shrink: 0;
    height: 20px;
    display: grid;
    place-items: center;
    line-height: 1;
    transition: color .1s;
  }
  .x-btn:hover { color: var(--err); }
  .x-btn.tiny { font-size: 8px; }

  /* ── Issues footer ─────────────────────────────────────────────────────────── */
  .issues {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    padding: 3px 10px;
    background: var(--sur);
    border-top: 1px solid var(--bdr);
    flex-shrink: 0;
  }
  .iss {
    font-size: 8px;
    padding: 1px 5px;
    border-radius: 3px;
  }
  .iss.error   { background: #2a0805; color: var(--err); }
  .iss.warning { background: #2a1a05; color: var(--warn); }

  @keyframes tempoSweep {
    from { transform: translateX(0); }
    to { transform: translateX(72px); }
  }

  @keyframes tempoBeat {
    0%, 100% { transform: scale(0.72); opacity: 0.5; }
    20% { transform: scale(1.35); opacity: 1; }
    48% { transform: scale(0.95); opacity: 0.75; }
  }

  @keyframes visualDrift {
    0%, 100% { transform: translate(-8%, 0) scale(0.9); }
    50% { transform: translate(8%, 0) scale(1.08); }
  }

  @keyframes visualSpin {
    to { transform: translate(-50%, -50%) scale(var(--visual-scale, 1)) rotate(360deg); }
  }

  @keyframes particleFloat {
    0%, 100% { transform: translateY(0) scale(0.8); opacity: 0.38; }
    50% { transform: translateY(-8px) scale(1.15); opacity: 0.95; }
  }

  @keyframes hapticCore {
    0%, 100% { transform: translate(-50%, -50%) scale(0.76); }
    50% { transform: translate(-50%, -50%) scale(var(--haptic-scale, 1.18)); }
  }

  @keyframes hapticRipple {
    from {
      transform: translate(-50%, -50%) scale(0.75);
      opacity: var(--haptic-alpha, 0.55);
    }
    to {
      transform: translate(-50%, -50%) scale(2.8);
      opacity: 0;
    }
  }

  @keyframes hapticScan {
    to { transform: translateX(150px); }
  }

  @media (max-width: 1480px) {
    /* Two lanes per row; drop the content-aware weighting when stacked. */
    .cols {
      flex-wrap: wrap;
    }
    .col,
    .col.is-empty {
      flex: 1 1 calc(50% - 6px);
      min-width: 0;
      min-height: 20rem;
    }
  }

  @media (max-width: 860px) {
    .col,
    .col.is-empty {
      flex: 1 1 100%;
      min-height: 22rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .tempo-sweep,
    .tempo-dot,
    .visual-aura,
    .visual-shape,
    .visual-particle,
    .haptic-core,
    .haptic-wave,
    .haptic-scan {
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
    }
  }

  /* ── Scrollbar ─────────────────────────────────────────────────────────────── */
  .col::-webkit-scrollbar { width: 3px; }
  .col::-webkit-scrollbar-track { background: transparent; }
  .col::-webkit-scrollbar-thumb { background: var(--bdr); border-radius: 2px; }
</style>
