import { DataFactory } from 'n3'

const { namedNode } = DataFactory

const ns = base => local => namedNode(base + local)

// ── BSC Lab ontology (sstim namespace) ───────────────────────────────────────
export const SSTIM    = ns('https://w3id.org/sstim#')
export const SSTIM_V  = ns('https://w3id.org/sstim/vocab#')
export const SSTIM_SH = ns('https://w3id.org/sstim/shapes#')
export const SSTIM_I  = ns('https://w3id.org/sstim/inst/')
export const BSC_INST = ns('https://w3id.org/bsc/preset/')

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
  'bsc-inst': 'https://w3id.org/bsc/preset/',
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
