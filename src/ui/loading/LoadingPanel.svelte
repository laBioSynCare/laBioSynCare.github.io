<script>
  // The loader for work that blocks the main thread.
  //
  // Building the knowledge graph is a few seconds of unavoidable synchronous
  // JavaScript — the cose layout in particular cannot be chunked. A loader made
  // of DOM that the main thread has to re-render freezes solid during exactly
  // the moments it exists to cover, which is what the Pico `aria-busy` spinner
  // did: a stopped spinner reads as a crashed page.
  //
  // So every moving part here animates **transform and opacity only**. Chrome
  // runs those on the compositor thread, which keeps ticking while the main
  // thread is locked. That is the whole design constraint: if you add a moving
  // element that animates width, top, background-position or anything else that
  // needs layout or paint, it will freeze and the loader stops doing its job.
  //
  // `progress` is deliberately nullable. During an atomic block there is no
  // honest fraction to report, and a bar that sits at 100% while the page is
  // still stuck is worse than one that admits it does not know.

  const {
    title = 'Loading',
    phase = '',
    detail = '',
    /** 0–1 for a known fraction, or null while the work is one atomic block. */
    progress = null,
  } = $props()

  const percent = $derived(
    progress == null ? null : Math.max(0, Math.min(1, progress)),
  )
</script>

<div class="loading-panel" role="status" aria-live="polite">
  <div class="spinner" aria-hidden="true"></div>

  <p class="title">{title}</p>
  {#if phase}<p class="phase">{phase}</p>{/if}

  <div
    class="track"
    role="progressbar"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow={percent == null ? undefined : Math.round(percent * 100)}
    aria-valuetext={percent == null ? 'Working' : `${Math.round(percent * 100)}%`}
  >
    {#if percent == null}
      <span class="sweep"></span>
    {:else}
      <span class="fill" style="transform: scaleX({percent})"></span>
    {/if}
  </div>

  {#if detail}<p class="detail">{detail}</p>{/if}
</div>

<style>
  .loading-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    width: 100%;
    margin: 0 auto;
    padding: 1.75rem 0.5rem;
    text-align: center;
    font-family: var(--app-font-ui, inherit);
  }

  /* A ring with one bright quadrant, rotating. Rotation is a transform, so it
     survives a blocked main thread; `will-change` asks for the compositing
     layer up front rather than at the moment the thread is already busy. */
  .spinner {
    width: 2.5rem;
    height: 2.5rem;
    margin-bottom: 1rem;
    border-radius: 50%;
    border: 3px solid color-mix(in srgb, var(--app-muted, #8292a7) 28%, transparent);
    border-top-color: var(--app-accent, #3b9eff);
    border-right-color: color-mix(in srgb, var(--app-accent, #3b9eff) 45%, transparent);
    will-change: transform;
    animation: spin 900ms linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .title {
    margin: 0;
    font-weight: 600;
    color: var(--app-text-strong, inherit);
  }

  .phase {
    margin: 0.15rem 0 0;
    font-size: 0.875rem;
    color: var(--app-muted, #8292a7);
  }

  .track {
    position: relative;
    width: 100%;
    height: 0.3rem;
    margin-top: 0.9rem;
    border-radius: 999px;
    overflow: hidden;
    background: color-mix(in srgb, var(--app-muted, #8292a7) 22%, transparent);
  }

  /* scaleX rather than width: the fraction only changes between blocks, but
     animating it on the compositor means the growth still eases smoothly when
     the next step lands right before a freeze. */
  .fill {
    position: absolute;
    inset: 0;
    transform-origin: left center;
    transform: scaleX(0);
    border-radius: inherit;
    background: var(--app-accent, #3b9eff);
    transition: transform 240ms ease-out;
    will-change: transform;
  }

  /* The part that carries an atomic block: it says "still working" for as long
     as no fraction can honestly be reported. */
  .sweep {
    position: absolute;
    inset: 0;
    width: 40%;
    border-radius: inherit;
    /* Full-strength accent, not a tint: the sweep has to read against a light
       track on the light skin and a dark one on the dark skin. */
    background: linear-gradient(
      90deg,
      transparent,
      var(--app-accent, #3b9eff),
      transparent
    );
    will-change: transform;
    animation: sweep 1.25s ease-in-out infinite;
  }

  @keyframes sweep {
    from { transform: translateX(-110%); }
    to   { transform: translateX(360%); }
  }

  .detail {
    margin: 0.7rem 0 0;
    font-size: 0.8125rem;
    color: var(--app-muted, #8292a7);
    font-variant-numeric: tabular-nums;
  }

  /* Reduced motion keeps the determinate bar — it still advances between
     phases, so the loader stays informative — and drops the perpetual motion. */
  @media (prefers-reduced-motion: reduce) {
    .spinner { animation: none; }
    /* The sweep is the only cue an indeterminate phase has, so it stays — but
       as a slow pulse in place rather than travel across the track. */
    .sweep {
      width: 100%;
      background: var(--app-accent, #3b9eff);
      animation: fade 2s ease-in-out infinite;
    }
    .fill { transition: none; }
  }

  @keyframes fade {
    0%, 100% { opacity: 0.25; }
    50%      { opacity: 0.7; }
  }
</style>
