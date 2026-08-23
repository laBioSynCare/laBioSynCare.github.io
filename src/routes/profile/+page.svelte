<script>
  import { onDestroy } from 'svelte'
  import { identityState, updateIdentityProfile, identityCapabilities } from '../../identity/identityState.js'
  import { pendingState } from '../../identity/IdentityProvider.js'
  import { loadProfile, saveProfile } from '../../firebase/profile.js'

  let auth = $state(pendingState('anonymous'))
  let loading = $state(false)
  let saving = $state(false)
  let error = $state(null)
  let savedAt = $state(null)

  let displayName = $state('')
  let bio = $state('')
  let affiliation = $state('')
  let initialDisplayName = $state('')

  let lastLoadedUid = null

  const unsubscribeAuth = identityState.subscribe((value) => {
    auth = value
  })

  $effect(() => {
    if (!auth.ready) return
    // A signed-out profile is the local one — the display name attached to
    // annotations written on this device.
    const uid = auth.identity.subject
    const loadKey = uid ?? 'local'
    if (loadKey === lastLoadedUid) return
    lastLoadedUid = loadKey

    loading = true
    error = null
    loadProfile(uid)
      .then((profile) => {
        const fallback = auth.identity.displayName
        const stored = profile?.displayName?.trim() ?? ''
        displayName = stored || fallback
        bio = profile?.bio ?? ''
        affiliation = profile?.affiliation ?? ''
        initialDisplayName = displayName
      })
      .catch((e) => {
        error = e.message
      })
      .finally(() => {
        loading = false
      })
  })

  onDestroy(unsubscribeAuth)

  async function handleSubmit(event) {
    event.preventDefault()
    if (saving) return
    saving = true
    error = null
    savedAt = null
    try {
      await saveProfile(auth.identity.subject, {
        displayName,
        bio,
        affiliation,
        email: auth.identity.email ?? '',
      })
      const cleanedName = (displayName ?? '').trim()
      if (cleanedName !== initialDisplayName) {
        await updateIdentityProfile({ displayName: cleanedName })
        initialDisplayName = cleanedName
      }
      savedAt = new Date()
    } catch (e) {
      error = e.message
    } finally {
      saving = false
    }
  }
</script>

<svelte:head>
  <title>Profile · BSC Lab</title>
</svelte:head>

<main class="profile-page">
  <header>
    <h1>Profile</h1>
    <p class="lead">
      A short bio helps people who read the public notes you leave on the
      ontology graph understand whose interpretation they're seeing.
    </p>
  </header>

  {#if !auth.ready}
    <p>Loading…</p>
  {:else if loading}
    <p>Loading profile…</p>
  {:else}
    <form onsubmit={handleSubmit} class="profile-form">
      <label>
        Display name
        <input
          type="text"
          bind:value={displayName}
          maxlength="200"
          placeholder={auth.identity.email?.split('@')[0] ?? 'Your name'}
          disabled={saving}
        />
        <small>Shown next to public notes you leave. Falls back to the part of your email before "@".</small>
      </label>

      <label>
        Affiliation <span class="optional">(optional)</span>
        <input
          type="text"
          bind:value={affiliation}
          maxlength="200"
          placeholder="Lab, university, or company"
          disabled={saving}
        />
      </label>

      <label>
        Bio <span class="optional">(optional)</span>
        <textarea
          bind:value={bio}
          rows="6"
          maxlength="4000"
          placeholder="A few sentences about your background and what brings you to the ontology — visible only to you for now."
          disabled={saving}
        ></textarea>
      </label>

      <p class="email-row">
        <small>
          {#if auth.identity.authenticated}
            Account: {auth.identity.email ?? '(no email on this account)'}
          {:else}
            Kept on this device. Sign in to keep your profile with an account.
          {/if}
        </small>
      </p>

      {#if error}
        <p class="profile-error"><small>{error}</small></p>
      {/if}
      {#if savedAt}
        <p class="profile-status"><small>Saved at {savedAt.toLocaleTimeString()}.</small></p>
      {/if}

      <div class="actions">
        <a class="back-link" href="/graph/">Back to graph</a>
        <button type="submit" aria-busy={saving} disabled={saving}>Save profile</button>
      </div>
    </form>
  {/if}
</main>

<style>
  .profile-page {
    max-width: 38rem;
    margin: 0 auto;
    padding: 1.5rem 1.25rem 3rem;
  }

  .profile-page h1 {
    margin: 0 0 0.4rem;
    font-size: 1.4rem;
  }

  .lead {
    margin: 0 0 1.5rem;
    color: var(--pico-muted-color);
    line-height: 1.5;
    font-size: 0.92rem;
  }

  .profile-form {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    margin: 0;
  }

  .profile-form label {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: 0.85rem;
    font-weight: 500;
    margin: 0;
  }

  .profile-form input,
  .profile-form textarea {
    margin: 0;
    padding: 0.55rem 0.7rem;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .profile-form textarea {
    resize: vertical;
  }

  .profile-form small {
    color: var(--pico-muted-color);
    font-size: 0.75rem;
    font-weight: 400;
  }

  .optional {
    color: var(--pico-muted-color);
    font-weight: 400;
    font-size: 0.78rem;
  }

  .email-row {
    margin: 0;
    color: var(--pico-muted-color);
  }

  .actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    margin-top: 0.5rem;
  }

  .actions button {
    width: auto;
    margin: 0;
  }

  .back-link {
    font-size: 0.85rem;
    color: var(--pico-muted-color);
    text-decoration: none;
  }
  .back-link:hover { color: var(--app-text, #ececec); text-decoration: underline; }

  .profile-error {
    margin: 0;
    color: var(--pico-color-red-500, #d33);
  }
  .profile-status {
    margin: 0;
    color: var(--pico-muted-color);
  }
</style>
