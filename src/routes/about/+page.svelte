<script>
  // Static content page — no runes needed. The bottom-dock screens, described
  // here for orientation, are kept in the same order as AppBottomDock.svelte.
  const screens = [
    {
      href: '/graph/',
      label: 'Graph',
      role: 'Knowledge browser',
      emoji: '🕸️',
      color: 'var(--app-accent)',
      what:
        'An interactive Cytoscape view of the SSTIM knowledge graph — OWL classes, ' +
        'multilingual SKOS concepts, object/data properties, and the links between them, ' +
        'drawn straight from the Turtle sources. It is also where you annotate the ontology.',
      how:
        'Pick one of a dozen scopes (Core OWL classes, All SKOS vocabulary, Frequency ' +
        'bands, Modalities, Mechanisms, Techniques, Voice types, Preset groups, Evidence, ' +
        'Cautions, Exposure…) and toggle the edge layers — subClassOf, object/data ' +
        'property, narrower, related, instanceOf. Press / to search, Enter to centre, and ' +
        'c / f / r to centre, fit, or relayout (? lists every shortcut). Select any node to ' +
        'open its detail panel: definition, a copyable IRI, a link to its generated ' +
        'reference entry, and its incoming/outgoing connections — which you can filter by ' +
        'edge kind or isolate with Focus neighborhood — plus a notes area for annotation.',
    },
    {
      href: '/creator/',
      label: 'Patch Studio',
      role: 'Real-time authoring',
      emoji: '🎛️',
      color: 'var(--app-visual)',
      what:
        'A live surface for authoring multi-sensory patches. Layer audio tracks ' +
        '(Isochronic Tone, Binaural Beat, Carrier, Noise, Drone, ambient Sample), visual ' +
        'tracks (geometry, particles, gradients, pacers, ripples, spirals, mandalas…), and ' +
        'a haptic Vibration track — with per-parameter modulation and photosensitivity ' +
        'safeguards.',
      how:
        'Add tracks from the palette and shape each parameter; many can be tempo-synced or ' +
        'modulated. Press play to preview audio and visuals together in real time. The audio ' +
        'engine — Vanilla Web Audio, AudioWorklet, or AudioWorklet + WASM — is chosen in ' +
        'Settings and applied on the next playback. Playback always starts from a tap or ' +
        'click, per browser autoplay rules.',
    },
    {
      href: '/field/',
      label: 'Field',
      role: 'Sensory Field instrument',
      emoji: '🌗',
      color: 'var(--app-haptic)',
      what:
        'A bounded visual/audio exposure instrument for prototyping sensory fields. Each ' +
        'control is mapped to the exposure-ontology term it emits — full-screen light ' +
        'fields, free-view stereoscopy, blink patterns — so what you shape here is ' +
        'expressible directly in SSTIM.',
      how:
        'Open the Field and adjust the exposure controls; inline links show what each ' +
        'setting means in the ontology. Alternate scenes are reachable from the + menu: ' +
        'Stereoscopic Tree, Abstraction, and 3D Landscape. Blink rates are bounded by the ' +
        'photosensitivity flash-rate limit, and visual stimulation honours the safety ' +
        'toggle in Settings.',
    },
    {
      href: '/presets/',
      label: 'Presets',
      role: 'Reference catalog',
      emoji: '🎚️',
      color: 'var(--app-control)',
      what:
        'The public BSC Lab reference presets — the catalog objects shared with ' +
        'BioSynCare — read live from the RDF knowledge graph, with their group, target ' +
        'frequency band, and linked evidence claims.',
      how:
        'Filter the catalog by group (Heal, Support, Perform, Indulge, Transcend), by ' +
        'target band (delta, theta, alpha, smr, beta, gamma and sub-bands), or by evidence ' +
        'tier, and open a preset to see its parameters and the evidence behind it.',
    },
    {
      href: '/sparql/',
      label: 'SPARQL',
      role: 'Query workbench',
      emoji: '🔎',
      color: 'var(--app-ok)',
      what:
        'A SPARQL 1.1 workbench that runs entirely in your browser (Comunica over an ' +
        'N3 store), querying the ontology and the public instance data together.',
      how:
        'Edit the starter query or write your own, press Run, and read the results table. ' +
        'Named graphs keep ontology terms, public reference data, and annotations separate, ' +
        'so you can query across techniques, protocols, presets, evidence, and exposure ' +
        'conditions with GRAPH patterns.',
    },
    {
      href: '/logbook/',
      label: 'Logbook',
      role: 'Personal record',
      emoji: '📓',
      color: 'var(--app-warn)',
      what:
        'A private, long-term record of your sensory-stimulation work — sessions, ' +
        'observations, ideas, activities, initiatives, notes, and achievements, across ' +
        'multiple named logbooks.',
      how:
        'Add entries, tag them, and filter by tag. Entries are stored locally in your ' +
        'browser by default; when a deployment is configured with sign-in, they become a ' +
        'private per-account record. Your data stays yours and is never committed to the ' +
        'repository.',
    },
    {
      href: '/settings/',
      label: 'Settings',
      role: 'Appearance, engine, safety',
      emoji: '⚙️',
      color: 'var(--app-muted)',
      what:
        'Where you choose the visual skin, the audio engine, and the photosensitivity ' +
        'safety behaviour.',
      how:
        'Pick a skin (Paper, Midnight, Aurora, Ember, Daylight), select the audio engine ' +
        'used by Patch Studio and the Field, and set the visual-stimulation safety toggle. ' +
        'Unsupported engines fall back automatically.',
    },
  ]

  // The three parts of the ecosystem and how they relate.
  const layers = [
    {
      name: 'BSC Lab',
      tag: 'Open platform',
      color: 'var(--app-accent)',
      body:
        'The open-source research and engineering platform you are using now: a stimulation ' +
        'layer (this application) and a knowledge layer (the SSTIM sources it browses). ' +
        'Software is Apache-2.0; the ontology, vocabulary, and public reference data are CC BY 4.0.',
    },
    {
      name: 'SSTIM',
      tag: 'The knowledge graph',
      color: 'var(--app-visual)',
      body:
        'The Sensory Stimulation Ontology — a public RDF knowledge graph of techniques, ' +
        'modalities, parameters, exposure conditions, safety metadata, evidence-qualified ' +
        'claims, protocols, presets, and sessions. OWL classes, a multilingual SKOS ' +
        'vocabulary, and SHACL shapes under the stable namespace w3id.org/sstim. This is the ' +
        'reusable, citable scientific artifact.',
    },
    {
      name: 'BioSynCare',
      tag: 'Commercial application',
      color: 'var(--app-haptic)',
      body:
        'A separate, closed-source commercial application in its own repository. It shares ' +
        'the preset JSON format and the SSTIM vocabulary with BSC Lab, but neither project ' +
        'imports the other’s code or private data. BSC is a framework; BSC Lab and ' +
        'BioSynCare are two implementations of it.',
    },
  ]

  const links = [
    { label: 'Source repository', href: 'https://github.com/laBioSynCare/laBioSynCare.github.io', external: true },
    { label: 'Ontology reference docs', href: '/ontology/docs/', external: true },
    { label: 'Vocabulary docs', href: '/ontology/docs/vocab/', external: true },
    { label: 'Ontology DOI (all versions)', href: 'https://doi.org/10.5281/zenodo.21286974', external: true },
    { label: 'W3C Community Group', href: 'https://www.w3.org/community/sstim/', external: true },
  ]
</script>

<svelte:head>
  <title>About | BSC Lab</title>
  <meta
    name="description"
    content="What BSC Lab is — the open sensory-stimulation platform, the SSTIM knowledge graph, Patch Studio, annotation, and its relationship to BioSynCare — and how to use each screen."
  />
</svelte:head>

<main class="about-page">
  <header class="hero">
    <p class="eyebrow">About</p>
    <h1>BSC Lab</h1>
    <p class="lede">
      BSC Lab is an open sensory-stimulation research and engineering platform. It pairs a
      precision audio-visual stimulation application with <strong>SSTIM</strong>, a public
      RDF knowledge graph for describing techniques, parameters, exposure conditions, safety
      metadata, and evidence — so what you build, browse, and annotate all live in one place.
    </p>
    <p class="scope-note">
      The work is non-clinical. It supports exploration and authoring of sensory experiences;
      it does not diagnose, treat, cure, or prevent any condition, and it makes no claim of
      clinical efficacy. See <a href="https://github.com/laBioSynCare/laBioSynCare.github.io/blob/main/docs/concept/SCOPE.md" rel="external">Scope</a>.
    </p>
  </header>

  <section class="block">
    <h2>Three parts, one ecosystem</h2>
    <p class="section-intro">
      BSC Lab, SSTIM, and BioSynCare are distinct but connected. Knowing which is which
      makes the rest of the app easier to read.
    </p>
    <div class="layer-grid">
      {#each layers as layer}
        <article class="layer-card" style="--card-color: {layer.color}">
          <span class="layer-tag">{layer.tag}</span>
          <h3>{layer.name}</h3>
          <p>{layer.body}</p>
        </article>
      {/each}
    </div>
  </section>

  <section class="block">
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
        </article>
      {/each}
    </div>

    <aside class="callout">
      <span class="callout-emoji" aria-hidden="true">✍️</span>
      <div class="callout-body">
        <h3>Annotate the ontology</h3>
        <p>
          Every term in SSTIM can carry notes, and the <a href="/graph/">Graph knowledge browser</a>
          is where you add them. Select a node and, in its detail panel, write a
          <strong>public</strong> note (readable by everyone) or a <strong>private</strong>
          one (only you). Notes are modeled as W3C Web Annotations and stored in named graphs
          kept separate from the authoritative ontology data — so annotating never alters the
          source terms. Reading public notes is open to anyone; adding and editing your own
          needs sign-in on a deployment configured with accounts.
        </p>
      </div>
    </aside>

    <p class="more-screens">
      Two more reference surfaces open from the <strong>+</strong> menu in the top bar: your
      optional account <strong>Profile</strong> (private, sign-in based), and the generated
      <a href="/ontology/docs/" rel="external">Ontology docs</a> and
      <a href="/ontology/docs/vocab/" rel="external">Vocabulary docs</a>.
    </p>
  </section>

  <section class="block">
    <h2>SSTIM, in a little more depth</h2>
    <p class="section-intro">
      The knowledge graph is organised as a small set of Turtle modules, each an
      <code>owl:Ontology</code> with its own metadata:
    </p>
    <ul class="module-list">
      <li><strong>Core</strong> — OWL classes, properties, axioms, evidence governance, and the session model.</li>
      <li><strong>Vocabulary</strong> — multilingual SKOS values for bands, modalities, mechanisms, techniques, evidence, and cautions.</li>
      <li><strong>Shapes</strong> — SHACL constraints validating modules, evidence, protocols, presets, safety, and sessions.</li>
      <li><strong>Alignments</strong> — conservative, verified links to Wikidata and OBO Foundry.</li>
      <li><strong>Exposure</strong> — delivery media, perceived modalities, devices, placement, stimulus patterns, and limits.</li>
      <li><strong>Patch Studio</strong> — reproducible voice and authoring parameter properties.</li>
      <li><strong>Ecosystem</strong> — neutral agent relationships, engagement provenance, and consent lifecycle metadata.</li>
    </ul>
    <p class="section-intro">
      Controlled values are dual-typed as both OWL individuals and SKOS concepts. The ontology
      is validated with SHACL and an OWL reasoner, is published under
      <code>https://w3id.org/sstim</code>, and carries a citable DOI.
    </p>
    <p class="section-intro">
      Community coordination happens in the
      <a href="https://www.w3.org/community/sstim/" rel="external">Sensory Stimulation
      Vocabulary Community Group</a> at the W3C — an open group, proposed and chaired by
      Renato Fabbri, for aligning sensory-stimulation vocabulary and interoperability work
      across projects. Anyone can join and participate.
    </p>
  </section>

  <section class="block">
    <h2>Reading the data sources</h2>
    <p class="section-intro">
      The Graph's <strong>Data sources</strong> panel lists what is loaded and where it
      comes from. The four words mean different things:
    </p>
    <ul class="module-list">
      <li><strong>Ontology</strong> — the versioned OWL term modules: classes, properties, and axioms, released and citable under <code>w3id.org/sstim</code>.</li>
      <li><strong>Vocabulary</strong> — the multilingual SKOS concept values (frequency bands, modalities, mechanisms, techniques…), dual-typed with the OWL classes.</li>
      <li><strong>Catalog</strong> — versioned public reference instances of frameworks, implementations and their components, presets, and evidence records.</li>
      <li><strong>Ecosystem</strong> — a live projection of people, organizations, and reviewed relationships in the field. It is fetched at runtime, each record is separately approved and sourced, and it is retractable: it is deliberately excluded from citable releases and archives.</li>
    </ul>
  </section>

  <section class="block">
    <h2>Where your data lives</h2>
    <p class="section-intro">
      BSC Lab keeps different kinds of data deliberately separate, in different named graphs
      and stores:
    </p>
    <ul class="module-list">
      <li><strong>Authoritative ontology &amp; public reference data</strong> — the shared, citable SSTIM sources, the same for everyone.</li>
      <li><strong>Annotations</strong> — public notes in a shared annotation graph; your private notes in your own, visible only to you.</li>
      <li><strong>Your Logbook</strong> — local to your browser, or private to your account when sign-in is configured.</li>
    </ul>
    <p class="section-intro">
      Real participant session data, the private BioSynCare catalog, and any clinical
      material are not part of this repository. Your private notes and logbook stay yours.
    </p>
  </section>

  <footer class="about-footer">
    <h2>Links &amp; licensing</h2>
    <ul class="link-list">
      {#each links as l}
        <li>
          <a href={l.href} rel={l.external ? 'external' : undefined}>{l.label}</a>
        </li>
      {/each}
    </ul>
    <p class="license-note">
      Software is licensed under Apache-2.0; the ontology, vocabulary, documentation, and
      public reference data under CC BY 4.0. Maintained by Renato Fabbri
      (<a href="https://orcid.org/0000-0002-9699-629X" rel="external">ORCID 0000-0002-9699-629X</a>).
    </p>
  </footer>
</main>

<style>
  .about-page {
    max-width: 960px;
    margin: 0 auto;
    padding: 2rem 1.15rem 6rem;
    color: var(--app-text);
    font-family: var(--app-font-ui);
  }

  /* ── Hero ─────────────────────────────────────────────────────────────── */
  .hero {
    margin-bottom: 2.5rem;
  }

  .eyebrow {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--app-accent);
    margin: 0 0 0.35rem;
  }

  .hero h1 {
    font-size: clamp(1.9rem, 4vw, 2.6rem);
    line-height: 1.05;
    font-weight: 800;
    color: var(--app-text-strong);
    margin: 0 0 0.85rem;
  }

  .lede {
    font-size: 1.02rem;
    line-height: 1.6;
    color: var(--app-text);
    margin: 0 0 1rem;
    max-width: 68ch;
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

  /* ── Section scaffolding ──────────────────────────────────────────────── */
  .block {
    margin-bottom: 2.75rem;
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

  /* ── Three-layer cards ────────────────────────────────────────────────── */
  .layer-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 0.9rem;
  }

  .layer-card {
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-top: 3px solid var(--card-color);
    border-radius: var(--app-radius);
    padding: 1rem 1.05rem 1.15rem;
  }

  .layer-tag {
    display: inline-block;
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--card-color);
    margin-bottom: 0.35rem;
  }

  .layer-card h3 {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--app-text-strong);
    margin: 0 0 0.5rem;
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

  .how-label {
    display: block;
    font-size: 0.64rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--app-muted-2);
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
    font-family: var(--app-font-mono);
    font-size: 0.82em;
    background: var(--app-surface-2);
    padding: 0.05rem 0.35rem;
    border-radius: 3px;
  }

  @media (max-width: 520px) {
    .about-page { padding: 1.5rem 1rem 6rem; }
    .screen-grid,
    .layer-grid { grid-template-columns: 1fr; }
    .callout { flex-direction: column; gap: 0.5rem; }
  }
</style>
