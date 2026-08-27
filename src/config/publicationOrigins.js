// The two origins this application is published from.
//
// The repository moved to `w3c-cg/sstim` and publishes at the project site, but
// the origin-root deployment stays live rather than redirecting: four frozen
// release manifests (0.13.0 to 0.16.0) state root-absolute paths and are
// immutable, so their own references only resolve from an origin root, and
// w3id PR #6609 keeps routing them here. Browser storage is also per-origin, so
// a redirect would strand people from data they can no longer reach to export.
//
// What the old origin gets instead is a notice, which is what
// `src/ui/transition/OriginMovedModal.svelte` renders.

export const LEGACY_ORIGIN = 'https://labiosyncare.github.io'
export const CURRENT_HOME = 'https://w3c-cg.github.io/sstim/'

/**
 * Whether a viewer is on the superseded origin.
 *
 * Exact match, deliberately. A prefix or hostname test would fire on a
 * self-hosted deployment (docs/technical/PORTABLE_DEPLOYMENT.md), on localhost,
 * and on the new site itself, each of which would be telling someone to leave a
 * place they are not.
 */
export function isSupersededOrigin(origin) {
  return origin === LEGACY_ORIGIN
}
