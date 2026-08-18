# Questions for the HED Working Group, from building an SSTIM → HED profile

Status: **drafted, not sent.** Intended for the HED Working Group via
<https://github.com/hed-standard/hed-schemas> issues or the HED community
channels. See [ADR 0025](../../decisions/0025-hed-bids-interoperability-crosswalk.md).

These came out of implementing a crosswalk, not out of reading the specification,
which is why they are concrete. The artifacts are in this repository and can be
run: [`static/schemas/sstim-hed-event-map.json`](../../../static/schemas/sstim-hed-event-map.json)
is the mapping, `make hed-crosswalk` validates it with `hedtools` against HED
8.4.0, and [`test/fixtures/hed-bundle/`](../../../test/fixtures/hed-bundle/) and
[`test/fixtures/hed-bundle-modulated/`](../../../test/fixtures/hed-bundle-modulated/)
are generated synthetic bundles — a fixed stimulus and a time-varying one.

The ask is the one ADR 0025 decision 9 sets: **encode and reproduce, never
endorse.** We are not asking anyone to validate BSC Lab or agree with a health
claim. We are asking whether we have encoded these events the way HED intends.

---

## 1. A completed session and an interrupted one are indistinguishable in HED

This is the finding we would most like an answer to.

SSTIM distinguishes `eventSessionComplete` — the session delivered its intended
duration — from `eventSessionInterrupt`, which closed early. Both close the same
temporal scope, so both map to:

```
(Def/Sstim-session, Offset)
```

We could not find a way to say *why* the scope closed. HED 8.4.0 has no
`Incomplete`, `Abort`, `Terminate` or equivalent tag, and `Offset` carries no
completion semantics. So a consumer reading only the events table cannot tell a
finished session from an abandoned one, which for our domain is a meaningful
distinction: an abandoned session is often the more interesting record.

Our crosswalk therefore declares the loss explicitly rather than implying a
distinction HED cannot carry.

**Questions.** Is there an idiomatic HED encoding for this that we have missed —
perhaps a `Property/Task-property` we have not found, or a convention of defining
two distinct scopes rather than one? If not, would a completion-status tag be in
scope for the standard schema, or is this properly a library-schema concern?

## 2. Safety-constrained delivery has no vocabulary

`eventSafetyLimitApplied` records that a delivery parameter was constrained by a
safety boundary — a level reduced, a flash rate capped. We map it to:

```
(Experiment-control, Constrained)
```

`Constrained` is the closest tag we found, but it does not say that the
constraint was protective, which parameter it applied to, or the requested versus
delivered values. HED 8.4.0 has no `Safety` or `Threshold` tag we could locate.

**Question.** Is safety-motivated parameter limiting something HED expects to
represent, or is it correctly outside HED's scope and properly left in the native
record? We are content with the latter answer; we would rather be told than
guess.

## 3. Is `Inset` the right tag for resuming delivery?

`eventPlaybackPause` and `eventPlaybackResume` bracket a gap inside an open
delivery scope. We map them to `(Def/Sstim-delivery, Pause)` and
`(Def/Sstim-delivery, Inset)` respectively. Both validate.

**Question.** Is `Inset` intended for "the scope continues after a pause", or
only for marking an intermediate point of interest? If a pause should instead
close and reopen the scope, we would rather change the mapping than rely on a
reading of `Inset` the group did not intend.

## 4. Software engine identity

`eventEngineFallback` records that delivery moved between engine implementations
mid-session — relevant to reproducibility, since the two engines are not
sample-identical. We map it to `(Experiment-control, Computational-evidence)`,
which is weak; the engine identities themselves stay in the SSTIM record.

**Question.** Does HED have, or want, vocabulary for the software actually
producing a stimulus? Our reading is no, and that this belongs in the native
record — confirmation would let us stop looking.

## 5. A continuously varying stimulus parameter — trace, or piecewise `Def/`?

Our modulated demonstrator has a breathing-cycle period that glides from 4 s to
10 s over 300 s and then holds. It is not a steady periodic modulation with a
rate we could put in one column; the parameter itself changes across the session.

We emit it as a linked continuous trace beside the events table — a BIDS-style
`stimulus.tsv` sampled at 1 Hz, with `n/a` where the session was paused, because
nothing was being delivered there.

Before choosing that, we checked whether HED could carry the piecewise form, and
it can. A placeholder definition validates against 8.4.0:

```
(Definition/Sstim-breath-period/#, (Time-interval/# s))
(Def/Sstim-breath-period/7.774, Inset)
```

So the limitation is on our side rather than HED's: SSTIM has no event type
meaning "a parameter changed" to attach those marks to, and minting one is an
ontology decision we did not want to make as a side effect of building a
demonstrator.

**Questions.** For a parameter that varies continuously through a session, does
HED expect a linked continuous recording, or a series of placeholder-`Def/`
marks at breakpoints? If the latter, is there a convention for choosing
breakpoints, and does `Inset` remain the right scope tag for them? And is
`Time-interval/# s` the intended way to carry a period, or is there a better
value tag we have missed?

We also have a related modelling question we suspect is out of scope but would
rather ask: our arc advances on *delivered* time, so a pause displaces the whole
remainder of the sweep on the session clock. Does HED have any notion of a
timeline that stops and restarts, or is reconciling that strictly the annotator's
job before the table is written?

---

## What we are not asking

We are not asking HED to adopt sensory-stimulation vocabulary. SSTIM covers
technique, signal construction, exposure boundaries, evidence and cautions, and
we expect to keep covering them; HED is a generated event-semantic profile over
our native record, never primary storage. Where the two disagree about what a
record means, our adapter is one-way and versioned, and the loss is declared.

The five questions above are all of the form "have we encoded this the way you
intend", and a "no, and that is out of scope for HED" is a useful answer to
four of them.
