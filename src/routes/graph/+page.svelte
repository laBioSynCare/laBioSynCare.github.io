<script>
  import { onMount } from 'svelte'
  import { loadNavigatorGraph } from '../../rdf/loader.js'
  import GraphEntryChooser from '../../ui/graph/GraphEntryChooser.svelte'
  import OntologyGraph from '../../ui/graph/OntologyGraph.svelte'
  import LoadingPanel from '../../ui/loading/LoadingPanel.svelte'
  import { shouldOfferEntryPoint } from '../../ui/graph/entryChooser.js'
  import { graphSession, saveGraphSession } from '../../ui/graph/graphSession.js'

  let store = $state(null)
  let error = $state(null)
  let loading = $state(true)
  let liveStatus = $state({ state: 'loading', message: 'Loading the live stakeholder network.' })

  // Whether to ask the reader where to start instead of laying out all 749
  // nodes. Decided in onMount rather than during init so the server-rendered
  // and hydrated markup agree on the first branch; the fetch below runs either
  // way, so the ontology is already arriving while the chooser is on screen.
  let entryDecided = $state(false)
  let offerEntry = $state(false)

  async function loadGraph({ refresh = false } = {}) {
    if (refresh) {
      liveStatus = { ...liveStatus, state: 'loading', message: 'Refreshing the live stakeholder network.' }
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

  function chooseEntry(value) {
    // Recorded even when the answer is "everything", so returning from another
    // screen in the same session does not ask again.
    saveGraphSession({ entryChosen: true, concernFilters: value ? [value] : [] })
    if (value) {
      // Put the chosen scope in the address bar before the navigator mounts:
      // it reads `?view=` at init, so this is the same path a shared deep link
      // takes, and it means the link the reader copies reproduces what they
      // are looking at. replaceState because choosing a starting point is not
      // a navigation the back button should have to undo.
      const url = new URL(window.location.href)
      url.searchParams.set('view', value)
      history.replaceState(history.state, '', url)
    }
    offerEntry = false
  }

  onMount(() => {
    offerEntry = shouldOfferEntryPoint({
      search: window.location.search,
      hash: window.location.hash,
      session: graphSession,
    })
    entryDecided = true
    loadGraph()
  })
</script>

<svelte:head>
  <title>Graph Navigator | SSTIM Workbench</title>
</svelte:head>

{#if entryDecided && offerEntry}
  <GraphEntryChooser onChoose={chooseEntry} />
{:else if loading}
  <!-- Same panel as the build phase that follows, so fetching, projecting and
       laying out read as one continuous load rather than three restarts. -->
  <div class="page-loading">
    <LoadingPanel
      title="Building the knowledge graph"
      phase="Fetching the ontology"
      detail="Turtle modules, the public catalog, and the live stakeholder network"
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
