<script>
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import ConversionBar from '../ui/entrance/ConversionBar.svelte'
  import ContributeProtocolModal from '../ui/entrance/ContributeProtocolModal.svelte'
  import CiteSstimModal from '../ui/entrance/CiteSstimModal.svelte'
  // General homepage citation points at the concept DOI (all versions), not a
  // pinned release — see src/ui/entrance/releaseMetadata.js.
  import { CONCEPT_DOI, doiUrl } from '../ui/entrance/releaseMetadata.js'
  import {
    BIOSYNCARE_URL,
    ECOSYSTEM_BRIEF_URL,
    GITHUB_URL,
    ONTOLOGY_DOCS_URL,
    W3C_GROUP_URL,
    ghBlob,
  } from '../ui/externalLinks.js'

  // The hero copy is also the share copy — one string, so a reworded headline
  // cannot leave the social preview quoting the old one.
  const SHARE_TITLE = 'Sensory stimulation, made open and reproducible'
  const SHARE_DESCRIPTION =
    'An open knowledge graph, an executable lab, and a community for designing ' +
    'and describing auditory, visual, and cross-modal stimulation.'

  // Display order decided 2026-07-13: Understand leads (PUBLIC_ENTRANCE.md).
  // Join/Contribute live once, inline in door ④ — not repeated in a hero or
  // footer bar (cut 2026-07-18 after review: three copies of the same two
  // buttons on one screen read as clutter, not as "always reachable").
  const doors = [
    {
      id: 'door-understand',
      eyebrow: 'Understand',
      title: 'Explore and reproduce the science.',
      // No BIDS/HED clause: that profile is a design target, not an exporter
      // anyone can run here (HED_BIDS_INTEROP.md says so in its own status
      // line), and this door was the one place promising it as a capability.
      copy: 'Browse the SSTIM ontology, follow the evidence behind a claim, and query it all with SPARQL.',
      primary: [
        { label: 'Explore the ontology', href: '/graph/' },
        { label: 'Query with SPARQL', href: '/sparql/' },
      ],
      // The generated OWL/SKOS reference is what a standards or ontology peer
      // reads before the graph, and it was reachable only from the top-bar
      // "+" menu and About. It exists in the deployed artifact only, so it
      // needs rel="external" to stay out of the prerender crawler's way.
      secondary: [
        { label: 'Read the reference docs', href: ONTOLOGY_DOCS_URL, external: true },
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
      title: 'Deploy and extend the open platform.',
      // One sentence, like the other three: the paragraph this replaced was
      // three times the length of its neighbours and broke the grid's rhythm.
      // The configured-at-deployment detail is the linked document's job.
      copy: 'One bit-reproducible package runs as a NixOS service, a container, or plain static files — and your data migrates between instances with no account.',
      primary: [
        { label: 'Deployment and portability', href: ghBlob('docs/technical/PORTABLE_DEPLOYMENT.md'), external: true },
        { label: 'Run it locally', href: GITHUB_URL + '#readme', external: true },
      ],
      secondary: [
        { label: 'Read the architecture', href: ghBlob('src/README.md'), external: true },
        { label: 'The four audio engines', href: ghBlob('src/engines/README.md'), external: true },
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
      // Back to one secondary link. The ecosystem brief was tried here and
      // moved to the hero: a reader who cannot yet place SSTIM against BSC Lab
      // against BioSynCare will not scroll to the fourth card to find that
      // out. The internal integration tracker was tried here too and is the
      // wrong artifact for a visitor — 500 lines of open workstreams and
      // outreach notes; it stays linked from About.
      secondary: [
        { label: 'Partner / consortium', href: ghBlob('docs/ecosystem/CONSORTIUM_INVITATION.md'), external: true },
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
  <!-- No `name="description"` here: svelte:head appends rather than replaces,
       so this page used to emit two conflicting description tags with the
       shell's weaker one first. app.html now carries SHARE_DESCRIPTION as the
       site-wide fallback and this page inherits it — keep the two in sync.

       A shared link previewed off that shell text, which is the one place it
       costs us the visitor. No og:url and no og:image: both must be absolute,
       and this artifact is deployed by other operators under their own origin
       (PORTABLE_DEPLOYMENT §1.6d), so a hardcoded labiosyncare.github.io would
       be wrong on every self-hosted instance, and a crawler never runs the
       script that could read the origin back. Title and description are
       origin-independent and carry the summary card on their own. -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="BSC Lab" />
  <meta property="og:title" content={SHARE_TITLE} />
  <meta property="og:description" content={SHARE_DESCRIPTION} />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={SHARE_TITLE} />
  <meta name="twitter:description" content={SHARE_DESCRIPTION} />
</svelte:head>

<main class="entrance">
  <header class="hero" id="hero" bind:this={heroEl}>
    <!-- The full stop lives here, not in SHARE_TITLE: the hero reads as a
         sentence, the <title> and og:title as labels. -->
    <h1>{SHARE_TITLE}.</h1>
    <p class="subhead">{SHARE_DESCRIPTION}</p>
    <!-- The one thing the four doors cannot do: place the three layers against
         each other. A visitor who does not yet know how SSTIM, BSC Lab and
         BioSynCare relate cannot tell which door is theirs, so the overview
         sits above them rather than behind door ④. One line, no button — the
         hero stays a hero. -->
    <p class="hero-orientation">
      New here? <a href={ECOSYSTEM_BRIEF_URL}>One-page ecosystem brief</a> — how
      the knowledge graph, this platform, and the applications fit together.
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
            <!-- The separator's own spaces cannot be trusted: Svelte trims the
                 whitespace inside this span, so the middot rendered flush
                 against the preceding link ("Browse presets· Cite SSTIM") on
                 every door with two secondary links. The gap is CSS. -->
            {#if i > 0}<span class="sep" aria-hidden="true">·</span>{/if}
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
      <!-- Qualified like its DOI neighbour, because it is an identifier rather
           than a destination: w3id.org/sstim answers a browser with this very
           page by design (pinned in scripts/w3id-negotiation.test.mjs — someone
           typing the namespace IRI cold wants the project), so the label has to
           say what the reader is being handed. Door ② carries the human
           destination for the namespace, the generated reference docs. -->
      <a href="https://w3id.org/sstim" rel="external">Namespace w3id.org/sstim</a>
      <span aria-hidden="true"> · </span>
      <a href={doiUrl(CONCEPT_DOI)} rel="external">DOI {CONCEPT_DOI}</a>
      <span aria-hidden="true"> · </span>
      <a href={GITHUB_URL} rel="external">GitHub</a>
      <span aria-hidden="true"> · </span>
      <!-- The separate commercial application, named as such: an unqualified
           "BioSynCare" in the footer of the open platform is exactly the
           conflation CLAUDE.md §11 exists to prevent. About explains the
           relationship in full, one link along. -->
      <a href={BIOSYNCARE_URL} rel="external">BioSynCare (commercial app)</a>
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
    margin: 0 0 0.75rem;
  }

  .hero-orientation {
    font-size: 0.88rem;
    line-height: 1.55;
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

  .door-secondary .sep {
    margin: 0 0.15rem 0 0.3rem;
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
