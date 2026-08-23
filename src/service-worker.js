/// <reference types="@sveltejs/kit" />
//
// SSTIM Workbench service worker. Compiled by SvelteKit/Vite via the `$service-worker`
// virtual module. As-built spec: docs/technical/PWA_SERVICE_WORKER.md.
// Decision + rationale: docs/decisions/0009-pwa.md.
//
// This worker is networking + caching only. It runs on its own thread, never
// sees AudioContext, and does not touch the three-clock audio architecture or
// the worklet invariants (CLAUDE.md §3.1–3.3).
//
// Three binding constraints (the "traps"):
//   1. Never auto-reload / never skipWaiting on its own — an in-progress
//      stimulation session must survive a deploy. skipWaiting only happens in
//      response to a SKIP_WAITING message the page sends after a user gesture.
//   2. Never intercept cross-origin requests — Firebase auth/Firestore and
//      Google sign-in depend on going straight to the network.
//   3. Never eagerly precache the heavy assets — the ambient *.wav (~2.8 MB)
//      and the ontology *.ttl are runtime-cached on first use, not precached.

import { base, build, files, prerendered, version } from '$service-worker'
import {
  isWithinDeployment,
  serviceWorkerCachePrefix,
  staleOwnedCaches,
} from './config/serviceWorkerScope.js'

// CacheStorage is shared by every project under an origin. Include the mount in
// the owner prefix, and only retire caches carrying that exact prefix, so the
// SSTIM worker cannot delete another w3c-cg.github.io project's data.
const CACHE_PREFIX = serviceWorkerCachePrefix(base)
const CACHE = `${CACHE_PREFIX}${version}`

// Trap 3: precache only what is needed to launch and to run a session offline.
// The worklet + WASM kernel (~40 KB) is required for any session, so it is
// precached. The ambient *.wav and ontology *.ttl are NOT — they are
// runtime-cached on first use by the fetch handler below.
// Matched base-path-independently because `files` paths carry the SvelteKit
// `base` prefix, so don't anchor with `^/`.
const PRECACHE_STATIC = files.filter(
  (path) =>
    path.includes('/worklets/') ||
    path.endsWith('/favicon.svg') ||
    path.endsWith('/manifest.webmanifest'),
)

const PRECACHE = [...build, ...prerendered, ...PRECACHE_STATIC]
const PRECACHE_SET = new Set(PRECACHE)

self.addEventListener('install', (event) => {
  // Trap 1: no skipWaiting() here. The new worker installs and waits until the
  // page explicitly promotes it (see the `message` handler) or every old tab
  // closes.
  //
  // `cache: 'reload'` bypasses the browser HTTP cache so a stale entry can
  // never poison the precache (observed 2026-07-11: a months-old copy of `/`
  // ended up served cache-first for the lifetime of the worker version).
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(PRECACHE.map((path) => new Request(path, { cache: 'reload' }))),
    ),
  )
})

self.addEventListener('activate', (event) => {
  // Drop caches from previous versions; take control of open clients.
  event.waitUntil(
    (async () => {
      for (const key of staleOwnedCaches(await caches.keys(), CACHE, CACHE_PREFIX)) {
        await caches.delete(key)
      }
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('message', (event) => {
  // Trap 1: the only path to skipWaiting is an explicit page request, which the
  // update banner sends only after the user clicks "Reload".
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Only GET is cacheable.
  if (request.method !== 'GET') return

  // Don't interfere with range requests (media seeking).
  if (request.headers.has('range')) return

  const url = new URL(request.url)

  // Trap 2: never touch cross-origin requests. This single guard is the entire
  // Firebase / Google-sign-in / CDN safety mechanism — those are all
  // cross-origin, so they go straight to the network, untouched.
  if (url.origin !== self.location.origin) return

  // Project Pages shares an origin with sibling projects. Control and cache
  // only this deployment mount, never another project's same-origin requests.
  if (!isWithinDeployment(base, url.pathname)) return

  event.respondWith(respond(request, url))
})

async function respond(request, url) {
  const cache = await caches.open(CACHE)

  // Precached immutable assets (hashed build chunks, worklets, manifest,
  // favicon): cache-first — a hit is always correct. Navigations are excluded
  // even though the prerendered shells are precached: pages are
  // network-first per the spec (§3.3–3.4), so an online reload always sees
  // the current deploy; the precached shell remains the offline fallback.
  if (request.mode !== 'navigate' && PRECACHE_SET.has(url.pathname)) {
    const cached = await cache.match(request)
    if (cached) return cached
  }

  // Everything else same-origin (ontology *.ttl, ambient *.wav, icons, any
  // navigation): network-first, populate the cache on success, fall back to the
  // cache offline. Fresh when online; available offline after first fetch.
  try {
    const response = await fetch(request)
    // Cache only successful, same-origin (non-opaque) GET responses.
    if (response.ok && response.type === 'basic') {
      cache.put(request, response.clone())
    }
    return response
  } catch (err) {
    const cached = await cache.match(request)
    if (cached) return cached

    // Offline navigation with nothing cached for this route → the root shell.
    if (request.mode === 'navigate') {
      const fallback = await cache.match(`${base}/`)
      if (fallback) return fallback
    }

    throw err
  }
}
