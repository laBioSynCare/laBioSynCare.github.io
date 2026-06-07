<script>
  import { onMount, onDestroy } from 'svelte'
  import { goto } from '$app/navigation'
  import { authState } from '../../firebase/auth.js'
  import SignInForm from '../../ui/auth/SignInForm.svelte'

  // ── Auth gate ──────────────────────────────────────────────────────────
  let auth = $state({ ready: false, configured: false, user: null })
  const unsubAuth = authState.subscribe((v) => { auth = v })
  onDestroy(unsubAuth)

  // Show the gate whenever auth is ready and user is absent
  let gateVisible = $derived(auth.ready && !auth.user)

  function dismissGate() {
    goto('/')
  }

  const TYPES = {
    'stimulation-session': {
      label: 'Stimulation Session',
      color: 'var(--app-accent)',
      fields: [
        { key: 'preset',   label: 'Preset',          type: 'text',     placeholder: 'e.g. Alpha Flow' },
        { key: 'duration', label: 'Duration (min)',   type: 'number',   placeholder: '30' },
        { key: 'notes',    label: 'Notes',            type: 'textarea' },
      ],
    },
    'stimulation-outcome': {
      label: 'Stimulation Outcome',
      color: 'var(--app-ok)',
      fields: [
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'rating',      label: 'Rating (1–5)', type: 'number', placeholder: '3' },
      ],
    },
    observation: {
      label: 'Observation',
      color: 'var(--app-visual)',
      fields: [
        { key: 'description', label: 'Description', type: 'textarea' },
      ],
    },
    idea: {
      label: 'Idea',
      color: '#a78bfa',
      fields: [
        { key: 'title',       label: 'Title',       type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea' },
      ],
    },
    activity: {
      label: 'Activity',
      color: 'var(--app-control)',
      fields: [
        { key: 'title',       label: 'Title',          type: 'text' },
        { key: 'description', label: 'Description',    type: 'textarea' },
        { key: 'duration',    label: 'Duration (min)', type: 'number' },
      ],
    },
    initiative: {
      label: 'Initiative',
      color: 'var(--app-haptic)',
      fields: [
        { key: 'title',       label: 'Title',       type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'status',      label: 'Status',      type: 'select', options: ['planned', 'active', 'done'] },
      ],
    },
    note: {
      label: 'Note',
      color: 'var(--app-muted)',
      fields: [
        { key: 'content', label: 'Content', type: 'textarea' },
      ],
    },
    achievement: {
      label: 'Achievement',
      color: 'var(--app-warn)',
      fields: [
        { key: 'title',       label: 'Title',       type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea' },
      ],
    },
  }

  const STORAGE_KEY = 'bsclab_logbook_v1'

  let entries     = $state([])
  let showForm    = $state(false)
  let editingId   = $state(null)
  let expandedId  = $state(null)
  let selType     = $state('note')
  let formDate    = $state('')
  let formData    = $state({})

  let sorted = $derived(
    [...entries].sort((a, b) =>
      b.date !== a.date
        ? b.date.localeCompare(a.date)
        : b.createdAt.localeCompare(a.createdAt)
    )
  )

  onMount(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      entries = raw ? JSON.parse(raw) : []
    } catch { entries = [] }
    formDate = todayISO()
  })

  function todayISO() {
    return new Date().toISOString().slice(0, 10)
  }

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) } catch {}
  }

  function trunc(str, n) {
    if (!str) return ''
    return str.length > n ? str.slice(0, n) + '…' : str
  }

  function entryTitle(entry) {
    const d = entry.data || {}
    switch (entry.type) {
      case 'stimulation-session':  return d.preset               || 'Session'
      case 'stimulation-outcome':  return trunc(d.description, 72) || 'Outcome'
      case 'observation':          return trunc(d.description, 72) || 'Observation'
      case 'idea':                 return d.title                || 'Idea'
      case 'activity':             return d.title                || 'Activity'
      case 'initiative':           return d.title                || 'Initiative'
      case 'note':                 return trunc(d.content, 72)   || 'Note'
      case 'achievement':          return d.title                || 'Achievement'
      default:                     return 'Entry'
    }
  }

  function entryMeta(entry) {
    const d = entry.data || {}
    switch (entry.type) {
      case 'stimulation-session': return d.duration ? `${d.duration} min` : null
      case 'stimulation-outcome': return d.rating   ? `★ ${d.rating}/5`  : null
      case 'initiative':          return d.status   || null
      default:                    return null
    }
  }

  // Which field each type already surfaces in the collapsed card.
  const TITLE_KEY = {
    'stimulation-session': 'preset',
    'stimulation-outcome': 'description',
    observation: 'description',
    idea: 'title',
    activity: 'title',
    initiative: 'title',
    note: 'content',
    achievement: 'title',
  }
  const META_KEY = {
    'stimulation-session': 'duration',
    'stimulation-outcome': 'rating',
    initiative: 'status',
  }
  // Types whose title line is a truncation of a longer text field.
  const TRUNC_TYPES = new Set(['stimulation-outcome', 'observation', 'note'])

  // Fields worth revealing on expand: those carrying content not already shown
  // in full by the collapsed card (title line + meta).
  function entryFields(entry) {
    const def = TYPES[entry.type]
    if (!def) return []
    const d = entry.data || {}
    const titleKey = TITLE_KEY[entry.type]
    const metaKey  = META_KEY[entry.type]
    const out = []
    for (const f of def.fields) {
      const v = d[f.key]
      if (v === undefined || v === null || String(v).trim() === '') continue
      if (f.key === metaKey) continue
      if (f.key === titleKey && !(TRUNC_TYPES.has(entry.type) && String(v).length > 72)) continue
      out.push({ key: f.key, label: f.label, value: v, type: f.type })
    }
    return out
  }

  function toggle(id) {
    expandedId = expandedId === id ? null : id
  }

  function openForm() {
    editingId = null
    selType   = 'note'
    formDate  = todayISO()
    formData  = {}
    showForm  = true
  }

  function openEdit(entry) {
    editingId = entry.id
    selType   = entry.type
    formDate  = entry.date
    formData  = { ...(entry.data || {}) }
    showForm  = true
  }

  function closeForm() {
    showForm  = false
    editingId = null
  }

  function changeType(type) {
    if (type === selType) return
    selType  = type
    formData = {}
  }

  function saveEntry() {
    if (editingId) {
      entries = entries.map((e) =>
        e.id === editingId
          ? { ...e, type: selType, date: formDate, data: { ...formData }, updatedAt: new Date().toISOString() }
          : e
      )
    } else {
      entries = [
        { id: crypto.randomUUID(), type: selType, date: formDate,
          createdAt: new Date().toISOString(), data: { ...formData } },
        ...entries,
      ]
    }
    persist()
    closeForm()
  }

  function deleteEntry(id) {
    if (!confirm('Delete this entry?')) return
    entries = entries.filter(e => e.id !== id)
    if (expandedId === id) expandedId = null
    persist()
  }

  function fmtDate(iso) {
    if (!iso) return ''
    try {
      return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
        .format(new Date(iso + 'T12:00:00'))
    } catch { return iso }
  }
</script>

<svelte:head>
  <title>Logbook | BSC Lab</title>
</svelte:head>

<!-- ── Loading state ──────────────────────────────────────────────────── -->
{#if !auth.ready}
  <main class="logbook-status">
    <p aria-busy="true">Loading account…</p>
  </main>
{/if}

<!-- ── Auth gate ──────────────────────────────────────────────────────── -->
{#if gateVisible}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="gate-overlay" role="presentation" onclick={dismissGate}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="gate-sheet" tabindex="-1" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Sign in to access Logbook">
      <div class="gate-icon" aria-hidden="true">📓</div>
      <h2 class="gate-title">Logbook</h2>
      <p class="gate-body">
        The long-term memory of your sensory stimulation work.<br />
        Sign in to keep a private, persistent record of your sessions, observations, ideas, and progress.
      </p>

      {#if !auth.configured}
        <p class="gate-unconfigured">Firebase is not configured — sign-in is unavailable in this environment.</p>
      {:else}
        <div class="gate-form">
          <SignInForm />
        </div>
      {/if}

      <button class="gate-dismiss" onclick={dismissGate}>Not now</button>
    </div>
  </div>
{/if}

{#if auth.user}

<!-- ── Add-entry modal ─────────────────────────────────────────────────── -->
{#if showForm}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="overlay" role="presentation" onclick={closeForm}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="sheet" tabindex="-1" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={editingId ? 'Edit logbook entry' : 'New logbook entry'}>
      <div class="sheet-top">
        <span class="sheet-title">{editingId ? 'Edit Entry' : 'New Entry'}</span>
        <button class="sheet-close" onclick={closeForm} aria-label="Close">✕</button>
      </div>

      <div class="type-grid">
        {#each Object.entries(TYPES) as [key, def]}
          <button
            class="type-chip"
            class:active={selType === key}
            style="--chip-color: {def.color}"
            onclick={() => changeType(key)}
          >{def.label}</button>
        {/each}
      </div>

      <div class="form-fields">
        <div class="field-row">
          <label for="entry-date">Date</label>
          <input type="date" id="entry-date" bind:value={formDate} />
        </div>
        {#each TYPES[selType].fields as field (field.key)}
          <div class="field-row">
            <label for="field-{field.key}">{field.label}</label>
            {#if field.type === 'textarea'}
              <textarea
                id="field-{field.key}"
                rows="3"
                value={formData[field.key] ?? ''}
                oninput={(e) => { formData[field.key] = e.currentTarget.value }}
              ></textarea>
            {:else if field.type === 'select'}
              <select
                id="field-{field.key}"
                value={formData[field.key] ?? field.options[0]}
                onchange={(e) => { formData[field.key] = e.currentTarget.value }}
              >
                {#each field.options as opt}
                  <option value={opt}>{opt}</option>
                {/each}
              </select>
            {:else}
              <input
                type={field.type}
                id="field-{field.key}"
                placeholder={field.placeholder ?? ''}
                value={formData[field.key] ?? ''}
                oninput={(e) => { formData[field.key] = e.currentTarget.value }}
              />
            {/if}
          </div>
        {/each}
      </div>

      <div class="form-actions">
        <button class="btn-cancel" onclick={closeForm}>Cancel</button>
        <button class="btn-save" onclick={saveEntry}>{editingId ? 'Save changes' : 'Save'}</button>
      </div>
    </div>
  </div>
{/if}

<!-- ── Page ────────────────────────────────────────────────────────────── -->
<main class="logbook-page">
  <header class="logbook-header">
    <div>
      <p class="eyebrow">Long-term memory</p>
      <h1>Logbook</h1>
      <p class="tagline">The long-term memory of your sensory stimulation work.</p>
    </div>
    <button class="btn-add" onclick={openForm}>+ Add</button>
  </header>

  {#if sorted.length === 0}
    <div class="empty-state">
      <p>No entries yet.</p>
      <button class="btn-add-empty" onclick={openForm}>Add your first entry</button>
    </div>
  {:else}
    <ul class="entry-feed">
      {#each sorted as entry (entry.id)}
        {@const typeDef  = TYPES[entry.type]}
        {@const color    = typeDef?.color ?? 'var(--app-muted)'}
        {@const label    = typeDef?.label ?? entry.type}
        {@const details  = entryFields(entry)}
        {@const meta     = entryMeta(entry)}
        {@const expanded = expandedId === entry.id}
        <li class="entry-card" style="--card-color: {color}">
          <button
            class="entry-toggle"
            class:expandable={details.length > 0}
            onclick={() => details.length && toggle(entry.id)}
            aria-expanded={details.length ? expanded : undefined}
          >
            <span class="entry-head">
              <span class="type-badge">{label}</span>
              <span class="entry-date">{fmtDate(entry.date)}</span>
              {#if details.length}
                <span class="chevron" class:open={expanded} aria-hidden="true">▾</span>
              {/if}
            </span>
            <span class="entry-body">
              <span class="entry-title">{entryTitle(entry)}</span>
              {#if meta}
                <span class="entry-meta">{meta}</span>
              {/if}
            </span>
          </button>

          {#if expanded && details.length}
            <dl class="entry-details">
              {#each details as f (f.key)}
                <div class="detail-row">
                  <dt>{f.label}</dt>
                  <dd class:multiline={f.type === 'textarea'}>{f.value}</dd>
                </div>
              {/each}
            </dl>
          {/if}

          <div class="entry-actions">
            <button class="btn-icon" onclick={() => openEdit(entry)} aria-label="Edit entry" title="Edit">✎</button>
            <button class="btn-icon btn-del" onclick={() => deleteEntry(entry.id)} aria-label="Delete entry" title="Delete">✕</button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</main>
{/if}

<style>
  /* ── Auth gate overlay ───────────────────────────────────────────────── */
  .gate-overlay {
    position: fixed;
    inset: 0;
    z-index: 300;
    background: rgba(0 0 0 / 0.72);
    display: grid;
    place-items: center;
    padding: 1rem;
  }

  .gate-sheet {
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) * 2);
    width: 100%;
    max-width: 440px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 2rem 1.75rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    text-align: center;
  }

  .gate-icon {
    font-size: 2.2rem;
    line-height: 1;
  }

  .gate-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--app-text-strong);
    margin: 0;
  }

  .gate-body {
    font-size: 0.88rem;
    color: var(--app-muted);
    line-height: 1.55;
    margin: 0;
  }

  .gate-form {
    text-align: left;
    border-top: 1px solid var(--app-border);
    padding-top: 1rem;
  }

  .gate-unconfigured {
    font-size: 0.82rem;
    color: var(--app-warn);
    margin: 0;
  }

  .gate-dismiss {
    background: transparent;
    border: none;
    color: var(--app-muted-2);
    font-size: 0.8rem;
    cursor: pointer;
    padding: 0.3rem;
    text-decoration: underline;
    align-self: center;
  }

  .gate-dismiss:hover { color: var(--app-muted); }

  /* ── Status (loading) ────────────────────────────────────────────────── */
  .logbook-status {
    max-width: 720px;
    margin: 0 auto;
    padding: 3rem 1rem;
    color: var(--app-muted);
  }
  .logbook-status p { margin: 0; }

  /* ── Page layout ─────────────────────────────────────────────────────── */
  .logbook-page {
    padding: 1.5rem 1rem 6rem;
    max-width: 720px;
    margin: 0 auto;
    color: var(--app-text);
  }

  .logbook-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.75rem;
  }

  .eyebrow {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--app-muted);
    margin: 0 0 0.2rem;
  }

  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--app-text-strong);
    margin: 0 0 0.3rem;
  }

  .tagline {
    color: var(--app-muted);
    font-size: 0.88rem;
    margin: 0;
  }

  .btn-add {
    flex-shrink: 0;
    margin-top: 0.25rem;
    padding: 0.45rem 1rem;
    background: var(--app-accent);
    color: #fff;
    border: none;
    border-radius: var(--app-radius);
    font-size: 0.84rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }
  .btn-add:hover { filter: brightness(1.15); }

  /* ── Empty state ─────────────────────────────────────────────────────── */
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    border: 1px dashed var(--app-border);
    border-radius: var(--app-radius);
    color: var(--app-muted-2);
  }

  .empty-state p { margin: 0 0 1rem; font-size: 0.9rem; }

  .btn-add-empty {
    padding: 0.5rem 1.25rem;
    background: transparent;
    color: var(--app-accent);
    border: 1px solid var(--app-accent);
    border-radius: var(--app-radius);
    font-size: 0.84rem;
    font-weight: 600;
    cursor: pointer;
  }
  .btn-add-empty:hover { background: var(--app-accent-soft); }

  /* ── Entry feed ──────────────────────────────────────────────────────── */
  .entry-feed {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .entry-card {
    position: relative;
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-left: 3px solid var(--card-color);
    border-radius: var(--app-radius);
  }

  /* Whole card header is the expand toggle */
  .entry-toggle {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    color: inherit;
    font: inherit;
    padding: 0.65rem 3.7rem 0.65rem 0.85rem;
    cursor: default;
  }
  .entry-toggle.expandable { cursor: pointer; }
  .entry-toggle:focus-visible {
    outline: 2px solid var(--app-accent);
    outline-offset: -2px;
    border-radius: var(--app-radius);
  }

  .entry-head {
    display: flex;
    align-items: center;
    gap: 0.55rem;
  }

  .chevron {
    font-size: 0.7rem;
    color: var(--app-muted-2);
    transition: transform 0.15s ease;
  }
  .chevron.open { transform: rotate(180deg); }

  .type-badge {
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--card-color);
    background: color-mix(in srgb, var(--card-color) 14%, transparent);
    border: 1px solid color-mix(in srgb, var(--card-color) 30%, transparent);
    border-radius: 3px;
    padding: 0.1rem 0.42rem;
    white-space: nowrap;
  }

  .entry-date {
    font-size: 0.75rem;
    color: var(--app-muted-2);
    margin-left: auto;
  }

  .entry-body {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .entry-title {
    font-size: 0.9rem;
    color: var(--app-text);
    word-break: break-word;
  }

  .entry-meta {
    font-size: 0.75rem;
    color: var(--app-muted);
    white-space: nowrap;
  }

  /* ── Expanded details ────────────────────────────────────────────────── */
  .entry-details {
    margin: 0 0.85rem;
    padding: 0.6rem 0 0.7rem;
    border-top: 1px solid var(--app-border);
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .detail-row {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .detail-row dt {
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--app-muted-2);
    margin: 0;
  }

  .detail-row dd {
    margin: 0;
    font-size: 0.86rem;
    color: var(--app-text);
    word-break: break-word;
  }
  .detail-row dd.multiline { white-space: pre-wrap; }

  /* ── Per-entry actions (always visible, touch-friendly) ──────────────── */
  .entry-actions {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    display: flex;
    gap: 0.1rem;
  }

  .btn-icon {
    width: 1.6rem;
    height: 1.6rem;
    display: grid;
    place-items: center;
    background: transparent;
    border: 1px solid transparent;
    color: var(--app-muted-2);
    font-size: 0.78rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.12s, color 0.12s;
  }
  .btn-icon:hover { background: var(--app-surface-2); color: var(--app-text); }
  .btn-del:hover { color: var(--app-error); }

  /* ── Modal overlay ───────────────────────────────────────────────────── */
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(0 0 0 / 0.6);
    display: grid;
    place-items: center;
    padding: 1rem;
  }

  .sheet {
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) * 2);
    width: 100%;
    max-width: 520px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }

  .sheet-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .sheet-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--app-text-strong);
  }

  .sheet-close {
    background: transparent;
    border: none;
    color: var(--app-muted);
    font-size: 0.9rem;
    cursor: pointer;
    padding: 0.2rem 0.4rem;
    border-radius: var(--app-radius);
  }
  .sheet-close:hover { background: var(--app-surface-2); }

  /* ── Type selector grid ──────────────────────────────────────────────── */
  .type-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.4rem;
  }

  .type-chip {
    padding: 0.4rem 0.3rem;
    font-size: 0.7rem;
    font-weight: 600;
    text-align: center;
    line-height: 1.3;
    background: var(--app-surface-2);
    border: 1px solid var(--app-border);
    border-radius: var(--app-radius);
    color: var(--app-muted);
    cursor: pointer;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }
  .type-chip:hover {
    color: var(--chip-color);
    border-color: var(--chip-color);
  }
  .type-chip.active {
    color: var(--chip-color);
    border-color: var(--chip-color);
    background: color-mix(in srgb, var(--chip-color) 12%, var(--app-surface-2));
  }

  /* ── Form fields ─────────────────────────────────────────────────────── */
  .form-fields {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .field-row {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .field-row label {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--app-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .field-row input,
  .field-row select,
  .field-row textarea {
    background: var(--app-surface-2);
    border: 1px solid var(--app-border);
    border-radius: var(--app-radius);
    color: var(--app-text);
    font-size: 0.88rem;
    padding: 0.45rem 0.65rem;
    font-family: var(--app-font-ui);
    width: 100%;
    box-sizing: border-box;
  }
  .field-row input:focus,
  .field-row select:focus,
  .field-row textarea:focus {
    outline: none;
    border-color: var(--app-accent);
  }
  .field-row textarea { resize: vertical; }

  /* ── Form actions ────────────────────────────────────────────────────── */
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
  }

  .btn-cancel {
    padding: 0.45rem 1rem;
    background: transparent;
    border: 1px solid var(--app-border);
    border-radius: var(--app-radius);
    color: var(--app-muted);
    font-size: 0.84rem;
    cursor: pointer;
  }
  .btn-cancel:hover { background: var(--app-surface-2); }

  .btn-save {
    padding: 0.45rem 1.2rem;
    background: var(--app-accent);
    border: none;
    border-radius: var(--app-radius);
    color: #fff;
    font-size: 0.84rem;
    font-weight: 700;
    cursor: pointer;
  }
  .btn-save:hover { filter: brightness(1.15); }

  @media (max-width: 480px) {
    .type-grid { grid-template-columns: repeat(2, 1fr); }
  }
</style>
