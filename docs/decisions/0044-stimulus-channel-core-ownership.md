# ADR 0044 — `StimulusChannel` ownership and profile-sensitive target domain

**Status:** Accepted — 2026-08-01 · implemented and released in SSTIM 0.13.0

Clarifies the one semantic boundary that cannot be handled as a purely
mechanical redistribution under
[ADR 0043](0043-sstim-core-profile-and-module-boundaries.md).

## Context

[ADR 0042](0042-stimulus-specification.md) reused
`sstim-ex:StimulusChannel` for an engine-independent
`sstim:StimulusSpecification`. In SSTIM 0.12, however, the channel was owned by
`sstim-exposure.ttl` and defined only as “a channel within an exposure profile.”
That ownership and definition make the new Core Profile depend on the optional
Exposure concern and describe Core-only channel use too narrowly.

The public `sstim-ex:` IRI is already used by exposure instances, shapes,
queries, and ADR 0042. Minting a second Core channel class would create a
migration and an artificial distinction between the same channel as described
by a specification and by an exposure profile.

A second boundary occurs in `sstim:hasStimulationTarget`. SSTIM 0.12 gives the
property one `owl:unionOf` domain containing `StimulusSpecification` and
`SessionSpecification`. Keeping that domain in Core would make Core depend on
Session. Splitting it into two `rdfs:domain` assertions would be logically
wrong: multiple domains mean that a subject belongs to their intersection.

## Decision

### 1. Preserve the channel IRI and move its authoritative owner

The public class IRI remains:

```text
https://w3id.org/sstim/exposure#StimulusChannel
```

Its authoritative declaration moves from `sstim-exposure.ttl` to
`sstim-stimulus.ttl`, and its ownership annotation becomes:

```turtle
sstim-ex:StimulusChannel
    rdfs:isDefinedBy <https://w3id.org/sstim/stimulus> .
```

Namespace and module ownership are intentionally decoupled. Changing the IRI
for file-name symmetry would be more harmful than retaining the established
`sstim-ex:` spelling.

The namespace route and the exact Exposure module endpoint are also distinct.
RDF negotiated from `https://w3id.org/sstim/exposure` is a namespace catalogue
combining Stimulus and Exposure, so dereferencing the preserved channel IRI
still returns its declaration after the ownership move. Consumers that need the
Exposure semantic module itself import
`https://w3id.org/sstim/module/exposure`; the catalogue route is not a module
or profile-closure boundary.

### 2. Broaden the definition to cover both legitimate contexts

The English definition becomes:

> A channel within a stimulus specification or exposure profile, such as an
> audio, visual, haptic, respiratory, olfactory, gustatory, or electromagnetic
> exposure path.

This is a clarification and broadening, not a new class or equivalence axiom.
Existing exposure channels retain their meaning. Core can now use the same class
through `sstim:hasStimulusChannel`; Exposure continues to use it through
`sstim-ex:usesStimulusChannel` and adds delivery, perception, placement, device,
and limit detail.

Core validation may require only the minimal channel contract. Exposure and Full
profiles may associate stricter delivery/safety shapes. A Core-conformant channel
is therefore not required to carry every exposure field.

Core and Full nevertheless validate the optional link itself. If
`sstim:hasStimulusChannel` is present, its value must be explicitly declared a
`sstim-ex:StimulusChannel`; otherwise an untyped, literal, or wrong-class value
would evade `StimulusChannelShape` when the profile's declared inference mode is
`none`. The link remains optional: this is a conditional type constraint, not a
new minimum count.

### 3. Keep the base target property underconstrained

`sstim-stimulus.ttl` owns the declaration, range, label, definition, and other
profile-independent semantics of `sstim:hasStimulationTarget`, but declares no
`rdfs:domain` for it in the Core closure.

`sstim-session.ttl` owns the complete cross-layer domain axiom as one intact RDF
list:

```turtle
sstim:hasStimulationTarget
    rdfs:domain [
        a owl:Class ;
        owl:unionOf (
            sstim:StimulusSpecification
            sstim:SessionSpecification
        )
    ] .
```

Consequently:

- Core does not depend on Session and does not infer a subject type solely from
  use of `hasStimulationTarget`;
- Session and Full restore exactly the 0.12 union-domain inference; and
- no module may add separate `StimulusSpecification` and
  `SessionSpecification` domains for this property.

The same pattern applies to other intact cross-layer union-domain axioms moved
to Session by ADR 0043.

The optional target link is constrained only to an RDF resource (IRI or blank
node), not to an explicit BFO class in Core. This rejects a literal target while
avoiding a new Core requirement that consumers materialize range entailments.

### 4. Treat the change explicitly in compatibility verification

The 0.12-to-0.13 Full union-graph equivalence gate excludes:

- the old and new `skos:definition` triples for `StimulusChannel`; and
- intentional `rdfs:isDefinedBy` ownership changes; and
- the two named Full property shapes that harden optional channel and target
  links under inference mode `none`.

All remaining semantic triples must be graph-isomorphic. Public channel IRIs,
instance data, query patterns, and Full-profile entailments remain stable.

The Core-only loss of the target-property domain inference is deliberate
profile behavior, not a Full compatibility break: the domain axiom is present
when the Session closure that declares `SessionSpecification` is selected.

## Alternatives considered

**Keep `StimulusChannel` in Exposure and make Core depend on Exposure.**
Rejected: an optional delivery/research concern would cease to be optional, and
the minimal description contract would inherit unrelated policy.

**Mint a new `sstim:StimulusChannel` Core class.** Rejected: it duplicates one
concept, breaks existing query/data expectations, and forces mappings or a
migration for no semantic gain.

**Change the public class IRI to match its new source.** Rejected: namespace/file
symmetry is not worth breaking a public term IRI.

**Keep the target union domain in Core.** Rejected: it introduces an upward Core
dependency on Session.

**Put one target domain in Core and a second in Session.** Rejected: RDFS treats
multiple domain statements conjunctively, so Full would infer both classes
rather than their union.

**Give Core only a `StimulusSpecification` domain and omit the Session case.**
Rejected: it changes Full semantics and incorrectly types a session target
assertion as a stimulus specification.

## Consequences

Core becomes independently usable without changing the established channel IRI.
Exposure remains a strict extension of the same channel concept. The cost is a
documented cross-namespace owner and a Core property whose domain is intentionally
supplied only by a larger profile.

Tools and documentation must use manifest ownership and `rdfs:isDefinedBy`, not
namespace spelling, to identify the authoritative module. Full equivalence tests
must name the definition and SHACL clarifications explicitly rather than hiding
them among ownership changes.
