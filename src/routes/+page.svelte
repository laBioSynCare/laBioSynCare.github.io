<script>
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import ConversionBar from '../ui/entrance/ConversionBar.svelte'
  import ContributeProtocolModal from '../ui/entrance/ContributeProtocolModal.svelte'
  import CiteSstimModal from '../ui/entrance/CiteSstimModal.svelte'

  const GH = 'https://github.com/laBioSynCare/laBioSynCare.github.io'
  const GH_BLOB = GH + '/blob/main/'
  const W3C_GROUP_URL = 'https://www.w3.org/community/sstim/'

  // Display order decided 2026-07-13: Understand leads (PUBLIC_ENTRANCE.md).
  // Join/Contribute live once, inline in door ④ — not repeated in a hero or
  // footer bar (cut 2026-07-18 after review: three copies of the same two
  // buttons on one screen read as clutter, not as "always reachable").
  const doors = [
    {
      id: 'door-understand',
      eyebrow: 'Understand',
      title: 'Explore and reproduce the science.',
      copy: 'Browse the SSTIM ontology, query it with SPARQL, and encode a protocol across BIDS/HED.',
      primary: [
        { label: 'Explore the ontology', href: '/graph/' },
        { label: 'Query with SPARQL', href: '/sparql/' },
      ],
      secondary: [
        { label: 'Cite SSTIM', action: 'cite' },
      ],
    },
    {
      id: 'door-experience',
      eyebrow: 'Experience',
      title: 'Try a session.',
      copy: 'Audio-visual sessions in your browser — no install, start gently.',
      primary: [{ label: 'Open Patch Studio', href: '/creator/' }],
      secondary: [
        { label: 'Try the Sensory Field', href: '/field/' },
        { label: 'Browse presets', href: '/presets/' },
      ],
    },
    {
      id: 'door-build',
      eyebrow: 'Build',
      title: 'Build on the open platform.',
      copy: 'Run BSC Lab locally and extend the audio engines or RDF pipeline.',
      primary: [
        { label: 'Read the architecture', href: GH_BLOB + 'src/README.md', external: true },
        { label: 'Run it locally', href: GH + '#readme', external: true },
      ],
      secondary: [
        { label: 'The four audio engines', href: GH_BLOB + 'src/engines/README.md', external: true },
      ],
    },
    {
      id: 'door-join',
      eyebrow: 'Join',
      title: 'Join the community.',
      copy: 'Shape the shared vocabulary, propose a protocol, or partner as an institution.',
      primary: [
        { label: 'Join the W3C group', href: W3C_GROUP_URL, external: true },
        { label: 'Contribute a protocol', action: 'contribute' },
      ],
      secondary: [
        { label: 'Partner / consortium', href: GH_BLOB + 'docs/ecosystem/CONSORTIUM_INVITATION.md', external: true },
      ],
    },
  ]

  let contributeOpen = $state(false)
  let citeOpen = $state(false)
  let heroEl = $state(null)
  let heroVisible = $state(true)

  onMount(() => {
    // Legacy graph deep links land here (`/#term` was the published citable
    // form before the browser moved to /graph): forward every non-entrance
    // hash to the knowledge browser so shared links keep resolving.
    const hash = window.location.hash
    if (hash && !hash.startsWith('#door-') && hash !== '#hero') {
      goto('/graph/' + hash, { replaceState: true })
      return
    }
    // Mobile-only: once the hero has scrolled away, the doors stack into a
    // long single column — surface the two conversion actions in a sticky
    // bar so they stay reachable without a return trip to door ④.
    const observer = new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting
    })
    if (heroEl) observer.observe(heroEl)
    return () => observer.disconnect()
  })
</script>

<svelte:head>
  <title>BSC Lab · Sensory stimulation, made open and reproducible</title>
  <meta
    name="description"
    content="An open knowledge graph, an executable lab, and a community for designing and describing auditory, visual, and cross-modal stimulation."
  />
</svelte:head>

<main class="entrance">
  <header class="hero" id="hero" bind:this={heroEl}>
    <h1>Sensory stimulation, made open and reproducible.</h1>
    <p class="subhead">
      An open knowledge graph, an executable lab, and a community for designing
      and describing auditory, visual, and cross-modal stimulation.
    </p>
  </header>

  <section class="doors" aria-label="Choose your path">
    {#each doors as door (door.id)}
      <article class="door" id={door.id}>
        <p class="eyebrow">{door.eyebrow}</p>
        <h2>{door.title}</h2>
        <p class="door-copy">{door.copy}</p>
        <p class="door-actions">
          {#each door.primary as action}
            {#if action.action === 'contribute'}
              <button type="button" onclick={() => contributeOpen = true}>{action.label}</button>
            {:else}
              <a role="button" href={action.href} rel={action.external ? 'external' : undefined}>{action.label}</a>
            {/if}
          {/each}
        </p>
        <p class="door-secondary">
          {#each door.secondary as action, i}
            {#if i > 0}<span aria-hidden="true"> · </span>{/if}
            {#if action.action === 'cite'}
              <button type="button" class="link-like" onclick={() => citeOpen = true}>{action.label}</button>
            {:else}
              <a href={action.href} rel={action.external ? 'external' : undefined}>{action.label}</a>
            {/if}
          {/each}
        </p>
      </article>
    {/each}
  </section>

  <footer class="entrance-footer">
    <p class="one-liner">
      Open standards and reference infrastructure for responsible sensory
      stimulation and sensory neurotechnology.
    </p>
    <p class="footer-links">
      <a href="https://w3id.org/sstim" rel="external">w3id.org/sstim</a>
      <span aria-hidden="true"> · </span>
      <a href="https://doi.org/10.5281/zenodo.21380171" rel="external">DOI 10.5281/zenodo.21380171</a>
      <span aria-hidden="true"> · </span>
      <a href={GH} rel="external">GitHub</a>
      <span aria-hidden="true"> · </span>
      <a href="/about/">About</a>
    </p>
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
    max-width: 960px;
    margin: 0 auto;
    padding: 2.5rem 1.15rem 4rem;
    color: var(--app-text);
    font-family: var(--app-font-ui);
  }

  .hero {
    margin-bottom: 2.25rem;
  }

  .hero h1 {
    font-size: clamp(1.9rem, 4vw, 2.6rem);
    line-height: 1.08;
    font-weight: 800;
    color: var(--app-text-strong);
    margin: 0 0 0.85rem;
  }

  .subhead {
    font-size: 1.02rem;
    line-height: 1.6;
    max-width: 68ch;
    color: var(--app-muted);
    margin: 0 0 1.35rem;
  }

  .doors {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }

  .door {
    margin: 0;
    padding: 1.25rem 1.25rem 1.1rem;
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
  }

  .eyebrow {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--app-accent);
    margin: 0 0 0.35rem;
  }

  .door h2 {
    font-size: 1.18rem;
    line-height: 1.2;
    font-weight: 700;
    color: var(--app-text-strong);
    margin: 0 0 0.55rem;
  }

  .door-copy {
    font-size: 0.9rem;
    line-height: 1.55;
    color: var(--app-muted);
    margin: 0 0 0.9rem;
  }

  .door-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin: 0 0 0.7rem;
  }

  .door-actions a[role='button'],
  .door-actions button {
    font-size: 0.82rem;
    font-weight: 700;
    padding: 0.45rem 0.85rem;
  }

  .door-secondary {
    font-size: 0.82rem;
    line-height: 1.5;
    margin: 0;
    color: var(--app-muted);
  }

  .door-secondary .link-like {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    font: inherit;
    font-size: inherit;
    color: var(--app-accent);
    text-decoration: underline;
    cursor: pointer;
  }

  .entrance-footer {
    margin-top: 2.5rem;
    padding-top: 1.5rem;
    border-top: var(--app-border-width) solid var(--app-border);
  }

  .one-liner {
    font-size: 0.88rem;
    line-height: 1.6;
    max-width: 70ch;
    color: var(--app-muted);
    margin: 0 0 0.7rem;
  }

  .footer-links {
    font-size: 0.82rem;
    margin: 0;
  }

  .sticky-conversion {
    display: none;
    position: fixed;
    left: 0;
    right: 0;
    bottom: var(--app-bottom-dock-height, 48px);
    z-index: 110;
    padding: 0.5rem 0.75rem;
    background: color-mix(in srgb, var(--app-surface) 94%, #000 6%);
    border-top: var(--app-border-width) solid var(--app-border);
  }

  @media (max-width: 767px) {
    .doors {
      grid-template-columns: 1fr;
    }

    .sticky-conversion {
      display: block;
    }
  }
</style>
