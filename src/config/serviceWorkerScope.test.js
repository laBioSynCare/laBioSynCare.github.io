import { describe, expect, it } from 'vitest'
import {
  isWithinDeployment,
  serviceWorkerCachePrefix,
  staleOwnedCaches,
} from './serviceWorkerScope.js'

describe('service-worker project isolation', () => {
  it('owns only the configured project path on a shared origin', () => {
    expect(isWithinDeployment('/sstim', '/sstim')).toBe(true)
    expect(isWithinDeployment('/sstim', '/sstim/')).toBe(true)
    expect(isWithinDeployment('/sstim', '/sstim/graph/')).toBe(true)
    expect(isWithinDeployment('/sstim', '/sstim-other/')).toBe(false)
    expect(isWithinDeployment('/sstim', '/another-project/')).toBe(false)
  })

  it('allows a dedicated root deployment to own its origin', () => {
    expect(isWithinDeployment('', '/')).toBe(true)
    expect(isWithinDeployment('', '/graph/')).toBe(true)
  })

  it('deletes only stale caches owned by the same mount', () => {
    const prefix = serviceWorkerCachePrefix('/sstim')
    const current = `${prefix}current`
    expect(staleOwnedCaches([
      current,
      `${prefix}old`,
      'sstim-workbench:/another-project/:old',
      'unrelated-application-cache',
    ], current, prefix)).toEqual([`${prefix}old`])
  })
})
