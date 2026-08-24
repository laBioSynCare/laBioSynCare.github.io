<script>
  import { onDestroy, onMount } from 'svelte'
  import { applicationRoute } from '../../config/applicationUrls.js'
  import { loadStaticKnowledgeGraph } from '../../rdf/loader.js'
  import { listPresets } from '../../rdf/presets.js'
  import { toCurie } from '../../rdf/namespaces.js'

  // Fixed categorical order, five slots of the validated eight-hue palette.
  // Every use is accompanied by a text label; colour is never the only cue.
  const GROUP_COLORS = {
    Heal: '#2a78d6',
    Support: '#008300',
    Perform: '#e87ba4',
    Indulge: '#eda100',
    Transcend: '#1baf7a',
  }
  const FALLBACK_COLOR = 'var(--app-muted)'

  let presets = $state([])
  let loading = $state(true)
  let error = $state(null)
  let search = $state('')
  let groupFilter = $state('all')
  let bandFilter = $state('all')
  let tierFilter = $state('all')
  let sortBy = $state('name')
  let copiedId = $state('')
  let copyMessage = $state('')
  let copyTimer

  const groupOptions = $derived(uniqueLabels(presets.flatMap(preset => preset.groups)))
  const bandOptions = $derived(uniqueLabels(presets.flatMap(preset => preset.bands)))
  const tierOptions = $derived(uniqueLabels(presets.flatMap(preset => preset.tiers)))
  const normalizedSearch = $derived(search.trim().toLocaleLowerCase())
  const assessmentPresetCount = $derived(presets.filter(preset => preset.evidenceClaims.length > 0).length)
  const citationCount = $derived(presets.reduce((total, preset) => total + preset.references.length, 0))
  const latestModified = $derived(
    presets.map(preset => preset.modified).filter(Boolean).sort((a, b) => b.localeCompare(a))[0] ?? '',
  )

  const filteredPresets = $derived(
    presets
      .filter(preset => matchesSearch(preset, normalizedSearch))
      .filter(preset => groupFilter === 'all' || preset.groups.some(group => group.label === groupFilter))
      .filter(preset => bandFilter === 'all' || preset.bands.some(band => band.label === bandFilter))
      .filter(preset => matchesEvidenceFilter(preset, tierFilter))
      .sort((a, b) => comparePresets(a, b, sortBy)),
  )

  const filtersActive = $derived(
    normalizedSearch !== '' || groupFilter !== 'all' || bandFilter !== 'all' || tierFilter !== 'all',
  )

  function uniqueLabels(items) {
    return [...new Set(items.map(item => item.label).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
  }

  function joinLabels(items, fallback = 'Not specified') {
    const labels = items.map(item => item.label).filter(Boolean)
    return labels.length ? labels.join(', ') : fallback
  }

  function searchableText(preset) {
    return [
      preset.label,
      preset.description,
      preset.version,
      toCurie(preset.iri),
      ...preset.groups.map(item => item.label),
      ...preset.bands.map(item => item.label),
      ...preset.voiceTypes.map(item => item.label),
      ...preset.tiers.map(item => item.label),
      ...preset.claimDirections.map(item => item.label),
      ...preset.references.map(item => item.title),
    ].filter(Boolean).join(' ').toLocaleLowerCase()
  }

  function matchesSearch(preset, query) {
    return !query || searchableText(preset).includes(query)
  }

  function matchesEvidenceFilter(preset, filter) {
    if (filter === 'all') return true
    if (filter === 'linked') return preset.evidenceClaims.length > 0
    if (filter === 'unlinked') return preset.evidenceClaims.length === 0
    return preset.tiers.some(tier => tier.label === filter)
  }

  function evidenceRank(preset) {
    return Math.max(0, ...preset.tiers.map(tier => Number(tier.rank) || 0))
  }

  function comparePresets(a, b, order) {
    if (order === 'group') {
      return joinLabels(a.groups).localeCompare(joinLabels(b.groups)) || a.label.localeCompare(b.label)
    }
    if (order === 'evidence') {
      return evidenceRank(b) - evidenceRank(a) || a.label.localeCompare(b.label)
    }
    if (order === 'updated') {
      return (b.modified || '').localeCompare(a.modified || '') || a.label.localeCompare(b.label)
    }
    return a.label.localeCompare(b.label)
  }

  function groupColor(preset) {
    return GROUP_COLORS[preset.groups[0]?.label] ?? FALLBACK_COLOR
  }

  function formatDate(value) {
    if (!value) return 'Not recorded'
    const date = new Date(`${value}T00:00:00Z`)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(date)
  }

  function resetFilters() {
    search = ''
    groupFilter = 'all'
    bandFilter = 'all'
    tierFilter = 'all'
  }

  function clearFilter(filter) {
    if (filter === 'search') search = ''
    if (filter === 'group') groupFilter = 'all'
    if (filter === 'band') bandFilter = 'all'
    if (filter === 'tier') tierFilter = 'all'
  }

  async function loadPresets() {
    loading = true
    error = null
    try {
      const store = await loadStaticKnowledgeGraph()
      presets = await listPresets(store)
    } catch (caught) {
      error = caught instanceof Error ? caught.message : String(caught)
    } finally {
      loading = false
    }
  }

  async function copyIri(iri, id) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard access is unavailable')
      await navigator.clipboard.writeText(iri)
      copiedId = id
      copyMessage = `Copied ${toCurie(iri)} to the clipboard.`
      clearTimeout(copyTimer)
      copyTimer = setTimeout(() => {
        copiedId = ''
        copyMessage = ''
      }, 5000)
    } catch (caught) {
      copiedId = ''
      copyMessage = 'Could not copy the identifier. You can select it in Provenance & identifiers.'
      console.warn('Clipboard copy failed', caught)
    }
  }

  onMount(loadPresets)
  onDestroy(() => clearTimeout(copyTimer))
</script>

<svelte:head>
  <title>Preset catalog | SSTIM Workbench</title>
  <meta
    name="description"
    content="Browse versioned, non-clinical SSTIM Workbench reference presets with their configuration, preserved provenance, safety cautions, and linked evidence assessments."
  />
</svelte:head>

<main class="presets-page">
  <header class="hero">
    <div class="hero-copy">
      <p class="eyebrow">Published RDF catalog</p>
      <h1>Preset reference library</h1>
      <p class="subhead">
        Browse reproducible configuration records, see exactly what each one contains,
        and inspect the evidence and provenance attached to it. These are non-clinical
        reference seeds—not promises of a health or performance outcome.
      </p>
      <div class="hero-actions" aria-label="Catalog actions">
        <a class="primary-action" href={applicationRoute('/creator/')}>Open Patch Studio <span aria-hidden="true">→</span></a>
        <a class="secondary-action" href={applicationRoute('/sparql/')}>Query the source data</a>
      </div>
    </div>

    <aside class="trust-note" aria-labelledby="trust-note-title">
      <span class="trust-icon" aria-hidden="true">i</span>
      <div>
        <h2 id="trust-note-title">What “evidence” means here</h2>
        <p>
          A tier describes a linked assessment in SSTIM. It does not establish that
          this preset causes an outcome. Missing means no assessment is linked in the
          published catalog—not that evidence exists or does not exist elsewhere.
        </p>
        <p>
          This page reads the SSTIM Workbench reference catalog bundled with this site.
          Its records retain stable BSC Lab implementation identifiers as provenance. It
          is not an inventory of BioSynCare private, production, or partner presets.
        </p>
      </div>
    </aside>
  </header>

  <section class="catalog-facts" aria-label="Catalog at a glance" aria-busy={loading}>
    <div>
      <strong>{loading ? '—' : presets.length}</strong>
      <span>published record{presets.length === 1 ? '' : 's'}</span>
    </div>
    <div>
      <strong>{loading ? '—' : assessmentPresetCount}</strong>
      <span>with a linked assessment</span>
    </div>
    <div>
      <strong>{loading ? '—' : citationCount}</strong>
      <span>linked citation{citationCount === 1 ? '' : 's'}</span>
    </div>
    <div>
      <strong>{loading || !latestModified ? '—' : formatDate(latestModified)}</strong>
      <span>latest record update</span>
    </div>
  </section>

  {#if loading}
    <section class="loading-state" aria-live="polite" aria-label="Loading preset catalog">
      <div class="loading-heading">
        <span class="spinner" aria-hidden="true"></span>
        <p>Loading the published knowledge graph…</p>
      </div>
      <div class="skeleton-grid" aria-hidden="true">
        {#each Array(2) as _}
          <div class="skeleton-card">
            <span class="skeleton-line short"></span>
            <span class="skeleton-line title"></span>
            <span class="skeleton-line"></span>
            <span class="skeleton-line"></span>
            <span class="skeleton-box"></span>
          </div>
        {/each}
      </div>
    </section>
  {:else if error}
    <section class="error-panel" role="alert" aria-labelledby="catalog-error-title">
      <div class="error-icon" aria-hidden="true">!</div>
      <div>
        <h2 id="catalog-error-title">The preset catalog could not be loaded</h2>
        <p>
          The published records stay on this site and are read in your browser. Check
          your connection, then try again.
        </p>
        <button type="button" class="retry-button" onclick={loadPresets}>Try again</button>
        <details>
          <summary>Technical details</summary>
          <code>{error}</code>
        </details>
      </div>
    </section>
  {:else if presets.length === 0}
    <section class="empty-state" aria-labelledby="empty-catalog-title">
      <span aria-hidden="true">◇</span>
      <h2 id="empty-catalog-title">No published presets yet</h2>
      <p>The catalog loaded successfully, but it contains no preset records.</p>
      <a href={applicationRoute('/creator/')}>Create an independent patch in Patch Studio</a>
    </section>
  {:else}
    <section class="discovery-panel" aria-labelledby="browse-title">
      <div class="discovery-heading">
        <div>
          <p class="section-kicker">Discover</p>
          <h2 id="browse-title">Find a reference preset</h2>
        </div>
        <p class="result-count" aria-live="polite">
          <strong>{filteredPresets.length}</strong> of {presets.length} shown
        </p>
      </div>

      <div class="search-row">
        <label class="search-field" for="preset-search">
          <span>Search the catalog</span>
          <div class="search-control">
            <span aria-hidden="true">⌕</span>
            <input
              id="preset-search"
              type="search"
              bind:value={search}
              placeholder="Name, band, voice, evidence, or identifier"
              autocomplete="off"
            />
          </div>
        </label>

        <label class="sort-field" for="preset-sort">
          <span>Sort by</span>
          <select id="preset-sort" bind:value={sortBy}>
            <option value="name">Name A–Z</option>
            <option value="group">Group</option>
            <option value="evidence">Evidence tier</option>
            <option value="updated">Recently updated</option>
          </select>
        </label>
      </div>

      <div class="filter-row" aria-label="Filter presets">
        <label>
          <span>Group</span>
          <select bind:value={groupFilter}>
            <option value="all">All groups</option>
            {#each groupOptions as group}
              <option value={group}>{group}</option>
            {/each}
          </select>
        </label>
        <label>
          <span>Technical band</span>
          <select bind:value={bandFilter}>
            <option value="all">All bands</option>
            {#each bandOptions as band}
              <option value={band}>{band}</option>
            {/each}
          </select>
        </label>
        <label>
          <span>Evidence assessment</span>
          <select bind:value={tierFilter}>
            <option value="all">Any status</option>
            <option value="linked">Assessment linked</option>
            <option value="unlinked">No assessment linked</option>
            {#each tierOptions as tier}
              <option value={tier}>Tier: {tier}</option>
            {/each}
          </select>
        </label>
        <button type="button" class="reset-button" onclick={resetFilters} disabled={!filtersActive}>
          Clear all
        </button>
      </div>

      {#if filtersActive}
        <div class="active-filters" aria-label="Active filters">
          <span>Active</span>
          {#if normalizedSearch}
            <button type="button" onclick={() => clearFilter('search')} aria-label="Clear search filter">
              Search: “{search.trim()}” <span aria-hidden="true">×</span>
            </button>
          {/if}
          {#if groupFilter !== 'all'}
            <button type="button" onclick={() => clearFilter('group')} aria-label={`Clear group filter ${groupFilter}`}>
              {groupFilter} <span aria-hidden="true">×</span>
            </button>
          {/if}
          {#if bandFilter !== 'all'}
            <button type="button" onclick={() => clearFilter('band')} aria-label={`Clear band filter ${bandFilter}`}>
              {bandFilter} <span aria-hidden="true">×</span>
            </button>
          {/if}
          {#if tierFilter !== 'all'}
            <button type="button" onclick={() => clearFilter('tier')} aria-label="Clear evidence filter">
              {tierFilter === 'linked' ? 'Assessment linked' : tierFilter === 'unlinked' ? 'No assessment linked' : tierFilter}
              <span aria-hidden="true">×</span>
            </button>
          {/if}
        </div>
      {/if}
    </section>

    {#if filteredPresets.length === 0}
      <section class="empty-state filtered-empty" aria-labelledby="no-matches-title">
        <span aria-hidden="true">⌕</span>
        <h2 id="no-matches-title">No presets match these filters</h2>
        <p>Try a broader search, or clear the filters to see every published record.</p>
        <button type="button" class="retry-button" onclick={resetFilters}>Show all presets</button>
      </section>
    {:else}
      <section class="preset-grid" aria-label="Preset results">
        {#each filteredPresets as preset (preset.iri)}
          <article class="preset-card" style={`--card-color: ${groupColor(preset)}`} aria-labelledby={`preset-${preset.id}`}>
            <header class="card-header">
              <div class="card-title-block">
                <div class="card-labels">
                  <span class="record-type">Reference seed</span>
                  {#each preset.groups as group}
                    <span class="group-badge">{group.label}</span>
                  {/each}
                </div>
                <h2 id={`preset-${preset.id}`}>{preset.label}</h2>
              </div>
              <span class="version-badge" title="Preset record version">v{preset.version}</span>
            </header>

            {#if preset.description}
              <p class="card-description">{preset.description}</p>
            {/if}

            <dl class="configuration-grid">
              <div>
                <dt>Technical target</dt>
                <dd>{joinLabels(preset.bands)}</dd>
              </div>
              <div>
                <dt>Voice model</dt>
                <dd>{joinLabels(preset.voiceTypes)}</dd>
              </div>
              <div>
                <dt>Breath guide</dt>
                <dd>{preset.hasBreathGuide ? 'Included' : 'Not included'}</dd>
              </div>
              <div>
                <dt>Record updated</dt>
                <dd>{formatDate(preset.modified)}</dd>
              </div>
            </dl>

            {#if preset.cautions.length}
              <aside class="safety-note" aria-label="Safety information">
                <span class="safety-symbol" aria-hidden="true">!</span>
                <div>
                  <strong>{joinLabels(preset.cautions)}</strong>
                  {#each preset.cautions as caution}
                    <p>{caution.recommendedAction || caution.definition}</p>
                  {/each}
                </div>
              </aside>
            {/if}

            <section class="evidence-block" aria-label={`Evidence information for ${preset.label}`}>
              <div class:has-evidence={preset.evidenceClaims.length > 0} class="evidence-status" aria-hidden="true">
                {preset.evidenceClaims.length > 0 ? '✓' : '—'}
              </div>
              <div class="evidence-copy">
                <span>Evidence assessment</span>
                {#if preset.evidenceClaims.length}
                  <strong>{joinLabels(preset.tiers)} · {joinLabels(preset.claimDirections, 'Direction not recorded')}</strong>
                  <p>
                    {preset.references.length} linked citation{preset.references.length === 1 ? '' : 's'}.
                    This is an assessment of applicability, not an outcome claim.
                  </p>
                {:else}
                  <strong>No linked assessment</strong>
                  <p>The published graph does not attach an evidence assessment to this preset.</p>
                {/if}

                {#if preset.references.length}
                  <details class="references">
                    <summary>View {preset.references.length} source{preset.references.length === 1 ? '' : 's'}</summary>
                    <ul>
                      {#each preset.references as reference}
                        <li>
                          {#if reference.source}
                            <a href={reference.source} target="_blank" rel="noopener external">
                              {reference.title || toCurie(reference.iri)} <span aria-hidden="true">↗</span>
                            </a>
                          {:else}
                            {reference.title || toCurie(reference.iri)}
                          {/if}
                        </li>
                      {/each}
                    </ul>
                  </details>
                {/if}
              </div>
            </section>

            <details class="provenance">
              <summary>Provenance &amp; identifiers</summary>
              <dl>
                <div><dt>Stable identifier</dt><dd><code>{preset.iri}</code></dd></div>
                {#if preset.graphIri}
                  <div><dt>Named graph</dt><dd><code>{preset.graphIri}</code></dd></div>
                {/if}
                <div><dt>Created</dt><dd>{formatDate(preset.created)}</dd></div>
                <div><dt>Modified</dt><dd>{formatDate(preset.modified)}</dd></div>
                <div><dt>Public claim level</dt><dd>{joinLabels(preset.publicClaimLevels)}</dd></div>
                <div><dt>Protocol</dt><dd>{joinLabels(preset.protocols)}</dd></div>
                {#if preset.evidenceClaims.length}
                  <div><dt>Assessment identifier</dt><dd><code>{preset.evidenceClaims[0].iri}</code></dd></div>
                {/if}
              </dl>
            </details>

            <footer class="card-footer">
              <span class="curie" title={preset.iri}>{toCurie(preset.iri)}</span>
              <div class="card-actions">
                <button type="button" class="copy-button" onclick={() => copyIri(preset.iri, preset.iri)}>
                  {copiedId === preset.iri ? 'Copied' : 'Copy IRI'}
                </button>
              </div>
            </footer>
          </article>
        {/each}
      </section>
    {/if}

    <section class="reading-guide" aria-labelledby="reading-guide-title">
      <div>
        <p class="section-kicker">Interpretation guide</p>
        <h2 id="reading-guide-title">Read the record, not a promise</h2>
      </div>
      <div class="guide-grid">
        <div>
          <span aria-hidden="true">01</span>
          <h3>Configuration</h3>
          <p>Band, voice model, breath-guide status, and version describe what is encoded.</p>
        </div>
        <div>
          <span aria-hidden="true">02</span>
          <h3>Assessment</h3>
          <p>Tier, direction, and citations describe the catalog’s evidence assessment—not efficacy.</p>
        </div>
        <div>
          <span aria-hidden="true">03</span>
          <h3>Provenance</h3>
          <p>Dates, protocol, named graph, and stable IRI make each record inspectable and reusable.</p>
        </div>
      </div>
    </section>
  {/if}

  <p class="sr-only" role="status" aria-live="polite">{copyMessage}</p>
</main>

<style>
  .presets-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: clamp(1.5rem, 4vw, 3.5rem) clamp(1rem, 3vw, 1.5rem) 5rem;
    color: var(--app-text);
    font-family: var(--app-font-ui);
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.75fr);
    gap: clamp(1.25rem, 4vw, 3.5rem);
    align-items: end;
    margin-bottom: 1.5rem;
  }

  .eyebrow,
  .section-kicker {
    margin: 0 0 0.45rem;
    color: var(--app-accent);
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .hero h1 {
    max-width: 14ch;
    margin: 0 0 0.75rem;
    color: var(--app-text-strong);
    font-size: clamp(2.15rem, 6vw, 4.1rem);
    font-weight: 820;
    letter-spacing: -0.045em;
    line-height: 0.98;
  }

  .subhead {
    max-width: 68ch;
    margin: 0;
    color: var(--app-muted);
    font-size: clamp(0.95rem, 2vw, 1.08rem);
    line-height: 1.65;
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
    margin-top: 1.25rem;
  }

  .hero-actions a { text-decoration: none; }

  .primary-action,
  .secondary-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.65rem;
    padding: 0.55rem 0.95rem;
    border-radius: var(--app-radius);
    font-size: 0.84rem;
    font-weight: 750;
  }

  .primary-action {
    gap: 0.55rem;
    color: var(--app-on-accent);
    background: var(--app-accent);
    border: 1px solid var(--app-accent);
  }

  .secondary-action {
    color: var(--app-text-strong);
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
  }

  .primary-action:hover,
  .primary-action:focus-visible { color: var(--app-on-accent); filter: brightness(1.08); }
  .secondary-action:hover,
  .secondary-action:focus-visible { color: var(--app-accent); border-color: var(--app-accent); }

  .trust-note {
    display: flex;
    gap: 0.85rem;
    margin: 0;
    padding: 1rem;
    background: color-mix(in srgb, var(--app-accent) 7%, var(--app-surface));
    border: var(--app-border-width) solid color-mix(in srgb, var(--app-accent) 38%, var(--app-border));
    border-radius: calc(var(--app-radius) * 1.5);
  }

  .trust-icon {
    display: grid;
    flex: 0 0 1.6rem;
    width: 1.6rem;
    height: 1.6rem;
    place-items: center;
    color: var(--app-accent);
    border: 1px solid currentColor;
    border-radius: 50%;
    font-family: var(--app-font-mono);
    font-size: 0.72rem;
    font-weight: 800;
  }

  .trust-note h2 {
    margin: 0 0 0.35rem;
    color: var(--app-text-strong);
    font-size: 0.88rem;
  }

  .trust-note p {
    margin: 0;
    color: var(--app-muted);
    font-size: 0.78rem;
    line-height: 1.55;
  }
  .trust-note p + p { margin-top: 0.55rem; }

  .catalog-facts {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin: 0 0 2rem;
    overflow: hidden;
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) * 1.5);
  }

  .catalog-facts div {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.85rem 1rem;
    border-right: var(--app-border-width) solid var(--app-border);
  }

  .catalog-facts div:last-child { border-right: 0; }

  .catalog-facts strong {
    overflow: hidden;
    color: var(--app-text-strong);
    font-size: 1.05rem;
    font-weight: 780;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .catalog-facts span {
    color: var(--app-muted);
    font-size: 0.68rem;
    letter-spacing: 0.035em;
    text-transform: uppercase;
  }

  .loading-state { padding-top: 1rem; }

  .loading-heading {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    margin-bottom: 1rem;
    color: var(--app-muted);
    font-size: 0.86rem;
  }

  .loading-heading p { margin: 0; }

  .spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid var(--app-border);
    border-top-color: var(--app-accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .skeleton-grid,
  .preset-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }

  .skeleton-card {
    display: flex;
    min-height: 22rem;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.25rem;
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) * 1.5);
  }

  .skeleton-line,
  .skeleton-box {
    display: block;
    height: 0.85rem;
    border-radius: var(--app-radius);
    background: linear-gradient(90deg, var(--app-surface-2), var(--app-surface-3), var(--app-surface-2));
    background-size: 200% 100%;
    animation: shimmer 1.6s ease-in-out infinite;
  }

  .skeleton-line.short { width: 25%; }
  .skeleton-line.title { width: 62%; height: 1.6rem; margin-bottom: 0.5rem; }
  .skeleton-box { height: 8rem; margin-top: 1rem; }

  @keyframes shimmer { to { background-position: -200% 0; } }

  .error-panel,
  .empty-state {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: clamp(1.25rem, 4vw, 2rem);
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) * 1.5);
  }

  .error-panel { border-color: color-mix(in srgb, var(--app-error) 55%, var(--app-border)); }

  .error-icon,
  .empty-state > span {
    display: grid;
    flex: 0 0 2rem;
    width: 2rem;
    height: 2rem;
    place-items: center;
    border: 1px solid currentColor;
    border-radius: 50%;
    color: var(--app-error);
    font-weight: 800;
  }

  .empty-state > span { color: var(--app-muted); }
  .error-panel h2,
  .empty-state h2 { margin: 0 0 0.35rem; color: var(--app-text-strong); font-size: 1.05rem; }
  .error-panel p,
  .empty-state p { max-width: 64ch; margin: 0 0 0.85rem; color: var(--app-muted); font-size: 0.86rem; line-height: 1.55; }
  .error-panel details { margin-top: 0.75rem; color: var(--app-muted); font-size: 0.75rem; }
  .error-panel code { display: block; margin-top: 0.5rem; overflow-wrap: anywhere; }

  .retry-button,
  .reset-button,
  .copy-button {
    width: auto;
    margin: 0;
    border-radius: var(--app-radius);
    font-weight: 750;
  }

  .retry-button {
    padding: 0.5rem 0.85rem;
    color: var(--app-on-accent);
    background: var(--app-accent);
    border: 1px solid var(--app-accent);
    font-size: 0.8rem;
  }

  .discovery-panel {
    margin-bottom: 1rem;
    padding: clamp(1rem, 3vw, 1.25rem);
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) * 1.5);
  }

  .discovery-heading {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .discovery-heading h2,
  .reading-guide h2 {
    margin: 0;
    color: var(--app-text-strong);
    font-size: clamp(1.25rem, 3vw, 1.65rem);
    letter-spacing: -0.02em;
  }

  .result-count { margin: 0; color: var(--app-muted); font-size: 0.78rem; white-space: nowrap; }
  .result-count strong { color: var(--app-text-strong); font-size: 1rem; }

  .search-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(170px, 0.26fr);
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .search-field,
  .sort-field,
  .filter-row label {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin: 0;
  }

  .search-field > span,
  .sort-field > span,
  .filter-row label > span {
    color: var(--app-text-strong);
    font-size: 0.7rem;
    font-weight: 750;
    letter-spacing: 0.02em;
  }

  .search-control { position: relative; }
  .search-control > span {
    position: absolute;
    top: 50%;
    left: 0.75rem;
    z-index: 1;
    color: var(--app-muted);
    font-size: 1.25rem;
    transform: translateY(-54%);
    pointer-events: none;
  }

  .search-control input,
  .sort-field select,
  .filter-row select {
    height: 2.65rem;
    margin: 0;
    color: var(--app-text);
    background-color: var(--app-bg);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    box-shadow: none;
    font-size: 0.84rem;
  }

  .search-control input { padding-left: 2.3rem; }
  .search-control input:focus,
  .sort-field select:focus,
  .filter-row select:focus { border-color: var(--app-accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--app-accent) 22%, transparent); }

  .filter-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
    gap: 0.75rem;
    align-items: end;
  }

  .reset-button {
    min-height: 2.65rem;
    padding: 0.5rem 0.85rem;
    color: var(--app-text);
    background: var(--app-surface-2);
    border: var(--app-border-width) solid var(--app-border);
    font-size: 0.78rem;
  }

  .reset-button:hover:not(:disabled) { color: var(--app-accent); border-color: var(--app-accent); }
  .reset-button:disabled { opacity: 0.42; cursor: default; }

  .active-filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.85rem;
    padding-top: 0.85rem;
    border-top: var(--app-border-width) solid var(--app-border-subtle);
  }

  .active-filters > span {
    margin-right: 0.15rem;
    color: var(--app-muted);
    font-size: 0.68rem;
    font-weight: 750;
    text-transform: uppercase;
  }

  .active-filters button {
    width: auto;
    max-width: min(100%, 26rem);
    margin: 0;
    overflow: hidden;
    padding: 0.3rem 0.55rem;
    color: var(--app-accent);
    background: var(--app-accent-soft);
    border: 1px solid color-mix(in srgb, var(--app-accent) 35%, var(--app-border));
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .filtered-empty { margin-top: 1rem; }
  .preset-grid { align-items: start; }

  .preset-card {
    --card-color: var(--app-accent);
    position: relative;
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 1rem;
    margin: 0;
    overflow: hidden;
    padding: 1.2rem;
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) * 1.5);
    box-shadow: 0 1px 0 color-mix(in srgb, var(--app-text-strong) 5%, transparent);
  }

  .preset-card::before {
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    background: var(--card-color);
    content: '';
  }

  .card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .card-labels { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.55rem; }
  .record-type,
  .group-badge,
  .version-badge {
    padding: 0.18rem 0.45rem;
    border-radius: 999px;
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.055em;
    line-height: 1.35;
    text-transform: uppercase;
  }

  .record-type { color: var(--app-muted); background: var(--app-surface-2); }
  .group-badge {
    color: var(--app-text-strong);
    background: color-mix(in srgb, var(--card-color) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--card-color) 28%, transparent);
  }
  .version-badge { flex-shrink: 0; color: var(--app-muted); border: 1px solid var(--app-border); }

  .card-header h2 {
    margin: 0;
    color: var(--app-text-strong);
    font-size: clamp(1.2rem, 3vw, 1.48rem);
    letter-spacing: -0.025em;
    line-height: 1.15;
  }

  .card-description {
    margin: 0;
    color: var(--app-muted);
    font-size: 0.84rem;
    line-height: 1.58;
  }

  .configuration-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0;
    margin: 0;
    overflow: hidden;
    background: var(--app-bg);
    border: var(--app-border-width) solid var(--app-border-subtle);
    border-radius: var(--app-radius);
  }

  .configuration-grid div {
    min-width: 0;
    padding: 0.65rem 0.75rem;
    border-right: var(--app-border-width) solid var(--app-border-subtle);
    border-bottom: var(--app-border-width) solid var(--app-border-subtle);
  }
  .configuration-grid div:nth-child(2n) { border-right: 0; }
  .configuration-grid div:nth-last-child(-n + 2) { border-bottom: 0; }

  .configuration-grid dt,
  .provenance dt {
    margin: 0 0 0.18rem;
    color: var(--app-muted);
    font-size: 0.61rem;
    font-weight: 780;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .configuration-grid dd,
  .provenance dd {
    margin: 0;
    overflow-wrap: anywhere;
    color: var(--app-text);
    font-size: 0.78rem;
    line-height: 1.4;
  }

  .safety-note {
    display: flex;
    gap: 0.65rem;
    margin: 0;
    padding: 0.7rem 0.75rem;
    color: var(--app-text);
    background: color-mix(in srgb, var(--app-warn) 9%, var(--app-surface));
    border: 1px solid color-mix(in srgb, var(--app-warn) 38%, var(--app-border));
    border-radius: var(--app-radius);
  }

  .safety-symbol {
    display: grid;
    flex: 0 0 1.35rem;
    width: 1.35rem;
    height: 1.35rem;
    place-items: center;
    color: var(--app-warn);
    border: 1px solid currentColor;
    border-radius: 50%;
    font-size: 0.68rem;
    font-weight: 850;
  }
  .safety-note strong { display: block; margin-bottom: 0.18rem; color: var(--app-text-strong); font-size: 0.75rem; }
  .safety-note p { margin: 0; color: var(--app-muted); font-size: 0.7rem; line-height: 1.48; }
  .safety-note p + p { margin-top: 0.3rem; }

  .evidence-block {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.7rem;
    padding: 0.8rem;
    background: var(--app-bg);
    border: var(--app-border-width) solid var(--app-border-subtle);
    border-radius: var(--app-radius);
  }

  .evidence-status {
    display: grid;
    width: 1.55rem;
    height: 1.55rem;
    place-items: center;
    color: var(--app-muted);
    background: var(--app-surface-2);
    border-radius: 50%;
    font-size: 0.72rem;
    font-weight: 800;
  }
  .evidence-status.has-evidence { color: var(--app-ok); background: color-mix(in srgb, var(--app-ok) 12%, var(--app-surface)); }
  .evidence-copy > span { display: block; margin-bottom: 0.18rem; color: var(--app-muted); font-size: 0.61rem; font-weight: 780; letter-spacing: 0.06em; text-transform: uppercase; }
  .evidence-copy > strong { display: block; color: var(--app-text-strong); font-size: 0.8rem; }
  .evidence-copy > p { margin: 0.25rem 0 0; color: var(--app-muted); font-size: 0.7rem; line-height: 1.5; }

  .references,
  .provenance { margin: 0; font-size: 0.75rem; }
  .references { margin-top: 0.45rem; }
  .references summary,
  .provenance summary { color: var(--app-accent); cursor: pointer; font-weight: 720; }
  .references ul { margin: 0.5rem 0 0; padding-left: 1rem; }
  .references li + li { margin-top: 0.3rem; }
  .references a { overflow-wrap: anywhere; }

  .provenance {
    padding: 0.75rem 0;
    border-top: var(--app-border-width) solid var(--app-border-subtle);
    border-bottom: var(--app-border-width) solid var(--app-border-subtle);
  }
  .provenance dl { display: grid; gap: 0.65rem; margin: 0.75rem 0 0; }
  .provenance code { font-size: 0.68rem; white-space: normal; }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-top: auto;
    padding: 0;
    background: none;
    border: 0;
  }

  .curie {
    min-width: 0;
    overflow: hidden;
    color: var(--app-muted);
    font-family: var(--app-font-mono);
    font-size: 0.67rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-actions { display: flex; flex-shrink: 0; align-items: center; gap: 0.5rem; }
  .copy-button {
    padding: 0.36rem 0.58rem;
    color: var(--app-accent);
    background: var(--app-accent-soft);
    border: 1px solid color-mix(in srgb, var(--app-accent) 30%, var(--app-border));
    border-radius: var(--app-radius);
    font-size: 0.68rem;
    font-weight: 750;
  }
  .copy-button:hover,
  .copy-button:focus-visible { border-color: var(--app-accent); }

  .reading-guide {
    display: grid;
    grid-template-columns: minmax(180px, 0.55fr) minmax(0, 1.45fr);
    gap: 2rem;
    margin-top: 2.5rem;
    padding: clamp(1.25rem, 4vw, 2rem);
    background: color-mix(in srgb, var(--app-accent) 5%, var(--app-surface));
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) * 1.5);
  }

  .guide-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.25rem; }
  .guide-grid > div { min-width: 0; }
  .guide-grid span { color: var(--app-accent); font-family: var(--app-font-mono); font-size: 0.65rem; }
  .guide-grid h3 { margin: 0.25rem 0 0.35rem; color: var(--app-text-strong); font-size: 0.82rem; }
  .guide-grid p { margin: 0; color: var(--app-muted); font-size: 0.72rem; line-height: 1.5; }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (hover: hover) {
    .preset-card { transition: transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease; }
    .preset-card:hover {
      border-color: color-mix(in srgb, var(--card-color) 45%, var(--app-border));
      box-shadow: 0 8px 24px color-mix(in srgb, var(--app-text-strong) 8%, transparent);
      transform: translateY(-2px);
    }
  }

  @media (max-width: 800px) {
    .hero { grid-template-columns: 1fr; align-items: start; }
    .hero h1 { max-width: none; }
    .catalog-facts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .catalog-facts div:nth-child(2) { border-right: 0; }
    .catalog-facts div:nth-child(-n + 2) { border-bottom: var(--app-border-width) solid var(--app-border); }
    .search-row { grid-template-columns: 1fr; }
    .filter-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .reset-button { width: 100%; }
    .skeleton-grid,
    .preset-grid { grid-template-columns: 1fr; }
    .reading-guide { grid-template-columns: 1fr; gap: 1.25rem; }
  }

  @media (max-width: 520px) {
    .presets-page { padding-inline: 0.75rem; }
    .hero-actions { display: grid; grid-template-columns: 1fr; }
    .catalog-facts { grid-template-columns: 1fr; }
    .catalog-facts div,
    .catalog-facts div:nth-child(2) { border-right: 0; border-bottom: var(--app-border-width) solid var(--app-border); }
    .catalog-facts div:last-child { border-bottom: 0; }
    .discovery-heading { align-items: flex-start; }
    .filter-row { grid-template-columns: 1fr; }
    .configuration-grid { grid-template-columns: 1fr; }
    .configuration-grid div,
    .configuration-grid div:nth-child(2n),
    .configuration-grid div:nth-last-child(-n + 2) { border-right: 0; border-bottom: var(--app-border-width) solid var(--app-border-subtle); }
    .configuration-grid div:last-child { border-bottom: 0; }
    .card-footer { align-items: flex-start; flex-direction: column; }
    .card-actions { width: 100%; }
    .card-actions > * { flex: 1; text-align: center; }
    .guide-grid { grid-template-columns: 1fr; }
  }

  @media (prefers-reduced-motion: reduce) {
    .spinner,
    .skeleton-line,
    .skeleton-box { animation: none; }
    .preset-card { transition: none; }
  }
</style>
