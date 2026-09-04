# SNOMED International: a free public good Affiliate Licence is offered

**Status: reply received and application submitted, both 2026-09-04. Awaiting
approval.** Privacy-safe record of a direct reply, not a transcript. The message,
its headers, the support ticket reference, the sender's contact details and the
MLDS affiliate number stay in the access-limited correspondence tree,
consistently with [ADR 0031](../../decisions/0031-qualified-ecosystem-records.md).

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

## Who applied, which was the open question

The Affiliate Licence binds a legal person, and the W3C Sensory Stimulation
Vocabulary Community Group is not one. The application was filed in the name of
**Aeterni Anima**, organisation type "Other / Non-formalized", at the Modena
address, with Renato as the contact. It was submitted on 2026-09-04 and the
account stands at "Applying".

The consequence to keep in view: the licence holder is Aeterni Anima while SSTIM
is published by the Community Group, so the declared usage text names SSTIM, the
Community Group and the CC BY 4.0 publication explicitly. What the licence covers
is what that text describes, which is why it is reproduced below rather than
summarised.

## What was declared

| Field | Value |
|---|---|
| Type of Agreement | Affiliate, Public Good |
| Usage Type | Academic, subtype Development |
| Implementation Status | **Live / Implemented** |
| Countries in Use | Italy (home, non-Member) |
| Hospitals, Practices | none, none |
| Sublicensed Institutions | none |
| Licence period | 2026-01 to 2026-12 |

**Why Live rather than In Progress / Development**, since the first reading here
was the other one and it was wrong. The two mapping statements are not in a
frozen release: 0.16.0 was tagged 2026-08-19 and the mappings landed on
2026-08-23, so they sit on the 0.17.0-dev line. That was mistaken for
"not deployed". Both public origins serve them today, measured on 2026-09-04:
`https://w3c-cg.github.io/sstim/ontology/sstim-alignments.ttl` and the legacy
`https://labiosyncare.github.io/ontology/sstim-alignments.ttl` each return HTTP
200 with `snomed:226056003` and `snomed:122545008` present. The use is live and
publicly retrievable; only the version freeze is pending. Declaring development
would have understated a deployed use.

**The one declared tension.** "Academic, for internal use within an Organization"
is the closest available Usage Type, but SSTIM is published openly rather than
used internally. Rather than pick a category that fits worse, the discrepancy was
stated plainly in the usage text and raised directly with SNOMED in the reply
confirming submission, offering to change it if another category fits better.

## Standing recommendation

Keep the mappings exactly as they are. The licence removes the only unresolved
legal question over the alignment module and required changing no triple. Do not
treat it as a mandate to enrich the SNOMED section: the reason that section
carries no labels is the CC BY conflict above, which the licence does not
dissolve.

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
