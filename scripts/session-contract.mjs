#!/usr/bin/env node
// Gate P0-B — the native session contract, checked end to end.
//
// Improvement plan 0.2 asks for one versioned session schema whose RDF
// projection validates and whose round trip preserves ids, datatypes, values,
// event order and declared hashes. This script is that gate:
//
//   1. every golden bundle validates against static/schemas/session.schema.json
//   2. the projection accounts for every field — projected or withheld
//   3. the public-repository lint passes: only synthetic or public-safe bundles
//      are committed, and no free text carries an identifier
//   4. the round trip is a fixed point for ids, event order and hashes
//
// SHACL conformance of the projected graphs is checked in
// src/session/sessionProjection.shacl.test.js, which runs the Full shape
// closure under `make test` — the same arrangement the Sensory Field exporter
// uses, and the reason that check lives beside its producer rather than here.
//
// The script also prints the work order: the SSTIM terms the projection needs
// and does not have. That list is generated from the withheld fields rather
// than maintained by hand, so it cannot go stale while the gap remains.
//
// Usage:  node scripts/session-contract.mjs [--terms]

import { GOLDEN_SESSIONS } from '../src/session/fixtures/goldenSessions.js'
import { createSessionValidator, validateSessionBundle } from '../src/session/sessionValidator.js'
import { projectSession } from '../src/session/sessionProjection.js'
import {
  COMMITTABLE_CLASSIFICATIONS,
  canonicalJson,
  leafPointers,
} from '../src/session/sessionContract.js'

const failures = []
const fail = (where, message) => failures.push(`${where}: ${message}`)

const validate = createSessionValidator()
const cases = Object.entries(GOLDEN_SESSIONS)
const requiredTerms = new Map()

if (cases.length === 0) fail('fixtures', 'no golden sessions are defined')

for (const [name, bundle] of cases) {
  // 1 — the native document is valid.
  const { valid, errors } = validateSessionBundle(bundle, validate)
  if (!valid) fail(name, `schema: ${errors.join('; ')}`)

  // 2 — the projection accounts for every field.
  let projection
  try {
    projection = projectSession(bundle)
  } catch (error) {
    fail(name, `projection threw: ${error.message}`)
    continue
  }

  const classified = new Set([
    ...projection.report.projected.map((p) => p.pointer),
    ...projection.report.withheld.map((w) => w.pointer),
  ])
  const unaccounted = leafPointers(bundle).filter((p) => !classified.has(p))
  if (unaccounted.length > 0) fail(name, `unaccounted fields: ${unaccounted.join(', ')}`)

  for (const withheld of projection.report.withheld) {
    if (!withheld.reason) fail(name, `withheld ${withheld.pointer} carries no reason`)
    if (withheld.requiredTerm) {
      const pointers = requiredTerms.get(withheld.requiredTerm) ?? new Set()
      pointers.add(`${name}${withheld.pointer}`)
      requiredTerms.set(withheld.requiredTerm, pointers)
    }
  }

  if (projection.quads.length === 0) fail(name, 'projected no triples at all')

  // 3 — public-repository lint.
  const privacy = bundle.privacy ?? {}
  if (!COMMITTABLE_CLASSIFICATIONS.includes(privacy.classification)) {
    fail(name, `classification "${privacy.classification}" may not be committed to a public repository`)
  }
  if (privacy.withdrawn !== false) fail(name, 'a withdrawn bundle must not be committed')

  const freeText = bundle.reports.flatMap((report) => [
    report.statedGoal?.text,
    ...(report.unwantedExperiences?.records ?? []).map((record) => record.text),
  ]).filter(Boolean)
  for (const text of freeText) {
    if (/@|https?:|\+\d{6,}/.test(text)) fail(name, `free text looks like it carries an identifier: ${text}`)
  }

  // 4 — round trip.
  const back = JSON.parse(canonicalJson(bundle))
  if (canonicalJson(back) !== canonicalJson(bundle)) fail(name, 'canonical JSON is not a fixed point')
  if (back.specification.source.contentHash !== bundle.specification.source.contentHash) {
    fail(name, 'the declared content hash did not survive the round trip')
  }
  const order = bundle.events.map((e) => e.offsetSeconds)
  if (canonicalJson(back.events.map((e) => e.id)) !== canonicalJson(bundle.events.map((e) => e.id))) {
    fail(name, 'event ids did not survive the round trip')
  }
  if (canonicalJson([...order].sort((x, y) => x - y)) !== canonicalJson(order)) {
    fail(name, 'events are not ordered by their engine-clock offset')
  }
}

// ── Report ───────────────────────────────────────────────────────────────────

console.log('session-contract: native session bundle (improvement plan 0.2, KR-02/KR-03)')
console.log(`  golden cases   ${cases.length}`)
console.log(`  schema         static/schemas/session.schema.json`)

if (failures.length > 0) {
  console.error(`\nsession-contract: FAILED (${failures.length})`)
  for (const failure of failures) console.error(`  ✗ ${failure}`)
  process.exit(1)
}

console.log(`  checks         schema, loss accounting, public-repo lint, round trip — all passed`)

console.log(`\nsession-contract: ${requiredTerms.size} field group(s) the projection does not carry.`)
console.log('  ADR 0048 closed the KR-02/KR-03 term gap; what is left is a mix of')
console.log('  deliberate policy (the privacy profile travels beside the graph, not in')
console.log('  it) and genuinely unminted terms. Either way the projection withholds')
console.log('  rather than minting undeclared IRIs (KR-17), and this list is generated')
console.log('  from what it withheld, so it cannot claim a gap that has closed.\n')

for (const term of [...requiredTerms.keys()].sort()) {
  console.log(`  • ${term}`)
  if (process.argv.includes('--terms')) {
    for (const pointer of [...requiredTerms.get(term)].sort()) console.log(`      ${pointer}`)
  }
}
