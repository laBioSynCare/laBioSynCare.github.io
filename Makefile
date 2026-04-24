PYTHON     := python3
PYSHACL    := $(PYTHON) -m pyshacl
SHAPES     := static/ontology/sstim-shapes.ttl
ONTOLOGY   := static/ontology/sstim-core.ttl
VOCAB      := static/ontology/sstim-vocab.ttl
ALIGNMENTS := static/ontology/sstim-alignments.ttl
INSTANCES  := static/ontology/instances/presets/
DEV_HOST   ?= 127.0.0.1
DEV_PORT   ?= 4173
PREVIEW_HOST ?= $(DEV_HOST)
PREVIEW_PORT ?= 4174

.PHONY: build check dev preview shacl shacl-core shacl-vocab shacl-instances test validate help

## Build the production bundle
build:
	npm run build

## Run SvelteKit sync and static checks
check:
	npm run check

## Start the local Vite dev server on the standard host/port
dev:
	npm run dev -- --host $(DEV_HOST) --port $(DEV_PORT)

## Preview the production build on a stable local host/port
preview: build
	npm run preview -- --host $(PREVIEW_HOST) --port $(PREVIEW_PORT)

## Validate core ontology against shapes
shacl-core:
	$(PYSHACL) -s $(SHAPES) $(ONTOLOGY)

## Validate vocabulary against shapes
shacl-vocab:
	$(PYSHACL) -s $(SHAPES) $(VOCAB)

## Validate preset instances against shapes (once instances exist)
shacl-instances:
	$(PYSHACL) -s $(SHAPES) $(INSTANCES)

## Run all SHACL validations (core + vocab; skip instances if directory empty)
shacl: shacl-core shacl-vocab
	@if [ -n "$$(ls -A $(INSTANCES) 2>/dev/null)" ]; then \
		$(MAKE) shacl-instances; \
	else \
		echo "shacl-instances: skipped ($(INSTANCES) is empty)"; \
	fi

## Run Vitest
test:
	npm test

## Run the current ontology validation suite
validate: shacl

help:
	@echo "Available targets:"
	@echo "  make build            Build the production bundle"
	@echo "  make check            Run SvelteKit sync and static checks"
	@echo "  make dev              Start the local Vite dev server on $(DEV_HOST):$(DEV_PORT)"
	@echo "  make preview          Build and preview on $(PREVIEW_HOST):$(PREVIEW_PORT)"
	@echo "  make test             Run Vitest"
	@echo "  make validate         Run the current ontology validation suite"
	@echo "  make shacl            Run all SHACL validations"
	@echo "  make shacl-core       Validate sstim-core.ttl against shapes"
	@echo "  make shacl-vocab      Validate sstim-vocab.ttl against shapes"
	@echo "  make shacl-instances  Validate static/ontology/instances/presets/ (skipped if empty)"
