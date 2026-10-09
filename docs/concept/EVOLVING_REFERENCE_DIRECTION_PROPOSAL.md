# SSTIM as an evolving reference: foundational direction proposal

> **Status: proposal for maintainer and W3C Community Group discussion, 2026-10-09.**
> Not a ratified mission, adopted architectural decision, new ontology release,
> implementation claim, or automatic amendment to the draft CG charter.
> The existing [Scope](SCOPE.md), [Non-Scope](NON_SCOPE.md),
> [module architecture](../ontology/MODULE_ARCHITECTURE.md),
> [design directions](../ontology/SSTIM_DIRECTIONS.md), and
> [decisions](../decisions/README.md) remain authoritative until amended.

## Purpose, identity, and ambition

**Proposed ambition:** establish SSTIM as **the widely recognized, open,
continuously evolving conceptual reference for stimuli and sensory stimulation**,
accessible to humans, AI systems, researchers, and technologies without
requiring each consumer to adopt or understand its entire internal architecture.
"The reference" is an ambition to earn through independently demonstrated
utility, scientific review, interoperability, and shared governance, not a
claim of present global authority or an exclusive theory of the senses.

The relevant value extends beyond interoperability:

1. **Conceptual clarity:** distinguish phenomena, definitions, mechanisms,
   measurements, intended stimuli, perceptions, responses, and claims.
2. **Collaborative scientific reasoning:** allow evidence-bearing human and AI
   contributions, criticisms, competing models, and refinements.
3. **Discoverability and knowledge navigation:** give people and systems
   accessible, citable explanations and relations.
4. **Continuity:** keep references and their historical meanings interpretable
   even as conceptual frameworks and machine representations evolve.
5. **Reproducibility and exchange:** make descriptions portable among research
   systems and implementations.
6. **Scientific hypothesis generation:** make gaps and competing explanations
   explicit without confusing them with established evidence.

**Retention decision proposed:** preserve the SSTIM name, public identifiers,
historical artifacts, existing semantic investment, and reference tooling.
Neither dissolve the vocabulary into Wikidata nor restart from an empty
repository without comparative evidence of a fundamental modeling failure.
Prioritize a genuinely useful public knowledge service and independent use
over indefinite vocabulary growth. This is a proposal, not a decision to
deprecate existing work.

## Domain boundary and applicable modules

The present ontology is **already modular**. There is no need to invent a
second fictitious "SSTIM Core" to represent that: its manifest selects semantic
modules and the Kernel/Core/Core Plus/Full consumer profiles. Modules,
profiles, vocabularies, and species-specific applicability are different axes.

Proposed *conceptual* applicability distinctions:

| Domain | Relevant interpretation |
|---|---|
| Human and animal | Physical stimulation, sensory transduction, neural mechanisms, perception and response, each independently qualified |
| Plant and microorganism | Environmental stimulation, detection/signaling and physiological or behavioral response without assuming subjective perception |
| Virus and molecular systems | Molecular and environmental interactions/responses; do not assert sensory experience or organism-level sensing without specific justification |
| Machine | Sensor input, transduction, measurement, software interpretation and actuation; reuse SOSA/SSN rather than duplicating it |
| Mineral, planetary, stellar and spacetime systems | Perturbations, coupling, changes and measured physical responses; do not automatically call every physical interaction a sense |

The project's already settled [scope](SCOPE.md) includes humans, non-human
animals, plants, objects/materials, and target-free environmental stimuli. A
target's existence does not entail a percept, sensing process, observed
response, or benefit.

**The distinction that prevents unlimited scope expansion:** SSTIM describes
stimuli/stimulation and the relevant links to sensing, perception, and response.
It is **not** an alternative ontology of all physical interactions, all of
physics, or all of biology. Most organism-specific and physical-domain
definitions should come from established external ontologies; add a native term
only when SSTIM has a distinct, demonstrable semantic need.

Propose an explicit domain-applicability annotation or profile policy
separate from module dependency and conformance level. Establish its semantics
from real use cases before minting new classes or extensions. A concept may
span multiple taxa or technologies while its evidentiary applicability differs
among them.

## AI-driven semantic evolution with referential continuity

**Foundational principle proposed:** AI may discover, criticize, compare,
extend, and propose replacement conceptualizations, but **published referents
and historical meanings must remain interpretable across revisions**.

The long-lived commitment is to knowledge and interoperability, not to any
permanent RDF, OWL, SKOS, SHACL, SPARQL, JSON-LD, graph database, or agent
protocol. Current RDF technology remains the supported implementation until
there is an evaluated reason to migrate. Alternative representations should
be measured for semantic fidelity, expressiveness, performance, accessibility,
and reproducibility, not chosen because they are newer.

Do not silently repurpose an existing IRI for an incompatible meaning. Keep
the old citable reference, document revision or deprecation, map replacements
with truthful mapping strength, record losses in projections, and retain
version-pinned reproducibility. Keep normative concept identity distinct
from textual labels, multilingual explanations, classification proposals,
and model-specific encodings.

**Knowledge should be allowed to disagree.** A suggested claim is not a
canonical fact. Distinguish:
- Canonical domain definitions and logically committed axioms.
- Attributed, versioned external claims and scientific interpretations.
- Hypotheses, objections, supporting/refuting evidence, and alternative
  classification systems.
- Review/acceptance status, including explicitly undecided cases.

RDF *can already express* disagreement through independently attributed
claim graphs, qualified assertions, Web Annotations and provenance such as
PROV-O. Prefer existing standards over a new representation protocol.
**Do not simply union contradictory claim graphs into the default ontology:**
OWL reasoning over inconsistent assertions and unscoped equivalences can
produce invalid conclusions. Separate claim storage, source attribution,
truth-status assessment, and any authorized canonical promotion. Evaluate
nanopublication conventions only if a concrete evidence use case benefits.

Acceptance of a term, mapping or evidence assessment remains governed by
the project's established human review and publication procedures unless
governance explicitly changes.

## Federated authority and confluence

SSTIM should be authoritative **inside its distinct domain**, and become
more useful by connecting to external vocabularies without duplicating their
semantics. Reuse existing classes, identifiers, and profiles wherever the
external authority already owns the concept.

Candidate alignments include, as applicable:
- **Wikidata:** multilingual discovery, broader linked knowledge, and reciprocal
  links; do not dissolve SSTIM's released definitions or domain governance.
- **SOSA/SSN:** sensor, stimulus, observation, actuation and procedures; explicitly
  evaluate overlaps rather than assuming concept equivalence.
- **HED, BIDS and NWB:** event meaning and research-data containers using
  existing bounded crosswalks, with no premature turnkey exporter claims.
- **PROV-O and W3C Web Annotation:** attribution, provenance, and proposals
  attached to independently identified resources.
- **Specialized biological/physical/device ontologies:** organism, anatomy,
  molecular process, physical quantity, unit, instrument and measurement
  semantics, selected for each real use case.

Every mapping must state exact/close/related or another predicate with correct
semantic force, external authority verification, dated provenance, and review.
An external vocabulary should be queried/reused before a duplicate SSTIM term
is proposed. A new extension should have a narrowly defined domain and
declared overlap/dependencies; it should not automatically be added to Full
merely because it is interesting.

## Complexity budget

Seek simplicity in **three distinct surfaces**:

1. **User/agent interface:** a reader should be able to search a concept,
   understand it, inspect its uncertainty and source, and contribute a
   criticism without learning RDF or navigating a large graph.
2. **Active conceptual contract:** prefer narrow, coherent, validated modules;
   identify genuine redundancies and contradictory semantics; avoid new terms
   whose meanings are already represented or externally owned.
3. **Historical rationale:** preserve implemented/cited ADRs and immutable
   releases but expose a short *current decisions* view instead of requiring
   ordinary consumers to read every ADR.

Measure reductions in required concepts, interactions, dependencies,
comprehension time, and task failures. Do not count deletion of provenance
or loss of semantics as simplification.

## Delivery priority and decision gates

Prioritize **useful public surfaces**, not ontology size:

1. **Concept Reference:** natural-language lookup that links exact SSTIM
   definitions, scope, mappings, competing scientific claims and provenance.
2. **Protocol Passport:** describe a study or physical stimulus, show what is
   missing, produce a versioned validated artifact and a human-readable page
   while maximizing existing research protocol reuse.
3. **Agent-facing knowledge and proposal API:** reusable read tools plus
   explicitly authorized, noncanonical contribution submissions.
4. **Knowledge Contribution Studio:** accessible human/AI proposal review,
   contextual disagreement and governance; integrate existing annotation
   storage rather than create a rival canonical graph.

Evaluate against users/agents without SSTIM; test independent usefulness,
correctness, contribution quality, repeat use, and external adoption. Do not
interpret absence of rapid uptake as proof that the published ontology has no
scientific value; instead limit incremental development spending until useful
demand is established.

See the paired [AI interoperability and evaluation proposal]
(../ecosystem/AI_INTEROPERABILITY_AND_EVALUATION_PROPOSAL.md)
for an implementation-oriented candidate sequence. The implemented contracts,
module ownership, and phase gates remain those in the live repository, not
the proposals here.
