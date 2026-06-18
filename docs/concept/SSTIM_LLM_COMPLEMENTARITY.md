# SSTIM and LLM Complementarity

SSTIM is a semantic ontology and knowledge graph that enables expert symbolic
reasoning, automated validation, and LLM-grounded agent workflows for sensory
stimulation data.

This document explains the complementarity between SSTIM and large language
models (LLMs). The short version is that SSTIM gives AI systems a precise
domain model, while LLMs give SSTIM a natural-language interface and flexible
reasoning layer for humans and software agents.

SSTIM is not an LLM and is not machine learning. It does not learn from examples,
train weights, or predict statistically. Its AI value is symbolic: expert human
knowledge is encoded as classes, concepts, relations, constraints, evidence
tiers, provenance, and validation rules that machines can inspect and reason
over.

An LLM is complementary because it can read, explain, query, draft, compare, and
operate over this formal structure in human language. Together, they form a
hybrid AI pattern: probabilistic language intelligence grounded by deterministic
semantic structure.

---

## Terminology

The strongest general phrase is:

> SSTIM enables expert symbolic reasoning and LLM-grounded agent workflows for
> sensory stimulation data.

Use the following terms carefully:

| Term | Use | Notes |
|---|---|---|
| Symbolic AI | Recommended | Accurately describes ontologies, knowledge graphs, rules, and formal reasoning. |
| Expert symbolic reasoning | Recommended | Emphasizes that the knowledge is expert-authored and machine-actionable. |
| Automated reasoning | Recommended | Good when referring to OWL/RDFS inference, SPARQL query expansion, SHACL validation, and rule-like checks. |
| Expert automated reasoning | Acceptable | Slightly less standard, but defensible if it means automated reasoning over an expert-authored model. |
| Expert AI agents | Conditional | Use only when an actual agentic system uses SSTIM to retrieve, reason, validate, and act. |
| Expert LLM agents | Conditional | Use only when the agent specifically contains an LLM and uses SSTIM as a grounding and validation layer. |
| Expert automated agents | Avoid | Less idiomatic and less precise than "AI agents" or "LLM-grounded agent workflows." |

Recommended public wording:

> SSTIM is a semantic ontology and knowledge graph that enables expert symbolic
> reasoning, automated validation, and LLM-grounded AI workflows for sensory
> stimulation data.

If the audience is technical:

> SSTIM provides the symbolic knowledge layer for hybrid AI systems: OWL/SKOS
> semantics, SHACL constraints, SPARQL-queryable relations, evidence tiers, and
> provenance metadata that can ground LLMs and AI agents.

If the audience is non-technical:

> SSTIM turns expert knowledge about sensory stimulation into a structured,
> machine-readable form that AI systems can search, check, explain, and use more
> reliably.

---

## What LLMs enable humans to do with SSTIM

LLMs make SSTIM easier for humans to use because they turn formal semantic
artifacts into interactive language.

An LLM can help a human:

- Ask natural-language questions over SSTIM, then translate them into SPARQL or
  structured graph navigation.
- Understand ontology terms, class boundaries, evidence tiers, and safety
  metadata without reading Turtle files directly.
- Compare techniques, presets, modalities, mechanisms, and evidence claims in
  prose.
- Draft candidate vocabulary additions, labels, scope notes, examples, and
  documentation for human review.
- Translate labels and descriptions across languages while preserving the same
  underlying IRIs.
- Explain SHACL validation failures in practical language.
- Summarize a path through the graph, for example from a preset to its target
  frequency band, evidence claim, modality tag, and caution metadata.
- Help non-ontology specialists participate in review, annotation, and
  governance discussions.

In this direction, the LLM is the interface layer. It makes SSTIM conversational,
inspectable, and easier to maintain, but the LLM does not replace the ontology.

---

## What SSTIM enables humans to do with LLMs

SSTIM makes LLM use safer, more precise, and more accountable.

With SSTIM, a human can ask an LLM to work inside a known domain model instead of
free-associating from general training data. SSTIM gives the human:

- Stable identifiers for concepts, protocols, presets, modalities, evidence
  tiers, caution tags, and implementations.
- A controlled vocabulary that reduces synonym drift and ambiguous wording.
- Explicit claim boundaries, including evidence strength and non-scope rules.
- Machine-checkable validation through SHACL before generated RDF or metadata is
  accepted.
- Queryable provenance, so an LLM answer can point back to graph facts rather
  than only narrative memory.
- A reusable prompt and retrieval substrate for consistent behavior across
  agents, documents, user interfaces, and partner systems.
- A way to separate candidate language from accepted knowledge: the LLM may
  propose, but SSTIM and human review decide what becomes canonical.

In this direction, SSTIM is the grounding layer. It lets humans use LLMs without
giving the LLM uncontrolled authority over the domain.

---

## What LLMs enable AI systems to do with SSTIM

For an AI system, an LLM adds flexible interpretation, planning, and language
generation around the SSTIM graph.

An LLM-enabled system can:

- Translate user intent into SPARQL queries, RDF edits, validation requests, or
  graph-navigation actions.
- Map informal phrases such as "alpha focus session" or "breathing-guided calm"
  to SSTIM concepts and properties.
- Generate candidate RDF instances from structured or semi-structured source
  material.
- Detect likely missing metadata and propose follow-up questions or candidate
  annotations.
- Produce human-readable explanations of graph results.
- Plan multi-step workflows: retrieve relevant nodes, check evidence tier,
  validate shapes, summarize results, and propose next actions.
- Bridge SSTIM to external sources by suggesting candidate alignments for human
  review.

In this direction, the LLM gives the AI system linguistic flexibility. It can
operate over SSTIM through language, but the formal graph remains the source of
domain structure.

---

## What SSTIM enables AI systems to do with LLMs

SSTIM gives LLM-based AI systems structure they otherwise lack.

An AI system using an LLM and SSTIM can:

- Ground generated answers in controlled terms and explicit graph relations.
- Check whether a generated claim is permitted by the evidence framework and
  scope rules.
- Validate generated RDF, preset metadata, and annotations against SHACL shapes.
- Use OWL/SKOS relations to expand or narrow queries in a deterministic way.
- Preserve provenance and cite graph nodes, references, and evidence claims.
- Keep multilingual labels tied to the same concept instead of treating each
  language as an independent surface string.
- Distinguish accepted ontology knowledge from speculative notes, candidate
  additions, implementation data, and user annotations.
- Reduce hallucination risk by forcing the LLM to retrieve, inspect, and validate
  against SSTIM before answering or acting.

In this direction, SSTIM is the control and verification layer. It turns an LLM
from a general text generator into a domain-grounded assistant or agent.

---

## Four-way summary

| Direction | Complementarity |
|---|---|
| LLM -> human using SSTIM | Natural-language access to a formal ontology and knowledge graph. |
| SSTIM -> human using LLM | Grounded, reviewable, evidence-aware use of generative AI. |
| LLM -> AI using SSTIM | Flexible interpretation, planning, explanation, and query generation. |
| SSTIM -> AI using LLM | Domain constraints, validation, provenance, and symbolic reasoning. |

The result is not "SSTIM as an LLM" and not "LLM as the ontology." The result is
a hybrid system in which:

- SSTIM provides computable expert knowledge.
- SHACL and related constraints provide validation.
- SPARQL and graph traversal provide precise retrieval.
- OWL/SKOS provide semantic structure.
- The LLM provides language, synthesis, mapping, and agentic orchestration.
- Human review remains the authority for scientific, regulatory, and governance
  decisions.

---

## Example workflow

A human asks:

> Which alpha-oriented BSC Lab presets have at least moderate evidence and no
> photosensitivity caution?

An LLM can parse the question and produce a query plan. SSTIM supplies the exact
terms for alpha bands, presets, evidence tiers, and caution tags. A SPARQL query
retrieves the matching graph data. SHACL validates any generated metadata. The LLM
then explains the results in readable language and preserves the evidence and
scope boundaries.

The LLM makes the workflow usable. SSTIM makes the workflow precise.

---

## Boundary statement

SSTIM should not be described as an autonomous AI by itself. It is better
described as:

- a semantic ontology;
- a knowledge graph;
- symbolic AI infrastructure;
- an expert-authored knowledge representation layer;
- a grounding and validation layer for LLMs and AI agents.

When SSTIM is combined with an LLM, retrieval, validation, and tool execution, it
can support expert LLM agents. The agentic intelligence belongs to the combined
system, not to the ontology file alone.
