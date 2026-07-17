import { describe, expect, it } from 'vitest'
import { buildGraphElements } from './graph.js'
import { parseIntoStore } from './loader.js'

const GRAPH = 'https://example.org/graph/navigator-test'
const APP = 'https://w3id.org/sstim/implementation/biosyncare'
const ORG = 'https://w3id.org/sstim/organization/biosyncare'
const PERSON = 'https://example.org/specialist/alex'
const RECORD = 'https://example.org/ecosystem-record/alex-develops-app'

const fixture = `
@prefix dct: <http://purl.org/dc/terms/> .
@prefix org: <http://www.w3.org/ns/org#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix schema: <https://schema.org/> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix sstim: <https://w3id.org/sstim#> .
@prefix eco: <https://w3id.org/sstim/ecosystem#> .

<https://w3id.org/sstim> a owl:Ontology ; dct:title "SSTIM"@en .
sstim:SensoryStimulationFramework a owl:Class ; rdfs:label "Sensory stimulation framework"@en .
sstim:SensoryStimulationImplementation a owl:Class ; rdfs:label "Sensory stimulation implementation"@en .
sstim:SensoryStimulation a owl:Class ; rdfs:label "Sensory stimulation"@en .
sstim:SensoryModality a owl:Class ; rdfs:label "Sensory modality"@en .
eco:EcosystemAgent a owl:Class ; rdfs:label "Ecosystem agent"@en .
eco:EcosystemRelationship a owl:Class ; rdfs:label "Ecosystem relationship"@en .

<https://w3id.org/sstim/vocab#modalityAuditory>
  a skos:Concept, sstim:SensoryModality ;
  skos:prefLabel "Auditory"@en .

<https://w3id.org/sstim/framework/bsc>
  a sstim:SensoryStimulationFramework ;
  rdfs:label "BSC Framework"@en ;
  sstim:definesTechnique <https://w3id.org/sstim/framework/bsc/technique/example> .

<https://w3id.org/sstim/framework/bsc/technique/example>
  a sstim:SensoryStimulation ;
  rdfs:label "Example technique"@en ;
  sstim:techniqueModality <https://w3id.org/sstim/vocab#modalityAuditory> .

<${APP}>
  a sstim:SensoryStimulationImplementation ;
  rdfs:label "BioSynCare"@en ;
  dct:description "A versioned application record."@en ;
  sstim:implementsFramework <https://w3id.org/sstim/framework/bsc> .

<${ORG}>
  a eco:EcosystemAgent, schema:Organization ;
  rdfs:label "BioSynCare"@en ;
  dct:description "A live organization record."@en .

<${PERSON}>
  a eco:EcosystemAgent, schema:Person ;
  rdfs:label "Alex Rivera"@en ;
  dct:description "A fictional public ecosystem agent."@en .

eco:implementationDeveloper a skos:Concept ; skos:prefLabel "implementation developer"@en .
eco:purposePublicAttribution a skos:Concept ; skos:prefLabel "public attribution"@en .
<https://example.org/role/lead> a org:Role ; rdfs:label "Technical lead"@en .

<${RECORD}>
  a eco:EcosystemRelationship ;
  rdfs:label "Alex Rivera develops the application"@en ;
  dct:description "A qualified fictional relationship."@en ;
  eco:relationshipAgent <${PERSON}> ;
  eco:relationshipTarget <${APP}> ;
  eco:hasRelationshipType eco:implementationDeveloper ;
  eco:relationshipPurpose eco:purposePublicAttribution ;
  eco:reviewedOn "2026-07-17" ;
  org:role <https://example.org/role/lead> ;
  dct:source <https://example.org/source> .
`

function byId(elements, id) {
  return elements.find(element => element.data.id === id)?.data
}

describe('unified navigator projection', () => {
  it('interlinks versioned catalog, live agents, ontology, and vocabulary', async () => {
    const store = await parseIntoStore(fixture, 'text/turtle', GRAPH)
    const elements = await buildGraphElements(store)

    expect(byId(elements, 'https://w3id.org/sstim').kind).toBe('ontologyResource')
    expect(byId(elements, APP)).toMatchObject({
      kind: 'catalogImplementation',
      layer: 'catalog',
      label: 'BioSynCare — application',
    })
    expect(byId(elements, ORG)).toMatchObject({
      kind: 'ecosystemOrganization',
      layer: 'ecosystem',
      label: 'BioSynCare — organization',
    })
    expect(byId(elements, PERSON)).toMatchObject({
      kind: 'ecosystemPerson',
      layer: 'ecosystem',
      label: 'Alex Rivera',
    })

    const catalogEdges = elements.filter(element => element.data.kind === 'catalogRelation')
    expect(catalogEdges).toEqual(expect.arrayContaining([
      expect.objectContaining({ data: expect.objectContaining({
        source: APP,
        target: 'https://w3id.org/sstim/framework/bsc',
        label: 'implements',
      }) }),
      expect.objectContaining({ data: expect.objectContaining({
        source: 'https://w3id.org/sstim/framework/bsc/technique/example',
        target: 'https://w3id.org/sstim/vocab#modalityAuditory',
        label: 'modality',
      }) }),
    ]))
  })

  it('keeps qualified relationship provenance on the projected edge', async () => {
    const store = await parseIntoStore(fixture, 'text/turtle', GRAPH)
    const elements = await buildGraphElements(store)
    const edge = elements.find(element => element.data.iri === RECORD)?.data

    expect(edge).toMatchObject({
      kind: 'ecosystemRelationship',
      source: PERSON,
      target: APP,
      recordLabel: 'Alex Rivera develops the application',
      relationshipType: 'implementation developer',
      purpose: 'public attribution',
      reviewedOn: '2026-07-17',
      roles: ['Technical lead'],
      sources: ['https://example.org/source'],
    })
  })
})
