<script>
  import { applicationRoute } from '../../config/applicationUrls.js'
  import Isotype from '../brand/Isotype.svelte'

  // Reuse the published SSTIM Workbench mark, not an improvised second brand.
  const { compact = false, size = 32 } = $props()
</script>

<a
  class="home-brand"
  class:compact
  href={applicationRoute('/')}
  aria-label="SSTIM home"
  title="SSTIM home"
>
  <Isotype name="bsclab" {size} title="SSTIM" />
  {#if !compact}<span class="brand-wordmark">SSTIM <small>Workbench</small></span>{/if}
</a>

<style>
  .home-brand {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    gap: .5rem;
    min-width: 34px;
    min-height: 34px;
    padding: .18rem .35rem;
    border-radius: 7px;
    color: var(--app-text-strong, inherit);
    text-decoration: none;
    line-height: 1;
  }
  .home-brand:hover { background: var(--app-accent-soft, transparent); text-decoration: none; }
  .home-brand:focus-visible {
    outline: 3px solid var(--app-accent, #3b9eff);
    outline-offset: 2px;
  }
  .brand-wordmark { font-size: .86rem; font-weight: 790; letter-spacing: -.015em; white-space: nowrap; }
  .brand-wordmark small { font-size: .68rem; color: var(--app-muted, inherit); font-weight: 500; }
  .compact { padding: .1rem; }
</style>
