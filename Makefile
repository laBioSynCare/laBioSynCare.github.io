# pyshacl console script: provided by the Nix flake (top-level `pyshacl`) and by
# `pip install pyshacl`. Override with `make PYSHACL='python3 -m pyshacl'` if needed.
# ROBOT is provided by the Nix flake. Override with `ROBOT='java -jar /path/to/robot.jar'`.
PYSHACL    ?= pyshacl
ROBOT      ?= robot
REASONER   ?= hermit
PYTHON     ?= python3
EXPORT_DIR ?= dist/ontology
WIDOCO     ?= widoco
DOCS_DIR   ?= dist/ontology/docs
WIDOCO_CONF := docs/ontology/widoco.properties
PYLODE     ?= pylode
VOCAB_DOCS_DIR ?= dist/ontology/docs/vocab
WAT2WASM   ?= wat2wasm
FIREBASE   ?= npx firebase-tools
FIREBASE_PROJECT ?= biosyncare-lab
WORKLET_DIR := static/worklets
WASM_WAT   := $(WORKLET_DIR)/bsc-osc.wat
WASM_OUT   := $(WORKLET_DIR)/bsc-osc.wasm
SHAPES     := static/ontology/sstim-shapes.ttl
CORE_SHAPES := static/ontology/sstim-core-shapes.ttl
VOCAB      := static/ontology/sstim-vocab.ttl
ALIGNMENTS := static/ontology/sstim-alignments.ttl
EXPOSURE   := static/ontology/sstim-exposure.ttl
PATCH_STUDIO := static/ontology/sstim-patch-studio.ttl
STIMULUS   := static/ontology/sstim-stimulus.ttl
ECOSYSTEM  := static/ontology/sstim-ecosystem.ttl
PRIVATE_ECOSYSTEM_SHAPES := static/ontology/sstim-ecosystem-private-shapes.ttl
PRIVATE_ECOSYSTEM_FIXTURE := test/fixtures/rdf/ecosystem-private/synthetic-terminal-ledger.ttl
PUBLIC_ECOSYSTEM ?=
PRIVATE_LEDGER ?=
PUBLIC_ECOSYSTEM_ARG = $(if $(strip $(PUBLIC_ECOSYSTEM)),--public-candidate "$(PUBLIC_ECOSYSTEM)",)
PRIVATE_LEDGER_ARG = $(if $(strip $(PRIVATE_LEDGER)),--private-ledger "$(PRIVATE_LEDGER)",)
SHACL_WORKERS ?=
SHACL_WORKERS_ARG = $(if $(strip $(SHACL_WORKERS)),--shacl-workers "$(SHACL_WORKERS)",)
MANIFEST := static/ontology/manifest.json
MANIFEST_CLI := node scripts/sstim-manifest.mjs
CORE_PROFILE_MODULES := $(shell $(MANIFEST_CLI) files core)
FULL_SEMANTIC_MODULES := $(shell $(MANIFEST_CLI) files full)
ONTOLOGY_MODULES := $(shell $(MANIFEST_CLI) files full --with-shapes)
# BioPortal ingests a single root file and does not follow dct:isPartOf, so the
# browsable term modules are merged into one OWL file. SHACL shapes are excluded
# (validation constraints, not browsable terms). The RDF closure is unioned
# before OWL translation, and the bundle is explicitly assigned the root IRI.
#
# **Built from the frozen release, not from the live line.** BioPortal and OLS4
# pull https://labiosyncare.github.io/ontology/sstim-full.owl nightly, and CI
# regenerates it on every push to main — so building it from the working sources
# fed the registries a development snapshot every night. BioPortal's submission
# history is a list of them: 0.15.0-dev, 0.16.0-dev, 0.17.0-dev, each parsed and
# indexed, its "Version information" reading a mutable line that no one can cite,
# and its Version IRI stuck at 0.14.0 because a -dev bundle correctly carries
# none and BioPortal kept the last one it saw.
#
# A stable URL a registry polls is a promise about the current *release*. The
# released version is read from void.ttl, which is the file that defines what is
# citable, and the modules come from that version's frozen directory — so this
# artifact changes only when a release is cut.
BIOPORTAL_RELEASE := $(shell $(PYTHON) -c "import re,pathlib;print(re.search(r'dcat:version\s+\"([^\"]+)\"',pathlib.Path('static/ontology/void.ttl').read_text()).group(1))")
BIOPORTAL_SNAPSHOT := static/ontology/$(BIOPORTAL_RELEASE)
BIOPORTAL_MODULES := $(shell node -e 'const m=require("./$(BIOPORTAL_SNAPSHOT)/manifest.json");const p=m.profiles.find(x=>x.id==="full");const by=Object.fromEntries(m.modules.map(x=>[x.id,x.source.path.split("/").pop()]));process.stdout.write(p.modules.map(id=>"$(BIOPORTAL_SNAPSHOT)/"+by[id]).join(" "))')
BIOPORTAL_OUT ?= dist/ontology/sstim-full.owl
INSTANCE_ROOT := static/ontology/instances
INSTANCE_FILES := $(sort $(wildcard $(INSTANCE_ROOT)/*/*.ttl) $(wildcard $(INSTANCE_ROOT)/*/*/*.ttl))
DEV_HOST   ?= 127.0.0.1
DEV_PORT   ?= 4173
PREVIEW_HOST ?= $(DEV_HOST)
PREVIEW_PORT ?= 4174
DEPLOY_URL   ?= https://labiosyncare.github.io

.PHONY: build check migrate-test session-conformance truth-audit verify-deploy deploy-firestore-rules dev ecosystem-contract ecosystem-publish export export-check context-roundtrip verify-snapshots bioportal-bundle ontology-docs vocab-docs preview quality-audit reason shacl shacl-core shacl-vocab shacl-exposure shacl-modules shacl-instances shacl-private-ecosystem shacl-session-negative shacl-session-projection shacl-public-claim-gate entailment-check validate-profile preset-contract term-index term-index-check adr-index definition-coverage language-coverage hed-crosswalk hed-bundle hed-bundle-check hed-roundtrip registry-verify signal-layer sparql-sanity snapshot test validate wasm help manifest-check module-boundaries core-profile-contract full-equivalence w3id-routes release-dryrun

## Build the production bundle
build:
	npm run build

## Run SvelteKit sync and static checks
check:
	npm run check

## Prove a person can leave one instance and arrive at another intact: serves
## the build on two ports (two origins, so genuinely separate localStorage),
## exports everything from A, imports into B under a different account, and
## checks the re-export from B matches A byte-for-byte.
migrate-test:
	node scripts/migration-two-origin.mjs

## Session-interchange conformance: package a patch as a portable scientific
## object on one instance, open it on a second (separate origin), and check
## Level 1 semantic equivalence (identical SSTIM projection and mapping report),
## Level 2 execution-parameter equivalence (no parameter drift, modulation
## intact, re-package byte-identical) and the privacy boundary. Level 3
## (rendered-signal comparison) is declared not attempted.
session-conformance:
	node scripts/session-conformance.mjs

## Assert the repository's prose matches the repository. Derives the release
## version, DOI and module list from manifest.json and void.ttl, then checks the
## release-bearing prose against them: no superseded version, development line
## or DOI advertised as current, and no shipped capability described as future
## work. Also checks that every relative link in every tracked .md resolves.
truth-audit:
	node scripts/truth-audit.mjs

## Assert a deployed instance serves the commit it should. Fetches
## build-info.json from DEPLOY_URL and compares against COMMIT (default: local
## git HEAD). Run against the live site after a deploy, or any self-hosted
## instance. See scripts/gen-build-info.mjs for why this exists.
verify-deploy:
	node scripts/verify-deploy.mjs $(DEPLOY_URL) $(COMMIT)

## Build the static site as an immutable Nix package (result/share/bsc-lab).
## Bit-reproducible: `nix build --rebuild` produces an identical output.
## Deployable as a NixOS module (nixosModules.default) or an OCI image
## (nix build .#oci). See docs/technical/PORTABLE_DEPLOYMENT.md.
package:
	nix build
	@echo "package: result/share/bsc-lab — serve with any static web server"

## Build with NO Firebase configuration and prove the result is a working,
## credential-free static deployment.
##
## BSC_ENV_DIR points Vite at an empty directory: Vite loads the project-root
## .env in every mode, so merely unsetting VITE_FIREBASE_* still inlines a
## developer's local key and the test would pass while proving nothing.
##
## Note this rebuilds dist/ without credentials, then moves it to dist-smoke/.
## Run `make build` afterwards if you need a configured dist/ back.
smoke-static:
	@rm -rf dist-smoke
	@tmp=$$(mktemp -d); \
		BSC_ENV_DIR=$$tmp npm run build >/dev/null; \
		status=$$?; rmdir $$tmp; \
		[ $$status -eq 0 ] || exit $$status
	@mv dist dist-smoke
	@node scripts/smoke-static.mjs dist-smoke

## Start the local Vite dev server on the standard host/port
dev:
	npm run dev -- --host $(DEV_HOST) --port $(DEV_PORT)

## Deploy Firestore security rules to the configured Firebase project
deploy-firestore-rules:
	$(FIREBASE) deploy --project $(FIREBASE_PROJECT) --only firestore:rules

## Preview the production build on a stable local host/port
preview: build
	npm run preview -- --host $(PREVIEW_HOST) --port $(PREVIEW_PORT)

## Validate core ontology against shapes
shacl-core:
	@tmp="$$(mktemp)"; \
	trap 'rm -f "$$tmp"' EXIT; \
	cat $(CORE_PROFILE_MODULES) > "$$tmp"; \
	$(PYSHACL) -s $(CORE_SHAPES) "$$tmp"

## Validate the vocabulary against shapes, in its dependency closure.
## ADR 0034: technique identity/type is vocabulary-owned while characteristic
## delivery media are exposure-owned, so the vocabulary cannot be validated in
## isolation. The manifest-defined Full semantic closure supplies every direct
## and transitive dependency; `shacl-modules` remains the whole-set authority.
shacl-vocab:
	@tmp="$$(mktemp)"; \
	trap 'rm -f "$$tmp"' EXIT; \
	cat $(FULL_SEMANTIC_MODULES) > "$$tmp"; \
	$(PYSHACL) -s $(SHAPES) "$$tmp"

## Validate Exposure constraints in the manifest-defined Full closure
shacl-exposure:
	@tmp="$$(mktemp)"; \
	trap 'rm -f "$$tmp"' EXIT; \
	cat $(FULL_SEMANTIC_MODULES) > "$$tmp"; \
	$(PYSHACL) -s $(SHAPES) "$$tmp"

## Validate the complete ontology module set, including module metadata
shacl-modules:
	@tmp="$$(mktemp)"; \
	trap 'rm -f "$$tmp"' EXIT; \
	cat $(ONTOLOGY_MODULES) > "$$tmp"; \
	$(PYSHACL) -s $(SHAPES) "$$tmp"

## Validate RDF instances against shapes with ontology + vocabulary context
shacl-instances:
	@if [ -z "$(strip $(INSTANCE_FILES))" ]; then \
		echo "shacl-instances: skipped ($(INSTANCE_ROOT) has no .ttl instances)"; \
	else \
		tmp="$$(mktemp)"; \
		trap 'rm -f "$$tmp"' EXIT; \
		cat $(FULL_SEMANTIC_MODULES) $(INSTANCE_FILES) > "$$tmp"; \
		$(PYSHACL) -s $(SHAPES) "$$tmp"; \
	fi

## Validate the synthetic external/private audit ledger with its separate profile
shacl-private-ecosystem:
	@tmp="$$(mktemp)"; \
	trap 'rm -f "$$tmp"' EXIT; \
	cat $(FULL_SEMANTIC_MODULES) $(PRIVATE_ECOSYSTEM_FIXTURE) > "$$tmp"; \
	$(PYSHACL) -s $(PRIVATE_ECOSYSTEM_SHAPES) -i rdfs "$$tmp"

## Assert the session SHACL-SPARQL constraints reject what they claim to. The
## positive suites only prove conforming data conforms, and rdf-validate-shacl
## strips sh:sparql — so without this a broken constraint would pass everything.
shacl-session-negative:
	$(PYTHON) scripts/session-shapes-negative.py

## Assert every clause of the public-claim applicability contract is
## load-bearing (KR-04, ADR 0050). The gate is a conjunction of eight clauses
## and no committed preset sits above C1, so it never fires on real data: a
## clause deleted by a careless edit would be invisible to every other check.
shacl-public-claim-gate:
	$(PYTHON) scripts/public-claim-gate-negative.py

## Validate the RDF the session projection actually emits, with SHACL-SPARQL
## active. The vitest harness beside the producer strips sh:sparql and
## shacl-instances only covers committed files, so without this the projection's
## output is never checked against the cross-field constraints — which is how a
## rounding bug put delivered duration above elapsed duration and passed.
shacl-session-projection:
	@set -e; \
	tmpdir="$$(mktemp -d)"; \
	trap 'rm -rf "$$tmpdir"' EXIT; \
	node scripts/session-projection-emit.mjs "$$tmpdir/graphs"; \
	count=0; \
	for graph in "$$tmpdir"/graphs/*.ttl; do \
		[ -f "$$graph" ] || continue; \
		cat $(FULL_SEMANTIC_MODULES) "$$graph" > "$$tmpdir/merged.ttl"; \
		$(PYSHACL) -s $(SHAPES) "$$tmpdir/merged.ttl" | grep -q "Conforms: True" \
			|| { echo "FAILED: $$(basename "$$graph")"; $(PYSHACL) -s $(SHAPES) "$$tmpdir/merged.ttl"; exit 1; }; \
		count=$$((count + 1)); \
	done; \
	if [ "$$count" -eq 0 ]; then \
		echo "shacl-session-projection: FAILED — no projected graphs to validate"; \
		exit 1; \
	fi; \
	echo "shacl-session-projection: passed ($$count projected graphs conform)"

## Assert no frequency band claims an outcome, and that every association ADR
## 0049 moved off the band scope notes is still recorded on its oscillation —
## as an evidence claim with a tier or a dated knowledge-status assertion. Two
## checks in opposite directions: the first stops a Hz interval claiming to
## relax anyone, the second stops the repair becoming a deletion.
band-scope-notes:
	$(PYTHON) scripts/check-band-scope-notes.py

## Test that the declared loss in the HED bundles is real and exactly as
## declared (ADR 0025 decision 7). Both bundles are reversed — an artifact
## nobody round-tripped is the unexercised case this gate exists to prevent. Documenting loss in a manifest is not a test:
## a manifest can claim loss that does not exist, or miss loss that does, and a
## consumer then trusts a sentence rather than a property. Reverses every emitted
## HED string through the crosswalk and asserts soundness, that every ambiguous
## row declares it, and — the direction nobody checks — that no unique mapping
## claims a collision, since overclaimed loss reads as caution and is still wrong.
hed-roundtrip:
	$(PYTHON) scripts/check-hed-roundtrip.py

## Generate the ADR 0025 demonstrators: two synthetic native+HED conformance
## bundles. Each reads a session fixture, walks its event timeline on the session
## clock, and emits a BIDS-style events.tsv with a HED column, its sidecar, and a
## manifest carrying artifact hashes, pinned versions, cross-artifact ids, the
## clock assumption, and what the HED column cannot carry. Loss is a first-class
## output: eventSessionComplete and eventSessionInterrupt emit identical HED
## because 8.4.0 has no Incomplete tag, so the manifest says a consumer reading
## the table alone cannot tell a finished session from an abandoned one.
##
## One bundle per stimulus shape decision 5 names, because one bundle could only
## ever test the easiest of them:
##
##   test/fixtures/hed-bundle             fixed; events are the whole story
##   test/fixtures/hed-bundle-segmented   stepped; piecewise events, each carrying
##                                        its parameter kind and new value
##   test/fixtures/hed-bundle-modulated   continuous; a Martigli breathing period
##                                        gliding mp0 to mp1, carrying a linked trace
##
## Decision 5 forbids flattening a time-varying stimulus "into a misleading
## single row" and allows either piecewise events or a linked trace. Both are
## now available: sstim-v:eventParameterChanged and the parameter-kind scheme
## landed 2026-08-18, and before that a sstim:SessionEvent could carry only its
## type and its clock offset. Which one applies is not a preference — a discrete
## change the specification does not contain is an event, a modulation it
## declares in full stays declarative and is rendered. The generator refuses to
## write a continuously modulated bundle without a trace.
##
## The trace runs on delivered time: the breathing arc advances only while audio
## is playing, so the pause at 190 s displaces every later sample, and samples
## inside the pause are n/a rather than interpolated. Writing a value there would
## assert an exposure that did not happen.
hed-bundle:
	$(PYTHON) scripts/generate-hed-bundle.py

## Assert the committed bundles match what the generator produces now, and are
## correct as well as current. Same regenerate-and-compare pattern as
## term-index-check, plus the content checks decision 7 asks for: emitted HED
## revalidates, every event_id resolves to a sstim:SessionEvent in the source
## graph, each source conforms to the Full-profile shapes, and each trace agrees
## with its own events.tsv about when delivery was open.
##
## Staleness and correctness are checked independently, against the freshly
## regenerated copy. They were not at first, and the semantic checks sat behind
## the byte comparison where they could never fire: a generator that stopped
## emitting traces reported "bundle-manifest.json is stale" and never said that
## it had flattened a time-varying stimulus.
##
## The SHACL pass validates every source in one run over their union, because
## parsing the sixteen Full modules per bundle cost ~8s each and this runs in CI
## on every push; a failure re-validates each source alone to attribute it. Pass
## --no-shacl to skip it entirely while iterating.
hed-bundle-check:
	$(PYTHON) scripts/generate-hed-bundle.py --check

## Validate the SSTIM to HED crosswalk with hedtools against the pinned schema
## (ADR 0025 decision 7). HED is a generated profile, not primary storage, so the
## mapping table is the part that rots silently.
##
## This replaced a regex that only checked whether each tag name appeared in the
## schema XML, and the replacement paid for itself immediately: every temporal
## mapping in crosswalk 0.1.0 was invalid HED. Onset, Offset, Pause and Inset are
## scope tags requiring exactly one paired Def/, and the map wrote them bare. All
## those tags exist, so the regex passed a string that would never have validated
## anywhere — a confident wrong answer, which is worse than no check.
##
## Also asserts the map covers SessionEventTypeScheme exactly, and that any two
## event types emitting identical HED both declare what a HED-only consumer
## loses. See hed-roundtrip for whether those declarations are true.
##
## Finally it checks the prose that restates these counts. Crosswalk 0.2.0 took
## the lossy count from six to five and three sentences kept saying six, so the
## numbers the ADR and the generator quote are now compared against the map. A
## pattern that matches nothing fails too — a check that stopped looking is not
## a check that passed.
hed-crosswalk:
	$(PYTHON) scripts/check-hed-crosswalk.py

## Measure what the public registries actually say about SSTIM. NETWORK, opt-in,
## and deliberately NOT part of `make validate` — every other gate here is
## offline and deterministic, and this one would fail on a third party's outage.
##
## It exists because the registry tracker records *external* state, which rots
## with nothing noticing. prefix.cc had served `sstim -> https://w3id.org/sstim/`
## since before 2026-07-11 while the ontology declares `https://w3id.org/sstim#`
## and the tracker said so and marked it DONE. Every term IRI built from that
## prefix is a 404. Nobody had fetched it, partly because prefix.cc's TLS
## certificate expired 2025-12-31 and the ordinary https check dies first.
##
## Reports three states, not two: an unreachable registry is INCOMPLETE, never
## absence, and does not set the exit status (CLAUDE.md §3.6).
registry-verify:
	$(PYTHON) scripts/verify-registries.py

## Measure multilingual coverage per scheme and refuse to let it drift. SSTIM
## advertises four languages in BARTOC, FAIRsharing and every module title; when
## first measured, 269 of 545 concepts carried all four and 276 carried English
## alone. The useful shape is that no scheme is *partially* translated, so the
## gate locks that property in, requires any new scheme to ship translated, and
## keeps the list of English-only schemes honest in both directions — a scheme
## that gets translated must leave the list. Closes the metric gap KR-16 was
## missing.
##
## It also *reports* skos:altLabel coverage without gating it: how many aliases a
## concept deserves is an ontology decision, not this gate's. It is printed
## because nothing measured it, and four documents consequently stated that alias
## coverage was zero while fifteen aliases sat in the graph.
language-coverage:
	$(PYTHON) scripts/sstim-language-coverage.py

## Assert every profile closure is in OWL 2 DL, which is a different question
## from `make reason` and one that gate cannot answer. ROBOT loads non-strictly,
## so an undeclared annotation property is silently coerced into one and HermiT
## is handed a well-formed DL ontology — it passed for months while the
## published artifact was OWL Full with 5935 profile violations. A consumer's
## reasoner sees the profile, not our loader's repairs, and so does DBpedia
## Archivo, whose fourth star is exactly "loading this ontology into a reasoner
## has a high chance of succeeding". Checks all four closures, because a
## violation can hide in a module the Full profile includes and Kernel does not.
validate-profile:
	@set -e; \
	tmpdir="$$(mktemp -d)"; \
	trap 'rm -rf "$$tmpdir"' EXIT; \
	for profile in kernel core core-plus full; do \
		$(MANIFEST_CLI) files $$profile | tr '\n' ' ' | xargs cat > "$$tmpdir/$$profile.ttl"; \
		if ! $(ROBOT) validate-profile --input "$$tmpdir/$$profile.ttl" \
			--profile DL --output "$$tmpdir/$$profile-report.txt" \
			> "$$tmpdir/robot.log" 2>&1; then \
			echo "validate-profile: $$profile closure is NOT in OWL 2 DL" >&2; \
			sed -n '1,40p' "$$tmpdir/$$profile-report.txt" >&2; \
			exit 1; \
		fi; \
		echo "validate-profile: $$profile closure in OWL 2 DL"; \
	done

## Assert the repaired OWL domains infer no unintended type (KR-05). The audit's
## concern was that a domain is an inference rule, not a validation hint: a
## property typed to one class makes every subject using it a member of that
## class. The repair was union domains, which entail membership in an anonymous
## union and therefore nothing named — but only a reasoner can show that, and
## only a fixture keeps it true. Materializes class assertions with HermiT over
## the Full closure plus every committed instance, then fails if any query
## returns a row.
entailment-check:
	@set -e; \
	tmpdir="$$(mktemp -d)"; \
	trap 'rm -rf "$$tmpdir"' EXIT; \
	queries="$$(ls test/entailment/*.rq 2>/dev/null)"; \
	if [ -z "$$queries" ]; then echo "entailment-check: no queries found" >&2; exit 1; fi; \
	if [ $(words $(FULL_SEMANTIC_MODULES)) -eq 0 ]; then \
		echo "entailment-check: no modules — the manifest query failed, and reasoning over instances alone infers nothing and passes" >&2; \
		exit 1; \
	fi; \
	cat $(FULL_SEMANTIC_MODULES) $(INSTANCE_FILES) > "$$tmpdir/merged.ttl"; \
	$(ROBOT) reason --input "$$tmpdir/merged.ttl" --reasoner $(REASONER) \
		--axiom-generators "ClassAssertion" --output "$$tmpdir/reasoned.owl" > "$$tmpdir/robot.log" 2>&1 \
		|| { cat "$$tmpdir/robot.log"; exit 1; }; \
	failed=0; count=0; \
	for q in $$queries; do \
		$(ROBOT) query --input "$$tmpdir/reasoned.owl" --query "$$q" "$$tmpdir/out.csv" > /dev/null 2>&1; \
		rows=$$(($$(wc -l < "$$tmpdir/out.csv") - 1)); \
		count=$$((count + 1)); \
		if [ "$$rows" -gt 0 ]; then \
			echo "entailment-check: FAILED $$(basename $$q) — $$rows unintended entailment(s)" >&2; \
			cat "$$tmpdir/out.csv" >&2; \
			failed=1; \
		fi; \
	done; \
	[ "$$failed" -eq 0 ] || exit 1; \
	echo "entailment-check: passed ($$count queries, no unintended type inferred)"

## Run all SHACL validations
shacl: shacl-core shacl-vocab shacl-exposure shacl-modules shacl-instances shacl-private-ecosystem shacl-session-negative shacl-session-projection shacl-public-claim-gate

## Run ROBOT OWL DL consistency over the merged ontology term-space modules
reason:
	@set -e; \
	tmpdir="$$(mktemp -d)"; \
	trap 'rm -rf "$$tmpdir"' EXIT; \
	cat $(FULL_SEMANTIC_MODULES) > "$$tmpdir/sstim-full.ttl"; \
	if ! $(ROBOT) reason --input "$$tmpdir/sstim-full.ttl" \
		--reasoner $(REASONER) --output "$$tmpdir/sstim-reasoned.owl" \
		> "$$tmpdir/robot.log" 2>&1; then \
		cat "$$tmpdir/robot.log"; \
		exit 1; \
	fi; \
	cat "$$tmpdir/robot.log"; \
	if grep -Eq 'ERROR org\.obolibrary\.robot\.IOHelper|could not be parsed' "$$tmpdir/robot.log"; then \
		echo "reason: ROBOT discarded input triples" >&2; \
		exit 1; \
	fi; \
	echo "reason: ROBOT $(REASONER) consistency check passed ($(words $(FULL_SEMANTIC_MODULES)) semantic modules)"

## Run ontology SPARQL sanity checks
sparql-sanity:
	node scripts/sstim-exposure-sanity.mjs

## Run repository-wide semantic integrity and competency checks
quality-audit:
	$(PYTHON) scripts/sstim-quality-audit.py

## Prove the qualified ecosystem contract in isolation and at runtime
ecosystem-contract:
	@set -e; \
	if [ "$(PYSHACL)" = "pyshacl" ]; then \
		$(PYTHON) scripts/sstim-ecosystem-contract.py $(SHACL_WORKERS_ARG) $(PUBLIC_ECOSYSTEM_ARG) $(PRIVATE_LEDGER_ARG); \
	else \
		wrapper_dir="$$(mktemp -d)"; \
		trap 'rm -rf "$$wrapper_dir"' EXIT; \
		printf '%s\n' '#!/bin/sh' 'exec $(PYSHACL) "$$@"' > "$$wrapper_dir/pyshacl"; \
		chmod +x "$$wrapper_dir/pyshacl"; \
		PATH="$$wrapper_dir:$$PATH" $(PYTHON) scripts/sstim-ecosystem-contract.py --pyshacl-cli $(SHACL_WORKERS_ARG) $(PUBLIC_ECOSYSTEM_ARG) $(PRIVATE_LEDGER_ARG); \
	fi
	npx vitest run src/rdf/ecosystem-contract.test.mjs

## Validate and activate an external live ecosystem aggregate, private ledger first
ecosystem-publish:
	$(PYTHON) scripts/sstim-ecosystem-publish.py $(PUBLIC_ECOSYSTEM_ARG) $(PRIVATE_LEDGER_ARG) $(if $(DRY_RUN),--dry-run,)

## Freeze the current ontology as an immutable versioned snapshot
## (version defaults to owl:versionInfo in sstim-core.ttl; override: make snapshot VERSION=0.2.0)
## Existing snapshots are protected; overwrite an unpublished one with FORCE=1.
snapshot:
	node scripts/snapshot-ontology.mjs $(VERSION) $(if $(FORCE),--force,) $(if $(RELEASE_DATE),--release-date=$(RELEASE_DATE),)

## Run Vitest
test:
	npm test

## Measure the audio engines in a real browser (BROWSER=chrome|firefox|all, JSON=path)
audio-verify:
	node scripts/audio-verify/run.mjs --browser $(or $(BROWSER),chrome) $(if $(JSON),--json $(JSON),)

## Gate P0-B: the native session bundle validates, its RDF projection accounts
## for every field, only synthetic/public-safe bundles are committed, and the
## round trip preserves ids, event order and hashes. Prints the SSTIM terms the
## projection still needs (`--terms` for the fields wanting each one). SHACL
## conformance of the projected graphs runs beside its producer, under `make test`.
session-contract:
	node scripts/session-contract.mjs

## Assert the SSTIM preset schema, the SHACL shapes and the parameter ranges
## agree, and that each rule is load-bearing (KR-07, ADR 0051). Covers the
## cross-field rules JSON Schema cannot express — beat frequency, pulse rate,
## breath reference, level rationale — which are the application-validation leg.
preset-contract:
	$(PYTHON) scripts/preset-contract.py

## Answer "does SSTIM define this IRI, and where?" across all five places it
## could live -- live modules, committed instances, frozen snapshots, and the
## external live ecosystem store a repository grep structurally cannot see.
## Reports INCOMPLETE rather than "absent" when the live store is unreachable.
##   make locate IRI=sstim:composedOfTrack
locate:
	$(PYTHON) scripts/locate-iri.py $(IRI) $(if $(OFFLINE),--offline,)

## Regenerate the SSTIM term index: every class, property and concept with its
## module and definition, in one greppable file. Grep it before concluding that
## SSTIM lacks a term.
term-index:
	$(PYTHON) scripts/generate-term-index.py

## Fail if the committed term index no longer matches the modules.
term-index-check:
	$(PYTHON) scripts/generate-term-index.py --check

## Assert the ADR index matches the ADR files: every file has a row, every row a
## file, statuses agree, and a superseded decision is marked superseded so the
## index never recommends one that no longer holds.
adr-index:
	$(PYTHON) scripts/check-adr-index.py

## Every published class, property and concept must define itself, and the
## definition must not merely restate the label. Directed after all 17 frequency
## bands were found carrying a scope note and no skos:definition.
definition-coverage:
	$(PYTHON) scripts/sstim-definition-coverage.py

## Assert the ADR 0052 signal layer is present, that widening hzMin/hzMax left
## bands untouched, and that its four constraints reject what they claim to.
signal-layer:
	$(PYTHON) scripts/check-signal-layer.py

## Verify generated JSON-LD and RDF/XML round-trip to the source graphs
export-check:
	@tmpdir="$$(mktemp -d)"; \
	trap 'rm -rf "$$tmpdir"' EXIT; \
	$(PYTHON) scripts/export-ontology.py "$$tmpdir"

## Verify the published context.jsonld round-trips every top-level and instance
## document without triple loss (RDF-02, 2026-07-24 audit) — distinct from
## export-check, which uses RDFLib's own generated context, not context.jsonld.
context-roundtrip:
	$(PYTHON) scripts/context-roundtrip-check.py

## Verify every recorded static/ontology/<version>/ snapshot still matches its
## checksum ledger (RDF-12, 2026-07-24 audit): catches silent drift in an
## already-published, supposedly-immutable snapshot.
verify-snapshots:
	node scripts/verify-snapshot-checksums.mjs

## Validate the canonical module/profile bill of materials and source digests
manifest-check:
	$(PYTHON) scripts/validate-sstim-manifest-schema.py
	$(MANIFEST_CLI) check
	npx vitest run scripts/sstim-manifest.test.mjs

## Prove unique public-resource sources and honest direct dct:requires edges
module-boundaries:
	$(PYTHON) scripts/check-sstim-module-boundaries.py

## Execute the weak Core profile SHACL/fixture/competency-query contract
core-profile-contract:
	$(PYTHON) scripts/sstim-core-profile-contract.py

## Prove Full preserves frozen 0.12 semantics outside recorded migrations
full-equivalence:
	$(PYTHON) scripts/check-sstim-full-equivalence.py

## Check the w3id route contract two ways. First, that the committed .htaccess
## snapshot-route region still matches the frozen snapshots on disk: the unit
## test only regenerates the region in memory, so without this a release that
## forgets `--write` would silently ship without persistent routes for the new
## version. Second, that every /ontology/ redirect target is an artifact this
## repository actually publishes, so a renamed module or a dropped export flag
## cannot turn a persistent identifier into a 404.
w3id-routes:
	node scripts/sstim-w3id-snapshot-routes.mjs --check
	node scripts/check-w3id-route-targets.mjs

## Rehearse the next release against the current sources without cutting one.
## Cutting 0.13.0 was blocked three times by gates that had been wrong for weeks
## and could only be found by pretending to release; nothing did that between
## releases. Cheap half only: manifest preparation, its JSON Schema, and the
## snapshot routes. SHACL and reasoning are covered on the live sources above.
release-dryrun:
	node scripts/release-dryrun.mjs

## Run the current ontology validation suite
## Record that the full suite passed, against which commit and which tree.
## `make validate` runs ~18 minutes, so the expensive mistake is re-running it
## on a tree that has not changed — and the dangerous one is trusting a stamp
## from a tree that has. The tree hash is what distinguishes them.
##
## It must be the WORKING tree, not HEAD's. The first version of this wrote
## `git stash create >/dev/null; git rev-parse HEAD^{tree}`, which discards the
## stash commit and hashes HEAD regardless — so an uncommitted edit to a
## protected ontology module stamped identically to a clean checkout, and
## validate-status answered "no need to re-run" on a tree the suite had never
## seen. That is precisely the failure the stamp exists to prevent, and it was
## live while the pending session-module edit sat in the tree.
##
## `git stash create` writes a commit for the dirty state and prints nothing at
## all when the tree is clean, so the fallback to HEAD is the clean case. It does
## not cover untracked files; a new module that is not yet added is invisible
## here and caught by manifest-check instead, which scans the inventory directory
## rather than the index.
TREE_HASH = tree="$$(git stash create 2>/dev/null)"; \
	git rev-parse "$${tree:-HEAD}^{tree}" 2>/dev/null || echo none
.PHONY: validate-stamp validate-status
validate-stamp:
	@printf '%s  commit=%s  tree=%s  suite=passed\n' \
		"$$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
		"$$(git rev-parse --short HEAD 2>/dev/null || echo none)" \
		"$$($(TREE_HASH))" \
		>> .validation.log
	@echo "validate: recorded in .validation.log"

## When did the full suite last pass, and is this tree still the one it passed on?
validate-status:
	@if [ ! -f .validation.log ]; then echo "validate-status: never recorded"; exit 0; fi
	@last="$$(tail -1 .validation.log)"; \
	echo "last passing run: $$last"; \
	stamped="$$(echo "$$last" | sed -n 's/.*tree=\([0-9a-f]*\).*/\1/p')"; \
	current="$$($(TREE_HASH))"; \
	if [ "$$stamped" = "$$current" ]; then \
		echo "validate-status: this tree is the one that passed — no need to re-run"; \
	else \
		echo "validate-status: the tree has changed since; re-run make validate"; \
	fi

validate: manifest-check module-boundaries core-profile-contract full-equivalence shacl entailment-check validate-profile band-scope-notes ecosystem-contract quality-audit reason sparql-sanity export-check context-roundtrip verify-snapshots session-contract preset-contract term-index-check adr-index definition-coverage language-coverage hed-crosswalk hed-bundle-check hed-roundtrip signal-layer w3id-routes release-dryrun truth-audit validate-stamp

## Generate JSON-LD + RDF/XML serializations of the ontology modules
## (default into dist/ontology/ beside the Turtle masters; override EXPORT_DIR=)
export:
	$(PYTHON) scripts/export-ontology.py $(EXPORT_DIR)

## Merge the manifest-defined Full semantic profile (excluding SHACL shapes)
## into one RDF/XML OWL file for BioPortal ingest.
## Generated into dist/ (deploy artifact only), never committed; override BIOPORTAL_OUT=.
##
## Carries owl:versionIRI only on a released line. `robot annotate --ontology-iri`
## sets the ontology IRI and does not carry the Kernel's version IRI through the
## merge, so every submission since the first has been unversioned — registries
## saw a stream of same-IRI uploads with no immutable version to cite. A -dev
## line still gets none, for the reason ADR 0020 gives: a version IRI names an
## immutable version, and a development line is not one.
bioportal-bundle:
	@set -e; \
	mkdir -p $(dir $(BIOPORTAL_OUT)); \
	tmpdir="$$(mktemp -d)"; \
	trap 'rm -rf "$$tmpdir"' EXIT; \
	if [ $(words $(BIOPORTAL_MODULES)) -eq 0 ]; then \
		echo "bioportal-bundle: no modules — the manifest query failed, and a bundle built from nothing still writes a valid, empty ontology" >&2; \
		exit 1; \
	fi; \
	cat $(BIOPORTAL_MODULES) > "$$tmpdir/sstim-full.ttl"; \
	version_iri="https://w3id.org/sstim/$(BIOPORTAL_RELEASE)"; \
	if ! $(ROBOT) merge --input "$$tmpdir/sstim-full.ttl" \
		annotate --ontology-iri https://w3id.org/sstim --version-iri "$$version_iri" \
		--output $(BIOPORTAL_OUT) > "$$tmpdir/robot.log" 2>&1; then \
		cat "$$tmpdir/robot.log"; \
		exit 1; \
	fi; \
	cat "$$tmpdir/robot.log"; \
	if grep -Eq 'ERROR org\.obolibrary\.robot\.IOHelper|could not be parsed' "$$tmpdir/robot.log"; then \
		echo "bioportal-bundle: ROBOT discarded input triples" >&2; \
		exit 1; \
	fi; \
	test -s $(BIOPORTAL_OUT); \
	if ! grep -q "versionIRI" $(BIOPORTAL_OUT); then \
		echo "bioportal-bundle: the bundle carries no owl:versionIRI" >&2; \
		exit 1; \
	fi; \
	if grep -q "$(BIOPORTAL_RELEASE)-dev\|-dev</owl:versionInfo>" $(BIOPORTAL_OUT); then \
		echo "bioportal-bundle: a development line reached the artifact registries pull" >&2; \
		exit 1; \
	fi; \
	echo "bioportal-bundle: wrote $(BIOPORTAL_OUT) from $(words $(BIOPORTAL_MODULES)) frozen $(BIOPORTAL_RELEASE) modules at $$version_iri"

## Generate WIDOCO HTML reference documentation from the Full semantic profile
## (default into dist/ontology/docs/ for the Pages artifact; override DOCS_DIR=).
## Output is generated, never committed — /ontology/docs/ belongs to the docs,
## the app keeps the site root.
ontology-docs:
	@set -e; \
	tmpdir="$$(mktemp -d)"; \
	trap 'rm -rf "$$tmpdir"' EXIT; \
	cat $(FULL_SEMANTIC_MODULES) > "$$tmpdir/sstim-full.ttl"; \
	if ! $(ROBOT) merge --input "$$tmpdir/sstim-full.ttl" \
		annotate --ontology-iri https://w3id.org/sstim \
		--output "$$tmpdir/sstim-full.owl" > "$$tmpdir/robot.log" 2>&1; then \
		cat "$$tmpdir/robot.log"; \
		exit 1; \
	fi; \
	cat "$$tmpdir/robot.log"; \
	if grep -Eq 'ERROR org\.obolibrary\.robot\.IOHelper|could not be parsed' "$$tmpdir/robot.log"; then \
		echo "ontology-docs: ROBOT discarded input triples" >&2; \
		exit 1; \
	fi; \
	$(WIDOCO) -ontFile "$$tmpdir/sstim-full.owl" -outFolder $(DOCS_DIR) \
		-confFile $(WIDOCO_CONF) -getOntologyMetadata \
		-rewriteAll -lang en -uniteSections -noPlaceHolderText; \
	cp $(DOCS_DIR)/index-en.html $(DOCS_DIR)/index.html

## Generate pyLODE SKOS docs for the vocabulary module (vocpub profile).
## WIDOCO is OWL-centric; this documents the SKOS concept schemes.
## Self-contained HTML into dist/ontology/docs/vocab/ (artifact only, never
## committed); override VOCAB_DOCS_DIR=.
vocab-docs:
	@mkdir -p $(VOCAB_DOCS_DIR)
	$(PYLODE) -i $(VOCAB) -p vocpub -c true -o $(VOCAB_DOCS_DIR)/index.html
	@echo "vocab-docs: wrote $(VOCAB_DOCS_DIR)/index.html"

## Recompile the hand-written WASM oscillator kernel (bsc-osc.wat -> .wasm)
wasm:
	$(WAT2WASM) $(WASM_WAT) -o $(WASM_OUT)
	@echo "wasm: rebuilt $(WASM_OUT) — commit the regenerated artifact"

help:
	@echo "Available targets:"
	@echo "  make build            Build the production bundle"
	@echo "  make truth-audit      Assert the docs match the repository (versions, counts, claims)"
	@echo "  make verify-deploy    Assert DEPLOY_URL serves COMMIT (default: git HEAD)"
	@echo "  make session-conformance Package a session on instance A, verify it on instance B"
	@echo "  make check            Run SvelteKit sync and static checks"
	@echo "  make deploy-firestore-rules Deploy firestore.rules to $(FIREBASE_PROJECT)"
	@echo "  make dev              Start the local Vite dev server on $(DEV_HOST):$(DEV_PORT)"
	@echo "  make preview          Build and preview on $(PREVIEW_HOST):$(PREVIEW_PORT)"
	@echo "  make test             Run Vitest"
	@echo "  make audio-verify     Measure the audio engines in a browser (BROWSER=chrome|firefox|all)"
	@echo "  make validate         Run the current ontology validation suite"
	@echo "  make manifest-check   Validate the module/profile manifest, inventory, and digests"
	@echo "  make module-boundaries Prove unique resource sources and honest direct dependencies"
	@echo "  make core-profile-contract Validate Core shapes, fixture, and competency queries"
	@echo "  make full-equivalence Prove Full compatibility outside recorded migrations"
	@echo "  make export           Write JSON-LD + RDF/XML exports to $(EXPORT_DIR) (EXPORT_DIR=)"
	@echo "  make export-check     Verify generated serializations round-trip isomorphically"
	@echo "  make context-roundtrip Verify context.jsonld round-trips every ontology + instance document"
	@echo "  make verify-snapshots Verify recorded ontology snapshots match their checksum ledger"
	@echo "  make w3id-routes      Verify w3id snapshot routes are current and every target is published"
	@echo "  make release-dryrun   Rehearse the next release without cutting one"
	@echo "  make ontology-docs    Generate WIDOCO HTML docs into $(DOCS_DIR) (DOCS_DIR=)"
	@echo "  make vocab-docs       Generate pyLODE SKOS docs into $(VOCAB_DOCS_DIR)"
	@echo "  make bioportal-bundle Merge term modules into $(BIOPORTAL_OUT) for BioPortal"
	@echo "  make wasm             Recompile $(WASM_OUT) from $(WASM_WAT)"
	@echo "  make shacl            Run all SHACL validations"
	@echo "  make reason           Run ROBOT OWL DL consistency over ontology modules (REASONER=)"
	@echo "  make shacl-core       Validate the Core profile closure against Core shapes"
	@echo "  make shacl-vocab      Validate Vocabulary in the Full semantic closure"
	@echo "  make shacl-exposure   Validate Exposure constraints in the Full closure"
	@echo "  make shacl-modules    Validate the merged term-module ontology set"
	@echo "  make shacl-instances  Validate static/ontology/instances/**/*.ttl (skipped if empty)"
	@echo "  make ecosystem-contract Validate ecosystem fixtures or an external candidate (PUBLIC_ECOSYSTEM=/external/public.ttl, PRIVATE_LEDGER=/external/audit.ttl, SHACL_WORKERS=N)"
	@echo "  make ecosystem-publish Validate and publish an external aggregate (PUBLIC_ECOSYSTEM=, PRIVATE_LEDGER=, DRY_RUN=1)"
	@echo "  make quality-audit    Run semantic integrity and competency thresholds"
	@echo "  make sparql-sanity    Run ontology SPARQL sanity checks"
	@echo "  make snapshot         Freeze ontology as static/ontology/<version>/ (VERSION=, FORCE=1, RELEASE_DATE=YYYY-MM-DD)"
