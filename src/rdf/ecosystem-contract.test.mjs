import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'
import { DataFactory, Parser, Store } from 'n3'
import SHACLValidator from 'rdf-validate-shacl'
import {
  INSTANCE_SOURCES,
  INSTANCE_URLS,
  instanceSources,
  instanceUrls,
  parseIntoStore,
} from './loader.js'
import {
  ECOSYSTEM_AGENTS_GRAPH_IRI,
  ECOSYSTEM_FIXTURE_GRAPH_IRI,
} from './namespaces.js'

// Runtime half of the ADR 0031 synthetic contract. Full SHACL-SPARQL,
// adversarial overlays, JSON-LD isomorphism, and local-IRI checks live in
// scripts/sstim-ecosystem-contract.py. This suite pins the browser loader's
// source manifest, named-graph isolation, core SHACL profile, and exact
// relationship bindings using the same N3 representation as the application.

const { defaultGraph, namedNode, quad } = DataFactory
const REPOSITORY_ROOT = new URL('../../', import.meta.url)
const ONTOLOGY_DIR = new URL('static/ontology/', REPOSITORY_ROOT)
const manifest = JSON.parse(readFileSync(new URL('static/ontology/manifest.json', REPOSITORY_ROOT), 'utf8'))
const moduleById = new Map(manifest.modules.map(module => [module.id, module]))
const fullProfile = manifest.profiles.find(profile => profile.id === 'full')
const FIXTURE_URL = '/ontology/instances/ecosystem/fixtures/synthetic-ecosystem.ttl'
const PUBLIC_URL = 'https://biosyncare-lab.web.app/current.ttl'
const FIXTURE_FILE = 'instances/ecosystem/fixtures/synthetic-ecosystem.ttl'
const GRAPH_IRI = 'https://w3id.org/sstim/graph/ecosystem-fixture'
const REAL_GRAPH_IRI = 'https://w3id.org/sstim/graph/ecosystem-agents'
const TERM_GRAPH_IRI = 'https://w3id.org/sstim/graph/ecosystem'
const SH_SPARQL = namedNode('http://www.w3.org/ns/shacl#sparql')
const RDF_TYPE = namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')

const ECO = 'https://w3id.org/sstim/ecosystem#'
const PERSON = 'https://w3id.org/sstim/specialist/synthetic-alex-rivera'
const AURORA = 'https://w3id.org/sstim/organization/synthetic-aurora-lab'
const RESONANCE = 'https://w3id.org/sstim/organization/synthetic-resonance-coop'
const IMPLEMENTATION = 'https://w3id.org/sstim/implementation/bsclab/synthetic-ecosystem-player'
const RECORD = 'https://w3id.org/sstim/ecosystem-record/relationship/'

const parseFile = file => new Parser().parse(
  readFileSync(new URL(file, ONTOLOGY_DIR), 'utf8'),
)

const expectedRelationships = new Map([
  [`${RECORD}synthetic-alex-membership-aurora`, [
    PERSON, AURORA, `${ECO}organizationMember`, `${ECO}purposePublicDiscovery`,
    'https://example.org/sources/aurora-membership',
  ]],
  [`${RECORD}synthetic-alex-membership-resonance`, [
    PERSON, RESONANCE, `${ECO}organizationMember`, `${ECO}purposePublicDiscovery`,
    'https://example.org/sources/resonance-membership',
  ]],
  [`${RECORD}synthetic-alex-attribution-player`, [
    PERSON, IMPLEMENTATION, `${ECO}contributor`, `${ECO}purposePublicAttribution`,
    'https://example.org/sources/player-contribution',
  ]],
  [`${RECORD}synthetic-alex-outreach-resonance`, [
    PERSON, RESONANCE, `${ECO}researchCollaborator`, `${ECO}purposeOutreach`,
    'https://example.org/sources/resonance-outreach',
  ]],
  [`${RECORD}synthetic-aurora-develops-player`, [
    AURORA, IMPLEMENTATION, `${ECO}implementationDeveloper`, `${ECO}purposeLivePublication`,
    'https://example.org/sources/aurora-player-responsibility',
  ]],
  [`${RECORD}synthetic-resonance-provides-player`, [
    RESONANCE, IMPLEMENTATION, `${ECO}implementationProvider`, `${ECO}purposeLivePublication`,
    'https://example.org/sources/resonance-player-responsibility',
  ]],
])

let fixtureQuads
let namedStore
let graph
let validator

function objectValues(subject, predicate) {
  return graph
    .getObjects(namedNode(subject), namedNode(predicate), namedNode(GRAPH_IRI))
    .map(term => term.value)
    .sort()
}

beforeAll(async () => {
  const fixtureText = readFileSync(new URL(FIXTURE_FILE, ONTOLOGY_DIR), 'utf8')
  fixtureQuads = new Parser().parse(fixtureText)
  namedStore = await parseIntoStore(fixtureText, 'text/turtle', GRAPH_IRI)
  graph = namedStore

  const shapes = new Store(parseFile('sstim-shapes.ttl'))
  // rdf-validate-shacl does not implement SPARQLConstraintComponent. The
  // Python contract runs the unmodified shapes with pinned pySHACL.
  for (const q of shapes.getQuads(null, SH_SPARQL, null, null)) shapes.delete(q)
  validator = new SHACLValidator(shapes)
})

describe('synthetic ecosystem loader contract', () => {
  it('manifests the fixture exactly once in its dedicated graph family', () => {
    expect(INSTANCE_URLS.ecosystem).toEqual([PUBLIC_URL])
    expect(INSTANCE_SOURCES.ecosystem).toEqual([{
      url: PUBLIC_URL,
      graph: REAL_GRAPH_IRI,
      external: true,
      optional: true,
    }])
    expect(INSTANCE_URLS.ecosystemFixtures).toEqual([FIXTURE_URL])
    expect(INSTANCE_SOURCES.ecosystemFixtures).toEqual([{
      url: FIXTURE_URL,
      graph: GRAPH_IRI,
    }])
    expect(instanceUrls().filter(url => url === FIXTURE_URL)).toHaveLength(1)
    expect(instanceUrls().filter(url => url === PUBLIC_URL)).toHaveLength(1)
    expect(instanceSources().filter(source => source.url === FIXTURE_URL)).toHaveLength(1)
    expect(instanceSources().filter(source => source.url === PUBLIC_URL)).toHaveLength(1)
    expect(ECOSYSTEM_AGENTS_GRAPH_IRI.value).toBe(REAL_GRAPH_IRI)
    expect(ECOSYSTEM_FIXTURE_GRAPH_IRI.value).toBe(GRAPH_IRI)
  })

  it('places every fixture quad in the instance graph and none in default/term graphs', () => {
    expect(namedStore.size).toBe(fixtureQuads.length)
    expect(namedStore.getQuads(null, null, null, defaultGraph())).toHaveLength(0)
    expect(namedStore.getQuads(null, null, null, namedNode(TERM_GRAPH_IRI))).toHaveLength(0)
    expect(namedStore.getQuads(null, null, null, namedNode(REAL_GRAPH_IRI))).toHaveLength(0)
    expect(namedStore.getQuads(null, null, null, namedNode(GRAPH_IRI))).toHaveLength(fixtureQuads.length)
    expect([...namedStore].every(q => q.graph.equals(namedNode(GRAPH_IRI)))).toBe(true)
  })

  it('the isolated named graph conforms to all non-SPARQL SHACL components', () => {
    const data = new Store([
      ...fullProfile.modules.flatMap(id => parseFile(moduleById.get(id).source.path.replace('static/ontology/', ''))),
      ...parseFile('instances/frameworks/bsc.ttl'),
    ])
    for (const q of namedStore.getQuads(null, null, null, namedNode(GRAPH_IRI))) {
      data.addQuad(quad(q.subject, q.predicate, q.object, defaultGraph()))
    }
    const report = validator.validate(data)
    expect(report.results.map(result => result.message?.map?.(item => item.value) ?? result.message)).toEqual([])
    expect(report.conforms).toBe(true)
  })
})

describe('synthetic ecosystem qualified bindings', () => {
  it('contains the exact three agents, six relationships, and fourteen activities', () => {
    const subjectsOfType = type => graph
      .getSubjects(RDF_TYPE, namedNode(type), namedNode(GRAPH_IRI))
      .map(term => term.value)
      .sort()

    expect(subjectsOfType(`${ECO}EcosystemAgent`)).toEqual([AURORA, RESONANCE, PERSON].sort())
    expect(subjectsOfType(`${ECO}EcosystemRelationship`)).toEqual([...expectedRelationships.keys()].sort())
    expect(subjectsOfType(`${ECO}OrganizationMembership`)).toHaveLength(2)
    expect(subjectsOfType(`${ECO}ImplementationResponsibility`)).toHaveLength(2)
    expect(subjectsOfType(`${ECO}EngagementActivity`)).toHaveLength(14)
  })

  it.each([...expectedRelationships.entries()])('%s preserves its agent/target/type/purpose/source tuple', (relationship, expected) => {
    const predicates = [
      `${ECO}relationshipAgent`,
      `${ECO}relationshipTarget`,
      `${ECO}hasRelationshipType`,
      `${ECO}relationshipPurpose`,
      'http://purl.org/dc/terms/source',
    ]
    expect(predicates.map(predicate => objectValues(relationship, predicate))).toEqual(
      expected.map(value => [value]),
    )
  })

  it('keeps membership roles and purpose-specific decisions separate', () => {
    expect(objectValues(`${RECORD}synthetic-alex-membership-aurora`, 'http://www.w3.org/ns/org#role'))
      .toEqual(['https://example.org/roles/researcher'])
    expect(objectValues(`${RECORD}synthetic-alex-membership-resonance`, 'http://www.w3.org/ns/org#role'))
      .toEqual(['https://example.org/roles/maintainer'])

    const hasActivity = `${ECO}hasEngagementActivity`
    expect(objectValues(`${RECORD}synthetic-alex-membership-aurora`, hasActivity))
      .toEqual([
        'https://w3id.org/sstim/ecosystem-record/activity/synthetic-aurora-membership-consent',
        'https://w3id.org/sstim/ecosystem-record/activity/synthetic-aurora-membership-publication',
      ])
    expect(objectValues(`${RECORD}synthetic-alex-membership-resonance`, hasActivity))
      .toEqual([
        'https://w3id.org/sstim/ecosystem-record/activity/synthetic-resonance-membership-consent',
        'https://w3id.org/sstim/ecosystem-record/activity/synthetic-resonance-membership-publication',
      ])
  })
})
