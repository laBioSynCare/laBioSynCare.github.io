import { readdirSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { applicationRoute, logicalApplicationPath } from '../../config/applicationUrls.js'
import { DOCK_ITEMS, MENU_SECTIONS, isCurrentDestination } from './siteNavigation.js'

const ROUTES = join(process.cwd(), 'src/routes')

// Pages deliberately reachable from neither the dock nor the Menu, each with
// the reason. Anything else a route directory adds must be placed in
// siteNavigation.js, or this test fails.
const NOT_IN_MENU = {
  // Old Sensory Field bookmarks, redirected into Patch Studio (ADR 0046).
  '/field/': 'redirect',
  '/field/abstract/': 'redirect',
  '/field/landscape/': 'redirect',
  '/field/tree/': 'redirect',
  // The two-site move instruction, linked from Settings and About.
  '/transition/': 'linked from Settings and About',
  // Reached through the account control the Menu renders.
  '/profile/': 'account control',
}

function pageRoutes(dir = ROUTES) {
  const routes = []
  if (existsSync(join(dir, '+page.svelte'))) {
    const path = relative(ROUTES, dir).split('\\').join('/')
    routes.push(path ? `/${path}/` : '/')
  }
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) routes.push(...pageRoutes(join(dir, entry.name)))
  }
  return routes
}

const menuItems = MENU_SECTIONS.flatMap((section) => section.items)
// Routes are compared unmounted, so this passes under SSTIM_BASE_PATH=/sstim as
// it does at the root.
const route = (item) => logicalApplicationPath(item.href)
const reachable = new Set([...DOCK_ITEMS, ...menuItems].map(route))

describe('site navigation', () => {
  it('reaches every page from the dock or the Menu', () => {
    // A parameterised page (a manual chapter) is reached from its parent,
    // which must itself be reachable.
    const parentOf = (route) => route.slice(0, route.indexOf('['))
    const unplaced = pageRoutes()
      .map((route) => (route.includes('[') ? parentOf(route) : route))
      .filter((route) => !reachable.has(route) && !(route in NOT_IN_MENU))
    expect(unplaced, 'add these to siteNavigation.js, or to NOT_IN_MENU with a reason').toEqual([])
  })

  it('lists no page that does not exist', () => {
    const routes = new Set(pageRoutes())
    // The generated reference docs are files under static/, not routes.
    const internal = [...DOCK_ITEMS, ...menuItems].filter((item) => !item.external).map(route)
    expect(internal.filter((href) => !routes.has(href))).toEqual([])
  })

  it('keeps the exemption list honest', () => {
    const routes = new Set(pageRoutes())
    expect(Object.keys(NOT_IN_MENU).filter((route) => !routes.has(route))).toEqual([])
  })

  it('puts every dock destination but Home in the Menu as well', () => {
    const inMenu = new Set(menuItems.map(route))
    const missing = DOCK_ITEMS.filter((item) => route(item) !== '/' && !inMenu.has(route(item)))
    expect(missing.map((item) => item.label)).toEqual([])
  })

  // Four links and the Menu button share a 360px phone: 72px each. Eight
  // destinations once truncated SPARQL, Logbook and Settings at 360 to 414px.
  it('fits the dock on a 360px phone', () => {
    expect(DOCK_ITEMS.length + 1).toBeLessThanOrEqual(5)
    for (const item of DOCK_ITEMS) {
      expect((item.shortLabel ?? item.label).length, item.label).toBeLessThanOrEqual(9)
    }
  })

  it('names each group once and leaves none empty', () => {
    const titles = MENU_SECTIONS.map((section) => section.title)
    expect(new Set(titles).size).toBe(titles.length)
    for (const section of MENU_SECTIONS) expect(section.items.length, section.title).toBeGreaterThan(0)
  })

  it('marks the current page, and Home only on Home', () => {
    const at = (href, path) => isCurrentDestination(applicationRoute(href), applicationRoute(path))
    expect(at('/', '/')).toBe(true)
    expect(at('/', '/graph/')).toBe(false)
    expect(at('/graph/', '/graph/')).toBe(true)
    expect(at('/ecosystem/', '/ecosystem/directory/')).toBe(true)
    expect(at('/protocols/', '/presets/')).toBe(false)
  })
})
