// github-traffic-snapshot.mjs: keep GitHub's repository traffic past the 14
// days GitHub itself retains.
//
//   node scripts/github-traffic-snapshot.mjs --out <data dir> [--repo owner/name ...]
//
// GitHub reports views, clones, top referrers and top paths for the last 14
// complete UTC days, only to people with push access, and records them nowhere
// else. A collection gap longer than the window is lost for good. The scheduled
// run lives in the private laBioSynCare/sstim-traffic repository (its README
// has the setup); `make traffic-snapshot OUT=<dir>` runs the same collector
// by hand.
//
// For each repository it writes, under <out>/<owner>/<repo>/:
//
//   daily.json           views and clones per UTC day, merged across runs.
//                        GitHub returns quiet days as explicit zeros, so a date
//                        that is present was measured and a date that is absent
//                        was never collected. Where runs overlap the larger
//                        value wins, field by field: a day's counts only grow
//                        while it is inside the window.
//   windows/<date>.json  the window totals, top referrers and top paths as
//                        fetched that day. They cannot be rebuilt from
//                        daily.json, because unique visitors do not add up
//                        across days.
//
// This is traffic to the GitHub repository pages. Visits to the Pages sites and
// fetches of the RDF through w3id.org are not in it.
//
// The token is TRAFFIC_TOKEN, else GH_TOKEN, else GITHUB_TOKEN. The endpoints
// need push access and "Administration: read". A workflow's own GITHUB_TOKEN
// cannot be granted that permission, and a fine-grained token cannot reach a
// repository its owner only collaborates on (w3c-cg/sstim), which is why the
// scheduled run uses a classic token.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

export const DEFAULT_REPOSITORIES = ['laBioSynCare/laBioSynCare.github.io', 'w3c-cg/sstim']

const API = 'https://api.github.com'
const REPOSITORY = /^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/

const utcDay = (timestamp) => timestamp.slice(0, 10)

/** Merge one fetch's per-day series into the stored one, keeping the larger value per field. */
export function mergeDaily(stored, days) {
  const merged = { ...stored }
  for (const { timestamp, count, uniques } of days) {
    const day = utcDay(timestamp)
    const previous = merged[day]
    merged[day] = previous
      ? { count: Math.max(previous.count, count), uniques: Math.max(previous.uniques, uniques) }
      : { count, uniques }
  }
  return Object.fromEntries(Object.entries(merged).sort(([a], [b]) => a.localeCompare(b)))
}

/** The window record: what the four endpoints said at `fetchedAt`. */
export function buildWindow(repository, fetchedAt, { views, clones, referrers, paths }) {
  const days = views.views.map(({ timestamp }) => utcDay(timestamp)).sort()
  return {
    repository,
    fetchedAt,
    days: days.length ? { from: days[0], to: days.at(-1) } : null,
    views: { count: views.count, uniques: views.uniques },
    clones: { count: clones.count, uniques: clones.uniques },
    referrers: referrers.map(({ referrer, count, uniques }) => ({ referrer, count, uniques })),
    paths: paths.map(({ path, title, count, uniques }) => ({ path, title, count, uniques })),
  }
}

export async function fetchTraffic(repository, { token, fetchImpl = fetch }) {
  if (!REPOSITORY.test(repository)) throw new Error(`${repository}: not an owner/name repository`)
  const get = async (endpoint) => {
    const response = await fetchImpl(`${API}/repos/${repository}/traffic/${endpoint}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'sstim-traffic-snapshot',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
    if (response.ok) return response.json()
    const hint =
      response.status === 403 || response.status === 404
        ? ' The token needs push access to the repository and "Administration: read" (fine-grained) or the repo scope (classic).'
        : ''
    throw new Error(`${repository}: GET traffic/${endpoint} answered ${response.status}.${hint}`)
  }
  const [views, clones, referrers, paths] = await Promise.all(
    ['views', 'clones', 'popular/referrers', 'popular/paths'].map(get),
  )
  return { views, clones, referrers, paths }
}

const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)

export function writeSnapshot(out, repository, fetchedAt, traffic) {
  const dir = join(out, ...repository.split('/'))
  const dailyPath = join(dir, 'daily.json')
  const stored = existsSync(dailyPath) ? JSON.parse(readFileSync(dailyPath, 'utf8')) : {}
  mkdirSync(join(dir, 'windows'), { recursive: true })
  writeJson(dailyPath, {
    repository,
    views: mergeDaily(stored.views ?? {}, traffic.views.views),
    clones: mergeDaily(stored.clones ?? {}, traffic.clones.clones),
  })
  const window = buildWindow(repository, fetchedAt, traffic)
  writeJson(join(dir, 'windows', `${utcDay(fetchedAt)}.json`), window)
  return window
}

/** Collect every repository it can; one failing repository does not cost the others their snapshot. */
export async function snapshot({ repositories, out, token, fetchImpl = fetch, now = new Date() }) {
  const fetchedAt = now.toISOString().replace(/\.\d{3}Z$/, 'Z')
  const windows = []
  const failures = []
  for (const repository of repositories) {
    try {
      windows.push(writeSnapshot(out, repository, fetchedAt, await fetchTraffic(repository, { token, fetchImpl })))
    } catch (error) {
      failures.push(error.message)
    }
  }
  return { windows, failures }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const { values } = parseArgs({
    options: { out: { type: 'string' }, repo: { type: 'string', multiple: true } },
  })
  const token = process.env.TRAFFIC_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_TOKEN
  if (!values.out || !token) {
    console.error('usage: TRAFFIC_TOKEN=... node scripts/github-traffic-snapshot.mjs --out <dir> [--repo owner/name ...]')
    process.exit(2)
  }
  const { windows, failures } = await snapshot({
    repositories: values.repo ?? DEFAULT_REPOSITORIES,
    out: values.out,
    token,
  })
  for (const { repository, days, views, clones, referrers } of windows) {
    const span = days ? `${days.from}..${days.to}` : 'no days'
    console.log(
      `${repository}: ${span}, ${views.count} views (${views.uniques} unique), ` +
        `${clones.count} clones (${clones.uniques} unique), ${referrers.length} referrers`,
    )
  }
  for (const failure of failures) console.error(failure)
  if (failures.length) process.exit(1)
}
