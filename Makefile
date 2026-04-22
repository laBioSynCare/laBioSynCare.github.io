PYTHON     := python3
PYSHACL    := $(PYTHON) -m pyshacl
SHAPES     := static/ontology/sstim-shapes.ttl
ONTOLOGY   := static/ontology/sstim-core.ttl
VOCAB      := static/ontology/sstim-vocab.ttl
ALIGNMENTS := static/ontology/sstim-alignments.ttl
INSTANCES  := static/ontology/instances/presets/

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
	@echo "  make shacl-instances  Validate static/ontology/instances/presets/ (skipped if empty)"
