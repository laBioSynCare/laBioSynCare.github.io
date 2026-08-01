import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  ONTOLOGY_FILES,
  dirtyOntologyFiles,
  immutableImportProblems,
  ontologyHeader,
  releaseProblems,
  todayIso,
  writeSnapshotArtifacts,
} from './snapshot-ontology.mjs'

// Release-readiness dry-run checks (improvement plan 0.3, Gate P0-C; audit
// finding KR-14): a snapshot must be refused for development versions,
// diverging module versions, or missing release metadata — including release
// dates, which registries (BioPortal "Released", Archivo, OLS) read off
// dct:issued.

// Imported, not restated. A private copy silently diverged when
// sstim-stimulus.ttl was added (ADR 0042): the fixture stopped building a
// complete release set, so "accepts a coherent release set" failed for a reason
// that had nothing to do with coherence. Sharing the list means adding a module
// updates the fixture automatically.
const MODULE_FILES = ONTOLOGY_FILES

const RELEASE_DATE = '2026-07-15'

function dates(releaseDate = RELEASE_DATE) {
  return `    dct:created "2026-04-12"^^xsd:date ;
    dct:issued "${releaseDate}"^^xsd:date ;
    dct:modified "${releaseDate}"^^xsd:date ;`
}

function releaseSet(version = '0.7.0', overrides = {}, releaseDate = RELEASE_DATE) {
  const files = new Map()
  for (const file of MODULE_FILES) {
    const core = file === 'sstim-core.ttl'
      ? `<https://w3id.org/sstim> a owl:Ontology ;
    owl:versionIRI <https://w3id.org/sstim/${version}> ;
    owl:versionInfo "${version}" ;
${dates(releaseDate)}
    mod:status "released"@en .`
      : `<https://w3id.org/sstim/x> a owl:Ontology ;
    owl:versionInfo "${version}" ;
${dates(releaseDate)}
    dct:isPartOf <https://w3id.org/sstim> .`
    files.set(file, overrides[file] ?? core)
  }
  return files
}

const problemsFor = (version, files, releaseDate = RELEASE_DATE) =>
  releaseProblems({ version, files, releaseDate })

describe('snapshot release-readiness (KR-14)', () => {
  it('accepts a coherent release set', () => {
    expect(problemsFor('0.7.0', releaseSet('0.7.0'))).toEqual([])
  })

  it('rejects development and prerelease versions', () => {
    const problems = problemsFor('0.7.0-dev', releaseSet('0.7.0-dev'))
    expect(problems.some((p) => p.includes('development/prerelease'))).toBe(true)
  })

  it('rejects a module whose version diverges from the set', () => {
    const files = releaseSet('0.7.0', {
      'sstim-vocab.ttl': `<https://w3id.org/sstim/vocab> a owl:Ontology ;
    owl:versionInfo "0.6.0" ;
${dates()}
    dct:isPartOf <https://w3id.org/sstim> .`,
    })
    const problems = problemsFor('0.7.0', files)
    expect(problems).toEqual(['sstim-vocab.ttl: owl:versionInfo "0.6.0" does not match snapshot version "0.7.0"'])
  })

  it('rejects a missing module file or versionInfo', () => {
    const files = releaseSet('0.7.0')
    files.delete('sstim-ecosystem.ttl')
    files.set('sstim-shapes.ttl', '<https://w3id.org/sstim/shapes> a owl:Ontology .')
    const problems = problemsFor('0.7.0', files)
    expect(problems).toContain('sstim-ecosystem.ttl: module file is missing')
    expect(problems).toContain('sstim-shapes.ttl: missing owl:versionInfo')
  })

  it('requires the core versionIRI and released status', () => {
    const files = releaseSet('0.7.0', {
      'sstim-core.ttl': `<https://w3id.org/sstim> a owl:Ontology ;
    owl:versionInfo "0.7.0" ;
${dates()}
    mod:status "under development"@en .`,
    })
    const problems = problemsFor('0.7.0', files)
    expect(problems).toContain('sstim-core.ttl: missing owl:versionIRI <https://w3id.org/sstim/0.7.0>')
    expect(problems).toContain('sstim-core.ttl: mod:status must be "released" at snapshot time')
  })
})

// Release dates. A stale dct:issued is invisible in the repo but surfaces in
// every registry: BioPortal showed all eight SSTIM submissions as "Released
// 04/12/2026", the ontology's first issue date, because dct:issued had never
// been bumped past it.
describe('release dates', () => {
  it('rejects a dct:issued left at a previous release date', () => {
    const files = releaseSet('0.7.0', {
      'sstim-core.ttl': `<https://w3id.org/sstim> a owl:Ontology ;
    owl:versionIRI <https://w3id.org/sstim/0.7.0> ;
    owl:versionInfo "0.7.0" ;
    dct:created "2026-04-12"^^xsd:date ;
    dct:issued "2026-04-12"^^xsd:date ;
    dct:modified "${RELEASE_DATE}"^^xsd:date ;
    mod:status "released"@en .`,
    })
    const problems = problemsFor('0.7.0', files)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('sstim-core.ttl: dct:issued "2026-04-12" is not the release date "2026-07-15"')
  })

  it('rejects a dct:modified that did not move with the release', () => {
    const files = releaseSet('0.7.0', {
      'sstim-exposure.ttl': `<https://w3id.org/sstim/exposure> a owl:Ontology ;
    owl:versionInfo "0.7.0" ;
    dct:created "2026-06-18"^^xsd:date ;
    dct:issued "${RELEASE_DATE}"^^xsd:date ;
    dct:modified "2026-07-10"^^xsd:date .`,
    })
    expect(problemsFor('0.7.0', files))
      .toEqual(['sstim-exposure.ttl: dct:modified "2026-07-10" is not the release date "2026-07-15"'])
  })

  it('rejects a module with no dct:issued at all', () => {
    const files = releaseSet('0.7.0', {
      'sstim-vocab.ttl': `<https://w3id.org/sstim/vocab> a owl:Ontology ;
    owl:versionInfo "0.7.0" ;
    dct:modified "${RELEASE_DATE}"^^xsd:date .`,
    })
    expect(problemsFor('0.7.0', files))
      .toEqual([`sstim-vocab.ttl: missing dct:issued "${RELEASE_DATE}"^^xsd:date in the ontology header`])
  })

  it('rejects a dct:created after the release date', () => {
    const files = releaseSet('0.7.0', {
      'sstim-ecosystem.ttl': `<https://w3id.org/sstim/ecosystem> a owl:Ontology ;
    owl:versionInfo "0.7.0" ;
    dct:created "2026-08-01"^^xsd:date ;
    dct:issued "${RELEASE_DATE}"^^xsd:date ;
    dct:modified "${RELEASE_DATE}"^^xsd:date .`,
    })
    expect(problemsFor('0.7.0', files))
      .toEqual(['sstim-ecosystem.ttl: dct:created "2026-08-01" is later than the release date "2026-07-15"'])
  })

  it('reads only the ontology header, not a dct:issued further down the file', () => {
    const files = releaseSet('0.7.0', {
      'sstim-shapes.ttl': `<https://w3id.org/sstim/shapes> a owl:Ontology ;
    owl:versionInfo "0.7.0" ;
    skos:historyNote "0.7.0 lands. Sentences. With dots."@en ;
${dates()}
    dct:isPartOf <https://w3id.org/sstim> .

sstim-sh:ModuleShape a sh:NodeShape ;
    sh:property [ sh:path dct:issued ; sh:datatype xsd:date ] .

sstim-sh:ref dct:issued "1999-01-01"^^xsd:date .`,
    })
    expect(problemsFor('0.7.0', files)).toEqual([])
  })

  it('defaults the release date to today in local time', () => {
    expect(todayIso(new Date(2026, 6, 27, 23, 30))).toBe('2026-07-27')
    const files = releaseSet('0.7.0', {}, todayIso())
    expect(releaseProblems({ version: '0.7.0', files })).toEqual([])
  })

  it('stops the header at its terminating dot', () => {
    const header = ontologyHeader(`@prefix dct: <http://purl.org/dc/terms/> .

<https://w3id.org/sstim> a owl:Ontology ;
    dct:issued "2026-07-15"^^xsd:date .

sstim:Thing a owl:Class ;
    dct:issued "1999-01-01"^^xsd:date .`)
    expect(header).toContain('2026-07-15')
    expect(header).not.toContain('1999-01-01')
  })
})

describe('the live ontology tree', () => {
  it('is release-coherent as a whole set, including manifest-owned imports', () => {
    const files = new Map(MODULE_FILES.map((f) => [f, readFileSync(new URL(`../static/ontology/${f}`, import.meta.url), 'utf8')]))
    const manifest = JSON.parse(
      readFileSync(new URL('../static/ontology/manifest.json', import.meta.url), 'utf8'),
    )
    const core = files.get('sstim-core.ttl')
    const version = core.match(/owl:versionInfo\s+"([^"]+)"/)[1]
    // The tree's own declared release date, not today: a published version
    // keeps its release date as the working tree moves on.
    const releaseDate = ontologyHeader(core).match(/dct:issued\s+"(\d{4}-\d{2}-\d{2})"/)[1]
    if (version.includes('-')) {
      expect(releaseProblems({ version, files, releaseDate, manifest }).length).toBeGreaterThan(0)
    } else {
      expect(releaseProblems({ version, files, releaseDate, manifest })).toEqual([])
    }
  })
})

describe('immutable modular profile closures', () => {
  const version = '0.13.0'
  const manifest = {
    modules: [
      { id: 'core', source: { path: 'static/ontology/sstim-core.ttl' } },
      { id: 'stimulus', source: { path: 'static/ontology/sstim-stimulus.ttl' } },
    ],
    profiles: [
      {
        id: 'core',
        modules: ['core', 'stimulus'],
        source: { path: 'static/ontology/sstim-core-profile.ttl' },
        release: { snapshot: true },
      },
    ],
  }
  const profile = (imports) => `<https://w3id.org/sstim/profile/core> a owl:Ontology ;
    owl:versionInfo "${version}" ;
    owl:imports ${imports.map((iri) => `<${iri}>`).join(', ')} ;
    dct:issued "2026-08-01"^^xsd:date .`

  it('accepts exact versioned sibling imports', () => {
    const files = new Map([[
      'sstim-core-profile.ttl',
      profile([
        `https://w3id.org/sstim/${version}/sstim-core.ttl`,
        `https://w3id.org/sstim/${version}/sstim-stimulus.ttl`,
      ]),
    ]])
    expect(immutableImportProblems({ version, files, manifest })).toEqual([])
  })

  it('accepts a complete release check only with its immutable manifest closure', () => {
    const files = releaseSet(version, {
      'sstim-core-profile.ttl': `<https://w3id.org/sstim/profile/core> a owl:Ontology ;
    owl:versionInfo "${version}" ;
    owl:imports
        <https://w3id.org/sstim/${version}/sstim-core.ttl>,
        <https://w3id.org/sstim/${version}/sstim-stimulus.ttl> ;
${dates()}
    dct:isPartOf <https://w3id.org/sstim> .`,
    })
    expect(releaseProblems({
      version,
      files,
      releaseDate: RELEASE_DATE,
      manifest,
    })).toEqual([])
  })

  it.each([
    ['unversioned', ['https://w3id.org/sstim/kernel', 'https://w3id.org/sstim/stimulus']],
    ['wrong version', ['https://w3id.org/sstim/0.12.0/sstim-core.ttl', `https://w3id.org/sstim/${version}/sstim-stimulus.ttl`]],
    ['missing', [`https://w3id.org/sstim/${version}/sstim-core.ttl`]],
    ['extra', [
      `https://w3id.org/sstim/${version}/sstim-core.ttl`,
      `https://w3id.org/sstim/${version}/sstim-stimulus.ttl`,
      `https://w3id.org/sstim/${version}/sstim-common.ttl`,
    ]],
  ])('rejects a %s import closure', (_label, imports) => {
    const files = new Map([['sstim-core-profile.ttl', profile(imports)]])
    expect(immutableImportProblems({ version, files, manifest })).toHaveLength(1)
  })
})

describe('snapshot filesystem and provenance safety', () => {
  const temporaryDirectories = []

  afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  function temporaryOntology() {
    const root = mkdtempSync(join(tmpdir(), 'sstim-snapshot-test-'))
    temporaryDirectories.push(root)
    const directory = join(root, 'ontology')
    mkdirSync(directory)
    const ontologyFiles = ['sstim-core.ttl', 'sstim-core-profile.ttl']
    const sidecars = ['manifest.json', 'manifest.schema.json']
    writeFileSync(join(directory, ontologyFiles[0]), 'core bytes\n')
    writeFileSync(join(directory, ontologyFiles[1]), 'profile bytes\n')
    writeFileSync(join(directory, sidecars[0]), '{"suite":{"version":"9.9.9"}}\n')
    writeFileSync(join(directory, sidecars[1]), '{"$id":"test"}\n')
    // A snapshot freezes a namespace catalogue per manifest namespace document,
    // built from the copied modules rather than from the live sources.
    const manifest = {
      modules: [{ id: 'core', source: { path: 'static/ontology/sstim-core.ttl' } }],
      namespaceDocuments: [{
        id: 'sstim',
        modules: ['core'],
        runtime: { turtleUrl: '/ontology/sstim-namespace.ttl' },
      }],
    }
    return { directory, ontologyFiles, sidecars, manifest }
  }

  it('copies modules, profiles, and manifest sidecars before recording checksums', () => {
    const fixture = temporaryOntology()
    let recorded = null
    const result = writeSnapshotArtifacts({
      ontologyDirectory: fixture.directory,
      version: '9.9.9',
      ontologyFiles: fixture.ontologyFiles,
      sidecars: fixture.sidecars,
      manifest: fixture.manifest,
      commit: 'abc123',
      recordChecksums: (version, outDir) => {
        recorded = { version, outDir }
        expect(readFileSync(join(outDir, 'manifest.json'), 'utf8'))
          .toBe('{"suite":{"version":"9.9.9"}}\n')
        expect(readFileSync(join(outDir, 'sstim-core-profile.ttl'), 'utf8'))
          .toBe('profile bytes\n')
      },
    })

    expect(recorded).toEqual({ version: '9.9.9', outDir: result.outDir })
    expect(result.written).toEqual([
      'README.md',
      'manifest.json',
      'manifest.schema.json',
      'sstim-core-profile.ttl',
      'sstim-core.ttl',
      'sstim-namespace.ttl',
    ])
    expect(readFileSync(join(result.outDir, 'README.md'), 'utf8')).toContain('abc123')
    // The version IRI resolves to this catalogue, so it must be built from the
    // frozen modules rather than copied from a build directory or the live tree.
    expect(readFileSync(join(result.outDir, 'sstim-namespace.ttl'), 'utf8'))
      .toBe('core bytes\n')
    expect(readFileSync(join(result.outDir, 'README.md'), 'utf8'))
      .toContain('sstim-namespace.ttl')
  })

  it('makes checksum-ledger failure fatal after copying the release set', () => {
    const fixture = temporaryOntology()
    expect(() => writeSnapshotArtifacts({
      ontologyDirectory: fixture.directory,
      version: '9.9.8',
      ontologyFiles: fixture.ontologyFiles,
      sidecars: fixture.sidecars,
      manifest: fixture.manifest,
      recordChecksums: () => {
        throw new Error('ledger unavailable')
      },
    })).toThrow(/checksum ledger recording failed.*ledger unavailable/)
  })

  it('allows force-refreshing owned files but rejects unexpected stale artifacts', () => {
    const fixture = temporaryOntology()
    const options = {
      ontologyDirectory: fixture.directory,
      version: '9.9.7',
      ontologyFiles: fixture.ontologyFiles,
      sidecars: fixture.sidecars,
      manifest: fixture.manifest,
      recordChecksums: () => {},
    }
    const first = writeSnapshotArtifacts(options)
    writeFileSync(join(fixture.directory, 'sstim-core.ttl'), 'updated core bytes\n')
    writeSnapshotArtifacts({ ...options, force: true })
    expect(readFileSync(join(first.outDir, 'sstim-core.ttl'), 'utf8'))
      .toBe('updated core bytes\n')

    writeFileSync(join(first.outDir, 'sstim-retired.ttl'), 'stale\n')
    expect(() => writeSnapshotArtifacts({ ...options, force: true }))
      .toThrow(/unexpected existing artifact\(s\): sstim-retired\.ttl/)
    expect(readFileSync(join(first.outDir, 'sstim-retired.ttl'), 'utf8')).toBe('stale\n')
  })

  it('rejects a ledger-registered version before force can overwrite it', () => {
    const fixture = temporaryOntology()
    const options = {
      ontologyDirectory: fixture.directory,
      version: '9.9.6',
      ontologyFiles: fixture.ontologyFiles,
      sidecars: fixture.sidecars,
      manifest: fixture.manifest,
      recordChecksums: () => {},
    }
    const first = writeSnapshotArtifacts(options)
    const frozenCore = readFileSync(join(first.outDir, 'sstim-core.ttl'), 'utf8')
    writeFileSync(join(fixture.directory, 'sstim-core.ttl'), 'must not replace snapshot\n')
    writeFileSync(
      join(fixture.directory, 'snapshot-checksums.json'),
      '{"9.9.6":{"sstim-core.ttl":"recorded"}}\n',
    )
    let recorderCalled = false

    expect(() => writeSnapshotArtifacts({
      ...options,
      force: true,
      recordChecksums: () => {
        recorderCalled = true
      },
    })).toThrow(/version 9\.9\.6 is already registered/)
    expect(recorderCalled).toBe(false)
    expect(readFileSync(join(first.outDir, 'sstim-core.ttl'), 'utf8')).toBe(frozenCore)
  })

  it('fails closed when git cannot verify source cleanliness', () => {
    expect(() => dirtyOntologyFiles({
      sourcePaths: ['static/ontology/sstim-core.ttl'],
      runCommand: () => {
        throw new Error('git status failed')
      },
    })).toThrow('git status failed')
  })
})
