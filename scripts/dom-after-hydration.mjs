#!/usr/bin/env node
// Dump a page's DOM *after* the client-side application has settled.
//
// `chrome --dump-dom` serialises at the load event, which for a hydrating
// SvelteKit app is too early: it returns the prerendered HTML and hides every
// bug in the client wiring. That is not hypothetical here — an annotation panel
// once shipped broken because the store was tested and the template was not.
//
// Playwright is deliberately not a dependency of this repo, so this drives
// Chrome over the DevTools Protocol directly. Node's built-in WebSocket is the
// only thing required.
//
// Usage:
//   node scripts/dom-after-hydration.mjs <url> [--wait-for <substring>] [--timeout <ms>]

import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean)

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function findChrome() {
  const { access } = await import('node:fs/promises')
  for (const candidate of CHROME_CANDIDATES) {
    try {
      await access(candidate)
      return candidate
    } catch { /* try the next one */ }
  }
  throw new Error(`no Chrome found; set CHROME_PATH. Tried:\n  ${CHROME_CANDIDATES.join('\n  ')}`)
}

/** Poll the DevTools HTTP endpoint until the browser is listening. */
async function waitForDevTools(port, deadline) {
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`)
      if (response.ok) return (await response.json()).webSocketDebuggerUrl
    } catch { /* not up yet */ }
    await sleep(100)
  }
  throw new Error('Chrome did not open its DevTools port in time')
}

/** Minimal CDP client: send a command, resolve its matching reply. */
function connect(wsUrl) {
  const socket = new WebSocket(wsUrl)
  const pending = new Map()
  let nextId = 1

  const ready = new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', () => reject(new Error('CDP socket error')), { once: true })
  })

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    const entry = pending.get(message.id)
    if (!entry) return
    pending.delete(message.id)
    if (message.error) entry.reject(new Error(message.error.message))
    else entry.resolve(message.result)
  })

  const send = (method, params = {}, sessionId = undefined) =>
    new Promise((resolve, reject) => {
      const id = nextId++
      pending.set(id, { resolve, reject })
      socket.send(JSON.stringify({ id, method, params, sessionId }))
    })

  return { ready, send, close: () => socket.close() }
}

const port = 9222 + Math.floor(Math.random() * 500)
const profile = mkdtempSync(join(tmpdir(), 'bsc-cdp-'))
const chromePath = await findChrome()

const chrome = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-background-timer-throttling',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  'about:blank',
], { stdio: 'ignore' })

const cleanup = () => {
  try { chrome.kill('SIGKILL') } catch { /* already gone */ }
  try { rmSync(profile, { recursive: true, force: true }) } catch { /* best effort */ }
}
process.on('exit', cleanup)

try {
  const deadline = Date.now() + timeoutMs
  const browserWs = await waitForDevTools(port, deadline)
  const browser = connect(browserWs)
  await browser.ready

  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true })

  await browser.send('Page.enable', {}, sessionId)
  await browser.send('Runtime.enable', {}, sessionId)
  await browser.send('Page.navigate', { url }, sessionId)

  const html = async () => {
    const { result } = await browser.send('Runtime.evaluate', {
      expression: 'document.documentElement.outerHTML',
      returnByValue: true,
    }, sessionId)
    return result.value ?? ''
  }

  // Poll until the expected content appears, rather than sleeping a guessed
  // interval — a fixed delay is either flaky or slow, and usually both.
  let dom = ''
  while (Date.now() < deadline) {
    dom = await html()
    if (!waitFor || dom.includes(waitFor)) break
    await sleep(150)
  }

  if (waitFor && !dom.includes(waitFor)) {
    process.stdout.write(dom)
    console.error(`\n[dom-after-hydration] "${waitFor}" never appeared within ${timeoutMs}ms`)
    browser.close()
    process.exit(1)
  }

  process.stdout.write(dom)
  browser.close()
} finally {
  cleanup()
}
