<script>
  import { onMount } from 'svelte'
  import { loadOntology } from '../rdf/loader.js'
  import OntologyGraph from '../ui/graph/OntologyGraph.svelte'

  let store = $state(null)
  let error = $state(null)
  let loading = $state(true)

  onMount(async () => {
    try {
      store = await loadOntology()
    } catch (e) {
      error = e.message
    } finally {
      loading = false
    }
  })
</script>

{#if loading}
  <p aria-busy="true" style="padding:2rem">Loading ontology…</p>
{:else if error}
  <p style="color:red;padding:2rem">{error}</p>
{:else}
  <OntologyGraph {store} />
{/if}
