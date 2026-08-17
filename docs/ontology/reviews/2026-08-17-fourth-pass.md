# Fourth-pass review — 2026-08-17

**Status:** findings only, nothing fixed.
**Companions:** [first](2026-08-17-ontology-vocabulary-and-data-review.md)
(absence), [second](2026-08-17-second-pass.md) (incoherence),
[third](2026-08-17-third-pass.md) (soundness). None repeated here.

The first three passes examined the ontology. This one examines **what produces
and what verifies it** — the runtime code that emits RDF, and the gates that
check everything else. The ontology can be perfect and still be wrong in the
graphs users actually download.

---

## 1. An Absolute Invariant has no test

CLAUDE.md §5.5 states that annotation data lives in named graphs and never in
the default graph, because the default graph holds authoritative ontology data.
§8 lists "Merge annotation data into the default RDF graph" among the things
that are never done under any circumstances.

`src/rdf/annotations/annotationRdf.js` emits eight quads and has **no test file
beside it at all** — not a SHACL test, not a unit test. Searching the annotation
tests for the named-graph rule returns nothing.

So one of the repository's stated invariants is enforced by nobody. A refactor
that swapped `addQuad(s, p, o, graph)` for `addQuad(s, p, o)` would pass
`make test`, `make check` and `make validate`, and would silently merge user
annotations into the authoritative graph — which is precisely the failure the
invariant exists to prevent, and one that is very hard to notice after the fact.

This is the single most actionable finding across four passes: it is cheap to
close, it protects a stated invariant, and nothing else covers it.

---

## 2. Four of six runtime RDF emitters are unverified

| Emitter | SHACL test | Any test |
|---|---|---|
| `src/session/sessionProjection.js` | yes | yes |
| `src/ui/field/exposureProfile.js` | yes | yes |
| `src/ui/creator/semantic.js` | **no** | yes |
| `src/ui/field/fieldSemantic.js` | **no** | **no** |
| `src/rdf/annotations/annotationRdf.js` | **no** | **no** |
| `src/rdf/loader.js` | **no** | — (loads rather than emits) |

CLAUDE.md's planning principle 4 says *"Runtime RDF is a product surface. Every
downloadable or publishable graph must be tested, not just the hand-curated
fixture that resembles it."* Two of the five emitters honour that.

Note the shape of what is covered: the two tested emitters are the two whose
ADRs (0027 for the Sensory Field exporter, 0048 for the session projection)
explicitly required conformance tests. Coverage tracks which ADR demanded it,
not which surface is riskiest.

---

## 3. Phase 0.1 was never completed, and a finding is recorded as closed in it

Improvement plan **0.1 Runtime RDF conformance** carries five bullets, none
marked done, and its Gate P0-A reads *"every public/downloadable runtime graph
passes its applicable SHACL profile, local-IRI resolution, and graph-specific
golden assertions."* Section 2 above is that gate, unmet.

Meanwhile the audit-coverage table records **KR-01 as resolved in 0.1**. It is
resolved for `exposureProfile.js`, the file the audit named. `fieldSemantic.js`
— also Sensory Field — has no test of any kind.

So a phase that was never completed is carrying a finding recorded as closed,
and the compression pass I did on this document two days ago left 0.1 untouched
precisely *because* it had no completion marker. That was the right call for the
wrong reason: I read "no marker" as "still open and unchanged" rather than
noticing that a finding inside it had been marked resolved on partial evidence.

---

## 4. Seven verification scripts have no visible emptiness guard

Scanning all 26 gate scripts for a guard against examining nothing: every Python
script has one. Seven JavaScript gates do not obviously:
`check-w3id-route-targets.mjs`, `release-dryrun.mjs`, `session-contract.mjs`,
`sstim-w3id-snapshot-routes.mjs`, `verify-snapshot-checksums.mjs`,
`w3id-negotiation.mjs`, `gen-ambiences.mjs`.

**This finding is weaker than it looks and I am flagging it as such.** The scan
was a regular expression, and its iteration test was written for Python syntax,
so it cannot see JavaScript loops. The seven may all be guarded. What is true is
that nobody has checked, and this repository has shipped two vacuous gates
before — `make shacl-session-projection` once passed while validating an empty
glob, and a `$(shell)` module list silently emptied twice when manifest
checksums failed.

`verify-snapshot-checksums.mjs` is the one worth checking first: it validates the
13 immutable releases, and a vacuous pass there would mean the frozen artifacts
are unguarded. (The third pass separately confirmed all 118 frozen files parse,
so they are at least intact.)

---

## 5. What came back clean

- **The two seed presets are internally consistent.** `perform-alpha-10-seed`
  targets `alpha-10` and its binaural voice is 200/210 Hz — a 10 Hz beat, which
  matches. `heal-theta-breathing-seed`'s Martigli-Binaural pair is 200/206, a
  6 Hz beat inside theta. The data means what it says.
- **All 13 frozen snapshots parse** (118 files, confirmed in pass three).
- **Every Python gate guards against an empty input set.**

---

## 6. Reading across four passes

The four passes divide cleanly by what they could see:

| Pass | Question | Could a gate have caught it? |
|---|---|---|
| 1 | What is missing? | Yes — and two new gates are now directed |
| 2 | What disagrees with itself? | Yes, mostly |
| 3 | Is the model sound? | **No** — design faults, invisible to lint |
| 4 | Is the model *enforced where it is produced*? | **Partly** — the gap is that gates check committed data, not emitted data |

Passes 3 and 4 are the ones that matter most, and neither is closable by adding
a lint. Pass 3's answer was to exercise a term set with real data before
accepting its ADR. Pass 4's is narrower and more concrete: **the verification
effort has gone almost entirely into the committed graph, and the graphs users
actually receive are checked in two places out of five.**

Those are the same gap seen twice — the ontology is verified as a document and
under-verified as a thing that gets produced and consumed. Every gate added in
the last week (`term-index`, `adr-index`, `signal-layer`, `preset-contract`,
`public-claim-gate`) checks the document. None checks an emitter.
