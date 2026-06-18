<script>
  // Presentational render surface for the Stereoscopic Tree. The parent passes a
  // generated 3D tree and the current yaw (driven from the free-running visual
  // clock); this component projects it to screen and draws it through one of
  // three stereoscopic techniques. Gated by the global visual-stimulation policy
  // via the `active` prop, mirroring FieldStage.svelte.
  import { project, disparity, normalizeDepth, buildAutostereogram } from './treeModel.js'

  let {
    tree = { branches: [], roots: [], leaves: [] },
    mode = 'stereo-pair',
    viewingMode = 'parallel',
    theta = 0,
    zoom = 1,
    depthScalePx = 60,
    strokeWidth = 1,
    showLeaves = true,
    showRoots = true,
    active = true,
  } = $props()

  // Measured surface size (client-side; 0 during prerender, which is fine —
  // nothing fuses until the browser lays the element out).
  let boxW = $state(0)
  let boxH = $state(0)
  let canvas = $state(null)

  const GAP = 16 // px gutter between the two stereo panels (matches .stereo-pair)

  // Per-pane geometry. Stereo-pair uses two equal panels side by side; the other
  // modes use the full surface.
  const paneW = $derived(mode === 'stereo-pair' ? Math.max(1, (boxW - GAP) / 2) : Math.max(1, boxW))
  const paneH = $derived(Math.max(1, boxH))
  // Nothing draws until the surface has a real measured size: projecting into a
  // 0×0 viewBox would clamp every leaf radius to a full unit and flood the pane.
  const ready = $derived(boxW > 2 && boxH > 2)

  // Orthographic fit: scale px/unit from the smaller axis, centre lowered so the
  // canopy and the roots both fit. zoom is the user multiplier.
  const scale = $derived(Math.min(paneH / 2.7, paneW / 2.2) * zoom)
  const cx = $derived(paneW / 2)
  const cy = $derived(paneH * 0.6)

  // Project every segment/leaf to base screen coords (no disparity yet) + rotated
  // depth z. Shared by all three renderers.
  function projectSegments(segs) {
    const out = []
    for (const s of segs) {
      const a = project(s.a, { cx, cy, scale, theta })
      const b = project(s.b, { cx, cy, scale, theta })
      out.push({ ax: a.sx, ay: a.sy, az: a.z, bx: b.sx, by: b.sy, bz: b.z })
    }
    return out
  }

  // Stroke widths (px) for the vector renderers, scaled by the user control.
  const branchStroke = $derived((1.9 * strokeWidth).toFixed(2))
  const rootStroke = $derived((1.4 * strokeWidth).toFixed(2))
  function projectLeaves(leaves) {
    return leaves.map((l) => {
      const p = project(l, { cx, cy, scale, theta })
      return { x: p.sx, y: p.sy, z: p.z, r: Math.max(1, l.r * scale) }
    })
  }

  const projBranches = $derived(projectSegments(tree.branches))
  const projRoots = $derived(showRoots ? projectSegments(tree.roots) : [])
  const projLeaves = $derived(showLeaves ? projectLeaves(tree.leaves) : [])

  // Stereo panels: canonical left/right; cross-eye swaps the order (FieldStage
  // convention). `sign` shifts each vertex by sign * disparity/2.
  const panes = $derived(
    viewingMode === 'cross'
      ? [{ key: 'right', sign: 1 }, { key: 'left', sign: -1 }]
      : [{ key: 'left', sign: -1 }, { key: 'right', sign: 1 }],
  )

  const eyeX = (x, z, sign) => x + (sign * disparity(z, depthScalePx)) / 2

  // Build an SVG path covering every segment, each endpoint shifted by the eye
  // disparity. One path keeps the DOM light versus a node per segment.
  function segPath(segs, sign) {
    let d = ''
    for (const s of segs) {
      d += `M${eyeX(s.ax, s.az, sign).toFixed(1)},${s.ay.toFixed(1)}L${eyeX(s.bx, s.bz, sign).toFixed(1)},${s.by.toFixed(1)}`
    }
    return d
  }

  // ── Autostereogram ──────────────────────────────────────────────────────────
  // Rasterise the tree to a per-pixel depth buffer (grayscale ∝ normalised
  // depth), then run the single-image random-dot algorithm and blit. Recomputed
  // reactively; kept off the per-frame path unless inputs change.
  $effect(() => {
    if (mode !== 'autostereogram' || !canvas || !active) return
    const w = Math.max(1, Math.round(Math.min(boxW, 900)))
    const h = Math.max(1, Math.round(Math.min(boxH, 600)))
    if (w < 2 || h < 2) return
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Depth bounds across the rotated tree so the mapping uses the full range.
    const rb = rotatedBounds(tree, theta)
    const depthCx = w / 2
    const depthCy = h * 0.6
    const depthScale = Math.min(h / 2.7, w / 2.2) * zoom

    // 1) draw a grayscale depth map (near = white) on the canvas itself.
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)
    ctx.lineCap = 'round'
    const drawSeg = (s) => {
      const a = project(s.a, { cx: depthCx, cy: depthCy, scale: depthScale, theta })
      const b = project(s.b, { cx: depthCx, cy: depthCy, scale: depthScale, theta })
      const g = Math.round(255 * normalizeDepth((a.z + b.z) / 2, rb.minZ, rb.maxZ))
      ctx.strokeStyle = `rgb(${g},${g},${g})`
      ctx.lineWidth = Math.max(1.5, s.width * depthScale * strokeWidth)
      ctx.beginPath()
      ctx.moveTo(a.sx, a.sy)
      ctx.lineTo(b.sx, b.sy)
      ctx.stroke()
    }
    for (const s of tree.branches) drawSeg(s)
    if (showRoots) for (const s of tree.roots) drawSeg(s)
    if (showLeaves) {
      for (const l of tree.leaves) {
        const p = project(l, { cx: depthCx, cy: depthCy, scale: depthScale, theta })
        const g = Math.round(255 * normalizeDepth(p.z, rb.minZ, rb.maxZ))
        ctx.fillStyle = `rgb(${g},${g},${g})`
        ctx.beginPath()
        ctx.arc(p.sx, p.sy, Math.max(1.5, l.r * depthScale), 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // 2) read it back as a [0,1] depth buffer (red channel = grayscale).
    const img = ctx.getImageData(0, 0, w, h)
    const depth = new Float32Array(w * h)
    for (let i = 0; i < depth.length; i++) depth[i] = img.data[i * 4] / 255

    // 3) build the autostereogram and paint it.
    const eyeSep = Math.max(40, Math.min(160, Math.round(w / 8)))
    const depthFactor = 0.18 + 0.55 * Math.min(1, depthScalePx / 160)
    const pixels = buildAutostereogram(depth, { width: w, height: h, eyeSepPx: eyeSep, depthFactor, seed: 1 })
    ctx.putImageData(new ImageData(pixels, w, h), 0, 0)
  })

  function rotatedBounds(t, th) {
    // Project depth at the current yaw to find min/max z (orthographic, scale 1).
    let minZ = Infinity
    let maxZ = -Infinity
    const acc = (p) => {
      const z = project(p, { theta: th }).z
      if (z < minZ) minZ = z
      if (z > maxZ) maxZ = z
    }
    for (const s of t.branches) { acc(s.a); acc(s.b) }
    for (const s of t.roots) { acc(s.a); acc(s.b) }
    for (const l of t.leaves) acc(l)
    if (!(maxZ > minZ)) { minZ = -1; maxZ = 1 }
    return { minZ, maxZ }
  }
</script>

{#if active}
  <div class="tree-surface" class:single={mode !== 'stereo-pair'} bind:clientWidth={boxW} bind:clientHeight={boxH}>
    {#if !ready}
      <!-- waiting for the surface to be measured -->
    {:else if mode === 'autostereogram'}
      <canvas bind:this={canvas} class="asg-canvas"></canvas>
    {:else if mode === 'anaglyph'}
      <svg class="pane anaglyph" viewBox={`0 0 ${paneW} ${paneH}`} preserveAspectRatio="none" aria-hidden="true">
        {#each [{ sign: -1, color: '#ff2b2b' }, { sign: 1, color: '#2bffff' }] as ch}
          <g style="mix-blend-mode: screen">
            {#if showRoots}<path d={segPath(projRoots, ch.sign)} stroke={ch.color} stroke-width={rootStroke} fill="none" stroke-linecap="round" />{/if}
            <path d={segPath(projBranches, ch.sign)} stroke={ch.color} stroke-width={branchStroke} fill="none" stroke-linecap="round" />
            {#if showLeaves}
              {#each projLeaves as l}
                <circle cx={eyeX(l.x, l.z, ch.sign)} cy={l.y} r={l.r} fill={ch.color} />
              {/each}
            {/if}
          </g>
        {/each}
      </svg>
    {:else}
      <div class="stereo-pair" aria-hidden="true">
        {#each panes as pane}
          <svg class="pane eye-pane" data-eye={pane.key} viewBox={`0 0 ${paneW} ${paneH}`} preserveAspectRatio="none">
            {#if showRoots}
              <path d={segPath(projRoots, pane.sign)} class="root" fill="none" stroke-width={rootStroke} />
            {/if}
            <path d={segPath(projBranches, pane.sign)} class="branch" fill="none" stroke-width={branchStroke} />
            {#if showLeaves}
              {#each projLeaves as l}
                <circle cx={eyeX(l.x, l.z, pane.sign)} cy={l.y} r={l.r} class="leaf" />
              {/each}
            {/if}
          </svg>
        {/each}
      </div>
    {/if}
  </div>
{:else}
  <div class="tree-surface visual-off">
    <span>Visual stimulation is off</span>
  </div>
{/if}

<style>
  .tree-surface {
    position: relative;
    width: 100%;
    height: 100%;
    background: #07090c;
    overflow: hidden;
    border-radius: var(--app-radius);
  }

  .stereo-pair {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    padding: 0;
  }

  .pane {
    width: 100%;
    height: 100%;
    display: block;
  }

  .eye-pane {
    border: 1px solid color-mix(in srgb, #fff 24%, transparent);
    background:
      linear-gradient(color-mix(in srgb, #fff 9%, transparent) 1px, transparent 1px),
      linear-gradient(90deg, color-mix(in srgb, #fff 9%, transparent) 1px, transparent 1px);
    background-size: 100% 50%, 50% 100%;
  }

  .anaglyph { background: #000; }

  .asg-canvas {
    display: block;
    width: 100%;
    height: 100%;
  }

  .branch { stroke: #d8c4a0; stroke-linecap: round; }
  .root { stroke: #9c8161; stroke-linecap: round; }
  .leaf { fill: #8ccb6f; }

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
