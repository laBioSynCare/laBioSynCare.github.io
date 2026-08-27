<script>
  // "This project has a new home", shown once on the superseded origin.
  //
  // Deliberately not a redirect. This address keeps serving the archived
  // releases that only resolve from an origin root, and browser storage is
  // per-origin, so bouncing people to the new site would cut them off from
  // logbooks and patches they can only export from here. So: inform, link, and
  // get out of the way.
  //
  // The primary action is the transition guide rather than the new site, for
  // the same reason. Someone who follows a bare link to the new address and
  // finds their work missing has been served worse than someone who reads one
  // paragraph first.
  import { onMount } from 'svelte'
  import { applicationRoute } from '../../config/applicationUrls.js'
  import { CURRENT_HOME, isSupersededOrigin } from '../../config/publicationOrigins.js'

  const DISMISSED_KEY = 'bsclab.originMoved.dismissed.v1'

  // Fallback when storage is unavailable (private windows, blocked site data):
  // the notice then shows once per page load rather than never or forever.
  let dismissedThisLoad = false

  let open = $state(false)
  // $state because the focus effect reads it; a plain `let` would not retrigger.
  let dialog = $state(null)

  function readDismissed() {
    try {
      return localStorage.getItem(DISMISSED_KEY) === 'true'
    } catch {
      return dismissedThisLoad
    }
  }

  function close() {
    open = false
    dismissedThisLoad = true
    try {
      localStorage.setItem(DISMISSED_KEY, 'true')
    } catch {
      // Storage is not required for the notice to have been seen.
    }
  }

  onMount(() => {
    if (!isSupersededOrigin(window.location.origin)) return
    if (readDismissed()) return
    open = true
  })

  $effect(() => {
    if (open) dialog?.focus()
  })

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) close()
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') close()
  }
</script>

{#if open}
  <div class="moved-overlay" role="presentation" onclick={handleOverlayClick} onkeydown={handleKeydown}>
    <div
      bind:this={dialog}
      class="moved-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="moved-heading"
      tabindex="-1"
    >
      <h2 id="moved-heading">SSTIM Workbench has a new home</h2>

      <p>
        The project is now published at
        <a href={CURRENT_HOME} rel="external">w3c-cg.github.io/sstim</a>, under the
        W3C Sensory Stimulation Vocabulary Community Group. New work should happen there.
      </p>

      <p>
        <strong>This address stays online.</strong> It still serves the archived
        releases and the persistent identifiers that point at them, so nothing you
        have cited or linked will break.
      </p>

      <p>
        <strong>Your work does not follow automatically.</strong> Browsers keep
        storage separate per address, so your logbooks, patches, annotations and
        preferences live here and not there. Carrying them across takes two clicks
        and a file.
      </p>

      <div class="moved-actions">
        <a class="moved-primary" href={applicationRoute('/transition/')} onclick={close}>
          How to carry your data across
        </a>
        <a class="moved-secondary" href={CURRENT_HOME} rel="external">Go to the new site</a>
        <button type="button" class="moved-dismiss" onclick={close}>Stay here for now</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .moved-overlay {
    position: fixed;
    inset: 0;
    z-index: 300;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: #00000066;
  }

  .moved-card {
    width: min(34rem, 100%);
    max-height: 90vh;
    overflow-y: auto;
    padding: 1.5rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) * 2);
    background: var(--app-surface);
    color: var(--app-text);
    font-family: var(--app-font-ui);
  }

  .moved-card:focus {
    outline: none;
  }

  h2 {
    margin: 0 0 0.9rem;
    color: var(--app-text-strong);
    font-size: 1.25rem;
  }

  p {
    margin: 0 0 0.85rem;
    font-size: 0.95rem;
    line-height: 1.55;
  }

  .moved-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-top: 1.25rem;
  }

  .moved-primary,
  .moved-secondary,
  .moved-dismiss {
    padding: 0.5rem 0.9rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    font: inherit;
    font-size: 0.9rem;
    text-decoration: none;
    cursor: pointer;
  }

  .moved-primary {
    border-color: var(--app-accent);
    background: var(--app-accent);
    color: var(--app-bg);
  }

  .moved-secondary {
    background: var(--app-surface);
    color: var(--app-text);
  }

  .moved-dismiss {
    border-color: transparent;
    background: none;
    color: var(--app-muted);
  }
</style>
