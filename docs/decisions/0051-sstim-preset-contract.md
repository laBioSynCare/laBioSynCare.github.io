# ADR 0051 — The SSTIM preset contract

**Status:** Accepted — 2026-08-15 · implemented 2026-08-15

## Context

The [2026-07-13 audit](../ontology/reviews/2026-07-13-rdf-knowledge-representation-audit.md)
raised KR-07: *"patch and preset validation is weaker than the reproducibility
claim."* It named four gaps — no six-voice maximum despite the class definition,
incomplete binaural difference and target checks, incomplete Symmetry
constraints, and an `initialVolume` shape allowing values far above the
documented conservative limit — and dispositioned them as: derive a parameter
matrix from the executable schema, then make JSON Schema, SHACL, application
validation and documentation agree.

There was no preset JSON Schema at all. `docs/technical/PRESET_FORMAT.md`
described one and closed with *"Planned source for: `schemas/preset.schema.json`
(not generated yet)"*.

The first attempt at this ADR wrote that schema as a validator for the format
that document describes — the BioSynCare catalog envelope — and made SSTIM's
SHACL agree with it bound for bound. That is backwards, and the maintainer
rejected it. **SSTIM is a public, universal standard; BioSynCare is one
proprietary application.** Making the standard's contract mirror the product's
document points authority the wrong way: a vendor's product decisions would
become binding on the standard.

The reasons that format cannot be SSTIM's are specific, not stylistic:

- **It is audio-only.** Its unit of composition is a `voice`. SSTIM covers nine
  sensory modalities, and a standard whose core structure assumes hearing cannot
  express a visual or haptic preset without a parallel structure.
- **It grew incrementally around delivery problems.** Its shape records which
  technical obstacles were overcome in which order — `waveformL`/`waveformR`/
  `waveformM`/`waveform` are four fields for one concept, `hasBreathGuide`
  duplicates information already carried by the voices' `isOn` flags, and the
  abbreviations (`fl`, `mp0`, `md`) are engine variable names. These are
  history, not design.
- **It is one application, not one standard.** Roughly half its header is
  product taxonomy: listing status, intensity tiering, marketing copy in four
  languages, a per-application three-value evidence enum, a bloom policy.
  Ratifying that would be SSTIM endorsing one vendor's catalog management.

What *is* worth taking is the numbers. The parameter ranges in that document —
carriers 80–1000 Hz, oscillation amplitude 1–400 Hz, a 35 Hz beat ceiling with a
gamma-40 exception, a 50 Hz pulse-rate limit, a 0.30 conservative volume — are
DSP and comfort facts that were dearly won in a real product, and they are
modality-independent in substance.

## Decision

### 1. SSTIM gets its own preset contract, inspired by the catalog and bound to none

[`static/schemas/preset.schema.json`](../../static/schemas/preset.schema.json),
model tag `sstim-preset-1`. It takes the catalog's parameter ranges and nothing
else. Four structural differences carry the design:

**Components, not voices.** A preset is composed of 1–6 *components*, each
declaring its own `modality` from the SSTIM modality scheme. A visual or haptic
component needs no new structure — the audio assumption is simply absent. `kind`
and `modality` are independent on purpose: a breathing oscillation rendered as a
moving light is the same kind in a different modality.

**Parameters named with their units.** `carrierLeftHz`, `initialPeriodSeconds`,
`cycleSeconds` — not `fl`, `mp0`, `d`. A standard is read by people who did not
write the engine.

**One breath pointer instead of two coupled flags.** The catalog carries a
header `hasBreathGuide` boolean *and* an `isOn` boolean on every voice, with a
rule that they must agree and that at most one voice may be `true`. SSTIM has a
single optional `breathReference` naming the component's id. One pointer cannot
contradict itself, where two coupled fields can and did — the SHACL rule
enforcing their agreement exists precisely because they drifted.

**No product envelope.** No listing status, intensity tier, bloom policy,
per-application evidence enum, or marketing copy. Applications may carry their
own fields alongside; the schema neither requires nor validates them.

Two smaller changes in the same direction: `permutation` is a named enum
(`shuffle`, `rotate-forward`, …) rather than the magic integer 0–4, with the
ordinal encoding surviving only where RDF needs a number; and `octaveSpan: 0`
remains the isochronic case rather than becoming a separate kind, because it is
one parameter at zero, not a different object.

### 2. The four named SHACL gaps are closed

| Gap | Now enforced as |
|---|---|
| No six-voice maximum | `sstim:composedOf` `sh:maxCount 6` |
| Incomplete binaural difference/target checks | Preset-level SPARQL constraint: `\|fl − fr\| ≤ 35 Hz`, unless exactly 40 Hz in a preset declaring `gamma-40`. Preset-level because the exception depends on the target band, which the voice cannot see |
| Incomplete Symmetry constraints | `noteCount / cycleDuration ≤ 50 Hz` (onset interval ≥ 20 ms) |
| `initialVolume` far above the conservative limit | Above 0.30 the voice must carry an `rdfs:comment` giving the reason |

The volume rule is a rationale requirement, not a ceiling. A hard cap at 0.30
would forbid a legitimately louder design outright; the specification's actual
rule is that exceeding it requires an explicit rationale, and RDF can hold that
rationale where a code comment cannot travel.

Two range alignments came with them: carriers were bounded `> 0` and `< 1000`
against a documented 80–1000, and the Symmetry base note was bounded at 50 Hz
against a documented 80 Hz. Both now match the specification. No committed
instance was affected — the two seed presets sit well inside every tightened
bound.

### 3. Agreement is executed, not tabulated

The disposition asks for a parameter matrix. A hand-written table of bounds
would be a fourth copy of the numbers that drifts silently, because nothing runs
it. [`scripts/preset-contract.py`](../../scripts/preset-contract.py) instead
*derives* the matrix: it reads every bound out of the JSON Schema, out of the
SHACL property shapes, and out of the catalog document's range columns, and
compares them. Only the *correspondence* — this SSTIM parameter is that SSTIM
property and was derived from that catalog field — is written by hand, because
no artifact states it and the names deliberately differ.

Twelve parameters are compared against SHACL and eleven against the documented
ranges. A bound can now be changed in exactly one place and the gate fails until
the others follow.

The same script carries the **application-validation** leg the disposition asks
for: the cross-field rules no JSON Schema can express — beat frequency, pulse
rate, breath-reference resolution, unique component ids, the level rationale,
and the 3 s floor on a breath reference — are implemented in `validate_preset()`
and each has an adversarial fixture. Twenty-five adversarial cases in total
across the schema, the cross-field validator and SHACL; eight positive controls.

It runs in `make validate` via `make preset-contract`.

## Consequences

- **The relationship to BioSynCare is now one-directional and explicit.** SSTIM
  reads that format's numbers as an input. It does not conform to it, and the
  gate would fail if someone made SSTIM's bounds follow a catalog change rather
  than the other way round. This is the ADR 0007 framework/implementation split
  applied to the preset contract.
- **No converter exists, and this ADR does not add one.** An adapter between
  `sstim-preset-1` and the catalog format remains optional, version-pinned, and
  confined to the adapter boundary
  (`docs/ecosystem/PATCH_STUDIO_CONFORMANCE_AND_NEUTRALITY.md`). The two
  structures are close enough that one is straightforward and different enough
  that it must be written down rather than assumed.
- **Three modalities are expressible in the schema and not yet in RDF.** A
  component may declare `visual` or `somatosensory`, but `sstim:composedOf`
  ranges over `sstim:Voice`, an audio class. The Patch Studio side already has
  `AudioTrack`/`VisualTrack`/`HapticTrack`, so the terms exist in a neighbouring
  model. Reconciling them is the open question ADR 0040 left, and this ADR
  deliberately does not pre-empt it: the JSON contract is the source and RDF is
  the projection, as it is for sessions, so the schema may lead.
- **Panning and waveform selection have no SSTIM property at all.** They are
  output-affecting, so KR-07's "many output-affecting parameters are not
  captured" is not fully closed. They are also the clearest example of what not
  to copy — four waveform fields for one concept, and a panning mode enum with a
  Martigli-synced special case. Modelling them deserves a design pass, not a
  transcription.
- **One specification defect was found and fixed.** `PRESET_FORMAT.md` stated
  `iniVolume` as "0–1" in its per-type tables while its global limits section
  says 1.0 is invalid. It now reads `0 ≤ v < 1`.
- The reproducibility half of KR-07 — declaring bit-exact / signal-equivalent /
  perceptually-equivalent and recording the hashes that level needs — was closed
  by [ADR 0048](0048-session-events-and-qualified-observations.md) on the session
  side, where execution actually happens.

## Alternatives considered

**Publish the catalog format as SSTIM's schema.** Rejected by the maintainer,
and correctly: it would bind a public standard to one proprietary application's
incremental history, and it would make SSTIM audio-only by construction.

**Defer the schema until ADR 0040 resolves Patch versus Preset.** Tempting,
since the modality gap above touches it. Rejected: KR-07 is about validation
strength, most of which is parameter-level and does not depend on that
resolution, and leaving the four named gaps open for an unscheduled ADR trades a
real fix for a hypothetical one.

**Keep `voices` and add sibling arrays for other modalities.** This is what an
incremental extension of the catalog format would look like, and it is exactly
the shape the maintainer identified as one application's history rather than a
standard's design. One component list with a declared modality is simpler and
does not grow a new array per sense.
