<script>
  import { onMount } from 'svelte'
  import SceneStage from '../field/scene/SceneStage.svelte'
  import {
    SPATIAL_VISUAL_TRACK_TYPES,
    visualStageLayerPlan,
  } from './visualTrackModel.js'
  import {
    composeSpatialTrackScenes,
    spatialRenderTime,
    spatialTrackUsesControllerTime,
  } from './spatialScene.js'

  let {
    tracks = [],
    liveValues = {},
    stage = {},
    controllerTime = 0,
    active = true,
    preview = false,
    transparentBackground = false,
    label = 'Patch Studio visual stage',
  } = $props()

  let reducedMotion = $state(false)

  const spatialTracks = $derived(
    tracks.filter((track) => track?.enabled !== false && SPATIAL_VISUAL_TRACK_TYPES.includes(track?.trackType)),
  )
  // All 3-D sources compose before projection. The pure layer plan retains
  // ColorField order around that one required topology boundary.
  const renderLayers = $derived(visualStageLayerPlan(tracks))
  const presentationMode = $derived(preview ? 'mono' : (stage?.presentationMode ?? 'mono'))
  const sceneTime = $derived.by(() => {
    const timeVarying = spatialTracks.some((track) => (
      spatialTrackUsesControllerTime(track, liveValues?.[track.id] ?? {})
    ))
    if (!timeVarying) return 0
    return spatialRenderTime(controllerTime, presentationMode)
  })
  const scene = $derived(composeSpatialTrackScenes(spatialTracks, {
    liveValues,
    backgroundColor: 'transparent',
    timeSec: sceneTime,
  }))
  const cameraTheta = $derived.by(() => {
    const camera = stage?.camera ?? {}
    const base = (Number(camera.yawDeg) || 0) * Math.PI / 180
    if (!camera.autoRotate || reducedMotion || preview) return base
    const period = Math.max(0.001, Number(camera.autoRotateSec) || 24)
    const time = spatialRenderTime(controllerTime, presentationMode)
    return base + (2 * Math.PI * time) / period
  })

  function colorStyle(track) {
    const live = liveValues?.[track.id] ?? {}
    const opacity = Math.min(1, Math.max(0, Number(live.opacity ?? track.params?.opacity?.value ?? 1)))
    const blinkOn = Number(live.__blinkOn ?? 1) > 0
    const config = track.config ?? {}
    const color = config.blinkEnabled && !blinkOn ? config.offColor : config.color
    return [
      `background:${color || '#000000'}`,
      `opacity:${opacity}`,
      `mix-blend-mode:${track.blend || 'normal'}`,
    ].join(';')
  }

  onMount(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!query) return
    const update = () => { reducedMotion = query.matches }
    update()
    query.addEventListener?.('change', update)
    return () => query.removeEventListener?.('change', update)
  })
</script>

<div
  class="studio-visual-stage"
  class:visual-off={!active}
  style={`background:${transparentBackground ? 'transparent' : (stage?.backgroundColor || '#07090c')}`}
  role="img"
  aria-label={label}
>
  {#if active}
    {#each renderLayers as layer, index (`${layer.kind}-${layer.track?.id ?? index}`)}
      {#if layer.kind === 'color'}
        <div class="color-field-layer" style={colorStyle(layer.track)}></div>
      {:else}
        <div class="spatial-scene-layer">
          <SceneStage
            {scene}
            mode={presentationMode}
            viewingMode={stage?.viewingMode ?? 'parallel'}
            theta={cameraTheta}
            zoom={stage?.zoom ?? 1}
            depthScalePx={stage?.depthScalePx ?? 60}
            strokeWidth={stage?.strokeWidth ?? 1}
            depthColor={stage?.depthColor}
            active={true}
          />
        </div>
      {/if}
    {/each}
  {:else}
    <span>Visual stimulation is off</span>
  {/if}
</div>

<style>
  .studio-visual-stage {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 8rem;
    overflow: hidden;
    isolation: isolate;
  }

  .color-field-layer,
  .spatial-scene-layer {
    position: absolute;
    inset: 0;
  }

  .spatial-scene-layer :global(.scene-surface) {
    width: 100%;
    height: 100%;
    background: transparent;
  }

  .visual-off {
    display: grid;
    place-items: center;
    color: var(--mut, #9ba3ae);
  }
</style>
