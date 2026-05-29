import { writable } from 'svelte/store'

export const SKIN_STORAGE_KEY = 'bsclab.skin'
export const DEFAULT_SKIN_ID = 'paper'

export const skins = [
  {
    id: 'midnight',
    name: 'Midnight Lab',
    description: 'Deep graphite surfaces with clear blue operational controls.',
    swatches: ['#080d12', '#111820', '#3b9eff', '#e67e22', '#16a085'],
    font: 'System UI',
    border: 'Fine',
  },
  {
    id: 'aurora',
    name: 'Aurora Glass',
    description: 'Cool teal and violet accents for graph-heavy review work.',
    swatches: ['#071013', '#102026', '#42d3c8', '#b882ff', '#ff7aad'],
    font: 'System UI',
    border: 'Fine',
  },
  {
    id: 'ember',
    name: 'Ember Console',
    description: 'Warm amber controls against calm charcoal panels.',
    swatches: ['#100d0a', '#1b1712', '#ffad3b', '#80c46b', '#55c7d6'],
    font: 'System UI',
    border: 'Medium',
  },
  {
    id: 'daylight',
    name: 'Daylight Clinic',
    description: 'Bright clinical surfaces with blue-green operational accents.',
    swatches: ['#eef4f7', '#ffffff', '#0b72c9', '#16856f', '#c46a00'],
    font: 'System UI',
    border: 'Fine',
  },
  {
    id: 'paper',
    name: 'Paper Desk',
    description: 'Soft off-white panels for long daytime reading and editing.',
    swatches: ['#f7f3ea', '#fffdf8', '#3366a3', '#8a5a00', '#7c5cc4'],
    font: 'System UI',
    border: 'Fine',
  },
]

const skinIds = new Set(skins.map((skin) => skin.id))

export const activeSkin = writable(DEFAULT_SKIN_ID)

export function normalizeSkinId(id) {
  return skinIds.has(id) ? id : DEFAULT_SKIN_ID
}

export function applySkin(id, { persist = true } = {}) {
  const skinId = normalizeSkinId(id)
  activeSkin.set(skinId)

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.skin = skinId
  }

  if (persist && typeof localStorage !== 'undefined') {
    localStorage.setItem(SKIN_STORAGE_KEY, skinId)
  }

  return skinId
}

export function initSkin() {
  let stored = DEFAULT_SKIN_ID

  if (typeof localStorage !== 'undefined') {
    stored = localStorage.getItem(SKIN_STORAGE_KEY) ?? DEFAULT_SKIN_ID
  }

  const skinId = applySkin(stored, { persist: false })

  if (typeof localStorage !== 'undefined' && stored !== skinId) {
    localStorage.setItem(SKIN_STORAGE_KEY, skinId)
  }

  return skinId
}
