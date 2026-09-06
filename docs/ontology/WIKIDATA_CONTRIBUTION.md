# Wikidata contribution plan

**Status:** plan of record · created 2026-07-29 · maintained by Renato Fabbri

Companion to [`REGISTRY_SUBMISSIONS.md`](REGISTRY_SUBMISSIONS.md). That file
tracks *submitting SSTIM to registries*. This one covers Wikidata specifically,
because Wikidata is not a registry we submit to — it is a commons we contribute
to, and the two require different care.

---

## 1. Two activities, routinely confused

`REGISTRY_SUBMISSIONS.md` records Wikidata as **deferred to Phase 4**, while
`TODO.md` marks two Wikidata items **`P1`**. Both are right, because they refer to
different activities:

| Activity | What it means | Status |
|---|---|---|
| **Publishing SSTIM *into* Wikidata** | Creating the ontology item, asserting term-level equivalences, minting identifiers, proposing a property | **Deferred and gated.** Bad alignments are public, propagate, and are hard to retract |
| **Contributing *to* Wikidata** | Improving items that already exist — references, corrections, labels — using domain expertise | **Open now.** Requires nothing from SSTIM and asserts nothing on its behalf |

The deferral applies to the first. It has never applied to the second, and
conflating them has left the second undone.

---

## 2. Current state

`static/ontology/sstim-alignments.ttl` carries **outbound-only** mappings: SSTIM
points at Wikidata, nothing points back. After the 2026-09-05 alignment tranche
there are 32 statements naming a Wikidata item, across neural oscillations,
techniques, neural phenomena, neural systems and neural target sites. The full
list and the reason for each predicate are in
[ALIGNMENT_CANDIDATES.md](ALIGNMENT_CANDIDATES.md); `make alignment-verify`
dereferences every one of them.

**Wikidata now references SSTIM.** Measured, not assumed: `make wikidata-inbound`
reads the claims of the exact items SSTIM maps and looks for `P2888`, `P1709` or
`P1628` values under our namespace. It found **0 of 32 on 2026-09-05** and **29 of
32 on 2026-09-06**, after stages 1 and 2 were published. The ontology item is
[`Q141325360`](https://www.wikidata.org/wiki/Q141325360). There is still no
property for SSTIM identifiers, which is stage 5.

That measurement is the point of this document. An outbound mapping is a claim
SSTIM makes about someone else's identifier; an inbound statement is what makes
SSTIM findable from the identifier a reader or a reconciliation tool already
holds. Re-run the measurement rather than editing its number by hand.

## 3. Staged plan

### Stage 0 — contribute, build standing · **substantially done 2026-08-01**

Domain-expert contributions to items that already exist. Asserts nothing about
SSTIM.

- [x] Named account: `Rfabbri`, registered 2011-08-24, 674 edits across Wikimedia
      (632 on pt.wikipedia). User page created 2026-08-01 with Babel, ORCID and a
      conflict-of-interest disclosure
- [x] **Multilingual labels and descriptions** across the eight aligned items —
      22 it/pt/es descriptions, 9 labels. `Special:Contributions` shows **53 edits,
      all dated 2026-08-01**
- [x] **Errors corrected:** the Spanish description on Q831014 said "las ondas del
      sueño" (beta characterises wakefulness, not sleep); Q863539 carried
      `skos:altLabel` "brain waves" and "alpha waves", the latter naming a
      different item (Q2469782), plus three spellings of the I-Doser software,
      which has its own item (Q1186015)
- [x] **Q98000061 typed:** `P279` → sound (Q11461), mirroring `pure tone`
      (Q1573668), and `P1889 different from` → Monaural beats (Q6898437)
- [x] Talk-page post on `Talk:Q863539` raising the phenomenon-versus-genre typing
- [x] Talk-page note on `Talk:Q831014` explaining the overwritten description
- [ ] Add references to unsourced statements — deferred; `P571` = 1839 on Q863539
      could not be sourced from the English article and was raised as a question
      instead

**Correction to this section's original claim.** It said the labels were "already
written" in `sstim-vocab.ttl`. Half true, and the wrong half mattered: the band
concepts carry bare band names (`"Alfa"@it`), which are not usable as labels for
items titled *alpha wave*, and all 256 `skos:definition` strings are `@en` only,
so every non-English description had to be written from scratch. What transferred
cleanly was the technique terminology — `Stimolazione con Toni Isocroni` and its
siblings gave Q98000061 the three labels it lacked.

**Rapid Fund rationale — verified, with one correction.** This section's claim that
Stage 0 is a prerequisite for the Rapid Fund is **correct**: `Grants:Project/Rapid`
(read 2026-08-01) requires applicants to "Have current contribution history and
experience on the target Wikimedia project(s)", and additionally "organising
experience or training experience". The only wrong figure was the timeline — the
programme runs **one round every two months** with a 2-month processing time, not
~45 days to cash.

Note what the requirement actually demands, because Stage 0 only half satisfies it:
**53 edits in a single day is a contribution history one day deep on the target
project**, and Stage 0 produced no organising or training experience at all. The
fundable list is editathons, workshops, meetups, education and cultural-heritage
work. See `docs/funding/FUNDING_LANDSCAPE.md` §2.2.

### Stage 1 — one item for the SSTIM ontology · **done 2026-09-06**

`TODO.md` gates this on WIDOCO documentation plus a stable landing page. Both now
exist: WIDOCO output is generated in CI, and `w3id.org/sstim` resolves in Turtle,
JSON-LD, RDF/XML and HTML.

- [x] Create a single Wikidata item for the SSTIM ontology, with the concept
      DOI, licence, canonical IRI, repository and documentation URL —
      **[`Q141325360`](https://www.wikidata.org/wiki/Q141325360), created
      2026-09-06.** `wbsearchentities` was checked for "SSTIM" and "Sensory
      Stimulation Ontology" first and found nothing, so the CREATE could not
      duplicate an existing item. All eight claims landed, read back through the
      API: P31 ontology, P856, P1324, P973, P275 CC BY 4.0, P407 English, P356
      the concept DOI, P571 2026-04-12

`make wikidata-statements` prints the QuickStatements block that does it. Every
value is read from `sstim-core.ttl` and `void.ttl` rather than typed into the
script, so it cannot drift from the ontology, and all four URLs in it were
resolved before it was written. It asserts the **concept** DOI, not a version
DOI: the item is about the continuing project.

`P170 creator` is deliberately absent. It takes an item for the person, and an
ORCID is not one.

It needed a signed-in human rather than further work, and got one.

#### The credential, which is what actually blocks stages 1 and 2

Neither stage is blocked by the account's standing. `Rfabbri` has edited since
2011 and carries the disclosure section 5 requires. What blocks them is that no
process on this machine holds a credential, so every batch stops at "paste this
somewhere signed in".

Two ways out, and they are different in kind.

**A bot password**, minted at `Special:BotPasswords` on wikidata.org. It is a
scoped login of the form `Rfabbri@<name>` with a generated password, accepted by
the MediaWiki Action API, and its edits appear in the account's own
contributions. Tick **Edit existing pages** and **Create, edit, and move pages**;
the second is what creating the ontology item needs. It belongs in
`docs/credentials/wikidata.md`, which is gitignored exactly as the BioPortal key
is. With it, the generated batch can be submitted directly through
`action=login`, a CSRF token, and `wbeditentity` / `wbcreateclaim`.

**QuickStatements**, authorised once by the account owner in a browser. No
credential leaves the machine, and the same generated output is pasted in.
`--bare` emits commands with no comment lines, because QuickStatements V1 is a
tab-separated command format and nothing documents `#` as a comment: a paste that
includes our prose may fail on its first line. Run the item batch, read the new
QID from the batch result, then regenerate the statements with `--stated-in Q...`
so each one cites the ontology item as well as the namespace document.

The first is faster for 30 statements and for every later tranche; the second
keeps the credential where it already is. It is a maintainer decision, not a
technical one, and nothing here depends on which is chosen.

### Stage 2 — reciprocal term links · **done 2026-09-06 for the strong mappings**

`TODO.md` requires identifiers and equivalence checked against the live
authoritative record before any mapping is published.

- [x] Re-verify every Wikidata target against its current item — **done
      2026-09-05 and now automated.** `make alignment-verify` resolves each QID
      at the Wikidata API, rejects an item that does not exist, one that is a
      scholarly article or a clinical trial rather than the subject, and one
      whose label shares no word with SSTIM's on a strong mapping. All pass.
- [ ] Upgrade `skos:closeMatch` → `skos:exactMatch` only where genuinely
      justified; leave the rest as they are
- [x] Add return statements on Wikidata referencing the released SSTIM terms —
      **29 published 2026-09-06**, one per exact, close, broad and narrow mapping,
      as 87 QuickStatements commands (claim, `P4390` qualifier, reference block).
      `make wikidata-inbound` reads 29 of 32; the three unlinked items are the
      `relatedMatch` rows below

The return statements are generated: `make wikidata-statements` derives them from
the alignment module as `P2888` with a `P4390` mapping-relation qualifier, which
is the standard pairing. Two details it gets right and a hand-written batch
would not.

**Direction inverts.** `techRepetitiveTMS skos:broadMatch wd:Q263962` says the
Wikidata concept is broader. Written on the Wikidata item the same fact reads the
other way round, so the qualifier there is *narrow match*. Publishing the
uninverted form would put a false claim somewhere SSTIM cannot correct it
silently.

**`relatedMatch` rows are held back by default.** The property is named "exact
match", and qualifying it as a related match is the weakest reading the community
accepts. Five rows across three items are affected and listed as comments in the
output: `Q863539` binaural beats (twice), `Q17166073` multisensory integration and
`Q4826866` ASMR. They are the entire difference between 29 and 32.
`--include-related` emits them once that call is made.

`make wikidata-inbound` is the check afterwards. It is also the only honest way
to say the batch landed.

Conservative by design. A wrong `exactMatch` is worse than an absent one.

### Stage 3 — items for named methods and schools · **gate: ADR 0030**

Snoezelen / Multi-Sensory Environments, Tomatis and music therapy have decades of
independent literature, so Wikidata notability is satisfied comfortably.

- [ ] Ship [ADR 0030](../decisions/0030-named-methods-and-schools.md), currently
      **Proposed**
- [ ] Then create or improve items for the named methods SSTIM models

Implementation touches protected term files — see
[ADR 0004](../decisions/0004-protected-ontology-files.md) and `CLAUDE.md` §3.4 —
and needs explicit maintainer approval.

### Stage 4 — items for BSC-specific techniques · **gate: defensive publications**

Martigli oscillation and Symmetry permutation entrainment do not exist on
Wikidata.

- [ ] File the defensive publications to arXiv / OSF / IP.com — see
      [`../ecosystem/DEFENSIVE_PUBLICATIONS.md`](../ecosystem/DEFENSIVE_PUBLICATIONS.md)
- [ ] Only then propose items

**Wikidata notability requires an independent published source. A repository
commit is not one.** This is a second, previously unstated reason the defensive
publications matter: they are prior art *and* the notability gate for these terms.
`TODO.md` already records the dependency.

### Stage 5 — a Wikidata property for SSTIM identifiers

The step that makes an ontology first-class in Wikidata rather than a footnote.

- [ ] Propose an SSTIM identifier property through the community process

Requirements and status: stable resolvable IRIs ✔, public documentation ✔,
demonstrated external use ✖ — the weak point, and the reason this comes last.
Costs nothing, needs no funder, decided on merit.

---

## 4. Ordering constraints

```
Stage 0  ─────────────────────────────────►  no gate, start any time
Stage 1  ──── WIDOCO + stable landing ─────►  gate met
Stage 2  ──── identifier verification ─────►  do after / alongside Stage 1
Stage 3  ──── ADR 0030 accepted ───────────►  blocked
Stage 4  ──── defensive publications filed ►  blocked
Stage 5  ──── demonstrated external use ───►  last
```

Stages 0–2 can proceed now. Stages 3 and 4 wait on work tracked elsewhere.

---

## 5. Principles

**Contribute before publishing.** Domain expertise offered to an existing commons
earns the standing that makes later SSTIM-specific proposals welcome rather than
self-promotional.

**Conservative equivalence.** `closeMatch` unless `exactMatch` is defensible.
Published alignments propagate into other datasets and are hard to withdraw.

**No claims that SSTIM does not make.** `CLAUDE.md` §3.5 and
[`../concept/SCOPE.md`](../concept/SCOPE.md) apply to Wikidata edits exactly as
they apply to UI strings.

**Wikidata is not a distribution channel for SSTIM.** It is a shared resource
that SSTIM can improve. Any edit that would only make sense as promotion should
not be made.
