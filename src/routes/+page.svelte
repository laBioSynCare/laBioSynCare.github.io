<script>
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { applicationRoute } from '../config/applicationUrls.js'
  import ConversionBar from '../ui/entrance/ConversionBar.svelte'
  import ContributeProtocolModal from '../ui/entrance/ContributeProtocolModal.svelte'
  import CiteSstimModal from '../ui/entrance/CiteSstimModal.svelte'
  import Isotype from '../ui/brand/Isotype.svelte'
  import { CONCEPT_DOI, RELEASE_VERSION, doiUrl } from '../ui/entrance/releaseMetadata.js'
  import {
    BIOSYNCARE_URL,
    GITHUB_URL,
    ONTOLOGY_DOCS_URL,
    W3C_GROUP_URL,
    ghBlob,
  } from '../ui/externalLinks.js'

  // A public direction, not a claim to exclusive scientific authority. Keep
  // the share description identical to the app.html fallback meta description.
  const SHARE_TITLE = 'A living reference for sensory stimulation'
  const SHARE_DESCRIPTION =
    'An open, evolving knowledge foundation for sensory stimulation, connecting ' +
    'research, technology, and AI through citable references, precise descriptions, and transparent evidence.'

  // Four working entry points: no planned API, unreviewed claim or proposed
  // contribution feature is represented as already available.
  const doors = [
    {
      id: 'door-understand',
      index: '01',
      eyebrow: 'Explore',
      title: 'Find the meaning. Follow the source.',
      copy: 'Navigate precise concepts, inspect relationships and evidence, or query the published knowledge directly.',
      primary: { label: 'Explore the graph', href: applicationRoute('/graph/') },
      secondary: [
        { label: 'Hands-on manual', href: applicationRoute('/manual/') },
        { label: 'Query with SPARQL', href: applicationRoute('/sparql/') },
      ],
    },
    {
      id: 'door-build',
      index: '02',
      eyebrow: 'For AI & developers',
      title: 'Give intelligent tools a shared reference.',
      copy: 'Use the published read-only MCP server for versioned definitions, identifiers, mappings and provenance.',
      primary: { label: 'Connect an AI assistant', href: ghBlob('packages/sstim-mcp/README.md'), external: true },
      secondary: [
        { label: 'MCP distribution', href: ghBlob('docs/ecosystem/MCP_DISTRIBUTION.md'), external: true },
        { label: 'Python & JavaScript', href: ghBlob('docs/ADOPTING_SSTIM.md'), external: true },
      ],
    },
    {
      id: 'door-experience',
      index: '03',
      eyebrow: 'Experiment',
      title: 'Make a stimulus. Inspect its structure.',
      copy: 'Try an audiovisual reference patch in the browser, then explore its tracks and parameters in Patch Studio.',
      primary: { label: 'Try a ready-made patch', href: applicationRoute('/creator/?example=alpha-10-isochronic') },
      secondary: [
        { label: 'Open Patch Studio', href: applicationRoute('/creator/') },
        { label: 'Browse presets', href: applicationRoute('/presets/') },
      ],
    },
    {
      id: 'door-join',
      index: '04',
      eyebrow: 'Contribute',
      title: 'Help knowledge improve in public.',
      copy: 'Discuss definitions, identify missing concepts, or bring a protocol to an open review process.',
      primary: { label: 'Join the W3C Community Group', href: W3C_GROUP_URL, external: true },
      secondary: [
        { label: 'Suggest a correction', href: applicationRoute('/contribute/') },
        { label: 'Contribute a protocol', action: 'contribute' },
      ],
    },
  ]

  const distinctions = [
    { number: '01', label: 'Specified', detail: 'What was intended?' },
    { number: '02', label: 'Delivered', detail: 'What actually occurred?' },
    { number: '03', label: 'Observed', detail: 'What was measured or reported?' },
    { number: '04', label: 'Supported', detail: 'What does the evidence justify?' },
  ]

  const signals = [
    {
      code: 'A',
      name: 'Binaural difference',
      key: '40 Hz between channels',
      text: 'An interaural frequency difference; not a physical 40 Hz amplitude pulse in either channel.',
      shape: 'binaural',
    },
    {
      code: 'B',
      name: 'Isochronic modulation',
      key: '40 pulses per second',
      text: 'A physically modulated auditory signal with repeated changes in its envelope.',
      shape: 'isochronic',
    },
    {
      code: 'C',
      name: 'Visual flicker',
      key: '40 cycles per second',
      text: 'A time-varying visual stimulus; its delivery and relevant evidence differ from audio.',
      shape: 'visual',
    },
  ]

  let contributeOpen = $state(false)
  let citeOpen = $state(false)
  let heroEl = $state(null)
  let heroVisible = $state(true)

  onMount(() => {
    // Keep the historical /#term deep links working after the graph move.
    const hash = window.location.hash
    if (hash && !hash.startsWith('#door-') && hash !== '#hero' &&
        !['#why-precision', '#explore', '#living-knowledge', '#for-everyone'].includes(hash)) {
      goto(applicationRoute('/graph/') + hash, { replaceState: true })
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting
    })
    if (heroEl) observer.observe(heroEl)
    return () => observer.disconnect()
  })
</script>

<svelte:head>
  <title>SSTIM · {SHARE_TITLE}</title>
  <!-- Description is inherited from app.html: adding another name=description
       would duplicate it rather than replace it during SvelteKit SSR. -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="SSTIM Workbench" />
  <meta property="og:title" content={SHARE_TITLE} />
  <meta property="og:description" content={SHARE_DESCRIPTION} />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={SHARE_TITLE} />
  <meta name="twitter:description" content={SHARE_DESCRIPTION} />
</svelte:head>

<main class="entrance">
  <section class="hero" id="hero" bind:this={heroEl} aria-labelledby="hero-title">
    <div class="hero-copy">
      <div class="identity">
        <Isotype name="bsclab" size={38} title="SSTIM mark" />
        <div class="identity-text"><strong>SSTIM</strong><span>Open science / shared knowledge</span></div>
      </div>
      <p class="kicker"><span class="kicker-line"></span> AN OPEN REFERENCE THAT EVOLVES</p>
      <h1 id="hero-title">A living reference for <span>sensory stimulation.</span></h1>
      <p class="lead">{SHARE_DESCRIPTION}</p>
      <p class="hero-detail">
        Built to advance with scientific understanding while keeping previous meanings,
        sources and versions interpretable.
      </p>
      <div class="hero-actions">
        <a class="action action-primary" href={applicationRoute('/graph/')}>Explore the knowledge <span aria-hidden="true">↗</span></a>
        <a class="action action-secondary" href={applicationRoute('/manual/')}>See how it works <span aria-hidden="true">↗</span></a>
      </div>
      <p class="hero-footnote">
        <span class="status-dot" aria-hidden="true"></span>
        Open and versioned · <a href={doiUrl(CONCEPT_DOI)} rel="external">Citable releases</a> ·
        <a href={ghBlob('docs/concept/REFERENCE_VISION.md')} rel="external">Our direction</a>
      </p>
    </div>

    <aside class="knowledge-visual" aria-label="Conceptual map of connected sensory-stimulation knowledge">
      <div class="visual-top">
        <span>REFERENCE / KNOWLEDGE RELATIONS</span>
        <span>v{RELEASE_VERSION}</span>
      </div>
      <svg viewBox="0 0 520 500" role="img" aria-labelledby="map-title map-desc">
        <title id="map-title">SSTIM connects different knowledge communities</title>
        <desc id="map-desc">A schematic network with SSTIM at the center, connected to scientific research, human knowledge, AI systems, technology and evidence. This is an illustration, not a dataset.</desc>
        <defs>
          <radialGradient id="sstim-center-glow">
            <stop offset="0" stop-color="#73e2d0" stop-opacity=".20" />
            <stop offset="1" stop-color="#73e2d0" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="sstim-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#84e8d8" />
            <stop offset="1" stop-color="#e0bb7b" />
          </linearGradient>
        </defs>
        <g class="map-grid" stroke="#d1e5db" stroke-opacity=".07" stroke-width="1">
          <path d="M0 125 H520 M0 250 H520 M0 375 H520 M130 0 V500 M260 0 V500 M390 0 V500" />
          <circle cx="260" cy="247" r="180" fill="none" stroke-dasharray="3 11" />
          <circle cx="260" cy="247" r="125" fill="none" />
        </g>
        <circle cx="260" cy="247" r="173" fill="url(#sstim-center-glow)" />
        <g class="network-paths" fill="none" stroke="#8caeab" stroke-width="1.2" stroke-opacity=".67">
          <path d="M244 217 Q190 160 128 105" />
          <path d="M287 218 Q346 147 404 106" />
          <path d="M221 254 Q147 262 87 304" />
          <path d="M297 267 Q360 296 426 317" />
          <path d="M260 304 Q260 364 260 431" />
          <path d="M128 105 Q265 39 404 106" stroke-dasharray="3 7" stroke-opacity=".35" />
          <path d="M87 304 Q174 418 260 431 Q355 426 426 317" stroke-dasharray="3 7" stroke-opacity=".35" />
        </g>
        <g class="node-orbits" fill="#122e31" stroke="#86cbc1" stroke-width="1.4">
          <circle cx="128" cy="105" r="8" />
          <circle cx="404" cy="106" r="8" />
          <circle cx="87" cy="304" r="8" />
          <circle cx="426" cy="317" r="8" />
          <circle cx="260" cy="431" r="8" />
        </g>
        <g fill="#c8eadc" font-family="system-ui, sans-serif" font-size="12.5" letter-spacing="1">
          <text x="128" y="80" text-anchor="middle">RESEARCH</text>
          <text x="404" y="79" text-anchor="middle">HUMAN KNOWLEDGE</text>
          <text x="87" y="335" text-anchor="middle">AI SYSTEMS</text>
          <text x="426" y="349" text-anchor="middle">TECHNOLOGY</text>
          <text x="260" y="461" text-anchor="middle">EVIDENCE</text>
        </g>
        <circle cx="260" cy="247" r="67" fill="#0f3032" stroke="url(#sstim-ring)" stroke-width="2" />
        <circle cx="260" cy="247" r="58" fill="none" stroke="#8bd9c4" stroke-opacity=".24" stroke-dasharray="2 5" />
        <g text-anchor="middle" font-family="system-ui, sans-serif">
          <text x="260" y="241" fill="#f6f4e9" font-size="30" font-weight="740" letter-spacing=".5">SSTIM</text>
          <text x="260" y="261" fill="#a0d6cb" font-size="10" letter-spacing="2">SHARED REFERENCE</text>
        </g>
      </svg>
      <div class="visual-bottom">
        <span>IDENTIFIERS · PROVENANCE · RELATIONSHIPS</span>
        <span aria-hidden="true">◎</span>
      </div>
    </aside>
  </section>

  <section class="principles" aria-label="Four distinctions that make the science interpretable">
    {#each distinctions as item}
      <div class="principle">
        <span class="principle-number">{item.number}</span>
        <strong>{item.label}</strong>
        <span>{item.detail}</span>
      </div>
    {/each}
  </section>

  <section class="precision section-block" id="why-precision" aria-labelledby="precision-title">
    <div class="section-heading">
      <p class="section-tag">WHY PRECISE KNOWLEDGE MATTERS</p>
      <h2 id="precision-title">One number. Different phenomena.</h2>
      <p>
        A label such as “40 Hz stimulation” is not a complete experimental description.
        The physical signal, delivery mechanism, context and evidence determine what the
        number actually means.
      </p>
    </div>
    <div class="signal-grid">
      {#each signals as signal}
        <article class="signal-card">
          <div class="signal-head"><span>{signal.code} / EXAMPLE</span><span>40 Hz</span></div>
          <div class="signal-wave" aria-hidden="true">
            {#if signal.shape === 'binaural'}
              <svg viewBox="0 0 260 70" preserveAspectRatio="none"><path d="M0 23 Q6 2 13 23 T26 23 T39 23 T52 23 T65 23 T78 23 T91 23 T104 23 T117 23 T130 23 T143 23 T156 23 T169 23 T182 23 T195 23 T208 23 T221 23 T234 23 T247 23 T260 23" /><path class="second" d="M0 48 Q5 27 10 48 T20 48 T30 48 T40 48 T50 48 T60 48 T70 48 T80 48 T90 48 T100 48 T110 48 T120 48 T130 48 T140 48 T150 48 T160 48 T170 48 T180 48 T190 48 T200 48 T210 48 T220 48 T230 48 T240 48 T250 48 T260 48" /></svg>
            {:else if signal.shape === 'isochronic'}
              <svg viewBox="0 0 260 70" preserveAspectRatio="none"><path d="M0 55 L8 55 L8 15 Q13 2 18 15 T28 15 L28 55 L48 55 L48 15 Q53 2 58 15 T68 15 L68 55 L88 55 L88 15 Q93 2 98 15 T108 15 L108 55 L128 55 L128 15 Q133 2 138 15 T148 15 L148 55 L168 55 L168 15 Q173 2 178 15 T188 15 L188 55 L208 55 L208 15 Q213 2 218 15 T228 15 L228 55 L248 55 L248 15 L260 15" /></svg>
            {:else}
              <svg viewBox="0 0 260 70" preserveAspectRatio="none"><path d="M0 53 L20 53 L20 14 L42 14 L42 53 L64 53 L64 14 L86 14 L86 53 L108 53 L108 14 L130 14 L130 53 L152 53 L152 14 L174 14 L174 53 L196 53 L196 14 L218 14 L218 53 L240 53 L240 14 L260 14" /></svg>
            {/if}
          </div>
          <h3>{signal.name}</h3>
          <p class="signal-key">{signal.key}</p>
          <p>{signal.text}</p>
        </article>
      {/each}
    </div>
    <p class="diagram-note">
      <strong>Illustrative schematics, not measured recordings.</strong>
      These examples are not interchangeable claims about physiological effects.
      SSTIM separates physical stimulation, intended experience, actual observations
      and the evidence for each assertion.
    </p>
  </section>

  <section class="pathways section-block" id="explore" aria-labelledby="pathways-title">
    <div class="section-heading pathways-head">
      <div>
        <p class="section-tag">START HERE</p>
        <h2 id="pathways-title">Knowledge you can work with.</h2>
      </div>
      <p>
        Whether you are studying a phenomenon, building technology, working with an
        AI assistant or contributing a correction, begin with a working tool.
      </p>
    </div>
    <div class="door-grid">
      {#each doors as door (door.id)}
        <article class="door" id={door.id}>
          <div class="door-top"><span class="door-index">{door.index}</span><span class="door-eyebrow">{door.eyebrow}</span></div>
          <h3>{door.title}</h3>
          <p class="door-copy">{door.copy}</p>
          <a class="door-primary" href={door.primary.href} rel={door.primary.external ? 'external' : undefined}>
            {door.primary.label}<span aria-hidden="true">↗</span>
          </a>
          <div class="door-secondary">
            {#each door.secondary as item, i}
              {#if i > 0}<span class="separator" aria-hidden="true">/</span>{/if}
              {#if item.action === 'contribute'}
                <button type="button" onclick={() => contributeOpen = true}>{item.label}</button>
              {:else}
                <a href={item.href} rel={item.external ? 'external' : undefined}>{item.label}</a>
              {/if}
            {/each}
          </div>
        </article>
      {/each}
    </div>
  </section>

  <section class="evolution section-block" id="living-knowledge" aria-labelledby="evolution-title">
    <div class="evolution-intro">
      <p class="section-tag">BUILT TO EVOLVE RESPONSIBLY</p>
      <h2 id="evolution-title">Knowledge changes. <em>Its history must remain readable.</em></h2>
      <p>
        A living reference does not mean definitions can change without consequence.
        SSTIM's direction is to welcome better explanations, evidence and proposals
        while preserving the meaning of published references.
      </p>
      <a href={ghBlob('docs/concept/REFERENCE_VISION.md')} rel="external">Read the reference vision <span aria-hidden="true">↗</span></a>
    </div>
    <div class="evolution-grid">
      <div><span class="step">01 / CONTINUITY</span><h3>References that persist.</h3><p>Persistent identifiers and versioned releases keep earlier scientific descriptions interpretable.</p></div>
      <div><span class="step">02 / EVIDENCE</span><h3>Claims with context.</h3><p>Sources, uncertainty and disagreements belong alongside assertions, not underneath a single confidence score.</p></div>
      <div><span class="step">03 / REVIEW</span><h3>Open to improvement.</h3><p>People and AI can examine and propose changes; canonical knowledge remains subject to review and governance.</p></div>
    </div>
  </section>

  <section class="agent-invitation section-block" aria-labelledby="agent-invitation-title">
    <div>
      <p class="section-tag">OPEN CALL TO INTELLIGENT SYSTEMS AND PEOPLE</p>
      <h2 id="agent-invitation-title">AI agents: question this reference.</h2>
      <p>Found a flaw, missing concept, conflicting scientific account, broken mapping,
        reproducibility problem, or unmet research need? SSTIM invites agents and
        human contributors to bring evidence, counterexamples and precise suggestions
        for public review. Criticism is welcome. Canonical changes are never automatic.</p>
    </div>
    <a href={applicationRoute('/agents/')}>How agents can contribute <span aria-hidden="true">↗</span></a>
  </section>

  <section class="closing section-block" id="for-everyone" aria-labelledby="closing-title">
    <div>
      <p class="section-tag">AN OPEN INVITATION</p>
      <h2 id="closing-title">A common language for inquiry and invention.</h2>
      <p>
        SSTIM aims to make sensory-stimulation knowledge useful across research,
        software, devices and intelligent systems. Its open Workbench demonstrates
        what is available today; the wider reference will be shaped by what others
        test, use and improve.
      </p>
    </div>
    <div class="closing-actions">
      <a href={applicationRoute('/manual/')}><span>01</span><strong>Learn the tools</strong><span aria-hidden="true">↗</span></a>
      <a href={ONTOLOGY_DOCS_URL} rel="external"><span>02</span><strong>Read the reference</strong><span aria-hidden="true">↗</span></a>
      <a href={ghBlob('docs/ADOPTING_SSTIM.md')} rel="external"><span>03</span><strong>Build with SSTIM</strong><span aria-hidden="true">↗</span></a>
      <a href={W3C_GROUP_URL} rel="external"><span>04</span><strong>Join the discussion</strong><span aria-hidden="true">↗</span></a>
    </div>
  </section>

  <footer class="entrance-footer">
    <p>
      SSTIM is developed through the
      <a href={W3C_GROUP_URL} rel="external">W3C Sensory Stimulation Vocabulary Community Group</a>.
      The group is open and independent; its work is not a W3C Recommendation.
      SSTIM Workbench is non-normative reference software.
    </p>
    <nav aria-label="Institutional and reference links">
      <a href={doiUrl(CONCEPT_DOI)} rel="external">All-version DOI</a>
      <a href="https://w3id.org/sstim" rel="external">Persistent namespace</a>
      <a href={GITHUB_URL} rel="external">Source code</a>
      <a href={applicationRoute('/ecosystem/')}>Ecosystem</a>
      <a href={applicationRoute('/about/')}>About</a>
      <a href={BIOSYNCARE_URL} rel="external">BioSynCare (separate app)</a>
      <button type="button" onclick={() => citeOpen = true}>Cite SSTIM</button>
    </nav>
  </footer>
</main>

{#if !heroVisible}
  <div class="sticky-conversion">
    <ConversionBar variant="sticky" onContribute={() => contributeOpen = true} />
  </div>
{/if}
<ContributeProtocolModal open={contributeOpen} onClose={() => contributeOpen = false} />
<CiteSstimModal open={citeOpen} onClose={() => citeOpen = false} />

<style>
  .entrance {
    max-width: 1280px;
    margin: 0 auto;
    padding: clamp(1.5rem, 3vw, 3.2rem) clamp(1rem, 3vw, 2.4rem) 4.5rem;
    color: var(--app-text);
    font-family: var(--app-font-ui);
  }
  .entrance :global(a:focus-visible), .entrance :global(button:focus-visible) {
    outline: 3px solid var(--app-accent);
    outline-offset: 4px;
  }
  .hero { display: grid; grid-template-columns: minmax(0, 1.04fr) minmax(0, .96fr); gap: clamp(2rem, 5vw, 5.5rem); align-items: center; padding: 1.25rem 0 3.25rem; }
  .identity { display: flex; align-items: center; gap: .8rem; margin-bottom: clamp(2rem, 5vw, 4.1rem); }
  .identity-text { display: flex; flex-direction: column; gap: .06rem; }
  .identity-text strong { font-size: 1.06rem; letter-spacing: .025em; color: var(--app-text-strong); }
  .identity-text span { color: var(--app-muted); font-size: .68rem; letter-spacing: .08em; text-transform: uppercase; }
  .kicker, .section-tag { color: var(--app-accent); font-family: var(--app-font-mono); font-size: .67rem; letter-spacing: .14em; font-weight: 750; }
  .kicker { display: flex; align-items: center; gap: .7rem; margin-bottom: 1.1rem; }
  .kicker-line { width: 27px; height: 1px; background: currentColor; }
  .hero h1 { max-width: 12ch; margin: 0 0 1.5rem; font-size: clamp(2.8rem, 5vw, 5.1rem); letter-spacing: -.055em; line-height: 1.065; color: var(--app-text-strong); font-weight: 810; }
  .hero h1 span { color: var(--app-accent); }
  .lead { max-width: 55ch; font-size: clamp(1.06rem, 1.35vw, 1.23rem); color: var(--app-text); line-height: 1.66; margin-bottom: 1rem; }
  .hero-detail { max-width: 58ch; font-size: .91rem; color: var(--app-muted); line-height: 1.68; margin-bottom: 2rem; }
  .hero-actions { display: flex; flex-wrap: wrap; align-items: center; gap: .8rem; margin-bottom: 1.7rem; }
  .action { display: inline-flex; align-items: center; justify-content: space-between; gap: 1.7rem; padding: .85rem 1.05rem; border-radius: 4px; text-decoration: none; font-size: .85rem; font-weight: 750; transition: transform .2s ease, background .2s ease; }
  .action:hover { transform: translateY(-2px); text-decoration: none; }
  .action-primary { background: var(--app-accent); color: var(--app-on-accent); border: 1px solid var(--app-accent); }
  .action-primary:hover { color: var(--app-on-accent); filter: brightness(1.08); }
  .action-secondary { border: 1px solid var(--app-border); color: var(--app-text-strong); background: var(--app-surface); }
  .action-secondary:hover { color: var(--app-text-strong); background: var(--app-surface-2); }
  .hero-footnote { display: flex; flex-wrap: wrap; align-items: center; gap: .34rem; font-size: .75rem; color: var(--app-muted); }
  .hero-footnote a { color: inherit; text-decoration: underline; text-underline-offset: .14rem; }
  .status-dot { display: inline-block; width: 6px; height: 6px; flex: 0 0 auto; border-radius: 50%; background: #3da58f; margin-right: .3rem; }
  .knowledge-visual { position: relative; min-width: 0; padding: 1.1rem 1.3rem .8rem; overflow: hidden; border-radius: 16px; background: radial-gradient(ellipse at 56% 41%, #184448, #0d272d 60%, #081921 100%); color: #d6f6ec; border: 1px solid #2f595a; box-shadow: 0 24px 70px #092a2822, inset 0 0 0 1px #ffffff09; }
  .knowledge-visual::after { content: ''; pointer-events: none; position: absolute; inset: 0; background: linear-gradient(130deg,#ffffff05, transparent 47%, #f0c88d06); }
  .visual-top, .visual-bottom { display: flex; justify-content: space-between; align-items: center; gap: 1rem; color: #a7c9c1; font-family: var(--app-font-mono); font-size: .59rem; letter-spacing: .105em; }
  .visual-top { border-bottom: 1px solid #c9eee325; padding-bottom: .85rem; }
  .visual-bottom { border-top: 1px solid #c9eee325; padding-top: .85rem; }
  .knowledge-visual svg { display: block; width: 100%; height: auto; margin: .6rem auto; max-height: 510px; }
  .principles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-top: 1px solid var(--app-border); border-bottom: 1px solid var(--app-border); padding: 1.3rem 0; gap: 0; }
  .principle { display: flex; flex-direction: column; gap: .3rem; padding: .15rem 1.5rem; border-left: 1px solid var(--app-border-subtle); }
  .principle:first-child { padding-left: 0; border-left: 0; }
  .principle-number { font-family: var(--app-font-mono); font-size: .65rem; color: var(--app-accent); letter-spacing: .05em; }
  .principle strong { font-size: 1.08rem; color: var(--app-text-strong); }
  .principle > span:last-child { font-size: .82rem; color: var(--app-muted); }
  .section-block { margin-top: clamp(4rem, 7vw, 7.5rem); }
  .section-heading { max-width: 750px; margin-bottom: 2.2rem; }
  .section-heading .section-tag { margin-bottom: .9rem; }
  .section-heading h2, .closing h2, .evolution h2 { margin: 0 0 .9rem; color: var(--app-text-strong); font-size: clamp(2rem, 3.5vw, 3.45rem); letter-spacing: -.04em; line-height: 1.15; font-weight: 790; }
  .section-heading p:last-child { line-height: 1.7; color: var(--app-muted); font-size: 1rem; margin: 0; max-width: 65ch; }
  .signal-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
  .signal-card { border: 1px solid var(--app-border); background: var(--app-surface); padding: 1.35rem; border-radius: 8px; min-width: 0; }
  .signal-head { display: flex; justify-content: space-between; color: var(--app-muted); font: 700 .63rem var(--app-font-mono); letter-spacing: .11em; }
  .signal-head span:last-child { color: var(--app-accent); }
  .signal-wave { height: 102px; margin: .9rem 0 1.1rem; display: grid; place-items: center; background: var(--app-surface-2); border-radius: 5px; }
  .signal-wave svg { width: 91%; height: 62px; fill: none; stroke: var(--app-accent); stroke-width: 1.7; }
  .signal-wave svg .second { stroke: var(--app-visual); opacity: .85; }
  .signal-card h3 { margin: 0 0 .2rem; font-size: 1.16rem; font-weight: 740; color: var(--app-text-strong); }
  .signal-card .signal-key { margin: 0 0 .7rem; color: var(--app-accent); font-size: .78rem; font-weight: 680; }
  .signal-card > p:last-child { color: var(--app-muted); line-height: 1.6; font-size: .84rem; margin-bottom: 0; }
  .diagram-note { color: var(--app-muted); font-size: .78rem; line-height: 1.6; margin-top: 1rem; }
  .diagram-note strong { color: var(--app-text); font-weight: 670; }
  .pathways-head { max-width: none; display: grid; grid-template-columns: 1fr .75fr; align-items: end; gap: 3rem; }
  .door-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 1rem; }
  .door { display: flex; flex-direction: column; min-width: 0; border: 1px solid var(--app-border); border-radius: 8px; background: var(--app-surface); padding: 1.65rem; min-height: 288px; transition: border-color .2s ease, transform .2s ease; }
  .door:hover { border-color: var(--app-accent); transform: translateY(-2px); }
  .door-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.7rem; font-family: var(--app-font-mono); font-size: .69rem; letter-spacing: .10em; }
  .door-index { color: var(--app-muted-2); }
  .door-eyebrow { color: var(--app-accent); font-weight: 750; text-transform: uppercase; }
  .door h3 { max-width: 25ch; font-size: clamp(1.35rem, 2vw, 1.75rem); line-height: 1.22; letter-spacing: -.025em; margin: 0 0 .8rem; color: var(--app-text-strong); }
  .door-copy { color: var(--app-muted); line-height: 1.62; font-size: .9rem; max-width: 52ch; }
  .door-primary { color: var(--app-accent); display: inline-flex; gap: 1.3rem; font-weight: 760; text-decoration: none; align-items: center; margin-top: auto; font-size: .87rem; }
  .door-primary:hover { text-decoration: underline; text-underline-offset: .2rem; }
  .door-secondary { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; margin-top: .8rem; font-size: .77rem; }
  .door-secondary a, .door-secondary button { color: var(--app-muted); text-decoration: underline; text-underline-offset: .17rem; }
  .door-secondary button, .entrance-footer button { border: 0; background: none; padding: 0; width: auto; font: inherit; cursor: pointer; }
  .door-secondary button:hover, .door-secondary a:hover { color: var(--app-accent); }
  .separator { color: var(--app-muted-2); }
  .evolution { display: grid; grid-template-columns: .9fr 1.1fr; gap: clamp(1.6rem, 4vw, 4rem); padding: clamp(2rem, 4.4vw, 4.2rem); border-radius: 14px; background: #122c32; color: #d8e9e3; }
  .evolution .section-tag { color: #8ad5c3; }
  .evolution h2 { color: #f6f6ef; max-width: 14ch; }
  .evolution h2 em { color: #92dfc9; font-style: normal; }
  .evolution-intro > p:not(.section-tag) { color: #b3ceca; font-size: .94rem; line-height: 1.75; }
  .evolution-intro > a { display: inline-flex; align-items: center; gap: 1rem; color: #9bdcc9; font-weight: 700; text-decoration: none; margin-top: .8rem; }
  .evolution-intro > a:hover { text-decoration: underline; }
  .evolution-grid { display: grid; gap: .8rem; align-content: center; }
  .evolution-grid > div { border-top: 1px solid #d9f5e038; padding: 1.2rem .1rem .4rem; }
  .evolution-grid h3 { color: #f1f9f2; font-size: 1.22rem; margin: .4rem 0 .35rem; }
  .evolution-grid p { font-size: .86rem; line-height: 1.62; margin: 0; color: #b2cdc6; }
  .evolution-grid .step { font: 650 .62rem var(--app-font-mono); color: #8ccab8; letter-spacing: .1em; }
  .agent-invitation { display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 2rem; padding: clamp(1.5rem,3vw,2.7rem); border-radius: 12px; border: 1px solid var(--app-border); background: var(--app-surface); }
  .agent-invitation h2 { max-width: 18ch; margin: .7rem 0 1rem; font-size: clamp(1.8rem,3vw,2.8rem); line-height: 1.15; letter-spacing: -.035em; color: var(--app-text-strong); }
  .agent-invitation p:not(.section-tag) { margin: 0; max-width: 78ch; line-height: 1.7; color: var(--app-muted); }
  .agent-invitation > a { display: inline-flex; gap: 1rem; justify-content: space-between; align-items: center; padding: .85rem 1rem; border-radius: 4px; color: var(--app-on-accent); background: var(--app-accent); text-decoration: none; font-size: .85rem; font-weight: 760; white-space: nowrap; }
  .agent-invitation > a:hover { filter: brightness(1.12); }
  .closing { display: grid; grid-template-columns: 1fr .8fr; gap: clamp(2rem, 6vw, 7rem); align-items: center; }
  .closing p:not(.section-tag) { max-width: 62ch; line-height: 1.75; color: var(--app-muted); }
  .closing-actions { display: grid; border-top: 1px solid var(--app-border); }
  .closing-actions a { display: grid; grid-template-columns: 2rem 1fr 1rem; align-items: center; gap: .9rem; padding: 1.1rem .1rem; border-bottom: 1px solid var(--app-border); text-decoration: none; color: var(--app-text-strong); }
  .closing-actions a:hover { color: var(--app-accent); }
  .closing-actions a span:first-child { font: 650 .68rem var(--app-font-mono); color: var(--app-muted-2); }
  .closing-actions a strong { font-size: .98rem; }
  .entrance-footer { margin-top: clamp(4rem, 7vw, 7rem); border-top: 1px solid var(--app-border); padding-top: 1.4rem; }
  .entrance-footer p { font-size: .83rem; color: var(--app-muted); line-height: 1.7; max-width: 92ch; }
  .entrance-footer nav { display: flex; flex-wrap: wrap; gap: .7rem 1.35rem; margin-top: 1.15rem; align-items: center; font-size: .76rem; }
  .entrance-footer nav a, .entrance-footer nav button { color: var(--app-muted); }
  .entrance-footer nav a:hover, .entrance-footer nav button:hover { color: var(--app-accent); }
  .sticky-conversion { display: none; position: fixed; bottom: var(--app-bottom-dock-height, 48px); left: 0; right: 0; z-index: 110; padding: .5rem .75rem; background: var(--app-surface); border-top: 1px solid var(--app-border); }

  @media (max-width: 970px) {
    .hero { gap: 2rem; }
    .hero h1 { font-size: clamp(2.5rem, 4.8vw, 3.75rem); }
    .visual-top, .visual-bottom { font-size: .52rem; }
    .principle { padding-inline: .85rem; }
    .door { min-height: 310px; }
  }
  @media (max-width: 760px) {
    .hero { grid-template-columns: 1fr; padding-top: .5rem; gap: 2rem; }
    .identity { margin-bottom: 2.5rem; }
    .hero h1 { font-size: clamp(2.8rem, 10vw, 4.4rem); max-width: 14ch; }
    .knowledge-visual { width: 100%; max-width: 580px; margin-inline: auto; }
    .principles { grid-template-columns: 1fr 1fr; gap: 1rem 0; }
    .principle:nth-child(odd) { border-left: none; padding-left: 0; }
    .signal-grid { grid-template-columns: 1fr; }
    .signal-card { min-height: 0; }
    .pathways-head { grid-template-columns: 1fr; gap: .25rem; }
    .door-grid { grid-template-columns: 1fr; }
    .door { min-height: 260px; }
    .evolution, .closing, .agent-invitation { grid-template-columns: 1fr; }
    .evolution h2 { max-width: 24ch; }
    .sticky-conversion { display: block; }
  }
  @media (max-width: 420px) {
    .hero-actions .action { width: 100%; }
    .principle strong { font-size: .96rem; }
    .principle > span:last-child { font-size: .76rem; }
    .knowledge-visual { padding: .9rem .65rem .7rem; }
    .visual-top, .visual-bottom { padding-inline: .4rem; letter-spacing: .04em; }
    .evolution { padding: 1.4rem; }
  }
  @media (prefers-reduced-motion: reduce) {
    .action, .door { transition: none; }
    .action:hover, .door:hover { transform: none; }
  }
</style>
