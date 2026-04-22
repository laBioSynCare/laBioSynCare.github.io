import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [sveltekit()],

  // SvelteKit sets publicDir automatically; explicit override is not needed.
  // public/ is served at the root in both dev and production (dist/).
  // Ontology .ttl files placed in static/ontology/ are served same-origin,
  // satisfying COEP (require-corp). See CLAUDE.md §9 and src/README.md.

  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },

  build: {
    target: 'es2022',
  },
})
