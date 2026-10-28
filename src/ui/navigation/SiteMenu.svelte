<script>
  // Every destination, grouped. The dock's Menu opens this; the groups and
  // their links come from siteNavigation.js, so a page added there appears
  // here without a second edit.
  import { page } from '$app/state'
  import { MENU_SECTIONS, isCurrentDestination } from './siteNavigation.js'
  import ProfileControl from './ProfileControl.svelte'
</script>

<div class="site-menu">
  {#each MENU_SECTIONS as section (section.title)}
    {@const headingId = `menu-group-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
    <section class="menu-group" aria-labelledby={headingId}>
      <h2 class="menu-heading" id={headingId}>{section.title}</h2>
      <ul>
        {#each section.items as item (item.href)}
          <li>
            <a
              href={item.href}
              rel={item.external ? 'external' : undefined}
              aria-current={!item.external && isCurrentDestination(item.href, page.url.pathname) ? 'page' : undefined}
            >
              <span class="menu-label">{item.label}{#if item.external}<span class="menu-external" aria-hidden="true"> ↗</span>{/if}</span>
              {#if item.hint}<span class="menu-hint">{item.hint}</span>{/if}
            </a>
          </li>
        {/each}
      </ul>
      {#if section.profile}
        <div class="menu-profile"><ProfileControl /></div>
      {/if}
    </section>
  {/each}
</div>

<style>
  .site-menu {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(11.5rem, 1fr));
    gap: 1rem 1.4rem;
    font-family: var(--app-font-ui);
  }

  .menu-heading {
    margin: 0 0 0.35rem;
    font-size: 0.68rem;
    font-weight: 750;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--app-muted);
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    margin: 0;
    list-style: none;
  }

  a {
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
    min-height: 2.25rem;
    justify-content: center;
    padding: 0.3rem 0.45rem;
    margin-inline: -0.45rem;
    border-radius: var(--app-radius);
    color: var(--app-text-strong);
    text-decoration: none;
  }

  a:hover,
  a:focus-visible {
    background: var(--app-accent-soft);
    color: var(--app-accent);
  }

  a[aria-current='page'] .menu-label {
    color: var(--app-accent);
  }

  .menu-label {
    font-size: 0.88rem;
    font-weight: 650;
  }

  .menu-external {
    color: var(--app-muted);
    font-weight: 500;
  }

  .menu-hint {
    font-size: 0.74rem;
    line-height: 1.35;
    color: var(--app-muted);
  }

  .menu-profile {
    margin-top: 0.5rem;
    font-size: 0.82rem;
  }
</style>
