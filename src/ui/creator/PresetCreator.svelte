<script>
  import {
    AUDIO_PARAMS,
    AUDIO_TRACK_TYPES,
    CONTROL_TYPES,
    HAPTIC_PARAMS,
    HAPTIC_TRACK_TYPES,
    MARTIGLI_WAVEFORMS,
    VISUAL_PARAMS,
    VISUAL_TRACK_TYPES,
    buildPatchExport,
    createAudioTrack,
    createControlTrack,
    createDraft,
    createHapticTrack,
    createMod,
    createVisualTrack,
    patchSummary,
    validateDraft,
  } from './presetDraft.js'

  let draft = $state(createDraft())
  let statusMessage = $state('')
  let expandedMod = $state(null) // "trackId:paramName" for the open mod picker
  let menuOpen = $state(false)

  const summary = $derived(patchSummary(draft))
  const issues = $derived(validateDraft(draft))
  const hasErrors = $derived(issues.some(i => i.level === 'error'))
  const jsonExport = $derived(JSON.stringify(buildPatchExport(draft), null, 2))

  // ── Control tracks ──────────────────────────────────────────────────────────

  function addControlTrack(type) {
    draft.controlTracks.push(createControlTrack(type))
  }

  function removeControlTrack(id) {
    draft.controlTracks = draft.controlTracks.filter(t => t.id !== id)
    // drop dangling mods from all sensory tracks
    for (const col of [draft.audioTracks, draft.visualTracks, draft.hapticTracks]) {
      for (const track of col) {
        for (const param of Object.values(track.params)) {
          param.mods = param.mods.filter(m => m.controlId !== id)
        }
      }
    }
    status('Control track removed.')
  }

  // ── Sensory tracks ──────────────────────────────────────────────────────────

  function addAudioTrack(trackType) {
    draft.audioTracks.push(createAudioTrack(trackType))
    status(`${trackType} added.`)
  }

  function removeAudioTrack(id) {
    draft.audioTracks = draft.audioTracks.filter(t => t.id !== id)
    status('Audio track removed.')
  }

  function addVisualTrack(trackType) {
    draft.visualTracks.push(createVisualTrack(trackType))
    status(`${trackType} added.`)
  }

  function removeVisualTrack(id) {
    draft.visualTracks = draft.visualTracks.filter(t => t.id !== id)
    status('Visual track removed.')
  }

  function addHapticTrack(trackType) {
    draft.hapticTracks.push(createHapticTrack(trackType))
    status(`${trackType} added.`)
  }

  function removeHapticTrack(id) {
    draft.hapticTracks = draft.hapticTracks.filter(t => t.id !== id)
    status('Haptic track removed.')
  }

  // ── Mod slots ───────────────────────────────────────────────────────────────

  function toggleModPicker(trackId, paramName) {
    const key = `${trackId}:${paramName}`
    expandedMod = expandedMod === key ? null : key
  }

  function addMod(param, controlId) {
    if (!param.mods.find(m => m.controlId === controlId)) {
      param.mods.push(createMod(controlId))
    }
    expandedMod = null
    status('Mod link added.')
  }

  function removeMod(param, modId) {
    param.mods = param.mods.filter(m => m.id !== modId)
    status('Mod link removed.')
  }

  // ── Transport (placeholder until engines are wired) ─────────────────────────

  function togglePlay() {
    draft.playing = !draft.playing
    status(draft.playing ? 'Playing…' : 'Stopped.')
  }

  // ── Save / load ─────────────────────────────────────────────────────────────

  function downloadPatch() {
    const blob = new Blob([jsonExport], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slugify(draft.patchName)}.json`
    a.click()
    URL.revokeObjectURL(url)
    status('Patch downloaded.')
  }

  async function copyPatch() {
    try {
      await navigator.clipboard.writeText(jsonExport)
      status('JSON copied.')
    } catch {
      status('Clipboard unavailable.')
    }
  }

  function resetPatch() {
    draft = createDraft()
    expandedMod = null
    status('Patch reset.')
  }

  function slugify(v) {
    return `${v ?? 'patch'}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'patch'
  }

  function status(msg) { statusMessage = msg }

  function ctrlName(id) {
    return draft.controlTracks.find(t => t.id === id)?.name ?? id
  }
</script>

<div class="studio">

  <!-- ── Header ── -->
  <header class="studio-header">
    <div class="header-left">
      <input class="patch-name" bind:value={draft.patchName} placeholder="Patch name" />
      <span class="overview-pill">
        {summary.controlCount} ctrl · {summary.audioCount} audio · {summary.visualCount} visual · {summary.hapticCount} haptic · {summary.modLinks} links
      </span>
    </div>

    <div class="header-center">
      <button class="transport-btn" onclick={togglePlay} title={draft.playing ? 'Stop' : 'Play'}>
        {draft.playing ? '■' : '▶'}
      </button>
      <label class="meta-field">
        BPM <input type="number" min="1" step="1" bind:value={draft.bpm} />
      </label>
      <label class="meta-field">
        sec <input type="number" min="1" step="1" bind:value={draft.lengthSec} />
      </label>
    </div>

    <div class="header-right">
      {#if issues.length > 0}
        <span class="badge {hasErrors ? 'badge-err' : 'badge-warn'}">{issues.length} {hasErrors ? 'error' : 'warning'}{issues.length > 1 ? 's' : ''}</span>
      {:else}
        <span class="badge badge-ok">OK</span>
      {/if}
      <button class="ghost-btn" onclick={copyPatch}>Copy JSON</button>
      <button class="ghost-btn" onclick={downloadPatch} disabled={hasErrors}>Download</button>
      <button class="ghost-btn" onclick={resetPatch}>Reset</button>

      <div class="nav-cluster">
        <details class="nav-menu" bind:open={menuOpen}>
          <summary aria-label="Navigation menu" title="Navigation">+</summary>
          <div class="nav-panel">
            <a href="/creator/">Patch Studio</a>
            <a href="/presets/">Presets</a>
            <a href="/sparql/">SPARQL</a>
            <a href="/">Graph</a>
          </div>
        </details>
      </div>
    </div>
  </header>

  {#if statusMessage}
    <div class="status-bar" aria-live="polite">{statusMessage}</div>
  {/if}

  <!-- ── Four columns ── -->
  <div class="columns">

    <!-- Controls column -->
    <div class="col col-control">
      <div class="col-head">
        <span class="col-title">Controls</span>
        <div class="col-actions">
          {#each CONTROL_TYPES as type}
            <button class="add-btn" onclick={() => addControlTrack(type)}>+ {type}</button>
          {/each}
        </div>
      </div>
      <div class="col-description">Martigli oscillators and Symmetry patterns, all available as modulators.</div>

      {#each draft.controlTracks as track (track.id)}
        <article class="track-card">
          <div class="track-head">
            <input class="track-name" bind:value={track.name} />
            <button class="icon-btn" onclick={() => removeControlTrack(track.id)} title="Remove">✕</button>
          </div>

          {#if track.type === 'Martigli'}
            <div class="field-row">
              <label>Waveform
                <select bind:value={track.waveform}>
                  {#each MARTIGLI_WAVEFORMS as w}<option value={w}>{w}</option>{/each}
                </select>
              </label>
            </div>
            <div class="field-row">
              <label>Period sec <input type="number" min="3" step="1" bind:value={track.periodSec} /></label>
              <label>Target sec <input type="number" min="3" step="1" bind:value={track.targetPeriodSec} /></label>
            </div>
            <div class="field-row">
              <label>Inhale ratio <input type="number" min="0.1" max="0.9" step="0.05" bind:value={track.inhaleRatio} /></label>
              <label>Amplitude <input type="number" min="0" max="2" step="0.05" bind:value={track.amplitude} /></label>
            </div>
            <div class="track-meta">
              Breath {track.periodSec}s → {track.targetPeriodSec}s · Inhale {Math.round(track.inhaleRatio * 100)}%
            </div>

          {:else}
            <div class="field-row">
              <label>Rate Hz <input type="number" min="0.001" max="50" step="0.1" bind:value={track.rateHz} /></label>
              <label>Depth <input type="number" step="0.1" bind:value={track.depth} /></label>
            </div>
            <div class="field-row">
              <label>Offset <input type="number" step="0.1" bind:value={track.offset} /></label>
              <label>Phase ° <input type="number" step="1" bind:value={track.phaseDeg} /></label>
            </div>
            <div class="track-meta">
              {track.rateHz} Hz {track.waveform}
            </div>
          {/if}
        </article>
      {/each}

      {#if draft.controlTracks.length === 0}
        <p class="empty-hint">Add a Martigli or Symmetry oscillator to use as a modulator.</p>
      {/if}
    </div>

    <!-- Audio column -->
    <div class="col col-audio">
      <div class="col-head">
        <span class="col-title">Audio</span>
        <div class="col-actions">
          {#each AUDIO_TRACK_TYPES as type}
            <button class="add-btn" onclick={() => addAudioTrack(type)}>+ {type}</button>
          {/each}
        </div>
      </div>
      <div class="col-description">Tonal and rhythmic audio layers.</div>

      {#each draft.audioTracks as track (track.id)}
        <article class="track-card">
          <div class="track-head">
            <input class="track-name" bind:value={track.name} />
            <button class="icon-btn" onclick={() => removeAudioTrack(track.id)} title="Remove">✕</button>
          </div>
          {#each AUDIO_PARAMS as paramName}
            {@const param = track.params[paramName]}
            <div class="param-row">
              <span class="param-label">{paramName}</span>
              <input class="param-val" type="number" step="any" bind:value={param.value} />
              <button
                class="mod-toggle {param.mods.length > 0 ? 'mod-active' : ''}"
                onclick={() => toggleModPicker(track.id, paramName)}
                title="Modulation"
              >M</button>
            </div>
            {#if expandedMod === `${track.id}:${paramName}`}
              <div class="mod-picker">
                {#each draft.controlTracks as ctrl}
                  <button class="mod-pick-btn" onclick={() => addMod(param, ctrl.id)}>{ctrl.name}</button>
                {/each}
                {#if draft.controlTracks.length === 0}
                  <span class="mod-pick-empty">No controls yet</span>
                {/if}
              </div>
            {/if}
            {#each param.mods as mod (mod.id)}
              <div class="mod-chip">
                <span>{ctrlName(mod.controlId)}</span>
                <input class="mod-amount" type="number" step="any" bind:value={mod.amount} title="Amount" />
                <button class="icon-btn tiny" onclick={() => removeMod(param, mod.id)}>✕</button>
              </div>
            {/each}
          {/each}
        </article>
      {/each}

      {#if draft.audioTracks.length === 0}
        <p class="empty-hint">No audio tracks. Select a type above and add one.</p>
      {/if}
    </div>

    <!-- Visual column -->
    <div class="col col-visual">
      <div class="col-head">
        <span class="col-title">Visual</span>
        <div class="col-actions">
          {#each VISUAL_TRACK_TYPES as type}
            <button class="add-btn" onclick={() => addVisualTrack(type)}>+ {type}</button>
          {/each}
        </div>
      </div>
      <div class="col-description">Geometry and particle visual layers.</div>

      {#each draft.visualTracks as track (track.id)}
        <article class="track-card">
          <div class="track-head">
            <input class="track-name" bind:value={track.name} />
            <button class="icon-btn" onclick={() => removeVisualTrack(track.id)} title="Remove">✕</button>
          </div>
          {#each VISUAL_PARAMS as paramName}
            {@const param = track.params[paramName]}
            <div class="param-row">
              <span class="param-label">{paramName}</span>
              <input class="param-val" type="number" step="any" bind:value={param.value} />
              <button
                class="mod-toggle {param.mods.length > 0 ? 'mod-active' : ''}"
                onclick={() => toggleModPicker(track.id, paramName)}
                title="Modulation"
              >M</button>
            </div>
            {#if expandedMod === `${track.id}:${paramName}`}
              <div class="mod-picker">
                {#each draft.controlTracks as ctrl}
                  <button class="mod-pick-btn" onclick={() => addMod(param, ctrl.id)}>{ctrl.name}</button>
                {/each}
                {#if draft.controlTracks.length === 0}
                  <span class="mod-pick-empty">No controls yet</span>
                {/if}
              </div>
            {/if}
            {#each param.mods as mod (mod.id)}
              <div class="mod-chip">
                <span>{ctrlName(mod.controlId)}</span>
                <input class="mod-amount" type="number" step="any" bind:value={mod.amount} title="Amount" />
                <button class="icon-btn tiny" onclick={() => removeMod(param, mod.id)}>✕</button>
              </div>
            {/each}
          {/each}
        </article>
      {/each}

      {#if draft.visualTracks.length === 0}
        <p class="empty-hint">No visual tracks. Select a type above and add one.</p>
      {/if}
    </div>

    <!-- Haptic column -->
    <div class="col col-haptic">
      <div class="col-head">
        <span class="col-title">Haptic</span>
        <div class="col-actions">
          {#each HAPTIC_TRACK_TYPES as type}
            <button class="add-btn" onclick={() => addHapticTrack(type)}>+ {type}</button>
          {/each}
        </div>
      </div>
      <div class="col-description">Vibration patterns via Web Vibration API.</div>

      {#each draft.hapticTracks as track (track.id)}
        <article class="track-card">
          <div class="track-head">
            <input class="track-name" bind:value={track.name} />
            <button class="icon-btn" onclick={() => removeHapticTrack(track.id)} title="Remove">✕</button>
          </div>
          {#each HAPTIC_PARAMS as paramName}
            {@const param = track.params[paramName]}
            <div class="param-row">
              <span class="param-label">{paramName}</span>
              <input class="param-val" type="number" step="any" bind:value={param.value} />
              <button
                class="mod-toggle {param.mods.length > 0 ? 'mod-active' : ''}"
                onclick={() => toggleModPicker(track.id, paramName)}
                title="Modulation"
              >M</button>
            </div>
            {#if expandedMod === `${track.id}:${paramName}`}
              <div class="mod-picker">
                {#each draft.controlTracks as ctrl}
                  <button class="mod-pick-btn" onclick={() => addMod(param, ctrl.id)}>{ctrl.name}</button>
                {/each}
                {#if draft.controlTracks.length === 0}
                  <span class="mod-pick-empty">No controls yet</span>
                {/if}
              </div>
            {/if}
            {#each param.mods as mod (mod.id)}
              <div class="mod-chip">
                <span>{ctrlName(mod.controlId)}</span>
                <input class="mod-amount" type="number" step="any" bind:value={mod.amount} title="Amount" />
                <button class="icon-btn tiny" onclick={() => removeMod(param, mod.id)}>✕</button>
              </div>
            {/each}
          {/each}
        </article>
      {/each}

      {#if draft.hapticTracks.length === 0}
        <p class="empty-hint">No haptic tracks. Add a Vibration track to include haptic cues.</p>
      {/if}
    </div>

  </div><!-- /columns -->

  <!-- ── Validation footer ── -->
  {#if issues.length > 0}
    <footer class="issues-footer">
      {#each issues as issue}
        <span class="issue {issue.level}">{issue.message}</span>
      {/each}
    </footer>
  {/if}

</div><!-- /studio -->

<style>
  /* ── Shell ── */
  .studio {
    --c-bg: #0e1117;
    --c-surface: #161c26;
    --c-border: #263040;
    --c-text: #c8d4e0;
    --c-muted: #5a7080;
    --c-accent: #3b9eff;
    --c-accent-soft: #1a3a5c;
    --c-ok: #2ecc71;
    --c-warn: #f39c12;
    --c-err: #e74c3c;
    --c-ctrl: #e67e22;
    --c-audio: #3b9eff;
    --c-visual: #9b59b6;
    --c-haptic: #1abc9c;

    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--c-bg);
    color: var(--c-text);
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 0.8rem;
    overflow: hidden;
  }

  /* ── Header ── */
  .studio-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.5rem 1rem;
    background: var(--c-surface);
    border-bottom: 1px solid var(--c-border);
    flex-shrink: 0;
  }

  .header-left,
  .header-center,
  .header-right {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .patch-name {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--c-border);
    color: var(--c-text);
    font-size: 0.95rem;
    font-weight: 600;
    width: 14rem;
    padding: 0.15rem 0.25rem;
  }

  .patch-name:focus { outline: none; border-bottom-color: var(--c-accent); }

  .overview-pill {
    color: var(--c-muted);
    font-size: 0.72rem;
    white-space: nowrap;
  }

  .transport-btn {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    border: 2px solid var(--c-accent);
    background: transparent;
    color: var(--c-accent);
    font-size: 0.85rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
  }

  .transport-btn:hover { background: var(--c-accent-soft); }

  .meta-field {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    color: var(--c-muted);
    font-size: 0.72rem;
  }

  .meta-field input {
    width: 4rem;
    background: var(--c-bg);
    border: 1px solid var(--c-border);
    color: var(--c-text);
    border-radius: 3px;
    padding: 0.15rem 0.35rem;
    font-size: 0.72rem;
  }

  .badge {
    border-radius: 999px;
    padding: 0.15rem 0.55rem;
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .badge-ok { background: #1a3d2b; color: var(--c-ok); }
  .badge-warn { background: #3d2e0a; color: var(--c-warn); }
  .badge-err { background: #3d120a; color: var(--c-err); }

  .ghost-btn {
    background: transparent;
    border: 1px solid var(--c-border);
    color: var(--c-muted);
    border-radius: 4px;
    padding: 0.2rem 0.6rem;
    font-size: 0.72rem;
    cursor: pointer;
    transition: color 0.12s, border-color 0.12s;
  }

  .ghost-btn:hover { color: var(--c-text); border-color: var(--c-accent); }
  .ghost-btn:disabled { opacity: 0.35; cursor: default; }

  /* ── Status bar ── */
  .status-bar {
    padding: 0.2rem 1rem;
    font-size: 0.68rem;
    color: var(--c-muted);
    background: var(--c-surface);
    border-bottom: 1px solid var(--c-border);
    flex-shrink: 0;
  }

  /* ── Columns ── */
  .columns {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0;
    flex: 1;
    overflow: hidden;
  }

  .col {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    border-right: 1px solid var(--c-border);
    padding: 0.75rem 0.65rem;
    gap: 0.55rem;
  }

  .col:last-child { border-right: none; }

  .col-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  .col-title {
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.03em;
  }

  .col-control .col-title { color: var(--c-ctrl); }
  .col-audio   .col-title { color: var(--c-audio); }
  .col-visual  .col-title { color: var(--c-visual); }
  .col-haptic  .col-title { color: var(--c-haptic); }

  .col-description {
    font-size: 0.68rem;
    color: var(--c-muted);
    line-height: 1.4;
    flex-shrink: 0;
  }

  .col-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    flex-shrink: 0;
  }

  .add-btn {
    background: transparent;
    border: 1px solid var(--c-border);
    color: var(--c-muted);
    border-radius: 4px;
    padding: 0.15rem 0.45rem;
    font-size: 0.68rem;
    cursor: pointer;
    white-space: nowrap;
    transition: color 0.12s, border-color 0.12s;
  }

  .add-btn:hover { color: var(--c-text); border-color: var(--c-accent); }

  .empty-hint {
    color: var(--c-muted);
    font-size: 0.72rem;
    text-align: center;
    padding: 1.5rem 0.5rem;
    line-height: 1.5;
  }

  /* ── Track cards ── */
  .track-card {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: 8px;
    padding: 0.6rem 0.65rem;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    flex-shrink: 0;
  }

  .track-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
  }

  .track-name {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--c-border);
    color: var(--c-text);
    font-weight: 600;
    font-size: 0.8rem;
    width: 100%;
    padding: 0.1rem 0.2rem;
    font-family: inherit;
  }

  .track-name:focus { outline: none; border-bottom-color: var(--c-accent); }

  .track-meta {
    font-size: 0.65rem;
    color: var(--c-muted);
  }

  /* ── Fields inside control cards ── */
  .field-row {
    display: flex;
    gap: 0.5rem;
  }

  .field-row label {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-size: 0.68rem;
    color: var(--c-muted);
    flex: 1;
  }

  .field-row input,
  .field-row select {
    background: var(--c-bg);
    border: 1px solid var(--c-border);
    color: var(--c-text);
    border-radius: 3px;
    padding: 0.2rem 0.35rem;
    font-size: 0.75rem;
    font-family: inherit;
    width: 100%;
  }

  /* ── Param rows (sensory tracks) ── */
  .param-row {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    height: 1.6rem;
  }

  .param-label {
    width: 7rem;
    font-size: 0.72rem;
    color: var(--c-muted);
    flex-shrink: 0;
  }

  .param-val {
    flex: 1;
    background: var(--c-bg);
    border: 1px solid var(--c-border);
    color: var(--c-text);
    border-radius: 3px;
    padding: 0.15rem 0.35rem;
    font-size: 0.72rem;
    font-family: inherit;
    min-width: 0;
  }

  .mod-toggle {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    border: 1px solid var(--c-border);
    background: transparent;
    color: var(--c-muted);
    font-size: 0.62rem;
    font-weight: 700;
    cursor: pointer;
    flex-shrink: 0;
    transition: color 0.12s, border-color 0.12s, background 0.12s;
  }

  .mod-toggle:hover { border-color: var(--c-accent); color: var(--c-accent); }
  .mod-toggle.mod-active { border-color: var(--c-accent); background: var(--c-accent-soft); color: var(--c-accent); }

  /* ── Mod picker dropdown ── */
  .mod-picker {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    padding: 0.35rem 0.4rem;
    background: var(--c-bg);
    border: 1px solid var(--c-accent);
    border-radius: 5px;
    margin-left: 7.4rem;
  }

  .mod-pick-btn {
    background: var(--c-accent-soft);
    border: 1px solid var(--c-accent);
    color: var(--c-accent);
    border-radius: 3px;
    padding: 0.15rem 0.45rem;
    font-size: 0.68rem;
    cursor: pointer;
  }

  .mod-pick-empty {
    font-size: 0.68rem;
    color: var(--c-muted);
  }

  /* ── Mod chip ── */
  .mod-chip {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    margin-left: 7.4rem;
    background: var(--c-accent-soft);
    border: 1px solid var(--c-accent);
    border-radius: 4px;
    padding: 0.1rem 0.35rem;
    font-size: 0.65rem;
    color: var(--c-accent);
  }

  .mod-chip span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }

  .mod-amount {
    width: 3.5rem;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--c-accent);
    color: var(--c-accent);
    font-size: 0.65rem;
    font-family: inherit;
    padding: 0;
    text-align: right;
  }

  /* ── Buttons ── */
  .icon-btn {
    background: transparent;
    border: none;
    color: var(--c-muted);
    cursor: pointer;
    font-size: 0.7rem;
    padding: 0.1rem 0.25rem;
    border-radius: 3px;
    flex-shrink: 0;
    transition: color 0.12s;
  }

  .icon-btn:hover { color: var(--c-err); }
  .icon-btn.tiny { font-size: 0.58rem; }

  /* ── Issues footer ── */
  .issues-footer {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    padding: 0.4rem 1rem;
    background: var(--c-surface);
    border-top: 1px solid var(--c-border);
    flex-shrink: 0;
  }

  .issue {
    font-size: 0.68rem;
    padding: 0.1rem 0.45rem;
    border-radius: 3px;
  }

  .issue.error { background: #3d120a; color: var(--c-err); }
  .issue.warning { background: #3d2e0a; color: var(--c-warn); }

  /* ── Scrollbar ── */
  .col::-webkit-scrollbar { width: 4px; }
  .col::-webkit-scrollbar-track { background: transparent; }
  .col::-webkit-scrollbar-thumb { background: var(--c-border); border-radius: 2px; }

  /* ── Nav cluster ── */
  .nav-cluster {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin-left: 0.25rem;
    padding-left: 0.6rem;
    border-left: 1px solid var(--c-border);
  }

  .nav-menu {
    position: relative;
    margin: 0;
  }

  .nav-menu summary {
    display: grid;
    place-items: center;
    width: 1.8rem;
    height: 1.8rem;
    border: 1px solid var(--c-border);
    border-radius: 4px;
    background: transparent;
    color: var(--c-muted);
    font-size: 1.1rem;
    line-height: 1;
    cursor: pointer;
    list-style: none;
    transition: color 0.12s, border-color 0.12s;
  }

  .nav-menu summary::marker,
  .nav-menu summary::after { display: none; content: ''; }
  .nav-menu summary::-webkit-details-marker { display: none; }
  .nav-menu summary:hover { color: var(--c-text); border-color: var(--c-accent); }

  .nav-panel {
    position: absolute;
    right: 0;
    top: calc(100% + 0.4rem);
    z-index: 50;
    min-width: 11rem;
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: 6px;
    padding: 0.45rem 0.6rem;
    box-shadow: 0 0.8rem 2rem #00000088;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .nav-panel a {
    display: block;
    padding: 0.35rem 0.4rem;
    color: var(--c-text);
    text-decoration: none;
    font-size: 0.8rem;
    border-radius: 3px;
    transition: background 0.1s;
  }

  .nav-panel a:hover { background: var(--c-accent-soft); color: var(--c-accent); }
</style>
