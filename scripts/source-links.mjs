#!/usr/bin/env node
// SSTIM cites its own repository at an immutable ref, never at a branch (GB-08).
//
// A module's rdfs:seeAlso to an ADR is a citation, and a release that cites
// `blob/main` cites whatever the branch says later: a rewritten document
// silently changes what a frozen release points to, and a renamed one breaks
// it. Until 0.19.0 every such link also named the legacy repository rather than
// w3c-cg/sstim, which ADR 0059 makes the publisher and the registries name.
//
// The rule, for every live Turtle file (modules, profiles, framework
// vocabularies, public instances):
//
//   - a link to a file or directory in the repository names w3c-cg/sstim and an
//     immutable ref: a release tag, a full commit SHA, or the tag of the release
//     this line becomes; and the path exists at that ref (for the coming tag, in
//     the working tree, which is what that tag will hold);
//   - the repository root identifies the source rather than citing a document,
//     so it may stay unpinned;
//   - nothing names the legacy repository.
//
// void.ttl is held to the last rule only. Its landing pages describe the public
// instance datasets, which change between releases by design, so a branch is
// the right thing for them to name.
//
// release-prepare re-pins every module and profile to the release being cut
// (pinSourceLinks), so a frozen release cites the repository as released.
//
// Usage:
//   node scripts/source-links.mjs              check every live file
//   node scripts/source-links.mjs --migrate    rewrite legacy links, once

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ONTOLOGY = join(ROOT, 'static', 'ontology')

export const REPOSITORY = 'https://github.com/w3c-cg/sstim'
export const LEGACY_REPOSITORY = 'https://github.com/laBioSynCare/laBioSynCare.github.io'

// Inside an IRI or a literal a URL ends at `>`, a quote or whitespace.
const END = String.raw`(?=[>"\s]|$)`
const REPO_LINK = new RegExp(
  String.raw`https://github\.com/w3c-cg/sstim(?:/(blob|tree)/([^/>"\s]+)/([^>"\s]*))?` + END,
  'g',
)
const LEGACY_LINK = new RegExp(
  String.raw`https://github\.com/laBioSynCare/laBioSynCare\.github\.io(?:/(blob|tree)/([^/>"\s]+)/([^>"\s]*))?` + END,
  'g',
)
const RELEASE_TAG = /^v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/
const COMMIT_SHA = /^[0-9a-f]{40}$/

/** The tag the development line becomes: `0.19.0-dev` → `v0.19.0`. */
export function comingTag(suiteVersion) {
  return `v${String(suiteVersion).replace(/-dev$/, '')}`
}

/**
 * Problems with one file's links, or none.
 *
 * `hasPathAt(ref, path)` answers whether the repository holds `path` at `ref`
 * and `existsInTree(path)` whether the working tree does; both are injected so
 * the rule can be tested without a repository.
 */
export function checkSourceLinks(text, { file, upcomingTag, hasPathAt, existsInTree, branchesAllowed = false }) {
  const problems = []
  for (const match of text.matchAll(LEGACY_LINK)) {
    problems.push(`${file}: ${match[0]} names the legacy repository, not ${REPOSITORY}`)
  }
  if (branchesAllowed) return problems
  for (const [url, kind, ref, path] of text.matchAll(REPO_LINK)) {
    if (!kind) continue
    if (ref === upcomingTag) {
      if (!existsInTree(path)) problems.push(`${file}: ${url} names a path the coming ${ref} will not hold`)
    } else if (RELEASE_TAG.test(ref) || COMMIT_SHA.test(ref)) {
      if (!hasPathAt(ref, path)) problems.push(`${file}: ${url} names a path ${ref} does not hold`)
    } else {
      problems.push(`${file}: ${url} cites the moving ref "${ref}"; pin it to a release tag or a commit`)
    }
  }
  return problems
}

/**
 * Pin every repository link to `tag`, which the working tree is about to become.
 * Throws on a path the tree lacks, because a frozen release must not cite a
 * file its own tag does not contain.
 */
export function pinSourceLinks(text, tag, { file, existsInTree }) {
  let pinned = 0
  const out = text.replace(REPO_LINK, (url, kind, ref, path) => {
    if (!kind) return url
    if (!existsInTree(path)) throw new Error(`${file}: ${url} names a path that ${tag} will not hold`)
    pinned += 1
    return `${REPOSITORY}/${kind}/${tag}/${path}`
  })
  return { text: out, pinned }
}

/**
 * Move legacy links to the repository, and pin every branch link there.
 * `refFor(path, kind)` chooses the ref; the repository root stays a root.
 */
export function migrateLinks(text, refFor, { branchesAllowed = false } = {}) {
  const legacyMoved = text.replace(LEGACY_LINK, (url, kind, ref, path) =>
    kind ? `${REPOSITORY}/${kind}/${refFor(path, kind)}/${path}` : REPOSITORY)
  if (branchesAllowed) return legacyMoved
  return legacyMoved.replace(REPO_LINK, (url, kind, ref, path) =>
    kind && !RELEASE_TAG.test(ref) && !COMMIT_SHA.test(ref)
      ? `${REPOSITORY}/${kind}/${refFor(path, kind)}/${path}`
      : url)
}

/** Every live Turtle file, and whether its links may name a branch. */
export function liveFiles() {
  const files = []
  for (const name of readdirSync(ONTOLOGY)) {
    if (name.startsWith('sstim-') && name.endsWith('.ttl')) files.push(join(ONTOLOGY, name))
  }
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) walk(path)
      else if (entry.name.endsWith('.ttl')) files.push(path)
    }
  }
  walk(join(ONTOLOGY, 'instances'))
  walk(join(ONTOLOGY, 'frameworks'))
  return [
    ...files.sort().map((path) => ({ path, branchesAllowed: false })),
    { path: join(ONTOLOGY, 'void.ttl'), branchesAllowed: true },
  ]
}

export function gitHasPath(ref, path) {
  try {
    execFileSync('git', ['cat-file', '-e', `${ref}:${path.replace(/\/$/, '')}`], { cwd: ROOT, stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

export const treeHasPath = (path) => existsSync(join(ROOT, path))

function latestReleaseTag() {
  const tags = execFileSync('git', ['tag', '--list', 'v*'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n').filter((tag) => RELEASE_TAG.test(tag))
  const key = (tag) => tag.slice(1).split('.').map(Number)
  tags.sort((a, b) => {
    const [x, y] = [key(a), key(b)]
    return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]
  })
  return tags.at(-1) ?? null
}

function main() {
  const manifest = JSON.parse(readFileSync(join(ONTOLOGY, 'manifest.json'), 'utf8'))
  const upcomingTag = comingTag(manifest.suite.version)
  const latest = latestReleaseTag()
  // An absent tag would make every pinned link look broken, or, worse, a check
  // that cannot see tags would pass nothing and say so politely. Fail instead.
  if (!latest) {
    console.error('source-links: FAIL (no release tags in this clone; fetch them with `git fetch --tags`)')
    process.exit(1)
  }

  if (process.argv.includes('--migrate')) {
    // A document no release holds yet is pinned to the commit the public
    // repository's main points at, which already holds it, rather than to the
    // coming tag, which would answer 404 until the release.
    const published = execFileSync('git', ['rev-parse', 'w3c-cg/main'], { cwd: ROOT, encoding: 'utf8' }).trim()
    let rewritten = 0
    for (const { path, branchesAllowed } of liveFiles()) {
      const text = readFileSync(path, 'utf8')
      // The landing pages keep naming the branch; every citation gets the latest
      // release that holds its document, else the published commit, else the
      // coming tag.
      const refFor = (target, kind) =>
        branchesAllowed && kind === 'tree' ? 'main'
          : gitHasPath(latest, target) ? latest
            : gitHasPath(published, target) ? published : upcomingTag
      const next = migrateLinks(text, refFor, { branchesAllowed })
      if (next !== text) {
        writeFileSync(path, next, 'utf8')
        rewritten += 1
      }
    }
    console.log(`source-links: migrated ${rewritten} file(s)`)
  }

  const problems = []
  let links = 0
  for (const { path, branchesAllowed } of liveFiles()) {
    const text = readFileSync(path, 'utf8')
    links += [...text.matchAll(REPO_LINK)].length
    problems.push(...checkSourceLinks(text, {
      file: relative(ROOT, path),
      upcomingTag,
      hasPathAt: gitHasPath,
      existsInTree: treeHasPath,
      branchesAllowed,
    }))
  }
  if (problems.length) {
    console.error(`source-links: FAIL (${problems.length})`)
    for (const problem of problems) console.error(`  - ${problem}`)
    process.exit(1)
  }
  console.log(
    `source-links: passed (${links} links into ${REPOSITORY}; every citation pinned ` +
    `to a ref that holds its path, none to the legacy repository)`,
  )
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
