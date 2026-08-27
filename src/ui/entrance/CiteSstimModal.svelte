<script>
  // "Cite SSTIM" used to be a bare link straight to the namespace IRI —
  // useful for machines, useless for a human who wants to know what to put
  // in a bibliography. This surfaces the actual citation forms from
  // CITATION.cff / README.md's "Citation And License" section in place,
  // same overlay/card pattern as ContributeProtocolModal.
  import {
    CONCEPT_DOI,
    NAMESPACE_IRI,
    RELEASE_DATE,
    RELEASE_TITLE as TITLE,
    RELEASE_VERSION as VERSION,
    VERSION_DOI,
    VERSION_IRI,
  } from './releaseMetadata.js'
  import { GITHUB_URL } from '../externalLinks.js'

  const { open = false, onClose } = $props()

  const README_CITATION_URL = `${GITHUB_URL}#citation-and-license`

  const PLAIN_CITATION =
    `Fabbri, R. (2026). ${TITLE} ` +
    `(Version ${VERSION}) [Software]. https://doi.org/${VERSION_DOI}`

  const BIBTEX =
    `@software{fabbri_sstim_workbench,\n` +
    `  author  = {Fabbri, Renato},\n` +
    `  title   = {{${TITLE}}},\n` +
    `  version = {${VERSION}},\n` +
    `  date    = {${RELEASE_DATE}},\n` +
    `  doi     = {${VERSION_DOI}},\n` +
    `  url     = {${VERSION_IRI}},\n` +
    `  license = {CC-BY-4.0}\n` +
    `}`

  let copied = $state('')
  let copyTimer

  async function copy(text, which) {
    try {
      await navigator.clipboard.writeText(text)
      copied = which
      clearTimeout(copyTimer)
      copyTimer = setTimeout(() => { copied = '' }, 1400)
    } catch (e) {
      console.warn('Clipboard copy failed', e)
    }
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
</script>

{#if open}
  <div class="cite-overlay" role="presentation" onclick={handleOverlayClick} onkeydown={handleKeydown}>
    <div class="cite-card" role="dialog" aria-label="Cite SSTIM" aria-modal="true">
      <header class="cite-header">
        <h3>Cite SSTIM</h3>
        <button type="button" class="cite-close" aria-label="Close" onclick={close}>✕</button>
      </header>

      <p class="cite-intro">
        Cite the specific release you used — <strong>v{VERSION}</strong>. Use the
        concept DOI instead if you're referring to SSTIM across releases. The
        immutable release keeps its published historical title; the repository
        migration does not rewrite DOI metadata or released artifacts.
      </p>

      <div class="cite-block">
        <div class="cite-block-header">
          <span>Citation</span>
          <button type="button" class="copy-btn" onclick={() => copy(PLAIN_CITATION, 'plain')}>
            {copied === 'plain' ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p class="cite-text">{PLAIN_CITATION}</p>
      </div>

      <div class="cite-block">
        <div class="cite-block-header">
          <span>BibTeX</span>
          <button type="button" class="copy-btn" onclick={() => copy(BIBTEX, 'bibtex')}>
            {copied === 'bibtex' ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre class="cite-code">{BIBTEX}</pre>
      </div>

      <dl class="cite-meta">
        <div>
          <dt>Version DOI</dt>
          <dd><a href="https://doi.org/{VERSION_DOI}" rel="external">{VERSION_DOI}</a></dd>
        </div>
        <div>
          <dt>Concept DOI (all versions)</dt>
          <dd><a href="https://doi.org/{CONCEPT_DOI}" rel="external">{CONCEPT_DOI}</a></dd>
        </div>
        <div>
          <dt>Stable namespace</dt>
          <dd><a href={NAMESPACE_IRI} rel="external">{NAMESPACE_IRI}</a></dd>
        </div>
      </dl>

      <p class="cite-alt">
        Imported software retains Apache-2.0; imported ontology, vocabulary, and documentation retain CC BY 4.0. W3C contribution terms are artifact-specific.
        <a href={README_CITATION_URL} rel="external">Full citation & license details</a>
      </p>
    </div>
  </div>
{/if}

<style>
  .cite-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: #00000066;
  }

  .cite-card {
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

  .cite-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.6rem;
  }

  .cite-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--app-text-strong);
  }

  .cite-close {
    background: none;
    border: none;
    color: var(--app-muted);
    font-size: 1rem;
    cursor: pointer;
    padding: 0.2rem 0.4rem;
  }

  .cite-intro {
    font-size: 0.88rem;
    line-height: 1.55;
    color: var(--app-muted);
    margin: 0 0 1.1rem;
  }

  .cite-block {
    margin: 0 0 0.9rem;
  }

  .cite-block-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--app-text-strong);
    margin: 0 0 0.3rem;
  }

  .copy-btn {
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.2rem 0.55rem;
    background: var(--app-accent-soft);
    color: var(--app-accent);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    cursor: pointer;
  }

  .cite-text {
    font-size: 0.84rem;
    line-height: 1.5;
    color: var(--app-text);
    background: var(--app-bg);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    padding: 0.6rem 0.7rem;
    margin: 0;
  }

  .cite-code {
    font-family: var(--app-font-mono);
    font-size: 0.78rem;
    line-height: 1.5;
    color: var(--app-text);
    background: var(--app-bg);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    padding: 0.6rem 0.7rem;
    margin: 0;
    overflow-x: auto;
    white-space: pre;
  }

  .cite-meta {
    margin: 0 0 1rem;
    font-size: 0.8rem;
  }

  .cite-meta div {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.3rem 0;
    border-bottom: var(--app-border-width) solid var(--app-border);
  }

  .cite-meta div:last-child {
    border-bottom: none;
  }

  .cite-meta dt {
    color: var(--app-muted);
  }

  .cite-meta dd {
    margin: 0;
    text-align: right;
    overflow-wrap: anywhere;
  }

  .cite-alt {
    margin: 0;
    font-size: 0.78rem;
    color: var(--app-muted);
    text-align: center;
  }
</style>
