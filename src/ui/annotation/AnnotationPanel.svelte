<script>
  import { onDestroy } from 'svelte'
  import { authState, defaultDisplayNameFromEmail } from '../../firebase/auth.js'
  import { createAnnotationStore } from '../../rdf/annotations/AnnotationStore.js'

  function deriveDisplayName(user) {
    if (!user) return ''
    const name = user.displayName?.trim()
    if (name) return name
    return defaultDisplayNameFromEmail(user.email)
  }

  const { target, between } = $props()

  let auth = $state({ ready: false, configured: false, user: null, error: null })
  let annotations = $state([])
  let annotationText = $state('')
  let annotationVisibility = $state('private')
  let error = $state(null)
  let saving = $state(false)

  let editingId = $state(null)
  let editText = $state('')
  let editVisibility = $state('private')
  let editError = $state(null)

  const unsubscribeAuth = authState.subscribe((value) => {
    auth = value
  })

  $effect(() => {
    target?.iri
    editingId = null
    editError = null
  })

  $effect(() => {
    const targetIri = target?.iri
    const userId = auth.user?.uid ?? null
    annotations = []
    error = null

    if (!targetIri || !auth.configured) return

    let cancelled = false
    let unsubscribeAnnotations = null

    createAnnotationStore(userId)
      .then((store) => {
        if (cancelled) return
        unsubscribeAnnotations = store.subscribeForTarget(
          targetIri,
          (value) => {
            annotations = value
          },
          (e) => {
            error = e.message
          },
        )
      })
      .catch((e) => {
        if (!cancelled) error = e.message
      })

    return () => {
      cancelled = true
      unsubscribeAnnotations?.()
    }
  })

  onDestroy(unsubscribeAuth)

  async function saveAnnotation(event) {
    event.preventDefault()
    const text = annotationText.trim()
    if (!text || !auth.user || saving || !target?.iri) return

    saving = true
    error = null
    try {
      const store = await createAnnotationStore(auth.user.uid)
      await store.add({
        annotatesNode: target.iri,
        annotationType: 'commenting',
        annotationText: text,
        visibility: annotationVisibility,
        userDisplayName: deriveDisplayName(auth.user),
      })
      annotationText = ''
    } catch (e) {
      error = e.message
    } finally {
      saving = false
    }
  }

  function startEditing(annotation) {
    editingId = annotation.id
    editText = annotation.annotationText
    editVisibility = annotation.visibility
    editError = null
  }

  function cancelEditing() {
    editingId = null
    editError = null
  }

  async function saveEdit(event) {
    event.preventDefault()
    const text = editText.trim()
    if (!text || !auth.user || saving) return

    saving = true
    editError = null
    try {
      const store = await createAnnotationStore(auth.user.uid)
      await store.update(editingId, {
        annotationText: text,
        visibility: editVisibility,
      })
      editingId = null
    } catch (e) {
      editError = e.message
    } finally {
      saving = false
    }
  }

  async function removeAnnotation(id) {
    if (!auth.user || saving) return

    saving = true
    error = null
    try {
      const store = await createAnnotationStore(auth.user.uid)
      await store.remove(id)
    } catch (e) {
      error = e.message
    } finally {
      saving = false
    }
  }

  function shortDate(value) {
    if (!value) return ''
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  }

  function authorLabel(annotation) {
    if (auth.user?.uid === annotation.userId) return 'You'
    const name = annotation.userDisplayName?.trim()
    return name || 'Anonymous'
  }
</script>

<div class="annotations">
  {#if !auth.ready}
    <p class="status"><small>Loading account…</small></p>
  {:else if !auth.configured}
    <p class="status"><small>Firebase config required.</small></p>
  {:else}
    {#if auth.user && target?.iri}
      <form onsubmit={saveAnnotation} class="annotation-form">
        <textarea
          rows="3"
          placeholder="Add a note…"
          bind:value={annotationText}
          disabled={saving}
        ></textarea>
        <div class="form-row">
          <div class="visibility-toggle" role="radiogroup" aria-label="Note visibility">
            <button
              type="button"
              class="visibility-option"
              class:active={annotationVisibility === 'public'}
              role="radio"
              aria-checked={annotationVisibility === 'public'}
              onclick={() => (annotationVisibility = 'public')}
              title="Anyone can read this note"
            >Public</button>
            <button
              type="button"
              class="visibility-option"
              class:active={annotationVisibility === 'private'}
              role="radio"
              aria-checked={annotationVisibility === 'private'}
              onclick={() => (annotationVisibility = 'private')}
              title="Only you can read this note"
            >Private</button>
          </div>
          <button type="submit" aria-busy={saving} disabled={saving || !annotationText.trim()}>
            Save note
          </button>
        </div>
      </form>
    {:else if auth.user}
      <p class="status"><small>No annotatable IRI selected.</small></p>
    {:else}
      <p class="status"><small>Sign in to add or edit notes.</small></p>
    {/if}

    {#if error}
      <p class="annotation-error"><small>{error}</small></p>
    {/if}
  {/if}

  {#if between}
    <div class="annotation-between">
      {@render between()}
    </div>
  {/if}

  {#if auth.configured && annotations.length}
    <ul class="notes-list">
      {#each annotations as annotation (annotation.id)}
        {@const isMine = auth.user?.uid === annotation.userId}
        <li class:editing={editingId === annotation.id}>
          {#if editingId === annotation.id}
            <form onsubmit={saveEdit} class="edit-form">
              <textarea
                rows="3"
                bind:value={editText}
                disabled={saving}
              ></textarea>
              <div class="form-row">
                <div class="visibility-toggle" role="radiogroup" aria-label="Note visibility">
                  <button
                    type="button"
                    class="visibility-option"
                    class:active={editVisibility === 'public'}
                    role="radio"
                    aria-checked={editVisibility === 'public'}
                    onclick={() => (editVisibility = 'public')}
                  >Public</button>
                  <button
                    type="button"
                    class="visibility-option"
                    class:active={editVisibility === 'private'}
                    role="radio"
                    aria-checked={editVisibility === 'private'}
                    onclick={() => (editVisibility = 'private')}
                  >Private</button>
                </div>
                <div class="edit-actions">
                  <button type="button" class="secondary outline" onclick={cancelEditing} disabled={saving}>Cancel</button>
                  <button type="submit" aria-busy={saving} disabled={saving || !editText.trim()}>Save</button>
                </div>
              </div>
              {#if editError}
                <p class="annotation-error"><small>{editError}</small></p>
              {/if}
            </form>
          {:else}
            <p class="note-text">{annotation.annotationText}</p>
            <div class="note-meta">
              <span class="meta-line">
                <span class="author">{authorLabel(annotation)}</span>
                <span class="dot" aria-hidden="true">·</span>
                <span class="visibility-chip {annotation.visibility}">{annotation.visibility}</span>
                <span class="dot" aria-hidden="true">·</span>
                <span>{shortDate(annotation.updatedAt || annotation.createdAt)}</span>
              </span>
              {#if isMine}
                <span class="actions">
                  <button type="button" class="link-btn" onclick={() => startEditing(annotation)} disabled={saving}>Edit</button>
                  <button type="button" class="link-btn danger" onclick={() => removeAnnotation(annotation.id)} disabled={saving}>Delete</button>
                </span>
              {/if}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .annotations {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .annotation-form,
  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin: 0;
  }

  .annotation-form textarea,
  .edit-form textarea {
    margin: 0;
    padding: 0.5rem 0.6rem;
    font-size: 0.85rem;
    line-height: 1.35;
    resize: vertical;
  }

  .form-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .visibility-toggle {
    display: inline-flex;
    border: 1px solid var(--app-border);
    border-radius: 0.35rem;
    overflow: hidden;
  }

  .visibility-option {
    margin: 0;
    padding: 0.32rem 0.6rem;
    font-size: 0.7rem;
    font-weight: 500;
    background: transparent;
    border: none;
    color: var(--pico-muted-color);
    cursor: pointer;
    line-height: 1;
    width: auto;
  }
  .visibility-option:hover { background: var(--app-surface-3); color: var(--app-text); }
  .visibility-option.active {
    background: var(--app-surface-3);
    color: var(--app-text-strong);
  }
  .visibility-option + .visibility-option {
    border-left: 1px solid var(--app-border);
  }

  .annotation-form > .form-row > button[type="submit"],
  .edit-form .edit-actions button {
    margin: 0;
    padding: 0.35rem 0.7rem;
    font-size: 0.78rem;
    width: auto;
  }

  .edit-actions {
    display: flex;
    gap: 0.35rem;
  }

  .annotation-between {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .status {
    margin: 0;
  }

  .notes-list {
    display: grid;
    gap: 0.45rem;
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .notes-list li {
    padding: 0.55rem 0.65rem;
    border: 1px solid var(--app-border);
    border-radius: 0.35rem;
  }
  .notes-list li.editing {
    border-color: var(--app-accent);
    background: var(--app-surface-2);
  }

  .note-text {
    margin: 0 0 0.4rem;
    font-size: 0.82rem;
    line-height: 1.4;
    white-space: pre-wrap;
  }

  .note-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 0.7rem;
  }

  .meta-line {
    display: inline-flex;
    align-items: center;
    gap: 0.32rem;
    color: var(--pico-muted-color);
    flex-wrap: wrap;
  }

  .author {
    font-weight: 600;
    color: var(--app-text);
  }

  .meta-line .dot {
    opacity: 0.5;
  }

  .visibility-chip {
    padding: 0.05rem 0.4rem;
    border-radius: 0.85rem;
    font-size: 0.62rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border: 1px solid var(--app-border);
    color: var(--pico-muted-color);
  }
  .visibility-chip.public {
    color: var(--app-accent);
    border-color: color-mix(in srgb, var(--app-accent) 45%, transparent);
    background: color-mix(in srgb, var(--app-accent) 12%, transparent);
  }
  .visibility-chip.private {
    color: var(--app-warn);
    border-color: color-mix(in srgb, var(--app-warn) 45%, transparent);
    background: color-mix(in srgb, var(--app-warn) 12%, transparent);
  }

  .actions {
    display: inline-flex;
    gap: 0.55rem;
    flex-shrink: 0;
  }

  .link-btn {
    width: auto;
    margin: 0;
    padding: 0;
    background: transparent;
    border: none;
    color: var(--pico-muted-color);
    cursor: pointer;
    font-size: 0.7rem;
  }
  .link-btn:hover { color: var(--app-text); text-decoration: underline; }
  .link-btn.danger:hover { color: var(--app-error); }
  .link-btn:disabled { opacity: 0.5; cursor: default; text-decoration: none; }

  .annotation-error {
    margin: 0;
    color: var(--pico-color-red-500, #d33);
  }
</style>
