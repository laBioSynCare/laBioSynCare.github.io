// Check a graph three ways against the profile it claims to fit.
//
// SHACL conformance alone does not tell you a file is right, because SHACL is
// silent about a term it has never heard of. Misspell a property, or reach for
// one belonging to a module your profile does not contain, and the shapes have
// nothing to say. The file validates, and the mistake surfaces in a consumer's
// pipeline instead of yours.
//
// One honest limitation, reported rather than hidden. rdf-validate-shacl has no
// SPARQLConstraintComponent validator, so sh:sparql constraints must be removed
// before validating. The Core and Core Plus shape graphs contain none, and are
// therefore checked exactly as pySHACL would check them. The Full shape graph
// contains many, and this runtime cannot evaluate them: `report.unevaluated`
// counts them, and `report.partial` says so, so a Full result from JavaScript is
// never presented as equivalent to one from the Python client.

import { Parser, Store, DataFactory } from 'n3'
import SHACLValidator from 'rdf-validate-shacl'

import { SstimError, TERM_NAMESPACE, resolveProfile } from './resolve.js'

const SH_SPARQL = DataFactory.namedNode('http://www.w3.org/ns/shacl#sparql')

export class Report {
  constructor (fields) {
    Object.assign(this, {
      source: '<graph>',
      conforms: true,
      violations: [],
      undefined: [],
      minted: [],
      unevaluated: 0,
      developmentLine: false,
      ...fields
    })
  }

  get ok () { return this.conforms && this.undefined.length === 0 && this.minted.length === 0 }
  get partial () { return this.unevaluated > 0 }

  toString () {
    const mark = (good) => (good ? 'ok    ' : 'FAILED')
    const lines = [this.source, `  profile ${this.profile} at ${this.versionIri}`]
    if (this.developmentLine) {
      lines.push('  WARNING  this is a development line, not a release. Anything ' +
                 'you publish against it cannot be re-validated later.')
    }
    lines.push(`  ${mark(this.conforms)} SHACL conformance`)
    for (const violation of this.violations) lines.push(`           ${violation}`)
    if (this.partial) {
      lines.push(`  PARTIAL  ${this.unevaluated} sh:sparql constraint(s) were not ` +
                 'evaluated: this runtime has no SPARQL constraint component.')
      lines.push('           For a complete Full-profile check use the Python ' +
                 'client (pip install sstim) or pySHACL.')
    }
    lines.push(`  ${mark(this.undefined.length === 0)} every SSTIM term is defined in the ${this.profile} closure`)
    for (const term of this.undefined) lines.push(`           not in this profile: ${term}`)
    lines.push(`  ${mark(this.minted.length === 0)} nothing minted under ${TERM_NAMESPACE}`)
    for (const term of this.minted) lines.push(`           minted: ${term}`)
    return lines.join('\n')
  }
}

function parse (turtle) {
  return new Parser().parse(turtle)
}

async function asQuads (data) {
  if (typeof data === 'string' && (data.includes('\n') || data.trimStart().startsWith('@prefix'))) {
    return { quads: parse(data), source: '<string>' }
  }
  if (typeof data === 'string' || data instanceof URL) {
    let fs
    try {
      fs = await import('node:fs/promises')
    } catch {
      throw new SstimError('reading a file needs a filesystem; pass Turtle text instead')
    }
    let text
    try {
      text = await fs.readFile(data, 'utf8')
    } catch {
      throw new SstimError(`no such file: ${data}`)
    }
    return { quads: parse(text), source: String(data) }
  }
  if (Array.isArray(data)) return { quads: data, source: '<quads>' }
  throw new SstimError('expected a path, Turtle text, or an array of quads')
}

/** Validate Turtle against one SSTIM profile. */
export async function validate (data, {
  profile = 'core', version = null, manifest = null, closure = null, offline = false
} = {}) {
  closure ??= await resolveProfile(profile, { version, manifest })

  const { quads, source } = await asQuads(data)
  const bodies = await closure.read({ offline })

  const semantic = new Store()
  for (const module of closure.semanticModules) semantic.addQuads(parse(bodies[module.id]))

  const report = new Report({
    source,
    profile: closure.profile,
    version: closure.version,
    versionIri: closure.versionIri,
    developmentLine: closure.isDevelopment
  })

  // Namespace discipline first: a minted SSTIM term is also a term the file
  // itself defines, so it would slip past the containment check below.
  const subjects = new Set()
  for (const quad of quads) {
    if (quad.subject.termType === 'NamedNode') subjects.add(quad.subject.value)
  }
  report.minted = [...subjects].filter(s => s.startsWith(TERM_NAMESPACE)).sort()

  // Containment: an SSTIM term this profile does not contain.
  const defined = new Set(semantic.getSubjects(null, null, null).map(s => s.value))
  const used = new Set()
  for (const quad of quads) {
    for (const term of [quad.subject, quad.predicate, quad.object]) {
      if (term.termType === 'NamedNode' && term.value.startsWith(TERM_NAMESPACE)) used.add(term.value)
    }
  }
  report.undefined = [...used].filter(t => !defined.has(t) && !subjects.has(t)).sort()

  // Conformance. Kernel publishes no shapes (a discovery entry point, not a
  // validation contract), so there is nothing to validate against.
  if (closure.shapeModules.length > 0) {
    const shapes = new Store()
    for (const module of closure.shapeModules) shapes.addQuads(parse(bodies[module.id]))

    const sparqlConstraints = shapes.getQuads(null, SH_SPARQL, null, null)
    report.unevaluated = sparqlConstraints.length
    for (const quad of sparqlConstraints) shapes.delete(quad)

    const data = new Store(semantic.getQuads(null, null, null, null))
    data.addQuads(quads)
    const result = new SHACLValidator(shapes).validate(data)
    report.conforms = result.conforms
    report.violations = result.results.map((r) => {
      const focus = r.focusNode?.value ?? '?'
      const message = r.message?.[0]?.value ?? r.sourceConstraintComponent?.value ?? 'violation'
      return `${focus}: ${message}`
    })
  }
  return report
}
