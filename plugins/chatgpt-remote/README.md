# SSTIM remote ChatGPT plugin (published)

This standalone portable plugin is OpenAI's **With MCP** ZIP upload of SSTIM Reference. Its transport is the read-only HTTPS endpoint deployed from `services/sstim-mcp-remote/`.

**Status:** published. Version 0.1.0 is in ChatGPT's plugin directory as SSTIM Reference (seen 2026-11-27). The upload is this directory without this README: `plugin.json`, `mcp.json`, `assets/` and `skills/`, byte for byte. The [submission record](../../docs/ecosystem/OPENAI_PLUGIN_SUBMISSION.md#what-openai-holds-version-010) gives the uploaded archive's hash and how to rebuild it. The existing `plugins/chatgpt/` remains a local stdio package and is not overwritten.

## Prerequisites

- Netlify site `sstim-mcp` deployed and verified at `https://sstim-mcp.netlify.app/mcp`.
- Verified OpenAI developer identity and portal access.
- The exact OpenAI-supplied well-known challenge token hosted on the MCP origin.
- Successful Scan Tools, positive/negative test cases and verified listing URLs.

See [submission checklist](../../docs/ecosystem/OPENAI_PLUGIN_SUBMISSION.md). Use the OpenAI **With MCP** path with the HTTPS endpoint; do not submit the local stdio JSON as a public web/mobile MCP plugin.

Project and stewardship: [SSTIM W3C Community Group](https://www.w3.org/community/sstim/). BioSynCare is a contributor/supporter, not the standards authority.
