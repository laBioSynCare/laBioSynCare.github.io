<script>
  import { page } from '$app/state'

  const items = [
    { href: '/graph/', label: 'Graph' },
    { href: '/creator/', label: 'Patch Studio' },
    { href: '/creator/?starter=field', label: 'Field' },
    { href: '/presets/', label: 'Presets' },
    { href: '/sparql/', label: 'SPARQL' },
    { href: '/logbook/', label: 'Logbook' },
    { href: '/settings/', label: 'Settings' },
    { href: '/about/', label: 'About' },
  ]

  function isActive(href) {
    const path = page.url.pathname
    if (href === '/') return path === '/'
    return path.startsWith(href)
  }
</script>

<nav class="app-bottom-dock" aria-label="BSC Lab screens">
  {#each items as item}
    <a href={item.href} aria-current={isActive(item.href) ? 'page' : undefined}>
      <span>{item.label}</span>
    </a>
  {/each}
</nav>

<style>
  .app-bottom-dock {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 120;
    height: var(--app-bottom-dock-height, 48px);
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    align-items: stretch;
    background: color-mix(in srgb, var(--app-surface) 94%, #000 6%);
    border-top: var(--app-border-width) solid var(--app-border);
    box-shadow: 0 -8px 24px #00000042;
    font-family: var(--app-font-ui);
  }

  .app-bottom-dock a {
    min-width: 0;
    display: grid;
    place-items: center;
    padding: 0 0.55rem;
    color: var(--app-muted);
    text-decoration: none;
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0;
    border-right: 1px solid var(--app-border-subtle);
  }

  .app-bottom-dock a:last-child {
    border-right: none;
  }

  .app-bottom-dock a:hover,
  .app-bottom-dock a[aria-current='page'] {
    color: var(--app-accent);
    background: var(--app-accent-soft);
  }

  .app-bottom-dock span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 620px) {
    .app-bottom-dock a {
      font-size: 0.66rem;
      padding: 0 0.25rem;
    }
  }
</style>
