# HED annotations returned by Kay Robbins, 2026-09-02

**Status: upstream correction, not yet absorbed by the crosswalk.** This pair is
the 11 event bundle emailed on 2026-08-28, returned with six of its HED
annotations rewritten by Prof. Kay Robbins (`@VisLab`) and attached publicly to
[hed-standard/hed-schemas#422](https://github.com/hed-standard/hed-schemas/issues/422),
described there as "the sample that @ttm and I have been working on ... it shows
the general HED annotation strategy".

Nothing generates this directory, and no gate reads it. It is the reference copy
of what came back, kept beside
[the 2026-08-27 meeting pair](../kay-robbins-2026-08-27/README.md) so the three
revisions can be read in order.

## What changed, exactly

`events.tsv` is byte identical to the file that was sent
(`sha256 794839b0e7338e669e673cbc2bcacd6c5476d05b7dc6f23de6e6a0ec72537d7a`, the
hash recorded in
[the sent record](../../outreach/2026-08-28-kay-robbins-sent-record.md)). The
data model, the column layout, the `event_id` descriptions and every `TermURL`
came back untouched.

`events.json` differs in six strings, all inside the `event_id` `HED` map, and
in nothing else:

| Level | Sent 2026-08-28 | Returned 2026-09-02 |
|---|---|---|
| `playback-pause` | `(Def/Sstim-delivery, Offset)` | `(Def/Sstim-delivery, Offset), (Agent-action, (Experiment-participant, (Press, (Mouse-button, Pause))))` |
| `playback-resume` | `(Def/Sstim-delivery, Onset, {mod_frequency})` | `(Def/Sstim-delivery, Onset, ({mod_frequency}, (Agent-action, (Experiment-participant, (Press, (Mouse-button, Label/Resume))))))` |
| `parameter-changed` | `(Experiment-control, Modify, {level})` | `(Experiment-control, (Controller-agent, (Modify, ({level}))))` |
| `safety-limit-applied` | `(Experiment-control, Constrained, {level})` | `(Experiment-control, (Controller-agent, (Modify, (Constrained, ({level})))))` |
| `engine-fallback` | `(Experiment-control, Computational-evidence)` | `(Experiment-control, (Controller-agent, (Modify, (Label/Engine, (Performed-using, (Computational-evidence))))))` |
| `observation-collected` | `(Experiment-procedure, Participant-response)` | `(Experiment-procedure, (Experiment-participant, (Perform/Report)))` |

## The one rule behind all six

**Name the agent, and nest the action inside it.** Every string we sent stated
what happened; every replacement states who did it and puts the act under that
agent. Three of them acquire `Controller-agent` (the delivering system), two
acquire `Experiment-participant`, and the two playback rows acquire the physical
button press that the participant actually performed, which our version left
implicit in the state change.

This is the same point Kay makes in prose in the issue: `Pause` is the *purpose*
of an action rather than the action itself, and a single "pause" row is really a
participant action followed by control actions (stop the player, save state,
show the pause image). Her rewrite keeps our one row per occurrence but stops the
row from describing only the system's half of it.

## Validity was never the discriminator

Measured with the repository pinned `hedtools` against HED 8.4.0, warnings
enabled, `Sidecar.validate` then `TabularInput.validate`:

| Pair | Errors | Warnings |
|---|---:|---:|
| Sent 2026-08-28 | 0 | 0 |
| Returned 2026-09-02 | 0 | 3 (one distinct) |

The three warnings are the same `TAG_EXTENDED` on `Perform/Report`, which is a
deliberate tag extension of the kind Kay recommends in her first comment on the
issue: usable immediately, and still valid if a later schema adds the term. So
the correction is about idiom, not about conformance. Both versions validate, and
a gate that only asked "does this validate" would have reported our version as
fine indefinitely.

## The Onset and Offset asymmetry, which explains the two shapes

Her pause puts the press in a **second top level group**; her resume nests it
**inside** the Onset group. That is not inconsistency. Probed directly with
`hedtools` on HED 8.4.0:

| String shape | Result |
|---|---|
| `(Def/…, Offset, (Agent-action, …))` | `TAG_GROUP_ERROR`: the reserved tag `Offset` permits no non def-expand subgroup |
| `(Def/…, Offset), (Agent-action, …)` | valid |
| `(Def/…, Onset, (Agent-action, …))` | valid |

An `Offset` group may hold only its `Def/` and the `Offset`, so anything else has
to sit beside it; an `Onset` group has no such restriction. Both of her shapes are
the only shape available to her in each case.
