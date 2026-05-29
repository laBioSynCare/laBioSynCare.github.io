import { writable } from 'svelte/store'

// Global photosensitivity / visual-stimulation policy.
//
// Some visual tracks flash, flicker, or move and could affect people with
// photosensitive epilepsy. This module is the single source of truth for
// whether visual stimulation is allowed to render, plus the one-time advisory
// acknowledgement. It mirrors the persisted-store pattern used by skins.js and
// audioEngines.js.

export const VISUAL_STIM_KEY = 'bsclab.visualStimulation' // 'on' | 'off'
export const PHOTO_ACK_KEY = 'bsclab.photoAdvisoryAck'    // '1' once acknowledged

// Whether visual stimulation (animated/flashing previews and, later, the visual
// engine output) is allowed to render at all.
export const visualStimulationOn = writable(true)

// Lets the Settings page (or anything) re-open the advisory on demand.
export const advisoryOpen = writable(false)

let current = true

export function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function applyVisualStimulation(on, { persist = true } = {}) {
  current = !!on
  visualStimulationOn.set(current)
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.visualStim = current ? 'on' : 'off'
  }
  if (persist && typeof localStorage !== 'undefined') {
    localStorage.setItem(VISUAL_STIM_KEY, current ? 'on' : 'off')
  }
  return current
}

export function initVisualStimulation() {
  let on = true
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(VISUAL_STIM_KEY)
    if (stored === 'on' || stored === 'off') on = stored === 'on'
    else if (prefersReducedMotion()) on = false // safe default for reduce-motion users
  }
  return applyVisualStimulation(on, { persist: false })
}

export function isVisualStimulationOn() {
  return current
}

export function photoAdvisoryAcknowledged() {
  return typeof localStorage !== 'undefined' && localStorage.getItem(PHOTO_ACK_KEY) === '1'
}

export function acknowledgePhotoAdvisory() {
  if (typeof localStorage !== 'undefined') localStorage.setItem(PHOTO_ACK_KEY, '1')
}

export function resetPhotoAdvisory() {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(PHOTO_ACK_KEY)
}
