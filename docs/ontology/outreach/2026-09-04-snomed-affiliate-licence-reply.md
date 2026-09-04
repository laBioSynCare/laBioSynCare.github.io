# SNOMED International: a free public good Affiliate Licence is offered

**Status: received 2026-09-04, unanswered, no application filed.** Privacy-safe
record of a direct reply, not a transcript. The message, its headers, the support
ticket reference and the sender's contact details stay in the access-limited
correspondence tree, consistently with
[ADR 0031](../../decisions/0031-qualified-ecosystem-records.md).

## What was asked

The enquiry of 2026-08-23 asked one narrow question: whether referencing SNOMED
CT concept identifiers as IRIs in an openly published mapping, without
redistributing any SNOMED CT content, requires an Affiliate Licence. It named the
two triples in
[`sstim-alignments.ttl`](../../../static/ontology/sstim-alignments.ttl), stated
that no descriptions, hierarchy, attributes or expressions travel with them, and
offered to withdraw the mappings if reference-only use is not permitted.

## What came back

SNOMED International's Chief Digital Information Officer, Rory Davidson, replied
on 2026-09-04. In substance:

- For this use case, characterised as inclusion in some mapping statements,
  SNOMED International would grant a **public good affiliate licence**.
- **There would be no fee.**
- The licence would carry permission to **include more content in the future if
  necessary, without asking again**.
- The recommended route is to apply through the MLDS service at
  <https://mlds.ihtsdotools.org>, and to tell him so that he can process the
  application.

## Reading it accurately

**The question as asked is still unanswered, and that matters.** He did not rule
that reference-only IRI use requires a licence, nor that it does not. He offered
an instrument that makes the question moot for SSTIM. The distinction is worth
keeping because a future reader deciding some other project's exposure cannot
rely on a ruling that was never given.

**The fee risk is gone.** The alignment module's warning that a licence "may be
fee-bearing by World Bank territory band" no longer describes our situation.
Brazil and Italy are both still outside the 53 Member territories, re-verified
against the published member list on 2026-09-04, so the territory facts are
unchanged; the fee is waived by the offer rather than by the geography.

**"More content" is not permission to republish SNOMED content under CC BY 4.0,
and this is the trap in the reply.** Two published Affiliate terms, both checked
on 2026-09-04 in SNOMED International's own vendor licensing guide:

1. An Affiliate is required to issue sublicences to the organisations or
   individuals who use its products or services, unless that user is itself an
   Affiliate.
2. A sub-licensee is not permitted to distribute or share SNOMED CT Content or
   Derivatives.

A CC BY 4.0 Turtle file downloaded anonymously satisfies neither. There is no
one to issue a sublicence to, and CC BY grants every recipient exactly the
redistribution right that the sublicence withholds. So the licence would let the
project *use* more SNOMED content internally; it would not let that content be
published in the ontology. **The IRI-only design stays either way**, and the
instruction in the alignment module not to add SNOMED labels or child concepts
stands unchanged.

**The cost of accepting is administrative rather than financial.** Intended use
in a non-Member territory must be reported through MLDS before it begins, and
licence holders in non-Member territories file an annual Statement of Usage.
That is a recurring obligation on whoever signs.

## The open question, which is not technical

**Who applies.** The Affiliate Licence binds a legal person. The candidates are
Renato personally, and the W3C Sensory Stimulation Vocabulary Community Group,
which is not a legal entity and cannot hold a licence. A personal licence
covering a vocabulary published by a group is workable but should be a decision
rather than a default, because it makes one individual the reporting party for a
community artifact, and because the licence would not travel if maintenance ever
did.

## Recommendation

Apply, and keep the mappings as they are. The licence costs nothing, removes the
only unresolved legal question hanging over the alignment module, and does not
require changing a single triple. Do not treat it as a mandate to enrich the
SNOMED section: the reason that section carries no labels is the CC BY conflict
above, which the licence does not dissolve.

## Draft replacement for the protected alignment comment

`static/ontology/sstim-alignments.ttl` is protected by `CLAUDE.md` §3.4 and still
says the reply is pending. It should be updated only on an explicit instruction
naming the file. The text to substitute for the paragraph beginning "An enquiry
was sent to info@snomed.org":

```turtle
# SNOMED International replied on 2026-09-04, through its Chief Digital
# Information Officer: for this use, described as inclusion in some mapping
# statements, it would grant a no-fee "public good" Affiliate Licence, applied
# for through MLDS. The fee concern above is therefore resolved. The reply did
# not rule on whether reference-only IRI use needs a licence at all, and must
# not be recorded as having done so. It does not change what may be published
# here: an Affiliate must sublicence its users, and a sub-licensee may not
# distribute or share SNOMED CT Content or Derivatives, neither of which is
# possible for an anonymous CC BY 4.0 download. So the rule below is unchanged
# and unconditional. Do not add SNOMED labels or child concepts here.
```
