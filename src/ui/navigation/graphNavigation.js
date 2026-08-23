import { writable } from 'svelte/store'

export const defaultGraphNavigation = {
  available: false,
  // Scope axes. Choices union within an axis and intersect across axes; the
  // OntologyGraph owns the state and publishes the toggles here so the top bar
  // stays a pure renderer.
  layers: [],
  modules: [],
  profiles: [],
  concerns: [],
  layerFilters: new Set(),
  moduleFilters: new Set(),
  concernFilters: new Set(),
  includeModuleDependencies: true,
  activeProfile: null,
  scopeSummary: '',
  scopeFilterCount: 0,
  moduleCounts: new Map(),
  toggleLayer: () => {},
  toggleModule: () => {},
  toggleConcern: () => {},
  setProfile: () => {},
  setIncludeModuleDependencies: () => {},
  resetScope: () => {},
  focusNodeQuery: '',
  focusNodeOptions: [],
  canCenter: false,
  strayMode: 'all',
  setFocusNodeQuery: () => {},
  setStrayMode: () => {},
  center: () => {},
  fit: () => {},
  relayout: () => {},
}

export const graphNavigation = writable(defaultGraphNavigation)

export function resetGraphNavigation() {
  graphNavigation.set(defaultGraphNavigation)
}
