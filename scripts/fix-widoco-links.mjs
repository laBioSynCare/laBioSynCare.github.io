#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const BARE_SSTIM_LINK = /href="([^"#/:?][^"]*)" title="https:\/\/w3id\.org\/sstim#([^"]+)"/g

/**
 * WIDOCO occasionally rewrites an annotation-property IRI to a bare relative
 * filename even when it emits no corresponding section. Route those orphaned
 * SSTIM links into the Graph Navigator instead of publishing a guaranteed 404.
 */
export function repairWidocoLinks(html) {
  let repairs = 0
  const output = html.replace(BARE_SSTIM_LINK, (match, relative, term) => {
    if (relative !== term) return match
    repairs += 1
    return `href="../../graph/#sstim:${encodeURIComponent(term)}" title="https://w3id.org/sstim#${term}"`
  })
  return { output, repairs }
}

async function main(files) {
  if (files.length === 0) throw new Error('usage: fix-widoco-links.mjs <html> [...]')
  let total = 0
  for (const file of files) {
    const { output, repairs } = repairWidocoLinks(await readFile(file, 'utf8'))
    await writeFile(file, output)
    total += repairs
  }
  console.log(`fix-widoco-links: repaired ${total} orphaned SSTIM link(s)`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
