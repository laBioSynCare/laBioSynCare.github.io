// Filter state is stored as plain arrays, not Sets: this object is also the
// shape the component restores from, and a Set would survive in-app navigation
// but not a future serialization of the session.
export const graphSession = {
  layerFilters: ['terms'],
  moduleFilters: [],
  concernFilters: [],
  hiddenKinds: [],
  includeModuleDependencies: true,
  // Deliberately session-only, never written to the URL. A hidden set is an
  // editorial act on a citable artifact's graph; it survives navigation inside
  // the app, but a link someone else opens must show the whole scope.
  hiddenNodes: [],
  focusNodeQuery: '',
  showSubClassOf: true,
  showObjProp: true,
  showDataProp: false,
  showNarrower: true,
  showRelated: true,
  showInstanceOf: true,
  showCatalogRelation: true,
  showEcosystemRelationship: true,
  selectedIri: '',
  neighborhoodFocus: false,
  connectionFilters: [],
  strayMode: 'all',
  camera: null,
}

export function saveGraphSession(partial) {
  Object.assign(graphSession, partial)
}
