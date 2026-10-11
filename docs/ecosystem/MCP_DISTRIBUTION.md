# SSTIM MCP distribution and directory submissions

**Verified publication state (11 October 2026):** SSTIM MCP
`@sstim/mcp@0.3.0` is published on npm as `latest`. Installed from the
registry into an empty directory, its executable listed eight tools over
stdio, answered a live `sstim_list_releases` call, and refused
`sstim_submit_contribution` in an environment without the operator opt-in.
`io.github.w3c-cg/sstim` 0.3.0 is the latest version in the **official MCP
Registry**, published by [GitHub Actions run #38163932454](https://github.com/w3c-cg/sstim/actions/runs/38163932454).
0.2.0 (10 October, [run #38037758861](https://github.com/w3c-cg/sstim/actions/runs/38037758861))
remains installable.

**0.3.0 was published with a token, not through trusted publishing.** The
[npm workflow](../../.github/workflows/publish-mcp-npm.yml) reached
`npm publish` in [run #38163609338](https://github.com/w3c-cg/sstim/actions/runs/38163609338)
and got E404 on the upload: the OIDC exchange did not authorize the workflow,
which is what a missing or mismatched trusted publisher produces. The entry
cannot be read from here, because `npm trust list` answers 403 to a token that
bypasses 2FA. The same commit (`4e26a6f`) was then published with the
maintainer's local granular token, as 0.2.0 was, and its tarball shasum
(`97111d7d…`) matched the one CI had tested. 0.3.0 therefore carries no
provenance attestation. Before the next release, add the trusted publisher in
the `@sstim/mcp` package settings on npmjs.com: GitHub Actions, organization
`w3c-cg`, repository `sstim`, workflow `publish-mcp-npm.yml`.

**Not yet verified/submitted:** Glama, Awesome MCP Servers, MCP.so and other
community directories. Public registry publication does not itself prove a
separate directory entry exists. Do not mark them complete without a live
listing or accepted pull request.

## Project ownership and attribution

- **Author and primary responsible project:** [SSTIM W3C Community Group](https://www.w3.org/community/sstim/).
- **Canonical repository:** [w3c-cg/sstim](https://github.com/w3c-cg/sstim).
- **Acknowledgement:** [BioSynCare](https://biosyncare.com), for contributions
  to and support of SSTIM's ecosystem.
- **Published npm package:** [@sstim/mcp@0.3.0](https://www.npmjs.com/package/@sstim/mcp).
- **Official registry identity:** `io.github.w3c-cg/sstim`.
- **Transport:** local stdio, not a hosted HTTP connector.
- **Licensing:** Apache-2.0 for the MCP implementation. The underlying
  ontology term content has its separately documented attribution and license.

SSTIM is developed through a W3C Community Group; it is **not** a W3C
Recommendation or a technology formally endorsed by W3C. Do not describe
BioSynCare as the owner of the standard or the registry namespace.

## Installation for public listings

**For users:** Node.js 20+ and any local stdio MCP client. From outside the
package's own source directory:

```bash
npx --yes @sstim/mcp@0.3.0
```

The command is a stdio service and waits for client requests. To configure
VS Code/Copilot, set `.vscode/mcp.json`:

```json
{
  "servers": {
    "sstim": {
      "type": "stdio",
      "command": "npx",
      "args": ["--yes", "@sstim/mcp@0.3.0"]
    }
  }
}
```

See [per-client configurations](../../packages/sstim-mcp/README.md) for
Codex, Claude Code, Gemini CLI, Cursor, and Neovim.

## Standard directory description

**Name:** SSTIM MCP: Sensory Stimulation Reference

**Short description:** Read-only by default: MCP access to SSTIM's
versioned sensory-stimulation vocabulary, definitions, identifiers, mappings
and provenance.

**Full description (copy/paste):**

> SSTIM MCP is an open-source reference server, read-only by default, for
> SSTIM's published sensory-stimulation ontology. Give coding and research
> assistants version-qualified definitions, canonical IRIs/CURIEs,
> relationships, external vocabulary mappings, source provenance, a
> human-reviewed feedback path and structured proposal drafts; it opens a
> public GitHub issue only when its operator enables submission. Supports
> local stdio MCP with modern and legacy protocols.
> Authored and stewarded by the SSTIM W3C Community Group. With thanks to
> BioSynCare (https://biosyncare.com). Install with
> `npx --yes @sstim/mcp@0.3.0`.
> Source: https://github.com/w3c-cg/sstim.

**Suggested keywords:** sensory stimulation, neuroscience, auditory,
audiovisual, ontology, knowledge graphs, research, RDF, OWL, SKOS,
interoperability, reproducibility, MCP, AI coding assistant.

**Eight tools:** four knowledge tools, `sstim_list_releases`,
`sstim_search_concepts`, `sstim_get_concept` and `sstim_prepare_feedback`,
and four proposal tools, `sstim_draft_contribution`,
`sstim_list_contributions`, `sstim_get_contribution` and
`sstim_submit_contribution`. The feedback tool only generates a link, and
submission is refused unless the operator enables it and approves the exact
text.

**Example prompt:**

> Search SSTIM for binaural beats and related auditory stimulation terms.
> Return their canonical IRIs, definitions, mappings and provenance, and
> distinguish source assertions from your own inferred recommendations.

## Community directory publishing

### Glama (first)

1. Open [Glama: Add MCP Server](https://glama.ai/mcp/servers/add) and sign
   in through the site's GitHub login if requested.
2. Supply `https://github.com/w3c-cg/sstim` as the source repository.
   For a monorepo, identify `packages/sstim-mcp/` and npm
   `@sstim/mcp@0.3.0` if the submission UI provides these fields.
3. Use the title and description above. The root
   [`glama.json`](../../glama.json) authorizes GitHub user `ttm` to
   **claim/manage the listing**, not to replace the Community Group as
   author.
4. Verify a real server listing and a passed inspection/quality score.
   Record its **actual** Glama URL before constructing score-badge links.

Glama's [submission FAQ](https://glama.ai/mcp/faq) describes an interactive
GitHub-based Add Server form, with scanning after submission. Repository
metadata cannot submit the form by itself. Do not fabricate a listing URL or
claim it is live because `glama.json` exists.

### Awesome MCP Servers (after Glama quality score)

The [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)
curated list accepts entries as GitHub pull requests from contributor forks.
Its current automated moderation expects a **working Glama listing with a
score badge**, correct language/scope icons, and a category-appropriate,
alphabetically placed entry.

Once Glama issues the real URL, fork that repo, modify the appropriate
category of `README.md`, and open a PR. A candidate listing line (replace
`REAL_GLAMA_PATH` only with the confirmed actual path) is:

```markdown
- [w3c-cg/sstim](https://github.com/w3c-cg/sstim) 📇 ☁️ 🍎 🪟 🐧 - Read-only SSTIM ontology reference MCP server for released sensory-stimulation terms, mappings and provenance; install with `npx -y @sstim/mcp@0.3.0`. [![SSTIM MCP score](https://glama.ai/mcp/servers/REAL_GLAMA_PATH/badges/score.svg)](https://glama.ai/mcp/servers/REAL_GLAMA_PATH)
```

`☁️` is appropriate because the local client reads an online concept
reference API, although the executable itself runs on the user's computer.
Use the icons/category accepted by the upstream list at submission time.

### MCP.so

Open [MCP.so Submit Server](https://mcp.so/submit?type=server). Use the
canonical source, npm command, description, and credit shown above.
This is an interactive external website submission and may require
authentication. Its paid fast-track is **not** required for our first try.

### Other directories

Check each service's current rules before submitting. Maintain **one**
canonical npm package/version and **one** W3C CG GitHub source, rather than
creating separately hosted forks. Do not describe the stdio server as a
hosted public connector or assert a clinical outcome.

## Maintenance and verifiable acceptance

Each published npm tarball is **immutable**. Updating
the repository README or example files does not retroactively change the
published npm tarball; package metadata/docs will catch up at a future
intentional package release. No package version bump is required to update
the GitHub install instructions or submit directory listings.

To republish the **official registry metadata** in a future version, use
the repository's protected, manually triggered
[Publish SSTIM MCP to Official Registry workflow](../../.github/workflows/publish-mcp-registry.yml)
on `w3c-cg/sstim` main. It authenticates using GitHub Actions OIDC,
without npm tokens or personal owner credentials. First synchronize
the exact same commit to both SSTIM remotes using `make push`.
The 0.3.0 registry publication has already succeeded; do **not**
rerun publishing merely to list the same artifact elsewhere.

Before any npm release, run `npm publish --dry-run` in `packages/sstim-mcp/`
and read its warnings. npm 11.21 removes a bin declared as `./server.mjs` at
publish while `npm pack` keeps it, which only the dry run showed before 0.3.0.

Mark public distribution complete only after the independent directories
actually show the entry or an upstream PR is accepted. Track Glama URL
and score, Awesome PR URL/merge, and MCP.so listing URL. The official
registry identity remains `io.github.w3c-cg/sstim`.
