<script>
  import { applicationRoute } from '../../config/applicationUrls.js'
  import { MANUAL_CHAPTERS } from '../../ui/manual/chapters.js'
</script>

<svelte:head>
  <title>SSTIM Manual | Tutorials and Practical Examples</title>
  <meta name="description" content="Practical SSTIM tutorials: use the Workbench, ontology, Python and JavaScript clients, MCP AI tools, and the open repository." />
</svelte:head>

<main class="manual-index">
  <nav class="breadcrumbs" aria-label="Breadcrumb"><a href={applicationRoute('/')}>SSTIM</a><span>/</span><span aria-current="page">Manual</span></nav>
  <header class="hero">
    <p class="eyebrow">SSTIM · learn by doing</p>
    <h1>Use SSTIM, from first concept to reproducible data.</h1>
    <p class="lead">A guided manual for scientists, application developers and AI users. Start with a browser, validate a stimulus description, record sessions from experiments, or connect your coding assistant to the released vocabulary.</p>
    <div class="hero-actions">
      <a class="primary" href={applicationRoute('/manual/workbench/')}>Start without installing</a>
      <a href={applicationRoute('/manual/mcp/')}>Use SSTIM with an AI assistant</a>
    </div>
    <p class="boundary">SSTIM is an open formalized knowledge standard. Its Workbench and client packages are different tools built around the same published vocabulary. Validation is not evidence of efficacy.</p>
  </header>

  <section class="catalog" aria-labelledby="chapter-heading">
    <p class="eyebrow">Choose your route</p>
    <h2 id="chapter-heading">Six practical guides</h2>
    <div class="cards">
      {#each MANUAL_CHAPTERS as chapter, i}
        <a class="chapter-card" href={applicationRoute('/manual/' + chapter.id + '/')}>
          <span class="card-index">GUIDE {String(i + 1).padStart(2, '0')}</span>
          <h3>{chapter.title} <span aria-hidden="true">↗</span></h3>
          <p>{chapter.short}</p>
          <span class="card-meta">{chapter.level} · {chapter.examples.length} examples</span>
        </a>
      {/each}
    </div>
  </section>

  <section class="paths" aria-labelledby="workflows-heading">
    <p class="eyebrow">Practical outcomes</p>
    <h2 id="workflows-heading">What can you build or learn?</h2>
    <div class="path-list">
      <article><h3>Share a reproducible stimulus description</h3><p>Start from a checked Turtle example. Choose a profile, reuse exact SSTIM identifiers, and validate the file before publication.</p><a href={applicationRoute('/manual/ontology/')}>Ontology →</a><a href={applicationRoute('/manual/python/')}>Python validation →</a></article>
      <article><h3>Record sessions from research software</h3><p>Turn experiment clocks and playback events from PsychoPy, jsPsych or Lab Streaming Layer into interoperable session records.</p><a href={applicationRoute('/manual/python/')}>Python session builder →</a><a href={applicationRoute('/manual/javascript/')}>JavaScript session builder →</a></article>
      <article><h3>Ground an AI assistant in released terms</h3><p>Search, retrieve and compare versioned ontology terms, then ask an agent to map an existing data model without inventing SSTIM IRIs.</p><a href={applicationRoute('/manual/mcp/')}>MCP use cases and installation →</a></article>
      <article><h3>Explore the knowledge graph visually</h3><p>Inspect concepts and named graphs; query the knowledge graph locally without setting up a SPARQL server.</p><a href={applicationRoute('/manual/workbench/')}>Workbench tutorial →</a></article>
    </div>
  </section>

  <section class="quick-links" aria-labelledby="resources-heading">
    <h2 id="resources-heading">Published packages and reference</h2>
    <div class="references">
      <a href="https://w3id.org/sstim">Ontology & stable identifier <span>Open reference ↗</span></a>
      <a href="https://pypi.org/project/sstim/">Python: sstim <span>PyPI ↗</span></a>
      <a href="https://www.npmjs.com/package/@sstim/core">JavaScript: @sstim/core <span>npm ↗</span></a>
      <a href="https://www.npmjs.com/package/@sstim/mcp">AI: @sstim/mcp <span>npm ↗</span></a>
      <a href="https://github.com/w3c-cg/sstim">Source and issue tracker <span>GitHub ↗</span></a>
    </div>
  </section>
  <footer>Developed through the <a href="https://www.w3.org/community/sstim/">SSTIM W3C Community Group</a>. With thanks to <a href="https://biosyncare.com">BioSynCare</a>. Community Group work is not a W3C Recommendation.</footer>
</main>

<style>
  .manual-index { max-width: 1220px; margin: 0 auto; padding: 1.4rem clamp(1rem,4vw,3rem) 6rem; color: var(--app-text); }
  .breadcrumbs { display:flex; gap:.55rem; margin-bottom: 1.2rem; color: var(--app-muted); font-size:.8rem; }
  .breadcrumbs a, footer a {color:var(--app-accent)}
  .hero { border:1px solid var(--app-border); padding: clamp(1.5rem,5vw,3.5rem); background:var(--app-surface); }
  .eyebrow { text-transform:uppercase; color:var(--app-accent); font-size:.76rem; font-weight:800; letter-spacing:.12em; margin:0 0 .7rem }
  h1 { max-width: 19ch; font-size: clamp(2.2rem,5vw,4.2rem); line-height:1.08; letter-spacing:-.035em; margin:.2rem 0 1.1rem; color:var(--app-text-strong); }
  .lead { max-width:73ch; font-size:1.1rem; line-height:1.75; margin:0 0 1.35rem }
  .hero-actions { display:flex; gap:.65rem; flex-wrap:wrap; }
  .hero-actions a { display:inline-block; padding:.75rem 1rem; border:1px solid var(--app-accent); color:var(--app-accent); text-decoration:none; font-size:.88rem; font-weight:700; }
  .hero-actions .primary {background:var(--app-accent);color:var(--app-on-accent)}
  .boundary {margin:1.7rem 0 0;padding-top:1rem; border-top:1px solid var(--app-border);font-size:.83rem;color:var(--app-muted);max-width:73ch;line-height:1.6}
  h2 { font-size:1.65rem;margin:.3rem 0 1.5rem;color:var(--app-text-strong); }
  .catalog,.paths,.quick-links { margin-top:3rem; }
  .cards { display:grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap:.85rem; }
  .chapter-card { padding:1.35rem; background:var(--app-surface); border:1px solid var(--app-border); color:var(--app-text); text-decoration:none; display:flex; flex-direction:column; min-height:205px; }
  .chapter-card:hover {border-color:var(--app-accent); box-shadow: 0 4px 12px #0000000c;}
  .card-index {font-size:.72rem;font-weight:700;letter-spacing:.11em;color:var(--app-accent);}
  .chapter-card h3 {font-size:1.22rem;color:var(--app-text-strong);line-height:1.35;margin:.65rem 0;display:flex;justify-content:space-between;gap:.8rem;}
  .chapter-card h3 span{color:var(--app-accent)}
  .chapter-card p {font-size:.89rem;line-height:1.65;margin:0 0 auto}
  .card-meta {display:block;font-size:.74rem;color:var(--app-muted);border-top:1px solid var(--app-border-subtle);margin-top:1.2rem;padding-top:.7rem;}
  .path-list {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem}
  .path-list article {margin:0;padding:1.3rem;background:var(--app-surface);border:1px solid var(--app-border)}
  .path-list h3 {font-size:1.05rem;margin:0 0 .5rem;color:var(--app-text-strong)}
  .path-list p{font-size:.87rem;line-height:1.7;margin:0 0 .8rem}
  .path-list a{color:var(--app-accent);font-size:.82rem;margin-right:.9rem}
  .references {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.55rem}
  .references a{border-bottom:1px solid var(--app-border);padding:.8rem .2rem;display:flex;justify-content:space-between;gap:.7rem;color:var(--app-text);text-decoration:none;font-size:.92rem;}
  .references a span{color:var(--app-accent);font-size:.8rem}
  footer{margin:3rem 0 0;padding-top:1.2rem;border-top:1px solid var(--app-border);color:var(--app-muted);font-size:.8rem;line-height:1.7}
  @media(max-width:900px){.cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:630px){.cards,.path-list,.references{grid-template-columns:1fr}h1{max-width:none}.manual-index{padding-bottom:5rem}}
</style>
