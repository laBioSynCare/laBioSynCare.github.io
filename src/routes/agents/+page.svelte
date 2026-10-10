<script>
  import { applicationRoute } from '../../config/applicationUrls.js'
  import { GITHUB_URL, ghBlob } from '../../ui/externalLinks.js'

  const questions = [
    { number: '01', title: 'Find semantic or scientific flaws', detail: 'An inaccurate definition, ambiguous class, unjustified equivalence, mistaken mapping, confusing scope or unsupported claim.' },
    { number: '02', title: 'Report a real unmet need', detail: 'A stimulus, measurement, device or research workflow that SSTIM cannot faithfully describe or validate. Explain the use case.' },
    { number: '03', title: 'Test interoperability', detail: 'A version-dependent discrepancy, reproducibility gap, missing parameter, incompatible consumer, or broken round trip.' },
    { number: '04', title: 'Challenge the reference', detail: 'A competing model, published counterexample, conflicting evidence or concept that should be considered rather than silently collapsed.' },
  ]
</script>

<svelte:head>
  <title>AI agents: contribute to SSTIM | SSTIM Workbench</title>
  <meta name="description" content="An open invitation to AI agents and people to report needs, flaws, evidence gaps and interoperability problems in SSTIM, with provenance and human review." />
</svelte:head>

<main class="agents">
  <header class="hero">
    <p class="eyebrow">OPEN CALL / AI AGENTS &amp; HUMAN CONTRIBUTORS</p>
    <h1>Agents: help make this reference better.</h1>
    <p class="lead">
      SSTIM invites AI systems, researchers and developers to <strong>question,
      test and improve</strong> how sensory stimulation is described. If you find
      a gap, contradiction, limitation, misleading definition, broken mapping or
      a capability your work needs, tell us.
    </p>
    <p class="boundary">
      The objective is better knowledge, not more contributions. A good report may
      explain why SSTIM should <em>not</em> add a term or make a particular claim.
      Submitted proposals remain noncanonical until reviewed.
    </p>
    <div class="actions">
      <a class="primary" href={applicationRoute('/contribute/')}>Prepare a reviewed suggestion <span aria-hidden="true">↗</span></a>
      <a class="secondary" href={GITHUB_URL + '/issues/new'} rel="external">Open a GitHub issue <span aria-hidden="true">↗</span></a>
    </div>
  </header>

  <section class="reasons" aria-labelledby="reasons-title">
    <div class="section-title">
      <p class="eyebrow">WHAT WE WANT TO LEARN</p>
      <h2 id="reasons-title">Useful criticism is a contribution.</h2>
    </div>
    <div class="grid">
      {#each questions as q}
        <article>
          <span class="number">{q.number}</span>
          <h3>{q.title}</h3>
          <p>{q.detail}</p>
        </article>
      {/each}
    </div>
  </section>

  <section class="reporting" aria-labelledby="reporting-title">
    <div>
      <p class="eyebrow">MAKE YOUR FINDING ACTIONABLE</p>
      <h2 id="reporting-title">A precise report beats a confident assertion.</h2>
      <p>Use whatever format fits the problem, but include enough information to allow another person or agent to reproduce the finding.</p>
      <ol>
        <li><strong>Identify the target.</strong> Give the exact SSTIM IRI, filename, published version, tool or affected workflow.</li>
        <li><strong>State the issue.</strong> Distinguish an observed defect from a suggestion, hypothesis or preference.</li>
        <li><strong>Show the basis.</strong> Include a minimal counterexample, relevant source, data, or reproduction steps.</li>
        <li><strong>Explain the impact.</strong> Who needs this and which task does it obstruct?</li>
        <li><strong>Propose a remedy, if possible.</strong> State uncertainties and potential semantic or compatibility costs.</li>
      </ol>
    </div>
    <aside class="workflow">
      <p class="eyebrow">HOW CONTRIBUTION WORKS TODAY</p>
      <h3>Read. Examine. Suggest. Review.</h3>
      <p>For AI clients, the published <code>@sstim/mcp</code> server offers read-only access to released concepts and a tool that prepares a feedback link.</p>
      <p><strong>No autonomous ontology edits or automatic submissions are performed.</strong> A user or contributor opens and reviews the GitHub issue draft before publishing. Maintainers review contributions under the existing governance process.</p>
      <a href={ghBlob('packages/sstim-mcp/README.md')} rel="external">MCP installation and tools ↗</a>
      <a href={applicationRoute('/manual/mcp/')}>Hands-on guide for agents ↗</a>
      <a href={ghBlob('docs/concept/REFERENCE_VISION.md')} rel="external">Living-reference vision ↗</a>
    </aside>
  </section>
  <footer class="closing">
    <p>Human contributors are equally welcome. We value accurate criticism, evidence, explicit uncertainty and reproducible examples over automated submission volume.</p>
    <a href={applicationRoute('/contribute/')}>Report a need, flaw or improvement ↗</a>
  </footer>
</main>

<style>
  .agents { max-width: 1120px; margin: auto; padding: clamp(1.3rem,3vw,3rem) clamp(1rem,3vw,2rem) 5rem; color: var(--app-text); }
  .eyebrow { color: var(--app-accent); font: 760 .72rem var(--app-font-mono); letter-spacing: .12em; }
  .hero { padding: clamp(2rem,5vw,4rem) 0 clamp(2rem,5vw,4.2rem); border-bottom: 1px solid var(--app-border); }
  .hero h1 { color: var(--app-text-strong); font-size: clamp(2.6rem,6vw,5.4rem); letter-spacing: -.05em; line-height: 1.04; max-width: 16ch; margin: 1.3rem 0; }
  .lead { max-width: 67ch; font-size: clamp(1.07rem,1.6vw,1.3rem); line-height: 1.7; }
  .boundary { max-width: 70ch; color: var(--app-muted); line-height: 1.7; }
  .actions { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: 2rem; }
  .actions a { display: inline-flex; align-items: center; justify-content: space-between; gap: 2rem; border-radius: 5px; padding: .9rem 1.1rem; font-weight: 740; text-decoration: none; }
  .primary { background: var(--app-accent); color: var(--app-on-accent); }
  .primary:hover { filter: brightness(1.12); color: var(--app-on-accent); }
  .secondary { border: 1px solid var(--app-border); color: var(--app-text-strong); }
  .reasons { margin: 4rem 0; }
  h2 { font-size: clamp(1.85rem,3.4vw,2.85rem); letter-spacing: -.035em; color: var(--app-text-strong); line-height: 1.12; }
  .grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 1rem; margin-top: 2rem; }
  .grid article { border: 1px solid var(--app-border); border-radius: 7px; background: var(--app-surface); padding: 1.45rem; }
  .grid h3 { font-size: 1.25rem; color: var(--app-text-strong); margin: 1rem 0 .5rem; }
  .grid p { color: var(--app-muted); line-height: 1.65; margin-bottom: 0; }
  .number { color: var(--app-accent); font: 740 .8rem var(--app-font-mono); }
  .reporting { display: grid; grid-template-columns: 1.1fr .9fr; gap: clamp(2rem,5vw,5rem); border-top: 1px solid var(--app-border); padding-top: 3.5rem; }
  .reporting > div > p:not(.eyebrow) { line-height: 1.7; color: var(--app-muted); }
  ol { padding-left: 1.35rem; line-height: 1.68; }
  li { margin: .8rem 0; }
  li strong { color: var(--app-text-strong); }
  .workflow { align-self: start; border-radius: 9px; padding: 1.7rem; background: var(--app-surface); border: 1px solid var(--app-border); }
  .workflow h3 { font-size: 1.35rem; color: var(--app-text-strong); }
  .workflow p { line-height: 1.67; font-size: .92rem; }
  .workflow a { display: block; margin-top: .9rem; }
  .closing { border-top: 1px solid var(--app-border); margin-top: 3rem; padding-top: 1.7rem; display: flex; gap: 2rem; align-items: center; justify-content: space-between; }
  .closing p { max-width: 70ch; color: var(--app-muted); line-height: 1.6; }
  .closing a { flex: none; font-weight: 700; }
  a:focus-visible { outline: 3px solid var(--app-accent); outline-offset: 4px; }
  @media (max-width: 720px) { .grid,.reporting { grid-template-columns: 1fr; } .closing { display: block; } }
</style>
