<script>
  import { onDestroy } from 'svelte'
  import { authState } from '../../firebase/auth.js'
  import { createAnnotationStore } from '../../rdf/annotations/AnnotationStore.js'

  const { target } = $props()

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

<section class="annotations">
  <h4>Annotations</h4>

  {#if !auth.ready}
    <p><small>Loading account...</small></p>
  {:else if !auth.configured}
    <p><small>Firebase config required.</small></p>
  {:else if !auth.user}
    <p><small>Sign in to save notes.</small></p>
  {:else}
    <form onsubmit={saveAnnotation}>
      <textarea
        rows="4"
        placeholder="Add a note..."
        bind:value={annotationText}
        disabled={saving}
      ></textarea>
      <button type="submit" aria-busy={saving} disabled={saving || !annotationText.trim()}>
        Save
      </button>
    </form>

    {#if error}
      <p class="annotation-error"><small>{error}</small></p>
    {/if}

    <ul>
      {#each annotations as annotation}
        <li>
          <p>{annotation.annotationText}</p>
          <div>
            <small>{shortDate(annotation.createdAt)}</small>
            <button type="button" class="secondary outline" onclick={() => removeAnnotation(annotation.id)} disabled={saving}>
              Delete
            </button>
          </div>
        </li>
      {:else}
        <li class="empty"><small>No notes yet.</small></li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .annotations {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #ffffff18;
  }

  .annotations h4 {
    margin: 0 0 0.6rem;
    font-size: 0.95rem;
  }

  .annotations textarea {
    resize: vertical;
  }

  .annotations button {
    margin-bottom: 0;
  }

  .annotations ul {
    display: grid;
    gap: 0.7rem;
    padding: 0;
    margin: 0.9rem 0 0;
    list-style: none;
  }

  .annotations li {
    padding: 0.65rem;
    border: 1px solid #ffffff18;
    border-radius: 0.35rem;
  }

  .annotations li p {
    margin: 0 0 0.45rem;
    white-space: pre-wrap;
  }

  .annotations li div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .annotations li button {
    width: auto;
    padding: 0.25rem 0.45rem;
    font-size: 0.75rem;
  }

  .empty {
    color: var(--pico-muted-color);
  }

  .annotation-error {
    color: var(--pico-color-red-500, #d33);
  }
</style>
