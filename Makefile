PYTHON     := python3
PYSHACL    := $(PYTHON) -m pyshacl
SHAPES     := public/ontology/sstim-shapes.ttl
ONTOLOGY   := public/ontology/sstim-core.ttl
VOCAB      := public/ontology/sstim-vocab.ttl
ALIGNMENTS := public/ontology/sstim-alignments.ttl
INSTANCES  := public/ontology/instances/presets/

.PHONY: shacl shacl-core shacl-vocab shacl-instances help

## Validate core ontology against shapes
shacl-core:
	$(PYSHACL) -s $(SHAPES) -d $(ONTOLOGY)

## Validate vocabulary against shapes
shacl-vocab:
	$(PYSHACL) -s $(SHAPES) -d $(VOCAB)

## Validate preset instances against shapes (once instances exist)
shacl-instances:
	$(PYSHACL) -s $(SHAPES) -d $(INSTANCES)

## Run all SHACL validations (core + vocab; skip instances if directory empty)
shacl: shacl-core shacl-vocab
	@if [ -n "$$(ls -A $(INSTANCES) 2>/dev/null)" ]; then \
		$(MAKE) shacl-instances; \
	else \
		echo "shacl-instances: skipped ($(INSTANCES) is empty)"; \
	fi

help:
	@echo "Available targets:"
	@echo "  make shacl            Run all SHACL validations"
	@echo "  make shacl-core       Validate sstim-core.ttl against shapes"
	@echo "  make shacl-vocab      Validate sstim-vocab.ttl against shapes"
	@echo "  make shacl-instances  Validate public/ontology/instances/presets/ (skipped if empty)"
