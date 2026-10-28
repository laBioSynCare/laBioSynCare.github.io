<script>
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import { applicationRoute } from '../../../config/applicationUrls.js'

  const studioHref = applicationRoute('/creator/?starter=landscape')

  onMount(() => {
    goto(studioHref, { replaceState: true })
  })
</script>

<svelte:head>
  <title>3D Landscape compatibility link | SSTIM Workbench</title>
  <meta name="description" content="An earlier address of the 3D Landscape starter, which now opens in Patch Studio." />
</svelte:head>

<main>
  <p>This address is retained for old bookmarks. Opening the 3D Landscape starter in <a href={studioHref}>Patch Studio</a>.</p>
</main>
