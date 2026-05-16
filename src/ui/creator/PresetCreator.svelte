<script>
  import { onDestroy, onMount } from 'svelte'
  import Knob from './Knob.svelte'
  import { VanillaWebAudioEngine } from '../../engines/audio/VanillaWebAudioEngine.js'
  import {
    computeMartigliState,
    computeMartigliStateFree,
    evaluateSymmetry,
    martigliPathD,
  } from './controlSignals.js'
  import {
    AUDIO_PARAM_RANGE,
    AUDIO_PARAMS,
    AUDIO_TRACK_TYPES,
    CONTROL_TYPES,
    HAPTIC_PARAM_RANGE,
    HAPTIC_PARAMS,
    HAPTIC_TRACK_TYPES,
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
  } from './presetDraft.js'

  let draft = $state(createDraft())
  let statusMsg = $state('')
  let expandedMod = $state(null) // "trackId:paramName"

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

  function toggleMod(trackId, paramName) {
    const k = `${trackId}:${paramName}`
    expandedMod = expandedMod === k ? null : k
  }

  function addMod(param, controlId) {
    if (!param.mods.find(m => m.controlId === controlId))
      param.mods.push(createMod(controlId))
    expandedMod = null
    tip('Mod linked.')
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
    return {
      type: track.trackType,
      volume: gain,
      params: {
        gain,
        pan: p.pan.value,
        frequency: p.frequency.value,
        pulseRate: p.pulseRate.value,
      },
    }
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
        st = { value: evaluateSymmetry(c, tNow) }
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
        applyMods(track, controlValues, AUDIO_PARAM_RANGE, write, AUDIO_PARAMS)
      }
      for (const track of draft.visualTracks) applyMods(track, controlValues, VISUAL_PARAM_RANGE, null, VISUAL_PARAMS)
      for (const track of draft.hapticTracks) applyMods(track, controlValues, HAPTIC_PARAM_RANGE, null, HAPTIC_PARAMS)
    }

    rafId = requestAnimationFrame(rafTick)
  }

  onMount(() => { rafId = requestAnimationFrame(rafTick) })

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
  function ctrlName(id) { return draft.controlTracks.find(t => t.id === id)?.name ?? id }

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

  function symmetryStyle(track) {
    const rate = clamp(num(track.rateHz, 1), 0.001, 50)
    const depth = clamp(num(track.depth, 1) / 10, 0, 1)
    const offset = clamp(num(track.offset, 0) / 5, -1, 1)
    const duration = clamp(1 / rate, 0.18, 20)
    return [
      `--osc-duration:${duration.toFixed(3)}s`,
      `--osc-delay:${(-duration / 2).toFixed(3)}s`,
      `--sym-depth:${depth.toFixed(3)}`,
      `--sym-offset:${offset.toFixed(3)}`,
      `--sym-left:${(8 + offset * 8).toFixed(2)}%`,
      `--sym-right:${(8 - offset * 8).toFixed(2)}%`,
      `--sym-lobe-scale:${(0.95 + depth * 0.4).toFixed(3)}`,
      `--sym-phase:${num(track.phaseDeg, 0).toFixed(1)}deg`,
    ].join(';')
  }

  function freqToCycles(freq, minCycles = 1, maxCycles = 8) {
    const f = clamp(num(freq, 200), 20, 2000)
    const r = Math.log10(f / 20) / Math.log10(100) // 0..1
    return minCycles + (maxCycles - minCycles) * r
  }

  function pulseToEnvCycles(pulse, minCycles = 0.5, maxCycles = 5) {
    const p = clamp(num(pulse, 10), 0.5, 50)
    const r = Math.log10(p / 0.5) / Math.log10(100)
    return minCycles + (maxCycles - minCycles) * r
  }

  function sinePathD(xMin, xMax, yMid, yAmp, cycles, samples = 96) {
    const span = xMax - xMin
    let d = ''
    for (let i = 0; i <= samples; i += 1) {
      const t = i / samples
      const x = xMin + span * t
      const y = yMid - yAmp * Math.sin(2 * Math.PI * cycles * t)
      d += (i === 0 ? 'M' : ' L') + x.toFixed(1) + ' ' + y.toFixed(1)
    }
    return d
  }

  function envelopedSinePathD(xMin, xMax, yMid, yAmp, carrierCycles, envCycles, samples = 140) {
    const span = xMax - xMin
    let d = ''
    for (let i = 0; i <= samples; i += 1) {
      const t = i / samples
      const env = 0.5 - 0.5 * Math.cos(2 * Math.PI * envCycles * t)
      const x = xMin + span * t
      const y = yMid - yAmp * env * Math.sin(2 * Math.PI * carrierCycles * t)
      d += (i === 0 ? 'M' : ' L') + x.toFixed(1) + ' ' + y.toFixed(1)
    }
    return d
  }

  function envelopeOutlineD(xMin, xMax, yMid, yAmp, envCycles, samples = 96) {
    const span = xMax - xMin
    let top = ''
    let bot = ''
    for (let i = 0; i <= samples; i += 1) {
      const t = i / samples
      const env = 0.5 - 0.5 * Math.cos(2 * Math.PI * envCycles * t)
      const x = xMin + span * t
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
      <details class="nav-menu">
        <summary title="Navigate">+</summary>
        <div class="nav-panel">
          <a href="/creator/">Patch Studio</a>
          <a href="/presets/">Presets</a>
          <a href="/sparql/">SPARQL</a>
          <a href="/">Graph</a>
        </div>
      </details>
    </div>
  </header>

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
                    <div class="knob-cell">
                      <Knob value={track[pname]} onchange={(v) => { track[pname] = v }}
                        min={pmin} max={pmax} step={pstep} label={pname} />
                    </div>
                  {/each}
                </div>
                <div class="card-meta">{Math.round(track.inhaleRatio * 100)}% inhale</div>
              {:else}
                <div class="control-preview symmetry-preview" style={symmetryStyle(track)} aria-hidden="true">
                  <span class="sym-orbit">
                    <span class="sym-dot sym-dot-a"></span>
                    <span class="sym-dot sym-dot-b"></span>
                  </span>
                  <span class="sym-axis"></span>
                  <span class="sym-lobe sym-lobe-a"></span>
                  <span class="sym-lobe sym-lobe-b"></span>
                </div>
                <div class="knob-grid">
                  {#each SYMMETRY_PARAMS as pname}
                    {@const [pmin, pmax, pstep] = SYMMETRY_PARAM_RANGE[pname]}
                    <div class="knob-cell">
                      <Knob value={track[pname]} onchange={(v) => { track[pname] = v }}
                        min={pmin} max={pmax} step={pstep} label={pname} />
                    </div>
                  {/each}
                </div>
                <div class="card-meta">{track.rateHz} Hz · {track.waveform}</div>
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
          {@const aPulse = num(getLive(track, 'pulseRate'), 10)}
          {@const cyc = freqToCycles(aFreq)}
          {@const envCyc = pulseToEnvCycles(aPulse)}
          {@const panX = (4 + 112 * (aPan + 1) / 2).toFixed(2)}
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
              <div class="audio-scope a-{track.trackType.toLowerCase()}" aria-hidden="true">
                <svg viewBox="0 0 120 36" preserveAspectRatio="none">
                  <line class="scope-axis" x1="4" y1="18" x2="116" y2="18" />
                  {#if track.trackType === 'BinauralBeat'}
                    <path class="scope-trace scope-trace-l" d={sinePathD(4, 116, 10, 6 * aGain, cyc)} />
                    <path class="scope-trace scope-trace-r" d={sinePathD(4, 116, 26, 6 * aGain, cyc + Math.max(0.4, envCyc * 0.5))} />
                  {:else if track.trackType === 'IsochronicTone'}
                    <path class="scope-envelope" d={envelopeOutlineD(4, 116, 18, 13 * aGain, envCyc)} />
                    <path class="scope-trace" d={envelopedSinePathD(4, 116, 18, 13 * aGain, cyc, envCyc)} />
                  {:else}
                    <path class="scope-trace" d={sinePathD(4, 116, 18, 13 * aGain, cyc)} />
                  {/if}
                </svg>
                <div class="pan-ruler">
                  <span class="pan-track"></span>
                  <span class="pan-dot" style={`left:${panX}%`}></span>
                  <span class="pan-l">L</span>
                  <span class="pan-r">R</span>
                </div>
                <div class="scope-meta">
                  <span>{Math.round(aFreq)} Hz</span>
                  {#if track.trackType !== 'Carrier'}
                    <span>· {aPulse < 10 ? aPulse.toFixed(1) : Math.round(aPulse)} Hz {track.trackType === 'BinauralBeat' ? 'beat' : 'pulse'}</span>
                  {/if}
                </div>
              </div>
              <div class="knob-grid">
                {#each AUDIO_PARAMS as pname}
                  {@const param = track.params[pname]}
                  {@const [pmin, pmax, pstep] = AUDIO_PARAM_RANGE[pname]}
                  <div class="knob-cell">
                    <Knob value={param.value} onchange={(v) => { param.value = v }}
                      min={pmin} max={pmax} step={pstep} label={pname}
                      modActive={param.mods.length > 0} onmod={() => toggleMod(track.id, pname)} />
                  </div>
                  {#if expandedMod === `${track.id}:${pname}`}
                    <div class="mod-picker">
                      {#each draft.controlTracks as ctrl}
                        <button class="mod-pick" onclick={() => addMod(param, ctrl.id)}>{ctrl.name}</button>
                      {/each}
                      {#if !draft.controlTracks.length}<span class="mod-empty">No controls</span>{/if}
                    </div>
                  {/if}
                  {#each param.mods as mod (mod.id)}
                    <div class="mod-chip">
                      <span>{ctrlName(mod.controlId)}</span>
                      <input class="mod-amt" type="number" step="any" bind:value={mod.amount} />
                      <button class="x-btn tiny" onclick={() => removeMod(param, mod.id)}>✕</button>
                    </div>
                  {/each}
                {/each}
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
                  <div class="knob-cell">
                    <Knob value={param.value} onchange={(v) => { param.value = v }}
                      min={pmin} max={pmax} step={pstep} label={pname}
                      modActive={param.mods.length > 0} onmod={() => toggleMod(track.id, pname)} />
                  </div>
                  {#if expandedMod === `${track.id}:${pname}`}
                    <div class="mod-picker">
                      {#each draft.controlTracks as ctrl}
                        <button class="mod-pick" onclick={() => addMod(param, ctrl.id)}>{ctrl.name}</button>
                      {/each}
                      {#if !draft.controlTracks.length}<span class="mod-empty">No controls</span>{/if}
                    </div>
                  {/if}
                  {#each param.mods as mod (mod.id)}
                    <div class="mod-chip">
                      <span>{ctrlName(mod.controlId)}</span>
                      <input class="mod-amt" type="number" step="any" bind:value={mod.amount} />
                      <button class="x-btn tiny" onclick={() => removeMod(param, mod.id)}>✕</button>
                    </div>
                  {/each}
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
                  <div class="knob-cell">
                    <Knob value={param.value} onchange={(v) => { param.value = v }}
                      min={pmin} max={pmax} step={pstep} label={pname}
                      modActive={param.mods.length > 0} onmod={() => toggleMod(track.id, pname)} />
                  </div>
                  {#if expandedMod === `${track.id}:${pname}`}
                    <div class="mod-picker">
                      {#each draft.controlTracks as ctrl}
                        <button class="mod-pick" onclick={() => addMod(param, ctrl.id)}>{ctrl.name}</button>
                      {/each}
                      {#if !draft.controlTracks.length}<span class="mod-empty">No controls</span>{/if}
                    </div>
                  {/if}
                  {#each param.mods as mod (mod.id)}
                    <div class="mod-chip">
                      <span>{ctrlName(mod.controlId)}</span>
                      <input class="mod-amt" type="number" step="any" bind:value={mod.amount} />
                      <button class="x-btn tiny" onclick={() => removeMod(param, mod.id)}>✕</button>
                    </div>
                  {/each}
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
    --bg:     #0b0f14;
    --sur:    #111820;
    --sur2:   #161e28;
    --bdr:    #1c2a38;
    --txt:    #c0d0e0;
    --mut:    #445866;
    --acc:    #3b9eff;
    --acc-s:  #0c2440;
    --ok:     #27ae60;
    --warn:   #e67e22;
    --err:    #c0392b;
    --cc:     #e67e22;   /* control colour */
    --ac:     #3b9eff;   /* audio colour   */
    --vc:     #8e44ad;   /* visual colour  */
    --hc:     #16a085;   /* haptic colour  */

    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    background: var(--bg);
    color: var(--txt);
    font-family: 'SF Mono', 'Fira Code', ui-monospace, monospace;
    font-size: 11px;
    line-height: 1;
  }

  /* ── Header — single fixed-height bar ──────────────────────────────────────── */
  .hdr {
    display: grid;
    /* name pill | transport | actions */
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 12px;
    height: 36px;
    padding: 0 10px;
    background: var(--sur);
    border-bottom: 1px solid var(--bdr);
    flex-shrink: 0;
  }

  .hdr-name {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    overflow: hidden;
  }

  .patch-name {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--bdr);
    color: var(--txt);
    font-size: 12px;
    font-weight: 700;
    font-family: inherit;
    width: 120px;
    padding: 0 2px 1px;
    flex-shrink: 0;
  }
  .patch-name:focus { outline: none; border-bottom-color: var(--acc); }

  .pill {
    color: var(--mut);
    font-size: 9px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hdr-transport {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .play-btn {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1.5px solid var(--acc);
    background: transparent;
    color: var(--acc);
    font-size: 10px;
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
    width: 54px;
    height: 20px;
    border: 1px solid var(--bdr);
    border-radius: 3px;
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
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 9px;
    color: var(--mut);
  }
  .mini-field input {
    width: 42px;
    background: var(--bg);
    border: 1px solid var(--bdr);
    color: var(--txt);
    border-radius: 3px;
    padding: 1px 4px;
    font-size: 9px;
    font-family: inherit;
    height: 20px;
  }

  .hdr-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .badge {
    border-radius: 99px;
    padding: 1px 5px;
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
    background: transparent;
    border: 1px solid var(--bdr);
    color: var(--mut);
    border-radius: 3px;
    padding: 1px 6px;
    font-size: 9px;
    font-family: inherit;
    cursor: pointer;
    height: 20px;
    white-space: nowrap;
    transition: color .1s, border-color .1s;
  }
  .act-btn:hover { color: var(--txt); border-color: var(--acc); }
  .act-btn:disabled { opacity: .3; cursor: default; }

  /* ── Nav menu ──────────────────────────────────────────────────────────────── */
  .nav-menu { position: relative; margin: 0; }
  .nav-menu summary {
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border: 1px solid var(--bdr);
    border-radius: 3px;
    background: transparent;
    color: var(--mut);
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    list-style: none;
    transition: color .1s, border-color .1s;
  }
  .nav-menu summary::marker,
  .nav-menu summary::after { display: none; content: ''; }
  .nav-menu summary::-webkit-details-marker { display: none; }
  .nav-menu summary:hover { color: var(--txt); border-color: var(--acc); }
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

  .symmetry-preview {
    background:
      radial-gradient(circle at 50% 50%, #8e44ad38, transparent 48%),
      linear-gradient(90deg, #061018, #100b18);
  }

  .sym-axis {
    position: absolute;
    left: 8px;
    right: 8px;
    top: 50%;
    height: 1px;
    background: linear-gradient(90deg, transparent, #8e44ad99, transparent);
  }

  .sym-orbit {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 30px;
    height: 30px;
    border: 1px solid #8e44ad88;
    border-radius: 50%;
    transform: translate(-50%, -50%) rotate(var(--sym-phase, 0deg));
    animation: symSpin var(--osc-duration, 1s) linear infinite;
  }

  .sym-dot {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #c28ce0;
    box-shadow: 0 0 10px #8e44ad;
  }

  .sym-dot-a { left: 50%; top: -3px; transform: translateX(-50%); }
  .sym-dot-b { left: 50%; bottom: -3px; transform: translateX(-50%); }

  .sym-lobe {
    position: absolute;
    top: 18%;
    width: 42%;
    height: 64%;
    border-radius: 50%;
    border: 1px solid #8e44ad66;
    opacity: 0.45;
    animation: symPulse var(--osc-duration, 1s) ease-in-out infinite;
  }

  .sym-lobe-b {
    right: var(--sym-right, 8%);
    animation-delay: var(--osc-delay, -0.5s);
  }
  .sym-lobe-a { left: var(--sym-left, 8%); }

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
    height: 36px;
    display: block;
    overflow: visible;
  }

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

  .scope-envelope {
    fill: #3b9eff1c;
    stroke: #3b9eff55;
    stroke-width: 1;
    stroke-dasharray: 2 2;
    vector-effect: non-scaling-stroke;
  }

  .a-binauralbeat .scope-trace-l { stroke: #9fd0ff; }
  .a-binauralbeat .scope-trace-r { stroke: #c28ce0; filter: drop-shadow(0 0 3px #8e44ad66); }

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
    gap: 4px;
    margin-top: 2px;
    padding: 0 4px;
    font-size: 8px;
    color: var(--mut);
    font-variant-numeric: tabular-nums;
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
    /* 4 equal columns so knobs never truncate their labels */
    grid-template-columns: repeat(4, 1fr);
    gap: 4px 2px;
  }

  .knob-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  /* ── Mod picker ────────────────────────────────────────────────────────────── */
  .mod-picker {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    padding: 3px;
    background: var(--bg);
    border: 1px solid var(--acc);
    border-radius: 3px;
    grid-column: 1 / -1;
  }

  .mod-pick {
    background: var(--acc-s);
    border: 1px solid var(--acc);
    color: var(--acc);
    border-radius: 2px;
    padding: 1px 4px;
    font-size: 8px;
    font-family: inherit;
    cursor: pointer;
    white-space: nowrap;
  }

  .mod-empty { font-size: 8px; color: var(--mut); }

  /* ── Mod chip ──────────────────────────────────────────────────────────────── */
  .mod-chip {
    display: flex;
    align-items: center;
    gap: 3px;
    background: var(--acc-s);
    border: 1px solid var(--acc);
    border-radius: 3px;
    padding: 1px 4px;
    font-size: 8px;
    color: var(--acc);
    grid-column: 1 / -1;
    min-width: 0;
  }
  .mod-chip span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }

  .mod-amt {
    width: 28px;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--acc);
    color: var(--acc);
    font-size: 8px;
    font-family: inherit;
    padding: 0;
    text-align: right;
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
  .card.muted .track-preview { opacity: 0.35; }

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

  @keyframes symSpin {
    to { transform: translate(-50%, -50%) rotate(calc(var(--sym-phase, 0deg) + 360deg)); }
  }

  @keyframes symPulse {
    0%, 100% {
      transform: scaleX(0.75) scaleY(0.82);
      opacity: 0.25;
    }
    50% {
      transform: scaleX(var(--sym-lobe-scale, 1.02)) scaleY(1.08);
      opacity: 0.72;
    }
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
    .sym-orbit,
    .sym-lobe,
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
