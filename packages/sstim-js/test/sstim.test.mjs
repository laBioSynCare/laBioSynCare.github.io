import { describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DataFactory, Parser, Store } from 'n3'

import {
  Closure, SstimError, resolveProfile, validate
} from '../src/index.js'

// Offline by design. Everything resolves against the frozen 0.17.0 manifest and
// the live manifest in this repository, so a failure always means the code and
// never the network.
const ROOT = new URL('../../../', import.meta.url)
const FROZEN = new URL('static/ontology/0.17.0/manifest.json', ROOT).pathname
const LIVE = new URL('static/ontology/manifest.json', ROOT).pathname
const example = (name) => new URL(`examples/${name}`, ROOT).pathname

describe('resolving a profile', () => {
  it('resolves every profile from a frozen manifest', async () => {
    for (const name of ['kernel', 'core', 'core-plus', 'full']) {
      const closure = await resolveProfile(name, { manifest: FROZEN })
      expect(closure.profile).toBe(name)
      expect(closure.version).toBe('0.17.0')
      expect(closure.status).toBe('released')
      expect(closure.isDevelopment).toBe(false)
      expect(closure.semanticModules.length).toBeGreaterThan(0)
    }
  })

  it('nests: kernel inside core inside core-plus inside full', async () => {
    const ids = {}
    for (const name of ['kernel', 'core', 'core-plus', 'full']) {
      const closure = await resolveProfile(name, { manifest: FROZEN })
      ids[name] = new Set(closure.semanticModules.map(m => m.id))
    }
    const subset = (a, b) => [...a].every(x => b.has(x)) && a.size < b.size
    expect(subset(ids.kernel, ids.core)).toBe(true)
    expect(subset(ids.core, ids['core-plus'])).toBe(true)
    expect(subset(ids['core-plus'], ids.full)).toBe(true)
  })

  it('kernel publishes no shapes', async () => {
    // ADR 0045: a discovery entry point, not a validation contract.
    const closure = await resolveProfile('kernel', { manifest: FROZEN })
    expect(closure.shapeModules).toEqual([])
  })

  it('names the real profiles when asked for one that does not exist', async () => {
    await expect(resolveProfile('enormous', { manifest: FROZEN }))
      .rejects.toThrow(/core-plus/)
  })

  it('sees the live manifest as a development line', async () => {
    // The guard that stops an unpinned publish. If this ever fails because the
    // live line was released in place, the default resolution path needs
    // rethinking, not this assertion deleting.
    //
    // One window is legitimate and designed: between release-prepare and
    // release-open-dev the live line *is* the release being frozen, and says
    // so. 0.18.0 was the first release this test met, and it failed there.
    // What tells that window apart from a line released in place is what
    // release-prepare writes: an immutable release record naming its own
    // version, and a versioned URL under it on every module. A line merely
    // flipped to "released" carries neither, so it still fails here.
    const closure = await resolveProfile('core', { manifest: LIVE })
    if (closure.isDevelopment) return
    const manifest = JSON.parse(readFileSync(LIVE, 'utf8'))
    const base = manifest.immutableRelease?.baseUrl
    expect(base).toBe(`${closure.versionIri}/`)
    for (const module of manifest.modules) {
      expect((module.publication?.versionedUrl ?? '').startsWith(base), module.id).toBe(true)
    }
  })

  it('reports the citable version IRI', async () => {
    const closure = await resolveProfile('core', { manifest: FROZEN })
    expect(closure.versionIri).toBe('https://w3id.org/sstim/0.17.0')
  })
})

describe('integrity', () => {
  it('refuses to fetch in offline mode rather than reaching the network', async () => {
    const closure = new Closure({
      profile: 'core',
      version: '0.17.0',
      status: 'released',
      source: 'test',
      modules: [{ id: 'x', url: 'https://example.invalid/x.ttl', sha256: '0'.repeat(64), isShapes: false }]
    })
    await expect(closure.read({ offline: true })).rejects.toThrow(SstimError)
  })
})

describe('offline', () => {
  // A run pinned to a release works with no network once that release is
  // cached: modules by checksum, and the frozen manifest by version, since a
  // released manifest never changes. Primed from this checkout's frozen 0.18.0
  // directory, whose files hash to what its manifest says.
  const withCache = async (prime, body) => {
    const dir = mkdtempSync(join(tmpdir(), 'sstim-cache-'))
    const previous = process.env.XDG_CACHE_HOME
    process.env.XDG_CACHE_HOME = dir
    try {
      if (prime) {
        const frozen = new URL('static/ontology/0.18.0/', ROOT)
        const document = JSON.parse(readFileSync(new URL('manifest.json', frozen), 'utf8'))
        const base = join(dir, 'sstim')
        mkdirSync(join(base, 'manifests'), { recursive: true })
        writeFileSync(join(base, 'manifests', '0.18.0.json'), JSON.stringify(document))
        for (const module of document.modules) {
          const sha = module.source.sha256
          mkdirSync(join(base, sha.slice(0, 2)), { recursive: true })
          writeFileSync(join(base, sha.slice(0, 2), sha), readFileSync(new URL(module.runtime.url, frozen)))
        }
      }
      await body()
    } finally {
      if (previous === undefined) delete process.env.XDG_CACHE_HOME
      else process.env.XDG_CACHE_HOME = previous
      rmSync(dir, { recursive: true, force: true })
    }
  }

  it('says how to fix an unpinned offline run', () => withCache(false, async () => {
    await expect(resolveProfile('core', { offline: true })).rejects.toThrow('Pass a version')
  }))

  it('refuses to fetch a pinned release that is not cached', () => withCache(false, async () => {
    await expect(resolveProfile('core', { version: '0.18.0', offline: true })).rejects.toThrow('not cached')
  }))

  it('validates against a pinned, cached release with no network', () => withCache(true, async () => {
    const report = await validate(example('04-session-full.ttl'), { profile: 'full', version: '0.18.0', offline: true })
    expect(report.ok, String(report)).toBe(true)
    expect(report.versionIri).toBe('https://w3id.org/sstim/0.18.0')
  }))
})

describe('validating', () => {
  const cases = [
    ['01-stimulus-core.ttl', 'core'],
    ['02-stimulus-core-plus.ttl', 'core-plus'],
    ['03-protocol-full.ttl', 'full'],
    ['04-session-full.ttl', 'full']
  ]

  it.each(cases)('%s passes its own profile (%s)', async (file, profile) => {
    const report = await validate(example(file), { profile, manifest: FROZEN })
    expect(report.ok, String(report)).toBe(true)
  })

  it('fails conformance when the regime is missing', async () => {
    const report = await validate(`
      @prefix ex: <https://example.org/s/> .
      @prefix sstim: <https://w3id.org/sstim#> .
      @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
      ex:s a sstim:StimulusSpecification ; rdfs:label "no regime"@en .
    `, { profile: 'core', manifest: FROZEN })
    expect(report.conforms).toBe(false)
    expect(report.ok).toBe(false)
  })

  it('catches a Core Plus term used in a Core file, which SHACL cannot', async () => {
    const turtle = `
      @prefix ex: <https://example.org/s/> .
      @prefix sstim: <https://w3id.org/sstim#> .
      @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
      ex:s a sstim:StimulusSpecification ;
        rdfs:label "claims core"@en ;
        sstim:stimulusRegime "determinate" ;
        sstim:hasSignal ex:sig .
      ex:sig a sstim:StimulationSignal ; sstim:hzMin 10.0 .
    `
    const core = await validate(turtle, { profile: 'core', manifest: FROZEN })
    expect(core.conforms, 'shapes alone do not catch this').toBe(true)
    expect(core.undefined).toContain('https://w3id.org/sstim#hzMin')
    expect(core.ok).toBe(false)

    const wider = await validate(turtle, { profile: 'core-plus', manifest: FROZEN })
    expect(wider.ok, String(wider)).toBe(true)
  })

  it('refuses a file that mints in the SSTIM namespace', async () => {
    const report = await validate(`
      @prefix sstim: <https://w3id.org/sstim#> .
      @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
      <https://w3id.org/sstim#MyClass> a sstim:StimulusSpecification ;
        rdfs:label "mine now"@en ;
        sstim:stimulusRegime "determinate" .
    `, { profile: 'core', manifest: FROZEN })
    expect(report.minted).toEqual(['https://w3id.org/sstim#MyClass'])
    expect(report.ok).toBe(false)
  })
})

describe('the SPARQL-constraint limitation is reported, not hidden', () => {
  // This is the one place the JavaScript client is weaker than the Python one,
  // so it is pinned in both directions: silent equivalence where the shapes
  // carry no sh:sparql, and a loud PARTIAL where they do.
  it('is complete for core and core-plus, whose shapes carry none', async () => {
    for (const profile of ['core', 'core-plus']) {
      const report = await validate(example('01-stimulus-core.ttl'), { profile, manifest: FROZEN })
      expect(report.unevaluated).toBe(0)
      expect(report.partial).toBe(false)
    }
  })

  it('is partial for full, and says how many constraints it skipped', async () => {
    const report = await validate(example('04-session-full.ttl'), { profile: 'full', manifest: FROZEN })
    expect(report.partial).toBe(true)
    expect(report.unevaluated).toBeGreaterThan(0)
    expect(String(report)).toMatch(/PARTIAL/)
    expect(String(report)).toMatch(/pip install sstim/)
  })

  it('counts exactly the sh:sparql constraints the shape module carries', async () => {
    // Counted by parsing, not by grepping: three of the mentions in that file
    // are inside comments, and a text count reports 71 where the graph has 69.
    const shapes = new Store(new Parser().parse(
      readFileSync(new URL('static/ontology/0.17.0/sstim-shapes.ttl', ROOT), 'utf8')
    ))
    const inGraph = shapes.getQuads(
      null, DataFactory.namedNode('http://www.w3.org/ns/shacl#sparql'), null, null
    ).length
    const report = await validate(example('03-protocol-full.ttl'), { profile: 'full', manifest: FROZEN })
    expect(inGraph).toBeGreaterThan(0)
    expect(report.unevaluated).toBe(inGraph)
  })
})

describe('the command line', () => {
  it('exits 0 on a good file and 2 on a bad profile', async () => {
    const { main } = await import('../src/cli.js')
    expect(await main(['validate', example('01-stimulus-core.ttl'),
      '--profile', 'core', '--manifest', FROZEN])).toBe(0)
    expect(await main(['modules', '--profile', 'nonsense', '--manifest', FROZEN])).toBe(2)
  })

  it('declares its bin in the form npm keeps at publish', () => {
    // npm 11.20 drops a bin written "./src/cli.js" when publishing ("script
    // name src/cli.js was invalid and removed") and ships the package without
    // its command. Only `npm publish --dry-run` shows it; no unit test runs
    // npm's own normalization. Caught on 2026-09-28, before 0.2.0 went out.
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
    for (const target of Object.values(pkg.bin)) expect(target.startsWith('./'), target).toBe(false)
  })

  it('runs when invoked through a symlink, as an installed bin is', () => {
    // 0.1.0 shipped a CLI that did nothing once installed. npm links a bin
    // (node_modules/.bin/sstim -> ../@sstim/core/src/cli.js), so process.argv[1]
    // is the link while import.meta.url is the resolved target, and the
    // entry-point check compared the two directly. Calling main() from a test
    // cannot see that, and neither can running the file from a checkout: it
    // only appears through a link. So this reproduces the link.
    const dir = mkdtempSync(join(tmpdir(), 'sstim-bin-'))
    const link = join(dir, 'sstim')
    try {
      symlinkSync(new URL('../src/cli.js', import.meta.url).pathname, link)
      const run = spawnSync(process.execPath, [
        link, 'validate', example('01-stimulus-core.ttl'),
        '--profile', 'core', '--manifest', FROZEN
      ], { encoding: 'utf8' })
      expect(run.stdout, 'the CLI produced no output through a symlink').toMatch(/SHACL conformance/)
      expect(run.status).toBe(0)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
