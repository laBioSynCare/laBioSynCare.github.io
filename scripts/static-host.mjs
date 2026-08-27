// Serve a built dist/ the way a static host does, at a configurable mount.
//
// Extracted from smoke-static.mjs so the browser checks exercise exactly the
// same serving rules the deployment smoke test asserts against. Sharing this
// matters more than the thirty lines it saves: the mount is where the bugs are.
// A root-absolute URL that escapes `/sstim` looks fine at the origin root and
// breaks in production, which is precisely the class of defect these checks
// exist to catch, so both tools must model the mount identically.
//
// Deliberately plain: no SPA rewrite, no fallback. If a route only works
// because everything returns index.html, that is not a static deployment.

import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

export const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.ttl': 'text/turtle', '.svg': 'image/svg+xml',
  '.jsonld': 'application/ld+json', '.rdf': 'application/rdf+xml',
  '.owl': 'application/rdf+xml',
  '.png': 'image/png', '.wav': 'audio/wav', '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json',
}

/**
 * Start a static host for `dist` at `mount`, listening on `port`.
 *
 * `mount` is a normalized deployment base: '' for origin-root hosting, or a
 * leading-slash path with no trailing slash. Anything outside it 404s, which is
 * what makes an escaped root-absolute URL visible instead of silently working.
 */
export function serveDist(dist, mount, port) {
  return new Promise((resolve) => {
    const server = createServer(async (req, response) => {
      const url = new URL(req.url, 'http://localhost')
      let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '')
      if (mount && path !== mount && !path.startsWith(`${mount}/`)) {
        response.writeHead(404).end('outside deployment mount')
        return
      }
      if (mount) path = path.slice(mount.length) || '/'
      let file = join(dist, path)
      try {
        if ((await stat(file)).isDirectory()) file = join(file, 'index.html')
      } catch {
        response.writeHead(404).end('not found')
        return
      }
      try {
        const body = await readFile(file)
        response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
        response.end(body)
      } catch {
        response.writeHead(404).end('not found')
      }
    })
    server.listen(port, '127.0.0.1', () => resolve(server))
  })
}
