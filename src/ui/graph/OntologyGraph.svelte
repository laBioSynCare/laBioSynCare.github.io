<script>
  import { onMount, onDestroy } from 'svelte'
  import { buildGraphElements } from '../../rdf/graph.js'
  import AnnotationPanel from '../annotation/AnnotationPanel.svelte'
  import { graphNavigation, resetGraphNavigation } from '../navigation/graphNavigation.js'

  const { store } = $props()

  let container = $state(null)
  let cy = $state(null)
  let error = $state(null)
  let loading = $state(true)
  let graphStats = $state(null)
  let allElements = $state([])
  let graphScope = $state('all')
  let focusNodeQuery = $state('')

  // Layer visibility
  let showSubClassOf  = $state(true)
  let showObjProp     = $state(true)
  let showDataProp    = $state(false)
  let showNarrower    = $state(true)
  let showRelated     = $state(true)
  let showInstanceOf  = $state(true)

  // Detail panel
  let selected = $state(null)
  let neighbors = $state([])
  let iriCopied = $state(false)
  let iriCopyTimer = null
  let neighborhoodFocus = $state(false)

  const KIND_LABELS = {
    owlClass: 'OWL class',
    skosConcept: 'SKOS concept',
    xsdType: 'XSD datatype',
  }

  const EDGE_KIND_LABELS = {
    subClassOf: 'subClassOf',
    objProp: 'object property',
    dataProp: 'data property',
    narrower: 'narrower',
    related: 'related',
    instanceOf: 'type',
  }

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

  const GRAPH_SCOPES = [
    { value: 'all', label: 'All rendered data' },
    { value: 'core', label: 'Core classes' },
    { value: 'vocabulary', label: 'Controlled vocabulary' },
    { value: 'frequency', label: 'Frequency bands' },
    { value: 'evidence', label: 'Evidence vocabulary' },
    { value: 'voice', label: 'Voice vocabulary' },
  ]

  function localName(iri) {
    return iri?.split(/[#/]/).pop() ?? ''
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
          'border-color': 'rgba(255, 255, 255, 0.13)',
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

  function graphScopeNodeVisible(data) {
    if (!data) return false
    if (graphScope === 'all') return true
    if (graphScope === 'core') return data.kind === 'owlClass' || data.kind === 'xsdType'
    if (graphScope === 'vocabulary') return data.kind === 'skosConcept'
    if (graphScope === 'frequency') {
      return data.scheme === 'https://w3id.org/sstim/vocab#FrequencyBandScheme' ||
        data.iri === 'https://w3id.org/sstim#FrequencyBand' ||
        data.iri === 'https://w3id.org/sstim#FrequencyBandGroup'
    }
    if (graphScope === 'evidence') {
      return data.scheme === 'https://w3id.org/sstim/vocab#EvidenceTierScheme' ||
        data.scheme === 'https://w3id.org/sstim/vocab#EvidenceModalityScheme' ||
        [
          'EvidenceClaim',
          'EvidenceTierValue',
          'EvidenceModalityTag',
          'PublicSafeReference',
        ].includes(localName(data.iri))
    }
    if (graphScope === 'voice') {
      return data.scheme === 'https://w3id.org/sstim/vocab#VoiceTypeScheme' ||
        ['Voice', 'BinauralVoice', 'MartigliVoice', 'MartigliBinauralVoice', 'SymmetryVoice']
          .includes(localName(data.iri))
    }
    return true
  }

  function edgeLayerVisible(kind) {
    const rules = {
      subClassOf:  showSubClassOf,
      objProp:     showObjProp,
      dataProp:    showDataProp,
      narrower:    showNarrower,
      related:     showRelated,
      instanceOf:  showInstanceOf,
    }
    return rules[kind] ?? true
  }

  function visibleElementsForCurrentView() {
    let visibleNodeIds = new Set(
      allElements
        .filter((element) => !element.data?.source && graphScopeNodeVisible(element.data))
        .filter((element) => element.data?.kind !== 'xsdType' || showDataProp)
        .map((element) => element.data.id)
    )

    if (neighborhoodFocus && selected?.id && visibleNodeIds.has(selected.id)) {
      const focused = new Set([selected.id])
      for (const element of allElements) {
        const data = element.data
        if (!data?.source) continue
        if (!edgeLayerVisible(data.kind)) continue
        if (!visibleNodeIds.has(data.source) || !visibleNodeIds.has(data.target)) continue
        if (data.source === selected.id) focused.add(data.target)
        else if (data.target === selected.id) focused.add(data.source)
      }
      visibleNodeIds = focused
    }

    return allElements.filter((element) => {
      const data = element.data
      if (!data) return false
      if (!data.source) return visibleNodeIds.has(data.id)
      return visibleNodeIds.has(data.source) &&
        visibleNodeIds.has(data.target) &&
        edgeLayerVisible(data.kind)
    })
  }

  function nodeOptionsForCurrentView() {
    return visibleElementsForCurrentView()
      .filter((element) => !element.data?.source)
      .map((element) => ({
        id: element.data.id,
        label: element.data.label ?? localName(element.data.id),
        value: `${element.data.label ?? localName(element.data.id)} | ${localName(element.data.id)}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }

  const focusNodeOptions = $derived(nodeOptionsForCurrentView())

  function applyGraphDisplay() {
    if (!cy) return
    const visible = visibleElementsForCurrentView()
    const visibleIds = new Set(visible.map((element) => element.data.id))

    cy.elements().forEach((element) => {
      element.style('display', visibleIds.has(element.id()) ? 'element' : 'none')
    })
    graphStats = computeGraphStats(visible)
  }

  function relayoutGraph() {
    if (!cy) return
    cy.layout({
      name: 'cose',
      animate: false,
      nodeRepulsion: () => 8000,
      idealEdgeLength: () => 80,
      edgeElasticity: () => 100,
      gravity: 0.4,
      numIter: 1000,
      fit: true,
      padding: 30,
    }).run()
  }

  function fitGraph() {
    if (!cy) return
    const visible = cy.elements().filter((element) => element.style('display') !== 'none')
    cy.fit(visible.length ? visible : cy.elements(), 30)
  }

  function clearSelection() {
    cy?.nodes().unselect()
    selected = null
    neighborhoodFocus = false
  }

  function toggleNeighborhoodFocus() {
    if (!neighborhoodFocus && !selected) return
    neighborhoodFocus = !neighborhoodFocus
  }

  function selectNodeById(id) {
    if (!cy || !id) return
    const node = cy.getElementById(id)
    if (!node.length) return
    cy.nodes().unselect()
    node.select()
    selected = node.data()
    cy.animate({
      center: { eles: node },
      zoom: Math.max(cy.zoom(), 1),
    }, { duration: 250 })
  }

  function computeNeighbors(id) {
    if (!id) return []
    const nodeById = new Map()
    for (const element of allElements) {
      if (!element.data?.source) nodeById.set(element.data.id, element.data)
    }
    const seen = new Map()
    for (const element of allElements) {
      const data = element.data
      if (!data?.source) continue
      if (!edgeLayerVisible(data.kind)) continue
      const isOutgoing = data.source === id
      const isIncoming = data.target === id
      if (!isOutgoing && !isIncoming) continue
      const otherId = isOutgoing ? data.target : data.source
      const otherData = nodeById.get(otherId)
      if (!otherData) continue
      if (!graphScopeNodeVisible(otherData)) continue
      if (otherData.kind === 'xsdType' && !showDataProp) continue
      const key = `${otherId}|${data.kind}|${isOutgoing ? 'out' : 'in'}`
      if (seen.has(key)) continue
      seen.set(key, {
        id: otherId,
        label: otherData.label ?? localName(otherId),
        kind: data.kind,
        edgeLabel: data.label || '',
        direction: isOutgoing ? 'out' : 'in',
      })
    }
    return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label))
  }

  async function copyIri() {
    if (!selected?.iri) return
    try {
      await navigator.clipboard.writeText(selected.iri)
      iriCopied = true
      clearTimeout(iriCopyTimer)
      iriCopyTimer = setTimeout(() => { iriCopied = false }, 1400)
    } catch (e) {
      console.warn('Clipboard copy failed', e)
    }
  }

  function handleScopeChange() {
    clearSelection()
    focusNodeQuery = ''
    applyGraphDisplay()
    relayoutGraph()
  }

  function setGraphScope(value) {
    graphScope = value
    handleScopeChange()
  }

  function setFocusNodeQuery(value) {
    focusNodeQuery = value
  }

  function focusNode() {
    if (!cy) return
    let id = selected?.id

    if (focusNodeQuery.trim()) {
      const query = focusNodeQuery.trim().toLowerCase()
      const match = focusNodeOptions.find((option) => option.value.toLowerCase() === query) ??
        focusNodeOptions.find((option) => option.label.toLowerCase().includes(query))
      id = match?.id
    }

    selectNodeById(id)
  }

  function computeGraphStats(elements) {
    const nodeCounts = new Map()
    const edgeCounts = new Map()
    const graphTerms = new Set()

    for (const element of elements) {
      const data = element.data
      if (!data) continue
      if (data.source && data.target) {
        edgeCounts.set(data.kind, (edgeCounts.get(data.kind) ?? 0) + 1)
      } else {
        nodeCounts.set(data.kind, (nodeCounts.get(data.kind) ?? 0) + 1)
      }
    }

    for (const quad of store) {
      graphTerms.add(quad.graph.value || 'default')
    }

    return {
      quads: store.size,
      graphs: graphTerms.size,
      nodes: elements.filter((element) => !element.data?.source).length,
      edges: elements.filter((element) => element.data?.source).length,
      nodeCounts: [...nodeCounts.entries()].sort(([a], [b]) => a.localeCompare(b)),
      edgeCounts: [...edgeCounts.entries()].sort(([a], [b]) => a.localeCompare(b)),
    }
  }

  $effect(() => {
    // re-run whenever any toggle changes
    showSubClassOf; showObjProp; showDataProp
    showNarrower; showRelated; showInstanceOf
    graphScope
    applyGraphDisplay()
  })

  $effect(() => {
    if (!cy || !selected) {
      neighbors = []
      return
    }
    // re-run when layer toggles or scope change since visibility affects neighbor list
    showSubClassOf; showObjProp; showDataProp
    showNarrower; showRelated; showInstanceOf
    graphScope
    neighborhoodFocus
    neighbors = computeNeighbors(selected.id)
  })

  $effect(() => {
    if (!cy) return
    neighborhoodFocus
    if (neighborhoodFocus) selected?.id
    applyGraphDisplay()
    fitGraph()
  })

  $effect(() => {
    graphNavigation.set({
      available: true,
      scopes: GRAPH_SCOPES,
      scope: graphScope,
      focusNodeQuery,
      focusNodeOptions,
      canCenter: Boolean(focusNodeQuery.trim() || selected),
      setScope: setGraphScope,
      setFocusNodeQuery,
      center: focusNode,
      fit: fitGraph,
      relayout: relayoutGraph,
    })
  })

  function isTypingTarget(node) {
    if (!node) return false
    if (node.isContentEditable) return true
    return ['INPUT', 'TEXTAREA', 'SELECT'].includes(node.tagName)
  }

  function handleGraphKeydown(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return
    if (isTypingTarget(document.activeElement)) return

    switch (event.key) {
      case 'Escape':
        if (selected) {
          event.preventDefault()
          clearSelection()
        }
        return
      case 'f':
      case 'F':
        event.preventDefault()
        fitGraph()
        return
      case 'r':
      case 'R':
        event.preventDefault()
        relayoutGraph()
        return
      case 'c':
      case 'C':
        if (selected || focusNodeQuery.trim()) {
          event.preventDefault()
          focusNode()
        }
        return
    }
  }

  onMount(async () => {
    window.addEventListener('keydown', handleGraphKeydown)
    try {
      const elements = await buildGraphElements(store)
      allElements = elements

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
        if (evt.target === cy) clearSelection()
      })

      applyGraphDisplay()
    } catch (e) {
      error = e.message
      console.error(e)
    } finally {
      loading = false
    }
  })

  onDestroy(() => {
    window.removeEventListener('keydown', handleGraphKeydown)
    clearTimeout(iriCopyTimer)
    resetGraphNavigation()
    cy?.destroy()
  })

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

  <section class="graph-workspace">
    <div class="graph-body">
      <!-- Graph canvas -->
      <div class="canvas" bind:this={container}>
        {#if loading}
          <p class="overlay" aria-busy="true">Building graph…</p>
        {:else if error}
          <p class="overlay error">{error}</p>
        {/if}
      </div>

      <!-- Detail panel -->
      <aside class="detail">
        {#if selected}
          <section class="selection-panel">
            <header class="selection-header">
              <span class="kind-tag">{KIND_LABELS[selected.kind] ?? selected.kind}</span>
              <button type="button" class="close" onclick={clearSelection} aria-label="Clear selection" title="Clear selection (Esc)">✕</button>
            </header>
            <h2 class="selection-title">{selected.label}</h2>

            <AnnotationPanel target={selected}>
              {#snippet between()}
                {#if selected.definition}
                  <p class="description">{selected.definition}</p>
                {/if}

                <dl class="meta">
                  <div class="meta-row iri-row">
                    <dt>IRI</dt>
                    <dd>
                      <a href={selected.iri} target="_blank" rel="noreferrer" title={selected.iri}>{selected.iri}</a>
                      <button type="button" class="copy-btn" onclick={copyIri} aria-label="Copy IRI">
                        {iriCopied ? 'Copied' : 'Copy'}
                      </button>
                    </dd>
                  </div>
                  {#if selected.notation}
                    <div class="meta-row">
                      <dt>Notation</dt>
                      <dd><code>{selected.notation}</code></dd>
                    </div>
                  {/if}
                  {#if selected.scheme}
                    <div class="meta-row">
                      <dt>Scheme</dt>
                      <dd>{localName(selected.scheme).replace('Scheme', '')}</dd>
                    </div>
                  {/if}
                </dl>

                {#if neighbors.length}
                  <section class="neighbors">
                    <header class="connections-header">
                      <h3 class="section-heading">Connections <span class="muted">({neighbors.length})</span></h3>
                      <button
                        type="button"
                        class="focus-btn"
                        class:active={neighborhoodFocus}
                        onclick={toggleNeighborhoodFocus}
                        title={neighborhoodFocus ? 'Show the full graph again' : 'Show only this node and its 1-hop neighbors'}
                      >
                        {neighborhoodFocus ? 'Exit focus' : 'Focus neighborhood'}
                      </button>
                    </header>
                    <ul>
                      {#each neighbors as n}
                        <li>
                          <button
                            type="button"
                            class="neighbor-btn neighbor-{n.direction}"
                            style="--edge-color: {COLORS[n.kind] ?? '#888'}"
                            onclick={() => selectNodeById(n.id)}
                          >
                            {#if n.direction === 'out'}
                              <span class="neighbor-edge">
                                <span class="edge-name">{n.edgeLabel || EDGE_KIND_LABELS[n.kind] || n.kind}</span>
                                <span class="dir" aria-hidden="true">→</span>
                              </span>
                              <span class="neighbor-label">{n.label}</span>
                            {:else}
                              <span class="neighbor-label">{n.label}</span>
                              <span class="neighbor-edge">
                                <span class="dir" aria-hidden="true">←</span>
                                <span class="edge-name">{n.edgeLabel || EDGE_KIND_LABELS[n.kind] || n.kind}</span>
                              </span>
                            {/if}
                          </button>
                        </li>
                      {/each}
                    </ul>
                  </section>
                {/if}
              {/snippet}
            </AnnotationPanel>
          </section>
        {:else}
          {#if graphStats}
            <section class="stats">
              <h4>RDF source</h4>
              <dl>
                <div>
                  <dt>Quads</dt>
                  <dd>{graphStats.quads}</dd>
                </div>
                <div>
                  <dt>Named graphs</dt>
                  <dd>{graphStats.graphs}</dd>
                </div>
              </dl>

              <h4>Visible graph</h4>
              <dl>
                <div>
                  <dt>Nodes</dt>
                  <dd>{graphStats.nodes}</dd>
                </div>
                <div>
                  <dt>Edges</dt>
                  <dd>{graphStats.edges}</dd>
                </div>
              </dl>

              <h4>Node types</h4>
              <ul class="stats-list">
                {#each graphStats.nodeCounts as [kind, count]}
                  <li><span>{kind}</span><strong>{count}</strong></li>
                {/each}
              </ul>

              <h4>Edge types</h4>
              <ul class="stats-list">
                {#each graphStats.edgeCounts as [kind, count]}
                  <li><span>{kind}</span><strong>{count}</strong></li>
                {/each}
              </ul>
            </section>
          {/if}
        {/if}
      </aside>
    </div>
  </section>

</div>

<style>
  .graph-shell {
    display: flex;
    gap: 0;
    height: calc(100vh - 56px);
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

  .graph-workspace {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .graph-body {
    flex: 1;
    min-height: 0;
    display: flex;
  }

  .canvas {
    flex: 1;
    min-width: 0;
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
    width: 360px;
    flex-shrink: 0;
    padding: 0.85rem 0.9rem;
    overflow-y: auto;
    border-left: 1px solid #ffffff18;
    font-size: 0.82rem;
    line-height: 1.4;
  }

  .selection-panel {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }

  .selection-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    margin: 0;
  }

  .kind-tag {
    font-size: 0.66rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--pico-muted-color);
  }

  .close {
    width: 1.6rem;
    height: 1.6rem;
    margin: 0;
    padding: 0;
    border: 1px solid #ffffff30;
    border-radius: 0.3rem;
    background: transparent;
    color: #ddd;
    font-size: 0.8rem;
    line-height: 1;
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .close:hover { background: #ffffff14; color: #fff; }

  .selection-title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    line-height: 1.3;
    text-wrap: balance;
  }

  .description {
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.5;
  }

  .meta {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin: 0;
    padding: 0.5rem 0.6rem;
    border: 1px solid #ffffff14;
    border-radius: 0.35rem;
    background: #ffffff05;
  }

  .meta-row {
    display: grid;
    grid-template-columns: 4.2rem 1fr;
    align-items: baseline;
    gap: 0.5rem;
    font-size: 0.74rem;
  }

  .meta-row dt {
    color: var(--pico-muted-color);
    font-size: 0.66rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .meta-row dd {
    margin: 0;
    word-break: break-word;
  }

  .iri-row dd {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .iri-row a {
    color: inherit;
    opacity: 0.85;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .copy-btn {
    flex-shrink: 0;
    width: auto;
    margin: 0;
    padding: 0.15rem 0.45rem;
    font-size: 0.68rem;
    background: transparent;
    border: 1px solid #ffffff25;
    border-radius: 0.25rem;
    color: inherit;
    cursor: pointer;
  }
  .copy-btn:hover { background: #ffffff10; }

  .section-heading {
    margin: 0 0 0.4rem;
    font-size: 0.78rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--pico-muted-color);
  }

  .muted { opacity: 0.6; font-weight: 400; }

  .connections-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.4rem;
  }

  .connections-header .section-heading {
    margin: 0;
  }

  .focus-btn {
    width: auto;
    margin: 0;
    padding: 0.2rem 0.55rem;
    font-size: 0.7rem;
    font-weight: 500;
    background: transparent;
    border: 1px solid #ffffff25;
    border-radius: 0.25rem;
    color: inherit;
    cursor: pointer;
    white-space: nowrap;
  }
  .focus-btn:hover {
    background: #ffffff10;
    border-color: #ffffff45;
  }
  .focus-btn.active {
    background: #4fc3f720;
    border-color: #4fc3f7;
    color: #cde9fa;
  }
  .focus-btn.active:hover {
    background: #4fc3f730;
  }

  .neighbors ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.25rem;
  }

  .neighbor-btn {
    box-sizing: border-box;
    width: 100%;
    margin: 0;
    padding: 0.4rem 0.55rem 0.4rem 0.6rem;
    background: transparent;
    border: 1px solid #ffffff14;
    border-left: 3px solid var(--edge-color, #888);
    border-radius: 0.3rem;
    color: inherit;
    text-align: left;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 0.18rem;
  }
  .neighbor-btn:hover {
    background: #ffffff0e;
    border-color: #ffffff30;
    border-left-color: var(--edge-color, #888);
  }

  .neighbor-label {
    font-size: 0.85rem;
    font-weight: 500;
    line-height: 1.25;
    color: #ececec;
  }

  .neighbor-edge {
    font-size: 0.7rem;
    color: var(--edge-color, var(--pico-muted-color));
    font-weight: 500;
    letter-spacing: 0.02em;
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .neighbor-edge .dir {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    opacity: 0.85;
  }

  .stats {
    margin-top: 0;
  }

  .stats h4 {
    margin: 0.75rem 0 0.35rem;
    font-size: 0.8rem;
  }

  .stats dl {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin: 0;
  }

  .stats dl div {
    padding: 0.45rem 0.5rem;
    border: 1px solid #ffffff18;
    border-radius: 0.35rem;
  }

  .stats dt {
    color: var(--pico-muted-color);
    font-size: 0.68rem;
  }

  .stats dd {
    margin: 0.1rem 0 0;
    font-weight: 700;
    font-size: 0.92rem;
  }

  .stats-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .stats-list li {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.2rem 0;
    border-bottom: 1px solid #ffffff10;
  }

  .stats-list span {
    color: var(--pico-muted-color);
  }
</style>
