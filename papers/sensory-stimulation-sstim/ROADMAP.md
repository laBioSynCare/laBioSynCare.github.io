# Manuscript development and publication roadmap

**Working plan, not an adopted SSTIM project roadmap or Community Group deliverable.** The goal is a defensible ontology-and-methods journal submission. A separate review or human experiment is optional and should not block a valid first paper.

## Target claim and falsification

**Candidate claim:** SSTIM can represent diverse sensory-stimulation protocols and outcomes with fewer missing distinctions, more verifiable semantics and better interoperable reuse than specified baselines.

**Null/negative possibility:** for an explicitly bounded task, simpler structured metadata or existing standards perform as well or better. This is publishable information and must not be hidden.

## Stage 0: Freeze the evaluated object

- [ ] Decide manuscript type: ontology description, methods article or software paper. Prioritize ontology description.
- [ ] Select a journal **after checking current aims, accepted article categories, open-access cost, word limits and data/code policy**.
- [ ] Pin a published SSTIM release (currently baseline: 0.21.0, DOI 10.5281/zenodo.23868027, 2026-11-01; resolve again at submission).
- [ ] Record manifest and shape closure, release tag, executable commands, JavaScript/Python/toolchain environment, license and references.
- [ ] Create a transparent contribution and conflict-of-interest section that mentions relevant BioSynCare founder/product interests.
- [ ] Do not change protected ontology files just to make figures or evaluation attractive.

**Acceptance:** every technical statement in the paper resolves to a frozen artifact, inspection command or external citation.

## Stage 1: Conceptual and related-work review

- [ ] Compare operational definitions of sensory stimulation across psychophysics, neurophysiology, intervention research, HCI and signal engineering.
- [ ] Analyze sensory versus perceptual versus cognitive stimulation and stimulation versus neuromodulation as distinct axes.
- [ ] Compare SSTIM to BFO, OBI, PROV-O, SKOS, HED, BIDS, relevant measurement/sensor ontologies and available domain alternatives.
- [ ] Give a specific example for each claimed representational gap; do not assert generic ontologies cannot express something without attempting a mapping.
- [ ] Cite peer-reviewed research on steady-state responses versus dynamical neural entrainment; align claims with experimental resolution.

**Acceptance:** a side-by-side capability matrix with grounded citations, limitations and at least one worked encoding in an alternative representation.

## Stage 2: Ontology quality and reproducibility

- [ ] Run the documented pinned release gates, with exact invocation and captured output: nix develop --command make validate; nix develop --command make test.
- [ ] Summarize competency queries, positive and adversarial examples, OWL consistency, SHACL validation, modular imports, namespace mappings and round-trip fidelity.
- [ ] Build an auditable coverage table for the existing literature-derived protocols and exploratory cases. Include unsupported or under-specified fields.
- [ ] Extract the core provenance graph from published protocol through session execution and report (synthetic example is clearly labeled).
- [ ] Archive machine-readable outputs with checkable hashes. No invented results or extrapolations from old CI runs.

**Acceptance:** a third party can regenerate the reported tables from the pinned source, or a limitation is explicitly documented.

## Stage 3: Independent semantic usefulness test

Pre-register a bounded cross-encoding exercise or at minimum publish its instructions before evaluation.

- [ ] Select a small representative and diverse corpus of protocol descriptions, including a multi-sensory, a sensory–non-sensory boundary, a feedback-controlled, and a deliberately incomplete case.
- [ ] Obtain at least one **independently authored** encoding, not merely another rewrite by the SSTIM maintainer.
- [ ] Require encoders to distinguish unspecified from unknown or negative statements.
- [ ] Compare a baseline representation with SSTIM: information retention, ambiguity, semantic mistakes, time to answer competency questions, and interoperability or data-loss rates.
- [ ] Include counterexamples, malformed stimuli and genuine ambiguous cases.
- [ ] Avoid implying statistical power from a very small convenience sample; report descriptive results when justified.

**Acceptance:** a preregistered rubric, blinded/independent adjudication where feasible, public non-personal fixtures, transparent errors and a reproducible analysis.

## Stage 4: AI interoperability ablation

- [ ] Confirm which current versioned SSTIM interfaces exist and their read-only / write constraints.
- [ ] Prepare a sealed set of tasks not present in the developer's own examples; preserve it from prompt/template tuning.
- [ ] Compare at least unconstrained LLM, generic-schema LLM and SSTIM-grounded LLM; add retrieval-only control if feasible.
- [ ] Hold model, prompting effort, task corpus and runtime conditions comparable where possible.
- [ ] Evaluate syntax separately from semantics: SHACL success, human-assessed parameter preservation, hallucinated evidence, unrepresented assumptions, unsupported engine assumptions, error-repair iterations.
- [ ] Include multiple model families only if they answer a testable generalization question; report the exact accessible model ID and evaluation date, not imagined internal builds.
- [ ] Publish prompts, baseline schemas, grader rubric and scoring code where licensing permits.

**Acceptance:** measurable value or defensible null findings, an ablation table and independently checkable failure analysis.

## Stage 5: Scientific experiment exemplars, not fabricated results

Choose one or two examples for detailed encoding. These are proposals until executed.

| Study family | Manipulations | Primary outcome to define | Main confound to control |
| --- | --- | --- | --- |
| Parametric auditory entrainment | carrier × beat/envelope × dose × technique | behavioral or EEG endpoint, defined in advance | device calibration, evoked responses, expectancy |
| Multisensory integration | audio/visual/tactile × relative phase × salience | defined multisensory behavioral/perceptual outcome | display latency, safety, attention |
| Social/shared sessions | synchronous/independent × co-present/alone × discussion | connection or task endpoint | social demand, expectancy, correlated stimuli |
| Ergonomic context | focus/rest/creative use × stimulation | task interference, preference, comfort | task difficulty, posture, familiarity |

- [ ] Represent protocol, exposure profile, device, session plan, execution, events, observations and interpretation separately.
- [ ] Define primary estimand, planned sample size rationale, randomization and analysis before real data collection.
- [ ] Note which questions can be assessed on a phone/computer and which require calibrated instruments.
- [ ] Respect photosensitivity, audio intensity and relevant individual contraindication controls.
- [ ] Do not collect or commit identifiable human observations into public SSTIM reference data. Separate ethics, consent and storage procedures first.

**Acceptance:** protocol representations validate; any human study is reported only after actual execution and review.

## Stage 6: Interdisciplinary integration

See [RESEARCH_CONNECTIONS.md](RESEARCH_CONNECTIONS.md) for individual research-interface proposals.

- [ ] **AI**: operational human-to-machine protocol exchange and reproducible benchmark.
- [ ] **Osvaldo N. Oliveira Jr.**: sensing, signal calibration and multivariate data visualization.
- [ ] **Roberto Vezzani**: visual/multimodal behavior measurement and ML validation.
- [ ] **Cristina Iani**: perception, attention, action, joint experience and study designs.
- [ ] **Alberto Levi**: workplace participation, consent, privacy, human agency and governance.
- [ ] Cite verified published work and integrate hypotheses into the *same example protocol* rather than creating promotional profiles.
- [ ] Ask for expert review only when the manuscript question is concrete. Do not claim participation without agreement.

**Acceptance:** every retained section adds a distinct method, falsifiable hypothesis, empirical measure or analytical limitation.

## Stage 7: Journal submission package

- [ ] Revise argument and title after independent critique.
- [ ] Finalize full references and check DOI-to-title/year/author matches.
- [ ] Generate source-derived figures and tables; provide captions, version and license.
- [ ] Complete results, limitations, competing interests, data/software availability, funding and individual author contributions.
- [ ] Select journal and adapt reference format, article class, anonymization and supplementary material accordingly.
- [ ] Confirm any authorship and acknowledgment permissions.
- [ ] Freeze a manuscript version/commit; prepare archival DOI if desirable without implying acceptance.
- [ ] Submit only after results are independently reproducible and reported honestly.

## Minimum publication-quality deliverables

1. Concise ontology design and modeling decisions, supported by pinned source files.
2. Comparative conceptual and standards table, with source citations and concrete encodings.
3. A reproducible technical evaluation with scripts, metrics, failures and pinned artifacts.
4. At least one substantive independent-usefulness test or explicit justification if the journal accepts an ontology-description paper without one.
5. Figure showing *design → delivery → response → observation → evidence*, with a representative RDF mapping.
6. Precise limitations, governance boundaries and reproducibility instructions.

**Non-goal:** claim or demonstrate universal entrainment, improvement of mental states, a health intervention, W3C approval, or named researchers' participation.
