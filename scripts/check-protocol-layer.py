#!/usr/bin/env python3
"""Assert the ADR 0063/0064/0066 protocol layer exists, is used, and rejects abuse.

Encoding nine published protocols found thirteen things SSTIM could not say.
ADR 0063 added stimulus magnitudes stated at a stage of delivery; ADR 0064
added schedules, study arms, populations, designs, control laws, random onset
timing, initial phase, display geometry and the sleep oscillations, and let a
published protocol be accountable to its paper instead of to a framework.
Completing four of them from their full texts found eight more, which ADR 0066
added: an interval between the stimuli of one trigger, an adaptive threshold,
a trigger delay calibrated to each subject, delivery restricted to stages of
sleep, a level that changes over a course up to a limit, tempo in beats per
minute, a level above another component of the same sound, and one ear.

Three checks.

**Adds.** Every class, property and concept the three ADRs promised is declared.

**Uses.** The nine protocols are present, one file each named after its
identifier (ADR 0065), and each cites a bibliographic record, which is the only
way they satisfy the provenance rule: none names a framework.

**Constraints, adversarially.** Each rule the layer adds is a rule data can
break, and a rule that never fails is decoration. One positive fixture uses
every new term at once; each case below breaks it in one way and must be
rejected on its own focus node, by its own message. Because ADR 0064 had to
exclude ProtocolShape's property blocks from the full-equivalence baseline,
the protocol cases also re-prove that a label and a description are still
required, so that exclusion does not leave them unpoliced.
"""

from __future__ import annotations

import json
from pathlib import Path
import re
import sys

from pyshacl import validate as shacl_validate
from rdflib import Graph, Namespace, RDF, URIRef
from rdflib.namespace import DCTERMS, OWL, SKOS

ROOT = Path(__file__).resolve().parents[1]
ONTOLOGY = ROOT / "static" / "ontology"
SHAPES = ONTOLOGY / "sstim-shapes.ttl"
BSC_VOCAB = ONTOLOGY / "frameworks" / "bsc" / "bsc-vocab.ttl"
BSC_SHAPES = ONTOLOGY / "frameworks" / "bsc" / "bsc-shapes.ttl"
PROTOCOL_DIR = ONTOLOGY / "instances" / "protocols"
FIXTURE_ROOT = "https://example.org/protocol-layer-fixture/"

SSTIM = Namespace("https://w3id.org/sstim#")
BSCLAB_PROTOCOL = Namespace("https://w3id.org/sstim/implementation/bsclab/protocol/")
SSTIM_V = Namespace("https://w3id.org/sstim/vocab#")
SSTIM_EX = Namespace("https://w3id.org/sstim/exposure#")
SH = Namespace("http://www.w3.org/ns/shacl#")

REQUIRED_CLASSES = {
    SSTIM: ["StimulusMagnitude", "QuantityKind", "MeasurementUnit", "DeliveryStage", "ValueBasis",
            "ParticipantReference", "ControlLaw", "MeasuredSignalKind", "OscillationPhaseTarget",
            "StimulationSchedule", "ScheduleSegment", "SegmentRole", "StudyArm", "StudyArmRole",
            "ArmAllocation", "SleepStage", "MagnitudeProgression"],
    SSTIM_EX: ["OnsetIntervalDistribution"],
}
REQUIRED_PROPERTIES = {
    SSTIM: ["hasMagnitude", "magnitudeQuantity", "magnitudeUnit", "magnitudeValue", "magnitudeMinimum",
            "magnitudeMaximum", "deliveryStage", "valueBasis", "relativeToParticipantMeasure",
            "measurementDistanceMetres", "reportedAs", "quantityUnit", "hasControlLaw",
            "controlInputSignal", "trackedOscillation", "targetOscillationPhase",
            "detectionThresholdValue", "detectionThresholdUnit", "triggerDelaySeconds",
            "stimuliPerTrigger", "refractoryPeriodSeconds", "controlsChannel", "hasSchedule",
            "sessionDurationSeconds", "sessionsPerDay", "sessionCount", "courseDurationValue",
            "courseDurationUnit", "trialsPerBlock", "blocksPerSession", "hasScheduleSegment",
            "segmentOrder", "segmentDurationSeconds", "segmentRole", "segmentStimulus", "hasStudyArm",
            "armRole", "armStimulus", "armAllocation", "hasStudyPopulation", "protocolStudyDesign",
            "populationTaxon", "populationCondition", "interStimulusIntervalSeconds",
            "thresholdUpdateIntervalSeconds", "thresholdWindowSeconds", "triggerDelayReference",
            "deliveryRestrictedToSleepStage", "hasProgression", "progressionStepValue",
            "progressionStepMinimum", "progressionStepMaximum", "progressionStepUnit",
            "progressionIntervalValue", "progressionIntervalUnit", "progressionLimit"],
    SSTIM_EX: ["hasInitialPhase", "hasOnsetIntervalDistribution", "meanOnsetIntervalSeconds",
               "minOnsetIntervalSeconds", "maxOnsetIntervalSeconds", "displayRefreshRateHz",
               "viewingDistanceMetres", "sourceWidthMetres", "sourceHeightMetres", "visualAngleDegrees"],
}
# Concepts the published protocols or the constraints depend on by name.
REQUIRED_CONCEPTS = {
    SSTIM_V: ["stageConfigured", "stageEmitted", "stageAtSubject", "stageAtTarget",
              "stageSubjectRelative", "stagePerceived", "stageUnstated", "valueSpecified",
              "valueMeasured", "valueReported", "valueModelled", "unitDay", "unitWeek", "unitMonth",
              "quantitySoundPressureLevel", "quantityIlluminance", "armExperimental",
              "armActiveComparator", "armSham", "armNoStimulation", "slowOscillation", "sleepSpindle",
              "measuredEeg", "phaseUpState", "quantityTempo", "quantityLevelAboveComponent",
              "unitBeatsPerMinute", "referenceTroughToPeakInterval", "sleepWake", "sleepN1", "sleepN2",
              "sleepN3", "sleepRem"],
    SSTIM_EX: ["placementOneEar"],
}
# Named rather than inferred: calling a protocol published because it cites a
# paper would make the check that each one cites a paper true by construction.
PUBLISHED_PROTOCOLS = (
    "galambos-1981-40hz-auditory-steady-state-response",
    "thaut-1996-rhythmic-auditory-stimulation-gait",
    "lane-1998-binaural-beats-vigilance",
    "ngo-2013-closed-loop-auditory-slow-oscillation",
    "iaccarino-2016-40hz-visual-flicker",
    "wang-2017-ssvep-40-target-speller",
    "martorell-2019-40hz-auditory-tone-train",
    "martorell-2019-40hz-audiovisual",
    "chan-2022-40hz-audiovisual-daily-home-use",
)
# BSC Lab's own, which name the BSC framework and cite no paper.
REFERENCE_PROTOCOLS = (
    "auditory-observation-reference",
    "guided-breathing-observation-reference",
)

PREAMBLE = """
@prefix ex:       <https://example.org/protocol-layer-fixture/> .
@prefix dct:      <http://purl.org/dc/terms/> .
@prefix rdfs:     <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:      <http://www.w3.org/2001/XMLSchema#> .
@prefix sstim:    <https://w3id.org/sstim#> .
@prefix sstim-ex: <https://w3id.org/sstim/exposure#> .
@prefix sstim-v:  <https://w3id.org/sstim/vocab#> .
"""

BASELINE = """
ex:protocol a sstim:SensoryStimulationProtocol ;
    rdfs:label "Fixture protocol"@en ;
    dct:description "A fixture protocol accountable to a paper rather than to a framework."@en ;
    sstim:usesTechnique sstim-v:techClickTrain ;
    dct:source ex:paper ;
    sstim:hasSchedule ex:schedule ;
    sstim:hasStudyArm ex:arm-experimental, ex:arm-none ;
    sstim:armAllocation sstim-v:allocationBetweenSubject ;
    sstim:protocolStudyDesign sstim-v:designControlledTrial ;
    sstim:hasStudyPopulation ex:population .

ex:paper a sstim:BibliographicReference ;
    dct:title "A fixture paper" ;
    dct:source <https://doi.org/10.0000/fixture-paper> .

ex:population a sstim:PopulationDescriptor ;
    rdfs:label "Fixture population"@en ;
    sstim:populationTaxon <http://purl.obolibrary.org/obo/NCBITaxon_9606> .

ex:schedule a sstim:StimulationSchedule ;
    sstim:sessionDurationSeconds 600.0 ;
    sstim:sessionsPerDay 1.0 ;
    sstim:sessionCount 10 ;
    sstim:courseDurationValue 2.0 ;
    sstim:courseDurationUnit sstim-v:unitWeek ;
    sstim:trialsPerBlock 20 ;
    sstim:blocksPerSession 2 ;
    sstim:hasScheduleSegment ex:segment-cue, ex:segment-stimulus .

ex:segment-cue a sstim:ScheduleSegment ;
    sstim:segmentOrder 1 ;
    sstim:segmentDurationSeconds 1.0 ;
    sstim:segmentRole sstim-v:segmentCue .

ex:segment-stimulus a sstim:ScheduleSegment ;
    sstim:segmentOrder 2 ;
    sstim:segmentDurationSeconds 4.0 ;
    sstim:segmentRole sstim-v:segmentStimulation ;
    sstim:segmentStimulus ex:stimulus .

ex:arm-experimental a sstim:StudyArm ;
    rdfs:label "Experimental"@en ;
    sstim:armRole sstim-v:armExperimental ;
    sstim:armStimulus ex:stimulus .

ex:arm-none a sstim:StudyArm ;
    rdfs:label "Nothing"@en ;
    sstim:armRole sstim-v:armNoStimulation .

ex:stimulus a sstim:StimulusSpecification ;
    rdfs:label "Fixture stimulus"@en ;
    sstim:stimulusRegime "determinate" ;
    sstim:hasStimulusChannel ex:channel, ex:random-channel, ex:screen .

ex:channel a sstim-ex:StimulusChannel ;
    rdfs:label "Fixture audio channel"@en ;
    sstim-ex:deliveryMedium sstim-ex:mediumAirConductedSound ;
    sstim-ex:perceivedModality sstim-ex:modalityAuditory ;
    sstim-ex:hasBodyPlacement sstim-ex:placementEars ;
    sstim-ex:hasInitialPhase 0.25 ;
    sstim:hasMagnitude ex:level, ex:range, ex:relative, ex:tempo, ex:tone-level .

ex:level a sstim:StimulusMagnitude ;
    sstim:magnitudeQuantity sstim-v:quantitySoundPressureLevel ;
    sstim:magnitudeValue 65.0 ;
    sstim:magnitudeUnit sstim-v:unitDecibel ;
    sstim:deliveryStage sstim-v:stageAtSubject ;
    sstim:valueBasis sstim-v:valueMeasured .

ex:range a sstim:StimulusMagnitude ;
    sstim:magnitudeQuantity sstim-v:quantitySoundPressureLevel ;
    sstim:magnitudeMinimum 60.0 ;
    sstim:magnitudeMaximum 70.0 ;
    sstim:magnitudeUnit sstim-v:unitDecibel ;
    sstim:deliveryStage sstim-v:stageUnstated ;
    sstim:valueBasis sstim-v:valueReported ;
    sstim:reportedAs "between 60 and 70 dB" .

ex:relative a sstim:StimulusMagnitude ;
    sstim:magnitudeQuantity sstim-v:quantityLevelAboveReference ;
    sstim:magnitudeValue 40.0 ;
    sstim:magnitudeUnit sstim-v:unitDecibel ;
    sstim:deliveryStage sstim-v:stageSubjectRelative ;
    sstim:relativeToParticipantMeasure sstim-v:referenceHearingThreshold ;
    sstim:valueBasis sstim-v:valueSpecified ;
    sstim:hasProgression ex:level-progression .

ex:level-progression a sstim:MagnitudeProgression ;
    sstim:progressionStepValue 2.0 ;
    sstim:progressionStepUnit sstim-v:unitDecibel ;
    sstim:progressionIntervalValue 3.0 ;
    sstim:progressionIntervalUnit sstim-v:unitDay .

ex:tempo a sstim:StimulusMagnitude ;
    sstim:magnitudeQuantity sstim-v:quantityRatioToReference ;
    sstim:magnitudeValue 105.0 ;
    sstim:magnitudeUnit sstim-v:unitPercent ;
    sstim:deliveryStage sstim-v:stageSubjectRelative ;
    sstim:relativeToParticipantMeasure sstim-v:referenceBaselineCadence ;
    sstim:valueBasis sstim-v:valueSpecified ;
    sstim:hasProgression ex:tempo-progression .

ex:tempo-progression a sstim:MagnitudeProgression ;
    sstim:progressionStepMinimum 5.0 ;
    sstim:progressionStepMaximum 10.0 ;
    sstim:progressionStepUnit sstim-v:unitPercent ;
    sstim:progressionIntervalValue 1.0 ;
    sstim:progressionIntervalUnit sstim-v:unitWeek ;
    sstim:progressionLimit ex:tempo-ceiling .

ex:tempo-ceiling a sstim:StimulusMagnitude ;
    sstim:magnitudeQuantity sstim-v:quantityTempo ;
    sstim:magnitudeValue 130.0 ;
    sstim:magnitudeUnit sstim-v:unitBeatsPerMinute ;
    sstim:deliveryStage sstim-v:stageConfigured ;
    sstim:valueBasis sstim-v:valueSpecified .

ex:tone-level a sstim:StimulusMagnitude ;
    rdfs:label "Tones above the noise"@en ;
    sstim:magnitudeQuantity sstim-v:quantityLevelAboveComponent ;
    sstim:magnitudeValue 15.0 ;
    sstim:magnitudeUnit sstim-v:unitDecibel ;
    sstim:deliveryStage sstim-v:stageConfigured ;
    sstim:valueBasis sstim-v:valueSpecified .

ex:random-channel a sstim-ex:StimulusChannel ;
    rdfs:label "Fixture randomly timed channel"@en ;
    sstim-ex:deliveryMedium sstim-ex:mediumAirConductedSound ;
    sstim-ex:perceivedModality sstim-ex:modalityAuditory ;
    sstim-ex:hasBodyPlacement sstim-ex:placementOneEar ;
    sstim-ex:hasOnsetIntervalDistribution sstim-ex:intervalUniform ;
    sstim-ex:minOnsetIntervalSeconds 0.01 ;
    sstim-ex:meanOnsetIntervalSeconds 0.025 ;
    sstim-ex:maxOnsetIntervalSeconds 0.04 .

ex:screen a sstim-ex:StimulusChannel ;
    rdfs:label "Fixture screen"@en ;
    sstim-ex:deliveryMedium sstim-ex:mediumVisualLight ;
    sstim-ex:perceivedModality sstim-ex:modalityVisual ;
    sstim-ex:hasBodyPlacement sstim-ex:placementNearbyEnvironment ;
    sstim-ex:displayRefreshRateHz 60.0 ;
    sstim-ex:viewingDistanceMetres 0.7 ;
    sstim-ex:sourceWidthMetres 0.04 ;
    sstim-ex:sourceHeightMetres 0.04 ;
    sstim-ex:visualAngleDegrees 3.3 ;
    sstim:hasMagnitude ex:luminance .

ex:luminance a sstim:StimulusMagnitude ;
    sstim:magnitudeQuantity sstim-v:quantityLuminance ;
    sstim:magnitudeValue 120.0 ;
    sstim:magnitudeUnit sstim-v:unitCandelaPerSquareMetre ;
    sstim:deliveryStage sstim-v:stageEmitted ;
    sstim:measurementDistanceMetres 0.7 ;
    sstim:valueBasis sstim-v:valueMeasured .

ex:adaptive a sstim:StimulusSpecification ;
    rdfs:label "Fixture adaptive stimulus"@en ;
    sstim:stimulusRegime "adaptive" ;
    sstim:hasControlLaw ex:law .

ex:law a sstim:ControlLaw ;
    sstim:controlInputSignal sstim-v:measuredEeg ;
    sstim:trackedOscillation sstim-v:slowOscillation ;
    sstim:targetOscillationPhase sstim-v:phaseUpState ;
    sstim:detectionThresholdValue -75.0 ;
    sstim:detectionThresholdUnit sstim-v:unitMicrovolt ;
    sstim:thresholdUpdateIntervalSeconds 2.0 ;
    sstim:thresholdWindowSeconds 5.0 ;
    sstim:triggerDelaySeconds 0.4 ;
    sstim:stimuliPerTrigger 3 ;
    sstim:interStimulusIntervalSeconds 1.0 ;
    sstim:refractoryPeriodSeconds 2.0 ;
    sstim:deliveryRestrictedToSleepStage sstim-v:sleepN2, sstim-v:sleepN3 ;
    sstim:controlsChannel ex:channel .

ex:calibrated a sstim:StimulusSpecification ;
    rdfs:label "Fixture calibrated stimulus"@en ;
    sstim:stimulusRegime "adaptive" ;
    sstim:hasControlLaw ex:calibrated-law .

ex:calibrated-law a sstim:ControlLaw ;
    sstim:controlInputSignal sstim-v:measuredEeg ;
    sstim:trackedOscillation sstim-v:slowOscillation ;
    sstim:targetOscillationPhase sstim-v:phaseUpState ;
    sstim:triggerDelayReference sstim-v:referenceTroughToPeakInterval ;
    sstim:stimuliPerTrigger 1 ;
    sstim:controlsChannel ex:channel .
"""


def drop(text: str, line: str) -> str:
    assert line in BASELINE, line
    return BASELINE.replace(line, "")


def swap(old: str, new: str) -> str:
    assert old in BASELINE, old
    return BASELINE.replace(old, new, 1)


# (label, broken fixture, a fragment the rejecting message must contain)
CASES = [
    ("a protocol with neither a framework nor a cited source",
     drop(BASELINE, "    dct:source ex:paper ;\n"),
     "must name the framework that defines it, or cite"),
    ("a protocol citing a source that is not a bibliographic record",
     swap("    dct:source ex:paper ;\n", "    dct:source <https://doi.org/10.0000/not-a-record> ;\n"),
     "must name the framework that defines it, or cite"),
    ("a protocol naming an undeclared framework",
     swap("    dct:source ex:paper ;\n", "    dct:source ex:paper ;\n    sstim:definedByFramework ex:not-a-framework ;\n"),
     "must be a declared sensory stimulation framework"),
    ("a protocol with no label",
     drop(BASELINE, '    rdfs:label "Fixture protocol"@en ;\n'),
     "must have at least one rdfs:label"),
    ("a protocol with no description",
     drop(BASELINE, '    dct:description "A fixture protocol accountable to a paper rather than to a framework."@en ;\n'),
     "scoped dct:description"),
    ("a magnitude stating no stage",
     drop(BASELINE, "    sstim:deliveryStage sstim-v:stageAtSubject ;\n"),
     "where in the delivery chain"),
    ("a magnitude stating a value beside a bound",
     swap("    sstim:magnitudeValue 65.0 ;\n", "    sstim:magnitudeValue 65.0 ;\n    sstim:magnitudeMinimum 60.0 ;\n"),
     "either one value or both bounds"),
    ("a magnitude stating neither a value nor a range",
     drop(BASELINE, "    sstim:magnitudeValue 65.0 ;\n"),
     "either one value or both bounds"),
    ("a range running backwards",
     swap("    sstim:magnitudeMinimum 60.0 ;\n    sstim:magnitudeMaximum 70.0 ;",
          "    sstim:magnitudeMinimum 70.0 ;\n    sstim:magnitudeMaximum 60.0 ;"),
     "must not run backwards"),
    ("sound pressure stated in lux",
     swap("    sstim:magnitudeValue 65.0 ;\n    sstim:magnitudeUnit sstim-v:unitDecibel ;",
          "    sstim:magnitudeValue 65.0 ;\n    sstim:magnitudeUnit sstim-v:unitLux ;"),
     "never stated in lux"),
    ("a subject-relative magnitude naming no participant measure",
     drop(BASELINE, "    sstim:relativeToParticipantMeasure sstim-v:referenceHearingThreshold ;\n"),
     "must name the participant measure"),
    ("a participant measure on a magnitude that is not subject-relative",
     swap("    sstim:deliveryStage sstim-v:stageSubjectRelative ;", "    sstim:deliveryStage sstim-v:stageAtSubject ;"),
     "must name the participant measure"),
    ("a reported value without the source's words",
     drop(BASELINE, '    sstim:reportedAs "between 60 and 70 dB" .\n').replace(
         "    sstim:valueBasis sstim-v:valueReported ;\n", "    sstim:valueBasis sstim-v:valueReported .\n"),
     "keep the source's own words"),
    ("a control law reading no signal",
     drop(BASELINE, "    sstim:controlInputSignal sstim-v:measuredEeg ;\n"),
     "must name at least one signal"),
    ("a detection threshold value without its unit",
     drop(BASELINE, "    sstim:detectionThresholdUnit sstim-v:unitMicrovolt ;\n"),
     "value and its unit travel together"),
    ("a control law on a determinate specification",
     swap('    sstim:stimulusRegime "adaptive" ;', '    sstim:stimulusRegime "determinate" ;'),
     "Only an adaptive stimulus specification"),
    ("a stimulus delivered at fewer than one stimulus per trigger",
     swap("    sstim:stimuliPerTrigger 3 ;", "    sstim:stimuliPerTrigger 0 ;"),
     "of at least 1"),
    ("an empty schedule",
     re.sub(r"ex:schedule a sstim:StimulationSchedule ;.*?\.\n",
            "ex:schedule a sstim:StimulationSchedule .\n", BASELINE, count=1, flags=re.S),
     "empty schedule says nothing"),
    ("a course duration without its unit",
     drop(BASELINE, "    sstim:courseDurationUnit sstim-v:unitWeek ;\n"),
     "calendar unit travel together"),
    ("a course duration in a unit that is not a calendar unit",
     swap("    sstim:courseDurationUnit sstim-v:unitWeek ;", "    sstim:courseDurationUnit sstim-v:unitLux ;"),
     "calendar unit: day, week or month"),
    ("two segments in the same position",
     swap("    sstim:segmentOrder 2 ;", "    sstim:segmentOrder 1 ;"),
     "Segment positions are unique"),
    ("a segment stating no part",
     drop(BASELINE, "    sstim:segmentRole sstim-v:segmentCue .\n").replace(
         "    sstim:segmentDurationSeconds 1.0 ;\n", "    sstim:segmentDurationSeconds 1.0 .\n"),
     "must state the part it plays"),
    ("a no-stimulation arm presenting a stimulus",
     swap("    sstim:armRole sstim-v:armNoStimulation .",
          "    sstim:armRole sstim-v:armNoStimulation ;\n    sstim:armStimulus ex:stimulus ."),
     "presents no stimulus"),
    ("an arm stating no role",
     swap('    rdfs:label "Nothing"@en ;\n    sstim:armRole sstim-v:armNoStimulation .',
          '    rdfs:label "Nothing"@en .'),
     "must state the part it plays in its protocol"),
    ("interval statistics with no distribution",
     drop(BASELINE, "    sstim-ex:hasOnsetIntervalDistribution sstim-ex:intervalUniform ;\n"),
     "must name the distribution"),
    ("a minimum interval above the mean",
     swap("    sstim-ex:minOnsetIntervalSeconds 0.01 ;", "    sstim-ex:minOnsetIntervalSeconds 0.03 ;"),
     "must be ordered"),
    ("an initial phase of a whole cycle",
     swap("    sstim-ex:hasInitialPhase 0.25 ;", "    sstim-ex:hasInitialPhase 1.0 ;"),
     "up to but excluding 1"),
    ("a cited bibliographic record with no title",
     drop(BASELINE, '    dct:title "A fixture paper" ;\n'),
     "must have a title"),
    ("a cited bibliographic record with no source to check it against",
     swap('    dct:title "A fixture paper" ;\n    dct:source <https://doi.org/10.0000/fixture-paper> .',
          '    dct:title "A fixture paper" .'),
     "identified well enough to be checked"),
    ("a quantity kind listing no unit",
     BASELINE + "\nex:unitless-quantity a sstim:QuantityKind .\n",
     "must list at least one"),
    # ADR 0066
    ("an inter-stimulus interval on a law delivering one stimulus per trigger",
     swap("    sstim:stimuliPerTrigger 3 ;", "    sstim:stimuliPerTrigger 1 ;"),
     "An inter-stimulus interval separates the stimuli of one trigger"),
    ("an inter-stimulus interval of zero",
     swap("    sstim:interStimulusIntervalSeconds 1.0 ;", "    sstim:interStimulusIntervalSeconds 0.0 ;"),
     "interStimulusIntervalSeconds takes one positive"),
    ("a trigger delay both stated and calibrated",
     swap("    sstim:triggerDelayReference sstim-v:referenceTroughToPeakInterval ;",
          "    sstim:triggerDelayReference sstim-v:referenceTroughToPeakInterval ;\n"
          "    sstim:triggerDelaySeconds 0.5 ;"),
     "either stated in seconds or set from the subject's own measure"),
    ("a calibrated delay set to something that is not a participant measure",
     swap("    sstim:triggerDelayReference sstim-v:referenceTroughToPeakInterval ;",
          "    sstim:triggerDelayReference sstim-v:sleepN2 ;"),
     "triggerDelayReference takes one sstim:ParticipantReference"),
    ("an adaptive threshold recomputed from no stated window",
     drop(BASELINE, "    sstim:thresholdWindowSeconds 5.0 ;\n"),
     "states both how often it is recomputed and from how much recent signal"),
    ("an adaptive threshold with no starting value",
     drop(BASELINE, "    sstim:detectionThresholdValue -75.0 ;\n").replace(
         "    sstim:detectionThresholdUnit sstim-v:unitMicrovolt ;\n", ""),
     "starts from a stated detection threshold value"),
    ("delivery restricted to something that is not a sleep stage",
     swap("    sstim:deliveryRestrictedToSleepStage sstim-v:sleepN2, sstim-v:sleepN3 ;",
          "    sstim:deliveryRestrictedToSleepStage sstim-v:sleepN2, sstim-v:phaseUpState ;"),
     "deliveryRestrictedToSleepStage takes sstim:SleepStage values"),
    ("a progression stating no step unit",
     drop(BASELINE, "    sstim:progressionStepUnit sstim-v:unitPercent ;\n"),
     "must state the unit of its steps"),
    ("a progression stating no interval",
     drop(BASELINE, "    sstim:progressionIntervalValue 1.0 ;\n"),
     "must state how often it steps"),
    ("a progression stating neither a step nor a range",
     drop(BASELINE, "    sstim:progressionStepMinimum 5.0 ;\n").replace(
         "    sstim:progressionStepMaximum 10.0 ;\n", ""),
     "either one step or both bounds of a range of steps"),
    ("a progression stating a step beside a bound",
     swap("    sstim:progressionStepMinimum 5.0 ;",
          "    sstim:progressionStepMinimum 5.0 ;\n    sstim:progressionStepValue 7.0 ;"),
     "either one step or both bounds of a range of steps"),
    ("a progression's range of steps running backwards",
     swap("    sstim:progressionStepMinimum 5.0 ;\n    sstim:progressionStepMaximum 10.0 ;",
          "    sstim:progressionStepMinimum 10.0 ;\n    sstim:progressionStepMaximum 5.0 ;"),
     "range of steps must not run backwards"),
    ("a progression stepping in a unit its quantity is not stated in",
     swap("    sstim:progressionStepUnit sstim-v:unitDecibel ;", "    sstim:progressionStepUnit sstim-v:unitLux ;"),
     "steps in percent of the magnitude's value or in a unit"),
    ("a progression stepping every few hours",
     swap("    sstim:progressionIntervalUnit sstim-v:unitDay .", "    sstim:progressionIntervalUnit sstim-v:unitDecibel ."),
     "progressionIntervalUnit takes one calendar unit"),
    ("a progression limited by something that is not a magnitude",
     swap("    sstim:progressionLimit ex:tempo-ceiling .", "    sstim:progressionLimit ex:paper ."),
     "progressionLimit takes one sstim:StimulusMagnitude"),
    ("a magnitude with two progressions",
     swap("    sstim:hasProgression ex:tempo-progression .",
          "    sstim:hasProgression ex:tempo-progression, ex:level-progression ."),
     "hasProgression takes one sstim:MagnitudeProgression"),
    ("a level above another component that does not name them",
     drop(BASELINE, '    rdfs:label "Tones above the noise"@en ;\n'),
     "must name both components"),
]


def module_paths() -> list[Path]:
    manifest = json.loads((ONTOLOGY / "manifest.json").read_text(encoding="utf-8"))
    paths = [ROOT / m["source"]["path"] for m in manifest["modules"]]
    if not paths:
        raise SystemExit("protocol-layer: the manifest listed no modules")
    return paths


def instance_paths() -> list[Path]:
    return sorted((ONTOLOGY / "instances").rglob("*.ttl"))


def main() -> int:
    failures: list[str] = []
    graph = Graph()
    for path in module_paths():
        graph.parse(path, format="turtle")

    # ── Adds ────────────────────────────────────────────────────────────────
    for namespace, names in REQUIRED_CLASSES.items():
        for name in names:
            if (namespace[name], RDF.type, OWL.Class) not in graph:
                failures.append(f"{namespace[name]} is not declared as a class")
    properties = 0
    for namespace, names in REQUIRED_PROPERTIES.items():
        for name in names:
            properties += 1
            if not set(graph.objects(namespace[name], RDF.type)) & {OWL.ObjectProperty, OWL.DatatypeProperty}:
                failures.append(f"{namespace[name]} is not declared as a property")
    for namespace, names in REQUIRED_CONCEPTS.items():
        for name in names:
            if not list(graph.objects(namespace[name], SKOS.notation)):
                failures.append(f"{namespace[name]} is not a declared concept with a notation")

    # ── Uses ────────────────────────────────────────────────────────────────
    data = Graph()
    for path in instance_paths():
        data.parse(path, format="turtle")
    # Every protocol file is one this gate classifies, so a new one cannot
    # arrive unchecked as neither published nor BSC Lab's own.
    on_disk = sorted(path.stem for path in PROTOCOL_DIR.glob("*.ttl"))
    known = sorted(PUBLISHED_PROTOCOLS + REFERENCE_PROTOCOLS)
    if on_disk != known:
        failures.append(f"protocol files {on_disk} are not the classified set {known}")
    published = []
    for slug in PUBLISHED_PROTOCOLS:
        path = PROTOCOL_DIR / f"{slug}.ttl"
        if not path.exists():
            failures.append(f"{path.name} is missing")
            continue
        declared = sorted(
            s for s in Graph().parse(path, format="turtle").subjects(RDF.type, SSTIM.SensoryStimulationProtocol)
            if isinstance(s, URIRef)
        )
        if declared != [BSCLAB_PROTOCOL[slug]]:
            failures.append(f"{path.name} must declare exactly the protocol it is named after, found {declared}")
        published.append(BSCLAB_PROTOCOL[slug])
    for protocol in published:
        cited = [r for r in data.objects(protocol, DCTERMS.source)
                 if (r, RDF.type, SSTIM.BibliographicReference) in data]
        if not cited:
            failures.append(f"{protocol} cites no declared bibliographic record")
        if list(data.objects(protocol, SSTIM.definedByFramework)):
            failures.append(f"{protocol} names a framework; a published protocol is accountable to its paper")

    # ── Constraints, adversarially, in one pySHACL run ──────────────────────
    shapes = Graph().parse(SHAPES, format="turtle")
    shapes.parse(BSC_SHAPES, format="turtle")

    # The lookbehind keeps sstim-ex: intact: a hyphen is a word boundary, so a
    # plain \b would rewrite the exposure prefix along with the fixture's own.
    def namespaced(fixture: str, tag: str) -> str:
        return re.sub(r"(?<![\w-])ex:", f"ex:{tag}-", fixture)

    combined = Graph()
    for triple in graph:
        combined.add(triple)
    for triple in data:
        combined.add(triple)
    combined.parse(BSC_VOCAB, format="turtle")
    combined.parse(data=PREAMBLE + namespaced(BASELINE, "p0"), format="turtle")
    for index, (_, fixture, _) in enumerate(CASES):
        combined.parse(data=PREAMBLE + namespaced(fixture, f"n{index}"), format="turtle")

    conforms_overall, results, _ = shacl_validate(combined, shacl_graph=shapes, advanced=True)

    reported: dict[str, list[str]] = {}
    for result in results.subjects(RDF.type, SH.ValidationResult):
        for focus in results.objects(result, SH.focusNode):
            for message in results.objects(result, SH.resultMessage):
                reported.setdefault(str(focus), []).append(str(message))

    def messages_for(tag: str) -> list[str]:
        prefix = f"{FIXTURE_ROOT}{tag}-"
        return [m for node, ms in reported.items() if node.startswith(prefix) for m in ms]

    outside = sorted({node for node in reported if not node.startswith(FIXTURE_ROOT)})
    if outside:
        failures.append(f"the committed data itself fails validation at {outside[:3]}")

    positive = messages_for("p0")
    if positive:
        failures.append(f"the positive fixture was rejected: {positive[:3]}")

    for index, (label, _, fragment) in enumerate(CASES):
        hits = messages_for(f"n{index}")
        if not hits:
            failures.append(f"{label}: accepted, but must be rejected")
        elif not any(fragment in m for m in hits):
            failures.append(
                f"{label}: rejected, but not by its own constraint: expected a message "
                f"containing {fragment!r}, got {hits[:2]}"
            )

    if failures:
        print(f"protocol-layer: FAILED ({len(failures)})", file=sys.stderr)
        for failure in failures:
            print(f"  - {failure}", file=sys.stderr)
        return 1

    classes = sum(len(v) for v in REQUIRED_CLASSES.values())
    print(
        f"protocol-layer: passed ({classes} classes, {properties} properties and "
        f"{sum(len(v) for v in REQUIRED_CONCEPTS.values())} named concepts present; {len(published)} published protocols, "
        f"each citing its paper and none a framework; {len(CASES)} adversarial cases rejected "
        f"by their own constraint, 1 positive fixture using every new term accepted)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
