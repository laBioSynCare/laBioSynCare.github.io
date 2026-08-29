import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, expect, test } from 'vitest'

import {
  declaredRelease,
  publishLatest,
  releaseDirectories,
  verifyLatest,
} from './publish-latest-ontology.mjs'

// What these guard: `https://w3id.org/sstim` hands an RDF client whatever sits
// at latest/, so every way that path can be wrong is a way the ontology IRI can
// misrepresent SSTIM. ADR 0055.

const temporaries = []
afterEach(() => {
  while (temporaries.length) rmSync(temporaries.pop(), { recursive: true, force: true })
})

function scratch() {
  const dir = mkdtempSync(join(tmpdir(), 'sstim-latest-'))
  temporaries.push(dir)
  return dir
}

/** A miniature ontology directory: two releases, the newer one modular. */
function fixture({ newest = '0.16.0', withManifest = true } = {}) {
  const dir = scratch()
  mkdirSync(join(dir, '0.15.0'), { recursive: true })
  writeFileSync(join(dir, '0.15.0', 'manifest.json'), '{}')
  writeFileSync(join(dir, '0.15.0', 'sstim-core.ttl'), '# 0.15.0\n')
  mkdirSync(join(dir, newest), { recursive: true })
  if (withManifest) writeFileSync(join(dir, newest, 'manifest.json'), '{}')
  writeFileSync(join(dir, newest, 'sstim-core.ttl'), `# ${newest}\n`)
  return dir
}

function metadata(version) {
  const dir = scratch()
  const file = join(dir, 'releaseMetadata.js')
  writeFileSync(file, `export const RELEASE_VERSION = '${version}'\n`)
  return file
}

test('releases sort by version, not by string', () => {
  const dir = scratch()
  for (const name of ['0.9.0', '0.10.0', '0.2.0', 'latest', 'instances']) {
    mkdirSync(join(dir, name), { recursive: true })
  }
  // '0.9.0' > '0.10.0' lexically, which is the bug this exists to prevent.
  expect(releaseDirectories(dir)[0]).toBe('0.10.0')
  expect(releaseDirectories(dir)).not.toContain('latest')
  expect(releaseDirectories(dir)).not.toContain('instances')
})

test('the newest release is published to latest/', () => {
  const ontologyDir = fixture()
  const distOntologyDir = scratch()
  const result = publishLatest({
    ontologyDir,
    distOntologyDir,
    metadataPath: metadata('0.16.0'),
  })
  expect(result.version).toBe('0.16.0')
  expect(readdirSync(join(distOntologyDir, 'latest'))).toContain('sstim-core.ttl')
})

test('a snapshot the application does not claim is refused', () => {
  // The failure this catches is a release that froze 0.17.0 and forgot to bump
  // releaseMetadata.js, or the reverse. Either way the ontology IRI and the site
  // would disagree about what SSTIM currently is, silently.
  expect(() => publishLatest({
    ontologyDir: fixture({ newest: '0.17.0' }),
    distOntologyDir: scratch(),
    metadataPath: metadata('0.16.0'),
  })).toThrow(/newest snapshot is 0\.17\.0 but the application declares 0\.16\.0/)
})

test('a pre-modular snapshot cannot become latest/', () => {
  expect(() => publishLatest({
    ontologyDir: fixture({ newest: '0.16.0', withManifest: false }),
    distOntologyDir: scratch(),
    metadataPath: metadata('0.16.0'),
  })).toThrow(/no manifest\.json/)
})

test('publishing over a previous latest/ leaves nothing behind', () => {
  const ontologyDir = fixture()
  const distOntologyDir = scratch()
  const stale = join(distOntologyDir, 'latest')
  mkdirSync(stale, { recursive: true })
  writeFileSync(join(stale, 'sstim-retired.ttl'), '# from an older release\n')
  publishLatest({ ontologyDir, distOntologyDir, metadataPath: metadata('0.16.0') })
  expect(readdirSync(stale)).not.toContain('sstim-retired.ttl')
})

test('verification catches Turtle that changed on the way through', () => {
  // The export step regenerates the namespace catalogues as it passes. Today its
  // concatenation and `make snapshot`'s agree byte for byte; this is what says so
  // for every future build rather than for the one that was measured.
  const ontologyDir = fixture()
  const distOntologyDir = scratch()
  const metadataPath = metadata('0.16.0')
  publishLatest({ ontologyDir, distOntologyDir, metadataPath })
  expect(() => verifyLatest({ ontologyDir, distOntologyDir, metadataPath })).not.toThrow()

  writeFileSync(join(distOntologyDir, 'latest', 'sstim-core.ttl'), '# rewritten\n')
  expect(() => verifyLatest({ ontologyDir, distOntologyDir, metadataPath }))
    .toThrow(/differ from the frozen 0\.16\.0 snapshot/)
})

test('the repository publishes the release it declares', () => {
  // Not a fixture: the real tree, so a release that updates one and not the
  // other fails here rather than in the deployment.
  expect(releaseDirectories()[0]).toBe(declaredRelease())
})
