import { mkdtempSync, readFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, test } from 'vitest'

import { mergeDaily, snapshot } from './github-traffic-snapshot.mjs'

const day = (date, count, uniques) => ({ timestamp: `${date}T00:00:00Z`, count, uniques })

// A fake GitHub answering the four traffic endpoints from one table per repository.
function fakeGitHub(byRepository) {
  return async (url) => {
    const [, repository, endpoint] = url.match(/\/repos\/([^/]+\/[^/]+)\/traffic\/(.+)$/)
    const traffic = byRepository[repository]
    if (typeof traffic === 'number') return { ok: false, status: traffic }
    const series = (key) => ({
      count: traffic[key].reduce((sum, d) => sum + d.count, 0),
      uniques: traffic.uniques,
      [key]: traffic[key],
    })
    const body = {
      views: series('views'),
      clones: series('clones'),
      'popular/referrers': traffic.referrers ?? [],
      'popular/paths': traffic.paths ?? [],
    }[endpoint]
    return { ok: true, status: 200, json: async () => body }
  }
}

const readJson = (...parts) => JSON.parse(readFileSync(join(...parts), 'utf8'))

test('a quiet day is stored as a measured zero, and overlapping runs keep the larger count', () => {
  const first = mergeDaily({}, [day('2026-09-02', 4, 2), day('2026-09-01', 0, 0)])
  expect(Object.keys(first)).toEqual(['2026-09-01', '2026-09-02'])
  expect(first['2026-09-01']).toEqual({ count: 0, uniques: 0 })

  // The later run saw 2026-09-02 after more of it had happened.
  const second = mergeDaily(first, [day('2026-09-02', 3, 3), day('2026-09-03', 1, 1)])
  expect(second).toEqual({
    '2026-09-01': { count: 0, uniques: 0 },
    '2026-09-02': { count: 4, uniques: 3 },
    '2026-09-03': { count: 1, uniques: 1 },
  })
})

test('a day that leaves the 14-day window survives in daily.json, and each run keeps its own window', async () => {
  const out = mkdtempSync(join(tmpdir(), 'traffic-'))
  const repository = 'w3c-cg/sstim'

  await snapshot({
    repositories: [repository],
    out,
    token: 't',
    now: new Date('2026-09-16T13:04:47.123Z'),
    fetchImpl: fakeGitHub({
      [repository]: {
        uniques: 2,
        views: [day('2026-09-02', 4, 2), day('2026-09-03', 2, 2)],
        clones: [day('2026-09-02', 107, 20)],
        referrers: [{ referrer: 'w3.org', count: 1, uniques: 1 }],
        paths: [{ path: '/w3c-cg/sstim', title: 'Overview', count: 13, uniques: 6 }],
      },
    }),
  })
  await snapshot({
    repositories: [repository],
    out,
    token: 't',
    now: new Date('2026-09-19T06:17:00Z'),
    fetchImpl: fakeGitHub({
      [repository]: { uniques: 1, views: [day('2026-09-03', 2, 2), day('2026-09-04', 1, 1)], clones: [] },
    }),
  })

  const daily = readJson(out, 'w3c-cg', 'sstim', 'daily.json')
  expect(Object.keys(daily.views)).toEqual(['2026-09-02', '2026-09-03', '2026-09-04'])
  expect(daily.clones).toEqual({ '2026-09-02': { count: 107, uniques: 20 } })

  expect(readdirSync(join(out, 'w3c-cg', 'sstim', 'windows'))).toEqual(['2026-09-16.json', '2026-09-19.json'])
  expect(readJson(out, 'w3c-cg', 'sstim', 'windows', '2026-09-16.json')).toEqual({
    repository,
    fetchedAt: '2026-09-16T13:04:47Z',
    days: { from: '2026-09-02', to: '2026-09-03' },
    views: { count: 6, uniques: 2 },
    clones: { count: 107, uniques: 2 },
    referrers: [{ referrer: 'w3.org', count: 1, uniques: 1 }],
    paths: [{ path: '/w3c-cg/sstim', title: 'Overview', count: 13, uniques: 6 }],
  })
})

test('a repository the token cannot read is reported, and the others are still written', async () => {
  const out = mkdtempSync(join(tmpdir(), 'traffic-'))
  const { windows, failures } = await snapshot({
    repositories: ['w3c-cg/sstim', 'laBioSynCare/laBioSynCare.github.io'],
    out,
    token: 't',
    now: new Date('2026-09-16T00:00:00Z'),
    fetchImpl: fakeGitHub({
      'w3c-cg/sstim': 403,
      'laBioSynCare/laBioSynCare.github.io': { uniques: 1, views: [day('2026-09-15', 1, 1)], clones: [] },
    }),
  })
  expect(windows.map((w) => w.repository)).toEqual(['laBioSynCare/laBioSynCare.github.io'])
  expect(failures).toHaveLength(1)
  expect(failures[0]).toMatch(/^w3c-cg\/sstim: GET traffic\/\S+ answered 403\. .*Administration: read/)
  expect(readdirSync(out)).toEqual(['laBioSynCare'])
})

test('a repository argument cannot steer the output outside its own directory', async () => {
  const { failures } = await snapshot({
    repositories: ['../../etc'],
    out: mkdtempSync(join(tmpdir(), 'traffic-')),
    token: 't',
    fetchImpl: () => {
      throw new Error('must not be fetched')
    },
  })
  expect(failures).toEqual(['../../etc: not an owner/name repository'])
})
