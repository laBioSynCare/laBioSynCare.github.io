<script>
  import { onMount } from 'svelte'
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

  let selectedSkin = $state('midnight')
  let selectedEngine = $state('vanilla')
  let caps = $state({ webAudio: true, audioWorklet: true, wasm: true })
  let visualOn = $state(true)

  onMount(() => {
    selectedSkin = initSkin()
    selectedEngine = initAudioEnginePreference()
    visualOn = initVisualStimulation()
    caps = detectAudioCapabilities()
    const unsubSkin = activeSkin.subscribe((skinId) => { selectedSkin = skinId })
    const unsubEngine = activeAudioEngineId.subscribe((id) => { selectedEngine = id })
    const unsubVisual = visualStimulationOn.subscribe((on) => { visualOn = on })
    return () => { unsubSkin(); unsubEngine(); unsubVisual() }
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
</main>

<style>
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
