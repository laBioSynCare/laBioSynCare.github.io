# Session package — a patch as a portable scientific object

**Status:** implemented 2026-07-31 · `src/portability/sessionPackage.js`,
`src/portability/patchProjection.js`, `make session-conformance`

A Patch Studio patch can be packaged so that another BSC Lab instance — deployed
by someone else, configured differently, on a different origin — reconstructs it
exactly, and so that a reader can tell precisely what the semantic projection
did and did not carry.

This is the interchange half of
[`PORTABLE_DEPLOYMENT.md`](PORTABLE_DEPLOYMENT.md). That document is about
moving *an instance*; this one is about moving *an object*.

---

## 1. What is in a package

| File | Role |
|---|---|
| `manifest.json` | What this is, which build produced it, which SSTIM release it was projected against, and per-file checksums |
| `session.patch.json` | **The executable truth.** The complete `patch-studio-model-1` document, lossless |
| `session.ttl` | Property-level SSTIM projection of the declared mappable subset |
| `session.jsonld` | The same statements as JSON-LD |
| `mapping-report.json` | Everything the projection could not carry, and why |

**The projection is deliberately not the payload.** A package that shipped only
RDF would quietly lose whatever the ontology cannot yet express; one that shipped
only JSON would not be a scientific object. Shipping both, with the gap written
down, is the only arrangement honest in both directions — which is
[ADR 0026](../decisions/0026-patch-studio-catalog-bridge.md) applied to RDF.

Serialisation is canonical (keys sorted) throughout, so the same patch and the
same options always produce byte-identical output. That is what makes the
checksum meaningful and the conformance test possible.

---

## 2. The ontology finding

**SSTIM has no patch-studio-native session class.** This was verified, not
assumed. Typing a projection as `sstim:SessionSpecification` with `sstim:Voice`
tracks and running pyshacl against `sstim-shapes.ttl` produces:

```
Focus Node: ex:probe
Message:    SessionSpecification must reference exactly one Preset.

Focus Node: ex:probe-voice-1
Message:    Voice must be typed as exactly one of the four subtypes:
            Binaural, Martigli, Martigli-Binaural, or Symmetry.
```

Both constraints are correct as ontology. A `sstim:SessionSpecification` is the
*execution of a catalog preset*; a `sstim:Voice` is one of four catalog voice
types. A patch is a live authoring object whose tracks — `Carrier`, `Noise`,
`Drone`, `Sample`, nine visual types, `Vibration` — have no catalog voice at all.

Three findings ship inside every package's mapping report:

| id | Severity | Finding |
|---|---|---|
| **S1** | blocking | No patch-studio-native session class. The projection is emitted as a `prov:Entity` carrying real SSTIM properties, not as a `SessionSpecification`. |
| **S2** | blocking | Patch Studio track types have no corresponding `sstim:Voice` subtype. |
| **V1** | divergence | `rotationSpeed`, `visualSideCount`, `visualDensity`, `stimulationIntensity` and `hapticPattern` have `rdfs:domain sstim:SessionSpecification` — one visual and one haptic configuration per session — while a patch may carry nine visual tracks. |

Minting a class here was not available: `CLAUDE.md` §5.1 forbids declaring OWL
classes under an implementation path, and §3.4 forbids editing the ontology
without explicit instruction. **Closing S1/S2/V1 is ontology work with a human in
the loop** — a concrete, bounded research task rather than a coding oversight.

Until then the projection claims exactly what it is, in the package itself:

> Property-level SSTIM projection over the declared mappable subset. Not a
> `sstim:SessionSpecification` and not catalog-conformant — see structural
> findings S1 and S2. The lossless patch in the package remains the executable
> truth.

---

## 3. The mapping table cannot drift from the ontology

`PARAM_PROPERTIES`, `CONTROL_PROPERTIES` and `TIMING_PROPERTIES` name SSTIM
properties. A test parses `sstim-patch-studio.ttl` and `sstim-core.ttl` and fails
if any of them:

- names a property the ontology does not declare;
- records a domain the ontology disagrees with;
- ignores a patch-studio property without an entry in `DELIBERATELY_UNUSED`;
- keeps an exclusion for a property the ontology has since dropped.

That last pair is the useful part. The table originally listed
`carrierFreqLeft`/`carrierFreqRight` as having no Patch Studio counterpart —
wrong, because `BinauralBeat` is parameterised as a carrier pair, exactly as
[ADR 0005](../decisions/0005-binaural-carrier-pair-only.md) requires. Four
mappable parameters were being reported as unmapped. The accounting test is what
makes that class of error visible instead of plausible-looking.

---

## 4. Conformance levels

`make session-conformance` serves one build on two ports — genuinely separate
origins, each with its own browser profile — packages a patch on A, opens it on
B, and checks:

**Level 1 — semantic equivalence.** The SSTIM projection is identical: same
properties, same values, same mapping report. What a third party querying the
RDF would see.

**Level 2 — execution-parameter equivalence.** Every track, parameter and
modulation link is identical after reconstruction through the editor's own draft
model, and re-packaging on B is byte-identical to A. What the audio engine would
actually play.

**Level 3 — rendered-signal comparison. Not attempted.** It needs deterministic
offline rendering per engine, which does not exist yet. Claiming it on the
strength of parameter equality would be dishonest, so the harness prints a `skip`
line rather than omitting it silently. Note also that bit-identical real-time
audio across browsers and hardware is not a promise worth making.

Current result — 20 assertions:

```
ok   [integrity] package checksum verifies on a different origin
ok   [privacy]   package carries no forbidden identifier
ok   [privacy]   the exporting account id did not travel
ok   [privacy]   instance B storage was not written by opening the package
ok   [L2]        no parameter drift — 32 parameters compared
ok   [L2]        modulation links survive
ok   [L2]        re-package on B is byte-identical to A
ok   [L1]        SSTIM projection is identical — 4228 bytes of Turtle
ok   [L1]        mapping report is identical — 33 mapped, 9 unmapped
ok   [L1]        the package does not claim catalog conformance
skip [L3]        rendered-signal comparison
```

---

## 5. The privacy boundary is enforced, not assumed

A package is scanned for a Firebase API key, the `local-device` pseudonym, a
`uid` field and a `firebaseUid` — **on the way out and again on the way in**.
Building or opening a package containing any of them throws.

The scan runs over the decoded file contents, never the outer document. Nesting
files in an enclosing JSON object escapes every inner quote, so `"uid":` becomes
`\"uid\":` and a pattern written against the plain form silently stops matching.
The guard would still be present, still run, and catch nothing. A test pins this.

The conformance harness re-checks the same boundary from outside the module, on
a different origin, with a real account identifier present on instance A.

---

## 6. What this does not do

- **No catalog conversion.** Patch → catalog preset stays gated behind the
  human metadata step in ADR 0026. Evidence tier, intended outcome and safety
  metadata are never inferred from signal parameters.
- **No claim of scientific validity.** A package records what a patch *is*, not
  that it does anything. Nothing here asserts an effect.
- **No publication.** Packages are files. Publishing them is
  [ADR 0039](../decisions/0039-sharing-model-and-the-shared-backend-question.md)
  Tier 3 and needs the static publication layer, which does not exist yet.
