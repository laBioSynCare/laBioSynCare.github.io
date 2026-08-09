import { select } from './query.js'

const PRESET_QUERY = `
PREFIX dct:     <http://purl.org/dc/terms/>
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>
PREFIX skos:    <http://www.w3.org/2004/02/skos/core#>
PREFIX sstim:   <https://w3id.org/sstim#>

SELECT ?preset ?presetGraph ?label ?description ?version ?created ?modified ?hasBreathGuide
       ?group ?groupLabel ?band ?bandLabel
       ?voiceType ?protocol ?implementation
       ?publicClaimLevel ?publicClaimLevelLabel
       ?caution ?cautionLabel ?cautionDefinition ?cautionAction
       ?claim ?claimDirection ?claimDirectionLabel
       ?tier ?tierLabel ?tierRank
       ?reference ?referenceTitle ?referenceSource
WHERE {
  GRAPH ?presetGraph {
    ?preset a sstim:Preset ;
            rdfs:label ?label ;
            sstim:presetVersion ?version ;
            sstim:hasBreathGuide ?hasBreathGuide ;
            sstim:inGroup ?group ;
            sstim:targetsFrequencyBand ?band .

    OPTIONAL { ?preset dct:description ?description . }
    OPTIONAL { ?preset dct:created ?created . }
    OPTIONAL { ?preset dct:modified ?modified . }
    OPTIONAL { ?preset sstim:followsProtocol ?protocol . }
    OPTIONAL { ?preset sstim:forImplementation ?implementation . }
    OPTIONAL { ?preset sstim:hasPublicClaimLevel ?publicClaimLevel . }
    OPTIONAL { ?preset sstim:hasCautionTag ?caution . }
  }

  OPTIONAL {
    GRAPH ?groupGraph {
      ?group skos:prefLabel ?groupLabel .
      FILTER(LANG(?groupLabel) = "en")
    }
  }
  OPTIONAL {
    GRAPH ?bandGraph {
      ?band skos:prefLabel ?bandLabel .
      FILTER(LANG(?bandLabel) = "en")
    }
  }

  OPTIONAL {
    GRAPH ?voiceGraph {
      ?preset sstim:composedOf ?voice .
      ?voice a ?voiceType .
      VALUES ?voiceType {
        sstim:BinauralVoice
        sstim:MartigliVoice
        sstim:MartigliBinauralVoice
        sstim:SymmetryVoice
      }
    }
  }
  OPTIONAL {
    FILTER(BOUND(?publicClaimLevel))
    GRAPH ?claimLevelGraph {
      ?publicClaimLevel skos:prefLabel ?publicClaimLevelLabel .
      FILTER(LANG(?publicClaimLevelLabel) = "en")
    }
  }
  OPTIONAL {
    FILTER(BOUND(?caution))
    GRAPH ?cautionGraph {
      OPTIONAL {
        ?caution skos:prefLabel ?cautionLabel .
        FILTER(LANG(?cautionLabel) = "en")
      }
      OPTIONAL {
        ?caution skos:definition ?cautionDefinition .
        FILTER(LANG(?cautionDefinition) = "en")
      }
      OPTIONAL { ?caution sstim:recommendedAction ?cautionAction . }
    }
  }

  OPTIONAL {
    GRAPH ?claimGraph {
      ?claim a sstim:EvidenceAssessmentClaim ;
             sstim:evaluatesSubject ?preset ;
             sstim:hasEvidenceTier ?tier .
      OPTIONAL { ?claim sstim:hasClaimDirection ?claimDirection . }
    }
    OPTIONAL {
      GRAPH ?claimReferenceGraph {
        ?claim sstim:citesReference ?reference .
      }
      OPTIONAL {
        GRAPH ?referenceGraph {
          ?reference dct:title ?referenceTitle .
          OPTIONAL { ?reference dct:source ?referenceSource . }
        }
      }
    }
    OPTIONAL {
      GRAPH ?tierGraph {
        ?tier skos:prefLabel ?tierLabel .
        FILTER(LANG(?tierLabel) = "en")
      }
    }
    OPTIONAL {
      GRAPH ?tierRankGraph {
        ?tier sstim:tierRank ?tierRank .
      }
    }
    OPTIONAL {
      GRAPH ?claimDirectionGraph {
        ?claimDirection skos:prefLabel ?claimDirectionLabel .
        FILTER(LANG(?claimDirectionLabel) = "en")
      }
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

function publicSourceUrl(term) {
  try {
    const url = new URL(term?.value ?? '')
    return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
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
        created: literalValue(row.created),
        modified: literalValue(row.modified),
        hasBreathGuide: literalValue(row.hasBreathGuide) === 'true',
        graphIri: row.presetGraph?.value ?? '',
        groups: [],
        bands: [],
        voiceTypes: [],
        protocols: [],
        implementations: [],
        publicClaimLevels: [],
        cautions: [],
        evidenceClaims: [],
        claimDirections: [],
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
    addUnique(preset.protocols, {
      iri: row.protocol?.value,
      label: localName(row.protocol?.value ?? '').replaceAll('-', ' '),
    })
    addUnique(preset.implementations, {
      iri: row.implementation?.value,
      label: localName(row.implementation?.value ?? ''),
    })
    addUnique(preset.publicClaimLevels, {
      iri: row.publicClaimLevel?.value,
      label: literalValue(row.publicClaimLevelLabel) || localName(row.publicClaimLevel?.value ?? ''),
    })
    addUnique(preset.cautions, {
      iri: row.caution?.value,
      label: literalValue(row.cautionLabel) || localName(row.caution?.value ?? ''),
      definition: literalValue(row.cautionDefinition),
      recommendedAction: literalValue(row.cautionAction),
    })
    addUnique(preset.evidenceClaims, {
      iri: row.claim?.value,
      label: localName(row.claim?.value ?? ''),
    })
    addUnique(preset.claimDirections, {
      iri: row.claimDirection?.value,
      label: literalValue(row.claimDirectionLabel) || localName(row.claimDirection?.value ?? ''),
    })
    addUnique(preset.tiers, {
      iri: row.tier?.value,
      label: literalValue(row.tierLabel) || localName(row.tier?.value ?? ''),
      rank: Number(literalValue(row.tierRank) || 0),
    })
    addUnique(preset.references, {
      iri: row.reference?.value,
      title: literalValue(row.referenceTitle),
      source: publicSourceUrl(row.referenceSource),
    })
  }

  return [...byPreset.values()].sort((a, b) => a.label.localeCompare(b.label))
}
