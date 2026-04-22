<script>
  import { onMount } from 'svelte'
  import { loadOntology } from '../rdf/loader.js'
  import { select } from '../rdf/query.js'

  let classes = $state([])
  let error = $state(null)
  let loading = $state(true)

  onMount(async () => {
    try {
      const store = await loadOntology()
      const rows = await select(store, `
        PREFIX owl:  <http://www.w3.org/2002/07/owl#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

        SELECT ?cls ?label WHERE {
          ?cls a owl:Class .
          OPTIONAL { ?cls rdfs:label ?label . FILTER(LANG(?label) = "en") }
        }
        ORDER BY ?label
      `)
      classes = rows.map(r => ({
        iri:   r.cls.value,
        label: r.label?.value ?? r.cls.value.split(/[#/]/).pop(),
      }))
    } catch (e) {
      error = e.message
    } finally {
      loading = false
    }
  })
</script>

<hgroup>
  <h1>BSC Lab — Ontology Browser</h1>
  <p>OWL classes in <code>sstim-core.ttl</code></p>
</hgroup>

{#if loading}
  <p aria-busy="true">Loading ontology…</p>
{:else if error}
  <p class="error">{error}</p>
{:else}
  <ul>
    {#each classes as { iri, label }}
      <li><a href={iri} target="_blank" rel="noreferrer">{label}</a></li>
    {/each}
  </ul>
{/if}

<style>
  .error { color: var(--pico-color-red-500, red); }
</style>
