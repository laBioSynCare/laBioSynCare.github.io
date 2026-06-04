<script>
  import { onMount, onDestroy } from 'svelte'
  import { buildGraphElements } from '../../rdf/graph.js'
  import { toCurie, PREFIXES } from '../../rdf/namespaces.js'
  import AnnotationPanel from '../annotation/AnnotationPanel.svelte'
  import { graphSession, saveGraphSession } from './graphSession.js'
  import { graphNavigation, resetGraphNavigation } from '../navigation/graphNavigation.js'

  const { store } = $props()

  let container = $state(null)
  let cy = $state(null)
  let error = $state(null)
  let loading = $state(true)
  let graphStats = $state(null)
  let allElements = $state([])
  let graphScope = $state(graphSession.graphScope)
  let focusNodeQuery = $state(graphSession.focusNodeQuery)

  // Layer visibility
  let showSubClassOf  = $state(graphSession.showSubClassOf)
  let showObjProp     = $state(graphSession.showObjProp)
  let showDataProp    = $state(graphSession.showDataProp)
  let showNarrower    = $state(graphSession.showNarrower)
  let showRelated     = $state(graphSession.showRelated)
  let showInstanceOf  = $state(graphSession.showInstanceOf)

  // Detail panel
  let selected = $state(null)
  let neighbors = $state([])
  let iriCopied = $state(false)
  let iriCopyTimer = null
  let neighborhoodFocus = $state(graphSession.neighborhoodFocus)
  let connectionFilters = $state(new Set(graphSession.connectionFilters))

  // How to place nodes disconnected from the main cluster:
  //   'all'        — grid every node outside the largest connected component
  //   'singletons' — grid only degree-0 nodes; keep multi-node islands in cose
  let strayMode = $state(graphSession.strayMode ?? 'all')

  let visibleSet = new Set()

  const TRANSITION_KEY = 'bsclab.graph.transitionMs'
  const TRANSITION_DEFAULT = 320
  const TRANSITION_EASING = 'ease-in-out-cubic'

  function loadTransitionMs() {
    if (typeof localStorage === 'undefined') return TRANSITION_DEFAULT
    const raw = localStorage.getItem(TRANSITION_KEY)
    if (raw == null) return TRANSITION_DEFAULT
    const n = Number(raw)
    if (!Number.isFinite(n) || n < 0 || n > 2000) return TRANSITION_DEFAULT
    return n
  }

  let transitionMs = $state(loadTransitionMs())

  $effect(() => {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(TRANSITION_KEY, String(transitionMs))
  })

  const KIND_LABELS = {
    owlClass: 'OWL class',
    skosConcept: 'SKOS concept',
    xsdType: 'XSD datatype',
    objectProperty: 'Object property',
    dataProperty: 'Datatype property',
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
    objectProperty: '#ce93d8',
    dataProperty: '#ffcc80',
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
    if (data.kind === 'objectProperty') return COLORS.objectProperty
    if (data.kind === 'dataProperty') return COLORS.dataProperty
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
        selector: 'node[kind="objectProperty"]',
        style: { shape: 'round-rectangle', 'font-size': 10, 'font-style': 'italic' }
      },
      {
        selector: 'node[kind="dataProperty"]',
        style: { shape: 'round-rectangle', 'font-size': 10, 'font-style': 'italic' }
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
    if (graphScope === 'core') return ['owlClass', 'xsdType', 'objectProperty', 'dataProperty'].includes(data.kind)
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

  function applyGraphDisplay({ animate = true } = {}) {
    if (!cy) return null
    const visible = visibleElementsForCurrentView()
    const newIds = new Set(visible.map((element) => element.data.id))
    const shouldAnimate = animate && transitionMs > 0

    cy.elements().forEach((element) => {
      const id = element.id()
      const shouldShow = newIds.has(id)
      const wasShown = visibleSet.has(id)

      if (shouldShow && !wasShown) {
        element.stop(true, false)
        const wasHidden = element.style('display') === 'none'
        element.style('display', 'element')
        if (shouldAnimate) {
          if (wasHidden) element.style('opacity', 0)
          element.animate({ style: { opacity: 1 } }, {
            duration: transitionMs,
            easing: TRANSITION_EASING,
            complete: () => element.removeStyle('opacity'),
          })
        } else {
          element.removeStyle('opacity')
        }
      } else if (!shouldShow && wasShown) {
        element.stop(true, false)
        if (shouldAnimate) {
          element.animate({ style: { opacity: 0 } }, {
            duration: transitionMs,
            easing: TRANSITION_EASING,
            complete: () => {
              element.style('display', 'none')
              element.removeStyle('opacity')
            },
          })
        } else {
          element.style('display', 'none')
          element.removeStyle('opacity')
        }
      } else if (!shouldShow) {
        element.style('display', 'none')
        element.removeStyle('opacity')
      }
    })

    visibleSet = newIds
    graphStats = computeGraphStats(visible)
    return cy.elements().filter((element) => newIds.has(element.id()))
  }

  // A node is a true singleton when none of its currently-visible edges connect
  // it to anything — e.g. an XSD datatype once the data-property layer is hidden.
  function isVisiblyIsolated(node) {
    return node.connectedEdges().filter((edge) => edge.style('display') !== 'none').length === 0
  }

  // Among the visible elements, return the largest connected component (the
  // "core" cluster). Everything outside it — lone single-concept SKOS schemes
  // (PresetGroup, VoiceType…) and small disconnected islands — are "strays".
  function largestComponent(visible) {
    const components = visible.components()
    let core = null
    for (const comp of components) {
      if (!core || comp.nodes().length > core.nodes().length) core = comp
    }
    return core
  }

  // cose tiles disconnected components into a long strip across an edge, leaving
  // the real cluster crammed into one corner. Instead we lay out only the core
  // with cose, then pack the stray nodes into a compact grid beside it so they
  // fill the otherwise-empty space without distorting the cluster.
  function packStrayNodes(strays, core) {
    const bb = core.boundingBox()
    const n = strays.length
    const cols = Math.max(1, Math.round(Math.sqrt(n) * 1.3))
    const rows = Math.ceil(n / cols)
    const cellW = 165
    const cellH = 48
    const blockH = rows * cellH
    const x1 = bb.x2 + 90
    const y1 = bb.y1 + Math.max(0, (bb.h - blockH) / 2)
    strays.layout({
      name: 'grid',
      fit: false,
      avoidOverlap: true,
      cols,
      boundingBox: { x1, y1, x2: x1 + cols * cellW, y2: y1 + blockH },
    }).run()
  }

  const COSE_OPTIONS = {
    name: 'cose',
    animate: false,
    nodeRepulsion: () => 8000,
    idealEdgeLength: () => 80,
    edgeElasticity: () => 100,
    gravity: 0.4,
    numIter: 1000,
    fit: false,
    padding: 30,
  }

  function relayoutGraph() {
    if (!cy) return
    const visible = cy.elements().filter((element) => element.style('display') !== 'none')
    if (!visible.nodes().length) return

    // Choose what gets gridded vs. kept in the force layout (see strayMode).
    let core, strayNodes
    if (strayMode === 'singletons') {
      strayNodes = visible.nodes().filter(isVisiblyIsolated)
      core = visible.not(strayNodes)
    } else {
      core = largestComponent(visible)
      strayNodes = visible.nodes().not(core.nodes())
    }

    // Degenerate case (e.g. every node is a singleton): just tile a grid.
    if (!core.nodes().length) {
      visible.layout({ name: 'grid', fit: false, avoidOverlap: true }).run()
      fitGraph()
      return
    }

    // cose with animate:false runs synchronously, so positions are final here.
    core.layout({ ...COSE_OPTIONS }).run()
    if (strayNodes.length) packStrayNodes(strayNodes, core)
    fitGraph()
  }

  function setStrayMode(value) {
    if (value === strayMode) return
    strayMode = value
    relayoutGraph()
    persistGraphSession()
  }

  function fitGraph(elements = null) {
    if (!cy) return
    const eles = elements ?? cy.elements().filter((element) => element.style('display') !== 'none')
    const target = eles.length ? eles : cy.elements()
    cy.stop(true)
    if (transitionMs <= 0) {
      cy.fit(target, 30)
      return
    }
    cy.animate({ fit: { eles: target, padding: 30 } }, { duration: transitionMs, easing: TRANSITION_EASING })
  }

  function clearSelection() {
    cy?.elements().unselect()
    selected = null
    neighborhoodFocus = false
  }

  function persistGraphSession() {
    saveGraphSession({
      graphScope,
      focusNodeQuery,
      showSubClassOf,
      showObjProp,
      showDataProp,
      showNarrower,
      showRelated,
      showInstanceOf,
      selectedIri: selected?.iri ?? '',
      neighborhoodFocus,
      connectionFilters: [...connectionFilters],
      strayMode,
      camera: cy ? { pan: cy.pan(), zoom: cy.zoom() } : graphSession.camera,
    })
  }

  function toggleNeighborhoodFocus() {
    if (!neighborhoodFocus && !selected) return
    neighborhoodFocus = !neighborhoodFocus
  }

  function toggleConnectionFilter(kind) {
    const next = new Set(connectionFilters)
    if (next.has(kind)) next.delete(kind)
    else next.add(kind)
    connectionFilters = next
  }

  const connectionKinds = $derived.by(() => {
    const counts = new Map()
    for (const n of neighbors) {
      counts.set(n.kind, (counts.get(n.kind) ?? 0) + 1)
    }
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b))
  })

  const filteredNeighbors = $derived(
    neighbors.filter((n) => !connectionFilters.has(n.kind))
  )

  const groupedNeighbors = $derived.by(() => {
    const out = []
    const inc = []
    for (const n of filteredNeighbors) {
      if (n.direction === 'out') out.push(n)
      else inc.push(n)
    }
    return { out, inc }
  })

  function selectNodeById(id) {
    if (!cy || !id) return
    const node = cy.getElementById(id)
    if (!node.length) return
    cy.elements().unselect()
    node.select()
    selected = node.data()
    const zoom = neighborhoodFocus ? cy.zoom() : Math.max(cy.zoom(), 1)
    cy.stop(true)
    if (transitionMs <= 0) {
      cy.zoom(zoom)
      cy.center(node)
      return
    }
    cy.animate({
      center: { eles: node },
      zoom,
    }, { duration: transitionMs, easing: TRANSITION_EASING })
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

  const SSTIM_BASE   = 'https://w3id.org/sstim#'
  const SSTIM_V_BASE = 'https://w3id.org/sstim/vocab#'
  const HASH_PREFER_BASES = [SSTIM_BASE, SSTIM_V_BASE]

  let setupReady = false
  let initialHash = ''

  function resolveHashToNodeId(rawHash) {
    if (!rawHash || !allElements.length) return null
    let value = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash
    try { value = decodeURIComponent(value) } catch { /* keep raw */ }
    if (!value) return null

    if (value.includes(':')) {
      const colon = value.indexOf(':')
      const prefix = value.slice(0, colon)
      const local = value.slice(colon + 1)
      const base = PREFIXES[prefix]
      if (base) {
        const iri = base + local
        const exact = allElements.find((el) => !el.data?.source && el.data?.iri === iri)
        if (exact) return exact.data.id
      }
    }

    const localName = value.includes(':') ? value.slice(value.indexOf(':') + 1) : value
    const candidates = allElements.filter((el) => {
      if (el.data?.source) return false
      const iri = el.data?.iri
      return iri && iri.split(/[#/]/).pop() === localName
    })
    if (!candidates.length) return null
    for (const base of HASH_PREFER_BASES) {
      const match = candidates.find((c) => c.data.iri.startsWith(base))
      if (match) return match.data.id
    }
    if (candidates.length > 1) {
      console.warn('[BSC Lab] Hash matches multiple nodes; using first', {
        hash: rawHash,
        candidates: candidates.map((c) => c.data.iri),
      })
    }
    return candidates[0].data.id
  }

  function hashForIri(iri) {
    if (!iri) return ''
    if (iri.startsWith(SSTIM_BASE) || iri.startsWith(SSTIM_V_BASE)) {
      return '#' + iri.split(/[#/]/).pop()
    }
    const curie = toCurie(iri)
    if (curie === iri) return ''
    return '#' + curie
  }

  function writeHashForSelected() {
    const target = hashForIri(selected?.iri)
    if (window.location.hash === target) return
    if (target === '' && !window.location.hash) return
    const url = window.location.pathname + window.location.search + target
    history.replaceState(null, '', url || window.location.pathname)
  }

  function handleHashChange() {
    if (!cy || !allElements.length) return
    const hash = window.location.hash
    if (!hash) {
      if (selected) clearSelection()
      return
    }
    const id = resolveHashToNodeId(hash)
    if (id && id !== selected?.id) selectNodeById(id)
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
    if (!setupReady) return
    const targets = applyGraphDisplay()
    fitGraph(targets)
  })

  $effect(() => {
    if (!cy || !neighborhoodFocus) return
    selected?.id
    if (!setupReady) return
    applyGraphDisplay()
  })

  $effect(() => {
    graphNavigation.set({
      available: true,
      scopes: GRAPH_SCOPES,
      scope: graphScope,
      focusNodeQuery,
      focusNodeOptions,
      canCenter: Boolean(focusNodeQuery.trim() || selected),
      strayMode,
      setScope: setGraphScope,
      setFocusNodeQuery,
      setStrayMode,
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
    initialHash = window.location.hash
    window.addEventListener('keydown', handleGraphKeydown)
    window.addEventListener('hashchange', handleHashChange)
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
          fit: false,
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

      applyGraphDisplay({ animate: false })
      // Re-run through relayoutGraph so the initial paint gets the same
      // stray-node packing as manual Relayout (the inline cose above only gives
      // the core a first pass and would otherwise tile islands into a strip).
      relayoutGraph()

      if (initialHash) {
        const id = resolveHashToNodeId(initialHash)
        if (id) selectNodeById(id)
      } else if (graphSession.selectedIri) {
        const id = resolveHashToNodeId('#' + graphSession.selectedIri.split(/[#/]/).pop())
        if (id) selectNodeById(id)
      }
      if (!initialHash && graphSession.camera) {
        cy.zoom(graphSession.camera.zoom)
        cy.pan(graphSession.camera.pan)
      }
      setupReady = true
    } catch (e) {
      error = e.message
      console.error(e)
    } finally {
      loading = false
    }
  })

  onDestroy(() => {
    persistGraphSession()
    window.removeEventListener('keydown', handleGraphKeydown)
    window.removeEventListener('hashchange', handleHashChange)
    clearTimeout(iriCopyTimer)
    resetGraphNavigation()
    cy?.destroy()
  })

  $effect(() => {
    selected
    if (!setupReady) return
    writeHashForSelected()
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
      <li><span class="swatch" style="background:{COLORS.owlClass}"></span><span class="legend-label">OWL class</span></li>
      <li><span class="swatch" style="background:{COLORS.skosConcept}"></span><span class="legend-label">SKOS concept</span></li>
      <li><span class="swatch" style="background:{COLORS.xsdType}"></span><span class="legend-label">XSD datatype</span></li>
      <li><span class="swatch" style="background:{COLORS.objectProperty}"></span><span class="legend-label">Object property</span></li>
      <li><span class="swatch" style="background:{COLORS.dataProperty}"></span><span class="legend-label">Datatype property</span></li>
    </ul>

    <strong style="margin-top:1rem;display:block">SKOS schemes</strong>
    <ul class="legend-list">
      {#each Object.entries(SCHEME_COLORS) as [iri, color]}
        {@const schemeName = iri.split('#')[1].replace('Scheme', '')}
        <li><span class="swatch" style="background:{color}"></span><span class="legend-label" title={schemeName}>{schemeName}</span></li>
      {/each}
    </ul>

    <strong style="margin-top:1rem;display:block">Animation</strong>
    <div class="anim-control">
      <div class="anim-label">
        <span>Transition speed</span>
        <span class="anim-value">{transitionMs === 0 ? 'off' : `${transitionMs} ms`}</span>
      </div>
      <input
        type="range"
        min="0"
        max="800"
        step="20"
        bind:value={transitionMs}
        aria-label="Animation duration in milliseconds"
      />
      <small class="anim-hint">Used by fade, pan, and fit. 0 disables animation.</small>
    </div>
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
                      <a href={selected.iri} target="_blank" rel="noreferrer" title={selected.iri}>{toCurie(selected.iri)}</a>
                      <button type="button" class="copy-btn" onclick={copyIri} title={`Copy ${selected.iri}`} aria-label="Copy full IRI">
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
                      <h3 class="section-heading">
                        Connections
                        {#if connectionFilters.size > 0 && filteredNeighbors.length !== neighbors.length}
                          <span class="muted">({filteredNeighbors.length} of {neighbors.length})</span>
                        {:else}
                          <span class="muted">({neighbors.length})</span>
                        {/if}
                      </h3>
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

                    {#if connectionKinds.length > 1}
                      <div class="kind-pills" role="group" aria-label="Filter connections by edge kind">
                        {#each connectionKinds as [kind, count]}
                          <button
                            type="button"
                            class="kind-pill"
                            class:disabled={connectionFilters.has(kind)}
                            style="--edge-color: {COLORS[kind] ?? '#888'}"
                            aria-pressed={!connectionFilters.has(kind)}
                            onclick={() => toggleConnectionFilter(kind)}
                            title={connectionFilters.has(kind) ? `Show ${EDGE_KIND_LABELS[kind] ?? kind}` : `Hide ${EDGE_KIND_LABELS[kind] ?? kind}`}
                          >
                            <span class="dot" aria-hidden="true"></span>
                            {EDGE_KIND_LABELS[kind] ?? kind}
                            <span class="count">{count}</span>
                          </button>
                        {/each}
                      </div>
                    {/if}

                    {#if filteredNeighbors.length === 0}
                      <p class="empty-connections"><small>No connections match the active filters.</small></p>
                    {:else}
                      {#snippet neighborCard(n)}
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
                      {/snippet}

                      {#if groupedNeighbors.out.length}
                        <div class="connection-group">
                          <h4 class="sub-heading">Outgoing <span class="muted">({groupedNeighbors.out.length})</span></h4>
                          <ul>
                            {#each groupedNeighbors.out as n (n.id + '|' + n.kind)}
                              {@render neighborCard(n)}
                            {/each}
                          </ul>
                        </div>
                      {/if}
                      {#if groupedNeighbors.inc.length}
                        <div class="connection-group">
                          <h4 class="sub-heading">Incoming <span class="muted">({groupedNeighbors.inc.length})</span></h4>
                          <ul>
                            {#each groupedNeighbors.inc as n (n.id + '|' + n.kind)}
                              {@render neighborCard(n)}
                            {/each}
                          </ul>
                        </div>
                      {/if}
                    {/if}
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
    height: calc(100vh - var(--app-header-height, 56px) - var(--app-bottom-dock-height, 48px));
    overflow: hidden;
    background: var(--app-bg);
    color: var(--app-text);
  }

  .controls {
    width: 210px;
    flex-shrink: 0;
    padding: 0.75rem;
    overflow-y: auto;
    background: var(--app-surface);
    border-right: var(--app-border-width) solid var(--app-border);
    color: var(--app-text);
    font-size: 0.8rem;
  }

  .controls strong,
  .stats h4 {
    color: var(--app-text-strong);
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
    color: var(--app-text);
  }
  .layer-list label { display: flex; align-items: center; gap: 6px; cursor: pointer; }

  .swatch {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  /* Long scheme/type names (e.g. "StimulationMechanism") get an ellipsis and a
     tooltip instead of being clipped by the fixed-width sidebar. */
  .legend-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .anim-control {
    margin-top: 0.4rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .anim-label {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.4rem;
    font-size: 0.74rem;
    color: var(--pico-muted-color);
  }

  .anim-value {
    font-variant-numeric: tabular-nums;
    color: var(--app-text-strong);
  }

  .anim-control input[type='range'] {
    width: 100%;
    margin: 0;
    accent-color: var(--app-accent);
  }

  .anim-hint {
    color: var(--pico-muted-color);
    font-size: 0.66rem;
    line-height: 1.3;
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
    background: var(--app-canvas);
  }

  .overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--app-muted);
  }
  .overlay.error { color: var(--app-error); }

  .detail {
    width: 360px;
    flex-shrink: 0;
    padding: 0.85rem 0.9rem;
    overflow-y: auto;
    background: var(--app-surface);
    border-left: var(--app-border-width) solid var(--app-border);
    color: var(--app-text);
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
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    background: transparent;
    color: var(--app-text);
    font-size: 0.8rem;
    line-height: 1;
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .close:hover { background: var(--app-accent-soft); color: var(--app-text-strong); border-color: var(--app-accent); }

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
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    background: var(--app-surface-2);
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
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    color: inherit;
    cursor: pointer;
  }
  .copy-btn:hover { background: var(--app-accent-soft); border-color: var(--app-accent); }

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
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    color: inherit;
    cursor: pointer;
    white-space: nowrap;
  }
  .focus-btn:hover {
    background: var(--app-accent-soft);
    border-color: var(--app-accent);
  }
  .focus-btn.active {
    background: var(--app-accent-soft);
    border-color: var(--app-accent);
    color: var(--app-accent);
  }
  .focus-btn.active:hover {
    background: color-mix(in srgb, var(--app-accent-soft) 70%, var(--app-accent) 30%);
  }

  .neighbors ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.25rem;
  }

  .kind-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin: 0 0 0.5rem;
  }

  .kind-pill {
    width: auto;
    margin: 0;
    padding: 0.2rem 0.55rem;
    font-size: 0.7rem;
    font-weight: 500;
    line-height: 1;
    background: color-mix(in srgb, var(--edge-color, #888) 18%, transparent);
    border: 1px solid var(--edge-color, #888);
    border-radius: 0.85rem;
    color: var(--app-text);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.32rem;
  }
  .kind-pill .dot {
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 50%;
    background: var(--edge-color, #888);
    flex-shrink: 0;
  }
  .kind-pill .count {
    font-size: 0.65rem;
    opacity: 0.75;
  }
  .kind-pill:hover { filter: brightness(1.15); }

  .kind-pill.disabled {
    background: transparent;
    border-color: var(--app-border);
    color: var(--pico-muted-color);
  }
  .kind-pill.disabled .dot { opacity: 0.3; }
  .kind-pill.disabled:hover { filter: none; border-color: var(--app-accent); }

  .connection-group + .connection-group {
    margin-top: 0.55rem;
  }

  .sub-heading {
    margin: 0 0 0.3rem;
    font-size: 0.68rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--pico-muted-color);
  }

  .empty-connections {
    margin: 0.4rem 0 0;
    color: var(--pico-muted-color);
  }

  .neighbor-btn {
    box-sizing: border-box;
    width: 100%;
    margin: 0;
    padding: 0.4rem 0.55rem 0.4rem 0.6rem;
    background: transparent;
    border: var(--app-border-width) solid var(--app-border);
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
    background: var(--app-accent-soft);
    border-color: var(--app-accent);
    border-left-color: var(--edge-color, #888);
  }

  .neighbor-label {
    font-size: 0.85rem;
    font-weight: 500;
    line-height: 1.25;
    color: var(--app-text-strong);
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
    border: var(--app-border-width) solid var(--app-border);
    border-radius: var(--app-radius);
    background: var(--app-surface-2);
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
    border-bottom: var(--app-border-width) solid var(--app-border-subtle);
  }

  .stats-list span {
    color: var(--pico-muted-color);
  }
</style>
