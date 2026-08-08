<script>
  import {
    VISUAL_STAGE_PRESENTATION_MODES,
    VISUAL_STAGE_VIEWING_MODES,
    createVisualStagePresentation,
    normalizeVisualStagePresentation,
  } from './visualTrackModel.js'

  let {
    stage = $bindable(createVisualStagePresentation()),
    onchange = null,
  } = $props()

  const PRESENTATION_LABELS = {
    mono: 'Mono / flat',
    'stereo-pair': 'Stereo pair',
    anaglyph: 'Red/cyan anaglyph',
    autostereogram: 'Autostereogram',
  }
  const VIEWING_LABELS = { parallel: 'Parallel', cross: 'Cross-eyed' }

  const current = $derived({
    ...createVisualStagePresentation(),
    ...(stage ?? {}),
    depthColor: {
      ...createVisualStagePresentation().depthColor,
      ...(stage?.depthColor ?? {}),
    },
    camera: {
      ...createVisualStagePresentation().camera,
      ...(stage?.camera ?? {}),
    },
  })

  function emit(next) {
    const normalized = normalizeVisualStagePresentation(next)
    stage = normalized
    if (typeof onchange === 'function') onchange(normalized)
  }

  function update(key, value) {
    emit({ ...current, [key]: value })
  }

  function updateCamera(key, value) {
    emit({ ...current, camera: { ...current.camera, [key]: value } })
  }

  function updateDepthColor(key, value) {
    emit({ ...current, depthColor: { ...current.depthColor, [key]: value } })
  }

  function numberValue(event) {
    return Number(event.currentTarget.value)
  }

  function display(value, suffix = '') {
    if (!Number.isFinite(Number(value))) return '—'
    return `${Number(Number(value).toPrecision(4))}${suffix}`
  }
</script>

<section class="stage-controls" aria-label="Shared visual stage settings">
  <fieldset>
    <legend>Presentation</legend>
    <div class="control-grid">
      <label class="select-row">
        <span>Presentation mode</span>
        <select
          value={current.presentationMode}
          onchange={(event) => update('presentationMode', event.currentTarget.value)}
        >
          {#each VISUAL_STAGE_PRESENTATION_MODES as mode (mode)}
            <option value={mode}>{PRESENTATION_LABELS[mode]}</option>
          {/each}
        </select>
      </label>

      <label class="select-row" class:inactive={current.presentationMode !== 'stereo-pair'}>
        <span>Free-view method</span>
        <select
          value={current.viewingMode}
          disabled={current.presentationMode !== 'stereo-pair'}
          onchange={(event) => update('viewingMode', event.currentTarget.value)}
        >
          {#each VISUAL_STAGE_VIEWING_MODES as mode (mode)}
            <option value={mode}>{VIEWING_LABELS[mode]}</option>
          {/each}
        </select>
      </label>

      <label class="color-row">
        <span>Stage background</span>
        <input
          type="color"
          value={current.backgroundColor}
          oninput={(event) => update('backgroundColor', event.currentTarget.value)}
        />
      </label>
    </div>
  </fieldset>

  <fieldset>
    <legend>Projection geometry</legend>
    <div class="control-grid">
      <label class="range-row">
        <span>Depth scale</span>
        <input
          type="range"
          min="0"
          max="160"
          step="1"
          value={current.depthScalePx}
          oninput={(event) => update('depthScalePx', numberValue(event))}
        />
        <output>{display(current.depthScalePx, ' px')}</output>
      </label>
      <label class="range-row">
        <span>Zoom</span>
        <input
          type="range"
          min="0.4"
          max="1.5"
          step="0.01"
          value={current.zoom}
          oninput={(event) => update('zoom', numberValue(event))}
        />
        <output>{Math.round(current.zoom * 100)}%</output>
      </label>
      <label class="range-row">
        <span>Stroke width</span>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.05"
          value={current.strokeWidth}
          oninput={(event) => update('strokeWidth', numberValue(event))}
        />
        <output>{display(current.strokeWidth, '×')}</output>
      </label>
    </div>
  </fieldset>

  <fieldset>
    <legend>Camera</legend>
    <div class="control-grid">
      <label class="range-row">
        <span>Yaw</span>
        <input
          type="range"
          min="0"
          max="360"
          step="1"
          value={current.camera.yawDeg}
          disabled={current.camera.autoRotate}
          oninput={(event) => updateCamera('yawDeg', numberValue(event))}
        />
        <output>{display(current.camera.yawDeg, '°')}</output>
      </label>
      <label class="check-row">
        <input
          type="checkbox"
          checked={current.camera.autoRotate}
          onchange={(event) => updateCamera('autoRotate', event.currentTarget.checked)}
        />
        <span>Auto-rotate camera</span>
      </label>
      <label class="range-row" class:inactive={!current.camera.autoRotate}>
        <span>Rotation period</span>
        <input
          type="range"
          min="6"
          max="90"
          step="1"
          value={current.camera.autoRotateSec}
          disabled={!current.camera.autoRotate}
          oninput={(event) => updateCamera('autoRotateSec', numberValue(event))}
        />
        <output>{display(current.camera.autoRotateSec, ' s')}</output>
      </label>
    </div>
  </fieldset>

  <fieldset>
    <legend>Depth colour</legend>
    <div class="control-grid">
      <label class="check-row">
        <input
          type="checkbox"
          checked={current.depthColor.enabled}
          onchange={(event) => updateDepthColor('enabled', event.currentTarget.checked)}
        />
        <span>Enable depth tint</span>
      </label>
      {#if current.depthColor.enabled}
        <label class="color-row">
          <span>Near colour</span>
          <input
            type="color"
            value={current.depthColor.near}
            oninput={(event) => updateDepthColor('near', event.currentTarget.value)}
          />
        </label>
        <label class="color-row">
          <span>Far colour</span>
          <input
            type="color"
            value={current.depthColor.far}
            oninput={(event) => updateDepthColor('far', event.currentTarget.value)}
          />
        </label>
        <label class="range-row">
          <span>Tint strength</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={current.depthColor.strength}
            oninput={(event) => updateDepthColor('strength', numberValue(event))}
          />
          <output>{Math.round(current.depthColor.strength * 100)}%</output>
        </label>
      {/if}
    </div>
  </fieldset>
</section>

<style>
  .stage-controls { display: grid; gap: 0.75rem; }
  fieldset {
    margin: 0;
    padding: 0.75rem;
    border: 1px solid var(--app-border, #ccd5df);
    border-radius: var(--app-radius, 0.5rem);
  }
  legend { padding: 0 0.35rem; font-weight: 650; }
  .control-grid { display: grid; gap: 0.6rem; }
  .range-row {
    display: grid;
    grid-template-columns: minmax(8.5rem, 1fr) minmax(8rem, 2fr) 4rem;
    gap: 0.6rem;
    align-items: center;
  }
  .select-row, .color-row {
    display: grid;
    grid-template-columns: minmax(8.5rem, 1fr) minmax(8rem, 2fr);
    gap: 0.6rem;
    align-items: center;
  }
  .check-row { display: flex; gap: 0.55rem; align-items: center; }
  .inactive { opacity: 0.6; }
  output { text-align: right; font-variant-numeric: tabular-nums; }
  input, select { margin: 0; }
  input[type='color'] { width: 100%; min-height: 2.1rem; }
  @media (max-width: 540px) {
    .range-row { grid-template-columns: 1fr 3.5rem; }
    .range-row > span { grid-column: 1 / -1; }
    .select-row, .color-row { grid-template-columns: 1fr; }
  }
</style>
