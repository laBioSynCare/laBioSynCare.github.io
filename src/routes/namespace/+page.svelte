<script>
  // What a person gets when they dereference https://w3id.org/sstim in a browser.
  //
  // Until ADR 0055 the HTML branch of the w3id content negotiation landed on the
  // Workbench entrance, a four-door product page that never said the visitor had
  // followed a linked-data namespace IRI, what the namespace was, or which IRIs
  // belonged to it. The generated reference documents could not take the job
  // either: a server never sees a fragment, so one destination has to answer both
  // `/sstim` and `/sstim#Preset`, and measured 2026-08-23 WIDOCO anchors by full
  // IRI while pyLODE anchors by label, so both left the reader at the top of an
  // index with nothing selected.
  //
  // So this page answers the bare IRI and forwards the fragment case onward,
  // exactly as the entrance does. It is deliberately not at `/ontology/`, which
  // is the static Turtle directory and WIDOCO's mount.
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { applicationRoute, applicationAsset } from '../../config/applicationUrls.js'
  import { PREFIXES } from '../../rdf/namespaces.js'
  import {
    CONCEPT_DOI,
    NAMESPACE_IRI,
    RELEASE_DATE,
    RELEASE_VERSION,
    VERSION_DOI,
    VERSION_IRI,
    doiUrl,
  } from '../../ui/entrance/releaseMetadata.js'
  import { GITHUB_URL, ONTOLOGY_DOCS_URL, VOCAB_DOCS_URL, W3C_GROUP_URL, ghBlob } from '../../ui/externalLinks.js'
  import StructuredData from '../../ui/seo/StructuredData.svelte'

  // Every IRI shown below is built from the shared prefix table rather than
  // retyped, so a namespace that moves cannot leave this page quietly wrong
  // (CLAUDE.md §5.1).
  const termSpaces = [
    { prefix: 'sstim', what: 'OWL classes and properties. The ontology proper.' },
    { prefix: 'sstim-v', what: 'SKOS concepts: frequency bands, techniques, modalities.' },
    { prefix: 'sstim-sh', what: 'SHACL shapes that validate conforming data.' },
    { prefix: 'sstim-ex', what: 'Exposure terms: how a stimulus reaches a person.' },
    { prefix: 'sstim-eco', what: 'Ecosystem terms: agents, relationships, engagement records.' },
  ]

  const catalogSpaces = [
    { prefix: 'bsc-fw', what: 'The BSC framework and the techniques it originated.' },
    { prefix: 'bsclab', what: 'Open reference implementation: presets, evidence, sessions.' },
    { prefix: 'biosyncare', what: 'The separate commercial application’s catalog identities.' },
    { prefix: 'sstim-ref', what: 'Cited literature, one identifier per reference.' },
    { prefix: 'sstim-specialist', what: 'People recorded in the live ecosystem graph.' },
    { prefix: 'sstim-organization', what: 'Organizations recorded in the live ecosystem graph.' },
  ]

  // The retrieval endpoints are paths under the namespace rather than prefixed
  // term spaces, so they are listed by shape instead of by prefix.
  const endpoints = [
    { path: '/<version>', what: `A frozen, immutable release. Currently up to ${RELEASE_VERSION}.` },
    { path: '/manifest', what: 'Machine-readable bill of materials for the modules.' },
    { path: '/profile/{kernel,core,core-plus,full}', what: 'Profile entry points, smallest to largest.' },
    { path: '/module/exposure', what: 'One module, retrieved exactly.' },
    { path: '/void', what: 'VoID and DCAT description of the dataset.' },
  ]

  const negotiation = [
    { accept: 'text/turtle', gets: 'The namespace document as Turtle. This is the default.' },
    { accept: 'application/ld+json', gets: 'The same graph as JSON-LD.' },
    { accept: 'application/rdf+xml', gets: 'The same graph as RDF/XML.' },
    { accept: 'text/html', gets: 'This page.' },
  ]

  let copied = $state(false)
  const curl = `curl -H "Accept: text/turtle" -L ${NAMESPACE_IRI}`

  async function copyCurl() {
    try {
      await navigator.clipboard.writeText(curl)
      copied = true
      setTimeout(() => { copied = false }, 1600)
    } catch {
      // Clipboard blocked (insecure context, permission denied). The command is
      // on screen and selectable, so a failed copy costs nothing.
    }
  }

  onMount(() => {
    // A term IRI carries its fragment past the redirect: the server saw
    // `/sstim` and sent us here, and the browser re-appended `#Preset`. Only the
    // knowledge browser can resolve that, so hand it over. Anchors belonging to
    // this page are excluded by prefix.
    const hash = window.location.hash
    if (hash && !hash.startsWith('#section-')) {
      goto(applicationRoute('/graph/') + hash, { replaceState: true })
    }
  })
</script>

<svelte:head>
  <title>The SSTIM namespace</title>
  <meta
    name="description"
    content="https://w3id.org/sstim is a persistent linked-data namespace: what it returns, which IRIs belong to it, and where to read the vocabulary."
  />
</svelte:head>

<!-- The machine-readable half of this page. ADR 0055 makes this route the HTML
     branch of https://w3id.org/sstim, so a crawler following the namespace IRI
     lands here: it is the one page whose visible content *is* the dataset
     description, which is what schema.org Dataset markup is supposed to
     accompany. Deliberately not on the entrance, which is about the Workbench. -->
<StructuredData />

<main class="namespace">
  <header class="masthead">
    <p class="eyebrow">Linked-data namespace</p>
    <h1>{NAMESPACE_IRI}</h1>
    <p class="lede">
      You have reached a persistent identifier, not a website. This IRI names the
      SSTIM ontology and controlled vocabulary for sensory stimulation. Ask it for
      RDF and it returns RDF; ask it for HTML and it returns this page.
    </p>
  </header>

  <section id="section-release" class="panel release">
    <h2>Current release</h2>
    <dl>
      <div><dt>Version</dt><dd>{RELEASE_VERSION}, {RELEASE_DATE}</dd></div>
      <div><dt>Version IRI</dt><dd><a href={VERSION_IRI}><code>{VERSION_IRI}</code></a></dd></div>
      <div><dt>Licence</dt><dd><a href="https://creativecommons.org/licenses/by/4.0/" rel="external">CC BY 4.0</a></dd></div>
      <div>
        <dt>Cite</dt>
        <dd>
          <a href={doiUrl(CONCEPT_DOI)} rel="external"><code>{CONCEPT_DOI}</code></a>
          for SSTIM in general,
          <a href={doiUrl(VERSION_DOI)} rel="external"><code>{VERSION_DOI}</code></a>
          to pin this release.
        </dd>
      </div>
    </dl>
    <p class="note">
      The RDF served from the bare namespace IRI is always the latest
      <strong>release</strong>, never work in progress, so a graph you fetch today
      carries a version IRI you can cite tomorrow.
    </p>
  </section>

  <section id="section-negotiation" class="panel">
    <h2>What this IRI returns</h2>
    <table>
      <thead><tr><th scope="col">Request <code>Accept</code></th><th scope="col">You get</th></tr></thead>
      <tbody>
        {#each negotiation as row}
          <tr><td><code>{row.accept}</code></td><td>{row.gets}</td></tr>
        {/each}
      </tbody>
    </table>
    <div class="curl">
      <code>{curl}</code>
      <button type="button" onclick={copyCurl} aria-label="Copy the command">
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  </section>

  <section id="section-iris" class="panel">
    <h2>Which IRIs belong to SSTIM</h2>
    <p class="intro">
      Every identifier below resolves. Fragment IRIs open in the knowledge browser
      with the term selected; the rest return the document that defines them.
    </p>

    <h3>Ontology term spaces</h3>
    <table>
      <thead><tr><th scope="col">Prefix</th><th scope="col">Namespace</th><th scope="col">Holds</th></tr></thead>
      <tbody>
        {#each termSpaces as row}
          <tr>
            <td><code>{row.prefix}:</code></td>
            <td><code class="iri">{PREFIXES[row.prefix]}</code></td>
            <td>{row.what}</td>
          </tr>
        {/each}
      </tbody>
    </table>

    <h3>Retrieval endpoints</h3>
    <table>
      <thead><tr><th scope="col">Path</th><th scope="col">Returns</th></tr></thead>
      <tbody>
        {#each endpoints as row}
          <tr><td><code class="iri">{NAMESPACE_IRI}{row.path}</code></td><td>{row.what}</td></tr>
        {/each}
      </tbody>
    </table>

    <h3>Catalog and ecosystem identities</h3>
    <p class="intro">
      Records rather than vocabulary: implementations, framework techniques, cited
      literature, and the people and organizations in the ecosystem graph. They
      use the SSTIM namespace but are not ontology terms.
    </p>
    <table>
      <thead><tr><th scope="col">Prefix</th><th scope="col">Namespace</th><th scope="col">Holds</th></tr></thead>
      <tbody>
        {#each catalogSpaces as row}
          <tr>
            <td><code>{row.prefix}:</code></td>
            <td><code class="iri">{PREFIXES[row.prefix]}</code></td>
            <td>{row.what}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>

  <section id="section-read" class="panel">
    <h2>Read the vocabulary</h2>
    <div class="cards">
      <a class="card" href={ONTOLOGY_DOCS_URL} rel="external">
        <strong>Reference documentation</strong>
        <span>Every class and property, generated with WIDOCO.</span>
      </a>
      <a class="card" href={VOCAB_DOCS_URL} rel="external">
        <strong>Vocabulary</strong>
        <span>The SKOS concept schemes, generated with pyLODE.</span>
      </a>
      <a class="card" href={applicationRoute('/graph/')}>
        <strong>Knowledge browser</strong>
        <span>The whole graph, navigable. Term IRIs open here.</span>
      </a>
      <a class="card" href={applicationRoute('/sparql/')}>
        <strong>SPARQL</strong>
        <span>Query the graph in your browser, no endpoint needed.</span>
      </a>
      <!-- The manifest, not a `/ontology/` directory index: GitHub Pages serves
           no listings, so that link 404s in production. The prerenderer caught
           it here first. -->
      <a class="card" href={applicationAsset('/ontology/manifest.json')}>
        <strong>Module inventory</strong>
        <span>The machine-readable bill of materials: every module and profile.</span>
      </a>
      <a class="card" href={ghBlob('static/ontology/README.md')} rel="external">
        <strong>Design decisions</strong>
        <span>Why the ontology is shaped the way it is.</span>
      </a>
    </div>
  </section>

  <footer class="foot">
    <p>
      SSTIM is developed through the
      <a href={W3C_GROUP_URL} rel="external">W3C Sensory Stimulation Vocabulary Community Group</a>.
      Sources and issues on <a href={GITHUB_URL} rel="external">GitHub</a>.
      <a href={applicationRoute('/')}>SSTIM Workbench</a> is the reference environment for this vocabulary.
    </p>
  </footer>
</main>

<style>
  .namespace {
    max-width: 54rem;
    margin: 0 auto;
    padding: 2rem 1.25rem 4rem;
    display: grid;
    gap: 1.5rem;
  }

  .masthead { display: grid; gap: 0.5rem; }

  .eyebrow {
    margin: 0;
    font-size: 0.72rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--app-accent);
  }

  .masthead h1 {
    margin: 0;
    font-size: clamp(1.3rem, 4vw, 2rem);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    overflow-wrap: anywhere;
  }

  .lede { margin: 0; font-size: 1rem; line-height: 1.6; max-width: 44rem; }

  .panel {
    padding: 1.1rem 1.25rem;
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
  }

  .panel h2 { margin: 0 0 0.75rem; font-size: 1rem; }
  .panel h3 { margin: 1.4rem 0 0.5rem; font-size: 0.85rem; letter-spacing: 0.02em; }
  .panel h3:first-of-type { margin-top: 0.9rem; }

  .intro { margin: 0 0 0.7rem; font-size: 0.85rem; line-height: 1.55; }
  .note { margin: 0.9rem 0 0; font-size: 0.83rem; line-height: 1.55; }

  .release dl { display: grid; gap: 0.4rem; margin: 0; }
  .release dl > div { display: grid; grid-template-columns: 7rem 1fr; gap: 0.75rem; align-items: baseline; }
  .release dt { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.75; }
  .release dd { margin: 0; font-size: 0.88rem; line-height: 1.5; }

  /* Wide content scrolls inside its own box so the page body never does. */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.83rem;
    display: block;
    overflow-x: auto;
  }

  th, td {
    text-align: left;
    padding: 0.4rem 0.6rem 0.4rem 0;
    border-bottom: 1px solid var(--app-border);
    vertical-align: top;
  }

  th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.75; font-weight: 600; }
  tbody tr:last-child td { border-bottom: none; }

  code { font-size: 0.82em; overflow-wrap: anywhere; }
  .iri { opacity: 0.85; }

  .curl {
    margin-top: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.55rem 0.7rem;
    background: var(--app-accent-soft);
    border-radius: var(--app-radius);
  }

  .curl code { flex: 1; overflow-x: auto; white-space: nowrap; }

  .curl button {
    margin: 0;
    padding: 0.25rem 0.7rem;
    font-size: 0.75rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    background: var(--app-surface);
    color: inherit;
    cursor: pointer;
    flex-shrink: 0;
  }

  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: 0.6rem; }

  .card {
    display: grid;
    gap: 0.2rem;
    padding: 0.7rem 0.85rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    text-decoration: none;
    color: inherit;
  }

  .card:hover { border-color: var(--app-accent); background: var(--app-accent-soft); }
  .card strong { font-size: 0.87rem; }
  .card span { font-size: 0.78rem; line-height: 1.45; opacity: 0.8; }

  .foot { font-size: 0.8rem; line-height: 1.6; opacity: 0.85; }
  .foot p { margin: 0; }
</style>
