import { expect, test } from 'vitest'

import { loadRules, resolveRoute } from './w3id-negotiation.mjs'

const rules = loadRules()
const ONTOLOGY = 'https://labiosyncare.github.io/ontology/'
const BROWSER = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'

function go(path, accept) {
  const { status, location } = resolveRoute(path, accept, rules)
  return { status, doc: location?.replace(ONTOLOGY, '') ?? null }
}

test('each namespace and module route serves the document it advertises', () => {
  expect(go('', 'text/turtle').doc).toBe('sstim-namespace.ttl')
  expect(go('', 'application/ld+json').doc).toBe('sstim-namespace.jsonld')
  expect(go('', 'application/rdf+xml').doc).toBe('sstim-namespace.rdf')

  // The two endpoints whose namespace IRI is occupied by a multi-module
  // catalogue. Confusing these is the mistake the split makes easy.
  expect(go('kernel', 'text/turtle').doc).toBe('sstim-core.ttl')
  expect(go('exposure', 'text/turtle').doc).toBe('sstim-exposure-namespace.ttl')
  expect(go('module/exposure', 'text/turtle').doc).toBe('sstim-exposure.ttl')

  expect(go('stimulus', 'text/turtle').doc).toBe('sstim-stimulus.ttl')
  expect(go('profile/core', 'text/turtle').doc).toBe('sstim-core-profile.ttl')
  expect(go('profile/full', 'application/rdf+xml').doc).toBe('sstim-full-profile.rdf')
  expect(go('manifest', 'application/json').doc).toBe('manifest.json')
  expect(go('manifest-schema/1', '*/*').doc).toBe('manifest.schema.json')
})

test('Turtle is the default, including for an absent or wildcard Accept', () => {
  expect(go('', '').doc).toBe('sstim-namespace.ttl')
  expect(go('', '*/*').doc).toBe('sstim-namespace.ttl')
})

test('q=0 makes a type unacceptable without poisoning the others', () => {
  // Only type offered is refused by the client, so nothing is acceptable.
  expect(go('', 'application/ld+json;q=0').status).toBe(406)
  expect(go('', 'application/n-triples').status).toBe(406)

  // q=0 on a different type must not suppress the one actually requested.
  expect(go('', 'application/ld+json, text/html;q=0').doc).toBe('sstim-namespace.jsonld')
})

test('a browser reaches human documentation, not RDF', () => {
  // The root is the one HTML target outside /ontology/: a person typing
  // w3id.org/sstim wants the project, not a generated reference page.
  expect(go('', BROWSER).doc).toBe('https://labiosyncare.github.io/')
  expect(go('', 'text/html').doc).toBe('https://labiosyncare.github.io/')
  expect(go('kernel', BROWSER).doc).toBe('docs/')
  expect(go('profile/core', BROWSER).doc).toBe('docs/')
})

test('the SKOS vocabulary has its own documentation page', () => {
  // pyLODE generates docs/vocab/; WIDOCO generates docs/. Sending a reader
  // asking for the vocabulary to the OWL reference index is a wrong answer,
  // not merely a worse one.
  expect(go('vocab', 'text/html').doc).toBe('docs/vocab/')
  expect(go('vocab', BROWSER).doc).toBe('docs/vocab/')
  // Only the HTML representation is special-cased.
  expect(go('vocab', 'text/turtle').doc).toBe('sstim-vocab.ttl')
  expect(go('vocab', 'application/ld+json').doc).toBe('sstim-vocab.jsonld')
  expect(go('shapes', 'text/html').doc).toBe('docs/')
})

test('snapshot routes are exact, so unknown versions and files 404', () => {
  expect(go('0.12.0', 'text/turtle').doc).toBe('0.12.0/sstim-core.ttl')
  expect(go('0.12.0/sstim-core.ttl', '*/*').doc).toBe('0.12.0/sstim-core.ttl')

  // The wildcard this replaced would have redirected both of these.
  expect(go('0.99.0', 'text/turtle').status).toBe(404)
  expect(go('0.12.0/sstim-nonexistent.ttl', '*/*').status).toBe(404)
  expect(go('nonexistent', 'text/turtle').status).toBe(404)
})

test('no rule is shadowed by an earlier one', () => {
  // Every rule must be reachable: if an earlier unconditional rule already
  // matches its pattern, the later rule is dead configuration.
  const unconditional = []
  for (const rule of rules) {
    const shadow = unconditional.find((earlier) => new RegExp(earlier).test(
      // A pattern is only comparable if it is a literal path; skip capture groups.
      rule.pattern.replace(/[$^]/g, ''),
    ))
    expect(shadow, `${rule.pattern} is unreachable behind ${shadow}`).toBeUndefined()
    if (rule.conds.length === 0 && rule.target !== '-') unconditional.push(rule.pattern)
  }
})
