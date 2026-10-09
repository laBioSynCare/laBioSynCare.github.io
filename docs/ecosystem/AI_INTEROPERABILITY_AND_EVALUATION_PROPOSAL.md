# AI interoperability and evaluation for SSTIM

> **Status: strategic proposal, 2026-10-09. Not an adopted roadmap, W3C Community Group decision, released interface, or implementation commitment.**
>
> This document proposes a bounded AI-facing adoption and evaluation workstream.
> The maintainer and, where applicable, the Community Group must review it
> before adding tasks to `ROADMAP.md` or `TODO.md`. Existing ontology contracts
> and safety, evidence, publication, and privacy decisions remain authoritative.
>
> **Premise discipline.** The possibility that superhuman artificial general
> intelligence (SAGI) already exists motivates one scenario here; it is not a
> verified observation, a dependency, or a factual claim by SSTIM. The same
> interoperability needs arise with increasingly capable present-day AI agents.

**Broader conceptual direction.** This is an implementation-oriented companion
to the [evolving SSTIM reference proposal](../concept/EVOLVING_REFERENCE_DIRECTION_PROPOSAL.md).
That document frames SSTIM as a durable, format-independent, federated
knowledge reference rather than only an AI interoperability contract.

## 1. Recommendation and positioning

**Keep SSTIM's public mission universal and vendor-neutral:** shared semantic
descriptions and interoperability for sensory stimulation across research,
software, hardware, datasets, and institutions.

**Prioritize AI interoperability as a use case, not an identity change:**
test whether independent AI systems can understand, propose, exchange,
validate, and document sensory-stimulation specifications using SSTIM.

An intelligent system may infer domain knowledge without SSTIM. Intelligence
alone does not provide common identifiers, mutually accepted interfaces,
traceable implementation records, independent evidence assessments, or
reproducible exchanges between organizations. These are potential reasons to
adopt SSTIM, not demonstrated benefits until tested.

Three distinctions must survive every demonstration:

1. **Understanding is not interoperability.** Two agents can understand a
   request yet generate incomparable stimulus descriptions.
2. **A generated plan is not a delivered stimulus.** Intent, engine-dependent
   configuration, actual execution, delivery conditions, and observations are
   separate records.
3. **Schema conformance is not safety or efficacy.** Passing SHACL and
   containment checks does not validate physiological safety, clinical
   outcomes, causality, or delivery fidelity.

SSTIM is a semantic foundation, not an AI model, clinical guideline, safety
certifier, or physical-actuation protocol. Its independent W3C Community Group
is not a W3C Recommendation or a W3C endorsement.

## 2. What exists, and what this proposal does not presume

The implemented starting point is the manifest-selected Kernel, Core,
Core Plus, and Full profiles; OWL/SKOS semantics, RDF and JSON-LD;
SHACL and competency checks; pinned, citable releases; Python `sstim` and
JavaScript `@sstim/core` clients; and the SSTIM Workbench with a
non-normative audiovisual reference implementation. SSTIM already
distinguishes stimulation processes, engine-independent stimulus
specifications, engine-dependent presets, session plans, executed sessions,
and qualified observations and evidence.

For the as-built state, consult [Current State](../ontology/CURRENT_STATE.md)
and the authoritative [manifest](../../static/ontology/manifest.json).
For a citable release, resolve the current published version from
[VoID metadata](../../static/ontology/void.ttl). Avoid copying live
version and count facts into this proposal.

This document **does not claim** that SSTIM has a shipped MCP server, an
autonomous design agent, an AI-actuated execution API, complete BIDS/NWB
bindings, independently established efficacy, or broad third-party adoption.
It does not authorize modifications to protected ontology sources or
defensive publications.

The existing [LLM complementarity note](../concept/SSTIM_LLM_COMPLEMENTARITY.md)
states the conceptual relationship; the
[agent automation boundary](../technical/AGENT_AUTOMATION_BOUNDARY.md)
governs any contemplated agent workflow. Deterministic jobs remain in
deterministic tooling, and canonical changes require human review.

## 3. First deliverable: a reproducible AI-to-SSTIM demonstrator

**Question:** Can an independent AI client convert a natural-language
sensory design request into an interpretable SSTIM artifact that another
consumer validates and uses without silently changing the intended stimulus?

Illustrative task:

> Describe a ten-minute audiovisual stimulus with mild modulation, headphone
> delivery, and no flashing visuals. Preserve the intended duration, channels,
> and modulation semantics; cite the applicable source descriptions and
> limitations.

A *proposed* end-to-end pipeline:

1. Interpret the request; declare unspecified parameters and uncertainty
   rather than inventing physiological predictions.
2. Select the smallest appropriate pinned SSTIM profile and discover terms
   from its actual closure.
3. Produce a candidate engine-independent stimulus specification and any
   separately needed executable configuration. Keep adopters' instance IRIs
   outside SSTIM's namespace.
4. Apply existing semantic, shape, profile-containment, and namespace checks.
   Separately check configured engine capabilities and delivery-specific
   constraints; label every check by what it establishes.
5. With explicit user authorization, optionally interpret the configuration
   in the Workbench or an independent compatible implementation. An initial
   demonstration may stop at validation and **must not require physical
   execution or real participant data**.
6. Produce a provenance bundle linking request, pinned definitions, generated
   artifact, validation report, device/engine identity where applicable,
   intended parameters, measured or reported delivery, deviations, and
   separately collected observations. Do not treat an execution log as a
   physiological measurement.

**Acceptance:** someone not involved in building the demonstration can
re-run the steps, inspect the declared losses/unknowns, and reproduce the
validation outcome. A cross-engine reproduction claim requires defined
physical/perceptual tolerances and measurements; a successful RDF round-trip
alone is not reproduction of the signal.

Prefer reusable [adopter examples](../ADOPTING_SSTIM.md) and existing package
functions. No new ontology term should be minted solely to make the demo
easier. A validated file must not silently be promoted into canonical
SSTIM knowledge.

## 4. Evaluation: measure incremental AI value, not ability to imitate SSTIM

The principal research question is whether SSTIM produces a measurable
improvement in **independently assessed task quality**, compared with
equivalent non-SSTIM resources.

Use the same test cases under four experimental conditions:

| Condition | Available resources | Question answered |
|---|---|---|
| A. Baseline | AI model and task request only | What can the model do unaided? |
| B. Domain reference | Model plus equivalent sensory-science reference content in ordinary prose | Does additional domain information help? |
| C. SSTIM documentation | Model plus version-pinned SSTIM definitions and validated examples | Does structured terminology and exemplification help beyond domain content? |
| D. Tool-supported SSTIM | C plus read-only term queries and deterministic SSTIM validation | What do machine-readable constraints and tools add? |

Initially use a small, independently adjudicated, versioned task suite,
then expand it. Sample tasks across auditory, visual, haptic, cross-modal,
adaptive, research-description, and evidence-interpretation scenarios.
Include incomplete requests, incompatible device assumptions, unsupported
claims, and adversarial ambiguity. Do not seed the answer rubric exclusively
from the SSTIM model.

**Primary outcomes**, graded against domain reference cases independent of
SSTIM itself:

- Semantic fidelity: correctly preserved signals, modalities, timing,
  calibrated magnitudes, delivery assumptions, and intended versus actual
  distinctions.
- Cross-system interpretability: whether independent consumers can recover
  the intended description and report any loss.
- Evidence discipline: accuracy of source attribution, uncertainty, and the
  distinction among hypothesis, self-report, and supported proposition.
- Technical constraint handling: detection of deliberately incompatible or
  under-specified configurations.
- Reproducibility: comparison of measured output against declared tolerances,
  if actual rendering is tested.

**Secondary/process outcomes:** SHACL/profile conformance, undeclared SSTIM
terms, retries, latency, token cost, and failure types. Conformance is not the
primary outcome because rewarding SSTIM syntax would build the treatment into
the scoring rule.

Predefine tasks, evaluation rubrics, model versions, prompts, tool versions,
and run counts; hold resource budgets approximately constant where feasible.
Use multiple independent models, randomized/counterbalanced task order,
blind assessment where practical, and confidence intervals or uncertainty
estimates on between-condition differences. Include a non-AI deterministic
baseline for tasks for which it is appropriate.

Possible reporting statistic:

`Delta_Q = Q(with_SSTIM) - Q(baseline)`,

with Q measured on an external task-quality rubric rather than on SSTIM
schema compliance. Report the comparison to condition B separately: it
isolates what structured SSTIM contributes beyond additional subject-matter
information.

**Negative or null results are decision-relevant.** Determine whether the
bottleneck is poor discoverability, weak examples, incomplete semantics,
model/tool integration, benchmark design, or a task that gains little from a
shared vocabulary. Do not claim an improvement before measurement.

This benchmark can also serve as a separate **AI evaluation resource**:
independent developers might evaluate model competence in sensory science
without adopting SSTIM as their production interchange format. Record
benchmark usage separately from standards adoption.

## 5. Optional read-only AI interface

Expose a small, tool-neutral read-only surface before choosing or investing
in a particular agent framework:

| Candidate operation | Input/output intention | Existing foundation |
|---|---|---|
| `discover_profiles` | Discover release/profile closures and supported validation | Manifest and published profiles |
| `search_terms` / `describe_term` | Find definitions with exact IRIs and provenance | RDF, SKOS, SPARQL |
| `find_examples` | Retrieve profile-labelled, validated examples | Examples and package checks |
| `validate_candidate` | Return conformance, containment, and namespace results | Python/JS packages, with declared differences |
| `query_evidence` | Return qualified source-specific claims, not prescriptions | Evidence structures and queries |

Tool names are illustrative, **not existing APIs**. A possible Model Context
Protocol (MCP) adapter could expose resources/tools around these operations,
but MCP is transport/invocation, not the ontology. An OpenAPI interface may
serve other consumers. Agent2Agent and Web of Things integration should be
considered only for a concrete external interoperability use case, not added
as parallel mandatory infrastructure.

Do not build an LLM loop for deterministic querying or validation. Do not
silently infer absent validation support: for example, the JavaScript
client's Full-profile SHACL-SPARQL limitation must be represented explicitly.
An AI-facing interface initially has **no ontology-write, publication, or
stimulation-execution authority**.

Any future execution adapter is a different layer, requiring explicit
authorization, separately enforced constraints, compatible hardware,
traceable execution, and a clear ability to refuse unsupported requests.
The ontology alone cannot authorize actuation.

## 6. Independent adoption and scientific interoperability

The decisive infrastructure milestone is **one independently owned,
public, conformant SSTIM artifact under an adopter-controlled namespace**.
A protocol SSTIM contributors encode for an external partner is a useful
assisted-adoption step, but distinguish it from the partner independently
maintaining or consuming the artifact.

Begin recruitment in parallel with the demonstration; do not wait for an
MCP implementation. Offer to encode a nominated protocol, ask the external
owner to verify semantics, and record which work was independently performed.
Use [ADOPTION.md](ADOPTION.md) for the definition and measurement of
adoption and [ECOSYSTEM_INTEGRATION.md](ECOSYSTEM_INTEGRATION.md)
for the living external-ecosystem tracker. This proposal does not create a
second outreach list or adoption ledger.

A separate scientific demonstration can use SSTIM session/exposure semantics,
the existing bounded HED event profile, and eventually a complete BIDS
Behavioral binding where there is a real research need. Do not describe the
current bounded HED profile as a complete stimulus-presentation or BIDS/NWB
exporter: the exact boundary is maintained in
[HED/BIDS interoperability](HED_BIDS_INTEROP.md).

## 7. Future capability without ontology sprawl

SSTIM should continue to describe independently:
the delivered physical stimulus, delivery medium and target, intended
perceptual experience, actually reported perception, physiological
observations, evidence propositions, and execution provenance.

This separation should support further modalities and AI-assisted research
without assuming that an intended percept actually occurred, that every
exposure is perceived, or that a description establishes a biological effect.
Direct cognitive or affective manipulation should **not** be introduced as
merely another sense; connect to adjacent ontologies when needed.

Broader artificial-sense and neural-interface use cases are potential
long-term extensions, not near-term commitments. The ontology's standing
design directions and semantic improvement plan remain
[SSTIM Directions](../ontology/SSTIM_DIRECTIONS.md) and
[Improvement Plan](../ontology/IMPROVEMENT_PLAN.md). Do not move a
concept into the canonical ontology without a demonstrated modeling gap,
scope review, an ADR where needed, and the normal validation gates.

## 8. Candidate sequence and decision gates

**Illustrative targets, conditional on maintainer review and available effort,
not committed dates or delivery promises:**

| Horizon | Candidate deliverable | Gate for proceeding |
|---|---|---|
| Weeks 1-2 | Version-pinned AI-to-SSTIM walkthrough with public inputs, outputs, failure modes, and reproducible validation | Unaffiliated developer can run it without unstated local knowledge |
| First month | Small four-condition, multi-model evaluation with independent grading and published results | Results isolate semantic usefulness from mere conformance |
| Months 1-3 | Optional thin read-only adapter, prioritized by actual client demand; external protocol-encoding invitation already running | At least one real outsider can independently consume a conformant artifact |
| Months 3-6 | Measured two-implementation exchange and/or bounded research-data demonstrator | Explicit physical/semantic loss report and external reproduction |
| Months 6-18 | Reviewed modality/device integrations and any justified feedback-loop work | Independent adoption and concrete measured need justify complexity |

Track independent maintained artifacts, reproducible external uses, semantic
fidelity, portability failures, benchmark results, and actual outside demand.
Do not conflate registry presence, downloads, citation, one-off tool access,
and independent data adoption.

**Stop or redirect** if controlled evaluation provides no incremental value,
if external parties cannot identify a use worth adopting, or if implementation
cost outruns the value of using existing packages and conventions. A successful
first month can end with a negative result and a well-founded decision to
improve documentation instead of writing more code.

## 9. Decision record before implementation

This proposal does **not** alter `ROADMAP.md`, `TODO.md`, existing normative
vocabularies, release artifacts, or the agent automation boundary. Before
implementation, decide:

1. Which external task and adopter would justify the work?
2. What constitutes independently graded correctness for that task?
3. Is the first deliverable documentation plus existing CLI/scripts, or does
   it demonstrably require an agent protocol adapter?
4. Who owns the benchmark/reference cases and external scientific review?
5. What authorizations, privacy constraints, and device checks apply if
   physical execution is added later?

Record adopted choices in the repository's established roadmap/task/ADR
processes. Public-facing text should emphasize sensory interoperability,
not the unverified existence of SAGI.

## 10. Prioritize a platform-neutral contribution path

**Proposed user story:** while a person or an AI assistant is discussing a
sensory-stimulation concept in ChatGPT, Claude, a research notebook or a local
agent, it notices an ambiguity or error. With a deliberate user action it can
submit a *reviewable candidate*, linked to the exact SSTIM term or version,
without requiring the user to navigate the Workbench graph. The contribution
can then be discussed and reviewed using existing SSTIM provenance and
publication governance.

Do **not** design this as an automatic ingestion of users' entire
conversations, private chats, or third-party scientific documents. A
model-generated suggestion is not proof of its correctness or authorization
to disclose underlying conversation content. Contribution must be
user-approved and scoped to an explicit excerpt or self-contained proposal,
with identity, consent, and privacy rules honored.

### Proposed service boundary

One reusable service, multiple client adapters:

| Layer | Responsibility |
|---|---|
| Canonical SSTIM | Released term definitions, vocabularies, scopes, shapes, versioned identifiers and approved knowledge |
| Knowledge read service | Term discovery, definition lookup, versions, scoped evidence, source links and validation |
| **Proposal inbox (noncanonical)** | Comments, objections, corrected definitions, missing concepts, proposed external mappings, alternative models |
| Review and attribution | Explicit identity/pseudonym policy, sources, statuses, deduplication, discussion, moderation and accepted/rejected rationale |
| Promoted changes | Reviewed diffs, CI/validation, human-governed merge/release, backward-compatibility and migration rules |
| Client surfaces | Workbench simple feedback form, HTTP/JSON, remote MCP, AI-app/plugin wrappers, and optional GitHub issue/PR integration |

Existing Web Annotation named-graph storage, governance and
[agent boundary](../technical/AGENT_AUTOMATION_BOUNDARY.md) are the starting
point, not automatically a suitable production-wide public API.
First assess authentication, consent, spam resistance, permission isolation,
pseudonym leakage, rate limits, persistent storage, moderation workload,
retention and deletion policy. Publishing a stable API without operational
capacity to review submissions would create a backlog rather than a useful
shared reference.

A minimal possible *interface contract*, **not an implemented API**:

- `find_concepts(query, scope?, release?)`: return cited candidates with IRIs.
- `get_concept(iri, release?)`: definition, relations, domains, mappings, sources.
- `get_discussion(iri, status?)`: attributed objections and proposals,
  separate from asserted canonical truth.
- `submit_proposal(target_iri?, kind, text, evidence_refs?, source_ref?,
  client_id?, user_confirmation)`: create an attributable, noncanonical,
  retrievable proposal record with status `pending_review`.
- `get_proposal(id)`: report receipt, status, provenance, replies and
  final disposition, subject to access controls.
- `validate_artifact(input, profile, release)`: deterministic checking
  with explicitly declared support and limits.

**One proposal ID, regardless of client.** Read and write operations need
separately scoped authorization. No public agent tool receives direct write
access to the released ontology, production instance graphs, protected files,
or real physiological stimulation. An AI's claimed origin or confidence is
not a substitute for evidence and accountable review.

### Distribution

Start with a tiny public read service and a protected proposal inbox.
Deploy one standards-based **remote MCP server** that wraps those operations,
where compatible, with a plain HTTP/JSON API underneath. This can be used
by ChatGPT apps/plugins, Claude custom connectors, developer agents and
other clients without coupling SSTIM to any vendor.

Creating a ChatGPT custom app/plugin or a Claude connector is a **distribution
step** after the service has a useful contract, authentication and a successful
end-to-end contribution. It does not make SSTIM part of model training,
automatic global model knowledge, or every chat. Invocations remain subject to
each host's consent, permissions, availability, and tool-selection behavior.
Where a particular host cannot write, use read-only tools and offer the
user a copyable or independently authenticated proposal link.

### Fast first demonstration

Use a non-sensitive, public SSTIM term with a real ambiguity. A user types
"this definition conflates mechanical stimulation with the resulting
perception" into an AI chat. With explicit confirmation the assistant submits
a structured `propose_correction` candidate citing the term IRI and release.
The service returns a stable receipt and review page. A maintainer can discuss,
reject with a reason, or promote it through the existing reviewed
ontology-change workflow. The user can later inspect the outcome from any
compatible client. No graph navigation is required.

This demonstrates collaboration and knowledge curation, not just
interoperability.

## 11. Competing knowledge claims without prematurely replacing RDF

**Problem:** a single flattened RDF union can make mutually incompatible
statements look like one authoritative model, and OWL entailment over
contradictory axioms can be unsafe for downstream conclusions. **RDF is not
incapable of disagreement.** Use existing standards to represent *attributed,
scoped* claims as claims, rather than promoting them into the canonical
default graph.

Candidate pattern:
- Each claim/proposal has a stable identifier, source, author or accountable
  agent, dates, target concepts and qualified content.
- An assertion or alternative model is stored in its own explicitly
  identified graph or equivalent scoped record, with no automatic union
  into canonical axioms.
- PROV-O records derivation and responsibility; W3C Web Annotation records
  target, body and motivation. Consider nanopublication conventions if
  genuinely useful to cited, versioned claim exchange.
- Support `supports`, `disputes`, `revises` and `supersedes` as reviewed
  relationship *types*, not automatic truth values. These are conceptual
  examples: do not create novel SSTIM predicates if existing external
  standards cover the use case.
- Keep assertions, hypotheses, proposed definitions, empirical findings and
  governance approval in separate logical and data-access layers.
- Query views may surface disagreements side by side; validation of an
  assertion graph says nothing about its truth.

Evaluate ordinary RDF named graphs and compatible claim/provenance models first.
A new language, triple dialect or database is warranted only if a
representative benchmark demonstrates a specific limitation that existing
representations cannot address economically.

## 12. Reuse-first research and knowledge services

A "Protocol Passport" should not attempt to replace existing scientific
protocol and event representations. It should **reuse or map to established
formats by default**, add SSTIM-specific semantics only where the existing
format cannot express the needed stimulation information, and disclose every
lossy or partial mapping. Useful starting points include HED event semantics,
optional BIDS Behavioral context, SOSA/SSN for sensors and observations,
PROV-O for provenance, W3C Web Annotation for commentary, established
quantity/unit identifiers, and relevant organism-specific vocabularies.

Candidate public products:

1. **Concept Reference** with natural-language search, sources,
   version history, mappings, and disagreement-aware explanations.
2. **Protocol Passport** from structured inputs or paper excerpts
   (with user review, no invented measurements), validated export and
   declared external standard alignments.
3. **Cross-system comparison** explaining exactly which intended physical
   parameters two specifications share or cannot compare.
4. **Proposal inbox** accessible from AI chats and simple standalone links.

Measure user utility and scientific fidelity separately from RDF conformance,
API traffic or downloaded ontology files. Generic ontology lookup alone has
weak differentiation; prioritize stimulus-domain interpretation, evidence,
protocol reproducibility, and genuinely low-friction knowledge contribution.

**Priority proposal:** ship the Concept Reference read contract and the
noncanonical proposal-submission path first. Test a single end-to-end
ChatGPT/Claude submission after host-specific authorization is verified.
Then decide whether Protocol Passport, cross-engine adapters, or broader
agent platform distribution delivers the most external value.
