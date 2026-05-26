<script>
  import { tick } from 'svelte'

  const {
    value = 0,
    min = 0,
    max = 1,
    step = 0.01,
    label = '',
    modActive = false,
    modAvailable = false,
    onmod = () => {},
    onchange = (_v) => {},
    liveValue = null,     // live/modulated value → shows dot on arc
    liveValueRef = null,  // reference for up/down color; null → uses `value`
    rangeLow = null,      // lower bound of modulation range band
    rangeHigh = null,     // upper bound of modulation range band
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

  function valueToDeg(v) {
    const t = Math.max(0, Math.min(1, (v - min) / (max - min)))
    return START_DEG + SWEEP_DEG * t
  }

  const bandPath = $derived(() => {
    if (rangeLow == null || rangeHigh == null) return ''
    const lo = Math.max(min, Math.min(max, rangeLow))
    const hi = Math.max(min, Math.min(max, rangeHigh))
    if (hi <= lo + 0.5) return ''
    return arcPath(valueToDeg(lo), valueToDeg(hi))
  })

  const liveDotXY = $derived(() => {
    if (liveValue == null) return null
    const v = Math.max(min, Math.min(max, liveValue))
    return polarToXY(valueToDeg(v))
  })

  const liveRef = $derived(liveValueRef ?? value)
  const liveUp = $derived(liveValue != null && liveValue > liveRef + 1e-6)
  const liveDown = $derived(liveValue != null && liveValue < liveRef - 1e-6)

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
  let fineDrag = $state(false)
  let dragStartY = 0
  let dragStartVal = 0
  let editing = $state(false)
  let editText = $state('')
  let editInput = $state(null)

  function emit(raw) {
    const snapped = Math.round(raw / step) * step
    onchange(Math.max(min, Math.min(max, snapped)))
  }

  function onPointerDown(event) {
    if (event.button !== 0) return
    if (event.target.closest && event.target.closest('.mod-dot')) return
    dragging = true
    fineDrag = event.shiftKey
    dragStartY = event.clientY
    dragStartVal = value
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  function onPointerMove(event) {
    if (!dragging) return
    const dy = dragStartY - event.clientY
    const dragPixels = fineDrag ? 1500 : 150
    emit(dragStartVal + (dy / dragPixels) * (max - min))
  }

  function onPointerUp() {
    dragging = false
    fineDrag = false
  }

  function onDblClick() { emit((min + max) / 2) }

  async function startEditing() {
    editText = Number.isFinite(value) ? parseFloat(value.toPrecision(6)).toString() : ''
    editing = true
    await tick()
    editInput?.focus()
    editInput?.select()
  }

  function commitEdit() {
    const parsed = Number(editText)
    if (Number.isFinite(parsed)) emit(parsed)
    editing = false
  }

  function cancelEdit() {
    editing = false
  }

  function onEditKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitEdit()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      cancelEdit()
    }
  }
</script>

<div class="knob-wrap">
  <span class="knob-label">{label}</span>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="knob-svg-wrap"
    class:dragging
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onpointercancel={onPointerUp}
    ondblclick={onDblClick}
    role="slider"
    aria-valuemin={min}
    aria-valuemax={max}
    aria-valuenow={value}
    aria-label={label}
    tabindex="0"
  >
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">
      {#if bandPath()}
        <path d={bandPath()} fill="none" stroke="var(--knob-band, #3b9eff2a)" stroke-width="5.5" stroke-linecap="round" />
      {/if}
      <path d={trackPath} fill="none" stroke="var(--knob-track, #263040)" stroke-width="3.5" stroke-linecap="round" />
      {#if fillPath()}
        <path d={fillPath()} fill="none" stroke="var(--acc, var(--app-accent, #3b9eff))" stroke-width="3.5" stroke-linecap="round" />
      {/if}
      <circle cx={CX} cy={CY} r="3.5" fill="var(--knob-center, #1e2a3a)" stroke="var(--knob-center-stroke, #3b9eff44)" stroke-width="1" />
      {#if liveDotXY()}
        <circle
          cx={liveDotXY().x}
          cy={liveDotXY().y}
          r="2.8"
          fill={liveUp ? 'var(--knob-live-up, #f5a623)' : liveDown ? 'var(--knob-live-dn, #e040fb)' : 'var(--knob-live-n, #8ea0b0)'}
        />
      {/if}
    </svg>

    {#if modAvailable}
      <button
        class="mod-dot"
        class:mod-dot-active={modActive}
        onclick={(e) => { e.stopPropagation(); onmod() }}
        title="Modulation"
        tabindex="-1"
        type="button"
      >M</button>
    {/if}
  </div>

  {#if editing}
    <input
      class="knob-val knob-val-input"
      bind:this={editInput}
      bind:value={editText}
      inputmode="decimal"
      aria-label={`${label} value`}
      onblur={commitEdit}
      onkeydown={onEditKeydown}
    />
  {:else}
    <button
      type="button"
      class="knob-val knob-val-button"
      title="Click to type a value. Shift-drag the knob for fine adjustment."
      onclick={startEditing}
    >{display}</button>
  {/if}
</div>

<style>
  .knob-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    width: 56px;
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

  .knob-svg-wrap:focus { outline: none; filter: drop-shadow(0 0 4px var(--knob-glow, #3b9eff88)); }
  .knob-svg-wrap.dragging { filter: drop-shadow(0 0 5px var(--knob-glow-strong, #3b9effaa)); }

  .mod-dot {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 17px;
    height: 17px;
    border-radius: 50%;
    border: 1px solid var(--knob-track, #263040);
    background: var(--knob-mod-bg, #161c26e8);
    color: var(--mut, var(--app-muted-2, #8ea0b0));
    font-size: 0.52rem;
    font-weight: 700;
    font-family: inherit;
    line-height: 1;
    display: grid;
    place-items: center;
    cursor: pointer;
    padding: 0;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }

  .mod-dot:hover {
    border-color: var(--acc, var(--app-accent, #3b9eff));
    color: var(--acc, var(--app-accent, #3b9eff));
  }
  .mod-dot-active {
    border-color: var(--acc, var(--app-accent, #3b9eff));
    background: var(--acc-s, var(--app-accent-soft, #1a3a5c));
    color: var(--acc, var(--app-accent, #3b9eff));
  }

  .knob-label {
    height: 14px;
    margin-bottom: 1px;
    font-size: 0.55rem;
    color: var(--mut, var(--app-muted-2, #5a7080));
    text-transform: lowercase;
    letter-spacing: 0.03em;
    line-height: 14px;
    text-align: center;
    max-width: 56px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .knob-val {
    box-sizing: border-box;
    width: 52px;
    height: 17px;
    margin: 2px 0 0;
    padding: 0 2px;
    border: 1px solid transparent;
    border-radius: 3px;
    background: transparent;
    font-size: 0.6rem;
    color: var(--txt, var(--app-text, #c8d4e0));
    line-height: 15px;
    font-variant-numeric: tabular-nums;
    font-family: inherit;
    text-align: center;
  }

  .knob-val-button {
    cursor: text;
  }

  .knob-val-button:hover {
    border-color: var(--knob-value-hover-border, #3b9eff66);
    background: var(--knob-value-hover-bg, #3b9eff14);
  }

  .knob-val-input {
    border-color: var(--acc, var(--app-accent, #3b9eff));
    background: var(--bg, var(--app-bg, #07111d));
    outline: none;
  }
</style>
