<script>
  import '@picocss/pico/css/pico.min.css'
  const { children } = $props()
</script>

<nav class="container">
  <ul>
    <li><strong>BSC Lab</strong></li>
  </ul>
  <ul>
    <li><a href="/">Ontology</a></li>
    <li><a href="/sparql">SPARQL</a></li>
  </ul>
</nav>

<main class="container">
  {@render children()}
</main>
