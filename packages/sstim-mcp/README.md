# SSTIM MCP reference adapter

**Status:** local, read-only MCP server over stdio. Supports the **current MCP
`2026-07-28` stateless protocol** and legacy initialization-based clients
(`2025-11-25`, `2025-06-18`, `2024-11-05`).

The adapter retrieves frozen SSTIM release data from the
[Concept Reference API](../../docs/technical/CONCEPT_REFERENCE_API.md). It is
not an ontology server, a write API, a hosted remote MCP endpoint, or a GitHub
connector. Its four tools require no API key or additional runtime npm packages.

## Distribution and authorship

**Primary author and responsible project:** the
[SSTIM W3C Community Group](https://www.w3.org/community/sstim/).
The canonical source is [w3c-cg/sstim](https://github.com/w3c-cg/sstim).

**Acknowledgement:** [BioSynCare](https://biosyncare.com), for its
contributions to and support of SSTIM's wider ecosystem. BioSynCare is not
the authority behind the open SSTIM vocabulary.

Community Group work is not a W3C Recommendation or a W3C-endorsed product.

### Install from npm (once released)

The package is prepared for publication as **`@sstim/mcp@0.2.0`**, under
the same established `@sstim` scope as `@sstim/core`.
After an authorized npm publisher publishes the package, use:

```bash
npx --yes @sstim/mcp@0.2.0
```

For MCP clients, set command `npx` and args
`["--yes", "@sstim/mcp@0.2.0"]`. For example, VS Code:

```json
{
  "servers": {
    "sstim": {
      "type": "stdio",
      "command": "npx",
      "args": ["--yes", "@sstim/mcp@0.2.0"]
    }
  }
}
```

This is the **post-publication configuration**, not yet a claim that npm hosts
the package. Unlike the local-checkout examples below, it requires no SSTIM
source checkout. Pin an explicit package version for reproducible installations.
A local checkout remains supported for development.

Publication metadata is in [`server.json`](server.json) and
[`package.json`](package.json). The official MCP Registry identity is
`io.github.w3c-cg/sstim`, requiring an authorized publisher for the GitHub
organization namespace. See
[distribution steps](../../docs/ecosystem/MCP_DISTRIBUTION.md).

## Prerequisites

- Node.js 20+ on the machine where the AI client runs.
- An SSTIM checkout for **local development**, for example `git clone https://github.com/w3c-cg/sstim` (not needed once installed from npm).
- Network access to the read-only reference API (default below).
- An AI client with support for local stdio MCP servers.

For each **local-checkout** example below, **replace**
`/absolute/path/to/sstim/packages/sstim-mcp/server.mjs` with the actual **absolute
path** to this file. On Windows, use a path like
`C:/Users/you/sstim/packages/sstim-mcp/server.mjs` and ensure `node` is in
the launching application's `PATH`.

The server is launched by the AI client. Running it manually will appear idle
because it waits for JSON-RPC messages on stdin. It must not emit human-readable
logs to stdout.

## Four available tools

| Tool | Result |
|---|---|
| `sstim_list_releases` | Supported frozen releases and latest available version |
| `sstim_search_concepts` | Search terms by IRI/CURIE, labels, alternatives or definition |
| `sstim_get_concept` | Retrieve exact term, definitions, declared relationships, source provenance |
| `sstim_prepare_feedback` | User-facing Contribution Bridge link; nothing is submitted |

All four tools are **read-only**. The feedback tool generates only a link with
the selected public concept ID and label, without copying conversation text.
The user reviews any issue and decides whether to publish it. No writes to
SSTIM occur through these tools.

## Configure your software

Choose **one** configuration appropriate to the AI client in use. They are
not interchangeable. Sample files are in [`examples/`](examples/).

### 1. VS Code: GitHub Copilot Chat (Agent mode)

Create or update `.vscode/mcp.json` in **your project** using the
[`examples/vscode.mcp.json`](examples/vscode.mcp.json) contents:

```json
{
  "servers": {
    "sstim": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/sstim/packages/sstim-mcp/server.mjs"]
    }
  }
}
```

In VS Code run **MCP: List Servers** (or use MCP commands in the Command
Palette), start `sstim`, then open **GitHub Copilot Chat → Agent mode** and
enable the SSTIM tools in the tool picker.

This is VS Code's `servers` format, **not** the `mcpServers` format used by
Cursor and Gemini. VS Code can also use a portable project-root `.mcp.json`,
which has different keys; see its
[official MCP setup](https://code.visualstudio.com/docs/agent-customization/mcp-servers).

### 2. VS Code: OpenAI Codex extension / Codex CLI

Codex's IDE extension and CLI share `~/.codex/config.toml` (or supported
project-scoped `.codex/config.toml`). Append the contents of
[`examples/codex.config.toml`](examples/codex.config.toml):

```toml
[mcp_servers.sstim]
command = "node"
args = ["/absolute/path/to/sstim/packages/sstim-mcp/server.mjs"]
```

Or configure the server via the Codex IDE extension:
**Settings → MCP servers → Add server → STDIO**. Restart the extension if
prompted. In the CLI, `codex mcp list` can show the configured servers.
This configuration is separate from `.vscode/mcp.json` for Copilot Chat.

Reference: [Codex MCP configuration](https://developers.openai.com/codex/mcp).

### 3. VS Code: Claude Code extension / Claude Code CLI

Run in a terminal (using the same Claude Code installation as your extension):

```bash
claude mcp add --transport stdio --scope user sstim -- node /absolute/path/to/sstim/packages/sstim-mcp/server.mjs
claude mcp get sstim
```

Then open Claude Code (CLI or VS Code extension) and check the **/mcp** menu
to confirm the server is connected and tools are visible. The `--` separator
is important: arguments after it belong to `node`, not to Claude's CLI.
For a shared project installation instead of a personal user installation,
consult the project's `.mcp.json` and approval rules.

Reference: [Claude Code MCP setup](https://code.claude.com/docs/en/mcp).

### 4. Gemini CLI (including inside VS Code's terminal)

Add to your user `~/.gemini/settings.json` or project
`.gemini/settings.json`:

```json
{
  "mcpServers": {
    "sstim": {
      "command": "node",
      "args": ["/absolute/path/to/sstim/packages/sstim-mcp/server.mjs"]
    }
  }
}
```

See [`examples/gemini.settings.json`](examples/gemini.settings.json).
Alternatively use:

```bash
gemini mcp add -s user sstim node /absolute/path/to/sstim/packages/sstim-mcp/server.mjs
```

Open Gemini CLI and use **/mcp** to inspect connectivity and exposed tools.

**Gemini CLI is not the same product as the Gemini Code Assist VS Code
extension.** This configuration applies to the CLI; support for an extension
must be verified against that extension's own settings.
Reference: [Gemini CLI MCP](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md).

### 5. Cursor

Create a project `.cursor/mcp.json`, or `~/.cursor/mcp.json` globally,
with the contents of [`examples/cursor.mcp.json`](examples/cursor.mcp.json):

```json
{
  "mcpServers": {
    "sstim": {
      "command": "node",
      "args": ["/absolute/path/to/sstim/packages/sstim-mcp/server.mjs"]
    }
  }
}
```

Open **Cursor Settings → Tools & MCP** and verify the server is connected.
Ask Cursor Agent to use `sstim_search_concepts`.

Reference: [Cursor MCP documentation](https://prod.cursor.com/docs/mcp).

### 6. Neovim with CodeCompanion.nvim

Neovim does not supply an AI/MCP client merely by being installed. If you use
[CodeCompanion.nvim](https://codecompanion.olimorris.dev/configuration/mcp),
add this to its setup (or integrate the `mcp` table into existing config):

```lua
require("codecompanion").setup({
  mcp = {
    servers = {
      sstim = {
        cmd = { "node", "/absolute/path/to/sstim/packages/sstim-mcp/server.mjs" },
      },
    },
    opts = {
      default_servers = { "sstim" },
    },
  },
})
```

See [`examples/neovim-codecompanion.lua`](examples/neovim-codecompanion.lua).
Open a CodeCompanion chat and access MCP tools using the `@mcp:` tool group
or the `/mcp` picker, depending on your CodeCompanion version. The plugin's
MCP client currently supports the older `2025-11-25` handshake, which this
server continues to accept.

For **classic Vim**, no built-in MCP client is assumed. You can use the Claude
Code, Codex, or Gemini CLI configuration above in a terminal inside or outside
Vim; do not paste Neovim Lua into a traditional `.vimrc`.

## Verify the installation

After configuring your chosen client, ask:

> Use the SSTIM MCP tools to list the current released version, search for
> “binaural”, and explain one matched concept using its canonical IRI and
> source provenance. Compare the results for v0.18.0 and v0.19.0 if applicable.

The search tools may be automatically chosen by the agent, but whether a tool
is called depends on client settings and model behavior. You can also inspect
the tool inventory in your host's MCP panel.

For tests inside this repository:

```bash
npm test -- --run packages/sstim-mcp/mcp.test.mjs
npm run check
npm run build
```

The tests exercise mocked API data, legacy and modern MCP handshakes, stdio
framing, and editor-config example syntax. They do not certify interoperability
with every named editor release.

## Protocol versions and constraints

`2026-07-28` is the current MCP protocol revision. Unlike
`2025-11-25`, which negotiates a process-scoped session via
`initialize` / `notifications/initialized`, the new revision uses
**per-request** metadata. This server implements both paths:

- **Modern clients:** `server/discover` advertises `2026-07-28`, tools are
  usable without `initialize`, and every request carries
  `params._meta["io.modelcontextprotocol/protocolVersion"]` and
  `params._meta["io.modelcontextprotocol/clientCapabilities"]`.
  Results declare `resultType: "complete"` and server identity metadata.
- **Older clients:** continue using the legacy `initialize` handshake and
  legacy response structure. Supporting this version remains important for
  real installed clients, including some Neovim plugins.

The modern revision does **not** mean the server must be remote: stdio remains
a defined transport. There is currently **no Streamable HTTP endpoint** for
SSTIM MCP; remote ChatGPT connectors would require a separate deployment.

Protocol references:
[MCP 2026-07-28 versioning](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning),
[stdio transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio),
[discovery](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2026-07-28/server/discover.mdx).

The latest frozen release comes from API discovery, not from a hard-coded
runtime constant. At the time of this update it is **v0.19.0**; the separately
maintained development line is **v0.20.0-dev**. For repeatable research use an
explicit frozen release in tool arguments.

**Operational limits:** read-only catalog; up to 20 search results;
no hosted `?q=` search; no API key; no write tools; no live ontology inference,
adjudication of scientific disputes, or guaranteed clinical meaning.
The default reference URL is
`https://w3c-cg.github.io/sstim/api/v1/`.
An operator can override it with `SSTIM_MCP_API_BASE`, using HTTPS or
loopback HTTP for testing. A per-process cache keeps repeated requests local
until restart. Outputs retain term IRIs, release identity and source links.

