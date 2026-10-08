#!/usr/bin/env python3
"""Stage a batch of live ecosystem records for `make ecosystem-publish`.

Every publish so far was hand-written Turtle in two files that must agree to
the triple: the public aggregate and the private ledger that mirrors it. This
helper does the mechanical part, and refuses the moves the model forbids, so a
batch of new agents costs one JSON file instead of an afternoon. It carries no
real data: the batch, the ledger and the candidates live in the operator's
access-limited staging directory, never in this repository (ADR 0031).

    fetch   find the active ledger (the audit document whose publicSha256 is the
            hash of the live current.ttl) and stage it beside the live file
    add     apply a batch to the staged pair, writing the two candidates
    clean   delete every staged private artifact once a publish is verified

Then validate and publish exactly as ECOSYSTEM_OPERATIONS.md says:

    make ecosystem-publish DRY_RUN=1 \\
        PUBLIC_ECOSYSTEM=~/.sstim/public-aggregate.ttl \\
        PRIVATE_LEDGER=~/.sstim/private-ledger-candidate.ttl

The batch is JSON:

    {
      "instruction": {"id": "renato-batch-20261008", "at": "2026-10-08T12:00:00Z",
                      "description": "private record of the maintainer's instruction"},
      "entries": [{
        "agent": {"path": "organization/example-lab",
                  "unit": true, "label": "…", "description": "…",
                  "url": "https://…", "sources": ["https://…"]},
        "relationship": {"slug": "example-lab-ecosystem-contributor",
                         "type": "ecosystemContributor",
                         "target": "https://w3id.org/sstim#SensoryStimulation",
                         "purpose": "purposePublicDiscovery",
                         "label": "…", "description": "…", "sources": ["https://…"],
                         "validFrom": "2026-01-01", "validUntil": null},
        "activity": {"kind": "publication", "at": "2026-10-08T12:00:00Z"}
      }]
    }

`agent` may be just {"path": …} when the agent is already live. An activity of
kind `publication` is the curator's approval of a sourced organization fact
(notify-and-honor). A person is never approved here: a person's record goes
live only after a real notification, at the visible pending status of ADR
0032, and consent is recorded by hand when it happens.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import ssl
import subprocess
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen

from rdflib import Graph, Literal, Namespace, URIRef
from rdflib.namespace import DCTERMS, FOAF, ORG, PROV, RDF, RDFS, XSD

try:  # System Python on macOS often lacks CA roots; Nix supplies them.
    import certifi
except ImportError:  # pragma: no cover - environment-specific fallback
    certifi = None


ROOT = Path(__file__).resolve().parent.parent
PROJECT = "biosyncare-lab"
LIVE_URL = "https://biosyncare-lab.web.app/current.ttl"
FIRESTORE = f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents"
DEFAULT_DIR = Path.home() / ".sstim"

W3ID = "https://w3id.org/sstim/"
ECO = Namespace("https://w3id.org/sstim/ecosystem#")
SCHEMA = Namespace("https://schema.org/")
RECORD = Namespace(f"{W3ID}ecosystem-record/relationship/")
ACTIVITY = Namespace(f"{W3ID}ecosystem-record/activity/")
AUDIT = Namespace("urn:sstim:audit-evidence:")
CURATOR = URIRef(f"{W3ID}specialist/renato-fabbri")

LIVE = "live-current.ttl"
LEDGER = "private-ledger.ttl"
PUBLIC_CANDIDATE = "public-aggregate.ttl"
PRIVATE_CANDIDATE = "private-ledger-candidate.ttl"
STAGED = (LIVE, LEDGER, PUBLIC_CANDIDATE, PRIVATE_CANDIDATE)

SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
AGENT_PATH = re.compile(r"^(organization|specialist)/([a-z0-9]+(?:-[a-z0-9]+)*)$")
INSTANT = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|\+00:00)$")


class StageError(Exception):
    """A batch the model does not admit. Nothing is written."""


def bind(graph: Graph) -> Graph:
    for prefix, namespace in {
        "activity": ACTIVITY, "audit": AUDIT, "dct": DCTERMS, "foaf": FOAF,
        "org": ORG, "prov": PROV, "rdfs": RDFS, "record": RECORD,
        "role": Namespace(f"{W3ID}ecosystem-record/role/"), "schema": SCHEMA,
        "specialist": Namespace(f"{W3ID}specialist/"), "sstim-eco": ECO, "xsd": XSD,
    }.items():
        graph.bind(prefix, namespace, override=True)
    return graph


def instant(value: str) -> Literal:
    if not isinstance(value, str) or not INSTANT.match(value):
        raise StageError(f"timestamp {value!r} is not a whole-second UTC instant")
    return Literal(value.replace("Z", "+00:00"), datatype=XSD.dateTime)


def day(value: str) -> Literal:
    date.fromisoformat(value)
    return Literal(value, datatype=XSD.date)


def web_iri(value: str, label: str) -> URIRef:
    if not isinstance(value, str) or not value.startswith("https://"):
        raise StageError(f"{label} must be an https IRI, not {value!r}")
    return URIRef(value)


def apply_batch(public: Graph, private: Graph, batch: dict, today: str) -> None:
    """Append every entry of `batch` to both graphs, or raise and change nothing."""
    staged_public, staged_private = Graph(), Graph()
    for triple in public:
        staged_public.add(triple)
    for triple in private:
        staged_private.add(triple)

    instruction = batch.get("instruction") or {}
    if not SLUG.match(instruction.get("id", "")) or not instruction.get("description"):
        raise StageError("the batch needs an instruction with a slug id and a description")
    audit = AUDIT[instruction["id"]]
    if (audit, None, None) in staged_private:
        raise StageError(f"audit record {instruction['id']} already exists; name a new one")
    staged_private.add((audit, RDF.type, PROV.Entity))
    staged_private.add((audit, RDFS.label, Literal(f"Maintainer instruction {instruction['id']}", lang="en")))
    staged_private.add((audit, DCTERMS.created, instant(instruction["at"])))
    staged_private.add((audit, DCTERMS.description, Literal(instruction["description"], lang="en")))
    staged_private.add((audit, PROV.wasAttributedTo, CURATOR))

    for entry in batch.get("entries", []):
        stage_entry(staged_public, staged_private, entry, audit, today)

    for target, staged in ((public, staged_public), (private, staged_private)):
        target.remove((None, None, None))
        for triple in staged:
            target.add(triple)


def stage_entry(public: Graph, private: Graph, entry: dict, audit: URIRef, today: str) -> None:
    agent_spec = entry.get("agent") or {}
    match = AGENT_PATH.match(agent_spec.get("path", ""))
    if not match:
        raise StageError(f"agent path {agent_spec.get('path')!r} is not organization/… or specialist/…")
    agent = URIRef(W3ID + agent_spec["path"])
    is_person = match.group(1) == "specialist"

    relationship_spec = entry.get("relationship") or {}
    if not SLUG.match(relationship_spec.get("slug", "")):
        raise StageError("every relationship needs a slug")
    relationship = RECORD[relationship_spec["slug"]]
    if (relationship, None, None) in private:
        # ADR 0031: a withheld, objected or retracted relationship IRI is never
        # admitted again; a materially new proposal takes a new IRI.
        raise StageError(f"relationship {relationship_spec['slug']} already exists in the ledger")

    activity_spec = entry.get("activity") or {}
    kind = activity_spec.get("kind")
    if kind not in {"publication", "notification"}:
        raise StageError(f"{relationship_spec['slug']}: activity kind must be publication or notification")
    if is_person and kind == "publication":
        raise StageError(
            f"{relationship_spec['slug']}: a person is never approved by the curator alone; "
            "record a real notification (ADR 0032) and add consent by hand when it is given"
        )
    at = instant(activity_spec.get("at", ""))
    created = day(str(at)[:10])

    live = (agent, RDF.type, ECO.EcosystemAgent) in public
    if not live and (agent, None, None) in private:
        raise StageError(f"{agent_spec['path']} was removed from the live graph; re-admitting it is a manual decision")
    if not live:
        add_agent(public, private, agent, agent_spec, is_person, created)
    for graph in (public, private):
        graph.set((agent, DCTERMS.modified, day(today)))
        graph.add((agent, ECO.hasEcosystemRelationship, relationship))

    purpose = ECO[relationship_spec.get("purpose", "purposePublicDiscovery")]
    activity = ACTIVITY[f"{relationship_spec['slug']}-{kind}"]
    record = [
        (relationship, RDF.type, ECO.EcosystemRelationship),
        (relationship, RDFS.label, Literal(required(relationship_spec, "label"), lang="en")),
        (relationship, DCTERMS.created, created),
        (relationship, DCTERMS.description, Literal(required(relationship_spec, "description"), lang="en")),
        (relationship, PROV.wasAttributedTo, CURATOR),
        (relationship, ECO.hasEngagementActivity, activity),
        (relationship, ECO.hasRelationshipType, ECO[required(relationship_spec, "type")]),
        (relationship, ECO.relationshipAgent, agent),
        (relationship, ECO.relationshipPurpose, purpose),
        (relationship, ECO.relationshipTarget, web_iri(relationship_spec.get("target"), "relationship target")),
        (relationship, ECO.reviewedOn, created),
    ]
    for source in sources(relationship_spec):
        record.append((relationship, DCTERMS.source, source))
    for key, predicate in (("validFrom", ECO.validFrom), ("validUntil", ECO.validUntil)):
        if relationship_spec.get(key):
            record.append((relationship, predicate, day(relationship_spec[key])))

    if kind == "publication":
        activity_types = (ECO.PublicationDecisionActivity,)
        outcome = ECO.outcomePublicationApproved
        label = f"{required(relationship_spec, 'label')}: publication approval"
    else:
        activity_types = (ECO.NotificationActivity,)
        outcome = ECO.outcomeNotificationSent
        label = f"{required(relationship_spec, 'label')}: notification"
        record.append((relationship, ECO.publicationStatus, outcome))
    events = [
        (activity, RDF.type, PROV.Activity),
        (activity, RDF.type, ECO.EngagementActivity),
        *[(activity, RDF.type, kind_type) for kind_type in activity_types],
        (activity, RDFS.label, Literal(label, lang="en")),
        (activity, PROV.endedAtTime, at),
        (activity, PROV.wasAssociatedWith, CURATOR),
        (activity, ECO.engagementFor, relationship),
        (activity, ECO.engagementOutcome, outcome),
        (activity, ECO.engagementPurpose, purpose),
    ]
    for triple in record + events:
        public.add(triple)
        private.add(triple)
    private.add((activity, DCTERMS.source, audit))


def add_agent(public: Graph, private: Graph, agent: URIRef, spec: dict, is_person: bool, created: Literal) -> None:
    if is_person:
        types = (PROV.Agent, FOAF.Person, SCHEMA.Person, ECO.EcosystemAgent)
    else:
        types = (PROV.Agent, ORG.Organization, SCHEMA.Organization, ECO.EcosystemAgent)
        if spec.get("unit"):
            types += (ORG.OrganizationalUnit,)
    triples = [(agent, RDF.type, kind) for kind in types] + [
        (agent, RDFS.label, Literal(required(spec, "label"), lang="en")),
        (agent, DCTERMS.created, created),
        (agent, DCTERMS.description, Literal(required(spec, "description"), lang="en")),
        (agent, PROV.wasAttributedTo, CURATOR),
        (agent, SCHEMA.url, web_iri(spec.get("url"), f"{spec['path']} url")),
    ]
    triples += [(agent, DCTERMS.source, source) for source in sources(spec)]
    for triple in triples:
        public.add(triple)
        private.add(triple)


def required(spec: dict, key: str) -> str:
    value = spec.get(key)
    if not isinstance(value, str) or not value.strip():
        raise StageError(f"missing {key}")
    return value


def sources(spec: dict) -> list[URIRef]:
    values = spec.get("sources") or []
    if not values:
        raise StageError("every agent and relationship cites at least one public source")
    return [web_iri(value, "source") for value in values]


# ── fetch ────────────────────────────────────────────────────────────────────

def ssl_context() -> ssl.SSLContext:
    return ssl.create_default_context(cafile=certifi.where() if certifi else None)


def gcloud_token() -> str:
    gcloud = os.environ.get("GCLOUD") or shutil.which("gcloud") or str(
        Path.home() / "Downloads" / "google-cloud-sdk" / "bin" / "gcloud")
    return subprocess.run([gcloud, "auth", "print-access-token"], check=True,
                          text=True, capture_output=True).stdout.strip()


def get(url: str, token: str | None = None) -> bytes:
    headers = {"Accept": "text/turtle"} if token is None else {
        "Authorization": f"Bearer {token}", "x-goog-user-project": PROJECT}
    with urlopen(Request(url, headers=headers), timeout=60, context=ssl_context()) as response:
        return response.read()


def write_private(path: Path, data: bytes) -> None:
    path.write_bytes(data)
    path.chmod(0o600)


def staging_dir(value: str) -> Path:
    path = Path(value).expanduser().resolve()
    if path == ROOT or ROOT in path.parents:
        raise SystemExit("the staging directory must stay outside the public repository")
    path.mkdir(mode=0o700, parents=True, exist_ok=True)
    return path


def fetch(directory: Path) -> None:
    live = get(LIVE_URL)
    live_hash = hashlib.sha256(live).hexdigest()
    token = gcloud_token()
    listing = json.loads(get(f"{FIRESTORE}/sstimEcosystemAudit?pageSize=300&mask.fieldPaths=publicSha256", token))
    matches = sorted(
        (doc for doc in listing.get("documents", [])
         if doc.get("fields", {}).get("publicSha256", {}).get("stringValue") == live_hash),
        key=lambda doc: doc["createTime"])
    if not matches:
        raise SystemExit("no audit document matches the live current.ttl; do not publish over it")
    document = matches[-1]["name"].rsplit("/", 1)[1]
    fields = json.loads(get(f"{FIRESTORE}/sstimEcosystemAudit/{quote(document)}", token))["fields"]
    ledger = fields["ledgerTurtle"]["stringValue"].encode("utf-8")
    if hashlib.sha256(ledger).hexdigest() != fields["privateSha256"]["stringValue"]:
        raise SystemExit(f"{document}: ledger bytes do not match their recorded hash")
    write_private(directory / LIVE, live)
    write_private(directory / LEDGER, ledger)
    print(f"active audit document {document} (public sha256 {live_hash[:12]}…) staged in {directory}")


def add(directory: Path, batch_path: Path, today: str) -> None:
    for name in (LIVE, LEDGER):
        if not (directory / name).is_file():
            raise SystemExit(f"{name} is not staged; run fetch first")
    public = bind(Graph().parse(directory / LIVE, format="turtle"))
    private = bind(Graph().parse(directory / LEDGER, format="turtle"))
    batch = json.loads(batch_path.read_text(encoding="utf-8"))
    try:
        apply_batch(public, private, batch, today)
    except StageError as error:
        raise SystemExit(f"refused, nothing written: {error}") from None
    write_private(directory / PUBLIC_CANDIDATE, public.serialize(format="turtle").encode("utf-8"))
    write_private(directory / PRIVATE_CANDIDATE, private.serialize(format="turtle").encode("utf-8"))
    print(f"staged {len(batch.get('entries', []))} entries; validate with:\n"
          f"  make ecosystem-publish DRY_RUN=1 PUBLIC_ECOSYSTEM={directory / PUBLIC_CANDIDATE} "
          f"PRIVATE_LEDGER={directory / PRIVATE_CANDIDATE}")


def clean(directory: Path) -> None:
    for name in STAGED:
        (directory / name).unlink(missing_ok=True)
    print(f"removed staged private artifacts from {directory}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--dir", default=str(DEFAULT_DIR), help="staging directory (default ~/.sstim)")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("fetch")
    adding = commands.add_parser("add")
    adding.add_argument("batch", type=Path)
    adding.add_argument("--today", default=datetime.now(timezone.utc).date().isoformat())
    commands.add_parser("clean")
    args = parser.parse_args(argv)
    directory = staging_dir(args.dir)
    if args.command == "fetch":
        fetch(directory)
    elif args.command == "add":
        add(directory, args.batch.expanduser(), args.today)
    else:
        clean(directory)
    return 0


if __name__ == "__main__":
    sys.exit(main())
