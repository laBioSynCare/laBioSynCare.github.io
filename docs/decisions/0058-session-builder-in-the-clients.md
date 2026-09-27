# ADR 0058: A session builder in both clients, so a tool exporter only reads its own clock

**Status:** Accepted · 2026-09-27 · implemented in `sstim` 0.2.0 and
`@sstim/core` 0.2.0 (both unpublished at the time of writing)

## Context

[ADOPTION.md](../ecosystem/ADOPTION.md) §3 D names an exporter from a tool
researchers already run as the highest-leverage adoption item, and §6 gates it
on an engaged lab naming the tool, because choosing one first is a guess with a
large build attached.

Measured before this ADR, the build was larger than it needed to be. Both
published clients could resolve a profile and validate a graph, and nothing
else: a listing of every name the two packages export on 2026-09-27 found
`resolve_profile`, `latest_release`, `validate`, the report and closure types,
and the cache helpers. The only code that produced an SSTIM session was
[`src/session/sessionProjection.js`](../../src/session/sessionProjection.js),
inside the Workbench and bound to the Patch Studio's native bundle. Anyone
outside the Workbench recording a session had to write Turtle by hand from
[`examples/04-session-full.ttl`](../../examples/04-session-full.ttl), which
carries no events at all.

So every candidate exporter, PsychoPy, jsPsych, OpenSesame or Lab Streaming
Layer, would have rebuilt the same thing first: a stated clock, the stimulus,
the events, and a graph the Full profile accepts. That part is not a guess
about which tool. Only the adapter is.

## Decision

### 1. One builder, in both clients, with the same calls

`sstim.Session` and `Session` from `@sstim/core` (also importable alone as
`@sstim/core/session`, which depends only on `n3` and runs in a browser). The
calls are `signal`, `channel`, `event`, `close`, then `to_turtle`/`toTurtle`,
`validate` or `write`. Python takes snake_case keywords, JavaScript an options
object; nothing else differs.

**The clock is the caller's.** The constructor takes the timing context's
reading at open, every event takes a reading of the same clock, and the builder
computes offsets. The caller states which clock it is: `audio-hardware` for an
AudioContext, `monotonic-substitute` for PsychoPy's or LSL's. Wall-clock times
only date the record, as ADR 0048 requires.

### 2. It refuses at the call that breaks the model

A planned duration of 30 s, a carrier on a directly presented rendering, a
parameter change with no new value, a pause while nothing plays, an event before
the clock origin: each raises where it is written, naming the rule. This is not
a convenience. The JavaScript runtime cannot evaluate SHACL-SPARQL, and every
SPARQL constraint that could apply to what the builder emits is one of these
refusals, so the builder cannot produce the graphs that constraint exists to
catch. Counted against the frozen 0.18.0 shapes: fourteen SPARQL constraints
target classes the builder emits. Nine are refusals or derivations here. Four
concern predicates it never writes (the three signal-to-band relations and a
channel flicker rate), and the last, carrier agreement between a channel and its
rendering, cannot fire because the carrier is written only on the rendering.
What it derives rather than asks for follows the same logic: rendering
presence from the mechanism, the optical-radiation comfort boundary from an
infrared or ultraviolet medium, delivered time from the playback events, elapsed
time rounded up from the written offset.

### 3. The two clients emit the same triples, and a test proves it

[`packages/fixtures/session-parity.json`](../../packages/fixtures/session-parity.json)
describes one session; each suite builds it call for call and compares its
sorted N-Triples with
[`session-parity.nt`](../../packages/fixtures/session-parity.nt). The Python
suite also validates that graph against the frozen 0.18.0 Full profile with
SPARQL active. Because the JavaScript output is byte-identical, that result
stands for both clients, which is the only way a Full result from JavaScript
can be complete.

Identical output needed two rules written down. Every node is an IRI under the
caller's base, never a blank node, so the graphs compare without an isomorphism
check. Decimals are written with at most nine fractional digits, trailing zeros
dropped, and date-times at millisecond precision in UTC, which is what
JavaScript's `Date` holds.

### 4. Controlled values are SSTIM's notations, from a table the tests hold

Callers write `"playback-start"`, `"amplitude-modulation"`, `"visual-light"`:
the `skos:notation` strings SSTIM publishes, never an application's field
names. Each client resolves them from a table, not a network call, so a
recorder works offline. Both suites check the table against the frozen
vocabulary in both directions: every entry is a concept of its class with that
notation, and every published concept is in the table.

### 5. It writes nothing about a participant

No identifier, no observation, no free text, and `observation-collected` is
refused because it points at an observation. ADR 0048 leaves whether an
identifiable observation belongs in a published graph to a governance decision
the builder must not pre-empt.

### 6. Three examples, not a plugin

[`examples/tools/`](../../examples/tools/) holds a PsychoPy flicker block, a
jsPsych auditory steady-state block and an LSL marker converter, each short
enough to read in a minute. Each is tested through a small stand-in for its
tool, so what is proved is the record it writes. Packaged plugins stay gated on
an engaged lab, as §6 of ADOPTION.md already says: an exporter a user runs
without reading SSTIM documentation needs a stimulus component that both
presents and describes, and that is the large build.

## Gaps the builder walked into

Recorded rather than routed around. None is fixed here: the ontology files are
protected (`CLAUDE.md` §3.4), and each is a modelling question.

1. **A visual-only session must state a master volume.**
   `sstim-sh:SessionSpecShape` requires `sstim:masterVolume` and leaves
   `sstim:masterBrightness` optional, the audio-centrism ADR 0041 corrected on
   the preset but not here. The PsychoPy and LSL examples state `0.0`, which is
   true and says nothing.
2. **A trial is not a session.** Planned duration is bounded to 60 to 7200 s,
   so a ten-second steady-state trial cannot be recorded as one. The builder
   models a block. Whether the lower bound belongs in the model is open.
3. **No timing authority fits a monotonic clock that timed audio.**
   `sstim-v:timingMonotonicSubstitute` is defined as standing in "because no
   audio was rendered". PsychoPy and LSL clocks are monotonic and are not the
   audio device's, and both routinely time sessions that include sound. The
   examples choose visual stimuli so the definition holds; a PsychoPy tone block
   has no honest value today.
4. **Two modality schemes share notations and state no relation.**
   `sstim:SensoryModality` has six concepts, `sstim-ex:PerceivedModality`
   twelve, and nothing says how "tactile" or "proprioceptive" relate to
   "somatosensory". The builder carries a channel's perceived modality up to the
   session only where the notation is identical, and otherwise omits it rather
   than guess.
5. **A session still needs a preset**, as
   [examples/README.md](../../examples/README.md) already records. The builder
   mints one named for the session, carrying only its link to the stimulus.

## Consequences

- Both packages move to 0.2.0, with `Project-URL` and repository fields
  repointed at `w3c-cg/sstim`, the change ADOPTION.md §3 C deferred to the next
  release. Publishing is a separate step.
- `make sstim-package` runs the builder and example tests; `make test` runs the
  JavaScript suite, and `vite.config.js` aliases `@sstim/core/session` to this
  checkout so the jsPsych example is tested before it is published.
- The candidate tools, ranked, are tracked in ADOPTION.md §3 D.
- **Offline validation had to be fixed first.** A recorder that validates
  before writing is only usable on a rig with no network if validation can run
  there, and it could not: both resolvers fetched the release manifest on every
  call, `offline` included, although the 0.1 READMEs said repeated runs were
  offline. A frozen release's manifest never changes, so both now cache it by
  version, and a run pinned to a release works with no network once it has run
  online. An unpinned run still asks the network which release is newest,
  because that is the question. The PsychoPy example keeps an explicitly
  unvalidated copy if `write()` refuses, since a run is not free to repeat.
