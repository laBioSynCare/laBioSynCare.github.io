import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { buildReference, curieFor, generateConceptApi, supportedSnapshots } from './gen-concept-reference.mjs'

const core = [
  '@prefix sstim: <https://w3id.org/sstim#> .',
  '@prefix owl: <http://www.w3.org/2002/07/owl#> .',
  '@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .',
  'sstim:Stimulation a owl:Class ; rdfs:label "Stimulation"@en, "Estimulação"@pt .',
  'sstim:Old a owl:Class ; owl:deprecated true ; rdfs:subClassOf sstim:Stimulation .',
  'sstim:relatedTo a owl:ObjectProperty .',
  '<https://example.org/External> a owl:Class .',
].join('\n')
const vocab = [
  '@prefix sstim-v: <https://w3id.org/sstim/vocab#> .',
  '@prefix skos: <http://www.w3.org/2004/02/skos/core#> .',
  'sstim-v:alpha a skos:Concept ; skos:prefLabel "Alpha"@en, "Alfa"@pt ;',
  ' skos:definition "Interval."@en ; skos:broader sstim-v:all .',
].join('\n')
const alignment = [
  '@prefix sstim-v: <https://w3id.org/sstim/vocab#> .',
  '@prefix skos: <http://www.w3.org/2004/02/skos/core#> .',
  'sstim-v:alpha skos:exactMatch <http://www.wikidata.org/entity/Q123> .',
].join('\n')
const hash = (str) => createHash('sha256').update(str).digest('hex')
function fixture(version = '0.18.0') {
  const files = { core, vocab, alignments: alignment }
  const modules = Object.entries(files).map(([id, ttl]) => ({
    id, roles: ['semantic'],
    source: { path: 'static/ontology/sstim-' + id + '.ttl', sha256: hash(ttl) },
    runtime: { graphIri: 'https://w3id.org/sstim/graph/' + id },
  }))
  return { files, manifest: { suite: { status: 'released', version }, modules,
    profiles: [{ id: 'full', modules: Object.keys(files) }] } }
}
describe('SSTIM static Concept Reference API', () => {
  it('preserves CURIEs and distinguishes terms from external resources', () => {
    expect(curieFor('https://w3id.org/sstim/vocab#alpha')).toBe('sstim-v:alpha')
    const { files, manifest } = fixture()
    const { index, details } = buildReference(manifest, new Map(Object.entries(files)))
    expect(index).toHaveLength(4)
    expect(details.some(x => x.iri.includes('example.org'))).toBe(false)
    const alpha = details.find(x => x.curie === 'sstim-v:alpha')
    expect(alpha.kind).toBe('concept')
    expect(alpha.label).toBe('Alpha')
    expect(alpha.labels.some(x => x.language === 'pt' && x.value === 'Alfa')).toBe(true)
    expect(alpha.relationships.map(x => x.relation)).toEqual(['broader', 'exactMatch'])
    expect(alpha.sources.map(x => x.module)).toEqual(['vocab', 'alignments'])
    expect(details.find(x => x.curie === 'sstim:Old').deprecated).toBe(true)
    expect(details.find(x => x.curie === 'sstim:relatedTo').kind).toBe('property')
  })
  it('rejects unreleased input and tampered frozen modules', () => {
    const { files, manifest } = fixture()
    expect(() => buildReference({ ...manifest, suite: { version: '0.19.0-dev', status: 'development' } },
      new Map(Object.entries(files)))).toThrow(/frozen/)
    expect(() => buildReference(manifest, new Map([...Object.entries(files), ['core', core + ' changed']]))).toThrow(/Checksum/)
  })
  it('exports only supported frozen releases with resolvable term URLs', () => {
    const root = mkdtempSync(join(tmpdir(), 'sstim-reference-'))
    const ont = join(root, 'ontology')
    const dist = join(root, 'dist')
    mkdirSync(dist)
    for (const version of ['0.17.0', '0.18.0', '0.19.0']) {
      const dir = join(ont, version)
      mkdirSync(dir, { recursive: true })
      if (version === '0.17.0') continue
      const { files, manifest } = fixture(version)
      writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest))
      for (const [id, ttl] of Object.entries(files)) writeFileSync(join(dir, 'sstim-' + id + '.ttl'), ttl)
    }
    expect(supportedSnapshots(ont)).toEqual(['0.18.0', '0.19.0'])
    expect(generateConceptApi({ ontologyDir: ont, outputDir: dist }).map(x => x.version))
      .toEqual(['0.18.0', '0.19.0'])
    const rootApi = join(dist, 'api/v1')
    const discovery = JSON.parse(readFileSync(join(rootApi, 'index.json'), 'utf8'))
    expect(discovery.latestRelease).toBe('0.19.0')
    const catalog = JSON.parse(readFileSync(join(rootApi, 'releases/0.18.0/index.json'), 'utf8'))
    expect(catalog.release).toBe('0.18.0')
    const target = catalog.terms.find(x => x.curie === 'sstim:Stimulation')
    expect(existsSync(join(rootApi, 'releases/0.18.0', target.path))).toBe(true)
    const detail = JSON.parse(readFileSync(join(rootApi, 'releases/0.18.0', target.path), 'utf8'))
    expect(detail.sources[0].source).toBe('ontology/0.18.0/sstim-core.ttl')
  })
})
