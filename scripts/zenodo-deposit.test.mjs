import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, test } from 'vitest'

import { archiveName, depositMetadata, parentRecordId, preflight } from './zenodo-deposit.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(resolve(ROOT, p), 'utf8')

test('the parent record is derived from void.ttl, never carried as a constant', () => {
  const { id, doi } = parentRecordId(read('static/ontology/void.ttl'))
  expect(doi).toMatch(/^10\.5281\/zenodo\.\d+$/)
  expect(id).toMatch(/^\d+$/)
  expect(doi).toContain(id)
})

test('a void.ttl with no version DOI fails loudly rather than depositing somewhere', () => {
  expect(() => parentRecordId(':a :b :c .')).toThrow(/no Zenodo version DOI/)
})

test('the deposit payload is .zenodo.json plus the release identity', () => {
  const zenodoJson = JSON.parse(read('.zenodo.json'))
  const payload = depositMetadata({ zenodoJson, version: '9.9.9', publicationDate: '2026-01-01' })

  expect(payload.metadata.version).toBe('9.9.9')
  expect(payload.metadata.publication_date).toBe('2026-01-01')
  expect(payload.metadata.title).toBe(zenodoJson.title)
  expect(payload.metadata.upload_type).toBe('software')
})

test('the deposit title matches the citation title', () => {
  // Zenodo's GitHub integration reads .zenodo.json and ignores CITATION.cff
  // entirely, so these two drifted apart silently once already: the published
  // record still said "BSC Lab" after CITATION.cff was renamed.
  const zenodoTitle = JSON.parse(read('.zenodo.json')).title
  const citationTitle = read('CITATION.cff').match(/^title:\s*"(.+)"\s*$/m)?.[1]
  expect(zenodoTitle).toBe(citationTitle)
})

test('the archive is named for the release, not for a repository', () => {
  // The webhook named it after the GitHub repository, which is the thing that
  // is moving. This name survives the move.
  expect(archiveName('0.17.0')).toBe('sstim-v0.17.0.zip')
})

test('preflight refuses the three deposits that cannot be taken back', () => {
  const clean = { version: '0.17.0', parentVersion: '0.16.0', tagExists: true, treeClean: true }
  expect(preflight(clean)).toEqual([])

  // A Zenodo version cannot be unpublished, only superseded, so each of these
  // is worth a refusal rather than a warning.
  expect(preflight({ ...clean, tagExists: false })[0]).toMatch(/no tag v0\.17\.0/)
  expect(preflight({ ...clean, treeClean: false })[0]).toMatch(/dirty/)
  expect(preflight({ ...clean, parentVersion: '0.17.0' })[0]).toMatch(/already publishes/)
})

test('the deposit payload drops the keys the legacy endpoint does not know', () => {
  // `custom_fields` belongs beside `metadata`, not inside it, and the legacy
  // endpoint refuses a deposit carrying a field it cannot name rather than
  // ignoring it. scripts/zenodo-sync.mjs is what sends that block.
  const zenodoJson = JSON.parse(read('.zenodo.json'))
  expect(zenodoJson.custom_fields).toBeTruthy()

  const payload = depositMetadata({ zenodoJson, version: '9.9.9', publicationDate: '2026-01-01' })
  expect(payload.metadata.custom_fields).toBeUndefined()
  // The controlled-vocabulary subjects, by contrast, are legacy fields and must
  // survive: they are the part of the record that lives in no other file.
  expect(payload.metadata.subjects.length).toBe(zenodoJson.subjects.length)
})
