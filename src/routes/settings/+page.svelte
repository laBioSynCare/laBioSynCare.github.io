<script>
  import { onMount } from 'svelte'
  // Same value the Nix package pins via BSC_BUILD_VERSION (svelte.config.js),
  // so an export records which build produced it.
  import { version as appVersion } from '$app/environment'
  import { activeSkin, applySkin, initSkin, skins } from '../../ui/theme/skins.js'
  import {
    activeAudioEngineId,
    applyAudioEngine,
    audioEngines,
    detectAudioCapabilities,
    initAudioEnginePreference,
    isAudioEngineSupported,
  } from '../../engines/audio/audioEngines.js'
  import {
    advisoryOpen,
    applyVisualStimulation,
    initVisualStimulation,
    resetPhotoAdvisory,
    visualStimulationOn,
  } from '../../ui/safety/visualSafety.js'
  import { authState } from '../../firebase/auth.js'
  import { getRuntimeConfig, getRuntimeConfigProblems } from '../../config/runtimeConfig.js'
  import {
    applyInstanceExport,
    buildInstanceExport,
    collectInstanceData,
    instanceExportFilename,
    parseInstanceExport,
    summarizeInstanceExport,
  } from '../../portability/instanceExport.js'

  let selectedSkin = $state('midnight')
  let selectedEngine = $state('vanilla')
  let caps = $state({ webAudio: true, audioWorklet: true, wasm: true })
  let visualOn = $state(true)

  // ── Instance export / import ────────────────────────────────────────────────
  // Works with no Firebase configured: everything portable lives in
  // localStorage. See docs/technical/PORTABLE_DEPLOYMENT.md (gap G7).
  let auth = $state({ ready: false, configured: false, user: null })
  let dataSummary = $state(null)
  let dataNote = $state('')
  let importInput = $state(null)
  let pendingImport = $state(null)

  // ── This deployment ─────────────────────────────────────────────────────────
  // Read after mount, because the root layout fetches runtime-config.json in the
  // browser only — during prerender there is nothing to report.
  let deployment = $state(getRuntimeConfig())
  let deploymentProblems = $state([])

  const currentUid = $derived(auth.user?.uid ?? null)

  function refreshSummary() {
    if (typeof localStorage === 'undefined') return
    dataSummary = summarizeInstanceExport(collectInstanceData(localStorage, { uid: currentUid }))
  }

  async function exportInstance() {
    try {
      const envelope = await buildInstanceExport(localStorage, {
        uid: currentUid,
        appVersion,
      })
      const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = instanceExportFilename()
      a.click()
      URL.revokeObjectURL(url)
      dataNote = 'Exported.'
    } catch (e) {
      dataNote = `Export failed: ${e.message}`
    }
  }

  async function stageImport(event) {
    const input = event.currentTarget
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    try {
      const parsed = await parseInstanceExport(await file.text())
      // Verified but not applied: importing replaces a person's own notes, so
      // it asks first and says exactly what would land.
      pendingImport = { parsed, summary: summarizeInstanceExport(parsed.payload) }
      dataNote = ''
    } catch (e) {
      pendingImport = null
      dataNote = `Import failed: ${e.message}`
    }
  }

  function confirmImport() {
    try {
      const result = applyInstanceExport(localStorage, pendingImport.parsed, { uid: currentUid })
      pendingImport = null
      refreshSummary()
      dataNote = `Restored ${result.restoredLogbooks} logbook${result.restoredLogbooks === 1 ? '' : 's'}`
        + (result.restoredAnnotations ? `, ${result.restoredAnnotations} annotation${result.restoredAnnotations === 1 ? '' : 's'}` : '')
        + (result.restoredPatches ? ` and ${result.restoredPatches} patch${result.restoredPatches === 1 ? '' : 'es'}` : '')
        + '. Reload the page to see them.'
    } catch (e) {
      dataNote = `Import failed: ${e.message}`
    }
  }

  onMount(() => {
    selectedSkin = initSkin()
    selectedEngine = initAudioEnginePreference()
    visualOn = initVisualStimulation()
    caps = detectAudioCapabilities()
    const unsubSkin = activeSkin.subscribe((skinId) => { selectedSkin = skinId })
    const unsubEngine = activeAudioEngineId.subscribe((id) => { selectedEngine = id })
    const unsubVisual = visualStimulationOn.subscribe((on) => { visualOn = on })
    // Auth only decides which logbook scope is in play; export works signed out.
    const unsubAuth = authState.subscribe((value) => { auth = value; refreshSummary() })
    deployment = getRuntimeConfig()
    deploymentProblems = getRuntimeConfigProblems()
    refreshSummary()
    return () => { unsubSkin(); unsubEngine(); unsubVisual(); unsubAuth() }
  })

  function selectSkin(id) {
    selectedSkin = applySkin(id)
  }

  function selectEngine(id) {
    selectedEngine = applyAudioEngine(id)
  }

  function setVisual(on) {
    visualOn = applyVisualStimulation(on)
  }

  function reviewAdvisory() {
    resetPhotoAdvisory()
    advisoryOpen.set(true)
  }
</script>

<svelte:head>
  <title>Settings | BSC Lab</title>
</svelte:head>

<main class="settings-page">
  <header class="settings-header">
    <div>
      <p class="eyebrow">Interface</p>
      <h1>Settings</h1>
    </div>
    <a class="back-link" href="/graph/">Graph</a>
  </header>

  <section class="settings-section" aria-labelledby="skin-heading">
    <div class="section-copy">
      <h2 id="skin-heading">Skin</h2>
      <p>Choose the working palette used by the graph browser, patch studio, and navigation surfaces.</p>
    </div>

    <div class="skin-grid">
      {#each skins as skin}
        <label class="skin-card" class:active={selectedSkin === skin.id}>
          <input
            type="radio"
            name="skin"
            value={skin.id}
            checked={selectedSkin === skin.id}
            onchange={() => selectSkin(skin.id)}
          />
          <span class="skin-card-head">
            <span>
              <strong>{skin.name}</strong>
              <small>{skin.description}</small>
            </span>
            <span class="selected-mark">{selectedSkin === skin.id ? 'Selected' : 'Select'}</span>
          </span>
          <span class="swatches" aria-hidden="true">
            {#each skin.swatches as color}
              <span style={`background:${color}`}></span>
            {/each}
          </span>
          <span class="skin-meta">
            <span>Font: {skin.font}</span>
            <span>Border: {skin.border}</span>
          </span>
        </label>
      {/each}
    </div>
  </section>

  <section class="settings-section" aria-labelledby="engine-heading">
    <div class="section-copy">
      <h2 id="engine-heading">Audio engine</h2>
      <p>Choose how the Patch Studio synthesises sound. All engines produce the same voices; they differ in where and how the signal is generated. The selection applies the next time you start playback.</p>
      {#if !caps.audioWorklet}
        <p class="cap-note">This browser does not expose AudioWorklet, so the audio-thread engines are unavailable.</p>
      {/if}
    </div>

    <div class="engine-grid" role="radiogroup" aria-label="Audio engine">
      {#each audioEngines as engine}
        {@const supported = isAudioEngineSupported(engine, caps)}
        {@const active = selectedEngine === engine.id}
        <button
          type="button"
          class="engine-card"
          class:active={active}
          role="radio"
          aria-checked={active}
          disabled={!supported}
          title={supported ? '' : 'Not available on this browser'}
          onclick={() => supported && selectEngine(engine.id)}
        >
          <span class="engine-head">
            <span class="engine-name">{engine.name}</span>
            <span class="engine-mark">
              {#if !supported}Unavailable{:else if active}Selected{:else}Select{/if}
            </span>
          </span>
          <span class="engine-tagline">{engine.tagline}</span>
          <span class="engine-desc">{engine.description}</span>
        </button>
      {/each}
    </div>
  </section>

  <section class="settings-section" aria-labelledby="visual-heading">
    <div class="section-copy">
      <h2 id="visual-heading">Visual stimulation</h2>
      <p>Some visual tracks flash, flicker, or move. If you are sensitive to flashing light, you can turn all visual stimulation off — previews and visual output stay hidden everywhere on the platform.</p>
      <button type="button" class="review-link" onclick={reviewAdvisory}>Review the photosensitivity notice</button>
    </div>

    <div class="engine-grid" role="radiogroup" aria-label="Visual stimulation">
      <button
        type="button"
        class="engine-card"
        class:active={visualOn}
        role="radio"
        aria-checked={visualOn}
        onclick={() => setVisual(true)}
      >
        <span class="engine-head">
          <span class="engine-name">Enabled</span>
          <span class="engine-mark">{visualOn ? 'Selected' : 'Select'}</span>
        </span>
        <span class="engine-tagline">Visuals render</span>
        <span class="engine-desc">Animated and flashing visual previews and output are shown.</span>
      </button>
      <button
        type="button"
        class="engine-card"
        class:active={!visualOn}
        role="radio"
        aria-checked={!visualOn}
        onclick={() => setVisual(false)}
      >
        <span class="engine-head">
          <span class="engine-name">Disabled</span>
          <span class="engine-mark">{!visualOn ? 'Selected' : 'Select'}</span>
        </span>
        <span class="engine-tagline">No visual stimulation</span>
        <span class="engine-desc">All flashing and moving visuals are suppressed; audio and editing are unaffected.</span>
      </button>
    </div>
  </section>

  <section class="settings-section" aria-labelledby="data-heading">
    <div class="section-copy">
      <h2 id="data-heading">Your data</h2>
      <p>
        Everything BSC Lab keeps about you on this device — your logbooks, their entries, and
        your annotations, and your appearance preference — travels in one file. Take it to another BSC Lab instance,
        including one you host yourself, or keep it as a backup. No account is required and
        nothing is uploaded.
      </p>
      <p class="data-privacy">
        The file contains your own written notes. It carries no sign-in identifier, so it is
        safe to move between accounts — but treat it as personal, because it is.
      </p>
    </div>

    <div class="data-panel">
      {#if dataSummary}
        <p class="data-summary">
          {dataSummary.logbooks} logbook{dataSummary.logbooks === 1 ? '' : 's'} ·
          {dataSummary.entries} entr{dataSummary.entries === 1 ? 'y' : 'ies'}
          {#if dataSummary.annotations > 0}· {dataSummary.annotations} annotation{dataSummary.annotations === 1 ? '' : 's'}{/if}
          {#if dataSummary.patches > 0}· {dataSummary.patches} patch{dataSummary.patches === 1 ? '' : 'es'}{/if}
          {#if dataSummary.legacyEntries > 0}· {dataSummary.legacyEntries} unmigrated{/if}
        </p>
      {/if}

      <div class="data-actions">
        <button type="button" class="data-btn" onclick={exportInstance}>Export my data</button>
        <button type="button" class="data-btn" onclick={() => importInput?.click()}>Import a file</button>
        <input
          bind:this={importInput}
          type="file"
          accept="application/json,.json"
          onchange={stageImport}
          hidden
        />
      </div>

      {#if pendingImport}
        <div class="data-confirm" role="alertdialog" aria-labelledby="import-confirm-heading">
          <p id="import-confirm-heading"><strong>Replace your data with this file?</strong></p>
          <p>
            It holds {pendingImport.summary.logbooks} logbook{pendingImport.summary.logbooks === 1 ? '' : 's'},
            {pendingImport.summary.entries} entr{pendingImport.summary.entries === 1 ? 'y' : 'ies'}
            {pendingImport.summary.annotations} annotation{pendingImport.summary.annotations === 1 ? '' : 's'}
            and {pendingImport.summary.patches} patch{pendingImport.summary.patches === 1 ? '' : 'es'}.
            Logbooks with the same storage scope will be overwritten. This cannot be undone —
            export first if you want to keep what is here.
          </p>
          <div class="data-actions">
            <button type="button" class="data-btn data-btn-danger" onclick={confirmImport}>Replace</button>
            <button type="button" class="data-btn" onclick={() => { pendingImport = null }}>Cancel</button>
          </div>
        </div>
      {/if}

      {#if dataNote}<p class="data-note">{dataNote}</p>{/if}
    </div>
  </section>

  <section class="settings-section" aria-labelledby="deployment-heading">
    <div class="section-copy">
      <h2 id="deployment-heading">This instance</h2>
      <p>
        Which build you are running and how this deployment is configured. BSC Lab ships as one
        immutable package that anyone can host; everything below is chosen by whoever deployed it,
        not compiled in.
      </p>
    </div>

    <div class="data-panel">
      <dl class="deployment-facts">
        <dt>Instance</dt>
        <dd>
          {deployment.instance.name}
          {#if deployment.instance.id}<br /><code>{deployment.instance.id}</code>{/if}
        </dd>

        <dt>Sign-in</dt>
        <dd>{deployment.identity.provider === 'firebase' ? 'Accounts available' : 'This device only'}</dd>

        <dt>Storage</dt>
        <dd>{deployment.storage.provider === 'firestore' ? 'This device, and your account when signed in' : 'This device'}</dd>

        <dt>Build</dt>
        <dd><code>{appVersion}</code></dd>
      </dl>

      {#if deploymentProblems.length > 0}
        <div class="deployment-problems" role="status">
          <p>
            <strong>This instance's configuration was not fully applied.</strong>
            BSC Lab fell back to safe defaults and kept running. Whoever hosts it may want to know:
          </p>
          <ul>
            {#each deploymentProblems as problem (problem)}<li>{problem}</li>{/each}
          </ul>
        </div>
      {/if}
    </div>
  </section>
</main>

<style>
  .deployment-facts {
    display: grid;
    grid-template-columns: minmax(6rem, auto) 1fr;
    gap: 0.5rem 1rem;
    margin: 0;
    font-size: 0.9rem;
  }

  .deployment-facts dt {
    font-weight: 600;
    opacity: 0.7;
  }

  .deployment-facts dd {
    margin: 0;
  }

  .deployment-facts code {
    font-size: 0.85em;
    overflow-wrap: anywhere;
  }

  .deployment-problems {
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    border: 1px solid color-mix(in srgb, var(--app-accent) 40%, transparent);
    background: color-mix(in srgb, var(--app-accent) 8%, transparent);
    font-size: 0.85rem;
  }

  .deployment-problems ul {
    margin: 0.5rem 0 0;
    padding-left: 1.25rem;
  }

  .settings-page {
    min-height: calc(100vh - 56px);
    padding: 2rem clamp(1rem, 3vw, 2.5rem);
    background:
      radial-gradient(circle at 15% 0%, color-mix(in srgb, var(--app-accent) 16%, transparent), transparent 32rem),
      var(--app-bg);
    color: var(--app-text);
  }

  .settings-header {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
    max-width: 72rem;
    margin: 0 auto 1.75rem;
  }

  .eyebrow {
    margin: 0 0 0.25rem;
    color: var(--app-accent);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    font-size: clamp(1.8rem, 4vw, 3rem);
    line-height: 1;
  }

  .back-link {
    color: var(--app-muted);
    text-decoration: none;
    font-weight: 600;
  }
  .back-link:hover { color: var(--app-text-strong); }

  .settings-section {
    max-width: 72rem;
    margin: 0 auto;
    display: grid;
    grid-template-columns: minmax(14rem, 22rem) 1fr;
    gap: 1rem;
    align-items: start;
  }

  .section-copy {
    padding: 0.5rem 0;
  }

  h2 {
    margin: 0 0 0.5rem;
    font-size: 1.05rem;
  }

  .section-copy p {
    margin: 0;
    color: var(--app-muted);
    line-height: 1.5;
  }

  .skin-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(13.5rem, 1fr));
    gap: 0.75rem;
  }

  .skin-card {
    min-height: 15.5rem;
    margin: 0;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 1rem;
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) + 2px);
    color: var(--app-text);
    cursor: pointer;
    transition: border-color 0.14s, background 0.14s, transform 0.14s;
  }

  .skin-card:hover,
  .skin-card.active {
    border-color: var(--app-accent);
    background: color-mix(in srgb, var(--app-surface-2) 86%, var(--app-accent) 14%);
  }

  .skin-card:hover {
    transform: translateY(-1px);
  }

  .skin-card input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .skin-card-head {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .skin-card strong {
    display: block;
    margin-bottom: 0.4rem;
    color: var(--app-text-strong);
    font-size: 1rem;
  }

  .skin-card small {
    display: block;
    color: var(--app-muted);
    line-height: 1.35;
  }

  .selected-mark {
    flex-shrink: 0;
    padding: 0.22rem 0.45rem;
    border: 1px solid var(--app-border);
    border-radius: 999px;
    color: var(--app-muted);
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .skin-card.active .selected-mark {
    border-color: var(--app-accent);
    color: var(--app-accent);
    background: var(--app-accent-soft);
  }

  .swatches {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    height: 4.5rem;
    overflow: hidden;
    border-radius: var(--app-radius);
    border: 1px solid var(--app-border);
  }

  .swatches span {
    min-width: 0;
  }

  .skin-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .skin-meta span {
    padding: 0.25rem 0.45rem;
    background: var(--app-bg);
    border: 1px solid var(--app-border);
    border-radius: var(--app-radius);
    color: var(--app-muted);
    font-size: 0.72rem;
  }

  .cap-note {
    margin: 0.75rem 0 0;
    color: var(--app-warn);
    font-size: 0.82rem;
    line-height: 1.5;
  }

  .review-link {
    margin: 0.75rem 0 0;
    padding: 0;
    background: none;
    border: none;
    color: var(--app-accent);
    font-size: 0.82rem;
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
  }
  .review-link:hover { color: var(--app-text-strong); }

  .data-privacy {
    margin-top: 0.6rem;
    font-size: 0.82rem;
    opacity: 0.78;
  }

  .data-panel {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .data-summary {
    margin: 0;
    font-size: 0.85rem;
    opacity: 0.8;
  }

  .data-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  .data-btn {
    padding: 0.55rem 1rem;
    border: 1px solid color-mix(in srgb, var(--app-text) 22%, transparent);
    border-radius: 0.6rem;
    background: color-mix(in srgb, var(--app-text) 6%, transparent);
    color: var(--app-text);
    font-size: 0.86rem;
    font-weight: 600;
    cursor: pointer;
  }

  .data-btn:hover {
    border-color: var(--app-accent);
    color: var(--app-text-strong);
  }

  .data-btn-danger {
    border-color: color-mix(in srgb, #e0554b 55%, transparent);
    color: #e0554b;
  }

  .data-confirm {
    padding: 0.9rem 1rem;
    border: 1px solid color-mix(in srgb, #e0554b 45%, transparent);
    border-radius: 0.7rem;
    background: color-mix(in srgb, #e0554b 8%, transparent);
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    font-size: 0.85rem;
  }

  .data-confirm p { margin: 0; }

  .data-note {
    margin: 0;
    font-size: 0.84rem;
    color: var(--app-accent);
  }

  .settings-section + .settings-section {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--app-border);
  }

  .engine-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(13.5rem, 1fr));
    gap: 0.75rem;
  }

  .engine-card {
    margin: 0;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-align: left;
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) + 2px);
    color: var(--app-text);
    cursor: pointer;
    transition: border-color 0.14s, background 0.14s, transform 0.14s;
  }

  .engine-card:hover:not(:disabled),
  .engine-card.active {
    border-color: var(--app-accent);
    background: color-mix(in srgb, var(--app-surface-2) 86%, var(--app-accent) 14%);
  }

  .engine-card:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .engine-card:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .engine-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .engine-name {
    font-weight: 700;
    font-size: 1rem;
    color: var(--app-text-strong);
  }

  .engine-mark {
    flex-shrink: 0;
    padding: 0.22rem 0.45rem;
    border: 1px solid var(--app-border);
    border-radius: 999px;
    color: var(--app-muted);
    font-size: 0.62rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .engine-card.active .engine-mark {
    border-color: var(--app-accent);
    color: var(--app-accent);
    background: var(--app-accent-soft);
  }

  .engine-tagline {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--app-accent);
  }

  .engine-desc {
    color: var(--app-muted);
    font-size: 0.84rem;
    line-height: 1.45;
  }

  @media (max-width: 880px) {
    .settings-section {
      grid-template-columns: 1fr;
    }

    .skin-grid,
    .engine-grid {
      grid-template-columns: 1fr;
    }

    .settings-header {
      align-items: flex-start;
      flex-direction: column;
    }
  }
</style>
