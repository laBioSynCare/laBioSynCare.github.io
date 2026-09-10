// The Concern axis of the graph scope picker: cross-cutting subject views over
// the SSTIM term space, each one a readable slice of a graph that is 749 nodes
// in full.
//
// Extracted from OntologyGraph.svelte so the arrival chooser on /graph can
// offer the same entry points from the same definitions. Two copies would
// drift, and each `about` string is also the chooser's description of that
// entry point, so a drifted copy would describe a scope the picker no longer
// applies.
export const GRAPH_CONCERNS = [
    { value: 'frequency', label: 'Frequency bands',
      about: 'The frequency band vocabulary — delta through gamma, their sub-bands and single-frequency targets — with the FrequencyBand classes that govern them.' },
    { value: 'modality', label: 'Sensory modalities',
      about: 'Sensory modality concepts (auditory, visual, tactile and beyond) together with the perceived-modality vocabulary used by the exposure model.' },
    { value: 'mechanism', label: 'Stimulation mechanisms',
      about: 'The mechanisms by which a stimulus is thought to act — the StimulationMechanism class and its concept scheme.' },
    { value: 'technique', label: 'Techniques',
      about: 'Named stimulation techniques and the SensoryStimulationTechnique class they instantiate.' },
    { value: 'voice', label: 'Voice types & rhythm',
      about: 'The preset voice model: Binaural, Martigli, Martigli-Binaural and Symmetry voice types, permutation functions, and the temporal structure of a stimulus.' },
    { value: 'group', label: 'Preset groups',
      about: 'The five catalog groups — Heal, Support, Perform, Indulge, Transcend — and the PresetGroup class.' },
    { value: 'evidence', label: 'Evidence & claims',
      about: 'The evidence model: assessment claims, propositions and scope, evidence tiers and modality tags, bibliographic and public-safe references, claim and effect direction, review status.' },
    { value: 'caution', label: 'Cautions & safety',
      about: 'Caution tags and their severity levels — the vocabulary behind safety messaging and contraindication flags.' },
    { value: 'exposure', label: 'Exposure & delivery',
      about: 'How a stimulus reaches a person: delivery media, device capabilities, body placement, stimulus patterns, comfort boundaries, perceptual gains and losses, and experiment context.' },
    { value: 'stimulation', label: 'Stimulation · neutral layer',
      about: 'The modality-neutral stimulation layer — Stimulation, techniques, protocols and interventions — described without committing to a neural mechanism.' },
    { value: 'neuromodulation', label: 'Neuromodulation',
      about: 'A cross-cutting view (ADR 0034/0036): neuromodulation classes, neural access routes, delivery approaches, target sites, systems and phenomena, plus every concept that asserts one of those facets.' },
  ]
