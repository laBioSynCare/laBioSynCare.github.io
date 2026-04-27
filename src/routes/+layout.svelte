<script>
  import '@picocss/pico/css/pico.min.css'
  import AuthControl from '../ui/auth/AuthControl.svelte'

  const { children } = $props()
</script>

<nav class="container-fluid" style="padding:0.5rem 1rem">
  <ul>
    <li><strong>BSC Lab</strong></li>
  </ul>
  <ul>
    <li><a href="/">Ontology</a></li>
    <li><a href="/presets/">Presets</a></li>
    <li><a href="/sparql/">SPARQL</a></li>
    <li><AuthControl /></li>
  </ul>
</nav>

<div style="overflow:hidden">
  {@render children()}
</div>
