// schema.org structured data describing the SSTIM ontology.
//
// Why this exists: measured 2026-09-05, the deployed site emitted no
// `application/ld+json` at all, so every crawler that reads structured data
// (Google Dataset Search among them) had nothing to hold about SSTIM. The
// scholarly graph knew the project through its DOI and no web index knew it as
// a dataset. See docs/ontology/INBOUND_REFERENCES.md §2.5.
//
// **What it describes is the ontology, not this page.** That is what makes it
// safe under PORTABLE_DEPLOYMENT §1.6d, which is also why the entrance carries
// no `og:url` or `og:image`: this artifact is deployed by other operators under
// their own origin, and a crawler never runs the script that could read that
// origin back. Every IRI below is a persistent one — the w3id namespace, the
// concept DOI, the canonical distribution — so the statement "this page
// describes the dataset at https://w3id.org/sstim" stays true wherever the page
// is served, and every copy contributes to one `@id` rather than minting a
// rival record.
//
// Values are imported, never retyped. `make truth-audit` compares
// releaseMetadata.js against sstim-core.ttl, void.ttl and CITATION.cff, so a
// release that moves the version, the DOI, the licence, the title or the
// canonical distribution cannot leave this description behind.

import {
  CONCEPT_DOI,
  CREATOR_NAME,
  CREATOR_ORCID,
  NAMESPACE_CATALOGUE_TTL,
  NAMESPACE_IRI,
  ONTOLOGY_LICENSE,
  ONTOLOGY_TITLE,
  RELEASE_DATE,
  RELEASE_VERSION,
  doiUrl,
} from '../entrance/releaseMetadata.js'
import { GITHUB_URL, W3C_GROUP_URL } from '../externalLinks.js'

// Describes the artifact, not what anyone should expect from using it, so the
// product-claim rule in CLAUDE.md §3.5 is not engaged. Keep it that way: this
// is a dataset abstract, and a benefit claim here would be a claim in machine
// -readable form, which is worse than one in prose.
const DESCRIPTION =
  'An open, versioned OWL and SKOS vocabulary for describing sensory stimulation: ' +
  'techniques, stimuli and their parameters, exposure and safety boundaries, session ' +
  'records, and the evidence attached to a claim. Published under CC BY 4.0 with a ' +
  'persistent namespace, immutable releases and archived DOIs.'

const KEYWORDS = [
  'sensory stimulation',
  'ontology',
  'controlled vocabulary',
  'OWL',
  'SKOS',
  'linked data',
  'neuromodulation',
  'auditory stimulation',
  'visual stimulation',
  'reproducible research',
]

/** The schema.org Dataset node for the ontology, as a plain object. */
export function sstimDataset() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': NAMESPACE_IRI,
    name: ONTOLOGY_TITLE,
    alternateName: 'SSTIM',
    description: DESCRIPTION,
    url: NAMESPACE_IRI,
    // The concept DOI, which names the continuing project across releases, and
    // the namespace IRI. A consumer that resolves either arrives at SSTIM.
    identifier: [doiUrl(CONCEPT_DOI), NAMESPACE_IRI],
    version: RELEASE_VERSION,
    datePublished: RELEASE_DATE,
    license: ONTOLOGY_LICENSE,
    inLanguage: 'en',
    isAccessibleForFree: true,
    creator: {
      '@type': 'Person',
      '@id': CREATOR_ORCID,
      name: CREATOR_NAME,
      identifier: CREATOR_ORCID,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Sensory Stimulation Vocabulary Community Group',
      url: W3C_GROUP_URL,
    },
    keywords: KEYWORDS,
    citation: doiUrl(CONCEPT_DOI),
    sameAs: [doiUrl(CONCEPT_DOI), GITHUB_URL, W3C_GROUP_URL],
    distribution: [
      {
        '@type': 'DataDownload',
        // The content-negotiated front door: the same IRI returns Turtle,
        // JSON-LD or RDF/XML by Accept header, which is why one entry names it
        // and the next names a file a plain GET can fetch.
        '@id': NAMESPACE_IRI,
        contentUrl: NAMESPACE_IRI,
        encodingFormat: 'text/turtle',
        name: 'SSTIM namespace catalogue, content negotiated',
      },
      {
        '@type': 'DataDownload',
        contentUrl: NAMESPACE_CATALOGUE_TTL,
        encodingFormat: 'text/turtle',
        name: 'SSTIM namespace catalogue (Turtle)',
      },
    ],
  }
}

/**
 * The same node as a string safe to place inside a `<script>` element.
 *
 * `<` is escaped to `<`, which is valid JSON and cannot close the element
 * early. Nothing in the data carries markup today; the escape is what keeps
 * that from becoming a question the next time a field is added.
 */
export function sstimDatasetJsonLd() {
  return JSON.stringify(sstimDataset(), null, 2).replace(/</g, '\\u003c')
}
