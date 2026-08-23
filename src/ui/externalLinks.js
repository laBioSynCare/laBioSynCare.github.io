import { applicationAsset } from '../config/applicationUrls.js'

// The off-app destinations the UI links to, in one place.
//
// Same reason as `entrance/releaseMetadata.js`, one level out: the W3C group URL
// was typed into three files (the entrance, its sticky conversion bar, and the
// About page), the repository URL into six, and `/ontology/docs/` into three. A
// URL duplicated across files is a URL that will be updated in some of them.
//
// Scope is deliberately narrow: destinations outside this application, stable
// enough to name here, and used by more than one surface. Per-instance values
// belong in `src/config/runtimeConfig.js` — nothing here varies by deployment.

export const GITHUB_URL = 'https://github.com/w3c-cg/sstim'

/** A file on the default branch: `ghBlob('docs/concept/SCOPE.md')`. */
export const ghBlob = (path) => `${GITHUB_URL}/blob/main/${path}`

export const W3C_GROUP_URL = 'https://www.w3.org/groups/cg/sstim/'

// The separate commercial application (CLAUDE.md §11): a different repository,
// a different codebase, sharing only the preset format and the SSTIM
// vocabulary. Already recorded in the ontology as the `dct:source` of the
// BioSynCare implementation record (ADR 0033), which is why the link belongs in
// the institutional footer rather than inside a door.
export const BIOSYNCARE_URL = 'https://biosyncare.com/'

// Historical contributor and steward of the BSC/BioSynCare implementation
// records. This does not make BioSynCare the identity or owner of SSTIM.
export const AETERNI_URL = 'https://aeterni.github.io/'

// Generated reference documentation — WIDOCO for the OWL core, pyLODE for the
// SKOS vocabulary. Same-origin paths, but they exist only in the deployed
// artifact (ADR 0023), so every link to them carries rel="external" to keep the
// prerender crawler and the SvelteKit router out. `static/ontology/docs/` holds
// a stub for local development, which CI overwrites.
export const ONTOLOGY_DOCS_URL = applicationAsset('/ontology/docs/')
export const VOCAB_DOCS_URL = applicationAsset('/ontology/docs/vocab/')

// Immutable historical collateral retained for provenance. It is intentionally
// no longer linked as current project architecture; docs/funding/documents/
// records that the binary must not be rewritten in place.
export const ECOSYSTEM_BRIEF_URL = applicationAsset('/docs/BioSynCare_Ecosystem_Brief_EN.pdf')
