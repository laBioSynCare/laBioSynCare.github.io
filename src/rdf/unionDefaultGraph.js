// The default graph a SPARQL query sees in the Workbench (GB-04).
//
// The loader puts every source in its own named graph and leaves the store's
// default graph empty, so a query without a GRAPH clause, the kind every SPARQL
// tutorial and CLAUDE.md §5.3 write, matched nothing and said nothing about why.
// Comunica's `unionDefaultGraph` option did not help: version 3.3 ignores it for
// an RDF/JS store (measured 2026-09-29).
//
// This wraps the store as a Comunica source. A pattern on the default graph
// matches the RDF merge of the store's own default graph and the authoritative
// named graphs, each triple once however many graphs state it, and a GRAPH
// pattern still sees every named graph as before. Which named graphs are
// authoritative is a list the caller passes, not a rule, so a graph nobody
// listed (an annotation graph, the live ecosystem projection, a graph a user
// loaded) can never reach default-graph results by accident (CLAUDE.md §5.5).

import { DataFactory, Store } from 'n3'

const { defaultGraph, namedNode } = DataFactory

function isDefaultGraph(term) {
  return term?.termType === 'DefaultGraph'
}

// Comunica hands an unbound position over as undefined or as a Variable.
function bound(term) {
  return term && term.termType !== 'Variable' ? term : null
}

/**
 * A Comunica source over `store` whose default graph is the merge of `graphIris`.
 *
 * @param {import('n3').Store} store
 * @param {Iterable<string>} graphIris
 */
export function withUnionDefaultGraph(store, graphIris) {
  const graphs = [...new Set(graphIris)].map((iri) => namedNode(iri))

  const merged = (subject, predicate, object) => {
    const union = new Store()
    // Whatever the store itself holds in its default graph stays there.
    for (const graph of [defaultGraph(), ...graphs]) {
      for (const quad of store.getQuads(subject, predicate, object, graph)) {
        union.addQuad(quad.subject, quad.predicate, quad.object, defaultGraph())
      }
    }
    return union
  }

  return {
    match(subject, predicate, object, graph) {
      const [s, p, o] = [bound(subject), bound(predicate), bound(object)]
      if (isDefaultGraph(graph)) return merged(s, p, o).match(s, p, o, defaultGraph())
      return store.match(s, p, o, bound(graph))
    },
    countQuads(subject, predicate, object, graph) {
      const [s, p, o] = [bound(subject), bound(predicate), bound(object)]
      if (isDefaultGraph(graph)) return merged(s, p, o).size
      return store.countQuads(s, p, o, bound(graph))
    },
  }
}
