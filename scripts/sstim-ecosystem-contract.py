#!/usr/bin/env python3
"""Validate the isolated synthetic qualified-ecosystem contract (ADR 0031).

The public fixture is validated independently of every other ecosystem file,
round-tripped through the committed JSON-LD context, and checked for exact
relationship binding and public/private separation. Adversarial Turtle files
are overlays on the positive graph; every overlay must be rejected by the full
pySHACL engine, including SHACL-SPARQL constraints.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from concurrent.futures import ProcessPoolExecutor
from functools import lru_cache
from pathlib import Path
from typing import NamedTuple

from rdflib import Graph, Literal, Namespace, RDF, RDFS, URIRef
from rdflib.compare import isomorphic
from rdflib.namespace import DCTERMS, OWL, PROV, XSD

try:
    from pyshacl import validate as pyshacl_validate
    from pyshacl.errors import ValidationFailure
except ImportError:  # Preserve CLI-only installations and --skip-shacl.
    pyshacl_validate = None
    ValidationFailure = None


ROOT = Path(__file__).resolve().parent.parent
ONTOLOGY_DIR = ROOT / "static" / "ontology"
ECOSYSTEM_INSTANCE_DIR = ONTOLOGY_DIR / "instances" / "ecosystem"
FIXTURE = ECOSYSTEM_INSTANCE_DIR / "fixtures" / "synthetic-ecosystem.ttl"
PUBLIC_ARTIFACT_DIR = ECOSYSTEM_INSTANCE_DIR / "agents"
NEGATIVE_DIR = ROOT / "test" / "fixtures" / "rdf" / "ecosystem"
PROFILE_NEGATIVE_DIR = ROOT / "test" / "fixtures" / "rdf" / "ecosystem-profile"
POSITIVE_SCENARIO_DIR = ROOT / "test" / "fixtures" / "rdf" / "ecosystem-positive"
PRIVATE_LEDGER_FIXTURE = (
    ROOT / "test" / "fixtures" / "rdf" / "ecosystem-private"
    / "synthetic-terminal-ledger.ttl"
)
SHAPES = ONTOLOGY_DIR / "sstim-shapes.ttl"
PRIVATE_SHAPES = ONTOLOGY_DIR / "sstim-ecosystem-private-shapes.ttl"
PRIVATE_NEGATIVE_DIR = (
    ROOT / "test" / "fixtures" / "rdf" / "ecosystem-private-negative"
)
CONTEXT = ONTOLOGY_DIR / "context.jsonld"

# The BSC framework is the positive fixture's sole instance dependency: the
# synthetic implementation says it implements this declared framework. No
# other ecosystem/implementation file is allowed to complete the fixture.
CONTEXT_FILES = (
    ONTOLOGY_DIR / "sstim-core.ttl",
    ONTOLOGY_DIR / "sstim-vocab.ttl",
    ONTOLOGY_DIR / "sstim-exposure.ttl",
    ONTOLOGY_DIR / "sstim-ecosystem.ttl",
    ONTOLOGY_DIR / "instances" / "frameworks" / "bsc.ttl",
)
IMPLEMENTATION_CATALOG = (
    ONTOLOGY_DIR / "instances" / "implementations" / "implementations.ttl"
)

SSTIM = Namespace("https://w3id.org/sstim#")
ECO = Namespace("https://w3id.org/sstim/ecosystem#")
ORG = Namespace("http://www.w3.org/ns/org#")
SCHEMA = Namespace("https://schema.org/")
FOAF = Namespace("http://xmlns.com/foaf/0.1/")

PERSON = URIRef("https://w3id.org/sstim/specialist/synthetic-alex-rivera")
AURORA = URIRef("https://w3id.org/sstim/organization/synthetic-aurora-lab")
RESONANCE = URIRef("https://w3id.org/sstim/organization/synthetic-resonance-coop")
IMPLEMENTATION = URIRef(
    "https://w3id.org/sstim/implementation/bsclab/synthetic-ecosystem-player"
)
CURATOR = URIRef("https://example.org/agent/synthetic-curator")
RECORD = "https://w3id.org/sstim/ecosystem-record/relationship/"
ACTIVITY = "https://w3id.org/sstim/ecosystem-record/activity/"

PRIVATE_PREDICATES = {
    ECO.notificationChannel,
    ECO.responseNote,
    URIRef("http://xmlns.com/foaf/0.1/mbox"),
    SCHEMA.email,
    SCHEMA.telephone,
    SCHEMA.contactPoint,
    SCHEMA.identifier,
}

LEGACY_PREDICATES = {
    ECO.relationshipType,
    ECO.relatesTo,
    ECO.expertiseArea,
    ECO.hasContributedTo,
    ECO.couldContributeTo,
    ECO.curatedBy,
    ECO.recordSource,
    ECO.consentStatus,
    ECO.archivalConsent,
    ECO.notificationStatus,
    ECO.notifiedOn,
    ECO.notificationChannel,
    ECO.responseStatus,
    ECO.respondedOn,
    ECO.responseNote,
    ECO.contributionStatus,
    ECO.addedOn,
}

LOCAL_PREFIXES = (
    "https://w3id.org/sstim#",
    "https://w3id.org/sstim/vocab#",
    "https://w3id.org/sstim/exposure#",
    "https://w3id.org/sstim/ecosystem#",
    "https://w3id.org/sstim/framework/",
    "https://w3id.org/sstim/implementation/",
    "https://w3id.org/sstim/ref/",
    "https://w3id.org/sstim/specialist/",
    "https://w3id.org/sstim/organization/",
    "https://w3id.org/sstim/ecosystem-record/",
)

EXPECTED_RELATIONSHIPS = {
    URIRef(RECORD + "alex-membership-aurora"): (
        PERSON,
        AURORA,
        ECO.organizationMember,
        ECO.purposePublicDiscovery,
        URIRef("https://example.org/sources/aurora-membership"),
    ),
    URIRef(RECORD + "alex-membership-resonance"): (
        PERSON,
        RESONANCE,
        ECO.organizationMember,
        ECO.purposePublicDiscovery,
        URIRef("https://example.org/sources/resonance-membership"),
    ),
    URIRef(RECORD + "alex-attribution-player"): (
        PERSON,
        IMPLEMENTATION,
        ECO.contributor,
        ECO.purposePublicAttribution,
        URIRef("https://example.org/sources/player-contribution"),
    ),
    URIRef(RECORD + "alex-outreach-resonance"): (
        PERSON,
        RESONANCE,
        ECO.researchCollaborator,
        ECO.purposeOutreach,
        URIRef("https://example.org/sources/resonance-outreach"),
    ),
    URIRef(RECORD + "aurora-develops-player"): (
        AURORA,
        IMPLEMENTATION,
        ECO.implementationDeveloper,
        ECO.purposeLivePublication,
        URIRef("https://example.org/sources/aurora-player-responsibility"),
    ),
    URIRef(RECORD + "resonance-provides-player"): (
        RESONANCE,
        IMPLEMENTATION,
        ECO.implementationProvider,
        ECO.purposeLivePublication,
        URIRef("https://example.org/sources/resonance-player-responsibility"),
    ),
}

EXPECTED_NEGATIVE_MESSAGES = {
    "archival-consent-grant.ttl": "Archival consent grants are not accepted",
    "engagement-missing-purpose.ttl": "exactly one controlled purpose",
    "flattened-relationship.ttl": "deprecated flat relationship or lifecycle predicate",
    "membership-missing-source.ttl": "IRI-valued public source",
    "missing-agent-kind.ttl": "exactly one explicit schema kind",
    "public-private-leak.ttl": "must not contain contact channels",
    "response-before-notification.ttl": "strictly earlier",
    "responsibility-wrong-target.ttl": "SensoryStimulationImplementation",
    "shared-consent-decision.ttl": "one activity cannot be shared",
    "cross-relationship-predecessor.ttl": "same qualified relationship",
    "unapproved-public-predicate.ttl": "ClosedConstraintComponent",
    "agent-implementation-sameas.ttl": "must not be identified through",
    "agent-kind-sameas-mismatch.ttl": "must not be identified with an organization",
    "consent-declined-latest.ttl": "all negative and operational states belong only to the private audit ledger",
    "generic-consent-outcome.ttl": "Consent outcomes require explicit ConsentDecisionActivity typing",
    "implementation-agent-conflation.ttl": "must not also be typed as an ecosystem person or organization",
    "membership-type-without-subtype.ttl": "requires explicit OrganizationMembership",
    "public-withdrawal-retention.ttl": "private audit ledger",
    "publication-withheld-latest.ttl": "must end in a unique latest PublicationDecisionActivity",
    "responsibility-type-without-subtype.ttl": "requires explicit ImplementationResponsibility typing",
    "same-time-predecessor.ttl": "strictly earlier",
    "linked-description-node.ttl": "descriptions must be literal text",
    "changes-requested-then-approved.ttl": "all negative and operational states belong only to the private audit ledger",
    "objected-then-approved.ttl": "all negative and operational states belong only to the private audit ledger",
    "operational-provenance-in-public.ttl": "ClosedConstraintComponent",
    "org-fields-without-membership-subtype.ttl": "may occur only on an OrganizationMembership",
    "agent-sameas-unloaded-implementation.ttl": "must not be identified through schema:sameAs or owl:sameAs",
    "implementation-sameas-agent-inverse.ttl": "must not be identified with an ecosystem agent",
    "same-instant-different-lexical.ttl": "distinct timestamps",
    "final-approval-wrong-actor.ttl": "The final publication approval must be associated with the relationship curator",
    "person-without-notification-or-consent.ttl": "must have an earlier scoped consent grant",
    "person-as-relationship-target.ttl": "must not place a person in relationshipTarget",
    "agent-multiple-curators.ttl": "exactly one curator by IRI",
    "relationship-target-non-web-iri.ttl": "public-web IRI target",
}

EXPECTED_PROFILE_NEGATIVE_MESSAGES = {
    "auxiliary-agent-private-description.ttl": "may use only rdf:type and rdfs:label",
    "linked-private-evidence.ttl": "unapproved predicate",
    "non-web-public-iris.ttl": "must use an HTTPS public-web IRI",
    "sensitive-extra-agent-type.ttl": "unapproved explicit type set",
    "unreferenced-curator.ttl": "must be referenced by prov:wasAttributedTo",
    "untyped-reserved-subject.ttl": "reserved specialist IRI",
}

EXPECTED_POSITIVE_SCENARIOS = {
    "self-publication.ttl",
}

EXPECTED_PRIVATE_NEGATIVE_MESSAGES = {
    "amendment-incomplete-replacement.ttl": "complete EcosystemRelationship audit snapshot",
    "amendment-self-revision.ttl": "distinct replacement IRI",
    "generated-without-amendment.ttl": "prov:generated may occur only on a private AmendmentActivity",
    "invalidated-without-mutation.ttl": "prov:invalidated may occur only on a private AmendmentActivity or WithdrawalActivity",
    "terminal-purpose-mismatch.ttl": "complete relationship snapshot with the same purpose",
    "withdrawal-then-reapproval.ttl": "must never be followed by a positive public-admission outcome",
}

TERMINAL_PRIVATE_OUTCOMES = {
    ECO.outcomeChangesRequested,
    ECO.outcomeObjected,
    ECO.outcomeConsentDeclined,
    ECO.outcomePublicationWithheld,
    ECO.outcomeRecordAmended,
    ECO.outcomeRemovalRequested,
    ECO.outcomeConsentWithdrawn,
}

# Turtle has no graph container on which SHACL Core can express a complete
# file-wide closed shape. The repository publication gate therefore complements
# node-level SHACL with this deliberately small predicate/subject allowlist for
# every ecosystem artifact. This catches private data on linked or untyped
# auxiliary nodes, not only on correctly typed profile nodes.
PUBLIC_PROFILE_PREDICATES = {
    RDF.type,
    RDFS.label,
    DCTERMS.created,
    DCTERMS.description,
    DCTERMS.modified,
    DCTERMS.source,
    OWL.sameAs,
    SCHEMA.sameAs,
    SCHEMA.url,
    SSTIM.implementsFramework,
    ORG.member,
    ORG.organization,
    ORG.role,
    PROV.endedAtTime,
    PROV.wasAssociatedWith,
    PROV.wasAttributedTo,
    PROV.wasInformedBy,
    ECO.engagementFor,
    ECO.engagementOutcome,
    ECO.engagementPurpose,
    ECO.hasEcosystemRelationship,
    ECO.hasEngagementActivity,
    ECO.hasRelationshipType,
    ECO.relationshipAgent,
    ECO.relationshipPurpose,
    ECO.relationshipTarget,
    ECO.reviewedOn,
    ECO.validFrom,
    ECO.validUntil,
}

PUBLIC_SUBJECT_TYPE_PROFILES = {
    "person": (
        {ECO.EcosystemAgent, SCHEMA.Person, FOAF.Person},
        {ECO.EcosystemAgent, PROV.Agent, SCHEMA.Person, FOAF.Person},
    ),
    "organization": (
        {ECO.EcosystemAgent, SCHEMA.Organization, ORG.Organization},
        {
            ECO.EcosystemAgent,
            PROV.Agent,
            SCHEMA.Organization,
            SCHEMA.ResearchOrganization,
            SCHEMA.Corporation,
            SCHEMA.CollegeOrUniversity,
            ORG.Organization,
            ORG.OrganizationalUnit,
        },
    ),
    "relationship": (
        {ECO.EcosystemRelationship},
        {
            ECO.EcosystemRelationship,
            ECO.OrganizationMembership,
            ECO.ImplementationResponsibility,
            ORG.Membership,
        },
    ),
    "activity": (
        {ECO.EngagementActivity},
        {
            ECO.EngagementActivity,
            ECO.NotificationActivity,
            ECO.ResponseActivity,
            ECO.PublicationDecisionActivity,
            ECO.ConsentDecisionActivity,
            PROV.Activity,
        },
    ),
    "implementation": (
        {SSTIM.SensoryStimulationImplementation},
        {SSTIM.SensoryStimulationImplementation},
    ),
    "role": ({ORG.Role}, {ORG.Role}),
    "curator-or-actor": ({PROV.Agent}, {PROV.Agent}),
}

PUBLIC_WEB_IRI_PREDICATES = {
    DCTERMS.source,
    OWL.sameAs,
    SCHEMA.sameAs,
    SCHEMA.url,
    ECO.relationshipTarget,
}

RESERVED_SUBJECT_PROFILES = {
    "https://w3id.org/sstim/specialist/": {
        ECO.EcosystemAgent, SCHEMA.Person, FOAF.Person,
    },
    "https://w3id.org/sstim/organization/": {
        ECO.EcosystemAgent, SCHEMA.Organization, ORG.Organization,
    },
    "https://w3id.org/sstim/ecosystem-record/relationship/": {
        ECO.EcosystemRelationship,
    },
    "https://w3id.org/sstim/ecosystem-record/activity/": {
        ECO.EngagementActivity,
    },
}


def parse_graph(paths: tuple[Path, ...] | list[Path]) -> Graph:
    graph = Graph()
    for path in paths:
        graph.parse(path, format="turtle")
    return graph


def build_validation_graph(artifact: Graph) -> Graph:
    """Add only the closed implementation profile needed by relationship targets.

    Loading the full implementation catalog would also pull its protocol links;
    RDFS range inference would then target incomplete protocol stubs in an
    otherwise isolated ecosystem artifact. This projection keeps external
    dependencies explicit without allowing another ecosystem file to complete
    the artifact under test.
    """
    merged = parse_graph(list(CONTEXT_FILES))
    for triple in artifact:
        merged.add(triple)

    catalog = parse_graph([IMPLEMENTATION_CATALOG])
    profile_predicates = {
        RDF.type,
        RDFS.label,
        DCTERMS.description,
        SSTIM.implementsFramework,
    }
    for target in artifact.objects(None, ECO.relationshipTarget):
        if (target, RDF.type, SSTIM.SensoryStimulationImplementation) not in catalog:
            continue
        for predicate in profile_predicates:
            for obj in catalog.objects(target, predicate):
                merged.add((target, predicate, obj))
    return merged


def values(graph: Graph, subject: URIRef, predicate: URIRef) -> set:
    return set(graph.objects(subject, predicate))


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def check_public_artifact_profile(graph: Graph, label: str) -> list[str]:
    """Fail closed over every subject/predicate in one public ecosystem file."""
    errors: list[str] = []

    for subject, predicate, _ in graph:
        require(
            predicate in PUBLIC_PROFILE_PREDICATES,
            f"{label}: unapproved predicate {predicate} on {subject}",
            errors,
        )

    for subject in set(graph.subjects()):
        require(
            isinstance(subject, URIRef),
            f"{label}: blank-node subjects are not allowed in public ecosystem artifacts: {subject}",
            errors,
        )
        if not isinstance(subject, URIRef):
            continue
        subject_types = values(graph, subject, RDF.type)
        matching_profiles = [
            name
            for name, (required_types, allowed_types) in
            PUBLIC_SUBJECT_TYPE_PROFILES.items()
            if required_types <= subject_types <= allowed_types
        ]
        require(
            bool(matching_profiles),
            f"{label}: subject {subject} has an unapproved explicit type set "
            f"{sorted(map(str, subject_types))}",
            errors,
        )

        if matching_profiles == ["curator-or-actor"]:
            subject_predicates = set(graph.predicates(subject, None))
            allowed_actor_predicates = {RDF.type, RDFS.label}
            require(
                subject_predicates <= allowed_actor_predicates,
                f"{label}: curator/actor-only subject {subject} may use only "
                "rdf:type and rdfs:label",
                errors,
            )
            actor_is_referenced = any(
                any(graph.triples((None, predicate, subject)))
                for predicate in (PROV.wasAttributedTo, PROV.wasAssociatedWith)
            )
            require(
                actor_is_referenced,
                f"{label}: curator/actor-only subject {subject} must be referenced "
                "by prov:wasAttributedTo or prov:wasAssociatedWith",
                errors,
            )
        subject_iri = str(subject)
        for prefix, required_types in RESERVED_SUBJECT_PROFILES.items():
            if not subject_iri.startswith(prefix):
                continue
            kind = prefix.rstrip("/").rsplit("/", 1)[-1]
            require(
                required_types <= subject_types,
                f"{label}: reserved {kind} IRI {subject} lacks required explicit types "
                f"{sorted(map(str, required_types - subject_types))}",
                errors,
            )

    for predicate in PUBLIC_WEB_IRI_PREDICATES:
        for subject, value in graph.subject_objects(predicate):
            is_public_web_iri = (
                isinstance(value, URIRef)
                and (
                    str(value).startswith("https://")
                    or str(value).startswith("http://www.wikidata.org/entity/")
                )
            )
            require(
                is_public_web_iri,
                f"{label}: {predicate} on {subject} must use an HTTPS public-web "
                "IRI (the canonical HTTP Wikidata entity namespace is also allowed)",
                errors,
            )

    for predicate in (RDFS.label, DCTERMS.description):
        for subject, value in graph.subject_objects(predicate):
            require(
                isinstance(value, Literal),
                f"{label}: {predicate} on {subject} must be a literal, not a linked node",
                errors,
            )

    return sorted(set(errors))


def check_private_terminal_absence(
    public: Graph, private: Graph, *, require_terminal: bool = True
) -> list[str]:
    """Prove that private terminal events have no identifying public chain."""
    errors: list[str] = []
    terminal_events = {
        event
        for outcome in TERMINAL_PRIVATE_OUTCOMES
        for event in private.subjects(ECO.engagementOutcome, outcome)
    }
    if require_terminal:
        require(bool(terminal_events), "private terminal fixture has no blocking event", errors)
    terminal_relationships: set = set()

    for event in terminal_events:
        require(
            not any(public.triples((event, None, None))),
            f"terminal private event remains a public subject: {event}",
            errors,
        )
        require(
            not any(public.triples((None, ECO.hasEngagementActivity, event))),
            f"terminal private event remains linked from a public relationship: {event}",
            errors,
        )
        governed = values(private, event, ECO.engagementFor)
        require(
            len(governed) == 1,
            f"private terminal event {event} must govern exactly one relationship",
            errors,
        )
        if (
            (event, RDF.type, ECO.WithdrawalActivity) in private
            or (event, RDF.type, ECO.AmendmentActivity) in private
        ):
            invalidated = values(private, event, PROV.invalidated)
            require(
                governed == invalidated,
                f"private amendment/withdrawal {event} must invalidate its governed relationship",
                errors,
            )
        terminal_relationships.update(governed)

    backlink_predicates = {
        ECO.hasEcosystemRelationship,
        ECO.engagementFor,
        ECO.hasEngagementActivity,
    }
    for relationship in terminal_relationships:
        governed_agents = values(private, relationship, ECO.relationshipAgent)
        require(
            len(governed_agents) == 1,
            f"private terminal relationship {relationship} must retain exactly "
            "one private relationshipAgent projection for orphan cleanup",
            errors,
        )
        require(
            not any(public.triples((relationship, None, None))),
            f"terminal private relationship remains a public subject: {relationship}",
            errors,
        )
        for predicate in backlink_predicates:
            require(
                not any(public.triples((None, predicate, relationship))),
                f"terminal private relationship remains public through {predicate}: {relationship}",
                errors,
            )
        for agent in governed_agents:
            if not any(public.triples((agent, None, None))):
                continue
            remaining = set(public.objects(agent, ECO.hasEcosystemRelationship))
            remaining.difference_update(terminal_relationships)
            require(
                bool(remaining),
                f"agent orphaned by terminal private relationship remains public: {agent}",
                errors,
            )
    return errors


def check_public_activity_mirroring(public: Graph, private: Graph) -> list[str]:
    """Require the private audit to contain every public positive event."""
    errors: list[str] = []
    mirrored_predicates = {
        RDF.type,
        RDFS.label,
        ECO.engagementFor,
        ECO.engagementPurpose,
        ECO.engagementOutcome,
        PROV.endedAtTime,
        PROV.wasAssociatedWith,
        PROV.wasInformedBy,
    }
    for activity in public.subjects(RDF.type, ECO.EngagementActivity):
        require(
            (activity, RDF.type, ECO.EngagementActivity) in private,
            f"private audit does not mirror public activity {activity}",
            errors,
        )
        for predicate in mirrored_predicates:
            public_values = values(public, activity, predicate)
            private_values = values(private, activity, predicate)
            require(
                public_values == private_values,
                f"private audit mirror differs for {activity} {predicate}: "
                "the access-controlled values are intentionally not printed",
                errors,
            )
    return errors


def check_public_relationship_mirroring(public: Graph, private: Graph) -> list[str]:
    """Require every admitted relationship claim to match its private snapshot."""
    errors: list[str] = []
    exact_predicates = {
        RDFS.label,
        ECO.relationshipAgent,
        ECO.relationshipTarget,
        ECO.hasRelationshipType,
        ECO.relationshipPurpose,
        DCTERMS.source,
        DCTERMS.created,
        ECO.reviewedOn,
        ECO.validFrom,
        ECO.validUntil,
        PROV.wasAttributedTo,
        ORG.member,
        ORG.organization,
        ORG.role,
    }
    subset_predicates = {RDF.type, DCTERMS.description, ECO.hasEngagementActivity}
    for relationship in public.subjects(RDF.type, ECO.EcosystemRelationship):
        require(
            (relationship, RDF.type, ECO.EcosystemRelationship) in private,
            f"private audit does not mirror public relationship {relationship}",
            errors,
        )
        for predicate in exact_predicates:
            require(
                values(public, relationship, predicate)
                == values(private, relationship, predicate),
                f"private relationship mirror differs for {relationship} {predicate}; "
                "the access-controlled values are intentionally not printed",
                errors,
            )
        for predicate in subset_predicates:
            require(
                values(public, relationship, predicate)
                <= values(private, relationship, predicate),
                f"private relationship mirror omits public values for {relationship} "
                f"{predicate}; the access-controlled values are intentionally not printed",
                errors,
            )
    return errors


def check_public_activity_mirroring_guard(public: Graph, private: Graph) -> list[str]:
    """Prove the complete-history check detects an altered public event."""
    errors: list[str] = []
    activities = sorted(
        set(public.subjects(RDF.type, ECO.EngagementActivity)), key=str
    )
    require(bool(activities), "mirroring guard requires one public activity", errors)
    if not activities:
        return errors

    altered = Graph()
    for triple in private:
        altered.add(triple)
    altered.remove((activities[0], ECO.engagementOutcome, None))
    mirror_errors = check_public_activity_mirroring(public, altered)
    require(
        any("private audit mirror differs" in issue for issue in mirror_errors),
        "public-activity mirroring guard did not reject an altered audit event",
        errors,
    )
    return errors


def check_public_relationship_mirroring_guard(
    public: Graph, private: Graph
) -> list[str]:
    """Prove the claim-snapshot mirror detects an altered public target."""
    errors: list[str] = []
    relationships = sorted(
        set(public.subjects(RDF.type, ECO.EcosystemRelationship)), key=str
    )
    require(bool(relationships), "relationship mirroring guard requires one record", errors)
    if not relationships:
        return errors

    altered = Graph()
    for triple in private:
        altered.add(triple)
    altered.remove((relationships[0], ECO.relationshipTarget, None))
    mirror_errors = check_public_relationship_mirroring(public, altered)
    require(
        any("private relationship mirror differs" in issue for issue in mirror_errors),
        "public-relationship mirroring guard did not reject an altered snapshot",
        errors,
    )
    return errors


def check_private_relationship_snapshots(private: Graph) -> list[str]:
    """Require explicit, purpose-matched claim snapshots for every audit event."""
    errors: list[str] = []
    activities = set(private.subjects(RDF.type, ECO.EngagementActivity))
    for activity in activities:
        relationships = values(private, activity, ECO.engagementFor)
        if len(relationships) != 1:
            continue  # Cardinality is reported by SHACL.
        relationship = next(iter(relationships))
        require(
            (relationship, RDF.type, ECO.EcosystemRelationship) in private,
            "private audit activity lacks an explicitly typed complete "
            f"relationship snapshot: {activity}",
            errors,
        )
        require(
            (relationship, ECO.hasEngagementActivity, activity) in private,
            f"private relationship snapshot does not link its activity: {activity}",
            errors,
        )
        require(
            values(private, relationship, ECO.relationshipPurpose)
            == values(private, activity, ECO.engagementPurpose),
            f"private relationship/activity purpose mismatch: {activity}",
            errors,
        )
    return errors


def check_private_terminal_guard(private: Graph) -> list[str]:
    """Prove the cross-store guard rejects both a record and a dangling event."""
    errors: list[str] = []
    withdrawal_relationships = {
        relationship
        for event in private.subjects(RDF.type, ECO.WithdrawalActivity)
        for relationship in private.objects(event, ECO.engagementFor)
    }
    require(
        len(withdrawal_relationships) == 1,
        "private terminal guard fixture must identify exactly one withdrawal relationship",
        errors,
    )
    if len(withdrawal_relationships) != 1:
        return errors

    relationship = next(iter(withdrawal_relationships))
    governed_agent = next(iter(private.objects(relationship, ECO.relationshipAgent)), None)
    leaked_record = Graph()
    leaked_record.add((relationship, RDF.type, ECO.EcosystemRelationship))
    record_errors = check_private_terminal_absence(leaked_record, private)
    require(
        any("remains a public subject" in issue for issue in record_errors),
        "private terminal guard did not reject a leaked relationship subject",
        errors,
    )

    leaked_activity = Graph()
    leaked_activity.add((
        URIRef(ACTIVITY + "synthetic-dangling-withdrawn-reference"),
        ECO.engagementFor,
        relationship,
    ))
    activity_errors = check_private_terminal_absence(leaked_activity, private)
    require(
        any("remains public through" in issue for issue in activity_errors),
        "private terminal guard did not reject a dangling public activity reference",
        errors,
    )
    if governed_agent is not None:
        orphan_public = Graph()
        orphan_public.add((governed_agent, RDF.type, ECO.EcosystemAgent))
        orphan_errors = check_private_terminal_absence(orphan_public, private)
        require(
            any("orphaned" in issue for issue in orphan_errors),
            "private terminal guard did not reject an orphaned public agent",
            errors,
        )

        retained_public = Graph()
        retained_public.add((governed_agent, RDF.type, ECO.EcosystemAgent))
        retained_public.add((
            governed_agent,
            ECO.hasEcosystemRelationship,
            URIRef(RECORD + "synthetic-unaffected-relationship"),
        ))
        retained_errors = check_private_terminal_absence(retained_public, private)
        require(
            not any("orphaned" in issue for issue in retained_errors),
            "private terminal guard removed an agent that still has another relationship",
            errors,
        )
    return errors


def check_local_resolution(artifact: Graph, merged: Graph, label: str) -> list[str]:
    errors: list[str] = []
    declared = {
        subject for subject in merged.subjects() if isinstance(subject, URIRef)
    }
    for _, _, obj in artifact:
        if not isinstance(obj, URIRef) or not str(obj).startswith(LOCAL_PREFIXES):
            continue
        require(
            obj in declared,
            f"{label}: dangling local IRI in isolated artifact: {obj}",
            errors,
        )
    return errors


def check_real_public_artifact(artifact: Graph, label: str) -> list[str]:
    """Additional fixture/real separation for the future F4 aggregate."""
    errors: list[str] = []
    agents = set(artifact.subjects(RDF.type, ECO.EcosystemAgent))
    relationships = set(artifact.subjects(RDF.type, ECO.EcosystemRelationship))
    activities = set(artifact.subjects(RDF.type, ECO.EngagementActivity))
    require(bool(agents), f"{label}: real public artifact has no EcosystemAgent", errors)
    require(bool(relationships), f"{label}: real public artifact has no EcosystemRelationship", errors)
    require(bool(activities), f"{label}: real public artifact has no EngagementActivity", errors)

    for agent in agents:
        for curator in artifact.objects(agent, PROV.wasAttributedTo):
            require(
                curator in agents,
                f"{label}: real agent-record curator {curator} must be a verified "
                "EcosystemAgent in the same reviewed aggregate",
                errors,
            )
    for relationship in relationships:
        for curator in artifact.objects(relationship, PROV.wasAttributedTo):
            require(
                curator in agents,
                f"{label}: real relationship curator {curator} must be a verified "
                "EcosystemAgent in the same reviewed aggregate",
                errors,
            )
    for activity in activities:
        for actor in artifact.objects(activity, PROV.wasAssociatedWith):
            require(
                actor in agents,
                f"{label}: real public activity actor {actor} must be a verified "
                "EcosystemAgent in the same reviewed aggregate",
                errors,
            )

    for subject in set(artifact.subjects()):
        if isinstance(subject, URIRef) and str(subject).startswith(
            "https://w3id.org/sstim/implementation/"
        ):
            errors.append(
                f"{label}: real ecosystem artifacts must reference, not redeclare, "
                f"implementation-owned subject {subject}"
            )

    for term in set(artifact.all_nodes()):
        if not isinstance(term, URIRef):
            continue
        iri = str(term)
        require(
            "synthetic-" not in iri,
            f"{label}: real public artifact references a synthetic fixture IRI: {iri}",
            errors,
        )
        require(
            not iri.startswith("https://example.org/"),
            f"{label}: real public artifact uses example.org fixture data: {iri}",
            errors,
        )
    return errors


def check_real_artifact_guard() -> list[str]:
    """Prove the real/fixture boundary rejects implementation redeclaration."""
    candidate = Graph()
    candidate.add((
        URIRef("https://w3id.org/sstim/implementation/bsclab/guard-probe"),
        RDF.type,
        SSTIM.SensoryStimulationImplementation,
    ))
    probe_relationship = URIRef(RECORD + "real-guard-probe")
    probe_activity = URIRef(ACTIVITY + "real-guard-probe")
    probe_agent = URIRef("https://w3id.org/sstim/specialist/real-guard-probe")
    external_actor = URIRef("https://example.net/unverified-curator")
    candidate.add((probe_agent, RDF.type, ECO.EcosystemAgent))
    candidate.add((probe_agent, PROV.wasAttributedTo, external_actor))
    candidate.add((probe_relationship, RDF.type, ECO.EcosystemRelationship))
    candidate.add((probe_relationship, PROV.wasAttributedTo, external_actor))
    candidate.add((probe_activity, RDF.type, ECO.EngagementActivity))
    candidate.add((probe_activity, PROV.wasAssociatedWith, external_actor))
    guard_errors = check_real_public_artifact(candidate, "real-guard-probe.ttl")
    errors: list[str] = []
    require(
        any("must reference, not redeclare" in issue for issue in guard_errors),
        "real artifact guard did not reject implementation-owned subject redeclaration",
        errors,
    )
    require(
        any("agent-record curator" in issue and "verified EcosystemAgent" in issue
            for issue in guard_errors),
        "real artifact guard did not reject an unverified agent-record curator",
        errors,
    )
    require(
        any("curator" in issue and "verified EcosystemAgent" in issue for issue in guard_errors),
        "real artifact guard did not reject an unverified relationship curator",
        errors,
    )
    require(
        any("activity actor" in issue and "verified EcosystemAgent" in issue for issue in guard_errors),
        "real artifact guard did not reject an unverified public activity actor",
        errors,
    )
    return errors


def check_reserved_subject_ownership(paths: list[Path]) -> list[str]:
    errors: list[str] = []
    owners: dict[URIRef, list[Path]] = {}
    prefixes = tuple(RESERVED_SUBJECT_PROFILES)
    for path in paths:
        graph = parse_graph([path])
        for subject in set(graph.subjects()):
            if isinstance(subject, URIRef) and str(subject).startswith(prefixes):
                owners.setdefault(subject, []).append(path)
    for subject, subject_owners in owners.items():
        require(
            len(subject_owners) == 1,
            f"reserved ecosystem subject {subject} is owned by several artifacts: "
            f"{[str(path) for path in subject_owners]}",
            errors,
        )
    return errors


def check_positive_contract(fixture: Graph, merged: Graph) -> list[str]:
    errors: list[str] = []

    agents = set(fixture.subjects(RDF.type, ECO.EcosystemAgent))
    relationships = set(fixture.subjects(RDF.type, ECO.EcosystemRelationship))
    memberships = set(fixture.subjects(RDF.type, ECO.OrganizationMembership))
    responsibilities = set(
        fixture.subjects(RDF.type, ECO.ImplementationResponsibility)
    )
    activities = set(fixture.subjects(RDF.type, ECO.EngagementActivity))

    require(agents == {PERSON, AURORA, RESONANCE},
            f"expected the three synthetic agents, found {sorted(map(str, agents))}", errors)
    require(relationships == set(EXPECTED_RELATIONSHIPS),
            f"expected six exact relationships, found {sorted(map(str, relationships))}", errors)
    require(len(memberships) == 2, f"expected 2 memberships, found {len(memberships)}", errors)
    require(len(responsibilities) == 2,
            f"expected 2 implementation responsibilities, found {len(responsibilities)}", errors)
    require(len(activities) == 14, f"expected 14 engagement activities, found {len(activities)}", errors)

    for relationship, expected in EXPECTED_RELATIONSHIPS.items():
        actual = (
            values(fixture, relationship, ECO.relationshipAgent),
            values(fixture, relationship, ECO.relationshipTarget),
            values(fixture, relationship, ECO.hasRelationshipType),
            values(fixture, relationship, ECO.relationshipPurpose),
            values(fixture, relationship, DCTERMS.source),
        )
        expected_sets = tuple({item} for item in expected)
        require(actual == expected_sets,
                f"{relationship}: binding differs; expected {expected_sets}, found {actual}", errors)

        inverse_agents = set(
            fixture.subjects(ECO.hasEcosystemRelationship, relationship)
        )
        require(inverse_agents == {expected[0]},
                f"{relationship}: inverse agent link is {inverse_agents}", errors)
        require(expected[0] != expected[1],
                f"{relationship}: agent and target must remain distinct", errors)

        linked_activities = values(
            fixture, relationship, ECO.hasEngagementActivity
        )
        require(bool(linked_activities),
                f"{relationship}: missing engagement activity", errors)
        for event in linked_activities:
            require(values(fixture, event, ECO.engagementFor) == {relationship},
                    f"{event}: shared or mismatched engagementFor backlink", errors)

    for event in activities:
        inbound = set(fixture.subjects(ECO.hasEngagementActivity, event))
        governed = values(fixture, event, ECO.engagementFor)
        require(len(inbound) == 1 and inbound == governed,
                f"{event}: activity must belong to exactly one matching relationship", errors)
        expected_actor = {CURATOR}
        if (event, RDF.type, ECO.ConsentDecisionActivity) in fixture:
            relationship = next(iter(governed), None)
            if relationship is not None and values(
                fixture, relationship, ECO.relationshipAgent
            ) == {PERSON}:
                expected_actor = {PERSON}
        require(values(fixture, event, PROV.wasAssociatedWith) == expected_actor,
                f"{event}: expected actor {expected_actor}", errors)
        actor = next(iter(expected_actor))
        require((actor, RDF.type, PROV.Agent) in merged,
                f"{event}: actor {actor} is not explicitly a prov:Agent", errors)

        event_times = values(fixture, event, PROV.endedAtTime)
        require(len(event_times) == 1 and next(iter(event_times)).datatype == XSD.dateTime,
                f"{event}: event time must be one xsd:dateTime", errors)
        if len(event_times) == 1:
            current = next(iter(event_times)).toPython()
            for predecessor in fixture.objects(event, PROV.wasInformedBy):
                prior_times = values(fixture, predecessor, PROV.endedAtTime)
                require(len(prior_times) == 1,
                        f"{event}: predecessor {predecessor} has no unique timestamp", errors)
                if len(prior_times) == 1:
                    require(next(iter(prior_times)).toPython() < current,
                            f"{event}: predecessor {predecessor} is not strictly earlier", errors)

    aurora_membership = URIRef(RECORD + "alex-membership-aurora")
    resonance_membership = URIRef(RECORD + "alex-membership-resonance")
    require(values(fixture, aurora_membership, ORG.role) == {
        URIRef("https://example.org/roles/researcher")
    }, "Aurora membership role was cross-associated", errors)
    require(values(fixture, resonance_membership, ORG.role) == {
        URIRef("https://example.org/roles/maintainer")
    }, "Resonance membership role was cross-associated", errors)

    for predicate in PRIVATE_PREDICATES:
        require(not any(fixture.triples((None, predicate, None))),
                f"public fixture contains forbidden private predicate {predicate}", errors)
    for predicate in LEGACY_PREDICATES:
        require(not any(fixture.triples((None, predicate, None))),
                f"public fixture uses deprecated flat predicate {predicate}", errors)

    for _, _, source in fixture.triples((None, DCTERMS.source, None)):
        require(isinstance(source, URIRef) and str(source).startswith("https://example.org/"),
                f"fixture source is not a synthetic example.org IRI: {source}", errors)
    for predicate in (SCHEMA.url, SCHEMA.sameAs):
        for _, _, identity in fixture.triples((None, predicate, None)):
            require(isinstance(identity, URIRef) and str(identity).startswith("https://example.org/"),
                    f"fixture identity link is not synthetic: {identity}", errors)

    require(not any(fixture.triples((None, ECO.archivalConsent, None))),
            "fixture must not use legacy archivalConsent", errors)
    for event in fixture.subjects(ECO.engagementPurpose, ECO.purposeArchivalPublication):
        require((event, ECO.engagementOutcome, ECO.outcomeConsentGranted) not in fixture,
                f"{event}: fixture must not grant archival consent", errors)

    declared = {
        subject for subject in merged.subjects() if isinstance(subject, URIRef)
    }
    for _, _, obj in fixture:
        if not isinstance(obj, URIRef) or not str(obj).startswith(LOCAL_PREFIXES):
            continue
        require(obj in declared, f"dangling local IRI in isolated fixture: {obj}", errors)

    for predicate in (DCTERMS.created, DCTERMS.modified, ECO.reviewedOn,
                      ECO.validFrom, ECO.validUntil):
        for subject, value in fixture.subject_objects(predicate):
            require(isinstance(value, Literal) and value.datatype == XSD.date,
                    f"{subject}: {predicate} must preserve xsd:date", errors)

    return errors


def expand_context_id(value: str, prefixes: dict[str, str]) -> str:
    if ":" not in value:
        return value
    prefix, local = value.split(":", 1)
    return prefixes.get(prefix, prefix + ":") + local


def check_jsonld_round_trip(fixture: Graph) -> list[str]:
    errors: list[str] = []
    payload = json.loads(CONTEXT.read_text(encoding="utf-8"))
    context = payload.get("@context", {})
    prefixes = {
        key: value
        for key, value in context.items()
        if isinstance(value, str) and (value.endswith("#") or value.endswith("/"))
    }

    require(prefixes.get("schema") == "https://schema.org/",
            "context.jsonld must declare the HTTPS schema.org prefix", errors)
    require(prefixes.get("org") == "http://www.w3.org/ns/org#",
            "context.jsonld must declare the W3C ORG prefix", errors)

    mapped: set[str] = set()
    for spec in context.values():
        context_id = spec if isinstance(spec, str) else spec.get("@id") if isinstance(spec, dict) else None
        if isinstance(context_id, str):
            mapped.add(expand_context_id(context_id, prefixes))

    required_terms = {
        str(ECO.EcosystemRelationship),
        str(ECO.OrganizationMembership),
        str(ECO.ImplementationResponsibility),
        str(ECO.EngagementActivity),
        str(ECO.relationshipAgent),
        str(ECO.relationshipTarget),
        str(ECO.hasRelationshipType),
        str(ECO.relationshipPurpose),
        str(ECO.hasEngagementActivity),
        str(ECO.engagementFor),
        str(ECO.engagementPurpose),
        str(ECO.engagementOutcome),
        str(ORG.member),
        str(ORG.organization),
        str(ORG.role),
    }
    missing = sorted(required_terms - mapped)
    require(not missing, f"context.jsonld lacks compact ecosystem terms: {missing}", errors)

    serialized = fixture.serialize(
        format="json-ld", context=context, auto_compact=True, indent=2
    )
    round_trip = Graph().parse(data=serialized, format="json-ld")
    require(isomorphic(fixture, round_trip),
            "committed context JSON-LD round trip is not graph-isomorphic", errors)

    try:
        compacted = json.loads(serialized)
        require("@context" in compacted,
                "compacted JSON-LD did not embed its context", errors)
    except json.JSONDecodeError as exc:  # pragma: no cover - serializer failure
        errors.append(f"generated JSON-LD is invalid JSON: {exc}")

    return errors


def validation_report_for_error(report: str, redact: bool) -> str:
    if redact:
        return "[validation details suppressed: the graph may contain private identifiers]"
    return report


def private_issue_summary(count: int) -> str:
    return (
        "access-controlled ledger failed history-mirroring or terminal-cleanup "
        f"checks ({count} private diagnostic(s) suppressed)"
    )


def check_private_diagnostic_redaction() -> list[str]:
    """Prove public-facing failure formatters cannot echo private content."""
    errors: list[str] = []
    probe = "https://example.org/private-ledger/DO-NOT-PRINT"
    rendered = validation_report_for_error(probe, True)
    summary = private_issue_summary(1)
    require(probe not in rendered, "private SHACL report redaction leaked its probe", errors)
    require("suppressed" in rendered, "private SHACL redaction lacks a safe notice", errors)
    require(probe not in summary, "private issue summary leaked its probe", errors)
    return errors


@lru_cache(maxsize=2)
def load_shapes(path: Path) -> Graph:
    """Parse each public/private shape graph once for in-process validation."""
    return parse_graph([path])


class ShaclCase(NamedTuple):
    data: Graph
    label: str
    expected_conforms: bool
    expected_message: str | None = None
    shapes: Path = SHAPES
    redact_report: bool = False


def run_pyshacl(
    data: Graph,
    label: str,
    expected_conforms: bool,
    expected_message: str | None = None,
    shapes: Path = SHAPES,
    redact_report: bool = False,
    use_cli: bool = False,
) -> list[str]:
    errors: list[str] = []
    validation_failure = False
    if not use_cli and pyshacl_validate is not None:
        try:
            conforms, report_graph, report = pyshacl_validate(
                data,
                shacl_graph=load_shapes(shapes),
                inference="rdfs",
                inplace=False,
            )
            report = str(report)
            validation_failure = (
                ValidationFailure is not None
                and isinstance(report_graph, ValidationFailure)
            )
        except Exception as exc:  # Match the CLI path's controlled diagnostic.
            report_for_error = validation_report_for_error(str(exc), redact_report)
            errors.append(
                f"{label}: in-process pySHACL validation failed:\n{report_for_error}"
            )
            return errors
    else:
        with tempfile.TemporaryDirectory(prefix="sstim-ecosystem-") as tmp:
            data_path = Path(tmp) / "data.ttl"
            data.serialize(destination=data_path, format="turtle")
            completed = subprocess.run(
                [
                    "pyshacl",
                    "-s", str(shapes),
                    "-i", "rdfs",
                    "-f", "human",
                    str(data_path),
                ],
                text=True,
                capture_output=True,
                check=False,
            )

        report = completed.stdout + completed.stderr
        if completed.returncode not in (0, 1):
            report_for_error = validation_report_for_error(report, redact_report)
            errors.append(
                f"{label}: pySHACL failed with exit {completed.returncode}:\n"
                f"{report_for_error}"
            )
            return errors
        conforms = completed.returncode == 0

    report_for_error = validation_report_for_error(report, redact_report)
    if validation_failure or "Validation Failure result" in report:
        errors.append(
            f"{label}: pySHACL reported an invalid shapes/validation failure, "
            f"not an ordinary conformance result:\n{report_for_error}"
        )
        return errors

    if conforms != expected_conforms:
        expectation = "conform" if expected_conforms else "be rejected"
        errors.append(
            f"{label}: expected graph to {expectation}, pySHACL returned "
            f"conforms={conforms}:\n{report_for_error}"
        )
    elif not expected_conforms and expected_message and expected_message not in report:
        errors.append(
            f"{label}: graph was rejected, but not for its intended contract; "
            f"expected report text {expected_message!r}:\n{report_for_error}"
        )
    return errors


def run_serialized_pyshacl(
    case: tuple[str, str, bool, str | None, Path, bool],
) -> list[str]:
    """Validate one serialized case inside a worker process."""
    data_text, label, expected_conforms, expected_message, shapes, redact = case
    data = Graph().parse(data=data_text, format="turtle")
    return run_pyshacl(
        data,
        label,
        expected_conforms,
        expected_message,
        shapes,
        redact,
    )


def run_pyshacl_cases(
    cases: list[ShaclCase],
    use_cli: bool,
    workers: int,
) -> list[str]:
    """Validate isolated cases, parallelizing the importable API path."""
    errors: list[str] = []
    if use_cli or workers == 1 or len(cases) == 1:
        for case in cases:
            errors.extend(run_pyshacl(*case, use_cli=use_cli))
        return errors

    serialized_cases = [
        (
            case.data.serialize(format="turtle"),
            case.label,
            case.expected_conforms,
            case.expected_message,
            case.shapes,
            case.redact_report,
        )
        for case in cases
    ]
    with ProcessPoolExecutor(max_workers=min(workers, len(cases))) as executor:
        for case_errors in executor.map(run_serialized_pyshacl, serialized_cases):
            errors.extend(case_errors)
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--skip-shacl",
        action="store_true",
        help="Run structural/JSON-LD checks without pySHACL (diagnostics only).",
    )
    parser.add_argument(
        "--pyshacl-cli",
        action="store_true",
        help=argparse.SUPPRESS,
    )
    parser.add_argument(
        "--shacl-workers",
        type=int,
        default=min(4, os.cpu_count() or 1),
        help=(
            "Number of isolated in-process pySHACL workers "
            "(default: min(4, CPU count); use 1 for serial diagnostics)."
        ),
    )
    parser.add_argument(
        "--private-ledger",
        type=Path,
        help=(
            "Path to the access-controlled complete audit ledger required when "
            "validating real public ecosystem records; the path must be outside "
            "this repository."
        ),
    )
    args = parser.parse_args()
    if args.shacl_workers < 1:
        parser.error("--shacl-workers must be at least 1")

    errors: list[str] = []
    fixture = parse_graph([FIXTURE])
    merged = build_validation_graph(fixture)

    errors.extend(check_positive_contract(fixture, merged))
    errors.extend(check_public_artifact_profile(fixture, FIXTURE.name))
    errors.extend(check_jsonld_round_trip(fixture))
    errors.extend(check_local_resolution(fixture, merged, FIXTURE.name))
    private_ledger = parse_graph([FIXTURE, PRIVATE_LEDGER_FIXTURE])
    errors.extend(check_public_activity_mirroring(fixture, private_ledger))
    errors.extend(check_public_relationship_mirroring(fixture, private_ledger))
    errors.extend(check_public_activity_mirroring_guard(fixture, private_ledger))
    errors.extend(check_public_relationship_mirroring_guard(fixture, private_ledger))
    errors.extend(check_private_relationship_snapshots(private_ledger))
    errors.extend(check_private_terminal_absence(fixture, private_ledger))
    errors.extend(check_private_terminal_guard(private_ledger))
    errors.extend(check_private_diagnostic_redaction())
    errors.extend(check_real_artifact_guard())

    private_fixture_entries = {
        path.name for path in PRIVATE_LEDGER_FIXTURE.parent.iterdir()
    }
    require(
        private_fixture_entries == {PRIVATE_LEDGER_FIXTURE.name},
        "the repository private-ledger fixture directory is closed to every "
        "entry except the named synthetic guard; "
        f"found={sorted(private_fixture_entries)}",
        errors,
    )

    private_negative_paths = sorted(PRIVATE_NEGATIVE_DIR.glob("*.ttl"))
    private_negative_names = {path.name for path in PRIVATE_NEGATIVE_DIR.iterdir()}
    require(
        private_negative_names == set(EXPECTED_PRIVATE_NEGATIVE_MESSAGES),
        "every private-ledger adversarial fixture must have one intended report "
        f"message; files={sorted(private_negative_names)}, "
        f"mappings={sorted(EXPECTED_PRIVATE_NEGATIVE_MESSAGES)}",
        errors,
    )

    positive_paths = sorted(POSITIVE_SCENARIO_DIR.glob("*.ttl"))
    positive_names = {path.name for path in positive_paths}
    require(
        positive_names == EXPECTED_POSITIVE_SCENARIOS,
        f"positive scenario set differs: files={sorted(positive_names)}, "
        f"expected={sorted(EXPECTED_POSITIVE_SCENARIOS)}",
        errors,
    )
    positive_candidates: list[tuple[Path, Graph]] = []
    for path in positive_paths:
        scenario_artifact = parse_graph([FIXTURE, path])
        candidate = build_validation_graph(scenario_artifact)
        errors.extend(check_public_artifact_profile(scenario_artifact, path.name))
        errors.extend(check_jsonld_round_trip(scenario_artifact))
        positive_candidates.append((path, candidate))

    public_paths = sorted(PUBLIC_ARTIFACT_DIR.glob("*.ttl"))
    require(
        len(public_paths) <= 1,
        "F4 currently uses one self-contained aggregate public ecosystem file; "
        f"found {[path.name for path in public_paths]}",
        errors,
    )
    errors.extend(check_reserved_subject_ownership([FIXTURE, *public_paths]))
    public_candidates: list[tuple[Path, Graph]] = []
    real_public = Graph()
    for path in public_paths:
        artifact = parse_graph([path])
        for triple in artifact:
            real_public.add(triple)
        candidate = build_validation_graph(artifact)
        errors.extend(check_public_artifact_profile(artifact, path.name))
        errors.extend(check_real_public_artifact(artifact, path.name))
        errors.extend(check_jsonld_round_trip(artifact))
        errors.extend(check_local_resolution(artifact, candidate, path.name))
        public_candidates.append((path, candidate))

    external_private_candidate: Graph | None = None
    if public_paths and args.private_ledger is None:
        errors.append(
            "real public ecosystem records require --private-ledger pointing to "
            "their access-controlled complete audit history"
        )
    if args.private_ledger is not None:
        ledger_path = args.private_ledger.expanduser().resolve()
        require(
            ledger_path.is_file(),
            "private ledger path does not name a readable file",
            errors,
        )
        require(
            ROOT not in ledger_path.parents,
            "private ledger must remain outside the public repository",
            errors,
        )
        if ledger_path.is_file() and ROOT not in ledger_path.parents:
            try:
                external_private = parse_graph([ledger_path])
                private_issues = check_public_activity_mirroring(
                    real_public, external_private
                )
                private_issues.extend(
                    check_public_relationship_mirroring(
                        real_public, external_private
                    )
                )
                private_issues.extend(
                    check_private_relationship_snapshots(external_private)
                )
                private_issues.extend(check_private_terminal_absence(
                    real_public, external_private, require_terminal=False
                ))
                if private_issues:
                    errors.append(private_issue_summary(len(private_issues)))
                external_private_candidate = parse_graph([
                    *CONTEXT_FILES, ledger_path
                ])
            except Exception:  # Never echo parser context from a private file.
                errors.append(
                    "access-controlled ledger could not be parsed as Turtle; "
                    "details suppressed to protect private identifiers"
                )

    negative_paths = sorted(NEGATIVE_DIR.glob("*.ttl"))
    require(len(negative_paths) >= 34,
            f"expected at least 34 SHACL adversarial fixtures, found {len(negative_paths)}", errors)
    negative_names = {path.name for path in negative_paths}
    require(negative_names == set(EXPECTED_NEGATIVE_MESSAGES),
            "every adversarial fixture must have one intended pySHACL report message; "
            f"files={sorted(negative_names)}, mappings={sorted(EXPECTED_NEGATIVE_MESSAGES)}",
            errors)

    profile_negative_paths = sorted(PROFILE_NEGATIVE_DIR.glob("*.ttl"))
    profile_negative_names = {path.name for path in profile_negative_paths}
    require(
        profile_negative_names == set(EXPECTED_PROFILE_NEGATIVE_MESSAGES),
        "every artifact-profile adversarial fixture must have one intended report message; "
        f"files={sorted(profile_negative_names)}, "
        f"mappings={sorted(EXPECTED_PROFILE_NEGATIVE_MESSAGES)}",
        errors,
    )
    for path in profile_negative_paths:
        candidate = parse_graph([FIXTURE, path])
        profile_errors = check_public_artifact_profile(candidate, path.name)
        expected = EXPECTED_PROFILE_NEGATIVE_MESSAGES[path.name]
        require(
            bool(profile_errors),
            f"{path.name}: expected the file-wide public profile to reject the overlay",
            errors,
        )
        require(
            any(expected in issue for issue in profile_errors),
            f"{path.name}: rejected for the wrong artifact-profile reason; "
            f"expected {expected!r}, found {profile_errors}",
            errors,
        )

    if not args.skip_shacl:
        use_pyshacl_cli = args.pyshacl_cli or pyshacl_validate is None
        if use_pyshacl_cli and shutil.which("pyshacl") is None:
            errors.append(
                "pyshacl Python API or CLI is required; run inside `nix develop` or use "
                "--skip-shacl only for non-gating diagnostics"
            )
        else:
            shacl_cases = [ShaclCase(
                merged,
                "positive synthetic ecosystem",
                True,
            )]
            private_candidate = parse_graph([
                *CONTEXT_FILES, FIXTURE, PRIVATE_LEDGER_FIXTURE
            ])
            shacl_cases.append(ShaclCase(
                private_candidate,
                "positive synthetic private ledger",
                True,
                shapes=PRIVATE_SHAPES,
            ))
            for path in private_negative_paths:
                candidate = parse_graph([*CONTEXT_FILES, path])
                shacl_cases.append(ShaclCase(
                    candidate,
                    path.name,
                    False,
                    EXPECTED_PRIVATE_NEGATIVE_MESSAGES[path.name],
                    shapes=PRIVATE_SHAPES,
                ))
            for path, candidate in positive_candidates:
                shacl_cases.append(ShaclCase(
                    candidate,
                    path.name,
                    True,
                ))
            for path, candidate in public_candidates:
                shacl_cases.append(ShaclCase(
                    candidate,
                    path.name,
                    True,
                ))
            if external_private_candidate is not None:
                shacl_cases.append(ShaclCase(
                    external_private_candidate,
                    "access-controlled real ecosystem audit ledger",
                    True,
                    shapes=PRIVATE_SHAPES,
                    redact_report=True,
                ))
            for path in negative_paths:
                candidate = parse_graph([*CONTEXT_FILES, FIXTURE, path])
                shacl_cases.append(ShaclCase(
                    candidate,
                    path.name,
                    False,
                    EXPECTED_NEGATIVE_MESSAGES.get(path.name),
                ))
            errors.extend(run_pyshacl_cases(
                shacl_cases,
                use_pyshacl_cli,
                args.shacl_workers,
            ))

    if errors:
        print(f"ecosystem-contract: FAILED ({len(errors)} issue(s))", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    shacl_note = "SHACL skipped" if args.skip_shacl else f"{len(negative_paths)} SHACL negatives rejected"
    print(
        "ecosystem-contract: passed "
        f"(3 agents, 6 relationships, 14 activities, JSON-LD isomorphic, "
        f"{shacl_note}, {len(profile_negative_paths)} file-profile negatives rejected, "
        f"{len(private_negative_paths)} private-ledger negatives rejected, "
        f"{len(positive_paths)} positive policy scenario, "
        f"{len(public_paths)} real public artifact(s), graph-boundary and "
        "private-history mirroring and terminal deletion guards proved)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
