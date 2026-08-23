<script>
  import {
    createVisualTrackConfig,
    isSpatialVisualTrackType,
    normalizeVisualTrackConfig,
  } from './visualTrackModel.js'

  let {
    track = $bindable(),
    onchange = null,
  } = $props()

  const CONTENT_LABELS = {
    ColorField: 'Colour field',
    DepthMarkers: 'Depth markers',
    TreeScene: 'Tree source',
    AbstractScene: 'Abstract source',
    LandscapeScene: 'Landscape source',
  }

  const CONTENT_FIELDS = {
    ColorField: [
      { key: 'color', label: 'On colour', kind: 'color' },
      { key: 'offColor', label: 'Off colour', kind: 'color' },
      { key: 'blinkEnabled', label: 'Enable blinking', kind: 'checkbox' },
    ],
    DepthMarkers: [
      { key: 'dotSizePx', label: 'Marker size (px)', kind: 'range', min: 6, max: 40, step: 1 },
      { key: 'showCartesianPlane', label: 'Show Cartesian plane', kind: 'checkbox' },
      { key: 'gridSize', label: 'Grid size', kind: 'range', min: 1, max: 7, step: 1 },
      {
        key: 'gridDepthAxis', label: 'Grid depth axis', kind: 'select',
        options: [
          { value: 'none', label: 'None' },
          { value: 'x', label: 'Horizontal' },
          { value: 'y', label: 'Vertical' },
          { value: 'both', label: 'Both' },
        ],
      },
      { key: 'gridDepthRange', label: 'Grid depth range', kind: 'range', min: 0, max: 4, step: 0.01 },
      { key: 'gridDotScaleX', label: 'Marker width scale', kind: 'range', min: 0.25, max: 4, step: 0.05 },
      { key: 'gridDotScaleY', label: 'Marker height scale', kind: 'range', min: 0.25, max: 4, step: 0.05 },
      { key: 'trajectoryEnabled', label: 'Show trajectory', kind: 'checkbox' },
      { key: 'trajectorySteps', label: 'Trajectory samples', kind: 'range', min: 3, max: 36, step: 1 },
    ],
    TreeScene: [
      { key: 'seed', label: 'Seed', kind: 'number', step: 1 },
      { key: 'levels', label: 'Branch levels', kind: 'range', min: 3, max: 11, step: 1 },
      { key: 'branchAngleDeg', label: 'Branch angle (°)', kind: 'range', min: 10, max: 55, step: 1 },
      { key: 'spread', label: 'Depth spread', kind: 'range', min: 0, max: 1, step: 0.01, percent: true },
      { key: 'leafDensity', label: 'Leaf density', kind: 'range', min: 0, max: 4, step: 0.1 },
      { key: 'rootLevels', label: 'Root levels', kind: 'range', min: 0, max: 6, step: 1 },
      { key: 'showLeaves', label: 'Show leaves', kind: 'checkbox' },
      { key: 'showRoots', label: 'Show roots', kind: 'checkbox' },
      { key: 'branchColor', label: 'Branch colour', kind: 'color' },
      { key: 'rootColor', label: 'Root colour', kind: 'color' },
      { key: 'leafColor', label: 'Leaf colour', kind: 'color' },
    ],
    AbstractScene: [
      { key: 'seed', label: 'Seed', kind: 'number', step: 1 },
      {
        key: 'style', label: 'Style', kind: 'select',
        options: [
          { value: 'miro', label: 'Miró' },
          { value: 'kandinsky', label: 'Kandinsky' },
          { value: 'klee', label: 'Paul Klee' },
        ],
      },
      { key: 'objectCount', label: 'Objects', kind: 'range', min: 6, max: 140, step: 1 },
      { key: 'sizeScale', label: 'Object size', kind: 'range', min: 0.4, max: 2.2, step: 0.05 },
      { key: 'spread', label: 'Depth spread', kind: 'range', min: 0, max: 1, step: 0.01, percent: true },
      { key: 'lineDensity', label: 'Line density', kind: 'range', min: 0, max: 1, step: 0.01, percent: true },
    ],
    LandscapeScene: [
      { key: 'seed', label: 'Seed', kind: 'number', step: 1 },
      {
        key: 'palette', label: 'Palette', kind: 'select',
        options: [
          { value: 'day', label: 'Day' },
          { value: 'dusk', label: 'Dusk' },
          { value: 'night', label: 'Night' },
        ],
      },
      { key: 'houses', label: 'Houses', kind: 'range', min: 0, max: 16, step: 1 },
      { key: 'trees', label: 'Trees', kind: 'range', min: 0, max: 30, step: 1 },
      { key: 'flowers', label: 'Flowers', kind: 'range', min: 0, max: 80, step: 1 },
      { key: 'hillAmplitude', label: 'Hill amplitude', kind: 'range', min: 0, max: 1, step: 0.01, percent: true },
      { key: 'riverWidth', label: 'River width', kind: 'range', min: 0, max: 0.4, step: 0.01 },
      { key: 'spread', label: 'Depth spread', kind: 'range', min: 0, max: 1, step: 0.01, percent: true },
    ],
  }

  const configFields = $derived(CONTENT_FIELDS[track?.trackType] ?? [])
  const config = $derived({
    ...(createVisualTrackConfig(track?.trackType) ?? {}),
    ...(track?.config ?? {}),
  })

  function emit(next) {
    track = next
    if (typeof onchange === 'function') onchange(next)
  }

  function updateConfig(key, value) {
    if (!track) return
    const nextConfig = normalizeVisualTrackConfig(
      track.trackType,
      { ...config, [key]: value },
    )
    emit({ ...track, config: nextConfig ?? { ...config, [key]: value } })
  }

  function updateDepthAffectsScale(value) {
    if (!track || !isSpatialVisualTrackType(track.trackType)) return
    emit({ ...track, depthAffectsScale: value === true })
  }

  function numberValue(event) {
    return Number(event.currentTarget.value)
  }

  function displayValue(value, percent = false) {
    if (!Number.isFinite(Number(value))) return '—'
    if (percent) return `${Math.round(Number(value) * 100)}%`
    return Number(Number(value).toPrecision(4)).toString()
  }
</script>

{#if track && CONTENT_LABELS[track.trackType]}
  <section class="inspector" aria-label={`${CONTENT_LABELS[track.trackType]} settings`}>
    {#if isSpatialVisualTrackType(track.trackType)}
      <fieldset>
        <legend>Spatial coordinates</legend>
        <p class="coordinate-note">
          X and Y place the source on the view plane. Z changes only binocular
          depth/disparity: positive is nearer and negative is farther.
        </p>
        <label class="check-row">
          <input
            type="checkbox"
            checked={track.depthAffectsScale === true}
            onchange={(event) => updateDepthAffectsScale(event.currentTarget.checked)}
          />
          <span>Z also changes apparent size (perspective)</span>
        </label>
        <p class="coordinate-note secondary">
          When enabled, nearer sources grow and farther sources shrink. The
          effect is bounded; leave it off for constant-size stereoscopy.
        </p>
      </fieldset>
    {/if}
    <fieldset>
      <legend>{CONTENT_LABELS[track.trackType]} recipe</legend>
      {#if config.generatorVersion}
        <p class="version">Generator version {config.generatorVersion}</p>
      {/if}
      <div class="control-grid">
        {#each configFields as field (field.key)}
          {#if field.kind === 'checkbox'}
            <label class="check-row">
              <input
                type="checkbox"
                checked={config[field.key] === true}
                onchange={(event) => updateConfig(field.key, event.currentTarget.checked)}
              />
              <span>{field.label}</span>
            </label>
          {:else if field.kind === 'select'}
            <label class="select-row">
              <span>{field.label}</span>
              <select
                value={config[field.key]}
                onchange={(event) => updateConfig(field.key, event.currentTarget.value)}
              >
                {#each field.options as option (option.value)}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </label>
          {:else if field.kind === 'color'}
            <label class="color-row">
              <span>{field.label}</span>
              <input
                type="color"
                value={config[field.key]}
                oninput={(event) => updateConfig(field.key, event.currentTarget.value)}
              />
            </label>
          {:else if field.kind === 'number'}
            <label class="number-row">
              <span>{field.label}</span>
              <input
                type="number"
                step={field.step}
                value={config[field.key]}
                onchange={(event) => updateConfig(field.key, numberValue(event))}
              />
            </label>
          {:else}
            <label class="range-row">
              <span>{field.label}</span>
              <input
                type="range"
                min={field.min}
                max={field.max}
                step={field.step}
                value={config[field.key]}
                oninput={(event) => updateConfig(field.key, numberValue(event))}
              />
              <output>{displayValue(config[field.key], field.percent)}</output>
            </label>
          {/if}
        {/each}
      </div>
    </fieldset>
  </section>
{/if}

<style>
  .inspector { display: grid; gap: 0.75rem; }
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
    grid-template-columns: minmax(8.5rem, 1fr) minmax(8rem, 2fr) 3.5rem;
    gap: 0.6rem;
    align-items: center;
  }
  .select-row, .number-row, .color-row {
    display: grid;
    grid-template-columns: minmax(8.5rem, 1fr) minmax(8rem, 2fr);
    gap: 0.6rem;
    align-items: center;
  }
  .check-row { display: flex; gap: 0.55rem; align-items: center; }
  output { text-align: right; font-variant-numeric: tabular-nums; }
  input, select { margin: 0; }
  input[type='color'] { width: 100%; min-height: 2.1rem; }
  .version { margin: 0 0 0.55rem; color: var(--app-muted, #627181); font-size: 0.85rem; }
  .coordinate-note {
    margin: 0 0 0.65rem;
    color: var(--app-muted, #627181);
    font-size: 0.85rem;
    line-height: 1.4;
  }
  .coordinate-note.secondary { margin: 0.5rem 0 0; }
  @media (max-width: 540px) {
    .range-row { grid-template-columns: 1fr 3rem; }
    .range-row > span { grid-column: 1 / -1; }
    .select-row, .number-row, .color-row { grid-template-columns: 1fr; }
  }
</style>
