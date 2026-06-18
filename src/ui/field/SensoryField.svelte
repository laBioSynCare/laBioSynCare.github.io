<script>
  import { onMount, onDestroy } from 'svelte'
  import { createAudioEngine } from '../../engines/audio/audioEngines.js'
  import { visualStimulationOn, advisoryOpen } from '../safety/visualSafety.js'
  import {
    clampFlashRate, flashRiskLevel, flashRiskMessage, requiresFlashAcknowledgement,
  } from '../safety/flashSafety.js'
  import {
    loadFieldState, saveFieldState, resolveEarFrequencies,
    NOISE_COLORS, BEAT_MODES, TONE_MIN_HZ, TONE_MAX_HZ, BEAT_MIN_HZ, BEAT_MAX_HZ,
    BLINK_MIN_HZ, BLINK_MAX_HZ, DEPTH_VIEWING_MODES, DEPTH_SOURCES,
    DEPTH_SEPARATION_MIN_PX, DEPTH_SEPARATION_MAX_PX, DEPTH_MODULATION_MIN_PX,
    DEPTH_MODULATION_MAX_PX, DEPTH_DOT_MIN_PX, DEPTH_DOT_MAX_PX,
    DEPTH_BREATH_MIN_SEC, DEPTH_BREATH_MAX_SEC, resolveDepthSeparation,
    GRID_DEPTH_AXES, GRID_DEPTH_RANGE_MIN_PX, GRID_DEPTH_RANGE_MAX_PX,
    GRID_SIZE_MIN, GRID_SIZE_MAX, GRID_DOT_SCALE_MIN, GRID_DOT_SCALE_MAX,
    resolveMarkerMotion, MARKER_MOTION_SOURCES,
    MARKER_MOTION_AMPLITUDE_MIN_PX, MARKER_MOTION_AMPLITUDE_MAX_PX,
  } from './fieldState.js'
  import { fieldStateToTurtle } from './exposureProfile.js'
  import { FIELD_SEMANTICS, fieldGraphHref } from './fieldSemantic.js'
  import FieldStage from './FieldStage.svelte'

  let field = $state(loadFieldState())
  let playing = $state(false)
  let fullscreen = $state(false)
  let displayOpacity = $state(field.visual.intensity)
  let depthSeparationPx = $state(field.depth.baseSeparationPx)
  let markerOffsetX = $state(0)
  let markerOffsetY = $state(0)
  let engineNote = $state('')
  let exportTtl = $state('')
  let exportOpen = $state(false)
  let copied = $state(false)
  let stageWrap = $state(null)
  // Graph deep-links resolve client-side, so they are rendered browser-only to
  // keep them out of the prerendered HTML (prerender validates fragment ids).
  let mounted = $state(false)

  // Not reactive — runtime audio nodes.
  let engine = null
  let handles = new Map()
  let raf = 0

  const blinkRisk = $derived(field.visual.blinkEnabled ? flashRiskLevel(field.visual.blinkRateHz) : 'safe')
  const blinkNeedsAck = $derived(field.visual.blinkEnabled && requiresFlashAcknowledgement(field.visual.blinkRateHz))
  const depthSourceLabels = { static: 'static', beat: 'beat', breath: 'breath' }
  const depthModeLabels = { parallel: 'parallel', cross: 'cross-eye' }
  const gridDepthAxisLabels = { none: 'none', x: 'left ↔ right', y: 'top ↔ bottom', both: 'diagonal' }
  const trem = () => (field.audio.beatMode === 'monaural'
    ? { enabled: true, rate: field.audio.beatRateHz, depth: 0.8, mode: 'linear' }
    : null)

  function effectiveBlinkRate() {
    return clampFlashRate(field.visual.blinkRateHz, { accepted: field.flashRiskAccepted })
  }

  // Persist settings on change (flashRiskAccepted is intentionally not persisted).
  $effect(() => { saveFieldState(field) })

  // ── Render / clock loop ─────────────────────────────────────────────────────
  // Reads AudioContext.currentTime when a session is running (the only AV-sync
  // clock), and performance.now() for the free-running preview otherwise — the
  // same pattern as the Patch Studio preview.
  function tick() {
    const ctx = engine?.getAudioContext?.()
    const t = ctx ? ctx.currentTime : performance.now() / 1000
    if (field.visual.blinkEnabled) {
      const rate = effectiveBlinkRate()
      const period = rate > 0 ? 1 / rate : 0
      const phase = period > 0 ? (t % period) / period : 0
      displayOpacity = phase < field.visual.blinkDuty ? field.visual.intensity : 0
    } else {
      displayOpacity = field.visual.intensity
    }
    depthSeparationPx = resolveDepthSeparation(field, t)
    markerOffsetX = resolveMarkerMotion(field, 'x', t)
    markerOffsetY = resolveMarkerMotion(field, 'y', t)
    if (playing && engine) applyLiveAudio(t)
    raf = requestAnimationFrame(tick)
  }

  // ── Audio ────────────────────────────────────────────────────────────────────
  function buildVoices() {
    const ctx = engine.getAudioContext()
    const t = ctx.currentTime + 0.05
    const freqs = resolveEarFrequencies(field)
    addEar('left', field.audio.left, -1, freqs.left, t)
    const right = field.audio.linkEars ? field.audio.left : field.audio.right
    addEar('right', right, 1, freqs.right, t)
  }

  function addEar(key, ear, pan, freq, t) {
    if (ear.tone) {
      handles.set(`${key}Tone`, engine.scheduleVoice({
        type: 'Carrier', volume: ear.gain,
        params: { gain: ear.gain, pan, frequency: freq }, tremolo: trem(),
      }, t))
    }
    if (ear.noise) {
      handles.set(`${key}Noise`, engine.scheduleVoice({
        type: 'Noise', volume: ear.gain,
        params: { gain: ear.gain, pan, cutoff: 6000, resonance: 0.707 },
        noiseColor: ear.noiseColor, noiseFilter: 'lowpass', tremolo: trem(),
      }, t))
    }
  }

  function applyLiveAudio(t) {
    const freqs = resolveEarFrequencies(field)
    pushEar('left', field.audio.left, freqs.left, t)
    const right = field.audio.linkEars ? field.audio.left : field.audio.right
    pushEar('right', right, freqs.right, t)
  }

  function pushEar(key, ear, freq, t) {
    const toneH = handles.get(`${key}Tone`)
    if (toneH && ear.tone) {
      engine.setVoiceParameter(toneH, 'frequency', freq, t)
      engine.setVoiceParameter(toneH, 'gain', ear.gain, t)
      if (field.audio.beatMode === 'monaural') engine.setTremolo(toneH, trem())
    }
    const noiseH = handles.get(`${key}Noise`)
    if (noiseH && ear.noise) engine.setVoiceParameter(noiseH, 'gain', ear.gain, t)
  }

  function stopVoices() {
    if (engine) {
      const t = engine.getAudioContext().currentTime
      for (const h of handles.values()) engine.stopVoice(h, t)
    }
    handles.clear()
  }

  // Structural changes (sources toggled, noise colour, beat mode, ear linking)
  // require rebuilding the voice graph; continuous params update live in tick().
  function restartIfPlaying() {
    if (!playing || !engine) return
    stopVoices()
    if (field.audio.enabled) buildVoices()
  }

  async function togglePlay() {
    if (playing) {
      stopVoices()
      playing = false
      return
    }
    try {
      if (field.audio.enabled) {
        if (!engine) {
          const created = createAudioEngine()
          engine = created.engine
          engineNote = created.fellBack ? `Requested audio engine unavailable; using ${created.id}.` : ''
          await engine.initialize()
        }
        await engine.resume() // inside the click gesture — autoplay policy
        buildVoices()
      }
      playing = true
    } catch (e) {
      engineNote = `Could not start audio: ${e?.message ?? e}`
    }
  }

  // ── Fullscreen ────────────────────────────────────────────────────────────────
  async function toggleFullscreen() {
    if (fullscreen) {
      try { await document.exitFullscreen?.() } catch { /* ignore */ }
      fullscreen = false
      return
    }
    fullscreen = true
    try { await stageWrap?.requestFullscreen?.() } catch { /* fixed-overlay fallback */ }
  }

  function onFullscreenChange() {
    if (!document.fullscreenElement) fullscreen = false
  }

  // ── Export ─────────────────────────────────────────────────────────────────────
  async function exportProfile() {
    const eff = $state.snapshot(field)
    eff.visual.blinkRateHz = clampFlashRate(eff.visual.blinkRateHz, { accepted: field.flashRiskAccepted })
    exportTtl = await fieldStateToTurtle(eff)
    exportOpen = true
    copied = false
  }

  function downloadProfile() {
    const blob = new Blob([exportTtl], { type: 'text/turtle' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'sensory-field.ttl'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function copyProfile() {
    try {
      await navigator.clipboard?.writeText(exportTtl)
      copied = true
      setTimeout(() => { copied = false }, 1500)
    } catch { /* clipboard unavailable */ }
  }

  // rAF lifecycle is browser-only: start and cancel both live in onMount's
  // cleanup so prerender/SSR never touches requestAnimationFrame.
  onMount(() => {
    mounted = true
    document.addEventListener('fullscreenchange', onFullscreenChange)
    raf = requestAnimationFrame(tick)
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      cancelAnimationFrame(raf)
    }
  })

  onDestroy(() => {
    stopVoices()
    engine?.dispose?.()
    engine = null
  })

  const semList = $derived(buildSemList(field))
  function buildSemList(f) {
    const out = [FIELD_SEMANTICS.visual]
    if (f.visual.blinkEnabled) out.push(FIELD_SEMANTICS.blink, FIELD_SEMANTICS.photosensitivity)
    if (f.depth.enabled) {
      out.push(
        FIELD_SEMANTICS.stereoscopy,
        FIELD_SEMANTICS.leftEye,
        FIELD_SEMANTICS.rightEye,
        FIELD_SEMANTICS.stereoDepth,
        FIELD_SEMANTICS.horizontalFieldLoss,
        FIELD_SEMANTICS.eyeStrain,
      )
    }
    if (f.audio.enabled) {
      out.push(FIELD_SEMANTICS.leftEar, FIELD_SEMANTICS.rightEar, FIELD_SEMANTICS.hearing)
      if (f.audio.beatMode === 'binaural') out.push(FIELD_SEMANTICS.binaural)
      if (f.audio.beatMode === 'monaural') out.push(FIELD_SEMANTICS.monaural)
    }
    return out
  }
</script>

<svelte:head>
  <title>Sensory Field | BSC Lab</title>
</svelte:head>

<main class="container field-page">
  <header class="field-head">
    <h1>Sensory Field</h1>
    <p class="lede">
      A minimal instrument: a full-screen colour field with an independent
      per-ear tone. Static is the resting (0&nbsp;Hz) case; turn on blink or a beat
      to add the time dimension. Every configuration maps to an
      exposure profile you can export.
    </p>
  </header>

  <section class="stage-row">
    <div class="stage-wrap" bind:this={stageWrap} class:fullscreen>
      <FieldStage
        color={field.visual.color}
        opacity={$visualStimulationOn ? displayOpacity : 1}
        active={$visualStimulationOn && field.visual.enabled}
        {fullscreen}
        depth={field.depth}
        {depthSeparationPx}
        {markerOffsetX}
        {markerOffsetY}
      />
      {#if fullscreen}
        <button type="button" class="exit-fs" onclick={toggleFullscreen}>Exit ✕</button>
      {/if}
    </div>

    <div class="transport">
      <button type="button" class="primary" onclick={togglePlay}>
        {playing ? 'Stop' : 'Play'}
      </button>
      <button type="button" class="outline" onclick={toggleFullscreen}>Present full screen</button>
      <button type="button" class="outline" onclick={exportProfile}>Export profile…</button>
      {#if engineNote}<p class="note">{engineNote}</p>{/if}
      {#if !$visualStimulationOn}
        <p class="note">
          Visual stimulation is off.
          <button type="button" class="linklike" onclick={() => advisoryOpen.set(true)}>Review the notice</button>
        </p>
      {/if}
    </div>
  </section>

  <div class="controls">
    <!-- Visual ------------------------------------------------------------- -->
    <fieldset>
      <legend>Visual field</legend>
      <label class="row">
        <input type="checkbox" bind:checked={field.visual.enabled} role="switch" />
        Show a colour field
      </label>

      <label class="row">
        Colour
        <input type="color" bind:value={field.visual.color} aria-label="Field colour" />
      </label>
      <div class="swatches">
        {#each ['#000000', '#ffffff', '#ff0000', '#3355ff', '#22aa55'] as sw}
          <button type="button" class="swatch" style="background:{sw}" aria-label={`Set colour ${sw}`} onclick={() => (field.visual.color = sw)}></button>
        {/each}
      </div>

      <label class="row">
        Intensity
        <input type="range" min="0" max="1" step="0.01" bind:value={field.visual.intensity} />
        <output>{Math.round(field.visual.intensity * 100)}%</output>
      </label>

      <label class="row">
        <input type="checkbox" bind:checked={field.visual.blinkEnabled} role="switch" />
        Blink
      </label>

      {#if field.visual.blinkEnabled}
        <label class="row indent">
          Rate
          <input type="range" min={BLINK_MIN_HZ} max={BLINK_MAX_HZ} step="0.1" bind:value={field.visual.blinkRateHz} />
          <output>{field.visual.blinkRateHz.toFixed(1)} Hz</output>
        </label>
        <label class="row indent">
          Duty
          <input type="range" min="0.05" max="0.95" step="0.05" bind:value={field.visual.blinkDuty} />
          <output>{Math.round(field.visual.blinkDuty * 100)}%</output>
        </label>

        <p class="risk risk-{blinkRisk}">{flashRiskMessage(blinkRisk)}</p>
        {#if blinkNeedsAck}
          <label class="row indent ack">
            <input type="checkbox" bind:checked={field.flashRiskAccepted} />
            I understand the photosensitivity risk — allow flashing above 3&nbsp;Hz
          </label>
          {#if !field.flashRiskAccepted}
            <p class="note">Flash rate is capped at 3&nbsp;Hz until you accept the risk.</p>
          {/if}
        {/if}
      {/if}
    </fieldset>

    <!-- Depth -------------------------------------------------------------- -->
    <fieldset>
      <legend>Stereoscopic depth</legend>
      <label class="row">
        <input type="checkbox" bind:checked={field.depth.enabled} role="switch" />
        Free-view pair
      </label>

      {#if field.depth.enabled}
        <label class="row">
          Viewing
          <select bind:value={field.depth.viewingMode}>
            {#each DEPTH_VIEWING_MODES as mode}
              <option value={mode}>{depthModeLabels[mode]}</option>
            {/each}
          </select>
        </label>
        <label class="row">
          Source
          <select bind:value={field.depth.source}>
            {#each DEPTH_SOURCES as source}
              <option value={source}>{depthSourceLabels[source]}</option>
            {/each}
          </select>
        </label>
        <label class="row">
          Separation
          <input
            type="range"
            min={DEPTH_SEPARATION_MIN_PX}
            max={DEPTH_SEPARATION_MAX_PX}
            step="1"
            bind:value={field.depth.baseSeparationPx}
          />
          <output>{Math.round(field.depth.baseSeparationPx)} px</output>
        </label>
        <label class="row">
          Motion
          <input
            type="range"
            min={DEPTH_MODULATION_MIN_PX}
            max={DEPTH_MODULATION_MAX_PX}
            step="1"
            bind:value={field.depth.modulationPx}
            disabled={field.depth.source === 'static'}
          />
          <output>{Math.round(field.depth.modulationPx)} px</output>
        </label>
        {#if field.depth.source === 'breath'}
          <label class="row">
            Breath period
            <input
              type="range"
              min={DEPTH_BREATH_MIN_SEC}
              max={DEPTH_BREATH_MAX_SEC}
              step="0.5"
              bind:value={field.depth.breathPeriodSec}
            />
            <output>{field.depth.breathPeriodSec.toFixed(1)} s</output>
          </label>
        {/if}
        <label class="row">
          X motion
          <select bind:value={field.depth.markerMotionXSource}>
            {#each MARKER_MOTION_SOURCES as src}
              <option value={src}>{src}</option>
            {/each}
          </select>
        </label>
        {#if field.depth.markerMotionXSource !== 'none'}
          <label class="row">
            X amplitude
            <input
              type="range"
              min={MARKER_MOTION_AMPLITUDE_MIN_PX}
              max={MARKER_MOTION_AMPLITUDE_MAX_PX}
              step="1"
              bind:value={field.depth.markerMotionXAmplitudePx}
            />
            <output>{Math.round(field.depth.markerMotionXAmplitudePx)} px</output>
          </label>
        {/if}
        <label class="row">
          Y motion
          <select bind:value={field.depth.markerMotionYSource}>
            {#each MARKER_MOTION_SOURCES as src}
              <option value={src}>{src}</option>
            {/each}
          </select>
        </label>
        {#if field.depth.markerMotionYSource !== 'none'}
          <label class="row">
            Y amplitude
            <input
              type="range"
              min={MARKER_MOTION_AMPLITUDE_MIN_PX}
              max={MARKER_MOTION_AMPLITUDE_MAX_PX}
              step="1"
              bind:value={field.depth.markerMotionYAmplitudePx}
            />
            <output>{Math.round(field.depth.markerMotionYAmplitudePx)} px</output>
          </label>
        {/if}
        <label class="row">
          Marker
          <input
            type="range"
            min={DEPTH_DOT_MIN_PX}
            max={DEPTH_DOT_MAX_PX}
            step="1"
            bind:value={field.depth.dotSizePx}
          />
          <output>{Math.round(field.depth.dotSizePx)} px</output>
        </label>
        <label class="row">
          Dot X
          <input
            type="range"
            min={GRID_DOT_SCALE_MIN}
            max={GRID_DOT_SCALE_MAX}
            step="0.05"
            bind:value={field.depth.gridDotScaleX}
          />
          <output>{field.depth.gridDotScaleX.toFixed(2)}</output>
        </label>
        <label class="row">
          Dot Y
          <input
            type="range"
            min={GRID_DOT_SCALE_MIN}
            max={GRID_DOT_SCALE_MAX}
            step="0.05"
            bind:value={field.depth.gridDotScaleY}
          />
          <output>{field.depth.gridDotScaleY.toFixed(2)}</output>
        </label>
        <label class="row">
          <input type="checkbox" bind:checked={field.depth.showCartesianPlane} />
          Show grid lines
        </label>
        <label class="row">
          Grid size
          <input
            type="range"
            min={GRID_SIZE_MIN}
            max={GRID_SIZE_MAX}
            step="1"
            bind:value={field.depth.gridSize}
          />
          <output>{field.depth.gridSize} × {field.depth.gridSize}</output>
        </label>
        <label class="row">
          Grid depth
          <select bind:value={field.depth.gridDepthAxis}>
            {#each GRID_DEPTH_AXES as axis}
              <option value={axis}>{gridDepthAxisLabels[axis]}</option>
            {/each}
          </select>
        </label>
        {#if field.depth.gridDepthAxis !== 'none'}
          <label class="row">
            Depth range
            <input
              type="range"
              min={GRID_DEPTH_RANGE_MIN_PX}
              max={GRID_DEPTH_RANGE_MAX_PX}
              step="1"
              bind:value={field.depth.gridDepthRangePx}
            />
            <output>{Math.round(field.depth.gridDepthRangePx)} px</output>
          </label>
        {/if}
        <p class="note">Current delivered separation: {Math.round(depthSeparationPx)} px.</p>
        {#if field.depth.source === 'beat' && field.audio.beatMode === 'none'}
          <p class="note">Beat-driven depth uses the beat-rate control even when audio beat is off.</p>
        {/if}
      {/if}
    </fieldset>

    <!-- Audio -------------------------------------------------------------- -->
    <fieldset>
      <legend>Audio (per ear)</legend>
      <label class="row">
        <input type="checkbox" bind:checked={field.audio.enabled} onchange={restartIfPlaying} role="switch" />
        Play sound
      </label>
      <label class="row">
        <input type="checkbox" bind:checked={field.audio.linkEars} onchange={restartIfPlaying} />
        Link left & right
      </label>

      <div class="ears">
        {#each [{ side: 'left', ear: field.audio.left, label: 'Left ear' }, { side: 'right', ear: field.audio.right, label: 'Right ear' }] as e}
          <div class="ear" class:disabled={e.side === 'right' && field.audio.linkEars}>
            <h3>{e.label}{#if e.side === 'right' && field.audio.linkEars} <span class="muted">(linked)</span>{/if}</h3>
            <label class="row">
              <input type="checkbox" bind:checked={e.ear.tone} onchange={restartIfPlaying} />
              Tone
            </label>
            <label class="row">
              Freq
              <input type="range" min={TONE_MIN_HZ} max={TONE_MAX_HZ} step="1"
                bind:value={e.ear.freqHz}
                disabled={e.side === 'right' && field.audio.linkEars} />
              <output>{Math.round(e.ear.freqHz)} Hz</output>
            </label>
            <label class="row">
              <input type="checkbox" bind:checked={e.ear.noise} onchange={restartIfPlaying} />
              Noise
            </label>
            <label class="row">
              Colour
              <select bind:value={e.ear.noiseColor} onchange={restartIfPlaying} disabled={!e.ear.noise}>
                {#each NOISE_COLORS as c}<option value={c}>{c}</option>{/each}
              </select>
            </label>
            <label class="row">
              Level
              <input type="range" min="0" max="0.3" step="0.01" bind:value={e.ear.gain} />
              <output>{Math.round(e.ear.gain * 100)}%</output>
            </label>
          </div>
        {/each}
      </div>

      <label class="row">
        Beat
        <select bind:value={field.audio.beatMode} onchange={restartIfPlaying}>
          {#each BEAT_MODES as m}<option value={m}>{m}</option>{/each}
        </select>
      </label>
      {#if field.audio.beatMode !== 'none'}
        <label class="row indent">
          Beat rate
          <input type="range" min={BEAT_MIN_HZ} max={BEAT_MAX_HZ} step="0.5" bind:value={field.audio.beatRateHz} />
          <output>{field.audio.beatRateHz.toFixed(1)} Hz</output>
        </label>
        <p class="note">
          {#if field.audio.beatMode === 'binaural'}A different tone in each ear; keep headphones on.
          {:else}The same tone in both ears, amplitude-modulated.{/if}
        </p>
      {/if}
      <p class="note">Sound level is advisory only — keep it comfortable (NIOSH guidance: 85&nbsp;dBA over 8&nbsp;h).</p>
    </fieldset>

    <!-- Ontology mapping --------------------------------------------------- -->
    <fieldset class="semantics">
      <legend>In the ontology</legend>
      <p class="note">This field maps to these exposure terms:</p>
      <ul>
        {#each semList as info}
          <li>
            {#if mounted}
              <a href={fieldGraphHref(info)}>{info.label}</a>
            {:else}
              <span>{info.label}</span>
            {/if}
            <span class="kind">{info.kind}</span>
          </li>
        {/each}
      </ul>
    </fieldset>
  </div>

  {#if exportOpen}
    <div class="export-panel">
      <header>
        <h3>Exposure profile (Turtle)</h3>
        <button type="button" class="linklike" onclick={() => (exportOpen = false)}>Close</button>
      </header>
      <textarea readonly rows="12">{exportTtl}</textarea>
      <div class="export-actions">
        <button type="button" onclick={downloadProfile}>Download .ttl</button>
        <button type="button" class="outline" onclick={copyProfile}>{copied ? 'Copied ✓' : 'Copy'}</button>
      </div>
    </div>
  {/if}
</main>

<style>
  .field-page { padding-bottom: 4rem; }
  .field-head h1 { margin-bottom: 0.25rem; }
  .lede { color: var(--app-muted); max-width: 60ch; }

  .stage-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(180px, 240px);
    gap: 1rem;
    align-items: start;
    margin: 1rem 0;
  }
  .stage-wrap { aspect-ratio: 16 / 9; min-height: 180px; }
  .stage-wrap.fullscreen { aspect-ratio: auto; }

  .transport { display: grid; gap: 0.5rem; align-content: start; }
  .transport button { margin: 0; }

  .exit-fs {
    position: fixed; top: 1rem; right: 1rem; z-index: 210;
    width: auto; margin: 0; padding: 0.4rem 0.7rem;
    background: #000a; color: #fff; border: 1px solid #fff6; border-radius: var(--app-radius);
  }

  .controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1rem;
  }
  fieldset { margin: 0; }
  .row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
  .row input[type='range'] { flex: 1; min-width: 90px; }
  .row output { min-width: 3.5rem; text-align: right; font-variant-numeric: tabular-nums; }
  .indent { margin-left: 1.25rem; }
  .swatches { display: flex; gap: 0.35rem; margin: 0.3rem 0 0.6rem; }
  .swatch { width: 1.5rem; height: 1.5rem; padding: 0; border: 1px solid var(--app-border); border-radius: 4px; cursor: pointer; }

  .ears { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin: 0.5rem 0; }
  .ear { border: 1px solid var(--app-border-subtle); border-radius: var(--app-radius); padding: 0.5rem; }
  .ear h3 { font-size: 0.85rem; margin: 0 0 0.4rem; }
  .ear.disabled { opacity: 0.55; }
  .muted { color: var(--app-muted); font-weight: 400; }

  .risk { font-size: 0.8rem; padding: 0.4rem 0.6rem; border-radius: var(--app-radius); margin: 0.4rem 0; }
  .risk-safe { background: var(--app-accent-soft); color: var(--app-text); }
  .risk-caution { background: #c9920022; color: var(--app-text); border: 1px solid #c9920066; }
  .risk-high { background: #cc222218; color: var(--app-text); border: 1px solid #cc222266; }
  .ack { font-size: 0.85rem; }

  .note { font-size: 0.78rem; color: var(--app-muted); margin: 0.3rem 0; }
  .linklike { background: none; border: none; padding: 0; color: var(--app-accent); cursor: pointer; width: auto; text-decoration: underline; }

  .semantics ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.3rem; }
  .semantics li { display: flex; justify-content: space-between; gap: 0.5rem; font-size: 0.84rem; }
  .semantics .kind { color: var(--app-muted); font-size: 0.74rem; }

  .export-panel { margin-top: 1.5rem; border: 1px solid var(--app-border); border-radius: var(--app-radius); padding: 0.75rem; }
  .export-panel header { display: flex; justify-content: space-between; align-items: center; }
  .export-panel h3 { margin: 0; font-size: 0.95rem; }
  .export-panel textarea { width: 100%; font-family: ui-monospace, Menlo, monospace; font-size: 0.72rem; }
  .export-actions { display: flex; gap: 0.5rem; }
  .export-actions button { width: auto; margin: 0; }

  @media (max-width: 620px) {
    .stage-row { grid-template-columns: 1fr; }
    .ears { grid-template-columns: 1fr; }
  }
</style>
