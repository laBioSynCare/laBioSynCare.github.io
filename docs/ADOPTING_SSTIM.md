# Adopting SSTIM

You describe sensory stimulation: a tone, a flicker, a vibration, a protocol
that combines them. You want someone else to be able to read that description
and deliver the same thing. That is what SSTIM is for.

Adopting it means one thing: **you keep your data, and you reuse our terms.**
Your protocols, sessions and records stay in a namespace you control. SSTIM
supplies the classes, properties and controlled concepts they are built from,
so that a reader who has never seen your files knows what your fields mean.

Everything below is runnable in about half an hour, and none of it requires
cloning this repository.

---

## 1. Decide whether you need it

Worth doing if you publish protocols or datasets others should reproduce, if
you build software that exchanges stimulus descriptions with something else, or
if you are trying to compare what two systems deliver.

Not worth doing if you have a small private configuration object, no consumers
outside your own code, and no need for anyone else's tooling to understand it.
That is a real answer, and it is the honest one for many projects.

SSTIM also will not do these things, today: it is not a clinical decision
system, it is not evidence that a stimulation has an effect, and it is not a
production schema for identifiable participant data. See
[SCOPE.md](concept/SCOPE.md).

## 2. Pick the smallest profile that carries what you assert

SSTIM ships as modules behind four entry points. Take the smallest one that
holds the terms you actually use, because every module you take is a dependency
your consumers inherit.

| Profile | What it adds | Take it when |
|---|---|---|
| **Kernel** | Two process anchors, no shapes | You are aligning an upper ontology and want an anchor, nothing more |
| **Core** | Engine-independent stimulus description: signals, channels, renderings | You want to say what reaches the subject, with the fewest dependencies |
| **Core Plus** | Reusable descriptors and calibrated quantities, including frequency extents | Anyone has to query or compare the numbers |
| **Full** | Techniques, protocols, configurations, sessions, evidence, exposure, the SKOS vocabulary | You name a published technique, record a session, or state an evidence claim |

Moving up later is additive, so starting small costs you nothing.

## 3. Fetch it, pinned to a version

For anything you publish, pin a release. The mutable line moves.

```bash
# Core, at a pinned release: the two modules plus the shapes that validate them
for f in sstim-core.ttl sstim-stimulus.ttl sstim-core-shapes.ttl; do
  curl -sL -O "https://w3id.org/sstim/0.17.0/$f"
done
```

The current release, its DOI and its module list are derived rather than
restated here. Read them from [`void.ttl`](../static/ontology/void.ttl) and
[`manifest.json`](../static/ontology/manifest.json), or from the citation
metadata in [`CITATION.cff`](../CITATION.cff).

Do not reconstruct a profile from a directory listing. `manifest.json` declares
each profile's modules, its direct and transitive dependencies, its named
graphs and the shape modules that apply, and it is the authoritative answer.

Content negotiation works too: `https://w3id.org/sstim` with
`Accept: application/ld+json` returns JSON-LD, and the profile entry points
resolve at `https://w3id.org/sstim/profile/{kernel,core,core-plus,full}`.

## 4. Start from an example, not from the specification

[`examples/`](../examples/) holds four short files that are meant to be copied.
They are checked on every build against the profile each one declares, so they
cannot drift into describing a version of SSTIM that no longer exists.

| File | Profile | Shows |
|---|---|---|
| [`01-stimulus-core.ttl`](../examples/01-stimulus-core.ttl) | Core | One signal rendered through two channels, asserted to be the same signal |
| [`02-stimulus-core-plus.ttl`](../examples/02-stimulus-core-plus.ttl) | Core Plus | The same file plus a frequency extent. Diff them to see a profile boundary |
| [`03-protocol-full.ttl`](../examples/03-protocol-full.ttl) | Full | Your own framework, a published technique |
| [`04-session-full.ttl`](../examples/04-session-full.ttl) | Full | Configuration, plan and execution kept apart |

## 5. Change the namespace. This is the rule that matters

Every example uses `https://example.org/stimuli/`. Replace it with a namespace
you control, and leave every `sstim:` term exactly as it is.

```turtle
@prefix ex: <https://your-lab.example/stimuli/> .    # yours: records, protocols, sessions
@prefix sstim: <https://w3id.org/sstim#> .           # ours: classes and properties, reused
```

**Never mint an IRI under `https://w3id.org/sstim`.** Your file will look fine
and validate cleanly, and it will collide with a real term the day SSTIM
defines that name. The same applies to `sstim-v:` concepts: if you need a
technique or a band that does not exist, do not invent one in our namespace.
Check first, then ask.

Before concluding that a term is missing, grep the generated
[term index](ontology/TERM_INDEX.md). It covers every class, property and
concept across all modules, which is more than anyone searches reliably by
hand. If you have a checkout, `python3 scripts/locate-iri.py sstim:composedOfTrack`
answers the same question across every place an SSTIM identifier can live.

## 6. Validate before you publish

The short way, using the client in [`packages/sstim`](../packages/sstim/). It
resolves the current release for you, checksum-verifies every module it
fetches, and runs three checks rather than one:

```bash
pip install sstim
sstim validate my-stimulus.ttl --profile core
```

```
my-stimulus.ttl
  profile core at https://w3id.org/sstim/0.17.0
  ok     SHACL conformance
  ok     every SSTIM term is defined in the core closure
  ok     nothing minted under https://w3id.org/sstim
```

The long way, with nothing installed but `pyshacl` and the files from step 3:

```bash
cat sstim-core.ttl sstim-stimulus.ttl my-stimulus.ttl > merged.ttl
pyshacl -s sstim-core-shapes.ttl merged.ttl
# Conforms: True
```

Either way, validate against the shapes of the profile you claim, not against
Full. Full shapes on Core data hides the one question a profile claim raises,
which is whether the file really fits inside the closure a consumer will load.

The long way checks conformance only. The two checks it cannot make are the
reason the client exists: **SHACL is silent about a term it has never heard
of**, so a file that reaches into a module your profile does not contain
validates perfectly and breaks in somebody else's pipeline.

Conformance here means the file is well formed against the model. It is not a
statement that the stimulation is safe, effective, or ethically approved. Those
are different reviews and SSTIM does not perform them.

## 7. Publish so the description survives

Record the profile and version IRI you validated against, the source of your
data, and who made it. A description that cannot be traced to a version of the
model is hard to re-validate later and easy to misread.

If your work is citable, cite the release you pinned. The concept DOI covers
all versions; each release has its own.

---

## What is not here yet

Stated plainly, because finding out by trying is worse:

- **No JavaScript client.** The Python client is on PyPI as
  [`sstim`](https://pypi.org/project/sstim/); there is no npm equivalent, so a
  browser or Node consumer validates by other means.
- **No hosted SPARQL endpoint.** Query in-process, or load the artifacts into
  your own store. The knowledge browser runs its queries in the browser.
- **No conformance badge or claims registry.** You can validate; there is no
  published way yet to register that you did.
- **No turnkey HED, BIDS or NWB export.** A bounded crosswalk exists and is
  documented in [HED_BIDS_INTEROP.md](ecosystem/HED_BIDS_INTEROP.md); it is not
  a finished binding.

These are tracked in [ADOPTION.md](ecosystem/ADOPTION.md), which also records
what would have to be true for each one to be worth building.

## Questions, corrections, and terms we are missing

Open an issue on the repository, or bring it to the W3C Sensory Stimulation
Vocabulary Community Group. A term you need and cannot find is the single most
useful thing you can report: SSTIM has one author's blind spots in it, and the
fastest way to find them is somebody else's protocol.

See also [CONTRIBUTING.md](../CONTRIBUTING.md), and
[CURRENT_STATE.md](ontology/CURRENT_STATE.md) for what the model contains right
now.
