<script>
  // Static content page — no runes needed. The bottom-dock screens, described
  // here for orientation, are kept in the same order as AppBottomDock.svelte.
  import { applicationRoute } from '../../config/applicationUrls.js'
  import {
    CONCEPT_DOI,
    RELEASE_DATE,
    RELEASE_VERSION,
    doiUrl,
  } from '../../ui/entrance/releaseMetadata.js'
  import Isotype from '../../ui/brand/Isotype.svelte'
  import {
    BIOSYNCARE_URL,
    GITHUB_URL,
    ONTOLOGY_DOCS_URL,
    VOCAB_DOCS_URL,
    W3C_GROUP_URL,
    ghBlob,
  } from '../../ui/externalLinks.js'

  const screens = [
    {
      href: applicationRoute('/graph/'),
      label: 'Graph Navigator',
      role: 'Semantic exploration',
      emoji: '🕸️',
      color: 'var(--app-accent)',
      action: 'Explore the graph',
      what:
        'Browse SSTIM as a connected knowledge graph: ontology terms, controlled vocabulary, ' +
        'public reference records, and the relationships between them.',
      how:
        'Choose a scope, search with /, and select a node for its definition, stable IRI, ' +
        'source, and connections. Focus its neighbourhood when the whole graph is too dense. ' +
        'Public and private annotations remain separate from authoritative SSTIM terms.',
    },
    {
      href: applicationRoute('/creator/'),
      label: 'Patch Studio',
      role: 'Real-time authoring',
      emoji: '🎛️',
      color: 'var(--app-visual)',
      action: 'Open Patch Studio',
      what:
        'Build and preview layered audio-visual patches, including first-class stereoscopic ' +
        'scenes, modulation, a resizable Mix view, and photosensitivity safeguards.',
      how:
        'Start empty or use a Field starter, then add ordinary audio and visual tracks. ' +
        'Preview, save, import, and export the patch from one workspace. Haptic tracks are ' +
        'authoring metadata for now; this browser build does not provide a haptic delivery engine.',
    },
    {
      href: applicationRoute('/presets/'),
      label: 'Presets',
      role: 'Reference catalog',
      emoji: '🎚️',
      color: 'var(--app-control)',
      action: 'Browse public presets',
      what:
        'A public reference catalog read from SSTIM RDF, with frequency targets, groups, ' +
        'provenance, and evidence assessments kept visible rather than flattened into a score.',
      how:
        'Search and filter the catalog, inspect how each record is described, then follow its ' +
        'source and evidence links. These are BSC Lab reference records, not the private ' +
        'BioSynCare catalog and not recommendations for treatment.',
    },
    {
      href: applicationRoute('/sparql/'),
      label: 'SPARQL',
      role: 'Query workbench',
      emoji: '🔎',
      color: 'var(--app-ok)',
      action: 'Open the workbench',
      what:
        'A SPARQL 1.1 workbench that runs entirely in your browser (Comunica over an ' +
        'N3 store), querying the ontology and the public instance data together.',
      how:
        'Begin with a documented example or write your own query. The workbench explains ' +
        'which named graphs are loaded, shows execution status and result counts, and lets ' +
        'you copy tabular results without sending the query to a remote endpoint.',
    },
    {
      href: applicationRoute('/logbook/'),
      label: 'Logbook',
      role: 'Personal record',
      emoji: '📓',
      color: 'var(--app-warn)',
      action: 'Open your logbook',
      what:
        'A private, long-term record of your sensory-stimulation work — sessions, ' +
        'observations, ideas, activities, initiatives, notes, and achievements, across ' +
        'multiple named logbooks.',
      how:
        'Add entries, tag them, and filter by tag. Entries are stored locally in your ' +
        'browser. When sign-in is configured, the current account selects a separate local ' +
        'scope; that does not by itself sync logbooks to a server. Your data is never ' +
        'committed to the repository.',
    },
    {
      href: applicationRoute('/settings/'),
      label: 'Settings',
      role: 'Appearance, engine, safety',
      emoji: '⚙️',
      color: 'var(--app-muted)',
      action: 'Review settings',
      what:
        'Where you choose the visual skin, the audio engine, and the photosensitivity ' +
        'safety behaviour.',
      how:
        'Preview a skin, choose the Patch Studio audio engine, and review visual-safety and ' +
        'storage behaviour. Capability checks explain unavailable choices and safe fallbacks.',
    },
  ]

  // Public project architecture after the repository migration. Historical
  // BSC and BioSynCare RDF identities remain real modeled entities; presenting
  // them here does not make either one the identity or owner of SSTIM.
  const layers = [
    {
      name: 'W3C Sensory Stimulation Vocabulary Community Group',
      tag: 'Open community',
      color: 'var(--app-control)',
      body:
        'The W3C Community Group in which SSTIM is developed. Community Group work is open ' +
        'technical work; it is not a W3C Recommendation or W3C-endorsed technology.',
    },
    {
      name: 'SSTIM',
      tag: 'Specification · vocabulary · community project',
      color: 'var(--app-visual)',
      body:
        'The overall open specification, RDF vocabulary, semantic infrastructure, documentation, ' +
        'interoperability work, reference tooling, and community project. Its canonical ' +
        'identifiers remain under w3id.org/sstim; this GitHub Pages site is a publication location.',
    },
    {
      name: 'SSTIM Workbench',
      tag: 'Non-normative reference software',
      color: 'var(--app-accent)',
      mark: 'bsclab',
      body:
        'The executable environment you are using now. It contains Graph Navigator, Patch Studio, ' +
        'the SPARQL workbench, presets, and supporting engines. It demonstrates and exercises ' +
        'SSTIM, but its behavior is not automatically a normative requirement of the specification.',
    },
    {
      name: 'BSC',
      tag: 'Framework · preserved provenance',
      color: 'var(--app-ok)',
      body:
        'A framework represented within SSTIM and part of the imported development provenance. ' +
        'Its implementation records, protocols, identifiers, and originated technique identities ' +
        'remain intact; they are not mechanically renamed to match the Workbench brand.',
    },
    {
      name: 'BioSynCare',
      tag: 'Commercial application',
      color: 'var(--app-haptic)',
      mark: 'biosyncare',
      body:
        'A separate, closed-source commercial application in its own repository. Versioned ' +
        'exports and SSTIM mappings are the intended interoperability boundary. BioSynCare is ' +
        'an ecosystem participant and implementation, not the identity of SSTIM; its private ' +
        'catalog, application code, and private data are outside this repository.',
    },
  ]

  const trustSignals = [
    {
      label: 'Open implementation',
      value: 'Imported Workbench software retains Apache-2.0; repository contribution terms are artifact-specific.',
    },
    {
      label: 'Citable knowledge',
      value: `SSTIM ${RELEASE_VERSION} (${RELEASE_DATE}) uses stable w3id.org IRIs, CC BY 4.0, and a DOI.`,
    },
    {
      label: 'Private by default',
      value: 'Personal work stays in this browser; any account-backed annotation or patch storage is deployment-specific.',
    },
    {
      label: 'Bounded claims',
      value: 'Non-clinical; evidence tiers are structured assessments, not independent certification.',
    },
  ]

  const links = [
    { label: 'Source repository', href: GITHUB_URL, external: true },
    { label: 'Ontology reference docs', href: ONTOLOGY_DOCS_URL, external: true },
    { label: 'Vocabulary docs', href: VOCAB_DOCS_URL, external: true },
    { label: 'Ontology DOI (all versions)', href: doiUrl(CONCEPT_DOI), external: true },
    { label: 'W3C Community Group', href: W3C_GROUP_URL, external: true },
    { label: 'Governance & contribution terms', href: ghBlob('CONTRIBUTING.md#8-governance-and-licensing-during-migration'), external: true },
    { label: 'HED / BIDS interoperability', href: ghBlob('docs/ecosystem/HED_BIDS_INTEROP.md'), external: true },
    { label: 'Ecosystem working plan', href: ghBlob('docs/ecosystem/ECOSYSTEM_INTEGRATION.md'), external: true },
    // The page above describes BioSynCare in a card of its own; until now it
    // was the only one of the four layers a reader could not go and look at.
    { label: 'BioSynCare (commercial app)', href: BIOSYNCARE_URL, external: true },
  ]
</script>

<svelte:head>
  <title>About | SSTIM Workbench</title>
  <meta
    name="description"
    content="How SSTIM, SSTIM Workbench, Graph Navigator, Patch Studio, preserved BSC provenance, and the separate BioSynCare implementation relate."
  />
</svelte:head>

<main class="about-page">
  <header class="hero" id="overview">
    <div class="hero-copy">
      <div class="brand-lockup">
        <Isotype name="bsclab" size={52} title="SSTIM Workbench mark" />
        <div>
          <p class="eyebrow">Open research &amp; engineering platform</p>
          <h1>SSTIM Workbench</h1>
        </div>
      </div>
      <p class="lede">
        Build sensory-stimulation patches and examine the knowledge behind them. SSTIM Workbench
        brings <strong>Patch Studio</strong> and <strong>Graph Navigator</strong> together with <strong>SSTIM</strong>, a public RDF
        knowledge graph for techniques, parameters, exposure, safety metadata, and evidence.
      </p>
      <div class="hero-actions" aria-label="Start using SSTIM Workbench">
        <a class="primary-action" href={applicationRoute('/creator/')}>Open Patch Studio</a>
        <a class="secondary-action" href={applicationRoute('/graph/')}>Explore SSTIM</a>
      </div>
      <p class="scope-note">
        <strong>Non-clinical scope.</strong> SSTIM Workbench supports exploration and authoring. It
        does not diagnose, treat, cure, or prevent any condition, and makes no claim of
        clinical efficacy. <a href={ghBlob('docs/concept/SCOPE.md')} rel="external">Read the scope</a>.
      </p>
    </div>

    <aside class="trust-panel" aria-labelledby="trust-title">
      <p class="trust-kicker">Trust at a glance</p>
      <h2 id="trust-title">Know what you are using</h2>
      <dl>
        {#each trustSignals as signal}
          <div>
            <dt>{signal.label}</dt>
            <dd>{signal.value}</dd>
          </div>
        {/each}
      </dl>
    </aside>
  </header>

  <nav class="section-nav" aria-label="About this page">
    <a href="#ecosystem">Ecosystem</a>
    <a href="#surfaces">What you can do</a>
    <a href="#sstim">SSTIM &amp; data</a>
    <a href="#links">Sources &amp; licensing</a>
  </nav>

  <section class="block" id="ecosystem">
    <h2>How the pieces fit</h2>
    <p class="section-intro">
      SSTIM is the Community Group's overall open project. SSTIM Workbench is its executable
      reference environment; Graph Navigator and Patch Studio are Workbench components.
      BSC identities remain as real framework and implementation provenance, while BioSynCare
      remains a separate commercial implementation and ecosystem participant.
    </p>
    <div class="ecosystem-map" aria-label="Relationship between the W3C Community Group, SSTIM, SSTIM Workbench, BSC, and BioSynCare">
      <div class="map-owner">
        <div><strong>W3C Sensory Stimulation Vocabulary Community Group</strong><span>Open community developing SSTIM</span></div>
      </div>
      <div class="map-branches">
        <article>
          <span class="map-label">Overall open project</span>
          <strong>SSTIM</strong>
          <span>Specification, vocabulary, documentation, Graph Navigator, and SSTIM Workbench with Patch Studio</span>
        </article>
        <article>
          <span class="map-label">Separate application</span>
          <strong>BioSynCare</strong>
          <span>Closed-source product; no shared private catalog or application code</span>
        </article>
      </div>
      <p class="map-foundation"><strong>BSC framework and BSC Lab records</strong> remain preserved implementation provenance inside the knowledge base; they are not SSTIM's public identity.</p>
    </div>
    <div class="layer-grid">
      {#each layers as layer}
        <article class="layer-card" style="--card-color: {layer.color}">
          <span class="layer-tag">{layer.tag}</span>
          <div class="layer-head">
            {#if layer.mark}
              <Isotype name={layer.mark} size={38} title="{layer.name} isotype" />
            {/if}
            <h3>{layer.name}</h3>
          </div>
          <p>{layer.body}</p>
        </article>
      {/each}
    </div>
  </section>

  <section class="block" id="surfaces">
    <h2>What you can do here</h2>
    <p class="section-intro">
      Every screen below is reachable from the dock at the bottom of the window. This is a
      working application, not a landing page — jump straight in from any card.
    </p>
    <div class="screen-grid">
      {#each screens as s}
        <article class="screen-card" style="--card-color: {s.color}">
          <div class="screen-head">
            <span class="screen-emoji" aria-hidden="true">{s.emoji}</span>
            <div class="screen-heading">
              <a class="screen-title" href={s.href}>{s.label}</a>
              <span class="screen-role">{s.role}</span>
            </div>
          </div>
          <p class="screen-what">{s.what}</p>
          <p class="screen-how"><span class="how-label">How to use</span>{s.how}</p>
          <a class="card-action" href={s.href}>{s.action}<span aria-hidden="true"> →</span></a>
        </article>
      {/each}
    </div>

    <aside class="callout">
      <span class="callout-emoji" aria-hidden="true">✍️</span>
      <div class="callout-body">
        <h3>Annotate the ontology</h3>
        <p>
          SSTIM terms can carry notes in the <a href={applicationRoute('/graph/')}>Graph knowledge browser</a>.
          Notes use W3C Web Annotation records in named graphs kept separate from the
          authoritative ontology, so annotating never alters a source term. On a local-only
          deployment, notes stay in this browser; the public/private choice records sharing
          intent for export but does not publish anything. A deployment configured with
          accounts and shared annotations can let signed-in authors publish public notes or
          keep private ones, while signed-out readers can read public notes.
        </p>
      </div>
    </aside>

    <p class="more-screens">
      Two more reference surfaces open from the <strong>+</strong> menu in the top bar: your
      optional account <strong>Profile</strong> (private, sign-in based), and the generated
      <a href={ONTOLOGY_DOCS_URL} rel="external">Ontology docs</a> and
      <a href={VOCAB_DOCS_URL} rel="external">Vocabulary docs</a>.
    </p>
  </section>

  <section class="block" id="sstim">
    <h2>SSTIM and its data boundaries</h2>
    <p class="section-intro">
      SSTIM is a modular ontology suite rather than one opaque data file. Its manifest defines
      dependency closures and adoption profiles; SHACL, OWL reasoning, link checks, snapshots,
      and release rehearsal are automated repository gates.
    </p>
    <aside class="release-note">
      <span aria-hidden="true">✓</span>
      <p>
        <strong>For citation, use released SSTIM.</strong> The DOI resolves to the latest
        immutable release. This running application can also expose newer development work,
        which should not be cited as though it were released.
        <a href={doiUrl(CONCEPT_DOI)} rel="external">Open the release record</a>.
      </p>
    </aside>
    <ul class="module-list">
      <li><strong>Foundations</strong> — stimulation, stimulus specifications, shared quantities, techniques, and configurations.</li>
      <li><strong>Sessions &amp; exposure</strong> — plans, executions, overrides, delivery, perception, devices, placement, and limits.</li>
      <li><strong>Evidence</strong> — immutable assessment claims with an explicit proposition, qualified basis, direction, tier, agent, and date.</li>
      <li><strong>Controlled vocabulary</strong> — multilingual SKOS values for bands, modalities, mechanisms, techniques, evidence, and cautions.</li>
      <li><strong>Application &amp; ecosystem</strong> — Patch Studio parameter mappings plus neutral, consent-aware agent relationships.</li>
      <li><strong>Validation &amp; alignment</strong> — reusable SHACL contracts and conservative external links.</li>
    </ul>
    <p class="section-intro">
      Controlled values are dual-typed as OWL individuals and SKOS concepts. Stable namespace
      documents live under <code>https://w3id.org/sstim</code>. Automated conformance is useful
      evidence about the files; it is not a substitute for independent scientific or human review.
    </p>
    <p class="section-intro">
      Community coordination happens in the
      <a href={W3C_GROUP_URL} rel="external">Sensory Stimulation
      Vocabulary Community Group</a> at the W3C — an open group, proposed and chaired by
      Renato Fabbri, for aligning sensory-stimulation vocabulary and interoperability work
      across projects. Anyone can join and participate.
    </p>
  </section>

  <section class="block data-block">
    <h2>Read every source in context</h2>
    <p class="section-intro">
      The Graph's <strong>Data sources</strong> panel lists what is loaded and where it
      comes from. The four words mean different things:
    </p>
    <div class="data-grid">
      <article>
        <span class="data-kind released">Versioned</span>
        <h3>Ontology &amp; vocabulary</h3>
        <p>OWL terms, axioms, and multilingual SKOS values. Cite an immutable release; the running site can contain later development work.</p>
      </article>
      <article>
        <span class="data-kind released">Versioned</span>
        <h3>Public catalog</h3>
        <p>Reference frameworks, implementations, presets, and evidence records. Pin a release for reuse; public data is not a clinical recommendation.</p>
      </article>
      <article>
        <span class="data-kind live">Live &amp; retractable</span>
        <h3>Ecosystem projection</h3>
        <p>Reviewed relationships among people and organizations, fetched at runtime and deliberately excluded from citable archives.</p>
      </article>
      <article>
        <span class="data-kind personal">Personal</span>
        <h3>Notes &amp; logbooks</h3>
        <p>Local to this browser by default. Sign-in separates local logbook scopes; shared annotations and account-backed patch storage are separate deployment choices.</p>
      </article>
    </div>
    <p class="boundary-note">
      <strong>Outside this repository:</strong> real participant session data, clinical
      material, and the private BioSynCare catalog. Annotations use separate named graphs;
      private notes and logbooks remain owned by their author.
    </p>
  </section>

  <footer class="about-footer" id="links">
    <h2>Links &amp; licensing</h2>
    <ul class="link-list">
      {#each links as l}
        <li>
          <a href={l.href} rel={l.external ? 'external' : undefined}>{l.label}</a>
        </li>
      {/each}
    </ul>
    <p class="license-note">
      Imported software retains Apache-2.0; imported ontology, vocabulary, documentation, and
      public reference data retain CC BY 4.0. W3C Community Group contribution terms are
      recorded separately in <a href={ghBlob('LICENSE.md')} rel="external">LICENSE.md</a> and do not retroactively relicense history. Initial technical baseline by Renato Fabbri
      (<a href="https://orcid.org/0000-0002-9699-629X" rel="external">ORCID 0000-0002-9699-629X</a>).
    </p>
  </footer>
</main>

<style>
  .about-page {
    max-width: 1120px;
    margin: 0 auto;
    padding: 1.5rem 1.15rem 6rem;
    color: var(--app-text);
    font-family: var(--app-font-ui);
  }

  /* ── Hero ─────────────────────────────────────────────────────────────── */
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.8fr);
    gap: clamp(1.5rem, 4vw, 3.25rem);
    align-items: center;
    margin-bottom: 1rem;
    padding: clamp(1.25rem, 4vw, 2.5rem);
    overflow: hidden;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) * 1.6);
    background:
      radial-gradient(circle at 8% 0%, color-mix(in srgb, var(--app-accent) 18%, transparent), transparent 34rem),
      linear-gradient(145deg, var(--app-surface), var(--app-surface-2));
    box-shadow: 0 1.1rem 3rem color-mix(in srgb, var(--app-text) 7%, transparent);
  }

  .brand-lockup {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    margin-bottom: 0.9rem;
  }

  .eyebrow {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--app-accent);
    margin: 0 0 0.2rem;
  }

  .hero h1 {
    font-size: clamp(1.9rem, 4vw, 2.6rem);
    line-height: 1.05;
    font-weight: 800;
    color: var(--app-text-strong);
    margin: 0;
  }

  .lede {
    font-size: 1.02rem;
    line-height: 1.6;
    color: var(--app-text);
    margin: 0 0 1.15rem;
    max-width: 68ch;
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
    margin-bottom: 1.15rem;
  }

  .hero-actions a,
  .card-action {
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--app-radius);
    font-size: 0.86rem;
    font-weight: 750;
    text-decoration: none;
    transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
  }

  .hero-actions a:hover,
  .card-action:hover { transform: translateY(-1px); }

  .primary-action {
    padding: 0.58rem 0.95rem;
    color: var(--app-on-accent);
    background: var(--app-accent);
    border: 1px solid var(--app-accent);
  }

  .secondary-action {
    padding: 0.58rem 0.95rem;
    color: var(--app-text-strong);
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
  }

  .scope-note {
    font-size: 0.85rem;
    line-height: 1.55;
    color: var(--app-muted);
    margin: 0;
    padding: 0.7rem 0.9rem;
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-left: 3px solid var(--app-warn);
    border-radius: var(--app-radius);
    max-width: 68ch;
  }

  .trust-panel {
    padding: 1.05rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    background: color-mix(in srgb, var(--app-surface) 86%, transparent);
  }

  .trust-kicker {
    margin: 0 0 0.2rem;
    color: var(--app-ok);
    font-size: 0.66rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .trust-panel h2 {
    margin: 0 0 0.8rem;
    color: var(--app-text-strong);
    font-size: 1rem;
  }

  .trust-panel dl { margin: 0; }
  .trust-panel dl > div {
    padding: 0.65rem 0;
    border-top: var(--app-border-width) solid var(--app-border);
  }
  .trust-panel dt {
    color: var(--app-text-strong);
    font-size: 0.76rem;
    font-weight: 750;
  }
  .trust-panel dd {
    margin: 0.15rem 0 0;
    color: var(--app-muted);
    font-size: 0.74rem;
    line-height: 1.45;
  }

  .section-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin: 0 0 2.5rem;
    padding: 0.45rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    background: var(--app-surface);
  }

  .section-nav a {
    padding: 0.42rem 0.7rem;
    border-radius: calc(var(--app-radius) * 0.75);
    color: var(--app-muted);
    font-size: 0.78rem;
    font-weight: 650;
    text-decoration: none;
  }
  .section-nav a:hover {
    color: var(--app-text-strong);
    background: var(--app-surface-2);
  }

  /* ── Section scaffolding ──────────────────────────────────────────────── */
  .block {
    margin-bottom: 2.75rem;
    scroll-margin-top: 5rem;
  }

  .block h2,
  .about-footer h2 {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--app-text-strong);
    margin: 0 0 0.5rem;
  }

  .section-intro {
    font-size: 0.92rem;
    line-height: 1.6;
    color: var(--app-muted);
    margin: 0 0 1.25rem;
    max-width: 70ch;
  }

  .ecosystem-map {
    margin: 0 0 1rem;
    padding: 1rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    background: var(--app-surface-2);
  }

  .map-owner {
    width: fit-content;
    display: flex;
    align-items: center;
    gap: 0.65rem;
    margin: 0 auto 0.8rem;
    padding: 0.65rem 0.85rem;
    border: 1px solid color-mix(in srgb, var(--app-control) 45%, var(--app-border));
    border-radius: var(--app-radius);
    background: var(--app-surface);
  }
  .map-owner div { display: grid; gap: 0.1rem; }
  .map-owner strong { color: var(--app-text-strong); font-size: 0.88rem; }
  .map-owner span { color: var(--app-muted); font-size: 0.7rem; }

  .map-branches {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
    position: relative;
  }

  .map-branches article {
    display: grid;
    gap: 0.2rem;
    padding: 0.8rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    background: var(--app-surface);
  }
  .map-branches strong { color: var(--app-text-strong); font-size: 0.9rem; }
  .map-branches span:not(.map-label) { color: var(--app-muted); font-size: 0.74rem; line-height: 1.45; }
  .map-label {
    color: var(--app-accent);
    font-size: 0.62rem;
    font-weight: 750;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .map-foundation {
    margin: 0.75rem 0 0;
    color: var(--app-text);
    font-size: 0.73rem;
    text-align: center;
  }

  /* ── Three-layer cards ────────────────────────────────────────────────── */
  /* 280px min fits three across at the 960px page width, so the five cards
     land as a balanced 3 + 2 rather than 2 + 2 + 1 with a lone orphan. The
     card order also keeps the two green-ish borders (BSC, BioSynCare) off the
     same row. */
  .layer-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 0.9rem;
  }

  .layer-card {
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-top: 3px solid var(--card-color);
    border-radius: var(--app-radius);
    padding: 1rem 1.05rem 1.15rem;
    transition: transform 140ms ease, border-color 140ms ease;
  }
  .layer-card:hover { transform: translateY(-2px); border-color: var(--card-color); }

  .layer-tag {
    display: inline-block;
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--card-color);
    margin-bottom: 0.35rem;
  }

  /* The mark sits on the heading baseline row, not above it: two of the five
     layers are products with an isotype and three are not, so the cards have to
     stay level with or without one. */
  .layer-head {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 0.5rem;
    /* Reserve the mark's height on every card, marked or not, so the five
       headings sit on one line across the grid. Without this the two product
       cards push their titles ~15px lower than the three that carry no mark. */
    min-height: 38px;
  }

  .layer-card h3 {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--app-text-strong);
    margin: 0;
  }

  .layer-card p {
    font-size: 0.86rem;
    line-height: 1.55;
    color: var(--app-text);
    margin: 0;
  }

  /* ── Screen cards ─────────────────────────────────────────────────────── */
  .screen-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 0.9rem;
  }

  .screen-card {
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-left: 3px solid var(--card-color);
    border-radius: var(--app-radius);
    padding: 1rem 1.05rem 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    box-shadow: 0 1px 0 color-mix(in srgb, var(--app-text) 5%, transparent);
  }

  .screen-head {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .screen-emoji {
    font-size: 1.4rem;
    line-height: 1;
    flex-shrink: 0;
  }

  .screen-heading {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .screen-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--app-text-strong);
    text-decoration: none;
  }
  .screen-title:hover { color: var(--app-accent); text-decoration: underline; }

  .screen-role {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--card-color);
  }

  .screen-what {
    font-size: 0.85rem;
    line-height: 1.55;
    color: var(--app-text);
    margin: 0;
  }

  .screen-how {
    font-size: 0.82rem;
    line-height: 1.55;
    color: var(--app-muted);
    margin: 0;
  }

  .card-action {
    align-self: flex-start;
    min-height: 36px;
    margin-top: auto;
    padding: 0.35rem 0.65rem;
    color: var(--app-text-strong);
    border: var(--app-border-width) solid var(--app-border);
    background: var(--app-surface-2);
  }
  .card-action:hover { border-color: var(--card-color); color: var(--card-color); }

  .how-label {
    display: block;
    font-size: 0.64rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--app-text);
    margin-bottom: 0.2rem;
  }

  /* ── Annotation callout ───────────────────────────────────────────────── */
  .callout {
    display: flex;
    gap: 0.9rem;
    align-items: flex-start;
    margin-top: 1.25rem;
    padding: 1rem 1.1rem 1.05rem;
    background: var(--app-accent-soft);
    border: var(--app-border-width) solid var(--app-border);
    border-left: 3px solid var(--app-accent);
    border-radius: var(--app-radius);
  }

  .callout-emoji {
    font-size: 1.35rem;
    line-height: 1.4;
    flex-shrink: 0;
  }

  .callout-body h3 {
    font-size: 1rem;
    font-weight: 700;
    color: var(--app-text-strong);
    margin: 0 0 0.35rem;
  }

  .callout-body p {
    font-size: 0.86rem;
    line-height: 1.6;
    color: var(--app-text);
    margin: 0;
  }
  .callout-body a { color: var(--app-accent); }

  .more-screens {
    font-size: 0.86rem;
    line-height: 1.6;
    color: var(--app-muted);
    margin: 1.25rem 0 0;
    max-width: 70ch;
  }

  /* ── Module / boundary lists ──────────────────────────────────────────── */
  .module-list {
    list-style: none;
    margin: 0 0 1.25rem;
    padding: 0;
    display: grid;
    gap: 0.5rem;
  }

  .module-list li {
    font-size: 0.86rem;
    line-height: 1.5;
    color: var(--app-text);
    padding-left: 1rem;
    position: relative;
  }
  .module-list li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.55em;
    width: 0.4rem;
    height: 0.4rem;
    border-radius: 50%;
    background: var(--app-accent);
  }

  .release-note {
    display: flex;
    gap: 0.7rem;
    align-items: flex-start;
    margin: 0 0 1rem;
    padding: 0.85rem 0.95rem;
    border: 1px solid color-mix(in srgb, var(--app-ok) 38%, var(--app-border));
    border-radius: var(--app-radius);
    background: color-mix(in srgb, var(--app-ok) 8%, var(--app-surface));
  }
  .release-note > span { color: var(--app-ok); font-weight: 900; }
  .release-note p { margin: 0; color: var(--app-text); font-size: 0.82rem; line-height: 1.55; }
  .release-note a { color: var(--app-accent); }

  .data-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }
  .data-grid article {
    padding: 0.9rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    background: var(--app-surface);
  }
  .data-grid h3 { margin: 0.35rem 0; color: var(--app-text-strong); font-size: 0.92rem; }
  .data-grid p { margin: 0; color: var(--app-muted); font-size: 0.8rem; line-height: 1.5; }
  .data-kind {
    display: inline-flex;
    padding: 0.16rem 0.42rem;
    border-radius: 999px;
    font-size: 0.61rem;
    font-weight: 750;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--app-text-strong);
  }
  .data-kind.released { background: color-mix(in srgb, var(--app-ok) 12%, transparent); border: 1px solid color-mix(in srgb, var(--app-ok) 38%, var(--app-border)); }
  .data-kind.live { background: color-mix(in srgb, var(--app-warn) 12%, transparent); border: 1px solid color-mix(in srgb, var(--app-warn) 38%, var(--app-border)); }
  .data-kind.personal { background: var(--app-accent-soft); border: 1px solid color-mix(in srgb, var(--app-accent) 38%, var(--app-border)); }
  .boundary-note {
    margin: 0.85rem 0 0;
    padding: 0.8rem 0.9rem;
    color: var(--app-text);
    font-size: 0.8rem;
    line-height: 1.55;
    border-left: 3px solid var(--app-muted-2);
    background: var(--app-surface-2);
  }

  /* ── Footer ───────────────────────────────────────────────────────────── */
  .about-footer {
    border-top: var(--app-border-width) solid var(--app-border);
    padding-top: 1.75rem;
  }

  .link-list {
    list-style: none;
    margin: 0 0 1.25rem;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.25rem;
  }

  .link-list a {
    font-size: 0.88rem;
    color: var(--app-accent);
    text-decoration: none;
  }
  .link-list a:hover { text-decoration: underline; }

  .license-note {
    font-size: 0.82rem;
    line-height: 1.6;
    color: var(--app-muted);
    margin: 0;
    max-width: 70ch;
  }

  .scope-note a,
  .more-screens a,
  .license-note a {
    color: var(--app-accent);
  }

  code {
    color: var(--app-text);
    font-family: var(--app-font-mono);
    font-size: 0.82em;
    background: var(--app-surface-2);
    padding: 0.05rem 0.35rem;
    border-radius: 3px;
  }

  @media (max-width: 780px) {
    .hero { grid-template-columns: 1fr; }
    .trust-panel { max-width: none; }
  }

  @media (max-width: 520px) {
    .about-page { padding: 1.5rem 1rem 6rem; }
    .screen-grid,
    .layer-grid,
    .map-branches,
    .data-grid { grid-template-columns: 1fr; }
    .hero { padding: 1.05rem; }
    .brand-lockup { align-items: flex-start; }
    .hero-actions a { width: 100%; }
    .section-nav { overflow-x: auto; flex-wrap: nowrap; }
    .section-nav a { flex: 0 0 auto; }
    .callout { flex-direction: column; gap: 0.5rem; }
  }

  @media (prefers-reduced-motion: reduce) {
    .hero-actions a,
    .card-action,
    .layer-card { transition: none; }
    .hero-actions a:hover,
    .card-action:hover,
    .layer-card:hover { transform: none; }
  }
</style>
