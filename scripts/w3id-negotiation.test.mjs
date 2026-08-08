import { expect, test } from 'vitest'

import { loadRules, resolveRoute } from './w3id-negotiation.mjs'
// The deep-link targets are graph-browser hashes, so the prefixes they use have
// to be the ones the browser resolves against — assert against the real table
// rather than restating it.
import { PREFIXES } from '../src/rdf/namespaces.js'

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

test('an entity IRI deep-links to that entity, never to the entrance', () => {
  // This is the test whose absence cost the work twice. perma-id/w3id.org#6393
  // replaced these targets with per-entity graph deep links; #6480 rewrote the
  // file from an older base and reverted every one of them, unnoticed, because
  // nothing here described the intent. An entity IRI answering a browser with a
  // landing page is the classic linked-data failure: the reader learns that the
  // project exists and nothing about the thing they asked for.
  const APP = 'https://labiosyncare.github.io/'
  const graph = (path) => go(path, BROWSER).doc?.replace(APP + 'graph/', '')

  expect(graph('framework/bsc')).toBe('#bsc-fw:')
  expect(graph('implementation/bsclab')).toBe('#bsclab:')
  expect(graph('implementation/biosyncare')).toBe('#biosyncare:')
  expect(graph('implementation/bsclab/component/patch-studio'))
    .toBe('#bsclab:component/patch-studio')

  // Originated techniques → their framework node.
  expect(graph('framework/bsc/technique/martigli-breathing-oscillation'))
    .toBe('#bsc-fw-tech:martigli-breathing-oscillation')
  expect(graph('framework/bsc/technique/symmetry-permutation-entrainment'))
    .toBe('#bsc-fw-tech:symmetry-permutation-entrainment')
  // Retired in ADR 0033 → the vendor-neutral concept that replaced each.
  expect(graph('framework/bsc/technique/binaural-beat-stimulation')).toBe('#techBinauralBeats')
  expect(graph('framework/bsc/technique/vibrotactile-rhythm-stimulation'))
    .toBe('#techVibrotactileEntrainment')

  // Both capture groups reach the hash: kind and local name.
  expect(graph('specialist/renato-fabbri')).toBe('#sstim-specialist:renato-fabbri')
  expect(graph('organization/ifsc-usp')).toBe('#sstim-organization:ifsc-usp')
  expect(graph('ecosystem-record/role/curator-2026'))
    .toBe('#sstim-ecosystem-record:role/curator-2026')

  // Every hash prefix above must be one the browser can actually resolve.
  for (const prefix of ['bsc-fw', 'bsc-fw-tech', 'bsclab', 'biosyncare',
    'sstim-specialist', 'sstim-organization', 'sstim-ecosystem-record']) {
    expect(PREFIXES, `${prefix}: is not a registered prefix`).toHaveProperty(prefix)
  }

  // RDF representations are untouched by the deep links.
  expect(go('framework/bsc', 'text/turtle').doc).toBe('instances/frameworks/bsc.ttl')
  expect(go('specialist/renato-fabbri', '*/*').doc)
    .toBe('https://biosyncare-lab.web.app/current.ttl')

  // The reserved fixture prefix stays outside the live routes, in both
  // representations — a synthetic record must not resolve at all.
  expect(go('specialist/synthetic-someone', BROWSER).status).toBe(404)
  expect(go('specialist/synthetic-someone', 'text/turtle').status).toBe(404)
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
