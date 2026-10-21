// Short labels for catalog records on the graph canvas.
//
// A record's rdfs:label is written to be read whole, in a panel: a published
// protocol's runs past a hundred characters and ends in its citation, "...
// gait training in Parkinson's disease (Thaut et al. 1996)". Drawn on a node,
// that wrapped to six lines and buried the canvas. Researchers name a published
// protocol by its citation, so that is its short label, "Thaut et al. 1996".
// Where two records share a citation (Martorell et al. 2019 has two), each also
// takes the opening words of its title. Any other long label is cut at a word.
//
// The full label is untouched: the panel, search and the arrival banner keep
// it, so nothing here changes what a record says, only how it is drawn.

/** Longest canvas label before it is cut at a word. */
export const CANVAS_LABEL_MAX = 40

// How much of the title separates two records that share a citation.
const DISAMBIGUATION_MAX = 20

// A trailing parenthetical that holds a year: "(Thaut et al. 1996)",
// "(Galambos, Makeig and Talmachoff 1981)", "(Wang et al. 2017 benchmark dataset)".
const TRAILING_CITATION = /^(.*?)\s*\(([^()]*\b(?:1[89]|20)\d{2}\b[^()]*)\)\s*$/

/**
 * Cut text at a word boundary so it fits `max` characters, ellipsis included.
 * @param {string} text
 * @param {number} max
 * @returns {string}
 */
export function clampWords(text, max) {
  const value = String(text ?? '').trim()
  if (value.length <= max) return value
  const cut = value.slice(0, max - 1)
  // A cut that already ends a word keeps it; otherwise back up to the last one.
  const endsAtWord = /\s/.test(value[cut.length])
  const atWord = endsAtWord || !cut.includes(' ') ? cut : cut.slice(0, cut.lastIndexOf(' '))
  return `${atWord.replace(/[\s,;:.(-]+$/, '')}…`
}

/**
 * "Galambos, Makeig and Talmachoff 1981" → "Galambos et al. 1981";
 * "Wang et al. 2017 benchmark dataset" → "Wang et al. 2017". Two authors keep
 * both names, as a citation would.
 * @param {string} text the parenthetical, without its parentheses
 * @returns {string}
 */
export function shortCitation(text) {
  const match = String(text).match(/^(.*?)\s*\b((?:1[89]|20)\d{2})\b/)
  if (!match) return String(text).trim()
  const [, authors, year] = match
  if (/\bet al\.?$/.test(authors) || !authors.includes(',')) return `${authors} ${year}`.trim()
  return `${authors.split(',')[0].trim()} et al. ${year}`
}

/**
 * Split a label that ends in a citation into the citation and the title before it.
 * @param {string} label
 * @returns {{ citation: string, title: string } | null}
 */
export function splitCitation(label) {
  const match = String(label ?? '').match(TRAILING_CITATION)
  if (!match || !match[1]) return null
  return { citation: shortCitation(match[2]), title: match[1].trim() }
}

/**
 * Canvas labels for a set of records, decided together because whether a
 * citation is enough depends on whether another record shares it.
 *
 * @param {Array<{ id: string, label: string }>} records
 * @returns {Map<string, { shortLabel?: string, labelLead?: string, labelRest?: string }>}
 *   per id: `shortLabel` when the canvas should not draw the full label, and
 *   `labelLead`/`labelRest` (citation and title) when the label ends in a citation
 */
export function recordCanvasLabels(records) {
  const out = new Map()
  const byCitation = new Map()
  for (const { id, label } of records) {
    const parts = splitCitation(label)
    if (parts) {
      out.set(id, { labelLead: parts.citation, labelRest: parts.title })
      byCitation.set(parts.citation, [...(byCitation.get(parts.citation) ?? []), id])
    } else if (String(label ?? '').length > CANVAS_LABEL_MAX) {
      out.set(id, { shortLabel: clampWords(label, CANVAS_LABEL_MAX) })
    }
  }
  for (const [citation, ids] of byCitation) {
    for (const id of ids) {
      const entry = out.get(id)
      entry.shortLabel = ids.length === 1
        ? citation
        : `${citation}: ${clampWords(entry.labelRest, DISAMBIGUATION_MAX)}`
    }
  }
  return out
}
