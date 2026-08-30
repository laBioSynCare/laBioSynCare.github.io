# Kay Robbins HED follow-up — sent record, 2026-08-28

**Status: sent.** Renato emailed Kay Robbins directly on 2026-08-28 at 08:00,
as displayed in the supplied Gmail Sent record, with `events.json` and
`events.tsv` attached. The screenshot does not encode a timezone, so this
record does not infer one.

This is a privacy-safe public provenance record, not a copy of the message.
The raw email, mailbox screenshot, headers, and contact channel remain outside
Git; Gmail remains the authoritative message archive. Exact attachment copies
and a local evidence note are kept in an access-limited, gitignored
correspondence directory, consistently with
[ADR 0031](../../decisions/0031-qualified-ecosystem-records.md).

## Technical substance

The sent follow-up and its attached pair establish these changes to the material
reviewed in the 2026-08-25 meeting:

- `event_type` and materialised `HED` columns were removed;
- `event_id` carried the SSTIM event type, with a fuller `Description` and a
  resolvable `TermURL` for each level;
- the table contained 11 event rows and exercised 10 distinct SSTIM event
  types; and
- the pause from 420 s to 480 s was represented as `Offset` then `Onset` on the
  delivery scope, with no `HED_0012527`.

The message also asked how to preserve the native distinction when pause and
stop emit the same HED, and whether HED tooling expects in-band identity through
`UUID/` when a BIDS `TermURL` already carries the shared SSTIM definition.

The sender reported that both attachments validated with hedtools against HED
8.4.0 with no errors or warnings. On 2026-08-30 the exact locally archived
copies were independently revalidated with the repository-pinned hedtools:
zero sidecar issues and zero events issues, with warnings enabled.

## Attachment identity

| Attachment | Bytes | Event rows | SHA-256 |
|---|---:|---:|---|
| `events.json` | 10,074 | n/a | `aecbc457865157d898a818438a9f1d3600302eb099f6cddd0b52600f68f71a91` |
| `events.tsv` | 449 | 11 | `794839b0e7338e669e673cbc2bcacd6c5476d05b7dc6f23de6e6a0ec72537d7a` |

The sent message described the table as covering nine of eleven event types;
the attached TSV contains 10 distinct `event_id` values. Both facts are kept
here rather than silently rewriting what was sent.

The separately versioned
[30-event expanded alternate](2026-08-27-kay-robbins-revised-events-bundle.md)
is not the pair that was emailed. It remains an unsent technical alternate for
comparison with the repository implementation.
