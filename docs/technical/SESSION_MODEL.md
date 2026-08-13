# Session Model

> **For AI agents:** This document explains the session model. It is **not** the
> contract. The contract is
> [`static/schemas/session.schema.json`](../../static/schemas/session.schema.json),
> and where this document and the schema disagree, the schema is right and this
> document is a bug. That inversion is deliberate: KR-02 found three
> incompatible session contracts — the ontology, this file's prose, and a
> JSON-LD coercion — with nothing executable to say which was authoritative, so
> the prose stopped being a source. `make session-contract` executes the schema
> against golden fixtures; `make test` validates their RDF projection against
> SHACL.
>
> Before building any session recording, playback, history, or data export
> feature, read the schema, then `src/session/`.

---

## The one contract

| Concern | Where it lives |
|---|---|
| Field-level contract | [`static/schemas/session.schema.json`](../../static/schemas/session.schema.json), `$id` served at `/schemas/session.schema.json` |
| Controlled values, ids, hashing | [`src/session/sessionContract.js`](../../src/session/sessionContract.js) — derived from the schema, never restated |
| Recording | [`src/session/sessionRecorder.js`](../../src/session/sessionRecorder.js) |
| RDF projection + loss report | [`src/session/sessionProjection.js`](../../src/session/sessionProjection.js) |
| Golden cases | [`src/session/fixtures/goldenSessions.js`](../../src/session/fixtures/goldenSessions.js) |
| Gates | `make session-contract`, `make test` |

A **session bundle** is one document with five parts: the `specification`, the
`instance`, an `events` timeline, zero or more `reports`, and a `privacy`
profile that governs all of them. The model tag is
`bsc-lab-session-bundle-1`; a bundle carrying newer fields must never claim an
older tag.

**The RDF is a projection, not the record.** As of
[ADR 0048](../decisions/0048-session-events-and-qualified-observations.md) it
carries the event timeline, the clock that orders it, qualified observations
with their six response states, unwanted-experience records, and instrument
provenance. What it still withholds — free text, the privacy profile, event
detail, the execution environment — it withholds on purpose and says so, rather
than minting undeclared IRIs (the KR-17 failure). `make session-contract` prints
the current list. See §"RDF representation" below.

---

## The core distinction: three layers

The BSC session model has three distinct layers. Conflating them is the
most common source of design errors in the audio engine, the UI, and
the data pipeline.

**Layer 1 — Preset**
A reusable, versioned design template: audio architecture, target
frequency bands, voice parameters, multilingual content, evidence
grounding, and default operational values. A preset exists independently
of any execution. Many users can run the same preset and generate
different session instances. The preset is immutable during a session;
any change to a voice parameter produces a new or modified preset,
not a session variant. A preset follows a protocol or framework but is not
itself the protocol. Specified in `docs/technical/PRESET_FORMAT.md`.

**Layer 2 — Session Specification**
A preset plus all user-defined parameters that together constitute
a complete, reproducible description of a specific intended execution.
A session specification is created at session start and is held constant
throughout the session (the user cannot change parameters mid-session
and have the change retroactively alter the specification). If a user
changes a parameter mid-session, the active specification is closed
as interrupted and a new one begins.

User-defined parameters include: session duration, initial breathing
cycle duration (overriding the preset's `mp0`), final breathing cycle
duration (overriding `mp1`), master volume level, and headphone mode.
These are discussed in detail below.

**Layer 3 — Session Instance**
The record of an actual execution: the session specification (which
embeds the preset by reference), plus execution metadata (start/end
timestamps, actual duration, completion status, platform information)
and optional user-supplied annotations (self-report, free text note,
tags). A session instance is never modified after creation. It is
append-only. Corrections or annotations are attached as linked records,
not edits.

---

## Why the distinction matters

**For reproducibility (research use):** A session specification is a
complete, unambiguous description of what was run. Given a session
specification, any implementation of the BSC audio engine should produce
an acoustically identical session. This is the unit of scientific
reproducibility. A session instance additionally records whether the
specification was actually completed.

**For the data pipeline:** Within a given implementation, presets are the
design layer shared across users. Session instances are the per-user behavioral
layer. These must be stored and processed separately. Never modify a preset when
recording session data. The private BioSynCare/BSC catalog is not imported into
BSC Lab.

**For the UI:** The session player must distinguish between what the
preset specifies and what the user has configured. The UI may display
the preset's designed breathing arc (`mp0`, `mp1`) as a starting
point, but must store the user's actual parameters in the session
specification.

**For evidence gathering (Phase 3):** Evidence analysis operates on
session instances, not presets. Aggregating self-report data requires
knowing which specific specification (preset + parameters) was run.

---

## User-defined parameters

These are the parameters the user may set before starting a session,
potentially overriding the preset's default values.

### Session duration

**Field:** `durationSeconds`  
**Type:** integer  
**Unit:** seconds  
**Default:** 900 (15 minutes)  
**Range:** 60–7200 (1 minute to 2 hours)  

The total intended session length. The audio engine plays the session
for this duration, then stops. This is separate from the breathing
transition duration `md`, which governs how long the breathing arc
takes regardless of session length.

**Design note:** The default 15-minute duration is the BioSynCare v2
default. Research and the "facilitating dedication" use case suggest
that 30–60 minutes is more common for productive use. The session
specification always records what the user set, even if it matches
the default.

### Breathing arc parameters

For presets that include a breathing-guided voice (`hasBreathGuide:
true`), three parameters govern the breathing arc. The preset stores
designer defaults for all three. The user may override any of them.

**`breathingPeriodInitial`** — Initial breathing cycle duration in seconds
(overrides `mp0`; must be ≥ 3.0, below which it is tremolo rather than
breathing guidance).  
**`breathingPeriodFinal`** — Final breathing cycle duration in seconds
(overrides `mp1`).  
**`breathingTransitionDuration`** — Transition duration in seconds, how long to
reach the final period from the initial one (overrides `md`).

The names are the ontology's — `sstim:breathingPeriodInitial` and its two
siblings — not a second set of JSON-only names. The earlier `userMp0` /
`userMp1` / `userMd` spelling existed nowhere but this document.

When these fields carry a value, they override the corresponding `mp0`, `mp1`,
`md` values in the preset's breathing-reference voice. When they are `null`, the
preset's own values were used.

The breathing model for all three is: sinusoidal oscillation with
50/50 inhale/exhale split, linearly interpolating from `mp0` to
`mp1` over `md` seconds, then holding `mp1` for the remainder of
the session. See `docs/technical/BREATHING_MODEL.md` for the
complete mathematical specification.

**Why user-overridable:** Individual variation in comfortable breathing
rate is significant. The preset designer targets a resonance-adjacent
rate (~6 breaths/minute at `mp1 ≈ 10–11s`) for Heal presets, but some
users find slower or faster rates more natural. The original AVE++ model
explicitly noted that "although parametrizable by the user for each
session, the typical setting is [the designer's default]." This
parameterizability is a core design principle.

**How to record correctly:** The session specification records the parameters
*as run*, not as designed. If the participant does not change the breathing
parameters, the specification records an explicit `null` for each, meaning "the
source's own value was used"; the engine then reads `mp0`, `mp1`, `md` from the
active preset. The explicit null is what preserves the ability to know, from the
record alone, whether the arc was modified — and it is one of the things the RDF
projection cannot carry, since an omitted triple and a deliberate non-override
look identical.

### Master volume

**Field:** `masterVolume`  
**Type:** number, required  
**Range:** 0.0–1.0

A scalar applied to all voice volumes uniformly, recorded as set at session
start. Device-level (OS) volume changes are not captured; only the
application-level master volume is. Required rather than optional because
`sstim-sh:SessionSpecShape` requires it, and the schema follows the shape.

### Output route

**Field:** `specification.environment.outputRoute`  
**Type:** string enum: `"headphones"` | `"speakers"` | `"unknown"` | `"not-asked"`

What the participant declared they were listening through. Binaural beat
evidence applies only to headphone delivery, so an undeclared route is recorded
as `unknown` rather than assumed to be headphones.

This field used to be called `headphoneMode`, and this document used to show a
`sstim:headphoneMode` triple beside it. **That term has never existed in the
ontology**, which is one of the concrete divergences KR-02 caught. It now lives
in `environment` with the rest of the reproduction chain, and the projection
reports it as withheld until SSTIM declares a term for it.

---

## Session specification

The complete field list is the schema; it is not restated here, because a second
copy is a second thing to forget. What follows is what the fields *mean*.

```json
{
  "id": "morning-focus-0912-spec",
  "label": "Perform — Alpha 10 seed",
  "created": "2026-08-13T09:00:00Z",
  "source": {
    "kind": "preset",
    "ref": "https://w3id.org/sstim/implementation/bsclab/preset/perform-alpha-10-seed",
    "label": "Perform — Alpha 10 seed",
    "contentHash": "32e114…",
    "contentHashAlgorithm": "sha256-canonical-json"
  },
  "durationSeconds": 1800,
  "masterVolume": 0.2,
  "breathingPeriodInitial": null,
  "breathingPeriodFinal": null,
  "breathingTransitionDuration": null,
  "environment": { "audioEngine": "audio-worklet", "outputRoute": "headphones", "…": "…" },
  "outputGuarantee": "perceptually-equivalent"
}
```

Three things here did not exist before and are the substance of the KR-02
repair:

**`source.contentHash`.** The preset id and version told you which preset was
*named*, not whether it still says what it said. A specification that cannot
show its source is unchanged is suggestive rather than reproducible. The hash is
over canonical JSON, so it does not depend on key order or formatting.

**`environment`.** Which engine, which build, which output route, which sample
rate, which app and ontology version. Reproducibility across four selectable
audio engines is not a future concern — the engines already exist and their
outputs already differ.

**`outputGuarantee`.** Which reproduction claim the record actually supports:
`bit-exact`, `signal-equivalent`, or `perceptually-equivalent`. Web Audio
sessions are `perceptually-equivalent` unless a deterministic offline render
proves otherwise; never declare upward. This field exists because
`sstim:SessionSpecification`'s own definition promises fully determined output,
which is a stronger claim than any current engine can honour, and the record
should be able to say so.

---

## Session instance

The append-only record of one execution. Never modified after close; a
correction attaches as another record.

```json
{
  "id": "morning-focus-0912",
  "specificationId": "morning-focus-0912-spec",
  "startedAt": "2026-08-13T09:01:00Z",
  "endedAt": "2026-08-13T09:31:02Z",
  "clockOriginSeconds": 931.25,
  "clockSource": "audio-context",
  "actualDurationSeconds": 1802,
  "deliveredSeconds": 1742,
  "completionStatus": "completed",
  "deliveryModalities": ["auditory"]
}
```

**`clockOriginSeconds` and `clockSource`.** The engine timing context's
`currentTime` at open, and which timing surface produced it. Every event offset
is measured from this origin, so the pair `(clockOriginSeconds, offsetSeconds)`
reconstructs the exact engine time of anything that happened, with no wall clock
involved. `startedAt` and `endedAt` place the session in the calendar and order
nothing.

**`actualDurationSeconds` vs `deliveredSeconds`.** Elapsed engine time, and
elapsed time minus paused intervals. They are different questions — a session
paused for ten minutes and a session that ran ten minutes shorter are not the
same session — and only the second is the exposure. Completion status is derived
from delivered time.

**Completion status semantics:**
- `"completed"` — delivered the intended duration (within clock jitter) and ended normally
- `"interrupted"` — stopped early, past 30% of the intended duration
- `"abandoned"` — stopped within the first 30%
- `"in-progress"` — still open; not yet a record of anything, and refused by the
  RDF projection

For research purposes, only `"completed"` and `"interrupted"` sessions with
`deliveredSeconds ≥ 300` are eligible for self-report analysis. Abandoned
sessions are recorded but excluded.

---

## Event timeline

`events` is the ordered list of what the runtime did: `session-open`,
`playback-start`, `playback-pause`, `playback-resume`, `playback-stop`,
`session-complete`, `session-interrupt`, `engine-fallback`,
`safety-clamp-applied`, `report-collected`.

Every event carries an `offsetSeconds` on the engine clock. **Never a wall
clock**: `Date.now()` and `performance.now()` drift against the audio hardware,
and a timeline built from them cannot be aligned to the stimulus it describes
(CLAUDE.md §3.1). `sessionRecorder.test.js` spies on both and fails if either is
called.

Events record what the runtime did, not what the participant felt. A recorder
that observes something outside the controlled list extends the vocabulary
rather than overloading a neighbouring term.

## Reports and observations

A `report` is one **collection event**, and each answer inside it is a
**qualified observation item** that carries its own provenance. The flat
five-field block this document used to describe could not represent the ordinary
BSC Lab history use case, which is what KR-03 found.

```json
{
  "id": "morning-focus-0912-report-immediate-post",
  "phase": "immediate-post",
  "collectedAt": "2026-08-13T09:32:05Z",
  "instrument": { "id": "bsc-lab-core-report", "version": "1.0.0", "language": "en" },
  "statedGoal": { "responseState": "supplied", "text": "Settle before a long stretch of writing." },
  "items": [
    {
      "id": "…-item-perceived-helpfulness",
      "role": "perceived-helpfulness",
      "responseState": "supplied",
      "value": 4,
      "scale": { "kind": "ordinal", "min": 1, "max": 5, "minLabel": "not at all", "maxLabel": "a great deal" },
      "prompt": { "id": "helpfulness", "text": "How much did this session help with what you wanted from it?" }
    },
    { "id": "…-item-focus", "role": "focus", "responseState": "declined", "value": null }
  ],
  "unwantedExperiences": { "responseState": "none-reported" }
}
```

**Four phases:** `pre-session`, `during-session`, `immediate-post`,
`follow-up`. SSTIM declares concepts for three of them; a `during-session`
report is withheld from the RDF projection entirely rather than filed under the
nearest neighbour, which would misstate when the answer was given.

**Six response states**, and they are six different facts:
`supplied`, `none-reported`, `not-asked`, `declined`, `unknown`,
`not-applicable`. A missing key collapses all six into one silence, which
destroys the difference between "nothing happened", "we never asked", and "they
chose not to say". A schema rule enforces the pairing: a value is present if and
only if the state is `supplied`.

**Perceived helpfulness** is a first-class item with a declared scale. KR-03
found no direct magnitude item — `goalAchieved` is a yes/no against the
participant's own stated goal and is not one — and no way to record the goal
itself. Both exist now.

**Instrument provenance is required.** Reports are not comparable across
instrument versions, so a report without instrument id, version and language is
not analysable and the schema refuses it.

### Unwanted experiences

```json
"unwantedExperiences": {
  "responseState": "supplied",
  "records": [{
    "id": "…-ue-00",
    "category": "eye-strain",
    "participantReportedSeverity": "mild",
    "onsetPhase": "during-session",
    "onsetOffsetSeconds": 180,
    "persistence": "resolved-same-day",
    "actionTaken": "paused-session",
    "resolution": "improved",
    "participantPerceivedRelatedness": "possibly-related"
  }]
}
```

The block is **deliberately not called `sideEffect`**. That word asserts a causal
medical conclusion a participant report cannot establish, and KR-03 says so
explicitly. Nothing here classifies a clinical adverse event, applies a clinical
grading scale, or infers causation: severity is what the participant said, and
relatedness is what the participant thought. A test asserts no field name or
enum value anywhere in the schema matches `side-effect` or `adverse`.

The response state on the block is load-bearing. An empty `records` array cannot
distinguish "asked, none reported" from "never asked" from "declined to say",
and a safety history that cannot make that distinction is worse than absent,
because a downstream consumer would trust it.

### Privacy profile

Every bundle carries one, and it is **required**, not optional — a session record
without a stated classification cannot be safely stored, exported or committed.
It records classification (`synthetic`, `public-safe`, `de-identified`,
`shared-research`, `private`), reporting role, consent basis, policy version,
visibility, retention, de-identification transform, and withdrawal state. This
replaces the prose claim that reports are "consent-governed", which was not
checkable by anything.

Two consequences that are enforced rather than described:

- **`withdrawn: true` overrides everything.** The projection refuses outright.
- **Only `synthetic` and `public-safe` bundles may be committed to this public
  repository.** `make session-contract` fails otherwise, so the marking is
  machine-testable rather than a comment.

Free text stays out of research exports by default: it can carry identifiers.
The `freeTextIncluded` flag lets an export decide what to strip without walking
every nested item.

**Design principles for reports** (unchanged, and now supported by the model):
1. Every scale is presented unlabelled with respect to the session's target.
   Never "did this session help you relax?" for a Heal preset; use "How do you
   feel right now?"
2. The prompt appears after a cooldown of at least 60 seconds after session end,
   so the acute effect can stabilise.
3. Reporting is opt-in per session, not per account.
4. Reports are stored for research only under explicit research consent,
   separate from app-usage consent — recorded as `consentBasis`.

---

## Reproducibility guarantee

A session specification is a **reproducible execution contract**.
Given a session specification and a conforming BSC audio engine
implementation, it must be possible to produce an acoustically
identical session.

This guarantee requires:

1. The preset referenced by `presetId` + `presetVersion` must be
   permanently accessible and immutable within its implementation context.
   Public BSC Lab reference presets use versioned IRIs. A private JSON catalog
   must never modify a preset in place — only add new versions.

2. The session specification must record all parameters that affect
   the output, including overrides. When `breathingPeriodInitial` is `null`
   (the source's own value was used), the contract requires that the preset's
   `mp0` from the breathing-reference voice was applied. The engine must use the
   override if non-null, else fall back to the preset's value.

3. The engine implementation matters for identical rendering but not for
   equivalent presentation. Which of the three the record supports is no longer
   left to the reader: `outputGuarantee` states it, and projects to
   `sstim:hasReproducibilityLevel`.

`specification.environment` records `audioEngine`, `audioEngineVersion` and
`wasmChecksum` — the fields this section once listed as future work. They exist
in the native contract now; what remains withheld from the RDF projection is the
*execution environment as a whole*, because that is equipment and
[`EQUIPMENT_CHECK.md`](EQUIPMENT_CHECK.md) owns that concern.

---

## Session history and the user data model

A user's session history is an ordered collection of session instances,
stored locally and optionally synchronized to the cloud. The data model
must support:

**Local storage (Phase 1–2):** IndexedDB in the browser (BSC Lab web),
or AsyncStorage / SQLite on mobile (BioSynCare). Bundles are stored as JSON, and
the `model` tag (`bsc-lab-session-bundle-1`) is what a migration reads to know
which shape it is looking at — the same convention Patch Studio documents use.
A bundle carrying newer fields must never claim an older tag.

**Privacy-first design:** Session data is local by default. Cloud sync
is opt-in and requires explicit user consent. Even with cloud sync
enabled, the user retains the right to delete any session instance or
their entire history.

**Export:** A user may export their session history as a JSON array
of session instances or as a Turtle file of RDF individuals. Both
formats must be complete — receiving the export must be sufficient
to reproduce the user's history in a fresh installation.

**Anonymized research contribution (Phase 3):** With explicit research
consent (separate consent, separate opt-in, explicitly revocable), bundles may
be contributed to an aggregate dataset. The contribution replaces the instance
id with a salted hash, drops `specification.environment.platform`, rounds
timestamps, and sets `privacy.deidentification` to record which transform was
actually applied — not the one intended. Free text is excluded by default. A
bundle with `privacy.withdrawn: true` is never contributed, and the RDF
projection refuses it outright.

---

## RDF representation

The RDF is a **projection over the bundle**, produced by
[`src/session/sessionProjection.js`](../../src/session/sessionProjection.js). It
is partial, it says which parts it dropped, and it never invents a term to avoid
dropping one.

The class definitions are in
[`sstim-session.ttl`](../../static/ontology/sstim-session.ttl) and are not
reproduced here — the copy that was drifted, losing `SessionSpecification`'s
`iao:0000030, prov:Plan` parents and `SessionInstance`'s
`SensoryStimulationIntervention` parent. In outline, a `SessionSpecification` is
the reproducible description of one intended execution, and a `SessionInstance`
(a `prov:Activity`) is the append-only record of an actual one.

One wording issue is known and open: the shipped `SessionSpecification`
definition promises a fully determined *acoustic* output, which is audio-shaped
language in a modality-neutral model. Tracked as a deferred gap in
[`../ontology/MODULE_ARCHITECTURE.md`](../ontology/MODULE_ARCHITECTURE.md).

An instance looks like this. The shape is taken from the validated fixture
[`instances/sessions/synthetic-reference-session.ttl`](../../static/ontology/instances/sessions/synthetic-reference-session.ttl),
which `make validate` checks — the hand-written example that stood here used
three terms the ontology does not define (`sstim:headphoneMode`,
`sstim-v:headphones`, `sstim-v:completed`), so it could never have validated.

```turtle
@prefix sstim:          <https://w3id.org/sstim#> .
@prefix sstim-v:        <https://w3id.org/sstim/vocab#> .
@prefix bsclab-preset:  <https://w3id.org/sstim/implementation/bsclab/preset/> .
@prefix bsclab-session: <https://w3id.org/sstim/implementation/bsclab/session/> .
@prefix prov:           <http://www.w3.org/ns/prov#> .
@prefix xsd:            <http://www.w3.org/2001/XMLSchema#> .

bsclab-session:example-001-spec a sstim:SessionSpecification, prov:Plan ;
    sstim:referencesPreset bsclab-preset:perform-alpha-10-seed ;
    sstim:durationSeconds 1800 ;
    sstim:masterVolume 0.20 .

bsclab-session:example-001 a sstim:SessionInstance ;
    sstim:usesSpecification bsclab-session:example-001-spec ;
    sstim:actualDurationSeconds 1801 ;
    sstim:completionStatus "completed" ;
    sstim:hasDeliveryModality sstim-v:modalityAuditory ;
    prov:startedAtTime "2026-04-12T09:15:00+02:00"^^xsd:dateTime ;
    prov:endedAtTime   "2026-04-12T09:45:01+02:00"^^xsd:dateTime ;
    prov:wasAssociatedWith <https://w3id.org/sstim/implementation/bsclab> .
```

`sstim:completionStatus` is a plain string — `"completed"`, `"interrupted"`
(>30% played), or `"abandoned"` (<30%) — not a controlled concept.

Key design decisions for the RDF model:

- `SessionInstance` extends `prov:Activity` to leverage the PROV-O
  provenance vocabulary for timing and attribution.
- `SessionSpecification` gets its **own IRI**, as in the committed fixture. An
  earlier draft of this document proposed embedding it as a blank node on the
  grounds that an unexecuted specification needs no identifier; that was wrong in
  both directions. A specification is the unit of reproducibility, so it must be
  citable and comparable across the instances that realize it — and a blank node
  cannot be either. `usesSpecification` is functional: one instance, one
  specification.
- Session instances referencing the same preset do so by IRI, not
  by embedding the preset. This ensures a single source of truth
  for preset definitions.
- User identity is represented via `prov:wasAssociatedWith` pointing
  to a user IRI, which is stored only in the user's local named graph
  and never included in anonymized research exports.

### What the projection carries

Since [ADR 0048](../decisions/0048-session-events-and-qualified-observations.md),
most of the record travels:

| Carried | Terms |
|---|---|
| The execution timeline | `sstim:SessionEvent`, `hasEventType`, `eventOffsetSeconds` — ordering lives in the offset, never in statement order |
| The clock that orders it | `clockOriginSeconds`, `hasTimingAuthority` |
| Delivered vs elapsed time | `deliveredDurationSeconds`, with SHACL-SPARQL holding delivered ≤ elapsed |
| What the record can promise | `hasReproducibilityLevel`, `configurationDigest` + `digestAlgorithm` |
| Every qualified answer | `sstim:ParticipantObservation` — role, response state, value, scale bounds and anchors, prompt |
| Why an answer is absent | `hasResponseState` over six concepts, enforced by SHACL-SPARQL against a value being present |
| Perceived helpfulness and the stated goal | `rolePerceivedHelpfulness`, `roleStatedGoal` |
| Instrument provenance | `sstim:ObservationInstrument` with `instrumentVersion` |
| Unwanted experiences | `sstim:UnwantedExperienceObservation` with category, severity, onset, persistence, action, resolution, perceived relatedness |
| `during-session` reports | `sstim-v:reportDuringSession` |

The five legacy scalars are emitted **alongside** the observations, not instead
of them, so existing consumers keep working.

### What it still withholds, and why

Run `make session-contract` for the current, generated list — it shrinks by
itself as terms land, so it cannot claim a gap that has closed. What remains is
withheld on purpose rather than for want of a term:

- **Free text.** `sstim:observedTextValue` exists, and the projection withholds
  it unless the caller passes `includeFreeText`. Free text can carry identifiers
  no schema anticipates.
- **The privacy profile.** It governs whether the graph may be published at all,
  so it travels beside the graph rather than inside it, and consent decisions
  belong in a separate access-controlled named graph (CLAUDE.md §5.5). Terms for
  it are deliberately not minted yet — see ADR 0048's consequences.
- **Event detail.** Which engine replaced which, which parameter a safety limit
  constrained. The event is recorded; its particulars are not.
- **The execution environment.** Engine identity and build, output route, sample
  rate, latency. That is equipment, and equipment is
  [`EQUIPMENT_CHECK.md`](EQUIPMENT_CHECK.md)'s concern.

The rule that produced this list has not changed: where there is no term, the
projection emits no triple and says so. A graph that looks authoritative and
validates against nothing is worse than a smaller graph that is true.

---

## Relationship to the breathing model

The session specification's `userMp0`, `userMp1`, `userMd` fields
interact with the breathing model defined in
`docs/technical/BREATHING_MODEL.md`. The full specification of the
breathing waveform — including the sinusoidal oscillation shape,
the 50/50 inhale/exhale ratio, the linear interpolation of cycle
duration, and the visual/haptic synchronization — is in that document.

This document's concern is which parameter values govern the breathing
arc for any given session: the preset defaults if the user has not
overridden them, or the user-specified values if they have.

**Parameter resolution order for `mp0` (and analogously for `mp1`, `md`):**

```
1. If session specification has userMp0 ≠ null  → use userMp0
2. Else → use mp0 from the breathing-reference voice in the preset
```

The audio engine implementation must follow this resolution order
precisely and never fall through to an engine default that is neither
the user's choice nor the preset's design.

---

## Implementation guidance

[`src/session/sessionRecorder.js`](../../src/session/sessionRecorder.js) records
a session. It is a function, not a class, and it holds no storage: it produces a
bundle, and persistence is the caller's business.

```javascript
import { openSession } from '../session/sessionRecorder.js'

// The engine's timing context is passed in — it is the only clock (§3.1).
const recorder = openSession({
  specification,                       // conforming to session.schema.json
  timingContext: engine.getAudioContext(),
  instanceId: 'morning-focus-0912',    // every other id derives from this
  startedAt: new Date().toISOString(), // calendar placement only; orders nothing
  deliveryModalities: ['auditory'],
})

recorder.mark('playback-start')
recorder.pause()                       // delivered time stops accruing
recorder.resume()
recorder.attachReport(report)          // stamps the engine offset if during-session

const bundle = recorder.close({
  endedAt: new Date().toISOString(),
  privacy,                             // required: no profile, no record
})
```

Four things the recorder guarantees, each with a test that fails if it stops
being true:

1. **It reads only the engine timing context.** A test spies on `Date.now` and
   `performance.now` and fails if either is called during a recording.
2. **Offsets are relative to the origin captured at open**, so a context that has
   been alive for 931 seconds still yields a timeline starting at zero.
3. **Delivered time excludes pauses**, and an open pause is closed on `close()`
   rather than silently lost.
4. **A closed instance is closed.** Further marks throw; the record is
   append-only because a session record is evidence of nothing except itself,
   and it is only that much if it was not edited afterwards.

The recorder never writes to the preset store. It reads the configuration by
reference and hashes it; it never modifies it.

`specification.id` must be `${instanceId}-spec` — the recorder rejects anything
else. Derivable ids are what let a report link to the answer inside it without a
lookup table, which the old model could not do.

---

## Open questions for Phase 3

1. **Aggregate analysis unit:** Should research analysis aggregate at
   the session-specification level (same preset + same user parameters)
   or at the preset level (same preset, any parameters)? The latter is
   more inclusive but noisier. This decision affects the schema for
   self-report aggregation queries.

2. **Session interruption semantics:** ~~If a user pauses and resumes later, is
   this one session instance or two?~~ **Resolved.** One instance. Pauses are
   ordinary `playback-pause` / `playback-resume` events on the timeline, and
   `deliveredSeconds` excludes the paused intervals — so the record answers
   "how long was it" and "how much was delivered" separately, without a special
   `pauseEvents` array. What remains open is a policy question rather than a
   modelling one: how long a pause may run before the session is better recorded
   as two.

3. **Multi-device synchronization:** If a user runs the same preset on
   a phone and then on a computer on the same day, are these two
   session instances or one? Always two. The device is part of the
   context captured in `specification.environment`.

4. **Rooms sessions:** The BioSynCare Rooms feature enables shared
   synchronous sessions. A Rooms session involves multiple users running
   the same specification simultaneously. The session model needs a
   `roomId` field and a `isRoomsSession` flag. Self-report data from
   Rooms sessions may not be representative of solo sessions. Not
   modelled in Phase 1–2.

---

*Document version: August 2026 — rewritten to describe the executable contract*
*Contract: [`static/schemas/session.schema.json`](../../static/schemas/session.schema.json). This document explains it; it does not define it.*
*Maintained by: Renato Fabbri*
*Review required when: the schema changes, SSTIM declares any of the withheld
terms, the breathing model changes, or the Rooms session data model is
finalized.*
