<script>
  // Landscape scene page: owns param + view state, derives the scene, and hands
  // both to the shared SceneStereo shell with scene-specific controls.
  import { generateLandscape, LANDSCAPE_PALETTES } from './landscapeScene.js'
  import {
    loadLandscapeState, saveLandscapeState,
    HOUSES_MIN, HOUSES_MAX, TREES_MIN, TREES_MAX, FLOWERS_MIN, FLOWERS_MAX,
    HILL_AMP_MIN, HILL_AMP_MAX, RIVER_WIDTH_MIN, RIVER_WIDTH_MAX, SPREAD_MIN, SPREAD_MAX,
  } from './landscapeState.js'
  import SceneStereo from '../scene/SceneStereo.svelte'

  let state = $state(loadLandscapeState())
  const scene = $derived(generateLandscape({ ...state.params }))
  $effect(() => { saveLandscapeState(state) })

  function regenerate() {
    state.params.seed = Math.floor(Math.random() * 1_000_000) + 1
  }

  const paletteLabels = { day: 'Day', dusk: 'Dusk', night: 'Night' }
</script>

<SceneStereo
  {scene}
  view={state.view}
  title="3D Landscape"
  onRegenerate={regenerate}
  regenerateLabel="New landscape"
>
  {#snippet intro()}
    A small countryside in depth — receding hills, a winding river, houses, trees,
    and flowers, each at its own distance. A companion to the
    <a href="/field/tree/">Stereoscopic Tree</a>; turn the scene to look around.
  {/snippet}

  {#snippet controls()}
    <fieldset>
      <legend>Landscape</legend>
      <label class="row">
        Light
        <select bind:value={state.params.palette}>
          {#each LANDSCAPE_PALETTES as pl}<option value={pl}>{paletteLabels[pl]}</option>{/each}
        </select>
      </label>
      <label class="row">
        Houses
        <input type="range" min={HOUSES_MIN} max={HOUSES_MAX} step="1" bind:value={state.params.houses} />
        <output>{state.params.houses}</output>
      </label>
      <label class="row">
        Trees
        <input type="range" min={TREES_MIN} max={TREES_MAX} step="1" bind:value={state.params.trees} />
        <output>{state.params.trees}</output>
      </label>
      <label class="row">
        Flowers
        <input type="range" min={FLOWERS_MIN} max={FLOWERS_MAX} step="1" bind:value={state.params.flowers} />
        <output>{state.params.flowers}</output>
      </label>
      <label class="row">
        Hills
        <input type="range" min={HILL_AMP_MIN} max={HILL_AMP_MAX} step="0.01" bind:value={state.params.hillAmplitude} />
        <output>{Math.round(state.params.hillAmplitude * 100)}%</output>
      </label>
      <label class="row">
        River
        <input type="range" min={RIVER_WIDTH_MIN} max={RIVER_WIDTH_MAX} step="0.01" bind:value={state.params.riverWidth} />
        <output>{state.params.riverWidth.toFixed(2)}</output>
      </label>
      <label class="row">
        3D depth (spread)
        <input type="range" min={SPREAD_MIN} max={SPREAD_MAX} step="0.01" bind:value={state.params.spread} />
        <output>{Math.round(state.params.spread * 100)}%</output>
      </label>
      <p class="note">Seed {state.params.seed}. At 0% spread the scene is flat; raise it to set hills, river, and buildings at different depths.</p>
    </fieldset>
  {/snippet}
</SceneStereo>
