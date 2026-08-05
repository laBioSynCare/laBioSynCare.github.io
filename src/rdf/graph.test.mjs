import { describe, expect, it } from 'vitest'
import { buildGraphElements } from './graph.js'
import { mergeStores, parseIntoStore } from './loader.js'

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
  // Each case parses the whole Turtle fixture and builds the full Cytoscape
  // projection: ~1.5s in isolation, but over vitest's 5s default when the
  // suite runs in parallel. An explicit budget stops this failing
  // intermittently in CI, which a flaky suite makes worthless.
  const PROJECTION_TIMEOUT_MS = 30_000

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
  }, PROJECTION_TIMEOUT_MS)

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
  }, PROJECTION_TIMEOUT_MS)

  // ADR 0034 §11: the navigator projects the formal facets. No skos:Collection
  // is minted in the released vocabulary to make a UI filter match, so the
  // graph builder must read the route/approach/target predicates directly.
  it('collects stimulation facets onto the node that asserts them', async () => {
    const facetFixture = `
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix sstim: <https://w3id.org/sstim#> .
@prefix sstim-ex: <https://w3id.org/sstim/exposure#> .
@prefix sstim-v: <https://w3id.org/sstim/vocab#> .

sstim:NeuromodulationTechnique a owl:Class ; rdfs:label "Neuromodulation technique"@en .
sstim-v:routePhysicalNeuralInteraction a skos:Concept ; skos:prefLabel "Physical neural interaction"@en .
sstim-v:approachTranscranial a skos:Concept ; skos:prefLabel "Transcranial"@en .
sstim-v:targetCortex a skos:Concept ; skos:prefLabel "Cortex"@en .
sstim-ex:mediumAppliedElectricCurrent a skos:Concept ; skos:prefLabel "Applied electric current"@en .

sstim-v:techTACS a skos:Concept, sstim:NeuromodulationTechnique ;
  skos:prefLabel "tACS"@en ;
  sstim:neuralAccessRoute sstim-v:routePhysicalNeuralInteraction ;
  sstim:stimulationDeliveryApproach sstim-v:approachTranscranial ;
  sstim:intendedNeuralTargetSite sstim-v:targetCortex ;
  sstim-ex:characteristicDeliveryMedium sstim-ex:mediumAppliedElectricCurrent .
`
    const store = await parseIntoStore(facetFixture, 'text/turtle', GRAPH)
    const elements = await buildGraphElements(store)
    const tacs = elements.find(e => e.data.iri === 'https://w3id.org/sstim/vocab#techTACS')?.data

    expect(tacs.facets).toMatchObject({
      neuralAccessRoute: ['https://w3id.org/sstim/vocab#routePhysicalNeuralInteraction'],
      stimulationDeliveryApproach: ['https://w3id.org/sstim/vocab#approachTranscranial'],
      intendedNeuralTargetSite: ['https://w3id.org/sstim/vocab#targetCortex'],
      characteristicDeliveryMedium: ['https://w3id.org/sstim/exposure#mediumAppliedElectricCurrent'],
    })
  }, PROJECTION_TIMEOUT_MS)

  it('leaves facets undefined on a node that asserts none', async () => {
    const store = await parseIntoStore(fixture, 'text/turtle', GRAPH)
    const elements = await buildGraphElements(store)
    const modality = elements.find(e => e.data.iri === 'https://w3id.org/sstim/vocab#modalityAuditory')?.data

    expect(modality.facets).toBeUndefined()
  }, PROJECTION_TIMEOUT_MS)

  // ADR 0043: a term's owning module is a published fact in the manifest, and
  // the named graph of its *declaring* quad is what carries it. The navigator's
  // module filter reads data.module, so attribution has to come from the
  // declaration and not from whichever graph happened to mention the term —
  // annotating a term from a dependent module must not reassign its owner.
  it('attributes a term to the module whose graph declares it', async () => {
    const kernelGraph = 'https://w3id.org/sstim/graph/core'
    const commonGraph = 'https://w3id.org/sstim/graph/common'

    const kernel = await parseIntoStore(`
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix sstim: <https://w3id.org/sstim#> .
sstim:Stimulation a owl:Class ; rdfs:label "Stimulation"@en .
`, 'text/turtle', kernelGraph)

    // The dependent module annotates the Kernel's class and declares its own.
    const common = await parseIntoStore(`
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix sstim: <https://w3id.org/sstim#> .
sstim:Stimulation skos:scopeNote "Annotated from a dependent module."@en .
sstim:FrequencyBand a owl:Class ; rdfs:label "Frequency band"@en .
`, 'text/turtle', commonGraph)

    const store = mergeStores(kernel, common)
    const elements = await buildGraphElements(store)

    expect(byId(elements, 'https://w3id.org/sstim#Stimulation').module).toBe('core')
    expect(byId(elements, 'https://w3id.org/sstim#FrequencyBand').module).toBe('common')
  }, PROJECTION_TIMEOUT_MS)

  it('leaves module unset for terms outside the released module graphs', async () => {
    const store = await parseIntoStore(fixture, 'text/turtle', GRAPH)
    const elements = await buildGraphElements(store)

    // The fixture graph is not a manifest module, so nothing may claim an
    // owner. Catalog and ecosystem instances never carry one in any case —
    // they are instance data, governed by the layer axis.
    expect(byId(elements, APP).module).toBeUndefined()
    expect(byId(elements, PERSON).module).toBeUndefined()
    expect(byId(elements, 'https://w3id.org/sstim#SensoryModality').module).toBeUndefined()
  }, PROJECTION_TIMEOUT_MS)

  it('omits anonymous class expressions, which are structure rather than terms', async () => {
    // A union or intersection reached through rdfs:domain, rdfs:range, or
    // owl:equivalentClass is a blank node typed owl:Class. SSTIM has 50, and
    // ADR 0044's intact StimulusSpecification/SessionSpecification domain is
    // one of them, so they must stay in the ontology. They must not reach the
    // canvas: every edge query filters blank nodes, so each one arrived as an
    // orphan labelled with an N3.js blank-node id, which the annotation panel
    // then refused because it needs an IRI.
    const store = await parseIntoStore(`
      @prefix owl:  <http://www.w3.org/2002/07/owl#> .
      @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
      @prefix ex:   <https://example.org/t/> .

      ex:Named a owl:Class ; rdfs:label "Named"@en .
      ex:Other a owl:Class ; rdfs:label "Other"@en .
      ex:link a owl:ObjectProperty ;
          rdfs:domain [ a owl:Class ; owl:unionOf ( ex:Named ex:Other ) ] ;
          rdfs:range ex:Other .
    `, 'text/turtle', GRAPH)
    const elements = await buildGraphElements(store)
    const classes = elements.filter(e => e.data.kind === 'owlClass')

    expect(classes.map(e => e.data.iri).sort())
      .toEqual(['https://example.org/t/Named', 'https://example.org/t/Other'])
    // Nothing on the canvas may carry a blank-node identifier as its id.
    expect(elements.every(e => /^https?:/.test(e.data.id) || e.data.source)).toBe(true)
  }, PROJECTION_TIMEOUT_MS)

  it('draws property edges from every member of a union domain or range', async () => {
    // ADR 0043 keeps a cross-layer domain as one intact owl:unionOf, because
    // several rdfs:domain statements would intersect rather than widen. Read
    // literally, such a property connects a blank node the canvas does not
    // know, so nine object properties — hasExposureProfile, hasBodyPlacement,
    // requiresDeviceCapability and the rest of the exposure cluster — drew no
    // edge at all. Expanding the list gives one edge per named member.
    const store = await parseIntoStore(`
      @prefix owl:  <http://www.w3.org/2002/07/owl#> .
      @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
      @prefix ex:   <https://example.org/t/> .

      ex:Profile a owl:Class ; rdfs:label "Profile"@en .
      ex:Channel a owl:Class ; rdfs:label "Channel"@en .
      ex:Placement a owl:Class ; rdfs:label "Placement"@en .
      ex:hasPlacement a owl:ObjectProperty ;
          rdfs:label "has placement"@en ;
          rdfs:domain [ a owl:Class ; owl:unionOf ( ex:Profile ex:Channel ) ] ;
          rdfs:range ex:Placement .
    `, 'text/turtle', GRAPH)
    const elements = await buildGraphElements(store)
    const drawn = elements
      .filter(e => e.data.kind === 'objProp')
      .map(e => `${e.data.source.split('/').pop()}->${e.data.target.split('/').pop()}`)
      .sort()

    expect(drawn).toEqual(['Channel->Placement', 'Profile->Placement'])
  }, PROJECTION_TIMEOUT_MS)

  it('records upper-ontology parents on the node instead of drawing them', async () => {
    // Edges to these would collapse the canvas: 83 of the ~100 external parents
    // in SSTIM are "information content entity" alone. The grounding is real and
    // is a reason to adopt the ontology, so the inspector lists it. Labels are
    // read from the store — SSTIM labels the OBO anchors it reuses — so no
    // hand-maintained IRI-to-name table can go stale.
    const store = await parseIntoStore(`
      @prefix owl:  <http://www.w3.org/2002/07/owl#> .
      @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
      @prefix iao:  <http://purl.obolibrary.org/obo/IAO_> .
      @prefix prov: <http://www.w3.org/ns/prov#> .
      @prefix ex:   <https://example.org/t/> .

      iao:0000030 rdfs:label "information content entity"@en .
      ex:Parent a owl:Class ; rdfs:label "Parent"@en .
      ex:Record a owl:Class ; rdfs:label "Record"@en ;
          rdfs:subClassOf iao:0000030, ex:Parent .
      ex:Step a owl:Class ; rdfs:label "Step"@en ;
          rdfs:subClassOf prov:Activity .
      ex:Plain a owl:Class ; rdfs:label "Plain"@en ; rdfs:subClassOf ex:Parent .
    `, 'text/turtle', GRAPH)
    const elements = await buildGraphElements(store)
    const node = iri => elements.find(e => e.data.iri === iri)?.data

    // Labelled from the store, and the internal parent is left to the canvas.
    expect(node('https://example.org/t/Record').externalParents)
      .toEqual([{ iri: 'http://purl.obolibrary.org/obo/IAO_0000030', label: 'information content entity' }])
    // PROV carries no label here; the local name already reads cleanly.
    expect(node('https://example.org/t/Step').externalParents)
      .toEqual([{ iri: 'http://www.w3.org/ns/prov#Activity', label: 'Activity' }])
    // A class with only internal parents gains no row at all.
    expect(node('https://example.org/t/Plain').externalParents).toBeUndefined()

    // The external parent must still not appear as a node or an edge.
    expect(elements.some(e => e.data.id === 'http://purl.obolibrary.org/obo/IAO_0000030')).toBe(false)
    expect(elements.some(e => e.data.target === 'http://purl.obolibrary.org/obo/IAO_0000030')).toBe(false)
  }, PROJECTION_TIMEOUT_MS)
})
