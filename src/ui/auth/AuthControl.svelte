<script>
  import { onDestroy } from 'svelte'
  import {
    authState,
    createEmailAccount,
    signInForAnnotations,
    signInWithEmail,
    signOutCurrentUser,
  } from '../../firebase/auth.js'

  let state = $state({ ready: false, configured: false, user: null, error: null })
  let email = $state('')
  let password = $state('')
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
    return runAuth(() => createEmailAccount(email, password))
  }

  function submitAnonymous() {
    return runAuth(signInForAnnotations)
  }

  function submitSignOut() {
    return runAuth(signOutCurrentUser)
  }

  const userLabel = $derived(
    state.user?.email || state.user?.displayName || (state.user?.isAnonymous ? 'Anonymous' : 'Account')
  )
</script>

{#if !state.ready}
  <small class="auth-muted">Account...</small>
{:else if !state.configured}
  <small class="auth-muted" title="Set VITE_FIREBASE_* values to enable RDF annotations">Annotations off</small>
{:else if state.user}
  <details class="auth-menu">
    <summary>{userLabel}</summary>
    <button type="button" class="secondary outline" onclick={submitSignOut} aria-busy={busy} disabled={busy}>
      Sign out
    </button>
  </details>
{:else}
  <details class="auth-menu">
    <summary>Sign in</summary>
    <form onsubmit={submitSignIn}>
      <label>
        Email
        <input type="email" autocomplete="email" bind:value={email} disabled={busy} />
      </label>
      <label>
        Password
        <input type="password" autocomplete="current-password" bind:value={password} disabled={busy} />
      </label>
      {#if error}
        <small class="auth-error">{error}</small>
      {/if}
      <div class="auth-actions">
        <button type="submit" aria-busy={busy} disabled={busy || !email || !password}>Sign in</button>
        <button type="button" class="secondary" onclick={submitCreate} disabled={busy || !email || !password}>
          Create
        </button>
      </div>
      <button type="button" class="secondary outline anon" onclick={submitAnonymous} disabled={busy}>
        Anonymous
      </button>
    </form>
  </details>
{/if}

<style>
  .auth-muted {
    color: var(--pico-muted-color);
    white-space: nowrap;
  }

  .auth-menu {
    position: relative;
    margin: 0;
  }

  .auth-menu summary {
    cursor: pointer;
    white-space: nowrap;
  }

  .auth-menu form,
  .auth-menu > button {
    position: absolute;
    right: 0;
    z-index: 20;
    width: min(18rem, calc(100vw - 2rem));
    margin-top: 0.6rem;
    padding: 0.8rem;
    border: 1px solid var(--pico-muted-border-color);
    border-radius: 0.35rem;
    background: var(--pico-card-background-color);
    box-shadow: 0 0.6rem 1.5rem #0004;
  }

  .auth-menu label {
    margin-bottom: 0.45rem;
  }

  .auth-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .auth-actions button,
  .anon,
  .auth-menu > button {
    margin-bottom: 0;
  }

  .anon {
    width: 100%;
    margin-top: 0.5rem;
  }

  .auth-error {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--pico-color-red-500, #d33);
  }
</style>
