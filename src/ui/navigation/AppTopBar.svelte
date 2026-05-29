<script>
  import { onMount } from 'svelte'
  import ProfileControl from './ProfileControl.svelte'
  import { graphNavigation } from './graphNavigation.js'

  let searchInput = $state(null)
  let helpOpen = $state(false)

  const SHORTCUTS = [
    { keys: ['/'], desc: 'Focus the search field' },
    { keys: ['Enter'], desc: 'Center on matched node (while typing in search)' },
    { keys: ['Esc'], desc: 'Clear selection · blur search · close this dialog' },
    { keys: ['c'], desc: 'Center on the current selection' },
    { keys: ['f'], desc: 'Fit the visible graph to the viewport' },
    { keys: ['r'], desc: 'Re-run the graph layout' },
    { keys: ['h', '?'], desc: 'Toggle this help' },
  ]

  function isTypingTarget(node) {
    if (!node) return false
    if (node.isContentEditable) return true
    return ['INPUT', 'TEXTAREA', 'SELECT'].includes(node.tagName)
  }

  function toggleHelp() {
    helpOpen = !helpOpen
  }

  function closeHelp() {
    helpOpen = false
  }

  function handleWindowKeydown(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return

    if (event.key === 'Escape' && helpOpen) {
      event.preventDefault()
      event.stopImmediatePropagation()
      helpOpen = false
      return
    }

    if (event.key === '?' || event.key === 'h' || event.key === 'H') {
      if (isTypingTarget(document.activeElement)) return
      event.preventDefault()
      helpOpen = !helpOpen
      return
    }

    if (event.key === '/') {
      if (isTypingTarget(document.activeElement)) return
      if (!searchInput) return
      event.preventDefault()
      searchInput.focus()
      searchInput.select?.()
    }
  }

  function handleSearchKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      $graphNavigation.center?.()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleWindowKeydown)
    return () => window.removeEventListener('keydown', handleWindowKeydown)
  })
</script>

<header class="app-topbar">
  <div class="topbar-main">
    {#if $graphNavigation.available}
      <select
        class="topbar-control scope-field"
        aria-label="Scope"
        value={$graphNavigation.scope}
        onchange={(event) => $graphNavigation.setScope(event.currentTarget.value)}
      >
        {#each $graphNavigation.scopes as scope}
          <option value={scope.value}>{scope.label}</option>
        {/each}
      </select>

      <input
        class="topbar-control focus-field"
        aria-label="Focus node"
        list="app-focus-node-options"
        value={$graphNavigation.focusNodeQuery}
        placeholder="Search node  ( / )"
        title="Search node — press / to focus, Enter to center, Esc to blur"
        bind:this={searchInput}
        oninput={(event) => $graphNavigation.setFocusNodeQuery(event.currentTarget.value)}
        onkeydown={handleSearchKeydown}
      />
      <datalist id="app-focus-node-options">
        {#each $graphNavigation.focusNodeOptions as option}
          <option value={option.value}></option>
        {/each}
      </datalist>

      <div class="topbar-actions">
        <button type="button" class="topbar-control secondary" title="Center on selected node (c)" onclick={$graphNavigation.center} disabled={!$graphNavigation.canCenter}>
          Center
        </button>
        <button type="button" class="topbar-control secondary outline" title="Fit visible graph (f)" onclick={$graphNavigation.fit}>
          Fit
        </button>
        <button type="button" class="topbar-control secondary outline" title="Run layout again (r)" onclick={$graphNavigation.relayout}>
          Relayout
        </button>
      </div>
    {:else}
      <a class="brand" href="/">BSC Lab</a>
    {/if}
  </div>

  <button
    type="button"
    class="help-toggle"
    aria-label="Show keyboard shortcuts"
    aria-expanded={helpOpen}
    title="Keyboard shortcuts (h)"
    onclick={toggleHelp}
  >?</button>

  <details class="global-menu">
    <summary aria-label="Open navigation menu">+</summary>
    <div class="global-menu-panel">
      <a href="/">Graph</a>
      <a href="/creator/">Patch Studio</a>
      <a href="/presets/">Presets</a>
      <a href="/sparql/">SPARQL</a>
      <a href="/logbook/">Logbook</a>
      <a href="/settings/">Settings</a>
      <ProfileControl />
    </div>
  </details>
</header>

{#if helpOpen}
  <div
    class="help-overlay"
    role="presentation"
    onclick={(event) => { if (event.target === event.currentTarget) closeHelp() }}
  >
    <div class="help-card" role="dialog" aria-label="Keyboard shortcuts" aria-modal="true">
      <header class="help-header">
        <h3>Keyboard shortcuts</h3>
        <button type="button" class="help-close" aria-label="Close help" onclick={closeHelp}>✕</button>
      </header>
      <dl class="help-list">
        {#each SHORTCUTS as shortcut}
          <div>
            <dt>
              {#each shortcut.keys as key, i}
                {#if i > 0}<span class="sep">/</span>{/if}
                <kbd>{key}</kbd>
              {/each}
            </dt>
            <dd>{shortcut.desc}</dd>
          </div>
        {/each}
      </dl>
    </div>
  </div>
{/if}

<style>
  .app-topbar {
    height: var(--app-header-height, 56px);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    background: var(--app-surface);
    color: var(--app-text);
    border-bottom: var(--app-border-width) solid var(--app-border);
    font-family: var(--app-font-ui);
  }

  .topbar-main {
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: minmax(160px, 240px) minmax(220px, 1fr) auto;
    align-items: center;
    gap: 0.5rem;
  }

  .brand {
    align-self: center;
    font-weight: 700;
    text-decoration: none;
    color: inherit;
  }

  .topbar-control {
    height: 2.25rem;
    box-sizing: border-box;
    margin: 0;
    padding: 0 0.65rem;
    font-size: 0.8rem;
    line-height: 1.2;
    background: var(--app-surface-2);
    border-color: var(--app-border);
    color: var(--app-text);
    border-radius: var(--app-radius);
  }

  .topbar-control:is(button) {
    white-space: nowrap;
  }

  .topbar-actions {
    display: flex;
    gap: 0.4rem;
    align-items: center;
  }

  .help-toggle {
    width: 2.25rem;
    height: 2.25rem;
    margin: 0;
    padding: 0;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    background: transparent;
    color: var(--app-text);
    font-size: 1.05rem;
    font-weight: 600;
    line-height: 1;
    display: grid;
    place-items: center;
    cursor: pointer;
    flex-shrink: 0;
  }
  .help-toggle:hover { background: var(--app-accent-soft); border-color: var(--app-accent); }

  .help-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: #00000088;
    display: grid;
    place-items: center;
    padding: 1.5rem;
    backdrop-filter: blur(2px);
  }

  .help-card {
    width: min(28rem, 100%);
    padding: 1rem 1.25rem 1.1rem;
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) + 2px);
    box-shadow: 0 1.5rem 3rem #0008;
  }

  .help-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.7rem;
  }

  .help-header h3 {
    margin: 0;
    font-size: 0.95rem;
  }

  .help-close {
    width: 1.7rem;
    height: 1.7rem;
    margin: 0;
    padding: 0;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    background: transparent;
    color: inherit;
    cursor: pointer;
    display: grid;
    place-items: center;
    font-size: 0.85rem;
    line-height: 1;
  }
  .help-close:hover { background: var(--app-accent-soft); border-color: var(--app-accent); }

  .help-list {
    display: grid;
    gap: 0.45rem;
    margin: 0;
  }

  .help-list > div {
    display: grid;
    grid-template-columns: 7rem 1fr;
    gap: 0.65rem;
    align-items: baseline;
    font-size: 0.83rem;
  }

  .help-list dt {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .help-list dd {
    margin: 0;
    color: var(--app-text);
    line-height: 1.4;
  }

  .help-list kbd {
    display: inline-block;
    min-width: 1.4rem;
    padding: 0.14rem 0.5rem;
    font-size: 0.78rem;
    font-weight: 600;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    text-align: center;
    color: var(--app-text-strong);
    background: var(--app-surface-2);
    border: var(--app-border-width) solid var(--app-border);
    border-bottom-width: 2px;
    border-radius: 0.3rem;
    box-shadow: 0 1px 0 #00000050;
  }

  .help-list .sep {
    color: #aaa;
    font-size: 0.78rem;
  }

  .global-menu {
    position: relative;
    flex-shrink: 0;
    margin: 0;
  }

  .global-menu summary {
    display: grid;
    place-items: center;
    width: 2.25rem;
    height: 2.25rem;
    padding: 0;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    background: transparent;
    color: var(--app-accent);
    cursor: pointer;
    font-size: 1.35rem;
    line-height: 1;
    list-style: none;
    list-style-type: none;
  }

  .global-menu summary::marker,
  .global-menu summary::after {
    display: none;
    content: '';
  }

  .global-menu summary::-webkit-details-marker {
    display: none;
  }

  .global-menu-panel {
    position: absolute;
    right: 0;
    z-index: 30;
    width: min(20rem, calc(100vw - 2rem));
    margin-top: 0.5rem;
    padding: 0.7rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    background: var(--app-surface-2);
    box-shadow: 0 0.65rem 1.6rem #0005;
  }

  .global-menu-panel > a {
    display: block;
    padding: 0.4rem 0;
    text-decoration: none;
    color: var(--app-text);
  }

  .global-menu-panel > a:hover {
    color: var(--app-accent);
  }

  @media (max-width: 980px) {
    .app-topbar {
      height: auto;
      min-height: var(--app-header-height, 56px);
      align-items: flex-start;
    }

    .topbar-main {
      grid-template-columns: 1fr;
    }

    .topbar-actions {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>
