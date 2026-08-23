#!/usr/bin/env bash
# Deployment conformance: assert a running BSC Lab instance is correct.
#
# One definition of "correctly deployed", used by every deployment path we
# support — the NixOS VM test and the OCI container both run this exact script.
# Two hand-written approximations would drift, and the point of having more than
# one deployment is that they behave identically.
#
# Usage:  smoke-http.sh http://localhost:8080
#
# Deliberately POSIX-ish and dependency-free beyond curl and grep, because it
# runs inside a minimal NixOS VM and a minimal container.

set -euo pipefail

BASE="${1:?usage: smoke-http.sh BASE_URL}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

fails=0
ok()   { printf '  ok   %s\n' "$1"; }
bad()  { printf '  FAIL %s — %s\n' "$1" "$2"; fails=$((fails + 1)); }

# Fetch to a file rather than piping into grep. `curl | grep -q` exits 23 under
# pipefail because grep closes the pipe on first match, which looks exactly like
# a missing page and is not one.
fetch() {
  curl --fail --silent "$BASE$1" -o "$TMP/body" 2>/dev/null
}

head_of() {
  curl --silent --head "$BASE$1" -o "$TMP/head" 2>/dev/null
  tr 'A-Z' 'a-z' < "$TMP/head"
}

echo "smoke-http: asserting $BASE"

# 1. The application is served.
if fetch "/" && grep -qc 'BSC Lab' "$TMP/body" 2>/dev/null; then
  ok "GET / serves the application"
else
  bad "GET /" "did not serve the application"
fi

# 2. Every prerendered route returns its own page, not a fallback.
for route in graph creator sparql presets logbook settings about; do
  if fetch "/$route/"; then ok "GET /$route/"; else bad "GET /$route/" "not served"; fi
done

# Former Field screens remain static compatibility artifacts whose SvelteKit
# redirect pages point at ordinary Patch Studio starter intents.
while read -r route starter; do
  if fetch "$route" && grep -Fq "/creator/?starter=$starter" "$TMP/body"; then
    ok "GET $route redirects to Patch Studio starter=$starter"
  else
    bad "GET $route" "missing Patch Studio starter redirect"
  fi
done <<'EOF'
/field/ field
/field/tree/ tree
/field/abstract/ abstract
/field/landscape/ landscape
EOF

# 3. Ontology publication, with media types RDF clients actually need.
if fetch "/ontology/sstim-core.ttl" && grep -q '@prefix sstim:' "$TMP/body"; then
  ok "GET /ontology/sstim-core.ttl"
else
  bad "GET /ontology/sstim-core.ttl" "missing or not Turtle"
fi

case "$(head_of /ontology/sstim-core.ttl)" in
  *"text/turtle"*) ok "Turtle content-type" ;;
  *) bad "Turtle content-type" "not text/turtle" ;;
esac

case "$(head_of /ontology/context.jsonld)" in
  *"application/ld+json"*) ok "JSON-LD content-type" ;;
  *) bad "JSON-LD content-type" "not application/ld+json" ;;
esac

# 4. PWA assets.
if fetch "/service-worker.js"; then ok "GET /service-worker.js"; else bad "GET /service-worker.js" "not served"; fi

case "$(head_of /manifest.webmanifest)" in
  *"application/manifest+json"*) ok "web manifest content-type" ;;
  *) bad "web manifest content-type" "not application/manifest+json" ;;
esac

# 5. Cross-origin isolation. static/_headers records this policy but is Netlify
#    syntax that GitHub Pages ignores, so a self-hosted deployment is the first
#    one that can actually apply it.
ROOT_HEAD="$(head_of /)"
for header in \
  "cross-origin-opener-policy: same-origin" \
  "cross-origin-embedder-policy: require-corp" \
  "cross-origin-resource-policy: same-origin"
do
  case "$ROOT_HEAD" in
    *"$header"*) ok "${header%%:*} applied" ;;
    *) bad "${header%%:*}" "missing" ;;
  esac
done

# 6. An unknown path must be a real 404. Without this, a fallback-everything
#    host would make every assertion above vacuous.
code="$(curl --silent --output /dev/null --write-out '%{http_code}' "$BASE/definitely-not-a-route.xyz")"
if [ "$code" = "404" ]; then
  ok "unknown path returns 404"
else
  bad "unknown path" "expected 404, got $code"
fi

# 7. The instance states which commit it was built from. Without this, a
#    deployment that silently serves the wrong artifact — or nothing at all —
#    is indistinguishable from a correct one from the outside.
if fetch "/build-info.json" && grep -q 'bsc-lab-build-info-1' "$TMP/body"; then
  ok "GET /build-info.json declares its build"
else
  bad "GET /build-info.json" "missing or not a build-info document"
fi

echo
if [ "$fails" -eq 0 ]; then
  echo "smoke-http: PASS"
else
  echo "smoke-http: FAIL ($fails)"
  exit 1
fi
