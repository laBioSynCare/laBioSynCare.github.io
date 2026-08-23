import { describe, expect, it } from 'vitest'
import { LOCAL_PROFILE_KEY, normalizeProfile, readLocalProfile, writeLocalProfile } from './profile.js'

function memoryStorage(seed = {}) {
  const map = new Map(Object.entries(seed))
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  }
}

describe('local profile storage', () => {
  it('returns an empty profile when nothing is stored', () => {
    expect(readLocalProfile(memoryStorage())).toMatchObject({
      displayName: '', bio: '', affiliation: '', email: '',
    })
  })

  it('round-trips a profile', () => {
    const storage = memoryStorage()
    writeLocalProfile(storage, { displayName: 'Ada', bio: 'Notes', affiliation: 'BSC' })

    expect(readLocalProfile(storage)).toMatchObject({
      displayName: 'Ada', bio: 'Notes', affiliation: 'BSC',
    })
  })

  it('records when it was last written', () => {
    const storage = memoryStorage()
    const saved = writeLocalProfile(storage, { displayName: 'Ada' })

    expect(Date.parse(saved.updatedAt)).not.toBeNaN()
  })

  it('applies the same limits as the Firestore path', () => {
    const normalized = normalizeProfile({
      displayName: 'x'.repeat(500),
      bio: 'y'.repeat(9000),
      affiliation: '  spaced  ',
      email: 'a@b.c',
    })

    expect(normalized.displayName).toHaveLength(200)
    expect(normalized.bio).toHaveLength(4000)
    expect(normalized.affiliation).toBe('spaced')
    expect(normalized.email).toBe('a@b.c')
  })

  it('tolerates a corrupted stored profile', () => {
    const storage = memoryStorage({ [LOCAL_PROFILE_KEY]: 'not json' })

    expect(readLocalProfile(storage).displayName).toBe('')
  })

  it('ignores a stored array rather than treating it as a profile', () => {
    const storage = memoryStorage({ [LOCAL_PROFILE_KEY]: '[1,2,3]' })

    expect(readLocalProfile(storage)).toMatchObject({ displayName: '', bio: '' })
  })
})
