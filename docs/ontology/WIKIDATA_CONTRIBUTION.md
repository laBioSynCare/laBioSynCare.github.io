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

`static/ontology/sstim-alignments.ttl` carries a small set of **outbound-only**
mappings — SSTIM points at Wikidata, nothing points back:

| SSTIM term | Wikidata | Predicate |
|---|---|---|
| `sstim-v:alpha` | `Q2469782` alpha wave | `skos:closeMatch` |
| `sstim-v:delta` | `Q2623205` delta wave | `skos:closeMatch` |
| `sstim-v:theta` | `Q2370623` theta rhythm | `skos:closeMatch` |
| `sstim-v:beta` | `Q831014` beta wave | `skos:closeMatch` |
| `sstim-v:gamma` | `Q2623017` gamma wave | `skos:closeMatch` |
| `sstim-v:voiceBinaural` | `Q863539` binaural beats | `skos:relatedMatch` |
| `sstim-v:voiceSymmetry` | `Q98000061` isochronic tones | `skos:relatedMatch` |

Totals across the file: 7 `closeMatch`, 2 `exactMatch`, 3 `relatedMatch`.

Nothing on Wikidata references SSTIM. There is no Wikidata item for the ontology,
and no property for SSTIM identifiers.

---

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

### Stage 1 — one item for the SSTIM ontology · **gate met**

`TODO.md` gates this on WIDOCO documentation plus a stable landing page. Both now
exist: WIDOCO output is generated in CI, and `w3id.org/sstim` resolves in Turtle,
JSON-LD, RDF/XML and HTML.

- [ ] Create a single Wikidata item for the SSTIM ontology, with version DOI,
      concept DOI, licence, canonical IRI and documentation URL

Needs a decision, not further work.

### Stage 2 — reciprocal term links · **gate: verify each identifier**

`TODO.md` requires identifiers and equivalence checked against the live
authoritative record before any mapping is published.

- [ ] Re-verify all seven Wikidata targets against their current items
- [ ] Upgrade `skos:closeMatch` → `skos:exactMatch` only where genuinely
      justified; leave the rest as they are
- [ ] Add return statements on Wikidata referencing the released SSTIM terms

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
