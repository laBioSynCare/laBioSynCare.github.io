<script>
  // Abstraction scene page: owns the param + view state, derives the scene, and
  // hands both to the shared SceneStereo shell with scene-specific controls.
  import { generateAbstract, ABSTRACT_STYLES } from './abstractScene.js'
  import {
    loadAbstractState, saveAbstractState,
    OBJECT_COUNT_MIN, OBJECT_COUNT_MAX, SIZE_SCALE_MIN, SIZE_SCALE_MAX,
    SPREAD_MIN, SPREAD_MAX, LINE_DENSITY_MIN, LINE_DENSITY_MAX,
  } from './abstractState.js'
  import SceneStereo from '../scene/SceneStereo.svelte'

  let state = $state(loadAbstractState())
  const scene = $derived(generateAbstract({ ...state.params }))
  $effect(() => { saveAbstractState(state) })

  function regenerate() {
    state.params.seed = Math.floor(Math.random() * 1_000_000) + 1
  }

  const styleLabels = { miro: 'Miró', kandinsky: 'Kandinsky', klee: 'Paul Klee' }
</script>

<SceneStereo
  {scene}
  view={state.view}
  title="Abstraction"
  onRegenerate={regenerate}
  regenerateLabel="New arrangement"
>
  {#snippet intro()}
    Shapes scattered in 3D space, in the spirit of a Miró, Kandinsky, or Paul Klee
    composition — each object at its own depth. A companion to the
    <a href="/field/tree/">Stereoscopic Tree</a>; turn the scene to read the layout.
  {/snippet}

  {#snippet controls()}
    <fieldset>
      <legend>Abstraction</legend>
      <label class="row">
        Style
        <select bind:value={state.params.style}>
          {#each ABSTRACT_STYLES as s}<option value={s}>{styleLabels[s]}</option>{/each}
        </select>
      </label>
      <label class="row">
        Objects
        <input type="range" min={OBJECT_COUNT_MIN} max={OBJECT_COUNT_MAX} step="1" bind:value={state.params.objectCount} />
        <output>{state.params.objectCount}</output>
      </label>
      <label class="row">
        Size
        <input type="range" min={SIZE_SCALE_MIN} max={SIZE_SCALE_MAX} step="0.05" bind:value={state.params.sizeScale} />
        <output>{Math.round(state.params.sizeScale * 100)}%</output>
      </label>
      <label class="row">
        3D depth (spread)
        <input type="range" min={SPREAD_MIN} max={SPREAD_MAX} step="0.01" bind:value={state.params.spread} />
        <output>{Math.round(state.params.spread * 100)}%</output>
      </label>
      <label class="row">
        Lines
        <input type="range" min={LINE_DENSITY_MIN} max={LINE_DENSITY_MAX} step="0.01" bind:value={state.params.lineDensity} />
        <output>{Math.round(state.params.lineDensity * 100)}%</output>
      </label>
      <p class="note">Seed {state.params.seed}. At 0% spread the composition is flat; raise it to set the objects at different depths.</p>
    </fieldset>
  {/snippet}
</SceneStereo>
