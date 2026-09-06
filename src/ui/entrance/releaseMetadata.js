// Single source for the release identifiers shown on public entrance surfaces.
//
// Before this module the homepage footer and CiteSstimModal each hard-coded
// their own copy, and both drifted two releases behind CITATION.cff and
// README.md — a stale-metadata bug, not a DOI identity problem. Import from
// here instead of retyping a DOI anywhere else.
//
// One source was not enough on its own: these four fields then went stale
// again, two releases behind, because `make truth-audit` scanned the prose
// that used to hold the numbers and not the module they had moved into.
// `scripts/truth-audit.mjs` now derives the release identity from void.ttl
// and sstim-core.ttl and compares it against this file, so a release that
// forgets to update it fails `make validate`.
//
// Authority is CITATION.cff at the repo root. On every release, update these
// fields together with CITATION.cff, README.md, and CHANGELOG.md.
//
// Concept versus version DOI: the concept DOI resolves to the latest release
// and is what general references to SSTIM should use. The version DOI pins one
// immutable release and belongs in a bibliography entry that names a version.

// The citation title, which the modal used to hard-code twice — once in the
// APA form and once in the BibTeX entry. Renaming BSC Lab to SSTIM Workbench
// meant editing three files that each held their own copy; truth-audit now
// compares this against CITATION.cff so the next rename cannot half-apply.
export const RELEASE_TITLE = 'SSTIM Workbench: Open Sensory Stimulation Platform and SSTIM Ontology'

export const RELEASE_VERSION = '0.16.0'
export const RELEASE_DATE = '2026-08-18'
export const VERSION_DOI = '10.5281/zenodo.22003777'
export const CONCEPT_DOI = '10.5281/zenodo.21286974'

// Facts about the ontology itself rather than the deposit, added for the
// schema.org description in `src/ui/seo/datasetJsonLd.js`. Same rule as the
// four above: `make truth-audit` compares each against its authority, which for
// these is `sstim-core.ttl` (title, licence, creator) and `void.ttl` (the
// canonical namespace-catalogue download), so structured data cannot quietly
// describe a licence or a title the ontology stopped carrying.
export const ONTOLOGY_TITLE = 'Sensory Stimulation Ontology (SSTIM)'
export const ONTOLOGY_LICENSE = 'https://creativecommons.org/licenses/by/4.0/'
export const CREATOR_ORCID = 'https://orcid.org/0000-0002-9699-629X'
export const CREATOR_NAME = 'Renato Fabbri'
// One line on purpose: truth-audit reads these with a line-anchored regex.
export const NAMESPACE_CATALOGUE_TTL = 'https://w3c-cg.github.io/sstim/ontology/sstim-namespace.ttl'

export const NAMESPACE_IRI = 'https://w3id.org/sstim'
export const VERSION_IRI = `${NAMESPACE_IRI}/${RELEASE_VERSION}`

export const doiUrl = (doi) => `https://doi.org/${doi}`
