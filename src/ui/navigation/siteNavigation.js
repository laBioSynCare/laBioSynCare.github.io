// Every place a visitor can go, defined once.
//
// The bottom dock, the top bar's + menu and Patch Studio's own + menu used to
// be three hand-kept lists, of eight, sixteen and eight links, and they had
// drifted: the published protocols, the site's most concrete page, were only in
// one of them, and the dock's eight labels truncated on a phone. The dock now
// carries the four destinations a newcomer needs and a Menu that holds the
// rest, grouped, and both read this file. siteNavigation.test.js fails when a
// new route is reachable from neither.

import { applicationRoute } from '../../config/applicationUrls.js'
import { ONTOLOGY_DOCS_URL, VOCAB_DOCS_URL, W3C_GROUP_URL } from '../externalLinks.js'

/**
 * @typedef {object} Destination
 * @property {string} href
 * @property {string} label
 * @property {string} [shortLabel] dock label below 620px
 * @property {string} [hint] one line under the label in the menu
 * @property {boolean} [external] leaves the application (rel="external")
 */

/** @type {Destination[]} */
export const DOCK_ITEMS = [
  { href: applicationRoute('/'), label: 'Home' },
  { href: applicationRoute('/graph/'), label: 'Graph' },
  { href: applicationRoute('/protocols/'), label: 'Protocols' },
  { href: applicationRoute('/creator/'), label: 'Patch Studio', shortLabel: 'Studio' },
]

/** @type {Array<{ title: string, items: Destination[], profile?: boolean }>} */
export const MENU_SECTIONS = [
  {
    title: 'Explore',
    items: [
      { href: applicationRoute('/graph/'), label: 'Graph Navigator', hint: 'Terms, concepts and records, connected' },
      { href: applicationRoute('/protocols/'), label: 'Published protocols', hint: 'Studies from their papers, side by side' },
      { href: applicationRoute('/presets/'), label: 'Presets', hint: 'Reference configurations' },
      { href: applicationRoute('/sparql/'), label: 'SPARQL workbench', hint: 'Query the knowledge in your browser' },
    ],
  },
  {
    title: 'Create',
    items: [
      { href: applicationRoute('/creator/'), label: 'Patch Studio', hint: 'Build and play audiovisual patches' },
      { href: applicationRoute('/logbook/'), label: 'Logbook', hint: 'Your private notes, kept in this browser' },
    ],
  },
  {
    title: 'Learn',
    items: [
      { href: applicationRoute('/manual/'), label: 'Manual & tutorials' },
      { href: ONTOLOGY_DOCS_URL, label: 'Ontology reference', external: true },
      { href: VOCAB_DOCS_URL, label: 'Vocabulary reference', external: true },
      { href: applicationRoute('/namespace/'), label: 'Identifiers: what resolves where' },
      { href: applicationRoute('/about/'), label: 'About' },
    ],
  },
  {
    title: 'Take part',
    items: [
      { href: applicationRoute('/contribute/'), label: 'Report a gap or correction' },
      { href: applicationRoute('/agents/'), label: 'For AI agents' },
      { href: applicationRoute('/ecosystem/'), label: 'Ecosystem' },
      { href: applicationRoute('/ecosystem/directory/'), label: 'Stakeholder directory' },
      { href: W3C_GROUP_URL, label: 'W3C Community Group', external: true },
    ],
  },
  {
    title: 'You',
    items: [
      { href: applicationRoute('/settings/'), label: 'Settings', hint: 'Appearance, audio engine, safety' },
    ],
    // The account control (sign-in where a deployment offers it, else a note
    // that everything stays on this device) renders after these links.
    profile: true,
  },
]

/**
 * Whether `href` is the page at `pathname`, or a page beneath it. Home matches
 * only itself, or every page would light it up.
 * @param {string} href an application route from this file
 * @param {string} pathname the current `page.url.pathname`
 * @returns {boolean}
 */
export function isCurrentDestination(href, pathname) {
  const home = applicationRoute('/')
  if (href === home) return pathname === home || pathname === home.slice(0, -1)
  const route = href.endsWith('/') ? href.slice(0, -1) : href
  return pathname === route || pathname.startsWith(route + '/')
}
