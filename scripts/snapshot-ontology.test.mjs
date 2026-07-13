import { describe, expect, it } from 'vitest'
import { releaseProblems } from './snapshot-ontology.mjs'

// Release-readiness dry-run checks (improvement plan 0.3, Gate P0-C; audit
// finding KR-14): a snapshot must be refused for development versions,
// diverging module versions, or missing release metadata.

const MODULE_FILES = [
  'sstim-core.ttl', 'sstim-vocab.ttl', 'sstim-shapes.ttl',
  'sstim-alignments.ttl', 'sstim-patch-studio.ttl', 'sstim-exposure.ttl',
  'sstim-ecosystem.ttl',
]

function releaseSet(version = '0.7.0', overrides = {}) {
  const files = new Map()
  for (const file of MODULE_FILES) {
    const core = file === 'sstim-core.ttl'
      ? `<https://w3id.org/sstim> a owl:Ontology ;
    owl:versionIRI <https://w3id.org/sstim/${version}> ;
    owl:versionInfo "${version}" ;
    mod:status "released"@en .`
      : `<https://w3id.org/sstim/x> a owl:Ontology ;
    owl:versionInfo "${version}" .`
    files.set(file, overrides[file] ?? core)
  }
  return files
}

describe('snapshot release-readiness (KR-14)', () => {
  it('accepts a coherent release set', () => {
    expect(releaseProblems({ version: '0.7.0', files: releaseSet('0.7.0') })).toEqual([])
  })

  it('rejects development and prerelease versions', () => {
    const problems = releaseProblems({ version: '0.7.0-dev', files: releaseSet('0.7.0-dev') })
    expect(problems.some((p) => p.includes('development/prerelease'))).toBe(true)
  })

  it('rejects a module whose version diverges from the set', () => {
    const files = releaseSet('0.7.0', {
      'sstim-vocab.ttl': '<https://w3id.org/sstim/vocab> a owl:Ontology ;\n    owl:versionInfo "0.6.0" .',
    })
    const problems = releaseProblems({ version: '0.7.0', files })
    expect(problems).toEqual(['sstim-vocab.ttl: owl:versionInfo "0.6.0" does not match snapshot version "0.7.0"'])
  })

  it('rejects a missing module file or versionInfo', () => {
    const files = releaseSet('0.7.0')
    files.delete('sstim-ecosystem.ttl')
    files.set('sstim-shapes.ttl', '<https://w3id.org/sstim/shapes> a owl:Ontology .')
    const problems = releaseProblems({ version: '0.7.0', files })
    expect(problems).toContain('sstim-ecosystem.ttl: module file is missing')
    expect(problems).toContain('sstim-shapes.ttl: missing owl:versionInfo')
  })

  it('requires the core versionIRI and released status', () => {
    const files = releaseSet('0.7.0', {
      'sstim-core.ttl': `<https://w3id.org/sstim> a owl:Ontology ;
    owl:versionInfo "0.7.0" ;
    mod:status "under development"@en .`,
    })
    const problems = releaseProblems({ version: '0.7.0', files })
    expect(problems).toContain('sstim-core.ttl: missing owl:versionIRI <https://w3id.org/sstim/0.7.0>')
    expect(problems).toContain('sstim-core.ttl: mod:status must be "released" at snapshot time')
  })

  it('flags the current live tree as not release-ready (it is a -dev line)', async () => {
    const { readFileSync } = await import('node:fs')
    const files = new Map(MODULE_FILES.map((f) => [f, readFileSync(new URL(`../static/ontology/${f}`, import.meta.url), 'utf8')]))
    const version = files.get('sstim-core.ttl').match(/owl:versionInfo\s+"([^"]+)"/)[1]
    if (version.includes('-')) {
      expect(releaseProblems({ version, files }).length).toBeGreaterThan(0)
    } else {
      expect(releaseProblems({ version, files })).toEqual([])
    }
  })
})
