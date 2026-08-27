#!/usr/bin/env node
// Drive the built Patch Studio in a real browser, at a real deployment mount.
//
// Why this exists. Four defects shipped that no unit test could see, because
// none of them is a wrong value: a knob caption clipped by CSS into "inhaler",
// a primary action scrolled off screen with its scrollbar hidden, five visual
// track types reporting an audio class in a panel nobody had opened, and a
// graph deep link that resolved at the origin root and escaped the deployment
// entirely under a project-page mount. The last one is the reason this runs
// against a built dist at a mount rather than the dev server: it is invisible
// when the base path is empty, which is every local build.
//
// See docs/technical/PATCH_STUDIO.md §10 and §11.5.
//
// The studio checks are fast (about fifteen seconds) and run on every push.
// The graph round trip is behind --with-graph: in a production build the graph
// route blocks for roughly three and a half minutes before a hash selection
// resolves, which is too slow for a per-push gate and is itself recorded as a
// performance question in PATCH_STUDIO.md §11.5.
//
// Usage:
//   node scripts/studio-browser-check.mjs [dist] [mount] [--with-graph]

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { normalizeDeploymentBase } from '../deployment.config.js'
import { serveDist } from './static-host.mjs'
import { withChromeSession } from './chrome-session.mjs'

const DIST = resolve(process.argv[2] ?? 'dist')
const MOUNT = normalizeDeploymentBase(
  process.argv[3]?.startsWith('--') ? '' : process.argv[3] ?? '',
)
const WITH_GRAPH = process.argv.includes('--with-graph')

let failures = 0
const ok = (msg, detail = '') => console.log(`  ok   ${msg}${detail ? ` (${detail})` : ''}`)
const bad = (msg, detail = '') => { failures++; console.log(`  FAIL ${msg}${detail ? ` (${detail})` : ''}`) }
const check = (condition, msg, detail = '') => (condition ? ok(msg, detail) : bad(msg, detail))

// The advisory gate blocks the studio on a fresh profile, so acknowledge it the
// way a returning visitor already has. Key from src/ui/safety/visualSafety.js.
const PHOTO_ACK = 'bsclab.photoAdvisoryAck'

async function main() {
  if (!existsSync(DIST)) {
    console.error(`studio-browser-check: ${DIST} does not exist — run a build first.`)
    process.exit(1)
  }

  const port = 4380 + Math.floor(Math.random() * 200)
  const server = await serveDist(DIST, MOUNT, port)
  const origin = `http://127.0.0.1:${port}`
  const base = `${origin}${MOUNT}`
  console.log(`studio-browser-check: serving ${DIST} at ${base}\n`)

  try {
    await withChromeSession(async (session) => {
      // Same origin, so the acknowledgement set here survives the navigation.
      await session.navigate(`${base}/`)
      await session.waitFor('!!document.body', { label: 'the shell' })
      await session.evaluate(`localStorage.setItem(${JSON.stringify(PHOTO_ACK)}, '1')`)

      await session.navigate(`${base}/creator/`)
      // A marker the prerendered HTML does not carry, so this waits for
      // hydration rather than for the server's copy of the page.
      await session.waitFor(
        "document.querySelectorAll('.knob-label').length > 0",
        { label: 'the studio to hydrate' },
      )
      ok('the studio hydrates', 'knobs rendered')

      // 1. Captions must fit their column. This is the "inhaler" defect, and it
      //    is invisible to every check that reads text rather than geometry.
      const clipped = await session.evaluate(`
        [...document.querySelectorAll('.knob-label')]
          .filter(el => el.scrollWidth > el.clientWidth + 1)
          .map(el => el.textContent.trim())
      `)
      check(clipped.length === 0, 'no knob caption is clipped by its column',
        clipped.length ? clipped.join(', ') : `${await session.evaluate("document.querySelectorAll('.knob-label').length")} captions`)

      // 2. Every add button must be inside its scroll container. This is the
      //    hidden Mix button: present in the DOM, reachable by nothing.
      const hidden = await session.evaluate(`
        [...document.querySelectorAll('.col-adds')].flatMap(row => {
          const bounds = row.getBoundingClientRect()
          return [...row.querySelectorAll('button')]
            .filter(b => {
              const r = b.getBoundingClientRect()
              return r.right > bounds.right + 1 || r.left < bounds.left - 1
            })
            .map(b => b.textContent.trim())
        })
      `)
      check(hidden.length === 0, 'every add button sits inside its row',
        hidden.length ? hidden.join(', ') : 'none overflow')

      // 3. The page itself must not scroll sideways.
      const overflow = await session.evaluate(
        'document.documentElement.scrollWidth - document.documentElement.clientWidth')
      check(overflow <= 1, 'the studio does not scroll horizontally', `${overflow}px`)

      // 4. The semantic panel is the only way into the knowledge graph, so open
      //    it the way a reader does and read the link back out.
      await session.waitFor("!!document.querySelector('.knob-label-button')",
        { label: 'an interactive caption' })
      await session.clickUntil(
        '.knob-label-button',
        "!!document.querySelector('.semantic-graph-link')",
        { label: 'a knob caption to open the semantic panel' },
      )
      const href = await session.evaluate(
        "document.querySelector('.semantic-graph-link').getAttribute('href')")
      ok('a knob caption opens the semantic panel', href)

      // 5. ...and that link must stay inside the deployment. A root-absolute
      //    '/graph/#term' leaves a project-page mount for somebody else's site.
      check(href.startsWith(`${MOUNT}/graph/#`), 'the graph deep link stays inside the mount',
        `expected ${MOUNT}/graph/#…`)

      // 8. The service worker must never reload the page on its own. ADR 0009
      //    Trap 1 forbids it because it kills an in-progress stimulation
      //    session; it also silently discarded unsaved studio work and the
      //    ?add= track the graph had just requested. clients.claim() fires
      //    controllerchange on first install, so this only reproduces on a
      //    fresh profile against a production build, which is exactly here.
      await session.evaluate('window.__sstimMarker = Date.now()')
      const claimed = await session.waitFor(
        '!!navigator.serviceWorker && !!navigator.serviceWorker.controller',
        { label: 'the service worker to take control', timeout: 60_000 },
      ).catch(() => false)
      const survived = await session.evaluate('!!window.__sstimMarker')
      check(survived, 'the service worker does not reload the page on its own',
        !claimed ? 'worker never took control, so this proved nothing'
          : survived ? 'worker took control and the page kept its state'
            : 'worker took control and the page was reloaded under it')

      if (!WITH_GRAPH) {
        console.log('  skip the graph round trip (pass --with-graph; it needs several minutes)')
        return
      }

      // 6. The return leg: the graph must offer a way back into the studio.
      //    Attribute selectors are avoided here because the quoting has to
      //    survive two levels of escaping to reach the page.
      const backLink = "[...document.querySelectorAll('.detail a')]" +
        ".find(a => (a.getAttribute('href') || '').includes('/creator/'))"
      await session.navigate(`${base}/graph/#BinauralVoice`)
      await session.waitFor(`!!${backLink}`,
        { label: 'the graph detail panel', timeout: 300_000 })
      const back = await session.evaluate(`${backLink}.getAttribute('href')`)
      check(back.startsWith(`${MOUNT}/creator/`), 'the graph links back into the studio', back)

      // 7. And that link must actually add the track it names. The href is
      //    already mount-prefixed, so it is joined to the origin, not to base.
      await session.navigate(`${origin}${back}`)
      await session.waitFor("document.body.textContent.includes('\u00b7 beat ')",
        { label: 'the requested track', timeout: 120_000 })
      ok('following it adds the track', back.split('add=')[1] ?? '')
    }, { timeoutMs: WITH_GRAPH ? 600_000 : 120_000 })
  } finally {
    server.close()
  }

  console.log(failures === 0
    ? '\nstudio-browser-check: PASS'
    : `\nstudio-browser-check: FAIL (${failures})`)
  process.exit(failures === 0 ? 0 : 1)
}

await main()
