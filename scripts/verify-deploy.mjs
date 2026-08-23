#!/usr/bin/env node
// Assert that a deployed instance is serving the commit it is supposed to be
// serving, by fetching `build-info.json` from it.
//
// Usage:
//   node scripts/verify-deploy.mjs <base-url> [expected-commit]
//
// With no expected commit, the local git HEAD is used. Exits non-zero on any
// mismatch, so it works as a CI gate immediately after deployment.

import { execFileSync } from 'node:child_process';

const [, , baseUrlArg, expectedArg] = process.argv;

if (!baseUrlArg) {
  console.error('usage: verify-deploy.mjs <base-url> [expected-commit]');
  process.exit(2);
}

const baseUrl = baseUrlArg.replace(/\/+$/, '');
const target = `${baseUrl}/build-info.json`;

function localHead() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

const expected = expectedArg ?? process.env.GITHUB_SHA ?? localHead();
if (!expected) {
  console.error('verify-deploy: no expected commit given and git HEAD unavailable');
  process.exit(2);
}

const fail = (msg) => {
  console.error(`verify-deploy: FAIL — ${msg}`);
  process.exit(1);
};

// A freshly deployed CDN can lag by a few seconds; retry briefly rather than
// flaking, but keep the ceiling low so a genuinely broken deploy fails fast.
const ATTEMPTS = 6;
const DELAY_MS = 10_000;

let info = null;
for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
  try {
    // Defeat any intermediate cache: a stale hit is the exact failure mode this
    // script exists to detect, so it must never be the thing that makes it pass.
    const response = await fetch(`${target}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'cache-control': 'no-cache' },
    });
    if (response.ok) {
      info = await response.json();
      break;
    }
    console.error(`  attempt ${attempt}/${ATTEMPTS}: HTTP ${response.status}`);
  } catch (error) {
    console.error(`  attempt ${attempt}/${ATTEMPTS}: ${error.message}`);
  }
  if (attempt < ATTEMPTS) await new Promise((r) => setTimeout(r, DELAY_MS));
}

if (!info) fail(`could not fetch ${target} after ${ATTEMPTS} attempts`);
if (info.model !== 'bsc-lab-build-info-1') fail(`unexpected model "${info.model}"`);

// Nix supplies a short revision; GitHub supplies the full 40-character SHA.
// Compare on the shorter of the two so both forms verify.
const width = Math.min(info.commit.length, expected.length);
if (width < 7) fail(`commit "${info.commit}" is too short to verify`);

if (info.commit.slice(0, width) !== expected.slice(0, width)) {
  fail(
    `deployed commit ${info.commit} does not match expected ${expected}\n` +
      `  The live site is not serving the commit CI just built. Check the Pages\n` +
      `  source setting (Actions vs branch), then the service-worker cache.`,
  );
}

console.log(`verify-deploy: OK — ${baseUrl} serves ${info.commit} (${info.commitSource})`);
console.log(`  app ${info.appVersion}, SSTIM ${info.ontologyVersion}, built ${info.builtAt}`);
