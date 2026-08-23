const URL_SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*:/

// Vite replaces this property with the validated `deploymentBase` literal.
// Direct Node consumers (ontology/quality scripts) see no injected property and
// deliberately retain logical root-relative paths that map into static/.
const base = typeof globalThis.__SSTIM_DEPLOYMENT_BASE__ === 'string'
  ? globalThis.__SSTIM_DEPLOYMENT_BASE__
  : ''

function isExternalOrFragment(value) {
  if (typeof value !== 'string') return false
  return URL_SCHEME.test(value) || value.startsWith('//') || value.startsWith('#')
}

function requireApplicationPath(value, kind) {
  if (typeof value !== 'string' || !value.startsWith('/')) {
    throw new TypeError(`${kind} must be a root-relative application path or an absolute URL`)
  }
}

/** Resolve an application route against SvelteKit's configured mount path. */
export function applicationRoute(value) {
  if (isExternalOrFragment(value)) return value
  requireApplicationPath(value, 'Application route')
  return base ? `${base}${value}` : value
}

/** Resolve a file from static/ against SvelteKit's configured mount path. */
export function applicationAsset(value) {
  if (isExternalOrFragment(value)) return value
  requireApplicationPath(value, 'Application asset')

  // `$app/paths.asset` expects the asset pathname. Preserve an optional query
  // or fragment separately so cache-busters and deep links survive unchanged.
  const suffixAt = value.search(/[?#]/)
  const pathname = suffixAt === -1 ? value : value.slice(0, suffixAt)
  const suffix = suffixAt === -1 ? '' : value.slice(suffixAt)
  return `${base}${pathname}${suffix}`
}

/**
 * Convert a resolved same-app URL back to the repository's logical root path.
 * This is for build/test tooling that maps runtime URLs to files under static/;
 * browser network consumers should use applicationAsset instead.
 */
export function logicalApplicationPath(value) {
  if (isExternalOrFragment(value) || !base) return value
  if (value === base) return '/'
  return value.startsWith(`${base}/`) ? value.slice(base.length) : value
}
