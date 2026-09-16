<script>
  // Tells search engines which copy of a page to index. The same pages are
  // published at the legacy origin root and at the Community Group project site
  // (src/config/publicationOrigins.js), and without this a crawler picks one of
  // the two by itself. Rendered at prerender time, like StructuredData, so it is
  // in the HTML a crawler fetches rather than added by a script afterwards.
  //
  // Emits nothing unless the build was given SSTIM_CANONICAL_BASE, which only the
  // official publications are (deployment.config.js).
  import { page } from '$app/state'
  import { canonicalPageUrl } from '../../config/applicationUrls.js'

  const href = $derived(page.status === 200 ? canonicalPageUrl(page.url.pathname) : null)
</script>

<svelte:head>
  {#if href}
    <link rel="canonical" {href} />
  {/if}
</svelte:head>
