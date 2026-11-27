# SSTIM: OpenAI public Plugin Directory submission

Prepared 17 November 2026. **Status, seen 27 November 2026: published.** The
OpenAI Platform's Plugins page lists SSTIM Reference with publication
"Version 0.1.0", MCP configuration "Configured" and no review status, and
ChatGPT's plugin directory finds it (search "sstim"; publisher Renato Fabbri,
"Sensory science reference"). Both were seen from the publisher's own accounts;
visibility to other accounts was not checked separately.

Canonical source: `w3c-cg/sstim`. The existing local `@sstim/mcp@0.3.1` remains available over stdio; a separate **read-only** remote adapter at `services/sstim-mcp-remote/` provides four tools over Streamable HTTP for public users.

## Deploy the endpoint

Netlify Free project `sstim-mcp` (site ID `b5681e47-3190-4366-8815-504899d12108`) is connected to GitHub `w3c-cg/sstim`, production branch `main`, **base directory `services/sstim-mcp-remote`**. Public endpoint: `https://sstim-mcp.netlify.app/mcp`. This is independent of the GitHub Pages website.

**Live verification:** [GitHub Actions remote MCP smoke run](https://github.com/w3c-cg/sstim/actions/runs/44186545274) passed on 2026-11-17. It tested actual HTTPS initialization, list/call tools, term retrieval, GitHub Pages Concept Reference API, feedback link, and refusal of write calls. A verified live latest release was `0.21.0` at test time; runtime discovery, not this document, determines the current latest release. Tests are in `services/sstim-mcp-remote/verification/live-smoke.mjs`.

## Publisher and review prerequisites

- OpenAI Platform: choose organization and identity with Apps Management Write permission. Complete **individual or business verification** under the actual submitting identity. Developer-name claims must match authorization and reviewer requirements; W3C Community Group stewardship is distinct from W3C organizational approval.
- Portal: Open [OpenAI Plugins](https://platform.openai.com/plugins), select **Upload new or existing plugin**, and upload a ZIP containing the files inside `plugins/chatgpt-remote/` at the ZIP root: `plugin.json`, `mcp.json`, `skills/` and `assets/`. Do not zip the entire repository. Choose your verified publisher identity. The package declares **With MCP**, universal endpoint `https://sstim-mcp.netlify.app/mcp`, no authentication, and four read-only tools.
- Under the uploaded plugin draft's **MCPs** tab, select **Connect**. Confirm the domain challenge shown by the portal, then host **only that exact token** at `https://sstim-mcp.netlify.app/.well-known/openai-apps-challenge`. Never invent or prepopulate the token. Commit a static file under `services/sstim-mcp-remote/public/.well-known/`, deploy, verify HTTPS plain text, then select Verify Domain in OpenAI.
- Perform Scan Tools and review metadata. Set `readOnlyHint: true`, `openWorldHint: true`, `destructiveHint: false` on each exposed tool. In the portal supply these per-tool justifications:
  - `sstim_list_releases`: reads bounded public release metadata; no mutation; public HTTPS API accessed.
  - `sstim_search_concepts`: reads bounded public index; no mutation; public HTTPS API accessed.
  - `sstim_get_concept`: reads exact public term record; no mutation; public HTTPS API accessed.
  - `sstim_prepare_feedback`: constructs a local link for user review; never submits; reference may require a public term lookup.
- Confirm no user authentication, GitHub write token, or contribution submission tool is enabled.
- Listing name **SSTIM Reference**. Short description **Sensory science reference**. Long description: *Explore SSTIM's published sensory-stimulation concepts, find exact IRIs and source definitions, compare frozen releases, and prepare a feedback link for human review. The server reads public semantic data and never modifies SSTIM.*
- Official homepage: `https://w3c-cg.github.io/sstim/`; support: `https://github.com/w3c-cg/sstim/issues`; privacy: `https://github.com/w3c-cg/sstim/blob/main/docs/ecosystem/SSTIM_MCP_PRIVACY.md`; terms: `https://github.com/w3c-cg/sstim/blob/main/docs/ecosystem/SSTIM_MCP_TERMS.md`. Choose category offered by the portal that best matches education/research. Review final publisher attribution before submission.
- The plugin ZIP already contains `skills/sstim-sensory-reference/SKILL.md`, the adopted SVG icon, all four listing URLs, release notes and **exactly five positive plus three negative structured test cases** in `plugin.json`. Check the portal's imported fields and add a real review video URL as required. Do not use Skills only to submit a bundled remote MCP server.

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
