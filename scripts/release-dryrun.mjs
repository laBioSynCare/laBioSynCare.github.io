#!/usr/bin/env node
// Rehearse the next release against the current sources, without cutting one.
//
// Cutting 0.13.0 was stopped three times by gates that had been wrong for weeks:
// the JSON Schema still demanded negative fixtures from every released profile
// after ADR 0045 exempted shapeless ones; the quality audit derived a frozen
// release's module set by globbing, which counts a namespace catalogue as a
// module; and its snapshot-route expectation hardcoded sstim-core.ttl for the
// bare version route, correct only while that file was the whole ontology.
//
// None of those was findable by reading. All three were findable by pretending
// to release, which nothing did between releases -- so the release path was
// exercised roughly once a month, by hand, at the one moment when being wrong
// is most expensive.
//
// This does the cheap half of a release: prepare the manifest in memory, model
// the snapshot the release would freeze, and run the contracts that read those
// shapes. It deliberately skips SHACL, reasoning and export, which `make
// validate` already covers on the live sources and which would make this too
// slow to run every time.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  DEFAULT_MANIFEST_PATH,
  loadManifest,
  validateManifest,
} from './sstim-manifest.mjs'
import { generatedRegion } from './sstim-w3id-snapshot-routes.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..')

/** The manifest as it would look once release-prepared for `version`. */
export function prepareReleaseManifest(manifest, version) {
  const prepared = structuredClone(manifest)
  const base = `${prepared.suite.ontologyIri}/${version}/`
  prepared.suite.version = version
  prepared.suite.status = 'released'
  prepared.$schema = `${base}manifest.schema.json`
  prepared.immutableRelease = {
    baseUrl: base,
    manifestUrl: `${base}manifest`,
    schemaUrl: `${base}manifest.schema.json`,
  }
  const filename = (entry) => entry.source.path.split('/').pop()
  for (const module of prepared.modules) {
    module.version = version
    if (module.release?.snapshot) module.publication.versionedUrl = base + filename(module)
  }
  for (const profile of prepared.profiles) {
    profile.version = version
    profile.status = 'released'
    if (profile.release?.snapshot) profile.publication.versionedUrl = base + filename(profile)
  }
  return prepared
}

/** The frozen inventory `make snapshot` would produce for `version`. */
export function modelSnapshotInventory(manifest, version) {
  const turtle = [
    ...manifest.modules.filter((m) => m.release?.snapshot),
    ...manifest.profiles.filter((p) => p.release?.snapshot),
  ].map((entry) => entry.source.path.split('/').pop())
  for (const document of manifest.namespaceDocuments ?? []) {
    turtle.push(document.runtime.turtleUrl.split('/').pop())
  }
  return { version, turtle: turtle.sort(), manifest: true, schema: true }
}

function nextVersion(current) {
  const [major, minor] = current.replace(/-dev$/, '').split('.').map(Number)
  return `${major}.${minor + 1}.0`
}

export function dryRunProblems({ manifest, version }) {
  const problems = []
  const prepared = prepareReleaseManifest(manifest, version)

  // 1. The released shape must satisfy the manifest's own semantic contract.
  for (const error of validateManifest(prepared, { verifyFiles: false })) {
    problems.push(`released manifest: ${error}`)
  }

  // 2. And its published JSON Schema, which is a separate document and drifted
  //    from the validator once already.
  const scratch = mkdtempSync(join(tmpdir(), 'sstim-dryrun-'))
  try {
    const path = join(scratch, 'manifest.json')
    writeFileSync(path, JSON.stringify(prepared, null, 2) + '\n')
    execFileSync('python3', [join(here, 'validate-sstim-manifest-schema.py'), path], {
      cwd: repoRoot,
      stdio: 'pipe',
    })
  } catch (error) {
    const detail = [error.stdout, error.stderr].filter(Boolean).join('').trim()
    problems.push(`released manifest fails its JSON Schema:\n${detail || error.message}`)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }

  // 3. The routes for the snapshot this release would freeze must be
  //    generatable, and the bare version route must resolve to the whole
  //    release rather than to whichever file happens to be called core.
  const inventory = modelSnapshotInventory(prepared, version)
  try {
    const region = generatedRegion([inventory])
    const bare = region.split('\n').find((line) => line.includes(`/?$ `))
    if (!bare?.includes('sstim-namespace.ttl')) {
      problems.push(
        `bare version route for ${version} would resolve to ` +
        `${bare?.split('/').pop() ?? '(nothing)'}, not the whole release`,
      )
    }
  } catch (error) {
    problems.push(`snapshot routes for ${version} cannot be generated: ${error.message}`)
  }

  return problems
}

function main() {
  const manifest = loadManifest(DEFAULT_MANIFEST_PATH)
  const version = process.argv[2] ?? nextVersion(manifest.suite.version)
  const problems = dryRunProblems({ manifest, version })
  if (problems.length) {
    console.error(`release-dryrun: FAIL — ${version} could not be prepared (${problems.length})`)
    for (const problem of problems) console.error(`  - ${problem}`)
    process.exit(1)
  }
  console.log(
    `release-dryrun: PASS (${version} would prepare, validate, and route cleanly ` +
    `from ${manifest.suite.version})`,
  )
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    main()
  } catch (error) {
    console.error(`release-dryrun: FAIL — ${error.message}`)
    process.exit(1)
  }
}
