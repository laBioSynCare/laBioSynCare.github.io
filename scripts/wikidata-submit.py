#!/usr/bin/env python3
"""Post the reciprocal mapping statements to Wikidata, from this machine.

The batches this replaces were pasted into QuickStatements by hand. That works
and stays the fallback; this exists so a later tranche does not cost a person
sixty seconds of copying, and so the statements and their references are built
from `sstim-alignments.ttl` by the same code that generates the paste file.

**The one real difference from pasting, and the reason for most of this file:
QuickStatements deduplicates and the API does not.** `wbsetclaim` adds a
statement every time it is called, so an unguarded re-run would leave two
identical `P2888` claims on an item and no easy way to tell which to remove. So
every run reads the items first and skips any mapping already present. That check
is the feature; the posting is the easy half.

Safety, in the order it applies:

  dry run       the default. Prints what would be added and what already exists,
                and posts nothing. `--write` is required to edit
  scope         only items the alignment module maps, only property P2888
  idempotent    existing values are read per item and skipped
  polite        maxlag=5 and a pause between edits, which is the API's own
                etiquette for a logged-in client
  attributable  the edits are the account's own, under the conflict-of-interest
                disclosure already on its user page

Credentials come from `docs/credentials/wikidata.md`, which is gitignored. They
are passed to curl through a file rather than an argument, so the password never
appears in the process list. Nothing here prints it.

Usage:
  python3 scripts/wikidata-submit.py                 # dry run
  python3 scripts/wikidata-submit.py --write         # post
  python3 scripts/wikidata-submit.py --write --limit 3
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from datetime import date
from pathlib import Path
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parents[1]
CREDENTIALS = ROOT / "docs" / "credentials" / "wikidata.md"
API = "https://www.wikidata.org/w/api.php"
UA = "sstim-wikidata-submit/1.0 (+https://w3id.org/sstim; ttm)"

# The item for the ontology, cited as "stated in" on every reference.
STATED_IN = "Q141325360"
MAPPING_PROPERTY = "P2888"
RELATION_QUALIFIER = "P4390"

# Reuse the derivation rather than restating it: same rows, same inversion of
# broad and narrow, same relatedMatch hold-back as the paste file.
_spec = importlib.util.spec_from_file_location("wds", ROOT / "scripts" / "wikidata-statements.py")
_wds = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_wds)


def credentials() -> tuple[str, str]:
    if not CREDENTIALS.exists():
        raise SystemExit(
            f"wikidata-submit: no credential at {CREDENTIALS}.\n"
            "Mint one at https://www.wikidata.org/wiki/Special:BotPasswords."
        )
    text = CREDENTIALS.read_text(encoding="utf-8")
    user = re.search(r"Login username:\s*`([^`]+)`", text)
    password = re.search(r"^- Password:\s*`([a-z0-9]{32})`", text, re.M)
    if not user or not password:
        raise SystemExit("wikidata-submit: credential file has no login/password in the documented shape")
    return user.group(1), password.group(1)


class Session:
    """A logged-in Action API client, over curl.

    curl rather than urllib for the reason `verify-registries.py` documents: the
    Python here has no CA bundle configured, so urllib fails TLS on every host
    and reports the world as unreachable. curl carries the system trust store.
    """

    def __init__(self, timeout: int):
        self.timeout = timeout
        self._jar = tempfile.NamedTemporaryFile(prefix="sstim-wd-", suffix=".cookies", delete=False)
        self._jar.close()
        os.chmod(self._jar.name, 0o600)

    def close(self):
        try:
            os.unlink(self._jar.name)
        except OSError:
            pass

    def post(self, fields: dict[str, str]) -> dict:
        """POST with the body in a 0600 file, so no field reaches the process list."""
        body = urlencode(fields)
        with tempfile.NamedTemporaryFile("w", prefix="sstim-wd-", suffix=".post", delete=False) as handle:
            os.chmod(handle.name, 0o600)
            handle.write(body)
            path = handle.name
        try:
            result = subprocess.run(
                ["curl", "-sS", "--max-time", str(self.timeout), "-X", "POST",
                 "-H", f"User-Agent: {UA}", "-b", self._jar.name, "-c", self._jar.name,
                 "--data", f"@{path}", API],
                capture_output=True, text=True,
            )
        finally:
            os.unlink(path)
        if result.returncode != 0:
            raise SystemExit(f"wikidata-submit: curl failed ({result.returncode}): {result.stderr[:200]}")
        try:
            return json.loads(result.stdout)
        except ValueError:
            raise SystemExit(f"wikidata-submit: API did not return JSON: {result.stdout[:200]}")

    def login(self):
        user, password = credentials()
        tokens = self.post({"action": "query", "meta": "tokens", "type": "login", "format": "json"})
        token = tokens["query"]["tokens"]["logintoken"]
        answer = self.post({
            "action": "login", "lgname": user, "lgpassword": password,
            "lgtoken": token, "format": "json",
        })
        result = answer.get("login", {}).get("result")
        if result != "Success":
            reason = answer.get("login", {}).get("reason", answer)
            raise SystemExit(f"wikidata-submit: login failed ({result}): {str(reason)[:200]}")
        csrf = self.post({"action": "query", "meta": "tokens", "format": "json"})
        self.csrf = csrf["query"]["tokens"]["csrftoken"]
        return answer["login"].get("lgusername", user)


def existing_values(session: Session, qids: list[str]) -> dict[str, set[str]]:
    """The P2888 values each item already carries, so nothing is added twice."""
    found: dict[str, set[str]] = {}
    for start in range(0, len(qids), 40):
        chunk = qids[start:start + 40]
        payload = session.post({
            "action": "wbgetentities", "ids": "|".join(chunk),
            "props": "claims", "format": "json",
        })
        for qid, entity in payload.get("entities", {}).items():
            values = set()
            for claim in entity.get("claims", {}).get(MAPPING_PROPERTY, []):
                value = claim.get("mainsnak", {}).get("datavalue", {}).get("value")
                if isinstance(value, str):
                    values.add(value)
            found[qid] = values
    return found


def claim_json(iri: str, relation_qid: str, retrieved: str) -> str:
    numeric = int(relation_qid[1:])
    return json.dumps({
        "type": "statement",
        "rank": "normal",
        "mainsnak": {
            "snaktype": "value", "property": MAPPING_PROPERTY,
            "datavalue": {"type": "string", "value": iri},
        },
        "qualifiers": {
            RELATION_QUALIFIER: [{
                "snaktype": "value", "property": RELATION_QUALIFIER,
                "datavalue": {"type": "wikibase-entityid",
                              "value": {"entity-type": "item", "numeric-id": numeric}},
            }],
        },
        "qualifiers-order": [RELATION_QUALIFIER],
        "references": [{
            "snaks": {
                "P248": [{"snaktype": "value", "property": "P248",
                          "datavalue": {"type": "wikibase-entityid",
                                        "value": {"entity-type": "item",
                                                  "numeric-id": int(STATED_IN[1:])}}}],
                "P854": [{"snaktype": "value", "property": "P854",
                          "datavalue": {"type": "string", "value": iri.split("#")[0]}}],
                "P813": [{"snaktype": "value", "property": "P813",
                          "datavalue": {"type": "time", "value": {
                              "time": f"+{retrieved}T00:00:00Z", "timezone": 0,
                              "before": 0, "after": 0, "precision": 11,
                              "calendarmodel": "http://www.wikidata.org/entity/Q1985727"}}}],
            },
            "snaks-order": ["P248", "P854", "P813"],
        }],
    }, separators=(",", ":"))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="actually post; without it, nothing is edited")
    parser.add_argument("--limit", type=int, default=0, help="stop after N edits, for a first careful run")
    parser.add_argument("--timeout", type=int, default=45)
    parser.add_argument("--include-related", action="store_true",
                        help="also post the relatedMatch rows, held back by default")
    args = parser.parse_args()

    graph = _wds.load_modules()
    rows = _wds.wikidata_mappings(graph, args.include_related)
    qids = sorted({qid for qid, _relation, _iri in rows})
    retrieved = date.today().isoformat()

    session = Session(args.timeout)
    try:
        who = session.login()
        print(f"logged in as {who}")
        present = existing_values(session, qids)

        todo = [(qid, relation, iri) for qid, relation, iri in rows
                if iri not in present.get(qid, set())]
        skip = len(rows) - len(todo)
        print(f"{len(rows)} mappings derived, {skip} already on Wikidata, {len(todo)} to add")
        if not args.write:
            for qid, relation, iri in todo:
                print(f"  would add  {qid:12s} {MAPPING_PROPERTY} {iri}  ({relation})")
            print("\ndry run: nothing was posted. Re-run with --write.")
            return 0

        added = 0
        attempted = 0
        for qid, relation, iri in todo:
            # Counts attempts, not successes: the first --write run kept going
            # through all seventeen because every one of them failed, which is
            # the opposite of what a limit is for.
            if args.limit and attempted >= args.limit:
                print(f"stopping at --limit {args.limit}")
                break
            # wbeditentity, not wbsetclaim: the latter requires an existing GUID
            # and answers "GUID must be set when setting a claim" for a new one,
            # which is what the first --write run here discovered. wbeditentity
            # merges the claims it is given, adding those without an id, and
            # carries the qualifier and the reference block in the same call, so
            # one edit does what QuickStatements does in three.
            attempted += 1
            answer = session.post({
                "action": "wbeditentity", "format": "json", "token": session.csrf,
                "id": qid, "maxlag": "5", "assert": "user",
                "data": json.dumps({"claims": [json.loads(
                    claim_json(iri, _wds.RELATION[relation], retrieved))]}),
                "summary": "SSTIM mapping, derived from sstim-alignments.ttl",
            })
            if "error" in answer:
                print(f"  FAILED     {qid} {iri}: {answer['error'].get('code')} "
                      f"{str(answer['error'].get('info'))[:120]}")
                if answer["error"].get("code") == "maxlag":
                    time.sleep(10)
                continue
            added += 1
            print(f"  added      {qid:12s} {iri}  ({relation})")
            time.sleep(1.0)

        print(f"\nposted {added} statements. Verify with `make wikidata-inbound`.")
        return 0
    finally:
        session.close()


if __name__ == "__main__":
    raise SystemExit(main())
