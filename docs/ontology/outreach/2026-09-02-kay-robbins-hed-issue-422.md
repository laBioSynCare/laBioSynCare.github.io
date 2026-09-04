# HED issue 422: our sample published upstream, and six annotations corrected

**Status: received, not yet answered, not yet absorbed.** Public thread, no
private correspondence involved.
[hed-standard/hed-schemas#422](https://github.com/hed-standard/hed-schemas/issues/422)
was opened on 2026-08-26 by a third party (`@AlmaCollective`) asking how Standard
HED should encode that a participant, rather than an external cue, determined
*when* a voluntary action happened. Prof. Kay Robbins (`@VisLab`) answered twice,
and her second comment on 2026-09-02 attached our event bundle as the worked
example.

## What she did with our material

She attached the exact 11 event pair emailed on 2026-08-28, describing it as
"the sample that @ttm and I have been working on ... it shows the general HED
annotation strategy". The pair, with her edits, is archived at
[`../hed/kay-robbins-2026-09-02/`](../hed/kay-robbins-2026-09-02/README.md),
where the full diff, the validation numbers and the reason for two different
group shapes are recorded.

The short version: `events.tsv` came back byte identical, so the data model, the
column layout, the `event_id` levels and every SSTIM `TermURL` were accepted as
sent. `events.json` changed in six strings and nothing else, and all six apply
one rule we had missed. **Name the agent and nest the action inside it**:
`Controller-agent` for the delivering system, `Experiment-participant` for the
person, and, on the two playback rows, the physical button press that our version
left implicit in the state change. Both versions validate against HED 8.4.0 at
zero errors, so no gate we own would ever have flagged the difference.

This also means our annotation strategy is now public, cited by the HED Working
Group lead in a Standard HED design thread. That is good positioning and it was
not something we chose, so the artifacts should stay accurate.

## Her second ruling, which supersedes part of the 2026-08-25 meeting

`Pause` is the **purpose** of an action, not the action. A pause row is really a
sequence: the participant presses a button, then the system stops the player and
saves state, then it starts the pause display. Resuming is the mirror. Crosswalk
0.5.0 already dropped the `Pause` and `Inset` tags in favour of `Offset` then
`Onset`, which she does not contest; what is new is that the delivery scope
change alone under-describes the row.

## Directed versus self-directed, where SSTIM has a precedent worth offering

Answering the original question, she proposes that "voluntary versus involuntary"
is the wrong axis, because it confounds with voluntary and involuntary muscle
movement, and suggests **directed versus self-directed** as a `Task-action-type`
instead. Her first comment already offers `Task-action-type/Cued` and
`Task-action-type/Uncued` as immediately usable tag extensions, and invites a
precise written proposal for schema inclusion.

SSTIM has met this distinction and landed on **three** values, not two.
`sstim:ParticipantEngagementMode` (technique module) carries:

| Concept | Notation | What it covers |
|---|---|---|
| `sstim-v:engagementPassiveReceptive` | `engagement-passive-receptive` | Delivery to a receptive individual not required to act on their own state. A closed loop automated system is still passive when the individual does not self-regulate. |
| `sstim-v:engagementGuidedFollowing` | `engagement-guided-following` | The individual actively follows an external pacing cue but does not regulate from internal feedback. Between passive reception and self-regulation. |
| `sstim-v:engagementActiveSelfRegulatory` | `engagement-active-self-regulatory` | The mechanism requires the individual to regulate their own state toward a perceived goal (meditation, volitional breathwork, neurofeedback). |

Two caveats keep this honest if it is offered upstream. First, the SSTIM axis is
a property of a **method**, describing what a technique requires of a person, and
the HED question is about a single **event**, describing who set its timing. The
two are related but not the same field, and saying so is the point. Second, the
reason the middle value exists is exactly the case a two valued axis loses: paced
breathing guidance is neither self-initiated nor a discrete response to a
discrete cue, and it is common in this domain. That is a concrete argument from a
second vocabulary rather than an opinion, which is what the thread asked for.

`sstim:SelfDirectedNeuromodulation` and `sstim:InterventionalNeuromodulation`
(ADR 0035 and ADR 0036) already use her preferred word in the neighbouring sense,
which is worth mentioning only as corroboration, not as the same distinction.

## What this leaves open

1. **Crosswalk 0.6.0** to absorb the agent grouping, which is tracked in
   [`../../../TODO.md`](../../../TODO.md). It touches the mapping table, the
   generator, the three demonstrator bundles and the reverse lookup in
   `check-hed-roundtrip.py`, since a second top level group is a shape that
   check has not had to reverse before.
2. **Whether to reply in the thread**, and in whose voice. The question is a
   third party's, our material is already in it, and the engagement mode
   precedent is directly responsive. Not sent, and not to be sent without
   Renato's decision.
3. **A participant action event type in SSTIM**, which is the deeper form of her
   pause ruling. SSTIM's session event types record what the delivering system
   observed, and the participant's press is currently only implied by
   `eventPlaybackPause`. Whether that is a modelling gap or a deliberate scope
   boundary is an ontology decision, not a crosswalk one.
