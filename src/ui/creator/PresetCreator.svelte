<script>
  import {
    AUDIO_WAVEFORMS,
    CONTROL_KINDS,
    LFO_WAVEFORMS,
    STIM_TYPES,
    VISUAL_MOTION,
    VISUAL_SHAPES,
    analyzePatch,
    buildPatchExport,
    createControlTrack,
    createDraft,
    createRoute,
    createStimulationTrack,
    modulationParametersFor,
    patchSummary,
    validateDraft,
  } from './presetDraft.js'

  let draft = $state(createDraft())
  let statusMessage = $state('')

  const summary = $derived(patchSummary(draft))
  const issues = $derived(validateDraft(draft))
  const hasBlockingIssues = $derived(issues.some(issue => issue.level === 'error'))
  const analysis = $derived(analyzePatch(draft))
  const patchExport = $derived(buildPatchExport(draft))
  const jsonPreview = $derived(JSON.stringify(patchExport, null, 2))

  function addControlTrack(kind) {
    draft.controlTracks.push(createControlTrack(kind))
    statusMessage = `${kind} control track added.`
  }

  function removeControlTrack(id) {
    draft.controlTracks = draft.controlTracks.filter(track => track.id !== id)
    draft.routes = draft.routes.filter(route => route.controlId !== id)
    statusMessage = 'Control track removed with its routes.'
  }

  function changeControlKind(id, nextKind) {
    const index = draft.controlTracks.findIndex(track => track.id === id)
    if (index === -1) return

    const previous = draft.controlTracks[index]
    draft.controlTracks[index] = createControlTrack(nextKind, { id, name: previous.name })
    draft.routes = draft.routes.map(route => route.controlId === id ? { ...route, amount: 1 } : route)
    statusMessage = `Control track switched to ${nextKind}.`
  }

  function addStimulationTrack(type) {
    draft.stimulationTracks.push(createStimulationTrack(type))
    statusMessage = `${type} stimulation track added.`
  }

  function removeStimulationTrack(id) {
    draft.stimulationTracks = draft.stimulationTracks.filter(track => track.id !== id)
    draft.routes = draft.routes.filter(route => route.stimulationId !== id)
    statusMessage = 'Stimulation track removed with its routes.'
  }

  function changeStimulationType(id, nextType) {
    const index = draft.stimulationTracks.findIndex(track => track.id === id)
    if (index === -1) return

    const previous = draft.stimulationTracks[index]
    draft.stimulationTracks[index] = createStimulationTrack(nextType, { id, name: previous.name })
    draft.routes = draft.routes.map(route => {
      if (route.stimulationId !== id) return route
      const options = modulationParametersFor(nextType)
      return { ...route, parameter: options[0] }
    })
    statusMessage = `Stimulation track switched to ${nextType}.`
  }

  function addRoute() {
    const controlId = draft.controlTracks[0]?.id ?? ''
    const stimulation = draft.stimulationTracks[0]
    if (!controlId || !stimulation) return

    const parameter = modulationParametersFor(stimulation.type)[0]
    draft.routes.push(createRoute(controlId, stimulation.id, parameter, 1))
    statusMessage = 'Route added.'
  }

  function removeRoute(id) {
    draft.routes = draft.routes.filter(route => route.id !== id)
    statusMessage = 'Route removed.'
  }

  function syncRouteParameter(route) {
    const stimulation = draft.stimulationTracks.find(track => track.id === route.stimulationId)
    if (!stimulation) return

    const allowed = modulationParametersFor(stimulation.type)
    if (!allowed.includes(route.parameter)) {
      route.parameter = allowed[0]
    }
  }

  function resetPatch() {
    draft = createDraft()
    statusMessage = 'Patch reset to Model 1 defaults.'
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(jsonPreview)
      statusMessage = 'Patch JSON copied to the clipboard.'
    } catch {
      statusMessage = 'Clipboard access was not available in this browser context.'
    }
  }

  function downloadJson() {
    const blob = new Blob([jsonPreview], { type: 'application/json' })
    const link = document.createElement('a')
    const objectUrl = URL.createObjectURL(blob)

    link.href = objectUrl
    link.download = `${slugify(draft.patchName)}.json`
    link.click()
    URL.revokeObjectURL(objectUrl)
    statusMessage = 'Patch JSON downloaded.'
  }

  function slugify(value) {
    return `${value ?? 'model-1-patch'}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'model-1-patch'
  }

  function formatAnalysis(details) {
    if (details.type === 'frequency-range') {
      return `${details.minHz} Hz to ${details.maxHz} Hz around ${details.centerHz} Hz`
    }

    if (details.type === 'lfo-depth') {
      return `depth ${details.effectiveDepth} from route amount ${details.amount}`
    }

    if (details.type === 'sequence-values') {
      return `values ${details.scaledValues.join(', ')} every ${details.stepSec}s`
    }

    return JSON.stringify(details)
  }
</script>

<main class="studio-shell">
  <section class="hero panel">
    <div>
      <p class="eyebrow">Sensory Stimulation Interface</p>
      <h1>Patch Studio · Model 1</h1>
      <p class="hero-copy">
        Control tracks generate modulation signals. Stimulation tracks produce audio or visual
        output. Routes plug controls into stimulation parameters, so one slow LFO can sweep a
        400 Hz sine carrier, pulse a circle, or drive both in parallel.
      </p>
    </div>

    <div class="hero-metrics">
      <article>
        <span>Control tracks</span>
        <strong>{summary.controlCount} total · {summary.lfoCount} LFO · {summary.sequenceCount} sequence</strong>
      </article>
      <article>
        <span>Stimulation tracks</span>
        <strong>{summary.stimulationCount} total · {summary.audioCount} audio · {summary.visualCount} visual</strong>
      </article>
      <article>
        <span>Routes</span>
        <strong>{summary.routeCount}</strong>
      </article>
    </div>
  </section>

  <section class="workspace">
    <div class="editor-column">
      <section class="panel section-card">
        <div class="section-head">
          <div>
            <p class="section-kicker">Patch frame</p>
            <h2>Session shell</h2>
          </div>
          <button type="button" class="secondary outline" onclick={resetPatch}>Reset patch</button>
        </div>

        <div class="field-grid field-grid--shell">
          <label>
            Patch name
            <input bind:value={draft.patchName} placeholder="Model 1 Patch" />
          </label>

          <label>
            BPM
            <input type="number" min="1" step="1" bind:value={draft.bpm} />
          </label>

          <label>
            Length in seconds
            <input type="number" min="1" step="1" bind:value={draft.lengthSec} />
          </label>

          <label class="field-span-3">
            Notes
            <textarea bind:value={draft.notes} rows="3" placeholder="Describe how the control tracks are meant to shape the stimulation layer."></textarea>
          </label>
        </div>
      </section>

      <section class="panel section-card">
        <div class="section-head section-head--stack">
          <div>
            <p class="section-kicker">Control tracks</p>
            <h2>Modulators</h2>
          </div>

          <div class="track-actions">
            {#each CONTROL_KINDS as kind}
              <button type="button" class="secondary outline" onclick={() => addControlTrack(kind)}>Add {kind}</button>
            {/each}
          </div>
        </div>

        <div class="track-grid">
          {#each draft.controlTracks as track, index (track.id)}
            <article class="track-card">
              <header>
                <div>
                  <p>Control {index + 1}</p>
                  <h3>{track.name}</h3>
                </div>
                <button type="button" class="secondary outline ghost" onclick={() => removeControlTrack(track.id)} disabled={draft.controlTracks.length <= 1}>Remove</button>
              </header>

              <div class="field-grid field-grid--track">
                <label>
                  Name
                  <input bind:value={track.name} />
                </label>

                <label>
                  Kind
                  <select value={track.kind} onchange={(event) => changeControlKind(track.id, event.currentTarget.value)}>
                    {#each CONTROL_KINDS as kind}
                      <option value={kind}>{kind}</option>
                    {/each}
                  </select>
                </label>

                {#if track.kind === 'LFO'}
                  <label>
                    Waveform
                    <select bind:value={track.waveform}>
                      {#each LFO_WAVEFORMS as waveform}
                        <option value={waveform}>{waveform}</option>
                      {/each}
                    </select>
                  </label>

                  <label>
                    Rate Hz
                    <input type="number" min="0.001" step="0.001" bind:value={track.rateHz} />
                  </label>

                  <label>
                    Depth
                    <input type="number" step="0.1" bind:value={track.depth} />
                  </label>

                  <label>
                    Offset
                    <input type="number" step="0.1" bind:value={track.offset} />
                  </label>

                  <label>
                    Phase deg
                    <input type="number" step="1" bind:value={track.phaseDeg} />
                  </label>
                {:else}
                  <label class="field-span-2">
                    Sequence values
                    <textarea bind:value={track.valuesText} rows="2" placeholder="0, 4, 7, 12"></textarea>
                  </label>

                  <label>
                    Step sec
                    <input type="number" min="0.01" step="0.01" bind:value={track.stepSec} />
                  </label>

                  <label>
                    Interpolation
                    <select bind:value={track.interpolation}>
                      <option value="hold">hold</option>
                      <option value="linear">linear</option>
                    </select>
                  </label>
                {/if}
              </div>
            </article>
          {/each}
        </div>
      </section>

      <section class="panel section-card">
        <div class="section-head section-head--stack">
          <div>
            <p class="section-kicker">Stimulation tracks</p>
            <h2>Outputs</h2>
          </div>

          <div class="track-actions">
            {#each STIM_TYPES as type}
              <button type="button" class="secondary outline" onclick={() => addStimulationTrack(type)}>
                Add {type}
              </button>
            {/each}
          </div>
        </div>

        <div class="track-grid">
          {#each draft.stimulationTracks as track, index (track.id)}
            <article class="track-card">
              <header>
                <div>
                  <p>Output {index + 1}</p>
                  <h3>{track.name}</h3>
                </div>
                <button type="button" class="secondary outline ghost" onclick={() => removeStimulationTrack(track.id)} disabled={draft.stimulationTracks.length <= 1}>Remove</button>
              </header>

              <div class="field-grid field-grid--track">
                <label>
                  Name
                  <input bind:value={track.name} />
                </label>

                <label>
                  Type
                  <select value={track.type} onchange={(event) => changeStimulationType(track.id, event.currentTarget.value)}>
                    {#each STIM_TYPES as type}
                      <option value={type}>{type}</option>
                    {/each}
                  </select>
                </label>

                {#if track.type === 'audio'}
                  <label>
                    Waveform
                    <select bind:value={track.waveform}>
                      {#each AUDIO_WAVEFORMS as waveform}
                        <option value={waveform}>{waveform}</option>
                      {/each}
                    </select>
                  </label>

                  <label>
                    Base frequency
                    <input type="number" min="1" step="1" bind:value={track.baseFrequency} />
                  </label>

                  <label>
                    Amplitude
                    <input type="number" min="0" max="1" step="0.01" bind:value={track.amplitude} />
                  </label>

                  <label>
                    Pan
                    <input type="number" min="-1" max="1" step="0.01" bind:value={track.pan} />
                  </label>

                  <label>
                    Phase
                    <input type="number" step="1" bind:value={track.phase} />
                  </label>
                {:else}
                  <label>
                    Shape
                    <select bind:value={track.shape}>
                      {#each VISUAL_SHAPES as shape}
                        <option value={shape}>{shape}</option>
                      {/each}
                    </select>
                  </label>

                  <label>
                    Color
                    <input bind:value={track.color} placeholder="#88c9ff" />
                  </label>

                  <label>
                    Motion
                    <select bind:value={track.motion}>
                      {#each VISUAL_MOTION as motion}
                        <option value={motion}>{motion}</option>
                      {/each}
                    </select>
                  </label>

                  <label>
                    Size
                    <input type="number" min="1" step="1" bind:value={track.size} />
                  </label>

                  <label>
                    Speed
                    <input type="number" min="0" step="0.1" bind:value={track.speed} />
                  </label>

                  <label>
                    Opacity
                    <input type="number" min="0" max="1" step="0.01" bind:value={track.opacity} />
                  </label>

                  <label>
                    X
                    <input type="number" step="1" bind:value={track.x} />
                  </label>

                  <label>
                    Y
                    <input type="number" step="1" bind:value={track.y} />
                  </label>
                {/if}
              </div>
            </article>
          {/each}
        </div>
      </section>

      <section class="panel section-card">
        <div class="section-head section-head--stack">
          <div>
            <p class="section-kicker">Routing matrix</p>
            <h2>Patch cords</h2>
          </div>

          <div class="track-actions">
            <button type="button" class="secondary outline" onclick={addRoute}>Add route</button>
          </div>
        </div>

        <div class="route-grid">
          {#each draft.routes as route, index (route.id)}
            <article class="route-card">
              <header>
                <div>
                  <p>Route {index + 1}</p>
                  <h3>Control to stimulation</h3>
                </div>
                <button type="button" class="secondary outline ghost" onclick={() => removeRoute(route.id)}>Remove</button>
              </header>

              <div class="field-grid field-grid--route">
                <label>
                  Source control
                  <select bind:value={route.controlId}>
                    {#each draft.controlTracks as track}
                      <option value={track.id}>{track.name}</option>
                    {/each}
                  </select>
                </label>

                <label>
                  Target track
                  <select bind:value={route.stimulationId} onchange={() => syncRouteParameter(route)}>
                    {#each draft.stimulationTracks as track}
                      <option value={track.id}>{track.name}</option>
                    {/each}
                  </select>
                </label>

                <label>
                  Parameter
                  <select bind:value={route.parameter}>
                    {#each modulationParametersFor(draft.stimulationTracks.find(track => track.id === route.stimulationId)?.type ?? 'audio') as parameter}
                      <option value={parameter}>{parameter}</option>
                    {/each}
                  </select>
                </label>

                <label>
                  Amount
                  <input type="number" step="0.1" bind:value={route.amount} />
                </label>
              </div>
            </article>
          {/each}
        </div>
      </section>
    </div>

    <aside class="preview-column">
      <section class="panel section-card sticky-card">
        <div class="section-head">
          <div>
            <p class="section-kicker">Validation</p>
            <h2>Patch status</h2>
          </div>
          <span class:status-pill={true} class:error={hasBlockingIssues} class:ok={!hasBlockingIssues}>
            {hasBlockingIssues ? 'Needs fixes' : 'Patchable'}
          </span>
        </div>

        <p class="status-copy">
          {draft.patchName} · {summary.routeCount} routes across {summary.stimulationCount} outputs
        </p>

        <ul class="issue-list">
          {#each issues as issue}
            <li class:warning={issue.level === 'warning'}>{issue.message}</li>
          {:else}
            <li class="ok-item">No blocking issues. This patch graph is ready to export as JSON.</li>
          {/each}
        </ul>

        <div class="action-row">
          <button type="button" onclick={copyJson}>Copy JSON</button>
          <button type="button" class="contrast" onclick={downloadJson} disabled={hasBlockingIssues}>Download JSON</button>
        </div>

        <p class="status-note" aria-live="polite">{statusMessage}</p>
      </section>

      <section class="panel section-card">
        <div class="section-head">
          <div>
            <p class="section-kicker">Analysis</p>
            <h2>Route previews</h2>
          </div>
        </div>

        <ul class="analysis-list">
          {#each analysis as line}
            <li>
              <strong>{line.label}</strong>
              <span>{formatAnalysis(line.details)}</span>
            </li>
          {:else}
            <li class="ok-item">Add routes to see estimated modulation ranges.</li>
          {/each}
        </ul>
      </section>

      <section class="panel section-card preview-card">
        <div class="section-head">
          <div>
            <p class="section-kicker">Output</p>
            <h2>Patch JSON</h2>
          </div>
        </div>

        <pre>{jsonPreview}</pre>
      </section>
    </aside>
  </section>
</main>

<style>
  :global(body) {
    background:
      radial-gradient(circle at top left, #f3dcc0 0, #f3dcc000 26rem),
      linear-gradient(180deg, #f7f4ec 0%, #efe8da 100%);
  }

  .studio-shell {
    --studio-ink: #1f2319;
    --studio-muted: #616950;
    --studio-line: #b7b39f;
    --studio-panel: #fcfaf4de;
    --studio-accent: #0f6a66;
    --studio-accent-soft: #d6ebe5;
    --studio-warn: #91531d;
    color: var(--studio-ink);
    padding: 1.2rem;
  }

  .panel {
    border: 1px solid #ffffff70;
    border-radius: 1.3rem;
    background: var(--studio-panel);
    box-shadow: 0 1.2rem 2.5rem #3c2f1614;
    backdrop-filter: blur(14px);
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) minmax(18rem, 1fr);
    gap: 1.25rem;
    padding: 1.5rem;
    margin-bottom: 1rem;
  }

  .eyebrow,
  .section-kicker,
  .track-card header p,
  .route-card header p {
    margin: 0 0 0.35rem;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.68rem;
    color: var(--studio-muted);
  }

  h1,
  h2,
  h3 {
    font-family: 'Avenir Next Condensed', 'Arial Narrow', 'Gill Sans', sans-serif;
    letter-spacing: 0.01em;
  }

  h1 {
    margin: 0;
    font-size: clamp(2.1rem, 4vw, 3.6rem);
    line-height: 0.95;
  }

  .hero-copy,
  .status-copy {
    color: var(--studio-muted);
  }

  .hero-copy {
    max-width: 56rem;
    margin: 0.9rem 0 0;
    line-height: 1.6;
  }

  .hero-metrics {
    display: grid;
    gap: 0.75rem;
  }

  .hero-metrics article {
    padding: 0.95rem 1rem;
    border-radius: 1rem;
    border: 1px solid var(--studio-line);
    background: #fffef8a6;
  }

  .hero-metrics span {
    display: block;
    margin-bottom: 0.25rem;
    font-size: 0.78rem;
    color: var(--studio-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .hero-metrics strong {
    font-size: 1.05rem;
  }

  .workspace {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) minmax(22rem, 0.95fr);
    gap: 1rem;
    align-items: start;
  }

  .editor-column,
  .preview-column {
    display: grid;
    gap: 1rem;
  }

  .section-card {
    padding: 1.2rem;
  }

  .section-head {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .section-head--stack {
    flex-direction: column;
  }

  .section-head h2,
  .track-card h3,
  .route-card h3 {
    margin: 0;
  }

  .field-grid {
    display: grid;
    gap: 0.85rem;
  }

  .field-grid--shell,
  .field-grid--track,
  .field-grid--route {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .field-span-2 {
    grid-column: span 2;
  }

  .field-span-3 {
    grid-column: span 3;
  }

  label {
    margin: 0;
    color: var(--studio-ink);
  }

  input,
  select,
  textarea,
  pre {
    border-color: var(--studio-line);
  }

  textarea {
    min-height: 6.5rem;
  }

  .track-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
  }

  .track-grid,
  .route-grid {
    display: grid;
    gap: 0.9rem;
  }

  .track-card,
  .route-card {
    border: 1px solid var(--studio-line);
    border-radius: 1.05rem;
    background: #fffef8b8;
    padding: 1rem;
  }

  .track-card header,
  .route-card header {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .ghost {
    white-space: nowrap;
  }

  .sticky-card {
    position: sticky;
    top: 1rem;
  }

  .status-pill {
    border-radius: 999px;
    padding: 0.25rem 0.75rem;
    font-size: 0.76rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .status-pill.ok {
    background: var(--studio-accent-soft);
    color: var(--studio-accent);
  }

  .status-pill.error {
    background: #f5e5d4;
    color: #8d3e0c;
  }

  .issue-list {
    margin: 0;
    padding-left: 1.15rem;
    display: grid;
    gap: 0.55rem;
  }

  .issue-list li {
    color: #883409;
  }

  .issue-list li.warning {
    color: var(--studio-warn);
  }

  .issue-list .ok-item {
    color: var(--studio-accent);
  }

  .action-row {
    display: flex;
    gap: 0.65rem;
    margin-top: 1rem;
  }

  .status-note {
    min-height: 1.25rem;
    margin: 0.8rem 0 0;
    color: var(--studio-muted);
  }

  .analysis-list {
    margin: 0;
    padding-left: 1.1rem;
    display: grid;
    gap: 0.75rem;
  }

  .analysis-list li {
    display: grid;
    gap: 0.15rem;
  }

  .analysis-list span {
    color: var(--studio-muted);
  }

  .preview-card pre {
    margin: 0;
    padding: 1rem;
    border-radius: 0.9rem;
    overflow: auto;
    background: #1c221d;
    color: #ebf1eb;
    font-size: 0.78rem;
    line-height: 1.45;
  }

  @media (max-width: 1080px) {
    .workspace,
    .hero {
      grid-template-columns: 1fr;
    }

    .sticky-card {
      position: static;
    }
  }

  @media (max-width: 760px) {
    .studio-shell {
      padding: 0.8rem;
    }

    .field-grid--shell,
    .field-grid--track,
    .field-grid--route {
      grid-template-columns: 1fr;
    }

    .field-span-2,
    .field-span-3 {
      grid-column: auto;
    }

    .action-row,
    .track-actions {
      flex-direction: column;
    }

    .action-row button,
    .track-actions button,
    .section-head button {
      width: 100%;
    }
  }
</style>
