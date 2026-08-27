<script>
  // Static content page — no runes needed.
  //
  // SSTIM Workbench is published at two addresses while the repository move to
  // w3c-cg completes, and browser storage is scoped per origin, so every
  // logbook, annotation, patch, profile and preference exists separately on
  // each. Nothing moves on its own, and there is no API that could move it.
  // This page is the instruction, linked from Settings and About so it is
  // reachable from whichever site a person is standing on.
  import { applicationRoute } from '../../config/applicationUrls.js'
  import { GITHUB_URL } from '../../ui/externalLinks.js'

  const SITES = [
    {
      name: 'labiosyncare.github.io',
      url: 'https://labiosyncare.github.io/',
      role: 'The original site, and where the persistent w3id.org identifiers still resolve today.',
    },
    {
      name: 'w3c-cg.github.io/sstim',
      url: 'https://w3c-cg.github.io/sstim/',
      role: 'The Community Group site, published from the same source and the long-term home.',
    },
  ]
</script>

<svelte:head>
  <title>Moving between sites | SSTIM Workbench</title>
  <meta
    name="description"
    content="SSTIM Workbench is published at two addresses. Your logbooks, patches, annotations and preferences are stored per address. How to carry them across, and what cannot travel."
  />
</svelte:head>

<main class="transition-page">
  <header>
    <p class="eyebrow">Transition guide</p>
    <h1>Moving between SSTIM Workbench sites</h1>
    <p class="lede">
      SSTIM Workbench is currently published at two addresses, built from the same source. Your
      work is stored in your browser, and browsers keep storage separate per address. So each
      site holds its own copy of everything, and <strong>nothing moves between them on its
      own</strong>. Carrying it across takes two clicks and a file.
    </p>
  </header>

  <section aria-labelledby="sites-heading">
    <h2 id="sites-heading">The two addresses</h2>
    <ul class="sites">
      {#each SITES as site}
        <li>
          <a href={site.url}>{site.name}</a>
          <p>{site.role}</p>
        </li>
      {/each}
    </ul>
    <p>
      Both stay reachable. Nothing is being switched off, and you do not have to move today.
    </p>
  </section>

  <section aria-labelledby="carry-heading">
    <h2 id="carry-heading">Carry your data across</h2>
    <ol class="steps">
      <li>
        On the site that <em>has</em> your work, open
        <a href={applicationRoute('/settings/')}>Settings</a>, find <strong>Data &amp; privacy</strong>,
        and choose <strong>Export browser data</strong>. The file is assembled locally in your
        browser and downloaded; nothing is uploaded anywhere.
      </li>
      <li>
        Open the other site and go to its Settings, same section.
      </li>
      <li>
        Choose <strong>Restore from file</strong>, pick the file you just downloaded, review what
        it says it will do, and confirm. Reload afterwards so open screens pick up the restored
        data.
      </li>
    </ol>
    <p class="note">
      Do this in one direction only, and treat the site you exported from as the copy of record
      until you are satisfied. Restoring an old export over newer work would replace it.
    </p>
  </section>

  <section aria-labelledby="contents-heading">
    <h2 id="contents-heading">What travels, and what does not</h2>
    <div class="two-up">
      <div>
        <h3>Travels</h3>
        <ul>
          <li>Logbook entries</li>
          <li>Local annotations</li>
          <li>Saved Patch Studio patches</li>
          <li>Your profile</li>
          <li>Appearance preference</li>
        </ul>
      </div>
      <div>
        <h3>Does not travel</h3>
        <ul>
          <li>Sign-in identity. Entries are exported by scope and re-keyed to whoever imports
            them, so if you sign in before restoring, account entries land in that account; if
            you do not, they arrive as anonymous entries.</li>
          <li>The installed app, for the reason below.</li>
        </ul>
      </div>
    </div>
    <p class="note">
      If your appearance preference does not come across, set it again in Settings. Everything
      else is carried in the file and verified by a checksum before it is applied.
    </p>
  </section>

  <section aria-labelledby="pwa-heading">
    <h2 id="pwa-heading">If you installed the app</h2>
    <p>
      An installed web app belongs to the address it was installed from. That installation is
      state held by your browser and operating system, and there is no web API that can read,
      move or recreate it, so no export could include it however much we wanted it to.
    </p>
    <p>
      Install again from the other site, then carry your data across with the steps above. The
      data does travel; the installation does not. You can keep both installed if you like, but
      they will not share anything.
    </p>
  </section>

  <footer>
    <p>
      Questions, or something that did not work as described? Open an issue at
      <a href="{GITHUB_URL}/issues" rel="external">{GITHUB_URL.replace('https://github.com/', '')}</a>.
    </p>
  </footer>
</main>

<style>
  .transition-page {
    max-width: 60rem;
    margin: 0 auto;
    padding: 1.5rem 1.15rem 6rem;
    color: var(--app-text);
    font-family: var(--app-font-ui);
  }

  .eyebrow {
    margin: 0;
    color: var(--app-accent);
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0.35rem 0 0.75rem;
    color: var(--app-text-strong);
    font-size: clamp(1.7rem, 4vw, 2.4rem);
  }

  h2 {
    margin: 0 0 0.6rem;
    color: var(--app-text-strong);
    font-size: clamp(1.15rem, 2.5vw, 1.45rem);
  }

  h3 {
    margin: 0 0 0.4rem;
    color: var(--app-text-strong);
    font-size: 1rem;
  }

  .lede {
    max-width: 46rem;
    font-size: 1.05rem;
    line-height: 1.6;
  }

  section {
    margin-top: 2.25rem;
    padding-top: 1.5rem;
    border-top: var(--app-border-width) solid var(--app-border);
  }

  .sites {
    display: grid;
    gap: 1rem;
    margin: 0 0 1rem;
    padding: 0;
    list-style: none;
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  }

  .sites li {
    padding: 0.9rem 1rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
  }

  .sites p {
    margin: 0.35rem 0 0;
    font-size: 0.92rem;
  }

  .steps {
    margin: 0 0 1rem;
    padding-left: 1.25rem;
    line-height: 1.65;
  }

  .steps li + li {
    margin-top: 0.6rem;
  }

  .two-up {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
  }

  .two-up ul {
    margin: 0;
    padding-left: 1.15rem;
    line-height: 1.6;
  }

  .note {
    margin-top: 1rem;
    font-size: 0.92rem;
    opacity: 0.85;
  }

  footer {
    margin-top: 2.5rem;
    font-size: 0.92rem;
  }
</style>
