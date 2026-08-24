<script>
  import { onMount } from 'svelte'
  import { applicationRoute } from '../../config/applicationUrls.js'
  import ProfileControl from './ProfileControl.svelte'
  import InfoModal from './InfoModal.svelte'
  import { graphNavigation } from './graphNavigation.js'
  import { ONTOLOGY_DOCS_URL, VOCAB_DOCS_URL } from '../externalLinks.js'

  let searchInput = $state(null)
  let helpOpen = $state(false)
  let scopeGuideOpen = $state(false)
  let scopeMenuOpen = $state(false)
  let scopeGroup = $state(null)

  const SHORTCUTS = [
    { keys: ['/'], desc: 'Focus the search field' },
    { keys: ['Enter'], desc: 'Center on matched node (while typing in search)' },
    { keys: ['Esc'], desc: 'Clear selection · blur search · close this dialog' },
    { keys: ['c'], desc: 'Center on the current selection' },
    { keys: ['x'], desc: 'Set the selected node aside (restore it in the left panel)' },
    { keys: ['f'], desc: 'Fit the visible graph to the viewport' },
    { keys: ['r'], desc: 'Re-run the graph layout' },
    { keys: ['h', '?'], desc: 'Toggle this help' },
  ]

  // The scope panel is a popover, so it closes on an outside click or Escape.
  // Pointerdown rather than click: a chip inside the panel re-renders the list,
  // and a click listener would see the reused node as "outside".
  function handleWindowPointerDown(event) {
    if (!scopeMenuOpen || !scopeGroup) return
    if (!scopeGroup.contains(event.target)) scopeMenuOpen = false
  }

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

    if (event.key === 'Escape' && scopeMenuOpen) {
      event.preventDefault()
      event.stopImmediatePropagation()
      scopeMenuOpen = false
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
    window.addEventListener('pointerdown', handleWindowPointerDown)
    return () => {
      window.removeEventListener('keydown', handleWindowKeydown)
      window.removeEventListener('pointerdown', handleWindowPointerDown)
    }
  })
</script>

<header class="app-topbar">
  <div class="topbar-main">
    {#if $graphNavigation.available}
      <div class="scope-group" bind:this={scopeGroup}>
        <button
          type="button"
          class="topbar-control scope-field"
          aria-label="SSTIM subgraph scope"
          aria-expanded={scopeMenuOpen}
          aria-haspopup="dialog"
          title="Choose which part of the SSTIM knowledge graph to show"
          onclick={() => (scopeMenuOpen = !scopeMenuOpen)}
        >
          <span class="scope-summary">{$graphNavigation.scopeSummary}</span>
          {#if $graphNavigation.scopeFilterCount > 0}
            <span class="scope-badge" title="{$graphNavigation.scopeFilterCount} filters active">
              {$graphNavigation.scopeFilterCount}
            </span>
          {/if}
          <span class="scope-caret" aria-hidden="true">▾</span>
        </button>
        <button
          type="button"
          class="scope-info"
          aria-label="About SSTIM subgraph scope"
          aria-expanded={scopeGuideOpen}
          title="What is this? — explains the scope axes"
          onclick={() => (scopeGuideOpen = true)}
        >ⓘ</button>

        {#if scopeMenuOpen}
          <!-- Three axes rather than one flat list: a selection unions within
               an axis and intersects across them. -->
          <div class="scope-panel" role="dialog" aria-label="Graph scope">
            <section class="axis">
              <h4>Layer <small>provenance</small></h4>
              <div class="chips">
                {#each $graphNavigation.layers as layer}
                  <button
                    type="button"
                    class="chip"
                    class:on={$graphNavigation.layerFilters.has(layer.value)}
                    aria-pressed={$graphNavigation.layerFilters.has(layer.value)}
                    title={layer.about}
                    onclick={() => $graphNavigation.toggleLayer(layer.value)}
                  >{layer.label}</button>
                {/each}
              </div>
            </section>

            <section class="axis">
              <h4>Module <small>ADR 0043 · from the manifest</small></h4>
              <div class="chips profiles">
                {#each $graphNavigation.profiles as profile}
                  <button
                    type="button"
                    class="chip profile"
                    class:on={$graphNavigation.activeProfile === profile.value}
                    aria-pressed={$graphNavigation.activeProfile === profile.value}
                    title={profile.value === 'full'
                      ? 'Every loaded module — no module constraint'
                      : `Profile closure: ${profile.modules.join(', ')}`}
                    onclick={() => $graphNavigation.setProfile(profile.value)}
                  >{profile.label}</button>
                {/each}
              </div>
              <label class="axis-toggle">
                <input
                  type="checkbox"
                  checked={$graphNavigation.includeModuleDependencies}
                  onchange={(event) =>
                    $graphNavigation.setIncludeModuleDependencies(event.currentTarget.checked)}
                />
                Include required modules
              </label>
              <div class="chips">
                {#each $graphNavigation.modules as module}
                  {@const count = $graphNavigation.moduleCounts.get(module.value) ?? 0}
                  <!-- A bridge, alignment or shape module owns axioms but no
                       classes or concepts, so its only drawable node is its own
                       module identity. Marked from the manifest roles rather
                       than inferred from the count, which is never 0 for
                       exactly that reason. -->
                  {@const termFree = module.roles.some(
                    (role) => ['bridge', 'alignments', 'validation'].includes(role))}
                  <button
                    type="button"
                    class="chip mono"
                    class:on={$graphNavigation.moduleFilters.has(module.value)}
                    class:empty={termFree}
                    aria-pressed={$graphNavigation.moduleFilters.has(module.value)}
                    title="{module.about}{module.requires.length
                      ? ` — requires ${module.requires.join(', ')}`
                      : ' — no local dependencies'}{termFree
                      ? '. Owns axioms only; its single node is the module identity.'
                      : ''}"
                    onclick={() => $graphNavigation.toggleModule(module.value)}
                  >
                    {module.label}<span class="chip-count">{count}</span>
                  </button>
                {/each}
              </div>
            </section>

            <section class="axis">
              <h4>Concern <small>concept schemes</small></h4>
              <div class="chips">
                {#each $graphNavigation.concerns as concern}
                  <button
                    type="button"
                    class="chip"
                    class:on={$graphNavigation.concernFilters.has(concern.value)}
                    aria-pressed={$graphNavigation.concernFilters.has(concern.value)}
                    title={concern.about}
                    onclick={() => $graphNavigation.toggleConcern(concern.value)}
                  >{concern.label}</button>
                {/each}
              </div>
            </section>

            <footer class="scope-panel-foot">
              <span class="foot-hint">Node types are filtered in the left panel.</span>
              <button
                type="button"
                class="chip reset"
                disabled={$graphNavigation.scopeFilterCount === 0}
                onclick={() => $graphNavigation.resetScope()}
              >Reset</button>
            </footer>
          </div>
        {/if}
      </div>

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
        <select
          class="topbar-control secondary stray-field"
          aria-label="Layout for nodes disconnected from the main cluster"
          title="How to place nodes that aren't connected to the main cluster"
          value={$graphNavigation.strayMode}
          onchange={(event) => $graphNavigation.setStrayMode(event.currentTarget.value)}
        >
          <option value="all">Set aside all disconnected</option>
          <option value="singletons">Set aside singletons only</option>
        </select>
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
      <a class="brand" href={applicationRoute('/')}>SSTIM Workbench</a>
    {/if}
  </div>

  <button
    type="button"
    class="help-toggle"
    aria-label={$graphNavigation.available ? 'Show keyboard shortcuts' : 'Show help'}
    aria-expanded={helpOpen}
    title={$graphNavigation.available ? 'Keyboard shortcuts (h)' : 'Help (h)'}
    onclick={toggleHelp}
  >?</button>

  <details class="global-menu">
    <summary aria-label="Open navigation menu">+</summary>
    <div class="global-menu-panel">
      <a href={applicationRoute('/')}>Home</a>
      <a href={applicationRoute('/graph/')}>Graph</a>
      <a href={applicationRoute('/creator/')}>Patch Studio</a>
      <a href={applicationRoute('/presets/')}>Presets</a>
      <a href={applicationRoute('/sparql/')}>SPARQL</a>
      <a href={applicationRoute('/logbook/')}>Logbook</a>
      <a href={applicationRoute('/settings/')}>Settings</a>
      <a href={applicationRoute('/ecosystem/')}>Ecosystem</a>
      <a href={applicationRoute('/about/')}>About</a>
      <!-- Generated docs (WIDOCO for OWL core, pyLODE for the SKOS vocabulary)
           exist only in the deployed artifact; rel="external" keeps the
           prerender crawler and router away from them -->
      <a href={ONTOLOGY_DOCS_URL} rel="external">Ontology docs</a>
      <a href={VOCAB_DOCS_URL} rel="external">Vocabulary docs</a>
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
    <div
      class="help-card"
      role="dialog"
      aria-label={$graphNavigation.available ? 'Keyboard shortcuts' : 'Help'}
      aria-modal="true"
    >
      <header class="help-header">
        <h3>{$graphNavigation.available ? 'Keyboard shortcuts' : 'Explore'}</h3>
        <button type="button" class="help-close" aria-label="Close help" onclick={closeHelp}>✕</button>
      </header>
      {#if $graphNavigation.available}
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
      {:else}
        <p class="help-fallback">
          Click the tabs below or the buttons on the page to get around — explore at will.
        </p>
      {/if}
    </div>
  </div>
{/if}

<InfoModal
  title="SSTIM subgraph scope"
  subtitle="Every filter is a view over one knowledge graph — the same triples, never a separate dataset. Three axes narrow what the canvas draws: choices union within an axis and intersect across axes."
  open={scopeGuideOpen}
  onClose={() => (scopeGuideOpen = false)}
>
  <dl class="scope-guide">
    <div class="axis-heading"><dt>Layer — where a node comes from</dt></div>
    {#each $graphNavigation.layers as layer}
      <div class:current={$graphNavigation.layerFilters.has(layer.value)}>
        <dt>
          {layer.label}
          {#if $graphNavigation.layerFilters.has(layer.value)}<span class="current-tag">showing</span>{/if}
        </dt>
        <dd>{layer.about}</dd>
      </div>
    {/each}

    <div class="axis-heading"><dt>Module — which module declares the term</dt></div>
    <div>
      <dd>
        The SSTIM suite is split into modules with declared dependencies, and
        four conformance profiles name exact closures over them: Kernel, Core,
        Core Plus and Full (ADR 0043). This axis is generated from the release
        manifest, so it lists exactly the modules the app loads. A term is
        attributed to the module that declares it — a single, unambiguous owner.
        Nodes with no owning module, such as catalog records and live people,
        are governed by the Layer axis instead and pass through this one.
      </dd>
    </div>
    <div>
      <dd>
        "Include required modules" expands a selection to its declared closure.
        A module on its own often has ranges pointing into modules that are not
        drawn; its closure is the unit that stands up. The dimmed modules —
        bridges, alignments and SHACL shapes — own axioms rather than classes or
        concepts, so the only node they contribute is their own module identity.
      </dd>
    </div>

    <div class="axis-heading"><dt>Concern — which part of the domain</dt></div>
    {#each $graphNavigation.concerns as concern}
      <div class:current={$graphNavigation.concernFilters.has(concern.value)}>
        <dt>
          {concern.label}
          {#if $graphNavigation.concernFilters.has(concern.value)}<span class="current-tag">showing</span>{/if}
        </dt>
        <dd>{concern.about}</dd>
      </div>
    {/each}
    <div>
      <dd>
        Concerns match on concept scheme, governing class and asserted facet
        rather than on module, because the controlled vocabulary is still one
        compatibility aggregate spanning every concern. They are the only axis
        that can slice the SKOS terms.
      </dd>
    </div>
  </dl>
</InfoModal>

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
    /* Wide enough for the longest scope label ("Full SSTIM · ontology &
       vocabulary") to read without truncating, including the ⓘ button that
       shares the column with the select. */
    grid-template-columns: minmax(190px, 325px) minmax(190px, 1fr) auto;
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

  /* Scope picker + its "what is this?" affordance travel together. The panel
     is absolutely positioned against this box. */
  .scope-group {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    min-width: 0;
  }

  .scope-group .scope-field {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    border: var(--app-border-width) solid var(--app-border);
    text-align: left;
    cursor: pointer;
  }
  .scope-group .scope-field:hover { border-color: var(--app-accent); }
  .scope-field[aria-expanded='true'] {
    border-color: var(--app-accent);
    background: var(--app-accent-soft);
  }

  .scope-summary {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .scope-badge {
    flex-shrink: 0;
    min-width: 1.15rem;
    padding: 0 0.3rem;
    border-radius: 999px;
    background: var(--app-accent);
    color: var(--app-surface);
    font-size: 0.65rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    text-align: center;
    line-height: 1.15rem;
  }

  .scope-caret { flex-shrink: 0; font-size: 0.6rem; opacity: 0.7; }

  .scope-panel {
    position: absolute;
    top: calc(100% + 0.4rem);
    left: 0;
    z-index: 40;
    width: min(30rem, calc(100vw - 2rem));
    max-height: min(32rem, calc(100vh - var(--app-header-height, 56px) - 2rem));
    overflow-y: auto;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    background: var(--app-surface);
    box-shadow: 0 12px 32px rgb(0 0 0 / 28%);
  }

  .axis h4 {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    margin: 0 0 0.4rem;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--app-muted);
  }
  .axis h4 small {
    font-size: 0.62rem;
    font-weight: 400;
    letter-spacing: 0;
    text-transform: none;
    opacity: 0.8;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }
  .chips.profiles { margin-bottom: 0.45rem; }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    width: auto;
    margin: 0;
    padding: 0.22rem 0.55rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: 999px;
    background: var(--app-surface-2);
    color: var(--app-text);
    font-size: 0.72rem;
    line-height: 1.3;
    white-space: nowrap;
    cursor: pointer;
  }
  .chip:hover:not(:disabled) { border-color: var(--app-accent); color: var(--app-text-strong); }
  .chip.on {
    background: var(--app-accent-soft);
    border-color: var(--app-accent);
    color: var(--app-text-strong);
    font-weight: 600;
  }
  .chip.mono { font-family: var(--app-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); }
  /* A module that owns no drawable term stays clickable — the 0 is the point. */
  .chip.empty { opacity: 0.5; }
  .chip.profile { font-weight: 600; }
  .chip.reset:disabled { opacity: 0.4; cursor: default; }

  .chip-count {
    font-size: 0.62rem;
    font-variant-numeric: tabular-nums;
    opacity: 0.75;
  }

  .axis-toggle {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin: 0 0 0.5rem;
    font-size: 0.72rem;
    color: var(--app-muted);
    cursor: pointer;
  }
  .axis-toggle input { margin: 0; }

  /* Sticky so Reset stays reachable once the axes overflow the panel — with
     seventeen module chips they do at any realistic window height. */
  .scope-panel-foot {
    position: sticky;
    bottom: -0.75rem;
    margin: 0 -0.75rem -0.75rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
    border-top: var(--app-border-width) solid var(--app-border);
    background: var(--app-surface);
  }
  .foot-hint { font-size: 0.68rem; color: var(--app-muted); }

  .scope-guide .axis-heading {
    border: none;
    background: transparent;
    padding: 0.35rem 0 0;
  }
  .scope-guide .axis-heading dt {
    font-size: 0.7rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--app-muted);
  }

  .scope-info {
    flex-shrink: 0;
    width: 1.7rem;
    height: 1.7rem;
    margin: 0;
    padding: 0;
    border: var(--app-border-width) solid transparent;
    border-radius: var(--app-radius);
    background: transparent;
    color: var(--app-muted);
    font-size: 0.9rem;
    line-height: 1;
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .scope-info:hover {
    background: var(--app-accent-soft);
    border-color: var(--app-accent);
    color: var(--app-text-strong);
  }

  .scope-guide {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin: 0;
  }

  .scope-guide > div {
    padding: 0.5rem 0.6rem;
    border: var(--app-border-width) solid var(--app-border);
    border-left: 3px solid transparent;
    border-radius: var(--app-radius);
    background: var(--app-surface-2);
  }
  .scope-guide > div.current { border-left-color: var(--app-accent); }

  .scope-guide dt {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    font-weight: 700;
    font-size: 0.8rem;
    color: var(--app-text-strong);
  }

  .scope-guide dd {
    margin: 0.2rem 0 0;
    font-size: 0.78rem;
    line-height: 1.45;
    color: var(--app-text);
  }

  .current-tag {
    flex-shrink: 0;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 0.05rem 0.3rem;
    border-radius: 999px;
    background: var(--app-accent-soft);
    color: var(--app-accent);
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

  .help-fallback {
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.5;
    color: var(--app-text);
  }

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

    /* The stray-mode select gets its own full-width row above the buttons. */
    .stray-field {
      grid-column: 1 / -1;
    }
  }
</style>
