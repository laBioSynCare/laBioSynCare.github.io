# SSTIM + LLM — Messaging Guidance

Outreach/communications guidance for how to describe SSTIM's relationship to AI
and LLMs accurately, without overclaiming. For the technical explanation of the
relationship itself, see
[`../concept/SSTIM_LLM_COMPLEMENTARITY.md`](../concept/SSTIM_LLM_COMPLEMENTARITY.md).

The guiding principle: describe SSTIM as **symbolic** AI infrastructure
(ontology, knowledge graph, validation) that can *ground* LLMs and agents — never
as an LLM, machine learning, or an autonomous AI in itself.

## Terminology

| Term | Use | Notes |
|---|---|---|
| Symbolic AI | Recommended | Accurately describes ontologies, knowledge graphs, rules, and formal reasoning. |
| Expert symbolic reasoning | Recommended | Emphasises that the knowledge is expert-authored and machine-actionable. |
| Automated reasoning | Recommended | For OWL/RDFS inference, SPARQL query expansion, SHACL validation, and rule-like checks. |
| Expert automated reasoning | Acceptable | Slightly less standard, but defensible if it means automated reasoning over an expert-authored model. |
| Expert AI agents | Conditional | Only when an actual agentic system uses SSTIM to retrieve, reason, validate, and act. |
| Expert LLM agents | Conditional | Only when the agent actually contains an LLM and uses SSTIM as a grounding/validation layer. |
| Expert automated agents | Avoid | Less idiomatic and less precise than "AI agents" or "LLM-grounded agent workflows." |

## Recommended wording

General:

> SSTIM is a semantic ontology and knowledge graph that enables expert symbolic
> reasoning, automated validation, and LLM-grounded AI workflows for sensory
> stimulation data.

Technical audience:

> SSTIM provides the symbolic knowledge layer for hybrid AI systems: OWL/SKOS
> semantics, SHACL constraints, SPARQL-queryable relations, evidence tiers, and
> provenance metadata that can ground LLMs and AI agents.

Non-technical audience:

> SSTIM turns expert knowledge about sensory stimulation into a structured,
> machine-readable form that AI systems can search, check, explain, and use more
> reliably.

## Claims to avoid

- Do not call SSTIM "an AI", "an LLM", "machine learning", or "autonomous."
- Do not imply the ontology reasons or acts on its own; agentic behaviour belongs
  to a combined system (LLM + retrieval + validation + tools + human review).
- Keep all health/wellness phrasing within `../concept/SCOPE.md` (`CLAUDE.md` §3.5).
