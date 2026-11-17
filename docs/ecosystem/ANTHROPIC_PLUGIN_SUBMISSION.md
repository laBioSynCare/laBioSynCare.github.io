# SSTIM Reference: Anthropic / Claude publication checklist

Prepared November 2026. **Status: plugin prepared in GitHub; NOT submitted, reviewed, or published by Anthropic.** Do not confuse this with the SSTIM plugin already listed in SSTIM's own Claude Code marketplace.

## Recommended distribution

**Primary: Claude Plugin Directory**, public GitHub source with remote MCP + skill. Official Console submission for an individual author: [platform.claude.com/plugins/submit](https://platform.claude.com/plugins/submit). This accepts a Console organization Developer, Admin or Owner; a paid personal Claude plan alone does not establish Console permissions. Team/Enterprise owners may alternatively submit through [Claude.ai](https://claude.ai/admin-settings/directory/submissions/plugins/new). Do not submit the OpenAI plugin ZIP: Claude's source is the directory `plugins/claude/sstim-reference/` in GitHub, with `.claude-plugin/plugin.json`, `.mcp.json`, `skills/`, and `assets/`.

**Secondary: Claude Connectors Directory**, standalone universal remote MCP `https://sstim-mcp.netlify.app/mcp`. Official portal: [claude.ai/admin-settings/directory/submissions/new](https://claude.ai/admin-settings/directory/submissions/new). Anthropic's current connector documentation specifies a Team or Enterprise organization with Directory management access. Individual personal plans can add custom connectors but not necessarily submit directory listings through that portal. This is distinct from the Console plugin submission.

## Listing details

- Display name: **SSTIM Reference**
- Tagline: **Versioned sensory-stimulation knowledge for Claude**
- Description: **Explore the SSTIM living reference for sensory-stimulation research and engineering. Find released ontology concepts, exact identifiers, definitions, external mappings and provenance; compare frozen releases; and prepare feedback links for human review. Read-only, public, no login or accounts. SSTIM Community Group work is not a W3C Recommendation or a clinical-efficacy certification.**
- Website: https://w3c-cg.github.io/sstim/
- Documentation: https://github.com/w3c-cg/sstim/tree/main/plugins/claude/sstim-reference
- Support: https://github.com/w3c-cg/sstim/issues
- Privacy: https://github.com/w3c-cg/sstim/blob/main/docs/ecosystem/SSTIM_MCP_PRIVACY.md
- Terms: https://github.com/w3c-cg/sstim/blob/main/docs/ecosystem/SSTIM_MCP_TERMS.md
- Source: https://github.com/w3c-cg/sstim/tree/main/plugins/claude/sstim-reference
- Auth: **none**. URL model: **universal**.
- Server: https://sstim-mcp.netlify.app/mcp
- Data source: SSTIM's own public, frozen Concept Reference API hosted on GitHub Pages.
- API data: public terminology; no private health data, user profiles, sponsored placements or financial transactions.
- Operator/publisher: individual submitting through the authorized Console organization; SSTIM's CG stewardship is distinct from publisher legal identity and from W3C endorsement.

## Four remote tools

Each is explicitly titled and has `readOnlyHint: true`, `destructiveHint: false`:
1. `sstim_list_releases`: enumerate available frozen reference versions
2. `sstim_search_concepts`: bounded full-text term search
3. `sstim_get_concept`: exact, version-pinned term retrieval
4. `sstim_prepare_feedback`: user-reviewable contribution link; no issue submission

For tool smoke-test evidence see `services/sstim-mcp-remote/verification/live-smoke.mjs` and GitHub Actions. No write tool, OAuth, personal data collection, Claude memory access or AI media generation.

## Reviewer test prompts

Positive: (1) List SSTIM frozen releases; (2) Search for stimulation concepts and show exact IRIs; (3) Retrieve a returned CURIE's source and provenance; (4) Compare one concept across two supported frozen releases; (5) Prepare a voluntary link for missing-knowledge feedback without sending anything.

Negative: (1) Submit a GitHub issue without authorization; no write tool exists; (2) Invent a nonexistent release or concept; explicit error instead; (3) Guarantee health outcomes from a terminology record; no evidence guarantee.

Reviewer access: **no account or credentials required**. Users can try the endpoint in Claude via Customize > Connectors > Add custom connector, or in Claude Code with `claude mcp add --transport http sstim https://sstim-mcp.netlify.app/mcp`.

## Pre-submission verification

- Validate the Claude manifest with a recent Claude Code CLI: `claude plugin validate ./plugins/claude/sstim-reference --strict`.
- Check the four live tools from Claude as a custom connector (separate from API-level smoke tests).
- Review and personally accept directory policy and terms, representing authorship and rights accurately.
- Confirm the Console organization role (Developer/Admin/Owner), then submit **GitHub URL** (not ZIP) to the plugin submission portal.
- Monitor the submission through Anthropic's portal. Approval is not guaranteed.

Official docs: https://claude.com/docs/plugins/submit ; https://claude.com/docs/connectors/building/submission ; https://claude.com/docs/connectors/building/review-criteria
