<script>
  import { onDestroy, onMount } from 'svelte'
  import { applicationAsset, applicationRoute } from '../../config/applicationUrls.js'
  import ontologyManifest from '../../../static/ontology/manifest.json' with { type: 'json' }
  import {
    INSTANCE_URLS,
    ONTOLOGY_SOURCES,
    loadLiveEcosystem,
    loadStaticKnowledgeGraph,
    mergeStores,
    staticInstanceSources,
  } from '../../rdf/loader.js'
  import { selectLimited } from '../../rdf/query.js'
  import { RELEASE_VERSION, VERSION_IRI } from '../../ui/entrance/releaseMetadata.js'
  import {
    EXAMPLE_QUERIES,
    EXAMPLE_QUERY_CATEGORIES,
    bioportalSearchUrl,
    wikidataQueryServiceUrl,
  } from '../../ui/sparql/exampleQueries.js'
  import {
    compactNumber,
    createQueryRunContext,
    datasetStats,
    detectQueryKind,
    externalHttpUrl,
    friendlyQueryError,
    queryRunIsStale,
    rowsToTsv,
    termQualifier,
  } from '../../ui/sparql/workbench.js'

  const LIVE_SOURCE_URL = INSTANCE_URLS.ecosystem[0]
  const RESULT_DISPLAY_LIMIT = 250
  const RESULT_COLLECTION_LIMIT = 1000
  const QUERY_TIMEOUT_MS = 15_000
  const FEATURED_EXAMPLE_IDS = [
    'vocab-modality-domains',
    'catalog-presets',
    'evidence-claims',
    'exposure-channels',
  ]
  const featuredExamples = FEATURED_EXAMPLE_IDS
    .map(id => EXAMPLE_QUERIES.find(example => example.id === id))
    .filter(Boolean)
  const ontologySources = Object.values(ONTOLOGY_SOURCES)
  const staticDataSources = staticInstanceSources()
  const publicDataSourceCount = staticDataSources.length
  const currentVersion = ontologyManifest.suite.version
  const currentStatus = ontologyManifest.suite.status

  const DEFAULT_QUERY = `PREFIX sstim: <https://w3id.org/sstim#>
PREFIX rdfs:  <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?class ?label WHERE {
  GRAPH ?graph {
    ?class a <http://www.w3.org/2002/07/owl#Class> .
    FILTER(isIRI(?class))
    OPTIONAL { ?class rdfs:label ?label . FILTER(LANG(?label) = "en") }
  }
}
ORDER BY ?label
LIMIT 100`

  let store = $state(null)
  let staticStore = $state(null)
  let selectedExampleId = $state('')
  let query = $state(DEFAULT_QUERY)
  let rows = $state([])
  let resultsTruncated = $state(false)
  let columns = $state([])
  let queryError = $state(null)
  let loadError = $state(null)
  let running = $state(false)
  let loading = $state(true)
  let hasRun = $state(false)
  let durationMs = $state(0)
  let runStatus = $state('')
  let copied = $state('')
  let copyFailed = $state('')
  let copyStatus = $state('')
  let copyTimer
  let runController
  let includeLive = $state(false)
  let loadingLive = $state(false)
  let liveStatus = $state({
    state: 'disabled',
    source: LIVE_SOURCE_URL,
    message: 'Live stakeholder data is off.',
  })
  let staticDatasetStats = $state({ quadCount: 0, namedGraphCount: 0 })
  let currentDatasetStats = $state({ quadCount: 0, namedGraphCount: 0 })
  let datasetRevision = $state(0)
  let lastRunContext = $state(null)

  let selectedExample = $derived(EXAMPLE_QUERIES.find(item => item.id === selectedExampleId) ?? null)
  let queryKind = $derived(detectQueryKind(query))
  let displayedRows = $derived(rows.slice(0, RESULT_DISPLAY_LIMIT))
  let resultsStale = $derived(
    hasRun && lastRunContext && queryRunIsStale(lastRunContext, query, datasetRevision),
  )
  let hasWikidataLinks = $derived(columns.includes('wikidataId'))

  onMount(loadStaticData)
  onDestroy(() => {
    clearTimeout(copyTimer)
    runController?.abort()
  })

  async function loadStaticData() {
    loading = true
    loadError = null
    try {
      staticStore = await loadStaticKnowledgeGraph()
      store = staticStore
      datasetRevision += 1
      staticDatasetStats = datasetStats(staticStore)
      currentDatasetStats = staticDatasetStats
    } catch (error) {
      loadError = {
        summary: 'The SSTIM knowledge graph could not be loaded.',
        guidance: 'Check your connection and try again. The ontology files are fetched from this site and queries cannot run until they are available.',
        technical: error instanceof Error ? error.message : String(error),
      }
    } finally {
      loading = false
    }
  }

  async function setIncludeLive(value) {
    includeLive = value
    if (!includeLive) {
      store = staticStore
      datasetRevision += 1
      currentDatasetStats = staticDatasetStats
      liveStatus = {
        state: 'disabled',
        source: LIVE_SOURCE_URL,
        message: 'Live stakeholder data is off.',
      }
      clearOutcome()
      return
    }

    loadingLive = true
    liveStatus = {
      state: 'loading',
      source: LIVE_SOURCE_URL,
      message: 'Fetching the live stakeholder network…',
    }
    const live = await loadLiveEcosystem()
    liveStatus = live.status
    store = mergeStores(staticStore, live.store)
    datasetRevision += 1
    currentDatasetStats = datasetStats(store)
    loadingLive = false
    clearOutcome()
  }

  function toggleLive(event) {
    void setIncludeLive(event.currentTarget.checked)
  }

  function chooseExample(id) {
    const example = EXAMPLE_QUERIES.find(item => item.id === id)
    if (!example) return
    selectedExampleId = id
    query = example.sparql
    clearOutcome()
    if (example.requiresLive && !includeLive) void setIncludeLive(true)
  }

  function loadExample(event) {
    const id = event.currentTarget.value
    if (id) chooseExample(id)
  }

  function resetQuery() {
    selectedExampleId = ''
    query = DEFAULT_QUERY
    clearOutcome()
  }

  function clearOutcome() {
    rows = []
    resultsTruncated = false
    columns = []
    queryError = null
    hasRun = false
    lastRunContext = null
    durationMs = 0
    runStatus = ''
  }

  function handleEditorKeydown(event) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()
      void run()
    }
  }

  async function run() {
    if (!store || running || loadingLive) return

    queryError = null
    const runContext = createQueryRunContext(
      query,
      datasetRevision,
      liveStatus.state === 'available' ? 'Static + live stakeholder network' : 'Static repository dataset',
    )
    const kind = detectQueryKind(runContext.query)
    // Only reject query forms we can identify with certainty. Unknown syntax is
    // passed to Comunica so this lightweight hint never excludes legal SPARQL.
    if (kind !== 'SELECT' && kind !== 'Unknown') {
      queryError = friendlyQueryError(new Error(`Unsupported table query form: ${kind}`), runContext.query)
      rows = []
      resultsTruncated = false
      columns = []
      hasRun = false
      runStatus = 'The query needs attention before it can run.'
      return
    }

    running = true
    runStatus = 'Query running. The engine is loaded on demand the first time.'
    const startedAt = performance.now()
    const controller = new AbortController()
    runController = controller
    try {
      const result = await selectLimited(store, runContext.query, RESULT_COLLECTION_LIMIT, {
        timeoutMs: QUERY_TIMEOUT_MS,
        signal: controller.signal,
      })
      rows = result.rows
      resultsTruncated = result.truncated
      columns = result.columns
      durationMs = Math.round(performance.now() - startedAt)
      lastRunContext = runContext
      hasRun = true
      const changedWhileRunning = queryRunIsStale(runContext, query, datasetRevision)
      runStatus = changedWhileRunning
        ? 'Query complete for the previous editor or dataset state; results are marked stale.'
        : result.truncated
        ? `Query paused after collecting ${RESULT_COLLECTION_LIMIT} rows.`
        : `Query complete: ${result.rows.length} row${result.rows.length === 1 ? '' : 's'}.`
    } catch (error) {
      queryError = friendlyQueryError(error, runContext.query)
      rows = []
      resultsTruncated = false
      columns = []
      hasRun = false
      runStatus = 'The query could not be completed.'
    } finally {
      if (runController === controller) runController = null
      running = false
    }
  }

  function cancelQuery() {
    if (!running || !runController) return
    runStatus = 'Cancelling query…'
    runController.abort()
  }

  async function copyText(text, target) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(text)
      copied = target
      copyFailed = ''
      copyStatus = target === 'results'
        ? 'Shown rows copied as SPARQL Results TSV with RDF term types preserved.'
        : 'Query copied.'
      clearTimeout(copyTimer)
      copyTimer = setTimeout(() => {
        copied = ''
        copyStatus = ''
      }, 1600)
    } catch (error) {
      console.warn('Clipboard copy failed', error)
      copied = ''
      copyFailed = target
      copyStatus = 'Copy is unavailable in this browser. Select the content and copy it manually.'
    }
  }

  function copyResults() {
    return copyText(rowsToTsv(columns, displayedRows), 'results')
  }

  function formatFetchedAt(value) {
    if (!value) return ''
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  }
</script>

<svelte:head>
  <title>SPARQL workbench | SSTIM Workbench</title>
  <meta
    name="description"
    content="Run private, in-browser SELECT queries over the SSTIM ontology and versioned public catalog."
  />
</svelte:head>

<main class="sparql-page">
  <header class="hero">
    <div class="hero-copy">
      <p class="eyebrow">Knowledge workbench</p>
      <h1>Ask SSTIM precise questions</h1>
      <p class="subhead">
        Explore terminology, evidence, presets, exposure models, and alignments with
        verified examples or your own SPARQL <code>SELECT</code> query. Everything runs
        in this browser tab; your query is not sent to a query server.
      </p>
    </div>
    <div class="hero-signals" aria-label="Workbench characteristics">
      <span>Private by design</span>
      <span>Named-graph aware</span>
      <span>Comunica, loaded on demand</span>
    </div>
  </header>

  {#if loading}
    <section class="loading-card" aria-live="polite" aria-busy="true">
      <span class="status-orb loading" aria-hidden="true"></span>
      <div>
        <strong>Preparing the knowledge graph</strong>
        <p>Loading the Full profile and committed public data from local RDF files…</p>
      </div>
    </section>
  {:else if loadError}
    <section class="load-error" role="alert">
      <div>
        <p class="error-kicker">Data unavailable</p>
        <h2>{loadError.summary}</h2>
        <p>{loadError.guidance}</p>
        <details>
          <summary>Technical details</summary>
          <code>{loadError.technical}</code>
        </details>
      </div>
      <button type="button" onclick={loadStaticData}>Try again</button>
    </section>
  {:else}
    <section class="dataset-bar" aria-label="Current query dataset">
      <div class="dataset-ready">
        <span class="status-orb ready" aria-hidden="true"></span>
        <div>
          <strong>Dataset ready</strong>
          <span>SSTIM {currentVersion} · {currentStatus}</span>
        </div>
      </div>
      <dl>
        <div>
          <dt>Statements</dt>
          <dd>{compactNumber(currentDatasetStats.quadCount)}</dd>
        </div>
        <div>
          <dt>Named graphs</dt>
          <dd>{currentDatasetStats.namedGraphCount}</dd>
        </div>
        <div>
          <dt>Live data</dt>
          <dd>{includeLive && liveStatus.state === 'available' ? 'Included' : includeLive ? liveStatus.state : 'Off'}</dd>
        </div>
      </dl>
      <a href="#data-and-trust">Data &amp; trust notes ↓</a>
    </section>

    <div class="workspace">
      <div class="main-column">
        <section class="starter-panel" aria-labelledby="starter-heading">
          <header class="section-heading">
            <span class="step" aria-hidden="true">1</span>
            <div>
              <h2 id="starter-heading">Start from a real question</h2>
              <p>Each example is maintained against SSTIM’s named-graph layout and can be edited freely.</p>
            </div>
          </header>

          <div class="example-grid">
            {#each featuredExamples as example (example.id)}
              <button
                type="button"
                class="example-card"
                class:selected={selectedExampleId === example.id}
                aria-pressed={selectedExampleId === example.id}
                onclick={() => chooseExample(example.id)}
              >
                <span class="example-category">{example.category}</span>
                <strong>{example.title}</strong>
                <span>{example.description}</span>
              </button>
            {/each}
          </div>

          <div class="all-examples">
            <label for="example-picker">All verified examples</label>
            <select id="example-picker" value={selectedExampleId} onchange={loadExample}>
              <option value="">Choose another query…</option>
              {#each EXAMPLE_QUERY_CATEGORIES as category}
                <optgroup label={category}>
                  {#each EXAMPLE_QUERIES.filter(item => item.category === category) as example}
                    <option value={example.id}>{example.title}</option>
                  {/each}
                </optgroup>
              {/each}
            </select>
          </div>

          {#if selectedExample}
            <div class="example-note">
              <span class="source-tag" class:live={selectedExample.requiresLive}>
                {selectedExample.requiresLive ? 'Live source required' : 'Static, repository-backed data'}
              </span>
              <p>{selectedExample.description}</p>
            </div>
          {/if}
        </section>

        <section class="editor-panel" aria-labelledby="query-heading">
          <header class="editor-heading">
            <div class="section-heading compact">
              <span class="step" aria-hidden="true">2</span>
              <div>
                <h2 id="query-heading">Inspect or write the query</h2>
                <p id="query-help">Use <code>GRAPH ?graph</code> around patterns; press Ctrl/⌘ + Enter to run.</p>
              </div>
            </div>
            <span class="query-kind" class:unsupported={queryKind !== 'SELECT'}>{queryKind}</span>
          </header>

          <label class="visually-hidden" for="sparql-query">SPARQL SELECT query</label>
          <textarea
            id="sparql-query"
            class="code-editor"
            rows="17"
            bind:value={query}
            aria-describedby="query-help"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            onkeydown={handleEditorKeydown}
          ></textarea>

          <footer class="editor-actions">
            <div class="secondary-actions">
              <button type="button" class="quiet-btn" onclick={() => copyText(query, 'query')}>
              {copied === 'query' ? 'Query copied' : copyFailed === 'query' ? 'Copy unavailable' : 'Copy query'}
              </button>
              <button type="button" class="quiet-btn" onclick={resetQuery}>Reset</button>
            </div>
            <div class="run-controls">
              {#if running}
                <button type="button" class="cancel-btn" onclick={cancelQuery}>Cancel query</button>
              {/if}
              <button
                type="button"
                class="run-btn"
                onclick={run}
                aria-busy={running}
                disabled={running || loadingLive}
              >
                {running ? 'Running…' : loadingLive ? 'Loading live data…' : 'Run query'}
              </button>
            </div>
          </footer>
        </section>

        <p class="visually-hidden" aria-live="polite">{runStatus}</p>
        <p class="visually-hidden" aria-live="polite">{copyStatus}</p>

        {#if queryError}
          <section class="query-error" role="alert">
            <div class="error-symbol" aria-hidden="true">!</div>
            <div>
              <p class="error-kicker">Query needs attention</p>
              <h2>{queryError.summary}</h2>
              <p>{queryError.guidance}</p>
              <details>
                <summary>Technical details</summary>
                <code>{queryError.technical}</code>
              </details>
            </div>
          </section>
        {/if}

        {#if hasRun}
          <section class="results-panel" aria-labelledby="results-heading">
            <header class="results-heading">
              <div>
                <p class="results-kicker">Query complete</p>
                <h2 id="results-heading">
                  {resultsTruncated ? `${compactNumber(RESULT_COLLECTION_LIMIT)}+` : compactNumber(rows.length)}
                  result row{rows.length === 1 && !resultsTruncated ? '' : 's'}
                </h2>
                <span>
                  {durationMs} ms · {columns.length} variable{columns.length === 1 ? '' : 's'} ·
                  {lastRunContext?.datasetLabel}
                </span>
              </div>
              <div class="result-copy">
                <button
                  type="button"
                  class="quiet-btn"
                  onclick={copyResults}
                  disabled={!rows.length}
                >
                  {copied === 'results' ? 'TSV copied' : copyFailed === 'results' ? 'Copy unavailable' : 'Copy shown rows · TSV'}
                </button>
                <span>IRIs, blank nodes, languages, and datatypes are preserved.</span>
              </div>
            </header>

            {#if resultsStale}
              <p class="stale-note" role="status">
                The query or dataset has changed since these results were produced. Run it again to refresh them.
              </p>
            {/if}

            {#if rows.length === 0}
              <div class="empty-results">
                <strong>No rows matched.</strong>
                <p>The query ran successfully. Check IRIs, filters, and whether each pattern is inside the right named-graph block.</p>
              </div>
            {:else}
              <!-- svelte-ignore a11y_no_noninteractive_tabindex (keyboard access to the overflow region) -->
              <div class="results-scroll" role="region" tabindex="0" aria-label="Scrollable query results">
                <table>
                  <caption class="visually-hidden">SPARQL SELECT query results</caption>
                  <thead>
                    <tr>
                      {#each columns as column}<th scope="col">?{column}</th>{/each}
                      {#if hasWikidataLinks}<th scope="col">External lookup</th>{/if}
                    </tr>
                  </thead>
                  <tbody>
                    {#each displayedRows as row}
                      <tr>
                        {#each columns as column}
                          {@const term = row[column]}
                          {@const termHref = term?.termType === 'NamedNode' ? externalHttpUrl(term.value) : null}
                          <td>
                            {#if !term}
                              <span class="unbound" title="Variable is unbound">—</span>
                            {:else if termHref}
                              <a
                                class="term-value iri"
                                href={termHref}
                                title={term.value}
                                target="_blank"
                                rel="noopener external"
                              >{term.value}</a>
                            {:else if term.termType === 'NamedNode'}
                              <span class="term-value non-web-iri" title="RDF IRI (not a web URL)">{term.value}</span>
                            {:else}
                              <span class="term-value">{term.value}</span>
                              {#if termQualifier(term)}
                                <span class="term-qualifier" title={term.datatype?.value ?? ''}>{termQualifier(term)}</span>
                              {/if}
                            {/if}
                          </td>
                        {/each}
                        {#if hasWikidataLinks}
                          <td class="external-cell">
                            {#if row.wikidataId}
                              <a
                                href={wikidataQueryServiceUrl(row.wikidataId.value)}
                                target="_blank"
                                rel="noopener external"
                              >Open in Wikidata ↗</a>
                            {/if}
                          </td>
                        {/if}
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>

              {#if resultsTruncated}
                <p class="result-limit">
                  Showing the first {RESULT_DISPLAY_LIMIT} rows. The workbench stopped collecting after
                  confirming more than {compactNumber(RESULT_COLLECTION_LIMIT)} matches, so this is not the
                  full result. Add <code>LIMIT</code> and <code>OFFSET</code> to inspect bounded slices.
                </p>
              {:else if rows.length > RESULT_DISPLAY_LIMIT}
                <p class="result-limit">
                  Showing the first {RESULT_DISPLAY_LIMIT} of {compactNumber(rows.length)} rows to keep the page responsive.
                  Add <code>LIMIT</code> and <code>OFFSET</code> to inspect a smaller slice.
                </p>
              {/if}
            {/if}
          </section>
        {/if}
      </div>

      <aside class="side-column" aria-label="Dataset and query guidance">
        <section class="guide-card dataset-card">
          <header>
            <p class="card-kicker">Query source</p>
            <h2>Know what you are querying</h2>
          </header>

          <div class="source-state">
            <span class="status-orb ready" aria-hidden="true"></span>
            <div>
              <strong>Current site build</strong>
              <span>SSTIM {currentVersion} ({currentStatus})</span>
            </div>
          </div>

          <p class="trust-copy">
            This page uses the site’s current RDF, which may be ahead of a release. For
            research or publication, pin and cite immutable <a href={VERSION_IRI} rel="external">SSTIM {RELEASE_VERSION}</a>.
          </p>

          <dl class="source-facts">
            <div><dt>Ontology + shapes</dt><dd>{ontologySources.length} modules</dd></div>
            <div><dt>Public data documents</dt><dd>{publicDataSourceCount}</dd></div>
            <div><dt>Execution</dt><dd>In this tab</dd></div>
          </dl>

          <div class="live-control">
            <label>
              <input
                type="checkbox"
                checked={includeLive}
                onchange={toggleLive}
                disabled={loading || loadingLive || running}
                aria-describedby="live-help live-status"
              />
              Include live stakeholders
            </label>
            <p id="live-help">Optional external data about public people and organizations. Mutable and not part of a citable SSTIM release.</p>
            <div
              id="live-status"
              class="live-status"
              data-state={liveStatus.state}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <strong>
                {#if liveStatus.state === 'available'}Live source loaded
                {:else if liveStatus.state === 'empty'}Live source is empty
                {:else if liveStatus.state === 'unavailable'}Live source unavailable
                {:else if liveStatus.state === 'loading'}Loading live source
                {:else}Live source off{/if}
              </strong>
              {#if liveStatus.state === 'available'}
                <span>{compactNumber(liveStatus.quadCount)} statements · fetched {formatFetchedAt(liveStatus.fetchedAt)}</span>
              {:else if liveStatus.state === 'unavailable'}
                <span>The static graph remains fully available.</span>
                <button
                  type="button"
                  class="text-btn"
                  onclick={() => setIncludeLive(true)}
                  disabled={loading || loadingLive || running}
                >Retry</button>
              {:else}
                <span>{liveStatus.message}</span>
              {/if}
            </div>
          </div>
        </section>

        <section class="guide-card graph-card">
          <header>
            <p class="card-kicker">Essential pattern</p>
            <h2>Query named graphs</h2>
          </header>
          <p>All loaded statements retain source-family provenance. Start with:</p>
          <pre><code>SELECT ?s ?p ?o WHERE {'{'}
  GRAPH ?graph {'{'} ?s ?p ?o {'}'}
{'}'}
LIMIT 25</code></pre>
          <p>
            For a join across different sources, use independent graph variables such as
            <code>?g1</code> and <code>?g2</code>. One shared variable requires both patterns to occur in the same graph.
          </p>
        </section>

        <section class="guide-card boundary-card">
          <header>
            <p class="card-kicker">Clear boundary</p>
            <h2>A workbench, not a hosted endpoint</h2>
          </header>
          <p>
            This table runs <code>SELECT</code> locally. It does not expose an HTTP SPARQL endpoint and does not federate <code>SERVICE</code> calls.
          </p>
          <p>
            After the query engine is ready, each run has a {QUERY_TIMEOUT_MS / 1000}-second time limit and can be cancelled. Use <code>LIMIT</code> for predictable slices.
          </p>
          <div class="guide-links">
            <a href={applicationRoute('/graph/')}>Browse visually →</a>
            <a href={applicationRoute('/presets/')}>Browse presets →</a>
            <a href={applicationAsset('/ontology/sstim-full-profile.ttl')} download>Download Full profile entry point →</a>
          </div>
        </section>
      </aside>
    </div>

    <section class="trust-section" id="data-and-trust" aria-labelledby="trust-heading">
      <header>
        <p class="eyebrow">Provenance &amp; limits</p>
        <h2 id="trust-heading">What this workbench does—and does not do</h2>
        <p>Enough detail to interpret a result, reproduce it elsewhere, and cite the right artifact.</p>
      </header>

      <div class="trust-grid">
        <article>
          <span class="trust-number" aria-hidden="true">01</span>
          <h3>Repository-backed static graph</h3>
          <p>
            The default dataset combines the Full profile’s 16 semantic modules and Full SHACL shapes with committed frameworks, implementations, presets, protocols, evidence, experiments, references, and the synthetic reference session. Fixtures and private data are excluded.
          </p>
        </article>
        <article>
          <span class="trust-number" aria-hidden="true">02</span>
          <h3>Private local execution</h3>
          <p>
            Comunica is downloaded lazily and executes against an in-memory RDFJS store. The site fetches RDF sources, but it does not transmit your query text or results to a query service. External links open only when you choose them.
          </p>
        </article>
        <article>
          <span class="trust-number" aria-hidden="true">03</span>
          <h3>Honest interface boundary</h3>
          <p>
            The shared code API supports SELECT, ASK, and CONSTRUCT. This page deliberately renders SELECT bindings only. Each run can be cancelled, is stopped after {QUERY_TIMEOUT_MS / 1000} seconds once the engine is ready, collects at most {compactNumber(RESULT_COLLECTION_LIMIT)} rows, and displays at most {RESULT_DISPLAY_LIMIT}; use LIMIT and OFFSET for broad queries.
          </p>
        </article>
      </div>

      <details class="source-inventory">
        <summary>Full ontology source inventory ({ontologySources.length} modules)</summary>
        <ul>
          {#each ontologySources as source}
            <li>
              <a href={source.persistentUrl} rel="external">{source.title}</a>
              <span>File <code>{source.url}</code></span>
              <span>Graph <code>{source.graph}</code></span>
            </li>
          {/each}
        </ul>
      </details>

      <details class="source-inventory">
        <summary>Static public instance inventory ({staticDataSources.length} documents)</summary>
        <p>These repository-backed documents are loaded by default. Files that share a source family intentionally share its named graph.</p>
        <ul>
          {#each staticDataSources as source}
            <li>
              <a href={source.url}>{source.url.split('/').at(-1)}</a>
              <span>File <code>{source.url}</code></span>
              <span>Graph <code>{source.graph}</code></span>
            </li>
          {/each}
        </ul>
      </details>

      <div class="external-note">
        <div>
          <h3>Using another SPARQL tool</h3>
          <p>
            Fetch the same RDF into Jena, Oxigraph, rdflib, or a local Comunica process. Preserve each source’s named graph if you want results to match this page.
          </p>
        </div>
        <div class="external-actions">
          <a href={VERSION_IRI} rel="external">Immutable {RELEASE_VERSION} release</a>
          <a href="https://w3id.org/sstim" rel="external">Persistent namespace</a>
          <a href={bioportalSearchUrl('BFO_0000015')} target="_blank" rel="noopener external">Search an OBO term</a>
        </div>
      </div>
    </section>
  {/if}
</main>

<style>
  .sparql-page {
    max-width: 1240px;
    margin: 0 auto;
    padding: 2rem 1.15rem 5rem;
    color: var(--app-text);
    font-family: var(--app-font-ui);
  }

  .hero {
    position: relative;
    overflow: hidden;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 2rem;
    align-items: end;
    margin-bottom: 1rem;
    padding: clamp(1.4rem, 4vw, 2.6rem);
    background:
      radial-gradient(circle at 88% 10%, color-mix(in srgb, var(--app-accent) 16%, transparent) 0, transparent 34%),
      linear-gradient(135deg, var(--app-surface), color-mix(in srgb, var(--app-surface-2) 72%, var(--app-surface)));
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) * 2);
  }

  .hero-copy { max-width: 760px; }

  .eyebrow,
  .card-kicker,
  .results-kicker,
  .error-kicker {
    margin: 0 0 0.4rem;
    color: var(--app-accent);
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }

  .hero h1 {
    margin: 0 0 0.7rem;
    max-width: 18ch;
    color: var(--app-text-strong);
    font-size: clamp(2rem, 5vw, 3.55rem);
    font-weight: 830;
    letter-spacing: -0.045em;
    line-height: 0.98;
  }

  .subhead {
    max-width: 68ch;
    margin: 0;
    color: var(--app-muted);
    font-size: clamp(0.96rem, 1.5vw, 1.08rem);
    line-height: 1.65;
  }

  .subhead code { color: var(--app-text-strong); }

  .hero-signals {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.45rem;
    padding-bottom: 0.15rem;
  }

  .hero-signals span,
  .source-tag,
  .query-kind {
    width: fit-content;
    padding: 0.25rem 0.55rem;
    color: var(--app-muted);
    background: color-mix(in srgb, var(--app-surface) 76%, transparent);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 720;
    letter-spacing: 0.02em;
  }

  .loading-card,
  .load-error,
  .dataset-bar {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    padding: 0.85rem 1rem;
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
  }

  .loading-card { min-height: 5rem; }
  .loading-card strong { color: var(--app-text-strong); }
  .loading-card p { margin: 0.2rem 0 0; color: var(--app-muted); font-size: 0.86rem; }

  .status-orb {
    flex: 0 0 auto;
    width: 0.65rem;
    height: 0.65rem;
    background: var(--app-muted);
    border-radius: 50%;
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--app-muted) 14%, transparent);
  }

  .status-orb.ready {
    background: var(--app-ok);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--app-ok) 14%, transparent);
  }

  .status-orb.loading {
    background: var(--app-accent);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--app-accent) 14%, transparent);
  }

  .load-error {
    justify-content: space-between;
    border-color: var(--app-error);
  }

  .load-error h2,
  .query-error h2 { margin: 0; font-size: 1rem; color: var(--app-text-strong); }
  .load-error p,
  .query-error p { margin: 0.35rem 0 0; color: var(--app-muted); font-size: 0.86rem; line-height: 1.55; }
  .load-error details,
  .query-error details { margin-top: 0.7rem; color: var(--app-muted); font-size: 0.78rem; }
  .load-error details code,
  .query-error details code { display: block; margin-top: 0.45rem; overflow-wrap: anywhere; }
  .load-error button { flex: 0 0 auto; margin: 0; }

  .dataset-bar {
    justify-content: space-between;
    margin-bottom: 1.25rem;
    padding: 0.75rem 1rem;
  }

  .dataset-ready,
  .source-state {
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }

  .dataset-ready div,
  .source-state div { display: flex; flex-direction: column; gap: 0.1rem; }
  .dataset-ready strong,
  .source-state strong { color: var(--app-text-strong); font-size: 0.8rem; }
  .dataset-ready span:not(.status-orb),
  .source-state span:not(.status-orb) { color: var(--app-muted); font-size: 0.72rem; }

  .dataset-bar dl {
    display: flex;
    gap: 1.75rem;
    margin: 0;
  }

  .dataset-bar dl div { display: flex; flex-direction: column; gap: 0.05rem; }
  .dataset-bar dt { color: var(--app-muted); font-size: 0.64rem; font-weight: 750; letter-spacing: 0.07em; text-transform: uppercase; }
  .dataset-bar dd { margin: 0; color: var(--app-text-strong); font-size: 0.83rem; font-weight: 720; text-transform: capitalize; }
  .dataset-bar > a { font-size: 0.76rem; font-weight: 700; white-space: nowrap; }

  .workspace {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 19.5rem;
    gap: 1.35rem;
    align-items: start;
  }

  .main-column {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
  }

  .starter-panel,
  .editor-panel,
  .results-panel,
  .guide-card,
  .trust-section {
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
  }

  .starter-panel { padding: 1.2rem; }

  .section-heading {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .section-heading.compact { align-items: center; }

  .step {
    display: grid;
    flex: 0 0 auto;
    width: 1.7rem;
    height: 1.7rem;
    place-items: center;
    color: var(--app-text-strong);
    background: var(--app-accent-soft);
    border: var(--app-border-width) solid color-mix(in srgb, var(--app-accent) 38%, var(--app-border));
    border-radius: 50%;
    font-size: 0.75rem;
    font-weight: 800;
  }

  .section-heading h2,
  .guide-card h2,
  .trust-section h2,
  .trust-section h3 {
    margin: 0;
    color: var(--app-text-strong);
  }

  .section-heading h2 { font-size: 0.98rem; }
  .section-heading p { margin: 0.22rem 0 0; color: var(--app-muted); font-size: 0.78rem; line-height: 1.5; }

  .example-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.65rem;
    margin-top: 1rem;
  }

  .example-card {
    display: flex;
    min-height: 8.2rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
    margin: 0;
    padding: 0.9rem;
    text-align: left;
    color: var(--app-text);
    background: var(--app-bg);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    box-shadow: none;
  }

  .example-card:hover,
  .example-card:focus-visible,
  .example-card.selected {
    color: var(--app-text);
    background: var(--app-accent-soft);
    border-color: var(--app-accent);
    transform: none;
  }

  .example-card .example-category {
    color: var(--app-accent);
    font-size: 0.64rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .example-card strong { color: var(--app-text-strong); font-size: 0.84rem; line-height: 1.3; }
  .example-card > span:last-child {
    display: -webkit-box;
    overflow: hidden;
    color: var(--app-muted);
    font-size: 0.72rem;
    line-height: 1.45;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
  }

  .all-examples {
    display: grid;
    grid-template-columns: auto minmax(12rem, 1fr);
    gap: 0.8rem;
    align-items: center;
    margin-top: 0.8rem;
  }

  .all-examples label { margin: 0; color: var(--app-text-strong); font-size: 0.76rem; font-weight: 750; }
  .all-examples select {
    min-width: 0;
    height: auto;
    margin: 0;
    padding: 0.5rem 2rem 0.5rem 0.65rem;
    color: var(--app-text);
    background-color: var(--app-bg);
    border-color: var(--app-border);
    font-size: 0.78rem;
  }

  .example-note {
    display: flex;
    gap: 0.65rem;
    align-items: flex-start;
    margin-top: 0.8rem;
    padding-top: 0.8rem;
    border-top: var(--app-border-width) solid var(--app-border-subtle);
  }

  .example-note p { margin: 0; color: var(--app-muted); font-size: 0.76rem; line-height: 1.5; }
  .source-tag { flex: 0 0 auto; color: var(--app-ok); border-color: color-mix(in srgb, var(--app-ok) 42%, var(--app-border)); }
  .source-tag.live { color: var(--app-warn); border-color: color-mix(in srgb, var(--app-warn) 42%, var(--app-border)); }

  .editor-panel { overflow: hidden; }

  .editor-heading,
  .editor-actions,
  .results-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.8rem 1rem;
    background: var(--app-surface-2);
  }

  .editor-heading { border-bottom: var(--app-border-width) solid var(--app-border); }
  .query-kind { color: var(--app-ok); background: var(--app-surface); border-color: color-mix(in srgb, var(--app-ok) 42%, var(--app-border)); }
  .query-kind.unsupported { color: var(--app-warn); border-color: color-mix(in srgb, var(--app-warn) 42%, var(--app-border)); }

  .code-editor {
    display: block;
    width: 100%;
    min-height: 21rem;
    box-sizing: border-box;
    margin: 0;
    padding: 1.1rem 1.2rem;
    resize: vertical;
    color: var(--app-text);
    background: var(--app-bg);
    border: 0;
    border-radius: 0;
    font-family: var(--app-font-mono);
    font-size: 0.82rem;
    line-height: 1.7;
    tab-size: 2;
  }

  .code-editor:focus { outline: 2px solid var(--app-accent); outline-offset: -2px; box-shadow: none; }

  .editor-actions {
    padding: 0.65rem 0.8rem;
    border-top: var(--app-border-width) solid var(--app-border);
  }

  .secondary-actions { display: flex; gap: 0.45rem; }
  .run-controls { display: flex; align-items: center; gap: 0.45rem; }

  .quiet-btn,
  .text-btn {
    width: auto;
    margin: 0;
    color: var(--app-text);
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    box-shadow: none;
    font-size: 0.74rem;
    font-weight: 720;
  }

  .quiet-btn { padding: 0.4rem 0.7rem; }
  .quiet-btn:hover:not(:disabled),
  .quiet-btn:focus-visible { color: var(--app-accent); background: var(--app-accent-soft); border-color: var(--app-accent); }

  .run-btn {
    width: auto;
    min-width: 8.2rem;
    margin: 0;
    padding: 0.48rem 1rem;
    color: var(--app-surface);
    background: var(--app-accent);
    border-color: var(--app-accent);
    font-size: 0.78rem;
    font-weight: 780;
  }

  .run-btn:hover:not(:disabled),
  .run-btn:focus-visible { filter: brightness(1.08); }

  .cancel-btn {
    width: auto;
    margin: 0;
    padding: 0.46rem 0.78rem;
    color: var(--app-error);
    background: color-mix(in srgb, var(--app-error) 7%, var(--app-surface));
    border-color: color-mix(in srgb, var(--app-error) 58%, var(--app-border));
    font-size: 0.74rem;
    font-weight: 750;
  }

  .cancel-btn:hover,
  .cancel-btn:focus-visible { background: color-mix(in srgb, var(--app-error) 13%, var(--app-surface)); }

  .query-error {
    display: flex;
    gap: 0.9rem;
    padding: 1rem;
    background: color-mix(in srgb, var(--app-error) 8%, var(--app-surface));
    border: var(--app-border-width) solid var(--app-error);
    border-radius: var(--app-radius);
  }

  .error-kicker { color: var(--app-error); }
  .error-symbol {
    display: grid;
    flex: 0 0 auto;
    width: 1.8rem;
    height: 1.8rem;
    place-items: center;
    color: var(--app-surface);
    background: var(--app-error);
    border-radius: 50%;
    font-weight: 850;
  }

  .results-panel { overflow: hidden; }
  .results-heading { align-items: flex-end; border-bottom: var(--app-border-width) solid var(--app-border); }
  .results-heading h2 { margin: 0; color: var(--app-text-strong); font-size: 1rem; }
  .results-heading > div > span { color: var(--app-muted); font-size: 0.7rem; }
  .results-kicker { margin-bottom: 0.2rem; color: var(--app-ok); }
  .result-copy { display: flex; max-width: 15rem; flex-direction: column; align-items: flex-end; gap: 0.3rem; }
  .result-copy > span { color: var(--app-muted); font-size: 0.64rem; line-height: 1.35; text-align: right; }

  .stale-note,
  .result-limit {
    margin: 0;
    padding: 0.65rem 0.85rem;
    color: var(--app-warn);
    background: color-mix(in srgb, var(--app-warn) 9%, var(--app-surface));
    border-bottom: var(--app-border-width) solid var(--app-border);
    font-size: 0.74rem;
    line-height: 1.5;
  }

  .result-limit { color: var(--app-muted); border-top: var(--app-border-width) solid var(--app-border); border-bottom: 0; }

  .empty-results { padding: 2rem; text-align: center; }
  .empty-results strong { color: var(--app-text-strong); }
  .empty-results p { max-width: 55ch; margin: 0.35rem auto 0; color: var(--app-muted); font-size: 0.82rem; line-height: 1.55; }

  .results-scroll { overflow: auto; max-height: 38rem; }
  .results-scroll:focus-visible { outline: 2px solid var(--app-accent); outline-offset: -2px; }
  .results-panel table { width: 100%; min-width: 42rem; margin: 0; border-collapse: collapse; font-size: 0.76rem; }
  .results-panel th {
    position: sticky;
    z-index: 1;
    top: 0;
    padding: 0.62rem 0.78rem;
    color: var(--app-muted);
    background: var(--app-surface-2);
    border-bottom: var(--app-border-width) solid var(--app-border);
    font-size: 0.66rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-align: left;
    text-transform: none;
    white-space: nowrap;
  }
  .results-panel td {
    max-width: 30rem;
    padding: 0.6rem 0.78rem;
    border-bottom: var(--app-border-width) solid var(--app-border-subtle);
    vertical-align: top;
  }
  .results-panel tbody tr:nth-child(even) { background: color-mix(in srgb, var(--app-surface-2) 38%, transparent); }
  .results-panel tbody tr:hover { background: var(--app-accent-soft); }
  .term-value { overflow-wrap: anywhere; color: var(--app-text); font-family: var(--app-font-mono); line-height: 1.45; }
  .term-value.iri { color: var(--app-accent); }
  .term-value.non-web-iri { color: var(--app-muted); }
  .term-qualifier {
    display: inline-block;
    margin-left: 0.35rem;
    padding: 0.05rem 0.28rem;
    color: var(--app-muted);
    background: var(--app-surface-2);
    border-radius: 2px;
    font-family: var(--app-font-mono);
    font-size: 0.64rem;
    white-space: nowrap;
  }
  .unbound { color: var(--app-muted-2); }
  .external-cell { white-space: nowrap; }

  .side-column {
    position: sticky;
    top: 1rem;
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 0.8rem;
  }

  .guide-card { padding: 1rem; }
  .guide-card header { margin-bottom: 0.75rem; }
  .guide-card h2 { font-size: 0.9rem; line-height: 1.3; }
  .guide-card p { margin: 0.6rem 0 0; color: var(--app-muted); font-size: 0.75rem; line-height: 1.55; }
  .guide-card code { font-size: 0.92em; }

  .trust-copy { padding-bottom: 0.75rem; border-bottom: var(--app-border-width) solid var(--app-border-subtle); }
  .source-facts { margin: 0; }
  .source-facts div { display: flex; justify-content: space-between; gap: 0.5rem; padding: 0.38rem 0; border-bottom: var(--app-border-width) solid var(--app-border-subtle); }
  .source-facts dt { color: var(--app-muted); font-size: 0.7rem; }
  .source-facts dd { margin: 0; color: var(--app-text-strong); font-size: 0.7rem; font-weight: 700; }

  .live-control { margin-top: 0.8rem; }
  .live-control > label { display: flex; align-items: center; gap: 0.45rem; margin: 0; color: var(--app-text-strong); font-size: 0.74rem; font-weight: 730; }
  .live-control input { flex: 0 0 auto; margin: 0; }
  .live-control #live-help { margin-top: 0.35rem; font-size: 0.68rem; }
  .live-status {
    display: flex;
    flex-direction: column;
    gap: 0.08rem;
    margin-top: 0.55rem;
    padding: 0.55rem 0.6rem;
    background: var(--app-bg);
    border-left: 3px solid var(--app-muted);
  }
  .live-status[data-state='available'] { border-color: var(--app-ok); }
  .live-status[data-state='unavailable'] { border-color: var(--app-error); }
  .live-status[data-state='loading'] { border-color: var(--app-accent); }
  .live-status strong { color: var(--app-text-strong); font-size: 0.68rem; }
  .live-status span { color: var(--app-muted); font-size: 0.64rem; line-height: 1.4; }
  .text-btn { align-self: flex-start; margin-top: 0.35rem; padding: 0; color: var(--app-accent); background: transparent; border: 0; }

  .graph-card pre {
    overflow-x: auto;
    margin: 0.65rem 0;
    padding: 0.65rem;
    color: var(--app-text);
    background: var(--app-bg);
    border: var(--app-border-width) solid var(--app-border-subtle);
    border-radius: var(--app-radius);
    font-size: 0.65rem;
    line-height: 1.55;
  }

  .guide-links { display: flex; flex-direction: column; gap: 0.35rem; margin-top: 0.7rem; }
  .guide-links a {
    display: flex;
    min-height: 2.75rem;
    align-items: center;
    padding: 0 0.65rem;
    color: var(--app-text-strong);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    font-size: 0.75rem;
    font-weight: 700;
  }
  .guide-links a:hover,
  .guide-links a:focus-visible { color: var(--app-accent); border-color: var(--app-accent); }

  .trust-section {
    margin-top: 1.35rem;
    padding: clamp(1.2rem, 3vw, 2rem);
    scroll-margin-top: 1rem;
  }
  .trust-section > header { max-width: 700px; }
  .trust-section > header h2 { font-size: clamp(1.25rem, 2.5vw, 1.65rem); letter-spacing: -0.02em; }
  .trust-section > header > p:last-child { margin: 0.4rem 0 0; color: var(--app-muted); font-size: 0.84rem; line-height: 1.55; }
  .trust-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.8rem; margin-top: 1.25rem; }
  .trust-grid article {
    position: relative;
    margin: 0;
    padding: 1rem;
    background: var(--app-bg);
    border: var(--app-border-width) solid var(--app-border-subtle);
    border-radius: var(--app-radius);
    box-shadow: none;
  }
  .trust-number { display: block; margin-bottom: 1.4rem; color: var(--app-text-strong); font-family: var(--app-font-mono); font-size: 0.7rem; font-weight: 800; }
  .trust-grid h3 { font-size: 0.88rem; }
  .trust-grid p { margin: 0.45rem 0 0; color: var(--app-text); font-size: 0.75rem; line-height: 1.6; }

  .source-inventory { margin-top: 0.8rem; padding: 0.75rem 0.9rem; background: var(--app-bg); border: var(--app-border-width) solid var(--app-border-subtle); border-radius: var(--app-radius); }
  .source-inventory summary { color: var(--app-text-strong); font-size: 0.76rem; font-weight: 720; cursor: pointer; }
  .source-inventory ul { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.45rem 1.2rem; margin: 0.8rem 0 0; padding-left: 1rem; }
  .source-inventory li { min-width: 0; color: var(--app-text); font-size: 0.7rem; }
  .source-inventory li a { display: block; color: var(--app-text-strong); text-decoration: underline; }
  .source-inventory > p { margin: 0.75rem 0 0; color: var(--app-muted); font-size: 0.7rem; line-height: 1.5; }
  .source-inventory li span { display: block; margin-top: 0.14rem; color: var(--app-muted); font-size: 0.63rem; }
  .source-inventory li code { overflow-wrap: anywhere; color: var(--app-text); font-size: 0.63rem; }

  .external-note {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 2rem;
    align-items: center;
    margin-top: 0.8rem;
    padding: 1rem;
    background: var(--app-accent-soft);
    border-radius: var(--app-radius);
  }
  .external-note h3 { font-size: 0.9rem; }
  .external-note p { margin: 0.35rem 0 0; color: var(--app-muted); font-size: 0.75rem; line-height: 1.55; }
  .external-actions { display: flex; flex-direction: column; align-items: stretch; gap: 0.35rem; }
  .external-actions a {
    display: flex;
    min-height: 2.75rem;
    align-items: center;
    justify-content: flex-end;
    padding: 0 0.35rem;
    color: var(--app-text-strong);
    font-size: 0.75rem;
    font-weight: 720;
    white-space: nowrap;
  }
  .external-actions a:hover,
  .external-actions a:focus-visible { color: var(--app-accent); }

  .visually-hidden {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }

  @media (max-width: 1040px) {
    .workspace { grid-template-columns: 1fr; }
    .side-column { position: static; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .dataset-card { grid-row: span 2; }
  }

  @media (max-width: 760px) {
    .sparql-page { padding: 1rem 0.75rem 4rem; }
    .hero { grid-template-columns: 1fr; gap: 1.2rem; padding: 1.35rem; }
    .hero-signals { flex-flow: row wrap; align-items: flex-start; }
    .dataset-bar { align-items: flex-start; flex-wrap: wrap; }
    .dataset-bar dl { width: 100%; justify-content: space-between; gap: 0.75rem; order: 3; padding-top: 0.65rem; border-top: var(--app-border-width) solid var(--app-border-subtle); }
    .example-grid,
    .side-column,
    .trust-grid,
    .source-inventory ul { grid-template-columns: 1fr; }
    .dataset-card { grid-row: auto; }
    .all-examples { grid-template-columns: 1fr; gap: 0.35rem; }
    .example-note { flex-direction: column; }
    .editor-heading { align-items: flex-start; }
    .section-heading.compact { align-items: flex-start; }
    .editor-actions { align-items: stretch; flex-direction: column-reverse; }
    .run-controls { width: 100%; }
    .run-btn { flex: 1; width: 100%; }
    .secondary-actions { justify-content: space-between; }
    .secondary-actions .quiet-btn { flex: 1; }
    .results-heading { align-items: flex-start; flex-direction: column; }
    .result-copy { width: 100%; max-width: none; align-items: flex-start; }
    .results-heading .quiet-btn { width: 100%; }
    .result-copy > span { text-align: left; }
    .external-note { grid-template-columns: 1fr; gap: 0.8rem; }
    .external-actions { align-items: flex-start; }
  }

  @media (max-width: 440px) {
    .hero-signals span { font-size: 0.64rem; }
    .dataset-bar > a { width: 100%; }
    .starter-panel { padding: 0.9rem; }
    .example-card { min-height: 0; }
    .code-editor { min-height: 18rem; padding: 0.9rem; font-size: 0.75rem; }
  }
</style>
