# Usage signals: is anyone using SSTIM?

**Status:** measurement record, first reading 2026-11-28. Maintainer: Renato Fabbri.

[ADOPTION.md](ADOPTION.md) §2 asked for an instrument that reads whether SSTIM's
artifacts are being fetched, and said that until one existed, both "nobody is
using this" and "people are using this quietly" were guesses. This file holds
that instrument's readings: every public source that can see SSTIM being
fetched, installed, studied or joined, each with the instrument that read it
and the date.

It does not own what counts as adoption ([ADOPTION.md](ADOPTION.md) §1),
external records that point at an SSTIM IRI or DOI
([INBOUND_REFERENCES.md](../ontology/INBOUND_REFERENCES.md)), or who was
contacted ([OUTREACH_TARGETS.md](OUTREACH_TARGETS.md)). Repository traffic is
measured too, but kept private, as GitHub treats it. No person is named here;
people are counted.

---

## 1. The reading of 2026-11-28

**No outside party has adopted SSTIM** in the only sense
[ADOPTION.md](ADOPTION.md) §1 counts: nobody outside has published a protocol,
session or assessment in it. Nothing depends on the packages, nothing cites the
DOIs, and the Community Group has the same four participants it had in June.

**Interest is real and rising, and outsiders have started to use SSTIM as
material.** Views of the frozen releases rose from 15 to 40 per release for
0.5.0 to 0.15.0 to between 92 and 155 for 0.19.0 to 0.21.0. An unknown party fetched every
module of one release through a CDN. A research study of RDF code, a SvelteKit
analyser, an MCP catalog, an MCP scanning corpus and a knowledge-graph catalog
all picked SSTIM up without being asked.

Download counts are not users. Section 3 says why.

---

## 2. What each instrument read

| Question | Instrument | Reading, 2026-11-28 |
|---|---|---|
| Are the frozen releases looked at and downloaded? | Zenodo REST, `GET /api/records/{id}` for each version record | All 17 versions together: 804 views (759 unique) and 151 downloads (148 unique). 0.21.0 alone, in its first four weeks: 155 views (153 unique), 54 downloads (53 unique). Per release, views were 15 to 40 for 0.5.0 to 0.15.0, then 70, 67, 71, 111, 92 and 155 for 0.16.0 to 0.21.0 |
| Is the Python client installed? | pypistats.org, `overall?mirrors=false`, `system`, `python_minor`; `gh run list` | 1,496 downloads since 2026-09-18, 1,293 of them from Linux. 992 fell on 2026-10-10, the day the [`music`](https://pypi.org/project/music/) package's CI ran 319 times: its `sstim` extra requires `sstim`, and its matrix installs it on Python 3.10 to 3.14. So most PyPI downloads are this project family's own CI. Without that day, about seven a day |
| Are the JavaScript client and the MCP server installed? | `api.npmjs.org/downloads/range` | `@sstim/core`: 535, of which 363 on its two main publish days; 23 in November. `@sstim/mcp`: 799, of which 383 on its two publish days; 227 in November |
| Does anything depend on them? | deps.dev `:dependents`; GitHub `network/dependents`; `music`'s `pyproject.toml` | 0 and 0 outside. The one dependent is first-party: `music` 2.x declares `sstim` in an optional extra and writes SSTIM descriptions of its auditory stimuli. ecosyste.ms does not index the packages, so it cannot answer |
| Is anything fetched through a public CDN? | jsDelivr data API, per package and per GitHub ref | Every one of the 18 modules of 0.17.0 fetched three times through `cdn.jsdelivr.net/gh/w3c-cg/sstim@0.17.0/` on 2026-09-22; `codemeta.json` and the configuration module fetched at commit `807eb41` on 2026-11-18; 55 hits on the two npm packages, almost all on their READMEs. Nothing in this repository links to jsDelivr, so these are outside fetches, by parties unknown |
| Who watches the repositories? | GitHub API, stargazers, forks, subscribers | `w3c-cg/sstim`: 3 stars, 2 of them from outside the project; 1 fork, with no commits of its own; no outside watchers. Legacy origin: 8 stars, 7 from outside; no forks; 1 outside watcher |
| Has anyone outside opened an issue or pull request? | GitHub API, issues and pulls by author | One: an empty term-proposal template, closed on 2026-10-11 |
| Has the Community Group grown? | W3C API, `groups/cg/sstim/participations`; the `public-sstim` archive | 4 participants, the last of whom joined on 2026-06-17. Five list messages since August, each an automatic notice of a group post or report |
| Does the literature cite SSTIM? | OpenAlex `cites:W7167924725`; DataCite `citationCount`; Europe PMC full text for `"w3id.org/sstim"` | 0, 0 and 0 |
| Do MCP directories list it? | Search pages of mcp.so and MCP Market | mcp.so: no match. MCP Market: no SSTIM entry on its search page. Glama's search page does not expose results to a script and PulseMCP answers 403, so neither can answer. The official MCP Registry entry is recorded in [MCP_DISTRIBUTION.md](MCP_DISTRIBUTION.md) |
| Is it discussed in public? | Hacker News search API for `"w3id.org/sstim"`; Mastodon `#sstim`; Hugging Face search | 0 everywhere. Bluesky's search answered 403, so it cannot answer |

### Third parties that used SSTIM as material

Found with `gh search code` for the namespace, the three package names, the
registry name and the repository name, excluding SSTIM's own repositories. None
of them asked, and none is an adoption in the sense of ADOPTION.md §1, but each
is somebody else's work that SSTIM is now part of.

| Where | What | Since |
|---|---|---|
| [linked-data-python/corpus-study](https://github.com/linked-data-python/corpus-study) | An empirical study of real RDFLib code selected `scripts/sstim-definition-coverage.py` as one of its regions and ran it against the 18 released modules at commit `39360a8` | before 2026-11-03 |
| [svelte-vitals](https://github.com/oekazuma/svelte-vitals) | A SvelteKit static analyser lists `w3c-cg/sstim` among the 671 applications in its test corpus | before 2026-11-27 |
| [The Gilde](https://github.com/bendyline/gilde) | A tool catalog auto-imported `@sstim/mcp` 0.3.0 from the MCP Registry as a community toolset, unreviewed by its maintainers | after 2026-10-11 |
| [MCPScan](https://github.com/Just-Denzel/MCPScan) | An MCP-server scanning project includes `@sstim/mcp` 0.3.0 in its control sample | before 2026-11-23 |
| [Open Knowledge Graphs](https://openknowledgegraphs.com/resource/sstim/) | A catalog built from Wikidata lists SSTIM under Social and Behavioral Sciences. It shows 0.18.0 as the latest release, because the Wikidata item still ranks that version preferred | by 2026-11-12 |
| [dbpedia/kg-catalog#90](https://github.com/dbpedia/kg-catalog/issues/90) | The DBpedia KG Catalog's full download test downloaded SSTIM's one file successfully | 2026-10-23 |

---

## 3. How to read the numbers

- **Registry download counts are mostly machines, many of them ours.** Each
  package's largest days are its publish days, when mirrors, scanners and the
  maintainer's own verification installs all fetch it. `@sstim/mcp` is also
  installed by every build of the hosted adapter, and `sstim` by every run of
  the `music` package's CI. Measured against those, organic installs are a few
  a day at most.
- **Zenodo views and the jsDelivr fetch are the strongest signals of people.**
  Zenodo filters robots under COUNTER rules, and a whole release fetched module
  by module through a CDN is somebody loading SSTIM into something. Both still
  include the maintainer's own visits, so read the trend rather than the total.
- **Being found is working; being used is not yet.** Every third party in
  the table found SSTIM through a registry or a code index. None of them
  contacted the project.

## 4. What the instruments cannot see

An unreachable instrument is never evidence of absence (CLAUDE.md §3.6).

- **BioPortal visits**: the analytics API needs a key, and was not read for this reading.
- **Calls to the hosted MCP endpoint**: the endpoint keeps no counter; Netlify's
  function logs are visible only in its dashboard.
- **Visits to the Pages sites and resolutions through w3id.org**: neither keeps
  logs we can read.
- **Installs of the ChatGPT plugin**: only OpenAI's portal shows them. The Claude
  plugin is not listed yet ([ANTHROPIC_PLUGIN_SUBMISSION.md](ANTHROPIC_PLUGIN_SUBMISSION.md)).
- **Use inside the Workbench** (sign-ins, saved annotations): not read.

## 5. Repeating the reading

```bash
# Zenodo: one record per version; plain stats fields are all versions,
# version_* fields are that version alone. Unauthenticated pages hold 25.
curl -s "https://zenodo.org/api/records/21286974/versions?size=25"
# PyPI and npm
curl -s "https://pypistats.org/api/packages/sstim/overall?mirrors=false"
curl -s "https://api.npmjs.org/downloads/range/last-month/@sstim/core"
curl -s "https://api.npmjs.org/downloads/range/last-month/@sstim/mcp"
# Dependents
curl -s "https://api.deps.dev/v3alpha/systems/npm/packages/%40sstim%2Fcore/versions/0.2.1:dependents"
# CDN fetches, then per ref: /packages/gh/w3c-cg/sstim@<ref>/files
curl -s "https://data.jsdelivr.com/v1/stats/packages/gh/w3c-cg/sstim/versions?period=year"
# Community Group participants
curl -s -H 'Accept: application/json' "https://api.w3.org/groups/cg/sstim/participations"
# Third parties: repeat for "@sstim/core", "@sstim/mcp", "io.github.w3c-cg/sstim", "w3c-cg/sstim"
gh search code '"w3id.org/sstim"' --limit 100 --json repository,path
```

Add a dated section rather than editing this one, so the trend stays readable.
