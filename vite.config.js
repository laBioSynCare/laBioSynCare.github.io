import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [sveltekit()],

  // Vite loads `.env` from the project root in every mode, so unsetting
  // VITE_FIREBASE_* in the shell is not enough to produce a genuinely
  // unconfigured build — a developer's local .env still gets inlined.
  // `make smoke-static` points this at an empty directory to build the app
  // exactly as a third party without credentials would. Never set it by hand;
  // leaving it unset keeps the normal root-.env behaviour.
  envDir: process.env.BSC_ENV_DIR || undefined,

  // SvelteKit sets publicDir automatically; explicit override is not needed.
  // static/ is served at the root in both dev and production (dist/).
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

  test: {
    // Several suites run real SHACL validation over the parsed ontology modules,
    // which takes 1–2 s alone and has been observed above 5 s when the rest of
    // the suite competes for CPU. Those are slow correct runs, not hangs, and
    // against Vitest's 5 s default they surface as an intermittent "timed out"
    // that says nothing about the ontology — and, worse, moves between files, so
    // raising it per-test just relocates the flake.
    testTimeout: 30_000,
  },
})
