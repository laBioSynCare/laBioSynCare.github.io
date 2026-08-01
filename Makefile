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
BIOPORTAL_MODULES := $(FULL_SEMANTIC_MODULES)
BIOPORTAL_OUT ?= dist/ontology/sstim-full.owl
INSTANCE_ROOT := static/ontology/instances
INSTANCE_FILES := $(sort $(wildcard $(INSTANCE_ROOT)/*/*.ttl) $(wildcard $(INSTANCE_ROOT)/*/*/*.ttl))
DEV_HOST   ?= 127.0.0.1
DEV_PORT   ?= 4173
PREVIEW_HOST ?= $(DEV_HOST)
PREVIEW_PORT ?= 4174
DEPLOY_URL   ?= https://labiosyncare.github.io

.PHONY: build check migrate-test session-conformance truth-audit verify-deploy deploy-firestore-rules dev ecosystem-contract ecosystem-publish export export-check context-roundtrip verify-snapshots bioportal-bundle ontology-docs vocab-docs preview quality-audit reason shacl shacl-core shacl-vocab shacl-exposure shacl-modules shacl-instances shacl-private-ecosystem sparql-sanity snapshot test validate wasm help manifest-check module-boundaries core-profile-contract full-equivalence

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
## version, DOI and module list from the ontology and the snapshot script, then
## checks README/SECURITY/PORTABLE_DEPLOYMENT/ROADMAP/TODO/homepage against them
## — including claims that a shipped capability is still future work.
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

## Run all SHACL validations
shacl: shacl-core shacl-vocab shacl-exposure shacl-modules shacl-instances shacl-private-ecosystem

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

## Prove the modular Full union preserves the frozen 0.12 semantics
full-equivalence:
	$(PYTHON) scripts/check-sstim-full-equivalence.py

## Run the current ontology validation suite
validate: manifest-check module-boundaries core-profile-contract full-equivalence shacl ecosystem-contract quality-audit reason sparql-sanity export-check context-roundtrip verify-snapshots truth-audit

## Generate JSON-LD + RDF/XML serializations of the ontology modules
## (default into dist/ontology/ beside the Turtle masters; override EXPORT_DIR=)
export:
	$(PYTHON) scripts/export-ontology.py $(EXPORT_DIR)

## Merge the manifest-defined Full semantic profile (excluding SHACL shapes)
## into one RDF/XML OWL file for BioPortal ingest.
## Generated into dist/ (deploy artifact only), never committed; override BIOPORTAL_OUT=.
bioportal-bundle:
	@set -e; \
	mkdir -p $(dir $(BIOPORTAL_OUT)); \
	tmpdir="$$(mktemp -d)"; \
	trap 'rm -rf "$$tmpdir"' EXIT; \
	cat $(BIOPORTAL_MODULES) > "$$tmpdir/sstim-full.ttl"; \
	if ! $(ROBOT) merge --input "$$tmpdir/sstim-full.ttl" \
		annotate --ontology-iri https://w3id.org/sstim \
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
	echo "bioportal-bundle: wrote $(BIOPORTAL_OUT) from $(words $(BIOPORTAL_MODULES)) modules"

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
	@echo "  make validate         Run the current ontology validation suite"
	@echo "  make manifest-check   Validate the module/profile manifest, inventory, and digests"
	@echo "  make module-boundaries Prove unique resource sources and honest direct dependencies"
	@echo "  make core-profile-contract Validate Core shapes, fixture, and competency queries"
	@echo "  make full-equivalence Prove Full preserves the frozen 0.12 semantic union"
	@echo "  make export           Write JSON-LD + RDF/XML exports to $(EXPORT_DIR) (EXPORT_DIR=)"
	@echo "  make export-check     Verify generated serializations round-trip isomorphically"
	@echo "  make context-roundtrip Verify context.jsonld round-trips every ontology + instance document"
	@echo "  make verify-snapshots Verify recorded ontology snapshots match their checksum ledger"
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
