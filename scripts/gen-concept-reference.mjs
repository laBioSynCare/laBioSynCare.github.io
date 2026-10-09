#!/usr/bin/env node
// Publish a deterministic read-only JSON reference derived ONLY from SSTIM's
// frozen semantic release modules. No runtime server and no private/live data.
// The default API discovery document identifies the newest supported release;
// release-specific URLs remain available when newer releases are cut.

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Parser } from 'n3'

const PROJECT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const NAMESPACE = 'https://w3id.org/sstim'
const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
const RDFS = 'http://www.w3.org/2000/01/rdf-schema#'
const OWL = 'http://www.w3.org/2002/07/owl#'
const SKOS = 'http://www.w3.org/2004/02/skos/core#'
const DCT = 'http://purl.org/dc/terms/'
const RELATIONS = new Map([
  [RDFS + 'subClassOf', 'subClassOf'],
  [RDFS + 'subPropertyOf', 'subPropertyOf'],
  [RDFS + 'domain', 'domain'],
  [RDFS + 'range', 'range'],
  [OWL + 'equivalentClass', 'equivalentClass'],
  [OWL + 'equivalentProperty', 'equivalentProperty'],
  [OWL + 'disjointWith', 'disjointWith'],
  [SKOS + 'broader', 'broader'],
  [SKOS + 'narrower', 'narrower'],
  [SKOS + 'related', 'related'],
  [SKOS + 'inScheme', 'inScheme'],
  [SKOS + 'topConceptOf', 'topConceptOf'],
  [SKOS + 'hasTopConcept', 'hasTopConcept'],
  [SKOS + 'exactMatch', 'exactMatch'],
  [SKOS + 'closeMatch', 'closeMatch'],
  [SKOS + 'broadMatch', 'broadMatch'],
  [SKOS + 'narrowMatch', 'narrowMatch'],
  [SKOS + 'relatedMatch', 'relatedMatch'],
  [OWL + 'sameAs', 'sameAs'],
])
const LITERAL_FIELDS = new Map([
  [RDFS + 'label', 'labels'],
  [SKOS + 'prefLabel', 'labels'],
  [SKOS + 'altLabel', 'alternativeLabels'],
  [SKOS + 'definition', 'definitions'],
  [RDFS + 'comment', 'descriptions'],
  [SKOS + 'scopeNote', 'scopeNotes'],
  [SKOS + 'editorialNote', 'editorialNotes'],
  [SKOS + 'historyNote', 'historyNotes'],
  [SKOS + 'changeNote', 'changeNotes'],
  [SKOS + 'notation', 'notations'],
  [DCT + 'description', 'descriptions'],
])
const CLASS_TYPES = new Set([OWL + 'Class', RDFS + 'Class'])
const PROPERTY_TYPES = new Set([
  RDF + 'Property', OWL + 'ObjectProperty', OWL + 'DatatypeProperty',
  OWL + 'AnnotationProperty', OWL + 'FunctionalProperty',
  OWL + 'InverseFunctionalProperty', OWL + 'TransitiveProperty',
  OWL + 'SymmetricProperty', OWL + 'AsymmetricProperty',
  OWL + 'ReflexiveProperty', OWL + 'IrreflexiveProperty',
])
const PREFIXES = [
  ['sstim-eco', NAMESPACE + '/ecosystem#'],
  ['sstim-ex', NAMESPACE + '/exposure#'],
  ['sstim-v', NAMESPACE + '/vocab#'],
  ['sstim', NAMESPACE + '#'],
]
const sha256 = (text) => createHash('sha256').update(text).digest('hex')
const stableJson = (data) => JSON.stringify(data, null, 2) + '\n'
const uniqueSorted = (values) => [...new Set(values)].sort((a, b) => a.localeCompare(b, 'en'))

export function curieFor(iri) {
  for (const [prefix, base] of PREFIXES) {
    if (iri.startsWith(base)) return prefix + ':' + iri.slice(base.length)
  }
  return iri
}

function isTermIri(iri) {
  return iri.startsWith(NAMESPACE + '#') ||
    iri.startsWith(NAMESPACE + '/')
}

function literalValue(term) {
  return {
    value: term.value,
    ...(term.language ? { language: term.language } : {}),
    ...(term.datatype?.value && !term.language &&
      term.datatype.value !== 'http://www.w3.org/2001/XMLSchema#string'
      ? { datatype: term.datatype.value } : {}),
  }
}

function languageFirst(a, b) {
  const preference = (x) => x.language === 'en' ? 0 : !x.language ? 1 : 2
  return preference(a) - preference(b) ||
    (a.language ?? '').localeCompare(b.language ?? '', 'en') ||
    a.value.localeCompare(b.value, 'en')
}

/** A pure transform: the caller supplies frozen, checksum-verified module texts. */
export function buildReference(manifest, moduleTexts) {
  const version = manifest?.suite?.version
  if (!/^\d+\.\d+\.\d+$/.test(version ?? '') || manifest.suite.status !== 'released') {
    throw new Error('Concept API requires a frozen, released SSTIM manifest')
  }

  const records = new Map()
  const semanticModules = manifest.modules.filter((m) => m.roles?.includes('semantic'))
  const full = manifest.profiles.find((profile) => profile.id === 'full')
  if (!full || semanticModules.some((m) => !full.modules.includes(m.id))) {
    throw new Error('Concept API must use the full released semantic closure')
  }
  for (const module of semanticModules) {
    const ttl = moduleTexts.get(module.id)
    if (typeof ttl !== 'string') throw new Error('Missing frozen module: ' + module.id)
    if (sha256(ttl) !== module.source.sha256) {
      throw new Error('Checksum mismatch in frozen module: ' + module.id)
    }
    const quads = new Parser({ format: 'text/turtle' }).parse(ttl)
    const source = {
      module: module.id,
      sha256: module.source.sha256,
      source: 'ontology/' + version + '/' + basename(module.source.path),
      graph: module.runtime.graphIri,
    }
    for (const q of quads) {
      if (q.subject.termType !== 'NamedNode' || !isTermIri(q.subject.value)) continue
      let record = records.get(q.subject.value)
      if (!record) {
        record = { types: new Set(), values: new Map(), sources: new Map() }
        records.set(q.subject.value, record)
      }
      record.sources.set(module.id, source)
      if (q.predicate.value === RDF + 'type' && q.object.termType === 'NamedNode') {
        record.types.add(q.object.value)
      }
      const values = record.values.get(q.predicate.value) ?? []
      values.push(q.object)
      record.values.set(q.predicate.value, values)
    }
  }

  const details = []
  for (const [iri, record] of records) {
    const kind = record.types.has(SKOS + 'Concept') ? 'concept'
      : [...record.types].some((type) => PROPERTY_TYPES.has(type)) ? 'property'
        : [...record.types].some((type) => CLASS_TYPES.has(type)) ? 'class' : null
    if (!kind) continue

    const sourceList = [...record.sources.values()].sort((a, b) =>
      (a.module === 'alignments') - (b.module === 'alignments') ||
      a.module.localeCompare(b.module, 'en'))
    const detail = {
      iri, curie: curieFor(iri), kind,
      version,
      deprecated: (record.values.get(OWL + 'deprecated') ?? [])
        .some((obj) => obj.termType === 'Literal' && obj.value === 'true'),
      module: sourceList[0]?.module ?? '',
      sources: sourceList,
    }
    for (const [predicate, name] of LITERAL_FIELDS) {
      const seen = new Set()
      const values = (record.values.get(predicate) ?? [])
        .filter((obj) => obj.termType === 'Literal')
        .map(literalValue)
        .filter((obj) => {
          const key = JSON.stringify(obj)
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
      if (values.length) {
        // rdfs:label and skos:prefLabel share the public labels field.
        detail[name] = [...(detail[name] ?? []), ...values].sort(languageFirst)
      }
    }
    if (!detail.labels?.length) {
      const local = iri.split(/[/#]/).at(-1)
      detail.labels = [{ value: local }]
    }
    const labelSeen = new Set()
    detail.labels = detail.labels.filter((o) => {
      const key = JSON.stringify(o)
      if (labelSeen.has(key)) return false
      labelSeen.add(key)
      return true
    })
    detail.label = detail.labels[0].value
    const relationships = []
    for (const [predicate, relation] of RELATIONS) {
      for (const obj of record.values.get(predicate) ?? []) {
        if (obj.termType === 'NamedNode') relationships.push({ relation, iri: obj.value })
      }
    }
    if (relationships.length) {
      detail.relationships = relationships
        .filter((r, i, a) => a.findIndex((x) => x.relation === r.relation && x.iri === r.iri) === i)
        .sort((a, b) => a.relation.localeCompare(b.relation, 'en') || a.iri.localeCompare(b.iri, 'en'))
    }
    details.push(detail)
  }
  details.sort((a, b) => a.iri.localeCompare(b.iri, 'en'))
  const index = details.map((d) => ({
    iri: d.iri, curie: d.curie, kind: d.kind, label: d.label,
    module: d.module, deprecated: d.deprecated,
    ...(d.alternativeLabels ? { alternativeLabels: d.alternativeLabels } : {}),
    ...(d.definitions?.length ? { definition: d.definitions[0].value } : {}),
    path: 'terms/' + sha256(d.iri) + '.json',
  }))
  return { version, index, details }
}

export function supportedSnapshots(ontologyDir) {
  // API v1 starts with 0.18.0. Earlier SSTIM snapshots predate this
  // release schema and are still available directly as RDF, not JSON API v1.
  const min = [0, 18, 0]
  const compare = (v) => {
    const parts = v.split('.').map(Number)
    for (let i = 0; i < 3; i++) {
      if (parts[i] !== min[i]) return parts[i] - min[i]
    }
    return 0
  }
  return readdirSync(ontologyDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^\d+\.\d+\.\d+$/.test(e.name) && compare(e.name) >= 0)
    .map((e) => e.name)
    .sort((a, b) => {
      const A = a.split('.').map(Number), B = b.split('.').map(Number)
      for (let i = 0; i < 3; i++) if (A[i] !== B[i]) return A[i] - B[i]
      return 0
    })
}

export function generateConceptApi({ ontologyDir, outputDir } = {}) {
  if (!ontologyDir || !outputDir) throw new Error('ontologyDir and outputDir are required')
  const versions = supportedSnapshots(ontologyDir)
  if (!versions.length) throw new Error('No supported frozen SSTIM snapshots')
  const apiRoot = join(outputDir, 'api', 'v1')
  rmSync(apiRoot, { recursive: true, force: true })
  mkdirSync(apiRoot, { recursive: true })
  const outputs = []
  for (const version of versions) {
    const snapshotDir = join(ontologyDir, version)
    const manifest = JSON.parse(readFileSync(join(snapshotDir, 'manifest.json'), 'utf8'))
    if (manifest.suite.version !== version) throw new Error('Snapshot directory/manifest version mismatch')
    const texts = new Map()
    for (const module of manifest.modules.filter((m) => m.roles?.includes('semantic'))) {
      texts.set(module.id, readFileSync(join(snapshotDir, basename(module.source.path)), 'utf8'))
    }
    const { index, details } = buildReference(manifest, texts)
    if (!index.length) throw new Error('No public terms in release ' + version)
    const versionRoot = join(apiRoot, 'releases', version)
    const termRoot = join(versionRoot, 'terms')
    mkdirSync(termRoot, { recursive: true })
    for (const item of details) {
      writeFileSync(join(termRoot, sha256(item.iri) + '.json'), stableJson(item))
    }
    const catalog = {
      model: 'sstim-concept-reference-v1',
      release: version,
      status: 'released',
      manifest: 'ontology/' + version + '/manifest.json',
      ontology: NAMESPACE + '/' + version,
      count: index.length,
      terms: index,
    }
    writeFileSync(join(versionRoot, 'index.json'), stableJson(catalog))
    outputs.push({ version, count: index.length, path: 'releases/' + version + '/index.json' })
  }
  const latest = outputs.at(-1)
  writeFileSync(join(apiRoot, 'index.json'), stableJson({
    model: 'sstim-concept-reference-discovery-v1',
    latestRelease: latest.version,
    catalog: latest.path,
    releases: outputs,
    schema: 'https://github.com/w3c-cg/sstim/blob/main/docs/technical/CONCEPT_REFERENCE_API.md',
    limitations: [
      'Static read-only JSON; no server-side ?q search endpoint.',
      'Published ontology terms only; no private or mutable ecosystem records.',
      'Assertions and mappings are descriptive and not clinical validation.',
    ],
  }))
  return outputs
}

const scriptName = process.argv[1] ? resolve(process.argv[1]) : ''
if (scriptName === fileURLToPath(import.meta.url)) {
  const outputDir = resolve(PROJECT, process.argv[2] || 'dist')
  if (!existsSync(outputDir)) throw new Error('Build output not found: ' + outputDir)
  const outputs = generateConceptApi({
    ontologyDir: resolve(PROJECT, 'static/ontology'),
    outputDir,
  })
  console.log('sstim concept API: ' + outputs.map((x) => x.version + ' (' + x.count + ')').join(', '))
}
