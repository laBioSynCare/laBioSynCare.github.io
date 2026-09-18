#!/usr/bin/env node
// Command line entry point: `sstim`.
//
// Deliberately small. The interesting work is in the library; this exists so
// the shortest path from "I have a Turtle file" to "I know whether it is right"
// is two commands, one of which is `npm install`.

import { SstimError, cacheDir, resolveProfile } from './resolve.js'
import { validate } from './validate.js'

const PROFILES = ['kernel', 'core', 'core-plus', 'full']

const USAGE = `sstim: validate sensory-stimulation descriptions against a published SSTIM profile.

  sstim validate FILE...   check Turtle against a profile
  sstim profiles           list the profiles a release offers
  sstim modules            list what a profile pulls in, and from where
  sstim cache              print the local cache directory

Options:
  --profile NAME   ${PROFILES.join(' | ')}  (default: core)
  --version X.Y.Z  pin a release; default is the newest frozen release,
                   never the development line
  --manifest PATH  resolve from a local manifest.json instead of the network
  --offline        fail rather than fetch anything not already cached

SSTIM is at https://w3id.org/sstim. This is a client for it.`

function parseArgs (argv) {
  const options = { profile: 'core', version: null, manifest: null, offline: false }
  const positional = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--offline') options.offline = true
    else if (arg === '--profile') options.profile = argv[++i]
    else if (arg === '--version') options.version = argv[++i]
    else if (arg === '--manifest') options.manifest = argv[++i]
    else if (arg === '-h' || arg === '--help') options.help = true
    else positional.push(arg)
  }
  return { options, positional }
}

export async function main (argv = process.argv.slice(2)) {
  const { options, positional } = parseArgs(argv)
  const [command, ...files] = positional

  if (options.help || !command) {
    console.log(USAGE)
    return command ? 0 : 1
  }
  if (!PROFILES.includes(options.profile)) {
    console.error(`sstim: unknown profile '${options.profile}'. Available: ${PROFILES.join(', ')}`)
    return 2
  }

  try {
    if (command === 'cache') {
      console.log(await cacheDir() ?? 'no filesystem: caching is disabled')
      return 0
    }

    if (command === 'profiles') {
      const any = await resolveProfile('core', options)
      console.log(`SSTIM ${any.version} (${any.status}) from ${any.source}`)
      for (const name of PROFILES) {
        try {
          const one = await resolveProfile(name, options)
          const shapes = one.shapeModules.length || 'none'
          console.log(`  ${name.padEnd(10)} ${String(one.semanticModules.length).padStart(2)} modules, shapes: ${shapes}`)
        } catch { /* a release that lacks a profile simply does not list it */ }
      }
      return 0
    }

    if (command === 'modules') {
      const closure = await resolveProfile(options.profile, options)
      console.log(`${closure.profile} at ${closure.versionIri} (${closure.status}), resolved from ${closure.source}`)
      for (const module of closure.modules) {
        console.log(`  ${module.id.padEnd(26)} ${(module.isShapes ? 'shapes' : 'semantic').padEnd(9)} ${module.url}`)
      }
      return 0
    }

    if (command === 'validate') {
      if (files.length === 0) {
        console.error('sstim: validate needs at least one file')
        return 2
      }
      const closure = await resolveProfile(options.profile, options)
      let failed = 0
      for (const file of files) {
        const report = await validate(file, { closure, offline: options.offline })
        console.log(String(report))
        if (!report.ok) failed++
      }
      if (failed) console.error(`\n${failed} of ${files.length} file(s) failed`)
      return failed ? 1 : 0
    }

    console.error(`sstim: unknown command '${command}'\n\n${USAGE}`)
    return 2
  } catch (error) {
    if (error instanceof SstimError) {
      console.error(`sstim: ${error.message}`)
      return 2
    }
    throw error
  }
}

const invokedDirectly = process.argv[1] && import.meta.url === `file://${process.argv[1]}`
if (invokedDirectly) process.exit(await main())
