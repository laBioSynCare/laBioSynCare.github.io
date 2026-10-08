#!/usr/bin/env python3
"""The staging helper writes what the ecosystem contract admits, and refuses the rest."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

from rdflib import Graph, Literal, URIRef
from rdflib.namespace import DCTERMS, ORG, RDF, RDFS

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("stage", ROOT / "scripts/sstim-ecosystem-stage.py")
stage = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(stage)

ECO = stage.ECO
AT = "2026-10-08T12:00:00Z"
LIVE_ORG = URIRef(stage.W3ID + "organization/synthetic-existing-lab")
GONE_ORG = URIRef(stage.W3ID + "organization/synthetic-removed-lab")
FIELD = "https://w3id.org/sstim#SensoryStimulation"


def graphs() -> tuple[Graph, Graph]:
    public, private = Graph(), Graph()
    for graph in (public, private):
        graph.add((LIVE_ORG, RDF.type, ECO.EcosystemAgent))
        graph.add((LIVE_ORG, RDFS.label, Literal("Synthetic existing lab", lang="en")))
        graph.add((LIVE_ORG, DCTERMS.modified, Literal("2026-07-01")))
    private.add((GONE_ORG, RDFS.label, Literal("Synthetic removed lab", lang="en")))
    private.add((stage.RECORD["synthetic-withheld"], RDF.type, ECO.EcosystemRelationship))
    return public, private


def entry(path: str, slug: str, kind: str = "publication", **agent: object) -> dict:
    return {
        "agent": {"path": path, **agent},
        "relationship": {
            "slug": slug, "type": "ecosystemContributor", "target": FIELD,
            "label": "A synthetic contribution", "description": "Synthetic.",
            "sources": ["https://example.org/source"],
        },
        "activity": {"kind": kind, "at": AT},
    }


NEW_ORG = dict(unit=True, label="Synthetic new lab",
               description="Synthetic.", url="https://example.org/", sources=["https://example.org/"])
NEW_PERSON = dict(label="Synthetic person", description="Synthetic.",
                  url="https://example.org/p", sources=["https://example.org/p"])


def batch(*entries: dict, instruction: str = "synthetic-instruction") -> dict:
    return {"instruction": {"id": instruction, "at": AT, "description": "Synthetic."},
            "entries": list(entries)}


class StageTest(unittest.TestCase):
    def test_organization_approval_is_mirrored_and_its_evidence_stays_private(self) -> None:
        public, private = graphs()
        stage.apply_batch(public, private, batch(entry("organization/synthetic-new-lab", "synthetic-new", **NEW_ORG)), "2026-10-08")
        agent = URIRef(stage.W3ID + "organization/synthetic-new-lab")
        record = stage.RECORD["synthetic-new"]
        activity = stage.ACTIVITY["synthetic-new-publication"]
        for graph in (public, private):
            self.assertIn((agent, RDF.type, ORG.OrganizationalUnit), graph)
            self.assertIn((agent, ECO.hasEcosystemRelationship, record), graph)
            self.assertIn((record, ECO.hasRelationshipType, ECO.ecosystemContributor), graph)
            self.assertIn((activity, ECO.engagementOutcome, ECO.outcomePublicationApproved), graph)
            self.assertIsNone(graph.value(record, ECO.publicationStatus))
        self.assertIsNotNone(private.value(activity, DCTERMS.source))
        self.assertIsNone(public.value(activity, DCTERMS.source))
        self.assertFalse(any(str(s).startswith("urn:") for s in public.subjects()))

    def test_a_person_is_never_approved_by_the_curator_alone(self) -> None:
        public, private = graphs()
        with self.assertRaisesRegex(stage.StageError, "never approved"):
            stage.apply_batch(public, private, batch(entry("specialist/synthetic-person", "synthetic-p", **NEW_PERSON)), "2026-10-08")

    def test_a_notified_person_is_published_at_the_pending_status(self) -> None:
        public, private = graphs()
        stage.apply_batch(public, private, batch(entry("specialist/synthetic-person", "synthetic-p", "notification", **NEW_PERSON)), "2026-10-08")
        record = stage.RECORD["synthetic-p"]
        for graph in (public, private):
            self.assertEqual(graph.value(record, ECO.publicationStatus), ECO.outcomeNotificationSent)

    def test_a_live_agent_gains_a_backlink_and_nothing_else(self) -> None:
        public, private = graphs()
        stage.apply_batch(public, private, batch(entry("organization/synthetic-existing-lab", "synthetic-more")), "2026-10-08")
        for graph in (public, private):
            self.assertEqual(len(list(graph.objects(LIVE_ORG, RDFS.label))), 1)
            self.assertEqual(str(graph.value(LIVE_ORG, DCTERMS.modified)), "2026-10-08")
            self.assertIn((LIVE_ORG, ECO.hasEcosystemRelationship, stage.RECORD["synthetic-more"]), graph)

    def test_refusals_leave_both_graphs_untouched(self) -> None:
        refused = {
            "a relationship IRI the ledger already holds": entry("organization/synthetic-existing-lab", "synthetic-withheld"),
            "an agent removed from the live graph": entry("organization/synthetic-removed-lab", "synthetic-back", **NEW_ORG),
            "a relationship without a source": {**entry("organization/synthetic-existing-lab", "synthetic-nosource"),
                                                "relationship": {"slug": "synthetic-nosource", "type": "ecosystemContributor",
                                                                 "target": FIELD, "label": "x", "description": "x"}},
            "a local timestamp": {**entry("organization/synthetic-existing-lab", "synthetic-time"),
                                  "activity": {"kind": "publication", "at": "2026-10-08T14:00:00+02:00"}},
        }
        for reason, bad in refused.items():
            with self.subTest(reason):
                public, private = graphs()
                before = (len(public), len(private))
                good = entry("organization/synthetic-new-lab", "synthetic-new", **NEW_ORG)
                with self.assertRaises(stage.StageError):
                    stage.apply_batch(public, private, batch(good, bad), "2026-10-08")
                self.assertEqual((len(public), len(private)), before)

    def test_the_staging_directory_stays_outside_the_repository(self) -> None:
        with self.assertRaises(SystemExit):
            stage.staging_dir(str(ROOT / "tmp-staging"))


if __name__ == "__main__":
    unittest.main()
