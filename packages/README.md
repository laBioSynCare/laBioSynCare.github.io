# SSTIM packages

Three packages are published from this directory. Each folder's README is that
package's documentation, and each registry shows the copy that was current when
the version it serves was published.

| Folder | Published as | What it is |
|---|---|---|
| [`sstim/`](sstim/) | [`sstim`](https://pypi.org/project/sstim/) on PyPI | Python client and `sstim` command: profile resolution, complete SHACL validation (SHACL-SPARQL included), containment and namespace checks, session builder |
| [`sstim-js/`](sstim-js/) | [`@sstim/core`](https://www.npmjs.com/package/@sstim/core) on npm | The same API in JavaScript. Full-profile results are `PARTIAL`, because `rdf-validate-shacl` cannot evaluate `sh:sparql` |
| [`sstim-mcp/`](sstim-mcp/) | [`@sstim/mcp`](https://www.npmjs.com/package/@sstim/mcp) on npm, and `io.github.w3c-cg/sstim` in the [official MCP Registry](https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.w3c-cg/sstim) | Stdio MCP server: four read-only knowledge tools and four proposal tools, whose public submission stays off unless the operator enables it |

[`fixtures/`](fixtures/) holds the golden session files both clients are tested
against; it is not published. Two things outside this directory are built on
`@sstim/mcp` and released on their own: the hosted endpoint in
[`services/sstim-mcp-remote/`](../services/sstim-mcp-remote/) and the agent
plugins in [`plugins/`](../plugins/README.md). Every channel through which the
MCP server reaches users, with its current state, is listed in
[`MCP_DISTRIBUTION.md`](../docs/ecosystem/MCP_DISTRIBUTION.md).

## Versions

A package version is independent of the SSTIM release. The clients resolve the
release at run time, the latest one or the one you pin, so a new SSTIM release
needs no package release. Republish when code changes, or when a README the
registries show should catch up.

| Package | Version | Published (UTC) | What changed |
|---|---|---|---|
| `sstim` | 0.1.0 | 2026-09-18 | First release |
| `sstim` | 0.2.0 | 2026-09-28 | Session builder ([ADR 0058](../docs/decisions/0058-session-builder-in-the-clients.md)) |
| `sstim` | 0.2.1 | 2026-11-27 | The session builder accepts the `ear-one` placement; README written for SSTIM 0.21.0 |
| `@sstim/core` | 0.1.0 | 2026-09-18 | First release |
| `@sstim/core` | 0.1.1 | 2026-09-18 | The installed `sstim` command ran nothing, because npm installs a bin as a symlink (`780fcda`) |
| `@sstim/core` | 0.2.0 | 2026-09-28 | Session builder, also importable alone as `@sstim/core/session` |
| `@sstim/core` | 0.2.1 | 2026-11-27 | As `sstim` 0.2.1 |
| `@sstim/mcp` | 0.0.0-stage | 2026-10-10 | A placeholder that created the package name ("Temporary package placeholder for staged publishing"); not a release |
| `@sstim/mcp` | 0.2.0 | 2026-10-10 | First release, and the first MCP Registry entry |
| `@sstim/mcp` | 0.3.0 | 2026-10-11 | The four proposal tools |
| `@sstim/mcp` | 0.3.1 | 2026-11-27 | README only: it names the hosted endpoint and SSTIM 0.21.0 |

Dates are the registries' own upload times. The publications are recorded in
more detail in [`ADOPTION.md`](../docs/ecosystem/ADOPTION.md) §3 C for the
clients and in [`MCP_DISTRIBUTION.md`](../docs/ecosystem/MCP_DISTRIBUTION.md)
for the MCP server.

## Check what is published

Equal version numbers prove nothing about contents, so check three things:

- **Versions.** PyPI:
  `curl -s -H 'Accept: application/vnd.pypi.simple.v1+json' https://pypi.org/simple/sstim/`.
  The JSON simple index is current within minutes of an upload; PyPI's JSON
  API and pip's HTML view have lagged by hours. npm:
  `npm view @sstim/core dist-tags time`, and the same for `@sstim/mcp`. MCP
  Registry: the search link in the table above, whose `isLatest` field names
  the current entry.
- **Contents.** `npm pack @sstim/mcp@<version>` or
  `pip download sstim==<version> --no-deps` into an empty directory, unpack,
  and `diff -r` against the folder here.
- **Behaviour.** Install into an empty directory outside this checkout, where
  `npx` cannot resolve the local package instead, and validate the starter
  files: `sstim validate examples/01-stimulus-core.ttl --profile core`, and
  `02-stimulus-core-plus.ttl` with `--profile core-plus`. For the MCP server,
  list its tools and call `sstim_list_releases`.

## Release

Publishing needs registry credentials and is always a deliberate maintainer
step: no workflow publishes on push.

1. **Test.** `make sstim-package` inside `nix develop`, and
   `npx vitest run packages/sstim-js packages/sstim-mcp`.
2. **Bump the version.** Python: `packages/sstim/pyproject.toml` and
   `__version__` in `packages/sstim/src/sstim/__init__.py`. JavaScript:
   `packages/sstim-js/package.json`. MCP: `package.json`, both `version`
   fields in `server.json`, `info.version` in `server.mjs` and the expectation
   in `package.test.mjs`; then every `@sstim/mcp@<old>` pin, which the docs,
   the manual and the example client configurations all carry
   (`git grep -n '@sstim/mcp@<old>'`).
3. **Build and dry-run.** `make sstim-package-build` writes `dist/python/`;
   check it with `twine check dist/python/*`. In each npm folder, run
   `npm publish --dry-run` and read every warning: npm 11.21 silently drops a
   bin declared as `./server.mjs`, and only the dry run shows it.
4. **Commit, then publish.** `twine upload dist/python/*`, and `npm publish`
   in `packages/sstim-js/` and `packages/sstim-mcp/` (both declare public
   access). Every release so far used a maintainer's granular npm token. The
   [npm workflow](../.github/workflows/publish-mcp-npm.yml) would publish
   `@sstim/mcp` with provenance instead, but only once npm's trusted publisher
   is configured, and it is not yet.
5. **Push to both remotes** with `make push`, so the docs that name the new
   version go public with it.
6. **MCP only, in this order.** Once npm serves the version, run
   `gh workflow run publish-mcp-registry.yml -R w3c-cg/sstim --ref main`: the
   registry checks npm for the package and its `mcpName`. Then move the hosted
   adapter to the new version, as its
   [README](../services/sstim-mcp-remote/README.md#update-to-a-new-sstimmcp-release)
   describes, and push again.
7. **Verify and record.** Run the three checks above against fresh installs,
   then record the publication in `ADOPTION.md` §3 C or `MCP_DISTRIBUTION.md`.
   npm answers "being processed" for about a minute after a publish; wait
   rather than publish again.
