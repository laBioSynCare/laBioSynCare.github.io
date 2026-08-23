<script>
  import { onMount, onDestroy } from 'svelte'
  import {
    acknowledgePhotoAdvisory,
    advisoryOpen,
    applyVisualStimulation,
    photoAdvisoryAcknowledged,
  } from './visualSafety.js'

  // Hidden until mounted so the prerendered/SSR HTML never flashes the modal.
  let show = $state(false)
  let forced = $state(false)

  const unsub = advisoryOpen.subscribe((v) => { forced = v })
  onDestroy(unsub)

  onMount(() => {
    if (!photoAdvisoryAcknowledged()) show = true
  })

  const visible = $derived(show || forced)

  function dismiss() {
    acknowledgePhotoAdvisory()
    show = false
    advisoryOpen.set(false)
  }

  function turnOff() {
    applyVisualStimulation(false)
    dismiss()
  }
</script>

{#if visible}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="advisory-overlay" role="presentation">
    <div class="advisory-card" role="dialog" aria-modal="true" aria-labelledby="advisory-title" tabindex="-1">
      <div class="advisory-icon" aria-hidden="true">⚠</div>
      <h2 id="advisory-title">Visual stimulation &amp; photosensitivity</h2>
      <p>
        Some visual content on this platform flashes, flickers, or moves. If you
        have photosensitive epilepsy or are sensitive to flashing light, please
        be careful — consider seeking professional guidance before use, or turn
        visual stimulation off.
      </p>
      <p class="advisory-note">
        You can enable or disable all visual stimulation at any time in Settings.
      </p>
      <div class="advisory-actions">
        <button type="button" class="advisory-off" onclick={turnOff}>Turn visual stimulation off</button>
        <button type="button" class="advisory-continue" onclick={dismiss}>Continue</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .advisory-overlay {
    position: fixed;
    inset: 0;
    z-index: 400;
    background: rgba(0 0 0 / 0.78);
    display: grid;
    place-items: center;
    padding: 1.25rem;
    backdrop-filter: blur(2px);
  }

  .advisory-card {
    width: min(30rem, 100%);
    background: var(--app-surface);
    color: var(--app-text);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) + 4px);
    padding: 1.5rem 1.5rem 1.25rem;
    box-shadow: 0 1.5rem 3rem #00000066;
    text-align: center;
  }

  .advisory-icon {
    font-size: 2rem;
    line-height: 1;
    color: var(--app-warn);
  }

  .advisory-card h2 {
    margin: 0.6rem 0 0.7rem;
    font-size: 1.15rem;
    color: var(--app-text-strong);
  }

  .advisory-card p {
    margin: 0 0 0.6rem;
    font-size: 0.9rem;
    line-height: 1.55;
    color: var(--app-text);
  }

  .advisory-note {
    color: var(--app-muted);
    font-size: 0.82rem !important;
  }

  .advisory-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    justify-content: center;
    margin-top: 1rem;
  }

  .advisory-actions button {
    flex: 1 1 12rem;
    margin: 0;
    padding: 0.55rem 0.9rem;
    border-radius: var(--app-radius);
    font-size: 0.86rem;
    font-weight: 700;
    cursor: pointer;
  }

  .advisory-continue {
    background: var(--app-accent);
    border: none;
    color: #fff;
  }
  .advisory-continue:hover { filter: brightness(1.12); }

  .advisory-off {
    background: transparent;
    border: 1px solid var(--app-border);
    color: var(--app-text);
  }
  .advisory-off:hover { background: var(--app-surface-2); border-color: var(--app-warn); color: var(--app-warn); }
</style>
