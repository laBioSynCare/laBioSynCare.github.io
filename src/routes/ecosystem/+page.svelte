<script>
  import { applicationRoute } from '../../config/applicationUrls.js'
  import Isotype from '../../ui/brand/Isotype.svelte'
  import {
    ARCHITECTURE_ENTITIES,
    DIRECTORY_ENTRIES,
    DOMAIN_REVIEW_STATUSES,
    SSTIM_ECOSYSTEM_DEFINITION,
    SSTIM_RELATIONSHIPS,
  } from '../../ui/ecosystem/architecture.js'
  import {
    BIOSYNCARE_URL,
    GITHUB_URL,
    W3C_GROUP_URL,
    ghBlob,
  } from '../../ui/externalLinks.js'

  const entityById = new Map(ARCHITECTURE_ENTITIES.map((entity) => [entity.id, entity]))
  const relationshipById = new Map(SSTIM_RELATIONSHIPS.map((relation) => [relation.id, relation]))
  const reviewStatusById = new Map(DOMAIN_REVIEW_STATUSES.map((status) => [status.id, status]))

  const sstim = entityById.get('sstim')
  const workbench = entityById.get('workbench')
  const communityGroup = entityById.get('community-group')
  const biosyncare = entityById.get('biosyncare')

  const entityKinds = [
    'Application or other software',
    'Hardware, mechanical, manual, or hybrid implementation',
    'Project, programme, or research initiative',
    'Standard, vocabulary, dataset, or infrastructure',
    'Community or organization',
  ]
</script>

<svelte:head>
  <title>SSTIM ecosystem | SSTIM Workbench</title>
  <meta
    name="description"
    content="The architecture of SSTIM, SSTIM Workbench, the W3C Community Group, BioSynCare, and the wider sensory-stimulation ecosystem."
  />
</svelte:head>

<main class="ecosystem-page">
  <header class="hero">
    <p class="eyebrow">Architecture and directory</p>
    <h1>The SSTIM ecosystem</h1>
    <p class="lede">{SSTIM_ECOSYSTEM_DEFINITION}</p>
    <p class="hero-note">
      The ecosystem is intentionally broader than the SSTIM standard. Inclusion describes a
      relationship to the field; it does not imply ownership, affiliation, endorsement, or
      conformance.
    </p>
    <nav class="hero-actions" aria-label="Ecosystem page sections">
      <a href="#architecture">See the architecture</a>
      <a href="#directory">Browse applications and initiatives</a>
      <a href={applicationRoute('/about/')}>About the Workbench</a>
    </nav>
  </header>

  <section class="block" id="architecture">
    <div class="section-heading">
      <div>
        <p class="section-kicker">Architecture at a glance</p>
        <h2>One open center, a wider field</h2>
      </div>
      <p>
        SSTIM provides the formalized knowledge. The Workbench exercises it, the Community
        Group develops it, and separate applications and initiatives relate to it in different ways.
      </p>
    </div>

    <div class="architecture-map" aria-label="SSTIM ecosystem architecture">
      <div class="core-field">
        <span class="field-label">SSTIM-centered core</span>
        <article class="entity-card primary" style="--entity-color: {sstim.color}">
          <span class="entity-tag">{sstim.tag}</span>
          <h3>{sstim.name}</h3>
          <p>{sstim.body}</p>
        </article>

        <div class="core-connections" aria-hidden="true"><span></span><span></span></div>

        <div class="connected-entities">
          <article class="entity-card" style="--entity-color: {workbench.color}">
            <span class="entity-tag">{workbench.tag}</span>
            <div class="entity-title">
              <Isotype name={workbench.mark} size={34} title="SSTIM Workbench mark" />
              <h3>{workbench.name}</h3>
            </div>
            <p>{workbench.body}</p>
          </article>
          <article class="entity-card" style="--entity-color: {communityGroup.color}">
            <span class="entity-tag">{communityGroup.tag}</span>
            <h3>{communityGroup.name}</h3>
            <p>{communityGroup.body}</p>
            <a class="text-link" href={W3C_GROUP_URL} rel="external">Visit the Community Group</a>
          </article>
        </div>
      </div>

      <div class="wider-field">
        <div>
          <span class="field-label">Wider sensory-stimulation field</span>
          <h3>Separate applications and initiatives</h3>
          <p>
            Software, hardware, research, standards work, communities, and other initiatives
            belong in the SSTIM ecosystem according to their domain relevance—even when no
            SSTIM adoption or support relationship is currently recorded.
          </p>
        </div>
        <article class="entity-card compact" style="--entity-color: {biosyncare.color}">
          <span class="entity-tag">{biosyncare.tag}</span>
          <div class="entity-title">
            <Isotype name={biosyncare.mark} size={34} title="BioSynCare isotype" />
            <h3>{biosyncare.name}</h3>
          </div>
          <p>{biosyncare.body}</p>
        </article>
      </div>
    </div>
  </section>

  <section class="block overlap-block" id="overlap">
    <div class="section-heading">
      <div>
        <p class="section-kicker">Overlapping ecosystems</p>
        <h2>SSTIM-centered and application-centered</h2>
      </div>
      <p>Neither ecosystem has to own the other for both descriptions to be true.</p>
    </div>

    <div class="overlap-map">
      <article>
        <span class="overlap-label open">Open-standard centered</span>
        <h3>SSTIM ecosystem</h3>
        <p>
          Includes SSTIM, SSTIM Workbench, the Community Group, SSTIM adopters and supporters,
          and the wider landscape of sensory-stimulation applications and initiatives.
        </p>
      </article>
      <div class="overlap-bridge">
        <strong>BioSynCare adopts and contributes to SSTIM</strong>
        <span>shared knowledge · tooling · community</span>
      </div>
      <article>
        <span class="overlap-label commercial">Application centered</span>
        <h3>BioSynCare ecosystem</h3>
        <p>
          Centers on the commercial application. SSTIM, SSTIM Workbench, and the Community
          Group appear in this ecosystem through their knowledge, tooling, and community
          relationships with BioSynCare; they do not become BioSynCare property or product components.
        </p>
      </article>
    </div>

    <aside class="meaning-note">
      <h3>What “includes” means here</h3>
      <p>
        On this page, ecosystem inclusion means relevance, participation, use, support, or another
        documented relationship. It is not automatically transitive and does not mean organizational
        control. The formal <em>BioSynCare Ecosystem</em> programme record uses the narrower meaning
        “production membership”; the independent W3C Community Group is not a component of that programme.
        <a href={ghBlob('docs/decisions/0047-programme-identity-path.md')} rel="external">Read the programme decision</a>.
      </p>
    </aside>
  </section>

  <section class="block" id="classification">
    <div class="section-heading">
      <div>
        <p class="section-kicker">Directory model</p>
        <h2>Classify the relationship, not the brand</h2>
      </div>
      <p>
        Each entry has an entity kind, zero or more SSTIM relationships, and a separate
        domain-review status. These facets prevent “listed” from being mistaken for “conformant.”
      </p>
    </div>

    <div class="facet-grid">
      <article class="facet kinds">
        <span class="facet-number">01</span>
        <h3>Entity kind</h3>
        <ul>
          {#each entityKinds as kind}
            <li>{kind}</li>
          {/each}
        </ul>
      </article>

      <article class="facet relationships">
        <span class="facet-number">02</span>
        <h3>Relationship to SSTIM</h3>
        <dl>
          {#each SSTIM_RELATIONSHIPS as relationship}
            <div>
              <dt>{relationship.label}</dt>
              <dd>{relationship.description}</dd>
            </div>
          {/each}
        </dl>
      </article>

      <article class="facet review">
        <span class="facet-number">03</span>
        <h3>Domain-review status</h3>
        <dl>
          {#each DOMAIN_REVIEW_STATUSES as status}
            <div>
              <dt>{status.label}</dt>
              <dd>{status.description}</dd>
            </div>
          {/each}
        </dl>
      </article>
    </div>

    <aside class="conformance-note">
      <strong>Conformance applies to named artifacts, not whole applications.</strong>
      A defensible result identifies the artifact, SSTIM release, profile or shape package,
      test, and date. “Adopts SSTIM” does not silently become “the application is SSTIM compliant.”
    </aside>
  </section>

  <section class="block directory-block" id="directory">
    <div class="section-heading">
      <div>
        <p class="section-kicker">Separate applications and initiatives</p>
        <h2>A growing, non-exhaustive directory</h2>
      </div>
      <p>
        Inclusion records relevance to sensory stimulation. It does not imply endorsement,
        affiliation, certification, effectiveness, safety, SSTIM conformance, or W3C approval.
      </p>
    </div>

    <div class="directory-list">
      {#each DIRECTORY_ENTRIES as entry}
        {@const status = reviewStatusById.get(entry.reviewStatus)}
        <article class="directory-entry">
          <div class="entry-heading">
            {#if entry.id === 'biosyncare'}
              <Isotype name="biosyncare" size={44} title="BioSynCare isotype" />
            {/if}
            <div>
              <span class="entry-kind">{entry.kind}</span>
              <h3>{entry.name}</h3>
            </div>
          </div>
          <div class="badges" aria-label="Recorded classifications">
            {#each entry.relationships as relationshipId}
              {@const relationship = relationshipById.get(relationshipId)}
              <span class="badge relationship">{relationship.label}</span>
            {/each}
            <span class="badge reviewed">{status.label}</span>
          </div>
          <p>{entry.summary}</p>
          {#if entry.id === 'biosyncare'}
            <a class="entry-link" href={BIOSYNCARE_URL} rel="external">Visit BioSynCare</a>
          {/if}
        </article>
      {/each}
    </div>

    <div class="directory-actions">
      <div>
        <h3>Propose or correct an entry</h3>
        <p>
          Supply public sources, the entity kind, the proposed domain status, and evidence for
          every SSTIM relationship claimed. Classification follows SSTIM's operational definition
          of sensory stimulation.
        </p>
      </div>
      <p>
        <a href={`${GITHUB_URL}/issues/new`} rel="external">Open a directory issue</a>
        <a href={ghBlob('docs/concept/SENSORY_STIMULATION.md')} rel="external">Read the domain definition</a>
      </p>
    </div>
  </section>

  <footer class="page-footer">
    <a href={applicationRoute('/')}>Home</a>
    <span aria-hidden="true">·</span>
    <a href={applicationRoute('/about/')}>About SSTIM Workbench</a>
    <span aria-hidden="true">·</span>
    <a href={W3C_GROUP_URL} rel="external">W3C Community Group</a>
  </footer>
</main>

<style>
  .ecosystem-page {
    max-width: 1120px;
    margin: 0 auto;
    padding: 1.5rem 1.15rem 6rem;
    color: var(--app-text);
    font-family: var(--app-font-ui);
  }

  .hero {
    padding: clamp(1.4rem, 5vw, 3.25rem);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) * 1.6);
    background:
      radial-gradient(circle at 90% 0%, color-mix(in srgb, var(--app-visual) 18%, transparent), transparent 32rem),
      linear-gradient(145deg, var(--app-surface), var(--app-surface-2));
    box-shadow: 0 1rem 3rem color-mix(in srgb, var(--app-text) 7%, transparent);
  }

  .eyebrow,
  .section-kicker,
  .field-label,
  .entity-tag,
  .entry-kind {
    font-size: 0.68rem;
    font-weight: 750;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .eyebrow { margin: 0 0 0.35rem; color: var(--app-accent); }
  .hero h1 {
    margin: 0 0 0.8rem;
    color: var(--app-text-strong);
    font-size: clamp(2.1rem, 5vw, 3.6rem);
    line-height: 1;
  }
  .lede {
    max-width: 72ch;
    margin: 0 0 0.7rem;
    color: var(--app-text);
    font-size: clamp(1rem, 2vw, 1.2rem);
    line-height: 1.6;
  }
  .hero-note { max-width: 72ch; margin: 0; color: var(--app-muted); font-size: 0.88rem; line-height: 1.55; }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    margin-top: 1.3rem;
  }
  .hero-actions a,
  .directory-actions a {
    display: inline-flex;
    min-height: 40px;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 0.8rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    background: var(--app-surface);
    color: var(--app-text-strong);
    font-size: 0.8rem;
    font-weight: 700;
    text-decoration: none;
  }
  .hero-actions a:first-child { border-color: var(--app-accent); background: var(--app-accent); color: var(--app-on-accent); }
  .hero-actions a:hover,
  .directory-actions a:hover { transform: translateY(-1px); border-color: var(--app-accent); }

  .block { margin-top: 3.25rem; scroll-margin-top: 5rem; }
  .section-heading {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(300px, 1.1fr);
    gap: 1.5rem;
    align-items: end;
    margin-bottom: 1.15rem;
  }
  .section-kicker { margin: 0 0 0.2rem; color: var(--app-accent); }
  .section-heading h2 { margin: 0; color: var(--app-text-strong); font-size: clamp(1.4rem, 3vw, 1.8rem); }
  .section-heading > p { margin: 0; color: var(--app-muted); font-size: 0.9rem; line-height: 1.6; }

  .architecture-map {
    display: grid;
    gap: 1rem;
    padding: 1rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) * 1.3);
    background: var(--app-surface-2);
  }
  .core-field,
  .wider-field {
    padding: 1rem;
    border: 1px dashed color-mix(in srgb, var(--app-accent) 45%, var(--app-border));
    border-radius: var(--app-radius);
    background: color-mix(in srgb, var(--app-surface) 88%, transparent);
  }
  .field-label { display: block; margin-bottom: 0.65rem; color: var(--app-accent); }
  .entity-card {
    padding: 1rem;
    border: var(--app-border-width) solid var(--app-border);
    border-top: 3px solid var(--entity-color);
    border-radius: var(--app-radius);
    background: var(--app-surface);
  }
  .entity-card.primary { max-width: 560px; margin-inline: auto; }
  .entity-tag { display: block; margin-bottom: 0.3rem; color: var(--entity-color); }
  .entity-card h3 { margin: 0; color: var(--app-text-strong); font-size: 1.05rem; }
  .entity-card p,
  .wider-field > div > p { margin: 0.45rem 0 0; color: var(--app-text); font-size: 0.84rem; line-height: 1.58; }
  .entity-title { display: flex; align-items: center; gap: 0.55rem; }
  .text-link,
  .entry-link { display: inline-block; margin-top: 0.55rem; color: var(--app-accent); font-size: 0.8rem; font-weight: 650; }

  .core-connections {
    width: min(60%, 520px);
    height: 1rem;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-top: 1px solid var(--app-border);
  }
  .core-connections span:first-child { border-right: 1px solid var(--app-border); }
  .core-connections span:last-child { border-left: 1px solid var(--app-border); }
  .connected-entities { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.8rem; }

  .wider-field { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr); gap: 1rem; align-items: center; }
  .wider-field h3 { margin: 0; color: var(--app-text-strong); font-size: 1.12rem; }

  .overlap-map { display: grid; grid-template-columns: 1fr minmax(180px, 0.48fr) 1fr; gap: 0.75rem; align-items: stretch; }
  .overlap-map article,
  .overlap-bridge {
    padding: 1.05rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    background: var(--app-surface);
  }
  .overlap-map article h3 { margin: 0.35rem 0 0.5rem; color: var(--app-text-strong); font-size: 1.05rem; }
  .overlap-map article p { margin: 0; color: var(--app-text); font-size: 0.84rem; line-height: 1.58; }
  .overlap-label { font-size: 0.64rem; font-weight: 750; letter-spacing: 0.07em; text-transform: uppercase; }
  .overlap-label.open { color: var(--app-visual); }
  .overlap-label.commercial { color: var(--app-haptic); }
  .overlap-bridge {
    display: grid;
    place-content: center;
    text-align: center;
    background: var(--app-accent-soft);
    border-color: var(--app-accent);
  }
  .overlap-bridge strong { color: var(--app-text-strong); font-size: 0.82rem; line-height: 1.4; }
  .overlap-bridge span { margin-top: 0.35rem; color: var(--app-muted); font-size: 0.68rem; }

  .meaning-note,
  .conformance-note {
    margin-top: 0.8rem;
    padding: 0.9rem 1rem;
    border: var(--app-border-width) solid var(--app-border);
    border-left: 3px solid var(--app-warn);
    border-radius: var(--app-radius);
    background: var(--app-surface);
  }
  .meaning-note h3 { margin: 0 0 0.3rem; color: var(--app-text-strong); font-size: 0.9rem; }
  .meaning-note p,
  .conformance-note { color: var(--app-text); font-size: 0.8rem; line-height: 1.58; }
  .meaning-note p { margin: 0; }
  .meaning-note a { color: var(--app-accent); }

  .facet-grid { display: grid; grid-template-columns: minmax(220px, 0.7fr) minmax(320px, 1.3fr) minmax(280px, 1fr); gap: 0.8rem; }
  .facet {
    padding: 1rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    background: var(--app-surface);
  }
  .facet-number { color: var(--app-accent); font-family: var(--app-font-mono); font-size: 0.7rem; font-weight: 750; }
  .facet h3 { margin: 0.25rem 0 0.7rem; color: var(--app-text-strong); font-size: 1rem; }
  .facet ul { margin: 0; padding-left: 1rem; }
  .facet li { margin-bottom: 0.45rem; color: var(--app-text); font-size: 0.78rem; line-height: 1.45; }
  .facet dl { margin: 0; }
  .facet dl > div { padding: 0.55rem 0; border-top: var(--app-border-width) solid var(--app-border-subtle); }
  .facet dl > div:first-child { padding-top: 0; border-top: 0; }
  .facet dt { color: var(--app-text-strong); font-size: 0.78rem; font-weight: 700; }
  .facet dd { margin: 0.15rem 0 0; color: var(--app-muted); font-size: 0.72rem; line-height: 1.45; }

  .directory-list { display: grid; gap: 0.8rem; }
  .directory-entry {
    padding: 1.1rem;
    border: var(--app-border-width) solid var(--app-border);
    border-left: 3px solid var(--app-haptic);
    border-radius: var(--app-radius);
    background: var(--app-surface);
  }
  .entry-heading { display: flex; align-items: center; gap: 0.7rem; }
  .entry-kind { display: block; color: var(--app-haptic); }
  .entry-heading h3 { margin: 0.15rem 0 0; color: var(--app-text-strong); font-size: 1.1rem; }
  .directory-entry > p { max-width: 76ch; margin: 0.7rem 0 0; color: var(--app-text); font-size: 0.84rem; line-height: 1.58; }
  .badges { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.75rem; }
  .badge { padding: 0.2rem 0.5rem; border: 1px solid var(--app-border); border-radius: 999px; font-size: 0.68rem; font-weight: 650; }
  .badge.relationship { color: var(--app-accent); background: var(--app-accent-soft); }
  .badge.reviewed { color: var(--app-ok); background: color-mix(in srgb, var(--app-ok) 10%, var(--app-surface)); }

  .directory-actions {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    margin-top: 0.9rem;
    padding: 1rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    background: var(--app-surface-2);
  }
  .directory-actions h3 { margin: 0; color: var(--app-text-strong); font-size: 0.95rem; }
  .directory-actions div > p { max-width: 64ch; margin: 0.3rem 0 0; color: var(--app-muted); font-size: 0.78rem; line-height: 1.5; }
  .directory-actions > p { display: flex; flex-wrap: wrap; gap: 0.45rem; margin: 0; flex-shrink: 0; }

  .page-footer {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    justify-content: center;
    margin-top: 3rem;
    padding-top: 1rem;
    border-top: var(--app-border-width) solid var(--app-border);
    color: var(--app-muted);
    font-size: 0.78rem;
  }
  .page-footer a { color: var(--app-accent); }

  @media (max-width: 860px) {
    .section-heading,
    .wider-field { grid-template-columns: 1fr; gap: 0.6rem; }
    .facet-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .facet.review { grid-column: 1 / -1; }
    .overlap-map { grid-template-columns: 1fr; }
    .overlap-bridge { min-height: 96px; }
  }

  @media (max-width: 620px) {
    .ecosystem-page { padding-inline: 0.75rem; }
    .hero { padding: 1.25rem; }
    .connected-entities,
    .facet-grid { grid-template-columns: 1fr; }
    .facet.review { grid-column: auto; }
    .core-connections { display: none; }
    .connected-entities { margin-top: 0.75rem; }
    .directory-actions { align-items: stretch; flex-direction: column; }
    .directory-actions > p { flex-direction: column; }
    .hero-actions a,
    .directory-actions a { width: 100%; }
  }
</style>
