import { describe, expect, it } from 'vitest'
import {
  ARCHITECTURE_ENTITIES,
  DIRECTORY_ENTRIES,
  DOMAIN_REVIEW_STATUSES,
  SSTIM_RELATIONSHIPS,
} from './architecture.js'

function expectUniqueIds(items) {
  const ids = items.map((item) => item.id)
  expect(new Set(ids).size).toBe(ids.length)
}

describe('public ecosystem architecture', () => {
  it('keeps every public classification identifier unique', () => {
    expectUniqueIds(ARCHITECTURE_ENTITIES)
    expectUniqueIds(SSTIM_RELATIONSHIPS)
    expectUniqueIds(DOMAIN_REVIEW_STATUSES)
    expectUniqueIds(DIRECTORY_ENTRIES)
  })

  it('keeps directory relationship and review references resolvable', () => {
    const relationshipIds = new Set(SSTIM_RELATIONSHIPS.map((relationship) => relationship.id))
    const reviewStatusIds = new Set(DOMAIN_REVIEW_STATUSES.map((status) => status.id))

    for (const entry of DIRECTORY_ENTRIES) {
      expect(entry.relationships.length).toBeGreaterThan(0)
      for (const relationshipId of entry.relationships) {
        expect(relationshipIds.has(relationshipId)).toBe(true)
      }
      expect(reviewStatusIds.has(entry.reviewStatus)).toBe(true)
    }
  })
})
