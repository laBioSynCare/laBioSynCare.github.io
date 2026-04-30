<script>
  import { onDestroy } from 'svelte'
  import {
    authState,
    createEmailAccount,
    defaultDisplayNameFromEmail,
    signInForAnnotations,
    signInWithEmail,
    signInWithGoogle,
    signOutCurrentUser,
  } from '../../firebase/auth.js'

  let state = $state({ ready: false, configured: false, user: null, error: null })
  let email = $state('')
  let password = $state('')
  let displayName = $state('')
  let busy = $state(false)
  let error = $state(null)

  const unsubscribe = authState.subscribe((value) => {
    state = value
    if (value.error) error = value.error.message
  })

  onDestroy(unsubscribe)

  async function runAuth(action) {
    error = null
    busy = true
    try {
      await action()
      password = ''
      displayName = ''
    } catch (e) {
      error = e.message
    } finally {
      busy = false
    }
  }

  function submitSignIn(event) {
    event.preventDefault()
    return runAuth(() => signInWithEmail(email, password))
  }

  function submitCreate() {
    return runAuth(() => createEmailAccount(email, password, displayName))
  }

  function submitAnonymous() {
    return runAuth(signInForAnnotations)
  }

  function submitGoogle() {
    return runAuth(signInWithGoogle)
  }

  function submitSignOut() {
    return runAuth(signOutCurrentUser)
  }

  const userLabel = $derived.by(() => {
    if (!state.user) return ''
    const name = state.user.displayName?.trim()
    if (name) return name
    if (state.user.email) return defaultDisplayNameFromEmail(state.user.email) || state.user.email
    if (state.user.isAnonymous) return 'Anonymous account'
    return 'Account'
  })

  const shortUid = $derived(state.user?.uid ? `${state.user.uid.slice(0, 8)}...` : '')
</script>

<section class="profile-control">
  <strong>Profile</strong>

  {#if !state.ready}
    <p><small>Loading account...</small></p>
  {:else if !state.configured}
    <p><small>Firebase is not configured for annotations.</small></p>
  {:else if state.user}
    <p class="profile-name">{userLabel}</p>
    <p><small>{state.user.isAnonymous ? 'Anonymous annotation account' : state.user.email ?? 'Signed in for annotations'}</small></p>
    {#if shortUid}
      <p><small>UID {shortUid}</small></p>
    {/if}
    <a class="profile-link" href="/profile/">Edit profile</a>
    <button type="button" class="secondary outline" onclick={submitSignOut} aria-busy={busy} disabled={busy}>
      Log out
    </button>
  {:else}
    <p><small>Sign in to save RDF annotations.</small></p>
    <form onsubmit={submitSignIn}>
      <label>
        Email
        <input type="email" autocomplete="email" bind:value={email} disabled={busy} />
      </label>
      <label>
        Password
        <input type="password" autocomplete="current-password" bind:value={password} disabled={busy} />
      </label>
      <label>
        Display name <span class="optional">(for new accounts)</span>
        <input
          type="text"
          autocomplete="nickname"
          bind:value={displayName}
          placeholder={defaultDisplayNameFromEmail(email) || 'Your name'}
          disabled={busy}
        />
        <small>Shown next to public notes you leave. Defaults to the part of your email before "@".</small>
      </label>
      {#if error}
        <small class="profile-error">{error}</small>
      {/if}
      <div class="profile-actions">
        <button type="submit" aria-busy={busy} disabled={busy || !email || !password}>Sign in</button>
        <button type="button" class="secondary" onclick={submitCreate} disabled={busy || !email || !password}>
          Create
        </button>
      </div>
    </form>
    <button type="button" class="secondary outline" onclick={submitGoogle} disabled={busy}>
      Google
    </button>
    <button type="button" class="secondary outline" onclick={submitAnonymous} disabled={busy}>
      Anonymous
    </button>
  {/if}
</section>

<style>
  .profile-control {
    display: grid;
    gap: 0.45rem;
    padding-top: 0.55rem;
    border-top: 1px solid #ffffff18;
  }

  .profile-control p {
    margin: 0;
  }

  .profile-name {
    font-weight: 600;
    word-break: break-word;
  }

  .profile-control label {
    display: block;
    margin-bottom: 0.35rem;
    font-size: 0.78rem;
  }

  .profile-control label > small {
    display: block;
    margin-top: 0.2rem;
    color: var(--pico-muted-color);
    font-size: 0.7rem;
  }

  .optional {
    color: var(--pico-muted-color);
    font-weight: 400;
    font-size: 0.7rem;
  }

  .profile-control input {
    min-height: 2rem;
    margin: 0.2rem 0 0;
    padding: 0.3rem 0.5rem;
    font-size: 0.8rem;
  }

  .profile-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4rem;
  }

  .profile-control button {
    width: 100%;
    min-height: 2rem;
    margin: 0;
    padding: 0.3rem 0.55rem;
    font-size: 0.78rem;
  }

  .profile-link {
    display: block;
    padding: 0.4rem 0;
    font-size: 0.78rem;
    color: inherit;
    text-decoration: none;
  }
  .profile-link:hover { text-decoration: underline; }

  .profile-error {
    display: block;
    margin-bottom: 0.4rem;
    color: var(--pico-color-red-500, #d33);
  }
</style>
