<script>
  const {
    value = 0,
    min = 0,
    max = 1,
    step = 0.01,
    label = '',
    modActive = false,
    onmod = () => {},
    onchange = (_v) => {},
  } = $props()

  const R = 18
  const CX = 24
  const CY = 24
  const START_DEG = 225
  const SWEEP_DEG = 270

  function polarToXY(deg) {
    const rad = (deg - 90) * Math.PI / 180
    return { x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad) }
  }

  function arcPath(fromDeg, toDeg) {
    const s = polarToXY(fromDeg)
    const e = polarToXY(toDeg)
    const large = toDeg - fromDeg > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y}`
  }

  const trackPath = $derived(arcPath(START_DEG, START_DEG + SWEEP_DEG))

  const fillPath = $derived(() => {
    const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
    const deg = SWEEP_DEG * t
    if (deg < 0.5) return ''
    return arcPath(START_DEG, START_DEG + deg)
  })

  const display = $derived(
    Number.isFinite(value) ? parseFloat(value.toPrecision(4)).toString() : '—'
  )

  let dragging = $state(false)
  let dragStartY = 0
  let dragStartVal = 0

  function emit(raw) {
    const snapped = Math.round(raw / step) * step
    onchange(Math.max(min, Math.min(max, snapped)))
  }

  function onPointerDown(event) {
    if (event.button !== 0) return
    if (event.target.closest && event.target.closest('.mod-dot')) return
    dragging = true
    dragStartY = event.clientY
    dragStartVal = value
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  function onPointerMove(event) {
    if (!dragging) return
    const dy = dragStartY - event.clientY
    emit(dragStartVal + (dy / 150) * (max - min))
  }

  function onPointerUp() { dragging = false }

  function onDblClick() { emit((min + max) / 2) }
</script>

<div class="knob-wrap">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="knob-svg-wrap"
    class:dragging
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    ondblclick={onDblClick}
    role="slider"
    aria-valuemin={min}
    aria-valuemax={max}
    aria-valuenow={value}
    aria-label={label}
    tabindex="0"
  >
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">
      <path d={trackPath} fill="none" stroke="#263040" stroke-width="3.5" stroke-linecap="round" />
      {#if fillPath()}
        <path d={fillPath()} fill="none" stroke="#3b9eff" stroke-width="3.5" stroke-linecap="round" />
      {/if}
      <circle cx={CX} cy={CY} r="3.5" fill="#1e2a3a" stroke="#3b9eff44" stroke-width="1" />
    </svg>

    <button
      class="mod-dot"
      class:mod-dot-active={modActive}
      onclick={(e) => { e.stopPropagation(); onmod() }}
      title="Modulation"
      tabindex="-1"
      type="button"
    >M</button>
  </div>

  <span class="knob-val">{display}</span>
  <span class="knob-label">{label}</span>
</div>

<style>
  .knob-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    user-select: none;
  }

  .knob-svg-wrap {
    position: relative;
    width: 44px;
    height: 44px;
    cursor: ns-resize;
    border-radius: 50%;
    transition: filter 0.12s;
  }

  .knob-svg-wrap:focus { outline: none; filter: drop-shadow(0 0 4px #3b9eff88); }
  .knob-svg-wrap.dragging { filter: drop-shadow(0 0 5px #3b9effaa); }

  .mod-dot {
    position: absolute;
    bottom: -1px;
    right: -1px;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    border: 1px solid #263040;
    background: #161c26;
    color: #5a7080;
    font-size: 0.48rem;
    font-weight: 700;
    font-family: inherit;
    line-height: 1;
    display: grid;
    place-items: center;
    cursor: pointer;
    padding: 0;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }

  .mod-dot:hover { border-color: #3b9eff; color: #3b9eff; }
  .mod-dot-active { border-color: #3b9eff; background: #1a3a5c; color: #3b9eff; }

  .knob-val {
    font-size: 0.6rem;
    color: #c8d4e0;
    line-height: 1.2;
    margin-top: 2px;
    font-variant-numeric: tabular-nums;
  }

  .knob-label {
    font-size: 0.55rem;
    color: #5a7080;
    text-transform: lowercase;
    letter-spacing: 0.03em;
    line-height: 1.2;
    text-align: center;
    max-width: 52px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
