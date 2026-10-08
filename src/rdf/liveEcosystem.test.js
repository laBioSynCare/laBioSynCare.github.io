import { describe, expect, it } from 'vitest'
import { INSTANCE_URLS } from './loader.js'
import { LIVE_ECOSYSTEM_URL } from './liveEcosystem.js'

describe('live ecosystem store', () => {
  it('is the one the graph loader reads', () => {
    expect(INSTANCE_URLS.ecosystem).toEqual([LIVE_ECOSYSTEM_URL])
  })
})
