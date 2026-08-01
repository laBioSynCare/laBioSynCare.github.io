#!/usr/bin/env node

import { createHash } from 'node:crypto'
import {
  existsSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_PATH = fileURLToPath(import.meta.url)
export const REPOSITORY_ROOT = resolve(dirname(SCRIPT_PATH), '..')
export const DEFAULT_MANIFEST_PATH = resolve(
  REPOSITORY_ROOT,
  'static/ontology/manifest.json',
)

const SHA256_PATTERN = /^[a-f0-9]{64}$/
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/
const MODULE_ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/
const MANIFEST_SCHEMA_IRI = 'https://w3id.org/sstim/manifest-schema/1'
const MANIFEST_SCHEMA_VERSION = '1.2.0'
const VERSIONED_BASE = 'https://w3id.org/sstim/'
const ALLOWED_ROLES = new Set([
  'semantic',
  'core',
  'support',
  'bridge',
  'validation',
  'alignments',
  'controlled-vocabulary',
  'implementation-profile',
])
const ALLOWED_STATUSES = new Set(['development', 'released', 'deprecated'])
const TOP_LEVEL_FIELDS = new Set([
  '$schema',
  'schemaVersion',
  'manifestIri',
  'suite',
  'integrity',
  'inventory',
  'immutableRelease',
  'namespaceDocuments',
  'modules',
  'profiles',
])
const REQUIRED_PROFILES = new Map([
  ['kernel', ['core']],
  ['core', ['core', 'stimulus']],
  ['core-plus', ['core', 'stimulus', 'common']],
])

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function posixRelative(from, to) {
  return relative(from, to).split(sep).join('/')
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function sameMembers(actual, expected) {
  return actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
}

export function sameSet(actual, expected) {
  const actualSet = new Set(actual)
  const expectedSet = new Set(expected)
  return actualSet.size === actual.length &&
    expectedSet.size === expected.length &&
    actualSet.size === expectedSet.size &&
    [...actualSet].every((value) => expectedSet.has(value))
}

function duplicateValues(values) {
  const seen = new Set()
  const duplicates = new Set()
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }
  return [...duplicates]
}

function resolveRepositoryPath(rootDir, sourcePath) {
  if (isAbsolute(sourcePath)) return null
  const absolutePath = resolve(rootDir, sourcePath)
  const relativePath = relative(rootDir, absolutePath)
  if (relativePath === '..' || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
    return null
  }
  return absolutePath
}

export function loadManifest(manifestPath = DEFAULT_MANIFEST_PATH) {
  return JSON.parse(readFileSync(manifestPath, 'utf8'))
}

export function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

export function profileDigest(manifest, moduleIds) {
  const moduleById = new Map(manifest.modules.map((module) => [module.id, module]))
  const payload = moduleIds
    .map((id) => {
      const module = moduleById.get(id)
      if (!module) throw new Error(`Unknown module ${JSON.stringify(id)} in profile digest`)
      return `${id}\0${module.source.sha256}\n`
    })
    .join('')
  return createHash('sha256').update(payload, 'utf8').digest('hex')
}

// A Turtle comment runs from a '#' to end of line, but only when that '#' is
// outside an IRI reference and outside a string literal. '#' is also the SSTIM
// namespace separator, so naive stripping would corrupt every term IRI. The
// metadata below is read with regular expressions, so comments must be removed
// first: prose mentioning owl:imports, dct:requires, or owl:versionIRI must not
// be read as an axiom.
export function stripTurtleComments(text) {
  let out = ''
  let index = 0
  let quote = null
  let inIri = false
  while (index < text.length) {
    const char = text[index]
    if (quote) {
      if (char === '\\' && quote.length === 1) {
        out += char + (text[index + 1] ?? '')
        index += 2
        continue
      }
      if (text.startsWith(quote, index)) {
        out += quote
        index += quote.length
        quote = null
        continue
      }
    } else if (inIri) {
      if (char === '>') inIri = false
    } else if (char === '<') {
      inIri = true
    } else if (text.startsWith('"""', index) || text.startsWith("'''", index)) {
      quote = text.slice(index, index + 3)
      out += quote
      index += 3
      continue
    } else if (char === '"' || char === "'") {
      quote = char
    } else if (char === '#') {
      while (index < text.length && text[index] !== '\n') index += 1
      continue
    }
    out += char
    index += 1
  }
  return out
}

export function readOntologyMetadata(path) {
  const text = stripTurtleComments(readFileSync(path, 'utf8'))
  const statementMatch = text.match(
    /<([^>]+)>\s*(?:\r?\n\s*)?a\s+[^;]*\bowl:Ontology\b[^;]*;([\s\S]*?)\s+\.\s*(?=\r?\n|$)/m,
  )
  if (!statementMatch) {
    throw new Error('could not find the owl:Ontology metadata statement')
  }

  const statement = statementMatch[2]
  const version = statement.match(/\bowl:versionInfo\s+"([^"]+)"/)?.[1] ?? null
  const versionIrisObject = statement.match(/\bowl:versionIRI\s+([^;]+);/)?.[1] ?? ''
  const versionIris = [...versionIrisObject.matchAll(/<([^>]+)>/g)]
    .map((match) => match[1])
  const title = statement.match(/\bdct:title\s+"([^"]+)"/)?.[1] ?? null
  const requiresObject = statement.match(/\bdct:requires\s+([^;]+);/)?.[1] ?? ''
  const requires = [...requiresObject.matchAll(/<([^>]+)>/g)].map((match) => match[1])
  const importsObject = statement.match(/\bowl:imports\s+([^;]+);/)?.[1] ?? ''
  const imports = [...importsObject.matchAll(/<([^>]+)>/g)].map((match) => match[1])
  const resourceArtifacts = new Map()
  for (const match of text.matchAll(
    /<([^>]+)>\s+a\s+prof:ResourceDescriptor\s*;([\s\S]*?)\s+\.\s*(?=\r?\n|$)/gm,
  )) {
    const artifactsObject = match[2].match(/\bprof:hasArtifact\s+([^;]+);/)?.[1] ?? ''
    const artifacts = [...artifactsObject.matchAll(/<([^>]+)>/g)]
      .map((artifact) => artifact[1])
    resourceArtifacts.set(
      match[1],
      [...(resourceArtifacts.get(match[1]) ?? []), ...artifacts],
    )
  }

  return {
    ontologyIri: statementMatch[1],
    version,
    versionIris,
    title,
    requires,
    imports,
    resourceArtifacts,
  }
}

export function resolveModuleClosure(manifest, seedIds) {
  const moduleById = new Map(manifest.modules.map((module) => [module.id, module]))
  const state = new Map()
  const stack = []
  const result = []

  function visit(id) {
    const module = moduleById.get(id)
    if (!module) throw new Error(`Unknown module dependency ${JSON.stringify(id)}`)

    if (state.get(id) === 2) return
    if (state.get(id) === 1) {
      const cycleStart = stack.indexOf(id)
      const cycle = [...stack.slice(cycleStart), id]
      throw new Error(`Module dependency cycle: ${cycle.join(' -> ')}`)
    }

    state.set(id, 1)
    stack.push(id)
    for (const requiredId of module.requires) visit(requiredId)
    stack.pop()
    state.set(id, 2)
    result.push(id)
  }

  for (const id of seedIds) visit(id)
  return result
}

// A namespace catalogue is the concatenation of its modules' Turtle masters, in
// manifest order, joined by a newline. Concatenating rather than reserializing
// preserves every RDF term exactly as authored -- reserializing rewrites
// decimal lexical forms ("20" becomes "20.0") and would make the catalogue
// differ from the modules it is built from.
//
// `scripts/export-ontology.py` builds the runtime catalogue by the same rule for
// `make export`. Keep the two in step: the frozen snapshot copy and the deployed
// copy of a released catalogue must be byte-identical.
export function namespaceCatalogueFilename(namespaceDocument) {
  return namespaceDocument.runtime.turtleUrl.split('/').pop()
}

export function namespaceCatalogueTurtle(
  manifest,
  documentId,
  { rootDir = REPOSITORY_ROOT, moduleSources } = {},
) {
  const document = manifest.namespaceDocuments.find((entry) => entry.id === documentId)
  if (!document) throw new Error(`Unknown namespace document ${JSON.stringify(documentId)}`)
  const moduleById = new Map(manifest.modules.map((module) => [module.id, module]))
  return document.modules
    .map((moduleId) => {
      const module = moduleById.get(moduleId)
      if (!module) {
        throw new Error(
          `Namespace document ${JSON.stringify(documentId)} names unknown module ` +
          JSON.stringify(moduleId),
        )
      }
      if (moduleSources) return moduleSources(module)
      return readFileSync(resolve(rootDir, module.source.path), 'utf8')
    })
    .join('\n')
}

export function resolveProfileClosure(manifest, profileId, { withShapes = false } = {}) {
  const profile = manifest.profiles.find((candidate) => candidate.id === profileId)
  if (!profile) throw new Error(`Unknown profile ${JSON.stringify(profileId)}`)
  const seeds = withShapes
    ? [...profile.modules, ...profile.shapeModules]
    : profile.modules
  return resolveModuleClosure(manifest, seeds)
}

export function profileResourceArtifactProblems({ manifest, profile, resourceArtifacts }) {
  const moduleById = new Map(manifest.modules.map((module) => [module.id, module]))
  const released = manifest.suite?.status === 'released'
  const shapeModuleIds = Array.isArray(profile.shapeModules) ? profile.shapeModules : []
  const expectedArtifacts = new Map([
    [
      `${profile.iri}#entrypoint`,
      [released ? profile.publication?.versionedUrl : profile.iri].filter(Boolean),
    ],
    [
      `${profile.iri}#manifest`,
      [released ? manifest.immutableRelease?.manifestUrl : manifest.manifestIri].filter(Boolean),
    ],
  ])
  if (shapeModuleIds.length > 0) {
    expectedArtifacts.set(
      `${profile.iri}#constraints`,
      shapeModuleIds
        .map((id) => {
          const module = moduleById.get(id)
          return released
            ? module?.publication?.versionedUrl
            : module?.publication?.persistentUrl
        })
        .filter(Boolean),
    )
  }

  const problems = []
  for (const [descriptor, expected] of expectedArtifacts) {
    const actual = resourceArtifacts.get(descriptor) ?? []
    if (!sameSet(actual, expected)) {
      problems.push(
        `${descriptor} prof:hasArtifact declares [${actual.join(', ')}], ` +
        `expected [${expected.join(', ')}] for the ${released ? 'immutable release' : 'mutable profile'}`,
      )
    }
  }
  for (const descriptor of resourceArtifacts.keys()) {
    if (descriptor.startsWith(`${profile.iri}#`) && !expectedArtifacts.has(descriptor)) {
      problems.push(`unexpected profile resource descriptor ${descriptor}`)
    }
  }
  return problems
}

function validateTopLevel(manifest, errors) {
  if (!isRecord(manifest)) {
    errors.push('manifest: expected an object')
    return false
  }

  let traversable = true

  if (!isHttpsUrl(manifest.$schema)) errors.push('$schema: expected an HTTPS URL')
  for (const field of Object.keys(manifest)) {
    if (!TOP_LEVEL_FIELDS.has(field)) errors.push(`manifest: unsupported property ${JSON.stringify(field)}`)
  }
  if (manifest.schemaVersion !== MANIFEST_SCHEMA_VERSION) {
    errors.push(`schemaVersion: expected ${JSON.stringify(MANIFEST_SCHEMA_VERSION)}`)
  }
  if (!isHttpsUrl(manifest.manifestIri)) {
    errors.push('manifestIri: expected an HTTPS URL')
  }
  if (!isRecord(manifest.suite)) errors.push('suite: expected an object')
  if (!isRecord(manifest.integrity)) errors.push('integrity: expected an object')
  if (!isRecord(manifest.inventory)) errors.push('inventory: expected an object')
  if (!Array.isArray(manifest.namespaceDocuments) || manifest.namespaceDocuments.length === 0) {
    errors.push('namespaceDocuments: expected a non-empty array')
    traversable = false
  }
  if (!Array.isArray(manifest.modules) || manifest.modules.length === 0) {
    errors.push('modules: expected a non-empty array')
    traversable = false
  }
  if (!Array.isArray(manifest.profiles) || manifest.profiles.length === 0) {
    errors.push('profiles: expected a non-empty array')
    traversable = false
  }
  return traversable
}

function validateSuite(manifest, errors) {
  const suite = manifest.suite
  if (!isRecord(suite)) return

  if (suite.id !== 'sstim') errors.push('suite.id: expected "sstim"')
  if (!isHttpsUrl(suite.ontologyIri)) {
    errors.push('suite.ontologyIri: expected an HTTPS URL')
  }
  if (!VERSION_PATTERN.test(suite.version ?? '')) {
    errors.push('suite.version: expected a semantic version')
  }
  if (!ALLOWED_STATUSES.has(suite.status)) {
    errors.push(`suite.status: unsupported status ${JSON.stringify(suite.status)}`)
  }
  if (suite.status === 'development' && !suite.version?.includes('-')) {
    errors.push('suite.version: a development suite must use a prerelease version')
  }
  if (suite.status === 'released' && suite.version?.includes('-')) {
    errors.push('suite.version: a released suite cannot use a prerelease version')
  }
  if (suite.versionPolicy !== 'synchronized') {
    errors.push('suite.versionPolicy: expected "synchronized"')
  }
  if (typeof suite.defaultProfile !== 'string' || suite.defaultProfile.length === 0) {
    errors.push('suite.defaultProfile: expected a profile id')
  }

  if (manifest.integrity?.algorithm !== 'sha256') {
    errors.push('integrity.algorithm: expected "sha256"')
  }
  if (manifest.integrity?.profileDigestFormat !== 'module-id\\0module-sha256\\n') {
    errors.push('integrity.profileDigestFormat: unsupported profile digest format')
  }

  const expectedBaseUrl = `${VERSIONED_BASE}${suite.version}/`
  if (suite.status === 'released') {
    const expectedSchemaUrl = `${expectedBaseUrl}manifest.schema.json`
    if (manifest.$schema !== expectedSchemaUrl) {
      errors.push(`$schema: a released suite must use ${JSON.stringify(expectedSchemaUrl)}`)
    }
    if (!isRecord(manifest.immutableRelease)) {
      errors.push('immutableRelease: required for a released suite')
    } else {
      if (manifest.immutableRelease.baseUrl !== expectedBaseUrl) {
        errors.push(`immutableRelease.baseUrl: expected ${JSON.stringify(expectedBaseUrl)}`)
      }
      const expectedManifestUrl = `${expectedBaseUrl}manifest`
      if (manifest.immutableRelease.manifestUrl !== expectedManifestUrl) {
        errors.push(`immutableRelease.manifestUrl: expected ${JSON.stringify(expectedManifestUrl)}`)
      }
      if (manifest.immutableRelease.schemaUrl !== expectedSchemaUrl) {
        errors.push(`immutableRelease.schemaUrl: expected ${JSON.stringify(expectedSchemaUrl)}`)
      }
    }
  } else {
    if (manifest.$schema !== MANIFEST_SCHEMA_IRI) {
      errors.push(`$schema: a mutable suite must use ${JSON.stringify(MANIFEST_SCHEMA_IRI)}`)
    }
    if (manifest.immutableRelease !== undefined) {
      errors.push('immutableRelease: non-release manifests must not advertise an immutable release')
    }
  }
}

function validateModules(manifest, errors, { verifyChecksums }) {
  if (!Array.isArray(manifest.modules)) return new Map()
  const moduleById = new Map()
  const uniqueFields = [
    ['id', []],
    ['ontologyIri', []],
    ['source.path', []],
    ['runtime.graphIri', []],
    ['runtime.url', []],
    ['publication.persistentUrl', []],
    ['publication.distributionUrl', []],
  ]

  for (const [index, module] of manifest.modules.entries()) {
    const at = `modules[${index}]`
    if (!isRecord(module)) {
      errors.push(`${at}: expected an object`)
      continue
    }
    if (!MODULE_ID_PATTERN.test(module.id ?? '')) {
      errors.push(`${at}.id: expected a lowercase kebab-case id`)
    } else if (moduleById.has(module.id)) {
      errors.push(`${at}.id: duplicate module id ${JSON.stringify(module.id)}`)
    } else {
      moduleById.set(module.id, module)
    }
    if (typeof module.title !== 'string' || module.title.length === 0) {
      errors.push(`${at}.title: expected a non-empty string`)
    }
    if (!isHttpsUrl(module.ontologyIri)) {
      errors.push(`${at}.ontologyIri: expected an HTTPS URL`)
    }
    if (module.version !== manifest.suite?.version) {
      errors.push(`${at}.version: expected synchronized version ${JSON.stringify(manifest.suite?.version)}`)
    }
    if (!Array.isArray(module.roles) || module.roles.length === 0) {
      errors.push(`${at}.roles: expected at least one role`)
    } else {
      for (const role of module.roles) {
        if (!ALLOWED_ROLES.has(role)) errors.push(`${at}.roles: unsupported role ${JSON.stringify(role)}`)
      }
      for (const role of duplicateValues(module.roles)) {
        errors.push(`${at}.roles: duplicate role ${JSON.stringify(role)}`)
      }
    }
    if (!Array.isArray(module.requires)) {
      errors.push(`${at}.requires: expected an array`)
    } else {
      for (const requiredId of module.requires) {
        if (!MODULE_ID_PATTERN.test(requiredId ?? '')) {
          errors.push(`${at}.requires: invalid module id ${JSON.stringify(requiredId)}`)
        }
      }
      for (const requiredId of duplicateValues(module.requires)) {
        errors.push(`${at}.requires: duplicate dependency ${JSON.stringify(requiredId)}`)
      }
      if (module.requires.includes(module.id)) {
        errors.push(`${at}.requires: a module cannot require itself`)
      }
    }
    if (!Array.isArray(module.requiresProfiles)) {
      errors.push(`${at}.requiresProfiles: expected an array`)
    } else {
      for (const profileId of module.requiresProfiles) {
        if (!MODULE_ID_PATTERN.test(profileId ?? '')) {
          errors.push(`${at}.requiresProfiles: invalid profile id ${JSON.stringify(profileId)}`)
        }
      }
      for (const profileId of duplicateValues(module.requiresProfiles)) {
        errors.push(`${at}.requiresProfiles: duplicate profile dependency ${JSON.stringify(profileId)}`)
      }
    }

    if (!isRecord(module.source)) {
      errors.push(`${at}.source: expected an object`)
    } else {
      if (!/^static\/ontology\/sstim-[a-z0-9-]+\.ttl$/.test(module.source.path ?? '')) {
        errors.push(`${at}.source.path: expected a top-level SSTIM Turtle source path`)
      }
      if (module.source.mediaType !== 'text/turtle') {
        errors.push(`${at}.source.mediaType: expected "text/turtle"`)
      }
      if (verifyChecksums && !SHA256_PATTERN.test(module.source.sha256 ?? '')) {
        errors.push(`${at}.source.sha256: expected a lowercase SHA-256 digest`)
      }
    }
    if (!isRecord(module.runtime)) {
      errors.push(`${at}.runtime: expected an object`)
    } else {
      if (!/^\/ontology\/sstim-[a-z0-9-]+\.ttl$/.test(module.runtime.url ?? '')) {
        errors.push(`${at}.runtime.url: expected an /ontology/*.ttl URL`)
      }
      if (!isHttpsUrl(module.runtime.graphIri)) {
        errors.push(`${at}.runtime.graphIri: expected an HTTPS IRI`)
      }
    }
    if (!isRecord(module.publication)) {
      errors.push(`${at}.publication: expected an object`)
    } else {
      if (module.publication.public !== true) {
        errors.push(`${at}.publication.public: every manifest module must be public`)
      }
      if (!isHttpsUrl(module.publication.persistentUrl)) {
        errors.push(`${at}.publication.persistentUrl: expected an HTTPS URL`)
      }
      if (!isHttpsUrl(module.publication.distributionUrl)) {
        errors.push(`${at}.publication.distributionUrl: expected an HTTPS URL`)
      }
      if (module.publication.versionedUrl !== undefined && !isHttpsUrl(module.publication.versionedUrl)) {
        errors.push(`${at}.publication.versionedUrl: expected an HTTPS URL`)
      }
    }
    if (!isRecord(module.release)) {
      errors.push(`${at}.release: expected an object`)
    } else {
      for (const flag of ['snapshot', 'export', 'fullProfile']) {
        if (typeof module.release[flag] !== 'boolean') {
          errors.push(`${at}.release.${flag}: expected a boolean`)
        }
      }
    }

    if (MODULE_ID_PATTERN.test(module.id ?? '')) {
      const filename = `sstim-${module.id}.ttl`
      const expected = {
        sourcePath: `static/ontology/${filename}`,
        runtimeUrl: `/ontology/${filename}`,
        graphIri: `https://w3id.org/sstim/graph/${module.id}`,
        distributionUrl: `https://labiosyncare.github.io/ontology/${filename}`,
        persistentUrl: module.id === 'core'
          ? 'https://w3id.org/sstim/kernel'
          : module.id === 'exposure'
            ? 'https://w3id.org/sstim/module/exposure'
            : module.ontologyIri,
        versionedUrl: `${VERSIONED_BASE}${manifest.suite?.version}/${filename}`,
      }
      if (module.source?.path !== expected.sourcePath) {
        errors.push(`${at}.source.path: expected ${JSON.stringify(expected.sourcePath)} for module id`)
      }
      if (module.runtime?.url !== expected.runtimeUrl) {
        errors.push(`${at}.runtime.url: expected ${JSON.stringify(expected.runtimeUrl)} for module id`)
      }
      if (module.runtime?.graphIri !== expected.graphIri) {
        errors.push(`${at}.runtime.graphIri: expected stable graph IRI ${JSON.stringify(expected.graphIri)}`)
      }
      if (module.publication?.persistentUrl !== expected.persistentUrl) {
        errors.push(`${at}.publication.persistentUrl: expected ${JSON.stringify(expected.persistentUrl)}`)
      }
      if (module.publication?.distributionUrl !== expected.distributionUrl) {
        errors.push(`${at}.publication.distributionUrl: expected ${JSON.stringify(expected.distributionUrl)}`)
      }
      if (manifest.suite?.status === 'released' && module.release?.snapshot) {
        if (module.publication?.versionedUrl !== expected.versionedUrl) {
          errors.push(`${at}.publication.versionedUrl: expected ${JSON.stringify(expected.versionedUrl)} for a released snapshot artifact`)
        }
      } else if (module.publication?.versionedUrl !== undefined) {
        errors.push(`${at}.publication.versionedUrl: development artifacts must not advertise an immutable release URL`)
      }
    }

    for (const [field, values] of uniqueFields) {
      const value = field.split('.').reduce((current, key) => current?.[key], module)
      if (typeof value === 'string') values.push(value)
    }
  }

  for (const [field, values] of uniqueFields) {
    for (const duplicate of duplicateValues(values)) {
      errors.push(`modules: duplicate ${field} ${JSON.stringify(duplicate)}`)
    }
  }
  return moduleById
}

function validateDependencyGraph(manifest, moduleById, errors) {
  if (!Array.isArray(manifest.modules)) return
  for (const module of manifest.modules) {
    if (!isRecord(module) || !Array.isArray(module.requires)) continue
    for (const requiredId of module.requires) {
      if (!moduleById.has(requiredId)) {
        errors.push(`module ${JSON.stringify(module.id)} requires unknown module ${JSON.stringify(requiredId)}`)
      }
    }
  }
  try {
    resolveModuleClosure(manifest, manifest.modules.map((module) => module.id))
  } catch (error) {
    errors.push(error.message)
  }
}

function validateNamespaceDocuments(manifest, moduleById, errors) {
  if (!Array.isArray(manifest.namespaceDocuments)) return
  const ids = []
  const namespaceIris = []
  const persistentUrls = []
  const runtimeUrls = []

  for (const [index, document] of manifest.namespaceDocuments.entries()) {
    const at = `namespaceDocuments[${index}]`
    if (!isRecord(document)) {
      errors.push(`${at}: expected an object`)
      continue
    }
    if (!MODULE_ID_PATTERN.test(document.id ?? '')) {
      errors.push(`${at}.id: expected a lowercase kebab-case id`)
    } else {
      ids.push(document.id)
    }
    if (!isHttpsUrl(document.namespaceIri) || !document.namespaceIri.endsWith('#')) {
      errors.push(`${at}.namespaceIri: expected an HTTPS hash namespace IRI`)
    } else {
      namespaceIris.push(document.namespaceIri)
    }
    if (!Array.isArray(document.modules) || document.modules.length === 0) {
      errors.push(`${at}.modules: expected a non-empty array`)
    } else {
      for (const duplicate of duplicateValues(document.modules)) {
        errors.push(`${at}.modules: duplicate module ${JSON.stringify(duplicate)}`)
      }
      for (const moduleId of document.modules) {
        if (!moduleById.has(moduleId)) {
          errors.push(`${at}.modules: unknown module ${JSON.stringify(moduleId)}`)
        }
      }
    }

    const stem = document.id === 'sstim'
      ? 'sstim-namespace'
      : `sstim-${document.id}-namespace`
    const expectedRuntime = {
      turtleUrl: `/ontology/${stem}.ttl`,
      jsonLdUrl: `/ontology/${stem}.jsonld`,
      rdfXmlUrl: `/ontology/${stem}.rdf`,
    }
    if (!isRecord(document.runtime)) {
      errors.push(`${at}.runtime: expected an object`)
    } else {
      for (const [field, expected] of Object.entries(expectedRuntime)) {
        if (document.runtime[field] !== expected) {
          errors.push(`${at}.runtime.${field}: expected ${JSON.stringify(expected)}`)
        } else {
          runtimeUrls.push(expected)
        }
      }
    }
    if (!isRecord(document.publication) || !isHttpsUrl(document.publication?.persistentUrl)) {
      errors.push(`${at}.publication.persistentUrl: expected an HTTPS URL`)
    } else {
      persistentUrls.push(document.publication.persistentUrl)
      const expectedPersistent = document.namespaceIri?.slice(0, -1)
      if (document.publication.persistentUrl !== expectedPersistent) {
        errors.push(`${at}.publication.persistentUrl: expected namespace base ${JSON.stringify(expectedPersistent)}`)
      }
    }
  }

  for (const [label, values] of [
    ['id', ids],
    ['namespaceIri', namespaceIris],
    ['publication.persistentUrl', persistentUrls],
    ['runtime URL', runtimeUrls],
  ]) {
    for (const duplicate of duplicateValues(values)) {
      errors.push(`namespaceDocuments: duplicate ${label} ${JSON.stringify(duplicate)}`)
    }
  }

  const rootDocument = manifest.namespaceDocuments.find((document) => document?.id === 'sstim')
  const fullProfile = manifest.profiles?.find((profile) => profile?.id === 'full')
  if (!rootDocument) {
    errors.push('namespaceDocuments: missing "sstim" root namespace document')
  } else if (Array.isArray(fullProfile?.modules) && !sameMembers(rootDocument.modules, fullProfile.modules)) {
    errors.push('namespaceDocuments "sstim": modules must exactly match the Full semantic profile')
  }
}

function validateProfiles(manifest, moduleById, errors, { verifyChecksums }) {
  if (!Array.isArray(manifest.profiles)) return
  const profileById = new Map()
  const profileIris = []

  for (const [index, profile] of manifest.profiles.entries()) {
    const at = `profiles[${index}]`
    if (!isRecord(profile)) {
      errors.push(`${at}: expected an object`)
      continue
    }
    if (!MODULE_ID_PATTERN.test(profile.id ?? '')) {
      errors.push(`${at}.id: expected a lowercase kebab-case id`)
    } else if (profileById.has(profile.id)) {
      errors.push(`${at}.id: duplicate profile id ${JSON.stringify(profile.id)}`)
    } else {
      profileById.set(profile.id, profile)
    }
    if (typeof profile.title !== 'string' || profile.title.length === 0) {
      errors.push(`${at}.title: expected a non-empty string`)
    }
    if (!isHttpsUrl(profile.iri)) errors.push(`${at}.iri: expected an HTTPS IRI`)
    else profileIris.push(profile.iri)
    if (profile.version !== manifest.suite?.version) {
      errors.push(`${at}.version: expected synchronized version ${JSON.stringify(manifest.suite?.version)}`)
    }
    if (profile.status !== manifest.suite?.status || !ALLOWED_STATUSES.has(profile.status)) {
      errors.push(`${at}.status: expected synchronized status ${JSON.stringify(manifest.suite?.status)}`)
    }
    if (!['none', 'rdfs', 'owl-rl'].includes(profile.inferenceMode)) {
      errors.push(`${at}.inferenceMode: expected none, rdfs, or owl-rl`)
    }
    if (!isRecord(profile.source)) {
      errors.push(`${at}.source: expected an entrypoint source object`)
    } else {
      if (!/^static\/ontology\/sstim-[a-z0-9-]+-profile\.ttl$/.test(profile.source.path ?? '')) {
        errors.push(`${at}.source.path: expected a top-level SSTIM profile entrypoint`)
      }
      if (profile.source.mediaType !== 'text/turtle') {
        errors.push(`${at}.source.mediaType: expected "text/turtle"`)
      }
      if (verifyChecksums && !SHA256_PATTERN.test(profile.source.sha256 ?? '')) {
        errors.push(`${at}.source.sha256: expected a lowercase SHA-256 digest`)
      }
    }
    if (!isRecord(profile.runtime) || !/^\/ontology\/sstim-[a-z0-9-]+-profile\.ttl$/.test(profile.runtime?.url ?? '')) {
      errors.push(`${at}.runtime.url: expected an /ontology/*-profile.ttl URL`)
    }
    if (!isRecord(profile.publication)) {
      errors.push(`${at}.publication: expected an object`)
    } else {
      if (profile.publication.public !== true) {
        errors.push(`${at}.publication.public: every profile entrypoint must be public`)
      }
      if (profile.publication.persistentUrl !== profile.iri) {
        errors.push(`${at}.publication.persistentUrl: expected the profile IRI`)
      }
      if (!isHttpsUrl(profile.publication.distributionUrl)) {
        errors.push(`${at}.publication.distributionUrl: expected an HTTPS URL`)
      }
      if (profile.publication.versionedUrl !== undefined && !isHttpsUrl(profile.publication.versionedUrl)) {
        errors.push(`${at}.publication.versionedUrl: expected an HTTPS URL`)
      }
    }
    if (!isRecord(profile.release)) {
      errors.push(`${at}.release: expected an object`)
    } else {
      for (const flag of ['snapshot', 'export']) {
        if (typeof profile.release[flag] !== 'boolean') {
          errors.push(`${at}.release.${flag}: expected a boolean`)
        }
      }
    }
    if (!isRecord(profile.fixtures)) {
      errors.push(`${at}.fixtures: expected an object`)
    } else {
      const allFixturePaths = []
      for (const category of ['positive', 'outOfScope', 'adversarial']) {
        if (!Array.isArray(profile.fixtures[category])) {
          errors.push(`${at}.fixtures.${category}: expected an array`)
          continue
        }
        for (const path of profile.fixtures[category]) {
          if (typeof path !== 'string' || path.length === 0) {
            errors.push(`${at}.fixtures.${category}: expected non-empty repository-relative paths`)
          }
        }
        for (const path of duplicateValues(profile.fixtures[category])) {
          errors.push(`${at}.fixtures.${category}: duplicate path ${JSON.stringify(path)}`)
        }
        allFixturePaths.push(...profile.fixtures[category])
      }
      for (const path of duplicateValues(allFixturePaths)) {
        errors.push(`${at}.fixtures: path occurs in more than one category ${JSON.stringify(path)}`)
      }
    }
    if (!Array.isArray(profile.competencyQueries)) {
      errors.push(`${at}.competencyQueries: expected an array`)
    } else {
      for (const path of profile.competencyQueries) {
        if (typeof path !== 'string' || path.length === 0) {
          errors.push(`${at}.competencyQueries: expected non-empty repository-relative paths`)
        }
      }
      for (const path of duplicateValues(profile.competencyQueries)) {
        errors.push(`${at}.competencyQueries: duplicate path ${JSON.stringify(path)}`)
      }
    }
    if (profile.status === 'released') {
      for (const category of ['positive', 'outOfScope', 'adversarial']) {
        if (Array.isArray(profile.fixtures?.[category]) && profile.fixtures[category].length === 0) {
          errors.push(`${at}.fixtures.${category}: a released profile requires at least one contract fixture`)
        }
      }
      if (Array.isArray(profile.competencyQueries) && profile.competencyQueries.length === 0) {
        errors.push(`${at}.competencyQueries: a released profile requires at least one competency query`)
      }
    }
    if (MODULE_ID_PATTERN.test(profile.id ?? '')) {
      const filename = `sstim-${profile.id}-profile.ttl`
      const expectedSourcePath = `static/ontology/${filename}`
      const expectedRuntimeUrl = `/ontology/${filename}`
      const expectedDistributionUrl = `https://labiosyncare.github.io/ontology/${filename}`
      const expectedVersionedUrl = `${VERSIONED_BASE}${manifest.suite?.version}/${filename}`
      if (profile.source?.path !== expectedSourcePath) {
        errors.push(`${at}.source.path: expected ${JSON.stringify(expectedSourcePath)} for profile id`)
      }
      if (profile.runtime?.url !== expectedRuntimeUrl) {
        errors.push(`${at}.runtime.url: expected ${JSON.stringify(expectedRuntimeUrl)} for profile id`)
      }
      if (profile.publication?.distributionUrl !== expectedDistributionUrl) {
        errors.push(`${at}.publication.distributionUrl: expected ${JSON.stringify(expectedDistributionUrl)}`)
      }
      if (manifest.suite?.status === 'released' && profile.release?.snapshot) {
        if (profile.publication?.versionedUrl !== expectedVersionedUrl) {
          errors.push(`${at}.publication.versionedUrl: expected ${JSON.stringify(expectedVersionedUrl)} for a released snapshot artifact`)
        }
      } else if (profile.publication?.versionedUrl !== undefined) {
        errors.push(`${at}.publication.versionedUrl: development artifacts must not advertise an immutable release URL`)
      }
    }
    if (!Array.isArray(profile.modules) || profile.modules.length === 0) {
      errors.push(`${at}.modules: expected a non-empty array`)
      continue
    }
    if (!Array.isArray(profile.shapeModules)) {
      errors.push(`${at}.shapeModules: expected an array`)
      continue
    }
    if (verifyChecksums && !SHA256_PATTERN.test(profile.sha256 ?? '')) {
      errors.push(`${at}.sha256: expected a lowercase SHA-256 digest`)
    }

    const ids = [...profile.modules, ...profile.shapeModules]
    for (const duplicate of duplicateValues(ids)) {
      errors.push(`${at}: duplicate module ${JSON.stringify(duplicate)}`)
    }
    for (const id of ids) {
      if (!moduleById.has(id)) errors.push(`${at}: unknown module ${JSON.stringify(id)}`)
    }
    for (const id of profile.modules) {
      if (moduleById.get(id)?.roles?.includes('validation')) {
        errors.push(`${at}.modules: validation module ${JSON.stringify(id)} belongs in shapeModules`)
      }
    }
    for (const id of profile.shapeModules) {
      if (!moduleById.get(id)?.roles?.includes('validation')) {
        errors.push(`${at}.shapeModules: ${JSON.stringify(id)} is not a validation module`)
      }
    }

    const selected = new Set(ids)
    for (const id of ids) {
      const module = moduleById.get(id)
      if (!module || !Array.isArray(module.requires)) continue
      for (const requiredId of module.requires) {
        if (!selected.has(requiredId)) {
          errors.push(`${at}: module ${JSON.stringify(id)} has missing dependency ${JSON.stringify(requiredId)}`)
        }
      }
    }

    const position = new Map(ids.map((id, positionIndex) => [id, positionIndex]))
    for (const id of ids) {
      const module = moduleById.get(id)
      if (!module || !Array.isArray(module.requires)) continue
      for (const requiredId of module.requires) {
        if (position.has(requiredId) && position.get(requiredId) > position.get(id)) {
          errors.push(`${at}: dependency ${JSON.stringify(requiredId)} must precede ${JSON.stringify(id)}`)
        }
      }
    }

    if (ids.every((id) => moduleById.has(id))) {
      try {
        const resolved = resolveModuleClosure(manifest, ids)
        if (!sameMembers(resolved, ids)) {
          errors.push(`${at}: declared order is not its deterministic dependency closure`)
        }
      } catch (error) {
        errors.push(`${at}: ${error.message}`)
      }
      if (verifyChecksums) {
        const actualDigest = profileDigest(manifest, ids)
        if (profile.sha256 !== actualDigest) {
          errors.push(`${at}.sha256: expected ${actualDigest}, found ${profile.sha256}`)
        }
      }
    }
  }

  for (const duplicate of duplicateValues(profileIris)) {
    errors.push(`profiles: duplicate iri ${JSON.stringify(duplicate)}`)
  }
  for (const module of manifest.modules) {
    if (!Array.isArray(module.requiresProfiles)) continue
    for (const profileId of module.requiresProfiles) {
      if (!profileById.has(profileId)) {
        errors.push(`module ${JSON.stringify(module.id)} requires unknown profile ${JSON.stringify(profileId)}`)
      }
    }
  }
  for (const [profileId, expectedModules] of REQUIRED_PROFILES) {
    const profile = profileById.get(profileId)
    if (!profile) {
      errors.push(`profiles: missing required ${JSON.stringify(profileId)} profile`)
    } else if (!sameMembers(profile.modules, expectedModules)) {
      errors.push(`profile ${JSON.stringify(profileId)} must declare modules in order: ${expectedModules.join(', ')}`)
    }
  }

  const full = profileById.get('full')
  if (!full) {
    errors.push('profiles: missing required "full" profile')
  } else {
    const expectedModules = manifest.modules
      .filter((module) => module.release?.fullProfile && !module.roles?.includes('validation'))
      .map((module) => module.id)
    const expectedShapes = manifest.modules
      .filter((module) => module.release?.fullProfile && module.roles?.includes('validation'))
      .map((module) => module.id)
    if (!sameSet(full.modules, expectedModules)) {
      errors.push('profile "full" must contain every non-validation module flagged release.fullProfile')
    }
    if (!sameSet(full.shapeModules, expectedShapes)) {
      errors.push('profile "full" shapeModules must contain every validation module flagged release.fullProfile')
    }
  }
  if (!profileById.has(manifest.suite?.defaultProfile)) {
    errors.push(`suite.defaultProfile: unknown profile ${JSON.stringify(manifest.suite?.defaultProfile)}`)
  }
}

function validateInventory(manifest, moduleById, errors, rootDir) {
  const inventory = manifest.inventory
  if (!isRecord(inventory)) return
  if (typeof inventory.directory !== 'string') {
    errors.push('inventory.directory: expected a repository-relative path')
    return
  }
  if (typeof inventory.filePattern !== 'string') {
    errors.push('inventory.filePattern: expected a regular expression string')
    return
  }
  if (!Array.isArray(inventory.excluded)) {
    errors.push('inventory.excluded: expected an array')
    return
  }

  const directory = resolveRepositoryPath(rootDir, inventory.directory)
  if (!directory || !existsSync(directory) || !statSync(directory).isDirectory()) {
    errors.push(`inventory.directory: missing directory ${JSON.stringify(inventory.directory)}`)
    return
  }
  let pattern
  try {
    pattern = new RegExp(inventory.filePattern)
  } catch (error) {
    errors.push(`inventory.filePattern: invalid regular expression (${error.message})`)
    return
  }

  const excludedPaths = []
  for (const [index, exclusion] of inventory.excluded.entries()) {
    const at = `inventory.excluded[${index}]`
    if (!isRecord(exclusion) || typeof exclusion.path !== 'string') {
      errors.push(`${at}.path: expected a repository-relative path`)
      continue
    }
    excludedPaths.push(exclusion.path)
    if (typeof exclusion.reason !== 'string' || exclusion.reason.length === 0) {
      errors.push(`${at}.reason: expected a non-empty string`)
    }
  }
  for (const duplicate of duplicateValues(excludedPaths)) {
    errors.push(`inventory.excluded: duplicate path ${JSON.stringify(duplicate)}`)
  }

  const discovered = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && pattern.test(entry.name))
    .map((entry) => posixRelative(rootDir, resolve(directory, entry.name)))
    .sort()
  const listed = manifest.modules
    .map((module) => module.source?.path)
    .filter((path) => typeof path === 'string')
  const profileEntrypoints = manifest.profiles
    .map((profile) => profile.source?.path)
    .filter((path) => typeof path === 'string')
  const accounted = new Set([...listed, ...profileEntrypoints, ...excludedPaths])
  for (const path of discovered) {
    if (!accounted.has(path)) errors.push(`inventory: unlisted SSTIM source ${JSON.stringify(path)}`)
  }
  for (const path of accounted) {
    if (!discovered.includes(path)) errors.push(`inventory: listed source does not match inventory ${JSON.stringify(path)}`)
  }
  for (const path of excludedPaths) {
    if (listed.includes(path) || profileEntrypoints.includes(path)) {
      errors.push(`inventory: excluded source is also a declared artifact ${JSON.stringify(path)}`)
    }
  }

  // Keep this parameter used in malformed-manifest runs where modules may be absent.
  void moduleById
}

function validateProfileContractFiles(manifest, errors, rootDir) {
  if (!Array.isArray(manifest.profiles)) return
  for (const [index, profile] of manifest.profiles.entries()) {
    if (!isRecord(profile)) continue
    const references = []
    if (isRecord(profile.fixtures)) {
      for (const category of ['positive', 'outOfScope', 'adversarial']) {
        if (!Array.isArray(profile.fixtures[category])) continue
        for (const path of profile.fixtures[category]) {
          references.push([`profiles[${index}].fixtures.${category}`, path])
        }
      }
    }
    if (Array.isArray(profile.competencyQueries)) {
      for (const path of profile.competencyQueries) {
        references.push([`profiles[${index}].competencyQueries`, path])
      }
    }

    for (const [at, repositoryPath] of references) {
      if (typeof repositoryPath !== 'string' || repositoryPath.length === 0) continue
      const absolutePath = resolveRepositoryPath(rootDir, repositoryPath)
      if (!absolutePath) {
        errors.push(`${at}: path escapes the repository root: ${JSON.stringify(repositoryPath)}`)
      } else if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
        errors.push(`${at}: missing contract file ${JSON.stringify(repositoryPath)}`)
      }
    }
  }
}

function validateFilesAndOntology(manifest, moduleById, errors, rootDir, { verifyChecksums }) {
  if (!Array.isArray(manifest.modules)) return
  for (const [index, module] of manifest.modules.entries()) {
    if (!isRecord(module) || !isRecord(module.source) || typeof module.source.path !== 'string') continue
    const at = `modules[${index}]`
    const path = resolveRepositoryPath(rootDir, module.source.path)
    if (!path) {
      errors.push(`${at}.source.path: path escapes the repository root`)
      continue
    }
    if (!existsSync(path) || !statSync(path).isFile()) {
      errors.push(`${at}.source.path: missing file ${JSON.stringify(module.source.path)}`)
      continue
    }
    if (verifyChecksums && SHA256_PATTERN.test(module.source.sha256 ?? '')) {
      const actualDigest = sha256File(path)
      if (module.source.sha256 !== actualDigest) {
        errors.push(`${at}.source.sha256: expected ${actualDigest}, found ${module.source.sha256}`)
      }
    }

    let metadata
    try {
      metadata = readOntologyMetadata(path)
    } catch (error) {
      errors.push(`${at}.source.path: ${error.message}`)
      continue
    }
    if (metadata.ontologyIri !== module.ontologyIri) {
      errors.push(`${at}.ontologyIri: Turtle declares ${JSON.stringify(metadata.ontologyIri)}`)
    }
    if (metadata.version !== module.version) {
      errors.push(`${at}.version: Turtle declares ${JSON.stringify(metadata.version)}`)
    }
    if (metadata.title !== module.title) {
      errors.push(`${at}.title: Turtle declares ${JSON.stringify(metadata.title)}`)
    }
    // ADR 0020: SSTIM is versioned as one synchronized set. Only the umbrella
    // module carries owl:versionIRI, and only once released. Concern modules
    // never declare one, so a module's retrieval endpoint is deliberately not
    // an OWL identity — profiles import ontology *documents* (OWL 2 Structural
    // Specification 3.4), which need not be ontology or version IRIs.
    const isSuiteUmbrella = module.ontologyIri === manifest.suite?.ontologyIri
    const expectedVersionIris = manifest.suite?.status === 'released' && isSuiteUmbrella
      ? [`${manifest.suite.ontologyIri}/${manifest.suite.version}`]
      : []
    if (!sameSet(metadata.versionIris, expectedVersionIris)) {
      errors.push(
        `${at}.publication: Turtle owl:versionIRI declares [${metadata.versionIris.join(', ')}], ` +
        `expected [${expectedVersionIris.join(', ')}] under the ADR 0020 whole-set ` +
        `versioning policy for a ${manifest.suite?.status === 'released' ? 'released' : 'development'} suite`,
      )
    }
    if (Array.isArray(module.requires)) {
      const requiredIris = module.requires
        .map((id) => moduleById.get(id)?.ontologyIri)
        .filter(Boolean)
      const profileIris = (module.requiresProfiles ?? [])
        .map((id) => manifest.profiles.find((profile) => profile.id === id)?.iri)
        .filter(Boolean)
      const expectedRequires = [...requiredIris, ...profileIris]
      if (!sameSet(metadata.requires, expectedRequires)) {
        errors.push(
          `${at}.requires: Turtle declares [${metadata.requires.join(', ')}], ` +
          `manifest resolves [${expectedRequires.join(', ')}]`,
        )
      }
    }
  }

  for (const [index, profile] of manifest.profiles.entries()) {
    if (!isRecord(profile) || !isRecord(profile.source) || typeof profile.source.path !== 'string') continue
    const at = `profiles[${index}]`
    const path = resolveRepositoryPath(rootDir, profile.source.path)
    if (!path) {
      errors.push(`${at}.source.path: path escapes the repository root`)
      continue
    }
    if (!existsSync(path) || !statSync(path).isFile()) {
      errors.push(`${at}.source.path: missing file ${JSON.stringify(profile.source.path)}`)
      continue
    }
    if (verifyChecksums && SHA256_PATTERN.test(profile.source.sha256 ?? '')) {
      const actualDigest = sha256File(path)
      if (profile.source.sha256 !== actualDigest) {
        errors.push(`${at}.source.sha256: expected ${actualDigest}, found ${profile.source.sha256}`)
      }
    }
    let metadata
    try {
      metadata = readOntologyMetadata(path)
    } catch (error) {
      errors.push(`${at}.source.path: ${error.message}`)
      continue
    }
    if (metadata.ontologyIri !== profile.iri) {
      errors.push(`${at}.iri: entrypoint declares ${JSON.stringify(metadata.ontologyIri)}`)
    }
    if (metadata.version !== profile.version) {
      errors.push(`${at}.version: entrypoint declares ${JSON.stringify(metadata.version)}`)
    }
    if (metadata.title !== profile.title) {
      errors.push(`${at}.title: entrypoint declares ${JSON.stringify(metadata.title)}`)
    }
    const expectedVersionIris = manifest.suite?.status === 'released' && profile.release?.snapshot
      ? [profile.publication?.versionedUrl].filter(Boolean)
      : []
    if (!sameSet(metadata.versionIris, expectedVersionIris)) {
      errors.push(
        `${at}.publication: entrypoint owl:versionIRI declares [${metadata.versionIris.join(', ')}], ` +
        `expected [${expectedVersionIris.join(', ')}] for the ` +
        `${manifest.suite?.status === 'released' ? 'immutable release artifact' : 'development profile identity'}`,
      )
    }
    const profileModuleIds = Array.isArray(profile.modules) ? profile.modules : []
    const moduleIris = profileModuleIds
      .map((id) => moduleById.get(id)?.ontologyIri)
      .filter(Boolean)
    if (!sameSet(metadata.requires, moduleIris)) {
      errors.push(`${at}.modules: entrypoint dct:requires does not match the semantic closure`)
    }
    const importIris = profileModuleIds
      .map((id) => {
        const module = moduleById.get(id)
        return manifest.suite?.status === 'released'
          ? module?.publication?.versionedUrl
          : module?.publication?.persistentUrl
      })
      .filter(Boolean)
    if (!sameSet(metadata.imports, importIris)) {
      errors.push(
        `${at}.modules: entrypoint owl:imports does not match the ` +
        `${manifest.suite?.status === 'released' ? 'immutable' : 'development'} retrieval closure`,
      )
    }
    // Every import is checked above against the manifest retrieval closure, which
    // is the contract that matters: the URL must be the endpoint this suite
    // publishes for that module. It is deliberately not compared to the imported
    // module's owl:Ontology IRI. OWL 2 imports name ontology documents, and two
    // SSTIM endpoints (/kernel, /module/exposure) exist precisely because their
    // ontology IRIs are occupied by multi-module namespace catalogues.

    for (const problem of profileResourceArtifactProblems({
      manifest,
      profile,
      resourceArtifacts: metadata.resourceArtifacts,
    })) {
      errors.push(`${at}: ${problem}`)
    }
  }
}

export function validateManifest(
  manifest,
  {
    rootDir = REPOSITORY_ROOT,
    verifyChecksums = true,
    verifyFiles = true,
  } = {},
) {
  const errors = []
  if (!validateTopLevel(manifest, errors)) return errors
  validateSuite(manifest, errors)
  const moduleById = validateModules(manifest, errors, { verifyChecksums })
  validateDependencyGraph(manifest, moduleById, errors)
  validateProfiles(manifest, moduleById, errors, { verifyChecksums })
  validateNamespaceDocuments(manifest, moduleById, errors)
  if (verifyFiles) {
    validateInventory(manifest, moduleById, errors, rootDir)
    validateProfileContractFiles(manifest, errors, rootDir)
    validateFilesAndOntology(manifest, moduleById, errors, rootDir, { verifyChecksums })
  }
  return errors
}

export function syncChecksums(manifest, { rootDir = REPOSITORY_ROOT } = {}) {
  const preflightErrors = validateManifest(manifest, {
    rootDir,
    verifyChecksums: false,
    verifyFiles: true,
  })
  if (preflightErrors.length > 0) {
    throw new Error(`Cannot sync an invalid manifest:\n- ${preflightErrors.join('\n- ')}`)
  }

  for (const module of manifest.modules) {
    module.source.sha256 = sha256File(resolve(rootDir, module.source.path))
  }
  for (const profile of manifest.profiles) {
    profile.source.sha256 = sha256File(resolve(rootDir, profile.source.path))
  }
  for (const profile of manifest.profiles) {
    profile.sha256 = profileDigest(manifest, [...profile.modules, ...profile.shapeModules])
  }

  const errors = validateManifest(manifest, { rootDir })
  if (errors.length > 0) {
    throw new Error(`Checksum synchronization produced an invalid manifest:\n- ${errors.join('\n- ')}`)
  }
  return manifest
}

function parseArguments(argv) {
  const args = [...argv]
  const command = args.shift() ?? 'help'
  const options = {
    manifestPath: DEFAULT_MANIFEST_PATH,
    rootDir: REPOSITORY_ROOT,
    withShapes: false,
    withEntrypoint: false,
    absolute: false,
    json: false,
  }
  const positional = []
  while (args.length > 0) {
    const argument = args.shift()
    if (argument === '--manifest') {
      if (args.length === 0) throw new Error('--manifest requires a path')
      options.manifestPath = resolve(process.cwd(), args.shift())
    } else if (argument === '--root') {
      if (args.length === 0) throw new Error('--root requires a path')
      options.rootDir = resolve(process.cwd(), args.shift())
    } else if (argument === '--with-shapes') {
      options.withShapes = true
    } else if (argument === '--with-entrypoint') {
      options.withEntrypoint = true
    } else if (argument === '--absolute') {
      options.absolute = true
    } else if (argument === '--json') {
      options.json = true
    } else if (argument === '--help' || argument === '-h') {
      options.help = true
    } else if (argument.startsWith('-')) {
      throw new Error(`Unknown option ${JSON.stringify(argument)}`)
    } else {
      positional.push(argument)
    }
  }
  return { command, options, positional }
}

function usage() {
  return `Usage:
  node scripts/sstim-manifest.mjs check [--manifest PATH] [--root PATH]
  node scripts/sstim-manifest.mjs sync-checksums [--manifest PATH] [--root PATH]
  node scripts/sstim-manifest.mjs closure PROFILE [--with-shapes] [--json]
  node scripts/sstim-manifest.mjs files PROFILE [--with-shapes] [--with-entrypoint]
                                                [--absolute] [--json]

Commands:
  check            Validate structure, inventory, metadata, dependency DAG,
                   closed profiles, synchronized versions, and SHA-256 digests.
  sync-checksums   Recompute module and profile digests, then atomically rewrite
                   the manifest. All non-checksum validations must pass first.
  closure          Print dependency-ordered module ids for a profile.
  files            Print dependency-ordered repository-relative source paths.

Output is one value per line by default. --json emits a JSON array. Shapes are
excluded from closure/files unless --with-shapes is present. A profile's import
entrypoint is appended to files only when --with-entrypoint is present.`
}

function printValues(values, json) {
  if (json) console.log(JSON.stringify(values, null, 2))
  else if (values.length > 0) console.log(values.join('\n'))
}

export function runCli(argv = process.argv.slice(2)) {
  const { command, options, positional } = parseArguments(argv)
  if (command === 'help' || options.help) {
    console.log(usage())
    return 0
  }
  if (!['check', 'sync-checksums', 'closure', 'files'].includes(command)) {
    throw new Error(`Unknown command ${JSON.stringify(command)}\n\n${usage()}`)
  }
  if ((command === 'check' || command === 'sync-checksums') && positional.length !== 0) {
    throw new Error(`${command} does not accept positional arguments`)
  }
  if ((command === 'closure' || command === 'files') && positional.length !== 1) {
    throw new Error(`${command} requires exactly one PROFILE argument`)
  }
  if (command !== 'files' && options.withEntrypoint) {
    throw new Error('--with-entrypoint is valid only for the files command')
  }

  const manifest = loadManifest(options.manifestPath)
  if (command === 'sync-checksums') {
    syncChecksums(manifest, { rootDir: options.rootDir })
    const temporaryPath = `${options.manifestPath}.tmp-${process.pid}`
    try {
      writeFileSync(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
      renameSync(temporaryPath, options.manifestPath)
    } finally {
      if (existsSync(temporaryPath)) unlinkSync(temporaryPath)
    }
    console.log(`SSTIM manifest checksums synchronized: ${posixRelative(options.rootDir, options.manifestPath)}`)
    return 0
  }

  const errors = validateManifest(manifest, { rootDir: options.rootDir })
  if (errors.length > 0) {
    console.error(`SSTIM manifest: FAIL (${errors.length} error${errors.length === 1 ? '' : 's'})`)
    for (const error of errors) console.error(`- ${error}`)
    return 1
  }
  if (command === 'check') {
    console.log(`SSTIM manifest: PASS (${manifest.modules.length} modules, ${manifest.profiles.length} profiles)`)
    return 0
  }

  const moduleIds = resolveProfileClosure(manifest, positional[0], {
    withShapes: options.withShapes,
  })
  if (command === 'closure') {
    printValues(moduleIds, options.json)
  } else {
    const moduleById = new Map(manifest.modules.map((module) => [module.id, module]))
    const profile = manifest.profiles.find((candidate) => candidate.id === positional[0])
    const sourcePaths = moduleIds.map((id) => moduleById.get(id).source.path)
    if (options.withEntrypoint) sourcePaths.push(profile.source.path)
    const paths = sourcePaths.map((path) => {
      return options.absolute ? resolve(options.rootDir, path) : path
    })
    printValues(paths, options.json)
  }
  return 0
}

if (process.argv[1] && resolve(process.argv[1]) === SCRIPT_PATH) {
  try {
    process.exitCode = runCli()
  } catch (error) {
    console.error(`sstim-manifest: ${error.message}`)
    process.exitCode = 2
  }
}
