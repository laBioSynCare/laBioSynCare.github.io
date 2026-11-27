# SSTIM Agent Plugins and GitHub-backed MCP proposals

Status (2026-11-27): @sstim/mcp@0.3.1 is on npm and in the official MCP Registry. A public read-only remote MCP is deployed at https://sstim-mcp.netlify.app/mcp. The OpenAI plugin is published: version 0.1.0 appears in ChatGPT's plugin directory. The Claude remote plugin passed Anthropic's scan and is waiting for an Anthropic reviewer, so it is not yet published. Details are in the [OpenAI](OPENAI_PLUGIN_SUBMISSION.md) and [Anthropic](ANTHROPIC_PLUGIN_SUBMISSION.md) submission records.

## Scope and value

Explore the senses. Understand stimuli. Advance knowledge.

The SSTIM reference can help agents explore stimulus properties, sensory
processes, perceptual phenomena, sound and music-based practices,
experimental methods, multimodal technology, and connected scientific
evidence. It is not yet a comprehensive encyclopedia of perception, nor
does an ontology entry prove a therapeutic outcome.

## Packages

- Portable Agent Plugins 1.0 directory: plugins/sstim/
  Includes a sensory-reference skill and stdio MCP for VS Code and other
  compatible Agent Plugins hosts.
- Claude Code (original local stdio): plugins/claude-code/sstim/
  Includes the eight-tool local MCP package and proposal draft/read/submit tools.
- Claude public read-only: plugins/claude/sstim-reference/
  Includes native .claude-plugin manifest, HTTPS Streamable HTTP MCP config, icon,
  research skill and public directory submission materials. No GitHub writes.
  The root .claude-plugin/marketplace.json exposes both options.
- ChatGPT: plugins/chatgpt/
  Portable skill plus optional local stdio MCP. Compatible ChatGPT Desktop
  installations may run the local MCP after required permissions and setup.
  This is not yet a remote ChatGPT MCP app; web/mobile access requires a
  separately hosted, accessible HTTPS endpoint.

All configured MCP commands use npx --yes @sstim/mcp@latest, which has
resolved 0.3.0 with its proposal tools since 2026-10-11. Submission stays
disabled unless the operator opts in, as described below.

## Local development

To exercise unreleased source changes, run
node packages/sstim-mcp/server.mjs as a local stdio MCP server.

Public GitHub proposal submission is disabled by default. The operator must
set SSTIM_ENABLE_PUBLIC_SUBMISSIONS=1 and SSTIM_GITHUB_TOKEN,
set securely in the host environment, with Issues write permission for
w3c-cg/sstim. An explicit approvedForPublicSubmission true argument is
required for each exact public proposal. Never place tokens in plugin
manifests, Git or prompts.

Supported proposals: correction, missing-knowledge, scientific-evidence,
interoperability, research-need and other. Each submission is a GitHub issue,
not canonical SSTIM RDF. Draft/list/get tools require no credentials.
No automatic evidence acceptance or human-review bypass exists.

## Installation paths

Claude Code with a compatible version may use:
  claude plugin marketplace add w3c-cg/sstim
  claude plugin install sstim-sensory-reference@sstim

If marketplace support differs, use the standalone documented MCP
installation in packages/sstim-mcp/README.md instead.

VS Code and Copilot users may load the portable folder plugins/sstim/
via their installed Agent Plugins feature, or use the existing
.vscode/mcp.json example for read-only MCP access. A VSIX is not required
for basic MCP usage. Client-specific behavior still needs testing.

ChatGPT users may install the skill and, on compatible desktop hosts, use the local stdio MCP with the necessary permissions. A ChatGPT
plugin combining the new MCP tools with that skill awaits a real hosted
Streamable HTTP endpoint, user-specific authorization, directory review
and proof of secure write behavior. Do not invent an endpoint or present
the current stdio service as publicly deployable.

## Release gates

1. Verify source mock-backed tests, protocol dispatcher, security cases,
   static build, RDF CI and deployment tests on main.
2. Done 2026-10-11 except trusted publication. @sstim/mcp@0.3.0 is on npm
   and is the official registry's latest version, and a real install lists
   eight tools. The OIDC publish run got E404, so the release went out with
   the maintainer's token; configure the npm trusted publisher before the
   next release (MCP_DISTRIBUTION.md).
3. Test plugins in real Claude Code, VS Code/Copilot and ChatGPT clients,
   then package and submit to applicable marketplaces.
4. Deploy an authenticated remote MCP service for ChatGPT only after
   specifying user identities, consent, moderation, rate limits and
   GitHub issue permissions. The current static site does not provide it.
5. Keep the separate deferred RDF and annotation invitation plan deferred:
   no protected RDF or frozen releases change here.

## 2026-11 Anthropic publication update

The public Claude plugin uses the existing production Netlify endpoint and does not require a new service or authentication. See [Anthropic submission checklist](ANTHROPIC_PLUGIN_SUBMISSION.md). The original local MCP has additional submission tools disabled by default; it remains separate. The official Anthropic Plugin Directory is not the same as this repository's self-hosted marketplace and requires a developer submission and review.
