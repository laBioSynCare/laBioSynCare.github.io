import { browser } from '$app/environment'
import { base } from '$app/paths'
import { loadRuntimeConfig } from '../config/runtimeConfig.js'
import { buildTimeFirebaseConfig } from '../firebase/client.js'

export const prerender = true
export const trailingSlash = 'always'

/**
 * Read the operator's deployment configuration before anything constructs an
 * identity or storage provider (gap G6, docs/technical/PORTABLE_DEPLOYMENT.md).
 *
 * Browser-only by necessity: this file is prerendered at build time, and
 * fetching the configuration then would bake one operator's choices into the
 * artifact — the exact coupling the runtime document exists to remove.
 *
 * `loadRuntimeConfig` never rejects. A missing file is the normal case and
 * leaves the compiled-in behaviour untouched.
 */
export async function load({ fetch }) {
  if (!browser) return {}

  await loadRuntimeConfig({
    fetch,
    base,
    buildTimeFirebase: buildTimeFirebaseConfig(),
  })

  return {}
}
