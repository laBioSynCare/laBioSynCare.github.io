// Single source for the release identifiers shown on public entrance surfaces.
//
// Before this module the homepage footer and CiteSstimModal each hard-coded
// their own copy, and both drifted to v0.7.0 while CITATION.cff and README.md
// had already moved to v0.11.0 — a stale-metadata bug, not a DOI identity
// problem. Import from here instead of retyping a DOI anywhere else.
//
// Authority is CITATION.cff at the repo root. On every release, update these
// four fields together with CITATION.cff, README.md, and CHANGELOG.md.
//
// Concept versus version DOI: the concept DOI resolves to the latest release
// and is what general references to SSTIM should use. The version DOI pins one
// immutable release and belongs in a bibliography entry that names a version.

export const RELEASE_VERSION = '0.11.0'
export const RELEASE_DATE = '2026-07-24'
export const VERSION_DOI = '10.5281/zenodo.21536124'
export const CONCEPT_DOI = '10.5281/zenodo.21286974'

export const NAMESPACE_IRI = 'https://w3id.org/sstim'
export const VERSION_IRI = `${NAMESPACE_IRI}/${RELEASE_VERSION}`

export const doiUrl = (doi) => `https://doi.org/${doi}`
