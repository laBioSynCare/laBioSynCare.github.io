import { DataFactory } from 'n3'

const { namedNode } = DataFactory

const ns = base => local => namedNode(base + local)

// ── SSTIM ontology and scoped implementation namespaces ──────────────────────
export const SSTIM    = ns('https://w3id.org/sstim#')
export const SSTIM_V  = ns('https://w3id.org/sstim/vocab#')
export const SSTIM_SH = ns('https://w3id.org/sstim/shapes#')
export const SSTIM_I  = ns('https://w3id.org/sstim/inst/')
export const SSTIM_REF = ns('https://w3id.org/sstim/ref/')
export const BSC_FRAMEWORK = ns('https://w3id.org/sstim/framework/bsc/')
export const BIOSYNCARE = ns('https://w3id.org/sstim/implementation/biosyncare/')
export const BIOSYNCARE_PRESET = ns('https://w3id.org/sstim/implementation/biosyncare/preset/')
export const BIOSYNCARE_EVIDENCE = ns('https://w3id.org/sstim/implementation/biosyncare/evidence/')
export const BIOSYNCARE_SESSION = ns('https://w3id.org/sstim/implementation/biosyncare/session/')
export const BIOSYNCARE_ANNOTATION = ns('https://w3id.org/sstim/implementation/biosyncare/annotation/')
export const BSCLAB = ns('https://w3id.org/sstim/implementation/bsclab/')
export const BSCLAB_PRESET = ns('https://w3id.org/sstim/implementation/bsclab/preset/')
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

// ── Metadata vocabularies ─────────────────────────────────────────────────────
export const DCT  = ns('http://purl.org/dc/terms/')
export const FOAF = ns('http://xmlns.com/foaf/0.1/')

// ── Upper ontologies (BFO / OBI / IAO / PATO / ECO) ──────────────────────────
export const BFO  = ns('http://purl.obolibrary.org/obo/BFO_')
export const OBI  = ns('http://purl.obolibrary.org/obo/OBI_')
export const IAO  = ns('http://purl.obolibrary.org/obo/IAO_')
export const PATO = ns('http://purl.obolibrary.org/obo/PATO_')
export const ECO  = ns('http://purl.obolibrary.org/obo/ECO_')

// ── External alignments ───────────────────────────────────────────────────────
export const WD   = ns('http://www.wikidata.org/entity/')
export const WDT  = ns('http://www.wikidata.org/prop/direct/')
export const DBR  = ns('http://dbpedia.org/resource/')

// ── Predecessor namespaces (read-only; used when loading legacy TTL files) ────
export const NSO_V0 = ns('https://biosyncare.github.io/ont#')
export const NSO_V1 = ns('https://biosyncarelab.github.io/ont#')

// ── Prefix map for N3.Writer and SPARQL preambles ────────────────────────────
export const PREFIXES = {
  'sstim':    'https://w3id.org/sstim#',
  'sstim-v':  'https://w3id.org/sstim/vocab#',
  'sstim-sh': 'https://w3id.org/sstim/shapes#',
  'sstim-i':  'https://w3id.org/sstim/inst/',
  'sstim-ref': 'https://w3id.org/sstim/ref/',
  'bsc-fw': 'https://w3id.org/sstim/framework/bsc/',
  'biosyncare': 'https://w3id.org/sstim/implementation/biosyncare/',
  'biosyncare-preset': 'https://w3id.org/sstim/implementation/biosyncare/preset/',
  'biosyncare-evidence': 'https://w3id.org/sstim/implementation/biosyncare/evidence/',
  'biosyncare-session': 'https://w3id.org/sstim/implementation/biosyncare/session/',
  'biosyncare-annotation': 'https://w3id.org/sstim/implementation/biosyncare/annotation/',
  'bsclab': 'https://w3id.org/sstim/implementation/bsclab/',
  'bsclab-preset': 'https://w3id.org/sstim/implementation/bsclab/preset/',
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
  'dct':      'http://purl.org/dc/terms/',
  'foaf':     'http://xmlns.com/foaf/0.1/',
  'bfo':      'http://purl.obolibrary.org/obo/BFO_',
  'obi':      'http://purl.obolibrary.org/obo/OBI_',
  'iao':      'http://purl.obolibrary.org/obo/IAO_',
  'pato':     'http://purl.obolibrary.org/obo/PATO_',
  'eco':      'http://purl.obolibrary.org/obo/ECO_',
  'wd':       'http://www.wikidata.org/entity/',
  'wdt':      'http://www.wikidata.org/prop/direct/',
  'dbr':      'http://dbpedia.org/resource/',
  'nso-v0':   'https://biosyncare.github.io/ont#',
  'nso-v1':   'https://biosyncarelab.github.io/ont#',
}
