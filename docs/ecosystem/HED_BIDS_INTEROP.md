# SSTIM ↔ HED / BIDS Interoperability

> **Status: strategy + draft crosswalk (target, not as-built).** Decision recorded
> in [ADR 0025](../decisions/0025-hed-bids-interoperability-crosswalk.md) (Proposed).
> Tracked as Workstream 2 in [`ECOSYSTEM_INTEGRATION.md`](ECOSYSTEM_INTEGRATION.md).
> This document is the crosswalk plan and the field-level mapping; it does not
> assert a shipped exporter.

## Why this exists

SSTIM's fastest route to ecosystem legitimacy is not "here is a 295-concept
ontology" — it is *"here is a study you already ran, now fully reproducible and
machine-actionable across the standards you already use."* The neuroscience-data
world already has mature, INCF-endorsed standards for datasets and events. It does
**not** have a good layer for the *stimulation itself*. That gap is SSTIM's, and
BSC Lab can execute the stimulus and export the metadata.

The move is therefore an **interoperability profile**, not a takeover. See
[ADR 0025](../decisions/0025-hed-bids-interoperability-crosswalk.md) for the
posture and the alternatives rejected.

## The three neighbors (one-paragraph each)

- **BIDS — Brain Imaging Data Structure.** A folder + metadata convention for
  neuroscience datasets (MRI, EEG, MEG, PET, behavioral). Carries experiment
  timing in `events.tsv` (onset, duration, and run/trial structure).
- **HED — Hierarchical Event Descriptors.** A controlled vocabulary + annotation
  system for *what occurred* during an experiment ("a light flashes", "a tone
  begins", "a participant responds"). INCF-endorsed; open schema-development
  process that accepts community library vocabularies.
- **INCF — International Neuroinformatics Coordinating Facility.** Helps
  communities develop, evaluate, and adopt standards; endorses BIDS and HED. A
  standards-review / visibility / adoption channel — **not** SSTIM's governing
  home (that stays the W3C CG, [ADR 0007](../decisions/0007-framework-protocol-implementation.md)).

## Division of labor

The four standards are complementary, not competing. For a study that *"delivers
10 Hz visual flicker plus binaural audio while recording EEG":*

| Layer | Answers | Standard |
|---|---|---|
| Dataset packaging | Where are the files, participants, event tables? | **BIDS** |
| Event timing | When did each flicker block / tone / instruction / response occur? | **BIDS `events.tsv`** |
| Event meaning | What *is* each event (a visual flash, an auditory onset, a response)? | **HED** |
| **Stimulation** | Technique, waveform, carrier/beat, modulation, device, exposure boundaries, evidence tier, cautions, protocol, session relationships | **SSTIM RDF / JSON-LD** |
| **Executable stimulus** | The runnable patch that *produces* the stimulus | **BSC Lab patch / protocol** |

> SSTIM does **not** duplicate BIDS/HED. It fills the currently weak
> *sensory-stimulation specification* layer that sits between experimental events
> and neuroscience datasets.

## The demonstrator (single artifact, four representations)

The compelling deliverable is **one BSC Lab session exported four ways**:

| Function | Representation | Source in BSC Lab today |
|---|---|---|
| Onset, duration, run structure | BIDS `events.tsv` | session/exposure timeline |
| Experimental event meaning | HED annotations | new mapping layer (this doc) |
| Technique, waveform, modulation, device, exposure, evidence, safety | SSTIM RDF / JSON-LD | ✅ ontology + [`sstim-ex:ExposureProfile`](../technical/SENSORY_FIELD.md) |
| Executable stimulus | BSC Lab patch / protocol | ✅ [Patch Studio export](../technical/PATCH_STUDIO.md) |

Two of the four already exist. The net-new work is the **BIDS/HED mapping layer**,
not new engines — a key reason this is high-leverage.

## Draft field crosswalk (illustrative — to be finalized in review)

For a single stimulation event/block. HED tags shown are indicative and must be
validated against the current HED schema during implementation; SSTIM terms use
`src/rdf/namespaces.js` prefixes, never hardcoded IRIs.

| Concept | BIDS `events.tsv` | HED (indicative) | SSTIM |
|---|---|---|---|
| Block onset | `onset` (s) | `Onset` | session/exposure start time |
| Block duration | `duration` (s) | `Duration/# s` | exposure segment length |
| Visual flicker, 10 Hz | `trial_type` | `Sensory-event, Visual-presentation, (Flash, Frequency/10 Hz)` | visual technique + rate parameter |
| Binaural beat | `trial_type` | `Sensory-event, Auditory-presentation` | `Binaural` voice (carrier pair, beat) |
| Delivery modality | — | `Visual-presentation` / `Auditory-presentation` | exposure delivery modality (ADR 0010) |
| Device / channel | — | (device tags) | device + channel metadata |
| Safety / flash cap | — | — | photosensitivity exposure bound ([ADR 0011](../decisions/0011-sensory-field-and-flash-safety.md)) |
| Evidence tier | — | — | `sstim:EvidenceClaim` + tier (SSTIM only) |

The rightmost columns (safety bound, evidence tier, technique/protocol) are the
SSTIM-only value: HED/BIDS have no place for them, which is precisely why the
crosswalk *adds* rather than *duplicates*.

## Outreach hook (how the crosswalk becomes adoption)

1. Publish one end-to-end SSTIM–HED/BIDS worked example; request review from the
   **HED Working Group** via the schema-development process.
2. Ask one or two external labs (e.g., multisensory / entrainment groups) to
   **nominate one protocol each to encode** — the ask is *encode/reproduce*, never
   *endorse BSC* (ADR 0025 decision 6; [ADR 0018](../decisions/0018-evidence-integrity-and-public-claim-governance.md); `CLAUDE.md` §3.5).
3. Use the reviewed crosswalk artifact as the **invitation into the W3C CG**, not
   as a reason to subordinate SSTIM to HED.

Named candidate labs and the KPIs for this are tracked in
[`ECOSYSTEM_INTEGRATION.md`](ECOSYSTEM_INTEGRATION.md) Workstreams 2–3 (and any
lab we actually engage gets recorded per the [ADR 0024](../decisions/0024-stakeholder-ecosystem-modeling.md)
notify-and-honor posture).

## Guardrails

- **No medical/therapeutic claims** in any published example (`CLAUDE.md` §3.5,
  [`../concept/SCOPE.md`](../concept/SCOPE.md)).
- **No hard-coded live figures** (quad/concept/preset counts) — cite the live app.
- **HED tags are indicative until validated** against the current HED schema.
- **RDF expression of the mapping** (SKOS mapping properties, a JSON-LD context)
  is a follow-up gated by `CLAUDE.md` §3.4/§8 — do not auto-author ontology TTL.

## Next actions

- [ ] Ratify [ADR 0025](../decisions/0025-hed-bids-interoperability-crosswalk.md) (currently Proposed).
- [ ] Pick one concrete session to encode as the worked example.
- [ ] Validate the HED tag column against the current HED schema.
- [ ] Produce the `events.tsv` + HED sidecar + SSTIM JSON-LD + patch bundle.
- [ ] Request HED Working Group review.
