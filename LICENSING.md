# SSTIM licensing and contribution scope

- **Effective migration decision:** 2026-08-23
- **Imported source boundary:** `6cf49c9edec2af6e626477ef8bd4095ce76c8e17`
- **History-preserving import merge:** `33622c7f233d8f1a7bd5fe9ea0adce5d98afaae9`
- **Decision:** preserve the existing licenses while importing the complete
  repository history, SSTIM, and SSTIM Workbench into `w3c-cg/sstim`

## Purpose

This repository contains an established open baseline and new work developed
through the W3C Sensory Stimulation Vocabulary Community Group. Repository
location does not relicense historical work. This document identifies which
terms apply to each artifact class and how the W3C contribution framework
coexists with the imported licenses.

The W3C Community Contributor License Agreement is an additional contribution
and intellectual-property framework for the SSTIM Specification. It does not
erase the imported baseline's Apache-2.0 or CC BY 4.0 grants, transfer historical
copyright, or change immutable releases.

## Scope matrix

| Artifact class | Paths/examples | Published license | Contribution framework | Status |
|---|---|---|---|---|
| SSTIM Workbench software | `src/`, application runtime, engines, Graph Navigator, Patch Studio, SPARQL interface | Apache License 2.0 | Apache-2.0 plus the repository contribution process | Non-normative reference software |
| Software build and deployment tooling | `scripts/`, `nix/`, `flake.nix`, SvelteKit/Vite configuration, workflows | Apache License 2.0 | Apache-2.0 plus the repository contribution process | Non-normative tooling |
| Ordinary software tests | unit, integration, browser, deployment and application-conformance tests not explicitly designated a W3C Test Suite | Apache License 2.0 | Apache-2.0 plus the repository contribution process | Software QA, not automatically a W3C Test Suite |
| Synthetic reference audio | generated loops under `static/audio/` | CC0 1.0 Universal | File/project notice and repository contribution process | Non-normative reference media |
| SSTIM ontology and vocabulary | `static/ontology/` live modules, SKOS, SHACL, profiles, mappings, contexts and public RDF data | CC BY 4.0 | W3C CLA for substantive Specification contributions, with CC BY 4.0 publication retained | SSTIM technical deliverables as designated by the CG |
| SSTIM documentation | `docs/` and the root narrative documents listed in `LICENSE-ontology` | CC BY 4.0 | W3C CLA where the material is part of the Specification; otherwise the applicable CG/report contribution terms | Normative or informative only as explicitly designated |
| Public reference/catalog data | preset catalog and other public reference data unless a file states otherwise | CC BY 4.0 | Applicable repository and CG contribution process | Nonnormative unless explicitly designated |
| Historical ecosystem brief | `static/docs/BioSynCare_Ecosystem_Brief_EN.pdf` | Existing file/rightsholder status retained; no new license is asserted by this migration | Do not modify or republish as a new CG deliverable without an explicit rights review | Historical, non-normative record |
| Other Community Group Reports | a deliverable explicitly designated as such by the CG | W3C Software and Document License unless the CG records another permitted treatment | Target `LICENSE.md` | Status stated by the report |
| Formal W3C conformance Test Suite | only material explicitly designated and published as a W3C Test Suite | W3C 3-clause BSD License | Target `LICENSE.md` and W3C test-suite process | Not inferred from a file living under `test/` |
| Target governance scaffold | `LICENSE.md`, `CODE_OF_CONDUCT.md`, `w3c.json` | Terms stated by those files | W3C Community Group process | Repository governance |

If a file carries a more specific license notice, that notice controls for
that file. When classification is unclear, do not silently change the license;
open a governance issue and obtain a maintainer/CG determination.

## Imported baseline

The source-main tree at `6cf49c9` and all preserved pre-migration refs and
commits retain the license and attribution supplied with that work:

- software, application runtime, build tooling, scripts and ordinary software
  tests: [Apache License 2.0](LICENSE);
- synthetic reference audio under `static/audio/`: [CC0 1.0
  Universal](LICENSE-audio);
- ontology, vocabulary, SHACL, profiles, mappings, public RDF/reference data and
  documentation: [CC BY 4.0](LICENSE-ontology); and
- copyright and attribution notices: [NOTICE](NOTICE).

The import preserves authorship and provenance in Git. It does not represent
retroactive assent by historical contributors to a different license. The
repository rights-holder/maintainer has confirmed that the Community Group
migration approval covers the complete history, the same licenses, SSTIM and
the complete non-normative SSTIM Workbench.

## Contributions after migration

Substantive contributions to the SSTIM Specification must be made by W3C
Community Group participants under the
[W3C Community Contributor License Agreement](https://www.w3.org/community/about/process/cla/).
The published machine-readable SSTIM ontology/vocabulary continues to identify
CC BY 4.0 in its RDF and distribution metadata.

Software contributions to SSTIM Workbench and its tooling continue under
Apache-2.0. Merely hosting software beside the Specification does not make it
normative or convert it into a Community Group Report.

Ordinary application tests continue under Apache-2.0. A test becomes a formal
W3C Test Suite only through an explicit CG designation and the corresponding
W3C publication/licensing process.

The target's standard [LICENSE.md](LICENSE.md) remains present. It states the
W3C contribution terms by category; it is not a blanket retroactive license for
the imported baseline.

## Notices, modifications and immutable records

Apache-2.0 redistribution conditions, relevant copyright/attribution notices,
and this repository's `NOTICE` must be retained where applicable. CC BY 4.0
material must receive appropriate attribution, a license reference and an
indication of modifications.

The versioned ontology snapshots and the three dated defensive publications
are immutable **inside this canonical repository** as a provenance and release
integrity policy. That maintenance policy is not an additional restriction on
the downstream adaptation rights granted by CC BY 4.0.

Do not rewrite historical tags, immutable releases, DOI records, released
citation metadata or historical license notices. A future release may update
current repository/distribution metadata prospectively after its own review.

The unmodified historical ecosystem brief at
`static/docs/BioSynCare_Ecosystem_Brief_EN.pdf` sits outside the paths expressly
listed by `LICENSE-ontology` and carries no detected file-level license marker.
The repository migration preserves the file and its provenance but does not
assign it a new license. Obtain a specific rights determination before adapting
it or presenting it as a new Community Group deliverable.

## Status boundary

SSTIM is work of the W3C Sensory Stimulation Vocabulary Community Group. A
Community Group Report is not a W3C Recommendation or W3C-endorsed standard.
SSTIM Workbench, Graph Navigator and Patch Studio are non-normative reference
software unless a future governing document explicitly states otherwise.

Questions about W3C contribution classification should be taken to the CG
chairs or `team-community-process@w3.org` before changing a file's license.
