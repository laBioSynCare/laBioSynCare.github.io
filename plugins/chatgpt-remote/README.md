# SSTIM remote ChatGPT plugin (submission-ready)

This standalone portable plugin is prepared for OpenAI's **With MCP** ZIP-upload submission process. Its transport is the read-only HTTPS endpoint deployed from `services/sstim-mcp-remote/`.

**Status:** public read-only MCP endpoint live and verified via GitHub Actions; packaged plugin and review materials prepared. **Not yet uploaded to, submitted to, or approved by OpenAI.** The existing `plugins/chatgpt/` remains a local stdio package and is not overwritten.

## Prerequisites

- Netlify site `sstim-mcp` deployed and verified at `https://sstim-mcp.netlify.app/mcp`.
- Verified OpenAI developer identity and portal access.
- The exact OpenAI-supplied well-known challenge token hosted on the MCP origin.
- Successful Scan Tools, positive/negative test cases and verified listing URLs.

See [submission checklist](../../docs/ecosystem/OPENAI_PLUGIN_SUBMISSION.md). Use the OpenAI **With MCP** path with the HTTPS endpoint; do not submit the local stdio JSON as a public web/mobile MCP plugin.

Project and stewardship: [SSTIM W3C Community Group](https://www.w3.org/community/sstim/). BioSynCare is a contributor/supporter, not the standards authority.
