const CACHE_OWNER = 'sstim-workbench'

export function serviceWorkerCachePrefix(base) {
  return `${CACHE_OWNER}:${base || '/'}:`
}

export function isWithinDeployment(base, pathname) {
  if (!base) return true
  return pathname === base || pathname.startsWith(`${base}/`)
}

export function staleOwnedCaches(keys, currentCache, prefix) {
  return keys.filter(key => key.startsWith(prefix) && key !== currentCache)
}
