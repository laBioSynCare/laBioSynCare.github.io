# sstim

Validate sensory-stimulation descriptions against a published
[SSTIM](https://w3id.org/sstim) profile.

SSTIM is an open standard for describing what a stimulus actually is: signals,
channels, renderings, techniques, protocols, sessions, exposure and evidence.
This package is a client for it. The ontology, its SHACL shapes and its profiles
are published independently, and this code only reads them.

```bash
npm install sstim
npx sstim validate my-stimulus.ttl --profile core
```

```
my-stimulus.ttl
  profile core at https://w3id.org/sstim/0.17.0
  ok     SHACL conformance
  ok     every SSTIM term is defined in the core closure
  ok     nothing minted under https://w3id.org/sstim
```

## Three checks, not one

SHACL conformance on its own does not tell you your file is right, for a reason
that catches everyone once: **SHACL is silent about a term it has never heard
of.** Misspell a property, or reach for one from a module your profile does not
contain, and the shapes have nothing to say. Your file validates. A consumer
loading that profile then meets a predicate it cannot interpret, and your
mistake surfaces in their pipeline instead of yours.

1. **Conformance** against the shapes of the profile you named, not the largest
   one available.
2. **Containment**: every SSTIM term you used is defined inside that profile's
   closure.
3. **Namespace discipline**: you have not minted anything under
   `https://w3id.org/sstim`. Reuse their terms; mint your records in your own
   namespace.

## One limitation, reported rather than hidden

`rdf-validate-shacl` has no SPARQL constraint component, so `sh:sparql`
constraints cannot be evaluated in JavaScript.

- **Kernel, Core and Core Plus** shape graphs contain none. Results are exactly
  what pySHACL would produce.
- **Full** contains many. This client removes them, counts them, and marks the
  result `PARTIAL` with the number, so a Full result is never presented as
  equivalent:

```
  PARTIAL  69 sh:sparql constraint(s) were not evaluated: this runtime has no
           SPARQL constraint component.
           For a complete Full-profile check use the Python client
           (pip install sstim) or pySHACL.
```

`report.partial` and `report.unevaluated` expose the same fact programmatically.

## Profiles

Take the smallest one that carries what you actually assert. Moving up later is
additive, so starting small costs nothing.

| Profile | What it adds |
|---|---|
| `kernel` | Two process anchors. A discovery entry point, with no shapes |
| `core` | Engine-independent stimulus description: signals, channels, renderings |
| `core-plus` | Reusable descriptors and calibrated quantities, including frequency extents |
| `full` | Techniques, protocols, configurations, sessions, evidence, exposure, vocabulary |

```bash
npx sstim profiles                   # what a release offers
npx sstim modules --profile full     # what that profile pulls in, and from where
```

## Versions are resolved, not guessed

With no `--version`, the newest **frozen release** is resolved by reading
`owl:versionIRI` from the stable IRI. This matters more than it looks: the
manifest served at `https://w3id.org/sstim/manifest` is the *development* line,
so code that fetches it and believes it pinned something has pinned nothing.

```bash
npx sstim validate my.ttl --profile core --version 0.17.0
```

Every module a manifest lists carries a sha256, and the served bytes are checked
against it before anything is parsed. A truncated download or a substituted file
stops the run rather than quietly validating your data against a graph that is
not SSTIM. Verified modules are cached by checksum in Node, so repeated runs are
offline and a cache entry can never be stale.

## As a library

```js
import { validate, resolveProfile } from 'sstim'

const report = await validate('my-stimulus.ttl', { profile: 'core' })
if (!report.ok) console.log(String(report))

// Resolve once, validate many
const closure = await resolveProfile('full', { version: '0.17.0' })
closure.versionIri                       // 'https://w3id.org/sstim/0.17.0'
closure.semanticModules.map(m => m.id)
const reports = await Promise.all(files.map(f => validate(f, { closure })))
```

It runs in the browser too: pass Turtle text rather than a path, and caching is
skipped where there is no filesystem. `manifest` resolves from a local checkout
or a frozen release directory instead, which needs no network at all.

## What this does not do

It does not tell you a stimulation is safe, effective, or ethically approved.
Conformance means a file is well formed against the model. Those are different
reviews, and SSTIM does not perform them.

## More

- [Adopting SSTIM](https://github.com/laBioSynCare/laBioSynCare.github.io/blob/main/docs/ADOPTING_SSTIM.md),
  the half-hour on-ramp
- [Starter examples](https://github.com/laBioSynCare/laBioSynCare.github.io/tree/main/examples)
- [`sstim` on PyPI](https://pypi.org/project/sstim/), the Python client, which
  has no SPARQL-constraint limitation
- [The ontology](https://w3id.org/sstim)

Apache-2.0. SSTIM itself is CC BY 4.0.
