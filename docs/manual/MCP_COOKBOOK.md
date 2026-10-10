# SSTIM MCP: practical AI-assistant cookbook

The released [SSTIM MCP server](../../packages/sstim-mcp/README.md) gives
compatible coding assistants *read-only* access to the
[Concept Reference API](../technical/CONCEPT_REFERENCE_API.md). The server
is published as [\`@sstim/mcp@0.2.0\`](https://www.npmjs.com/package/@sstim/mcp)
and registered under \`io.github.w3c-cg/sstim\`.

**User-facing tutorial:** [SSTIM Manual: MCP](https://w3c-cg.github.io/sstim/manual/mcp/).

## Install in a coding assistant

**VS Code Copilot Agent**, \`.vscode/mcp.json\`:

\`\`\`json
{
  "servers": {
    "sstim": {
      "type": "stdio",
      "command": "npx",
      "args": ["--yes", "@sstim/mcp@0.2.0"]
    }
  }
}
\`\`\`

**Codex extension or CLI**, \`~/.codex/config.toml\`:

\`\`\`toml
[mcp_servers.sstim]
command = "npx"
args = ["--yes", "@sstim/mcp@0.2.0"]
\`\`\`

**Claude Code** CLI or extension:

\`\`\`bash
claude mcp add --transport stdio --scope user sstim -- npx --yes @sstim/mcp@0.2.0
\`\`\`

Use the [client-specific setup](../../packages/sstim-mcp/README.md) for
Gemini CLI, Cursor and Neovim. Node.js 20+ and network access to SSTIM's
public release reference API are required. The package has no SSTIM-checkout
prerequisite.

## Eight useful agent tasks

In each example, the assistant does the reasoning, project inspection and
drafting. The MCP server provides the **published versioned facts**. The
following prompts are examples for an AI assistant that has these tools
enabled, not HTTP query syntax.

### 1. Map an application's JSON or database fields

> Inspect my stimulus/session JSON schema. Call \`sstim_search_concepts\`
> and \`sstim_get_concept\` to find exact released SSTIM classes or properties
> for the signal, carrier, modulation, channel, exposure and session fields.
> Return a table of existing field → SSTIM IRI → source release/module →
> rationale → open questions. Do not mint new \`sstim:\` IRIs.

**Use for:** planning a semantic interop layer or research dataset export.
The mapping is a **proposal** that still needs manual review and SHACL checks.

### 2. Audit scientific terminology

> Search SSTIM for isochronous tones, binaural stimulation and frequency
> bands. Return only terms that actually exist. Cite each IRI and the
> definition's release. Distinguish stimulation parameters from assumptions
> about neural entrainment and identify ambiguities for review.

**Use for:** research writing or cleaning up terminology in software.

### 3. Compare versions before a migration

> Look up the same canonical term IRI in SSTIM releases 0.18.0 and 0.19.0
> with \`sstim_get_concept\`. Compare definitions, labels, relations, external
> mappings, deprecation flags and source hashes. Describe only differences
> supported by the returned records. Flag a missing term explicitly.

**Use for:** reproducibility and migration notes. A fixed ontology version is
not the same as the npm package version.

### 4. Align with other controlled vocabularies

> For the SSTIM term(s) relevant to sensory stimulation, retrieve external
> mappings. Preserve \`exactMatch\`, \`closeMatch\`, \`broadMatch\` and other
> relation types. Return target IRIs and provenance; do not assert that a
> mapping proves scientific, clinical or regulatory equivalence.

**Use for:** ontology integration with vocabularies and datasets.

### 5. Audit a source codebase

> Search this repository's stimulation parameters and names. Find potential
> SSTIM matches with \`sstim_search_concepts\` and verify each match with
> \`sstim_get_concept\`. Show source lines, canonical IRIs, mismatched units,
> module dependencies, and fields with no verified match. Ask before edits.

**Use for:** technical debt reduction and interoperable naming.

### 6. Write reference-grounded documentation

> Describe these stimulus types using SSTIM's published definitions and
> identifiers. Include source release and module. Separate defined facts
> from model-generated examples and hypotheses. Do not claim the vocabulary
> establishes an intervention's efficacy.

**Use for:** project docs, learning materials and manuscripts.

### 7. Propose a correction without publishing it

> Determine if SSTIM already defines my proposed concept. If a correction
> is justified, use \`sstim_prepare_feedback\` for the exact term and give me
> the reviewable Contribution Bridge link and a clear issue draft. Do not
> open, submit or automatically publish any issue.

**Use for:** improving the open vocabulary. The MCP server only **generates
the link**, with the public identifier and term label, not an issue or a write.

### 8. Make a reproducible, release-pinned agent plan

> For this sensory-stimulation dataset, only use SSTIM version 0.19.0.
> Search for relevant terms, cite full IRIs and source modules, note what is
> absent, and outline how I could validate the exported Turtle with Python
> \`sstim validate --profile full --version 0.19.0\`. Do not claim that
> calling MCP performs the validation.

**Use for:** integrating AI assistance with actual programmatic SHACL
validation and traceable data provenance.

## Four tools and limits

| Tool | Actual capability |
|---|---|
| \`sstim_list_releases\` | Discover supported frozen SSTIM ontology releases |
| \`sstim_search_concepts\` | Search indexed released terms with query/kind/limit |
| \`sstim_get_concept\` | Fetch exact IRI/CURIE term record and source provenance |
| \`sstim_prepare_feedback\` | Produce a user-reviewable Contribution Bridge link |

The MCP server does **not** perform SPARQL queries, validate datasets against
SHACL, generate/publish final research protocols, write to SSTIM, run an
audio/visual stimulation engine, or prove outcomes. For actual validation use
[\`sstim\` Python](../../packages/sstim/README.md), which performs complete
Full-profile SHACL checks, or [\`@sstim/core\` JavaScript](../../packages/sstim-js/README.md),
whose Full-profile \`sh:sparql\` result is **PARTIAL**. For a working
reference environment, use [SSTIM Workbench](https://w3c-cg.github.io/sstim/).

**Project author/steward:** [SSTIM W3C Community Group](https://www.w3.org/community/sstim/).
**Acknowledgement:** [BioSynCare](https://biosyncare.com).
