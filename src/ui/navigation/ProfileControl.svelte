<script>
  import { onDestroy } from 'svelte'
  import {
    authState,
    defaultDisplayNameFromEmail,
    signOutCurrentUser,
  } from '../../firebase/auth.js'
  import SignInForm from '../auth/SignInForm.svelte'

  let state = $state({ ready: false, configured: false, user: null, error: null })
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
    } catch (e) {
      error = e.message
    } finally {
      busy = false
    }
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
    <p><small><strong>On-device</strong> — notes, patches and your profile are kept in this browser.</small></p>
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
    <p><small>Notes, patches and your profile are kept in this browser. Sign in to keep them with your account instead.</small></p>
    <SignInForm />
  {/if}
</section>

<style>
  .profile-control {
    display: grid;
    gap: 0.45rem;
    padding-top: 0.55rem;
    border-top: 1px solid var(--app-border);
  }

  .profile-control p {
    margin: 0;
  }

  .profile-name {
    font-weight: 600;
    word-break: break-word;
  }

  .profile-link {
    display: block;
    padding: 0.4rem 0;
    font-size: 0.78rem;
    color: inherit;
    text-decoration: none;
  }
  .profile-link:hover { text-decoration: underline; }
</style>
