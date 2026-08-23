<script>
  // Small shared explanation dialog. Used by the graph scope guide (what each
  // SSTIM subgraph perspective is) and the data-source guide (what the
  // versioned vs. live layers mean). Deliberately minimal: no focus trap
  // library, just the behaviours a keyboard user actually needs — Esc to
  // close, backdrop click to close, and focus moved onto the panel on open.
  const { title, subtitle = '', open = false, onClose, children } = $props()

  let panel = $state(null)

  $effect(() => {
    if (open && panel) panel.focus()
  })

  function handleKeydown(event) {
    if (event.key !== 'Escape') return
    // stopImmediatePropagation, not stopPropagation: the graph and the top bar
    // register their own window-level Escape handlers, and plain propagation
    // control does not stop sibling listeners on the same element. Without
    // this, dismissing the dialog would also clear the graph selection.
    event.preventDefault()
    event.stopImmediatePropagation()
    onClose?.()
  }
</script>

<svelte:window onkeydown={open ? handleKeydown : undefined} />

{#if open}
  <!-- Clicking the backdrop itself closes; clicks that originate inside the
       panel have a different event.target and are ignored. Keyboard users get
       Esc via the window handler, so no key handler is needed here. -->
  <div
    class="info-overlay"
    role="presentation"
    onclick={(event) => { if (event.target === event.currentTarget) onClose?.() }}
  >
    <div
      class="info-panel"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabindex="-1"
      bind:this={panel}
    >
      <header class="info-header">
        <div>
          <h3>{title}</h3>
          {#if subtitle}<p class="info-subtitle">{subtitle}</p>{/if}
        </div>
        <button type="button" class="info-close" onclick={() => onClose?.()} aria-label="Close" title="Close (Esc)">✕</button>
      </header>
      <div class="info-body">
        {@render children?.()}
      </div>
    </div>
  </div>
{/if}

<style>
  .info-overlay {
    position: fixed;
    inset: 0;
    z-index: 120;
    background: #00000088;
    display: grid;
    place-items: center;
    padding: 1.5rem;
    backdrop-filter: blur(2px);
  }

  .info-panel {
    width: min(38rem, 100%);
    max-height: min(34rem, 80vh);
    display: flex;
    flex-direction: column;
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) + 2px);
    box-shadow: 0 1.5rem 3rem #0008;
    color: var(--app-text);
  }
  .info-panel:focus { outline: none; }

  .info-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.9rem 1rem 0.6rem;
    border-bottom: var(--app-border-width) solid var(--app-border);
  }

  .info-header h3 {
    margin: 0;
    font-size: 0.95rem;
    color: var(--app-text-strong);
  }

  .info-subtitle {
    margin: 0.25rem 0 0;
    font-size: 0.75rem;
    line-height: 1.4;
    color: var(--app-muted);
  }

  .info-close {
    flex-shrink: 0;
    width: 1.7rem;
    height: 1.7rem;
    margin: 0;
    padding: 0;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    background: transparent;
    color: var(--app-text);
    font-size: 0.8rem;
    line-height: 1;
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .info-close:hover {
    background: var(--app-accent-soft);
    border-color: var(--app-accent);
    color: var(--app-text-strong);
  }

  .info-body {
    overflow-y: auto;
    padding: 0.85rem 1rem 1rem;
    font-size: 0.82rem;
    line-height: 1.5;
  }
</style>
