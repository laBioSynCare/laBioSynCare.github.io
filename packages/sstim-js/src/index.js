// sstim: validate sensory-stimulation descriptions against a published SSTIM
// profile.
//
//     import { validate } from 'sstim'
//     const report = await validate('my-stimulus.ttl', { profile: 'core' })
//     console.log(String(report))
//
// With no version, the newest frozen release is resolved from the stable IRI,
// so what you validated against is something you can name and re-fetch later.
//
// SSTIM itself is at https://w3id.org/sstim. This package is a client for it,
// not the standard: the ontology, its shapes and its profiles are published
// independently and this code only reads them.

export {
  Closure,
  SstimError,
  STABLE_IRI,
  TERM_NAMESPACE,
  cacheDir,
  latestRelease,
  resolveProfile
} from './resolve.js'

export { Report, validate } from './validate.js'
