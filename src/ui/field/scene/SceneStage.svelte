<script>
  // Generic spatial render surface. Draws any scene (segments / dots / polys in
  // 3D — see sceneGeom.js) in mono or through three depth techniques: a free-view
  // stereo pair, an anaglyph, and a random-dot autostereogram. Each primitive carries its own
  // colour; when depth shading is on, every colour is tinted toward a near/far
  // gradient by its rotated z. Gated by the parent via `active`.
  import {
    project, disparity, sceneExtent, sceneFitScale, rotatedSceneBounds, depthTint,
    normalizeDepth, buildAutostereogram,
  } from './sceneGeom.js'

  let {
    scene = { background: '#07090c', segments: [], dots: [], polys: [] },
    mode = 'stereo-pair',
    viewingMode = 'parallel',
    theta = 0,
    zoom = 1,
    depthScalePx = 60,
    strokeWidth = 1,
    depthColor = { enabled: false, near: '#ffe7a8', far: '#274b73', strength: 0.75 },
    active = true,
  } = $props()

  let boxW = $state(0)
  let boxH = $state(0)
  let canvas = $state(null)

  const GAP = 16
  const paneW = $derived(mode === 'stereo-pair' ? Math.max(1, (boxW - GAP) / 2) : Math.max(1, boxW))
  const paneH = $derived(Math.max(1, boxH))
  // Nothing draws until the surface is measured (a 0×0 viewBox would explode
  // primitive sizes and flood the pane).
  const ready = $derived(boxW > 2 && boxH > 2)

  // Yaw-invariant orthographic fit: scale so the scene never clips at any yaw.
  const extent = $derived(sceneExtent(scene))
  const scale = $derived(sceneFitScale(paneW, paneH, extent, zoom))
  const cx = $derived(paneW / 2)
  const cy = $derived(paneH / 2 + scale * ((extent.minY + extent.maxY) / 2))

  const eyeX = (x, z, sign) => x + (sign * disparity(z, depthScalePx)) / 2
  const primitiveOpacity = (value) => Math.min(1, Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 1))

  // Depth bounds at the current yaw (only when shading is on); turns with the scene.
  const depthBounds = $derived(depthColor?.enabled ? rotatedSceneBounds(scene, theta) : null)
  const tint = (z, base) => depthTint(z, depthBounds, depthColor, base)

  // Project the whole scene to a single depth-sorted (far → near) draw list, so
  // nearer primitives overlap farther ones in the vector modes. Disparity is
  // applied per vertex at render time via eyeX.
  const drawList = $derived(buildDrawList(scene))
  function buildDrawList(sc) {
    const opts = { cx, cy, scale, theta }
    const items = []
    for (const s of sc.segments ?? []) {
      const a = project(s.a, opts)
      const b = project(s.b, opts)
      items.push({
        kind: 'seg', ax: a.sx, ay: a.sy, az: a.z, bx: b.sx, by: b.sy, bz: b.z,
        z: (a.z + b.z) / 2, color: s.color, width: Math.max(0.6, (s.width ?? 0.01) * scale * strokeWidth),
        opacity: primitiveOpacity(s.opacity), blend: s.blend ?? 'normal',
      })
    }
    for (const d of sc.dots ?? []) {
      const p = project(d, opts)
      items.push({
        kind: 'dot', x: p.sx, y: p.sy, z: p.z,
        rx: Math.max(1, (d.rx ?? d.r ?? 0.01) * scale),
        ry: Math.max(1, (d.ry ?? d.r ?? 0.01) * scale),
        fill: d.fill, stroke: d.stroke, strokeWidth: d.strokeWidth ? Math.max(0.5, d.strokeWidth * scale * strokeWidth) : 0,
        opacity: primitiveOpacity(d.opacity), blend: d.blend ?? 'normal',
      })
    }
    for (const poly of sc.polys ?? []) {
      let zc = 0
      const pts = poly.pts.map((pt) => {
        const p = project(pt, opts)
        zc += p.z
        return { sx: p.sx, sy: p.sy, z: p.z }
      })
      zc /= poly.pts.length || 1
      items.push({
        kind: 'poly', pts, z: zc, fill: poly.fill, stroke: poly.stroke,
        strokeWidth: poly.strokeWidth ? Math.max(0.5, poly.strokeWidth * scale * strokeWidth) : 0,
        closed: poly.closed !== false, opacity: primitiveOpacity(poly.opacity), blend: poly.blend ?? 'normal',
      })
    }
    items.sort((p, q) => p.z - q.z)
    return items
  }

  function polyPath(pts, sign, closed) {
    let d = ''
    for (let i = 0; i < pts.length; i++) {
      d += (i === 0 ? 'M' : 'L') + eyeX(pts[i].sx, pts[i].z, sign).toFixed(1) + ',' + pts[i].sy.toFixed(1)
    }
    return closed ? d + 'Z' : d
  }

  const hasFill = (c) => c && c !== 'none'

  // ── Autostereogram ──────────────────────────────────────────────────────────
  // Rasterise the scene to a per-pixel depth buffer (grayscale ∝ rotated depth),
  // then run the SIRDS kernel. Recomputed reactively, off the per-frame path.
  $effect(() => {
    if (mode !== 'autostereogram' || !canvas || !active) return
    const w = Math.max(1, Math.round(Math.min(boxW, 900)))
    const h = Math.max(1, Math.round(Math.min(boxH, 600)))
    if (w < 2 || h < 2) return
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rb = rotatedSceneBounds(scene, theta)
    const ext = sceneExtent(scene)
    const dScale = sceneFitScale(w, h, ext, zoom)
    const dcx = w / 2
    const dcy = h / 2 + dScale * ((ext.minY + ext.maxY) / 2)
    const o = { cx: dcx, cy: dcy, scale: dScale, theta }
    const gray = (z) => { const g = Math.round(255 * normalizeDepth(z, rb.minZ, rb.maxZ)); return `rgb(${g},${g},${g})` }

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)
    ctx.lineCap = 'round'

    // Collect every primitive with its depth, then paint far → near so nearer
    // objects (brighter in the depth buffer) correctly overwrite farther ones.
    const drawers = []
    for (const poly of scene.polys ?? []) {
      const proj = poly.pts.map((pt) => project(pt, o))
      const zc = proj.reduce((sum, p) => sum + p.z, 0) / (proj.length || 1)
      drawers.push({ z: zc, fn: () => {
        ctx.globalAlpha = primitiveOpacity(poly.opacity)
        ctx.beginPath()
        proj.forEach((p, i) => (i === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy)))
        if (poly.closed !== false) ctx.closePath()
        if (hasFill(poly.fill)) { ctx.fillStyle = gray(zc); ctx.fill() }
        if (hasFill(poly.stroke)) { ctx.strokeStyle = gray(zc); ctx.lineWidth = Math.max(1.5, (poly.strokeWidth ?? 0.01) * dScale); ctx.stroke() }
      } })
    }
    for (const s of scene.segments ?? []) {
      const a = project(s.a, o)
      const b = project(s.b, o)
      const zc = (a.z + b.z) / 2
      drawers.push({ z: zc, fn: () => {
        ctx.globalAlpha = primitiveOpacity(s.opacity)
        ctx.strokeStyle = gray(zc)
        ctx.lineWidth = Math.max(1.5, (s.width ?? 0.01) * dScale)
        ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke()
      } })
    }
    for (const d of scene.dots ?? []) {
      const p = project(d, o)
      drawers.push({ z: p.z, fn: () => {
        ctx.globalAlpha = primitiveOpacity(d.opacity)
        ctx.fillStyle = gray(p.z)
        ctx.beginPath()
        ctx.ellipse(
          p.sx,
          p.sy,
          Math.max(1.5, (d.rx ?? d.r ?? 0.01) * dScale),
          Math.max(1.5, (d.ry ?? d.r ?? 0.01) * dScale),
          0,
          0,
          Math.PI * 2,
        )
        ctx.fill()
      } })
    }
    drawers.sort((p, q) => p.z - q.z)
    for (const dr of drawers) dr.fn()
    ctx.globalAlpha = 1

    const img = ctx.getImageData(0, 0, w, h)
    const depth = new Float32Array(w * h)
    for (let i = 0; i < depth.length; i++) depth[i] = img.data[i * 4] / 255
    const eyeSep = Math.max(40, Math.min(160, Math.round(w / 8)))
    const depthFactor = 0.18 + 0.55 * Math.min(1, depthScalePx / 160)
    const pixels = buildAutostereogram(depth, { width: w, height: h, eyeSepPx: eyeSep, depthFactor, seed: 1 })
    ctx.putImageData(new ImageData(pixels, w, h), 0, 0)
  })

  const surfaceBg = $derived(mode === 'anaglyph' ? '#000000' : (scene.background || '#07090c'))
</script>

{#if active}
  <div class="scene-surface" style="background:{surfaceBg}" bind:clientWidth={boxW} bind:clientHeight={boxH}>
    {#if !ready}
      <!-- waiting for the surface to be measured -->
    {:else if mode === 'autostereogram'}
      <canvas bind:this={canvas} class="asg-canvas"></canvas>
    {:else if mode === 'anaglyph'}
      <!-- Red/cyan channels: dots are filled, everything else outlined, so a busy
           scene fuses cleanly instead of becoming a red/cyan mush. -->
      <svg class="pane anaglyph" viewBox={`0 0 ${paneW} ${paneH}`} preserveAspectRatio="none" aria-hidden="true">
        {#each [{ sign: -1, color: '#ff2b2b' }, { sign: 1, color: '#2bffff' }] as ch}
          <g style="mix-blend-mode: screen">
            {#each drawList as it}
              {#if it.kind === 'seg'}
                <line x1={eyeX(it.ax, it.az, ch.sign)} y1={it.ay} x2={eyeX(it.bx, it.bz, ch.sign)} y2={it.by} stroke={ch.color} stroke-width={it.width} stroke-linecap="round" opacity={it.opacity} style={`mix-blend-mode:${it.blend}`} />
              {:else if it.kind === 'poly'}
                <path d={polyPath(it.pts, ch.sign, it.closed)} fill="none" stroke={ch.color} stroke-width={Math.max(1, it.strokeWidth || 1.4)} stroke-linejoin="round" opacity={it.opacity} style={`mix-blend-mode:${it.blend}`} />
              {:else}
                <ellipse cx={eyeX(it.x, it.z, ch.sign)} cy={it.y} rx={it.rx} ry={it.ry} fill={ch.color} opacity={it.opacity} style={`mix-blend-mode:${it.blend}`} />
              {/if}
            {/each}
          </g>
        {/each}
      </svg>
    {:else if mode === 'mono'}
      <svg class="pane mono" viewBox={`0 0 ${paneW} ${paneH}`} preserveAspectRatio="none" aria-hidden="true">
        {#each drawList as it}
          {#if it.kind === 'seg'}
            <line x1={it.ax} y1={it.ay} x2={it.bx} y2={it.by} stroke={tint(it.z, it.color)} stroke-width={it.width} stroke-linecap="round" opacity={it.opacity} style={`mix-blend-mode:${it.blend}`} />
          {:else if it.kind === 'poly'}
            <path d={polyPath(it.pts, 0, it.closed)} fill={hasFill(it.fill) ? tint(it.z, it.fill) : 'none'} stroke={hasFill(it.stroke) ? tint(it.z, it.stroke) : 'none'} stroke-width={it.strokeWidth || 1} stroke-linejoin="round" opacity={it.opacity} style={`mix-blend-mode:${it.blend}`} />
          {:else}
            <ellipse cx={it.x} cy={it.y} rx={it.rx} ry={it.ry} fill={hasFill(it.fill) ? tint(it.z, it.fill) : 'none'} stroke={hasFill(it.stroke) ? tint(it.z, it.stroke) : 'none'} stroke-width={it.strokeWidth || 0} opacity={it.opacity} style={`mix-blend-mode:${it.blend}`} />
          {/if}
        {/each}
      </svg>
    {:else}
      <div class="stereo-pair" aria-hidden="true">
        {#each (viewingMode === 'cross' ? [{ key: 'right', sign: 1 }, { key: 'left', sign: -1 }] : [{ key: 'left', sign: -1 }, { key: 'right', sign: 1 }]) as pane}
          <svg class="pane eye-pane" data-eye={pane.key} viewBox={`0 0 ${paneW} ${paneH}`} preserveAspectRatio="none">
            {#each drawList as it}
              {#if it.kind === 'seg'}
                <line x1={eyeX(it.ax, it.az, pane.sign)} y1={it.ay} x2={eyeX(it.bx, it.bz, pane.sign)} y2={it.by} stroke={tint(it.z, it.color)} stroke-width={it.width} stroke-linecap="round" opacity={it.opacity} style={`mix-blend-mode:${it.blend}`} />
              {:else if it.kind === 'poly'}
                <path d={polyPath(it.pts, pane.sign, it.closed)} fill={hasFill(it.fill) ? tint(it.z, it.fill) : 'none'} stroke={hasFill(it.stroke) ? tint(it.z, it.stroke) : 'none'} stroke-width={it.strokeWidth || 1} stroke-linejoin="round" opacity={it.opacity} style={`mix-blend-mode:${it.blend}`} />
              {:else}
                <ellipse cx={eyeX(it.x, it.z, pane.sign)} cy={it.y} rx={it.rx} ry={it.ry} fill={hasFill(it.fill) ? tint(it.z, it.fill) : 'none'} stroke={hasFill(it.stroke) ? tint(it.z, it.stroke) : 'none'} stroke-width={it.strokeWidth || 0} opacity={it.opacity} style={`mix-blend-mode:${it.blend}`} />
              {/if}
            {/each}
          </svg>
        {/each}
      </div>
    {/if}
  </div>
{:else}
  <div class="scene-surface visual-off">
    <span>Visual stimulation is off</span>
  </div>
{/if}

<style>
  .scene-surface {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: var(--app-radius);
  }

  .stereo-pair {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .pane { width: 100%; height: 100%; display: block; }

  .eye-pane {
    /* Neutral grid + frame visible on both light and dark backgrounds, to aid
       free-view fusion. */
    border: 1px solid rgba(128, 128, 128, 0.45);
    background:
      linear-gradient(rgba(128, 128, 128, 0.16) 1px, transparent 1px),
      linear-gradient(90deg, rgba(128, 128, 128, 0.16) 1px, transparent 1px);
    background-size: 100% 50%, 50% 100%;
  }

  .asg-canvas { display: block; width: 100%; height: 100%; }

  .visual-off {
    display: grid;
    place-items: center;
    background: var(--app-surface-2);
    border: 1px dashed var(--app-border);
  }
  .visual-off span { color: var(--app-muted); font-size: 0.78rem; letter-spacing: 0.02em; }
</style>
