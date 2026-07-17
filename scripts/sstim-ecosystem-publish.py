#!/usr/bin/env python3
"""Validate and atomically activate one external SSTIM ecosystem aggregate.

The access-controlled Firestore ledger is written first. The Firebase Hosting
public projection is released only after the complete SSTIM admission contract
passes. Neither artifact is copied into the citable repository.
"""

from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import os
import shutil
import ssl
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

try:  # System Python on macOS often needs certifi; Nix supplies CA roots.
    import certifi
except ImportError:  # pragma: no cover - environment-specific fallback
    certifi = None


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_PROJECT = "biosyncare-lab"
DEFAULT_SITE = "biosyncare-lab"
HOSTING_API = "https://firebasehosting.googleapis.com/v1beta1"
FIRESTORE_API = "https://firestore.googleapis.com/v1"


def ssl_context() -> ssl.SSLContext:
    cafile = certifi.where() if certifi is not None else None
    return ssl.create_default_context(cafile=cafile)


def command(args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, cwd=ROOT, check=True, text=True, capture_output=True)


def gcloud_executable() -> str:
    configured = os.environ.get("GCLOUD")
    if configured:
        return configured
    discovered = shutil.which("gcloud")
    if discovered:
        return discovered
    local_sdk = Path.home() / "Downloads" / "google-cloud-sdk" / "bin" / "gcloud"
    if local_sdk.is_file():
        return str(local_sdk)
    raise SystemExit("gcloud is required; set GCLOUD to its executable path")


def external_file(value: str, label: str) -> Path:
    path = Path(value).expanduser().resolve()
    if not path.is_file():
        raise SystemExit(f"{label} does not name a readable file")
    if ROOT in path.parents:
        raise SystemExit(f"{label} must remain outside the public repository")
    return path


class GoogleApi:
    def __init__(self, gcloud: str, project: str):
        self.project = project
        self.token = command([gcloud, "auth", "print-access-token"]).stdout.strip()
        if not self.token:
            raise SystemExit("gcloud returned no access token")
        self.context = ssl_context()

    def request(
        self,
        method: str,
        url: str,
        *,
        payload: dict | None = None,
        body: bytes | None = None,
        content_type: str = "application/json",
        allow_status: set[int] | None = None,
    ) -> tuple[int, dict | bytes]:
        if payload is not None and body is not None:
            raise ValueError("payload and body are mutually exclusive")
        data = json.dumps(payload).encode() if payload is not None else body
        request = Request(
            url,
            data=data,
            method=method,
            headers={
                "Authorization": f"Bearer {self.token}",
                "x-goog-user-project": self.project,
                "Content-Type": content_type,
            },
        )
        try:
            with urlopen(request, timeout=60, context=self.context) as response:
                raw = response.read()
                if not raw:
                    return response.status, {}
                if response.headers.get_content_type() == "application/json":
                    return response.status, json.loads(raw)
                return response.status, raw
        except HTTPError as error:
            raw = error.read()
            if allow_status and error.code in allow_status:
                try:
                    return error.code, json.loads(raw)
                except (json.JSONDecodeError, UnicodeDecodeError):
                    return error.code, raw
            message = f"Google API request failed with HTTP {error.code}"
            try:
                detail = json.loads(raw).get("error", {}).get("message")
                if detail:
                    message += f": {detail}"
            except (json.JSONDecodeError, UnicodeDecodeError):
                pass
            raise SystemExit(message) from None


def assert_hosting_site(api: GoogleApi, project: str, site: str) -> None:
    _, response = api.request(
        "GET", f"{HOSTING_API}/projects/{quote(project)}/sites"
    )
    sites = response.get("sites", [])
    if not any(item.get("name", "").endswith(f"/sites/{site}") for item in sites):
        raise SystemExit(f"Firebase Hosting site {site!r} does not exist")


def write_private_audit(
    api: GoogleApi,
    project: str,
    private_bytes: bytes,
    public_bytes: bytes,
) -> str:
    if len(private_bytes) > 900_000:
        raise SystemExit("private ledger exceeds the safe Firestore document size")
    private_hash = hashlib.sha256(private_bytes).hexdigest()
    public_hash = hashlib.sha256(public_bytes).hexdigest()
    document_id = f"admission-{private_hash[:32]}"
    document_url = (
        f"{FIRESTORE_API}/projects/{quote(project)}/databases/(default)/documents/"
        f"sstimEcosystemAudit/{quote(document_id)}"
    )
    status, existing = api.request(
        "GET", document_url, allow_status={404}
    )
    if status == 200:
        fields = existing.get("fields", {})
        if fields.get("privateSha256", {}).get("stringValue") != private_hash:
            raise SystemExit("existing private audit identifier has a hash mismatch")
        return document_id

    create_url = (
        f"{FIRESTORE_API}/projects/{quote(project)}/databases/(default)/documents/"
        f"sstimEcosystemAudit?{urlencode({'documentId': document_id})}"
    )
    created_at = datetime.now(timezone.utc).isoformat(timespec="seconds").replace(
        "+00:00", "Z"
    )
    api.request(
        "POST",
        create_url,
        payload={
            "fields": {
                "ledgerTurtle": {"stringValue": private_bytes.decode("utf-8")},
                "privateSha256": {"stringValue": private_hash},
                "publicSha256": {"stringValue": public_hash},
                "state": {"stringValue": "active"},
                "createdAt": {"timestampValue": created_at},
            }
        },
    )
    return document_id


def deploy_public_projection(
    api: GoogleApi,
    site: str,
    public_bytes: bytes,
) -> str:
    _, version = api.request(
        "POST",
        f"{HOSTING_API}/sites/{quote(site)}/versions",
        payload={
            "labels": {"sstim_ecosystem": "live_only"},
            "config": {
                "headers": [
                    {
                        "glob": "**",
                        "headers": {
                            "Access-Control-Allow-Origin": "*",
                            "Cache-Control": "no-store",
                            "Content-Type": "text/turtle; charset=utf-8",
                            "X-Content-Type-Options": "nosniff",
                        },
                    }
                ]
            },
        },
    )
    version_name = version["name"]
    compressed = gzip.compress(public_bytes, mtime=0)
    file_hash = hashlib.sha256(compressed).hexdigest()
    _, population = api.request(
        "POST",
        f"{HOSTING_API}/{version_name}:populateFiles",
        payload={"files": {"/current.ttl": file_hash}},
    )
    if file_hash in population.get("uploadRequiredHashes", []):
        upload_url = f"{population['uploadUrl']}/{file_hash}"
        api.request(
            "POST",
            upload_url,
            body=compressed,
            content_type="application/octet-stream",
        )
    api.request(
        "PATCH",
        f"{HOSTING_API}/{version_name}?{urlencode({'update_mask': 'status'})}",
        payload={"status": "FINALIZED"},
    )
    api.request(
        "POST",
        f"{HOSTING_API}/sites/{quote(site)}/releases?"
        f"{urlencode({'versionName': version_name})}",
    )
    return version_name


def verify_public_projection(site: str, expected: bytes) -> None:
    context = ssl_context()
    actual = b""
    content_type = ""
    cors = None
    for attempt in range(30):
        request = Request(
            f"https://{site}.web.app/current.ttl",
            headers={"Accept": "text/turtle", "Cache-Control": "no-cache"},
        )
        try:
            with urlopen(request, timeout=60, context=context) as response:
                actual = response.read()
                content_type = response.headers.get("Content-Type", "")
                cors = response.headers.get("Access-Control-Allow-Origin")
        except HTTPError as error:
            if error.code != 404:
                raise
        if actual == expected:
            break
        if attempt < 29:
            time.sleep(2)
    if actual != expected:
        raise SystemExit("Firebase Hosting verification returned unexpected RDF bytes")
    if not content_type.startswith("text/turtle"):
        raise SystemExit("Firebase Hosting did not serve the public projection as Turtle")
    if cors != "*":
        raise SystemExit("Firebase Hosting public projection is missing wildcard CORS")


def delete_older_versions(api: GoogleApi, site: str, current: str) -> None:
    _, response = api.request(
        "GET", f"{HOSTING_API}/sites/{quote(site)}/versions?pageSize=100"
    )
    for version in response.get("versions", []):
        name = version.get("name")
        if name == current or version.get("status") == "DELETED":
            continue
        api.request("DELETE", f"{HOSTING_API}/{name}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--public-candidate", required=True)
    parser.add_argument("--private-ledger", required=True)
    parser.add_argument("--project", default=DEFAULT_PROJECT)
    parser.add_argument("--site", default=DEFAULT_SITE)
    parser.add_argument("--shacl-workers", type=int, default=4)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run the admission contract but make no Firebase changes.",
    )
    args = parser.parse_args()

    public_candidate = external_file(args.public_candidate, "public candidate")
    private_ledger = external_file(args.private_ledger, "private ledger")
    if public_candidate == private_ledger:
        raise SystemExit("public candidate and private ledger must be separate files")
    if args.shacl_workers < 1:
        parser.error("--shacl-workers must be at least 1")

    subprocess.run(
        [
            sys.executable,
            str(ROOT / "scripts" / "sstim-ecosystem-contract.py"),
            "--public-candidate", str(public_candidate),
            "--private-ledger", str(private_ledger),
            "--shacl-workers", str(args.shacl_workers),
        ],
        cwd=ROOT,
        check=True,
    )

    public_bytes = public_candidate.read_bytes()
    private_bytes = private_ledger.read_bytes()
    public_url = f"https://{args.site}.web.app/current.ttl"
    if args.dry_run:
        print(
            "ecosystem-publish: admission passed; dry run made no Firebase changes "
            f"(public={public_url}, private=access-controlled Firestore)"
        )
        return 0

    api = GoogleApi(gcloud_executable(), args.project)
    assert_hosting_site(api, args.project, args.site)
    audit_document = write_private_audit(api, args.project, private_bytes, public_bytes)
    version = deploy_public_projection(api, args.site, public_bytes)
    verify_public_projection(args.site, public_bytes)
    delete_older_versions(api, args.site, version)
    print(
        "ecosystem-publish: activated validated public aggregate after "
        f"access-controlled audit write (audit document {audit_document})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
