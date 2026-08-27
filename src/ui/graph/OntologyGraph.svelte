<script>
  import { onMount, onDestroy, tick } from 'svelte'
  import { replaceState } from '$app/navigation'
  import { applicationAsset, applicationRoute } from '../../config/applicationUrls.js'
  import { buildGraphElements } from '../../rdf/graph.js'
  import { ONTOLOGY_MODULES, ONTOLOGY_PROFILES } from '../../rdf/loader.js'
  import { toCurie, PREFIXES } from '../../rdf/namespaces.js'
  import AnnotationPanel from '../annotation/AnnotationPanel.svelte'
  import { graphSession, saveGraphSession } from './graphSession.js'
  import {
    parseViewParams, formatZoomParam, pulseSchedule,
    MIN_ZOOM, MAX_ZOOM, FOCUS_PARAM_VALUE,
  } from './deepLink.js'
  import { isVisualStimulationOn, prefersReducedMotion } from '../safety/visualSafety.js'
  import LoadingPanel from '../loading/LoadingPanel.svelte'
  import { yieldToScheduler, yieldToPaint } from '../loading/renderYield.js'
  import { graphNavigation, resetGraphNavigation } from '../navigation/graphNavigation.js'
  import InfoModal from '../navigation/InfoModal.svelte'
  import { activeSkin } from '../theme/skins.js'
  import { studioAffordanceForIri } from '../creator/semantic.js'

  const { store, liveStatus = null, onRefreshLive = null } = $props()

  let container = $state(null)
  let cy = $state(null)
  let error = $state(null)
  let loading = $state(true)

  // What the loader says while the main thread is busy. `loadStep` is null
  // whenever the current phase is one atomic block with no honest fraction to
  // report — the loader shows perpetual motion then rather than a stalled bar.
  let loadPhase = $state('project')   // 'project' | 'layout'
  let loadStep = $state(null)         // { label, step, total } | null
  let graphStats = $state(null)
  let allElements = $state([])

  const loadDetail = $derived.by(() => {
    if (loadPhase === 'layout') {
      const nodes = allElements.filter((element) => !element.data?.source).length
      return nodes
        ? `${nodes.toLocaleString()} nodes · one force layout, and it cannot be interrupted`
        : 'One force layout, and it cannot be interrupted'
    }
    if (!loadStep) return `${store.size.toLocaleString()} quads`
    return `${loadStep.label} · ${loadStep.step} of ${loadStep.total}`
  })

  // Completed stages, not the one in flight — a bar that jumps to full while the
  // last stage is still running is the same lie as one parked at 100%.
  const loadProgress = $derived(loadStep ? (loadStep.step - 1) / loadStep.total : null)

  // The node-type legend is generated from this list so the swatch, the count,
  // the visibility checkbox and the spotlight target can never drift apart from
  // the styles in styleSheet(). Declared here because the scope axes below read
  // it when parsing filters out of the URL.
  const NODE_KINDS = [
    { kind: 'owlClass',              label: 'OWL class' },
    { kind: 'skosConcept',           label: 'SKOS concept' },
    { kind: 'xsdType',               label: 'XSD datatype' },
    { kind: 'ontologyResource',      label: 'Ontology resource' },
    { kind: 'catalogFramework',      label: 'Catalog framework' },
    { kind: 'catalogImplementation', label: 'Catalog implementation' },
    { kind: 'catalogTechnique',      label: 'Catalog technique' },
    { kind: 'catalogPreset',         label: 'Catalog preset' },
    { kind: 'catalogReference',      label: 'Catalog reference' },
    { kind: 'ecosystemPerson',       label: 'Live person' },
    { kind: 'ecosystemOrganization', label: 'Live organization' },
    { kind: 'ecosystemTarget',       label: 'Live target' },
  ]

  // ── Scope axes ─────────────────────────────────────────────────────────────
  // Every filter below is a perspective on the one SSTIM knowledge graph — a
  // view over the same underlying triples, never a separate dataset.
  //
  // These were one flat list of 18 entries, which silently served three
  // different questions: which provenance layer, which owning module, which
  // concern. That made "Core OWL classes", "Ecosystem focus · live" and
  // "Frequency bands" read as mutually exclusive alternatives when they answer
  // different things entirely. They are separate axes now. A selection **unions
  // within an axis and intersects across axes**, so Terms + evidence module +
  // Cautions concern means "term-layer nodes that the evidence module owns and
  // that the caution concern covers".
  //
  // The `about` text is surfaced in the scope guide (the ⓘ beside the picker)
  // so each axis is discoverable without reading the ADRs.

  const GRAPH_LAYERS = [
    { value: 'terms', label: 'Terms', layers: ['ontology', 'vocabulary'],
      about: 'The released term space: every OWL class and SKOS concept of the SSTIM ontology and vocabulary. This is the default on its own so that published terms — not example data — define the shape of the graph.' },
    { value: 'catalog', label: 'Catalog · versioned', layers: ['catalog'],
      about: 'Versioned public reference instances — frameworks, implementations and their components, techniques, presets, and evidence records. Citable and frozen per release.' },
    { value: 'ecosystem', label: 'Stakeholders · live', layers: ['ecosystem'],
      about: 'The live stakeholder network: people, organizations and reviewed relationships. Fetched at runtime, separately approved and sourced per record, retractable, and deliberately excluded from citable releases.' },
  ]

  const GRAPH_CONCERNS = [
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

  // The module axis is generated from the ADR 0043 manifest, never hand-listed.
  // The manifest is the one bill of materials — the loader already derives its
  // sources from it and navigator-contract.test.mjs holds both to it — so the
  // picker cannot drift from the modules the app actually loads. The module id
  // is shown rather than the long title because the id is the stable
  // identifier profiles use in `dct:requires`.
  const GRAPH_MODULES = ONTOLOGY_MODULES.map((module) => ({
    value: module.id,
    label: module.id,
    requires: module.requires,
    roles: module.roles,
    about: module.title,
  }))
  const MODULE_REQUIRES = new Map(ONTOLOGY_MODULES.map((m) => [m.id, m.requires]))
  const DRAWABLE_MODULES = new Set(ONTOLOGY_MODULES.map((m) => m.id))

  // Profile shortcuts select a whole conformance closure at once. Full is
  // represented as *no* module constraint rather than as all sixteen ids
  // selected: the navigator loads exactly the Full profile, so an empty module
  // axis and a full one are the same graph, and the empty one stays honest if
  // the profile grows. Closures are intersected with what the navigator draws
  // — Core's `core-shapes` is a validation artifact with no drawable terms.
  const GRAPH_PROFILES = ONTOLOGY_PROFILES.map((profile) => ({
    value: profile.id,
    label: profile.title.replace(/^SSTIM /, '').replace(/ Profile$/, ''),
    modules: profile.modules.filter((id) => DRAWABLE_MODULES.has(id)),
  }))

  // Legacy `?view=` tokens are published deep-link targets (w3id.org routes
  // resolve into this page), so every one of the original 18 keeps working.
  // Layer and term-kind scopes translate onto their new axis; the rest are
  // concern tokens and need no mapping.
  const LEGACY_VIEW_TOKENS = {
    all:                 { layers: ['terms'] },
    'catalog-ecosystem': { layers: ['catalog', 'ecosystem'] },
    catalog:             { layers: ['catalog'] },
    ecosystem:           { layers: ['ecosystem'] },
    core:                { layers: ['terms'], hiddenKinds: ['skosConcept', 'ontologyResource'] },
    vocabulary:          { layers: ['terms'], hiddenKinds: ['owlClass', 'xsdType', 'ontologyResource'] },
  }

  function readListParam(params, name, valid) {
    const raw = params.get(name)
    if (raw === null) return null
    const values = raw.split(',').map((v) => v.trim()).filter((v) => valid.has(v))
    return values.length ? values : null
  }

  // A `?layer=`/`?module=`/`?view=`/`?hide=` query string lets a link land
  // directly on a filtered perspective. It takes priority over the saved
  // session; anything unrecognized is dropped rather than failing the load.
  function readFiltersFromUrl() {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    const concernValues = new Set(GRAPH_CONCERNS.map((c) => c.value))
    const kindValues = new Set(NODE_KINDS.map((k) => k.kind))
    const found = {}

    const rawView = params.get('view')
    if (rawView) {
      const tokens = rawView.split(',').map((v) => v.trim()).filter(Boolean)
      const concerns = tokens.filter((t) => concernValues.has(t))
      if (concerns.length) found.concernFilters = concerns
      for (const token of tokens) {
        const legacy = LEGACY_VIEW_TOKENS[token]
        if (!legacy) continue
        found.layerFilters = [...new Set([...(found.layerFilters ?? []), ...legacy.layers])]
        if (legacy.hiddenKinds) found.hiddenKinds = legacy.hiddenKinds
      }
    }

    const layers = readListParam(params, 'layer', new Set(GRAPH_LAYERS.map((l) => l.value)))
    if (layers) found.layerFilters = layers
    const modules = readListParam(params, 'module', DRAWABLE_MODULES)
    if (modules) found.moduleFilters = modules
    const hidden = readListParam(params, 'hide', kindValues)
    if (hidden) found.hiddenKinds = hidden

    return Object.keys(found).length ? found : null
  }

  const urlFilters = readFiltersFromUrl()
  const initialFilters = urlFilters ?? {}

  // The framing half of the deep link — `?zoom=` and `?focus=neighborhood` —
  // parsed by deepLink.js, which owns that contract and its tests.
  const urlView = parseViewParams(typeof window === 'undefined' ? '' : window.location.search)
  const initialUrlHash = typeof window === 'undefined' ? '' : window.location.hash

  // Each axis is a Set. Within an axis the members union; across axes they
  // intersect. An empty module/concern/hiddenKinds axis imposes no constraint;
  // the layer axis always constrains, and defaults to the term space alone.
  let layerFilters = $state(new Set(
    initialFilters.layerFilters ?? graphSession.layerFilters ?? ['terms']))
  let moduleFilters = $state(new Set(
    initialFilters.moduleFilters ?? graphSession.moduleFilters ?? []))
  let concernFilters = $state(new Set(
    initialFilters.concernFilters ?? graphSession.concernFilters ?? []))
  let hiddenKinds = $state(new Set(
    initialFilters.hiddenKinds ?? graphSession.hiddenKinds ?? []))
  let includeModuleDependencies = $state(graphSession.includeModuleDependencies ?? true)

  // Nodes the reader has set aside by hand. Session-only and never written to
  // the URL — see graphSession.js.
  let hiddenNodes = $state(new Set(graphSession.hiddenNodes ?? []))

  let focusNodeQuery = $state(graphSession.focusNodeQuery)

  // Layer visibility
  let showSubClassOf  = $state(graphSession.showSubClassOf)
  let showObjProp     = $state(graphSession.showObjProp)
  let showDataProp    = $state(graphSession.showDataProp)
  let showNarrower    = $state(graphSession.showNarrower)
  let showRelated     = $state(graphSession.showRelated)
  let showInstanceOf  = $state(graphSession.showInstanceOf)
  let showCatalogRelation = $state(graphSession.showCatalogRelation ?? true)
  let showEcosystemRelationship = $state(graphSession.showEcosystemRelationship ?? true)

  // Detail panel
  let selected = $state(null)
  let neighbors = $state([])
  let iriCopied = $state(false)
  let iriCopyTimer = null
  // A deep link is authoritative about its own framing: arriving on `#node`
  // without `?focus=` must show the whole graph even if this session had left
  // focus on, or a shared link would open into a view its sender never saw.
  let neighborhoodFocus = $state(
    urlView.neighborhoodFocus || (!initialUrlHash && graphSession.neighborhoodFocus))
  let connectionFilters = $state(new Set(graphSession.connectionFilters))

  // How to place nodes disconnected from the main cluster:
  //   'all'        — grid every node outside the largest connected component
  //   'singletons' — grid only degree-0 nodes; keep multi-node islands in cose
  let strayMode = $state(graphSession.strayMode ?? 'all')

  let visibleSet = new Set()

  const TRANSITION_KEY = 'bsclab.graph.transitionMs'
  const TRANSITION_DEFAULT = 320
  const TRANSITION_EASING = 'ease-in-out-cubic'

  function loadTransitionMs() {
    if (typeof localStorage === 'undefined') return TRANSITION_DEFAULT
    const raw = localStorage.getItem(TRANSITION_KEY)
    if (raw == null) return TRANSITION_DEFAULT
    const n = Number(raw)
    if (!Number.isFinite(n) || n < 0 || n > 2000) return TRANSITION_DEFAULT
    return n
  }

  let transitionMs = $state(loadTransitionMs())

  $effect(() => {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(TRANSITION_KEY, String(transitionMs))
  })

  const KIND_LABELS = {
    owlClass: 'OWL class',
    skosConcept: 'SKOS concept',
    xsdType: 'XSD datatype',
    ontologyResource: 'Ontology resource',
    catalogFramework: 'Framework · versioned catalog',
    catalogImplementation: 'Implementation · versioned catalog',
    catalogTechnique: 'Technique · versioned catalog',
    catalogPreset: 'Preset · versioned catalog',
    catalogReference: 'Reference · versioned catalog',
    ecosystemPerson: 'Person · live stakeholder network',
    ecosystemOrganization: 'Organization · live stakeholder network',
    ecosystemTarget: 'Target · live stakeholder relationship',
    objProp: 'Object property',
    dataProp: 'Datatype property',
  }

  // SKOS annotation properties worth showing under the definition, in the
  // order a reader wants them: what it covers, then an example, then the
  // curation trail. Rendered only when the term actually carries the property.
  const ANNOTATION_NOTES = [
    { key: 'scopeNote', label: 'Scope', hint: 'skos:scopeNote — how the term is meant to be applied' },
    { key: 'example', label: 'Example', hint: 'skos:example' },
    { key: 'note', label: 'Note', hint: 'skos:note' },
    { key: 'editorialNote', label: 'Editorial note', hint: 'skos:editorialNote — curation guidance' },
    { key: 'historyNote', label: 'History', hint: 'skos:historyNote — how the term changed across releases' },
  ]

  const EDGE_KIND_LABELS = {
    subClassOf: 'subClassOf',
    objProp: 'object property',
    dataProp: 'data property',
    narrower: 'narrower',
    related: 'related',
    instanceOf: 'type',
    catalogRelation: 'catalog relation',
    ecosystemRelationship: 'stakeholder relationship',
  }

  const COLORS = {
    owlClass:    '#4fc3f7',
    skosConcept: '#81c784',
    xsdType:     '#ffb74d',
    subClassOf:  '#4fc3f7',
    objProp:     '#ce93d8',
    dataProp:    '#ffb74d',
    narrower:    '#81c784',
    related:     '#f48fb1',
    instanceOf:  '#aaaaaa',
    ontologyResource: '#29b6f6',
    catalogFramework: '#ffd54f',
    catalogImplementation: '#ffb74d',
    catalogTechnique: '#ffe082',
    catalogPreset: '#ff8a65',
    catalogReference: '#b39ddb',
    ecosystemPerson: '#80cbc4',
    ecosystemOrganization: '#4db6ac',
    ecosystemTarget: '#90a4ae',
    catalogRelation: '#ffca28',
    ecosystemRelationship: '#26a69a',
  }

  const SCHEME_COLORS = {
    'https://w3id.org/sstim/vocab#FrequencyBandScheme':       '#4db6ac',
    'https://w3id.org/sstim/vocab#PresetGroupScheme':         '#ff8a65',
    'https://w3id.org/sstim/vocab#EvidenceTierScheme':        '#9575cd',
    'https://w3id.org/sstim/vocab#EvidenceModalityScheme':    '#f06292',
    'https://w3id.org/sstim/vocab#VoiceTypeScheme':           '#4dd0e1',
    'https://w3id.org/sstim/vocab#SensoryModalityScheme':     '#aed581',
    'https://w3id.org/sstim/vocab#StimulationMechanismScheme':'#ffd54f',
    'https://w3id.org/sstim/vocab#PermutationFunctionScheme': '#a1887f',
    'https://w3id.org/sstim/vocab#CautionTagScheme':          '#ef9a9a',
  }

  // Clicking a legend row spotlights that node type (or concept scheme):
  // matching nodes keep full strength, everything else recedes. null = off.
  let typeHighlight = $state(null)   // { mode: 'kind' | 'scheme', value }
  let sourceGuideOpen = $state(false)

  // Concern → the concept schemes it shows. graph.js renders every
  // skos:Concept in the store (vocab + exposure) tagged with its scheme IRI,
  // so filtering by scheme gives per-domain views.
  //
  // These stay scheme-based rather than module-based even though the module
  // axis now exists: `sstim-vocab.ttl` is still the single ADR 0043 §4
  // compatibility aggregate holding 239 of the 445 concepts, so "module =
  // common" draws nine classes and no vocabulary at all. Until concern-specific
  // vocabulary distributions are extracted, scheme membership is the only thing
  // that can slice the controlled terms.
  const V_SCHEME = 'https://w3id.org/sstim/vocab#'
  const EX_SCHEME = 'https://w3id.org/sstim/exposure#'
  const SCOPE_SCHEMES = {
    frequency: [V_SCHEME + 'FrequencyBandScheme'],
    modality:  [V_SCHEME + 'SensoryModalityScheme', EX_SCHEME + 'PerceivedModalityScheme'],
    mechanism: [V_SCHEME + 'StimulationMechanismScheme'],
    technique: [V_SCHEME + 'TechniqueScheme'],
    voice:     [V_SCHEME + 'VoiceTypeScheme', V_SCHEME + 'PermutationFunctionScheme', V_SCHEME + 'StimulusTemporalStructureScheme'],
    group:     [V_SCHEME + 'PresetGroupScheme'],
    evidence:  [V_SCHEME + 'EvidenceTierScheme', V_SCHEME + 'EvidenceModalityScheme', V_SCHEME + 'PublicClaimLevelScheme', V_SCHEME + 'ClaimDirectionScheme', V_SCHEME + 'ReviewStatusScheme', V_SCHEME + 'EffectDirectionScheme'],
    caution:   [V_SCHEME + 'CautionTagScheme', V_SCHEME + 'CautionSeverityScheme'],
    neuromodulation: [V_SCHEME + 'NeuralAccessRouteScheme', V_SCHEME + 'StimulationDeliveryApproachScheme',
      V_SCHEME + 'NeuralTargetSiteScheme', V_SCHEME + 'NeuralSystemScheme',
      V_SCHEME + 'NeuralPhenomenonScheme'],
    stimulation: [V_SCHEME + 'TechniqueScheme', V_SCHEME + 'StimulusTemporalStructureScheme',
      EX_SCHEME + 'DeliveryMediumScheme'],
    exposure:  [EX_SCHEME + 'DeliveryMediumScheme', EX_SCHEME + 'PerceivedModalityScheme', EX_SCHEME + 'DeviceCapabilityScheme', EX_SCHEME + 'BodyPlacementScheme', EX_SCHEME + 'StimulusPatternScheme', EX_SCHEME + 'ComfortBoundaryScheme', EX_SCHEME + 'AudioNoiseColorScheme', EX_SCHEME + 'VisualNoiseScheme', EX_SCHEME + 'PerceptualGainScheme', EX_SCHEME + 'PerceptualLossScheme', EX_SCHEME + 'EffectDimensionScheme', EX_SCHEME + 'ExperimentContextScheme', EX_SCHEME + 'KnowledgeStatusScheme'],
  }
  // Facet-value scoping (ADR 0034 §11). A neuromodulation perspective is
  // cross-cutting — classes, schemes, AND every concept carrying one of these
  // predicates — which whole-scheme and class-local-name matching cannot
  // express. Rather than distorting the RDF with a navigator-only
  // skos:Collection, the matcher reads facets collected in src/rdf/graph.js.
  // Listing a predicate here includes any node that asserts it.
  const SCOPE_FACETS = {
    neuromodulation: [
      'neuralAccessRoute', 'stimulationDeliveryApproach', 'intendedNeuralTargetSite',
      'intendedNeuralSystem', 'intendedNeuralPhenomenon',
      'mechanismNeuralAccessRoute', 'mechanismNeuralTargetSite',
      'mechanismNeuralSystem', 'mechanismNeuralPhenomenon',
      'outcomeNeuralAccessRoute', 'outcomeNeuralTargetSite',
      'outcomeNeuralSystem', 'outcomeNeuralPhenomenon',
    ],
    stimulation: ['characteristicDeliveryMedium'],
  }

  // Governing OWL classes to also include in a scope, for structural context.
  const SCOPE_CLASSES = {
    frequency: ['FrequencyBand', 'FrequencyBandGroup'],
    evidence:  ['EvidenceClaim', 'EvidenceAssessmentClaim', 'AssessmentProposition', 'AssessmentScope', 'EvidenceBasis', 'EvidenceOutcomeConcept', 'BibliographicReference', 'EvidenceTierValue', 'EvidenceModalityTag', 'PublicSafeReference', 'PublicClaimLevel'],
    voice:     ['Preset', 'Voice', 'BinauralVoice', 'MartigliVoice', 'MartigliBinauralVoice', 'SymmetryVoice', 'VoiceType'],
    caution:   ['CautionTag', 'CautionSeverity'],
    technique: ['SensoryStimulationTechnique'],
    group:     ['PresetGroup'],
    modality:  ['SensoryModality'],
    mechanism: ['StimulationMechanism'],
    stimulation: [
      'Stimulation', 'StimulationTechnique', 'StimulationProtocol',
      'StimulationIntervention', 'SensoryStimulation', 'SensoryStimulationTechnique',
      'SensoryStimulationProtocol', 'SensoryStimulationIntervention',
    ],
    neuromodulation: [
      'Neuromodulation', 'NeuromodulationTechnique', 'NeuromodulationProtocol',
      'NeuromodulationIntervention', 'SensoryRouteNeuromodulation',
      'SensoryRouteNeuromodulationTechnique', 'SensoryRouteNeuromodulationProtocol',
      'SensoryRouteNeuromodulationIntervention', 'Stimulation', 'SensoryStimulation',
      'NeuralAccessRoute', 'CanonicalSensoryTransductionAccessRoute',
      'SensoryTransductionBypassingAccessRoute', 'StimulationDeliveryApproach',
      'NeuralTargetSite', 'NeuralSystem', 'NeuralPhenomenon',
    ],
  }

  // Mirrors src/rdf/graph.js: take the last non-empty segment so a
  // namespace-root IRI (…/framework/bsc/) does not render as an empty label.
  function localName(iri) {
    const parts = iri?.split(/[#/]/).filter(Boolean) ?? []
    return parts[parts.length - 1] ?? ''
  }

  function liveStatusLabel(state) {
    return {
      available: 'available',
      empty: 'empty',
      unavailable: 'unavailable',
      loading: 'refreshing',
      disabled: 'disabled',
    }[state] ?? 'unknown'
  }

  const SOURCE_NOTES = {
    ontology:
      'Versioned OWL term modules and the multilingual SKOS vocabulary, ' +
      'released and citable under w3id.org/sstim.',
    catalog:
      'Versioned public reference instances of frameworks, ' +
      'implementations and components, presets, and evidence records.',
    ecosystem:
      'Live stakeholder network of people, organizations, and reviewed relationships. ' +
      'Fetched at runtime, separately approved and sourced per record, ' +
      'retractable, and excluded from citable releases. This is one relationship ' +
      'layer, not the complete SSTIM ecosystem directory.',
  }

  function nodeColor(data) {
    if (data.kind === 'owlClass')    return COLORS.owlClass
    if (data.kind === 'xsdType')     return COLORS.xsdType
    if (data.kind === 'skosConcept') return SCHEME_COLORS[data.scheme] ?? COLORS.skosConcept
    if (COLORS[data.kind])            return COLORS[data.kind]
    return '#888'
  }

  // The node palette is fixed (it encodes term kind, not skin), but the
  // chrome around it — selection ring, edge labels, node outlines — has to
  // track the active skin. Hardcoded light-on-dark values disappear on the
  // paper/daylight skins, so resolve the real tokens from the container.
  function themeTokens() {
    const fallback = {
      accent: '#3b9eff', canvas: '#0b0b0c', text: '#d7e1ec',
      muted: '#8292a7', font: 'Inter, system-ui, sans-serif', dark: true,
    }
    if (typeof window === 'undefined' || !container) return fallback
    const cs = getComputedStyle(container)
    const read = (name, fb) => cs.getPropertyValue(name).trim() || fb
    const canvas = read('--app-canvas', fallback.canvas)
    const dark = isDarkColor(canvas)
    return {
      accent: read('--app-accent', fallback.accent),
      canvas,
      text: read('--app-text-strong', fallback.text),
      muted: read('--app-muted', fallback.muted),
      font: read('--app-font-ui', fallback.font),
      dark,
      // Neutral grey for the type/instanceOf layer, inverted per skin so it
      // reads against the canvas rather than dissolving into it.
      instanceOf: dark ? '#aaaaaa' : '#7f7f7f',
    }
  }

  // Relative luminance of a #rgb/#rrggbb token; drives whether outlines and
  // label halos are drawn light-on-dark or dark-on-light.
  function isDarkColor(value) {
    const hex = value.replace('#', '')
    const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex
    if (full.length < 6) return true
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.5
  }

  function styleSheet() {
    const theme = themeTokens()
    return [
      {
        selector: 'node',
        style: {
          'label': 'data(label)',
          'font-family': theme.font,
          'font-size': 11,
          'text-valign': 'center',
          'text-halign': 'center',
          'text-wrap': 'wrap',
          'text-max-width': 90,
          'width': (ele) => Math.min(110, Math.max(38, (ele.data('label')?.length ?? 0) * 5.5)),
          'height': (ele) => (ele.data('label')?.length ?? 0) > 18 ? 34 : 22,
          'padding': 8,
          'shape': 'round-rectangle',
          'background-color': (ele) => nodeColor(ele.data()),
          'border-width': 1.5,
          'border-color': theme.dark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(23, 19, 13, 0.22)',
          'color': '#111',
          'font-weight': 500,
          'transition-property': 'border-color, border-width, opacity, overlay-opacity, overlay-padding',
          'transition-duration': '120ms',
        }
      },
      {
        selector: 'node[kind="owlClass"]',
        style: { shape: 'round-rectangle', 'font-weight': 700 }
      },
      {
        selector: 'node[kind="xsdType"]',
        style: { shape: 'diamond', 'font-size': 10, 'font-style': 'italic' }
      },
      {
        selector: 'node[kind="skosConcept"]',
        style: { shape: 'ellipse' }
      },
      {
        selector: 'node[kind="ontologyResource"]',
        style: { shape: 'tag', 'font-weight': 700 }
      },
      {
        selector: 'node[kind="catalogFramework"]',
        style: { shape: 'hexagon', 'font-weight': 700, 'border-width': 2 }
      },
      {
        selector: 'node[kind="catalogImplementation"]',
        style: { shape: 'round-rectangle', 'font-weight': 700, 'border-width': 2 }
      },
      {
        selector: 'node[kind="catalogTechnique"]',
        style: { shape: 'round-hexagon' }
      },
      {
        selector: 'node[kind="catalogPreset"]',
        style: { shape: 'round-tag', 'font-weight': 700 }
      },
      {
        selector: 'node[kind="catalogReference"]',
        style: { shape: 'round-diamond' }
      },
      {
        selector: 'node[kind="ecosystemPerson"]',
        style: { shape: 'ellipse', 'font-weight': 700, 'border-width': 2 }
      },
      {
        selector: 'node[kind="ecosystemOrganization"]',
        style: { shape: 'barrel', 'font-weight': 700, 'border-width': 2 }
      },
      {
        selector: 'node:selected',
        style: {
          'border-width': 3.5,
          'border-color': theme.accent,
          'z-index': 999,
        }
      },
      // Arrival beacon for a deep link. A selection ring alone is easy to miss
      // in a few hundred nodes, so the node the link names blinks a halo a few
      // times on landing (see pulseElement). The halo grows *outside* the node
      // rather than only thickening its border, which is what makes it findable
      // without knowing where to look.
      {
        selector: 'node.link-pulse',
        style: {
          'border-width': 6,
          'border-color': theme.accent,
          'overlay-color': theme.accent,
          'overlay-opacity': 0.38,
          'overlay-padding': 16,
          'z-index': 1000,
        }
      },
      {
        selector: 'edge.link-pulse',
        style: {
          'width': 6,
          'opacity': 1,
          'overlay-color': theme.accent,
          'overlay-opacity': 0.3,
          'overlay-padding': 8,
          'z-index': 1000,
        }
      },
      // Hover affordance — cytoscape has no :hover selector, so the class is
      // toggled from mouseover/mouseout handlers in onMount.
      {
        selector: 'node.hovered',
        style: {
          'border-width': 3,
          'border-color': theme.accent,
          'z-index': 900,
        }
      },
      {
        selector: 'edge.hovered',
        style: { 'width': 3, 'opacity': 1, 'z-index': 900 }
      },
      // Legend spotlight (see applyTypeHighlight). Dimmed elements stay on
      // screen — the point is to locate a type within its context, not to
      // filter the graph, which the scope picker already does.
      {
        selector: '.type-dim',
        style: { 'opacity': 0.07, 'text-opacity': 0.07 }
      },
      {
        selector: 'node.type-hit',
        style: {
          'border-width': 3,
          'border-color': theme.accent,
          'z-index': 850,
        }
      },
      {
        selector: 'edge:selected',
        style: { 'width': 4, 'opacity': 1, 'z-index': 999 }
      },
      {
        selector: 'edge',
        style: {
          'width': 1.5,
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'label': '',
          'font-family': theme.font,
          'font-size': 9,
          'color': theme.muted,
          // A halo in the canvas colour keeps property labels readable where
          // they cross edges or sit over a dense cluster.
          'text-background-color': theme.canvas,
          'text-background-opacity': 0.82,
          'text-background-shape': 'roundrectangle',
          'text-background-padding': 2,
          'text-rotation': 'autorotate',
          'text-margin-y': -8,
          'opacity': 0.8,
          'transition-property': 'width, opacity, overlay-opacity, overlay-padding',
          'transition-duration': '120ms',
        }
      },
      {
        selector: 'edge[kind="subClassOf"]',
        style: { 'line-color': COLORS.subClassOf, 'target-arrow-color': COLORS.subClassOf, 'width': 2 }
      },
      {
        selector: 'edge[kind="objProp"]',
        style: { 'line-color': COLORS.objProp, 'target-arrow-color': COLORS.objProp, 'label': 'data(label)', 'line-style': 'dashed' }
      },
      {
        selector: 'edge[kind="dataProp"]',
        style: { 'line-color': COLORS.dataProp, 'target-arrow-color': COLORS.dataProp, 'label': 'data(label)', 'line-style': 'dotted' }
      },
      {
        selector: 'edge[kind="narrower"]',
        style: { 'line-color': COLORS.narrower, 'target-arrow-color': COLORS.narrower }
      },
      {
        selector: 'edge[kind="related"]',
        style: { 'line-color': COLORS.related, 'target-arrow-color': COLORS.related, 'line-style': 'dashed', 'target-arrow-shape': 'none' }
      },
      {
        // instanceOf is the densest layer (typically ~70% of all edges), so it
        // stays dotted and thin to keep subClassOf/narrower readable through
        // it — but it is a real semantic relation and must be legible. The
        // neutral grey has to follow the skin: one fixed grey is either
        // invisible on the light canvas or glaring on the dark one.
        selector: 'edge[kind="instanceOf"]',
        style: {
          'line-color': theme.instanceOf,
          'target-arrow-color': theme.instanceOf,
          'line-style': 'dotted',
          'width': 1.4,
          'opacity': 0.75,
        }
      },
      {
        selector: 'edge[kind="catalogRelation"]',
        style: { 'line-color': COLORS.catalogRelation, 'target-arrow-color': COLORS.catalogRelation, 'label': 'data(label)', 'line-style': 'dashed', 'width': 2 }
      },
      {
        selector: 'edge[kind="ecosystemRelationship"]',
        style: { 'line-color': COLORS.ecosystemRelationship, 'target-arrow-color': COLORS.ecosystemRelationship, 'label': 'data(label)', 'width': 2.5, 'opacity': 0.95 }
      },
    ]
  }

  // The selected modules plus, when the closure toggle is on, everything they
  // transitively require. Selecting `evidence` alone draws a graph whose ranges
  // dangle into modules that are not there; its ADR 0043 closure is the unit
  // that actually stands up on its own.
  const activeModuleClosure = $derived.by(() => {
    if (!moduleFilters.size) return null
    const closure = new Set(moduleFilters)
    if (!includeModuleDependencies) return closure
    const queue = [...moduleFilters]
    while (queue.length) {
      for (const required of MODULE_REQUIRES.get(queue.pop()) ?? []) {
        if (closure.has(required) || !DRAWABLE_MODULES.has(required)) continue
        closure.add(required)
        queue.push(required)
      }
    }
    return closure
  })

  const activeLayers = $derived(new Set(
    GRAPH_LAYERS.filter((l) => layerFilters.has(l.value)).flatMap((l) => l.layers),
  ))

  function concernMatches(concern, data) {
    const schemes = SCOPE_SCHEMES[concern]
    const classes = SCOPE_CLASSES[concern]
    const facets  = SCOPE_FACETS[concern]
    if (schemes && data.kind === 'skosConcept' && schemes.includes(data.scheme)) return true
    if (classes && classes.includes(localName(data.iri))) return true
    // A node qualifies by asserting any of the concern's facet predicates.
    // This is what lets a perspective span classes, schemes, and tagged
    // concepts at once.
    if (facets && data.facets && facets.some((p) => data.facets[p]?.length)) return true
    return false
  }

  // The module, concern and node-type axes. Split out from the layer axis
  // because context expansion (below) crosses layers deliberately but must
  // still respect the axes the reader set.
  function termAxesVisible(data) {
    if (hiddenKinds.has(data.kind)) return false
    // A node with no owning module — an XSD datatype, a catalog record, a live
    // person — is not something the module axis can speak about, so it passes
    // through rather than vanishing. Which of those appear is the layer axis's
    // job.
    if (activeModuleClosure && data.module && !activeModuleClosure.has(data.module)) return false
    if (concernFilters.size && ![...concernFilters].some((c) => concernMatches(c, data))) return false
    return true
  }

  function graphScopeNodeVisible(data) {
    if (!data) return false
    if (hiddenNodes.has(data.id)) return false
    if (!activeLayers.has(data.layer)) return false
    return termAxesVisible(data)
  }

  function edgeLayerVisible(kind) {
    const rules = {
      subClassOf:  showSubClassOf,
      objProp:     showObjProp,
      dataProp:    showDataProp,
      narrower:    showNarrower,
      related:     showRelated,
      instanceOf:  showInstanceOf,
      catalogRelation: showCatalogRelation,
      ecosystemRelationship: showEcosystemRelationship,
    }
    return rules[kind] ?? true
  }

  function visibleElementsForCurrentView() {
    let visibleNodeIds = new Set(
      allElements
        .filter((element) => !element.data?.source && graphScopeNodeVisible(element.data))
        .filter((element) => element.data?.kind !== 'xsdType' || showDataProp)
        .map((element) => element.data.id)
    )

    // An instance layer keeps its immediate semantic targets visible. This is
    // what lets an ecosystem-only view retain the catalog/ontology nodes each
    // live relationship points to without recursively pulling in the whole
    // graph. The endpoint still has to satisfy the module, concern and
    // node-type axes — crossing a layer boundary is not licence to ignore the
    // filters the reader set — and a node set aside by hand stays hidden.
    const contextKinds = new Set()
    if (layerFilters.has('ecosystem')) contextKinds.add('ecosystemRelationship')
    if (layerFilters.has('catalog')) {
      contextKinds.add('catalogRelation')
      contextKinds.add('instanceOf')
    }
    if (contextKinds.size) {
      const elementById = new Map(
        allElements.filter((e) => !e.data?.source).map((e) => [e.data.id, e.data]),
      )
      const admits = (id) => {
        const data = elementById.get(id)
        return Boolean(data) && !hiddenNodes.has(id) && termAxesVisible(data)
      }
      for (const element of allElements) {
        const data = element.data
        if (!data?.source || !contextKinds.has(data.kind) || !edgeLayerVisible(data.kind)) continue
        if (!visibleNodeIds.has(data.source) && !visibleNodeIds.has(data.target)) continue
        if (admits(data.source)) visibleNodeIds.add(data.source)
        if (admits(data.target)) visibleNodeIds.add(data.target)
      }
    }

    if (neighborhoodFocus && selected?.id && !selected.source && visibleNodeIds.has(selected.id)) {
      const focused = new Set([selected.id])
      for (const element of allElements) {
        const data = element.data
        if (!data?.source) continue
        if (!edgeLayerVisible(data.kind)) continue
        if (!visibleNodeIds.has(data.source) || !visibleNodeIds.has(data.target)) continue
        if (data.source === selected.id) focused.add(data.target)
        else if (data.target === selected.id) focused.add(data.source)
      }
      visibleNodeIds = focused
    }

    return allElements.filter((element) => {
      const data = element.data
      if (!data) return false
      if (!data.source) return visibleNodeIds.has(data.id)
      return visibleNodeIds.has(data.source) &&
        visibleNodeIds.has(data.target) &&
        edgeLayerVisible(data.kind)
    })
  }

  function nodeOptionsForCurrentView() {
    return visibleElementsForCurrentView()
      .filter((element) => !element.data?.source)
      .map((element) => ({
        id: element.data.id,
        label: element.data.label ?? localName(element.data.id),
        value: `${element.data.label ?? localName(element.data.id)} | ${localName(element.data.id)}`,
        searchText: element.data.searchText ?? `${element.data.label ?? ''} ${localName(element.data.id)}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }

  const focusNodeOptions = $derived(nodeOptionsForCurrentView())

  // Spotlight the nodes of one type/scheme by pushing everything else back.
  // Runs on the cytoscape side (classes, not re-filtering) so it composes with
  // the visibility layers instead of fighting them.
  function applyTypeHighlight() {
    if (!cy) return
    cy.batch(() => {
      cy.elements().removeClass('type-dim type-hit')
      if (!typeHighlight) return
      const key = typeHighlight.mode === 'kind' ? 'kind' : 'scheme'
      const matched = cy.nodes().filter((node) =>
        node.style('display') !== 'none' && node.data(key) === typeHighlight.value)
      if (!matched.length) return
      matched.addClass('type-hit')
      cy.elements().not(matched).addClass('type-dim')
    })
  }

  function toggleTypeHighlight(mode, value) {
    typeHighlight = typeHighlight?.mode === mode && typeHighlight?.value === value
      ? null
      : { mode, value }
  }

  $effect(() => {
    typeHighlight
    applyTypeHighlight()
  })

  // Counts drive the legend: a type with nothing on screen is dimmed and
  // non-clickable, which makes the current scope's composition legible at a
  // glance instead of listing every type the app could ever draw.
  const visibleKindCounts = $derived(new Map(graphStats?.nodeCounts ?? []))
  const visibleSchemeCounts = $derived(new Map(graphStats?.schemeCounts ?? []))

  // How many nodes each module would contribute under the *other* axes — the
  // module axis itself is excluded, so the numbers say what picking a module
  // adds rather than collapsing to the current selection. Modules that own no
  // drawable term (the bridges, alignments, shapes) sit at 0, which is itself
  // worth seeing: it is what "axiom-only module" looks like.
  const visibleModuleCounts = $derived.by(() => {
    const counts = new Map()
    for (const element of allElements) {
      const data = element.data
      if (!data || data.source || !data.module) continue
      if (hiddenNodes.has(data.id)) continue
      if (!activeLayers.has(data.layer)) continue
      if (hiddenKinds.has(data.kind)) continue
      if (concernFilters.size && ![...concernFilters].some((c) => concernMatches(c, data))) continue
      counts.set(data.module, (counts.get(data.module) ?? 0) + 1)
    }
    return counts
  })

  const selectedKind = $derived(selected && !selected.source ? selected.kind : null)
  const selectedScheme = $derived(selected && !selected.source ? selected.scheme : null)

  // The legend sits below the fold in a short window, so marking the selected
  // node's type there is only useful if the row is actually brought into view.
  $effect(() => {
    const kind = selectedKind
    if (!kind || typeof document === 'undefined') return
    const row = document.querySelector(`.legend-btn[data-kind="${CSS.escape(kind)}"]`)
    if (!row) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    row.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' })
  })

  function applyGraphDisplay({ animate = true } = {}) {
    if (!cy) return null
    const visible = visibleElementsForCurrentView()
    const newIds = new Set(visible.map((element) => element.data.id))
    const shouldAnimate = animate && transitionMs > 0

    cy.elements().forEach((element) => {
      const id = element.id()
      const shouldShow = newIds.has(id)
      const wasShown = visibleSet.has(id)

      if (shouldShow && !wasShown) {
        element.stop(true, false)
        const wasHidden = element.style('display') === 'none'
        element.style('display', 'element')
        if (shouldAnimate) {
          if (wasHidden) element.style('opacity', 0)
          element.animate({ style: { opacity: 1 } }, {
            duration: transitionMs,
            easing: TRANSITION_EASING,
            complete: () => element.removeStyle('opacity'),
          })
        } else {
          element.removeStyle('opacity')
        }
      } else if (!shouldShow && wasShown) {
        element.stop(true, false)
        if (shouldAnimate) {
          element.animate({ style: { opacity: 0 } }, {
            duration: transitionMs,
            easing: TRANSITION_EASING,
            complete: () => {
              element.style('display', 'none')
              element.removeStyle('opacity')
            },
          })
        } else {
          element.style('display', 'none')
          element.removeStyle('opacity')
        }
      } else if (!shouldShow) {
        element.style('display', 'none')
        element.removeStyle('opacity')
      }
    })

    visibleSet = newIds
    graphStats = computeGraphStats(visible)
    // Visibility just changed, so a spotlight set from the previous view may
    // now cover hidden nodes — recompute it against what is actually on screen.
    applyTypeHighlight()
    return cy.elements().filter((element) => newIds.has(element.id()))
  }

  // A node is a true singleton when none of the edges in the set being laid out
  // connect it to anything — e.g. an XSD datatype once the data-property layer
  // is hidden. Membership is tested against an explicit id set rather than the
  // `display` style: a node on its way out is still `display: element` until its
  // fade-out completes, so reading the style mid-transition sees the previous
  // view. See relayoutGraph.
  function isolatedWithin(visibleIds) {
    return (node) =>
      node.connectedEdges().filter((edge) => visibleIds.has(edge.id())).length === 0
  }

  // Among the visible elements, return the largest connected component (the
  // "core" cluster). Everything outside it — lone single-concept SKOS schemes
  // (PresetGroup, VoiceType…) and small disconnected islands — are "strays".
  function largestComponent(visible) {
    const components = visible.components()
    let core = null
    for (const comp of components) {
      if (!core || comp.nodes().length > core.nodes().length) core = comp
    }
    return core
  }

  // Lay out one disconnected island on its own terms. Most are hub-and-spoke
  // (a class and the instances typed by it), which a tree or force layout
  // stretches into a wide fan that eats horizontal space; concentric puts the
  // hub in the middle with its members ringed around it — compact, and it
  // states the shape of the island at a glance. Only genuinely large islands
  // fall back to a force pass. The bounding box is a sizing *hint*:
  // packStrayNodes re-measures the finished result before placing it, so a
  // layout that overflows its hint can still never overlap a neighbour.
  function layoutStrayIsland(island) {
    const nodes = island.nodes()
    const n = nodes.length

    if (n === 2) {
      // Two nodes and an edge: no layout engine needed, just sit them together.
      nodes[0].position({ x: 0, y: 0 })
      nodes[1].position({ x: 150, y: 0 })
      return
    }

    if (n <= 30) {
      island.layout({
        name: 'concentric',
        fit: false,
        avoidOverlap: true,
        concentric: (node) => node.degree(),
        levelWidth: () => 1,
        minNodeSpacing: 26,
        spacingFactor: 1,
        boundingBox: { x1: 0, y1: 0, x2: 10, y2: 10 },
      }).run()
      return
    }

    const side = Math.max(320, Math.round(Math.sqrt(n) * 135))
    island.layout({
      name: 'cose', animate: false, fit: false,
      nodeRepulsion: () => 6000, idealEdgeLength: () => 60,
      edgeElasticity: () => 100, gravity: 0.5, numIter: 600,
      boundingBox: { x1: 0, y1: 0, x2: side, y2: side },
    }).run()
  }

  function measureBlock(eles) {
    const bb = eles.boundingBox()
    return { eles, w: bb.w, h: bb.h, x1: bb.x1, y1: bb.y1 }
  }

  // cose tiles disconnected components into a long strip across an edge, leaving
  // the real cluster crammed into one corner. Instead we lay out only the core
  // with cose, then handle each stray *component* as its own block: multi-node
  // islands keep their internal structure via their own layout, and the truly
  // edgeless singles share one compact grid.
  //
  // Blocks are then shelf-packed by their MEASURED extent, not by a guess from
  // node count — measuring after layout is what makes overlap impossible, and
  // guessing is what made the earlier version collide.
  function packStrayNodes(strays, core) {
    // Generous enough that neighbouring islands read as separate groups rather
    // than one field of nodes.
    const GAP = 60
    const GUTTER = 140
    const coreBB = core.boundingBox()

    let singles = cy.collection()
    const islands = []
    for (const comp of strays.components()) {
      if (comp.nodes().length <= 1) singles = singles.union(comp)
      else islands.push(comp)
    }

    const blocks = []
    for (const island of islands) {
      layoutStrayIsland(island)
      blocks.push(measureBlock(island.nodes()))
    }
    if (singles.length) {
      const cellW = 170
      const cellH = 54
      const cols = Math.max(1, Math.round(Math.sqrt(singles.length) * 1.35))
      const rows = Math.ceil(singles.length / cols)
      singles.layout({
        name: 'grid', fit: false, avoidOverlap: true, cols,
        boundingBox: { x1: 0, y1: 0, x2: cols * cellW, y2: rows * cellH },
      }).run()
      blocks.push(measureBlock(singles))
    }
    if (!blocks.length) return

    // Shelf-pack tallest-first (keeps rows tight) into a block roughly as tall
    // as the core it sits beside, so the two read as one balanced composition.
    blocks.sort((a, b) => b.h - a.h)
    const totalArea = blocks.reduce((sum, b) => sum + (b.w + GAP) * (b.h + GAP), 0)
    const targetH = Math.max(coreBB.h, 420)
    const maxRowW = Math.min(4000, Math.max(360, totalArea / (targetH * 0.8)))

    let cursorX = 0
    let cursorY = 0
    let rowH = 0
    for (const block of blocks) {
      if (cursorX > 0 && cursorX + block.w > maxRowW) {
        cursorX = 0
        cursorY += rowH + GAP
        rowH = 0
      }
      block.tx = cursorX
      block.ty = cursorY
      cursorX += block.w + GAP
      rowH = Math.max(rowH, block.h)
    }

    const blockH = cursorY + rowH
    const originX = coreBB.x2 + GUTTER
    const originY = coreBB.y1 + (coreBB.h - blockH) / 2

    for (const block of blocks) {
      block.eles.shift({
        x: originX + block.tx - block.x1,
        y: originY + block.ty - block.y1,
      })
    }
  }

  const COSE_OPTIONS = {
    name: 'cose',
    animate: false,
    // Scatter before settling. The graph reaches cose from a grid seed now (the
    // constructor no longer burns a whole cose pass to produce one), and cose
    // from a regular lattice with randomize off converges into a stretched
    // ribbon instead of a cluster.
    randomize: true,
    nodeRepulsion: () => 8000,
    idealEdgeLength: () => 80,
    edgeElasticity: () => 100,
    gravity: 0.4,
    numIter: 1000,
    fit: false,
    padding: 30,
  }

  // `elements` is the set to lay out. Callers that just changed the scope must
  // pass the new set: applyGraphDisplay fades elements out over transitionMs and
  // only sets `display: none` when that animation completes, so reading the
  // style here would lay out and fit the *previous* view. Going from the full
  // graph to a small profile closure made that unmissable — the canvas kept the
  // old bounding box and the surviving handful of nodes were left as specks.
  function relayoutGraph(elements = null) {
    if (!cy) return
    const visible = elements ?? cy.elements().filter((element) => element.style('display') !== 'none')
    if (!visible.nodes().length) return
    const visibleIds = new Set(visible.map((element) => element.id()))

    // Choose what gets gridded vs. kept in the force layout (see strayMode).
    // strayElements carries nodes AND their internal edges (never edges to
    // core — components are disjoint by construction) so packStrayNodes can
    // tell islands apart from true singletons.
    let core, strayElements
    if (strayMode === 'singletons') {
      const strayNodes = visible.nodes().filter(isolatedWithin(visibleIds))
      strayElements = strayNodes
      core = visible.not(strayNodes)
    } else {
      core = largestComponent(visible)
      strayElements = visible.not(core)
    }

    // Degenerate case (e.g. every node is a singleton): just tile a grid.
    if (!core.nodes().length) {
      visible.layout({ name: 'grid', fit: false, avoidOverlap: true }).run()
      fitGraph()
      return
    }

    // cose with animate:false runs synchronously, so positions are final here.
    core.layout({ ...COSE_OPTIONS }).run()
    if (strayElements.length) packStrayNodes(strayElements, core)
    fitGraph()
  }

  function setStrayMode(value) {
    if (value === strayMode) return
    strayMode = value
    relayoutGraph()
    persistGraphSession()
  }

  // `animate: false` is for the opening frame, which has nothing to animate
  // from and must not leave a running animation to land after the deep-link
  // camera has been applied.
  function fitGraph(elements = null, { animate = true } = {}) {
    if (!cy) return
    const eles = elements ?? cy.elements().filter((element) => element.style('display') !== 'none')
    const target = eles.length ? eles : cy.elements()
    cy.stop(true)
    if (!animate || transitionMs <= 0) {
      cy.fit(target, 30)
      return
    }
    cy.animate({ fit: { eles: target, padding: 30 } }, { duration: transitionMs, easing: TRANSITION_EASING })
  }

  function clearSelection() {
    cy?.elements().unselect()
    selected = null
    neighborhoodFocus = false
  }

  function persistGraphSession() {
    saveGraphSession({
      layerFilters: [...layerFilters],
      moduleFilters: [...moduleFilters],
      concernFilters: [...concernFilters],
      hiddenKinds: [...hiddenKinds],
      includeModuleDependencies,
      hiddenNodes: [...hiddenNodes],
      focusNodeQuery,
      showSubClassOf,
      showObjProp,
      showDataProp,
      showNarrower,
      showRelated,
      showInstanceOf,
      showCatalogRelation,
      showEcosystemRelationship,
      selectedIri: selected?.iri ?? '',
      neighborhoodFocus,
      connectionFilters: [...connectionFilters],
      strayMode,
      camera: cy ? { pan: cy.pan(), zoom: cy.zoom() } : graphSession.camera,
    })
  }

  function toggleNeighborhoodFocus() {
    if (!neighborhoodFocus && !selected) return
    neighborhoodFocus = !neighborhoodFocus
  }

  function toggleConnectionFilter(kind) {
    const next = new Set(connectionFilters)
    if (next.has(kind)) next.delete(kind)
    else next.add(kind)
    connectionFilters = next
  }

  const connectionKinds = $derived.by(() => {
    const counts = new Map()
    for (const n of neighbors) {
      counts.set(n.kind, (counts.get(n.kind) ?? 0) + 1)
    }
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b))
  })

  const filteredNeighbors = $derived(
    neighbors.filter((n) => !connectionFilters.has(n.kind))
  )

  const groupedNeighbors = $derived.by(() => {
    const out = []
    const inc = []
    for (const n of filteredNeighbors) {
      if (n.direction === 'out') out.push(n)
      else inc.push(n)
    }
    return { out, inc }
  })

  function selectNodeById(id) {
    if (!cy || !id) return
    const node = cy.getElementById(id)
    if (!node.length) return
    cy.elements().unselect()
    node.select()
    selected = node.data()
    const zoom = neighborhoodFocus ? cy.zoom() : Math.max(cy.zoom(), 1)
    cy.stop(true)
    if (transitionMs <= 0) {
      cy.zoom(zoom)
      cy.center(node)
      return
    }
    cy.animate({
      center: { eles: node },
      zoom,
    }, { duration: transitionMs, easing: TRANSITION_EASING })
  }

  // `camera: false` selects without moving the viewport — the deep-link path
  // needs the selection in place first, then frames it once with the link's own
  // zoom instead of centring twice.
  function selectElementById(id, { camera = true } = {}) {
    if (!cy || !id) return
    const element = cy.getElementById(id)
    if (!element.length) return
    cy.elements().unselect()
    element.select()
    selected = element.data()
    if (!camera) return
    cy.stop(true)
    if (transitionMs <= 0) {
      cy.center(element)
      return
    }
    cy.animate({
      center: { eles: element },
    }, { duration: transitionMs, easing: TRANSITION_EASING })
  }

  // ── Deep-link arrival beacon ───────────────────────────────────────────────
  // Blink the element a link landed on, on the schedule deepLink.js defines
  // (which is where the flash-rate reasoning lives). Wall-clock timers are
  // correct here: this is canvas UI with no relationship to the stimulation
  // engine's timing authority (CLAUDE.md §3.1), which governs audio-visual
  // synchronization only.
  let pulseTimers = []

  function clearPulse() {
    for (const timer of pulseTimers) clearTimeout(timer)
    pulseTimers = []
    cy?.elements().removeClass('link-pulse')
  }

  function pulseElement(element) {
    if (!element?.length) return
    clearPulse()
    // Reduced motion, or visual stimulation switched off in Settings: the cue
    // still has to *locate* the node, so it holds one steady halo instead of
    // being dropped.
    const steady = prefersReducedMotion() || !isVisualStimulationOn()
    for (const { at, on } of pulseSchedule({ steady })) {
      pulseTimers.push(setTimeout(
        () => (on ? element.addClass('link-pulse') : element.removeClass('link-pulse')),
        at,
      ))
    }
  }

  function pulseNodeById(id) {
    if (!cy || !id) return
    pulseElement(cy.getElementById(id))
  }

  // cy.zoom(level) keeps `pan` fixed, which pivots the view on the canvas
  // origin rather than on what the reader is looking at. Anchor it to the
  // viewport centre unless a node is about to be centred anyway.
  function setZoomAboutCenter(level) {
    cy.zoom({ level, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } })
  }

  // The one place the opening camera is decided.
  //
  // Priority: the link's node (with its `?zoom=`, or the focused neighborhood's
  // own fit), then a bare `?zoom=`, then the camera this session left behind.
  function restoreInitialCamera({ id = null, deepLink = false } = {}) {
    if (!cy) return
    // The opening fit from relayoutGraph is mid-animation and would land a
    // frame after this returns, undoing everything below. Cancel it where it
    // stands — every branch here sets the camera outright.
    cy.stop(true, false)
    const element = id ? cy.getElementById(id) : null
    const hasElement = Boolean(element?.length) && element.style('display') !== 'none'

    if (hasElement && deepLink) {
      if (urlView.zoom != null) {
        cy.zoom(urlView.zoom)
        cy.center(element)
      } else if (neighborhoodFocus) {
        // No zoom in the link, but the graph is folded to the neighborhood:
        // frame that whole set, exactly as the focus button does.
        fitGraph(null, { animate: false })
      } else {
        // A deep link has to arrive close enough to actually read the node.
        cy.zoom(Math.max(cy.zoom(), 1))
        cy.center(element)
      }
      pulseElement(element)
      return
    }

    if (urlView.zoom != null) {
      // Re-establish the fit this function just cancelled, so the link's scale
      // is applied around a sane pan rather than a half-finished one.
      fitGraph(null, { animate: false })
      setZoomAboutCenter(urlView.zoom)
    } else if (graphSession.camera) {
      cy.zoom(graphSession.camera.zoom)
      cy.pan(graphSession.camera.pan)
    } else {
      fitGraph(null, { animate: false })
    }
    if (hasElement) cy.center(element)
  }

  function computeNeighbors(id) {
    if (!id) return []
    const visibleNodeIds = new Set(
      visibleElementsForCurrentView()
        .filter((element) => !element.data?.source)
        .map((element) => element.data.id),
    )
    const nodeById = new Map()
    for (const element of allElements) {
      if (!element.data?.source) nodeById.set(element.data.id, element.data)
    }
    const seen = new Map()
    for (const element of allElements) {
      const data = element.data
      if (!data?.source) continue
      if (!edgeLayerVisible(data.kind)) continue
      const isOutgoing = data.source === id
      const isIncoming = data.target === id
      if (!isOutgoing && !isIncoming) continue
      const otherId = isOutgoing ? data.target : data.source
      const otherData = nodeById.get(otherId)
      if (!otherData) continue
      if (!visibleNodeIds.has(otherId)) continue
      if (otherData.kind === 'xsdType' && !showDataProp) continue
      const edgeIdentity = data.kind === 'ecosystemRelationship'
        ? data.iri
        : data.label
      const key = `${otherId}|${data.kind}|${isOutgoing ? 'out' : 'in'}|${edgeIdentity}`
      if (seen.has(key)) continue
      seen.set(key, {
        id: otherId,
        label: otherData.label ?? localName(otherId),
        kind: data.kind,
        edgeLabel: data.label || '',
        edgeId: data.id,
        direction: isOutgoing ? 'out' : 'in',
      })
    }
    return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label))
  }

  const SSTIM_BASE   = 'https://w3id.org/sstim#'
  const SSTIM_V_BASE = 'https://w3id.org/sstim/vocab#'
  const HASH_PREFER_BASES = [SSTIM_BASE, SSTIM_V_BASE]

  let setupReady = false
  let unsubscribeSkin = null

  function resolveHashToNodeId(rawHash) {
    if (!rawHash || !allElements.length) return null
    let value = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash
    try { value = decodeURIComponent(value) } catch { /* keep raw */ }
    if (!value) return null

    if (value.includes(':')) {
      const colon = value.indexOf(':')
      const prefix = value.slice(0, colon)
      const local = value.slice(colon + 1)
      const base = PREFIXES[prefix]
      if (base) {
        // Empty local (e.g. `#bsclab:`) addresses the namespace's own root
        // resource — the base IRI minus its trailing separator — rather than
        // a member under it. See hashForIri for the matching encode side.
        const iri = local ? base + local : base.slice(0, -1)
        const exact = allElements.find((el) => el.data?.iri === iri)
        if (exact) return exact.data.id
      }
    }

    const localName = value.includes(':') ? value.slice(value.indexOf(':') + 1) : value
    const candidates = allElements.filter((el) => {
      const iri = el.data?.iri
      return iri && iri.split(/[#/]/).pop() === localName
    })
    if (!candidates.length) return null
    for (const base of HASH_PREFER_BASES) {
      const match = candidates.find((c) => c.data.iri.startsWith(base))
      if (match) return match.data.id
    }
    if (candidates.length > 1) {
      console.warn('[SSTIM Workbench] Hash matches multiple nodes; using first', {
        hash: rawHash,
        candidates: candidates.map((c) => c.data.iri),
      })
    }
    return candidates[0].data.id
  }

  // A deep link may target a node the current filters hide — selection would
  // otherwise land on a display:none node and appear to do nothing. w3id.org
  // routes resolve into this page, so a deep link has to win over the saved
  // session: widen one axis at a time, least destructive first, and only clear
  // the reader's filters if the target is still not on screen.
  function widenScopeToShow(id) {
    const element = allElements.find((el) => !el.data?.source && el.data?.id === id)
    if (!element) return
    const data = element.data
    let widened = false

    if (hiddenNodes.has(id)) {
      hiddenNodes = new Set([...hiddenNodes].filter((hidden) => hidden !== id))
      widened = true
    }
    if (!activeLayers.has(data.layer)) {
      const layer = GRAPH_LAYERS.find((l) => l.layers.includes(data.layer))
      if (layer) {
        layerFilters = new Set([...layerFilters, layer.value])
        widened = true
      }
    }
    if (hiddenKinds.has(data.kind)) {
      hiddenKinds = new Set([...hiddenKinds].filter((kind) => kind !== data.kind))
      widened = true
    }
    if (!termAxesVisible(data)) {
      moduleFilters = new Set()
      concernFilters = new Set()
      widened = true
    }
    if (widened) applyGraphDisplay({ animate: false })
  }

  function hashForIri(iri) {
    if (!iri) return ''
    if (iri.startsWith(SSTIM_BASE) || iri.startsWith(SSTIM_V_BASE)) {
      return '#' + iri.split(/[#/]/).pop()
    }
    const curie = toCurie(iri)
    if (curie !== iri) return '#' + curie
    // toCurie only compacts a sub-path under a registered base. A namespace's
    // own root resource (e.g. https://w3id.org/sstim/framework/bsc, which sits
    // one level above the bsc-fw: base) has no local segment to compact, so
    // back it into `prefix:` with an empty local instead of leaving it dangling.
    for (const [prefix, base] of Object.entries(PREFIXES)) {
      if (iri + '/' === base) return '#' + prefix + ':'
    }
    return ''
  }

  // Reference docs exist only in the deployed Pages artifact (404 under
  // `make dev`): WIDOCO for core OWL terms (`/ontology/docs/`, anchors are
  // term local names) and pyLODE for SKOS vocabulary concepts
  // (`/ontology/docs/vocab/` — pyLODE anchors are label-derived, so link the
  // page rather than a fragile per-term fragment).
  function docsUrlForIri(iri) {
    if (!iri) return null
    if (iri.startsWith(SSTIM_BASE)) {
      return applicationAsset('/ontology/docs/#' + iri.slice(SSTIM_BASE.length))
    }
    if (iri.startsWith(SSTIM_V_BASE)) return applicationAsset('/ontology/docs/vocab/')
    return null
  }

  function writeHashForSelected() {
    const target = hashForIri(selected?.iri)
    if (window.location.hash === target) return
    if (target === '' && !window.location.hash) return
    const url = window.location.pathname + window.location.search + target
    replaceState(url || window.location.pathname, {})
  }

  // Scope and framing are written by separate callers on separate triggers, so
  // each one edits the live query string rather than rebuilding it — otherwise
  // whichever wrote last would drop the other's params.
  function updateSearchParams(mutate) {
    const params = new URLSearchParams(window.location.search)
    mutate(params)
    const query = params.toString()
    const url = window.location.pathname + (query ? '?' + query : '') + window.location.hash
    if (url === window.location.pathname + window.location.search + window.location.hash) return
    replaceState(url, {})
  }

  // Mirrors writeHashForSelected: keeps the address bar in sync with the active
  // perspective so the current filtered view is itself a copyable/bookmarkable
  // link, not just the selected node. One param per axis, each omitted at its
  // default, so an unfiltered graph stays a bare URL. The hand-hidden node set
  // is deliberately absent — see graphSession.js.
  function writeScopeToUrl() {
    updateSearchParams((params) => {
      const axis = (name, values, isDefault) => {
        if (isDefault) params.delete(name)
        else params.set(name, [...values].join(','))
      }
      axis('layer', layerFilters, layerFilters.size === 1 && layerFilters.has('terms'))
      axis('module', moduleFilters, moduleFilters.size === 0)
      axis('view', concernFilters, concernFilters.size === 0)
      axis('hide', hiddenKinds, hiddenKinds.size === 0)
    })
  }

  // The camera counterpart of writeScopeToUrl: the zoom the reader is actually
  // looking at, and whether the neighborhood is folded down to the selection.
  // Focus is written only while it is in effect — it needs a selected node to
  // mean anything, and `?focus=` on a link with no node hash would be inert.
  function writeViewToUrl() {
    if (!cy) return
    updateSearchParams((params) => {
      params.set('zoom', formatZoomParam(cy.zoom()))
      if (neighborhoodFocus && selected && !selected.source) params.set('focus', FOCUS_PARAM_VALUE)
      else params.delete('focus')
    })
  }

  // Zoom fires continuously through a wheel gesture or a fit animation; the
  // address bar only needs where it came to rest.
  let zoomUrlTimer = null
  function scheduleViewUrlWrite() {
    if (!setupReady) return
    clearTimeout(zoomUrlTimer)
    zoomUrlTimer = setTimeout(writeViewToUrl, 400)
  }

  function handleHashChange() {
    if (!cy || !allElements.length) return
    const hash = window.location.hash
    if (!hash) {
      if (selected) clearSelection()
      return
    }
    const id = resolveHashToNodeId(hash)
    if (id && id !== selected?.id) {
      widenScopeToShow(id)
      selectElementById(id)
      // Same arrival as a fresh load — the reader followed a link and needs to
      // be told where it landed.
      pulseNodeById(id)
    }
  }

  async function copyIri() {
    if (!selected?.iri) return
    try {
      await navigator.clipboard.writeText(selected.iri)
      iriCopied = true
      clearTimeout(iriCopyTimer)
      iriCopyTimer = setTimeout(() => { iriCopied = false }, 1400)
    } catch (e) {
      console.warn('Clipboard copy failed', e)
    }
  }

  function handleScopeChange() {
    clearSelection()
    focusNodeQuery = ''
    // Lay out and fit the set applyGraphDisplay just computed, not whatever is
    // still on screen mid-fade.
    relayoutGraph(applyGraphDisplay())
  }

  function toggleInSet(current, value) {
    const next = new Set(current)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  }

  function toggleLayerFilter(value) {
    // The layer axis is the one axis that always constrains, so emptying it
    // would blank the canvas with no way back except a reset. Refuse the last
    // one rather than presenting a dead state.
    if (layerFilters.size === 1 && layerFilters.has(value)) return
    layerFilters = toggleInSet(layerFilters, value)
    handleScopeChange()
  }

  function toggleModuleFilter(value) {
    moduleFilters = toggleInSet(moduleFilters, value)
    handleScopeChange()
  }

  function toggleConcernFilter(value) {
    concernFilters = toggleInSet(concernFilters, value)
    handleScopeChange()
  }

  function toggleKindFilter(kind) {
    hiddenKinds = toggleInSet(hiddenKinds, kind)
    applyGraphDisplay()
  }

  function setModuleProfile(profileValue) {
    const profile = GRAPH_PROFILES.find((p) => p.value === profileValue)
    if (!profile) return
    moduleFilters = profile.value === 'full' ? new Set() : new Set(profile.modules)
    handleScopeChange()
  }

  function setIncludeModuleDependencies(value) {
    includeModuleDependencies = value
    handleScopeChange()
  }

  function resetScopeFilters() {
    layerFilters = new Set(['terms'])
    moduleFilters = new Set()
    concernFilters = new Set()
    hiddenKinds = new Set()
    handleScopeChange()
  }

  // Which profile the current module selection *is*, for marking the shortcut
  // as active. Set equality against the drawable closure, so picking the same
  // modules by hand lights the same chip.
  const activeProfile = $derived.by(() => {
    const match = GRAPH_PROFILES.find((profile) => {
      const expected = profile.value === 'full' ? [] : profile.modules
      return expected.length === moduleFilters.size &&
        expected.every((id) => moduleFilters.has(id))
    })
    return match?.value ?? null
  })

  const scopeSummary = $derived.by(() => {
    const parts = []
    const layers = GRAPH_LAYERS.filter((l) => layerFilters.has(l.value))
    parts.push(layers.length === GRAPH_LAYERS.length
      ? 'All layers'
      : layers.map((l) => l.label.split(' · ')[0]).join(' + '))
    if (moduleFilters.size) {
      const profile = GRAPH_PROFILES.find((p) => p.value === activeProfile && p.value !== 'full')
      parts.push(profile
        ? profile.label
        : `${moduleFilters.size} module${moduleFilters.size === 1 ? '' : 's'}`)
    }
    if (concernFilters.size === 1) {
      parts.push(GRAPH_CONCERNS.find((c) => c.value === [...concernFilters][0]).label)
    } else if (concernFilters.size > 1) {
      parts.push(`${concernFilters.size} concerns`)
    }
    return parts.join(' · ')
  })

  const scopeFilterCount = $derived(
    moduleFilters.size + concernFilters.size + hiddenKinds.size +
    (layerFilters.size === 1 && layerFilters.has('terms') ? 0 : 1),
  )

  function setFocusNodeQuery(value) {
    focusNodeQuery = value
  }

  function focusNode() {
    if (!cy) return
    let id = selected && !selected.source ? selected.id : null

    if (focusNodeQuery.trim()) {
      const query = focusNodeQuery.trim().toLowerCase()
      const match = focusNodeOptions.find((option) => option.value.toLowerCase() === query) ??
        focusNodeOptions.find((option) => option.label.toLowerCase().includes(query)) ??
        focusNodeOptions.find((option) => option.searchText.toLowerCase().includes(query))
      id = match?.id
    }

    selectNodeById(id)
  }

  function computeGraphStats(elements) {
    const nodeCounts = new Map()
    const edgeCounts = new Map()
    const schemeCounts = new Map()
    const graphTerms = new Set()

    for (const element of elements) {
      const data = element.data
      if (!data) continue
      if (data.source && data.target) {
        edgeCounts.set(data.kind, (edgeCounts.get(data.kind) ?? 0) + 1)
      } else {
        nodeCounts.set(data.kind, (nodeCounts.get(data.kind) ?? 0) + 1)
        if (data.scheme) schemeCounts.set(data.scheme, (schemeCounts.get(data.scheme) ?? 0) + 1)
      }
    }

    for (const quad of store) {
      graphTerms.add(quad.graph.value || 'default')
    }

    return {
      quads: store.size,
      graphs: graphTerms.size,
      nodes: elements.filter((element) => !element.data?.source).length,
      edges: elements.filter((element) => element.data?.source).length,
      nodeCounts: [...nodeCounts.entries()].sort(([a], [b]) => a.localeCompare(b)),
      edgeCounts: [...edgeCounts.entries()].sort(([a], [b]) => a.localeCompare(b)),
      schemeCounts: [...schemeCounts.entries()],
    }
  }

  // ── Setting nodes aside by hand ────────────────────────────────────────────
  // A handful of hub nodes dominate a force layout and drown the structure a
  // reader is trying to see. Hiding is a display act on top of the scope, never
  // a change to the graph: the count stays on screen in the stats panel and the
  // set is listed for restore, so a pruned canvas can never be mistaken for the
  // ontology itself.
  function hideNode(id) {
    if (!id || hiddenNodes.has(id)) return
    hiddenNodes = new Set([...hiddenNodes, id])
    if (selected?.id === id) clearSelection()
    applyGraphDisplay()
  }

  function hideSelectedNode() {
    if (!selected || selected.source) return
    hideNode(selected.id)
  }

  function restoreNode(id) {
    hiddenNodes = new Set([...hiddenNodes].filter((hidden) => hidden !== id))
    applyGraphDisplay()
  }

  function restoreAllNodes() {
    if (!hiddenNodes.size) return
    hiddenNodes = new Set()
    applyGraphDisplay()
  }

  // Labels for the restore list. Read from allElements rather than stored with
  // the id so a hidden node keeps its current label across reloads.
  const hiddenNodeList = $derived.by(() => {
    if (!hiddenNodes.size) return []
    const byId = new Map(
      allElements.filter((e) => !e.data?.source).map((e) => [e.data.id, e.data]),
    )
    return [...hiddenNodes]
      .map((id) => ({ id, label: byId.get(id)?.label ?? localName(id), kind: byId.get(id)?.kind }))
      .sort((a, b) => a.label.localeCompare(b.label))
  })

  $effect(() => {
    // re-run whenever any toggle changes
    showSubClassOf; showObjProp; showDataProp
    showNarrower; showRelated; showInstanceOf
    showCatalogRelation; showEcosystemRelationship
    layerFilters; moduleFilters; concernFilters; hiddenKinds
    includeModuleDependencies; hiddenNodes
    applyGraphDisplay()
  })

  $effect(() => {
    if (!cy || !selected || selected.source) {
      neighbors = []
      return
    }
    // re-run when layer toggles or scope change since visibility affects neighbor list
    showSubClassOf; showObjProp; showDataProp
    showNarrower; showRelated; showInstanceOf
    showCatalogRelation; showEcosystemRelationship
    layerFilters; moduleFilters; concernFilters; hiddenKinds
    includeModuleDependencies; hiddenNodes
    neighborhoodFocus
    neighbors = computeNeighbors(selected.id)
  })

  // Entering or leaving focus re-frames the graph. Its *first* run is not a
  // toggle, though — it is the effect catching up with the graph that mount
  // just built, and restoreInitialCamera owns the camera then. Priming on that
  // run rather than checking a "setup finished" flag is what makes this
  // ordering-proof: Svelte does not promise whether the effect flushes before
  // or after the mount continuation resumes, and either way it must not fit.
  let focusFitPrimed = false
  $effect(() => {
    if (!cy) return
    neighborhoodFocus
    if (!setupReady) return
    const targets = applyGraphDisplay()
    if (!focusFitPrimed) {
      focusFitPrimed = true
      return
    }
    fitGraph(targets)
  })

  $effect(() => {
    if (!cy || !neighborhoodFocus) return
    selected?.id
    if (!setupReady) return
    applyGraphDisplay()
  })

  $effect(() => {
    graphNavigation.set({
      available: true,
      layers: GRAPH_LAYERS,
      modules: GRAPH_MODULES,
      profiles: GRAPH_PROFILES,
      concerns: GRAPH_CONCERNS,
      layerFilters,
      moduleFilters,
      concernFilters,
      includeModuleDependencies,
      activeProfile,
      scopeSummary,
      scopeFilterCount,
      moduleCounts: visibleModuleCounts,
      toggleLayer: toggleLayerFilter,
      toggleModule: toggleModuleFilter,
      toggleConcern: toggleConcernFilter,
      setProfile: setModuleProfile,
      setIncludeModuleDependencies,
      resetScope: resetScopeFilters,
      focusNodeQuery,
      focusNodeOptions,
      canCenter: Boolean(focusNodeQuery.trim() || selected),
      strayMode,
      setFocusNodeQuery,
      setStrayMode,
      center: focusNode,
      fit: fitGraph,
      relayout: relayoutGraph,
    })
  })

  function isTypingTarget(node) {
    if (!node) return false
    if (node.isContentEditable) return true
    return ['INPUT', 'TEXTAREA', 'SELECT'].includes(node.tagName)
  }

  function handleGraphKeydown(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return
    if (isTypingTarget(document.activeElement)) return

    switch (event.key) {
      case 'Escape':
        if (selected) {
          event.preventDefault()
          clearSelection()
        }
        return
      case 'f':
      case 'F':
        event.preventDefault()
        fitGraph()
        return
      case 'r':
      case 'R':
        event.preventDefault()
        relayoutGraph()
        return
      case 'c':
      case 'C':
        if (selected || focusNodeQuery.trim()) {
          event.preventDefault()
          focusNode()
        }
        return
      case 'x':
      case 'X':
        // 'h' is the help toggle in the top bar, so hiding takes 'x'.
        if (selected && !selected.source) {
          event.preventDefault()
          hideSelectedNode()
        }
        return
    }
  }

  onMount(async () => {
    window.addEventListener('keydown', handleGraphKeydown)
    window.addEventListener('hashchange', handleHashChange)
    try {
      const elements = await buildGraphElements(store, {
        // Awaited by the builder, which is what turns sixteen microtask-only
        // `await`s into sixteen chances for the browser to paint the loader.
        onProgress: async ({ step, total, label }) => {
          loadStep = { label, step, total }
          await yieldToScheduler()
        },
      })
      allElements = elements

      const cytoscape = (await import('cytoscape')).default

      loadPhase = 'layout'
      loadStep = null
      // The cose run below is a single multi-second synchronous block. Get the
      // label for it on screen *before* the thread locks, or the loader spends
      // that whole time describing the step that already finished.
      await yieldToPaint()

      cy = cytoscape({
        container,
        elements,
        style: styleSheet(),
        // Cheap seed only. This used to run the full cose, and relayoutGraph()
        // below immediately re-ran cose over the same nodes — two four-second
        // layouts where one was thrown away. `randomize` in COSE_OPTIONS is
        // what lets the surviving run start from a grid without settling into a
        // stretched local minimum.
        layout: { name: 'grid', fit: false },
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
      })

      cy.on('zoom', scheduleViewUrlWrite)

      cy.on('tap', 'node', (evt) => {
        const d = evt.target.data()
        selected = d
        clearPulse()
      })
      cy.on('tap', 'edge', (evt) => {
        const d = evt.target.data()
        selected = d
        clearPulse()
      })
      cy.on('tap', (evt) => {
        if (evt.target === cy) clearSelection()
      })
      // Right-click sets a node aside without going through the inspector,
      // which is how a reader clears three hub nodes in three gestures.
      cy.on('cxttap', 'node', (evt) => {
        hideNode(evt.target.id())
      })

      // Hover feedback: the element highlights and the cursor signals that it
      // is clickable, so the canvas reads as navigable rather than a picture.
      cy.on('mouseover', 'node, edge', (evt) => {
        evt.target.addClass('hovered')
        if (container) container.style.cursor = 'pointer'
      })
      cy.on('mouseout', 'node, edge', (evt) => {
        evt.target.removeClass('hovered')
        if (container) container.style.cursor = ''
      })

      // The node palette is skin-independent, but the selection ring, label
      // halos and outlines are not — restyle when the skin changes.
      unsubscribeSkin = activeSkin.subscribe(() => {
        if (!cy) return
        cy.style().fromJson(styleSheet()).update()
      })

      applyGraphDisplay({ animate: false })
      // Re-run through relayoutGraph so the initial paint gets the same
      // stray-node packing as manual Relayout (the inline cose above only gives
      // the core a first pass and would otherwise tile islands into a strip).
      relayoutGraph()

      const deepLinkId = initialUrlHash ? resolveHashToNodeId(initialUrlHash) : null
      // `?focus=` is meaningless without a node to fold the graph around. A hash
      // that resolves to nothing would otherwise leave focus armed but invisible
      // — with no selection there is no button to turn it off — and it would
      // then fire on the reader's first click.
      if (!deepLinkId && urlView.neighborhoodFocus) neighborhoodFocus = false
      if (deepLinkId) {
        widenScopeToShow(deepLinkId)
        selectElementById(deepLinkId, { camera: false })
        if (neighborhoodFocus) applyGraphDisplay({ animate: false })
      } else if (graphSession.selectedIri) {
        const id = resolveHashToNodeId('#' + graphSession.selectedIri.split(/[#/]/).pop())
        if (id) selectElementById(id, { camera: false })
      }
      setupReady = true

      // Camera last, and only after the pending effects have run: selecting a
      // node and entering focus both schedule a re-fit, and the link's own
      // framing has to be what survives.
      await tick()
      restoreInitialCamera({
        id: deepLinkId ?? (selected && !selected.source ? selected.id : null),
        deepLink: Boolean(deepLinkId),
      })
    } catch (e) {
      error = e.message
      console.error(e)
    } finally {
      loading = false
    }
  })

  onDestroy(() => {
    persistGraphSession()
    window.removeEventListener('keydown', handleGraphKeydown)
    window.removeEventListener('hashchange', handleHashChange)
    clearTimeout(iriCopyTimer)
    clearTimeout(zoomUrlTimer)
    for (const timer of pulseTimers) clearTimeout(timer)
    unsubscribeSkin?.()
    resetGraphNavigation()
    cy?.destroy()
  })

  $effect(() => {
    selected
    if (!setupReady) return
    writeHashForSelected()
  })

  $effect(() => {
    layerFilters; moduleFilters; concernFilters; hiddenKinds
    if (!setupReady) return
    writeScopeToUrl()
  })

  // Focus is a discrete act, so it goes to the URL immediately rather than on
  // the zoom debounce — but it also moves the camera, so the debounced write
  // that follows will pick the zoom up on its own.
  $effect(() => {
    neighborhoodFocus; selected
    if (!setupReady) return
    writeViewToUrl()
  })

  const EDGE_KINDS = [
    { key: 'showSubClassOf', label: 'subClassOf',  color: COLORS.subClassOf },
    { key: 'showObjProp',    label: 'obj. property', color: COLORS.objProp },
    { key: 'showDataProp',   label: 'data property', color: COLORS.dataProp },
    { key: 'showNarrower',   label: 'narrower',     color: COLORS.narrower },
    { key: 'showRelated',    label: 'related',      color: COLORS.related },
    // Named "type" throughout — it projects rdf:type, and the detail panel and
    // connection pills already used that word. The internal kind stays
    // 'instanceOf'; only the human-facing label is unified here.
    { key: 'showInstanceOf', label: 'type',         color: COLORS.instanceOf },
    { key: 'showCatalogRelation', label: 'catalog relation', color: COLORS.catalogRelation },
    { key: 'showEcosystemRelationship', label: 'stakeholder relation', color: COLORS.ecosystemRelationship },
  ]

  const toggles = {
    get showSubClassOf()  { return showSubClassOf },
    set showSubClassOf(v) { showSubClassOf = v },
    get showObjProp()     { return showObjProp },
    set showObjProp(v)    { showObjProp = v },
    get showDataProp()    { return showDataProp },
    set showDataProp(v)   { showDataProp = v },
    get showNarrower()    { return showNarrower },
    set showNarrower(v)   { showNarrower = v },
    get showRelated()     { return showRelated },
    set showRelated(v)    { showRelated = v },
    get showInstanceOf()  { return showInstanceOf },
    set showInstanceOf(v) { showInstanceOf = v },
    get showCatalogRelation()  { return showCatalogRelation },
    set showCatalogRelation(v) { showCatalogRelation = v },
    get showEcosystemRelationship()  { return showEcosystemRelationship },
    set showEcosystemRelationship(v) { showEcosystemRelationship = v },
  }
</script>

<!-- The transition control governs the focus/fit/pan animation, so it lives
     with the Focus neighborhood button that triggers the most visible one —
     rendered there when a node is selected, and in the idle stats panel
     otherwise, so it is always reachable without occupying the sidebar. -->
{#snippet transitionControl(hint)}
  <div class="anim-control">
    <div class="anim-label">
      <label for="graph-transition-ms">Transition</label>
      <span class="anim-value">{transitionMs === 0 ? 'off' : `${transitionMs} ms`}</span>
    </div>
    <input
      id="graph-transition-ms"
      type="range"
      min="0"
      max="800"
      step="20"
      bind:value={transitionMs}
      aria-label="Animation duration in milliseconds"
    />
    <small class="anim-hint">{hint}</small>
  </div>
{/snippet}

<div class="graph-shell">

  <!-- Controls sidebar -->
  <aside class="controls">
    <div class="panel-head">
      <strong>Data sources</strong>
      <div class="panel-head-actions">
        {#if onRefreshLive}
          <button
            type="button"
            class="icon-btn"
            onclick={onRefreshLive}
            disabled={liveStatus?.state === 'loading'}
            title="Refresh the live stakeholder network"
            aria-label="Refresh live stakeholders"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" class:spinning={liveStatus?.state === 'loading'}>
              <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13 2v3h-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        {/if}
        <button
          type="button"
          class="icon-btn"
          onclick={() => (sourceGuideOpen = true)}
          title="What are these sources?"
          aria-label="About the data sources"
        >ⓘ</button>
      </div>
    </div>
    <ul class="source-list">
      <!-- The two versioned layers carry no varying state, so their names get
           the full row; only the live layer shows a status word. -->
      <li title="Versioned · {SOURCE_NOTES.ontology}">
        <span class="source-dot versioned"></span>
        <span class="source-name">Ontology &amp; vocabulary</span>
      </li>
      <li title="Versioned · {SOURCE_NOTES.catalog}">
        <span class="source-dot catalog"></span>
        <span class="source-name">Catalog</span>
      </li>
      <li title={liveStatus?.message ?? SOURCE_NOTES.ecosystem}>
        <span class="source-dot live {liveStatus?.state ?? 'unknown'}"></span>
        <span class="source-name">Stakeholders</span>
        <span class="source-state">{liveStatusLabel(liveStatus?.state)}</span>
      </li>
    </ul>

    <div class="panel-head spaced">
      <strong>Edge layers</strong>
    </div>
    <ul class="layer-list">
      {#each EDGE_KINDS as ek}
        <li>
          <label>
            <input type="checkbox" bind:checked={toggles[ek.key]} />
            <span class="swatch" style="background:{ek.color}"></span>
            {ek.label}
          </label>
        </li>
      {/each}
    </ul>

    <!-- The checkbox filters the type out of the canvas; the row itself still
         spotlights it. This is the axis that used to be the "Core OWL classes"
         and "All SKOS vocabulary" entries in the old flat scope list. -->
    <div class="panel-head spaced">
      <strong>Node types</strong>
      {#if typeHighlight?.mode === 'kind'}
        <button type="button" class="clear-highlight" onclick={() => (typeHighlight = null)}>clear</button>
      {/if}
    </div>
    <ul class="legend-list">
      {#each NODE_KINDS as nk}
        {@const count = visibleKindCounts.get(nk.kind) ?? 0}
        {@const shown = !hiddenKinds.has(nk.kind)}
        <li class="legend-row">
          <input
            type="checkbox"
            class="legend-check"
            checked={shown}
            aria-label="Show {nk.label} nodes"
            title={shown ? `Hide all ${nk.label} nodes` : `Show ${nk.label} nodes`}
            onchange={() => toggleKindFilter(nk.kind)}
          />
          <button
            type="button"
            class="legend-btn"
            data-kind={nk.kind}
            class:on={typeHighlight?.mode === 'kind' && typeHighlight.value === nk.kind}
            class:current={selectedKind === nk.kind}
            class:empty={count === 0}
            class:filtered={!shown}
            disabled={count === 0}
            aria-pressed={typeHighlight?.mode === 'kind' && typeHighlight.value === nk.kind}
            title={!shown
              ? `${nk.label} — hidden by the type filter`
              : count === 0
                ? `${nk.label} — none in this view`
                : `Spotlight the ${count} ${nk.label} node${count === 1 ? '' : 's'}`}
            onclick={() => toggleTypeHighlight('kind', nk.kind)}
          >
            <span class="swatch" style="background:{COLORS[nk.kind]}"></span>
            <span class="legend-label">{nk.label}</span>
            <span class="legend-count">{count}</span>
          </button>
        </li>
      {/each}
    </ul>

    {#if hiddenNodeList.length}
      <div class="panel-head spaced">
        <strong>Set aside</strong>
        <button type="button" class="clear-highlight" onclick={restoreAllNodes}>restore all</button>
      </div>
      <ul class="hidden-list">
        {#each hiddenNodeList as node (node.id)}
          <li>
            <button
              type="button"
              class="hidden-btn"
              title="Restore {node.label}"
              onclick={() => restoreNode(node.id)}
            >
              <span class="swatch" style="background:{COLORS[node.kind] ?? '#888'}"></span>
              <span class="legend-label">{node.label}</span>
              <span class="hidden-restore" aria-hidden="true">↩</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}

    <div class="panel-head spaced">
      <strong>SKOS schemes</strong>
      {#if typeHighlight?.mode === 'scheme'}
        <button type="button" class="clear-highlight" onclick={() => (typeHighlight = null)}>clear</button>
      {/if}
    </div>
    <ul class="legend-list">
      {#each Object.entries(SCHEME_COLORS) as [iri, color]}
        {@const schemeName = iri.split('#')[1].replace('Scheme', '')}
        {@const count = visibleSchemeCounts.get(iri) ?? 0}
        <li>
          <button
            type="button"
            class="legend-btn"
            class:on={typeHighlight?.mode === 'scheme' && typeHighlight.value === iri}
            class:current={selectedScheme === iri}
            class:empty={count === 0}
            disabled={count === 0}
            aria-pressed={typeHighlight?.mode === 'scheme' && typeHighlight.value === iri}
            title={count === 0
              ? `${schemeName} — none in this view`
              : `Spotlight the ${count} ${schemeName} concept${count === 1 ? '' : 's'}`}
            onclick={() => toggleTypeHighlight('scheme', iri)}
          >
            <span class="swatch" style="background:{color}"></span>
            <span class="legend-label">{schemeName}</span>
            <span class="legend-count">{count}</span>
          </button>
        </li>
      {/each}
    </ul>
  </aside>

  <section class="graph-workspace">
    <div class="graph-body">
      <!-- Graph canvas -->
      <div class="canvas" bind:this={container}>
        {#if loading}
          <div class="overlay">
            <LoadingPanel
              title="Building the knowledge graph"
              phase={loadPhase === 'layout' ? 'Laying out the graph' : 'Projecting terms and relations'}
              detail={loadDetail}
              progress={loadProgress}
            />
          </div>
        {:else if error}
          <p class="overlay error">{error}</p>
        {/if}
      </div>

      <!-- Detail panel -->
      <aside class="detail">
        {#if selected}
          <section class="selection-panel">
            <header class="selection-header">
              <span class="kind-tag">{KIND_LABELS[selected.kind] ?? EDGE_KIND_LABELS[selected.kind] ?? selected.kind}</span>
              {#if selected.module}
                <span class="module-tag" title="Declared by the {selected.module} module (ADR 0043)">{selected.module}</span>
              {/if}
              <span class="header-spacer"></span>
              {#if !selected.source}
                <button
                  type="button"
                  class="close hide-btn"
                  onclick={hideSelectedNode}
                  aria-label="Set this node aside"
                  title="Set aside — remove from the canvas without changing the scope (x)"
                >⊘</button>
              {/if}
              <button type="button" class="close" onclick={clearSelection} aria-label="Clear selection" title="Clear selection (Esc)">✕</button>
            </header>
            <h2 class="selection-title">{selected.recordLabel ?? selected.label}</h2>

            <AnnotationPanel target={selected}>
              {#snippet between()}
                {#if selected.definition}
                  <p class="description">{selected.definition}</p>
                {/if}

                <!-- SKOS annotations. These were previously read only for OWL
                     classes, so concepts — the bulk of the vocabulary — showed
                     no definition at all. graph.js now enriches every node. -->
                {#if selected.altLabels?.length}
                  <p class="alt-labels">
                    <span class="alt-labels-tag">also</span>
                    {selected.altLabels.join(' · ')}
                  </p>
                {/if}

                {#each ANNOTATION_NOTES as note}
                  {#if selected[note.key]}
                    <section class="note note-{note.key}">
                      <h3 class="note-heading" title={note.hint}>{note.label}</h3>
                      <p>{selected[note.key]}</p>
                    </section>
                  {/if}
                {/each}

                <dl class="meta">
                  {#if selected.iri}
                    {@const docsUrl = docsUrlForIri(selected.iri)}
                    <!-- The copy control sits with the "IRI" label so the value
                         itself gets the full width of the card and truncates
                         with an ellipsis instead of wrapping or overflowing. -->
                    <div class="meta-row iri-row">
                      <dt>
                        IRI
                        <button
                          type="button"
                          class="copy-btn"
                          class:copied={iriCopied}
                          onclick={copyIri}
                          title={iriCopied ? 'Copied' : `Copy ${selected.iri}`}
                          aria-label="Copy full IRI"
                        >
                          {#if iriCopied}
                            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                          {:else}
                            <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M10.5 3.5h-7a1 1 0 0 0-1 1v7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
                          {/if}
                        </button>
                      </dt>
                      <dd>
                        <a href={selected.iri} target="_blank" rel="noreferrer" title={selected.iri}>{toCurie(selected.iri)}</a>
                      </dd>
                    </div>
                    {#if docsUrl}
                      <div class="meta-row">
                        <dt>Docs</dt>
                        <dd>
                          <a href={docsUrl} target="_blank" rel="noreferrer" title="WIDOCO reference documentation for this term">Reference entry</a>
                        </dd>
                      </div>
                    {/if}
                    <!-- The return leg of the Patch Studio bridge. Until this
                         row existed a reader could go from a knob to its term
                         and never back: see PATCH_STUDIO.md §10.4. -->
                    {@const studio = studioAffordanceForIri(selected.iri)}
                    {#if studio}
                      <div class="meta-row">
                        <dt>Patch Studio</dt>
                        <dd><a href={studio.href} title={studio.title}>{studio.label}</a></dd>
                      </div>
                    {/if}
                  {/if}
                  {#if selected.externalParents?.length}
                    <!-- Upper-ontology grounding. Not drawn on the canvas: 83 of
                         the ~100 external parents are "information content
                         entity" alone, so edges to them would collapse the graph
                         into one hub. Listing them here keeps the alignment
                         visible without the clutter. -->
                    <div class="meta-row">
                      <dt>Aligned to</dt>
                      <dd>
                        {#each selected.externalParents as parent, index}
                          {#if index > 0}, {/if}<a
                            href={parent.iri}
                            target="_blank"
                            rel="noreferrer"
                            title={`${parent.iri} — upper-ontology parent, not drawn on the canvas`}
                          >{parent.label}</a>
                        {/each}
                      </dd>
                    </div>
                  {/if}
                  {#if selected.notation}
                    <div class="meta-row">
                      <dt>Notation</dt>
                      <dd><code>{selected.notation}</code></dd>
                    </div>
                  {/if}
                  {#if selected.scheme}
                    <div class="meta-row">
                      <dt>Scheme</dt>
                      <dd>{localName(selected.scheme).replace('Scheme', '')}</dd>
                    </div>
                  {/if}
                  {#if selected.layer}
                    <div class="meta-row">
                      <dt>Layer</dt>
                      <dd>{selected.layer === 'ecosystem'
                        ? 'Live stakeholder network'
                        : selected.layer === 'catalog'
                          ? 'Versioned catalog'
                          : selected.sourceLabel ?? selected.layer}</dd>
                    </div>
                  {/if}
                  {#if selected.recordLabel}
                    <div class="meta-row">
                      <dt>Record</dt>
                      <dd>{selected.recordLabel}</dd>
                    </div>
                  {/if}
                  {#if selected.relationshipType}
                    <div class="meta-row">
                      <dt>Relation</dt>
                      <dd>{selected.relationshipType}</dd>
                    </div>
                  {/if}
                  {#if selected.publicationStatus}
                    <div class="meta-row">
                      <dt>Status</dt>
                      <dd>
                        <span class="status-chip" class:pending={selected.isPending}>{selected.publicationStatus}</span>
                        {#if selected.isPending}
                          <small class="status-note">Not yet confirmed by the {selected.pendingSubjectNoun ?? 'party'} this record describes.</small>
                        {/if}
                      </dd>
                    </div>
                  {/if}
                  {#if selected.purpose}
                    <div class="meta-row">
                      <dt>Purpose</dt>
                      <dd>{selected.purpose}</dd>
                    </div>
                  {/if}
                  {#if selected.roles?.length}
                    <div class="meta-row">
                      <dt>Role</dt>
                      <dd>{selected.roles.join(', ')}</dd>
                    </div>
                  {/if}
                  {#if selected.validFrom || selected.validUntil}
                    <div class="meta-row">
                      <dt>Validity</dt>
                      <dd>{selected.validFrom || '…'} → {selected.validUntil || 'current'}</dd>
                    </div>
                  {/if}
                  {#if selected.reviewedOn}
                    <div class="meta-row">
                      <dt>Reviewed</dt>
                      <dd>{selected.reviewedOn}</dd>
                    </div>
                  {/if}
                  {#if selected.created}
                    <div class="meta-row">
                      <dt>Created</dt>
                      <dd>{selected.created}</dd>
                    </div>
                  {/if}
                  {#if selected.modified}
                    <div class="meta-row">
                      <dt>Modified</dt>
                      <dd>{selected.modified}</dd>
                    </div>
                  {/if}
                  {#if selected.source}
                    <div class="meta-row">
                      <dt>Source</dt>
                      <dd>
                        <button type="button" class="meta-nav" onclick={() => selectNodeById(selected.source)}>
                          {selected.sourceLabel ?? localName(selected.source)}
                        </button>
                      </dd>
                    </div>
                    <div class="meta-row">
                      <dt>Target</dt>
                      <dd>
                        <button type="button" class="meta-nav" onclick={() => selectNodeById(selected.target)}>
                          {selected.targetLabel ?? localName(selected.target)}
                        </button>
                      </dd>
                    </div>
                  {/if}
                  {#if selected.sources?.length || selected.sourceLinks?.length}
                    <div class="meta-row">
                      <dt>Sources</dt>
                      <dd class="source-links">
                        {#each selected.sources ?? selected.sourceLinks as source, index}
                          <a href={source} target="_blank" rel="noreferrer">{index + 1}</a>
                        {/each}
                      </dd>
                    </div>
                  {/if}
                </dl>

                {#if !selected.source && neighbors.length}
                  <section class="neighbors">
                    <header class="connections-header">
                      <h3 class="section-heading">
                        Connections
                        {#if connectionFilters.size > 0 && filteredNeighbors.length !== neighbors.length}
                          <span class="muted">({filteredNeighbors.length} of {neighbors.length})</span>
                        {:else}
                          <span class="muted">({neighbors.length})</span>
                        {/if}
                      </h3>
                      <button
                        type="button"
                        class="focus-btn"
                        class:active={neighborhoodFocus}
                        onclick={toggleNeighborhoodFocus}
                        title={neighborhoodFocus ? 'Show the full graph again' : 'Show only this node and its 1-hop neighbors'}
                      >
                        {neighborhoodFocus ? 'Exit focus' : 'Focus neighborhood'}
                      </button>
                    </header>

                    <div class="focus-transition">
                      {@render transitionControl('Speed of the focus, fit and pan animation.')}
                    </div>

                    {#if connectionKinds.length > 1}
                      <div class="kind-pills" role="group" aria-label="Filter connections by edge kind">
                        {#each connectionKinds as [kind, count]}
                          <button
                            type="button"
                            class="kind-pill"
                            class:disabled={connectionFilters.has(kind)}
                            style="--edge-color: {COLORS[kind] ?? '#888'}"
                            aria-pressed={!connectionFilters.has(kind)}
                            onclick={() => toggleConnectionFilter(kind)}
                            title={connectionFilters.has(kind) ? `Show ${EDGE_KIND_LABELS[kind] ?? kind}` : `Hide ${EDGE_KIND_LABELS[kind] ?? kind}`}
                          >
                            <span class="dot" aria-hidden="true"></span>
                            {EDGE_KIND_LABELS[kind] ?? kind}
                            <span class="count">{count}</span>
                          </button>
                        {/each}
                      </div>
                    {/if}

                    {#if filteredNeighbors.length === 0}
                      <p class="empty-connections"><small>No connections match the active filters.</small></p>
                    {:else}
                      {#snippet neighborCard(n)}
                        <li>
                          <button
                            type="button"
                            class="neighbor-btn neighbor-{n.direction}"
                            style="--edge-color: {COLORS[n.kind] ?? '#888'}"
                            onclick={() => n.kind === 'ecosystemRelationship'
                              ? selectElementById(n.edgeId)
                              : selectNodeById(n.id)}
                          >
                            {#if n.direction === 'out'}
                              <span class="neighbor-edge">
                                <span class="edge-name">{n.edgeLabel || EDGE_KIND_LABELS[n.kind] || n.kind}</span>
                                <span class="dir" aria-hidden="true">→</span>
                              </span>
                              <span class="neighbor-label">{n.label}</span>
                            {:else}
                              <span class="neighbor-label">{n.label}</span>
                              <span class="neighbor-edge">
                                <span class="dir" aria-hidden="true">←</span>
                                <span class="edge-name">{n.edgeLabel || EDGE_KIND_LABELS[n.kind] || n.kind}</span>
                              </span>
                            {/if}
                          </button>
                        </li>
                      {/snippet}

                      {#if groupedNeighbors.out.length}
                        <div class="connection-group">
                          <h4 class="sub-heading">Outgoing <span class="muted">({groupedNeighbors.out.length})</span></h4>
                          <ul>
                            {#each groupedNeighbors.out as n (n.edgeId)}
                              {@render neighborCard(n)}
                            {/each}
                          </ul>
                        </div>
                      {/if}
                      {#if groupedNeighbors.inc.length}
                        <div class="connection-group">
                          <h4 class="sub-heading">Incoming <span class="muted">({groupedNeighbors.inc.length})</span></h4>
                          <ul>
                            {#each groupedNeighbors.inc as n (n.edgeId)}
                              {@render neighborCard(n)}
                            {/each}
                          </ul>
                        </div>
                      {/if}
                    {/if}
                  </section>
                {/if}
              {/snippet}
            </AnnotationPanel>
          </section>
        {:else}
          {#if graphStats}
            <section class="stats">
              <h4>RDF source</h4>
              <dl>
                <div>
                  <dt>Quads</dt>
                  <dd>{graphStats.quads}</dd>
                </div>
                <div>
                  <dt>Named graphs</dt>
                  <dd>{graphStats.graphs}</dd>
                </div>
              </dl>

              <h4>Visible graph</h4>
              <dl>
                <div>
                  <dt>Nodes</dt>
                  <dd>{graphStats.nodes}</dd>
                </div>
                <div>
                  <dt>Edges</dt>
                  <dd>{graphStats.edges}</dd>
                </div>
              </dl>

              <!-- Always rendered, never only when non-zero: a reader looking
                   at a hand-pruned canvas has to be able to see that it is one. -->
              <dl>
                <div class:muted-stat={hiddenNodes.size === 0}>
                  <dt>Set aside</dt>
                  <dd>{hiddenNodes.size}</dd>
                </div>
                <div class:muted-stat={scopeFilterCount === 0}>
                  <dt>Filters</dt>
                  <dd>{scopeFilterCount}</dd>
                </div>
              </dl>

              <h4>Node types</h4>
              <ul class="stats-list">
                {#each graphStats.nodeCounts as [kind, count]}
                  <li><span>{kind}</span><strong>{count}</strong></li>
                {/each}
              </ul>

              <h4>Edge types</h4>
              <ul class="stats-list">
                {#each graphStats.edgeCounts as [kind, count]}
                  <li><span>{kind}</span><strong>{count}</strong></li>
                {/each}
              </ul>

              <h4>Motion</h4>
              {@render transitionControl('Applies to focus, fit and pan. 0 disables animation.')}
            </section>
          {/if}
        {/if}
      </aside>
    </div>
  </section>

</div>

<InfoModal
  title="Data sources"
  subtitle="The canvas draws three layers at once. They differ in how they are governed, not just in where they come from."
  open={sourceGuideOpen}
  onClose={() => (sourceGuideOpen = false)}
>
  <dl class="source-guide">
    <div>
      <dt><span class="source-dot versioned"></span>Ontology &amp; vocabulary <span class="guide-tag">versioned</span></dt>
      <dd>{SOURCE_NOTES.ontology}</dd>
    </div>
    <div>
      <dt><span class="source-dot catalog"></span>Catalog <span class="guide-tag">versioned</span></dt>
      <dd>{SOURCE_NOTES.catalog}</dd>
    </div>
    <div>
      <dt>
        <span class="source-dot live {liveStatus?.state ?? 'unknown'}"></span>Live stakeholders
        <span class="guide-tag live">{liveStatusLabel(liveStatus?.state)}</span>
      </dt>
      <dd>
        {SOURCE_NOTES.ecosystem}
        {#if liveStatus?.message}
          <span class="guide-status">
            {liveStatus.state === 'available'
              ? `Currently ${liveStatus.quadCount} public quads.`
              : liveStatus.message}
          </span>
        {/if}
      </dd>
    </div>
  </dl>
  <p class="guide-footer">See the <a href={applicationRoute('/ecosystem/')}>SSTIM ecosystem</a> for the full picture.</p>
</InfoModal>

<style>
  .graph-shell {
    display: flex;
    gap: 0;
    height: calc(100vh - var(--app-header-height, 56px) - var(--app-bottom-dock-height, 48px));
    overflow: hidden;
    background: var(--app-bg);
    color: var(--app-text);
  }

  .controls {
    width: 248px;
    flex-shrink: 0;
    padding: 0.75rem;
    overflow-y: auto;
    background: var(--app-surface);
    border-right: var(--app-border-width) solid var(--app-border);
    color: var(--app-text);
    font-size: 0.8rem;
  }

  .controls strong,
  .stats h4 {
    color: var(--app-text-strong);
  }

  /* Section header: title plus its inline affordances (refresh, "what is
     this?"). Keeps each block's controls on the title line rather than
     spending a full row of the sidebar on them. */
  .panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
    min-height: 1.5rem;
  }
  .panel-head.spaced { margin-top: 0.9rem; }

  .panel-head-actions {
    display: flex;
    align-items: center;
    gap: 0.15rem;
  }

  .icon-btn {
    width: 1.4rem;
    height: 1.4rem;
    margin: 0;
    padding: 0;
    border: var(--app-border-width) solid transparent;
    border-radius: var(--app-radius);
    background: transparent;
    color: var(--app-muted);
    font-size: 0.8rem;
    line-height: 1;
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .icon-btn svg { width: 0.85rem; height: 0.85rem; display: block; }
  .icon-btn:hover:not(:disabled) {
    background: var(--app-accent-soft);
    border-color: var(--app-accent);
    color: var(--app-text-strong);
  }
  .icon-btn:disabled { opacity: 0.45; cursor: default; }

  .icon-btn svg.spinning {
    animation: icon-spin 1s linear infinite;
    transform-origin: 50% 50%;
  }
  @keyframes icon-spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) {
    .icon-btn svg.spinning { animation: none; }
  }

  .clear-highlight {
    margin: 0;
    padding: 0.05rem 0.35rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: 999px;
    background: transparent;
    color: var(--app-muted);
    font-size: 0.62rem;
    line-height: 1.4;
    cursor: pointer;
    width: auto;
  }
  .clear-highlight:hover { border-color: var(--app-accent); color: var(--app-text-strong); }

  .source-list {
    list-style: none;
    padding: 0;
    margin: 0.35rem 0 0;
    display: grid;
    gap: 0.2rem;
  }

  /* One compact line per source: dot, name, state. */
  .source-list li {
    display: grid;
    grid-template-columns: 0.55rem 1fr auto;
    align-items: center;
    gap: 0.4rem;
    min-width: 0;
  }

  .source-name {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--app-text-strong);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .source-state {
    font-size: 0.56rem;
    color: var(--app-muted);
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  .source-dot {
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 50%;
    background: var(--app-muted);
    flex-shrink: 0;
  }
  .source-dot.versioned { background: #4fc3f7; }
  .source-dot.catalog { background: #ffca28; }
  .source-dot.live.available { background: #2e7d32; }
  .source-dot.live.empty { background: #f9a825; }
  .source-dot.live.unavailable { background: #c62828; }
  .source-dot.live.loading { background: #0288d1; }

  /* Data-source guide (inside the modal) */
  .source-guide {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    margin: 0;
  }
  .source-guide dt {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-weight: 700;
    font-size: 0.82rem;
    color: var(--app-text-strong);
  }
  .source-guide dd {
    margin: 0.25rem 0 0 1rem;
    font-size: 0.78rem;
    line-height: 1.5;
  }
  .guide-tag {
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 0.05rem 0.35rem;
    border-radius: 999px;
    background: var(--app-surface-3);
    color: var(--app-muted);
  }
  .guide-status {
    display: block;
    margin-top: 0.3rem;
    color: var(--app-muted);
    font-size: 0.74rem;
  }
  .guide-footer {
    margin: 0.9rem 0 0;
    font-size: 0.75rem;
    color: var(--app-muted);
  }

  .layer-list, .legend-list {
    list-style: none;
    padding: 0;
    margin: 0.35rem 0 0;
  }
  .layer-list li, .legend-list li {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--app-text);
  }
  .layer-list li { padding: 3px 0; }
  .layer-list label { display: flex; align-items: center; gap: 6px; cursor: pointer; }

  /* Legend rows are buttons: click to spotlight that type in the canvas. */
  .legend-btn {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    margin: 0;
    padding: 2px 4px;
    border: var(--app-border-width) solid transparent;
    border-radius: var(--app-radius);
    background: transparent;
    color: var(--app-text);
    font-size: inherit;
    line-height: 1.35;
    text-align: left;
    cursor: pointer;
  }
  .legend-btn:hover:not(:disabled) {
    background: var(--app-surface-2);
    border-color: var(--app-border);
  }
  /* Spotlight active */
  .legend-btn.on {
    background: var(--app-accent-soft);
    border-color: var(--app-accent);
    color: var(--app-text-strong);
    font-weight: 600;
  }
  /* Type of the currently selected node — a readout, not a mode, so it is
     marked with an edge bar rather than the filled accent used by .on. */
  .legend-btn.current {
    color: var(--app-text-strong);
    font-weight: 600;
    padding-left: 7px;
    box-shadow: inset 3px 0 0 var(--app-accent);
  }
  .legend-btn.current::after {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--app-accent);
    flex-shrink: 0;
  }
  .legend-btn.empty { opacity: 0.4; cursor: default; }
  /* Filtered out by the type checkbox — struck through rather than dimmed, so
     it reads as "excluded by a choice" and not as "absent from the data". */
  .legend-btn.filtered .legend-label {
    text-decoration: line-through;
    opacity: 0.55;
  }

  .legend-check {
    flex-shrink: 0;
    margin: 0;
  }

  .hidden-list {
    list-style: none;
    padding: 0;
    margin: 0.35rem 0 0;
  }
  .hidden-list li { display: flex; }
  .hidden-btn {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    padding: 2px 4px;
    border: var(--app-border-width) solid transparent;
    border-radius: var(--app-radius);
    background: transparent;
    color: var(--app-muted);
    font-size: inherit;
    line-height: 1.35;
    text-align: left;
    cursor: pointer;
  }
  .hidden-btn:hover {
    background: var(--app-surface-2);
    border-color: var(--app-border);
    color: var(--app-text-strong);
  }
  .hidden-btn .legend-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .hidden-restore {
    margin-left: auto;
    flex-shrink: 0;
    font-size: 0.7rem;
  }

  .legend-count {
    font-size: 0.58rem;
    font-variant-numeric: tabular-nums;
    color: var(--app-muted);
    flex-shrink: 0;
    margin-left: auto;
  }
  .legend-btn.on .legend-count { color: var(--app-accent); }

  .swatch {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  /* Long scheme/type names ("Catalog implementation", "StimulationMechanism")
     wrap rather than truncate — an abbreviated legend entry is guesswork, and
     these names are the vocabulary the rest of the UI refers to. */
  .legend-label {
    flex: 1;
    min-width: 0;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .anim-control {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .anim-label {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.4rem;
    font-size: 0.7rem;
    color: var(--pico-muted-color);
  }
  .anim-label label { margin: 0; cursor: pointer; }

  .anim-value {
    font-variant-numeric: tabular-nums;
    color: var(--app-text-strong);
  }

  .anim-control input[type='range'] {
    width: 100%;
    margin: 0;
    accent-color: var(--app-accent);
  }

  .anim-hint {
    color: var(--pico-muted-color);
    font-size: 0.66rem;
    line-height: 1.3;
  }

  .graph-workspace {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .graph-body {
    flex: 1;
    min-height: 0;
    display: flex;
  }

  .canvas {
    flex: 1;
    min-width: 0;
    position: relative;
    background: var(--app-canvas);
  }

  .overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    width: min(24rem, 80%);
    transform: translate(-50%, -50%);
    text-align: center;
    color: var(--app-muted);
  }
  .overlay.error { color: var(--app-error); }

  .detail {
    width: 360px;
    flex-shrink: 0;
    padding: 0.85rem 0.9rem;
    overflow-y: auto;
    background: var(--app-surface);
    border-left: var(--app-border-width) solid var(--app-border);
    color: var(--app-text);
    font-size: 0.82rem;
    line-height: 1.4;
  }

  .selection-panel {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }

  .selection-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin: 0;
  }
  .header-spacer { flex: 1; }

  .kind-tag {
    font-size: 0.66rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--pico-muted-color);
  }

  /* Which ADR 0043 module declares this term. Monospace because it is the
     manifest id, the same token a profile's dct:requires names. */
  .module-tag {
    font-family: var(--app-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
    font-size: 0.62rem;
    padding: 1px 5px;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    color: var(--app-muted);
    white-space: nowrap;
  }

  .close {
    width: 1.6rem;
    height: 1.6rem;
    margin: 0;
    padding: 0;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    background: transparent;
    color: var(--app-text);
    font-size: 0.8rem;
    line-height: 1;
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .close:hover { background: var(--app-accent-soft); color: var(--app-text-strong); border-color: var(--app-accent); }

  .selection-title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    line-height: 1.3;
    text-wrap: balance;
  }

  .description {
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.5;
  }

  .meta {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin: 0;
    padding: 0.5rem 0.6rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    background: var(--app-surface-2);
  }

  .meta-row {
    display: grid;
    grid-template-columns: 4.2rem 1fr;
    align-items: baseline;
    gap: 0.5rem;
    font-size: 0.74rem;
  }

  .meta-row dt {
    color: var(--pico-muted-color);
    font-size: 0.66rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .meta-row dd {
    margin: 0;
    word-break: break-word;
  }

  .status-chip {
    display: inline-block;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    padding: 0.08rem 0.5rem;
    border-radius: 999px;
    background: var(--app-accent-soft);
    color: var(--app-accent);
    border: 1px solid var(--app-border);
  }

  .status-chip.pending {
    background: color-mix(in srgb, var(--app-warn, #ad6600) 16%, transparent);
    color: var(--app-warn, #ad6600);
    border-color: color-mix(in srgb, var(--app-warn, #ad6600) 40%, transparent);
  }

  .status-note {
    display: block;
    margin-top: 0.25rem;
    color: var(--pico-muted-color);
    font-size: 0.68rem;
    line-height: 1.4;
  }

  .source-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .source-links a {
    display: inline-grid;
    place-items: center;
    width: 1.35rem;
    height: 1.35rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: 50%;
    text-decoration: none;
  }

  .meta-nav {
    width: auto;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--app-accent);
    font: inherit;
    text-align: left;
    text-decoration: underline;
    cursor: pointer;
  }

  /* The copy button rides on the "IRI" label line, leaving the whole value
     column for the IRI itself — long CURIEs then truncate cleanly instead of
     pushing the button out of the card. */
  .iri-row dt {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .iri-row dd {
    min-width: 0;
  }

  .iri-row a {
    display: block;
    color: inherit;
    opacity: 0.85;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .copy-btn {
    flex-shrink: 0;
    width: 1.15rem;
    height: 1.15rem;
    margin: 0;
    padding: 0;
    background: transparent;
    border: var(--app-border-width) solid transparent;
    border-radius: var(--app-radius);
    color: var(--pico-muted-color);
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .copy-btn svg { width: 0.7rem; height: 0.7rem; display: block; }
  .copy-btn:hover {
    background: var(--app-accent-soft);
    border-color: var(--app-accent);
    color: var(--app-text-strong);
  }
  .copy-btn.copied { color: var(--app-ok); border-color: var(--app-ok); }

  /* SKOS annotation blocks under the definition */
  .alt-labels {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.35rem;
    margin: 0;
    font-size: 0.76rem;
    color: var(--app-muted);
  }
  .alt-labels-tag {
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--app-muted-2);
  }

  .note {
    margin: 0;
    padding: 0.45rem 0.6rem;
    border-left: 2px solid var(--app-border);
    background: var(--app-surface-2);
    border-radius: 0 var(--app-radius) var(--app-radius) 0;
  }
  .note-heading {
    margin: 0 0 0.15rem;
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--app-muted);
    cursor: help;
  }
  .note p {
    margin: 0;
    font-size: 0.78rem;
    line-height: 1.45;
  }
  .note-scopeNote { border-left-color: var(--app-accent); }
  .note-example { border-left-color: var(--app-ok); }
  .note-historyNote, .note-editorialNote { border-left-color: var(--app-muted-2); }

  /* Transition control, shown next to Focus neighborhood */
  .focus-transition {
    margin: 0 0 0.6rem;
    padding: 0.4rem 0.55rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    background: var(--app-surface-2);
  }

  .section-heading {
    margin: 0 0 0.4rem;
    font-size: 0.78rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--pico-muted-color);
  }

  .muted { opacity: 0.6; font-weight: 400; }

  .connections-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.4rem;
  }

  .connections-header .section-heading {
    margin: 0;
  }

  .focus-btn {
    width: auto;
    margin: 0;
    padding: 0.2rem 0.55rem;
    font-size: 0.7rem;
    font-weight: 500;
    background: transparent;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    color: inherit;
    cursor: pointer;
    white-space: nowrap;
  }
  .focus-btn:hover {
    background: var(--app-accent-soft);
    border-color: var(--app-accent);
  }
  .focus-btn.active {
    background: var(--app-accent-soft);
    border-color: var(--app-accent);
    color: var(--app-accent);
  }
  .focus-btn.active:hover {
    background: color-mix(in srgb, var(--app-accent-soft) 70%, var(--app-accent) 30%);
  }

  .neighbors ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.25rem;
  }

  .kind-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin: 0 0 0.5rem;
  }

  .kind-pill {
    width: auto;
    margin: 0;
    padding: 0.2rem 0.55rem;
    font-size: 0.7rem;
    font-weight: 500;
    line-height: 1;
    background: color-mix(in srgb, var(--edge-color, #888) 18%, transparent);
    border: 1px solid var(--edge-color, #888);
    border-radius: 0.85rem;
    color: var(--app-text);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.32rem;
  }
  .kind-pill .dot {
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 50%;
    background: var(--edge-color, #888);
    flex-shrink: 0;
  }
  .kind-pill .count {
    font-size: 0.65rem;
    opacity: 0.75;
  }
  .kind-pill:hover { filter: brightness(1.15); }

  .kind-pill.disabled {
    background: transparent;
    border-color: var(--app-border);
    color: var(--pico-muted-color);
  }
  .kind-pill.disabled .dot { opacity: 0.3; }
  .kind-pill.disabled:hover { filter: none; border-color: var(--app-accent); }

  .connection-group + .connection-group {
    margin-top: 0.55rem;
  }

  .sub-heading {
    margin: 0 0 0.3rem;
    font-size: 0.68rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--pico-muted-color);
  }

  .empty-connections {
    margin: 0.4rem 0 0;
    color: var(--pico-muted-color);
  }

  .neighbor-btn {
    box-sizing: border-box;
    width: 100%;
    margin: 0;
    padding: 0.4rem 0.55rem 0.4rem 0.6rem;
    background: transparent;
    border: var(--app-border-width) solid var(--app-border);
    border-left: 3px solid var(--edge-color, #888);
    border-radius: 0.3rem;
    color: inherit;
    text-align: left;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 0.18rem;
  }
  .neighbor-btn:hover {
    background: var(--app-accent-soft);
    border-color: var(--app-accent);
    border-left-color: var(--edge-color, #888);
  }

  .neighbor-label {
    font-size: 0.85rem;
    font-weight: 500;
    line-height: 1.25;
    color: var(--app-text-strong);
  }

  .neighbor-edge {
    font-size: 0.7rem;
    color: var(--edge-color, var(--pico-muted-color));
    font-weight: 500;
    letter-spacing: 0.02em;
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .neighbor-edge .dir {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    opacity: 0.85;
  }

  .stats {
    margin-top: 0;
  }

  .stats h4 {
    margin: 0.75rem 0 0.35rem;
    font-size: 0.8rem;
  }

  .stats dl {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin: 0 0 0.5rem;
  }
  .stats dl:last-of-type { margin-bottom: 0; }

  /* A zero here still occupies its tile: the point of the readout is that a
     non-zero value is impossible to miss, which only works if the row is
     always in the same place. */
  .stats dl div.muted-stat { opacity: 0.55; }

  .stats dl div {
    padding: 0.45rem 0.5rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    background: var(--app-surface-2);
  }

  .stats dt {
    color: var(--pico-muted-color);
    font-size: 0.68rem;
  }

  .stats dd {
    margin: 0.1rem 0 0;
    font-weight: 700;
    font-size: 0.92rem;
  }

  .stats-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .stats-list li {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.2rem 0;
    border-bottom: var(--app-border-width) solid var(--app-border-subtle);
  }

  .stats-list span {
    color: var(--pico-muted-color);
  }
</style>
