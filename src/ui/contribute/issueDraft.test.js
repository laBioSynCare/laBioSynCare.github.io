import { describe, expect, it } from 'vitest'
import {
  FEEDBACK_KINDS, normalizeSstimIri, contributionRoute,
  contributionPrefill, feedbackIssueUrl,
} from './issueDraft.js'

const term = 'https://w3id.org/sstim/vocab#techBinauralBeats'

describe('SSTIM contribution links', () => {
  it('only prefills SSTIM IRIs', () => {
    expect(normalizeSstimIri(term)).toBe(term)
    expect(normalizeSstimIri('https://w3id.org/sstim#Stimulus')).toBe('https://w3id.org/sstim#Stimulus')
    expect(normalizeSstimIri('https://w3id.org/sstim/framework/bsc/vocab#Voice'))
      .toBe('https://w3id.org/sstim/framework/bsc/vocab#Voice')
    for (const input of [
      'http://w3id.org/sstim#Stimulus',
      'https://w3id.org/sstim-evil#Stimulus',
      'https://w3id.org.evil.test/sstim#Stimulus',
      'https://w3id.org/sstim?untrusted=1#Stimulus',
      'javascript:alert(1)', 'sstim:Stimulus', null, '',
    ]) expect(normalizeSstimIri(input)).toBe('')
  })

  it('creates a stable entry route and round-trips a fragment IRI and label', () => {
    const route = contributionRoute(term, 'Binaural beats')
    expect(route.startsWith('/contribute/?')).toBe(true)
    const search = route.slice(route.indexOf('?'))
    expect(contributionPrefill(search)).toEqual({ targetIri: term, label: 'Binaural beats' })
    expect(contributionRoute('https://example.com/no')).toBe('/contribute/')
    expect(contributionPrefill('?label=Fake&term=https://example.com/no'))
      .toEqual({ targetIri: '', label: '' })
  })

  it('never embeds proposed private feedback into entry-point links', () => {
    const route = contributionRoute(term)
    expect(route).not.toContain('body=')
    expect(route).not.toContain('description=')
  })
})

describe('reviewable GitHub drafts', () => {
  it('requires an actual description and preserves Unicode and the exact target', () => {
    expect(feedbackIssueUrl({ description: '   ' })).toBe('')
    const url = new URL(feedbackIssueUrl({
      kind: 'alternative', targetIri: term, label: 'Binaural beats',
      description: 'Une distinction à préciser: vibração / percepción.',
      suggestion: 'Represent competing interpretations, not one true claim.',
      evidence: 'https://example.edu/article', release: '0.19.0',
    }))
    expect(url.origin).toBe('https://github.com')
    expect(url.pathname).toBe('/w3c-cg/sstim/issues/new')
    expect(url.searchParams.get('title')).toContain('Binaural beats')
    const body = url.searchParams.get('body')
    for (const x of [term, 'Alternative interpretation', 'vibração / percepción',
      'Represent competing interpretations', 'https://example.edu/article', '0.19.0',
      'Not submitted automatically']) expect(body).toContain(x)
  })

  it('rejects an incorrect target instead of silently assigning the wrong concept', () => {
    expect(feedbackIssueUrl({ description: 'A correction', targetIri: 'https://example.com/term' })).toBe('')
  })

  it('supports target-free missing-concept proposals without defining RDF classes', () => {
    const url = feedbackIssueUrl({ kind: 'missing', description: 'A stimulus phenomenon not yet described.' })
    expect(new URL(url).searchParams.get('body')).toContain('Missing concept')
    expect(FEEDBACK_KINDS).toHaveLength(5)
  })
})
