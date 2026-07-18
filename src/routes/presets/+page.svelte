<script>
  import { onMount } from 'svelte'
  import { loadStaticKnowledgeGraph } from '../../rdf/loader.js'
  import { listPresets } from '../../rdf/presets.js'
  import { toCurie } from '../../rdf/namespaces.js'

  // Fixed categorical order, five slots of the validated eight-hue palette —
  // never cycled, never re-derived per preset. Each badge always carries its
  // own text label, so color is never the sole identity signal.
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
  let groupFilter = $state('all')
  let bandFilter = $state('all')
  let tierFilter = $state('all')
  let expandedId = $state(null)
  let copiedId = $state('')
  let copyTimer

  const groupOptions = $derived(uniqueLabels(presets.flatMap(p => p.groups)))
  const bandOptions = $derived(uniqueLabels(presets.flatMap(p => p.bands)))
  const tierOptions = $derived(uniqueLabels(presets.flatMap(p => p.tiers)))

  const filteredPresets = $derived(presets.filter(p => {
    const groupOk = groupFilter === 'all' || p.groups.some(g => g.label === groupFilter)
    const bandOk = bandFilter === 'all' || p.bands.some(b => b.label === bandFilter)
    const tierOk = tierFilter === 'all' || p.tiers.some(t => t.label === tierFilter)
    return groupOk && bandOk && tierOk
  }))

  const filtersActive = $derived(groupFilter !== 'all' || bandFilter !== 'all' || tierFilter !== 'all')

  function uniqueLabels(items) {
    return [...new Set(items.map(item => item.label).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
  }

  function joinLabels(items) {
    return items.map(item => item.label).filter(Boolean).join(', ')
  }

  function groupColor(preset) {
    return GROUP_COLORS[preset.groups[0]?.label] ?? FALLBACK_COLOR
  }

  function resetFilters() {
    groupFilter = 'all'
    bandFilter = 'all'
    tierFilter = 'all'
  }

  function toggleExpanded(id) {
    expandedId = expandedId === id ? null : id
  }

  async function copyIri(iri, id) {
    try {
      await navigator.clipboard.writeText(iri)
      copiedId = id
      clearTimeout(copyTimer)
      copyTimer = setTimeout(() => { copiedId = '' }, 1400)
    } catch (e) {
      console.warn('Clipboard copy failed', e)
    }
  }

  onMount(async () => {
    try {
      const store = await loadStaticKnowledgeGraph()
      presets = await listPresets(store)
    } catch (e) {
      error = e.message
    } finally {
      loading = false
    }
  })
</script>

<svelte:head>
  <title>Presets | BSC Lab</title>
</svelte:head>

<main class="presets-page">
  <header class="hero">
    <p class="eyebrow">Catalog</p>
    <h1>Presets</h1>
    <p class="subhead">
      Versioned reference presets from the BSC catalog — each one a specific,
      reproducible combination of voices, target frequency band, and preset
      group. Non-clinical: presets describe a session configuration, not a
      health outcome.
    </p>
  </header>

  {#if loading}
    <p aria-busy="true">Loading presets…</p>
  {:else if error}
    <div class="error-panel" role="alert">{error}</div>
  {:else}
    <div class="panel filter-panel">
      <div class="filter-grid">
        <label>
          Group
          <select bind:value={groupFilter}>
            <option value="all">All</option>
            {#each groupOptions as group}
              <option value={group}>{group}</option>
            {/each}
          </select>
        </label>
        <label>
          Band
          <select bind:value={bandFilter}>
            <option value="all">All</option>
            {#each bandOptions as band}
              <option value={band}>{band}</option>
            {/each}
          </select>
        </label>
        <label>
          Evidence
          <select bind:value={tierFilter}>
            <option value="all">All</option>
            {#each tierOptions as tier}
              <option value={tier}>{tier}</option>
            {/each}
          </select>
        </label>
        <button type="button" class="reset-btn" onclick={resetFilters} disabled={!filtersActive}>Reset</button>
      </div>
      <p class="result-count">{filteredPresets.length} of {presets.length} preset{presets.length === 1 ? '' : 's'}</p>
    </div>

    {#if filteredPresets.length === 0}
      <div class="empty-state">
        <p>No presets match the selected filters.</p>
        <button type="button" class="reset-btn-empty" onclick={resetFilters}>Clear filters</button>
      </div>
    {:else}
      <div class="preset-grid">
        {#each filteredPresets as preset (preset.iri)}
          {@const expanded = expandedId === preset.iri}
          <article class="preset-card" style="--card-color: {groupColor(preset)}">
            <header class="card-head">
              <h2>{preset.label}</h2>
              {#if preset.groups.length}
                <span class="group-badge">{joinLabels(preset.groups)}</span>
              {/if}
            </header>

            <dl class="card-meta">
              {#if preset.bands.length}
                <div><dt>Target</dt><dd>{joinLabels(preset.bands)}</dd></div>
              {/if}
              {#if preset.tiers.length}
                <div><dt>Evidence</dt><dd>{joinLabels(preset.tiers)}</dd></div>
              {/if}
              {#if preset.voiceTypes.length}
                <div><dt>Voices</dt><dd>{joinLabels(preset.voiceTypes)}</dd></div>
              {/if}
              <div><dt>Version</dt><dd><code>{preset.version}</code></dd></div>
              <div><dt>Breath guide</dt><dd>{preset.hasBreathGuide ? 'Yes' : 'No'}</dd></div>
            </dl>

            {#if preset.description}
              <p class="card-description" class:clamped={!expanded}>{preset.description}</p>
              {#if preset.description.length > 140}
                <button type="button" class="expand-btn" onclick={() => toggleExpanded(preset.iri)}>
                  {expanded ? 'Show less' : 'Show more'}
                </button>
              {/if}
            {/if}

            {#if preset.references.length}
              <details class="references">
                <summary>{preset.references.length} reference{preset.references.length === 1 ? '' : 's'}</summary>
                <ul>
                  {#each preset.references as reference}
                    <li>{reference.title || reference.iri}</li>
                  {/each}
                </ul>
              </details>
            {/if}

            <footer class="card-foot">
              <span class="curie" title={preset.iri}>{toCurie(preset.iri)}</span>
              <button type="button" class="copy-btn" onclick={() => copyIri(preset.iri, preset.iri)}>
                {copiedId === preset.iri ? 'Copied' : 'Copy IRI'}
              </button>
            </footer>
          </article>
        {/each}
      </div>
    {/if}
  {/if}
</main>

<style>
  .presets-page {
    max-width: 1180px;
    margin: 0 auto;
    padding: 2.25rem 1.15rem 4rem;
    color: var(--app-text);
    font-family: var(--app-font-ui);
  }

  .hero {
    margin-bottom: 1.75rem;
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
    font-size: 0.96rem;
    line-height: 1.55;
    max-width: 68ch;
    color: var(--app-muted);
    margin: 0;
  }

  .panel {
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    padding: 1rem 1.15rem;
  }

  .filter-panel {
    margin-bottom: 1.5rem;
  }

  .filter-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
    gap: 0.75rem;
    align-items: end;
  }

  .filter-grid label {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--app-text-strong);
    margin: 0;
  }

  .filter-grid select {
    font-size: 0.88rem;
    background: var(--app-bg);
    color: var(--app-text);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    padding: 0.5rem 0.6rem;
    margin: 0;
  }

  .reset-btn {
    font-size: 0.82rem;
    font-weight: 700;
    padding: 0.5rem 1rem;
    margin: 0;
    background: var(--app-surface-2);
    color: var(--app-text);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    cursor: pointer;
    white-space: nowrap;
  }

  .reset-btn:hover:not(:disabled) { background: var(--app-accent-soft); color: var(--app-accent); }
  .reset-btn:disabled { opacity: 0.5; cursor: default; }

  .result-count {
    margin: 0.75rem 0 0;
    font-size: 0.8rem;
    color: var(--app-muted);
  }

  .error-panel {
    font-size: 0.9rem;
    color: var(--app-error);
    background: color-mix(in srgb, var(--app-error) 10%, var(--app-surface));
    border: var(--app-border-width) solid var(--app-error);
    border-radius: var(--app-radius);
    padding: 0.9rem 1rem;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    border: 1px dashed var(--app-border);
    border-radius: var(--app-radius);
    color: var(--app-muted);
  }

  .empty-state p { margin: 0 0 1rem; font-size: 0.9rem; }

  .reset-btn-empty {
    padding: 0.5rem 1.25rem;
    background: transparent;
    color: var(--app-accent);
    border: 1px solid var(--app-accent);
    border-radius: var(--app-radius);
    font-size: 0.84rem;
    font-weight: 600;
    cursor: pointer;
  }
  .reset-btn-empty:hover { background: var(--app-accent-soft); }

  .preset-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1rem;
  }

  .preset-card {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-left: 3px solid var(--card-color);
    border-radius: var(--app-radius);
    padding: 1rem 1.1rem 1.1rem;
  }

  .card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.6rem;
  }

  .card-head h2 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    line-height: 1.3;
    color: var(--app-text-strong);
  }

  .group-badge {
    flex-shrink: 0;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--card-color);
    background: color-mix(in srgb, var(--card-color) 14%, transparent);
    border: 1px solid color-mix(in srgb, var(--card-color) 32%, transparent);
    border-radius: 3px;
    padding: 0.18rem 0.5rem;
    white-space: nowrap;
  }

  .card-meta {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem 0.75rem;
    margin: 0;
  }

  .card-meta div {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .card-meta dt {
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--app-muted-2, var(--app-muted));
  }

  .card-meta dd {
    margin: 0;
    font-size: 0.85rem;
    color: var(--app-text);
  }

  .card-description {
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.5;
    color: var(--app-muted);
  }

  .card-description.clamped {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .expand-btn {
    align-self: flex-start;
    background: none;
    border: none;
    padding: 0;
    margin: -0.4rem 0 0;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--app-accent);
    cursor: pointer;
    text-decoration: underline;
  }

  .references {
    font-size: 0.82rem;
  }

  .references summary {
    cursor: pointer;
    color: var(--app-text);
    font-weight: 600;
  }

  .references ul {
    margin: 0.5rem 0 0;
    padding-left: 1.1rem;
    color: var(--app-muted);
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .card-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    margin-top: auto;
    padding-top: 0.6rem;
    border-top: var(--app-border-width) solid var(--app-border);
  }

  .curie {
    font-family: var(--app-font-mono);
    font-size: 0.76rem;
    color: var(--app-muted-2, var(--app-muted));
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .copy-btn {
    flex-shrink: 0;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.22rem 0.55rem;
    background: var(--app-accent-soft);
    color: var(--app-accent);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    cursor: pointer;
  }

  @media (max-width: 640px) {
    .filter-grid {
      grid-template-columns: 1fr;
    }

    .reset-btn {
      width: 100%;
    }

    .preset-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
