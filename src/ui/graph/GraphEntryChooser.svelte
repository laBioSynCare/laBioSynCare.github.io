<script>
  // The arrival screen for /graph. See entryChooser.js for why this exists and
  // why it asks rather than picking a default.
  import { ENTRY_POINTS } from './entryChooser.js'

  const { onChoose } = $props()
</script>

<main class="entry" aria-labelledby="entry-title">
  <header>
    <p class="eyebrow">Graph Navigator</p>
    <h1 id="entry-title">Where would you like to start?</h1>
    <p class="lede">
      SSTIM describes auditory, visual and cross-modal stimulation across several hundred
      terms. Pick a subject to open a readable slice of the graph; you can widen or change
      the scope at any time from the picker in the top bar.
    </p>
  </header>

  <ul class="entries">
    {#each ENTRY_POINTS as entry (entry.value)}
      <li>
        <button type="button" onclick={() => onChoose(entry.value)}>
          <span class="entry-label">{entry.label}</span>
          <span class="entry-about">{entry.about}</span>
        </button>
      </li>
    {/each}
  </ul>

  <footer>
    <button type="button" class="whole-graph" onclick={() => onChoose(null)}>
      Show the whole graph
    </button>
    <p class="whole-graph-note">
      Every term at once. It is the complete picture, and it takes several seconds to lay
      out before the labels become readable.
    </p>
  </footer>
</main>

<style>
  .entry {
    max-width: 62rem;
    margin: 0 auto;
    padding: 2.5rem 1.15rem 3rem;
    color: var(--app-text);
    font-family: var(--app-font-ui);
  }

  .eyebrow {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--app-accent);
    margin: 0 0 0.35rem;
  }

  h1 {
    font-size: clamp(1.5rem, 3vw, 2rem);
    line-height: 1.12;
    font-weight: 800;
    color: var(--app-text-strong);
    margin: 0 0 0.7rem;
  }

  .lede {
    font-size: 0.95rem;
    line-height: 1.6;
    max-width: 68ch;
    color: var(--app-muted);
    margin: 0 0 1.75rem;
  }

  .entries {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.85rem;
    margin: 0 0 1.75rem;
    padding: 0;
  }

  /* Pico styles `li` directly, so clearing the marker on the `ul` alone leaves
     a bullet sitting outside every card. */
  .entries,
  .entries li {
    list-style: none;
  }

  .entries li::marker {
    content: '';
  }

  .entries button {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    width: 100%;
    height: 100%;
    text-align: left;
    margin: 0;
    padding: 0.95rem 1rem 1rem;
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    color: inherit;
    cursor: pointer;
  }

  .entries button:hover,
  .entries button:focus-visible {
    border-color: var(--app-accent);
    background: var(--app-accent-soft);
  }

  .entry-label {
    font-size: 1rem;
    font-weight: 700;
    color: var(--app-text-strong);
    line-height: 1.2;
  }

  .entry-about {
    font-size: 0.82rem;
    line-height: 1.5;
    color: var(--app-muted);
  }

  footer {
    border-top: var(--app-border-width) solid var(--app-border);
    padding-top: 1.25rem;
  }

  .whole-graph {
    margin: 0 0 0.5rem;
    padding: 0.45rem 0.9rem;
    font-size: 0.85rem;
    font-weight: 700;
    background: transparent;
    color: var(--app-accent);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    cursor: pointer;
  }

  .whole-graph:hover,
  .whole-graph:focus-visible {
    border-color: var(--app-accent);
    background: var(--app-accent-soft);
  }

  .whole-graph-note {
    font-size: 0.8rem;
    line-height: 1.5;
    max-width: 62ch;
    color: var(--app-muted);
    margin: 0;
  }

  @media (max-width: 900px) {
    .entries {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 560px) {
    .entries {
      grid-template-columns: 1fr;
    }
  }
</style>
