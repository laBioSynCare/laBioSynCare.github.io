# ontology/instances — BSC Product Instance Data

RDF instance data that uses the [`sstim`](../) ontology. Unlike the ontology
itself (reusable, under `w3id.org/sstim`), everything here is **BSC product
data** and lives under the `w3id.org/bsc/...` namespace.

See [`../README.md`](../README.md) for the namespace rule and
[`CLAUDE.md` §5.1](../../CLAUDE.md) for the enforcement policy.

---

## Intended layout

```
instances/
├── presets/      One Turtle file per preset, or grouped by Heal/Support/
│                 Perform/Indulge/Transcend. IRIs at w3id.org/bsc/preset/{id}.
│                 Source for dist/presets.json (planned — Phase 2 export).
├── references/   Public-safe bibliographic references (w3id.org/sstim/ref/…)
│                 cited from evidence chains.
└── sessions/     Recorded session instances (w3id.org/bsc/session/{uuid}).
                  Not yet created — planned with the stimulation player
                  (Phase 2).
```

## Current state

Both `presets/` and `references/` directories exist but are **empty**. No
preset or reference instances have been committed yet; the v0.9.1 catalog
is still in its original JSON form (not in this tree). Conversion to RDF
instances is the first task in Phase 2 (`TODO.md` → "Phase 2 instances").

A `sessions/` subdirectory is not created yet; it will land alongside the
session-recording code in Phase 2.

## Loading behaviour

When the `src/rdf/loader.js` pipeline lands (Phase 1), `instances/` is
loaded **after** the core ontology, into named graphs matching its
subdirectory:

- `presets/*.ttl` → graph `https://w3id.org/bsc/preset/`
- `references/*.ttl` → graph `https://w3id.org/sstim/ref/`
- `sessions/*.ttl` → graph `https://w3id.org/bsc/session/` (one per user)

Annotations never land here — they live in per-user named graphs created
at runtime by `AnnotationStore.js` (see `CLAUDE.md` §5.5).
