# ADR 0026 — Patch Studio → catalog/RDF: a gated one-way converter over a mappable subset, not a native catalog authoring model

**Status:** Accepted — 2026-07-12 · **RDF half implemented, catalog-JSON half
not; catalog implementation is now conditional.**
`src/portability/patchProjection.js` is the gated one-way converter to SSTIM RDF
over the declared mappable subset, with a machine-readable report of what did not
travel. It projects a `sstim:Preset`, not the `sstim:Patch` this ADR's successor
[ADR 0040](0040-patch-studio-native-session-and-track-classes.md) minted and
[ADR 0041](0041-stimulus-description-layers-and-the-canonical-schema-gap.md)
withdrew. No converter to the `header` + `voices` catalog JSON exists.

**Planning amendment — 2026-08-08.** The mapping, no-silent-loss,
human-metadata, and private-catalog boundaries below remain binding if the JSON
adapter is built. Its implementation is no longer assumed: it follows the
merged-model, coalition-review, and consumer-contract gate in
[`PATCH_STUDIO_CONFORMANCE_AND_NEUTRALITY.md`](../ecosystem/PATCH_STUDIO_CONFORMANCE_AND_NEUTRALITY.md).
Deferral does not block the mandatory Field/Studio integration in
[ADR 0046](0046-one-studio-two-authoring-modes.md).

**Model-version amendment — 2026-08-08.** The architectural separation below is
unchanged, but `patch-studio-model-2` is now the live authoring/export model.
Genuine model-1 documents remain readable through an explicit importer; model-2
fields are rejected under the model-1 tag rather than exposed to silent downgrade
by an older reader.

Drafted from the Patch Studio improvement analysis, see
[`../technical/PATCH_STUDIO.md`](../technical/PATCH_STUDIO.md) §10.1.

## Context

The [Patch Studio](../technical/PATCH_STUDIO.md) builds an in-memory patch draft
and exports a `patch-studio-model-1` object (`buildPatchExport`, §8). Today that
object is consumed only by `draftFromPatchExport()` and Firestore
(`src/firebase/patches.js`, since replaced by the storage seam in [`src/storage/`](../../src/storage/)). There is **no path**
from a patch to the preset catalog JSON ([`PRESET_FORMAT.md`](../technical/PRESET_FORMAT.md),
`header` + `voices`) or to an RDF instance under
`static/ontology/instances/presets/`. The catalog JSON is the artifact the
planned adapter would target; the knowledge browser separately consumes approved
public RDF instances through
[`src/rdf/presets.js`](../../src/rdf/presets.js). The studio has no downstream
catalog path.

The obstacle is that the two models are **structurally divergent**, not two
encodings of one thing (full table in [PATCH_STUDIO.md](../technical/PATCH_STUDIO.md) §10.1):

- **Patch Studio** — a live-modulation synthesis model: control tracks *modulate*
  sensory-track params (`{value, mods, tempoSync}`); audio track types
  `IsochronicTone`, `BinauralBeat`, `Carrier`, `Noise`, `Drone`, `Sample`, plus
  visual and haptic tracks.
- **Catalog preset** — a static parametric, audio-only session description:
  `header` (rich scientific/human metadata) + `voices[]` restricted to
  `Binaural`, `Martigli`, `Martigli-Binaural`, `Symmetry`.

So a conversion is inherently **lossy and partial**, and the catalog `header`
requires metadata — `group`, `targetBand`, `evidenceTier`, `cautionTags`,
multilingual `desc*`/`med2*`/`techDesc*`, `headphonesMode`, … — that **cannot be
derived** from a patch. This ADR settles the posture before any code is written.

## Decision

1. **Keep the two models separate; build a one-way converter, not a native
   authoring model.** `patch-studio-model-1` stays the live authoring/exchange
   model for the studio; the catalog format stays the delivery/interchange format
   (a Preset is an information content entity — [ADR 0014](0014-preset-is-not-a-protocol.md)).
   The bridge is `patch → catalog preset`, invoked explicitly ("Convert to
   preset"), never an implicit re-serialisation of every field.

2. **Convert only a declared mappable subset; block, do not silently drop.**
   - `BinauralBeat` → `Binaural` (carrier pair `fl`/`fr`, no pan —
     [ADR 0005](0005-binaural-carrier-pair-only.md)).
   - `Symmetry` control + an `IsochronicTone` → `Symmetry` voice in isochronic
     mode (`noctaves: 0`), validated by pulse rate (`CLAUDE.md` §4.7).
   - `Martigli` control modulating a carrier / binaural pair → `Martigli` /
     `Martigli-Binaural` voice (breath reference; `CLAUDE.md` §4.5).
   - `Carrier`, `Noise`, `Drone`, `Sample`, all visual, and all haptic tracks
     have **no catalog voice**. The converter reports them as blocking or
     dropped items in a pre-conversion summary; it never emits a preset that
     silently misrepresents the patch.

3. **A metadata-authoring step is mandatory, and metadata is never fabricated.**
   Conversion opens an authoring panel for the `header` fields the catalog
   requires. Copy fields obey the wellness-framing rules (`CLAUDE.md` §3.5;
   [ADR 0018](0018-evidence-integrity-and-public-claim-governance.md)); evidence
   tier / refs are entered by a human, never inferred from the audio.

4. **The public target is a BSC Lab reference preset, SHACL-gated.** Output is a
   BSC Lab reference preset (bsclab IRI, `static/ontology/instances/presets/`),
   and the RDF instance is validated against `sstim-shapes.ttl` **before** it is
   written or bundled (`CLAUDE.md` §5.4). The private BioSynCare/BSC catalog stays
   outside this repo. New instance TTL is authored only under explicit human
   instruction ([ADR 0004](0004-protected-ontology-files.md), `CLAUDE.md` §3.4).

5. **Sequence: JSON first, RDF second.** Ship `patch → catalog JSON` (+ the
   `schemas/preset.schema.json` validation from `CLAUDE.md` §10) first; the
   `catalog → RDF instance` step reuses the mapping already documented in
   [PRESET_FORMAT.md](../technical/PRESET_FORMAT.md) "Relationship to the RDF
   ontology" and lands as the `src/rdf/export.js` work already tracked in
   [`../../TODO.md`](../../TODO.md).

## Alternatives considered

- **Make the Patch Studio author catalog presets natively.** Rejected — collapses
  the live-modulation model (control tracks, per-param `mods`, tempo sync, visual/
  haptic) into a 4-voice audio-only static format, destroying the studio's reason
  to exist.
- **Auto-derive the header metadata.** Rejected — `group`, `evidenceTier`,
  `cautionTags`, and the descriptions are scientific/editorial judgements, not
  functions of the signal; inferring them would manufacture unfounded claims
  (`CLAUDE.md` §3.5, ADR 0018).
- **Export the whole patch lossily into a preset.** Rejected — silent data loss;
  a `Noise`/`Drone`/visual patch would round-trip to something it is not.
- **Do nothing (status quo: hand-author catalog presets separately).** Rejected —
  that is the current dead-end; the studio never feeds the catalog it exists to
  seed.

## Consequences

- Unlocks the studio's purpose: a designed patch (within the subset) can become a
  validated, citable BSC Lab reference preset the browser and pipeline consume.
- The converter's blocking/authoring UX makes the subset boundary and the
  no-fabricated-metadata rule visible to the user, rather than hidden in code.
- Introduces a new module (`src/ui/creator/patchToPreset.js` or similar) plus the
  authoring panel; naturally paired with the §10.2 decomposition and §10.3 tests
  in [PATCH_STUDIO.md](../technical/PATCH_STUDIO.md) (pure mapping = unit-testable).
- Any change to the preset schema must be coordinated per `CLAUDE.md` §11 and the
  `src/README.md` preset-format checklist.
- The RDF step is gated by the protected-ontology-file policy; no instance TTL is
  auto-written.

## See also

- [`../technical/PATCH_STUDIO.md`](../technical/PATCH_STUDIO.md) §10 — the improvement plan this decision anchors.
- [`../technical/PRESET_FORMAT.md`](../technical/PRESET_FORMAT.md) — the catalog target and its RDF mapping rules.
- [ADR 0005](0005-binaural-carrier-pair-only.md) — binaural as a carrier pair only (no pan).
- [ADR 0006](0006-one-class-per-technique.md) — voice classes named `*Voice`.
- [ADR 0014](0014-preset-is-not-a-protocol.md) — a Preset is an information content entity.
- [ADR 0018](0018-evidence-integrity-and-public-claim-governance.md) — no fabricated evidence; public-claim governance.
