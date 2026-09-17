# SSTIM by example

Four short files meant to be copied. If you have not read anything else about
SSTIM, start at [docs/ADOPTING_SSTIM.md](../docs/ADOPTING_SSTIM.md), which is
the half-hour version of everything these files assume.

| File | Profile | Shows |
|---|---|---|
| [`01-stimulus-core.ttl`](01-stimulus-core.ttl) | Core | One signal rendered through sound and light, asserted to be the same signal |
| [`02-stimulus-core-plus.ttl`](02-stimulus-core-plus.ttl) | Core Plus | The same file, one profile step up |
| [`03-protocol-full.ttl`](03-protocol-full.ttl) | Full | Your own framework, a published technique |
| [`04-session-full.ttl`](04-session-full.ttl) | Full | Configuration, plan and execution kept apart |

The fastest way to see what a profile buys you:

```bash
diff 01-stimulus-core.ttl 02-stimulus-core-plus.ttl
```

The whole data difference is two lines, and those two lines are the boundary
between Core and Core Plus.

All four share the `https://example.org/stimuli/` namespace and read as one
small dataset: the preset in 04 points back at the stimulus specification in 01
and 02. Each file also validates on its own.

## They are checked, not just written

`make examples-check` holds each file to the profile its header declares:

- **Conformance** against that profile's own shapes, not against Full.
- **Containment**: every SSTIM term used must be defined inside that profile's
  closure. SHACL is silent about a predicate it has never heard of, so without
  this an example could conform perfectly while using terms a Core consumer
  would never load.
- **Namespace discipline**: no file may mint an IRI under
  `https://w3id.org/sstim`.

Three negative fixtures inside the checker prove the three checks still reject.
The gate runs as part of `make validate`.

## Two rough edges these files walked into

Recorded because the next person will hit them too, and because an example that
quietly routes around a rough edge teaches the reader to route around it as well.

**Core states a carrier but not a rate.** `sstim:renderingCarrierHz` is in the
Core closure, while `sstim:hzMin` and `sstim:hzMax` are in Common, which is
Core Plus. So a Core consumer can read the 200 Hz tone being modulated but not
the 10 Hz modulating it, which is usually the number that matters. That is why
example 02 exists rather than being a footnote in 01.

**A session needs a preset.** `sstim:SessionSpecification` must reference
exactly one `sstim:Preset`, so there is no way to record a session of a
`sstim:StimulusSpecification` alone. Example 04 therefore declares a preset it
would not otherwise need. Whether that coupling is right is an open question on
the configuration model, not something an example should decide.
