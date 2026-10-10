# SSTIM MCP reference adapter (local stdio)

**Status:** implemented read-only MCP adapter, driven by SSTIM's frozen
Concept Reference JSON API. Run from a local checkout with **Node.js 20+**.
No new npm dependencies, credentials, database or hosted service.

This adapter currently implements **legacy MCP protocol 2025-11-25**, with
compatibility for clients negotiating `2025-06-18` or `2024-11-05`.
Some clients implementing the July 2026 stateless MCP revision can fall back
to legacy stdio; a host locked to 2026-only protocol cannot use this adapter.
It does **not** expose a remote HTTPS MCP endpoint.

## Start the MCP server

From the SSTIM checkout:

```bash
node packages/sstim-mcp/server.mjs
```

The process reads newline-delimited JSON-RPC from stdin and returns MCP
responses on stdout. Nothing is logged to stdout except protocol messages.
A compatible MCP host starts and manages this subprocess.

Example local configuration (replace path with your absolute checkout path):

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

This configuration shape is used by hosts supporting `mcpServers`, such as
Claude Desktop. Consult your particular host's configuration guidance; placing
the file in a repository does **not** auto-install the tool in ChatGPT or other
products. ChatGPT connectors requiring remote MCP HTTPS cannot connect to a
local stdio process without a separately deployed, authenticated adapter.

## Exposed tools

| Name | Behavior |
|---|---|
| `sstim_list_releases` | Lists frozen releases exported by JSON API v1, with the latest |
| `sstim_search_concepts` | Searches labels, IRIs, CURIEs and definitions; returns at most 20 results |
| `sstim_get_concept` | Returns one released concept/class/property with source hashes, mappings and notes |
| `sstim_prepare_feedback` | Generates a link to the public Contribution Bridge (no submission) |

All tools are read-only. No tool modifies files, publishes proposals, updates
SSTIM, stores user data or silently copies private conversations. A feedback
link contains only the selected public term identifier and label; the user
must explicitly review and submit any issue using the Workbench/GitHub UI.

**Release semantics.** When `release` is omitted, discovery selects the
latest published snapshot, currently **0.19.0**. The development line,
currently `0.20.0-dev`, is never treated as a release. Clients should pass
a fixed release for reproducible research or archived records.

**Data provenance.** The MCP tools return published ontology assertions from
[Concept Reference API v1](../../docs/technical/CONCEPT_REFERENCE_API.md).
External mappings are not verified scientific equivalence or clinical evidence.
Their predicates and source provenance are retained so the consumer can judge
the scope and strength of each assertion.

## Configuration and constraints

The default JSON endpoint is:

```text
https://w3c-cg.github.io/sstim/api/v1/
```

An operator serving a copy of SSTIM may set `SSTIM_MCP_API_BASE` to its own
API endpoint (the URL must end in `/api/v1/`). HTTPS is required except for
explicit loopback development endpoints. Retrieval is bounded in duration
and response size; term detail paths are verified against the SHA-256 of the
canonical IRI. Only the configured API origin is fetched. The process has a
per-instance cache and can be restarted to refresh the reference.

**Runtime prerequisites:** Network connectivity to the configured endpoint,
a compatible MCP host, and a Node.js executable accessible to that host.
The server provides no credentials or secrets by default.

## Verify

```bash
npm test -- --run packages/sstim-mcp/mcp.test.mjs
npm run check
npm run build
```

Tests use an in-memory reference fixture and a spawned stdio process. They do
not contact GitHub Pages. The main build continues to generate the JSON API
from frozen modules; this MCP package is not bundled into the website.

## Next extension

A hosted remote MCP endpoint, if demanded by real users, should reuse this
read-only concept client but use the current official SDK and its transport/auth
requirements. Do not silently turn `sstim_prepare_feedback` into a write tool.
Proposals remain distinct from reviewed, released ontology content.
