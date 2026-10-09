import { applicationRoute } from '../../config/applicationUrls.js'
import { PREFIXES } from '../../rdf/namespaces.js'
import { GITHUB_URL } from '../externalLinks.js'

export const FEEDBACK_KINDS = Object.freeze([
  { value: 'correction', label: 'Correction or clarification' },
  { value: 'question', label: 'Question or ambiguity' },
  { value: 'alternative', label: 'Alternative interpretation' },
  { value: 'missing', label: 'Missing concept' },
  { value: 'mapping', label: 'External vocabulary mapping' },
])

const root = PREFIXES.sstim.replace(/#$/, '')
const rootUrl = new URL(root)
const kinds = new Map(FEEDBACK_KINDS.map(({ value, label }) => [value, label]))

/** Only accept an SSTIM identifier as an auto-filled target, not arbitrary URLs. */
export function normalizeSstimIri(value) {
  if (typeof value !== 'string' || value.length > 1024) return ''
  const trimmed = value.trim()
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'https:' || url.origin !== rootUrl.origin ||
        url.username || url.password || url.search) return ''
    if (url.pathname === rootUrl.pathname || url.pathname.startsWith(rootUrl.pathname + '/')) {
      return url.href
    }
  } catch {
    // An informal name is not a canonical IRI.
  }
  return ''
}

/** A stable entry point that an AI chat can link to without sending chat text. */
export function contributionRoute(targetIri = '', label = '') {
  const params = new URLSearchParams()
  const iri = normalizeSstimIri(targetIri)
  if (iri) {
    params.set('term', iri)
    if (typeof label === 'string' && label.trim()) params.set('label', label.trim().slice(0, 140))
  }
  return applicationRoute('/contribute/' + (params.size ? '?' + params.toString() : ''))
}

export function contributionPrefill(search = '') {
  const params = new URLSearchParams(search)
  const iri = normalizeSstimIri(params.get('term') ?? '')
  return {
    targetIri: iri,
    label: iri ? (params.get('label') ?? '').trim().slice(0, 140) : '',
  }
}

/** Produces an unsubmitted *public GitHub issue draft*. It never sends a request. */
export function feedbackIssueUrl({
  kind = 'correction', targetIri = '', label = '', description = '',
  suggestion = '', evidence = '', release = '',
} = {}) {
  const problem = description.trim().slice(0, 2500)
  if (!problem) return ''
  const rawTarget = targetIri.trim()
  const iri = normalizeSstimIri(rawTarget)
  if (rawTarget && !iri) return ''

  const type = kinds.get(kind) ?? kinds.get('question')
  const subject = (label.trim() || (iri ? iri.split(/[\/#]/).at(-1) : '') || 'general').slice(0, 110)
  const title = ('SSTIM feedback: ' + subject).slice(0, 180)
  const body = [
    '## Type of feedback', type,
    '## SSTIM concept / entry', iri || 'Not specified',
    '## What should be corrected, questioned, or added?', problem,
    '## Suggested wording or alternative', suggestion.trim().slice(0, 2000) || 'Not specified',
    '## Evidence, examples, or external reference', evidence.trim().slice(0, 1200) || 'Not specified',
    '## SSTIM version / release (if known)', release.trim().slice(0, 120) || 'Not specified',
    '---',
    '_Draft prepared in SSTIM Workbench. Not submitted automatically; please review before creating a public issue. This is a contribution for review, not a change to canonical SSTIM._',
  ].join('\n\n')
  return GITHUB_URL + '/issues/new?' + new URLSearchParams({ title, body }).toString()
}
