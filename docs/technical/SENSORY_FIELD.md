# Sensory Field

> **For AI agents:** The Sensory Field is a minimal stimulation *instrument*,
> separate from the Patch Studio. It is the first deliverable rung of the
> sensory-stimulation interface and the reference consumer of the `sstim-ex:`
> exposure ontology. Decision record: [ADR 0011](../decisions/0011-sensory-field-and-flash-safety.md).
> It is bound by the same invariants as the rest of the app — `AudioContext.currentTime`
> is the only AV-sync clock (CLAUDE.md §3.1), conservative wellness framing only
> (CLAUDE.md §3.5), and the photosensitivity layer in
> [PHOTOSENSITIVITY_SAFETY.md](PHOTOSENSITIVITY_SAFETY.md).

Route: `/field/` ([src/routes/field/+page.svelte](../../src/routes/field/+page.svelte)).
Module: [src/ui/field/](../../src/ui/field/).

---

## 1. What it is

A user picks a full-screen colour and an independent per-ear sound, and presses
Play. That alone is sensory stimulation — the resting, zero-frequency (DC) case.
Turning on **blink** (visual) or a **beat** (audio) adds the time dimension. The
distinctive power is the *contrast across channels*: a static field in one ear
while the other entrains, a binaural beat, a gently blinking colour.

## 2. The channel model

The conceptual target is a per-channel × time matrix — left eye, right eye, left
ear, right ear, tactile — each cell either static (0 Hz) or modulated at a
frequency. Steps 1–2 deliver the **physically honest subset** on commodity
hardware:

| Channel | Delivered now | Laterality |
|---|---|---|
| Visual field | one full-screen field (both eyes) | No — single field; per-eye is **Step 3** (needs dichoptic/stereoscopic rendering) |
| Left ear / Right ear | true independent L/R (panned Carrier voices) | **Yes** |
| Tactile | (planned) Web Vibration pulse | No (single actuator) |

Eye-laterality is *modelled* in the ontology (`placementEyeLeft/Right`) but not
*delivered* until Step 3.

## 3. Steps

- **Step 1 — static field.** Colour + intensity; per-ear tone (frequency, level)
  and/or noise (white/pink/brown). No time variation. Trivially safe.
- **Step 2 — modulation.** Visual **blink** (colour ↔ black at a chosen rate and
  duty) and audio **beat**: *monaural* (one tone, amplitude-modulated, via the
  engine's tremolo) or *binaural* (a small frequency difference between the ears).
  This is where the flash-rate and sound-level safety becomes load-bearing.
- **Step 3 — depth (outline, not built).** Stereoscopic depth from two shapes
  whose separation is driven by the beat or Martigli wave; true per-eye
  (dichoptic) delivery. Notes for whoever builds it:
  - **Free-view parallel (wall-eyed)** assigns left image → left eye, the same as
    a **VR headset**. **Cross-eyed** free-viewing assigns left image → right eye —
    the *mirror* of parallel. A cross-eye pair fed to VR/parallel without swapping
    L/R produces **inverted (pseudoscopic) depth**.
  - So the stereo *content* transfers across cross-eye, parallel, and VR, but the
    **L/R ordering is method-specific**. Store one canonical pair; let the
    capability (`capabilityFreeViewStereoscopy` vs `capabilityVrHeadset`) decide
    whether to swap. VR additionally needs lens pre-distortion, IPD, and FOV.
  - Per-eye flicker asymmetry (dichoptic frequency tagging) is a known paradigm
    but compounds photosensitivity risk — gate it at least as strictly as Step 2.

## 4. Audio

Built on the existing `IAudioEngine` ([audioEngines.js](../../src/engines/audio/audioEngines.js)).
Per-ear delivery uses two `Carrier` voices hard-panned −1 / +1 (and `Noise`
voices likewise); a binaural beat is just a frequency difference between them; a
monaural beat is the engine's `tremolo` on equal-frequency tones. The clock is
`AudioContext.currentTime`; `engine.resume()` is called inside the Play gesture
(autoplay policy). Sound level is **advisory only** — BSC Lab cannot measure
delivered SPL — with conservative defaults and a NIOSH 85 dBA / 8 h note.

## 5. Safety

- **Global gate.** The field renders only when `isVisualStimulationOn()` is true
  (see [PHOTOSENSITIVITY_SAFETY.md](PHOTOSENSITIVITY_SAFETY.md)); otherwise a
  placeholder shows.
- **Flash-rate cap.** [flashSafety.js](../../src/ui/safety/flashSafety.js) caps the
  blink rate at the general-safe **3 Hz** (WCAG 2.3.1; Harding / ITU-R BT.1702)
  unless the user makes an explicit **per-session** acknowledgement. Rates in the
  ≈ 15–25 Hz peak band are flagged highest-risk. The acknowledgement is never
  persisted — it is re-confirmed each session by design (ADR 0011).
- The same 3 Hz threshold is modelled as `sstim-ex:limitFlickerWcag`, so the gate
  and the ontology cannot silently diverge.

## 6. Exposure-profile emission

Every configuration serialises to an `sstim-ex:ExposureProfile`
([exposureProfile.js](../../src/ui/field/exposureProfile.js)), the same shape as the
committed reference instance
[`sensory-field-example.ttl`](../../static/ontology/instances/experiments/sensory-field-example.ttl).
Mapping:

| UI concept | Exposure terms |
|---|---|
| Colour field | `mediumVisualLight`, `modalityVisual`, `patternFixedColor`, `placementEyes`, `capabilityDisplayLightOutput`, `hasGainLevel` |
| Blink | `patternBlinking`, `capabilityDisplayFlicker`, `hasFlickerRateHz`, `hasDutyCycle`, `boundaryPhotosensitivity` |
| Per-ear tone | `mediumAirConductedSound`, `modalityAuditory`, `placementEarLeft` / `placementEarRight`, `capabilityHeadphones` + `capabilityStereoSeparation`, `patternContinuous`, `hasFrequencyHz`, `hasGainLevel`, `boundaryHearingRisk` |
| Noise | `patternNoise` + an `audioNoise…` colour concept |
| Beat | `hasBeatFrequencyHz` |

The exported flash rate is the **delivered** (clamped) rate, not the raw slider
value, so the profile reflects what actually played. The "In the ontology" panel
links each active concept to the graph view via
[fieldSemantic.js](../../src/ui/field/fieldSemantic.js).

## 7. File map

```
src/routes/field/+page.svelte      route (thin)
src/ui/field/SensoryField.svelte   main UI: session, clock loop, controls, export
src/ui/field/FieldStage.svelte     render surface (colour fill / fullscreen)
src/ui/field/fieldState.js         channel state model + persistence (bsclab.field)
src/ui/field/exposureProfile.js    state → sstim-ex:ExposureProfile (N3 Writer)
src/ui/field/fieldSemantic.js      UI concept → ontology IRI (graph links)
src/ui/safety/flashSafety.js       flash-rate cap + risk classification
```
