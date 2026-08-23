# SSTIM ↔ HED Event Profile and Research Bindings

> **Status: revised design target, not as-built.** The architecture is proposed
> in [ADR 0025](../decisions/0025-hed-bids-interoperability-crosswalk.md).
> Dependencies and gates are in the
> [RDF improvement plan](../ontology/IMPROVEMENT_PLAN.md). No current BSC Lab
> exporter should be described as implementing this profile.

## Recommendation in one paragraph

Use a versioned SSTIM/BSC session bundle as the authoritative record. Generate
HED annotations from its stable event types so the meaning of events is portable
across containers. Offer a complete BIDS Behavioral dataset as the first optional
research binding when consent and a study purpose exist. Add NWB only for a use
case with synchronized neurophysiology, continuous behavior, or stimulus streams.
This keeps ordinary personal history useful without forcing it into a
neuroimaging/neurophysiology dataset structure.

## Why BIDS is useful even though SSTIM is not about MRI

The name “Brain Imaging Data Structure” reflects BIDS's origin, not its present
scope. BIDS supports
[behavioral experiments without neural recordings](https://bids-specification.readthedocs.io/en/stable/modality-specific-files/behavioral-experiments.html),
allows documented additional tabular columns, and has established validators and
research-data conventions. It is therefore useful when a session becomes a
consented, de-identified research dataset.

It is not the right native format for an ordinary BSC Lab history. A valid BIDS
export is a dataset with required metadata and corresponding data files; a bare
app event log or standalone `events.tsv` is not automatically a BIDS dataset.
BIDS also does not replace SSTIM's stimulus construction, evidence, caution,
exposure, and executable-configuration semantics.

## Layered contract

| Layer | Owns | Required for ordinary history | Required for interop demonstrator |
|---|---|---:|---:|
| Native BSC/SSTIM session contract | IDs, specification, event timing/order, execution result, reports, hashes, clock basis | yes | yes |
| SSTIM RDF/JSON-LD projection | Stimulus, protocol, exposure, observation, evidence/safety references, provenance | export projection | yes |
| HED event profile | Portable meaning of events on the timeline | no runtime dependency | yes |
| Executable artifact | Exact patch/configuration and generator/engine identity | reference/hash | yes |
| BIDS Behavioral binding | Research dataset packaging and tabular exchange | no | optional, first binding |
| NWB binding | Synchronized neurophysiology/continuous streams | no | optional, use-case-triggered |

HED is the reusable semantic bridge: the same event mapping can be projected into
a plain tabular bundle, BIDS, or NWB. BIDS and NWB are containers, not competing
sources of event meaning.

## Native event and report prerequisites

The profile cannot be built reliably from start/end timestamps alone. The native
record needs:

- stable `session_id`, `specification_id`, and `event_id` values;
- a clock origin plus monotonic onset/duration values and optional wall-clock
  timestamps;
- event type, state transition, and interruption/resume semantics;
- the source patch/spec/configuration hash, engine version, application version,
  and adapter version;
- actual versus intended execution where they differ; and
- stable report and observation IDs, collection phase/time, instrument/prompt
  version, response state, and provenance.

Initial native event types should cover session start/end, stimulus block
start/end, parameter/configuration change, pause/resume/interruption, report
prompt/capture, participant action, and unwanted-experience reporting. The exact
event vocabulary is part of the session model, not an unversioned list in an
exporter.

### What ADR 0048 actually shipped against that list

Measured 2026-08-22. The requirement above names stimulus block start/end and
participant action. The shipped `SessionEventTypeScheme` contains eleven
concepts, and every one of them is a system, transport, or session-lifecycle
event:

```text
eventSessionOpen        eventPlaybackStart      eventPlaybackPause
eventPlaybackResume     eventPlaybackStop       eventParameterChanged
eventEngineFallback     eventSafetyLimitApplied eventSessionInterrupt
eventObservationCollected                       eventSessionComplete
```

`sstim:SessionEvent` carries exactly four properties: `hasEventType`,
`hasChangedParameter`, `parameterValueBefore`, `parameterValueAfter`. **It cannot
reference a stimulus, a channel, or a specification at all.**

So of the four event families a HED projection needs, SSTIM has one:

| Family | State |
|---|---|
| Device and system events | Shipped |
| Stimulus presentation events | **Absent** |
| Participant and response events | **Absent** (`eventObservationCollected` records that collection occurred, not what the participant did) |
| Contextual events | **Absent** |

`eventPlaybackStart` is transport control, not stimulus onset. HED annotates
occurrences of stimuli; that is the one thing this timeline cannot express. The
claim in [`ECOSYSTEM_INTEGRATION.md`](ECOSYSTEM_INTEGRATION.md) that the bundle
"carries an ordered, engine-clock event timeline that a HED mapping can be
generated from" is true of the clock and the ordering, and premature about the
mapping.

### The constraint on fixing it: minimum bridge only

**Do not close this by building an event vocabulary inside SSTIM.** That is
already the stated posture in
[`ECOSYSTEM_INTEGRATION.md`](ECOSYSTEM_INTEGRATION.md) Workstream 2 ("Do not
replace HED or fork a HED library without repeated reviewed gaps"), and the
temptation here is precisely to duplicate the standard SSTIM chose HED to avoid
duplicating.

The question is not "what event types does stimulation research need", which is
HED's job. It is:

> What is the **minimum** SSTIM event model needed to connect a stimulation
> execution to HED?

On the measurements above, that is small: a relation from a `SessionEvent` to the
thing presented (stimulus, channel, or specification), plus enough event types to
discriminate presentation from participant response from system occurrence. SSTIM
supplies *that something was presented, at time t, per this specification*. HED
supplies *what kind of thing it was*. Roughly two relations and a handful of
concepts, not a vocabulary.

### An execution is not the sum of its events

A HED-described event occurring during an execution is not thereby part of the
stimulation process. A participant sneezing, an experimenter entering the room,
or an amplifier failing are all annotatable occurrences that are not constituents
of the stimulation. The four families above are the partition that keeps
execution-internal events separable from everything else that happened at the
same time.

### BIDS granularity: runs, not sessions

Event files in BIDS attach to recordings and runs according to the BIDS entities,
not one per session. A session may contain several runs and therefore several
event files. The correct shape is:

```text
one SSTIM protocol -> N executions -> each execution may correspond to
one or several BIDS runs -> each run carries many HED-described events
```

**Do not equate an execution with a BIDS run.** Sometimes they align; an
execution may also span runs. Any binding that hard-codes the equality will break
on the first multi-run session.

Note the related SSTIM-side gap recorded in
[`SENSORY_STIMULATION_SENSE_REVIEW.md`](../ontology/SENSORY_STIMULATION_SENSE_REVIEW.md):
`describesStimulation` is the only property whose range is `Stimulation` or a
subclass, so a specification reaches its process and a **protocol never reaches
the execution that realizes it**. The protocol-to-execution edge in the diagram
above has no property behind it today.

## Structured user experience

For an ordinary session, the useful question is indeed “how was it?”—but that
needs more structure than one note or one Boolean.

The native/SSTIM model should distinguish:

- the user's stated non-clinical goal;
- perceived helpfulness on a declared scale;
- zero or more unwanted experiences;
- reported severity, onset/phase, persistence or resolution, action taken, and
  user-perceived relatedness for each experience; and
- value supplied, none reported, not asked, declined, unknown, and not
  applicable.

HED can describe the event that a prompt was shown, a response was made, or an
unplanned incident was reported. The answer's instrument semantics and detailed
content remain SSTIM/native data and can be placed into an appropriate BIDS
behavioral or assessment table. Neither HED nor BIDS turns an individual report
into evidence of efficacy or causal “side effect.”

## Directional field map

This table is conceptual. HED annotations must be generated and validated
against the pinned schema; unvalidated illustrative tag strings are deliberately
not published here.

| Native meaning | HED role | Optional BIDS binding | SSTIM role |
|---|---|---|---|
| Event onset and duration | Temporal scope of the annotated event | `onset`, `duration` in the applicable event/behavior table | Session event timing with clock definition |
| Stable event type | Describes stimulus/action/response/structure meaning | `trial_type` or another documented column | Controlled native event type |
| Session/spec/event IDs | Definition/reference join where appropriate | Documented entity/column values | Canonical resource identifiers |
| Stimulus block/configuration | Sensory-presentation and experimental-context semantics | Event row plus sidecar references | Technique, channels, parameters, exposure, provenance |
| Report prompt/capture | Experimental event and participant-action semantics | Event row; response values in behavioral/assessment data | Report collection activity and instrument version |
| Perceived helpfulness | Captures that a response occurred, not the scale's domain model | Documented behavioral/assessment value | Qualified subjective observation |
| Unwanted experience | Captures report/incident timing and event context | Repeatable documented rows or assessment structure | Qualified, non-causal unwanted-experience observation |
| Evidence/cautions | Generally not an event annotation | Dataset documentation/link where appropriate | Scoped evidence assessment and safety metadata |
| Patch/configuration hash | Provenance/context link, not a HED concept mapping | Sidecar/manifest reference | Source artifact and generation provenance |

SKOS mapping properties are appropriate only when both endpoints are actual
concepts and the relationship has been reviewed. BIDS column transformations,
HED annotation recipes, row construction, and cross-file joins are profile rules,
not `skos:exactMatch` or `skos:closeMatch` triples.

## Core demonstrator

Use one synthetic, non-personal ordinary session with a conservative fixed or
explicitly segmented stimulus. Include:

1. a native session bundle and normalized event table;
2. an SSTIM RDF/JSON-LD projection with specification, instance, exposure,
   reports, observation items, and provenance;
3. HED annotations generated from the versioned event map; and
4. the exact patch/configuration plus a manifest of IDs, versions, clocks, and
   hashes.

The fixture should contain pre/post reports, perceived helpfulness, and a
clearly synthetic low-severity unwanted-experience example so repeatable and
non-causal reporting is exercised. Additional fixtures cover none-reported,
declined/not-asked, multiple experiences, follow-up, and interruption.

Dynamic stimuli must be represented as explicit segments or linked traces. A
time-varying modulation must not be flattened into one misleading static row.

## Optional BIDS Behavioral binding

The first binding of the core fixture should:

- assemble a complete BIDS Behavioral dataset with a corresponding behavioral
  data file and all required dataset metadata;
- pin the BIDS and HED versions in `dataset_description.json`;
- use pseudonymous BIDS subject/session labels and exclude direct identifiers;
- document every SSTIM-specific column in JSON sidecars;
- choose events, behavioral samples, and phenotype/assessment structures based
  on the study design rather than putting every value into `events.tsv`;
- exclude free text by default or apply a separately reviewed redaction policy;
- pass the BIDS Validator and HED validation; and
- compare IDs, onsets, durations, report values, and declared information loss
  against the authoritative native fixture.

This binding is useful and should be maintained, but ordinary BSC Lab sessions
remain valid without it.

## Optional NWB binding

NWB becomes appropriate when an external use case has synchronized
neurophysiology, continuous behavior/tracking, or stimulus time series. That
adapter should use suitable NWB tables/time series and the maintained HED
extension, preserve native IDs and times, and pass NWB Inspector plus HED checks.
Do not build or require it merely for symmetry with BIDS.

## Manifest and loss contract

Each bundle records:

- IDs shared across native, RDF, HED, and optional container artifacts;
- file hashes and the source specification/configuration hash;
- SSTIM, HED, application, engine, adapter, and optional container versions;
- clock origin, time base, timestamp policy, and synchronization assumptions;
- generation agent/activity and generation time;
- synthetic/consent/de-identification classification;
- field-level transformation direction; and
- omissions, approximations, segmentation, and other known information loss.

Round-trip authority ends at the native model: an optional binding may be lossy
when that loss is explicit and tested.

## Validation gates

- Native JSON Schema passes.
- Native → RDF/JSON-LD preserves IDs, datatypes, values, and order; SSTIM SHACL
  passes.
- All local IRIs resolve, and configuration/artifact hashes match.
- Generated HED validates against the pinned schema and declared definitions.
- Cross-artifact IDs and times agree.
- Each optional binding passes its own validator and a native-fixture comparison.
- Public fixtures are machine-marked synthetic/public-safe.
- No individual report is typed or transformed into `EvidenceClaim`, efficacy,
  diagnosis, injury, clinical adverse event, or causal attribution.

## Current blockers

- SessionRecorder and the versioned native session JSON Schema are not present.
- The documented session RDF conflicts with the live ontology/context in several
  datatypes and properties.
- The current self-report model lacks direct helpfulness, repeatable structured
  unwanted experiences, missingness states, and enforceable privacy provenance.
- The Sensory Field exposure export now passes its applicable SSTIM SHACL
  contract, but it remains an exposure/configuration summary rather than the
  native executed-session and event contract required by this profile.
- Browser-side RDF validation and HED/BIDS/NWB adapters do not exist.
- The shipped session event vocabulary covers device and system occurrences only.
  Stimulus-presentation, participant-response, and contextual events are absent,
  and `sstim:SessionEvent` cannot reference a stimulus. See the measurement above:
  this, not the timeline itself, is what blocks the mapping.
- No property relates a `SensoryStimulationProtocol` to the process that realizes
  it.

These are tracked in the
[RDF improvement plan](../ontology/IMPROVEMENT_PLAN.md) and documented in the
[2026-07-13 RDF audit](../ontology/reviews/2026-07-13-rdf-knowledge-representation-audit.md).

## External review path

1. Validate the native+HED synthetic bundle locally.
2. Ask the HED Working Group to review event definitions, temporal scope, schema
   selection, and whether any genuine schema gap exists.
3. Validate and publish the optional BIDS Behavioral binding.
4. Ask external labs to nominate a protocol/session pattern to encode and
   reproduce—not to endorse BSC Lab or any health claim.
5. Add NWB review only when a synchronized-data partner use case exists.

The W3C Community Group is the intended neutral community venue for SSTIM; HED,
BIDS, NWB, and INCF are interoperability/adoption partners rather than SSTIM's
governing home.
