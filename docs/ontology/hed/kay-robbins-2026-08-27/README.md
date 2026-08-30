# Historical HED event bundle edited with Kay Robbins, 2026-08-27

**Status: historical intermediate artifact.** This five-event pair is
superseded for correspondence by the
[11-event pair sent on 2026-08-28](../../outreach/2026-08-28-kay-robbins-sent-record.md).
It remains here as a record of the meeting edit and its mechanical repairs; it
is not the current attachment or implementation target.

Reference copy of the `events.tsv` / `events.json` pair worked through in a
meeting with Prof. Kay Robbins. It is kept here, and not under
`test/fixtures/`, because `make hed-bundle` regenerates every
`test/fixtures/hed-bundle*` directory from
[`scripts/generate-hed-bundle.py`](../../../../scripts/generate-hed-bundle.py)
and would overwrite it. Nothing generates this directory.

## What the redesign did

The shape differed from what the generator emitted at the time, and the
difference was the point of the meeting:

- **`event_type` is folded into `event_id`.** One categorical column carries the
  SSTIM session event type, and the sidecar annotates its `Levels`. The
  generator then still emitted `event_type` as a separate column.
- **There is no `HED` column.** The per-level `HED` map in the sidecar replaces
  it, which is the ordinary BIDS pattern: annotate the categories once rather
  than repeating an assembled string on every row.
- **`mod_frequency` is a native column**, spliced into the annotation as
  `{mod_frequency}` so the breathing frequency travels with the event rather
  than being flattened into prose.
- **`Sstim-delivery` is reduced to a bare `Definition/`**, with the sensory tags
  moved onto `mod_frequency`.

## What was corrected here, and what was not

The committed pair was malformed in transit. Three mechanical repairs, none of
them a change of intent:

1. **Tabs had become spaces.** Every row separated `event_id` from
   `mod_frequency` with four spaces, so the file parsed as three columns rather
   than four. hedtools reports it exactly:
   `Column named 'event_id    mod_frequency' found in file, but not specified
   as a tag column`, followed by `mod_frequency` being referenced but absent.
2. **`n/a` was quoted** as `'n/a'`, which BIDS reads as a literal value.
3. **`event-stop` was used but never declared.** The table uses it twice; the
   sidecar declared `event-pause` and `event-resume`, which the table never
   uses. Without the declaration hedtools reports `SIDECAR_KEY_MISSING:
   Category values ['event-stop'] do not exist in metadata`. It is a real
   concept, `sstim-v:eventPlaybackStop` in `SessionEventTypeScheme`, and HED
   needs its `Offset` to pair the `Onset` that `event-start` opens, so it is
   annotated `(Def/Sstim-delivery, Offset)`. The unused `event-pause` and
   `event-resume` declarations are kept: a sidecar describes the column, not
   only the rows of one file.

The corrected pair **validates clean against HED 8.4.0**: zero sidecar issues
and zero tabular issues via hedtools 1.2.0. The uncorrected pair does not.

One thing was deliberately left alone. The `GeneratedHedColumn` note still
describes "the events.tsv column named HED", which this redesign removes. That
is prose about intent rather than malformation, so it is the meeting's to
settle.

## State recorded at the time

At the time of this artifact, adopting this shape meant changing
`generate-hed-bundle.py` (its `columns` list started `onset, duration, event_id,
event_type`) and the checks that read its output: `hed-roundtrip` required an
`event_type` column and failed without one. Mapping 0.5 subsequently adopted
the sidecar shape broadly: generated bundles now use the SKOS notation in
`event_id`, retain the unique source occurrence in `sstim_event_id`, and carry
no materialised `event_type` or `HED` column. A separately versioned
[30-event expanded alternate](../../outreach/2026-08-27-kay-robbins-revised-events-bundle.md)
was not sent; this five-event pair remains frozen as the historical intermediate
artifact.
