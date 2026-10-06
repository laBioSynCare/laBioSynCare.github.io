# ADR 0061: SSTIM's universal namespaces carry no framework's or implementation's structure

**Status:** Accepted · 2026-10-05 · direction decided by the maintainer; the
migration lands on the 0.19.0-dev line, which is not released before it

## Context

GB-01 of the [2026-09-30 review](../ontology/reviews/2026-09-30-what-a-green-gate-does-not-see.md)
found BSC implementation structure in the namespaces every adopter imports.
Measured again on 2026-10-05 with an independent probe:

- **BSC's catalog model is in `sstim#`.** That covers `Voice`, `VoiceType`,
  the four voice classes, `composedOf`, `PresetGroup` and `inGroup` (with the
  five groups in `sstim-v:`), `hasBreathGuide` ("true iff the preset contains
  exactly one voice with isOn=true") and `isBreathReference`. The Martigli and
  Symmetry parameters that [Directions](../ontology/SSTIM_DIRECTIONS.md) §3
  already names are there too, and the public shapes carry the catalog rules
  that go with them. Directions §3 now lists the full set.
- **Four `sstim-ex:` values record one implementation's state:**
  `notCurrentlyDeliverableByBSCLab`, `notCurrentlyUsedInBSCLab`,
  `outsideBSCLabScope` and `contextBscLabPrototype`. The committed instances
  use them 20 times, without a scope.
- **38 live definitions cite BSC, BioSynCare or a catalog field.** About 16
  take their meaning from BSC; they are the terms above. The other 22 are
  generic concepts carrying a BSC remark. Some remarks are provenance ("the only
  one the BSC catalog ever used"), some are implementation status ("BSC Lab does
  not deliver ultraviolet radiation at the body"), and some are pending policy
  notes.
- **SSTIM's own preset contract still enumerates the five groups.**
  [ADR 0051](0051-sstim-preset-contract.md) calls grouping "a framework's
  editorial scheme", and it already replaced `hasBreathGuide` with a single
  breath reference.

The manifest gives `sstim-patch-studio.ttl` the role `implementation-profile`,
but that role reaches neither the IRIs, nor the Full profile, nor the namespace
catalogue. 0.19.0 is the first release the Community Group publishes
([ADR 0059](0059-community-group-publishes-sstim.md)). On 2026-10-05 the
maintainer decided that SSTIM must be neutral, not dependent on BSC.

## Decision

1. **The rule.** A term belongs in `sstim#`, `sstim/vocab#`, `sstim/exposure#`,
   `sstim/shapes#` or `sstim/ecosystem#` only if its meaning holds without any
   one framework, product, catalog format or implementation. A definition may
   name one as an example. It may not depend on one, record its status, or carry
   its policy notes.
2. **BSC's structure moves to the BSC framework.** The catalog model, the preset
   groups, and the Martigli and Symmetry parameterisations are declared in a BSC
   framework vocabulary under `https://w3id.org/sstim/framework/bsc/`, together
   with the shapes that enforce them. That is ADR 0007's framework path, and
   CLAUDE.md §5.1 already places "grouping logic" and "composition rules" there.
   The vocabulary imports SSTIM, and the framework's maintainers version and
   publish it. It is part of no SSTIM profile or snapshot. The Workbench loads it
   as BSC Lab's framework.
3. **Implementation status becomes neutral and scoped.** Implementation-neutral
   values replace the three status values. They are asserted through the
   existing scoped `KnowledgeStatusAssertion`, whose scope names the
   implementation. `contextBscLabPrototype` becomes an implementation-neutral
   prototype context. A shape requires the scope wherever a delivery status is
   used.
4. **Generic concepts keep their IRIs and lose the dependence.** Their
   definitions are rewritten. Provenance moves to `skos:historyNote`, and status
   and policy remarks leave the definition, since status is data (rule 3).
5. **SSTIM keeps what is generic.** Breath guidance becomes a neutral link from
   a preset to the track that guides it, as the preset contract's breath
   reference already is. The contract's `group` loses its enum. Generic signal
   parameters in `sstim-patch-studio.ttl` stay. A term there that means
   something only inside one tool (an index into its pattern list, say) follows
   rule 1, and CLAUDE.md §5.1 still bars classes and concepts from
   implementation paths.
6. **Nothing is deleted.** Every moved or replaced term stays in SSTIM,
   `owl:deprecated` with `dct:isReplacedBy`. The full-equivalence baseline
   records the exception, as it did for
   [ADR 0054](0054-owl-dl-conformance-and-the-duration-datatype.md)'s
   deprecation.

**Ordering (normative).** 0.19.0 is not cut until the migration has landed and
every `dct:isReplacedBy` target dereferences. The migration edits protected
files (CLAUDE.md §3.4), so it starts only on an instruction naming them. It
should land after [ADR 0060](0060-every-unversioned-iri-resolves-to-a-release.md)'s
routes are live, so that no deprecation reaches a term IRI before its release
does.

## Alternatives considered

- **Keep the terms and state that the module is an implementation profile.**
  Rejected by the maintainer. The role never reaches the IRIs or the Full
  profile, so every adopter would import BSC's taxonomy under the Community
  Group's name.
- **Move them to an implementation path.** Ruled out: CLAUDE.md §5.1 bars
  classes and concepts there, and BSC is a framework, not an implementation
  (ADR 0007).
- **A BSC module inside SSTIM's manifest, in its own namespace.** Rejected. The
  manifest is SSTIM's release set, so BSC would still ship in every snapshot the
  Community Group publishes.

## Consequences

- Adopters meet deprecations, never broken IRIs. SSTIM's shapes stop
  constraining the moved terms, and the BSC vocabulary's shapes take over.
- The committed BSC presets and experiments move to the new terms. The Workbench
  presets page reads whatever a preset declares (GB-10).
- One more upstream w3id change routes the BSC vocabulary.
- CLAUDE.md §4 does not change: it documents BioSynCare's catalog JSON, which
  legitimately has the groups.
- SSTIM gains a worked example of its own extension pattern. A framework's
  vocabulary imports SSTIM, the reverse never happens, and the dependency points
  the right way.

## Implementation (2026-10-06)

Landed on the 0.19.0-dev line after the maintainer named the protected files.
[Directions](../ontology/SSTIM_DIRECTIONS.md) §3 lists what moved and what
stayed; the points below are what the decision text did not settle.

- **Where the framework lives.** `static/ontology/frameworks/bsc/bsc-vocab.ttl`
  (`bsc-v:`, `https://w3id.org/sstim/framework/bsc/vocab#`) and `bsc-shapes.ttl`
  (`bsc-sh:`). The manifest's inventory pattern does not reach that directory.
  The Workbench loads the vocabulary into its frameworks graph, and `void.ttl`
  describes both files as a subset of the public instance dataset.
- **"Imports SSTIM" is `dct:requires` for now.** An `owl:imports` of the
  namespace would load 0.18.0, where `sstim:breathingPeriodInitial` has the
  domain `sstim:SessionSpecification`, and every Martigli voice would be
  inferred a session specification. The import names the 0.19.0 version IRI
  once that release exists.
- **Fewer terms moved than §3 listed.** `noteCount`, `octaveSpan` and
  `cycleDuration` pass rule 1 and stayed. `hapticPattern` is deprecated with
  no replacement, because it indexed one engine's list. 39 terms are deprecated
  with `dct:isReplacedBy`.
- **Breath guidance** is `sstim:breathGuideTrack`. `PresetShape` holds it to
  one of the preset's own tracks, with an initial breathing period of at least
  3 s. The catalog's requirement that the guide be a Martigli voice is a BSC
  shape.
- **Scoped status.** The 17 delivery statuses in the committed experiments
  became `KnowledgeStatusAssertion`s scoped to
  `https://w3id.org/sstim/implementation/bsclab`. Each is dated 2026-07-10,
  the records' `dct:modified` before the migration, and generated by one
  recorded migration activity per file.
  `DeliveryStatusScopeShape` rejects a delivery status anywhere else.
- **Gates.** `make shacl-adr-0061` holds five adversarial cases to their own
  rules, with two positive controls. `preset-contract`, `shacl-instances`,
  `entailment-check`, `validate-profile` and the quality audit load the BSC
  files. `validate-profile` found the vocabulary's one OWL 2 DL defect, an
  undeclared `dct:contributor`, on its first run. `full-equivalence` records the 25
  rewritten definitions, the 16 rewritten domains and the retired shapes as
  exceptions. The term index marks every deprecated term and names its
  replacement.
- **Completed in the release review (2026-10-07).** The census above counted
  definitions, and the migration rewrote 27 of them. Searching every current
  term's annotations found the rest: five more definitions that depended on
  the catalog (two audio-track parameters defined "for a voice",
  `sstim:referenceKey` defined by the catalog's `techDesc` field,
  `sstim:ControlTrack` naming the catalog's signals as "the current kinds", and
  `sstim-v:mechAutonomic` "used for" the Martigli oscillation, now its
  example), and the notes of 14 terms recording BSC Lab's delivery status,
  platform support or pipeline. Rule 1 lets a definition name a framework as an
  example, so examples stayed; status left, as rule 3 requires. The note on
  `sstim:Track` still named `sstim:Voice` as the Patch Studio specialisation.
  `full-equivalence` records the 20 baseline fields this changed.
- **Still open.** No w3id route for `framework/bsc/vocab` or
  `framework/bsc/shapes` yet. It follows the deploy, and under this ADR's
  ordering 0.19.0 waits for it.
