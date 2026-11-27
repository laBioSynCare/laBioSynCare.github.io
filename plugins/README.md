# SSTIM agent plugins

Five folders package the SSTIM reference for different AI hosts. Three start the
published [`@sstim/mcp`](../packages/sstim-mcp/) server locally over stdio. Two
connect to the hosted, read-only endpoint `https://sstim-mcp.netlify.app/mcp`,
whose source is [`services/sstim-mcp-remote/`](../services/sstim-mcp-remote/).
None of them can change canonical RDF.

| Folder | Host | MCP server | Distributed through | State, 27 November 2026 |
|---|---|---|---|---|
| [`chatgpt-remote/`](chatgpt-remote/) | ChatGPT (OpenAI "With MCP" plugin) | Hosted endpoint, four knowledge tools | ChatGPT's plugin directory, as SSTIM Reference | Published, plugin version 0.1.0 ([record](../docs/ecosystem/OPENAI_PLUGIN_SUBMISSION.md)) |
| [`claude/sstim-reference/`](claude/sstim-reference/) | Claude and Claude Code | Hosted endpoint, four knowledge tools | Anthropic's plugin directory; this repository's marketplace as `sstim-reference@sstim` | Directory: scan passed 19 November, waiting for an Anthropic reviewer ([record](../docs/ecosystem/ANTHROPIC_PLUGIN_SUBMISSION.md)). Marketplace: installable |
| [`claude-code/sstim/`](claude-code/sstim/) | Claude Code | `npx --yes @sstim/mcp@latest`, eight tools | This repository's marketplace as `sstim-sensory-reference@sstim` | Installable |
| [`sstim/`](sstim/) | Agent Plugins 1.0 hosts, such as VS Code | `npx --yes @sstim/mcp@latest`, eight tools | Load the folder locally | Not listed anywhere |
| [`chatgpt/`](chatgpt/) | ChatGPT desktop hosts that run local MCP servers | `npx --yes @sstim/mcp@latest`, eight tools | Load the folder locally | Not listed anywhere |

The eight stdio tools are the four knowledge tools plus four proposal tools.
The proposal tool that opens a GitHub issue refuses to run unless the operator
enables it; see
[`AGENT_PLUGINS_AND_CONTRIBUTIONS.md`](../docs/ecosystem/AGENT_PLUGINS_AND_CONTRIBUTIONS.md).
The hosted endpoint has no proposal tools at all.

## Install from this repository

The root [`.claude-plugin/marketplace.json`](../.claude-plugin/marketplace.json)
lists both Claude plugins:

```bash
claude plugin marketplace add w3c-cg/sstim
claude plugin install sstim-reference@sstim            # hosted endpoint
claude plugin install sstim-sensory-reference@sstim    # local stdio server
```

Without a plugin, any client that accepts a remote MCP server can use the URL
directly, for example
`claude mcp add --transport http sstim https://sstim-mcp.netlify.app/mcp`.

## Two folders must not drift from what was submitted

- **`chatgpt-remote/`.** `plugin.json`, `mcp.json`, `assets/` and `skills/`
  are byte-identical to the ZIP that OpenAI published. Change them only as part
  of uploading a new version, then update the record's "What OpenAI holds"
  section. The folder's README is not part of the upload.
- **`claude/sstim-reference/`.** Anthropic reads this folder directly from
  `w3c-cg/sstim`, and its portal shows a scan date, not a commit. Leave the
  folder unchanged until the review ends, or the reviewer may see a version
  that did not pass the scan.

## Versions and shared text

The plugin versions, all 0.1.0, are independent of the npm package and of SSTIM
releases. The stdio folders follow `@sstim/mcp@latest`, so a new npm release
reaches them without a plugin change. The two remote folders follow whatever
the hosted endpoint serves.

The skill `sstim-sensory-reference` has three texts: one shared byte for byte by
the three stdio folders, and one each for ChatGPT and Claude that describe the
hosted endpoint. When the shared text changes, change all three copies.

## Checks

[`sstim-claude-plugin.yml`](../.github/workflows/sstim-claude-plugin.yml) runs
`claude plugin validate --strict` on the Claude plugin whenever it or the
marketplace changes. [`sstim-mcp-remote.yml`](../.github/workflows/sstim-mcp-remote.yml)
tests the hosted adapter whenever the adapter or `chatgpt-remote/` changes. No
test or workflow reads the three stdio folders.
