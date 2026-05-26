<script>
  import { onMount } from 'svelte'
  import { activeSkin, applySkin, initSkin, skins } from '../../ui/theme/skins.js'

  let selectedSkin = $state('midnight')

  onMount(() => {
    selectedSkin = initSkin()
    return activeSkin.subscribe((skinId) => {
      selectedSkin = skinId
    })
  })

  function selectSkin(id) {
    selectedSkin = applySkin(id)
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
    <a class="back-link" href="/">Graph</a>
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

  @media (max-width: 880px) {
    .settings-section {
      grid-template-columns: 1fr;
    }

    .skin-grid {
      grid-template-columns: 1fr;
    }

    .settings-header {
      align-items: flex-start;
      flex-direction: column;
    }
  }
</style>
