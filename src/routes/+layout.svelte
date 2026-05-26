<script>
  import '@picocss/pico/css/pico.min.css'
  import { onMount } from 'svelte'
  import AppTopBar from '../ui/navigation/AppTopBar.svelte'
  import { initSkin } from '../ui/theme/skins.js'

  const { children } = $props()

  onMount(() => {
    initSkin()
  })
</script>

<AppTopBar />

<div style="overflow:hidden">
  {@render children()}
</div>

<style>
  :global(:root) {
    color-scheme: dark;
    --app-bg: #080d12;
    --app-canvas: #0b0b0c;
    --app-surface: #111820;
    --app-surface-2: #161f2a;
    --app-surface-3: #1b2633;
    --app-border: #243447;
    --app-border-subtle: #ffffff18;
    --app-text: #d7e1ec;
    --app-text-strong: #f1f6fb;
    --app-muted: #8292a7;
    --app-muted-2: #53687a;
    --app-accent: #3b9eff;
    --app-accent-soft: #0c2440;
    --app-control: #e67e22;
    --app-audio: #3b9eff;
    --app-visual: #9b5fd3;
    --app-haptic: #16a085;
    --app-ok: #35c46d;
    --app-warn: #e8a23c;
    --app-error: #e0604d;
    --app-header-height: 56px;
    --app-radius: 4px;
    --app-border-width: 1px;
    --app-font-ui: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    --app-font-mono: "SF Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, monospace;
    --pico-background-color: var(--app-bg);
    --pico-card-background-color: var(--app-surface);
    --pico-color: var(--app-text);
    --pico-muted-color: var(--app-muted);
    --pico-muted-border-color: var(--app-border);
    --pico-primary: var(--app-accent);
    --pico-primary-background: var(--app-accent-soft);
    --pico-primary-border: var(--app-accent);
    --pico-border-radius: var(--app-radius);
    --pico-font-family: var(--app-font-ui);
  }

  :global(:root[data-skin='aurora']) {
    --app-bg: #071013;
    --app-canvas: #071012;
    --app-surface: #102026;
    --app-surface-2: #142b32;
    --app-surface-3: #193741;
    --app-border: #24505b;
    --app-border-subtle: #8de7dc24;
    --app-text: #d9f6f2;
    --app-text-strong: #f5fffd;
    --app-muted: #8fb4bc;
    --app-muted-2: #5c7f88;
    --app-accent: #42d3c8;
    --app-accent-soft: #0b3637;
    --app-control: #ffb15c;
    --app-audio: #4aa8ff;
    --app-visual: #b882ff;
    --app-haptic: #42d3c8;
    --app-ok: #55d98b;
    --app-warn: #ffbd63;
    --app-error: #ff7aad;
  }

  :global(:root[data-skin='ember']) {
    --app-bg: #100d0a;
    --app-canvas: #0d0b09;
    --app-surface: #1b1712;
    --app-surface-2: #231d16;
    --app-surface-3: #2d241a;
    --app-border: #4a3927;
    --app-border-subtle: #ffbe6320;
    --app-text: #efe3d1;
    --app-text-strong: #fff6e8;
    --app-muted: #a88f73;
    --app-muted-2: #765f48;
    --app-accent: #ffad3b;
    --app-accent-soft: #3a250b;
    --app-control: #ff8c3b;
    --app-audio: #55c7d6;
    --app-visual: #c98cff;
    --app-haptic: #80c46b;
    --app-ok: #80c46b;
    --app-warn: #ffbe63;
    --app-error: #f06f5e;
    --app-border-width: 1.5px;
  }

  :global(html),
  :global(body) {
    background: var(--app-bg);
    color: var(--app-text);
  }

  :global(body) {
    margin: 0;
    font-family: var(--app-font-ui);
  }

  :global(body.studio-page .app-topbar) { display: none; }
  :global(body.studio-page > div)       { overflow: visible; }
</style>
