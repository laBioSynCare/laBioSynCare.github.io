# Session Model

> **For AI agents:** This document defines the distinction between
> a preset (reusable protocol specification), a session specification
> (a preset plus user-chosen parameters for one execution), and a
> session instance (the record of an actual completed execution). Before
> building any session recording, playback, history, or data export
> feature, read this document. The JSON schema source is
> `schemas/session.schema.json`, generated from this document.

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
not a session variant. Specified in `docs/technical/PRESET_FORMAT.md`.

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

**For the data pipeline:** The preset catalog is the design layer,
shared across all users. Session instances are the per-user behavioral
layer. These must be stored and processed separately. Never modify a
preset when recording session data.

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

**`userMp0`** — Initial breathing cycle duration in seconds.  
**`userMp1`** — Final breathing cycle duration in seconds.  
**`userMd`** — Transition duration in seconds (how long to reach `mp1`
from `mp0`).

When these fields are present in the session specification, they
override the corresponding `mp0`, `mp1`, `md` values in the preset's
breathing-reference voice. When absent, the preset's values are used.

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

**How to record correctly:** The session specification records the
parameters *as run*, not as designed. If the user does not change the
breathing parameters, the session specification records `userMp0: null`,
`userMp1: null`, `userMd: null` (meaning "use preset defaults"). The
audio engine reads these as `mp0`, `mp1`, `md` from the active preset.
This preserves the ability to know, from the session record alone,
whether the user modified the breathing arc.

### Master volume

**Field:** `masterVolume`  
**Type:** float  
**Range:** 0.0–1.0  
**Default:** 1.0 (preset `iniVolume` values applied at full scale)

A scalar applied to all voice volumes uniformly. The session
specification records the volume level set at session start. If the
user adjusts volume mid-session on the device level (OS volume), this
is not captured; only application-level master volume is recorded.

### Headphone mode

**Field:** `headphoneMode`  
**Type:** string enum: `"headphones"` | `"speakers"`  
**Default:** `"headphones"`

When `"speakers"`, the binaural beat component is disabled or
degraded (monaural beat may still be audible). The session specification
records what the user reported using. This is important for research
data: binaural beat evidence only applies to headphone sessions.

---

## Session specification: complete field list

```json
{
  "specVersion": "1.0",
  "presetId": "Perform - Deep Focus",
  "presetVersion": "0.9.1",
  "durationSeconds": 1800,
  "userMp0": null,
  "userMp1": null,
  "userMd": null,
  "masterVolume": 1.0,
  "headphoneMode": "headphones"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `specVersion` | string | yes | Session spec schema version. Currently `"1.0"` |
| `presetId` | string | yes | Matches `_id` of the preset |
| `presetVersion` | string | yes | Matches `header.version` of the preset |
| `durationSeconds` | integer | yes | Intended session length |
| `userMp0` | number or null | yes | null = use preset default |
| `userMp1` | number or null | yes | null = use preset default |
| `userMd` | number or null | yes | null = use preset default |
| `masterVolume` | float | yes | 0.0–1.0 |
| `headphoneMode` | string enum | yes | `"headphones"` or `"speakers"` |

**Future fields (not yet implemented):**
- `engineAudio` — which audio engine implementation was used
  (`"VanillaWebAudio"`, `"ToneJs"`, `"WasmMartigli"`)
- `engineVisual` — which visual engine was used
- `engineHaptic` — which haptic engine was used
- These become important for reproducibility once multiple engine
  implementations exist and their acoustic outputs may differ

---

## Session instance: complete field list

A session instance wraps a session specification and adds execution
data. It is a top-level JSON object and a top-level RDF individual.

```json
{
  "instanceVersion": "1.0",
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "specification": { ... session specification ... },
  "startedAt": "2026-04-12T09:15:00+02:00",
  "endedAt": "2026-04-12T09:45:01+02:00",
  "actualDurationSeconds": 1801,
  "completionStatus": "completed",
  "platform": "web",
  "userAgent": "Mozilla/5.0 ...",
  "selfReport": { ... optional ... },
  "notes": "Tried with speakers today, much less effective"
}
```

### Execution metadata fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `instanceVersion` | string | yes | Schema version. Currently `"1.0"` |
| `uuid` | string (UUID v4) | yes | Stable identifier for this instance |
| `specification` | object | yes | Embedded session specification |
| `startedAt` | ISO 8601 datetime | yes | When the user pressed play |
| `endedAt` | ISO 8601 datetime | yes (if ended) | When session ended or was stopped |
| `actualDurationSeconds` | integer | yes | Actual playback time. May differ from `durationSeconds` if session was interrupted |
| `completionStatus` | string enum | yes | `"completed"` / `"interrupted"` / `"abandoned"` |
| `platform` | string | yes | `"web"` / `"ios"` / `"android"` |
| `userAgent` | string | no | Browser/device user agent string |
| `notes` | string | no | Free-text user note entered after the session |

**Completion status semantics:**
- `"completed"` — session ran for the full `durationSeconds` and ended normally
- `"interrupted"` — session ran for a meaningful portion of `durationSeconds`
  but was stopped early (threshold: > 30% of intended duration)
- `"abandoned"` — session stopped in the first 30% of intended duration

For research purposes, only `"completed"` and `"interrupted"` sessions
with `actualDurationSeconds ≥ 300` (5 minutes) are eligible for
self-report data. Abandoned sessions are recorded but excluded from
evidence analysis.

### Self-report fields (Phase 3, optional)

The self-report block captures post-session subjective data. It is
never required and must never be solicited in a way that suggests
a specific expected outcome. All scales are presented without
anchoring the user to the preset's intended target.

```json
"selfReport": {
  "capturedAt": "2026-04-12T09:46:00+02:00",
  "promptVersion": "1.0",
  "primaryAffect": 4,
  "focus": 4,
  "sleepiness": 2,
  "subjectiveQuality": 4,
  "goalAchieved": true,
  "freeText": "Good session, felt able to concentrate well"
}
```

| Field | Type | Scale | Notes |
|---|---|---|---|
| `capturedAt` | ISO 8601 datetime | — | When self-report was submitted |
| `promptVersion` | string | — | Version of the self-report prompt shown. Important: self-report data is not comparable across prompt versions |
| `primaryAffect` | integer 1–5 | 1=very negative, 5=very positive | How the user feels now |
| `focus` | integer 1–5 | 1=scattered, 5=highly focused | Current attentional state |
| `sleepiness` | integer 1–5 | 1=alert, 5=very drowsy | Arousal level |
| `subjectiveQuality` | integer 1–5 | 1=poor, 5=excellent | How the user rates this session |
| `goalAchieved` | boolean | — | Did the session accomplish what the user intended? |
| `freeText` | string | — | Optional free-text. Max 500 characters |

**Design principles for self-report:**
1. All scales are presented unlabeled with respect to the session's
   target. Never say "did this session help you relax?" for a Heal
   preset. Use neutral questions: "How do you feel right now?"
2. The prompt is shown after a short cooldown (minimum 60 seconds
   after session end) to allow the acute session effect to stabilize.
3. Self-report is opt-in per session, not per account. A user may
   choose to report on some sessions and not others.
4. Self-report data is stored only for sessions where the user has
   given explicit research consent (separate from app usage consent).

---

## Reproducibility guarantee

A session specification is a **reproducible execution contract**.
Given a session specification and a conforming BSC audio engine
implementation, it must be possible to produce an acoustically
identical session.

This guarantee requires:

1. The preset referenced by `presetId` + `presetVersion` must be
   permanently accessible and immutable. The RDF ontology provides
   this through versioned IRIs. The JSON catalog must never modify
   a preset in place — only add new versions.

2. The session specification must record all parameters that affect
   the audio output, including user overrides. If `userMp0` is null
   (preset default used), the reproducibility contract requires
   that the preset's value for `mp0` in the breathing-reference voice
   was used. The engine implementation must use `userMp0` if non-null,
   else fall back to the preset's `mp0`.

3. The audio engine implementation matters for bit-exact reproducibility
   but not for perceptual reproducibility. The invariant is that any
   compliant implementation must produce a session with the same target
   frequencies, breathing arc, voice architecture, and duration. Minor
   floating-point differences between Web Audio implementations are
   acceptable.

**Reproducibility fields to add in future versions:**
- `audioEngineVersion` — the specific engine build used
- `wasmChecksum` — if WASM processors are used, the checksum
  of the WASM binary (Phase 3)

---

## Session history and the user data model

A user's session history is an ordered collection of session instances,
stored locally and optionally synchronized to the cloud. The data model
must support:

**Local storage (Phase 1–2):** IndexedDB in the browser (BSC Lab web),
or AsyncStorage / SQLite on mobile (BioSynCare). Session instances are
stored as JSON. The schema version field (`instanceVersion`) enables
migration when the schema changes.

**Privacy-first design:** Session data is local by default. Cloud sync
is opt-in and requires explicit user consent. Even with cloud sync
enabled, the user retains the right to delete any session instance or
their entire history.

**Export:** A user may export their session history as a JSON array
of session instances or as a Turtle file of RDF individuals. Both
formats must be complete — receiving the export must be sufficient
to reproduce the user's history in a fresh installation.

**Anonymized research contribution (Phase 3):** With explicit research
consent (separate consent, separate opt-in, explicitly revocable),
session instances with self-report data may be contributed to an
anonymized aggregate dataset. The contribution strips identifiers
(`uuid` replaced with a salted hash, `userAgent` removed, timestamps
rounded to the nearest hour) before transmission.

---

## RDF representation

Each session specification and session instance has a corresponding
RDF individual. The session ontology is minimal in Phase 1 and will
be extended in Phase 3 as the evidence infrastructure matures.

```turtle
@prefix sstim:              <https://w3id.org/sstim#> .
@prefix sstim-v:            <https://w3id.org/sstim/vocab#> .
@prefix biosyncare-session: <https://w3id.org/sstim/implementation/biosyncare/session/> .
@prefix owl:                <http://www.w3.org/2002/07/owl#> .
@prefix rdfs:               <http://www.w3.org/2000/01/rdf-schema#> .
@prefix skos:               <http://www.w3.org/2004/02/skos/core#> .
@prefix xsd:                <http://www.w3.org/2001/XMLSchema#> .
@prefix prov:               <http://www.w3.org/ns/prov#> .

# Session Specification class
sstim:SessionSpecification a owl:Class ;
    rdfs:label "Session Specification"@en ;
    skos:definition
        """A complete, reproducible description of a specific intended
        execution of a BSC preset, including user-defined overrides
        of preset defaults."""@en .

# Session Instance class
sstim:SessionInstance a owl:Class ;
    rdfs:subClassOf prov:Activity ;
    rdfs:label "Session Instance"@en ;
    skos:definition
        """The record of an actual execution of a session specification,
        including timing, completion status, and optional self-report
        data."""@en .

# Example session instance
biosyncare-session:550e8400-e29b-41d4-a716-446655440000
    a sstim:SessionInstance, prov:Activity ;
    sstim:usesSpecification [
        a sstim:SessionSpecification ;
        sstim:referencesPreset <https://w3id.org/sstim/implementation/biosyncare/preset/perform-deep-focus> ;
        sstim:presetVersion "0.9.1" ;
        sstim:durationSeconds 1800 ;
        sstim:headphoneMode sstim-v:headphones ;
    ] ;
    prov:startedAtTime "2026-04-12T09:15:00+02:00"^^xsd:dateTimeStamp ;
    prov:endedAtTime   "2026-04-12T09:45:01+02:00"^^xsd:dateTimeStamp ;
    sstim:actualDurationSeconds 1801 ;
    sstim:completionStatus sstim-v:completed .
```

Key design decisions for the RDF model:

- `SessionInstance` extends `prov:Activity` to leverage the PROV-O
  provenance vocabulary for timing and attribution.
- `SessionSpecification` is an anonymous blank node embedded in the
  session instance, not a separate named individual. A specification
  that was never executed does not need its own IRI.
- Session instances referencing the same preset do so by IRI, not
  by embedding the preset. This ensures a single source of truth
  for preset definitions.
- User identity is represented via `prov:wasAssociatedWith` pointing
  to a user IRI, which is stored only in the user's local named graph
  and never included in anonymized research exports.

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

The `SessionRecorder` class in `src/core/SessionRecorder.js` is
responsible for creating, holding, and persisting session instances.
Its interface:

```javascript
// Create specification at session start
const spec = SessionRecorder.createSpecification({
  presetId: preset._id,
  presetVersion: preset.header.version,
  durationSeconds: 1800,
  userMp0: null,       // null = use preset default
  userMp1: null,
  userMd: null,
  masterVolume: 1.0,
  headphoneMode: 'headphones'
});

// Open instance when play begins
const instance = SessionRecorder.open(spec);

// Attach self-report after session ends
SessionRecorder.attachSelfReport(instance.uuid, {
  primaryAffect: 4,
  focus: 4,
  sleepiness: 2,
  subjectiveQuality: 4,
  goalAchieved: true
});

// Finalize and persist to IndexedDB
await SessionRecorder.finalize(instance.uuid, 'completed');
```

The `SessionRecorder` never writes to the preset store. It reads
preset data by reference but never modifies it.

---

## Open questions for Phase 3

1. **Aggregate analysis unit:** Should research analysis aggregate at
   the session-specification level (same preset + same user parameters)
   or at the preset level (same preset, any parameters)? The latter is
   more inclusive but noisier. This decision affects the schema for
   self-report aggregation queries.

2. **Session interruption semantics:** If a user pauses a session and
   resumes it later (same day, different day), is this one session
   instance or two? Current position: one instance with pause events
   recorded as a `pauseEvents` array. This is a schema extension to
   add in Phase 3.

3. **Multi-device synchronization:** If a user runs the same preset on
   a phone and then on a computer on the same day, are these two
   session instances or one? Always two. The device is part of the
   context captured in `platform` and `userAgent`.

4. **Rooms sessions:** The BioSynCare Rooms feature enables shared
   synchronous sessions. A Rooms session involves multiple users running
   the same specification simultaneously. The session model needs a
   `roomId` field and a `isRoomsSession` flag. Self-report data from
   Rooms sessions may not be representative of solo sessions. Not
   modelled in Phase 1–2.

---

*Document version: April 2026*
*Source for: `schemas/session.schema.json` (generated by Claude Code)*
*Maintained by: Renato Fabbri*
*Review required when: breathing model changes, Phase 3 self-report
infrastructure is built, Rooms session data model is finalized, or
export format for research contributions is specified.*
