<script>
  import { page } from '$app/state'
  import { applicationRoute } from '../../config/applicationUrls.js'

  const appRoot = applicationRoute('/')
  const items = [
    { href: applicationRoute('/graph/'), label: 'Graph' },
    { href: applicationRoute('/creator/'), label: 'Patch Studio' },
    { href: applicationRoute('/presets/'), label: 'Presets' },
    { href: applicationRoute('/sparql/'), label: 'SPARQL' },
    { href: applicationRoute('/logbook/'), label: 'Logbook' },
    { href: applicationRoute('/settings/'), label: 'Settings' },
    { href: applicationRoute('/about/'), label: 'About' },
  ]

  function isActive(href) {
    const path = page.url.pathname
    if (href === appRoot) return path === appRoot || path === appRoot.slice(0, -1)
    const route = href.endsWith('/') ? href.slice(0, -1) : href
    return path === route || path.startsWith(route + '/')
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
    grid-template-columns: repeat(7, minmax(0, 1fr));
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
    color: var(--app-text);
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
    color: var(--app-dock-active, var(--app-accent));
    background: var(--app-accent-soft);
  }

  .app-bottom-dock span {
    display: block;
    width: 100%;
    min-width: 0;
    overflow: hidden;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 620px) {
    .app-bottom-dock a {
      font-size: 0.66rem;
      padding: 0 0.25rem;
    }
  }

  @media (max-width: 360px) {
    .app-bottom-dock a {
      padding-inline: 0.125rem;
    }
  }
</style>
