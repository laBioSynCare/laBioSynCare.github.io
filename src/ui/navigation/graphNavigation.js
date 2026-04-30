import { writable } from 'svelte/store'

export const defaultGraphNavigation = {
  available: false,
  scopes: [],
  scope: '',
  focusNodeQuery: '',
  focusNodeOptions: [],
  canCenter: false,
  setScope: () => {},
  setFocusNodeQuery: () => {},
  center: () => {},
  fit: () => {},
  relayout: () => {},
}

export const graphNavigation = writable(defaultGraphNavigation)

export function resetGraphNavigation() {
  graphNavigation.set(defaultGraphNavigation)
}
