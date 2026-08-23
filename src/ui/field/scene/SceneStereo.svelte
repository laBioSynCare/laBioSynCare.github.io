<script>
  // Shared shell for every stereoscopic scene. Owns the technique selector, the
  // depth + rotation controls, the free-running yaw clock, fullscreen, the global
  // visual-stimulation gate, and the ontology panel. The caller supplies the
  // generated `scene`, a `view` state object (mutated here), and scene-specific
  // control fieldsets via the `controls` snippet. Mirrors TreeStereo, generalised.
  import { onMount } from 'svelte'
  import { visualStimulationOn, advisoryOpen, prefersReducedMotion } from '../../safety/visualSafety.js'
  import {
    RENDER_MODES, VIEWING_MODES, DEPTH_SCALE_MIN_PX, DEPTH_SCALE_MAX_PX,
    ZOOM_MIN, ZOOM_MAX, STROKE_MIN, STROKE_MAX, YAW_MIN_DEG, YAW_MAX_DEG,
    AUTO_ROTATE_SEC_MIN, AUTO_ROTATE_SEC_MAX, resolveYaw,
  } from './sceneView.js'
  import { FIELD_SEMANTICS, fieldGraphHref } from '../fieldSemantic.js'
  import SceneStage from './SceneStage.svelte'

  let {
    scene,
    view,
    title = 'Stereoscopic scene',
    intro,
    controls,
    onRegenerate,
    regenerateLabel = 'Regenerate',
  } = $props()

  let yaw = $state(0)
  let fullscreen = $state(false)
  let stageWrap = $state(null)
  let mounted = $state(false)
  let raf = 0

  const renderModeLabels = {
    'stereo-pair': 'Free-view stereo pair',
    autostereogram: 'Autostereogram',
    anaglyph: 'Anaglyph (red/cyan)',
  }
  const viewingLabels = { parallel: 'parallel', cross: 'cross-eye' }
  const modeHint = {
    'stereo-pair': 'Two panels showing the same scene. Let your eyes relax until the panels overlap into one — parallel (wall-eyed), or switch to cross-eye.',
    autostereogram: 'A single field of dots. Look gently through the screen until the scene settles into depth.',
    anaglyph: 'A single overlaid image. View it through red / cyan (left / right) glasses.',
  }

  function tick() {
    yaw = resolveYaw(view, performance.now() / 1000)
    raf = requestAnimationFrame(tick)
  }

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

  onMount(() => {
    mounted = true
    if (prefersReducedMotion() && view.rotation.autoRotate) view.rotation.autoRotate = false
    document.addEventListener('fullscreenchange', onFullscreenChange)
    raf = requestAnimationFrame(tick)
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      cancelAnimationFrame(raf)
    }
  })

  const semList = [
    FIELD_SEMANTICS.stereoscopy,
    FIELD_SEMANTICS.leftEye,
    FIELD_SEMANTICS.rightEye,
    FIELD_SEMANTICS.stereoDepth,
    FIELD_SEMANTICS.horizontalFieldLoss,
    FIELD_SEMANTICS.eyeStrain,
  ]
</script>

<svelte:head>
  <title>{title} | SSTIM Workbench</title>
</svelte:head>

<main class="container scene-page">
  <header class="scene-head">
    <h1>{title}</h1>
    {#if intro}<p class="lede">{@render intro()}</p>{/if}
  </header>

  <section class="stage-row">
    <div class="stage-wrap" bind:this={stageWrap} class:fullscreen>
      <SceneStage
        {scene}
        mode={view.renderMode}
        viewingMode={view.viewingMode}
        theta={yaw}
        zoom={view.zoom}
        depthScalePx={view.depthScalePx}
        strokeWidth={view.strokeWidth}
        depthColor={view.depthColor}
        active={$visualStimulationOn}
      />
      {#if fullscreen}
        <button type="button" class="exit-fs" onclick={toggleFullscreen}>Exit ✕</button>
      {/if}
    </div>

    <div class="transport">
      {#if onRegenerate}
        <button type="button" class="outline" onclick={onRegenerate}>{regenerateLabel}</button>
      {/if}
      <button type="button" class="outline" onclick={toggleFullscreen}>Present full screen</button>
      <p class="note">{modeHint[view.renderMode]}</p>
      {#if !$visualStimulationOn}
        <p class="note">
          Visual stimulation is off.
          <button type="button" class="linklike" onclick={() => advisoryOpen.set(true)}>Review the notice</button>
        </p>
      {/if}
    </div>
  </section>

  <div class="controls">
    <fieldset>
      <legend>Technique</legend>
      <label class="row">
        Stereoscopy
        <select bind:value={view.renderMode}>
          {#each RENDER_MODES as m}<option value={m}>{renderModeLabels[m]}</option>{/each}
        </select>
      </label>
      {#if view.renderMode === 'stereo-pair'}
        <label class="row">
          Viewing
          <select bind:value={view.viewingMode}>
            {#each VIEWING_MODES as m}<option value={m}>{viewingLabels[m]}</option>{/each}
          </select>
        </label>
      {/if}
      <p class="note">{modeHint[view.renderMode]}</p>
    </fieldset>

    {#if controls}{@render controls()}{/if}

    <fieldset>
      <legend>View &amp; depth</legend>
      <label class="row">
        Depth scale
        <input type="range" min={DEPTH_SCALE_MIN_PX} max={DEPTH_SCALE_MAX_PX} step="1" bind:value={view.depthScalePx} />
        <output>{Math.round(view.depthScalePx)} px</output>
      </label>
      <label class="row">
        Zoom
        <input type="range" min={ZOOM_MIN} max={ZOOM_MAX} step="0.01" bind:value={view.zoom} />
        <output>{Math.round(view.zoom * 100)}%</output>
      </label>
      <label class="row">
        Stroke
        <input type="range" min={STROKE_MIN} max={STROKE_MAX} step="0.05" bind:value={view.strokeWidth} />
        <output>{view.strokeWidth.toFixed(2)}×</output>
      </label>
      <label class="row">
        Turn
        <input type="range" min={YAW_MIN_DEG} max={YAW_MAX_DEG} step="1" bind:value={view.rotation.yawDeg} disabled={view.rotation.autoRotate} />
        <output>{Math.round(view.rotation.yawDeg)}°</output>
      </label>
      <label class="row">
        <input type="checkbox" bind:checked={view.rotation.autoRotate} />
        Auto-rotate
      </label>
      {#if view.rotation.autoRotate}
        <label class="row indent">
          Period
          <input type="range" min={AUTO_ROTATE_SEC_MIN} max={AUTO_ROTATE_SEC_MAX} step="1" bind:value={view.rotation.autoRotateSec} />
          <output>{Math.round(view.rotation.autoRotateSec)} s</output>
        </label>
      {/if}

      {#if view.renderMode === 'stereo-pair'}
        <label class="row">
          <input type="checkbox" bind:checked={view.depthColor.enabled} />
          Colour by depth
        </label>
        {#if view.depthColor.enabled}
          <label class="row indent">
            Near
            <input type="color" bind:value={view.depthColor.near} aria-label="Near (foreground) colour" />
            Far
            <input type="color" bind:value={view.depthColor.far} aria-label="Far (background) colour" />
          </label>
          <label class="row indent">
            Strength
            <input type="range" min="0" max="1" step="0.01" bind:value={view.depthColor.strength} />
            <output>{Math.round(view.depthColor.strength * 100)}%</output>
          </label>
          <p class="note">Tints each part of the scene by its depth — both eyes share the colour, so fusion is unaffected. Applies to the stereo pair only.</p>
        {/if}
      {/if}
    </fieldset>

    <fieldset class="semantics">
      <legend>In the ontology</legend>
      <p class="note">This stereoscopic view maps to these exposure terms:</p>
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
</main>

<style>
  .scene-page { padding-bottom: 4rem; }
  .scene-head h1 { margin-bottom: 0.25rem; }
  .lede { color: var(--app-muted); max-width: 62ch; }

  .stage-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(180px, 240px);
    gap: 1rem;
    align-items: start;
    margin: 1rem 0;
  }
  .stage-wrap { aspect-ratio: 16 / 9; min-height: 220px; }
  .stage-wrap.fullscreen { position: fixed; inset: 0; z-index: 200; aspect-ratio: auto; }

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
  /* Global within .controls so the scene-specific control fieldsets injected via
     the `controls` snippet (defined in the child component's scope) are styled
     the same as the shell's own fieldsets. */
  .controls :global(fieldset) { margin: 0; }
  .controls :global(.row) { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
  .controls :global(.row input[type='range']) { flex: 1; min-width: 90px; }
  .controls :global(.row output) { min-width: 3.5rem; text-align: right; font-variant-numeric: tabular-nums; }
  .controls :global(.indent) { margin-left: 1.25rem; }
  .controls :global(.note) { font-size: 0.78rem; color: var(--app-muted); margin: 0.3rem 0; }

  .note { font-size: 0.78rem; color: var(--app-muted); margin: 0.3rem 0; }
  .linklike { background: none; border: none; padding: 0; color: var(--app-accent); cursor: pointer; width: auto; text-decoration: underline; }

  .semantics ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.3rem; }
  .semantics li { display: flex; justify-content: space-between; gap: 0.5rem; font-size: 0.84rem; }
  .semantics .kind { color: var(--app-muted); font-size: 0.74rem; }

  @media (max-width: 620px) {
    .stage-row { grid-template-columns: 1fr; }
  }
</style>
