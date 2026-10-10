#!/usr/bin/env bash
# Prime the fixed-output Nix dev shell on GitHub runners, where upstream
# archives and tarballs.nixos.org occasionally return transient failures.
# No fallback versions, sources, or relaxed checksums are permitted.
set -euo pipefail

attempts=3
for ((attempt=1; attempt<=attempts; attempt++)); do
  log="${RUNNER_TEMP:-/tmp}/sstim-nix-warm-${attempt}.log"
  echo "Pinned Nix environment: attempt ${attempt}/${attempts}"
  if nix develop --command true >"$log" 2>&1; then
    cat "$log"
    exit 0
  fi
  cat "$log" >&2
  # Integrity errors and ordinary build/programming errors must never retry.
  if grep -Eqi 'hash mismatch|checksum mismatch|hash differs|unexpected hash' "$log"; then
    echo "Nix integrity failure: no retry" >&2
    exit 1
  fi
  if ! grep -Eqi 'cannot download|error checking the existence|temporary failure|timed out|timeout|http error|connection reset|connection refused|could not resolve|rate limit|tls handshake' "$log"; then
    echo "Nix failed for a non-network reason: no retry" >&2
    exit 1
  fi
  if ((attempt == attempts)); then
    echo "Pinned Nix dependencies unavailable after ${attempts} attempts" >&2
    exit 1
  fi
  sleep "$((attempt * 15))"
done
