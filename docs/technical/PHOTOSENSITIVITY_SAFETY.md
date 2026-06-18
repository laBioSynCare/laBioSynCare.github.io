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

## 1. Page-load advisory

On first load (per browser), a modal advisory is shown before the user engages
with any stimulation. Its wording follows `SCOPE.md` conservative framing — it
advises caution and professional guidance, and offers to disable visuals; it
does **not** make medical claims. Two actions:

- **Continue** — acknowledge and keep visual stimulation at its current setting.
- **Turn visual stimulation off** — acknowledge and set the policy to off.

Acknowledgement is persisted in `localStorage` (`bsclab.photoAdvisoryAck`), so
the advisory appears once. It can be re-opened from **Settings → Visual
stimulation → "Review the photosensitivity notice"**.

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
| Patch Studio visual track previews | Replaced by a static "Visual stimulation is off" placeholder ([`PresetCreator.svelte`](../../src/ui/creator/PresetCreator.svelte)) |
| **Mix** / fullscreen visual stage | Disabled (the button is inert when off or when there are no visual tracks) |
| Sensory Field (`/field/`) | The colour field shows a placeholder when off; the blink rate is additionally capped by `flashSafety.js` (see §4) — [`FieldStage.svelte`](../../src/ui/field/FieldStage.svelte), [`SensoryField.svelte`](../../src/ui/field/SensoryField.svelte) |
| Future PixiJS visual engine | Must read `isVisualStimulationOn()` and render nothing when off |

Audio and editing are unaffected by the policy — only visual stimulation is
gated.

---

## 4. Design rationale & future work

- The advisory is **opt-through, not opt-in to flashing**: users always see the
  caution once and can disable visuals at any time.
- `prefers-reduced-motion` is honored as a safe default, consistent with the
  accessibility conventions in [`../../src/ui/README.md`](../../src/ui/README.md).
- The global on/off policy is the first line. A **flash-rate cap** is now
  implemented for the Sensory Field in
  [`src/ui/safety/flashSafety.js`](../../src/ui/safety/flashSafety.js): the
  general-safe ceiling is **3 Hz** (WCAG 2.3.1; Harding / ITU-R BT.1702), with
  the ~15–25 Hz peak band flagged highest-risk. Flashing above 3 Hz is clamped
  unless the user makes an explicit **per-session** acknowledgement (never
  persisted — re-confirmed each session by design, [ADR 0011](../decisions/0011-sensory-field-and-flash-safety.md)).
  The same 3 Hz threshold is modelled in the ontology as
  `sstim-ex:limitFlickerWcag`, so the gate and the vocabulary cannot diverge.
- Still planned (not yet built): applying the cap to the Patch Studio `Blink`
  track and the PixiJS engine, contrast limits, and a conditional SHACL
  "flashing channel must declare a photosensitivity boundary" check.

See also: [`PATCH_STUDIO.md` §5.2](PATCH_STUDIO.md) and the W3C CG scope, which
explicitly includes **safety metadata** as a vocabulary concern
([`../../README.md`](../../README.md)).
