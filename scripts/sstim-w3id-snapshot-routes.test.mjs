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
      turtle: ['sstim-core-profile.ttl', 'sstim-core.ttl'],
      manifest: true,
      schema: true,
    },
  ])

  expect(region).toContain(
    'RewriteRule ^1\\.0\\.0/(sstim-core-profile\\.ttl|sstim-core\\.ttl)$ https://labiosyncare.github.io/ontology/1.0.0/$1 [R=302,L]',
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
