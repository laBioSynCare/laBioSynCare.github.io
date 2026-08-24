/**
 * Build a Cytoscape-ready elements array from the merged ontology store.
 *
 * Node types (data.kind):
 *   'owlClass'    — OWL class from sstim-core.ttl
 *   'skosConcept' — SKOS concept / dual-typed individual from sstim-vocab.ttl
 *   'xsdType'     — XSD datatype (target of datatype properties)
 *   'ontologyResource' — an SSTIM ontology/module identity
 *   'catalogFramework' — versioned framework catalog record
 *   'catalogImplementation' — versioned implementation/component record
 *   'catalogTechnique' — versioned framework technique record
 *   'catalogPreset' — versioned public preset record
 *   'catalogReference' — versioned public-safe reference record
 *   'ecosystemPerson' / 'ecosystemOrganization' — live public agents
 *   'scheme'      — skos:ConceptScheme (used as group anchor, not rendered)
 *
 * Edge types (data.kind):
 *   'subClassOf'  — rdfs:subClassOf between OWL classes
 *   'objProp'     — object property domain→range, labeled by the property
 *   'dataProp'    — datatype property domain→xsd type, labeled by the property
 *   'narrower'    — skos:narrower between concepts
 *   'related'     — skos:related / skos:broadMatch between concepts
 *   'instanceOf'  — OWL class membership of a SKOS concept (bridge edge)
 *   'catalogRelation' — catalog composition/implementation/term link
 *   'ecosystemRelationship' — projection of one qualified live record
 */

import { select } from './query.js'
import { MODULE_ID_BY_GRAPH_IRI } from './loader.js'
import { DataFactory } from 'n3'

const { namedNode } = DataFactory

const OWL  = 'http://www.w3.org/2002/07/owl#'
const RDF  = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
const RDFS = 'http://www.w3.org/2000/01/rdf-schema#'
const SKOS = 'http://www.w3.org/2004/02/skos/core#'
const XSD  = 'http://www.w3.org/2001/XMLSchema#'
const DCT  = 'http://purl.org/dc/terms/'
const ORG  = 'http://www.w3.org/ns/org#'
const SCHEMA = 'https://schema.org/'

const SSTIM_NS = 'https://w3id.org/sstim#'
const SSTIM_EX_NS = 'https://w3id.org/sstim/exposure#'
const SSTIM_ECO = 'https://w3id.org/sstim/ecosystem#'
const BSC_TECHNIQUE_NS = 'https://w3id.org/sstim/framework/bsc/technique/'
const BIOSYNCARE_IMPLEMENTATION = 'https://w3id.org/sstim/implementation/biosyncare'
const BIOSYNCARE_ORGANIZATION = 'https://w3id.org/sstim/organization/biosyncare'
const PATCH_STUDIO_COMPONENT = 'https://w3id.org/sstim/implementation/bsclab/component/patch-studio'

// Last *non-empty* segment: a namespace-root IRI ends in a separator
// (…/framework/bsc/), and naively popping the split yields '' — which then
// surfaces as an unlabelled node on the canvas.
function localName(iri) {
  const parts = iri.split(/[#/]/).filter(Boolean)
  return parts[parts.length - 1] ?? iri
}

function xsdLabel(iri) {
  return 'xsd:' + localName(iri)
}

function terms(store, subject, predicate) {
  return store.getObjects(namedNode(subject), namedNode(predicate), null)
}

function preferredLiteral(values) {
  return values.find(value => value.termType === 'Literal' && value.language === 'en') ??
    values.find(value => value.termType === 'Literal' && !value.language) ??
    values.find(value => value.termType === 'Literal')
}

function labelsFor(store, iri) {
  const values = [
    ...terms(store, iri, RDFS + 'label'),
    ...terms(store, iri, SKOS + 'prefLabel'),
    ...terms(store, iri, DCT + 'title'),
  ].filter(value => value.termType === 'Literal')
  const preferred = preferredLiteral(values)
  const unique = [...new Set(values.map(value => value.value))]
  if (preferred) unique.sort((a) => a === preferred.value ? -1 : 0)
  return unique
}

function literalFor(store, iri, predicates) {
  const values = predicates.flatMap(predicate => terms(store, iri, predicate))
  return preferredLiteral(values)?.value ?? ''
}

function iriValues(store, iri, predicate) {
  return [...new Set(
    terms(store, iri, predicate)
      .filter(value => value.termType === 'NamedNode')
      .map(value => value.value),
  )]
}

function displayLabel(iri, label) {
  if (iri === BIOSYNCARE_IMPLEMENTATION) return `${label} — application`
  if (iri === BIOSYNCARE_ORGANIZATION) return `${label} — organization`
  if (iri === PATCH_STUDIO_COMPONENT) return `${label} — application component`
  return label
}

// An rdfs:domain or rdfs:range is often an anonymous union: ADR 0043 keeps
// cross-layer axioms as one intact owl:unionOf rather than several statements,
// because several would intersect instead of widening. Reading the blank node
// literally means the property connects nothing the canvas knows about, so
// nine object properties — the whole exposure cluster, hasExposureProfile,
// hasBodyPlacement, requiresDeviceCapability and the rest — silently drew no
// edge at all. Expanding the list restores one edge per named member.
// The union and intersection paths are two OPTIONALs rather than one
// alternation: Comunica returns no rows for `(owl:unionOf|owl:intersectionOf)`
// followed by a sequence, silently, while each branch works on its own.
const CLASS_MEMBERS = `
        OPTIONAL { ?domainNode owl:unionOf/rdf:rest*/rdf:first ?domainUnion . }
        OPTIONAL { ?domainNode owl:intersectionOf/rdf:rest*/rdf:first ?domainIntersection . }
        OPTIONAL { ?rangeNode owl:unionOf/rdf:rest*/rdf:first ?rangeUnion . }
        OPTIONAL { ?rangeNode owl:intersectionOf/rdf:rest*/rdf:first ?rangeIntersection . }
        BIND(COALESCE(?domainUnion, ?domainIntersection, ?domainNode) AS ?domain)
        BIND(COALESCE(?rangeUnion, ?rangeIntersection, ?rangeNode) AS ?range)`

// Upper-ontology parents are deliberately not drawn: 83 of the ~100 external
// subClassOf targets are IAO_0000030 alone, so edges to them would collapse the
// canvas into one hub. The grounding is still real and is a reason to adopt
// SSTIM, so the inspector lists it instead. Only nine distinct parents are used
// and SSTIM already labels five of them; the rest are PROV, whose local names
// read cleanly, so no hand-maintained label table is needed.
const EXTERNAL_PARENT_NS = ['http://purl.obolibrary.org', 'http://www.w3.org/ns/prov']

function isExternalParent(iri) {
  return EXTERNAL_PARENT_NS.some(ns => iri.startsWith(ns))
}

// The stages below, in order, for the progress reporter. Kept as one list so a
// caller can size its progress bar before the first stage runs, and so
// buildGraphElements cannot silently report more steps than it declares —
// `stage()` throws on an unknown label.
export const BUILD_STAGES = [
  'OWL classes',
  'Class hierarchy',
  'Object properties',
  'Datatype properties',
  'Vocabulary concepts',
  'Stimulation facets',
  'Concept hierarchy',
  'Related concepts',
  'Class membership',
  'Ontology modules',
  'Catalog records',
  'Ecosystem agents',
  'Catalog relations',
  'Ecosystem relationships',
  'Module provenance',
  'Annotations',
]

/**
 * Project the merged store into Cytoscape elements.
 *
 * @param {import('n3').Store} store
 * @param {{ onProgress?: (p: { step: number, total: number, label: string }) =>
 *   (void | Promise<void>) }} [options]
 *   Called before each stage. **Awaited** — that is the point: the projection
 *   is a second of solid main-thread work, and `await` on a resolved promise
 *   only drains microtasks, so an all-async build still never lets the browser
 *   paint. A caller that wants a live loader returns a real yield from here
 *   (see `src/ui/loading/renderYield.js`). Passing nothing changes nothing.
 * @returns {Promise<Array>} Cytoscape elements
 */
export async function buildGraphElements(store, { onProgress = null } = {}) {
  const nodes = new Map()   // id → cy node data
  const edges = []
  let projectedEdgeId = 0

  let stageIndex = 0
  async function stage(label) {
    const expected = BUILD_STAGES[stageIndex]
    if (expected !== label) {
      throw new Error(`buildGraphElements stage ${stageIndex} is "${label}", BUILD_STAGES says "${expected}"`)
    }
    stageIndex += 1
    if (onProgress) await onProgress({ step: stageIndex, total: BUILD_STAGES.length, label })
  }

  function addNode(id, data) {
    if (!nodes.has(id)) nodes.set(id, { data: { id, ...data } })
  }

  function addProjectedEdge(data) {
    edges.push({ data: { id: `projected_${projectedEdgeId++}`, ...data } })
  }

  // ── 1. OWL Classes ─────────────────────────────────────────────────────────
  await stage('OWL classes')
  // Named classes only. An `owl:Class` subject is just as often an anonymous
  // class expression: SSTIM has 50 of them, every one a union or intersection
  // reached through rdfs:domain, rdfs:range, or owl:equivalentClass. They are
  // correct and required modelling — ADR 0044's intact union domain is one —
  // but they are structure, not vocabulary. Rendering them gave the browser 50
  // orphan nodes labelled with N3.js blank-node ids, unreachable by every edge
  // query (which already filter them) and rejected by the annotation panel,
  // which needs an IRI. The subClassOf query below has always filtered them.
  const classRows = await select(store, `
    PREFIX owl:  <${OWL}>
    PREFIX rdfs: <${RDFS}>
    PREFIX skos: <${SKOS}>
    SELECT ?cls ?label ?def WHERE {
      GRAPH ?g {
        ?cls a owl:Class .
        OPTIONAL { ?cls rdfs:label ?label . FILTER(LANG(?label) = "en") }
        OPTIONAL { ?cls skos:definition ?def . FILTER(LANG(?def) = "en") }
        FILTER(!isBlank(?cls))
      }
    }`)

  for (const r of classRows) {
    const id = r.cls.value
    if (id.startsWith(OWL)) continue   // skip owl:Class itself
    const externalParents = iriValues(store, id, RDFS + 'subClassOf')
      .filter(isExternalParent)
      .map(parent => ({
        iri: parent,
        // SSTIM labels the OBO anchors it reuses; PROV's local names are already
        // readable. Reading the label from the store keeps this from going stale.
        label: preferredLiteral(terms(store, parent, RDFS + 'label'))?.value ?? localName(parent),
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
    addNode(id, {
      kind: 'owlClass',
      layer: 'ontology',
      label: r.label?.value ?? localName(id),
      definition: r.def?.value ?? '',
      iri: id,
      ...(externalParents.length ? { externalParents } : {}),
    })
  }

  // ── 2. rdfs:subClassOf between OWL classes ─────────────────────────────────
  await stage('Class hierarchy')
  const subRows = await select(store, `
    PREFIX owl:  <${OWL}>
    PREFIX rdfs: <${RDFS}>
    SELECT ?child ?parent WHERE {
      GRAPH ?g {
        ?child rdfs:subClassOf ?parent .
        ?child  a owl:Class .
        ?parent a owl:Class .
        FILTER(!isBlank(?parent))
      }
    }`)

  for (const r of subRows) {
    const child  = r.child.value
    const parent = r.parent.value
    if (parent.startsWith(OWL) || parent.startsWith('http://purl.obolibrary.org') ||
        parent.startsWith('http://www.w3.org/ns/prov')) continue
    edges.push({ data: {
      id: `sub_${localName(child)}_${localName(parent)}`,
      source: child, target: parent,
      kind: 'subClassOf', label: 'subClassOf',
    }})
  }

  // ── 3. Object properties (domain → range) ──────────────────────────────────
  await stage('Object properties')
  const objPropRows = await select(store, `
    PREFIX owl:  <${OWL}>
    PREFIX rdf:  <${RDF}>
    PREFIX rdfs: <${RDFS}>
    PREFIX skos: <${SKOS}>
    SELECT ?prop ?propLabel ?def ?domain ?range WHERE {
      GRAPH ?g {
        ?prop a owl:ObjectProperty .
        ?prop rdfs:domain ?domainNode .
        ?prop rdfs:range  ?rangeNode .
        OPTIONAL { ?prop rdfs:label ?propLabel . FILTER(LANG(?propLabel) = "en") }
        OPTIONAL { ?prop skos:definition ?def . FILTER(LANG(?def) = "en") }${CLASS_MEMBERS}
      }
    }`)

  for (const r of objPropRows) {
    const src = r.domain.value
    const tgt = r.range.value
    if (!nodes.has(src) || !nodes.has(tgt)) continue
    const propId = r.prop.value
    edges.push({ data: {
      id: `obj_${localName(propId)}_${localName(src)}_${localName(tgt)}`,
      source: src, target: tgt,
      kind: 'objProp',
      label: r.propLabel?.value ?? localName(propId),
      iri: propId,
      propIri: propId,
      definition: r.def?.value ?? '',
      sourceLabel: nodes.get(src).data.label,
      targetLabel: nodes.get(tgt).data.label,
    }})
  }

  // ── 4. Datatype properties (domain → XSD type) ─────────────────────────────
  await stage('Datatype properties')
  const dataPropRows = await select(store, `
    PREFIX owl:  <${OWL}>
    PREFIX rdf:  <${RDF}>
    PREFIX rdfs: <${RDFS}>
    PREFIX skos: <${SKOS}>
    SELECT ?prop ?propLabel ?def ?domain ?range WHERE {
      GRAPH ?g {
        ?prop a owl:DatatypeProperty .
        ?prop rdfs:domain ?domainNode .
        ?prop rdfs:range  ?rangeNode .
        OPTIONAL { ?prop rdfs:label ?propLabel . FILTER(LANG(?propLabel) = "en") }
        OPTIONAL { ?prop skos:definition ?def . FILTER(LANG(?def) = "en") }${CLASS_MEMBERS}
      }
    }`)

  for (const r of dataPropRows) {
    const src = r.domain.value
    const tgt = r.range.value
    if (!nodes.has(src)) continue
    // Add XSD node if needed
    if (!nodes.has(tgt)) {
      addNode(tgt, { kind: 'xsdType', layer: 'ontology', label: xsdLabel(tgt), iri: tgt })
    }
    const propId = r.prop.value
    edges.push({ data: {
      id: `dat_${localName(propId)}_${localName(src)}_${localName(tgt)}`,
      source: src, target: tgt,
      kind: 'dataProp',
      label: r.propLabel?.value ?? localName(propId),
      iri: propId,
      propIri: propId,
      definition: r.def?.value ?? '',
      sourceLabel: nodes.get(src).data.label,
      targetLabel: nodes.get(tgt).data.label,
    }})
  }

  // ── 5. SKOS concepts ────────────────────────────────────────────────────────
  await stage('Vocabulary concepts')
  const conceptRows = await select(store, `
    PREFIX skos: <${SKOS}>
    PREFIX rdfs: <${RDFS}>
    SELECT ?concept ?label ?scheme ?notation WHERE {
      GRAPH ?g {
        ?concept a skos:Concept .
        OPTIONAL { ?concept skos:prefLabel ?label . FILTER(LANG(?label) = "en") }
        OPTIONAL { ?concept skos:inScheme ?scheme }
        OPTIONAL { ?concept skos:notation ?notation }
      }
    }`)

  for (const r of conceptRows) {
    const id = r.concept.value
    addNode(id, {
      kind: 'skosConcept',
      layer: 'vocabulary',
      label: r.label?.value ?? r.notation?.value ?? localName(id),
      scheme: r.scheme?.value ?? '',
      notation: r.notation?.value ?? '',
      iri: id,
    })
  }

  // ── 5b. Stimulation facets (ADR 0034) ───────────────────────────────────────
  await stage('Stimulation facets')
  // A neuromodulation perspective is cross-cutting: it needs the new OWL
  // classes, the route/approach/target schemes, AND the subset of concepts
  // carrying a given facet value. Scheme membership and class local name cannot
  // express "has predicate P". Rather than minting a skos:Collection in the
  // released vocabulary purely so a UI filter can match it — a navigator
  // artifact inside a citable scientific artifact — the navigator learns to
  // read the facets that already exist. Attached as data.facets, keyed by
  // predicate local name; additive, so no existing consumer changes.
  const FACET_PREDICATES = [
    'neuralAccessRoute', 'stimulationDeliveryApproach',
    'intendedNeuralTargetSite', 'intendedNeuralSystem', 'intendedNeuralPhenomenon',
    'mechanismNeuralAccessRoute', 'mechanismNeuralTargetSite',
    'mechanismNeuralSystem', 'mechanismNeuralPhenomenon',
    'outcomeNeuralAccessRoute', 'outcomeNeuralTargetSite',
    'outcomeNeuralSystem', 'outcomeNeuralPhenomenon',
  ]
  const facetValues = FACET_PREDICATES.map((p) => `<${SSTIM_NS}${p}>`).join(' ')
  const facetRows = await select(store, `
    SELECT ?subject ?predicate ?value WHERE {
      GRAPH ?g {
        ?subject ?predicate ?value .
        VALUES ?predicate { ${facetValues} }
      }
    }`)

  for (const r of facetRows) {
    const node = nodes.get(r.subject.value)
    if (!node) continue
    const key = localName(r.predicate.value)
    node.data.facets ??= {}
    ;(node.data.facets[key] ??= []).push(r.value.value)
  }

  // The coarse technique-level medium lives in the exposure namespace but is
  // the same kind of facet for navigation purposes.
  const mediumRows = await select(store, `
    SELECT ?subject ?value WHERE {
      GRAPH ?g { ?subject <${SSTIM_EX_NS}characteristicDeliveryMedium> ?value . }
    }`)

  for (const r of mediumRows) {
    const node = nodes.get(r.subject.value)
    if (!node) continue
    node.data.facets ??= {}
    ;(node.data.facets.characteristicDeliveryMedium ??= []).push(r.value.value)
  }

  // ── 6. skos:narrower edges ──────────────────────────────────────────────────
  await stage('Concept hierarchy')
  const narrowerRows = await select(store, `
    PREFIX skos: <${SKOS}>
    SELECT ?broader ?narrower WHERE {
      GRAPH ?g {
        ?broader skos:narrower ?narrower .
      }
    }`)

  for (const r of narrowerRows) {
    const broad  = r.broader.value
    const narrow = r.narrower.value
    if (!nodes.has(broad) || !nodes.has(narrow)) continue
    edges.push({ data: {
      id: `narrow_${localName(broad)}_${localName(narrow)}`,
      source: broad, target: narrow,
      kind: 'narrower', label: 'narrower',
    }})
  }

  // ── 7. skos:related / skos:broadMatch ──────────────────────────────────────
  await stage('Related concepts')
  const relatedRows = await select(store, `
    PREFIX skos: <${SKOS}>
    SELECT ?a ?b ?rel WHERE {
      GRAPH ?g {
        { ?a skos:related   ?b . BIND("related"    AS ?rel) }
        UNION
        { ?a skos:broadMatch ?b . BIND("broadMatch" AS ?rel) }
      }
    }`)

  for (const r of relatedRows) {
    const a = r.a.value
    const b = r.b.value
    if (!nodes.has(a) || !nodes.has(b)) continue
    edges.push({ data: {
      id: `rel_${localName(a)}_${localName(b)}`,
      source: a, target: b,
      kind: 'related', label: r.rel.value,
    }})
  }

  // ── 8. instanceOf bridge: SKOS concept → OWL class ─────────────────────────
  await stage('Class membership')
  const typeRows = await select(store, `
    PREFIX rdf:  <${RDF}>
    PREFIX skos: <${SKOS}>
    PREFIX owl:  <${OWL}>
    SELECT ?concept ?owlClass WHERE {
      GRAPH ?conceptGraph {
        ?concept a skos:Concept .
        ?concept a ?owlClass .
      }
      GRAPH ?classGraph {
        ?owlClass a owl:Class .
      }
      FILTER(?owlClass != skos:Concept)
    }`)

  for (const r of typeRows) {
    const concept  = r.concept.value
    const owlClass = r.owlClass.value
    if (!nodes.has(concept) || !nodes.has(owlClass)) continue
    edges.push({ data: {
      id: `inst_${localName(concept)}_${localName(owlClass)}`,
      source: concept, target: owlClass,
      kind: 'instanceOf', label: 'type',
    }})
  }


  // ── 9. Ontology/module identities ─────────────────────────────────────────
  await stage('Ontology modules')
  // These make resource-level attributions (for example, “created SSTIM”) land
  // on a visible node rather than stopping at an unrendered target IRI.
  const ontologyResources = store.getSubjects(
    namedNode(RDF + 'type'),
    namedNode(OWL + 'Ontology'),
    null,
  )
  for (const subject of ontologyResources) {
    if (subject.termType !== 'NamedNode') continue
    const id = subject.value
    const aliases = labelsFor(store, id)
    const baseLabel = aliases[0] ?? localName(id) ?? 'SSTIM'
    const label = id === 'https://w3id.org/sstim'
      ? 'SSTIM ontology'
      : `${baseLabel} — ontology module`
    addNode(id, {
      kind: 'ontologyResource',
      layer: 'ontology',
      label,
      aliases,
      definition: literalFor(store, id, [DCT + 'description', SKOS + 'definition']),
      iri: id,
      searchText: [label, ...aliases, localName(id), 'ontology module'].join(' '),
    })
  }


  // ── 10. Versioned framework / implementation catalog ──────────────────────
  await stage('Catalog records')
  const catalogResources = new Map()
  const addTypedCatalogResources = (type, kind) => {
    for (const subject of store.getSubjects(namedNode(RDF + 'type'), namedNode(type), null)) {
      if (subject.termType === 'NamedNode') catalogResources.set(subject.value, kind)
    }
  }
  addTypedCatalogResources(SSTIM_NS + 'SensoryStimulationFramework', 'catalogFramework')
  addTypedCatalogResources(SSTIM_NS + 'SensoryStimulationImplementation', 'catalogImplementation')
  addTypedCatalogResources(SSTIM_NS + 'Preset', 'catalogPreset')
  addTypedCatalogResources(SSTIM_NS + 'PublicSafeReference', 'catalogReference')
  for (const subject of store.getSubjects(null, null, null)) {
    if (subject.termType === 'NamedNode' && subject.value.startsWith(BSC_TECHNIQUE_NS)) {
      catalogResources.set(subject.value, 'catalogTechnique')
    }
  }

  for (const [id, kind] of catalogResources) {
    const aliases = labelsFor(store, id)
    const rawLabel = aliases[0] ?? localName(id)
    const label = displayLabel(id, rawLabel)
    addNode(id, {
      kind,
      layer: 'catalog',
      sourceLabel: 'Versioned catalog',
      label,
      aliases,
      definition: literalFor(store, id, [DCT + 'description', SKOS + 'definition']),
      iri: id,
      created: literalFor(store, id, [DCT + 'created']),
      modified: literalFor(store, id, [DCT + 'modified']),
      sourceLinks: [...new Set([
        ...iriValues(store, id, DCT + 'source'),
        ...iriValues(store, id, RDFS + 'seeAlso'),
        ...iriValues(store, id, SCHEMA + 'url'),
      ])],
      searchText: [label, ...aliases, localName(id), 'versioned catalog'].join(' '),
    })
  }


  // ── 11. Current public ecosystem agents ───────────────────────────────────
  await stage('Ecosystem agents')
  const agentType = SSTIM_ECO + 'EcosystemAgent'
  const agentResources = new Set()
  for (const subject of store.getSubjects(namedNode(RDF + 'type'), namedNode(agentType), null)) {
    if (subject.termType !== 'NamedNode') continue
    const id = subject.value
    agentResources.add(id)
    const typeIris = iriValues(store, id, RDF + 'type')
    const isPerson = typeIris.includes(SCHEMA + 'Person')
    const aliases = labelsFor(store, id)
    const rawLabel = aliases[0] ?? localName(id)
    const label = displayLabel(id, rawLabel)
    addNode(id, {
      kind: isPerson ? 'ecosystemPerson' : 'ecosystemOrganization',
      layer: 'ecosystem',
      sourceLabel: 'Live stakeholder network',
      label,
      aliases,
      definition: literalFor(store, id, [DCT + 'description']),
      iri: id,
      created: literalFor(store, id, [DCT + 'created']),
      modified: literalFor(store, id, [DCT + 'modified']),
      sourceLinks: [...new Set([
        ...iriValues(store, id, DCT + 'source'),
        ...iriValues(store, id, SCHEMA + 'url'),
      ])],
      searchText: [
        label,
        ...aliases,
        localName(id),
        isPerson ? 'person live ecosystem' : 'organization live ecosystem',
      ].join(' '),
    })
  }


  // ── 12. Resource type and catalog relation bridges ─────────────────────────
  await stage('Catalog relations')
  for (const id of [...catalogResources.keys(), ...agentResources]) {
    for (const type of iriValues(store, id, RDF + 'type')) {
      if (!nodes.has(type)) continue
      addProjectedEdge({
        source: id,
        target: type,
        kind: 'instanceOf',
        label: 'type',
        sourceLabel: nodes.get(id).data.label,
        targetLabel: nodes.get(type).data.label,
      })
    }
  }

  const catalogPredicates = new Map([
    [SSTIM_NS + 'definesTechnique', 'defines technique'],
    [SSTIM_NS + 'implementsFramework', 'implements'],
    [DCT + 'hasPart', 'has part'],
    [DCT + 'isPartOf', 'is part of'],
    [DCT + 'requires', 'requires'],
    [SKOS + 'relatedMatch', 'related match'],
    [SSTIM_NS + 'proposedMechanism', 'proposed mechanism'],
    [SSTIM_NS + 'hasStimulusTemporalStructure', 'temporal structure'],
    [SSTIM_NS + 'techniqueModality', 'modality'],
    [RDFS + 'seeAlso', 'see also'],
  ])
  const catalogEdgeKeys = new Set()
  for (const [predicate, label] of catalogPredicates) {
    for (const quad of store.getQuads(null, namedNode(predicate), null, null)) {
      if (quad.subject.termType !== 'NamedNode' || quad.object.termType !== 'NamedNode') continue
      const source = quad.subject.value
      const target = quad.object.value
      if (!nodes.has(source) || !nodes.has(target)) continue
      if (!catalogResources.has(source) && nodes.get(source).data.kind !== 'ontologyResource') continue
      const key = `${source}|${predicate}|${target}`
      if (catalogEdgeKeys.has(key)) continue
      catalogEdgeKeys.add(key)
      addProjectedEdge({
        source,
        target,
        kind: 'catalogRelation',
        label,
        iri: predicate,
        sourceLabel: nodes.get(source).data.label,
        targetLabel: nodes.get(target).data.label,
      })
    }
  }


  // ── 13. Qualified ecosystem records projected as inspectable edges ─────────
  await stage('Ecosystem relationships')
  // The relationship record remains the edge IRI and carries its type, purpose,
  // sources, roles, dates, and prose. We do not flatten lifecycle activities or
  // infer stronger claims than the approved current-state publication asserts.
  const relationshipClass = SSTIM_ECO + 'EcosystemRelationship'
  const relationshipSubjects = store.getSubjects(
    namedNode(RDF + 'type'),
    namedNode(relationshipClass),
    null,
  )
  for (const subject of relationshipSubjects) {
    if (subject.termType !== 'NamedNode') continue
    const iri = subject.value
    const agent = iriValues(store, iri, SSTIM_ECO + 'relationshipAgent')[0]
    const target = iriValues(store, iri, SSTIM_ECO + 'relationshipTarget')[0]
    const relationshipType = iriValues(store, iri, SSTIM_ECO + 'hasRelationshipType')[0]
    const purpose = iriValues(store, iri, SSTIM_ECO + 'relationshipPurpose')[0]
    if (!agent || !target || !nodes.has(agent)) continue

    if (!nodes.has(target)) {
      const targetAliases = labelsFor(store, target)
      const targetLabel = targetAliases[0] ?? localName(target)
      addNode(target, {
        kind: 'ecosystemTarget',
        layer: 'ecosystem',
        sourceLabel: 'Live stakeholder network',
        label: targetLabel,
        aliases: targetAliases,
        definition: literalFor(store, target, [DCT + 'description', SKOS + 'definition']),
        iri: target,
        searchText: [targetLabel, ...targetAliases, localName(target), 'ecosystem target'].join(' '),
      })
    }

    const roles = iriValues(store, iri, ORG + 'role')
      .map(role => labelsFor(store, role)[0] ?? localName(role))
    const typeLabel = relationshipType
      ? labelsFor(store, relationshipType)[0] ?? localName(relationshipType)
      : 'relationship'
    const purposeLabel = purpose
      ? labelsFor(store, purpose)[0] ?? localName(purpose)
      : ''
    const recordLabel = labelsFor(store, iri)[0] ?? typeLabel
    // ADR 0032: a relationship may be admitted at any truthful non-approved
    // status (e.g. notified), not only publication-approved. Absent entirely,
    // it is the pre-ADR-0032 legacy case and treated as approved — never
    // labeled, so approved relationships keep their existing plain look.
    const publicationStatus = iriValues(store, iri, SSTIM_ECO + 'publicationStatus')[0]
    const publicationStatusLabel = publicationStatus
      ? labelsFor(store, publicationStatus)[0] ?? localName(publicationStatus)
      : ''
    const isPending = Boolean(publicationStatus) &&
      publicationStatus !== SSTIM_ECO + 'outcomePublicationApproved'
    // The pending note names the subject accurately: publicationStatus is
    // generic, so an org-agent relationship must not be described as awaiting
    // a "person" (ADR 0032 covers "the person or organization it describes").
    const agentIsPerson = iriValues(store, agent, RDF + 'type').includes(SCHEMA + 'Person')
    addProjectedEdge({
      source: agent,
      target,
      kind: 'ecosystemRelationship',
      layer: 'ecosystem',
      label: (roles.length ? roles.join(' + ') : typeLabel) + (isPending ? ` (${publicationStatusLabel})` : ''),
      recordLabel,
      definition: literalFor(store, iri, [DCT + 'description']),
      iri,
      relationshipType: typeLabel,
      relationshipTypeIri: relationshipType ?? '',
      purpose: purposeLabel,
      purposeIri: purpose ?? '',
      roles,
      publicationStatus: publicationStatusLabel,
      publicationStatusIri: publicationStatus ?? '',
      isPending,
      pendingSubjectNoun: agentIsPerson ? 'person' : 'organization',
      sources: iriValues(store, iri, DCT + 'source'),
      created: literalFor(store, iri, [DCT + 'created']),
      reviewedOn: literalFor(store, iri, [SSTIM_ECO + 'reviewedOn']),
      validFrom: literalFor(store, iri, [SSTIM_ECO + 'validFrom']),
      validUntil: literalFor(store, iri, [SSTIM_ECO + 'validUntil']),
      sourceLabel: nodes.get(agent).data.label,
      targetLabel: nodes.get(target).data.label,
    })
  }

  // ── 14. Module provenance (ADR 0043) ───────────────────────────────────────
  await stage('Module provenance')
  // Which module owns a term is a published fact — the manifest's bill of
  // materials — not something a navigator should re-derive from IRI shape or a
  // hand-kept list of local names. The named graph of the declaring quad *is*
  // that owner: the loader tags each module's quads with its manifest
  // `runtime.graphIri`, and every SSTIM term is declared in exactly one module,
  // so the attribution is unambiguous.
  //
  // Read here rather than by projecting ?g out of each SELECT above: a term's
  // label or definition may legitimately be asserted from a dependent module,
  // and binding ?g per query would then return one row per contributing graph
  // and pick a non-owner arbitrarily. Only the type declaration marks ownership.
  const DECLARATION_TYPES = [
    OWL + 'Class', OWL + 'ObjectProperty', OWL + 'DatatypeProperty',
    OWL + 'Ontology', SKOS + 'Concept',
  ]
  function moduleForIri(iri) {
    for (const type of DECLARATION_TYPES) {
      const [declaration] = store.getQuads(
        namedNode(iri), namedNode(RDF + 'type'), namedNode(type), null,
      )
      const moduleId = declaration && MODULE_ID_BY_GRAPH_IRI[declaration.graph.value]
      if (moduleId) return moduleId
    }
    return ''
  }
  for (const node of nodes.values()) {
    if (!node.data.iri) continue
    const moduleId = moduleForIri(node.data.iri)
    if (moduleId) node.data.module = moduleId
  }
  // Property edges carry the module that declares the property, which is not
  // always the module of either endpoint — that is exactly what an ADR 0043
  // bridge module is — so the inspector can name it.
  for (const edge of edges) {
    if (!edge.data.propIri) continue
    const moduleId = moduleForIri(edge.data.propIri)
    if (moduleId) edge.data.module = moduleId
  }

  // ── 15. Annotation enrichment ───────────────────────────────────────────────
  await stage('Annotations')
  // Definitions and notes were previously read only where a section's SPARQL
  // happened to ask for them — OWL classes got skos:definition, SKOS concepts
  // got none, and scope/history/editorial notes were dropped everywhere. The
  // vocabulary carries all of these (hundreds of skos:definition, plus
  // scopeNote/altLabel/example), so enrich every node from the store here
  // rather than adding OPTIONALs to each query, which would risk cross
  // products. Reading straight from the N3 store is also far cheaper.
  for (const node of nodes.values()) {
    const iri = node.data.iri
    if (!iri) continue
    if (!node.data.definition) {
      node.data.definition = literalFor(store, iri, [
        SKOS + 'definition', DCT + 'description', RDFS + 'comment',
      ])
    }
    const scopeNote     = literalFor(store, iri, [SKOS + 'scopeNote'])
    const example       = literalFor(store, iri, [SKOS + 'example'])
    const note          = literalFor(store, iri, [SKOS + 'note'])
    const historyNote   = literalFor(store, iri, [SKOS + 'historyNote'])
    const editorialNote = literalFor(store, iri, [SKOS + 'editorialNote'])
    const altLabels = [...new Set(
      terms(store, iri, SKOS + 'altLabel')
        .filter(value => value.termType === 'Literal' &&
          (!value.language || value.language === 'en'))
        .map(value => value.value),
    )]
    if (scopeNote)     node.data.scopeNote = scopeNote
    if (example)       node.data.example = example
    if (note)          node.data.note = note
    if (historyNote)   node.data.historyNote = historyNote
    if (editorialNote) node.data.editorialNote = editorialNote
    if (altLabels.length) node.data.altLabels = altLabels
  }

  return [...nodes.values(), ...edges]
}
