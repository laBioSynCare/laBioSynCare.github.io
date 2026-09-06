import { describe, expect, it } from 'vitest'
import { sstimDataset, sstimDatasetJsonLd } from './datasetJsonLd.js'
import {
  CONCEPT_DOI,
  NAMESPACE_CATALOGUE_TTL,
  NAMESPACE_IRI,
  ONTOLOGY_LICENSE,
  ONTOLOGY_TITLE,
  RELEASE_DATE,
  RELEASE_VERSION,
} from '../entrance/releaseMetadata.js'

describe('SSTIM schema.org description', () => {
  it('is a Dataset identified by the persistent namespace IRI', () => {
    const data = sstimDataset()
    expect(data['@context']).toBe('https://schema.org')
    expect(data['@type']).toBe('Dataset')
    expect(data['@id']).toBe(NAMESPACE_IRI)
    expect(data.url).toBe(NAMESPACE_IRI)
  })

  it('carries every field Google Dataset Search requires or recommends', () => {
    const data = sstimDataset()
    for (const field of ['name', 'description', 'license', 'creator', 'identifier', 'distribution']) {
      expect(data[field], field).toBeTruthy()
    }
    expect(data.description.length).toBeGreaterThan(50)
  })

  it('quotes the release identity rather than a copy of it', () => {
    // The point of the test: these come from releaseMetadata.js, which
    // `make truth-audit` compares against sstim-core.ttl, void.ttl and
    // CITATION.cff. A hardcoded value here would pass this file and publish a
    // stale licence or version to every crawler.
    const data = sstimDataset()
    expect(data.name).toBe(ONTOLOGY_TITLE)
    expect(data.version).toBe(RELEASE_VERSION)
    expect(data.datePublished).toBe(RELEASE_DATE)
    expect(data.license).toBe(ONTOLOGY_LICENSE)
    expect(data.identifier).toContain(`https://doi.org/${CONCEPT_DOI}`)
    expect(data.distribution.map((d) => d.contentUrl)).toContain(NAMESPACE_CATALOGUE_TTL)
  })

  it('names only persistent identifiers, never this deployment origin', () => {
    // PORTABLE_DEPLOYMENT §1.6d: other operators serve this artifact from their
    // own origin, and a crawler never runs the script that could read it back.
    // Every URL here must therefore be one that is true wherever the page is.
    const urls = JSON.stringify(sstimDataset()).match(/https?:\/\/[^"]+/g) ?? []
    expect(urls.length).toBeGreaterThan(5)
    for (const url of urls) {
      expect(
        /^https:\/\/(w3id\.org\/sstim|doi\.org|orcid\.org|www\.w3\.org|github\.com\/w3c-cg|w3c-cg\.github\.io|schema\.org|creativecommons\.org)/.test(url),
        url,
      ).toBe(true)
    }
  })

  it('serialises with no character that can close a script element', () => {
    const json = sstimDatasetJsonLd()
    expect(json).not.toContain('<')
    expect(JSON.parse(json)['@id']).toBe(NAMESPACE_IRI)
  })
})
