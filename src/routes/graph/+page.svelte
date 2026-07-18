<script>
  import { onMount } from 'svelte'
  import { loadNavigatorGraph } from '../../rdf/loader.js'
  import OntologyGraph from '../../ui/graph/OntologyGraph.svelte'

  let store = $state(null)
  let error = $state(null)
  let loading = $state(true)
  let liveStatus = $state({ state: 'loading', message: 'Loading current public ecosystem projection.' })

  async function loadGraph({ refresh = false } = {}) {
    if (refresh) {
      liveStatus = { ...liveStatus, state: 'loading', message: 'Refreshing current public ecosystem projection.' }
    }
    try {
      const result = await loadNavigatorGraph()
      store = result.store
      liveStatus = result.liveStatus
      error = null
    } catch (e) {
      error = e.message
    } finally {
      loading = false
    }
  }

  onMount(loadGraph)
</script>

<svelte:head>
  <title>Graph | BSC Lab</title>
</svelte:head>

{#if loading}
  <p aria-busy="true" style="padding:2rem">Loading ontology…</p>
{:else if error}
  <p style="color:red;padding:2rem">{error}</p>
{:else}
  {#key store}
    <OntologyGraph {store} {liveStatus} onRefreshLive={() => loadGraph({ refresh: true })} />
  {/key}
{/if}
