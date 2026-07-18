<script>
  // Lightweight alternative to sending newcomers straight to the full
  // CONTRIBUTING.md (373 lines, mostly aimed at the software/ontology
  // layers). Collects a plain-language protocol idea and hands it to
  // GitHub Issues as a prefilled draft the visitor reviews before posting —
  // no backend, consistent with the static-hosting constraint (CLAUDE.md §2).
  const { open = false, onClose } = $props()

  const ISSUE_BASE = 'https://github.com/laBioSynCare/laBioSynCare.github.io/issues/new'
  const TEMPLATE_CHOOSER =
    'https://github.com/laBioSynCare/laBioSynCare.github.io/issues/new/choose'
  const CONTRIBUTING_URL =
    'https://github.com/laBioSynCare/laBioSynCare.github.io/blob/main/CONTRIBUTING.md'

  let name = $state('')
  let description = $state('')
  let contact = $state('')

  function reset() {
    name = ''
    description = ''
    contact = ''
  }

  function close() {
    onClose?.()
  }

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) close()
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') close()
  }

  function buildIssueUrl() {
    const title = 'Protocol: ' + (name.trim() || 'untitled')
    const body =
      `## Protocol name\n\n${name.trim()}\n\n` +
      `## What is it?\n\n${description.trim()}\n\n` +
      (contact.trim() ? `## Contact\n\n${contact.trim()}\n\n` : '') +
      `---\n_Submitted via the BSC Lab "Contribute a protocol" form._`
    const params = new URLSearchParams({ title, body })
    return `${ISSUE_BASE}?${params.toString()}`
  }

  function submit(event) {
    event.preventDefault()
    if (!name.trim() || !description.trim()) return
    window.open(buildIssueUrl(), '_blank', 'noopener')
    reset()
    close()
  }
</script>

{#if open}
  <div
    class="contribute-overlay"
    role="presentation"
    onclick={handleOverlayClick}
    onkeydown={handleKeydown}
  >
    <div class="contribute-card" role="dialog" aria-label="Contribute a protocol" aria-modal="true">
      <header class="contribute-header">
        <h3>Contribute a protocol</h3>
        <button type="button" class="contribute-close" aria-label="Close" onclick={close}>✕</button>
      </header>

      <p class="contribute-intro">
        Describe your idea in plain language. It opens a draft on GitHub Issues for
        you to review and post — nothing is sent automatically. A maintainer will
        follow up from there.
      </p>

      <form onsubmit={submit}>
        <label>
          Protocol name
          <input type="text" bind:value={name} maxlength="120" required placeholder="e.g. Evening wind-down, low delta" />
        </label>
        <label>
          What is it?
          <textarea
            bind:value={description}
            rows="4"
            required
            placeholder="The technique, what it's meant to support, roughly how a session runs."
          ></textarea>
        </label>
        <label>
          Contact <span class="optional">(optional)</span>
          <input type="text" bind:value={contact} maxlength="200" placeholder="Email, GitHub handle, or leave blank" />
        </label>
        <div class="contribute-actions">
          <button type="submit" disabled={!name.trim() || !description.trim()}>
            Open as a GitHub issue draft
          </button>
        </div>
      </form>

      <p class="contribute-alt">
        Prefer to write it directly? <a href={TEMPLATE_CHOOSER} rel="external">Open a blank issue</a>
        · <a href={CONTRIBUTING_URL} rel="external">read the full contribution guide</a>
      </p>
    </div>
  </div>
{/if}

<style>
  .contribute-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: #00000066;
  }

  .contribute-card {
    width: min(480px, 100%);
    max-height: 88vh;
    overflow-y: auto;
    background: var(--app-surface);
    color: var(--app-text);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    padding: 1.25rem 1.35rem 1.5rem;
    font-family: var(--app-font-ui);
  }

  .contribute-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.6rem;
  }

  .contribute-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--app-text-strong);
  }

  .contribute-close {
    background: none;
    border: none;
    color: var(--app-muted);
    font-size: 1rem;
    cursor: pointer;
    padding: 0.2rem 0.4rem;
  }

  .contribute-intro {
    font-size: 0.88rem;
    line-height: 1.55;
    color: var(--app-muted);
    margin: 0 0 1.1rem;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--app-text-strong);
  }

  .optional {
    font-weight: 400;
    color: var(--app-muted);
  }

  input,
  textarea {
    font-family: var(--app-font-ui);
    font-size: 0.92rem;
    font-weight: 400;
    padding: 0.5rem 0.6rem;
    border-radius: var(--app-radius);
    border: var(--app-border-width) solid var(--app-border);
    background: var(--app-bg);
    color: var(--app-text);
    resize: vertical;
  }

  .contribute-actions {
    margin-top: 0.2rem;
  }

  .contribute-actions button {
    font-size: 0.88rem;
    font-weight: 700;
    padding: 0.55rem 1rem;
    width: 100%;
  }

  .contribute-alt {
    margin: 1.1rem 0 0;
    font-size: 0.78rem;
    color: var(--app-muted);
    text-align: center;
  }
</style>
