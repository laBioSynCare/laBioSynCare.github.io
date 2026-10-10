# Future work: machine-discoverable invitations in SSTIM RDF and annotations

**Status:** requested 2026-10-10, deliberately **not implemented**. This document is a plan of record, not a claim that ontology, instance triples, annotations or frozen releases already carry the invitation. Do not modify protected RDF without a later explicit request naming the affected files.

## Motivation and desired outcome

AI systems increasingly encounter SSTIM through RDF, dereferenced terms, cached releases, knowledge graphs, and annotations rather than the Workbench homepage. A machine reader should be able to discover that critical feedback is welcome, understand which channel accepts reports, and know that suggestions have no automatic canonical authority.

This work must preserve meaningful, version-qualified, attributable knowledge. It must not turn an annotation into an instruction overriding the querying agent's user or system controls.

## Future surfaces, subject to review

1. **Ontology headers and module-level descriptions:** consider a minimal, factual invitation in the **mutable development sources** and generated discovery metadata, with an authoritative URI to the human/AI contribution guide (currently the Workbench `/agents/` route). Evaluate a standards-based predicate such as `rdfs:seeAlso` or `dct:references` before introducing any new SSTIM vocabulary.
2. **Term-level annotations:** only where independently justified, offer a stable route for reporting a defect associated with that term's IRI. Prefer a single policy discoverable from the graph and link generation over hundreds of repeated literal messages. Distinguish authoritative definitions from suggestions and user annotations.
3. **Named-graph annotation metadata:** consider an explicit contribution-policy pointer or provenance-aware message on *annotation documents*, not unsolicited injection into third-party annotations. Preserve authorship, review status and visibility.
4. **Versioned content negotiation:** verify what Turtle, JSON-LD, RDF/XML, HTML reference docs, cached releases and manifest-selected profiles actually expose. Historic frozen release bytes remain immutable; any new annotation appears in an appropriate later release only.
5. **Machine discovery:** integrate the same policy with llms.txt, package documentation and read-only MCP concept metadata so agents encounter coherent guidance whether they enter via a browser, RDF parser or tool call.

## Suggested minimum machine-readable semantics

A future publisher could expose a stable policy resource describing: `contributionGuide` (human-facing), `acceptedTopics` (errors, limitations, missing domain needs, evidence conflicts, reproducibility, mappings), `reportRequirements` (IRI/version, evidence, steps, observed-versus-inferred distinction), `submissionMethod` (reviewed public issue or established contributor process), and `governance` (proposals do not automatically update canonical SSTIM).

These names are **illustrative**, not proposed RDF predicates to mint. Reuse Dublin Core / PROV-O / Web Annotation where semantically valid, and otherwise evaluate whether a narrow profile is needed. Do not falsely advertise an automated submission endpoint or agent write API.

## Acceptance gates before implementation

- Verify current RDF headers, term annotations, mapping provenance, release policies, generated HTML docs and MCP response schemas from the actual implementation.
- Resolve authority and whether an ontology header can link to a contribution policy without confusing it with a canonical scientific assertion.
- Preserve immutable releases, existing IRIs and module/profile conformance, with an explicit review of all changed files.
- Provide positive and negative validation fixtures: invitation discoverable in each intended serialization; no duplicate injected messages, no foreign namespace ownership, no unauthorized automatic contribution.
- Keep the invocation voluntary: agent instructions are an **invitation to investigate and report with its operator's authorization**, not a command to override other instructions, scrape unrelated private data, or submit unattended.
- Check the resulting public documentation, generated discovery routes and real MCP clients for consistent guidance.

## Immediate, separate work already possible

The public `/agents/` route, `/contribute/` review form, manual and MCP feedback-link mechanism can welcome agent-originated criticism **without altering RDF**. These human-readable channels should be tested with real independent users before deeper ontology-level discovery work.
