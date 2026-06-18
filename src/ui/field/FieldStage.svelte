<script>
  // Presentational render surface for the Sensory Field. The parent computes the
  // current colour and opacity (including the blink phase, driven from the audio
  // clock) and passes them in. Gated by the global visual-stimulation policy.
  let {
    color = '#000000',
    opacity = 1,
    active = true,
    fullscreen = false,
    depth = null,
    depthSeparationPx = 48,
    markerOffsetX = 0,
    markerOffsetY = 0,
  } = $props()

  const stereoPanels = $derived(buildStereoPanels(depth, depthSeparationPx))

  function buildStereoPanels(depthState, separation) {
    const half = Math.max(0, Number(separation) || 0) / 2
    const canonical = [
      { key: 'left', offset: -half, sign: -1 },
      { key: 'right', offset: half, sign: 1 },
    ]
    return depthState?.viewingMode === 'cross' ? [canonical[1], canonical[0]] : canonical
  }

  // Per-position parallax for static grid markers (px). Returns 0 when axis is 'none'.
  function gridMarkerParallax(pos, depthState) {
    const axis = depthState?.gridDepthAxis ?? 'none'
    const range = Number(depthState?.gridDepthRangePx) || 0
    if (axis === 'none' || range === 0) return 0
    const nx = (pos.x - 50) / 50  // -1 (left) … +1 (right)
    const ny = (pos.y - 50) / 50  // -1 (top)  … +1 (bottom)
    let t = 0
    if (axis === 'x') t = nx
    else if (axis === 'y') t = ny
    else if (axis === 'both') t = (nx + ny) / 2
    return t * range / 2
  }

  // Build NxN grid positions (percent), skipping the centre cell when N is odd.
  function buildGridPositions(size) {
    const n = Math.max(1, Math.min(7, Math.round(Number(size) || 3)))
    const positions = []
    for (let col = 1; col <= n; col++) {
      for (let row = 1; row <= n; row++) {
        // Centre cell: col = row = (n+1)/2, only exists when n is odd.
        if (2 * col === n + 1 && 2 * row === n + 1) continue
        positions.push({ x: 100 * col / (n + 1), y: 100 * row / (n + 1) })
      }
    }
    return positions
  }

  // 3×3 grid positions (percent) excluding the centre, which oscillates.
  const GRID_POSITIONS = $derived(buildGridPositions(depth?.gridSize ?? 3))

  const TWO_PI = Math.PI * 2

  // Compute N evenly-spaced phase samples of the full motion path (one period).
  // Returns [{x, y, offset}] in CSS pixels, where offset is the per-panel
  // stereo parallax at that phase.
  function buildTrajectoryPoints(d, sign) {
    const n = Math.max(3, Math.min(36, Math.round(Number(d?.markerTrajectorySteps) || 12)))
    const points = []
    for (let k = 0; k < n; k++) {
      const phi = (k / n) * TWO_PI
      const mx = (d?.markerMotionXSource && d.markerMotionXSource !== 'none')
        ? (d.markerMotionXAmplitudePx ?? 0) * Math.sin(phi) : 0
      const my = (d?.markerMotionYSource && d.markerMotionYSource !== 'none')
        ? (d.markerMotionYAmplitudePx ?? 0) * Math.sin(phi) : 0
      const cSrc = d?.markerMotionCircleSource ?? 'none'
      const cx = cSrc !== 'none' ? (d.markerMotionCircleAmplitudePx ?? 0) * Math.sin(phi) : 0
      const cy = cSrc !== 'none' ? (d.markerMotionCircleAmplitudePx ?? 0) * Math.cos(phi) : 0
      const baseSep = d?.baseSeparationPx ?? 48
      const zMod = (d?.source && d.source !== 'static') ? (d.modulationPx ?? 0) * Math.sin(phi) : 0
      const depthSep = Math.max(0, Math.min(160, baseSep + zMod))
      points.push({ x: mx + cx, y: my + cy, offset: sign * depthSep / 2 })
    }
    return points
  }

  const trajectoryByPanel = $derived(stereoPanels.map(p => buildTrajectoryPoints(depth, p.sign)))
</script>

{#if active}
  <div class="field-surface" class:fullscreen>
    <div class="field-fill" style="background:{color}; opacity:{opacity}"></div>
    {#if depth?.enabled}
      <div class="stereo-pair" aria-hidden="true">
        {#each stereoPanels as panel, pi}
          <div class="eye-pane" data-eye={panel.key} class:no-plane={depth.showCartesianPlane === false}>
            {#each GRID_POSITIONS as pos}
              <div class="grid-mark" style="--gx:{pos.x}%; --gy:{pos.y}%; --offset:{(panel.sign * gridMarkerParallax(pos, depth)).toFixed(1)}px; --dot-size:{depth.dotSizePx}px; --scale-x:{depth.gridDotScaleX ?? 1}; --scale-y:{depth.gridDotScaleY ?? 1}"></div>
            {/each}
            {#if depth.markerTrajectoryEnabled}
              {#each trajectoryByPanel[pi] as pt, k}
                <div class="traj-dot" style="--toffset:{pt.offset.toFixed(1)}px; --tx:{pt.x.toFixed(1)}px; --ty:{pt.y.toFixed(1)}px; --dot-size:{depth.dotSizePx}px; --op:{(0.2 + 0.7 * (k / Math.max(trajectoryByPanel[pi].length - 1, 1))).toFixed(2)}"></div>
              {/each}
            {:else}
              <div
                class="stereo-mark"
                style="--offset:{panel.offset}px; --dot-size:{depth.dotSizePx}px; --mx:{markerOffsetX}px; --my:{markerOffsetY}px"
              >
                <span class="stick"></span>
                <span class="point"></span>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
{:else}
  <div class="field-surface visual-off" class:fullscreen>
    <span>Visual stimulation is off</span>
  </div>
{/if}

<style>
  .field-surface {
    position: relative;
    width: 100%;
    height: 100%;
    background: #000;
    overflow: hidden;
    border-radius: var(--app-radius);
  }

  .field-surface.fullscreen {
    position: fixed;
    inset: 0;
    z-index: 200;
    border-radius: 0;
  }

  .field-fill {
    position: absolute;
    inset: 0;
    /* Snappy enough to track a blink but soft enough to avoid hard clicks. */
    transition: opacity 0.02s linear;
  }

  .stereo-pair {
    position: absolute;
    inset: clamp(0.75rem, 3vw, 2rem);
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: clamp(0.5rem, 3vw, 2rem);
    pointer-events: none;
  }

  .eye-pane {
    position: relative;
    min-width: 0;
    min-height: 0;
    border: 1px solid color-mix(in srgb, #fff 28%, transparent);
    background:
      linear-gradient(color-mix(in srgb, #fff 15%, transparent) 1px, transparent 1px),
      linear-gradient(90deg, color-mix(in srgb, #fff 15%, transparent) 1px, transparent 1px);
    background-size: 100% 50%, 50% 100%;
    overflow: hidden;
  }

  .grid-mark {
    position: absolute;
    left: var(--gx);
    top: var(--gy);
    width: calc(var(--dot-size) * var(--scale-x));
    height: calc(var(--dot-size) * var(--scale-y));
    border-radius: 999px;
    background: #fff;
    box-shadow: 0 0 18px color-mix(in srgb, #000 38%, transparent);
    transform: translate(calc(-50% + var(--offset)), -50%);
    opacity: 0.45;
  }

  .traj-dot {
    position: absolute;
    left: 50%;
    top: 50%;
    width: var(--dot-size);
    height: var(--dot-size);
    border-radius: 999px;
    background: #fff;
    box-shadow: 0 0 14px color-mix(in srgb, #000 38%, transparent);
    transform: translate(
      calc(-50% + var(--toffset) + var(--tx)),
      calc(-50% + var(--ty))
    );
    opacity: var(--op);
    pointer-events: none;
  }

  .eye-pane.no-plane {
    background: none;
  }

  .stereo-mark {
    position: absolute;
    left: 50%;
    top: 50%;
    width: var(--dot-size);
    height: calc(var(--dot-size) * 4);
    transform: translate(
      calc(-50% + var(--offset) + var(--mx, 0px)),
      calc(-50% + var(--my, 0px))
    );
  }

  .stick {
    position: absolute;
    left: 50%;
    top: 0;
    bottom: calc(var(--dot-size) * 0.65);
    width: max(2px, calc(var(--dot-size) * 0.16));
    border-radius: 999px;
    background: color-mix(in srgb, #fff 82%, transparent);
    transform: translateX(-50%);
    box-shadow: 0 0 18px color-mix(in srgb, #000 42%, transparent);
  }

  .point {
    position: absolute;
    left: 50%;
    bottom: 0;
    width: var(--dot-size);
    height: var(--dot-size);
    border-radius: 999px;
    background: #fff;
    transform: translateX(-50%);
    box-shadow: 0 0 18px color-mix(in srgb, #000 38%, transparent);
  }

  .visual-off {
    display: grid;
    place-items: center;
    background: var(--app-surface-2);
    border: 1px dashed var(--app-border);
  }

  .visual-off span {
    color: var(--app-muted);
    font-size: 0.78rem;
    letter-spacing: 0.02em;
  }
</style>
