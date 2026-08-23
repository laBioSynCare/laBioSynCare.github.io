# ADR 0040 — A patch is a first-class SSTIM object

**Status:** **Superseded by [ADR 0041](0041-stimulus-description-layers-and-the-canonical-schema-gap.md)** — 2026-07-31

> This ADR was accepted and implemented on 2026-07-31 (commit `002201c`) and
> superseded the same day. It is kept unedited below as the record of what was
> decided and why it did not hold.
>
> **What was wrong.** A SHACL failure was treated as a modelling requirement:
> `sstim:Patch` was minted in the reusable `sstim:` term space to make a Patch
> Studio projection validate, without first asking whether an engine-specific
> serialisation belongs in a shared ontology at all (`CLAUDE.md` §5.1). The
> justification for keeping `Patch` and `Preset` distinct changed three times
> under review — none of the three, including the one written below, was the
> real reason. The claim that a preset is "audio-only" is also false: it is true
> of the current BSC catalog format, not of presets.
>
> ADR 0041 withdraws `sstim:Patch`, redefines `sstim:Preset` as the
> engine-dependent layer it actually is, and records the two things SSTIM does
> not have: an engine-independent stimulus description, and a canonical schema.

Adds `sstim:Patch` and `sstim:Track` (with four disjoint subtypes) to the
ontology, and widens twenty-three parameter domains to admit them. Resolves
findings **S1**, **S2** and **V1**, recorded in
[`../technical/SESSION_PACKAGE.md`](../technical/SESSION_PACKAGE.md) when the
session package was built.

## Context

Building the portable session package required projecting a Patch Studio patch
into RDF. Every available typing failed, and the failures were verified with
pyshacl rather than assumed:

```
Focus Node: ex:probe
Message:    SessionSpecification must reference exactly one Preset.

Focus Node: ex:probe-voice-1
Message:    Voice must be typed as exactly one of the four subtypes:
            Binaural, Martigli, Martigli-Binaural, or Symmetry.
```

**Both constraints are correct.** A `sstim:SessionSpecification` is the execution
of a catalog preset ([ADR 0014](0014-preset-is-not-a-protocol.md)); a patch
executes none. A `sstim:Voice` is one of four catalog voice types
([ADR 0006](0006-one-class-per-technique.md)); a patch's `Carrier`, `Noise`,
`Drone`, `Sample`, nine visual types and `Vibration` are none of them.

A third divergence, **V1**: `rotationSpeed`, `visualSideCount`, `visualDensity`,
`stimulationIntensity` and `hapticPattern` all had `rdfs:domain
sstim:SessionSpecification`, implying one visual and one haptic configuration per
session, while a patch may carry nine visual tracks.

The interim projection emitted an untyped `prov:Entity` carrying real SSTIM
properties. That was honest but weak: the object validated because **no shape
applied to it**, which is not the same as being correct.

The diagnosis was not that the projection was badly written. It was that
**SSTIM described the catalog and had no vocabulary for the authoring model** —
even though `sstim-patch-studio.ttl` had carried its 27 parameter properties
since 0.6.0. The parameters existed; the things that bear them did not.

## Decision

### 1. `sstim:Patch` — sibling of `Preset`, not subclass

```turtle
sstim:Patch a owl:Class ;
    rdfs:subClassOf iao:0000030, prov:Plan .
```

An information content entity and a `prov:Plan`, exactly as
`SessionSpecification` is. **Sibling of `Preset` rather than subclass**: a preset
is a curated catalog entry carrying evidence grounding, safety metadata and
multilingual content, none of which a patch asserts. Making `Patch` a subclass
would inherit obligations a patch cannot meet, and every SHACL shape written for
presets would begin failing on authoring objects.

### 2. `sstim:Track` — parallel to `Voice`, not above or below it

```turtle
sstim:Track ⊒ sstim:AudioTrack, sstim:VisualTrack, sstim:HapticTrack, sstim:ControlTrack
```

The four subtypes are declared `owl:AllDisjointClasses`, mirroring what the four
voice subtypes already carry.

`Track` is deliberately **not** a superclass of `Voice`, tempting as that looks —
a voice is, after all, an audio layer. Three reasons against:

1. `Voice` carries catalog semantics (1–6 per preset, exactly four technique
   types) that do not generalise to a `VisualTrack`.
2. Subsuming `Voice` would change the meaning of existing catalog data to settle
   a convenience in new code.
3. The models are genuinely parallel, not nested. A `ControlTrack` produces no
   sensory output at all, which no voice does.

`sstim:composedOfTrack` links a patch to its tracks, the counterpart of
`sstim:composedOf` for presets and voices.

### 3. Twenty-three domains widened to unions

```turtle
sstim:initialVolume  rdfs:domain [ owl:unionOf ( sstim:Voice sstim:AudioTrack ) ] .
sstim:rotationSpeed  rdfs:domain [ owl:unionOf ( sstim:SessionSpecification sstim:VisualTrack ) ] .
sstim:durationSeconds rdfs:domain [ owl:unionOf ( sstim:SessionSpecification sstim:Patch ) ] .
```

**Backward-compatible by construction.** `rdfs:domain` is an inference rule, not
a constraint: widening to a union *weakens* the entailment, so every existing
assertion stays valid and no catalog data changes meaning. What it stops is the
false entailment that a patch is a `SessionSpecification` — which is exactly what
S1 denies.

Two of the twenty-three (`durationSeconds`, `masterVolume`) live in
`sstim-core.ttl`; the rest in `sstim-patch-studio.ttl`.

### 4. A patch must not also be a session specification

```turtle
sstim-sh:PatchShape sh:not [ sh:class sstim:SessionSpecification ] .
```

Asserting both would describe an object that simultaneously does and does not
execute a catalog preset. Since `Patch` and `SessionSpecification` are not
declared `owl:disjointWith` — they share a genus and a future subclass might
legitimately relate them — SHACL is where this is enforced.

### 5. Patch shapes are deliberately lighter than preset shapes

`PatchShape` requires a label, one `dct:created`, a plausible duration and
well-formed tracks. It requires **no** evidence tier, no `dct:description`, no
multilingual copy, no safety metadata.

That asymmetry is the point. A patch is an authoring object exchanged between
instances; a preset is a curated catalog entry. Requiring catalog metadata of
every patch would either make every real patch invalid or invite fabricating the
metadata to pass validation — and fabricated evidence metadata is the specific
failure [ADR 0018](0018-evidence-integrity-and-public-claim-governance.md) and
[ADR 0026](0026-patch-studio-catalog-bridge.md) exist to prevent.

Where a limit is a *safety* rule rather than a curation rule, it is enforced:
breathing-control periods must be ≥ 3.0 s (below that it is tremolo, not
breathing guidance — `CLAUDE.md` §4.5) and pulse rates ≤ 50 Hz (§4.7).

## Consequences

**Gained.** A patch is now a properly typed, SHACL-validated SSTIM object.
Session packages carry real RDF that a third party can query and cite. The
authoring model has vocabulary, so future work — modulation links, tempo sync,
envelopes — has somewhere to attach.

**Given up.** Two protected files changed (`sstim-core.ttl`,
`sstim-patch-studio.ttl`) plus `sstim-shapes.ttl`, under explicit maintainer
instruction in session, per `CLAUDE.md` §3.4.

**Not done — deliberately.** The ontology version stays **0.11.0**. `make
validate` requires identical `owl:versionInfo` across every module, so a bump
touches all of them, and the release gate additionally cross-checks status,
history text, version DOI and citation — with a Zenodo DOI that has to be
reserved by a human. **Cutting 0.12.0 is a maintainer action**, not something to
smuggle into a feature commit. Until then the live modules are ahead of the last
snapshot, which is the normal between-release state
([ADR 0020](0020-whole-set-snapshot-versioning.md)).

**Still open.** Modulation links (`Track` → `ControlTrack` with an amount),
tempo-sync relations and isochronic envelope shapes have no SSTIM representation
and remain in the mapping report's unmapped list. `cutoff`, `resonance`,
`detune`, `opacity`, `scale` and `hue` have no property at all.

**What this does not change.** RDF validity is not scientific warrant. A patch
that validates asserts what it *is*, never that it does anything. Evidence tier,
intended outcome and safety metadata are still authored by a human through the
gated bridge in ADR 0026, and are never inferred from signal parameters.

## Alternatives considered

**Type patches as `SessionSpecification` and relax the shape.** Rejected: it
would delete the requirement that a session references a preset, which is the
constraint making a session reproducible. Weakening the catalog model to
accommodate the authoring model is the wrong direction.

**Mint the classes under `bsclab:`.** Forbidden by `CLAUDE.md` §5.1 — OWL classes
never live under an implementation path — and wrong regardless: a patch is not a
BSC Lab-specific idea, and any SSTIM implementation with a live authoring model
needs the same vocabulary.

**Fabricate a placeholder `Preset` per patch.** Rejected outright. It would
populate the catalog with objects nobody curated, carrying no evidence and no
review, purely to satisfy a shape. That is the failure mode ADR 0018 exists to
prevent.

**Leave the projection untyped.** The status quo. Honest, and what shipped
initially, but it makes the RDF unqueryable by type and validating only because
nothing applies to it — a weaker claim than it appears.
