#!/usr/bin/env node
// Resolve a w3id.org request against the committed SSTIM .htaccess, the way
// Apache would.
//
// `check-w3id-route-targets.mjs` proves each redirect *target* exists. It says
// nothing about which target a given request reaches, and that is where the
// interesting mistakes live: an `Accept` regex that misreads `q=0`, a rule
// ordered after one that shadows it, or a module quietly inheriting the wrong
// documentation page. Those are invisible in a diff and cannot be checked
// against the live registry until after a perma-id merge.
//
// This is a model of mod_rewrite, not mod_rewrite. It covers the subset the
// SSTIM rules use: ordered rules, RewriteCond chains with [OR] and [NC], the
// [L] flag implied by every rule here, `$1` backreferences, and `-` targets
// carrying an [R=NNN] status.

import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..')
const htaccessPath = join(repoRoot, 'docs', 'ecosystem', 'w3id', 'sstim', '.htaccess')

export function parseRules(htaccess) {
  const rules = []
  let conds = []
  for (const line of htaccess.split(/\r?\n/)) {
    const text = line.trim()
    if (text.startsWith('RewriteCond')) {
      const [, variable, ...rest] = text.split(/\s+/)
      let pattern = rest.join(' ')
      let flags = ''
      const flagMatch = pattern.match(/\s\[([A-Z,]+)\]$/)
      if (flagMatch) {
        flags = flagMatch[1]
        pattern = pattern.slice(0, flagMatch.index).trim()
      }
      conds.push({ variable, pattern, flags })
    } else if (text.startsWith('RewriteRule')) {
      const [, pattern, target, flags = ''] = text.split(/\s+/)
      rules.push({ conds, pattern, target, flags })
      conds = []
    }
  }
  return rules
}

// Apache ANDs conditions, except that [OR] joins a condition to the next one.
function conditionsPass(conds, accept) {
  if (conds.length === 0) return true
  let result = null
  let pendingOr = false
  for (const { variable, pattern, flags } of conds) {
    const value = variable === '%{HTTP_ACCEPT}' ? accept : ''
    const matched = new RegExp(pattern, flags.includes('NC') ? 'i' : '').test(value)
    if (pendingOr) result = result || matched
    else if (result === null) result = matched
    else result = result && matched
    pendingOr = flags.includes('OR')
  }
  return Boolean(result)
}

/** Resolve `path` (no leading slash, relative to /sstim/) under `accept`. */
export function resolveRoute(path, accept, rules) {
  for (const { conds, pattern, target, flags } of rules) {
    const match = new RegExp(pattern).exec(path)
    if (!match || !conditionsPass(conds, accept)) continue
    const status = flags.match(/R=(\d+)/)?.[1]
    if (target === '-') return { status: Number(status ?? 200), location: null }
    return {
      status: Number(status ?? 200),
      location: target.replace(/\$1/g, match[1] ?? ''),
    }
  }
  return { status: 404, location: null }
}

export function loadRules(path = htaccessPath) {
  return parseRules(readFileSync(path, 'utf8'))
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const [path = '', accept = 'text/turtle'] = process.argv.slice(2)
  const { status, location } = resolveRoute(path.replace(/^\//, ''), accept, loadRules())
  console.log(`/sstim/${path.replace(/^\//, '')}  Accept: ${accept}\n  -> ${status} ${location ?? ''}`)
}
