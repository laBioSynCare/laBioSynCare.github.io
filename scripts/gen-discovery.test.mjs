import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, test } from 'vitest'

import {
  LLMS_FULL_DOCUMENTS,
  LLMS_SECTIONS,
  buildLlmsIndex,
  buildRobots,
  buildSitemap,
  collectPages,
  resolveOrigin,
} from './gen-discovery.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const FACTS = {
  developmentVersion: '9.9.9-dev',
  moduleCount: 18,
  profileCount: 4,
  releaseVersion: '9.9.8',
  versionDoi: '10.5281/zenodo.1',
  conceptDoi: '10.5281/zenodo.0',
}

test('the origin comes from the deployment, never from a guess', () => {
  expect(resolveOrigin({ SSTIM_SITE_ORIGIN: 'https://example.org/' })).toBe('https://example.org')
  expect(resolveOrigin({ GITHUB_REPOSITORY_OWNER: 'w3c-cg' })).toBe('https://w3c-cg.github.io')
  // Explicit wins: a self-hosted deployment is not its GitHub owner.
  expect(
    resolveOrigin({ SSTIM_SITE_ORIGIN: 'https://sstim.example', GITHUB_REPOSITORY_OWNER: 'w3c-cg' }),
  ).toBe('https://sstim.example')
  // Nothing to derive from means nothing is written, rather than one
  // deployment's hostname baked into another's artifact.
  expect(resolveOrigin({})).toBeNull()
})

test('the sitemap lists the pages the build actually contains', () => {
  const dist = mkdtempSync(join(tmpdir(), 'sstim-discovery-'))
  for (const dir of ['', 'graph', 'ontology/docs']) {
    mkdirSync(join(dist, dir), { recursive: true })
    writeFileSync(join(dist, dir, 'index.html'), '<!doctype html>')
  }
  writeFileSync(join(dist, 'not-a-page.json'), '{}')

  const pages = collectPages(dist)
  expect(pages).toEqual(['/', '/graph/', '/ontology/docs/'])

  const sitemap = buildSitemap({ siteRoot: 'https://w3c-cg.github.io/sstim', pages })
  expect(sitemap).toContain('<loc>https://w3c-cg.github.io/sstim/</loc>')
  expect(sitemap).toContain('<loc>https://w3c-cg.github.io/sstim/graph/</loc>')
  expect(sitemap).not.toContain('not-a-page')
})

test('robots.txt says where the sitemap is, and admits when it is inert', () => {
  const atRoot = buildRobots({ siteRoot: 'https://labiosyncare.github.io', base: '' })
  expect(atRoot).toContain('Sitemap: https://labiosyncare.github.io/sitemap.xml')
  expect(atRoot).not.toContain('origin root, so the directives')

  // Under a mount the file is written but cannot govern anything, and says so
  // rather than implying the mount is covered.
  const mounted = buildRobots({ siteRoot: 'https://w3c-cg.github.io/sstim', base: '/sstim' })
  expect(mounted).toContain('Sitemap: https://w3c-cg.github.io/sstim/sitemap.xml')
  expect(mounted).toContain('origin root')
})

test('llms.txt resolves site links against the mount and repository links against the repository', () => {
  const llms = buildLlmsIndex({
    siteRoot: 'https://w3c-cg.github.io/sstim',
    repository: 'https://github.com/w3c-cg/sstim',
    facts: FACTS,
  })

  expect(llms).toContain('https://w3c-cg.github.io/sstim/ontology/manifest.json')
  expect(llms).toContain('https://github.com/w3c-cg/sstim/blob/main/docs/ontology/TERM_INDEX.md')
  expect(llms).toContain('latest citable release 9.9.8, DOI 10.5281/zenodo.1')
  // The status claim is the one thing in this file that would be a
  // misrepresentation if it drifted.
  expect(llms).toContain('not a W3C Recommendation')
})

test('every link llms.txt publishes has a file behind it', () => {
  // A machine reader following a dead link is worse than one following none, and
  // these paths are curated by hand. Site paths resolve to the build's two
  // sources — prerendered routes and static assets — because `make test` runs
  // before `make build` in CI and there is no dist to look at.
  const siteSource = (path) => {
    if (path.startsWith('/ontology/') || path.startsWith('/schemas/')) {
      return [resolve(ROOT, `static${path.replace(/\/$/, '')}`)]
    }
    const route = path === '/' ? 'src/routes' : `src/routes${path.replace(/\/$/, '')}`
    return [resolve(ROOT, route, '+page.svelte'), resolve(ROOT, `static${path}index.html`)]
  }

  for (const section of LLMS_SECTIONS) {
    for (const [label, ref] of section.links) {
      const candidates = ref.site ? siteSource(ref.site) : [resolve(ROOT, ref.repo)]
      expect(candidates.some((candidate) => existsSync(candidate)), `${label} → ${JSON.stringify(ref)}`).toBe(true)
    }
  }
})

test('every document llms-full.txt inlines exists', () => {
  for (const path of LLMS_FULL_DOCUMENTS) {
    expect(existsSync(resolve(ROOT, path)), path).toBe(true)
  }
})
