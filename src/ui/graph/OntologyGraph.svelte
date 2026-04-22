<script>
  import { onMount, onDestroy } from 'svelte'
  import { buildGraphElements } from '../../rdf/graph.js'

  const { store } = $props()

  let container = $state(null)
  let cy = $state(null)
  let error = $state(null)
  let loading = $state(true)

  // Layer visibility
  let showSubClassOf  = $state(true)
  let showObjProp     = $state(true)
  let showDataProp    = $state(false)
  let showNarrower    = $state(true)
  let showRelated     = $state(true)
  let showInstanceOf  = $state(true)

  // Detail panel
  let selected = $state(null)

  const COLORS = {
    owlClass:    '#4fc3f7',
    skosConcept: '#81c784',
    xsdType:     '#ffb74d',
    subClassOf:  '#4fc3f7',
    objProp:     '#ce93d8',
    dataProp:    '#ffb74d',
    narrower:    '#81c784',
    related:     '#f48fb1',
    instanceOf:  '#aaaaaa',
  }

  const SCHEME_COLORS = {
    'https://w3id.org/sstim/vocab#FrequencyBandScheme':       '#4db6ac',
    'https://w3id.org/sstim/vocab#PresetGroupScheme':         '#ff8a65',
    'https://w3id.org/sstim/vocab#EvidenceTierScheme':        '#9575cd',
    'https://w3id.org/sstim/vocab#EvidenceModalityScheme':    '#f06292',
    'https://w3id.org/sstim/vocab#VoiceTypeScheme':           '#4dd0e1',
    'https://w3id.org/sstim/vocab#SensoryModalityScheme':     '#aed581',
    'https://w3id.org/sstim/vocab#StimulationMechanismScheme':'#ffd54f',
    'https://w3id.org/sstim/vocab#PermutationFunctionScheme': '#a1887f',
    'https://w3id.org/sstim/vocab#CautionTagScheme':          '#ef9a9a',
  }

  function nodeColor(data) {
    if (data.kind === 'owlClass')    return COLORS.owlClass
    if (data.kind === 'xsdType')     return COLORS.xsdType
    if (data.kind === 'skosConcept') return SCHEME_COLORS[data.scheme] ?? COLORS.skosConcept
    return '#888'
  }

  function styleSheet() {
    return [
      {
        selector: 'node',
        style: {
          'label': 'data(label)',
          'font-size': 11,
          'text-valign': 'center',
          'text-halign': 'center',
          'text-wrap': 'wrap',
          'text-max-width': 90,
          'width': 'label',
          'height': 'label',
          'padding': 8,
          'shape': 'round-rectangle',
          'background-color': (ele) => nodeColor(ele.data()),
          'border-width': 1.5,
          'border-color': '#ffffff22',
          'color': '#111',
          'font-weight': 500,
        }
      },
      {
        selector: 'node[kind="owlClass"]',
        style: { shape: 'round-rectangle', 'font-weight': 700 }
      },
      {
        selector: 'node[kind="xsdType"]',
        style: { shape: 'diamond', 'font-size': 10, 'font-style': 'italic' }
      },
      {
        selector: 'node[kind="skosConcept"]',
        style: { shape: 'ellipse' }
      },
      {
        selector: 'node:selected',
        style: { 'border-width': 3, 'border-color': '#fff', 'z-index': 999 }
      },
      {
        selector: 'edge',
        style: {
          'width': 1.5,
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'label': '',
          'font-size': 9,
          'color': '#ccc',
          'text-rotation': 'autorotate',
          'text-margin-y': -8,
          'opacity': 0.8,
        }
      },
      {
        selector: 'edge[kind="subClassOf"]',
        style: { 'line-color': COLORS.subClassOf, 'target-arrow-color': COLORS.subClassOf, 'width': 2 }
      },
      {
        selector: 'edge[kind="objProp"]',
        style: { 'line-color': COLORS.objProp, 'target-arrow-color': COLORS.objProp, 'label': 'data(label)', 'line-style': 'dashed' }
      },
      {
        selector: 'edge[kind="dataProp"]',
        style: { 'line-color': COLORS.dataProp, 'target-arrow-color': COLORS.dataProp, 'label': 'data(label)', 'line-style': 'dotted' }
      },
      {
        selector: 'edge[kind="narrower"]',
        style: { 'line-color': COLORS.narrower, 'target-arrow-color': COLORS.narrower }
      },
      {
        selector: 'edge[kind="related"]',
        style: { 'line-color': COLORS.related, 'target-arrow-color': COLORS.related, 'line-style': 'dashed', 'target-arrow-shape': 'none' }
      },
      {
        selector: 'edge[kind="instanceOf"]',
        style: { 'line-color': COLORS.instanceOf, 'target-arrow-color': COLORS.instanceOf, 'line-style': 'dotted', 'opacity': 0.5 }
      },
    ]
  }

  function applyLayerVisibility() {
    if (!cy) return
    const rules = {
      subClassOf:  showSubClassOf,
      objProp:     showObjProp,
      dataProp:    showDataProp,
      narrower:    showNarrower,
      related:     showRelated,
      instanceOf:  showInstanceOf,
    }
    for (const [kind, visible] of Object.entries(rules)) {
      cy.edges(`[kind="${kind}"]`).style('display', visible ? 'element' : 'none')
    }
    // Hide xsd nodes when dataProp edges hidden
    cy.nodes('[kind="xsdType"]').style('display', showDataProp ? 'element' : 'none')
  }

  $effect(() => {
    // re-run whenever any toggle changes
    showSubClassOf; showObjProp; showDataProp
    showNarrower; showRelated; showInstanceOf
    applyLayerVisibility()
  })

  onMount(async () => {
    try {
      const elements = await buildGraphElements(store)

      const cytoscape = (await import('cytoscape')).default

      cy = cytoscape({
        container,
        elements,
        style: styleSheet(),
        layout: {
          name: 'cose',
          animate: false,
          nodeRepulsion: () => 8000,
          idealEdgeLength: () => 80,
          edgeElasticity: () => 100,
          gravity: 0.4,
          numIter: 1000,
          fit: true,
          padding: 30,
        },
        minZoom: 0.1,
        maxZoom: 4,
      })

      cy.on('tap', 'node', (evt) => {
        const d = evt.target.data()
        selected = d
      })
      cy.on('tap', (evt) => {
        if (evt.target === cy) selected = null
      })

      applyLayerVisibility()
    } catch (e) {
      error = e.message
      console.error(e)
    } finally {
      loading = false
    }
  })

  onDestroy(() => { cy?.destroy() })

  const EDGE_KINDS = [
    { key: 'showSubClassOf', label: 'subClassOf',  color: COLORS.subClassOf },
    { key: 'showObjProp',    label: 'obj. property', color: COLORS.objProp },
    { key: 'showDataProp',   label: 'data property', color: COLORS.dataProp },
    { key: 'showNarrower',   label: 'narrower',     color: COLORS.narrower },
    { key: 'showRelated',    label: 'related',      color: COLORS.related },
    { key: 'showInstanceOf', label: 'instanceOf',   color: COLORS.instanceOf },
  ]

  const toggles = {
    get showSubClassOf()  { return showSubClassOf },
    set showSubClassOf(v) { showSubClassOf = v },
    get showObjProp()     { return showObjProp },
    set showObjProp(v)    { showObjProp = v },
    get showDataProp()    { return showDataProp },
    set showDataProp(v)   { showDataProp = v },
    get showNarrower()    { return showNarrower },
    set showNarrower(v)   { showNarrower = v },
    get showRelated()     { return showRelated },
    set showRelated(v)    { showRelated = v },
    get showInstanceOf()  { return showInstanceOf },
    set showInstanceOf(v) { showInstanceOf = v },
  }
</script>

<div class="graph-shell">

  <!-- Controls sidebar -->
  <aside class="controls">
    <strong>Edge layers</strong>
    <ul class="layer-list">
      {#each EDGE_KINDS as ek}
        <li>
          <label>
            <input type="checkbox" bind:checked={toggles[ek.key]} />
            <span class="swatch" style="background:{ek.color}"></span>
            {ek.label}
          </label>
        </li>
      {/each}
    </ul>

    <strong style="margin-top:1rem;display:block">Node types</strong>
    <ul class="legend-list">
      <li><span class="swatch" style="background:{COLORS.owlClass}"></span> OWL class</li>
      <li><span class="swatch" style="background:{COLORS.skosConcept}"></span> SKOS concept</li>
      <li><span class="swatch" style="background:{COLORS.xsdType}"></span> XSD datatype</li>
    </ul>

    <strong style="margin-top:1rem;display:block">SKOS schemes</strong>
    <ul class="legend-list">
      {#each Object.entries(SCHEME_COLORS) as [iri, color]}
        <li><span class="swatch" style="background:{color}"></span> {iri.split('#')[1].replace('Scheme','')}</li>
      {/each}
    </ul>
  </aside>

  <!-- Graph canvas -->
  <div class="canvas" bind:this={container}>
    {#if loading}
      <p class="overlay" aria-busy="true">Building graph…</p>
    {:else if error}
      <p class="overlay error">{error}</p>
    {/if}
  </div>

  <!-- Detail panel -->
  {#if selected}
    <aside class="detail">
      <button class="close" onclick={() => selected = null}>✕</button>
      <small style="opacity:.6">{selected.kind}</small>
      <h3>{selected.label}</h3>
      <p class="iri"><a href={selected.iri} target="_blank" rel="noreferrer">{selected.iri}</a></p>
      {#if selected.definition}
        <p>{selected.definition}</p>
      {/if}
      {#if selected.notation}
        <p><strong>Notation:</strong> <code>{selected.notation}</code></p>
      {/if}
    </aside>
  {/if}

</div>

<style>
  .graph-shell {
    display: flex;
    gap: 0;
    height: calc(100vh - 80px);
    overflow: hidden;
  }

  .controls {
    width: 190px;
    flex-shrink: 0;
    padding: 0.75rem;
    overflow-y: auto;
    border-right: 1px solid #ffffff18;
    font-size: 0.8rem;
  }

  .layer-list, .legend-list {
    list-style: none;
    padding: 0;
    margin: 0.4rem 0 0;
  }
  .layer-list li, .legend-list li {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 0;
  }
  .layer-list label { display: flex; align-items: center; gap: 6px; cursor: pointer; }

  .swatch {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .canvas {
    flex: 1;
    position: relative;
    background: #111;
  }

  .overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #aaa;
  }
  .overlay.error { color: #f88; }

  .detail {
    width: 260px;
    flex-shrink: 0;
    padding: 1rem;
    overflow-y: auto;
    border-left: 1px solid #ffffff18;
    position: relative;
  }

  .close {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    opacity: 0.5;
  }
  .close:hover { opacity: 1; }

  .iri { font-size: 0.72rem; word-break: break-all; opacity: 0.6; }
  .iri a { color: inherit; }

  h3 { margin: 0.25rem 0 0.5rem; font-size: 1rem; }
</style>
