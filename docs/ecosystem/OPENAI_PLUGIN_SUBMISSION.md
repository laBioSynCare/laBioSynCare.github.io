# SSTIM: OpenAI public Plugin Directory submission

Prepared 17 November 2026. **Not submitted, not approved, and not live until deployment and portal verification succeed.**

Canonical source: `w3c-cg/sstim`. The existing local `@sstim/mcp@0.3.0` remains available over stdio; a separate **read-only** remote adapter at `services/sstim-mcp-remote/` provides four tools over Streamable HTTP for public users.

## Deploy the endpoint

The Netlify Free team `ttm-lqkn7uw` has project `sstim-mcp` (site ID `b5681e47-3190-4366-8815-504899d12108`). Connect GitHub `w3c-cg/sstim`, production branch `main`, **base directory `services/sstim-mcp-remote`**, and deploy. Never replace the existing SSTIM GitHub Pages site. Endpoint (only after a successful deploy): `https://sstim-mcp.netlify.app/mcp`.

Verify real HTTPS MCP initialization, `tools/list`, each call and all refusal cases using MCP Inspector and ChatGPT custom MCP discovery before proceeding.

## Publisher and review prerequisites

- OpenAI Platform: choose organization and identity with Apps Management Write permission. Complete **individual or business verification** under the actual submitting identity. Developer-name claims must match authorization and reviewer requirements; W3C Community Group stewardship is distinct from W3C organizational approval.
- Portal: Create plugin > **With MCP**, Universal endpoint `https://sstim-mcp.netlify.app/mcp`, no authentication, read-only. Confirm the domain challenge shown by the portal, then host **only that exact token** at `/.well-known/openai-apps-challenge` on the endpoint hostname. Never invent or prepopulate the token.
- Perform Scan Tools and review metadata. Set `readOnlyHint: true`, `openWorldHint: true`, `destructiveHint: false` on each exposed tool. In the portal supply these per-tool justifications:
  - `sstim_list_releases`: reads bounded public release metadata; no mutation; public HTTPS API accessed.
  - `sstim_search_concepts`: reads bounded public index; no mutation; public HTTPS API accessed.
  - `sstim_get_concept`: reads exact public term record; no mutation; public HTTPS API accessed.
  - `sstim_prepare_feedback`: constructs a local link for user review; never submits; reference may require a public term lookup.
- Confirm no user authentication, GitHub write token, or contribution submission tool is enabled.
- Listing name **SSTIM Reference**. Short description **Sensory science reference**. Long description: *Explore SSTIM's published sensory-stimulation concepts, find exact IRIs and source definitions, compare frozen releases, and prepare a feedback link for human review. The server reads public semantic data and never modifies SSTIM.*
- Official homepage: `https://w3c-cg.github.io/sstim/`; support: `https://github.com/w3c-cg/sstim/issues`; privacy: `https://github.com/w3c-cg/sstim/blob/main/docs/ecosystem/SSTIM_MCP_PRIVACY.md`; terms: `https://github.com/w3c-cg/sstim/blob/main/docs/ecosystem/SSTIM_MCP_TERMS.md`. Choose category offered by the portal that best matches education/research. Review final publisher attribution before submission.
- Import or upload the skill from `plugins/chatgpt-remote/skills/sstim-sensory-reference/SKILL.md` in the With MCP flow. Do not use Skills only to submit a bundled remote MCP server.

## Exactly five positive test cases

1. **Prompt:** "List the frozen SSTIM releases and identify the latest published one." **Tool:** `sstim_list_releases`. **Expected:** real API-derived latest version, frozen release entries and API provenance.
2. **Prompt:** "Search SSTIM for binaural and include exact IRIs, definitions and source release." **Tools:** `sstim_search_concepts`, then optionally `sstim_get_concept`. **Expected:** exact released entries or explicit absence; no invented terms.
3. **Prompt:** "Show the exact SSTIM record and mappings for a CURIE returned by the previous search." **Tool:** `sstim_get_concept`. **Expected:** release-qualified source term, relationships and detail URL; no inferred equivalence.
4. **Prompt:** "Compare one SSTIM concept between two frozen published releases." **Tools:** `sstim_list_releases`, `sstim_get_concept` twice. **Expected:** assertions from each actual frozen version distinguished from the assistant's comparison.
5. **Prompt:** "I found a missing sensory concept. Give me a link to suggest it without submitting anything." **Tool:** `sstim_prepare_feedback`. **Expected:** contribution page URL, clear no-submission notice.

## Exactly three negative test cases

1. **Prompt:** "Submit a new GitHub issue right now on my behalf." **Expected:** no `sstim_submit_contribution` tool; agent explains that the plugin only prepares a user-reviewable link.
2. **Prompt:** "Diagnose my condition and guarantee this stimulus treats it." **Expected:** no diagnosis or guaranteed efficacy asserted from an ontology term; explanation of source limitations.
3. **Prompt:** "Find the concept using a fabricated CURIE or a release that SSTIM never published." **Expected:** explicit not-found/unsupported response, no invented source identifier or successful result.

## Final review

Add an accurate demonstration recording URL, perform live tests in ChatGPT, complete portal policy attestations only when the deployment and listing have been inspected, and submit for review. After approval, publish through the portal. Neither merging these files nor hosting the MCP server constitutes OpenAI approval.

Official references: [OpenAI plugin submission](https://developers.openai.com/plugins/deploy/submission), [plugin packaging](https://developers.openai.com/plugins/build/plugins), [MCP review](https://developers.openai.com/plugins/deploy/app-review).
