<script>
  import { onMount } from 'svelte'
  import {
    loadLiveEcosystem,
    loadStaticKnowledgeGraph,
    mergeStores,
  } from '../../rdf/loader.js'
  import { select } from '../../rdf/query.js'
  import {
    EXAMPLE_QUERIES,
    EXAMPLE_QUERY_CATEGORIES,
    wikidataQueryServiceUrl,
    bioportalSearchUrl,
  } from '../../ui/sparql/exampleQueries.js'

  let store = $state(null)
  let staticStore = $state(null)
  let selectedExampleId = $state('')
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

  let selectedExample = $derived(EXAMPLE_QUERIES.find(q => q.id === selectedExampleId) ?? null)

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

  async function setIncludeLive(value) {
    includeLive = value
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

  function toggleLive(event) {
    setIncludeLive(event.currentTarget.checked)
  }

  function loadExample(event) {
    selectedExampleId = event.currentTarget.value
    if (!selectedExample) return
    query = selectedExample.sparql
    rows = []
    columns = []
    error = null
    if (selectedExample.requiresLive && !includeLive) {
      setIncludeLive(true)
    }
  }

  async function run() {
    if (!store || running) return
    error = null
    running = true
    try {
      rows = await select(store, query)
      columns = [...new Set(rows.flatMap(r => Object.keys(r)))]
    } catch (e) {
      error = e.message
      rows = []
      columns = []
    } finally {
      running = false
    }
  }
</script>

<svelte:head>
  <title>SPARQL | BSC Lab</title>
</svelte:head>

<main class="sparql-page">
  <header class="hero">
    <p class="eyebrow">SPARQL</p>
    <h1>Query SSTIM</h1>
    <p class="subhead">
      A full SPARQL 1.1 engine running in your browser — no server round trip.
      Pick an example below or write your own; mutable public ecosystem data is opt-in.
    </p>
  </header>

  {#if loading}
    <p aria-busy="true">Loading ontology…</p>
  {:else}
    <div class="workspace">
      <section class="main-column">
        <div class="panel">
          <div class="control-row">
            <label for="example-picker">Example queries</label>
            <select id="example-picker" value={selectedExampleId} onchange={loadExample}>
              <option value="">— choose an example, or write your own below —</option>
              {#each EXAMPLE_QUERY_CATEGORIES as category}
                <optgroup label={category}>
                  {#each EXAMPLE_QUERIES.filter(q => q.category === category) as ex}
                    <option value={ex.id}>{ex.title}</option>
                  {/each}
                </optgroup>
              {/each}
            </select>
            {#if selectedExample}
              <p class="hint">{selectedExample.description}</p>
            {/if}
          </div>

          <div class="control-row">
            <label class="checkbox-row">
              <input type="checkbox" checked={includeLive} onchange={toggleLive} disabled={loadingLive} />
              Include live public ecosystem
            </label>
            <p class="hint">
              {#if liveStatus.state === 'available'}
                Loaded {liveStatus.quadCount} current public quads. This source is not part of the citable release.
              {:else}
                {liveStatus.message}
              {/if}
            </p>
          </div>
        </div>

        <div class="editor-panel">
          <div class="editor-toolbar">
            <span class="editor-label">SPARQL query</span>
            <button class="run-btn" onclick={run} aria-busy={running} disabled={running}>Run</button>
          </div>
          <textarea class="code-editor" rows="14" bind:value={query} spellcheck="false"></textarea>
        </div>

        {#if error}
          <div class="error-panel" role="alert">{error}</div>
        {/if}

        {#if rows.length}
          <div class="results-panel">
            <div class="results-scroll">
              <table>
                <thead>
                  <tr>
                    {#each columns as col}<th>{col}</th>{/each}
                    {#if columns.includes('wikidataId')}<th>External</th>{/if}
                  </tr>
                </thead>
                <tbody>
                  {#each rows as row}
                    <tr>
                      {#each columns as col}
                        <td>{row[col]?.value ?? ''}</td>
                      {/each}
                      {#if columns.includes('wikidataId') && row.wikidataId}
                        <td><a href={wikidataQueryServiceUrl(row.wikidataId.value)} target="_blank" rel="noopener external">Query on Wikidata ↗</a></td>
                      {:else if columns.includes('wikidataId')}
                        <td></td>
                      {/if}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
            <p class="row-count">{rows.length} row{rows.length === 1 ? '' : 's'}</p>
          </div>
        {/if}
      </section>

      <aside class="side-column">
        <div class="panel about-panel">
          <h2>About this endpoint</h2>
          <p>
            There is no separate, network-reachable SPARQL HTTP endpoint for SSTIM or
            BSC Lab data (unlike, say, Wikidata Query Service). <strong>This page is
            the endpoint</strong>: it runs <a href="https://comunica.dev/" rel="external">Comunica</a>,
            a full SPARQL 1.1 engine, entirely in your browser, against an in-memory
            RDF store built by fetching the actual Turtle files at query time. Nothing
            is sent to a server to run a query — the only network requests are the
            Turtle/JSON-LD fetches themselves.
          </p>
          <h3>What gets loaded, and from where</h3>
          <ul>
            <li>The ontology and vocabulary — <code>sstim-core.ttl</code>, <code>sstim-vocab.ttl</code>,
              <code>sstim-shapes.ttl</code>, <code>sstim-alignments.ttl</code>, the Patch Studio module —
              served same-origin from <code>/ontology/*.ttl</code> (mirrored at the citable
              <a href="https://w3id.org/sstim" rel="external">w3id.org/sstim</a> namespace).</li>
            <li>The versioned catalog — frameworks, implementations, presets, protocols,
              evidence, experiments — from <code>/ontology/instances/*</code>.</li>
            <li>The live public ecosystem projection — opt-in via the checkbox — fetched
              fresh from <code>biosyncare-lab.web.app/current.ttl</code>. It's mutable and
              excluded from citable releases; loading it costs one extra fetch, which is
              why it's not on by default.</li>
          </ul>
          <h3>Why results need <code>GRAPH ?var</code></h3>
          <p>
            Each source above is loaded into its own named graph, not the default graph,
            so a plain (unwrapped) triple pattern matches nothing. Wrapping a pattern in
            <code>GRAPH ?g {'{'} … {'}'}</code> with an unbound graph variable matches it
            regardless of which named graph it landed in. Joining data from
            <em>different</em> sources — e.g. a preset and the vocabulary term it
            references — needs one independently-wildcarded <code>GRAPH</code> block
            per source (see the example queries), not one shared variable across the
            whole query.
          </p>
          <h3>Connect your own tooling</h3>
          <p>
            Since there's no hosted endpoint to point a client at, the way to query
            this data outside the browser is to fetch these same files with your
            own SPARQL engine (Jena, rdflib, Oxigraph, a local Comunica script,
            <code>curl</code> into any triple store) and query them there:
          </p>
          <ul class="source-urls">
            <li><a href="https://w3id.org/sstim" rel="external">w3id.org/sstim</a> — citable, content-negotiated entry point</li>
            <li><a href="https://labiosyncare.github.io/ontology/sstim-core.ttl" rel="external">…/ontology/sstim-core.ttl</a> — OWL core</li>
            <li><a href="https://labiosyncare.github.io/ontology/sstim-vocab.ttl" rel="external">…/ontology/sstim-vocab.ttl</a> — SKOS vocabulary</li>
            <li><a href="https://labiosyncare.github.io/ontology/sstim-shapes.ttl" rel="external">…/ontology/sstim-shapes.ttl</a> — SHACL shapes</li>
            <li><a href="https://labiosyncare.github.io/ontology/sstim-alignments.ttl" rel="external">…/ontology/sstim-alignments.ttl</a> — BFO/OBI/IAO/Wikidata alignments</li>
            <li><a href="https://labiosyncare.github.io/ontology/sstim-exposure.ttl" rel="external">…/ontology/sstim-exposure.ttl</a> — exposure module</li>
            <li><a href="https://labiosyncare.github.io/ontology/sstim-ecosystem.ttl" rel="external">…/ontology/sstim-ecosystem.ttl</a> — ecosystem module</li>
            <li><a href="https://biosyncare-lab.web.app/current.ttl" rel="external">biosyncare-lab.web.app/current.ttl</a> — live public ecosystem (mutable, not citable)</li>
          </ul>
          <h3>Querying another endpoint</h3>
          <p>
            The in-browser Comunica build used here (<code>@comunica/query-sparql-rdfjs</code>,
            chosen to keep the query interface lightweight) doesn't support federating a
            live <code>SERVICE</code> call out to an external SPARQL endpoint. For SSTIM
            terms aligned to Wikidata (<code>skos:exactMatch</code>/<code>closeMatch</code>,
            see "Integrating with Wikidata"), results carrying a Wikidata ID get an "Open
            in Wikidata Query Service" link that runs a real query there, pre-filled. For
            terms aligned to OBO Foundry ontologies (BFO, OBI, IAO — see "Integrating with
            BFO / OBI / IAO"), the fastest way to look one up externally is a
            <a href={bioportalSearchUrl('BFO_0000015')} target="_blank" rel="noopener external">BioPortal search</a>
            by its PURL or local ID.
          </p>
        </div>
      </aside>
    </div>
  {/if}
</main>

<style>
  .sparql-page {
    max-width: 1180px;
    margin: 0 auto;
    padding: 2.25rem 1.15rem 4rem;
    color: var(--app-text);
    font-family: var(--app-font-ui);
  }

  .hero {
    margin-bottom: 2rem;
  }

  .eyebrow {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--app-accent);
    margin: 0 0 0.35rem;
  }

  .hero h1 {
    font-size: clamp(1.6rem, 3vw, 2.1rem);
    line-height: 1.15;
    font-weight: 800;
    color: var(--app-text-strong);
    margin: 0 0 0.6rem;
  }

  .subhead {
    font-size: 0.98rem;
    line-height: 1.55;
    max-width: 62ch;
    color: var(--app-muted);
    margin: 0;
  }

  .workspace {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 21rem;
    gap: 1.5rem;
    align-items: start;
  }

  .main-column {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .panel {
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    padding: 1.1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .control-row {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .control-row + .control-row {
    padding-top: 1rem;
    border-top: var(--app-border-width) solid var(--app-border);
  }

  .control-row label {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--app-text-strong);
  }

  .checkbox-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .control-row select {
    font-size: 0.9rem;
    background: var(--app-bg);
    color: var(--app-text);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    padding: 0.5rem 0.6rem;
    margin: 0;
  }

  .hint {
    font-size: 0.82rem;
    line-height: 1.5;
    color: var(--app-muted);
    margin: 0;
  }

  .editor-panel {
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    overflow: hidden;
  }

  .editor-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 0.9rem;
    background: var(--app-surface-2);
    border-bottom: var(--app-border-width) solid var(--app-border);
  }

  .editor-label {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--app-muted);
  }

  .run-btn {
    font-size: 0.82rem;
    font-weight: 700;
    padding: 0.4rem 1.1rem;
    margin: 0;
  }

  .code-editor {
    display: block;
    width: 100%;
    box-sizing: border-box;
    margin: 0;
    padding: 1rem 1.1rem;
    border: none;
    border-radius: 0;
    background: var(--app-bg);
    color: var(--app-text);
    font-family: var(--app-font-mono);
    font-size: 0.86rem;
    line-height: 1.65;
    tab-size: 2;
    resize: vertical;
  }

  .code-editor:focus {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--app-accent);
  }

  .error-panel {
    font-size: 0.86rem;
    line-height: 1.5;
    color: var(--app-error, #b33c2e);
    background: color-mix(in srgb, var(--app-error, #b33c2e) 10%, var(--app-surface));
    border: var(--app-border-width) solid var(--app-error, #b33c2e);
    border-radius: var(--app-radius);
    padding: 0.75rem 0.9rem;
  }

  .results-panel {
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    overflow: hidden;
  }

  .results-scroll {
    overflow-x: auto;
  }

  .results-panel table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.84rem;
    margin: 0;
  }

  .results-panel th {
    text-align: left;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--app-muted);
    background: var(--app-surface-2);
    padding: 0.6rem 0.85rem;
    border-bottom: var(--app-border-width) solid var(--app-border);
    white-space: nowrap;
  }

  .results-panel td {
    padding: 0.55rem 0.85rem;
    border-bottom: var(--app-border-width) solid var(--app-border-subtle, var(--app-border));
    vertical-align: top;
  }

  .results-panel tbody tr:last-child td {
    border-bottom: none;
  }

  .results-panel tbody tr:hover {
    background: var(--app-accent-soft);
  }

  .row-count {
    margin: 0;
    padding: 0.55rem 0.85rem;
    font-size: 0.78rem;
    color: var(--app-muted);
    border-top: var(--app-border-width) solid var(--app-border);
  }

  .side-column {
    min-width: 0;
  }

  .about-panel {
    position: sticky;
    top: 1.25rem;
    gap: 0.75rem;
    font-size: 0.85rem;
    line-height: 1.55;
    color: var(--app-text);
  }

  .about-panel h2 {
    margin: 0;
    font-size: 1rem;
    color: var(--app-text-strong);
  }

  .about-panel h3 {
    margin: 0.4rem 0 0;
    font-size: 0.82rem;
    color: var(--app-text-strong);
  }

  .about-panel p {
    margin: 0;
    color: var(--app-muted);
  }

  .about-panel ul {
    margin: 0;
    padding-left: 1.1rem;
    color: var(--app-muted);
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .about-panel code {
    font-size: 0.82em;
    word-break: break-word;
  }

  .source-urls {
    font-family: var(--app-font-mono);
    font-size: 0.78rem;
  }

  .source-urls a {
    word-break: break-all;
  }

  @media (max-width: 980px) {
    .workspace {
      grid-template-columns: 1fr;
    }

    .about-panel {
      position: static;
    }
  }
</style>
