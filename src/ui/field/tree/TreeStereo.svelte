<script>
  import { onMount } from 'svelte'
  import { visualStimulationOn, advisoryOpen, prefersReducedMotion } from '../../safety/visualSafety.js'
  import {
    loadTreeState, saveTreeState,
    TREE_RENDER_MODES, TREE_VIEWING_MODES,
    LEVELS_MIN, LEVELS_MAX, BRANCH_ANGLE_MIN_DEG, BRANCH_ANGLE_MAX_DEG,
    SPREAD_MIN, SPREAD_MAX, LEAF_DENSITY_MIN, LEAF_DENSITY_MAX,
    ROOT_LEVELS_MIN, ROOT_LEVELS_MAX, DEPTH_SCALE_MIN_PX, DEPTH_SCALE_MAX_PX,
    ZOOM_MIN, ZOOM_MAX, STROKE_MIN, STROKE_MAX, YAW_MIN_DEG, YAW_MAX_DEG,
    AUTO_ROTATE_SEC_MIN, AUTO_ROTATE_SEC_MAX, resolveYaw,
  } from './treeState.js'
  import { generateTree } from './treeModel.js'
  import { FIELD_SEMANTICS, fieldGraphHref } from '../fieldSemantic.js'
  import TreeStage from './TreeStage.svelte'

  let tree = $state(loadTreeState())
  let yaw = $state(0)
  let fullscreen = $state(false)
  let stageWrap = $state(null)
  let mounted = $state(false)
  let raf = 0

  // The 3D tree is a pure, deterministic function of its generation params, so it
  // is rebuilt only when one of those changes — not every frame.
  const geometry = $derived(generateTree({
    seed: tree.tree.seed,
    levels: tree.tree.levels,
    branchAngleDeg: tree.tree.branchAngleDeg,
    spread: tree.tree.spread,
    leafDensity: tree.tree.leafDensity,
    rootLevels: tree.tree.rootLevels,
  }))

  const renderModeLabels = {
    'stereo-pair': 'Free-view stereo pair',
    autostereogram: 'Autostereogram',
    anaglyph: 'Anaglyph (red/cyan)',
  }
  const viewingLabels = { parallel: 'parallel', cross: 'cross-eye' }
  const modeHint = {
    'stereo-pair': 'Two panels showing the same tree. Let your eyes relax until the panels overlap into one — parallel (wall-eyed), or switch to cross-eye.',
    autostereogram: 'A single field of dots. Look gently through the screen until the tree settles into depth.',
    anaglyph: 'A single overlaid image. View it through red / cyan (left / right) glasses.',
  }

  // Persist on change (mirrors the Sensory Field).
  $effect(() => { saveTreeState(tree) })

  // ── Free-running visual clock ─────────────────────────────────────────────────
  // No audio plays on this page, so yaw is driven from performance.now() — the
  // same free-running-preview precedent as SensoryField.tick(). This is not AV
  // sync, so CLAUDE.md §3.1 (AudioContext is the only AV clock) does not apply;
  // if audio is added here later, yaw must read AudioContext.currentTime.
  function tick() {
    yaw = resolveYaw(tree, performance.now() / 1000)
    raf = requestAnimationFrame(tick)
  }

  function newTree() {
    tree.tree.seed = Math.floor(Math.random() * 1_000_000) + 1
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

  onMount(() => {
    mounted = true
    // Respect the OS reduced-motion preference for the auto-rotate default.
    if (prefersReducedMotion() && tree.rotation.autoRotate) tree.rotation.autoRotate = false
    document.addEventListener('fullscreenchange', onFullscreenChange)
    raf = requestAnimationFrame(tick)
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      cancelAnimationFrame(raf)
    }
  })

  // Existing stereoscopy terms this instrument maps to (no invented IRIs).
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
  <title>Stereoscopic Tree | BSC Lab</title>
</svelte:head>

<main class="container tree-page">
  <header class="tree-head">
    <h1>Stereoscopic Tree</h1>
    <p class="lede">
      A companion to the <a href="/field/">Sensory Field</a>. The tree's leaves,
      branches, and roots each have an (x, y, z) position, so it carries real
      depth. Choose how to see that depth: a free-view stereo pair, a single
      random-dot autostereogram, or a red / cyan anaglyph. Turn the tree to read
      its structure.
    </p>
  </header>

  <section class="stage-row">
    <div class="stage-wrap" bind:this={stageWrap} class:fullscreen>
      <TreeStage
        tree={geometry}
        mode={tree.renderMode}
        viewingMode={tree.viewingMode}
        theta={yaw}
        zoom={tree.zoom}
        depthScalePx={tree.depthScalePx}
        strokeWidth={tree.strokeWidth}
        showLeaves={tree.showLeaves}
        showRoots={tree.showRoots}
        depthColor={tree.depthColor}
        active={$visualStimulationOn}
      />
      {#if fullscreen}
        <button type="button" class="exit-fs" onclick={toggleFullscreen}>Exit ✕</button>
      {/if}
    </div>

    <div class="transport">
      <button type="button" class="outline" onclick={newTree}>Grow a new tree</button>
      <button type="button" class="outline" onclick={toggleFullscreen}>Present full screen</button>
      <p class="note">{modeHint[tree.renderMode]}</p>
      {#if !$visualStimulationOn}
        <p class="note">
          Visual stimulation is off.
          <button type="button" class="linklike" onclick={() => advisoryOpen.set(true)}>Review the notice</button>
        </p>
      {/if}
    </div>
  </section>

  <div class="controls">
    <!-- Technique --------------------------------------------------------- -->
    <fieldset>
      <legend>Technique</legend>
      <label class="row">
        Stereoscopy
        <select bind:value={tree.renderMode}>
          {#each TREE_RENDER_MODES as m}<option value={m}>{renderModeLabels[m]}</option>{/each}
        </select>
      </label>
      {#if tree.renderMode === 'stereo-pair'}
        <label class="row">
          Viewing
          <select bind:value={tree.viewingMode}>
            {#each TREE_VIEWING_MODES as m}<option value={m}>{viewingLabels[m]}</option>{/each}
          </select>
        </label>
      {/if}
      <p class="note">{modeHint[tree.renderMode]}</p>
    </fieldset>

    <!-- Tree -------------------------------------------------------------- -->
    <fieldset>
      <legend>Tree</legend>
      <label class="row">
        Levels
        <input type="range" min={LEVELS_MIN} max={LEVELS_MAX} step="1" bind:value={tree.tree.levels} />
        <output>{tree.tree.levels}</output>
      </label>
      <label class="row">
        Branch angle
        <input type="range" min={BRANCH_ANGLE_MIN_DEG} max={BRANCH_ANGLE_MAX_DEG} step="1" bind:value={tree.tree.branchAngleDeg} />
        <output>{Math.round(tree.tree.branchAngleDeg)}°</output>
      </label>
      <label class="row">
        3D depth (spread)
        <input type="range" min={SPREAD_MIN} max={SPREAD_MAX} step="0.01" bind:value={tree.tree.spread} />
        <output>{Math.round(tree.tree.spread * 100)}%</output>
      </label>
      <label class="row">
        Leaves
        <input type="range" min={LEAF_DENSITY_MIN} max={LEAF_DENSITY_MAX} step="0.1" bind:value={tree.tree.leafDensity} />
        <output>{tree.tree.leafDensity.toFixed(1)}</output>
      </label>
      <label class="row">
        Root depth
        <input type="range" min={ROOT_LEVELS_MIN} max={ROOT_LEVELS_MAX} step="1" bind:value={tree.tree.rootLevels} />
        <output>{tree.tree.rootLevels}</output>
      </label>
      <label class="row">
        <input type="checkbox" bind:checked={tree.showLeaves} />
        Show leaves
      </label>
      <label class="row">
        <input type="checkbox" bind:checked={tree.showRoots} />
        Show roots
      </label>
      <p class="note">Seed {tree.tree.seed}. At 0% spread the tree is flat; raise it to push branches and roots into depth.</p>
    </fieldset>

    <!-- View & depth ------------------------------------------------------ -->
    <fieldset>
      <legend>View &amp; depth</legend>
      <label class="row">
        Depth scale
        <input type="range" min={DEPTH_SCALE_MIN_PX} max={DEPTH_SCALE_MAX_PX} step="1" bind:value={tree.depthScalePx} />
        <output>{Math.round(tree.depthScalePx)} px</output>
      </label>
      <label class="row">
        Zoom
        <input type="range" min={ZOOM_MIN} max={ZOOM_MAX} step="0.01" bind:value={tree.zoom} />
        <output>{Math.round(tree.zoom * 100)}%</output>
      </label>
      <label class="row">
        Stroke
        <input type="range" min={STROKE_MIN} max={STROKE_MAX} step="0.05" bind:value={tree.strokeWidth} />
        <output>{tree.strokeWidth.toFixed(2)}×</output>
      </label>
      <label class="row">
        Turn
        <input type="range" min={YAW_MIN_DEG} max={YAW_MAX_DEG} step="1" bind:value={tree.rotation.yawDeg} disabled={tree.rotation.autoRotate} />
        <output>{Math.round(tree.rotation.yawDeg)}°</output>
      </label>
      <label class="row">
        <input type="checkbox" bind:checked={tree.rotation.autoRotate} />
        Auto-rotate
      </label>
      {#if tree.rotation.autoRotate}
        <label class="row indent">
          Period
          <input type="range" min={AUTO_ROTATE_SEC_MIN} max={AUTO_ROTATE_SEC_MAX} step="1" bind:value={tree.rotation.autoRotateSec} />
          <output>{Math.round(tree.rotation.autoRotateSec)} s</output>
        </label>
      {/if}
      <p class="note">Depth scale sets how strongly z separates the eyes. A bigger separation reads as more depth but is harder to fuse — keep it comfortable.</p>

      {#if tree.renderMode === 'stereo-pair'}
        <label class="row">
          <input type="checkbox" bind:checked={tree.depthColor.enabled} />
          Colour by depth
        </label>
        {#if tree.depthColor.enabled}
          <label class="row indent">
            Near
            <input type="color" bind:value={tree.depthColor.near} aria-label="Near (foreground) colour" />
            Far
            <input type="color" bind:value={tree.depthColor.far} aria-label="Far (background) colour" />
          </label>
          <label class="row indent">
            Strength
            <input type="range" min="0" max="1" step="0.01" bind:value={tree.depthColor.strength} />
            <output>{Math.round(tree.depthColor.strength * 100)}%</output>
          </label>
          <p class="note">Tints each part of the tree by its depth — nearer parts toward the near colour, farther toward the far. Both eyes share the colour, so fusion is unaffected. Applies to the stereo pair only.</p>
        {/if}
      {/if}
    </fieldset>

    <!-- Ontology mapping -------------------------------------------------- -->
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
  .tree-page { padding-bottom: 4rem; }
  .tree-head h1 { margin-bottom: 0.25rem; }
  .lede { color: var(--app-muted); max-width: 62ch; }

  .stage-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(180px, 240px);
    gap: 1rem;
    align-items: start;
    margin: 1rem 0;
  }
  .stage-wrap { aspect-ratio: 16 / 9; min-height: 220px; }
  .stage-wrap.fullscreen {
    position: fixed; inset: 0; z-index: 200; aspect-ratio: auto;
  }

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

  .note { font-size: 0.78rem; color: var(--app-muted); margin: 0.3rem 0; }
  .linklike { background: none; border: none; padding: 0; color: var(--app-accent); cursor: pointer; width: auto; text-decoration: underline; }

  .semantics ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.3rem; }
  .semantics li { display: flex; justify-content: space-between; gap: 0.5rem; font-size: 0.84rem; }
  .semantics .kind { color: var(--app-muted); font-size: 0.74rem; }

  @media (max-width: 620px) {
    .stage-row { grid-template-columns: 1fr; }
  }
</style>
