import adapter from '@sveltejs/adapter-static'

export default {
  kit: {
    adapter: adapter({
      pages: 'dist',
      assets: 'dist',
      fallback: '404.html',
    }),
    // The service worker (src/service-worker.js) is still compiled, but we
    // register it ourselves in src/ui/pwa/ServiceWorkerUpdate.svelte, guarded
    // by !dev. This keeps a precaching worker out of `make dev` (where it would
    // serve stale assets and fight HMR) and lets us drive the session-safe
    // update flow. See docs/decisions/0009-pwa.md and
    // docs/technical/PWA_SERVICE_WORKER.md.
    serviceWorker: {
      register: false,
    },
  },
}
