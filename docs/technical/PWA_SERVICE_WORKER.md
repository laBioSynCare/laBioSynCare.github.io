# PWA & Service Worker

> **For AI agents:** This document describes the **as-built** Progressive Web
> App layer of BSC Lab: the web app manifest, the service worker, its caching
> strategy, and the session-safe update flow. It is the source of truth for
> anything that touches installability or offline behaviour. The decision and
> its rationale are in [`../decisions/0009-pwa.md`](../decisions/0009-pwa.md);
> this document specifies *how the code works*. If code and this document
> disagree, the code wins and this document must be corrected.

The canonical implementation is:

- [`../../src/service-worker.js`](../../src/service-worker.js) — the worker.
- [`../../static/manifest.webmanifest`](../../static/manifest.webmanifest) — the manifest.
- [`../../src/ui/pwa/ServiceWorkerUpdate.svelte`](../../src/ui/pwa/ServiceWorkerUpdate.svelte)
  — registration (production only) + the update banner.
- [`../../src/routes/+layout.svelte`](../../src/routes/+layout.svelte) — mounts the banner.
- [`../../src/app.html`](../../src/app.html) — manifest link, `theme-color`, apple-touch-icon.
- [`../../svelte.config.js`](../../svelte.config.js) — `serviceWorker.register = false`.

This layer is **independent of the audio engine**. A service worker runs on its
own thread, never sees `AudioContext`, and intercepts only network requests. It
cannot and does not affect the three-clock audio architecture or the worklet
invariants (`CLAUDE.md` §3.1–3.3). Treat any change here as a *networking and
caching* change, nothing more.

---

## 1. Why this is small

BSC Lab is already a client-only static app served from GitHub Pages
(`CLAUDE.md` §2), built with `@sveltejs/adapter-static`. The output in `dist/`
is exactly what a service worker precaches well, and the app is served from the
**root** of `labiosyncare.github.io`, so the service-worker scope is a clean `/`
with no base-path juggling. Making it installable and offline-capable is an
afternoon of work. The care goes entirely into the three traps in §4.

---

## 2. The manifest

[`../../static/manifest.webmanifest`](../../static/manifest.webmanifest) is a
plain static asset (served same-origin, like the ontology Turtle). Key fields:

| Field | Value | Why |
|---|---|---|
| `id`, `start_url`, `scope` | `/` | Root-hosted; one app, one scope. |
| `display` | `standalone` | Launches without browser chrome. |
| `theme_color` / `background_color` | paper-skin `#f7f3ea` | Matches the default skin set pre-paint in `app.html`. |
| `icons` | 192, 512, 512 `maskable`, + `favicon.svg` `any` | Installability + adaptive icon shapes. |

The PNG icons live in [`../../static/icons/`](../../static/icons/) and are
rasterised from two source SVGs in that directory (`icon.svg`, the brand mark on
a transparent field for `purpose: any`; `icon-maskable.svg`, full-bleed dark
field with the mark inside the safe zone for `purpose: maskable`). Regenerate
them with `rsvg-convert` (see the comment block at the top of `icon.svg`).

`app.html` carries the three head tags the manifest cannot supply itself:

```html
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#f7f3ea" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />
```

> **Known limitation — static `theme_color`.** The manifest and the
> `theme-color` meta are static (paper). The app ships five skins, including
> dark ones; the OS/browser chrome colour will not follow a non-default skin.
> Making `theme-color` track the active skin (update the meta from
> `src/ui/theme/skins.js`) is a deliberate future enhancement, not a bug.

---

## 3. The service worker

[`../../src/service-worker.js`](../../src/service-worker.js) is compiled by
SvelteKit/Vite through the virtual `$service-worker` module, which exposes:

- `build` — the app's hashed JS/CSS chunks (immutable per build).
- `files` — **everything** in `static/` (worklets, WASM, ambient `.wav`,
  ontology `.ttl`, icons, `_headers`, `.nojekyll`, …).
- `prerendered` — the prerendered route shells (every route; the root layout
  sets `prerender = true`).
- `version` — a unique build id, used as the cache name.

### 3.1 Lifecycle

```
install   → precache the launch+session set; do NOT skipWaiting
activate  → delete caches from other versions; clients.claim()
message   → on { type: 'SKIP_WAITING' } → self.skipWaiting()
fetch     → see §3.3
```

The deliberate omission is `skipWaiting()` in `install`. The new worker installs
and **waits**. It activates only when every old tab is gone *or* when the page
explicitly posts `SKIP_WAITING` (§5). This is Trap 1's enforcement point.

### 3.2 The precache set (Trap 3)

One versioned cache, `bsc-lab-${version}`. Precached on install:

- `build` — the app's own hashed chunks. This **includes** the lazily-imported
  Comunica (~500 KB) and Cytoscape chunks, so SPARQL and the graph view work
  offline. They are cached in the background after first load, *not* added to
  the startup download, so the lazy-load goal of `CLAUDE.md` §9 (keep them off
  the startup path) still holds.
- `prerendered` — the route shells, so navigation works offline.
- the worklet + WASM kernel and the manifest/favicon — filtered out of `files`
  by prefix:

```js
const PRECACHE_STATIC = files.filter(
  (f) =>
    f.startsWith('/worklets/') ||
    f === '/favicon.svg' ||
    f === '/manifest.webmanifest',
)
```

**Explicitly NOT precached:** `static/audio/*.wav` (~2.8 MB) and
`static/ontology/*.ttl` (~140 KB). They are runtime-cached on first use (§3.3).
The worklet + WASM total ~40 KB and are required for any session, so they *are*
precached — the asymmetry is the whole point of Trap 3.

### 3.3 The fetch handler (Trap 2)

The handler is conservative by construction. It calls `respondWith` **only** for
requests it owns:

```
if method !== 'GET'                         → ignore (let the network handle it)
if request has a Range header               → ignore (don't break media seeking)
if url.origin !== self.location.origin      → ignore  ← Trap 2: Firebase, Google
                                                          sign-in, any CDN, never
                                                          touched by the worker
otherwise → respondWith(strategy(request))
```

Because every Firebase/Firestore/`identitytoolkit`/`accounts.google.com` request
is cross-origin, the single `origin !== self.location.origin` guard is the entire
Firebase-safety mechanism. There is no allowlist to maintain.

Same-origin `GET` strategy:

- **Precached immutable assets** (path is in the precache set) → **cache-first**.
  They are content-hashed or versioned, so a cache hit is always correct.
- **Everything else same-origin** (prerendered navigations, `.ttl`, `.wav`,
  icons) → **network-first, fall back to cache**, and populate the cache on a
  successful, non-opaque (`response.type === 'basic'`) `GET`. Fresh when online;
  available offline after first fetch; never caches an opaque cross-origin
  response (those are already bypassed anyway).
- Offline navigation with no cached match falls back to the cached root shell.

### 3.4 Why network-first for pages

Cache-first navigations are faster on repeat loads but serve a stale shell after
a deploy and interact badly with the update model. Network-first keeps content
fresh when online and still works offline. Repeat-load speed is recovered by the
precached `build` chunks (cache-first), which are the bulk of the bytes.

---

## 4. The three traps, restated as rules

These are binding. They come from [`0009-pwa.md`](../decisions/0009-pwa.md).

1. **Never auto-reload.** No code path may call `location.reload()` as an
   automatic consequence of an update. An in-progress stimulation session (audio
   + breathing + visual/haptic) must survive a deploy. Reload happens only on an
   explicit user gesture in the update banner. The worker never calls
   `skipWaiting()` except in response to a `SKIP_WAITING` message that the page
   sends *after* that gesture.

2. **Never intercept cross-origin.** The `fetch` handler must keep the
   `url.origin !== self.location.origin` early return. Firebase auth/Firestore
   and Google sign-in depend on it. Do not add cross-origin caching "to speed
   things up" — it breaks auth.

3. **Never eagerly precache the heavy assets.** `static/audio/*.wav` and
   `static/ontology/*.ttl` are runtime-cached, not precached. Do not precache the
   whole `files` array. The worklet/WASM kernel is the only large-ish static
   group that *is* precached, because a session cannot start without it.

---

## 5. Session-safe update flow (Trap 1)

[`../../src/ui/pwa/ServiceWorkerUpdate.svelte`](../../src/ui/pwa/ServiceWorkerUpdate.svelte)
owns both registration and the update prompt. It is Svelte 5 runes (`$state`,
`onclick`) — no Svelte 4 syntax (`CLAUDE.md` §9).

1. **Registration (production only).** On mount, if `!dev` and
   `'serviceWorker' in navigator`, it registers `/service-worker.js`. SvelteKit's
   automatic registration is turned off in `svelte.config.js`
   (`kit.serviceWorker.register = false`) so the worker never runs under
   `make dev`, where a precaching worker would serve stale assets and fight HMR.
   SvelteKit still *compiles* `src/service-worker.js` into the build regardless
   of that flag.

2. **Detecting a ready update.** It watches the registration for a `waiting`
   worker (present immediately if one was downloaded on a previous visit) and for
   `updatefound` → the installing worker reaching `installed` while a controller
   already exists. Either path sets `updateReady = true`.

3. **The banner.** A small, dismissible, `role="status"` strip: *"A new version
   of BSC Lab is ready."* with **Reload** and **Later**. Copy is neutral — no
   medical/health claims (`CLAUDE.md` §3.5). It does not steal focus and never
   blocks the session.

4. **Applying.** **Reload** posts `{ type: 'SKIP_WAITING' }` to the waiting
   worker. The worker calls `self.skipWaiting()` → activates → fires
   `controllerchange`, on which the page reloads exactly once (guarded against
   the double-reload that `controllerchange` can otherwise cause). **Later**
   dismisses the banner; the update applies on the next natural reload or when
   all tabs close.

> **Future enhancement — suppress the banner during playback.** Today the banner
> may appear while a session is playing; it is passive and the user controls the
> reload, so a session is never interrupted. Once a global "is a session
> playing" signal exists (the planned `core/` orchestrator — `CLAUDE.md` §6),
> the banner can additionally defer *appearing* until playback stops. The
> current behaviour is already session-safe; this is polish.

---

## 6. What this does NOT change

- **Hosting.** Still GitHub Pages, still static. No backend, no headers added.
- **COOP/COEP / `SharedArrayBuffer`.** Still blocked on Pages (`CLAUDE.md` §9).
  This layer deliberately does **not** use the COEP-injecting service-worker
  trick, because `COEP: require-corp` would break Firebase (Trap 2). See
  [`0009-pwa.md`](../decisions/0009-pwa.md) "Alternatives".
- **Audio timing.** No interaction with `AudioContext` or the worklets. The
  worklet files in `static/worklets/` are still loaded by URL and never bundled
  (`CLAUDE.md` §3.2); the service worker simply precaches copies of them.

---

## 7. Verifying

A production build is required — the worker is registered only when `!dev`:

```bash
make build && make preview      # http://127.0.0.1:4174/
```

Then, in the browser devtools:

- **Application → Manifest** — installable, icons resolve, no errors.
- **Application → Service Workers** — `bsc-lab-${version}` activates; on a
  rebuilt deploy a new worker appears as *waiting* (not auto-activated).
- **Application → Cache Storage** — after a session and a browse, `/worklets/*`
  is present from install; `/audio/*.wav` and `/ontology/*.ttl` appear only
  after they were used.
- **Network, offline** — reload works; a previously-run session still plays.
- **Firebase** — with credentials configured, sign-in still works (the worker
  never intercepts it).
- **Update** — rebuild, reload once to register the new worker, confirm the
  banner appears and that **Reload** (not any automatic action) performs the
  single reload.
