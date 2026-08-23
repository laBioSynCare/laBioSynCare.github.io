import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'
import { DataFactory, Parser, Store } from 'n3'
import SHACLValidator from 'rdf-validate-shacl'

// ADR 0027 negative-fixture harness: proves the evidence/role shapes reject
// the malformed graphs the ADR's required-fixtures section enumerates. Positive
// conformance of the real migrated data is proven by `make validate`; this
// suite pins the rejections. sh:sparql constraints are stripped (the JS
// validator has no SPARQLConstraintComponent; pySHACL covers them in CI).

const REPOSITORY_ROOT = new URL('../../', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('static/ontology/manifest.json', REPOSITORY_ROOT), 'utf8'))
const moduleById = new Map(manifest.modules.map(module => [module.id, module]))
const fullProfile = manifest.profiles.find(profile => profile.id === 'full')
const SH_SPARQL = DataFactory.namedNode('http://www.w3.org/ns/shacl#sparql')
const parseTtl = (f) => new Parser().parse(readFileSync(new URL(f, REPOSITORY_ROOT), 'utf8'))

const PREFIXES = `
@prefix sstim: <https://w3id.org/sstim#> .
@prefix sstim-ex: <https://w3id.org/sstim/exposure#> .
@prefix sstim-v: <https://w3id.org/sstim/vocab#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix dct: <http://purl.org/dc/terms/> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix ex: <https://example.org/fix/> .
`

let validator
let baseQuads

beforeAll(() => {
  const shapes = new Store(parseTtl(moduleById.get('shapes').source.path))
  for (const q of shapes.getQuads(null, SH_SPARQL, null, null)) shapes.delete(q)
  validator = new SHACLValidator(shapes)
  baseQuads = fullProfile.modules
    .map(id => moduleById.get(id).source.path)
    .flatMap(parseTtl)
})

function conforms(ttl) {
  const data = new Store(baseQuads)
  for (const q of new Parser().parse(PREFIXES + ttl)) data.add(q)
  return validator.validate(data).conforms
}

// A structurally complete, valid assessment used as the positive control and as
// the base that each negative case perturbs.
// The subject is a real vocab technique (fully typed and conformant), so the
// fixtures isolate the ADR 0027 shapes from unrelated Technique constraints.
// supportsRelation mirrors evaluatesSubject per the ADR 0.7.x "carry both" rule.
const VALID_ASSESSMENT = `
ex:ref a sstim:BibliographicReference ; rdfs:label "R" .
ex:a a sstim:EvidenceAssessmentClaim, sstim:EvidenceClaim ;
    rdfs:label "A" ; dct:description "d" ;
    sstim:evaluatesSubject sstim-v:techBinauralBeats ;
    sstim:supportsRelation sstim-v:techBinauralBeats ;
    sstim:hasEvidenceTier sstim-v:tierModerate ;
    sstim:hasClaimDirection sstim-v:claimSupports ;
    sstim:assessesProposition ex:prop ;
    sstim:hasEvidenceBasis ex:basis ;
    sstim:citesReference ex:ref ;
    dct:modified "2026-07-13"^^xsd:date ;
    prov:wasAttributedTo <https://orcid.org/0000-0002-9699-629X> .
ex:prop a sstim:AssessmentProposition ;
    sstim:propositionSubject sstim-v:techBinauralBeats ;
    sstim:propositionOutcome ex:outcome ;
    sstim:hasAssessmentScope ex:scope ;
    sstim:hasPropositionForm sstim-v:formBoundedRelation ;
    sstim:propositionText "p"@en .
ex:outcome a sstim:EvidenceOutcomeConcept ; rdfs:label "O" .
ex:scope a sstim:AssessmentScope ;
    sstim:scopeSensoryModality sstim-v:modalityAuditory ;
    sstim:scopePopulationOrModel sstim-v:modelHuman ;
    sstim:scopeInterventionOrContext sstim-v:techBinauralBeats ;
    sstim:scopeComparator sstim-v:scopeNotApplicable .
ex:basis a sstim:EvidenceBasis ; sstim:basisSource ex:ref ; sstim:basisSensoryModality sstim-v:modalityAuditory .
`

describe('ADR 0027 shapes — positive control', () => {
  it('a fully-formed evidence assessment conforms', () => {
    expect(conforms(VALID_ASSESSMENT)).toBe(true)
  })
})

describe('ADR 0027 shapes — negative fixtures reject', () => {
  it('a bare EvidenceClaim without the assessment subtype', () => {
    expect(conforms(`ex:x a sstim:EvidenceClaim ; rdfs:label "x" .`)).toBe(false)
  })

  it('an assessment with no evidence basis', () => {
    expect(conforms(VALID_ASSESSMENT.replace('sstim:hasEvidenceBasis ex:basis ;', ''))).toBe(false)
  })

  it('an assessment with no atomic proposition', () => {
    expect(conforms(VALID_ASSESSMENT.replace('sstim:assessesProposition ex:prop ;', ''))).toBe(false)
  })

  it('an assessment with no evaluatesSubject', () => {
    expect(conforms(VALID_ASSESSMENT
      .replace('sstim:evaluatesSubject sstim-v:techBinauralBeats ;', '')
      .replace('sstim:supportsRelation sstim-v:techBinauralBeats ;', ''))).toBe(false)
  })

  it('an assessment whose supportsRelation disagrees with evaluatesSubject', () => {
    expect(conforms(
      VALID_ASSESSMENT.replace(
        'sstim:supportsRelation sstim-v:techBinauralBeats ;',
        'sstim:supportsRelation sstim-v:techMonauralBeats ;'))).toBe(false)
  })

  it('a proposition marked universal absence', () => {
    expect(conforms(VALID_ASSESSMENT.replace(
      'sstim:hasPropositionForm sstim-v:formBoundedRelation', 'sstim:hasPropositionForm sstim-v:formUniversalAbsence'))).toBe(false)
  })

  it('a scope missing an axis', () => {
    expect(conforms(VALID_ASSESSMENT.replace('sstim:scopeComparator sstim-v:scopeNotApplicable .', '.'))).toBe(false)
  })

  it('a node typed both assessment and a non-evidence role', () => {
    expect(conforms(VALID_ASSESSMENT.replace(
      'a sstim:EvidenceAssessmentClaim, sstim:EvidenceClaim ;',
      'a sstim:EvidenceAssessmentClaim, sstim:EvidenceClaim, sstim-ex:ExposureHypothesis ;'))).toBe(false)
  })

  it('a boundary-applicability statement with no appliesBoundary', () => {
    expect(conforms(`ex:b a sstim-ex:BoundaryApplicabilityStatement ; rdfs:label "b" .`)).toBe(false)
  })

  it('a knowledge-status assertion missing its as-of date', () => {
    expect(conforms(`
ex:ks a sstim-ex:KnowledgeStatusAssertion ; rdfs:label "k" ;
    sstim-ex:hasKnowledgeStatus sstim-ex:unknownToSSTIM ;
    sstim-ex:knowledgeScopeNote "corpus"@en ;
    prov:wasGeneratedBy ex:act .
ex:act a sstim-ex:KnowledgeStatusActivity .`)).toBe(false)
  })

  // Note: the propositionSubject-must-equal-evaluatesSubject and
  // citesReference-must-match-basis rules are sh:sparql constraints, enforced by
  // pySHACL in `make validate` (the JS validator has no SPARQLConstraintComponent).

  it('an evidence basis with neither a canonical modality nor an applicability value', () => {
    expect(conforms(VALID_ASSESSMENT.replace(
      'ex:basis a sstim:EvidenceBasis ; sstim:basisSource ex:ref ; sstim:basisSensoryModality sstim-v:modalityAuditory .',
      'ex:basis a sstim:EvidenceBasis ; sstim:basisSource ex:ref ; sstim:basisStudyModel sstim-v:modelHuman .'))).toBe(false)
  })
})
