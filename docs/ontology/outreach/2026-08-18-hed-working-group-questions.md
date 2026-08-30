# Questions for the HED Working Group, from building an SSTIM → HED profile

Status: **sent 2026-08-20**, as @ttm, split by which repository owns each
question:

- Questions 1-5, the schema-modelling ones —
  [hed-standard/hed-schemas#416](https://github.com/hed-standard/hed-schemas/issues/416)
- Question 6, the reproducible `bids-validator` crash —
  [hed-standard/hed-javascript#836](https://github.com/hed-standard/hed-javascript/issues/836),
  that being the repository holding `BidsSidecar._filterHedStrings`

`hed-schemas` has Discussions enabled but empty, and an issue tracker carrying
this exact kind of vocabulary-gap question (#390, #354), so both went to issues.

**Reply, same day.** A maintainer asked us to retest question 6 against
`bids-validator` 3.0.1 — 1.15.0 is the superseded npm line, and 3.x ships via
Deno/JSR. Retested 2026-08-20: **the crash is fixed and question 6 is answered.**
A top-level `HED` sidecar key is illegal (`SIDECAR_INVALID`), so the
`CUSTOM_COLUMN_WITHOUT_DESCRIPTION` warning was correct to ignore, and that
warning no longer exists in 3.x. Two new findings were reported back on the
thread: 3.0.1 catches the illegal key only when another entry also carries an
`HED` sub-key, so a lone one silently skips validation of the whole column; and
our own sidecar was redefining the BIDS-required `duration` column, now fixed.

**Answers, 2026-08-20 to 2026-08-23.** @VisLab, @neuromechanist and
@yarikoptic all replied. Question 2 is **settled**: HED carries the factual
delivered value, not the protective intent, which belongs with the higher-level
description of the paradigm; data quality does not belong under HED either. Our
declared loss for it was already correct, so nothing in the mapping changes.
Question 1 is **half settled**: `scans.tsv` is BIDS's place for whether a
recording completed (verified against 3.0.1), but HED 8.4.0 has no tag meaning
completed versus interrupted, so the vocabulary gap stands and a library schema
was raised as a possible home. Question 3 was **answered in the 2026-08-25
meeting**: a delivery pause closes its scope with `Offset`, and resume reopens it
with `Onset`; the HED `Pause` and `Inset` tags are not the idiom for this use.
Questions 4 and 5 remain open. Question 6's silent no-validation path was
**fixed upstream** in
[bids-standard/bids-validator#442](https://github.com/bids-standard/bids-validator/pull/442),
merged 2026-08-27 and re-tested successfully on merged `main` the next day.
[hed-standard/hed-javascript#836](https://github.com/hed-standard/hed-javascript/issues/836)
remains open for the residual `IssueError` / `INTERNAL_ERROR` presentation of
the now-detected illegal-key case, not for the silent skip.

The most consequential reply was not an answer to any of the six. @VisLab's
point is that our definitions are event codes wearing a definition's clothes,
and that richer bodies would let a consumer distinguish situations across
datasets instead of matching opaque names. We accept it. The 2026-08-25 meeting
answered question 3 and produced the four rulings recorded in the
[follow-up draft](2026-08-27-kay-robbins-revised-events-bundle.md), but no
recorded ruling settled whether definitions should describe the actual stimulus
or stay stable across datasets. That definition-shape question, and question 5,
remain open. The follow-up message and attachment are still drafted, not sent.

See [ADR 0025](../../decisions/0025-hed-bids-interoperability-crosswalk.md).

These came out of implementing a crosswalk, not out of reading the specification,
which is why they are concrete. The artifacts are in this repository and can be
run: [`static/schemas/sstim-hed-event-map.json`](../../../static/schemas/sstim-hed-event-map.json)
is the mapping, `make hed-crosswalk` validates it with `hedtools` against HED
8.4.0, and three generated synthetic bundles cover each stimulus shape in ADR
0025 decision 5: a [fixed stimulus](../../../test/fixtures/hed-bundle/), an
[explicitly segmented stimulus](../../../test/fixtures/hed-bundle-segmented/),
and a [continuously modulated stimulus](../../../test/fixtures/hed-bundle-modulated/).

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
safety boundary — a level reduced, a flash rate capped. We now carry the
parameter and the delivered value in `Parameter-label` / `Parameter-value` tags,
so what follows is about the *protective* character of the constraint, which is
the part we could not express. The base mapping is:

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

**Answered 2026-08-25.** Kay Robbins confirmed in the meeting that a delivery
pause is an `Offset` and resume is a new `Onset`; the HED `Pause` tag concerns a
recording suspension, and `Inset` goes with that convention. Mapping 0.5.0
implements the answer. The question above is preserved as the text that was
sent.

## 4. Software engine identity

`eventEngineFallback` records that delivery moved between engine implementations
mid-session — relevant to reproducibility, since the two engines are not
sample-identical. We map it to `(Experiment-control, Computational-evidence)`,
which is weak; the engine identities themselves stay in the SSTIM record.

**Question.** Does HED have, or want, vocabulary for the software actually
producing a stimulus? Our reading is no, and that this belongs in the native
record — confirmation would let us stop looking.

**Correction 2026-08-30.** The sent wording overstates the native record:
`sstim:SessionEvent` currently carries no engine identities, so the unique
engine-fallback HED mapping drops no engine pair that SSTIM actually recorded.
The question remains open as a deliberate model decision — whether SSTIM or HED
should name engine implementations — and no ontology term has been added merely
to make the projection appear richer.

## 5. A continuously varying stimulus parameter — trace, or piecewise `Def/`?

Our modulated demonstrator has a breathing-cycle period that glides from 4 s to
10 s over 300 s and then holds. It is not a steady periodic modulation with a
rate we could put in one column; the parameter itself changes across the session.

We emit it as a linked continuous trace beside the events table — a BIDS-style
`stimulus.tsv` sampled at 1 Hz, with `n/a` where the session was paused, because
nothing was being delivered there.

We use piecewise events for a *stepped* stimulus, in a separate bundle: each
segment boundary is an event carrying the parameter and its new value, which we
emit as

```
(Experiment-control, Modify, Parameter-label/Modulation-frequency, Parameter-value/14)
```

and a safety-constrained value as

```
(Experiment-control, Constrained, Parameter-label/Level, Parameter-value/0.3)
```

We also checked that HED can carry a continuous parameter as placeholder marks,
and it can — this validates against 8.4.0:

```
(Definition/Sstim-breath-period/#, (Time-interval/# s))
(Def/Sstim-breath-period/7.774, Inset)
```

So both forms are available to us, and we chose per stimulus shape: discrete
steps become events, a modulation our specification already declares in full
becomes a trace. We would rather be told this is the wrong cut than discover it
later.

**Questions.** For a parameter that varies continuously through a session, does
HED expect a linked continuous recording, or a series of placeholder-`Def/`
marks at breakpoints? If the latter, is there a convention for choosing
breakpoints, and does `Inset` remain the right scope tag for them? And is
`Time-interval/# s` the intended way to carry a period, or is there a better
value tag we have missed?

For the stepped case: are `Experiment-control` with `Modify` and
`Parameter-label` / `Parameter-value` the intended idiom for "the experimenter
or participant changed a delivery parameter to this value", or is
`Control-variable` closer to what you mean? We could not tell from the schema
alone which of the two the group considers canonical here.

We also have a related modelling question we suspect is out of scope but would
rather ask: our arc advances on *delivered* time, so a pause displaces the whole
remainder of the sweep on the session clock. Does HED have any notion of a
timeline that stops and restarts, or is reconciling that strictly the annotator's
job before the table is written?

## 6. A sidecar entry named `HED` is unusable, so our HED column has no description

This one is concrete enough to be a bug report, and we are unsure whose.

Our `events.tsv` has a column literally named `HED`, which is the BIDS
convention. BIDS also warns when a custom column has no sidecar description
(`CUSTOM_COLUMN_WITHOUT_DESCRIPTION`). But every attempt to describe it crashes
the validator, because a sidecar entry named `HED` is read as HED annotations
rather than as that column's description.

Measured on 2026-08-18 with `bids-validator` 1.15.0 on a minimal behavioral
dataset, changing nothing but the sidecar:

| Sidecar entry | Result |
|---|---|
| `"HED": {"Description": "...", "Definitions": [...]}` | `INTERNAL ERROR. SOME VALIDATION STEPS MAY NOT HAVE OCCURRED` |
| `"HED": {"Definitions": [...]}` | same internal error |
| `"HED": {"Description": "..."}` | same internal error |
| no `HED` entry; definitions under their own non-column key | **0 errors**, 1 warning: `CUSTOM_COLUMN_WITHOUT_DESCRIPTION` |

The stack lands in `BidsSidecar._filterHedStrings`, which maps over the entry's
values and hands each to the HED parser; prose and a `Definitions` array are not
HED strings, and it throws rather than reporting an issue.

We took the last row — definitions in their own entry, no `HED` entry — because
a warning is better than an unvalidated dataset. An internal error is not a
failed validation, it is no validation, and we would rather not ship artifacts
whose validator silently stopped early.

**Questions.** Is a sidecar entry named `HED` simply not allowed when a column of
that name exists, and is the `CUSTOM_COLUMN_WITHOUT_DESCRIPTION` warning
therefore expected and correct to ignore? If it is allowed, the crash looks like
a validator defect and we are happy to file it with the reproduction above. And
is the entry key for definitions arbitrary — we used `sstim_hed_definitions` —
or is there a name the ecosystem expects?

---

## What we are not asking

We are not asking HED to adopt sensory-stimulation vocabulary. SSTIM covers
technique, signal construction, exposure boundaries, evidence and cautions, and
we expect to keep covering them; HED is a generated event-semantic profile over
our native record, never primary storage. Where the two disagree about what a
record means, our adapter is one-way and versioned, and the loss is declared.

The six questions above are all of the form "have we encoded this the way you
intend", and a "no, and that is out of scope for HED" is a useful answer to
four of them. Question 6 is the exception: it is a reproducible crash, and we
will file it wherever you prefer.
