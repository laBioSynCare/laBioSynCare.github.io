import { writable } from 'svelte/store'

import { logicalApplicationPath } from '../../config/applicationUrls.js'

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

// The routes that can render visual stimulation, and therefore the only ones
// that must carry the advisory before the reader gets there.
//
// This used to be "every route", because the advisory was mounted in the root
// layout with no route test at all. That over-reached the policy this file
// implements: a reader arriving at the namespace IRI, the SPARQL workbench or
// the preset catalog met a photosensitive-epilepsy warning over content that
// cannot flash, which is both a poor first impression and a way to teach people
// to dismiss a safety notice without reading it.
//
// Scope is a list rather than a per-component signal because the advisory has
// to be shown *before* the stimulating component renders, and a component that
// announced itself on mount would arrive one frame too late. The list is kept
// honest by visualSafety.test.js, which enumerates every file that reads this
// policy and fails when a new one appears without a scope decision — the same
// reasoning as CLAUDE.md §3.4, where a hand-maintained list silently stopped
// protecting things nobody remembered to add.
export const STIMULATION_ROUTE_PREFIXES = ['/creator', '/field']

/**
 * Whether `pathname` is a route that may render visual stimulation.
 *
 * Takes a runtime pathname, so it resolves the deployment mount first: the
 * project site serves this application under /sstim, and a bare prefix test
 * would silently stop matching there and drop the advisory entirely.
 */
export function routeRendersStimulation(pathname) {
  if (typeof pathname !== 'string' || !pathname.startsWith('/')) return false
  const route = logicalApplicationPath(pathname)
  return STIMULATION_ROUTE_PREFIXES.some(
    (prefix) => route === prefix || route.startsWith(`${prefix}/`),
  )
}

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
