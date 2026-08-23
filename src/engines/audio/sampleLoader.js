// Shared loader for the Sample audio track's ambient clips. Files live in
// static/audio/ and are served same-origin (so they pass COEP if it is ever
// enabled). Decoded AudioBuffers are cached per engine instance via a Map the
// caller owns, keyed by URL; the cache stores the in-flight promise so repeated
// requests for the same clip decode only once.

import { applicationAsset } from '../../config/applicationUrls.js'

export const SAMPLE_BASE = '/audio/'

export function sampleUrl(id) {
  return `${SAMPLE_BASE}${encodeURIComponent(id || 'rain')}.wav`
}

export async function decodeSample(ctx, url) {
  const resp = await fetch(applicationAsset(url))
  if (!resp.ok) throw new Error(`Sample "${url}" failed to load (${resp.status})`)
  const bytes = await resp.arrayBuffer()
  return await ctx.decodeAudioData(bytes)
}

export function loadSample(ctx, cache, url) {
  let p = cache.get(url)
  if (!p) {
    p = decodeSample(ctx, url)
    cache.set(url, p)
  }
  return p
}
