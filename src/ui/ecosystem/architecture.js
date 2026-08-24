// Canonical public nomenclature for the SSTIM ecosystem pages. Keep these
// definitions in one place so the dedicated Ecosystem page and the shorter
// About-page explanation cannot drift into different architectures.

export const SSTIM_ECOSYSTEM_DEFINITION =
  'The SSTIM ecosystem centers on SSTIM, the open formalized knowledge standard. ' +
  'It also includes its reference tooling and community, and sensory-stimulation ' +
  'applications and initiatives whether or not they currently adopt or support SSTIM.'

export const ARCHITECTURE_ENTITIES = [
  {
    id: 'sstim',
    name: 'SSTIM',
    tag: 'Open formalized knowledge standard',
    color: 'var(--app-visual)',
    body:
      'The specification, RDF vocabulary, semantic infrastructure, documentation, ' +
      'interoperability work, and shared identifiers at the center of the SSTIM ecosystem.',
  },
  {
    id: 'workbench',
    name: 'SSTIM Workbench',
    tag: 'Non-normative reference software',
    color: 'var(--app-accent)',
    mark: 'bsclab',
    body:
      'The executable environment you are using now. Graph Navigator, Patch Studio, ' +
      'the SPARQL workbench, presets, and supporting engines exercise SSTIM without ' +
      'making Workbench behavior normative.',
  },
  {
    id: 'community-group',
    name: 'W3C Sensory Stimulation Vocabulary Community Group',
    tag: 'Open community',
    color: 'var(--app-control)',
    body:
      'The independent open forum in which SSTIM is developed. It is part of the SSTIM ' +
      'ecosystem; Community Group work is not a W3C Recommendation or W3C-endorsed technology.',
  },
  {
    id: 'biosyncare',
    name: 'BioSynCare',
    tag: 'Separate commercial application',
    color: 'var(--app-haptic)',
    mark: 'biosyncare',
    body:
      'A separate application with its own private code, catalog, and data. BioSynCare ' +
      'adopts and contributes to SSTIM, participates in the SSTIM ecosystem, and has an ' +
      'application-centered ecosystem that overlaps with it.',
  },
]

// These labels are deliberately non-exclusive. An entry may adopt, interoperate
// with, contribute to, and support SSTIM at the same time.
export const SSTIM_RELATIONSHIPS = [
  {
    id: 'adopts',
    label: 'Adopts SSTIM',
    description:
      'Public evidence shows use of named SSTIM terms, identifiers, profiles, or formats.',
  },
  {
    id: 'interoperates',
    label: 'Interoperates with SSTIM',
    description:
      'A documented mapping, import/export path, or adapter targets a named SSTIM release or profile.',
  },
  {
    id: 'contributes',
    label: 'Contributes to SSTIM',
    description:
      'Documented work contributes to the specification, vocabulary, documentation, interoperability work, or shared identifiers.',
  },
  {
    id: 'supports',
    label: 'Supports SSTIM',
    description:
      'Documented funding, hosting, advocacy, outreach, institutional, or research support.',
  },
  {
    id: 'referenced',
    label: 'Referenced by SSTIM',
    description:
      'SSTIM cites, describes, or maps the entry without implying participation, support, or adoption.',
  },
  {
    id: 'none-recorded',
    label: 'No SSTIM relationship recorded',
    description:
      'The entry belongs to the wider sensory-stimulation field, but this directory records no more specific SSTIM relationship.',
  },
]

export const DOMAIN_REVIEW_STATUSES = [
  {
    id: 'reviewed',
    label: 'Reviewed as sensory stimulation',
    description:
      'Public evidence was reviewed against SSTIM\'s operational domain definition. This is classification, not endorsement.',
  },
  {
    id: 'candidate',
    label: 'Candidate — review pending',
    description:
      'Public information suggests relevance to sensory stimulation, but classification has not yet been completed.',
  },
  {
    id: 'related',
    label: 'Related initiative',
    description:
      'Relevant standards, datasets, research infrastructure, communities, or other work that is not itself a stimulation-delivery implementation.',
  },
]

export const DIRECTORY_ENTRIES = [
  {
    id: 'biosyncare',
    name: 'BioSynCare',
    kind: 'Commercial sensory-stimulation application',
    relationships: ['adopts', 'contributes'],
    reviewStatus: 'reviewed',
    summary:
      'A separate closed-source application whose use of and contribution to SSTIM places it ' +
      'in the SSTIM ecosystem. Its private application code, catalog, and user data remain ' +
      'outside SSTIM Workbench.',
  },
]
