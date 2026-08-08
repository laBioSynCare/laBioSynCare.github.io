<script>
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  const studioHref = '/creator/?starter=abstract'

  onMount(() => {
    goto(studioHref, { replaceState: true })
  })
</script>

<svelte:head>
  <title>Abstraction compatibility link | BSC Lab</title>
</svelte:head>

<main>
  <p>This address is retained for old bookmarks. Opening the Abstraction starter in <a href={studioHref}>Patch Studio</a>.</p>
</main>
