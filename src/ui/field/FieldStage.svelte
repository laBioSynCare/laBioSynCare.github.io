<script>
  // Presentational render surface for the Sensory Field. The parent computes the
  // current colour and opacity (including the blink phase, driven from the audio
  // clock) and passes them in. Gated by the global visual-stimulation policy.
  let { color = '#000000', opacity = 1, active = true, fullscreen = false } = $props()
</script>

{#if active}
  <div class="field-surface" class:fullscreen>
    <div class="field-fill" style="background:{color}; opacity:{opacity}"></div>
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
