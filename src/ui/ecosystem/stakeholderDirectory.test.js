import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DOMAIN_REVIEW_STATUSES } from './architecture.js'
import { parseLiveAgents } from './liveAgents.js'
import {
  DIRECTORY_ERAS,
  DIRECTORY_KINDS,
  DIRECTORY_MODALITIES,
  DIRECTORY_REVIEWED,
  STAKEHOLDERS,
} from './stakeholderDirectory.js'

const ids = values => new Set(values.map(value => value.id))

describe('stakeholder directory (ADR 0062)', () => {
  it('lists every entry once, under a stable id', () => {
    const seen = new Set()
    for (const entry of STAKEHOLDERS) {
      expect(entry.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(seen.has(entry.id), entry.id).toBe(false)
      seen.add(entry.id)
    }
    expect(STAKEHOLDERS.length).toBeGreaterThanOrEqual(50)
  })

  it('classifies every entry with the controlled facets', () => {
    const kinds = ids(DIRECTORY_KINDS)
    const modalities = ids(DIRECTORY_MODALITIES)
    const eras = ids(DIRECTORY_ERAS)
    const reviews = ids(DOMAIN_REVIEW_STATUSES)
    for (const entry of STAKEHOLDERS) {
      expect(kinds.has(entry.kind), entry.id).toBe(true)
      expect(eras.has(entry.era), entry.id).toBe(true)
      expect(reviews.has(entry.review), entry.id).toBe(true)
      expect(entry.modalities.length, entry.id).toBeGreaterThan(0)
      for (const modality of entry.modalities) expect(modalities.has(modality), `${entry.id} ${modality}`).toBe(true)
    }
  })

  it('cites one public https source and carries no contact details', () => {
    for (const entry of STAKEHOLDERS) {
      expect(new URL(entry.url).protocol, entry.id).toBe('https:')
      expect(`${entry.name} ${entry.summary}`, entry.id).not.toMatch(/@|mailto:|tel:|\+\d{6,}/)
    }
  })

  it('describes the field without making product claims', () => {
    // CLAUDE.md §3.5: these are UI strings. Describing what another company's
    // device is for is accurate description; a claim that it works is not ours
    // to make.
    const claim = /\b(treats?|cures?|fix(es)?|eliminates?|clinically proven|scientifically proven|proven to|guaranteed)\b/i
    for (const entry of STAKEHOLDERS) {
      expect(entry.summary, entry.id).not.toMatch(claim)
      expect(entry.summary, entry.id).toMatch(/\.$/)
    }
  })

  it('names a live-graph agent path, never a claim that one exists', () => {
    const paths = new Set()
    for (const entry of STAKEHOLDERS.filter(entry => entry.agent)) {
      expect(entry.agent, entry.id).toMatch(/^(organization|specialist)\/[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(paths.has(entry.agent), entry.agent).toBe(false)
      paths.add(entry.agent)
    }
  })

  it('dates the source check', () => {
    expect(DIRECTORY_REVIEWED).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('live agents', () => {
  it('reads the agents of an ecosystem graph by their path', () => {
    const turtle = readFileSync(new URL('../../../static/ontology/instances/ecosystem/fixtures/synthetic-ecosystem.ttl', import.meta.url), 'utf-8')
    const agents = parseLiveAgents(turtle)
    expect([...agents.keys()].sort()).toEqual([
      'organization/synthetic-aurora-lab',
      'organization/synthetic-resonance-coop',
      'specialist/synthetic-alex-rivera',
    ])
    const person = agents.get('specialist/synthetic-alex-rivera')
    expect(person.kind).toBe('person')
    expect(person.name).not.toBe('')
    expect(person.relationships).toBeGreaterThan(0)
    expect(agents.get('organization/synthetic-aurora-lab').kind).toBe('organization')
  })

  it('answers nothing for a graph without agents', () => {
    expect(parseLiveAgents('').size).toBe(0)
  })
})
