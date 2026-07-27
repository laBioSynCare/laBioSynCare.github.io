import { describe, expect, it } from 'vitest'
import { ontologyHeader, releaseProblems, todayIso } from './snapshot-ontology.mjs'

// Release-readiness dry-run checks (improvement plan 0.3, Gate P0-C; audit
// finding KR-14): a snapshot must be refused for development versions,
// diverging module versions, or missing release metadata — including release
// dates, which registries (BioPortal "Released", Archivo, OLS) read off
// dct:issued.

const MODULE_FILES = [
  'sstim-core.ttl', 'sstim-vocab.ttl', 'sstim-shapes.ttl',
  'sstim-alignments.ttl', 'sstim-patch-studio.ttl', 'sstim-exposure.ttl',
  'sstim-ecosystem.ttl',
]

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
  it('is date-coherent as a whole set: every module agrees with core', async () => {
    const { readFileSync } = await import('node:fs')
    const files = new Map(MODULE_FILES.map((f) => [f, readFileSync(new URL(`../static/ontology/${f}`, import.meta.url), 'utf8')]))
    const core = files.get('sstim-core.ttl')
    const version = core.match(/owl:versionInfo\s+"([^"]+)"/)[1]
    // The tree's own declared release date, not today: a published version
    // keeps its release date as the working tree moves on.
    const releaseDate = ontologyHeader(core).match(/dct:issued\s+"(\d{4}-\d{2}-\d{2})"/)[1]
    if (version.includes('-')) {
      expect(releaseProblems({ version, files, releaseDate }).length).toBeGreaterThan(0)
    } else {
      expect(releaseProblems({ version, files, releaseDate })).toEqual([])
    }
  })
})
