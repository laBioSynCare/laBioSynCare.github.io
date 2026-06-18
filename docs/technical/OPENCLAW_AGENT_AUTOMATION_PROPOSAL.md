# OpenClaw Agent Automation — Proposal

> **Status: exploratory proposal — Phase 3, not on the current roadmap.** Nothing
> here is built: no OpenClaw runtime, skill package, Firebase Functions backend,
> or GitHub Actions workflow described below exists. It also assumes a server-side
> backend (Firebase Functions, queues, webhooks) that BSC Lab does not currently
> run — the app is client-only on GitHub Pages (see `CLAUDE.md` §2 and
> `ROADMAP.md`). Treat this as a design sketch for possible future contributor
> intake, not a commitment or a description of how the project works today.

This document sketches a possible future BSC Lab use of OpenClaw. The category is
**agent automation**: OpenClaw is useful as a persistent conversational gateway
and agent coordinator around SSTIM and BSC Lab, not as the core validation
engine, ontology authority, or SPARQL endpoint.

The practical rule is:

> Use deterministic infrastructure for deterministic work. Use OpenClaw where
> humans send messy knowledge through chat channels and need an agent to route,
> clarify, draft, validate, and prepare review material.

---

## Role Summary

OpenClaw should be used for:

- contributor intake through Telegram, WhatsApp, Signal, Slack, or similar
  channels;
- mobile maintainer commands;
- conversational routing of papers, hypotheses, feedback, and annotations;
- multi-agent review preparation;
- source-to-draft-RDF workflows;
- reminders, summaries, and review packets that cross GitHub, Firebase, and the
  local BSC Lab repository.

OpenClaw should not be used for:

- direct canonical ontology edits;
- unattended publication of SSTIM terms;
- pure scheduled validation;
- pure SPARQL querying;
- replacing GitHub Actions, Firebase Functions, SHACL, or human review.

---

## System Boundary

The intended architecture separates five concerns.

| Layer | Responsibility |
|---|---|
| Nix | Reproducible local toolchain and helper commands. |
| GitHub Actions | Scheduled and pull-request validation of the repository. |
| Firebase Functions | Event intake, webhooks, Firestore triggers, and notifications. |
| Firestore | Queues and review state for submissions, selected sources, draft claims, and draft RDF. |
| OpenClaw | Long-lived conversational gateway, agent coordinator, and mobile command surface. |

OpenClaw may call tools from the other layers, but it should not absorb their
responsibilities.

---

## Nix Ownership

For local development, Nix should make the SSTIM/OpenClaw skill environment
reproducible. Nix should provide:

- Node version compatible with BSC Lab and OpenClaw;
- the existing BSC Lab validation toolchain;
- pySHACL and other RDF tooling already used by `make validate`;
- optional helper scripts for SSTIM query, SHACL validation, and RDF draft
  serialization;
- a command to install or link the SSTIM OpenClaw skill into the user's local
  OpenClaw skill directory.

Nix should not silently mutate user-level OpenClaw configuration. Entering
`nix develop` should prepare the toolchain, not install a persistent agent.

Preferred pattern:

```text
tools/openclaw/skills/sstim/SKILL.md
tools/openclaw/skills/sstim/scripts/
scripts/install-openclaw-sstim-skill.mjs
```

Potential command:

```bash
nix develop
make openclaw-install-sstim-skill
```

The skill source stays versioned in BSC Lab. The active OpenClaw runtime remains
local/private to the maintainer or collaborator.

---

## OpenClaw Runtime Placement

OpenClaw should run as a long-lived gateway, not as a short-lived job.

Appropriate placements:

- local daemon on the maintainer's machine;
- isolated development machine;
- restricted VPS;
- container or VM with narrow credentials;
- private network service reachable through Tailscale or equivalent access
  control.

OpenClaw should usually not run inside:

- GitHub Actions;
- Firebase Functions;
- one-off CI jobs;
- browser-only BSC Lab runtime.

The reason is operational: OpenClaw holds sessions, channel connections,
credentials, memory, and routing state. GitHub Actions and Firebase Functions
are ephemeral execution surfaces. They are better as triggers, queues, and
deterministic processors.

---

## GitHub Actions Boundary

GitHub Actions should handle repository-centered automation:

- weekly `make validate`;
- scheduled `make check` and `make build`;
- ontology snapshot checks;
- SPARQL competency query tests;
- broken-link or w3id checks;
- release-note preparation;
- artifact publication;
- issue or PR updates from deterministic scripts.

OpenClaw can observe or summarize GitHub Actions output, but GitHub Actions
should remain the authority for CI-style validation.

Example:

```text
Monday schedule
  -> GitHub Actions runs validation
  -> report artifact is produced
  -> Firebase/GitHub notification records summary
  -> OpenClaw can answer maintainer questions about the result
```

This avoids using OpenClaw for work that does not require a conversational agent.

---

## Firebase Functions Boundary

Firebase Functions should handle backend events:

- Telegram, WhatsApp, email, or web form webhook receivers;
- Firestore document-created triggers;
- normalization of inbound messages;
- queue writes;
- lightweight source metadata extraction;
- notification dispatch;
- scheduled lightweight tasks.

Firebase Functions are a good fit for "when X happens, write or update Y." They
are not a good fit for a persistent chat agent with long-lived sessions.

Example collections:

```text
sourceSubmissions/
selectedSources/
candidateClaims/
rdfDrafts/
reviewDecisions/
agentRuns/
```

OpenClaw can read and write these collections through controlled tools, but the
collections should be structured so that BSC Lab can review submissions without
depending on OpenClaw.

---

## SSTIM Skill Package

The SSTIM OpenClaw skill package should teach an agent how to work safely with
SSTIM and BSC Lab.

The skill should instruct OpenClaw to:

- read `docs/concept/SCOPE.md` before generating user-facing claims;
- read `docs/concept/EVIDENCE_FRAMEWORK.md` before grading or describing
  evidence;
- read `static/ontology/README.md` before generating RDF or SPARQL;
- never directly edit protected ontology artifacts;
- never publish generated RDF as canonical SSTIM without human review;
- write generated RDF into a draft location or Firestore review item;
- run SHACL validation before proposing RDF for review;
- preserve contributor provenance;
- distinguish citation, hypothesis, opinion, personal experience, and
  implementation feedback;
- open GitHub issues or PRs instead of mutating canonical files directly.

The skill should expose narrowly scoped tools, for example:

```text
sstim_query
sstim_describe_term
sstim_validate_turtle
sstim_create_source_submission
sstim_create_candidate_claim
sstim_create_rdf_draft
bsc_run_validate
bsc_open_review_issue
```

The skill should avoid broad shell access when a narrower command exists.

---

## Candidate Workflows

### Source Intake

A researcher sends a paper, DOI, URL, PDF, or note.

```text
message channel
  -> OpenClaw receives or is notified of the submission
  -> asks missing follow-up questions if needed
  -> stores sourceSubmissions/{id}
  -> extracts candidate metadata
  -> maps likely SSTIM terms
  -> creates selectedSources/{id} and candidateClaims/{id}
  -> creates rdfDrafts/{id} when appropriate
  -> opens review item for a human maintainer
```

OpenClaw's value is the conversational clarification step: it can ask whether
the source is a citation, a personal hypothesis, a correction, a safety concern,
or an implementation proposal.

### Contributor Opinion or Hypothesis

A contributor sends a personal evaluation, experience report, or hypothesis.

OpenClaw should classify it as one of:

- evidence source;
- anecdotal report;
- personal hypothesis;
- terminology proposal;
- scope concern;
- safety concern;
- implementation suggestion;
- governance comment.

Only after classification should the system draft RDF or review metadata. A
personal hypothesis should not become an evidence claim without explicit review
and evidence-tier treatment.

### Mobile Maintainer Console

The maintainer sends a command from a phone:

```text
summarize this week's SSTIM submissions
draft RDF for submission 183, but do not commit it
open a GitHub issue for every unreviewed safety concern
tell me whether the weekly validation failed
```

OpenClaw coordinates the relevant systems and reports back. It should request
explicit confirmation before any action that changes repository state.

### Review Packet Generation

For each candidate source, OpenClaw can prepare a packet:

- original contributor text;
- extracted source metadata;
- proposed SSTIM terms;
- proposed claim text;
- proposed evidence tier;
- modality tags;
- caution/scope flags;
- candidate Turtle or JSON-LD;
- SHACL validation result;
- unresolved questions.

The packet is a review artifact, not a canonical ontology update.

---

## Canonical Data Boundary

OpenClaw may create:

- Firestore queue records;
- review notes;
- draft RDF;
- GitHub issues;
- GitHub pull requests;
- generated summaries;
- validation reports.

OpenClaw must not directly create canonical SSTIM knowledge without review.

Canonical changes require:

1. Human review.
2. SHACL validation.
3. Scope and evidence-language review.
4. Git diff review.
5. Normal repository merge process.

For protected ontology files, the existing `CLAUDE.md` protected-file rules
remain authoritative.

---

## Security Requirements

OpenClaw is powerful because it can bridge messaging, files, shell commands,
GitHub, Firebase, and LLMs. That same property makes it risky.

Minimum requirements:

- run in an isolated machine, container, VM, or restricted user account;
- use non-primary credentials;
- use allowlists for message senders and groups;
- require mention-based activation in group chats;
- keep third-party skills disabled unless reviewed;
- prefer local BSC Lab skills over marketplace skills;
- expose narrow tools rather than broad shell access;
- require confirmation for file writes, Git operations, deploys, and ontology
  edits;
- log all generated candidate RDF and all external-source transformations;
- treat incoming papers, links, PDFs, and messages as untrusted input.

For BSC Lab specifically, OpenClaw must not generate health or medical claims
outside the language boundaries in `docs/concept/SCOPE.md`.

---

## Recommended Initial Implementation

The first useful implementation should be small:

1. Add `tools/openclaw/skills/sstim/SKILL.md`.
2. Add a local installer command that links the skill into OpenClaw.
3. Add helper scripts for read-only SSTIM query and SHACL validation.
4. Add Firestore draft collections and rules for source submissions.
5. Add a Telegram intake path before attempting WhatsApp.
6. Add GitHub issue creation for review packets.
7. Keep all generated RDF as draft artifacts until manually accepted.

Do not start with broad autonomous editing. Start with intake and review packet
generation.

---

## References

- OpenClaw overview: https://docs.openclaw.ai/
- Firebase scheduled functions: https://firebase.google.com/docs/functions/schedule-functions
- Firebase Firestore triggers: https://firebase.google.com/docs/functions/firestore-events
- Firebase HTTP functions: https://firebase.google.com/docs/functions/http-events
- GitHub Actions schedule event: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule
- Telegram Bot API: https://core.telegram.org/bots/api
- Gmail push notifications: https://developers.google.com/workspace/gmail/api/guides/push
- WhatsApp Business Platform: https://developers.facebook.com/docs/whatsapp/
