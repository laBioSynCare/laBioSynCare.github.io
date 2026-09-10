import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, relative } from 'node:path'

import { describe, expect, it } from 'vitest'

import { STIMULATION_ROUTE_PREFIXES, routeRendersStimulation } from './visualSafety.js'

describe('routeRendersStimulation', () => {
  it('covers the Studio and every starter address that opens into it', () => {
    expect(routeRendersStimulation('/creator')).toBe(true)
    expect(routeRendersStimulation('/creator/')).toBe(true)
    expect(routeRendersStimulation('/field/tree/')).toBe(true)
  })

  it('leaves the reading surfaces alone', () => {
    // The entrance is the one that matters: it is what w3id.org/sstim answers
    // with, so it is the project's first impression on anyone arriving cold.
    expect(routeRendersStimulation('/')).toBe(false)
    for (const route of ['/graph/', '/sparql/', '/presets/', '/about/', '/ecosystem/', '/logbook/']) {
      expect(routeRendersStimulation(route)).toBe(false)
    }
  })

  it('rejects anything that is not a root-relative pathname', () => {
    expect(routeRendersStimulation('creator/')).toBe(false)
    expect(routeRendersStimulation('https://example.org/creator/')).toBe(false)
    expect(routeRendersStimulation(undefined)).toBe(false)
  })

  it('does not match a route that merely starts with a covered name', () => {
    expect(routeRendersStimulation('/creators/')).toBe(false)
    expect(routeRendersStimulation('/fieldwork/')).toBe(false)
  })
})

// Every file that reads the visual-stimulation policy, and the route prefix it
// renders under. `null` means the file is not a public stimulation surface, and
// the reason has to say why.
//
// The point of pinning this is that the advisory's scope is a list, and a list
// nobody is forced to revisit stops describing reality (CLAUDE.md §3.4). A new
// consumer fails this test until someone decides whether its route belongs in
// STIMULATION_ROUTE_PREFIXES.
const POLICY_CONSUMERS = {
  'ui/creator/PresetCreator.svelte': '/creator',
  // Legacy Field components: retained as golden/adapter code and reachable only
  // through /creator, because every /field/* route is a redirect into the
  // Studio starter. Covered by the '/field' prefix regardless.
  'ui/field/SensoryField.svelte': null,
  'ui/field/tree/TreeStereo.svelte': null,
  'ui/field/scene/SceneStereo.svelte': null,
  // The deep-link arrival beacon, not stimulation output: it blinks a single
  // halo four times at 2.08 Hz, under the WCAG 2.3.1 three-per-second ceiling
  // asserted in flashSafety.test.js, and holds one steady halo when reduced
  // motion is set or the policy is off.
  'ui/graph/OntologyGraph.svelte': null,
  // The control that sets the policy, not a surface that renders under it.
  'routes/settings/+page.svelte': null,
}

const POLICY_SYMBOLS = /\b(visualStimulationOn|isVisualStimulationOn)\b/

function sourceFiles(dir, root, found = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      sourceFiles(full, root, found)
    } else if (/\.(js|svelte)$/.test(entry) && !/\.test\.(js|mjs)$/.test(entry)) {
      found.push(relative(root, full))
    }
  }
  return found
}

describe('the advisory scope list stays honest', () => {
  const root = fileURLToPath(new URL('../../', import.meta.url))

  it('knows every file that reads the visual-stimulation policy', () => {
    const consumers = sourceFiles(root, root)
      .filter((file) => file !== 'ui/safety/visualSafety.js')
      .filter((file) => POLICY_SYMBOLS.test(readFileSync(join(root, file), 'utf8')))

    expect(consumers.sort()).toEqual(Object.keys(POLICY_CONSUMERS).sort())
  })

  it('routes every stimulation surface into the advisory scope', () => {
    for (const [file, route] of Object.entries(POLICY_CONSUMERS)) {
      if (route === null) continue
      expect(routeRendersStimulation(`${route}/`), `${file} renders at ${route}`).toBe(true)
    }
  })

  it('declares no scope prefix that no consumer needs', () => {
    // '/field' has no policy consumer of its own because its routes redirect,
    // but it stays in the list: a redirect is a client-side navigation, and the
    // address is still a published entry point into the Studio.
    expect(STIMULATION_ROUTE_PREFIXES).toEqual(['/creator', '/field'])
  })
})
