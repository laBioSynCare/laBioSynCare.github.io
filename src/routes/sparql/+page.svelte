<script>
  import { onMount } from 'svelte'
  import {
    loadLiveEcosystem,
    loadStaticKnowledgeGraph,
    mergeStores,
  } from '../../rdf/loader.js'
  import { select } from '../../rdf/query.js'

  let store = $state(null)
  let staticStore = $state(null)
  let query = $state(`PREFIX sstim: <https://w3id.org/sstim#>
PREFIX rdfs:  <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?cls ?label WHERE {
  GRAPH ?graph {
    ?cls a <http://www.w3.org/2002/07/owl#Class> .
    OPTIONAL { ?cls rdfs:label ?label . FILTER(LANG(?label) = "en") }
  }
}
ORDER BY ?label`)
  let rows = $state([])
  let columns = $state([])
  let error = $state(null)
  let running = $state(false)
  let loading = $state(true)
  let includeLive = $state(false)
  let loadingLive = $state(false)
  let liveStatus = $state({ state: 'disabled', message: 'Live ecosystem data is not loaded.' })

  onMount(async () => {
    try {
      staticStore = await loadStaticKnowledgeGraph()
      store = staticStore
    } catch (e) {
      error = `Failed to load ontology: ${e.message}`
    } finally {
      loading = false
    }
  })

  async function toggleLive(event) {
    includeLive = event.currentTarget.checked
    if (!includeLive) {
      store = mergeStores(staticStore)
      liveStatus = { state: 'disabled', message: 'Live ecosystem data is not loaded.' }
      return
    }

    loadingLive = true
    liveStatus = { state: 'loading', message: 'Loading current public ecosystem projection.' }
    const live = await loadLiveEcosystem()
    liveStatus = live.status
    store = mergeStores(staticStore, live.store)
    loadingLive = false
  }

  async function run() {
    if (!store || running) return
    error = null
    running = true
    try {
      rows = await select(store, query)
      columns = rows.length ? Object.keys(rows[0]) : []
    } catch (e) {
      error = e.message
      rows = []
      columns = []
    } finally {
      running = false
    }
  }
</script>

<hgroup>
  <h1>SPARQL Interface</h1>
  <p>Query versioned SSTIM data in-browser via Comunica; mutable public ecosystem data is opt-in.</p>
</hgroup>

{#if loading}
  <p aria-busy="true">Loading ontology…</p>
{:else}
  <fieldset>
    <label>
      <input type="checkbox" checked={includeLive} onchange={toggleLive} disabled={loadingLive} />
      Include live public ecosystem
    </label>
    <small>
      {#if liveStatus.state === 'available'}
        Loaded {liveStatus.quadCount} current public quads. This source is not part of the citable release.
      {:else}
        {liveStatus.message}
      {/if}
    </small>
  </fieldset>
  <textarea rows="10" bind:value={query} style="font-family:monospace;width:100%"></textarea>
  <button onclick={run} aria-busy={running} disabled={running}>Run</button>

  {#if error}
    <p style="color:var(--pico-color-red-500,red)">{error}</p>
  {/if}

  {#if rows.length}
    <div style="overflow-x:auto">
      <table>
        <thead>
          <tr>{#each columns as col}<th>{col}</th>{/each}</tr>
        </thead>
        <tbody>
          {#each rows as row}
            <tr>
              {#each columns as col}
                <td>{row[col]?.value ?? ''}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p><small>{rows.length} row{rows.length === 1 ? '' : 's'}</small></p>
  {/if}
{/if}
