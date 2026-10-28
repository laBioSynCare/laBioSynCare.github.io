<script>
  // Shown for any route SvelteKit cannot resolve, including the 404.html
  // fallback GitHub Pages serves for an unknown path. It replaced SvelteKit's
  // bare "404 / Not Found". The dock and its Menu still render around it (the
  // root layout), so this only says what happened and offers the likeliest
  // next steps.
  import { page } from '$app/state'
  import { applicationRoute } from '../config/applicationUrls.js'

  const notFound = $derived(page.status === 404)
</script>

<svelte:head>
  <title>{notFound ? 'Page not found' : 'Something went wrong'} | SSTIM Workbench</title>
  <meta name="description" content="This SSTIM Workbench address does not lead to a page." />
</svelte:head>

<main class="error-page">
  <p class="eyebrow">Error {page.status}</p>
  {#if notFound}
    <h1>This page does not exist.</h1>
    <p class="lead">
      The address may be mistyped, or the page may have moved. Every page of the
      Workbench is listed in the Menu at the bottom right.
    </p>
  {:else}
    <h1>Something went wrong.</h1>
    <p class="lead">{page.error?.message ?? 'The page could not be shown.'}</p>
  {/if}

  <ul class="next">
    <li><a href={applicationRoute('/')}>Home</a><span>Start from the beginning.</span></li>
    <li><a href={applicationRoute('/graph/')}>Graph Navigator</a><span>Find a term or record by name.</span></li>
    <li><a href={applicationRoute('/protocols/')}>Published protocols</a><span>Studies encoded from their papers.</span></li>
    <li><a href={applicationRoute('/namespace/')}>What resolves where</a><span>If you followed an SSTIM identifier.</span></li>
  </ul>
</main>

<style>
  .error-page {
    max-width: 44rem;
    margin: 0 auto;
    padding: clamp(2rem, 6vw, 4.5rem) 1.25rem 4rem;
    font-family: var(--app-font-ui);
    color: var(--app-text);
  }

  .eyebrow {
    margin: 0 0 0.8rem;
    color: var(--app-accent);
    font-family: var(--app-font-mono);
    font-size: 0.72rem;
    font-weight: 750;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0 0 1rem;
    color: var(--app-text-strong);
    font-size: clamp(2rem, 5vw, 3rem);
    letter-spacing: -0.035em;
    line-height: 1.1;
  }

  .lead {
    margin: 0 0 2rem;
    color: var(--app-muted);
    font-size: 1.02rem;
    line-height: 1.65;
  }

  .next {
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--app-border);
  }

  .next li {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.35rem 0.9rem;
    margin: 0;
    padding: 0.85rem 0;
    border-bottom: 1px solid var(--app-border);
    list-style: none;
  }

  .next a {
    color: var(--app-accent);
    font-weight: 700;
    text-decoration: none;
  }

  .next a:hover {
    text-decoration: underline;
    text-underline-offset: 0.2rem;
  }

  .next span {
    color: var(--app-muted);
    font-size: 0.88rem;
  }
</style>
