<script>
  import { applicationRoute } from '../../config/applicationUrls.js'
  import { MANUAL_CHAPTERS } from './chapters.js'
  let { chapter } = $props()

  const here = (url) => applicationRoute(url)
  let index = $derived(MANUAL_CHAPTERS.findIndex(c => c.id === chapter.id))
  let previous = $derived(MANUAL_CHAPTERS[index - 1])
  let next = $derived(MANUAL_CHAPTERS[index + 1])
</script>

<svelte:head>
  <title>{chapter.title} | SSTIM Manual</title>
  <meta name="description" content={chapter.short} />
</svelte:head>

<main class="manual-page">
  <nav class="breadcrumbs" aria-label="Breadcrumb">
    <a href={here('/')}>SSTIM</a>
    <span aria-hidden="true">/</span>
    <a href={here('/manual/')}>Manual</a>
    <span aria-hidden="true">/</span>
    <span aria-current="page">{chapter.title}</span>
  </nav>

  <div class="columns">
    <aside class="sidebar" aria-label="Manual chapters">
      <p class="sidebar-title">SSTIM user manual</p>
      <nav aria-label="Chapters">
        {#each MANUAL_CHAPTERS as item, i}
          <a href={here('/manual/' + item.id + '/')} aria-current={item.id === chapter.id ? 'page' : undefined}>
            <span class="chapter-number">{String(i + 1).padStart(2, '0')}</span>
            <span>{item.title}</span>
          </a>
        {/each}
      </nav>
      <p class="sidebar-note">A practical introduction to the released vocabulary and tools. You do not need every chapter.</p>
    </aside>

    <article class="content">
      <div class="chapter-header">
        <span class="eyebrow">Guide {String(index + 1).padStart(2, '0')} / {String(MANUAL_CHAPTERS.length).padStart(2, '0')}</span>
        <h1>{chapter.title}</h1>
        <p class="lead">{chapter.short}</p>
        <div class="chapter-meta"><span>{chapter.audience}</span><span>{chapter.level}</span></div>
      </div>

      <p class="introduction">{chapter.intro}</p>

      <nav class="on-this-page" aria-label="On this page">
        <strong>In this guide</strong>
        <ol>
          {#each chapter.examples as recipe, i}
            <li><a href={'#example-' + (i + 1)}>{recipe.title}</a></li>
          {/each}
        </ol>
      </nav>

      {#each chapter.examples as recipe, i}
        <section id={'example-' + (i + 1)} class="recipe">
          <p class="example-index">Example {String(i + 1).padStart(2, '0')}</p>
          <h2>{recipe.title}</h2>
          <p class="goal">{recipe.goal}</p>
          <ol class="steps">
            {#each recipe.steps as step}
              <li>{step}</li>
            {/each}
          </ol>
          {#if recipe.code}
            <div class="code-panel">
              <div class="code-label"><span>{recipe.language || 'code'}</span><span>Copy into your editor / terminal</span></div>
              <pre><code>{recipe.code}</code></pre>
            </div>
          {/if}
          {#if recipe.prompt}
            <div class="prompt-panel">
              <p class="prompt-label">Prompt for your AI assistant</p>
              <blockquote>{recipe.prompt}</blockquote>
            </div>
          {/if}
          {#if recipe.caution}
            <p class="caution">{recipe.caution}</p>
          {/if}
          {#if recipe.links?.length}
            <div class="recipe-links">
              {#each recipe.links as link}
                <a href={here(link.href)} rel={link.href.startsWith('/ontology/docs/') ? 'external' : link.href.startsWith('http') ? 'noopener noreferrer' : undefined}>{link.label} <span aria-hidden="true">↗</span></a>
              {/each}
            </div>
          {/if}
        </section>
      {/each}

      <section class="related">
        <h2>Further reference</h2>
        <div class="reference-links">
          {#each chapter.more as link}
            <a href={here(link.href)} rel={link.href.startsWith('/ontology/docs/') ? 'external' : link.href.startsWith('http') ? 'noopener noreferrer' : undefined}>{link.label} <span aria-hidden="true">↗</span></a>
          {/each}
        </div>
      </section>

      <nav class="pager" aria-label="Next and previous chapters">
        {#if previous}
          <a href={here('/manual/' + previous.id + '/')}><small>← Previous</small><strong>{previous.title}</strong></a>
        {:else}
          <a href={here('/manual/')}><small>← Overview</small><strong>All manual chapters</strong></a>
        {/if}
        {#if next}
          <a href={here('/manual/' + next.id + '/')}><small>Next →</small><strong>{next.title}</strong></a>
        {:else}
          <a href={here('/manual/')}><small>Back to overview →</small><strong>All chapters</strong></a>
        {/if}
      </nav>
      <footer class="credit">Maintained through the <a href="https://www.w3.org/community/sstim/">SSTIM W3C Community Group</a>. With thanks to <a href="https://biosyncare.com">BioSynCare</a>. SSTIM is not a W3C Recommendation.</footer>
    </article>
  </div>
</main>

<style>
  .manual-page { max-width: 1380px; margin: 0 auto; padding: 1.4rem clamp(1rem, 3vw, 2.5rem) 6rem; color: var(--app-text); }
  .breadcrumbs { display: flex; align-items: center; flex-wrap: wrap; gap: .5rem; font-size: .82rem; margin-bottom: 1.5rem; color: var(--app-muted); }
  .breadcrumbs a, .recipe-links a, .reference-links a, .credit a { color: var(--app-accent); }
  .columns { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: clamp(1.5rem,4vw,4rem); align-items: start; }
  .sidebar { position: sticky; top: 5rem; border: 1px solid var(--app-border); padding: 1rem; border-radius: var(--app-radius); background: var(--app-surface); }
  .sidebar-title { margin: 0 0 .85rem; font-size: .76rem; font-weight: 800; text-transform: uppercase; letter-spacing: .11em; color: var(--app-muted); }
  .sidebar nav { display: grid; gap: .2rem; }
  .sidebar nav a { display: flex; gap: .55rem; padding: .65rem .5rem; font-size: .85rem; border-radius: 3px; color: var(--app-text); text-decoration: none; }
  .sidebar nav a:hover, .sidebar nav a[aria-current='page'] { background: var(--app-accent-soft); color: var(--app-accent); }
  .chapter-number { color: var(--app-muted); font-size: .72rem; padding-top: .09rem; font-family: var(--app-font-mono); }
  .sidebar-note { margin: 1rem 0 0; padding-top: 1rem; border-top: 1px solid var(--app-border-subtle); font-size: .74rem; line-height: 1.6; color: var(--app-muted); }
  .content { min-width: 0; max-width: 850px; padding: 0; background: transparent; box-shadow: none; }
  .chapter-header { padding-bottom: 1.2rem; border-bottom: 1px solid var(--app-border); }
  .eyebrow,.example-index { color: var(--app-accent); font-size: .76rem; font-weight: 750; letter-spacing: .12em; text-transform: uppercase; }
  h1 { margin: .45rem 0 .55rem; font-size: clamp(2rem,4vw,3.25rem); letter-spacing: -.025em; line-height: 1.15; color: var(--app-text-strong); }
  .lead { font-size: 1.1rem; color: var(--app-muted); line-height: 1.5; margin: 0 0 1rem; }
  .chapter-meta { display: flex; flex-wrap: wrap; gap: .5rem; }
  .chapter-meta span { border: 1px solid var(--app-border); padding: .3rem .5rem; font-size: .75rem; color: var(--app-muted); background: var(--app-surface); }
  .introduction { margin: 1.7rem 0; line-height: 1.8; font-size: 1rem; max-width: 74ch; }
  .on-this-page { margin: 0 0 2.3rem; padding: 1.2rem 1.4rem; background: var(--app-surface); border: 1px solid var(--app-border); }
  .on-this-page strong { font-size: .85rem; }
  .on-this-page ol { margin: .55rem 0 0; display: grid; gap: .35rem; padding-left: 1.4rem; font-size: .87rem; }
  .on-this-page a { color: var(--app-accent); }
  .recipe { padding: 2.2rem 0 2.5rem; border-top: 1px solid var(--app-border-subtle); scroll-margin-top: 5rem; }
  .example-index { margin: 0 0 .45rem; }
  h2 { margin: .35rem 0 .7rem; color: var(--app-text-strong); font-size: 1.45rem; line-height: 1.32; }
  .goal { font-size: 1.02rem; margin: 0 0 1rem; line-height: 1.6; color: var(--app-text); }
  .steps { line-height: 1.75; font-size: .95rem; padding-left: 1.5rem; }
  .steps li { padding: .18rem 0 .18rem .2rem; }
  .steps li::marker { color: var(--app-accent); font-weight: 650; }
  .code-panel { border: 1px solid var(--app-border); margin-top: 1.15rem; background: var(--app-canvas); min-width: 0; }
  .code-label { display: flex; justify-content: space-between; flex-wrap: wrap; gap: .5rem; border-bottom: 1px solid var(--app-border); padding: .45rem .85rem; font-size: .73rem; color: var(--app-muted); }
  .code-label span:first-child { text-transform: uppercase; font-weight: 750; color: var(--app-accent); }
  pre { margin: 0; padding: 1.1rem; border: 0; background: transparent; overflow-x: auto; white-space: pre; font-size: .82rem; line-height: 1.62; }
  code { font-family: var(--app-font-mono); color: var(--app-text); background: none; }
  .prompt-panel { background: var(--app-surface); border-left: 3px solid var(--app-accent); margin-top: 1.15rem; padding: .9rem 1.2rem; }
  .prompt-label { margin: 0 0 .45rem; font-size: .76rem; color: var(--app-muted); font-weight: 750; letter-spacing: .06em; text-transform: uppercase; }
  blockquote { margin: 0; padding: 0; font-size: .97rem; line-height: 1.7; border: none; color: var(--app-text); }
  .caution { padding: .8rem .95rem; background: var(--app-surface-2); border-left: 2px solid var(--app-warn); font-size: .86rem; line-height: 1.65; }
  .recipe-links, .reference-links { display: flex; flex-wrap: wrap; gap: .8rem 1.5rem; margin-top: 1rem; }
  .recipe-links a, .reference-links a { font-size: .86rem; text-underline-offset: .2rem; }
  .related { padding: 1.6rem 0; border-top: 1px solid var(--app-border); }
  .pager { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; border-top: 1px solid var(--app-border); padding-top: 1.2rem; }
  .pager a { display: grid; gap: .3rem; padding: .85rem; border: 1px solid var(--app-border); color: var(--app-text); text-decoration: none; background: var(--app-surface); }
  .pager a:last-child { text-align: right; }
  .pager a:hover { border-color: var(--app-accent); }
  .pager small { color: var(--app-muted); font-size: .72rem; }
  .pager strong { font-size: .92rem; }
  .credit { border-top: 1px solid var(--app-border); padding-top: 1.25rem; margin-top: 2rem; font-size: .78rem; color: var(--app-muted); line-height: 1.7; }
  @media (max-width: 930px) {
    .columns { grid-template-columns: minmax(0,1fr); gap: 1.5rem; }
    .sidebar { position: static; }
    .sidebar nav { grid-template-columns: repeat(2,minmax(0,1fr)); }
    .sidebar-note { display: none; }
  }
  @media (max-width: 580px) {
    .manual-page { padding: 1rem 1rem 5rem; }
    .sidebar nav { grid-template-columns: 1fr; }
    .pager { grid-template-columns: 1fr; }
    pre { font-size: .75rem; }
  }
</style>
