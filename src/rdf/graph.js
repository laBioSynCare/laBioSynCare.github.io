/**
 * Build a Cytoscape-ready elements array from the merged ontology store.
 *
 * Node types (data.kind):
 *   'owlClass'    — OWL class from sstim-core.ttl
 *   'skosConcept' — SKOS concept / dual-typed individual from sstim-vocab.ttl
 *   'xsdType'     — XSD datatype (target of datatype properties)
 *   'scheme'      — skos:ConceptScheme (used as group anchor, not rendered)
 *
 * Edge types (data.kind):
 *   'subClassOf'  — rdfs:subClassOf between OWL classes
 *   'objProp'     — object property domain→range (labeled)
 *   'dataProp'    — datatype property domain→xsd type (labeled)
 *   'narrower'    — skos:narrower between concepts
 *   'related'     — skos:related / skos:broadMatch between concepts
 *   'instanceOf'  — OWL class membership of a SKOS concept (bridge edge)
 */

import { select } from './query.js'

const OWL  = 'http://www.w3.org/2002/07/owl#'
const RDF  = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
const RDFS = 'http://www.w3.org/2000/01/rdf-schema#'
const SKOS = 'http://www.w3.org/2004/02/skos/core#'
const XSD  = 'http://www.w3.org/2001/XMLSchema#'

const SSTIM_NS = 'https://w3id.org/sstim#'

function localName(iri) {
  return iri.split(/[#/]/).pop()
}

function xsdLabel(iri) {
  return 'xsd:' + localName(iri)
}

export async function buildGraphElements(store) {
  const nodes = new Map()   // id → cy node data
  const edges = []

  function addNode(id, data) {
    if (!nodes.has(id)) nodes.set(id, { data: { id, ...data } })
  }

  // ── 1. OWL Classes ─────────────────────────────────────────────────────────
  const classRows = await select(store, `
    PREFIX owl:  <${OWL}>
    PREFIX rdfs: <${RDFS}>
    PREFIX skos: <${SKOS}>
    SELECT ?cls ?label ?def WHERE {
      ?cls a owl:Class .
      OPTIONAL { ?cls rdfs:label ?label . FILTER(LANG(?label) = "en") }
      OPTIONAL { ?cls skos:definition ?def . FILTER(LANG(?def) = "en") }
    }`)

  for (const r of classRows) {
    const id = r.cls.value
    if (id.startsWith(OWL)) continue   // skip owl:Class itself
    addNode(id, {
      kind: 'owlClass',
      label: r.label?.value ?? localName(id),
      definition: r.def?.value ?? '',
      iri: id,
    })
  }

  // ── 2. rdfs:subClassOf between OWL classes ─────────────────────────────────
  const subRows = await select(store, `
    PREFIX owl:  <${OWL}>
    PREFIX rdfs: <${RDFS}>
    SELECT ?child ?parent WHERE {
      ?child rdfs:subClassOf ?parent .
      ?child  a owl:Class .
      ?parent a owl:Class .
      FILTER(!isBlank(?parent))
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
  const objPropRows = await select(store, `
    PREFIX owl:  <${OWL}>
    PREFIX rdfs: <${RDFS}>
    SELECT ?prop ?propLabel ?domain ?range WHERE {
      ?prop a owl:ObjectProperty .
      ?prop rdfs:domain ?domain .
      ?prop rdfs:range  ?range .
      OPTIONAL { ?prop rdfs:label ?propLabel . FILTER(LANG(?propLabel) = "en") }
    }`)

  for (const r of objPropRows) {
    const src = r.domain.value
    const tgt = r.range.value
    if (!nodes.has(src) || !nodes.has(tgt)) continue
    const propId = r.prop.value
    edges.push({ data: {
      id: `obj_${localName(propId)}`,
      source: src, target: tgt,
      kind: 'objProp',
      label: r.propLabel?.value ?? localName(propId),
      propIri: propId,
    }})
  }

  // ── 4. Datatype properties (domain → XSD type) ─────────────────────────────
  const dataPropRows = await select(store, `
    PREFIX owl:  <${OWL}>
    PREFIX rdfs: <${RDFS}>
    SELECT ?prop ?propLabel ?domain ?range WHERE {
      ?prop a owl:DatatypeProperty .
      ?prop rdfs:domain ?domain .
      ?prop rdfs:range  ?range .
      OPTIONAL { ?prop rdfs:label ?propLabel . FILTER(LANG(?propLabel) = "en") }
    }`)

  for (const r of dataPropRows) {
    const src = r.domain.value
    const tgt = r.range.value
    if (!nodes.has(src)) continue
    // Add XSD node if needed
    if (!nodes.has(tgt)) {
      addNode(tgt, { kind: 'xsdType', label: xsdLabel(tgt), iri: tgt })
    }
    const propId = r.prop.value
    edges.push({ data: {
      id: `dat_${localName(propId)}`,
      source: src, target: tgt,
      kind: 'dataProp',
      label: r.propLabel?.value ?? localName(propId),
      propIri: propId,
    }})
  }

  // ── 5. SKOS concepts ────────────────────────────────────────────────────────
  const conceptRows = await select(store, `
    PREFIX skos: <${SKOS}>
    PREFIX rdfs: <${RDFS}>
    SELECT ?concept ?label ?scheme ?notation WHERE {
      ?concept a skos:Concept .
      OPTIONAL { ?concept skos:prefLabel ?label . FILTER(LANG(?label) = "en") }
      OPTIONAL { ?concept skos:inScheme ?scheme }
      OPTIONAL { ?concept skos:notation ?notation }
    }`)

  for (const r of conceptRows) {
    const id = r.concept.value
    addNode(id, {
      kind: 'skosConcept',
      label: r.label?.value ?? r.notation?.value ?? localName(id),
      scheme: r.scheme?.value ?? '',
      notation: r.notation?.value ?? '',
      iri: id,
    })
  }

  // ── 6. skos:narrower edges ──────────────────────────────────────────────────
  const narrowerRows = await select(store, `
    PREFIX skos: <${SKOS}>
    SELECT ?broader ?narrower WHERE {
      ?broader skos:narrower ?narrower .
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
  const relatedRows = await select(store, `
    PREFIX skos: <${SKOS}>
    SELECT ?a ?b ?rel WHERE {
      { ?a skos:related   ?b . BIND("related"    AS ?rel) }
      UNION
      { ?a skos:broadMatch ?b . BIND("broadMatch" AS ?rel) }
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
  const typeRows = await select(store, `
    PREFIX rdf:  <${RDF}>
    PREFIX skos: <${SKOS}>
    PREFIX owl:  <${OWL}>
    SELECT ?concept ?owlClass WHERE {
      ?concept a skos:Concept .
      ?concept a ?owlClass .
      ?owlClass a owl:Class .
      FILTER(?owlClass != skos:Concept)
    }`)

  for (const r of typeRows) {
    const concept  = r.concept.value
    const owlClass = r.owlClass.value
    if (!nodes.has(concept) || !nodes.has(owlClass)) continue
    edges.push({ data: {
      id: `inst_${localName(concept)}_${localName(owlClass)}`,
      source: concept, target: owlClass,
      kind: 'instanceOf', label: 'a',
    }})
  }

  return [...nodes.values(), ...edges]
}
