# static/ontology/instances — BSC Lab Instance Data

RDF instance data that uses the [`sstim`](../) ontology. Unlike the ontology
itself (reusable, under `w3id.org/sstim`), presets, evidence, sessions, and
annotations here are **BSC Lab implementation data** and live under the
`w3id.org/sstim/implementation/bsclab/...` namespace. The BioSynCare commercial
catalog is private and is not converted or loaded here; the sibling
`w3id.org/sstim/implementation/biosyncare/...` path is reserved only for
public-safe BioSynCare implementation metadata if it is ever published.
Public-safe references live under `w3id.org/sstim/ref/...` because citations can
be reused across implementations.

See [`../README.md`](../README.md) for the namespace rule and
[`CLAUDE.md` §5.1](../../../CLAUDE.md) for the enforcement policy.

---

## Intended layout

```
instances/
├── frameworks/   Framework identity records (w3id.org/sstim/framework/{id}).
├── implementations/
│                 Implementation identity records
│                 (w3id.org/sstim/implementation/{id}).
├── presets/      One Turtle file per preset, or grouped by Heal/Support/
│                 Perform/Indulge/Transcend. IRIs at w3id.org/sstim/implementation/bsclab/preset/{id}.
│                 Public BSC Lab seed/reference presets only.
├── evidence/     Technique- and preset-level sstim:EvidenceClaim individuals
│                 (w3id.org/sstim/implementation/bsclab/evidence/{id}).
├── references/   Public-safe bibliographic references (w3id.org/sstim/ref/…)
│                 cited from evidence chains.
└── sessions/     Recorded session instances (w3id.org/sstim/implementation/bsclab/session/{uuid}).
                  Not yet created — planned with the stimulation player
                  (Phase 2).
```

## Current state

The first Phase 1 seed instances are committed:

- `frameworks/bsc.ttl` — BSC framework identity record.
- `implementations/implementations.ttl` — BSC Lab and BioSynCare implementation
  identity records.
- `presets/perform-alpha-10-seed.ttl` — minimal SHACL-valid preset instance
  with one Binaural voice and one evidence link.
- `evidence/technique-evidence.ttl` — technique-level evidence claims (ASSR/FFR
  measurable responses, the mixed binaural-beat outcome, and the explicit
  chromotherapy / Solfeggio / 432 Hz negative assertions), migrated from vocab
  prose into queryable `sstim:EvidenceClaim` individuals (IMPROVEMENT_PLAN P5.4).
- `references/references.ttl` — public-safe bibliographic references
  (INGENDOH_2023, PICTON_2003, SKOE_KRAUS_2010; each venue Crossref-audited).

The private BioSynCare/BSC v0.9.1 catalog is not in this tree and will not be
converted to RDF for BSC Lab. Future files in `presets/` should be explicit,
public BSC Lab seed/reference presets only.

A `sessions/` subdirectory is not created yet; it will land alongside the
session-recording code in Phase 2.

## Loading behaviour

The current `src/rdf/loader.js` pipeline loads the canonical ontology Turtle
files and the committed preset/reference instance files through an explicit
browser manifest. Instance data is loaded **after** the core ontology:

- `frameworks/*.ttl` → graph `https://w3id.org/sstim/graph/frameworks`
- `implementations/*.ttl` → graph `https://w3id.org/sstim/graph/implementations`
- `presets/*.ttl` → graph `https://w3id.org/sstim/implementation/bsclab/preset/`
- `evidence/*.ttl` → graph `https://w3id.org/sstim/implementation/bsclab/evidence/`
- `references/*.ttl` → graph `https://w3id.org/sstim/ref/`
- `sessions/*.ttl` → graph `https://w3id.org/sstim/implementation/bsclab/session/` (one per user)

Annotations never land here — they live in per-user named graphs created
at runtime by `AnnotationStore.js` (see `CLAUDE.md` §5.5).
