import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

import {
  checkRecordRoutes,
  recordProblems,
  requestPath,
  unresolvedIdentifiers,
} from './check-w3id-record-routes.mjs'
import { parseRules } from './w3id-negotiation.mjs'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const htaccess = readFileSync(join(repoRoot, 'docs/ecosystem/w3id/sstim/.htaccess'), 'utf8')
const BEGIN = '# BEGIN audited committed record routes'
const END = '# END audited committed record routes'
const SLOW = 60_000

const withRules = text => checkRecordRoutes({ rules: parseRules(text) })

describe('the committed record routes (ADR 0065)', () => {
  test('resolve every committed record, and nothing that is not one', () => {
    const { problems, records, documents, byFamily } = withRules(htaccess)
    expect(problems).toEqual([])
    expect(records).toBeGreaterThan(150)
    expect(documents).toBe(byFamily.evidence.length + byFamily.reference.length)
    for (const family of ['preset', 'protocol', 'experiment', 'evidence', 'reference']) {
      expect(byFamily[family]?.length, family).toBeGreaterThan(0)
    }
  }, SLOW)

  test('fail for every record when the block is gone, and name what no longer resolves', () => {
    const start = htaccess.indexOf(BEGIN)
    const without = htaccess.slice(0, start) + htaccess.slice(htaccess.indexOf(END) + END.length)
    const { problems } = withRules(without)
    expect(problems.some(problem => problem.startsWith('https://w3id.org/sstim/ref/IACCARINO_2016:'))).toBe(true)
    expect(problems.some(problem => problem.includes('/protocol/chan-2022-40hz-audiovisual-daily-home-use'))).toBe(true)
    expect(problems.some(problem => problem.includes('resolves nowhere'))).toBe(true)
    expect(problems.some(problem => problem.startsWith('no rule uses the exempted record pattern'))).toBe(true)
  }, SLOW)

  test('reject an aggregate target, which would let a missing name land on a real file', () => {
    const aggregate = htaccess.replace(
      'ontology/records/ref/$1.ttl',
      'ontology/instances/references/references.ttl',
    )
    const { problems } = withRules(aggregate)
    expect(problems).toContain(
      'reference: ref/NOT_A_COMMITTED_RECORD names no record but reaches the published ' +
      'https://w3c-cg.github.io/sstim/ontology/instances/references/references.ttl',
    )
  }, SLOW)

  test('catch a grammar too narrow for the records it must route', () => {
    const narrow = htaccess.replaceAll('([a-z0-9-]+(?:/[a-z0-9-]+)*)', '([a-z0-9-]+)')
    const { problems } = withRules(narrow)
    expect(problems.some(problem =>
      problem.startsWith('https://w3id.org/sstim/implementation/bsclab/evidence/alpha-attention-memory/revision/1:'))).toBe(true)
  }, SLOW)

  test('catch a grammar so broad that a path outside every family resolves', () => {
    const broad = htaccess.replaceAll('(preset|protocol|experiment)/([a-z0-9-]+)/?$', '(preset|protocol|experiment)/(.+?)/?$')
    const { problems } = withRules(broad)
    expect(problems).toContain(
      'implementation/bsclab/preset/heal-theta-breathing-seed/voice is outside every record grammar but answers 303',
    )
  }, SLOW)
})

describe('one record', () => {
  test('is unpublished when its record document is missing', () => {
    const identifier = 'https://w3id.org/sstim/implementation/bsclab/evidence/population/human-scalp-eeg'
    const problems = recordProblems(identifier, { rules: parseRules(htaccess), documents: new Map() })
    expect(problems).toEqual([
      `${identifier}: records/implementation/bsclab/evidence/population/human-scalp-eeg.ttl is not published`,
    ])
  })

  test('is unpublished when no file is named after it', () => {
    const identifier = 'https://w3id.org/sstim/implementation/bsclab/protocol/not-a-committed-record'
    const problems = recordProblems(identifier, { rules: parseRules(htaccess), documents: new Map() })
    expect(problems).toEqual([`${identifier}: instances/protocols/not-a-committed-record.ttl is not published`])
  })
})

describe('identifier coverage', () => {
  test('asks w3id.org for the document, never the fragment', () => {
    expect(requestPath('https://w3id.org/sstim')).toBe('')
    expect(requestPath('https://w3id.org/sstim#Preset')).toBe('')
    expect(requestPath('https://w3id.org/sstim/vocab#alpha')).toBe('vocab')
    expect(requestPath('https://w3id.org/sstim/implementation/bsclab/protocol/x#arm')).toBe('implementation/bsclab/protocol/x')
    expect(requestPath('https://w3id.org/sstimulus/x')).toBeNull()
    expect(requestPath('https://example.org/sstim/x')).toBeNull()
  })

  test('excuses only identifiers unrouted on purpose', () => {
    const root = mkdtempSync(join(tmpdir(), 'sstim-record-routes-'))
    try {
      mkdirSync(join(root, 'static/ontology/instances'), { recursive: true })
      writeFileSync(join(root, 'static/ontology/instances/fixture.ttl'), `
        @prefix bsclab-session: <https://w3id.org/sstim/implementation/bsclab/session/> .
        bsclab-session:synthetic-001 <https://w3id.org/sstim#follows> bsclab-session:real-001 .
        <https://w3id.org/sstim/graph/example> a <https://w3id.org/sstim#Graph> .
      `)
      const { unresolved } = unresolvedIdentifiers({ rules: parseRules(htaccess), root })
      expect(unresolved).toEqual([
        'https://w3id.org/sstim/implementation/bsclab/session/real-001 ' +
        '(first mentioned in static/ontology/instances/fixture.ttl) resolves nowhere',
      ])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
