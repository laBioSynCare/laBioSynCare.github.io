#!/usr/bin/env node
// Publish `build-info.json` alongside the built site so that a deployed instance
// can state which commit it was built from.
//
// This exists because of a real incident: on 2026-07-31 GitHub Pages was set to
// "deploy from a branch" while CI uploaded an Actions artifact, so the live site
// 404'd for hours while every workflow run reported success. Two separate reviews
// then argued about whether the site was serving stale content, with no way to
// check. A deployed artifact that names its own commit ends that class of
// argument: `make verify-deploy` fetches this file and compares.
//
// Determinism: the Nix package must stay bit-reproducible (`nix build --rebuild`),
// so nothing here may read the wall clock unless the caller supplies a fixed
// value. `SOURCE_DATE_EPOCH` — which Nix sets — is the timestamp source when
// present; otherwise the current time is used, which is correct for CI and local
// builds and never reached inside a reproducibility check.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT_DIR = process.env.BSC_BUILD_INFO_DIR ?? 'dist';
const MODEL = 'bsc-lab-build-info-1';

/** Read the commit from CI, then Nix, then git, and never fail the build. */
function resolveCommit() {
  // GitHub Actions exports the exact commit being built; prefer it, because in a
  // pull_request build the local HEAD is a synthetic merge commit instead.
  const fromCi = process.env.GITHUB_SHA;
  if (fromCi) return { commit: fromCi, commitSource: 'ci' };

  // `flake.nix` passes the flake's own revision, which is authoritative inside
  // the sandbox where no .git directory is available.
  const fromNix = process.env.BSC_BUILD_VERSION;
  if (fromNix && fromNix !== 'unknown') return { commit: fromNix, commitSource: 'nix' };

  try {
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const dirty =
      execFileSync('git', ['status', '--porcelain'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim().length > 0;
    return { commit, commitSource: dirty ? 'git-dirty' : 'git' };
  } catch {
    return { commit: 'unknown', commitSource: 'unavailable' };
  }
}

/** The SSTIM release this build publishes, read from the ontology itself. */
function resolveOntologyVersion() {
  try {
    const ttl = readFileSync('static/ontology/sstim-core.ttl', 'utf8');
    return ttl.match(/owl:versionInfo\s+"([^"]+)"/)?.[1] ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Bit-reproducibility is a property of the Nix *package*, not of every build, so
 * the frozen timestamp applies only there. CI runs its commands inside
 * `nix develop`, which also exports SOURCE_DATE_EPOCH — honouring it everywhere
 * made the deployed site report that it was built in 1980.
 */
function resolveBuiltAt(commitSource) {
  if (commitSource === 'nix') {
    const seconds = Number.parseInt(process.env.SOURCE_DATE_EPOCH ?? '', 10);
    if (Number.isFinite(seconds)) return new Date(seconds * 1000).toISOString();
  }
  return new Date().toISOString();
}

const { commit, commitSource } = resolveCommit();
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

const info = {
  model: MODEL,
  commit,
  commitSource,
  appVersion: pkg.version ?? 'unknown',
  ontologyVersion: resolveOntologyVersion(),
  builtAt: resolveBuiltAt(commitSource),
};

const target = resolve(OUT_DIR, 'build-info.json');
writeFileSync(target, `${JSON.stringify(info, null, 2)}\n`);
console.log(`build-info: ${info.commit} (${info.commitSource}) → ${target}`);
