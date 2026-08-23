<script>
  import { onDestroy } from 'svelte'
  import { identityState, identityCapabilities, signOut } from '../../identity/identityState.js'
  import { pendingState } from '../../identity/IdentityProvider.js'
  import SignInForm from '../auth/SignInForm.svelte'

  let state = $state(pendingState('anonymous'))
  let busy = $state(false)
  let error = $state(null)

  const unsubscribe = identityState.subscribe((value) => {
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
    return runAuth(signOut)
  }

  const userLabel = $derived.by(() => {
    if (!state.identity.authenticated) return ''
    const name = state.identity.displayName?.trim()
    if (name) return name
    if (state.identity.displayName) return state.identity.displayName
    if (state.identity.email) return state.identity.email
    return 'Account'
  })

  const shortUid = $derived('')
</script>

<section class="profile-control">
  <strong>Profile</strong>

  {#if !state.ready}
    <p><small>Loading account...</small></p>
  {:else if !identityCapabilities().canSignIn}
    <p><small><strong>On-device</strong> — notes, patches and your profile are kept in this browser.</small></p>
  {:else if state.identity.authenticated}
    <p class="profile-name">{userLabel}</p>
    <p><small>{state.identity.email ?? 'Signed in for annotations'}</small></p>
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
