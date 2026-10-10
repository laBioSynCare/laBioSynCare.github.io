# SSTIM manual and practical tutorials

The **[public SSTIM Manual](https://w3c-cg.github.io/sstim/manual/)** is a
browser-accessible, example-first guide to using the released vocabulary,
Workbench, validation packages and MCP tools.

It is a set of **seven rendered pages**: one landing page and six in-depth
chapters. All chapters are available without a login or an SSTIM checkout.

| Guide | What you can do | Public page |
|---|---|---|
| Workbench | Navigate definitions, ask SPARQL questions, inspect preset provenance, author patches | [Workbench](https://w3c-cg.github.io/sstim/manual/workbench/) |
| Ontology | Choose profiles, fetch frozen RDF modules, reuse IRIs, look up concepts | [Ontology](https://w3c-cg.github.io/sstim/manual/ontology/) |
| Python | Validate a Turtle file, resolve a profile closure, record experiments from PsychoPy/LSL | [Python](https://w3c-cg.github.io/sstim/manual/python/) |
| JavaScript | Validate from Node, reuse a frozen closure, build a session record, understand Full limitations | [JavaScript](https://w3c-cg.github.io/sstim/manual/javascript/) |
| MCP | Install SSTIM in AI clients; map schemas, audit code, compare versions and suggest corrections | [MCP](https://w3c-cg.github.io/sstim/manual/mcp/) |
| Repository | Run the Workbench locally, test examples, find IRIs and contribute safely | [Repository](https://w3c-cg.github.io/sstim/manual/repository/) |

For the **MCP use cases as text**, with copyable agent prompts, see
[MCP_COOKBOOK.md](MCP_COOKBOOK.md).

## Choose the correct tool

- **Use the website** if you want to explore the ontology or reference presets,
  run SPARQL inside your browser, or create/preview a patch.
- **Use the ontology** to publish interoperable RDF/Turtle and JSON-LD data
  using stable definitions; mint your own record IRIs outside the SSTIM namespace.
- **Use the Python package \`sstim\`** to validate RDF, including Full-profile
  SHACL-SPARQL constraints, and generate session records.
- **Use the JavaScript package \`@sstim/core\`** for Node/browser validation
  and session building. Full-profile validation is reported as **PARTIAL**:
  SHACL-SPARQL constraints require Python/pySHACL for complete validation.
- **Use \`@sstim/mcp\`** when an AI assistant needs canonical released term
  lookup, relation/mapping discovery, version comparison and a human-reviewed
  feedback path. The server itself is read-only and does not run experiments.
- **Use the GitHub repository** for inspecting and contributing to reference
  code, validation fixtures, ontology modules and the Workbench. The source and
  both remotes have specific maintenance invariants.

These are **different interfaces to the same open standard**, not
interchangeable services. SSTIM Workbench is non-normative. The independent
BioSynCare application adopts/contributes to the wider SSTIM ecosystem, but
is not the owner or authority of the vocabulary.

## Minimal start

Use one of these paths:

\`\`\`bash
# Python: validate a published Core example using a pinned ontology release
python3 -m pip install "sstim>=0.2,<0.3"
curl -fsSL https://raw.githubusercontent.com/w3c-cg/sstim/main/examples/01-stimulus-core.ttl -o stimulus.ttl
sstim validate stimulus.ttl --profile core --version 0.19.0

# Node: perform the same Core validation
npm install @sstim/core
npx sstim validate stimulus.ttl --profile core --version 0.19.0

# MCP: the executable is a stdio server for an AI client, not a text CLI
npx --yes @sstim/mcp@0.2.0
\`\`\`

For the MCP server command, configure the stdio client as shown in the
[manual](https://w3c-cg.github.io/sstim/manual/mcp/) instead of running it
interactively and expecting human-readable output.

## How the web pages stay current

The website's rendered examples are defined in
[\`src/ui/manual/chapters.js\`](../../src/ui/manual/chapters.js) and served
through static, prerendered SvelteKit routes at \`/manual/\` and
\`/manual/{chapter}/\`. Every example has a practical goal, actionable steps,
and where appropriate a code sample or an AI prompt.

The companion [\`scripts/manual-content.test.mjs\`](../../scripts/manual-content.test.mjs)
checks the chapter inventory, valid IDs, example coverage, code/prompt content
and required references. Existing checks and site builds validate the actual
static pages. Users should consult the published package READMEs and frozen
release manifests for the authoritative API contracts, not treat prose samples
as a substitute for validation.

## References

- [Adopting SSTIM](../ADOPTING_SSTIM.md) and [four checked Turtle starters](../../examples/)
- [Python package](../../packages/sstim/README.md) on [PyPI](https://pypi.org/project/sstim/)
- [JavaScript package](../../packages/sstim-js/README.md) on [npm](https://www.npmjs.com/package/@sstim/core)
- [MCP package](../../packages/sstim-mcp/README.md) on [npm](https://www.npmjs.com/package/@sstim/mcp)
- [Concept Reference API](../technical/CONCEPT_REFERENCE_API.md)
- [Repository contribution instructions](../../CONTRIBUTING.md)
- [SSTIM W3C Community Group](https://www.w3.org/community/sstim/)

**Stewardship:** SSTIM W3C Community Group. **Acknowledgement:**
[BioSynCare](https://biosyncare.com). This is not a W3C Recommendation or
W3C-endorsed product.
