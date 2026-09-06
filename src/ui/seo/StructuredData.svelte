<script>
  // Emits the SSTIM Dataset description into the document head. Rendered at
  // prerender time, so a crawler that never runs JavaScript still sees it.
  //
  // The `{@html}` template is the standard SvelteKit way to put a script
  // element in the head: a literal <script> here would be read as the
  // component's own instance script. `<\/script>` closes the emitted element
  // without terminating this one.
  import { sstimDatasetJsonLd } from './datasetJsonLd.js'

  const json = sstimDatasetJsonLd()
</script>

<svelte:head>
  {@html `<script type="application/ld+json">${json}<\/script>`}
</svelte:head>
