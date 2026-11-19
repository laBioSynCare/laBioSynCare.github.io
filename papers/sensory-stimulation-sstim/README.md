# Sensory stimulation and SSTIM: academic paper workspace

**Status:** working manuscript, not submitted, peer reviewed, endorsed by the W3C Community Group, or an adopted SSTIM specification.  
**Language:** English. **Working genre:** ontology description / research infrastructure and methodology article.  
**Lead author (working attribution):** Renato Fabbri. Authorship, affiliations, contributions and acknowledgments must be confirmed prior to any submission.

## Research proposition

SSTIM offers an operational and machine-readable representation of sensory stimulation that keeps **stimulus design, intended delivery, actual exposure, neural/perceptual/behavioral response, and evidence-qualified interpretation** distinct. The testable contribution is whether this separation improves description, validation, reproducibility, interoperability and review of sensory stimulation research.

The manuscript does **not** claim that SSTIM proves entrainment, clinical effectiveness, or cognitive benefits. The reference Workbench, BioSynCare and the independent W3C Community Group have distinct roles. This manuscript is scholarly work by its listed authors, not a W3C Recommendation or an official Community Group report.

## Files

- [manuscript.md](manuscript.md): substantive English first draft with explicit evidence and integration placeholders.
- [RESEARCH_CONNECTIONS.md](RESEARCH_CONNECTIONS.md): proposed connections to AI and the research fields of Osvaldo N. Oliveira Jr., Roberto Vezzani, Alberto Levi and Cristina Iani. **No one is listed as a collaborator or coauthor without agreement.**
- [ROADMAP.md](ROADMAP.md): research questions, evaluation matrix, acceptance gates, manuscript and journal preparation.
- [references.bib](references.bib): starter bibliographic database. Entries must be verified against publishers before submission.
- [evaluation/README.md](evaluation/README.md): protocols, independent validation and result-reporting contract.
- [figures/README.md](figures/README.md): figures to generate from source artifacts.

## Canonical SSTIM sources

1. [Operational definition](../../docs/concept/SENSORY_STIMULATION.md)
2. [Current implementation state](../../docs/ontology/CURRENT_STATE.md)
3. [Module architecture](../../docs/ontology/MODULE_ARCHITECTURE.md)
4. [SSTIM scope](../../docs/concept/SCOPE.md) and [evidence framework](../../docs/concept/EVIDENCE_FRAMEWORK.md)
5. [Use cases and requirements](../../docs/ecosystem/USE_CASES_AND_REQUIREMENTS.md) (CG draft, not ratified)
6. [AI interoperability and evaluation proposal](../../docs/ecosystem/AI_INTEROPERABILITY_AND_EVALUATION_PROPOSAL.md) (proposal, not an adopted deliverable)
7. [Native event / HED / BIDS interoperability](../../docs/ecosystem/HED_BIDS_INTEROP.md)
8. [Citable released version metadata](../../static/ontology/void.ttl) and [citation](../../CITATION.cff)

**Citation discipline:** never cite mutable development branch content as a fixed release. Resolve the currently citable version from the release metadata before submission. The baseline verified at drafting was SSTIM v0.21.0 (2026-11-01), DOI 10.5281/zenodo.23868027.

## Publication decision

Preferred first manuscript: a focused **ontology/methodology paper** on the formal model, implementation and reproducible evaluation. A more expansive interdisciplinary review of sensory stimulation, AI, perception, cognition, ergonomics and social experience may deserve a separate article. Editors, indexing, fees and journal rules must be rechecked before submission.

## Evidence and authorship rules

- Never convert design fixtures, simulated sessions, or exploratory RDF protocols into reports of completed human studies.
- Never claim a validation run or numerical result without its command, commit, environment and archived output.
- Keep citation-backed established findings, repository implementation facts, and proposed extensions separate.
- The names in RESEARCH_CONNECTIONS.md denote **research areas and potential conversations**, not commitments, endorsements, consortium membership, contributions or coauthorship.
- Human-subjects work requires a separate study protocol, recruitment/consent/privacy arrangements, and any applicable ethics review before collecting research data.
