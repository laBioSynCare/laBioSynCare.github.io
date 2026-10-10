# SSTIM MCP distribution and directory submissions

**Verified publication state (10 October 2026):** SSTIM MCP
`@sstim/mcp@0.2.0` is published on npm, its executable successfully
responded to an MCP discovery request from an `npx` installation outside the
package source tree, and `io.github.w3c-cg/sstim` was successfully
published to the **official MCP Registry**. The successful registry
publication is recorded in [GitHub Actions run #38037758861](https://github.com/w3c-cg/sstim/actions/runs/38037758861).

**Not yet verified/submitted:** Glama, Awesome MCP Servers, MCP.so and other
community directories. Public registry publication does not itself prove a
separate directory entry exists. Do not mark them complete without a live
listing or accepted pull request.

## Project ownership and attribution

- **Author and primary responsible project:** [SSTIM W3C Community Group](https://www.w3.org/community/sstim/).
- **Canonical repository:** [w3c-cg/sstim](https://github.com/w3c-cg/sstim).
- **Acknowledgement:** [BioSynCare](https://biosyncare.com), for contributions
  to and support of SSTIM's ecosystem.
- **Published npm package:** [@sstim/mcp@0.2.0](https://www.npmjs.com/package/@sstim/mcp).
- **Official registry identity:** `io.github.w3c-cg/sstim`.
- **Transport:** local stdio, not a hosted HTTP connector.
- **Licensing:** Apache-2.0 for the MCP implementation. The underlying
  ontology term content has its separately documented attribution and license.

SSTIM is developed through a W3C Community Group; it is **not** a W3C
Recommendation or a technology formally endorsed by W3C. Do not describe
BioSynCare as the owner of the standard or the registry namespace.

## Installation for public listings

**For users:** Node.js 20+ and any local stdio MCP client. From outside the
package's own source directory:

```bash
npx --yes @sstim/mcp@0.2.0
```

The command is a stdio service and waits for client requests. To configure
VS Code/Copilot, set `.vscode/mcp.json`:

```json
{
  "servers": {
    "sstim": {
      "type": "stdio",
      "command": "npx",
      "args": ["--yes", "@sstim/mcp@0.2.0"]
    }
  }
}
```

See [per-client configurations](../../packages/sstim-mcp/README.md) for
Codex, Claude Code, Gemini CLI, Cursor, and Neovim.

## Standard directory description

**Name:** SSTIM MCP: Sensory Stimulation Reference

**Short description:** Read-only MCP access to SSTIM's versioned
sensory-stimulation vocabulary, definitions, identifiers, mappings and
provenance.

**Full description (copy/paste):**

> SSTIM MCP is an open-source, read-only reference server for SSTIM's
> published sensory-stimulation ontology. Give coding and research assistants
> version-qualified definitions, canonical IRIs/CURIEs, relationships,
> external vocabulary mappings, source provenance and a human-reviewed
> feedback path. Supports local stdio MCP with modern and legacy protocols.
> Authored and stewarded by the SSTIM W3C Community Group. With thanks to
> BioSynCare (https://biosyncare.com). Install with
> `npx --yes @sstim/mcp@0.2.0`.
> Source: https://github.com/w3c-cg/sstim.

**Suggested keywords:** sensory stimulation, neuroscience, auditory,
audiovisual, ontology, knowledge graphs, research, RDF, OWL, SKOS,
interoperability, reproducibility, MCP, AI coding assistant.

**Four tools:** `sstim_list_releases`, `sstim_search_concepts`,
`sstim_get_concept`, `sstim_prepare_feedback`. Feedback tool only
generates a link; the user submits nothing automatically.

**Example prompt:**

> Search SSTIM for binaural beats and related auditory stimulation terms.
> Return their canonical IRIs, definitions, mappings and provenance, and
> distinguish source assertions from your own inferred recommendations.

## Community directory publishing

### Glama (first)

1. Open [Glama: Add MCP Server](https://glama.ai/mcp/servers/add) and sign
   in through the site's GitHub login if requested.
2. Supply `https://github.com/w3c-cg/sstim` as the source repository.
   For a monorepo, identify `packages/sstim-mcp/` and npm
   `@sstim/mcp@0.2.0` if the submission UI provides these fields.
3. Use the title and description above. The root
   [`glama.json`](../../glama.json) authorizes GitHub user `ttm` to
   **claim/manage the listing**, not to replace the Community Group as
   author.
4. Verify a real server listing and a passed inspection/quality score.
   Record its **actual** Glama URL before constructing score-badge links.

Glama's [submission FAQ](https://glama.ai/mcp/faq) describes an interactive
GitHub-based Add Server form, with scanning after submission. Repository
metadata cannot submit the form by itself. Do not fabricate a listing URL or
claim it is live because `glama.json` exists.

### Awesome MCP Servers (after Glama quality score)

The [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)
curated list accepts entries as GitHub pull requests from contributor forks.
Its current automated moderation expects a **working Glama listing with a
score badge**, correct language/scope icons, and a category-appropriate,
alphabetically placed entry.

Once Glama issues the real URL, fork that repo, modify the appropriate
category of `README.md`, and open a PR. A candidate listing line (replace
`REAL_GLAMA_PATH` only with the confirmed actual path) is:

```markdown
- [w3c-cg/sstim](https://github.com/w3c-cg/sstim) 📇 ☁️ 🍎 🪟 🐧 - Read-only SSTIM ontology reference MCP server for released sensory-stimulation terms, mappings and provenance; install with `npx -y @sstim/mcp@0.2.0`. [![SSTIM MCP score](https://glama.ai/mcp/servers/REAL_GLAMA_PATH/badges/score.svg)](https://glama.ai/mcp/servers/REAL_GLAMA_PATH)
```

`☁️` is appropriate because the local client reads an online concept
reference API, although the executable itself runs on the user's computer.
Use the icons/category accepted by the upstream list at submission time.

### MCP.so

Open [MCP.so Submit Server](https://mcp.so/submit?type=server). Use the
canonical source, npm command, description, and credit shown above.
This is an interactive external website submission and may require
authentication. Its paid fast-track is **not** required for our first try.

### Other directories

Check each service's current rules before submitting. Maintain **one**
canonical npm package/version and **one** W3C CG GitHub source, rather than
creating separately hosted forks. Do not describe the stdio server as a
hosted public connector or assert a clinical outcome.

## Maintenance and verifiable acceptance

The package's npm tarball for version `0.2.0` is **immutable**. Updating
the repository README or example files does not retroactively change the
published npm tarball; package metadata/docs will catch up at a future
intentional package release. No package version bump is required to update
the GitHub install instructions or submit directory listings.

To republish the **official registry metadata** in a future version, use
the repository's protected, manually triggered
[Publish SSTIM MCP to Official Registry workflow](../../.github/workflows/publish-mcp-registry.yml)
on `w3c-cg/sstim` main. It authenticates using GitHub Actions OIDC,
without npm tokens or personal owner credentials. First synchronize
the exact same commit to both SSTIM remotes using `make push`.
The 0.2.0 registry registration has already succeeded; do **not**
rerun publishing merely to list the same artifact elsewhere.

Mark public distribution complete only after the independent directories
actually show the entry or an upstream PR is accepted. Track Glama URL
and score, Awesome PR URL/merge, and MCP.so listing URL. The official
registry identity remains `io.github.w3c-cg/sstim`.
