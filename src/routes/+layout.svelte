<script>
  import '@picocss/pico/css/pico.min.css'
  import AppTopBar from '../ui/navigation/AppTopBar.svelte'

  const { children } = $props()
</script>

<AppTopBar />

<div style="overflow:hidden">
  {@render children()}
</div>
