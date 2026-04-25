# static/ontology/instances — BSC Lab Instance Data

RDF instance data that uses the [`sstim`](../) ontology. Unlike the ontology
itself (reusable, under `w3id.org/sstim`), presets, evidence, sessions, and
annotations here are **BSC Lab implementation data** and live under the
`w3id.org/sstim/implementation/bsclab/...` namespace. The BioSynCare commercial
catalog uses the sibling `w3id.org/sstim/implementation/biosyncare/...` path.
Public-safe references live under `w3id.org/sstim/ref/...` because citations can
be reused across implementations.

See [`../README.md`](../README.md) for the namespace rule and
[`CLAUDE.md` §5.1](../../../CLAUDE.md) for the enforcement policy.

---

## Intended layout

```
instances/
├── presets/      One Turtle file per preset, or grouped by Heal/Support/
│                 Perform/Indulge/Transcend. IRIs at w3id.org/sstim/implementation/bsclab/preset/{id}.
│                 Source for dist/presets.json (planned — Phase 2 export).
├── references/   Public-safe bibliographic references (w3id.org/sstim/ref/…)
│                 cited from evidence chains.
└── sessions/     Recorded session instances (w3id.org/sstim/implementation/bsclab/session/{uuid}).
                  Not yet created — planned with the stimulation player
                  (Phase 2).
```

## Current state

The first Phase 1 seed instances are committed:

- `presets/perform-alpha-10-seed.ttl` — minimal SHACL-valid preset instance
  with one Binaural voice and one evidence link.
- `references/references.ttl` — initial public-safe bibliographic reference
  list.

The v0.9.1 catalog is still in its original JSON form (not in this tree).
Full conversion to RDF instances remains a Phase 1 ontology task
(`TODO.md` -> "Phase 1 instances").

A `sessions/` subdirectory is not created yet; it will land alongside the
session-recording code in Phase 2.

## Loading behaviour

The current `src/rdf/loader.js` pipeline loads the canonical ontology Turtle
files and the committed preset/reference instance files through an explicit
browser manifest. Instance data is loaded **after** the core ontology:

- `presets/*.ttl` → graph `https://w3id.org/sstim/implementation/bsclab/preset/`
- `references/*.ttl` → graph `https://w3id.org/sstim/ref/`
- `sessions/*.ttl` → graph `https://w3id.org/sstim/implementation/bsclab/session/` (one per user)

Annotations never land here — they live in per-user named graphs created
at runtime by `AnnotationStore.js` (see `CLAUDE.md` §5.5).
