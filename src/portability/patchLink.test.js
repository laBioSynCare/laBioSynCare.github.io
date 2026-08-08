import { describe, it, expect } from 'vitest'
import {
  MAX_LINK_CHARS,
  PATCH_LINK_PARAM,
  PATCH_LINK_VERSION,
  buildPatchLink,
  decodePatchLink,
  encodePatchLink,
  readPatchLinkFrom,
} from './patchLink.js'
import {
  PATCH_STUDIO_MODEL_V1,
  PATCH_STUDIO_MODEL_V2,
  buildPatchExport,
  createDraft,
  draftFromPatchExport,
} from '../ui/creator/presetDraft.js'

const samplePatch = () => buildPatchExport(createDraft())

/** Stable stringify, mirroring the module's own canonical form. */
function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`
}

describe('round-trip', () => {
  it('decode(encode(p)) is p, canonically', async () => {
    const patch = samplePatch()
    const encoded = await encodePatchLink(patch)
    expect(encoded.ok).toBe(true)
    expect(canonical(await decodePatchLink(encoded.value))).toBe(canonical(patch))
  })

  it('is a fixed point: encode → decode → encode is byte-identical', async () => {
    const first = await encodePatchLink(samplePatch())
    const second = await encodePatchLink(await decodePatchLink(first.value))
    expect(second.value).toBe(first.value)
  })

  it('survives the editor round-trip, so a shared patch actually loads', async () => {
    const patch = samplePatch()
    const encoded = await encodePatchLink(patch)
    const received = await decodePatchLink(encoded.value)
    // The received patch must reconstruct a draft and re-export identically —
    // a link that decodes but will not open is not a working share.
    expect(canonical(buildPatchExport(draftFromPatchExport(received)))).toBe(canonical(patch))
  })

  it('preserves a renamed patch and its tracks', async () => {
    const patch = samplePatch()
    patch.patchName = 'Evening Descent — 6.5 s'
    const received = await decodePatchLink((await encodePatchLink(patch)).value)
    expect(received.patchName).toBe('Evening Descent — 6.5 s')
    expect(canonical(received.audioTracks)).toBe(canonical(patch.audioTracks))
  })

  it('reads a genuine model-1 link and upgrades it only when the editor rebuilds it', async () => {
    const legacy = {
      model: PATCH_STUDIO_MODEL_V1,
      patchName: 'Legacy shared patch',
      timing: { bpmEnabled: false, bpm: 60, beatsPerBar: 4, lengthSec: 900 },
      controlTracks: [],
      audioTracks: [],
      visualTracks: [{ id: 'v-old', trackType: 'Geometry', name: 'Geometry', params: {} }],
      hapticTracks: [],
    }

    const received = await decodePatchLink((await encodePatchLink(legacy)).value)

    expect(received).toEqual(legacy)
    expect(buildPatchExport(draftFromPatchExport(received)).model).toBe(PATCH_STUDIO_MODEL_V2)
  })
})

describe('the link is compact and URL-safe', () => {
  it('emits only base64url characters after the version tag', async () => {
    const { value } = await encodePatchLink(samplePatch())
    const [version, payload] = [value.slice(0, value.indexOf('.')), value.slice(value.indexOf('.') + 1)]
    expect(Number(version)).toBe(PATCH_LINK_VERSION)
    expect(payload).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('is smaller than the JSON it carries', async () => {
    const patch = samplePatch()
    const { value, chars } = await encodePatchLink(patch)
    expect(chars).toBe(value.length)
    expect(chars).toBeLessThan(JSON.stringify(patch).length)
  })

  it('builds a full URL and drops any existing fragment', async () => {
    const result = await buildPatchLink(samplePatch(), 'https://example.org/creator/#stale')
    expect(result.ok).toBe(true)
    expect(result.url.startsWith(`https://example.org/creator/#${PATCH_LINK_PARAM}=`)).toBe(true)
    expect(result.url).not.toContain('stale')
  })
})

describe('size is bounded and failure is clean', () => {
  it('refuses a patch that does not fit, rather than truncating it', async () => {
    // Incompressible payload, so it cannot be squeezed under the ceiling.
    const patch = samplePatch()
    patch.patchName = Array.from(
      { length: 60_000 },
      () => Math.random().toString(36).slice(2, 3),
    ).join('')

    const result = await encodePatchLink(patch)
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('too-large')
    expect(result.chars).toBeGreaterThan(MAX_LINK_CHARS)
    expect(result.limit).toBe(MAX_LINK_CHARS)
    // No value at all — there is nothing a caller could accidentally share.
    expect(result.value).toBeUndefined()
  })

  it('reports the same outcome through buildPatchLink', async () => {
    const patch = samplePatch()
    patch.patchName = Array.from(
      { length: 60_000 },
      () => Math.random().toString(36).slice(2, 3),
    ).join('')
    const result = await buildPatchLink(patch, 'https://example.org/creator/')
    expect(result.ok).toBe(false)
    expect(result.url).toBeUndefined()
  })
})

describe('input from outside is treated as hostile', () => {
  it('rejects an unknown envelope version without decoding it', async () => {
    await expect(decodePatchLink('9.AAAA')).rejects.toThrow(/newer version/)
  })

  it('rejects something that is not a link at all', async () => {
    await expect(decodePatchLink('not-a-link')).rejects.toThrow(/not a patch link/)
    await expect(decodePatchLink('')).rejects.toThrow(/carries no patch/)
    await expect(decodePatchLink(null)).rejects.toThrow(/carries no patch/)
  })

  it('rejects a truncated payload', async () => {
    const { value } = await encodePatchLink(samplePatch())
    await expect(decodePatchLink(value.slice(0, value.length - 12))).rejects.toThrow(
      /damaged or incomplete|altered or truncated/,
    )
  })

  it('detects a tampered payload through the checksum', async () => {
    // Re-encode a patch whose checksum was computed over different content.
    const patch = samplePatch()
    const { encodeForTest } = await tamper(patch)
    await expect(decodePatchLink(encodeForTest)).rejects.toThrow(/altered or truncated/)
  })

  it('refuses a decompression bomb instead of allocating for it', async () => {
    // ~2 MB of zeros compresses to a couple of kB and expands past the cap.
    const bomb = new Uint8Array(2 * 1024 * 1024)
    const stream = new Blob([bomb]).stream().pipeThrough(new CompressionStream('deflate-raw'))
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer())
    let binary = ''
    for (const b of compressed) binary += String.fromCharCode(b)
    const payload = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    await expect(decodePatchLink(`${PATCH_LINK_VERSION}.${payload}`)).rejects.toThrow(
      /expands to more data/,
    )
  })

  it('rejects a well-formed envelope that is not a Patch Studio patch', async () => {
    const value = await encodeRaw({ v: PATCH_LINK_VERSION, sum: 'deadbeef', patch: { model: 'something-else' } })
    await expect(decodePatchLink(value)).rejects.toThrow(/does not contain a Patch Studio patch/)
  })

  it('refuses to encode anything that is not a Patch Studio patch', async () => {
    await expect(encodePatchLink({ model: 'bsc-lab-instance-export-1' })).rejects.toThrow(
      /Only Patch Studio patches/,
    )
    await expect(encodePatchLink(null)).rejects.toThrow(/Only Patch Studio patches/)
  })

  it('refuses model-2 fields carried under the model-1 tag', async () => {
    await expect(encodePatchLink({
      model: PATCH_STUDIO_MODEL_V1,
      visualStage: { presentationMode: 'mono' },
    })).rejects.toThrow(/model-2 features.*model-1/)
  })
})

describe('reading a link out of what someone pasted', () => {
  it('reads a full URL', async () => {
    const { url } = await buildPatchLink(samplePatch(), 'https://example.org/creator/')
    const value = readPatchLinkFrom(url)
    expect(value).not.toBeNull()
    expect((await decodePatchLink(value)).model).toBe(PATCH_STUDIO_MODEL_V2)
  })

  it('reads a bare location.hash', async () => {
    const { value } = await encodePatchLink(samplePatch())
    expect(readPatchLinkFrom(`#${PATCH_LINK_PARAM}=${value}`)).toBe(value)
  })

  it('returns null when there is nothing to read', () => {
    expect(readPatchLinkFrom('')).toBeNull()
    expect(readPatchLinkFrom('https://example.org/creator/')).toBeNull()
    expect(readPatchLinkFrom('#other=1')).toBeNull()
    expect(readPatchLinkFrom(null)).toBeNull()
  })
})

describe('only the patch travels', () => {
  it('carries nothing but the patch document', async () => {
    const patch = samplePatch()
    const received = await decodePatchLink((await encodePatchLink(patch)).value)
    expect(Object.keys(received).sort()).toEqual(Object.keys(patch).sort())
  })

  it('cannot be made to carry extra keys smuggled alongside the patch', async () => {
    // Anything outside `patch` is discarded by decode, so an attacker cannot
    // use the envelope as a side channel into the editor.
    const patch = samplePatch()
    const value = await encodeRaw({
      v: PATCH_LINK_VERSION,
      sum: await sumFor(patch),
      patch,
      logbook: [{ secret: 'should never surface' }],
    })
    const received = await decodePatchLink(value)
    expect(received.logbook).toBeUndefined()
    expect(JSON.stringify(received)).not.toContain('should never surface')
  })
})

// ── helpers that build payloads the public API deliberately will not ─────────

function canonicalOf(value) { return canonical(value) }

async function sumFor(patch) {
  const bytes = new TextEncoder().encode(canonicalOf(patch))
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 8)
}

async function encodeRaw(envelope) {
  const stream = new Blob([canonicalOf(envelope)]).stream()
    .pipeThrough(new CompressionStream('deflate-raw'))
  const compressed = new Uint8Array(await new Response(stream).arrayBuffer())
  let binary = ''
  for (const b of compressed) binary += String.fromCharCode(b)
  const payload = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${PATCH_LINK_VERSION}.${payload}`
}

/** An envelope whose checksum does not match its patch. */
async function tamper(patch) {
  const altered = JSON.parse(JSON.stringify(patch))
  altered.patchName = 'Tampered'
  return { encodeForTest: await encodeRaw({ v: PATCH_LINK_VERSION, sum: await sumFor(patch), patch: altered }) }
}
