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
WAT2WASM   ?= wat2wasm
FIREBASE   ?= npx firebase-tools
FIREBASE_PROJECT ?= biosyncare-lab
WORKLET_DIR := static/worklets
WASM_WAT   := $(WORKLET_DIR)/bsc-osc.wat
WASM_OUT   := $(WORKLET_DIR)/bsc-osc.wasm
SHAPES     := static/ontology/sstim-shapes.ttl
ONTOLOGY   := static/ontology/sstim-core.ttl
VOCAB      := static/ontology/sstim-vocab.ttl
ALIGNMENTS := static/ontology/sstim-alignments.ttl
EXPOSURE   := static/ontology/sstim-exposure.ttl
PATCH_STUDIO := static/ontology/sstim-patch-studio.ttl
ONTOLOGY_MODULES := $(ONTOLOGY) $(VOCAB) $(ALIGNMENTS) $(SHAPES) $(PATCH_STUDIO) $(EXPOSURE)
# BioPortal ingests a single root file and does not follow dct:isPartOf, so the
# browsable term modules are merged into one OWL file. SHACL shapes are excluded
# (validation constraints, not browsable terms). Core is first so the merged
# ontology inherits its IRI (https://w3id.org/sstim).
BIOPORTAL_MODULES := $(ONTOLOGY) $(VOCAB) $(ALIGNMENTS) $(EXPOSURE) $(PATCH_STUDIO)
BIOPORTAL_OUT ?= dist/ontology/sstim-full.owl
INSTANCE_ROOT := static/ontology/instances
INSTANCE_FILES := $(wildcard $(INSTANCE_ROOT)/*/*.ttl)
DEV_HOST   ?= 127.0.0.1
DEV_PORT   ?= 4173
PREVIEW_HOST ?= $(DEV_HOST)
PREVIEW_PORT ?= 4174

.PHONY: build check deploy-firestore-rules dev export export-check bioportal-bundle ontology-docs preview quality-audit reason shacl shacl-core shacl-vocab shacl-exposure shacl-modules shacl-instances sparql-sanity snapshot test validate wasm help

## Build the production bundle
build:
	npm run build

## Run SvelteKit sync and static checks
check:
	npm run check

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
	$(PYSHACL) -s $(SHAPES) $(ONTOLOGY)

## Validate vocabulary against shapes
shacl-vocab:
	$(PYSHACL) -s $(SHAPES) $(VOCAB)

## Validate exposure ontology module against shapes
shacl-exposure:
	$(PYSHACL) -s $(SHAPES) $(EXPOSURE)

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
		cat $(ONTOLOGY) $(VOCAB) $(EXPOSURE) $(INSTANCE_FILES) > "$$tmp"; \
		$(PYSHACL) -s $(SHAPES) "$$tmp"; \
	fi

## Run all SHACL validations
shacl: shacl-core shacl-vocab shacl-exposure shacl-modules shacl-instances

## Run ROBOT OWL DL consistency over the merged ontology term-space modules
reason:
	@set -e; \
	tmpdir="$$(mktemp -d)"; \
	trap 'rm -rf "$$tmpdir"' EXIT; \
	$(ROBOT) merge $(foreach file,$(ONTOLOGY_MODULES),--input $(file)) \
		reason --reasoner $(REASONER) --output "$$tmpdir/sstim-reasoned.owl"; \
	echo "reason: ROBOT $(REASONER) consistency check passed ($(words $(ONTOLOGY_MODULES)) modules)"

## Run ontology SPARQL sanity checks
sparql-sanity:
	node scripts/sstim-exposure-sanity.mjs

## Run repository-wide semantic integrity and competency checks
quality-audit:
	$(PYTHON) scripts/sstim-quality-audit.py

## Freeze the current ontology as an immutable versioned snapshot
## (version defaults to owl:versionInfo in sstim-core.ttl; override: make snapshot VERSION=0.2.0)
## Existing snapshots are protected; overwrite an unpublished one with FORCE=1.
snapshot:
	node scripts/snapshot-ontology.mjs $(VERSION) $(if $(FORCE),--force,)

## Run Vitest
test:
	npm test

## Verify generated JSON-LD and RDF/XML round-trip to the source graphs
export-check:
	@tmpdir="$$(mktemp -d)"; \
	trap 'rm -rf "$$tmpdir"' EXIT; \
	$(PYTHON) scripts/export-ontology.py "$$tmpdir"

## Run the current ontology validation suite
validate: shacl quality-audit reason sparql-sanity export-check

## Generate JSON-LD + RDF/XML serializations of the ontology modules
## (default into dist/ontology/ beside the Turtle masters; override EXPORT_DIR=)
export:
	$(PYTHON) scripts/export-ontology.py $(EXPORT_DIR)

## Merge the browsable term modules (core+vocab+alignments+exposure+patch-studio,
## excl. SHACL shapes) into one RDF/XML OWL file for BioPortal ingest.
## Generated into dist/ (deploy artifact only), never committed; override BIOPORTAL_OUT=.
bioportal-bundle:
	@mkdir -p $(dir $(BIOPORTAL_OUT))
	$(ROBOT) merge $(foreach f,$(BIOPORTAL_MODULES),--input $(f)) \
		annotate --ontology-iri https://w3id.org/sstim \
		--output $(BIOPORTAL_OUT)
	@echo "bioportal-bundle: wrote $(BIOPORTAL_OUT) from $(words $(BIOPORTAL_MODULES)) modules"

## Generate WIDOCO HTML reference documentation from the core ontology
## (default into dist/ontology/docs/ for the Pages artifact; override DOCS_DIR=).
## Output is generated, never committed — /ontology/docs/ belongs to the docs,
## the app keeps the site root.
ontology-docs:
	$(WIDOCO) -ontFile $(ONTOLOGY) -outFolder $(DOCS_DIR) \
		-confFile $(WIDOCO_CONF) -getOntologyMetadata \
		-rewriteAll -lang en -uniteSections -noPlaceHolderText
	cp $(DOCS_DIR)/index-en.html $(DOCS_DIR)/index.html

## Recompile the hand-written WASM oscillator kernel (bsc-osc.wat -> .wasm)
wasm:
	$(WAT2WASM) $(WASM_WAT) -o $(WASM_OUT)
	@echo "wasm: rebuilt $(WASM_OUT) — commit the regenerated artifact"

help:
	@echo "Available targets:"
	@echo "  make build            Build the production bundle"
	@echo "  make check            Run SvelteKit sync and static checks"
	@echo "  make deploy-firestore-rules Deploy firestore.rules to $(FIREBASE_PROJECT)"
	@echo "  make dev              Start the local Vite dev server on $(DEV_HOST):$(DEV_PORT)"
	@echo "  make preview          Build and preview on $(PREVIEW_HOST):$(PREVIEW_PORT)"
	@echo "  make test             Run Vitest"
	@echo "  make validate         Run the current ontology validation suite"
	@echo "  make export           Write JSON-LD + RDF/XML exports to $(EXPORT_DIR) (EXPORT_DIR=)"
	@echo "  make export-check     Verify generated serializations round-trip isomorphically"
	@echo "  make ontology-docs    Generate WIDOCO HTML docs into $(DOCS_DIR) (DOCS_DIR=)"
	@echo "  make bioportal-bundle Merge term modules into $(BIOPORTAL_OUT) for BioPortal"
	@echo "  make wasm             Recompile $(WASM_OUT) from $(WASM_WAT)"
	@echo "  make shacl            Run all SHACL validations"
	@echo "  make reason           Run ROBOT OWL DL consistency over ontology modules (REASONER=)"
	@echo "  make shacl-core       Validate sstim-core.ttl against shapes"
	@echo "  make shacl-vocab      Validate sstim-vocab.ttl against shapes"
	@echo "  make shacl-exposure   Validate sstim-exposure.ttl against shapes"
	@echo "  make shacl-modules    Validate the merged six-module ontology set"
	@echo "  make shacl-instances  Validate static/ontology/instances/**/*.ttl (skipped if empty)"
	@echo "  make quality-audit    Run semantic integrity and competency thresholds"
	@echo "  make sparql-sanity    Run ontology SPARQL sanity checks"
	@echo "  make snapshot         Freeze ontology as static/ontology/<version>/ (VERSION=, FORCE=1)"
