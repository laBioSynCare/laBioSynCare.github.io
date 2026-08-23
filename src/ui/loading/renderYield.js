// Handing the main thread back to the browser, on purpose.
//
// `await` does not do this. Awaiting a promise drains the microtask queue and
// returns on the *same* task, so a fully `async` pipeline can still hold the
// main thread for ten seconds without the browser painting once — which is
// exactly how the graph loader came to sit frozen mid-spin while the ontology
// was being projected and laid out.
//
// These are wall-clock scheduling primitives (`setTimeout`, `rAF`) used for
// loading UI. They have no relationship to the stimulation engine's timing
// authority (CLAUDE.md §3.1), which governs audio-visual synchronization only.

/**
 * Give up the current task so queued rendering work can run, then continue.
 *
 * Cheap: no frame is forced. Use between many small steps, where the point is
 * that the browser *may* paint, not that it must.
 *
 * `scheduler.yield()` (Chrome 129+) is preferred because it resumes at the
 * front of the queue — a `setTimeout` yield goes to the back and lets unrelated
 * work overtake the load.
 */
export function yieldToScheduler() {
  if (typeof globalThis.scheduler?.yield === 'function') return globalThis.scheduler.yield()
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Continue only after the browser has actually painted a frame.
 *
 * The rAF callback runs *before* the paint; a task scheduled from inside it
 * runs after. Use this immediately before a long synchronous block, so the
 * label describing that block is on screen before the thread locks up.
 */
export function yieldToPaint() {
  if (typeof requestAnimationFrame !== 'function') return yieldToScheduler()
  return new Promise((resolve) => {
    requestAnimationFrame(() => setTimeout(resolve, 0))
  })
}
