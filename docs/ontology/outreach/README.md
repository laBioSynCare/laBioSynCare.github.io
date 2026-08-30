# Registry and publication correspondence

Messages sent to — or drafted for — the registries, catalogues and platforms
tracked in [`../REGISTRY_SUBMISSIONS.md`](../REGISTRY_SUBMISSIONS.md). One file
per message, named `YYYY-MM-DD-<recipient>-<subject>.md`.

**Why here and not `docs/ecosystem/`.** That directory holds *stakeholder*
outreach — consortium invitations, partner targets, the people side of the
ecosystem. This directory holds *technical* correspondence about publishing the
ontology: registry enquiries, submission follow-ups, upstream bug reports where
the thread matters. The split is by subject, not by formality.

**What belongs here.** Anything where the wording will be needed again, or where
the reply changes what we do. A drafted message that needs a human to send it
belongs here rather than in a scratch file, because a draft nobody can find is
the same as no draft. Record the reply in the relevant entry of
`REGISTRY_SUBMISSIONS.md`, not here — this directory is what we said, that file
is what is true.

**What does not belong here.** Anything with credentials, private ledger data,
or an unpublished identifier. These files are public.

| Message | Status |
|---|---|
| [`2026-08-18-showvoc-enquiry.md`](2026-08-18-showvoc-enquiry.md) | Drafted. Awaiting admission to the `vocbench-user` Google Group, then to be posted by Renato — Google Groups cannot be posted to from tooling. |
| [`2026-08-18-hed-working-group-questions.md`](2026-08-18-hed-working-group-questions.md) | Sent 2026-08-20. Question 1 is half settled, questions 2 and 3 are answered, questions 4 and 5 plus the definition-shape question remain open, and question 6's silent validator skip is fixed upstream. Three generated demonstrator bundles now cover fixed, segmented and continuously modulated stimuli. |
| [`2026-08-27-kay-robbins-revised-events-bundle.md`](2026-08-27-kay-robbins-revised-events-bundle.md) | **Drafted, not sent.** The revised `events.tsv` and `events.json` Kay Robbins asked for at the 2026-08-25 meeting, with her four rulings: a pause is `Offset` then `Onset` and never `HED_0012527`, drop the `event_type` and `HED` columns, do not build a HED schema for SSTIM, and look at STIM BIDS. The attachments are in the directory beside it. Mapping 0.5.0 and the generated demonstrators now implement the first two rulings; that does not change the message's unsent status. |
