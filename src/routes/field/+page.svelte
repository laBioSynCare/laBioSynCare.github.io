<script>
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  const studioHref = '/creator/?starter=field'

  onMount(() => {
    goto(studioHref, { replaceState: true })
  })
</script>

<svelte:head>
  <title>Sensory Field | BSC Lab</title>
</svelte:head>

<main>
  <p>Opening the Sensory Field starter in <a href={studioHref}>Patch Studio</a>.</p>
</main>
