import { DataFactory } from 'n3'

const { namedNode } = DataFactory

const ns = base => local => namedNode(base + local)

// ── SSTIM ontology and scoped implementation namespaces ──────────────────────
export const SSTIM    = ns('https://w3id.org/sstim#')
export const SSTIM_V  = ns('https://w3id.org/sstim/vocab#')
export const SSTIM_SH = ns('https://w3id.org/sstim/shapes#')
export const SSTIM_EX = ns('https://w3id.org/sstim/exposure#')
export const SSTIM_ECO = ns('https://w3id.org/sstim/ecosystem#')
export const SSTIM_I  = ns('https://w3id.org/sstim/inst/')
// Public members of sstim-ref: have exact per-entity browser and Turtle routes
// in the audited preset/reference block of the external w3id.org registry.
export const SSTIM_REF = ns('https://w3id.org/sstim/ref/')
export const SSTIM_ORGANIZATION = ns('https://w3id.org/sstim/organization/')
export const SSTIM_SPECIALIST = ns('https://w3id.org/sstim/specialist/')
export const SSTIM_ECOSYSTEM_RECORD = ns('https://w3id.org/sstim/ecosystem-record/')
// These three bare-root IRIs (no sub-path) each have a matching per-entity
// browser redirect in the external w3id.org registry — sstim/.htaccess's
// "BEGIN audited BSC catalog routes" block (local clone: ~/rep/w3id.org).
// If one of these ever changes, that block needs a matching PR there too.
export const BSC_FRAMEWORK_IRI = namedNode('https://w3id.org/sstim/framework/bsc')
export const BIOSYNCARE_IRI = namedNode('https://w3id.org/sstim/implementation/biosyncare')
export const BSCLAB_IRI = namedNode('https://w3id.org/sstim/implementation/bsclab')
export const ECOSYSTEM_AGENTS_GRAPH_IRI = namedNode('https://w3id.org/sstim/graph/ecosystem-agents')
export const ECOSYSTEM_FIXTURE_GRAPH_IRI = namedNode('https://w3id.org/sstim/graph/ecosystem-fixture')
export const BSC_FRAMEWORK = ns('https://w3id.org/sstim/framework/bsc/')
export const BSC_FRAMEWORK_TECHNIQUE = ns('https://w3id.org/sstim/framework/bsc/technique/')
export const BIOSYNCARE = ns('https://w3id.org/sstim/implementation/biosyncare/')
export const BIOSYNCARE_PRESET = ns('https://w3id.org/sstim/implementation/biosyncare/preset/')
export const BIOSYNCARE_EVIDENCE = ns('https://w3id.org/sstim/implementation/biosyncare/evidence/')
export const BIOSYNCARE_SESSION = ns('https://w3id.org/sstim/implementation/biosyncare/session/')
export const BIOSYNCARE_ANNOTATION = ns('https://w3id.org/sstim/implementation/biosyncare/annotation/')
export const BSCLAB = ns('https://w3id.org/sstim/implementation/bsclab/')
// Public members of bsclab-preset: use the same exact audited route inventory;
// do not replace it with a namespace wildcard when adding local/private data.
export const BSCLAB_PRESET = ns('https://w3id.org/sstim/implementation/bsclab/preset/')
export const BSCLAB_EXPERIMENT = ns('https://w3id.org/sstim/implementation/bsclab/experiment/')
export const BSCLAB_EVIDENCE = ns('https://w3id.org/sstim/implementation/bsclab/evidence/')
export const BSCLAB_SESSION = ns('https://w3id.org/sstim/implementation/bsclab/session/')
export const BSCLAB_ANNOTATION = ns('https://w3id.org/sstim/implementation/bsclab/annotation/')

// ── W3C vocabularies ─────────────────────────────────────────────────────────
export const RDF  = ns('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
export const RDFS = ns('http://www.w3.org/2000/01/rdf-schema#')
export const OWL  = ns('http://www.w3.org/2002/07/owl#')
export const XSD  = ns('http://www.w3.org/2001/XMLSchema#')
export const SKOS = ns('http://www.w3.org/2004/02/skos/core#')
export const SH   = ns('http://www.w3.org/ns/shacl#')
export const PROV = ns('http://www.w3.org/ns/prov#')
export const OA   = ns('http://www.w3.org/ns/oa#')
export const ORG  = ns('http://www.w3.org/ns/org#')

// ── Metadata vocabularies ─────────────────────────────────────────────────────
export const DCT  = ns('http://purl.org/dc/terms/')
export const FOAF = ns('http://xmlns.com/foaf/0.1/')
export const SCHEMA = ns('https://schema.org/')

// ── Upper ontologies (BFO / OBI / IAO / PATO / ECO) ──────────────────────────
export const BFO  = ns('http://purl.obolibrary.org/obo/BFO_')
export const OBI  = ns('http://purl.obolibrary.org/obo/OBI_')
export const IAO  = ns('http://purl.obolibrary.org/obo/IAO_')
export const COB  = ns('http://purl.obolibrary.org/obo/COB_')
export const PATO = ns('http://purl.obolibrary.org/obo/PATO_')
export const ECO  = ns('http://purl.obolibrary.org/obo/ECO_')

// ── External alignments ───────────────────────────────────────────────────────
export const WD   = ns('http://www.wikidata.org/entity/')
export const WDT  = ns('http://www.wikidata.org/prop/direct/')
export const DBR  = ns('http://dbpedia.org/resource/')

// ── Predecessor namespaces (read-only; used when loading legacy TTL files) ────
export const NSO_V0 = ns('https://biosyncare.github.io/ont#')
export const NSO_V1 = ns('https://biosyncarelab.github.io/ont#')

// ── Prefix map for N3.Writer, SPARQL preambles, and CURIE display ────────────
//
// Used by toCurie() to compact full IRIs for display. Bases are matched
// longest-first so that nested prefixes (e.g. bsclab vs bsclab-preset) resolve
// to the most specific prefix.
export const PREFIXES = {
  'sstim':    'https://w3id.org/sstim#',
  'sstim-v':  'https://w3id.org/sstim/vocab#',
  'sstim-sh': 'https://w3id.org/sstim/shapes#',
  'sstim-ex': 'https://w3id.org/sstim/exposure#',
  'sstim-eco': 'https://w3id.org/sstim/ecosystem#',
  'sstim-i':  'https://w3id.org/sstim/inst/',
  'sstim-ref': 'https://w3id.org/sstim/ref/',
  'sstim-organization': 'https://w3id.org/sstim/organization/',
  'sstim-specialist': 'https://w3id.org/sstim/specialist/',
  'sstim-ecosystem-record': 'https://w3id.org/sstim/ecosystem-record/',
  'bsc-fw': 'https://w3id.org/sstim/framework/bsc/',
  'bsc-fw-tech': 'https://w3id.org/sstim/framework/bsc/technique/',
  'biosyncare': 'https://w3id.org/sstim/implementation/biosyncare/',
  'biosyncare-preset': 'https://w3id.org/sstim/implementation/biosyncare/preset/',
  'biosyncare-evidence': 'https://w3id.org/sstim/implementation/biosyncare/evidence/',
  'biosyncare-session': 'https://w3id.org/sstim/implementation/biosyncare/session/',
  'biosyncare-annotation': 'https://w3id.org/sstim/implementation/biosyncare/annotation/',
  'bsclab': 'https://w3id.org/sstim/implementation/bsclab/',
  'bsclab-preset': 'https://w3id.org/sstim/implementation/bsclab/preset/',
  'bsclab-experiment': 'https://w3id.org/sstim/implementation/bsclab/experiment/',
  'bsclab-evidence': 'https://w3id.org/sstim/implementation/bsclab/evidence/',
  'bsclab-session': 'https://w3id.org/sstim/implementation/bsclab/session/',
  'bsclab-annotation': 'https://w3id.org/sstim/implementation/bsclab/annotation/',
  'rdf':      'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  'rdfs':     'http://www.w3.org/2000/01/rdf-schema#',
  'owl':      'http://www.w3.org/2002/07/owl#',
  'xsd':      'http://www.w3.org/2001/XMLSchema#',
  'skos':     'http://www.w3.org/2004/02/skos/core#',
  'sh':       'http://www.w3.org/ns/shacl#',
  'prov':     'http://www.w3.org/ns/prov#',
  'oa':       'http://www.w3.org/ns/oa#',
  'org':      'http://www.w3.org/ns/org#',
  'dct':      'http://purl.org/dc/terms/',
  'foaf':     'http://xmlns.com/foaf/0.1/',
  'schema':   'https://schema.org/',
  'bfo':      'http://purl.obolibrary.org/obo/BFO_',
  'obi':      'http://purl.obolibrary.org/obo/OBI_',
  'iao':      'http://purl.obolibrary.org/obo/IAO_',
  'cob':      'http://purl.obolibrary.org/obo/COB_',
  'pato':     'http://purl.obolibrary.org/obo/PATO_',
  'eco':      'http://purl.obolibrary.org/obo/ECO_',
  'wd':       'http://www.wikidata.org/entity/',
  'wdt':      'http://www.wikidata.org/prop/direct/',
  'dbr':      'http://dbpedia.org/resource/',
  'nso-v0':   'https://biosyncare.github.io/ont#',
  'nso-v1':   'https://biosyncarelab.github.io/ont#',
}

const SORTED_PREFIXES = Object.entries(PREFIXES).sort(([, a], [, b]) => b.length - a.length)

export function toCurie(iri) {
  if (!iri) return ''
  for (const [prefix, base] of SORTED_PREFIXES) {
    if (iri.startsWith(base)) return `${prefix}:${iri.slice(base.length)}`
  }
  return iri
}
