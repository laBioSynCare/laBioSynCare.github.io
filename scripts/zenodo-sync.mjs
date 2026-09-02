#!/usr/bin/env node
// Push `.zenodo.json` onto the published Zenodo record, without a new version.
//
// `scripts/zenodo-deposit.mjs` sends this metadata once, when a release is
// deposited. Nothing sends it afterwards, and two things follow from that:
//
//   1. A record keeps whatever it was published with. The v0.16.0 record still
//      read "BSC Lab — Sensory Stimulation Ontology (SSTIM) and open stimulation
//      platform", and still named `laBioSynCare/laBioSynCare.github.io` as the
//      repository it supplements, for a fortnight after both had moved on.
//   2. Metadata corrected by hand in Zenodo's own interface exists only there.
//      The controlled-vocabulary subjects on that record were added that way and
//      were in no file; the next deposit would have dropped every one of them.
//
// This script closes both. It reads `.zenodo.json`, translates it into the
// record metadata the REST API expects, and writes it to the published record:
// draft, update, publish. The DOI does not change, and no new version appears.
//
// Adapted from `tools/zenodo_sync.py` in ttm/music, which learned most of the
// awkward parts of this API the expensive way.
//
// Usage:
//   node scripts/zenodo-sync.mjs                          # dry run
//   ZENODO_TOKEN=... node scripts/zenodo-sync.mjs --publish
//
// The token needs the `deposit:write` and `deposit:actions` scopes, from
// https://zenodo.org/account/settings/applications/tokens/new/. Reading needs
// no token, so the dry run works without one.

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parentRecordId } from './zenodo-deposit.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const API = 'https://zenodo.org/api'
const read = (p) => readFileSync(resolve(ROOT, p), 'utf8')

/**
 * Zenodo serves records in two shapes. The default is its legacy one, where a
 * resource type is `{title, type}` and a relation is a bare string; the write
 * API speaks the other, where both are `{id}`. Reading in the wrong one and
 * writing it back strips exactly those fields, and the publish then fails
 * validation on them.
 */
const RDM = 'application/vnd.inveniordm.v1+json'

/**
 * Zenodo names contributor roles in lowercase; `.zenodo.json` uses the
 * capitalised form its own documentation shows.
 */
const ROLE_IDS = new Set([
  'contactperson', 'datacollector', 'datacurator', 'datamanager', 'distributor',
  'editor', 'hostinginstitution', 'producer', 'projectleader', 'projectmanager',
  'projectmember', 'registrationagency', 'registrationauthority', 'relatedperson',
  'researcher', 'researchgroup', 'rightsholder', 'supervisor', 'sponsor',
  'workpackageleader', 'other',
])

// ---------------------------------------------------------------------------
// Translating .zenodo.json into what the write API wants
// ---------------------------------------------------------------------------

/**
 * One creator or contributor, in the API's shape.
 *
 * Zenodo's interface takes the family name first, which is not obvious from
 * looking at it, and a name typed the other way round is silently recorded with
 * the given name as the surname. Splitting here means `.zenodo.json` is the only
 * place it can go wrong.
 */
export function asPerson(entry, { defaultRole } = {}) {
  const [family, given] = entry.name.split(/,(.*)/s).map((part) => part.trim())
  const person = { type: 'personal', family_name: family }
  if (given) person.given_name = given
  if (entry.orcid) person.identifiers = [{ scheme: 'orcid', identifier: entry.orcid }]

  const out = { person_or_org: person }
  // A list lets an affiliation carry its ROR identifier, which resolves to a
  // real organisation, alongside ones that have no ROR entry and can only be
  // named. The single string is the fallback, and is what a deposit reads.
  if (entry.affiliations) out.affiliations = entry.affiliations
  else if (entry.affiliation) out.affiliations = [{ name: entry.affiliation }]

  const role = (entry.type ?? defaultRole ?? '').toLowerCase()
  if (role) {
    if (!ROLE_IDS.has(role)) throw new Error(`zenodo-sync: unknown contributor role ${entry.type}`)
    out.role = { id: role }
  }
  return out
}

/**
 * One related identifier, in the API's shape. `.zenodo.json` holds the legacy
 * `relation: "isSupplementTo"`; the write API wants `relation_type: {id}`, and
 * the id is lowercase.
 */
export function asRelatedIdentifier(entry) {
  const related = {
    identifier: entry.identifier,
    scheme: entry.scheme,
    relation_type: { id: entry.relation.toLowerCase() },
  }
  if (entry.resource_type) related.resource_type = { id: entry.resource_type }
  return related
}

/**
 * The description, as the HTML Zenodo renders.
 *
 * Zenodo sanitises rather than escapes this field, so a description written as
 * markup arrives as markup. `.zenodo.json` carries paragraphs and links, and
 * wrapping that in another <p> would nest a block inside a paragraph, which the
 * sanitiser is free to unnest wherever it likes. Plain text still gets its one
 * paragraph, because Zenodo renders an unwrapped string as a single run.
 */
export const asHtml = (description) =>
  /<[a-z][^>]*>/i.test(description) ? description : `<p>${description}</p>`

/**
 * The metadata payload, from the contents of `.zenodo.json`.
 *
 * `subjectIds` maps a `"scheme\tterm"` key to Zenodo's own identifier for that
 * vocabulary entry, because the write API takes the id and `.zenodo.json` holds
 * the term and its vocabulary URI, which is what a deposit reads. Resolving is a
 * network call, so it is done by the caller and passed in.
 */
export function buildMetadata({ config, subjectIds, releaseNotes, withDescription = true }) {
  const subjects = config.keywords.map((keyword) => ({ subject: keyword }))
  for (const entry of config.subjects ?? []) {
    const id = subjectIds.get(`${entry.scheme}\t${entry.term}`)
    if (!id) throw new Error(`zenodo-sync: unresolved ${entry.scheme} subject ${entry.term}`)
    subjects.push({ id })
  }

  const metadata = {
    title: config.title,
    creators: config.creators.map((person) => asPerson(person, { defaultRole: 'projectleader' })),
    subjects,
  }
  if (config.contributors?.length) {
    metadata.contributors = config.contributors.map((person) => asPerson(person))
  }
  if (withDescription) metadata.description = asHtml(config.description)
  if (releaseNotes) {
    metadata.additional_descriptions = [
      { description: markdownToHtml(releaseNotes), type: { id: 'technical-info' } },
    ]
  }
  if (config.licenses?.length) {
    // Zenodo's rights field is a list, and this archive genuinely carries three
    // licences by artifact class (LICENSING.md is the scope matrix). The legacy
    // `license` field beside it takes one id and is all a deposit can send, so
    // after every deposit this sync is what restores the other two.
    metadata.rights = config.licenses.map((id) => ({ id }))
  }
  if (config.language) metadata.languages = [{ id: config.language }]
  if (config.related_identifiers?.length) {
    metadata.related_identifiers = config.related_identifiers.map(asRelatedIdentifier)
  }
  if (config.references?.length) {
    metadata.references = config.references.map((reference) => ({ reference }))
  }
  if (config.dates?.length) {
    // .zenodo.json holds these in the shape a deposit validates: "start", and a
    // capitalised type. The write API wants "date" and a lowercase id.
    metadata.dates = config.dates.map((entry) => ({
      date: entry.start ?? entry.date,
      type: { id: entry.type.toLowerCase() },
      ...(entry.description ? { description: entry.description } : {}),
    }))
  }
  return metadata
}

// ---------------------------------------------------------------------------
// The changelog entry, as an additional description
// ---------------------------------------------------------------------------

/**
 * The changelog's entry for `version`, as markdown, or null when the file has no
 * section for it.
 *
 * The lookahead has to accept end-of-file as well as the next heading, or the
 * oldest release in the file never matches and its notes silently fail to
 * attach.
 */
export function changelogSection(version, changelog) {
  const wanted = version.replace(/^v/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = changelog.match(new RegExp(`^## \\[${wanted}\\][^\\n]*\\n(.*?)(?=^## \\[|$(?![\\s\\S]))`, 'ms'))
  return match ? match[1].trim() : null
}

const escapeHtml = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#x27;')

/**
 * Escape the text, then put back the markup the changelog uses.
 *
 * Code spans are held out of the rest of the conversion: this changelog quotes
 * paths such as `static/ontology/**`, and a bold rule that ran over one would
 * pair those asterisks with the next ones outside the span and emit tags that
 * cross.
 */
export function inlineMarkup(text) {
  return text.split(/`([^`]+)`/).map((part, index) => {
    const escaped = escapeHtml(part)
    if (index % 2) return `<code>${escaped}</code>` // the inside of a code span
    return escaped
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  }).join('')
}

/**
 * Convert the subset of markdown the changelog actually uses: headings, bullet
 * lists one level deep, paragraphs, and inline code, links and bold.
 *
 * Deliberately not a general converter. Anything else in the changelog comes
 * through as plain text rather than silently mangled, and Zenodo sanitises what
 * it is given anyway.
 */
export function markdownToHtml(markdown) {
  const out = []
  let paragraph = []
  let depth = 0

  const flush = () => {
    if (paragraph.length) {
      out.push(`<p>${inlineMarkup(paragraph.join(' '))}</p>`)
      paragraph = []
    }
  }

  // A nested list belongs inside the item it hangs off, so closing a level
  // closes that item too: a bare <ul> inside a <ul> is not valid, and a
  // sanitiser is free to drop or re-parent it.
  const closeLists = (to) => {
    while (depth > to) {
      out.push(depth > 1 ? '</ul></li>' : '</ul>')
      depth -= 1
    }
  }

  for (const line of markdown.split('\n')) {
    const heading = line.match(/^(#{1,6}) +(.*)$/)
    const bullet = line.match(/^( *)- +(.*)$/)
    if (heading) {
      flush()
      closeLists(0)
      const level = Math.min(heading[1].length + 1, 6)
      out.push(`<h${level}>${inlineMarkup(heading[2])}</h${level}>`)
    } else if (bullet) {
      flush()
      // A nested level has to hang off an item, so a list that opens already
      // indented starts at depth one rather than emitting a <ul> inside a <ul>.
      const want = Math.min(bullet[1].length < 2 ? 1 : 2, depth + 1)
      closeLists(want)
      while (depth < want) {
        if (depth && out[out.length - 1].endsWith('</li>')) {
          // Reopen the item this nested list hangs off.
          out[out.length - 1] = out[out.length - 1].slice(0, -'</li>'.length)
        }
        out.push('<ul>')
        depth += 1
      }
      out.push(`<li>${inlineMarkup(bullet[2])}</li>`)
    } else if (!line.trim()) {
      flush()
      closeLists(0)
    } else if (depth) {
      // A wrapped continuation of the bullet above it.
      const last = out[out.length - 1]
      out[out.length - 1] = `${last.slice(0, -'</li>'.length)} ${inlineMarkup(line.trim())}</li>`
    } else {
      paragraph.push(line.trim())
    }
  }

  flush()
  closeLists(0)
  return out.join('\n')
}

// ---------------------------------------------------------------------------
// Reading and writing the record
// ---------------------------------------------------------------------------

/**
 * Call the API, retrying a read that failed for a reason worth retrying.
 *
 * Zenodo answers 504 often enough under load that a single gateway timeout has
 * already aborted this script twice: once resolving subjects, once on the POST
 * that opens the draft. Retried are reads, and the two writes that are
 * idempotent by construction: opening a draft returns the draft that already
 * exists rather than a second one, and the metadata PUT replaces the whole
 * document with the same body. The publish is never retried, because a POST
 * that may have been applied must not be sent again; re-running the whole
 * script is the safe way to finish that step. A 4xx is not retried either: it
 * says the request itself is wrong, so repeating it only waits longer for the
 * same answer.
 */
async function api(
  path,
  { token, method = 'GET', body, accept = 'application/json', idempotent = false } = {},
) {
  const url = path.startsWith('http') ? path : `${API}${path}`
  // Eight, not three: measured on 2026-09-02, Zenodo was answering roughly half
  // of all requests with a 30-second gateway timeout, and a publish run makes a
  // dozen calls. Three attempts would have finished it about a third of the time.
  const attempts = method === 'GET' || idempotent ? 8 : 1
  let last

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let response
    try {
      response = await fetch(url, {
        method,
        headers: {
          Accept: accept,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      })
    } catch (error) {
      last = new Error(`zenodo-sync: ${method} ${url} → ${error.message}`)
      await backoff(attempt, attempts)
      continue
    }
    if (response.ok) return response.status === 204 ? null : response.json()

    const text = await response.text()
    last = new Error(`zenodo-sync: ${method} ${url} → ${response.status} ${text}`)
    // Callers that can act on a refusal need the refusal itself, not its prose:
    // an already-pending community request is a 400 with a per-community reason.
    last.status = response.status
    try {
      last.body = JSON.parse(text)
    } catch {
      last.body = null
    }
    if (response.status < 500) break
    await backoff(attempt, attempts)
  }
  throw last
}

const backoff = (attempt, attempts) =>
  attempt < attempts
    ? new Promise((resolve) => setTimeout(resolve, Math.min(500 * 2 ** (attempt - 1), 8000)))
    : Promise.resolve()

/**
 * Zenodo's id for a subject whose vocabulary URI already contains it.
 *
 * Zenodo names a MeSH entry `mesh:<descriptor>` and a GEMET one
 * `gemet:concept/<n>`, and both are the tail of the URI `.zenodo.json` already
 * records, so those need no lookup at all. That matters: resolving every subject
 * by search is one request each, and on a slow day Zenodo answers a search in
 * ten to thirty seconds. Deriving what is derivable takes this from 41 requests
 * to the 8 EuroSciVoc terms, whose ids are numeric while their URIs are UUIDs.
 *
 * A derived id that were wrong would be rejected at publish rather than stored:
 * Zenodo validates a subject id against its own vocabulary.
 */
export function derivedSubjectId({ scheme, identifier = '' }) {
  if (scheme === 'MeSH') {
    return identifier.match(/id\.nlm\.nih\.gov\/mesh\/([A-Z0-9]+)$/)?.[1] &&
      `mesh:${identifier.match(/mesh\/([A-Z0-9]+)$/)[1]}`
  }
  if (scheme === 'GEMET') {
    const concept = identifier.match(/gemet\/concept\/(\d+)$/)?.[1]
    return concept && `gemet:concept/${concept}`
  }
  return null
}

/**
 * Zenodo's own identifier for one controlled-vocabulary entry.
 *
 * Insist on an exact match on both term and scheme rather than accepting the
 * closest suggestion: the search is fuzzy, and "Software" alone matches an entry
 * in each of the three vocabularies this record uses.
 */
export async function resolveSubject({ term, scheme }, search = defaultSearch) {
  for (const hit of await search(term)) {
    if (hit.subject === term && hit.scheme === scheme) return hit.id
  }
  throw new Error(
    `zenodo-sync: Zenodo has no ${scheme} subject called "${term}". Check it at ` +
      `${API}/subjects?q=${encodeURIComponent(term)}`,
  )
}

const defaultSearch = async (term) =>
  (await api(`/subjects?q=${encodeURIComponent(`"${term}"`)}&size=80`)).hits.hits

export async function resolveSubjects(subjects = [], search = defaultSearch) {
  const ids = new Map()
  for (const entry of subjects) {
    const id = derivedSubjectId(entry) ?? (await resolveSubject(entry, search))
    ids.set(`${entry.scheme}\t${entry.term}`, id)
  }
  return ids
}

/** A readable rendering of what would be sent, and of what it replaces. */
export function describe(metadata, { current, customFields } = {}) {
  const named = (person) =>
    `${person.person_or_org.family_name}, ${person.person_or_org.given_name ?? ''}`
  const free = metadata.subjects.filter((s) => s.subject)
  const linked = metadata.subjects.filter((s) => s.id)
  const was = (label, before, after) =>
    before === after ? `  ${label} unchanged` : `  ${label} was: ${before}\n  ${label} now: ${after}`

  const lines = [was('title      ', current?.title ?? '(unread)', metadata.title)]
  for (const person of metadata.creators) lines.push(`  creator     ${named(person)}`)
  for (const person of metadata.contributors ?? []) {
    lines.push(`  contributor ${named(person)}  [${person.role?.id ?? '-'}]`)
  }
  lines.push(
    `  keywords    ${free.length} free text (was ${current?.subjects?.filter((s) => !s.scheme).length ?? '?'})`,
    `  subjects    ${linked.length} controlled (was ${current?.subjects?.filter((s) => s.scheme).length ?? '?'})`,
    `  description ${metadata.description ? 'replaced from .zenodo.json' : 'left as it is on the record'}`,
  )
  const notes = metadata.additional_descriptions
  lines.push(
    `  notes       ${notes ? `${notes[0].description.length} characters of changelog HTML` : 'none found in the changelog'}`,
  )
  for (const [key, label] of [['related_identifiers', 'related   '], ['dates', 'dates     '], ['languages', 'languages '], ['references', 'references']]) {
    if (metadata[key]) lines.push(`  ${label}  ${metadata[key].length}`)
  }
  if (metadata.rights) {
    lines.push(`  licences    ${metadata.rights.map((r) => r.id).join(', ')}`)
  }
  if (customFields) lines.push(`  custom      ${Object.keys(customFields).sort().join(', ')}`)
  return lines.join('\n')
}

/**
 * Draft, update and publish. The DOI is unchanged by this, and no new version
 * appears: republishing a draft of a published record edits that record.
 *
 * A draft carries everything the published record has, and the PUT replaces the
 * metadata wholesale, so what is not being changed has to be read back and sent
 * again, in the shape the write API expects. That is why the draft is re-read as
 * RDM rather than trusting the response of the POST that created it.
 */
export async function sync(recordId, metadata, token, customFields) {
  console.log(`  drafting record ${recordId}`)
  await api(`/records/${recordId}/draft`, { method: 'POST', token, idempotent: true })
  const draft = await api(`/records/${recordId}/draft`, { token, accept: RDM })

  // custom_fields are a sibling of metadata in the payload, not a key inside it,
  // and the software block lives there.
  const payload = {
    metadata: { ...draft.metadata, ...metadata },
    custom_fields: { ...(draft.custom_fields ?? {}), ...(customFields ?? {}) },
  }

  console.log('  writing the metadata')
  await api(`/records/${recordId}/draft`, {
    method: 'PUT',
    body: payload,
    token,
    accept: RDM,
    idempotent: true,
  })

  console.log('  publishing')
  return api(`/records/${recordId}/draft/actions/publish`, { method: 'POST', token })
}

/** A refusal that means the request this run wanted to make already exists. */
const ALREADY_ASKED = /already (?:an? )?(?:open inclusion request|included)/i

/**
 * Ask each named community to include the record.
 *
 * Communities are not part of the metadata: a published record joins one
 * through an inclusion request that the community's curators accept or decline,
 * and nothing about the record changes until they do.
 *
 * The sync is meant to be run after every deposit, so most runs will find the
 * requests they would make already open, and Zenodo says so with a 400 and a
 * reason per community rather than with a success. Reporting that as a failure
 * would make the routine case look broken, so it is separated out: `pending` is
 * the expected outcome of asking twice, `failed` is a reason worth reading.
 */
export async function submitToCommunities(recordId, communities, token, call = api) {
  const attached = new Set(
    (await call(`/records/${recordId}/communities`, { token }))?.hits?.hits?.map((c) => c.slug) ??
      [],
  )
  const wanted = communities.map((c) => c.identifier ?? c).filter((slug) => !attached.has(slug))
  const result = { submitted: [], skipped: [...attached], pending: [], failed: [] }
  if (wanted.length === 0) return result

  let response
  try {
    response = await call(`/records/${recordId}/communities`, {
      method: 'POST',
      body: { communities: wanted.map((slug) => ({ id: slug })) },
      token,
    })
  } catch (error) {
    if (error.status !== 400 || !error.body?.errors) throw error
    response = error.body
  }

  for (const problem of response.errors ?? []) {
    const who = problem.community_id ?? problem.community ?? '?'
    if (ALREADY_ASKED.test(problem.message ?? '')) result.pending.push(who)
    else result.failed.push(`${who}: ${problem.message}`)
  }
  result.submitted = (response.processed ?? []).map((p) => p.community_id ?? p.id ?? '?')
  return result
}

/** Throw away a draft, leaving the published record exactly as it was. */
export const discard = (recordId, token) =>
  api(`/records/${recordId}/draft`, { method: 'DELETE', token })

async function main() {
  const argv = process.argv.slice(2)
  const arg = (name) => {
    const index = argv.indexOf(`--${name}`)
    return index === -1 ? undefined : argv[index + 1]
  }
  const publish = argv.includes('--publish')

  const config = JSON.parse(read('.zenodo.json'))
  const recordId = arg('record') ?? parentRecordId(read('static/ontology/void.ttl')).id
  const current = await api(`/records/${recordId}`, { accept: RDM })

  const version = current.metadata?.version ?? ''
  const releaseNotes =
    argv.includes('--no-release-notes') || !version ? null : changelogSection(version, read('CHANGELOG.md'))

  const metadata = buildMetadata({
    config,
    subjectIds: await resolveSubjects(config.subjects),
    releaseNotes,
    withDescription: !argv.includes('--keep-description'),
  })

  console.log(`record https://zenodo.org/records/${recordId} (version ${version || 'unnamed'})`)
  console.log(describe(metadata, { current: current.metadata, customFields: config.custom_fields }))

  if (config.communities?.length) {
    console.log(
      `  communities ${config.communities.map((c) => c.identifier).join(', ')} ` +
        '(inclusion requested, curators decide)',
    )
  }

  if (!publish) {
    console.log('\n  DRY RUN. Nothing was written. Re-run with --publish and ZENODO_TOKEN set.')
    console.log('  The DOI does not change and no new version is created; this edits the record.')
    return
  }

  const token = process.env.ZENODO_TOKEN
  if (!token) {
    throw new Error(
      'zenodo-sync: --publish needs ZENODO_TOKEN, with the deposit:write and ' +
        'deposit:actions scopes',
    )
  }

  let published
  try {
    published = await sync(recordId, metadata, token, config.custom_fields)
  } catch (error) {
    console.error('  discarding the draft; the published record is untouched')
    await discard(recordId, token).catch(() => {})
    throw error
  }
  console.log(`\n  done ${published.links.self_html}`)
  console.log(`  DOI ${published.doi ?? published.pids?.doi?.identifier} (unchanged)`)

  // The metadata is published by this point, so a community request that fails
  // is reported rather than thrown: it would otherwise read as though the sync
  // itself had failed, and re-running is how it gets retried anyway.
  if (config.communities?.length) {
    try {
      const result = await submitToCommunities(recordId, config.communities, token)
      for (const slug of result.skipped) console.log(`  community ${slug}: already a member`)
      for (const id of result.submitted) console.log(`  community ${id}: inclusion requested`)
      for (const id of result.pending) console.log(`  community ${id}: request already open`)
      for (const problem of result.failed) console.log(`  community ${problem}`)
    } catch (error) {
      console.log(`  communities not submitted: ${error.message}`)
      console.log('  the metadata above is published; re-run to retry the requests')
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
