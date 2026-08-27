// Drive a headless Chrome over the DevTools Protocol.
//
// Extracted from dom-after-hydration.mjs so that more than one check can use it.
// Playwright is deliberately not a dependency of this repository, and Node's
// built-in WebSocket is the only thing required.
//
// Why a real browser at all: a unit test cannot see a template condition, and a
// build-time check cannot see a layout. Both classes of defect have shipped
// here. See docs/technical/PATCH_STUDIO.md §11.5.

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

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function findChrome() {
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

/**
 * Run `body` against a fresh headless Chrome, then tear it down.
 *
 * The session exposes navigate/evaluate/waitFor rather than a DOM dump, because
 * the questions worth asking a browser are measurements (is this element inside
 * its container?) and interactions (does clicking this open that?), neither of
 * which survives serialisation to HTML.
 */
export async function withChromeSession(body, { timeoutMs = 90_000, windowSize = '1440,1200' } = {}) {
  const port = 9222 + Math.floor(Math.random() * 500)
  const profile = mkdtempSync(join(tmpdir(), 'sstim-cdp-'))
  const chromePath = await findChrome()
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    // Containers give /dev/shm 64MB by default, which headless Chrome
    // exhausts and then crashes mid-run. Standard CI flag.
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-timer-throttling',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--window-size=${windowSize}`,
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    'about:blank',
  ], { stdio: 'ignore' })

  const cleanup = () => {
    try { chrome.kill('SIGKILL') } catch { /* already gone */ }
    try { rmSync(profile, { recursive: true, force: true }) } catch { /* best effort */ }
  }
  process.on('exit', cleanup)

  let browser
  try {
    const deadline = Date.now() + timeoutMs
    browser = connect(await waitForDevTools(port, deadline))
    await browser.ready
    const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' })
    const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true })
    await browser.send('Page.enable', {}, sessionId)
    await browser.send('Runtime.enable', {}, sessionId)

    const evaluate = async (expression) => {
      const { result, exceptionDetails } = await browser.send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      }, sessionId)
      if (exceptionDetails) {
        throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text)
      }
      return result.value
    }

    const session = {
      evaluate,
      navigate: (url) => browser.send('Page.navigate', { url }, sessionId),
      /**
       * Poll `expression` until it is truthy. A fixed sleep is either flaky or
       * slow and usually both, and against a hydrating SvelteKit application it
       * is how a prerendered DOM gets mistaken for a live one.
       */
      /**
       * Click `selector` until `condition` holds.
       *
       * A single click races hydration: the element can be in the DOM a frame
       * before Svelte attaches its handler, so the click lands on nothing and
       * the wait that follows times out. Retrying is the difference between a
       * gate and a coin toss.
       */
      async clickUntil(selector, condition, { timeout = 45_000, label = selector } = {}) {
        const until = Date.now() + timeout
        while (Date.now() < until) {
          try {
            if (await evaluate(condition)) return true
            await evaluate(`document.querySelector(${JSON.stringify(selector)})?.click()`)
          } catch { /* mid-navigation */ }
          await sleep(250)
        }
        throw new Error(`timed out after ${timeout}ms clicking ${label}`)
      },

      async waitFor(expression, { timeout = 45_000, label = expression } = {}) {
        const until = Date.now() + timeout
        let last
        while (Date.now() < until) {
          try {
            last = await evaluate(expression)
            if (last) return last
          } catch { /* the page may still be navigating */ }
          await sleep(150)
        }
        throw new Error(`timed out after ${timeout}ms waiting for ${label}`)
      },
    }

    return await body(session)
  } finally {
    try { browser?.close() } catch { /* already closed */ }
    cleanup()
  }
}
