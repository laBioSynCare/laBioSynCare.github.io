<script>
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import { applicationRoute } from '../../../config/applicationUrls.js'

  const studioHref = applicationRoute('/creator/?starter=abstract')

  onMount(() => {
    goto(studioHref, { replaceState: true })
  })
</script>

<svelte:head>
  <title>Abstraction compatibility link | SSTIM Workbench</title>
</svelte:head>

<main>
  <p>This address is retained for old bookmarks. Opening the Abstraction starter in <a href={studioHref}>Patch Studio</a>.</p>
</main>
