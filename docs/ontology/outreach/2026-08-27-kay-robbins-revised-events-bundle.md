# Kay Robbins: revised events pair after the 25 August meeting

**Status.** Drafted 2026-08-27, to be sent by Renato. The attachments are in
[`2026-08-27-kay-robbins-revised-events-bundle/`](2026-08-27-kay-robbins-revised-events-bundle/).

Prof. Kay Robbins (HED Working Group) met with Renato on 2026-08-25 at 16:00
CEST, the meeting ADR 0025 records as requested. She reviewed
`test/fixtures/hed-bundle/events.tsv` and `events.json` live and asked for a
revised pair by email: better `event_id` descriptions, a longer list of events,
and a pause built from offset and onset. This file is that message; the
directory beside it is what goes with it.


## What she ruled

1. **A pause is `Offset` then `Onset` on the delivery scope.** Not the HED
   `Pause` tag (`Property/Data-property/Data-marker/Temporal-marker/Pause`,
   `HED_0012527`). That tag is messy, effectively unused, and was designed for
   suspending an *EEG recording* back when storage was expensive, not for
   suspending a stimulus. `Inset` goes with it. This answers item 3 of the
   [2026-08-18 questions](2026-08-18-hed-working-group-questions.md) and ADR
   0025's open item 3, both of which asked whether `Inset` was right for a
   resume. It was not.
2. **Drop the `event_type` and `HED` columns from `events.tsv`.** `event_id`
   carries the SSTIM event type, and HED rides in the sidecar `Levels` and `HED`
   maps, spliced from the value columns with `{curly_braces}`. A materialised
   `HED` column is not the idiom.
3. **Do not build a HED schema for SSTIM.** It is possible, and she does not
   think it is worth it for a vocabulary this size. Stay with the crosswalk.
4. **Look at STIM BIDS**, the BIDS extension for stimulation data, as the way to
   get closer to both groups:
   [design document](https://docs.google.com/document/d/1DoQghbJlQksCHEFs0boT816p3ejX2Hd9l-OWDTXFtV8/edit),
   [bids-specification#2022](https://github.com/bids-standard/bids-specification/pull/2022),
   [bids-discussion thread](https://groups.google.com/g/bids-discussion/c/n6l45FKj4Ao).

She also suggested HED's UUID tag
(`Property/Informational-property/Metadata/Metadata-identifier/UUID`,
`HED_0012782`) for linking HED data to SSTIM. See the identifier note below for
where that landed.


## What changed in the attached pair

Thirty events instead of five, over 1740.5 s, covering ten of SSTIM's eleven
session event types: `session-open`, `playback-start`, `playback-pause`,
`playback-resume`, `playback-stop`, `parameter-changed`,
`safety-limit-applied`, `engine-fallback`, `observation-collected`,
`session-complete`. The one not exercised is `session-interrupt`, which is the
alternative closure to `session-complete` and cannot appear in the same session.

Two pauses, 360.000 s to 420.000 s and 1080.000 s to 1140.000 s, each an
`(Def/Sstim-delivery, Offset)` followed by an `(Def/Sstim-delivery, Onset)`.
Neither `Pause` nor `Inset` appears. There are also two genuine stops, at
780.000 s and 1740.000 s, the first followed by a fresh `playback-start`, so the
pause and stop collision is visible inside the file rather than only asserted in
the loss note: rows 8 and 15 emit identical HED, as do rows 9 and 16.

The beat frequency steps 10, 8, 6, 6, 10, 40, 10 Hz across the session, which
makes this a *segmented* stimulus in the sense of ADR 0025 decision 5, carried
as piecewise `parameter-changed` events rather than flattened or traced. The
delivery scope opens and closes four times and the alternation is checked.

Every `event_id` level carries a `Description` saying what the occurrence is and
which scope it opens or closes, and a `TermURL` resolving to the SSTIM concept
that defines it.

Columns are `onset`, `duration`, `event_id`, `mod_frequency`, `level`.
`mod_frequency` and `level` are spliced into the `event_id` annotation, so a
rate is stated inside the delivery scope it applies to and a level inside the
control action that set it. A `parameter-changed` row splices both and populates
exactly one, so the same event type carries either a rate change or a level
change without a third column to say which.


## The identifier question, and why there is no UUID column

A first revision carried a `sstim_event_uuid` column annotated
`(Metadata-identifier, UUID/#)`, one UUID per row, described as resolving at
`https://w3id.org/sstim/implementation/bsclab/session-event/{uuid}`. That was
wrong twice and the column is gone.

**The IRI did not exist.** `scripts/locate-iri.py` finds nothing at that path in
any of the five places SSTIM things live, and `session-event` is not one of the
implementation subpaths the w3id routes serve. It was a plausible looking
identifier that resolved to nothing, which is worse than no identifier.

**Per-row identity was not the point.** The value of pointing a HED annotation
at SSTIM is the shared definition of *what a binaural beat is*, or an isochronic
tone, which is what a second reader has to agree with us about before any number
in the file means anything. That definition already has a stable public IRI
(`https://w3id.org/sstim/vocab#techBinauralBeats`). It is constant for the whole
file, so it is not a column.

**No HED 8.4.0 tag can carry an SSTIM IRI.** Measured with hedtools, three ways
in and all three closed:

| Form | Result |
|---|---|
| `URL/https://w3id.org/sstim/vocab#techBinauralBeats` | `TAG_INVALID`, extra slashes `//` |
| `URL/https%3A%2F%2Fw3id.org%2F…` | `CHARACTER_INVALID`, per cent sign |
| `URL/w3id.org/sstim/vocab#techBinauralBeats` | `PLACEHOLDER_INVALID` in a `Levels` annotation; in a `Definition` body it does not error there but silently unmatches every `Def/` that references it |

The third is the one that matters and it is structural rather than incidental:
`#` is HED's placeholder character, and SSTIM uses hash IRIs throughout. Only a
slash form validates (`URL/w3id.org/sstim/vocab/techBinauralBeats`), and that is
not the identifier. `Metadata/URL` (`HED_0012790`) therefore cannot hold any
absolute http URL at all in 8.4.0, which is worth reporting upstream on its own.

`UUID/` does validate, in both places a constant identity would sit: inside a
definition body, and beside the scope group in a `Levels` annotation. But it
holds a UUID, not a URI, and SSTIM mints no UUIDs for anything, so using it
would mean minting one per SSTIM term and publishing a UUID to IRI resolution
route. That is an ontology decision, not something to slip into a fixture.

So the link travels in `TermURL`, which is where a BIDS sidecar already expects
it: per level on `event_id`, on `mod_frequency` and `level`, and once for the
whole file in `SstimStimulusIdentity`. It holds the real IRI, scheme and
fragment included, and it costs nothing to mint.

**The one thing `TermURL` does not do** is appear in an assembled HED string, so
a pipeline that consumes assembled HED with the sidecar dropped sees no link at
all. If that turns out to matter, the cheapest thing that works today is
`(Metadata-identifier, UUID/…)` in the `Sstim-delivery` definition body, which
validates. That is the second question to Kay below.


## Validation

`hedtools` against a pinned HED 8.4.0, `Sidecar.validate` then
`TabularInput.validate` with `ErrorHandler(check_for_warnings=True)`: zero
sidecar issues and zero events issues. Run inside `nix develop`, which pins
`hedtools`. Assembled row 2 reads:

```
(Def/Sstim-delivery, Onset, (Sensory-event, Experimental-stimulus,
    Auditory-presentation, Frequency/10 Hz))
```


## What this pair is not

Hand authored correspondence, not a generated bundle. `make hed-bundle-check`
does not see this directory, and these files are not the ADR 0025 demonstrator.
They are the version prepared for Kay, kept so the wording and the shape can be
compared against whatever the generator produces once the crosswalk absorbs her
rulings.

**Still outstanding in the repo**, and deliberately not done in the same change
as this message:

- `static/schemas/sstim-hed-event-map.json` is at mapping 0.4.0 and still maps
  `eventPlaybackPause` to `Pause` and `eventPlaybackResume` to `Inset`, which
  contradicts ruling 1. Fixing it is a 0.5.0 bump plus explicit loss
  declarations on all four entries in the two collision pairs: pause and stop
  then emit identical HED, as do resume and start.
- `scripts/generate-hed-bundle.py` still emits a materialised `HED` column and
  an `event_type` column, which contradicts ruling 2.
- ADR 0025's "Meeting requested" section still reads as though the meeting is
  ahead of us. Its item 3 now has the answer recorded above; item 4 remains
  unanswered.

**Resolved before sending.** The generated demonstrator fixture that had been
hand edited during the meeting was restored to generator output in `c16acbf`.
`make hed-bundle-check` now passes on `main`.


## Message

> Subject: SSTIM events.tsv and events.json, revised after our 25 Aug call
>
> Hi Kay,
>
> Thanks again for the time. The revised pair is attached.
>
> What changed: the `event_type` and `HED` columns are gone; `event_id` now
> carries the SSTIM event type, with a fuller description and a resolvable
> `TermURL` per level; thirty events instead of five, over 1740 s, covering ten
> of our eleven event types; and the two pauses (360 s to 420 s, 1080 s to
> 1140 s) are an `Offset` on the delivery scope followed by an `Onset`, with no
> `HED_0012527` anywhere. There are two real stops as well, so you can see the
> pause and stop collision in the file.
>
> Both files validate with hedtools against 8.4.0, no errors and no warnings.
>
> Two questions.
>
> Pause and stop now emit identical HED, and so do resume and start: rows 8 and
> 15 are byte identical, as are rows 9 and 16. We declare that in the sidecar as
> information a HED-only reader cannot recover. Is that the right way to handle
> it, or would you carry the distinction some other way?
>
> On your UUID suggestion: what we most want to link to is the shared definition
> of the stimulation itself, what a binaural beat is or an isochronic tone,
> rather than the identity of an individual row. Those definitions are constant
> for a whole file, so we have put them in `TermURL` rather than in a column.
>
> We could not get the IRI into a tag at all. SSTIM uses hash IRIs
> (`https://w3id.org/sstim/vocab#techBinauralBeats`), and `URL/` rejects the
> scheme on the double slash, rejects percent encoding on the `%`, and reads the
> `#` as a placeholder, so in a `Levels` annotation it is `PLACEHOLDER_INVALID`
> and in a `Definition` body it quietly unmatches every `Def/` pointing at it.
> As far as we can tell `Metadata/URL` cannot hold any absolute http URL in
> 8.4.0. Is that intended?
>
> `UUID/` does validate, both in a definition body and beside a scope group. Is
> in-band identity something HED tooling actually keys on? If so we would mint a
> UUID per SSTIM term and publish the resolution; if `TermURL` is enough, we
> would rather not.
>
> Best,
> Renato
