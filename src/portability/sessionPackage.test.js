import { describe, it, expect } from 'vitest'
import { Parser } from 'n3'
import {
  PACKAGE_FILES,
  SESSION_PACKAGE_MODEL,
  buildSessionPackage,
  findForbiddenIdentifiers,
  parseSessionPackage,
  serialiseSessionPackage,
} from './sessionPackage.js'
import { buildPatchExport, createAudioTrack, createControlTrack, createDraft, createVisualTrack, draftFromPatchExport }
  from '../ui/creator/presetDraft.js'

const OPTIONS = {
  sessionIri: 'https://w3id.org/sstim/implementation/bsclab/session/pkg-1',
  created: '2026-07-31T00:00:00Z',
  bscLabCommit: '6dfc79a',
  sstimRelease: '0.11.0',
}

const sample = () => {
  const draft = createDraft()
  draft.patchName = 'Package Sample'
  draft.audioTracks = [...draft.audioTracks, createAudioTrack('BinauralBeat')]
  draft.visualTracks = [createVisualTrack('Geometry')]
  draft.controlTracks = [createControlTrack('LFO')]
  return buildPatchExport(draft)
}

function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`
}

describe('package structure', () => {
  it('contains every declared file', async () => {
    const { files } = await buildSessionPackage(sample(), OPTIONS)
    expect(Object.keys(files).sort()).toEqual([...PACKAGE_FILES].sort())
  })

  it('records the build and ontology release it came from', async () => {
    const { manifest } = await buildSessionPackage(sample(), OPTIONS)
    expect(manifest.model).toBe(SESSION_PACKAGE_MODEL)
    expect(manifest.bscLabCommit).toBe('6dfc79a')
    expect(manifest.sstimRelease).toBe('0.11.0')
    expect(manifest.patchModel).toBe('patch-studio-model-1')
  })

  it('checksums every file individually', async () => {
    const { manifest, files } = await buildSessionPackage(sample(), OPTIONS)
    for (const name of Object.keys(files)) {
      if (name === 'manifest.json') continue
      expect(manifest.checksums[name]).toMatch(/^[0-9a-f]{64}$/)
    }
  })

  it('ships Turtle that parses', async () => {
    const { files } = await buildSessionPackage(sample(), OPTIONS)
    expect(new Parser().parse(files['session.ttl']).length).toBeGreaterThan(10)
  })

  it('says in the package itself which part is the executable truth', async () => {
    const { manifest } = await buildSessionPackage(sample(), OPTIONS)
    expect(manifest.note).toMatch(/session\.patch\.json is the executable object/)
    expect(manifest.note).toMatch(/lossless/)
  })
})

describe('determinism', () => {
  it('the same patch and options yield byte-identical packages', async () => {
    const patch = sample()
    const a = await serialiseSessionPackage(patch, OPTIONS)
    const b = await serialiseSessionPackage(patch, OPTIONS)
    expect(a).toBe(b)
  })

  it('the checksum changes when the patch changes', async () => {
    const first = await buildSessionPackage(sample(), OPTIONS)
    const altered = sample()
    altered.patchName = 'Different'
    const second = await buildSessionPackage(altered, OPTIONS)
    expect(second.checksum).not.toBe(first.checksum)
  })

  it('does not depend on key order in the source patch', async () => {
    const reverseKeys = (v) => {
      if (Array.isArray(v)) return v.map(reverseKeys)
      if (v === null || typeof v !== 'object') return v
      return Object.fromEntries(Object.keys(v).reverse().map((k) => [k, reverseKeys(v[k])]))
    }
    const patch = sample()
    expect(await serialiseSessionPackage(reverseKeys(patch), OPTIONS))
      .toBe(await serialiseSessionPackage(patch, OPTIONS))
  })
})

describe('round-trip: the patch survives exactly', () => {
  it('parse(serialise(p)) returns the same patch', async () => {
    const patch = sample()
    const { patch: received } = await parseSessionPackage(await serialiseSessionPackage(patch, OPTIONS))
    expect(canonical(received)).toBe(canonical(patch))
  })

  it('the received patch reconstructs a working draft', async () => {
    const patch = sample()
    const { patch: received } = await parseSessionPackage(await serialiseSessionPackage(patch, OPTIONS))
    // Level 2 equivalence: rebuilding and re-exporting must not drift.
    expect(canonical(buildPatchExport(draftFromPatchExport(received)))).toBe(canonical(patch))
  })

  it('is a fixed point across a full re-package', async () => {
    const patch = sample()
    const first = await serialiseSessionPackage(patch, OPTIONS)
    const { patch: received } = await parseSessionPackage(first)
    expect(await serialiseSessionPackage(received, OPTIONS)).toBe(first)
  })
})

describe('a malformed package fails before anything is applied', () => {
  it('rejects a foreign model', async () => {
    await expect(parseSessionPackage(JSON.stringify({ model: 'something-else', files: {} })))
      .rejects.toThrow(/Unsupported package model/)
  })

  it('rejects a missing file', async () => {
    const text = await serialiseSessionPackage(sample(), OPTIONS)
    const outer = JSON.parse(text)
    delete outer.files['session.ttl']
    await expect(parseSessionPackage(JSON.stringify(outer))).rejects.toThrow(/missing session\.ttl/)
  })

  it('detects tampering through the package checksum', async () => {
    const outer = JSON.parse(await serialiseSessionPackage(sample(), OPTIONS))
    const patch = JSON.parse(outer.files['session.patch.json'])
    patch.patchName = 'Tampered'
    outer.files['session.patch.json'] = JSON.stringify(patch)
    await expect(parseSessionPackage(JSON.stringify(outer))).rejects.toThrow(/altered or truncated/)
  })

  it('names the damaged file when only its own checksum is wrong', async () => {
    const outer = JSON.parse(await serialiseSessionPackage(sample(), OPTIONS))
    // Corrupt the Turtle and repair the outer checksum, so only the per-file
    // checksum can catch it.
    outer.files['session.ttl'] += '\n# injected\n'
    const canon = (v) => canonical(v)
    const bytes = new TextEncoder().encode(canon(outer.files))
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
    outer.checksum = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
    await expect(parseSessionPackage(JSON.stringify(outer))).rejects.toThrow(/session\.ttl does not match/)
  })

  it('rejects nonsense input', async () => {
    await expect(parseSessionPackage('')).rejects.toThrow(/not a session package/)
    await expect(parseSessionPackage('{ not json')).rejects.toThrow(/not valid JSON/)
    await expect(parseSessionPackage(null)).rejects.toThrow(/not a session package/)
  })

  it('refuses to package anything that is not a Patch Studio patch', async () => {
    await expect(buildSessionPackage({ model: 'other' }, OPTIONS)).rejects.toThrow(/Only Patch Studio patches/)
  })

  it('requires an explicit timestamp so packages are reproducible', async () => {
    await expect(buildSessionPackage(sample(), { sessionIri: OPTIONS.sessionIri }))
      .rejects.toThrow(/created/)
  })
})

describe('the privacy boundary is enforced, not assumed', () => {
  it('a built package carries no identifier', async () => {
    const text = await serialiseSessionPackage(sample(), OPTIONS)
    expect(findForbiddenIdentifiers(text)).toEqual([])
    expect(text).not.toMatch(/local-device/)
    expect(text).not.toMatch(/AIza[0-9A-Za-z_-]{20,}/)
  })

  it('refuses to build when a patch smuggles an identifier', async () => {
    const patch = sample()
    patch.author = { uid: 'firebase-user-12345' }
    await expect(buildSessionPackage(patch, OPTIONS)).rejects.toThrow(/Refusing to build/)
  })

  it('refuses to open a package containing one', async () => {
    // A package built elsewhere, by software without this guard.
    const outer = JSON.parse(await serialiseSessionPackage(sample(), OPTIONS))
    outer.files['session.patch.json'] = outer.files['session.patch.json']
      .replace('"patchName"', '"uid":"leaked","patchName"')
    await expect(parseSessionPackage(JSON.stringify(outer))).rejects.toThrow(/altered or truncated|Refusing to open/)
  })

  it('detects each forbidden pattern', () => {
    expect(findForbiddenIdentifiers('AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ012345')).toHaveLength(1)
    expect(findForbiddenIdentifiers('the local-device pseudonym')).toHaveLength(1)
    expect(findForbiddenIdentifiers('{"uid": "x"}')).toHaveLength(1)
    expect(findForbiddenIdentifiers('nothing to see')).toEqual([])
  })
})

describe('the mapping report travels with the package', () => {
  it('carries the structural findings and the unmapped list', async () => {
    const { report } = await parseSessionPackage(await serialiseSessionPackage(sample(), OPTIONS))
    expect(report.structuralFindings.map((f) => f.id)).toContain('S1')
    expect(report.mappedCount).toBeGreaterThan(0)
    expect(Array.isArray(report.unmapped)).toBe(true)
  })

  it('states what the projection is, and what it still does not assert', async () => {
    const { report } = await parseSessionPackage(await serialiseSessionPackage(sample(), OPTIONS))
    expect(report.conformance).toMatch(/SHACL-validated/)
    // ADR 0040 made the RDF valid. It did not make it a scientific claim, and
    // this is the sentence that must never soften.
    expect(report.conformance).toMatch(/no evidence, outcome or safety metadata/)
    expect(report.conformance).toMatch(/not a sstim:SessionSpecification/)
    expect(report.conformance).toMatch(/sstim:StimulusSpecification, which does not exist yet/)
  })
})
