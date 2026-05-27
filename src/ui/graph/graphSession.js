export const graphSession = {
  graphScope: 'all',
  focusNodeQuery: '',
  showSubClassOf: true,
  showObjProp: true,
  showDataProp: false,
  showNarrower: true,
  showRelated: true,
  showInstanceOf: true,
  selectedIri: '',
  neighborhoodFocus: false,
  connectionFilters: [],
  camera: null,
}

export function saveGraphSession(partial) {
  Object.assign(graphSession, partial)
}
