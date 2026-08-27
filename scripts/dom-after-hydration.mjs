#!/usr/bin/env node
// Dump a page's DOM *after* the client-side application has settled.
//
// `chrome --dump-dom` serialises at the load event, which for a hydrating
// SvelteKit app is too early: it returns the prerendered HTML and hides every
// bug in the client wiring. That is not hypothetical here — an annotation panel
// once shipped broken because the store was tested and the template was not.
//
// The Chrome/CDP machinery lives in chrome-session.mjs, shared with
// studio-browser-check.mjs. This file is the thin CLI over it.
//
// Usage:
//   node scripts/dom-after-hydration.mjs <url> [--wait-for <substring>] [--timeout <ms>]

import { withChromeSession, sleep } from './chrome-session.mjs'

const args = process.argv.slice(2)
const url = args[0]
if (!url) {
  console.error('usage: dom-after-hydration.mjs <url> [--wait-for <substring>] [--timeout <ms>]')
  process.exit(2)
}
const readFlag = (name, fallback) => {
  const i = args.indexOf(name)
  return i === -1 ? fallback : args[i + 1]
}
const waitFor = readFlag('--wait-for', null)
const timeoutMs = Number(readFlag('--timeout', '20000'))

const exitCode = await withChromeSession(async (session) => {
  await session.navigate(url)

  const deadline = Date.now() + timeoutMs
  let dom = ''
  while (Date.now() < deadline) {
    dom = await session.evaluate('document.documentElement.outerHTML') ?? ''
    if (!waitFor || dom.includes(waitFor)) break
    await sleep(150)
  }

  process.stdout.write(dom)
  if (waitFor && !dom.includes(waitFor)) {
    console.error(`\n[dom-after-hydration] "${waitFor}" never appeared within ${timeoutMs}ms`)
    return 1
  }
  return 0
}, { timeoutMs: timeoutMs + 30_000 })

process.exit(exitCode)
