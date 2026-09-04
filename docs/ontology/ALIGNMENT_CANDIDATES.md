# External alignment candidates, tranche 1

**Status:** proposal for review, created 2026-09-05 by an assisted pass.
Maintainer decision required before any of it enters RDF.

**Nothing here is asserted.** `static/ontology/sstim-alignments.ttl` is protected
under [ADR 0004](../decisions/0004-protected-ontology-files.md) and `CLAUDE.md`
§3.4, so it changes only on an instruction naming the file. This document is the
evidence a reviewer needs in order to give that instruction, row by row.

The policy these rows are written against is the External Mapping Policy in
[PUBLICATION_AND_INTERLINKING_PLAN.md](PUBLICATION_AND_INTERLINKING_PLAN.md):
`exactMatch` only when identity is defensible in both directions, `closeMatch`
when the concepts differ in extension or granularity, `relatedMatch` for a
thematic relationship, and an authoritative source checked for every identifier.

---

## 1. What the ontology has today

Measured 2026-09-05 by loading the 18 manifest-owned modules and counting every
`skos:*Match`, `owl:equivalentClass`, `owl:equivalentProperty` and `owl:sameAs`
whose object is outside the SSTIM namespace:

| | count |
|---|---|
| mapping triples to an external vocabulary | 13 |
| SKOS concepts carrying at least one | 12 of 551 |
| OWL classes carrying at least one | 2 of 164 |
| external vocabularies reached | 2 (Wikidata, SNOMED CT) |

`make alignment-verify` dereferenced all 13 on 2026-09-05: every target exists,
none is obsolete, none is a paper about the subject rather than the subject, and
each carries `owl:Axiom` provenance with a `dct:date`. The existing mappings are
in good order. They are simply few, and they reach two sources.

Per scheme, the three that matter most for interoperability:

| Scheme | concepts | mapped |
|---|---|---|
| `TechniqueScheme` | 39 | 3 |
| `NeuralSystemScheme` | 11 | 0 |
| `NeuralTargetSiteScheme` | 8 | 0 |
| `NeuralPhenomenonScheme` | 14 | 0 |

## 2. The instruments

Every identifier below was resolved at the service that mints it, on 2026-09-05.
Label similarity was used only to generate candidates, never to accept one.

| Authority | Endpoint used | Licence position |
|---|---|---|
| Wikidata | `wbgetentities` and `wbsearchentities` on `www.wikidata.org/w/api.php` | CC0, no constraint |
| MeSH | `id.nlm.nih.gov/mesh/lookup/descriptor`, `.json` records, and the NLM SPARQL endpoint for scope notes | NLM descriptors, identifiers referenced only |
| UBERON and other OBO | EBI OLS4 `api/search` and `api/terms` | CC BY 3.0 |
| SNOMED CT | `tx.fhir.org` `CodeSystem/$lookup` | licence restricted, see below |

The scope notes quoted in section 4 are the reviewer's evidence and are quoted
here in a working document. Following the rule the alignment module already
applies to SNOMED, the RDF itself would carry identifiers and SSTIM's own
rationale, never the external vocabulary's definition text as data.

## 3. Why this cannot be done by label search

The candidate search returned, for SSTIM's own English labels:

| SSTIM label | what an exact label match returns |
|---|---|
| brain | a scientific journal (`Q897386`), a family name, a French commune, and the rapper Lil Dicky |
| cortex | a journal, a Swedish band, a podcast, a crude oil tanker built in 2005, a 1988 video game |
| Vestibular | `Q3847496`, the Brazilian university entrance examination |
| Transcranial Direct Current Stimulation | the technique, then a 2017 article, then a clinical trial |
| Vagus Nerve Stimulation | the technique and three separate scientific articles |
| Biofeedback | the practice, an episode of The Bionic Woman, and a US journal |

This is the same failure that produced the three wrong mappings this repository
has already published (band QIDs resolving to a Van Halen album and a stock
exchange, MeSH `D012910` recorded as sensory stimulation when it is Snake
Venoms, SNOMED `229070002` recorded as sensory stimulation when it denotes
stretching exercises). `scripts/verify-alignments.py` now rejects the article and
clinical-trial class of error automatically by reading `P31`, and flags for
review any `exactMatch` or `closeMatch` whose target label shares no word with
SSTIM's, which is what would have caught the MeSH and SNOMED errors: both of
those identifiers exist and are active, and only their meaning was wrong. It can
still only check what is already asserted. Choosing the target is a human
judgment, which is what the rows below are for.

## 4. Recommended rows

Each row names the authority's own intension, then says why the predicate is
what it is. Where a reviewer could reasonably choose differently, the
alternative is stated rather than hidden.

### 4.1 Clinical and instrumental techniques

| SSTIM term | Target | Proposed | Reason |
|---|---|---|---|
| `techTDCS` | `mesh:D065908` | `closeMatch` | MeSH: "a technique of brain electric stimulation therapy which uses constant, low current delivered via ELECTRODES placed on various locations on the scalp". Extensionally the same technique; MeSH frames it as therapy and SSTIM asserts no therapeutic commitment. `exactMatch` is defensible if the reviewer treats the therapy framing as indexing convention. |
| `techTDCS` | `wd:Q603398` | `closeMatch` | Same reasoning, same framing difference ("brain electric stimulation therapy"). |
| `techDBS` | `mesh:D046690` | `closeMatch` | MeSH scopes the descriptor by indication: "Therapy for MOVEMENT DISORDERS, especially PARKINSON DISEASE". SSTIM's definition carries no indication, so the two are not interchangeable. `narrowMatch` is the alternative reading if the scope note is taken as normative. |
| `techDBS` | `wd:Q618076` | `closeMatch` | "surgical treatment involving the implantation of a medical device". Treatment framing again, technique identical. |
| `techElectroconvulsiveTherapy` | `mesh:D004565` | `closeMatch` | MeSH: "Electrically induced CONVULSIONS primarily used in the treatment of severe AFFECTIVE DISORDERS and SCHIZOPHRENIA". Same procedure; MeSH names indications, SSTIM names the mechanism and the anaesthetic context. |
| `techElectroconvulsiveTherapy` | `wd:Q131543` | `closeMatch` | "medical procedure". Thin intension, so close rather than exact. |
| `techVagusNerveStimulation` | `mesh:D055536` | `closeMatch` | MeSH describes an implanted battery and adjunctive treatment of partial epilepsy and refractory depression. SSTIM covers implanted **and** transcutaneous delivery, so SSTIM is the wider concept. `narrowMatch` is the alternative if MeSH's implant scope is read strictly. |
| `techVagusNerveStimulation` | `wd:Q2062293` | `closeMatch` | "medical treatment that involves delivering electrical impulses to the vagus nerve". |
| `techRepetitiveTMS` | `mesh:D050781` | `broadMatch` | The MeSH descriptor is Transcranial Magnetic Stimulation, which covers single-pulse probing. SSTIM deliberately separates the repetitive protocol, and its scope note says a single pulse used to measure is not neuromodulation. The MeSH concept is strictly broader. |
| `techRepetitiveTMS` | `wd:Q263962` | `broadMatch` | "form of brain stimulation using magnetic fields". Same containment. |
| `techNeurofeedback` | `mesh:D058765` | `closeMatch` | MeSH: "a technique to self-regulate brain activities provided as a feedback". No therapy framing and no signal restriction; SSTIM adds "typically EEG" and requires sensory rendering. This is the strongest `exactMatch` candidate in the tranche. |
| `techNeurofeedback` | `wd:Q1306920` | `closeMatch` | "type of biofeedback". |
| `techBiofeedback` | `wd:Q864329` | `closeMatch` | Wikidata's definition is the general practice and matches SSTIM's closely. |
| `techBiofeedback` | `mesh:D001676` | `closeMatch` | The descriptor is "Biofeedback, Psychology" and its scope note is autonomic and therapeutic ("skin temperature, heartbeats, brain waves ... to self-control related conditions"). SSTIM includes muscle tension and asserts no condition. Neither concept contains the other, which is exactly what `closeMatch` is for. |
| `techPhoticDriving` | `mesh:D010775` | `broadMatch` | MeSH Photic Stimulation covers "bright light flashes or visual patterns" used during EEG. SSTIM's concept is the periodic-flicker subset used to drive a rhythm, so the MeSH concept is broader. |
| `techASMR` | `wd:Q4826866` | `relatedMatch` | The item is the response phenomenon, "phenomena of sensory perception". SSTIM's concept is the stimulation technique intended to evoke it. This mirrors the existing `voiceBinaural relatedMatch wd:Q863539` precedent. |
| `techAcousticStartle` | `mesh:D013216` | `relatedMatch` | The descriptor Reflex, Startle is the elicited response, not the eliciting protocol. A technique is related to the reflex it probes, not close to it. |

### 4.2 Neural phenomena

| SSTIM term | Target | Proposed | Reason |
|---|---|---|---|
| `phenomenonAuditorySteadyStateResponse` | `wd:Q123224658` | `closeMatch` | "electrophysiologic response to rapid auditory stimuli" against SSTIM's "steady-state neural response frequency-tagged to a periodic auditory stimulus". Same phenomenon, the item carries no boundary against neighbouring evoked responses. |
| `phenomenonFrequencyFollowingResponse` | `wd:Q5502870` | `narrowMatch` | The item is auditory: "evoked potential generated by periodic or nearly-periodic auditory stimuli". SSTIM's definition is modality-neutral, "a neural response that follows the periodicity of an applied stimulus", so the Wikidata concept is the narrower one. Asserting `closeMatch` here would hide a real difference. |
| `phenomenonAcousticStartleReflex` | `mesh:D013216` | `broadMatch` | MeSH Reflex, Startle is "a complex involuntary response to an unexpected strong stimulus" with no modality restriction. SSTIM's is the acoustic case. |
| `phenomenonSynapticTransmission` | `mesh:D009435` | `relatedMatch` | MeSH names the process. SSTIM's concept is "change in synaptic transmission", a phenomenon category in an evidence model, so the two are not the same kind of thing. Same reasoning as the existing `mechMultisensory` mapping. |

### 4.3 Neural systems and target sites

These eleven plus eight concepts are the cheapest real gain in the tranche: every
one has a stable UBERON class with a matching definition, and UBERON is the
vocabulary an OBO-adjacent consumer already resolves.

One predicate decision governs all of them. Under
[ADR 0021](../decisions/0021-controlled-value-semantics.md) an SSTIM controlled
value is an information category, not the real-world entity it classifies, and
each of these definitions reads "the X neural system **as a distributed target**"
or "X **as a stimulation target**". A category of targets is not identical to an
anatomical entity, so `closeMatch` is the conservative and recommended predicate
throughout and `exactMatch` should not be asserted on any row here. A reviewer
who wants the stronger statement should reach for a dedicated relation to the
anatomical class instead of a SKOS mapping predicate, which is a modeling
decision and needs an ADR rather than a row in a table.

| SSTIM term | UBERON | Wikidata | MeSH |
|---|---|---|---|
| `systemAuditory` | `UBERON:0016490` auditory system | `Q821413` | |
| `systemVisual` | `UBERON:0002104` visual system | `Q558363` | |
| `systemSomatosensory` | `UBERON:0003942` somatosensory system | `Q328835` | |
| `systemVestibular` | `UBERON:0004681` vestibular system | `Q596832` | `D000091282` |
| `systemOlfactory` | `UBERON:0005725` olfactory system | `Q1054094` | |
| `systemGustatory` | `UBERON:0001033` gustatory system | `Q1147588` | |
| `systemProprioceptive` | `UBERON:0025533` proprioceptive system | | |
| `systemInteroceptive` | `UBERON:0036255` interoceptive system | | |
| `systemMotor` | `UBERON:0025525` motor system | `Q2915553` | |
| `systemSensory` | `UBERON:0001032` sensory system | `Q56073037` | |
| `systemAutonomic` | `UBERON:0002410` autonomic nervous system | `Q171064` | `D001341` |
| `targetBrain` | `UBERON:0000955` brain | | `D001921` |
| `targetCentralNervousSystem` | `UBERON:0001017` central nervous system | `Q47273` | `D002490` |
| `targetPeripheralNervousSystem` | `UBERON:0000010` peripheral nervous system | `Q169953` | `D017933` |
| `targetSpinalCord` | `UBERON:0002240` spinal cord | `Q9606` | `D013116` |
| `targetCranialNerve` | `UBERON:0001785` cranial nerve | | `D003391` |

Two label divergences worth noting rather than silently smoothing:
`systemAutonomic` is labelled "autonomic system" in SSTIM while every authority
says "autonomic nervous system", and `systemProprioceptive` and
`systemInteroceptive` have UBERON classes but no clean Wikidata concept item
(Wikidata has `Q1129066` proprioception and `Q1668091` interoception, which are
senses, not systems, and would be a different mapping).

### 4.4 Deliberately not proposed

| SSTIM term | Rejected candidate | Why |
|---|---|---|
| `targetCortex` | `UBERON:0001851` cortex | The exact label match is wrong. UBERON's "cortex" is the outermost layer of any organ and subsumes adrenal cortex. The intended sense is presumably `UBERON:0000956` cerebral cortex plus `mesh:D002540`, but SSTIM's definition says only "cortical tissue as a stimulation target", which does not exclude cerebellar cortex. **Decide the intended sense before mapping.** |
| `targetPeripheralNerve` | `UBERON:0001021` nerve | UBERON's "nerve" is the general structure. No UBERON class is exactly "peripheral nerve"; `mesh:D010525` Peripheral Nerves exists and may be the better single target. Left for the second tranche. |
| `targetDeepBrainStructure` | any | No single anatomical class corresponds to "subcortical or deep brain structure". Mapping it would require picking an arbitrary representative. |
| `techUltrasoundNeuromod` | `mesh:D014464`, `wd:Q564897` | Both are ablative. MeSH Ultrasonic Therapy is "focused, high-frequency sound waves to produce local hyperthermia ... or to destroy the diseased tissue"; `Q564897` is high-intensity focused ultrasound. SSTIM's concept is low-intensity focused ultrasound neuromodulation, which is a different technique with the same words. This is the clearest trap in the whole search. |
| `techVibroacoustic` | `wd:Q7924691` | The item is "Vibroacoustic stimulation, antenatal test of fetal heart rate", a distinct obstetric procedure that shares the name. |
| `techRhythmicAuditoryCueing` | any | Wikidata has four clinical trials using rhythmic auditory stimulation and no concept item for the technique. See section 6. |
| `SensoryModalityScheme` (all six) | UBERON systems | The modality concepts would collide with `NeuralSystemScheme`, which already maps to those classes. Modalities should map to perception concepts (`mesh:D001307` Auditory Perception, `mesh:D014796` Visual Perception, and the corresponding Wikidata senses) if they map at all. That is a scheme-level decision and belongs in its own pass. |

## 5. If the tranche is accepted

Every accepted row needs, in the same commit:

1. the mapping triple in `static/ontology/sstim-alignments.ttl`, added only on an
   instruction naming that file;
2. an `owl:Axiom` provenance block carrying `dct:source`, `dct:date`,
   `prov:wasAttributedTo` and a `skos:editorialNote` giving the extension or
   intension reason, following the KR-09 pattern already in the file;
3. new prefixes for `mesh:` (`http://id.nlm.nih.gov/mesh/`) and `uberon:`
   (`http://purl.obolibrary.org/obo/UBERON_`), which the module does not yet
   declare;
4. `make validate`, then `make alignment-verify` to dereference the new targets.

The counts in section 1 will change, so `make truth-audit` should be run before
any document restates them.

## 6. Gaps found in the external record

The search also measured what the authorities do **not** have, which feeds
[WIKIDATA_CONTRIBUTION.md](WIKIDATA_CONTRIBUTION.md) stage 3 rather than this
file:

- **Transcranial alternating current stimulation has no Wikidata concept item.**
  Searching returns three clinical trials and cranial electrotherapy
  stimulation, which is a different technique. tACS has a large independent
  literature, so notability is not the obstacle.
- **Photic driving has none either**, only journal articles. MeSH covers the
  broader Photic Stimulation.
- **Rhythmic auditory stimulation has none**, only trials.
- `Q6898437` monaural beats is thin, which the existing `closeMatch` already
  records.

Each is an item a domain expert could create with sources, which is exactly the
contribute-before-publishing posture that document sets out.
