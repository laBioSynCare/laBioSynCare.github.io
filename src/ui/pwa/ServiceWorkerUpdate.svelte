<script>
  // PWA registration (production only) + session-safe update banner.
  // As-built spec: docs/technical/PWA_SERVICE_WORKER.md §5.
  // Decision: docs/decisions/0009-pwa.md (Trap 1).
  //
  // The worker is registered manually here, not by SvelteKit, because
  // svelte.config.js sets kit.serviceWorker.register = false. That keeps the
  // worker out of `make dev`, where a precaching worker would serve stale
  // assets and fight HMR.
  //
  // Trap 1 — never auto-reload: an in-progress stimulation session must survive
  // a deploy. We surface a passive banner; the reload happens only when the user
  // clicks "Reload", which promotes the waiting worker via SKIP_WAITING.

  import { dev } from '$app/environment'
  import { applicationAsset, applicationRoute } from '../../config/applicationUrls.js'
  import { onMount } from 'svelte'

  let updateReady = $state(false)
  let waitingWorker = null

  onMount(() => {
    if (dev || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    // Reload exactly once when the new worker takes control (guards against the
    // double-fire that `controllerchange` can otherwise cause).
    let reloading = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return
      reloading = true
      location.reload()
    })

    // The browser only checks for a new worker on navigation, so a long-lived
    // tab never learns about deploys. Re-check whenever the tab regains
    // visibility; a found update surfaces the banner (never an auto-reload —
    // Trap 1).
    let activeRegistration = null
    const checkForUpdate = () => {
      if (document.visibilityState === 'visible') {
        activeRegistration?.update().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', checkForUpdate)

    navigator.serviceWorker
      .register(applicationAsset('/service-worker.js'), {
        type: 'classic',
        scope: applicationRoute('/'),
      })
      .then((registration) => {
        activeRegistration = registration

        // A worker downloaded on a previous visit may already be waiting.
        if (registration.waiting) promote(registration.waiting)

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing
          if (!installing) return
          installing.addEventListener('statechange', () => {
            // Installed while a controller already exists → a real update (not
            // the first install) is ready and waiting.
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              promote(installing)
            }
          })
        })
      })
      .catch(() => {
        // Registration failures must never surface to the user; the app works
        // fine without the worker.
      })

    function promote(worker) {
      waitingWorker = worker
      updateReady = true
    }

    return () => document.removeEventListener('visibilitychange', checkForUpdate)
  })

  function applyUpdate() {
    // The user chose to reload. Promote the waiting worker; the
    // `controllerchange` handler above performs the single reload.
    updateReady = false
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' })
  }

  function dismiss() {
    // Update applies on the next natural reload or when all tabs close.
    updateReady = false
  }
</script>

{#if updateReady}
  <div class="sw-update" role="status" aria-live="polite">
    <span class="sw-update-text">A new version of SSTIM Workbench is ready.</span>
    <div class="sw-update-actions">
      <button type="button" class="sw-update-reload" onclick={applyUpdate}>Reload</button>
      <button type="button" class="sw-update-later" onclick={dismiss}>Later</button>
    </div>
  </div>
{/if}

<style>
  .sw-update {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: calc(var(--app-bottom-dock-height) + 0.75rem);
    z-index: 350;
    width: min(28rem, calc(100vw - 1.5rem));
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem 0.9rem;
    padding: 0.6rem 0.85rem;
    background: var(--app-surface);
    color: var(--app-text);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) + 2px);
    box-shadow: 0 0.75rem 1.75rem #00000055;
  }

  .sw-update-text {
    font-size: 0.86rem;
    line-height: 1.4;
    flex: 1 1 12rem;
  }

  .sw-update-actions {
    display: flex;
    gap: 0.5rem;
    flex: 0 0 auto;
  }

  .sw-update-actions button {
    margin: 0;
    padding: 0.4rem 0.85rem;
    border-radius: var(--app-radius);
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    width: auto;
  }

  .sw-update-reload {
    background: var(--app-accent);
    border: none;
    color: #fff;
  }
  .sw-update-reload:hover { filter: brightness(1.12); }

  .sw-update-later {
    background: transparent;
    border: 1px solid var(--app-border);
    color: var(--app-text);
  }
  .sw-update-later:hover { background: var(--app-surface-2); }
</style>
