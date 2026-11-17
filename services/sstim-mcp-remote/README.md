# SSTIM remote MCP adapter (Netlify)

A public, **read-only** Streamable HTTP MCP adapter for SSTIM's existing released Concept Reference API. This is an independently deployed service, **not** the SSTIM Workbench static site. The ontology, frozen releases, and GitHub Pages content remain the authority.

**Source**: `@sstim/mcp/client` from the published `@sstim/mcp@0.3.0` package. **Runtime**: official MCP SDK in a stateless Netlify Function. No user accounts, database, credentials or submission tool.

## Tools

`sstim_list_releases`, `sstim_search_concepts`, `sstim_get_concept`, and `sstim_prepare_feedback`. All are read-only. The local stdio package retains additional contribution draft/read/submit tools, but `sstim_submit_contribution` is intentionally **not exposed** here. Use the human-reviewed [Contribution Bridge](https://w3c-cg.github.io/sstim/contribute/) instead.

## Netlify deployment (live since 2026-11-17)

1. In the Netlify Free-plan team, use project `sstim-mcp` (site ID `b5681e47-3190-4366-8815-504899d12108`).
2. Connect the **w3c-cg/sstim** GitHub repository to this *new*, independent Netlify site.
3. Set **Base directory** to `services/sstim-mcp-remote` and production branch `main`. Netlify will read this directory's `netlify.toml`, install package dependencies, and bundle `netlify/functions/mcp.mjs`.
4. Keep the project public and on the Free plan. Do not configure tokens or GitHub Issues write secrets.
5. The endpoint `https://sstim-mcp.netlify.app/mcp` is **deployed and live smoke-tested** in [GitHub Actions](https://github.com/w3c-cg/sstim/actions/runs/44186545274). The root page is informational; MCP requests use POST.
6. When OpenAI prompts for domain verification, place **the exact challenge string** at the URL it provides. Do not fabricate a token. It can be served by a dedicated Netlify function or a static `public/.well-known/openai-apps-challenge` file.

Do not attempt to host this on GitHub Pages: the MCP endpoint needs server-side POST handling, while the [Concept Reference API](https://w3c-cg.github.io/sstim/api/v1/index.json) remains static.

## Local tests

```sh
cd services/sstim-mcp-remote
npm install --ignore-scripts
npm test
npx netlify dev
```

Use `npx @modelcontextprotocol/inspector` with Streamable HTTP at `http://localhost:8888/mcp`, or point a compatible MCP client directly to the public HTTPS URL after deployment. Validate `tools/list` and a release-pinned lookup. The separate GitHub Actions live smoke workflow also checks the deployed HTTPS endpoint end to end.

### Data and safety

This endpoint reads public ontology metadata only. Search strings and term identifiers are sent to the hosting function and used to access the public GitHub Pages API; no user-submitted clinical or confidential data should be entered. The adapter has no storage code; hosting providers may retain operational request logs. Provider rate limiting is configured. Outputs are published reference records, not clinical advice or independent efficacy evidence.

See [privacy](../../docs/ecosystem/SSTIM_MCP_PRIVACY.md), [terms](../../docs/ecosystem/SSTIM_MCP_TERMS.md), and [OpenAI review prep](../../docs/ecosystem/OPENAI_PLUGIN_SUBMISSION.md).
