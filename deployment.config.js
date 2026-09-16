const BASE_PATH_PATTERN = /^\/[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)*$/

/**
 * Validate the single deployment mount used by SvelteKit, Vite, and CI.
 *
 * The empty string means origin-root hosting. A non-empty base starts with one
 * slash and has no trailing slash, query, fragment, dot segment, or empty
 * segment. Keeping this strict turns a malformed deployment into a failed
 * build instead of a partially working site with escaped URLs.
 */
export function normalizeDeploymentBase(value = '') {
  if (value === '') return ''
  const segments = value.split('/').slice(1)
  if (
    !BASE_PATH_PATTERN.test(value) ||
    segments.some(segment => segment === '.' || segment === '..')
  ) {
    throw new Error(
      `SSTIM_BASE_PATH must be empty or a root-relative mount without a trailing slash (received ${JSON.stringify(value)})`,
    )
  }
  return value
}

export const deploymentBase = normalizeDeploymentBase(process.env.SSTIM_BASE_PATH ?? '')

/**
 * Validate the canonical application base: the absolute URL that search engines
 * are told to index in place of this copy of a page.
 *
 * The empty string emits no canonical link, and it is the default on purpose.
 * Other operators deploy this build under their own origin (PORTABLE_DEPLOYMENT
 * §1.6d), and their pages must not tell crawlers they are duplicates of ours.
 * Only the two official GitHub Pages publications set it (pages.yml). A
 * non-empty value is an https URL, already in normal form, ending in a slash.
 */
export function normalizeCanonicalBase(value = '') {
  if (value === '') return ''
  let url = null
  try {
    url = new URL(value)
  } catch {
    // Reported below with the setting's name.
  }
  if (!url || url.protocol !== 'https:' || url.href !== value || !url.pathname.endsWith('/') ||
    url.search || url.hash || url.username || url.password) {
    throw new Error(
      `SSTIM_CANONICAL_BASE must be empty or a normalized https URL ending in a slash (received ${JSON.stringify(value)})`,
    )
  }
  return value
}

export const canonicalBase = normalizeCanonicalBase(process.env.SSTIM_CANONICAL_BASE ?? '')
