# ADR 0041 — Four description layers, and the two things SSTIM does not yet have

**Status:** Accepted — 2026-07-31 · implemented and released in SSTIM 0.12.0 · **Supersedes [ADR 0040](0040-patch-studio-native-session-and-track-classes.md)**

Written as a proposal; **accepted and implemented in SSTIM 0.12.0** (tag
`v0.12.0`). The decisions below are in force. Two questions the text left open
were settled during implementation and are marked inline: `sstim:Track` survives,
and the layer-1 class is named `sstim:StimulusSpecification`
([ADR 0042](0042-stimulus-specification.md)).

## Context

[ADR 0040](0040-patch-studio-native-session-and-track-classes.md) added
`sstim:Patch`, `sstim:Track` and four track subtypes to the reusable term space,
to make a Patch Studio projection pass SHACL. The reasoning offered for keeping
`Patch` and `Preset` distinct changed three times under questioning, which is
itself the diagnosis: **a SHACL failure was treated as a modelling requirement.**

Two objections during review, both correct:

**A preset is engine-dependent by nature.** It is the saved state of one engine's
parameters. Two engines producing acoustically identical stimulation have
unrelated presets; two research groups will have unrelated schemas. So
`sstim:Preset` — as currently defined, with `fl`, `fr`, `d`, `nnotes` and four
voice types — is not a general concept. It is the BSC catalog schema wearing a
general name in the namespace reserved for "the reusable, citable scientific
artifact" (`CLAUDE.md` §5.1). `sstim:Patch` repeated that error.

**"A preset is audio-only" was asserted and is false.** True of the current BSC
catalog format only. `sstim:Preset`'s own definition says it specifies "audio
architecture", which contradicts `sstim-ex:StimulusChannel` in the same ontology
("audio, visual, haptic, respiratory, olfactory, gustatory, or electromagnetic")
and the visual/cross-modal work in
[ADR 0011](0011-sensory-field-and-flash-safety.md) and
[ADR 0015](0015-visual-and-cross-modal-techniques.md). Because the restriction is
incidental it cannot be load-bearing for any class distinction, and it was used
as if it were.

## Decision

### 1. Four layers, distinguished by what varies

| Layer | What it is | Status |
|---|---|---|
| **0. The stimulation** | The process itself — energy applied with design intent | `sstim:Stimulation` ⊑ `bfo:0000015`. **Exists** |
| **1. The stimulus description** | What reaches the subject, in physical/perceptual units, independent of any engine | **Absent — gap A** |
| **2. The engine configuration** | Parameters that make *some* engine produce it | `sstim:Preset`, engine-dependent by definition. **Exists, misdefined** |
| **3. The execution** | A configuration plus the liberties a session takes | `sstim:SessionSpecification`. **Exists, under-specified** |

The layer that matters scientifically is **1**, and it is the one SSTIM lacks.

### 2. Layer 2 keeps one class; schemas become profiles

`sstim:Preset` is redefined honestly as *a saved parameter configuration for a
particular engine or design*, with no commitment to modality, to audio, or to a
field list. The BSC catalog format and `patch-studio-model-1` become **conformance
profiles** — documentation plus SHACL shapes — not OWL classes.

`sstim:Patch` is **withdrawn**: it named an engine-specific serialisation in a
shared term space. **`sstim:Track` survives** — settled during implementation:
any multi-layer configuration has layers whatever it calls them, and both BSC
schemas have them. `sstim:Voice` is additionally asserted below
`sstim:AudioTrack`, which ADR 0040 declined and which became clean once the Patch
Studio control tracks were renamed (§7), since no single name then covered both
an audible layer and a silent one.

This satisfies `CLAUDE.md` §5.1 in both directions: no implementation schema
becomes an OWL class, and no class is declared under an implementation path.

### 3. Gap A — is an engine-independent stimulus description possible?

The review asked for this to be settled rather than deferred. **Partly yes, and
the boundary is precise.** Three regimes, and they behave differently:

**Determinate.** The stimulus is fully fixed in advance — a 10 Hz binaural beat
from 200/210 Hz carriers at a stated level for a stated duration. A canonical
description is possible and complete. The move that makes it engine-independent
is stating **stimulus properties rather than engine controls**: `65 dB SPL at the
ear`, not `gain: 0.5`; `sinusoidal`, not `waveformL: 0`. Any engine reproducing
those properties reproduces the stimulation.

**Stochastic.** Pink noise, permutation-derived sequences, randomised phase. Two
renderings differ sample by sample and are *the same stimulation*. Identity is
therefore not at the waveform level: the description specifies the **generating
process and its parameters**, and a particular realisation is an instance of it.
Possible, with the description shifted one level up.

**Adaptive / closed-loop.** Neurofeedback and biofeedback, which SSTIM already
covers ([ADR 0035](0035-participant-engagement-mode-and-endogenous-self-regulation.md),
[ADR 0036](0036-neurostimulation-neuromodulation-senses-and-self-directed-split.md)).
The stimulus depends on the subject's measured state, so **no static description
of it exists, in principle**. What is describable is the **control law** — its
inputs, its mapping, its bounds. This is a genuine limit, not a missing feature:
for this regime the canonical object is a rule, not a stimulus.

**Why the waveform is not the answer.** A rendered signal is engine-independent
but useless as a description: not parametric, not queryable, not generalisable —
you cannot ask a WAV file its beat frequency without analysis — and it fails
outright for both the stochastic and adaptive regimes. Extensional adequacy and
descriptive adequacy are different properties, and only the second is wanted.

**Name — settled as `sstim:StimulusSpecification`** ([ADR 0042](0042-stimulus-specification.md)), for the
stimulus as delivered, in physical/perceptual units. Alternatives considered:
`StimulusProfile` (collides with `sstim-ex:ExposureProfile`),
`StimulationDescription` (vague about *which* layer), `StimulusForm`. Naming
matters here precisely because "preset" and "patch" already leaked engine
vocabulary into a shared ontology; this term must not.

### 4. Gap B — a canonical schema, and how it relates to A

Gap B is a *shared serialisation for layer 2*: a schema several implementations
could agree on, so a configuration moves between engines of comparable capability.
That is achievable by agreement, the way MIDI was.

**The relationship is worth stating:** given A, B is largely derivable — a
canonical preset schema becomes a serialisation of the stimulus specification
plus engine-specific extensions. Pursued without A, B is only another vendor
format hoping to win.

**No such framework appears to exist.** Surveyed:

| | Why it is not this |
|---|---|
| **HED** | Annotates events *that occurred*, for analysis; does not specify what to produce. Closest neighbour, and complementary — HED should be *generated from* a canonical description ([ADR 0025](0025-hed-bids-interoperability-crosswalk.md)) |
| **BIDS** | Organises files and metadata; points at stimulus files, no parameter model |
| **ADM** (ITU-R BS.2076) | Audio objects, broadcast-oriented, audio-only |
| **MPEG-4 Structured Audio** | Engine-independent synthesis description; audio-only, effectively dead |
| **SMIL** | Multimodal presentation timing, not stimulus parameters |
| **PsychoPy / Psychtoolbox** | De-facto experiment vocabularies; implementations, not standards |

The unoccupied cell is **engine-independent, multimodal, and generative** —
sufficient to reproduce the stimulation rather than merely record that it
happened.

> ⚠️ **Verify before publishing this claim.** The survey above is from working
> knowledge, not a systematic literature review. "No standard exists" is exactly
> the kind of statement that is embarrassing when wrong, and it is load-bearing
> for any funding argument built on it.

### 5. The subject axis admits non-humans, objects, and nothing at all

SSTIM has **no class for who or what is stimulated** — only
`sstim:ParticipantEngagementMode`, which is a facet of an absent thing. The
target axis must admit:

- humans;
- non-human animals;
- plants;
- objects and materials;
- **unoccupied space** — a stimulation may be characterised as present in an
  environment with no subject at all.

The last case means the relation is **optional**, and that the range is not a
single kind: organisms and objects are `bfo:0000040` material entities, a room or
region is a `bfo:0000029` site. A stimulation with no target is well-formed.

This is a scope statement, not only a modelling one: it extends what SSTIM claims
to cover, and `docs/concept/SCOPE.md` should say so deliberately rather than
acquire it by implication.

### 6. A small core, with adjunctive modules

The organising principle, to be applied when the above lands:

**Core** carries only what every sensory-stimulation description needs: the
stimulation process, the stimulus specification, the target axis, time, and the
identity/versioning apparatus. It should be small enough to read in one sitting
and stable enough to cite.

**Adjunctive modules** carry everything else — exposure and delivery, evidence
and claims, techniques and vocabulary, engine-configuration profiles, ecosystem
records — each depending on core and none required by it.

Measured against this, `sstim-core.ttl` is currently too large: it holds the
catalog model (`Preset`, `Voice`, `PresetGroup`), evidence machinery, and
technique classes, none of which every description needs. Splitting it is
separate work with real cost (IRIs must not move — [ADR 0020](0020-whole-set-snapshot-versioning.md)),
recorded here as direction rather than scheduled.

**Follow-up (2026-08-01).** The 0.12.0 graph and its actual dependencies were
measured in the
[core and module boundary audit](../ontology/reviews/2026-08-01-sstim-core-and-module-boundary-audit.md).
The audit confirms this direction and proposes a staged implementation in
[ADR 0043](0043-sstim-core-profile-and-module-boundaries.md): manifest and
per-profile contracts first, then term redistribution. The split remains
unimplemented while ADR 0043 is Proposed.

### 7. Patch Studio control tracks are renamed to what they are

`Martigli` → **LFO**; `Symmetry` → **Permutation**, in `patch-studio-model-1`
only.

The current names put a *technique* label on a *mechanism*. That is what produced
the category inversion ADR 0040 stumbled over: Martigli is an audible voice in the
catalog and a silent controller in the studio, under one name.

The gain is larger than tidiness. It forces Martigli-ness to be established by
**parameters** — period ≥ 3 s, modulating a carrier, breathing intent — rather
than asserted by a **label**. The [ADR 0026](0026-patch-studio-catalog-bridge.md)
bridge rule becomes "an LFO in the breathing range modulating a carrier → Martigli
voice", a real mapping instead of a name match, which is the posture
[ADR 0018](0018-evidence-integrity-and-public-claim-governance.md) requires
everywhere else.

Two constraints. `CONTROL_TYPES` is persisted in saved patches, so this needs a
migration (`draftFromPatchExport` already defaults unknown values, so it is
tractable). And **the technique name does not change**: `MARTIGLI_BINAURAL.md` is
a defensive publication with a fixed date (`CLAUDE.md` §3.4).

### 8. Session liberties that have nowhere to live

Confirmed absent from `sstim:SessionSpecification`, and to be added with the
target axis:

- the **subject** (§5), and there being none;
- **per-track enable/disable** — turning a soundscape or a layer off;
- **brightness** and other non-audio intensities — `masterVolume` exists and has
  no visual or haptic counterpart, which is §"audio-only" showing up again;
- **start time** and **delivery device** (the latter partly served by
  `sstim-ex:DeviceCapability`).

## Consequences

**Gained.** The engine-dependent layer stops pretending to be general. The
scientifically valuable object — a canonical, engine-independent, multimodal
stimulus description — is named as absent instead of being quietly approximated
by a preset format. The adaptive-regime limit is stated rather than discovered
later.

**Given up.** ADR 0040's classes, three days old. `sstim:Patch` is withdrawn
before anything depends on it; the session package's projection returns to a
narrower typing until layer 1 exists.

**Cost.** Redefining `sstim:Preset` touches a protected file and changes a
published definition. The session package (`docs/technical/SESSION_PACKAGE.md`)
and its conformance harness follow whatever is decided.

**Deliberately not settled here.** Whether `sstim:Track` survives; the name for
layer 1; whether the core split happens; the version and release plan (a bump
requires every module synchronised plus a human-reserved Zenodo DOI —
[ADR 0020](0020-whole-set-snapshot-versioning.md)).

**What does not change.** Nothing here makes an RDF object a scientific claim. A
stimulus specification says what a stimulation *is*, never that it does anything;
evidence, intended effect and safety metadata remain human-authored through the
gated bridge (ADR 0026) and are never inferred from parameters.

## Alternatives considered

**Keep ADR 0040 and fix its wording.** Rejected: the objection is to the classes,
not the prose. Improving the justification for a decision that may not survive is
motion, not progress.

**Treat the waveform as the canonical description.** Engine-independent and
descriptively useless — see §3. It also fails for the stochastic and adaptive
regimes, which are not edge cases here.

**Adopt HED as the native model.** Already declined by
[ADR 0025](0025-hed-bids-interoperability-crosswalk.md), and it answers a
different question: annotating what happened, not specifying what to produce.

**Do nothing until a canonical framework exists elsewhere.** The survey in §4
suggests none is coming. Waiting means continuing to publish an engine-specific
schema under a general name, which is the error this ADR exists to stop.
