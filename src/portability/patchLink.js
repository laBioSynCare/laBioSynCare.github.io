// Share a patch as a URL fragment — ADR 0039, Tier 1.
//
// A fragment is never sent to a server. `…/creator/#patch=<blob>` therefore
// shares a working patch with no infrastructure, no storage, no account and no
// operator: the recipient's browser receives the bytes directly from whatever
// channel carried the link. That is what makes it the cheapest possible answer
// to "how do people share things" for a project that has declined to run a
// multi-user backend.
//
// Four constraints shape everything below.
//
// 1. **Only the patch travels.** Never the logbook, profile, annotations or any
//    other local storage. The link is built from a patch export that the caller
//    passes in — this module reads no storage at all, so there is nothing for a
//    future edit to accidentally widen.
// 2. **Size is bounded and failure is clean.** A fragment is not an archive.
//    Patches with many tracks and dense modulation will not fit, and the honest
//    response is to say so and point at file export, never to truncate.
// 3. **Input is hostile.** A link arrives from outside. It is decompressed under
//    a hard output cap, checksum-verified, and validated as a patch before it is
//    allowed anywhere near the editor.
// 4. **Round-trip is exact.** decode(encode(p)) is p, canonically — the same
//    fixed-point property the instance export and the two-origin migration test
//    already hold to.

import { assertPatchStudioPatch } from './patchModel.js'

/** Fragment key: `#patch=…`. */
export const PATCH_LINK_PARAM = 'patch'

/** Envelope version. Leads the payload so an unknown one is cheap to reject. */
export const PATCH_LINK_VERSION = 1

/**
 * Longest fragment we will produce.
 *
 * Not a browser limit — Chrome and Firefox accept far more. It is a *sharing*
 * limit: links get pasted into chat clients, issue trackers and email, several
 * of which wrap or truncate around a few thousand characters, and a silently
 * corrupted patch is worse than a refused one. Above this the caller is told to
 * use file export instead.
 */
export const MAX_LINK_CHARS = 8000

/**
 * Hard cap on decompressed bytes.
 *
 * Compressed input from a stranger can expand enormously — a few kB of zeros
 * becomes hundreds of megabytes. Decoding stops at this ceiling rather than
 * letting an attacker choose how much memory the tab allocates.
 */
export const MAX_DECODED_BYTES = 512 * 1024

const COMPRESSION_FORMAT = 'deflate-raw'

// ── encoding primitives ─────────────────────────────────────────────────────

/** Stable stringify, so the checksum does not depend on key insertion order. */
function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  const keys = Object.keys(value).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`
}

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Short integrity tag over the canonical patch.
 *
 * Eight hex characters, not sixty-four: this detects the truncation and
 * paste-mangling a URL actually suffers, and it is not a security boundary —
 * the checksum travels beside the data it describes, so anyone who can alter
 * one can alter the other. Validation, not the checksum, is what makes a
 * received patch safe.
 */
async function shortSum(patch) {
  return (await sha256Hex(canonical(patch))).slice(0, 8)
}

/** base64url: URL-safe alphabet, no padding. */
function toBase64Url(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text) {
  const normalised = text.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalised + '='.repeat((4 - (normalised.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function assertCompressionAvailable() {
  if (typeof CompressionStream !== 'function' || typeof DecompressionStream !== 'function') {
    throw new Error('This browser cannot compress patch links. Use Download instead.')
  }
}

async function deflate(text) {
  assertCompressionAvailable()
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream(COMPRESSION_FORMAT))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

/**
 * Inflate with a hard output ceiling.
 *
 * Reads chunk by chunk and aborts the moment the running total exceeds the cap,
 * so a decompression bomb costs one chunk rather than the whole expansion.
 */
async function inflateBounded(bytes, limit) {
  assertCompressionAvailable()
  const stream = new Blob([bytes]).stream()
    .pipeThrough(new DecompressionStream(COMPRESSION_FORMAT))
  const reader = stream.getReader()

  const chunks = []
  let total = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.length
      if (total > limit) {
        await reader.cancel()
        throw new Error('This link expands to more data than a patch may contain.')
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock?.()
  }

  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return new TextDecoder().decode(out)
}

// ── the public surface ──────────────────────────────────────────────────────

/**
 * Encode a patch export as a fragment value.
 *
 * Returns a discriminated result rather than throwing when the patch is simply
 * too big, because that is an ordinary outcome the UI must handle by offering
 * file export — not an error condition.
 *
 * @param {object} patchExport a supported Patch Studio document
 * @returns {Promise<{ ok: true, value: string, chars: number }
 *                  | { ok: false, reason: 'too-large', chars: number, limit: number }>}
 */
export async function encodePatchLink(patchExport) {
  assertPatchStudioPatch(patchExport, 'Only Patch Studio patches can be shared as a link.')

  const patch = JSON.parse(JSON.stringify(patchExport))
  const envelope = { v: PATCH_LINK_VERSION, sum: await shortSum(patch), patch }
  const compressed = await deflate(canonical(envelope))
  const value = `${PATCH_LINK_VERSION}.${toBase64Url(compressed)}`

  if (value.length > MAX_LINK_CHARS) {
    return { ok: false, reason: 'too-large', chars: value.length, limit: MAX_LINK_CHARS }
  }
  return { ok: true, value, chars: value.length }
}

/**
 * Decode a fragment value back into a patch export.
 *
 * Throws with a message fit to show a person on every rejection path. Nothing
 * here mutates state or touches storage: the caller decides what to do with the
 * result, which is what lets the UI confirm before replacing someone's work.
 *
 * @param {string} value
 * @returns {Promise<object>} the patch export
 */
export async function decodePatchLink(value) {
  if (typeof value !== 'string' || !value) throw new Error('This link carries no patch.')

  const separator = value.indexOf('.')
  if (separator === -1) throw new Error('This is not a patch link.')

  const version = Number(value.slice(0, separator))
  if (version !== PATCH_LINK_VERSION) {
    throw new Error(
      `This link was made by a newer version of BSC Lab (format ${value.slice(0, separator)}).`,
    )
  }

  // Refuse oversized input before decoding it. Cheap, and it means a hostile
  // link cannot make us allocate merely by being long.
  if (value.length > MAX_LINK_CHARS * 4) throw new Error('This patch link is too long to read.')

  let envelope
  try {
    envelope = JSON.parse(await inflateBounded(fromBase64Url(value.slice(separator + 1)), MAX_DECODED_BYTES))
  } catch (error) {
    // Preserve the bomb-guard message; everything else is indistinguishable
    // corruption from the reader's point of view.
    if (/expands to more data/.test(error.message)) throw error
    throw new Error('This patch link is damaged or incomplete.')
  }

  if (envelope?.v !== PATCH_LINK_VERSION || !envelope.patch) {
    throw new Error('This patch link is damaged or incomplete.')
  }

  const patch = envelope.patch
  assertPatchStudioPatch(patch, 'This link does not contain a Patch Studio patch.')
  if (await shortSum(patch) !== envelope.sum) {
    throw new Error('This patch link was altered or truncated in transit.')
  }

  return patch
}

/**
 * Read a patch link out of a full URL or a bare fragment.
 *
 * Accepts `#patch=…`, `?patch=…` within the fragment, and a whole URL, because
 * people paste all three. Returns null when there is nothing to read, which is
 * the common case on every ordinary page load.
 *
 * @param {string} input a URL, or `location.hash`
 * @returns {string|null} the encoded value
 */
export function readPatchLinkFrom(input) {
  if (typeof input !== 'string' || !input) return null

  let fragment = input
  const hashAt = input.indexOf('#')
  if (hashAt !== -1) fragment = input.slice(hashAt + 1)
  else if (/^[a-z]+:\/\//i.test(input)) return null

  const params = new URLSearchParams(fragment)
  return params.get(PATCH_LINK_PARAM)
}

/**
 * Build a shareable URL for a patch, or explain why there is not one.
 *
 * @param {object} patchExport
 * @param {string} baseUrl absolute URL of the Patch Studio page
 */
export async function buildPatchLink(patchExport, baseUrl) {
  const encoded = await encodePatchLink(patchExport)
  if (!encoded.ok) return encoded
  return {
    ok: true,
    url: `${baseUrl.split('#')[0]}#${PATCH_LINK_PARAM}=${encoded.value}`,
    chars: encoded.chars,
  }
}
