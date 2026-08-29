# HED event bundle as edited with Kay Robbins, 2026-08-27

Reference copy of the `events.tsv` / `events.json` pair worked through in a
meeting with Prof. Kay Robbins. It is kept here, and not under
`test/fixtures/`, because `make hed-bundle` regenerates every
`test/fixtures/hed-bundle*` directory from
[`scripts/generate-hed-bundle.py`](../../../../scripts/generate-hed-bundle.py)
and would overwrite it. Nothing generates this directory.

## What the redesign does

The shape differs from what the generator emits today, and the difference is
the point of the meeting:

- **`event_type` is folded into `event_id`.** One categorical column carries the
  SSTIM session event type, and the sidecar annotates its `Levels`. The
  generator still emits `event_type` as a separate column.
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

## Still open

Adopting this shape means changing `generate-hed-bundle.py` (its `columns` list
still starts `onset, duration, event_id, event_type`) and the checks that read
its output: `hed-roundtrip` requires an `event_type` column and fails without
one. Until that happens the generated fixtures keep the old shape, and this
directory is the record of where the format is going.
