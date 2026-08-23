import adapter from '@sveltejs/adapter-static'
import { deploymentBase } from './deployment.config.js'

// SvelteKit's version name defaults to a build timestamp. It is embedded in the
// client bundle as the `__sveltekit_<id>` global and feeds the service worker's
// cache name (`bsc-lab-${version}`, src/service-worker.js), so a fresh timestamp
// changes every content hash in the build — which makes `nix build` output
// differ on every run even from identical sources.
//
// It cannot simply be pinned to a constant: the cache name would stop changing
// between deploys and clients would never pick up an update (ADR 0009).
//
// So it is overridable instead. A build that sets BSC_BUILD_VERSION to something
// stable-per-revision — a commit SHA, as the Nix package does — is reproducible
// *and* still invalidates caches whenever the source changes. Unset, the
// SvelteKit default applies and behaviour is unchanged.
const buildVersion = process.env.BSC_BUILD_VERSION

export default {
  kit: {
    ...(buildVersion ? { version: { name: buildVersion } } : {}),
    paths: {
      base: deploymentBase,
      // Project Pages needs deterministic mount-prefixed URLs in every
      // prerendered page. Root and portable builds still use the same code by
      // leaving SSTIM_BASE_PATH empty.
      relative: false,
    },
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
