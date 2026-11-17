# SSTIM Reference for Claude

A public, read-only plugin combining an Agent Skill and SSTIM's **hosted Streamable HTTP MCP server**.

## Capabilities

- `sstim_list_releases`: discover frozen reference releases
- `sstim_search_concepts`: find concepts by name, IRI, CURIE or definition
- `sstim_get_concept`: fetch version-pinned concept records and source provenance
- `sstim_prepare_feedback`: create a link for the user to review a proposed public contribution; it does not submit anything

The connector does not require accounts, OAuth, API keys, installation of Node or a local MCP process. It cannot write to GitHub or change SSTIM releases. The local eight-tool package remains separately available under `plugins/claude-code/sstim/`.

## Install and test

For direct use in Claude chat (before directory approval), go to **Customize > Connectors > Add custom connector** and enter:

- Name: `SSTIM Reference`
- URL: `https://sstim-mcp.netlify.app/mcp`
- Authentication: **No sign in**

For Claude Code, use the existing SSTIM marketplace:

```sh
claude plugin marketplace add w3c-cg/sstim
claude plugin install sstim-reference@sstim
```

Or load the checkout directly:

```sh
claude plugin validate ./plugins/claude/sstim-reference --strict
claude --plugin-dir ./plugins/claude/sstim-reference
```

These commands require Claude Code to be installed; no plugin activation has been performed automatically on your account.

## Privacy Policy

The server is read-only and does not maintain a user database or store conversations in application code. Search queries and term identifiers reach the server and the public SSTIM Concept Reference API; hosting providers may retain operational logs. Do not provide confidential, medical, or unpublished personal information to the plugin. Full terms: [SSTIM MCP Privacy Notice](https://github.com/w3c-cg/sstim/blob/main/docs/ecosystem/SSTIM_MCP_PRIVACY.md). No GitHub Issue is created by the connector; any contribution must be reviewed and submitted separately by the user.

## Attribution and maintenance

SSTIM is developed through the [SSTIM W3C Community Group](https://www.w3.org/community/sstim/); the plugin does not claim W3C Recommendation status or W3C endorsement. Source: [w3c-cg/sstim](https://github.com/w3c-cg/sstim). Issues and support: [GitHub Issues](https://github.com/w3c-cg/sstim/issues). Usage terms: [SSTIM MCP Terms](https://github.com/w3c-cg/sstim/blob/main/docs/ecosystem/SSTIM_MCP_TERMS.md).

This plugin is a **directory-submission candidate**, not an Anthropic-approved or listed plugin until published.
