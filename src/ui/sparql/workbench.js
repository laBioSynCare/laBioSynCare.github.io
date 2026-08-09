const QUERY_FORMS = ['SELECT', 'ASK', 'CONSTRUCT', 'DESCRIBE']

/** Remove SPARQL line comments without damaging # inside strings or IRI references. */
export function stripSparqlComments(sparql = '') {
  const source = String(sparql)
  let output = ''
  let quote = ''
  let tripleQuoted = false
  let inIri = false
  let escaped = false

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]

    if (escaped) {
      output += character
      escaped = false
      continue
    }

    if (quote) {
      if (character === '\\') {
        output += character
        escaped = true
      } else if (tripleQuoted && source.slice(index, index + 3) === quote.repeat(3)) {
        output += quote.repeat(3)
        index += 2
        quote = ''
        tripleQuoted = false
      } else {
        output += character
        if (!tripleQuoted && character === quote) quote = ''
      }
      continue
    }

    if (inIri) {
      output += character
      if (character === '>') inIri = false
      continue
    }

    if (character === '<') {
      output += character
      inIri = true
      continue
    }

    if (character === '"' || character === "'") {
      quote = character
      tripleQuoted = source.slice(index, index + 3) === character.repeat(3)
      output += tripleQuoted ? character.repeat(3) : character
      if (tripleQuoted) index += 2
      continue
    }

    if (character === '#') {
      while (index + 1 < source.length && source[index + 1] !== '\n') index += 1
      continue
    }

    output += character
  }

  return output
}

/** Identify the top-level SPARQL query form after PREFIX/BASE declarations. */
export function detectQueryKind(sparql = '') {
  let withoutPrologue = stripSparqlComments(sparql).trimStart()

  // Query-form detection is only a UI hint, not a second SPARQL parser. Prefix
  // labels may legally contain a broad Unicode range, so consume declarations
  // by their keyword and closing IRI delimiter instead of trying to validate
  // the prefix grammar here. Comunica remains authoritative for syntax.
  while (/^(?:PREFIX|BASE)(?=\s)/iu.test(withoutPrologue)) {
    const iriStart = withoutPrologue.indexOf('<')
    const iriEnd = iriStart >= 0 ? withoutPrologue.indexOf('>', iriStart + 1) : -1
    if (iriEnd < 0) break
    withoutPrologue = withoutPrologue.slice(iriEnd + 1).trimStart()
  }

  const match = withoutPrologue.match(/^([A-Za-z]+)/u)
  const candidate = match?.[1]?.toUpperCase()
  return QUERY_FORMS.includes(candidate) ? candidate : 'Unknown'
}

/** Turn an engine exception into a useful summary while retaining details separately. */
export function friendlyQueryError(error, sparql = '') {
  const technical = error instanceof Error ? error.message : String(error ?? 'Unknown error')
  const kind = detectQueryKind(sparql)

  if (error?.name === 'QueryTimeoutError') {
    return {
      summary: 'The query reached the workbench time limit.',
      guidance: 'Add LIMIT, narrow the graph or triple patterns, and run a bounded slice. No partial result is shown as complete.',
      technical,
    }
  }

  if (error?.name === 'AbortError') {
    return {
      summary: 'The query was cancelled.',
      guidance: 'Nothing was changed. Refine the query and run it again when ready.',
      technical,
    }
  }

  if (kind !== 'SELECT' && kind !== 'Unknown') {
    return {
      summary: `This results table runs SELECT queries, not ${kind}.`,
      guidance:
        'Change the query to SELECT variables you want to inspect. The shared query API also supports ASK and CONSTRUCT for application code, but this page does not render those result forms.',
      technical,
    }
  }

  if (kind === 'Unknown') {
    return {
      summary: 'The query form could not be recognized.',
      guidance: 'Start with SELECT after any PREFIX declarations, or load a verified example.',
      technical,
    }
  }

  const normalized = technical.toLowerCase()
  if (['parse', 'syntax', 'unexpected', 'invalid'].some(word => normalized.includes(word))) {
    return {
      summary: 'The query has a syntax problem.',
      guidance: 'Check prefixes, braces, punctuation, and variable names. Loading a verified example is a quick way to return to a working query.',
      technical,
    }
  }

  return {
    summary: 'The query could not be completed.',
    guidance:
      'Review the query and try again. SSTIM data is stored in named graphs, so triple patterns normally belong inside GRAPH ?graph { … }.',
    technical,
  }
}

/** Lightweight, source-neutral statistics for an RDFJS dataset. */
export function datasetStats(store) {
  if (!store) return { quadCount: 0, namedGraphCount: 0 }
  const graphs = new Set()
  for (const quad of store) {
    if (quad.graph?.termType === 'NamedNode') graphs.add(quad.graph.value)
  }
  return { quadCount: store.size, namedGraphCount: graphs.size }
}

export function compactNumber(value) {
  return new Intl.NumberFormat('en').format(value)
}

/**
 * Return a browser-safe dereferenceable URL for a result IRI. RDF permits many
 * IRI schemes (including urn:), but only ordinary web URLs should become
 * clickable navigation in an interactive results table. Other IRIs remain
 * fully visible and copyable as RDF terms.
 */
export function externalHttpUrl(value) {
  try {
    const url = new URL(String(value))
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

/** Capture enough identity to attribute an asynchronous query result. */
export function createQueryRunContext(query, datasetRevision, datasetLabel) {
  return {
    query: String(query),
    datasetRevision,
    datasetLabel: String(datasetLabel),
  }
}

/** True when editor or dataset state moved on while a query was running. */
export function queryRunIsStale(context, currentQuery, currentDatasetRevision) {
  return context.query !== currentQuery || context.datasetRevision !== currentDatasetRevision
}

export function shortDatatype(iri = '') {
  if (iri === 'http://www.w3.org/2001/XMLSchema#string') return ''
  if (iri.startsWith('http://www.w3.org/2001/XMLSchema#')) return `xsd:${iri.slice(33)}`
  const splitAt = Math.max(iri.lastIndexOf('#'), iri.lastIndexOf('/'))
  return splitAt >= 0 ? iri.slice(splitAt + 1) : iri
}

export function termQualifier(term) {
  if (!term || term.termType !== 'Literal') return ''
  if (term.language) return `@${term.language}`
  const datatype = term.datatype?.value
  return datatype ? shortDatatype(datatype) : ''
}

const XSD_STRING = 'http://www.w3.org/2001/XMLSchema#string'

function unicodeEscape(character) {
  const codePoint = character.codePointAt(0)
  return codePoint <= 0xFFFF
    ? `\\u${codePoint.toString(16).padStart(4, '0').toUpperCase()}`
    : `\\U${codePoint.toString(16).padStart(8, '0').toUpperCase()}`
}

function escapeLiteral(value) {
  let escaped = ''
  for (const character of String(value)) {
    if (character === '\\') escaped += '\\\\'
    else if (character === '"') escaped += '\\"'
    else if (character === '\t') escaped += '\\t'
    else if (character === '\n') escaped += '\\n'
    else if (character === '\r') escaped += '\\r'
    else if (character === '\b') escaped += '\\b'
    else if (character === '\f') escaped += '\\f'
    else if (character.codePointAt(0) < 0x20 || character === '\u007F') escaped += unicodeEscape(character)
    else escaped += character
  }
  return escaped
}

function escapeIri(value) {
  let escaped = ''
  for (const character of String(value)) {
    const codePoint = character.codePointAt(0)
    if (codePoint <= 0x20 || codePoint === 0x7F || /[<>"{}|^`\\]/u.test(character)) {
      escaped += unicodeEscape(character)
    } else {
      escaped += character
    }
  }
  return escaped
}

/** Serialize one RDF term using the SPARQL Results TSV term syntax. */
export function termToSparqlTsv(term) {
  if (!term) return ''
  if (term.termType === 'NamedNode') return `<${escapeIri(term.value)}>`
  if (term.termType === 'BlankNode') return `_:${term.value}`
  if (term.termType === 'Variable') return `?${term.value}`
  if (term.termType === 'Literal') {
    const lexical = `"${escapeLiteral(term.value)}"`
    if (term.language) return `${lexical}@${term.language}`
    const datatype = term.datatype?.value
    return datatype && datatype !== XSD_STRING
      ? `${lexical}^^<${escapeIri(datatype)}>`
      : lexical
  }
  return String(term.value ?? '')
}

/**
 * Standards-shaped SPARQL Results TSV. Unlike the visual table, this retains
 * the distinction between IRIs, blank nodes, language strings, and datatypes.
 */
export function rowsToTsv(columns, rows) {
  return [
    columns.map(column => column.startsWith('?') ? column : `?${column}`).join('\t'),
    ...rows.map(row => columns.map(column => termToSparqlTsv(row[column])).join('\t')),
  ].join('\n')
}
