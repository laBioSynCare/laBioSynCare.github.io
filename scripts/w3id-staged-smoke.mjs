#!/usr/bin/env node
// Fetch the locations produced by the in-memory staged W3ID overlay.
//
// This never calls w3id.org and never edits its rules. The simulator selects
// the same redirect the committed production .htaccess would select, swaps only
// the deployment location, then verifies that the staged Pages publication can
// actually serve that target.

import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { resolveRoute } from './w3id-negotiation.mjs'
import {
  LIVE_ECOSYSTEM_TARGET,
  STAGED_APPLICATION_BASE,
  STAGED_REQUEST_MATRIX,
  validateStagedRules,
} from './w3id-staged-routes.mjs'

function expectedContentType(pathname) {
  if (pathname.endsWith('.ttl')) return 'text/turtle'
  if (pathname.endsWith('.jsonld')) return 'application/ld+json'
  if (pathname.endsWith('.rdf') || pathname.endsWith('.owl')) return 'application/rdf+xml'
  if (pathname.endsWith('.json')) return 'application/json'
  return 'text/html'
}

function bodyMatches(contentType, body) {
  if (contentType === 'text/turtle') return /(?:@prefix|<https:\/\/w3id\.org\/sstim)/.test(body)
  if (contentType === 'application/rdf+xml') return /<(?:rdf:)?RDF\b/i.test(body)
  if (contentType === 'text/html') return /<!doctype html|<html\b/i.test(body)
  if (contentType === 'application/json' || contentType === 'application/ld+json') {
    try {
      JSON.parse(body)
      return true
    } catch {
      return false
    }
  }
  return body.length > 0
}

function insideApplication(url, application) {
  return url.origin === application.origin && url.pathname.startsWith(application.pathname)
}

export async function smokeStagedTargets(
  candidateBase = STAGED_APPLICATION_BASE,
  { fetchImpl = fetch, requests = STAGED_REQUEST_MATRIX } = {},
) {
  const { stagedRules, candidate } = validateStagedRules({ candidateBase, requests })
  const application = new URL(candidate.application)
  const targets = new Map()
  let externalSkipped = 0

  for (const request of requests) {
    const resolution = resolveRoute(request.path, request.accept, stagedRules)
    if (!resolution.location) continue
    if (resolution.location === LIVE_ECOSYSTEM_TARGET) {
      externalSkipped += 1
      continue
    }

    const target = new URL(resolution.location)
    if (!insideApplication(target, application)) {
      throw new Error(`${request.label}: staged target escaped ${candidate.application}: ${target.href}`)
    }
    const fragment = target.hash
    target.hash = '' // URL fragments are client-side and are never sent over HTTP.
    const key = target.href
    const expectedStatus = request.targetStatus ?? 200
    const prior = targets.get(key)
    if (prior && prior.expectedStatus !== expectedStatus) {
      throw new Error(`${target.href} has conflicting expected statuses in the request matrix`)
    }
    if (prior) {
      prior.labels.push(request.label)
      if (fragment) prior.fragments.add(fragment)
    } else {
      targets.set(key, {
        url: target,
        labels: [request.label],
        fragments: new Set(fragment ? [fragment] : []),
        expectedStatus,
      })
    }
  }

  const failures = []
  let checked = 0
  for (const target of targets.values()) {
    const requestUrl = new URL(target.url)
    requestUrl.searchParams.set('w3id-stage-check', Date.now().toString())
    try {
      const response = await fetchImpl(requestUrl, {
        cache: 'no-store',
        headers: { 'cache-control': 'no-cache' },
        redirect: 'follow',
      })
      checked += 1
      if (response.status !== target.expectedStatus) {
        failures.push(
          `${target.url.href}: HTTP ${response.status}, expected ${target.expectedStatus} ` +
          `(${target.labels.join(', ')})`,
        )
        continue
      }
      if (target.expectedStatus !== 200) continue

      const finalUrl = new URL(response.url)
      if (!insideApplication(finalUrl, application)) {
        failures.push(`${target.url.href}: final response escaped the project mount to ${finalUrl.href}`)
        continue
      }
      const expectedType = expectedContentType(target.url.pathname)
      const actualType = response.headers.get('content-type') ?? ''
      if (!actualType.toLowerCase().startsWith(expectedType)) {
        failures.push(`${target.url.href}: content-type ${actualType || '(missing)'}, expected ${expectedType}`)
        continue
      }
      const body = await response.text()
      if (!bodyMatches(expectedType, body)) {
        failures.push(`${target.url.href}: response body does not match ${expectedType}`)
      }
    } catch (error) {
      failures.push(`${target.url.href}: ${error.message}`)
    }
  }

  return {
    candidate: candidate.application,
    checked,
    externalSkipped,
    fragments: [...targets.values()].reduce((sum, target) => sum + target.fragments.size, 0),
    failures,
  }
}

async function main() {
  const args = process.argv.slice(2)
  if (args.length > 1 || args[0]?.startsWith('--')) {
    throw new Error('usage: node scripts/w3id-staged-smoke.mjs [candidate-application-base]')
  }
  const result = await smokeStagedTargets(args[0] ?? STAGED_APPLICATION_BASE)
  if (result.failures.length) {
    console.error(`w3id-staged-smoke: FAIL (${result.failures.length})`)
    for (const failure of result.failures) console.error(`  - ${failure}`)
    process.exit(1)
  }
  console.log(
    `w3id-staged-smoke: PASS (${result.checked} distinct candidate targets at ` +
    `${result.candidate}; ${result.fragments} Graph fragments preserved; ` +
    `${result.externalSkipped} live projection requests intentionally skipped)`,
  )
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    console.error(`w3id-staged-smoke: FAIL — ${error.message}`)
    process.exit(1)
  })
}

