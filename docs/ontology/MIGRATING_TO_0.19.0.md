# Migrating to SSTIM 0.19.0

SSTIM 0.19.0 takes one framework's structure out of SSTIM's universal namespaces
([ADR 0061](../decisions/0061-universal-namespaces-carry-no-framework-structure.md)).
The BSC catalog's voice classes, preset groups, Martigli parameters and
permutation coding now live in the BSC framework's own vocabulary, and SSTIM
names generic terms where it needs the concept.

**Nothing is removed.** Every term your data uses still resolves, deprecated
(`owl:deprecated true`), and names its successor with `dct:isReplacedBy`, or
says in a `skos:historyNote` why it has none. Data written for 0.18.0 keeps its
meaning. Migrate when you next touch it; the tables below are the complete list.

## What to change

Most rows are a rename: replace the deprecated IRI with its successor. Three
changes are structural.

**Breath guidance is one pointer.** `sstim:hasBreathGuide` on the preset and
`sstim:isBreathReference` on a voice become `sstim:breathGuideTrack` from the
preset to the track that paces breathing. SSTIM's shapes require that track to
be one of the preset's own and its initial breathing period to be at least 3 s.

```turtle
# 0.18.0
ex:preset sstim:hasBreathGuide true ;
    sstim:composedOf ex:voice1, ex:voice2 .
ex:voice1 sstim:isBreathReference true .

# 0.19.0
ex:preset sstim:composedOfTrack ex:voice1, ex:voice2 ;
    sstim:breathGuideTrack ex:voice1 .
```

**A delivery status names the implementation it describes.** The three BSC Lab
status values become implementation-neutral ones, which are only valid inside a
`sstim-ex:KnowledgeStatusAssertion` whose `sstim-ex:knowledgeScope` is your
implementation's IRI.

```turtle
# 0.18.0
ex:protocol sstim-ex:hasKnowledgeStatus sstim-ex:notCurrentlyDeliverableByBSCLab .

# 0.19.0
ex:protocol sstim-ex:hasKnowledgeStatusAssertion ex:protocol-status .
ex:protocol-status a sstim-ex:KnowledgeStatusAssertion ;
    rdfs:label "Not deliverable by our implementation"@en ;
    sstim-ex:hasKnowledgeStatus sstim-ex:notCurrentlyDeliverable ;
    sstim-ex:knowledgeAsOfDate "2026-10-06"^^xsd:date ;
    sstim-ex:knowledgeScope <https://example.org/your-implementation> ;
    prov:wasGeneratedBy ex:status-review .
ex:status-review a sstim-ex:KnowledgeStatusActivity ;
    prov:used ex:release-checklist ;
    prov:endedAtTime "2026-10-06T12:00:00Z"^^xsd:dateTime ;
    prov:qualifiedAssociation [ a prov:Association ;
        prov:agent ex:maintainer ;
        prov:hadRole ex:release-editor ] .
```

**Composition has one relation.** `sstim:composedOf` gives way to
`sstim:composedOfTrack`, whose range is any `sstim:Track`, so a preset can be
composed of visual, haptic and control tracks as well as audio ones.

## Validation is stricter

`sstim-shapes.ttl` now holds every SSTIM property to its declared range,
wherever it is used. Data that put a value of the wrong kind in an SSTIM
property, such as a frequency band as a caution tag or a string where an effect
direction belongs, validated against 0.18.0 and fails against 0.19.0. A
functional property takes at most one value, and `sstim:derivedFrom` is
irreflexive.

A value that is a record rather than a vocabulary concept, such as a preset, a
stimulus specification, a protocol, a descriptor or a track, may be described
in another graph. An IRI your graph does not type is accepted as a reference to
such a record; a node your graph does type must be of the range's class.

Records that no shape reached before now have one, which asks only for what the
class's definition or ADR 0027 already says:

- an evidence assessment activity or a knowledge status activity records one
  `prov:endedAtTime`, what it `prov:used`, and a `prov:qualifiedAssociation`
  naming an agent and a role. An assessment activity used every basis of its
  assessment, and each basis's source;
- an exposure statement (hypothesis, research question, design objective,
  planned outcome, protocol requirement or boundary applicability) has a label
  and a description, and carries no evidence tier or basis;
- an exploratory protocol has a label and a description;
- a comparator, population or outcome descriptor is an IRI with a label, and
  an intervention an evidence basis names has a label;
- `sstim-ex:concernsEffectDimension` is stated only by a hypothesis, research
  question, design objective or planned-outcome specification, and
  `sstim-ex:hasKnowledgeStatus` only by the kinds of record ADR 0027 lists.

Two properties gained a range: `sstim:independencePolicy` and
`sstim:reviewRubric` take a `prov:Plan`, so a reasoner now infers that their
values are plans. Nothing else here changes what a term means. Validate your
data against 0.19.0's shapes before you switch.

## If you use the BSC catalog terms

They keep their local names in the BSC namespace,
`https://w3id.org/sstim/framework/bsc/vocab#`, so `sstim:inGroup` becomes
`bsc-v:inGroup` and `sstim-v:groupHeal` becomes `bsc-v:groupHeal`. A catalog voice
is typed `sstim:AudioTrack` as well as its BSC voice class. Load the vocabulary
from its IRI, `https://w3id.org/sstim/framework/bsc/vocab`, and validate catalog
data against `sstim-shapes.ttl` together with the BSC shapes,
`https://w3id.org/sstim/framework/bsc/shapes`, which hold the catalog rules
SSTIM's shapes no longer carry. (The files are also at
`https://w3c-cg.github.io/sstim/ontology/frameworks/bsc/bsc-vocab.ttl` and
`bsc-shapes.ttl` beside it.) Each Martigli parameter
is a sub-property of the generic breathing term it specialises, so a query for
`sstim:breathingPeriodInitial` with RDFS inference still finds a catalog voice's
`bsc-v:martigliPeriodInitial`.

The BSC vocabulary is the BSC framework's, not SSTIM's: it belongs to no SSTIM
profile or release.

## If you use SSTIM's preset JSON contract

`group` in `https://w3id.org/sstim/schemas/preset.schema.json` is now any
non-empty string, a framework's own notation or IRI, where it enumerated the
five BSC groups. A preset valid against 0.18.0's contract stays valid. Nothing
else in the contract changed meaning.

## The terms

<!-- BEGIN generated term tables -->

*Generated by `scripts/generate-migration-guide.py 0.18.0 0.19.0` from the frozen 0.18.0 release and frozen 0.19.0. Do not edit; rerun it.*

40 terms are newly deprecated in 0.19.0.

### Moved to the BSC framework vocabulary (32)

| Deprecated | Kind | Replaced by |
|---|---|---|
| `sstim-v:PermutationFunctionScheme` | scheme | `bsc-v:PermutationFunctionScheme` |
| `sstim-v:PresetGroupScheme` | scheme | `bsc-v:PresetGroupScheme` |
| `sstim-v:VoiceTypeScheme` | scheme | `bsc-v:VoiceTypeScheme` |
| `sstim-v:groupHeal` | concept | `bsc-v:groupHeal` |
| `sstim-v:groupIndulge` | concept | `bsc-v:groupIndulge` |
| `sstim-v:groupPerform` | concept | `bsc-v:groupPerform` |
| `sstim-v:groupSupport` | concept | `bsc-v:groupSupport` |
| `sstim-v:groupTranscend` | concept | `bsc-v:groupTranscend` |
| `sstim-v:permIdentity` | concept | `bsc-v:permIdentity` |
| `sstim-v:permReverse` | concept | `bsc-v:permReverse` |
| `sstim-v:permRotateBackward` | concept | `bsc-v:permRotateBackward` |
| `sstim-v:permRotateForward` | concept | `bsc-v:permRotateForward` |
| `sstim-v:permShuffle` | concept | `bsc-v:permShuffle` |
| `sstim-v:voiceBinaural` | concept | `bsc-v:voiceBinaural` |
| `sstim-v:voiceMartigli` | concept | `bsc-v:voiceMartigli` |
| `sstim-v:voiceMartigliBinaural` | concept | `bsc-v:voiceMartigliBinaural` |
| `sstim-v:voiceSymmetry` | concept | `bsc-v:voiceSymmetry` |
| `sstim:BinauralVoice` | class | `bsc-v:BinauralVoice` |
| `sstim:MartigliBinauralVoice` | class | `bsc-v:MartigliBinauralVoice` |
| `sstim:MartigliVoice` | class | `bsc-v:MartigliVoice` |
| `sstim:PermutationFunction` | class | `bsc-v:PermutationFunction` |
| `sstim:PresetGroup` | class | `bsc-v:PresetGroup` |
| `sstim:SymmetryVoice` | class | `bsc-v:SymmetryVoice` |
| `sstim:Voice` | class | `bsc-v:Voice` |
| `sstim:VoiceType` | class | `bsc-v:VoiceType` |
| `sstim:inGroup` | property | `bsc-v:inGroup` |
| `sstim:martigliAmplitude` | property | `bsc-v:martigliAmplitude` |
| `sstim:martigliCenterFreq` | property | `bsc-v:martigliCenterFreq` |
| `sstim:martigliPeriodFinal` | property | `bsc-v:martigliPeriodFinal` |
| `sstim:martigliPeriodInitial` | property | `bsc-v:martigliPeriodInitial` |
| `sstim:martigliTransitionDuration` | property | `bsc-v:martigliTransitionDuration` |
| `sstim:permutationFunction` | property | `bsc-v:permutationFunction` |

### Replaced by other SSTIM terms (7)

| Deprecated | Kind | Replaced by |
|---|---|---|
| `sstim-ex:contextBscLabPrototype` | concept | `sstim-ex:contextImplementationPrototype` |
| `sstim-ex:notCurrentlyDeliverableByBSCLab` | concept | `sstim-ex:notCurrentlyDeliverable` |
| `sstim-ex:notCurrentlyUsedInBSCLab` | concept | `sstim-ex:notCurrentlyUsed` |
| `sstim-ex:outsideBSCLabScope` | concept | `sstim-ex:outsideImplementationScope` |
| `sstim:composedOf` | property | `sstim:composedOfTrack` |
| `sstim:hasBreathGuide` | property | `sstim:breathGuideTrack` |
| `sstim:isBreathReference` | property | `sstim:breathGuideTrack` |

### Deprecated with no replacement (1)

| Deprecated | Kind | Why |
|---|---|---|
| `sstim:hapticPattern` | property | Deprecated in 0.19.0 by ADR 0061, with no replacement. An index into one engine's list of haptic patterns means nothing outside that engine; describe the haptic waveform with sstim:hasSignalShape instead. |

### Earlier deprecations that now name their successor (12)

Deprecated before 0.19.0; 0.19.0 adds the `dct:isReplacedBy` their definitions already described.

| Deprecated | Kind | Replaced by |
|---|---|---|
| `sstim-ex:ExposureEffectClaim` | class | `sstim-ex:BoundaryApplicabilityStatement`, `sstim-ex:ExposureDesignObjective`, `sstim-ex:ExposureHypothesis`, `sstim-ex:KnowledgeStatusAssertion`, `sstim-ex:PlannedOutcomeSpecification`, `sstim-ex:ProtocolRequirement`, `sstim-ex:ResearchQuestion` |
| `sstim-ex:hasEffectClaim` | property | `sstim-ex:hasBoundaryApplicability`, `sstim-ex:hasDesignObjective`, `sstim-ex:hasHypothesis`, `sstim-ex:hasKnowledgeStatusAssertion`, `sstim-ex:hasPlannedOutcome`, `sstim-ex:hasProtocolRequirement`, `sstim-ex:hasResearchQuestion` |
| `sstim:EvidenceModalityTag` | class | `sstim:basisIntervention`, `sstim:basisModalityApplicability`, `sstim:basisSensoryModality`, `sstim:basisStudyModel`, `sstim:basisSynthesisType` |
| `sstim:comparator` | property | `sstim:basisComparator`, `sstim:basisComparatorNote` |
| `sstim:evidenceDate` | property | `dct:issued`, `prov:endedAtTime` |
| `sstim:evidenceOutcome` | property | `sstim:basisObservedOutcome`, `sstim:basisOutcomeNote` |
| `sstim:hasEffectDirection` | property | `sstim:basisObservedEffectDirection` |
| `sstim:hasModalityTag` | property | `sstim:basisIntervention`, `sstim:basisModalityApplicability`, `sstim:basisSensoryModality`, `sstim:basisStudyModel`, `sstim:basisSynthesisType` |
| `sstim:hasReviewStatus` | property | `sstim:EvidenceReviewDecision` |
| `sstim:reviewedBy` | property | `prov:qualifiedAssociation` |
| `sstim:studyPopulation` | property | `sstim:basisPopulationNote`, `sstim:basisStudyPopulation` |
| `sstim:supportsRelation` | property | `sstim:evaluatesSubject` |

<!-- END generated term tables -->
