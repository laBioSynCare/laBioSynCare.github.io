// The JSON Schema validator for session bundles — one configuration, shared by
// the test suite and by `make session-contract`.
//
// Not imported by application code, and it must stay that way: `ajv` is a dev
// dependency and pulling a JSON Schema compiler into the browser bundle to
// re-check documents the app just built would be pure weight. The runtime path
// constructs bundles through `sessionRecorder.js`, which cannot produce a shape
// the schema rejects; this validator is the gate that proves that claim.
//
// The two strict-mode relaxations are deliberate and narrow:
//
//   strictRequired   the instance's if/then/else requires `endedAt` in a branch
//                    that does not redeclare the property. Redeclaring it there
//                    would be a second definition of the same field — the exact
//                    kind of duplication KR-02 was about.
//   allowUnionTypes  an observation's `value` is genuinely number | boolean |
//                    null: an ordinal answer, a yes/no answer, or an answer
//                    that was not supplied.

import Ajv from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { SESSION_SCHEMA } from './sessionContract.js'

export function createSessionValidator() {
  const ajv = new Ajv({
    strict: true,
    strictRequired: false,
    allowUnionTypes: true,
    allErrors: true,
  })
  addFormats(ajv)
  return ajv.compile(SESSION_SCHEMA)
}

/** Validate, returning readable errors rather than an error object graph. */
export function validateSessionBundle(bundle, validate = createSessionValidator()) {
  const valid = validate(bundle)
  return {
    valid,
    errors: (validate.errors ?? []).map((e) => `${e.instancePath || '/'} ${e.message}`),
  }
}
