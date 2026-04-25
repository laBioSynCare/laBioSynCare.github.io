import { select } from './query.js'

const PRESET_QUERY = `
PREFIX dct:     <http://purl.org/dc/terms/>
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>
PREFIX skos:    <http://www.w3.org/2004/02/skos/core#>
PREFIX sstim:   <https://w3id.org/sstim#>

SELECT ?preset ?label ?description ?version ?hasBreathGuide
       ?group ?groupLabel ?band ?bandLabel
       ?voiceType ?claim ?tier ?tierLabel ?tierRank
       ?reference ?referenceTitle
WHERE {
  ?preset a sstim:Preset ;
          rdfs:label ?label ;
          sstim:presetVersion ?version ;
          sstim:hasBreathGuide ?hasBreathGuide ;
          sstim:inGroup ?group ;
          sstim:targetsFrequencyBand ?band .

  OPTIONAL { ?preset dct:description ?description . }
  OPTIONAL { ?group skos:prefLabel ?groupLabel . FILTER(LANG(?groupLabel) = "en") }
  OPTIONAL { ?band skos:prefLabel ?bandLabel . FILTER(LANG(?bandLabel) = "en") }

  OPTIONAL {
    ?preset sstim:composedOf ?voice .
    ?voice a ?voiceType .
    VALUES ?voiceType {
      sstim:BinauralVoice
      sstim:MartigliVoice
      sstim:MartigliBinauralVoice
      sstim:SymmetryVoice
    }
  }

  OPTIONAL {
    ?claim a sstim:EvidenceClaim ;
           sstim:supportsRelation ?preset ;
           sstim:hasEvidenceTier ?tier .
    OPTIONAL { ?tier skos:prefLabel ?tierLabel . FILTER(LANG(?tierLabel) = "en") }
    OPTIONAL { ?tier sstim:tierRank ?tierRank . }
    OPTIONAL {
      ?claim sstim:citesReference ?reference .
      ?reference dct:title ?referenceTitle .
    }
  }
}
ORDER BY ?groupLabel ?label ?bandLabel ?tierRank
`

function localName(iri) {
  return iri.split(/[#/]/).pop()
}

function voiceLabel(iri) {
  return localName(iri).replace(/Voice$/, '').replace(/([a-z])([A-Z])/g, '$1 $2')
}

function literalValue(term) {
  return term?.value ?? ''
}

function addUnique(items, item, key = 'iri') {
  if (!item?.[key]) return
  if (!items.some(existing => existing[key] === item[key])) items.push(item)
}

/**
 * Query all sstim:Preset instances and normalize repeated SPARQL bindings into
 * one row object per preset for browser rendering.
 *
 * @param {import('n3').Store} store
 * @returns {Promise<Array<object>>}
 */
export async function listPresets(store) {
  const rows = await select(store, PRESET_QUERY)
  const byPreset = new Map()

  for (const row of rows) {
    const iri = row.preset.value
    if (!byPreset.has(iri)) {
      byPreset.set(iri, {
        iri,
        id: localName(iri),
        label: literalValue(row.label) || localName(iri),
        description: literalValue(row.description),
        version: literalValue(row.version),
        hasBreathGuide: literalValue(row.hasBreathGuide) === 'true',
        groups: [],
        bands: [],
        voiceTypes: [],
        tiers: [],
        references: [],
      })
    }

    const preset = byPreset.get(iri)
    addUnique(preset.groups, {
      iri: row.group?.value,
      label: literalValue(row.groupLabel) || localName(row.group?.value ?? ''),
    })
    addUnique(preset.bands, {
      iri: row.band?.value,
      label: literalValue(row.bandLabel) || localName(row.band?.value ?? ''),
    })
    addUnique(preset.voiceTypes, {
      iri: row.voiceType?.value,
      label: row.voiceType ? voiceLabel(row.voiceType.value) : '',
    })
    addUnique(preset.tiers, {
      iri: row.tier?.value,
      label: literalValue(row.tierLabel) || localName(row.tier?.value ?? ''),
      rank: Number(literalValue(row.tierRank) || 0),
    })
    addUnique(preset.references, {
      iri: row.reference?.value,
      title: literalValue(row.referenceTitle),
    }, 'title')
  }

  return [...byPreset.values()].sort((a, b) => a.label.localeCompare(b.label))
}
