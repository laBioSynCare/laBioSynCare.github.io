# SSTIM Reference: Anthropic / Claude publication checklist

Prepared November 2026. **Status, seen 27 November 2026: submitted, waiting for
review, not yet published.** [claude.ai/directory/manage](https://claude.ai/directory/manage)
lists the SSTIM Reference plugin (source `w3c-cg/sstim`) with "Scan passed",
last scanned 19 November, and "Publish requested. Your request is waiting for an
Anthropic reviewer." Anthropic's official marketplace
([anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official))
had no SSTIM entry the same day. Do not confuse this with the SSTIM plugin
already listed in SSTIM's own Claude Code marketplace.

## Recommended distribution

**Primary: Claude Plugin Directory**, public GitHub source with remote MCP + skill. **CURRENT official submission location (2026-11-18): [claude.ai/directory/manage](https://claude.ai/directory/manage)**. Anthropic moved new submissions away from Console; `platform.claude.com/plugins/submit` now shows a banner saying Console can no longer create or submit. The new developer portal is open to users on paid Claude plans (Anthropic 2026-09-25 announcement). Select **Plugin bundle** and submit this public GitHub repository `https://github.com/w3c-cg/sstim` with relative path `plugins/claude/sstim-reference` when asked. Do not submit the OpenAI plugin ZIP: Claude's source is the directory `plugins/claude/sstim-reference/` in GitHub, with `.claude-plugin/plugin.json`, `.mcp.json`, `skills/`, and `assets/`.

**Secondary: standalone MCP connector listing**, universal remote MCP `https://sstim-mcp.netlify.app/mcp`. The [same new developer portal](https://claude.ai/directory/manage) offers a **Single MCP connector** submission. Do not assume the legacy Team/Enterprise admin submission links are required for an individual developer. This listing is optional after submitting the plugin bundle and should be evaluated for duplication.

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
- Operator/publisher: individual authorized to submit through the Claude developer directory; SSTIM's CG stewardship is distinct from publisher legal identity and from W3C endorsement.

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
- Sign into https://claude.ai/directory/manage with a paid Claude account, select **Plugin bundle**, and submit the public **GitHub URL** plus the plugin's relative directory path (not ZIP). If the portal rejects the submission, capture the exact error before modifying any files.
- Monitor the submission through Anthropic's portal. Approval is not guaranteed.

Official current submission entry: https://claude.ai/directory/manage ; Anthropic's September 25, 2026 announcement: https://claude.com/resources/articles/build-plugins-for-claude ; official Anthropic marketplace README: https://github.com/anthropics/claude-plugins-official . Some older documentation pages still reference the retired Console form; follow the live portal.
