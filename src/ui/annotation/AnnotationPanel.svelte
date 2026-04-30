<script>
  import { onDestroy } from 'svelte'
  import { authState } from '../../firebase/auth.js'
  import { createAnnotationStore } from '../../rdf/annotations/AnnotationStore.js'

  const { target, between } = $props()

  let auth = $state({ ready: false, configured: false, user: null, error: null })
  let annotations = $state([])
  let annotationText = $state('')
  let error = $state(null)
  let saving = $state(false)

  const unsubscribeAuth = authState.subscribe((value) => {
    auth = value
  })

  $effect(() => {
    const targetIri = target?.iri
    const userId = auth.user?.uid
    annotations = []
    error = null

    if (!targetIri || !userId || !auth.configured) return

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
    if (!text || !auth.user || saving) return

    saving = true
    error = null
    try {
      const store = await createAnnotationStore(auth.user.uid)
      await store.add({
        annotatesNode: target.iri,
        annotationType: 'commenting',
        annotationText: text,
      })
      annotationText = ''
    } catch (e) {
      error = e.message
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
</script>

<div class="annotations">
  {#if !auth.ready}
    <p class="status"><small>Loading account…</small></p>
  {:else if !auth.configured}
    <p class="status"><small>Firebase config required.</small></p>
  {:else if !auth.user}
    <p class="status"><small>Sign in to save notes.</small></p>
  {:else}
    <form onsubmit={saveAnnotation} class="annotation-form">
      <textarea
        rows="3"
        placeholder="Add a note…"
        bind:value={annotationText}
        disabled={saving}
      ></textarea>
      <button type="submit" aria-busy={saving} disabled={saving || !annotationText.trim()}>
        Save note
      </button>
    </form>
    {#if error}
      <p class="annotation-error"><small>{error}</small></p>
    {/if}
  {/if}

  {#if between}
    <div class="annotation-between">
      {@render between()}
    </div>
  {/if}

  {#if auth.user && auth.configured && annotations.length}
    <ul class="notes-list">
      {#each annotations as annotation}
        <li>
          <p>{annotation.annotationText}</p>
          <div class="note-meta">
            <small>{shortDate(annotation.createdAt)}</small>
            <button type="button" class="secondary outline" onclick={() => removeAnnotation(annotation.id)} disabled={saving}>
              Delete
            </button>
          </div>
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

  .annotation-form {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin: 0;
  }

  .annotation-form textarea {
    margin: 0;
    padding: 0.5rem 0.6rem;
    font-size: 0.85rem;
    line-height: 1.35;
    resize: vertical;
  }

  .annotation-form button {
    margin: 0;
    padding: 0.35rem 0.7rem;
    font-size: 0.78rem;
    align-self: flex-end;
    width: auto;
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
    padding: 0.5rem 0.6rem;
    border: 1px solid #ffffff18;
    border-radius: 0.35rem;
  }

  .notes-list li p {
    margin: 0 0 0.35rem;
    font-size: 0.82rem;
    line-height: 1.4;
    white-space: pre-wrap;
  }

  .note-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .note-meta small {
    color: var(--pico-muted-color);
    font-size: 0.7rem;
  }

  .note-meta button {
    width: auto;
    margin: 0;
    padding: 0.18rem 0.45rem;
    font-size: 0.7rem;
  }

  .annotation-error {
    margin: 0;
    color: var(--pico-color-red-500, #d33);
  }
</style>
