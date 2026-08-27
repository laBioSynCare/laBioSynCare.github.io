<script>
  import { onMount, tick } from 'svelte'
  import { version as appVersion } from '$app/environment'
  import { applicationRoute } from '../../config/applicationUrls.js'
  import {
    DEFAULT_SKIN_ID,
    activeSkin,
    applySkin,
    initSkin,
    skins,
  } from '../../ui/theme/skins.js'
  import {
    DEFAULT_AUDIO_ENGINE_ID,
    activeAudioEngineId,
    applyAudioEngine,
    audioEngines,
    detectAudioCapabilities,
    initAudioEnginePreference,
    isAudioEngineSupported,
    resolveAudioEnginePreference,
  } from '../../engines/audio/audioEngines.js'
  import {
    advisoryOpen,
    applyVisualStimulation,
    initVisualStimulation,
    prefersReducedMotion,
    resetPhotoAdvisory,
    visualStimulationOn,
  } from '../../ui/safety/visualSafety.js'
  import { identityState } from '../../identity/identityState.js'
  import { pendingState } from '../../identity/IdentityProvider.js'
  import { getRuntimeConfig, getRuntimeConfigProblems } from '../../config/runtimeConfig.js'
  import {
    INSTANCE_EXPORT_MAX_BYTES,
    applyInstanceExport,
    buildInstanceExport,
    collectInstanceData,
    instanceExportFilename,
    parseInstanceExport,
    summarizeInstanceExport,
  } from '../../portability/instanceExport.js'

  let selectedSkin = $state(DEFAULT_SKIN_ID)
  let selectedEngine = $state(DEFAULT_AUDIO_ENGINE_ID)
  let caps = $state({ webAudio: false, audioWorklet: false, wasm: false })
  let capabilitiesReady = $state(false)
  let visualOn = $state(true)
  let reducedMotion = $state(false)
  let storageReadable = $state(null)
  let storageWritable = $state(null)

  let auth = $state(pendingState('anonymous'))
  let dataSummary = $state(null)
  let dataNote = $state('')
  let importInput = $state(null)
  let pendingImport = $state(null)
  let restoreReview = $state(null)
  let restoreTrigger = $state(null)

  let deployment = $state(getRuntimeConfig())
  let deploymentProblems = $state([])

  let feedback = $state('')
  let feedbackTone = $state('ok')

  const currentUid = $derived(auth.identity.subject)
  const canExportData = $derived(auth.ready && storageReadable === true)
  const canRestoreData = $derived(auth.ready && storageWritable === true)
  const selectedSkinRecord = $derived(
    skins.find((skin) => skin.id === selectedSkin) ?? skins[0],
  )
  const engineResolution = $derived(
    resolveAudioEnginePreference(selectedEngine, caps),
  )
  const summary = $derived(dataSummary ?? {
    logbooks: 0,
    entries: 0,
    annotations: 0,
    patches: 0,
    hasProfile: false,
    legacyEntries: 0,
    hasPreferences: false,
  })
  const identityLabel = $derived.by(() => {
    if (!auth.ready) return 'Checking identity…'
    if (auth.identity.authenticated) {
      return auth.identity.displayName?.trim()
        ? `Signed in as ${auth.identity.displayName.trim()}`
        : 'Signed in'
    }
    return deployment.identity.provider === 'firebase'
      ? 'Not signed in'
      : 'No account system'
  })
  const engineStatus = $derived.by(() => {
    if (!capabilitiesReady) return 'Checking this browser…'
    if (engineResolution.fellBack) {
      return `${engineResolution.selected.name} saved · ${engineResolution.effective.name} will run`
    }
    return `${engineResolution.effective.name} next playback`
  })
  const pendingLogbookMerge = $derived.by(() => {
    const destinations = new Map()
    for (const book of pendingImport?.parsed?.payload?.logbooks ?? []) {
      if (!book?.data || typeof book.data !== 'object') continue
      const destination = book.scope === 'account' && pendingImport.reviewedUid ? 'account' : 'anonymous'
      destinations.set(destination, (destinations.get(destination) ?? 0) + 1)
    }
    const colliding = [...destinations.values()].filter((count) => count > 1)
    return {
      groups: colliding.length,
      sections: colliding.reduce((total, count) => total + count, 0),
    }
  })

  function announce(message, tone = 'ok') {
    feedback = message
    feedbackTone = tone
  }

  function detectBrowserStorageAccess() {
    if (typeof localStorage === 'undefined') return { read: false, write: false }
    let read = false
    try {
      localStorage.getItem('bsclab.settings.storage-read-check')
      read = true
    } catch {
      return { read: false, write: false }
    }

    const key = `bsclab.settings.storage-write-check.${Date.now()}`
    try {
      localStorage.setItem(key, '1')
      if (localStorage.getItem(key) !== '1') return { read, write: false }
      localStorage.removeItem(key)
      if (localStorage.getItem(key) !== null) return { read, write: false }
      return { read, write: true }
    } catch {
      // A browser may permit reads while denying writes (private mode, policy,
      // or a full quota). Export remains useful in that state; restore does not.
      try { localStorage.removeItem(key) } catch { /* storage remains read-only */ }
      return { read, write: false }
    }
  }

  function refreshSummary() {
    if (!storageReadable) {
      dataSummary = summarizeInstanceExport({ logbooks: [], preferences: {} })
      return
    }
    try {
      dataSummary = summarizeInstanceExport(
        collectInstanceData(localStorage, { uid: currentUid }),
      )
    } catch (error) {
      dataSummary = summarizeInstanceExport({ logbooks: [], preferences: {} })
      dataNote = `Could not read browser data: ${error.message}`
    }
  }

  async function exportInstance() {
    if (!auth.ready) {
      dataNote = 'Wait for the identity check to finish before choosing which browser scope to export.'
      announce(dataNote, 'neutral')
      return
    }
    if (!storageReadable) {
      dataNote = 'Browser storage is unavailable, so there is no local export to build.'
      announce(dataNote, 'warn')
      return
    }
    try {
      const reviewedUid = currentUid
      const envelope = await buildInstanceExport(localStorage, {
        uid: reviewedUid,
        appVersion,
      })
      if (!auth.ready || currentUid !== reviewedUid) {
        throw new Error('Your sign-in state changed while the export was being prepared. Try again to export the intended scope.')
      }
      const blob = new Blob([JSON.stringify(envelope, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = instanceExportFilename()
      link.click()
      URL.revokeObjectURL(url)
      dataNote = 'Export downloaded. The file was assembled locally in this browser.'
      announce('Portable data export downloaded.')
    } catch (error) {
      dataNote = `Export failed: ${error.message}`
      announce(dataNote, 'warn')
    }
  }

  async function stageImport(event) {
    const input = event.currentTarget
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    if (!auth.ready) {
      dataNote = 'Wait for the identity check to finish before choosing a restore destination.'
      announce(dataNote, 'neutral')
      return
    }
    if (!storageWritable) {
      dataNote = storageReadable
        ? 'Browser storage can be read but not changed, so restore is unavailable here.'
        : 'Browser storage is unavailable, so this file cannot be restored here.'
      announce(dataNote, 'warn')
      return
    }
    if (file.size > INSTANCE_EXPORT_MAX_BYTES) {
      dataNote = 'Import failed: that file is too large to be an SSTIM Workbench export.'
      announce(dataNote, 'warn')
      return
    }
    try {
      const reviewedUid = currentUid
      const parsed = await parseInstanceExport(await file.text())
      if (!auth.ready || currentUid !== reviewedUid) {
        throw new Error('Your sign-in state changed while the file was being read. Choose it again to review the correct destination.')
      }
      pendingImport = {
        filename: file.name,
        parsed,
        summary: summarizeInstanceExport(parsed.payload),
        sections: {
          annotations: Object.prototype.hasOwnProperty.call(parsed.payload, 'annotations'),
          patches: Object.prototype.hasOwnProperty.call(parsed.payload, 'patches'),
          legacy: Object.prototype.hasOwnProperty.call(parsed.payload, 'legacyLogbookEntries'),
          profile: Object.prototype.hasOwnProperty.call(parsed.payload, 'profile'),
          preferences: Object.prototype.hasOwnProperty.call(parsed.payload, 'preferences'),
        },
        reviewedUid,
        reviewedScope: reviewedUid ? 'the current account’s browser scope' : 'the anonymous browser scope',
      }
      dataNote = ''
      announce(
        parsed.checksumVerified
          ? 'Checksum verified. Review the file contents before restoring.'
          : 'Structurally accepted without a checksum. Review it carefully before restoring.',
        parsed.checksumVerified ? 'neutral' : 'warn',
      )
      await tick()
      restoreReview?.focus()
    } catch (error) {
      pendingImport = null
      dataNote = `Import failed: ${error.message}`
      announce(dataNote, 'warn')
    }
  }

  function confirmImport() {
    if (!pendingImport || !storageWritable) return
    if (!auth.ready || currentUid !== pendingImport.reviewedUid) {
      pendingImport = null
      dataNote = 'Restore cancelled because the sign-in state changed after review. Choose the file again for the current scope.'
      announce(dataNote, 'warn')
      returnFocusToRestoreTrigger()
      return
    }
    try {
      const result = applyInstanceExport(localStorage, pendingImport.parsed, {
        uid: pendingImport.reviewedUid,
      })
      pendingImport = null
      refreshSummary()
      const parts = [
        `${result.restoredLogbooks} logbook scope${result.restoredLogbooks === 1 ? '' : 's'}`,
      ]
      if (result.restoredAnnotations) {
        parts.push(`${result.restoredAnnotations} annotation${result.restoredAnnotations === 1 ? '' : 's'}`)
      } else if (result.replacedAnnotations) {
        parts.push('an empty annotation section')
      }
      if (result.restoredPatches) {
        parts.push(`${result.restoredPatches} patch${result.restoredPatches === 1 ? '' : 'es'}`)
      } else if (result.replacedPatches) {
        parts.push('an empty saved-patch section')
      }
      if (result.restoredLegacyEntries) {
        parts.push(`${result.restoredLegacyEntries} legacy entr${result.restoredLegacyEntries === 1 ? 'y' : 'ies'}`)
      } else if (result.replacedLegacyEntries) {
        parts.push('an empty legacy-logbook section')
      }
      if (result.restoredProfile) parts.push('the local profile')
      if (result.restoredPreferences) parts.push('the appearance preference')
      if (result.clearedPreferences) parts.push('a cleared appearance preference')
      const mergeNote = result.combinedLogbookSections > 1
        ? ` ${result.combinedLogbookSections} file logbook sections shared a destination and were combined; colliding IDs were renamed.`
        : ''
      dataNote = `Restored ${parts.join(', ')}.${mergeNote} Reload to apply restored data across open screens.`
      announce('Portable data restored in this browser.')
      returnFocusToRestoreTrigger()
    } catch (error) {
      dataNote = `Import failed: ${error.message}`
      announce(dataNote, 'warn')
    }
  }

  function cancelImport() {
    pendingImport = null
    announce('Restore cancelled.', 'neutral')
    returnFocusToRestoreTrigger()
  }

  async function returnFocusToRestoreTrigger() {
    // Wait until the conditional review panel has left the DOM; otherwise a
    // disappearing focused descendant can strand keyboard and screen-reader
    // users at the document body.
    await tick()
    restoreTrigger?.focus()
  }

  function selectSkin(id) {
    selectedSkin = applySkin(id, { persist: storageWritable === true })
    const skin = skins.find((item) => item.id === selectedSkin)
    announce(
      storageWritable
        ? `${skin?.name ?? 'Appearance'} applied and saved in this browser.`
        : `${skin?.name ?? 'Appearance'} applied for this page; browser storage is unavailable.`,
      storageWritable ? 'ok' : 'warn',
    )
  }

  function resetSkin() {
    selectSkin(DEFAULT_SKIN_ID)
  }

  function selectEngine(id) {
    const descriptor = audioEngines.find((engine) => engine.id === id)
    if (!isAudioEngineSupported(descriptor, caps)) return
    selectedEngine = applyAudioEngine(id, { persist: storageWritable === true })
    announce(
      storageWritable
        ? `${descriptor.name} saved for the next playback.`
        : `${descriptor.name} selected for this page; browser storage is unavailable.`,
      storageWritable ? 'ok' : 'warn',
    )
  }

  function resetEngine() {
    const preferred = isAudioEngineSupported(
      audioEngines.find((engine) => engine.id === DEFAULT_AUDIO_ENGINE_ID),
      caps,
    )
      ? DEFAULT_AUDIO_ENGINE_ID
      : 'silent'
    selectEngine(preferred)
  }

  function setVisual(on) {
    visualOn = applyVisualStimulation(on, { persist: storageWritable === true })
    const state = visualOn ? 'shown' : 'suppressed'
    announce(
      storageWritable
        ? `Visual output is now ${state}; the choice is saved in this browser.`
        : `Visual output is now ${state} for this page; browser storage is unavailable.`,
      storageWritable ? 'ok' : 'warn',
    )
  }

  function reviewAdvisory() {
    if (storageWritable) resetPhotoAdvisory()
    advisoryOpen.set(true)
    announce('Photosensitivity notice opened.', 'neutral')
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' && pendingImport) cancelImport()
  }

  onMount(() => {
    const access = detectBrowserStorageAccess()
    storageReadable = access.read
    storageWritable = access.write
    reducedMotion = prefersReducedMotion()

    if (storageReadable) {
      try { selectedSkin = initSkin() } catch { selectedSkin = applySkin(DEFAULT_SKIN_ID, { persist: false }) }
      try { selectedEngine = initAudioEnginePreference() } catch { selectedEngine = applyAudioEngine(DEFAULT_AUDIO_ENGINE_ID, { persist: false }) }
      try { visualOn = initVisualStimulation() } catch { visualOn = applyVisualStimulation(!reducedMotion, { persist: false }) }
    } else {
      selectedSkin = applySkin(DEFAULT_SKIN_ID, { persist: false })
      selectedEngine = applyAudioEngine(DEFAULT_AUDIO_ENGINE_ID, { persist: false })
      visualOn = applyVisualStimulation(!reducedMotion, { persist: false })
    }

    caps = detectAudioCapabilities()
    capabilitiesReady = true
    const unsubSkin = activeSkin.subscribe((skinId) => { selectedSkin = skinId })
    const unsubEngine = activeAudioEngineId.subscribe((id) => { selectedEngine = id })
    const unsubVisual = visualStimulationOn.subscribe((on) => { visualOn = on })
    const unsubAuth = identityState.subscribe((value) => {
      auth = value
      refreshSummary()
    })
    deployment = getRuntimeConfig()
    deploymentProblems = getRuntimeConfigProblems()
    refreshSummary()

    return () => {
      unsubSkin()
      unsubEngine()
      unsubVisual()
      unsubAuth()
    }
  })
</script>

<svelte:head>
  <title>Settings | SSTIM Workbench</title>
  <meta
    name="description"
    content="Manage SSTIM Workbench appearance, playback, visual output, portable local data, and instance information."
  />
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<main class="settings-page">
  <header class="settings-hero">
    <div class="hero-copy">
      <p class="eyebrow">This browser · this instance</p>
      <h1>Settings</h1>
      <p class="hero-lede">
        Choose how SSTIM Workbench looks and runs here, review visual-output controls,
        and manage the portable data held by this browser.
      </p>
    </div>
    <div
      class="persistence-card"
      class:unavailable={storageReadable === false || (storageReadable === true && storageWritable === false)}
    >
      <span class="status-dot" aria-hidden="true"></span>
      <div>
        <strong>
          {storageReadable === null
            ? 'Checking browser storage…'
            : storageWritable
              ? 'Changes save automatically'
              : storageReadable
                ? 'Stored data is read-only'
                : 'Browser storage is unavailable'}
        </strong>
        <span>
          {storageReadable === null
            ? 'No storage capability is assumed until this browser check finishes.'
            : storageWritable
            ? 'Skin is exportable; audio-engine and visual-output choices stay only in this browser.'
            : storageReadable
              ? 'Existing browser data can still be exported, but preferences and restored files cannot be saved.'
              : 'Current choices can apply temporarily, but browser-held data cannot be read or changed.'}
        </span>
      </div>
    </div>
  </header>

  <section class="current-strip" aria-labelledby="current-settings-heading">
    <h2 id="current-settings-heading" class="sr-only">Current settings</h2>
    <div class="current-item">
      <span class="current-icon appearance" aria-hidden="true">Aa</span>
      <span><small>Appearance</small><strong>{selectedSkinRecord.name}</strong></span>
    </div>
    <div class="current-item">
      <span class="current-icon audio" aria-hidden="true">◖</span>
      <span><small>Playback</small><strong>{engineStatus}</strong></span>
    </div>
    <div class="current-item">
      <span class="current-icon visual" aria-hidden="true">◉</span>
      <span><small>Visual output</small><strong>{visualOn ? 'Shown' : 'Suppressed'}</strong></span>
    </div>
    <div class="current-item">
      <span class="current-icon data" aria-hidden="true">⌂</span>
      <span><small>Data scope</small><strong>{identityLabel}</strong></span>
    </div>
  </section>

  <div
    class="feedback"
    class:warn={feedbackTone === 'warn'}
    class:neutral={feedbackTone === 'neutral'}
    class:empty={!feedback}
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    {feedback || 'Settings are ready.'}
  </div>

  <div class="settings-layout">
    <aside class="settings-nav-wrap">
      <nav class="settings-nav" aria-label="Settings sections">
        <p>On this page</p>
        <a href="#appearance"><span>01</span> Appearance</a>
        <a href="#audio"><span>02</span> Audio playback</a>
        <a href="#visual"><span>03</span> Visual output</a>
        <a href="#data"><span>04</span> Data &amp; privacy</a>
        <a href="#instance"><span>05</span> This instance</a>
      </nav>
      <div class="local-note">
        <span aria-hidden="true">⌂</span>
        <p>
          <strong>Browser-first</strong>
          Appearance, engine, visual-output, export, and import controls operate
          in this browser. Account-backed features depend on this deployment.
        </p>
      </div>
    </aside>

    <div class="settings-content">
      <section id="appearance" class="setting-section" aria-labelledby="appearance-heading">
        <header class="section-head">
          <span class="section-number">01</span>
          <div>
            <p class="section-kicker">Experience</p>
            <h2 id="appearance-heading">Appearance</h2>
            <p>Preview a complete interface skin. The change applies immediately across SSTIM Workbench.</p>
          </div>
        </header>

        <fieldset class="choice-fieldset">
          <legend class="sr-only">Choose an interface skin</legend>
          <div class="skin-grid">
            {#each skins as skin (skin.id)}
              <label class="skin-card" class:active={selectedSkin === skin.id}>
                <input
                  class="native-choice"
                  type="radio"
                  name="skin"
                  value={skin.id}
                  checked={selectedSkin === skin.id}
                  onchange={() => selectSkin(skin.id)}
                  aria-labelledby={`skin-name-${skin.id}`}
                  aria-describedby={`skin-kind-${skin.id} skin-description-${skin.id} skin-meta-${skin.id}`}
                />
                <span class="choice-head">
                  <span>
                    <strong id={`skin-name-${skin.id}`}>{skin.name}</strong>
                    <small id={`skin-kind-${skin.id}`}>{skin.dark ? 'Dark interface' : 'Light interface'}</small>
                  </span>
                  <span class="choice-mark">{selectedSkin === skin.id ? 'Current' : 'Choose'}</span>
                </span>
                <span class="swatches" aria-hidden="true">
                  {#each skin.swatches as color}<span style={`background:${color}`}></span>{/each}
                </span>
                <span id={`skin-description-${skin.id}`} class="choice-description">{skin.description}</span>
                <span id={`skin-meta-${skin.id}`} class="skin-meta">{skin.font} · {skin.border} border</span>
              </label>
            {/each}
          </div>
        </fieldset>

        <footer class="section-foot">
          <span><strong>Applied now:</strong> {selectedSkinRecord.name}</span>
          <button type="button" class="text-button" onclick={resetSkin} disabled={selectedSkin === DEFAULT_SKIN_ID}>
            Use default
          </button>
        </footer>
      </section>

      <section id="audio" class="setting-section" aria-labelledby="audio-heading">
        <header class="section-head">
          <span class="section-number">02</span>
          <div>
            <p class="section-kicker">Patch Studio</p>
            <h2 id="audio-heading">Audio playback</h2>
            <p>
              Choose the implementation Patch Studio will construct the next time playback starts.
              Changing this does not start audio or interrupt a running session.
            </p>
          </div>
        </header>

        <div class="capability-panel" aria-label="Browser audio capabilities">
          <div class="capability-title">
            <span>Detected in this browser</span>
            <small>Availability is separate from your saved selection.</small>
          </div>
          <div class="capability-grid">
            <div class:available={caps.webAudio}>
              <span class="cap-dot" aria-hidden="true"></span>
              <span><strong>Web Audio</strong><small>{caps.webAudio ? 'Available' : 'Unavailable'}</small></span>
            </div>
            <div class:available={caps.audioWorklet}>
              <span class="cap-dot" aria-hidden="true"></span>
              <span><strong>AudioWorklet</strong><small>{caps.audioWorklet ? 'Available' : 'Unavailable'}</small></span>
            </div>
            <div class:available={caps.wasm}>
              <span class="cap-dot" aria-hidden="true"></span>
              <span><strong>WebAssembly</strong><small>{caps.wasm ? 'Available' : 'Unavailable'}</small></span>
            </div>
          </div>
        </div>

        <fieldset class="choice-fieldset">
          <legend class="sr-only">Choose an audio engine</legend>
          <div class="engine-grid">
            {#each audioEngines as engine (engine.id)}
              {@const supported = isAudioEngineSupported(engine, caps)}
              {@const active = selectedEngine === engine.id}
              <label class="engine-card" class:active class:unavailable={!supported}>
                <input
                  class="native-choice"
                  type="radio"
                  name="audio-engine"
                  value={engine.id}
                  checked={active}
                  disabled={!supported}
                  onchange={() => selectEngine(engine.id)}
                  aria-labelledby={`engine-name-${engine.id}`}
                  aria-describedby={`engine-tagline-${engine.id} engine-description-${engine.id} engine-requirements-${engine.id}`}
                />
                <span class="choice-head">
                  <span>
                    <strong id={`engine-name-${engine.id}`}>{engine.name}</strong>
                    <small id={`engine-tagline-${engine.id}`}>{engine.tagline}</small>
                  </span>
                  <span class="choice-mark">
                    {!supported ? (active ? 'Saved · unavailable' : 'Unavailable') : active ? 'Saved' : 'Choose'}
                  </span>
                </span>
                <span id={`engine-description-${engine.id}`} class="choice-description">{engine.description}</span>
                {#if engine.requires.length}
                  <span id={`engine-requirements-${engine.id}`} class="requirements">Needs {engine.requires.map((item) => item === 'webAudio' ? 'Web Audio' : item === 'audioWorklet' ? 'AudioWorklet' : 'WebAssembly').join(' + ')}</span>
                {:else}
                  <span id={`engine-requirements-${engine.id}`} class="requirements">No audio capability required</span>
                {/if}
              </label>
            {/each}
          </div>
        </fieldset>

        <div class="effective-state" class:warn={engineResolution.fellBack} role="status">
          <span aria-hidden="true">{engineResolution.fellBack ? '!' : '✓'}</span>
          <p>
            <strong>
              {engineResolution.fellBack
                ? `${engineResolution.selected.name} is saved but unavailable here.`
                : `${engineResolution.effective.name} will run next.`}
            </strong>
            {#if engineResolution.fellBack}
              Playback will use {engineResolution.effective.name} unless you choose another available engine.
              The saved preference has not been silently rewritten.
            {:else}
              The selection takes effect when the next Patch Studio playback starts.
            {/if}
          </p>
        </div>

        <footer class="section-foot">
          <span><strong>Saved preference:</strong> {engineResolution.selected.name}</span>
          <button type="button" class="text-button" onclick={resetEngine} disabled={selectedEngine === DEFAULT_AUDIO_ENGINE_ID && caps.webAudio}>
            Use compatible default
          </button>
        </footer>
      </section>

      <section id="visual" class="setting-section" aria-labelledby="visual-heading">
        <header class="section-head">
          <span class="section-number">03</span>
          <div>
            <p class="section-kicker">Output control</p>
            <h2 id="visual-heading">Visual output</h2>
            <p>
              Some Patch Studio output can flash, flicker, or move. This setting controls whether
              visual previews and Mix output render. Audio, editing, and saved patch documents are unaffected.
            </p>
          </div>
        </header>

        <fieldset class="choice-fieldset">
          <legend class="sr-only">Choose whether visual output renders</legend>
          <div class="visual-grid">
            <label class="visual-card" class:active={visualOn}>
              <input
                class="native-choice"
                type="radio"
                name="visual-output"
                value="on"
                checked={visualOn}
                onchange={() => setVisual(true)}
                aria-labelledby="visual-output-on-name"
                aria-describedby="visual-output-on-description"
              />
              <span class="visual-symbol on" aria-hidden="true">◉</span>
              <span>
                <strong id="visual-output-on-name">Show visual output</strong>
                <small id="visual-output-on-description">Visual previews, animation, flashing tracks, and Mix can render.</small>
              </span>
              <span class="choice-mark">{visualOn ? 'Current' : 'Choose'}</span>
            </label>
            <label class="visual-card" class:active={!visualOn}>
              <input
                class="native-choice"
                type="radio"
                name="visual-output"
                value="off"
                checked={!visualOn}
                onchange={() => setVisual(false)}
                aria-labelledby="visual-output-off-name"
                aria-describedby="visual-output-off-description"
              />
              <span class="visual-symbol off" aria-hidden="true">—</span>
              <span>
                <strong id="visual-output-off-name">Suppress visual output</strong>
                <small id="visual-output-off-description">Visual previews and Mix stay hidden; audio and authoring remain available.</small>
              </span>
              <span class="choice-mark">{!visualOn ? 'Current' : 'Choose'}</span>
            </label>
          </div>
        </fieldset>

        <div class="safety-facts">
          <div>
            <small>Current policy</small>
            <strong>{visualOn ? 'Visual output shown' : 'Visual output suppressed'}</strong>
          </div>
          <div>
            <small>System reduced-motion preference</small>
            <strong>{reducedMotion ? 'Requested' : 'Not requested'}</strong>
          </div>
          <button type="button" class="notice-button" onclick={reviewAdvisory}>
            Review photosensitivity notice
          </button>
        </div>
      </section>

      <section id="data" class="setting-section" aria-labelledby="data-heading">
        <header class="section-head">
          <span class="section-number">04</span>
          <div>
            <p class="section-kicker">Portability</p>
            <h2 id="data-heading">Data &amp; privacy</h2>
            <p>
              Build a portable JSON file from data available in this browser, or review and restore
              a compatible SSTIM Workbench export. No signed-in account is required; controls wait until the
              identity provider has resolved so the intended browser scope cannot change mid-action.
            </p>
          </div>
        </header>

        <div class="privacy-banner">
          <span aria-hidden="true">⌂</span>
          <div>
            <strong>The export is assembled locally.</strong>
            <p>
              Clicking export creates a download in this browser; SSTIM Workbench does not upload the file.
              Its checksum detects accidental editing or truncation during a later import; it does
              not prove who created the file.
            </p>
          </div>
        </div>

        <div class="data-counts" aria-label="Portable data currently available">
          <div><strong>{summary.logbooks}</strong><span>Logbooks</span></div>
          <div><strong>{summary.entries}</strong><span>Entries</span></div>
          <div><strong>{summary.annotations}</strong><span>Annotations</span></div>
          <div><strong>{summary.patches}</strong><span>Saved patches</span></div>
        </div>

        <div class="scope-grid">
          <div>
            <h3>Included when present</h3>
            <ul>
              <li>Anonymous and current-account logbook data held in this browser</li>
              <li>Local annotations, saved Patch Studio patches, and legacy logbook entries</li>
              <li>Local profile display fields with private identity fields removed</li>
              <li>The current interface skin</li>
            </ul>
          </div>
          <div>
            <h3>Not included</h3>
            <ul>
              <li>Sign-in subject/UID, email address, credentials, or authentication state</li>
              <li>Cloud-only records that are not available in this browser</li>
              <li>Audio-engine and visual-output preferences</li>
              <li>Anything outside the documented portable sections</li>
            </ul>
          </div>
        </div>

        <p class="scope-note">
          <strong>Current scope:</strong> {identityLabel}.
          {#if !auth.ready}
            Export and restore remain disabled until the destination scope is known.
          {:else if auth.identity.authenticated}
            The export can include both anonymous browser data and the current account’s browser-held logbook scope.
          {:else}
            The export uses the anonymous browser scope.
          {/if}
          The file can contain personal writing and authored patches; protect it accordingly.
        </p>

        <p class="scope-note">
          Moving between the two SSTIM Workbench addresses? Browser storage is separate per
          address, so each holds its own copy of everything.
          <a href={applicationRoute('/transition/')}>How to carry your data across</a>.
        </p>

        <div class="data-actions">
          <button
            type="button"
            class="primary-button"
            onclick={exportInstance}
            disabled={!canExportData}
            title={!auth.ready ? 'Waiting for identity' : !storageReadable ? 'Browser storage cannot be read' : undefined}
          >
            Export browser data
          </button>
          <button
            bind:this={restoreTrigger}
            type="button"
            class="secondary-button"
            onclick={() => importInput?.click()}
            disabled={!canRestoreData}
            title={!auth.ready ? 'Waiting for identity' : !storageWritable ? 'Browser storage cannot be changed' : undefined}
          >
            Restore from file
          </button>
          <input
            bind:this={importInput}
            type="file"
            accept="application/json,.json"
            onchange={stageImport}
            disabled={!canRestoreData}
            hidden
          />
          <span>
            {#if !auth.ready}
              Waiting for the identity check; no account is required.
            {:else if storageReadable && !storageWritable}
              Export is available; restore needs writable browser storage.
            {:else}
              No data is sent merely by choosing either action.
            {/if}
          </span>
        </div>

        {#if pendingImport}
          <section
            class="restore-review"
            aria-labelledby="restore-heading"
            tabindex="-1"
            bind:this={restoreReview}
          >
            <div class="restore-head">
              <span aria-hidden="true">!</span>
              <div>
                <p class="section-kicker">
                  {pendingImport.parsed.checksumVerified ? 'Checksum verified' : 'No checksum provided'}
                </p>
                <h3 id="restore-heading">Restore {pendingImport.filename}?</h3>
              </div>
            </div>
            {#if pendingImport.parsed.checksumVerified}
              <p class="integrity-note">
                The checksum matches this payload, so accidental editing or truncation was not detected.
                A checksum is an integrity check, not proof of the file’s author or source.
              </p>
            {:else}
              <p class="integrity-note unverified">
                <strong>Integrity was not verified.</strong> The file has a compatible structure but no
                checksum. Its documented portable sections passed safety and structural checks, but this
                is not proof of a complete domain schema or source. Continue only if you understand and
                trust its contents.
              </p>
            {/if}
            <p>
              This file contains {pendingImport.summary.logbooks} logbook{pendingImport.summary.logbooks === 1 ? '' : 's'},
              {pendingImport.summary.entries} entr{pendingImport.summary.entries === 1 ? 'y' : 'ies'},
              {pendingImport.summary.annotations} annotation{pendingImport.summary.annotations === 1 ? '' : 's'}, and
              {pendingImport.summary.patches} patch{pendingImport.summary.patches === 1 ? '' : 'es'}.
            </p>
            {#if pendingImport.sections.annotations || pendingImport.sections.patches || pendingImport.sections.legacy || pendingImport.sections.profile || pendingImport.sections.preferences}
              <div class="restore-effects">
                <strong>Portable-section effects</strong>
                <ul>
                  {#if pendingImport.sections.annotations}
                    <li>Replace local annotations with {pendingImport.summary.annotations} record{pendingImport.summary.annotations === 1 ? '' : 's'}.</li>
                  {/if}
                  {#if pendingImport.sections.patches}
                    <li>Replace saved patches with {pendingImport.summary.patches} record{pendingImport.summary.patches === 1 ? '' : 's'}.</li>
                  {/if}
                  {#if pendingImport.sections.legacy}
                    <li>Replace legacy logbook data with {pendingImport.summary.legacyEntries} entr{pendingImport.summary.legacyEntries === 1 ? 'y' : 'ies'}.</li>
                  {/if}
                  {#if pendingImport.sections.profile}<li>Replace the local profile.</li>{/if}
                  {#if pendingImport.sections.preferences}
                    <li>{pendingImport.summary.hasPreferences ? 'Restore the file’s appearance preference.' : 'Clear the saved appearance preference.'}</li>
                  {/if}
                </ul>
              </div>
            {/if}
            {#if pendingLogbookMerge.sections > 1}
              <p class="merge-note">
                <strong>Logbook scope merge:</strong> {pendingLogbookMerge.sections} file sections map to
                {pendingLogbookMerge.groups === 1 ? ' the same browser scope' : ' shared browser scopes'}.
                Their v2 logbooks and entries will be combined, and colliding IDs will be renamed
                deterministically. If they cannot be combined safely, nothing will be restored.
              </p>
            {/if}
            <p>
              Matching logbook scopes and portable sections present in the file will be overwritten.
              Sections absent from the file are left unchanged. Export first if you need a rollback file.
            </p>
            <p class="merge-note">
              <strong>Reviewed destination:</strong> {pendingImport.reviewedScope}.
              If the sign-in state changes before confirmation, SSTIM Workbench cancels the restore and asks you
              to review the file again.
            </p>
            <div class="restore-actions">
              <button
                type="button"
                class="danger-button"
                onclick={confirmImport}
                disabled={!auth.ready || currentUid !== pendingImport.reviewedUid || !storageWritable}
              >Restore file</button>
              <button type="button" class="secondary-button" onclick={cancelImport}>Cancel</button>
              <small>Esc also cancels.</small>
            </div>
          </section>
        {/if}

        {#if dataNote}
          <p class="data-note" role="status" aria-live="polite">{dataNote}</p>
        {/if}
        {#if summary.legacyEntries > 0}
          <p class="legacy-note">The export also includes {summary.legacyEntries} unmigrated legacy entr{summary.legacyEntries === 1 ? 'y' : 'ies'}.</p>
        {/if}
      </section>

      <section id="instance" class="setting-section" aria-labelledby="instance-heading">
        <header class="section-head">
          <span class="section-number">05</span>
          <div>
            <p class="section-kicker">Deployment</p>
            <h2 id="instance-heading">This instance</h2>
            <p>
              Runtime configuration chosen by whoever deployed this copy of SSTIM Workbench.
              These facts describe available services; they are not personal settings.
            </p>
          </div>
        </header>

        <dl class="instance-grid">
          <div>
            <dt>Instance</dt>
            <dd>
              <strong>{deployment.instance.name}</strong>
              {#if deployment.instance.id}<code>{deployment.instance.id}</code>{/if}
            </dd>
          </div>
          <div>
            <dt>Identity</dt>
            <dd>
              <strong>{deployment.identity.provider === 'firebase' ? 'Accounts available' : 'No account system'}</strong>
              <span>{identityLabel}</span>
            </dd>
          </div>
          <div>
            <dt>Patch storage</dt>
            <dd>
              <strong>{deployment.storage.provider === 'firestore' ? 'Browser + account' : 'Browser only'}</strong>
              <span>{deployment.storage.provider === 'firestore' ? 'Account storage is used when signed in.' : 'Saved patches stay on this device.'}</span>
            </dd>
          </div>
          <div>
            <dt>Build</dt>
            <dd><strong><code>{appVersion}</code></strong><span>Application build identifier</span></dd>
          </div>
        </dl>

        <div class="network-note">
          <strong>Where network access can occur</strong>
          <p>
            Opening and navigating SSTIM Workbench can request application assets, public RDF, and documentation
            from this deployment’s origin. Sign-in and account-backed storage can contact the configured
            Firebase services. Enabling the optional live stakeholder network in Graph or SPARQL fetches its stated
            external source. Export generation and import review run in this browser and do not upload the
            chosen file; following an external link contacts that link’s site.
          </p>
        </div>

        {#if deploymentProblems.length > 0}
          <div class="deployment-problems" role="status">
            <p>
              <strong>Some deployment configuration was not applied.</strong>
              SSTIM Workbench used local-capable defaults for the affected services:
            </p>
            <ul>
              {#each deploymentProblems as problem (problem)}<li>{problem}</li>{/each}
            </ul>
          </div>
        {:else}
          <p class="configuration-ok"><span aria-hidden="true">✓</span> Runtime configuration loaded without reported problems.</p>
        {/if}
      </section>
    </div>
  </div>
</main>

<style>
  :global(html) { scroll-behavior: smooth; }

  .settings-page {
    min-height: calc(100vh - var(--app-header-height, 56px));
    padding: clamp(1.25rem, 3vw, 2.5rem);
    padding-bottom: 5rem;
    background:
      radial-gradient(circle at 5% 0%, color-mix(in srgb, var(--app-accent) 14%, transparent), transparent 28rem),
      radial-gradient(circle at 95% 18%, color-mix(in srgb, var(--app-visual) 8%, transparent), transparent 30rem),
      var(--app-bg);
    color: var(--app-text);
  }

  .settings-hero,
  .current-strip,
  .feedback,
  .settings-layout {
    width: min(78rem, 100%);
    margin-inline: auto;
  }

  .settings-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(17rem, 25rem);
    gap: 2rem;
    align-items: end;
    margin-bottom: 1.5rem;
  }

  .eyebrow,
  .section-kicker {
    margin: 0 0 0.35rem;
    color: var(--app-accent);
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    color: var(--app-text-strong);
    font-size: clamp(2.25rem, 6vw, 4.6rem);
    line-height: 0.95;
    letter-spacing: -0.045em;
  }

  .hero-lede {
    max-width: 43rem;
    margin: 1rem 0 0;
    color: var(--app-muted);
    font-size: clamp(0.95rem, 1.6vw, 1.12rem);
    line-height: 1.6;
  }

  .persistence-card {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.8rem;
    align-items: start;
    padding: 1rem;
    border: var(--app-border-width) solid color-mix(in srgb, var(--app-ok) 38%, var(--app-border));
    border-radius: calc(var(--app-radius) + 6px);
    background: color-mix(in srgb, var(--app-ok) 7%, var(--app-surface));
  }

  .persistence-card.unavailable {
    border-color: color-mix(in srgb, var(--app-warn) 45%, var(--app-border));
    background: color-mix(in srgb, var(--app-warn) 8%, var(--app-surface));
  }

  .status-dot,
  .cap-dot {
    width: 0.62rem;
    height: 0.62rem;
    margin-top: 0.25rem;
    border-radius: 50%;
    background: var(--app-ok);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--app-ok) 16%, transparent);
  }

  .unavailable .status-dot { background: var(--app-warn); box-shadow: none; }
  .persistence-card strong { display: block; color: var(--app-text-strong); font-size: 0.88rem; }
  .persistence-card span:last-child { display: block; margin-top: 0.25rem; color: var(--app-muted); font-size: 0.78rem; line-height: 1.45; }

  .current-strip {
    display: grid;
    grid-template-columns: 0.9fr 1.25fr 0.9fr 0.9fr;
    background: var(--app-surface);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) + 6px);
    overflow: hidden;
  }

  .current-item {
    min-width: 0;
    display: grid;
    grid-template-columns: 2rem minmax(0, 1fr);
    gap: 0.7rem;
    align-items: center;
    padding: 0.85rem 1rem;
    border-right: 1px solid var(--app-border-subtle);
  }
  .current-item:last-child { border-right: 0; }
  .current-item > span:last-child { min-width: 0; }
  .current-item small { display: block; color: var(--app-muted); font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.07em; }
  .current-item strong { display: block; margin-top: 0.12rem; color: var(--app-text-strong); font-size: 0.82rem; line-height: 1.25; }

  .current-icon {
    width: 2rem;
    height: 2rem;
    display: grid;
    place-items: center;
    border-radius: 0.55rem;
    background: var(--app-accent-soft);
    color: var(--app-accent);
    font-size: 0.72rem;
    font-weight: 800;
  }
  .current-icon.audio { color: var(--app-audio); background: color-mix(in srgb, var(--app-audio) 13%, transparent); }
  .current-icon.visual { color: var(--app-visual); background: color-mix(in srgb, var(--app-visual) 13%, transparent); }
  .current-icon.data { color: var(--app-haptic); background: color-mix(in srgb, var(--app-haptic) 13%, transparent); }

  .feedback {
    min-height: 2.15rem;
    margin-top: 0.65rem;
    padding: 0.45rem 0.75rem;
    color: var(--app-ok);
    font-size: 0.78rem;
    font-weight: 650;
  }
  .feedback.warn { color: var(--app-warn); }
  .feedback.neutral { color: var(--app-muted); }
  .feedback.empty { visibility: hidden; }

  .settings-layout {
    display: grid;
    grid-template-columns: 13.5rem minmax(0, 1fr);
    gap: clamp(1.25rem, 3vw, 2.5rem);
    align-items: start;
  }

  .settings-nav-wrap { position: sticky; top: calc(var(--app-header-height, 56px) + 1rem); }
  .settings-nav {
    display: grid;
    gap: 0.2rem;
    padding: 0.8rem;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) + 4px);
    background: color-mix(in srgb, var(--app-surface) 92%, transparent);
  }
  .settings-nav p { margin: 0.25rem 0.55rem 0.5rem; color: var(--app-muted); font-size: 0.68rem; font-weight: 800; letter-spacing: 0.09em; text-transform: uppercase; }
  .settings-nav a {
    display: grid;
    grid-template-columns: 1.6rem 1fr;
    gap: 0.45rem;
    align-items: center;
    padding: 0.6rem;
    border-radius: var(--app-radius);
    color: var(--app-muted);
    font-size: 0.79rem;
    font-weight: 650;
    text-decoration: none;
  }
  .settings-nav a span { color: var(--app-text); font-family: var(--app-font-mono); font-size: 0.68rem; }
  .settings-nav a:hover { background: var(--app-surface-2); color: var(--app-text-strong); }

  .local-note {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.65rem;
    margin-top: 0.75rem;
    padding: 0.85rem;
    border-left: 2px solid var(--app-haptic);
    color: var(--app-muted);
    font-size: 0.72rem;
    line-height: 1.45;
  }
  .local-note > span { color: var(--app-haptic); font-size: 1rem; }
  .local-note p { margin: 0; }
  .local-note strong { display: block; margin-bottom: 0.18rem; color: var(--app-text-strong); }

  .settings-content { min-width: 0; display: grid; gap: 1rem; }
  .setting-section {
    scroll-margin-top: calc(var(--app-header-height, 56px) + 1rem);
    padding: clamp(1.1rem, 2.5vw, 1.75rem);
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) + 7px);
    background: color-mix(in srgb, var(--app-surface) 96%, transparent);
    box-shadow: 0 0.6rem 1.8rem color-mix(in srgb, var(--app-bg) 75%, transparent);
  }

  .section-head {
    display: grid;
    grid-template-columns: 2.5rem minmax(0, 1fr);
    gap: 0.85rem;
    align-items: start;
    margin-bottom: 1.25rem;
  }
  .section-number { padding-top: 0.1rem; color: var(--app-text); font-family: var(--app-font-mono); font-size: 0.76rem; }
  .section-head h2 { margin: 0; color: var(--app-text-strong); font-size: clamp(1.25rem, 2vw, 1.65rem); letter-spacing: -0.02em; }
  .section-head p:last-child { max-width: 49rem; margin: 0.45rem 0 0; color: var(--app-muted); font-size: 0.88rem; line-height: 1.55; }
  .choice-fieldset { min-width: 0; margin: 0; padding: 0; border: 0; }

  .skin-grid,
  .engine-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.7rem;
  }

  .skin-card,
  .engine-card,
  .visual-card {
    position: relative;
    min-width: 0;
    margin: 0;
    border: var(--app-border-width) solid var(--app-border);
    border-radius: calc(var(--app-radius) + 4px);
    background: var(--app-bg);
    color: var(--app-text);
    cursor: pointer;
    transition: border-color 0.14s ease, background 0.14s ease, transform 0.14s ease;
  }
  .skin-card,
  .engine-card { display: flex; flex-direction: column; gap: 0.75rem; padding: 0.9rem; }
  .skin-card:hover,
  .engine-card:hover:not(.unavailable),
  .visual-card:hover { transform: translateY(-1px); border-color: var(--app-accent); }
  .skin-card.active,
  .engine-card.active,
  .visual-card.active { border-color: var(--app-accent); background: color-mix(in srgb, var(--app-accent-soft) 45%, var(--app-bg)); }
  .skin-card:has(.native-choice:focus-visible),
  .engine-card:has(.native-choice:focus-visible),
  .visual-card:has(.native-choice:focus-visible) { outline: 3px solid var(--app-accent); outline-offset: 2px; }
  .native-choice { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }

  .choice-head { display: flex; justify-content: space-between; gap: 0.7rem; align-items: flex-start; }
  .choice-head strong { display: block; color: var(--app-text-strong); font-size: 0.9rem; }
  .choice-head small { display: block; margin-top: 0.15rem; color: var(--app-muted); font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
  .choice-mark {
    flex-shrink: 0;
    padding: 0.2rem 0.42rem;
    border: 1px solid var(--app-border);
    border-radius: 999px;
    color: var(--app-muted);
    font-size: 0.58rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .active .choice-mark { border-color: var(--app-accent); background: var(--app-accent-soft); color: var(--app-accent); }
  .swatches { height: 2.6rem; display: grid; grid-template-columns: repeat(5, 1fr); overflow: hidden; border: 1px solid var(--app-border); border-radius: var(--app-radius); }
  .choice-description { min-height: 2.5em; color: var(--app-muted); font-size: 0.76rem; line-height: 1.4; }
  .skin-meta,
  .requirements { margin-top: auto; color: var(--app-text); font-size: 0.66rem; }

  .section-foot {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: center;
    margin-top: 1rem;
    padding-top: 0.8rem;
    border-top: 1px solid var(--app-border-subtle);
    color: var(--app-muted);
    font-size: 0.75rem;
  }
  .section-foot strong { color: var(--app-text-strong); }
  .text-button,
  .notice-button {
    width: auto;
    margin: 0;
    padding: 0.42rem 0.65rem;
    border: 1px solid var(--app-border);
    border-radius: var(--app-radius);
    background: transparent;
    color: var(--app-text);
    font-size: 0.72rem;
    font-weight: 700;
  }
  .text-button:hover:not(:disabled),
  .notice-button:hover { border-color: var(--app-accent); background: var(--app-accent-soft); color: var(--app-accent); }

  .capability-panel {
    margin-bottom: 0.85rem;
    padding: 0.8rem;
    border: 1px solid var(--app-border);
    border-radius: calc(var(--app-radius) + 3px);
    background: var(--app-surface-2);
  }
  .capability-title { display: flex; justify-content: space-between; gap: 1rem; margin-bottom: 0.65rem; }
  .capability-title > span { color: var(--app-text-strong); font-size: 0.78rem; font-weight: 750; }
  .capability-title small { color: var(--app-text); font-size: 0.68rem; }
  .capability-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.45rem; }
  .capability-grid > div { display: grid; grid-template-columns: auto 1fr; gap: 0.5rem; align-items: center; padding: 0.5rem; border-radius: var(--app-radius); background: var(--app-surface); }
  .capability-grid strong,
  .capability-grid small { display: block; font-size: 0.68rem; }
  .capability-grid small { color: var(--app-text); }
  .cap-dot { width: 0.48rem; height: 0.48rem; margin: 0; background: var(--app-error); box-shadow: none; }
  .available .cap-dot { background: var(--app-ok); }
  .engine-card.unavailable { cursor: not-allowed; opacity: 0.58; }

  .effective-state {
    display: grid;
    grid-template-columns: 1.75rem 1fr;
    gap: 0.65rem;
    align-items: start;
    margin-top: 0.85rem;
    padding: 0.75rem;
    border: 1px solid color-mix(in srgb, var(--app-ok) 38%, var(--app-border));
    border-radius: calc(var(--app-radius) + 3px);
    background: color-mix(in srgb, var(--app-ok) 7%, var(--app-surface));
  }
  .effective-state > span { width: 1.6rem; height: 1.6rem; display: grid; place-items: center; border-radius: 50%; background: color-mix(in srgb, var(--app-ok) 15%, transparent); color: var(--app-ok); font-weight: 800; }
  .effective-state p { margin: 0; color: var(--app-text); font-size: 0.75rem; line-height: 1.45; }
  .effective-state strong { display: block; color: var(--app-text-strong); }
  .effective-state.warn { border-color: color-mix(in srgb, var(--app-warn) 42%, var(--app-border)); background: color-mix(in srgb, var(--app-warn) 8%, var(--app-surface)); }
  .effective-state.warn > span { color: var(--app-warn); background: color-mix(in srgb, var(--app-warn) 14%, transparent); }

  .visual-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.7rem; }
  .visual-card { display: grid; grid-template-columns: 2.4rem minmax(0, 1fr) auto; gap: 0.75rem; align-items: center; padding: 1rem; }
  .visual-card strong { display: block; color: var(--app-text-strong); font-size: 0.86rem; }
  .visual-card small { display: block; margin-top: 0.2rem; color: var(--app-text); font-size: 0.72rem; line-height: 1.4; }
  .visual-symbol { width: 2.4rem; height: 2.4rem; display: grid; place-items: center; border-radius: 50%; font-size: 1rem; }
  .visual-symbol.on { color: var(--app-visual); background: color-mix(in srgb, var(--app-visual) 14%, transparent); }
  .visual-symbol.off { color: var(--app-muted); background: var(--app-surface-2); }
  .safety-facts { display: grid; grid-template-columns: 1fr 1fr auto; gap: 0.65rem; align-items: stretch; margin-top: 0.85rem; }
  .safety-facts > div { padding: 0.7rem; border-radius: var(--app-radius); background: var(--app-surface-2); }
  .safety-facts small,
  .safety-facts strong { display: block; }
  .safety-facts small { color: var(--app-text); font-size: 0.65rem; }
  .safety-facts strong { margin-top: 0.18rem; color: var(--app-text-strong); font-size: 0.74rem; }
  .notice-button { align-self: stretch; }

  .privacy-banner {
    display: grid;
    grid-template-columns: 2.2rem 1fr;
    gap: 0.75rem;
    padding: 0.9rem;
    border: 1px solid color-mix(in srgb, var(--app-haptic) 38%, var(--app-border));
    border-radius: calc(var(--app-radius) + 3px);
    background: color-mix(in srgb, var(--app-haptic) 7%, var(--app-surface));
  }
  .privacy-banner > span { width: 2.2rem; height: 2.2rem; display: grid; place-items: center; border-radius: 50%; background: color-mix(in srgb, var(--app-haptic) 14%, transparent); color: var(--app-haptic); }
  .privacy-banner strong { color: var(--app-text-strong); font-size: 0.82rem; }
  .privacy-banner p { margin: 0.2rem 0 0; color: var(--app-text); font-size: 0.75rem; line-height: 1.45; }
  .data-counts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; margin-top: 0.8rem; }
  .data-counts div { padding: 0.75rem; border: 1px solid var(--app-border); border-radius: var(--app-radius); background: var(--app-bg); }
  .data-counts strong { display: block; color: var(--app-text-strong); font-size: 1.25rem; line-height: 1; }
  .data-counts span { display: block; margin-top: 0.35rem; color: var(--app-text); font-size: 0.68rem; }
  .scope-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.7rem; margin-top: 0.8rem; }
  .scope-grid > div { padding: 0.85rem; border-radius: var(--app-radius); background: var(--app-surface-2); }
  .scope-grid h3 { margin: 0; color: var(--app-text-strong); font-size: 0.76rem; }
  .scope-grid ul { margin: 0.55rem 0 0; padding-left: 1.05rem; color: var(--app-text); font-size: 0.7rem; line-height: 1.5; }
  .scope-note { margin: 0.8rem 0 0; color: var(--app-text); font-size: 0.72rem; line-height: 1.5; }
  .scope-note strong { color: var(--app-text-strong); }

  .data-actions,
  .restore-actions { display: flex; flex-wrap: wrap; gap: 0.55rem; align-items: center; margin-top: 0.85rem; }
  .data-actions > span,
  .restore-actions small { color: var(--app-text); font-size: 0.66rem; }
  .primary-button,
  .secondary-button,
  .danger-button {
    width: auto;
    margin: 0;
    padding: 0.56rem 0.85rem;
    border-radius: var(--app-radius);
    font-size: 0.75rem;
    font-weight: 750;
  }
  .primary-button { border: 1px solid var(--app-accent); background: var(--app-accent); color: var(--app-on-accent); }
  .secondary-button { border: 1px solid var(--app-border); background: transparent; color: var(--app-text); }
  .secondary-button:hover:not(:disabled) { border-color: var(--app-accent); background: var(--app-accent-soft); }
  .danger-button { border: 1px solid var(--app-error); background: var(--app-error); color: var(--app-bg); }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  .restore-review { margin-top: 0.9rem; padding: 1rem; border: 1px solid color-mix(in srgb, var(--app-warn) 48%, var(--app-border)); border-radius: calc(var(--app-radius) + 4px); background: color-mix(in srgb, var(--app-warn) 7%, var(--app-surface)); }
  .restore-head { display: grid; grid-template-columns: 2rem 1fr; gap: 0.65rem; align-items: center; }
  .restore-head > span { width: 2rem; height: 2rem; display: grid; place-items: center; border-radius: 50%; background: color-mix(in srgb, var(--app-warn) 16%, transparent); color: var(--app-warn); font-weight: 900; }
  .restore-head h3 { margin: 0; color: var(--app-text-strong); font-size: 0.9rem; overflow-wrap: anywhere; }
  .restore-review > p { margin: 0.6rem 0 0; color: var(--app-muted); font-size: 0.74rem; line-height: 1.5; }
  .restore-review > .integrity-note,
  .restore-review > .merge-note { padding: 0.65rem 0.75rem; border-radius: var(--app-radius); }
  .restore-review > .integrity-note { border-left: 2px solid var(--app-ok); background: color-mix(in srgb, var(--app-ok) 7%, var(--app-surface)); }
  .restore-review > .integrity-note.unverified { border-left-color: var(--app-warn); background: color-mix(in srgb, var(--app-warn) 10%, var(--app-surface)); }
  .restore-review > .merge-note { border-left: 2px solid var(--app-accent); background: var(--app-surface-2); }
  .restore-review > .integrity-note strong,
  .restore-review > .merge-note strong { color: var(--app-text-strong); }
  .restore-effects { margin-top: 0.6rem; padding: 0.65rem 0.75rem; border-radius: var(--app-radius); background: var(--app-surface-2); color: var(--app-muted); font-size: 0.72rem; }
  .restore-effects > strong { color: var(--app-text-strong); }
  .restore-effects ul { margin: 0.35rem 0 0; padding-left: 1.05rem; line-height: 1.5; }
  .data-note,
  .legacy-note { margin: 0.75rem 0 0; padding: 0.65rem 0.75rem; border-radius: var(--app-radius); font-size: 0.72rem; }
  .data-note { background: var(--app-accent-soft); color: var(--app-accent); }
  .legacy-note { background: color-mix(in srgb, var(--app-warn) 9%, transparent); color: var(--app-warn); }

  .instance-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem; margin: 0; }
  .instance-grid > div { padding: 0.85rem; border: 1px solid var(--app-border); border-radius: var(--app-radius); background: var(--app-bg); }
  .instance-grid dt { color: var(--app-muted); font-size: 0.65rem; font-weight: 750; letter-spacing: 0.06em; text-transform: uppercase; }
  .instance-grid dd { margin: 0.3rem 0 0; }
  .instance-grid strong,
  .instance-grid span,
  .instance-grid code { display: block; }
  .instance-grid strong { color: var(--app-text-strong); font-size: 0.8rem; }
  .instance-grid span,
  .instance-grid code { margin-top: 0.2rem; color: var(--app-muted); font-size: 0.68rem; overflow-wrap: anywhere; }
  .network-note { margin-top: 0.75rem; padding: 0.8rem; border-left: 2px solid var(--app-accent); background: var(--app-surface-2); }
  .network-note strong { color: var(--app-text-strong); font-size: 0.76rem; }
  .network-note p { margin: 0.2rem 0 0; color: var(--app-muted); font-size: 0.7rem; line-height: 1.45; }
  .deployment-problems { margin-top: 0.75rem; padding: 0.8rem; border: 1px solid color-mix(in srgb, var(--app-warn) 45%, var(--app-border)); border-radius: var(--app-radius); background: color-mix(in srgb, var(--app-warn) 8%, transparent); color: var(--app-muted); font-size: 0.72rem; }
  .deployment-problems p { margin: 0; }
  .deployment-problems strong { color: var(--app-text-strong); }
  .deployment-problems ul { margin: 0.45rem 0 0; padding-left: 1.05rem; }
  .configuration-ok { margin: 0.75rem 0 0; color: var(--app-ok); font-size: 0.72rem; }
  .configuration-ok span { margin-right: 0.35rem; }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  button:focus-visible,
  a:focus-visible { outline: 3px solid color-mix(in srgb, var(--app-accent) 48%, transparent); outline-offset: 2px; }

  @media (max-width: 980px) {
    .settings-hero { grid-template-columns: 1fr; gap: 1rem; }
    .persistence-card { max-width: 34rem; }
    .current-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .current-item:nth-child(2) { border-right: 0; }
    .current-item:nth-child(-n + 2) { border-bottom: 1px solid var(--app-border-subtle); }
    .settings-layout { grid-template-columns: 1fr; }
    .settings-nav-wrap { position: sticky; top: var(--app-header-height, 56px); z-index: 20; margin-inline: -0.25rem; overflow-x: auto; }
    .settings-nav { display: flex; width: max-content; min-width: 100%; gap: 0.25rem; padding: 0.45rem; border-radius: 0 0 calc(var(--app-radius) + 4px) calc(var(--app-radius) + 4px); box-shadow: 0 0.5rem 1rem color-mix(in srgb, var(--app-bg) 65%, transparent); }
    .settings-nav p { display: none; }
    .settings-nav a { grid-template-columns: auto auto; white-space: nowrap; }
    .local-note { display: none; }
  }

  @media (max-width: 700px) {
    .settings-page { padding-inline: 0.8rem; }
    .current-strip { grid-template-columns: 1fr; }
    .current-item { border-right: 0; border-bottom: 1px solid var(--app-border-subtle); }
    .current-item:last-child { border-bottom: 0; }
    .skin-grid,
    .engine-grid,
    .visual-grid,
    .scope-grid,
    .instance-grid { grid-template-columns: 1fr; }
    .capability-title { display: block; }
    .capability-title small { display: block; margin-top: 0.2rem; }
    .capability-grid { grid-template-columns: 1fr; }
    .safety-facts { grid-template-columns: 1fr; }
    .data-counts { grid-template-columns: repeat(2, 1fr); }
    .section-head { grid-template-columns: 1fr; gap: 0.25rem; }
    .section-number { display: none; }
    .section-foot { align-items: flex-start; flex-direction: column; }
    .visual-card { grid-template-columns: 2.4rem minmax(0, 1fr); }
    .visual-card .choice-mark { grid-column: 2; justify-self: start; }
  }

  @media (prefers-reduced-motion: reduce) {
    :global(html) { scroll-behavior: auto; }
    .skin-card,
    .engine-card,
    .visual-card { transition: none; }
    .skin-card:hover,
    .engine-card:hover:not(.unavailable),
    .visual-card:hover { transform: none; }
  }
</style>
