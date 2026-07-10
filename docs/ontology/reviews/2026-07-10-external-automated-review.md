# SSTIM External Automated Review - 2026-07-10

**Status:** completed automated review; independent human ontology review still
required before `0.6.0`

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
   24 accessibility, registry, metadata, vocabulary, and versioning tests. A
   like-for-like 15-test file assessment rose from `0.7722222` on the reviewed
   baseline to `0.9222222` after correction.
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
| ER-06 | Moderate | FOOPS reported missing citation, publisher, issued date, DOI recognition, logo, status, and source metadata. | Partly accepted. Added applicable metadata to the core and publisher/issued metadata to every module. Version IRI remains intentionally absent on the development line. |
| ER-07 | Moderate | The NIOSH record did not state that `85 dBA / 8 h / 3 dB` is an occupational recommendation rather than general listening guidance. | Accepted. Scope and advisory limitations are now explicit. |
| ER-08 | Minor | OOPS suggested that `derivedFrom` might be symmetric or transitive because domain and range are both `Preset`. | Rejected as proposed; clarified it as immediate-predecessor history and declared it asymmetric and irreflexive. |
| ER-09 | Minor | OOPS P08/P34 treated reused OBO, PROV, SKOS, SHACL, and VOAF classes as locally undocumented or untyped. | Rejected. SSTIM references these external terms without taking ownership or importing whole ontologies. |
| ER-10 | Minor | OOPS P13 proposed inverses for 48 object properties. | Rejected. Inverses are published only where they support a demonstrated query and have unambiguous semantics. |
| ER-11 | Minor | OOPS P22 reported mixed local naming because OBO numeric IRIs and SSTIM CamelCase IRIs occur in one graph. | Rejected. External identifier conventions are intentionally preserved. |
| ER-12 | Minor | FOOPS reported no `owl:versionIRI`, registry entry, or prefix registry entry. | Deferred. Development sources omit `owl:versionIRI` by ADR 0020; registry submissions and release metadata remain `0.6.0` publication gates. |

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

The post-correction FOOPS file assessment reports only the intentionally absent
development `owl:versionIRI`; citation, DOI, publisher, issued date, logo,
status, source, and detailed provenance checks now pass. URI accessibility and
registry tests must be rerun against the canonical URI after deployment.

## Remaining Release Gate

This review is independent and externally executed, but automated. It is not a
substitute for domain-expert or ontology-engineer sign-off on the controlled
value model, protocol/session distinction, and evidence summaries. Before
tagging `0.6.0`, obtain one named human review, resolve its findings, rerun FOOPS
after deployment, add the release `owl:versionIRI`, generate WIDOCO
documentation, freeze the snapshot, and publish the matching Zenodo release.
