import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, test } from 'vitest'

import {
  asHtml,
  asPerson,
  asRelatedIdentifier,
  buildMetadata,
  changelogSection,
  markdownToHtml,
  resolveSubject,
  resolveSubjects,
} from './zenodo-sync.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(resolve(ROOT, p), 'utf8')
const config = JSON.parse(read('.zenodo.json'))

test('a name is split family-first, the way Zenodo reads its own form', () => {
  // Typed the other way round, a name is silently recorded with the given name
  // as the surname, and the citation everyone copies is then wrong.
  const person = asPerson({ name: 'Fabbri, Renato', orcid: '0000-0002-9699-629X' })
  expect(person.person_or_org.family_name).toBe('Fabbri')
  expect(person.person_or_org.given_name).toBe('Renato')
  expect(person.person_or_org.identifiers).toEqual([
    { scheme: 'orcid', identifier: '0000-0002-9699-629X' },
  ])
})

test('a mononym keeps its one name as the family name, with no empty given name', () => {
  expect(asPerson({ name: 'Voltaire' }).person_or_org).toEqual({
    type: 'personal',
    family_name: 'Voltaire',
  })
})

test('an unknown contributor role fails before anything is published', () => {
  expect(() => asPerson({ name: 'A, B', type: 'Wizard' })).toThrow(/unknown contributor role/)
})

test('a relation becomes the lowercase vocabulary id the write API takes', () => {
  // The legacy deposit schema and the write API disagree on this, and sending
  // the legacy `isSupplementTo` fails validation at publish time.
  expect(asRelatedIdentifier({ relation: 'isSupplementTo', identifier: 'x', scheme: 'url' })).toEqual(
    { identifier: 'x', scheme: 'url', relation_type: { id: 'issupplementto' } },
  )
})

test('every controlled subject in .zenodo.json carries its vocabulary URI', () => {
  // Without the identifier a deposit records the term as free text, which is
  // what the `keywords` block is for; the point of `subjects` is the link.
  expect(config.subjects.length).toBeGreaterThan(0)
  for (const subject of config.subjects) {
    expect(subject.scheme).toMatch(/^(MeSH|EuroSciVoc|GEMET)$/)
    expect(subject.identifier).toMatch(/^https?:\/\//)
  }
})

test('a subject resolves only on an exact term and scheme, never the nearest hit', async () => {
  // "Software" is a real entry in all three vocabularies this record uses, and
  // the search is fuzzy, so the first hit is routinely the wrong vocabulary.
  const search = async () => [
    { id: 'mesh:D012984', subject: 'Software', scheme: 'MeSH' },
    { id: 'gemet:concept/7842', subject: 'Software', scheme: 'GEMET' },
  ]
  expect(await resolveSubject({ term: 'Software', scheme: 'GEMET' }, search)).toBe(
    'gemet:concept/7842',
  )
  await expect(resolveSubject({ term: 'Software', scheme: 'EuroSciVoc' }, search)).rejects.toThrow(
    /no EuroSciVoc subject called "Software"/,
  )
})

test('the payload keeps free-text keywords and controlled subjects in one list', () => {
  // Zenodo has a single `subjects` field: an entry with `subject` is free text,
  // an entry with `id` is a vocabulary link. Sending only one kind drops the other.
  const subjectIds = new Map(
    (config.subjects ?? []).map((s, index) => [`${s.scheme}\t${s.term}`, `vocab:${index}`]),
  )
  const metadata = buildMetadata({ config, subjectIds })

  expect(metadata.subjects.filter((s) => s.subject)).toHaveLength(config.keywords.length)
  expect(metadata.subjects.filter((s) => s.id)).toHaveLength(config.subjects.length)
  expect(metadata.title).toBe(config.title)
  expect(metadata.description).toContain('SSTIM Workbench')
  expect(metadata.related_identifiers.map((r) => r.relation_type.id)).toContain('issupplementto')
  expect(metadata.dates[0].type).toEqual({ id: 'created' })
  expect(metadata.languages).toEqual([{ id: 'eng' }])
})

test('a subject the lookup never resolved stops the sync instead of being dropped', () => {
  expect(() => buildMetadata({ config, subjectIds: new Map() })).toThrow(/unresolved MeSH subject/)
})

test('--keep-description leaves the record description alone', () => {
  const subjectIds = new Map(
    (config.subjects ?? []).map((s) => [`${s.scheme}\t${s.term}`, 'vocab:1']),
  )
  expect(buildMetadata({ config, subjectIds, withDescription: false }).description).toBeUndefined()
})

test('the changelog section for a version is found by its heading', () => {
  const changelog = read('CHANGELOG.md')
  // The record carries the version as `v0.16.0`; the changelog heads it `[0.16.0]`.
  const notes = changelogSection('v0.16.0', changelog)
  expect(notes).toBeTruthy()
  expect(notes).not.toContain('## [0.15.0]')
  expect(changelogSection('9.9.9', changelog)).toBeNull()
})

test('the oldest release in the file matches too, with no heading after it', () => {
  // A lookahead that only accepts the next heading silently drops the last
  // section, and the release notes for it never attach.
  expect(changelogSection('1.0.0', '## [1.0.0] - 2026-01-01\n\nThe first one.')).toBe(
    'The first one.',
  )
})

test('markdown becomes the small subset of HTML Zenodo keeps', () => {
  const html = markdownToHtml(
    ['### Fixed', '', 'A paragraph with **bold**, `code` and [a link](https://w3id.org/sstim).', '',
      '- one', '- two', '  wrapped', '', 'After.'].join('\n'),
  )
  expect(html).toContain('<h4>Fixed</h4>')
  expect(html).toContain('<strong>bold</strong>')
  expect(html).toContain('<code>code</code>')
  expect(html).toContain('<a href="https://w3id.org/sstim">a link</a>')
  expect(html).toContain('<li>two wrapped</li>')
  expect(html).toContain('</ul>')
  expect(html).toContain('<p>After.</p>')
})

test('asterisks inside a code span are not read as bold', () => {
  // The changelog quotes glob paths. A bold rule that ran over them would pair
  // those asterisks with the next ones outside the span and emit crossing tags.
  const html = markdownToHtml('The frozen `static/ontology/**` tree stays **immutable**.')
  expect(html).toBe(
    '<p>The frozen <code>static/ontology/**</code> tree stays <strong>immutable</strong>.</p>',
  )
})

test('a nested list is closed from the inside out, inside the item it hangs off', () => {
  // A bare <ul> inside a <ul> is not valid, and a sanitiser is free to drop it.
  const html = markdownToHtml('- outer\n  - inner\n\nAfter.')
  expect(html).toContain('<li>outer\n<ul>')
  expect(html.indexOf('</ul></li>')).toBeGreaterThan(html.indexOf('<li>inner</li>'))
  expect(html.endsWith('<p>After.</p>')).toBe(true)
})

test('the whole live changelog entry converts without unbalanced tags', () => {
  const html = markdownToHtml(changelogSection('0.16.0', read('CHANGELOG.md')))
  const open = (tag) => (html.match(new RegExp(`<${tag}>`, 'g')) ?? []).length
  const close = (tag) => (html.match(new RegExp(`</${tag}>`, 'g')) ?? []).length
  expect(open('ul')).toBe(close('ul'))
  expect(open('li')).toBe(close('li'))
  expect(open('p')).toBe(close('p'))
})

test('resolveSubjects keys every entry by scheme and term together', async () => {
  // Two vocabularies use the same term, so the term alone is not a key: one
  // would overwrite the other and the record would lose a subject.
  const ids = await resolveSubjects(
    [{ term: 'Software', scheme: 'MeSH' }, { term: 'Software', scheme: 'GEMET' }],
    async () => [
      { id: 'mesh:D012984', subject: 'Software', scheme: 'MeSH' },
      { id: 'gemet:concept/7842', subject: 'Software', scheme: 'GEMET' },
    ],
  )
  expect(ids.size).toBe(2)
  expect(ids.get('GEMET\tSoftware')).toBe('gemet:concept/7842')
})

test('a description already written as HTML is not wrapped again', () => {
  // Zenodo sanitises rather than escapes this field. Wrapping markup in another
  // <p> nests a block inside a paragraph, which the sanitiser may unnest anywhere.
  expect(asHtml('<p>One.</p><p>Two.</p>')).toBe('<p>One.</p><p>Two.</p>')
  expect(asHtml('Plain text.')).toBe('<p>Plain text.</p>')
  expect(buildMetadata({ config, subjectIds: ids() }).description).toBe(config.description)
})

test('every related identifier names a relation the write API knows', () => {
  // The id is lowercase and comes from Zenodo's own vocabulary; a typo fails at
  // publish, after the draft has been created.
  const known = new Set(['isdocumentedby', 'issupplementto', 'isidenticalto', 'haspart',
    'ispartof', 'isdescribedby', 'references', 'iscitedby', 'isderivedfrom'])
  for (const related of buildMetadata({ config, subjectIds: ids() }).related_identifiers) {
    expect(known).toContain(related.relation_type.id)
    expect(related.scheme).toMatch(/^(url|doi)$/)
  }
})

test('the linkage keeps both repositories and the registries that carry a record', () => {
  const by = (relation) =>
    config.related_identifiers.filter((r) => r.relation === relation).map((r) => r.identifier)

  // The legacy origin is not history: it still serves the byte-identical frozen
  // manifests whose root-absolute paths pin them to it.
  expect(by('isIdenticalTo')).toContain('https://github.com/laBioSynCare/laBioSynCare.github.io')
  expect(by('isSupplementTo')).toContain('https://github.com/w3c-cg/sstim')
  expect(by('isDescribedBy').length).toBeGreaterThanOrEqual(4)
  expect(by('isDescribedBy')).toContain('10.25504/FAIRsharing.660ff4')
})

function ids() {
  return new Map((config.subjects ?? []).map((s) => [`${s.scheme}\t${s.term}`, 'vocab:1']))
}
