# Public Entrance — audience-first landing IA & copy

> **Status: shipped 2026-07-18** (`src/routes/+page.svelte`). Implements
> Workstream 4 of
> [`../ecosystem/ECOSYSTEM_INTEGRATION.md`](../ecosystem/ECOSYSTEM_INTEGRATION.md).
> This file is the design + copy source of record — update it in the same
> change as any future entrance edit. Pairs with
> [`KNOWLEDGE_BROWSER_UX.md`](KNOWLEDGE_BROWSER_UX.md).

## Problem

The live root drops an unfamiliar visitor straight into an ontology graph and a
photosensitivity notice. It signals technical seriousness but never answers the
three questions a newcomer actually has: **what is this, who is it for, how do I
take part.** The bottleneck is social conversion, not more construction — so the
front door has to *route*, not impress.

## Goal

A first screen that (1) names what this is in plain language, (2) sends each kind
of visitor to their door, and (3) keeps the two conversion actions always in
reach. The existing ontology graph becomes a *destination behind door ②*, not the
front door.

## Hero

- **Headline:** *Sensory stimulation, made open and reproducible.*
- **Subhead:** *An open knowledge graph, an executable lab, and a community for
  designing and describing auditory, visual, and cross-modal stimulation.*
  (Trimmed 2026-07-18: the earlier draft's trailing "— for research,
  education, and conservative non-clinical use" was cut on review as
  boilerplate that didn't inform or persuade. The non-clinical/wellness
  framing isn't lost — it's stated properly, with the actual boundary, in
  the About page's scope note and `SCOPE.md`; the hero doesn't need to
  carry a compliance clause that says nothing concrete.)
- **Institutional one-liner** (footer):
  *"Open standards and reference infrastructure for responsible sensory
  stimulation and sensory neurotechnology."*
  (Trimmed 2026-07-18: cut the trailing "— with BioSynCare as one separate
  commercial implementation" clause on review — the About page, one link
  away in the same footer, already draws that distinction properly, with
  room to explain it instead of a dangling clause. Decks/external contexts
  without an adjacent About link may still want the fuller sentence; that's
  a per-context call, not a change to this shared string.)

All copy uses permitted wellness verbs only (support, facilitate, encourage,
explore, guide, invite); no "treat/cure/proven" (`CLAUDE.md` §3.5,
[`../concept/SCOPE.md`](../concept/SCOPE.md)).

## Persona → door mapping

Seven audience archetypes, grouped into four doors (a door may serve several).

| # | Persona | Door |
|---|---|---|
| 1 | Curious newcomer / general public | ① Experience |
| 2 | Appreciator / user / self-experimenter | ① Experience |
| 3 | Researcher (sensory / neuro / psychophysics) | ② Understand & reproduce |
| 5 | Standards / ontology peer (W3C, HED/BIDS, OBO) | ② Understand & reproduce · ④ Join |
| 4 | Implementer / developer | ③ Build |
| 6 | Institution / partner / funder / policy | ④ Join & partner |
| 7 | Contributor / community member | ④ Join & partner |

## The four doors (copy + routes)

**Display order (decided 2026-07-13):** ② Understand → ① Experience → ③ Build →
④ Join. The page **leads with Understand** to foreground scientific seriousness;
the numbers below are stable IDs, not the display order.

Door copy was cut hard on the 2026-07-18 review pass — one short sentence of
body copy per door, one secondary link where a second one didn't earn its
place. The eyebrow labels were also cut to a single word each (`UNDERSTAND`,
`EXPERIENCE`, `BUILD`, `JOIN`) instead of restating the headline's own verbs.

### ① Experience it
- **For:** the curious and the users who want to *feel* it.
- **Headline:** *Try a session.*
- **Subcopy:** *Audio-visual sessions in your browser — no install, start gently.*
- **Primary CTA:** **Open Patch Studio** → `/creator`
- **Secondary:** *Try the Sensory Field* → [`/field`](../../src/routes) · *Browse presets* → `/presets`
  (**Revised 2026-07-18:** Patch Studio promoted to primary, Sensory Field
  demoted to secondary — flagged on review. Sensory Field's own "start
  gently" framing sits a little oddly against Patch Studio as the door's
  headline action now; left as-is pending the open question below about
  whether Field and Studio should be reworked together rather than just
  reordered.)
- **Safety:** these personas pass through the photosensitivity layer
  ([`PHOTOSENSITIVITY_SAFETY.md`](PHOTOSENSITIVITY_SAFETY.md)); the runtime
  flash-rate cap is on by default. The notice **routes into a safe demo**, it is
  not a wall on the front door.

### ② Understand & reproduce it
- **For:** researchers and standards/ontology peers.
- **Headline:** *Explore and reproduce the science.*
- **Subcopy:** *Browse the SSTIM ontology, follow the evidence behind a claim,
  and query it all with SPARQL.*
  (**Revised 2026-08-07:** the earlier subcopy ended "…and encode a protocol
  across BIDS/HED", which promised a capability that does not exist.
  [`../ecosystem/HED_BIDS_INTEROP.md`](../ecosystem/HED_BIDS_INTEROP.md) opens
  with *"revised design target, not as-built … no current BSC Lab exporter
  should be described as implementing this profile"* — and this door was the
  only place in the repository describing it as one. The replacement clause
  names something a visitor can actually do: **Evidence & claims** is a
  browsable scope in `/graph`, with assessment claims, tiers and modality
  tags. The About page still links the interoperability document as the
  design record it is.)
- **Primary CTA:** **Explore the ontology** → `/graph` · **Query with SPARQL** → `/sparql`
- **Secondary:** *Read the reference docs* → `/ontology/docs/` · *Cite SSTIM* →
  opens `CiteSstimModal` (see below), not a direct link to the namespace IRI.
  (**Revised 2026-08-07:** the generated WIDOCO/pyLODE reference was reachable
  only from the top bar's `+` menu and from About, yet it is the first thing
  this door's own audience — standards and ontology peers — goes looking for.
  It earns the second slot the 2026-07-18 pass reserved. It exists in the
  deployed artifact only, never in the tree, so the link carries
  `rel="external"` to keep the prerender crawler off it, exactly as
  `AppTopBar` does. Still cut: a HED/BIDS link, for the reason above.)

### Cite SSTIM — modal, not a bare namespace link

*Cite SSTIM* used to link straight to `https://w3id.org/sstim` — the
machine-facing namespace IRI, useless to a human trying to write a
bibliography entry. Flagged on review 2026-07-18. It now opens
`src/ui/entrance/CiteSstimModal.svelte`: the plain citation and BibTeX form
(from `CITATION.cff`, each with a one-click copy), the **version DOI** — the one
to actually cite — versus the **concept DOI**, for referring to SSTIM across
releases (README's "Citation And License" section explains the distinction),
the stable namespace IRI, and a link to that same README section for the
Apache-2.0 (software) / CC BY 4.0 (ontology) license split.

Every identifier in that modal comes from `src/ui/entrance/releaseMetadata.js`
and **none is written here**. This paragraph used to name the version DOI and
release inline, and went two releases stale doing it — the same drift, in the
same words, that the module was created to end. `make truth-audit` now audits
this file too.

The footer's separate namespace link is a different need from "how do I cite
this": it is the identifier, not a destination — see the footer note under
"Decisions & open questions".

### ③ Build on it
- **For:** implementers / developers.
- **Headline:** *Deploy and extend the open platform.*
- **Subcopy:** *One bit-reproducible package runs as a NixOS service, a
  container, or plain static files — and your data migrates between instances
  with no account.*
- **Primary CTA:** **Deployment and portability** →
  [`PORTABLE_DEPLOYMENT.md`](PORTABLE_DEPLOYMENT.md) · **Run it locally** → repo README
- **Secondary:** *Read the architecture* → [`../../src/README.md`](../../src/README.md) ·
  *The four audio engines* → [`../../src/engines/README.md`](../../src/engines/README.md)

  (**Revised 2026-07-31**, recorded here 2026-08-07: the door was rewritten
  when G1–G3, G6 and G9 closed — self-hosting became the interesting claim, so
  the headline gained *deploy* and the architecture link moved down to make
  room for the portability document. Every clause is backed by a command in
  `PORTABLE_DEPLOYMENT.md` §0: `nix build --rebuild`, `nix flake check`,
  `nix build .#oci`, `make migrate-test`. **Shortened 2026-08-07:** the
  rewrite had grown to three sentences, roughly triple its neighbours, which
  broke the four-card rhythm the 2026-07-18 pass had established. The
  configured-at-deployment detail it carried is the linked document's job.)

### ④ Join & partner
- **For:** standards peers, institutions/funders/policy, and contributors.
- **Headline:** *Join the community.*
- **Subcopy:** *Shape the shared vocabulary, propose a protocol, or partner as
  an institution.*
- **Primary CTA:** **Join the W3C group** (external W3C page) · **Contribute a
  protocol** → opens `ContributeProtocolModal` (see below), *not* a direct
  link to `CONTRIBUTING.md`.
- **Secondary:** *Partner / consortium* → [`../ecosystem/CONSORTIUM_INVITATION.md`](../ecosystem/CONSORTIUM_INVITATION.md).
  (Still cut 2026-07-18: the Governance & charter link — charter is reachable
  from the modal's "read the full contribution guide" and from `/about`.)
  (**2026-08-08:** back to one secondary link. Two candidates were tried in the
  second slot and both belong elsewhere — the ecosystem brief moved up to the
  hero, and [`../ecosystem/ECOSYSTEM_INTEGRATION.md`](../ecosystem/ECOSYSTEM_INTEGRATION.md)
  to About. See the hero orientation note under "Decisions & open questions".)

### Contribute a protocol — modal, not a raw file link

Linking straight to `CONTRIBUTING.md` — hundreds of lines, mostly the software
and ontology contributor path — was the wrong front door for a newcomer with a
protocol idea, flagged on review 2026-07-18. **`Contribute a protocol` now
opens `src/ui/entrance/ContributeProtocolModal.svelte`:** one short paragraph
of instructions, three fields (protocol name, plain-language description,
optional contact), and a submit action that opens a **prefilled GitHub Issues
draft** in a new tab — the visitor reviews and posts it themselves, no
backend involved (`title`/`body` query params on `/issues/new`, no
`template=` param since legacy `.md` issue templates don't reliably honor a
custom `body` alongside one). The modal's own copy avoids naming the
`preset` data format — that's internal jargon a first-time visitor hasn't
been introduced to; it just says a maintainer will follow up.

`.github/ISSUE_TEMPLATE/protocol-contribution.md` is the parallel path for
someone who goes straight to GitHub's "new issue" chooser instead of through
the modal — same short, plain-language shape as the existing `use-case.md`
and `term-proposal.md` templates. Both paths, plus the modal's own "read the
full contribution guide" link, ultimately point back to `CONTRIBUTING.md`
§3 (Layer 2 — Preset design) for the person who wants the deep version.

## Wireframe (four-door grid + conversion bar)

Desktop (≥ 992 px). Display order ② ① / ③ ④ row-wise — **Understand leads**
(top-left, first in reading order and DOM order). Door cards are semantic
Pico.css `<article>` elements in a two-column CSS grid.

```
┌────────────────────────────────────────────────────────────────────┐
│ BSC Lab   Graph · Presets · Field · Studio · SPARQL · …        ◐   │ ← existing nav
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│        Sensory stimulation, made open and reproducible.            │ ← hero H1
│    An open knowledge graph, an executable lab, and a community     │ ← subhead
│    for designing and describing auditory, visual, and              │
│    cross-modal stimulation.                                        │
│    New here? One-page ecosystem brief — how the knowledge graph,   │ ← orientation
│    this platform, and the applications fit together.               │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────┐ ┌──────────────────────────────┐  │
│ │ ② Understand                 │ │ ① Experience                 │  │
│ │ Explore and reproduce the    │ │ Try a session.               │  │
│ │ science. (subcopy)           │ │ (subcopy)                    │  │
│ │ [Explore the ontology]       │ │ [Open Patch Studio]          │  │
│ │ [Query with SPARQL]          │ │ Sensory Field · Presets      │  │
│ │ Reference docs · Cite SSTIM  │ │                              │  │
│ └──────────────────────────────┘ └──────────────────────────────┘  │
│ ┌──────────────────────────────┐ ┌──────────────────────────────┐  │
│ │ ③ Build                      │ │ ④ Join                       │  │
│ │ Deploy and extend the open   │ │ Join the community.          │  │
│ │ platform. (subcopy)          │ │ (subcopy)                    │  │
│ │ [Deployment and portability] │ │ [Join the W3C group]         │  │
│ │ [Run it locally]             │ │ [Contribute a protocol]      │  │ ← opens modal
│ │ Architecture · Audio engines │ │ Consortium                   │  │
│ └──────────────────────────────┘ └──────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────┤
│ footer: one-liner · Namespace + DOI · GitHub · BioSynCare · About  │
└────────────────────────────────────────────────────────────────────┘
```

Mobile (< 768 px): single column, doors stacked in display order ② ① ③ ④.
Once the hero has scrolled out of view, a slim **sticky bottom bar** with
the two conversion actions appears — this is what keeps them reachable
during the long stacked scroll, without needing a return trip to door ④.

**Revised 2026-07-18** (was: the conversion bar duplicated in the hero,
the sticky bar, *and* the footer — three copies of the same two buttons,
with the hero and door ④ instances stacked in the same viewport on desktop.
Flagged on review as clutter, not as "always reachable.") The two actions
now render **once**, inline in door ④ where they're native content — plus
the **mobile-only** sticky bar for scroll reachability. Nothing duplicates
on desktop; `src/ui/entrance/ConversionBar.svelte` now has a single
consumer (`variant="sticky"`). Theme-aware (light/dark), no scroll-triggered
animation beyond the sticky bar's own appearance/disappearance.

## Graph browser home — DECIDED (2026-07-18)

The entrance **fully replaces** the graph-first `/`; the knowledge browser
moves to a dedicated **`/graph`** route. Not a below-the-fold section,
because the browser is a full-viewport three-column app surface: embedding
it in a scrolling page creates a scroll-vs-pan gesture conflict, it already
breaks under ~900 px, and it would force the heavy Cytoscape + ontology
load on every entrance visit, defeating the lazy-load rule.

Deep-link and w3id compatibility:

- **`/#term` stays valid.** The entrance runs a tiny hash-forward shim on
  mount: any `location.hash` that is not an entrance-own anchor (entrance
  ids use a `door-`/`hero` prefix) forwards to `/graph` + hash with
  `replaceState`. The canonical deep-link form becomes `/graph#term`;
  every previously shared `/#term` link keeps resolving.
- **w3id routes unchanged.** All merged HTML conneg branches 303 to the
  bare root with no fragment. After the change, an HTML-preferring visitor
  from `w3id.org/sstim/*` lands on the entrance with door ② one click from
  the browser — consistent with the "Understand leads" decision. Optional
  follow-up, no urgency: retarget the HTML branches to `/graph` in a
  future routine w3id PR (bundled with other rule changes, using the
  upstream PR template).

## The two conversion actions

- **Join the W3C group**
- **Contribute a protocol**

These are the social-conversion levers the ecosystem needs. They live inline
in door ④ (their natural home — that door *is* "join and contribute") plus
the mobile sticky bar for scroll reachability; see "Revised 2026-07-18"
above for why they're no longer also duplicated in a hero/footer bar.

## Safety-first routing (non-negotiable)

- Personas 1–2 must reach a *safe* demo, with the flash-rate cap active
  ([ADR 0011](../decisions/0011-sensory-field-and-flash-safety.md)).
- The photosensitivity advisory appears before any flashing content but must not
  block orientation — show it inline on the demo path, not as a gate on `/`.

## Implementation notes (for the eventual build — Phase 2 UX)

- Lives on the `/` route (`src/routes/`). **Svelte 5 runes only** (`$props`,
  `$state`, `$derived`, `onclick`, `{@render children()}`) — no Svelte 4 syntax.
- Pico.css semantic HTML; theme-aware (light/dark); responsive (doors as a
  grid that stacks on mobile).
- Do **not** remove the graph browser — make it door ②'s destination. It
  moves to `/graph` with a hash-forward shim on `/` (see "Graph browser
  home — DECIDED" above).
- No AudioContext/worklet involvement here — this is chrome, not the engine.

## Decisions & open questions

- **Door order — DECIDED 2026-07-13:** **② Understand & reproduce leads**
  (foreground scientific seriousness), then ① Experience, ③ Build, ④ Join.
- **Graph home — DECIDED 2026-07-18:** `/` is fully replaced by the entrance;
  the browser moves to `/graph` with a hash-forward shim (see above).
- **Hero copy — SHIPPED 2026-07-18:** headline confirmed as-is; subhead
  trimmed on review (see "Hero" above). No open wording question remains.
- **Conversion-bar placement — REVISED 2026-07-18:** once, in door ④, plus
  the mobile sticky bar — not hero + door ④ + footer (see "Wireframe" above).
- **Contribute a protocol — REVISED 2026-07-18:** opens
  `ContributeProtocolModal` → prefilled GitHub issue draft, not a direct
  `CONTRIBUTING.md` link (see "Contribute a protocol" above).
- **Cite SSTIM — REVISED 2026-07-18:** opens `CiteSstimModal` instead of
  linking straight to the namespace IRI (see "Cite SSTIM" above).
- **Institutional one-liner — TRIMMED 2026-07-18:** dropped the BioSynCare
  clause; About covers it (see "Hero" above).
- **Door ① primary CTA — REVISED 2026-07-18:** Patch Studio, not Sensory
  Field (see door ① above).
- **Hero orientation line — ADDED 2026-08-08.** One plain line under the
  subhead: *"New here? One-page ecosystem brief — how the knowledge graph, this
  platform, and the applications fit together."* → `/docs/BioSynCare_Ecosystem_Brief_EN.pdf`.
  This is the one thing four doors cannot do. Each door answers "what can I do
  here"; none places SSTIM against BSC Lab against BioSynCare, and a visitor who
  cannot make that distinction cannot tell which door is theirs — the most
  common report about this project is that it is hard to grasp as a whole. The
  brief was first placed in door ④ and moved: a reader who is still orienting
  does not scroll to the fourth card to find the overview. It is a line of text,
  not a button, so the hero keeps its no-CTA shape (see "Wireframe"). Also
  linked first in About's Links & licensing list.
  - **The PDF is served from `static/docs/`, and its authoring copy lives in the
    gitignored `docs/funding/documents/` tree.** Two copies, so a revision has
    to be copied forward or the published brief silently goes stale — the same
    failure mode as the release identifiers, without a derived-facts fix
    available (a PDF has nothing to derive from). `src/ui/externalLinks.js`
    holds the URL and says so.
  - **What replacing the tracker fixed:** the 2026-08-07 pass had put
    `ECOSYSTEM_INTEGRATION.md` in door ④. Wrong artifact for a visitor — 500
    lines of open workstreams, KPIs and outreach notes answer "how is this
    project being run", not "what is this project". It stays linked from About.
- **Door ② subcopy — CORRECTED 2026-08-07:** dropped the BIDS/HED encoding
  claim, which described an unbuilt exporter; added the generated reference
  docs as door ②'s second secondary link (see door ② above).
- **Door ③ — SHORTENED 2026-08-07:** back to one sentence, like its three
  neighbours (see door ③ above).
- **Share preview — ADDED 2026-08-07:** the entrance emits its own
  `og:`/`twitter:` title and description, built from the same two strings as
  the hero, so a shared link stops previewing with `app.html`'s generic
  shell description. **Deliberately no `og:image` or `og:url`:** both must be
  absolute, and other operators deploy this same artifact under their own
  origin ([`PORTABLE_DEPLOYMENT.md`](PORTABLE_DEPLOYMENT.md) §1.6d) — a
  hardcoded `labiosyncare.github.io` would be wrong on every self-hosted
  instance, and the origin cannot be recovered at runtime because crawlers do
  not run the script that reads `runtime-config.json`. A `summary` card
  carries title and description without an image.
- **Footer — EXTENDED 2026-08-08:** the row is now *Namespace w3id.org/sstim ·
  DOI … · GitHub · BioSynCare (commercial app) · About*.
  - **BioSynCare** was the one layer of the four-layer model a reader could not
    go and look at; About describes it and now links it too. The label says
    *commercial app* because an unqualified "BioSynCare" in the open platform's
    footer is precisely the conflation `CLAUDE.md` §11 exists to prevent. This
    does **not** reinstate the institutional one-liner's cut BioSynCare clause
    (see "Hero" above) — a labelled link is not a dangling subordinate clause.
  - **Namespace** now qualifies the IRI, matching its DOI neighbour, because it
    is an identifier and not a destination: `w3id.org/sstim` answers a browser
    with the entrance itself, by design and by test (see below). The reader
    who wants something to read gets door ②'s reference-docs link.
- **The w3id round-trip — RESOLVED 2026-08-08, and it was not a page defect.**
  The 2026-08-07 pass recorded the footer IRI as a dead end to be fixed by
  retargeting the w3id HTML branch. It is a deliberate decision, asserted in
  `scripts/w3id-negotiation.test.mjs`: *"a person typing w3id.org/sstim wants
  the project, not a generated reference page."* Changing it would serve the
  entrance's own footer at the cost of everyone arriving cold. What the audit
  did uncover in that area was real and is fixed: **every catalog and ecosystem
  entity IRI was answering browsers with this entrance** — `framework/bsc`, the
  two implementations, the Patch Studio component, all seven BSC techniques, and
  every `specialist/`, `organization/` and `ecosystem-record/` identifier.
  Upstream #6393 had deep-linked them into `/graph/#…`; #6480 rewrote the file
  from an older base and reverted all of it, unnoticed, because the rules were
  never mirrored into this repository and nothing asserted them. They are
  restored in `docs/ecosystem/w3id/sstim/.htaccess` and pinned by test; the
  registry still serves the reverted rules until a perma-id PR syncs it.
- **Shared link constants — 2026-08-08:** `src/ui/externalLinks.js` now owns the
  repository URL, the W3C group URL, BioSynCare, and the two generated-doc
  paths. The W3C URL had been typed into three files, the repository URL into
  six. `/ontology/docs/` also gained a tracked placeholder under
  `static/ontology/docs/` so those links explain themselves under `make dev`
  instead of 404ing; deployment overwrites it with the generated index.
- **Release metadata — GUARDED 2026-08-07:** the entrance footer's DOI and
  `CiteSstimModal`'s whole citation come from
  `src/ui/entrance/releaseMetadata.js`, which had gone two releases stale and
  was handing visitors a superseded version DOI. `make truth-audit` now
  derives the release identity from `void.ttl`/`sstim-core.ttl`/`CITATION.cff`
  and compares it against that module. Its prose scan already covered
  `+page.svelte` and always had — the numbers had simply moved somewhere it
  did not look.
- [ ] **Open — Sensory Field × Patch Studio relationship.** Raised on the
  2026-07-18 review: should Sensory Field be developed further as a
  standalone, simpler on-ramp instrument, or folded into Patch Studio as a
  single surface? They're currently documented as deliberately distinct
  (`SENSORY_FIELD.md` — a guided instrument with its own Step 1–3 roadmap,
  currently at Step 2; `PATCH_STUDIO.md` — the full multi-track designer),
  and Sensory Field's role as door ①'s low-commitment "start gently" path
  is part of why it existed as a separate surface at all. A merge is an
  architecture decision (engine sharing, route consolidation, UX model), not
  an entrance copy tweak — needs a real answer before touching engine code,
  not a guess baked into a landing page.

## Next actions

The entrance, the conversion bar, both modals, and the move of the browser to
`/graph` all shipped on 2026-07-18. Two optional follow-ups remain, neither
urgent:

- Retarget the merged w3id HTML branches to `/graph` in a future bundled w3id PR
  (see "Graph browser home" above). They currently 303 to the bare root, which
  works — a visitor lands on orientation, one click from the browser.
- Create the `protocol-proposal` GitHub label referenced in
  `.github/ISSUE_TEMPLATE/protocol-contribution.md`'s frontmatter — the same
  not-yet-created situation as the pre-existing `use-case` / `term-proposal`
  labels.
