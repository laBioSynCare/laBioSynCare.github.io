<script>
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  const studioHref = '/creator/?starter=tree'

  onMount(() => {
    goto(studioHref, { replaceState: true })
  })
</script>

<svelte:head>
  <title>Stereoscopic Tree compatibility link | BSC Lab</title>
</svelte:head>

<main>
  <p>This address is retained for old bookmarks. Opening the Stereoscopic Tree starter in <a href={studioHref}>Patch Studio</a>.</p>
</main>
