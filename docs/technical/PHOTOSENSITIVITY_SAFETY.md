# Photosensitivity & Visual-Stimulation Safety

> **For AI agents:** Some visual tracks in the Patch Studio flash, flicker, or
> move (notably `Blink`, and the mixed/fullscreen stage). Flashing light can
> affect people with photosensitive epilepsy. This document specifies the
> safety layer that gates all such output. Treat it as load-bearing alongside
> [`../concept/SCOPE.md`](../concept/SCOPE.md): it is a safety and regulatory
> measure, not a styling preference.

The canonical implementation is [`src/ui/safety/visualSafety.js`](../../src/ui/safety/visualSafety.js)
(policy store) and [`src/ui/safety/PhotosensitivityAdvisory.svelte`](../../src/ui/safety/PhotosensitivityAdvisory.svelte)
(advisory dialog), wired in [`src/routes/+layout.svelte`](../../src/routes/+layout.svelte)
and surfaced in [`src/routes/settings/+page.svelte`](../../src/routes/settings/+page.svelte).

---

## 1. Advisory on entering a stimulation route

A modal advisory is shown once per browser, on arrival at a route that can
render visual stimulation. Its wording follows `SCOPE.md` conservative framing:
it advises caution and professional guidance, and offers to disable visuals; it
does **not** make medical claims. Two actions:

- **Continue** — acknowledge and keep visual stimulation at its current setting.
- **Turn visual stimulation off** — acknowledge and set the policy to off.

Acknowledgement is persisted in `localStorage` (`bsclab.photoAdvisoryAck`), so
the advisory appears once. It can be re-opened at any time, from any route, via
**Settings → Visual stimulation → "Review photosensitivity notice"**.

**Scope.** `STIMULATION_ROUTE_PREFIXES` in
[`visualSafety.js`](../../src/ui/safety/visualSafety.js) is the authoritative
list: `/creator` (Patch Studio) and `/field` (the compatibility addresses that
redirect into a Studio starter). `routeRendersStimulation()` resolves the
deployment mount first, so the scope survives the project site serving this
application under `/sstim`.

Reading surfaces are deliberately excluded. The advisory was previously mounted
in the root layout with no route test, so it also gated the entrance, About,
the SPARQL workbench, the preset catalog and the Graph Navigator, which is
contrary to the delivered requirement that it be "inline on the door-①
demo path, never a gate on `/`" ([`DELIVERED.md`](../DELIVERED.md)). Gating
content that cannot flash costs the project its first impression on anyone
arriving cold at `w3id.org/sstim`, and it trains people to dismiss a safety
notice without reading it, which is the opposite of what the notice is for.

Two properties keep the narrowing safe, and both are asserted in
[`visualSafety.test.js`](../../src/ui/safety/visualSafety.test.js):

1. Every enforcement point in §3 that renders stimulation output lives under a
   covered prefix, so nothing can flash before the advisory has been shown.
2. The scope list cannot rot. The test enumerates every file in `src/` that
   reads the visual-stimulation policy and fails when a new one appears, so
   adding a stimulating surface forces an explicit decision about its route.
   This is the reasoning of `CLAUDE.md` §3.4: a hand-maintained list that
   nobody is obliged to revisit silently stops describing reality.

Because the advisory lives in the root layout and SvelteKit moves between
routes without remounting it, the visibility test is derived from the current
pathname rather than evaluated once on mount. A reader who lands on the
entrance and clicks into the Studio meets the advisory on arrival; a mount-time
check would miss that path entirely, which is the whole of the visitor journey.

---

## 2. Global visual-stimulation policy

A single boolean policy, `visualStimulationOn` (store + `localStorage` key
`bsclab.visualStimulation`), is the source of truth for whether any visual
stimulation may render.

**Default selection:**

- If the user has a stored choice, it wins.
- Otherwise, if the OS reports `prefers-reduced-motion: reduce`, visual
  stimulation defaults to **off** (a safe default for motion-sensitive users).
- Otherwise it defaults to **on**.

It is toggled in **Settings → Visual stimulation** (Enabled / Disabled) and
applied before first paint by `initVisualStimulation()` in the root layout, which
also sets `documentElement.dataset.visualStim` for CSS hooks.

---

## 3. Enforcement points

| Surface | Behaviour when policy is off |
|---|---|
| Patch Studio visual track previews | Replaced by a static "Visual stimulation is off" placeholder; `Blink` and blinking `ColorField` tracks are also rate-capped (see §4) ([`PresetCreator.svelte`](../../src/ui/creator/PresetCreator.svelte)) |
| **Mix** modal / optional fullscreen visual stage | Disabled (the button is inert when off or when there are no visual tracks) |
| Future PixiJS visual engine | Must read `isVisualStimulationOn()` and render nothing when off |
| Graph Navigator deep-link beacon | Holds one steady halo instead of blinking ([`OntologyGraph.svelte`](../../src/ui/graph/OntologyGraph.svelte)). This is a navigation cue, not stimulation output: it blinks a single halo four times at 2.08 Hz, below the 3 Hz ceiling of §4, and it also holds steady under `prefers-reduced-motion`. It honours the policy but does not put `/graph` in the advisory scope of §1 |

Audio and editing are unaffected by the policy — only visual stimulation is
gated. The former `/field/*` screens now redirect into Patch Studio; retained
standalone Field components are legacy golden/adapter code, not another public
enforcement surface.

---

## 4. Design rationale & future work

- The advisory is **opt-through, not opt-in to flashing**: users always see the
  caution once and can disable visuals at any time.
- `prefers-reduced-motion` is honored as a safe default, consistent with the
  accessibility conventions in [`../../src/ui/README.md`](../../src/ui/README.md).
- The global on/off policy is the first line. A **flash-rate cap** shared by
  Patch Studio's Field-derived tracks and retained legacy Field code lives in
  [`src/ui/safety/flashSafety.js`](../../src/ui/safety/flashSafety.js): the
  general-safe ceiling is **3 Hz** (WCAG 2.3.1; Harding / ITU-R BT.1702), with
  the ~15–25 Hz peak band flagged highest-risk. Flashing above 3 Hz is clamped
  unless the user makes an explicit **per-session** acknowledgement (never
  persisted — re-confirmed each session by design, [ADR 0011](../decisions/0011-sensory-field-and-flash-safety.md)).
  The same 3 Hz threshold is modelled in the ontology as
  `sstim-ex:limitFlickerWcag`, so the gate and the vocabulary cannot diverge.
- The **Patch Studio `Blink` and blinking `ColorField` tracks** use the same cap. Because Patch Studio
  is an authoring tool where alpha (10 Hz) and gamma (40 Hz) flicker entrainment
  are legitimate targets, the cap there is opt-through, not a hard ceiling: rates
  above 3 Hz are capped until the author makes an explicit **per-session**
  acknowledgement (never persisted, never saved into the patch — so a shared
  patch can't flash a recipient who never consented), with the live risk level
  shown on each affected track card.
- The stereoscopic depth tracks do **not** implement
  independent per-eye flicker. If dichoptic frequency tagging or any other
  per-eye flicker is added later, it must use the same 3 Hz cap at minimum and
  may require stricter gating because per-eye asymmetry compounds visual risk.
- Still planned (not yet built): applying the cap to the future PixiJS visual
  engine, contrast limits, and a conditional SHACL "flashing channel must declare
  a photosensitivity boundary" check.

See also: [`PATCH_STUDIO.md` §5.2](PATCH_STUDIO.md) and the W3C CG scope, which
explicitly includes **safety metadata** as a vocabulary concern
([`../../README.md`](../../README.md)).
