# ADR 0045 — A profile with no shape closure is a discovery entry point, not a conformance target

**Status:** Accepted — 2026-08-02 · implementation target SSTIM 0.13.0

Refines the per-profile conformance contract in
[ADR 0043 §5 and §7](0043-sstim-core-profile-and-module-boundaries.md), which
required positive, out-of-scope, and adversarial fixtures plus a competency
query from *every* published profile.

## Context

ADR 0043 published four profile entry points. Three associate a SHACL closure:
Core and Core Plus select `sstim-core-shapes.ttl`, Full selects
`sstim-shapes.ttl`. **Kernel selects none** — its `shapeModules` is empty, which
[the module architecture guide](../ontology/MODULE_ARCHITECTURE.md) records as a
deliberate `0.13.0-dev` state, and ADR 0043 §6 deliberately stages new shape
packages so they arrive only with the conformance profiles they validate.

That makes two of the three required fixture categories impossible to satisfy
honestly for Kernel, because both are defined by a validation verdict:

- an **adversarial** fixture is one the profile's closure must *reject*. With no
  shapes, nothing rejects anything, so no graph can be adversarial against
  Kernel. A file placed in that category would be a fixture that silently always
  passes — worse than an absent one, because the release gate would report a
  contract that is not being tested.
- an **out-of-scope** fixture must *validate* despite carrying concerns the
  profile omits, proving omitted policy does not leak into validation. With no
  shapes there is no policy to leak and nothing to prove; it would pass
  vacuously.

Writing a minimal Kernel shape package purely to satisfy the gate was the
alternative. It would mint a conformance profile that no decision called for,
contradicting both ADR 0043 §6's staging rule and Kernel's stated role as "the
process anchor, not the practical description profile."

## Decision

A profile's fixture obligations follow its shape closure.

- A profile with a **non-empty** `shapeModules` is a conformance target. On
  release it must declare at least one positive, one out-of-scope, and one
  adversarial fixture, plus at least one competency query. Core, Core Plus, and
  Full are conformance targets.
- A profile with an **empty** `shapeModules` is a discovery entry point. On
  release it must declare at least one positive fixture and at least one
  competency query, which together prove its terms are usable and answer
  something. It **must not** declare out-of-scope or adversarial fixtures; the
  manifest validator rejects them, because no verdict exists to make them
  meaningful. Kernel is a discovery entry point in `0.13.0`.

A positive fixture and a competency query are required of every profile without
exception. They do not depend on validation: they establish that the profile's
own terms can describe something and answer a question about it.

This is a statement about what can be *proved*, not a lowering of the bar.
Kernel is still published, routed, PROF-described, and listed in the manifest.
What it does not claim is that data can conform to it, because there is nothing
to conform to.

## Consequences

Kernel becomes releasable without inventing semantics for it. The release gate
stops demanding an artifact that could only be a decoration, and starts
rejecting one: an out-of-scope or adversarial fixture on a shapeless profile is
now an error, so the category cannot be quietly filled with something that
always passes.

Publishing Kernel shapes later is not blocked. The moment `shapeModules` becomes
non-empty, the same validator demands the two negative categories, so the
obligation returns automatically with the capability. No separate decision has
to remember it.

The cost is that "profile" now covers two kinds of thing, and adopters must read
`shapeModules` to tell them apart. That distinction was already real — a
consumer cannot validate against an empty shape graph whatever the manifest
says — so this records it rather than introducing it.

## Alternatives considered

**Publish minimal Kernel shapes.** Rejected: it invents a conformance profile no
decision called for, in a release that deliberately staged shape packages, and
the resulting constraints (a process must carry a label) would encode a
requirement nobody has argued for.

**Exempt Kernel by name.** Rejected: a rule about one profile id rots. The
condition that actually matters is whether a shape closure exists, and stating
it that way makes the obligation return by itself when Kernel gains shapes.

**Drop Kernel from the published profiles.** Rejected: the dependency-free
process anchor is exactly what an adopter aligning an upper ontology wants to
retrieve, and it is already routed and cited by ADR 0043.

**Allow empty categories with a comment.** Rejected: a release gate that accepts
"declared but empty" teaches readers that the categories are optional, and the
manifest could not distinguish "not applicable" from "not written yet".
