# SSTIM MCP public distribution

**Status:** package and listing metadata prepared in the SSTIM repository.
The npm package @sstim/mcp@0.2.0 is publicly published. Official MCP Registry
registration and directory submissions are separate actions requiring
appropriate canonical-publisher authorization.
Do not describe them as complete until they have been verified independently.

## Canonical identity and credit

- **Project / author / primary steward:** [SSTIM W3C Community Group](https://www.w3.org/community/sstim/).
- **Authoritative source:** [w3c-cg/sstim](https://github.com/w3c-cg/sstim).
- **Thanks / acknowledgement:** [BioSynCare](https://biosyncare.com),
  for contributions and support of the SSTIM ecosystem.
- **npm package candidate:** `@sstim/mcp`, initial package version `0.2.0`.
  This is an MCP adapter version, not the SSTIM ontology version.
- **Official MCP Registry identity candidate:** `io.github.w3c-cg/sstim`.

W3C Community Groups are distinct from W3C Recommendations or normative W3C
endorsement. Package authorship conveys project stewardship and does not
replace the repository's contributor history or imply W3C endorsement.

The `@sstim` npm scope is already used by `@sstim/core`. Publishing
`@sstim/mcp` still requires an npm user with appropriate rights in that
scope. Publishing registry identity `io.github.w3c-cg/sstim` may additionally
require a **w3c-cg organization owner** to authorize the official registry;
repository administrator rights alone may be insufficient.

## Gate 1: validate the tarball, then publish on npm

From a synchronized SSTIM checkout:

```bash
npm ci
npm test -- --run packages/sstim-mcp/package.test.mjs packages/sstim-mcp/mcp.test.mjs
cd packages/sstim-mcp
npm pack --dry-run --json
npm whoami
npm publish --access public
```

The package declares `bin: { "sstim-mcp": "./server.mjs" }` and carries its
own `LICENSE`, `README.md`, `server.json`, and source files. It
needs no root-SSTIM checkout or runtime dependencies once installed.
The dry-run and clean-install tests verify the actual npm tarball and CLI
bin symlink. Do not publish until tests pass, and do not publish again under
the same version: npm tarball releases are immutable.

`npm publish` is an **authorized user action**, not a result of pushing Git.
It may require an npm organizational permission grant, interactive 2FA, or
an approved trusted-publishing workflow. Do not commit publish tokens or
put them in editor MCP configurations.

**Post-publish smoke check:**

```bash
npm view @sstim/mcp@0.2.0 name version bin
npx --yes @sstim/mcp@0.2.0
```

The second command starts an MCP stdio process and waits for an MCP client,
so apparent inactivity is expected. In a configured agent, run
`sstim_list_releases` and verify that the latest released ontology version
is returned.

## Gate 2: official MCP Registry

The published `@sstim/mcp@0.2.0` package is installable via npm (verified
using `npx` outside the package source directory). The authoritative
[`server.json`](../../packages/sstim-mcp/server.json) identifies the
SSTIM W3C Community Group and credits
[BioSynCare](https://biosyncare.com). The registry publishes metadata only;
the npm package is already published and **must not be republished** merely
to fix registry authorization or shorten the `server.json` description.

The canonical registry name is `io.github.w3c-cg/sstim`. **Personal GitHub
login as `ttm` cannot publish that namespace**: interactive login permits
`io.github.ttm/*`. The official registry now requires GitHub **organization
Owner** status for interactive publication under `w3c-cg`. A repository
admin or public ordinary member cannot acquire this permission by making
their org membership public.

### Preferred: publish via canonical GitHub Actions OIDC (no stored secret)

After synchronizing both SSTIM remotes using `make push`:

1. Open [w3c-cg/sstim Actions](https://github.com/w3c-cg/sstim/actions).
2. Select **Publish SSTIM MCP to Official Registry**.
3. Use **Run workflow**, select branch **main**, then start it.
4. Inspect the run: it validates `server.json`, requests an ephemeral
   GitHub Actions OIDC token from `w3c-cg/sstim`, and submits the registry
   record with `mcp-publisher publish`.

The workflow file
[`publish-mcp-registry.yml`](../../.github/workflows/publish-mcp-registry.yml)
is manually triggered, guarded to run only on the canonical `w3c-cg/sstim`
repository's `main`, and requests only `contents: read` and
`id-token: write`. It needs **no npm token, personal access token or
other repository secret**. GitHub OIDC derives the namespace from the
repository owner, not from the person who clicks Run workflow. A future
automated publication policy should be reviewed with the Community Group
before broadening triggers or privileges.

References: [official GitHub Actions/OIDC publishing
guide](https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/github-actions.mdx)
and [authentication rules](https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/authentication.mdx).

### Alternative: an authorized organization Owner publishes interactively

An actual `w3c-cg` GitHub organization Owner can instead use:

```bash
mcp-publisher validate packages/sstim-mcp/server.json
mcp-publisher login github
mcp-publisher publish packages/sstim-mcp/server.json
```

If registry publication fails because the npm `mcpName` verification
field is missing, investigate the published tarball and metadata first.
A new npm version would require a separately validated release. Do not
switch to `io.github.ttm/sstim` just to bypass namespace authorization.

Verify the live registry record **after** successful publication:

```bash
curl -fsSL 'https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.w3c-cg/sstim'
```

Check that the registry returns the canonical name, `@sstim/mcp@0.2.0`,
stdio transport and canonical project links. Registry listing does not
imply W3C Recommendation or formal W3C endorsement.

## Gate 3: searchable directories

1. **Glama:** visit [Glama servers](https://glama.ai/mcp/servers),
   choose Add MCP Server, and submit `https://github.com/w3c-cg/sstim`.
   The repository-root [`glama.json`](../../glama.json) names the GitHub
   account authorized to claim the listing. It does not change the project's
   primary group authorship. For a monorepo, point its inspector to
   `packages/sstim-mcp` or the released npm entry as the UI permits.
2. **Awesome MCP Servers:** once the Glama entry and its quality badge are
   available, submit a concise listing to
   [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)
   according to its current contribution requirements.
3. **MCP.so:** submit the repository/package through
   [its submission page](https://mcp.so/submit?type=server).
4. **Other MCP directories:** use their current submission instructions
   and avoid claiming a remote-hosted connector exists. SSTIM MCP currently
   runs locally through stdio, not a public Streamable HTTP endpoint.

**Directory summary (copy as appropriate):**

> SSTIM MCP is a free, open-source, read-only reference server for the
> sensory-stimulation ontology developed through the SSTIM W3C Community
> Group. Retrieve released concepts, canonical IRIs, multilingual definitions,
> relationships, external mappings and provenance in AI assistants. Prepare
> user-reviewed feedback links. Supports current and legacy MCP over local
> stdio. With thanks to BioSynCare (https://biosyncare.com).
> Source: https://github.com/w3c-cg/sstim.

## Acceptance criteria

Publication is complete **only** when:

- The npm package `@sstim/mcp@0.2.0` can be installed from a clean machine
  and started in an MCP client without cloning SSTIM.
- `io.github.w3c-cg/sstim` resolves in the official Registry and names that
  published package.
- At least one community directory has an inspectable working SSTIM entry.
- Author, repository, W3C CG status, and BioSynCare acknowledgement are
  accurately represented everywhere.
- Both SSTIM GitHub remotes point to the exact same commit; use `make push`
  and read both heads back before claiming the source release is distributed.
