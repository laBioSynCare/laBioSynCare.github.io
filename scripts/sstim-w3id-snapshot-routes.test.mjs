import { expect, test } from 'vitest'
import { readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  END,
  START,
  generatedRegion,
  snapshotInventory,
} from './sstim-w3id-snapshot-routes.mjs'

const ontologyDir = resolve(dirname(fileURLToPath(import.meta.url)), '../static/ontology')

function compareSemver(a, b) {
  const left = a.split('.').map(Number)
  const right = b.split('.').map(Number)
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index]
  }
  return 0
}

function regexLiteral(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

test('the generated region is the exact current frozen snapshot inventory', () => {
  const inventory = snapshotInventory()
  const region = generatedRegion(inventory)
  const expectedInventory = readdirSync(ontologyDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d+\.\d+\.\d+$/.test(entry.name))
    .map((entry) => {
      const files = readdirSync(join(ontologyDir, entry.name), { withFileTypes: true })
        .filter((file) => file.isFile())
        .map((file) => file.name)
        .sort()
      return {
        version: entry.name,
        turtle: files.filter((file) => file.endsWith('.ttl')),
        manifest: files.includes('manifest.json'),
        schema: files.includes('manifest.schema.json'),
      }
    })
    .sort((a, b) => compareSemver(a.version, b.version))

  expect(inventory).toEqual(expectedInventory)
  expect(region.startsWith(START)).toBe(true)
  expect(region.endsWith(END)).toBe(true)
  expect(region).not.toContain('[0-9]+')
  expect(region).not.toContain('[A-Za-z0-9._-]+')
  for (const snapshot of expectedInventory) {
    const versionPattern = regexLiteral(snapshot.version)
    const filesPattern = snapshot.turtle.map(regexLiteral).join('|')
    expect(region).toContain(
      `RewriteRule ^${versionPattern}/(${filesPattern})$ ` +
      `https://labiosyncare.github.io/ontology/${snapshot.version}/$1 [R=302,L]`,
    )
    expect(region.includes(`^${versionPattern}/manifest$`)).toBe(snapshot.manifest)
    expect(region.includes(`^${versionPattern}/manifest\\.schema\\.json$`)).toBe(snapshot.schema)
  }
})

test('future modular snapshots gain exact manifest and schema routes only when present', () => {
  const region = generatedRegion([
    {
      version: '1.0.0',
      turtle: ['sstim-core-profile.ttl', 'sstim-core.ttl', 'sstim-namespace.ttl'],
      manifest: true,
      schema: true,
    },
  ])

  expect(region).toContain(
    'RewriteRule ^1\\.0\\.0/(sstim-core-profile\\.ttl|sstim-core\\.ttl|sstim-namespace\\.ttl)$ https://labiosyncare.github.io/ontology/1.0.0/$1 [R=302,L]',
  )
  expect(region).toContain(
    'RewriteRule ^1\\.0\\.0/manifest$ https://labiosyncare.github.io/ontology/1.0.0/manifest.json [R=302,L]',
  )
  expect(region).toContain(
    'RewriteRule ^1\\.0\\.0/manifest\\.schema\\.json$ https://labiosyncare.github.io/ontology/1.0.0/manifest.schema.json [R=302,L]',
  )
})

test('a frozen snapshot without the root artifact is rejected', () => {
  expect(() => generatedRegion([
    { version: '1.0.0', turtle: ['sstim-vocab.ttl'], manifest: false, schema: false },
  ])).toThrow('frozen snapshot lacks sstim-core.ttl')
})

test('a pre-modular version IRI resolves to sstim-core.ttl, which was the whole ontology', () => {
  const region = generatedRegion([
    { version: '0.12.0', turtle: ['sstim-core.ttl'], manifest: false, schema: false },
  ])

  expect(region).toContain(
    'RewriteRule ^0\\.12\\.0/?$ https://labiosyncare.github.io/ontology/0.12.0/sstim-core.ttl [R=302,L]',
  )
})

test('a modular version IRI resolves to the whole ontology, never to the Kernel module', () => {
  // After ADR 0043 sstim-core.ttl is the two-class Kernel. Resolving
  // owl:versionIRI <https://w3id.org/sstim/x.y.z> to it would hand a registry a
  // fraction of the release, so a modular snapshot must freeze a catalogue.
  expect(() => generatedRegion([
    {
      version: '0.13.0',
      turtle: ['sstim-core.ttl', 'sstim-stimulus.ttl'],
      manifest: true,
      schema: true,
    },
  ])).toThrow('would resolve to the Kernel module instead of the released ontology')

  const region = generatedRegion([
    {
      version: '0.13.0',
      turtle: ['sstim-core.ttl', 'sstim-namespace.ttl'],
      manifest: true,
      schema: true,
    },
  ])
  expect(region).toContain(
    'RewriteRule ^0\\.13\\.0/?$ https://labiosyncare.github.io/ontology/0.13.0/sstim-namespace.ttl [R=302,L]',
  )
  expect(region).not.toContain(
    'RewriteRule ^0\\.13\\.0/?$ https://labiosyncare.github.io/ontology/0.13.0/sstim-core.ttl',
  )
})
