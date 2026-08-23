#!/usr/bin/env node
// Emit each golden session's RDF projection as Turtle, for validation by an
// engine that can execute SHACL-SPARQL.
//
// This exists because of a bug it would have caught. `sstim:actualDurationSeconds`
// is xsd:integer and `sstim:deliveredDurationSeconds` is decimal, so rounding
// elapsed time to nearest could put it *below* delivered time — a 602.4 s
// session that delivered all of it projected as 602 elapsed and 602.4 delivered,
// violating the delivered ≤ elapsed constraint on data that was entirely correct.
//
// Nothing saw it. `rdf-validate-shacl`, which runs the projection conformance
// tests beside their producer, has no SPARQLConstraintComponent validator and
// strips sh:sparql before validating; `make shacl-instances` covers committed
// instance files, and a projection is not one. So the only constraints that
// could have caught it were the only constraints nothing ran against projected
// output.
//
// Usage:  node scripts/session-projection-emit.mjs <output-dir>

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { GOLDEN_SESSIONS } from '../src/session/fixtures/goldenSessions.js'
import { projectSession, sessionToTurtle } from '../src/session/sessionProjection.js'

const outputDir = process.argv[2]
if (!outputDir) {
  console.error('usage: node scripts/session-projection-emit.mjs <output-dir>')
  process.exit(2)
}

mkdirSync(outputDir, { recursive: true })

// Cases beyond the golden set, chosen because each one previously produced —
// or could produce — a graph that fails a constraint the positive suites cannot
// execute. A fixture only earns its place here by being a plausible recording.
const base = GOLDEN_SESSIONS['helpful, no unwanted experience']

const edgeCases = {
  'fractional-durations': {
    ...structuredClone(base),
    instance: {
      ...structuredClone(base.instance),
      // Ran 602.4 s and delivered all of it. Rounding elapsed to nearest puts
      // it below delivered; rounding up cannot.
      actualDurationSeconds: 602.4,
      deliveredSeconds: 602.4,
    },
  },
  'wall-clocked-events': {
    ...structuredClone(base),
    events: structuredClone(base.events).map((event) => ({
      ...event,
      wallClock: '2026-08-13T09:01:00Z',
    })),
  },
}

let count = 0
for (const [name, bundle] of [...Object.entries(GOLDEN_SESSIONS), ...Object.entries(edgeCases)]) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const { quads } = projectSession(bundle)
  writeFileSync(join(outputDir, `${slug}.ttl`), await sessionToTurtle(quads), 'utf8')
  count += 1
}

console.log(`session-projection-emit: wrote ${count} projected graphs to ${outputDir}`)
