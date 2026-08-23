# SSTIM External Automated Review - 2026-07-10

**Status:** completed automated review and post-release FOOPS rerun; accepted
for `0.6.0` through maintainer-guided review. Independent human ontology review
is deferred.

**Reviewed baseline:** commit `8ff91f2` (`0.6.0-dev`)

**Scope:** the six live ontology modules, merged as 5,820 triples, plus the
canonical published core at `https://w3id.org/sstim`. Frozen release snapshots
and private BioSynCare data were out of scope.

## Review Channels

1. [OOPS!](https://oops.linkeddata.es/) scanned each module and a locally merged
   RDF/XML graph. OOPS accepted content submission because ontology-URI
   execution is no longer supported by its public service.
2. [FOOPS!](https://foops.linkeddata.es/FAIR_validator.html) assessed the
   canonical ontology URI. The pre-correction URI score was `0.69097227` across
   24 accessibility, registry, metadata, vocabulary, and versioning tests. The
   post-correction canonical-URI score was `0.78472227`, displayed by FOOPS as
   **78%**. A narrower, metadata-focused 15-test file assessment rose from
   `0.7722222` to `0.9222222`; that file-mode result is diagnostic and is not
   the public FAIR score. After the `0.6.0` version IRI and Zenodo DOI were
   deployed, a 2026-07-11 canonical-URI rerun scored `0.875` (**87.5%**).
3. External OBO identifiers were checked against the
   [EMBL-EBI Ontology Lookup Service](https://www.ebi.ac.uk/ols4/) and the
   [OBO Foundry term-stability principle](https://obofoundry.org/principles/fp-019-term-stability.html).
4. Safety metadata was checked against the
   [W3C WCAG 2.2 flash criterion](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold),
   [NIOSH occupational noise criteria](https://www.cdc.gov/niosh/docs/98-126/),
   and the [ICNIRP ultraviolet guideline](https://www.icnirp.org/cms/upload/publications/ICNIRPUV2004.pdf).
5. Metadata semantics were checked against the
   [DCMI Terms recommendation](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/).

Gemini and Claude CLI reviews were attempted with the maintainer's permission.
Gemini rejected the account tier, and Claude reached its session limit before
returning findings. Neither model is counted as a reviewer or evidence source.

## Findings and Disposition

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| ER-01 | Blocker | Live axioms used obsolete `OBI_0000011` as a planned-process parent. | Accepted. Removed from core and alignments; active `COB_0000082` remains. |
| ER-02 | Major | `SensoryStimulationTechnique` was subclassed under OBI protocol, whose definition requires enough detail for independent reproduction. SSTIM techniques are explicitly less specific than protocols. | Accepted. Technique now subclasses `IAO_0000030`; only `SensoryStimulationProtocol` retains the OBI protocol alignment. |
| ER-03 | Major | OOPS P11 found no range for `conformsToStandard`. | Accepted. Added `rdfs:range dct:Standard`, matching DCMI's broad standard/reference-point class. |
| ER-04 | Major | The core ontology description and `SensoryStimulation` definition implied outcome induction through neurobiological pathways. | Accepted. Rewritten to define the delivery process and keep mechanisms, responses, and outcomes separate and evidence-qualified. |
| ER-05 | Major | The `30 J/m2` ultraviolet value was cited only to IEC 62471 even though the value is from ICNIRP's spectrally weighted exposure guideline. | Accepted. Added the ICNIRP source, retained IEC for lamp risk classification, and made the attribution explicit. |
| ER-06 | Moderate | FOOPS reported missing citation, publisher, issued date, DOI recognition, logo, status, and source metadata. | Accepted. Added applicable metadata to the core and publisher/issued metadata to every module. The final release adds its version IRI. |
| ER-07 | Moderate | The NIOSH record did not state that `85 dBA / 8 h / 3 dB` is an occupational recommendation rather than general listening guidance. | Accepted. Scope and advisory limitations are now explicit. |
| ER-08 | Minor | OOPS suggested that `derivedFrom` might be symmetric or transitive because domain and range are both `Preset`. | Rejected as proposed; clarified it as immediate-predecessor history and declared it asymmetric and irreflexive. |
| ER-09 | Minor | OOPS P08/P34 treated reused OBO, PROV, SKOS, SHACL, and VOAF classes as locally undocumented or untyped. | Rejected. SSTIM references these external terms without taking ownership or importing whole ontologies. |
| ER-10 | Minor | OOPS P13 proposed inverses for 48 object properties. | Rejected. Inverses are published only where they support a demonstrated query and have unambiguous semantics. |
| ER-11 | Minor | OOPS P22 reported mixed local naming because OBO numeric IRIs and SSTIM CamelCase IRIs occur in one graph. | Rejected. External identifier conventions are intentionally preserved. |
| ER-12 | Minor | FOOPS reported no `owl:versionIRI`, registry entry, or prefix registry entry. | Partly resolved. The `0.6.0` release adds a resolvable `owl:versionIRI`; prefix and ontology registry submissions remain post-release publication work. |

## Verification Added

The repository audit now fails if live modules use obsolete `OBI_0000011`, if a
technique regains the over-specific OBI protocol parent, or if the actual SSTIM
protocol loses that alignment. Module metadata checks now require publisher and
issued date. A post-correction OOPS rescan no longer reports P11 and no longer
lists `OBI_0000011`; the remaining findings are ER-08 through ER-11 above.

The complete pinned-Nix `make validate` suite passed: all SHACL targets conform,
the repository quality audit and competency queries pass, ROBOT/HermiT reports
the six-module graph consistent, and every generated JSON-LD/RDF/XML graph is
isomorphic with its Turtle source. The review also fixed a Makefile error that
had allowed a missing ROBOT executable to print a false success message.

The post-correction pre-release canonical FOOPS assessment was 78%. The
post-release assessment is 87.5%: minimum ontology metadata passes 6/6, the
version IRI is declared and distinct from the ontology IRI, and the version IRI
resolves. The only failed checks are `FIND2`, `FIND3`, and `FIND_3_BIS`: public
prefix/ontology registry discovery and the metadata-persistence check that
FOOPS ties to registry presence.

## Release Decision and Deferred Review

This assessment uses externally operated services but is automated. It is not
domain-expert or ontology-engineer sign-off on the controlled-value model,
protocol/session distinction, or evidence summaries.

On 2026-07-11, maintainer Renato Fabbri accepted `0.6.0` after directly guiding
and reviewing the ontology work and its finding dispositions. Under
[ADR 0022](../../decisions/0022-0.6-release-review-posture.md), a named
independent human review is desirable but is not a blocker for this release; it
is deferred until a suitable reviewer is available, potentially for `0.7.0` or
later. Release material must not describe this as independent human sign-off.
WIDOCO and registry submission remain publication follow-up tasks.
