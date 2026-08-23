<script>
  // Sign-in is requested through the identity seam, so this form works for any
  // provider that reports canSignIn — it never learns which one is active.
  import { signIn } from '../../identity/identityState.js'

  /** Placeholder hint from whatever has been typed. Presentation, not identity. */
  const nameHintFrom = (value) =>
    typeof value === 'string' && value.includes('@') ? value.split('@')[0] : ''

  let email       = $state('')
  let password    = $state('')
  let displayName = $state('')
  let busy        = $state(false)
  let error       = $state(null)

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
    return runAuth(() => signIn({ method: 'email', email, password }))
  }

  function submitCreate() {
    return runAuth(() => signIn({ method: 'create', email, password, displayName }))
  }

  function submitGoogle() {
    return runAuth(() => signIn({ method: 'google' }))
  }
</script>

<div class="sif">
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
      Display name
      <input
        type="text"
        autocomplete="nickname"
        bind:value={displayName}
        placeholder={nameHintFrom(email) || 'Your name (new accounts)'}
        disabled={busy}
      />
    </label>
    {#if error}
      <small class="sif-error">{error}</small>
    {/if}
    <div class="sif-actions">
      <button type="submit" class="sif-btn-primary" aria-busy={busy} disabled={busy || !email || !password}>
        Sign in
      </button>
      <button type="button" class="sif-btn-secondary" onclick={submitCreate} disabled={busy || !email || !password}>
        Create account
      </button>
    </div>
  </form>

  <button type="button" class="sif-btn-google" onclick={submitGoogle} disabled={busy}>
    Sign in with Google
  </button>
</div>

<style>
  .sif {
    display: grid;
    gap: 0.65rem;
  }

  .sif form {
    display: grid;
    gap: 0.55rem;
  }

  .sif label {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--app-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0;
  }

  .sif input {
    min-height: 2rem;
    margin: 0.15rem 0 0;
    padding: 0.4rem 0.6rem;
    font-size: 0.88rem;
    background: var(--app-surface-2);
    border: 1px solid var(--app-border);
    border-radius: var(--app-radius);
    color: var(--app-text);
    font-family: var(--app-font-ui);
    box-sizing: border-box;
    width: 100%;
  }

  .sif input:focus {
    outline: none;
    border-color: var(--app-accent);
  }

  .sif-error {
    display: block;
    color: var(--app-error);
    font-size: 0.8rem;
    font-weight: 500;
    text-transform: none;
    letter-spacing: 0;
  }

  .sif-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin-top: 0.1rem;
  }

  .sif-btn-primary,
  .sif-btn-secondary,
  .sif-btn-google {
    width: 100%;
    margin: 0;
    padding: 0.45rem 0.6rem;
    font-size: 0.84rem;
    font-family: var(--app-font-ui);
    border-radius: var(--app-radius);
    cursor: pointer;
    transition: filter 0.12s, background 0.12s;
  }

  .sif-btn-primary {
    background: var(--app-accent);
    border: none;
    color: #fff;
    font-weight: 700;
  }

  .sif-btn-primary:hover:not(:disabled) { filter: brightness(1.15); }
  .sif-btn-primary:disabled             { opacity: 0.5; cursor: default; }

  .sif-btn-secondary {
    background: transparent;
    border: 1px solid var(--app-border);
    color: var(--app-text);
    font-weight: 600;
  }

  .sif-btn-secondary:hover:not(:disabled) { background: var(--app-surface-3); }
  .sif-btn-secondary:disabled             { opacity: 0.5; cursor: default; }

  .sif-btn-google {
    background: transparent;
    border: 1px solid var(--app-border);
    color: var(--app-muted);
    font-weight: 500;
  }

  .sif-btn-google:hover:not(:disabled) { background: var(--app-surface-3); color: var(--app-text); }
  .sif-btn-google:disabled             { opacity: 0.5; cursor: default; }
</style>
