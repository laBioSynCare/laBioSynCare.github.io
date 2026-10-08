<script>
  import { onMount } from 'svelte'
  import { applicationRoute } from '../../../config/applicationUrls.js'
  import { DOMAIN_REVIEW_STATUSES } from '../../../ui/ecosystem/architecture.js'
  import { fetchLiveAgents } from '../../../ui/ecosystem/liveAgents.js'
  import {
    DIRECTORY_ERAS,
    DIRECTORY_KINDS,
    DIRECTORY_MODALITIES,
    DIRECTORY_REVIEWED,
    STAKEHOLDERS,
  } from '../../../ui/ecosystem/stakeholderDirectory.js'
  import { GITHUB_URL, ghBlob } from '../../../ui/externalLinks.js'

  const kindById = new Map(DIRECTORY_KINDS.map(kind => [kind.id, kind]))
  const modalityById = new Map(DIRECTORY_MODALITIES.map(modality => [modality.id, modality]))
  const eraById = new Map(DIRECTORY_ERAS.map(era => [era.id, era]))
  const reviewById = new Map(DOMAIN_REVIEW_STATUSES.map(status => [status.id, status]))
  const sorted = [...STAKEHOLDERS].sort((a, b) => a.name.localeCompare(b.name))
  const listedAgents = new Set(STAKEHOLDERS.filter(entry => entry.agent).map(entry => entry.agent))
  const proposeUrl = `${GITHUB_URL}/issues/new?title=${encodeURIComponent('Stakeholder directory: ')}`

  let query = $state('')
  let kind = $state('')
  let modality = $state('')
  let review = $state('')
  let onlyRecorded = $state(false)

  // null while loading, a Map once read, an Error when the store cannot be reached.
  let live = $state(null)

  onMount(() => {
    fetchLiveAgents().then(agents => { live = agents }, error => { live = error })
  })

  const liveAgents = $derived(live instanceof Map ? live : null)

  function recorded(entry) {
    return Boolean(entry.agent && liveAgents?.has(entry.agent))
  }

  function graphLink(path) {
    return `${applicationRoute('/graph/')}?layer=ecosystem#sstim-${path.replace('/', ':')}`
  }

  const visible = $derived.by(() => {
    const needle = query.trim().toLowerCase()
    return sorted.filter(entry =>
      (!kind || entry.kind === kind) &&
      (!modality || entry.modalities.includes(modality)) &&
      (!review || entry.review === review) &&
      (!onlyRecorded || recorded(entry)) &&
      (!needle || `${entry.name} ${entry.summary} ${entry.country ?? ''}`.toLowerCase().includes(needle)))
  })

  const recordedCount = $derived(liveAgents ? STAKEHOLDERS.filter(recorded).length : 0)

  const unlisted = $derived(liveAgents
    ? [...liveAgents.values()]
        .filter(agent => !listedAgents.has(agent.path))
        .sort((a, b) => a.name.localeCompare(b.name))
    : [])

  function clearFilters() {
    query = ''
    kind = ''
    modality = ''
    review = ''
    onlyRecorded = false
  }
</script>

<svelte:head>
  <title>Stakeholder directory | SSTIM Workbench</title>
  <meta
    name="description"
    content="Companies, laboratories, people, societies, standards and projects of the sensory-stimulation ecosystem, each from a public source, and which of them are recorded in SSTIM's live graph."
  />
</svelte:head>

<main class="directory-page">
  <header class="hero">
    <p class="eyebrow">SSTIM ecosystem</p>
    <h1>Stakeholder directory</h1>
    <p class="lede">
      Companies, laboratories, people, societies, standards and projects that work in sensory
      stimulation or beside it, each listed from one public source.
    </p>
    <p class="hero-note">
      A listing records relevance to the field and nothing more. It does not mean that anyone was
      contacted, agreed to be listed, endorses SSTIM, or conforms to it, and it says nothing about
      whether a product is safe or effective. Entries marked <strong>In the SSTIM graph</strong>
      also have a sourced relationship record in SSTIM's live graph, which the people and
      organizations concerned are invited to review.
    </p>
    <nav class="hero-actions" aria-label="Directory actions">
      <a href={proposeUrl} rel="external">Propose, correct or remove an entry</a>
      <a href={applicationRoute('/graph/') + '?layer=ecosystem'}>Open the live graph</a>
      <a href={applicationRoute('/ecosystem/')}>About the ecosystem</a>
    </nav>
  </header>

  <section class="controls" aria-label="Filter the directory">
    <label class="search">
      <span>Search</span>
      <input type="search" bind:value={query} placeholder="Name, field or country" />
    </label>
    <label>
      <span>Kind</span>
      <select bind:value={kind}>
        <option value="">All kinds</option>
        {#each DIRECTORY_KINDS as option}
          <option value={option.id}>{option.label}</option>
        {/each}
      </select>
    </label>
    <label>
      <span>Modality or field</span>
      <select bind:value={modality}>
        <option value="">All</option>
        {#each DIRECTORY_MODALITIES as option}
          <option value={option.id}>{option.label}</option>
        {/each}
      </select>
    </label>
    <label>
      <span>Domain review</span>
      <select bind:value={review}>
        <option value="">All</option>
        <option value="candidate">{reviewById.get('candidate').label}</option>
        <option value="related">{reviewById.get('related').label}</option>
      </select>
    </label>
    <label class="check">
      <input type="checkbox" bind:checked={onlyRecorded} disabled={!liveAgents} />
      <span>Only entries in the SSTIM graph</span>
    </label>
  </section>

  <p class="tally" aria-live="polite">
    Showing {visible.length} of {STAKEHOLDERS.length} entries.
    {#if live === null}
      Reading the live SSTIM graph…
    {:else if liveAgents}
      {recordedCount} {recordedCount === 1 ? 'is' : 'are'} in the SSTIM graph.
    {:else}
      The live SSTIM graph could not be read, so graph membership is not shown.
    {/if}
    {#if visible.length < STAKEHOLDERS.length}
      <button type="button" class="link-button" onclick={clearFilters}>Clear filters</button>
    {/if}
  </p>

  <ul class="entries">
    {#each visible as entry (entry.id)}
      <li class="entry" class:recorded={recorded(entry)} class:related={entry.review === 'related'}>
        <div class="entry-top">
          <span class="entry-kind">{kindById.get(entry.kind).label}{entry.country ? ` · ${entry.country}` : ''}</span>
          {#if recorded(entry)}
            <a class="badge graph" href={graphLink(entry.agent)}>In the SSTIM graph</a>
          {/if}
        </div>
        <h2>{entry.name}</h2>
        <p>{entry.summary}</p>
        <div class="badges">
          {#each entry.modalities as id}
            <span class="badge">{modalityById.get(id).label}</span>
          {/each}
          <span class="badge review">{reviewById.get(entry.review).label}</span>
          {#if entry.era !== 'active'}
            <span class="badge era">{eraById.get(entry.era).label}</span>
          {/if}
        </div>
        <a class="source" href={entry.url} rel="external">Source</a>
      </li>
    {:else}
      <li class="empty">No entry matches these filters.</li>
    {/each}
  </ul>

  {#if unlisted.length}
    <section class="live-only">
      <h2>Also in the live SSTIM graph</h2>
      <p>
        These agents have records in the live graph but no directory entry. Their details come
        from the graph itself, so they change, or disappear, when the graph does.
      </p>
      <ul class="entries">
        {#each unlisted as agent (agent.iri)}
          <li class="entry recorded">
            <div class="entry-top">
              <span class="entry-kind">{agent.kind === 'person' ? 'Person' : 'Organization'}</span>
              <a class="badge graph" href={graphLink(agent.path)}>In the SSTIM graph</a>
            </div>
            <h2>{agent.name}</h2>
            {#if agent.description}<p>{agent.description}</p>{/if}
            {#if agent.url}<a class="source" href={agent.url} rel="external">Source</a>{/if}
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <footer class="page-footer">
    <span>Sources checked {DIRECTORY_REVIEWED}.</span>
    <a href={ghBlob('docs/decisions/0062-sensory-stimulation-ecosystem-contributor.md')} rel="external">How entries are added (ADR 0062)</a>
    <a href={applicationRoute('/ecosystem/')}>SSTIM ecosystem</a>
  </footer>
</main>

<style>
  .directory-page {
    max-width: 1120px;
    margin: 0 auto;
    padding: 1.5rem 1rem 6rem;
    color: var(--app-text);
    font-family: var(--app-font-ui);
  }

  .hero {
    padding: clamp(1.25rem, 4vw, 2.25rem);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) * 1.6);
    background: linear-gradient(145deg, var(--app-surface), var(--app-surface-2));
  }
  .eyebrow,
  .entry-kind {
    font-size: 0.68rem;
    font-weight: 750;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .eyebrow { margin: 0 0 0.35rem; color: var(--app-accent); }
  .hero h1 { margin: 0; color: var(--app-text-strong); font-size: clamp(1.8rem, 5vw, 2.6rem); line-height: 1.1; }
  .lede { max-width: 70ch; margin: 0.8rem 0 0.6rem; font-size: 1.02rem; line-height: 1.6; }
  .hero-note { max-width: 78ch; margin: 0; color: var(--app-muted); font-size: 0.86rem; line-height: 1.55; }
  .hero-actions { display: flex; flex-wrap: wrap; justify-content: flex-start; gap: 0.5rem; margin-top: 1.1rem; }
  .hero-actions a {
    padding: 0.5rem 0.85rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    background: var(--app-surface);
    color: var(--app-text-strong);
    font-size: 0.82rem;
    font-weight: 650;
    text-decoration: none;
  }
  .hero-actions a:first-child { border-color: var(--app-accent); background: var(--app-accent); color: var(--app-on-accent); }
  .hero-actions a:hover { border-color: var(--app-accent); }

  .controls {
    display: grid;
    grid-template-columns: minmax(200px, 2fr) repeat(3, minmax(140px, 1fr));
    gap: 0.7rem;
    align-items: end;
    margin-top: 1.5rem;
  }
  .controls label { display: grid; gap: 0.25rem; margin: 0; font-size: 0.74rem; font-weight: 650; color: var(--app-muted); }
  .controls input[type='search'],
  .controls select { width: 100%; margin: 0; font-size: 0.85rem; }
  .controls .check { grid-column: 1 / -1; display: flex; align-items: center; gap: 0.45rem; }
  .controls .check input { margin: 0; }

  .tally { margin: 0.9rem 0; color: var(--app-muted); font-size: 0.82rem; }
  .link-button {
    width: auto;
    margin: 0 0 0 0.4rem;
    padding: 0;
    border: 0;
    background: none;
    color: var(--app-accent);
    font-size: 0.82rem;
    text-decoration: underline;
    cursor: pointer;
  }

  .entries {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
    gap: 0.75rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .entry {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 1rem;
    border: var(--app-border-width) solid var(--app-border);
    border-left: 3px solid var(--app-visual);
    border-radius: var(--app-radius);
    background: var(--app-surface);
    list-style: none;
  }
  .entry.related { border-left-color: var(--app-border); }
  .entry.recorded { border-left-color: var(--app-ok); }
  .entry-top { display: flex; justify-content: space-between; gap: 0.5rem; align-items: flex-start; }
  .entry-kind { color: var(--app-muted); }
  .entry h2 { margin: 0.3rem 0 0; color: var(--app-text-strong); font-size: 1.02rem; line-height: 1.3; }
  .entry p { flex: 1; margin: 0.5rem 0 0; font-size: 0.83rem; line-height: 1.55; }
  .badges { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.7rem; }
  .badge {
    padding: 0.15rem 0.45rem;
    border: 1px solid var(--app-border);
    border-radius: 999px;
    color: var(--app-text);
    font-size: 0.66rem;
    font-weight: 650;
    white-space: nowrap;
  }
  .badge.review { color: var(--app-muted); }
  .badge.era { color: var(--app-warn); border-color: var(--app-warn); }
  .badge.graph {
    flex-shrink: 0;
    color: var(--app-ok);
    background: color-mix(in srgb, var(--app-ok) 10%, var(--app-surface));
    border-color: var(--app-ok);
    text-decoration: none;
  }
  .source { margin-top: 0.6rem; color: var(--app-accent); font-size: 0.78rem; font-weight: 650; }
  .empty { padding: 1rem; color: var(--app-muted); list-style: none; }

  .live-only { margin-top: 2.5rem; }
  .live-only > h2 { margin: 0; color: var(--app-text-strong); font-size: 1.3rem; }
  .live-only > p { max-width: 72ch; margin: 0.4rem 0 1rem; color: var(--app-muted); font-size: 0.84rem; line-height: 1.55; }

  .page-footer {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    justify-content: center;
    margin-top: 3rem;
    padding-top: 1rem;
    border-top: var(--app-border-width) solid var(--app-border);
    color: var(--app-muted);
    font-size: 0.78rem;
  }
  .page-footer a { color: var(--app-accent); }

  @media (max-width: 760px) {
    .controls { grid-template-columns: 1fr 1fr; }
    .controls .search { grid-column: 1 / -1; }
  }

  @media (max-width: 480px) {
    .controls { grid-template-columns: 1fr; }
    .hero-actions a { width: 100%; text-align: center; }
  }
</style>
