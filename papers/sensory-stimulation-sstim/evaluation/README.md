# Paper evaluation: preregistration and results contract

**Status: protocol/planning only. No measurements or validation runs are reported by this directory.**

This directory is reserved for **reproducible evaluation of the paper's claims**, rather than implementation artifacts that happen to pass internal tests.

## Evaluation identifier and reproducibility manifest

Before any first result, commit an evaluation manifest with:

- SSTIM frozen release, Git SHA and DOI, module/profile closure, validator/shapes versions.
- Baseline schema(s), their explicit versions and comparable task instructions.
- Evaluation dataset source, selection criteria, hashes, permissions, and train/test or blind split.
- Toolchain (Nix, Node, Python, pySHACL, ROBOT/HermiT, query engine) with exact versions.
- Commands, randomization and seeds, execution timing, stop conditions, and intended statistical treatment.
- Metric definitions, expected-value fixtures, accepted failure classes, and independent review procedure.

Keep the evaluation independent of the mutable main branch; report it on the exact evaluated snapshot. Do not paste old CI figures as if rerun for this experiment.

## Four evaluation blocks

| Block | Input | Output to archive | Main risk |
| --- | --- | --- | --- |
| Ontology conformance | Frozen SSTIM fixtures, graph and rules | Exact command, validation report, counts, failures, commit | Conformance misreported as evidence of efficacy |
| Published-protocol representation | Documented protocol corpus | Source-to-term map, unknowns, missing data and ambiguity report | Filling absent details from assumption |
| Independent encoding | Matched source protocol and baseline instructions | Blind encodings, rubric, reviewer decisions | Author familiarity / inconsistent judgment |
| AI cross-system exchange | Sealed questions and pinned models | Prompts, outputs, schema reports, error classes, semantic scores | Prompt contamination, model/version drift |

## Planned evaluation file layout

- data/: non-personal source excerpts and independently created protocol artifacts with source rights documented.
- scripts/: commands to regenerate validation and scoring reports.
- results/: generated outputs labeled with commit, environment and date.
- rubric.md: explicit rubric distinguishing syntax, semantics, evidence discipline and delivery fidelity.
- manifest.json: evaluation environment and source hashes.

Do not commit identifiable participant observations, confidential correspondence, invitations or unpublished collaborator data.

## Scoring rubric, draft

- **Parameter preservation:** fraction of required stimulus parameters represented with correct value, unit and intended layer.
- **Unknowns captured:** fraction of missing source parameters explicitly preserved as unspecified, not guessed.
- **Evidence correctness:** count of unsupported claims and violations of outcome/observation distinction.
- **Semantic coverage:** competency questions answered correctly with declared profile and comparison baseline.
- **Interoperability:** whether another implementation can interpret without semantic loss, including an explicit loss report.
- **Reviewer disagreement:** independent inter-rater agreement; unresolved cases remain visible.
- **Cost / effort:** human editing time and model/tool calls when controlled and measurable.

## Acceptance gates

1. Predefine evaluation questions, primary outcomes and comparison baselines before inspecting outcome differences.
2. Ground source protocol data in cited publications and preserve uncertainties instead of imputing convenient values.
3. Provide negative fixtures and report both failures and successes.
4. Include an independent investigator/encoder or acknowledge if the study only establishes internal consistency.
5. Distinguish machine-checked correctness from physical delivery, safety or beneficial outcomes.

## Existing material to reuse, not silently replace

- [Current ontology state](../../../docs/ontology/CURRENT_STATE.md)
- [Public use-case draft](../../../docs/ecosystem/USE_CASES_AND_REQUIREMENTS.md)
- [Published-protocol instances](../../../static/ontology/instances/protocols/)
- [Exploratory protocol instances](../../../static/ontology/instances/experiments/)
- [Competency queries](../../../test/competency/)
- [Native event and HED/BIDS scope](../../../docs/ecosystem/HED_BIDS_INTEROP.md)

**Do not introduce new SSTIM terms solely to optimize the paper's score.** A discovered semantic gap belongs in the ordinary, reviewed ontology workflow.
