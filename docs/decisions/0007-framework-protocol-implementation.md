# ADR 0007 — Framework, Technique, Protocol, Implementation, Preset, Session

**Status:** Accepted — 2026-04-25

## Context

The SSTIM namespace needs to describe more than one software app. It must be
able to represent techniques that could appear in software, hardware,
mechanical devices, manual practices, research prototypes, and commercial
products. BioSynCare and BSC Lab are related but distinct: BioSynCare is a
commercial implementation; BSC Lab is the open research/reference
implementation and knowledge platform.

The words "software", "device", and "product" are each too narrow as the main
organizing concept:

- "Software" excludes hardware, mechanical, and manual realizations.
- "Device" is too material and can create unwanted medical-device ambiguity.
- "Product" fits BioSynCare but not BSC Lab, research protocols, or manual
  practices.

## Decision

Use six distinct modeling layers:

- **Technique** — an atomic or reusable stimulation method.
  Examples: binaural beat, isochronous tone, Martigli oscillation, Symmetry
  permutation entrainment.
- **Protocol** — a structured way to use one or more techniques toward an
  intent, including composition rules, timing, parameter ranges, constraints,
  and cautions. A protocol can be defined by a framework and can compose
  multiple techniques, but it is narrower than the framework itself.
- **Framework** — a broader doctrine or family of principles that can define
  techniques, protocols, evidence rules, grouping logic, and design
  philosophy. BSC belongs here.
- **Implementation** — a concrete realization of a framework or protocol. It
  may be software, hardware, mechanical, manual, or hybrid. BioSynCare and BSC
  Lab are distinct implementations.
- **Preset** — a parameterized configuration for an implementation, following a
  protocol or framework, intended to enable a concrete session.
- **Session** — an actual execution event: one user, time, device/context, and
  run of a preset or session specification.

Core ontology classes:

- `sstim:SensoryStimulationFramework`
- `sstim:SensoryStimulationTechnique`
- `sstim:SensoryStimulationProtocol`
- `sstim:SensoryStimulationImplementation`
- `sstim:Preset`
- `sstim:SessionSpecification`
- `sstim:SessionInstance`

Canonical SSTIM-scoped paths:

- `https://w3id.org/sstim/technique/{id}`
- `https://w3id.org/sstim/protocol/{id}`
- `https://w3id.org/sstim/framework/{id}`
- `https://w3id.org/sstim/implementation/{id}`
- `https://w3id.org/sstim/implementation/{id}/preset/{preset-id}`
- `https://w3id.org/sstim/implementation/{id}/session/{session-id}`
- `https://w3id.org/sstim/implementation/{id}/annotation/{annotation-id}`
- `https://w3id.org/sstim/implementation/{id}/evidence/{claim-id}`

BSC framework and implementation roots:

- `https://w3id.org/sstim/framework/bsc`
- `https://w3id.org/sstim/implementation/biosyncare`
- `https://w3id.org/sstim/implementation/bsclab`

## Consequences

- Martigli, isochronous tones, binaural beats, and Symmetry are techniques, not
  protocols by default.
- BSC is a framework, not a protocol and not an implementation.
- BSC can define BSC-specific protocols, but those protocols are separate
  resources under `https://w3id.org/sstim/protocol/{id}` and should link back
  to the BSC framework.
- BioSynCare is an implementation of the BSC framework.
- BSC Lab is a separate implementation of the BSC framework.
- Presets are not protocols; they are parameter sets/configurations that follow
  protocols or framework rules.
- Sessions are executions, not preset definitions.
- The namespace remains under `w3id.org/sstim`, avoiding a second top-level
  `w3id.org/bsc` namespace while preserving conceptual boundaries.

## Alternatives considered

- **BSC as a protocol.** Rejected because BSC is too broad: it includes
  techniques, evidence grading, UI/product philosophy, preset catalog,
  implementation guidance, and governance.
- **BSC as software.** Rejected because the same principles and techniques can
  be realized in hardware, mechanical devices, or manual practices.
- **All realizations as devices.** Rejected because "device" is too physical and
  can imply medical-device framing. It is useful as one implementation medium,
  not as the umbrella category.
- **Presets as protocols.** Rejected because presets are concrete parameter
  configurations. Protocols are the method/rule layer that can generate or
  constrain many presets.

## See also

- [0001](0001-namespace-split.md) — SSTIM-scoped instance paths.
- [0006](0006-one-class-per-technique.md) — technique identity in voice classes.
