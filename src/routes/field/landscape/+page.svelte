<script>
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  const studioHref = '/creator/?starter=landscape'

  onMount(() => {
    goto(studioHref, { replaceState: true })
  })
</script>

<svelte:head>
  <title>3D Landscape compatibility link | BSC Lab</title>
</svelte:head>

<main>
  <p>This address is retained for old bookmarks. Opening the 3D Landscape starter in <a href={studioHref}>Patch Studio</a>.</p>
</main>
