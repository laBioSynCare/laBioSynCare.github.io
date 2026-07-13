# Public Entrance — audience-first landing IA & copy

> **Status: target design spec (not as-built).** Implements Workstream 4 of
> [`../ecosystem/ECOSYSTEM_INTEGRATION.md`](../ecosystem/ECOSYSTEM_INTEGRATION.md).
> This is the design + copy source for a future `/` landing; it does not describe
> shipped UI. Pairs with [`KNOWLEDGE_BROWSER_UX.md`](KNOWLEDGE_BROWSER_UX.md).

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
  designing and describing auditory, visual, and cross-modal stimulation — for
  research, education, and conservative non-clinical use.*
- **Institutional one-liner** (for the Join/partner door and external decks):
  *"Open standards and reference infrastructure for responsible sensory
  stimulation and sensory neurotechnology, with BioSynCare as one separate
  commercial implementation."*

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

### ① Experience it
- **For:** the curious and the users who want to *feel* it.
- **Headline:** *Try a session.*
- **Subcopy:** *Explore audio-visual sessions in your browser — no install. Start
  gently and safely.*
- **Primary CTA:** **Try the Sensory Field** → [`/field`](../../src/routes)
- **Secondary:** *Browse presets* → `/presets` · *Open Patch Studio* → `/creator`
- **Safety:** these personas pass through the photosensitivity layer
  ([`PHOTOSENSITIVITY_SAFETY.md`](PHOTOSENSITIVITY_SAFETY.md)); the runtime
  flash-rate cap is on by default. The notice **routes into a safe demo**, it is
  not a wall on the front door.

### ② Understand & reproduce it
- **For:** researchers and standards/ontology peers.
- **Headline:** *Explore and reproduce the science.*
- **Subcopy:** *Browse the SSTIM ontology, query it with SPARQL, and see how
  techniques, evidence tiers, exposure, and safety are modeled — then encode and
  reproduce a protocol across BIDS/HED/SSTIM.*
- **Primary CTA:** **Explore the ontology** → the graph browser · **Query with SPARQL** → `/sparql`
- **Secondary:** *See the HED/BIDS interoperability profile* → [`../ecosystem/HED_BIDS_INTEROP.md`](../ecosystem/HED_BIDS_INTEROP.md) · *Cite SSTIM* → `https://w3id.org/sstim` + DOI

### ③ Build on it
- **For:** implementers / developers.
- **Headline:** *Build on the open platform.*
- **Subcopy:** *Run BSC Lab locally, extend the audio engines, and use the RDF
  pipeline. Fully open source.*
- **Primary CTA:** **Read the architecture** → [`../../src/README.md`](../../src/README.md) · **Run it locally** → repo README
- **Secondary:** *The four audio engines* → [`../../src/engines/README.md`](../../src/engines/README.md)

### ④ Join & partner
- **For:** standards peers, institutions/funders/policy, and contributors.
- **Headline:** *Join the community.*
- **Subcopy:** *Help shape the shared vocabulary. Join the W3C Community Group,
  contribute a protocol, or partner as an institution.*
- **Primary CTA:** **Join the W3C group** (external W3C page) · **Contribute a protocol** → [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)
- **Secondary:** *Partner / consortium* → [`../ecosystem/CONSORTIUM_INVITATION.md`](../ecosystem/CONSORTIUM_INVITATION.md) · *Governance & charter* → [`../../CHARTER.md`](../../CHARTER.md)

## The two conversion actions (always in reach)

Regardless of door, keep these reachable from every screen (e.g. a persistent
header/footer bar):

- **Join the W3C group**
- **Contribute a protocol**

These are the social-conversion levers; burying them in one door defeats the goal.

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
- Do **not** remove the graph browser — make it door ②'s destination. Decide
  whether it moves to a sub-route (e.g. `/graph`) or a section below the fold.
- No AudioContext/worklet involvement here — this is chrome, not the engine.

## Decisions & open questions

- **Door order — DECIDED 2026-07-13:** **② Understand & reproduce leads**
  (foreground scientific seriousness), then ① Experience, ③ Build, ④ Join.
- [ ] Confirm the hero headline/subhead wording.
- [ ] Should `/` fully replace the current graph-first homepage, or precede it?

## Next actions

- [ ] Confirm door order + hero copy with Renato.
- [ ] Wireframe the four-door grid + conversion bar.
- [ ] Decide the graph browser's new home (`/graph` vs. section).
- [ ] Fold into [`KNOWLEDGE_BROWSER_UX.md`](KNOWLEDGE_BROWSER_UX.md) and open a
      `src/routes/` implementation task (Phase 2).
