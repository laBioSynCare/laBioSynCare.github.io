// A package's semver is independent of the SSTIM ontology suite version.
// Skip an exact package@version token, never a whole line or a bare version.
// The index is the start of the semver match from the caller's matchAll().
export function isSstimNpmVersion(line, versionStart) {
  return /@sstim\/(?:mcp|core)@v?$/.test(line.slice(0, versionStart))
}
