<script>
  import { onMount } from 'svelte'
  import { loadOntology } from '../../rdf/loader.js'
  import { select } from '../../rdf/query.js'

  let store = $state(null)
  let query = $state(`PREFIX sstim: <https://w3id.org/sstim#>
PREFIX rdfs:  <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?cls ?label WHERE {
  ?cls a <http://www.w3.org/2002/07/owl#Class> .
  OPTIONAL { ?cls rdfs:label ?label . FILTER(LANG(?label) = "en") }
}
ORDER BY ?label`)
  let rows = $state([])
  let columns = $state([])
  let error = $state(null)
  let running = $state(false)
  let loading = $state(true)

  onMount(async () => {
    try {
      store = await loadOntology()
    } catch (e) {
      error = `Failed to load ontology: ${e.message}`
    } finally {
      loading = false
    }
  })

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
  <p>Query the sstim ontology in-browser via Comunica</p>
</hgroup>

{#if loading}
  <p aria-busy="true">Loading ontology…</p>
{:else}
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
