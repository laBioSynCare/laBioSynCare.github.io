<script>
  import { page } from '$app/state'
  import { afterNavigate } from '$app/navigation'
  import { DOCK_ITEMS, isCurrentDestination } from './siteNavigation.js'
  import SiteMenu from './SiteMenu.svelte'

  // Four destinations and a Menu that holds every page. Eight labels in one
  // row truncated on a phone; five fit at 360px.
  let menuOpen = $state(false)
  let menuButton = $state(null)
  let menuPanel = $state(null)

  // A followed link closes the menu: the dock outlives the page beneath it.
  afterNavigate(() => {
    menuOpen = false
  })

  function closeMenu({ restoreFocus = false } = {}) {
    menuOpen = false
    if (restoreFocus) menuButton?.focus()
  }

  function handleWindowKeydown(event) {
    if (event.key === 'Escape' && menuOpen) {
      event.preventDefault()
      closeMenu({ restoreFocus: true })
    }
  }

  // Pointerdown rather than click, as for the graph's scope panel: an account
  // control inside the menu re-renders, and a click listener would see the
  // replaced node as outside.
  function handleWindowPointerDown(event) {
    if (!menuOpen) return
    if (menuPanel?.contains(event.target) || menuButton?.contains(event.target)) return
    closeMenu()
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} onpointerdown={handleWindowPointerDown} />

<nav class="app-bottom-dock" aria-label="SSTIM Workbench screens">
  {#each DOCK_ITEMS as item (item.href)}
    <a href={item.href} aria-label={item.label} title={item.label}
      aria-current={isCurrentDestination(item.href, page.url.pathname) ? 'page' : undefined}>
      <span class="dock-full">{item.label}</span>
      <span class="dock-short">{item.shortLabel ?? item.label}</span>
    </a>
  {/each}
  <button
    bind:this={menuButton}
    type="button"
    class="dock-menu"
    aria-expanded={menuOpen}
    aria-controls="site-menu"
    onclick={() => (menuOpen = !menuOpen)}
  >
    <span class="menu-glyph" aria-hidden="true">☰</span>
    <span>Menu</span>
  </button>
</nav>

<div
  bind:this={menuPanel}
  id="site-menu"
  class="site-menu-panel"
  role="region"
  aria-label="All Workbench pages"
  hidden={!menuOpen}
>
  <SiteMenu />
</div>

<style>
  .app-bottom-dock {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 120;
    height: var(--app-bottom-dock-height, 48px);
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    align-items: stretch;
    background: color-mix(in srgb, var(--app-surface) 94%, #000 6%);
    border-top: var(--app-border-width) solid var(--app-border);
    box-shadow: 0 -8px 24px #00000042;
    font-family: var(--app-font-ui);
  }

  .app-bottom-dock a,
  .dock-menu {
    min-width: 0;
    display: grid;
    place-items: center;
    padding: 0 0.55rem;
    color: var(--app-text);
    text-decoration: none;
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0;
    border-right: 1px solid var(--app-border-subtle);
  }

  .dock-menu {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    width: auto;
    height: auto;
    margin: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    font-family: inherit;
    line-height: 1;
    cursor: pointer;
  }

  .menu-glyph {
    font-size: 0.95rem;
    font-weight: 500;
  }

  .app-bottom-dock a:hover,
  .app-bottom-dock a[aria-current='page'],
  .dock-menu:hover,
  .dock-menu[aria-expanded='true'] {
    color: var(--app-dock-active, var(--app-accent));
    background: var(--app-accent-soft);
  }

  .app-bottom-dock a span,
  .dock-menu span {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .app-bottom-dock a span {
    width: 100%;
  }

  .app-bottom-dock .dock-short { display: none; }

  .site-menu-panel {
    position: fixed;
    right: 0.75rem;
    bottom: calc(var(--app-bottom-dock-height, 48px) + 0.5rem);
    z-index: 121;
    width: min(46rem, calc(100vw - 1.5rem));
    max-height: calc(100vh - var(--app-bottom-dock-height, 48px) - 1.5rem);
    max-height: calc(100dvh - var(--app-bottom-dock-height, 48px) - 1.5rem);
    overflow-y: auto;
    box-sizing: border-box;
    padding: 1rem 1.2rem 1.1rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) + 4px);
    background: var(--app-surface);
    color: var(--app-text);
    box-shadow: 0 -0.5rem 2.5rem #0000004d;
  }

  .site-menu-panel[hidden] { display: none; }

  @media (max-width: 620px) {
    .app-bottom-dock .dock-full { display: none; }
    .app-bottom-dock .dock-short { display: block; }
    .app-bottom-dock a,
    .dock-menu {
      font-size: 0.7rem;
      padding: 0 0.25rem;
    }
    .dock-menu { gap: 0.25rem; }
    .site-menu-panel {
      left: 0.5rem;
      right: 0.5rem;
      width: auto;
      padding: 0.9rem 1rem 1rem;
    }
  }
</style>
