# SSTIM term index

**Generated — do not edit.** `make term-index` rebuilds it from the manifest-owned modules; `make term-index-check` fails if it is stale, and runs in `make validate`.

This exists to be grepped before concluding that SSTIM lacks a term. It was added after three consecutive claims that a term was missing when it was not — the generic `sstim:composedOfTrack`, `sstim-ex:perceivedModality`, and the per-rendering rate properties on a stimulus channel. Eighteen modules is more than anyone reliably searches by hand.

157 classes · 284 properties · 525 concepts · 18 modules

## Classes

| Term | Module | Subclass of | Definition |
|---|---|---|---|
| `sstim-eco:AmendmentActivity` | ecosystem | sstim-eco:EngagementActivity | An operational activity recording that an ecosystem relationship was amended, with the revision chain expressed using PROV. Invalidated values and… |
| `sstim-eco:ConsentDecisionActivity` | ecosystem | sstim-eco:EngagementActivity | An activity recording a controlled consent outcome for one relationship and purpose. Raw consent evidence remains private and is not represented by… |
| `sstim-eco:EcosystemAgent` | ecosystem |  | A person or organization active in, or relevant to, the field of sensory stimulation, recorded in the SSTIM ecosystem. Instances are additionally… |
| `sstim-eco:EcosystemPurpose` | ecosystem |  | A controlled purpose for which an ecosystem relationship or engagement activity is recorded, such as public discovery, attribution, outreach, or… |
| `sstim-eco:EcosystemRelationship` | ecosystem |  | A named, qualified record binding exactly one ecosystem agent to one target, relationship type, purpose, source set, curator, and review history so… |
| `sstim-eco:EngagementActivity` | ecosystem |  | A named activity recording one lifecycle event for one ecosystem relationship, with a purpose, controlled outcome, timestamp, and responsible agent.… |
| `sstim-eco:EngagementOutcome` | ecosystem |  | A controlled minimal outcome of an ecosystem engagement activity. Positive admission outcomes may appear in the public current-state graph; negative… |
| `sstim-eco:ImplementationResponsibility` | ecosystem | sstim-eco:EcosystemRelationship | A qualified relationship identifying a person or organization that develops, publishes, maintains, provides, operates, hosts, or funds a specific… |
| `sstim-eco:ImplementationResponsibilityType` | ecosystem | sstim-eco:RelationshipType | A controlled relationship type identifying how a person or organization is responsible for a sensory-stimulation implementation, such as developer,… |
| `sstim-eco:NotificationActivity` | ecosystem | sstim-eco:EngagementActivity | An activity recording that notification about an ecosystem relationship was sent or failed, without publishing its channel, address, or message. |
| `sstim-eco:OrganizationMembership` | ecosystem | sstim-eco:EcosystemRelationship | A sourced, time-qualified relationship in which a person is a member of an organization in an identified ORG role. The member and organization also… |
| `sstim-eco:PublicationDecisionActivity` | ecosystem | sstim-eco:EngagementActivity | An activity recording whether a qualified ecosystem relationship is approved or withheld for publication under its declared purpose. In a public… |
| `sstim-eco:RelationshipType` | ecosystem |  | A controlled category describing how an ecosystem agent relates to sensory stimulation or to SSTIM (e.g. contributor, stakeholder, cited author).… |
| `sstim-eco:ResponseActivity` | ecosystem | sstim-eco:EngagementActivity | An activity recording a controlled response outcome for an ecosystem relationship without publishing response text or private evidence. Only… |
| `sstim-eco:WithdrawalActivity` | ecosystem | sstim-eco:EngagementActivity | An operational activity recording a removal request or consent withdrawal for one qualified ecosystem relationship. The event is retained in the… |
| `sstim-ex:AudioNoiseColor` | exposure | sstim-ex:StimulusPattern | Controlled vocabulary class for named audio-noise color conventions. Names vary across communities and should be defined by spectral slope when… |
| `sstim-ex:BiohackingContext` | exposure | sstim-ex:ExperimentContext | Experiment context for exploratory self-observation, sensory experimentation, or non-clinical biohacking practice. |
| `sstim-ex:BodyPlacement` | exposure |  | Controlled vocabulary class for where a device, medium, or exposure is placed on, in, or near the body. |
| `sstim-ex:BoundaryApplicabilityStatement` | exposure |  | A reasoned statement that a named comfort or safety boundary or exposure limit applies to a profile or channel. An applicability judgment, not an… |
| `sstim-ex:ComfortBoundary` | exposure |  | A boundary or caution condition for comfort, discomfort, awareness, fatigue, or risk during an exposure. |
| `sstim-ex:DeviceCapability` | exposure |  | Controlled vocabulary class for hardware or environmental capabilities required to deliver, separate, sense, or shape an exposure. |
| `sstim-ex:EffectDimension` | exposure | sstim:EvidenceOutcomeConcept | Controlled vocabulary class for comfort, risk, perception, and physiological dimensions that a hypothesis, research question, design objective, or… |
| `sstim-ex:ExperimentContext` | exposure |  | Information artifact describing the local context of an exploratory protocol or exposure example. |
| `sstim-ex:ExploratoryProtocol` | exposure |  | Non-clinical protocol used to explore an exposure idea, capability boundary, or perceptual hypothesis without asserting treatment, diagnosis, cure,… |
| `sstim-ex:ExposureDesignObjective` | exposure |  | A desired delivery capability or experience that does not predict an observed effect. Any empirical expectation belongs in a separate hypothesis. |
| `sstim-ex:ExposureEffectClaim` | exposure | sstim:EvidenceClaim | Deprecated ADR 0027: this class mixed hypotheses, questions, boundary applicability, requirements, design objectives, planned outcomes, and status… |
| `sstim-ex:ExposureHypothesis` | exposure |  | A testable proposition asserting an expected relation, difference, or direction for an exposure. Not evidence: it carries no tier, direction, basis,… |
| `sstim-ex:ExposureLimit` | exposure |  | A quantified safety limit for an exposure, such as a maximum flash frequency, a sound-level dose, or an optical-radiation exposure boundary. An… |
| `sstim-ex:ExposureMeasurementRequirement` | exposure | sstim-ex:ProtocolRequirement | A protocol requirement identifying the exposure quantities and sensor capability that must be measured or recorded. |
| `sstim-ex:ExposureProfile` | exposure |  | Information artifact describing how one exploratory or operational stimulation exposure is delivered, perceived, placed, bounded, and interpreted. |
| `sstim-ex:KnowledgeStatus` | exposure |  | Local status vocabulary for distinguishing known SSTIM patterns, hypotheses, unknowns, lack of known SSTIM evidence, and BSC Lab capability… |
| `sstim-ex:KnowledgeStatusActivity` | exposure |  | The PROV activity that generates a knowledge-status assertion, recording time, method/corpus revision, and a qualified responsible agent/role. |
| `sstim-ex:KnowledgeStatusAssertion` | exposure |  | An immutable, scoped, dated assertion assigning an existing controlled KnowledgeStatus value to an identified subject: exactly one subject link, one… |
| `sstim-ex:PerceivedModality` | exposure |  | Controlled vocabulary class for the sensory, perceptual, behavioral, interoceptive, or social-perceptual channel engaged by an exposure. |
| `sstim-ex:PerceptualGain` | exposure |  | A perceived capability, salience, immersion, or access gained by an exposure setup. |
| `sstim-ex:PerceptualLoss` | exposure |  | A perceived field, awareness, comfort, capability, or certainty lost or reduced by an exposure setup. |
| `sstim-ex:PhysicalDeliveryMedium` | exposure |  | Controlled vocabulary class for the physical medium, energy, material, or environmental interface through which a stimulus or exposure reaches a… |
| `sstim-ex:PlannedOutcomeSpecification` | exposure |  | A dimension and collection/comparison plan for an exposure — what would be collected and compared, not an observation result. |
| `sstim-ex:ProtocolRequirement` | exposure |  | A reproducibility, measurement, context, or study-design requirement constraining a protocol, profile, or channel. |
| `sstim-ex:ResearchQuestion` | exposure |  | An open question about an exposure that asserts no expected result. |
| `sstim-ex:StimulusChannel` | stimulus |  | A channel within a stimulus specification or exposure profile, such as an audio, visual, haptic, respiratory, olfactory, gustatory, or… |
| `sstim-ex:StimulusChannelRole` | exposure |  | A controlled category for the part a stimulus channel plays in an exposure: an intended causal intervention path, an associated concomitant… |
| `sstim-ex:StimulusPattern` | exposure |  | Controlled vocabulary class for temporal, spatial, color, or stochastic stimulus patterns. |
| `sstim-ex:VisualNoiseType` | exposure | sstim-ex:StimulusPattern | Controlled vocabulary class for visual noise, visual field, and simple visual stimulus types. |
| `sstim:AssessmentProposition` | evidence |  | One immutable, atomic, independently assessable proposition evaluated by an evidence assessment: exactly one subject, one outcome concept, one… |
| `sstim:AssessmentScope` | evidence |  | The explicit modality, population/model, intervention/context, and comparator scope of an assessment proposition. Every axis carries a named value… |
| `sstim:AudioTrack` | configuration | sstim:Track | A track whose output is audible: an isochronic tone, a binaural carrier pair, a plain carrier, noise, a drone, or a sample. |
| `sstim:BibliographicReference` | evidence |  | A bibliographic record of a published source. Being recorded implies neither endorsement nor permission to quote, reproduce, or display the source. |
| `sstim:BinauralVoice` | patch-studio | sstim:Voice | Two sine tones at slightly different frequencies (fl, fr) presented dichotically to produce a perceived beat at \|fr - fl\| Hz. |
| `sstim:CanonicalSensoryTransductionAccessRoute` | neuromodulation | sstim:NeuralAccessRoute | A neural access route that engages canonical sensory receptor transduction and afferent processing. This is the route value that distinguishes the… |
| `sstim:CautionSeverity` | common |  | A controlled ordinal category for prioritizing a caution tag in user interfaces and validation. Severity describes the response required by the… |
| `sstim:CautionTag` | common |  | A safety or usage advisory flag attached to a preset, signalling conditions under which the preset may be unsuitable (e.g. photosensitivity risk,… |
| `sstim:ClaimDirection` | evidence |  | Whether a body of evidence supports, is mixed on, is inconclusive about, or refutes the asserted relation. |
| `sstim:ComparatorDescriptor` | evidence |  | An identified description of the comparison condition (for example sham, no-stimulus, baseline, or alternative frequency) referenced by an… |
| `sstim:ConflictDisclosure` | evidence |  | A record of declared conflicts of interest for a review, including the explicit declaration that no conflict was declared. |
| `sstim:ControlTrack` | configuration | sstim:Track | A track that produces no sensory output of its own and instead supplies a time-varying control signal modulating parameters of other tracks.… |
| `sstim:DeliberateSelfRegulation` | neuromodulation |  | A deliberate process in which an individual attempts to regulate their own neural, physiological, or affective state, whether or not an external… |
| `sstim:EffectDirection` | evidence |  | The direction of the measured outcome (increase, decrease, or no change). Wellness-neutral; describes what was measured, not a health claim. |
| `sstim:EntrainmentBasedTechnique` | technique | sstim:SensoryStimulationTechnique | A Sensory Stimulation technique whose primary proposed mechanism involves frequency-following responses, phase-locking, or oscillatory coupling… |
| `sstim:EvidenceAssessmentActivity` | evidence |  | The PROV activity that generates an evidence assessment revision. It used every qualified basis, its sources, and the immutable rubric/method… |
| `sstim:EvidenceAssessmentClaim` | evidence | sstim:EvidenceClaim | A versioned, immutable assessment of an identified evidence basis about one atomic bounded proposition. The sole concrete evidence-bearing class:… |
| `sstim:EvidenceBasis` | evidence |  | One qualified contribution of a single source to an evidence assessment, carrying source-level modality, intervention, study design,… |
| `sstim:EvidenceClaim` | evidence |  | Compatibility superclass of evidence assessments. Direct instantiation is rejected by SHACL: every instance must carry a concrete evidence subtype… |
| `sstim:EvidenceModalityTag` | evidence |  | Deprecated ADR 0027: the tag conflated sensory modality (AUD, AV, VIS, TACTILE, MULTISENSORY), intervention (BREATH), study model (PRECLINICAL), and… |
| `sstim:EvidenceOutcomeConcept` | evidence |  | A controlled endpoint, response, or mechanism category used to identify what a proposition or reported source result is about. It is a category, not… |
| `sstim:EvidencePropositionForm` | evidence |  | The logical form of an assessment proposition: bounded relation, bounded null result, scoped search finding, or universal absence. Universal-absence… |
| `sstim:EvidenceReviewActivity` | evidence |  | The PROV activity that reviews exactly one assessment revision under a named rubric/policy revision and generates an immutable evidence review… |
| `sstim:EvidenceReviewDecision` | evidence |  | An immutable review decision about one assessment revision: reviewer relationship, independence determination, and decision are independent axes. A… |
| `sstim:EvidenceSearchActivity` | evidence |  | The PROV activity that executes an evidence search and generates an immutable evidence search record, with execution times and a qualified… |
| `sstim:EvidenceSearchRecord` | evidence |  | An immutable, reproducible record of a literature/evidence search: sources, exact query, coverage dates, eligibility criteria, result count, and… |
| `sstim:EvidenceSynthesisType` | evidence |  | The synthesis level of an evidence source: primary study, narrative review, systematic review, meta-analysis, literature review, or tutorial. A… |
| `sstim:EvidenceTierValue` | evidence |  | A classification of empirical support strength for a specific stimulation claim, accounting for study quality, result consistency, modality match,… |
| `sstim:ExperienceOnsetPhase` | session |  | A controlled category locating when an unwanted experience began, relative to the session. |
| `sstim:ExperiencePersistence` | session |  | A controlled category recording how long an unwanted experience lasted, as the participant described it. |
| `sstim:ExperienceResolution` | session |  | A controlled category recording the state an unwanted experience reached. |
| `sstim:ExperienceResponseAction` | session |  | A controlled category recording what the participant did in response to an unwanted experience. |
| `sstim:FrequencyBand` | common |  | An information entity describing a named Hz range used in BSC protocol design for targeting and evidence classification. BSC operational design… |
| `sstim:FrequencyBandGroup` | common |  | A named collection of frequency bands used as a SKOS scheme root or aggregate grouping concept. Not a band with a specific Hz range; used for SKOS… |
| `sstim:GovernedResearchOutput` | evidence |  | A versioned study record, dataset revision, or analysis output admitted as an evidence source. Requires exactly one source-governance record; an… |
| `sstim:HapticTrack` | configuration | sstim:Track | A track whose output is delivered as vibration through a device actuator. |
| `sstim:IndependenceDetermination` | evidence |  | A policy-based determination of reviewer independence: independent, not independent, or undetermined. An independent or not-independent… |
| `sstim:IntendedEffect` | common |  | A controlled information category identifying a target change in physiological, psychological, or cognitive state that a sensory stimulation… |
| `sstim:InterventionalNeuromodulation` | neuromodulation | sstim:Neuromodulation | Neuromodulation applied to an individual by an external agent, device, or agent-administered means. This is the sense the ADR 0034 non-sensory… |
| `sstim:MartigliBinauralVoice` | patch-studio | sstim:Voice | Binaural beat combined with Martigli breathing oscillation. Both carriers sweep in parallel, maintaining constant beat frequency while timbral… |
| `sstim:MartigliVoice` | patch-studio | sstim:Voice | A single tone whose frequency oscillates sinusoidally with a breathing arc that decelerates linearly from mp0 to mp1 over md seconds. |
| `sstim:ModalityApplicability` | evidence |  | A controlled statement of how sensory modality applies to an evidence source: mixed modalities, unknown/not reported, or not applicable. Distinct… |
| `sstim:NeuralAccessRoute` | neuromodulation |  | A controlled category for the biological route through which a stimulation process is intended to engage a neural target. Route values describe the… |
| `sstim:NeuralOscillationType` | common |  | A controlled information category for a named rhythmic fluctuation of neural activity, such as the alpha or theta rhythm. Members are identified by… |
| `sstim:NeuralPhenomenon` | neuromodulation |  | A controlled information category for a coherent functional neural phenomenon, such as excitability or firing, oscillatory dynamics, temporal… |
| `sstim:NeuralSystem` | neuromodulation |  | A controlled information category for a distributed organizational neural system — sensory, motor, autonomic, or a named sensory subsystem. This is… |
| `sstim:NeuralTargetSite` | neuromodulation |  | A controlled information category for a broad anatomical target of a stimulation process, such as brain, cortex, deep-brain structure, spinal cord,… |
| `sstim:Neuromodulation` | neuromodulation | sstim:Stimulation | In SSTIM, a deliberately applied stimulation process whose declared intervention objective is to alter activity or function at an identified neural… |
| `sstim:NeuromodulationIntervention` | neuromodulation | sstim:Neuromodulation, sstim:StimulationIntervention | A specific, designed execution of a neuromodulation process, with a declared neural access route, delivery approach, and intended neural target.… |
| `sstim:NeuromodulationProtocol` | neuromodulation | sstim:StimulationProtocol | A protocol whose planned objective is to alter activity or function at an identified neural target. It remains an information artifact: a protocol… |
| `sstim:NeuromodulationTechnique` | neuromodulation | sstim:StimulationTechnique | A stimulation technique whose defining intervention objective is to alter activity or function at an identified neural target, with anatomical site… |
| `sstim:Neuroplasticity` | neuromodulation |  | The disposition of a nervous system to undergo lasting structural or functional change in response to activity, experience, or stimulation. It is… |
| `sstim:Neurostimulation` | neuromodulation | sstim:InterventionalNeuromodulation | Interventional neuromodulation delivered by applied stimulation — energy applied to neural tissue (electrical, magnetic/electromagnetic,… |
| `sstim:NeurostimulationTechnique` | neuromodulation | sstim:NeuromodulationTechnique | A neuromodulation technique that delivers applied stimulation — energy applied to neural tissue — rather than a pharmacological agent or the… |
| `sstim:NonEntrainmentTechnique` | technique | sstim:SensoryStimulationTechnique | A Sensory Stimulation technique whose proposed mechanism does not rely on frequency-following responses. Includes stochastic resonance, autonomic… |
| `sstim:ObservationInstrument` | session |  | The identified, versioned questionnaire in a given language that produced a set of observations. Reports are not comparable across instrument… |
| `sstim:ObservationRole` | session |  | A controlled category of what a participant observation observes. |
| `sstim:ParticipantEngagementMode` | technique |  | A controlled information category for the degree and kind of active participation a stimulation or neuromodulation method requires of the individual… |
| `sstim:ParticipantObservation` | session |  | One qualified answer within a self-report: what was observed, what response state applies, the value if one was supplied, and the prompt and scale… |
| `sstim:PerceivedRelatedness` | session |  | A controlled category recording whether the participant perceived an experience as connected to the session. It records a perception and is never… |
| `sstim:PermutationFunction` | patch-studio |  | A named reordering rule applied to a Symmetry voice note sequence at each cycle boundary (identity, rotate forward, rotate backward, reversal,… |
| `sstim:PopulationDescriptor` | evidence |  | An identified description of a study population or participant group referenced by an assessment scope or evidence basis. |
| `sstim:Preset` | configuration |  | A reusable, versioned parameter configuration that makes a particular engine, instrument or design produce an intended sensory stimulation. A preset… |
| `sstim:PresetGroup` | patch-studio |  | A classification of BSC presets by design character, evidence strength, and use context. Five groups: Heal, Support, Perform, Indulge, Transcend. |
| `sstim:PublicClaimLevel` | evidence |  | A named ceiling on what a sensory-stimulation product may assert about itself on a public-facing surface, ordered from descriptive fact to… |
| `sstim:PublicSafeReference` | evidence | sstim:BibliographicReference | A peer-reviewed publication cleared for citation in BSC user-facing content. Must be cleared in the BSC Reference Agent before use in preset… |
| `sstim:ReportedSeverity` | session |  | A controlled category recording how severe a participant said an experience was. |
| `sstim:ReproducibilityLevel` | session |  | A controlled category stating which reproduction claim a session record supports: identical rendered output, equivalent generated signal within… |
| `sstim:ResponseState` | session |  | A controlled category stating why a value is or is not present on an observation. |
| `sstim:ReviewDecisionValue` | evidence |  | The outcome of an evidence review: confirm, request revision, or reject. |
| `sstim:ReviewStatus` | evidence |  | The audit status of an evidence claim's tier assignment (provisional, reviewed, or needs update). |
| `sstim:ReviewerRelationship` | evidence |  | The relationship of a review's agent to the assessed work: self, same organization, external, or unknown. External relationship never implies… |
| `sstim:ScopeMarker` | evidence |  | A controlled marker stating that a scope axis is unknown, not reported, or not applicable. Mutually exclusive with concrete values on the same axis. |
| `sstim:SelfDirectedNeuromodulation` | neuromodulation | sstim:DeliberateSelfRegulation, sstim:Neuromodulation | Neuromodulation produced by the individual's own deliberate self-regulation via an applied stimulus, cue, or feedback delivery — for example… |
| `sstim:SelfReport` | session |  | A consent-governed, session-associated collection event gathering a participant's own account at an explicitly identified phase. Its content is a… |
| `sstim:SelfReportPhase` | session |  | A controlled category identifying when a self-report was collected relative to its associated session, such as before, immediately after, or at… |
| `sstim:SensoryModality` | common |  | A controlled information category identifying a channel of sensory perception through which stimulation is delivered or perceived. Values include… |
| `sstim:SensoryNeurostimulation` | neuromodulation | sstim:Neurostimulation, sstim:SensoryRouteNeuromodulation | The sensory kind of neurostimulation: canonical sensory stimulation delivered without the individual's active self-regulation, with a… |
| `sstim:SensoryNeurostimulationTechnique` | neuromodulation | sstim:NeurostimulationTechnique, sstim:SensoryRouteNeuromodulationTechnique | The technique-layer counterpart of sstim:SensoryNeurostimulation: a sensory-route neuromodulation technique delivered without the individual's… |
| `sstim:SensoryRouteNeuromodulation` | neuromodulation | sstim:Neuromodulation, sstim:SensoryStimulation | A stimulation process that is both sensory stimulation and neuromodulation, and that declares canonical sensory transduction and afferent processing… |
| `sstim:SensoryRouteNeuromodulationIntervention` | neuromodulation | sstim:NeuromodulationIntervention, sstim:SensoryStimulationIntervention | A planned or executed intervention that is both a sensory stimulation intervention and a neuromodulation intervention, declaring canonical sensory… |
| `sstim:SensoryRouteNeuromodulationProtocol` | neuromodulation | sstim:NeuromodulationProtocol, sstim:SensoryStimulationProtocol | A protocol that is both a sensory stimulation protocol and a neuromodulation protocol, declaring canonical sensory transduction and afferent… |
| `sstim:SensoryRouteNeuromodulationTechnique` | neuromodulation | sstim:NeuromodulationTechnique, sstim:SensoryStimulationTechnique | A technique that is both a sensory stimulation technique and a neuromodulation technique, declaring canonical sensory transduction and afferent… |
| `sstim:SensoryStimulation` | core | sstim:Stimulation | A stimulation process whose defining intervention route engages canonical sensory transduction and afferent processing with structured input… |
| `sstim:SensoryStimulationFramework` | technique |  | A broad information artifact defining a family of sensory stimulation principles, techniques, protocols, evidence rules, grouping logic, and design… |
| `sstim:SensoryStimulationImplementation` | technique |  | A concrete realization of a sensory stimulation framework or protocol, represented in SSTIM by the implementation identity and metadata. An… |
| `sstim:SensoryStimulationIntervention` | session | sstim:SensoryStimulation, sstim:StimulationIntervention | A specific, designed execution of Sensory Stimulation with defined parameters, target modalities, intended effect, and delivery mechanism. An… |
| `sstim:SensoryStimulationProtocol` | technique | sstim:StimulationProtocol | A structured method specification for using one or more sensory stimulation techniques toward an intended use, including composition rules, timing,… |
| `sstim:SensoryStimulationTechnique` | technique | sstim:StimulationTechnique | An information-content category for a reusable, parameterizable method of sensory stimulation, characterized by stimulus form, delivery mechanism,… |
| `sstim:SensoryTransductionBypassingAccessRoute` | neuromodulation | sstim:NeuralAccessRoute | A neural access route that reaches its target without canonical sensory receptor transduction, whether by physical neural interaction, biochemical… |
| `sstim:SessionEvent` | session |  | One observed occurrence during the execution of a session, located by its offset on the timing context that delivered the stimulus. An event records… |
| `sstim:SessionEventType` | session |  | A controlled category of occurrence during a session execution. |
| `sstim:SessionInstance` | session | sstim:SensoryStimulationIntervention | The record of an actual execution of a session specification, including timing, completion status, platform, and optional self-report. Append-only:… |
| `sstim:SessionSpecification` | session |  | A complete, reproducible description of a specific intended execution of a preset, including user-defined overrides of preset defaults. The unit of… |
| `sstim:SourceGovernanceRecord` | evidence |  | An immutable record governing a research output used as evidence: source version and digest, custodian, access classification, consent/ethics basis… |
| `sstim:Stimulation` | core |  | A deliberately parameterized process in which structured physical energy, mechanical input, a chemical agent, or another controlled input is applied… |
| `sstim:StimulationDeliveryApproach` | common |  | A coarse, non-exclusive operational category summarizing how an input is introduced or an interface is positioned — for example external,… |
| `sstim:StimulationIntervention` | session | sstim:Stimulation | A specific, designed execution of a stimulation process with defined parameters, delivery, and intended effect. The neutral planned-process layer… |
| `sstim:StimulationMechanism` | common |  | A controlled information category identifying a proposed neurobiological or psychophysiological pathway through which a stimulus may produce a… |
| `sstim:StimulationProtocol` | technique |  | A structured method specification for using one or more stimulation techniques toward an intended use, including composition rules, timing,… |
| `sstim:StimulationTechnique` | technique |  | A reusable information-content category for a parameterizable stimulation method. Classification records the method's declared design intent and… |
| `sstim:StimulusSpecification` | stimulus |  | An engine-independent description of a sensory stimulation, stating what reaches the subject in physical or perceptual units rather than the… |
| `sstim:StimulusTemporalStructure` | common |  | The temporal organization of an applied stimulus or agent. Values cover carrier periodicity (periodic, quasi-periodic, aperiodic), closed-loop… |
| `sstim:StudyDesign` | evidence |  | The design of the underlying studies contributing to an evidence source (for example randomized controlled trial, observational, case report,… |
| `sstim:StudyModel` | evidence |  | The model or stage in which an evidence source's findings were produced (for example human participants, preclinical animal model, in vitro,… |
| `sstim:SymmetryVoice` | patch-studio | sstim:Voice | N notes log-distributed over I octaves, repeated with algebraic group permutation at each cycle boundary, at pulse rate N/d Hz. When I=0, reduces to… |
| `sstim:TimingAuthority` | session |  | A controlled category identifying which timing surface produced a session's event offsets, so a consumer can tell whether they came from audio… |
| `sstim:Track` | configuration |  | A single layer within an engine configuration, carrying the parameters that specify what that layer contributes to the arrangement. A track is… |
| `sstim:UnwantedExperienceCategory` | session |  | A controlled, non-diagnostic category describing an unwanted experience in the participant's own terms. |
| `sstim:UnwantedExperienceObservation` | session |  | One unwanted experience as described by the participant: a controlled category, the severity they reported, when it began, how long it persisted,… |
| `sstim:VisualTrack` | configuration | sstim:Track | A track whose output is visible. Rate-bearing visual tracks are subject to the runtime flash-rate safety limits recorded in the exposure module. |
| `sstim:Voice` | patch-studio | sstim:AudioTrack | An audio layer within a BSC catalog preset, identified by its technique type (Binaural, Martigli, Martigli-Binaural, Symmetry) and carrying the… |
| `sstim:VoiceType` | patch-studio |  | A named category of BSC audio voice (Binaural, Martigli, Martigli-Binaural, Symmetry) identifying the synthesis technique a voice realizes.… |

## Properties

| Term | Kind | Module | Domain → Range | Definition |
|---|---|---|---|---|
| `sstim-eco:addedOn` | data | ecosystem | sstim-eco:EcosystemAgent → XMLSchema:date | The date this ecosystem record was created. |
| `sstim-eco:archivalConsent` | data | ecosystem | sstim-eco:EcosystemAgent → XMLSchema:boolean | True only when the agent has given specific, informed consent that the record may enter a permanent, citable archive and cannot then be fully erased… |
| `sstim-eco:consentStatus` | data | ecosystem | sstim-eco:EcosystemAgent → XMLSchema:string | Listing-tier consent state: implicit-public, notified, consent-requested, consent-granted, consent-declined, removal-requested, or withdrawn (ADR… |
| `sstim-eco:contributionStatus` | data | ecosystem | sstim-eco:EcosystemAgent → XMLSchema:string | The agent's contribution state relative to SSTIM: none, potential, active, or past. |
| `sstim-eco:couldContributeTo` | object | ecosystem | sstim-eco:EcosystemAgent → — | An SSTIM area to which the agent could plausibly contribute. |
| `sstim-eco:curatedBy` | object | ecosystem | sstim-eco:EcosystemAgent → prov:Agent | The agent (typically BSC Lab) responsible for creating and maintaining this ecosystem record. |
| `sstim-eco:engagementFor` | object | ecosystem | sstim-eco:EngagementActivity → sstim-eco:EcosystemRelationship | Identifies the one qualified ecosystem relationship governed by an engagement activity. |
| `sstim-eco:engagementOutcome` | object | ecosystem | sstim-eco:EngagementActivity → sstim-eco:EngagementOutcome | Assigns one controlled minimal outcome to an engagement activity. |
| `sstim-eco:engagementPurpose` | object | ecosystem | sstim-eco:EngagementActivity → sstim-eco:EcosystemPurpose | Identifies the purpose to which a notification, response, decision, amendment, or withdrawal applies. |
| `sstim-eco:expertiseArea` | object | ecosystem | sstim-eco:EcosystemAgent → core:Concept | Links an ecosystem agent to SSTIM controlled concepts (modalities, mechanisms, techniques) it works on. A sourced claim about scope, not an… |
| `sstim-eco:hasContributedTo` | object | ecosystem | sstim-eco:EcosystemAgent → — | An SSTIM area (technique, module, the community group) to which the agent has actually contributed. |
| `sstim-eco:hasEcosystemRelationship` | object | ecosystem | sstim-eco:EcosystemAgent → sstim-eco:EcosystemRelationship | Links an ecosystem agent to one named qualified relationship record. The inverse relationshipAgent identifies the same agent from the record. |
| `sstim-eco:hasEngagementActivity` | object | ecosystem | sstim-eco:EcosystemRelationship → sstim-eco:EngagementActivity | Links a qualified relationship to one engagement lifecycle activity. Public artifacts admit only positive activities ending in final approval; the… |
| `sstim-eco:hasRelationshipType` | object | ecosystem | sstim-eco:EcosystemRelationship → sstim-eco:RelationshipType | Assigns one controlled relationship type to one qualified ecosystem relationship record. |
| `sstim-eco:notificationChannel` | data | ecosystem | sstim-eco:EcosystemAgent → XMLSchema:string | How the notification was sent (e.g. email, public message, institutional contact). |
| `sstim-eco:notificationStatus` | data | ecosystem | sstim-eco:EcosystemAgent → XMLSchema:string | Whether the agent has been notified of inclusion: not-notified, notified, or failed. |
| `sstim-eco:notifiedOn` | data | ecosystem | sstim-eco:EcosystemAgent → XMLSchema:date | The date the agent was notified of inclusion in SSTIM. |
| `sstim-eco:publicationStatus` | object | ecosystem | sstim-eco:EcosystemRelationship → sstim-eco:EngagementOutcome | The current lifecycle status of a qualified ecosystem relationship — one controlled outcome (e.g. notification sent, consent granted, publication… |
| `sstim-eco:recordSource` | data | ecosystem | sstim-eco:EcosystemAgent → — | Provenance of the facts in this record: a public URL (Wikipedia, ORCID, ROR, homepage) or a phrase such as 'personal communication'. Required for… |
| `sstim-eco:relatesTo` | object | ecosystem | sstim-eco:EcosystemAgent → — | Links an ecosystem agent to the specific SSTIM resource it relates to (a technique, the framework, a reference, the community group, the platform),… |
| `sstim-eco:relationshipAgent` | object | ecosystem | sstim-eco:EcosystemRelationship → sstim-eco:EcosystemAgent | Identifies the one ecosystem agent described by a qualified ecosystem relationship. |
| `sstim-eco:relationshipPurpose` | object | ecosystem | sstim-eco:EcosystemRelationship → sstim-eco:EcosystemPurpose | Identifies the one declared purpose for recording a qualified ecosystem relationship. |
| `sstim-eco:relationshipTarget` | object | ecosystem | sstim-eco:EcosystemRelationship → — | Identifies the one resource to which the agent is related in a qualified ecosystem relationship. |
| `sstim-eco:relationshipType` | object | ecosystem | sstim-eco:EcosystemAgent → sstim-eco:RelationshipType | Relates an ecosystem agent to one or more controlled relationship types describing how it engages with the field or with SSTIM. |
| `sstim-eco:respondedOn` | data | ecosystem | sstim-eco:EcosystemAgent → XMLSchema:date | The date the agent responded to notification. |
| `sstim-eco:responseNote` | data | ecosystem | sstim-eco:EcosystemAgent → XMLSchema:string | The substance of the agent's response, recorded verbatim or summarized. |
| `sstim-eco:responseStatus` | data | ecosystem | sstim-eco:EcosystemAgent → XMLSchema:string | The agent's response: no-response, acknowledged, consented, objected, requested-removal, or requested-changes. |
| `sstim-eco:reviewedOn` | data | ecosystem | sstim-eco:EcosystemRelationship → XMLSchema:date | The date on which the qualified relationship, its public sources, and its publication status were last reviewed. |
| `sstim-eco:validFrom` | data | ecosystem | sstim-eco:EcosystemRelationship → XMLSchema:date | The date from which a qualified ecosystem relationship is known to apply, when available. |
| `sstim-eco:validUntil` | data | ecosystem | sstim-eco:EcosystemRelationship → XMLSchema:date | The date through which a qualified ecosystem relationship is known to apply, when it has ended. |
| `sstim-ex:affordsDeliveryMedium` | object | exposure | sstim-ex:DeviceCapability → sstim-ex:PhysicalDeliveryMedium | Links a device capability to the physical delivery medium it produces or affords, making the capability-to-medium pairing explicit rather than… |
| `sstim-ex:appliesBoundary` | object | exposure | — → sstim-ex:ComfortBoundary | sstim-ex:ExposureLimit | The named comfort boundary or exposure limit a boundary-applicability statement applies. Every such statement uses it at least once; the incoming… |
| `sstim-ex:appliesToPlacement` | object | exposure | sstim-ex:ExposureLimit → sstim-ex:BodyPlacement | Links an exposure limit to the body or near-body placement it applies to, since limits differ by site (for example eyes are more vulnerable than… |
| `sstim-ex:channelRole` | object | exposure | sstim-ex:StimulusChannel → sstim-ex:StimulusChannelRole | Links a stimulus channel to the role it plays in the exposure. Deliberate co-stimulation is not concomitant: two or more causal channels may each be… |
| `sstim-ex:characteristicDeliveryMedium` | object | exposure | sstim:StimulationTechnique → sstim-ex:PhysicalDeliveryMedium | Links a stimulation technique to a physical energy, material, or chemical agent characteristic of the method. It does not describe an executed dose… |
| `sstim-ex:concernsEffectDimension` | object | exposure | — → sstim-ex:EffectDimension | Links a hypothesis, research question, design objective, or planned-outcome specification to the comfort, risk, perception, or physiological… |
| `sstim-ex:conformsToStandard` | object | exposure | sstim-ex:ExposureLimit → Standard | Links an exposure limit to the external standard, guideline, or recommendation it is derived from. |
| `sstim-ex:deliveryMedium` | object | exposure | sstim-ex:StimulusChannel → sstim-ex:PhysicalDeliveryMedium | Links a stimulus channel to the physical medium, energy, material, or interface used for delivery. |
| `sstim-ex:hasBeatFrequencyHz` | data | exposure | sstim-ex:StimulusChannel → XMLSchema:decimal | Monaural or binaural beat frequency (the difference frequency) of an audio stimulus channel, in hertz. |
| `sstim-ex:hasBodyPlacement` | object | exposure | sstim-ex:ExposureProfile | sstim-ex:StimulusChannel | sstim-ex:DeviceCapability → sstim-ex:BodyPlacement | Links an exposure profile, stimulus channel, or capability to a body or near-body placement. |
| `sstim-ex:hasBoundaryApplicability` | object | exposure | — → sstim-ex:BoundaryApplicabilityStatement | Links an exposure profile or stimulus channel to a qualified boundary-applicability statement. Direct hasComfortBoundary / hasExposureLimit links… |
| `sstim-ex:hasComfortBoundary` | object | exposure | sstim-ex:ExposureProfile | sstim-ex:StimulusChannel → sstim-ex:ComfortBoundary | Links an exposure profile or stimulus channel to a comfort, discomfort, fatigue, awareness, or risk boundary. |
| `sstim-ex:hasDesignObjective` | object | exposure | — → sstim-ex:ExposureDesignObjective | Links an exposure profile or protocol to a desired delivery capability or experience objective. |
| `sstim-ex:hasDutyCycle` | data | exposure | sstim-ex:StimulusChannel → XMLSchema:decimal | On-fraction of each blink or pulse cycle for a stimulus channel, between 0 and 1. |
| `sstim-ex:hasEffectClaim` | object | exposure | — → sstim-ex:ExposureEffectClaim | Deprecated ADR 0027: the single link mixed hypotheses, questions, boundary applicability, requirements, design objectives, and planned outcomes. Use… |
| `sstim-ex:hasExperimentContext` | object | exposure | sstim:StimulationProtocol | sstim-ex:ExposureProfile → sstim-ex:ExperimentContext | Links an exploratory protocol or exposure profile to the context in which it is proposed or used. |
| `sstim-ex:hasExposureLimit` | object | exposure | sstim-ex:ComfortBoundary | sstim-ex:DeviceCapability → sstim-ex:ExposureLimit | Links a comfort boundary or device capability to a quantified exposure limit against which a delivery is checked. |
| `sstim-ex:hasExposureProfile` | object | exposure | sstim:StimulationProtocol | sstim:StimulationTechnique | sstim:Stimulation | sstim:Preset → sstim-ex:ExposureProfile | Links a protocol, technique, represented stimulation process or intervention, preset, or experiment instance to a structured exposure profile. |
| `sstim-ex:hasFlickerRateHz` | data | exposure | sstim-ex:StimulusChannel → XMLSchema:decimal | Blink, pulse, or flicker rate of a stimulus channel, in hertz. Visual flicker rate is subject to photosensitivity exposure limits. |
| `sstim-ex:hasFrequencyHz` | data | exposure | sstim-ex:StimulusChannel → XMLSchema:decimal | Carrier or tone frequency of a stimulus channel, in hertz. |
| `sstim-ex:hasGainLevel` | data | exposure | sstim-ex:StimulusChannel → XMLSchema:decimal | Relative output amplitude of a stimulus channel, between 0 and 1. This is a relative level, not a calibrated physical intensity. |
| `sstim-ex:hasHypothesis` | object | exposure | — → sstim-ex:ExposureHypothesis | Links an exposure profile or protocol to a stated hypothesis. Optional: a delivery-only profile states none, and generators must never fabricate one. |
| `sstim-ex:hasKnowledgeStatus` | object | exposure | — → sstim-ex:KnowledgeStatus | Links a protocol, exposure profile, channel, device capability, statement role, or knowledge-status assertion to a controlled SSTIM/BSC Lab… |
| `sstim-ex:hasKnowledgeStatusAssertion` | object | exposure | — → sstim-ex:KnowledgeStatusAssertion | Links a preset, technique, protocol, exposure profile, or stimulus channel to a scoped, dated knowledge-status assertion about it. Each assertion… |
| `sstim-ex:hasPerceptualGain` | object | exposure | sstim-ex:ExposureProfile | sstim:StimulationProtocol → sstim-ex:PerceptualGain | Links an exposure profile or protocol to a perceived gain created by the setup. |
| `sstim-ex:hasPerceptualLoss` | object | exposure | sstim-ex:ExposureProfile | sstim:StimulationProtocol → sstim-ex:PerceptualLoss | Links an exposure profile or protocol to a perceived loss, cost, or limitation created by the setup. |
| `sstim-ex:hasPhaseOffset` | data | exposure | sstim-ex:StimulusChannel → XMLSchema:decimal | Phase offset of a stimulus channel's modulation relative to other channels, as a fraction of a cycle between 0 and 1. |
| `sstim-ex:hasPlannedOutcome` | object | exposure | — → sstim-ex:PlannedOutcomeSpecification | Links an exposure profile or protocol to a planned outcome-collection specification. |
| `sstim-ex:hasProtocolRequirement` | object | exposure | — → sstim-ex:ProtocolRequirement | Links an exposure profile, stimulus channel, or protocol to a requirement that constrains it. |
| `sstim-ex:hasResearchQuestion` | object | exposure | — → sstim-ex:ResearchQuestion | Links an exposure profile or protocol to an open research question. |
| `sstim-ex:hasStimulusPattern` | object | exposure | sstim-ex:StimulusChannel → sstim-ex:StimulusPattern | Links a stimulus channel to a temporal, spatial, color, noise, or texture pattern. |
| `sstim-ex:knowledgeAsOfDate` | data | exposure | — → XMLSchema:date | The date as of which a knowledge-status assertion holds for its named corpus. |
| `sstim-ex:knowledgeScope` | object | exposure | — → — | The identified corpus or repository a knowledge-status assertion is scoped to. |
| `sstim-ex:knowledgeScopeNote` | data | exposure | — → 22-rdf-syntax-ns:langString | A language-tagged description of the corpus or scope of a knowledge-status assertion, used when no scope IRI exists. |
| `sstim-ex:limitAveragingTime` | data | exposure | sstim-ex:ExposureLimit → XMLSchema:duration | Averaging or reference time over which an exposure limit is defined (for example an 8-hour dose), as an xsd:duration. |
| `sstim-ex:limitMaxFrequencyHz` | data | exposure | sstim-ex:ExposureLimit → XMLSchema:decimal | Maximum frequency permitted by a cited exposure or accessibility rule, in hertz; compliance with the value is not an individual safety guarantee. |
| `sstim-ex:limitQuantity` | data | exposure | sstim-ex:ExposureLimit → XMLSchema:string | Physical quantity an exposure limit constrains (for example "flash frequency", "sound pressure level", or "effective irradiance"). |
| `sstim-ex:limitUnit` | data | exposure | sstim-ex:ExposureLimit → XMLSchema:string | Unit of an exposure limit value (for example "dBA" or "J/m2"). A QUDT unit IRI may be linked separately where precision is required. |
| `sstim-ex:limitValue` | data | exposure | sstim-ex:ExposureLimit → XMLSchema:decimal | Numeric value of an exposure limit, interpreted together with limitUnit and limitQuantity. |
| `sstim-ex:perceivedModality` | object | exposure | sstim-ex:StimulusChannel → sstim-ex:PerceivedModality | Links a stimulus channel to the sensory, perceptual, behavioral, interoceptive, or social-perceptual modality it engages. |
| `sstim-ex:pitchShiftCents` | data | exposure | sstim-ex:StimulusChannel → XMLSchema:decimal | Resulting pitch shift in cents relative to the standard reference (e.g. about -31.77 cents for A4=432 versus A4=440). |
| `sstim-ex:referencePitchHz` | data | exposure | sstim-ex:StimulusChannel → XMLSchema:decimal | Frequency in hertz assigned to the reference note (e.g. 432 or 440 for A4). This is a carrier/absolute-pitch attribute, not a modulation or beat… |
| `sstim-ex:referencePitchNote` | data | exposure | sstim-ex:StimulusChannel → XMLSchema:string | Named reference note whose pitch a tuning sets, commonly "A4". |
| `sstim-ex:requiresDeviceCapability` | object | exposure | sstim-ex:ExposureProfile | sstim-ex:StimulusChannel | sstim:StimulationProtocol → sstim-ex:DeviceCapability | Links an exposure profile, stimulus channel, or protocol to a hardware or environmental capability required for delivery. |
| `sstim-ex:retunedFromReferenceHz` | data | exposure | sstim-ex:StimulusChannel → XMLSchema:decimal | Standard reference frequency the tuning departs from, typically 440 Hz for A4. |
| `sstim-ex:usesStimulusChannel` | object | exposure | sstim-ex:ExposureProfile → sstim-ex:StimulusChannel | Links an exposure profile to a channel through which part of the exposure is delivered or modeled. |
| `sstim:accessClassification` | data | evidence | — → XMLSchema:string | The access classification of a governed research output (for example private, shared-research, de-identified, public). |
| `sstim:actualDurationSeconds` | data | session | sstim:SessionInstance → XMLSchema:integer | Observed playback duration of a recorded session instance in whole seconds. |
| `sstim:affectedPopulation` | data | common | sstim:CautionTag → XMLSchema:string | Conservative plain-language description of the users or contexts to which a caution is especially relevant; not a diagnostic classification. |
| `sstim:assessesProposition` | object | evidence | — → sstim:AssessmentProposition | Links an evidence assessment to the single atomic bounded proposition it evaluates. |
| `sstim:baseFrequency` | data | patch-studio | sstim:Voice | sstim:AudioTrack → XMLSchema:decimal | Base, carrier, or center frequency for a voice, in Hz. |
| `sstim:basisComparator` | object | evidence | — → sstim:ComparatorDescriptor | A comparator the basis source used, as source-level metadata. |
| `sstim:basisComparatorNote` | data | evidence | — → 22-rdf-syntax-ns:langString | Supplementary human-readable note on a basis source's comparator. Never a substitute for the identified comparator descriptor. |
| `sstim:basisIntervention` | object | evidence | — → — | The studied technique, protocol, intervention, or exposure profile this basis source is about (for example paced breathing rather than an auditory… |
| `sstim:basisModalityApplicability` | object | evidence | — → sstim:ModalityApplicability | How sensory modality applies to this basis source: mixed, unknown/not reported, or not applicable. |
| `sstim:basisObservedEffectDirection` | object | evidence | — → sstim:EffectDirection | The direction of an outcome the basis source reports, as source-level metadata. |
| `sstim:basisObservedOutcome` | object | evidence | — → sstim:EvidenceOutcomeConcept | An outcome concept the basis source reports on, as source-level metadata distinct from the assessment proposition. |
| `sstim:basisOutcomeNote` | data | evidence | — → 22-rdf-syntax-ns:langString | Supplementary human-readable note on a basis source's reported outcome. Never a substitute for the identified outcome concept. |
| `sstim:basisPopulationNote` | data | evidence | — → 22-rdf-syntax-ns:langString | Supplementary human-readable note on a basis source's population. Never a substitute for the identified population descriptor. |
| `sstim:basisSensoryModality` | object | evidence | — → sstim:SensoryModality | A canonical sensory modality the basis source explicitly supports. Zero modalities requires an explicit modality-applicability value. |
| `sstim:basisSource` | object | evidence | — → sstim:BibliographicReference | sstim:GovernedResearchOutput | sstim:EvidenceSearchRecord | The single source of a qualified evidence basis: a bibliographic reference, a governed research output, or an evidence search record. |
| `sstim:basisStudyDesign` | object | evidence | — → sstim:StudyDesign | The design of the underlying studies contributing to this basis source. |
| `sstim:basisStudyModel` | object | evidence | — → sstim:StudyModel | The model or stage of this basis source's findings (human, preclinical animal, in vitro, computational). |
| `sstim:basisStudyPopulation` | object | evidence | — → sstim:PopulationDescriptor | The identified population studied by this basis source. |
| `sstim:basisSynthesisType` | object | evidence | — → sstim:EvidenceSynthesisType | The synthesis level of this basis source (primary study, narrative review, systematic review, meta-analysis, literature review, tutorial). |
| `sstim:beatHz` | data | patch-studio | sstim:Voice | sstim:AudioTrack → XMLSchema:decimal | Driven or perceived beat frequency in Hz. |
| `sstim:beatsPerBar` | data | patch-studio | sstim:SessionSpecification | sstim:Preset → XMLSchema:integer | Number of beats in one authoring tempo bar. |
| `sstim:breathingAmplitude` | data | patch-studio | sstim:Voice | sstim:ControlTrack → XMLSchema:decimal | Depth or excursion of a breathing-shaped control signal. |
| `sstim:breathingPeriodFinal` | data | session | sstim:SessionSpecification → XMLSchema:decimal | Optional user override for the final guided-breathing cycle period in seconds; absence means use the preset default. |
| `sstim:breathingPeriodInitial` | data | session | sstim:SessionSpecification → XMLSchema:decimal | User override for mp0. Must be >= 3.0 s for breathing guidance. Absent means use preset default. |
| `sstim:breathingPhaseRatio` | data | patch-studio | sstim:Voice | sstim:ControlTrack → XMLSchema:decimal | Fraction of a breathing cycle assigned to the inhale phase. |
| `sstim:breathingTransitionDuration` | data | session | sstim:SessionSpecification → XMLSchema:decimal | Optional duration in seconds over which guided breathing changes from its initial to final cycle period; absence means use the preset default. |
| `sstim:carrierFreqLeft` | data | patch-studio | sstim:Voice | sstim:AudioTrack → XMLSchema:decimal | Left-ear carrier frequency for binaural presentation, in Hz. |
| `sstim:carrierFreqRight` | data | patch-studio | sstim:Voice | sstim:AudioTrack → XMLSchema:decimal | Right-ear carrier frequency for binaural presentation, in Hz. |
| `sstim:cautionSeverityRank` | data | common | sstim:CautionSeverity → XMLSchema:integer | Ordinal rank used to sort caution severities from informational (1) through high-priority stop or avoid guidance (4). |
| `sstim:channelDurationSeconds` | data | stimulus | sstim-ex:StimulusChannel → XMLSchema:decimal | Duration for which a channel presents its stimulus, in seconds. |
| `sstim:channelFrequencyHz` | data | common | sstim-ex:StimulusChannel → XMLSchema:decimal | Rate at which a channel presents its stimulus, in hertz, as delivered rather than as configured. |
| `sstim:citesReference` | object | evidence | — → sstim:BibliographicReference | Links an evidence assessment to a bibliographic reference. For every bibliographic basis source the assessment carries a matching citesReference… |
| `sstim:claimLevelRank` | data | evidence | sstim:PublicClaimLevel → XMLSchema:integer | Ordinal rank 0–5 of a public claim level. C0 Descriptive=0, C1 Experiential=1, C2 Wellness=2, C3 Structure/Function=3, C4 Medical/Condition=4, C5… |
| `sstim:clockOriginSeconds` | data | session | sstim:SessionInstance → XMLSchema:decimal | The timing context's own reading at the moment the session instance opened. Together with each event offset it reconstructs the exact timing-context… |
| `sstim:comparator` | data | evidence | — → XMLSchema:string | Deprecated ADR 0027: use the identified sstim:basisComparator descriptor plus sstim:basisComparatorNote on the qualified basis. Appears only in the… |
| `sstim:completionStatus` | data | session | sstim:SessionInstance → XMLSchema:string | Values: 'completed' \| 'interrupted' (>30% played) \| 'abandoned' (<30% played). |
| `sstim:composedOf` | object | patch-studio | sstim:Preset → sstim:Voice | Links a preset to its 1–6 voice specifications. |
| `sstim:composedOfTrack` | object | configuration | sstim:Preset → sstim:Track | Links an engine configuration to the layers it is composed of. Distinct from sstim:composedOf, which links a BSC catalog preset to its voices: a… |
| `sstim:configurationDigest` | data | session | sstim:SessionSpecification → XMLSchema:string | Lowercase hexadecimal digest of the exact configuration this specification executed. Naming a configuration establishes which one was intended; the… |
| `sstim:conflictDisclosure` | object | evidence | — → sstim:ConflictDisclosure | A conflict-of-interest disclosure record attached to an independence determination, including the explicit no-conflict-declared record. |
| `sstim:consentBasisNote` | data | evidence | — → 22-rdf-syntax-ns:langString | The applicable consent or ethics basis for a governed research output, or an explicit not-applicable determination. |
| `sstim:custodian` | object | evidence | — → prov:Agent | The agent that owns or is custodian of a governed research output. |
| `sstim:cycleDuration` | data | patch-studio | sstim:Voice → XMLSchema:decimal | Duration of one repeated control or sequence cycle, in seconds. |
| `sstim:definedByFramework` | object | technique | OBI_0000272 → sstim:SensoryStimulationFramework | Links a protocol to the broader framework that defines or constrains it. The domain is the general OBI protocol class, not a stimulation protocol: a… |
| `sstim:definesTechnique` | object | technique | sstim:SensoryStimulationFramework → sstim:SensoryStimulationTechnique | Links a sensory stimulation framework to a technique that it defines or governs. |
| `sstim:deliveredDurationSeconds` | data | session | sstim:SessionInstance → XMLSchema:decimal | Time during which the session was actually delivering stimulus, excluding paused intervals. Distinct from the elapsed duration: a session paused for… |
| `sstim:derivedFrom` | object | configuration | sstim:Preset → sstim:Preset | Links a preset to its immediate predecessor preset version. The relation is directional, asymmetric, and not transitive; use repeated links to… |
| `sstim:describesStimulation` | object | stimulus | sstim:StimulusSpecification → sstim:Stimulation | Links a specification, which is an information artifact, to the stimulation process it describes. |
| `sstim:digestAlgorithm` | data | session | sstim:SessionSpecification → XMLSchema:string | Identifier of the algorithm and canonicalisation that produced the configuration digest, without which the digest cannot be recomputed. |
| `sstim:disablesTrack` | object | session | sstim:SessionSpecification → sstim:Track | A layer of the configuration that this session turns off — a soundscape left out, an ambience muted. Listing what was disabled keeps the… |
| `sstim:displayPriority` | data | common | sstim:CautionTag → XMLSchema:integer | Positive integer used to order caution messages within the same severity; lower numbers display first. |
| `sstim:durationSeconds` | data | configuration | — → XMLSchema:integer | Intended total duration in seconds, either of a session specification or as the default carried by a preset. |
| `sstim:evaluatesSubject` | object | evidence | — → sstim:Preset | sstim:StimulationTechnique | Links an evidence assessment to the preset or technique it evaluates. Neutral: the assessment's direction lives exclusively in hasClaimDirection.… |
| `sstim:evidenceDate` | data | evidence | — → XMLSchema:date | Deprecated ADR 0027: source publication dates stay as dct:issued on the bibliographic reference; assessment and review dates come from their… |
| `sstim:evidenceNotes` | annotation | evidence | — → — | Internal human-readable note on evidence basis and caveats. Not for user-facing display. |
| `sstim:evidenceOutcome` | data | evidence | — → XMLSchema:string | Deprecated ADR 0027: use the identified sstim:basisObservedOutcome concept plus sstim:basisOutcomeNote on the qualified basis. Appears only in the… |
| `sstim:experienceDurationSeconds` | data | session | sstim:UnwantedExperienceObservation → XMLSchema:decimal | How long the experience lasted, where the participant gave a duration. |
| `sstim:extendedHzMax` | data | common | sstim:NeuralOscillationType → XMLSchema:decimal | Highest frequency at which this rhythm is reported to occur, which may exceed its conventional ambit. |
| `sstim:extendedHzMin` | data | common | sstim:NeuralOscillationType → XMLSchema:decimal | Lowest frequency at which this rhythm is reported to occur, which may fall below its conventional ambit. A rhythm modulates and its edges are… |
| `sstim:flashRateHz` | data | common | sstim-ex:StimulusChannel → XMLSchema:decimal | Rate of luminance alternation presented to the subject, in hertz. Safety-bearing: rates in the photosensitive range are constrained at runtime… |
| `sstim:focusRating` | data | session | sstim:SelfReport → XMLSchema:integer | Attentional-focus rating at the report's declared collection phase, from 1 (scattered) to 5 (highly focused). |
| `sstim:followsProtocol` | object | configuration | sstim:Preset → sstim:SensoryStimulationProtocol | Links a preset to the sensory stimulation protocol whose rules or constraints it follows. |
| `sstim:forImplementation` | object | configuration | sstim:Preset → sstim:SensoryStimulationImplementation | Links a preset to the implementation whose parameter model it configures. |
| `sstim:goalAchieved` | data | session | sstim:SelfReport → XMLSchema:boolean | Self-reported yes/no assessment of whether the participant's stated session goal was met; it is not an objective efficacy measure. |
| `sstim:governedSourceDigest` | data | evidence | — → XMLSchema:string | A content digest of the governed research output version. |
| `sstim:governedSourceVersion` | data | evidence | — → XMLSchema:string | The exact version of the governed research output this governance record covers. |
| `sstim:hapticPattern` | data | patch-studio | sstim:SessionSpecification | sstim:HapticTrack → XMLSchema:integer | Pattern index or selector for haptic delivery. |
| `sstim:hasAssessmentScope` | object | evidence | — → sstim:AssessmentScope | The single explicit scope of an assessment proposition. |
| `sstim:hasBreathGuide` | data | patch-studio | sstim:Preset → XMLSchema:boolean | True iff the preset contains exactly one voice with isOn=true. Governs visual breathing animation and haptic pulse delivery. |
| `sstim:hasCautionSeverity` | object | common | sstim:CautionTag → sstim:CautionSeverity | Assigns exactly one interface-priority severity category to a caution tag. |
| `sstim:hasCautionTag` | object | configuration | sstim:Preset → sstim:CautionTag | Links a preset to a safety or usage advisory flag. A preset may carry zero or more caution tags. |
| `sstim:hasClaimDirection` | object | evidence | sstim:EvidenceClaim → sstim:ClaimDirection | Whether the cited evidence supports, is mixed on, is inconclusive about, or refutes the asserted relation. |
| `sstim:hasCorticalTopography` | data | common | sstim:NeuralOscillationType → XMLSchema:string | Scalp or cortical region over which this rhythm is characteristically recorded. Topography is part of how a rhythm is identified alongside… |
| `sstim:hasDeliveryModality` | object | session | sstim:SensoryStimulationIntervention → sstim:SensoryModality | Links an executed sensory stimulation intervention to one or more broad controlled modality categories engaged by its delivery. Use the exposure… |
| `sstim:hasEffectDirection` | object | evidence | — → sstim:EffectDirection | Deprecated ADR 0027: observed effect direction is source-level metadata; use sstim:basisObservedEffectDirection on the qualified evidence basis.… |
| `sstim:hasEventType` | object | session | sstim:SessionEvent → sstim:SessionEventType | Identifies the single controlled category of an observed session event. |
| `sstim:hasEvidenceBasis` | object | evidence | — → sstim:EvidenceBasis | Links an evidence assessment to a qualified basis. Every assessment has at least one. |
| `sstim:hasEvidenceTier` | object | evidence | sstim:EvidenceClaim → sstim:EvidenceTierValue | Links an evidence claim to its strength classification tier, accounting for study quality and modality matching. |
| `sstim:hasExperienceCategory` | object | session | sstim:UnwantedExperienceObservation → sstim:UnwantedExperienceCategory | Identifies the single controlled category describing this experience. |
| `sstim:hasIndependenceDetermination` | object | evidence | — → sstim:IndependenceDetermination | The policy-based independence determination of a review decision. External relationship never implies independence. |
| `sstim:hasInstrument` | object | session | sstim:SelfReport → sstim:ObservationInstrument | Identifies the single versioned instrument that produced this report's observations. |
| `sstim:hasIntendedEffect` | object | configuration | sstim:Preset → sstim:IntendedEffect | Links a preset to one or more controlled design-intent categories. The relation describes purpose and does not assert that the effect occurred. |
| `sstim:hasModalityTag` | object | evidence | — → sstim:EvidenceModalityTag | Deprecated ADR 0027: the tag mixed sensory modality with study model and synthesis type. Authoritative data uses the orthogonal basis axes… |
| `sstim:hasObservation` | object | session | sstim:SelfReport → sstim:ParticipantObservation | Links a self-report to the qualified observations collected in it. |
| `sstim:hasObservationRole` | object | session | sstim:ParticipantObservation → sstim:ObservationRole | Identifies the single thing this observation observes. |
| `sstim:hasOnsetPhase` | object | session | sstim:UnwantedExperienceObservation → sstim:ExperienceOnsetPhase | Locates when this experience began relative to the session. |
| `sstim:hasOscillationStateContext` | data | common | sstim:NeuralOscillationType → XMLSchema:string | Behavioural or physiological state in which this rhythm is characteristically observed, such as eyes closed or slow-wave sleep. |
| `sstim:hasPerceivedRelatedness` | object | session | sstim:UnwantedExperienceObservation → sstim:PerceivedRelatedness | Records whether the participant perceived this experience as connected to the session. |
| `sstim:hasPersistence` | object | session | sstim:UnwantedExperienceObservation → sstim:ExperiencePersistence | Records how long the experience persisted, as a controlled category. |
| `sstim:hasPropositionForm` | object | evidence | — → sstim:EvidencePropositionForm | The single controlled logical form of an assessment proposition. |
| `sstim:hasPublicClaimLevel` | object | evidence | sstim:Preset → sstim:PublicClaimLevel | Links a preset to the highest public-facing claim level its user-facing copy uses. The legality constraint (PresetShape, ADR 0018) checks that… |
| `sstim:hasReportPhase` | object | session | sstim:SelfReport → sstim:SelfReportPhase | Identifies the single collection phase of a session-associated self-report. |
| `sstim:hasReportedSeverity` | object | session | sstim:UnwantedExperienceObservation → sstim:ReportedSeverity | Records how severe the participant said this experience was. |
| `sstim:hasReproducibilityLevel` | object | session | sstim:SessionSpecification → sstim:ReproducibilityLevel | States which reproduction claim this specification supports. Required to be stated rather than assumed: this class's own definition promises fully… |
| `sstim:hasResolutionState` | object | session | sstim:UnwantedExperienceObservation → sstim:ExperienceResolution | Records the state the experience reached. |
| `sstim:hasResponseAction` | object | session | sstim:UnwantedExperienceObservation → sstim:ExperienceResponseAction | Records what the participant did in response. |
| `sstim:hasResponseState` | object | session | sstim:ParticipantObservation → sstim:ResponseState | States why this observation does or does not carry a value. Required on every observation: an observation whose absence of value is unexplained… |
| `sstim:hasReviewDecision` | object | evidence | — → sstim:ReviewDecisionValue | The outcome of a review decision: confirm, request revision, or reject. |
| `sstim:hasReviewStatus` | object | evidence | — → sstim:ReviewStatus | Deprecated ADR 0027: review state is derived from immutable EvidenceReviewDecision records, not stored as a mutable status. A non-authoritative 0.7… |
| `sstim:hasReviewerRelationship` | object | evidence | — → sstim:ReviewerRelationship | The reviewer's relationship to the assessed work: self, same organization, external, or unknown. |
| `sstim:hasSelfReport` | object | session | sstim:SessionInstance → sstim:SelfReport | Links a session instance to zero or more consent-governed self-reports collected at explicit phases. Multiple reports support pre/post and follow-up… |
| `sstim:hasSessionEvent` | object | session | sstim:SessionInstance → sstim:SessionEvent | Links a recorded execution to the occurrences observed during it. Order is carried by each event's offset rather than by the order of these… |
| `sstim:hasSourceGovernanceRecord` | object | evidence | — → sstim:SourceGovernanceRecord | Links a governed research output to its single immutable source-governance record. |
| `sstim:hasStimulationTarget` | object | stimulus | — → BFO_0000040 | BFO_0000029 | What the stimulation is directed at: a person, a non-human animal, a plant, an object or material, or a place. Absence is meaningful and permitted —… |
| `sstim:hasStimulusChannel` | object | stimulus | sstim:StimulusSpecification → sstim-ex:StimulusChannel | Links a specification to a channel through which stimulation reaches the subject. |
| `sstim:hasStimulusTemporalStructure` | object | technique | sstim:StimulationTechnique → sstim:StimulusTemporalStructure | Links a stimulation technique to one or more controlled descriptions of its temporal organization, such as periodic, quasi-periodic, aperiodic,… |
| `sstim:hasTimingAuthority` | object | session | sstim:SessionInstance → sstim:TimingAuthority | Identifies the single timing surface whose readings produced this execution's clock origin and event offsets. |
| `sstim:hasTypicalFrequencyBand` | object | common | sstim:NeuralOscillationType → sstim:FrequencyBand | Links a named neural oscillation to the conventional Hz ambit by which it is usually delimited. The ambit is a measurement convention rather than a… |
| `sstim:hzMax` | data | common | sstim:FrequencyBand → XMLSchema:decimal | Upper bound (inclusive) of the frequency band in Hz. |
| `sstim:hzMin` | data | common | sstim:FrequencyBand → XMLSchema:decimal | Lower bound (inclusive) of the frequency band in Hz. |
| `sstim:implementsFramework` | object | technique | sstim:SensoryStimulationImplementation → sstim:SensoryStimulationFramework | Links an implementation to the framework it realizes. |
| `sstim:implementsProtocol` | object | technique | sstim:SensoryStimulationImplementation → sstim:SensoryStimulationProtocol | Links an implementation to a protocol it realizes. |
| `sstim:inGroup` | object | patch-studio | sstim:Preset → sstim:PresetGroup | Links a preset to its group classification. Each preset belongs to exactly one group. |
| `sstim:incorporatesTechnique` | object | technique | sstim:SensoryStimulationFramework → sstim:SensoryStimulationTechnique | Links a sensory stimulation framework to a pre-existing, vendor-neutral technique that it uses but did not originate. Distinct from… |
| `sstim:independencePolicy` | object | evidence | — → — | The named policy whose criteria an independence determination applied. Required for independent and not-independent determinations. |
| `sstim:initialVolume` | data | patch-studio | sstim:Voice | sstim:AudioTrack → XMLSchema:decimal | Initial output gain or amplitude for a voice. |
| `sstim:instrumentVersion` | data | session | sstim:ObservationInstrument → XMLSchema:string | Version of the instrument as administered. Answers collected under different versions are not directly comparable. |
| `sstim:intendedNeuralPhenomenon` | object | neuromodulation | — → sstim:NeuralPhenomenon | Links a stimulation process, technique, protocol, or intervention to the functional neural phenomenon it is intended to affect. Records target… |
| `sstim:intendedNeuralSystem` | object | neuromodulation | — → sstim:NeuralSystem | Links a stimulation process, technique, protocol, or intervention to the distributed neural system it is intended to engage. Independent of the… |
| `sstim:intendedNeuralTargetSite` | object | neuromodulation | — → sstim:NeuralTargetSite | Links a stimulation process, technique, protocol, or intervention to the broad nervous-system site it is intended to engage. Records target… |
| `sstim:isBreathReference` | data | patch-studio | sstim:Voice → XMLSchema:boolean | True iff this voice is the breathing reference (isOn): its oscillation drives the visual breathing animation and haptic pulse. At most one voice per… |
| `sstim:luminanceCdM2` | data | common | sstim-ex:StimulusChannel → XMLSchema:decimal | Luminance presented to the subject, in candelas per square metre. |
| `sstim:martigliAmplitude` | data | patch-studio | sstim:Voice | sstim:ControlTrack → XMLSchema:decimal | Frequency-sweep amplitude (ma) of a Martigli oscillation, in Hz; the carrier(s) sweep ± ma around the center. |
| `sstim:martigliCenterFreq` | data | patch-studio | sstim:Voice → XMLSchema:decimal | Center frequency (mf0) of a Martigli voice's oscillating tone, in Hz; the frequency sweeps mf0 ± ma. Martigli voices only — Martigli-Binaural uses… |
| `sstim:martigliPeriodFinal` | data | patch-studio | sstim:Voice | sstim:ControlTrack → XMLSchema:decimal | Final breathing-cycle duration (mp1) of a Martigli oscillation after the transition, in seconds. |
| `sstim:martigliPeriodInitial` | data | patch-studio | sstim:Voice | sstim:ControlTrack → XMLSchema:decimal | Initial breathing-cycle duration (mp0) of a Martigli oscillation, in seconds. Must be >= 3 s when the voice is the breathing reference (isOn). |
| `sstim:martigliTransitionDuration` | data | patch-studio | sstim:Voice → XMLSchema:decimal | Time (md) over which the breathing cycle interpolates linearly from mp0 to mp1, in seconds; mp1 is held afterwards. |
| `sstim:masterBrightness` | data | configuration | — → XMLSchema:decimal | Normalized master visual output level, from 0 (dark) to 1 (implementation maximum); an engine control, not a calibrated luminance. The visual… |
| `sstim:masterVolume` | data | configuration | — → XMLSchema:decimal | Normalized master output gain, from 0 (silent) to 1 (implementation maximum); an engine control, not a calibrated sound-pressure level. The… |
| `sstim:mechanismNeuralAccessRoute` | object | neuromodulation | sstim:StimulationMechanism → sstim:NeuralAccessRoute | Tags a proposed mechanism with the neural access route it invokes. Hypothesis metadata: it never reclassifies the technique that proposes the… |
| `sstim:mechanismNeuralPhenomenon` | object | neuromodulation | sstim:StimulationMechanism → sstim:NeuralPhenomenon | Tags a proposed mechanism with the functional neural phenomenon it invokes. Hypothesis metadata. |
| `sstim:mechanismNeuralSystem` | object | neuromodulation | sstim:StimulationMechanism → sstim:NeuralSystem | Tags a proposed mechanism with the distributed neural system it invokes. Hypothesis metadata. |
| `sstim:mechanismNeuralTargetSite` | object | neuromodulation | sstim:StimulationMechanism → sstim:NeuralTargetSite | Tags a proposed mechanism with the neural site it invokes. Hypothesis metadata, distinct from a technique's intended target and from an evaluated… |
| `sstim:modifiedAt` | annotation | common | — → XMLSchema:dateTime | Timestamp attached to a mutable annotation record when it was last edited. Ontology and evidence resources should use dct:modified and PROV-O for… |
| `sstim:modifiedBy` | annotation | common | — → — | Identifier attached to a mutable annotation record for the actor that last edited it. Published RDF should use prov:wasAttributedTo for agent… |
| `sstim:neuralAccessRoute` | object | neuromodulation | — → sstim:NeuralAccessRoute | Links a stimulation process, technique, protocol, intervention, or stimulus channel to the biological route through which its neural target is… |
| `sstim:noteCount` | data | patch-studio | sstim:Voice | sstim:ControlTrack → XMLSchema:integer | Number of notes or sequence positions in a Symmetry cycle. |
| `sstim:noteDurationFraction` | data | patch-studio | sstim:Voice | sstim:AudioTrack → XMLSchema:decimal | Fraction of a rhythmic pulse occupied by the active note envelope. |
| `sstim:observedBooleanValue` | data | session | sstim:ParticipantObservation → XMLSchema:boolean | The value the participant supplied to a yes/no item. |
| `sstim:observedOrdinalValue` | data | session | sstim:ParticipantObservation → XMLSchema:integer | The value the participant supplied on an ordinal scale. Interpretable only together with the scale bounds and anchor labels recorded beside it. |
| `sstim:observedTextValue` | data | session | sstim:ParticipantObservation → XMLSchema:string | Free text the participant supplied, such as a stated goal in their own words. |
| `sstim:octaveSpan` | data | patch-studio | sstim:Voice → XMLSchema:decimal | Pitch span covered by a Symmetry sequence. |
| `sstim:onsetOffsetSeconds` | data | session | sstim:UnwantedExperienceObservation → XMLSchema:decimal | Where on the session's timing context the experience began, when it began during the session and the participant could place it. |
| `sstim:outcomeNeuralAccessRoute` | object | neuromodulation-evidence | sstim:EvidenceOutcomeConcept → sstim:NeuralAccessRoute | Tags an evidence outcome concept with the neural access route the finding is about. This is how a demonstrated route that competes with a… |
| `sstim:outcomeNeuralPhenomenon` | object | neuromodulation-evidence | sstim:EvidenceOutcomeConcept → sstim:NeuralPhenomenon | Tags an evidence outcome concept with the functional neural phenomenon the finding is about. This is the join that makes evidence about neural… |
| `sstim:outcomeNeuralSystem` | object | neuromodulation-evidence | sstim:EvidenceOutcomeConcept → sstim:NeuralSystem | Tags an evidence outcome concept with the distributed neural system the finding is about. |
| `sstim:outcomeNeuralTargetSite` | object | neuromodulation-evidence | sstim:EvidenceOutcomeConcept → sstim:NeuralTargetSite | Tags an evidence outcome concept with the neural site the finding is about, which may differ from the intended target site of the technique assessed. |
| `sstim:panPosition` | data | patch-studio | sstim:Voice | sstim:AudioTrack → XMLSchema:decimal | Stereo position from left to right. |
| `sstim:participantEngagementMode` | object | technique | — → sstim:ParticipantEngagementMode | Links a stimulation or neuromodulation process, technique, or protocol to the degree and kind of active participation it requires of the individual.… |
| `sstim:permittedUseScope` | data | evidence | — → 22-rdf-syntax-ns:langString | The permitted use and release scope of a governed research output as evidence. |
| `sstim:permutationFunction` | data | patch-studio | sstim:Voice → XMLSchema:integer | Permutation function selector for sequence ordering. Values match the skos:notation of sstim-v:PermutationFunctionScheme members (0=shuffle,… |
| `sstim:platformDeliverable` | data | common | sstim:SensoryModality → XMLSchema:boolean | Whether this modality is deliverable via standard consumer digital platforms without dedicated hardware. |
| `sstim:presetVersion` | data | configuration | sstim:Preset → XMLSchema:string | Semantic version string (X.Y.Z) of this preset. |
| `sstim:primaryAffect` | data | session | sstim:SelfReport → XMLSchema:integer | Affect rating at the report's declared collection phase, from 1 (very negative) to 5 (very positive). |
| `sstim:primaryFrequencyBand` | object | configuration | sstim:Preset → sstim:FrequencyBand | The single primary band among a preset's sstim:targetsFrequencyBand values, when more than one is declared. Corrects the former convention of an… |
| `sstim:promptIdentifier` | data | session | sstim:ParticipantObservation → XMLSchema:string | Stable identifier of the question as shown, within its instrument. |
| `sstim:promptText` | data | session | sstim:ParticipantObservation → XMLSchema:string | The exact wording shown to the participant. |
| `sstim:proposedMechanism` | object | technique | sstim:StimulationTechnique → sstim:StimulationMechanism | Links a stimulation technique to a controlled mechanism category proposed to explain a response. The relation records a hypothesis or evidence… |
| `sstim:propositionDigest` | data | evidence | — → XMLSchema:string | An immutable content digest identifying the exact proposition when text alone is insufficient. |
| `sstim:propositionOutcome` | object | evidence | — → sstim:EvidenceOutcomeConcept | The single identified outcome concept an assessment proposition is about. |
| `sstim:propositionSubject` | object | evidence | — → sstim:Preset | sstim:StimulationTechnique | The single subject of an assessment proposition; must match the assessment's evaluatesSubject value. |
| `sstim:propositionText` | data | evidence | — → 22-rdf-syntax-ns:langString | The exact language-tagged text of an atomic assessment proposition. |
| `sstim:pulseRateHz` | data | patch-studio | sstim:Voice | sstim:AudioTrack | sstim:ControlTrack → XMLSchema:decimal | Rhythmic pulse or sequence step rate in Hz. |
| `sstim:recommendedAction` | data | common | sstim:CautionTag → XMLSchema:string | Plain-language action an interface should present when a caution applies, such as reduce intensity, disable a channel, stop, or avoid the context. |
| `sstim:referenceKey` | data | evidence | sstim:PublicSafeReference → XMLSchema:string | Short uppercase key (e.g. 'INGENDOH_2023') matching citation keys in preset techDesc fields. |
| `sstim:referencesPreset` | object | session | sstim:SessionSpecification → sstim:Preset | Links a session specification to the preset it executes. |
| `sstim:reportedConfidence` | data | session | sstim:ParticipantObservation → XMLSchema:decimal | How confident the participant said they were in their own answer, from 0 to 1, where the instrument collects it. |
| `sstim:reportsUnwantedExperience` | object | session | sstim:ParticipantObservation → sstim:UnwantedExperienceObservation | Links the observation that asked about unwanted experiences to the experiences the participant described. The asking is an observation with its own… |
| `sstim:requiresEvidenceTierRank` | data | evidence | sstim:PublicClaimLevel → XMLSchema:integer | Minimum sstim:tierRank of supporting evidence required to assert at this claim level on a public surface. 0 = no evidence required… |
| `sstim:reviewRubric` | object | evidence | — → — | The immutable rubric or policy revision a review decision was made under. |
| `sstim:reviewedBy` | data | evidence | — → XMLSchema:string | Deprecated ADR 0027: reviewer identity and role live on the review activity's prov:qualifiedAssociation as agent IRIs, not name literals. A… |
| `sstim:reviewsAssessment` | object | evidence | — → sstim:EvidenceAssessmentClaim | The single assessment revision an evidence review decision is about; must equal the revision its generating review activity used. |
| `sstim:rotationSpeed` | data | patch-studio | sstim:SessionSpecification | sstim:VisualTrack → XMLSchema:decimal | Visual rotation rate or angular speed. |
| `sstim:scaleMaximum` | data | session | sstim:ParticipantObservation → XMLSchema:integer | Highest value the scale offered, as presented. |
| `sstim:scaleMaximumLabel` | data | session | sstim:ParticipantObservation → XMLSchema:string | Anchor text shown at the high end of the scale. |
| `sstim:scaleMinimum` | data | session | sstim:ParticipantObservation → XMLSchema:integer | Lowest value the scale offered, as presented. |
| `sstim:scaleMinimumLabel` | data | session | sstim:ParticipantObservation → XMLSchema:string | Anchor text shown at the low end of the scale, without which the number is not interpretable. |
| `sstim:scheduledStart` | data | session | sstim:SessionSpecification → XMLSchema:dateTime | Intended start time of the session. A property of the plan, not of any execution: sstim:SessionInstance records when a session actually ran. |
| `sstim:scopeComparator` | object | evidence | — → sstim:ComparatorDescriptor | sstim:ScopeMarker | The identified comparison condition of the proposition scope, or an explicit marker. |
| `sstim:scopeInterventionOrContext` | object | evidence | — → — | The identified intervention, technique, protocol, context, or exposure profile the proposition scope covers, or an explicit marker. |
| `sstim:scopePopulationOrModel` | object | evidence | — → sstim:PopulationDescriptor | sstim:StudyModel | sstim:ScopeMarker | A named population descriptor or study model of the proposition scope, or an explicit marker. |
| `sstim:scopeSensoryModality` | object | evidence | — → sstim:SensoryModality | sstim:ScopeMarker | A named sensory modality of the proposition scope, or an explicit unknown / not-reported / not-applicable marker. |
| `sstim:searchCoverageEnd` | data | evidence | — → XMLSchema:date | The latest date the search covered; the as-of date of a scoped search finding. |
| `sstim:searchCoverageStart` | data | evidence | — → XMLSchema:date | The earliest publication date the search covered, when bounded. |
| `sstim:searchDigest` | data | evidence | — → XMLSchema:string | A content digest of the search record's result set or export. |
| `sstim:searchEligibilityCriteria` | data | evidence | — → 22-rdf-syntax-ns:langString | The eligibility criteria applied to search results. |
| `sstim:searchQuery` | data | evidence | — → XMLSchema:string | The exact query string executed by an evidence search. |
| `sstim:searchResultCount` | data | evidence | — → XMLSchema:integer | The number of results the executed search returned. |
| `sstim:searchSource` | data | evidence | — → XMLSchema:string | A database or source searched, one value per source. |
| `sstim:sessionClockOffsetSeconds` | data | session | sstim:SessionEvent | sstim:SelfReport → XMLSchema:decimal | Seconds elapsed on the session's timing context between the clock origin recorded on the session instance and this occurrence. Offsets order the… |
| `sstim:sleepiness` | data | session | sstim:SelfReport → XMLSchema:integer | Sleepiness rating at the report's declared collection phase, from 1 (alert) to 5 (very drowsy). |
| `sstim:soundPressureLevelDb` | data | common | sstim-ex:StimulusChannel → XMLSchema:decimal | Sound pressure level at the subject's ear, in decibels SPL. This is the quantity sstim:masterVolume is not: a normalized engine gain is not a level,… |
| `sstim:specifiedBy` | object | configuration | sstim:Preset → sstim:StimulusSpecification | Links an engine configuration to the stimulus specification it realises. |
| `sstim:stimulationDeliveryApproach` | object | common | — → sstim:StimulationDeliveryApproach | Links a stimulation process, technique, protocol, or intervention to a coarse operational description of how the input is introduced or the… |
| `sstim:stimulationIntensity` | data | patch-studio | sstim:SessionSpecification | sstim:HapticTrack → XMLSchema:decimal | Strength of haptic or sensory output. |
| `sstim:stimulusRegime` | data | stimulus | sstim:StimulusSpecification → XMLSchema:string | Which kind of description this is: "determinate" when the stimulus is fixed in advance, "stochastic" when the specification describes a generating… |
| `sstim:studyPopulation` | data | evidence | — → XMLSchema:string | Deprecated ADR 0027: use the identified sstim:basisStudyPopulation descriptor plus sstim:basisPopulationNote on the qualified basis. Appears only in… |
| `sstim:subjectiveQuality` | data | session | sstim:SelfReport → XMLSchema:integer | Subjective quality rating for the associated session, normally collected after delivery, from 1 (poor) to 5 (excellent). |
| `sstim:supportsRelation` | object | evidence | — → sstim:Preset | sstim:StimulationTechnique | Deprecated ADR 0027: the property name encodes a supporting direction the claim may not have. Use sstim:evaluatesSubject; direction lives… |
| `sstim:targetsFrequencyBand` | object | configuration | sstim:Preset → sstim:FrequencyBand | Links a preset to 1–2 target frequency bands. RDF property values are unordered; use sstim:primaryFrequencyBand to identify which one is primary… |
| `sstim:techniqueModality` | object | technique | sstim:SensoryStimulationTechnique → sstim:SensoryModality | Coarse legacy/convenience relation linking a sensory stimulation technique to broad sensory modality tags. Use the SSTIM exposure module when… |
| `sstim:tempoBpm` | data | patch-studio | sstim:SessionSpecification | sstim:Preset → XMLSchema:decimal | Optional authoring tempo in beats per minute. |
| `sstim:tierRank` | data | evidence | sstim:EvidenceTierValue → XMLSchema:integer | Ordinal rank 1–6 for SPARQL ORDER BY. Speculative=1, Anecdotal=2, Preliminary=3, Moderate=4, Strong=5, Established=6. |
| `sstim:triggerCondition` | data | common | sstim:CautionTag → XMLSchema:string | Machine-readable-content companion text describing the stimulus feature, context, or user state that activates a caution. |
| `sstim:usesSpecification` | object | session | sstim:SessionInstance → sstim:SessionSpecification | Links a recorded session execution to the single immutable session specification it realizes. |
| `sstim:usesTechnique` | object | technique | sstim:StimulationProtocol → sstim:StimulationTechnique | Links a stimulation protocol to a technique used by the protocol. Naming a method does not make the protocol sensory, nor imply that any framework… |
| `sstim:visualDensity` | data | patch-studio | sstim:SessionSpecification | sstim:VisualTrack → XMLSchema:decimal | Density of rendered visual elements. |
| `sstim:visualSideCount` | data | patch-studio | sstim:SessionSpecification | sstim:VisualTrack → XMLSchema:integer | Number of sides used by a geometric visual form. |

## Concepts

Controlled values. A schema offering a controlled value that is not here is minting one (audit finding KR-17).

| Concept | Category | Module | Notation |
|---|---|---|---|
| `sstim-eco:citedAuthor` | sstim-eco:RelationshipType | ecosystem | cited-author |
| `sstim-eco:contributor` | sstim-eco:RelationshipType | ecosystem | contributor |
| `sstim-eco:funder` | sstim-eco:ImplementationResponsibilityType, sstim-eco:RelationshipType | ecosystem | funder |
| `sstim-eco:implementationDeveloper` | sstim-eco:ImplementationResponsibilityType, sstim-eco:RelationshipType | ecosystem | implementation-developer |
| `sstim-eco:implementationMaintainer` | sstim-eco:ImplementationResponsibilityType, sstim-eco:RelationshipType | ecosystem | implementation-maintainer |
| `sstim-eco:implementationOperator` | sstim-eco:ImplementationResponsibilityType, sstim-eco:RelationshipType | ecosystem | implementation-operator |
| `sstim-eco:implementationProvider` | sstim-eco:ImplementationResponsibilityType, sstim-eco:RelationshipType | ecosystem | implementation-provider |
| `sstim-eco:implementationPublisher` | sstim-eco:ImplementationResponsibilityType, sstim-eco:RelationshipType | ecosystem | implementation-publisher |
| `sstim-eco:institutionalHost` | sstim-eco:ImplementationResponsibilityType, sstim-eco:RelationshipType | ecosystem | institutional-host |
| `sstim-eco:organizationMember` | sstim-eco:RelationshipType | ecosystem | organization-member |
| `sstim-eco:outcomeAcknowledged` | sstim-eco:EngagementOutcome | ecosystem | acknowledged |
| `sstim-eco:outcomeChangesRequested` | sstim-eco:EngagementOutcome | ecosystem | changes-requested |
| `sstim-eco:outcomeConsentDeclined` | sstim-eco:EngagementOutcome | ecosystem | consent-declined |
| `sstim-eco:outcomeConsentGranted` | sstim-eco:EngagementOutcome | ecosystem | consent-granted |
| `sstim-eco:outcomeConsentWithdrawn` | sstim-eco:EngagementOutcome | ecosystem | consent-withdrawn |
| `sstim-eco:outcomeNotificationFailed` | sstim-eco:EngagementOutcome | ecosystem | notification-failed |
| `sstim-eco:outcomeNotificationSent` | sstim-eco:EngagementOutcome | ecosystem | notification-sent |
| `sstim-eco:outcomeObjected` | sstim-eco:EngagementOutcome | ecosystem | objected |
| `sstim-eco:outcomePublicationApproved` | sstim-eco:EngagementOutcome | ecosystem | publication-approved |
| `sstim-eco:outcomePublicationWithheld` | sstim-eco:EngagementOutcome | ecosystem | publication-withheld |
| `sstim-eco:outcomeRecordAmended` | sstim-eco:EngagementOutcome | ecosystem | record-amended |
| `sstim-eco:outcomeRemovalRequested` | sstim-eco:EngagementOutcome | ecosystem | removal-requested |
| `sstim-eco:peerProject` | sstim-eco:RelationshipType | ecosystem | peer-project |
| `sstim-eco:purposeArchivalPublication` | sstim-eco:EcosystemPurpose | ecosystem | archival-publication |
| `sstim-eco:purposeLivePublication` | sstim-eco:EcosystemPurpose | ecosystem | live-publication |
| `sstim-eco:purposeOutreach` | sstim-eco:EcosystemPurpose | ecosystem | outreach |
| `sstim-eco:purposePublicAttribution` | sstim-eco:EcosystemPurpose | ecosystem | public-attribution |
| `sstim-eco:purposePublicDiscovery` | sstim-eco:EcosystemPurpose | ecosystem | public-discovery |
| `sstim-eco:referencedSource` | sstim-eco:RelationshipType | ecosystem | referenced-source |
| `sstim-eco:researchCollaborator` | sstim-eco:RelationshipType | ecosystem | research-collaborator |
| `sstim-eco:scientificAdvisor` | sstim-eco:RelationshipType | ecosystem | scientific-advisor |
| `sstim-eco:stakeholder` | sstim-eco:RelationshipType | ecosystem | stakeholder |
| `sstim-eco:standardsBody` | sstim-eco:RelationshipType | ecosystem | standards-body |
| `sstim-eco:toolVendor` | sstim-eco:RelationshipType | ecosystem | tool-vendor |
| `sstim-ex:audioNoiseBlackSilence` | sstim-ex:AudioNoiseColor | exposure | black-silence |
| `sstim-ex:audioNoiseBlue` | sstim-ex:AudioNoiseColor | exposure | blue |
| `sstim-ex:audioNoiseBrownRed` | sstim-ex:AudioNoiseColor | exposure | brown-red |
| `sstim-ex:audioNoiseGrey` | sstim-ex:AudioNoiseColor | exposure | grey |
| `sstim-ex:audioNoisePink` | sstim-ex:AudioNoiseColor | exposure | pink |
| `sstim-ex:audioNoiseVioletPurple` | sstim-ex:AudioNoiseColor | exposure | violet-purple |
| `sstim-ex:audioNoiseWhite` | sstim-ex:AudioNoiseColor | exposure | white |
| `sstim-ex:boundaryBalanceRisk` | sstim-ex:ComfortBoundary | exposure | balance-risk |
| `sstim-ex:boundaryBodyContactComfort` | sstim-ex:ComfortBoundary | exposure | body-contact-comfort |
| `sstim-ex:boundaryEnvironmentalAwareness` | sstim-ex:ComfortBoundary | exposure | environmental-awareness |
| `sstim-ex:boundaryEyeStrain` | sstim-ex:ComfortBoundary | exposure | eye-strain |
| `sstim-ex:boundaryHearingRisk` | sstim-ex:ComfortBoundary | exposure | hearing-risk |
| `sstim-ex:boundaryIsolation` | sstim-ex:ComfortBoundary | exposure | isolation |
| `sstim-ex:boundaryOpticalRadiation` | sstim-ex:ComfortBoundary | exposure | optical-radiation |
| `sstim-ex:boundaryPhotosensitivity` | sstim-ex:ComfortBoundary | exposure | photosensitivity |
| `sstim-ex:boundaryThermalComfort` | sstim-ex:ComfortBoundary | exposure | thermal-comfort |
| `sstim-ex:capabilityAirflowActuation` | sstim-ex:DeviceCapability | exposure | airflow-actuation |
| `sstim-ex:capabilityAmbientRadioEmitter` | sstim-ex:DeviceCapability | exposure | ambient-radio-emitter |
| `sstim-ex:capabilityArGlasses` | sstim-ex:DeviceCapability | exposure | ar-glasses |
| `sstim-ex:capabilityBodyPositionTracking` | sstim-ex:DeviceCapability | exposure | body-position-tracking |
| `sstim-ex:capabilityDisplayFlicker` | sstim-ex:DeviceCapability | exposure | display-flicker |
| `sstim-ex:capabilityDisplayLightOutput` | sstim-ex:DeviceCapability | exposure | display-light-output |
| `sstim-ex:capabilityFreeViewStereoscopy` | sstim-ex:DeviceCapability | exposure | free-view-stereoscopy |
| `sstim-ex:capabilityFullVisualOcclusion` | sstim-ex:DeviceCapability | exposure | full-visual-occlusion |
| `sstim-ex:capabilityGravityCueing` | sstim-ex:DeviceCapability | exposure | gravity-cueing |
| `sstim-ex:capabilityHapticActuator` | sstim-ex:DeviceCapability | exposure | haptic-actuator |
| `sstim-ex:capabilityHeadphones` | sstim-ex:DeviceCapability | exposure | headphones |
| `sstim-ex:capabilityHrtfSpatialAudio` | sstim-ex:DeviceCapability | exposure | hrtf-spatial-audio |
| `sstim-ex:capabilityInfraredLightOutput` | sstim-ex:DeviceCapability | exposure | infrared-light-output |
| `sstim-ex:capabilityJointForceActuation` | sstim-ex:DeviceCapability | exposure | joint-force-actuation |
| `sstim-ex:capabilityLiquidGelTactileImmersion` | sstim-ex:DeviceCapability | exposure | liquid-gel-tactile-immersion |
| `sstim-ex:capabilityLocomotionInterface` | sstim-ex:DeviceCapability | exposure | locomotion-interface |
| `sstim-ex:capabilityMultiDeviceBodyPlacement` | sstim-ex:DeviceCapability | exposure | multi-device-body-placement |
| `sstim-ex:capabilityPhoneVibration` | sstim-ex:DeviceCapability | exposure | phone-vibration |
| `sstim-ex:capabilityRoomScaleTracking` | sstim-ex:DeviceCapability | exposure | room-scale-tracking |
| `sstim-ex:capabilityScentDelivery` | sstim-ex:DeviceCapability | exposure | scent-delivery |
| `sstim-ex:capabilitySensorInput` | sstim-ex:DeviceCapability | exposure | sensor-input |
| `sstim-ex:capabilityStereoSeparation` | sstim-ex:DeviceCapability | exposure | stereo-separation |
| `sstim-ex:capabilityTactileCamera` | sstim-ex:DeviceCapability | exposure | tactile-camera |
| `sstim-ex:capabilityTactileDisplay` | sstim-ex:DeviceCapability | exposure | tactile-display |
| `sstim-ex:capabilityTasteDelivery` | sstim-ex:DeviceCapability | exposure | taste-delivery |
| `sstim-ex:capabilityThermalActuation` | sstim-ex:DeviceCapability | exposure | thermal-actuation |
| `sstim-ex:capabilityUltravioletLightOutput` | sstim-ex:DeviceCapability | exposure | ultraviolet-light-output |
| `sstim-ex:capabilityVrHeadset` | sstim-ex:DeviceCapability | exposure | vr-headset |
| `sstim-ex:capabilityWearableLightArray` | sstim-ex:DeviceCapability | exposure | wearable-light-array |
| `sstim-ex:capabilityWearableSpeakerArray` | sstim-ex:DeviceCapability | exposure | wearable-speaker-array |
| `sstim-ex:contextBiohacking` | sstim-ex:BiohackingContext | exposure | biohacking |
| `sstim-ex:contextBscLabPrototype` | sstim-ex:ExperimentContext | exposure | bsc-lab-prototype |
| `sstim-ex:contextCapabilityBoundary` | sstim-ex:ExperimentContext | exposure | capability-boundary |
| `sstim-ex:contextExploratoryNonClinical` | sstim-ex:ExperimentContext | exposure | exploratory-non-clinical |
| `sstim-ex:contextSelfObservation` | sstim-ex:ExperimentContext | exposure | self-observation |
| `sstim-ex:contextSocialProtocol` | sstim-ex:ExperimentContext | exposure | social-protocol |
| `sstim-ex:effectArousal` | sstim-ex:EffectDimension | exposure | arousal |
| `sstim-ex:effectBalanceRisk` | sstim-ex:EffectDimension | exposure | balance-risk |
| `sstim-ex:effectBloodPressure` | sstim-ex:EffectDimension | exposure | blood-pressure |
| `sstim-ex:effectBodyVibration` | sstim-ex:EffectDimension | exposure | body-vibration |
| `sstim-ex:effectBreathRate` | sstim-ex:EffectDimension | exposure | breath-rate |
| `sstim-ex:effectCalm` | sstim-ex:EffectDimension | exposure | calm |
| `sstim-ex:effectDiscomfort` | sstim-ex:EffectDimension | exposure | discomfort |
| `sstim-ex:effectEyeStrain` | sstim-ex:EffectDimension | exposure | eye-strain |
| `sstim-ex:effectGravityPerception` | sstim-ex:EffectDimension | exposure | gravity-perception |
| `sstim-ex:effectHearingRisk` | sstim-ex:EffectDimension | exposure | hearing-risk |
| `sstim-ex:effectHeartRate` | sstim-ex:EffectDimension | exposure | heart-rate |
| `sstim-ex:effectImmersion` | sstim-ex:EffectDimension | exposure | immersion |
| `sstim-ex:effectPhotosensitivityRisk` | sstim-ex:EffectDimension | exposure | photosensitivity-risk |
| `sstim-ex:effectPhysiologicalResponse` | sstim-ex:EffectDimension | exposure | physiological-response |
| `sstim-ex:effectPleasantness` | sstim-ex:EffectDimension | exposure | pleasantness |
| `sstim-ex:effectProprioception` | sstim-ex:EffectDimension | exposure | proprioception |
| `sstim-ex:effectSocialConnectedness` | sstim-ex:EffectDimension | exposure | social-connectedness |
| `sstim-ex:effectSpatialPresence` | sstim-ex:EffectDimension | exposure | spatial-presence |
| `sstim-ex:effectStress` | sstim-ex:EffectDimension | exposure | stress |
| `sstim-ex:effectTactileSensation` | sstim-ex:EffectDimension | exposure | tactile-sensation |
| `sstim-ex:effectTemperaturePerception` | sstim-ex:EffectDimension | exposure | temperature-perception |
| `sstim-ex:gainAudioImmersion` | sstim-ex:PerceptualGain | exposure | audio-immersion |
| `sstim-ex:gainBodyVibration` | sstim-ex:PerceptualGain | exposure | body-vibration |
| `sstim-ex:gainSocialReflection` | sstim-ex:PerceptualGain | exposure | social-reflection |
| `sstim-ex:gainSpatialAudio` | sstim-ex:PerceptualGain | exposure | spatial-audio |
| `sstim-ex:gainSpatialPresence` | sstim-ex:PerceptualGain | exposure | spatial-presence |
| `sstim-ex:gainStereoDepth` | sstim-ex:PerceptualGain | exposure | stereo-depth |
| `sstim-ex:gainTactileImmersion` | sstim-ex:PerceptualGain | exposure | tactile-immersion |
| `sstim-ex:gainThermalProximity` | sstim-ex:PerceptualGain | exposure | thermal-proximity |
| `sstim-ex:hypothesisInSSTIM` | sstim-ex:KnowledgeStatus | exposure | hypothesisInSSTIM |
| `sstim-ex:knownInSSTIM` | sstim-ex:KnowledgeStatus | exposure | knownInSSTIM |
| `sstim-ex:lossClaimCertainty` | sstim-ex:PerceptualLoss | exposure | claim-certainty |
| `sstim-ex:lossComfort` | sstim-ex:PerceptualLoss | exposure | comfort |
| `sstim-ex:lossDeliverability` | sstim-ex:PerceptualLoss | exposure | deliverability |
| `sstim-ex:lossDeviceFeasibility` | sstim-ex:PerceptualLoss | exposure | device-feasibility |
| `sstim-ex:lossEnvironmentalAwareness` | sstim-ex:PerceptualLoss | exposure | environmental-awareness |
| `sstim-ex:lossHorizontalField` | sstim-ex:PerceptualLoss | exposure | horizontal-field |
| `sstim-ex:lossOutsideVision` | sstim-ex:PerceptualLoss | exposure | outside-vision |
| `sstim-ex:mediumAcousticEnergy` | sstim-ex:PhysicalDeliveryMedium | exposure | acoustic-energy |
| `sstim-ex:mediumAirConductedSound` | sstim-ex:PhysicalDeliveryMedium | exposure | air-conducted-sound |
| `sstim-ex:mediumAirflow` | sstim-ex:PhysicalDeliveryMedium | exposure | airflow |
| `sstim-ex:mediumAppliedElectricCurrent` | sstim-ex:PhysicalDeliveryMedium | exposure | applied-electric-current |
| `sstim-ex:mediumAppliedElectricField` | sstim-ex:PhysicalDeliveryMedium | exposure | applied-electric-field |
| `sstim-ex:mediumAppliedMagneticField` | sstim-ex:PhysicalDeliveryMedium | exposure | applied-magnetic-field |
| `sstim-ex:mediumChemicalAgent` | sstim-ex:PhysicalDeliveryMedium | exposure | chemical-agent |
| `sstim-ex:mediumContactAcousticVibration` | sstim-ex:PhysicalDeliveryMedium | exposure | contact-acoustic-vibration |
| `sstim-ex:mediumElectromagneticField` | sstim-ex:PhysicalDeliveryMedium | exposure | electromagnetic-field |
| `sstim-ex:mediumElectromagneticRadiation` | sstim-ex:PhysicalDeliveryMedium | exposure | electromagnetic-radiation |
| `sstim-ex:mediumFluidMotion` | sstim-ex:PhysicalDeliveryMedium | exposure | fluid-motion |
| `sstim-ex:mediumFocusedUltrasound` | sstim-ex:PhysicalDeliveryMedium | exposure | focused-ultrasound |
| `sstim-ex:mediumGustatoryChemicalExposure` | sstim-ex:PhysicalDeliveryMedium | exposure | gustatory-chemical-exposure |
| `sstim-ex:mediumInfraredRadiation` | sstim-ex:PhysicalDeliveryMedium | exposure | infrared-radiation |
| `sstim-ex:mediumLiquidGelImmersion` | sstim-ex:PhysicalDeliveryMedium | exposure | liquid-gel-immersion |
| `sstim-ex:mediumMechanicalForce` | sstim-ex:PhysicalDeliveryMedium | exposure | mechanical-force |
| `sstim-ex:mediumMechanicalVibration` | sstim-ex:PhysicalDeliveryMedium | exposure | mechanical-vibration |
| `sstim-ex:mediumOlfactoryChemicalExposure` | sstim-ex:PhysicalDeliveryMedium | exposure | olfactory-chemical-exposure |
| `sstim-ex:mediumPharmacologicalAgent` | sstim-ex:PhysicalDeliveryMedium | exposure | pharmacological-agent |
| `sstim-ex:mediumRespiratoryCue` | sstim-ex:PhysicalDeliveryMedium | exposure | respiratory-cue |
| `sstim-ex:mediumRigidSurfaceContact` | sstim-ex:PhysicalDeliveryMedium | exposure | rigid-surface-contact |
| `sstim-ex:mediumStereoscopicVisualPresentation` | sstim-ex:PhysicalDeliveryMedium | exposure | stereoscopic-visual-presentation |
| `sstim-ex:mediumTextileClothingContact` | sstim-ex:PhysicalDeliveryMedium | exposure | textile-clothing-contact |
| `sstim-ex:mediumThermalContact` | sstim-ex:PhysicalDeliveryMedium | exposure | thermal-contact |
| `sstim-ex:mediumThermalEnergy` | sstim-ex:PhysicalDeliveryMedium | exposure | thermal-energy |
| `sstim-ex:mediumUltravioletRadiation` | sstim-ex:PhysicalDeliveryMedium | exposure | ultraviolet-radiation |
| `sstim-ex:mediumVisualLight` | sstim-ex:PhysicalDeliveryMedium | exposure | visual-light |
| `sstim-ex:modalityAuditory` | sstim-ex:PerceivedModality | exposure | auditory |
| `sstim-ex:modalityGustatory` | sstim-ex:PerceivedModality | exposure | gustatory |
| `sstim-ex:modalityInteroceptive` | sstim-ex:PerceivedModality | exposure | interoceptive |
| `sstim-ex:modalityMultimodal` | sstim-ex:PerceivedModality | exposure | multimodal |
| `sstim-ex:modalityNotDirectlyPerceived` | sstim-ex:PerceivedModality | exposure | not-directly-perceived |
| `sstim-ex:modalityOlfactory` | sstim-ex:PerceivedModality | exposure | olfactory |
| `sstim-ex:modalityProprioceptive` | sstim-ex:PerceivedModality | exposure | proprioceptive |
| `sstim-ex:modalitySocialPerceptual` | sstim-ex:PerceivedModality | exposure | social-perceptual |
| `sstim-ex:modalitySomatosensory` | sstim-ex:PerceivedModality | exposure | somatosensory |
| `sstim-ex:modalityTactile` | sstim-ex:PerceivedModality | exposure | tactile |
| `sstim-ex:modalityVestibular` | sstim-ex:PerceivedModality | exposure | vestibular |
| `sstim-ex:modalityVisual` | sstim-ex:PerceivedModality | exposure | visual |
| `sstim-ex:noKnownEvidenceInSSTIM` | sstim-ex:KnowledgeStatus | exposure | noKnownEvidenceInSSTIM |
| `sstim-ex:notCurrentlyDeliverableByBSCLab` | sstim-ex:KnowledgeStatus | exposure | notCurrentlyDeliverableByBSCLab |
| `sstim-ex:notCurrentlyUsedInBSCLab` | sstim-ex:KnowledgeStatus | exposure | notCurrentlyUsedInBSCLab |
| `sstim-ex:outsideBSCLabScope` | sstim-ex:KnowledgeStatus | exposure | outsideBSCLabScope |
| `sstim-ex:patternAdaptive` | sstim-ex:StimulusPattern | exposure | adaptive |
| `sstim-ex:patternBlinking` | sstim-ex:StimulusPattern | exposure | blinking |
| `sstim-ex:patternChangingColor` | sstim-ex:StimulusPattern | exposure | changing-color |
| `sstim-ex:patternContinuous` | sstim-ex:StimulusPattern | exposure | continuous |
| `sstim-ex:patternFixedColor` | sstim-ex:StimulusPattern | exposure | fixed-color |
| `sstim-ex:patternMoving` | sstim-ex:StimulusPattern | exposure | moving |
| `sstim-ex:patternNoise` | sstim-ex:StimulusPattern | exposure | noise |
| `sstim-ex:patternPulsed` | sstim-ex:StimulusPattern | exposure | pulsed |
| `sstim-ex:patternRhythmic` | sstim-ex:StimulusPattern | exposure | rhythmic |
| `sstim-ex:patternStatic` | sstim-ex:StimulusPattern | exposure | static |
| `sstim-ex:patternStochastic` | sstim-ex:StimulusPattern | exposure | stochastic |
| `sstim-ex:patternTextured` | sstim-ex:StimulusPattern | exposure | textured |
| `sstim-ex:placementEarLeft` | sstim-ex:BodyPlacement | exposure | ear-left |
| `sstim-ex:placementEarRight` | sstim-ex:BodyPlacement | exposure | ear-right |
| `sstim-ex:placementEars` | sstim-ex:BodyPlacement | exposure | ears |
| `sstim-ex:placementEyeLeft` | sstim-ex:BodyPlacement | exposure | eye-left |
| `sstim-ex:placementEyeRight` | sstim-ex:BodyPlacement | exposure | eye-right |
| `sstim-ex:placementEyes` | sstim-ex:BodyPlacement | exposure | eyes |
| `sstim-ex:placementFeet` | sstim-ex:BodyPlacement | exposure | feet |
| `sstim-ex:placementHands` | sstim-ex:BodyPlacement | exposure | hands |
| `sstim-ex:placementJoints` | sstim-ex:BodyPlacement | exposure | joints |
| `sstim-ex:placementMouth` | sstim-ex:BodyPlacement | exposure | mouth |
| `sstim-ex:placementNearbyEnvironment` | sstim-ex:BodyPlacement | exposure | nearby-environment |
| `sstim-ex:placementNose` | sstim-ex:BodyPlacement | exposure | nose |
| `sstim-ex:placementTopOfHead` | sstim-ex:BodyPlacement | exposure | top-of-head |
| `sstim-ex:placementTorso` | sstim-ex:BodyPlacement | exposure | torso |
| `sstim-ex:placementWholeBody` | sstim-ex:BodyPlacement | exposure | whole-body |
| `sstim-ex:roleConcomitant` | sstim-ex:StimulusChannelRole | exposure | concomitant |
| `sstim-ex:roleControlOrSham` | sstim-ex:StimulusChannelRole | exposure | control-or-sham |
| `sstim-ex:roleFeedback` | sstim-ex:StimulusChannelRole | exposure | feedback |
| `sstim-ex:roleIntendedIntervention` | sstim-ex:StimulusChannelRole | exposure | intended-intervention |
| `sstim-ex:unknownToSSTIM` | sstim-ex:KnowledgeStatus | exposure | unknownToSSTIM |
| `sstim-ex:visualFieldBlack` | sstim-ex:VisualNoiseType | exposure | black-field |
| `sstim-ex:visualFieldStaticColor` | sstim-ex:VisualNoiseType | exposure | static-color-field |
| `sstim-ex:visualFieldWhite` | sstim-ex:VisualNoiseType | exposure | white-field |
| `sstim-ex:visualNoiseChromatic` | sstim-ex:VisualNoiseType | exposure | chromatic-noise |
| `sstim-ex:visualNoiseLuminance` | sstim-ex:VisualNoiseType | exposure | luminance-noise |
| `sstim-ex:visualNoiseMoving` | sstim-ex:VisualNoiseType | exposure | moving-visual-noise |
| `sstim-ex:visualNoisePixel` | sstim-ex:VisualNoiseType | exposure | pixel-noise |
| `sstim-v:actionChangedDelivery` | sstim:ExperienceResponseAction | vocab | action-changed-delivery |
| `sstim-v:actionDeclined` | sstim:ExperienceResponseAction | vocab | action-declined |
| `sstim-v:actionNone` | sstim:ExperienceResponseAction | vocab | action-none |
| `sstim-v:actionOther` | sstim:ExperienceResponseAction | vocab | action-other |
| `sstim-v:actionPausedSession` | sstim:ExperienceResponseAction | vocab | action-paused-session |
| `sstim-v:actionReducedIntensity` | sstim:ExperienceResponseAction | vocab | action-reduced-intensity |
| `sstim-v:actionStoppedSession` | sstim:ExperienceResponseAction | vocab | action-stopped-session |
| `sstim-v:actionUnknown` | sstim:ExperienceResponseAction | vocab | action-unknown |
| `sstim-v:allFrequencyBands` | sstim:FrequencyBandGroup | vocab | all |
| `sstim-v:alpha` | sstim:FrequencyBand | vocab | alpha |
| `sstim-v:alpha10` | sstim:FrequencyBand | vocab | alpha-10 |
| `sstim-v:alphaOscillation` | sstim:NeuralOscillationType | vocab | alpha-oscillation |
| `sstim-v:applicabilityMixedModalities` | sstim:ModalityApplicability | vocab | mixed-modalities |
| `sstim-v:applicabilityNotApplicable` | sstim:ModalityApplicability | vocab | not-applicable-modality |
| `sstim-v:applicabilityUnknownModality` | sstim:ModalityApplicability | vocab | unknown-modality |
| `sstim-v:approachEnvironmentalReceptorFacing` | sstim:StimulationDeliveryApproach | vocab | approach-environmental-receptor-facing |
| `sstim-v:approachEpidural` | sstim:StimulationDeliveryApproach | vocab | approach-epidural |
| `sstim-v:approachExternal` | sstim:StimulationDeliveryApproach | vocab | approach-external |
| `sstim-v:approachImplanted` | sstim:StimulationDeliveryApproach | vocab | approach-implanted |
| `sstim-v:approachIntracranial` | sstim:StimulationDeliveryApproach | vocab | approach-intracranial |
| `sstim-v:approachIntrathecal` | sstim:StimulationDeliveryApproach | vocab | approach-intrathecal |
| `sstim-v:approachPercutaneous` | sstim:StimulationDeliveryApproach | vocab | approach-percutaneous |
| `sstim-v:approachSystemic` | sstim:StimulationDeliveryApproach | vocab | approach-systemic |
| `sstim-v:approachTargetedLocalInfusion` | sstim:StimulationDeliveryApproach | vocab | approach-targeted-local-infusion |
| `sstim-v:approachTranscranial` | sstim:StimulationDeliveryApproach | vocab | approach-transcranial |
| `sstim-v:approachTranscutaneous` | sstim:StimulationDeliveryApproach | vocab | approach-transcutaneous |
| `sstim-v:beta` | sstim:FrequencyBand | vocab | beta |
| `sstim-v:betaOscillation` | sstim:NeuralOscillationType | vocab | beta-oscillation |
| `sstim-v:cautionAdvancedUser` | sstim:CautionTag | vocab | advanced-use |
| `sstim-v:cautionDrivingUnsafe` | sstim:CautionTag | vocab | driving-unsafe |
| `sstim-v:cautionDrowsyUse` | sstim:CautionTag | vocab | drowsy-use |
| `sstim-v:cautionEmotionallySensitive` | sstim:CautionTag | vocab | emotionally-sensitive |
| `sstim-v:cautionEpilepsyRisk` | sstim:CautionTag | vocab | epilepsy-risk |
| `sstim-v:cautionFatigueSensitive` | sstim:CautionTag | vocab | fatigue-sensitive |
| `sstim-v:cautionHighIntensity` | sstim:CautionTag | vocab | high-intensity |
| `sstim-v:cautionNighttimeOnly` | sstim:CautionTag | vocab | nighttime-only |
| `sstim-v:cautionOverloadSensitive` | sstim:CautionTag | vocab | overload-sensitive |
| `sstim-v:cautionSeverityHigh` | sstim:CautionSeverity | vocab | high |
| `sstim-v:cautionSeverityInfo` | sstim:CautionSeverity | vocab | info |
| `sstim-v:cautionSeverityLow` | sstim:CautionSeverity | vocab | low |
| `sstim-v:cautionSeverityModerate` | sstim:CautionSeverity | vocab | moderate |
| `sstim-v:cautionStimulating` | sstim:CautionTag | vocab | stimulating |
| `sstim-v:cautionUltraSlowBreathing` | sstim:CautionTag | vocab | ultra-slow-breathing |
| `sstim-v:claimC0Descriptive` | sstim:PublicClaimLevel | vocab | C0 |
| `sstim-v:claimC1Experiential` | sstim:PublicClaimLevel | vocab | C1 |
| `sstim-v:claimC2Wellness` | sstim:PublicClaimLevel | vocab | C2 |
| `sstim-v:claimC3StructureFunction` | sstim:PublicClaimLevel | vocab | C3 |
| `sstim-v:claimC4Medical` | sstim:PublicClaimLevel | vocab | C4 |
| `sstim-v:claimC5Quantified` | sstim:PublicClaimLevel | vocab | C5 |
| `sstim-v:claimInconclusive` | sstim:ClaimDirection | vocab | inconclusive |
| `sstim-v:claimMixed` | sstim:ClaimDirection | vocab | mixed |
| `sstim-v:claimRefutes` | sstim:ClaimDirection | vocab | refutes |
| `sstim-v:claimSupports` | sstim:ClaimDirection | vocab | supports |
| `sstim-v:delta` | sstim:FrequencyBand | vocab | delta |
| `sstim-v:deltaOscillation` | sstim:NeuralOscillationType | vocab | delta-oscillation |
| `sstim-v:designCaseReport` | sstim:StudyDesign | vocab | case-report |
| `sstim-v:designControlledTrial` | sstim:StudyDesign | vocab | controlled-trial |
| `sstim-v:designMixedDesigns` | sstim:StudyDesign | vocab | mixed-designs |
| `sstim-v:designObservational` | sstim:StudyDesign | vocab | observational |
| `sstim-v:designPreclinicalExperiment` | sstim:StudyDesign | vocab | preclinical-experiment |
| `sstim-v:designRandomizedControlledTrial` | sstim:StudyDesign | vocab | rct |
| `sstim-v:designUnknownDesign` | sstim:StudyDesign | vocab | unknown-design |
| `sstim-v:effectDecrease` | sstim:EffectDirection | vocab | decrease |
| `sstim-v:effectIncrease` | sstim:EffectDirection | vocab | increase |
| `sstim-v:effectNoChange` | sstim:EffectDirection | vocab | no-change |
| `sstim-v:engagementActiveSelfRegulatory` | sstim:ParticipantEngagementMode | vocab | engagement-active-self-regulatory |
| `sstim-v:engagementGuidedFollowing` | sstim:ParticipantEngagementMode | vocab | engagement-guided-following |
| `sstim-v:engagementPassiveReceptive` | sstim:ParticipantEngagementMode | vocab | engagement-passive-receptive |
| `sstim-v:eventEngineFallback` | sstim:SessionEventType | vocab | engine-fallback |
| `sstim-v:eventObservationCollected` | sstim:SessionEventType | vocab | observation-collected |
| `sstim-v:eventPlaybackPause` | sstim:SessionEventType | vocab | playback-pause |
| `sstim-v:eventPlaybackResume` | sstim:SessionEventType | vocab | playback-resume |
| `sstim-v:eventPlaybackStart` | sstim:SessionEventType | vocab | playback-start |
| `sstim-v:eventPlaybackStop` | sstim:SessionEventType | vocab | playback-stop |
| `sstim-v:eventSafetyLimitApplied` | sstim:SessionEventType | vocab | safety-limit-applied |
| `sstim-v:eventSessionComplete` | sstim:SessionEventType | vocab | session-complete |
| `sstim-v:eventSessionInterrupt` | sstim:SessionEventType | vocab | session-interrupt |
| `sstim-v:eventSessionOpen` | sstim:SessionEventType | vocab | session-open |
| `sstim-v:experienceAuditoryDiscomfort` | sstim:UnwantedExperienceCategory | vocab | auditory-discomfort |
| `sstim-v:experienceDizziness` | sstim:UnwantedExperienceCategory | vocab | dizziness |
| `sstim-v:experienceEyeStrain` | sstim:UnwantedExperienceCategory | vocab | eye-strain |
| `sstim-v:experienceHeadSensation` | sstim:UnwantedExperienceCategory | vocab | head-sensation |
| `sstim-v:experienceLowMood` | sstim:UnwantedExperienceCategory | vocab | low-mood |
| `sstim-v:experienceNausea` | sstim:UnwantedExperienceCategory | vocab | nausea |
| `sstim-v:experienceOther` | sstim:UnwantedExperienceCategory | vocab | other |
| `sstim-v:experienceRestlessness` | sstim:UnwantedExperienceCategory | vocab | restlessness |
| `sstim-v:experienceSleepDisruption` | sstim:UnwantedExperienceCategory | vocab | sleep-disruption |
| `sstim-v:experienceVisualDiscomfort` | sstim:UnwantedExperienceCategory | vocab | visual-discomfort |
| `sstim-v:formBoundedNullResult` | sstim:EvidencePropositionForm | vocab | bounded-null-result |
| `sstim-v:formBoundedRelation` | sstim:EvidencePropositionForm | vocab | bounded-relation |
| `sstim-v:formScopedSearchFinding` | sstim:EvidencePropositionForm | vocab | scoped-search-finding |
| `sstim-v:formUniversalAbsence` | sstim:EvidencePropositionForm | vocab | universal-absence |
| `sstim-v:gamma` | sstim:FrequencyBand | vocab | gamma |
| `sstim-v:gamma40` | sstim:FrequencyBand | vocab | gamma-40 |
| `sstim-v:gammaOscillation` | sstim:NeuralOscillationType | vocab | gamma-oscillation |
| `sstim-v:groupHeal` | sstim:PresetGroup | vocab | Heal |
| `sstim-v:groupIndulge` | sstim:PresetGroup | vocab | Indulge |
| `sstim-v:groupPerform` | sstim:PresetGroup | vocab | Perform |
| `sstim-v:groupSupport` | sstim:PresetGroup | vocab | Support |
| `sstim-v:groupTranscend` | sstim:PresetGroup | vocab | Transcend |
| `sstim-v:highAlpha` | sstim:FrequencyBand | vocab | high-alpha |
| `sstim-v:highBeta` | sstim:FrequencyBand | vocab | high-beta |
| `sstim-v:highDelta` | sstim:FrequencyBand | vocab | high-delta |
| `sstim-v:highTheta` | sstim:FrequencyBand | vocab | high-theta |
| `sstim-v:independenceIndependent` | sstim:IndependenceDetermination | vocab | independent |
| `sstim-v:independenceNotIndependent` | sstim:IndependenceDetermination | vocab | not-independent |
| `sstim-v:independenceUndetermined` | sstim:IndependenceDetermination | vocab | undetermined |
| `sstim-v:lowAlpha` | sstim:FrequencyBand | vocab | low-alpha |
| `sstim-v:lowBeta` | sstim:FrequencyBand | vocab | low-beta |
| `sstim-v:lowDelta` | sstim:FrequencyBand | vocab | low-delta |
| `sstim-v:lowTheta` | sstim:FrequencyBand | vocab | low-theta |
| `sstim-v:mechAttentional` | sstim:StimulationMechanism | vocab | ATTN |
| `sstim-v:mechAuditoryMotor` | sstim:StimulationMechanism | vocab | AUDMOT |
| `sstim-v:mechAutonomic` | sstim:StimulationMechanism | vocab | AUTONOMIC |
| `sstim-v:mechClosedLoopPhase` | sstim:StimulationMechanism | vocab | CLPHASE |
| `sstim-v:mechGamma40` | sstim:StimulationMechanism | vocab | GAMMA40NI |
| `sstim-v:mechMasking` | sstim:StimulationMechanism | vocab | MASK |
| `sstim-v:mechMechanoreceptive` | sstim:StimulationMechanism | vocab | MECHANO |
| `sstim-v:mechMultisensory` | sstim:StimulationMechanism | vocab | MULTISENS |
| `sstim-v:mechStochastic` | sstim:StimulationMechanism | vocab | SR |
| `sstim-v:mechThalamocortical` | sstim:StimulationMechanism | vocab | THALCORT |
| `sstim-v:mechUltrasonic` | sstim:StimulationMechanism | vocab | USND |
| `sstim-v:midBeta` | sstim:FrequencyBand | vocab | mid-beta |
| `sstim-v:modalityAUD` | sstim:EvidenceModalityTag | vocab | AUD |
| `sstim-v:modalityAV` | sstim:EvidenceModalityTag | vocab | AV |
| `sstim-v:modalityAuditory` | sstim:SensoryModality | vocab | auditory |
| `sstim-v:modalityBREATH` | sstim:EvidenceModalityTag | vocab | BREATH |
| `sstim-v:modalityGENERAL` | sstim:EvidenceModalityTag | vocab | GENERAL |
| `sstim-v:modalityInteroceptive` | sstim:SensoryModality | vocab | interoceptive |
| `sstim-v:modalityMULTISENSORY` | sstim:EvidenceModalityTag | vocab | MULTISENSORY |
| `sstim-v:modalityOlfactory` | sstim:SensoryModality | vocab | olfactory |
| `sstim-v:modalityPRECLINICAL` | sstim:EvidenceModalityTag | vocab | PRECLINICAL |
| `sstim-v:modalityREVIEW` | sstim:EvidenceModalityTag | vocab | REVIEW |
| `sstim-v:modalitySomatosensory` | sstim:SensoryModality | vocab | somatosensory |
| `sstim-v:modalityTACTILE` | sstim:EvidenceModalityTag | vocab | TACTILE |
| `sstim-v:modalityVIS` | sstim:EvidenceModalityTag | vocab | VIS |
| `sstim-v:modalityVestibular` | sstim:SensoryModality | vocab | vestibular |
| `sstim-v:modalityVisual` | sstim:SensoryModality | vocab | visual |
| `sstim-v:modelComputational` | sstim:StudyModel | vocab | computational |
| `sstim-v:modelHuman` | sstim:StudyModel | vocab | human |
| `sstim-v:modelInVitro` | sstim:StudyModel | vocab | in-vitro |
| `sstim-v:modelMixedModels` | sstim:StudyModel | vocab | mixed-models |
| `sstim-v:modelPreclinicalAnimal` | sstim:StudyModel | vocab | preclinical-animal |
| `sstim-v:modelUnknownModel` | sstim:StudyModel | vocab | unknown-model |
| `sstim-v:noConflictDeclared` | sstim:ConflictDisclosure | vocab | no-conflict-declared |
| `sstim-v:onsetBeforeSession` | sstim:ExperienceOnsetPhase | vocab | onset-before |
| `sstim-v:onsetDuringSession` | sstim:ExperienceOnsetPhase | vocab | onset-during |
| `sstim-v:onsetImmediatelyAfter` | sstim:ExperienceOnsetPhase | vocab | onset-immediately-after |
| `sstim-v:onsetLaterSameDay` | sstim:ExperienceOnsetPhase | vocab | onset-later-same-day |
| `sstim-v:onsetNextDay` | sstim:ExperienceOnsetPhase | vocab | onset-next-day |
| `sstim-v:onsetUnknown` | sstim:ExperienceOnsetPhase | vocab | onset-unknown |
| `sstim-v:permIdentity` | sstim:PermutationFunction | vocab | 4 |
| `sstim-v:permReverse` | sstim:PermutationFunction | vocab | 3 |
| `sstim-v:permRotateBackward` | sstim:PermutationFunction | vocab | 2 |
| `sstim-v:permRotateForward` | sstim:PermutationFunction | vocab | 1 |
| `sstim-v:permShuffle` | sstim:PermutationFunction | vocab | 0 |
| `sstim-v:persistenceOngoing` | sstim:ExperiencePersistence | vocab | ongoing |
| `sstim-v:persistenceResolvedDuringSession` | sstim:ExperiencePersistence | vocab | resolved-during-session |
| `sstim-v:persistenceResolvedLater` | sstim:ExperiencePersistence | vocab | resolved-later |
| `sstim-v:persistenceResolvedSameDay` | sstim:ExperiencePersistence | vocab | resolved-same-day |
| `sstim-v:persistenceUnknown` | sstim:ExperiencePersistence | vocab | persistence-unknown |
| `sstim-v:phenomenonAcousticStartleReflex` | sstim:NeuralPhenomenon | vocab | phenomenon-acoustic-startle-reflex |
| `sstim-v:phenomenonAuditorySteadyStateResponse` | sstim:NeuralPhenomenon | vocab | phenomenon-auditory-steady-state-response |
| `sstim-v:phenomenonAutonomicNeuralRegulation` | sstim:NeuralPhenomenon | vocab | phenomenon-autonomic-neural-regulation |
| `sstim-v:phenomenonConnectivityOrPlasticity` | sstim:NeuralPhenomenon | vocab | phenomenon-connectivity-or-plasticity |
| `sstim-v:phenomenonEvokedResponse` | sstim:NeuralPhenomenon | vocab | phenomenon-evoked-response |
| `sstim-v:phenomenonExcitabilityOrFiring` | sstim:NeuralPhenomenon | vocab | phenomenon-excitability-or-firing |
| `sstim-v:phenomenonFrequencyFollowingResponse` | sstim:NeuralPhenomenon | vocab | phenomenon-frequency-following-response |
| `sstim-v:phenomenonNeurochemicalSignaling` | sstim:NeuralPhenomenon | vocab | phenomenon-neurochemical-signaling |
| `sstim-v:phenomenonOscillatoryDynamics` | sstim:NeuralPhenomenon | vocab | phenomenon-oscillatory-dynamics |
| `sstim-v:phenomenonReflexResponse` | sstim:NeuralPhenomenon | vocab | phenomenon-reflex-response |
| `sstim-v:phenomenonSomatosensorySteadyStateResponse` | sstim:NeuralPhenomenon | vocab | phenomenon-somatosensory-steady-state-response |
| `sstim-v:phenomenonSynapticTransmission` | sstim:NeuralPhenomenon | vocab | phenomenon-synaptic-transmission |
| `sstim-v:phenomenonTemporalCoordination` | sstim:NeuralPhenomenon | vocab | phenomenon-temporal-coordination |
| `sstim-v:phenomenonVisualSteadyStateResponse` | sstim:NeuralPhenomenon | vocab | phenomenon-visual-steady-state-response |
| `sstim-v:relatednessDeclined` | sstim:PerceivedRelatedness | vocab | relatedness-declined |
| `sstim-v:relatednessPossiblyRelated` | sstim:PerceivedRelatedness | vocab | relatedness-possibly-related |
| `sstim-v:relatednessRelated` | sstim:PerceivedRelatedness | vocab | relatedness-related |
| `sstim-v:relatednessUnknown` | sstim:PerceivedRelatedness | vocab | relatedness-unknown |
| `sstim-v:relatednessUnrelated` | sstim:PerceivedRelatedness | vocab | relatedness-unrelated |
| `sstim-v:reportDuringSession` | sstim:SelfReportPhase | vocab | during |
| `sstim-v:reportFollowUp` | sstim:SelfReportPhase | vocab | follow-up |
| `sstim-v:reportImmediatePost` | sstim:SelfReportPhase | vocab | post |
| `sstim-v:reportPreSession` | sstim:SelfReportPhase | vocab | pre |
| `sstim-v:reproEquivalentPresentation` | sstim:ReproducibilityLevel | vocab | equivalent-presentation |
| `sstim-v:reproEquivalentSignal` | sstim:ReproducibilityLevel | vocab | equivalent-signal |
| `sstim-v:reproIdenticalRendering` | sstim:ReproducibilityLevel | vocab | identical-rendering |
| `sstim-v:resolutionImproved` | sstim:ExperienceResolution | vocab | resolution-improved |
| `sstim-v:resolutionResolved` | sstim:ExperienceResolution | vocab | resolution-resolved |
| `sstim-v:resolutionUnchanged` | sstim:ExperienceResolution | vocab | resolution-unchanged |
| `sstim-v:resolutionUnknown` | sstim:ExperienceResolution | vocab | resolution-unknown |
| `sstim-v:resolutionWorsened` | sstim:ExperienceResolution | vocab | resolution-worsened |
| `sstim-v:responseDeclined` | sstim:ResponseState | vocab | declined |
| `sstim-v:responseNoneReported` | sstim:ResponseState | vocab | none-reported |
| `sstim-v:responseNotApplicable` | sstim:ResponseState | vocab | not-applicable |
| `sstim-v:responseNotAsked` | sstim:ResponseState | vocab | not-asked |
| `sstim-v:responseSupplied` | sstim:ResponseState | vocab | supplied |
| `sstim-v:responseUnknown` | sstim:ResponseState | vocab | unknown |
| `sstim-v:reviewConfirm` | sstim:ReviewDecisionValue | vocab | confirm |
| `sstim-v:reviewNeedsUpdate` | sstim:ReviewStatus | vocab | needs-update |
| `sstim-v:reviewProvisional` | sstim:ReviewStatus | vocab | provisional |
| `sstim-v:reviewReject` | sstim:ReviewDecisionValue | vocab | reject |
| `sstim-v:reviewRequestRevision` | sstim:ReviewDecisionValue | vocab | request-revision |
| `sstim-v:reviewReviewed` | sstim:ReviewStatus | vocab | reviewed |
| `sstim-v:reviewerExternal` | sstim:ReviewerRelationship | vocab | external |
| `sstim-v:reviewerSameOrganization` | sstim:ReviewerRelationship | vocab | same-organization |
| `sstim-v:reviewerSelf` | sstim:ReviewerRelationship | vocab | self |
| `sstim-v:reviewerUnknownRelationship` | sstim:ReviewerRelationship | vocab | unknown-relationship |
| `sstim-v:roleFocus` | sstim:ObservationRole | vocab | focus |
| `sstim-v:roleGoalAchieved` | sstim:ObservationRole | vocab | goal-achieved |
| `sstim-v:rolePerceivedHelpfulness` | sstim:ObservationRole | vocab | perceived-helpfulness |
| `sstim-v:rolePrimaryAffect` | sstim:ObservationRole | vocab | primary-affect |
| `sstim-v:roleSleepiness` | sstim:ObservationRole | vocab | sleepiness |
| `sstim-v:roleStatedGoal` | sstim:ObservationRole | vocab | stated-goal |
| `sstim-v:roleSubjectiveQuality` | sstim:ObservationRole | vocab | subjective-quality |
| `sstim-v:roleUnwantedExperienceReport` | sstim:ObservationRole | vocab | unwanted-experience-report |
| `sstim-v:routeBiochemicalPharmacologicalNeuralInteraction` | sstim:SensoryTransductionBypassingAccessRoute | vocab | route-biochemical-pharmacological-neural-interaction |
| `sstim-v:routeBypassesCanonicalSensoryTransduction` | sstim:SensoryTransductionBypassingAccessRoute | vocab | route-bypasses-canonical-sensory-transduction |
| `sstim-v:routeCanonicalSensoryTransductionAfferent` | sstim:CanonicalSensoryTransductionAccessRoute | vocab | route-canonical-sensory-transduction-afferent |
| `sstim-v:routeIndirectNonSensoryPhysiologicalMediation` | sstim:SensoryTransductionBypassingAccessRoute | vocab | route-indirect-non-sensory-physiological-mediation |
| `sstim-v:routePhysicalNeuralInteraction` | sstim:SensoryTransductionBypassingAccessRoute | vocab | route-physical-neural-interaction |
| `sstim-v:scopeNotApplicable` | sstim:ScopeMarker | vocab | scope-not-applicable |
| `sstim-v:scopeNotReported` | sstim:ScopeMarker | vocab | scope-not-reported |
| `sstim-v:scopeUnknown` | sstim:ScopeMarker | vocab | scope-unknown |
| `sstim-v:severityDeclined` | sstim:ReportedSeverity | vocab | severity-declined |
| `sstim-v:severityMild` | sstim:ReportedSeverity | vocab | mild |
| `sstim-v:severityModerate` | sstim:ReportedSeverity | vocab | moderate |
| `sstim-v:severitySevere` | sstim:ReportedSeverity | vocab | severe |
| `sstim-v:severityUnknown` | sstim:ReportedSeverity | vocab | severity-unknown |
| `sstim-v:smr` | sstim:FrequencyBand | vocab | smr |
| `sstim-v:smrOscillation` | sstim:NeuralOscillationType | vocab | smr-oscillation |
| `sstim-v:synthesisLiteratureReview` | sstim:EvidenceSynthesisType | vocab | literature-review |
| `sstim-v:synthesisMetaAnalysis` | sstim:EvidenceSynthesisType | vocab | meta-analysis |
| `sstim-v:synthesisNarrativeReview` | sstim:EvidenceSynthesisType | vocab | narrative-review |
| `sstim-v:synthesisPrimaryStudy` | sstim:EvidenceSynthesisType | vocab | primary-study |
| `sstim-v:synthesisSystematicReview` | sstim:EvidenceSynthesisType | vocab | systematic-review |
| `sstim-v:synthesisTutorial` | sstim:EvidenceSynthesisType | vocab | tutorial |
| `sstim-v:systemAuditory` | sstim:NeuralSystem | vocab | system-auditory |
| `sstim-v:systemAutonomic` | sstim:NeuralSystem | vocab | system-autonomic |
| `sstim-v:systemGustatory` | sstim:NeuralSystem | vocab | system-gustatory |
| `sstim-v:systemInteroceptive` | sstim:NeuralSystem | vocab | system-interoceptive |
| `sstim-v:systemMotor` | sstim:NeuralSystem | vocab | system-motor |
| `sstim-v:systemOlfactory` | sstim:NeuralSystem | vocab | system-olfactory |
| `sstim-v:systemProprioceptive` | sstim:NeuralSystem | vocab | system-proprioceptive |
| `sstim-v:systemSensory` | sstim:NeuralSystem | vocab | system-sensory |
| `sstim-v:systemSomatosensory` | sstim:NeuralSystem | vocab | system-somatosensory |
| `sstim-v:systemVestibular` | sstim:NeuralSystem | vocab | system-vestibular |
| `sstim-v:systemVisual` | sstim:NeuralSystem | vocab | system-visual |
| `sstim-v:targetBrain` | sstim:NeuralTargetSite | vocab | target-brain |
| `sstim-v:targetCentralNervousSystem` | sstim:NeuralTargetSite | vocab | target-central-nervous-system |
| `sstim-v:targetCortex` | sstim:NeuralTargetSite | vocab | target-cortex |
| `sstim-v:targetCranialNerve` | sstim:NeuralTargetSite | vocab | target-cranial-nerve |
| `sstim-v:targetDeepBrainStructure` | sstim:NeuralTargetSite | vocab | target-deep-brain-structure |
| `sstim-v:targetPeripheralNerve` | sstim:NeuralTargetSite | vocab | target-peripheral-nerve |
| `sstim-v:targetPeripheralNervousSystem` | sstim:NeuralTargetSite | vocab | target-peripheral-nervous-system |
| `sstim-v:targetSpinalCord` | sstim:NeuralTargetSite | vocab | target-spinal-cord |
| `sstim-v:techASMR` | sstim:NonEntrainmentTechnique | vocab | asmr |
| `sstim-v:techAcousticStartle` | sstim:NonEntrainmentTechnique | vocab | acoustic-startle |
| `sstim-v:techAmplitudeModulation` | sstim:EntrainmentBasedTechnique | vocab | amplitude-modulation |
| `sstim-v:techAudioTactile` | sstim:EntrainmentBasedTechnique | vocab | audio-tactile |
| `sstim-v:techAudiovisualEntrainment` | sstim:EntrainmentBasedTechnique | vocab | audiovisual-entrainment |
| `sstim-v:techAuditoryIllusion` | sstim:NonEntrainmentTechnique | vocab | auditory-illusion |
| `sstim-v:techBinauralBeats` | sstim:EntrainmentBasedTechnique | vocab | binaural-beats |
| `sstim-v:techBiofeedback` | sstim:NeuromodulationTechnique | vocab | biofeedback |
| `sstim-v:techBroadbandNoise` | sstim:NonEntrainmentTechnique | vocab | broadband-noise |
| `sstim-v:techClickTrain` | sstim:EntrainmentBasedTechnique | vocab | click-train |
| `sstim-v:techClosedLoopAuditory` | sstim:EntrainmentBasedTechnique | vocab | closed-loop-auditory |
| `sstim-v:techColorFieldStimulation` | sstim:NonEntrainmentTechnique | vocab | color-field |
| `sstim-v:techDBS` | sstim:NeuromodulationTechnique, sstim:NeurostimulationTechnique | vocab | dbs |
| `sstim-v:techElectroconvulsiveTherapy` | sstim:NeuromodulationTechnique, sstim:NeurostimulationTechnique | vocab | electroconvulsive-therapy |
| `sstim-v:techFractalRhythm` | sstim:NonEntrainmentTechnique | vocab | fractal-rhythm |
| `sstim-v:techFrequencyModulation` | sstim:SensoryStimulationTechnique | vocab | frequency-modulation |
| `sstim-v:techGamma40Auditory` | sstim:EntrainmentBasedTechnique, sstim:NeuromodulationTechnique, sstim:NeurostimulationTechnique, sstim:SensoryNeurostimulationTechnique, sstim:SensoryRouteNeuromodulationTechnique | vocab | gamma-40-auditory |
| `sstim-v:techIntrathecalNeuromodulatoryAgentDelivery` | sstim:NeuromodulationTechnique | vocab | intrathecal-neuromodulatory-agent-delivery |
| `sstim-v:techIsochronicTones` | sstim:EntrainmentBasedTechnique | vocab | isochronic-tones |
| `sstim-v:techMonauralBeats` | sstim:EntrainmentBasedTechnique | vocab | monaural-beats |
| `sstim-v:techMusicStructural` | sstim:EntrainmentBasedTechnique | vocab | music-structural |
| `sstim-v:techNeurofeedback` | sstim:NeuromodulationTechnique | vocab | neurofeedback |
| `sstim-v:techNotchedSound` | sstim:NonEntrainmentTechnique | vocab | notched-sound |
| `sstim-v:techPhoticDriving` | sstim:EntrainmentBasedTechnique | vocab | photic-driving |
| `sstim-v:techReferencePitchRetuning` | sstim:NonEntrainmentTechnique | vocab | reference-pitch-retuning |
| `sstim-v:techRepetitiveTMS` | sstim:NeuromodulationTechnique, sstim:NeurostimulationTechnique | vocab | repetitive-tms |
| `sstim-v:techRhythmicAuditoryCueing` | sstim:EntrainmentBasedTechnique | vocab | rhythmic-auditory-cueing |
| `sstim-v:techRoughness` | sstim:NonEntrainmentTechnique | vocab | roughness |
| `sstim-v:techSolfeggioTuning` | sstim:NonEntrainmentTechnique | vocab | solfeggio-tuning |
| `sstim-v:techSonification` | sstim:NonEntrainmentTechnique | vocab | sonification |
| `sstim-v:techSpatialAuditory` | sstim:NonEntrainmentTechnique | vocab | spatial-auditory |
| `sstim-v:techSubliminalAudio` | sstim:NonEntrainmentTechnique | vocab | subliminal-audio |
| `sstim-v:techTACS` | sstim:NeuromodulationTechnique, sstim:NeurostimulationTechnique | vocab | tacs |
| `sstim-v:techTDCS` | sstim:NeuromodulationTechnique, sstim:NeurostimulationTechnique | vocab | tdcs |
| `sstim-v:techUltrasoundNeuromod` | sstim:NeuromodulationTechnique, sstim:NeurostimulationTechnique | vocab | ultrasound-neuromodulation |
| `sstim-v:techVagusNerveStimulation` | sstim:NeuromodulationTechnique, sstim:NeurostimulationTechnique | vocab | vagus-nerve-stimulation |
| `sstim-v:techVibroacoustic` | sstim:NonEntrainmentTechnique | vocab | vibroacoustic |
| `sstim-v:techVibrotactileEntrainment` | sstim:EntrainmentBasedTechnique | vocab | vibrotactile-entrainment |
| `sstim-v:techVoiceMantra` | sstim:NonEntrainmentTechnique | vocab | voice-mantra |
| `sstim-v:temporalAdaptive` | sstim:StimulusTemporalStructure | vocab | adaptive |
| `sstim-v:temporalAperiodic` | sstim:StimulusTemporalStructure | vocab | aperiodic |
| `sstim-v:temporalBolus` | sstim:StimulusTemporalStructure | vocab | temporal-bolus |
| `sstim-v:temporalContinuousInfusion` | sstim:StimulusTemporalStructure | vocab | temporal-continuous-infusion |
| `sstim-v:temporalContinuousTonic` | sstim:StimulusTemporalStructure | vocab | temporal-continuous-tonic |
| `sstim-v:temporalIntermittentScheduled` | sstim:StimulusTemporalStructure | vocab | temporal-intermittent-scheduled |
| `sstim-v:temporalPeriodic` | sstim:StimulusTemporalStructure | vocab | periodic |
| `sstim-v:temporalPulseTrainOrBurst` | sstim:StimulusTemporalStructure | vocab | temporal-pulse-train-or-burst |
| `sstim-v:temporalQuasiPeriodic` | sstim:StimulusTemporalStructure | vocab | quasi-periodic |
| `sstim-v:temporalSingleEvent` | sstim:StimulusTemporalStructure | vocab | temporal-single-event |
| `sstim-v:theta` | sstim:FrequencyBand | vocab | theta |
| `sstim-v:thetaOscillation` | sstim:NeuralOscillationType | vocab | theta-oscillation |
| `sstim-v:tierAnecdotal` | sstim:EvidenceTierValue | vocab | anecdotal |
| `sstim-v:tierEstablished` | sstim:EvidenceTierValue | vocab | established |
| `sstim-v:tierModerate` | sstim:EvidenceTierValue | vocab | moderate |
| `sstim-v:tierPreliminary` | sstim:EvidenceTierValue | vocab | preliminary |
| `sstim-v:tierSpeculative` | sstim:EvidenceTierValue | vocab | speculative |
| `sstim-v:tierStrong` | sstim:EvidenceTierValue | vocab | strong |
| `sstim-v:timingAudioHardwareClock` | sstim:TimingAuthority | vocab | audio-hardware |
| `sstim-v:timingMonotonicSubstitute` | sstim:TimingAuthority | vocab | monotonic-substitute |
| `sstim-v:voiceBinaural` | sstim:VoiceType | vocab | Binaural |
| `sstim-v:voiceMartigli` | sstim:VoiceType | vocab | Martigli |
| `sstim-v:voiceMartigliBinaural` | sstim:VoiceType | vocab | Martigli-Binaural |
| `sstim-v:voiceSymmetry` | sstim:VoiceType | vocab | Symmetry |
