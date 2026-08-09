<script>
  import '@picocss/pico/css/pico.min.css'
  import { onMount } from 'svelte'
  import AppBottomDock from '../ui/navigation/AppBottomDock.svelte'
  import AppTopBar from '../ui/navigation/AppTopBar.svelte'
  import ServiceWorkerUpdate from '../ui/pwa/ServiceWorkerUpdate.svelte'
  import PhotosensitivityAdvisory from '../ui/safety/PhotosensitivityAdvisory.svelte'
  import { initSkin } from '../ui/theme/skins.js'
  import { initVisualStimulation } from '../ui/safety/visualSafety.js'

  const { children } = $props()

  onMount(() => {
    initSkin()
    initVisualStimulation()
  })
</script>

<AppTopBar />

<div class="app-page-shell">
  {@render children()}
</div>

<AppBottomDock />

<PhotosensitivityAdvisory />

<ServiceWorkerUpdate />

<style>
  /* Skin-independent tokens and Pico bindings. Per-skin colour palettes
     follow below, keyed by [data-skin]. The default skin (paper) palette
     also lives in :root so the no-JS / pre-hydration state matches the
     default applied by the inline script in app.html. */
  :global(:root) {
    color-scheme: light;
    --app-header-height: 56px;
    --app-bottom-dock-height: 48px;
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

  /* Default skin (paper) — also applied when no data-skin is set yet. */
  :global(:root),
  :global(:root[data-skin='paper']) {
    color-scheme: light;
    --app-bg: #f7f3ea;
    --app-canvas: #fffdf8;
    --app-surface: #fffaf1;
    --app-surface-2: #eee7d8;
    --app-surface-3: #e5dcc9;
    --app-border: #cdbfa6;
    --app-border-subtle: #e1d6c4;
    --app-text: #2f2a21;
    --app-text-strong: #17130d;
    --app-muted: #6f6557;
    --app-muted-2: #8a806f;
    --app-accent: #3366a3;
    --app-accent-soft: #dce8f3;
    --app-on-accent: #ffffff;
    --app-dock-active: var(--app-accent);
    --app-control: #8a5a00;
    --app-audio: #3366a3;
    --app-visual: #7c5cc4;
    --app-haptic: #28745e;
    --app-ok: #317a43;
    --app-warn: #9a6500;
    --app-error: #a94438;
  }

  :global(:root[data-skin='midnight']) {
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
    --app-on-accent: #080d12;
    --app-dock-active: var(--app-accent);
    --app-control: #e67e22;
    --app-audio: #3b9eff;
    --app-visual: #9b5fd3;
    --app-haptic: #16a085;
    --app-ok: #35c46d;
    --app-warn: #e8a23c;
    --app-error: #e0604d;
  }

  :global(:root[data-skin='aurora']) {
    color-scheme: dark;
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
    --app-on-accent: #071013;
    --app-dock-active: var(--app-accent);
    --app-control: #ffb15c;
    --app-audio: #4aa8ff;
    --app-visual: #b882ff;
    --app-haptic: #42d3c8;
    --app-ok: #55d98b;
    --app-warn: #ffbd63;
    --app-error: #ff7aad;
  }

  :global(:root[data-skin='ember']) {
    color-scheme: dark;
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
    --app-on-accent: #100d0a;
    --app-dock-active: var(--app-accent);
    --app-control: #ff8c3b;
    --app-audio: #55c7d6;
    --app-visual: #c98cff;
    --app-haptic: #80c46b;
    --app-ok: #80c46b;
    --app-warn: #ffbe63;
    --app-error: #f06f5e;
    --app-border-width: 1.5px;
  }

  :global(:root[data-skin='daylight']) {
    color-scheme: light;
    --app-bg: #eef4f7;
    --app-canvas: #f9fbfd;
    --app-surface: #ffffff;
    --app-surface-2: #e7f0f6;
    --app-surface-3: #dbe8f1;
    --app-border: #b8cbd8;
    --app-border-subtle: #d6e2ea;
    --app-text: #1c2b37;
    --app-text-strong: #07131f;
    --app-muted: #5f7282;
    --app-muted-2: #758897;
    --app-accent: #0b72c9;
    --app-accent-soft: #d7ebfb;
    --app-on-accent: #ffffff;
    --app-dock-active: #07558f;
    --app-control: #c46a00;
    --app-audio: #0b72c9;
    --app-visual: #745bd3;
    --app-haptic: #16856f;
    --app-ok: #1f8a4c;
    --app-warn: #ad6600;
    --app-error: #b33c2e;
  }

  :global(html),
  :global(body) {
    background: var(--app-bg);
    color: var(--app-text);
  }

  :global(body) {
    margin: 0;
    font-family: var(--app-font-ui);
    padding-bottom: var(--app-bottom-dock-height);
  }

  .app-page-shell {
    overflow: hidden;
  }

  :global(body.studio-page .app-topbar) { display: none; }
  :global(body.studio-page > div)       { overflow: visible; }
</style>
