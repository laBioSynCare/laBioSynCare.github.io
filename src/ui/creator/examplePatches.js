// Ready-made patches, bundled with the Studio and loadable in one click.
//
// The entrance promises "try a session, start gently" and then opened a
// modular editor with an empty-ish patch, a column of + buttons and no
// indication of what to press. These are the answer: six small patches that
// each demonstrate one thing the model can do, openable without an account,
// without a file, and without knowing the format first.
//
// They are built with the same factories the UI uses rather than written as
// literal JSON, so an example cannot drift out of the model: a renamed field
// or a changed default is picked up here automatically, and
// examplePatches.test.js round-trips every one through the real export and
// import path.
//
// These are Patch Studio patches (`patch-studio-model-3`), not catalog presets.
// The two models are distinct and the bridge between them is gated by ADR 0026
// (CLAUDE.md §4, §11) — nothing here is a preset in the catalog sense, and
// nothing here should grow a `header`, a `group`, or an evidence tier.
//
// The blurbs describe how each patch is configured, deliberately, rather than
// what it will do for the listener. That keeps them accurate and keeps them
// clear of the product-claim surface in CLAUDE.md §3.5.

import {
  createAudioTrack,
  createDraft,
  createEmptyDraft,
  createLfoTrack,
  createMod,
  createTiming,
  createVisualTrack,
} from './presetDraft.js'

function draft(patchName, { lengthSec = 600, controlTracks = [], audioTracks = [], visualTracks = [] } = {}) {
  return {
    ...createEmptyDraft(),
    patchName,
    timing: createTiming({ lengthSec }),
    controlTracks,
    audioTracks,
    visualTracks,
  }
}

function isochronic({ name, frequency, pulseRate, gain = 0.28 }) {
  const track = createAudioTrack('IsochronicTone', { name })
  track.params.gain.value = gain
  track.params.frequency.value = frequency
  track.params.pulseRate.value = pulseRate
  return track
}

export const EXAMPLE_PATCHES = Object.freeze([
  {
    id: 'alpha-10-isochronic',
    label: 'Alpha 10 Hz isochronic',
    blurb: 'A 200 Hz tone pulsed ten times a second, with a soft attack and release on each pulse. The smallest complete patch the Studio makes.',
    build: () => draft('Alpha 10 Hz isochronic', {
      // A patch needs at least one control track to validate cleanly, even
      // when nothing is linked to it yet: the Studio warns otherwise, and an
      // example that opens with a warning teaches the wrong thing.
      controlTracks: [createLfoTrack({ name: 'Spare LFO', periodSec: 10, targetPeriodSec: 10 })],
      audioTracks: [isochronic({ name: 'Alpha pulse', frequency: 200, pulseRate: 10 })],
    }),
  },
  {
    id: 'gamma-40-isochronic',
    label: 'Gamma 40 Hz isochronic',
    blurb: 'The same shape at forty pulses a second, the rate most often used in gamma-band studies. Compare it with the alpha patch to hear what the pulse rate alone changes.',
    build: () => draft('Gamma 40 Hz isochronic', {
      controlTracks: [createLfoTrack({ name: 'Spare LFO', periodSec: 10, targetPeriodSec: 10 })],
      audioTracks: [isochronic({ name: 'Gamma pulse', frequency: 220, pulseRate: 40 })],
    }),
  },
  {
    id: 'binaural-alpha',
    label: 'Binaural alpha beat',
    blurb: '200 Hz in the left ear and 210 Hz in the right. The 10 Hz difference is heard as a beat that is not present in either channel on its own.',
    needs: 'Headphones required',
    build: () => {
      const beat = createAudioTrack('BinauralBeat', { name: 'Alpha beat' })
      beat.params.gain.value = 0.22
      beat.params.leftFreq.value = 200
      beat.params.rightFreq.value = 210
      return draft('Binaural alpha beat', {
        controlTracks: [createLfoTrack({ name: 'Spare LFO', periodSec: 10, targetPeriodSec: 10 })],
        audioTracks: [beat],
      })
    },
  },
  {
    id: 'theta-breathing-pacer',
    label: 'Theta breathing pacer',
    blurb: 'A six second rise and fall, shaped by an LFO linked to a carrier’s level. Slow enough to breathe along with, and the clearest illustration of a control track driving an audio parameter.',
    build: () => {
      const breath = createLfoTrack({
        name: 'Breath',
        waveform: 'sine',
        periodSec: 6,
        targetPeriodSec: 6,
      })
      const carrier = createAudioTrack('Carrier', { name: 'Soft carrier' })
      // Modulation adds on top of the base level, so the base has to sit low
      // enough that the swell lands where the other examples do. Measured in a
      // real AudioContext: 0.2 with a 0.6 link peaked at 0.43 against ~0.16
      // for its siblings, which is a startling thing to open on headphones.
      carrier.params.gain.value = 0.08
      carrier.params.frequency.value = 160
      // The link that makes this a pacer rather than a steady tone.
      carrier.params.gain.mods = [createMod(breath.id, 0.22)]
      return draft('Theta breathing pacer', {
        controlTracks: [breath],
        audioTracks: [carrier],
      })
    },
  },
  {
    id: 'ocean-drone',
    label: 'Ocean and drone',
    blurb: 'An ocean recording under a five voice drone at 110 Hz. Nothing pulses and nothing is modulated: an ambient bed, and a starting point to add your own tracks to.',
    build: () => {
      const ocean = createAudioTrack('Sample', { name: 'Ocean', sampleId: 'ocean' })
      ocean.params.gain.value = 0.3
      const drone = createAudioTrack('Drone', { name: 'Drone', droneVoices: 5 })
      drone.params.gain.value = 0.18
      drone.params.frequency.value = 110
      return draft('Ocean and drone', {
        controlTracks: [createLfoTrack({ name: 'Spare LFO', periodSec: 12, targetPeriodSec: 12 })],
        audioTracks: [ocean, drone],
      })
    },
  },
  {
    id: 'colour-wash-and-tone',
    label: 'Colour wash and tone',
    blurb: 'A slow gradient beside a quiet 160 Hz carrier: one visual track and one audio track sharing the same transport, which is how every cross-modal patch is put together.',
    build: () => {
      const carrier = createAudioTrack('Carrier', { name: 'Quiet carrier' })
      carrier.params.gain.value = 0.16
      carrier.params.frequency.value = 160
      const wash = createVisualTrack('Gradient', { name: 'Colour wash' })
      return draft('Colour wash and tone', {
        controlTracks: [createLfoTrack({ name: 'Wash LFO', periodSec: 8, targetPeriodSec: 8 })],
        audioTracks: [carrier],
        visualTracks: [wash],
      })
    },
  },
])

export function getExamplePatch(id) {
  return EXAMPLE_PATCHES.find((example) => example.id === id) ?? null
}

/** Build the draft for `id`, or the Studio's own default patch if unknown. */
export function buildExampleDraft(id) {
  const example = getExamplePatch(id)
  return example ? example.build() : createDraft()
}
