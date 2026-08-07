# Agent automation — where it may and may not reach

> **Nothing here is built, and none of it is on the roadmap.** This records the
> boundary a conversational agent-automation layer would have to respect if BSC
> Lab ever adds one. It is not a commitment, a vendor choice, or a description of
> how anything works today.

An earlier version of this file was a 377-line integration design for one
specific product (OpenClaw), including a Firebase Functions backend, queues and
webhooks that BSC Lab does not run — the app is client-only on GitHub Pages. That
design was never built and was tied to a vendor the project never chose. What
survived is the part that would apply to any such tool, so it is stated
vendor-neutrally here.

## The rule

> Use deterministic infrastructure for deterministic work. Use a conversational
> agent only where humans send messy knowledge through chat channels and
> something has to route, clarify, draft, and prepare it for review.

Reasonable uses: contributor intake from messaging channels; maintainer commands
from a phone; routing papers, hypotheses and feedback; assembling review packets;
turning a source into *draft* RDF; reminders and summaries.

Not reasonable: canonical ontology edits, unattended publication of SSTIM terms,
scheduled validation, SPARQL querying, or anything that replaces GitHub Actions,
SHACL, or human review. Those are deterministic jobs and already have owners.

## The canonical-data boundary

An agent may produce queue records, review notes, draft RDF, issues, pull
requests, summaries, and validation reports. It may **not** create canonical
SSTIM knowledge.

A canonical change requires human review, SHACL validation, scope and
evidence-language review, Git diff review, and the normal merge process. For
protected ontology files the `CLAUDE.md` §3.4 rules remain authoritative — an
agent has no standing to edit them, and an automated instruction is not the
"explicit human instruction in the current session" those rules require.

## Security, if it is ever built

An agent that bridges messaging, files, shell, GitHub and an LLM is useful for
exactly the reason it is dangerous. Minimum requirements: an isolated
machine or container; non-primary credentials; sender and group allowlists;
mention-based activation in group chats; third-party skills disabled unless
reviewed; narrow tools rather than shell access; explicit confirmation for file
writes, Git operations, deploys and ontology edits; logging of every generated
RDF candidate and external-source transformation; and incoming papers, links,
PDFs and messages treated as untrusted input.

Start with intake and review-packet generation, never with autonomous editing.

And the constraint that outranks all of them: an agent must not generate health
or medical claims outside the language boundaries in
[`../concept/SCOPE.md`](../concept/SCOPE.md) (`CLAUDE.md` §3.5).
