#!/usr/bin/env node
// Deposit a tagged release into the existing Zenodo record, over the API.
//
// Why this exists rather than the GitHub webhook. The webhook binds deposits to
// one GitHub repository, and the repository is moving to `w3c-cg/sstim`
// (docs/ecosystem/W3C_REPOSITORY_MIGRATION_REPORT.md). Two consequences:
//
//   1. Both repositories currently carry identical commits, so the next tag
//      exists in both. Two connected repositories would mint two deposits and
//      two DOI series for one artifact.
//   2. Relinking the webhook to the new repository may or may not preserve the
//      concept DOI; that question is open with Zenodo as ticket #3326190.
//
// The concept DOI belongs to the Zenodo *record*, not to the GitHub repository,
// and depositing a new version into the existing record keeps one continuous
// series no matter which repository the tag came from. That makes the move
// invisible to every existing citation, and it needs no answer from anyone.
//
// The parent record is derived from `void.ttl`, so this script cannot deposit
// into the wrong series by carrying a stale number.
//
// Usage:
//   node scripts/zenodo-deposit.mjs --version 0.17.0                 # dry run
//   ZENODO_TOKEN=... node scripts/zenodo-deposit.mjs --version 0.17.0 --publish
//
// The token needs the `deposit:write` and `deposit:actions` scopes. Dry run is
// the default and performs no network write.

import { execFileSync } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const API = 'https://zenodo.org/api'
const read = (p) => readFileSync(resolve(ROOT, p), 'utf8')

/**
 * The record to deposit into: the latest published version, whose DOI void.ttl
 * already names. Zenodo's `newversion` action is taken on the latest version of
 * a series, and it is the same series the concept DOI resolves to.
 */
export function parentRecordId(voidTtl) {
  const doi = voidTtl.match(/dct:hasVersion\s+<https:\/\/doi\.org\/([^>]+)>/)?.[1]
  const id = doi?.match(/zenodo\.(\d+)$/)?.[1]
  if (!id) throw new Error('zenodo-deposit: void.ttl names no Zenodo version DOI to build on')
  return { id, doi }
}

/**
 * The deposit metadata. `.zenodo.json` is already in Zenodo's legacy deposit
 * schema, which is why it is the payload rather than a second copy of it: the
 * GitHub webhook read exactly this file, so switching to the API changes who
 * sends the metadata and not what the metadata says.
 */
export function depositMetadata({ zenodoJson, version, publicationDate }) {
  return { metadata: { ...zenodoJson, version, publication_date: publicationDate } }
}

/** What the webhook used to name the archive, kept stable across the move. */
export const archiveName = (version) => `sstim-v${version}.zip`

/** Build the archive from the tag, not the working tree. */
export function buildArchive(version, outDir) {
  const tag = `v${version}`
  const out = resolve(outDir, archiveName(version))
  execFileSync('git', ['archive', '--format=zip', `--prefix=sstim-${tag}/`, '-o', out, tag], {
    cwd: ROOT,
    stdio: ['ignore', 'ignore', 'inherit'],
  })
  return out
}

async function api(path, { token, method = 'GET', body, headers = {} } = {}) {
  const url = path.startsWith('http') ? path : `${API}${path}`
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body && !(body instanceof Uint8Array) ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body instanceof Uint8Array ? body : body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) {
    throw new Error(`zenodo-deposit: ${method} ${url} → ${response.status} ${await response.text()}`)
  }
  return response.status === 204 ? null : response.json()
}

/**
 * The five calls, in order. Step 3 is the one that is easy to forget and hard to
 * undo: `newversion` inherits a snapshot of the previous version's files, so the
 * old archive must be removed or the new release ships both.
 */
export const PLAN = [
  ['POST', '/deposit/depositions/{parent}/actions/newversion', 'returns the parent; the draft is at links.latest_draft'],
  ['GET', '{latest_draft}', 'read the draft id, its bucket and its inherited files'],
  ['DELETE', '/deposit/depositions/{draft}/files/{inherited}', 'drop the inherited archive so the version carries one file'],
  ['PUT', '{bucket}/{archive}', 'upload the new archive'],
  ['PUT', '/deposit/depositions/{draft}', 'set metadata from .zenodo.json plus version and publication_date'],
  ['POST', '/deposit/depositions/{draft}/actions/publish', 'mint the version DOI; the concept DOI is unchanged'],
]

async function main() {
  const argv = process.argv.slice(2)
  const arg = (name) => {
    const i = argv.indexOf(`--${name}`)
    return i === -1 ? undefined : argv[i + 1]
  }
  const publish = argv.includes('--publish')
  const zenodoJson = JSON.parse(read('.zenodo.json'))
  const { id: parent, doi: parentDoi } = parentRecordId(read('static/ontology/void.ttl'))
  const version = arg('version') ?? read('CITATION.cff').match(/^version:\s*(.+)$/m)?.[1]?.trim()
  const publicationDate =
    arg('date') ?? read('CITATION.cff').match(/^date-released:\s*(.+)$/m)?.[1]?.trim()

  if (!version) throw new Error('zenodo-deposit: pass --version, or set it in CITATION.cff')

  console.log(`zenodo-deposit: ${zenodoJson.title}`)
  console.log(`  version        ${version} (${publicationDate})`)
  console.log(`  builds on      ${parentDoi} (record ${parent})`)
  console.log(`  archive        ${archiveName(version)}`)
  console.log(`  supplement to  ${zenodoJson.related_identifiers?.find((r) => r.relation === 'isSupplementTo')?.identifier}`)

  if (!publish) {
    console.log('\n  DRY RUN. Would issue, in order:')
    for (const [method, path, note] of PLAN) console.log(`    ${method.padEnd(6)} ${path}\n           ${note}`)
    console.log('\n  Re-run with --publish and ZENODO_TOKEN set to execute.')
    console.log('  Check first that the tag exists and that no GitHub webhook is')
    console.log('  still connected to either repository, or the release mints twice.')
    return
  }

  const token = process.env.ZENODO_TOKEN
  if (!token) throw new Error('zenodo-deposit: --publish needs ZENODO_TOKEN')

  const archive = buildArchive(version, process.env.TMPDIR ?? '/tmp')
  console.log(`  built ${archive} (${statSync(archive).size} bytes)`)

  const parentRecord = await api(`/deposit/depositions/${parent}/actions/newversion`, {
    token,
    method: 'POST',
  })
  const draft = await api(parentRecord.links.latest_draft, { token })
  console.log(`  draft ${draft.id}`)

  for (const file of draft.files ?? []) {
    await api(`/deposit/depositions/${draft.id}/files/${file.id}`, { token, method: 'DELETE' })
    console.log(`  dropped inherited ${file.filename}`)
  }

  await api(`${draft.links.bucket}/${archiveName(version)}`, {
    token,
    method: 'PUT',
    body: new Uint8Array(readFileSync(archive)),
    headers: { 'Content-Type': 'application/octet-stream' },
  })
  console.log('  uploaded')

  await api(`/deposit/depositions/${draft.id}`, {
    token,
    method: 'PUT',
    body: depositMetadata({ zenodoJson, version, publicationDate }),
  })

  const published = await api(`/deposit/depositions/${draft.id}/actions/publish`, {
    token,
    method: 'POST',
  })
  console.log(`\n  published ${published.doi}`)
  console.log('  Update void.ttl, CITATION.cff, releaseMetadata.js, then `make truth-audit`.')
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
