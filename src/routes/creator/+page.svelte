<script>
  import { onMount } from 'svelte'
  import PresetCreator from '../../ui/creator/PresetCreator.svelte'

  onMount(() => {
    document.body.classList.add('studio-page')
    return () => document.body.classList.remove('studio-page')
  })
</script>

<svelte:head>
  <title>Patch Studio | SSTIM Workbench</title>
</svelte:head>

<PresetCreator />
