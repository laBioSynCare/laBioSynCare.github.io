<script>
  import { onMount } from 'svelte'
  import { loadNavigatorGraph } from '../../rdf/loader.js'
  import OntologyGraph from '../../ui/graph/OntologyGraph.svelte'
  import LoadingPanel from '../../ui/loading/LoadingPanel.svelte'

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
  <!-- Same panel as the build phase that follows, so fetching, projecting and
       laying out read as one continuous load rather than three restarts. -->
  <div class="page-loading">
    <LoadingPanel
      title="Building the knowledge graph"
      phase="Fetching the ontology"
      detail="Turtle modules, the public catalog, and the live ecosystem projection"
    />
  </div>
{:else if error}
  <p style="color:red;padding:2rem">{error}</p>
{:else}
  {#key store}
    <OntologyGraph {store} {liveStatus} onRefreshLive={() => loadGraph({ refresh: true })} />
  {/key}
{/if}

<style>
  .page-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    /* The graph route fills the shell between the top bar and the tab bar; the
       loader has to sit in the middle of that, not at the top of the document. */
    min-height: 60vh;
    width: min(24rem, 80%);
    margin: 0 auto;
  }
</style>
