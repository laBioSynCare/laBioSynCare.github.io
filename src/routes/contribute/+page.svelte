<script>
  import { onMount } from 'svelte'
  import { applicationRoute } from '../../config/applicationUrls.js'
  import { FEEDBACK_KINDS, contributionPrefill, feedbackIssueUrl, normalizeSstimIri } from '../../ui/contribute/issueDraft.js'
  import { GITHUB_URL } from '../../ui/externalLinks.js'

  let kind = $state('correction')
  let label = $state('')
  let targetIri = $state('')
  let description = $state('')
  let suggestion = $state('')
  let evidence = $state('')
  let release = $state('')

  onMount(() => {
    // No conversation content is accepted via the URL, only term identity.
    const prefill = contributionPrefill(window.location.search)
    targetIri = prefill.targetIri
    label = prefill.label
  })

  const validTarget = $derived(!targetIri.trim() || !!normalizeSstimIri(targetIri))
  const draft = $derived(feedbackIssueUrl({
    kind, targetIri, label, description, suggestion, evidence, release,
  }))
</script>

<svelte:head>
  <title>Suggest an improvement to SSTIM · SSTIM Workbench</title>
</svelte:head>

<main class="feedback">
  <p class="eyebrow">Contribute to SSTIM</p>
  <h1>Suggest an improvement</h1>
  <p class="intro">
    Find a missing concept, disagree with a definition, or see a connection to
    another vocabulary? Share your reasoning in ordinary language. You do not
    need to know RDF, OWL, or SPARQL.
  </p>

  <form class="feedback-form" onsubmit={(event) => event.preventDefault()}>
    <label for="feedback-kind">What would you like to contribute?</label>
    <select id="feedback-kind" bind:value={kind}>
      {#each FEEDBACK_KINDS as option (option.value)}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>

    <label for="feedback-label">Concept or entry name <span>(optional)</span></label>
    <input id="feedback-label" type="text" maxlength="140" bind:value={label}
      placeholder="e.g. tactile stimulation" />

    <label for="feedback-iri">SSTIM concept URL <span>(optional)</span></label>
    <input id="feedback-iri" type="url" bind:value={targetIri}
      aria-invalid={!validTarget} maxlength="1024"
      placeholder="https://w3id.org/sstim#Stimulus" />
    {#if !validTarget}
      <p class="input-error" role="alert">Enter a valid w3id.org/sstim concept URL, or leave it blank.</p>
    {/if}

    <label for="feedback-description">What is unclear, incorrect, or missing?</label>
    <textarea id="feedback-description" bind:value={description}
      maxlength="2500" rows="5" required
      placeholder="Explain the observation, ambiguity, disagreement, or missing concept."
    ></textarea>

    <label for="feedback-suggestion">Suggested wording or alternative <span>(optional)</span></label>
    <textarea id="feedback-suggestion" bind:value={suggestion} maxlength="2000" rows="3"
      placeholder="What interpretation, definition, or relationship would you propose?"
    ></textarea>

    <label for="feedback-evidence">Evidence or example <span>(optional)</span></label>
    <textarea id="feedback-evidence" bind:value={evidence} maxlength="1200" rows="2"
      placeholder="A paper, dataset, external vocabulary, or concrete example."
    ></textarea>

    <label for="feedback-release">Version or release <span>(optional)</span></label>
    <input id="feedback-release" type="text" maxlength="120" bind:value={release}
      placeholder="e.g. 0.18.0, if known" />

    <div class="submit">
      {#if draft && validTarget}
        <a role="button" href={draft} target="_blank" rel="noopener noreferrer">
          Review draft on GitHub
        </a>
      {:else}
        <button type="button" disabled>Review draft on GitHub</button>
      {/if}
      <a class="back" href={applicationRoute('/graph/')}>Explore SSTIM concepts</a>
    </div>
  </form>

  <aside class="notice">
    <h2>How review works</h2>
    <p>
      This form prepares a <strong>GitHub issue draft</strong> in
      <a href={GITHUB_URL + '/issues'} rel="external">SSTIM's public issue tracker</a>.
      Nothing is sent automatically. Review the draft, sign in to GitHub if needed,
      and create the issue yourself. You can follow discussion and closure on
      its issue page. A suggestion is not automatically accepted into SSTIM.
    </p>
    <p>
      GitHub issues are public. Do not include private conversation excerpts,
      personal information, or unpublished material without authorization.
    </p>
  </aside>
</main>

<style>
  .feedback {
    max-width: 760px;
    margin: 0 auto;
    padding: 2.5rem 1.25rem 5rem;
    color: var(--app-text);
    font-family: var(--app-font-ui);
  }
  .eyebrow {
    color: var(--app-accent);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin: 0 0 0.35rem;
  }
  h1 { font-size: clamp(1.7rem, 4vw, 2.3rem); color: var(--app-text-strong); }
  .intro { line-height: 1.55; color: var(--app-muted); margin-bottom: 1.4rem; }
  .feedback-form {
    display: grid;
    gap: 0.6rem;
    padding: 1.4rem;
    border: var(--app-border-width) solid var(--app-border);
    background: var(--app-surface);
    border-radius: var(--app-radius);
  }
  label {
    font-weight: 600;
    margin: 0.6rem 0 0;
  }
  label span { font-weight: 400; color: var(--app-muted); }
  input, select, textarea {
    background: var(--app-bg);
    color: var(--app-text);
    border-color: var(--app-border);
    margin: 0;
  }
  textarea { resize: vertical; }
  .input-error { color: var(--pico-del-color); font-size: 0.85rem; margin: 0; }
  .submit { display: flex; align-items: center; flex-wrap: wrap; gap: 0.85rem; margin-top: 1rem; }
  .submit a[role="button"], .submit button { width: auto; margin: 0; }
  .back { font-size: 0.88rem; }
  .notice {
    margin-top: 1.5rem;
    padding: 1.2rem 1.4rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    background: var(--app-surface-2);
  }
  .notice h2 { font-size: 1.05rem; color: var(--app-text-strong); }
  .notice p { font-size: 0.9rem; line-height: 1.55; margin: 0.6rem 0; }
</style>
