<script>
  import { onDestroy, onMount } from 'svelte'
  import Knob from './Knob.svelte'
  import { VanillaWebAudioEngine, envelopeValueAt } from '../../engines/audio/VanillaWebAudioEngine.js'
  import {
    computeMartigliState,
    computeMartigliStateFree,
    computeSymmetryState,
    martigliPathD,
  } from './controlSignals.js'
  import {
    AUDIO_PARAM_RANGE,
    AUDIO_PARAMS,
    AUDIO_TRACK_TYPES,
    BINAURAL_MODES,
    CONTROL_TYPES,
    HAPTIC_PARAM_RANGE,
    HAPTIC_PARAMS,
    HAPTIC_TRACK_TYPES,
    ISO_ENVELOPES,
    ISO_ENVELOPE_DEFAULTS,
    MARTIGLI_PARAM_RANGE,
    MARTIGLI_PARAMS,
    MARTIGLI_WAVEFORMS,
    SYMMETRY_PARAM_RANGE,
    SYMMETRY_PARAMS,
    VISUAL_PARAM_RANGE,
    VISUAL_PARAMS,
    VISUAL_TRACK_TYPES,
    buildPatchExport,
    createAudioTrack,
    createControlTrack,
    createDraft,
    createHapticTrack,
    createMod,
    createVisualTrack,
    patchSummary,
    validateDraft,
    voiceParamNames,
  } from './presetDraft.js'

  let draft = $state(createDraft())
  let statusMsg = $state('')
  let expandedMod = $state(null) // "trackId:paramName"
  let helpOpen = $state(false)

  let engine = null
  const voiceHandles = new Map()

  // Modulated parameter values per track, updated each animation frame while playing.
  // Previews read these via getLive(); base track.params[name].value stays the knob source.
  let liveValues = $state({})
  // Live per-control widget state ({ phase, value, currentPeriod, progress, ... }).
  // Updated every frame whether or not playing, so the control previews stay alive.
  let controlStates = $state({})
  let sessionStartTime = null
  let rafId = null

  const summary = $derived(patchSummary(draft))
  const issues = $derived(validateDraft(draft))
  const hasErrors = $derived(issues.some(i => i.level === 'error'))
  const jsonExport = $derived(JSON.stringify(buildPatchExport(draft), null, 2))

  const STUDIO_HELP = [
    ['Add', 'Use the column + buttons to add control, audio, visual, and haptic tracks.'],
    ['Tune', 'Adjust each card directly; linked modulation appears under the M controls.'],
    ['Export', 'Copy or save the patch JSON from the header.'],
  ]

  // ── Controls ──────────────────────────────────────────────────────────────────

  function addControl(type) { draft.controlTracks.push(createControlTrack(type)) }

  function removeControl(id) {
    draft.controlTracks = draft.controlTracks.filter(t => t.id !== id)
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
  function removeHaptic(id) { draft.hapticTracks = draft.hapticTracks.filter(t => t.id !== id); tip('Removed.') }

  // ── Mod slots ─────────────────────────────────────────────────────────────────

  function modKey(trackId, paramName) {
    return `${trackId}:${paramName}`
  }

  function toggleModKey(rowKey) {
    expandedMod = expandedMod === rowKey ? null : rowKey
  }

  function modForControl(param, controlId) {
    return param.mods.find(m => m.controlId === controlId)
  }

  function modAmountRange(paramMin, paramMax, paramStep) {
    const span = Math.max(0.01, Math.abs(num(paramMax) - num(paramMin)))
    const stepValue = Math.max(0.0001, Math.abs(num(paramStep, span / 100)))
    return [-span, span, stepValue]
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

  async function togglePlay() {
    if (draft.playing) {
      stopAllVoices()
      draft.playing = false
      sessionStartTime = null
      liveValues = {}
      tip('Stopped.')
      return
    }
    try {
      if (!engine) {
        engine = new VanillaWebAudioEngine()
        await engine.initialize()
      }
      await engine.resume()
    } catch (e) {
      tip(`Audio unavailable: ${e.message ?? e}`)
      return
    }
    draft.playing = true
    sessionStartTime = engine.getAudioContext().currentTime
    for (const track of draft.audioTracks) startVoiceFor(track)
    tip('Playing…')
  }

  function trackToVoiceSpec(track) {
    const p = track.params
    const gain = track.muted ? 0 : p.gain.value
    const spec = {
      type: track.trackType,
      volume: gain,
      params: { gain },
    }
    if (track.trackType === 'BinauralBeat') {
      spec.params.leftFreq = p.leftFreq.value
      spec.params.rightFreq = p.rightFreq.value
    } else {
      spec.params.pan = p.pan?.value ?? 0
      spec.params.frequency = p.frequency?.value ?? 200
      spec.params.pulseRate = p.pulseRate?.value ?? 10
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

  // ── rAF loop ─────────────────────────────────────────────────────────────────
  // Runs while the component is mounted. Each frame: evaluate every control
  // (updating controlStates so previews stay alive), then — only while playing —
  // apply base + Σ(amount·controlValue) to every sensory param.

  function getLive(track, paramName) {
    return liveValues[track.id]?.[paramName] ?? track.params[paramName]?.value
  }

  function clampRange(value, ranges, name) {
    const r = ranges?.[name]
    if (!r) return value
    return Math.min(r[1], Math.max(r[0], value))
  }

  function applyMods(track, controlValues, ranges, writeAudio, paramNames) {
    if (!liveValues[track.id]) liveValues[track.id] = {}
    const base = liveValues[track.id]
    for (const name of paramNames) {
      const param = track.params[name]
      if (!param) continue
      let v = param.value
      for (const mod of param.mods) {
        if (mod.enabled === false) continue
        const cv = controlValues.get(mod.controlId)
        if (cv == null) continue
        v += (Number(mod.amount) || 0) * cv
      }
      v = clampRange(v, ranges, name)
      if (track.muted && name === 'gain') v = 0
      base[name] = v
      if (writeAudio) writeAudio(name, v)
    }
  }

  function rafTick() {
    const ctx = engine?.getAudioContext()
    const tNow = ctx ? ctx.currentTime : performance.now() / 1000
    const playing = draft.playing
    const sessionLength = Math.max(0.001, num(draft.lengthSec, 900))
    const sessionElapsed = (playing && sessionStartTime != null)
      ? Math.max(0, Math.min(sessionLength, tNow - sessionStartTime))
      : null

    const controlValues = new Map()
    for (const c of draft.controlTracks) {
      let st
      if (c.type === 'Martigli') {
        st = (sessionElapsed != null)
          ? computeMartigliState(c, sessionElapsed, sessionLength)
          : computeMartigliStateFree(c, tNow)
      } else if (c.type === 'Symmetry') {
        const ts = sessionElapsed != null ? sessionElapsed : tNow
        st = computeSymmetryState(c, ts)
      } else {
        st = { value: 0 }
      }
      controlStates[c.id] = st
      controlValues.set(c.id, st.value)
    }

    if (playing) {
      for (const track of draft.audioTracks) {
        const handle = voiceHandles.get(track.id)
        const write = handle && engine
          ? (name, v) => engine.setVoiceParameter(handle, name, v, tNow, 'step')
          : null
        applyMods(track, controlValues, AUDIO_PARAM_RANGE, write, voiceParamNames(track.trackType))
      }
      for (const track of draft.visualTracks) applyMods(track, controlValues, VISUAL_PARAM_RANGE, null, VISUAL_PARAMS)
      for (const track of draft.hapticTracks) applyMods(track, controlValues, HAPTIC_PARAM_RANGE, null, HAPTIC_PARAMS)
    }

    rafId = requestAnimationFrame(rafTick)
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

    if (event.key === 'Escape' && helpOpen) {
      event.preventDefault()
      helpOpen = false
      return
    }

    if (event.key === '?' || event.key === 'h' || event.key === 'H') {
      if (isTypingTarget(document.activeElement)) return
      event.preventDefault()
      helpOpen = !helpOpen
    }
  }

  onMount(() => {
    rafId = requestAnimationFrame(rafTick)
    window.addEventListener('keydown', handleWindowKeydown)
    return () => window.removeEventListener('keydown', handleWindowKeydown)
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
    if (rafId != null) cancelAnimationFrame(rafId)
    rafId = null
    if (engine) {
      try { await engine.dispose() } catch (_) {}
      engine = null
      voiceHandles.clear()
    }
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

  function reset() { draft = createDraft(); expandedMod = null; tip('Reset.') }

  function slug(v) {
    return `${v ?? 'patch'}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'patch'
  }

  function tip(msg) { statusMsg = msg }

  function num(value, fallback = 0) {
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value))
  }

  function tempoStyle(bpm) {
    const beat = 60 / Math.max(1, num(bpm, 60))
    return `--beat-duration:${clamp(beat, 0.12, 6).toFixed(3)}s;--bar-duration:${clamp(beat * 4, 0.48, 24).toFixed(3)}s;`
  }

  // Above this many visible cycles, the wave is too dense for SVG to convey —
  // fall back to a constant-amplitude band. Below it we use adaptive sampling
  // (≥ 6 samples per cycle, capped) so a dense-but-still-resolved wave reads
  // as a wave, not a bar.
  const SCOPE_BAND_THRESHOLD = 600

  function adaptiveSamples(cycles, perCycle = 6, base = 200, max = 1500) {
    return Math.max(base, Math.min(max, Math.ceil(Math.abs(cycles) * perCycle)))
  }

  // Time-base for the L/R rows of a binaural scope: exactly ONE beat period
  // (1/|beat|). This way the wave count visibly differs between channels —
  // L draws floor(L/|beat|) cycles per beat, R draws floor(R/|beat|) cycles —
  // and changing leftFreq / rightFreq / beat actually moves things. Capped at
  // the user's screen so very small beats don't make the row way too long.
  function binauralRowWindow(beatHz, userWinSec) {
    const absBeat = Math.abs(beatHz)
    if (!Number.isFinite(absBeat) || absBeat < 0.01) return userWinSec
    return Math.min(userWinSec, 1 / absBeat)
  }

  function fmtWin(s) {
    if (!Number.isFinite(s) || s <= 0) return '—'
    if (s >= 1) return `${s.toFixed(2)}s`
    if (s >= 0.01) return `${(s * 1000).toFixed(0)}ms`
    return `${(s * 1000).toFixed(1)}ms`
  }

  // Build the effective envelope spec from a track's user-set fields. The only
  // auto-adjust we keep is a per-phase minimum (~0.5 ms absolute time) on
  // attack/release/decay so they never produce clicks at high pulseRate. We do
  // NOT clamp noteDurationFrac or override envelope type — the user's setting
  // is final. Reads track.params.pulseRate.value (knob base, not the modulated
  // live value) so the envelope shape stays stable under modulation.
  function isoEnvSpec(track) {
    const pulseRate = clamp(num(track.params?.pulseRate?.value, 10), 0.5, 50)
    const type = track.envelope ?? 'AR'
    const def = ISO_ENVELOPE_DEFAULTS[type] ?? ISO_ENVELOPE_DEFAULTS.AR
    const noteDurationFrac = clamp(num(track.noteDurationFrac, 0.5), 0.01, 1)
    let attackFrac = num(track.attackFrac, def.attackFrac)
    let decayFrac = num(track.decayFrac, def.decayFrac)
    let releaseFrac = num(track.releaseFrac, def.releaseFrac)
    const sustainLevel = clamp(num(track.sustainLevel, def.sustainLevel), 0, 1)

    const noteSec = noteDurationFrac / pulseRate
    if (noteSec > 0) {
      const minPhaseFrac = Math.min(0.4, 0.0005 / noteSec)
      if (attackFrac > 0) attackFrac = Math.max(attackFrac, minPhaseFrac)
      if (releaseFrac > 0) releaseFrac = Math.max(releaseFrac, minPhaseFrac)
      if (decayFrac > 0) decayFrac = Math.max(decayFrac, minPhaseFrac)
    }
    return { type, attackFrac, decayFrac, sustainLevel, releaseFrac, noteDurationFrac }
  }

  function rectanglePath(xMin, xMax, yMid, yAmp) {
    const top = (yMid - yAmp).toFixed(1)
    const bot = (yMid + yAmp).toFixed(1)
    return `M${xMin} ${top} L${xMax} ${top} L${xMax} ${bot} L${xMin} ${bot} Z`
  }

  function sineWavePath(xMin, xMax, yMid, yAmp, cycles, samples) {
    const s = samples ?? adaptiveSamples(cycles)
    const span = xMax - xMin
    let d = ''
    for (let i = 0; i <= s; i += 1) {
      const u = i / s
      const x = xMin + span * u
      const y = yMid - yAmp * Math.sin(2 * Math.PI * cycles * u)
      d += (i === 0 ? 'M' : ' L') + x.toFixed(1) + ' ' + y.toFixed(1)
    }
    return d
  }

  function isoEnvelopeOutlinePath(xMin, xMax, yMid, yAmp, envSpec, envCycles, samples = 320) {
    const span = xMax - xMin
    let top = ''
    let bot = ''
    for (let i = 0; i <= samples; i += 1) {
      const u = i / samples
      const slotPhase = ((envCycles * u) % 1 + 1) % 1
      const env = envelopeValueAt(envSpec, slotPhase)
      const x = xMin + span * u
      top += (i === 0 ? 'M' : ' L') + x.toFixed(1) + ' ' + (yMid - yAmp * env).toFixed(1)
      bot = ' L' + x.toFixed(1) + ' ' + (yMid + yAmp * env).toFixed(1) + bot
    }
    return top + bot + ' Z'
  }

  function isoWavePath(xMin, xMax, yMid, yAmp, carrierCycles, envSpec, envCycles, samples) {
    const s = samples ?? adaptiveSamples(carrierCycles)
    const span = xMax - xMin
    let d = ''
    for (let i = 0; i <= s; i += 1) {
      const u = i / s
      const slotPhase = ((envCycles * u) % 1 + 1) % 1
      const env = envelopeValueAt(envSpec, slotPhase)
      const v = env * Math.sin(2 * Math.PI * carrierCycles * u)
      const x = xMin + span * u
      const y = yMid - yAmp * v
      d += (i === 0 ? 'M' : ' L') + x.toFixed(1) + ' ' + y.toFixed(1)
    }
    return d
  }

  function binauralSumPath(xMin, xMax, yMid, yAmp, leftCycles, rightCycles, samples) {
    const s = samples ?? adaptiveSamples(Math.max(Math.abs(leftCycles), Math.abs(rightCycles)))
    const span = xMax - xMin
    let d = ''
    for (let i = 0; i <= s; i += 1) {
      const u = i / s
      const v = 0.5 * (Math.sin(2 * Math.PI * leftCycles * u) + Math.sin(2 * Math.PI * rightCycles * u))
      const x = xMin + span * u
      const y = yMid - yAmp * v
      d += (i === 0 ? 'M' : ' L') + x.toFixed(1) + ' ' + y.toFixed(1)
    }
    return d
  }

  function binauralBeatEnvelopePath(xMin, xMax, yMid, yAmp, beatCycles, samples = 240) {
    const span = xMax - xMin
    let top = ''
    let bot = ''
    for (let i = 0; i <= samples; i += 1) {
      const u = i / samples
      const env = Math.abs(Math.cos(Math.PI * beatCycles * u))
      const x = xMin + span * u
      top += (i === 0 ? 'M' : ' L') + x.toFixed(1) + ' ' + (yMid - yAmp * env).toFixed(1)
      bot = ' L' + x.toFixed(1) + ' ' + (yMid + yAmp * env).toFixed(1) + bot
    }
    return top + bot + ' Z'
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
    ].join(';')
  }

  function hapticStyle(track) {
    const intensity = clamp(num(getLive(track, 'intensity'), 0.5), 0, 1)
    const freq = clamp(num(getLive(track, 'frequency'), 100), 20, 500)
    const pulse = clamp(14 / freq, 0.08, 0.7)
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

  function polygonPoints(rawSides) {
    const sides = Math.round(clamp(num(rawSides, 3), 3, 12))
    const points = []
    for (let i = 0; i < sides; i += 1) {
      const a = -Math.PI / 2 + (i / sides) * Math.PI * 2
      points.push(`${(40 + Math.cos(a) * 20).toFixed(1)},${(25 + Math.sin(a) * 18).toFixed(1)}`)
    }
    return points.join(' ')
  }
</script>

<div class="studio" class:playing={draft.playing}>

  {#snippet paramRow(param, pname, pmin, pmax, pstep, rowKey)}
    {@const isOpen = expandedMod === rowKey}
    {@const [mmin, mmax, mstep] = modAmountRange(pmin, pmax, pstep)}
    <div class="param-row" class:mod-open={isOpen} class:has-mod={param.mods.length > 0}>
      <div class="param-main">
        <Knob
          value={param.value}
          onchange={(v) => { param.value = v }}
          min={pmin}
          max={pmax}
          step={pstep}
          label={pname}
          modAvailable={true}
          modActive={param.mods.length > 0 || isOpen}
          onmod={() => toggleModKey(rowKey)}
        />
      </div>

      {#if isOpen}
        <div class="param-mods" aria-label={`${pname} modulation controls`}>
          {#each draft.controlTracks as ctrl (ctrl.id)}
            {@const mod = modForControl(param, ctrl.id)}
            <div class="mod-control-cell" class:linked={!!mod}>
              <Knob
                value={num(mod?.amount, 0)}
                onchange={(v) => setModAmount(param, ctrl.id, v)}
                min={mmin}
                max={mmax}
                step={mstep}
                label={ctrl.name}
              />
              {#if mod}
                <button
                  class="mod-clear"
                  type="button"
                  title="Remove modulation"
                  onclick={() => removeMod(param, mod.id)}
                >×</button>
              {/if}
            </div>
          {/each}
          {#if !draft.controlTracks.length}
            <span class="mod-empty">No control tracks</span>
          {/if}
        </div>
      {/if}
    </div>
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
      <div class="tempo-meter" style={tempoStyle(draft.bpm)} aria-hidden="true">
        <span class="tempo-sweep"></span>
        <span class="tempo-dot"></span>
        <span class="tempo-grid"></span>
      </div>
      <label class="mini-field">BPM<input type="number" min="1" step="1" bind:value={draft.bpm} /></label>
      <label class="mini-field">sec<input type="number" min="1" step="1" bind:value={draft.lengthSec} /></label>
    </div>

    <div class="hdr-actions">
      {#if issues.length > 0}
        <span class="badge {hasErrors ? 'b-err' : 'b-warn'}">{issues.length} {hasErrors ? 'err' : 'warn'}</span>
      {:else}
        <span class="badge b-ok">OK</span>
      {/if}
      <button class="act-btn" onclick={copyJson}>Copy</button>
      <button class="act-btn" onclick={download} disabled={hasErrors}>Save</button>
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
          <a href="/">Graph</a>
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
    <div class="col col-ctrl">
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
              <input class="card-name" bind:value={track.name} />
              <button class="x-btn" onclick={() => removeControl(track.id)}>✕</button>
            </div>
            <div class="card-body">
              {#if track.type === 'Martigli'}
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
                    <span class="dur-label-l">{fmtSec(track.periodSec)}</span>
                    <span class="dur-label-c">{fmtSec(currentP)}</span>
                    <span class="dur-label-r">{fmtSec(track.targetPeriodSec)}</span>
                  </div>
                </div>

                <div class="knob-grid">
                  {#each MARTIGLI_PARAMS as pname}
                    {@const [pmin, pmax, pstep] = MARTIGLI_PARAM_RANGE[pname]}
                    <div class="param-row">
                      <div class="param-main">
                        <Knob value={track[pname]} onchange={(v) => { track[pname] = v }}
                          min={pmin} max={pmax} step={pstep} label={pname} />
                      </div>
                    </div>
                  {/each}
                </div>
                <div class="card-meta">{Math.round(track.inhaleRatio * 100)}% inhale</div>
              {:else}
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
                    <div class="param-row">
                      <div class="param-main">
                        <Knob value={track[pname]} onchange={(v) => { track[pname] = v }}
                          min={pmin} max={pmax} step={pstep} label={pname} />
                      </div>
                    </div>
                  {/each}
                </div>
                <div class="card-meta">{track.family ?? 'plain-hunt'} · row {symRowIdx + 1}/{symTotalRows} · step {symStep + 1}/{symN}</div>
              {/if}
            </div>
          </article>
        {/each}
        {#if draft.controlTracks.length === 0}
          <p class="empty">Add a Martigli or Symmetry oscillator.</p>
        {/if}
      </div>
    </div>

    <!-- Sensory column macro — same structure for Audio / Visual / Haptic -->
    <!-- Audio -->
    <div class="col col-audio">
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
          {@const panX = (4 + 112 * (aPan + 1) / 2).toFixed(2)}
          {@const leftF = track.trackType === 'BinauralBeat' ? num(getLive(track, 'leftFreq'), 200) : aFreq - aPulse / 2}
          {@const rightF = track.trackType === 'BinauralBeat' ? num(getLive(track, 'rightFreq'), 210) : aFreq + aPulse / 2}
          {@const centerF = (leftF + rightF) / 2}
          {@const beatF = rightF - leftF}
          {@const isoEnv = track.trackType === 'IsochronicTone' ? isoEnvSpec(track) : null}
          <article class="card" class:muted={track.muted}>
            <div class="card-head">
              <input class="card-name" bind:value={track.name} />
              <button
                class="mute-btn"
                class:on={track.muted}
                onclick={() => { track.muted = !track.muted }}
                title={track.muted ? 'Unmute' : 'Mute'}
                type="button"
              >mute</button>
              <button class="x-btn" onclick={() => removeAudio(track.id)}>✕</button>
            </div>
            <div class="card-body">
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

              <div class="scope-meta">
                {#if track.trackType === 'BinauralBeat'}
                  <span class="meta-pair">L {Math.round(leftF)} / R {Math.round(rightF)} Hz</span>
                  <span class="meta-pair meta-mut">center {Math.round(centerF)} · beat {beatF >= 0 ? '+' : ''}{beatF.toFixed(1)} Hz</span>
                {:else if track.trackType === 'IsochronicTone'}
                  <span class="meta-pair">{Math.round(aFreq)} Hz · pulse {aPulse.toFixed(1)} Hz · {isoEnv.type}</span>
                {:else}
                  <span class="meta-pair">{Math.round(aFreq)} Hz</span>
                {/if}
                <label class="win-field">
                  <span>screen</span>
                  <input type="number" step="0.01" min="0.005" max="60" bind:value={track.windowSec} />
                  <span>s</span>
                </label>
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
                  <label class="voice-num">
                    <span>note%</span>
                    <input type="number" step="0.01" min="0.05" max="1" bind:value={track.noteDurationFrac} />
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

              <div class="knob-grid">
                {#if track.trackType === 'BinauralBeat' && track.binauralMode === 'center-beat'}
                  {@const lParam = track.params.leftFreq}
                  {@const rParam = track.params.rightFreq}
                  {@const gParam = track.params.gain}
                  {@const [gmin, gmax, gstep] = AUDIO_PARAM_RANGE.gain}
                  {@const [fmin, fmax, fstep] = AUDIO_PARAM_RANGE.leftFreq}
                  {@render paramRow(gParam, 'gain', gmin, gmax, gstep, modKey(track.id, 'gain'))}
                  <div class="param-row">
                    <div class="param-main">
                      <Knob value={(lParam.value + rParam.value) / 2}
                        onchange={(v) => {
                          const beat = rParam.value - lParam.value
                          lParam.value = clamp(v - beat / 2, fmin, fmax)
                          rParam.value = clamp(v + beat / 2, fmin, fmax)
                        }}
                        min={fmin} max={fmax} step={fstep} label="centerFreq" />
                    </div>
                  </div>
                  <div class="param-row">
                    <div class="param-main">
                      <Knob value={rParam.value - lParam.value}
                        onchange={(v) => {
                          const c = (lParam.value + rParam.value) / 2
                          lParam.value = clamp(c - v / 2, fmin, fmax)
                          rParam.value = clamp(c + v / 2, fmin, fmax)
                        }}
                        min={-50} max={50} step={0.5} label="beatFreq" />
                    </div>
                  </div>
                {:else}
                  {#each voiceParamNames(track.trackType) as pname}
                    {@const param = track.params[pname]}
                    {@const [pmin, pmax, pstep] = AUDIO_PARAM_RANGE[pname]}
                    {@render paramRow(param, pname, pmin, pmax, pstep, modKey(track.id, pname))}
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
    <div class="col col-visual">
      <div class="col-head">
        <span class="col-title">Visual</span>
        <div class="col-adds">
          {#each VISUAL_TRACK_TYPES as t}
            <button class="add-btn" onclick={() => addVisual(t)}>+{t}</button>
          {/each}
        </div>
      </div>
      <div class="col-body">
        {#each draft.visualTracks as track (track.id)}
          <article class="card">
            <div class="card-head">
              <input class="card-name" bind:value={track.name} />
              <button class="x-btn" onclick={() => removeVisual(track.id)}>✕</button>
            </div>
            <div class="card-body">
              <div class="track-preview visual-preview" style={visualStyle(track)} aria-hidden="true">
                <span class="visual-aura"></span>
                <svg class="visual-shape" viewBox="0 0 80 50">
                  <polygon points={polygonPoints(getLive(track, 'sides'))} />
                </svg>
                <span class="visual-particle visual-particle-a"></span>
                <span class="visual-particle visual-particle-b"></span>
                <span class="visual-particle visual-particle-c"></span>
              </div>
              <div class="knob-grid">
                {#each VISUAL_PARAMS as pname}
                  {@const param = track.params[pname]}
                  {@const [pmin, pmax, pstep] = VISUAL_PARAM_RANGE[pname]}
                  {@render paramRow(param, pname, pmin, pmax, pstep, modKey(track.id, pname))}
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
    <div class="col col-haptic">
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
              <input class="card-name" bind:value={track.name} />
              <button class="x-btn" onclick={() => removeHaptic(track.id)}>✕</button>
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
                  {@render paramRow(param, pname, pmin, pmax, pstep, modKey(track.id, pname))}
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

</div>

<style>
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
    height: 100vh;
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
    background: repeating-linear-gradient(90deg, transparent 0 12px, #243547 12px 13px);
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
  .cols {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    flex: 1;
    overflow: hidden;
    /* Each col is a flex column; align column headers at the top */
    align-items: stretch;
  }

  .col {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    border-right: 1px solid var(--bdr);
  }
  .col:last-child { border-right: none; }

  /* Column header: two rows, each exactly 26px, always the same across columns */
  .col-head {
    display: grid;
    grid-template-rows: 26px 26px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--bdr);
  }

  .col-title {
    display: flex;
    align-items: center;
    padding: 0 8px;
    font-size: 10px;
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
    gap: 3px;
    padding: 0 6px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .col-adds::-webkit-scrollbar { display: none; }

  .add-btn {
    background: transparent;
    border: 1px solid var(--bdr);
    color: var(--mut);
    border-radius: 3px;
    padding: 1px 5px;
    font-size: 9px;
    font-family: inherit;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    height: 18px;
    transition: color .1s, border-color .1s;
  }
  .add-btn:hover { color: var(--txt); border-color: var(--acc); }

  /* Column body — cards stack here with consistent spacing */
  .col-body {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 5px 5px;
    flex: 1;
  }

  .empty {
    color: var(--mut);
    font-size: 9px;
    text-align: center;
    padding: 12px 6px;
    line-height: 1.5;
  }

  /* ── Track cards ───────────────────────────────────────────────────────────── */
  .card {
    background: var(--sur2);
    border: 1px solid var(--bdr);
    border-radius: 5px;
    overflow: hidden;
    flex-shrink: 0;
  }

  /* Card title bar — single compact row */
  .card-head {
    display: flex;
    align-items: center;
    height: 22px;
    padding: 0 4px 0 6px;
    border-bottom: 1px solid var(--bdr);
    gap: 4px;
  }

  .card-name {
    background: transparent;
    border: none;
    color: var(--txt);
    font-weight: 600;
    font-size: 10px;
    font-family: inherit;
    flex: 1;
    min-width: 0;
    padding: 0;
    height: 100%;
  }
  .card-name:focus { outline: none; color: var(--acc); }

  .card-body {
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .card-meta {
    font-size: 8px;
    color: var(--mut);
    padding-top: 2px;
  }

  /* ── Waveform select (control cards) ──────────────────────────────────────── */
  .wave-field {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 8px;
    color: var(--mut);
  }

  .wave-field select {
    flex: 1;
    background: var(--bg);
    border: 1px solid var(--bdr);
    color: var(--txt);
    border-radius: 3px;
    padding: 1px 4px;
    font-size: 9px;
    font-family: inherit;
    height: 20px;
  }

  .control-preview,
  .track-preview {
    position: relative;
    height: 38px;
    border: 1px solid #203245;
    border-radius: 4px;
    overflow: hidden;
    background: #071018;
    flex-shrink: 0;
    isolation: isolate;
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
    height: 44px;
    border: 1px solid #203245;
    border-radius: 4px;
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
    border-radius: 4px;
    overflow: hidden;
    padding: 4px 4px 3px;
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
    margin-top: 2px;
    font-size: 8px;
    color: var(--mut);
    font-variant-numeric: tabular-nums;
  }

  .dur-label-c {
    color: var(--cc);
    font-weight: 700;
  }

  .symmetry-widget {
    position: relative;
    height: 48px;
    border: 1px solid #2a1b3a;
    border-radius: 4px;
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
    font-size: 6px;
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
    border-radius: 4px;
    overflow: hidden;
    padding: 3px 4px 2px;
    flex-shrink: 0;
    background: linear-gradient(90deg, #07111c, #06131b);
  }

  .audio-scope svg {
    width: 100%;
    height: 40px;
    display: block;
    overflow: visible;
  }

  .a-binauralbeat .scope-row svg { height: 22px; }
  .a-binauralbeat .scope-row-sum svg { height: 28px; }

  .scope-row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .scope-row + .scope-row { margin-top: 2px; padding-top: 2px; border-top: 1px solid #11202e; }

  .scope-side {
    width: 10px;
    text-align: center;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--mut);
    flex-shrink: 0;
  }
  .scope-side-l { color: #9fd0ff; }
  .scope-side-r { color: #c28ce0; }
  .scope-side-sum { color: var(--ac); }

  .row-win {
    flex-shrink: 0;
    font-size: 7px;
    color: var(--mut);
    font-variant-numeric: tabular-nums;
    padding-left: 2px;
    min-width: 32px;
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

  .pan-ruler {
    position: relative;
    height: 10px;
    margin: 2px 6px 0;
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
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #9fd0ff;
    box-shadow: 0 0 4px #3b9effaa;
    transform: translate(-50%, -50%);
  }

  .pan-l, .pan-r {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-size: 7px;
    color: var(--mut);
    letter-spacing: 0.04em;
  }
  .pan-l { left: 0; }
  .pan-r { right: 0; }

  .scope-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    margin-top: 2px;
    padding: 0 4px;
    font-size: 8px;
    color: var(--txt);
    font-variant-numeric: tabular-nums;
  }
  .meta-pair { white-space: nowrap; }
  .meta-mut { color: var(--mut); }

  .win-field {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    margin-left: auto;
    color: var(--mut);
  }
  .win-field input {
    width: 36px;
    background: var(--bg);
    border: 1px solid var(--bdr);
    color: var(--txt);
    border-radius: 2px;
    padding: 0 3px;
    font-size: 8px;
    font-family: inherit;
    height: 14px;
  }

  .voice-extras {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 4px 0;
    font-size: 8px;
    color: var(--mut);
  }

  .voice-select,
  .voice-num {
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }

  .voice-select select,
  .voice-num input {
    background: var(--bg);
    border: 1px solid var(--bdr);
    color: var(--txt);
    border-radius: 2px;
    padding: 0 3px;
    font-size: 9px;
    font-family: inherit;
    height: 16px;
  }
  .voice-num input { width: 40px; }

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
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 5px 3px;
    align-items: start;
  }

  .param-row {
    min-width: 0;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 1px 0 2px;
    border: 1px solid transparent;
    border-radius: 4px;
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
    grid-column: 1 / -1;
    justify-content: flex-start;
    gap: 8px;
    padding: 7px;
    background: color-mix(in srgb, var(--acc-s) 74%, transparent);
    border-color: var(--acc);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--acc) 24%, transparent);
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .param-mods {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    min-width: 0;
    flex: 1;
    padding-left: 8px;
    border-left: 1px solid color-mix(in srgb, var(--acc) 35%, var(--bdr));
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .mod-control-cell {
    position: relative;
    flex: 0 0 58px;
    display: grid;
    justify-items: center;
    padding-bottom: 13px;
    border-radius: 4px;
  }

  .mod-control-cell.linked {
    background: color-mix(in srgb, var(--acc-s) 58%, transparent);
  }

  .mod-empty {
    align-self: center;
    color: var(--mut);
    font-size: 8px;
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
    border-radius: 2px;
    height: 16px;
    padding: 0 5px;
    font-size: 8px;
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
    font-size: 9px;
    padding: 0 3px;
    border-radius: 2px;
    flex-shrink: 0;
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
