<script>
  import { onMount } from 'svelte'
  import { applicationRoute } from '../../config/applicationUrls.js'
  import { loadStaticKnowledgeGraph } from '../../rdf/loader.js'
  import { toCurie } from '../../rdf/namespaces.js'
  import {
    formatFrequency,
    formatMagnitude,
    formatProgression,
    formatRates,
    formatSchedule,
    formatSeconds,
    listPublishedProtocols,
    protocolLevels,
    protocolProgressions,
    protocolRates,
    protocolSenses,
  } from '../../rdf/protocols.js'

  // A profile with more channels than this is summarised before it is listed:
  // the SSVEP speller's 40 targets would otherwise bury the rest of the record.
  const CHANNEL_SUMMARY_THRESHOLD = 8

  let protocols = $state([])
  let loading = $state(true)
  let error = $state(null)
  let senseFilter = $state('all')
  let speciesFilter = $state('all')

  const rows = $derived(protocols.map(protocol => ({
    ...protocol,
    senses: protocolSenses(protocol),
    rates: protocolRates(protocol),
    levels: protocolLevels(protocol),
    progressions: protocolProgressions(protocol),
    scheduleText: formatSchedule(protocol.schedule),
    species: protocol.population?.taxa ?? [],
  })))
  const senseOptions = $derived([...new Set(rows.flatMap(row => row.senses))].sort())
  const speciesOptions = $derived([...new Set(rows.flatMap(row => row.species))].sort())
  const visibleRows = $derived(rows.filter(row =>
    (senseFilter === 'all' || row.senses.includes(senseFilter))
    && (speciesFilter === 'all' || row.species.includes(speciesFilter))))
  const paperCount = $derived(new Set(rows.map(row => row.reference.iri)).size)
  const years = $derived(rows.map(row => row.reference.year).filter(Boolean).sort())
  const fullText = $derived(rows.filter(row => row.encodedFrom === 'full text').length)

  async function loadProtocols() {
    loading = true
    error = null
    try {
      const store = await loadStaticKnowledgeGraph()
      protocols = listPublishedProtocols(store)
    } catch (caught) {
      error = caught instanceof Error ? caught.message : String(caught)
    } finally {
      loading = false
    }
  }

  // Labels end with their citation, "(Chan et al. 2022)"; the table already shows it.
  function title(row) {
    return row.label.replace(/\s*\([^)]*\d{4}[^)]*\)\s*$/, '')
  }

  // A label's first letter lower-cased for use mid-sentence, unless the label
  // opens with an acronym ("EEG", "LED").
  function lower(value) {
    const label = String(value ?? '')
    return /^\p{Lu}{2}/u.test(label) ? label : label.charAt(0).toLocaleLowerCase() + label.slice(1)
  }

  function lawText(law) {
    const parts = [`Reads ${lower(list(law.inputs)) || 'a recorded signal'}`]
    if (law.oscillation) parts.push(`follows the ${lower(law.oscillation)}`)
    if (law.phase) parts.push(`aims at its ${lower(law.phase)}`)
    if (law.thresholdValue !== null) {
      const adaptive = law.thresholdUpdateSeconds !== null
        ? ` recomputed every ${formatSeconds(law.thresholdUpdateSeconds)} from the last ${formatSeconds(law.thresholdWindowSeconds)}`
        : ''
      parts.push(`${`threshold ${law.thresholdValue} ${law.thresholdUnit}`.trim()}${adaptive}`)
    }
    if (law.triggerDelaySeconds !== null) parts.push(`delay ${formatSeconds(law.triggerDelaySeconds)}`)
    if (law.triggerDelayReference) parts.push(`delay set to each subject's ${lower(law.triggerDelayReference)}`)
    if (law.stimuliPerTrigger !== null) {
      const apart = law.interStimulusSeconds !== null ? ` ${formatSeconds(law.interStimulusSeconds)} apart` : ''
      parts.push(`${law.stimuliPerTrigger} stimuli per event${apart}`)
    }
    if (law.refractorySeconds !== null) parts.push(`then waits ${formatSeconds(law.refractorySeconds)}`)
    if (law.sleepStages.length) parts.push(`only during ${orList(law.sleepStages.map(lower))}`)
    return `${parts.join(', ')}.`
  }

  // A closed-loop protocol has no fixed rate: the subject's own rhythm sets it.
  function rateFromControlLaw(row) {
    const law = row.controlLaws.find(candidate => candidate.oscillation)
    return law ? `closed loop, follows the ${lower(law.oscillation)}` : ''
  }

  // A cue tempo set from each patient's own cadence has no single rate in Hz.
  function rateFromCadence(row) {
    return row.levels.some(level => level.relativeTo === 'Baseline cadence') ? "set from each patient's cadence" : ''
  }

  function renderingText(rendering) {
    const shape = rendering.signal.shape ? ` (${lower(rendering.signal.shape)})` : ''
    const onto = rendering.parameter ? ` onto ${lower(rendering.parameter)}` : ''
    const by = rendering.mechanism ? ` by ${lower(rendering.mechanism)}` : ''
    const extras = [lower(rendering.presence), rendering.carrierHz !== null && `carrier ${formatFrequency(rendering.carrierHz)}`]
      .filter(Boolean).join(', ')
    return `Renders ${rendering.signal.label}${shape}${onto}${by}${extras ? `, ${extras}` : ''}.`
  }

  function levelText(level) {
    return [level.label && lower(level.label), lower(level.quantity), lower(level.stage), lower(level.basis),
      level.relativeTo && `relative to ${lower(level.relativeTo)}`]
      .filter(Boolean).join(' · ')
  }

  function capitalised(value) {
    return value.charAt(0).toLocaleUpperCase() + value.slice(1)
  }

  function graphLink(iri) {
    return `${applicationRoute('/graph/')}#${toCurie(iri)}`
  }

  function armSummary(arms) {
    return arms.map(arm => arm.role ? `${arm.label} (${lower(arm.role.replace(/ arm$/i, ''))})` : arm.label).join('; ')
  }

  function list(items) {
    return items.filter(Boolean).join(', ')
  }

  function orList(items) {
    return items.length > 1 ? `${items.slice(0, -1).join(', ')} or ${items.at(-1)}` : items.join('')
  }

  function channelRate(channel) {
    const rates = []
    if (channel.flickerHz !== null) rates.push(`flicker ${formatRates([channel.flickerHz])}`)
    if (channel.modulationHz !== null) rates.push(`pulses ${formatRates([channel.modulationHz])}`)
    if (channel.carrierHz !== null) rates.push(`carrier ${formatFrequency(channel.carrierHz)}`)
    if (channel.dutyCycle !== null) rates.push(`duty cycle ${Math.round(channel.dutyCycle * 100)}%`)
    return rates.join(' · ')
  }

  // Papers in feet are stored converted exactly (5 ft is 1.524 m); millimetres are enough to read.
  const metres = value => `${Number(value.toFixed(3))} m`

  function geometry(channel) {
    const parts = []
    const { viewingDistanceMetres, widthMetres, heightMetres, refreshHz, visualAngleDegrees } = channel.geometry
    if (viewingDistanceMetres !== null) parts.push(`${metres(viewingDistanceMetres)} away`)
    if (widthMetres !== null && heightMetres !== null) parts.push(`${Number(widthMetres.toFixed(3))} × ${metres(heightMetres)}`)
    if (refreshHz !== null) parts.push(`${refreshHz} Hz display`)
    if (visualAngleDegrees !== null) parts.push(`${visualAngleDegrees}° visual angle`)
    return parts.join(' · ')
  }

  function interval(channel) {
    if (!channel.interval) return ''
    const { distribution, meanSeconds, minSeconds, maxSeconds } = channel.interval
    const parts = [lower(distribution)]
    if (meanSeconds !== null) parts.push(`mean ${meanSeconds * 1000} ms`)
    if (minSeconds !== null) parts.push(`min ${minSeconds * 1000} ms`)
    if (maxSeconds !== null) parts.push(`max ${maxSeconds * 1000} ms`)
    return `Random onsets: ${parts.join(', ')}`
  }

  function targetSummary(channels) {
    const rates = formatRates(channels.map(channel => channel.flickerHz))
    const phases = [...new Set(channels.map(channel => channel.initialPhase).filter(value => value !== null))]
      .sort((a, b) => a - b)
    const phaseText = phases.length ? `, starting at ${phases.join(', ')} of a cycle` : ''
    // The display, when every target shares it.
    const displays = new Set(channels.map(channel => geometry(channel)))
    const displayText = displays.size === 1 && [...displays][0] ? `; ${[...displays][0]}` : ''
    return `${channels.length} channels flickering at ${rates}${phaseText}${displayText}`
  }

  function sharedSignals(profile) {
    const bySignal = new Map()
    for (const channel of profile.channels) {
      for (const rendering of channel.renderings) {
        if (!rendering.signal) continue
        const entry = bySignal.get(rendering.signal.iri) ?? { signal: rendering.signal, channels: new Set() }
        entry.channels.add(channel.label)
        bySignal.set(rendering.signal.iri, entry)
      }
    }
    return [...bySignal.values()].filter(entry => entry.channels.size > 1)
  }

  onMount(loadProtocols)
</script>

<svelte:head>
  <title>Published protocols | SSTIM Workbench</title>
  <meta
    name="description"
    content="Nine published sensory stimulation protocols, from the 40 Hz auditory response of 1981 to a 2022 randomized home-use trial, encoded in SSTIM from their papers and compared side by side: stimulus, levels and where they hold, schedule, arms and population."
  />
</svelte:head>

<main class="protocols-page">
  <header class="hero">
    <div class="hero-copy">
      <p class="eyebrow">Published research, encoded in SSTIM</p>
      <h1>Published protocols, side by side</h1>
      <p class="subhead">
        Each record describes a method as its paper reports it: what reached the subject,
        how loud or bright and where that was measured, how often, compared with what, and in whom.
        A record asserts no effect. Values a paper does not state are left out, not guessed.
        <a href={applicationRoute('/contribute/')}>Report an error in an encoding.</a>
      </p>
    </div>

    <aside class="trust-note" aria-labelledby="levels-note-title">
      <span class="trust-icon" aria-hidden="true">i</span>
      <div>
        <h2 id="levels-note-title">How to read a level</h2>
        <p>
          Every level names where it holds: configured in the system, emitted at the source,
          at the subject, relative to the subject's own threshold, or not stated.
        </p>
        <p>
          "68 dB, stage not stated" means the paper gave 68 dB without saying where it was measured.
          The paper's own words are kept beside the number.
        </p>
      </div>
    </aside>
  </header>

  {#if loading}
    <p class="status" role="status">Loading the published protocols…</p>
  {:else if error}
    <div class="status error-panel" role="alert">
      <p>The protocols could not be loaded: {error}</p>
      <button type="button" class="retry-button" onclick={loadProtocols}>Try again</button>
    </div>
  {:else}
    <dl class="facts" aria-label="Collection facts">
      <div><dt>Protocols</dt><dd>{rows.length}</dd></div>
      <div><dt>Papers</dt><dd>{paperCount}</dd></div>
      <div><dt>Published</dt><dd>{years[0]} to {years.at(-1)}</dd></div>
      <div><dt>From full texts</dt><dd>{fullText} of {rows.length}</dd></div>
    </dl>

    <div class="filters" role="group" aria-label="Filter protocols">
      <label>
        <span>Sense</span>
        <select bind:value={senseFilter}>
          <option value="all">All senses</option>
          {#each senseOptions as option}<option value={option}>{option}</option>{/each}
        </select>
      </label>
      <label>
        <span>Species</span>
        <select bind:value={speciesFilter}>
          <option value="all">All species</option>
          {#each speciesOptions as option}<option value={option}>{option}</option>{/each}
        </select>
      </label>
      <p class="result-count" aria-live="polite">{visibleRows.length} of {rows.length} shown</p>
    </div>

    <div class="table-scroll">
      <table class="comparison">
        <caption class="visually-hidden">Published protocols compared</caption>
        <thead>
          <tr>
            <th scope="col">Protocol</th>
            <th scope="col">Senses</th>
            <th scope="col">Rate</th>
            <th scope="col">Levels, and where they hold</th>
            <th scope="col">Schedule</th>
            <th scope="col">Arms</th>
            <th scope="col">Population</th>
          </tr>
        </thead>
        <tbody>
          {#each visibleRows as row (row.iri)}
            <tr>
              <th scope="row">
                <a href={`#${row.id}`}>{row.reference.citation}</a>
                <span class="row-title">{title(row)}</span>
                {#if row.encodedFrom === 'abstract'}<span class="badge">abstract only</span>{/if}
              </th>
              <td>{list(row.senses) || '—'}</td>
              <td>{row.rates || rateFromControlLaw(row) || rateFromCadence(row) || 'not encoded'}</td>
              <td>
                {#if row.levels.length}
                  <ul class="plain">
                    {#each row.levels as level}
                      <li>
                        <strong>{formatMagnitude(level)}</strong>
                        <span class="muted">{[lower(level.label || level.quantity), level.relativeTo ? `relative to ${lower(level.relativeTo)}` : lower(level.stage)].filter(Boolean).join(', ')}</span>
                      </li>
                    {/each}
                  </ul>
                  {#each row.progressions as progression (progression.iri)}
                    <p class="muted progression">{formatProgression(progression)}</p>
                  {/each}
                {:else}
                  <span class="muted">none stated</span>
                {/if}
              </td>
              <td>{row.scheduleText || 'not encoded'}</td>
              <td>{row.arms.length ? armSummary(row.arms) : 'single condition'}</td>
              <td>
                {row.population?.label ?? 'not encoded'}
                {#if row.species.length}<span class="muted"> ({list(row.species)})</span>{/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <section class="records" aria-label="Full records">
      <h2>Full records</h2>
      {#each visibleRows as row (row.iri)}
        <details class="record" id={row.id}>
          <summary>
            <span class="record-citation">{row.reference.citation}</span>
            <span class="record-title">{title(row)}</span>
          </summary>

          <div class="record-body">
            <p>{row.description}</p>

            <dl class="record-facts">
              <div>
                <dt>Source</dt>
                <dd>
                  {row.reference.title}
                  {#if row.reference.doiUrl}<a href={row.reference.doiUrl} rel="external noopener">{row.reference.doiUrl.replace('https://doi.org/', 'doi:')}</a>{/if}
                </dd>
              </div>
              <div><dt>How this record was encoded</dt><dd>{row.editorialNote}</dd></div>
              <div><dt>Techniques</dt><dd>{list(row.techniques)}</dd></div>
              {#if row.neuralPhenomena.length || row.neuralTargets.length}
                <div>
                  <dt>Intended neural objective</dt>
                  <dd>{list([...row.neuralPhenomena, ...row.neuralSystems, ...row.neuralTargets])}</dd>
                </div>
              {/if}
              {#if row.design || row.allocation}
                <div><dt>Design</dt><dd>{list([row.design, row.allocation && `${lower(row.allocation)} allocation`])}</dd></div>
              {/if}
              {#if row.population}
                <div>
                  <dt>Population</dt>
                  <dd>
                    {row.population.label}{#if row.population.description}. {row.population.description}{/if}
                    {#if row.population.conditions.length}<span class="muted"> ({list(row.population.conditions)})</span>{/if}
                  </dd>
                </div>
              {/if}
              {#if row.schedule}
                <div>
                  <dt>Schedule</dt>
                  <dd>
                    {row.scheduleText}
                    {#if row.schedule.segments.length}
                      <ol class="segments">
                        {#each row.schedule.segments as segment}
                          <li>{segment.role}{#if segment.durationSeconds !== null}, {formatSeconds(segment.durationSeconds)}{/if}</li>
                        {/each}
                      </ol>
                    {/if}
                  </dd>
                </div>
              {/if}
              {#if row.arms.length}
                <div>
                  <dt>Arms</dt>
                  <dd>
                    <ul class="plain">
                      {#each row.arms as arm}
                        <li>{arm.label}{#if arm.role}{' '}<span class="muted">({lower(arm.role)})</span>{/if}</li>
                      {/each}
                    </ul>
                  </dd>
                </div>
              {/if}
              {#each row.controlLaws as law}
                <div>
                  <dt>Control law</dt>
                  <dd>{lawText(law)}</dd>
                </div>
              {/each}
            </dl>

            {#each row.profiles as profile (profile.iri)}
              <section class="profile">
                <h3>{profile.label}</h3>
                {#each sharedSignals(profile) as shared}
                  <p class="shared">
                    One signal, {shared.signal.label}, is rendered through {[...shared.channels].length} channels:
                    the assertion that they deliver the same thing.
                  </p>
                {/each}
                {#if profile.channels.length > CHANNEL_SUMMARY_THRESHOLD}
                  <p>{targetSummary(profile.channels)}.</p>
                  <details class="channel-list">
                    <summary>List all {profile.channels.length}</summary>
                    <ul class="plain columns">
                      {#each profile.channels as channel (channel.iri)}<li>{channel.label}</li>{/each}
                    </ul>
                  </details>
                {:else}
                  {#each profile.channels as channel (channel.iri)}
                    <article class="channel">
                      <h4>{channel.label}</h4>
                      <p class="muted">
                        {list([channel.role, list(channel.modalities), list(channel.media), list(channel.placements)])}
                      </p>
                      {#if channelRate(channel)}<p>{channelRate(channel)}</p>{/if}
                      {#if interval(channel)}<p>{interval(channel)}</p>{/if}
                      {#if geometry(channel)}<p>{geometry(channel)}</p>{/if}
                      {#if channel.durationSeconds !== null}<p>Presents for {formatSeconds(channel.durationSeconds)} per session.</p>{/if}
                      {#each channel.renderings as rendering}
                        {#if rendering.signal}
                          <p>{renderingText(rendering)}</p>
                        {/if}
                      {/each}
                      {#each channel.magnitudes as level}
                        <div class="level">
                          <p><strong>{formatMagnitude(level) || 'No number'}</strong> {levelText(level)}</p>
                          {#if level.reportedAs}<blockquote>“{level.reportedAs}”</blockquote>{/if}
                          {#if level.progression}
                            <p>{capitalised(formatProgression(level.progression))}.</p>
                            {#if level.progression.limit?.reportedAs}<blockquote>“{level.progression.limit.reportedAs}”</blockquote>{/if}
                          {/if}
                        </div>
                      {/each}
                    </article>
                  {/each}
                {/if}
              </section>
            {/each}

            <p class="identifier">
              <code>{toCurie(row.iri)}</code>
              <a href={graphLink(row.iri)}>Open in the graph</a>
            </p>
          </div>
        </details>
      {/each}
    </section>
  {/if}
</main>

<style>
  .protocols-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: clamp(1.5rem, 4vw, 3.5rem) clamp(1rem, 3vw, 1.5rem) 5rem;
    color: var(--app-text);
    font-family: var(--app-font-ui);
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) minmax(260px, 0.75fr);
    gap: clamp(1.25rem, 4vw, 3.5rem);
    align-items: end;
    margin-bottom: 1.5rem;
  }

  .eyebrow {
    margin: 0 0 0.45rem;
    color: var(--app-accent);
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .hero h1 {
    max-width: 16ch;
    margin: 0 0 0.75rem;
    color: var(--app-text-strong);
    font-size: clamp(2rem, 5.5vw, 3.6rem);
    font-weight: 820;
    letter-spacing: -0.04em;
    line-height: 1;
  }

  .subhead {
    max-width: 68ch;
    margin: 0;
    color: var(--app-muted);
    font-size: clamp(0.95rem, 2vw, 1.05rem);
    line-height: 1.65;
  }

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

  .trust-note h2 { margin: 0 0 0.35rem; color: var(--app-text-strong); font-size: 0.88rem; }
  .trust-note p { margin: 0; color: var(--app-muted); font-size: 0.78rem; line-height: 1.55; }
  .trust-note p + p { margin-top: 0.55rem; }

  .status { margin: 2rem 0; color: var(--app-muted); }
  .error-panel {
    padding: 1rem;
    border: var(--app-border-width) solid color-mix(in srgb, var(--app-error) 55%, var(--app-border));
    border-radius: var(--app-radius);
  }
  .retry-button { margin-top: 0.5rem; }

  .facts {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin: 0 0 1.5rem;
    overflow: hidden;
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) * 1.5);
  }

  .facts div {
    display: flex;
    flex-direction: column-reverse;
    gap: 0.15rem;
    padding: 0.85rem 1rem;
    border-right: var(--app-border-width) solid var(--app-border);
  }
  .facts div:last-child { border-right: 0; }
  .facts dd { margin: 0; color: var(--app-text-strong); font-size: 1.05rem; font-weight: 780; }
  .facts dt { color: var(--app-muted); font-size: 0.68rem; letter-spacing: 0.035em; text-transform: uppercase; }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1rem;
    align-items: end;
    margin-bottom: 1rem;
  }
  .filters label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.75rem; color: var(--app-muted); }
  .filters select { margin: 0; min-width: 11rem; }
  .result-count { margin: 0 0 0.4rem auto; color: var(--app-muted); font-size: 0.78rem; }

  .table-scroll {
    overflow-x: auto;
    margin-bottom: 2.5rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) * 1.5);
  }

  .comparison {
    width: 100%;
    min-width: 980px;
    margin: 0;
    border-collapse: collapse;
    font-size: 0.8rem;
  }
  .comparison th,
  .comparison td {
    padding: 0.7rem 0.8rem;
    text-align: left;
    vertical-align: top;
    border-bottom: var(--app-border-width) solid var(--app-border);
  }
  .comparison thead th {
    color: var(--app-muted);
    font-size: 0.68rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    background: var(--app-surface);
  }
  .comparison tbody th { min-width: 14rem; font-weight: 400; }
  .comparison tbody th a { display: block; font-weight: 750; }
  .row-title { display: block; margin-top: 0.2rem; color: var(--app-muted); }

  .badge {
    display: inline-block;
    margin-top: 0.35rem;
    padding: 0.05rem 0.45rem;
    color: var(--app-muted);
    border: 1px solid var(--app-border);
    border-radius: 999px;
    font-size: 0.66rem;
  }

  /* Pico styles the list item itself, so the marker is removed there too. */
  .plain { margin: 0; padding: 0; list-style: none; }
  .plain li { list-style: none; }
  .plain li + li { margin-top: 0.3rem; }
  .muted { color: var(--app-muted); }
  .progression { margin: 0.3rem 0 0; font-size: inherit; }

  .records h2 { margin: 0 0 1rem; font-size: 1.2rem; color: var(--app-text-strong); }

  .record {
    margin-bottom: 0.75rem;
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) * 1.5);
  }
  .record > summary { padding: 0.9rem 1rem; cursor: pointer; }
  .record-citation { font-weight: 780; color: var(--app-text-strong); margin-right: 0.5rem; }
  .record-title { color: var(--app-muted); }
  .record-body { padding: 0 1rem 1rem; font-size: 0.88rem; line-height: 1.6; }

  .record-facts { display: grid; gap: 0.6rem; margin: 1rem 0; }
  .record-facts div { display: grid; grid-template-columns: minmax(9rem, 13rem) minmax(0, 1fr); gap: 0.75rem; }
  .record-facts dt { color: var(--app-muted); font-size: 0.78rem; }
  .record-facts dd { margin: 0; }
  .record-facts dd a { margin-left: 0.4rem; }

  .segments { margin: 0.35rem 0 0; padding-left: 1.2rem; }

  .profile { margin-top: 1.25rem; }
  .profile h3 { margin: 0 0 0.5rem; font-size: 0.95rem; color: var(--app-text-strong); }
  .shared {
    padding: 0.5rem 0.75rem;
    background: color-mix(in srgb, var(--app-accent) 7%, var(--app-surface));
    border-left: 3px solid var(--app-accent);
  }

  .channel {
    margin: 0.6rem 0;
    padding: 0.75rem 0.9rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
  }
  .channel h4 { margin: 0 0 0.25rem; font-size: 0.88rem; }
  .channel p { margin: 0.2rem 0; }

  .level { margin-top: 0.45rem; }
  .level blockquote {
    margin: 0.25rem 0 0;
    padding: 0.2rem 0 0.2rem 0.75rem;
    color: var(--app-muted);
    border-left: 2px solid var(--app-border);
    font-size: 0.8rem;
  }

  .channel-list summary { cursor: pointer; color: var(--app-accent); font-size: 0.82rem; }
  .columns { columns: 2 16rem; margin-top: 0.5rem; font-size: 0.78rem; }

  .identifier { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; margin-top: 1rem; font-size: 0.8rem; }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  @media (max-width: 760px) {
    .hero { grid-template-columns: 1fr; }
    .facts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .facts div:nth-child(2) { border-right: 0; }
    .record-facts div { grid-template-columns: 1fr; gap: 0.15rem; }
    .result-count { margin-left: 0; }
  }
</style>
