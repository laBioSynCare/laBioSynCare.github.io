<script>
  import { onMount } from 'svelte'
  import { loadKnowledgeGraph } from '../../rdf/loader.js'
  import { listPresets } from '../../rdf/presets.js'

  let presets = $state([])
  let loading = $state(true)
  let error = $state(null)
  let groupFilter = $state('all')
  let bandFilter = $state('all')
  let tierFilter = $state('all')

  const groupOptions = $derived(uniqueLabels(presets.flatMap(p => p.groups)))
  const bandOptions = $derived(uniqueLabels(presets.flatMap(p => p.bands)))
  const tierOptions = $derived(uniqueLabels(presets.flatMap(p => p.tiers)))

  const filteredPresets = $derived(presets.filter(p => {
    const groupOk = groupFilter === 'all' || p.groups.some(g => g.label === groupFilter)
    const bandOk = bandFilter === 'all' || p.bands.some(b => b.label === bandFilter)
    const tierOk = tierFilter === 'all' || p.tiers.some(t => t.label === tierFilter)
    return groupOk && bandOk && tierOk
  }))

  function uniqueLabels(items) {
    return [...new Set(items.map(item => item.label).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
  }

  function joinLabels(items) {
    return items.map(item => item.label).filter(Boolean).join(', ')
  }

  function resetFilters() {
    groupFilter = 'all'
    bandFilter = 'all'
    tierFilter = 'all'
  }

  onMount(async () => {
    try {
      const store = await loadKnowledgeGraph()
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

<main class="container">
  <header class="page-header">
    <h1>Presets</h1>
    <p>{filteredPresets.length} / {presets.length}</p>
  </header>

  {#if loading}
    <p aria-busy="true">Loading presets...</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else}
    <section class="toolbar" aria-label="Preset filters">
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

      <button type="button" class="secondary" onclick={resetFilters}>Reset</button>
    </section>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Preset</th>
            <th>Group</th>
            <th>Target</th>
            <th>Evidence</th>
            <th>Voices</th>
            <th>Version</th>
            <th>Breath</th>
            <th>References</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredPresets as preset}
            <tr>
              <th scope="row">
                <span>{preset.label}</span>
                <small class="iri">{preset.iri}</small>
                {#if preset.description}
                  <small>{preset.description}</small>
                {/if}
              </th>
              <td>{joinLabels(preset.groups)}</td>
              <td>{joinLabels(preset.bands)}</td>
              <td>{joinLabels(preset.tiers)}</td>
              <td>{joinLabels(preset.voiceTypes)}</td>
              <td><code>{preset.version}</code></td>
              <td>{preset.hasBreathGuide ? 'Yes' : 'No'}</td>
              <td>
                {#if preset.references.length}
                  <details>
                    <summary>{preset.references.length}</summary>
                    <ul>
                      {#each preset.references as reference}
                        <li>
                          {reference.title}
                        </li>
                      {/each}
                    </ul>
                  </details>
                {:else}
                  <span aria-label="No references">-</span>
                {/if}
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="8">No presets</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</main>

<style>
  .page-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    padding-block: 1.25rem 0.5rem;
  }

  .page-header h1 {
    margin: 0;
    font-size: 1.7rem;
  }

  .page-header p {
    margin: 0;
    color: var(--pico-muted-color);
  }

  .toolbar {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
    gap: 0.75rem;
    align-items: end;
    margin-block: 0.75rem 1rem;
  }

  .toolbar label {
    margin: 0;
  }

  .toolbar button {
    min-width: 5.5rem;
    margin: 0;
  }

  .table-wrap {
    overflow-x: auto;
  }

  table {
    min-width: 980px;
  }

  th small {
    display: block;
    max-width: 36rem;
    margin-top: 0.25rem;
    color: var(--pico-muted-color);
    font-weight: 400;
  }

  .iri {
    word-break: break-all;
  }

  details {
    margin: 0;
  }

  details summary {
    cursor: pointer;
  }

  details ul {
    min-width: 18rem;
    margin: 0.5rem 0 0;
    padding-left: 1rem;
  }

  .error {
    color: var(--pico-color-red-500, red);
  }

  @media (max-width: 760px) {
    .page-header {
      align-items: flex-start;
      flex-direction: column;
    }

    .toolbar {
      grid-template-columns: 1fr;
    }

    .toolbar button {
      width: 100%;
    }
  }
</style>
