<script>
  import '@picocss/pico/css/pico.min.css'
  import AppTopBar from '../ui/navigation/AppTopBar.svelte'

  const { children } = $props()
</script>

<AppTopBar />

<div style="overflow:hidden">
  {@render children()}
</div>

<style>
  :global(body.studio-page .app-topbar) { display: none; }
  :global(body.studio-page > div)       { overflow: visible; }
</style>
