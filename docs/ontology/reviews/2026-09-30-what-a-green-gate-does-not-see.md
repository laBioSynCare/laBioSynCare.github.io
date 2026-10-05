# What a green gate does not see: review, 2026-09-30

**Status:** findings only, nothing fixed. The findings are to be taken on one at
a time; their order and work items are in
[improvement plan §1.6](../IMPROVEMENT_PLAN.md#16-close-what-a-green-gate-does-not-see).

**Scope:** commit `5ef70f2` on the `0.19.0-dev` line (latest release `0.18.0`).
Covers the 18 manifest-owned modules, the 24 committed instance files, the
Workbench RDF code in `src/rdf/`, the Python client in `packages/sstim/`, and the
live w3id routes.

**Relation to earlier reviews:**

- Extends §1 of the [second pass](2026-08-17-second-pass.md) (classes with data
  and no shape) from classes to properties.
- Re-measures KR-12 from the
  [2026-07-13 audit](2026-07-13-rdf-knowledge-representation-audit.md).
- Disagrees with one conclusion of §6 of the [third pass](2026-08-17-third-pass.md),
  for the reason given under GB-05.

Every finding below is present on a commit that passes the full gate:
`nix develop --command make validate` exited 0 on `5ef70f2`, which it records
in `.validation.log`. That is the thread running through the review: each item
is something the gate is not built to see, so a green gate says nothing about it.

## Method

Every claim names its instrument (CLAUDE.md §3.6). Most measurements come from
probes written for this review rather than from the project's own gates, so a
blind spot in a gate could not also be a blind spot in the review.

The probes load the modules through `static/ontology/manifest.json` and the
instances from `static/ontology/instances/**`, using rdflib inside
`nix develop`. The reproduction for each finding is given inline, and Appendix B
states how the counts were made.

## Summary

The IDs follow the suggested order: what is time-sensitive first, then what does
the most for its cost.

| ID | Finding | Kind | Protected files |
|---|---|---|---|
| GB-01 | BSC implementation structure is published in the universal namespaces | neutrality | yes |
| GB-02 | 83 of 273 live properties, and 6 instantiated classes, have no SHACL constraint | validation | yes |
| GB-03 | Public annotations expose the authentication ID, which reverses the RDF pseudonym | privacy | no |
| GB-04 | Plain SPARQL returns nothing in the Workbench, including the CLAUDE.md §5.3 queries | usability | no |
| GB-05 | The ADR 0036 and 0037 splits are prose; OWL accepts a process on both sides | semantics | yes |
| GB-06 | 24 deprecated terms have no machine-readable replacement | hygiene | yes |
| GB-07 | Documentation and header metadata no longer match the files | drift | partly |
| GB-08 | 146 links point into the legacy repository, all at moving branches | publication | yes |
| GB-09 | Frozen releases answer only in Turtle; the JSON-LD context has no route | publication | no |
| GB-10 | The Workbench presets page lists only BSC-shaped presets | neutrality | no |
| GB-11 | Two SHACL gate targets run the identical command | efficiency | no |

"Protected" means CLAUDE.md §3.4: those items need an explicit instruction
naming each file before any edit.

## What was verified sound

These are recorded because they are the baseline, and because they are
genuinely good.

**Modules and instances (rdflib probe):**

- No SSTIM IRI appears anywhere without being declared in a semantic module.
- No term carries a label or definition in more than one module.
- Every `rdfs:isDefinedBy` names the module that declares the term.
- No shape references an undeclared SSTIM term.

**Instance data:**

- No object property has a literal value, and no datatype property has an IRI.
- No literal's datatype differs from the declared range.
- No functional property has two values.

**SKOS:**

- 551 concepts in 68 schemes, and every concept is in a scheme.
- 54 `skos:broader` pairs and 54 `skos:narrower` pairs, each the exact inverse
  of the other, with no cycle.
- No two concepts in a scheme share a prefLabel in one language, and no concept
  has two prefLabels in one language.
- Every concept is dual-typed with an SSTIM class (ADR 0002).

**Publication:**

- Both remotes are at `5ef70f2`, with 32 tags each.
- Every w3id route tried answered 200 in Turtle, JSON-LD, RDF/XML and HTML,
  except as noted under GB-09.
- The Python client resolved and checksum-verified the Core and Full profiles
  with an empty cache: every release from 0.13.0 to 0.18.0, and the unpinned
  default. The call was `resolve_profile(...).read()` against the live routes.

## GB-01 BSC implementation structure in the universal namespaces

**Finding.** Some terms that describe one implementation are published under
`https://w3id.org/sstim#` and `https://w3id.org/sstim/exposure#`, the namespaces
every adopter imports.

- **`sstim:PresetGroup`** ([sstim-patch-studio.ttl](../../../static/ontology/sstim-patch-studio.ttl)
  line 59) is defined as "A classification of BSC presets by design character,
  evidence strength, and use context". Its scheme holds Heal, Support, Perform,
  Indulge and Transcend (sstim-vocab.ttl line 273). The linking property is
  `sstim:inGroup` (line 120).
- **`sstim:hasBreathGuide`** (line 127) is defined as "True iff the preset
  contains exactly one voice with isOn=true". `isOn` is a field of the
  BioSynCare catalog format.
- **Four exposure values record one implementation's own status:**
  `sstim-ex:notCurrentlyDeliverableByBSCLab`, `notCurrentlyUsedInBSCLab`,
  `outsideBSCLabScope` and `contextBscLabPrototype`
  ([sstim-exposure.ttl](../../../static/ontology/sstim-exposure.ttl), lines 2533
  to 2540). The committed instances use them 20 times.

A broader scan covered `skos:definition` and `rdfs:comment` on every
non-deprecated term in the 16 semantic modules. It found 38 definitions that
name BSC, BioSynCare, or a catalog field (`isOn`, `mp0`, `noctaves`). Treat that
as a list to triage, not as 38 defects: some only mention BSC as an example.

**What already mitigates it.** The manifest gives `sstim-patch-studio.ttl` the
role `implementation-profile`. The role does not reach the IRIs, though. The
terms are still in `sstim#`, and both the default Full profile and the namespace
catalogue served at `https://w3id.org/sstim` include them.

**Why now.** [ADR 0059](../../decisions/0059-community-group-publishes-sstim.md)
makes the W3C Community Group the publisher from 0.19.0. That release will be
the first to put the group's name on a vocabulary that holds one product's preset
groups and one implementation's delivery status.

[SSTIM_DIRECTIONS.md](../SSTIM_DIRECTIONS.md) §3 already says specific protocols
belong in their own namespaces. It names only the Martigli and Symmetry
parameters, and nothing tracks the terms above.

**Proposed disposition.** Take the decision before 0.19.0 is cut, even if the
migration itself comes later.

1. Extend Directions §3 to name these terms.
2. Write an ADR choosing between two options:
   - **Move them** to the BSC framework or implementation namespaces. That means
     deprecation with `dct:isReplacedBy`, an exception in the full-equivalence
     baseline, and a version bump: the machinery ADRs 0043 and 0049 already
     exercised.
   - **Keep them**, with an explicit statement that they form an implementation
     profile.

The knowledge-status values are the clearer case, because they describe one
implementation's plans rather than the domain.

**Touches:** sstim-patch-studio.ttl, sstim-vocab.ttl, sstim-exposure.ttl, the
instance files that use the four values, and SSTIM_DIRECTIONS.md. GB-10 depends
on this decision.

## GB-02 SHACL does not constrain a third of the properties

**Finding: properties.** The semantic modules hold 273 non-deprecated object and
datatype properties. Of those, 83 appear in no `sh:path` of `sstim-shapes.ttl`
or `sstim-core-shapes.ttl`, and in no SHACL-SPARQL constraint. Appendix A lists
them with their ranges. They include:

- the safety link `sstim:hasCautionTag`;
- eleven of the ADR 0027 evidence-basis properties, among them
  `basisStudyDesign`, `basisStudyPopulation` and `basisObservedEffectDirection`;
- `sstim:derivedFrom` and `sstim:specifiedBy`;
- every neuromodulation facet property.

Two of them, `sstim:independencePolicy` and `sstim:reviewRubric`, have no
`rdfs:range` either.

**Finding: classes.** The class-level gap the second pass reported has narrowed
from 15 classes to 6 that have committed instances and no shape targeting them:

- `ComparatorDescriptor`
- `EvidenceAssessmentActivity`
- `ExploratoryProtocol`
- `ExposureMeasurementRequirement`
- `PopulationDescriptor`
- `SensoryStimulationIntervention`

**No gate measures either kind of coverage.** The words `targetClass` and
`sh:path` appear in no script and no Makefile target. The only tests that
mention them are two SHACL tests about specific surfaces
(`src/ui/field/exposureProfile.shacl.test.js` and
`src/session/sessionProjection.shacl.test.js`).

**Reproduction.** Appending these triples to the public instance data makes it
wrong in four different ways:

```turtle
@prefix sstim: <https://w3id.org/sstim#> .
@prefix sstim-v: <https://w3id.org/sstim/vocab#> .
@prefix bsclab-preset: <https://w3id.org/sstim/implementation/bsclab/preset/> .

# A frequency band where a safety caution belongs.
bsclab-preset:perform-alpha-10-seed sstim:hasCautionTag sstim-v:alpha .

# Evidence-basis metadata of the wrong kinds entirely.
<https://w3id.org/sstim/implementation/bsclab/evidence/perform-alpha-10-seed-auditory-review/revision/1/basis-1>
    sstim:basisStudyDesign sstim-v:alpha ;
    sstim:basisObservedEffectDirection "strongly positive" ;
    sstim:basisStudyPopulation sstim-v:cautionDrivingUnsafe .

# A preset derived from itself; derivedFrom is declared irreflexive.
bsclab-preset:perform-alpha-10-seed sstim:derivedFrom bsclab-preset:perform-alpha-10-seed .
```

Run the check the way `make shacl-instances` runs it:

```bash
nix develop
cat $(node scripts/sstim-manifest.mjs files full) \
    static/ontology/instances/*/*.ttl static/ontology/instances/*/*/*.ttl \
    adversarial.ttl > bad.ttl
pyshacl -s static/ontology/sstim-shapes.ttl bad.ttl
```

The result is `Conforms: True`, the same as the data without the file.

**Why it matters.** Principle 3 of the improvement plan gives data contracts to
SHACL, and OWL cannot do that job. Under the open-world assumption, a frequency
band given as a caution tag is simply inferred to be a caution tag.

So a green `shacl-instances` certifies nothing about these 83 properties. The
irreflexive `derivedFrom` is not caught by `make reason` either, because the
reasoner runs over the modules, not the instances.

**Proposed disposition.** In this order:

1. **A coverage gate.** Every live property must be constrained by some shape or
   appear on an allowlist that states the reason. The gate fails on a new
   unconstrained property from the day it lands. The same check for instantiated
   classes is what the second pass proposed.
2. **Baseline constraints taken from each declared range** (`sh:class`,
   `sh:datatype` or `sh:nodeKind`). Review them by hand rather than generating
   them blind: union ranges need `sh:or`, and some ranges are deliberately open.
3. **The reproduction above as a committed negative fixture.**
4. **Ranges** for the two properties that have none.

**Touches:** sstim-shapes.ttl. The two range-less properties are in
sstim-evidence.ttl.

## GB-03 Public annotations expose the authentication ID

This re-measures KR-12 ([improvement plan](../IMPROVEMENT_PLAN.md) §1.5), which
requires that "authentication IDs be separated from public agent identifiers".
The RDF export does that. The stored record does not.

**Finding.**

- **The ID is world-readable.** [firestore.rules](../../../firestore.rules)
  (line 6) lets anyone read an annotation whose `visibility` is `public`. That
  document holds `userId`, the Firebase authentication ID, and
  `userDisplayName`.
- **The name can come from the email address.** The display name comes from the
  identity provider. When the provider has none, it is the part of the email
  address before the `@` (`defaultDisplayNameFromEmail` in
  [src/firebase/auth.js](../../../src/firebase/auth.js)).
- **The pseudonym can be recomputed.** The RDF export replaces the ID with a
  pseudonym, but that pseudonym is an unsalted SHA-256 of
  `bsclab-annotation-agent:` followed by the ID, truncated to 96 bits
  (`pseudonymFor` in
  [src/rdf/annotations/annotationRdf.js](../../../src/rdf/annotations/annotationRdf.js)).
  Anyone who reads a public document can recompute it, and so link exported RDF
  back to an account and a name.
- **The interface does not say what is shown.** The control that publishes an
  annotation is labelled only "Public"
  ([AnnotationPanel.svelte](../../../src/ui/annotation/AnnotationPanel.svelte)).

**Not measured:** how many public annotations exist in the live Firestore
project.

**Proposed disposition.**

- Keep the authentication ID out of world-readable fields, either with an
  owner-only collection or with an opaque author key the rules can still check.
- Drop the email fallback for anything displayed publicly.
- Say in the interface what "Public" will show.
- Decide whether the pseudonym needs a secret, or can simply be the opaque key.

Rules reach production only through `make deploy-firestore-rules`, and existing
public documents need a migration.

## GB-04 Plain SPARQL returns nothing in the Workbench

**Finding.** [src/rdf/loader.js](../../../src/rdf/loader.js) loads every module
and instance file into a named graph, which leaves the default graph empty.
[src/rdf/query.js](../../../src/rdf/query.js) then hands the store to Comunica
unchanged. So any triple pattern outside a `GRAPH` clause matches nothing.

The queries below were measured with the app's own loading scheme: modules,
presets and evidence each in their named graphs.

| Query | Rows |
|---|---|
| CLAUDE.md §5.3 `PRESET_QUERY` | 0 |
| CLAUDE.md §5.3 `SUBBANDS_QUERY` | 1 (`alpha` itself, from the zero-length path) |
| `SUBBANDS_QUERY` wrapped in `GRAPH ?g` | 4 |

**The obvious fix does not work.** `unionDefaultGraph: true` changes nothing.
Comunica 3.3.0 ignores it for an RDF/JS store source, under the short key and
under both long context keys.

**How the Workbench copes today.** The query workbench shows a hint after an
error, and its example queries wrap every pattern in `GRAPH`. But an empty
result is not an error, so the hint never appears for it. An agent following
CLAUDE.md also gets the empty result.

**What works (tested).** Pass Comunica a view whose `match` and `countQuads`
read a default-graph argument as "every graph":

```js
const union = {
  match: (s, p, o, g) => store.match(s, p, o, g?.termType === 'DefaultGraph' ? null : g),
  countQuads: (s, p, o, g) => store.countQuads(s, p, o, g?.termType === 'DefaultGraph' ? null : g),
}
```

With that view, the plain sub-band query returns all 4 rows, and queries that
use `GRAPH ?g` return exactly what they did before.

**Proposed disposition.**

1. The union must cover only authoritative graphs. Annotation graphs stay out of
   default-graph results (CLAUDE.md §5.5). Whether the live ecosystem projection
   belongs in the union is a decision to take explicitly.
2. Correct CLAUDE.md §5.3.
3. Add a test that runs the queries documented there against the loaded store,
   so the directive cannot drift from the application again.

## GB-05 The neuromodulation splits are prose, not axioms

**Finding.** The semantic modules declare 162 live classes and hold five
disjointness axioms:

- three `owl:AllDisjointClasses`: track kinds; voice kinds; and the evidence
  claim, hypothesis and research-question family;
- two `owl:disjointWith`: entrainment versus non-entrainment techniques, and
  ecosystem agent versus implementation.

There is no `owl:complementOf` anywhere, and none of these axioms touches the
neuromodulation hierarchy. Its central distinctions are stated only in
definitions and scope notes
([sstim-neuromodulation.ttl](../../../static/ontology/sstim-neuromodulation.ttl),
lines 90 to 124):

- self-directed versus interventional neuromodulation
  ([ADR 0036](../../decisions/0036-neurostimulation-neuromodulation-senses-and-self-directed-split.md));
- the exclusion of self-directed cases from `sstim:Neurostimulation`
  ([ADR 0037](../../decisions/0037-self-regulation-genus-and-sensory-neurostimulation-branch.md)).

**Reproduction.** HermiT was run the way `make reason` runs it, over the Full
closure plus one extra individual.

- **Test:** an individual typed `sstim:SelfDirectedNeuromodulation`,
  `sstim:InterventionalNeuromodulation` and `sstim:Neurostimulation`. HermiT
  finds the ontology consistent and exits 0.
- **Control:** an individual typed `sstim:EntrainmentBasedTechnique` and
  `sstim:NonEntrainmentTechnique`, the one technique pair that is declared
  disjoint. HermiT reports "The ontology is inconsistent" and exits 1.

So the instrument can see a violation. This particular one is simply not
declared.

**The technique layer.** Here, self-directedness is a facet value, not a class.
`sstim-v:techNeurofeedback` is typed `sstim:NeuromodulationTechnique` and marked
with `sstim:participantEngagementMode sstim-v:engagementActiveSelfRegulatory`.

Nothing stops it from also being typed `sstim:NeurostimulationTechnique`, which
excludes self-directed cases. `participantEngagementMode` is one of the 83
properties under GB-02.

**No test exercises the process layer.** These six process-layer classes have
no committed instance and no shape, and none of them appears in `test/`,
`scripts/` or `packages/`:

- `Neurostimulation`
- `SensoryNeurostimulation`
- `SelfDirectedNeuromodulation`
- `InterventionalNeuromodulation`
- `SensoryRouteNeuromodulationProtocol`
- `DeliberateSelfRegulation`

The three entailment queries in `test/entailment/` check other inferences.
HermiT confirms the definitions are satisfiable; nothing else tests them.

**Why this disagrees with the third pass.** Its §6 found that "sibling classes
carry their disjointness where it matters; no large sibling set was found
undeclared". This pair is not a large sibling set, which is presumably why that
check missed it. It is, however, the split that two ADRs were written to make.

**Why it matters.** With five disjointness axioms, "HermiT: consistent" rules
out very little. Where an ADR says two categories exclude each other, the
ontology can say so too, and then the reasoner enforces it for every adopter.

**Proposed disposition.**

1. For each exclusion the ADRs state, decide whether it is a true disjointness.
   Self-directed versus interventional reads as one.
2. Enforce what is decided at the layer where it is expressed:
   - **process layer:** assert disjointness in OWL;
   - **technique layer:** add a SHACL rule, since the split there is a facet
     value.
3. Add entailment fixtures in both directions: a sensory neurostimulation
   process that classifies, and a self-directed one that must not.

No committed process instance is affected, because none exists. The change
alters entailments, so it probably warrants an ADR amendment.

**Touches:** sstim-neuromodulation.ttl, sstim-shapes.ttl and `test/entailment/`.

## GB-06 Deprecated terms without a machine-readable replacement

**Finding.** Of the 45 deprecated terms in the SSTIM namespaces, 24 have no
`dct:isReplacedBy`:

| Module | Deprecated terms without `dct:isReplacedBy` |
|---|---|
| sstim-evidence.ttl | `EvidenceModalityTag`, `comparator`, `evidenceDate`, `evidenceOutcome`, `hasEffectDirection`, `hasModalityTag`, `hasReviewStatus`, `reviewedBy`, `studyPopulation`, `supportsRelation` |
| sstim-exposure.ttl | `ExposureEffectClaim`, `hasEffectClaim` |
| sstim-ecosystem.ttl | `couldContributeTo`, `notificationChannel`, `responseNote` |
| sstim-vocab.ttl | the nine evidence-modality tags `modalityAUD`, `modalityAV`, `modalityBREATH`, `modalityGENERAL`, `modalityMULTISENSORY`, `modalityPRECLINICAL`, `modalityREVIEW`, `modalityTACTILE`, `modalityVIS` |

Some of these have no single replacement, which is legitimate but should be
stated.

**`sstim:supportsRelation` does have a replacement**, and the graph does not say
so. Its definition reads "Use sstim:evaluatesSubject", and it is declared a
sub-property of that term. A consumer reading the graph cannot find the
replacement without parsing prose.

The same definition calls the term "a materialized compatibility alias during
0.7.x". At 0.19.0-dev the public instances still assert it 11 times, beside
`evaluatesSubject`:

- `oscillation-associations.ttl`: 3
- `technique-evidence.ttl`: 7
- `perform-alpha-10-seed.ttl`: 1

**Proposed disposition.**

- Add `dct:isReplacedBy` wherever a replacement exists.
- For the rest, add a history note stating that there is no replacement, and
  why.
- Decide whether the public data keeps writing `supportsRelation`. The
  sub-property axiom gives `evaluatesSubject` from the alias, not the other way
  round, so dropping the alias from the data would break any consumer still
  querying it.
- Correct the "during 0.7.x" wording.

**Touches:** the four modules above, and the three instance files if the alias
is dropped.

## GB-07 Documentation and metadata drift

**Findings.**

- **CURRENT_STATE counts.** [CURRENT_STATE.md](../CURRENT_STATE.md) ("Data and
  privacy boundaries") says the public data includes "two reference presets" and
  "seven DOI-identified references". The instances hold five `sstim:Preset`
  resources, three of them added on 2026-09-10, and eleven references, each with
  a DOI. `make truth-audit` checks eight prose totals, and these two are not
  among them.
- **CLAUDE.md §4.3** calls the preset band values "SKOS concept local names".
  The local names are camelCase (`sstim-v:lowAlpha`, `sstim-v:alpha10`); the
  kebab-case values such as `low-alpha` are the concepts' `skos:notation`.
- **CLAUDE.md §5.3:** see GB-04.
- **Kernel declaration counts.** The declaration block in
  [sstim-core.ttl](../../../static/ontology/sstim-core.ttl) (lines 170 to 282)
  says SSTIM reuses 62 terms, and labels its lists "(41)" annotation properties
  and "(2)" datatypes. It actually declares 43 annotation properties, 19 classes
  and 1 datatype: 63 in all.
- **Kernel history note.** The `skos:historyNote` entries run 0.18, 0.17, 0.16,
  then 0.1 to 0.15, with 0.9 before 0.7. 0.8.0 has no entry, and 0.4.0 appears
  only inside the 0.5.0 note.
- **Header dates.** All 22 public headers carry `dct:modified "2026-09-23"`,
  although the ADR 0059 commit (`5ef70f2`) edited every one of them afterwards.
  This is by design:
  `scripts/release-prepare.mjs` stamps the release date. The open question is
  whether a mutable line should give its last release date as its modification
  date. This is a question, not a defect.

**Proposed disposition.** Correct the counts and the wording. Extend the truth
audit to the CURRENT_STATE instance totals, since that is the document every
session starts from.

**Touches:** CLAUDE.md, CURRENT_STATE.md, and sstim-core.ttl (comments and
history note).

## GB-08 Links into the legacy repository, all at moving branches

**Finding.** The live modules and `void.ttl` hold 146 links to
`github.com/laBioSynCare/laBioSynCare.github.io`, spread over 20 files:

- 143 point at `blob/main`;
- 2 point at `tree/main`;
- 1 points at the repository root.

None points at `github.com/w3c-cg/sstim`, which CLAUDE.md §3.7 names as the
repository that registry records and the packages cite. The 146 include the
Kernel's `dct:source` and `rdfs:seeAlso`, and every `rdfs:seeAlso` from a term to
its ADR. They resolve today (a sampled ADR link answered 200), because the
legacy origin is preserved.

**Why it matters.** There are two separate problems:

- **Mismatched source.** The ontology names a different source repository from
  the one ADR 0059 and the registries name.
- **Unpinned citations.** Every frozen release cites pages on a branch that keeps
  moving. A renamed or rewritten document silently changes, or breaks, what a
  citable release points to.

**Proposed disposition.** On the development line, point at the CG repository,
and at a tag or a persistent route rather than `main`. Frozen releases stay as
they are.

The header of the w3id `.htaccess` mirror also still names the legacy source
repository (docs/ecosystem/w3id/sstim/.htaccess, line 5). That changes with the
next upstream w3id pull request.

**Touches:** 20 files in `static/ontology/`.

## GB-09 Frozen releases answer only in Turtle

**Finding.**

- **The version IRI ignores the Accept header.** `https://w3id.org/sstim/0.18.0`
  redirects every request to `ontology/0.18.0/sstim-namespace.ttl`, so a browser
  following the citable version IRI receives a Turtle file.
- **Only `latest/` has the other serializations.** In `ontology/0.18.0/`, the
  files `sstim-namespace.jsonld`, `sstim-namespace.rdf` and `sstim-core.jsonld`
  all answer 404. CURRENT_STATE advises pinning the frozen release for published
  work, which is therefore possible in Turtle only.
- **The JSON-LD context has no persistent route.**
  `https://w3id.org/sstim/context.jsonld` answers 404, and the context is
  maintained by hand (static/ontology/README.md, "Files" and the extension
  checklist).

**Prior decision.** On 2026-08-29, TODO.md (namespace section) measured that
snapshots are Turtle only and decided that exports stay generated and are never
committed, to avoid tripling every snapshot with derivable bytes. That reason is
about committing. Publishing derived exports for each frozen snapshot at deploy
time, as is already done for `latest/`, does not conflict with it.

**Proposed disposition.**

1. Generate the three serializations for every frozen snapshot at deploy time,
   verified isomorphic the way `make export-check` does it.
2. Negotiate the version route. That needs an upstream w3id pull request, and it
   trades against the pattern routing of ADR 0053.
3. Give the context a route, and a check that it covers every declared term.

## GB-10 The presets page shows only BSC-shaped presets

**Finding.** [src/rdf/presets.js](../../../src/rdf/presets.js) drives
`src/routes/presets/+page.svelte`. It selects a preset only if the preset has all
four of `sstim:presetVersion`, `sstim:hasBreathGuide`, `sstim:inGroup` and
`sstim:targetsFrequencyBand`. It also recognises only the four BSC voice
classes.

SSTIM's own `PresetShape` requires only `rdfs:label`, and the preset contract of
ADR 0051 is built from components that each declare a modality. So a conformant
visual or noise preset with no BSC group or band is valid SSTIM, yet invisible on
the Workbench page. All five committed presets are BSC seeds, which is why
nothing shows the omission.

**Proposed disposition.** Make the BSC-specific patterns optional, and display
whatever the preset actually declares. This follows the GB-01 decision, since
`inGroup` and `hasBreathGuide` are GB-01 terms. CLAUDE.md §11 already forbids
BioSynCare-specific logic in the generic UI.

## GB-11 Two gate targets run the identical command

`shacl-vocab` and `shacl-exposure` (Makefile, lines 224 to 236) run exactly the
same recipe: both concatenate the Full semantic closure and run pySHACL with
`sstim-shapes.ttl`. `shacl-modules` differs only in adding the shape modules to
the data graph.

Each target is a full pass over the closure, inside a gate that takes 20 to 25
minutes in CI. Either consolidate them, or give each target the distinct scope
its comment describes.

## Appendix A: properties no shape constrains

Live object and datatype properties, grouped by declaring module, with each
declared range. A range shown as "union" is an `owl:unionOf`; "none" means the
property has no `rdfs:range`.

- **common (6):** `sstim:extendedHzMax` (decimal), `sstim:extendedHzMin`
  (decimal), `sstim:hasCorticalTopography` (string),
  `sstim:hasOscillationStateContext` (string), `sstim:hasTypicalFrequencyBand`
  (FrequencyBand), `sstim:platformDeliverable` (boolean)
- **configuration (4):** `sstim:derivedFrom` (Preset), `sstim:hasCautionTag`
  (CautionTag), `sstim:hasIntendedEffect` (IntendedEffect), `sstim:specifiedBy`
  (StimulusSpecification)
- **evidence (25):** `sstim:accessClassification` (string),
  `sstim:basisComparator` (ComparatorDescriptor), `sstim:basisComparatorNote`
  (langString), `sstim:basisIntervention` (union),
  `sstim:basisObservedEffectDirection` (EffectDirection),
  `sstim:basisObservedOutcome` (EvidenceOutcomeConcept), `sstim:basisOutcomeNote`
  (langString), `sstim:basisPopulationNote` (langString), `sstim:basisStudyDesign`
  (StudyDesign), `sstim:basisStudyModel` (StudyModel), `sstim:basisStudyPopulation`
  (PopulationDescriptor), `sstim:basisSynthesisType` (EvidenceSynthesisType),
  `sstim:conflictDisclosure` (ConflictDisclosure), `sstim:consentBasisNote`
  (langString), `sstim:custodian` (Agent), `sstim:governedSourceDigest` (string),
  `sstim:governedSourceVersion` (string), `sstim:independencePolicy` (none),
  `sstim:permittedUseScope` (langString), `sstim:reviewRubric` (none),
  `sstim:searchCoverageStart` (date), `sstim:searchDigest` (string),
  `sstim:searchEligibilityCriteria` (langString), `sstim:searchResultCount`
  (integer), `sstim:searchSource` (string)
- **exposure (18):** `sstim-ex:affordsDeliveryMedium` (PhysicalDeliveryMedium),
  `sstim-ex:channelRole` (StimulusChannelRole), `sstim-ex:concernsEffectDimension`
  (EffectDimension), `sstim-ex:hasDesignObjective` (ExposureDesignObjective),
  `sstim-ex:hasExperimentContext` (ExperimentContext), `sstim-ex:hasHypothesis`
  (ExposureHypothesis), `sstim-ex:hasKnowledgeStatusAssertion`
  (KnowledgeStatusAssertion), `sstim-ex:hasModulationFrequencyHz` (decimal),
  `sstim-ex:hasPerceptualGain` (PerceptualGain), `sstim-ex:hasPerceptualLoss`
  (PerceptualLoss), `sstim-ex:hasPlannedOutcome` (PlannedOutcomeSpecification),
  `sstim-ex:hasProtocolRequirement` (ProtocolRequirement),
  `sstim-ex:hasResearchQuestion` (ResearchQuestion), `sstim-ex:hasToneFrequencyHz`
  (decimal), `sstim-ex:limitAveragingTimeSeconds` (decimal),
  `sstim-ex:pitchShiftCents` (decimal), `sstim-ex:requiresDeviceCapability`
  (DeviceCapability), `sstim-ex:retunedFromReferenceHz` (decimal)
- **neuromodulation (6):** `sstim:intendedNeuralPhenomenon` (NeuralPhenomenon),
  `sstim:intendedNeuralSystem` (NeuralSystem), `sstim:mechanismNeuralAccessRoute`
  (NeuralAccessRoute), `sstim:mechanismNeuralPhenomenon` (NeuralPhenomenon),
  `sstim:mechanismNeuralSystem` (NeuralSystem), `sstim:mechanismNeuralTargetSite`
  (NeuralTargetSite)
- **neuromodulation-evidence (4):** `sstim:outcomeNeuralAccessRoute`
  (NeuralAccessRoute), `sstim:outcomeNeuralPhenomenon` (NeuralPhenomenon),
  `sstim:outcomeNeuralSystem` (NeuralSystem), `sstim:outcomeNeuralTargetSite`
  (NeuralTargetSite)
- **patch-studio (7):** `sstim:beatHz` (decimal), `sstim:beatsPerBar` (integer),
  `sstim:breathingAmplitude` (decimal), `sstim:hapticPattern` (integer),
  `sstim:noteDurationFraction` (decimal), `sstim:rotationSpeed` (decimal),
  `sstim:visualDensity` (decimal)
- **session (9):** `sstim:breathingPeriodFinal` (decimal),
  `sstim:breathingPeriodInitial` (decimal), `sstim:breathingTransitionDuration`
  (decimal), `sstim:disablesTrack` (Track), `sstim:hasDeliveryModality`
  (SensoryModality), `sstim:promptIdentifier` (string), `sstim:promptText`
  (string), `sstim:scaleMaximumLabel` (string), `sstim:scaleMinimumLabel` (string)
- **technique (4):** `sstim:implementsProtocol` (SensoryStimulationProtocol),
  `sstim:incorporatesTechnique` (SensoryStimulationTechnique),
  `sstim:participantEngagementMode` (ParticipantEngagementMode),
  `sstim:proposedMechanism` (StimulationMechanism)

## Appendix B: how the probes counted

- **Constrained property.** A property counts as constrained if it is the
  `sh:path` of any shape (including nested paths) in the two public shape
  modules, or if its IRI or prefixed local name occurs in the text of any
  `sh:select`. The text match is generous, so 83 is a lower bound. The
  access-controlled `sstim-ecosystem-private-shapes.ttl` was not counted,
  because it is not part of the public contract.
- **Live term.** A live term is one not marked `owl:deprecated true`. The 45
  deprecated terms are those in the SSTIM namespaces. Legacy evidence-claim IRIs
  under `bsclab/evidence/`, which are also deprecated, are instance data and are
  not counted.
- **Class coverage.** A class counts as covered if it is the `sh:targetClass` or
  `sh:class` of any shape. Classes whose members are controlled-vocabulary
  concepts are excluded, because the vocabulary shapes validate those concepts.
- **BSC mentions (GB-01).** The pattern searched was the word-bounded
  `BSC|BioSynCare|isOn|iniVolume|mp0|nnotes|noctaves|waveformL|panOsc|catalog JSON|voice with`,
  applied to `skos:definition` and `rdfs:comment` of non-deprecated terms. By
  module: exposure 12, vocab 11, patch-studio 8, evidence 2, ecosystem 2,
  common 1, configuration 1, session 1.
- **Measurement conditions.** Live routes were probed with `curl -L` and an
  explicit Accept header. The SPARQL measurements used `@comunica/query-sparql-rdfjs`
  3.3.0 and `n3`, as installed in `node_modules`.
