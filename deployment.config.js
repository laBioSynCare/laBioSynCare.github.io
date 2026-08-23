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
